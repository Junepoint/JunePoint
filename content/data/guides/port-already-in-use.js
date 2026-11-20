module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Who Owns Your Port and How to Stop It",
  "h1": "Port already in use: find the owner, then stop it",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a port on macOS, Linux and Windows, stop it safely, and understand why a port stays bound after a crash.",
  "standfirst": "EADDRINUSE means something is already listening. Name that process before you kill anything, because the fast copy-paste fixes take down more than the server you meant to restart.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Name the process holding a port, stop it in the right order, and fix the orphans that cause it after a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The port is rarely the problem. A process is still holding it.",
        "Name the owner first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash, the usual culprit is an orphaned child process, not a socket stuck in `TIME_WAIT`.",
        "Send `SIGTERM` first and give it a second. `kill -9` is for when that fails.",
        "If genuinely nothing owns the port, suspect Docker published ports, a reserved Windows range, or a system service you forgot about."
      ]
    },
    {
      "t": "h2",
      "x": "Name the owner before you kill anything"
    },
    {
      "t": "p",
      "x": "One command answers the question on every Unix-like system. Use the one your machine actually has installed."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: only sockets in the LISTEN state\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof (iproute2 is almost always present)\nss -lptn 'sport = :3000'\n\n# Another Linux option, prints just the PID\nfuser -n tcp 3000\n\n# Windows PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess |\n  ForEach-Object { Get-Process -Id $_.OwningProcess }\n\n# Windows cmd\nnetstat -ano | findstr \":3000\" | findstr LISTENING\ntasklist /FI \"PID eq 12345\""
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Without it, `lsof -i:3000` also lists every *client* socket connected to port 3000, which on a dev machine means your browser, your editor's preview pane, a `curl` you left running and anything else that opened a connection. Those are not holding the port. Killing them achieves nothing except losing your tabs."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The one-liner everyone pastes is blunter than it needs to be",
      "x": "`kill -9 $(lsof -t -i:3000)` has two problems at once. It includes clients as well as the listener, and it jumps straight to `SIGKILL`, so a database or a build process gets no chance to flush anything to disk. If you want a one-liner, make it `kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)` and escalate only if the process is still there a moment later."
    },
    {
      "t": "p",
      "x": "If `lsof` prints nothing but the bind still fails, try it again with `sudo`. An unprivileged `lsof` cannot see sockets owned by other users, which is exactly the case when a service started by `systemd`, a root-owned container helper, or another developer's session on a shared box is holding the port."
    },
    {
      "t": "h2",
      "x": "Why the port is still bound after a crash"
    },
    {
      "t": "p",
      "x": "A listening socket is released when the process holding it dies, and not before. So the real question after a crash is never \"why is the port stuck\", it is \"what is still alive\". The answers cluster into a few shapes:"
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child.** You ran `npm run dev`, which spawned a watcher, which spawned the actual server. Killing the terminal removed the parent and left the grandchild running, reparented to `init`. This is the most common cause by a wide margin.",
        "**A supervisor doing its job.** `nodemon`, `pm2`, `systemd` with `Restart=always`, Docker with `--restart unless-stopped`, or a Kubernetes liveness probe restarted the crashed process within a second. The port is in use because the service came back.",
        "**A detached process group.** Anything started with `&`, `nohup`, `setsid`, `screen`, or an IDE run configuration survives the shell that launched it. Closing the terminal window is not a kill signal.",
        "**A stopped-but-not-dead process.** `Ctrl+Z` suspends; it does not close sockets. A process paused under a debugger holds its listener the whole time.",
        "**Docker still publishing the port.** The application inside the container can be dead while the daemon keeps the host-side binding. Check `docker ps` and `docker compose ps` before blaming your code."
      ]
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "Search this error and you will be told to wait sixty seconds for `TIME_WAIT` to expire. That advice is mostly a leftover from raw C socket programming, and following it wastes your time. `TIME_WAIT` applies to closed *connections*, identified by the full four-tuple of source address, source port, destination address and destination port. It does not describe your listening socket."
    },
    {
      "t": "p",
      "x": "Node, Python's common web servers and the JVM all set `SO_REUSEADDR` on listening sockets by default, which exists precisely so a restart can rebind while old connections drain. Write a plain C server, skip the `setsockopt` call, and you will meet the classic `TIME_WAIT` bind failure. Use a modern framework and you almost certainly will not. Windows is the genuine exception: its socket semantics differ, and a lingering socket there can block a rebind in ways Linux allows."
    },
    {
      "t": "p",
      "x": "A useful test. If the port frees itself after about a minute of doing nothing, `TIME_WAIT` was plausible. If it is still busy five minutes later, a live process owns it, so go back to `lsof`."
    },
    {
      "t": "h2",
      "x": "Stop it in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Get the PID of the listener",
          "x": "Keep the LISTEN filter. Note the command name as well as the number, because it tells you whether you are about to kill a dev server or your company VPN client.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Ask it to shut down",
          "x": "Plain `kill` sends `SIGTERM`. A well-behaved server closes its listener, finishes in-flight requests and exits. Most dev servers take well under a second.",
          "code": "kill 12345"
        },
        {
          "title": "Confirm it actually died",
          "x": "Do not assume. Re-run the lookup. If the old PID is gone but a new one has appeared on the same port, a supervisor is restarting it and you need to stop the supervisor instead.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo \"port is free\""
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught, so the process gets no chance to clean up temp files, release locks or flush buffers. It is the correct tool for a wedged process and the wrong default.",
          "code": "kill -9 12345"
        },
        {
          "title": "Take out the whole process group if children respawn",
          "x": "A negative PID targets a process group, which is how you stop a watcher and everything it spawned in one go. Find the group ID first, then signal it.",
          "code": "ps -o pid,pgid,command -p 12345\nkill -TERM -4242   # note the leading dash: 4242 is the PGID"
        },
        {
          "title": "Or match by command line",
          "x": "Useful when the PID keeps changing. Always run the `pgrep` form first and read the list, because a careless pattern matches your editor, your shell history search and the `grep` itself.",
          "code": "pgrep -af \"node .*server.js\"\npkill -f \"node .*server.js\""
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Cross-platform shortcut",
      "x": "If you switch between machines, `npx kill-port 3000` behaves the same everywhere and saves memorising three command syntaxes. It is still worth running `lsof` first for the handful of times a year when the owner turns out to be something you did not expect."
    },
    {
      "t": "h2",
      "x": "When nothing owns the port"
    },
    {
      "t": "p",
      "x": "Occasionally every lookup comes back empty and the bind still fails. At that point the port is either held by something outside your process table, or reserved before your process ever gets a chance at it."
    },
    {
      "t": "table",
      "head": [
        "Situation",
        "How to check",
        "What to do"
      ],
      "rows": [
        [
          "Docker holds the host side",
          "`docker ps --format \"{{.Names}} {{.Ports}}\"`",
          "Stop the container, or run `docker compose down`. A dead app inside a running container still blocks the published port."
        ],
        [
          "Windows reserved a range",
          "`netsh int ipv4 show excludedportrange protocol=tcp`",
          "Hyper-V, WSL2 and Docker Desktop reserve blocks of ephemeral ports at boot. Pick a port outside the excluded ranges, or pin the dynamic range with `netsh int ipv4 set dynamicport tcp`."
        ],
        [
          "A macOS system service",
          "`sudo lsof -nP -iTCP:5000 -sTCP:LISTEN`",
          "AirPlay Receiver has used port 5000 since macOS Monterey. Turn it off in System Settings, under General then AirDrop & Handoff, or move your app. Checked November 2026; confirm on your own version."
        ],
        [
          "Another network namespace",
          "`sudo ss -lptn` on the host, then again inside the container",
          "A process in a different namespace is invisible to a lookup run outside it. Check both sides before concluding the port is free."
        ],
        [
          "Interface mismatch",
          "Read the address in the error, not only the port",
          "`0.0.0.0:3000` conflicts with everything on 3000. `127.0.0.1:3000` and `192.168.1.10:3000` can coexist happily. A dual-stack `:::3000` bind may collide with an IPv4-only listener depending on the `net.ipv6.bindv6only` setting."
        ]
      ],
      "caption": "Causes that survive an empty lsof result."
    },
    {
      "t": "h2",
      "x": "What the error looks like in each runtime"
    },
    {
      "t": "p",
      "x": "The wording varies, the cause does not. Three details repay a careful read rather than a skim: the errno, the address, and the port."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Typical message",
        "Notes"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use 0.0.0.0:3000`",
          "The address is in the message. A `:::3000` form means it tried to bind IPv6 dual-stack."
        ],
        [
          "Python",
          "`OSError: [Errno 48] Address already in use`",
          "Errno 48 on macOS and BSD, errno 98 on Linux. Same condition, different number."
        ],
        [
          "Java and Spring Boot",
          "`java.net.BindException: Address already in use`",
          "Spring Boot usually prints a friendlier line about the port being in use above the stack trace."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "The `bind:` prefix tells you the failure happened at bind time, not while accepting."
        ],
        [
          "Docker",
          "`... bind: address already in use`",
          "This comes from the daemon programming the host port mapping, so the conflict is on the host rather than inside the image."
        ]
      ],
      "caption": "Messages are shown in the form these runtimes commonly produce; exact wording varies by version, so match on the errno and the address."
    },
    {
      "t": "p",
      "x": "One more distinction saves a lot of wasted effort. `EADDRINUSE` means occupied. `EACCES` on a port below 1024 means you lack permission, and no amount of killing processes will fix it. Grant the binary the `CAP_NET_BIND_SERVICE` capability, put a reverse proxy in front of it, or use a high port in development."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Handling the signal properly removes most repeat offences. The pattern below closes the listener, gives in-flight work a deadline, and reports a conflict in a form you can act on instead of a stack trace."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const http = require('node:http');\n\nconst server = http.createServer(handler);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${err.port} is taken. Find it with: lsof -nP -iTCP:${err.port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.closeIdleConnections();\n  server.close(() => process.exit(0));\n  // Do not hang forever on a keep-alive connection that will not drain.\n  setTimeout(() => {\n    server.closeAllConnections();\n    process.exit(1);\n  }, 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => shutdown(signal));\n}\n\nserver.listen(process.env.PORT || 3000);"
    },
    {
      "t": "p",
      "x": "Three further habits are worth building. In tests, listen on port `0` and read the real port back from `server.address().port`, so parallel test runs never collide. In Docker, use `--init` or an explicit `tini` entrypoint so signals reach your app instead of dying at a shell wrapper. And in `package.json`, prefer runners that forward signals to their children over bare `&` chaining."
    },
    {
      "t": "p",
      "x": "The trade-off with graceful shutdown is real, so be honest about it. A server that waits for connections to drain restarts more slowly than one that exits immediately, and in local development that delay is pure friction. A short fixed deadline, a few seconds at most, is the compromise that keeps both the dev loop and production restarts sane."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Keep-alive is the usual reason close hangs",
      "x": "An idle HTTP keep-alive connection holds the server open, so `server.close()` never fires its callback and the process lingers with the port bound. Node 18.2 added `server.closeIdleConnections()` and `server.closeAllConnections()` for exactly this. Call the first at shutdown and the second when your deadline expires."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the container is gone but the published port is not, start with PID 1 and the exit code.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this error: nothing is listening where you expected it to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node cannot find module",
          "desc": "The other error that greets you on a fresh clone, and why resolution fails.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "On macOS or Linux, run `kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)`, then re-run the lookup to confirm. On Windows, `netstat -ano | findstr \":3000\"` gives you the PID and `taskkill /PID <pid> /F` ends it. Escalate to `kill -9` only when a plain `SIGTERM` is ignored."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends `SIGINT` to the foreground process group of your terminal. If your server was spawned by a wrapper that did not forward the signal, or was started detached, the child keeps running with its socket open. Look for an orphaned process whose parent PID is 1."
        },
        {
          "q": "Does TIME_WAIT stop my server from restarting?",
          "a": "Rarely, in modern web frameworks. `TIME_WAIT` applies to closed connections rather than listening sockets, and Node, Python and the JVM set `SO_REUSEADDR` by default so a restart can rebind. Handwritten C servers without `setsockopt`, and Windows, are the real exceptions. If the port is still busy five minutes later, a live process owns it."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES?",
          "a": "`EADDRINUSE` means another socket already holds that address and port combination. `EACCES` means your user is not allowed to bind it, which on Unix normally means a port below 1024 without elevated privileges. The first needs a process stopped; the second needs a permission change or a different port."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, in two cases. They can bind different addresses, so `127.0.0.1:8080` and `10.0.0.5:8080` coexist. They can also share one address if every socket sets `SO_REUSEPORT` before binding, which is how some multi-worker setups spread accepts across processes. Without that option, the second bind fails."
        },
        {
          "q": "Why does lsof show nothing when the port is clearly in use?",
          "a": "Three likely reasons. You ran it without `sudo` and the owner belongs to another user. The listener lives in a container or another network namespace. Or the port sits inside a range Windows reserved at boot, which you can confirm with `netsh int ipv4 show excludedportrange protocol=tcp`."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-20",
  "updated": "2026-11-20",
  "author": "jackson",
  "related": []
};
