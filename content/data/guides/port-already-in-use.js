module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find What Is Holding Your Port",
  "h1": "Port already in use: find the process, then decide",
  "eyebrow": "Troubleshooting",
  "description": "Find what is holding port 3000 on Linux, macOS or Windows, why EADDRINUSE outlives a crash, and how to stop the process without killing the wrong one.",
  "standfirst": "The port is almost always held by a process that is still alive, often a child that outlived its parent. Identify it before you kill it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the process holding a port on any OS, then stop it cleanly instead of guessing with kill -9.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "To see who owns a port: `ss -ltnp 'sport = :3000'` on Linux, `lsof -nP -i :3000 -sTCP:LISTEN` on macOS, `netstat -ano | findstr :3000` on Windows. Each one prints a PID.",
        "A crashed process does not hold a port. Something is still running: usually a child that inherited the listening socket, a supervisor that already restarted the app, or a container still publishing the port.",
        "`TIME_WAIT` is rarely the cause on Linux or macOS, because Node, Go and most Python servers set `SO_REUSEADDR` on the listening socket. Windows is the exception.",
        "Send `SIGTERM` first and read the process name before you send anything. `kill -9` on the wrong PID is how a database loses its WAL.",
        "A port below 1024 that fails for an unprivileged user gives you `EACCES`, not `EADDRINUSE`. Different problem, different fix."
      ]
    },
    {
      "t": "h2",
      "x": "Find the owner of the port"
    },
    {
      "t": "p",
      "x": "Do this before anything else. The PID tells you whether you are looking at your own dev server, a forgotten `docker run`, or a system service that has every right to be there."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: fast and precise\nss -ltnp 'sport = :3000'\n\n# Linux or macOS: listening sockets only, no name resolution\nlsof -nP -i :3000 -sTCP:LISTEN\n\n# macOS fallback when you want the raw socket state\nnetstat -anv -p tcp | grep '\\.3000 '\n\n# Windows (cmd or PowerShell)\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\"\n\n# Windows, with the process name resolved for you\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess,\n    @{n='Name';e={(Get-Process -Id $_.OwningProcess).ProcessName}}"
    },
    {
      "t": "p",
      "x": "Two details in that output matter more than the rest. The local address tells you *which* address is taken: `127.0.0.1:3000` and `0.0.0.0:3000` are not the same binding, and a process bound to the wildcard address blocks every specific one. The PID column is what you act on. On macOS, `lsof` without `sudo` only shows processes owned by you, so an empty result is not proof the port is free."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "On a Mac, ports 5000 and 7000 are not yours",
      "x": "Since macOS Monterey, the AirPlay Receiver feature in Control Center listens on both. A Flask or ASP.NET app that defaults to 5000 will fail on a Mac and work everywhere else. Turn AirPlay Receiver off in System Settings, or move your app to another port. Do not kill the process; it will come back, and it is part of the OS."
    },
    {
      "t": "h2",
      "x": "What the error actually means"
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` comes from the kernel, not your framework. When a server calls `bind()` on an address and port pair that another socket already holds, the call fails with `EADDRINUSE` on POSIX systems and `WSAEADDRINUSE` on Windows. Everything above that is a translation layer. Node turns it into a thrown error with `code: 'EADDRINUSE'` and `syscall: 'listen'`; the numeric `errno` differs by platform, which is why you should match on the string and never on the number."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see",
        "Worth knowing"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` means the IPv6 wildcard, which usually covers IPv4 too. A specific host in the message means you bound to that host only."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 on Linux, 48 on macOS. Same condition."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "The `bind:` prefix tells you the syscall that failed, which saves a guess."
        ],
        [
          "Java / Spring Boot",
          "`java.net.BindException: Address already in use`",
          "Spring Boot wraps it: `Web server failed to start. Port 8080 was already in use.`"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "Wording around this line varies between daemon versions. The host port is taken, not the container port."
        ]
      ],
      "caption": "The same kernel error, five translations."
    },
    {
      "t": "p",
      "x": "One consequence of binding happening per address: you can run two servers on port 3000 at once, as long as one binds `127.0.0.1` and the other binds a specific LAN address. That is occasionally useful and more often the reason a colleague cannot reproduce your problem."
    },
    {
      "t": "h2",
      "x": "Why it survives a crash"
    },
    {
      "t": "p",
      "x": "This is the part that feels like the machine is lying to you. The terminal showed a stack trace, the prompt came back, and the port is still taken. The kernel is not holding a grudge. In nearly every case a process is still alive and still holding that socket, and there are four usual suspects."
    },
    {
      "t": "h3",
      "x": "A child process inherited the listening socket"
    },
    {
      "t": "p",
      "x": "This is the most common explanation and the least obvious. File descriptors survive `fork()`. If your server spawned a worker, a build watcher, a Puppeteer instance or anything else after it started listening, that child holds a duplicate of the listening descriptor. The parent dying does not close it. The socket stays bound until the last holder exits."
    },
    {
      "t": "p",
      "x": "You can see this directly: `lsof -i :3000` names a process you did not expect, with a PPID of `1` because its parent is gone and init adopted it. Zombie processes are not the cause here, incidentally. A zombie has already released its descriptors and keeps only an entry in the process table, so it cannot hold a port."
    },
    {
      "t": "h3",
      "x": "Something restarted the app before you looked"
    },
    {
      "t": "p",
      "x": "`nodemon`, `tsx watch`, `pm2`, `systemd` with `Restart=always`, Docker with `--restart unless-stopped`, a Kubernetes probe, or a VS Code debug session that is still attached. Your crash was real; the restart was faster than you were. The giveaway is that the PID changes every time you check it. Fix the supervisor, not the port."
    },
    {
      "t": "h3",
      "x": "A container is still publishing the port"
    },
    {
      "t": "p",
      "x": "`docker ps` only shows running containers, so a restarting one can be easy to miss. Check `docker ps -a --format '{{.Names}}\\t{{.Status}}\\t{{.Ports}}'` and look for a published host port. On Linux the Docker proxy binds the host port, so `ss -ltnp` attributes it to `docker-proxy` or `dockerd` rather than anything recognisable from your project."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT, which usually gets blamed unfairly"
    },
    {
      "t": "p",
      "x": "The folklore answer is that closed sockets linger in `TIME_WAIT` for up to two minutes and keep the port busy. That is true for the *connection* four-tuple, but it does not normally stop a new server from listening, because libuv, the Go runtime and Python's `socketserver` with `allow_reuse_address` all set `SO_REUSEADDR` before binding. That flag exists precisely so a restarted server can reclaim its port while old connections drain."
    },
    {
      "t": "p",
      "x": "Two caveats. Windows does not work this way: libuv uses `SO_EXCLUSIVEADDRUSE` there, and a lingering socket genuinely can block a rebind. And raw Python code that creates its own socket without setting `SO_REUSEADDR` will hit the classic version of this problem. If you are on Linux or macOS and the port is busy, look for a live process first; `TIME_WAIT` should be your last hypothesis, not your first."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "WSL2 and Hyper-V reserve ranges you cannot see",
      "x": "On Windows with Hyper-V or WSL2 enabled, the OS reserves blocks of ports for dynamic use, and a bind inside those blocks fails with no process to blame. Run `netsh interface ipv4 show excludedportrange protocol=tcp` as administrator to list them. If your port is inside a reserved range, move the app or reserve the port explicitly with `netsh int ipv4 add excludedportrange`."
    },
    {
      "t": "h2",
      "x": "Kill it, carefully"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Look at the process before you touch it",
          "x": "The command line, the user and the elapsed time tell you whether this is your stale dev server or something you will regret stopping.",
          "code": "PID=$(lsof -t -i :3000 -sTCP:LISTEN | head -1)\nps -p \"$PID\" -o pid,ppid,user,etime,command"
        },
        {
          "title": "Ask it to stop",
          "x": "Plain `kill` sends `SIGTERM`, which lets the process run its shutdown handlers, flush logs and close database connections.",
          "code": "kill \"$PID\""
        },
        {
          "title": "Check whether it actually went",
          "x": "`kill -0` sends no signal; it only tests whether you could. If the PID is gone, you are done.",
          "code": "kill -0 \"$PID\" 2>/dev/null && echo \"still alive\" || echo \"gone\""
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught, so nothing gets cleaned up. It is the right tool for a wedged dev server and the wrong tool for anything holding state.",
          "code": "kill -9 \"$PID\""
        },
        {
          "title": "If the port frees and is taken again, kill the group",
          "x": "That pattern means children are involved. Signalling the negative PGID hits the whole process group, parent and inherited children together.",
          "code": "kill -TERM -\"$(ps -o pgid= -p \"$PID\" | tr -d ' ')\""
        }
      ]
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: one shot, kills every process with the port open\nfuser -k 3000/tcp\n\n# Cross platform, nothing to install, slower\nnpx kill-port 3000\n\n# Windows\ntaskkill /PID 12345 /F\n\n# Windows, by port, in PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Never pipe a port lookup straight into kill -9 in a shared environment",
      "x": "Aliases like `killport() { kill -9 $(lsof -t -i:$1); }` are fine on a laptop and dangerous on a build agent or a shared host, where the PID on that port may belong to another tenant's job or to a service the box needs. Print the process first. The two seconds you save are not worth the incident."
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "A dev server that shuts down properly almost never leaves its port behind. The fix is a signal handler that closes the listener, plus a deadline so a stuck connection cannot keep the process alive forever."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(3000);\n\nfor (const sig of ['SIGINT', 'SIGTERM']) {\n  process.once(sig, () => {\n    server.close(() => process.exit(0));\n    // Node 18.2+. Idle keep-alive sockets otherwise delay close().\n    server.closeIdleConnections?.();\n    // Hard deadline so a hung request cannot hold the port.\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "Three more habits worth the small effort. Handle the error instead of letting it crash the process, so the message says something useful. Let the OS pick the port for tests, which removes the conflict entirely. And give every service in a monorepo a distinct, documented port, because two projects both defaulting to 3000 is a conflict waiting for the day you run them together."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "server.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${PORT} is busy. Run: lsof -nP -i :${PORT} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\n// Port 0 asks the kernel for any free port. Ideal for tests.\nconst t = app.listen(0, () => console.log('listening on', t.address().port));"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "If you are about to change the port, ask why",
      "x": "Moving to 3001 is a legitimate fix when you genuinely need two servers running. It is a bad fix when a stale process is quietly serving an old build, because you will spend the next hour debugging code that is not running. Confirm the port is free for the right reason."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of this story: the container that will not stay up long enough to hold a port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Connection refused is the opposite symptom: nothing is listening where you expect.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node: cannot find module",
          "desc": "When the crash that orphaned your child process was a failed import.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is running on port 3000?",
          "a": "On Linux or macOS: `lsof -t -i :3000 -sTCP:LISTEN` gives you the PID, then `kill <pid>`, then `kill -9 <pid>` only if it ignores the first signal. On Windows: `netstat -ano | findstr :3000` for the PID, then `taskkill /PID <pid> /F`. `npx kill-port 3000` does the same thing on any platform if you do not want to remember the flags. Look at the process name first, every time."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is running?",
          "a": "Something is running, it just is not what you are looking for. The usual answer is a child process that inherited the listening socket from the server that crashed, so it still holds the port with a parent PID of 1. Second most likely is a supervisor such as nodemon, pm2 or systemd that restarted the app before you checked. Run `lsof -nP -i :3000` and read the process name; it is rarely the one you expected."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "On a local dev server, usually yes. `SIGKILL` cannot be caught, so the process gets no chance to flush writes, finish in-flight requests or remove lock files. For a database, a message broker or anything mid-write, that can mean recovery work or lost data on restart. Send `SIGTERM` first and give it a second or two. Reserve `-9` for processes that have genuinely stopped responding."
        },
        {
          "q": "Does TIME_WAIT keep my port busy after a restart?",
          "a": "Usually not on Linux or macOS. Node, Go and most Python server frameworks set `SO_REUSEADDR` before binding, which exists specifically so a restarted server can reclaim its port while old connections drain. Windows is different, because libuv uses `SO_EXCLUSIVEADDRUSE` there and a lingering socket really can block the rebind. Hand-written socket code that never sets `SO_REUSEADDR` hits the classic version of this on every platform."
        },
        {
          "q": "Why does port 5000 fail on my Mac but work on Linux?",
          "a": "The AirPlay Receiver feature in Control Center listens on ports 5000 and 7000 on recent macOS versions. Flask and ASP.NET both default to 5000, so the collision is common. Disable AirPlay Receiver in System Settings, or change your app's port. Killing the process is pointless because the OS restarts it."
        },
        {
          "q": "Why does Docker say the port is already allocated?",
          "a": "The host port in your `-p` mapping is taken, not the container port. Check `docker ps -a` for a stopped or restarting container with the same published port, then look at the host itself with `ss -ltnp`. On Linux the published port is held by `docker-proxy` or `dockerd`, so the owning process name will not resemble your application at all."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-20",
  "updated": "2026-10-20",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/gdpr-compliance-software/",
    "/reviews/soc-2-compliance-software/"
  ]
};
