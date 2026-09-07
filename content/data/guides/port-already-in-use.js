module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on Your Port",
  "h1": "Port already in use: finding the process, and why it survives a crash",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means a process already holds the socket. How to find its PID on macOS, Linux and Windows, kill it safely, and stop it recurring.",
  "standfirst": "The commands that identify which process owns a port on each platform, plus the real reason a port stays bound after your server crashes.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the PID holding a port, kill it safely, and fix the crash pattern that keeps re-creating the problem.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means another live process already holds that socket. It is almost never a race condition or a bug in your runtime.",
        "Find the owner: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` first. `kill -9` skips your cleanup handlers and is frequently what created the orphan you are now hunting.",
        "After a crash the usual culprit is a child process that inherited the listening file descriptor, not TCP `TIME_WAIT`.",
        "`127.0.0.1:3000` and `0.0.0.0:3000` collide. The `:::3000` in the Node message is the IPv6 wildcard address, which on a dual-stack host also covers IPv4."
      ]
    },
    {
      "t": "lede",
      "x": "A port is busy because something is holding it open, and that something usually turns out to be your own server from thirty seconds ago. The fix is three moves: identify the process ID, confirm it is what you assume it is, then terminate it. The interesting part is the fourth move, which is working out why it outlived the terminal you started it in."
    },
    {
      "t": "h2",
      "x": "Read the error before you kill anything"
    },
    {
      "t": "p",
      "x": "Different runtimes phrase this differently, and the phrasing tells you which address family and which interface is contested. These are the strings as they actually appear:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n\nOSError: [Errno 98] Address already in use\n\njava.net.BindException: Address already in use\n\nError response from daemon: driver failed programming external connectivity\non endpoint web: Bind for 0.0.0.0:8080 failed: port is already allocated\n\nnginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)"
    },
    {
      "t": "p",
      "x": "The address matters. `:::3000` is the IPv6 unspecified address, which is what Node binds by default. On a dual-stack Linux or macOS host that binding also accepts IPv4 traffic, so a second process asking for `0.0.0.0:3000` will collide with it even though the two addresses look unrelated. The reverse trips people up more often: a container or a dev server bound to `127.0.0.1:3000` conflicts with a wildcard bind, but two processes bound to two different specific interfaces do not conflict at all. If you are debugging a case where the port looks free and the bind still fails, check which address each side asked for."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EADDRINUSE is not EACCES",
      "x": "`Error: listen EACCES: permission denied 0.0.0.0:80` is a different problem. Nothing is holding port 80. You are an unprivileged user trying to bind a port below 1024. Use a high port in development and a reverse proxy in production, or grant the capability explicitly with `setcap` on Linux."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "Do not skip straight to a kill-by-port one-liner. Look first. The PID you find is the difference between stopping a stale dev server and stopping the database your colleague is using."
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Command",
        "Notes"
      ],
      "rows": [
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`-n` skips DNS, `-P` skips port-name lookup, so it returns fast. Add `sudo` to see processes owned by other users."
        ],
        [
          "Linux",
          "`ss -lptn 'sport = :3000'`",
          "`ss` is present on any modern distro. Needs root to show the process column for processes you do not own."
        ],
        [
          "Linux (alt)",
          "`fuser 3000/tcp`",
          "Prints the PID only. `fuser -k 3000/tcp` kills it, which is convenient and slightly too easy."
        ],
        [
          "Windows cmd",
          "`netstat -ano | findstr :3000`",
          "Last column is the PID. Match it with `tasklist /FI \"PID eq 1234\"`."
        ],
        [
          "PowerShell",
          "`Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess`",
          "Errors if nothing is listening, which is itself a useful answer."
        ],
        [
          "Docker",
          "`docker ps --filter publish=3000`",
          "Finds a published container port that `lsof` may attribute to a proxy process instead."
        ]
      ],
      "caption": "Commands to identify the process holding a TCP port."
    },
    {
      "t": "p",
      "x": "On macOS, `lsof` output includes a `COMMAND` column that is truncated to nine characters by default. Widen it with `-c 0` if you cannot tell `node` from `nodemon` from something else entirely. If the command name is `com.docke` you are looking at Docker Desktop's proxy, and the process you actually want lives inside a container."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the process is yours",
          "x": "Print the full command line before you do anything destructive. A PID on its own tells you nothing.",
          "code": "ps -p 4821 -o pid,ppid,user,etime,command"
        },
        {
          "title": "Send SIGTERM",
          "x": "This is the signal your shutdown handler is listening for. Give it a second or two to finish in-flight requests and close its socket cleanly.",
          "code": "kill 4821"
        },
        {
          "title": "Check whether it actually went",
          "x": "If the port is now free, stop here. A process that ignores SIGTERM is telling you its shutdown handler is broken or blocked, which is worth knowing.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it hangs",
          "x": "SIGKILL cannot be caught, so no cleanup runs: no flushed logs, no removed lockfiles, no closed database connections. Treat it as a last resort rather than a default.",
          "code": "kill -9 4821"
        },
        {
          "title": "Check the parent if it comes straight back",
          "x": "A port that is reoccupied within a second means a supervisor is restarting the process. Look at the PPID from step one and stop the supervisor instead.",
          "code": "ps -p $(ps -p 4821 -o ppid=) -o pid,command"
        }
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "About `npx kill-port` and `fuser -k`",
      "x": "Both work. Both also kill whatever they find without showing you what it was, which is fine on your laptop and genuinely dangerous on a shared or production host, where the thing on port 5432 is the database. Look first, then kill."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part most answers get wrong, and the wrong answer sends you off waiting for a timeout that is not happening."
    },
    {
      "t": "h3",
      "x": "The usual cause: an inherited file descriptor"
    },
    {
      "t": "p",
      "x": "When a process forks or spawns a child, the child inherits open file descriptors, including the listening socket. Kill the parent and the socket stays open, because the child still references it. The kernel releases a port when the last descriptor referring to it closes, not when a particular process dies. So your server is gone from `ps`, your terminal is back at a prompt, and a stray webpack worker or a spawned shell is quietly keeping port 3000 bound. That is why `lsof` often shows a process you did not knowingly start."
    },
    {
      "t": "p",
      "x": "Node's `child_process.spawn` sets `stdio` to pipes by default, but it does not close arbitrary inherited descriptors. Passing `detached: true` makes it worse, because the child survives the parent deliberately. If your dev tooling spawns compilers, test runners or browser processes, that is where to look first."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is mostly a red herring here"
    },
    {
      "t": "p",
      "x": "The advice to \"just wait sixty seconds for TIME_WAIT to expire\" is repeated everywhere and is usually wrong for the case you are in. TIME_WAIT applies to a connection tuple after it closes, not to the listening socket, and the classic listener-side conflict is avoided by the `SO_REUSEADDR` socket option. Node, Go and most modern servers set `SO_REUSEADDR` for you on Linux and macOS. If waiting a minute genuinely fixes it every time, that is a signal something is being restarted on a timer, not that the kernel was holding the port."
    },
    {
      "t": "p",
      "x": "You can see the distinction directly. A socket in `LISTEN` state means a live process owns the port. A pile of entries in `TIME_WAIT` with no `LISTEN` line means the port is available and something else is wrong with your bind."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: every socket on the port, with state\nss -atnp 'sport = :3000 or dport = :3000'\n\n# macOS: same idea\nlsof -nP -iTCP:3000\n\n# Count states to see at a glance what you are dealing with\nss -atn 'sport = :3000' | awk 'NR>1 {print $1}' | sort | uniq -c"
    },
    {
      "t": "h3",
      "x": "Watchers, debuggers and terminal multiplexers"
    },
    {
      "t": "p",
      "x": "Closing a terminal tab does not reliably kill what was running in it. Under `tmux` or `screen`, the session outlives the window by design. Under nodemon or a framework's watch mode, a crash inside the watched process can leave the supervisor alive and mid-restart. And the Node inspector holds its own port: if you see `EADDRINUSE` on 9229 rather than your app port, an orphaned debug session is the cause, and `--inspect=0` will let the runtime pick a free one."
    },
    {
      "t": "h2",
      "x": "Ports that were never yours to begin with"
    },
    {
      "t": "p",
      "x": "Sometimes nothing crashed and the port was simply already spoken for by the operating system."
    },
    {
      "t": "ul",
      "items": [
        "**macOS ports 5000 and 7000.** AirPlay Receiver binds both on macOS Monterey and later. `lsof` attributes them to `ControlCenter`. Turn the feature off in System Settings under General, then AirDrop and Handoff, or move your app to another port. Verify the exact menu location for your OS version, since Apple moves these panes between releases.",
        "**Windows dynamic port exclusions.** Hyper-V, WSL2 and Docker Desktop reserve blocks of high ports at boot, and a reserved range produces `EADDRINUSE` with no visible listener. List them with `netsh interface ipv4 show excludedportrange protocol=tcp` in an elevated prompt.",
        "**Ports below 1024 on Unix.** Binding these requires privileges. On Linux, `sudo setcap 'cap_net_bind_service=+ep' $(which node)` grants the capability to the binary, which is preferable to running your whole server as root.",
        "**Docker's published ports.** `port is already allocated` comes from the daemon, not your app. `docker ps -a` will often show a stopped-but-not-removed container still holding the mapping. See our notes on [containers that exit immediately](/guides/docker-container-exits-immediately/) for the related failure mode."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it happening: shut down on purpose"
    },
    {
      "t": "p",
      "x": "Most repeat offenders come from servers that have no shutdown path at all. Add one. It costs a dozen lines and it removes the whole category of problem."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(process.env.PORT ?? 3000)\n\nlet shuttingDown = false\n\nfunction shutdown (signal) {\n  if (shuttingDown) return\n  shuttingDown = true\n  console.log(`${signal} received, draining connections`)\n\n  server.close(err => {\n    if (err) {\n      console.error('close failed', err)\n      process.exit(1)\n    }\n    process.exit(0)\n  })\n\n  // Keep-alive sockets will hold server.close() open indefinitely.\n  // Node 18.2 and later can cut them loose; check your runtime version.\n  if (typeof server.closeIdleConnections === 'function') {\n    server.closeIdleConnections()\n    setTimeout(() => server.closeAllConnections(), 5000).unref()\n  }\n\n  // Never let shutdown hang forever.\n  setTimeout(() => process.exit(1), 10000).unref()\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'))\nprocess.on('SIGINT', () => shutdown('SIGINT'))"
    },
    {
      "t": "p",
      "x": "Two details do the real work here. The `unref()` on the timers means they do not themselves keep the event loop alive, so a clean shutdown still exits promptly. The guard against re-entry matters because pressing Ctrl+C twice is exactly what people do when the first press appears to do nothing, and a second `shutdown()` call while the first is draining produces confusing errors."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "server.close() does not close active connections",
      "x": "It stops accepting new ones and waits for existing sockets to finish. With HTTP keep-alive enabled, a browser tab holding an idle connection can keep your process alive well past when you expected it to exit, and you will assume it hung. That is the reason for the explicit connection-closing calls above."
    },
    {
      "t": "h2",
      "x": "Make tests immune with port 0"
    },
    {
      "t": "p",
      "x": "Test suites that hard-code a port fail as soon as two of them run at once, or as soon as one leaks a server between files. Bind port 0 instead and let the kernel hand you a free ephemeral port, then read the real number back off the server."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0)\nawait new Promise(resolve => server.once('listening', resolve))\n\nconst { port } = server.address()\nconst baseUrl = `http://127.0.0.1:${port}`\n\n// ... run tests against baseUrl ...\n\nawait new Promise(resolve => server.close(resolve))"
    },
    {
      "t": "p",
      "x": "The trade-off is that you can no longer hit a fixed URL by hand while the suite runs, and any fixture or snapshot containing an absolute URL has to be normalized. That is a small price against flaky parallel runs. Binding `127.0.0.1` rather than the wildcard is also worth doing in tests, since it keeps the temporary server off your network."
    },
    {
      "t": "h2",
      "x": "A short checklist"
    },
    {
      "t": "ol",
      "items": [
        "Read the address in the error. Wildcard, loopback or a specific interface?",
        "Find the PID with `lsof`, `ss` or `netstat`. Do not kill by port blindly.",
        "Print the full command line and the parent PID before terminating anything.",
        "`SIGTERM`, wait, then `SIGKILL` only if it refuses.",
        "If the port frees and is immediately retaken, stop the supervisor, not the child.",
        "If nothing owns the port, suspect OS reservations, privileges or a stopped container."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, then `kill <pid>`. On Windows: `netstat -ano | findstr :3000`, then `taskkill /PID <pid> /F`. One-liners like `npx kill-port 3000` and `fuser -k 3000/tcp` work too, but they terminate whatever they find without telling you what it was, which is a bad habit to build on any machine that is not your own."
        },
        {
          "q": "Why does the port stay in use after I stop the server?",
          "a": "Almost always because a child process inherited the listening socket. The kernel keeps the port bound until the last file descriptor referencing it is closed, so killing the parent is not enough. Run `lsof` again and look at the process name and its parent: you will usually find a build worker, a test runner or a spawned shell holding it open."
        },
        {
          "q": "Should I just wait for TIME_WAIT to expire?",
          "a": "Usually not. TIME_WAIT applies to closed connection tuples, not to the listening socket, and servers that set `SO_REUSEADDR` (which includes Node and Go by default on Linux and macOS) can rebind regardless. If the port shows a socket in `LISTEN` state, a live process owns it and waiting will not help."
        },
        {
          "q": "What does the `:::3000` in the Node error mean?",
          "a": "It is the IPv6 unspecified address, the equivalent of `0.0.0.0` for IPv6. Node binds it by default, and on a dual-stack host that binding also serves IPv4. It is why a process you think is on IPv4 can conflict with one you think is on IPv6."
        },
        {
          "q": "Why do I get permission denied instead of address in use on port 80?",
          "a": "That is `EACCES`, a different error. Ports below 1024 are privileged on Unix systems. Either run behind a reverse proxy, use a high port in development, or grant the specific capability with `sudo setcap 'cap_net_bind_service=+ep' $(which node)` rather than running the whole process as root."
        },
        {
          "q": "Is `kill -9` safe to use by default?",
          "a": "No. SIGKILL cannot be caught, so nothing in your shutdown path runs: buffered logs are lost, lockfiles and PID files stay behind, and database connections are dropped rather than closed. It is also a common way to create the orphaned children that cause this problem in the first place. Send SIGTERM, wait a couple of seconds, and escalate only if the process ignores it."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker Container Exits Immediately",
          "desc": "Exit codes, stopped containers holding port mappings, and how to debug a container that will not stay up.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL Connection Refused",
          "desc": "The opposite symptom: nothing is listening where you expected. Check each layer in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How Node resolves modules, and why ESM and CommonJS disagree about what exists.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-07",
  "updated": "2026-09-07",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
