module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on a Port",
  "h1": "Port already in use: find the process, then stop it properly",
  "eyebrow": "Troubleshooting",
  "description": "Find what is holding a TCP port on macOS, Linux and Windows, kill it safely, and understand why the port stays bound after a crash.",
  "standfirst": "One command tells you which process owns the port. The harder question is why it survived the crash that was supposed to kill it, and that answer is almost always an inherited file descriptor.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Identify the process holding a port, kill it without collateral damage, and stop the problem recurring after crashes.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `Get-NetTCPConnection -LocalPort 3000` on Windows. Read the command name before you kill the PID.",
        "After a crash, the port is usually held by a child process that inherited the listening socket. The parent is gone; the file descriptor is not.",
        "TIME_WAIT is rarely the cause for Node, Go or Java servers, because they set `SO_REUSEADDR` on the listening socket already.",
        "If `lsof` finds nothing, you are looking in the wrong network namespace, at the wrong address family, or without enough privilege.",
        "`kill -9` skips your shutdown handler. Try `kill` on its own first, and never reach for `killall node` on a shared machine."
      ]
    },
    {
      "t": "h2",
      "x": "Find the owner in one command"
    },
    {
      "t": "p",
      "x": "Do not guess. Ask the kernel which process holds a listening socket on the port, and look at the answer properly before you act on it."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux. -n and -P skip DNS and service-name lookups, which makes it fast.\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof installed. The -p flag needs root to show other users' processes.\nsudo ss -ltnp 'sport = :3000'\n\n# Older systems without ss\nsudo netstat -tlnp | grep ':3000'"
    },
    {
      "t": "p",
      "x": "The `COMMAND` column is the part that matters. If it says `node`, you probably know what happened. If it says `com.docke`, `rapportd`, `ControlCe` or the name of your editor, killing the PID is the wrong move and you should change your application's port instead."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Turn the PID into something you recognise\nGet-Process -Id 12345\n\n# Or the classic, which still works in cmd.exe\nnetstat -ano | findstr :3000"
    },
    {
      "t": "p",
      "x": "Once you are confident about the target, stop it. Send the polite signal first. A plain `kill` sends `SIGTERM`, which gives the process a chance to run its shutdown handler, flush logs and close database connections. `kill -9` sends `SIGKILL`, which cannot be caught or ignored, so nothing gets cleaned up. Use it when `SIGTERM` has visibly failed, not as an opening move."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "kill 12345          # SIGTERM: ask nicely\nkill -9 12345       # SIGKILL: only after SIGTERM did nothing\n\n# Same thing in one step, Linux and macOS\nkill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)\n\n# Windows\nStop-Process -Id 12345          # graceful-ish\nStop-Process -Id 12345 -Force   # the SIGKILL equivalent"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Two shortcuts that will eventually hurt you",
      "x": "`fuser -k 3000/tcp` and `npx kill-port 3000` both work, and both kill a PID you never looked at. On a laptop running one dev server that is fine. On a machine where the port is held by a shared service, a colleague's session, or a database you forgot was listening, you have just taken down something you did not intend to. `killall node` is worse: it kills every Node process you own, including your editor's language server and any unrelated build."
    },
    {
      "t": "h2",
      "x": "What the error actually means"
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` comes from the `bind()` system call, not from your framework. A TCP listening socket is identified by the pair of local address and port, so the conflict is on that pair rather than on the port number alone. This is why a server bound to `127.0.0.1:3000` and another bound to `192.168.1.10:3000` can coexist, while either of them collides with a server bound to `0.0.0.0:3000`, because the wildcard address covers every interface."
    },
    {
      "t": "p",
      "x": "That distinction explains a common confusion. You bound to `localhost`, something else bound to all interfaces, and the second one to start loses. Check the local address column in your `lsof` or `ss` output, not just the port."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Typical message"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`"
        ],
        [
          "Python (socket, Linux)",
          "`OSError: [Errno 98] Address already in use`"
        ],
        [
          "Python (socket, macOS)",
          "`OSError: [Errno 48] Address already in use`"
        ],
        [
          "Django dev server",
          "`Error: That port is already in use.`"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`"
        ],
        [
          "Java / Spring Boot",
          "`java.net.BindException: Address already in use`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`"
        ]
      ],
      "caption": "Wording drifts between versions, so match on the errno or the phrase 'address already in use' rather than on an exact string. Verify against your own output."
    },
    {
      "t": "p",
      "x": "One nearby error is worth recognising because the fix is completely different. `EACCES` on a low port means privilege, not conflict: on Linux and macOS, binding below 1024 requires root or an explicit capability. If you see `listen EACCES: permission denied 0.0.0.0:80`, nothing is holding port 80. You are simply not allowed to have it. Use a high port in development and put a reverse proxy in front of it in production."
    },
    {
      "t": "h2",
      "x": "Why the port survives a crash"
    },
    {
      "t": "p",
      "x": "Here is the mechanism behind most of these cases. When a process forks, the child inherits the parent's open file descriptors, including the listening socket. The kernel releases the port when the last descriptor referring to it closes. Kill the parent and leave a child running, and the port stays bound by a process whose name you were not looking for."
    },
    {
      "t": "p",
      "x": "That pattern is everywhere in modern tooling. `npm run dev` spawns a shell, the shell spawns your app, and a watcher such as nodemon or `tsx watch` sits between them restarting things. A crash or a mistimed Ctrl+C can leave any link in that chain alive. Concurrently, turbo, and IDE run configurations all add another layer."
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child.** The most common case. The supervisor died, the worker did not. `ps -ef | grep node` usually finds it in seconds.",
        "**A restart supervisor doing its job.** pm2, systemd or a Docker restart policy brought the service straight back up. Check `pm2 list`, `systemctl status yourservice` or `docker ps` before blaming a ghost.",
        "**A backgrounded job you forgot.** `npm start &` in a shell session that is still open. `jobs` in that terminal lists it.",
        "**A paused debugger.** A process stopped at a breakpoint still holds its sockets. Detaching the debugger without terminating the process leaves it bound.",
        "**A shutdown handler that never finished.** Your `SIGTERM` handler called `server.close()`, which waits for existing connections to drain. A keep-alive connection from a browser tab can hold that open for a long time.",
        "**Cluster workers.** With Node's `cluster` module or a multi-worker Python server, the primary hands the listening socket to workers. Killing the primary is not enough."
      ]
    },
    {
      "t": "p",
      "x": "When the culprit is hidden in a process tree, look at the tree rather than at a flat list. On Linux, `ps -ef --forest` shows the parent-child relationships. A child whose parent is PID 1 has been orphaned and reparented to init, which is a strong signal that its supervisor crashed and left it behind."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who owns the socket, and who is that process's parent?\nPID=$(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)\nps -o pid,ppid,user,etime,command -p \"$PID\"\n\n# Linux: see the whole tree at once\nps -ef --forest | grep -A3 -B3 \"$PID\"\n\n# macOS alternative\npstree -p \"$PID\"   # brew install pstree"
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT advice you will find online is usually wrong"
    },
    {
      "t": "p",
      "x": "Search for this error and you will be told to wait sixty seconds for the socket to leave `TIME_WAIT`. For most people hitting `EADDRINUSE` on a dev server, that advice is a dead end, and following it wastes the minute you could have spent finding the actual process."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to a closed connection, held briefly so that late packets from the old connection are not delivered to a new one with the same four-tuple. It can block a `bind()`, but only when the program does not set `SO_REUSEADDR` on the listening socket first. Node, Go and the JVM's server sockets set it by default on Unix-like systems, and so does anything built on them. If your Express app reports `EADDRINUSE`, something is genuinely listening."
    },
    {
      "t": "p",
      "x": "The exception is code that opens a raw socket by hand. A Python script that calls `socket()` and `bind()` without `setsockopt` will collide with a `TIME_WAIT` entry, and the standard library's `socketserver` exposes the switch for exactly this reason."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # the line people omit\ns.bind((\"0.0.0.0\", 8000))\ns.listen()\n\n# With socketserver, set the class attribute instead:\n#   class MyServer(socketserver.TCPServer):\n#       allow_reuse_address = True"
    },
    {
      "t": "p",
      "x": "You can confirm which situation you are in. `ss -tan | grep ':3000'` shows the socket states. A line in `LISTEN` means a live server. Lines in `TIME_WAIT` with no `LISTEN` line mean old connections, and on a server that sets `SO_REUSEADDR` those will not stop you rebinding."
    },
    {
      "t": "h2",
      "x": "When nothing shows up on the port"
    },
    {
      "t": "p",
      "x": "This is the frustrating variant: the bind fails, and `lsof` reports nothing. Work through these in order."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Run the lookup with privilege",
          "x": "`lsof` and `ss` only show process details for sockets you own unless you are root. A port held by another user, or by a system daemon, appears as an empty result rather than an error.",
          "code": "sudo lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Check both address families",
          "x": "A process bound to the IPv6 wildcard `::` with dual-stack enabled also occupies the IPv4 port. An IPv4-only query can miss it entirely, which is why the Node message often shows `:::3000` with no address in front.",
          "code": "lsof -nP -i:3000        # both families\nsudo ss -ltn '( sport = :3000 )'"
        },
        {
          "title": "Look inside the container namespace",
          "x": "A Docker container has its own network namespace. A port published to the host is proxied, so the host-side holder may be a Docker process rather than your app. Ask Docker directly.",
          "code": "docker ps --filter publish=3000"
        },
        {
          "title": "Remember WSL and virtual machines",
          "x": "On Windows with WSL2, a Linux process and a Windows process can both believe they own port 3000 because they are on different stacks, with localhost forwarding stitched between them. Check the Windows side with `Get-NetTCPConnection` even when the error came from inside WSL.",
          "code": "netstat -ano | findstr :3000"
        },
        {
          "title": "Check the reserved port ranges on Windows",
          "x": "Hyper-V and WSL reserve blocks of dynamic ports, and a bind inside a reserved range fails even though nothing is listening. Compare your port against the excluded ranges.",
          "code": "netsh interface ipv4 show excludedportrange protocol=tcp"
        }
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "macOS and port 5000",
      "x": "On recent macOS versions, the AirPlay Receiver feature in Control Center listens on port 5000, which is why Flask's default port stopped working for a lot of people. The holder shows in `lsof` as `ControlCe`. You can turn AirPlay Receiver off in System Settings under General then AirDrop & Handoff, but changing your app's port is the less disruptive fix. Check the current behaviour on your own machine, since Apple has moved this between releases."
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Killing the process is the fix for today. Handling shutdown properly is the fix for the rest of the year. Two changes cover most of it."
    },
    {
      "t": "p",
      "x": "First, close the server on termination signals, with a deadline. Without a deadline, `server.close()` waits for idle keep-alive connections and your process hangs exactly when you wanted it gone."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n\n  // Node 18.2+ exposes this; drop it if you target something older.\n  if (typeof server.closeAllConnections === 'function') {\n    server.closeAllConnections();\n  }\n\n  // Hard deadline so a stuck connection cannot hold the port.\n  setTimeout(() => {\n    console.error('forced exit after 5s');\n    process.exit(1);\n  }, 5000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "Second, stop hard-coding a fixed port where you do not need one. Tests are the obvious case. Passing port `0` asks the kernel for a free ephemeral port, and you read back the one you were given. Parallel test runs then stop fighting each other, and a leaked server from a previous run cannot block the next."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on http://127.0.0.1:${port}`);\n});\n\n// And if you do want a fixed port, fail with a message a human can act on:\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is taken. Run: lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Containers make this mostly go away",
      "x": "Run the dev stack with Compose and `docker compose down` releases every port at once, because the namespace goes with the container. The trade-off is real: slower file watching on macOS and Windows, and a longer feedback loop. Judge it against how often you are currently hunting stray PIDs."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of the port fight: a container that dies before it can serve anything.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite symptom. Nothing is listening where you expected something to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "When the server never gets as far as binding a port at all.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)`. On Windows: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess`. Run the lookup without the kill first and read the process name. If it is a system service or your editor, move your app to another port rather than killing it."
        },
        {
          "q": "What does EADDRINUSE actually mean?",
          "a": "The `bind()` system call failed because another socket already holds that combination of local address and port. It is an operating system error surfaced through your runtime, so the fix is at the process level, not in your framework config. Note that the conflict is on address plus port: `0.0.0.0:3000` collides with `127.0.0.1:3000`, but `127.0.0.1:3000` and `192.168.1.5:3000` can coexist."
        },
        {
          "q": "Why is the port still in use after I killed the process?",
          "a": "Almost always because a child process inherited the listening file descriptor and is still running. The kernel frees the port when the last descriptor closes, not when the parent dies. Find the real holder with `lsof` again, then check its parent with `ps -o pid,ppid,command -p <pid>`. A parent PID of 1 means it was orphaned. The other possibility is a supervisor such as pm2, systemd or a Docker restart policy putting it straight back."
        },
        {
          "q": "Should I just wait for TIME_WAIT to expire?",
          "a": "Usually no. Node, Go and JVM servers set `SO_REUSEADDR` on listening sockets by default, so sockets in `TIME_WAIT` do not block them from rebinding. If those runtimes report the port as in use, something is really listening. The advice only applies to hand-rolled socket code that skips `setsockopt(SO_REUSEADDR)`."
        },
        {
          "q": "Is killall node safe?",
          "a": "It is safe in the narrow sense that it only touches your own processes, and unsafe in every practical sense. It kills your editor's TypeScript server, any running build, background watchers and unrelated projects. On a shared or CI machine it can take out other people's work. Target the specific PID instead. It takes an extra ten seconds."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, in specific circumstances. On Linux, processes that each set `SO_REUSEPORT` before binding, run as the same user, and use the same address can share a port, with the kernel load-balancing incoming connections between them. Node's `cluster` module achieves something similar by sharing one descriptor across workers. Neither happens by accident, so if you did not opt in, treat a conflict as a conflict."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-29",
  "updated": "2026-09-29",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
