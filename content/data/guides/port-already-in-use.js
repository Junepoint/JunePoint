module.exports = {
  "slug": "port-already-in-use",
  "title": "Port Already in Use: Finding and Freeing It",
  "h1": "EADDRINUSE: finding the process and getting your port back",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE explained: find the process holding a port on macOS, Linux and Windows, kill it safely, and stop orphaned dev servers from coming back.",
  "standfirst": "EADDRINUSE names a conflict, not a cause. Identify the process that holds the socket, decide whether it deserves to die, then fix the shutdown path that orphaned it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Find the process behind EADDRINUSE on any OS, kill it safely, and fix the orphaned dev server that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means a socket already holds that exact address and port combination. In almost every case a live process owns it.",
        "Find the owner with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `ss -ltnp 'sport = :3000'` on Linux, or `Get-NetTCPConnection -LocalPort 3000` on Windows.",
        "After a crash the usual culprit is an orphaned child process or a job you suspended with Ctrl+Z, not leftover kernel state.",
        "`TIME_WAIT` is blamed far more often than it is guilty. Most runtimes set `SO_REUSEADDR` on listening sockets by default.",
        "Send `SIGTERM` first and give it a few seconds. `kill -9` denies the process any chance to release files, locks and database connections.",
        "On Windows a port can be unavailable with no owning process at all, because Hyper-V networking reserved the range."
      ]
    },
    {
      "t": "h2",
      "x": "Start here if you just want the port back"
    },
    {
      "t": "p",
      "x": "Three commands, in order: identify, inspect, terminate. Skipping the middle one is how people end up killing their database."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# 1. Who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# 2. What is PID 18244, actually?\nps -o pid,ppid,user,etime,command -p 18244\n\n# 3. Ask it to stop. Check again before escalating.\nkill 18244"
    },
    {
      "t": "p",
      "x": "If step 1 prints nothing and the bind still fails, you are in one of the stranger cases covered further down: a reserved port range, a container runtime, or an address family mismatch. If step 2 shows something you did not start, read it twice before typing anything else."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Two commands worth avoiding",
      "x": "`killall node` and `pkill -f python` do not distinguish your stuck dev server from a language server, a build watcher, a running test suite or an application you care about. `fuser -k 3000/tcp` is similarly blunt: it kills whatever it finds without showing you first. The targeted version costs one extra command and tells you what you are about to destroy."
    },
    {
      "t": "h2",
      "x": "What the error is actually telling you"
    },
    {
      "t": "p",
      "x": "Every runtime wraps the same operating system error. `bind()` returned `EADDRINUSE`, which is errno 48 on macOS and the BSDs, errno 98 on Linux, and winsock error 10048 on Windows. The wording changes, the condition does not."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Message",
        "Notes"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` is the IPv6 wildcard. An explicit host gives `0.0.0.0:3000` or `127.0.0.1:3000` instead."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 48 on macOS. Frameworks often wrap this in a longer traceback."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "The address shown is exactly what you passed to `net.Listen`."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Some JDK builds append `: bind` or a `JVM_Bind` marker."
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "Can come from a stopped-but-present container, not only a live one."
        ]
      ],
      "caption": "The same kernel error, five dialects."
    },
    {
      "t": "p",
      "x": "Read the address, not just the port. A process bound to `0.0.0.0:3000` blocks any attempt to bind `127.0.0.1:3000`, because the wildcard already covers loopback. The reverse is also true. But two processes *can* happily bind `127.0.0.1:3000` and `192.168.1.40:3000` at the same time, since those are different addresses. On Linux, a listener on `[::]:3000` usually absorbs IPv4 traffic too, thanks to the default `net.ipv6.bindv6only=0`, which is why a Node server reporting `:::3000` collides with a Python server bound to `0.0.0.0:3000`."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EACCES is a different problem",
      "x": "`Error: listen EACCES: permission denied 0.0.0.0:80` is not a conflict. Ports below 1024 are privileged on Unix-like systems. Use a high port in development and put a reverse proxy in front for production, rather than running your application as root."
    },
    {
      "t": "h2",
      "x": "Find the owner on your platform"
    },
    {
      "t": "h3",
      "x": "macOS and Linux"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Listening sockets only, no DNS or service-name lookups\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Every process in the tree, so you can see the parent\nps -ef | grep -i '[n]ode'"
    },
    {
      "t": "p",
      "x": "The `-n` and `-P` flags keep `lsof` from resolving hostnames and port names, which makes it noticeably faster and keeps the output readable. `ss` will show a dash instead of a process name for sockets owned by another user, so prefix it with `sudo` if the owner column is empty. The `[n]ode` bracket trick stops grep from matching its own command line."
    },
    {
      "t": "h3",
      "x": "Windows"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "Get-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "code",
      "lang": "bat",
      "x": "netstat -ano | findstr :3000\nREM   TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    18244\n\ntasklist /fi \"pid eq 18244\"\ntaskkill /PID 18244 /F"
    },
    {
      "t": "p",
      "x": "`netstat -ano` lists every connection, not only listeners, so a port with many clients produces many lines. The one you want ends in `LISTENING`. Note that `taskkill /F` is the equivalent of `kill -9`, with the same downsides; try it without `/F` first."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is where most of the confusion lives. The server window is gone, the stack trace is on screen, the shell prompt has returned. Something is still listening. A listening socket is a file descriptor, and file descriptors survive in whatever process holds them. Your terminal exiting does not close a socket that a different process inherited."
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child.** `npm run dev`, `nodemon`, `concurrently`, `foreman` and friends spawn the real server as a child. Kill the wrapper and the child is reparented to init, still bound, still invisible in your shell's job list.",
        "**A suspended job.** Ctrl+Z stops a process, it does not end it. The socket stays open. Run `jobs`, then `fg` to bring it back or `kill %1` to end it.",
        "**A cluster or worker pool.** With Node's `cluster` module, pm2 or Gunicorn, the listening descriptor is shared across workers. Killing the primary leaves workers holding the port.",
        "**A slow graceful shutdown.** `server.close()` stops accepting new connections but waits for existing ones to finish. A single idle keep-alive connection or an open WebSocket can hold the listener for as long as the client keeps it alive.",
        "**A debugger-attached process.** A process paused at a breakpoint cannot react to `SIGTERM` at all, and IDE restarts occasionally lose track of the old one.",
        "**A container you forgot.** `docker ps` shows running containers; `docker ps -a` shows the stopped ones whose port mappings can still be reserved."
      ]
    },
    {
      "t": "p",
      "x": "The orphan hunt is quick. Look at the parent process ID column: a PPID of 1 is the signature of a child whose parent died without taking it along."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Orphans: anything whose parent is init/systemd\nps -eo pid,ppid,etime,command | awk '$2 == 1'\n\n# Or ask directly about the process holding the port\nlsof -ti tcp:3000 | xargs -r ps -o pid,ppid,etime,command -p\n\n# Suspended jobs in this shell\njobs -l"
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT myth"
    },
    {
      "t": "p",
      "x": "Search engines are full of advice that says a crashed server leaves its port in `TIME_WAIT` for two minutes, so you should wait it out or tune `net.ipv4.tcp_tw_reuse`. That advice is mostly wrong for the case you are in, and the kernel tuning is a bad idea on top of being unnecessary."
    },
    {
      "t": "p",
      "x": "Here is the real behaviour. `TIME_WAIT` applies to *connections*, not to the listening socket. When a server closes a connection first, that connection sits in `TIME_WAIT` holding the local port, and a fresh `bind()` to the same port fails unless the socket has `SO_REUSEADDR` set. Node, Go and Rust set it on listening sockets by default. In Python, `http.server.HTTPServer` sets `allow_reuse_address = True`, while a bare `socketserver.TCPServer` does not, which is why a hand-rolled Python socket server is one of the few places you will genuinely hit this. Check before you assume."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Are there actually sockets in TIME-WAIT on this port?\nss -tan 'sport = :3000'\n\n# A LISTEN row means a live process. Diagnose that instead.\n# Only TIME-WAIT rows and no LISTEN row points at SO_REUSEADDR."
    },
    {
      "t": "p",
      "x": "If you see a `LISTEN` row, `TIME_WAIT` is irrelevant and a process owns the port. Go back to `lsof`."
    },
    {
      "t": "h2",
      "x": "When nothing owns the port"
    },
    {
      "t": "h3",
      "x": "Windows reserved port ranges"
    },
    {
      "t": "p",
      "x": "Hyper-V, WSL2, Docker Desktop and the WinNAT service reserve blocks of TCP ports for dynamic allocation. A port inside a reserved block is unbindable, and no process will ever show up in `netstat`, because none is holding it. The check:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "netsh interface ipv4 show excludedportrange protocol=tcp"
    },
    {
      "t": "p",
      "x": "If your port falls inside one of the listed ranges, you have three options: pick a port outside every range, restart the `winnat` service so the ranges are reallocated, or explicitly reserve your port with `netsh int ipv4 add excludedportrange` while WinNAT is stopped so that it survives the next reallocation. The first option is the one that will still work next month."
    },
    {
      "t": "h3",
      "x": "macOS and AirPlay Receiver"
    },
    {
      "t": "p",
      "x": "Ports 5000 and 7000 are claimed by AirPlay Receiver on recent macOS releases, which is unfortunate because 5000 is the Flask default. In `lsof` the owner appears as `ControlCe`, the Control Center process, which is not an obvious name to search for. Turn AirPlay Receiver off in System Settings under General, or run Flask on another port. Verify the behaviour on your own machine: Apple has moved these settings between releases."
    },
    {
      "t": "h3",
      "x": "Docker and other runtimes"
    },
    {
      "t": "p",
      "x": "`port is already allocated` comes from the daemon's own bookkeeping, which can disagree with the host. Check `docker ps -a` for a stopped container with the same published port, and `docker compose ls` for a project you forgot to bring down. Restarting the Docker daemon clears stale allocations when nothing else explains it. If the host itself holds the port, the daemon reports a bind error from the userland proxy rather than an allocation error, and that one you diagnose with `lsof` like any other."
    },
    {
      "t": "h2",
      "x": "Killing it without killing something important"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify, then read the command line",
          "x": "The full command line distinguishes your abandoned dev server from a service you depend on. Elapsed time helps: a process running for nine days is not the one you started ten minutes ago.",
          "code": "ps -o pid,ppid,user,etime,command -p 18244"
        },
        {
          "title": "Send SIGTERM and wait",
          "x": "Plain `kill` sends `SIGTERM`, which well-behaved servers catch to close connections, flush logs and release locks. Give it a few seconds before concluding it failed.",
          "code": "kill 18244 && sleep 3 && lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught. The process loses any chance to clean up, which for a database or a queue consumer can mean corrupt state or stuck records. For a stuck dev server it is fine.",
          "code": "kill -9 18244"
        },
        {
          "title": "Check for a parent that will respawn it",
          "x": "Process managers exist to restart things. If `pm2`, `systemd`, `supervisord` or a Compose restart policy owns the process, killing the child just produces a new child. Stop the supervisor instead.",
          "code": "pm2 stop all\nsystemctl --user stop myapp.service\ndocker compose down"
        },
        {
          "title": "Use the one-liner once you trust it",
          "x": "After you know what is on the port, the compressed form saves time. Keep it out of scripts that run unattended.",
          "code": "lsof -ti tcp:3000 | xargs kill"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Making the next crash harmless"
    },
    {
      "t": "p",
      "x": "Handling the termination signals is the fix that removes the whole category of problem. Close the server, set a deadline so a hung connection cannot block the exit forever, and let the process die."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`)\n})\n\nconst shutdown = (signal) => {\n  console.log(`${signal} received, closing`)\n  server.close(() => process.exit(0))\n  // Node 18.2 and later: drop idle keep-alive sockets immediately\n  server.closeAllConnections?.()\n  // Hard deadline so one stuck socket cannot hold the port\n  setTimeout(() => process.exit(1), 5000).unref()\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal))\n}"
    },
    {
      "t": "p",
      "x": "The optional call guards against older runtimes that lack the method. Check the version your project targets rather than trusting a snippet, including this one."
    },
    {
      "t": "p",
      "x": "For tests, stop choosing a port at all. Binding to port 0 asks the kernel for a free ephemeral port, which removes every collision between parallel test files and every collision with your own running dev server."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address()\n  baseUrl = `http://127.0.0.1:${port}`\n})"
    },
    {
      "t": "ul",
      "items": [
        "Bind to `127.0.0.1` in development rather than the wildcard. The conflict surface shrinks and you stop exposing an unauthenticated dev server to the local network.",
        "Give each project a distinct port and write it in the README. Three services that all default to 3000 will collide every week.",
        "In Docker Compose, publish host ports only for the services you reach from the host. Containers on the same network already reach each other by service name.",
        "Use `concurrently --kill-others` or an equivalent so one dying process takes its siblings with it instead of leaving them bound.",
        "If a port conflict appears in CI, look for a service container or a previous job's server rather than adding a retry loop."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A useful shell function",
      "x": "`port() { lsof -nP -iTCP:$1 -sTCP:LISTEN; }` in your shell profile turns the diagnosis into `port 3000`. Keeping it read-only is deliberate: the moment a shortcut also kills things, you will eventually run it on the wrong number."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `lsof -ti tcp:3000 | xargs kill`. On Windows PowerShell: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess`. Run the identifying command on its own first so you can see what you are about to terminate, and only add `-9` or `-Force` if a normal termination signal is ignored."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process, which is often a wrapper such as `npm run dev` or `nodemon` rather than the server itself. The real server is a child that gets reparented to init and keeps the socket open. Look for a process whose PPID is 1. If you pressed Ctrl+Z instead, the process is merely suspended and still holds the port; `jobs -l` will show it."
        },
        {
          "q": "Is EADDRINUSE caused by TIME_WAIT?",
          "a": "Usually not. `TIME_WAIT` affects closed connections, and most runtimes set `SO_REUSEADDR` on listening sockets so a new bind succeeds anyway. Run `ss -tan 'sport = :3000'`: if there is a `LISTEN` row, a live process owns the port and `TIME_WAIT` is a red herring. Hand-written socket servers that never set `SO_REUSEADDR` are the genuine exception."
        },
        {
          "q": "Can two programs listen on the same port?",
          "a": "On different addresses, yes. `127.0.0.1:3000` and `192.168.1.40:3000` are distinct sockets and can coexist. A wildcard bind such as `0.0.0.0:3000` or `[::]:3000` covers every address, so it conflicts with both. Sockets can also share a port deliberately with `SO_REUSEPORT`, which load balances across processes, but that has to be set by every participant."
        },
        {
          "q": "Why does Docker say the port is already allocated when nothing is running?",
          "a": "Check `docker ps -a` rather than `docker ps`: a stopped container still carries its port mapping, and the daemon's allocation table can hold a reservation after an unclean stop. Removing the stale container usually clears it, and restarting the Docker daemon clears the rest. If instead the message mentions a bind failure from the userland proxy, the host has the port and you diagnose it like any other process."
        },
        {
          "q": "Should I just change the port instead of killing the process?",
          "a": "For a one-off, yes, and `PORT=3001 npm run dev` costs nothing. It is the wrong habit long term, because the orphaned process is still running, still consuming memory, and still potentially serving stale code to a browser tab you forgot about. People debug phantom behaviour for hours because an old build is answering on a port they stopped thinking about."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, restart loops and how to keep a container alive long enough to inspect it.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Work outward from the server process through listen_addresses, pg_hba.conf and the network path.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How Node resolution actually works, and why ESM and CommonJS fail in different ways.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-29",
  "updated": "2026-10-29",
  "author": "jackson",
  "related": []
};
