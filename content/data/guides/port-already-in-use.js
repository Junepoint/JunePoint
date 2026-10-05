module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Busy Port",
  "h1": "Port already in use: finding and killing the process",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means a live process still holds the port. Identify the owner on Linux, macOS or Windows, stop it safely, and understand why it survives a crash.",
  "standfirst": "A reliable order of operations for a busy port: identify the listener, confirm it is yours, then stop it. Plus the reason the port is still held after your server crashed.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Identify what holds a port, stop it safely, and fix the orphaned process that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` nearly always means a live process is still listening. It is rarely the kernel holding the port in `TIME_WAIT`.",
        "Identify the owner before killing anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` first. `kill -9` gives the process no chance to shut down its own children, and those children are what hold the socket open.",
        "After a crash, the usual culprit is an orphaned child process, started by `nodemon`, `concurrently`, an editor task runner or a stray `&`.",
        "A wildcard bind on `0.0.0.0:3000` collides with a specific bind on `127.0.0.1:3000`, and the error text gives you no hint that this is what happened."
      ]
    },
    {
      "t": "lede",
      "x": "The message `Error: listen EADDRINUSE: address already in use :::3000` says one thing only: at the moment you called `listen`, the operating system already had that address spoken for. It does not say by what. Most of the time it is a previous copy of the server you are trying to start, still running, still holding the socket. The fix takes three steps in a fixed order, and the third step is the only one most tutorials bother with."
    },
    {
      "t": "h2",
      "x": "Identify the listener before you kill anything"
    },
    {
      "t": "p",
      "x": "Resist the one-liner for a moment. Ports in the 3000 to 9000 range are crowded, and a shared development machine may well have a database proxy, a container, or a colleague’s tunnel on the number you want. Look at what is there, read the process name, then decide."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listening sockets on port 3000 only\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, without lsof installed\nss -ltnp 'sport = :3000'\n\n# Everything touching 3000, including established client connections\nlsof -i :3000"
    },
    {
      "t": "p",
      "x": "The flags are worth knowing. `-n` skips reverse DNS and `-P` skips port-name lookup, so the command returns immediately instead of pausing on a slow resolver. `-sTCP:LISTEN` is the important one: it filters out established connections, so what you see is the server rather than every browser tab talking to it. On Linux, `ss -ltnp` only shows the process for sockets you own, so prefix it with `sudo` when the output has an empty process column."
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "List the listener",
        "Stop it"
      ],
      "rows": [
        [
          "Linux",
          "`ss -ltnp 'sport = :3000'`",
          "`kill <pid>`, then `fuser -k 3000/tcp` if needed"
        ],
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`kill <pid>`"
        ],
        [
          "Windows (cmd)",
          "`netstat -ano | findstr :3000`",
          "`taskkill /PID <pid>`, add `/F` to force"
        ],
        [
          "Windows (PowerShell)",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Docker",
          "`docker ps --format '{{.Names}}\\t{{.Ports}}'`",
          "`docker stop <name>` or `docker compose down`"
        ]
      ],
      "caption": "The listener is the only socket that matters. Established connections on the same port are clients, not the owner."
    },
    {
      "t": "p",
      "x": "On Windows, `netstat -ano` prints the PID in the last column, and you then need `tasklist /FI \"PID eq 12345\"` to turn that number into a name. PowerShell does it in one go: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess`. If that command returns nothing at all but binding still fails, skip ahead to the section on reserved port ranges."
    },
    {
      "t": "h2",
      "x": "Stop it without collateral damage"
    },
    {
      "t": "p",
      "x": "Default to `SIGTERM`, which is plain `kill` with no flags. A well-behaved server handles it, closes the listening socket, waits for in-flight requests, and shuts down its workers. `kill -9` sends `SIGKILL`, which cannot be caught. The process dies on the spot and anything it spawned is orphaned, still running, still holding a duplicate of the listening file descriptor. That is a direct route back to the same error ninety seconds later."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Polite first\nkill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)\n\n# Did it actually go away?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Only now escalate\nkill -9 $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)\n\n# Linux shortcut that signals every process on the port\nfuser -k 3000/tcp        # SIGKILL\nfuser -k -TERM 3000/tcp  # SIGTERM"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The popular one-liner is broader than it looks",
      "x": "The widely copied `kill -9 $(lsof -t -i:3000)` has no `-sTCP:LISTEN` filter, so `lsof -t` returns the PID of every process with a socket on that port. On a machine where a browser, a test runner and a proxy are all connected, that list includes clients you did not mean to kill. Adding `-sTCP:LISTEN` costs nothing and limits the blast radius to the server."
    },
    {
      "t": "p",
      "x": "When the parent is a wrapper such as `npm run dev`, killing the PID that owns the socket often leaves the wrapper alive to restart it, or the reverse. Look at the tree first with `pstree -p <pid>` on Linux or `ps -ef | grep node` anywhere, and signal the whole process group by putting a minus sign in front of the group ID: `kill -TERM -12345`. That only works if 12345 is genuinely a group leader, which it is when the shell started it as a job."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "Here is the part that confuses people, and it is worth being precise about. A crash does not leave a port behind. The kernel releases a listening socket as soon as the last file descriptor referring to it is closed, and process exit closes all of them. So if the port is still occupied, a descriptor is still open somewhere, in a process you have lost track of. The question is never \"how long until the port frees up\". The question is \"which process is still alive\"."
    },
    {
      "t": "h3",
      "x": "Orphaned children that inherited the socket"
    },
    {
      "t": "p",
      "x": "This is the common one. `fork` copies file descriptors into the child, so a worker or a reloaded build process can hold a duplicate of the listening socket. Tools in this category include `nodemon`, `concurrently`, `npm-run-all`, cluster-mode workers, framework dev servers that run a compiler in a second process, and anything that re-executes your entry point on file change. Hit Ctrl+C in the wrong terminal, or kill the supervisor with `-9`, and the child keeps the socket. `ps -o pid,ppid,command -p <pid>` will show you a parent PID of 1, which is the signature of an orphan."
    },
    {
      "t": "h3",
      "x": "Processes you backgrounded and forgot"
    },
    {
      "t": "ul",
      "items": [
        "A command ending in `&` from an earlier session, still attached to a shell you closed.",
        "A `tmux` or `screen` pane in another window. `tmux ls` is faster than guessing.",
        "A debug session your editor launched. VS Code task runners and JetBrains run configurations outlive a closed terminal tab more often than people expect.",
        "A service manager doing its job: `systemctl status myapp` on Linux, `launchctl list | grep myapp` on macOS. If a unit has `Restart=always`, killing the PID is pointless because systemd puts it straight back."
      ]
    },
    {
      "t": "h3",
      "x": "Containers, which are invisible to lsof in the usual way"
    },
    {
      "t": "p",
      "x": "A published container port is bound by the Docker daemon or a `docker-proxy` helper, not by your application, so the process name in `lsof` output tells you nothing useful about which container is responsible. Docker reports the collision in its own words: `Bind for 0.0.0.0:3000 failed: port is already allocated`. Run `docker ps` and look at the `PORTS` column. A Compose stack you started last week and never brought down is the usual answer, and `docker compose down` beats killing a PID, because the daemon will otherwise recreate a restart-policy container for you."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT is probably not your problem"
    },
    {
      "t": "p",
      "x": "A lot of advice on this error talks about `TIME_WAIT`, tells you to wait sixty seconds, or suggests setting `SO_REUSEADDR`. For a server that fails on `listen`, that advice is mostly beside the point. `TIME_WAIT` applies to closed connections, not to listening sockets, and libuv already sets `SO_REUSEADDR` on listening sockets for Node, which is exactly what lets a fresh listener bind while old connections from the previous run are still winding down. Windows is the exception: there libuv uses exclusive address binding instead, because `SO_REUSEADDR` on Windows permits a second process to hijack the port rather than merely coexist with dying connections."
    },
    {
      "t": "p",
      "x": "If you want to check rather than assume, ask the kernel what state the sockets are in:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: connections in TIME_WAIT on port 3000\nss -tan state time-wait '( sport = :3000 or dport = :3000 )'\n\n# Anything at all listening, grouped by port\nss -ltnp | sort -k4"
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` does cause genuine `EADDRINUSE` failures, just on the other side of the connection. A client opening and closing very large numbers of short-lived outbound connections can exhaust the local ephemeral port range, and the failure then comes from `connect`, not `listen`. Connection pooling and keep-alive fix that. Widening `net.ipv4.ip_local_port_range` buys headroom."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reach for tcp_tw_recycle",
      "x": "Older forum answers recommend `net.ipv4.tcp_tw_recycle=1`. It silently breaks clients behind NAT, because it drops connections whose timestamps look out of order, and it was removed from the Linux kernel in 4.12. If you find it in a sysctl file you inherited, that is a bug, not a tuning. `net.ipv4.tcp_tw_reuse` is the safer and still-supported setting, and it affects outbound connections only."
    },
    {
      "t": "h2",
      "x": "Two binds that look the same and are not"
    },
    {
      "t": "p",
      "x": "Addresses overlap in ways the error message hides. `0.0.0.0:3000` means every IPv4 interface. `127.0.0.1:3000` means loopback only. `:::3000`, which is what Node prints when you call `listen(3000)` with no host, is the IPv6 wildcard, and on most systems dual-stack behaviour means it also accepts IPv4 traffic. A process holding the wildcard blocks a later specific bind, and a process holding loopback blocks a later wildcard bind. Both produce the identical `EADDRINUSE`."
    },
    {
      "t": "p",
      "x": "Practical consequence: if your server works when you set `HOST=127.0.0.1` and fails on the default, something else has the wildcard, and the reverse is also worth testing. Read the `NAME` column in `lsof` output carefully, since `*:3000` and `127.0.0.1:3000` are different findings that lead to different culprits."
    },
    {
      "t": "h2",
      "x": "Ports that were never yours to take"
    },
    {
      "t": "p",
      "x": "Sometimes nothing is listening and the bind still fails. Four cases account for most of it."
    },
    {
      "t": "ul",
      "items": [
        "**Privileged ports.** Binding below 1024 as a normal user fails with `EACCES`, not `EADDRINUSE`: `Error: listen EACCES: permission denied 0.0.0.0:80`. If you see `EACCES`, stop hunting for a process. Use a high port behind a reverse proxy, or grant the capability deliberately.",
        "**macOS AirPlay Receiver.** On recent macOS versions, the system’s AirPlay Receiver listens on ports 5000 and 7000, which is why so many Flask tutorials stopped working. Turn it off in System Settings under General, then AirDrop and Handoff, or move your app to another port. Accurate as of October 2026, and worth re-checking against your own macOS version.",
        "**Windows reserved ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ports in advance. `netsh interface ipv4 show excludedportrange protocol=tcp` lists them. A bind inside a reserved range usually surfaces as a permissions error rather than an in-use error, which makes it easy to misdiagnose.",
        "**Security and management agents.** Endpoint agents and corporate VPN clients bind local ports for their own interception and update channels. They show up in `lsof` under unfamiliar names, and they are not yours to kill."
      ]
    },
    {
      "t": "h2",
      "x": "Make it stop recurring"
    },
    {
      "t": "p",
      "x": "Freeing the port is a one-minute task. Not needing to free it again is worth slightly more effort, and it is mostly about shutting down cleanly and not hard-coding a port where you do not need one."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Fail with a useful message instead of a stack trace",
          "x": "Handle the error on the server object so the next developer reads one line rather than a trace through internal modules.",
          "code": "const server = app.listen(port)\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is already in use. Set PORT, or run: lsof -nP -iTCP:${port} -sTCP:LISTEN`)\n    process.exit(1)\n  }\n  throw err\n})"
        },
        {
          "title": "Close the listener on SIGINT and SIGTERM",
          "x": "Without this, Ctrl+C in a container or a stop from a supervisor can leave workers running. Keep the handler short, and let a timeout force the exit if a connection refuses to drain.",
          "code": "for (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0))\n    setTimeout(() => process.exit(1), 5000).unref()\n  })\n}"
        },
        {
          "title": "Let the kernel pick the port in tests",
          "x": "Hard-coded ports are the main source of flaky parallel test runs. Passing 0 asks for any free port, and you read back what you got.",
          "code": "const server = app.listen(0, () => {\n  const { port } = server.address()\n  console.log(`listening on ${port}`)\n})"
        },
        {
          "title": "Keep one supervisor, not three",
          "x": "A dev script that nests `nodemon` inside `concurrently` inside `npm run` gives you three layers that each have to forward signals correctly. Flatten it where you can, and check that Ctrl+C really leaves nothing behind with `lsof` before you assume it does."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One command to answer \"did it actually stop?\"",
      "x": "Make `lsof -nP -iTCP:3000 -sTCP:LISTEN` a shell alias. Empty output is proof. Assuming the kill worked, then re-running the server and reading the same error again, is the loop that turns a two-minute problem into a twenty-minute one."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and signal handling when a container will not stay up.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Work through listen addresses, firewalls and pg_hba.conf one layer at a time.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "Why Node module resolution fails, and the ESM and CommonJS cases behind it.",
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
          "a": "On macOS or Linux: kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN). Check it is gone with lsof -nP -iTCP:3000 -sTCP:LISTEN, and only add -9 if the process ignored SIGTERM. On Windows, find the PID with netstat -ano | findstr :3000 and run taskkill /PID <pid>, adding /F to force it."
        },
        {
          "q": "Why is the port still in use after my server crashed?",
          "a": "Because something is still running. Process exit closes the listening socket, so a busy port means a live file descriptor somewhere, usually an orphaned child process that inherited the socket from a dev server, a supervisor, or a build watcher. Check for a process whose parent PID is 1."
        },
        {
          "q": "Do I need to wait for TIME_WAIT to clear before restarting?",
          "a": "Generally no. TIME_WAIT applies to closed connections rather than listening sockets, and libuv sets SO_REUSEADDR for Node servers on Linux and macOS, so a new listener can bind while old connections drain. If a bind fails, look for a running process instead of waiting."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on a port?",
          "a": "EADDRINUSE means the address is taken. EACCES means you are not permitted to bind it, which happens below port 1024 for a non-root user, and inside ranges reserved by Hyper-V or WSL2 on Windows. The fixes are unrelated, so read the error code before you start looking for a process."
        },
        {
          "q": "Is npx kill-port safe to use?",
          "a": "It is convenient and it works, but it decides what to kill from the port number alone, so it offers no chance to check what you are about to stop. On a machine running containers, databases or shared tunnels, listing the listener first and killing a specific PID is the safer habit."
        },
        {
          "q": "Why can I not bind port 5000 on my Mac?",
          "a": "Recent macOS versions use ports 5000 and 7000 for the AirPlay Receiver service. Disable it in System Settings under General, then AirDrop and Handoff, or move your app to a different port. This was true as of October 2026; confirm against your own macOS release."
        },
        {
          "q": "How do I find which Docker container holds a port?",
          "a": "Run docker ps and read the PORTS column, since the published binding belongs to the Docker daemon rather than your application and lsof will not name the container. Prefer docker stop or docker compose down, because a container with a restart policy will come straight back if you only kill a process."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-05",
  "updated": "2026-10-05",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
