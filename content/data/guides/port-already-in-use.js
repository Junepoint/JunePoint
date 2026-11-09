module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "EADDRINUSE: finding and freeing a busy port",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding a TCP port on Linux, macOS and Windows, free it safely, and understand why EADDRINUSE outlives a crashed dev server.",
  "standfirst": "One command tells you which process owns the port. The harder question is why the old one is still there, and whether killing it is the right move.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "find process using port"
  ],
  "cardDesc": "Identify the process holding a port, free it without collateral damage, and stop orphaned dev servers recurring.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or `sudo ss -ltnp 'sport = :3000'` on Linux names the process holding the port. Everything else follows from that.",
        "After a crash, the usual culprit is a surviving child process, not a lingering socket. Ctrl+C reaches the foreground process group, and a detached or orphaned child is not in it.",
        "The popular TIME_WAIT explanation rarely applies to Node, Go or Python's `HTTPServer`, because all of them set `SO_REUSEADDR` on the listening socket already.",
        "`kill` first, `kill -9` only if the process ignores it. Forcing a database or a message broker to die loses work and can leave a stale lock file behind.",
        "If `docker-proxy` owns the port, stop the container. Killing the proxy process leaves Docker's networking in an inconsistent state."
      ]
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "p",
      "x": "Each runtime reports the same kernel refusal in its own words, and the exact wording matters when you are searching logs. The number in the message is the errno: 48 on macOS and BSD, 98 on Linux, 10048 on Windows."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Message",
        "Notes"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` means it tried to bind the IPv6 wildcard; `0.0.0.0:3000` or `127.0.0.1:3000` appear when a host was given"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 48 on macOS. Raised by `bind()`, before any request is served"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "Returned as an error from `net.Listen`, so it is easy to swallow by accident"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Spring Boot wraps it in a longer `WebServerException` trace"
        ],
        [
          "Windows",
          "`Only one usage of each socket address ... is normally permitted`",
          "WSAEADDRINUSE, code 10048"
        ]
      ],
      "caption": "The same underlying refusal, five different strings to grep for."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "EACCES is a different problem",
      "x": "If the error code is `EACCES` or `PermissionError` rather than `EADDRINUSE`, nothing is holding the port. You are trying to bind a privileged port below 1024 without the capability to do so, or on Windows you have hit a range reserved by Hyper-V. Run `netsh interface ipv4 show excludedportrange protocol=tcp` to see those reservations. The fix is a different port or a different privilege, not a kill command."
    },
    {
      "t": "h2",
      "x": "Step one: name the process"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: PID and program name. Needs root to see the name.\nsudo ss -ltnp 'sport = :3000'\n\n# macOS and Linux: listeners only, no DNS or port-name lookups\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Windows, PowerShell\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /fi \"pid eq 12345\""
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter is worth typing out. A bare `lsof -i :3000` also lists every client with an established connection to that port, so your browser, a `curl` left running and any open WebSocket all show up as results. People who pipe that straight into `kill` sometimes close their editor instead of their server."
    },
    {
      "t": "p",
      "x": "Read the output before acting on it. You are looking for three things: the command name, the PID, and the parent PID. A command of `node` with a parent of `nodemon` tells a completely different story from a command of `docker-proxy` or `com.apple.ControlCenter`."
    },
    {
      "t": "h2",
      "x": "Step two: free it, carefully"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Look at what you are about to kill",
          "x": "Elapsed time is the useful column. A process that has been up for three days is not the dev server you started two minutes ago.",
          "code": "ps -o pid,ppid,user,etime,command -p 48213"
        },
        {
          "title": "Ask politely first",
          "x": "A plain `kill` sends SIGTERM, which lets the process run its shutdown handlers, flush buffers and release locks. Most well-behaved servers exit within a second or two.",
          "code": "kill 48213"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "SIGKILL cannot be caught, so no cleanup runs. Use it on a wedged dev server without hesitation, and on anything holding state only as a last resort.",
          "code": "kill -9 48213"
        },
        {
          "title": "Or do it in one step on Linux",
          "x": "`fuser` resolves the port and signals the owner itself. Add `-TERM` to be gentle; the default for `-k` is SIGKILL.",
          "code": "sudo fuser -k -TERM 3000/tcp"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not SIGKILL a database to free a port",
      "x": "If the listener on the port is PostgreSQL, MySQL, Redis or a broker, `kill -9` skips the clean shutdown. Postgres will recover by replaying WAL on next start, but unflushed work is gone and a stale `postmaster.pid` can block the restart. Stop it through its service manager instead: `brew services stop postgresql@16`, `sudo systemctl stop postgresql`, or `docker compose stop db`."
    },
    {
      "t": "h2",
      "x": "Why it survives a crash"
    },
    {
      "t": "p",
      "x": "This is the part most answers skip. The port is still held because a process is still holding it, and the interesting question is which process and why it outlived the thing you thought you stopped."
    },
    {
      "t": "h3",
      "x": "The orphaned child"
    },
    {
      "t": "p",
      "x": "Ctrl+C in a terminal sends SIGINT to the foreground process group. A dev setup commonly runs three or four processes deep: your shell starts `npm`, `npm` starts a watcher, the watcher starts your server, and your server may fork workers of its own. If any link in that chain spawns with `detached: true`, sets its own process group, or exits without signalling its children, the survivors keep the listening socket open. They are reparented to init and keep running happily with nobody watching."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Node-ish processes with their parents, so orphans stand out\nps -eo pid,ppid,etime,command | grep -E 'node|nodemon|vite' | grep -v grep\n\n# Everything sharing a process group with a stuck server\nps -eo pid,pgid,command | awk '$2 == 48213'\n\n# Kill a whole process group (note the minus sign)\nkill -TERM -48213"
    },
    {
      "t": "p",
      "x": "A parent PID of 1 (or of `launchd` on macOS) is the signature of an orphan. That is your answer."
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT story, and why it is usually wrong"
    },
    {
      "t": "p",
      "x": "The advice you will find most often is that the socket is in TIME_WAIT and you should wait sixty seconds. This is real TCP behaviour but it is the wrong diagnosis in most modern stacks. TIME_WAIT applies to the four-tuple of a connection that was already accepted and closed, not to the listening socket. On Linux the wait is a compile-time constant of 60 seconds. Crucially, a new listener can bind over those connections whenever it sets `SO_REUSEADDR`, and libuv (so Node), the Go runtime and Python's `HTTPServer` all set it by default. Raw `socket` code in Python or C often does not, which is exactly where the folklore came from."
    },
    {
      "t": "p",
      "x": "So if a restart fails immediately and succeeds a minute later without you killing anything, TIME_WAIT is plausible. If it fails consistently, something is listening right now. `SO_REUSEADDR` never lets two processes listen on the same address and port; only `SO_REUSEPORT` does that, and it is opt-in for deliberate load sharing across workers."
    },
    {
      "t": "h3",
      "x": "Something else owns it entirely"
    },
    {
      "t": "ul",
      "items": [
        "**Docker.** A published port is held by `docker-proxy` or by the daemon's iptables rules, even if the container inside is crash-looping. Run `docker ps --format '{{.Names}}\\t{{.Ports}}'` and stop the container. See [why a container exits immediately](/guides/docker-container-exits-immediately/) if it is restarting faster than you can read its logs.",
        "**macOS AirPlay Receiver.** Ports 5000 and 7000 are claimed by a system service on recent macOS versions, which is why a Flask app defaulting to 5000 can fail on a freshly booted Mac. Check the owner with `lsof` first; if it is `ControlCe` or `rapportd`, turn AirPlay Receiver off in System Settings rather than killing it. Verify against your own macOS version, as the affected ports have shifted between releases.",
        "**A systemd socket unit or launchd agent.** These bind the port themselves and hand it to your service. Kill the process and something starts it again within seconds. Stop the socket unit, not the process.",
        "**An address overlap you did not intend.** Binding `0.0.0.0:3000` conflicts with anything already on that port, including a listener bound only to `127.0.0.1:3000`. Two listeners on distinct specific addresses can coexist on Linux. Check the local address column, not just the port number.",
        "**A second copy of your own editor's task runner.** VS Code tasks, JetBrains run configurations and tmux panes all keep processes alive across window closes."
      ]
    },
    {
      "t": "h2",
      "x": "Making it stop happening"
    },
    {
      "t": "p",
      "x": "Killing the port by hand every morning is a symptom. Two code changes remove most of the recurrence: shut down cleanly on signals, and fail loudly with a useful message when the port genuinely is taken."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = http.createServer(app);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is in use. Find the owner with:`);\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n    // Keep-alive sockets can hold close() open indefinitely.\n    // server.closeAllConnections() exists from Node 18.2; check your version.\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "That `setTimeout` matters more than it looks. `server.close()` stops accepting new connections but waits for existing ones to finish, and an idle HTTP keep-alive connection from a browser tab counts as existing. Without a deadline, your process hangs in shutdown while still holding the port, which is a self-inflicted version of this whole problem."
    },
    {
      "t": "p",
      "x": "For tests and anything running in CI, stop hard-coding the port. Listening on port 0 asks the kernel for a free ephemeral port, then you read back what you got."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "server.listen(0, () => {\n  const { port } = server.address();\n  console.log(`listening on ${port}`);\n});"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A one-line shell helper",
      "x": "Add `freeport() { lsof -t -nP -iTCP:\"$1\" -sTCP:LISTEN | xargs -r kill; }` to your shell profile, then run `freeport 3000`. The `-sTCP:LISTEN` filter keeps clients out of the kill list, and the default SIGTERM gives the server a chance to exit cleanly. Drop `-r` on macOS, where BSD `xargs` does not support it."
    },
    {
      "t": "h2",
      "x": "When the port is free and it still fails"
    },
    {
      "t": "p",
      "x": "Occasionally `lsof` and `ss` report nothing and the bind still fails. Check, in order: that you are looking on the right machine (a container, a VM or a WSL instance has its own network namespace, so `lsof` on the host will not see a listener inside it); that your process is not binding twice in its own startup path, which happens when a module is imported under two different specifiers and runs its side effects twice; and that the address is one the host actually has, because binding a specific IP that no longer exists on any interface produces `EADDRNOTAVAIL`, which reads similarly in a hurried glance."
    },
    {
      "t": "p",
      "x": "The double-bind case is worth dwelling on. If your server starts, logs its port, and then immediately reports the port in use, you are almost certainly running your entry file twice. A watcher restarting before the old process exits does this, and so does a mixed CommonJS and ESM import graph, which is covered in [why Node module resolution fails](/guides/cannot-find-module-node/)."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "A crash-looping container can still hold its published port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this error: nothing is listening where you expect.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Resolution problems that can make one entry file run twice.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "Find it with `lsof -nP -iTCP:3000 -sTCP:LISTEN` (macOS or Linux) or `sudo ss -ltnp 'sport = :3000'` (Linux), then `kill <PID>`. If it does not exit within a few seconds, `kill -9 <PID>`. On Linux `sudo fuser -k 3000/tcp` does both steps at once. On Windows, `netstat -ano | findstr :3000` gives the PID and `taskkill /PID <pid> /F` ends it."
        },
        {
          "q": "Why does the port stay busy after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group only. If your server was started through a watcher or a package script, or if it spawned a detached child, the process actually holding the socket may not be in that group. Check the parent PID of the listener: a PPID of 1 means it was orphaned and is now running unsupervised. Kill the whole group with `kill -TERM -<PGID>`."
        },
        {
          "q": "Do I need to wait 60 seconds for TIME_WAIT to clear?",
          "a": "Usually no, and this is the most repeated wrong answer. TIME_WAIT affects closed connections rather than the listening socket, and any listener that sets `SO_REUSEADDR` can bind straight over it. Node, Go and Python's `HTTPServer` set it by default. If a restart fails every single time, a live process holds the port and waiting will not help."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "On a stuck dev server, yes. On anything that writes data, it is a last resort, because SIGKILL cannot be caught so no flush, no unlock and no cleanup happens. Databases recover but can lose recent writes and leave a stale PID file that blocks the next start. Try SIGTERM, give it five seconds, then escalate."
        },
        {
          "q": "Why can't I bind to port 5000 on my Mac?",
          "a": "On recent macOS releases, AirPlay Receiver listens on 5000 (and 7000), which breaks the common Flask default. Confirm the owner with `lsof -nP -iTCP:5000 -sTCP:LISTEN`; if it is a `ControlCenter` or `rapportd` process, disable AirPlay Receiver in System Settings or move your app to another port. The exact ports have changed between macOS versions, so check against yours."
        },
        {
          "q": "lsof shows nothing but the bind still fails. What now?",
          "a": "You are probably looking in the wrong network namespace. A listener inside Docker, a VM or WSL is invisible to `lsof` on the host, so check with `docker ps` or run the command inside the container. Also confirm your own startup code is not binding twice, and read the error code carefully: `EADDRNOTAVAIL` means the IP address is not on this host, which is a different fix entirely."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-09",
  "updated": "2026-11-09",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
