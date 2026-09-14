module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is in Use",
  "h1": "Port already in use: finding the process and getting it back",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a TCP port on macOS, Linux and Windows, stop it safely, and understand why a crashed server keeps its port.",
  "standfirst": "EADDRINUSE is the kernel refusing to give you an address something else already claimed. Name the holder first, then decide whether killing it is the right move.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Name the process holding the port, stop it in the right order, and stop orphaned dev servers coming back.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` names the process holding port 3000 on macOS and Linux. On Windows, `netstat -ano | findstr :3000` gives you a PID.",
        "The error comes from the `bind` call inside your runtime, not from your framework. Express, Vite and Flask are all just reporting what the operating system told them.",
        "After a crash, the usual holder is an orphaned child process that never received a signal, not a lingering socket.",
        "Send `SIGTERM` before `SIGKILL`. `kill -9` skips your shutdown handler and leaves lock files, temp directories and half-open database connections behind.",
        "If no process shows up but binding still fails, suspect a reserved port range, a different network interface, or a container proxy rather than your own code."
      ]
    },
    {
      "t": "lede",
      "x": "One process per address, per port, per protocol. That is the rule the kernel enforces, and every variant of this error is the kernel saying someone got there first. The useful question is never how to free the port. It is what is holding it, and whether you meant to run that."
    },
    {
      "t": "h2",
      "x": "Name the process before you kill anything"
    },
    {
      "t": "p",
      "x": "Resist the urge to paste a one-line kill command. It takes five seconds to find out what you are about to stop, and the answer is occasionally something you need, such as a database, a corporate VPN client or a system service that will come straight back."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listening sockets only, no DNS or port-name lookups\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed. Needs root to show the owning PID.\nsudo ss -lptn 'sport = :3000'\n\n# Now find out what that PID actually is before you touch it\nps -o pid,ppid,user,etime,command -p 12345"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Without it, `lsof -i :3000` also matches every established client connection to that port, so a browser tab with an open websocket shows up alongside the server. Feed that wider list into `kill` and you may stop processes that had nothing to do with the problem."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "The popular one-liner is broader than people think",
      "x": "`kill -9 $(lsof -t -i:3000)` is the answer you will find everywhere. It sends the uncatchable signal to every process with any socket on that port, listener or client, yours or not. If you want a one-liner, make it `kill $(lsof -t -iTCP:3000 -sTCP:LISTEN)` and leave off the `-9` until the polite signal has failed."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows: which PID owns the port\nnetstat -ano | findstr :3000\n\n# PowerShell, with the process name attached\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Stop it once you are sure what it is\ntaskkill /PID 12345 /F"
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
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`kill 12345`, then `kill -9` if needed"
        ],
        [
          "Linux",
          "`sudo ss -lptn 'sport = :3000'`",
          "`kill 12345` or `fuser -k 3000/tcp`"
        ],
        [
          "Windows",
          "`netstat -ano | findstr :3000`",
          "`taskkill /PID 12345` then `/F`"
        ],
        [
          "Docker",
          "`docker ps --filter publish=3000`",
          "`docker stop <name>`, not a host kill"
        ],
        [
          "WSL2",
          "Check inside WSL and on the Windows host",
          "Stop whichever side owns it"
        ]
      ],
      "caption": "The same job on five platforms. Substitute your own port for 3000."
    },
    {
      "t": "h2",
      "x": "What the error actually is"
    },
    {
      "t": "p",
      "x": "Every server does the same three things: create a socket, bind it to an address and port, then listen. `EADDRINUSE` is the return value of that middle step. Your framework adds a stack trace and a friendlier sentence, but the decision was made in the kernel before any of your code ran."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:...)\n    at listenInCluster (node:net:...)\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000"
    },
    {
      "t": "p",
      "x": "Two details there are worth reading. The `errno` is the raw platform number, so it is `-98` on Linux and `-48` on macOS for the same condition. And `:::3000` is not a typo. It is the IPv6 wildcard address `::`, which on most systems also covers IPv4 through a dual-stack socket. That is why an attempt to bind `0.0.0.0:3000` can fail because of something listening on `[::]:3000`."
    },
    {
      "t": "p",
      "x": "Other runtimes phrase the identical kernel error differently. Python raises `OSError: [Errno 98] Address already in use`. Java throws `java.net.BindException: Address already in use`. Docker reports `Bind for 0.0.0.0:3000 failed: port is already allocated`. Wording shifts between versions, so if you are handling this in software, match on the code and not the sentence."
    },
    {
      "t": "h2",
      "x": "Why it survives a crash"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people. The server crashed. The terminal came back. Nothing should own the port. Yet it is still taken, and the reason is almost always that something is still running, just not the thing you were watching."
    },
    {
      "t": "h3",
      "x": "The parent died and the child kept going"
    },
    {
      "t": "p",
      "x": "Modern dev tooling is a tree of processes. `nodemon`, `concurrently`, `npm run dev`, `next dev` and most test runners spawn children, and the child is the one that actually holds the socket. Kill the parent and the child is reparented rather than killed. It keeps the port, loses its terminal, and becomes effectively invisible. Look at the `PPID` column from `ps`: an orphan reports a parent of `1`."
    },
    {
      "t": "h3",
      "x": "Closing the window is not the same as Ctrl-C"
    },
    {
      "t": "p",
      "x": "Ctrl-C sends `SIGINT` to the foreground process group. Closing a terminal sends `SIGHUP`, which plenty of processes ignore, and anything you started with `&`, `nohup`, `tmux` or a detached editor task never saw either signal. A crashed process with a broken pipe is also perfectly capable of hanging around in an unusable state while still holding its file descriptors."
    },
    {
      "t": "h3",
      "x": "Something restarted it on purpose"
    },
    {
      "t": "p",
      "x": "`systemd` with `Restart=always`, a `pm2` daemon, a Docker restart policy of `unless-stopped`, or a Kubernetes deployment will all bring the process back within seconds of you killing it. If the port frees up and is immediately taken again by a fresh PID, stop hunting and go find the supervisor. `systemctl stop` and `docker compose down` are the right tools there. Killing the PID directly just annoys the thing whose entire job is to restart it."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A quick test for the supervisor case",
      "x": "Kill the process, wait three seconds, and run your `lsof` command again. A new PID on the same port means a restart policy. The same PID means your signal never landed, which usually means the process belongs to another user or is stuck in uninterruptible sleep."
    },
    {
      "t": "h2",
      "x": "Stopping it in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify the listener",
          "x": "Get the PID and the command line together, so you know whether you are stopping your own dev server or something that matters.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Ask politely",
          "x": "Plain `kill` sends `SIGTERM`, which a well-written server catches so it can close connections, flush logs and remove its PID file.",
          "code": "kill 12345"
        },
        {
          "title": "Give it a moment, then check",
          "x": "A graceful shutdown waits for in-flight requests. A couple of seconds is normal, and a server holding a long-poll or websocket connection can take longer.",
          "code": "sleep 2 && lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught or ignored. It is also the reason you find stale lock files, orphaned temp directories, and database sessions that stay open until a server-side timeout clears them.",
          "code": "kill -9 12345"
        },
        {
          "title": "Confirm the port is genuinely free",
          "x": "An empty result from your listener query is the only confirmation worth having. Your own server starting is a nice bonus.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo 'port is free'"
        }
      ]
    },
    {
      "t": "h2",
      "x": "When nothing owns the port and it still fails"
    },
    {
      "t": "p",
      "x": "Occasionally the search comes up empty and the bind keeps failing anyway. Four explanations are worth checking, roughly in the order they tend to turn out to be the answer."
    },
    {
      "t": "ol",
      "items": [
        "**You are not root and the holder is.** `lsof` and `ss` only show process details for sockets you own. Re-run the command with `sudo` before concluding that the port is free.",
        "**A socket is in TIME_WAIT.** A closed TCP connection lingers for twice the maximum segment lifetime, commonly around a minute on Linux, so that late packets cannot be delivered to a new connection by mistake. Most server libraries set `SO_REUSEADDR` and are unaffected. Python's `socketserver` is the classic exception, which is why so many Flask and Django examples set `allow_reuse_address = True`.",
        "**Windows has reserved the range.** Hyper-V, WSL2 and Docker Desktop reserve blocks of dynamic ports, and a reserved port fails to bind with no owner to find. Run `netsh interface ipv4 show excludedportrange protocol=tcp` in an elevated prompt to see them.",
        "**It is a different error wearing a similar message.** Binding to a port below 1024 without privileges gives `EACCES`. Binding to an IP address the machine does not have gives `EADDRNOTAVAIL`. Read the code, not the prose."
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "SO_REUSEPORT is not the fix for this",
      "x": "`SO_REUSEADDR` lets you bind over a socket left in `TIME_WAIT`. `SO_REUSEPORT` is a different option that lets several live processes share one listening port while the kernel spreads connections between them. Set the second one by accident and you get no error at all, just two versions of your server splitting requests, which is a far worse debugging session than the one you started with."
    },
    {
      "t": "h2",
      "x": "Containers, and the port that is taken twice"
    },
    {
      "t": "p",
      "x": "A published container port is held on the host by a proxy process, not by anything inside the container, so the process name you find will not look like your application. Stop the container instead of the process. `docker compose down` beats `docker stop` for a stack with more than one service, because a half-stopped stack has a habit of leaving exactly one port occupied."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container published this port?\ndocker ps --filter publish=3000\n\n# Bring the whole stack down, including containers Compose no longer tracks\ndocker compose down --remove-orphans\n\n# What the daemon believes is mapped\ndocker port <container>"
    },
    {
      "t": "p",
      "x": "WSL2 adds a second place to look. A server inside WSL is reachable from Windows through a proxy, and a Windows process on the same port can block that mapping without ever appearing in `ss` output on the Linux side. Check both before deciding which one to stop. If the container stops instead of starting, [why Docker containers exit immediately](/guides/docker-container-exits-immediately/) covers the other half of this problem."
    },
    {
      "t": "h2",
      "x": "Making it stop happening"
    },
    {
      "t": "p",
      "x": "The fix is a shutdown handler. Most projects never add one, which is exactly why the dev server outlives the terminal that started it."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`)\n})\n\n// Close the listener, then stop waiting after a grace period.\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0))\n    setTimeout(() => process.exit(1), 5000).unref()\n  })\n}\n\n// Fail with something readable instead of a stack trace.\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is in use. Find the holder with:`)\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`)\n    process.exit(1)\n  }\n  throw err\n})"
    },
    {
      "t": "p",
      "x": "The `unref()` on that timer matters. Without it, the timer keeps the event loop alive for the full five seconds even after every connection has closed, turning a clean shutdown into a five-second pause on every Ctrl-C."
    },
    {
      "t": "p",
      "x": "For tests, bind to port `0`. The kernel picks a free ephemeral port and `server.address().port` tells you which one, so parallel test workers stop fighting over a hardcoded number. Do not do the same in development. Frameworks that silently increment to the next free port hide the orphan instead of reporting it, and a moving port quietly breaks OAuth redirect URIs, CORS allowlists and any documentation that names a URL. A loud failure is the better trade, even though it costs you thirty seconds now and again."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The opposite symptom: a container that will not stay up at all.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Connection refused means nothing is listening. Same layered method, other direction.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnosing CORS errors",
          "desc": "Useful once a changed port has quietly invalidated your allowed origins.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is running on port 3000?",
          "a": "On macOS or Linux, run `lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, then `kill <pid>`. On Windows, `netstat -ano | findstr :3000` gives the PID and `taskkill /PID <pid> /F` ends it. Check what the process is first. On 5432 or 6379 you are probably looking at a database you would rather keep."
        },
        {
          "q": "Why is the port still in use after the server crashed?",
          "a": "Because something is still running. Dev tools spawn child processes, and killing the parent orphans the child instead of stopping it. The orphan keeps the socket and reports a parent PID of 1. A restart policy under systemd, pm2 or Docker will also put a new process on the port within seconds of the old one dying."
        },
        {
          "q": "What does EADDRINUSE mean in Node?",
          "a": "It is the error from the bind system call, surfaced through `listen`. The address and port combination you asked for is already claimed. Node reports it with `code: 'EADDRINUSE'` and a platform-specific `errno`, which is -98 on Linux and -48 on macOS."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "It is safe for the machine and unkind to the process. `SIGKILL` cannot be caught, so no cleanup code runs: lock files stay, temporary directories stay, and open database sessions persist until a server-side timeout clears them. Try plain `kill` first and escalate only when the process ignores it."
        },
        {
          "q": "lsof shows nothing but the port is still unavailable. What now?",
          "a": "Run the command again with sudo, since you only see details for sockets you own. Then check for a reserved Windows port range with `netsh interface ipv4 show excludedportrange protocol=tcp`, a container proxy on the host, or a socket sitting in TIME_WAIT if your server does not set SO_REUSEADDR."
        },
        {
          "q": "Why does port 5000 fail on macOS?",
          "a": "AirPlay Receiver listens on port 5000 on recent macOS versions, which is why a Flask app on its default port stopped working for a lot of people after an OS upgrade. Turn AirPlay Receiver off in System Settings under General, or use a different port. Confirm the setting on your own machine first, since Apple has moved this control between releases."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-14",
  "updated": "2026-09-14",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
