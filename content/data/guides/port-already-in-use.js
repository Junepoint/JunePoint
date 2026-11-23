module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: How to Find and Free a Busy Port",
  "h1": "Port already in use: find the process, then free it",
  "eyebrow": "Troubleshooting",
  "description": "Port already in use? Find the process holding it, stop it safely, and understand why a crashed server can leave the port bound behind it.",
  "standfirst": "One command tells you which process owns the port. The harder question is why the port is still held after the server crashed, and that answer is almost never TIME_WAIT.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the process holding a port, stop it cleanly, and fix the crash patterns that leave listeners behind.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Find the owner before you do anything else: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `ss -ltnp` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` first with a plain `kill <pid>`. Save `kill -9` for a process that ignores it.",
        "After a crash, the usual culprit is a surviving child process, a suspended job, or a supervisor that already restarted the server for you.",
        "TIME_WAIT gets blamed far more often than it deserves. Node, Go and most server frameworks set `SO_REUSEADDR` for you, so a live listener is the likelier cause.",
        "If nothing appears to be listening and binding still fails, suspect reserved port ranges on Windows, a privileged port under 1024, or a stale Unix socket file."
      ]
    },
    {
      "t": "h2",
      "x": "What the error actually means"
    },
    {
      "t": "p",
      "x": "A listening socket is claimed by one triple: protocol, address and port. When a second process asks the kernel for a triple that is already taken, the `bind` or `listen` call fails and the runtime surfaces `EADDRINUSE`. That is the entire mechanism. The error has nothing to do with your framework, your firewall or your Dockerfile, which is why changing those things rarely helps."
    },
    {
      "t": "p",
      "x": "Node attaches useful fields to the error object. Read them before guessing:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// The properties on a Node EADDRINUSE error\n{\n  code: 'EADDRINUSE',\n  errno: -98,        // -48 on macOS and the BSDs\n  syscall: 'listen',\n  address: '::',     // the IPv6 wildcard\n  port: 3000\n}"
    },
    {
      "t": "p",
      "x": "`address: '::'` is the IPv6 wildcard, which is where the odd-looking `:::3000` in the message comes from. A wildcard listener overlaps every specific address on the machine, so `0.0.0.0:3000` collides with an existing `127.0.0.1:3000` listener. Two listeners on two different specific addresses, say `127.0.0.1:3000` and `192.168.1.10:3000`, do not collide. That detail matters when a tool binds loopback only and you then try to bind everything."
    },
    {
      "t": "p",
      "x": "The same kernel refusal gets phrased differently depending on what you are running. These are the strings you will see:"
    },
    {
      "t": "ul",
      "items": [
        "Node.js: `Error: listen EADDRINUSE: address already in use :::3000`",
        "Python: `OSError: [Errno 98] Address already in use`",
        "Go: `listen tcp :8080: bind: address already in use`",
        "Java: `java.net.BindException: Address already in use`",
        "Puma or Rails: `Address already in use - bind(2) for \"127.0.0.1\" port 3000 (Errno::EADDRINUSE)`",
        "nginx: `nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
        "Docker: `Bind for 0.0.0.0:3000 failed: port is already allocated`"
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Docker is a special case",
      "x": "The Docker message comes from the daemon, not from your application. The port is held by the daemon's proxy on behalf of a running container, so `docker ps` is a better first stop than `lsof` when you see `port is already allocated`."
    },
    {
      "t": "h2",
      "x": "Find the process in one command"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS or Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof needed, prints PID and program name\nss -ltnp 'sport = :3000'\n\n# Older Linux boxes without ss\nnetstat -ltnp | grep ':3000'\n\n# Just the PIDs, for scripting\nlsof -t -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "The flags earn their keep. `-n` skips DNS lookups, `-P` stops port numbers being rendered as service names, and `-sTCP:LISTEN` filters out established connections. Without that last filter, `lsof -i:3000` also matches every client talking *to* port 3000, including your browser. People who skip it end up killing the wrong thing."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows: the PID in the last column\nnetstat -ano | findstr :3000\n\n# PowerShell, with the process name resolved\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess,\n    @{n='Process'; e={(Get-Process -Id $_.OwningProcess).ProcessName}}\n\n# Look up a PID you got from netstat\ntasklist /fi \"pid eq 12345\""
    },
    {
      "t": "table",
      "head": [
        "Goal",
        "macOS",
        "Linux",
        "Windows"
      ],
      "rows": [
        [
          "Name the listener",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`ss -ltnp 'sport = :3000'`",
          "`Get-NetTCPConnection -LocalPort 3000`"
        ],
        [
          "PID only",
          "`lsof -t -iTCP:3000 -sTCP:LISTEN`",
          "`ss -ltnpH 'sport = :3000'`",
          "`netstat -ano | findstr :3000`"
        ],
        [
          "Ask it to stop",
          "`kill <pid>`",
          "`kill <pid>`",
          "`taskkill /PID <pid>`"
        ],
        [
          "Force it",
          "`kill -9 <pid>`",
          "`kill -9 <pid>`",
          "`taskkill /F /PID <pid>`"
        ],
        [
          "See every listener",
          "`lsof -nP -iTCP -sTCP:LISTEN`",
          "`ss -ltnp`",
          "`netstat -ano -p tcp`"
        ]
      ],
      "caption": "Equivalent commands per platform. On macOS and Linux, prefix lsof with sudo to see processes owned by other users."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Empty output does not mean empty port",
      "x": "`lsof` shows only processes you own unless you run it as root. If the port is held by a system daemon or by another user's session, you get nothing back and conclude the port is free. Try `sudo lsof -nP -iTCP:3000 -sTCP:LISTEN` before believing the silence."
    },
    {
      "t": "h2",
      "x": "Stop it without breaking something else"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm what you are about to kill",
          "x": "Read the command name first. `node`, `python3`, `java` or `docker-proxy` is probably yours. `systemd`, `launchd`, `rpcbind`, or a database that other people are using is not. The `etime` column tells you whether this is the dev server you started a minute ago or something that has been up for days.",
          "code": "ps -o pid,ppid,user,etime,command -p 12345"
        },
        {
          "title": "Ask it to stop",
          "x": "A bare `kill` sends `SIGTERM`, which the process can catch. That is what lets it flush logs, close database pools, remove PID files and shut down child processes in order.",
          "code": "kill 12345"
        },
        {
          "title": "Check that the port is free",
          "x": "Give it a second or two. A server with open keep-alive connections may take longer to finish, and a tidy shutdown is worth the wait.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught or handled, so nothing gets cleaned up: temp files stay, lock files stay, and child processes are orphaned. For a dev server that is usually harmless. For a database or a queue worker mid-transaction it can mean recovery work on the next start.",
          "code": "kill -9 12345"
        },
        {
          "title": "The Windows equivalent",
          "x": "`taskkill` without `/F` asks politely; with `/F` it terminates. Add `/T` to take the process tree with it, which is often what you want for a dev server that spawned workers.",
          "code": "taskkill /PID 12345\ntaskkill /F /T /PID 12345"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Be careful with the copy-paste one-liners",
      "x": "`kill -9 $(lsof -t -i:3000)` circulates widely and has two problems. `-i:3000` matches remote port 3000 as well as local, so the PID list can include clients rather than the listener, and `-9` skips every shutdown handler on all of them. If you want a one-liner, make it `kill $(lsof -t -iTCP:3000 -sTCP:LISTEN)` and only add `-9` on the second attempt. Helpers such as `npx kill-port 3000` are convenient but carry the same risk of killing more than you meant, plus the usual caution about running third-party packages."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port held"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people. The process you were watching is gone from your terminal, you are certain it crashed, and yet something still owns port 3000. There are five common explanations, and they are all mundane."
    },
    {
      "t": "h3",
      "x": "The parent died and the children did not"
    },
    {
      "t": "p",
      "x": "A child process inherits its parent's file descriptors, including the listening socket. Kill `nodemon`, `concurrently`, `npm run dev` or a shell wrapper and the actual server underneath can survive, get reparented to init, and keep the port. Cluster workers behave the same way. Look at the tree rather than at a single PID:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux\npstree -ap | grep -A3 node\nps -ef --forest | grep node\n\n# macOS\nps -A -o pid,ppid,command | grep node\n\n# A process whose parent is 1 was orphaned, not started that way\nps -o pid,ppid,command -p 12345"
    },
    {
      "t": "h3",
      "x": "The job is suspended, not dead"
    },
    {
      "t": "p",
      "x": "Ctrl+Z suspends. It does not stop. A suspended process keeps every descriptor it held, the listening socket included, so the port stays claimed by something that will never answer a request. This is extremely easy to do by accident when you meant Ctrl+C. Check your shell's job table before you go hunting for ghosts:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "jobs -l          # stopped jobs show as 'Stopped'\nfg %1            # bring it back and Ctrl+C it properly\nkill %1          # or terminate the job directly"
    },
    {
      "t": "p",
      "x": "A process paused at a debugger breakpoint, or one sitting in an IDE's run panel from an earlier session, produces exactly the same symptom."
    },
    {
      "t": "h3",
      "x": "Something restarted it for you"
    },
    {
      "t": "p",
      "x": "Supervisors exist to do this. `systemd` with `Restart=always`, `pm2`, `nodemon`, a Docker restart policy, a Kubernetes deployment: all of them bring a replacement up within seconds of the crash. You then run the server by hand, hit `EADDRINUSE`, and blame the crash. Ask the supervisor first with `systemctl status <unit>`, `pm2 list` or `docker ps` before touching PIDs, because killing the child of a supervisor just gets you a fresh one."
    },
    {
      "t": "h3",
      "x": "A container still owns the publish"
    },
    {
      "t": "p",
      "x": "A published port belongs to the Docker daemon while the container runs, and on Linux you will often see `docker-proxy` as the listener. `docker ps` finds the container, `docker stop` or `docker compose down` releases the mapping. Occasionally the daemon holds a stale binding after an unclean shutdown and no container matches it, in which case restarting the Docker daemon clears it. Our guide on [containers that exit immediately](/guides/docker-container-exits-immediately/) covers the related case where the container keeps dying and restarting underneath you."
    },
    {
      "t": "h3",
      "x": "Nothing is listening and it still fails"
    },
    {
      "t": "p",
      "x": "When every tool reports the port as free, the conflict is somewhere other than a user process:"
    },
    {
      "t": "ul",
      "items": [
        "**Reserved ranges on Windows.** Hyper-V and WSL2 reserve blocks of dynamic ports at boot, and the blocks move between reboots. Run `netsh int ipv4 show excludedportrange protocol=tcp` in an elevated prompt. This usually surfaces as a permission error rather than an in-use error, so check both when a Windows port behaves oddly.",
        "**Privileged ports.** Binding below 1024 without privileges or the right capability gives you `EACCES`, not `EADDRINUSE`. Different error, different fix.",
        "**A stale Unix socket file.** Binding a path-based socket that already exists on disk fails with `EADDRINUSE` even though no process is alive. Delete the file, or have your server unlink it before binding.",
        "**macOS Control Center.** On recent macOS releases, AirPlay Receiver listens on ports in the 5000 and 7000 range, which collides with Flask and other defaults. You can turn AirPlay Receiver off in System Settings, under General, AirDrop and Handoff. Verify the setting's location against your own macOS version, since Apple moves it between releases."
      ]
    },
    {
      "t": "h2",
      "x": "TIME_WAIT and the advice you can mostly ignore"
    },
    {
      "t": "p",
      "x": "The folklore says a crashed server leaves sockets in TIME_WAIT and that is why you cannot rebind. It was true once. It is mostly not true now, and acting on it wastes time."
    },
    {
      "t": "p",
      "x": "TIME_WAIT applies to a *connection*, identified by its four-tuple of local address, local port, remote address and remote port. The side that closes actively holds that tuple for roughly twice the maximum segment lifetime so that late duplicate packets cannot be mistaken for part of a new connection. Historically, a lingering connection on port 3000 blocked a new listener on port 3000. The fix, `SO_REUSEADDR`, is now set before `bind` by almost everything you are likely to run: Node sets it through libuv, Go's net package sets it, nginx sets it, and Python's `http.server` inherits `allow_reuse_address` from its base class."
    },
    {
      "t": "p",
      "x": "Where you still meet the old behaviour is hand-rolled socket code. A raw `socket.socket()` in Python sets nothing for you:"
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n# Without this line, a restart within the TIME_WAIT window\n# fails with: OSError: [Errno 98] Address already in use\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind((\"0.0.0.0\", 8000))\ns.listen()"
    },
    {
      "t": "p",
      "x": "There is a quick test that settles which world you are in. Ask the kernel what state the sockets are actually in:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# A live listener? Then a process owns the port.\nss -ltnp 'sport = :3000'\n\n# Only closing connections? Then your code needs SO_REUSEADDR.\nss -tan state time-wait '( sport = :3000 )'\nss -tan state close-wait '( sport = :3000 )'"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "SO_REUSEADDR is not SO_REUSEPORT",
      "x": "`SO_REUSEADDR` lets you bind past lingering connections. It does not let two processes listen on the same port. That is `SO_REUSEPORT`, available on Linux 3.9 and later, and it is a load-balancing feature with its own semantics. Reaching for it to work around a stuck port hides the real problem: you end up with two servers answering alternate connections and inconsistent behaviour you cannot reproduce."
    },
    {
      "t": "p",
      "x": "One more piece of bad advice worth naming. Lowering `net.ipv4.tcp_fin_timeout` is often recommended as a way to shorten TIME_WAIT on Linux. It does not do that. The TIME_WAIT duration is a kernel constant of 60 seconds and is not exposed as a tunable; `tcp_fin_timeout` governs the FIN_WAIT_2 state instead. Changing it will not free your port any sooner."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Most repeat offences come from servers that never learned to shut down. Handle the signals, close the listener, and put a ceiling on how long you will wait for stragglers:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n\n  server.close((err) => {\n    if (err) {\n      console.error(err);\n      process.exit(1);\n    }\n    process.exit(0);\n  });\n\n  // Keep-alive connections can hold the listener open indefinitely.\n  // Node 18.2.0 and later: server.closeAllConnections();\n  // Check your version with `node -v` before relying on it.\n  setTimeout(() => {\n    console.error('forcing exit');\n    process.exit(1);\n  }, 10000).unref();\n}\n\nprocess.on('SIGINT', () => shutdown('SIGINT'));\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));"
    },
    {
      "t": "p",
      "x": "In tests, stop hard-coding the port entirely. Binding to port 0 asks the kernel for a free ephemeral port, which removes the whole class of failure where two test suites, or a test suite and your dev server, fight over 3000:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  // Pass this to the test client instead of a constant.\n  console.log(`test server on ${port}`);\n});"
    },
    {
      "t": "p",
      "x": "A few habits that cut the frequency down further:"
    },
    {
      "t": "ul",
      "items": [
        "Give each project a distinct port and record it in the repo. Port 3000 is the default for too many tools to stay yours.",
        "Prefer a process manager or `docker compose` over backgrounded shell commands, so there is a single documented way to stop things.",
        "When you kill a dev server, kill the process group rather than the wrapper: `kill -- -<pgid>` on macOS and Linux, or `taskkill /T` on Windows.",
        "If your app writes a PID file, make shutdown remove it, and make startup check whether the PID in it is still alive.",
        "Treat `EADDRINUSE` on a production deploy as a signal that the previous instance is not shutting down on `SIGTERM`. That is a bug in the application, not something a longer restart delay should paper over."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "Identify it first with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, or `netstat -ano | findstr :3000` on Windows. Then `kill <pid>` (or `taskkill /PID <pid>`). Only escalate to `kill -9` if the process ignores `SIGTERM`, since a forced kill skips every cleanup handler the process has."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Usually because something is still alive. The most common causes are a child process that outlived the wrapper you interrupted, a job you suspended with Ctrl+Z rather than stopping, and a supervisor such as pm2, nodemon or systemd that restarted the server within a second of it dying. Check `jobs -l`, then the process tree, then your supervisor."
        },
        {
          "q": "Is `kill -9` safe to use on a dev server?",
          "a": "For a stateless dev server, generally yes. `SIGKILL` cannot be caught, so the process cannot flush logs, close connections, remove lock files or stop its children, and orphaned children may keep holding the port you were trying to free. For databases, message queues or anything mid-write, try `SIGTERM` and wait before forcing it."
        },
        {
          "q": "What does `:::3000` mean in the Node error message?",
          "a": "It is the IPv6 wildcard address `::` followed by `:3000`. Node bound to all interfaces rather than one specific address. Because a wildcard listener overlaps every specific address, it conflicts with an existing listener on `127.0.0.1:3000`, even though those look like different addresses."
        },
        {
          "q": "Does lowering tcp_fin_timeout release the port faster?",
          "a": "No. On Linux the TIME_WAIT duration is a 60 second kernel constant with no sysctl to shorten it, and `net.ipv4.tcp_fin_timeout` controls the FIN_WAIT_2 state instead. If you genuinely cannot rebind because of closing connections, the fix is `SO_REUSEADDR` in your server code, which most frameworks already set."
        },
        {
          "q": "Windows says the port is in use but netstat shows nothing. Why?",
          "a": "Hyper-V and WSL2 reserve ranges of dynamic ports at boot, and those ranges change between reboots. Run `netsh int ipv4 show excludedportrange protocol=tcp` from an elevated prompt to see them. The symptom is often a permission error rather than an in-use error, so check for both, and move your app to a port outside the reserved blocks."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the container holding your port keeps dying and restarting, start with PID 1 and the exit code.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this problem: nothing is listening where you expected. Check each layer in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How Node resolves modules, and why the same import works in one directory and fails in another.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-23",
  "updated": "2026-11-23",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
