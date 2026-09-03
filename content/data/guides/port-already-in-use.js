module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Busy Port",
  "h1": "Port already in use: finding the process that holds it",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens, how to identify the process holding a port on Linux, macOS and Windows, and why a crashed server keeps the port bound.",
  "standfirst": "The commands that identify the owning process on each platform, plus the reasons a port stays bound after a crash and how to stop it happening again.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port",
    "graceful shutdown node"
  ],
  "cardDesc": "Identify the process holding a port on any platform, free it safely, and stop the leak recurring.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The port is held by a live process, nearly always your own previous run. Find its PID before you kill anything.",
        "macOS and Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Windows: `netstat -ano | findstr :3000`.",
        "Send SIGTERM first. `kill -9` skips your cleanup handlers and can orphan the child that actually owns the socket.",
        "After a crash the usual culprit is an orphaned child process, or a `server.close()` still waiting on keep-alive connections.",
        "TIME_WAIT is rarely the cause for a listening server, because Node, Go and most Python frameworks already set `SO_REUSEADDR`."
      ]
    },
    {
      "t": "lede",
      "x": "A bound port is a fact about a running process, not a stuck resource. Something on the machine holds a listening socket on that address and port, the kernel refuses to hand it to a second binder, and your server exits. The whole job is identifying that something. The kill is the easy part, and the interesting question is why the previous run left a listener behind at all."
    },
    {
      "t": "h2",
      "x": "Read the error before you kill anything"
    },
    {
      "t": "p",
      "x": "Every runtime reports the same underlying `EADDRINUSE` from the `bind()` or `listen()` syscall, in its own dialect. The address in the message matters as much as the port number."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node.js\nError: listen EADDRINUSE: address already in use :::3000\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000\n\n# Python (errno 98 on Linux, errno 48 on macOS)\nOSError: [Errno 98] Address already in use\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker\nBind for 0.0.0.0:8080 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Note the `:::3000` in the Node message. That is the IPv6 wildcard address `::`, not three colons of decoration. On most Linux systems `net.ipv6.bindv6only` is `0`, so a socket bound to `::` also accepts IPv4 traffic on the same port. A second process asking for `0.0.0.0:3000` then collides with it, even though the two addresses look different. The reverse also holds. This is why a dev server on `127.0.0.1:5173` and another tool on `0.0.0.0:5173` sometimes coexist and sometimes do not: binding to one specific interface conflicts only with a listener that covers that interface."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "The Docker wording moved",
      "x": "Older Docker versions prefix the failure with `driver failed programming external connectivity on endpoint`. Newer ones say `failed to set up container networking`. The stable part is the tail: `port is already allocated`. Search for that."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Command",
        "Notes"
      ],
      "rows": [
        [
          "macOS / Linux",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`-n` skips DNS, `-P` skips service-name lookup, so output stays readable and fast"
        ],
        [
          "Linux",
          "`sudo ss -lptn 'sport = :3000'`",
          "Without sudo the process column is blank for processes you do not own"
        ],
        [
          "Linux",
          "`sudo fuser -k 3000/tcp`",
          "Identifies and kills in one step. Convenient, and easy to fire at the wrong port"
        ],
        [
          "Windows (cmd)",
          "`netstat -ano | findstr :3000`",
          "The last column is the PID. `LISTENING` rows are the ones that matter"
        ],
        [
          "Windows (PowerShell)",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`",
          "Pipe `OwningProcess` into `Get-Process` for a name"
        ],
        [
          "Any, with Docker",
          "`docker ps -a --filter publish=3000`",
          "Finds a stopped-but-present container still owning a published port"
        ]
      ],
      "caption": "Port 3000 used as the example. Substitute your own."
    },
    {
      "t": "p",
      "x": "The PID alone is not enough. You want the command line, because \"node\" tells you nothing when six Node processes are running and one of them is your editor's TypeScript language server. On Linux and macOS, expand it:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is listening, in full\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Full command line for that PID, plus its parent\nps -o pid,ppid,lstart,command -p 48213\n\n# On Windows PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  ForEach-Object { Get-Process -Id $_.OwningProcess | Format-List Id, ProcessName, Path, StartTime }"
    },
    {
      "t": "p",
      "x": "Two details in that `ps` output earn their keep. The start time tells you whether this is a leftover from twenty minutes ago or something that launched two seconds ago, which distinguishes a stale process from a supervisor that keeps restarting a crashing server. The parent PID tells you whether killing the child is pointless because a supervisor will immediately respawn it."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not run killall node",
      "x": "It is the most commonly copied answer and it is a blunt instrument. It kills language servers, unrelated dev servers, Electron helpers and any build watcher you had running. Kill the PID you identified, not a process name."
    },
    {
      "t": "h2",
      "x": "Free the port without breaking something else"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm what it is",
          "x": "Look at the full command line. If it is not yours, stop and think. A listener on 5432, 6379 or 3306 is probably a database you actually want running, started by a service manager that will bring it back anyway.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Send SIGTERM",
          "x": "Plain `kill` sends signal 15. A well-behaved server closes its listener, finishes in-flight requests and exits. Give it a couple of seconds, then check again.",
          "code": "kill 48213\nsleep 2\nlsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "SIGKILL cannot be caught, so no cleanup runs: no lock file removal, no flush, no child teardown. Use it when SIGTERM has already failed, not as the default.",
          "code": "kill -9 48213"
        },
        {
          "title": "One-liner, once you trust it",
          "x": "`lsof -t` prints bare PIDs. GNU `xargs -r` skips the call when nothing matched; on macOS drop the `-r`. Fine in a scratch script, risky in a shared one, because it kills whatever happens to be there.",
          "code": "lsof -ti tcp:3000 | xargs -r kill"
        },
        {
          "title": "On Windows",
          "x": "`taskkill` without `/F` is the polite request and `/F` is the forced version. `/T` also terminates the child tree, which is usually what you need for a dev server launched through a shell wrapper.",
          "code": "taskkill /PID 12345 /T\ntaskkill /PID 12345 /T /F"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Why the port stays bound after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people, because the terminal looks empty. Your dev server printed a stack trace, the prompt came back, and yet the port is still taken. Four causes cover nearly all of it."
    },
    {
      "t": "h3",
      "x": "1. The parent died and a child inherited the socket"
    },
    {
      "t": "p",
      "x": "Watchers such as `nodemon`, `ts-node-dev`, `concurrently` and `npm run dev` spawn your actual server as a child. The listening socket belongs to that child. When the wrapper crashes or you close the terminal, the child is reparented to init and keeps running, unaware that anyone wanted it to stop. Ctrl-C sends SIGINT to the foreground process group, which usually reaches everyone, but a process spawned with `detached: true` sits in a different group and never gets the signal."
    },
    {
      "t": "h3",
      "x": "2. server.close() is waiting on keep-alive connections"
    },
    {
      "t": "p",
      "x": "This one produces the classic hang. `server.close()` stops accepting new connections and then waits for existing ones to end. HTTP keep-alive connections do not end on their own; a browser tab with an open connection will happily hold your process alive for the length of the keep-alive timeout. The process is still running, so the socket is still bound, so your restart fails. Node 18.2 added `server.closeAllConnections()` and `server.closeIdleConnections()` for exactly this, though you should check what your installed version supports."
    },
    {
      "t": "h3",
      "x": "3. A supervisor is restarting the crashing process"
    },
    {
      "t": "p",
      "x": "systemd with `Restart=always`, pm2, a Docker restart policy or a Compose service will bring the process straight back. You kill the PID, run your server, and it fails again with a new PID in the output. Check `systemctl status`, `pm2 list` or `docker ps` before concluding that the port is cursed."
    },
    {
      "t": "h3",
      "x": "4. A background job you forgot about"
    },
    {
      "t": "p",
      "x": "Anything started with a trailing `&`, or inside a `tmux` pane, or by a VS Code task, or by a `docker compose up -d` from last week. `jobs` covers only the current shell. `pgrep -af node` or `docker ps` covers considerably more."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT explanation is usually wrong"
    },
    {
      "t": "p",
      "x": "The most repeated answer to this error is that the socket is in `TIME_WAIT` and you have to wait sixty seconds. For a listening server that is almost always false, and believing it wastes a minute you did not need to spend."
    },
    {
      "t": "p",
      "x": "Here is the actual mechanism. When a TCP connection closes, the side that closed first keeps the four-tuple in `TIME_WAIT` for twice the maximum segment lifetime, so that stray packets from the old connection cannot be misread as part of a new one. Historically that blocked a server from rebinding its listening port after a restart. The fix, `SO_REUSEADDR`, has been standard for decades, and Node, Go and most Python web servers set it for you. So `TIME_WAIT` entries in `ss -tan | grep 3000` are normal debris from closed client connections. They are not what is refusing your bind."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "SO_REUSEADDR means something different on Windows",
      "x": "On Windows, `SO_REUSEADDR` can let a second process bind a port that is already actively listening, silently stealing traffic. That is why Windows also offers `SO_EXCLUSIVEADDRUSE`. Do not copy Unix socket-option advice onto Windows without checking it."
    },
    {
      "t": "p",
      "x": "If your bind really does fail after every restart and you have proven that no process holds the port, you are in one of the rarer cases: a container network namespace that was never torn down, or an OS-level port reservation. Those look different, and the next section covers them."
    },
    {
      "t": "h2",
      "x": "Cases that look like EADDRINUSE but are not"
    },
    {
      "t": "ul",
      "items": [
        "**Ports below 1024 give you EACCES, not EADDRINUSE.** Binding port 80 as a non-root user is a permissions failure. On Linux, `setcap cap_net_bind_service=+ep` on the binary, or a reverse proxy in front, is the usual answer.",
        "**macOS holds 5000 and 7000.** AirPlay Receiver, part of Control Center, listens on them, and `lsof -i :5000` shows `ControlCe` as the owner. Turn AirPlay Receiver off in System Settings or, more sensibly, use a different port. This has applied since macOS Monterey; confirm against your own version.",
        "**Windows reserves port ranges for Hyper-V and WinNAT.** Ports inside a reserved range fail to bind with nothing listening on them. Run `netsh interface ipv4 show excludedportrange protocol=tcp` to list the reservations, which frequently swallow common dev ports after a Docker Desktop or WSL2 update.",
        "**Docker holds the port with docker-proxy, not your app.** `lsof` reports `docker-proxy` or `com.docke`. Killing it fights the daemon, which will recreate it. Stop the container instead.",
        "**WSL2 and the Windows host are separate network stacks with shared localhost forwarding.** A listener on the Windows side can make the same port appear unavailable inside the distro, and that process is invisible to `ss` in WSL."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Two changes remove most of the recurrence. Handle termination signals properly, and stop hard-coding a port in your tests."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(process.env.PORT || 3000);\n\n// Track sockets so keep-alive connections cannot hold the process open.\nconst sockets = new Set();\nserver.on('connection', (socket) => {\n  sockets.add(socket);\n  socket.on('close', () => sockets.delete(socket));\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n\n  // Grace period, then force the stragglers.\n  setTimeout(() => {\n    for (const socket of sockets) socket.destroy();\n    process.exit(1);\n  }, 5000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "The `unref()` matters. Without it the timer keeps the event loop alive for a full five seconds on every clean shutdown, which turns a fast exit into a slow one and makes people reach for Ctrl-C twice. The trade-off runs the other way too: a forced socket destroy after five seconds will cut off a genuinely slow request. Pick the grace period from your own request latency, not from a blog post."
    },
    {
      "t": "p",
      "x": "For tests, bind port zero. The kernel assigns a free ephemeral port and tells you which one, so parallel test workers stop colliding with each other and with your dev server."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on ${port}`);\n});"
    },
    {
      "t": "p",
      "x": "A last habit worth adopting: give each project its own port and write it in the README. Three services all defaulting to 3000 is a self-inflicted problem, and it costs nothing to make them 3000, 3001 and 3002 permanently."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the container that was holding your port is not running at all.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite failure: nothing is listening where you expect it.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node cannot find module",
          "desc": "Resolution failures that stop a server before it ever reaches listen().",
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
          "a": "Find the PID with lsof -nP -iTCP:3000 -sTCP:LISTEN on macOS or Linux, then run kill <PID>. If it survives two seconds, use kill -9. On Windows, netstat -ano | findstr :3000 gives the PID in the last column, and taskkill /PID <PID> /T /F stops it along with its children."
        },
        {
          "q": "Why is a port still in use after I closed the terminal?",
          "a": "Closing a terminal does not reliably kill everything it started. A child process spawned detached, or one that ignored SIGHUP, keeps its listening socket and gets reparented to init. Look for it with pgrep -af node, or the equivalent for your runtime."
        },
        {
          "q": "What does EADDRINUSE actually mean?",
          "a": "The bind() or listen() syscall failed because another socket is already bound to that address and port combination. It is the kernel refusing, not your framework. The same condition appears as errno 98 on Linux, errno 48 on macOS and WSAEADDRINUSE on Windows."
        },
        {
          "q": "Do I need to wait for TIME_WAIT to expire?",
          "a": "Almost never for a server socket. Node, Go and most Python web servers set SO_REUSEADDR, which lets a listener rebind while old connections sit in TIME_WAIT. If your bind keeps failing, a live process still holds the port, so keep looking rather than waiting."
        },
        {
          "q": "Why does port 5000 fail on my Mac?",
          "a": "AirPlay Receiver listens on 5000 and 7000, and lsof -i :5000 shows ControlCe as the owner. Disable AirPlay Receiver in System Settings, or move your app to another port. This behavior arrived with macOS Monterey, so check it against your own version."
        },
        {
          "q": "lsof shows nothing but the port is still refused. What now?",
          "a": "Try sudo, since lsof hides processes owned by other users. Then check docker ps for a published port, and on Windows run netsh interface ipv4 show excludedportrange protocol=tcp, because Hyper-V and WinNAT reserve ranges that block binding with no listener present."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-03",
  "updated": "2026-09-03",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
