module.exports = {
  "slug": "port-already-in-use",
  "title": "Port Already in Use: Find and Fix EADDRINUSE",
  "h1": "Fixing EADDRINUSE: the port is already in use",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means a process still holds the socket. Find it with lsof, ss or netstat, stop it safely, and fix the shutdown bug behind it.",
  "standfirst": "A port stays busy because something is still holding the socket. Here is how to identify it, stop it cleanly, and fix the crash that left it running.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the process holding a port, stop it without collateral damage, and fix the shutdown bug that stranded it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The port is not \"still closing\". Something is still listening. Find it before you reach for `kill -9`.",
        "One command per platform: `lsof -nP -iTCP:3000 -sTCP:LISTEN`, `ss -ltnp 'sport = :3000'`, or `netstat -ano | findstr :3000`.",
        "After a crash, the owner is usually a child process that inherited the listening socket and outlived its parent.",
        "The durable fix is a SIGTERM handler that calls `server.close()`, plus `listen(0)` in tests.",
        "Port 5000 on macOS is AirPlay Receiver. A bind failure on Windows with nothing in `netstat` is usually a reserved port range."
      ]
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "p",
      "x": "Every runtime reports the same kernel refusal in its own words. The useful parts are the address and the port, because they tell you exactly what to search for."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node 16 and later\nError: listen EADDRINUSE: address already in use :::3000\n\n# Node 14 and earlier, same failure, terser wording\nError: listen EADDRINUSE :::3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Django's development server\nError: That port is already in use.\n\n# Docker\nBind for 0.0.0.0:3000 failed: port is already allocated\n\n# Java\njava.net.BindException: Address already in use"
    },
    {
      "t": "p",
      "x": "`:::3000` is not a typo or a truncated path. It is the IPv6 wildcard address `::` followed by the port, which is what a server gets when it binds to every interface. `0.0.0.0:3000` is the IPv4 equivalent. The distinction starts to matter as soon as you bind to one interface on purpose: a server already sitting on `0.0.0.0:3000` will block a second bind to `127.0.0.1:3000`, because the wildcard already covers that address."
    },
    {
      "t": "p",
      "x": "The numeric errno differs by platform, 98 on Linux and 48 on macOS, and Node flattens both into the string `EADDRINUSE` on the error object along with `syscall`, `address` and `port`. That object is worth catching, and there is an example of doing so near the end of this page."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "EADDRINUSE is not EACCES",
      "x": "Binding to a port below 1024 as an unprivileged user fails with `EACCES`, not `EADDRINUSE`. If port 80 or 443 refuses you with `EACCES`, nothing is holding the port and no amount of hunting for a PID will help. You need a capability, a reverse proxy in front, or a higher port number."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Everything touching the port, open connections included\nlsof -nP -i:3000\n\n# Inspect the PID you found, and its parent\nps -o pid=,ppid=,user=,command= -p 48213"
    },
    {
      "t": "p",
      "x": "`-n` skips reverse DNS and `-P` skips service-name lookups, so the command returns instantly and prints `3000` rather than a name out of `/etc/services`. `-sTCP:LISTEN` drops established connections from the output. Leave it off and you will also see every browser tab currently talking to your dev server, which is noise when the question is simply who owns the socket."
    },
    {
      "t": "p",
      "x": "Both tools quietly hide what they cannot see. `ss` and `lsof` will not show the PID of a process belonging to another user unless you run them as root. So if the output looks empty but `listen()` still fails, run it again with `sudo` before concluding that the port is haunted."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess\nGet-Process -Id 18244\n\n# cmd.exe\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 18244\""
    },
    {
      "t": "p",
      "x": "On Linux with Docker, the listener you find is often `docker-proxy` rather than your application, and on Docker Desktop it is one of Docker's own backend processes. Killing it is the wrong move: you will free the port and leave Docker's view of the world inconsistent. Ask Docker instead. `docker ps --filter publish=3000` names the container, and `docker stop` releases the mapping properly."
    },
    {
      "t": "h2",
      "x": "Stop it, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm what you are about to kill",
          "x": "Read the user and the full command line, not just the PID. PIDs are reused, and the number in your scrollback from five minutes ago may now belong to something else entirely.",
          "code": "ps -p 48213 -o user=,command="
        },
        {
          "title": "Ask it to stop",
          "x": "Plain `kill` sends SIGTERM, which a well-behaved server catches so it can close connections and flush state. Give it a second, then check the port again rather than assuming.",
          "code": "kill 48213\nlsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "SIGKILL cannot be caught, so the process gets no chance to clean up. That is the trade: an immediately free port in exchange for whatever the process was midway through.",
          "code": "kill -9 48213      # macOS, Linux\ntaskkill /PID 18244 /F   # Windows"
        },
        {
          "title": "Check the port, not the process list",
          "x": "A successful kill is not the same thing as a free port. Re-run the lookup. If a *different* PID now owns 3000, you have just found the child process that outlived its parent, and that is a shutdown bug in the app rather than a reason to keep killing things.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Two habits worth dropping",
      "x": "`pkill -f node` kills every Node process you own. That includes your editor's language server, a test watcher, and the unrelated project in another tab. And `kill -9` aimed at a database, a queue worker or anything holding a lock can leave a stale lock file or a half-written record behind. Target the PID the lookup gave you, and start with SIGTERM."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "A listening socket is a file descriptor, and the kernel releases the port when the last descriptor referring to that socket is closed. `fork()` copies descriptors into the child. Put those two facts together and the whole class of problem falls out: a parent that died without closing its socket, plus a child that inherited the descriptor and is still running, equals a port owned by a process you were not thinking about. Everything below is a variation on that one mechanism."
    },
    {
      "t": "ul",
      "items": [
        "**Cluster and worker processes.** SIGKILL the primary and the workers keep the inherited handle. `ps -ef | grep node` shows more processes than you remember starting.",
        "**File watchers.** `nodemon`, `tsx watch`, `vite` and the rest run your server as a child process. If the watcher dies hard, the child is reparented to init and carries on listening.",
        "**`spawn(..., { detached: true })`.** The child sits in its own process group, which is exactly what stops your Ctrl-C from reaching it.",
        "**A crash that is not an exit.** An unhandled rejection or a deadlocked event loop leaves the process alive but useless. The socket stays open because the process is still there.",
        "**Closing the terminal.** Closing a tab sends SIGHUP to the foreground job, but a process started under `nohup`, or disowned, survives it happily.",
        "**Docker.** The container is still running, or a restart policy keeps bringing it back a second after you stop it.",
        "**A second copy you forgot about.** The debugger launch plus the `npm run dev` that was already going. This is more common than any of the above."
      ]
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT myth"
    },
    {
      "t": "p",
      "x": "The advice you will find most often is that the port is stuck in `TIME_WAIT` and you have to wait it out. For a Node server, that is usually wrong. `TIME_WAIT` applies to one connection, identified by the four-tuple of local address, local port, remote address and remote port. It is not a property of a listening socket. On top of that, libuv sets `SO_REUSEADDR` on listening sockets by default, and that option exists precisely so a fresh `listen()` succeeds despite leftover `TIME_WAIT` entries."
    },
    {
      "t": "p",
      "x": "What `SO_REUSEADDR` does not do, on Linux or macOS, is let two processes listen on the same address and port simultaneously. That requires `SO_REUSEPORT`. So when `listen()` returns EADDRINUSE, the overwhelmingly likely explanation is a live process. Run `ss -tan 'sport = :3000'` and read the states: a row in `LISTEN` is a process you need to find, while a screen of `TIME_WAIT` rows and no `LISTEN` row points at your bind address instead."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "The silent version of this bug",
      "x": "If `SO_REUSEPORT` is in play, some frameworks and some Node versions expose a `reusePort` listen option, two copies of your server can bind without any error at all and the kernel will split incoming connections between them. No EADDRINUSE, just half your requests answered by stale code. Check the `net.Server.listen` documentation for the Node version you are actually running before enabling it."
    },
    {
      "t": "h2",
      "x": "When it is not your process"
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "Likely owner",
        "What to do"
      ],
      "rows": [
        [
          "Port 5000 or 7000 fails on macOS",
          "AirPlay Receiver, which shows up as `ControlCenter`",
          "Turn off AirPlay Receiver in System Settings, under General then AirDrop & Handoff, or move your app to another port."
        ],
        [
          "Windows bind fails, nothing in `netstat`",
          "A reserved dynamic port range from Hyper-V, WSL2 or Docker Desktop",
          "Run `netsh interface ipv4 show excludedportrange protocol=tcp`. If your port falls inside a listed range, choose another port or restart the `winnat` service."
        ],
        [
          "`docker-proxy` or a Docker backend process owns it",
          "A running or restarting container",
          "`docker ps --filter publish=3000`, then `docker stop`. Do not kill `docker-proxy` directly."
        ],
        [
          "A PID you cannot see or signal",
          "Another user, or a system daemon",
          "Re-run the lookup with `sudo`. On a shared machine, ask the owner before killing anything."
        ],
        [
          "A managed laptop refusing a common port",
          "A security agent or proxy installed centrally",
          "Read the process name in the `lsof` output before assuming the process is yours to kill."
        ]
      ],
      "caption": "Ports that fail for reasons unrelated to your code. Platform behaviour changes between releases, so verify against your own version."
    },
    {
      "t": "p",
      "x": "The Windows case burns the most time, because the port genuinely has no owner. The range is reserved, so nothing can bind inside it, and no process list will ever explain why. Those reserved ranges are chosen dynamically and can move after a reboot, which is how a port that worked yesterday fails this morning with no change on your side."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Finding and killing a process is the symptom fix. The cause is almost always a server that never got the chance to close its socket. Twelve lines of shutdown handling removes most of this problem permanently."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nconst shutdown = (signal) => () => {\n  console.log(`${signal}: closing server`);\n  server.close(() => process.exit(0));\n\n  // Idle keep-alive sockets can stop close() from ever finishing.\n  // closeIdleConnections() exists on newer http.Server; guard for older Node.\n  if (typeof server.closeIdleConnections === 'function') {\n    server.closeIdleConnections();\n  }\n\n  // Backstop: never hold the port hostage for more than a few seconds.\n  setTimeout(() => process.exit(1), 5000).unref();\n};\n\nprocess.on('SIGINT', shutdown('SIGINT'));\nprocess.on('SIGTERM', shutdown('SIGTERM'));"
    },
    {
      "t": "p",
      "x": "`server.close()` stops accepting new connections and fires its callback once the in-flight ones finish. Keep-alive sockets sitting idle are the usual reason that callback never arrives, which is what `closeIdleConnections()` addresses on Node versions that have it. The timeout is the backstop. A server that cannot shut down within a few seconds should kill itself, rather than making you find it with `lsof` later."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// In tests, let the kernel pick a free port instead of hard-coding one.\nconst server = app.listen(0);\nconst { port } = server.address();\n\n// And turn the stack trace into a sentence someone can act on.\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${err.port} is taken. Find the owner with:\\n` +\n      `  lsof -nP -iTCP:${err.port} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});"
    },
    {
      "t": "p",
      "x": "`listen(0)` requests an ephemeral port, so a parallel test run cannot collide with itself or with the dev server you left running. For anyone whose CI goes red at random once a week, it is the highest-value line on this page."
    },
    {
      "t": "ul",
      "items": [
        "Give each project its own port and record it in the README. Everything on 3000 is why you are here.",
        "Run the server binary directly where you can, instead of through two layers of `npm run`. Signals have fewer places to get lost on the way down.",
        "If you spawn children, signal the group rather than the leader: `kill -- -$PGID` on Unix, or a process-tree helper on Windows, where groups behave differently.",
        "Prefer `docker compose down` to Ctrl-C and walking away. A detached container is a listening socket that `ps` will never show you.",
        "`npx kill-port 3000` is convenient and cross-platform. It is also an unconditional kill by port number, so keep it for your own dev server and nothing else."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and why a container stops the moment its main process does.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Work through the layers in order: process, listen address, firewall, then pg_hba.conf.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node: cannot find module",
          "desc": "How resolution really works, and why ESM and CommonJS disagree about your imports.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find out what is using port 3000?",
          "a": "On macOS or Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN`. On Linux without lsof: `ss -ltnp 'sport = :3000'`. On Windows: `netstat -ano | findstr :3000`, then `tasklist /FI \"PID eq <pid>\"` to turn the PID into a name. Add `sudo` on Unix if the output is empty, because neither tool shows PIDs owned by other users without it."
        },
        {
          "q": "Does kill -9 free the port immediately?",
          "a": "For that process, yes. The kernel closes its descriptors as it tears the process down. The port can still look busy afterwards if a child process inherited the listening socket and is still alive, which is why the check after the kill matters. If a new PID now owns the port, you killed the parent and left the child."
        },
        {
          "q": "Why is the port still in use after my app crashed?",
          "a": "Because something that was part of your app is still running. A listening socket survives as long as any process holds a descriptor for it, and child processes inherit descriptors. Cluster workers, watcher children and anything spawned with `detached: true` all outlive a parent that was killed rather than shut down."
        },
        {
          "q": "Is it safe to kill whatever is on the port?",
          "a": "Only once you have read the command line. On your own machine, killing your own dev server is harmless. Blanket commands like `pkill -f node` are not: they take out language servers, watchers and other projects. A SIGKILL against a database or a worker holding a lock can also leave real mess behind."
        },
        {
          "q": "How long does a port stay in TIME_WAIT?",
          "a": "On Linux it is fixed at 60 seconds and is not tunable by sysctl, despite a lot of advice pointing at `tcp_fin_timeout`, which controls something else. For a server process this rarely matters: `TIME_WAIT` belongs to an individual connection, and listening sockets in Node already set `SO_REUSEADDR`."
        },
        {
          "q": "Why does port 5000 fail on my Mac?",
          "a": "AirPlay Receiver listens there, and on port 7000, on recent macOS versions. `lsof` reports the owner as `ControlCenter`. Turn AirPlay Receiver off in System Settings under General, AirDrop & Handoff, or pick a different port for your app. Apple has moved these details between releases, so check your own version."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-13",
  "updated": "2026-10-13",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
