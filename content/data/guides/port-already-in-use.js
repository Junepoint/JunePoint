module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That's Already in Use",
  "h1": "Port already in use: find the owner, then free it",
  "eyebrow": "Troubleshooting",
  "description": "Identify which process holds a busy TCP port on Linux, macOS and Windows, kill it safely, and fix the orphaned children that cause it after a crash.",
  "standfirst": "EADDRINUSE almost always means a real process is still listening. Find its PID, stop it politely, then fix the shutdown path that let it survive.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port",
    "lsof port 3000",
    "find process using port"
  ],
  "cardDesc": "Find the PID holding a busy port, stop it without collateral damage, and stop orphaned dev servers from coming back.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "**Find the owner first.** `ss -tlnp 'sport = :3000'` on Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `netstat -ano | findstr :3000` on Windows.",
        "**Send SIGTERM before SIGKILL.** `kill <pid>` lets the process close its socket and stop its children. `kill -9` skips all of that.",
        "**After a crash, suspect an orphan.** The wrapper you were watching died. The child that actually owns the socket did not.",
        "**TIME_WAIT is rarely the answer in Node.** libuv sets `SO_REUSEADDR` on the listening socket, so \"just wait a minute\" usually hides a live process.",
        "**No owner at all?** Look at macOS AirPlay on port 5000, a Windows excluded port range, or a Docker publish rule."
      ]
    },
    {
      "t": "p",
      "x": "The operating system allows exactly one socket to listen on a given address and port. A second bind to the same pair is refused, and every runtime wraps that refusal in its own wording on top of the same kernel error."
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000"
    },
    {
      "t": "p",
      "x": "Two details in that line matter. `:::3000` is the IPv6 wildcard address, so the server tried to listen on every interface; an IPv4-only bind reads `0.0.0.0:3000`, and a loopback-only bind reads `127.0.0.1:3000`. A process holding the wildcard address also blocks a later bind to one specific address on that port, which is why \"but I am only binding localhost\" does not save you."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Message you will see",
        "Underlying error"
      ],
      "rows": [
        [
          "Node.js",
          "`listen EADDRINUSE: address already in use :::3000`",
          "`EADDRINUSE`"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "98 on Linux, 48 on macOS"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "`EADDRINUSE`"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "`EADDRINUSE`"
        ],
        [
          "nginx",
          "`bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "98 on Linux"
        ]
      ],
      "caption": "One kernel refusal, reported five different ways."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EACCES is a different problem",
      "x": "If the port is below 1024 and you are not root, the error is `EACCES`, not `EADDRINUSE`. Nothing is holding the port. You are simply not allowed to bind it. Use a high port in development and put a reverse proxy in front in production."
    },
    {
      "t": "h2",
      "x": "Step 1: find the process that owns the port"
    },
    {
      "t": "p",
      "x": "Ask for listeners only. Many of the commands people copy from search results match every socket on that port number, including outbound connections from your own browser, and that is how the wrong process gets killed."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: -t TCP, -l listening, -n numeric, -p show the process\nss -tlnp 'sport = :3000'\n\n# Empty Process column? The socket belongs to another user.\nsudo ss -tlnp 'sport = :3000'\n\n# macOS, and Linux if lsof is installed\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Just the PID, for scripting\nlsof -t -nP -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "The flags earn their place. `-n` skips reverse DNS and `-P` skips port-name lookup, so the command returns immediately instead of stalling on a slow resolver. `-sTCP:LISTEN` is the important one: without it, `lsof -i:3000` also lists established connections to a remote port 3000 somewhere else entirely."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id 12345 | Select-Object Id, ProcessName, Path\n\n# Windows cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\""
    },
    {
      "t": "p",
      "x": "Read the process name before you do anything else. `node`, `python`, `java` and `ruby` are nearly always yours to stop. `docker-proxy`, `com.docker.backend`, `postgres`, `mysqld` and anything owned by `root` deserve a second look, because stopping them has consequences past your dev server."
    },
    {
      "t": "h2",
      "x": "Step 2: stop it without collateral damage"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask politely. SIGTERM lets the process run its shutdown handler.\nkill 12345\n\n# Confirm the port is free\nss -tlnp 'sport = :3000'\n\n# Still there after a few seconds? Now escalate.\nkill -9 12345"
    },
    {
      "t": "p",
      "x": "SIGTERM is catchable, so a well-behaved server closes its listening socket, drains in-flight requests and stops the children it spawned. SIGKILL cannot be caught. The kernel releases the port either way, but anything the process was about to flush is lost, and any child it started is reparented to init instead of being shut down. That is how one `kill -9` produces the next EADDRINUSE."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Two popular one-liners worth avoiding",
      "x": "`kill $(lsof -t -i:3000)` matches every socket on port 3000, not only listeners, so it can take out an unrelated client connection. `killall -9 node` and `pkill -f node` kill every Node process you own: the editor language server, the other project in the next tab, and any build running on a shared machine. Target the PID you actually identified."
    },
    {
      "t": "p",
      "x": "Convenience wrappers are fine once you know what they do. `npx kill-port 3000` and `fuser -k 3000/tcp` both work. Note that `fuser -k` sends SIGKILL by default, so use `fuser -k -TERM 3000/tcp` if you want the polite version first. For a database, skip all of this and use the service's own stop command, because a SIGKILL to a running PostgreSQL or MySQL server forces crash recovery on the next start."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people. Your terminal printed a stack trace and came back to a prompt, so the app looks dead. It is not. Something still holds that file descriptor, and there are only a handful of plausible candidates."
    },
    {
      "t": "ol",
      "items": [
        "**An orphaned child process.** `nodemon`, `concurrently`, `npm run dev` and `tsx watch` all spawn the real server as a child. Kill the wrapper hard, or close the terminal window, and the child survives with the socket open. It gets reparented to PID 1 and listens indefinitely.",
        "**A crash that did not kill the process.** An unhandled rejection or a thrown error inside one request handler can leave the process alive with its server object intact. The logs look fatal. The event loop disagrees.",
        "**A supervisor that already restarted it.** `pm2`, a systemd unit with `Restart=always`, or a Docker `restart: unless-stopped` policy brings the service back within seconds. You are not fighting a dead process, you are racing a restart loop.",
        "**A debugger holding the old run.** A paused process still owns everything it opened, including the listening socket.",
        "**A shutdown handler that never finishes.** The process caught SIGTERM, called `server.close()`, then waited forever on a keep-alive connection that will not end by itself."
      ]
    },
    {
      "t": "p",
      "x": "One thing it is almost never: a zombie. A zombie has already exited and the kernel has already closed its descriptors, so it occupies a row in the process table and nothing more. If `ps` shows `<defunct>`, that is not what is holding your port."
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT myth"
    },
    {
      "t": "p",
      "x": "The most repeated answer to EADDRINUSE is that sockets linger in TIME_WAIT for a minute or two, so you should wait it out. That is mostly wrong, and believing it costs real debugging time. A listening socket never enters TIME_WAIT; its accepted connections do. On Linux and macOS, libuv sets `SO_REUSEADDR` on the listening socket before binding, and that is exactly the option that lets a new listener bind despite those lingering connections. So if a Node server cannot rebind, a process is still listening. Waiting does not help. When it appears to help, something else usually exited in the meantime."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Live listener, or just closed connections?\nss -tan 'sport = :3000'\n\n# State LISTEN     -> a process owns the port right now\n# State TIME_WAIT  -> closed connections, not your blocker in Node"
    },
    {
      "t": "h2",
      "x": "When the port is busy but nothing owns it"
    },
    {
      "t": "p",
      "x": "Sometimes `ss` and `lsof` come back empty and the bind still fails. Four causes cover almost all of those."
    },
    {
      "t": "ul",
      "items": [
        "**macOS ports 5000 and 7000.** AirPlay Receiver binds them. It has shipped enabled by default since macOS Monterey, and the toggle has moved between releases, so search System Settings for AirPlay Receiver rather than trusting a fixed menu path from an old answer. Verify the current location on your own machine. Moving your app to another port is usually the cheaper fix.",
        "**Windows excluded port ranges.** Hyper-V and WSL2 reserve blocks of TCP ports at boot. A port inside a reserved block fails to bind with no visible owner. Run `netsh interface ipv4 show excludedportrange protocol=tcp` from an elevated prompt and check whether your port falls in a listed range.",
        "**Docker.** A published port is held by `docker-proxy` on Linux, or by the Docker backend process on macOS and Windows. Run `docker ps -a` and read the PORTS column: a mapping you forgot about explains the conflict faster than any socket tool.",
        "**Another user, or another namespace.** Without `sudo`, both `ss` and `lsof` hide process details for sockets you do not own. A container, a VM or a separate network namespace can hold a port that your unprivileged tools cannot attribute to anything."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "WSL2 and the localhost that is not yours",
      "x": "Ports are forwarded between Windows and WSL2, so a server running under Linux and a server running under Windows really do compete for the same `localhost:3000`. Check both sides before deciding the port is haunted."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Killing a PID fixes today. The durable fix is a shutdown path that reliably releases the socket, plus an error message that tells the next person what to run."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Close the server and its idle connections on a signal",
          "x": "A plain `server.close()` stops accepting new connections but waits for existing keep-alive sockets to go idle, which an open browser tab can stretch out considerably. `closeAllConnections()` and `closeIdleConnections()` arrived in Node 18.2, and one of them is usually what you want.",
          "code": "const server = app.listen(port);\n\nconst shutdown = () => {\n  server.close(() => process.exit(0));\n  server.closeAllConnections();          // Node >= 18.2\n  setTimeout(() => process.exit(1), 5000).unref();\n};\n\nprocess.on('SIGINT', shutdown);\nprocess.on('SIGTERM', shutdown);"
        },
        {
          "title": "Turn the crash into a useful message",
          "x": "An unhandled `EADDRINUSE` prints a stack trace that points into `node:net` and tells the reader nothing. Catch it and print the command that answers the question.",
          "code": "server.on('error', (err) => {\n  if (err.code !== 'EADDRINUSE') throw err;\n  console.error('Port ' + port + ' is already in use. Find the owner with:');\n  console.error('  lsof -nP -iTCP:' + port + ' -sTCP:LISTEN');\n  process.exit(1);\n});"
        },
        {
          "title": "Let tests pick their own port",
          "x": "Hard-coded ports in a test suite collide with your dev server and with each other under a parallel runner. Bind to port 0 and read back whatever the kernel assigned.",
          "code": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = 'http://127.0.0.1:' + port;"
        },
        {
          "title": "Signal the process group, not just the wrapper",
          "x": "If your dev script spawns children, make sure your stop path reaches them. A negative PID signals the whole process group.",
          "code": "# Find the group leader for a known PID\nps -o pid,pgid,comm -p 12345\n\n# Signal every process in that group\nkill -TERM -12345"
        }
      ]
    },
    {
      "t": "p",
      "x": "One habit beats all of the above: stop dev servers with Ctrl+C instead of closing the terminal window. Ctrl+C sends SIGINT to the entire foreground process group, so children receive it too. Closing the window sends SIGHUP to the session leader, and a child that ignores or outlives SIGHUP keeps your port until you hunt it down."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find what is using port 3000?",
          "a": "On Linux, run ss -tlnp 'sport = :3000', adding sudo if the process column comes back empty. On macOS, run lsof -nP -iTCP:3000 -sTCP:LISTEN. On Windows, run netstat -ano | findstr :3000 and look the PID up with tasklist. All three give you a PID and a process name, which is what you need before killing anything."
        },
        {
          "q": "How do I kill the process on a port in one command?",
          "a": "kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN) on macOS or Linux. Keep the -sTCP:LISTEN filter. The shorter version you will see quoted everywhere, lsof -t -i:3000, also matches outbound connections to a remote port 3000 and can kill something you did not mean to touch."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is running?",
          "a": "Usually something is running and your tools cannot show it, because the socket belongs to another user and you need sudo. If the port genuinely has no owner, check AirPlay Receiver on macOS ports 5000 and 7000, a Hyper-V excluded port range on Windows, a Docker port mapping, or a server on the other side of a WSL2 boundary."
        },
        {
          "q": "Is kill -9 safe for a stuck dev server?",
          "a": "For a Node or Python dev server, in practice yes. As a habit, no. SIGKILL cannot be caught, so the process cannot close connections, flush writes or shut down the children it spawned, and orphaned children are the most common cause of the next EADDRINUSE. Do not use it on a database server; use the service stop command instead."
        },
        {
          "q": "Why does nodemon say address already in use after a crash?",
          "a": "nodemon runs your app as a child process. If a previous child never exited, it still holds the socket while nodemon cheerfully starts another one. Kill the listener by PID, then add SIGINT and SIGTERM handlers that call server.close() so the next restart is clean."
        },
        {
          "q": "Should I just wait for the port to free itself?",
          "a": "Not for a Node server. libuv sets SO_REUSEADDR on the listening socket, so connections sitting in TIME_WAIT do not block a rebind on Linux or macOS. If the bind still fails, a live process owns the port, and waiting changes nothing."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1, and why a container stops the moment its main process does.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Check process, listener, firewall and pg_hba.conf in that order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How Node resolution really works, and where ESM and CommonJS part ways.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-17",
  "updated": "2026-09-17",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
