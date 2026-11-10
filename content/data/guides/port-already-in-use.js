module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on a Port",
  "h1": "Port already in use: finding the process that holds it",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding a port with lsof, ss or netstat, end it safely, and fix the crash pattern that leaves orphaned listeners behind.",
  "standfirst": "Almost every EADDRINUSE is a live process you forgot about, not a lingering socket. Here is how to identify it in one command, end it without collateral damage, and stop your dev server from leaking listeners when it crashes.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port",
    "netstat find pid port"
  ],
  "cardDesc": "Identify what holds a port, end it cleanly, and stop crashed dev servers from leaving orphaned listeners.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means the `bind()` call failed because something already listens on that protocol, address and port combination. It is a report, not a mystery.",
        "Identify the owner before you kill anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the usual culprit is an orphaned child process that outlived its parent, not a socket stuck in `TIME_WAIT`.",
        "`TIME_WAIT` rarely blocks a new listener, because Node, Go and most server runtimes set `SO_REUSEADDR` on listening sockets by default.",
        "Send `SIGTERM` first and `SIGKILL` only if that fails. `kill -9` skips the cleanup code that would have released everything else properly.",
        "Binding to port `0` in tests removes the whole class of problem: the kernel hands you a free port."
      ]
    },
    {
      "t": "h2",
      "x": "The command you came here for"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is listening on TCP 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Ask politely, then insist\nkill 51234\nkill -9 51234\n\n# One step, once you trust the match\nkill $(lsof -t -iTCP:3000 -sTCP:LISTEN)"
    },
    {
      "t": "p",
      "x": "The flags matter more than they look. `-nP` stops `lsof` from resolving hostnames and port names, which makes it fast and keeps the output readable. `-sTCP:LISTEN` filters out the established connections that may also mention port 3000, leaving only the socket that is actually blocking you. Without that filter you will see a browser tab's outbound connection in the list, and you may kill the wrong thing."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, cmd or PowerShell: find the owning PID\nnetstat -ano | findstr :3000\n\n# PowerShell, with the process name attached\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# End it\ntaskkill /PID 51234 /F"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Read the PID before you trust it",
      "x": "`netstat -ano` prints the PID in the last column, and the column for a `LISTENING` row is easy to misread next to a wall of `TIME_WAIT` rows. Pipe it through `findstr LISTENING` as well. A PID of `4` is the Windows `System` process, which you must not kill; see the excluded port ranges section below for what that usually means."
    },
    {
      "t": "h2",
      "x": "What EADDRINUSE actually means"
    },
    {
      "t": "p",
      "x": "A listening socket is identified by a tuple: protocol, local address, local port. The kernel refuses a second `bind()` to the same tuple, and your runtime surfaces that refusal as `EADDRINUSE`. Node's version looks like this:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1872:16)\n    ...\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000"
    },
    {
      "t": "p",
      "x": "That `:::3000` is worth reading carefully. It means the socket was bound to the IPv6 wildcard address, which on most systems also accepts IPv4 traffic. So a server on `0.0.0.0:3000` and a server on `127.0.0.1:3000` do collide, but not symmetrically: a wildcard bind conflicts with everything on that port, while two binds to two different specific addresses coexist happily. If one service listens on `127.0.0.1:8080` and another tries `0.0.0.0:8080`, the second one fails, and the error message will not spell out why."
    },
    {
      "t": "p",
      "x": "UDP and TCP are separate namespaces. A resolver on UDP 5353 does not stop you binding TCP 5353. If you are chasing a conflict for something that speaks both, check both."
    },
    {
      "t": "h2",
      "x": "Why it keeps happening after a crash"
    },
    {
      "t": "p",
      "x": "This is the part people get wrong. The folklore answer is `TIME_WAIT`, and the folklore answer is usually incorrect for a listening socket. Here is the honest ranking of causes, from most to least common in a development loop."
    },
    {
      "t": "h3",
      "x": "1. An orphaned child process"
    },
    {
      "t": "p",
      "x": "Most dev servers are a tree, not a process. `npm run dev` spawns a shell, which spawns `nodemon` or `vite` or `next`, which spawns the worker that actually owns the socket. Press Ctrl+C and your terminal sends `SIGINT` to the foreground process group. If a child escaped that group, through `detached: true`, through a stray `&` in a script, or because a supervisor re-spawned it just as the parent died, the child keeps running and keeps the port. Your terminal looks idle. The port is not."
    },
    {
      "t": "p",
      "x": "The tell is that `lsof` names a process you thought was dead. Check its ancestry before killing it:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who holds it?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# And who spawned them? A PPID of 1 means the parent is gone.\nps -o pid,ppid,pgid,stat,etime,command -p 51234\n\n# If the parent is still alive, take out the whole group\nkill -TERM -51230   # the leading dash means \"process group\""
    },
    {
      "t": "h3",
      "x": "2. A process that crashed without closing its server"
    },
    {
      "t": "p",
      "x": "When a process truly exits, the kernel closes its sockets whether the code asked for it or not. A segfault, an OOM kill, even `kill -9` all release the port. So if the port is still held, something is still alive and holding it. The exception is a process wedged in an uninterruptible state, which shows as `D` in the `STAT` column of `ps`, and that is a different problem."
    },
    {
      "t": "h3",
      "x": "3. A container or supervisor restarting it for you"
    },
    {
      "t": "p",
      "x": "Docker publishes ports through a proxy, so `lsof` may show `docker-proxy` or `com.docker.backend` rather than your application. Killing that proxy is pointless: the daemon recreates it, or the restart policy brings the container straight back. Stop the container instead."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container publishes 3000?\ndocker ps --format '{{.ID}}  {{.Names}}  {{.Ports}}' | grep 3000\n\n# Stop it, or stop the whole stack\ndocker stop <name>\ndocker compose down\n\n# systemd, same idea\nsudo systemctl stop myservice\nsudo ss -ltnp 'sport = :3000'"
    },
    {
      "t": "p",
      "x": "The same logic applies to anything with a restart policy. If a port frees up and is immediately taken again, you are fighting a supervisor, and you will lose. Related reading: [why a container exits immediately](/guides/docker-container-exits-immediately/) covers the opposite failure, where the process will not stay up at all."
    },
    {
      "t": "h3",
      "x": "4. TIME_WAIT, which is mostly a myth here"
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` is the state the side that closes a TCP connection sits in for a couple of minutes, so late duplicate packets cannot be mistaken for part of a new connection. It applies to connection sockets, not to the listening socket. And even where a leftover socket would conflict, `SO_REUSEADDR` tells the kernel to permit the bind anyway. Node sets `SO_REUSEADDR` on listening sockets by default, as do Go's `net.Listen`, Java's `ServerSocket` in most configurations, and Kestrel. Python's `socket` module does not set it for you, which is why so much Python example code includes `sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)` by hand."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "SO_REUSEADDR is not SO_REUSEPORT",
      "x": "`SO_REUSEADDR` lets you re-bind a port whose old connections are still winding down. `SO_REUSEPORT` lets several live processes bind the same port at once, with the kernel load-balancing between them. Confusing the two produces a nasty bug where two copies of your server are both running, each serving roughly half the requests, and your code changes appear to apply intermittently."
    },
    {
      "t": "h2",
      "x": "Error strings by runtime"
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see",
        "Notes"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`err.code === 'EADDRINUSE'`; `errno` is `-98` on Linux and `-48` on macOS"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 48 on macOS. Frameworks often wrap it, so read the bottom of the traceback."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "Wrapped in a `*net.OpError`; `errors.Is(err, syscall.EADDRINUSE)` matches"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Spring Boot prints its own failure analysis above the stack trace"
        ],
        [
          ".NET / Kestrel",
          "`Failed to bind to address http://127.0.0.1:5000: address already in use.`",
          "Thrown as an `IOException` during host startup"
        ]
      ],
      "caption": "The same kernel error, dressed differently. Match on the error code rather than the text."
    },
    {
      "t": "h2",
      "x": "Kill it without breaking something else"
    },
    {
      "t": "p",
      "x": "Signal order matters. `SIGTERM` gives the process a chance to run its shutdown handler: finish in-flight requests, flush logs, release a database advisory lock, remove a PID file. `SIGKILL` gives it nothing. Reach for `kill -9` only after `SIGTERM` has visibly failed, and treat needing it as a bug in the application's shutdown path rather than a normal step."
    },
    {
      "t": "ol",
      "items": [
        "Identify the PID and confirm the process name and arguments are what you expect.",
        "`kill <pid>`, then wait two or three seconds.",
        "Re-run the `lsof` or `ss` check. If the socket is gone, you are done.",
        "If it survived, `kill -9 <pid>`, then watch for whether something brings it back.",
        "If it returns within a second, stop the supervisor, container or launch agent instead of the process."
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Be careful with pkill -f",
      "x": "`pkill -f node` is a popular suggestion and a bad habit. It matches the full command line of every process, so it will happily take out your editor's language server, an unrelated project's dev server, and anything else that happens to run on Node. If you must pattern match, narrow it hard and preview first: `pgrep -af 'node.*my-app'` before `pkill -f 'node.*my-app'`."
    },
    {
      "t": "h2",
      "x": "When the port is not taken by a program at all"
    },
    {
      "t": "p",
      "x": "Two situations produce this error, or a close relative, with no process to find."
    },
    {
      "t": "p",
      "x": "**Windows excluded port ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ephemeral ports. A bind inside a reserved range fails even though nothing is listening, and the reservations move after a reboot, which makes the failure look random. List them with `netsh interface ipv4 show excludedportrange protocol=tcp`. You can also reserve a port you care about so nothing else claims it, though that needs an administrator shell and a restart of the `winnat` service."
    },
    {
      "t": "p",
      "x": "**macOS system services on common dev ports.** On recent macOS versions the AirPlay Receiver feature listens on ports 5000 and 7000, which collides with the Flask and Rails defaults that generations of tutorials use. If `lsof` shows `ControlCenter` or `AirPlayXPCHelper`, you have found it. Turn off AirPlay Receiver in System Settings, under General and then AirDrop & Handoff, or just use a different port. Confirm the setting's location on your own machine, since Apple moves System Settings panes between releases; this describes macOS as of November 2026."
    },
    {
      "t": "p",
      "x": "A third lookalike is not `EADDRINUSE` at all. Binding to a port below 1024 as a non-root user gives `EACCES`, and binding to an address the machine does not own gives `EADDRNOTAVAIL`. Both get filed as \"port in use\" in bug reports. Read the code in the error, not the summary someone wrote around it."
    },
    {
      "t": "h2",
      "x": "Stop leaking the port in the first place"
    },
    {
      "t": "p",
      "x": "Handle the signals. A dev server that closes its listener on `SIGINT` and `SIGTERM` almost never leaves an orphan, and the same handler is what lets a container stop in under a second instead of waiting out Docker's grace period."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\n// Fail with something actionable instead of a stack trace\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`port ${port} is in use; run: lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nconst shutdown = (signal) => () => {\n  console.log(`${signal} received, closing listener`);\n  server.close(() => process.exit(0));\n\n  // Idle keep-alive sockets will otherwise hold close() open.\n  // Available from Node 18.2, so guard it for older runtimes.\n  server.closeIdleConnections?.();\n\n  // Last resort, so one stuck connection cannot wedge the exit.\n  setTimeout(() => process.exit(1), 10_000).unref();\n};\n\nprocess.on('SIGINT', shutdown('SIGINT'));\nprocess.on('SIGTERM', shutdown('SIGTERM'));"
    },
    {
      "t": "p",
      "x": "That `closeIdleConnections` call is the piece most people miss. `server.close()` stops accepting new connections but waits for existing ones to finish, and an HTTP keep-alive connection from an open browser tab can sit there for a long time. The server looks hung during shutdown. So you press Ctrl+C again, the parent dies, the worker is orphaned, and that is exactly how you arrive back at this article."
    },
    {
      "t": "p",
      "x": "For tests, do not pick a port at all:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// The kernel assigns a free ephemeral port\nconst server = app.listen(0, () => {\n  const { port } = server.address();\n  baseUrl = `http://127.0.0.1:${port}`;\n});"
    },
    {
      "t": "p",
      "x": "Parallel test runners, CI agents sharing a host, and two checkouts of the same repo open at once all break fixed test ports. Port `0` makes that disappear. For long-running local services, giving each project a distinct port in a committed `.env.example` is cheap and removes the ambiguity about which app owns which number."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A shell function beats remembering the flags",
      "x": "Add `port() { lsof -nP -iTCP:\"$1\" -sTCP:LISTEN; }` to your shell profile. Then `port 3000` prints the owner, and you still see the process name before deciding to kill anything, which is the step that prevents mistakes."
    },
    {
      "t": "h2",
      "x": "A short diagnostic order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Read the error for the address, not just the port",
          "x": "A wildcard bind collides with every specific bind on that port. `127.0.0.1` and `0.0.0.0` are not interchangeable here.",
          "code": "node -e \"require('net').createServer().listen(3000, '127.0.0.1')\""
        },
        {
          "title": "Name the owner",
          "x": "Filter to listening sockets so you do not match ordinary client connections.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || ss -ltnp 'sport = :3000'"
        },
        {
          "title": "Check whether it is supervised",
          "x": "A PPID of 1, a `docker-proxy` name or a systemd unit all mean you should stop the manager rather than the process.",
          "code": "ps -o pid,ppid,pgid,stat,etime,command -p <pid>"
        },
        {
          "title": "Terminate, then verify",
          "x": "`SIGTERM`, confirm, escalate only if needed. Always re-check that the socket is gone before restarting.",
          "code": "kill <pid> && sleep 1 && lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Fix the cause once",
          "x": "Add signal handlers and an `EADDRINUSE` branch on the server's error event, so the next occurrence explains itself."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of the restart loop, where the process will not stay alive.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Connection refused is the mirror image: nothing is listening where you expect.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnose and fix CORS errors",
          "desc": "Once the server binds, the browser has opinions of its own.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill a process on port 3000?",
          "a": "On macOS or Linux, `kill $(lsof -t -iTCP:3000 -sTCP:LISTEN)`. On Windows, find the PID with `netstat -ano | findstr :3000` and run `taskkill /PID <pid> /F`. Run the query on its own first so you can see the process name. The one-liner kills whatever matches, and the match is occasionally not what you assume."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Usually because a child process survived. Ctrl+C signals the foreground process group, and a worker that detached, or that a supervisor re-spawned at the wrong moment, is no longer in that group. Run `lsof` and look at the PPID: if it is 1, the parent is gone and you are looking at an orphan. The second common cause is a shutdown handler waiting on an open keep-alive connection, which looks like a hang rather than an exit."
        },
        {
          "q": "Is TIME_WAIT the reason I get EADDRINUSE?",
          "a": "Almost never for a listening socket. `TIME_WAIT` applies to connections that have already closed, and `SO_REUSEADDR` (set by default in Node, Go and most server frameworks) lets you re-bind regardless. If the port is held, something is alive and holding it. Plain Python `socket` code is the main exception, because it does not set `SO_REUSEADDR` unless you ask it to."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, in two cases. They can bind different local addresses, so `127.0.0.1:8080` and `192.168.1.5:8080` coexist. Or they can both set `SO_REUSEPORT`, in which case the kernel distributes incoming connections between them. The second case causes real confusion locally: two copies of your server appear to serve alternating requests, so your edits seem to apply only some of the time."
        },
        {
          "q": "Nothing shows up in lsof but the bind still fails. What now?",
          "a": "On Windows, check reserved ranges with `netsh interface ipv4 show excludedportrange protocol=tcp`; Hyper-V, WSL2 and Docker Desktop reserve blocks that shift after a reboot. On macOS, ports 5000 and 7000 may belong to AirPlay Receiver, which appears as `ControlCenter`. Also try `lsof` with `sudo`, since you cannot see sockets owned by other users without it, and confirm the error really is `EADDRINUSE` rather than `EACCES` (a privileged port under 1024) or `EADDRNOTAVAIL` (an address this host does not have)."
        },
        {
          "q": "Is kill -9 safe to use on a dev server?",
          "a": "It will release the port, because the kernel closes sockets when a process dies by any means. What it skips is your cleanup: unflushed logs, a database transaction left open until it times out, a stale PID or lock file, temp files never removed. Send `SIGTERM` first. If `SIGTERM` reliably fails to stop your server, that is worth fixing, because the same defect will make container restarts and deploys slow."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-10",
  "updated": "2026-11-10",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
