module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is in Use",
  "h1": "Port already in use: find the owner before you kill it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means another process holds the port. Find the owner on macOS, Linux or Windows, kill it safely, and stop orphans after a crash.",
  "standfirst": "One listening socket per port, and something else already has it. How to identify the owner on any platform, kill it without collateral damage, and stop the orphaned children that cause this after a crash.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Find which process holds a port on macOS, Linux or Windows, then kill it without taking down your editor too.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means some process already holds the port. Identify it before killing anything.",
        "One command: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash the usual culprit is an orphaned child that inherited the listening socket, not a `TIME_WAIT` socket.",
        "`killall node` is the fix that breaks your editor. It kills language servers and Electron apps too.",
        "If the port is retaken a second after the kill, a supervisor is restarting it. Stop the supervisor instead."
      ]
    },
    {
      "t": "h2",
      "x": "What the error actually means"
    },
    {
      "t": "p",
      "x": "A TCP port can have one listening socket at a time. `EADDRINUSE` is the kernel refusing your `bind()` call because something got there first. That is the whole mechanism. Everything else is about working out what, and why it is still alive."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python\nOSError: [Errno 98] Address already in use    # Linux\nOSError: [Errno 48] Address already in use    # macOS\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use"
    },
    {
      "t": "p",
      "x": "The `:::3000` in the Node message is the IPv6 wildcard address. A server listening there also accepts IPv4 traffic on most systems, which is why binding `0.0.0.0:3000` afterwards fails even though the two look like different interfaces. Two sockets can share a port only when they bind to genuinely different addresses, such as `127.0.0.1:3000` and `192.168.1.20:3000`."
    },
    {
      "t": "h2",
      "x": "Find the owner"
    },
    {
      "t": "h3",
      "x": "macOS and Linux"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux, with the owning process in the output\nss -ltnp 'sport = :3000'\n\n# Portable, works on macOS too\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Everything touching the port, clients included\nlsof -nP -i :3000\n\n# Just the PIDs, for scripting\nlsof -t -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "`-n` skips DNS lookups and `-P` skips port-name lookups, so the output arrives instantly and prints `3000` rather than a service name. `-sTCP:LISTEN` is the part people leave off. Without it you match established connections and client sockets that merely use that port number as their remote end, which is how a careless `kill` closes a database connection instead of freeing a listener."
    },
    {
      "t": "p",
      "x": "If `lsof` prints nothing and the bind still fails, the owner probably belongs to another user. Re-run under `sudo`. On Linux, `ss -ltnp` needs root before it will fill in the process column for anything you do not own."
    },
    {
      "t": "h3",
      "x": "Windows"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell, the readable version\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Turn the PID into a name\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe\nnetstat -ano | findstr :3000\ntaskkill /PID 12345 /F"
    },
    {
      "t": "p",
      "x": "`netstat -ano` puts the PID in the last column. Match the row whose state is `LISTENING`. The `ESTABLISHED` and `TIME_WAIT` rows on the same port belong to connections, not to the listener you want gone."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not run killall node",
      "x": "`killall node`, `pkill -f node` and `taskkill /IM node.exe /F` all free the port. They also kill your editor's TypeScript server, every other project's dev server, any Electron app, and whatever Node process your terminal tooling depends on. The damage is confusing precisely because what breaks has nothing to do with the port you were fixing. Kill one PID."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "See what is listening",
          "x": "Get the PID and the command name together. If the command is not what you expected, stop and read the next step twice.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN\n# COMMAND   PID  USER   FD   TYPE  DEVICE  NODE NAME\n# node    48219  sam    23u  IPv6  0x...   TCP  *:3000 (LISTEN)"
        },
        {
          "title": "Identify the process properly",
          "x": "Check who owns it, how long it has been running and what its parent is. A long `etime` on a dev server you started a minute ago means you found the wrong process.",
          "code": "ps -o pid=,ppid=,user=,etime=,command= -p 48219"
        },
        {
          "title": "Ask it to stop",
          "x": "Plain `kill` sends `SIGTERM`, which gives the process a chance to close connections and flush writes. Most of the time this is enough.",
          "code": "kill 48219"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught, so cleanup handlers never run and the process cannot tear down its own children. That is how you create the next orphan.",
          "code": "kill -9 48219"
        },
        {
          "title": "Confirm the port is free",
          "x": "No output means no listener. If a new PID appears instead, something is restarting the service and you need to stop the supervisor, not the process.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo 'port 3000 is free'"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Why it happens after a crash"
    },
    {
      "t": "p",
      "x": "A listening socket is a file descriptor, and descriptors are inherited. When a process forks or spawns a child, the child receives a copy. The kernel releases the port only when the last descriptor referring to it closes. So when the parent dies and a child survives, the port stays bound, and that child is now reparented away from the command you originally ran."
    },
    {
      "t": "p",
      "x": "This is also why the error clusters around crashes rather than normal restarts. Ctrl+C sends `SIGINT` to the whole foreground process group, so children usually do get told to stop. A `kill -9` on the parent tells nobody anything."
    },
    {
      "t": "ul",
      "items": [
        "Dev runners that wrap a server: `nodemon`, `concurrently`, `npm-run-all`, `turbo run dev`. Kill the wrapper hard and the server underneath keeps the socket.",
        "Children spawned with `detached: true`, or anything that called `setsid`. They sit in a different process group, so terminal signals never reach them.",
        "Cluster and worker pools. Every worker holds the inherited listening socket, and one surviving worker is enough to keep the port busy.",
        "Docker publishing the port. The holder is the daemon or a `docker-proxy` process, not your app. Check `docker ps --filter publish=3000` and stop the container.",
        "A supervisor doing its job: `pm2`, `systemd`, `launchd`, Kubernetes. The port comes back within a second of every kill."
      ]
    },
    {
      "t": "p",
      "x": "One thing to rule out: a zombie process cannot hold a port. A process in state `Z`, which `ps` shows as `<defunct>`, has already released its file descriptors and is waiting for its parent to read the exit status. If you find a defunct process and your port is still busy, the real holder is elsewhere."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT theory, and when it is true"
    },
    {
      "t": "p",
      "x": "The stock explanation for a port that is busy with nothing running is `TIME_WAIT`. It is a real mechanism, and it is usually the wrong answer."
    },
    {
      "t": "p",
      "x": "Whichever side closes a TCP connection keeps the socket in `TIME_WAIT` so that late packets from the old connection are not delivered to a new one reusing the same addresses and ports. On Linux this lasts about 60 seconds and is a compile-time constant rather than a tunable sysctl. Binding a listener while such sockets exist fails only when the listener does not set `SO_REUSEADDR`."
    },
    {
      "t": "p",
      "x": "Almost everything sets it. Node sets it on listening sockets, as do Go's `net.Listen`, nginx, and most Python servers via `allow_reuse_address`. A bare `socket.bind()` in a script you wrote yourself probably does not, which is why the hand-rolled server is the one that refuses to restart for a minute."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Is TIME_WAIT really the cause? Expect several TIME_WAIT rows\n# on the port and no LISTEN row at all.\nss -tan | awk '$4 ~ /:3000$/ {print $1, $4, $5}'"
    },
    {
      "t": "p",
      "x": "Two tells separate it from an orphan. The error clears on its own inside a minute or two with nothing killed, and `ss` shows no listening socket. If there is a `LISTEN` row, a live process owns it, whatever `ps` seemed to suggest."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Two fixes that do not work",
      "x": "`net.ipv4.tcp_tw_reuse` governs reuse of ephemeral ports for outbound connections. It does nothing for a listener. Setting `SO_LINGER` with a zero timeout does dodge `TIME_WAIT`, by sending a RST and discarding data still in flight, so you trade a one-minute wait for truncated responses. Set `SO_REUSEADDR` instead."
    },
    {
      "t": "h2",
      "x": "Ports you cannot have"
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "Likely cause",
        "What to do"
      ],
      "rows": [
        [
          "Port 5000 or 7000 is taken on macOS",
          "AirPlay Receiver listens on both. The owner appears as `ControlCe` or an AirPlay helper.",
          "Turn off AirPlay Receiver in System Settings, or pick another port. Applies to macOS Monterey and later; confirm on your own version."
        ],
        [
          "`EACCES` rather than `EADDRINUSE`",
          "Ports below 1024 are privileged, so this is a permission error wearing similar clothes.",
          "Listen high and put a reverse proxy in front, or grant `CAP_NET_BIND_SERVICE` on Linux. Do not run a dev server as root."
        ],
        [
          "Windows says the port is free but still refuses the bind",
          "Hyper-V and WSL2 reserve blocks of dynamic ports at boot.",
          "Run `netsh int ipv4 show excludedportrange protocol=tcp` and choose a port outside the reserved ranges."
        ],
        [
          "`lsof` finds nothing, bind still fails",
          "The owner runs as another user, or inside a container network namespace.",
          "Retry with `sudo`, then check `docker ps --filter publish=3000`."
        ],
        [
          "The port frees itself after about a minute",
          "Sockets in `TIME_WAIT` plus a listener without `SO_REUSEADDR`.",
          "Set the socket option rather than waiting it out."
        ],
        [
          "Killing the PID frees the port for one second",
          "A supervisor restarts the process immediately.",
          "Stop the unit, not the process: `pm2 stop`, `systemctl stop`, `docker compose down`."
        ]
      ],
      "caption": "Cases where the obvious diagnosis is the wrong one."
    },
    {
      "t": "h2",
      "x": "Stop creating the problem"
    },
    {
      "t": "p",
      "x": "Two changes remove most of these incidents: handle the termination signals, and stop hard-coding ports in tests."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is in use. Find the owner with:`);\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n\n  // Available in Node 18.2 and later. Without it, idle keep-alive\n  // sockets hold the handle open and close() never completes.\n  // Check the docs for the version you actually run.\n  server.closeIdleConnections?.();\n\n  // Backstop: never hang forever waiting for a slow client.\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "`server.close()` stops the listener accepting new connections and then waits for existing ones to finish. With HTTP keep-alive, an idle browser tab can hold a connection open long enough that the callback never fires and the process hangs until something kills it harder. That hang is itself a source of orphaned ports, which is why the timeout matters more than it looks."
    },
    {
      "t": "p",
      "x": "For tests, bind port 0. The kernel picks a free ephemeral port and hands it back through `server.address()`, so parallel workers never collide and a leaked server from the previous run cannot block the next one."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  process.env.TEST_BASE_URL = `http://127.0.0.1:${port}`;\n});"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The honest shortcut",
      "x": "`npx kill-port 3000` and `fuser -k 3000/tcp` do the whole job in one line. They are fine on your own laptop and a bad habit anywhere shared, because neither shows you what it matched before killing it. Run `fuser 3000/tcp` without `-k` first and read the output. On a host where port 5432 might be a real database rather than your container, that habit is the difference between a lost minute and a lost afternoon."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the port is free because the container died, start with PID 1 and the exit code.",
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
          "desc": "The other startup error that stops a server before it ever binds a socket.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find out what is using port 3000?",
          "a": "On macOS and Linux, run lsof -nP -iTCP:3000 -sTCP:LISTEN. It prints the command, PID and user of the listening socket only. On Linux, ss -ltnp 'sport = :3000' is faster and shows the same thing, though it needs root to name processes you do not own. On Windows, use Get-NetTCPConnection -LocalPort 3000 -State Listen and look at the OwningProcess column."
        },
        {
          "q": "How do I kill a process on a port in Windows?",
          "a": "Run netstat -ano | findstr :3000, find the row whose state is LISTENING, take the PID from the last column, then run taskkill /PID 12345 /F. In PowerShell you can do it in one step with Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess. Check what the process is first, because the PID might belong to a service you need."
        },
        {
          "q": "Why does the port stay in use after I stopped the server?",
          "a": "Usually a child process inherited the listening socket and outlived its parent. Dev wrappers like nodemon and concurrently are the common source, especially when the wrapper was killed with SIGKILL and never got to tear down what it spawned. Look up the listener's PID and check its parent with ps -o ppid=,command= -p PID. If the parent is init or launchd, you have found an orphan."
        },
        {
          "q": "Is it safe to kill -9 the process holding the port?",
          "a": "It frees the port, and it skips every cleanup path the process had. Unflushed writes are lost, temporary files stay behind, and any children the process managed are left running, which can recreate the same problem on the next start. Send plain kill first and give it a couple of seconds. Escalate to kill -9 only for a process that ignores SIGTERM."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is running?",
          "a": "Three likely reasons. The owner runs as another user or inside a container, so you need sudo or docker ps --filter publish=3000 to see it. A system service already claims the port, such as AirPlay Receiver on macOS ports 5000 and 7000. Or sockets are sitting in TIME_WAIT and your listener does not set SO_REUSEADDR, in which case the error clears by itself inside a minute or two."
        },
        {
          "q": "Should I just change the port instead?",
          "a": "Sometimes that is the correct answer, particularly when a system service legitimately owns the port or when two projects both default to 3000. It is the wrong answer when the port is held by a leaked copy of your own server, because the leak will keep happening and you will keep moving. For tests, do not pick a new fixed number: bind port 0 and read the assigned port back from the socket."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-02",
  "updated": "2026-11-02",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
