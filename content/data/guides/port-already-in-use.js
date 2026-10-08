module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That’s Still in Use",
  "h1": "Port already in use: find the process, then free it",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding a port, stop it safely, and understand why EADDRINUSE outlives a crashed server.",
  "standfirst": "EADDRINUSE almost always means a live process is still listening, not that the kernel is holding a stale socket. Here is how to identify the owner on Linux, macOS and Windows, and how to stop leaving orphans behind.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the process holding a port, stop it cleanly, and fix the crash pattern that keeps orphaning listeners.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The error means some socket already owns that address and port combination. Nothing is corrupt.",
        "Find the owner before you kill anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on Linux or macOS, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the usual culprit is an orphaned child process that outlived the shell or task runner that spawned it.",
        "`TIME_WAIT` gets blamed far more often than it earns. A live `LISTEN` socket is the ordinary cause.",
        "Send `SIGTERM` first. `kill -9` skips every cleanup handler and can leave lock files, half-written data and stale sockets behind.",
        "The durable fix is a shutdown handler that closes the server when the process is asked to stop."
      ]
    },
    {
      "t": "h2",
      "x": "Read the message before you kill anything"
    },
    {
      "t": "p",
      "x": "Each runtime words this differently, but they all report the same `errno`: `EADDRINUSE` on POSIX systems, which is error 98 on Linux and 48 on macOS. The text usually tells you the exact address that failed, and that detail matters more than the stack trace underneath it."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see",
        "What it adds"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` is the IPv6 wildcard. A bare `0.0.0.0:3000` means IPv4 only."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 48 on macOS. Flask and Django wrap it in their own banner."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "Shows the literal address string passed to `net.Listen`."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Spring Boot prints a separate hint block naming the port."
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Often a second nginx instance, or Apache already on 80."
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "A published container port, not a process inside the container."
        ]
      ],
      "caption": "The same kernel refusal, reported six ways."
    },
    {
      "t": "p",
      "x": "Note the address, not just the port number. A process bound to `127.0.0.1:3000` and one trying to bind `0.0.0.0:3000` are asking for overlapping territory, so the second one fails even though the addresses look different in the two log lines. The precise overlap rules vary between Linux, the BSDs and Windows, which is why the same two services can coexist on one machine and clash on another."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EADDRINUSE is not EACCES",
      "x": "If you are binding a port below 1024 as an unprivileged user, the error is `EACCES` (permission denied), not `EADDRINUSE`. On Linux the boundary is controlled by `net.ipv4.ip_unprivileged_port_start`. Mixing these two up sends people hunting for a phantom process when they needed `CAP_NET_BIND_SERVICE` or a reverse proxy."
    },
    {
      "t": "h2",
      "x": "Find the process that holds the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux or macOS: listening sockets on port 3000, numeric output\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux: ss is faster and ships with iproute2\nss -ltnp \"sport = :3000\"\n\n# Linux: just the PIDs, ready to pipe\nfuser 3000/tcp\n\n# macOS without lsof installed\nnetstat -anv | grep LISTEN | grep 3000\n\n# Windows, cmd\nnetstat -ano | findstr :3000\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess |\n  Format-Table"
    },
    {
      "t": "p",
      "x": "Two traps here. `lsof` without `sudo` shows only processes owned by you, so a service started by `root` or by another account looks invisible; the same applies to the `-p` flag on `ss`, which silently omits PIDs it cannot read. And `lsof -i :3000` with no state filter also lists outbound connections that happen to use 3000 as a remote port, which is noise. Filter on `LISTEN`."
    },
    {
      "t": "p",
      "x": "Once you have a PID, get its full story before deciding what to do with it. The parent process is the most useful column, because it tells you whether you are looking at a service, a shell job or an orphan."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "ps -o pid,ppid,user,etime,command -p 48213\n\n# On Windows\nGet-Process -Id 48213 | Format-List Name, Path, StartTime"
    },
    {
      "t": "p",
      "x": "A `ppid` of 1 means the parent is gone and `init` or `launchd` adopted the process. That is an orphan, and it is the signature of the crash case covered below. If `ppid` points at a live `npm`, `pnpm`, `nodemon` or IDE process, stop that supervisor instead, or it will respawn the child the moment you kill it."
    },
    {
      "t": "h2",
      "x": "Stop it in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask politely",
          "x": "Plain `kill` sends `SIGTERM`, which gives the process a chance to flush writes, close connections and remove its own PID file. Most well-behaved servers exit within a second.",
          "code": "kill 48213"
        },
        {
          "title": "Check whether it actually went",
          "x": "Re-run your lookup. A process that ignores `SIGTERM` is usually stuck in a handler or blocked on I/O.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if needed",
          "x": "`SIGKILL` cannot be caught, so no cleanup code runs. Use it on a dev server without hesitation. Think twice before using it on anything holding state.",
          "code": "kill -9 48213"
        },
        {
          "title": "Or do it in one line",
          "x": "Convenient, and worth understanding: `fuser -k` defaults to `SIGKILL`, and the `kill-port` package shells out to the same platform tools you just ran.",
          "code": "fuser -k -TERM 3000/tcp    # Linux, polite version\nnpx kill-port 3000         # cross-platform helper"
        }
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Pattern matching kills more than you meant",
      "x": "`pkill -f node` will take down every Node process on the machine, including your editor’s language server and anything a colleague is running on a shared box. Preview the match with `pgrep -af node` first, and prefer the specific PID you already found."
    },
    {
      "t": "p",
      "x": "On Windows the equivalents are `taskkill /PID 48213` and, when that is refused, `taskkill /PID 48213 /F`. In PowerShell, `Stop-Process -Id 48213` then `-Force`. One Windows-specific wrinkle: if the PID is 4, the holder is the `System` process, which usually means a driver or a service such as IIS or WinNAT reserved that port range, and killing it is not an option. `netsh interface ipv4 show excludedportrange protocol=tcp` shows reserved ranges, and a Hyper-V or Docker Desktop reservation is the common reason a port you never used refuses to bind."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part people find mysterious, and the explanation is almost never the network stack. It is process lifecycle. A crashed or force-killed parent does not take its children with it, and the child is the one holding the socket."
    },
    {
      "t": "ul",
      "items": [
        "**Orphaned children.** `npm run dev` spawns a shell, which spawns your server. Kill the top of that tree with `SIGKILL` and the grandchild never receives a signal at all. It keeps the listening socket and gets reparented to PID 1.",
        "**`Ctrl+Z` instead of `Ctrl+C`.** `SIGTSTP` suspends the process. It is still alive, still bound, just not running. Check with `jobs`, then `kill %1` or bring it back with `fg`.",
        "**The terminal closed but the process did not.** Anything started with `&`, `nohup`, `disown`, `setsid` or inside `tmux` survives the window you launched it from.",
        "**A watcher restarting too fast.** `nodemon`, `vite`, `air` and friends can start the replacement before the old process has released the port, which produces an `EADDRINUSE` that clears itself on the next save.",
        "**A debugger paused at a breakpoint.** The process is fully alive and holding the port. Detaching the debugger is not the same as stopping the program.",
        "**A supervisor doing its job.** `systemd` with `Restart=always`, PM2, or a Kubernetes liveness probe will bring the service straight back. `systemctl status myapp` tells you quickly; stop the unit rather than the process.",
        "**A container you forgot.** `docker ps` is a two-second check and catches a surprising share of these."
      ]
    },
    {
      "t": "p",
      "x": "There is a second-order version of this worth knowing about. A listening socket inherited by a forked child stays open as long as that child lives, even after the parent exits. So a server that spawns a worker without setting the socket to close on exec can hand the port to a process that has no idea it owns it. If the holder is something implausible, such as a one-off script or a long-finished test runner, inheritance is usually the reason."
    },
    {
      "t": "h2",
      "x": "What TIME_WAIT actually does, and what it does not"
    },
    {
      "t": "p",
      "x": "The most repeated answer on the internet is that you must wait 60 seconds for `TIME_WAIT` to expire. For a typical server restart, that advice is wrong, and following it wastes a minute of your life per occurrence."
    },
    {
      "t": "p",
      "x": "Here is the mechanism. When one side closes a TCP connection first, its socket sits in `TIME_WAIT` for roughly twice the maximum segment lifetime, so that late duplicate packets cannot be mistaken for part of a new connection reusing the same four-tuple. On Linux that duration is a compile-time constant of about a minute and is not tunable with a sysctl. Those sockets are *connected* sockets, though. They are not listeners."
    },
    {
      "t": "p",
      "x": "Nearly every server sets `SO_REUSEADDR` before binding, which specifically permits a fresh listener to bind a port that has lingering `TIME_WAIT` entries. Node does this by default through libuv on Unix-like platforms. It deliberately does not on Windows, where the option’s semantics let an unrelated process hijack a live socket. The practical test is one command."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Distinguish a live listener from leftover connections\nss -tanp '( sport = :3000 or dport = :3000 )'\n\n# LISTEN  -> a process owns the port right now. Find it and stop it.\n# TIME_WAIT -> closed connections. A SO_REUSEADDR listener can bind anyway."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reach for the TIME_WAIT sysctls",
      "x": "`net.ipv4.tcp_tw_recycle` was removed from Linux in 4.12 because it broke connections from clients behind NAT. Setting `SO_LINGER` to zero to dodge `TIME_WAIT` makes close send an `RST`, which discards data still in flight. If `TIME_WAIT` really is your constraint, the problem is connection churn in the application, and that is where to fix it."
    },
    {
      "t": "h2",
      "x": "Docker publishes ports, so Docker holds them"
    },
    {
      "t": "p",
      "x": "When `docker run -p 3000:3000` fails, the conflict is on the host, and the host-side holder may not look like anything you recognise. Depending on the daemon’s userland proxy setting, `lsof` reports a `docker-proxy` process. Killing that is the wrong move: it is managed by the daemon and the container is the real owner."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container published what\ndocker ps --format 'table {{.Names}}\\t{{.Ports}}'\n\n# Ports for one container\ndocker port my-api\n\n# Release them\ndocker stop my-api          # or\ndocker compose down"
    },
    {
      "t": "p",
      "x": "Two environment-specific cases cause real confusion. On recent macOS releases, AirPlay Receiver listens on port 5000, which is also the Flask development server default, so a brand new Flask app fails on a machine where nothing of yours is running; the listener shows up as `ControlCenter` and the toggle lives in System Settings under General, AirDrop and Handoff. Verify that against your own macOS version, since Apple has moved both the port and the setting between releases. Under WSL2, localhost traffic is forwarded between Windows and the Linux VM, so a Windows process on 3000 can block a bind inside WSL and the reverse also happens."
    },
    {
      "t": "h2",
      "x": "Stop generating orphans"
    },
    {
      "t": "p",
      "x": "Finding and killing a process is a workaround you will repeat forever unless the shutdown path gets fixed. A server should close its listener when asked to stop, and the asking usually arrives as `SIGTERM` or `SIGINT`."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nfunction shutdown(signal) {\n  return () => {\n    console.log(`${signal} received, closing listener`);\n\n    server.close((err) => {\n      if (err) {\n        console.error(err);\n        process.exit(1);\n      }\n      process.exit(0);\n    });\n\n    // server.close() waits for in-flight requests. Keep-alive sockets can\n    // hold it open indefinitely, so cap the wait.\n    // Node 18.2 and later also offer server.closeAllConnections();\n    // check it exists in your version before relying on it.\n    setTimeout(() => {\n      console.error('forcing exit after 10s');\n      process.exit(1);\n    }, 10_000).unref();\n  };\n}\n\nprocess.on('SIGTERM', shutdown('SIGTERM'));\nprocess.on('SIGINT', shutdown('SIGINT'));"
    },
    {
      "t": "ul",
      "items": [
        "**Do not retry the bind on `EADDRINUSE`.** A loop that waits and tries again hides the conflict and, in the worst case, steals the port from the process that is trying to start cleanly.",
        "**Bind port 0 in tests.** The kernel assigns a free ephemeral port, and `server.address().port` tells you which. Parallel test runners stop fighting each other immediately.",
        "**Make the port configurable.** Reading `PORT` from the environment means a clash is a one-variable workaround rather than a code edit.",
        "**Use `exec` in container entrypoints.** `exec node server.js` replaces the shell so your app runs as PID 1 and actually receives `SIGTERM` from `docker stop`, instead of being killed 10 seconds later."
      ]
    },
    {
      "t": "p",
      "x": "That last point explains a lot of unexplained orphans in containerised setups. A shell-form `CMD` leaves `/bin/sh` as PID 1, signals stop there, and the application gets `SIGKILL`ed on timeout with no chance to close anything."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find out what is using port 3000?",
          "a": "On Linux or macOS: lsof -nP -iTCP:3000 -sTCP:LISTEN, prefixed with sudo if the owner might be another user. On Linux, ss -ltnp \"sport = :3000\" does the same job faster. On Windows: netstat -ano | findstr :3000, then Get-Process -Id with the PID from the last column."
        },
        {
          "q": "Why is the port still in use when lsof shows nothing?",
          "a": "Four common reasons. The process belongs to another user and you did not use sudo. It is a Docker published port, so check docker ps. You are in WSL or a VM and the holder is on the other side of the localhost forwarder. Or the real error was EACCES on a privileged port, which no amount of process hunting will fix."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "On a development server, yes. SIGKILL cannot be caught, so nothing flushes buffers, removes lock files or closes connections cleanly. For a database, a message broker or anything mid-write, send SIGTERM first and give it a few seconds. Reach for -9 only when SIGTERM is ignored."
        },
        {
          "q": "Do I have to wait 60 seconds for TIME_WAIT before restarting?",
          "a": "Usually not. TIME_WAIT applies to closed connections, not to listening sockets, and servers that set SO_REUSEADDR can bind straight over those leftovers. If the port is still refused after a few seconds, run ss -ltnp and look for a LISTEN socket: a live process is holding it."
        },
        {
          "q": "Why does the process come back after I kill it?",
          "a": "Something is supervising it. systemd with Restart=always, PM2, a Docker restart policy, a Kubernetes controller, or a watcher such as nodemon will all respawn the child. Check the parent with ps -o ppid= -p PID and stop the supervisor rather than its child."
        },
        {
          "q": "Can two processes listen on the same port at once?",
          "a": "Yes, with SO_REUSEPORT on Linux 3.9 and later, where the kernel load-balances new connections across the listeners. Every socket involved must set the option, so it is opt-in by design and not something you get by accident. Node's cluster module achieves a similar effect by a different route, distributing handles from the primary process. Check your runtime's documentation for whether it exposes the socket option directly."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of the container lifecycle problem: why PID 1 stopping takes everything with it.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Refused rather than busy. Work through the listener, the firewall and pg_hba.conf in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "The other error that greets you on a fresh clone, and why resolution fails the way it does.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-08",
  "updated": "2026-10-08",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
