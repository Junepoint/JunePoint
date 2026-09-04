module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on Your Port",
  "h1": "Fixing EADDRINUSE: port already in use",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means a process is holding your port. Find it with lsof, ss or netstat, kill it safely, and stop crashes from leaving one behind.",
  "standfirst": "The port is not stuck. Something is still listening on it. Here is how to identify that process on each platform, and why a crash so often leaves one running.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Locate the process holding a port on macOS, Linux or Windows, kill it cleanly, and stop orphans coming back.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means a socket is already bound to that address and port. It is a process, not a stale cache and not a corrupted config file.",
        "One command finds it: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `ss -ltnp 'sport = :3000'` on Linux without lsof, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the usual culprit is an orphaned child process. Killing a watcher, a shell or a terminal tab does not reliably kill what it spawned.",
        "`127.0.0.1:3000` and `0.0.0.0:3000` collide, because the wildcard address covers the loopback interface too.",
        "If the port is below 1024 and you get `EACCES` rather than `EADDRINUSE`, that is a privileges problem and nobody else is on the port."
      ]
    },
    {
      "t": "h2",
      "x": "Read the address in the error before you run anything"
    },
    {
      "t": "p",
      "x": "Node prints the exact address it tried to bind, and that one detail rules out several wrong turns. Here is the shape of the failure, with stack line numbers trimmed because they move between Node versions."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net)\n    at listenInCluster (node:net)\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000"
    },
    {
      "t": "p",
      "x": "`address: '::'` is the IPv6 wildcard, which is what you get from `app.listen(3000)` with no host argument. On Linux that usually claims IPv4 as well, because `net.ipv6.bindv6only` defaults to 0. So a server you started on `localhost` and a server you started on all interfaces are competing for the same slot even though the two commands look different. `errno` is platform specific: `-98` on Linux, `-48` on macOS. The `syscall` field is the useful one. It says `listen`, so this is a server failing to take a port, not a client failing to reach one."
    },
    {
      "t": "h2",
      "x": "Find the process"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listening sockets only\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, when lsof is not installed\nss -ltnp 'sport = :3000'\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 51234\"\n\n# Windows, PowerShell\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Without it, `lsof -i:3000` also matches outbound connections whose remote port happens to be 3000, and the popular one-liner that pipes that straight into `kill -9` will happily take out a browser or an editor along with your server. Add the filter and you only see the process holding the port."
    },
    {
      "t": "p",
      "x": "Empty output plus a failing bind means one of three things. You are looking at the wrong port, the process belongs to another user and your unprivileged `lsof` cannot see it, or the port is reserved at a level above your process table. Rerun with `sudo` first. That resolves the second case immediately, and it is fast."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Check the name before you kill it",
      "x": "The `COMMAND` column is often just `node`, which tells you nothing. Run `ps -o pid,ppid,command -p <pid>` to get the full command line and the parent. The parent is usually the interesting part: a watcher, a `docker-proxy`, or PID 1, which means the real parent already died."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "kill 51234              # SIGTERM: shutdown handlers run\nkill -9 51234           # SIGKILL: only after SIGTERM did nothing\n\n# Linux shortcut, kills everything on the TCP port\nfuser -k 3000/tcp\n\n# safe pipeline, listening sockets only\nkill $(lsof -ti tcp:3000 -sTCP:LISTEN)\n\n# Windows\ntaskkill /PID 51234 /F"
    },
    {
      "t": "p",
      "x": "Start with plain `kill`. A well behaved server catches `SIGTERM`, closes its listener, finishes in-flight requests and exits, which also gives it a chance to remove lock files and shut down its own children. `SIGKILL` skips all of that. It is the right tool for a process that is genuinely wedged, and the wrong habit to build, because the orphaned children it leaves behind are one of the main reasons ports get stuck in the first place."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not paste a kill loop into a shared machine",
      "x": "`fuser -k` and `pkill -f node` are fine on your laptop. On a build agent or a shared box, `pkill -f node` matches every Node process owned by anyone whose command line contains that string, including agents running someone else's job. Target a PID."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port held"
    },
    {
      "t": "p",
      "x": "This is the part people find genuinely confusing. The process died, the terminal came back, and yet something is still bound. In almost every case a child process outlived its parent."
    },
    {
      "t": "p",
      "x": "Your dev command is rarely one process. `npm run dev` spawns a shell, the shell spawns a watcher such as nodemon or tsx, and the watcher spawns the actual server. Ctrl+C sends `SIGINT` to the foreground process group, which normally reaches all of them. But if any link in that chain was started detached, or double-forked, or crashed hard enough that it never got to signal its own children, the server survives. It gets reparented to PID 1, loses its controlling terminal, and keeps the listening socket open indefinitely. Nothing on screen tells you it is there."
    },
    {
      "t": "p",
      "x": "The second common cause is a shutdown handler that never finishes. `server.close()` stops accepting new connections, then waits for existing ones to end. A browser tab holding an idle keep-alive socket will keep that wait going far longer than you expect, so the process sits in a half-closed state, still owning the port, apparently hung. From Node 18.2 onwards there are two methods for exactly this."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(port);\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing`);\n  server.close(() => process.exit(0));\n  server.closeIdleConnections();   // Node 18.2+\n  // last resort if a request never finishes\n  setTimeout(() => process.exit(1), 5000).unref();\n}\n\nfor (const sig of ['SIGINT', 'SIGTERM']) {\n  process.on(sig, () => shutdown(sig));\n}\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`port ${port} is taken; run: lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});"
    },
    {
      "t": "p",
      "x": "`closeAllConnections()` is the harsher sibling of `closeIdleConnections()`, and it will cut off requests that are mid-flight. Use the idle version in development, and think carefully before using either in production behind a load balancer that has not yet been told to drain the instance. The `unref()` on the timer stops that fallback keeping the process alive on its own."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "Search this error and you will be told to wait sixty seconds for `TIME_WAIT` to clear. For a dev server on Linux or macOS, that advice is close to useless, and believing it wastes real time."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to closed connections, identified by a full four-tuple of local address, local port, remote address and remote port. It does not describe a listening socket. libuv, which Node uses underneath, sets `SO_REUSEADDR` on listening sockets on Unix platforms, and that flag exists precisely so a restarted server can rebind a port that still has connections lingering in `TIME_WAIT`. If waiting a minute appears to fix your problem, what actually happened is that the old process finally exited during that minute. The wait was a coincidence, and next time it will not work."
    },
    {
      "t": "p",
      "x": "Two caveats worth knowing. `SO_REUSEADDR` means something different on Windows, where it can let one process take a port from another, so the platforms do not behave alike and you should not carry assumptions across. And `SO_REUSEPORT` on Linux is a separate flag with a separate purpose: it lets several processes deliberately bind the same port and share incoming connections, which is how some servers do restarts without dropping traffic. Neither of these is what your crashed dev server hit."
    },
    {
      "t": "h2",
      "x": "Ports that were never yours to take"
    },
    {
      "t": "p",
      "x": "Sometimes nothing shows up under `lsof` because the conflict is not with a normal user process. These are the ones that cost people an afternoon."
    },
    {
      "t": "table",
      "head": [
        "Port",
        "Who is likely holding it",
        "How to confirm"
      ],
      "rows": [
        [
          "5000 and 7000 on macOS",
          "AirPlay Receiver, running inside ControlCenter. Present on recent macOS releases; check your own version.",
          "Look for `ControlCe` in `lsof` output. Turn AirPlay Receiver off in System Settings, or pick another port."
        ],
        [
          "Arbitrary ports on Windows",
          "Hyper-V, WSL2 or Docker reserve blocks of ports, so a bind fails with nothing listening.",
          "`netsh interface ipv4 show excludedportrange protocol=tcp` and see whether your port falls inside a listed range."
        ],
        [
          "Any mapped Docker port",
          "A running container, or a leftover `docker-proxy` process from one that did not shut down.",
          "`docker ps` first, then `lsof -nP -iTCP:8080 -sTCP:LISTEN` to catch a stale proxy."
        ],
        [
          "9229",
          "Another Node process started with `--inspect`. The clash is on the debugger port, not your app port.",
          "The message names 9229 rather than your server port."
        ],
        [
          "Below 1024",
          "Nobody. Binding a privileged port as a normal user fails with `EACCES`.",
          "The error code is `EACCES`, not `EADDRINUSE`."
        ]
      ],
      "caption": "Conflicts that do not look like a normal process holding a port."
    },
    {
      "t": "p",
      "x": "The Windows reserved-range case is the meanest of these, because the port genuinely is unavailable and genuinely has no owner you can kill. The reserved blocks are chosen dynamically, so a machine that worked yesterday can fail today after a reboot. If your port sits inside an excluded range, either move your app or reserve the port explicitly before the range gets allocated."
    },
    {
      "t": "h2",
      "x": "The same failure in other stacks"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Python (errno 98 on Linux, 48 on macOS)\nOSError: [Errno 98] Address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker, wording varies by version\nBind for 0.0.0.0:8080 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Everything above applies unchanged, because all of these are the same `bind()` failure surfaced by different runtimes. The Docker one has an extra wrinkle: the conflict may be with another container rather than a host process, so check `docker ps --format '{{.Names}}\\t{{.Ports}}'` before you go hunting on the host. A container that keeps restarting can also grab and release a port in a loop, which makes the conflict look intermittent. If that is what you are seeing, the restart itself is the bug to fix."
    },
    {
      "t": "h2",
      "x": "Making it stop happening"
    },
    {
      "t": "ol",
      "items": [
        "Handle `SIGTERM` and `SIGINT` in every long-running process you write, and make the handler exit even if a connection refuses to close.",
        "Let tests pick their own port. `server.listen(0)` binds an unused ephemeral port, and `server.address().port` tells you which one, so parallel test runs stop fighting each other.",
        "Print a useful message on `EADDRINUSE` instead of a stack trace. Future you will paste the suggested `lsof` command straight out of the log.",
        "Prefer one process manager over ad hoc background jobs. Something that tracks its own process group will clean up children reliably; a bare `&` will not.",
        "When you do have to force-kill, kill the process group rather than the leaf: `kill -TERM -<pgid>` on Unix, where the leading minus means the group."
      ]
    },
    {
      "t": "p",
      "x": "None of this is exotic. It is roughly fifteen lines of boilerplate that turns a recurring five-minute interruption into a non-event, and the same handler is what lets your container shut down cleanly under an orchestrator later. That is the real argument for writing it early."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the container that was holding your port keeps dying and restarting.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite failure: nothing is listening where you expected something to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Another Node error whose message contains the answer if you read it closely.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find what is using port 3000?",
          "a": "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `ss -ltnp 'sport = :3000'` on Linux without lsof, `netstat -ano | findstr :3000` on Windows. If the output is empty but the bind still fails, rerun with `sudo`, since an unprivileged lsof will not show sockets owned by other users."
        },
        {
          "q": "Is it safe to kill -9 the process on a port?",
          "a": "It is safe for the machine, but it skips the process's own cleanup. Shutdown handlers do not run, lock files and temp directories stay behind, and any children it spawned are orphaned rather than stopped. Send a plain `kill` first and give it a couple of seconds. Reach for `-9` only when that does nothing."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group. If your server was started by a watcher or a shell wrapper and ended up detached from that group, it survives, gets reparented to PID 1 and keeps the socket. Look at the parent PID of whatever `lsof` reports: a parent of 1 confirms it."
        },
        {
          "q": "Do I have to wait for TIME_WAIT to expire before restarting?",
          "a": "Usually not. TIME_WAIT describes closed connections, not listening sockets, and libuv sets `SO_REUSEADDR` on Unix so a server can rebind straight away. If waiting seemed to help, the old process most likely just finished exiting during the wait."
        },
        {
          "q": "Why does port 5000 fail on my Mac with nothing running?",
          "a": "AirPlay Receiver binds 5000 and 7000 on recent macOS versions, from inside the ControlCenter process. Turn AirPlay Receiver off in System Settings or move your app to another port. Check the setting on your own macOS version rather than assuming, since Apple has moved these controls between releases."
        },
        {
          "q": "Can two processes listen on the same port on purpose?",
          "a": "Yes, on Linux, if both set `SO_REUSEPORT` before binding. The kernel then distributes incoming connections between them. It is used for zero-downtime restarts and multi-process servers, but both sides have to opt in, so it will not explain an accidental conflict."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-04",
  "updated": "2026-09-04",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
