module.exports = {
  "slug": "port-already-in-use",
  "title": "Port Already in Use: Find the Process and Free It",
  "h1": "EADDRINUSE: why the port is busy and how to free it",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens after a crash, how to find the process holding a port with lsof or ss, and how to kill it without killing the wrong thing.",
  "standfirst": "A port is busy because a live process still owns the listening socket. Here is how to identify that process on macOS, Linux and Windows, and the cases where nothing owns it at all.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Find the process holding a port, stop it safely, and understand why a crash leaves the socket occupied.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "On macOS and Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` names the single process that owns the port. The `-sTCP:LISTEN` filter is not optional: without it you also match clients talking to port 3000.",
        "Send `kill <pid>` first. `kill -9` skips the process's own cleanup and orphans its children, which sometimes keeps the port busy anyway.",
        "After a crash, the holder is almost always a surviving child, a suspended job or a second copy of your server. A lingering kernel socket is rarely the explanation.",
        "`TIME_WAIT` gets blamed far more often than it deserves. Most servers set `SO_REUSEADDR`, which makes `TIME_WAIT` entries irrelevant to a new listener.",
        "A port can be unusable with no process behind it: Windows reserved ranges, macOS AirPlay Receiver, a forgotten Docker publish, or an SSH tunnel."
      ]
    },
    {
      "t": "h2",
      "x": "The command you came for"
    },
    {
      "t": "p",
      "x": "Two steps, in this order. Find the listener, then stop it by PID."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Stop that one process, politely\nkill 51823\n\n# Confirm\nlsof -nP -iTCP:3000 -sTCP:LISTEN || echo 'port 3000 is free'"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter is the part most copied answers drop. Plain `lsof -i:3000` matches any socket with 3000 at *either* end, so the list can include your browser's connection to the dev server, a `curl` that is still open, and anything that happened to draw 3000 as an ephemeral source port. Feed that list to `kill -9` and you take down processes you never meant to touch."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows PowerShell: find the listener\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Name it before you kill it\nGet-Process -Id 18244\n\n# Then stop it\nStop-Process -Id 18244\n\n# Classic cmd.exe equivalent:\n#   netstat -ano | findstr :3000\n#   tasklist /FI \"PID eq 18244\"\n#   taskkill /PID 18244 /F"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The popular one-liner is riskier than it looks",
      "x": "`sudo kill -9 $(lsof -t -i:3000)` appears in nearly every thread about this error. It combines three bad ideas: it matches clients as well as listeners, it skips `SIGTERM` entirely, and it runs as root so nothing refuses it. `killall node` is worse on a development machine, because it also ends language servers, the editor's extension host and any watcher you had running. Identify the process, then kill one PID."
    },
    {
      "t": "h2",
      "x": "Read the error before you kill anything"
    },
    {
      "t": "p",
      "x": "The message names an address, not just a port, and the address is usually where the answer hides."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What it prints",
        "What that tells you"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` is the IPv6 wildcard in compressed form, so the attempted bind covered every interface"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use` on Linux, errno `48` on macOS",
          "The same kernel condition, with different errno numbering per platform"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "An empty host before the colon also means the wildcard address"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Spring Boot usually prints its own line naming the port above the stack trace"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "An explicit IPv4 wildcard, commonly a second nginx or an Apache left running"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "The clash is on the host side of a published port, not inside the container. Exact wording varies between Docker versions."
        ]
      ],
      "caption": "The same kernel error, reported six different ways."
    },
    {
      "t": "p",
      "x": "A bind to `127.0.0.1:3000` is a narrower claim than a bind to `0.0.0.0:3000`. Two servers can happily share port 3000 if one takes loopback and the other takes a specific LAN address. A wildcard bind collides with both. On Linux, where `net.ipv6.bindv6only` is 0 by default, a listener on `[::]:3000` accepts IPv4 traffic too, which is how one Node process ends up blocking a service that never speaks IPv6. If your error mentions `:::3000` and `lsof` shows a listener on `0.0.0.0:3000`, those are the same conflict seen from two directions."
    },
    {
      "t": "h2",
      "x": "Find the owner, not just the port"
    },
    {
      "t": "p",
      "x": "`lsof` output is dense, and the flags matter more than they look."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "#   -n              do not resolve host names (much faster)\n#   -P              do not translate port numbers to service names\n#   -iTCP:3000      TCP sockets with 3000 at either end\n#   -sTCP:LISTEN    narrow that to sockets in the LISTEN state\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Owned by root or another user? You need sudo to see the name at all.\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Who started it, and is something supervising it?\nps -o pid,ppid,user,stat,command -p 51823\npstree -p 51823        # Linux; install pstree separately on macOS"
    },
    {
      "t": "p",
      "x": "Read the `PPID` column. If the parent is `1`, the process was orphaned and reparented, which is the signature of a supervisor that crashed or exited. If the parent is a `node`, `npm`, `supervisord`, `pm2` or shell PID, you have found the thing to stop instead. On Linux, `ss` is faster and already installed:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "ss -ltnp 'sport = :3000'        # listening TCP sockets on 3000, with PID\nsudo ss -ltnp 'sport = :3000'   # needed to see other users' process names\n\nnetstat -ltnp | grep ':3000 '   # older machines, same information\n\nfuser -v 3000/tcp               # which PIDs, and what they are doing"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "fuser -k is a loaded gun",
      "x": "`fuser -k 3000/tcp` kills every matching process with `SIGKILL` by default and prints very little about what it did. On a shared or production host that is how you take out a service nobody asked you to touch. Run `fuser -v 3000/tcp` first and read the list."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Name the process",
          "x": "Get the PID, the user and the full command line. If the command is not something you recognise as yours, find out what it is before killing it.",
          "code": "sudo lsof -nP -iTCP:3000 -sTCP:LISTEN\nps -o pid,ppid,user,stat,command -p 51823"
        },
        {
          "title": "Send SIGTERM",
          "x": "Plain `kill` asks the process to shut down. A well-behaved server closes its listening socket, finishes in-flight requests, flushes logs and exits. That is what you want.",
          "code": "kill 51823"
        },
        {
          "title": "Wait a beat, then check",
          "x": "Give it a second or two. Shutdown is not instant, and re-running the check is cheaper than guessing.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo free"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught, so nothing is flushed and no cleanup runs. Lock files, temporary directories and PID files are left behind, and any children are orphaned rather than stopped. If one of those children is the socket holder, the port stays busy and you have made the diagnosis harder.",
          "code": "kill -9 51823"
        },
        {
          "title": "If it comes back, you killed the wrong layer",
          "x": "A port that is occupied again within seconds means something is restarting the process. Find the supervisor and stop that.",
          "code": "docker ps                      # a published port on a running container\ndocker compose down            # the right way to release compose ports\nsystemctl status myapp         # a unit with Restart=always\npm2 list && pm2 stop myapp     # a process manager you forgot about"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "The port is held because a live process still has the listening socket open. That is the entire mechanism. A crash does not leave an ownerless socket floating in the kernel, so if the port is busy there is a process, and the only real question is which one. Four patterns cover most of it."
    },
    {
      "t": "h3",
      "x": "You stopped the wrapper, not the server"
    },
    {
      "t": "p",
      "x": "`npm run dev` is a shell, which runs a watcher, which runs your server. Ctrl-C sends `SIGINT` to the foreground process group, and that normally reaches all three. The processes that survive are the ones that left the group: anything started with a trailing `&`, anything spawned detached, anything a supervisor restarted after your shell exited, and anything whose parent died before passing the signal on. The child keeps its own listening socket, so the port stays claimed by a process whose terminal is long gone."
    },
    {
      "t": "p",
      "x": "Ctrl-Z deserves its own mention. It does not stop a server. It suspends it, and a suspended process keeps every file descriptor it had, including the socket. The terminal looks idle and the port looks mysteriously occupied. `jobs -l` shows the job and its PID, and `kill %1` ends it."
    },
    {
      "t": "h3",
      "x": "A shutdown handler that never finishes"
    },
    {
      "t": "p",
      "x": "Graceful shutdown code often drains in-flight requests before exiting. If it drains before closing the listener, the socket stays bound for as long as the drain takes, and a single WebSocket or server-sent-events stream makes that unbounded. The fix is ordering plus a deadline: close the listening socket first so no new connections arrive, then drain, then exit anyway after a timeout."
    },
    {
      "t": "h3",
      "x": "Another copy was already running"
    },
    {
      "t": "p",
      "x": "A second terminal tab. An editor task that auto-starts the dev server. A test suite that binds a fixed port instead of asking for an ephemeral one. A container from last Thursday with `restart: unless-stopped`. None of these are crashes, but they present identically, and `docker ps` plus a quick `ps -ef | grep node` answers the question in five seconds. See [Docker container exits immediately](/guides/docker-container-exits-immediately/) for the mirror image of this problem."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is usually a red herring"
    },
    {
      "t": "p",
      "x": "The advice to wait two minutes for `TIME_WAIT` to expire is repeated constantly and is mostly wrong for this error. `TIME_WAIT` applies to connections that have closed, not to the listening socket, and `SO_REUSEADDR` exists precisely so a new listener can bind a port that still has old connections in that state. Node sets `SO_REUSEADDR` by default on Unix-like systems, as do Go's standard listener and nginx. If waiting appears to fix it, what actually happened is that a dying process finally exited."
    },
    {
      "t": "p",
      "x": "Where `TIME_WAIT` does bite is hand-rolled socket code that never sets the option. Python is the usual suspect, because a bare `socket.socket()` has no reuse behaviour unless you ask for it:"
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)   # the line people omit\ns.bind((\"0.0.0.0\", 8000))\ns.listen(128)\n\n# With socketserver or http.server, set it on the class instead:\n#   class Server(socketserver.TCPServer):\n#       allow_reuse_address = True"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Zombies cannot hold a port",
      "x": "A process in state `Z` has already exited. Its file descriptors are gone and the kernel is only keeping the exit status until the parent reaps it. Killing a zombie does nothing, because there is nothing left to kill. If `ps` shows `Z` next to your server, the socket was released when it died and something else is holding the port now."
    },
    {
      "t": "h2",
      "x": "When the port is busy and nothing owns it"
    },
    {
      "t": "p",
      "x": "Sometimes every search comes up empty and the bind still fails. These are the usual explanations. The details below reflect behaviour as of October 2026, so confirm them on your own version before acting."
    },
    {
      "t": "ul",
      "items": [
        "**Windows reserved ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of TCP ports for dynamic use, and a reserved port is unbindable with no listener to find. `netsh interface ipv4 show excludedportrange protocol=tcp` lists them.",
        "**macOS AirPlay Receiver.** It listens on ports 5000 and 7000, which is why a Flask app on 5000 fails on a stock Mac. `lsof` shows an owner such as `ControlCe`. Turn the feature off in System Settings or move your app to another port.",
        "**Docker's proxy.** On Linux, `ss -ltnp` may show `docker-proxy` rather than anything recognisable, and with some network configurations the publish is handled by NAT rules and shows no listener at all. Use `docker ps` and stop the container instead of killing the proxy.",
        "**Tunnels and forwards.** `ssh -L 5432:localhost:5432` and `kubectl port-forward` both hold local ports for as long as they run, and both are easy to leave open in a forgotten terminal.",
        "**The wrong error entirely.** Ports below 1024 need privileges. Node reports that as `Error: listen EACCES: permission denied 0.0.0.0:80`, which is a different problem with a different fix."
      ]
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows: is the port reserved rather than listened on?\nnetsh interface ipv4 show excludedportrange protocol=tcp\n\n# Claim it for yourself so the dynamic allocator stops taking it.\n# Needs an elevated prompt, and a reboot on some builds.\nnetsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1"
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Most of the cure is making the failure legible and making fixed ports less necessary. Start with the message your own app prints, because the default one tells the reader nothing about what to do next."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const port = Number(process.env.PORT ?? 3000);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${port} is already in use.\\n` +\n      `Find the owner: lsof -nP -iTCP:${port} -sTCP:LISTEN\\n` +\n      `Or pick another: PORT=3001 npm run dev`\n    );\n    process.exit(1);\n  }\n  throw err;\n});\n\nserver.listen(port);"
    },
    {
      "t": "p",
      "x": "In tests, stop hard-coding a port at all. Asking the kernel for port 0 gets you a free one, and reading it back is a single line. Parallel test runners stop fighting each other immediately."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0);                 // 0 means any free port\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;\n\n// Shut down in the right order: stop accepting, then drain, then give up.\nprocess.on('SIGTERM', () => {\n  server.close(() => process.exit(0));\n  setTimeout(() => process.exit(1), 10_000).unref();\n});"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Two habits that remove most of these incidents",
      "x": "Give every project a distinct port and write it in the README, so a conflict immediately tells you which other project is running. And release container ports with `docker compose down` rather than Ctrl-C in the logs pane, which leaves containers up often enough to be worth the muscle memory."
    },
    {
      "t": "p",
      "x": "Tools such as `npx kill-port 3000` wrap the same lookup and kill into one command. They are fine on your own machine when you already know what is running. They are a poor idea on anything shared, because they hide the one thing you most want to see, which is the name of the process about to be killed."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The opposite failure: a container that will not stay up long enough to hold a port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Nothing is listening, rather than something already is. Check each layer in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "How to diagnose and fix CORS errors",
          "desc": "Once the server is up on the port you wanted, this is often the next thing to break.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, run `lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, then `kill <pid>`. On Windows, `Get-NetTCPConnection -LocalPort 3000 -State Listen` gives you `OwningProcess`, and `Stop-Process -Id <pid>` ends it. Check the command line before you kill anything, and only use `kill -9` if a plain `kill` is ignored."
        },
        {
          "q": "Why is port 3000 still in use after I pressed Ctrl-C?",
          "a": "Because something survived the signal. The usual candidates are a child process that left the terminal's process group, a watcher that restarted the server, a container with a restart policy, or a job you suspended with Ctrl-Z rather than stopping. Run `ps -o pid,ppid,command -p <pid>` on the port's owner: a parent PID of 1 means it was orphaned when its supervisor died."
        },
        {
          "q": "Is it safe to use kill -9 on the process holding the port?",
          "a": "It is safe for a stateless dev server and a bad habit everywhere else. `SIGKILL` cannot be caught, so no flush and no cleanup happens: lock files and PID files are left behind, data buffered in memory is lost, and child processes are orphaned instead of stopped. Try `kill` first and give it a couple of seconds."
        },
        {
          "q": "What does address already in use :::3000 mean, with three colons?",
          "a": "`::` is the IPv6 wildcard address written in its compressed form, followed by `:3000`. It means your server tried to listen on port 3000 across every interface. On Linux that bind usually covers IPv4 as well, so it can collide with a process listening only on `0.0.0.0:3000`."
        },
        {
          "q": "The port is in use but lsof shows nothing. What now?",
          "a": "Re-run with `sudo`, since you cannot see other users' sockets otherwise. If it is still empty, suspect something that does not look like a listener: a Windows reserved port range (`netsh interface ipv4 show excludedportrange protocol=tcp`), macOS AirPlay Receiver on 5000 or 7000, a Docker publish handled by NAT rules, or an SSH tunnel. Also check that the error is `EADDRINUSE` and not `EACCES`, which means a privileged port."
        },
        {
          "q": "How long until the port frees itself on its own?",
          "a": "If a process holds it, never. The port is released when that process closes the socket or exits, and no amount of waiting changes that. The two-minute `TIME_WAIT` wait that gets recommended applies to closed connections, not to a listening socket, and `SO_REUSEADDR` makes it a non-issue for most servers."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-22",
  "updated": "2026-10-22",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
