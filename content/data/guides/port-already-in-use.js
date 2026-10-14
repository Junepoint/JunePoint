module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: name the process, then free it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means another socket holds the port. Name the owner with lsof, ss or netstat, kill it in the right order, and stop it recurring.",
  "standfirst": "One command names the process holding the port. The harder question is why it survived the crash, and the answer is usually a child process still holding the listening socket.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port",
    "lsof port in use",
    "node eaddrinuse 3000"
  ],
  "cardDesc": "Name the process on a busy port, kill it in the right order, and fix the restart loop that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is not a stale lock file or a cache you can clear. Something is bound to that address and port right now, and the kernel knows which process it is.",
        "One command names the owner: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `sudo ss -ltnp` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash, the usual cause is a child process that inherited the listening socket and outlived its parent. The PID you remember is gone. The socket is not.",
        "Send `SIGTERM` and wait a second before escalating. `kill -9` skips your shutdown path, which is exactly how you orphan a child and create the same problem again tomorrow.",
        "If the failure is `EACCES` rather than `EADDRINUSE`, this is a permission problem instead: a port below 1024, or a reserved range on Windows."
      ]
    },
    {
      "t": "h2",
      "x": "Name the process before you kill anything"
    },
    {
      "t": "p",
      "x": "Start here. Every operating system can map a listening port back to a process ID, and guessing costs more time than typing the command."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed (sudo for the process column)\nsudo ss -ltnp \"sport = :3000\"\n\n# Linux, blunt but effective\nfuser -v 3000/tcp\n\n# Windows, cmd\nnetstat -ano | findstr :3000\n\n# Windows, PowerShell\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "p",
      "x": "The flags matter more than they look. `-n` stops `lsof` resolving hostnames and `-P` stops it rewriting 3000 as a service name, so the output returns immediately and contains the number you searched for. `-sTCP:LISTEN` drops the established connections that merely use that port, which is the difference between one line of output and forty."
    },
    {
      "t": "p",
      "x": "On Linux, `ss -ltnp` needs root to fill in the process column. Run it unprivileged and you get the socket with an empty `users:` field, which confirms the port is busy but not who owns it. `sudo` is the fix, not a different tool."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Read the whole line, not just the PID",
      "x": "`lsof` prints the command, the PID, the user and the address. When the command is `com.docke`, `docker-pr`, `ControlCe` or `systemd`, killing that PID is the wrong move. The sections below cover each of those cases."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the process is yours",
          "x": "Check the user and the command name against what you expected to be running. A port held by `root` on a shared machine is not yours to free.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Ask politely first",
          "x": "`SIGTERM` lets the process run its shutdown handler, close the listener and reap its children. A well-behaved server exits in well under a second.",
          "code": "kill 48123\nsleep 1\nlsof -nP -iTCP:3000 -sTCP:LISTEN   # expect no output"
        },
        {
          "title": "If the port is still held, signal the group",
          "x": "A surviving child is holding the descriptor. Look up the process group, then signal the whole group by passing a negative number.",
          "code": "ps -o pid,pgid,ppid,command -p 48123\nkill -TERM -48123     # the minus means process group, not PID\nkill -KILL -48123     # last resort"
        },
        {
          "title": "On Windows, add /T",
          "x": "`/T` ends the whole process tree, which is the closest equivalent to signalling a group. Without it you orphan the children and the port stays bound.",
          "code": "taskkill /PID 48123 /T /F"
        }
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "`pkill node` is not a fix",
      "x": "It also kills your language server, your test watcher, your editor's TypeScript process and any other Node program on the machine. On a CI runner it can kill the build that is running it. Target the PID the port lookup gave you."
    },
    {
      "t": "h2",
      "x": "Why the port survived the crash"
    },
    {
      "t": "p",
      "x": "A listening socket belongs to a file descriptor, not to a program name. Fork a process and the child gets its own copy of that descriptor. The port stays bound while any copy is open, so your parent can die, your shell can print the stack trace, and the kernel will still refuse the next `bind()`."
    },
    {
      "t": "p",
      "x": "That one fact explains most of what you will run into:"
    },
    {
      "t": "ul",
      "items": [
        "**A worker outlived its parent.** Cluster workers, a `concurrently` child, a spawned Python subprocess, a Vite or webpack child, a debugger wrapper. Any of them can hold the descriptor. `ps -ef | grep <your-entry-point>` normally finds it in one go.",
        "**The watcher restarted faster than the old process exited.** `nodemon`, `tsx watch`, `air` and `gunicorn --reload` signal the old process and start the replacement. If your shutdown path takes two seconds, the replacement loses the race and dies with `EADDRINUSE`.",
        "**Nothing actually crashed.** A handler threw, the process stayed up, and the port is held by the server you believe is dead. Check whether the old process still answers a request before you go hunting.",
        "**You detached it yourself.** A trailing `&`, a `nohup`, a `tmux` pane or an editor task from yesterday. Closing a terminal window does not reliably close what it started.",
        "**Docker owns the host port.** The host side of a published port is held by the daemon's proxy, and `docker ps` plus `docker port <container>` will show it. Stopping the container is the fix.",
        "**Last week's `kill -9` caused this week's problem.** `SIGKILL` cannot be caught, so the parent never reaps anything. Its children are reparented to init and carry on listening."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Breaking the orphan loop",
      "x": "Handle `SIGINT` and `SIGTERM` in the parent, close the server, then signal the children and exit. Twenty lines removes the whole class of problem, and it makes `docker stop` finish in a second instead of waiting out the ten second timeout before Docker sends `SIGKILL` for you."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT: real, but rarely your problem"
    },
    {
      "t": "p",
      "x": "The most repeated answer to `EADDRINUSE` is `TIME_WAIT`, and for a development server it is usually wrong. `TIME_WAIT` is the state a closed connection sits in, and it holds a four-tuple: local address, local port, remote address, remote port. A new listener on that local port is a different kind of socket, and the kernel allows it as long as the process asked for `SO_REUSEADDR` before binding."
    },
    {
      "t": "p",
      "x": "Node, Go's `net.Listen` and Python's `http.server` set that option for you on Unix, which is why they restart cleanly after serving thousands of connections. Hand-rolled socket code is where the problem is real. `socketserver.TCPServer` in the Python standard library leaves `allow_reuse_address` false, so a plain subclass refuses to rebind while old connections linger."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket, socketserver\n\nclass Server(socketserver.TCPServer):\n    allow_reuse_address = True        # sets SO_REUSEADDR before bind()\n\n# Raw sockets: set the option before bind(), never after.\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind((\"0.0.0.0\", 8080))\ns.listen(128)"
    },
    {
      "t": "p",
      "x": "Keep two options apart. `SO_REUSEADDR` lets you rebind over lingering connections, while `SO_REUSEPORT` lets several live processes bind the same port and share the incoming load. The second is a scaling feature. Reaching for it to silence a conflict hides a real conflict: you end up with two servers answering alternate requests and no error to tell you."
    },
    {
      "t": "p",
      "x": "On Linux the `TIME_WAIT` duration is a kernel constant of 60 seconds and no `sysctl` changes it. On macOS it derives from `net.inet.tcp.msl`, so read that value on your own machine rather than trusting a number from a blog post, including this one."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reach for tcp_tw_recycle",
      "x": "`net.ipv4.tcp_tw_recycle` was removed from Linux in 4.12 because it silently broke connections from clients behind NAT. Any advice still recommending it predates that removal. `tcp_tw_reuse` is narrower and much safer, but it applies to outgoing connections, so neither knob will fix a dev server that refuses to restart."
    },
    {
      "t": "h2",
      "x": "Errors that look like a busy port but are not"
    },
    {
      "t": "table",
      "head": [
        "Error",
        "What it actually means",
        "Next step"
      ],
      "rows": [
        [
          "`EADDRINUSE`",
          "Another socket holds that address and port.",
          "Name the PID, then signal it."
        ],
        [
          "`EACCES` on bind",
          "You lack permission for the port, not that it is taken.",
          "Ports below 1024 need root or `CAP_NET_BIND_SERVICE`. Use a high port in development."
        ],
        [
          "`port is already allocated`",
          "Docker's own words: the daemon holds the host side of a published port.",
          "Run `docker ps -a`, then stop or remove the container that owns the mapping."
        ],
        [
          "`EADDRNOTAVAIL`",
          "The address you asked for does not exist on this host.",
          "You bound to an IP the machine does not have. Look for a stale `--host` flag."
        ],
        [
          "`Only one usage of each socket address`",
          "The Windows wording for the same conflict.",
          "Use `netstat -ano`, then `taskkill /PID <pid> /T /F`."
        ]
      ],
      "caption": "Reading the error string precisely saves a round of killing innocent processes."
    },
    {
      "t": "p",
      "x": "Two platform quirks produce especially confusing results. On macOS, AirPlay Receiver listens on ports 5000 and 7000, and `lsof` reports the owner as `ControlCenter`. Switch the feature off in System Settings, under General, then AirDrop and Handoff, or move your app to another port. Do not kill `ControlCenter`."
    },
    {
      "t": "p",
      "x": "On Windows, Hyper-V and WSL2 reserve blocks of ports for their own use, and a bind inside a reserved block fails even though nothing is listening on it. The command below prints the reserved ranges. If your port falls inside one, the quickest answer is a different port."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Reserved ranges that will refuse a bind with nothing listening\nnetsh interface ipv4 show excludedportrange protocol=tcp\n\n# Dynamic range Windows hands out to clients; avoid app ports inside it\nnetsh int ipv4 show dynamicport tcp"
    },
    {
      "t": "h2",
      "x": "Design the problem out"
    },
    {
      "t": "p",
      "x": "A busy port is a symptom of two fixable things: a process that does not shut down cleanly, and a port that is hard-coded. Both are a few lines of work."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "import http from 'node:http';\n\nconst server = http.createServer(handler);\nconst port = Number(process.env.PORT) || 3000;\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`port ${port} is in use. Find it with:`);\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\n// Pass 0 in tests and the kernel picks a free port for you.\nserver.listen(port, () => {\n  console.log('listening on', server.address().port);\n});\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n    // An idle keep-alive connection can hold close() open indefinitely.\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "Three things changed there. The error now tells the next person what to run, the port comes from the environment so two checkouts of the same service can run side by side, and the shutdown handler closes the listener rather than leaving it to be killed. In tests, listen on port `0` and read `server.address().port`. That removes port conflicts from CI for good."
    },
    {
      "t": "p",
      "x": "One caveat on `server.close()`: it stops accepting new connections but waits for existing ones to finish, and a browser holding an idle keep-alive connection will keep it waiting. The timeout above is the pragmatic answer. Node 18.2 and later also provide `server.closeIdleConnections()` and `server.closeAllConnections()`, which are more precise when you can rely on that version being present."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of the story when a container holds or releases a port unexpectedly.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Postgres connection refused",
          "desc": "Connection refused is the opposite symptom: nothing is listening where you expected.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "When the process dies before it ever reaches listen(), start with module resolution.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "Get the PID, then signal it. `lsof -nP -iTCP:3000 -sTCP:LISTEN` prints it on macOS and Linux, `kill <pid>` asks the process to stop, and `kill -9 <pid>` forces it. On Windows, `netstat -ano | findstr :3000` gives the PID for `taskkill /PID <pid> /T /F`. `npx kill-port 3000` wraps the same lookup if you would rather not remember flags."
        },
        {
          "q": "Why does the port say it is in use when nothing is running?",
          "a": "Something is running, just not where you are looking. The usual answers are an orphaned child process holding the inherited listening socket, a Docker container holding the host side of a published port, or a process you detached from a terminal you have since closed. If the lookup genuinely returns nothing and the bind still fails, check the error code: `EACCES` and a Windows reserved port range both look like a busy port but are not."
        },
        {
          "q": "Is it safe to kill -9 a process on a port?",
          "a": "It frees the port, and it costs you the shutdown path. The process cannot flush logs, finish in-flight requests, release a database advisory lock or reap its children, so `kill -9` is a reasonable second attempt and a poor first one. Try `kill <pid>`, wait a second, then escalate."
        },
        {
          "q": "Why do I only get EADDRINUSE after my app crashes?",
          "a": "Because the crash took out the parent and left a child holding the listening socket. The descriptor is reference counted, so the port remains bound while any process holds a copy. Kill the process group with `kill -TERM -<pgid>`, and add a signal handler so the next crash cleans up after itself."
        },
        {
          "q": "How long does a port stay in TIME_WAIT?",
          "a": "On Linux it is 60 seconds, fixed in the kernel and not changeable through `sysctl`. On macOS and the BSDs it comes from `net.inet.tcp.msl`, so check the local value. For a listening server this rarely matters, because `SO_REUSEADDR` lets you bind over lingering connections, and most runtimes set it for you."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, with `SO_REUSEPORT` on Linux and the BSDs, where the kernel distributes incoming connections between them. That is a scaling tool, not a conflict fix. Using it to silence `EADDRINUSE` gives you two servers answering alternate requests, which is far harder to debug than the error you started with."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-14",
  "updated": "2026-10-14",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
