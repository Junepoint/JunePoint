module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: find the process, then free the port",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens, how to find the process holding a port on macOS, Linux and Windows, and why a port stays busy after a crash.",
  "standfirst": "A bind failure names the address it wanted. Use that to find the process that already owns it, kill the right thing, and stop the same port sticking after the next crash.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "find process using port"
  ],
  "cardDesc": "Identify the process holding a port, kill it safely, and fix the orphaned child that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is a bind failure. Another process on this machine already holds the address and port you asked for.",
        "Find the owner first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `ss -ltnp` on Linux, `Get-NetTCPConnection -LocalPort 3000` on Windows.",
        "After a crash, the usual cause is a surviving child process, not a lingering kernel socket. A dead process holds nothing.",
        "`TIME_WAIT` is rarely the culprit for a listening socket, because Node sets `SO_REUSEADDR` before it binds.",
        "A wildcard bind on `0.0.0.0` or `::` owns the port on every interface, so a loopback-only server still collides with it.",
        "Signal handlers that call `server.close()`, and port `0` in tests, prevent most repeats."
      ]
    },
    {
      "t": "p",
      "x": "Nothing here is a network problem. Your process asked the kernel for one specific socket, the kernel refused, and the refusal is local. So the whole job is working out which program got there first, and whether you actually want to end it."
    },
    {
      "t": "h2",
      "x": "Read the error: it tells you the address"
    },
    {
      "t": "p",
      "x": "Node prints the address it tried to claim. That detail does more work than most people give it credit for."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:...)\n    at listenInCluster (node:net:...)\n    at Server.listen (node:net:...) {\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000\n}"
    },
    {
      "t": "p",
      "x": "The triple colon is not a typo. It is the IPv6 wildcard address `::`, then the port, which is what `app.listen(3000)` with no host argument gives you. The `errno` value is platform specific, 98 on Linux and 48 on macOS, so do not build logic around the number. Older Node releases print the shorter form `Error: listen EADDRINUSE :::3000` without the readable clause, which is worth knowing if you are matching on the string in a script."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Same failure, other runtimes",
      "x": "Python raises `OSError: [Errno 98] Address already in use`. Go reports `listen tcp :8080: bind: address already in use`. Java throws `java.net.BindException: Address already in use`. Different words, identical cause, and everything below applies to all of them."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask who is listening",
          "x": "Filter by port and by listening state, so you do not wade through every outbound connection. The `-nP` flags stop `lsof` resolving hostnames and port names, which also makes it much faster.",
          "code": "# macOS and Linux\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof installed\nss -ltnp 'sport = :3000'\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess"
        },
        {
          "title": "Identify it before you end it",
          "x": "A PID is not evidence. Look at the command line and the parent, because the thing you want to kill is often the parent, and sometimes it is a tool you are deliberately running.",
          "code": "ps -o pid,ppid,pgid,user,command -p 1234\n\n# Windows\nGet-Process -Id 1234 | Format-List Name, Path, StartTime"
        },
        {
          "title": "Ask it to stop",
          "x": "Plain `kill` sends `SIGTERM`, which gives the process a chance to close its listeners, flush logs and finish in-flight requests. Check the port again afterwards rather than assuming.",
          "code": "kill 1234\nlsof -nP -iTCP:3000 -sTCP:LISTEN   # expect no output\n\n# Windows\nStop-Process -Id 1234"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught, so cleanup code never runs. The port itself is released either way, because the kernel closes descriptors when the process dies. Reach for it when a process is wedged, not as a habit.",
          "code": "kill -9 1234\n\n# or kill whatever holds the port, Linux\nfuser -k 3000/tcp\n\n# Windows\ntaskkill /PID 1234 /F"
        }
      ]
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
          "Who holds port 3000",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`ss -ltnp 'sport = :3000'`",
          "`netstat -ano | findstr :3000`"
        ],
        [
          "PID to command",
          "`ps -p 1234 -o command=`",
          "`ps -p 1234 -o cmd=`",
          "`Get-Process -Id 1234`"
        ],
        [
          "Graceful stop",
          "`kill 1234`",
          "`kill 1234`",
          "`Stop-Process -Id 1234`"
        ],
        [
          "Forced stop",
          "`kill -9 1234`",
          "`kill -9 1234`",
          "`taskkill /PID 1234 /F`"
        ],
        [
          "Kill by port in one step",
          "`npx kill-port 3000`",
          "`fuser -k 3000/tcp`",
          "`npx kill-port 3000`"
        ]
      ],
      "caption": "Both `ss -p` and `lsof` hide process details for sockets owned by other users unless you run them with sudo. An empty result is not proof the port is free."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "Here is the part that confuses people. A crashed process cannot hold a socket. Whatever the cause of death, the kernel reclaims that process's file descriptors, and the listening socket goes with them. So if the port is still occupied, something related to your app is still running."
    },
    {
      "t": "h3",
      "x": "An orphaned child inherited the listening socket"
    },
    {
      "t": "p",
      "x": "File descriptors survive `fork`. A worker, a cluster child or a shell wrapper that spawned your server can keep the listening descriptor open after the process you were watching has gone. In an interactive shell, Ctrl-C delivers `SIGINT` to the foreground process group, which usually gets everything. A process started in the background, detached, or under a chain like `npm run dev` to `concurrently` to your server, can easily leave a grandchild behind. A parent PID of `1` is the tell."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# What node processes exist, with their full command lines?\npgrep -af node\n\n# Parent and process group for each one\nps -o pid,ppid,pgid,command -p $(pgrep -d, node)\n\n# Kill a whole process group: note the leading dash on the PGID\nkill -TERM -4812"
    },
    {
      "t": "h3",
      "x": "A watcher restarted before the old process let go"
    },
    {
      "t": "p",
      "x": "File watchers are a common source. `nodemon`, `tsx watch` and similar tools signal the old process and start the new one, and if the old one takes a moment to close its server, the new one hits `EADDRINUSE` and dies. The symptom is distinctive: the crash happens on restart, never on a cold start, and running the server once by hand works fine. Add a `SIGTERM` handler that actually closes the server, and the race usually disappears."
    },
    {
      "t": "h3",
      "x": "A container is still publishing the port"
    },
    {
      "t": "p",
      "x": "A published container port is held by the Docker proxy or by a host firewall rule, not by a process that looks anything like your app. If `lsof` shows something called `docker-proxy`, or shows nothing useful at all, go and check the containers."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "docker ps --filter publish=3000\ndocker compose ps\n\n# Stop the stack properly rather than leaving orphans behind\ndocker compose down --remove-orphans"
    },
    {
      "t": "h3",
      "x": "Your editor is running the thing you forgot about"
    },
    {
      "t": "p",
      "x": "A debug session, a watch-mode test runner, a task that auto-starts on folder open, or a terminal tab from yesterday. Check the command line you get from `ps` before blaming anything more exotic. If the parent process turns out to be your editor, stop it from the editor's own UI, otherwise the task may simply restart."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT myth"
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to a closed connection's four-tuple, not to a listening socket, and Node's TCP server sets `SO_REUSEADDR` before binding. That option exists precisely so a restarted server can bind while old connections from the previous instance are still winding down. So the familiar advice to wait sixty seconds usually describes the wrong mechanism. If waiting does fix it, what you waited out was a slow child process, not the kernel."
    },
    {
      "t": "p",
      "x": "`SO_REUSEADDR` and `SO_REUSEPORT` are also not the same thing. On Linux, `SO_REUSEADDR` does not let two processes listen on the same address and port simultaneously. That is `SO_REUSEPORT`, which Node does not enable by default. Windows socket semantics differ again, and libuv papers over part of the difference. If you need the exact per-platform rules, read libuv's bind implementation rather than trusting a summary, including this one."
    },
    {
      "t": "h2",
      "x": "Loopback, wildcard and IPv6"
    },
    {
      "t": "p",
      "x": "Two servers can fight over a port while naming it differently. `0.0.0.0:3000` is a wildcard bind covering every IPv4 interface, so a second process asking for just `127.0.0.1:3000` is asking for an address that is already taken. `::` is the IPv6 wildcard and, on a dual-stack listener, it generally covers IPv4 as well. That is why a Node server on `:::3000` can block a Python server on `0.0.0.0:3000` even though the two look unrelated in your config files."
    },
    {
      "t": "p",
      "x": "The asymmetric cases, a specific address bound first and a wildcard second, depend on the platform and on which socket options each side set. Rather than reason about it, look at what is actually bound:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: every listening TCP socket with its bound address\nss -ltnp\n\n# macOS\nlsof -nP -iTCP -sTCP:LISTEN\n\n# A loopback-only server, when you do not want it exposed\n# node: app.listen(3000, '127.0.0.1')"
    },
    {
      "t": "h2",
      "x": "Two platform traps worth knowing"
    },
    {
      "t": "p",
      "x": "On macOS Monterey and later, AirPlay Receiver listens on ports 5000 and 7000. Flask's default is 5000, so this bites Python developers constantly, and `lsof` names the owner as a Control Center process rather than anything obviously Apple. Turn AirPlay Receiver off in System Settings, under AirDrop and Handoff, or move your dev server to another port. Apple shuffles that settings layout between releases, so confirm the current path on your own machine."
    },
    {
      "t": "p",
      "x": "On Windows, Hyper-V and WSL2 reserve blocks of TCP ports for dynamic use, and a reserved port produces a bind failure with no process to find. Check the reservations directly:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "netsh interface ipv4 show excludedportrange protocol=tcp\n\n# Reserve your dev port so the dynamic range cannot swallow it.\n# Needs an admin prompt, and the port must be free when you add it.\nnetsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Restarting winnat is not free",
      "x": "The widely repeated fix is `net stop winnat` followed by `net start winnat` from an admin prompt. It does clear the reservations, and it also tears down NAT for running containers and WSL networking while it happens. Do not run it on a machine doing anything you care about, and expect to restart containers afterwards."
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Most repeat offenders are servers with no shutdown path. Handle the signals, close the listener, and put a hard deadline on the whole thing so a hung keep-alive connection cannot hold the port open indefinitely."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const port = Number(process.env.PORT) || 3000;\nconst server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nfunction shutdown(signal) {\n  return () => {\n    console.log(`${signal} received, closing server`);\n    server.close((err) => process.exit(err ? 1 : 0));\n\n    // Added in Node 18.2; check it exists in your runtime.\n    server.closeAllConnections?.();\n\n    // Last resort, so a stuck socket cannot keep the port forever.\n    setTimeout(() => process.exit(1), 10_000).unref();\n  };\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "In tests, do not fight over a fixed port at all. Bind to `0`, let the kernel pick, and read back what you got. Parallel test runners stop colliding, and CI stops failing intermittently for reasons nobody can reproduce locally."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  baseUrl = `http://127.0.0.1:${port}`;\n});\n\n// afterAll\nawait new Promise((resolve) => server.close(resolve));"
    },
    {
      "t": "ul",
      "items": [
        "In Docker, use the exec form of `CMD` so your process is PID 1 and receives `SIGTERM`. Wrapped in a shell, it may never see the signal.",
        "Add `--init` to `docker run`, or `init: true` in Compose, when your app spawns children and you want orphans reaped.",
        "Prefer `docker compose down` to Ctrl-C in the foreground, which leaves containers running more often than people expect.",
        "Give each service in a monorepo its own port, written down in one place. Two services defaulting to 3000 is an argument waiting to happen.",
        "If the process you keep killing is not yours, change your own port instead. Fighting a system service for port 5000 is a losing game."
      ]
    },
    {
      "t": "h2",
      "x": "The port looks free but the bind still fails"
    },
    {
      "t": "ul",
      "items": [
        "**Another user owns it.** `lsof` and `ss` hide what they cannot see. Re-run with sudo before concluding the port is empty.",
        "**Different network namespace.** A container, a VM or a WSL distro can hold a port the host cannot see, and the reverse happens too. Check from both sides.",
        "**Windows reserved range.** See `netsh interface ipv4 show excludedportrange` above.",
        "**You are binding an address this machine does not have.** That gives `EADDRNOTAVAIL`, not `EADDRINUSE`. The address is wrong, not taken.",
        "**systemd socket activation.** The listener belongs to systemd, not to your service. `systemctl list-sockets` shows it.",
        "**A platform-assigned port.** On managed hosts you are usually expected to bind `process.env.PORT`. Hard-coding a port fails in ways that look like a conflict."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One command, with a caveat",
      "x": "`npx kill-port 3000` is convenient and works across platforms. It also kills whatever it finds without telling you what that was, which is a bad trade on a shared or production machine. Use it on your own laptop, during development, and look before you fire anywhere else."
    },
    {
      "t": "h2",
      "x": "EACCES is a different problem"
    },
    {
      "t": "p",
      "x": "If the error code is `EACCES` rather than `EADDRINUSE`, nobody is holding your port. On Linux and macOS, binding a port below 1024 requires privileges, so `app.listen(80)` as an unprivileged user fails on permissions. Run a reverse proxy in front, grant the `CAP_NET_BIND_SERVICE` capability on Linux, or redirect the low port to a high one. Running the whole app as root to work around a bind error is the one option worth avoiding."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find out what is using port 3000?",
          "a": "On macOS or Linux, run `lsof -nP -iTCP:3000 -sTCP:LISTEN`. On Linux without lsof, use `ss -ltnp 'sport = :3000'`. On Windows, `netstat -ano | findstr :3000` gives you the PID, then `Get-Process -Id <pid>` names it. If the result is empty but the bind still fails, re-run with sudo: the socket may belong to another user."
        },
        {
          "q": "Is it safe to kill -9 a process holding a port?",
          "a": "The port is freed either way, because the kernel closes the socket when the process dies. The risk is the process's own cleanup: no flushed buffers, no closed transactions, no graceful handling of in-flight requests. Send `SIGTERM` first with plain `kill`, wait a couple of seconds, and escalate only if it is still there."
        },
        {
          "q": "Why does a port stay in use for a minute after I stop my server?",
          "a": "Usually because something is still running, not because of `TIME_WAIT`. Node sets `SO_REUSEADDR`, which lets a new listener bind while old connections drain. Look for a child or worker process that survived, or a watcher that restarted. `pgrep -af node` plus `ps -o ppid=` will normally show it."
        },
        {
          "q": "How do I just use a different port instead?",
          "a": "Read the port from the environment and set it per run: `PORT=3100 npm run dev`, with `Number(process.env.PORT) || 3000` in code. For tests, bind to port `0` and read `server.address().port`, so the kernel allocates a free one and nothing ever collides."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is listening on that port?",
          "a": "Four common reasons: the process belongs to another user and your tool is hiding it; the port is held inside a container or WSL distro in a separate network namespace; on Windows the port falls in a Hyper-V or WSL2 excluded range; or another process holds the wildcard address while you ask for loopback only. Check the reserved ranges with `netsh interface ipv4 show excludedportrange protocol=tcp`."
        },
        {
          "q": "What is the difference between EADDRINUSE and EADDRNOTAVAIL?",
          "a": "`EADDRINUSE` means the address and port pair is taken by another socket. `EADDRNOTAVAIL` means the address you asked for does not exist on this machine, which typically happens when config pins a specific IP that changed, or when you bind an interface before it has come up. One is a conflict, the other is a typo or a timing bug."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of a container that will not stay up long enough to serve a port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Nothing listening is the mirror image of something already listening.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnosing CORS errors",
          "desc": "Once the server binds, the next wall a local frontend hits.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-16",
  "updated": "2026-11-16",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
