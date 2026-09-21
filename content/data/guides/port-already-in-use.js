module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find What Owns the Port and Free It",
  "h1": "Port already in use: finding and killing the process",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding a busy port on macOS, Linux and Windows, kill it safely, and understand why the port stays occupied after a crash.",
  "standfirst": "The error names the exact address it failed to bind. Use that, identify the owning process, then fix the reason a dead server is still holding the socket.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Identify the process holding a port, kill it safely, and stop orphaned servers from doing it again.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means some socket already holds that address and port combination. Nothing about your framework, cache or `node_modules` is involved.",
        "Identify the owner before killing anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the usual cause is an orphaned child process still holding the listening socket, not the kernel holding the port in `TIME_WAIT`.",
        "Send `SIGTERM` first. `kill -9` skips cleanup and leaves lock files, sockets and container state behind.",
        "`127.0.0.1:3000` and `0.0.0.0:3000` are different bindings, so a conflict can hide from a check that only looked at one of them."
      ]
    },
    {
      "t": "h2",
      "x": "The error already tells you the address"
    },
    {
      "t": "p",
      "x": "Every runtime surfaces the same underlying `EADDRINUSE` from the operating system, and every one of them prints the address it tried to bind. Read that part first. It is the difference between hunting for a phantom and typing one command."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node.js\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker (wording varies between versions)\nBind for 0.0.0.0:8080 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "The `:::3000` in the Node message is not a typo or a truncated IPv6 address. It is the IPv6 wildcard, written `::`, followed by the port. On a dual stack system a wildcard IPv6 listener usually accepts IPv4 traffic too, which is why a process you believe is bound to IPv6 can still collide with one binding `0.0.0.0`. Python reports errno 98 on Linux and errno 48 on macOS for the same condition, so the number is a platform detail rather than a different fault."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EADDRINUSE is not EACCES",
      "x": "If the message says `EACCES` or `Permission denied` rather than address in use, the port is free and you lack the privilege to bind it. On Linux and macOS that applies to ports below 1024 unless the process is root or has been granted the capability. Different problem, different fix."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "There are three commands worth knowing, and you only need one per platform. Prefer the listening filter. Without it you will also match every outbound connection that happens to use that port as a remote endpoint, which is how people end up killing their browser."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is LISTENING on 3000\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, usually faster and always installed on modern distros\nss -lptn 'sport = :3000'\n\n# Older Linux or minimal images\nnetstat -tulpn | grep ':3000'\n\n# If the output is empty but the port is still refused,\n# another user owns the process. Re-run with sudo.\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, classic\nnetstat -ano | findstr :3000\n\n# Windows, PowerShell, resolves straight to a process name\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Find the owner",
        "Stop it"
      ],
      "rows": [
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`kill <pid>`, then `kill -9 <pid>` if it ignores you"
        ],
        [
          "Linux",
          "`ss -lptn 'sport = :3000'`",
          "`kill <pid>` or `fuser -k 3000/tcp`"
        ],
        [
          "Windows",
          "`netstat -ano | findstr :3000`",
          "`taskkill /PID <pid> /F`"
        ],
        [
          "Docker",
          "`docker ps --filter publish=3000`",
          "`docker stop <container>`"
        ],
        [
          "Any, quick and blunt",
          "`npx kill-port 3000`",
          "Kills whatever it finds, so check first"
        ]
      ],
      "caption": "Substitute your own port number. The listening filter matters more than the tool you pick."
    },
    {
      "t": "p",
      "x": "The `COMMAND` column from `lsof` is the useful part. If it says `node`, you have a leftover dev server. If it says `docker-proxy` or `com.docker.backend`, a container publishes that port and killing the proxy will not help, because Docker will just put it back. If it says `ControlCe` on macOS, keep reading, there is a section for that below."
    },
    {
      "t": "h2",
      "x": "Kill it without collateral damage"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the PID belongs to something you recognise",
          "x": "Print the full command line before you act. A PID on its own is meaningless, and PIDs get recycled, so a number you copied five minutes ago may now belong to something else entirely.",
          "code": "ps -o pid,ppid,user,command -p 51234"
        },
        {
          "title": "Ask politely first",
          "x": "Plain `kill` sends `SIGTERM`, which gives the process a chance to close its listening socket, flush writes and remove lock files. Most dev servers handle it in milliseconds.",
          "code": "kill 51234"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught or handled. The process dies mid-write, which is how you get a stale `.pid` file, a half-written SQLite journal or a database lock that outlives the crash.",
          "code": "kill -9 51234"
        },
        {
          "title": "Verify the port is actually free",
          "x": "An empty result means you can start again. If something is still listening, you killed a child while the parent respawned it, which points at a watcher like nodemon or a process manager.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo \"port 3000 is free\""
        }
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "One-liners cut both ways",
      "x": "`kill -9 $(lsof -t -iTCP:3000 -sTCP:LISTEN)` is convenient and fine on your own laptop. On a shared or production host it is a way to force kill a process you never looked at. Run the lookup, read the output, then kill."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is where most of the confusion lives. Your terminal printed a stack trace, the prompt came back, and yet the port is occupied. The process you were watching is gone. Something else inherited its socket."
    },
    {
      "t": "h3",
      "x": "An orphaned child still holds the socket"
    },
    {
      "t": "p",
      "x": "Tooling layers processes. A `npm run dev` script spawns a shell, the shell spawns a watcher, the watcher spawns the actual server, and some build tools fork workers on top of that. Pressing Ctrl+C sends `SIGINT` to the foreground process group, but a child that was detached, or that was spawned by a parent which died first, never receives it. That grandchild keeps the listening file descriptor open. It is still there, still bound, still invisible in the terminal you were using. This is the single most common answer to \"why is the port still in use\", and it is why checking the process name in `lsof` output resolves the mystery about nine times out of ten."
    },
    {
      "t": "h3",
      "x": "A watcher restarted the server faster than you killed it"
    },
    {
      "t": "p",
      "x": "If you kill the server but leave nodemon, `tsx watch`, `vite`, `air` or a systemd unit with `Restart=always` in place, the port is reoccupied before you can retry. The symptom is a PID that changes every time you look. Stop the supervisor, not the supervised."
    },
    {
      "t": "h3",
      "x": "The container is still published"
    },
    {
      "t": "p",
      "x": "A stopped container releases its port. A container that exited but was started with a restart policy, or one that is still running with no logs, does not. `docker ps -a --filter publish=3000` shows both. For the wider question of containers that die and come back, our guide on [containers exiting immediately](/guides/docker-container-exits-immediately/) covers the exit code side of it."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT, which is usually blamed and rarely guilty"
    },
    {
      "t": "p",
      "x": "The popular explanation is that the kernel holds the port for a minute or two after a crash, so you should just wait. That is misleading for most server code. `TIME_WAIT` applies to connections that were accepted, not to the listening socket, and the `SO_REUSEADDR` option exists precisely so a new listener can bind while those old connection tuples drain. libuv sets `SO_REUSEADDR` for TCP servers by default, so Node rebinds immediately. Go's `net.Listen` sets it too. Python's raw `socket` does not, which is why a hand written `socket.bind()` can genuinely need `sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)` while an Express app never does. If waiting 60 seconds appears to fix your problem, look again, because something probably exited during that minute."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\nsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n# Without this, a restart can fail with errno 98 / 48\nsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)\nsock.bind((\"0.0.0.0\", 3000))\nsock.listen()"
    },
    {
      "t": "h3",
      "x": "SO_REUSEPORT, the opposite failure"
    },
    {
      "t": "p",
      "x": "On Linux, `SO_REUSEPORT` lets several processes bind the same port deliberately and have the kernel load balance between them. Some servers enable it. The failure mode is not an error at all: two versions of your app run side by side, and roughly half your requests hit the stale one. If requests behave inconsistently and only some of them reflect your latest code, count the listeners before you debug the code."
    },
    {
      "t": "h2",
      "x": "Cases that look like a conflict but are not"
    },
    {
      "t": "ul",
      "items": [
        "**macOS and port 5000 or 7000.** AirPlay Receiver binds these. The `lsof` output shows `ControlCe`. Turn AirPlay Receiver off in System Settings under General, then AirDrop and Handoff, or pick another port. Menu locations move between macOS releases, so confirm against your own version.",
        "**Windows reserved ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ephemeral ports, and a bind inside a reserved range fails even though nothing is listening. Run `netsh interface ipv4 show excludedportrange protocol=tcp` as administrator to see them.",
        "**Localhost versus all interfaces.** A process bound to `127.0.0.1:3000` does not block `192.168.1.10:3000`, but a process bound to `0.0.0.0:3000` blocks both. A check that only looked at one address can miss the conflict entirely.",
        "**WSL and Windows are separate stacks.** A listener inside WSL2 will not appear in a Windows `netstat` run, and vice versa. Check on the side that reported the error.",
        "**Monorepos with a shared default.** Two packages that both default to port 3000 collide the moment you run them together. The fix is configuration, not process killing."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it from happening again"
    },
    {
      "t": "p",
      "x": "Killing processes by hand is a tolerable cost once a month and a real tax three times a day. Two changes remove most of the recurrence: handle termination signals, and let the port be configurable."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const port = Number(process.env.PORT) || 3000;\nconst server = app.listen(port, () => {\n  console.log(`listening on http://localhost:${port}`);\n});\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`port ${port} is in use. Run: lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing listener`);\n  server.close(() => process.exit(0));\n  // Do not hang forever on a keep-alive connection\n  setTimeout(() => process.exit(1), 10000).unref();\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));\nprocess.on('SIGINT', () => shutdown('SIGINT'));"
    },
    {
      "t": "p",
      "x": "Inside a container, signals only arrive if your process is PID 1 and the image uses the exec form of `CMD`. `CMD npm start` runs through a shell that commonly fails to forward `SIGTERM`, so `docker stop` waits out its grace period and then kills the container outright. Use `CMD [\"node\", \"server.js\"]`, and add `--init` if you need a real init to reap zombie children."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A crash that leaves a listener is a bug worth keeping",
      "x": "If your server keeps surviving its own crash as an orphan, the interesting question is which child is outliving the parent. Run `ps -ef --forest` on Linux or `pstree` on macOS while it is happening. The tree usually names the culprit straight away."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, run `lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, check the command name in the output, then `kill <pid>`. Use `kill -9 <pid>` only if it does not exit. On Windows, `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`."
        },
        {
          "q": "Why is the port still in use after I stopped the server?",
          "a": "Almost always an orphaned child process. Dev tooling spawns several layers of processes, and a detached grandchild keeps the listening socket open after its parent dies. Look at the process name in the `lsof` output rather than assuming the port is stuck at the kernel level."
        },
        {
          "q": "Do I have to wait for TIME_WAIT to expire?",
          "a": "Usually no. `TIME_WAIT` applies to accepted connections, and `SO_REUSEADDR` lets a new listener bind anyway. Node, Go and most frameworks set that option by default. A hand written Python or C socket that does not set it is the real case where waiting helps."
        },
        {
          "q": "What does the `:::3000` in the Node error mean?",
          "a": "It is the IPv6 wildcard address `::` followed by the port number. On a dual stack machine that listener typically accepts IPv4 traffic too, so it conflicts with anything bound to `0.0.0.0` on the same port."
        },
        {
          "q": "Why can I not bind to port 80 or 443 even though nothing is listening?",
          "a": "That is a permissions error, not a conflict. Check whether the message says `EACCES` rather than `EADDRINUSE`. Ports below 1024 are privileged on Unix systems, so either run with elevated privileges, grant the binary the capability, or put a reverse proxy in front."
        },
        {
          "q": "Is `npx kill-port 3000` safe to use?",
          "a": "On a development machine, generally yes, and it is quick. It kills whatever holds the port without showing you what that is first, so avoid it on shared or production hosts where the answer might not be your app."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker Container Exits Immediately",
          "desc": "Exit codes, restart loops and why a stopped container can still hold a published port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL Connection Refused",
          "desc": "The mirror image of this problem: nothing is listening where you expect it to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Another Node startup failure that looks like configuration and is usually resolution.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-21",
  "updated": "2026-09-21",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/",
    "/reviews/gdpr-compliance-software/"
  ]
};
