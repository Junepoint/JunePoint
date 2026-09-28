module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is in Use",
  "h1": "Port already in use: find the process, then decide what to do about it",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a TCP port on Linux, macOS and Windows, kill it safely, and understand why the port stays busy after a crash.",
  "standfirst": "The fix is two commands long. The interesting part is why the port was still held after you thought you had stopped the server, because that answer changes what you should do next time.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Find what owns a busy TCP port, free it without collateral damage, and stop the leak at its source.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` nearly always means another process is still listening. It is rarely a ghost socket and rarely a bug in your framework.",
        "Find the owner first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `ss -lptn 'sport = :3000'` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash, the process holding the port is often a child that outlived the parent you were watching. The PID you remember is not the PID you need.",
        "Send `SIGTERM` first and only escalate to `kill -9` if it does not exit. A hard kill on a database or a queue worker can cost you data.",
        "If the port frees itself after about a minute with no process in sight, you were looking at `TIME_WAIT`, which has a different cause and a different fix."
      ]
    },
    {
      "t": "h2",
      "x": "Read the error properly before you kill anything"
    },
    {
      "t": "p",
      "x": "Every runtime reports this failure differently, but they all encode the same three facts: the syscall that failed, the errno, and the exact address that was refused. That third piece is the one people skim past, and it is usually the one that identifies the culprit."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node (the wording since Node 16)\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker, phrasing varies between versions\nBind for 0.0.0.0:8080 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "`:::3000` is the IPv6 wildcard address. On most Linux systems a listener there also accepts IPv4 traffic, because `net.ipv6.bindv6only` defaults to `0`. This matters more than it looks. A process bound to `[::]:3000` will block a second process trying to bind `0.0.0.0:3000`, so the conflict can exist even when the two addresses look unrelated in the error text. By contrast, something bound only to `127.0.0.1:3000` leaves `192.168.1.10:3000` free, which is why the same app can start on one interface and fail on another."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux. -n and -P skip DNS and service-name lookups, so it returns fast.\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof installed. -p needs root to show the process for other users' sockets.\nsudo ss -lptn 'sport = :3000'\n\n# Anything listening, grouped, when you are not sure of the port\nsudo ss -lptn | grep -E ':(3000|3001|8080)'\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\"\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object -ExpandProperty OwningProcess |\n  ForEach-Object { Get-Process -Id $_ }"
    },
    {
      "t": "p",
      "x": "Read the `COMMAND` and `USER` columns, not just the PID. A row saying `node` under your own user is your dev server. A row saying `docker-proxy` under root means a published container port, and killing the proxy is the wrong move: stop the container instead. A row saying `ControlCenter` on a Mac is a system service you should not touch. Without `sudo`, `lsof` and `ss` silently omit sockets owned by other users, which is the usual reason someone reports an empty result while the port is plainly taken."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Containers hide their own ports",
      "x": "If the listener is a container, `docker ps --filter publish=3000` names it directly. Inside a container, the port may be free on the host and taken in the namespace, or the reverse. Check both sides before concluding anything."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people, and the explanation is mundane. A listening socket is a file descriptor. When a process forks, the child inherits open descriptors, including that socket. Kill the parent and the kernel keeps the socket alive as long as any descriptor referencing it remains open anywhere. So the port stays bound to a process you never meant to start and are not looking at."
    },
    {
      "t": "p",
      "x": "Development tooling makes this common. A watcher such as `nodemon`, a `concurrently` invocation, a monorepo task runner or an IDE run configuration typically spawns your server as a grandchild. If the middle layer dies badly, say the terminal window closed or the supervisor segfaulted, the grandchild is reparented and carries on serving requests. Your editor shows nothing running. `curl localhost:3000` answers cheerfully with stale code."
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child process.** The most frequent cause by a wide margin. Look for your app's own name in `lsof`, not the supervisor's.",
        "**A process that ignored SIGINT.** Ctrl+C sends `SIGINT` to the foreground process group. Code that traps it and waits on an open keep-alive connection will sit there indefinitely, still bound.",
        "**A detached or backgrounded run.** `nohup`, `&`, `screen`, `tmux`, or `docker run -d` from three days ago.",
        "**A restart policy doing its job.** `restart: unless-stopped` in Compose, a systemd unit with `Restart=always`, or `pm2` faithfully resurrecting the thing you keep killing.",
        "**A second copy of the same app.** Two terminal tabs, or a stale debugger holding the Node inspector port `9229` rather than the HTTP port."
      ]
    },
    {
      "t": "p",
      "x": "There is a real second cause, and it is worth distinguishing because the remedy differs. A socket that was actively connected and then closed enters `TIME_WAIT` and stays there for a fixed interval. No process owns it, so `lsof` shows nothing useful, and the port frees itself if you wait. Seeing `TIME_WAIT` entries in `ss -tan state time-wait` alongside an `EADDRINUSE` failure points at the socket option your server is using rather than at a rogue process."
    },
    {
      "t": "h2",
      "x": "Kill it and verify"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask politely",
          "x": "`SIGTERM` is the default signal and lets the process flush logs, close database handles and finish in-flight requests. Most well-behaved servers exit within a second or two.",
          "code": "kill 12345"
        },
        {
          "title": "Check whether it actually left",
          "x": "Do not assume. A process that traps `SIGTERM` and then blocks is a real failure mode, and it is the reason the next step exists.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if needed",
          "x": "`SIGKILL` cannot be trapped, so nothing gets a chance to clean up. Acceptable for a stateless dev server. Not acceptable for a database, a broker, or anything mid-write.",
          "code": "kill -9 12345"
        },
        {
          "title": "One-liners, with their sharp edge",
          "x": "These are fine for a laptop and careless in a shared environment, because they act on every match without showing you what matched. `lsof -t` can return several PIDs, and `fuser -k` kills immediately.",
          "code": "# macOS and Linux\nkill $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Linux only\nsudo fuser -k 3000/tcp\n\n# Windows\ntaskkill /PID 12345 /F"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reach for killall",
      "x": "`killall node` or `pkill -f node` will take out your language server, your build watcher, your test runner and any unrelated tooling that happens to be a Node process. It works, in the sense that the port is now free. It also destroys state you wanted. Target the PID you identified."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT, SO_REUSEADDR and the one-minute wait"
    },
    {
      "t": "p",
      "x": "When one end of a TCP connection closes first, its socket lingers in `TIME_WAIT` so that delayed duplicate packets from the old connection cannot be misread as belonging to a new one on the same address and port pair. On Linux this interval is compiled into the kernel and is not tunable through `sysctl`. Historically it is twice the maximum segment lifetime. The practical effect is that a port can look occupied for around a minute after a server with active connections goes away."
    },
    {
      "t": "p",
      "x": "`SO_REUSEADDR` tells the kernel to allow a bind despite those lingering sockets. Node sets it by default for `net.Server` on Unix-like systems, and Go, Python's `http.server` and most modern web frameworks either set it or expose a flag for it, which is precisely why the average Node developer almost never hits a genuine `TIME_WAIT` collision. If you are writing raw socket code, set it yourself before binding."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind(('0.0.0.0', 3000))   # now tolerates sockets in TIME_WAIT\ns.listen(128)"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Two options that sound similar and are not",
      "x": "`SO_REUSEPORT` is a different thing: it lets several processes bind the same port at once and share incoming connections. Useful for zero-downtime restarts, and a silent disaster if you enable it by accident, because your old server keeps serving half the traffic while you wonder why your changes only appear sometimes. Separately, ignore any advice to enable `tcp_tw_recycle` on Linux: it broke clients behind NAT and was removed from the kernel years ago."
    },
    {
      "t": "h2",
      "x": "When it is not a conflict at all"
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "What it means",
        "What to do"
      ],
      "rows": [
        [
          "`EADDRINUSE`",
          "Another socket already holds this address and port",
          "Identify the owner, stop it, or bind a different port"
        ],
        [
          "`EACCES` on a port below 1024",
          "Privileged port, and you are not privileged",
          "Use a high port in development, or grant `CAP_NET_BIND_SERVICE` in production"
        ],
        [
          "`EADDRNOTAVAIL`",
          "The address itself does not exist on this host",
          "You are binding an IP the machine does not own, common in containers and on VPNs"
        ],
        [
          "`ECONNREFUSED` from a client",
          "Nothing is listening at all",
          "The opposite problem. Check the server started and bound the interface you are dialing"
        ],
        [
          "Docker: `port is already allocated`",
          "The host port is taken, often by a stopped-but-present container",
          "`docker ps -a --filter publish=3000`, then remove or re-map"
        ]
      ],
      "caption": "Errors that get filed under \"port problems\" but need different fixes."
    },
    {
      "t": "p",
      "x": "Two host-specific traps deserve a mention. On macOS, the AirPlay Receiver service has occupied ports 5000 and 7000 since macOS Monterey, which broke a generation of Flask tutorials that default to 5000. You can turn it off in System Settings under General, then AirDrop and Handoff, though moving your app is usually less disruptive. This was still the behaviour as of September 2026; verify on your own version, since Apple moves these settings between releases. On Windows, Hyper-V and WSL2 reserve blocks of dynamic ports at boot, so a port can be unusable with nothing listening on it. `netsh interface ipv4 show excludedportrange protocol=tcp` lists the reservations."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Killing the process is the fix. Handling shutdown properly is the cure. Two small additions to a server remove most repeat occurrences, and the second one turns a confusing stack trace into a sentence a human can act on."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port);\n\n// 1. A clear message instead of an unhandled listen error\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is already in use. Not starting.`);\n    process.exit(1);\n  }\n  throw err;\n});\n\n// 2. Actually release the socket on the way out\nconst shutdown = () => {\n  server.close(() => process.exit(0));\n  // Keep-alive connections will hold close() open, so cap the wait.\n  if (server.closeAllConnections) server.closeAllConnections();\n  setTimeout(() => process.exit(1), 10_000).unref();\n};\n\nprocess.on('SIGINT', shutdown);\nprocess.on('SIGTERM', shutdown);"
    },
    {
      "t": "p",
      "x": "`server.closeAllConnections()` exists from Node 18.2.0 onwards; the guard keeps the code working on older runtimes. Check the docs for the version you are actually deploying, as this API area has changed more than once. The `setTimeout` is not decoration: without a deadline, a single idle keep-alive connection can hold `close()` open for as long as the client keeps it, and the process you thought was exiting is still bound to the port."
    },
    {
      "t": "p",
      "x": "For genuinely disposable servers, tests and ephemeral tooling, sidestep the problem instead. Bind port `0` and the kernel assigns a free port, which you then read back from `server.address().port`. Parallel test runners in particular should never hardcode a port, because the failure only appears when two suites overlap and it looks like flakiness rather than a conflict. In Compose files, mapping `\"3000\"` rather than `\"3000:3000\"` gets you a random host port for the same reason."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this problem: nothing listening where you expected something.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Docker container exits immediately",
          "desc": "Why a failed bind at startup shows up as a container that will not stay alive.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "How to diagnose and fix CORS errors",
          "desc": "Once the server is up on a new port, the browser has opinions about the origin change.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` to see it, then `kill <pid>`. On Windows, `netstat -ano | findstr :3000` to get the PID, then `taskkill /PID <pid> /F`. Look at what you found before you kill it. If the command is `docker-proxy`, `postgres` or a system service, killing the process is the wrong answer and stopping the container or service is the right one."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group, not every descendant. If your server was started by a watcher or a task runner, the actual server can be a grandchild that survives, inherits the listening socket and keeps serving. Search for your app's own process name rather than the supervisor's. The second possibility is code that traps `SIGINT` and then blocks on an open keep-alive connection, in which case it is still running and still bound, just not doing anything visible."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "On a stateless dev server, yes. Otherwise be careful, because `SIGKILL` cannot be caught, so the process gets no chance to flush buffers, finish a write or release a lock. For databases, message brokers and anything mid-transaction, send `SIGTERM` first and give it a few seconds. Reach for `-9` only when a plain `kill` has demonstrably failed."
        },
        {
          "q": "Why do I get EADDRINUSE when lsof shows nothing?",
          "a": "Three usual reasons. You did not use `sudo`, so sockets belonging to other users were hidden. The socket is in `TIME_WAIT` rather than owned by a process, which you can confirm with `ss -tan state time-wait` and which resolves itself in about a minute. Or the port is reserved rather than listened on, which happens on Windows with Hyper-V and WSL2 dynamic port ranges: check `netsh interface ipv4 show excludedportrange protocol=tcp`."
        },
        {
          "q": "What is using port 5000 on my Mac?",
          "a": "Almost certainly the AirPlay Receiver, which has held ports 5000 and 7000 since macOS Monterey and shows up in `lsof` as `ControlCenter`. That collides with Flask's default port. You can disable AirPlay Receiver in System Settings under General, then AirDrop and Handoff, but running your app on another port is simpler and does not change the machine's behaviour for everything else. Confirm the current setting location on your macOS version, as Apple has relocated it before."
        },
        {
          "q": "How long does a port stay in TIME_WAIT?",
          "a": "On Linux the interval is fixed in the kernel at 60 seconds and no `sysctl` changes it. Other systems use different values. You rarely need to wait, because setting `SO_REUSEADDR` before binding lets a listener take the address anyway, and most modern server libraries including Node set it for you. Do not enable `tcp_tw_recycle` as a workaround; it misbehaved with clients behind NAT and has been removed from the kernel."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-28",
  "updated": "2026-09-28",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
