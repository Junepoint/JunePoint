module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Port already in use: diagnosing EADDRINUSE",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens, how to find the process holding a port on macOS, Linux and Windows, and why the port stays busy after a crash.",
  "standfirst": "The commands that identify what is holding your port, the safe order to kill it in, and the reasons a dead server keeps its socket.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Identify the process on a busy port, kill it safely, and stop it happening again.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means another process already holds a listening socket on that address and port. Your code is not the problem yet.",
        "Identify before you kill: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "After a crash, the usual culprit is an orphaned child process, not the TCP `TIME_WAIT` state. Node sets `SO_REUSEADDR` for you.",
        "A published Docker container holds the host port even when the app inside it is dead.",
        "Handle `SIGINT` and `SIGTERM` and call `server.close()`. Most repeat offences are missing shutdown code."
      ]
    },
    {
      "t": "lede",
      "x": "The port is not broken, and your application code is probably fine. Something else is already listening there, and nine times out of ten that something is an earlier copy of your own server that did not exit when you thought it did. The work is identification, not repair."
    },
    {
      "t": "h2",
      "x": "What the error actually says"
    },
    {
      "t": "p",
      "x": "Every runtime reports the same underlying `bind(2)` failure in its own dialect. Learning to recognise it across languages saves time, because the fix is identical in all of them."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node.js\nError: listen EADDRINUSE: address already in use :::3000\n\n# Python, on Linux\nOSError: [Errno 98] Address already in use\n\n# Python, on macOS\nOSError: [Errno 48] Address already in use\n\n# Java / Spring Boot\njava.net.BindException: Address already in use\n\n# Docker\nError response from daemon: driver failed programming external connectivity\non endpoint web: Bind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Read the address part carefully, because it narrows the search. `:::3000` is the IPv6 wildcard, which on most systems also covers IPv4 through dual-stack binding. `127.0.0.1:3000` is loopback only, and a process bound there will not conflict with one bound to a specific LAN address. If your error names `0.0.0.0` or `:::`, any listener on that port anywhere on the machine is a candidate. If it names a single IP, you can rule out listeners on other interfaces immediately."
    },
    {
      "t": "h2",
      "x": "Find the process holding the port"
    },
    {
      "t": "p",
      "x": "Start with the listener, and only the listener. The common one-liners that pipe every match straight into `kill` are the reason people end up killing their browser or their SSH session, because a port filter matches both ends of a connection."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: who is LISTENING on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Older systems\nnetstat -ltnp | grep ':3000 '\n\n# Just the PID, for scripting\nlsof -t -nP -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter is the important flag. Without it, `lsof -i :3000` also returns established connections, including outbound ones that happen to have picked 3000 as an ephemeral source port. On Linux, `ss -p` and `netstat -p` only show the owning process for sockets you own, so prefix with `sudo` if the PID column comes back empty."
    },
    {
      "t": "p",
      "x": "On Windows the equivalents live in PowerShell, and the older `netstat` form still works in `cmd.exe`."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: the listening socket and its owner\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Resolve that PID to a name before doing anything to it\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe equivalent\nnetstat -ano | findstr \":3000\"\ntasklist /FI \"PID eq 12345\""
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Check the name, not just the PID",
      "x": "`lsof -t -i:3000 | xargs kill -9` is the most copy-pasted answer to this problem and the most dangerous one. It can match client sockets as well as the listener, and it gives you no chance to notice that the PID belongs to Docker, to a system daemon, or to an editor's language server. Look at the `COMMAND` column first. It costs you two seconds."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask politely first",
          "x": "A plain `kill` sends `SIGTERM`, which lets the process run its shutdown handlers, flush logs and close database connections. Give it a second or two before escalating.",
          "code": "kill 12345\nsleep 2\nlsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught or deferred, so the process gets no chance to clean up temp files, lock files or child processes. Use it when `SIGTERM` has demonstrably failed, not as the opening move.",
          "code": "kill -9 12345"
        },
        {
          "title": "Look for survivors",
          "x": "Killing a supervisor such as `npm`, `nodemon` or `concurrently` frequently leaves the real server running and still holding the socket. Search by command line rather than by port.",
          "code": "pgrep -af 'node|next|vite|nodemon'\npkill -f 'node .*server.js'"
        },
        {
          "title": "Confirm the port is free",
          "x": "An empty result from the listener query is the only acceptable proof. Restarting the app and seeing no error is weaker evidence, because your framework may have silently fallen back to a different port.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo 'port 3000 is free'"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Ports below 1024 are a different question",
      "x": "If the PID on port 80 or 443 belongs to `nginx`, `apache2`, `caddy` or `systemd`, killing it takes down a service that something else is managing, and the service manager may restart it underneath you anyway. Stop it through its supervisor instead, with `sudo systemctl stop nginx` or the equivalent. Never `sudo kill -9` a PID you cannot name."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "h3",
      "x": "The parent died and the child did not"
    },
    {
      "t": "p",
      "x": "This is the leading cause and it is almost invisible. When you run `npm run dev`, your shell starts `npm`, `npm` starts a shell, and that shell starts `node`. Ctrl+C sends `SIGINT` to the whole foreground process group, which usually works. Closing the terminal window, disconnecting from SSH, or killing the outer `npm` process by PID does not reliably reach the grandchild. The `node` process is reparented, keeps running, and keeps its listening socket. Nothing in your terminal tells you this happened."
    },
    {
      "t": "p",
      "x": "Watchers make it worse. A file watcher that respawns the server on change can leave the previous instance alive if the restart logic is racing a crash, which is why `EADDRINUSE` so often appears immediately after a syntax error that took the app down mid-reload."
    },
    {
      "t": "h3",
      "x": "A container is still publishing the port"
    },
    {
      "t": "p",
      "x": "Docker's port publishing is owned by the daemon, not by the process inside the container. A container that is restarting in a crash loop, or one that is stopped but whose network cleanup has not completed, can keep the host binding. The giveaway is a `docker-proxy` process in your `lsof` output, or an error that mentions `port is already allocated` rather than `EADDRINUSE`."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Which container claims the host port?\ndocker ps -a --filter publish=3000\n\n# Bring the whole project down, including its network\ndocker compose down\n\n# Last resort when the daemon's state is stale\nsudo systemctl restart docker"
    },
    {
      "t": "h3",
      "x": "Something else owns the port legitimately"
    },
    {
      "t": "p",
      "x": "Not every collision is your fault. On macOS Monterey and later, the AirPlay Receiver feature listens on ports 5000 and 7000, which collides with the Flask and Rails defaults that a generation of tutorials tells you to use. The owning process shows up as `ControlCenter`, and killing it is pointless because the system restarts it. Turn the feature off in System Settings, or change your port. Apple has moved the exact menu path between releases, so search the settings app for \"AirPlay Receiver\" rather than following a fixed click path."
    },
    {
      "t": "p",
      "x": "On Windows, the Hyper-V and WSL stack reserves blocks of dynamic ports at boot, and a reserved range can swallow a port you used yesterday without warning. `netsh interface ipv4 show excludedportrange protocol=tcp` lists the ranges. Under WSL2, localhost forwarding means a listener on the Windows side and one inside your distro can conflict with each other, so check both."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT is usually not your problem"
    },
    {
      "t": "p",
      "x": "The most repeated explanation for `EADDRINUSE` is that the socket is stuck in `TIME_WAIT` and you simply have to wait it out. For a modern Node, Python or Go server this is almost always wrong, and believing it costs you the minute you should have spent finding the orphaned process."
    },
    {
      "t": "p",
      "x": "Here is what is actually going on. `TIME_WAIT` applies to a closed connection's four-tuple, not to the listening socket. It exists so that delayed packets from an old connection cannot be misread as belonging to a new one with the same addresses and ports. Rebinding a listener while old connections linger in `TIME_WAIT` is blocked by default, which is why the `SO_REUSEADDR` socket option exists. libuv, which underpins Node, sets `SO_REUSEADDR` on listening sockets, and Python's `socketserver` and most web frameworks do the same. So the classic symptom of \"wait sixty seconds and it clears\" points somewhere else: a process that was slow to exit, or a supervisor that restarted it."
    },
    {
      "t": "p",
      "x": "Check the state column instead of guessing. If you see `LISTEN`, a live process owns the port. If you see only `TIME_WAIT` entries and the bind still fails, then you have a genuine `SO_REUSEADDR` question, and on Windows an additional wrinkle: Windows gives `SO_REUSEADDR` different semantics that allow one process to steal another's binding, so Windows servers typically use `SO_EXCLUSIVEADDRUSE` and behave less forgivingly."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Every socket on 3000, with its TCP state\nss -tanp 'sport = :3000 or dport = :3000'\n\n# LISTEN  0  511  *:3000  *:*   users:((\"node\",pid=12345,fd=20))\n#   ^ a live process owns the port\n\n# TIME-WAIT  0  0  10.0.0.5:3000  10.0.0.9:51234\n#   ^ a finished connection, harmless to a listener that sets SO_REUSEADDR"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "The 60-second number and the flag that does not change it",
      "x": "On Linux the `TIME_WAIT` duration is compiled into the kernel and is not adjustable at runtime. `net.ipv4.tcp_fin_timeout` is widely recommended as the way to shorten it, and it does not do that at all: it controls the `FIN_WAIT_2` state. Changing it will not fix a bind failure."
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Two small pieces of code remove most repeat occurrences. The first is a shutdown handler, so your server actually releases the socket when asked. The second is an explicit `EADDRINUSE` branch, so the next failure tells you what to do instead of dumping a stack trace."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const PORT = Number(process.env.PORT) || 3000;\nconst server = app.listen(PORT, () => console.log(`listening on ${PORT}`));\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${PORT} is already in use. Free it or set PORT.`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n  // Added in Node 18.2: keep-alive sockets otherwise hold the port open\n  server.closeIdleConnections?.();\n  // Do not hang forever if a request refuses to finish\n  setTimeout(() => process.exit(1), 5000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "`server.close()` alone is not always enough, and this surprises people. It stops the server accepting new connections but waits for existing ones to end, and an HTTP keep-alive connection from an open browser tab can stay open for as long as the client wants. That is why the process appears to hang on Ctrl+C, and why the port is still held when you try to restart. The `closeIdleConnections` call handles the common case; the timeout handles the rest."
    },
    {
      "t": "p",
      "x": "For tests, stop fighting over fixed ports entirely. Binding to port `0` asks the operating system for any free ephemeral port, and you read back the real number afterwards. Parallel test runners stop colliding, and CI stops failing intermittently on a busy build agent."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on http://127.0.0.1:${port}`);\n});"
    },
    {
      "t": "table",
      "head": [
        "Task",
        "macOS / Linux",
        "Windows (PowerShell)"
      ],
      "rows": [
        [
          "Find the listener",
          "`lsof -nP -iTCP:3000 -sTCP:LISTEN`",
          "`Get-NetTCPConnection -LocalPort 3000 -State Listen`"
        ],
        [
          "Name the process",
          "`ps -p 12345 -o comm=`",
          "`Get-Process -Id 12345`"
        ],
        [
          "Graceful stop",
          "`kill 12345`",
          "`Stop-Process -Id 12345`"
        ],
        [
          "Forced stop",
          "`kill -9 12345`",
          "`Stop-Process -Id 12345 -Force`"
        ],
        [
          "Find orphaned children",
          "`pgrep -af node`",
          "`Get-Process node`"
        ],
        [
          "See reserved ranges",
          "`cat /proc/sys/net/ipv4/ip_local_port_range`",
          "`netsh interface ipv4 show excludedportrange protocol=tcp`"
        ]
      ],
      "caption": "Equivalent commands per platform. Replace 3000 and 12345 with your port and PID."
    },
    {
      "t": "h2",
      "x": "A short checklist"
    },
    {
      "t": "ol",
      "items": [
        "Read the error and note the exact address, not just the port number.",
        "List listeners on that port and read the command name.",
        "If it is your own server, `kill` it, wait, and verify.",
        "If nothing is listening, look for `docker-proxy`, a container in a restart loop, or a Windows reserved port range.",
        "If it is a system service, stop it through its service manager or move your app to another port.",
        "Add a shutdown handler so the next crash does not leave an orphan behind."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process using port 3000?",
          "a": "Find it with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, check the `COMMAND` and `PID` columns, then run `kill <pid>`. Escalate to `kill -9 <pid>` only if the process is still listening a couple of seconds later. On Windows, `Get-NetTCPConnection -LocalPort 3000 -State Listen` gives you the owning PID and `Stop-Process -Id <pid>` ends it."
        },
        {
          "q": "Why does port 3000 stay in use after I press Ctrl+C?",
          "a": "Usually because the process you killed was not the one holding the socket. Running through `npm run dev` or a watcher puts one or two wrapper processes between your shell and the actual server, and the server can survive its parent. Run `pgrep -af node` to see what is still alive. A second common cause is a `server.close()` that is waiting on an open keep-alive connection from a browser tab."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "It is safe for the machine, but not for the process. `SIGKILL` cannot be caught, so the application gets no chance to flush buffers, close database connections, remove lock files or reap its own children. Try plain `kill` first. Reserve `-9` for something that has already ignored a `SIGTERM`, and never aim it at a PID whose name you have not checked."
        },
        {
          "q": "How long does a port stay in TIME_WAIT?",
          "a": "On Linux it is 60 seconds and is fixed at kernel compile time, so no sysctl will shorten it. `net.ipv4.tcp_fin_timeout` is frequently recommended for this and controls a different state entirely. In practice `TIME_WAIT` rarely causes `EADDRINUSE` for a server, because listening sockets in Node, Python and Go are created with `SO_REUSEADDR`."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, on Linux 3.9 and later, if both set the `SO_REUSEPORT` option before binding, which distributes incoming connections between them. It has to be deliberate on both sides, so it will not happen by accident, and the BSD and macOS versions of the option behave differently. Node's `cluster` module does not use it by default on Linux or macOS: the primary process accepts connections and hands them to workers."
        },
        {
          "q": "Why do I only get EADDRINUSE inside Docker?",
          "a": "Because the host port binding belongs to the Docker daemon rather than to the container's process. A stopped or crash-looping container can still hold it, and you will see `docker-proxy` in your `lsof` output. Run `docker ps -a --filter publish=3000` to identify it, then `docker compose down` to release the binding along with the network. Also check that two services in your compose file are not publishing the same host port."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker Container Exits Immediately",
          "desc": "Why containers die on startup, and how to read the exit code.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL \"Connection Refused\"",
          "desc": "The opposite failure: nothing is listening where you expected.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How Node resolves modules and where resolution breaks down.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-16",
  "updated": "2026-09-16",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
