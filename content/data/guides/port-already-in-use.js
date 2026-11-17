module.exports = {
  "slug": "port-already-in-use",
  "title": "Port Already in Use: Find and Fix EADDRINUSE",
  "h1": "EADDRINUSE: find the process, then kill it properly",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means another process holds the port. Find it on macOS, Linux and Windows, kill it in the right order, and stop orphans coming back.",
  "standfirst": "A port is held by a process, not by the operating system sulking. Identify the holder before you reach for kill -9, because kill -9 is usually what left the port busy in the first place.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "lsof port",
    "address already in use"
  ],
  "cardDesc": "Find the process holding a port, kill it in the right order, and understand why orphans survive a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means a process already holds a listening socket on that address and port. Retrying the start command will not help.",
        "One command per platform: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `ss -lptn 'sport = :3000'` on Linux without lsof, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the holder is almost always an orphaned child process, not a lingering kernel state. Node sets `SO_REUSEADDR` on listening sockets, so `TIME_WAIT` rarely blocks a fresh listen.",
        "Send `SIGTERM` first and give it a second. `SIGKILL` skips cleanup and is how orphans are created.",
        "If the port is busy but nothing shows up as listening, look outside your namespace: a container, a WSL distro, a Windows reserved port range, or a process that inherited the socket's file descriptor."
      ]
    },
    {
      "t": "h2",
      "x": "What the error actually tells you"
    },
    {
      "t": "p",
      "x": "Every runtime wraps the same operating system error, so the wording differs but the meaning does not. The kernel refused a `bind()` call because the address and port combination is already claimed by a listening socket."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node.js (stack frames vary by version, so only the first line is stable)\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python, Linux\nOSError: [Errno 98] Address already in use\n\n# Python, macOS (same error, different errno number)\nOSError: [Errno 48] Address already in use\n\n# Django's development server\nError: That port is already in use.\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker\nError response from daemon: Bind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Read the address, not just the port. Node's `:::3000` is the IPv6 wildcard, which on a dual-stack system also covers IPv4 through `v6only=0`. A plain `0.0.0.0:3000` is the IPv4 wildcard. `127.0.0.1:3000` is the loopback interface only. Those are different addresses as far as `bind()` is concerned, which is why a service bound to loopback will happily coexist with a conflict you thought you had already found, and why a wildcard listener blocks every more specific bind on the same port."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "p",
      "x": "Do this before anything else. The answer is often a surprise, and the surprise is the real bug."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: what is listening on 3000?\n# -n and -P skip DNS and port-name lookups, which makes it fast and readable.\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -lptn 'sport = :3000'\n\n# Everything touching the port, including established connections\nss -ptn 'sport = :3000 or dport = :3000'\n\n# Blunt instrument: show the holder, then ask it to stop\nfuser -v 3000/tcp\nfuser -k -TERM 3000/tcp"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, cmd.exe: the PID is the last column\nnetstat -ano | findstr :3000\n\n# Windows, PowerShell: resolve that PID to something human\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Then stop it\ntaskkill /PID 12345 /F"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "An empty result does not mean an empty port",
      "x": "Both `lsof` and `ss -p` can only name processes you are allowed to see. A socket owned by another user, or by root, shows up with a blank process column or not at all. If the bind keeps failing while the listing looks clean, run the same command under `sudo` before concluding anything."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part people get wrong. The instinct is to blame the kernel for holding the port open for a cooling-off period. In practice, on a dev machine, the port is held by a live process that you believe you killed."
    },
    {
      "t": "ul",
      "items": [
        "**Orphaned children.** `npm run dev` spawns a shell, which spawns Node, which may spawn workers. Ctrl+C sends `SIGINT` to the whole foreground process group, so normally everything dies together. Kill only the parent, from a different terminal or with a `kill -9`, and the children are re-parented to init and keep listening.",
        "**Inherited file descriptors.** A listening socket is a file descriptor, and `fork()` copies it. If your editor, a debugger session, a test runner or a watcher spawned the server, it holds a copy of that descriptor. The server dies, the port stays claimed, and `lsof` points at a process that has nothing obvious to do with your app.",
        "**Cluster and worker setups.** With `cluster` or a prefork server, the primary creates the socket and passes handles to workers. Kill the primary hard and surviving workers own the port.",
        "**A crash loop you cannot see.** A supervisor (`nodemon`, `pm2`, `systemd`, Docker's restart policy) restarts the process faster than you can read the log. Your manual start then collides with the supervised one.",
        "**Containers.** `docker-proxy` or the container's own namespace holds the published port. On the host, `lsof` may show `docker-proxy` or nothing useful. `docker ps` shows the truth.",
        "**Two machines in a trench coat.** WSL2 forwards listening ports to the Windows host. A port occupied inside a distro can conflict with a Windows process, and vice versa."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Follow the process tree, not the process",
      "x": "`ps -o pid,ppid,pgid,comm -p $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)` tells you the parent and the process group of the holder. If the parent is your shell or your editor, you have a descriptor-inheritance problem and killing the child alone will not free the port."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT, SO_REUSEADDR and the myth of the 60 second wait"
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` is real, but it is mostly a story about client connections, not listeners. When a socket closes actively it sits in `TIME_WAIT` for twice the maximum segment lifetime so that late duplicate packets cannot be mistaken for part of a new connection. On Linux that interval is fixed in the kernel at 60 seconds and is not tunable through `sysctl`."
    },
    {
      "t": "p",
      "x": "`SO_REUSEADDR` exists to let a server bind its listening address again while old connections from the previous instance are still winding down in `TIME_WAIT`. Node and most Go, Rust and Java server libraries set it for you, which is why a restarted Node server normally rebinds instantly. Python's low-level `socket` code does not set it unless you ask, and that is the common source of the belief that you have to wait."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n# Without this, a restart within the TIME_WAIT window raises\n# OSError: [Errno 98] Address already in use\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind((\"0.0.0.0\", 3000))\ns.listen(128)\n\n# socketserver and http.server expose the same thing as a class attribute:\n#   class MyServer(socketserver.TCPServer):\n#       allow_reuse_address = True"
    },
    {
      "t": "p",
      "x": "Do not reach for `SO_REUSEPORT` to make the error go away. It is a different option with different semantics: it deliberately allows several sockets to listen on the same address and port and have the kernel load balance between them. Set it and a duplicate server starts successfully, takes a share of the traffic, and you spend an afternoon wondering why half your requests hit stale code. If `SO_REUSEADDR` is not enough, you have a live process to deal with, not a flag to flip."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify, and look at the name",
          "x": "If the holder is `postgres`, `ControlCenter` or `java`, stop and think. Killing a database because it is sitting on the port you wanted is a worse outcome than changing your port.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Ask politely first",
          "x": "`SIGTERM` lets the process close its listeners, finish in-flight requests, flush logs and remove its own children. Most servers handle it. Give it a second before escalating.",
          "code": "kill -TERM 12345"
        },
        {
          "title": "Kill the group, not the leader",
          "x": "A negative argument addresses a process group, so children die with the parent instead of outliving it. Get the group id from `ps -o pgid= -p <pid>`.",
          "code": "kill -TERM -12345   # the leading minus is the point"
        },
        {
          "title": "Verify, do not assume",
          "x": "Re-run the listing. An empty result is the only proof. A process that ignored `SIGTERM` is still there holding the socket.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo \"port is free\""
        },
        {
          "title": "Escalate only if it refuses",
          "x": "`SIGKILL` cannot be caught, so no cleanup runs: temp files stay, lock files stay, children are orphaned. It is the right tool for a wedged process and the wrong default.",
          "code": "kill -KILL 12345"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "pkill -f node is not a port command",
      "x": "`pkill -f node` matches the full command line of every process containing the word, which on a developer machine includes language servers, editor extensions, bundler watchers, Electron apps and sometimes the editor itself. Match the port, not the runtime: `kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)` is narrower and still short enough to type."
    },
    {
      "t": "h2",
      "x": "Cases that look like EADDRINUSE but are not"
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "Likely cause",
        "What to check"
      ],
      "rows": [
        [
          "`EACCES` rather than `EADDRINUSE`",
          "Binding a port below 1024 without privileges",
          "Use a high port behind a reverse proxy, or grant `CAP_NET_BIND_SERVICE` to the binary"
        ],
        [
          "Port 5000 busy on macOS with nothing running",
          "AirPlay Receiver, which appears as `ControlCenter`",
          "Turn AirPlay Receiver off in System Settings, or pick another port. Behaviour dates from macOS Monterey and still applies as of November 2026; confirm on your version"
        ],
        [
          "Windows reports access forbidden, nothing is listening",
          "Hyper-V or WSL has reserved a dynamic port range",
          "`netsh int ipv4 show excludedportrange protocol=tcp`"
        ],
        [
          "`lsof` is empty but the bind still fails",
          "The holder is in another network namespace",
          "`docker ps`, then `ss -lptn` inside the container or distro"
        ],
        [
          "Bind fails on `0.0.0.0` and succeeds on `127.0.0.1`",
          "An existing wildcard listener on the same port",
          "`ss -lptn 'sport = :3000'` and read the Local Address column"
        ],
        [
          "Second instance starts, requests split between old and new code",
          "`SO_REUSEPORT`, or a supervisor already running a copy",
          "Compare PIDs over time and check your process manager"
        ]
      ],
      "caption": "Symptoms that get filed under 'port already in use' but have different fixes."
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Two small habits remove most repeat offences. Handle the shutdown signals in your server, and stop hardcoding ports in anything that runs more than once at a time."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(process.env.PORT || 3000);\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n\n    // Idle keep-alive sockets can keep close() pending.\n    // closeAllConnections() exists from Node 18.2; check your version's docs.\n    server.closeAllConnections?.();\n\n    // Never hang forever waiting for a stuck request.\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "For tests and anything you might run twice in parallel, let the kernel choose. Port `0` means \"give me any free port\", and the socket tells you which one it got. CI agents that run several jobs on one host stop colliding, and so do two branches of the same service on your laptop."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`listening on http://127.0.0.1:${port}`);\n});"
    },
    {
      "t": "p",
      "x": "A few more things worth doing once. In Docker, add `--init` or an init process such as `tini` so signals reach PID 1 and zombie children get reaped. In compose projects, use `docker compose down` rather than Ctrl+C, which leaves containers running more often than people expect. If you use a process manager in development, pick one and stick to it, because the worst version of this problem is `nodemon` and `pm2` both deciding they own your server. And resist adding a retry loop around `listen()`. It turns a clear, instant error into a service that silently never comes up."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `kill -TERM $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)`, then re-run the `lsof` to confirm it is gone. On Windows, find the PID with `netstat -ano | findstr :3000` and run `taskkill /PID <pid> /F`. Look at the process name before you kill it. If the answer is your database or a system service, change your own port instead."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Usually because something survived. Ctrl+C signals the foreground process group, but a child that was detached, double-forked, or started by a watcher or debugger can outlive it and keep the listening socket. A process that inherited the socket's file descriptor also keeps the port claimed even after the server itself exits. Check the parent and group of whatever `lsof` reports."
        },
        {
          "q": "Do I have to wait 60 seconds for TIME_WAIT to clear?",
          "a": "Almost never for a listening socket. Node, Go and most Java server libraries set `SO_REUSEADDR`, which exists precisely so a server can rebind while old connections drain. If waiting genuinely fixes it, you are probably using a library that does not set that option, such as raw Python `socket` or `socketserver` without `allow_reuse_address = True`."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "It is safe for the port and risky for everything else. `SIGKILL` cannot be caught, so no shutdown handler runs: lock files and temp files are left behind, in-flight work is lost, and children are orphaned, which is the single most common reason a port stays busy after a crash. Try `SIGTERM` first and escalate only if the process ignores it."
        },
        {
          "q": "Why does lsof show nothing when the port is clearly taken?",
          "a": "Three usual reasons. You lack permission to see a socket owned by another user, so try `sudo`. The holder lives in another network namespace, so check `docker ps` and WSL. Or on Windows the range is reserved rather than listening, which `netsh int ipv4 show excludedportrange protocol=tcp` will reveal."
        },
        {
          "q": "Can two processes legitimately listen on the same port?",
          "a": "Yes, with `SO_REUSEPORT`, where the kernel balances incoming connections across the listeners. It is a deliberate scaling technique, not a fix for this error. Enabling it to silence `EADDRINUSE` means a stale instance can keep serving a share of your traffic, which is far harder to debug than a failed start."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "PID 1, exit codes and why a crash loop can hold a published port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The other side of a bind problem: nothing is listening where you expect.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Cannot find module in Node",
          "desc": "When the server never gets as far as listening at all.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-17",
  "updated": "2026-11-17",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
