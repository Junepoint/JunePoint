module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Busy Port",
  "h1": "Port already in use: find the owner, then free it",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a listening port on macOS, Linux and Windows, kill it safely, and fix the orphaned children that cause it after a crash.",
  "standfirst": "Two commands find the process holding your port. The rest of this page covers the cases where those commands come back empty, and why a port stays busy after the process that owned it is gone.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Find what is holding a listening port, kill it without collateral damage, and stop it recurring after crashes.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The error means some socket already holds that *address and port* pair. Find the owner before you signal anything.",
        "macOS and Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Windows: `Get-NetTCPConnection -LocalPort 3000 -State Listen`.",
        "After a crash, the usual owner is an orphaned child process that outlived the shell you pressed Ctrl-C in.",
        "`kill -9` frees the port and skips all cleanup. Send `SIGTERM` first and give it a second.",
        "If nothing owns the port, suspect a published container port, a reserved port range, or macOS AirPlay Receiver on 5000 and 7000."
      ]
    },
    {
      "t": "h2",
      "x": "Free the port in one command"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, if lsof is not installed\nss -lptn 'sport = :3000'\n\n# Ask the process to stop, then insist if it ignores you\nkill 48213\nkill -9 48213\n\n# Linux shortcut: match and signal in one step\nfuser -k -TERM 3000/tcp"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows PowerShell: find the owning PID\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Turn that PID into a name you recognise\nGet-Process -Id 18240 | Select-Object Id, ProcessName, Path\n\n# Then stop it\nStop-Process -Id 18240 -Force\n\n# cmd.exe equivalent\n# netstat -ano | findstr :3000\n# taskkill /PID 18240 /F"
    },
    {
      "t": "p",
      "x": "That is the whole fix in the common case. Make the two-step a habit: resolve the PID to a program name, then signal it. The lookup costs three seconds and it is the difference between restarting your own dev server and killing the database that half your other containers are talking to."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Read the process name before you kill the PID",
      "x": "`lsof` will hand you the PID of `postgres`, `dockerd` or your editor's language server just as cheerfully as your own server. A `SIGKILL` to the PostgreSQL postmaster takes the whole cluster down and forces crash recovery on the next start. A `SIGKILL` to a process supervisor often leaves its children running, still holding the port you were trying to free, which is the loop people end up stuck in."
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "p",
      "x": "`EADDRINUSE` comes from the kernel, not from your framework. Your program called `bind()` on an address and port, and the kernel refused because an existing socket conflicts with it. Every runtime wraps that same failure in its own wording."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n#   code: 'EADDRINUSE', syscall: 'listen', address: '::', port: 3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use"
    },
    {
      "t": "p",
      "x": "The bracketed number in the Python message is the platform's `errno` value, so it is 98 on Linux and 48 on macOS. Node exposes the same values as a negative `errno` property on the error object. None of that changes the diagnosis. What does matter is the address the message prints, and that is the part everyone skims past."
    },
    {
      "t": "h2",
      "x": "The conflict is on an address, not a bare port"
    },
    {
      "t": "p",
      "x": "A listening socket is bound to an interface plus a port. `:::3000` in the Node message is the IPv6 wildcard, which on Linux also covers IPv4 through the dual-stack mapping. `0.0.0.0:3000` is the IPv4 wildcard. `127.0.0.1:3000` is loopback only."
    },
    {
      "t": "p",
      "x": "A wildcard bind conflicts with everything else on that port. A loopback bind conflicts only with loopback and with wildcards. So two servers can collide even when they look like they are on different hosts, and, less obviously, a server bound to `127.0.0.1:3000` can coexist with one bound to a specific LAN address on the same port. If you are debugging a conflict you did not expect, read the local address column carefully."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Every listener, with its bound address, on Linux\nss -ltnp\n\n# macOS: same question\nlsof -nP -iTCP -sTCP:LISTEN\n\n# Does anything hold 3000 on any interface?\nlsof -nP -iTCP:3000\n\n# Note: without -sTCP:LISTEN you also see client connections\n# *to* port 3000, which are not what blocks your bind."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "You may need sudo to see the owner",
      "x": "`lsof` and `ss -p` only report process details for sockets your user is allowed to see. A port held by another user, or by a root service, shows up with a blank command or PID until you re-run with `sudo`. An empty result from an unprivileged shell is not proof that the port is free."
    },
    {
      "t": "h2",
      "x": "Why it happens after a crash"
    },
    {
      "t": "p",
      "x": "This is the question behind most searches for the error. Your server crashed, or you killed it, and the port is still taken. There are four realistic explanations, and only one of them involves the kernel holding anything."
    },
    {
      "t": "h3",
      "x": "An orphaned child outlived its parent"
    },
    {
      "t": "p",
      "x": "This is the answer most of the time. `npm run dev` is a chain: your shell starts npm, npm starts a shell, that shell starts `vite` or `nodemon`, and that starts the actual server. Ctrl-C sends `SIGINT` to the foreground process group, which usually works. A crash does not. When the middle of the chain dies abruptly, or a tool spawned something with `detached: true`, the grandchild keeps running with the socket open and gets reparented to init. Your terminal looks idle. The port is not."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Look at the family tree, not just the port\nps -eo pid,ppid,pgid,stat,command | grep -E 'node|vite|nodemon' | grep -v grep\n\n# A PPID of 1 means the parent is gone and this one was reparented.\n# Signal the whole process group rather than one PID (note the dash)\nkill -TERM -24199"
    },
    {
      "t": "h3",
      "x": "A shutdown handler that never finishes"
    },
    {
      "t": "p",
      "x": "The opposite failure. The process is still alive on purpose, stuck in its own teardown. A `SIGTERM` handler calls `server.close()`, which stops accepting new connections but waits for existing ones to end. One idle keep-alive connection from a browser tab, or a hung event stream, is enough to hold it open indefinitely. The process appears in `ps`, responds to nothing, and keeps the port. In Node, `server.close()` on its own has never been enough for this reason; you have to drop the idle sockets too."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT, which is real but rarer than claimed"
    },
    {
      "t": "p",
      "x": "A *listening* socket does not enter `TIME_WAIT`. Connections do. When a server exits, each connection it had accepted sits in `TIME_WAIT` for roughly a minute on Linux, holding that local port in the kernel's table. A fresh `bind()` to the same port then fails unless the new socket sets `SO_REUSEADDR`, which tells the kernel those lingering entries are not a conflict."
    },
    {
      "t": "p",
      "x": "Node sets `SO_REUSEADDR` on server sockets for you, so this is seldom the Node answer. It does bite hand-rolled C, and it bites Python code that subclasses `socketserver.TCPServer` directly, because the base class leaves `allow_reuse_address` off while `http.server.HTTPServer` turns it on. The tell is timing. If the port frees itself after about a minute and you never killed anything, you were watching `TIME_WAIT` drain."
    },
    {
      "t": "h3",
      "x": "Something else grabbed the port while you were restarting"
    },
    {
      "t": "p",
      "x": "Two instances of a watcher racing each other, a test runner that starts a fixture server on a fixed port, or a second terminal tab where you started the same thing twenty minutes ago and forgot. Check for duplicates by command name as well as by port, because the loser of a startup race will not show up in `lsof` output for that port at all."
    },
    {
      "t": "h2",
      "x": "When nothing owns the port"
    },
    {
      "t": "p",
      "x": "Sometimes `lsof` comes back empty even under `sudo` and the bind still fails. At that point the port is unavailable for a reason that has nothing to do with a process you can see."
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "Likely cause",
        "How to check"
      ],
      "rows": [
        [
          "Owner is `docker-proxy`, `dockerd` or a Docker helper",
          "A container is publishing that port, possibly from a stack you stopped but never removed",
          "`docker ps -a --format '{{.Names}} {{.Ports}}'`"
        ],
        [
          "Empty listener list on Windows, bind still refused",
          "The port falls inside an excluded range claimed by Hyper-V, WSL or WinNAT",
          "`netsh int ipv4 show excludedportrange protocol=tcp`"
        ],
        [
          "Ports 5000 and 7000 busy on macOS with nothing running",
          "AirPlay Receiver, part of Control Center, listens there on recent macOS versions",
          "System Settings, then General, then AirDrop & Handoff"
        ],
        [
          "Free inside WSL, busy on the Windows host, or the reverse",
          "Two network stacks, with localhost forwarding between them",
          "`ss -ltnp` in the distro, `netstat -ano | findstr :3000` on the host"
        ],
        [
          "Port is free again a minute later, with no action taken",
          "Accepted connections draining through `TIME_WAIT`",
          "`ss -tan state time-wait`"
        ],
        [
          "Fails only on ports below 1024, as a normal user",
          "Privileged port, not a conflict. Usually `EACCES` rather than `EADDRINUSE`",
          "Use a high port, or grant `CAP_NET_BIND_SERVICE`"
        ]
      ],
      "caption": "Cases where the port is held by something other than a process you started. Platform details here change between OS releases, so confirm against your own version."
    },
    {
      "t": "p",
      "x": "The macOS AirPlay case is worth knowing because the default port for Flask and for a lot of tutorial code is 5000. Turn AirPlay Receiver off, or better, stop using 5000. Changing your dev port is cheaper than fighting a system service you do not control."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Shut down on purpose, with a deadline",
          "x": "Handle the signals, stop accepting, drop idle keep-alive sockets, and set a hard timeout so one stuck connection cannot hold the port forever. `closeIdleConnections()` and `closeAllConnections()` are available from Node 18.2 onward; check your runtime before relying on them.",
          "code": "const server = app.listen(3000);\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.closeIdleConnections();\n  server.close(() => process.exit(0));\n\n  // Last resort: never hang forever on a stuck connection.\n  setTimeout(() => {\n    server.closeAllConnections();\n    process.exit(1);\n  }, 5000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
        },
        {
          "title": "Fail with a useful message instead of a stack trace",
          "x": "One line telling you which port is taken, and which command to run next, saves looking this page up again.",
          "code": "server.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${err.port} is already in use. Find the owner with: ` +\n      `lsof -nP -iTCP:${err.port} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});"
        },
        {
          "title": "Never hard-code a port in tests",
          "x": "Bind to port 0 and the kernel hands you a free ephemeral port. That removes the whole class of failure from your suite, and lets suites run in parallel.",
          "code": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  baseUrl = `http://127.0.0.1:${port}`;\n});"
        },
        {
          "title": "Kill the group, not the leaf",
          "x": "When you do clear things by hand, signal the process group so wrappers and their children go together. `pgrep -ag` confirms what you are about to hit.",
          "code": "# What is in the group?\npgrep -ag 24199\n\n# Signal the group (leading dash), SIGTERM first\nkill -TERM -24199\n\n# Or match on the command line\npkill -f 'node .*dev-server'"
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A one-liner for the impatient",
      "x": "`npx kill-port 3000` works and is convenient. It is also a package download that force-kills whatever it finds, so keep it in development and out of any deploy script. On a server you want the service manager to stop the service, not a port sweeper."
    },
    {
      "t": "h2",
      "x": "Advice you will see that does not help"
    },
    {
      "t": "p",
      "x": "Lowering the `TIME_WAIT` timeout gets recommended constantly. It is almost never the right response to a development conflict, and `net.ipv4.tcp_tw_recycle`, the knob most often quoted, was removed in Linux 4.12 because it breaks connections from clients behind NAT. If `TIME_WAIT` really is blocking your bind, set `SO_REUSEADDR` on the socket instead of retuning the kernel."
    },
    {
      "t": "p",
      "x": "The other piece of folklore is that `SO_REUSEADDR` lets two servers share a port. On Linux and the BSDs it does not: it permits binding over `TIME_WAIT` remnants, not over a live listener. Sharing a port between processes needs `SO_REUSEPORT`, a deliberate choice with its own load-balancing behaviour. Windows is the odd one out, where `SO_REUSEADDR` historically did let one process hijack another's listening socket, which is why Windows services set `SO_EXCLUSIVEADDRUSE`."
    },
    {
      "t": "p",
      "x": "Then there is rebooting. It works. It also throws away the evidence, and if an orphaned watcher is the cause, your next crash puts you right back here. Spend thirty seconds on `ps` first."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, run `lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, then `kill <pid>`, then `kill -9 <pid>` only if it ignores the first signal. On Windows, use `Get-NetTCPConnection -LocalPort 3000 -State Listen` for the `OwningProcess`, then `Stop-Process -Id <pid> -Force`. Resolve the PID to a process name before you signal it."
        },
        {
          "q": "Why is the port still in use after the process died?",
          "a": "Usually because it did not die. A child or grandchild of the process you killed still holds the socket; look for one whose parent PID is 1. The other possibility is that connections the server had accepted are draining through `TIME_WAIT`, which clears on its own in about a minute on Linux."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "It is safe for the kernel and unkind to the program. `SIGKILL` cannot be caught, so the process gets no chance to flush buffers, remove lock files or stop its children. For a dev server that is fine. For a database, a message broker or anything holding a lock file, send `SIGTERM` and wait a few seconds."
        },
        {
          "q": "What does EADDRINUSE mean in Node?",
          "a": "The `bind()` call failed because another socket already holds that address and port. The message gives you both, as in `address already in use :::3000`, where `:::3000` is the IPv6 wildcard. Node sets `SO_REUSEADDR` by default, so in Node this nearly always means a live listener rather than a `TIME_WAIT` artefact."
        },
        {
          "q": "Why is port 5000 already in use on my Mac?",
          "a": "On recent macOS versions AirPlay Receiver listens on 5000 and 7000 as part of Control Center, so Flask and other tools that default to 5000 fail to start. Turn AirPlay Receiver off in System Settings under General, then AirDrop & Handoff, or move your app to another port. Settings paths move between releases, so check yours."
        },
        {
          "q": "How do I stop getting this error every time my dev server crashes?",
          "a": "Add `SIGINT` and `SIGTERM` handlers that close the server, drop idle connections and exit on a timeout, so a crash or a Ctrl-C leaves nothing behind. In tests, listen on port 0 and read the assigned port from `server.address()`. Both changes are a few lines, and they remove the problem instead of working around it."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "A port that is still held often belongs to a container you thought had stopped.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this problem: nothing is listening where you expect it.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "The other error that greets you seconds after starting a dev server.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-27",
  "updated": "2026-11-27",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
