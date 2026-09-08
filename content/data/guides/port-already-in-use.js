module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill Whatever Owns the Port",
  "h1": "Port already in use: find what is holding it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something already holds the port. Find the owner with lsof or netstat, kill it safely, and learn why it survives a crash.",
  "standfirst": "The port is held by a process, and usually one you started. Identify it on macOS, Linux or Windows, end it without losing work, and stop the orphan from coming back.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Identify the process holding a port with lsof, ss or netstat, kill it safely, and stop orphans recurring.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is a failed `bind()` call. The kernel already has a socket on that exact address and port, and it will not hand out a second one.",
        "Identify the owner before killing anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash, the usual cause is a surviving child process that inherited the listening socket, not a lingering `TIME_WAIT` socket.",
        "Send `SIGTERM` first. `kill -9` skips your shutdown code, and that is how you produce the next orphan.",
        "If nothing appears to own the port, check containers, other users' processes, and reserved port ranges."
      ]
    },
    {
      "t": "h2",
      "x": "What the error actually means"
    },
    {
      "t": "p",
      "x": "A server asks the kernel for an address and port with `bind()`, then calls `listen()`. If a socket already occupies that address and port, `bind()` returns the `EADDRINUSE` errno and your runtime dresses it up in its own wording. The wording differs. The cause does not."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python on Linux\nOSError: [Errno 98] Address already in use\n\n# Python on macOS\nOSError: [Errno 48] Address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker\nBind for 0.0.0.0:8080 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "The address in front of the port matters as much as the number. `0.0.0.0:3000` claims every IPv4 interface, so it collides with an attempt to bind `127.0.0.1:3000`. The `:::3000` you see from Node is the IPv6 wildcard, and on most Linux and macOS systems that listener also accepts IPv4 traffic, which is why a v6 socket blocks a v4 bind. The reverse case surprises people too: two processes can hold `127.0.0.1:3000` and `192.168.1.20:3000` simultaneously without complaint, because those are genuinely different addresses. If your app binds a specific interface, read the address in the error rather than assuming the whole port is gone."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "Do this before you reach for a kill command. The PID tells you whether you are looking at your own dev server, a container, a supervisor, or something you should leave alone."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS or Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -tlnp 'sport = :3000'\n\n# Just the PIDs, for scripting\nlsof -ti tcp:3000 -sTCP:LISTEN\n\n# What is that PID, and who started it?\nps -o pid,ppid,user,command -p 48213"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Command Prompt: the last column is the PID\nnetstat -ano | findstr :3000\n\n# PowerShell, with the process name resolved\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "table",
      "head": [
        "Where you are",
        "Command",
        "Gotcha"
      ],
      "rows": [
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "Add `sudo` or you will not see other users' processes"
        ],
        [
          "Linux",
          "`ss -tlnp 'sport = :3000'`",
          "The process column stays empty without root"
        ],
        [
          "Windows",
          "`netstat -ano | findstr :3000`",
          "Match the PID in Task Manager's Details tab"
        ],
        [
          "WSL2",
          "Check both sides",
          "A Windows process can hold the port your Linux shell wants"
        ],
        [
          "Docker",
          "`docker ps --format '{{.Names}} {{.Ports}}'`",
          "A published port appears as `docker-proxy`, not as your app"
        ]
      ],
      "caption": "Locating the listener on port 3000. Flag spelling varies a little between distributions and BSD-derived systems."
    },
    {
      "t": "p",
      "x": "Two results deserve a pause. If the owner is `docker-proxy` or a container runtime helper, killing it fixes nothing and may confuse the daemon; stop the container instead. If the owner is a process you do not recognise and it is running as root or another user, find out what it is before ending it. Development machines accumulate agents, sync daemons and license servers that quietly sit on round numbers like 3000, 5000 and 8080."
    },
    {
      "t": "h2",
      "x": "Kill it, but kill it properly"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask politely first. This runs your shutdown handlers.\nkill 48213\n\n# Still there after a few seconds? Then insist.\nkill -9 48213\n\n# Linux shortcut. Note that fuser -k sends SIGKILL unless told otherwise.\nfuser -k -TERM 3000/tcp\n\n# Cross-platform, nothing to install\nnpx kill-port 3000"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "taskkill /PID 48213\ntaskkill /PID 48213 /F"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "That alias you were about to add",
      "x": "`alias killport='kill -9 $(lsof -ti:3000)'` will eventually bite you. Without `-sTCP:LISTEN`, `lsof -ti:3000` also matches client connections *to* port 3000, so the command can kill your browser or an unrelated test runner. `kill -9` also cannot be caught, so nothing flushes a write buffer, releases a lock file or reaps a child. Use `SIGTERM`, wait, and escalate only if the process ignores you."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "The port did not survive the crash. A process did. Sockets are not resources the kernel forgets to clean up; when the last file descriptor referring to a listening socket closes, the port is released immediately. So if the port is occupied, something still holds that descriptor. There are three usual suspects."
    },
    {
      "t": "h3",
      "x": "A child inherited the listening socket"
    },
    {
      "t": "p",
      "x": "This is the most common one and the least obvious. File descriptors are inherited across `fork()` and `exec()`, so a worker, a cluster child or anything spawned after the server started holds its own reference to that socket. Killing the parent leaves the child running with the port. You see it constantly with `npm run dev`, where npm spawns a shell, the shell spawns your process, and your process spawns a bundler. Ctrl+C signals the foreground process group and normally reaches all of them, but a process that detached, ignored `SIGINT` or was started with `&` will not get the message. Closing the terminal window is worse: depending on your shell and terminal, the child may simply be reparented and carry on. Run `ps -o pid,ppid,command -p $(lsof -ti tcp:3000)` and look at the parent PID. A `ppid` of 1 means you are looking at an orphan."
    },
    {
      "t": "h3",
      "x": "A supervisor keeps bringing it back"
    },
    {
      "t": "p",
      "x": "If you kill the PID and the port is occupied again within a second or two, you are fighting a restart policy rather than a process. pm2, systemd with `Restart=always`, a Docker restart policy, a Kubernetes probe and your IDE's auto-restart all behave this way. Stop the supervisor's record of the service, not the process it spawned: `pm2 delete <name>`, `sudo systemctl stop <unit>`, `docker stop <container>`. Our guide on [why a container exits immediately](/guides/docker-container-exits-immediately/) covers the container side of this loop."
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT explanation is usually wrong"
    },
    {
      "t": "p",
      "x": "Search results will tell you the port is stuck in `TIME_WAIT` for a minute or two after a crash and you simply have to wait. That is rarely what is happening. `TIME_WAIT` applies to connections that were accepted and then closed, not to the listening socket, and the `SO_REUSEADDR` option exists precisely so a server can rebind while those old connections drain. Node sets `SO_REUSEADDR` for you through libuv on Unix-like systems. Python's `http.server` sets `allow_reuse_address`. The one place `TIME_WAIT` genuinely bites is a hand-rolled socket in a script that never sets the option, which is why that snippet in your test harness fails to restart while your real server restarts fine."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # the line people omit\ns.bind((\"127.0.0.1\", 3000))\ns.listen()"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reach for these two",
      "x": "`net.ipv4.tcp_tw_recycle` shows up in old answers as a cure. It broke connections from clients behind NAT and was removed from Linux in 4.12, so on any current kernel the advice is dead as well as bad. `SO_REUSEPORT` is a different trap: it lets a second copy of your server bind the same port successfully, so instead of an error you get two servers splitting traffic at random and one of them serving stale code. Both of these hide the symptom rather than releasing the socket."
    },
    {
      "t": "h2",
      "x": "When nothing seems to own the port"
    },
    {
      "t": "p",
      "x": "You run `lsof`, get no output, and the bind still fails. Work through these, roughly in order of likelihood:"
    },
    {
      "t": "ul",
      "items": [
        "**You are not root.** `lsof` and `ss` hide process details for other users. Re-run with `sudo` before concluding the port is free.",
        "**It is a container.** The listener lives in a different network namespace or, on macOS and Windows, inside the Docker VM. Check `docker ps` and `docker compose ps`.",
        "**Windows or WSL2 reserved the range.** Hyper-V and other components reserve blocks of ports for dynamic use. Run `netsh interface ipv4 show excludedportrange protocol=tcp` in an elevated prompt and see whether your port falls inside a listed range. This case often surfaces as `EACCES` rather than `EADDRINUSE`, and no process appears in `netstat` because none exists.",
        "**The port is below 1024.** Binding a privileged port without the capability gives you a permission error, not a busy one. Different failure, different fix.",
        "**macOS is using it for AirPlay.** On macOS Monterey and later, the AirPlay Receiver has been reported to hold ports 5000 and 7000. Turn it off in System Settings or move your dev server. Check the setting's location in your own macOS version, since Apple moves it between releases.",
        "**You are looking at the wrong protocol.** A UDP listener will not appear in a TCP-only query, and vice versa."
      ]
    },
    {
      "t": "h2",
      "x": "Shut down cleanly so it stops recurring"
    },
    {
      "t": "p",
      "x": "Most repeat offenders come from a server with no signal handling. The process gets `SIGTERM`, dies without closing anything, and its children keep the socket. Handle the signals, close the server, and give yourself a hard deadline so a stuck connection cannot block the exit forever."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(process.env.PORT || 3000);\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n\n  server.close(() => process.exit(0));\n\n  // server.close() waits for open connections, and keep-alive\n  // sockets can wait a long time. closeAllConnections() was added\n  // in Node 18.2, so guard it if you support older runtimes.\n  if (typeof server.closeAllConnections === 'function') {\n    server.closeAllConnections();\n  }\n\n  // Last resort, so a hung handler cannot pin the port.\n  setTimeout(() => process.exit(1), 5000).unref();\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));\nprocess.on('SIGINT', () => shutdown('SIGINT'));"
    },
    {
      "t": "p",
      "x": "The trade-off is real: an aggressive timeout can cut off a slow request that was going to succeed, and a generous one leaves the port held during every restart. Five seconds is a reasonable starting point for local development. Production deployments usually want the timeout to sit just under whatever the orchestrator allows between `SIGTERM` and `SIGKILL`, so your own code decides how the process ends."
    },
    {
      "t": "h2",
      "x": "Or make the port stop mattering"
    },
    {
      "t": "p",
      "x": "Hard-coded ports are the reason this problem is a daily event rather than an occasional one. Read the port from the environment so a second copy of the service can run alongside the first. In tests, bind port 0 and let the kernel pick a free one, then read back what you got. A test suite that never fights over a fixed port also never fails on CI because a previous job left something listening."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// Port 0 means \"any free port\". Ask the server which one it took.\nconst server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`listening on http://127.0.0.1:${port}`);\n});"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A 15 second triage routine",
      "x": "Find the PID with `lsof -ti tcp:3000 -sTCP:LISTEN`. Look at its parent with `ps -o pid,ppid,command -p <pid>`. If the parent is a supervisor, stop the supervisor. If the parent is `1`, you have an orphan, so `kill` it and then add signal handling. If there is no PID at all, jump to the container and reserved-range checks above."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of the restart loop: why the process behind a published port keeps dying.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Refused rather than in use. Check listeners, addresses and rules layer by layer.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "The other error that greets you two seconds after starting a dev server.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, run lsof -ti tcp:3000 -sTCP:LISTEN to get the PID, then kill that PID. Escalate to kill -9 only if it ignores SIGTERM. On Windows, use netstat -ano | findstr :3000 to read the PID from the last column, then taskkill /PID <pid>. Look at what the PID actually is first; if it is docker-proxy or a supervisor, stop the container or service instead."
        },
        {
          "q": "Why is port 3000 still in use after I stopped the server?",
          "a": "Almost always because a child process is still running and holding the inherited listening socket. Shells, npm scripts and bundlers all spawn children, and killing the parent does not kill them. Check the parent PID with ps -o pid,ppid,command -p <pid>. A parent PID of 1 means the process was orphaned when its parent died."
        },
        {
          "q": "Do I have to wait 60 seconds for TIME_WAIT to clear?",
          "a": "Usually not. TIME_WAIT applies to closed connections rather than the listening socket, and any server that sets SO_REUSEADDR can rebind straight away. Node and Python's http.server set it for you. If you are hitting a real TIME_WAIT block, it is normally a raw socket in a script that never called setsockopt, and adding SO_REUSEADDR is the fix."
        },
        {
          "q": "Why does lsof show nothing but the port is still in use?",
          "a": "Four common reasons: you are not root and the process belongs to another user, the listener is inside a container or VM network namespace, the port falls inside a Windows or Hyper-V reserved range (check netsh interface ipv4 show excludedportrange protocol=tcp), or you queried TCP while the listener is on UDP."
        },
        {
          "q": "Is it safe to use kill -9 on the PID that lsof returns?",
          "a": "It is safe for the machine but not for your data. SIGKILL cannot be caught, so no shutdown handler runs, buffers are not flushed, lock files are not removed and children are not reaped. Those orphaned children are exactly what causes the next EADDRINUSE. Send SIGTERM, wait a few seconds, and use -9 only for a process that refuses to exit."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on a port?",
          "a": "EADDRINUSE means another socket holds the address and port. EACCES means you are not allowed to bind it at all, typically because the port is below 1024 and you lack privileges, or because the operating system reserved the range. Chasing a PID will not help with EACCES, since there may be no process involved."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-08",
  "updated": "2026-09-08",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
