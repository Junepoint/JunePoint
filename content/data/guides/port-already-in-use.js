module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free the Process Holding a Port",
  "h1": "Port already in use: find the owner, then free it",
  "eyebrow": "Troubleshooting",
  "description": "Diagnose EADDRINUSE with lsof, ss and netstat, kill the right process safely, and understand why a port stays busy after a crash.",
  "standfirst": "One command names the process holding your port. The more useful question is why it outlived the crash that was supposed to take it down.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Name the process on a busy port, kill it safely, and stop it coming back.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` names the owner on macOS and Linux. On Windows, `netstat -ano | findstr :3000` gives you a PID for `taskkill`.",
        "Send SIGTERM first. Escalate to `kill -9` only when a process ignores it, and not on a database whose data you care about.",
        "After a crash the usual culprit is an orphaned child process, not the kernel. Dev wrappers spawn the real server, so killing the wrapper can leave the socket owner running.",
        "TIME_WAIT gets blamed far more often than it is guilty. Node, Go and most Python frameworks set `SO_REUSEADDR`, so a listening socket rebinds straight away.",
        "If nothing seems to hold the port, check Docker's published mappings, a supervisor restart policy, and whether the port sits inside the ephemeral range."
      ]
    },
    {
      "t": "lede",
      "x": "The error names a resource, not a cause. `listen EADDRINUSE: address already in use :::3000` means the kernel refused your `bind()` call because another socket already owns that address and port. Finding the owner is a one-liner. Working out how it survived the crash you thought killed it is the part that stops this happening again tomorrow."
    },
    {
      "t": "h2",
      "x": "What the kernel is refusing"
    },
    {
      "t": "p",
      "x": "A listening socket is identified by a protocol, a local address and a local port. The kernel allows exactly one owner of that combination unless the socket options say otherwise. So the conflict is not really about the number 3000, it is about the pair. `127.0.0.1:3000` and `0.0.0.0:3000` are different addresses, but they are not independent: a wildcard bind to `0.0.0.0:3000` overlaps every specific address on the machine, so it fails if something already holds the loopback one. The reverse also holds. This catches people who move a service from localhost-only to all interfaces and expect the two to coexist."
    },
    {
      "t": "p",
      "x": "Every runtime reports the same refusal in its own dialect. Recognising the shape saves a search:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# nginx\nnginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)\n\n# Docker, when publishing a port\nBind for 0.0.0.0:8080 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Errno 98 is Linux. On macOS and the BSDs the same condition is errno 48, so a Python traceback there reads `[Errno 48]`. Docker's wording deserves attention because it describes a different failure from the others: the daemon is reporting its own port bookkeeping, which can stay occupied even when the container that wanted the port is long gone."
    },
    {
      "t": "h2",
      "x": "Find the owner"
    },
    {
      "t": "p",
      "x": "Ask for listeners only, and ask for numbers rather than names. Resolving hostnames and service names is slow and hides the thing you want."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: what is LISTENING on 3000\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed; -p needs root to show the process\nsudo ss -ltnp 'sport = :3000'\n\n# UDP is a separate namespace. Check it if the TCP query is empty.\nsudo ss -lunp 'sport = :3000'\n\n# Windows, cmd\nnetstat -ano | findstr :3000\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, OwningProcess"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Plain `lsof -i:3000` matches any socket with 3000 as either the local or the remote port, which means a browser tab talking to your dev server shows up in the results. Pipe that into `kill` and you can take down something you never intended to touch. On Linux, `ss` without `sudo` prints the socket but leaves the process column empty, which reads like a mystery and is only a permission problem."
    },
    {
      "t": "p",
      "x": "Once you have a PID, spend five seconds identifying it before you kill it. `ps -o pid,ppid,command -p <pid>` shows the command line and the parent. The parent is the interesting column: if the parent is PID 1, or a launchd or systemd process, you are looking at an orphan, and that tells you most of what the next section explains."
    },
    {
      "t": "h2",
      "x": "Kill it without collateral damage"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask politely. SIGTERM lets the process run its shutdown handlers.\nkill 48231\n\n# Still holding the port a few seconds later? Now insist.\nkill -9 48231\n\n# Shortcut, once you trust the filter: kill only listeners on that port\nkill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)\n\n# Linux equivalent, no PID lookup needed\nsudo fuser -k 3000/tcp\n\n# Windows\ntaskkill /PID 48231 /F"
    },
    {
      "t": "p",
      "x": "SIGTERM first is not politeness theatre. A process that handles it gets to flush logs, finish in-flight requests, release advisory locks and remove its PID file. `kill -9` cannot be caught or blocked, so none of that happens. For a stateless dev server the difference is nothing. For anything that writes, it is the difference between a clean restart and a recovery you did not plan for."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Two kills to avoid",
      "x": "`pkill -f node` matches every process whose command line contains `node`, which on a typical developer machine includes language servers, editor extensions and other projects' dev servers. And do not `kill -9` a PostgreSQL postmaster: the documentation is explicit that SIGKILL prevents it from cleaning up shared memory and semaphores, and it leaves orphaned backends behind. Use `pg_ctl stop -m fast` instead."
    },
    {
      "t": "h2",
      "x": "Why the port survives a crash"
    },
    {
      "t": "p",
      "x": "This is the part that generates the repeat visits. The crash you watched was usually a wrapper dying, and the thing holding the socket was its child."
    },
    {
      "t": "h3",
      "x": "An orphaned child still owns the socket"
    },
    {
      "t": "p",
      "x": "`npm run dev` is not your server. It is a shell that spawns your server, often through two or three more layers: npm, then a shell, then `nodemon`, then `node`. Ctrl+C sends SIGINT to the whole foreground process group, which usually reaches everyone. A crashed or force-quit terminal does not: the shell dies, the child is reparented to init, and it keeps the listening socket open because nothing ever told it to stop. The same thing happens to a process started with `&` and then disowned, and to Node's cluster workers, which inherit the listening handle and can outlive a dead primary."
    },
    {
      "t": "h3",
      "x": "Something is restarting it faster than you can look"
    },
    {
      "t": "p",
      "x": "If the port frees for a second and is immediately taken again, you are fighting a supervisor. `pm2`, `nodemon`, a systemd unit with `Restart=always`, a Docker `restart: unless-stopped` policy and most IDE run configurations exist precisely to bring the process back. Killing the child is the one move guaranteed not to work. Stop the supervisor: `pm2 delete <name>`, `systemctl stop <unit>`, `docker compose down`."
    },
    {
      "t": "h3",
      "x": "Docker is holding the mapping"
    },
    {
      "t": "p",
      "x": "A published port is owned by the Docker daemon and its proxy process, not by your application. `lsof` shows `docker-proxy` or `dockerd` rather than anything you recognise, and killing that is a bad idea because the daemon manages its own lifecycle. Find the container instead with `docker ps -a --filter publish=8080`, then stop or remove it. A container stuck in a restart loop produces exactly the symptom above, with the extra confusion that `docker ps` may show nothing at the moment you happen to look."
    },
    {
      "t": "h3",
      "x": "A shutdown handler that never finishes"
    },
    {
      "t": "p",
      "x": "`server.close()` in Node stops accepting new connections and then waits for the existing ones to end. An idle keep-alive connection, an open WebSocket or a long-poll request keeps that wait going indefinitely, so the process looks hung on exit. People then close the terminal window, which leaves the process alive and the port taken. If you have a server that logs \"shutting down\" and then just sits there, this is your bug."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and the bind still fails"
    },
    {
      "t": "p",
      "x": "Sometimes `lsof` really is empty and the bind still fails. The popular answer is TIME_WAIT, and for most modern servers that answer is wrong. TIME_WAIT applies to a closed connection's four-tuple and lingers for 60 seconds on Linux, but a listening socket is not blocked by it as long as `SO_REUSEADDR` is set. Node sets that option on its listening sockets, as do Go's `net/http` and Python's `socketserver` when `allow_reuse_address` is on. If your language or framework does not set it, you will see the delay, and the fix is the socket option rather than a sleep in a restart script."
    },
    {
      "t": "p",
      "x": "Two other causes are much more likely, and both are easy to confirm."
    },
    {
      "t": "p",
      "x": "The first is an outbound connection that borrowed your port. Linux allocates ephemeral source ports from the range in `/proc/sys/net/ipv4/ip_local_port_range`, commonly 32768–60999 on current distributions. Choose a fixed service port inside that window and an unrelated client socket can take it first, giving you an EADDRINUSE that vanishes on retry and cannot be reproduced on demand. Keep fixed ports below 32768, or add the port to `ip_local_reserved_ports`. The second cause is a namespace boundary: a process inside a container, a WSL distribution or a separate network namespace holds the port, so your host-level `lsof` cannot see it at all."
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "Likely cause",
        "Next step"
      ],
      "rows": [
        [
          "lsof finds nothing, bind still fails",
          "Wrong protocol, a privileged owner, or another namespace",
          "Re-run with `sudo`, check `ss -lunp` for UDP, and look inside containers"
        ],
        [
          "Port frees, then refills within a second",
          "A supervisor is restarting the process",
          "Stop the supervisor, not the child"
        ],
        [
          "Only the wildcard bind fails",
          "Something holds `127.0.0.1:PORT`, which overlaps `0.0.0.0:PORT`",
          "Query the loopback address specifically"
        ],
        [
          "`port is already allocated`",
          "Docker still owns the published mapping",
          "`docker ps -a --filter publish=PORT`, then `docker compose down`"
        ],
        [
          "Both servers start, requests hit the wrong one",
          "`SO_REUSEPORT` let both bind and the kernel is balancing",
          "Look for a reuse-port flag in config, or a second replica"
        ],
        [
          "Fails intermittently, never reproducibly",
          "The port sits inside the ephemeral range",
          "Move it below 32768 or reserve it"
        ]
      ],
      "caption": "Mapping the symptom to the layer that is actually responsible."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The silent failure mode",
      "x": "`SO_REUSEPORT` is the one case where you would rather have had the error. Two processes bind the same port, the kernel spreads connections across both, and roughly half your requests reach the stale server running old code. That looks like a caching bug or a flaky proxy, and it wastes hours. On recent macOS versions, ports 5000 and 7000 are used by AirPlay Receiver through ControlCenter, which is a similar kind of surprise: check System Settings before you blame your code, and confirm against current Apple documentation, because this detail changes between releases."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Handle both signals, close the server, and set a deadline so one stuck connection cannot hold the process open forever."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(3000);\n\nconst shutdown = (signal) => {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n\n  // Node 18.2 and later: hang up idle keep-alive sockets right away.\n  if (server.closeIdleConnections) server.closeIdleConnections();\n\n  // Backstop. unref() so this timer never delays a clean exit.\n  setTimeout(() => process.exit(1), 5000).unref();\n};\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "In tests, stop hard-coding the port at all. Passing `0` asks the kernel for a free one, which removes the entire class of failure from a parallel test run."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  baseUrl = `http://127.0.0.1:${port}`;\n});"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the owner before touching anything",
          "x": "Get the PID, then look at its command line and its parent. An orphan and a supervisor-managed child need opposite responses.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN\nps -o pid,ppid,command -p 48231"
        },
        {
          "title": "Stop the supervisor if there is one",
          "x": "Process managers win races against your terminal, so take the manager out of the picture first.",
          "code": "pm2 delete api\ndocker compose down\nsystemctl stop myapp"
        },
        {
          "title": "Signal, wait, then escalate",
          "x": "SIGTERM, a few seconds, then SIGKILL if the socket is still held. Re-run the query rather than assuming it worked.",
          "code": "kill 48231\nsleep 3\nlsof -nP -iTCP:3000 -sTCP:LISTEN || echo free"
        },
        {
          "title": "Fix the shutdown path",
          "x": "If you have cleared the same port twice this week, the bug is a missing signal handler, not the port."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Worth a shell function",
      "x": "Adding `port() { lsof -nP -iTCP:\"$1\" -sTCP:LISTEN; }` to your shell profile takes three seconds and removes the temptation to paste an unfiltered `kill` one-liner from a search result."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The restart loop behind a port that frees and refills every second.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite error, and the layer-by-layer way to track it down.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnose and fix CORS errors",
          "desc": "For when the server finally listens and the browser still says no.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux: `kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)`, then escalate to `kill -9` on the same PID if the port is still held a few seconds later. On Windows, find the PID with `netstat -ano | findstr :3000` and run `taskkill /PID <pid> /F`. Keep the `-sTCP:LISTEN` filter so you do not also kill clients that happen to be connected to port 3000."
        },
        {
          "q": "Why does it say port already in use when nothing is running?",
          "a": "Usually something is running and you cannot see it. Look for an orphaned child of a dev-server wrapper, a Docker published port owned by `docker-proxy`, a process in another namespace such as a container or a WSL distribution, or a privileged owner that only appears under `sudo lsof`. If the port is above 32768 on Linux, an outbound connection may have taken it as an ephemeral source port."
        },
        {
          "q": "Is TIME_WAIT the reason I get EADDRINUSE?",
          "a": "Rarely, for a server. TIME_WAIT holds a closed connection's four-tuple for about 60 seconds on Linux, but a listening socket with `SO_REUSEADDR` set rebinds immediately, and Node, Go and most Python servers set that option by default. If yours does not, set the option rather than sleeping before the restart."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "For a stateless dev server, yes. For anything that writes data, no: SIGKILL cannot be handled, so there is no flush, no lock release and no cleanup. Databases are the clearest case to avoid. SIGKILL on a PostgreSQL postmaster leaves shared memory and orphaned backend processes behind, so use `pg_ctl stop -m fast`."
        },
        {
          "q": "Why does the port come back as busy right after I kill it?",
          "a": "A process manager is restarting your server. `pm2`, `nodemon`, a systemd unit with `Restart=always` or a Docker restart policy will each recreate the process within about a second. Stop the manager rather than the process it supervises."
        },
        {
          "q": "How do I stop this happening in my own app?",
          "a": "Handle SIGINT and SIGTERM, call `server.close()`, and add an unref'd timeout that forces an exit if a keep-alive connection refuses to drain. In tests, listen on port `0` and read the assigned port from `server.address()` so parallel runs never collide."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-26",
  "updated": "2026-10-26",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
