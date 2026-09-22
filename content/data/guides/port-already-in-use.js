module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: finding and freeing it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means a live process still holds the port. Find its PID, stop it safely, and fix the crash path that left it bound.",
  "standfirst": "Commands to identify and stop whatever holds a port on Linux, macOS and Windows, plus the reason a dev server so often outlives the crash that should have ended it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Find the PID holding a port, stop it safely, and fix the shutdown path that leaves it bound after a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Almost always, a live process still holds the port. Find it with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, or `ss -ltnp | grep ':3000'` on Linux.",
        "Send SIGTERM first with plain `kill <pid>`. Escalate to `kill -9` only after a few seconds, because SIGKILL skips cleanup and orphans child processes.",
        "After a crash, the usual culprit is a child that outlived its parent. Shells, `npm run`, nodemon and concurrently all forward signals imperfectly.",
        "TIME_WAIT is rarely the cause for a server that sets `SO_REUSEADDR`, which Node and Go do by default on Unix. If waiting 60 seconds fixed it, something exited during those 60 seconds.",
        "`0.0.0.0:3000` collides with `127.0.0.1:3000`. Two listeners on port 3000 can coexist if each binds a different specific address."
      ]
    },
    {
      "t": "h2",
      "x": "What EADDRINUSE actually means"
    },
    {
      "t": "p",
      "x": "It is the kernel refusing your `bind()` call. The operating system keeps one table of bound sockets, and a second listener on the same address and port is rejected before your framework sees a single request. Nothing about your application code is wrong. Your application is just second in line."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see",
        "Notes"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "The `:::3000` form means it tried to claim every address, IPv6 and IPv4 alike."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 on Linux, errno 48 on macOS. Same condition, different number."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Spring Boot wraps this in a startup failure message that names the port."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "The address prefix tells you whether it asked for all interfaces or one."
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "Wording varies across Docker versions; newer builds phrase it as ports not being available."
        ]
      ],
      "caption": "One kernel error surfaced by five runtimes."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Address plus port, not port alone",
      "x": "A socket binds to an address and a port together. `0.0.0.0:3000` claims every interface, so it collides with anything already sitting on `127.0.0.1:3000`. Bind one server to loopback and another to a specific LAN address and both can hold port 3000 at once. A neighbouring trap: binding below port 1024 without privileges returns `EACCES`, not `EADDRINUSE`. If port 80 gives you EACCES, nobody is holding it. You are simply not allowed to have it."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "p",
      "x": "Query the socket, not the process list. Searching `ps` for `node` finds every Node process on the machine and tells you nothing about which one owns the port."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: listening TCP sockets with owning process\nss -ltnp | grep ':3000'\n# LISTEN 0 511 *:3000 *:*  users:((\"node\",pid=48211,fd=21))\n\n# macOS and Linux: numeric output, TCP listeners only\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 48211\"\n\n# Windows PowerShell, easier to read\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess"
    },
    {
      "t": "p",
      "x": "If the command prints nothing and the bind still fails, you are looking from the wrong vantage point. Both `ss` and `lsof` hide the process details of sockets owned by other users, so run them under `sudo` and look again. A socket inside a container lives in a different network namespace and will not appear in the host's list under a recognisable name. On WSL2, a Windows process and a Linux process have separate views of what is free, and the forwarding between them blurs which side is really holding the port."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "p",
      "x": "SIGTERM gives the process a chance to run its shutdown path: flush logs, close database handles, remove a lock file, deregister a service discovery entry. SIGKILL gives it nothing. Ask politely, wait a couple of seconds, then escalate."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Polite. Most servers run a shutdown handler on SIGTERM.\nkill 48211\n\n# Still there after a few seconds? Now force it.\nkill -9 48211\n\n# Linux shortcut: kill whatever listens on the port\nfuser -k 3000/tcp\n\n# macOS one-liner. Run it without the xargs half first, and read the output.\nlsof -ti tcp:3000 | xargs kill\n\n# Windows\ntaskkill /PID 48211 /F"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Read the PID before you kill it",
      "x": "`fuser -k` and `lsof -ti ... | xargs kill` destroy whatever they match. That is fine for your own dev server and much less fine when the thing on that port turns out to be a shared database or a colleague's session on a build box. There is a second failure mode worth knowing: force-killing a supervisor such as nodemon leaves its children running, and those children are often the ones actually holding the socket. You kill the parent, the port stays bound, and the evidence now looks supernatural."
    },
    {
      "t": "h2",
      "x": "Why it survived the crash"
    },
    {
      "t": "p",
      "x": "A stack trace in your terminal feels like an ending. It frequently is not. Three mechanisms account for most ports that stay bound after something went wrong."
    },
    {
      "t": "h3",
      "x": "The process never exited"
    },
    {
      "t": "p",
      "x": "Node keeps running as long as a handle is open, and a listening server is a handle. An error thrown inside a request handler gets caught by Express or Fastify, logged, and turned into a 500. An `uncaughtException` listener that logs and returns leaves the event loop alive with the socket still attached. An unhandled rejection under a configuration that only warns does the same. What you saw was a report, not a death certificate."
    },
    {
      "t": "h3",
      "x": "Ctrl+C reached the parent, not the child"
    },
    {
      "t": "p",
      "x": "Ctrl+C sends SIGINT to the foreground process group of your terminal. That normally includes your dev server. It does not include a process that called `setsid`, one started with `&` and disowned, or one whose parent exited first and left it reparented to init. Modern tool chains stack up the hops: `npm run dev` starts a shell, the shell starts nodemon, nodemon starts your app. Each hop is another opportunity for a signal to be swallowed, delayed or sent to the wrong group. Closing the terminal window instead of pressing Ctrl+C sends SIGHUP, which plenty of processes ignore."
    },
    {
      "t": "h3",
      "x": "Shutdown began and stalled"
    },
    {
      "t": "p",
      "x": "`server.close()` in Node stops accepting new connections, then waits for the existing ones to finish. An idle keep-alive socket from a browser tab you left open half an hour ago counts as existing. The callback never fires, the process never exits, and the port stays bound behind a log line that reads like a clean shutdown. Node 18.2 added `closeAllConnections()` and `closeIdleConnections()` for this exact situation."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(port);\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n\n  // Node 18.2+: stop waiting on idle keep-alive sockets\n  server.closeIdleConnections?.();\n\n  // Backstop, so one stuck connection cannot hold the port forever\n  setTimeout(() => {\n    console.error('Forcing exit after 10s');\n    process.exit(1);\n  }, 10_000).unref();\n}\n\nprocess.on('SIGINT', () => shutdown('SIGINT'));\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));"
    },
    {
      "t": "h2",
      "x": "TIME_WAIT is usually the wrong answer"
    },
    {
      "t": "p",
      "x": "The most repeated explanation online is that the port is stuck in TIME_WAIT and you should wait about a minute. For a listening socket in Node, Go or a `socketserver`-based Python server, that is usually wrong, and believing it costs you the real diagnosis."
    },
    {
      "t": "p",
      "x": "TIME_WAIT belongs to a connection that has already closed. The kernel holds that four-tuple for roughly twice the maximum segment lifetime so a delayed packet cannot land inside a new connection reusing the same endpoints. It does not block a fresh listener when `SO_REUSEADDR` is set, and those runtimes set it on Unix without being asked. A hand-rolled Python script calling `socket.bind()` directly does not set it, which is why raw socket code genuinely can hit the classic TIME_WAIT bind failure that everyone else only reads about. Windows differs again: `SO_REUSEADDR` there has historically allowed one process to steal another's port, so libuv leaves it off and Windows servers rely on `SO_EXCLUSIVEADDRUSE` instead."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "If waiting fixed it, something exited",
      "x": "When a pause of a minute makes the port free, the likely explanation is that the old process finally completed its shutdown, or a supervisor lost patience and killed it. Check `lsof` at the start of the wait and again at the end and you will usually watch the PID disappear. Blaming TIME_WAIT hides a shutdown path that hangs, and that path will hang again during a deploy, where a slow container stop matters considerably more than a slow laptop."
    },
    {
      "t": "h2",
      "x": "When you never started it"
    },
    {
      "t": "p",
      "x": "Sometimes the port was taken before you opened your editor. These are the recurring offenders."
    },
    {
      "t": "ul",
      "items": [
        "**macOS, ports 5000 and 7000.** AirPlay Receiver listens here on recent macOS releases, and `lsof` shows the owner as `ControlCenter` or a truncated form of it. Disable AirPlay Receiver in system settings or move your app to another port. Apple has relocated that setting between releases, so check your own version rather than trusting a screenshot.",
        "**A database you installed and forgot.** Homebrew and apt are both happy to start Postgres on 5432 or MySQL on 3306 at boot. If the symptom is a client that cannot connect rather than a server that cannot start, the layered checks in [Postgres connection refused](/guides/postgres-connection-refused/) apply instead.",
        "**A container.** A published port is held by the Docker proxy, so the owner shows up as `docker-proxy` or a Docker backend process rather than anything you recognise from your project.",
        "**Windows dynamic port exclusions.** Hyper-V and WSL reserve blocks of TCP ports in advance. A bind inside a reserved range fails while nothing at all is listening, which is maddening until you know to look.",
        "**Your own dev server, one port over.** Vite and Next.js move to the next free port and print a line saying so. Your browser then talks to the stale instance on 3000 while you edit code being served on 3001, and every change appears to do nothing."
      ]
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container published this port?\ndocker ps --filter \"publish=3000\"\ndocker stop <container>\n\n# Windows: ranges reserved by Hyper-V or WSL, nothing listening required\nnetsh int ipv4 show excludedportrange protocol=tcp"
    },
    {
      "t": "h2",
      "x": "Prevent the next one"
    },
    {
      "t": "p",
      "x": "The fix is rarely a better kill command. It is a server that reports the problem clearly and a shutdown path that actually completes."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const port = Number(process.env.PORT) || 3000;\nconst server = http.createServer(app);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${port} is already in use. ` +\n      `Check with: lsof -nP -iTCP:${port} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});\n\nserver.listen(port, '127.0.0.1');"
    },
    {
      "t": "ul",
      "items": [
        "**Handle the error where it happens.** One readable line naming the port beats a stack trace that buries the port number three frames down.",
        "**Make the port an environment variable** with a sensible default, so `PORT=3001 npm run dev` is always available as an escape hatch.",
        "**Choose ports nothing else wants.** 3000, 5000, 8000 and 8080 collide across projects constantly. An unfashionable number in the 4000s or 9000s saves more time than it has any right to.",
        "**Handle SIGTERM, not just SIGINT.** `docker stop` sends SIGTERM and force-kills after a grace period, so a container that ignores it loses its cleanup entirely. The other half of that lifecycle is covered in [why containers exit immediately](/guides/docker-container-exits-immediately/).",
        "**Write the kill command down once.** A `\"kill-port\": \"lsof -ti tcp:3000 | xargs kill\"` entry in `package.json` gets reviewed once, instead of being improvised at speed every time."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The mirror image: a process that dies when you wanted it to stay.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Postgres connection refused",
          "desc": "Nothing listening, the opposite symptom with closely related checks.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnosing CORS errors",
          "desc": "Moving a dev server to a new port breaks origins that were hard-coded.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find what is using port 3000?",
          "a": "On macOS run `lsof -nP -iTCP:3000 -sTCP:LISTEN`. On Linux run `ss -ltnp | grep ':3000'`, with `sudo` if the process name comes back blank. On Windows run `netstat -ano | findstr :3000` and match the PID with `tasklist`. All three give you a PID and a process name, which is what you need before deciding whether killing it is safe."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends SIGINT to the terminal's foreground process group, and the process holding the socket may not be in it. Layered tooling is the common cause: npm starts a shell, the shell starts nodemon, nodemon starts your app, and the signal gets lost somewhere in that chain. The other possibility is that your app did receive the signal and began a graceful shutdown that is still waiting on an open keep-alive connection."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "It is safe for the machine and unkind to the program. SIGKILL cannot be caught, so no shutdown handler runs: no log flush, no lock file removal, no in-flight request finished. Try plain `kill` first and give it a few seconds. Reserve `kill -9` for a process that has genuinely wedged, and remember it leaves any children running, including ones that may be holding the port themselves."
        },
        {
          "q": "Why does it say address already in use when lsof shows nothing?",
          "a": "Three usual explanations. You lack permission to see a socket owned by another user, so retry with `sudo`. The listener is inside a container or another network namespace and is invisible from your current view. Or, on Windows, the port sits inside a range reserved by Hyper-V or WSL, where the bind fails despite nothing listening. List those ranges with `netsh int ipv4 show excludedportrange protocol=tcp`."
        },
        {
          "q": "Does rebooting fix EADDRINUSE?",
          "a": "It does, and it teaches you nothing. A reboot kills the orphaned process, which is the entire mechanism. If the port is taken again within minutes of logging back in, something is starting at boot and you should find out what, rather than rebooting twice a day."
        },
        {
          "q": "Can two applications share the same port?",
          "a": "On different addresses, yes: one on `127.0.0.1:3000` and one on `192.168.1.20:3000` coexist fine, because a binding is address plus port. On the same address, no, unless both opt in to `SO_REUSEPORT` on a platform that supports it. That is a load-balancing feature for cooperating worker processes, not a way to run two unrelated servers side by side."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-22",
  "updated": "2026-09-22",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
