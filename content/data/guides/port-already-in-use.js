module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is in Use",
  "h1": "Port already in use: find the owner, free it, stop it recurring",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens, how to name the process holding a port on macOS, Linux and Windows, and how to free it without killing something you need.",
  "standfirst": "One command tells you which process holds the port. The harder question is why it survived the crash you thought killed it, and that answer is almost always process parentage.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port",
    "lsof port 3000"
  ],
  "cardDesc": "Name the process holding a port, free it safely, and stop the conflict coming back after every crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means another socket already holds the address and port you asked for. It is a conflict, not a bug in your code.",
        "Name the owner before you kill it: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the holder is usually an orphaned child. The parent you were watching is gone; the server it spawned is not.",
        "`killall node` and `kill -9` on an unread PID are how people lose a database session, a build, or a colleague's job on a shared host.",
        "If you hit this daily, fix it in code: handle the error with a useful message, bind port `0` in tests, and close the listener on `SIGTERM`."
      ]
    },
    {
      "t": "h2",
      "x": "What EADDRINUSE actually means"
    },
    {
      "t": "p",
      "x": "A listening socket is identified by a triple: protocol, local address, local port. `bind()` fails with `EADDRINUSE` when the kernel already has a socket registered for that same triple. Most people read only the port number. The address half matters just as much, and it is where the genuinely confusing cases come from."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "# Node\nError: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:...)\n\n# Python\nOSError: [Errno 98] Address already in use     # Linux\nOSError: [Errno 48] Address already in use     # macOS\n\n# Go\nlisten tcp :8080: bind: address already in use\n\n# Java\njava.net.BindException: Address already in use\n\n# Docker\nError response from daemon: ... Bind for 0.0.0.0:3000 failed: port is already allocated"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Three errors that get confused with each other",
      "x": "On Linux and macOS a port below 1024 fails with `EACCES` for an unprivileged user, not `EADDRINUSE`. `EADDRNOTAVAIL` means the IP address you asked for does not exist on this machine, which is common after a VPN tears down an interface. Only `EADDRINUSE` is a collision with another socket, so only `EADDRINUSE` is worth hunting a process for."
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "macOS or Linux: lsof, restricted to listeners",
          "x": "`lsof` maps sockets to processes. Restrict it to listening sockets, otherwise you also match clients that happen to be connected to port 3000 on some other host, and those matches are how people kill the wrong thing.",
          "code": "# Listeners only, with no DNS or service-name lookups\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# COMMAND   PID   USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME\n# node    48213  maria   24u  IPv6  0x...       0t0  TCP  *:3000 (LISTEN)\n\n# Just the pid, for scripting\nlsof -ti tcp:3000 -sTCP:LISTEN"
        },
        {
          "title": "Linux: ss is faster and already installed",
          "x": "`ss` comes with iproute2, so it is there on hosts that have no `lsof`. Showing the owning process for a socket you do not own needs root.",
          "code": "sudo ss -ltnp \"sport = :3000\"\n\n# State  Recv-Q Send-Q  Local Address:Port  Process\n# LISTEN 0      511           0.0.0.0:3000  users:((\"node\",pid=48213,fd=24))\n\n# What is that process, really?\nls -l /proc/48213/exe\ntr '\\0' ' ' < /proc/48213/cmdline; echo"
        },
        {
          "title": "Windows: netstat, then resolve the PID",
          "x": "`netstat -ano` puts the owning PID in the last column, and that number on its own tells you nothing. Resolve it to a name before acting. PowerShell gives the same answer with less squinting.",
          "code": "netstat -ano | findstr :3000\ntasklist /FI \"PID eq 48213\"\n\n# PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\nGet-Process -Id 48213 | Format-List Name, Path, StartTime"
        },
        {
          "title": "Containers: ask the daemon, not the host",
          "x": "When a container published the port, the host-side owner is `docker-proxy` or the daemon itself, which does not tell you which container to stop. Ask Docker directly.",
          "code": "docker ps --format '{{.Names}}\\t{{.Ports}}' | grep 3000\ndocker compose ps\n\n# Then stop the one you meant\ndocker stop <name>"
        }
      ]
    },
    {
      "t": "p",
      "x": "Read the command name every single time. That column is the difference between killing your own dev server and killing Postgres, and therefore the difference between losing nothing and losing an uncommitted transaction. If the name is something you did not start, find out what manages it before you touch it."
    },
    {
      "t": "h2",
      "x": "Free the port without taking out something you need"
    },
    {
      "t": "p",
      "x": "Send `SIGTERM` first. A well-behaved server traps it, closes the listening socket, drains in-flight requests and exits, which releases the port cleanly and in order. `SIGKILL` cannot be trapped, so nothing gets flushed, no temp file gets removed, and no lock gets released. Keep it for processes that ignored the polite request."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "kill 48213          # SIGTERM: the default, and the right first move\nkill -INT 48213     # SIGINT: identical to Ctrl-C, which some dev servers handle better\nkill -9 48213       # SIGKILL: no cleanup, no handlers, last resort\n\n# Windows\ntaskkill /PID 48213\ntaskkill /PID 48213 /F   # the /F is the SIGKILL equivalent"
    },
    {
      "t": "table",
      "head": [
        "One-liner",
        "What it does",
        "What it costs"
      ],
      "rows": [
        [
          "`kill -9 $(lsof -ti tcp:3000)`",
          "Kills every process with a socket on 3000",
          "The missing `-sTCP:LISTEN` means client connections match too, so one stray hit takes down something unrelated"
        ],
        [
          "`fuser -k 3000/tcp`",
          "Kills the holder in a single step",
          "Sends `SIGKILL` by default, and gives you no chance to read the process name first"
        ],
        [
          "`killall node`",
          "Kills every Node process for your user",
          "Also kills language servers, file watchers, other projects, and sometimes your editor"
        ],
        [
          "`npx kill-port 3000`",
          "A wrapper around the same lookup",
          "An extra package running with your privileges, and it still cannot tell a dev server from a database"
        ],
        [
          "`sudo` any of the above",
          "Reaches processes owned by other users",
          "On a shared box or a CI runner, this is how you kill another person's job"
        ]
      ],
      "caption": "The commands people paste from issue threads, and the specific way each one bites."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "A daily kill is a symptom, not a fix",
      "x": "If you run the same kill command twenty times a week, something upstream of the port is wrong. Either the server never shuts down cleanly, or something keeps restarting it: `systemd`, `pm2`, a Docker restart policy, a supervisor in your dev tooling, or a watcher that respawns on file change. You kill the process, the manager puts it straight back, and that looks exactly like a port refusing to free. Check for a manager before you blame the socket."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the case that feels like the machine is lying to you. The terminal is back at a prompt, no job is running as far as you can see, and the port is still taken. The cause is nearly always process parentage: you killed a parent, and the thing actually holding the socket was its child."
    },
    {
      "t": "ul",
      "items": [
        "**Orphaned children.** `npm run dev` spawns a shell, which spawns your server. Ctrl-C or a crash can take out the top of that chain and leave the real listener alive, re-parented to `init` or `launchd`, still holding the socket.",
        "**Forked workers.** When a cluster primary dies, its workers survive. Each one inherited the listening socket and keeps it open, which is the whole point of the design.",
        "**Detached processes.** Anything started with `&`, `nohup`, `disown`, inside `tmux`, or with `docker run -d` outlives the terminal you launched it from.",
        "**Leaked file descriptors.** A test runner or build step that spawns a server and then forgets to wait for it keeps the descriptor open for as long as that child lives, even if the server has stopped doing anything useful.",
        "**Something that is meant to persist.** A debugger waiting for you to reconnect, or a dev-tools proxy, holds its port by design. Node's inspector sits on `9229` rather than your app port, but the pattern is the same."
      ]
    },
    {
      "t": "p",
      "x": "When the port lookup is the thing misleading you, search by name instead, then read the parent PID and the elapsed time:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Every node process with its parent, age and full command line\nps -eo pid,ppid,etime,command | grep -i '[n]ode'\n\n# Same idea, shorter\npgrep -af 'node|vite|next'\n\n# A ppid of 1 means the parent is gone and this process was re-parented\nps -o pid,ppid,etime,command -p 48213"
    },
    {
      "t": "p",
      "x": "An `etime` older than your last restart settles it: that process predates the run you think you are debugging, so it is a leftover rather than the server you just started. A `ppid` of 1 confirms the orphan. On Windows, the equivalent check is `Get-CimInstance Win32_Process -Filter \"ProcessId = 48213\" | Select-Object ParentProcessId, CreationDate`."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT and SO_REUSEADDR"
    },
    {
      "t": "p",
      "x": "There is a second, rarer cause worth knowing. The listening socket is genuinely gone, but connections it accepted are sitting in `TIME_WAIT` for a couple of minutes while the kernel makes sure no delayed packet from the old connection is delivered to a new one. Without `SO_REUSEADDR`, a fresh `bind()` to that port fails even though nothing is listening."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: sockets lingering on the port\nss -tan state time-wait \"sport = :3000\"\n\n# macOS and BSD\nnetstat -an -p tcp | grep '\\.3000 ' | grep TIME_WAIT"
    },
    {
      "t": "p",
      "x": "You will not meet this often, because most runtimes set the option for you. Node and Go set `SO_REUSEADDR` on listening sockets by default, and Python's `http.server` enables `allow_reuse_address`. A raw `socket.socket()` in Python does not, which is exactly why a hand-rolled script hits the error while the framework sitting next to it never does."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # before bind, not after\ns.bind((\"127.0.0.1\", 3000))\ns.listen()"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "SO_REUSEPORT is not the fix, whatever the thread says",
      "x": "`SO_REUSEPORT` lets several sockets bind one port deliberately, and the kernel then balances new connections between them. Setting it to silence `EADDRINUSE` in development buys you the worst debugging session of your month: half your requests reach a stale build, half reach the new one, and nothing in either log says which. Use it only when running multiple accept loops is the actual goal, and note that the semantics differ between Linux and the BSDs."
    },
    {
      "t": "h2",
      "x": "Collisions that are not about the port number"
    },
    {
      "t": "p",
      "x": "Because the address is part of a socket's identity, several conflicts look impossible until you read the address rather than the number."
    },
    {
      "t": "table",
      "head": [
        "Situation",
        "What is really happening"
      ],
      "rows": [
        [
          "Wildcard against a specific IP",
          "A listener on `0.0.0.0:3000` collides with everything on 3000. Two listeners on `127.0.0.1:3000` and `192.168.1.10:3000` coexist happily, because the triples differ."
        ],
        [
          "IPv6 dual stack",
          "The `:::3000` in a Node error is the IPv6 wildcard. With IPv6-only binding disabled, as it is by default on Linux, that single socket serves IPv4 too, so an IPv4-only process cannot take the port."
        ],
        [
          "macOS system services",
          "Recent macOS releases claim some low ports for system features, and AirPlay Receiver on 5000 and 7000 is the usual surprise for anyone with a Flask or Rails habit. Look for a system process such as `ControlCe` in the `lsof` output rather than assuming, since Apple has moved these between releases."
        ],
        [
          "WSL2 and Windows",
          "A Windows process on 3000 blocks a `localhost` forward from WSL2, and the failure surfaces inside Linux where `ss` shows nothing listening. Check both sides of the boundary."
        ],
        [
          "Reserved port ranges",
          "On Windows, `netsh int ipv4 show excludedportrange protocol=tcp` lists ranges reserved by Hyper-V or WSL. No application can bind inside them, even though nothing is listening there."
        ]
      ],
      "caption": "The address, not just the port, decides whether two binds collide."
    },
    {
      "t": "h2",
      "x": "Handle it in the server, not in your terminal"
    },
    {
      "t": "p",
      "x": "If this is a daily event, stop treating each occurrence as an incident. Three small changes remove most of the pain, and the last one is what actually prevents the next conflict."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "import http from 'node:http';\n\nconst PORT = Number(process.env.PORT ?? 0);  // 0 = any free port\nconst server = http.createServer(app);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${PORT} is busy. Find the owner with:\\n` +\n      `  lsof -nP -iTCP:${PORT} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});\n\nserver.listen(PORT, () => {\n  console.log(`listening on http://localhost:${server.address().port}`);\n});\n\n// Close the listener on the signals Ctrl-C and supervisors actually send.\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => {\n    server.close(() => process.exit(0));\n  });\n}"
    },
    {
      "t": "p",
      "x": "The error handler turns a stack trace into an instruction, which matters most for the teammate meeting it for the first time. Port `0` lets the kernel pick, so parallel test runs and two checkouts of one repo stop fighting over a fixed number; read the real port back from `server.address().port`. The signal handlers are the prevention. A process that closes its listener on `SIGTERM` does not leave a socket behind when a supervisor restarts it."
    },
    {
      "t": "p",
      "x": "Inside a container, that last part only works if your process is PID 1 and actually receives the signal. A shell-form `ENTRYPOINT` wraps your server in `/bin/sh -c`, which does not forward `SIGTERM`, so the runtime waits out its grace period and then sends `SIGKILL` instead. Use exec form, or an init shim. The same parentage trap turns up in [why a container exits immediately](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "h2",
      "x": "The order to work through"
    },
    {
      "t": "ol",
      "items": [
        "Read the whole address in the error, not just the number. `:::3000` and `127.0.0.1:3000` are different problems.",
        "Identify the owner: `lsof -nP -iTCP:<port> -sTCP:LISTEN`, `sudo ss -ltnp`, or `netstat -ano` on Windows.",
        "Read the process name and decide whether you are entitled to kill it. If it belongs to a shared service, stop and ask.",
        "Send `SIGTERM`. Re-check the port. Escalate to `SIGKILL` only if the process is still there.",
        "Nothing listening but the bind still fails? Check `TIME_WAIT`, Windows reserved ranges, and the far side of a container or WSL boundary.",
        "Does it come back on its own? Find the supervisor, and check `ppid` and `etime` on whatever you found."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and signal handling: the same parentage problem from the other direction.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Postgres connection refused",
          "desc": "The mirror image of this error. Nothing is listening where you expected, checked layer by layer.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "The other startup failure that stops a dev server before it ever reaches your own code.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find out what is using port 3000?",
          "a": "On macOS or Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN`. On Linux without `lsof`, `sudo ss -ltnp \"sport = :3000\"`. On Windows, `netstat -ano | findstr :3000`, then `tasklist /FI \"PID eq <pid>\"` to turn the PID into a name. If a container published the port, the host-side owner is `docker-proxy`, so ask `docker ps` instead."
        },
        {
          "q": "How do I kill a process on a port in one command?",
          "a": "`lsof -ti tcp:3000 -sTCP:LISTEN | xargs kill` on macOS or Linux. Keep the `-sTCP:LISTEN`: without it, the lookup also matches client sockets connected to port 3000 somewhere else. The default signal here is `SIGTERM`, which is what you want. On Windows the equivalent is `taskkill /PID <pid>`, adding `/F` only if the first attempt fails."
        },
        {
          "q": "Why does the port stay in use after I stop the server?",
          "a": "Usually because the process you stopped was not the one holding the socket. A run script spawns a shell, which spawns the server, and killing the top of that chain leaves the listener alive with its parent reset to 1. Check with `ps -eo pid,ppid,etime,command | grep -i '[n]ode'`. Less often, connections in `TIME_WAIT` still hold the address, or a supervisor restarted the process within a second of your kill."
        },
        {
          "q": "Will restarting my computer fix EADDRINUSE?",
          "a": "Yes, which is why it is such a popular answer, and it is also the slowest imaginable way to kill one process. Worse, it hides the cause. If an orphaned child or a restart policy put the port back once, it will do the same thing after the reboot. Spend thirty seconds naming the process instead."
        },
        {
          "q": "Is it safe to use kill -9?",
          "a": "On your own dev server, usually. `SIGKILL` cannot be trapped, so the process gets no chance to flush buffers, remove a PID or lock file, or finish a write, and some services then need recovery on next start. Databases and message brokers are the ones to be careful with. Try plain `kill` first, give it a second or two, then escalate."
        },
        {
          "q": "Can two programs listen on the same port?",
          "a": "Yes, in three situations. They bind different addresses, such as `127.0.0.1:3000` and `10.0.0.5:3000`. They use different protocols, so a TCP listener and a UDP listener on 53 do not conflict. Or they both set `SO_REUSEPORT` and accept that the kernel will split incoming connections between them, which is a reasonable design choice and a miserable accident."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-24",
  "updated": "2026-11-24",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
