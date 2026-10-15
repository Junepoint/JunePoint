module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is Busy",
  "h1": "Port already in use: who is holding it, and why",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something is already listening. Find the owning process on macOS, Linux or Windows, free the port safely, and stop it coming back.",
  "standfirst": "A busy port is held by a living process, not by a ghost. Here is how to identify it on each platform, end it cleanly, and understand the handful of real reasons a crashed server leaves its port bound.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Find the process holding your port, free it without killing the wrong thing, and see why a crash leaves it bound.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` almost always means a process is listening on that port *right now*. Identify it before you reach for a kill command.",
        "One lookup per platform: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `ss -ltnp 'sport = :3000'` on Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "The popular `TIME_WAIT` explanation is usually wrong for a server that is starting up. Node, Go and most frameworks set `SO_REUSEADDR`, which lets a fresh listener bind past sockets left over from closed connections.",
        "After a crash, the usual culprit is an orphaned child process that inherited the listening socket from its dead parent.",
        "Kill by PID, not by name. `killall node` takes out language servers, build watchers and anything else you were in the middle of.",
        "Prevention is two small handlers: one for `SIGTERM` that closes the server, one for `error` that prints the port and the lookup command."
      ]
    },
    {
      "t": "h2",
      "x": "Read the address in the error first"
    },
    {
      "t": "p",
      "x": "The error names the exact socket that could not be bound, and that string narrows the problem before you run anything. Node is the most explicit about it:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n\n# Node, bound to one interface\nError: listen EADDRINUSE: address already in use 127.0.0.1:8080\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use"
    },
    {
      "t": "p",
      "x": "`:::3000` is shorthand for the IPv6 wildcard address, `[::]:3000`. `0.0.0.0:3000` is the IPv4 wildcard. `127.0.0.1:3000` is loopback only. The distinction matters more than it looks: two processes can happily bind the same port on *different* interfaces, so a service on `127.0.0.1:5432` does not conflict with one on `192.168.1.10:5432`. A process on the IPv6 wildcard usually does block an IPv4 bind on the same port, because most Linux systems map IPv4 traffic onto the IPv6 wildcard socket. Check that with `sysctl net.ipv6.bindv6only` if two services you expected to coexist refuse to."
    },
    {
      "t": "table",
      "head": [
        "What you see",
        "What it means",
        "Where to look"
      ],
      "rows": [
        [
          "`EADDRINUSE :::3000`",
          "Another socket holds the IPv6 wildcard on 3000",
          "Any listener on the port, on any interface"
        ],
        [
          "`EADDRINUSE 127.0.0.1:3000`",
          "Something holds loopback specifically",
          "A tunnel, a proxy, or a second copy of the same app"
        ],
        [
          "`EACCES` on a low port",
          "Not a conflict at all: port under 1024 without privileges",
          "Use a port above 1024, or grant `CAP_NET_BIND_SERVICE`"
        ],
        [
          "`port is already allocated` (Docker)",
          "The daemon already has a publish mapping for that port",
          "`docker ps --filter publish=3000`"
        ],
        [
          "Windows socket error `10048`",
          "`WSAEADDRINUSE`, the native equivalent",
          "Listeners, plus OS-reserved port ranges"
        ]
      ],
      "caption": "Not every bind failure is a conflict. EACCES in particular sends people hunting for a process that was never there."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "Ask the kernel which process holds a *listening* socket on that port. The listening filter is the part people skip, and skipping it is how the wrong process gets killed."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS, and Linux where lsof is installed: listeners only\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof required\nss -ltnp 'sport = :3000'\n\n# Older Linux without ss\nnetstat -ltnp | grep ':3000'\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 1234\""
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Why `lsof -t -i:3000 | xargs kill -9` bites",
      "x": "`lsof -i :3000` matches every socket involving port 3000, not just the listener. That includes the browser tab, the `curl` you ran a second ago, and an unrelated process whose *outbound* connection happened to be assigned port 3000 as its ephemeral source port. Piping that list straight into `kill -9` can terminate processes you care about. Add `-sTCP:LISTEN` so you only get the owner."
    },
    {
      "t": "p",
      "x": "Once you have a PID, spend ten seconds on identification. The parent process ID tells you whether you found a stray child, a container shim or a service manager that will simply restart it:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is this, when did it start, and who started it?\nps -o pid,ppid,user,lstart,command -p 48213\n\n# See the surrounding tree\npstree -ap 48213          # Linux\nps -ef | grep -i node     # anywhere\n\n# Linux: what the process has open, and its working directory\nls -l /proc/48213/cwd\nls -l /proc/48213/fd | grep socket"
    },
    {
      "t": "h2",
      "x": "End it: SIGTERM first, SIGKILL if it ignores you"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask it to shut down (SIGTERM)\nkill 48213\n\n# Confirm it actually went\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Still listening? Force it.\nkill -9 48213\n\n# Linux shortcut: signal whatever holds the TCP port\nfuser -k -n tcp 3000\n\n# Windows\ntaskkill /PID 1234 /F"
    },
    {
      "t": "p",
      "x": "Start with the polite signal. A plain `kill` gives the app a chance to finish in-flight requests, flush logs and release advisory locks, which is worth the extra second on anything touching a database or a lockfile. If it does not exit, `kill -9` will work and the port will be free immediately afterwards, because the kernel closes the process's file descriptors whether the process cooperated or not. The cost of `-9` is not a stuck port. It is whatever the process had not yet written to disk."
    },
    {
      "t": "p",
      "x": "`npx kill-port 3000` and similar helpers do the same lookup for you. They are convenient in a scripted `predev` step, and they are the wrong tool when you do not yet know what is on the port, because they skip the identification step entirely."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is where most of the folklore lives. The honest summary: in the overwhelming majority of cases, something is still running. Here are the real causes, roughly in order of how often they show up in local development."
    },
    {
      "t": "h3",
      "x": "An orphaned child inherited the listening socket"
    },
    {
      "t": "p",
      "x": "When a process forks, the child inherits the parent's open file descriptors, including the listening socket. If your dev server crashed or you closed the terminal, the parent may be gone while a child or grandchild lives on, still holding that descriptor. The socket stays bound as long as *any* process holds it. This is the common pattern behind `nodemon`, `concurrently`, `tsx watch`, cluster-mode workers, `pm2` and spawned subprocesses: the thing you killed was the supervisor, not the listener. `ps -o pid,ppid` on the PID you found will show a `ppid` of `1` and give it away."
    },
    {
      "t": "h3",
      "x": "A watcher restarted before the old process finished exiting"
    },
    {
      "t": "p",
      "x": "File watchers can send a restart while the previous instance is still draining keep-alive connections. The new instance tries to bind, loses the race and exits with `EADDRINUSE`, sometimes leaving the old one running happily. A short restart delay fixes it, and a real shutdown handler fixes it better. `nodemon --delay 500ms` is the blunt version."
    },
    {
      "t": "h3",
      "x": "The process is not dead, it is stuck"
    },
    {
      "t": "p",
      "x": "A process paused at a debugger breakpoint, blocked on a hung network call, or stopped with Ctrl-Z is still holding its sockets. Ctrl-Z in particular surprises people: it suspends the job rather than ending it. Run `jobs` in the shell you used, then `fg` and interrupt properly, or `kill %1`."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is usually not your problem"
    },
    {
      "t": "p",
      "x": "The most repeated answer online is that the port is in `TIME_WAIT` and you must wait a minute or two. For a server that is trying to listen, that is normally wrong. `TIME_WAIT` applies to *connection* sockets that have been closed, not to the listening socket, and listeners in Node, Go, Python's `socketserver` with `allow_reuse_address`, and most other stacks are created with `SO_REUSEADDR`, which exists precisely so a restart can bind past those leftovers. If `ss -tan 'sport = :3000'` shows nothing in `LISTEN` state, you have a different problem. If it shows a `LISTEN` line, waiting will not help you, because the owner is alive."
    },
    {
      "t": "p",
      "x": "Two genuine exceptions are worth knowing. Raw socket code that never sets `SO_REUSEADDR` can be blocked by lingering state. And Windows handles address reuse differently from Unix, so behaviour there is not a reliable guide to behaviour on Linux or the reverse."
    },
    {
      "t": "h3",
      "x": "Docker is holding the publish mapping"
    },
    {
      "t": "p",
      "x": "A published port belongs to the daemon's proxy, so a host-side `lsof` may point at `docker-proxy` or at nothing obvious. The message differs by version, with older builds saying `Bind for 0.0.0.0:3000 failed: port is already allocated` and newer ones reporting `Ports are not available` followed by the underlying bind error. Either way, start from the container list rather than the process list:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "docker ps --filter publish=3000\ndocker port my-api\n\n# Stop the container that owns the mapping\ndocker rm -f my-api\n\n# Compose: clear containers left behind by a renamed service\ndocker compose down --remove-orphans"
    },
    {
      "t": "p",
      "x": "If no container exists and the daemon still claims the port, the mapping has leaked, which happens after the daemon or the VM is hard-killed. Restarting Docker releases it. Our [guide to containers that exit immediately](/guides/docker-container-exits-immediately/) covers the opposite failure, where the container never stays up long enough to hold anything."
    },
    {
      "t": "h3",
      "x": "The operating system reserved the port"
    },
    {
      "t": "p",
      "x": "Sometimes nothing is listening and the bind still fails, because the port sits inside a reserved range. On Windows, Hyper-V and WSL2 reserve blocks of ports for dynamic use, and a bind inside one of those blocks fails with no visible owner. On macOS, AirPlay Receiver has occupied ports 5000 and 7000 since Monterey, which is why a Flask app on its default port suddenly stopped working for Mac users. That behaviour still applied as of October 2026; check your own System Settings rather than taking the date on trust."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows: ranges the OS has reserved (nothing will bind inside these)\nnetsh int ipv4 show excludedportrange protocol=tcp\n\n# What the dynamic range is set to\nnetsh int ipv4 show dynamicport tcp"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "macOS port 5000",
      "x": "Turn off AirPlay Receiver in System Settings under General, then AirDrop & Handoff, or move your app to a port like 5001. Moving the app is the better habit: a port you chose is a port no OS update will take back."
    },
    {
      "t": "h2",
      "x": "Make the next crash cheap"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Close the server on SIGTERM and SIGINT",
          "x": "Without a handler, Ctrl-C kills the process immediately and any child it spawned keeps the socket. Close the server, drop idle keep-alive connections, and keep a timeout so a wedged request cannot block shutdown forever. `closeAllConnections()` is available in Node 18.2 and later, so check `node -v` before depending on it.",
          "code": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nconst shutdown = (signal) => () => {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n  server.closeAllConnections?.();          // Node 18.2+\n  setTimeout(() => process.exit(1), 5000).unref();\n};\n\nprocess.on('SIGTERM', shutdown('SIGTERM'));\nprocess.on('SIGINT', shutdown('SIGINT'));"
        },
        {
          "title": "Turn the error into an instruction",
          "x": "A stack trace tells you less than a one-line message naming the port and the command that finds its owner. This is the single highest-value change in the list, because it removes the lookup step from every future occurrence.",
          "code": "server.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${port} is in use. Find the owner with:\\n` +\n      `  lsof -nP -iTCP:${port} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});"
        },
        {
          "title": "Let tests pick their own port",
          "x": "Binding port 0 asks the kernel for any free port, which removes conflicts between parallel test workers and between a test run and your running dev server. Read the real port back from the server after it starts.",
          "code": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on ${port}`);\n});"
        },
        {
          "title": "Give each service a fixed, documented port",
          "x": "Keep the assignments in one place, in `.env.example` or the README, and keep them out of the OS dynamic range and away from 5000 and 7000. Two services defaulting to 3000 is a conflict you can delete permanently instead of resolving weekly."
        },
        {
          "title": "Kill the tree, not the leaf",
          "x": "In scripts, signal the whole process group so children go with the parent. In Node, `spawn(cmd, args, { detached: true })` puts the child in its own group, and `process.kill(-child.pid, 'SIGTERM')` then signals every member of it.",
          "code": "# Shell: signal the process group (note the minus sign)\nkill -TERM -48213\n\n# Node: start detached, then signal the group\nconst child = spawn('node', ['server.js'], { detached: true });\nprocess.kill(-child.pid, 'SIGTERM');"
        }
      ]
    },
    {
      "t": "p",
      "x": "One trade-off to name honestly: `SO_REUSEPORT` on Linux lets several processes bind the same port deliberately, which is how some load-balanced setups work. It also means a stale instance and a new one can both be listening, with the kernel splitting traffic between them. If you enable it, you have traded a loud `EADDRINUSE` for a quiet bug where half your requests go to yesterday's code. That is a worse failure, so enable it only where you actually want the behaviour."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Postgres connection refused",
          "desc": "The mirror image of this problem: nothing is listening where you expected a service.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes and logs for a container that never stays up long enough to hold a port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node cannot find module",
          "desc": "The other startup failure that stops a dev server before it listens.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "Find the listener, then signal that PID. On macOS or Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, `kill <pid>` to ask it to stop, `kill -9 <pid>` only if it ignores you. On Linux, `fuser -k -n tcp 3000` does both steps at once. On Windows, `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`. Avoid `killall node`, which also kills editor language servers and build watchers."
        },
        {
          "q": "Why is port 3000 still in use after I stopped the server?",
          "a": "Usually because you stopped the supervisor rather than the listener. Watchers like nodemon, tools like concurrently, and cluster or pm2 workers run the server in a child process that inherited the listening socket, and that child survives its parent. Look up the PID holding the port and check its parent with `ps -o pid,ppid,command -p <pid>`. A parent of 1 means it was orphaned."
        },
        {
          "q": "Is EADDRINUSE caused by TIME_WAIT?",
          "a": "Rarely, despite how often that answer is given. TIME_WAIT applies to closed connection sockets, and listeners in Node, Go and most frameworks are created with SO_REUSEADDR so they can bind past those leftovers. Run `ss -ltnp 'sport = :3000'`: if a LISTEN line comes back, a live process owns the port and waiting will not help. If nothing is listening and the bind still fails, check OS-reserved port ranges instead."
        },
        {
          "q": "Why can't I use port 5000 on macOS?",
          "a": "AirPlay Receiver binds ports 5000 and 7000 on recent macOS versions, which broke a lot of Flask tutorials. Disable it in System Settings under General, then AirDrop & Handoff, or move your app to another port. Moving the app is more durable. Verify the current behaviour on your own machine, since Apple has changed these defaults between releases."
        },
        {
          "q": "How do I fix 'port is already allocated' in Docker?",
          "a": "That message comes from the daemon's port mapping, not from a normal host process, so start with `docker ps --filter publish=3000` and remove the container that owns it. `docker compose down --remove-orphans` clears containers left behind by renamed services. If no container claims the port and the daemon still refuses, the mapping leaked after a hard shutdown and restarting Docker releases it."
        },
        {
          "q": "Is it safe to run kill -9 on the PID holding my port?",
          "a": "Safe for the port, not always safe for your data. SIGKILL cannot be caught, so the process gets no chance to flush buffers, commit a transaction or release a lockfile. The kernel closes its descriptors either way, so the port frees immediately. Send a plain `kill` first and give it a second. The real hazard is killing the wrong PID, which is what happens when a list from `lsof -i :3000` without `-sTCP:LISTEN` includes clients as well as the server."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-15",
  "updated": "2026-10-15",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
