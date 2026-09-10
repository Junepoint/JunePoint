module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find the Process Holding Your Port",
  "h1": "Port already in use: find it, kill it, stop it recurring",
  "eyebrow": "Troubleshooting",
  "description": "Port already in use? Find the process holding it with lsof, ss or netstat, kill it safely, and understand why a crash can leave the port bound.",
  "standfirst": "An EADDRINUSE error nearly always points at a live process you forgot about. Here is how to identify it, end it without collateral damage, and fix the restart loop that keeps recreating it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port listening"
  ],
  "cardDesc": "Trace an EADDRINUSE error to the process that owns the port, then end it safely and stop the crash loop repeating.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` almost always means a live process is still listening. Identify it before you kill anything.",
        "Use `lsof -ti tcp:3000 -sTCP:LISTEN`. The popular `lsof -ti:3000` also matches clients *connected to* port 3000, so it can kill your browser or your test runner.",
        "Send `SIGTERM` first. `kill -9` skips the process's own cleanup, which is how you end up with a stale lock file or an orphaned child.",
        "After a crash, the culprit is usually a detached child or a file watcher that respawned, not the kernel holding the socket open.",
        "A port can be blocked with nothing listening: reserved ranges on Windows, and AirPlay Receiver on port 5000 on macOS."
      ]
    },
    {
      "t": "h2",
      "x": "Read the error before you reach for lsof"
    },
    {
      "t": "p",
      "x": "The message carries two pieces of information that narrow the search immediately: the port, and the address it tried to bind. Most people skim past the second one."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python on Linux\nOSError: [Errno 98] Address already in use\n\n# Python on macOS\nOSError: [Errno 48] Address already in use\n\n# Python on Windows\nOSError: [WinError 10048] Only one usage of each socket address\n(protocol/network address/port) is normally permitted\n\n# Docker\nError response from daemon: driver failed programming external\nconnectivity on endpoint web: Bind for 0.0.0.0:8080 failed:\nport is already allocated"
    },
    {
      "t": "p",
      "x": "`:::3000` is the IPv6 wildcard address. `0.0.0.0:3000` is the IPv4 wildcard. `127.0.0.1:3000` is loopback only. The distinction matters because these overlap in a way that surprises people: on Linux, with the default `net.ipv6.bindv6only=0`, a socket bound to the IPv6 wildcard also accepts IPv4 traffic through v4-mapped addresses. So a process sitting on `0.0.0.0:3000` will block a second process trying to bind `:::3000`, and the error will name an address that nothing appears to be using."
    },
    {
      "t": "p",
      "x": "The reverse case is the useful one. If the conflicting process is bound only to `127.0.0.1:3000`, you can still bind `0.0.0.0:3000`? No, you cannot, because the wildcard covers loopback. But you can bind a *specific* other interface. That is occasionally a fast workaround, and it is also a good way to end up with two servers running and no idea which one your browser reached."
    },
    {
      "t": "h2",
      "x": "Find the process that holds the port"
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Command",
        "Notes"
      ],
      "rows": [
        [
          "macOS",
          "`lsof -ti tcp:3000 -sTCP:LISTEN`",
          "Prints just the PID of the listener. `lsof -i tcp:3000` shows the full detail."
        ],
        [
          "Linux",
          "`sudo ss -lptn 'sport = :3000'`",
          "`ss` is present on modern distros where `lsof` and `netstat` may not be. Process names need root."
        ],
        [
          "Linux (fallback)",
          "`sudo netstat -tulpn | grep :3000`",
          "Deprecated in favour of `ss`, still installed nearly everywhere."
        ],
        [
          "Windows (cmd)",
          "`netstat -ano | findstr :3000`",
          "The last column is the PID. Match it in Task Manager's Details tab."
        ],
        [
          "Windows (PowerShell)",
          "`Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess`",
          "Gives you the process name directly."
        ],
        [
          "Docker",
          "`docker ps --filter publish=8080`",
          "Finds the container publishing the port when no host process owns it."
        ]
      ],
      "caption": "Commands to identify a listening process. Run them before killing anything."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "`lsof -ti:3000` is broader than you think",
      "x": "`lsof -i:3000` selects every socket whose **local or remote** port is 3000. That includes outbound connections to a server on port 3000. Pipe that into `kill -9` while your browser has a tab open on `localhost:3000` and you will kill the browser, or a test runner, or a proxy. Adding `-sTCP:LISTEN` restricts the match to actual listeners."
    },
    {
      "t": "p",
      "x": "Once you have a PID, spend two seconds identifying it. `ps -p <pid> -o pid,ppid,user,command` prints the full command line and the parent. The parent is the part that matters after a crash, because that is what will respawn the process you are about to kill."
    },
    {
      "t": "h2",
      "x": "Kill it without breaking anything else"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask politely first",
          "x": "Plain `kill` sends `SIGTERM`, which most servers handle by closing listeners, finishing in-flight requests and exiting. Give it a couple of seconds before escalating.",
          "code": "kill $(lsof -ti tcp:3000 -sTCP:LISTEN)"
        },
        {
          "title": "Check whether it actually went",
          "x": "If the port is free, stop here. If the PID changed rather than disappeared, something is supervising the process and you need to stop the supervisor instead.",
          "code": "lsof -ti tcp:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignored SIGTERM",
          "x": "`SIGKILL` cannot be caught or handled. The process gets no chance to flush buffers, remove a PID file or shut down child processes, so use it when the polite signal has already failed.",
          "code": "kill -9 $(lsof -ti tcp:3000 -sTCP:LISTEN)"
        },
        {
          "title": "On Windows, use taskkill",
          "x": "`/F` forces termination and `/T` includes the process tree, which is usually what you want for a Node or Python dev server started from a shell wrapper.",
          "code": "taskkill /PID 12345 /F /T"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Never `kill -9` a database",
      "x": "PostgreSQL's own documentation warns against sending `SIGKILL` to the postmaster: it prevents the server from releasing shared memory and semaphores cleanly, and can leave a stale `postmaster.pid` that blocks the next start. Use `pg_ctl stop` instead. The same caution applies to anything holding a write-ahead log or an exclusive lock. If Postgres is what is occupying your port, see [PostgreSQL \"Connection Refused\"](/guides/postgres-connection-refused/) for the layer-by-layer approach."
    },
    {
      "t": "p",
      "x": "`fuser -k 3000/tcp` and `npx kill-port 3000` both work, and both have the same blind spot: they terminate whatever they find without showing you what it was. That is fine on a laptop running one dev server. It is a bad habit to carry onto a shared host."
    },
    {
      "t": "h2",
      "x": "Why it happens after a crash"
    },
    {
      "t": "p",
      "x": "The kernel releases a listening socket as soon as the owning process dies. Genuinely. If the port is still held thirty seconds after your app crashed, a process still owns it. These are the usual suspects, roughly in order of how often they turn up:"
    },
    {
      "t": "ol",
      "items": [
        "**A file watcher respawned it.** `nodemon`, `tsx watch`, `vite`, `air` and friends restart your app on file change. If the crash happened inside a restart cycle you can end up with the old process still holding the socket while a new one tries to bind.",
        "**A detached child outlived its parent.** Anything started with `spawn(cmd, args, { detached: true })`, a trailing `&`, or `nohup` is not in your terminal's process group. Ctrl-C never reaches it.",
        "**The shell wrapper died but the server did not.** `npm start` forwards signals to its child inconsistently across versions and platforms. Killing `npm` does not reliably kill `node`.",
        "**Cluster or worker processes.** The primary process exits, the workers keep the shared listening socket alive. `ps -ef | grep node` will show several PIDs with near-identical command lines.",
        "**A container is still up.** Ctrl-C on `docker compose up` stops the foreground attachment; a container started with `-d`, or restarted by a `restart: always` policy, keeps its published port bound. See [Docker Container Exits Immediately](/guides/docker-container-exits-immediately/) for the related failure mode.",
        "**A supervisor restarted it.** systemd with `Restart=always`, pm2, or a Kubernetes readiness loop will faithfully bring back the thing you just killed.",
        "**The debugger port, not the app port.** Node's inspector binds 9229 separately. A crashed process being held open by an attached debugger keeps both."
      ]
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is rarely the real cause"
    },
    {
      "t": "p",
      "x": "The internet's favourite explanation is `TIME_WAIT`: the TCP state that the side which closed a connection first holds for roughly twice the maximum segment lifetime, so that delayed packets do not get delivered to a new connection reusing the same four-tuple. On Linux the duration is fixed in the kernel at 60 seconds and is not tunable through a sysctl, whatever the blog posts say."
    },
    {
      "t": "p",
      "x": "It matters less than people think, because of `SO_REUSEADDR`. On Linux and macOS that socket option lets you bind a port that has lingering `TIME_WAIT` connections but no active listener. Node sets it on listening sockets for you. Go's `net.Listen` sets it. So if you are writing a Node or Go server, `TIME_WAIT` is almost certainly not your problem, and a fifteen-second wait will not help."
    },
    {
      "t": "p",
      "x": "Python is the common exception. The raw `socket` module does not set the option, and neither does `socketserver.TCPServer` unless you ask:"
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\nimport socketserver\n\n# Raw socket\nsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\nsock.bind((\"0.0.0.0\", 8000))\n\n# socketserver / http.server\nclass Server(socketserver.TCPServer):\n    allow_reuse_address = True  # sets SO_REUSEADDR before bind"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not reach for SO_REUSEPORT to make the error go away",
      "x": "`SO_REUSEPORT` is a different option with different semantics: it lets **multiple live processes** bind the same port, and the kernel load-balances incoming connections between them. Set it to silence `EADDRINUSE` and you will get a setup where half your requests hit yesterday's build and no error is ever raised. It is a legitimate tool for zero-downtime restarts and a terrible way to dodge a bind conflict."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and the port is still refused"
    },
    {
      "t": "p",
      "x": "Occasionally `lsof` and `ss` come back empty and the bind still fails. Three causes account for most of these."
    },
    {
      "t": "p",
      "x": "**Windows reserved port ranges.** Hyper-V, WSL2, Docker Desktop and the Windows NAT service reserve blocks of the dynamic port range at boot. Nothing is listening, but the range is excluded from user binds, and 3000 or 8080 can land inside it. Check with `netsh`:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "netsh interface ipv4 show excludedportrange protocol=tcp\n\n# Permanently reserve a port for your own use so Hyper-V skips it.\n# Run as Administrator, then reboot.\nnetsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1"
    },
    {
      "t": "p",
      "x": "**macOS AirPlay Receiver.** Since macOS Monterey, the AirPlay Receiver service binds port 5000 (and 7000), which is exactly the default for Flask and for older ASP.NET templates. Turn it off in System Settings under General, AirDrop & Handoff, or move your app to another port. Apple has moved these settings between releases, so check the layout on your own version rather than trusting a screenshot."
    },
    {
      "t": "p",
      "x": "**A permissions error wearing a disguise.** Ports below 1024 are privileged on Unix. Binding 80 or 443 as a normal user gives you `EACCES`, not `EADDRINUSE`, but the two get conflated in stack traces and issue threads constantly. Read the error code. If it says `EACCES`, no other process is involved and killing things will not help."
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Two small changes remove most repeat occurrences. The first is a real shutdown handler, so Ctrl-C and container stops actually release the socket. The second is a useful error message, so the next `EADDRINUSE` tells you what to run instead of printing a stack trace into the void."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const port = Number(process.env.PORT ?? 3000);\nconst server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${port} is in use. Find the owner with:\\n` +\n      `  lsof -ti tcp:${port} -sTCP:LISTEN | xargs ps -o pid,ppid,command -p`\n    );\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  return () => {\n    console.log(`${signal} received, draining`);\n    server.close(() => process.exit(0));\n    // Node 18.2 and later: drop idle keep-alive sockets that would\n    // otherwise keep the server open until their timeout expires.\n    // Verify availability on your runtime version.\n    server.closeIdleConnections?.();\n    // Give in-flight requests a bounded window, then stop waiting.\n    setTimeout(() => process.exit(1), 10_000).unref();\n  };\n}\n\nprocess.on('SIGINT', shutdown('SIGINT'));\nprocess.on('SIGTERM', shutdown('SIGTERM'));"
    },
    {
      "t": "p",
      "x": "Without `closeIdleConnections`, `server.close()` waits for every keep-alive connection to go idle and close on its own. A browser tab with an open connection can hold your process, and therefore your port, for as long as the keep-alive timeout allows. That is the single most common reason a server appears to hang on Ctrl-C."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Bind port 0 in tests",
      "x": "Passing `0` asks the kernel for any free port, and `server.address().port` tells you which one you got. Test suites that hardcode 3001 fail the moment two of them run in parallel in CI. This costs one line and eliminates a whole class of flake."
    },
    {
      "t": "p",
      "x": "For containers, remember that `docker compose down` removes containers while Ctrl-C only detaches. And if a supervisor keeps resurrecting the process, stop the supervisor: `systemctl stop myapp`, `pm2 delete myapp`, or scale the deployment to zero. Killing a supervised PID is a fight you lose on a timer."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "On macOS or Linux: `kill $(lsof -ti tcp:3000 -sTCP:LISTEN)`. Check the port is free, and only escalate to `kill -9` if the process ignored the first signal. On Windows, find the PID with `netstat -ano | findstr :3000` and end it with `taskkill /PID <pid> /F /T`. Confirm what the PID actually is with `ps -p <pid> -o command` before you kill it."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl-C?",
          "a": "Ctrl-C sends `SIGINT` to the foreground process group only. A child started detached, with `nohup`, or with a trailing `&` never receives it. The other common case is a server that did receive the signal and is waiting on open keep-alive connections before closing. Both leave a live process holding the socket, which you can confirm with `lsof`."
        },
        {
          "q": "What does EADDRINUSE actually mean?",
          "a": "The `bind()` system call failed because another socket is already bound to that address and port combination. It is the operating system refusing, not your framework. The same condition appears as `[Errno 98]` on Linux under Python, `[Errno 48]` on macOS, and `WinError 10048` on Windows."
        },
        {
          "q": "Is it safe to run kill -9 on whatever is using the port?",
          "a": "On your own machine with a dev server, usually. Not as a reflex. `SIGKILL` gives the process no opportunity to flush data, release locks or stop its children, so databases, message brokers and anything writing files can be left in a state that costs more time than the port conflict did. Try plain `kill` first."
        },
        {
          "q": "Why do I get address already in use when nothing is listening?",
          "a": "Three likely reasons. On Windows, Hyper-V or WSL2 may have reserved the port range at boot: check `netsh interface ipv4 show excludedportrange protocol=tcp`. On macOS, AirPlay Receiver holds port 5000. And if the error code is `EACCES` rather than `EADDRINUSE`, you are trying to bind a privileged port below 1024 without the necessary rights."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, with `SO_REUSEPORT` on Linux and macOS, where the kernel distributes incoming connections across the listeners. It is designed for zero-downtime restarts and multi-process servers. Using it to work around a bind conflict hides the conflict instead of fixing it, and you end up serving requests from a process you thought you had stopped."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker Container Exits Immediately",
          "desc": "Trace a container that stops on start using its logs and exit code.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL \"Connection Refused\"",
          "desc": "Check the process, the listen address, the firewall and pg_hba.conf in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Why module resolution fails, and how ESM and CommonJS differ.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-10",
  "updated": "2026-09-10",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
