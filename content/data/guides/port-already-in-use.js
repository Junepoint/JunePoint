module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill the Process on a Port",
  "h1": "Port already in use: find the process, then find the cause",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens, how to find the process holding a port on Linux, macOS and Windows, and how to stop crashes leaving orphaned listeners behind.",
  "standfirst": "The commands that identify the PID holding a port, the safe order in which to kill it, and the reasons a crashed dev server keeps its socket.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Find what is holding port 3000, kill it safely, and stop crashes from leaving orphaned listeners.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The port is held by a live process almost every time. Get the PID before you kill anything.",
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS and Linux, `ss -ltnp 'sport = :3000'` on Linux, `Get-NetTCPConnection -LocalPort 3000 -State Listen` on Windows.",
        "Send SIGTERM first. `kill -9` skips every shutdown handler, which is how you end up with stale lock files and half-written state.",
        "After a crash, the usual culprit is a child process that outlived its parent and inherited nothing but the socket.",
        "A listener on `:::3000` blocks `0.0.0.0:3000` as well. Read the address in the error, not just the port number.",
        "Ports under 1024 and Windows reserved ranges give you EACCES, not EADDRINUSE. Different problem, different fix."
      ]
    },
    {
      "t": "lede",
      "x": "Something owns that port. Your job is three steps: identify the process, decide whether killing it is safe, then work out why it survived the crash that sent you looking. Most people stop after step two, which is why the same port is stuck again twenty minutes later."
    },
    {
      "t": "h2",
      "x": "What EADDRINUSE actually means"
    },
    {
      "t": "p",
      "x": "The kernel refused your `bind()` call because another socket already owns that address and port pair. Note the wording. Address *and* port, not port alone. A server on `127.0.0.1:3000` and a server on `0.0.0.0:3000` are claiming overlapping territory, and on Linux the second one to ask is the one that fails. Node prints the full address in the error and it is worth reading rather than skimming:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000"
    },
    {
      "t": "p",
      "x": "`:::3000` is the IPv6 wildcard. On a dual-stack machine, a listener there accepts IPv4 traffic too, so it blocks `0.0.0.0:3000` as effectively as if it had bound the IPv4 wildcard directly. If instead the error names `127.0.0.1:3000`, the fight is only over loopback. That distinction explains a lot of the cases where one tool insists a port is free and another insists it is taken: they are not asking for the same address."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What the error looks like"
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
          "Java / Spring Boot",
          "`java.net.BindException: Address already in use`, usually wrapped as `Web server failed to start. Port 8080 was already in use.`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`"
        ]
      ],
      "caption": "One kernel error, five wrappers. The errno differs between Linux and macOS, which is why copied-and-pasted error numbers rarely match."
    },
    {
      "t": "h2",
      "x": "Find the PID"
    },
    {
      "t": "p",
      "x": "Start with the tool that names the process rather than the one that just confirms the port is busy. On macOS and Linux that is `lsof`, and the flags matter more than they look."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: the owner of the listening socket, nothing else\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed (iproute2 is almost always present)\nss -ltnp 'sport = :3000'\n\n# Blunt but fast: just the PIDs using that port\nfuser 3000/tcp"
    },
    {
      "t": "p",
      "x": "`-n` skips reverse DNS and `-P` skips port name lookups. Without them, `lsof` can sit for seconds waiting on a resolver that is not going to answer, and people conclude the command has hung. `-sTCP:LISTEN` drops the established connections *to* that port, which are noise when you want the owner. The output column you care about is the second one, the PID, and the first, the command name."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Run it with sudo before concluding the port is free",
      "x": "If the socket belongs to another user or to root, plain `lsof` silently omits it rather than telling you it lacked permission. `ss -ltnp` behaves similarly: the socket appears, but the `users:((\"node\",pid=1234,...))` column is blank. An empty result from an unprivileged shell is not evidence."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: owning process, then what that process is\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id 12345\n\n# cmd.exe equivalent. Last column is the PID.\nnetstat -ano | findstr :3000"
    },
    {
      "t": "p",
      "x": "The `netstat` pipeline has a trap in it. `findstr :3000` is a substring match, so it also matches `:30000`, `:30001` and any ephemeral local port that happens to contain those digits. On a busy machine you can easily kill the wrong PID that way. The PowerShell cmdlet takes the port as a number and does not have that problem, so prefer it when you have a choice."
    },
    {
      "t": "h2",
      "x": "Kill it in the right order"
    },
    {
      "t": "p",
      "x": "Read the process name first. Every so often the thing holding port 5432 is a real Postgres install that something else on the machine depends on, and forcing the postmaster down means every backend has to go through crash recovery on the next start. Once you are satisfied it is your stray dev server, escalate slowly."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "kill 12345           # SIGTERM: the process gets to run its shutdown handlers\nkill -9 12345        # SIGKILL: only after SIGTERM has visibly failed\n\n# fuser sends SIGKILL by default, which is rarely what you want first\nfuser -k -TERM 3000/tcp\nfuser -k 3000/tcp"
    },
    {
      "t": "p",
      "x": "Give SIGTERM a couple of seconds before escalating. A process that ignores it is usually blocked in a syscall or stuck in a handler that never calls `exit`, and that is worth knowing about, because the same bug is what will strand the port again next time. Reaching for `-9` immediately hides the information."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "Stop-Process -Id 12345\ntaskkill /PID 12345 /F"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Windows has no SIGTERM",
      "x": "Console applications on Windows can handle Ctrl+C events, but there is no simple command that delivers one to a process in another terminal. `Stop-Process` and `taskkill /F` terminate abruptly. Design your cleanup so that an abrupt end is survivable: write files atomically, and treat lock files as advisory with a timestamp rather than as proof that a process is alive."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the part worth understanding, because the fix for the symptom takes ten seconds and the fix for the cause is permanent. When you press Ctrl+C, your terminal sends SIGINT to the *foreground process group*, not to one process. Anything outside that group carries on. A crash is worse still: it takes down exactly one process and leaves the rest of the tree standing."
    },
    {
      "t": "ul",
      "items": [
        "**A child outlived its parent.** Your dev command runs npm, npm runs a shell, the shell runs your server, and a plugin spawns a bundler. Kill the top of that chain and the grandchildren get reparented to init, still listening.",
        "**The child was detached deliberately.** `spawn(cmd, args, { detached: true })` puts the child in its own process group, which is precisely what stops it receiving your Ctrl+C.",
        "**The terminal was closed rather than the process.** Closing an emulator window sends SIGHUP to the session leader. Anything started under `nohup`, or anything that ignores SIGHUP, keeps running with its socket.",
        "**Cluster workers inherited the socket.** With `cluster` or a multi-process server, workers share the listening file descriptor. Killing the primary leaves the workers holding the port perfectly happily.",
        "**A debugger or IDE owns it.** VS Code's JavaScript debug terminal and JetBrains run configurations both keep processes alive independently of the shell you were looking at.",
        "**Docker published it.** A stopped-looking container with a published port still has `docker-proxy` or the Docker backend holding the host side."
      ]
    },
    {
      "t": "p",
      "x": "Trace the family tree before you decide what to kill. The parent PID and process group ID tell you whether your signal was ever going to reach this process in the first place."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Parent, process group, session for one PID\nps -o pid,ppid,pgid,sid,command -p 12345\n\n# The whole subtree, if pstree is available\npstree -p 12345\n\n# Docker: is a container publishing this port?\ndocker ps --filter publish=3000"
    },
    {
      "t": "p",
      "x": "If `ppid` is 1, the parent is already gone and this process was adopted by init. That is your orphan. If `pgid` differs from the group your shell was signalling, the process was never going to see your Ctrl+C, detached on purpose or otherwise."
    },
    {
      "t": "h2",
      "x": "When it is not a stale process at all"
    },
    {
      "t": "p",
      "x": "Several failures look like a busy port and are not. Recognising them saves you hunting for a PID that does not exist."
    },
    {
      "t": "h3",
      "x": "Privileged ports"
    },
    {
      "t": "p",
      "x": "Binding anything below 1024 as a non-root user fails with EACCES, not EADDRINUSE. Node phrases it as `listen EACCES: permission denied 0.0.0.0:80`. The fix is a high port plus a redirect, a capability (`setcap 'cap_net_bind_service=+ep'` on the binary), or a reverse proxy, not a kill command."
    },
    {
      "t": "h3",
      "x": "Windows reserved port ranges"
    },
    {
      "t": "p",
      "x": "Hyper-V, WSL2 and Docker Desktop reserve blocks of ports for dynamic use, and those blocks are re-picked after a reboot. The classic symptom is a port that worked yesterday and refuses today with a permission error rather than a busy one. Check the reservations directly:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "netsh interface ipv4 show excludedportrange protocol=tcp"
    },
    {
      "t": "p",
      "x": "If your port sits inside an excluded range, no process holds it and nothing you kill will help. Move your service, or reserve the port for yourself so the dynamic allocator stops taking it."
    },
    {
      "t": "h3",
      "x": "macOS AirPlay Receiver"
    },
    {
      "t": "p",
      "x": "macOS has shipped an AirPlay Receiver that listens on ports 5000 and 7000 for several releases, which broke a lot of Flask tutorials that default to 5000. The toggle has moved between the Sharing and General panes across versions, so check both (accurate as of September 2026, and worth verifying on your own release). `lsof` will point at `ControlCenter` or a similar system process, and killing it is not a fix because launchd restarts it."
    },
    {
      "t": "h3",
      "x": "WSL2 and Windows fighting over localhost"
    },
    {
      "t": "p",
      "x": "WSL2 forwards localhost between Windows and the Linux VM. A server running inside the distro and one running on the Windows side can collide on the same localhost port even though `ss` inside the distro reports nothing listening. Check both sides before assuming the tooling is lying to you."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT is usually not your problem"
    },
    {
      "t": "p",
      "x": "The most repeated answer to EADDRINUSE is that the socket is stuck in TIME_WAIT and you must wait a couple of minutes. That is mostly wrong for the case people actually hit, and believing it makes you wait instead of looking for the orphan that is still running."
    },
    {
      "t": "p",
      "x": "TIME_WAIT applies to a closed connection's four-tuple, not to a listening socket. It can block a rebind, but only when the new socket does not set `SO_REUSEADDR`, and most runtimes set it for you. libuv sets `SO_REUSEADDR` when binding TCP listeners on Unix-like systems, so a restarted Node server rebinds immediately. Python's `http.server.HTTPServer` sets `allow_reuse_address` for the same reason. Hand-rolled socket code does not, and that is where the genuine two-minute wait shows up:"
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # before bind, not after\ns.bind((\"127.0.0.1\", 3000))\ns.listen()"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reach for SO_REUSEPORT to silence the error",
      "x": "`SO_REUSEPORT` is a different option with different consequences: it lets multiple sockets bind the same port and have the kernel load-balance between them. Set it to make a startup error go away and you will get a deployment where half the traffic reaches the old build and half reaches the new one, with no error anywhere to tell you. `SO_REUSEADDR` is the one that helps with rebinding. They are not interchangeable, and on Windows `SO_REUSEADDR` has looser semantics again, which is why runtimes avoid setting it there."
    },
    {
      "t": "h2",
      "x": "Make the failure legible in your own code"
    },
    {
      "t": "p",
      "x": "An unhandled EADDRINUSE gives you a stack trace through `node:net` internals, which tells the reader nothing they need. Catch it and print the command that solves it. Your future self, and everyone new to the project, will find the port in fifteen seconds instead of fifteen minutes."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = http.createServer(app);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${PORT} is already in use.`);\n    console.error(`Find the owner: lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nserver.listen(PORT);"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Close the server on the way out",
          "x": "Handle both signals, close the listener, and keep a hard deadline so a hung connection cannot stop the process from exiting. `server.close()` stops accepting new connections but waits for open ones, and keep-alive connections can wait a long time. Newer Node releases add `server.closeAllConnections()` for exactly this; check `node -v` against the docs for your version rather than assuming it exists.",
          "code": "for (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}"
        },
        {
          "title": "Kill the process group, not just the child",
          "x": "If you deliberately detach a child, you own the responsibility of taking it down. A negative PID signals the entire process group, which catches grandchildren your bundler or test runner spawned.",
          "code": "const child = spawn('node', ['worker.js'], { detached: true, stdio: 'inherit' });\n\nprocess.on('SIGINT', () => {\n  process.kill(-child.pid, 'SIGTERM'); // negative PID targets the group\n});"
        },
        {
          "title": "Bind port 0 in tests",
          "x": "Fixed ports in a test suite guarantee collisions once anything runs in parallel or a previous run leaves a stray process. Port 0 asks the kernel for a free ephemeral port and hands it back to you.",
          "code": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;"
        }
      ]
    },
    {
      "t": "h2",
      "x": "A short diagnostic order"
    },
    {
      "t": "ol",
      "items": [
        "Read the address in the error. Wildcard, loopback, or a specific interface changes what you are looking for.",
        "`sudo lsof -nP -iTCP:<port> -sTCP:LISTEN`. If it names a process, you have your answer.",
        "Nothing found? Check for EACCES rather than EADDRINUSE, check Windows excluded ranges, check the other side of the WSL boundary, check Docker.",
        "Found it? Look at `ppid` and `pgid` before killing, so you learn why your Ctrl+C missed it.",
        "SIGTERM, wait, then SIGKILL only if needed.",
        "Fix the shutdown path so the next crash does not leave the same orphan."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker Container Exits Immediately",
          "desc": "When the container that was publishing your port is not the one still holding it.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL Connection Refused",
          "desc": "The opposite failure: nothing is listening where you expect it to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Another dev-server startup failure with a misleading first line.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is running on port 3000?",
          "a": "On macOS or Linux: `sudo lsof -nP -iTCP:3000 -sTCP:LISTEN` to get the PID, then `kill <pid>`, escalating to `kill -9 <pid>` only if the process ignores SIGTERM. On Windows: `Get-NetTCPConnection -LocalPort 3000 -State Listen` for the `OwningProcess`, then `Stop-Process -Id <pid>` or `taskkill /PID <pid> /F`. Check the process name before you kill it, because the same command will happily take down a database you needed."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C sends SIGINT to the foreground process group. Anything your dev server spawned into a different group, detached on purpose or via a shell wrapper, never receives it and keeps the socket. Run `ps -o pid,ppid,pgid,command -p <pid>` on the survivor: a `ppid` of 1 means the parent is gone and this process was adopted by init."
        },
        {
          "q": "Is `npx kill-port 3000` safe to use?",
          "a": "On a development machine it is usually fine, and it saves typing. Be aware of what it gives up: it force-kills without telling you what the process was, so you lose both the chance to shut down cleanly and the information about which tool keeps stranding the port. On anything shared or production-adjacent, find the PID yourself."
        },
        {
          "q": "Why do I get EADDRINUSE when lsof shows nothing on that port?",
          "a": "Three common reasons. You ran `lsof` without `sudo` and the socket belongs to another user, so it was omitted silently. Or the conflict is on a different address than the one you searched: a listener on `:::3000` blocks `0.0.0.0:3000`. Or the error is not really EADDRINUSE at all, and you are hitting a Windows reserved port range or a privileged port, both of which report a permission error instead."
        },
        {
          "q": "Does restarting my machine fix a port already in use error?",
          "a": "It clears the symptom, since orphaned processes do not survive a reboot. It tells you nothing about the cause, and if the cause is a service that starts at boot, or a Docker container with a restart policy, the port will be taken again before you open your editor. Spend the thirty seconds identifying the process first."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on a port?",
          "a": "EADDRINUSE means another socket already holds that address and port. EACCES means you are not allowed to bind it: typically a port below 1024 without root, or a port inside a Windows reserved range. No amount of killing processes fixes EACCES. Use a high port with a proxy in front, grant `cap_net_bind_service` on Linux, or move off the reserved range on Windows."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-09",
  "updated": "2026-09-09",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
