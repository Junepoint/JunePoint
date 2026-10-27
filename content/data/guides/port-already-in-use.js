module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find the Process Holding Your Port",
  "h1": "Port already in use: find it, kill it, stop it recurring",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something already holds the port. Identify the owning process on Linux, macOS and Windows, kill it safely, and stop it coming back.",
  "standfirst": "The error names a port, not a cause. Here is how to find the process that owns it, why a crashed app so often keeps the socket, and what to change so you stop seeing it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the process holding a TCP port, kill it without orphaning its children, and fix the shutdown path that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Nine times out of ten the culprit is an earlier instance of your own app. Get its PID before you touch any config.",
        "One command per platform: `lsof -i:3000` on macOS, `ss -ltnp | grep ':3000'` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` first and `SIGKILL` only if that fails. A `kill -9` aimed at a parent leaves its children alive and still bound, which is exactly why the port is busy after a crash.",
        "If no process owns the port, suspect a published container port, an OS-reserved range, or sockets stuck in `TIME_WAIT`.",
        "For tests, bind to port `0` and read back the port the kernel assigned. The conflict then cannot happen."
      ]
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` is the kernel refusing a `bind()` call because another socket already claims that address and port. It is not a bug in your framework. It is not a cache you need to clear. Something is holding the socket, and the fix is to find out what."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who owns TCP 3000?\nlsof -i:3000            # command, PID, user, IPv4/IPv6, state\nlsof -ti:3000           # PIDs only, suitable for scripting\n\n# Linux without lsof installed\nss -ltnp | grep ':3000'\n# LISTEN 0  511  *:3000  *:*  users:((\"node\",pid=48213,fd=23))\n\n# Ask politely first\nkill 48213\n\n# Still there after a few seconds? Then insist.\nkill -9 48213\n\n# Both steps, and a no-op when the port is already free\nkill $(lsof -ti:3000) 2>/dev/null || echo 'port 3000 is free'"
    },
    {
      "t": "p",
      "x": "Read the output before you kill anything. The `COMMAND` column tells you whether you are about to stop your own dev server or something you actually need, and that distinction matters more than the speed of the fix. `postgres` on 5432, `mysqld` on 3306 and `redis-server` on 6379 are usually services you installed on purpose, often as system services that will restart themselves and leave you confused about why the port never clears."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: the owner of TCP 3000\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess\nGet-Process -Id 48213\n\nStop-Process -Id 48213          # add -Force if it ignores the request\n\n# cmd.exe equivalent\nnetstat -ano | findstr :3000\ntaskkill /PID 48213 /F\n\n# Port refused but nothing listening? Check OS reservations.\nnetsh interface ipv4 show excludedportrange protocol=tcp"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not reach for killall",
      "x": "`killall node` and `pkill -f python` are widely posted answers and they are blunt instruments. They stop every unrelated project, editor language server and build watcher you had running. Kill the PID you identified, not a process name."
    },
    {
      "t": "h2",
      "x": "Why the port stays busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part most answers skip. A crash that kills your app's *main* process does not necessarily kill the process that holds the listening socket, and the gap between those two things explains most repeat offenders."
    },
    {
      "t": "h3",
      "x": "The parent died and the child inherited the socket"
    },
    {
      "t": "p",
      "x": "`npm run dev` is a chain: npm spawns a shell, the shell spawns `nodemon` or `vite`, and that spawns your server. Hit Ctrl+C in an attached terminal and the signal goes to the whole foreground process group, so the chain usually collapses cleanly. Close the terminal window instead, or `kill -9` the top of the chain, and the grandchild survives. It gets reparented to `init` or `launchd`, loses its controlling terminal, and keeps the port open indefinitely. Nothing on screen tells you it is there."
    },
    {
      "t": "p",
      "x": "The same thing happens with a clustered or forked server. In Node's `cluster` module the primary process creates the listener and hands connections to workers, so a worker crash leaves the bound socket exactly where it was. Your logs show a stack trace and an exit. The socket never moved."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is the real parent, and what process group are they in?\nps -o pid,ppid,pgid,etime,command -p $(lsof -ti:3000)\n\n# Kill the whole group: note the minus sign before the PGID\nkill -TERM -48210\n\n# A PPID of 1 means the parent is gone and this process was orphaned"
    },
    {
      "t": "h3",
      "x": "The watcher restarted faster than the old process shut down"
    },
    {
      "t": "p",
      "x": "File watchers restart on save. If your app takes two seconds to close its database pool and the watcher waits 200 milliseconds, the new process binds while the old one is still draining. You see `EADDRINUSE`, the watcher restarts again, and now you have a loop that looks like a port problem but is really a shutdown-timing problem. Save the file again and it often works, which is why this one gets misdiagnosed as flaky tooling."
    },
    {
      "t": "h3",
      "x": "Containers hold ports differently"
    },
    {
      "t": "p",
      "x": "A published container port is claimed by the Docker daemon's proxy on the host, not by the process inside the container. So `lsof` reports `docker-proxy` or `com.docker.backend` and gives you no useful PID to kill. Ask Docker instead."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container published this port?\ndocker ps --filter publish=3000\n\n# Include stopped and restarting containers\ndocker ps -a --filter publish=3000\n\n# Release it\ndocker stop <name>\ndocker compose down        # also removes the network and its proxy"
    },
    {
      "t": "h2",
      "x": "Match the error text to the cause"
    },
    {
      "t": "table",
      "head": [
        "Where you see it",
        "Message",
        "What it narrows down"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "The `:::3000` form means it tried to bind all interfaces over IPv6, which also covers IPv4 on a dual-stack host"
        ],
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use 127.0.0.1:3000`",
          "Only loopback is taken. Another interface may still be free, though that rarely helps in dev"
        ],
        [
          "Python on Linux",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 is Linux's `EADDRINUSE`"
        ],
        [
          "Python on macOS",
          "`OSError: [Errno 48] Address already in use`",
          "Same condition, different errno number on BSD-derived systems"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Wording varies slightly between JDK versions; some append `(Bind failed)`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Usually Apache, another nginx master, or a stale `nginx.pid`"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "The host port is taken, often by another container rather than a host process"
        ],
        [
          "Any runtime",
          "`EACCES` or `Permission denied` on a low port",
          "Not a conflict at all. Ports below 1024 need privileges or a capability"
        ]
      ],
      "caption": "Quote the error you actually got. The address in it tells you which interface was refused."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EACCES is a different problem",
      "x": "Trying to bind port 80 or 443 as a normal user fails with `EACCES`, not `EADDRINUSE`. The fix there is a reverse proxy, `setcap 'cap_net_bind_service=+ep'` on the binary, or a high port behind a redirect. Killing processes will not help."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and the port is still refused"
    },
    {
      "t": "p",
      "x": "You run `lsof`, you get nothing back, and `bind()` still fails. There are four realistic explanations, and they are worth checking in this order."
    },
    {
      "t": "ol",
      "items": [
        "**You did not look as root.** `lsof` and `ss` only show you the full picture with privileges. Re-run with `sudo lsof -i:3000`. A port owned by another user or a system daemon is invisible otherwise.",
        "**Sockets are in `TIME_WAIT`.** A socket that carried connections lingers for roughly a minute after close, on the order of two minutes on some systems. Check with `ss -tan 'sport = :3000'`. Without `SO_REUSEADDR`, a fresh listener cannot bind over those remnants.",
        "**The OS reserved the range.** On Windows, Hyper-V and WSL2 reserve blocks of the dynamic port range at boot, which is why a perfectly idle port 50000-ish suddenly refuses. `netsh interface ipv4 show excludedportrange protocol=tcp` lists them.",
        "**Something built into the OS owns it quietly.** On macOS, AirPlay Receiver has historically listened on ports 5000 and 7000, attributed to `ControlCenter`, which breaks the common Flask default of 5000. You can turn AirPlay Receiver off in System Settings, or just move your app to another port. Check your own macOS version rather than trusting this from memory."
      ]
    },
    {
      "t": "p",
      "x": "`SO_REUSEADDR` is the flag that lets a listener bind over `TIME_WAIT` remnants. Node sets it for you. Python's `socketserver.TCPServer` leaves `allow_reuse_address` off in its base class, which is why a hand-rolled server needs the subclass below while Flask and `http.server` usually do not."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socketserver\n\nclass Server(socketserver.TCPServer):\n    allow_reuse_address = True   # bind over sockets in TIME_WAIT\n\n# Raw sockets: set it before bind(), never after\nimport socket\ns = socket.socket()\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind(('127.0.0.1', 3000))\ns.listen()"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "SO_REUSEPORT is not the same flag",
      "x": "`SO_REUSEADDR` reuses an address left over from closed connections. `SO_REUSEPORT` lets multiple live processes bind the same port and share incoming connections between them. Set the second one by accident and you get no error at all: you get two servers, half your requests going to the stale one, and a debugging session you will not enjoy."
    },
    {
      "t": "h2",
      "x": "Fix the shutdown path so it stops happening"
    },
    {
      "t": "p",
      "x": "Killing the process is the symptom fix. If you see this error weekly, your app is not closing its listener when asked. Handle the signals explicitly."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(process.env.PORT || 3000);\n\nfunction shutdown(signal) {\n  return () => {\n    server.close(() => process.exit(0));\n\n    // Keep-alive sockets can hold close() open indefinitely.\n    // closeAllConnections() exists in Node 18.2 and later.\n    server.closeAllConnections?.();\n\n    // Last resort, so a stuck handler cannot keep the port forever.\n    setTimeout(() => process.exit(1), 5000).unref();\n  };\n}\n\nprocess.once('SIGINT', shutdown('SIGINT'));    // Ctrl+C\nprocess.once('SIGTERM', shutdown('SIGTERM'));  // docker stop, systemd"
    },
    {
      "t": "p",
      "x": "Three details carry most of the benefit here. Keep-alive connections are the classic reason `server.close()` never calls back, because it waits for existing sockets to finish and a browser tab will happily hold one open for a minute. The timeout guard turns an indefinite hang into a five-second worst case. And if you use nodemon, it sends `SIGUSR2` rather than `SIGTERM` on restart, so add that signal to the list and re-raise it with `process.kill(process.pid, 'SIGUSR2')` once you have cleaned up, otherwise nodemon loses track of the restart."
    },
    {
      "t": "p",
      "x": "In Docker, make sure the signal reaches your app at all. `CMD npm start` runs npm as PID 1, and npm is not careful about forwarding signals to the child it spawned, so `docker stop` waits ten seconds and then kills everything outright. Use the exec form, `CMD [\"node\", \"server.js\"]`, so your process is PID 1 and gets the `SIGTERM` directly. The same class of problem produces containers that exit for reasons that look unrelated, which we cover in the [Docker exit guide](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "h2",
      "x": "Stop fighting over the port in tests"
    },
    {
      "t": "p",
      "x": "Hard-coded ports in a test suite are a design choice you can simply decline. Bind to `0` and the kernel hands you a free ephemeral port, which you then read back from the socket. Parallel test workers stop colliding, CI stops failing intermittently, and nobody has to remember which project owns 3000."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  baseUrl = `http://127.0.0.1:${port}`;   // hand this to your test client\n});"
    },
    {
      "t": "p",
      "x": "For day-to-day development, read the port from the environment and give each project its own default. `PORT=3100 npm run dev` costs nothing. Two services that both default to 3000 will keep colliding for as long as the defaults stay identical, and no amount of process-killing changes that."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "What does EADDRINUSE mean?",
          "a": "It is the error code the operating system returns when `bind()` is refused because another socket already holds that address and port combination. The runtime passes it through with the address attached, as in `address already in use :::3000`. It is a statement about the machine's state, not about your code being malformed."
        },
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `kill $(lsof -ti:3000)`, then `kill -9 $(lsof -ti:3000)` only if the process is still there a few seconds later. On Windows: `netstat -ano | findstr :3000` to get the PID, then `taskkill /PID <pid> /F`. Look at `lsof -i:3000` output first so you know what you are stopping."
        },
        {
          "q": "Why is the port still in use after I closed the terminal?",
          "a": "Closing a terminal window does not reliably kill everything it started. A process that was detached, backgrounded, or spawned through a chain of tooling gets orphaned, reparented to `init` or `launchd`, and carries on holding the socket with no visible window. Check `ps -o pid,ppid,command -p $(lsof -ti:3000)`: a PPID of 1 confirms it."
        },
        {
          "q": "Why does it say the port is in use when nothing is listening?",
          "a": "Four common reasons: you ran `lsof` without `sudo` and the owner belongs to another user, sockets are sitting in `TIME_WAIT` and your server did not set `SO_REUSEADDR`, the OS reserved the port range (common with Hyper-V and WSL2 on Windows), or a container's published port is held by the Docker daemon rather than by a host process."
        },
        {
          "q": "Is kill -9 safe for a dev server?",
          "a": "For a local dev server, usually yes, with two caveats. `SIGKILL` cannot be caught, so cleanup code does not run and lock files, temp directories or a half-written database transaction can be left behind. More relevant here, killing a parent with `-9` does not kill its children, and an orphaned child is the single most common reason the port is still busy afterwards. Try `kill` first."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "On different addresses, yes: `127.0.0.1:3000` and `192.168.1.10:3000` do not conflict, though `0.0.0.0:3000` conflicts with both. Two processes can also share an identical address if both set `SO_REUSEPORT`, which is how some load-balancing setups work deliberately. That is rarely what you want by accident, because requests then split between your new process and the stale one."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Trace a container that stops on startup via its logs, exit code and PID 1.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Check each layer in order when psql cannot reach the server on 5432.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "Why resolution fails, and what ESM and CommonJS disagree about.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-27",
  "updated": "2026-10-27",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
