module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Fixing 'port already in use' errors",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something already holds the port. Find the owning PID, stop it cleanly, and fix the crash pattern that keeps leaving it bound.",
  "standfirst": "Find the process holding the port in one command, stop it without losing state, and understand why a crashed dev server so often keeps its socket.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port",
    "find process using port"
  ],
  "cardDesc": "Locate the PID holding a port, stop it safely, and fix the restart habits that leave sockets bound after a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Something is already bound to that address and port. Nine times in ten it is another copy of your own server, so find the PID before you change the port number.",
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `ss -ltnp 'sport = :3000'` on Linux, `Get-NetTCPConnection -LocalPort 3000` on Windows.",
        "Send `SIGTERM` first. `kill -9` frees the port just as quickly but skips every cleanup handler the process has.",
        "After a crash the usual holder is an orphaned child process. A `<defunct>` zombie cannot hold a socket, so stop blaming it.",
        "`TIME_WAIT` almost never blocks a listener in Node, Go or nginx, because all of them set `SO_REUSEADDR` on your behalf."
      ]
    },
    {
      "t": "h2",
      "x": "What the error looks like in each runtime"
    },
    {
      "t": "p",
      "x": "Every runtime reports the same refused `bind()` call in its own words. Match what your terminal printed against these:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python on Linux. On macOS and the BSDs the errno is 48, not 98.\nOSError: [Errno 98] Address already in use\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# nginx\nnginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)\n\n# Docker publishing a host port\nError response from daemon: Bind for 0.0.0.0:8080 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "They all mean the kernel refused to give your process that address and port pair, because something else holds it. Retrying harder will not help. Identify the owner, then choose what to do about it."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Why Node prints three colons",
      "x": "`:::3000` is not a typo. It is the IPv6 wildcard address `[::]` followed by `:3000`, flattened into one string. On most systems a wildcard IPv6 socket also accepts IPv4 traffic, which is why a server bound to `:::3000` collides with one bound to `0.0.0.0:3000`."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "Start by naming the holder. Two tools cover Unix: `ss` ships with iproute2 on current Linux distributions, and `lsof` is the portable option that macOS has by default."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: listening sockets on port 3000, with the owning process\nss -ltnp 'sport = :3000'\n\n# Linux: any state, which also reveals lingering connections\nss -tanp | grep ':3000'\n\n# macOS and Linux: the listener only, no DNS or service-name lookups\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Just the PID, for scripting\nlsof -ti tcp:3000\n\n# Confirm what that PID actually is before you kill it\nps -o pid,ppid,user,etime,command -p \"$(lsof -ti tcp:3000 | head -1)\""
    },
    {
      "t": "p",
      "x": "Both tools hide process details for sockets owned by other users unless you run them with `sudo`. If `ss -ltnp` shows the port as busy but prints no process name, that is the reason, not a kernel mystery. The `ppid` column in that last command matters more than it looks: a parent of `1` means the process was orphaned and reparented, which is the classic post-crash signature."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, classic\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 12345\"\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "findstr matches more than you asked for",
      "x": "`findstr :3000` is a substring search, so it also matches `:30001` and `:13000`. Read the Local Address column rather than trusting the filter, especially before passing a PID to `taskkill /F`."
    },
    {
      "t": "h2",
      "x": "Stop it without wrecking state"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask politely first",
          "x": "`SIGTERM` is the signal a well-behaved server handles: it stops accepting, drains in-flight requests, closes database connections and removes its PID file. Most processes release the port in well under a second.",
          "code": "kill 12345"
        },
        {
          "title": "Check that the socket is actually gone",
          "x": "Do not assume. If the port is still held, you killed a wrapper and not the listener.",
          "code": "ss -ltnp 'sport = :3000' || lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignored you",
          "x": "`SIGKILL` cannot be caught, so nothing gets flushed or cleaned up. Expect stale lock files, a half-written cache, and a database that logs a recovery on next start.",
          "code": "kill -9 12345"
        },
        {
          "title": "Kill the tree, not the twig",
          "x": "Wrapper scripts are the main reason a port survives Ctrl+C. Signalling the process group reaches the children that inherited the listening descriptor.",
          "code": "# Negative PID means \"the whole process group\"\nkill -TERM -12345\n\n# Windows: /T includes the child tree\ntaskkill /PID 12345 /T\ntaskkill /PID 12345 /T /F"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Think before the one-liner",
      "x": "`sudo kill -9 $(lsof -ti:5000)` is pasted around constantly, and it is how people kill their own Postgres, a Grafana instance, or a macOS system service that happened to be listening. Drop the `sudo`, drop the `-9`, and look at the process name first: `lsof -nP -iTCP:5000`."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port bound"
    },
    {
      "t": "p",
      "x": "A socket is held by a running process, full stop. So when a port stays busy after your server died, something is still running. These are the candidates, roughly in order of how often they turn up:"
    },
    {
      "t": "ul",
      "items": [
        "**An orphaned child.** `npm run dev` starts the real server as a child process. Ctrl+C reaches the foreground wrapper, the wrapper exits, and the child keeps the inherited listening descriptor open while init adopts it. The crash did not free the port because the thing that crashed was not the thing holding it.",
        "**A suspended process.** Ctrl+Z, or a debugger holding a breakpoint, leaves the process in state `T`. It is not dead, it is paused, and paused processes keep every file descriptor they own.",
        "**A supervisor putting it straight back.** systemd with `Restart=always`, pm2, supervisord and `docker run --restart` all revive the service within seconds. If the PID is different each time you look, you are fighting a supervisor rather than a stale process.",
        "**A container still mapping the port.** When Docker publishes a port, the host-side socket belongs to Docker, not to your application. `docker ps --filter publish=3000` names the container; `docker compose down` releases it properly.",
        "**A second copy you forgot about.** Another terminal tab, a VS Code task, an IDE run configuration, a test runner that never shut down."
      ]
    },
    {
      "t": "p",
      "x": "Notice what is absent from that list. A zombie cannot hold a port. A process in state `Z`, which `ps` renders as `<defunct>`, has already exited and the kernel closed its descriptors; all that remains is an exit status waiting to be reaped by its parent. Plenty of answers online tell you to hunt the defunct process. If you find one next to a busy port, the real owner is a surviving sibling, and the zombie is a coincidence."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT, SO_REUSEADDR and the minute of waiting"
    },
    {
      "t": "p",
      "x": "The other popular explanation is `TIME_WAIT`, usually phrased as \"just wait sixty seconds\". It is real, and it is far less often the cause than its fame suggests."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to connection sockets, not listening ones. When your side closes a TCP connection first, that connection's four-tuple stays reserved for roughly twice the maximum segment lifetime, so a delayed duplicate packet cannot be mistaken for part of a new connection. On Linux that interval is 60 seconds and it is compiled in; `net.ipv4.tcp_fin_timeout` is a different timer covering `FIN_WAIT_2`, which is why tuning it changes nothing here. A busy server that just handled a thousand requests can leave a thousand sockets in `TIME_WAIT` on its port, and a fresh `bind()` to that port can be refused as a result."
    },
    {
      "t": "p",
      "x": "`SO_REUSEADDR` is the option that tells the kernel to allow the bind anyway. libuv, which Node sits on, sets it. Go's `net.Listen` sets it. nginx sets it, and Python's `http.server` sets `allow_reuse_address`. Raw socket code that calls `bind()` with no options is where this bites, which is why the fix is a single line:"
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\nsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\nsock.bind((\"127.0.0.1\", 3000))\nsock.listen(128)"
    },
    {
      "t": "p",
      "x": "There is a quick test that separates the two causes. If restarting succeeds the instant you kill something, a live process was the problem. If it only succeeds after a wait of about a minute and you never found an owner, lingering sockets were."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "SO_REUSEPORT is a different option with a nastier failure mode",
      "x": "`SO_REUSEADDR` does not let two servers listen on one port. `SO_REUSEPORT` on Linux does exactly that, and the kernel load-balances new connections between them. You get no error. You get two servers, and roughly half your requests answered by the stale one. If responses alternate between old and new behaviour, count the listeners with `ss -ltnp` before you debug the code."
    },
    {
      "t": "h2",
      "x": "Errors that look like a busy port but are not"
    },
    {
      "t": "table",
      "head": [
        "What you see",
        "Actual cause",
        "Where to look"
      ],
      "rows": [
        [
          "`EACCES` on port 80 or 443",
          "Ports below 1024 require privilege, so this is a permission error rather than a collision.",
          "Bind a high port behind a reverse proxy, or grant `CAP_NET_BIND_SERVICE`."
        ],
        [
          "Windows: `An attempt was made to access a socket in a way forbidden by its access permissions`",
          "The port falls inside an excluded range, often reserved by Hyper-V or WinNAT.",
          "`netsh int ipv4 show excludedportrange protocol=tcp`, then pick a port outside those ranges."
        ],
        [
          "macOS ports 5000 and 7000 busy with nothing of yours running",
          "AirPlay Receiver has listened on them since macOS Monterey. Verify on your own version, because the setting has moved between releases.",
          "System Settings, General, AirDrop & Handoff."
        ],
        [
          "Free inside WSL2 but busy from Windows, or the reverse",
          "The two stacks share host ports through forwarding, and mirrored networking makes the overlap total.",
          "Check both sides before killing anything on either."
        ],
        [
          "No error at all, but your change never appears",
          "The dev server quietly picked the next free port. Vite does this unless `strictPort` is true.",
          "The URL the server printed, not the one in your bookmarks."
        ]
      ],
      "caption": "Four of these five are commonly misdiagnosed as EADDRINUSE. Read the error text literally."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Most repeat offences come from servers that never learned to shut down. Handle the signals, close the server, and give yourself a hard deadline so a stuck connection cannot keep the process alive forever:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`port ${port} is taken. Owner: lsof -ti tcp:${port}`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n\n    // server.close() waits for idle keep-alive sockets, which can take\n    // as long as the agent's timeout. Available from Node 18.2; check\n    // your runtime version rather than assuming it exists.\n    server.closeAllConnections?.();\n\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "Then remove the ways a port gets pinned in the first place. In tests, never hard-code one:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// Port 0 asks the kernel for any free port, so parallel test\n// workers never collide and nothing leaks between runs.\nconst server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on ${port}`);\n});"
    },
    {
      "t": "ul",
      "items": [
        "Run the dev server directly instead of through a chain of wrappers, or make the wrapper `exec` so there is no extra process between your terminal and the listener.",
        "Shut containers down with `docker compose down` rather than Ctrl+C in the foreground, which can leave the published port mapped.",
        "Give each project its own port and write it in the README. Collisions between two of your own services are the most boring cause and the easiest to design out.",
        "If a supervisor owns the service, stop it through the supervisor: `systemctl stop myapp`, `pm2 stop myapp`. Killing the PID just triggers a restart."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and why a container stops the moment its main process does.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Postgres connection refused",
          "desc": "The layered check for a database that will not accept connections, from listener to pg_hba.conf.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How Node resolves a specifier, and the five places that resolution breaks.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "Find the PID with `lsof -ti tcp:3000` (macOS, Linux) or `Get-NetTCPConnection -LocalPort 3000 -State Listen` (Windows), confirm the process name, then `kill <pid>`. Use `kill -9` only if a plain `kill` is ignored. If the process came back with a new PID, a supervisor is restarting it and you need to stop the service instead."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends `SIGINT` to the foreground process group, and in a setup like `npm run dev` the wrapper may exit while the child server keeps running with the inherited socket. Check for an orphan whose parent PID is 1. Signalling the whole group with `kill -TERM -<pid>` takes the children with it."
        },
        {
          "q": "Does kill -9 release the port immediately?",
          "a": "Yes, the kernel closes the descriptors as soon as the process dies, so the listening socket goes away at once. Established connections may sit in `TIME_WAIT` afterwards, which is harmless for any server that sets `SO_REUSEADDR`. The real cost of `-9` is skipped cleanup: no flushed logs, no closed transactions, stale lock files."
        },
        {
          "q": "What does EADDRINUSE :::3000 mean?",
          "a": "The three colons are the IPv6 wildcard address `[::]` joined to the port, so the message is about `[::]:3000`. Because a wildcard IPv6 socket usually serves IPv4 too, it conflicts with anything bound to `0.0.0.0:3000`. Binding explicitly to `127.0.0.1` sometimes dodges the collision, though whether it does depends on the platform and on which reuse options each socket set."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Normally no, which is what `EADDRINUSE` is telling you. With `SO_REUSEPORT` on Linux, several processes can bind the same port deliberately and the kernel spreads connections across them. That is how some servers scale across cores, and it is also how a stale process can keep answering a share of your requests with no error anywhere."
        },
        {
          "q": "Do I have to wait 60 seconds before restarting my server?",
          "a": "Usually not. Node, Go, nginx and Python's `http.server` all set `SO_REUSEADDR`, so lingering `TIME_WAIT` sockets do not block a new listener. If you genuinely have to wait, you are probably running hand-written socket code with no `setsockopt` call, and adding that one line removes the wait."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-12",
  "updated": "2026-10-12",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
