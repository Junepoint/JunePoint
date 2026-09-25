module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is Busy",
  "h1": "Port already in use: find the process, then fix the cause",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding a port with lsof, ss or netstat, kill it safely, and understand why EADDRINUSE outlives a crashed dev server.",
  "standfirst": "A port is held by a process, so start by naming that process. Below are the identification commands per platform, then the reasons a listener keeps outliving the run that created it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "find process using port",
    "lsof port in use"
  ],
  "cardDesc": "Identify the PID holding your port, kill it in the right order, and fix the orphaned child process behind it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "A port is held by a process, never by itself. Get the PID first, kill it second, and only then consider moving your own app to another port.",
        "macOS and Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Linux also has `ss -ltnp \"sport = :3000\"`. Windows: `netstat -ano | findstr :3000`, then `tasklist /FI \"PID eq 12345\"`.",
        "After a crash the usual holder is an orphaned child process, not TCP `TIME_WAIT`. Node sets `SO_REUSEADDR` on listening sockets, so `TIME_WAIT` rarely blocks a restart there.",
        "If the port looks free but the bind still fails, suspect the other address family, another user's process, a Docker publish, or a reserved port range on Windows.",
        "Ports below 1024 fail with `EACCES`, not `EADDRINUSE`. That is a privilege problem, and killing things will not help."
      ]
    },
    {
      "t": "lede",
      "x": "Something already owns the address you asked for, so the kernel refused your `bind()` call and your process died on the spot. The meaning of the error is rarely the hard part. The useful questions are which process holds the port, and why it survived the run that started it."
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "p",
      "x": "A server calls `bind()` on an address and a port before it calls `listen()`. If another socket already holds that combination, `bind()` returns `EADDRINUSE`. Every runtime dresses the same errno in its own clothing."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node (the stack frames and line numbers vary by version)\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use"
    },
    {
      "t": "p",
      "x": "Read the address in the message, not only the port. `:::3000` means the listener wanted the IPv6 wildcard, which on most Linux systems also covers IPv4 through mapped addresses. `127.0.0.1:3000` is a much narrower claim. That difference explains a good share of the cases where two servers coexist happily on paper and collide in practice."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "p",
      "x": "Ask the kernel, not your app."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listeners only, no name lookups\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, without lsof installed\nss -ltnp \"sport = :3000\"\n\n# Just the PID, for scripting\nlsof -t -iTCP:3000 -sTCP:LISTEN\n\n# Anything the current user cannot see needs elevation\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\"\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess |\n  ForEach-Object { Get-Process -Id $_.OwningProcess }"
    },
    {
      "t": "p",
      "x": "`-nP` turns off DNS and service-name resolution, which makes `lsof` fast and its output readable. `-sTCP:LISTEN` is the flag people skip and then regret: without it, the output also includes every established connection that happens to involve port 3000, including your browser's own sockets. Run as your normal user, `lsof` reports only your processes, so a port held by a daemon or by another account looks free."
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Identify the holder",
        "Stop it"
      ],
      "rows": [
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`kill 12345`, then `kill -9 12345`"
        ],
        [
          "Linux",
          "`ss -ltnp \"sport = :3000\"`",
          "`kill 12345`, or `fuser -k 3000/tcp`"
        ],
        [
          "Windows",
          "`netstat -ano | findstr :3000`",
          "`taskkill /PID 12345`, then add `/F`"
        ],
        [
          "Docker host",
          "`docker ps --filter publish=3000`",
          "`docker stop <container>`"
        ],
        [
          "WSL2 guest",
          "`ss -ltnp` inside the distro",
          "Kill inside the distro, or check Windows reservations"
        ]
      ],
      "caption": "Substitute your own port. The Windows PID column is the last field of netstat output."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "p",
      "x": "Send `SIGTERM` first. A well-behaved server uses that signal to flush logs, close database connections, finish in-flight requests and delete its pidfile or Unix socket. `SIGKILL` skips every bit of that. The TCP socket is released either way, because the kernel reclaims file descriptors when a process dies, but a stale lock file or a leftover `/tmp/app.sock` will be waiting for you on the next start. Give the process a second or two, check again, and escalate only if it ignored you."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The one-liner that kills your browser",
      "x": "`kill -9 $(lsof -t -i:3000)` is popular and careless. Without `-sTCP:LISTEN`, that subshell also returns the PIDs of clients connected to port 3000, which on a dev machine usually includes Chrome or Firefox. Add the state filter, or read the PID with your eyes before you pass it to `kill`."
    },
    {
      "t": "p",
      "x": "Look at the process you are about to kill, too. If `lsof` names `com.docker.backend`, `docker-proxy`, `systemd` or your editor, the real owner is one layer up and killing the visible process will either fail or break something you wanted. Stop the container, or quit the tool that spawned the server."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "h3",
      "x": "An orphaned child is still listening"
    },
    {
      "t": "p",
      "x": "This is the common case, and it has nothing to do with TCP. Your terminal ran `npm run dev`, npm ran a shell, the shell ran `nodemon`, and nodemon ran `node`. Four processes, one port. Ctrl-C delivers `SIGINT` to the foreground process group, which usually works, but a crash in the middle of the chain does not: if the supervisor dies first, or if something respawns without signalling its children, the grandchild keeps the listener open and gets reparented to `init`. It has no terminal and no visible output. It just holds port 3000 forever."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Map the family tree before you shoot anything\nps -o pid,ppid,pgid,command -p \"$(lsof -t -iTCP:3000 -sTCP:LISTEN)\"\n\n# Kill the whole process group; the leading minus is the point\nkill -TERM -12345\n\n# Or match on the command line when the PID keeps changing\npkill -f 'node .*server.js'"
    },
    {
      "t": "p",
      "x": "A `ppid` of 1 confirms the orphan diagnosis. If the parent is still alive and is your watcher, kill the watcher rather than the leaf, otherwise it will cheerfully start a replacement on the port you just freed."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT, and when it genuinely matters"
    },
    {
      "t": "p",
      "x": "TCP keeps a closed connection in `TIME_WAIT` for a while so that late duplicate packets cannot be mistaken for part of a new connection. Linux fixes that interval at 60 seconds in the kernel, and it is not a sysctl you can tune away. The part most explanations get wrong is the consequence: `TIME_WAIT` entries belong to connections, and they only block a fresh `bind()` on the listening port when the program fails to set `SO_REUSEADDR`."
    },
    {
      "t": "p",
      "x": "Node, Go and most modern frameworks set that option for you, which is why restarting a Node server after a crash normally works immediately. Hand-rolled socket code often does not."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n# Without this line, a restart within 60 seconds can fail with Errno 98\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind((\"127.0.0.1\", 8000))\ns.listen(128)"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "SO_REUSEADDR is not SO_REUSEPORT",
      "x": "`SO_REUSEADDR` lets you bind over lingering `TIME_WAIT` connections. It does not let two processes listen on the same port at once: that is `SO_REUSEPORT`, and both sockets have to ask for it. On Windows the `SO_REUSEADDR` flag means something different again, closer to permitting a hijack, so libuv deliberately leaves it off there."
    },
    {
      "t": "h3",
      "x": "Docker is holding the host port"
    },
    {
      "t": "p",
      "x": "A published port stays claimed for as long as the container mapping exists, including while a container sits in a restart loop. `docker ps --filter publish=3000` finds the mapping whether or not the container is currently healthy. A container that keeps dying and restarting produces an intermittent `EADDRINUSE` on the host that looks like a race condition and is really a supervision loop."
    },
    {
      "t": "h3",
      "x": "Windows reserved the port before you asked"
    },
    {
      "t": "p",
      "x": "Hyper-V and WSL2 reserve blocks of ephemeral ports on Windows, and those blocks move between reboots. When your port lands inside one, the bind fails even though no process owns it. The error is usually a permissions message rather than an in-use message, which sends people looking for a firewall rule that does not exist."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# List the ranges Windows has already claimed\nnetsh interface ipv4 show excludedportrange protocol=tcp\n\n# Reserve your own port so nothing else takes it (run as admin)\nnetsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1"
    },
    {
      "t": "h2",
      "x": "When nothing shows up on the port"
    },
    {
      "t": "p",
      "x": "Four explanations cover nearly all of these."
    },
    {
      "t": "ul",
      "items": [
        "**You lack permission to see it.** Repeat the command with `sudo`. A port held by a root daemon is invisible to an unprivileged `lsof`.",
        "**You checked the wrong address family.** A server on `[::]:3000` collides with a new server on `0.0.0.0:3000` on most Linux hosts, because `bindv6only` is off by default and the IPv6 wildcard covers mapped IPv4. Run `ss -ltn` with no filter and read the Local Address column carefully.",
        "**A container or namespace owns it.** Host-side tools may show only `docker-proxy`, or nothing useful at all. Check `docker ps` and your compose files.",
        "**A platform service got there first.** On macOS Monterey and later, AirPlay Receiver listens on port 5000, which breaks the default Flask tutorial. You can turn it off under System Settings, in the AirDrop and Handoff pane. Apple moves these settings between releases, so verify the location on your own version rather than trusting a screenshot from 2022."
      ]
    },
    {
      "t": "h2",
      "x": "Make the problem stop recurring"
    },
    {
      "t": "p",
      "x": "Freeing a port is a chore. Not needing to free it is engineering. Three changes remove most of the recurrence."
    },
    {
      "t": "p",
      "x": "First, shut down cleanly, so a restart never races a dying listener. Second, fail with a message that contains the fix instead of a stack trace. Third, stop hard-coding the port anywhere a human is not going to type it into a browser."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const http = require('http');\n\nconst port = Number(process.env.PORT) || 3000;\nconst server = http.createServer(app);\n\nserver.on('error', (err) => {\n  if (err.code !== 'EADDRINUSE') throw err;\n  console.error(`Port ${port} is already in use. Find the holder with:`);\n  console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n  process.exit(1);\n});\n\nserver.listen(port, () => {\n  console.log(`listening on ${server.address().port}`);\n});\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => {\n    server.close(() => process.exit(0));\n    // Keep-alive sockets can outlive close(); do not wait for them forever.\n    if (server.closeAllConnections) server.closeAllConnections();\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "`server.closeAllConnections()` exists in Node 18.2 and later, hence the feature check. On older versions you have to track sockets yourself in a `Set` and destroy them by hand."
    },
    {
      "t": "p",
      "x": "For tests and CI, ask for port 0 and let the kernel hand you something free. Parallel test runners collide on fixed ports constantly, and every retry loop written to work around that collision is slower and flakier than this:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// Port 0 means \"any available port\". Read back what you got.\nconst server = app.listen(0);\nconst { port } = server.address();\n\nconst res = await fetch(`http://127.0.0.1:${port}/health`);\n// ...assertions...\nawait new Promise((resolve) => server.close(resolve));"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Check the tree before you blame the port",
      "x": "If you hit `EADDRINUSE` more than once a week on the same project, the bug is in how your dev script supervises its children, not in TCP. Run `ps -ef | grep node` after a crash. Finding several copies of your server is the answer."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "A restart loop is a frequent reason a published host port never frees up.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite symptom: nothing is listening where you expected something.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "The other error that kills a dev server before it prints anything useful.",
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
          "a": "On macOS or Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, then `kill <pid>`, then `kill -9 <pid>` only if it ignores the first signal. On Windows: `netstat -ano | findstr :3000` for the PID, then `taskkill /PID <pid>` and add `/F` if needed. Include the `-sTCP:LISTEN` filter so you do not kill a client that is merely connected to that port."
        },
        {
          "q": "Why does it say port already in use when nothing is running?",
          "a": "Usually one of four things. An orphaned child process from a previous run still holds the listener and is invisible in your shell. The holder belongs to another user or to root, so an unprivileged `lsof` cannot see it. A Docker container publishes the port, possibly while restarting. Or, on Windows, Hyper-V reserved the port range before you asked for it, which you can confirm with `netsh interface ipv4 show excludedportrange protocol=tcp`."
        },
        {
          "q": "Do I have to wait 60 seconds for TIME_WAIT to clear?",
          "a": "Almost never. `TIME_WAIT` blocks a rebind only when the program does not set `SO_REUSEADDR`, and Node, Go and most frameworks set it by default. If waiting a minute genuinely fixes your problem, the fix is to set that socket option in your own code rather than to wait. Hand-written socket servers are the usual offenders."
        },
        {
          "q": "Is it safe to use kill -9 on the process holding the port?",
          "a": "The port will be released, because the kernel closes the sockets of a dead process. What you lose is the program's own cleanup: buffered logs, in-flight requests, database transactions, pidfiles and Unix socket files. Send `SIGTERM` first, wait a moment, and keep `SIGKILL` for processes that refuse to leave."
        },
        {
          "q": "Why do I only get EADDRINUSE in CI or when running tests in parallel?",
          "a": "Multiple test workers are binding the same hard-coded port on the same machine. Listen on port 0 instead and read the assigned port back from `server.address().port`. That removes the collision entirely and is faster than any retry-with-backoff wrapper."
        },
        {
          "q": "Is EADDRINUSE the same as a firewall or permission problem?",
          "a": "No. `EADDRINUSE` means the local address is taken. A firewall produces a timeout or a refused connection for clients, not a failed bind. Binding to a port below 1024 as a non-root user fails with `EACCES` (Windows words it as a socket access permissions error), which no amount of process killing will fix. Use a high port in development and put a reverse proxy in front of it in production."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-25",
  "updated": "2026-09-25",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
