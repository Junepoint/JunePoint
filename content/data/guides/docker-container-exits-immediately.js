module.exports = {
  slug: 'docker-container-exits-immediately',
  title: 'Docker Container Exits Immediately — Every Cause',
  h1: 'Why your Docker container exits immediately',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Why a container starts and stops in under a second: exit codes decoded, foreground processes, missing shells, OOM kills and how to debug it.',
  standfirst:
    'A container lives exactly as long as its main process. Here is how to find out what that process did, read the exit code, and get a shell inside an image that refuses to run.',
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
  cardDesc: 'Exit codes decoded, plus how to get a shell inside an image that will not stay running.',

  blocks: [
    {
      t: 'note',
      kind: 'info',
      title: 'The rule everything follows from',
      x: 'A container runs exactly as long as **PID 1** runs. When that process exits, the container stops — whether it succeeded, crashed or forked itself into the background. A container is not a virtual machine; there is nothing else keeping it alive.',
    },

    { t: 'h2', x: 'Start here: what did it say and how did it end?' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Logs survive the container's death — read them first
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
      x: 'Ninety percent of the time `docker logs` contains the answer in plain text — a stack trace, a missing environment variable, a refused database connection. Read it before changing anything.',
    },

    { t: 'h2', x: 'What the exit code tells you' },
    {
      t: 'table',
      head: ['Code', 'Meaning', 'Usual cause'],
      rows: [
        ['`0`', 'Completed successfully', 'The process genuinely finished — it was never a long-running one'],
        ['`1`', 'Generic application error', 'An unhandled exception. Check the logs.'],
        ['`125`', 'The Docker daemon itself failed', 'A malformed `docker run` command or invalid flag'],
        ['`126`', 'Command found but not executable', 'Missing `+x`, or a script with CRLF line endings'],
        ['`127`', 'Command not found', 'Typo, missing binary, or no shell in the image'],
        ['`137`', 'SIGKILL (128 + 9)', '**Out of memory**, or a `docker stop` that timed out'],
        ['`139`', 'SIGSEGV (128 + 11)', 'Segfault — often an architecture mismatch'],
        ['`143`', 'SIGTERM (128 + 15)', 'A clean stop request; normal for `docker stop`'],
      ],
    },
    {
      t: 'p',
      x: 'Anything above 128 is a signal: subtract 128 to get the signal number. The two you will meet are 137 and 143.',
    },

    { t: 'h2', x: 'Cause 1: exit code 0 — the process simply finished' },
    {
      t: 'p',
      x: 'The most common case, and the most confusing, because nothing failed. `docker run ubuntu` starts bash, bash has no terminal attached and no commands to run, so it exits immediately. The container did its job perfectly.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `docker run ubuntu             # exits at once — bash has nothing to do
docker run -it ubuntu bash    # stays up — -it gives bash a terminal`,
    },
    {
      t: 'p',
      x: '`-i` keeps stdin open and `-t` allocates a pseudo-TTY. Without both, an interactive shell has no reason to wait.',
    },

    { t: 'h2', x: 'Cause 2: the process daemonised itself' },
    {
      t: 'p',
      x: 'The classic mistake. Services that background themselves by default make PID 1 exit instantly, taking the container with it, even though the service started fine.',
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
        ['systemd services', 'Do not use systemd — run the binary directly'],
      ],
    },

    { t: 'h2', x: 'Cause 3: exit 127 — command not found' },
    {
      t: 'p',
      x: 'Three distinct situations produce this, and the third catches almost everyone once.',
    },
    { t: 'h3', x: 'There is no shell in the image' },
    {
      t: 'p',
      x: 'Distroless, `scratch` and Alpine-based minimal images may have no `/bin/sh` at all. Shell-form `CMD` is implicitly `/bin/sh -c "…"`, so it fails immediately:',
    },
    {
      t: 'code',
      lang: 'dockerfile',
      x: `# ✗ Shell form needs /bin/sh, which distroless does not have
CMD npm start

# ✓ Exec form runs the binary directly — no shell required
CMD ["node", "server.js"]`,
    },
    { t: 'h3', x: 'Windows line endings' },
    {
      t: 'p',
      x: 'An entrypoint script saved with CRLF endings makes the kernel look for an interpreter literally named `/bin/sh\\r`, which does not exist. The error names your shell and looks nonsensical.',
    },
    {
      t: 'code',
      lang: 'dockerfile',
      x: `# Fix at build time
RUN sed -i 's/\\r$//' /entrypoint.sh && chmod +x /entrypoint.sh`,
    },
    {
      t: 'p',
      x: 'Better still, prevent it in Git: add `*.sh text eol=lf` to a `.gitattributes` file.',
    },
    { t: 'h3', x: 'Architecture mismatch' },
    {
      t: 'p',
      x: 'An `amd64` image on an Apple Silicon machine — or the reverse — produces `exec format error`, exit 127 or a segfault. Build for the right platform:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `docker build --platform linux/amd64 -t myapp .
docker run --platform linux/amd64 myapp`,
    },

    { t: 'h2', x: 'Cause 4: exit 137 — it ran out of memory' },
    {
      t: 'p',
      x: 'The kernel’s OOM killer terminated the process. The container did not crash; it was executed. Confirm it:',
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
        'Raise the limit: `docker run -m 2g`, or `mem_limit` in Compose.',
        'On Docker Desktop, raise the **VM’s** memory in settings — the per-container limit cannot exceed it.',
        'For the JVM, set `-XX:MaxRAMPercentage=75`. Older JVMs read the host’s memory rather than the cgroup limit and confidently allocate more than the container is allowed.',
        'For Node, `--max-old-space-size` has the same problem and the same fix.',
      ],
    },

    { t: 'h2', x: 'Cause 5: it crashed on a missing dependency' },
    {
      t: 'p',
      x: 'Exit code 1 with a stack trace in the logs. Almost always a missing environment variable, or a database that is not accepting connections yet.',
    },
    {
      t: 'p',
      x: 'In Compose, `depends_on` alone only waits for the container to **start**, not for the service inside it to be ready. Postgres accepts TCP connections seconds before it will answer a query. Use a health check:',
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
      x: 'When the container dies too fast to inspect, override the entrypoint and poke around by hand:',
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
      x: 'With no shell to exec into, use `docker debug` (Docker Desktop) or attach a debug container sharing the target’s namespaces: `docker run -it --pid container:<id> --network container:<id> nicolaka/netshoot`. You get a full toolkit inside the failing container’s process and network namespaces.',
    },

    { t: 'h2', x: 'Stop using `tail -f /dev/null`' },
    {
      t: 'p',
      x: 'It appears in a lot of answers as a way to "keep the container alive". It does — by running a container whose only job is to do nothing, while your actual service is not running at all. It converts a loud failure into a silent one.',
    },
    {
      t: 'p',
      x: 'The only legitimate uses are a sidecar that genuinely has no long-running process, or a temporary debugging container. If your application should be running, make the application PID 1 and fix why it exits.',
    },

    { t: 'h2', x: 'Signals, and why PID 1 is special' },
    {
      t: 'p',
      x: 'PID 1 in Linux has unusual semantics: it does not get default signal handlers, and it is responsible for reaping orphaned child processes. A shell script as PID 1 typically ignores `SIGTERM`, so `docker stop` waits ten seconds and then sends `SIGKILL` — which is why a clean shutdown becomes exit code 137.',
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
          a: 'Because nothing did go wrong — the main process finished. A container lives exactly as long as PID 1. Either the command was short-lived (like a bare shell with no TTY), or the service forked itself into the background. Run the service in the foreground.',
        },
        {
          q: 'What does exit code 137 mean?',
          a: '128 + 9, meaning SIGKILL. Usually the out-of-memory killer: check docker inspect --format "{{.State.OOMKilled}}". It also appears when docker stop times out after SIGTERM and escalates to SIGKILL, which points at a process that is not handling signals.',
        },
        {
          q: 'How do I see logs from a container that already exited?',
          a: 'docker logs works on stopped containers — the logs outlive the process. Use docker ps -a to find the container ID. They only disappear when the container is removed, so avoid --rm while you are still debugging.',
        },
        {
          q: 'Why does docker run -it ubuntu bash work but docker run ubuntu does not?',
          a: 'The -i flag keeps stdin open and -t allocates a pseudo-terminal. Without them, bash starts, finds no terminal and no input, and exits immediately — taking the container with it.',
        },
        {
          q: 'Is tail -f /dev/null an acceptable fix?',
          a: 'Only for a debugging container or a sidecar with genuinely no long-running process. For an application container it hides the real failure: the container stays up while your service is not running, so health checks pass and nothing works.',
        },
        {
          q: 'Why does my container work locally but not in CI?',
          a: 'Most often a CPU architecture difference — an image built on Apple Silicon running on amd64 CI, or the reverse. Build with --platform explicitly, or use docker buildx for a multi-architecture image.',
        },
      ],
    },
  ],

  related: ['/tools/cron-expression-generator/', '/guides/postgres-connection-refused/', '/tools/cloud-cost-calculator/'],
};
