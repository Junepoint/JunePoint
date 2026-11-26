module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: diagnosing EADDRINUSE",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE explained: find the process holding a port on macOS, Linux or Windows, kill it safely, and stop crashes from leaving ports occupied.",
  "standfirst": "What the error actually reports, how to identify the process holding the port on each platform, and why a crashed server so often leaves the port behind.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port in use"
  ],
  "cardDesc": "Identify the process holding your port, kill it safely, and understand why a crash leaves it occupied.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means the operating system refused the bind because something else already holds that address and port. Your code is usually fine.",
        "Identify the owner before you kill anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash the usual culprit is an orphaned child process that outlived the terminal, not a socket stuck in `TIME_WAIT`.",
        "Node sets `SO_REUSEADDR` on listening sockets already, so \"wait sixty seconds for the socket to clear\" is advice that rarely applies.",
        "Kill by PID. Scripts that blast whatever holds a port are fine on your laptop and a bad habit on a shared machine."
      ]
    },
    {
      "t": "p",
      "x": "The fastest route out is two commands: one to name the process, one to end it. Everything else in this guide is about the cases where that does not work, or where the port keeps getting taken again an hour later."
    },
    {
      "t": "h2",
      "x": "Read the error before you kill anything"
    },
    {
      "t": "p",
      "x": "Different runtimes report the same kernel refusal in different words. The wording tells you which address was attempted, which is half the diagnosis."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node (the exact message format has varied between major versions)\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python, on Linux\nOSError: [Errno 98] Address already in use\n\n# Python, on macOS (different errno, same cause)\nOSError: [Errno 48] Address already in use\n\n# Docker\nBind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "That `:::3000` is not a typo. It is the IPv6 wildcard address, meaning the server asked for port 3000 on every interface. If instead you see `127.0.0.1:3000`, the attempt was loopback only. The distinction matters because a wildcard bind and a loopback bind can collide even though the addresses look different, and whether they do depends on the platform and the socket options in play. If you are running one dev server on your own machine, ignore the nuance. If you are debugging a container or a multi-tenant box, note which address the error names and compare it with the address the existing listener holds."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "EADDRINUSE is not EACCES",
      "x": "`EACCES` on a bind means permission, not occupancy. On Linux and macOS, ports below 1024 require root or a granted capability. On Windows, a port inside a Hyper-V reserved range can fail in ways that look like a conflict but have no owning process at all."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "h3",
      "x": "macOS and Linux"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is listening? -n skips DNS, -P skips port-name lookup: faster and clearer\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Example output\n# COMMAND   PID   USER   FD   TYPE            DEVICE SIZE/OFF NODE NAME\n# node    48213   alex   21u  IPv6 0x9f2a1c3d4e5f      0t0  TCP *:3000 (LISTEN)\n\n# Linux, where lsof often is not installed but iproute2 always is\nss -ltnp 'sport = :3000'\n\n# Just the PID, for scripting\nlsof -ti tcp:3000"
    },
    {
      "t": "p",
      "x": "Read the `COMMAND` and `USER` columns, not only the PID. A `node` process owned by you is yours to kill. Something called `com.docker.backend`, `docker-proxy`, `rapportd` or `ControlCenter` is not a stray dev server, and killing it will not end well."
    },
    {
      "t": "p",
      "x": "If `lsof` prints nothing but the bind still fails, run it again under `sudo`. Without elevation it only reports sockets owned by your user, so a listener started by root, by another developer on the same box, or by a service manager stays invisible. This single detail explains most reports of \"EADDRINUSE but nothing is using the port\"."
    },
    {
      "t": "h3",
      "x": "Windows"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\"\ntaskkill /PID 12345 /F\n\n# Reserved ranges that no process owns\nnetsh interface ipv4 show excludedportrange protocol=tcp"
    },
    {
      "t": "p",
      "x": "That last command is worth knowing. Hyper-V, WSL2 and Docker Desktop reserve blocks of dynamic ports on Windows, and a reserved block cannot be bound by anything, including you. Ports in the 50000s and 60000s are common casualties. If your port sits inside an excluded range, no amount of process hunting will help: change the port, or reconfigure the dynamic range and reboot."
    },
    {
      "t": "table",
      "head": [
        "Task",
        "macOS",
        "Linux",
        "Windows (PowerShell)"
      ],
      "rows": [
        [
          "Find the listener",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`ss -ltnp 'sport = :3000'`",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`"
        ],
        [
          "Get the PID alone",
          "`lsof -ti tcp:3000`",
          "`fuser 3000/tcp`",
          "`(Get-NetTCPConnection -LocalPort 3000).OwningProcess`"
        ],
        [
          "Ask it to stop",
          "`kill <pid>`",
          "`kill <pid>`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Force it to stop",
          "`kill -9 <pid>`",
          "`fuser -k -9 3000/tcp`",
          "`Stop-Process -Id <pid> -Force`"
        ],
        [
          "Check reserved ranges",
          "not applicable",
          "`cat /proc/sys/net/ipv4/ip_local_port_range`",
          "`netsh interface ipv4 show excludedportrange protocol=tcp`"
        ]
      ],
      "caption": "Equivalent commands per platform. Substitute your own port for 3000."
    },
    {
      "t": "h2",
      "x": "Kill the right process, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask politely first",
          "x": "`SIGTERM` gives the process a chance to close its listener, flush logs and finish in-flight requests. A dev server that handles signals properly exits in milliseconds.",
          "code": "kill 48213"
        },
        {
          "title": "Confirm it is gone",
          "x": "`kill -0` sends no signal; it only tests whether you can signal the PID. A `No such process` reply is the result you want.",
          "code": "kill -0 48213"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught. Nothing is flushed, no shutdown hook runs, and any temp files or lock files the process created stay behind. Reach for it when `SIGTERM` has had a second or two and done nothing.",
          "code": "kill -9 48213"
        },
        {
          "title": "The one-liner, with its caveat",
          "x": "Convenient, and worth understanding before you alias it. If `lsof` finds nothing the command substitution is empty, so you run `kill -9` with no arguments and get a usage error. If it finds several PIDs you kill all of them, which is correct for a cluster of workers and wrong if one of them belongs to someone else.",
          "code": "kill -9 $(lsof -ti tcp:3000)"
        }
      ]
    },
    {
      "t": "p",
      "x": "On Linux, `fuser -k 3000/tcp` does the lookup and the kill together. There is also `npx kill-port 3000`, a small package that wraps the platform differences; handy on a team where people work across operating systems, though it is another dependency to trust for something two builtin commands already do."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not do this on a server",
      "x": "A script that kills whatever holds a port is a laptop tool. On a shared or production host, the owner of port 8080 might be the service you are about to page someone about. Name the process, check the user, then act."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part people find genuinely confusing. The terminal is gone, the stack trace is on screen, nothing should be running. And yet the port is held. Almost always, the explanation is that a process you think died is still alive."
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child.** Ctrl+C sends `SIGINT` to the foreground process group of your terminal. A child that was detached, double-forked, or started with its own process group never receives it. Its parent dies, it gets reparented to PID 1, and it keeps the socket open indefinitely.",
        "**A wrapper that died first.** Chains built from `npm run`, `concurrently`, `&&` and shell scripts give the signal to the wrapper. If the wrapper exits without forwarding anything, the real server is now an orphan.",
        "**A watcher restarting into itself.** `nodemon` and `node --watch` restart on file change. If the previous process is slow to release the socket, or the watcher triggers twice in quick succession, the new one binds before the old one has finished exiting.",
        "**A supervisor doing its job.** `systemd`, `pm2`, Docker restart policies and Kubernetes all exist to bring crashed processes back. Your crash was repaired within a second by something whose entire purpose is repairing it.",
        "**A container publishing the port.** The Docker proxy holds the host side of a published port for as long as the container runs. `docker ps --filter publish=3000` names the container directly.",
        "**Another window.** An IDE terminal, a `tmux` pane, a Codespace, a second clone of the repo. Unglamorous, and the most common cause of all.",
        "**macOS system services.** AirPlay Receiver has listened on ports 5000 and 7000 since Monterey, which is why those two ports break Flask tutorials specifically. Turn the feature off in System Settings, or move your server."
      ]
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Is the holder an orphan? A PPID of 1 is the tell.\nps -o pid,ppid,stat,lstart,command -p $(lsof -ti tcp:3000)\n\n# Find every node process that looks like yours\npgrep -af 'node .*server'\n\n# Containers publishing the port\ndocker ps --filter publish=3000"
    },
    {
      "t": "p",
      "x": "The `lstart` column settles arguments. If the listener started three hours ago, it is not the server you launched two minutes ago, and restarting your editor will not fix anything."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT, and the advice that usually does not apply"
    },
    {
      "t": "p",
      "x": "Search for this error and you will be told to wait a minute for the socket to leave `TIME_WAIT`, or to set `SO_REUSEADDR`. Both pieces of advice are real, both describe a genuine TCP behaviour, and neither is likely to be your problem."
    },
    {
      "t": "p",
      "x": "Here is the mechanism. When a TCP connection closes, the side that closed first keeps the connection tuple in `TIME_WAIT` for roughly twice the maximum segment lifetime, so that stray packets from the old connection cannot be mistaken for part of a new one. Those lingering tuples are *connections*, not listeners. Historically, a leftover `TIME_WAIT` connection could block a new listener from binding the same port, which is exactly why `SO_REUSEADDR` exists."
    },
    {
      "t": "p",
      "x": "Modern runtimes set that option for you. libuv, and therefore Node, enables `SO_REUSEADDR` on listening sockets on Unix platforms; on Windows it uses exclusive address use instead, which is the safer default there. Go's net package does the same. So if you are writing Node and you hit `EADDRINUSE` immediately after a crash, `TIME_WAIT` is almost certainly not the reason. A live process is holding the port. Find it."
    },
    {
      "t": "p",
      "x": "Two places where the old advice still bites. Raw socket code in C or Python that calls `bind()` without setting `SO_REUSEADDR` first will hit the classic behaviour, which is why `socketserver.TCPServer` exposes `allow_reuse_address`. And `SO_REUSEADDR` is not `SO_REUSEPORT`: the former is about leftover state, the latter lets several live processes share a listening port deliberately. Confusing the two produces the worst version of this bug, where two servers bind successfully and incoming requests are split between them at random."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Killing the process is a fix for this minute. Handling shutdown properly is a fix for the rest of the project."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const port = Number(process.env.PORT) || 3000;\nconst server = app.listen(port, () => console.log(`listening on ${port}`));\n\n// A useful error beats a stack trace\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is taken. Find the owner with:`);\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nconst shutdown = () => {\n  server.close(() => process.exit(0));\n  // Node 18.2 and later: keep-alive sockets otherwise hold close() open\n  server.closeAllConnections?.();\n  // Never hang forever waiting for a stuck handler\n  setTimeout(() => process.exit(1), 5000).unref();\n};\n\nprocess.on('SIGINT', shutdown);\nprocess.on('SIGTERM', shutdown);"
    },
    {
      "t": "p",
      "x": "Three details in there earn their keep. The `error` handler turns an unhandled exception into a message that tells the next person what to run. `closeAllConnections` matters because `server.close()` stops accepting new connections but waits for existing keep-alive sockets, and a browser holds those open; without it, shutdown can appear to hang while the port stays bound. The unref'd timeout guarantees the process leaves even when a handler misbehaves."
    },
    {
      "t": "p",
      "x": "For tests, stop picking port numbers at all. Bind to port 0 and let the kernel assign a free one, then read it back. Parallel test runners and CI agents conflict constantly otherwise."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;\n\n// Jest, Vitest, node:test: close it in teardown or the runner hangs\nafterAll(() => new Promise((resolve) => server.close(resolve)));"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Three habits that prevent most of these",
      "x": "Read the port from an environment variable so a colliding service can be moved without editing code. In Docker, change the host side of the mapping (`-p 3001:3000`) rather than the application's own port. And when a watcher leaves orphans behind, check whether your start script actually forwards signals, because `sh -c` wrappers frequently do not."
    },
    {
      "t": "h2",
      "x": "A short checklist"
    },
    {
      "t": "ol",
      "items": [
        "Note the exact address in the error: wildcard, loopback or a specific interface.",
        "Look up the listener. If nothing appears, run the lookup again with `sudo`.",
        "Check the command name, the user and the start time before signalling anything.",
        "`SIGTERM`, verify, then `SIGKILL` only if needed.",
        "If the port is retaken within seconds, suspect a supervisor or a watcher rather than a ghost socket.",
        "If nothing owns the port on Windows, check the excluded port ranges."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process running on port 3000?",
          "a": "On macOS or Linux: `lsof -ti tcp:3000` gives the PID, then `kill <pid>`, escalating to `kill -9 <pid>` only if it ignores the first signal. On Linux, `fuser -k 3000/tcp` does both steps. On Windows, `netstat -ano | findstr :3000` gives the PID and `taskkill /PID <pid> /F` ends it. Check the process name first so you do not kill a system service that happens to use the port."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is using the port?",
          "a": "Usually because your lookup could not see the owner. `lsof` and `ss` only report sockets belonging to your user unless you run them with `sudo`, so a listener started by root or by a service manager looks like nothing at all. Other candidates: a container publishing the port, a process inside WSL2 when you are looking from Windows (or the reverse), and on Windows a Hyper-V reserved port range that genuinely has no owning process."
        },
        {
          "q": "Does the port free itself if I just wait?",
          "a": "If a live process holds it, no, waiting achieves nothing. The \"wait sixty seconds\" advice refers to TCP `TIME_WAIT`, which applies to closed connections rather than listeners and is already worked around by `SO_REUSEADDR` in Node, Go and most modern runtimes. When the port does free itself after a pause, that normally means a process was shutting down slowly, not that a socket timed out."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group. A detached child, or one started through a wrapper script that did not forward the signal, never gets it: the parent exits, the child is reparented to PID 1, and it keeps the socket. Run `ps -o pid,ppid,command -p $(lsof -ti tcp:3000)` and look for a PPID of 1. Handling `SIGINT` and `SIGTERM` in your server, and making start scripts forward signals, removes the problem at the source."
        },
        {
          "q": "Is it safe to use kill -9 on a dev server?",
          "a": "Mostly, with two caveats. `SIGKILL` cannot be caught, so nothing flushes: buffered logs are lost, temp files and lock files stay behind, and anything mid-write can be left truncated. It also hides the real bug, which is a server that ignores `SIGTERM`. Try the polite signal first and fix the shutdown handler if it never works."
        },
        {
          "q": "How do I stop two servers starting on the same port during development?",
          "a": "Give the new process somewhere to go rather than making it fight for the port. Read the port from `process.env.PORT`, bind to port 0 in tests so the kernel picks a free one, and in Docker change the host side of the mapping instead of the application port. If a file watcher is the source, make sure the old process fully exits before the restart, which in practice means handling `SIGTERM` and closing keep-alive connections."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Why a container dies on start, and how to read exit codes 0, 1 and 137.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Trace a refused database connection through each layer, from process to client config.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node cannot find module",
          "desc": "How Node resolves a specifier, and why the lookup fails where you least expect.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-26",
  "updated": "2026-11-26",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
