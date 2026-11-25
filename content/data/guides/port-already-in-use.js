module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find the Process Holding Your Port",
  "h1": "Port already in use: find the owner, then free it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something already holds the address. How to find it on Linux, macOS and Windows, stop it safely, and keep a crash from leaving one behind.",
  "standfirst": "The commands that identify who owns a port on each platform, why a crashed server so often leaves one behind, and the shutdown path that stops it happening again.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port",
    "find process using port"
  ],
  "cardDesc": "Identify the process holding a port, stop it safely, and fix the shutdown path that leaves it behind.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means something already holds the address you asked for. Usually that something is a live process you can see.",
        "Identify it before killing anything: `ss -ltnp 'sport = :3000'` on Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` first. Starting with `kill -9` skips your cleanup code and can orphan child processes that still hold the socket.",
        "After a crash the usual owner is a surviving child process, a debugger on port 9229, or a container you forgot was running. `TIME_WAIT` is rarely the cause in Node.",
        "If nothing is listening and the bind still fails, suspect a reserved port range or a mismatch between the address you bound and the one already bound."
      ]
    },
    {
      "t": "h2",
      "x": "The same error, five dialects"
    },
    {
      "t": "p",
      "x": "Every runtime reports the same condition with different wrapping. Recognizing yours saves a search."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node (the first line; stack frames follow)\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker, when publishing a port\nBind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Underneath all of them is the POSIX error `EADDRINUSE`, which is errno 98 on Linux and 48 on macOS and the BSDs. The part worth reading slowly is the address. In Node, `:::3000` is the IPv6 wildcard, `0.0.0.0:3000` is the IPv4 wildcard, and `127.0.0.1:3000` is loopback only. Those are three different requests, and they fail for different reasons. Keep the exact string from your own error visible while you work, because it is the only part of the message that is specific to you."
    },
    {
      "t": "h2",
      "x": "Find the process before you kill anything"
    },
    {
      "t": "p",
      "x": "The kernel already knows who holds the port. Ask it, rather than guessing from the name of the project you were working on."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "List the listening socket",
          "x": "On Linux, `ss` ships with iproute2 and is quicker than `lsof`. The `-p` flag shows the owning process, but only for processes your own user owns. A listening socket with an empty process column means you need to ask again with elevated privileges, which is also the clue that a root service or a container runtime is holding it.",
          "code": "ss -ltnp 'sport = :3000'\nsudo ss -ltnp 'sport = :3000'"
        },
        {
          "title": "On macOS, filter lsof down to listeners",
          "x": "`lsof -i :3000` lists outbound connections to port 3000 as well as listeners, so an open browser tab shows up and sends people chasing the wrong PID. The state filter removes that noise. `-n` skips DNS lookups and `-P` skips service-name lookups, which makes the output both faster and easier to read.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Check that the PID is the server, not a wrapper",
          "x": "`npm run dev` sits between your shell and the server, and so do `yarn`, `pnpm`, `concurrently` and `nodemon`. Killing the wrapper does not always kill what it started. Look at the parent chain and the process group before you act.",
          "code": "ps -o pid,ppid,pgid,command -p 48213\npstree -p 48213"
        },
        {
          "title": "Check containers separately",
          "x": "A published Docker port is held on the host by the daemon's proxy, so host tooling points at `docker-proxy` or `dockerd` instead of at anything you recognize. Query the daemon directly and the answer is immediate.",
          "code": "docker ps --filter publish=3000\ndocker compose ls"
        },
        {
          "title": "On Windows, resolve the PID to a name",
          "x": "`netstat` gives you a number and nothing else, so it always takes two commands. PowerShell can do it in one pipeline if you prefer.",
          "code": "netstat -ano | findstr :3000\ntasklist /FI \"PID eq 48213\"\n\n# PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object -ExpandProperty OwningProcess |\n  ForEach-Object { Get-Process -Id $_ }"
        }
      ]
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "List the listener",
        "Identify the process",
        "Stop it"
      ],
      "rows": [
        [
          "Linux",
          "`ss -ltnp 'sport = :3000'`",
          "`ps -p <pid> -o command=`",
          "`kill <pid>`"
        ],
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`ps -p <pid> -o command=`",
          "`kill <pid>`"
        ],
        [
          "Windows, cmd",
          "`netstat -ano | findstr :3000`",
          "`tasklist /FI \"PID eq <pid>\"`",
          "`taskkill /PID <pid> /F`"
        ],
        [
          "Windows, PowerShell",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`",
          "`Get-Process -Id <pid>`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Docker",
          "`docker ps --filter publish=3000`",
          "`docker inspect <id>`",
          "`docker stop <id>`"
        ]
      ],
      "caption": "One question in four syntaxes. The identification column is the one people skip, and it is the one that tells you whether this will happen again in ten minutes."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# 1. Ask politely. SIGTERM gives the process a chance to run its handler.\nkill 48213\n\n# 2. Check whether it actually went away.\nss -ltnp 'sport = :3000'\n\n# 3. Only now escalate. SIGKILL cannot be caught or ignored.\nkill -9 48213\n\n# Shortcut, once you are sure the port is yours\nkill $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Kill the whole process group, children included\nps -o pgid= -p 48213      # prints the group id, e.g. 48210\nkill -TERM -48210         # note the leading minus"
    },
    {
      "t": "p",
      "x": "A listening socket is a file descriptor, and `fork` copies descriptors. If your server spawned a worker, a build watcher or a child shell before it died, that child holds a reference to the same socket, and the address stays bound until the last holder exits. This is why a port can be occupied by a process whose name has nothing to do with your server, and why killing the obvious PID sometimes changes nothing at all."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Three habits that cause the next EADDRINUSE",
      "x": "`killall -9 node` also kills your editor's language server, any unrelated dev server, and the watcher that would have cleaned up after itself. Reaching for `kill -9` first skips every shutdown handler and orphans children that inherited the listening descriptor. And simply moving to another port leaves the stray process running, so you accumulate them, one per debugging session. Changing the port also changes the origin, which can hand you a [CORS failure](/guides/fix-cors-errors/) on top of the problem you started with."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port busy"
    },
    {
      "t": "h3",
      "x": "The parent died and the children did not"
    },
    {
      "t": "p",
      "x": "This is the common case by a wide margin. A server that crashes with an uncaught exception, or that gets killed outright from a terminal, never reaches the code that would have shut its children down. Those children are reparented and keep running, still holding the inherited socket. `pstree` and the `pgid` column from `ps` are how you see the whole family rather than one member of it."
    },
    {
      "t": "h3",
      "x": "The watcher sent a signal your code swallowed"
    },
    {
      "t": "p",
      "x": "`nodemon` sends `SIGUSR2` to your process when it restarts, rather than `SIGTERM`. If your app installs a `SIGUSR2` handler that logs something and returns without closing the server and exiting, you have overridden the default behavior of terminating. The old process survives the restart, keeps the port, and the new one fails to bind. Any trap that returns instead of exiting produces the same shape of bug, in any language."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is usually not your problem"
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to closed connections, not to the listening socket, and on Linux it holds the local end of that connection for a fixed 60 seconds. Without `SO_REUSEADDR`, a new listener on the same port is refused while any of those linger. Node and libuv set `SO_REUSEADDR` on listening sockets by default, which is why a Node server that exits cleanly can be restarted instantly. Python is where this actually bites. `socketserver.TCPServer` defines `allow_reuse_address = False`, while `http.server.HTTPServer` overrides it to 1, so two superficially similar servers behave differently."
    },
    {
      "t": "p",
      "x": "There is a quick test that separates the two causes. An `EADDRINUSE` that clears on its own within about a minute, with nothing showing in `ss -ltnp`, is lingering connection state. One that never clears is a live process, and no amount of waiting will help."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not enable tcp_tw_recycle",
      "x": "The advice to set `net.ipv4.tcp_tw_recycle=1` still circulates in answers about ports stuck in `TIME_WAIT`. It silently dropped connections from clients behind NAT, because it tracked timestamps per host rather than per connection, and it was removed from the Linux kernel in version 4.12. On any current kernel the sysctl does not exist. If you need faster reuse of a listening port, `SO_REUSEADDR` is the supported answer, and it is a one-line change in your own code."
    },
    {
      "t": "h3",
      "x": "A debugger is still attached"
    },
    {
      "t": "p",
      "x": "`node --inspect` binds the inspector on port 9229 in addition to whatever your app listens on. If an editor is attached, the process stays alive and both ports stay bound, which looks exactly like a crash that failed to clean up. `--inspect-brk` is more confusing still, since the process is alive and paused before your first line of code, so your server has not started and the inspector port is taken anyway. Detach the debugger, then recheck."
    },
    {
      "t": "h3",
      "x": "Docker still has the mapping"
    },
    {
      "t": "p",
      "x": "A stopped container releases its published ports. A running one you forgot about does not, and that is nearly always what happened: a compose project in another terminal tab, or a stack left up from yesterday. `docker ps --filter publish=3000` answers it in one line. The genuinely rare case is a leaked `docker-proxy` process left behind after a daemon crash, where restarting the Docker daemon is the cleanest fix. Our guide on [containers that exit immediately](/guides/docker-container-exits-immediately/) covers the opposite failure, where the port is free because nothing ever stayed up."
    },
    {
      "t": "h2",
      "x": "Nothing is listening and the bind still fails"
    },
    {
      "t": "p",
      "x": "Now the diagnosis flips. If `ss -ltnp` or `lsof` comes back empty, run both as root once to rule out a process you cannot see, then work through this list."
    },
    {
      "t": "ul",
      "items": [
        "**Address mismatch.** An existing socket on `0.0.0.0:3000` conflicts with a new one on `127.0.0.1:3000`, because the wildcard already covers loopback. Two listeners on `127.0.0.1:3000` and `192.168.1.20:3000` coexist happily. Compare the address in your error against the address in the socket list, not just the port.",
        "**IPv4 against IPv6.** On Linux with `net.ipv6.bindv6only=0`, a listener on `:::3000` accepts IPv4 traffic too, so a check that only looks at IPv4 can come back clear while the port is taken. Run `ss -ltn` with no filter and read both families.",
        "**Reserved ranges on Windows.** Hyper-V, WSL2 and Docker Desktop reserve blocks of TCP ports, and a port inside a reserved block refuses to bind with nothing listening on it. Run `netsh interface ipv4 show excludedportrange protocol=tcp` from an elevated prompt. Moving the dynamic range is possible with `netsh int ipv4 set dynamicport tcp`, and the exclusions are recalculated after a restart, so verify before and after rather than assuming it worked.",
        "**AirPlay on macOS.** Ports 5000 and 7000 are claimed by AirPlay Receiver on recent macOS versions, which is why a tutorial that tells you to use port 5000 fails on a Mac and works everywhere else. Turn the receiver off under System Settings, General, AirDrop & Handoff, or pick a different port.",
        "**Privileged ports.** Below 1024 you get `EACCES`, not `EADDRINUSE`. Different error, different fix: grant the capability, put a reverse proxy in front, or listen high and redirect.",
        "**systemd socket activation.** If a `.socket` unit owns the port, systemd binds it before your service ever starts. `systemctl list-sockets` shows the mapping."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it from recurring"
    },
    {
      "t": "p",
      "x": "The durable fix is a shutdown path that both runs and finishes, plus an error message that tells the next person what to do."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const http = require('node:http');\n\nconst PORT = Number(process.env.PORT) || 3000;\nconst server = http.createServer(app);   // app is your request handler\n\n// Fail with something actionable instead of a bare stack trace\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${PORT} is in use. Find the owner with:`);\n    console.error(`  lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nlet shuttingDown = false;\n\nfunction shutdown() {\n  if (shuttingDown) return;   // a second Ctrl-C must not re-enter this\n  shuttingDown = true;\n\n  server.close(() => process.exit(0));\n\n  // close() waits for in-flight requests AND idle keep-alive sockets.\n  // Added in Node 18.2.0; the guard keeps older versions working.\n  if (server.closeIdleConnections) server.closeIdleConnections();\n\n  // Insurance. The port stays bound for as long as shutdown hangs.\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\n// SIGUSR2 is what nodemon sends on restart\nfor (const signal of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {\n  process.on(signal, shutdown);\n}\n\nserver.listen(PORT);"
    },
    {
      "t": "p",
      "x": "Three details there matter more than the rest. `server.close()` stops accepting new connections but waits for existing sockets to finish, and an idle keep-alive socket counts as existing, so a single open browser tab can keep a server from exiting; `closeIdleConnections()` was added in Node 18.2.0 for exactly that case, and `closeAllConnections()` is the blunter sibling. The timeout exists because a shutdown that hangs holds the port just as firmly as a crash does. And `SIGKILL` cannot be handled at all, so none of this code runs when a container runtime loses patience after its grace period and escalates."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "In tests, bind port 0",
      "x": "Passing `server.listen(0)` asks the kernel for any free ephemeral port, and `server.address().port` tells you which one it chose. Parallel test runners stop colliding with each other, and CI stops failing because an earlier job left a listener on the port you hard-coded. It is a smaller change than it sounds, since most test helpers already pass the resolved address through to the client."
    },
    {
      "t": "p",
      "x": "If you want a blunt instrument in `package.json`, at least make it narrow. `pkill -f 'node .*server\\.js' || true` targets a command line rather than every Node process on the machine, and the `|| true` keeps the script from failing when there is nothing to kill. Put it in a `predev` script so it runs before the server starts. Keep it out of CI, where killing processes by pattern is a good way to take down the runner itself."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The mirror image of this problem: the port is free because nothing stayed up.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Postgres connection refused",
          "desc": "Refused rather than in use. Same layered diagnosis, opposite symptom.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnosing CORS errors",
          "desc": "Because moving to a different port changes the origin.",
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
          "a": "Find the PID first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `ss -ltnp 'sport = :3000'` on Linux. Then `kill <pid>`, and only `kill -9 <pid>` if it ignores you. On Windows, `netstat -ano | findstr :3000` gives the PID and `taskkill /PID <pid> /F` ends it. The combined form `kill $(lsof -t -iTCP:3000 -sTCP:LISTEN)` is fine once you have confirmed the owner is yours."
        },
        {
          "q": "What does EADDRINUSE actually mean?",
          "a": "The bind call failed because another socket already holds that combination of address and port. It is errno 98 on Linux and 48 on macOS. It describes the whole address rather than just the port number, so an existing wildcard listener on `0.0.0.0` can block a bind to `127.0.0.1` on the same port."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl-C?",
          "a": "Ctrl-C sends `SIGINT` to the foreground process group. If your server traps it without exiting, or if a child was started in a different group, something survives and keeps the socket. Check `pstree` and the `pgid` column from `ps`, then signal the whole group with `kill -TERM -<pgid>`."
        },
        {
          "q": "Is it safe to run killall -9 node?",
          "a": "It works, and it is indiscriminate. It also kills editor language servers, unrelated dev servers, and any watcher that would have cleaned up properly, and it gives none of them a chance to flush state to disk. Target the specific PID, or at minimum match the command line with `pkill -f`."
        },
        {
          "q": "How long does TIME_WAIT keep a port unusable?",
          "a": "On Linux the duration is fixed at 60 seconds and is not adjustable with a sysctl. It only blocks a new bind when the listener does not set `SO_REUSEADDR`. Node sets that option by default, so this is mostly a Python, C or Go question rather than a Node one. If the error clears by itself after about a minute, that was the cause."
        },
        {
          "q": "Why does port 5000 fail on my Mac when nothing is running?",
          "a": "AirPlay Receiver claims ports 5000 and 7000 on recent macOS versions. Disable it under System Settings, General, AirDrop & Handoff, or choose another port. Confirm with `lsof -nP -iTCP:5000 -sTCP:LISTEN`, which will name the system process holding it."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-25",
  "updated": "2026-11-25",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
