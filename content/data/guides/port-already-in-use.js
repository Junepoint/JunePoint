module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: diagnosing EADDRINUSE",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something is still holding the port. Find the PID, kill it safely, and fix the crash that orphaned it in the first place.",
  "standfirst": "The commands that name the process sitting on a port on Linux, macOS and Windows, and why a crashed server so often leaves one behind.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Find the process holding a port, kill it without collateral damage, and stop the crash that left it there.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, and `netstat -ano | findstr :3000` on Windows, names the process holding the port.",
        "Send SIGTERM first. `kill -9` skips cleanup, so it leaves lock files, pid files and orphaned children behind.",
        "After a crash the port is usually held by a surviving child process, not by a lingering socket. TIME_WAIT almost never blocks a listener in Node, Go or Flask, because those set `SO_REUSEADDR`.",
        "`:::3000` in the Node error is the IPv6 wildcard address, which on most Linux hosts covers IPv4 too.",
        "If nothing shows up in `lsof`, suspect another user's process, a container publishing the port, or a different network namespace."
      ]
    },
    {
      "t": "p",
      "x": "The fast version: something is already listening on that address and port, it is almost certainly a process you started, and the fix is three commands. The slow version is worth reading too, because the same error has four or five different root causes and the one you hit after a crash is usually not the one the top search result describes."
    },
    {
      "t": "h2",
      "x": "What the error actually means"
    },
    {
      "t": "p",
      "x": "A TCP listening socket is identified by the pair (local address, local port). The kernel permits exactly one listener for a given pair unless every socket involved explicitly opts into port sharing. When your server calls `bind()` and that pair is taken, the call fails with errno 98 on Linux, errno 48 on macOS and BSD, and WSAEADDRINUSE (10048) on Windows. Everything above that layer is just a different wrapper around the same refusal."
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
          "`:::3000` is the IPv6 wildcard. `0.0.0.0:3000` or `127.0.0.1:3000` appear when you bind explicitly."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 48 on macOS. Raw `socketserver.TCPServer` is the one case where TIME_WAIT really does bite."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "Wrapped in `*net.OpError`, so `errors.Is(err, syscall.EADDRINUSE)` works."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Spring Boot usually prints its own \"Web server failed to start. Port 8080 was already in use.\" above it."
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "Raised by the daemon before your container starts. The conflict may be another container."
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Often a second nginx master left over from a failed reload, or Apache."
        ]
      ],
      "caption": "The same bind failure, surfaced by different runtimes."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Minimal images and older boxes\nnetstat -ltnp 2>/dev/null | grep ':3000 '\n\n# Just the PIDs, nothing else\nlsof -t -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "The `-nP` flags on `lsof` turn off hostname and service-name lookups. That makes the command return instantly instead of stalling on DNS, and it prints `3000` rather than a service alias you then have to translate. The `-sTCP:LISTEN` filter matters more than it looks: without it you also get every established connection to or from that port, which on a busy machine is pages of noise hiding the one line you want."
    },
    {
      "t": "p",
      "x": "Two gaps to know about. `lsof` and `ss -p` can only show you the owning PID of processes you have the right to inspect, so a port held by another user or by a system daemon looks mysteriously empty until you re-run with `sudo`. And on Linux, `ss` will happily list the socket while leaving the process column blank for the same reason."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, classic\nnetstat -ano | findstr :3000\n# the last column is the PID\ntasklist /FI \"PID eq 18244\"\n\n# Windows, PowerShell 5+\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess,\n    @{n='Name';e={(Get-Process -Id $_.OwningProcess).ProcessName}}"
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "PID=$(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# 1. Ask politely. SIGTERM lets the process run its shutdown handler.\nkill \"$PID\"\n\n# 2. Check whether it actually went.\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# 3. Only if it ignored SIGTERM:\nkill -9 \"$PID\"\n\n# Linux shortcut that does lookup and kill together\nfuser -k 3000/tcp"
    },
    {
      "t": "p",
      "x": "Start with SIGTERM every time. A web server handed SIGTERM gets to drain in-flight requests, flush logs, remove its pid file and tell its children to stop. SIGKILL cannot be caught, so none of that happens: you get stale `.pid` files that make the next start refuse, half-written caches, and children reparented to init that are still holding the very port you were trying to free. The irony of `kill -9` on a port conflict is that it is a reliable way to create the next port conflict."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not pattern-kill by name",
      "x": "`pkill -f node`, `killall java` and `taskkill /IM python.exe /F` are tempting one-liners that match far more than you mean. On a shared box or a CI runner they will take down other people's work, language servers, and sometimes the agent that is running your build. Kill the PID you looked up, not a name."
    },
    {
      "t": "p",
      "x": "`npx kill-port 3000` works and is convenient, but it is a third-party package resolved over the network every time you run it, and it sends a hard kill. For a local dev server that is fine. In a deploy script, prefer the two platform commands above, which have no dependencies and let you log what you killed."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the interesting case. Your process died, you saw the stack trace, the terminal came back, and yet the port is occupied. The socket almost never outlives the process that owned it. What outlives it is a relative."
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child.** If your app forks workers, spawns a sidecar, or runs anything under `child_process`, those children inherit the listening file descriptor. The parent crashing does not close a descriptor that another process still holds open.",
        "**A wrapper that did not forward the signal.** `npm run dev`, `nodemon`, `concurrently`, `foreman` and friends sit between your shell and the real server. When the wrapper exits badly, or when Ctrl+C reaches only the wrapper, the server underneath keeps running with PPID 1.",
        "**A second copy you forgot about.** A background job from `&`, a detached `tmux` pane, an editor's integrated terminal that survived the window closing, or the debug session you started an hour ago. This is the single most common cause and the easiest to dismiss.",
        "**A container or a service manager.** Docker publishes the port on the host, so the host port stays allocated while the container lives, and `docker ps` is the only place it shows up. systemd with `Restart=always` will put the service straight back after you kill it, which looks like the kill failing.",
        "**A different thing entirely.** The port you consider yours may belong to something else on this machine. Nothing is reserved for you."
      ]
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is related to whom? Orphans show PPID 1.\nps -eo pid,ppid,etime,command | grep -E 'node|python' | grep -v grep\n\n# Kill a whole process group instead of one leaf\nkill -TERM -- -\"$(ps -o pgid= -p \"$PID\" | tr -d ' ')\"\n\n# Is it a container?\ndocker ps --format '{{.Names}}\\t{{.Ports}}'\n\n# Is a service manager going to restart it?\nsystemctl status myapp"
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT myth"
    },
    {
      "t": "p",
      "x": "You will read that EADDRINUSE after a crash is caused by sockets sitting in TIME_WAIT for a minute or two, and that the fix is to wait, or to shorten a kernel timer. That is usually wrong, and the kernel timer advice is actively bad."
    },
    {
      "t": "p",
      "x": "TIME_WAIT applies to a connection four-tuple after close, not to a listening socket. A listening socket disappears the moment its last descriptor closes. More to the point, `SO_REUSEADDR` exists precisely so that a leftover TIME_WAIT connection does not prevent a fresh bind, and most server stacks set it for you: libuv (so all of Node), Go's `net.Listen`, Python's `http.server` and Werkzeug. If your server is one of those and the port is taken, a live process has it. Go find the process."
    },
    {
      "t": "p",
      "x": "The exception is code that creates sockets by hand. `socketserver.TCPServer` in the standard library defaults `allow_reuse_address` to false, and plain C or Rust socket code sets nothing unless you say so, which is exactly where the TIME_WAIT folklore came from. Set `SO_REUSEADDR` before `bind()` there. One caveat if you write cross-platform networking code: `SO_REUSEADDR` on Windows has different semantics and can let an unrelated process take over a port, which is why libuv uses exclusive binding there instead. Do not copy the Unix habit blindly."
    },
    {
      "t": "h2",
      "x": "Cases that look like a busy port but are not"
    },
    {
      "t": "ul",
      "items": [
        "**`EACCES`, not `EADDRINUSE`.** Binding below port 1024 as a non-root user fails with a permission error. If you read the error quickly and assumed a conflict, you will hunt for a process that does not exist.",
        "**macOS and ports 5000 and 7000.** Since macOS 12, the AirPlay Receiver feature listens on these. It is a genuine conflict with a non-obvious owner, and you can turn it off in System Settings under General, then AirDrop & Handoff. Verify the exact path on your version; Apple moves these panes between releases.",
        "**IPv4 against IPv6.** A process on `:::3000` with dual-stack enabled also answers on IPv4, so your attempt to bind `0.0.0.0:3000` collides even though the addresses look different. Compare the full address column, not just the port.",
        "**Separate network namespaces.** A port can be free on the host and taken inside a container, or the reverse. WSL2 and the Windows host are likewise two different stacks with port forwarding in between, so `netstat` on one side can look clean while the other is occupied.",
        "**A bind address that is not what you think.** Binding `localhost` may resolve to `::1` only. Grepping for `0.0.0.0:3000` will then show nothing while the conflict is real."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it from happening again"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Handle the signals, with a deadline",
          "x": "A server that closes cleanly on SIGINT and SIGTERM will not leave a port behind. The deadline matters as much as the handler: `server.close()` waits for existing connections to finish, and a keep-alive connection from a browser tab can keep it waiting indefinitely. Node 18.2 added `closeAllConnections()` for exactly this.",
          "code": "const server = app.listen(3000)\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing`)\n  server.close(err => process.exit(err ? 1 : 0))\n  if (server.closeAllConnections) server.closeAllConnections()\n  // last resort, so a hung handler cannot hold the port forever\n  setTimeout(() => process.exit(1), 10000).unref()\n}\n\nfor (const sig of ['SIGINT', 'SIGTERM']) {\n  process.on(sig, () => shutdown(sig))\n}"
        },
        {
          "title": "Stop the group, not the leaf",
          "x": "If your app spawns children, make sure they die with it. Run the server as its own process group and signal the group, or use a supervisor that does this for you. In Docker, give the container an init (`docker run --init` or `tini`) so PID 1 reaps children and forwards signals properly.",
          "code": "# Signal every process in the group, children included\nkill -TERM -- -\"$PGID\"\n\n# In Docker, make PID 1 behave like a real init\ndocker run --init -p 3000:3000 myapp"
        },
        {
          "title": "Let tests pick their own port",
          "x": "Hardcoded ports in integration tests are a reliable source of flaky CI, because two jobs on one runner will eventually overlap. Bind port 0 and ask the OS what you got. The kernel hands you a free ephemeral port, and the race disappears.",
          "code": "import { once } from 'node:events'\n\nconst server = app.listen(0)\nawait once(server, 'listening')\nconst { port } = server.address()\nconst baseUrl = `http://127.0.0.1:${port}`"
        },
        {
          "title": "Make the failure legible",
          "x": "If a dev server must own a fixed port, catch the error and print the diagnosis instead of a stack trace. Thirty seconds of work saves the next person on the team the whole investigation above.",
          "code": "server.on('error', err => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is in use. Find the owner with:`)\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`)\n    process.exit(1)\n  }\n  throw err\n})"
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One command to keep",
      "x": "`lsof -nP -iTCP:3000 -sTCP:LISTEN` answers the question for every runtime on both macOS and Linux. Alias it with the port as an argument and you will stop guessing."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "A container that dies on start often dies on a bind failure you never see.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this problem: nothing listening where you expected.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Another error whose message points away from its real cause.",
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
          "a": "Look up the PID first with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, or `netstat -ano | findstr :3000` on Windows. Then `kill <pid>`, or `taskkill /PID <pid>`. Add `-9` or `/F` only if the process is still there a few seconds later. `fuser -k 3000/tcp` on Linux does the lookup and the kill in one step, at the cost of never showing you what you just killed."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends SIGINT to the foreground process group, and two things commonly swallow it. Either your app installed a shutdown handler that never completes, usually because an idle keep-alive connection keeps `server.close()` waiting, or the real listener is a child of a wrapper such as `npm run dev` or `nodemon` that exited without passing the signal down. Run `ps -eo pid,ppid,command | grep node` and look for a PPID of 1."
        },
        {
          "q": "Does TIME_WAIT cause EADDRINUSE?",
          "a": "Rarely, and not for most servers. TIME_WAIT applies to closed connections, not to the listening socket, and `SO_REUSEADDR` lets a new listener bind anyway. Node, Go and Werkzeug set that option for you. Hand-rolled socket code and Python's bare `socketserver.TCPServer` are the real exceptions. Shortening the kernel's TIME_WAIT timer is not the fix and causes problems of its own on busy hosts."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "Safe for the machine, risky for your application state. SIGKILL cannot be caught, so the process never flushes buffers, removes its pid or lock file, or stops its children. You can end up with a stale lock that blocks the next start, and with orphaned children still holding the port. Try SIGTERM, wait, then escalate."
        },
        {
          "q": "Nothing shows in lsof but I still get address already in use. What now?",
          "a": "Four things to check. Re-run with `sudo`, because you cannot see other users' sockets. Run `docker ps --format '{{.Names}} {{.Ports}}'`, because a published container port is held by the daemon. Consider namespaces: a WSL2 or container port looks free from the other side. And compare the full local address, since a listener on `:::3000` or `::1` will not match a grep for `0.0.0.0:3000`."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, if every one of them sets `SO_REUSEPORT` before binding and they run as the same user. Linux has supported this since 3.9, as do recent BSDs, and the kernel load-balances incoming connections across the listeners. Support at the language level varies and has been changing: recent Node versions expose a `reusePort` option on `server.listen`, so check the documentation for the exact version you run before depending on it, as of November 2026. Without that option, the second bind fails."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-05",
  "updated": "2026-11-05",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
