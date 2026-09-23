module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find the Process Holding Your Port",
  "h1": "Port already in use: find it, free it, stop it recurring",
  "eyebrow": "Troubleshooting",
  "description": "Locate the process bound to a busy port on macOS, Linux and Windows, kill it safely, and fix the crash pattern that keeps orphaning it.",
  "standfirst": "One command tells you who owns the port. The interesting part is why a process you thought you stopped is still listening.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Find the process bound to a busy port, kill it without losing data, and stop crashes from orphaning it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means something already owns that address and port. Almost always it is a process you started.",
        "Find the owner with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, or `Get-NetTCPConnection -LocalPort 3000` on Windows.",
        "Send `SIGTERM` first. `kill -9` skips the shutdown handler that releases everything else the process was holding.",
        "After a crash the usual culprit is an orphaned child process, not a socket stuck in `TIME_WAIT`.",
        "If genuinely nothing is listening, suspect a published Docker port, a reserved port range, or a different address family."
      ]
    },
    {
      "t": "lede",
      "x": "Assume the port really is occupied, because it usually is. The confusing cases are the ones where you closed the terminal, saw the shell prompt come back, and something is still bound anyway. That gap between what you stopped and what is actually running is where the time goes."
    },
    {
      "t": "h2",
      "x": "What the error is telling you"
    },
    {
      "t": "p",
      "x": "A listening socket is identified by a protocol, an address and a port. The kernel lets one socket own that combination, so a second `bind()` fails with `EADDRINUSE` and your runtime turns the failure into whatever its idiom is."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Node.js\nError: listen EADDRINUSE: address already in use :::3000\n\nPython\nOSError: [Errno 98] Address already in use\n\nGo\nlisten tcp :8080: bind: address already in use\n\nJava\njava.net.BindException: Address already in use"
    },
    {
      "t": "p",
      "x": "Read the address in front of the port, not just the number. `:::3000` is the IPv6 wildcard. `0.0.0.0:3000` is the IPv4 wildcard. `127.0.0.1:3000` is loopback only. A server on loopback and a server on one specific public interface can share a port quite happily, but a wildcard binding collides with nearly everything, and on most Linux systems an IPv6 wildcard also covers IPv4 through dual-stack mapping. That last detail explains a lot of otherwise baffling conflicts between two frameworks that appear to be using different addresses."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EACCES is a different problem",
      "x": "If the error code is `EACCES` rather than `EADDRINUSE`, nothing is holding the port. You are trying to bind a privileged port, typically below 1024, without the capability to do so. Killing processes will not help. Run with elevated privileges, grant `CAP_NET_BIND_SERVICE`, or proxy from 80 to a high port instead."
    },
    {
      "t": "h2",
      "x": "Find the process in one command"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: exactly who is listening on 3000\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Older systems, still everywhere\nnetstat -tulpn | grep ':3000'"
    },
    {
      "t": "p",
      "x": "The flags earn their place. `-n` skips DNS lookups, `-P` skips port-name lookups, and both make the command return instantly instead of hanging on a slow resolver. `-sTCP:LISTEN` filters out established client connections that merely mention the port, which is the noise that makes people think three processes are fighting over 3000 when only one is listening."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 1234\""
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Run it again with sudo before you conclude the port is free",
      "x": "Unprivileged `lsof` and `ss` will not show you the process behind another user's socket. `ss` prints the socket with an empty process column, `lsof` may print nothing at all. An empty result from an unprivileged shell is not evidence that the port is available."
    },
    {
      "t": "table",
      "head": [
        "Task",
        "macOS",
        "Linux",
        "Windows"
      ],
      "rows": [
        [
          "List the listener",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`ss -ltnp 'sport = :3000'`",
          "`Get-NetTCPConnection -LocalPort 3000`"
        ],
        [
          "See the full command line",
          "`ps -p 1234 -o command=`",
          "`ps -p 1234 -o args=`",
          "`Get-Process -Id 1234`"
        ],
        [
          "Ask it to stop",
          "`kill 1234`",
          "`kill 1234`",
          "`Stop-Process -Id 1234`"
        ],
        [
          "Force it to stop",
          "`kill -9 1234`",
          "`kill -9 1234`",
          "`Stop-Process -Id 1234 -Force`"
        ],
        [
          "Kill by port directly",
          "not built in",
          "`fuser -k 3000/tcp`",
          "not built in"
        ]
      ],
      "caption": "The same five moves on each platform. Substitute your own port and PID."
    },
    {
      "t": "h2",
      "x": "Look at what you are killing first"
    },
    {
      "t": "p",
      "x": "The PID is one column of the answer. The command line is the other, and it is the one that stops you from killing a database you will then spend the afternoon repairing."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# 1. Who owns it, and what is its parent?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\nps -p 41233 -o pid,ppid,user,command\n\n# 2. Ask politely. SIGTERM runs the process's shutdown handler.\nkill 41233\n\n# 3. Confirm it actually went away.\nlsof -nP -iTCP:3000 -sTCP:LISTEN || echo \"port 3000 is free\"\n\n# 4. Only if it ignored SIGTERM entirely.\nkill -9 41233"
    },
    {
      "t": "p",
      "x": "If the command line says `node dist/server.js`, kill it. If it says `postgres`, `docker-proxy`, `nginx` or anything owned by a system account, you have found a service rather than a stray dev server, and the fix is to stop that service properly or move your own app to another port."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "SIGKILL is not a tidier SIGTERM",
      "x": "`kill -9` cannot be caught. The process never runs its cleanup, so lock files, temporary directories, in-flight database transactions and unflushed writes are all left exactly as they were. For a dev server that costs nothing. For anything holding state, try `SIGTERM` and wait a couple of seconds first."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port busy"
    },
    {
      "t": "h3",
      "x": "The parent died and the child kept the socket"
    },
    {
      "t": "p",
      "x": "This is the big one. `npm run dev` does not serve your app. It spawns a shell, which spawns node, which binds the port. Kill the npm process, or close the terminal window, and the signal may never reach the grandchild. The orphan gets reparented to init or launchd, loses its controlling terminal, and carries on listening with nobody watching it."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Orphans show PPID 1 on Linux and macOS\nps -eo pid,ppid,etime,command | grep -i '[n]ode'\n\n# Everything matching, with its command line\npgrep -af node\n\n# Kill a whole process group: note the minus sign\nkill -TERM -41233"
    },
    {
      "t": "h3",
      "x": "The watcher is still running"
    },
    {
      "t": "p",
      "x": "`nodemon`, `vite`, `webpack-dev-server`, `jest --watch` and an IDE debug session all restart your code on a schedule of their own. A crashed app under a watcher is not a stopped app. The watcher notices the exit, rebuilds, and starts a fresh process on the same port, which is exactly what you asked it to do. Stop the watcher, not the server it keeps reviving."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is probably innocent"
    },
    {
      "t": "p",
      "x": "The most repeated answer to this error is that the socket is stuck in `TIME_WAIT` and you should wait sixty seconds. That is usually wrong, and believing it costs you the minute you spend waiting plus the trust you should be placing in your own diagnosis. `TIME_WAIT` applies to a closed connection's four-tuple, not to the listening socket, and most runtimes already set `SO_REUSEADDR` on listeners so that a restart can bind anyway. Node does this by default through libuv on Unix-like systems. Plain Python `socket` code does not, which is why `socketserver` exposes `allow_reuse_address` as an option you have to set yourself."
    },
    {
      "t": "p",
      "x": "Windows is the exception worth knowing about. There, `SO_REUSEADDR` would let an unrelated process steal a port that is already bound, so libuv deliberately does not set it and relies on exclusive binding instead. If you are chasing this on Windows, the semantics genuinely differ from the answer you are reading."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Prove it either way, rather than guessing\nss -tan state time-wait '( sport = :3000 )'   # lingering closed connections\nss -ltn  '( sport = :3000 )'                  # an actual listener\n\n# If the second command returns a row, waiting will not help you."
    },
    {
      "t": "h2",
      "x": "When the port is busy and nobody owns it"
    },
    {
      "t": "p",
      "x": "Occasionally the bind fails and every listing comes back empty. Work through these before you decide the machine is haunted."
    },
    {
      "t": "ul",
      "items": [
        "**A published Docker port.** The listener is `docker-proxy` or the daemon itself, not your app, and a stopped-but-not-removed container can still hold the mapping. Check `docker ps -a` and read the `PORTS` column. The daemon's own complaint ends in `bind: address already in use`.",
        "**A reserved range on Windows.** Hyper-V, WSL and the dynamic port allocator carve out blocks that nothing is listening on but nothing may bind either. Run `netsh interface ipv4 show excludedportrange protocol=tcp` and see whether your port falls inside one.",
        "**WSL2 and the Windows host.** Because localhost is forwarded between them, a listener on the Windows side can block a bind inside the distro, and `ss` inside the distro will not show it. Check from PowerShell as well before concluding anything.",
        "**AirPlay Receiver on macOS.** On recent macOS versions the AirPlay Receiver service has been widely reported to listen on ports 5000 and 7000, which collides with the default port of several web frameworks. Turn it off in System Settings or move your app. Verify on your own machine, because this behaviour has shifted between releases.",
        "**Another user, including root.** Covered above, and worth repeating, because it is the single most common reason a listing looks empty while the port is not."
      ]
    },
    {
      "t": "h2",
      "x": "Make the next crash release the port"
    },
    {
      "t": "p",
      "x": "Most of this class of problem disappears once the process handles signals properly and says something useful when the bind fails."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const port = Number(process.env.PORT) || 3000;\nconst server = app.listen(port, () => console.log(`listening on ${port}`));\n\nserver.on('error', (err) => {\n  if (err.code !== 'EADDRINUSE') throw err;\n  console.error(`Port ${port} is in use. Find the owner with:`);\n  console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n  process.exit(1);\n});\n\nconst shutdown = (signal) => {\n  console.log(`${signal} received, closing`);\n  server.close(() => process.exit(0));\n  // Keep-alive sockets hold the server open otherwise.\n  server.closeAllConnections?.();          // Node 18.2 and later\n  setTimeout(() => process.exit(1), 10_000).unref();\n};\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "Two details do most of the work there. `server.close()` stops accepting new connections but waits for the existing ones, so a single keep-alive socket from a browser tab can hold the process open indefinitely without `closeAllConnections` or that timeout. Handling `SIGTERM` as well as `SIGINT` is what makes the process behave under Docker, systemd and CI, all of which terminate rather than interrupt."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "In a container, check the CMD form",
      "x": "`CMD npm start` runs through a shell that may not forward signals, so your handler never fires and the container is killed after the stop timeout expires. Use the exec form, `CMD [\"node\", \"server.js\"]`, or add an init process with `docker run --init`. The same signal plumbing explains a good share of containers that [exit immediately](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "h2",
      "x": "The thirty-second routine"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Read the address, not just the port",
          "x": "`:::3000` and `127.0.0.1:3000` are different bindings with different likely causes. Note which one your error actually reports."
        },
        {
          "title": "List the listener, with sudo",
          "x": "An empty result from an unprivileged shell proves nothing at all.",
          "code": "sudo lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Identify the process before killing it",
          "x": "The command line tells you whether this is your own dev server or a service you depend on.",
          "code": "ps -p <pid> -o pid,ppid,user,command"
        },
        {
          "title": "SIGTERM, wait, verify",
          "x": "Give it two seconds, then re-run the listing. Escalate to `kill -9` only if the process ignored the polite request.",
          "code": "kill <pid> && sleep 2 && lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "If nothing owns it, change suspect",
          "x": "Docker port mappings, Windows excluded ranges, WSL2 host listeners and a privileged-port `EACCES` all look like a busy port, and none of them is one."
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is running on port 3000?",
          "a": "On Linux, `fuser -k 3000/tcp` does it in one step. Everywhere else, find the PID with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, or `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows, check the command line, then run `kill <pid>` or `Stop-Process -Id <pid>`. Look at what you are killing first, because the owner is sometimes a database or a proxy rather than your app."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends `SIGINT` to the foreground process group of your terminal. If the server was started through a wrapper such as `npm run dev`, or backgrounded, or launched by a file watcher, the process that actually holds the socket may not be in that group. It gets orphaned, keeps listening, and shows a parent PID of 1. Find it with `pgrep -af node`."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "For a local dev server, yes. For anything holding state, no, because `SIGKILL` cannot be caught and the process never runs its cleanup. Unflushed writes, lock files and open transactions are left behind. Send `SIGTERM` first and give it a couple of seconds."
        },
        {
          "q": "What does :::3000 mean in the error message?",
          "a": "It is the IPv6 wildcard address in compressed form, meaning the server tried to listen on every IPv6 interface. On a dual-stack system that binding usually covers IPv4 as well, which is why it can collide with a process that appears to be sitting on `0.0.0.0`."
        },
        {
          "q": "Can two processes listen on the same port at once?",
          "a": "Yes, in two situations. They can bind different addresses, for example one on `127.0.0.1` and another on a specific external interface. Or they can both set `SO_REUSEPORT`, a Linux feature that deliberately load-balances incoming connections across several listeners. Recent Node versions expose a `reusePort` listen option, so check the docs for the version you are running."
        },
        {
          "q": "Should I just change the port instead?",
          "a": "As a way to unblock yourself, yes, and there is no shame in `PORT=3001 npm run dev`. Just remember that you have not fixed anything. The old process is still running, still holding memory, and possibly still serving stale code to a browser tab you forgot about, which produces its own confusing half hour later on."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Signal handling and PID 1, the other half of the story when a container will not stay up.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this error: nothing is listening where you expected something to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "For when the server never gets as far as binding a port in the first place.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-23",
  "updated": "2026-09-23",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
