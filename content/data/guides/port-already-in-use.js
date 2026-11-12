module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free the Process on Your Port",
  "h1": "Port already in use: finding the process that holds it",
  "eyebrow": "Troubleshooting",
  "description": "Find which process holds a port, kill the right one safely, and understand why EADDRINUSE keeps appearing after a dev server crashes.",
  "standfirst": "A port is held by a process, not by the operating system. Find that process, decide whether it deserves a polite signal or a forced one, then fix the shutdown path that leaked it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Locate the process holding a port, kill it without taking out your editor, and stop the leak recurring.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -ti tcp:3000 -sTCP:LISTEN` gives you the PID of the listener and nothing else. Plain `lsof -i :3000` also lists every client connected to that port, which is how people end up killing their own browser.",
        "After a crash, the usual culprit is a child process that inherited the listening socket. The parent is gone, the file descriptor is not.",
        "TIME_WAIT is rarely the cause in Node, Go or Python servers that set `SO_REUSEADDR`. Waiting 60 seconds and trying again hides the real problem.",
        "A port below 1024 that you cannot bind usually fails with `EACCES`, not `EADDRINUSE`. Different error, different fix.",
        "If nothing appears to own the port, suspect a Windows reserved range, macOS AirPlay on 5000 and 7000, or a Docker publish rule."
      ]
    },
    {
      "t": "h2",
      "x": "Find the process in one command"
    },
    {
      "t": "p",
      "x": "Start by asking the kernel who is listening. The answer is a PID. Everything after that is a decision about what to do with it."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: listening sockets on port 3000, with the owning process\nss -ltnp 'sport = :3000'\n\n# macOS and Linux: just the PID of the listener\nlsof -ti tcp:3000 -sTCP:LISTEN\n\n# Same, with user, command and address family\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nfuser -v 3000/tcp"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Without it, `lsof -i :3000` returns the listening socket *and* every established connection to or from that port. On a machine where a browser, a test runner and two terminal tabs are all talking to your dev server, that is six or seven PIDs, only one of which is holding the port."
    },
    {
      "t": "p",
      "x": "On Linux, `ss` only shows the process name and PID for sockets you own. Run it under `sudo` if the column comes back empty; the socket may belong to another user or to a system service."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: the PID holding the listening socket\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object -ExpandProperty OwningProcess\n\n# Turn that PID into something recognisable\nGet-Process -Id 12345\n\n# cmd.exe equivalent\nnetstat -ano | findstr \":3000\" | findstr LISTENING\n\n# Stop it\ntaskkill /PID 12345 /F"
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "p",
      "x": "Every runtime reports the same underlying errno, and each one phrases it differently. The address in the message is worth reading closely, because it tells you which interface the bind was attempted on."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Typical message"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use` on Linux, `[Errno 48]` on macOS"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`"
        ]
      ],
      "caption": "One errno, six wordings. The number differs by platform: 98 on Linux, 48 on BSD and macOS."
    },
    {
      "t": "p",
      "x": "`:::3000` means the bind was attempted on the IPv6 wildcard address, which on most Linux systems also covers IPv4 through dual-stack mapping. `127.0.0.1:3000` means loopback only. That distinction explains a confusing case: a process bound to `127.0.0.1:3000` and a process trying to bind `0.0.0.0:3000` will collide, because the wildcard overlaps the specific address. Two processes binding different specific addresses on the same port will not."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "EADDRINUSE and EACCES are different problems",
      "x": "If you cannot bind port 80 or 443 as a normal user, the error is `EACCES`, not `EADDRINUSE`, and no amount of hunting for a listener will help. Bind a high port and put a reverse proxy in front of it, or grant the capability explicitly with `sudo setcap 'cap_net_bind_service=+ep' $(which node)`. Running the whole dev server as root to dodge this is the worse option."
    },
    {
      "t": "h2",
      "x": "Kill the right process, not every process"
    },
    {
      "t": "p",
      "x": "Once you have a PID, send it `SIGTERM` first. Most servers trap it, close the listener, drain connections and exit. `SIGKILL` cannot be trapped, so the process gets no chance to flush logs, remove a PID file or close a database handle cleanly."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Polite: the process can clean up\nkill 12345\n\n# Check whether it actually went away\nkill -0 12345 2>/dev/null && echo \"still running\"\n\n# Last resort\nkill -9 12345\n\n# One-liner, listeners only, no clients caught in the net\nkill $(lsof -ti tcp:3000 -sTCP:LISTEN)"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Two commands worth not copying",
      "x": "`sudo killall -9 node` takes out language servers, build watchers and anything else running on Node, including editor tooling with unsaved state. `kill -9 $(lsof -ti:3000)` without the `LISTEN` filter kills connected clients as well as the server. Both appear near the top of most search results for this error."
    },
    {
      "t": "h2",
      "x": "Why it happens after a crash"
    },
    {
      "t": "p",
      "x": "A listening socket is a file descriptor. File descriptors are inherited across `fork`, and they survive the death of the process that created them as long as some other process still holds a copy. That single fact explains most post-crash cases."
    },
    {
      "t": "p",
      "x": "Your dev server probably is not one process. `nodemon` spawns a child. `concurrently` spawns several. A cluster setup forks workers that all share the parent's listening descriptor by design. Jest workers, a debugger wrapper, a shell script wrapping the real command: each adds a layer. When the top-level process dies hard, the children are reparented to init and keep running, and the port stays bound because one of them still has the descriptor open. The parent you were watching in the terminal is gone, so it looks like nothing is holding the port."
    },
    {
      "t": "ul",
      "items": [
        "**Ctrl+Z instead of Ctrl+C.** Suspension is not termination. The process is stopped, still owns the socket, and `jobs` will show it.",
        "**A graceful shutdown that never completes.** `server.close()` stops accepting new connections but waits for existing ones to finish. One keep-alive connection from an open browser tab can hold the old process open indefinitely while the new one fails to bind.",
        "**The supervisor restarted faster than the old process exited.** systemd, pm2 and nodemon can all start the replacement while the previous instance is still draining.",
        "**A container is publishing the port.** `docker ps` and its `PORTS` column will show it. On Linux, `lsof` may name `docker-proxy` rather than anything you recognise.",
        "**A different project.** Three repos that all default to port 3000 is a common situation, and the one you forgot about is the one that is running."
      ]
    },
    {
      "t": "p",
      "x": "To find inherited sockets, look at the process tree rather than a single PID. `ps -ef --forest` on Linux or `pstree -p` shows which parent spawned what, and `lsof -p <pid>` lists the descriptors a given process holds. If the listener's parent PID is 1, it has been orphaned, which is a strong hint that something crashed out from under it."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT: the explanation that is usually wrong"
    },
    {
      "t": "p",
      "x": "The most repeated answer to this error is that the port is in `TIME_WAIT` and you should wait a minute. That is a real TCP state, and the reasoning is not nonsense: after a server closes a connection it had accepted, the socket sits in `TIME_WAIT` for roughly 60 seconds on Linux, with the local port set to your listening port. Binding a fresh listener to that port can fail as a result."
    },
    {
      "t": "p",
      "x": "It is usually not your problem. `SO_REUSEADDR` exists precisely to permit a bind over lingering `TIME_WAIT` sockets, and libuv sets it by default on Unix for Node servers. Go's standard library does the same. Python's `http.server` and the common frameworks set it as well, though a hand-rolled `socket.socket()` does not unless you ask. So if a Node app is reporting `EADDRINUSE`, a live process is holding the port and waiting will not help. Check first, wait later."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "SO_REUSEADDR means something else on Windows",
      "x": "On Windows, `SO_REUSEADDR` lets a second process bind a port another process is already listening on, which is a hijacking risk rather than a convenience. `SO_EXCLUSIVEADDRUSE` is the option that behaves the way Unix developers expect. Socket code copied from a Unix example can behave differently there."
    },
    {
      "t": "h2",
      "x": "When nothing seems to own the port"
    },
    {
      "t": "p",
      "x": "Sometimes `lsof` and `ss` come back empty and the bind still fails. A short list covers nearly all of it."
    },
    {
      "t": "ul",
      "items": [
        "**Windows reserved port ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ephemeral ports. Nothing is listening, but the bind fails anyway. Check with `netsh interface ipv4 show excludedportrange protocol=tcp`.",
        "**macOS AirPlay Receiver.** On recent macOS versions, `ControlCenter` listens on ports 5000 and 7000. Turning off AirPlay Receiver in System Settings frees them, or move your server to another port.",
        "**Another network namespace.** A process inside a container holds the port from the host's point of view but will not show up in a host-level `lsof` under a familiar name.",
        "**Permissions.** Without `sudo`, `lsof` and `ss` hide processes belonging to other users. An empty result is not proof of an empty port.",
        "**A different address family.** Something bound to the IPv6 wildcard while you grep for an IPv4 address, or the reverse. Use `-nP` with `lsof` so nothing is resolved into a name you are not searching for."
      ]
    },
    {
      "t": "h2",
      "x": "Stop leaking the port in the first place"
    },
    {
      "t": "p",
      "x": "Killing the process is the fix for today. Handling shutdown properly is the fix for the rest of the month."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const http = require('node:http');\n\nconst port = Number(process.env.PORT) || 3000;\nconst server = http.createServer(app);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is already in use. Set PORT to something else.`);\n    process.exit(1);\n  }\n  throw err;\n});\n\n// Close the listener on the signals a supervisor actually sends.\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => {\n    server.close(() => process.exit(0));\n    // Do not wait forever on keep-alive connections.\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}\n\nserver.listen(port);"
    },
    {
      "t": "p",
      "x": "The timeout is the part people leave out. Without it, `server.close()` waits on every open keep-alive connection, the process lingers, and the next start fails with the error you were trying to prevent. Node 18.2 and later also provide `server.closeAllConnections()` and `server.closeIdleConnections()`, which give you a more deliberate version of the same escape hatch."
    },
    {
      "t": "p",
      "x": "For tests and anything running several instances at once, stop picking a port at all. Pass `0` and let the kernel assign a free one."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "server.listen(0, () => {\n  const { port } = server.address();\n  console.log(`listening on ${port}`);\n});"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify before you kill",
          "x": "Get the PID and the command name together, so you know what you are about to stop. A surprising number of these reports turn out to be a second copy of the same app, started from another branch in another terminal.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Send SIGTERM and verify",
          "x": "Give the process a chance to clean up, then confirm the port is free before restarting. Restarting into a half-dead listener produces the same error and wastes the next ten minutes.",
          "code": "kill $(lsof -ti tcp:3000 -sTCP:LISTEN)\nsleep 1\nlsof -ti tcp:3000 -sTCP:LISTEN || echo free"
        },
        {
          "title": "Check the process tree if it comes back",
          "x": "A port reoccupied seconds after you free it means a supervisor is restarting the service. Find the parent instead of killing the child repeatedly.",
          "code": "ps -o pid,ppid,command -p $(lsof -ti tcp:3000 -sTCP:LISTEN)"
        },
        {
          "title": "Fix the shutdown path",
          "x": "Add the signal handlers and the close timeout shown above. In Docker, use the exec form of `CMD` so your process runs as PID 1 and receives `SIGTERM` directly instead of sitting behind a shell that swallows it.",
          "code": "CMD [\"node\", \"server.js\"]"
        }
      ]
    },
    {
      "t": "p",
      "x": "That last step catches people regularly. With the shell form, `CMD node server.js`, PID 1 is `/bin/sh`, your server is a child, and `docker stop` sends `SIGTERM` to the shell, which does not forward it. The container is killed after the grace period and your cleanup code never runs. The PID 1 behaviour described in [why containers exit immediately](/guides/docker-container-exits-immediately/) is the same mechanism seen from the other side."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find what is using port 3000?",
          "a": "On macOS or Linux, run `lsof -nP -iTCP:3000 -sTCP:LISTEN`. On Linux you can also use `ss -ltnp 'sport = :3000'`. On Windows, `Get-NetTCPConnection -LocalPort 3000 -State Listen` gives you the owning PID, which `Get-Process -Id` turns into a name. Add `sudo` on Unix if the process column is blank, since you cannot see other users' sockets otherwise."
        },
        {
          "q": "What does EADDRINUSE actually mean?",
          "a": "The `bind()` system call failed because the address and port combination you asked for is already taken. It is errno 98 on Linux and 48 on macOS. The important word is *address*: binding `0.0.0.0:3000` conflicts with anything on that port, while two processes can bind the same port on genuinely different interfaces."
        },
        {
          "q": "Why is the port still in use after I killed the process?",
          "a": "Almost always because a child process inherited the listening file descriptor and is still alive. Check the process tree with `ps -ef --forest` or `pstree -p`, and look for a listener whose parent PID is 1. The other common cause is a supervisor such as nodemon, pm2 or systemd restarting the service as fast as you kill it."
        },
        {
          "q": "Is kill -9 safe for a dev server?",
          "a": "For a stateless local dev server, usually yes, but it is the wrong default. `SIGKILL` cannot be trapped, so there is no chance to flush logs, close database connections or remove lock files. Try `kill` first, wait a second, and escalate only if the process is still there."
        },
        {
          "q": "How long does TIME_WAIT last, and should I wait it out?",
          "a": "Roughly 60 seconds on Linux, where the value is a compile-time constant rather than a tunable sysctl. In practice you should not need to wait, because servers in Node, Go and most Python frameworks set `SO_REUSEADDR`, which permits binding over lingering TIME_WAIT sockets. If waiting appears to fix it, what actually happened is that a slow process finally exited."
        },
        {
          "q": "Why does port 5000 fail on macOS when nothing is running?",
          "a": "AirPlay Receiver binds ports 5000 and 7000 on recent macOS versions, under the `ControlCenter` process. Disable AirPlay Receiver in System Settings, or pick a different port. Confirm it on your own machine with `lsof -nP -iTCP:5000 -sTCP:LISTEN` before assuming, as the specific ports have shifted between releases."
        },
        {
          "q": "Can I make the server pick a free port automatically?",
          "a": "Yes. Call `listen(0)` and read the assigned port back from `server.address().port` once the socket is bound. That is the right approach for test suites and for anything that may run several copies at once. It is a poor fit for a service clients reach at a fixed address."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Signal handling, PID 1 and why your cleanup code never runs.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite failure: nothing is listening where you expected it.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "The other error that greets you at startup, and how resolution works.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-12",
  "updated": "2026-11-12",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
