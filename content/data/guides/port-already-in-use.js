module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on a Port",
  "h1": "Port already in use: finding the process that holds it",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a TCP port with ss, lsof or Get-NetTCPConnection, stop it safely, and fix the crash pattern that keeps leaving it bound.",
  "standfirst": "EADDRINUSE is a failed bind(), not a timing fluke. Find the process that owns the socket, stop it in the right order, then remove the reason it survived your last crash.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Locate the process holding a port on Linux, macOS or Windows, stop it safely, and stop it coming back.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means `bind()` was refused because something already holds that address and port. Retrying will not help.",
        "`ss -ltnp | grep :3000` on Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `Get-NetTCPConnection -LocalPort 3000` in PowerShell. All three give you a PID.",
        "Send `SIGTERM` first. `kill -9` skips cleanup and can leave child processes still holding the socket.",
        "After a crash, the usual culprit is a child process that inherited the listening file descriptor. Your shell prompt came back; the socket never closed.",
        "If nothing is listening and `bind()` still fails, suspect a reserved port range on Windows or WSL, a published container port, or a system service such as AirPlay Receiver on macOS ports 5000 and 7000."
      ]
    },
    {
      "t": "lede",
      "x": "The fastest version: get the PID, send it `SIGTERM`, confirm the port is free. The rest of this page is about the cases where that does not work, and about the reason a dead process keeps a port for minutes after you thought you killed it."
    },
    {
      "t": "h2",
      "x": "What the error actually reports"
    },
    {
      "t": "p",
      "x": "A server calls `bind()` to claim a local address and port, then `listen()` to accept connections on it. Only one socket can hold a given protocol, address and port combination for listening. When a second process tries, the kernel refuses with `EADDRINUSE`, and every runtime surfaces that same errno with its own wording:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node.js\nError: listen EADDRINUSE: address already in use :::3000\n\n# Node.js, bound to a specific interface\nError: listen EADDRINUSE: address already in use 127.0.0.1:3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker\nError response from daemon: driver failed programming external connectivity\non endpoint web: Bind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Errno 98 is Linux. On macOS and other BSD-derived systems the same condition is errno 48, so a search for \"Errno 48\" and a search for \"Errno 98\" lead to the same problem. The `:::3000` form in the Node message is an IPv6 wildcard address, written as `::` followed by the port separator. It is not a typo and it is not three colons of syntax. It means the listener claimed every interface rather than one specific address."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EADDRINUSE is not EACCES",
      "x": "`Error: listen EACCES: permission denied 0.0.0.0:80` is a different failure. Ports below 1024 are privileged on Unix systems, so an unprivileged process cannot bind them at all, whether or not anything else is listening. Nothing you kill will fix that one."
    },
    {
      "t": "h2",
      "x": "Find the process that holds the port"
    },
    {
      "t": "p",
      "x": "Query by port, never by the command you remember typing. The process holding the socket is frequently not the one you launched."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: fastest option, shows PID and program name\nss -ltnp | grep :3000\nsudo ss -ltnp 'sport = :3000'\n\n# macOS and Linux: listeners only, no DNS or service-name lookups\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Just the PID, suitable for scripting\nlsof -t -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux fallback when ss and lsof are unavailable\nsudo fuser -v 3000/tcp"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters. Without it, `lsof -i :3000` also lists processes that merely have a *connection* involving port 3000, which on a busy machine can include your browser, a proxy or a leftover client. Killing one of those does nothing for the bind. Without `sudo` you will see only your own processes, so a blank result from an unprivileged shell is not proof that the port is free."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: the owning process for a listening port\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Resolve that PID to a process name\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe equivalent: the last column of netstat -ano is the PID\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 1234\""
    },
    {
      "t": "p",
      "x": "Read the process name before you act on it. A PID belonging to `node` or `python` is almost certainly yours to stop. A PID belonging to `com.docker.backend`, `docker-proxy`, `nginx`, `ControlCenter` or `svchost.exe` is telling you something different, and the right fix is to stop the container, the service or the feature rather than the process."
    },
    {
      "t": "h2",
      "x": "Stop it in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "kill 1234            # SIGTERM: the process can close its listener and flush state\nkill -0 1234         # exits 0 while 1234 still exists, prints \"No such process\" once gone\nkill -9 1234         # SIGKILL: last resort, no cleanup, no exit handlers\n\n# Windows\ntaskkill /PID 1234\ntaskkill /PID 1234 /F\n\n# One-liner, but see the warning below\nkill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)"
    },
    {
      "t": "p",
      "x": "Give `SIGTERM` a couple of seconds, then re-run your `ss` or `lsof` query. Empty output is the confirmation. If the process ignores `SIGTERM`, escalate. A well-behaved server closes its listener on `SIGTERM` and exits; one that does not is worth fixing, because the same defect is what breaks your watcher restarts."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Two one-liners that bite",
      "x": "`lsof -t` can return several PIDs, and the shell will hand all of them to `kill`. Run the lookup on its own first and read it. Separately, `pkill -f node` matches every command line containing \"node\", which on a developer machine includes language servers, editor extension hosts and unrelated services. Use `pgrep -af node` to preview the matches before you switch to `pkill`."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not kill docker-proxy",
      "x": "When a published container port is held, `docker-proxy` or the Docker daemon owns the socket. Killing it leaves the daemon's view of port allocations inconsistent, and you may need to restart Docker to recover. Run `docker ps` to find the container, then `docker stop <name>` or `docker compose down`."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that feels supernatural. Your process crashed, the stack trace printed, the shell prompt returned, and the port is still busy. Nothing is haunted. One of the following is true."
    },
    {
      "t": "table",
      "head": [
        "What you see",
        "What is actually happening",
        "What to do"
      ],
      "rows": [
        [
          "Prompt returned, port still bound",
          "The process forked a child, which inherited the listening file descriptor. The parent is gone; the child still holds an open reference to the socket, so the kernel keeps it bound.",
          "Look up the owner by port and kill the PID you find, not the command you launched. `ps -o pid,ppid,command -p <pid>` shows whether its parent is already gone."
        ],
        [
          "`nodemon` or `tsx watch` restarts, then immediately fails",
          "The previous process has not finished closing. Idle keep-alive connections keep an HTTP server alive after `close()` is called, so the new process races the old one.",
          "Add a shutdown handler that destroys open connections, and let the watcher wait for exit rather than restarting on a fixed delay."
        ],
        [
          "Only the first run of a test file passes",
          "Two `listen()` calls on one port, often because a module calls `listen()` at import time and a test imports it more than once.",
          "Export the app without listening, and in tests `listen(0)` to get a free port from the kernel."
        ],
        [
          "`port is already allocated` from Compose",
          "An earlier container from the same project, or an orphan from a renamed service, still publishes the port.",
          "`docker ps -a`, then `docker compose down --remove-orphans`."
        ],
        [
          "Nothing is listening, bind still fails",
          "The port sits inside a range reserved by the OS, or a system service holds it without appearing in your unprivileged `lsof` output.",
          "Check reserved ranges on Windows and WSL, and re-run the lookup with `sudo`."
        ]
      ],
      "caption": "The five patterns that cover most post-crash EADDRINUSE reports."
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT explanation is usually wrong"
    },
    {
      "t": "p",
      "x": "A popular answer says the port is in `TIME_WAIT` and you must wait roughly a minute, or set `SO_REUSEADDR`. That is mostly a misdiagnosis for server restarts. `TIME_WAIT` applies to closed connection endpoints, and `SO_REUSEADDR` exists precisely so a fresh listener can claim a port that has lingering closed connections against it. Node sets that option on TCP servers through libuv on Unix platforms, and most server frameworks in other languages either set it by default or expose a one-line switch. So if your `listen()` is refused, a live process is nearly always holding the socket. Go and find it."
    },
    {
      "t": "p",
      "x": "Two caveats, because the detail matters. `SO_REUSEADDR` does not let two processes listen on the same port at once; that needs `SO_REUSEPORT`, which is a deliberate choice and not a default. And Windows treats these options differently, so a restart race there can genuinely fail where the same code on Linux succeeds."
    },
    {
      "t": "h3",
      "x": "Wildcard and specific addresses overlap"
    },
    {
      "t": "p",
      "x": "A listener on `0.0.0.0:3000` conflicts with one on `127.0.0.1:3000`, because the wildcard already covers the loopback address. This is why `ss -ltnp | grep :3000` is better than searching for your own hostname. It is also why `:::3000` in a Node error is worth reading carefully: a dual-stack wildcard socket typically accepts IPv4 traffic too, so the collision can come from a process you thought was IPv4-only."
    },
    {
      "t": "h2",
      "x": "When nothing is listening but bind still fails"
    },
    {
      "t": "p",
      "x": "On Windows and inside WSL, Hyper-V reserves blocks of dynamic ports for its own use. If your development port falls inside one of those blocks, `bind()` fails with no listener anywhere to be found. Check it:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Run as Administrator. Lists ranges the OS has reserved.\nnetsh int ipv4 show excludedportrange protocol=tcp\n\n# Also check dynamic port allocation\nnetsh int ipv4 show dynamicport tcp"
    },
    {
      "t": "p",
      "x": "If your port appears in the excluded output, the quick workaround is to use a different port. The common advice to run `net stop winnat` followed by `net start winnat` does often release the reservation, but it interrupts NAT for running containers and VMs, so treat it as a maintenance action rather than a casual fix. Pinning the dynamic range with `netsh int ipv4 set dynamic tcp start=49152 num=16384` is the more durable option, and it needs an administrator shell plus a reboot to settle."
    },
    {
      "t": "p",
      "x": "On macOS, ports 5000 and 7000 are claimed by the AirPlay Receiver feature, served by the Control Center process. This has been the behaviour since macOS Monterey, and it catches anyone whose framework defaults to port 5000, Flask included. Killing Control Center is not a fix: launchd restarts it. Either disable AirPlay Receiver in System Settings, under the pane that holds AirDrop and Handoff, or move your app to another port. Apple has relocated and renamed that toggle across releases, so check the current layout on your own machine rather than trusting a screenshot from an older version. This page was last reviewed in November 2026."
    },
    {
      "t": "h2",
      "x": "Stop leaving the port bound"
    },
    {
      "t": "p",
      "x": "Most repeat offences come from a server that never closes its listener on shutdown. Handle both signals, drop idle connections, and keep a hard timeout so a stuck request cannot hold the process open indefinitely."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${port} is in use. Find the owner with:\\n` +\n      `  lsof -nP -iTCP:${port} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});\n\nconst shutdown = () => {\n  // Stop accepting new connections, exit once the rest drain.\n  server.close(() => process.exit(0));\n\n  // Available from Node 18.2: drop keep-alive sockets that would\n  // otherwise hold the listener open until they time out.\n  server.closeAllConnections?.();\n\n  // Backstop: never hang a deploy or a watcher restart.\n  setTimeout(() => process.exit(1), 5_000).unref();\n};\n\nprocess.on('SIGINT', shutdown);\nprocess.on('SIGTERM', shutdown);"
    },
    {
      "t": "p",
      "x": "The optional call on `closeAllConnections` keeps that code working on older runtimes, where it is simply skipped. If you must support them, track sockets yourself in a `Set` on the `connection` event and destroy them during shutdown. The behaviour you want is the same either way: `close()` alone waits for idle keep-alive sockets, and that wait is the restart race."
    },
    {
      "t": "p",
      "x": "For tests and any short-lived process, let the kernel pick the port. There is no race to lose and no fixed number to collide with."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0);          // 0 means \"any free port\"\nconst { port } = server.address();     // read it back after listening\nconst baseUrl = `http://127.0.0.1:${port}`;\n\n// afterAll / teardown\nawait new Promise((resolve) => server.close(resolve));"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Kill the group, not just the leader",
      "x": "When a crashed process has left children behind, signalling the whole process group is cleaner than hunting PIDs one by one. `ps -o pid,pgid,command -p <pid>` gives you the group ID, and `kill -TERM -- -<pgid>` signals every member. In a Docker container, run your server as PID 1 or use `--init`, so the runtime reaps children instead of letting them linger."
    },
    {
      "t": "h2",
      "x": "A diagnostic order that works"
    },
    {
      "t": "ol",
      "items": [
        "Read the error. Note the exact address and port, including whether it is a wildcard (`:::3000`, `0.0.0.0:3000`) or a specific interface.",
        "Query by port with `ss -ltnp`, `lsof -nP -iTCP:<port> -sTCP:LISTEN` or `Get-NetTCPConnection`. Add `sudo` if the result is empty.",
        "Identify the owner before acting. Your own runtime, a container proxy, a system service and a reserved range each need a different response.",
        "Send `SIGTERM`, wait, re-query. Escalate to `SIGKILL` only when the process ignores it.",
        "If no owner exists, check reserved ranges on Windows and WSL, and known system ports such as 5000 and 7000 on macOS.",
        "Fix the cause: a shutdown handler that closes the listener, `listen(0)` in tests, and process supervision that reaps children."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "Find it first: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `ss -ltnp | grep :3000` on Linux, or `Get-NetTCPConnection -LocalPort 3000 -State Listen` in PowerShell. Then `kill <pid>`, or `taskkill /PID <pid>` on Windows. Re-run the lookup to confirm the port is free. Reach for `kill -9` only if the process ignores SIGTERM."
        },
        {
          "q": "Why is port 3000 still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends SIGINT to the foreground process group, and something in that group did not exit. The usual causes are a child process that inherited the listening socket, or a server whose close() is blocked by idle keep-alive connections. Look up the owner by port rather than assuming the process you started is gone, and add a shutdown handler that destroys open connections."
        },
        {
          "q": "Is it safe to kill -9 the process holding a port?",
          "a": "It frees the port, but it skips every cleanup path: no flushed buffers, no released locks, no graceful connection close, and no chance to stop its own children. Those orphaned children can go on holding the socket, which is how people end up killing the same port twice. Try SIGTERM first and keep SIGKILL for processes that refuse to exit."
        },
        {
          "q": "What does \"address already in use :::3000\" mean?",
          "a": "`::` is the IPv6 wildcard address, so `:::3000` reads as \"all interfaces, port 3000\". It tells you the listener claimed every interface rather than one address. Because a dual-stack wildcard socket normally accepts IPv4 traffic as well, the conflicting process may be one you believed was IPv4-only, and a listener on 0.0.0.0 conflicts with one on 127.0.0.1 for the same reason."
        },
        {
          "q": "Why can't I use port 5000 on my Mac?",
          "a": "AirPlay Receiver has used ports 5000 and 7000 since macOS Monterey, served by the Control Center process. Killing Control Center does not help because launchd restarts it. Disable AirPlay Receiver in System Settings, in the pane containing AirDrop and Handoff, or run your app on a different port. The exact location of that setting has moved between macOS releases, so check your own version."
        },
        {
          "q": "How do I stop EADDRINUSE in my test suite?",
          "a": "Do not hard-code a port. Call `listen(0)` and read the assigned port from `server.address()`, which lets the kernel hand you a free one per run. Also make sure your app module exports the app without calling listen() at import time, and close the server in teardown. That removes both the double-listen and the parallel-worker collision."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the port frees itself because your container died, start with PID 1 and the exit code.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite failure: the port is free because nothing is listening on the interface you dialled.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Why resolution fails, and how ESM and CommonJS differ when a module runs at import time.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-18",
  "updated": "2026-11-18",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
