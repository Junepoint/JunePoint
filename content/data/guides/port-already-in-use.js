module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is in Use",
  "h1": "EADDRINUSE: finding and freeing a busy port",
  "eyebrow": "Troubleshooting",
  "description": "Why a port stays busy after a crash, how to identify the real listener on Linux, macOS and Windows, and how to free it without killing the wrong process.",
  "standfirst": "EADDRINUSE means something already holds the port you asked for. Nine times out of ten that something is a child process your crashed server left behind.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port in use"
  ],
  "cardDesc": "Identify the real listener on a busy port, free it safely, and stop orphaned children from causing it again.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Find the listener, do not guess: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on Linux and macOS, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "Send SIGTERM first. `kill -9` skips cleanup and is how stale socket files and orphaned children get created in the first place.",
        "The popular `kill -9 $(lsof -ti:3000)` one-liner matches remote ports too, so it can kill your browser instead of your server.",
        "A dead parent does not free the port if a forked child inherited the listening file descriptor. Check for a process whose PPID is 1.",
        "TIME_WAIT is blamed far more often than it is guilty. Most runtimes set `SO_REUSEADDR` and rebind straight over it.",
        "If nothing is listening and the bind still fails, suspect a reserved port range on Windows or a system service on macOS."
      ]
    },
    {
      "t": "h2",
      "x": "Read the error before you act on it"
    },
    {
      "t": "p",
      "x": "The error text carries two pieces of information people skip past: the address and the port. Node prints both."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1872:16)\n    ...\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000"
    },
    {
      "t": "p",
      "x": "`:::3000` is not a typo. It is the IPv6 wildcard address `::` followed by the port, and on most Linux systems a `::` listener accepts IPv4 connections as well, because `net.ipv6.bindv6only` defaults to 0. So \"my other server is only on IPv4\" is not an escape hatch. Other runtimes say the same thing in their own dialect: Python raises `OSError: [Errno 98] Address already in use` on Linux and `[Errno 48]` on macOS, Go returns `listen tcp :3000: bind: address already in use`, and Java throws `java.net.BindException: Address already in use`."
    },
    {
      "t": "p",
      "x": "One distinction matters immediately. If you are binding a port below 1024 without privileges, the failure is `EACCES`, not `EADDRINUSE`. Nothing is holding port 80; you simply are not allowed to have it. Chasing a phantom process there wastes an afternoon."
    },
    {
      "t": "h2",
      "x": "Find the process that actually holds it"
    },
    {
      "t": "p",
      "x": "Ask for listening sockets specifically. A bare port filter returns every socket where that number appears on either end of a connection, which is the root of most of the collateral damage in this topic."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: listeners only, numeric output, with the owning process\nss -lptn 'sport = :3000'\n\n# Linux and macOS\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Nothing printed? You may not own the process.\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux: what is it, and who is its parent?\nps -o pid,ppid,user,etime,args -p 48213"
    },
    {
      "t": "p",
      "x": "On macOS, `netstat` will not give you a PID, so `lsof` is the tool to reach for. On Windows, PowerShell is clearer than `netstat`:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "Get-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Turn that PID into a name\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Then stop it\nStop-Process -Id 18244"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "netstat and findstr lie by prefix",
      "x": "`netstat -ano | findstr :3000` also matches `:30000`, `:30001` and anything else that starts with those characters, because `findstr` does a substring match on the whole line. Add `LISTENING` to the filter and read the port column yourself before you trust the PID."
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Identify the listener",
        "Stop it"
      ],
      "rows": [
        [
          "Linux",
          "`ss -lptn 'sport = :3000'`",
          "`kill <pid>`, then `kill -9 <pid>` if it ignores you"
        ],
        [
          "Linux (blunt)",
          "`fuser 3000/tcp`",
          "`fuser -k -TERM 3000/tcp` (plain `-k` sends SIGKILL)"
        ],
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`kill <pid>`"
        ],
        [
          "Windows (PowerShell)",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Windows (cmd)",
          "`netstat -ano | findstr LISTENING | findstr :3000`",
          "`taskkill /PID <pid>` then `/F` only if needed"
        ],
        [
          "Docker",
          "`docker ps --filter publish=3000`",
          "`docker stop <container>`"
        ]
      ],
      "caption": "Port 3000 used as the example throughout. Substitute your own."
    },
    {
      "t": "h2",
      "x": "The one-liner everyone pastes, and why it bites"
    },
    {
      "t": "p",
      "x": "You will find this recommended everywhere:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Popular. Occasionally destructive.\nkill -9 $(lsof -ti:3000)"
    },
    {
      "t": "p",
      "x": "`lsof -i:3000` matches any socket with 3000 as the **local or the remote** port. A browser tab open on `localhost:3000`, a running test runner, an SSH tunnel forwarding that port, your editor's language server: all of them have sockets whose remote port is 3000, and all of them end up in that PID list. Then `kill -9` removes them without warning. People report their browser or terminal dying and blame the shell."
    },
    {
      "t": "p",
      "x": "The fix is to narrow the query, not to be braver about the kill."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Listening sockets only, which is what you actually meant\nlsof -ti -sTCP:LISTEN -iTCP:3000\n\n# Look first, kill second\nPID=$(lsof -ti -sTCP:LISTEN -iTCP:3000)\nps -o pid,ppid,args -p \"$PID\"\nkill \"$PID\""
    },
    {
      "t": "p",
      "x": "Prefer SIGTERM. A process that handles it closes its listener, flushes logs, removes its PID file and reaps its children. `kill -9` is SIGKILL, which cannot be caught or handled, so none of that happens. Reach for it when SIGTERM has visibly failed, and understand that you are trading a clean exit for speed."
    },
    {
      "t": "h2",
      "x": "Why the port stays busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that feels like the machine is haunted. Your server crashed, you can see the stack trace, the terminal is back at a prompt, and the port is still taken. There are five realistic explanations and they are easy to tell apart."
    },
    {
      "t": "h3",
      "x": "1. A child process inherited the socket"
    },
    {
      "t": "p",
      "x": "A listening socket is a file descriptor, and `fork()` copies file descriptors. When a parent spawns workers and then dies, the kernel keeps the socket alive as long as any descriptor referring to it is still open. The port is held by a process you were not thinking about. On Linux those orphans get reparented, so a PPID of 1 is a strong signal."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Orphaned Node workers still holding a listener\nps -eo pid,ppid,etime,args | grep -i '[n]ode'\n\n# Kill a whole process group instead of one process.\n# Note the minus sign: it means \"group\", and it needs the PGID.\nps -o pgid= -p 48213\nkill -TERM -48213"
    },
    {
      "t": "p",
      "x": "Cluster setups, Vite and webpack dev servers, `nodemon`, `concurrently`, `tsx watch`, Gunicorn and anything using a supervisor all have this shape. Hitting Ctrl+C in the wrong terminal pane kills the wrapper and leaves the worker."
    },
    {
      "t": "h3",
      "x": "2. The terminal closed, the process did not"
    },
    {
      "t": "p",
      "x": "Closing a terminal tab does not reliably kill what it started. If the process was started with `nohup`, under `tmux`, with a trailing `&` plus `disown`, or by an IDE run configuration you have since forgotten, it survives. An uptime of several hours in `ps -o etime` for something you \"just started\" settles it."
    },
    {
      "t": "h3",
      "x": "3. A container still publishes the port"
    },
    {
      "t": "p",
      "x": "`docker run -p 3000:3000` installs a host-side proxy or NAT rule. Your local server did not crash into that; it collided with it. `docker ps --filter publish=3000` finds the container, and a restart policy of `always` means stopping the process inside it is not enough."
    },
    {
      "t": "h3",
      "x": "4. TIME_WAIT, which is usually innocent"
    },
    {
      "t": "p",
      "x": "When a TCP connection closes, the side that closed first keeps the socket in `TIME_WAIT` for twice the maximum segment lifetime, so that late duplicate packets cannot be mistaken for a new connection. On Linux this is a fixed 60 seconds and is not tunable with a sysctl. Those lingering sockets are accepted connections, not the listener, and a fresh listener with `SO_REUSEADDR` binds straight over them. Node, Go's `net/http` and Nginx all set that option for you."
    },
    {
      "t": "p",
      "x": "Where it does appear: older Python code that builds a socket by hand, or `socketserver.TCPServer` without `allow_reuse_address = True`. If you have one of those, set the option rather than waiting out the timer."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\nsrv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsrv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\nsrv.bind((\"0.0.0.0\", 3000))\nsrv.listen(128)"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "SO_REUSEADDR is not SO_REUSEPORT",
      "x": "`SO_REUSEADDR` lets you bind over sockets that are shutting down. `SO_REUSEPORT` (Linux 3.9 and later) lets several live processes share one port and have the kernel load balance across them. If you set the second one by accident, you get no error at all and two servers quietly answering half your requests each, which is a much more confusing afternoon than EADDRINUSE."
    },
    {
      "t": "h3",
      "x": "5. A stale Unix socket file"
    },
    {
      "t": "p",
      "x": "If you bind a filesystem path rather than a TCP port, `EADDRINUSE` means the file is already there. SIGKILL leaves it behind, because the unlink never ran. Delete it, or have the server unlink the path at startup after checking that nothing answers on it."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and the bind still fails"
    },
    {
      "t": "p",
      "x": "You ran the right query, it returned nothing, and the server still refuses to start. Three causes account for most of these."
    },
    {
      "t": "p",
      "x": "**Windows reserved port ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of dynamic ports, and a reserved port cannot be bound even though no process holds it. Windows returns a permission error here, so Node often reports `EACCES` rather than `EADDRINUSE`, which sends people hunting for the wrong thing."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Is your port inside a reserved block?\nnetsh interface ipv4 show excludedportrange protocol=tcp\n\n# Reclaim the ranges (run as administrator; drops active NAT state)\nnet stop winnat\nnet start winnat\n\n# Or permanently claim one port for yourself\nnetsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1"
    },
    {
      "t": "p",
      "x": "**A macOS system service.** On recent macOS versions AirPlay Receiver listens on ports 5000 and 7000, which is why Flask's default port stopped working for a lot of people. The listener belongs to Control Center and shows up as a root-owned process, so you need `sudo lsof` to see it. Turn AirPlay Receiver off in System Settings, or move your app. Settings paths move between releases, so check yours rather than trusting a path you read online, including this one."
    },
    {
      "t": "p",
      "x": "**Address families that only look separate.** A process bound to `0.0.0.0:3000` conflicts with a later bind to `127.0.0.1:3000`, and on a default Linux configuration a `::` listener covers IPv4 too. Read the address column in `ss -lptn` output, not just the port."
    },
    {
      "t": "h2",
      "x": "Stop causing it: shut down properly"
    },
    {
      "t": "p",
      "x": "Most repeat offenders are servers that never learned to exit. Handle the signals, close the listener, and put a hard deadline on the whole thing so a stuck connection cannot hold the port forever."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(process.env.PORT || 3000);\n\nlet closing = false;\n\nfunction shutdown(signal) {\n  if (closing) return;        // Ctrl+C twice should not re-enter this\n  closing = true;\n  console.log(`${signal} received, closing listener`);\n\n  server.close(() => process.exit(0));\n\n  // Idle keep-alive sockets will otherwise keep close() pending.\n  // server.closeIdleConnections() exists in Node 18.2 and later.\n  server.closeIdleConnections?.();\n\n  // Hard deadline. unref() so this timer alone cannot keep us alive.\n  setTimeout(() => {\n    console.error('Forced exit after 10s');\n    process.exit(1);\n  }, 10_000).unref();\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));\nprocess.on('SIGINT', () => shutdown('SIGINT'));"
    },
    {
      "t": "p",
      "x": "`server.close()` stops accepting new connections and waits for in-flight ones to finish. With HTTP keep-alive on, idle sockets count as in-flight, which is why a server with no traffic can sit there refusing to exit. Verify the Node version that introduced the helper you use against the current API documentation before relying on it; the behaviour of that method has been refined more than once."
    },
    {
      "t": "p",
      "x": "Two more habits remove the problem rather than treating it. Read the port from the environment so a collision costs you one variable instead of a debugging session, and bind port 0 in tests so the kernel hands you a free ephemeral port every run."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// Port 0: the OS picks something free. Ask the server what it got.\nconst server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on http://127.0.0.1:${port}`);\n});"
    },
    {
      "t": "p",
      "x": "Parallel test suites that hardcode a port fail intermittently and look like flakiness in the code under test. Port 0 ends that class of bug outright. For a service in a restart loop, check the process manager before anything else: systemd with `Restart=always`, a Docker restart policy or `pm2` will relaunch the thing you just killed, and you will race it over and over."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of the problem: a container that will not stay up long enough to hold a port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Connection refused is the opposite symptom. Check each network layer in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "How to diagnose and fix CORS errors",
          "desc": "Once the dev server is up on a different port, this is often the next error.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "What does EADDRINUSE actually mean?",
          "a": "The bind or listen system call failed because the address and port combination you asked for is already taken. It is the POSIX error EADDRINUSE, errno 98 on Linux and 48 on macOS. The address matters as much as the port: a process on 0.0.0.0:3000 blocks 127.0.0.1:3000, and on a default Linux configuration an IPv6 wildcard listener blocks the IPv4 equivalent too."
        },
        {
          "q": "How do I kill the process using port 3000?",
          "a": "On Linux or macOS, run lsof -ti -sTCP:LISTEN -iTCP:3000 to get the PID, confirm it with ps -o pid,ppid,args -p PID, then send kill PID. On Windows, use Get-NetTCPConnection -LocalPort 3000 -State Listen to find the owning process and Stop-Process -Id to end it. Restrict the query to listening sockets so you do not match clients connected to that port."
        },
        {
          "q": "Why is my port still in use after the server crashed?",
          "a": "Usually a child process inherited the listening file descriptor and outlived its parent, so the socket never closed. Look for a process whose parent PID is 1, which on Linux means it was orphaned and reparented. Other common causes are a detached process from a closed terminal, a Docker container still publishing the port, and a stale Unix socket file left behind by a SIGKILL."
        },
        {
          "q": "Is kill -9 $(lsof -ti:3000) safe?",
          "a": "Not reliably. lsof -i:3000 matches sockets where 3000 is the local port or the remote port, so browsers, test runners, SSH tunnels and editor language servers connected to that port all appear in the list, and SIGKILL then ends them with no cleanup. Add -sTCP:LISTEN to limit it to the listener, and prefer plain kill so the process can shut down properly."
        },
        {
          "q": "Does TIME_WAIT cause address already in use?",
          "a": "Rarely, in modern code. Sockets in TIME_WAIT are closed connections, not listeners, and a new listener that sets SO_REUSEADDR binds over them immediately. Node, Go and Nginx set that option by default. It does bite hand-rolled Python sockets and socketserver.TCPServer without allow_reuse_address, where the fix is to set the option rather than wait out the 60-second timer on Linux."
        },
        {
          "q": "Why do I get a port conflict on Windows when nothing is listening?",
          "a": "Hyper-V, WSL2 and Docker Desktop reserve blocks of dynamic ports, and a reserved port cannot be bound even though no process owns it. Run netsh interface ipv4 show excludedportrange protocol=tcp to see the blocks. Restarting the winnat service as an administrator releases them, or you can reserve your specific port with netsh int ipv4 add excludedportrange. Windows reports this as a permission error, so the runtime may say EACCES instead of EADDRINUSE."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-16",
  "updated": "2026-10-16",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
