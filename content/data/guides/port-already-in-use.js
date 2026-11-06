module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is Still Held",
  "h1": "Port already in use: find the process, then free the port",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a port with lsof, ss or Get-NetTCPConnection, kill it safely, and understand why a crashed dev server leaves the socket open.",
  "standfirst": "A bind fails because something already owns the address. Find that something before you start killing processes, and fix the reason it survived the last crash.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port 3000",
    "lsof port",
    "find process using port"
  ],
  "cardDesc": "Locate the process holding a port, kill it in the right order, and stop dev servers from leaking sockets after a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is the kernel refusing your `bind()` call. Nearly always, the owner is a process you started and forgot.",
        "Find it first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash the usual culprit is an orphaned child process. The script you killed was not the thing holding the socket.",
        "`TIME_WAIT` is the most repeated wrong answer. Node and most modern servers set `SO_REUSEADDR`, so a closed connection does not block a restart.",
        "If nothing shows up as listening but the bind still fails, suspect Docker, a Windows reserved port range, or a wildcard versus loopback address clash."
      ]
    },
    {
      "t": "h2",
      "x": "What the error is actually telling you"
    },
    {
      "t": "p",
      "x": "The operating system rejected a request to claim an address. Your process asked for one specific combination of IP address and port, the kernel found a conflicting claim, and it returned `EADDRINUSE`. That refusal happens below your framework, which is why the same condition reads differently in every language:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Java\njava.net.BindException: Address already in use"
    },
    {
      "t": "p",
      "x": "Read the address part, not just the port. Node prints `:::3000` when the server asked for the IPv6 wildcard, which on a dual-stack host also covers IPv4 traffic. `0.0.0.0:3000` is the IPv4 wildcard. `127.0.0.1:3000` is loopback only, reachable from the machine itself and nowhere else. That distinction matters later, because a wildcard bind and a loopback bind on the same port number can collide even though they are not the same address. On macOS the Python error shows `[Errno 48]` instead of `98`, since errno values are not portable."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "Do not guess. One command gives you the PID, the command name and the owning user, which is usually enough to recognise the dev server you abandoned in another tab twenty minutes ago."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listening TCP sockets on port 3000 only\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -lptn 'sport = :3000'\n\n# Same, for UDP\nss -lpun 'sport = :3000'\n\n# Everything touching that port, listeners and connections alike\nlsof -nP -i :3000"
    },
    {
      "t": "p",
      "x": "`-n` skips reverse DNS and `-P` skips service-name lookup, so output appears immediately and shows `3000` rather than a name from `/etc/services`. Drop `-sTCP:LISTEN` and you also get established connections to that port, which is noise when you are hunting a listener but useful when you are checking whether anything is still draining."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: who is listening\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess\n\n# Resolve that PID to a process name\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe equivalent\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\""
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Who holds the port",
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
          "`ss -lptn 'sport = :3000'`",
          "`kill 12345` or `fuser -k 3000/tcp`"
        ],
        [
          "Windows",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`",
          "`Stop-Process -Id 12345` or `taskkill /PID 12345 /T /F`"
        ],
        [
          "Docker host",
          "`docker ps --filter publish=3000`",
          "`docker compose down` or `docker stop <id>`"
        ]
      ],
      "caption": "Replace 3000 with your port and 12345 with the PID the first command printed."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Resist killall node",
      "x": "`killall node` and `pkill node` also take out your editor's TypeScript server, any build watcher, a Playwright runner and whatever else shares the runtime. Ten minutes later you are wondering why autocomplete stopped working. Kill the PID you identified, not the interpreter."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "The shape of this bug is nearly always the same. The thing you were watching died, and something it had started did not."
    },
    {
      "t": "h3",
      "x": "The parent exited and the child kept the socket"
    },
    {
      "t": "p",
      "x": "A listening socket belongs to whichever process holds the file descriptor, and file descriptors do not care that a parent died. If your dev script spawns the real server as a child, killing the script leaves that child running, reparented to `init` or `launchd`, still bound to the port. Your shell returns a prompt. Everything looks finished. The socket is wide open. Check the parent PID and an orphan gives itself away:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# PPID of 1 (or a systemd user manager) means the parent is long gone\nps -o pid,ppid,pgid,user,command -p 12345"
    },
    {
      "t": "h3",
      "x": "The signal never reached the real server"
    },
    {
      "t": "p",
      "x": "Ctrl-C sends `SIGINT` to the foreground process group of your terminal, and for a single process that is usually enough. A crash is a different story. A process killed by `SIGKILL`, by the OOM killer or by a hard runtime fault never runs its cleanup path, so anything it spawned is unowned from that instant. Wrapper layers make it worse: `npm run dev` runs a shell, which runs your command, and signal forwarding through that chain has varied across package manager versions and platforms. Treat it as unreliable rather than assuming it works, and verify with `ps` after a shutdown you care about."
    },
    {
      "t": "h3",
      "x": "The old process is still shutting down"
    },
    {
      "t": "p",
      "x": "Some servers take seconds to close. Open WebSocket connections, long-polling requests, keep-alive clients and a draining database pool all delay the moment the listening socket is released. An instant restart fails. Two seconds later the same command works. That is why this failure so often feels intermittent and so rarely reproduces when you go looking for it."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is usually innocent"
    },
    {
      "t": "p",
      "x": "Search results will tell you the port is stuck in `TIME_WAIT` and hand you a sysctl to tune. Be sceptical. `TIME_WAIT` is a state belonging to a closed *connection*, identified by the full four-tuple of local address, local port, remote address and remote port, and it is not a listening socket. On Linux the state lasts roughly a minute, and that duration is compiled into the kernel rather than exposed as a tunable. So people reach for `net.ipv4.tcp_tw_reuse`, which governs outgoing connections and does nothing for a failing `bind()`. A bind only fails because of lingering connections when the process declines to set `SO_REUSEADDR`, and Node sets that flag for you on listening sockets on non-Windows platforms. Most mainstream server libraries do the same."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Check the state column before you believe anyone",
      "x": "Run `ss -tan | grep 3000` on Linux, or `netstat -an | grep 3000` on macOS. A `LISTEN` row means a live process owns the port right now, so go find it. A pile of `TIME-WAIT` rows with no `LISTEN` row means the port is free and your failure is somewhere else."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the PID",
          "x": "Never pipe a search straight into a kill on the first attempt. Look at the output and make sure the command name is what you expect.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Ask politely",
          "x": "Plain `kill` sends `SIGTERM`, which a well-written server handles by closing its listener and finishing in-flight requests. Give it a second or two.",
          "code": "kill 12345"
        },
        {
          "title": "Check whether it went",
          "x": "`kill -0` sends no signal at all and only tests whether you could. An exit status of `1` with `No such process` means it is gone.",
          "code": "kill -0 12345; echo $?"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught, so the process gets no chance to flush logs, remove a PID file or close a transaction. Use it on a stuck dev server, think twice on anything holding state.",
          "code": "kill -9 12345"
        },
        {
          "title": "Kill the group when children keep respawning",
          "x": "A supervisor that restarts its worker will reclaim the port the moment you free it. Signal the whole process group instead, using the PGID from step one.",
          "code": "ps -o pgid= -p 12345   # prints e.g. 12300\nkill -- -12300"
        },
        {
          "title": "On Windows, include the tree",
          "x": "`/T` kills child processes too, `/F` forces it. Without `/T` you often kill the launcher and leave the server.",
          "code": "taskkill /PID 12345 /T /F"
        }
      ]
    },
    {
      "t": "p",
      "x": "Once you trust your own diagnosis, the one-liners are quicker:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: kill whatever holds the TCP port\nfuser -k 3000/tcp\n\n# macOS or Linux, via lsof\nkill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)\n\n# Windows PowerShell\nStop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "p",
      "x": "These are fine in a scratch shell and a poor idea in a script. When the port is already free, `lsof -t` prints nothing, `kill $(...)` collapses to a bare `kill`, and you get a usage error instead of a clean no-op. A typo in the port number is worse, because the command happily kills whatever it finds there. If you want this in a Makefile, print the owner first and exit zero when there is nothing to do."
    },
    {
      "t": "h2",
      "x": "Nothing is listening and the bind still fails"
    },
    {
      "t": "p",
      "x": "This is where people lose an afternoon. The port looks free from userspace, yet `bind()` keeps failing, and the reason is that something other than an ordinary process has a claim on it."
    },
    {
      "t": "ul",
      "items": [
        "**Docker published the port.** A published port is held by `docker-proxy` or by a kernel NAT rule, so host-side tools may name Docker rather than your app, or show nothing recognisable at all. Check with `docker ps --filter publish=3000` and release it with `docker compose down`.",
        "**Windows reserved a range.** Hyper-V, WSL2 and Docker Desktop reserve dynamic port ranges at boot, and a reserved range can swallow 3000 or 5000 before your app ever starts. List them with `netsh int ipv4 show excludedportrange protocol=tcp`. Restarting the `winnat` service usually reshuffles the allocation.",
        "**macOS claimed it for a system service.** On recent macOS versions AirPlay Receiver and Control Center listen on ports 5000 and 7000, which collides with the Flask development default. Turn off AirPlay Receiver in System Settings, or move your app. Confirm this on your own version before quoting it at a colleague, because Apple has shifted these between releases.",
        "**The addresses overlap without matching.** Binding `0.0.0.0:3000` while another process holds `127.0.0.1:3000` can fail, and a filtered `lsof` hides exactly this case. Run `lsof -nP -i :3000` with no state filter to see every socket on the port.",
        "**It is not actually EADDRINUSE.** `EACCES` on a port below 1024 is a privilege problem wearing similar clothing: Node reports `listen EACCES: permission denied 0.0.0.0:80`. Use a high port in development and a reverse proxy in production, or grant `CAP_NET_BIND_SERVICE` on Linux if you really must bind low."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it happening every time"
    },
    {
      "t": "p",
      "x": "Two changes remove most repeat occurrences: handle the shutdown signals properly, and turn the error itself into an instruction rather than a stack trace."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "import http from 'node:http';\n\nconst PORT = Number(process.env.PORT ?? 3000);\nconst server = http.createServer(handler);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${PORT} is already in use. Find the owner with:`);\n    console.error(`  lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nserver.listen(PORT, () => console.log(`listening on ${PORT}`));\n\n// Release the socket on the signals a supervisor or a shell actually sends.\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n    // Keep-alive clients will otherwise hold the process open indefinitely.\n    server.closeIdleConnections?.();\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "Three things are doing work there. The `error` listener converts an unhandled exception into a message that tells the next person what to run, including the port the process actually wanted. `server.close()` stops accepting new connections and frees the listening socket once existing ones end. The unreferenced timer puts a ceiling on how long you wait, because without it a single idle keep-alive connection can hold the whole shutdown hostage. `closeIdleConnections` is available from Node 18.2 onward, and the optional call keeps the code working on older runtimes; check your version rather than trusting that line."
    },
    {
      "t": "ul",
      "items": [
        "Give every project a distinct port and record it in the README. Three services all defaulting to 3000 is a self-inflicted wound.",
        "In tests, bind port 0 and let the kernel pick: `server.listen(0)`, then read `server.address().port`. Parallel test runs stop fighting each other.",
        "Prefer a dev runner that kills the process group, not just the top-level process. If yours leaks, wrap it in a script that records the PGID.",
        "With Docker Compose, end sessions using `docker compose down` rather than Ctrl-C, so published ports and networks are actually released.",
        "If you genuinely need two processes listening on one port, that is `SO_REUSEPORT` territory rather than something to work around. Node exposes a `reusePort` listen option on recent versions, so read the `net.Server.listen` documentation for the version you are on."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Write the diagnosis down once",
      "x": "A three-line `make kill-port` target that prints the owning process and then asks for confirmation pays for itself the second time you hit this. It also stops the next person on the team from running `kill -9` against a PID they never looked at."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and why a container stops the moment its main process does.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Work through listen addresses, pg_hba.conf and firewalls in a fixed order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How resolution really works, and what ESM against CommonJS changes.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find what is using port 3000?",
          "a": "Run `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `ss -lptn 'sport = :3000'` on Linux without lsof, or `Get-NetTCPConnection -LocalPort 3000 -State Listen` in PowerShell. Each prints the PID, which you then resolve to a command name with `ps -p <pid>` or `Get-Process -Id <pid>`."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl-C?",
          "a": "Usually because the process you stopped was not the one holding the socket. Dev scripts commonly spawn the real server as a child, and that child survives its parent, keeping the listening file descriptor open. Run `ps -o pid,ppid,command -p <pid>` on whatever `lsof` reports: a parent PID of 1 confirms an orphan. The other possibility is that the server is still draining long-lived connections and has not released the socket yet."
        },
        {
          "q": "Is it safe to use kill -9 on the process holding my port?",
          "a": "On a local dev server, generally yes. `SIGKILL` cannot be caught, so the process skips cleanup: no flushed logs, no removed PID or lock file, no committed in-flight work. Send plain `kill` first, wait a couple of seconds, and escalate only if the process ignores it. Against a database or anything holding state, prefer the service's own stop command."
        },
        {
          "q": "Why do I get EADDRINUSE when lsof shows nothing?",
          "a": "Four common reasons. Docker holds a published port through a proxy or NAT rule, so check `docker ps --filter publish=3000`. Windows reserves dynamic port ranges for Hyper-V and WSL2, visible via `netsh int ipv4 show excludedportrange protocol=tcp`. Another process may hold a different address on the same port, which a `LISTEN`-filtered lsof hides. Or you looked at TCP while the conflict is on UDP."
        },
        {
          "q": "Does waiting fix address already in use?",
          "a": "Sometimes, and that is misleading. If the previous server is mid-shutdown, waiting a few seconds works. If a live process owns the port, waiting changes nothing no matter how long you leave it. The `TIME_WAIT` explanation people reach for rarely applies, because Node and most server libraries set `SO_REUSEADDR` on listening sockets by default."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, with `SO_REUSEPORT`, where the kernel load-balances incoming connections across the listeners. It is how multi-process servers scale without a front proxy. Every participating socket has to request it explicitly, so you cannot get it by accident, and support varies by platform and by runtime version. Check your own runtime's listen options before designing around it."
        },
        {
          "q": "How do I stop this happening after every crash?",
          "a": "Handle `SIGINT` and `SIGTERM` by calling `server.close()` with a timeout, add an `error` handler that prints the lookup command when the code is `EADDRINUSE`, and make sure your dev runner kills the process group rather than only its direct child. In tests, bind port 0 and let the kernel assign a free one."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-06",
  "updated": "2026-11-06",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
