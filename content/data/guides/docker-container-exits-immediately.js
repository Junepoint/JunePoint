module.exports = {
  slug: 'docker-container-exits-immediately',
  title: 'Docker Container Exits Immediately: Causes and Fixes',
  h1: 'Why your Docker container exits immediately',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Trace a container that stops immediately by checking its logs, exit code, foreground process, image contents and memory limit.',
  standfirst:
    'A container stops when its main process stops. Start with that process’s logs and exit status, then inspect the runtime or image only when the evidence points there.',
  keywords: [
    'docker container exits immediately',
    'docker exited with code 0',
    'container keeps restarting',
    'docker exit code 137',
    'docker debug container',
  ],
  published: '2026-02-12',
  updated: '2026-08-13',
  author: 'jackson',
  cardDesc: 'Use logs and exit codes to find why a container stopped, then inspect the image without keeping a failed service artificially alive.',

  blocks: [
    {
      t: 'note',
      kind: 'info',
      title: 'Start with PID 1',
      x: 'A container runs for as long as **PID 1** runs. When that process exits, the container stops, whether the process completed successfully, crashed or forked into the background. Unlike a virtual machine, a container has no separate system process keeping it alive.',
    },

    { t: 'h2', x: 'Start here: what did it say and how did it end?' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Logs remain available after the process exits. Read them first.
docker logs <container>

# Every container, including the dead ones, with its exit code
docker ps -a

# The exit code on its own
docker inspect <container> --format '{{.State.ExitCode}} {{.State.Error}}'

# Follow a restart loop as it happens
docker logs -f --tail 50 <container>`,
    },
    {
      t: 'p',
      x: '`docker logs` often gives you the cause directly: a stack trace, a missing environment variable or a refused database connection. Read the most recent output before changing the image or command.',
    },

    { t: 'h2', x: 'What the exit code tells you' },
    {
      t: 'table',
      head: ['Code', 'Meaning', 'Usual cause'],
      rows: [
        ['`0`', 'Completed successfully', 'The process finished; it may not have been a long-running command'],
        ['`1`', 'Generic application error', 'An unhandled exception. Check the logs.'],
        ['`125`', 'The Docker daemon itself failed', 'A malformed `docker run` command or invalid flag'],
        ['`126`', 'Command found but not executable', 'Missing `+x`, or a script with CRLF line endings'],
        ['`127`', 'Command not found', 'Typo, missing binary, or no shell in the image'],
        ['`137`', 'SIGKILL (128 + 9)', '**Out of memory**, or a `docker stop` that timed out'],
        ['`139`', 'SIGSEGV (128 + 11)', 'Segfault, sometimes caused by an architecture mismatch'],
        ['`143`', 'SIGTERM (128 + 15)', 'A clean stop request; normal for `docker stop`'],
      ],
    },
    {
      t: 'p',
      x: 'For these exit statuses, subtract 128 to identify the signal number. Codes 137 and 143 are the ones you are most likely to encounter in routine container work.',
    },

    { t: 'h2', x: 'Cause 1: exit code 0 means the process finished' },
    {
      t: 'p',
      x: 'Exit code 0 can look suspicious when you expected a service, but it means the command completed normally. `docker run ubuntu` starts Bash without a terminal or command to process, so Bash exits and the container follows.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `docker run ubuntu             # exits at once because Bash has nothing to do\ndocker run -it ubuntu bash    # stays up because -it gives Bash a terminal`,
    },
    {
      t: 'p',
      x: '`-i` keeps standard input open and `-t` allocates a pseudo-terminal. Together they give an interactive shell something to wait for.',
    },

    { t: 'h2', x: 'Cause 2: the process daemonised itself' },
    {
      t: 'p',
      x: 'Some services still daemonize by default. If PID 1 starts the service and then exits while the service moves into the background, Docker considers the container finished.',
    },
    {
      t: 'code',
      lang: 'dockerfile',
      x: `# ✗ nginx forks to the background, PID 1 exits, container stops
CMD ["nginx"]

# ✓ stay in the foreground
CMD ["nginx", "-g", "daemon off;"]`,
    },
    {
      t: 'table',
      head: ['Service', 'Foreground flag'],
      rows: [
        ['nginx', '`nginx -g "daemon off;"`'],
        ['Apache', '`httpd-foreground` or `apachectl -DFOREGROUND`'],
        ['PostgreSQL', '`postgres` (not `pg_ctl start`)'],
        ['Redis', '`redis-server --daemonize no`'],
        ['systemd services', 'Run the service binary directly instead of starting systemd'],
      ],
    },

    { t: 'h2', x: 'Cause 3: exit 127 means the command was not found' },
    {
      t: 'p',
      x: 'Check the command path first, then consider the image’s shell, the script’s line endings and the image architecture.',
    },
    { t: 'h3', x: 'There is no shell in the image' },
    {
      t: 'p',
      x: 'Distroless and `scratch` images have no `/bin/sh`; some other minimal images may omit the shell you expect. Shell-form `CMD` runs through `/bin/sh -c "…"`, so it cannot work in an image without that binary:',
    },
    {
      t: 'code',
      lang: 'dockerfile',
      x: `# ✗ Shell form needs /bin/sh, which distroless does not have
CMD npm start

# ✓ Exec form runs the binary directly; no shell is required
CMD ["node", "server.js"]`,
    },
    { t: 'h3', x: 'Windows line endings' },
    {
      t: 'p',
      x: 'When an entrypoint script has CRLF line endings, the kernel can interpret its shebang as a request for `/bin/sh\\r`. That path does not exist, so the resulting error can misleadingly name the shell.',
    },
    {
      t: 'code',
      lang: 'dockerfile',
      x: `# Fix at build time
RUN sed -i 's/\\r$//' /entrypoint.sh && chmod +x /entrypoint.sh`,
    },
    {
      t: 'p',
      x: 'To prevent the mismatch, add `*.sh text eol=lf` to the repository’s `.gitattributes` file.',
    },
    { t: 'h3', x: 'Architecture mismatch' },
    {
      t: 'p',
      x: 'Running an `amd64` image on Apple Silicon, or an ARM image on an amd64 host, can produce `exec format error`, exit 127 or a segfault. Build and run for the intended platform:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `docker build --platform linux/amd64 -t myapp .
docker run --platform linux/amd64 myapp`,
    },

    { t: 'h2', x: 'Cause 4: exit 137 often points to memory pressure' },
    {
      t: 'p',
      x: 'Code 137 means the process received `SIGKILL`. The kernel’s out-of-memory killer is a common source, but a timed-out `docker stop` can produce the same code. Check the recorded OOM state:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `docker inspect <container> --format '{{.State.OOMKilled}}'
# true  → memory limit exceeded

docker stats --no-stream`,
    },
    {
      t: 'ul',
      items: [
        'Raise the container limit with `docker run -m 2g` or `mem_limit` in Compose when the workload legitimately needs more memory.',
        'On Docker Desktop, also check the **VM’s** memory setting. A per-container limit cannot exceed the memory available to that VM.',
        'For the JVM, consider `-XX:MaxRAMPercentage=75`. Older JVMs may read host memory instead of the cgroup limit and allocate more than the container can use.',
        'For Node, use `--max-old-space-size` when the JavaScript heap needs an explicit cap below the container limit.',
      ],
    },

    { t: 'h2', x: 'Cause 5: it crashed on a missing dependency' },
    {
      t: 'p',
      x: 'Exit code 1 is application-specific, so let the stack trace lead the investigation. Missing environment variables and dependencies that are still starting are common causes.',
    },
    {
      t: 'p',
      x: 'In Compose, `depends_on` waits for a container to **start**, not for the service inside it to become ready. Gate the dependent service on a health check when startup order matters:',
    },
    {
      t: 'code',
      lang: 'yaml',
      x: `services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  api:
    build: .
    depends_on:
      db:
        condition: service_healthy   # this is the part people miss`,
    },

    { t: 'h2', x: 'Getting a shell inside a container that will not run' },
    {
      t: 'p',
      x: 'If the normal entrypoint exits before you can inspect the filesystem, replace it temporarily with a shell:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Ignore the image's CMD and ENTRYPOINT, get a shell
docker run -it --entrypoint sh <image>

# Inspect the filesystem of a container that already died
docker commit <dead-container> debug-image
docker run -it --entrypoint sh debug-image

# Copy files out of a stopped container
docker cp <container>:/app/config.json ./

# What the image is actually configured to run
docker inspect <image> --format '{{.Config.Entrypoint}} {{.Config.Cmd}}'`,
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Debugging a distroless image',
      x: 'For an image without a shell, use `docker debug` in Docker Desktop or attach a debug container to the target’s namespaces: `docker run -it --pid container:<id> --network container:<id> nicolaka/netshoot`. The added container supplies tools while sharing the target’s process and network view.',
    },

    { t: 'h2', x: 'Why `tail -f /dev/null` is not an application fix' },
    {
      t: 'p',
      x: '`tail -f /dev/null` keeps PID 1 running, but it does not repair the service that exited. For an application container, this hides a visible failure behind a container that appears healthy at a glance.',
    },
    {
      t: 'p',
      x: 'It can be useful in a temporary debugging container or a sidecar designed without its own long-running process. An application container should instead run the application as PID 1 and expose its failure.',
    },

    { t: 'h2', x: 'Signals, and why PID 1 is special' },
    {
      t: 'p',
      x: 'PID 1 has special responsibilities on Linux, including reaping orphaned child processes, and default signal handling differs from that of other processes. A shell wrapper that does not forward `SIGTERM` makes `docker stop` wait for its timeout and then send `SIGKILL`, producing exit code 137 instead of a clean shutdown.',
    },
    {
      t: 'code',
      lang: 'dockerfile',
      x: `# ✗ Shell form wraps the command in sh -c, which does not forward signals
CMD npm start

# ✓ Exec form makes your process PID 1 and lets it receive SIGTERM
CMD ["node", "server.js"]

# For anything that spawns children, add a proper init to reap zombies
# (or run with: docker run --init)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]`,
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does my container exit with code 0 when nothing went wrong?',
          a: 'Code 0 means the main process finished successfully. The command may have been short-lived, such as a shell without a TTY, or a service may have forked into the background. A long-running container needs its service to remain in the foreground as PID 1.',
        },
        {
          q: 'What does exit code 137 mean?',
          a: '128 + 9, meaning SIGKILL. Usually the out-of-memory killer: check docker inspect --format "{{.State.OOMKilled}}". It also appears when docker stop times out after SIGTERM and escalates to SIGKILL, which points at a process that is not handling signals.',
        },
        {
          q: 'How do I see logs from a container that already exited?',
          a: 'docker logs works for stopped containers because their logs remain after the process exits. Use docker ps -a to find the container ID. Avoid --rm while debugging, since removing the container also removes access to those logs.',
        },
        {
          q: 'Why does docker run -it ubuntu bash work but docker run ubuntu does not?',
          a: 'The -i flag keeps standard input open, and -t allocates a pseudo-terminal. Without them, Bash has no terminal or input to wait for, so it exits and the container stops.',
        },
        {
          q: 'Is tail -f /dev/null an acceptable fix?',
          a: 'It can be appropriate for a temporary debugging container or a sidecar designed without its own long-running process. In an application container, it keeps the container running while the service remains unavailable, which can mislead checks that look only at container state.',
        },
        {
          q: 'Why does my container work locally but not in CI?',
          a: 'Compare the host architectures first. An image built on Apple Silicon may not run on an amd64 CI worker, and the reverse is also possible. Set --platform explicitly or publish a multi-architecture image with docker buildx.',
        },
      ],
    },
  ],

  related: ['/tools/cron-expression-generator/', '/guides/postgres-connection-refused/', '/tools/cloud-cost-calculator/'],
};
