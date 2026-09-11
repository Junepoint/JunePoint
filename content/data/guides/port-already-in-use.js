module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find the Process Holding Your Port",
  "h1": "Port already in use: finding and killing the process",
  "eyebrow": "Troubleshooting",
  "description": "Identify which process holds a TCP port on macOS, Linux and Windows, kill it safely, and understand why the port stays busy after a crash.",
  "standfirst": "One command tells you who owns the port. The harder question is why the port survived the process you thought you killed, and this answers that too.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Find the process holding a port, kill it without skipping cleanup, and fix the crash pattern that keeps leaving it bound.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Find it first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `ss -ltnp 'sport = :3000'` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` before `SIGKILL`. `kill -9` skips every shutdown handler your app has.",
        "After a crash, the listener is usually a surviving child process that inherited the socket, not the parent you watched die.",
        "`TIME_WAIT` rarely blocks a Node server, because libuv sets `SO_REUSEADDR` on the listening socket for you.",
        "Changing `net.ipv4.tcp_fin_timeout` does not shorten `TIME_WAIT`. That advice is everywhere and it is wrong.",
        "Ports below 1024 fail with `EACCES`, not `EADDRINUSE`. That is a permissions problem, not a conflict."
      ]
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` means the kernel refused your `bind()` call because another socket already holds that address and port combination. Node surfaces it as `Error: listen EADDRINUSE: address already in use :::3000`. Python raises `OSError: [Errno 98] Address already in use`. Go returns `listen tcp :3000: bind: address already in use`. Same syscall, same refusal, different wrapper."
    },
    {
      "t": "p",
      "x": "The useful detail is the address half, which people skip. A socket bound to `127.0.0.1:3000` and a socket bound to `0.0.0.0:3000` are in conflict, because the wildcard address covers the loopback one. But `127.0.0.1:3000` and `192.168.1.10:3000` can coexist happily. If your server binds the wildcard by default and something small is squatting on loopback, the error looks inexplicable until you read which address each side asked for."
    },
    {
      "t": "h2",
      "x": "Step one: find the listener"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: only sockets in the LISTEN state\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, usually faster and always available on modern distros\nss -ltnp 'sport = :3000'\n\n# If the process belongs to another user, you need root to see its name\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Just the PID, for scripting\nlsof -t -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Plain `lsof -i :3000` also returns every established connection to that port, so on a running dev server you get your own browser, your editor's preview pane and a couple of stray curl processes mixed in with the actual listener. People then pipe that into `kill -9` and wonder why Chrome died."
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Find the owner",
        "End it"
      ],
      "rows": [
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`kill <pid>`"
        ],
        [
          "Linux",
          "`ss -ltnp 'sport = :3000'`",
          "`kill <pid>` or `fuser -k -TERM 3000/tcp`"
        ],
        [
          "Windows (cmd)",
          "`netstat -ano | findstr :3000`",
          "`taskkill /PID <pid>`"
        ],
        [
          "Windows (PowerShell)",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Any, via npm",
          "`npx kill-port 3000`",
          "Included; sends SIGKILL"
        ]
      ],
      "caption": "Port 3000 used as the example. The PowerShell command exposes the PID as OwningProcess."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Read the name before you kill the PID",
      "x": "Two seconds of looking at the command name saves you from killing `postgres`, `docker-proxy` or a system daemon. On Linux, `ps -p <pid> -o pid,ppid,user,cmd` gives you the full command line and the parent PID, and the parent PID is often the more interesting number."
    },
    {
      "t": "h2",
      "x": "Step two: kill it without making things worse"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Polite: SIGTERM. The process runs its shutdown handlers.\nkill $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Check whether it actually went away\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Only if it ignored SIGTERM: SIGKILL, which it cannot catch\nkill -9 $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Kill the whole process group instead of one process\n# (negative PID means group; use the process group leader's PID)\nkill -TERM -<pgid>"
    },
    {
      "t": "p",
      "x": "Default `kill` sends `SIGTERM`, which a well-written server catches so it can finish in-flight requests, flush logs, close database pools and remove its PID file. `SIGKILL` is delivered by the kernel and the process never gets a chance to respond. Use it when `SIGTERM` has visibly failed, not as your opener."
    },
    {
      "t": "p",
      "x": "There is a specific cost to reaching for `-9` habitually in development. A process killed with `SIGKILL` leaves behind whatever it had open: a lock file that makes the next start fail for a completely different reason, a partially written build artifact, a database migration recorded as started and never finished. You then spend twenty minutes debugging the cleanup you prevented."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "fuser -k is SIGKILL by default",
      "x": "`fuser -k 3000/tcp` sends `SIGKILL`, not `SIGTERM`. If you want the graceful version, write `fuser -k -TERM 3000/tcp`. The same applies to `npx kill-port`, which terminates forcefully on purpose."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that feels supernatural. Your server crashed, the stack trace printed, the shell prompt came back, and the port is still occupied. Nothing paranormal is happening. Something is still alive, and there are four ordinary candidates."
    },
    {
      "t": "h3",
      "x": "A child process inherited the listening socket"
    },
    {
      "t": "p",
      "x": "File descriptors survive `fork()`. If your process spawned a worker, a `cluster` child, a bundler, a test runner or a shell script, that child holds a copy of the listening socket's descriptor. The kernel keeps the port bound until every descriptor referring to it is closed. The parent dying does not close the child's copy."
    },
    {
      "t": "p",
      "x": "This is exactly what `nodemon`, `concurrently`, `tsx watch` and various `npm run dev` wrappers set up: a supervisor process and a child that does the actual listening. Kill the supervisor and the child is reparented to `init` or `systemd` and carries on serving traffic to a port your new process wants. Check the parent PID column. If the PPID is 1, you are looking at an orphan."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Show the process tree around the listener\nps -o pid,ppid,pgid,user,cmd -p $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Wider view, Linux\npstree -ps $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Find every orphaned node process, then read before acting\nps -eo pid,ppid,etime,cmd | grep -E '[n]ode' | awk '$2 == 1'"
    },
    {
      "t": "h3",
      "x": "The process was never in the foreground"
    },
    {
      "t": "p",
      "x": "`Ctrl+C` sends `SIGINT` to the foreground process group of your terminal. A process you started with a trailing `&`, or backgrounded with `Ctrl+Z` and `bg`, or launched from an editor's run panel, is not in that group. It never sees the signal. Closing the terminal window normally sends `SIGHUP` to its jobs, but a process started under `nohup`, `disown`, `setsid`, `tmux` or a systemd user unit is immune to that too. All of these are reasonable things to do. They just mean your habitual stop gesture does nothing."
    },
    {
      "t": "h3",
      "x": "Docker published the port, not your app"
    },
    {
      "t": "p",
      "x": "A container started with `-p 3000:3000` keeps that host port bound for as long as the container is running, and a container with a restart policy comes back after you kill whatever you found. On Linux you may see `docker-proxy` as the owner, or nothing at all when Docker is routing through iptables rather than the userland proxy. Do not kill `docker-proxy` directly. Stop the container."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container published this host port?\ndocker ps --filter publish=3000\n\n# Including stopped containers that may restart\ndocker ps -a --filter publish=3000\n\n# Stop it properly\ndocker stop <container>\n\n# Compose projects often leave containers behind after a crash\ndocker compose ps\ndocker compose down"
    },
    {
      "t": "h3",
      "x": "Something else owns that port entirely"
    },
    {
      "t": "p",
      "x": "Port 5000 is the classic. On macOS Monterey and later, the AirPlay Receiver service listens on 5000 and 7000, which broke a generation of Flask tutorials. You can turn it off under General, then AirDrop and Handoff in System Settings, though Apple has moved that toggle between releases, so verify the location on your own version rather than trusting a screenshot from 2022. On Windows, Hyper-V and WSL2 reserve blocks of dynamic ports at boot, and a port inside a reserved range fails to bind even when nothing is listening on it."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows: reserved ranges that will refuse your bind\nnetsh interface ipv4 show excludedportrange protocol=tcp\n\n# Confirm nothing is actually listening\nGet-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess"
    },
    {
      "t": "h2",
      "x": "TIME_WAIT, SO_REUSEADDR, and the advice that does not work"
    },
    {
      "t": "p",
      "x": "When a TCP connection closes, the side that closed first holds the socket in `TIME_WAIT` for twice the maximum segment lifetime, so that delayed packets from the old connection cannot be mistaken for part of a new one with the same four-tuple. On Linux that duration is a compile-time constant of 60 seconds. It is not tunable through `sysctl`."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Two popular fixes that are not fixes",
      "x": "`net.ipv4.tcp_fin_timeout` controls how long a socket sits in `FIN_WAIT_2`, not `TIME_WAIT`. Setting it changes nothing about your rebind. And `net.ipv4.tcp_tw_recycle`, recommended in countless old blog posts, broke connections from clients behind NAT and was removed from the Linux kernel in 4.12. If you find a runbook that still tells you to enable it, that runbook has been stale since 2017."
    },
    {
      "t": "p",
      "x": "The real answer is `SO_REUSEADDR`, a socket option that lets a new listener bind an address even while old connections linger in `TIME_WAIT`. It does not let you steal a port from a socket that is actively listening, which is the safety property that matters. libuv sets it for you on Unix-like systems, which is why a Node server usually restarts instantly and why `TIME_WAIT` is a red herring in most `EADDRINUSE` reports from Node. Other stacks are less generous. Python's `socketserver` needs `allow_reuse_address = True`, and a raw socket needs the option set explicitly."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind((\"0.0.0.0\", 3000))\ns.listen(128)"
    },
    {
      "t": "p",
      "x": "One tell distinguishes the two situations without any guessing. If `ss -tan 'sport = :3000'` shows sockets in `TIME_WAIT` and no socket in `LISTEN`, waiting a minute will clear it. If there is a `LISTEN` row, no amount of waiting helps, because a live process owns the port."
    },
    {
      "t": "h2",
      "x": "Stop causing it"
    },
    {
      "t": "p",
      "x": "Handle the termination signals and close the server. This takes six lines and removes most of the repeat offences, because a process that shuts down cleanly releases its port and takes its children with it."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(3000);\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n  // Do not wait forever for keep-alive connections\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));\nprocess.on('SIGINT', () => shutdown('SIGINT'));"
    },
    {
      "t": "p",
      "x": "Note the timeout. `server.close()` stops accepting new connections but waits for existing ones to finish, and an open keep-alive connection or a websocket will hold it open indefinitely. Without the fallback, your graceful shutdown is a hang, and you go right back to `kill -9`. Node 18.2 and later can also do this with `server.closeAllConnections()`, which is blunter and faster."
    },
    {
      "t": "p",
      "x": "For tests, stop picking port numbers at all. Binding to port 0 tells the kernel to assign a free ephemeral port, and you read back what you got. Parallel test suites stop colliding with each other and with whatever you left running this morning."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`listening on ${port}`);\n});"
    },
    {
      "t": "ul",
      "items": [
        "Give each project a distinct port and write it in the README. Three services all defaulting to 3000 is a self-inflicted problem.",
        "Prefer `npm run dev` wrappers that forward signals to their children. If yours does not, you will keep orphaning listeners.",
        "In Compose, use `docker compose down` rather than killing containers, so published ports are released along with the network.",
        "If the error appears only in CI, look for a leftover service container or a previous job's process on a shared runner before changing application code."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "On macOS or Linux, run lsof -t -iTCP:3000 -sTCP:LISTEN to get the PID, check what it is with ps -p <pid> -o cmd, then run kill <pid>. On Windows, netstat -ano | findstr :3000 gives the PID in the last column and taskkill /PID <pid> ends it. Only add -9 or /F if the polite version does not work."
        },
        {
          "q": "Why does port 3000 stay in use after I stop the server?",
          "a": "Almost always because a child process inherited the listening socket and is still running. File descriptors survive fork, so the port stays bound until every copy is closed. Check the listener's parent PID: if it is 1, the process was orphaned when its supervisor died. Docker containers with a published port and restart policy are the other common cause."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES?",
          "a": "EADDRINUSE means something else holds that address and port. EACCES means you are not permitted to bind it. On Linux and macOS, ports below 1024 require elevated privileges, so trying to run a dev server on port 80 as a normal user gives you EACCES no matter how free the port is. Use a high port and a reverse proxy instead of running your app as root."
        },
        {
          "q": "Does lsof -i :3000 show everything using the port?",
          "a": "It shows more than you want and sometimes less. It includes established connections to that port, not just the listener, so add -sTCP:LISTEN. It also cannot show processes owned by other users unless you run it with sudo, which is why the command occasionally returns nothing while the port is clearly occupied."
        },
        {
          "q": "How do I fix address already in use with Docker?",
          "a": "Find the container holding the host port with docker ps --filter publish=3000 and stop it with docker stop. Do not kill the docker-proxy process you may see in lsof output, because the daemon manages it and killing it leaves the container in an inconsistent state. If nothing shows up, check docker ps -a for a stopped container with a restart policy."
        },
        {
          "q": "Should I wait for TIME_WAIT to clear?",
          "a": "Only if there is genuinely no listening socket. Run ss -tan 'sport = :3000' and look at the states. TIME_WAIT rows with no LISTEN row clear themselves in about 60 seconds on Linux. A LISTEN row means a live process owns the port and waiting achieves nothing. Node sets SO_REUSEADDR by default on Unix-like systems, so TIME_WAIT is rarely the real cause there."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker Container Exits Immediately",
          "desc": "Exit codes, PID 1 and signal forwarding, which is the other half of the orphaned-process story.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL Connection Refused",
          "desc": "The mirror image of this problem: nothing is listening where you expected something to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "When the dev server fails to start for a reason that has nothing to do with the port.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-11",
  "updated": "2026-09-11",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
