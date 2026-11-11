module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: finding the process that holds it",
  "eyebrow": "Troubleshooting",
  "description": "Find the process holding a port with lsof, ss or netstat, kill it safely, and understand why a port stays bound after your app crashes.",
  "standfirst": "The port is held by a real process, almost always. Identify it before you change your config, because an orphaned child that inherited the listening socket will do the same thing again tomorrow.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the process on a busy port, kill it in the right order, and fix the orphaned child that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means some process already holds the address and port you asked for. The operating system is not confused, so find that process first.",
        "One command does the lookup: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash, the usual culprit is an orphaned child process that inherited the listening socket from its dead parent.",
        "`TIME_WAIT` is rarely the real cause for a Node or Go server. Sitting out a 60 second wait is a superstition, not a diagnosis.",
        "Send `SIGTERM` before `SIGKILL`, and add a shutdown handler that calls `server.close()` so the port is released when you stop the app."
      ]
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "p",
      "x": "Start with the socket table. You want three facts: which process owns the listening socket, which address it bound, and who started it."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: who is listening on 3000?\nss -ltnp 'sport = :3000'\n\n# macOS, and Linux where lsof is installed\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Every socket on that port, not only listeners\nlsof -nP -i :3000\n\n# If neither tool is available\nfuser -n tcp 3000"
    },
    {
      "t": "p",
      "x": "The `-n` and `-P` flags on `lsof` skip DNS and service-name lookups, which is the difference between an instant answer and a five second pause. `ss` needs root (or `sudo`) to show the process name in the `users:` column; without it you get the socket but not the owner, which is the one thing you came for."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows: the PID is the last column\nnetstat -ano | findstr :3000\n\n# PowerShell, straight to the owning process\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Then put a name to the PID\nGet-Process -Id 12345"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Read the process name before you kill anything",
      "x": "A PID from `lsof` is not automatically your stale dev server. It might be a language server, a tunnel, a database you forgot was running, or a system service. On recent macOS releases, port 5000 is commonly held by AirPlay Receiver, which shows up as `ControlCe` in `lsof` output. Killing that fixes nothing and breaks Control Center until you log back in. Turn the feature off in System Settings instead, or move your app to another port."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask politely first: SIGTERM lets the process run its cleanup\nkill 12345\n\n# Still alive? Confirm what it is before escalating\nps -p 12345 -o pid,ppid,etime,command\n\n# Only now SIGKILL, which skips every shutdown handler\nkill -9 12345\n\n# Match on the command line rather than the PID.\n# Always run the pgrep first and read the list.\npgrep -af \"node .*server.js\"\npkill -f \"node .*server.js\""
    },
    {
      "t": "p",
      "x": "`kill -9` is the reflex, and it is the wrong first move. `SIGKILL` cannot be caught, so the process never gets to flush a log, finish an in-flight write, remove a PID file or release a lock in the database. For a dev server that costs you nothing. For anything holding state it can cost you a corrupted index or a stale lock that takes longer to clean up than the original problem. Try `SIGTERM`. Give it two seconds. Then escalate."
    },
    {
      "t": "p",
      "x": "One pattern deserves a specific warning: `kill -9` on a parent does not kill its children. If the child is the one holding the socket, you have just orphaned it and made it harder to find, because its parent PID is now 1 and it no longer appears under your shell in a process tree."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people. Your app crashed. The terminal came back. The process is gone from `ps`. And the port is still taken."
    },
    {
      "t": "h3",
      "x": "A child process inherited the listening socket"
    },
    {
      "t": "p",
      "x": "A listening socket is a file descriptor, and file descriptors are inherited across `fork` and `exec` unless they are explicitly marked close-on-exec. When your server spawns a worker, a build watcher or a shell helper after it starts listening, that child holds a reference to the same socket. The parent dying releases the parent's reference only. The kernel keeps the port bound for as long as any process holds a descriptor for it, so the orphan keeps the port hostage while doing nothing useful with it."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# See the family, not just one process\nps -ef --forest | grep -A4 \"[n]pm run dev\"     # Linux\npstree -p $(pgrep -o node)                     # where pstree exists\n\n# What does the suspect actually hold open?\nlsof -p 12345 | grep -i tcp\n\n# Orphans re-parented to init show PPID 1\nps -eo pid,ppid,etime,command | awk '$2 == 1 && /node/'"
    },
    {
      "t": "h3",
      "x": "The supervisor restarted before the old process let go"
    },
    {
      "t": "p",
      "x": "`nodemon`, `watchexec`, `concurrently`, `air` and friends all work the same way: on a file change they signal the old process and start a new one. If the old process ignores `SIGTERM`, or takes longer to exit than the restart delay allows, the new one tries to bind a port that is still held by its predecessor. The symptom is distinctive. The error appears on a save, not on a cold start, and it clears if you stop everything and start again."
    },
    {
      "t": "h3",
      "x": "A container is still publishing the port"
    },
    {
      "t": "p",
      "x": "A published container port is bound by the Docker proxy on the host, not by anything you will recognize in your own project. `lsof` will name `docker-proxy` or the daemon rather than your app. Stop the container, do not kill the proxy."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container publishes 3000?\ndocker ps --format '{{.Names}}\\t{{.Ports}}' | grep 3000\n\n# Including stopped ones, in case a restart policy is looping\ndocker ps -a --filter publish=3000\n\ndocker stop <name>"
    },
    {
      "t": "p",
      "x": "If the container itself is the thing that keeps dying and taking the port with it, the exit code is the faster diagnostic. We cover that path separately in [why a Docker container exits immediately](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "h2",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "Search for this error and you will be told the port is in `TIME_WAIT` and you must wait 60 seconds. That answer is mostly a relic, and following it wastes your time while the real holder of the port keeps running."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to the ephemeral end of a closed connection, not to a listening socket. A listener closes immediately. What used to happen is that a lingering connection on the same local port would block a fresh `bind`, and the fix for that is the `SO_REUSEADDR` socket option, which libuv sets by default on Unix platforms for the sockets Node creates. Go's standard library does the same. Which means the usual Node or Go server is not blocked by `TIME_WAIT` at all: if the bind fails, something is genuinely listening."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Where TIME_WAIT can still bite",
      "x": "Code that creates raw sockets by hand, including plenty of Python scripts, often forgets `SO_REUSEADDR`. In Python, set `sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)` before `bind`, which is exactly what `socketserver.TCPServer` does when you set `allow_reuse_address = True`. Windows differs again: `SO_REUSEADDR` there allows a second process to hijack the port, so libuv uses exclusive addressing instead, and the semantics you read about on Linux do not transfer."
    },
    {
      "t": "p",
      "x": "Check the state rather than guessing at it. If `ss -tan | grep :3000` shows `LISTEN`, a process owns the port right now. If it shows only `TIME_WAIT` rows, you are looking at closed connections, and your bind is failing for a different reason."
    },
    {
      "t": "h2",
      "x": "Same port, different address"
    },
    {
      "t": "p",
      "x": "A port is not bound on its own. It is bound against an address, and two listeners can share a port number as long as their addresses do not overlap. This is why `lsof -i :3000` sometimes shows a process and your bind still succeeds, or shows nothing obvious and your bind still fails."
    },
    {
      "t": "table",
      "head": [
        "Existing listener",
        "New bind request",
        "Result"
      ],
      "rows": [
        [
          "`127.0.0.1:3000`",
          "`0.0.0.0:3000`",
          "Conflict. The wildcard address includes loopback."
        ],
        [
          "`0.0.0.0:3000`",
          "`127.0.0.1:3000`",
          "Usually a conflict, though `SO_REUSEADDR` makes the exact behavior platform dependent."
        ],
        [
          "`127.0.0.1:3000`",
          "`192.168.1.10:3000`",
          "No conflict. Different addresses, same port number."
        ],
        [
          "`[::]:3000`",
          "`0.0.0.0:3000`",
          "Conflict on most systems, because a dual-stack IPv6 listener also accepts IPv4 traffic."
        ]
      ],
      "caption": "Node binds `::` when you call `listen(3000)` with no host and IPv6 is available, which is why the error text reads `:::3000` rather than `0.0.0.0:3000`."
    },
    {
      "t": "p",
      "x": "Bind explicitly in development. `app.listen(3000, '127.0.0.1')` keeps the service off your local network, stops the operating system firewall from prompting on every restart, and makes the address in the error message match what you configured."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "EADDRINUSE and EACCES are different problems",
      "x": "`EACCES` on a bind usually means the port is privileged, below 1024 on Unix, and your process is not. No other process is involved. Reach for a port above 1024, a reverse proxy, or a capability such as `CAP_NET_BIND_SERVICE`, and do not go hunting for a PID that does not exist."
    },
    {
      "t": "h2",
      "x": "The same error in other runtimes"
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
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "Emitted as an `error` event on the server. Unhandled, it crashes the process."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 on Linux, 48 on macOS. Older code may raise `socket.error`."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Some JDK builds append a parenthetical such as `(Bind failed)`."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "Returned as an error from `net.Listen`, so it is easy to swallow by accident."
        ],
        [
          "ASP.NET Core",
          "`Failed to bind to address http://127.0.0.1:5000`",
          "Kestrel wraps the underlying socket error in an `IOException`."
        ]
      ],
      "caption": "Wording varies between versions and platforms. Match on the error code, not the sentence, and check your own output before scripting against it."
    },
    {
      "t": "p",
      "x": "The diagnosis does not change with the language. Something holds the address. The only question is what."
    },
    {
      "t": "h2",
      "x": "Stop it from happening again"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Handle the error instead of crashing on it",
          "x": "An unhandled `error` event on a server produces a stack trace through `node:net` internals, which tells the reader nothing. Catch `EADDRINUSE` and print the command that resolves it.",
          "code": "const server = app.listen(3000, '127.0.0.1', () => {\n  console.log('listening on http://127.0.0.1:3000');\n});\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error('Port 3000 is in use. Find the owner with:');\n    console.error('  lsof -nP -iTCP:3000 -sTCP:LISTEN');\n    process.exit(1);\n  }\n  throw err;\n});"
        },
        {
          "title": "Release the port on shutdown signals",
          "x": "Most leaked ports come from a process that never ran its cleanup. Handle `SIGINT` and `SIGTERM`, close the server, and set a timer so a stuck request cannot hold shutdown open forever. Keep-alive connections are the common reason `server.close()` appears to hang, and `closeAllConnections()` exists for that, from Node 18.2 onward.",
          "code": "function shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n  if (server.closeAllConnections) server.closeAllConnections();\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => shutdown(signal));\n}"
        },
        {
          "title": "Let the kernel pick the port in tests",
          "x": "Hard-coded ports are a reliable source of flaky integration tests, especially when suites run in parallel. Bind port 0 and read back what you were given.",
          "code": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;"
        },
        {
          "title": "Make your watcher clean up after itself",
          "x": "If a restart loop leaves orphans, the signal is not reaching the process that owns the socket. Run the server directly rather than through a shell wrapper, so signals land on your process instead of on `sh -c`, and in Docker prefer the exec form of `CMD` for the same reason.",
          "code": "# Signals reach node directly\nCMD [\"node\", \"server.js\"]\n\n# Shell form: /bin/sh is PID 1 and may not forward SIGTERM\n# CMD node server.js"
        },
        {
          "title": "Script the lookup you keep repeating",
          "x": "A one-line shell function removes the temptation to reach for `kill -9` out of impatience. This one prints the owner and does nothing destructive.",
          "code": "# ~/.bashrc or ~/.zshrc\nonport() { lsof -nP -iTCP:\"$1\" -sTCP:LISTEN; }\n\n# usage\nonport 3000"
        }
      ]
    },
    {
      "t": "p",
      "x": "Two habits cover nearly every case. Look up the owner before changing anything, and make your own processes exit cleanly so there is nothing to look up next time."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Trace a container that stops as soon as it starts, using logs and exit codes.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Check each network layer in order when a database refuses your connection.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node cannot find module",
          "desc": "Why module resolution fails, and how ESM and CommonJS differ.",
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
          "a": "Look it up, then signal it. On macOS or Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` gives you the PID in the second column; run `kill <pid>`, and use `kill -9 <pid>` only if the process ignores the first signal. On Windows, `netstat -ano | findstr :3000` gives the PID in the last column, and `taskkill /PID <pid> /F` ends it. Read the process name first. The port might belong to something you want to keep."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is running?",
          "a": "Something is running, it is just not where you are looking. The most common cause is a child process that inherited the listening socket and outlived its parent, which you can find with `ps -eo pid,ppid,command | grep node` and a look for a parent PID of 1. Other regulars: a published Docker port held by `docker-proxy`, a second terminal tab you forgot about, a WSL or VM port forward, and on macOS a system service such as AirPlay Receiver on port 5000."
        },
        {
          "q": "Should I just change the port instead?",
          "a": "For a one-off local clash with a service you do not control, yes, that is the pragmatic fix. For a port your own app leaks after every crash, no. Changing it hides a process-management bug that will keep producing orphaned processes, each one holding memory and database connections you are no longer aware of."
        },
        {
          "q": "How long do I have to wait before a port is free?",
          "a": "If the owning process has truly exited and released its descriptors, the listening port is available immediately. There is no mandatory cooldown for a listener. The advice to wait a minute comes from `TIME_WAIT` on closed connections, which does not block binding for servers that set `SO_REUSEADDR`, and Node and Go both do that on Unix. If waiting appears to help, what usually happened is that a slow process finally finished exiting."
        },
        {
          "q": "Why is port 5000 already in use on my Mac?",
          "a": "On recent macOS versions, AirPlay Receiver listens on port 5000, and port 7000 is also commonly taken by system services. `lsof` reports the owner as `ControlCe`. Disable AirPlay Receiver in System Settings under General, then Sharing, or run your app on a different port. Killing the process is not useful, since it restarts and you lose Control Center functionality in the meantime."
        },
        {
          "q": "Is npx kill-port safe to use?",
          "a": "It does what you would do by hand: find the PID bound to the port and signal it, typically with `SIGKILL`. The risk is not the tool, it is the missing step. You never see what you killed, so a mistyped port number silently takes down a database or an unrelated service. For local dev work it is fine. On a shared or production machine, look first."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-11",
  "updated": "2026-11-11",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
