module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on a Port",
  "h1": "Port already in use: find the process, then decide what to do with it",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding a port with lsof, ss, netstat or PowerShell, kill it safely, and understand why a port stays busy after a crash.",
  "standfirst": "A bound port always belongs to a live process, almost always. Identify that process before you kill anything, and fix the shutdown path so it stops happening every morning.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Identify what is holding a port, terminate it without collateral damage, and stop it recurring after a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means another socket is already bound to that address and port. It is a live process in the overwhelming majority of cases, not a lingering kernel state.",
        "Find the owner first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "Send `SIGTERM` before `SIGKILL`. A `kill -9` on the wrong PID can take down a database mid-write.",
        "After a crash the usual culprit is an orphaned child process that outlived the parent you thought you killed, not TCP `TIME_WAIT`.",
        "The permanent fix is a shutdown handler that calls `server.close()` on `SIGINT` and `SIGTERM`, plus listening on port 0 in tests."
      ]
    },
    {
      "t": "p",
      "x": "The message differs by runtime but the operating system error underneath is the same one. Here is what the same condition looks like across the stack:"
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use` on Linux, errno 48 on macOS"
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
      "caption": "One `bind()` failure, six presentations. The diagnostic path is identical."
    },
    {
      "t": "h2",
      "x": "Find out what is holding the port"
    },
    {
      "t": "p",
      "x": "Do not skip this. The temptation is to reach straight for a one-line kill, and most of the time that works, and the rest of the time you spend an hour wondering why your local Postgres is gone. Look at the process first. It takes four seconds."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: what is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, if lsof is not installed\nss -lptn 'sport = :3000'\n\n# Older systems\nsudo netstat -tulpn | grep ':3000'\n\n# Just the listening PIDs, for scripting\nlsof -ti tcp:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Without it, `lsof -i :3000` also returns every established client connection to that port, so a browser tab with an open EventSource stream shows up alongside the server. Killing those PIDs will not free the port and may close something you wanted."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Empty output does not mean empty port",
      "x": "`lsof` and `ss` only show process details for processes you own unless you run them with `sudo`. If the port is clearly busy but the listing is blank, re-run with `sudo` before concluding the port is free. A service started by systemd or by another developer account is the classic case."
    },
    {
      "t": "p",
      "x": "On Windows the two-step is the same, one command to get the owning PID and one to see what that PID actually is:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id 12345\n\n# cmd.exe equivalent: last column of the output is the PID\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\""
    },
    {
      "t": "p",
      "x": "Under WSL2 the Linux distribution and Windows have separate network stacks, so `lsof` inside WSL will not see a Windows process and `Get-NetTCPConnection` will not see a Linux one. When a port looks busy from one side and free from the other, check both."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Read the process line before acting",
          "x": "Check the command name and the user. `node server.js` owned by you is safe to terminate. `postgres`, `docker-proxy`, `com.apple.ControlCenter` or anything owned by root deserves a second thought."
        },
        {
          "title": "Send SIGTERM",
          "x": "The default signal. A well-behaved server closes its listener, finishes in-flight requests and exits. Most Node and Python apps take under a second.",
          "code": "kill 48213"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught, so nothing gets flushed and no cleanup handler runs. Reserve it for a process that is genuinely wedged.",
          "code": "kill -9 48213"
        },
        {
          "title": "Verify the port is actually free",
          "x": "A process group can respawn a child, and a supervisor like systemd, pm2 or nodemon will happily restart what you just killed.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        }
      ]
    },
    {
      "t": "p",
      "x": "The one-liner everyone pastes into Slack does work, with two caveats worth knowing before you put it in a Makefile:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# GNU xargs: -r means \"do nothing if input is empty\"\nlsof -ti tcp:3000 -sTCP:LISTEN | xargs -r kill\n\n# BSD xargs (macOS) has no -r and will run `kill` with no arguments,\n# printing a usage error when the port is already free. Guard it:\npids=$(lsof -ti tcp:3000 -sTCP:LISTEN)\n[ -n \"$pids\" ] && kill $pids\n\n# Portable-ish alternative if fuser is available\nfuser -k 3000/tcp"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "`kill -9 $(lsof -ti:3000)` is the version to avoid",
      "x": "It combines three bad ideas: no `LISTEN` filter, so it targets client connections too; `-9` first, so nothing gets a chance to shut down cleanly; and no guard for empty input. If you alias anything, alias the guarded form above."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that feels like the machine is haunted. You pressed Ctrl+C. The prompt came back. The port is still taken. There are four ordinary explanations, and they cover nearly everything."
    },
    {
      "t": "h3",
      "x": "An orphaned child process outlived its parent"
    },
    {
      "t": "p",
      "x": "Ctrl+C sends `SIGINT` to the foreground process group, but a child that was detached, or spawned into its own process group, or started through a wrapper that does not forward signals, never receives it. Your shell reports the parent as finished. The child is still holding the listening socket, now reparented to init. This is the single most common cause with tooling that layers processes: a package script that runs `concurrently`, a dev server behind a watcher, a debugger wrapper. Check the parent PID in the `lsof` output and you will usually find a PPID of 1."
    },
    {
      "t": "h3",
      "x": "A supervisor is restarting it"
    },
    {
      "t": "p",
      "x": "`nodemon`, `pm2`, `systemd` with `Restart=always`, and Docker with `--restart unless-stopped` all exist to bring processes back. Kill the worker and the supervisor does its job. The PID changes each time you look, which is the tell. Stop the supervisor, not the child."
    },
    {
      "t": "h3",
      "x": "A container still has the port published"
    },
    {
      "t": "p",
      "x": "A stopped container releases its port; an exited-but-still-running one does not. On the host you will see `docker-proxy` or `dockerd` holding the socket rather than your application. `docker ps -a` and `docker port <container>` will tell you which one. If the container itself dies on startup and takes the port with it on every restart, that is a different failure and worth reading up on separately."
    },
    {
      "t": "h3",
      "x": "Something else owns that port by default"
    },
    {
      "t": "p",
      "x": "Port 5000 on macOS is the well-known example. AirPlay Receiver binds it as part of Control Center, which is why a Flask app that has run happily for years on port 5000 suddenly refuses to start after an OS upgrade. Port 7000 has the same problem. You can turn AirPlay Receiver off in System Settings under General then AirDrop & Handoff, or move your app to another port, which is usually less disruptive. Verify the current setting location against your own macOS version; Apple has moved it between releases."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "Search results will tell you to wait 60 seconds for the socket to clear `TIME_WAIT`. For a Node, Go or Java server this advice is almost always misdirection, and following it wastes a minute and then leaves you exactly where you started."
    },
    {
      "t": "p",
      "x": "Here is the actual mechanism. When a connection closes, the side that initiated the close keeps the socket in `TIME_WAIT` for twice the maximum segment lifetime, so that delayed packets from the old connection cannot be misread as belonging to a new one. Historically, a listening socket could not bind while sockets on that port sat in `TIME_WAIT`. The `SO_REUSEADDR` option removes that restriction, and libuv sets it on every TCP server Node creates, as do the Go and Java standard libraries. So a Node server restarts immediately after a crash, every time. If it does not, the port is held by a live process and no amount of waiting will help."
    },
    {
      "t": "p",
      "x": "The advice survives because it is not universally wrong. Python's `socketserver.TCPServer` leaves `allow_reuse_address` at 0 by default, and hand-rolled socket code frequently omits the option, so the delay is real in those cases. Setting it explicitly costs one line:"
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\nsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\nsock.bind((\"0.0.0.0\", 8000))\nsock.listen()"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "SO_REUSEADDR is not SO_REUSEPORT",
      "x": "On Linux, `SO_REUSEADDR` lets you bind over lingering `TIME_WAIT` sockets. It does not let two processes listen on the same port at once. That is `SO_REUSEPORT`, a different option with load-balancing semantics. Reaching for the second one to silence `EADDRINUSE` gives you two servers splitting traffic, which is a confusing bug rather than a fix."
    },
    {
      "t": "h2",
      "x": "Wildcard binds, loopback binds and one more misread"
    },
    {
      "t": "p",
      "x": "A server bound to `0.0.0.0:3000` occupies port 3000 on every interface, so a second server asking for `127.0.0.1:3000` fails. The reverse also fails. But `127.0.0.1:3000` and `192.168.1.10:3000` can coexist happily, because they are different addresses. When `lsof` shows a listener you did not expect to conflict, compare the address column, not just the port."
    },
    {
      "t": "p",
      "x": "IPv6 adds a wrinkle. Node's `:::3000` in the error message is the IPv6 wildcard, and on Linux a dual-stack bind to `::` covers IPv4 too unless `net.ipv6.bindv6only` is set. A process on `0.0.0.0:3000` and another asking for `:::3000` will therefore usually collide on Linux and may not on other systems."
    },
    {
      "t": "p",
      "x": "One last misread worth naming: binding to a port below 1024 without privileges gives you `EACCES`, not `EADDRINUSE`. If port 80 refuses your app, check which of the two errors you actually got. They have nothing to do with each other."
    },
    {
      "t": "h2",
      "x": "Stop it happening tomorrow"
    },
    {
      "t": "p",
      "x": "Killing a process is a workaround. If you do it every morning, the shutdown path is broken. Most Node applications never close their listener because nobody wired up the signals:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing listener`);\n  server.close(() => process.exit(0));\n  // Do not hang forever on a stuck keep-alive connection.\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\nprocess.on('SIGINT', () => shutdown('SIGINT'));\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));"
    },
    {
      "t": "p",
      "x": "`server.close()` stops accepting new connections and waits for existing ones to finish. The `unref()`d timeout is the escape hatch: an idle keep-alive connection will otherwise hold the server open past any patience you have. Node 18.2 and later also offer `server.closeAllConnections()` if you want to cut them immediately."
    },
    {
      "t": "p",
      "x": "For test suites, do not hard-code a port at all. Pass 0 and let the kernel assign a free one, then read it back:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on ${port}`);\n});"
    },
    {
      "t": "p",
      "x": "That one change eliminates an entire category of flaky CI failures where two test files race for the same port. Docker Compose users get the same effect by publishing as `\"3000\"` instead of `\"3000:3000\"`, at the cost of having to look up the mapping."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the container dies on startup and the published port goes with it.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this problem: nothing is listening where you expected.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "The other error that greets you before the server ever binds.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is running on port 3000?",
          "a": "On macOS or Linux: `lsof -ti tcp:3000 -sTCP:LISTEN` to get the PID, then `kill <pid>`, escalating to `kill -9 <pid>` only if it ignores the first signal. On Windows: `netstat -ano | findstr :3000` for the PID, then `taskkill /PID <pid> /F`. Look at what the process is before you kill it. The command name in the `lsof` output takes a second to read and occasionally saves you from terminating a database."
        },
        {
          "q": "Why does the port stay in use after I press Ctrl+C?",
          "a": "Usually because a child process survived. Ctrl+C signals the foreground process group, and anything detached or spawned into its own group never hears it. Your shell prompt returns while the actual listener keeps running, reparented to init. Check the PPID in `lsof` output: if it is 1, you have found an orphan. Supervisors like nodemon and pm2 produce the same symptom by restarting the process you just killed."
        },
        {
          "q": "Do I need to wait for TIME_WAIT to clear?",
          "a": "For a Node, Go or Java server, no. Those runtimes set `SO_REUSEADDR` on listening sockets by default, which is exactly the option that allows binding over lingering `TIME_WAIT` entries. If the port is still refused, a live process holds it. The advice does apply to hand-written Python socket code and to `socketserver.TCPServer`, which leaves `allow_reuse_address` at 0."
        },
        {
          "q": "Why is port 5000 in use on my Mac when nothing is running?",
          "a": "AirPlay Receiver binds it as part of Control Center, which caught out a lot of Flask developers when it first shipped. Port 7000 is affected too. Either disable AirPlay Receiver in System Settings, under General then AirDrop & Handoff, or move your app to a different port. The exact settings path has shifted between macOS releases, so confirm it on the version you are running."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "It is safe for a stateless dev server and risky for anything that writes to disk. `SIGKILL` cannot be caught, so no flush, no cleanup handler, no graceful close. Databases, message brokers and anything mid-transaction can be left needing recovery on next start. Send plain `kill` first and give it a few seconds. Escalate when the process is genuinely unresponsive, not as an opening move."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Only if both set `SO_REUSEPORT`, which is a deliberate load-balancing feature where the kernel distributes incoming connections between them. It is not a fix for `EADDRINUSE`, and enabling it to silence the error gives you two servers each handling a random half of your requests. They can also bind the same port on different addresses, for example one on `127.0.0.1:3000` and one on `192.168.1.10:3000`, since those are distinct endpoints."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-24",
  "updated": "2026-09-24",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
