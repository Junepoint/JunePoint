module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: find the process, then free it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE explained: find the process holding a port on macOS, Linux or Windows, kill it safely, and stop it recurring after a crash.",
  "standfirst": "The commands that identify the real owner of a port, the reasons a crashed server keeps holding one, and the shutdown code that prevents a repeat.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "find process using port",
    "address already in use"
  ],
  "cardDesc": "Identify what holds a port, free it safely, and fix the crash that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Identify the owner before killing anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `ss -ltnp 'sport = :3000'` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the port is rarely held by the kernel. It is usually held by a child process your shell never reaped, or by a second copy of the app you forgot about.",
        "`TIME_WAIT` is the most repeated explanation online and the wrong one for most servers, because Node and Werkzeug already set `SO_REUSEADDR`.",
        "`kill -9` first leaves half-written files and orphaned grandchildren. Send `SIGTERM`, wait a second, escalate only if the process ignores you.",
        "If nothing shows up as the owner, suspect a reserved port range on Windows or WSL2, a container publishing the port, or a listener bound to a different address than the one you filtered on."
      ]
    },
    {
      "t": "h2",
      "x": "Find the owner before you kill anything"
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` is not ambiguous. The kernel is telling you that some process already holds a listening socket on that address and port, and it will not hand it to a second one. So the first move is never to kill something. It is to ask who."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: what is listening on TCP 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Windows, cmd or PowerShell\nnetstat -ano | findstr :3000\n\n# Windows, PowerShell, with the process name resolved for you\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "p",
      "x": "Two flags matter in the `lsof` call. `-n` skips DNS lookups, which is why it returns instantly instead of hanging for ten seconds, and `-P` keeps the port as a number rather than printing `hbci` or some other name from `/etc/services`. The `-sTCP:LISTEN` filter is what separates the process holding the port from the dozen browser tabs merely connected to it."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Both tools lie quietly without root",
      "x": "`lsof` and `ss` show process details only for sockets your own user owns. If a port is held by a daemon running as `root`, `postgres` or `www-data`, a plain `ss -ltnp` prints the socket with an empty process column and `lsof` may print nothing at all. Re-run with `sudo` before concluding that the port is free."
    },
    {
      "t": "p",
      "x": "Once you have a PID, resolve it to a full command line. The difference between `node dist/server.js` left over from a previous run and `node` under a VS Code debug session changes what you should do next."
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
          "`netstat -ano | findstr :3000`"
        ],
        [
          "PID to command line",
          "`ps -p PID -o command=`",
          "`ps -p PID -o cmd=` or `cat /proc/PID/cmdline`",
          "`Get-Process -Id PID | Format-List *`"
        ],
        [
          "Ask it to stop",
          "`kill PID`",
          "`kill PID`",
          "`taskkill /PID PID`"
        ],
        [
          "Force it to stop",
          "`kill -9 PID`",
          "`kill -9 PID`",
          "`taskkill /PID PID /F`"
        ],
        [
          "Blunt one-liner",
          "`lsof -ti:3000 | xargs kill`",
          "`fuser -k 3000/tcp`",
          "`npx kill-port 3000`"
        ]
      ],
      "caption": "Replace 3000 and PID with your own values. The last row is convenient and the least careful: it kills by port without telling you what it hit."
    },
    {
      "t": "h2",
      "x": "The message names the interface, which is a clue"
    },
    {
      "t": "p",
      "x": "Node prints the address it tried to bind, and that detail is worth reading rather than skipping:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000"
    },
    {
      "t": "p",
      "x": "`:::3000` is the IPv6 wildcard address, meaning the server asked for every interface. If you had passed a host explicitly you would see `127.0.0.1:3000` instead. That distinction explains one of the more confusing variants of this problem: a process bound to `0.0.0.0:3000` blocks a later attempt to bind `127.0.0.1:3000`, because the wildcard already covers the loopback address. Filter `lsof` on the loopback address alone and you will miss the culprit entirely."
    },
    {
      "t": "p",
      "x": "The same condition surfaces with different wording depending on the runtime. Python raises `OSError: [Errno 98] Address already in use` on Linux and `[Errno 48]` on macOS, because the two kernels number the errno differently. Windows reports `[WinError 10048] Only one usage of each socket address (protocol/network address/port) is normally permitted`. Docker's failure arrives from the daemon and ends in `bind: address already in use`. A second Node debug session gives you `Starting inspector on 127.0.0.1:9229 failed: address already in use`, which is a separate port from your app and a separate problem to fix."
    },
    {
      "t": "h2",
      "x": "Why the port survives a crash"
    },
    {
      "t": "p",
      "x": "A crashed process releases its sockets. The kernel does that cleanup whether or not your code was tidy about it, so if the port is still held, something is still alive. In rough order of how often each one turns out to be the answer:"
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child.** `npm start` runs a shell, which runs your server. Ctrl+C sends `SIGINT` to the foreground process group, but a child that was detached, double-forked, or started by a watcher that already died never receives it. The parent exits, your prompt returns, and the grandchild keeps the socket.",
        "**A second copy you forgot.** Another terminal tab, a `docker compose up -d` from last week, a run configuration still active in your editor. This is the most common cause by a wide margin and the easiest to confirm, because the command line you resolved from the PID will look exactly like the one you are trying to start.",
        "**A supervisor doing its job.** systemd with `Restart=always`, pm2, or a container with `restart: unless-stopped` will bring the process back within a second of your killing it. You free the port, your start fails anyway, and nothing you did appears to have worked. Stop the supervisor, not the process.",
        "**The old process is still shutting down.** A server draining keep-alive connections holds its listening socket until `close()` finishes. Give it a second and try again before reaching for `kill -9`.",
        "**Sockets in `TIME_WAIT`.** Real, but rarer than the internet suggests. See below."
      ]
    },
    {
      "t": "p",
      "x": "The `TIME_WAIT` story deserves correcting, because it is the accepted answer on a lot of questions where it is not the cause. When a server closes, the connections it had accepted linger in `TIME_WAIT` for up to two minutes, and those sockets carry the server's local port. Without `SO_REUSEADDR`, a fresh bind to that port fails. The catch is that most things you are likely to be running already set that option: Node sets it on every `listen`, Werkzeug and Python's `http.server` set it, and Go's net package sets it. A bare `socketserver.TCPServer` subclass does not, which is the classic case where `TIME_WAIT` genuinely is your problem. Check before believing it with `ss -tan 'sport = :3000'`: if you see `LISTEN`, a process owns the port and `TIME_WAIT` is irrelevant."
    },
    {
      "t": "p",
      "x": "There is a stranger variant on Linux. `SO_REUSEPORT` lets several processes bind the same port deliberately, so load balances across them. If a library enables it, you can start four servers on port 3000 with no error at all, and roughly a quarter of your requests will reach the stale one. That looks like caching, or like a bad deploy, long before it looks like a port problem."
    },
    {
      "t": "h2",
      "x": "Kill it without collateral damage"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm what you are about to kill",
          "x": "Resolve the PID to its command line and read it. A port number you associate with your dev server is not proof: 5432 is Postgres, 6379 is Redis, 8080 might be a company VPN helper, and 5000 on macOS is the AirPlay Receiver rather than anything you installed.",
          "code": "ps -p 48213 -o pid,ppid,user,command="
        },
        {
          "title": "Send SIGTERM and wait",
          "x": "Plain `kill` sends `SIGTERM`, which a well-behaved server handles by finishing in-flight requests, flushing logs and closing database pools. Give it a second or two, then check whether the port is free.",
          "code": "kill 48213\nsleep 1\nlsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`kill -9` cannot be caught or deferred. The process loses the chance to clean up, which in practice means truncated files, abandoned lock files and orphaned children that reparent to init and keep running. Use it as a second step, not a first.",
          "code": "kill -9 48213"
        },
        {
          "title": "Check the parent, not just the child",
          "x": "If the process reappears with a new PID, read the `ppid` column from step one. A watcher or supervisor is restarting it, and killing the child forever is a game you lose. Stop the thing above it instead.",
          "code": "pm2 stop api\n# or\nsudo systemctl stop myapp\n# or\ndocker compose stop api"
        },
        {
          "title": "Sweep up orphaned siblings",
          "x": "A crashed watcher often leaves several processes behind, only one of which holds the port. Listing them by pattern before killing anything is safer than a wildcard kill, which has an unpleasant habit of matching the `grep` you typed.",
          "code": "pgrep -af 'node .*server'"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not put kill-by-port in a start script",
      "x": "`lsof -ti:5432 | xargs kill -9` in a `predev` hook will one day take out the Postgres instance that holds your colleague's staging data, and it will do so silently. If you want automation, make it print what it found and ask. A script that kills an unknown PID because a port number matched is not a fix, it is a scheduled outage."
    },
    {
      "t": "h2",
      "x": "When nothing appears to own the port"
    },
    {
      "t": "p",
      "x": "Sometimes `lsof` and `netstat` come back empty and the bind still fails. The port is not held by a process in that case, so look for one of these."
    },
    {
      "t": "ul",
      "items": [
        "**A reserved range on Windows.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ports for dynamic use, and a reserved port cannot be bound even though nothing is listening. Run `netsh int ipv4 show excludedportrange protocol=tcp` and check whether your port falls inside a range. Restarting the `winnat` service releases the reservations, after which you can claim the port before anything else does.",
        "**You filtered on the wrong address.** As above, a wildcard listener blocks a loopback bind. Drop the host filter and list everything on the port.",
        "**A container publishing it.** `docker ps --filter publish=3000` finds containers mapping the port. On Docker Desktop the holder is a proxy process rather than your container, so the host-side process name tells you nothing useful.",
        "**A permissions error you misread.** Binding below port 1024 as a normal user gives `EACCES`, not `EADDRINUSE`. If your error is `listen EACCES: permission denied 0.0.0.0:80`, no port is in use and killing things will not help. Run behind a reverse proxy, or grant the capability deliberately.",
        "**A service you did not know was installed.** IIS on 80, Apache from an old Homebrew install, an antivirus web filter, a printer utility. `sudo lsof -nP -iTCP -sTCP:LISTEN` with no port filter lists every listener on the machine and often ends the search in one line."
      ]
    },
    {
      "t": "h2",
      "x": "Make the next crash harmless"
    },
    {
      "t": "p",
      "x": "Freeing the port is the symptom. The cause is usually that your server has no shutdown path, so it either ignores signals or exits with connections still open. Two small pieces of code remove most of the recurrence: handle the signals, and fail with a message that tells you what to run."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "import http from 'node:http'\n\nconst port = Number(process.env.PORT ?? 3000)\nconst server = http.createServer(handler)\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is taken. Find the owner with:`)\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`)\n    process.exit(1)\n  }\n  throw err\n})\n\nserver.listen(port)\n\nlet closing = false\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => {\n    if (closing) process.exit(1)      // a second Ctrl+C means stop waiting\n    closing = true\n    server.close(() => process.exit(0))\n    server.closeIdleConnections?.()   // Node 18.2 and later\n    setTimeout(() => process.exit(1), 5000).unref()\n  })\n}"
    },
    {
      "t": "p",
      "x": "The detail that catches people out is that `server.close()` stops accepting new connections but waits for existing ones, and a browser holding a keep-alive connection open will happily make it wait. Without `closeIdleConnections` or the timeout, your Ctrl+C looks like a hang, you press it again or reach for `kill -9`, and you are back where you started. The `unref()` on the timer matters too: without it, the timer itself keeps the event loop alive for the full five seconds even after a clean close."
    },
    {
      "t": "p",
      "x": "For tests, stop choosing ports at all. Passing `0` asks the kernel for any free port, which removes the entire class of failure where two suites race for 3000 on a build machine."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0)\nconst { port } = server.address()\nconst baseUrl = `http://127.0.0.1:${port}`"
    },
    {
      "t": "p",
      "x": "A few habits help beyond the code. Give each project a distinct dev port so a forgotten process announces which project it belongs to. Prefer `docker compose down` over closing the terminal, since detached containers survive both the terminal and the reboot in some configurations. If your watcher restarts the server, check that it forwards signals rather than spawning detached children: nodemon sends `SIGUSR2` for restarts, and code that only listens for `SIGTERM` will not clean up between reloads."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` gives you the PID, then `kill PID`. On Windows, `netstat -ano | findstr :3000` gives the PID in the last column, then `taskkill /PID 1234`. Read the command line first: the port tells you nothing about whether the process is yours."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group. If your server was started through a shell wrapper, a watcher, or anything that detached it, the child never gets the signal and keeps the socket after your prompt comes back. Check the parent PID of whatever holds the port, and stop that instead."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "It is safe for the port and unkind to everything else. `SIGKILL` cannot be handled, so the process cannot flush buffers, release locks or shut down its children. Try `kill` on its own first and escalate after a second or two. Databases and anything writing files deserve the polite signal."
        },
        {
          "q": "lsof shows nothing but I still get EADDRINUSE. What now?",
          "a": "Three likely causes. You are not root, so you cannot see another user's socket; re-run with `sudo`. You filtered on an address that the actual wildcard listener does not match. Or you are on Windows or WSL2 and the port sits in a reserved range, which you can check with `netsh int ipv4 show excludedportrange protocol=tcp`."
        },
        {
          "q": "Does EADDRINUSE always mean two servers are running?",
          "a": "Almost always, but not quite. The port can also be blocked by sockets left in `TIME_WAIT` from a previous run if the server does not set `SO_REUSEADDR`, or reserved by the operating system. Running `ss -tan 'sport = :3000'` separates the cases: a `LISTEN` row means a live process, while only `TIME_WAIT` rows mean a socket option problem."
        },
        {
          "q": "How do I stop tests fighting over the same port?",
          "a": "Listen on port `0` and read the assigned port back from `server.address()`. The kernel hands out a free one, so parallel suites and CI runners stop colliding. Hard-coding a port in tests works until the day two jobs share a machine."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker Container Exits Immediately",
          "desc": "The sibling problem: a container that will not stay up, and how to read its exit code.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL \"Connection Refused\"",
          "desc": "The opposite error. Nothing is listening where you expected, checked layer by layer.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node \"Cannot find module\"",
          "desc": "When the server never reaches the point of binding a port at all.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-30",
  "updated": "2026-10-30",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
