module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Busy Port",
  "h1": "Port already in use: find the owner, then free it",
  "eyebrow": "Troubleshooting",
  "description": "Identify which process holds a busy TCP port on Linux, macOS and Windows, stop it safely, and understand why a crashed server keeps its port.",
  "standfirst": "The error is the kernel refusing a bind call, nothing more. Find what owns the address, confirm it with a listing command, then stop it in the order that does least damage.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Locate the process holding a TCP port, stop it without using kill -9 first, and fix the orphaned child that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Find the owner before you kill anything: `sudo ss -ltnp 'sport = :3000'` on Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash, the usual holder is a surviving child process that inherited the listening socket. Killing the parent does not release a file descriptor the child still has open.",
        "If no listener shows up and `bind()` still fails, list every socket on the port. Connections in `TIME_WAIT` reserve the local port for roughly a minute unless the listener sets `SO_REUSEADDR`.",
        "`kill -9` is the escalation, not the opener. It skips shutdown handlers, which is how a dev database ends up needing recovery.",
        "A zombie process holds no sockets at all. Any answer telling you to kill a zombie to free a port is describing something that cannot happen."
      ]
    },
    {
      "t": "h2",
      "x": "What the error is actually telling you"
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` comes from the operating system, not from your framework. Your process asked to bind an address and port pair, and the kernel said no, because another socket already owns that pair. There is no lock file to delete and no cache to clear. So every fix has the same shape: identify the owner, then decide whether it deserves to keep the port."
    },
    {
      "t": "p",
      "x": "Read the address part of the message, not just the port number. `127.0.0.1:3000`, `0.0.0.0:3000` and `:::3000` are three different bind requests. They still collide with each other, because the wildcard addresses include loopback. On Linux, `:::3000` is the IPv6 wildcard and normally accepts IPv4 traffic too, through mapped addresses. This matters while you hunt: searching your process list for `127.0.0.1` will quietly miss a server bound to the wildcard."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Message",
        "Worth knowing"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "The `:::3000` is the IPv6 wildcard, so the conflict can be with a process you found under `0.0.0.0`."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 is Linux. macOS reports errno 48 for the same condition. The number is the OS error code."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "`net.Listen` already sets `SO_REUSEADDR` on Unix, so a `TIME_WAIT` backlog is rarely the cause here."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "The stack trace points at your bind call, which tells you nothing about the other process. Go to the shell."
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Frequently two server blocks with the same `listen` directive, or an old master process that never exited."
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "This one is from the daemon, before your container starts. The prefix varies between versions."
        ]
      ],
      "caption": "The wording differs, the kernel condition does not."
    },
    {
      "t": "h2",
      "x": "Find the owner"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: the listener on port 3000, with its PID\nss -ltnp 'sport = :3000'\nsudo ss -ltnp 'sport = :3000'      # you need root to see other users' PIDs\n\n# Linux: every socket on the port, in any state\nss -tanp 'sport = :3000 or dport = :3000'\n\n# macOS (and Linux, where lsof is installed)\nlsof -nP -iTCP:3000 -sTCP:LISTEN\nlsof -nP -i:3000                   # includes established connections\n\n# Just the PIDs, for scripting\nlsof -ti:3000\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\"\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess\nGet-Process -Id 12345 | Format-List Name, Path, StartTime"
    },
    {
      "t": "p",
      "x": "On Linux, prefer `ss`. The flags are worth memorizing: `-l` listening sockets, `-t` TCP, `-n` numeric ports, `-p` owning process. Run it without `sudo` and you will see the socket but a blank process field when it belongs to another user, which is a trap. An empty-looking result from an unprivileged shell is not evidence of a free port."
    },
    {
      "t": "p",
      "x": "`lsof -i:3000` is broader than people expect. It lists any socket whose local or remote port is 3000, so a browser that happened to pick 3000 as an ephemeral source port will appear alongside your server. That is why the `-sTCP:LISTEN` filter is in the command above. Kill from the unfiltered list and you can take out something unrelated."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Get the full command line before you decide",
      "x": "A PID alone rarely tells you whether the process matters. `ps -o pid,ppid,user,etime,args -p 12345` gives you the parent, the user, how long it has been running and the full argument list. The parent PID is the useful part: it usually reveals whether you are looking at a stray worker, a supervisor, or a shell you forgot about in another tmux pane."
    },
    {
      "t": "h2",
      "x": "Stop it, in the order that does least harm"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the identity, not just the port",
          "x": "Check the command line and the user. If it is `postgres`, `docker-proxy`, `systemd` or anything you did not start, stop and read the next section before signalling it.",
          "code": "ps -o pid,ppid,user,etime,args -p $(lsof -ti:3000)"
        },
        {
          "title": "Ask it to shut down",
          "x": "Plain `kill` sends `SIGTERM`, which well-behaved servers catch so they can close connections, flush writes and remove sockets. This is the request that lets your app clean up after itself.",
          "code": "kill 12345\n# Windows\ntaskkill /PID 12345"
        },
        {
          "title": "Check whether it worked",
          "x": "Give it a second, then look again. Most processes exit immediately. A database or a job runner may legitimately take longer while it finishes work in flight.",
          "code": "sleep 1; ss -ltnp 'sport = :3000'"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught, so nothing gets cleaned up: no flush, no socket removal, no lock release. Fine for a hung dev server. A poor habit to build around a stateful service.",
          "code": "kill -9 12345\n# Windows\ntaskkill /PID 12345 /F"
        },
        {
          "title": "If it reappears, find whatever is restarting it",
          "x": "A port that is busy again within seconds means something is supervising the process. Check the usual suspects rather than killing it repeatedly.",
          "code": "systemctl status myapp\ndocker ps --filter publish=3000\npm2 list\nlaunchctl list | grep -i myapp"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port held"
    },
    {
      "t": "p",
      "x": "This is the part that feels like a mystery and is not. Two distinct things cause it, and the diagnostic in the previous section tells you which one you have."
    },
    {
      "t": "h3",
      "x": "Cause one: the process never actually died"
    },
    {
      "t": "p",
      "x": "An exception in your request handler is not the death of a process tree. A listening socket is a file descriptor, and file descriptors survive `fork()`. Any child that inherited the listener keeps the port bound for as long as it lives, whatever happened to its parent. Close the terminal, kill the wrapper, watch the crash scroll past, and a worker can still be sitting there holding port 3000 with nothing to show for it."
    },
    {
      "t": "ul",
      "items": [
        "**Watchers and wrappers.** `nodemon`, `concurrently`, `npm run dev` and `uvicorn --reload` all run your server as a child. Interrupting the wrapper does not guarantee the child got a signal.",
        "**Cluster and worker pools.** Node's `cluster`, Gunicorn and similar pre-fork models share one listening socket across many processes. One surviving worker is enough.",
        "**Hidden terminals.** A detached tmux window, a VS Code debug session, a split pane scrolled off screen. Check `ps -o ppid= -p <pid>` and follow the parent chain upward.",
        "**Debuggers holding the process.** A paused process at a breakpoint still owns its sockets. It looks dead and is not.",
        "**Orphans reparented to init.** When the parent dies first, the child's PPID becomes 1. It shows up in no job list, which is exactly why it gets missed."
      ]
    },
    {
      "t": "h3",
      "x": "Cause two: nothing is listening and bind still fails"
    },
    {
      "t": "p",
      "x": "If `ss -ltnp` shows no listener, widen the query to every state. You will often find a pile of sockets in `TIME_WAIT` whose local port is the one you want."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# No listener, but sockets still reserve the local port\nss -tan 'sport = :3000'\n\n# State  Recv-Q Send-Q   Local Address:Port    Peer Address:Port\n# TIME-WAIT   0      0      127.0.0.1:3000        127.0.0.1:54312\n# TIME-WAIT   0      0      127.0.0.1:3000        127.0.0.1:54314\n\n# Count them by state when there are hundreds\nss -tan 'sport = :3000' | awk 'NR>1 {print $1}' | sort | uniq -c"
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` is TCP doing its job. The side that closes first keeps the connection's four-tuple reserved for twice the maximum segment lifetime, so a delayed duplicate packet cannot be delivered to a new connection that reuses the same ports. On Linux this is a fixed 60 seconds and is not tunable through `sysctl`. While those sockets exist, a plain `bind()` to that local port is rejected."
    },
    {
      "t": "p",
      "x": "The escape hatch is the `SO_REUSEADDR` socket option, which tells the kernel to permit the bind despite lingering `TIME_WAIT` sockets. Node, Go and nginx set it for you on Unix, which is why a crashed Express server usually restarts fine. A hand-rolled Python socket does not set it, which is why the tutorial script you wrote at 2am fails for a minute after every crash. One line fixes that."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\nsrv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsrv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   # before bind, not after\nsrv.bind((\"127.0.0.1\", 3000))\nsrv.listen(128)\n\n# socketserver and http.server already do this via allow_reuse_address = True"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "SO_REUSEADDR means something else on Windows",
      "x": "On Windows, `SO_REUSEADDR` historically allows a second socket to bind an address that is actively in use, letting one process hijack another's port. That is why Windows code reaches for `SO_EXCLUSIVEADDRUSE` instead. Do not copy a Unix socket-options block into a Windows service and assume the behaviour transfers."
    },
    {
      "t": "p",
      "x": "There is a third variant worth naming: sockets stuck in `CLOSE_WAIT`. Those are not the kernel's doing. `CLOSE_WAIT` means the peer closed and your application never called `close()` on its end, so it points at a file descriptor leak in code that is still running. Restarting clears the symptom. The leak stays."
    },
    {
      "t": "h2",
      "x": "Holders that are not your application"
    },
    {
      "t": "ul",
      "items": [
        "**Docker.** A published port is held by the daemon's `docker-proxy`, or by the host network namespace, not by your app. `docker ps --filter publish=3000` finds the container. A `restart: always` policy will keep reclaiming the port no matter how often you kill the proxy.",
        "**systemd socket activation.** If `ss -ltnp` names `systemd` as the owner, the socket unit holds the port and starts your service on demand. Stop `myapp.socket`, not just `myapp.service`.",
        "**Port forwards and tunnels.** An abandoned `kubectl port-forward` or `ssh -L 3000:...` is a listener like any other, and it is easy to forget because it produces no output.",
        "**macOS AirPlay Receiver.** On recent macOS versions, AirPlay Receiver listens on ports 5000 and 7000, owned by `ControlCenter`. Turning it off in System Settings under General, then AirDrop and Handoff, frees them. Check the setting path against your own version, since Apple moves it between releases.",
        "**Windows reserved ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ephemeral ports, and a bind inside a reserved range fails with nothing listening to find. Run `netsh interface ipv4 show excludedportrange protocol=tcp` as administrator to see the blocks."
      ]
    },
    {
      "t": "p",
      "x": "The Windows case is the most confusing of these, because every diagnostic you run comes back clean. No listener, no connections, no container, and the bind still fails. The exclusion list is the only place that shows why."
    },
    {
      "t": "h2",
      "x": "Advice that does not help, and some that hurts"
    },
    {
      "t": "ul",
      "items": [
        "**\"Kill the zombie process holding the port.\"** Wrong, and it sends people on long hunts. A zombie is an already-exited process whose exit status has not been reaped. The kernel closed all of its descriptors when it exited, so it holds no sockets. What you are looking for is an orphan, which is alive.",
        "**`sysctl -w net.ipv4.tcp_tw_recycle=1`.** This option was removed in Linux 4.12 and broke connections from clients behind NAT while it existed. `tcp_tw_reuse` is a different setting that applies to outgoing connections and will not make your `bind()` succeed. Neither one is the answer to this error.",
        "**`fuser -k 3000/tcp` as a reflex.** It kills by port rather than by identity. On your laptop that is a shortcut. On a shared or production host it is a way to signal a process you did not intend to touch.",
        "**Disabling the firewall.** Firewalls drop or reject traffic. They do not cause bind failures. This changes nothing except your security posture.",
        "**Rebooting.** It works, which is the problem: you learn nothing, and the orphaned worker that caused it will be back tomorrow.",
        "**Just picking another port.** Reasonable as a stopgap, and genuinely right when you want two instances side by side. But if the old process is still alive and still writing to your development database, moving your own port leaves a second writer running unnoticed."
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "The copy-paste one-liner, with its caveat",
      "x": "`kill -9 $(lsof -ti:3000)` is everywhere, and it will usually do what you want on a dev machine. Two things to keep in mind. `lsof -ti` without a state filter can return the PIDs of clients using 3000 as a source port, and `-9` denies the process any chance to clean up. On anything you care about, use `lsof -ti:3000 -sTCP:LISTEN`, send a plain `kill` first, and escalate only if needed."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Most repeat offenders are servers with no shutdown path. Handle the signals, close the listener, and put a hard deadline on the whole thing so a stuck connection cannot keep the port forever."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(3000);\n\nlet closing = false;\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => {\n    if (closing) process.exit(1);     // second Ctrl-C means now\n    closing = true;\n\n    server.close(() => process.exit(0));\n\n    // Keep-alive sockets will happily outlive server.close().\n    // closeAllConnections() needs Node 18.2 or newer.\n    server.closeAllConnections?.();\n\n    setTimeout(() => process.exit(1), 10_000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "The `unref()` on that timer matters. Without it the timeout itself keeps the event loop alive for the full ten seconds even when the server closed cleanly in milliseconds, and your shutdown feels broken."
    },
    {
      "t": "p",
      "x": "For tests, stop hard-coding ports altogether. Bind to port 0 and the kernel assigns a free one, which removes the whole class of failure from your suite and lets tests run in parallel."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  baseUrl = `http://127.0.0.1:${port}`;\n});\n\n// After each test file, close it and wait for the callback\nafter((done) => server.close(done));"
    },
    {
      "t": "ul",
      "items": [
        "Bind development servers to `127.0.0.1` rather than `0.0.0.0`. It narrows the collision surface and keeps your half-built API off the coffee shop network.",
        "In Docker, `docker run -P` lets the daemon choose host ports, and `-p 127.0.0.1:3000:3000` at least keeps the published port local.",
        "Use a process manager that tracks the whole process group, so stopping the parent stops the children too.",
        "When a dev server will not die, kill the group rather than the process: `kill -TERM -<pgid>`, with the negative sign and the process group ID from `ps -o pgid= -p <pid>`."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On Linux and macOS: lsof -ti:3000 -sTCP:LISTEN to get the PID, then kill <pid>, and kill -9 <pid> only if it survives. On Windows: netstat -ano | findstr :3000 for the PID, then taskkill /PID <pid>, adding /F if it refuses. Check the command line with ps or tasklist first, because the port you want might be held by a database or a Docker proxy rather than your app."
        },
        {
          "q": "Why does it say the port is in use when nothing is listening?",
          "a": "Three common reasons. Sockets left in TIME_WAIT reserve the local port for about 60 seconds unless your listener sets SO_REUSEADDR. You checked without sudo, so the owning process was hidden. Or, on Windows, the port falls inside a range reserved by Hyper-V or WSL2, which you can list with netsh interface ipv4 show excludedportrange protocol=tcp."
        },
        {
          "q": "How long does a port stay busy after a crash?",
          "a": "If a live process holds it, indefinitely, until that process exits. If the holder is TIME_WAIT sockets, 60 seconds on Linux, and that value is compiled in rather than tunable through sysctl. A port that is still busy after a couple of minutes means a process is holding it, so go back to ss or lsof."
        },
        {
          "q": "Is it safe to use kill -9 on my development server?",
          "a": "Usually, but make it the second attempt. SIGKILL cannot be caught, so nothing flushes buffers, closes connections or removes socket files. For a stateless HTTP server that costs you nothing. For Postgres, Redis with an unsaved snapshot, or anything mid-write, you can create work for yourself recovering state."
        },
        {
          "q": "Why do I get address already in use on macOS port 5000?",
          "a": "AirPlay Receiver listens on 5000 and 7000 on recent macOS versions, owned by the ControlCenter process. Confirm it with lsof -nP -iTCP:5000 -sTCP:LISTEN, then either disable AirPlay Receiver in System Settings or move your app to another port. The setting has moved between macOS releases, so check its current location for your version."
        },
        {
          "q": "Does EADDRINUSE mean my application crashed?",
          "a": "No. It means a second instance tried to start while the first still held the port. The common sequence is that your code threw, a supervisor restarted it, and a worker from the previous generation never exited. Look for a process whose parent PID is 1 or is a watcher like nodemon."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on a port?",
          "a": "EADDRINUSE means someone else owns the address and port. EACCES means you are not permitted to bind it, which on Unix usually means a port below 1024 without the CAP_NET_BIND_SERVICE capability or root. They need completely different fixes, so read the error code rather than the prose."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and reading logs from a container that will not stay up.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Check the process, the listening address and pg_hba.conf in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnose and fix CORS errors",
          "desc": "The other error that looks like a network problem and is not.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-06",
  "updated": "2026-10-06",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
