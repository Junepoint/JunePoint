module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is In Use",
  "h1": "Port already in use: find the process and get it back",
  "eyebrow": "Troubleshooting",
  "description": "Diagnose EADDRINUSE by finding the process that holds the port, killing it safely, and understanding why it outlived the crash that started this.",
  "standfirst": "One socket owns a listening port at a time. Find out which one, decide whether it deserves to die, and then fix the shutdown path so it stops happening.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Locate the process holding your port, kill it in the right order, and stop orphaned children from doing it again.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means something else is already bound to that address and port. It is not a firewall rule, a permissions problem or a bug in your framework.",
        "Find the owner before you kill anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the usual cause is an orphaned child process, not a socket stuck in `TIME_WAIT`. Node already sets `SO_REUSEADDR` on Unix-like systems.",
        "`kill -9` frees the port but skips every cleanup handler you wrote. Send `SIGTERM` first, escalate only if it is ignored.",
        "A shutdown handler that calls `server.close()`, plus tests that bind port `0`, remove most of these incidents for good."
      ]
    },
    {
      "t": "p",
      "x": "The kernel lets exactly one socket hold a given protocol, address and port combination in the listening state, unless every socket involved has explicitly opted into sharing it. When your process calls `bind(2)` on a tuple someone else owns, the syscall returns `EADDRINUSE` and your runtime turns that into whatever exception you are staring at."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you will see"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`"
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
          "`bind() to 0.0.0.0:80 failed (98: Address already in use)`"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`"
        ]
      ],
      "caption": "Errno 98 is Linux. macOS reports the same condition as errno 48. Check your own output rather than trusting the number in a Stack Overflow answer."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EADDRINUSE is not EACCES",
      "x": "If the message says `EACCES` or `Permission denied` on a port below 1024, nothing is holding the port. You simply are not allowed to bind a privileged port as an unprivileged user. That needs `CAP_NET_BIND_SERVICE`, a reverse proxy, or a higher port number, not a kill command."
    },
    {
      "t": "h2",
      "x": "Find out what is holding it"
    },
    {
      "t": "p",
      "x": "Identify the process before you reach for a kill. Half the time the answer is a second copy of your own dev server in a terminal tab you forgot about, and the fix is switching tabs rather than typing anything."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listening sockets on port 3000 only\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof installed\nss -lptn 'sport = :3000'\n\n# Blunt but effective on Linux\nfuser -v 3000/tcp\n\n# Windows, cmd or PowerShell\nnetstat -ano | findstr :3000\n\n# Windows, nicer output\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess |\n  ForEach-Object { Get-Process -Id $_.OwningProcess }"
    },
    {
      "t": "p",
      "x": "The `lsof` flags matter more than they look. `-n` skips reverse DNS and `-P` skips port name lookup, which is the difference between an instant answer and a five second pause. `-sTCP:LISTEN` filters out the established connections that share the same local port, so you see the one socket that is actually blocking your bind instead of forty rows of traffic."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "You may need sudo to see the name",
      "x": "`lsof` and `ss` only show the owning command for processes you own. If a port looks occupied but the PID column is blank, rerun with `sudo`. A blank owner usually means the port belongs to root, another user account, or a container runtime."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "p",
      "x": "Send `SIGTERM` first. It gives the process a chance to close its listeners, flush logs and release file locks. Escalate to `SIGKILL` only if the process ignores you, and understand that when you do, none of its cleanup code runs."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Polite: ask it to stop\nkill 48213\n\n# Check whether it listened\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Rude: only after the polite version failed\nkill -9 48213\n\n# Kill whatever holds the port, in one step (Linux)\nfuser -k 3000/tcp\n\n# Windows\ntaskkill /PID 48213 /F\n\n# Cross-platform, no PID hunting\nnpx kill-port 3000"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Read the process name before you kill the PID",
      "x": "Port numbers get reused fast. If `lsof` says the owner is `postgres`, `docker`, `ControlCe` or anything with a PID in the low hundreds, you are about to kill infrastructure, not a stale dev server. Confirm with `ps -p <pid> -o command=` first."
    },
    {
      "t": "h2",
      "x": "Why the port survives a crash"
    },
    {
      "t": "p",
      "x": "This is the part that feels supernatural. You killed the process. The terminal came back. The port is still gone. There are four ordinary explanations, and they cover nearly every case."
    },
    {
      "t": "h3",
      "x": "The parent died and the child did not"
    },
    {
      "t": "p",
      "x": "This is the big one. Tools like `nodemon`, `concurrently`, `npm run dev` and most watch-mode wrappers spawn your server as a child process. Ctrl+C sends `SIGINT` to the foreground process group, but if the wrapper spawned the child detached, or the child installed a `SIGINT` handler that never finishes, the wrapper exits and the child keeps its socket. Your shell prompt returns. The listener is still there."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Find the orphan and its process group\nps -o pid,ppid,pgid,command -p $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# A ppid of 1 means it was reparented to init: it is an orphan\n# Kill the whole group, note the leading dash on the pgid\nkill -TERM -48210"
    },
    {
      "t": "h3",
      "x": "Docker is still publishing the port"
    },
    {
      "t": "p",
      "x": "A published port belongs to the Docker daemon, not to the container. `lsof` will show `docker-proxy` or `com.docker.backend` rather than anything recognisable, and killing that process is a bad idea. Stop the container instead."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container claims the port?\ndocker ps --format 'table {{.ID}}\\t{{.Names}}\\t{{.Ports}}'\n\n# Stop it, do not kill docker-proxy\ndocker stop <name>\n\n# Compose leaves containers behind after a failed run\ndocker compose down --remove-orphans"
    },
    {
      "t": "h3",
      "x": "The port is in a different network namespace"
    },
    {
      "t": "p",
      "x": "On WSL2, a Linux process binding `0.0.0.0:3000` and a Windows process binding `0.0.0.0:3000` are not the same socket, but Windows forwards localhost traffic into the WSL namespace, so the symptoms overlap confusingly. Run your diagnosis on the side that reported the error. A `netstat` on the Windows host will not find a listener that lives inside the distro."
    },
    {
      "t": "h3",
      "x": "It is you"
    },
    {
      "t": "p",
      "x": "A second terminal tab. A VS Code integrated terminal running the same task. A debugger session that attached and stayed attached. Check before you go deeper."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "Search for this error and you will be told to wait sixty seconds for `TIME_WAIT` sockets to expire. For a crashed Node server on Linux or macOS, that advice is almost always wrong, and following it wastes a minute per attempt while the real cause keeps running."
    },
    {
      "t": "p",
      "x": "Here is the actual mechanism. When a TCP connection closes, the side that closed first keeps the socket in `TIME_WAIT` for roughly a minute so that delayed packets do not get delivered to a new connection reusing the same tuple. Those sockets have your listening port as their local port, so historically they blocked a rebind. `SO_REUSEADDR` was invented to fix exactly this, and libuv sets it on listening sockets by default on Unix-like platforms, which means Node, Deno and Bun all inherit the fix. Python does not: `socketserver` and raw `socket` code need `sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)` before `bind()`, which is why the folklore persists."
    },
    {
      "t": "p",
      "x": "So if you are on Node and the port is occupied, something is listening. Go find it. If you are writing a raw socket server in Python, C or Java, set the option and the problem disappears. Windows treats `SO_REUSEADDR` differently enough that the same code has different consequences there, so do not port the assumption across platforms without checking."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Does anything hold the port in a non-LISTEN state?\nss -tan 'sport = :3000'\n\n# State column: LISTEN means a live server.\n# TIME-WAIT rows alone will not block a Node rebind."
    },
    {
      "t": "h2",
      "x": "Wildcards, loopback and the triple colon"
    },
    {
      "t": "p",
      "x": "`:::3000` in the Node error is the IPv6 wildcard address `::` followed by the port. Node binds it in dual-stack mode by default, so that one socket covers both IPv6 and IPv4 traffic. That has a consequence people trip over: a process on `0.0.0.0:3000` and a process on `:::3000` collide, because the second one covers the first."
    },
    {
      "t": "p",
      "x": "The reverse is not always true. Binding `127.0.0.1:3000` claims only loopback, so another process can still bind `192.168.1.10:3000` on the same machine. If you are running several services and want them isolated, bind specific addresses rather than the wildcard. If you want your dev server reachable from a phone on the same network, the wildcard is what you want, and the collisions come with it."
    },
    {
      "t": "h2",
      "x": "Ports you never claimed"
    },
    {
      "t": "p",
      "x": "Sometimes nothing of yours is running and the port is still taken. On macOS, AirPlay Receiver listens on ports 5000 and 7000, which is why Flask defaulting to 5000 became a recurring complaint after macOS Monterey shipped. You can turn it off under System Settings, General, AirDrop and Handoff, or just move your app. Check the current location of that setting against your own macOS version, since Apple moves it between releases."
    },
    {
      "t": "p",
      "x": "Other regulars: port 8080 taken by a JVM tool or a local Jenkins, 5432 taken by a Postgres that Homebrew starts at login, 3306 taken by a MySQL service, and 6379 taken by Redis. None of these are worth killing. Change your port."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Handle the signals and close the server",
          "x": "The single highest-value change. Without this, an HTTP server with open keep-alive connections can hang on shutdown, and the impatient Ctrl+C that follows is what orphans it.",
          "code": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing`);\n\n  server.close((err) => {\n    process.exit(err ? 1 : 0);\n  });\n\n  // Keep-alive sockets will hold the server open otherwise.\n  // server.closeAllConnections() exists in newer Node releases;\n  // check `node -v` against the docs before relying on it.\n  setTimeout(() => {\n    console.error('forced exit after 10s');\n    process.exit(1);\n  }, 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
        },
        {
          "title": "Fail with a useful message instead of a stack trace",
          "x": "Catching the error lets you print something a tired developer can act on at 6pm, rather than a raw trace through internal modules.",
          "code": "server.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${port} is taken. Find the owner with:\\n` +\n      `  lsof -nP -iTCP:${port} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});"
        },
        {
          "title": "Let tests pick their own port",
          "x": "Binding port 0 asks the kernel for any free port. Parallel test workers stop fighting each other, and a leaked test server never blocks tomorrow's run.",
          "code": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;\n\n// afterAll / teardown\nawait new Promise((resolve) => server.close(resolve));"
        },
        {
          "title": "Make the dev script clean up after itself",
          "x": "If your watcher is the thing leaking children, stop working around it in your shell history and put the fix in package.json.",
          "code": "{\n  \"scripts\": {\n    \"predev\": \"kill-port 3000 || true\",\n    \"dev\": \"node --watch server.js\"\n  }\n}"
        }
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "A predev kill-port is a workaround, not a fix",
      "x": "It will happily kill an unrelated process that happened to grab port 3000, and it hides a shutdown bug that will resurface in production when your orchestrator sends `SIGTERM` and waits. Use it in local scripts if you must. Do not let it substitute for the signal handler."
    },
    {
      "t": "h2",
      "x": "In containers and on production hosts"
    },
    {
      "t": "p",
      "x": "On a real host the problem changes shape. `EADDRINUSE` during a deploy usually means the old instance has not released the port yet, and the fix belongs in your rollout strategy rather than in a kill command. Give the old process a termination grace period longer than its slowest in-flight request, make sure your app actually exits on `SIGTERM` instead of ignoring it, and drain the load balancer before you stop accepting connections."
    },
    {
      "t": "p",
      "x": "Inside a container, remember that PID 1 has special signal semantics. A process running as PID 1 does not get the kernel's default signal handlers, so if your app has no explicit `SIGTERM` handler, the signal is discarded and the runtime waits out its full timeout before sending `SIGKILL`. Shell-form `CMD` in a Dockerfile makes this worse by putting `/bin/sh` at PID 1, where it will not forward signals to your app at all. Use the exec form, or an init like `tini`."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of the PID 1 signal story, from the side where the process dies too early.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite symptom: nothing is listening where you expected something to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnosing CORS errors",
          "desc": "Once the dev server finally starts on a different port, this is often the next thing to break.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, `kill $(lsof -t -iTCP:3000 -sTCP:LISTEN)`. On Linux you can also use `fuser -k 3000/tcp`. On Windows, find the PID with `netstat -ano | findstr :3000` then run `taskkill /PID <pid> /F`. Check the process name first, because the owner might be Postgres, Docker or a system service rather than your dev server."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends SIGINT to the foreground process group. If your dev server runs as a detached child of a watcher like nodemon or concurrently, the wrapper exits and the child keeps running with the socket still bound. Check the parent PID with `ps -o pid,ppid,command -p <pid>`. A ppid of 1 confirms it was orphaned."
        },
        {
          "q": "Is EADDRINUSE caused by TIME_WAIT sockets?",
          "a": "Rarely, for Node. libuv sets SO_REUSEADDR on listening sockets on Unix-like platforms, so TIME_WAIT sockets from previously closed connections do not block a rebind. If you are writing raw socket code in Python, C or Java without that option set, then yes, and setting SO_REUSEADDR before bind() is the fix. Waiting sixty seconds is not."
        },
        {
          "q": "What does the triple colon in ':::3000' mean?",
          "a": "It is the IPv6 wildcard address `::` followed by `:3000`. Node binds it in dual-stack mode, so that one socket accepts both IPv6 and IPv4 connections. That is why a server on `:::3000` conflicts with one trying to bind `0.0.0.0:3000`."
        },
        {
          "q": "Why does macOS say port 5000 is in use when nothing is running?",
          "a": "AirPlay Receiver listens on ports 5000 and 7000 on recent macOS versions. Disable it in System Settings under General, then AirDrop and Handoff, or run your app on another port. Apple moves this setting between releases, so confirm the path for the version you are on."
        },
        {
          "q": "Can two processes listen on the same port at once?",
          "a": "Only if every socket involved sets SO_REUSEPORT, which exists on Linux and the BSDs and is designed for load balancing across worker processes. Node exposes a `reusePort` option on `listen()` in recent releases, so check your version's documentation. Node's `cluster` module does something different: the primary binds once and hands accepted connections to workers, so only one real bind takes place."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-18",
  "updated": "2026-09-18",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
