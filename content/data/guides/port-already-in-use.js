module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That's in Use",
  "h1": "Port already in use: finding and freeing it",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a TCP port, stop it safely, and understand why the port often stays busy after your server crashes.",
  "standfirst": "EADDRINUSE names the problem precisely: something already owns that address and port. Find out what, decide whether it should die, and only then start killing processes.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Find what holds a port, stop it without collateral damage, and fix the crash pattern that keeps leaving it busy.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is not a permissions error and usually not a bug in your code. Another socket already holds the address and port you asked for.",
        "Identify the holder first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash, the usual cause is a surviving child process that inherited the listening socket, not the kernel holding the port hostage.",
        "Send `SIGTERM` before `SIGKILL`. A hard kill skips your shutdown handler and can leave orphans of its own.",
        "If nothing is listening and the bind still fails, suspect a reserved port range on Windows, an OS service on macOS, or a wildcard versus loopback address clash."
      ]
    },
    {
      "t": "h2",
      "x": "Read the whole error first"
    },
    {
      "t": "p",
      "x": "The error carries more information than most people use. Node prints the address family and port it tried to bind, and the address is the part worth reading twice."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle (node:net:...)\n    ...\n  code: 'EADDRINUSE',\n  errno: -48,          // -98 on Linux\n  syscall: 'listen',\n  address: '::',\n  port: 3000"
    },
    {
      "t": "p",
      "x": "The stack frames between the message and the error fields move around between Node versions, so ignore them. `address: \"::\"` means your server asked for the IPv6 wildcard, which on most systems also accepts IPv4 traffic. `0.0.0.0` is the IPv4 wildcard. `127.0.0.1` is loopback only. This distinction decides whether a conflict is real: a wildcard bind collides with every other bind on that port, while two servers can happily listen on port 3000 at the same time if one takes `127.0.0.1` and the other takes a specific LAN address."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What it prints",
        "Notes"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "Thrown as an `error` event on the server, not a rejected promise"
        ],
        [
          "Python",
          "`OSError: [Errno 48] Address already in use`",
          "Errno is 48 on macOS, 98 on Linux"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "Returned from `net.Listen`, easy to miss if you discard the error"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Some JDK builds append a parenthesised detail"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "The clash is on the host, not inside the container"
        ]
      ],
      "caption": "The same kernel error, dressed differently. The wording varies by platform and version, so match on the errno or error code rather than the string."
    },
    {
      "t": "h2",
      "x": "Find the process that holds the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: what is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Just the PID, for scripting\nlsof -t -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "The flags matter. `-n` skips reverse DNS and `-P` skips port-name lookup, which keeps the output numeric and fast. `-sTCP:LISTEN` is the important one: it filters to sockets that are actually listening."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The short form matches too much",
      "x": "The familiar `lsof -i :3000` matches a *local or remote* port of 3000. Your browser with an open tab on `localhost:3000`, an SSH tunnel and a `curl` that has not finished will all show up. Piping that into `kill -9` is how people end up killing their editor. Always add `-sTCP:LISTEN` when you intend to free a listening port."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: the listener and its owning process\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Resolve that PID to a name\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe equivalent\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\""
    },
    {
      "t": "h2",
      "x": "Kill it without collateral damage"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "kill 12345            # SIGTERM: runs your shutdown handler\nkill -9 12345         # SIGKILL: no cleanup, last resort\n\n# Linux: kill whatever holds the TCP port\nfuser -k 3000/tcp\n\n# One-liner, with the LISTEN filter that makes it safe\nkill $(lsof -t -iTCP:3000 -sTCP:LISTEN)"
    },
    {
      "t": "p",
      "x": "Start with `SIGTERM`. It gives the process a chance to close connections, flush logs and release the socket in order. `SIGKILL` is immediate and unconditional, and that is exactly the problem: any children the process spawned are not signalled at all, so a hard kill is one of the ways a port gets stuck in the first place. Reach for `-9` when `SIGTERM` has visibly failed, not before."
    },
    {
      "t": "p",
      "x": "Two situations call for a different approach entirely. If the PID belongs to another user, including `root`, you need `sudo` and you should check what the process is before you escalate. If it belongs to a managed service, stop the service rather than the process, because a supervisor will simply restart it: `sudo systemctl stop postgresql` or `brew services stop postgresql@16` instead of killing the PID on 5432. Our [PostgreSQL connection refused guide](/guides/postgres-connection-refused/) covers the opposite failure, when nothing is listening at all."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not pkill by name",
      "x": "`pkill -f node` and `killall node` are indiscriminate. On a modern developer machine they take out the TypeScript language server, an ESLint daemon, a Vite instance for another project and anything your editor runs in the background. Kill the PID you looked up."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the case that confuses people, because the server is clearly gone. The terminal returned, the process is no longer in your job list, and yet the next `npm run dev` fails on bind. There are four likely explanations and only one of them is the kernel."
    },
    {
      "t": "h3",
      "x": "A child process outlived its parent"
    },
    {
      "t": "p",
      "x": "Most dev setups are a stack of processes: a shell runs `npm`, which runs `nodemon` or `concurrently`, which runs your server. Ctrl-C delivers `SIGINT` to the foreground process group, which usually works. A crash does not. When the parent dies without signalling its children, the grandchild holding the socket is reparented and keeps running happily."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who owns the port, and who is its parent?\nps -o pid,ppid,etime,command -p $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# PPID 1 means the parent is gone and this process was reparented"
    },
    {
      "t": "p",
      "x": "A `PPID` of 1, or of a systemd user manager, is the signature of an orphan. The fix is upstream: make the wrapper forward signals, or run the server directly while you are debugging so there is one process to stop."
    },
    {
      "t": "h3",
      "x": "A fork inherited the listening socket"
    },
    {
      "t": "p",
      "x": "File descriptors are inherited across `fork` and, by default, across `child_process.spawn`. If your server was listening before it spawned a worker, a build watcher or a shell helper, that child holds a copy of the listening descriptor. Kill the parent and the socket stays open, owned by a child that has no idea it is a server. `cluster` workers behave the same way. This is why `lsof` sometimes reports a PID you have never heard of on your own port."
    },
    {
      "t": "h3",
      "x": "A suspended or debugger-held process"
    },
    {
      "t": "p",
      "x": "Ctrl-Z stops a process without ending it, and a stopped process keeps every socket it owns. Run `jobs` in the shell you were working in, then `fg` and stop it properly. Debug terminals in VS Code and JetBrains IDEs behave similarly: closing the panel does not always terminate the process underneath it."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT, which is usually not your problem"
    },
    {
      "t": "p",
      "x": "The folklore answer is that the socket sits in `TIME_WAIT` for a couple of minutes. That state is real, but it applies to connections that have been closed, not to the listening socket, and it only blocks a fresh `listen` when the program does not set `SO_REUSEADDR`. Node, Go and most modern HTTP servers set it for you, which is why your app typically restarts instantly after a clean exit. If you are writing sockets by hand in C or with raw `socket` calls in Python, you can hit it, and the fix is one line before `bind`."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   # do this before bind\ns.bind((\"127.0.0.1\", 3000))\ns.listen()"
    },
    {
      "t": "p",
      "x": "You can check whether `TIME_WAIT` is actually involved rather than assuming it. On Linux, `ss -tan state time-wait \"( sport = :3000 )\"` lists the lingering connections. If that comes back empty while the bind still fails, the cause is a live process and you should go back to `lsof`."
    },
    {
      "t": "h3",
      "x": "A container is still published on the port"
    },
    {
      "t": "p",
      "x": "Docker publishes ports in the host network namespace, so a stopped-looking container with a restart policy can keep reclaiming one. `docker ps -a` shows containers that are not running, and `docker port <container>` shows what a container publishes. A container stuck in a restart loop is a related problem, covered in [why your container exits immediately](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "h2",
      "x": "When the port is free and the bind still fails"
    },
    {
      "t": "p",
      "x": "Sometimes `lsof` and `ss` come back empty and the error persists. At that point stop looking for a process."
    },
    {
      "t": "ul",
      "items": [
        "**Windows reserved ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of TCP ports, and a reserved port is unusable even though nothing is listening. Check with `netsh interface ipv4 show excludedportrange protocol=tcp`. Windows often reports this as `An attempt was made to access a socket in a way forbidden by its access permissions` rather than as an in-use error.",
        "**macOS AirPlay Receiver.** On macOS Monterey and later, the AirPlay Receiver service listens on port 5000 and port 7000, which is why Flask tutorials stopped working for a lot of people. Turn it off in System Settings, under General, AirDrop and Handoff, or move your app to another port. Verify this against your own macOS version, since Apple has shuffled these settings between releases; this reflects what we could confirm as of October 2026.",
        "**Ports below 1024.** Binding port 80 or 443 as an ordinary user gives `EACCES`, not `EADDRINUSE`. Different error, different fix: use a high port behind a proxy, or grant the capability explicitly on Linux.",
        "**SO_REUSEPORT.** With this option, several processes can bind the same port on purpose and the kernel load-balances between them. You get no error and roughly half your requests go to a server you forgot about. If responses look inconsistent rather than broken, check for a second listener.",
        "**Antivirus and corporate agents.** Security tooling binds local ports for inspection proxies. These show up in `lsof` under names you will not recognise, and killing them is usually both futile and against policy."
      ]
    },
    {
      "t": "h2",
      "x": "Make the next crash cheaper"
    },
    {
      "t": "p",
      "x": "Freeing a port by hand is a two-command chore. Having to do it several times a day is a signal that the shutdown path is missing, and that is worth twenty minutes to fix."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const http = require('node:http');\n\nconst port = Number(process.env.PORT ?? 3000);\nconst server = http.createServer(handler);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is already in use. Set PORT to pick another.`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nconst shutdown = (signal) => {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n\n  // Keep-alive sockets will otherwise hold close() open.\n  // closeAllConnections is available in Node 18.2 and later.\n  server.closeAllConnections?.();\n\n  // Never hang forever waiting for a wedged connection.\n  setTimeout(() => process.exit(1), 10_000).unref();\n};\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}\n\nserver.listen(port, '127.0.0.1');"
    },
    {
      "t": "p",
      "x": "Three things are doing work there. The `error` handler turns a stack trace into a sentence a tired human can act on. The shutdown handler closes the listener and the idle keep-alive sockets, which is the part people miss: without `closeAllConnections`, `server.close()` waits for browser connections that have no intention of going away. The timeout guarantees the process exits even when a request is wedged, because a server that refuses to die is the thing that holds your port."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Let the OS choose in tests",
      "x": "Call `server.listen(0)` and read `server.address().port`. The kernel hands you a free ephemeral port, which removes a whole class of flaky CI failures when two suites run in parallel on the same machine."
    },
    {
      "t": "table",
      "head": [
        "Task",
        "macOS / Linux",
        "Windows (PowerShell)"
      ],
      "rows": [
        [
          "List the listener",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`"
        ],
        [
          "Get the PID only",
          "`lsof -t -iTCP:3000 -sTCP:LISTEN`",
          "`(Get-NetTCPConnection -LocalPort 3000).OwningProcess`"
        ],
        [
          "Stop it politely",
          "`kill <pid>`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Force it",
          "`kill -9 <pid>`",
          "`Stop-Process -Id <pid> -Force`"
        ],
        [
          "Check parentage",
          "`ps -o pid,ppid,command -p <pid>`",
          "`Get-CimInstance Win32_Process -Filter \"ProcessId=<pid>\"`"
        ],
        [
          "All listeners",
          "`ss -ltnp` or `lsof -nP -iTCP -sTCP:LISTEN`",
          "`Get-NetTCPConnection -State Listen`"
        ]
      ],
      "caption": "Substitute your own port for 3000. On Linux, `ss` needs root to show process names for sockets you do not own."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group, and the process holding the socket is often not in it: a child spawned by `nodemon`, a `cluster` worker, or a process that was reparented when its parent crashed. Run `ps -o pid,ppid,command -p $(lsof -t -iTCP:3000 -sTCP:LISTEN)`. A parent PID of 1 confirms an orphan. Genuine `TIME_WAIT` blocking is rare in Node and Go, because both set `SO_REUSEADDR` by default."
        },
        {
          "q": "Is kill -9 on a port safe?",
          "a": "It is safe for the machine and rough on your application. `SIGKILL` cannot be caught, so no shutdown handler runs: open transactions are abandoned, buffered logs are lost, temporary files stay behind, and any children are left running, which can leave the port busy anyway. Try `kill <pid>` first and give it a couple of seconds. The real risk is in the one-liners, where `lsof -i :3000` without `-sTCP:LISTEN` matches clients as well as servers."
        },
        {
          "q": "How do I find what is using port 3000 on Windows?",
          "a": "Use `Get-NetTCPConnection -LocalPort 3000 -State Listen` and pass the `OwningProcess` value to `Get-Process`. In `cmd.exe` the equivalent is `netstat -ano | findstr :3000` followed by `tasklist /FI \"PID eq <pid>\"`. If nothing is listening but the bind still fails, check `netsh interface ipv4 show excludedportrange protocol=tcp`, because Hyper-V and WSL2 reserve port ranges that no process appears to hold."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES?",
          "a": "`EADDRINUSE` means the address and port are taken. `EACCES` means you are not allowed to bind that address at all, which is what you get for ports below 1024 as a non-root user, and what Windows reports for a reserved port. The fixes are unrelated, so read the error code rather than assuming every failed bind is a stale process."
        },
        {
          "q": "Why does port 5000 fail on macOS?",
          "a": "The AirPlay Receiver service in macOS Monterey and later listens on 5000 and 7000. Confirm it with `lsof -nP -iTCP:5000 -sTCP:LISTEN`, which will show a system process rather than yours. You can disable AirPlay Receiver in System Settings under General, AirDrop and Handoff, or just move your dev server to a port like 5173 or 8080. Check the setting location against your macOS version."
        },
        {
          "q": "Should my app pick a free port automatically?",
          "a": "In tests and ephemeral tooling, yes: `listen(0)` asks the kernel for a free port and removes contention entirely. For a dev server, no. A port that moves on every restart breaks bookmarks, OAuth redirect URLs and proxy configuration, and it hides the fact that something is still running. Read the port from an environment variable, fail loudly when it is taken, and keep it stable."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and the restart loops that keep reclaiming a published port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite problem: nothing is listening where you expected it to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "When the server never gets as far as binding a port in the first place.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-09",
  "updated": "2026-10-09",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
