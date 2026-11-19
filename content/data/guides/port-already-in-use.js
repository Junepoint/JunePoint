module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is in Use",
  "h1": "Port already in use: finding the owner and freeing the port",
  "eyebrow": "Troubleshooting",
  "description": "Port already in use? Find the process that owns it on Linux, macOS or Windows, end it safely, and fix the shutdown bug that keeps leaving a listener behind.",
  "standfirst": "The two-command fix is easy. The reason the port is still busy after a crash is the part worth understanding, because it is usually a surviving child process rather than the kernel.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "find process using port"
  ],
  "cardDesc": "Locate the owner of a busy port, end it cleanly, and fix the crash path that leaves a listener behind.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Find the listener: `ss -ltnp 'sport = :3000'` on Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` before `SIGKILL`. `kill -9` skips every cleanup handler, which on a database or a queue worker costs you more than the port did.",
        "After a crash, the usual cause is a surviving child process that inherited the listening socket, not the port being held by the operating system.",
        "In Node the `TIME_WAIT` explanation is almost always wrong: libuv sets `SO_REUSEADDR` for you. In hand-rolled C, Python or Java servers it is often right.",
        "Binding `0.0.0.0` collides with a process already bound to `127.0.0.1` on the same port, even though those are different addresses."
      ]
    },
    {
      "t": "lede",
      "x": "`EADDRINUSE` is the kernel refusing a `bind()` call because another socket already holds the address and port you asked for. Nothing is corrupt, nothing needs reinstalling, and restarting your machine will fix it for the same reason that unplugging a lamp turns it off. The useful question is which process holds the socket and why it survived the thing that was supposed to kill it."
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "p",
      "x": "Every runtime is reporting the same refused syscall, so the strings differ but the meaning does not. Node prints `Error: listen EADDRINUSE: address already in use :::3000`, where `:::3000` is the IPv6 wildcard address `::` followed by the port. Python raises `OSError: [Errno 98] Address already in use` on Linux and errno 48 on macOS. Java throws `java.net.BindException: Address already in use`. Go reports `listen tcp :8080: bind: address already in use`."
    },
    {
      "t": "p",
      "x": "Docker is a special case worth recognising on sight. `Bind for 0.0.0.0:3000 failed: port is already allocated` comes from the Docker daemon, not from your application, and it means the daemon's own port binding failed on the host. The container never started, so there are no application logs to read. A stopped-but-still-mapped container or a second `docker compose` project is the usual answer there."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EADDRINUSE is not EACCES",
      "x": "If you see `EACCES` or `Permission denied` on port 80 or 443, the port is free and you are not allowed to bind it. Ports below 1024 are privileged on Unix. That needs `sudo`, a capability such as `CAP_NET_BIND_SERVICE`, or a reverse proxy in front, and none of the commands below will help."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: the modern tool. -l listeners, -t tcp, -n numeric, -p show process\nss -ltnp 'sport = :3000'\n\n# macOS, and Linux if lsof is what you have.\n# -n skips DNS, -P skips port-name lookup, so output stays readable.\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Just the PID, handy for scripting\nlsof -ti:3000\n\n# Linux alternative if neither is installed\nfuser -v 3000/tcp"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows: PID is the last column\nnetstat -ano | findstr :3000\n\n# Then turn the PID into a name\ntasklist /FI \"PID eq 1234\"\n\n# Or do it in one step\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess,\n    @{n='Process';e={(Get-Process -Id $_.OwningProcess).ProcessName}}"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Without sudo you may see nothing",
      "x": "`ss` and `lsof` only show process details for sockets you own. If a port is clearly busy but the PID column is empty or the output is blank, re-run with `sudo`. An unprivileged `lsof` does not warn you that it skipped rows, and plenty of time gets lost to that silence."
    },
    {
      "t": "p",
      "x": "Read the state column before you kill anything. `LISTEN` means a server is accepting connections there and is the thing blocking your bind. `ESTABLISHED` rows are live client connections. If the only rows you get back are `TIME_WAIT`, nothing is listening at all and killing processes will not help, which is a different problem covered further down."
    },
    {
      "t": "h2",
      "x": "End it without breaking something else"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask it to stop",
          "x": "`SIGTERM` is the default signal and gives the process a chance to flush writes, close the listening socket and deregister from a service discovery system.",
          "code": "kill 48213        # SIGTERM, the polite default\nkill -TERM 48213  # the same thing, spelled out"
        },
        {
          "title": "Check whether it worked",
          "x": "Give it a second or two. A server draining keep-alive connections can legitimately take longer than you expect.",
          "code": "ss -ltnp 'sport = :3000'   # expect empty output"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught or deferred. No cleanup runs, no in-flight request finishes, no temporary file is removed.",
          "code": "kill -9 48213"
        },
        {
          "title": "Confirm the port is free before restarting",
          "x": "Starting your server against a port that is still occupied produces the same error and sends you round the loop a second time.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo \"port 3000 is free\""
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Two shortcuts that bite",
      "x": "`pkill -f node` kills every Node process you own, which on a dev machine can include your editor's language server, a watcher and an unrelated project. `kill -9` on PostgreSQL, Redis or a consumer mid-transaction turns a port conflict into a recovery job. Target a single PID, and prefer `SIGTERM` for anything holding state. See [PostgreSQL connection refused](/guides/postgres-connection-refused/) for what the other side of that mistake looks like."
    },
    {
      "t": "p",
      "x": "Convenience wrappers exist and are fine for local work. `npx kill-port 3000` and `fuser -k 3000/tcp` both find and signal the owner in one step. Both also hide which process they hit, so when the port keeps coming back busy you are better off looking at the output yourself."
    },
    {
      "t": "table",
      "head": [
        "Task",
        "Linux",
        "macOS",
        "Windows (PowerShell)"
      ],
      "rows": [
        [
          "List listeners on a port",
          "`ss -ltnp 'sport = :3000'`",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`Get-NetTCPConnection -LocalPort 3000`"
        ],
        [
          "Get just the PID",
          "`fuser 3000/tcp`",
          "`lsof -ti:3000`",
          "`(Get-NetTCPConnection -LocalPort 3000).OwningProcess`"
        ],
        [
          "Ask it to stop",
          "`kill -TERM <pid>`",
          "`kill -TERM <pid>`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Force it to stop",
          "`kill -9 <pid>`",
          "`kill -9 <pid>`",
          "`Stop-Process -Id <pid> -Force`"
        ],
        [
          "See every listener",
          "`ss -ltnp`",
          "`lsof -nP -iTCP -sTCP:LISTEN`",
          "`Get-NetTCPConnection -State Listen`"
        ]
      ],
      "caption": "Equivalent commands per platform. Add sudo on Unix to see processes owned by other users."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that sends people to search engines twice. Your server crashed, or you hit Ctrl+C, and the port is still taken. There are five distinct causes and they call for different fixes, so it is worth knowing which one you have rather than reflexively killing things."
    },
    {
      "t": "h3",
      "x": "1. The process is still running"
    },
    {
      "t": "p",
      "x": "A stack trace in your terminal does not mean the process exited. An uncaught exception on a worker thread, a crash inside a request handler that your framework caught and logged, a process sitting in a debugger breakpoint: all of these leave the listening socket open. Ctrl+C sends `SIGINT` to the foreground process group, which misses anything already daemonised or started with a trailing `&`. Check with `jobs` in the same shell, and `ps -o pid,ppid,stat,command -p <pid>` for anything you found with `lsof`."
    },
    {
      "t": "h3",
      "x": "2. A child process inherited the socket"
    },
    {
      "t": "p",
      "x": "This is the most common answer and the least obvious. File descriptors survive `fork()`, so a child your server spawned holds a copy of the listening socket. Kill the parent and the port stays bound by the orphan, which is now reparented to init and invisible in your shell's job list. Cluster workers, `nodemon` and `concurrently` chains, Vite or webpack dev servers that spawn a separate process, and Python's `multiprocessing` all produce this shape."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Look at the whole tree, not just the PID lsof reported\nps -ejH | grep -i node\n\n# Or, if pstree is available, start from the PID you found\npstree -ps 48213\n\n# Kill a process group rather than one process (note the minus sign)\nkill -TERM -48213"
    },
    {
      "t": "h3",
      "x": "3. A supervisor is restarting it"
    },
    {
      "t": "p",
      "x": "`systemd` with `Restart=always`, a Docker restart policy, pm2 and Kubernetes all exist to bring your process back. Kill the process and something starts a fresh one within seconds, holding the same port, with a different PID each time you look. The PID changing between two `lsof` runs is the tell. Stop the unit rather than the process: `sudo systemctl stop myapp`, `docker stop <container>`, `pm2 stop <name>`. For containers specifically, `docker ps -a` and `docker compose down --remove-orphans` cover the stale-mapping case described in [why containers exit immediately](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "h3",
      "x": "4. TIME_WAIT, which is rarer than the internet suggests"
    },
    {
      "t": "p",
      "x": "When a socket closes, the end that closed first keeps the connection in `TIME_WAIT` for a couple of minutes so that late duplicate packets cannot be mistaken for part of a new connection. A fresh `bind()` to that local port can be refused while those entries exist. The important caveat: `SO_REUSEADDR` makes the kernel allow it anyway, and most modern runtimes set that option for you. Node does, through libuv. Go does. A C server that calls `bind()` without `setsockopt()` does not, and neither does a Python `socketserver` subclass that leaves `allow_reuse_address` at its default."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n# Without this line, a restart within the TIME_WAIT window\n# fails with [Errno 98] Address already in use.\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind((\"0.0.0.0\", 8000))\ns.listen(128)"
    },
    {
      "t": "p",
      "x": "Do not reach for `SO_REUSEADDR` as a blanket fix in production without reading what it permits on your platform, and do not confuse it with `SO_REUSEPORT`. On Linux, `SO_REUSEPORT` lets several processes bind the same port deliberately and have the kernel load-balance accepts across them. That is a feature, and it also means a stale worker can be listening alongside your new one while your requests mysteriously hit old code."
    },
    {
      "t": "h3",
      "x": "5. Something you did not start owns the port"
    },
    {
      "t": "p",
      "x": "Port 5000 on macOS is the classic: AirPlay Receiver binds it, so a Flask or ASP.NET default port fails on a machine with nothing else running. It can be turned off in System Settings under General, in the AirDrop and Handoff section, though Apple moves these panels between releases, so check your own version rather than trusting a screenshot. This was still the behaviour as of November 2026; verify on your machine before changing a setting."
    },
    {
      "t": "p",
      "x": "On Windows, Hyper-V and WSL2 reserve blocks of ports for dynamic use, and a bind inside a reserved block fails with nothing visible in `netstat`. Check with `netsh int ipv4 show excludedportrange protocol=tcp` in an elevated prompt. The Unix equivalent is a collision with the ephemeral port range, which an outbound connection may have grabbed first. Read your own range from `/proc/sys/net/ipv4/ip_local_port_range` and pick a listening port below it."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Needing these commands once a week is a signal about your shutdown path, not about your tooling. A process that closes its listening socket when asked frees the port in milliseconds and never leaves an orphan behind."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(PORT);\n\n// Fail loudly and usefully instead of printing a stack trace.\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${PORT} is taken. Find the owner with: lsof -ti:${PORT}`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, draining connections`);\n\n  server.close(() => process.exit(0));\n\n  // Idle keep-alive sockets will otherwise hold the server open.\n  // closeIdleConnections exists in Node 18.2 and later; check your version.\n  if (typeof server.closeIdleConnections === 'function') {\n    server.closeIdleConnections();\n  }\n\n  // Last resort, so a stuck request cannot block shutdown forever.\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "ul",
      "items": [
        "**Handle `SIGTERM`, not just `SIGINT`.** Docker, Kubernetes and systemd all send `SIGTERM`. A container that ignores it gets killed after the grace period, typically ten seconds by default, with no cleanup.",
        "**Close idle keep-alive sockets.** `server.close()` waits for every open connection, and a browser holding a keep-alive socket will happily keep your process alive past the point where you have given up and run `kill -9`.",
        "**Kill your children.** Track spawned PIDs and signal them during shutdown, or start them in their own process group so one `kill -TERM -<pgid>` reaches everything.",
        "**Use port 0 in tests.** Binding port 0 asks the kernel for any free port, and `server.address().port` tells you which one you got. Parallel test suites stop fighting over fixed numbers.",
        "**Bind one address, not two.** A process listening on `0.0.0.0` already covers `127.0.0.1`. Binding both in one app is a self-inflicted conflict."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "If you only need to get moving",
      "x": "Change the port. `PORT=3001 npm run dev` costs nothing and lets you investigate the stale listener when you are not mid-task. Just notice if you have drifted up to port 3007, because that is seven orphaned processes quietly holding sockets and memory."
    },
    {
      "t": "h2",
      "x": "A diagnostic order that works"
    },
    {
      "t": "ol",
      "items": [
        "Confirm something is actually listening, and on which address, with `ss -ltnp` or `lsof -nP -iTCP -sTCP:LISTEN`. Empty output with a failing bind points at `TIME_WAIT`, a reserved range or a container.",
        "Identify the process by name, not just PID. The name tells you whether it is your app, a watcher, a container shim or a system service.",
        "Run the lookup twice. A PID that changes means a supervisor is restarting it, and killing the process is the wrong layer.",
        "Walk up the tree with `pstree -ps <pid>` or `ps -o ppid= -p <pid>` to find the real parent before signalling anything.",
        "`SIGTERM` the right thing, verify the port is free, then start your server."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `kill $(lsof -ti:3000)`. On Linux without lsof: `fuser -k 3000/tcp`. On Windows: find the PID with `netstat -ano | findstr :3000`, then `taskkill /PID <pid>`, adding `/F` only if it ignores the first request. Look at what you are about to kill first. If the name is `postgres`, `redis-server` or a container runtime, a forced kill can leave data to recover."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends `SIGINT` to the foreground process group only. A child process that was spawned into its own group, daemonised, or started with a trailing `&` never receives it, and it still holds a copy of the listening file descriptor inherited at fork time. Check for orphans with `pstree -ps <pid>` or `ps -ejH`. A process that trapped `SIGINT` and is stuck in its own cleanup code produces the same symptom."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "It is safe for the machine and often not safe for your data. `SIGKILL` cannot be caught, so no flush, no `server.close()`, no transaction rollback and no temporary file cleanup happens. For a dev server it is unremarkable. For anything holding state, send `SIGTERM`, wait a few seconds, and escalate only if the process genuinely will not exit."
        },
        {
          "q": "What does \"address already in use :::3000\" mean? Why three colons?",
          "a": "The first two colons are `::`, the IPv6 wildcard address, and the third separates the port. So the message is about binding port 3000 on all IPv6 interfaces, which on a dual-stack system usually covers IPv4 too. That dual-stack behaviour is why a process bound to `::` conflicts with one trying to bind `0.0.0.0:3000`."
        },
        {
          "q": "Why do I get this error when nothing is listening on the port?",
          "a": "Four candidates. Connections in `TIME_WAIT` on that local port, combined with a server that does not set `SO_REUSEADDR`. A Windows port reserved by Hyper-V or WSL2, visible via `netsh int ipv4 show excludedportrange protocol=tcp`. A Docker daemon mapping held by a container that `docker ps` alone will not show, so check `docker ps -a`. Or a privilege problem where your unprivileged `lsof` cannot see another user's process, which `sudo` will reveal."
        },
        {
          "q": "Can two processes legitimately listen on the same port?",
          "a": "Yes, in three cases. With `SO_REUSEPORT` on Linux and the BSDs, several processes bind the same port on purpose and the kernel spreads incoming connections across them. Two processes can bind the same port on different specific addresses, such as `127.0.0.1:8080` and `192.168.1.10:8080`. And TCP and UDP port numbers are separate namespaces, so a DNS server can hold both 53s without conflict."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and why your container stops the moment it starts.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Check the process, the listen address, the firewall and pg_hba.conf in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "How resolution really works, and why ESM and CommonJS disagree about it.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-19",
  "updated": "2026-11-19",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
