module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Busy Port",
  "h1": "Port already in use: diagnosing EADDRINUSE",
  "eyebrow": "Troubleshooting",
  "description": "Your server says EADDRINUSE. Here is how to find the process holding the port on Linux, macOS and Windows, and why it keeps surviving a crash.",
  "standfirst": "One listener per address and port. Find the PID, ask it to stop, and keep kill -9 for the process that ignores you.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "find process using port"
  ],
  "cardDesc": "Find the PID holding a port, stop it cleanly, and fix the dev loop that keeps leaving orphans behind.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is not a bug in your code. Something else already holds that address and port, and until it lets go, nothing you change in your app will help.",
        "Identify the owner before killing anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `ss -ltnp 'sport = :3000'` on Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash, the usual cause is a surviving child process rather than a lingering socket. Node, Go and Python's `HTTPServer` all set `SO_REUSEADDR`, so `TIME_WAIT` almost never blocks a restart.",
        "Send `SIGTERM` first. `kill -9` frees the port just as fast but skips every cleanup handler the process has, which is how you end up with stale lock files and half-written state."
      ]
    },
    {
      "t": "h2",
      "x": "What the error is actually telling you"
    },
    {
      "t": "p",
      "x": "Your process asked the kernel for an address and port. The kernel checked its table of bound sockets and said no. That is the entire failure. So the useful question is never \"why did bind fail\", it is \"who has it, and why is that thing still running?\""
    },
    {
      "t": "p",
      "x": "The wording differs by runtime, but the underlying errno is the same one in every case."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net)\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# nginx\nnginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)\n\n# Docker, host side (the text around this line changes between releases)\nBind for 0.0.0.0:8080 failed: port is already allocated\n\n# Windows sockets\nOnly one usage of each socket address (protocol/network address/port) is normally permitted"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "The number in front changes by platform",
      "x": "`EADDRINUSE` is errno 98 on Linux and 48 on macOS and the BSDs, and Winsock reports it as `WSAEADDRINUSE` (10048). Node prints the negated value, which is why `-98` shows up above on Linux and `-48` on a Mac. Match on the `code` string, never on the number."
    },
    {
      "t": "p",
      "x": "Note the address in the Node message. `:::3000` means the wildcard IPv6 address, which is what you get from a bare `server.listen(3000)`. That detail matters later, because a wildcard bind collides with more than it looks like it should."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "p",
      "x": "Pick the row for your platform. Each command answers one question: which PID owns the listening socket on that port?"
    },
    {
      "t": "table",
      "head": [
        "Platform",
        "Who is listening on 3000",
        "Stop it"
      ],
      "rows": [
        [
          "Linux",
          "`ss -ltnp 'sport = :3000'`",
          "`kill <pid>`, or `fuser -k -TERM 3000/tcp`"
        ],
        [
          "macOS",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`kill <pid>`"
        ],
        [
          "Windows, cmd",
          "`netstat -ano | findstr \":3000\"`",
          "`taskkill /PID <pid>`, add `/F` to force"
        ],
        [
          "Windows, PowerShell",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`",
          "`Stop-Process -Id <pid>`"
        ],
        [
          "Docker host",
          "`docker ps --format '{{.Names}}\\t{{.Ports}}'`",
          "`docker stop <name>`"
        ]
      ],
      "caption": "Swap 3000 for your port. On Linux, ss only shows process names for your own processes unless you run it with sudo."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "$ lsof -nP -iTCP:3000 -sTCP:LISTEN\nCOMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nnode    48213   sam   24u  IPv6 0x9f2a      0t0  TCP *:3000 (LISTEN)\n\n$ ss -ltnp 'sport = :3000'\nState  Recv-Q Send-Q Local Address:Port Peer Address:Port Process\nLISTEN 0      511              *:3000            *:*     users:((\"node\",pid=48213,fd=24))"
    },
    {
      "t": "p",
      "x": "Those flags are worth learning rather than copying. `-n` skips reverse DNS and `-P` skips port name lookup, so the command returns at once instead of hanging on a slow resolver. `-sTCP:LISTEN` is the important one: without it, `lsof` reports every socket with 3000 at either end, including the outbound connections your browser and your editor's language server have made to your own dev server."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The one-liner everyone pastes is sharper than it looks",
      "x": "`kill -9 $(lsof -ti:3000)` has no `-sTCP:LISTEN` filter, so on a busy machine it can hand SIGKILL to your browser, your terminal multiplexer or a database client that merely has a connection involving port 3000. Add the filter: `kill $(lsof -t -nP -iTCP:3000 -sTCP:LISTEN)`. Then look at the output before you pipe it anywhere."
    },
    {
      "t": "h2",
      "x": "Stop it cleanly"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the PID is what you expect",
          "x": "Check the command line and the parent before you kill. A PID that looks like your dev server and is actually your package manager, or your IDE, is a bad thing to SIGKILL blind.",
          "code": "ps -o pid,ppid,pgid,etime,command -p 48213"
        },
        {
          "title": "Ask it to exit",
          "x": "Plain `kill` sends SIGTERM. A well behaved server closes its listener, drains in-flight requests and exits, which releases the port in well under a second.",
          "code": "kill 48213"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "SIGKILL cannot be caught, so cleanup handlers never run. Use it when SIGTERM has clearly been ignored, and expect to tidy up after it.",
          "code": "kill -9 48213"
        },
        {
          "title": "If the whole tree needs to go, kill the group",
          "x": "A negative argument targets a process group. This is the reliable way to clear a `nodemon` or `concurrently` tree, where killing the parent leaves the interesting process running.",
          "code": "ps -o pid,pgid,command -p 48213   # read the PGID\nkill -TERM -48213                 # note the leading minus"
        },
        {
          "title": "If it comes straight back, you have a supervisor, not a port problem",
          "x": "Something is restarting the process for you. Check `pm2 list`, `systemctl status <unit>`, your container restart policy, and whatever your editor's run panel is holding on to.",
          "code": "pm2 list\nsystemctl --user list-units --state=running | grep -i node\ndocker ps --filter status=running"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Why it survives a crash"
    },
    {
      "t": "p",
      "x": "Here is the fact that resolves most of the confusion. When a process dies, for any reason, the kernel closes its file descriptors, and the listening socket is one of them. A genuinely dead process cannot hold a port. So if the port is held, something is still alive, and the job is to work out what."
    },
    {
      "t": "ul",
      "items": [
        "**A child outlived its parent.** `npm run dev`, shell wrapper scripts, `concurrently` and `nodemon` all spawn children. Interrupt the wrapper and the grandchild can survive, reparented to `init`. If `ps -o ppid= -p <pid>` prints `1`, you are looking at an orphan.",
        "**The crash was not a crash.** An error thrown inside a request handler kills the request, not the process. The event loop keeps turning and the socket stays bound, so your restart is really a second instance trying to start next to a first one that never left.",
        "**A supervisor did its job.** pm2, systemd, Docker with `restart: unless-stopped` and Kubernetes all exist to bring a crashed process back. From the outside, a port that frees itself and is retaken a moment later looks identical to a port that never freed.",
        "**Your editor is still running it.** VS Code tasks and the JetBrains run panel keep processes alive after you close the terminal view that started them. The process list is the source of truth, not the visible tabs.",
        "**The port was never yours.** Two services configured for 3000 in different repos, or a stale SSH tunnel with `-L 3000:...`, both produce exactly this error on a machine where you remember starting nothing."
      ]
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT answer is usually the wrong one"
    },
    {
      "t": "p",
      "x": "Search for this error and you will be told to wait sixty seconds for `TIME_WAIT` to drain. That advice is mostly obsolete, and it does real damage, because it sends you away to wait while the process that actually holds the port carries on running."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to closed connections, not to listeners. The historical problem was that a bind could be refused while old connection sockets with a matching local address lingered. `SO_REUSEADDR` fixes that, and modern server libraries set it for you: libuv does it for every Node listener on Unix, Go's `net.Listen` does it, and Python's `HTTPServer` and `ThreadingHTTPServer` set `allow_reuse_address`. A raw `socket.socket` in Python does not, and Java's `ServerSocket` leaves the default to the implementation, so an explicit call still earns its place in code that binds directly."
    },
    {
      "t": "p",
      "x": "What `SO_REUSEADDR` does not do is let you bind over a live listener. On Linux that needs `SO_REUSEPORT`, set by every socket involved, which is a deliberate load-balancing feature rather than an accident. So read the state column. A `LISTEN` row means a running process, every time. Rows that are only `TIME_WAIT` or `CLOSE_WAIT`, with no listener among them, mean the port is free to anything that sets the reuse flag."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Everything touching port 3000, with states\nss -tanp | grep ':3000'\n\n# LISTEN    0 511   *:3000         *:*             <- a live process, go find it\n# TIME_WAIT 0 0     10.0.0.4:3000  10.0.0.9:51224  <- a closed connection, harmless"
    },
    {
      "t": "h3",
      "x": "Wildcards, 127.0.0.1 and the IPv6 overlap"
    },
    {
      "t": "p",
      "x": "A bind is on an address plus a port, and the wildcard address counts as all of them. If something holds `0.0.0.0:3000`, your attempt to bind `127.0.0.1:3000` fails. The reverse also holds. Two processes can share a port number on different specific addresses, say `127.0.0.1:3000` and `192.168.1.10:3000`, which is occasionally a useful escape hatch."
    },
    {
      "t": "p",
      "x": "IPv6 adds a wrinkle. A socket bound to `::` with `IPV6_V6ONLY` disabled, the default on Linux, also serves IPv4 traffic and so occupies the IPv4 port too. That is why a Node process showing `*:3000` blocks a Python service that only ever asked for `0.0.0.0:3000`."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Two platform-specific traps",
      "x": "On macOS, the AirPlay Receiver has listened on ports 5000 and 7000 since Monterey, which is why Flask's default port stopped working for a lot of people; turn it off in System Settings or move your app. On Windows, Hyper-V and WSL reserve dynamic port ranges, and binding inside one of them usually produces `EACCES` rather than `EADDRINUSE`. Check with `netsh interface ipv4 show excludedportrange protocol=tcp`."
    },
    {
      "t": "h2",
      "x": "Containers have their own port table"
    },
    {
      "t": "p",
      "x": "With `-p 8080:80`, the contended resource is the host side. Docker refuses the publish and reports that the port is already allocated, which is the same condition surfaced by a different component. Three checks cover nearly all of it:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "docker ps -a --format '{{.Names}}\\t{{.Status}}\\t{{.Ports}}'\ndocker compose ls                        # a stack from another project, still up\nsudo lsof -nP -iTCP:8080 -sTCP:LISTEN    # often docker-proxy, with the container nearby"
    },
    {
      "t": "p",
      "x": "If `lsof` shows `docker-proxy` but no container claims the port, you are looking at state the daemon failed to clean up after a hard kill. Removing the stopped container normally clears it. Restarting the daemon is the blunt fallback, and it should be rare enough that needing it twice in a week is itself worth investigating. Inside a container the network namespace is its own, so an in-container `EADDRINUSE` means two processes in that container, which is usually an entrypoint starting the app twice. Our notes on [containers that exit immediately](/guides/docker-container-exits-immediately/) cover the neighbouring failure, where nothing binds at all."
    },
    {
      "t": "h2",
      "x": "Stop the dev loop from doing it again"
    },
    {
      "t": "p",
      "x": "Two small changes remove most repeat occurrences. First, handle the signals, so Ctrl-C closes the listener instead of leaving your framework to decide. Second, report the failure the way a person would say it, because a raw stack trace tells a new team member nothing useful."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(3000);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${err.port} is taken. Try: lsof -nP -iTCP:${err.port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing listener`);\n  server.close(() => process.exit(0));\n  // Keep-alive sockets will hold the server open without this.\n  server.closeIdleConnections?.();\n  // Last resort, so one stuck request cannot keep the port forever.\n  setTimeout(() => process.exit(1), 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "`closeIdleConnections()` and `closeAllConnections()` arrived in Node 18.2, so every currently supported release has them as of November 2026; the optional call above keeps the code working anywhere, and `node -v` settles it for your environment. Without one of them, `server.close()` waits on keep-alive connections that may never go away by themselves, and your graceful shutdown hangs until the timeout fires."
    },
    {
      "t": "p",
      "x": "For tests, stop hard-coding the port at all. Passing `0` asks the kernel for a free one, which also lets your suite run in parallel and in CI without colliding with the dev server you left running on your laptop."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0);\nconst { port } = server.address();\nconst res = await fetch(`http://127.0.0.1:${port}/health`);\n// ... assertions ...\nawait new Promise((resolve) => server.close(resolve));"
    },
    {
      "t": "p",
      "x": "You will also see a `predev` script that force-frees the port before starting. It works. It is also a loaded gun pointed at whatever else happens to be on that port, so if you add one, scope it to the listener and let it fail quietly."
    },
    {
      "t": "code",
      "lang": "json",
      "x": "{\n  \"scripts\": {\n    \"predev\": \"fuser -k -TERM 3000/tcp || true\",\n    \"dev\": \"node server.js\"\n  }\n}"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Not on a shared or production host",
      "x": "Automatic port-freeing scripts belong on a laptop. On a shared build agent, or any server, a hook that kills by port will eventually kill someone else's job, and the failure will get reported as something else entirely. Put a port check in your start script instead and let a human decide."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, list the listener with `lsof -nP -iTCP:3000 -sTCP:LISTEN`, read the `COMMAND` column to be sure, then `kill <pid>`. Use `kill -9` only if that is ignored. On Windows, `netstat -ano | findstr \":3000\"` puts the PID in the last column and `taskkill /PID <pid> /F` ends it."
        },
        {
          "q": "Why do I get EADDRINUSE after my app crashed?",
          "a": "Because something did not crash. The kernel closes a dead process's sockets automatically, so a held port means a live process: usually a child that outlived the parent you interrupted, a supervisor such as pm2 or Docker restarting the app, or an error that killed one request while the server kept running. Check `ps -o pid,ppid,command` and see whether the PPID is 1."
        },
        {
          "q": "Do I have to wait for TIME_WAIT to expire before restarting?",
          "a": "Almost never. `SO_REUSEADDR` lets a new listener bind over lingering connection sockets, and Node, Go and Python's `HTTPServer` set it by default. If `ss -tanp | grep :3000` shows a `LISTEN` row, the port is held by a running process and no amount of waiting will help. If it shows only `TIME_WAIT` rows, a normal server will bind straight away."
        },
        {
          "q": "Why does lsof show nothing but the port is still in use?",
          "a": "Four common reasons. The owning process belongs to another user, so you need `sudo`. The socket lives in a container or another network namespace, where the host's `lsof` cannot see it. You are on Windows, where a range reserved by Hyper-V or WSL reports `EACCES` instead. Or the port is bound on a specific address you did not search for. Run `sudo ss -ltnp` with no filter and read the whole list."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on a port?",
          "a": "`EADDRINUSE` means the address and port are taken. `EACCES` means you are not allowed to bind them: on Linux and macOS that is typically a port below 1024 without root or the `CAP_NET_BIND_SERVICE` capability, and on Windows it is usually a reserved dynamic range. Different errno, different fix, so read the code rather than the headline."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, in two specific ways. They can bind different specific addresses, such as `127.0.0.1:3000` and `192.168.1.10:3000`. Or every socket involved can set `SO_REUSEPORT`, which is how Node's cluster module and nginx spread incoming connections across workers. What you cannot do is bind over an existing listener by accident, and that protection is what produced your error."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The opposite symptom: nothing binds, because the process is already gone.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Nothing listening, rather than too much listening. Check each layer in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "The other error that greets you two seconds into a restart.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-03",
  "updated": "2026-11-03",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
