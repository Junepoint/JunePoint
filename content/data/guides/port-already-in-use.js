module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on a Port",
  "h1": "Port already in use: find the process, then stop it properly",
  "eyebrow": "Troubleshooting",
  "description": "Find out which process holds a busy TCP port on macOS, Linux and Windows, stop it safely, and fix the orphaned child processes that cause EADDRINUSE after a crash.",
  "standfirst": "EADDRINUSE almost always means a live process is still listening, usually an orphan from your last run. Here is how to identify it, stop it without collateral damage, and keep it from happening again.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "find process using port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Identify the process holding a busy port, kill it safely, and stop your dev server leaving orphans behind.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `netstat -ano | findstr :3000` on Windows. That gives you the PID.",
        "Send `SIGTERM` (plain `kill`) first. Reach for `kill -9` only when the process ignores it, and never on a database.",
        "After a crash it is nearly always an orphaned child: the parent died, the listener it spawned did not, so it still owns the socket.",
        "TIME_WAIT is rarely the cause for a Node or Python server, because those runtimes set `SO_REUSEADDR` by default on Unix.",
        "If nothing shows up on the port, suspect Docker, a different network namespace, WSL, a root-owned process your `lsof` cannot see, or a system service."
      ]
    },
    {
      "t": "h2",
      "x": "Read the error first, it tells you the address"
    },
    {
      "t": "p",
      "x": "The error names the exact socket that failed to bind, and that detail decides which command you run next. Note whether it says `:::3000`, `0.0.0.0:3000` or `127.0.0.1:3000`. The first two mean every interface, so any conflicting listener on that port anywhere on the machine will collide."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node (surrounding stack frames vary by version)\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python on Linux\nOSError: [Errno 98] Address already in use\n\n# Python on macOS\nOSError: [Errno 48] Address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker\nBind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "One quick sanity check before you go hunting. If the port is below 1024 and you are not root, the kernel refuses the bind with `EACCES`, not `EADDRINUSE`. Different error, different fix: use a higher port, or grant the capability. People lose an hour to this on port 80 every day."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "You want three facts: the PID, the command behind it, and the user who owns it. The last one matters more than people expect, because `lsof` will silently omit sockets belonging to other users unless you run it with `sudo`."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# -n skips DNS lookups, -P skips port-name lookups. Both just make it faster.\n# Add sudo if the output is empty but the port is clearly taken:\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed (ss ships with iproute2)\nss -ltnp 'sport = :3000'\n\n# Full picture, including the parent process that spawned it\nps -o pid,ppid,user,etime,command -p 12345"
    },
    {
      "t": "p",
      "x": "That `ps` line is the one most guides leave out, and it is the one that explains the problem. The `PPID` tells you who started the listener. If it is `1` on Linux, or `launchd` on macOS, the parent is gone and you are looking at an orphan. The `etime` column tells you how long it has been running, which separates \"leftover from the run I killed two minutes ago\" from \"a service that starts at boot\"."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, cmd.exe: the last column is the PID\nnetstat -ano | findstr :3000\n\n# PowerShell, resolve the PID straight to a process name\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  ForEach-Object { Get-Process -Id $_.OwningProcess }\n\n# Then stop it\ntaskkill /PID 12345 /F"
    },
    {
      "t": "h2",
      "x": "Stop it: SIGTERM first, SIGKILL only if you must"
    },
    {
      "t": "p",
      "x": "A plain `kill` sends `SIGTERM`, which a well-behaved server catches so it can close connections, flush logs and release its socket in order. `kill -9` sends `SIGKILL`, which the process cannot catch. The socket is still released, because the kernel cleans up file descriptors on process death, but anything the process was part way through is simply abandoned."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Polite\nkill 12345\n\n# Check whether it actually went away\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Only now, if it is still there\nkill -9 12345\n\n# One-liner on macOS or Linux: SIGTERM to every listener on the port\nkill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)\n\n# Linux one-liner. Note that -k on its own sends SIGKILL,\n# so name the signal explicitly if you want a clean shutdown.\nfuser -k -TERM -n tcp 3000"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Look at the command name before you kill it",
      "x": "A port conflict is not always your code. Port 5432 is PostgreSQL, 3306 is MySQL, 6379 is Redis, 27017 is MongoDB. `kill -9` on a database means an unclean shutdown and crash recovery on next start, and on some configurations, lost writes. Stop those through their service manager instead. Likewise, resist `pkill -f node`: it will cheerfully take out an unrelated editor server or language service you needed."
    },
    {
      "t": "h2",
      "x": "Why it keeps happening after a crash"
    },
    {
      "t": "p",
      "x": "The common explanation you will read is that the port stays reserved for a while after your server stops. For Node, Python and most other runtimes on Unix, that is usually wrong. Those runtimes set `SO_REUSEADDR` on listening sockets by default, which is precisely the option that lets you rebind while old connections sit in `TIME_WAIT`. If you are getting `EADDRINUSE`, something is almost certainly still holding a `LISTEN` socket right now. Go and look for it rather than waiting."
    },
    {
      "t": "p",
      "x": "The real cause is orphaned children. `SIGKILL` is not propagated to a process's children, and neither is closing a terminal window in most setups. So when you force-quit `npm run dev`, the npm wrapper dies and the actual server it spawned keeps running, reparented to init, still bound to port 3000. Tooling that spawns layers of subprocesses makes this worse: a watcher starting your app, a concurrent task runner starting the watcher, a shell script starting the task runner. Kill the top of that chain hard and the bottom survives."
    },
    {
      "t": "p",
      "x": "Three other versions of the same story. Process managers like pm2 daemonize deliberately, so your app is still running after your terminal closes: check `pm2 list` before blaming anything else. A debugger that detaches without shutting the process down leaves it listening. And an app that catches `SIGTERM` to close gracefully can hang indefinitely if it has open keep-alive connections, because `server.close()` waits for existing sockets to finish, so you see a server that looks half-dead but still owns the port."
    },
    {
      "t": "h2",
      "x": "Which binds actually conflict"
    },
    {
      "t": "p",
      "x": "A port is not owned globally. It is owned per address, and the overlap rules are not obvious. Binding `127.0.0.1` and binding `0.0.0.0` on the same port conflict, because the wildcard covers the loopback address. Two different specific addresses do not."
    },
    {
      "t": "table",
      "head": [
        "Existing listener",
        "New bind attempt",
        "Result"
      ],
      "rows": [
        [
          "`0.0.0.0:3000`",
          "`127.0.0.1:3000`",
          "Fails. The wildcard already covers loopback."
        ],
        [
          "`127.0.0.1:3000`",
          "`0.0.0.0:3000`",
          "Fails. The new wildcard overlaps the existing socket."
        ],
        [
          "`127.0.0.1:3000`",
          "`192.168.1.10:3000`",
          "Works. Two distinct addresses, same port number."
        ],
        [
          "`[::]:3000` dual stack",
          "`0.0.0.0:3000`",
          "Fails on Linux by default, because an IPv6 wildcard also accepts IPv4 unless `net.ipv6.bindv6only=1`."
        ],
        [
          "`0.0.0.0:3000` inside a container",
          "`0.0.0.0:3000` on the host",
          "Works, separate network namespaces, unless the container published that port to the host."
        ]
      ],
      "caption": "Overlap behaviour for TCP listening sockets. SO_REUSEADDR does not let two listeners share an overlapping address; that requires SO_REUSEPORT, which is a deliberate choice, not a default."
    },
    {
      "t": "p",
      "x": "`SO_REUSEPORT` deserves a brief warning. On Linux it does allow several processes to listen on the same address and port, with the kernel balancing new connections between them. That is useful for zero-downtime restarts, and confusing as a debugging surprise: if something in your stack enables it, you can end up with two copies of your app serving alternate requests, which presents as intermittent stale responses rather than as an error. Check your framework's own docs for whether and how it exposes the option in the version you are running."
    },
    {
      "t": "h2",
      "x": "When nothing shows up on the port"
    },
    {
      "t": "p",
      "x": "You run `lsof`, it prints nothing, and the bind still fails. Work through these in order."
    },
    {
      "t": "ol",
      "items": [
        "**Run it with `sudo`.** Unprivileged `lsof` cannot see other users' sockets, so a root-owned service is invisible to it.",
        "**Check Docker.** `docker ps` and look at the published ports column. A published port is held by the Docker proxy or by an iptables rule, which may not look like an ordinary listener. `docker compose down` clears leftovers from a compose project that exited untidily.",
        "**Check the other side of WSL.** A Windows process holding the port is invisible from inside a WSL2 distribution, and vice versa for forwarded ports. Check from both.",
        "**On macOS, check the system services.** AirPlay Receiver has historically listened on port 5000 and port 7000, which collides with the default for several Python and Rails setups. It can be turned off in System Settings under General, then AirDrop & Handoff. Treat the exact pane name as version dependent and confirm on your own release.",
        "**Check for a stale container or namespace.** `sudo ss -ltnp` on the host shows listeners across the default namespace; a process in its own netns will not appear in your usual output at all.",
        "**Re-read the port number.** A config file, an `.env` you forgot was loaded, or a `PORT` variable exported in your shell profile can mean your app is binding a different port than the one you are investigating."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it recurring"
    },
    {
      "t": "p",
      "x": "Killing the orphan fixes today. Handling signals properly fixes the pattern. A server that shuts down cleanly on `SIGINT` and `SIGTERM`, with a hard deadline so it cannot hang forever on keep-alive sockets, will not leave you a surprise listener."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(process.env.PORT || 3000);\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n\n  server.close(() => process.exit(0));\n\n  // Available in Node 18.2 and later. Idle keep-alive sockets\n  // would otherwise keep close() waiting indefinitely.\n  server.closeIdleConnections?.();\n\n  // Last resort, so a stuck handler cannot hold the port forever.\n  setTimeout(() => process.exit(1), 5000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "If your own code spawns a server as a child process, start it detached so it becomes a process group leader, then signal the whole group on the way out. A negative PID means \"this process group\"."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const { spawn } = require('node:child_process');\n\nconst child = spawn('node', ['server.js'], { detached: true, stdio: 'inherit' });\n\nprocess.on('exit', () => {\n  try {\n    process.kill(-child.pid, 'SIGTERM'); // the group, not just the child\n  } catch {}\n});"
    },
    {
      "t": "p",
      "x": "For tests, stop hardcoding a port. Bind to port 0 and let the kernel hand you a free one, then read it back. Parallel test runners and CI agents conflict constantly over fixed ports, and this removes the whole class of failure."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The one-line habit worth building",
      "x": "Before starting a dev server, `lsof -nP -iTCP:$PORT -sTCP:LISTEN` costs nothing and answers the question before the stack trace does. Wiring it into a `predev` npm script, printing the owning command and exiting with a clear message, turns a confusing crash into one line of useful output."
    },
    {
      "t": "cards",
      "items": [
        {
          "eyebrow": "Guide",
          "title": "Docker containers that exit immediately",
          "desc": "Trace a container that stops as soon as it starts, using logs and exit codes rather than guesswork.",
          "href": "/guides/docker-container-exits-immediately/"
        },
        {
          "eyebrow": "Guide",
          "title": "PostgreSQL connection refused",
          "desc": "The opposite symptom: nothing is listening where you expected. Check each layer in order.",
          "href": "/guides/postgres-connection-refused/"
        },
        {
          "eyebrow": "Guide",
          "title": "Node \"Cannot find module\"",
          "desc": "Why module resolution fails, and how ESM and CommonJS differ in what they will load.",
          "href": "/guides/cannot-find-module-node/"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)`. On Windows, find the PID with `netstat -ano | findstr :3000` and then run `taskkill /PID <pid> /F`. Check the process name before you do it, so you do not kill a database or an editor language server that happens to use that port."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is running?",
          "a": "Something is running, you just cannot see it from where you are looking. The usual causes are an orphaned child process whose parent you killed, a process owned by another user that `lsof` hides without `sudo`, a Docker container publishing the port, or a process on the other side of a WSL boundary. Check `sudo ss -ltnp` and `docker ps` before concluding the port is free."
        },
        {
          "q": "How long does a port stay in use after I stop a server?",
          "a": "For a Node or Python server on macOS or Linux, usually no time at all, because those runtimes set `SO_REUSEADDR` by default and that option is what makes lingering `TIME_WAIT` connections harmless. If rebinding fails, waiting will not help. Go and find the live listener instead."
        },
        {
          "q": "Is it safe to use kill -9 on a process holding a port?",
          "a": "For a stateless dev server, yes, and the socket is released immediately. For anything with on-disk state, no. `SIGKILL` cannot be caught, so a database gets an unclean shutdown and has to run crash recovery, and unflushed writes can be lost. Try plain `kill` first and give it a few seconds."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Only in two situations. They can bind different specific addresses, such as `127.0.0.1:3000` and `192.168.1.10:3000`. Or they can both set `SO_REUSEPORT`, which asks the kernel to balance incoming connections between them. A wildcard bind such as `0.0.0.0:3000` conflicts with every other bind on that port, loopback included."
        },
        {
          "q": "Why does my dev server leave an orphan every time it crashes?",
          "a": "Because `SIGKILL` is not passed to child processes. When a watcher or task runner is force-quit, the server it spawned is reparented to init and keeps its socket. Handle `SIGINT` and `SIGTERM` in the server, add a shutdown timeout so keep-alive connections cannot stall `server.close()`, and if your code spawns children, start them detached and signal the process group with `process.kill(-pid)`."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-04",
  "updated": "2026-11-04",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
