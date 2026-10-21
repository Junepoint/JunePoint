module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port in Use",
  "h1": "Port already in use: find the process that holds it",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding port 3000, stop it without losing state, and understand why EADDRINUSE keeps appearing after a crash or a Ctrl-C that did not take.",
  "standfirst": "The port is nearly always held by a live process you can name in one command. Here is how to name it on each platform, and why a crashed server so often leaves its socket open.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Name the process holding a port, stop it without losing state, and fix the crash pattern that keeps it open.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Something is almost certainly still listening. Get its PID with `ss -ltnp | grep :3000` on Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` first and `SIGKILL` only if it ignores you. `kill -9` skips your shutdown handler, so lock files, temp directories and open transactions outlive the process.",
        "After a crash, the usual holder is a surviving child that inherited the listening socket from its dead parent. The PID in your shell history is not the PID you need.",
        "`TIME_WAIT` is rarely to blame. libuv, Go and Python's `HTTPServer` all set `SO_REUSEADDR`, so a fresh listener binds straight over connections left in `TIME_WAIT`.",
        "If genuinely nothing is listening, suspect a process owned by another user, Docker's port forwarder, AirPlay Receiver on macOS port 5000, or a reserved port range on Windows."
      ]
    },
    {
      "t": "h2",
      "x": "Read the error, then name the process"
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` is the kernel refusing a `bind()` call because another socket already owns that address and port. The message gives you both. Node prints `Error: listen EADDRINUSE: address already in use :::3000`, and the error object carries `code`, `syscall`, `address` and `port`. That run of colons is not a typo. It is the IPv6 wildcard address `::` with the port appended, which already tells you something useful: the listener that got there first is bound to every interface, not just to loopback."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: listening sockets only, numeric, with the owning process\nss -ltnp | grep ':3000'\n# LISTEN 0 511 *:3000 *:* users:((\"node\",pid=48231,fd=23))\n\n# macOS, and Linux if lsof is installed\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Just the PIDs, for piping somewhere\nlsof -ti:3000\n\n# Windows, cmd\nnetstat -ano | findstr :3000\n\n# Windows, PowerShell: resolves the PID to a name in one go\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "p",
      "x": "Permissions decide what you are allowed to see. On Linux, `ss -p` only fills in process details for sockets your own user owns, so a port held by a service running as `postgres` or `root` can look unowned. `lsof` behaves the same way and warns about it in a line that is easy to scroll past. Re-run the lookup under `sudo` before you conclude the port is free."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Recognise the names you get back",
      "x": "`docker-proxy` or `docker-pr` means the Docker daemon published that port for a container: stop the container, do not kill the proxy. `com.docker.backend` is the Docker Desktop equivalent on macOS. `ControlCe` is lsof truncating Apple's Control Center. `ssh` means a tunnel. Each of those needs a different fix, which is the argument for naming the process rather than reaching for a one-liner that kills by port."
    },
    {
      "t": "h2",
      "x": "Stop it, in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask it to shut down. No signal argument means SIGTERM.\nkill 48231\n\n# Still there after a few seconds? Escalate.\nkill -9 48231\n\n# The one-liner. Run the lsof on its own first and read the match.\nlsof -ti:3000 | xargs kill\n\n# Linux without lsof: fuser does both steps\nfuser -k -TERM 3000/tcp\n\n# Windows\ntaskkill /PID 48231 /F"
    },
    {
      "t": "p",
      "x": "`SIGTERM` is a request. A server that traps it can finish in-flight requests, flush logs, close its database pool and delete its PID file. `SIGKILL` is not a request: the process never sees it and the kernel simply stops it where it stands. Start with `-9` and you pay for it later, in stale `.pid` files, a corrupt entry in a build cache, an unflushed SQLite WAL, or rows that stay locked until the database notices the client is gone. Escalate when `SIGTERM` is ignored, which takes about five seconds to establish."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "killall node is the fastest answer and the worst one",
      "x": "`killall node` and `pkill -f python` match on the program name, never on the port. They will also stop your editor's language server, a test watcher, a queue worker, a local emulator and anything else from the same runtime, and they will do it without telling you which. Match on the port instead. If you do pipe into `kill`, run the selection command on its own first and look at what it chose."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port busy"
    },
    {
      "t": "p",
      "x": "A crash does not release a socket. Closing a socket is something a process does, or something the kernel does on its behalf once the last file descriptor referring to that socket is closed. If any process still holds such a descriptor, the port stays bound, whatever happened to the code that was supposed to be serving on it. Three variations of that cover almost every case."
    },
    {
      "t": "h3",
      "x": "The parent died and a child kept the descriptor"
    },
    {
      "t": "p",
      "x": "Forked and spawned children inherit open descriptors. A dev server that starts a bundler, a worker pool, a cluster of request handlers or a file watcher hands each of them a copy of whatever was open at the time, and that can include the listening socket. Kill the parent, or let it crash, and the children are reparented to `init` instead of being cleaned up. They keep the port. This is the most common answer to \"I killed it and it is still in use\", and it is why the PID you remember is rarely the PID that matters."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who holds the port, who their parent is, and when they started\nps -o pid,ppid,stat,lstart,args -p \"$(lsof -ti:3000 | paste -sd, -)\"\n\n# The whole tree around the PID you thought you had killed\npstree -ps 48231\n\n# Signal a process group rather than one process: note the minus sign\nkill -TERM -48231"
    },
    {
      "t": "h3",
      "x": "Ctrl-C reached the wrapper, not the server"
    },
    {
      "t": "p",
      "x": "Ctrl-C sends `SIGINT` to the terminal's foreground process group, not to a single process, and usually that is enough. It fails when something in the chain declines to pass the signal on: a shell script that launches the server as a background job, a task runner invoked through `npm run dev`, a container whose entrypoint is `sh -c` so that PID 1 is the shell. The wrapper exits, your prompt returns, and the server keeps running with no terminal attached to it. Our guide on [containers that exit immediately](/guides/docker-container-exits-immediately/) goes into the PID 1 half of this problem."
    },
    {
      "t": "h3",
      "x": "The process outlived its own failure"
    },
    {
      "t": "p",
      "x": "An error that gets caught and logged does not stop anything. A listening server is an active handle in the event loop, so the loop never drains and the process stays up: idle, broken, still holding port 3000. You end up staring at an app that returns 500 for everything and a port that refuses to be rebound, and those are the same process. Node has exited on unhandled promise rejections since version 15, which helps, but only for rejections nobody caught."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "A zombie cannot hold a port",
      "x": "\"Zombie process\" gets blamed for this constantly and it is the wrong diagnosis. A process in state `Z` has already exited. Its descriptors are closed and all that remains is an exit status waiting for a parent to call `wait()`. If `ps` shows `Z` for your suspect, the port is held by something else: look at the parent that never reaped it, or at a sibling that inherited the socket."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "\"Wait a minute and try again\" describes a real mechanism attached to the wrong error. `TIME_WAIT` is a per-connection state, keyed on all four parts of the tuple (local address, local port, remote address, remote port), and it exists so that late duplicate packets from a finished connection cannot be mistaken for part of a new one. On Linux its length is a compile-time constant of 60 seconds. `net.ipv4.tcp_fin_timeout` does not change it, whatever the blog post says."
    },
    {
      "t": "p",
      "x": "The option that decides whether those leftovers block you is `SO_REUSEADDR`. With it set, a listening `bind()` succeeds even while old connections from the previous run sit in `TIME_WAIT`. libuv sets it, so every Node server has it. Go's `net.Listen` sets it. Python's `HTTPServer` sets `allow_reuse_address = 1`. A raw `socket.socket()` in Python does not, and that is the one common case where the folk advice genuinely applies."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n# Without this line, a restart within 60 seconds of serving traffic\n# raises OSError: [Errno 98] Address already in use\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\ns.bind((\"0.0.0.0\", 3000))\ns.listen(128)"
    },
    {
      "t": "p",
      "x": "The practical consequence: if a Node or Go server reports `EADDRINUSE` on `listen`, a live listener owns that port right now. Waiting will not help. Go and find it."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "SO_REUSEPORT is not a fix",
      "x": "`SO_REUSEPORT` (Linux 3.9 and later) is a different option, and it does let several live processes listen on one port, with the kernel distributing new connections between them. Set it to make the error disappear and you get two servers answering on the same port, with requests landing on whichever one the kernel picks. That bug is considerably harder to find than the one you started with."
    },
    {
      "t": "h2",
      "x": "Nothing is listening and the port is still refused"
    },
    {
      "t": "ul",
      "items": [
        "**A process you are not allowed to see.** Another user's service, or a container. Re-run the lookup with `sudo`, then check `docker ps` for a published port.",
        "**Windows reserved ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ports for dynamic allocation, and a bind inside one of those blocks fails with nothing listening. On Windows this often surfaces as `EACCES` rather than `EADDRINUSE`. List the ranges with `netsh int ipv4 show excludedportrange protocol=tcp`.",
        "**AirPlay Receiver on macOS.** Control Center has listened on ports 5000 and 7000 since Monterey, which is why Flask's default port stopped working for a lot of people. Turn AirPlay Receiver off in System Settings, or move your app. The setting has moved between releases, so check its location for your own version rather than trusting a screenshot.",
        "**A stale Unix socket file.** Binding a Unix domain socket to a path that already exists fails with the same error code, and the message ends in a path instead of a port: `address already in use /tmp/app.sock`. Unlink the file before binding, which is what a clean shutdown would have done for you.",
        "**A tunnel you forgot.** `ssh -L 3000:localhost:3000` holds the local port for the life of the session, including a session that has hung. `ss -ltnp` names `ssh` as the owner, which is the giveaway."
      ]
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Run these from an elevated prompt.\n\n# Port ranges Windows has reserved. A bind inside one of these fails\n# even though no process is listening.\nnetsh int ipv4 show excludedportrange protocol=tcp\n\n# Release them by restarting the NAT service, then restart Docker or WSL\nnet stop winnat\nnet start winnat\n\n# Or claim the single port you care about so nothing else reserves it\nnetsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1"
    },
    {
      "t": "h2",
      "x": "Which address did you actually bind?"
    },
    {
      "t": "p",
      "x": "Two sockets can share a port number as long as their addresses do not overlap, and the overlap rules are where this gets confusing. A wildcard bind covers every address on the machine, loopback included, so it collides with everything. An IPv6 wildcard on Linux covers IPv4 as well, because `net.ipv6.bindv6only` defaults to off and the socket accepts IPv4-mapped addresses."
    },
    {
      "t": "table",
      "head": [
        "Existing listener",
        "New bind",
        "Result"
      ],
      "rows": [
        [
          "`0.0.0.0:3000`",
          "`127.0.0.1:3000`",
          "Fails. The wildcard already covers loopback."
        ],
        [
          "`127.0.0.1:3000`",
          "`0.0.0.0:3000`",
          "Fails, for the same reason in reverse."
        ],
        [
          "`127.0.0.1:3000`",
          "`192.168.1.10:3000`",
          "Succeeds. Different addresses, no overlap."
        ],
        [
          "`[::]:3000`, dual stack",
          "`0.0.0.0:3000`",
          "Fails on Linux: the dual-stack IPv6 wildcard accepts IPv4 too."
        ],
        [
          "`[::]:3000` with `ipv6Only`",
          "`0.0.0.0:3000`",
          "Succeeds. Two sockets, one per address family."
        ]
      ],
      "caption": "Overlapping bind addresses on one port. \"Fails\" means EADDRINUSE."
    },
    {
      "t": "p",
      "x": "This is worth knowing for the diagnosis, not as a workaround. Binding your dev server to `127.0.0.1` to dodge a collision with something on `0.0.0.0` will not work, and binding to a second address so that both processes can run is a way of hiding a duplicate service from yourself."
    },
    {
      "t": "h2",
      "x": "The same error in other stacks"
    },
    {
      "t": "table",
      "head": [
        "Stack",
        "What you see",
        "Worth knowing"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "The error object has `code`, `errno`, `syscall`, `address` and `port`. `errno` is `-98` on Linux and `-48` on macOS."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 is Linux; macOS and the BSDs report 48."
        ],
        [
          "Django",
          "`Error: That port is already in use.`",
          "`runserver` catches the error and prints its own line, so you lose the address detail."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "The stack trace points at your bind call, never at the process holding the port."
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Usually a second nginx instance, or Apache. Check both before editing any config."
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "The daemon is refusing, not your app. Another container already publishes that port: check `docker ps`."
        ]
      ],
      "caption": "One kernel error, six presentations."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Trap the signals you will actually receive",
          "x": "`SIGINT` comes from Ctrl-C, `SIGTERM` from a process manager, Docker or a plain `kill`. Handle both, close the server, and give the drain a deadline so one stuck connection cannot hold the port forever. `server.close()` stops accepting new connections but waits for existing ones, and a browser keep-alive will happily wait with it. Node 18.2 added `closeIdleConnections()` and `closeAllConnections()` for that case.",
          "code": "const server = app.listen(Number(process.env.PORT) || 3000);\n\nconst shutdown = (signal) => {\n  console.log(`${signal} received, draining`);\n  server.close(() => process.exit(0));\n  server.closeIdleConnections(); // Node >= 18.2\n  setTimeout(() => {\n    console.error('drain timed out, forcing exit');\n    process.exit(1);\n  }, 10_000).unref();\n};\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => shutdown(signal));\n}"
        },
        {
          "title": "Bind port 0 in tests",
          "x": "Passing `0` asks the kernel for any free port, and then you read back which one you got. Suites that hard-code 3001 fail whenever two run at once, or whenever a previous run left something behind, and the failure reads as a flaky test rather than a port clash.",
          "code": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;"
        },
        {
          "title": "Give each project its own port",
          "x": "Three repos that all default to 3000 guarantee this error weekly. Write the port into `.env.example`, keep a note of which service owns which number, and the collisions stop being a coincidence you re-diagnose every few days."
        },
        {
          "title": "Let a process manager own the lifecycle",
          "x": "systemd, pm2 and Docker all stop the previous instance before starting the next, and they signal the whole process group rather than one PID. A systemd unit uses `KillMode=control-group` by default, which is exactly the behaviour you want here: children do not outlive the service that spawned them."
        }
      ]
    },
    {
      "t": "p",
      "x": "None of this makes the error impossible, and it should not. `EADDRINUSE` is the kernel telling you that two things want one resource, which is information rather than a defect. The habit worth building is the first move: name the process before you kill it. Nine times in ten it is your own server from ten minutes ago. The tenth time it is Docker, a tunnel, or a service you did not know was running, and that is the case a blind `kill -9` turns into an afternoon."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The PID 1 rules that decide whether a container stays up, and what each exit code means.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Postgres connection refused",
          "desc": "Work through listen address, firewall, pg_hba and credentials in the order that narrows it fastest.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node: Cannot find module",
          "desc": "How Node resolves a specifier, and the handful of ways that resolution breaks.",
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
          "a": "Find the PID first, then signal it. On macOS or Linux: `lsof -ti:3000 | xargs kill`. On Linux without lsof: `fuser -k -TERM 3000/tcp`. On Windows, locate the PID with `netstat -ano | findstr :3000` and stop it with `taskkill /PID <pid> /F`. Run `lsof -nP -iTCP:3000 -sTCP:LISTEN` on its own first, because it prints the command name and you want to know whether you are stopping your own server or Docker's port forwarder."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is listening on the port?",
          "a": "Most often something is listening and you cannot see it: `ss` and `lsof` hide process details for other users' sockets, so try `sudo`. After that, check `docker ps`, check for an SSH tunnel, and on Windows check `netsh int ipv4 show excludedportrange protocol=tcp` for a range that Hyper-V or WSL2 has reserved. For a Unix domain socket, a leftover socket file at that path produces the same error, and the fix is to unlink it."
        },
        {
          "q": "Do I have to wait for the port to be released?",
          "a": "Almost never. `TIME_WAIT` lasts 60 seconds on Linux, but it applies to individual connections, and a listening socket with `SO_REUSEADDR` set binds regardless. Node, Go and Python's `HTTPServer` all set that option for you. If your framework sets it and the bind still fails, a live process owns the port, and waiting changes nothing."
        },
        {
          "q": "Is it safe to run killall node?",
          "a": "Not really. It matches every process named `node`, which on a developer machine includes language servers, test watchers, build tools and whatever else your editor started. You get no list of what it stopped. Select by port instead and you kill one thing on purpose."
        },
        {
          "q": "Why is the port still busy after I pressed Ctrl-C?",
          "a": "Either the signal never reached the server, or it did and a child kept the socket. Ctrl-C signals the foreground process group, so a wrapper script or task runner that does not forward signals leaves the real server running. Separately, any child that inherited the listening descriptor holds the port open after its parent dies. Check `pstree -ps <pid>`, then signal the whole group with `kill -TERM -<pgid>`."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on a listen call?",
          "a": "`EADDRINUSE` means the address is taken. `EACCES` means you are not permitted to bind it: on Linux and macOS that is usually a port below 1024 claimed without privilege, and on Windows it is often a port inside a range the system has reserved for dynamic use. Same symptom in your terminal, different half of the problem."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-21",
  "updated": "2026-10-21",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
