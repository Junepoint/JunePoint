module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on a Port",
  "h1": "Port already in use: find the process, then fix the cause",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something still holds the port. Find it with lsof, ss or netstat, kill it safely, and learn why a crash leaves a socket bound.",
  "standfirst": "Almost every EADDRINUSE is a live process you forgot about, not a lingering kernel state. Here is how to identify it on each platform, stop it without losing data, and stop your own crashes from leaving orphans behind.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify what holds a TCP port on macOS, Linux and Windows, then fix the orphaned-child problem behind most repeat offences.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `netstat -ano | findstr \":3000\"` on Windows. That is the whole first step.",
        "Send `SIGTERM` before `SIGKILL`. A `kill -9` skips your shutdown handlers, which is how half-written files and stale lock entries happen.",
        "After a crash, the port is usually held by a surviving **child** process, not by the parent you watched die.",
        "`TIME_WAIT` is the popular explanation and it is almost always the wrong one for a listening server, because most runtimes already set `SO_REUSEADDR`.",
        "If nothing appears to be listening and the bind still fails, suspect a reserved port range, a container port publisher, or a socket owned by another user."
      ]
    },
    {
      "t": "p",
      "x": "The message varies by runtime but the operating system error underneath is the same. Node reports `Error: listen EADDRINUSE: address already in use :::3000`. Python raises `OSError: [Errno 48] Address already in use` on macOS and `[Errno 98]` on Linux, because the two kernels number that error differently. Docker says the port `is already allocated`, or, on newer versions, that it `failed to bind host port`. All of them mean a socket is already bound to the address and port you asked for, and the kernel will not hand it over."
    },
    {
      "t": "h2",
      "x": "Find the process in one command"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: what is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -lptn 'sport = :3000'\n\n# Windows, cmd or PowerShell\nnetstat -ano | findstr \":3000\"\ntasklist /FI \"PID eq 12345\"\n\n# Windows, PowerShell only\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess"
    },
    {
      "t": "p",
      "x": "Two flags on the `lsof` line earn their place. `-n` skips reverse DNS and `-P` skips service-name lookup, so you get numbers instead of a hung terminal and the word `http`. The `-sTCP:LISTEN` filter matters more than it looks: without it you also match every outbound connection to port 3000, which is noise when you are debugging a client and a server on the same machine."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "An empty result is not proof",
      "x": "Both `lsof` and `ss` show process names only for sockets you own. A service started by another user, or by a system launcher, appears as a blank or missing PID until you rerun with `sudo`. If the command prints nothing at all and the bind still fails, do not conclude the port is free."
    },
    {
      "t": "h2",
      "x": "Kill it, and kill it in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask politely. The process gets to run its shutdown handlers.\nkill 12345\n\n# Check whether it actually went\nps -p 12345 -o pid,ppid,stat,command\n\n# Only now, if it is wedged\nkill -9 12345\n\n# Linux shortcut: kill whatever holds the TCP port\nfuser -k 3000/tcp\n\n# Windows\ntaskkill /PID 12345 /F"
    },
    {
      "t": "p",
      "x": "`kill 12345` sends `SIGTERM`, which a well-behaved server catches so it can finish in-flight requests, flush logs and release a database advisory lock. `kill -9` sends `SIGKILL`, which cannot be caught. The process stops mid-instruction. For a dev server rendering a hot-reload bundle that costs you nothing; for anything holding a write transaction or a PID file, it is the start of the next problem. Reach for it second, not first."
    },
    {
      "t": "p",
      "x": "Pattern killing is convenient and indiscriminate. `pkill -f \"node dist/server.js\"` matches against the full command line, which is exactly what you want until the pattern also matches your editor’s language server or a colleague’s process on a shared box. Print the matches before you act on them: `pgrep -af node` costs one extra line and tells you what you are about to destroy."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port held"
    },
    {
      "t": "p",
      "x": "This is the part that feels like the machine is lying to you. Your server threw an exception, the stack trace printed, the shell prompt came back. The port is still bound. The explanation is nearly always that something you did not notice is still alive and holding the listening socket."
    },
    {
      "t": "ul",
      "items": [
        "**A forked child outlived its parent.** Cluster workers, `child_process.spawn`, a Vite or webpack sub-process, a test runner’s worker pool. When the parent dies without reaping them, the children are reparented to `init` and keep their inherited file descriptors, including the listening socket.",
        "**A process manager restarted it.** `nodemon`, `pm2`, `systemd` with `Restart=always`, or a Docker restart policy will bring the service straight back. You then race your own supervisor for the port and lose.",
        "**The terminal closed but the job did not.** A process started with `&`, inside `tmux`, or detached from a shell that has since exited, will not show up anywhere you are currently looking.",
        "**The IDE is still running it.** VS Code debug sessions, JetBrains run configurations and test watchers all keep servers alive after the editor tab looks idle.",
        "**A container is publishing the port.** The host-side bind belongs to the Docker proxy or the daemon, not to any process in your project tree.",
        "**A socket descriptor leaked into an unrelated process.** Rarer, but it happens when a long-lived helper inherited the descriptor from a shell that once ran the server."
      ]
    },
    {
      "t": "p",
      "x": "The diagnostic shortcut is the parent PID. Run `ps -p <pid> -o pid,ppid,command` on whatever `lsof` reported. A `ppid` of `1` means the parent is gone and you are looking at an orphan, which is the signature of a crash that took the supervisor down and left a worker running. A `ppid` pointing at `nodemon` or `pm2` means you should stop the supervisor rather than the worker, because killing the worker alone just triggers a restart."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "Search for this error and you will be told to wait sixty seconds for `TIME_WAIT` to clear, or to set `SO_REUSEADDR`. That advice is misapplied often enough to be worth correcting. `TIME_WAIT` applies to the connection sockets your server accepted, not to the listening socket itself, and `SO_REUSEADDR` exists precisely so that a listener can rebind while those old connection sockets are still draining. Node, Go and most Python web servers set it for you already. If your framework sets it and you still get `EADDRINUSE`, the cause is a live listener, full stop, and waiting will not help."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "# Raw sockets are the case where you do have to set it yourself\nimport socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind(('0.0.0.0', 3000))\ns.listen()"
    },
    {
      "t": "p",
      "x": "`SO_REUSEPORT` is a different option with a similar name, and confusing the two leads somewhere unpleasant. It lets several processes bind the same port simultaneously and have the kernel load-balance between them. That is a feature when you are running a pool of identical workers. It is a trap in development, because a second copy of your server starts cleanly, silently takes half the traffic, and your changes appear to apply only every other request."
    },
    {
      "t": "h2",
      "x": "Conflicts that are not conflicts"
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "What it really is",
        "How to check"
      ],
      "rows": [
        [
          "`EACCES` on port 80 or 443",
          "Ports below 1024 need elevated privileges or a capability, which is a permission failure rather than a conflict",
          "Bind to 8080 and see if it works"
        ],
        [
          "`EADDRNOTAVAIL`",
          "The address you named does not exist on this host, often a stale IP in config or a container-only hostname",
          "`ip addr` or `ifconfig` for the addresses you actually have"
        ],
        [
          "Docker `port is already allocated`",
          "A stopped-but-not-removed container, or another published port on the same host interface",
          "`docker ps -a` then `docker port <name>`"
        ],
        [
          "Port 5000 or 7000 taken on macOS",
          "AirPlay Receiver has claimed it on recent macOS releases; verify against your own version",
          "System Settings, then the AirPlay Receiver toggle, or just pick another port"
        ],
        [
          "Windows: nothing listening, bind still fails",
          "Hyper-V and WinNAT reserve blocks of dynamic ports at boot, and reservations move between reboots",
          "`netsh interface ipv4 show excludedportrange protocol=tcp`"
        ],
        [
          "Fails as you, works with sudo",
          "The socket belongs to another user and your tools were hiding it",
          "`sudo lsof -nP -iTCP:3000`"
        ]
      ],
      "caption": "Failures that present as a busy port but have a different root cause."
    },
    {
      "t": "h2",
      "x": "Make your own server fail legibly"
    },
    {
      "t": "p",
      "x": "An unhandled `EADDRINUSE` prints a stack trace through your framework’s internals and tells the reader nothing actionable. Two small additions fix that and also stop your process from being the orphan next time."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const port = Number(process.env.PORT) || 3000\nconst server = app.listen(port)\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is in use. Find the owner with:`)\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`)\n    process.exit(1)\n  }\n  throw err\n})\n\nconst shutdown = () => {\n  server.close(() => process.exit(0))\n  // Keep-alive sockets can hold close() open indefinitely\n  setTimeout(() => process.exit(1), 5000).unref()\n}\n\nprocess.on('SIGINT', shutdown)\nprocess.on('SIGTERM', shutdown)"
    },
    {
      "t": "p",
      "x": "That `setTimeout` is not paranoia. `server.close()` stops accepting new connections but waits for existing ones, and an idle keep-alive connection from a browser tab counts as existing. Without a deadline your graceful shutdown hangs, you lose patience, you `kill -9`, and you are back where you started. Node also offers `server.closeAllConnections()` for forcing those sockets shut; it arrived in Node 18.2, so check `node -v` before relying on it as of October 2026."
    },
    {
      "t": "p",
      "x": "If you spawn child processes, give them the same treatment. A parent that exits without calling `kill()` on its children is manufacturing the orphan you will find with `lsof` tomorrow. On Linux, `spawn(cmd, args, { detached: true })` followed by `process.kill(-child.pid, 'SIGTERM')` signals the whole process group, which catches grandchildren too."
    },
    {
      "t": "h2",
      "x": "Let the kernel pick the port in tests"
    },
    {
      "t": "p",
      "x": "Fixed ports in a test suite are a standing invitation to this error, particularly under a parallel runner where several workers start the same server at once. Binding port `0` asks the operating system for any free ephemeral port, and the conflict becomes structurally impossible."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address()\n  baseUrl = `http://127.0.0.1:${port}`\n})\n\n// afterAll\nawait new Promise((resolve) => server.close(resolve))"
    },
    {
      "t": "h2",
      "x": "A diagnosis order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Read the address, not just the port",
          "x": "`:::3000` is IPv6 wildcard, `0.0.0.0:3000` is IPv4 wildcard, `127.0.0.1:3000` is loopback only. A wildcard bind collides with a loopback bind on the same port, which is why two configs that look different still fight."
        },
        {
          "title": "Identify the holder",
          "x": "Run the listener query for your platform. If it returns nothing, run it again with `sudo` before believing it.",
          "code": "sudo lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Look at its parent",
          "x": "This tells you whether to kill the process or its supervisor. A `ppid` of 1 means you found an orphan.",
          "code": "ps -p 12345 -o pid,ppid,stat,lstart,command"
        },
        {
          "title": "Stop the right thing",
          "x": "Stop the supervisor if there is one, otherwise `SIGTERM` the process and wait a few seconds before escalating.",
          "code": "pm2 stop api   # or: docker compose down\nkill 12345"
        },
        {
          "title": "Confirm the port is free before restarting",
          "x": "Re-run the query. An immediate restart against a still-bound port produces the same error and makes you doubt the fix.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo free"
        },
        {
          "title": "Fix the mechanism, not the instance",
          "x": "If this is the third time this week, the cause is an unhandled signal or an unreaped child. Add the error handler and the shutdown hook above."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Keep a one-liner to hand",
      "x": "A shell function such as `port() { lsof -nP -iTCP:$1 -sTCP:LISTEN; }` in your profile removes the flag-recall step entirely. Resist the temptation to make it kill automatically. The interesting information is which process it is, and a function that kills before you read the output throws that away."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of a failed startup: a container that binds nothing because PID 1 is gone.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The inverse symptom, checked layer by layer, when nothing is listening at all.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "When the server never reaches the listen call in the first place.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "Find it with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, then `kill <pid>`. On Windows, `netstat -ano | findstr \":3000\"` gives the PID in the last column and `taskkill /PID <pid> /F` ends it. On Linux, `fuser -k 3000/tcp` does both steps at once, which is fast and tells you nothing about what you just killed."
        },
        {
          "q": "Why do I get EADDRINUSE after my server crashes?",
          "a": "Because something the crashed process started is still running and still holds the listening socket. Cluster workers, bundler sub-processes and test-runner pools all survive a parent that dies without reaping them. Check the parent PID of whatever holds the port: if it is 1, you are looking at an orphan, and the real fix is a shutdown handler that kills its children."
        },
        {
          "q": "Do I have to wait for TIME_WAIT to clear before restarting?",
          "a": "Usually no. `TIME_WAIT` affects accepted connection sockets rather than the listening socket, and runtimes including Node and Go set `SO_REUSEADDR` so a listener can rebind immediately. If restarting still fails, a live process holds the port. Waiting sixty seconds only appears to help because the real owner happened to exit meanwhile."
        },
        {
          "q": "lsof shows nothing but the port is still in use. What now?",
          "a": "Three things to try. Re-run with `sudo`, because these tools hide sockets owned by other users. Check whether a container publishes the port with `docker ps -a`. On Windows, check reserved ranges with `netsh interface ipv4 show excludedportrange protocol=tcp`, since Hyper-V claims blocks of dynamic ports at boot and those blocks shift between reboots."
        },
        {
          "q": "Is kill -9 safe to use on a dev server?",
          "a": "For a stateless dev server, generally yes. `SIGKILL` cannot be caught, so the process has no chance to flush buffers, remove a PID file or release a lock. That is harmless for a hot-reload bundler and damaging for anything mid-write. Send plain `kill` first, give it a few seconds, and escalate only if the process is genuinely wedged."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Only with `SO_REUSEPORT`, which both processes must set, and which exists so a pool of workers can share a listening port with kernel-side load balancing. It is useful in production and confusing in development, because a second copy of your server starts without error and then serves a share of the requests from stale code."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-28",
  "updated": "2026-10-28",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
