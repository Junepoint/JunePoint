module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process Holding a Port",
  "h1": "Port already in use: finding what is holding it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE explained: identify the process holding a port on macOS, Linux and Windows, kill it safely, and fix the orphan that caused it.",
  "standfirst": "The kernel is not confused and the port is not broken. Something is still listening, usually a process you started. Here is how to name it, stop it, and stop it coming back.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Name the process holding a port, kill it without collateral damage, and fix the orphan that caused it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Name the process before you kill it. `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `sudo ss -ltnp 'sport = :3000'` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "`EADDRINUSE` means a socket already holds that address and port. The usual culprit is your own previous run, a sibling dev server, or a container still publishing the port.",
        "After a crash the holder is almost never the kernel. It is an orphaned child process whose parent died first, and it shows up with a parent PID of 1.",
        "A Node HTTP server that has called `close()` still holds the port until keep-alive connections drain. `server.closeAllConnections()` (Node 18.2.0 and later) ends that wait.",
        "On recent macOS, ports 5000 and 7000 are claimed by AirPlay Receiver. Killing the process achieves nothing, because the service restarts it. Turn the feature off or move your app."
      ]
    },
    {
      "t": "lede",
      "x": "There is exactly one question to answer: which process already owns that address? Everything else follows from the answer. A dev server you forgot about gets a `SIGTERM` and you move on; a Postgres instance or a VPN helper means you picked the wrong port; a listener with no visible owner means you are looking at a reserved range or a container proxy rather than a process at all."
    },
    {
      "t": "h2",
      "x": "Find the owner before you kill anything"
    },
    {
      "t": "p",
      "x": "Every platform has a one-liner. Each gives you a PID and enough context to tell a stale build apart from something load-bearing. Run it before you run anything destructive, because the cost of looking is about two seconds and the cost of not looking is occasionally your database."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux\nlsof -i :3000                        # everything touching port 3000\nlsof -nP -iTCP:3000 -sTCP:LISTEN     # numeric output, listeners only\n\n# Linux without lsof\nsudo ss -ltnp 'sport = :3000'        # the process column needs root\nsudo netstat -tlnp | grep ':3000'    # older boxes\n\n# Linux: who has the file descriptor, per cgroup\nsudo fuser -v 3000/tcp\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 48213\"\n\n# Windows, PowerShell\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess"
    },
    {
      "t": "p",
      "x": "Plain `lsof -i :3000` matches more than you want. It lists UDP sockets, established inbound connections and any outbound connection whose *remote* port happens to be 3000. The `-sTCP:LISTEN` filter is what you want when the question is specifically who is bound. Add `-nP` so lsof stops resolving hostnames and service names, which is both faster and easier to read."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The one-liner people actually use",
      "x": "`kill $(lsof -ti tcp:3000)` works because `-t` prints bare PIDs. It is also indiscriminate: it will happily kill a process that merely has a client connection to port 3000 somewhere. In a script, use `lsof -ti tcp:3000 -sTCP:LISTEN` instead."
    },
    {
      "t": "h2",
      "x": "The error names the address, and that narrows things"
    },
    {
      "t": "p",
      "x": "Read the address in the message rather than just the port number. A bind to one specific interface and a bind to the wildcard are different conflicts with different fixes, and the error text tells you which one you hit."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net)\n  code: 'EADDRINUSE', syscall: 'listen', address: '::', port: 3000\n\n# Python\nOSError: [Errno 98] Address already in use\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Docker\nError response from daemon: driver failed programming external connectivity on\nendpoint web: Bind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "p",
      "x": "Those numbers come from the C library, not from the runtime, so they differ by platform: Node reports `errno: -98` on Linux and `errno: -48` on macOS for the identical condition. Python prints `[Errno 98]` on Linux and `[Errno 48]` on macOS. Do not match on the number. Match on `EADDRINUSE`, which is stable everywhere."
    },
    {
      "t": "table",
      "head": [
        "Address in the error",
        "What it covers",
        "Conflicts with"
      ],
      "rows": [
        [
          "`:::3000`",
          "The IPv6 wildcard, which on most systems also accepts IPv4 through a dual-stack socket",
          "Any bind to port 3000 on any address"
        ],
        [
          "`0.0.0.0:3000`",
          "Every IPv4 address on the host",
          "Any IPv4 bind on 3000, wildcard or specific"
        ],
        [
          "`127.0.0.1:3000`",
          "Loopback only, unreachable from other machines",
          "Another loopback bind on 3000, or a wildcard bind"
        ],
        [
          "`192.168.1.20:3000`",
          "One interface address",
          "A wildcard bind, or the same address again"
        ]
      ],
      "caption": "Two servers can share a port number as long as their addresses do not overlap. That is why 127.0.0.1:3000 and 127.0.0.2:3000 can both listen, and why a wildcard bind blocks both."
    },
    {
      "t": "p",
      "x": "This explains a confusing case. Your container maps `127.0.0.1:3000` and starts fine, then a second container asking for `0.0.0.0:3000` fails, and the reverse order works. The wildcard is the greedy one. If you want several things on one port number during development, bind each to its own loopback address and put the port conflict out of reach."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EACCES is a different error",
      "x": "`listen EACCES: permission denied 0.0.0.0:80` is not a conflict. Ports below 1024 are privileged, so an unprivileged process cannot bind them at all. On Linux, grant `CAP_NET_BIND_SERVICE` or lower `net.ipv4.ip_unprivileged_port_start`. In development, a port above 1024 plus a reverse proxy is simpler."
    },
    {
      "t": "h2",
      "x": "Why the port stays busy after a crash"
    },
    {
      "t": "p",
      "x": "When a process dies, for any reason including `SIGKILL`, the kernel closes its file descriptors. The listening socket goes with them. So if a port is still held after the crash, something is still alive and holding it. There are four candidates, roughly in order of how often they are the answer."
    },
    {
      "t": "h3",
      "x": "1. An orphaned child is still listening"
    },
    {
      "t": "p",
      "x": "This is the big one. `npm run dev` is a shell wrapper around a script that spawns your actual server, so there are two or three processes in a chain. Pressing Ctrl+C in the terminal signals the whole foreground process group and usually works cleanly. Closing the terminal pane, killing the editor, or `kill -9` on the wrapper does not. The parent dies, the real server is reparented to PID 1, and it carries on serving an old build from a process nobody can see."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is it, and who was its parent?\nps -o pid,ppid,stat,etime,command -p $(lsof -ti tcp:3000 -sTCP:LISTEN)\n\n#   PID  PPID STAT     ELAPSED COMMAND\n# 48213     1 S       02:14:09 node /app/dist/server.js\n#          ^^^ reparented: its parent is gone\n\n# Find every stray copy by command line, not by port\npgrep -af 'node .*dist/server.js'"
    },
    {
      "t": "p",
      "x": "A `PPID` of 1 and a long `ELAPSED` together are conclusive. That process has outlived whatever started it, which is why your new run cannot have the port."
    },
    {
      "t": "h3",
      "x": "2. The previous server is shutting down, slowly"
    },
    {
      "t": "p",
      "x": "Node's `server.close()` stops accepting new connections and then waits for existing ones to finish. Keep-alive is the problem. An open browser tab holds an idle socket, that socket counts as an existing connection, and the process sits there holding the port until the keep-alive timeout expires. From the outside it looks like a hung shutdown. It is a correct, patient shutdown with no deadline."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(3000);\n\nasync function shutdown(signal) {\n  console.log(`${signal} received, closing`);\n  server.close(() => process.exit(0));\n  // Node >= 18.2.0: do not wait on idle keep-alive sockets\n  server.closeIdleConnections();\n  // Still hanging after the grace period? Stop being polite.\n  setTimeout(() => {\n    server.closeAllConnections();\n    process.exit(1);\n  }, 5000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "`closeIdleConnections()` and `closeAllConnections()` arrived in Node 18.2.0. On older versions you have to track sockets yourself in a `Set` on the `connection` event and destroy them by hand, which is the kind of boilerplate worth upgrading to avoid."
    },
    {
      "t": "h3",
      "x": "3. A container, or the Docker proxy, owns it"
    },
    {
      "t": "p",
      "x": "`port is already allocated` from the daemon is a different message to `EADDRINUSE` from your app, and it means the daemon's own bookkeeping, or the `docker-proxy` process it spawns, already has that binding."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "docker ps --filter publish=3000          # which container published it\ndocker ps -a --filter publish=3000       # include stopped ones\ndocker compose down                      # stop and remove, not just stop\n\n# Nothing listed, but still allocated? The daemon is holding a stale binding.\nsudo systemctl restart docker            # Linux\n# macOS and Windows: restart Docker Desktop"
    },
    {
      "t": "p",
      "x": "A daemon restart to clear a leaked binding is a real fix for a real bug class, not folklore, but it also stops every container on the host. Check `docker ps` first so you know what you are taking down."
    },
    {
      "t": "h3",
      "x": "4. The port was never yours to begin with"
    },
    {
      "t": "p",
      "x": "Some ports are quietly spoken for, and these are the cases where the port tools show you nothing useful."
    },
    {
      "t": "ul",
      "items": [
        "**macOS, ports 5000 and 7000.** AirPlay Receiver binds both on recent releases. The owner shows up as `ControlCe` or `ControlCenter` in lsof. Killing it is pointless because launchd restarts it. Turn off AirPlay Receiver in System Settings, or use a different port, which is the better habit anyway. Flask's old default of 5000 is why this bites Python developers most.",
        "**Windows reserved ranges.** Hyper-V, WSL2 and Docker Desktop reserve blocks of dynamic ports. `netstat` shows no listener and the bind still fails. Run `netsh int ipv4 show excludedportrange protocol=tcp` to see the reservations.",
        "**A service you forgot you installed.** 3306 is MySQL, 5432 is Postgres, 6379 is Redis, 8080 is half the Java ecosystem. Running the installer once years ago is enough.",
        "**A debugger.** Node's `--inspect` takes 9229 by default, so two debuggable processes collide on that rather than on your HTTP port."
      ]
    },
    {
      "t": "h2",
      "x": "A kill sequence that does not make things worse"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Get the PID of the listener",
          "x": "Listeners only, so you do not pick up unrelated client connections.",
          "code": "PID=$(lsof -ti tcp:3000 -sTCP:LISTEN); echo \"$PID\""
        },
        {
          "title": "Identify it before signalling it",
          "x": "Read the command line and the user. If it says `postgres`, `sshd` or anything you did not start, the answer is to change your port, not to kill theirs.",
          "code": "ps -o pid,ppid,user,etime,command -p $PID"
        },
        {
          "title": "Ask politely first",
          "x": "Plain `kill` sends `SIGTERM`, which gives the process a chance to flush logs, close database handles and remove its socket files. Most dev servers handle it in well under a second.",
          "code": "kill $PID\nsleep 1\nlsof -ti tcp:3000 -sTCP:LISTEN || echo 'port is free'"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught, so no cleanup runs: expect stale lock files, stale PID files and connections the far side has not been told about. It is the right tool for a wedged process and the wrong default.",
          "code": "kill -9 $PID"
        },
        {
          "title": "If the port is still busy, you had the wrong owner",
          "x": "A second process from a different address family, a container, or a reserved range. Check all three before escalating further.",
          "code": "sudo lsof -nP -i :3000\ndocker ps --filter publish=3000"
        }
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Two habits worth dropping",
      "x": "`killall -9 node` takes out every Node process you have, including the language server your editor depends on and any long-running script you cared about. `sudo kill -9` on a PID you have not identified is worse, because `sudo` is exactly what lets you kill the things that matter. Target by command line with `pkill -f` if you need a blunt instrument."
    },
    {
      "t": "h2",
      "x": "Advice that is wrong, and why"
    },
    {
      "t": "p",
      "x": "Search results for this error are full of TCP tuning that does not apply. The specific confusion is `TIME_WAIT`."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` is a state for *closed connections*, held for roughly twice the maximum segment lifetime so that late packets from the old connection cannot be mistaken for part of a new one with the same four-tuple. It does not describe a listening socket. Restarting a server with thousands of sockets in `TIME_WAIT` works fine, because the `SO_REUSEADDR` option tells the kernel to allow the bind anyway, and libuv sets it for you on Unix-like systems, which covers Node out of the box. Most runtimes do the same. If you want to see the state yourself, ask for it directly."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Connections in TIME_WAIT on port 3000 (Linux)\nss -tan state time-wait '( sport = :3000 )'\n\n# The listening socket, if any. This is the one that causes EADDRINUSE.\nss -ltn '( sport = :3000 )'"
    },
    {
      "t": "ul",
      "items": [
        "**`net.ipv4.tcp_tw_recycle`** is cited constantly and no longer exists: it was removed in Linux 4.12 because it broke clients behind NAT. If a guide tells you to set it, that guide predates 2017.",
        "**`net.ipv4.tcp_tw_reuse`** affects outbound connections reusing local ports. It has nothing to do with a server failing to bind.",
        "**`SO_REUSEPORT`** does fix the symptom, in the worst possible way. On Linux it lets several processes listen on the same port and has the kernel load-balance across them, so your fresh build and the stale orphan each serve a share of requests and you debug ghosts for an afternoon.",
        "**Incrementing the port** turns one orphan into a collection. Three weeks later you have servers on 3000 through 3007 and no idea which browser tab is talking to which build."
      ]
    },
    {
      "t": "h2",
      "x": "Stop it happening again"
    },
    {
      "t": "p",
      "x": "Two changes remove most of these incidents. Handle termination signals, as above, so the server actually exits when asked. Then stop hardcoding ports in anything that runs more than once at a time."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// Port 0 asks the OS for any free port. Tests can never collide.\nconst server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`listening on ${port}`);\n});\n\n// And make the dev port configurable rather than literal\nconst port = Number(process.env.PORT) || 3000;"
    },
    {
      "t": "p",
      "x": "Port 0 is the single best habit here. Integration tests that bind a fixed port fail the moment two suites run in parallel or a developer has the app open locally, and the failure arrives as a confusing `EADDRINUSE` in CI rather than as an obvious conflict. Ask the kernel for a free port and read it back. In Docker, publishing `3000` on the host while the container listens on a fixed internal port keeps the collision in one place, where `docker compose down` can clear it."
    },
    {
      "t": "p",
      "x": "One last habit: when a dev server misbehaves, check for orphans before you restart it. `pgrep -af node` takes a second and will show you the three copies you did not know were running."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, `kill $(lsof -ti tcp:3000 -sTCP:LISTEN)`. On Windows, find the PID with `netstat -ano | findstr :3000` and then run `taskkill /PID 48213 /F`. Check what the process is first with `ps -p <PID> -o command=` or `tasklist /FI \"PID eq <PID>\"`, because the holder is sometimes a database or a system service rather than your dev server."
        },
        {
          "q": "What does EADDRINUSE actually mean?",
          "a": "It is the error the `bind` or `listen` system call returns when the address and port you asked for are already claimed by another socket. The address part matters: a process bound to `0.0.0.0:3000` blocks every IPv4 bind on 3000, while one bound to `127.0.0.1:3000` only blocks loopback binds on that address."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Usually because Ctrl+C stopped a wrapper and not the server. `npm run dev` is a chain of processes, and if the parent dies first the real server is reparented to PID 1 and keeps listening. The other common cause is a server that called `close()` and is waiting for keep-alive connections to drain, which can take as long as the keep-alive timeout."
        },
        {
          "q": "Is kill -9 safe?",
          "a": "It is safe for the port, since the kernel reclaims the socket however the process dies. It is not safe for the process's own state. `SIGKILL` cannot be caught, so no shutdown handler runs: temp files, PID files, lock files and in-flight writes are all left as they were. Send `SIGTERM` first and escalate only if the process ignores it."
        },
        {
          "q": "Why is port 5000 in use on my Mac when nothing is running?",
          "a": "AirPlay Receiver binds ports 5000 and 7000 on recent macOS releases, and lsof shows the owner as `ControlCenter`. Killing it does not help because the system restarts it. Turn off AirPlay Receiver in System Settings under General, then Sharing, or move your app to another port. This is why the old Flask default of 5000 stopped working for many people."
        },
        {
          "q": "Does TIME_WAIT cause EADDRINUSE?",
          "a": "Almost never for a server restart. `TIME_WAIT` applies to connections that have already closed, and the `SO_REUSEADDR` socket option lets a listener bind anyway. Node, Go and most other runtimes set that option by default on Unix-like systems. If a restart is blocked, look for a live process holding the port rather than tuning TCP sysctls."
        },
        {
          "q": "Nothing is listening on the port but the bind still fails on Windows. Why?",
          "a": "Hyper-V, WSL2 and Docker Desktop reserve ranges of dynamic ports, and reserved ranges do not appear as listeners in `netstat`. Run `netsh int ipv4 show excludedportrange protocol=tcp` in an elevated prompt to list them, then choose a port outside those ranges or adjust the dynamic port range."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of this problem: a container that dies before it can hold a port at all.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite symptom, checked layer by layer: nothing is listening where you expected.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnose and fix CORS errors",
          "desc": "Once the dev server is up on a new port, the browser has opinions about it.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-01",
  "updated": "2026-10-01",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
