module.exports = {
  "slug": "port-already-in-use",
  "title": "Port Already in Use: Find the Owner and Free It",
  "h1": "EADDRINUSE: find what is holding the port",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something already owns the port. Find the process with lsof, ss or netstat, stop it cleanly, and fix what keeps leaving it behind.",
  "standfirst": "Identify the process before you kill anything. Then deal with the reason a dead server is still listening: an inherited socket, an orphaned child of a file watcher, or a supervisor that already restarted it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port in use"
  ],
  "cardDesc": "Find the process on the port, stop it cleanly, and understand why a crashed server can still hold the socket.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is the kernel refusing your `bind()` call. A socket already owns that address and port pair, so retrying changes nothing.",
        "Linux and macOS: `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Windows: `netstat -ano | findstr :3000`, then look up the PID.",
        "Read the process name before you kill it. Port 5432 belonging to `postgres` is your database, not a stale dev server.",
        "After a crash, the usual owner is a surviving child process that inherited the listening descriptor. `TIME_WAIT` gets blamed far more often than it deserves.",
        "A port below 1024 fails with `EACCES`, not `EADDRINUSE`. Different cause, different fix."
      ]
    },
    {
      "t": "h2",
      "x": "What the error is actually telling you"
    },
    {
      "t": "p",
      "x": "One socket at a time may be bound to a given address and port, unless every socket involved opts into sharing. Your process asked for an address that is taken, the `bind()` call failed, and the runtime turned that errno into whatever string you are now staring at. It is not a startup race you can paper over with a sleep and a retry."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What the failure looks like"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use` on Linux, errno 48 on macOS"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:8080 failed: port is already allocated`"
        ]
      ],
      "caption": "The same underlying errno, reported differently. Linux numbers it 98 and macOS numbers it 48."
    },
    {
      "t": "p",
      "x": "The address in the message matters. `:::3000` is the IPv6 wildcard, `0.0.0.0:3000` is the IPv4 wildcard, and on a dual-stack Linux host the IPv6 wildcard covers IPv4-mapped traffic too, so those two overlap. A wildcard listener also overlaps a specific one on `127.0.0.1:3000`. Whether the second bind is permitted depends on the socket options both sides set and on the platform, so treat \"but I bound a different address\" as something to verify rather than something to assume."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux and macOS: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Every socket on that port, listeners and live connections alike\nlsof -nP -i:3000\n\n# Linux, including the owning PID and program name\nss -ltnp 'sport = :3000'\n\n# Just the PID, for scripting\nlsof -ti:3000\n\n# Another user's process is invisible without privileges\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "`lsof` prints the command name in the first column. Look at it. Developers lose an afternoon to this when they kill the PID on 5432 or 6379 and take out Postgres or Redis instead of the API they meant to restart."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: the process behind the listener\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Command Prompt: PID is the last column\nnetstat -ano | findstr :3000\n\n# Then stop it by PID\ntaskkill /PID 12345 /F"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "One-liners that kill the wrong thing",
      "x": "`fuser -k 3000/tcp` and `npx kill-port 3000` both work, and both skip the identification step entirely. They will cheerfully terminate a database, an SSH tunnel or a colleague's process on a shared box. Use them when you already know what is listening."
    },
    {
      "t": "h2",
      "x": "Stop it without breaking something else"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify the owner",
          "x": "Get the PID and the command name together, plus how long it has been running. An uptime of three days is a clue that this is not the server you started ten minutes ago.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN\nps -o pid,ppid,stat,etime,command -p 12345"
        },
        {
          "title": "Ask it to exit",
          "x": "Plain `kill` sends `SIGTERM`. A well-behaved server closes its listener, finishes in-flight requests and exits. Most of the time this is all you need.",
          "code": "kill 12345"
        },
        {
          "title": "Confirm the port is free",
          "x": "Re-run the lookup. Empty output means the socket is gone. Do not skip this: if the port is still held, the next step depends on why.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught, so the process gets no chance to flush writes, release locks or remove temp files. That is a real cost, not a formality. It is also the right call for a hung process that has stopped responding to anything else.",
          "code": "kill -9 12345"
        },
        {
          "title": "If a new PID appears, find the supervisor",
          "x": "A port that frees for a second and is immediately taken again by a different PID means something is restarting it. Check your process manager before you keep killing children.",
          "code": "systemctl status myapp\npm2 list\ndocker ps --filter \"publish=3000\""
        }
      ]
    },
    {
      "t": "p",
      "x": "When a watcher left a cluster of processes behind, killing the group is faster than killing one at a time. A negative PID targets a process group: `kill -TERM -12345` signals every member of group 12345. Get the group id from `ps -o pgid= -p 12345`."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people, and the answer is simple once you see it. A listening socket survives as long as any file descriptor refers to it. The kernel reclaims the port when the last descriptor closes, and descriptors are inherited across `fork()`. If your server spawned anything before it died, that child holds a copy of the listener, and your terminal going quiet told you nothing about whether the socket closed."
    },
    {
      "t": "ul",
      "items": [
        "**A file watcher's grandchild.** `nodemon`, `tsx watch`, `vite` and friends run your app as a child process. Kill the wrapper hard enough and the app underneath survives, gets reparented to `init` or `systemd`, and keeps listening with no visible parent.",
        "**A deliberately detached process.** `spawn(cmd, { detached: true })`, a trailing `&` in a shell script, or anything started inside a tmux pane you later closed.",
        "**Cluster or worker processes.** With `cluster` or a prefork server, the primary dying does not close the workers' inherited sockets.",
        "**A supervisor that already restarted it.** pm2, `systemd` with `Restart=always`, a Docker restart policy, or a Kubernetes pod that came back before you looked. The port is in use because the replacement is already running.",
        "**Docker publishing the port.** The host-side owner shows up as `docker-proxy` or the Docker Desktop backend, not your container. Stop the container, not the proxy.",
        "**The debugger.** Node's inspector holds 9229 separately from your application port, so `EADDRINUSE` on 9229 usually means a second debug session."
      ]
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Orphans betray themselves with PPID 1\nps -eo pid,ppid,etime,command | grep -i '[n]ode'\n\n# The parent of whatever holds the port\nps -o pid,ppid,command -p \"$(lsof -ti:3000)\"\n\n# Which container publishes it?\ndocker ps --filter \"publish=3000\""
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT story, and when it is true"
    },
    {
      "t": "p",
      "x": "Search for this error and you will be told that `TIME_WAIT` holds the port for 60 seconds and you simply have to wait it out. For the case most people are in, that is wrong, and believing it costs you the ten seconds it would have taken to find the live process."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to the socket of a connection that has closed, identified by its full four-tuple, not to a listening socket. It can block a fresh `bind()` on the same port, but only when the new socket has not set `SO_REUSEADDR`. Node, Go and most modern server libraries set that option for TCP listeners by default on Unix platforms. Python's `HTTPServer` sets `allow_reuse_address`. So when a Node process reports `EADDRINUSE`, a genuine listener is nearly always still alive somewhere."
    },
    {
      "t": "p",
      "x": "Where the lingering-socket explanation does hold: hand-rolled socket code that never calls `setsockopt(SO_REUSEADDR)`, which is common in tutorials and in C written from memory. Add the option and the symptom disappears. A separate failure worth not confusing with this one is ephemeral port exhaustion on the client side, from churning through thousands of short connections. That usually surfaces as `EADDRNOTAVAIL`, and the fix is connection reuse or a wider ephemeral range, not a `kill` command."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reach for the sysctl knobs",
      "x": "`net.ipv4.tcp_tw_recycle` is the classic bad advice here. It broke connections from clients behind NAT by rejecting packets with out-of-order timestamps, and it was removed from the Linux kernel in 4.12, so on any current kernel you are copying a flag that no longer exists. `net.ipv4.tcp_tw_reuse` is narrower and safer but applies to outgoing connections, and neither one has any business being touched to restart a development server."
    },
    {
      "t": "h2",
      "x": "SO_REUSEADDR and SO_REUSEPORT are not the same thing"
    },
    {
      "t": "p",
      "x": "Two options, one letter apart, and the difference explains a particularly nasty class of bug."
    },
    {
      "t": "table",
      "head": [
        "Option",
        "What it permits",
        "What it does not do"
      ],
      "rows": [
        [
          "`SO_REUSEADDR`",
          "Binding a port that has connections lingering in `TIME_WAIT`, and some overlapping wildcard or specific-address combinations",
          "Let two live listeners share a port on Linux"
        ],
        [
          "`SO_REUSEPORT`",
          "Several sockets listening on the same port at once, with the kernel spreading new connections between them",
          "Protect you from accidentally running two copies of your server"
        ]
      ],
      "caption": "SO_REUSEPORT is available on Linux 3.9 and later and on the BSDs, including macOS."
    },
    {
      "t": "p",
      "x": "If both the stale process and the new one set `SO_REUSEPORT`, you get no error at all. Your server starts, looks healthy, and roughly half the requests are answered by the old build. Symptoms: responses that alternate between stale and fresh, a fix that works on some reloads, logs that only show some of the traffic. Check for two listeners on the port before you question your own code."
    },
    {
      "t": "p",
      "x": "Node exposes a `reusePort` option on `server.listen()` in recent releases. Confirm it against the `net` documentation for the exact version you are running rather than trusting a blog post, including this one."
    },
    {
      "t": "h2",
      "x": "When nothing is listening but the bind still fails"
    },
    {
      "t": "p",
      "x": "Sometimes `lsof` comes back empty and the port is still refused. There are a handful of real causes."
    },
    {
      "t": "h3",
      "x": "macOS reserves 5000 and 7000 for AirPlay"
    },
    {
      "t": "p",
      "x": "Since macOS Monterey, the AirPlay Receiver feature listens on ports 5000 and 7000, which is why a Flask app on 5000 suddenly stopped working after an OS upgrade. `lsof` shows the owner as `ControlCe`. Turn off AirPlay Receiver in System Settings under General, or move your app to another port. Moving the app is the better habit."
    },
    {
      "t": "h3",
      "x": "Windows excluded port ranges"
    },
    {
      "t": "p",
      "x": "Hyper-V and WinNAT reserve blocks of dynamic ports, and a reserved block refuses binds even with nothing listening in it. This is the usual explanation for a Windows machine where a port worked yesterday and does not today."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Is your port inside a reserved block?\nnetsh interface ipv4 show excludedportrange protocol=tcp\n\n# Common workaround: restart the NAT driver, which re-rolls the ranges\nnet stop winnat\nnet start winnat"
    },
    {
      "t": "h3",
      "x": "Privileged ports give you EACCES instead"
    },
    {
      "t": "p",
      "x": "Ports below 1024 need elevated privileges on Unix systems. Binding 80 as a normal user produces `listen EACCES: permission denied 0.0.0.0:80`, which is a permission problem wearing similar clothing. Running your dev server under `sudo` works and is a bad trade. Use a high port with a reverse proxy in front, or grant the capability narrowly with `setcap cap_net_bind_service=+ep` on the binary."
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Two small pieces of code remove most repeat occurrences: a signal handler that actually closes the listener, and an error handler that says something useful instead of dumping a stack trace."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const PORT = Number(process.env.PORT) || 3000;\nconst server = app.listen(PORT, () => console.log(`listening on ${PORT}`));\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${PORT} is in use. Is another copy already running?`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nlet closing = false;\nfunction shutdown(signal) {\n  if (closing) return;\n  closing = true;\n  console.log(`${signal} received, closing server`);\n\n  server.close(() => process.exit(0));\n  server.closeIdleConnections?.();   // release idle keep-alive sockets\n\n  // Never hang forever on one stuck connection.\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "`server.close()` stops accepting new connections and then waits for existing ones to finish. With HTTP keep-alive, idle browser connections can keep that promise unfulfilled for as long as the timeout allows, which is why a shutdown that looks hung usually is not deadlocked at all. `closeIdleConnections()` and `closeAllConnections()` exist for exactly this, and were added in a Node 18 patch release, so check availability if you support older runtimes. The optional-call syntax above degrades quietly if the method is missing."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Let the kernel pick the port in tests",
      "x": "`server.listen(0)` binds a free ephemeral port, and `server.address().port` tells you which one. Test suites that hardcode 3000 collide with each other, with the dev server, and with themselves under a parallel test runner. This one change eliminates a whole category of flaky CI failure."
    },
    {
      "t": "p",
      "x": "For containers, publish the port only where you need it. Binding `127.0.0.1:3000:3000` instead of `3000:3000` keeps the service off your network interfaces and makes collisions with other containers easier to reason about. Our notes on [containers that exit immediately](/guides/docker-container-exits-immediately/) cover the related case where the process dies and the port frees itself before you can look."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "Find it first with lsof -nP -iTCP:3000 -sTCP:LISTEN on Linux or macOS, or netstat -ano | findstr :3000 on Windows. Check the command name in the output, then send a normal kill to that PID and verify the port is free. Reserve kill -9 for a process that ignored SIGTERM."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group, which is often a watcher rather than your server. If the app was spawned detached, or the watcher was killed without passing the signal on, the child keeps the inherited listening socket and gets reparented to init. Look for a process whose PPID is 1."
        },
        {
          "q": "Does TIME_WAIT cause EADDRINUSE?",
          "a": "Rarely, in a modern stack. TIME_WAIT blocks a rebind only when the new socket lacks SO_REUSEADDR, and Node, Go and most server libraries set it by default on Unix. Hand-written socket code that omits setsockopt(SO_REUSEADDR) is the real case. Do not touch tcp_tw_recycle: it was removed from Linux in 4.12 and broke clients behind NAT."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "It is safe for your machine and unkind to the process. SIGKILL cannot be caught, so there is no chance to flush buffered writes, release a lock file or clean up temp state. Try SIGTERM first; use SIGKILL for something genuinely hung."
        },
        {
          "q": "Why does macOS say port 5000 is in use when nothing is running?",
          "a": "AirPlay Receiver has listened on 5000 and 7000 since macOS Monterey, and lsof shows the owner as ControlCe. Disable AirPlay Receiver in System Settings under General, or move your app to a different port, which is the more durable choice."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on listen?",
          "a": "EADDRINUSE means the address is taken by another socket. EACCES means you are not allowed to bind it, almost always a port below 1024 without privileges. For EACCES, use a high port behind a proxy or grant cap_net_bind_service rather than running the server as root."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and why the logs usually name the cause.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Postgres connection refused",
          "desc": "Work outward layer by layer when the database will not accept a connection.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnose and fix CORS errors",
          "desc": "Why the browser blocked the request, and which end has to change.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-07",
  "updated": "2026-10-07",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
