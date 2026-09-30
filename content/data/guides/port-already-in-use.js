module.exports = {
  "slug": "port-already-in-use",
  "title": "Port Already in Use: Find and Kill the Process",
  "h1": "EADDRINUSE: find what owns the port, then take it back",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means something is still listening. Find the owning PID on macOS, Linux or Windows, kill it in the right order, and fix orphans after a crash.",
  "standfirst": "The port is not stuck. A process owns it, and usually it is a child of the thing you thought you killed. Here is how to prove that and clear it.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Locate the process holding a port, kill it in the right order, and fix the orphan that survives a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` nearly always means a process is alive and holding the socket. Nothing is stuck; something owns it.",
        "Find the owner before you kill anything: `lsof -i tcp:3000 -sTCP:LISTEN` on macOS or Linux, `ss -ltnp` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "Send `SIGTERM` first and `SIGKILL` only if that is ignored. A killed process never runs its cleanup.",
        "After a crash, the holder is usually a child process that inherited the listening file descriptor, so killing the PID you remember changes nothing.",
        "If genuinely no process owns the port, suspect a reserved port range on Windows, a running container, or AirPlay Receiver on macOS ports 5000 and 7000."
      ]
    },
    {
      "t": "h2",
      "x": "Find out what owns the port"
    },
    {
      "t": "p",
      "x": "Identify the process first. One command does it on macOS and Linux:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Just the listening PID, one per line\nlsof -ti tcp:3000 -sTCP:LISTEN\n\n# Full detail: command, PID, user, socket\nlsof -i tcp:3000 -sTCP:LISTEN\n\n# Linux, with the owning process (needs root to see other users')\nss -ltnp \"sport = :3000\"\n\n# Older boxes without ss\nnetstat -tlnp | grep ':3000'"
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Plain `lsof -i:3000` matches any socket with 3000 as the local *or* the remote port, so it also lists the browser tab and the `curl` you left hanging against that port. Pipe that list into `kill` and you take down processes you never meant to touch."
    },
    {
      "t": "p",
      "x": "If `lsof` prints nothing and the bind still fails, run it again under `sudo`. Unprivileged users only see their own processes, so a port held by `root` or by a service account is simply invisible to you."
    },
    {
      "t": "h3",
      "x": "Windows"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: the listener plus the process name behind it\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess,\n    @{ n = 'Process'; e = { (Get-Process -Id $_.OwningProcess).ProcessName } }\n\n# cmd.exe equivalent, two steps\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 1234\""
    },
    {
      "t": "p",
      "x": "Windows describes the same condition in its own words: `Only one usage of each socket address (protocol/network address/port) is normally permitted.` Node running on Windows still reports it as `EADDRINUSE`, so both strings point at the same problem."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask politely\nkill -TERM $(lsof -ti tcp:3000 -sTCP:LISTEN)\n\n# Verify, rather than assuming\nlsof -ti tcp:3000 -sTCP:LISTEN || echo 'port 3000 is free'\n\n# Only if SIGTERM was ignored\nkill -9 $(lsof -ti tcp:3000 -sTCP:LISTEN)\n\n# Shortcuts\nfuser -k 3000/tcp     # Linux, from psmisc\nnpx kill-port 3000    # cross-platform, nothing to install"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "Stop-Process -Id 1234           # graceful where the process allows it\nStop-Process -Id 1234 -Force    # the SIGKILL equivalent\ntaskkill /PID 1234 /F           # from cmd.exe"
    },
    {
      "t": "p",
      "x": "`SIGTERM` lets the process run its shutdown path: flush logs, close database handles, remove a PID file, deregister from a service registry. `SIGKILL` skips all of it. The kernel tears the process down and reclaims its descriptors, so the port frees either way, but everything the process meant to do on the way out is lost. Stale lock files and half-written output are the ordinary price of a `kill -9` habit."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not kill by name",
      "x": "`pkill -f node` is a tempting one-liner and a bad reflex. It matches every Node process on the machine, which on a typical dev box includes editor language servers, a TypeScript watcher, and whatever else a colleague left running on a shared host. Target the PID you confirmed."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is the case that makes people believe in stuck ports. The app crashed, the terminal is back at a prompt, nothing looks like it is running, and the bind still fails. Part of the process tree survived."
    },
    {
      "t": "p",
      "x": "A listening socket is a file descriptor, and children inherit descriptors across `fork`. Any child the crashed server spawned still holds that listener open, and the kernel keeps the port bound while even one descriptor references it. Killing the PID you wrote down does nothing when that PID was the parent."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who holds it, who its parent is, and how long it has been up\nlsof -ti tcp:3000 -sTCP:LISTEN | xargs ps -o pid,ppid,pgid,etime,command -p\n\n# Kill the whole process group. Note the leading dash before the PGID.\nkill -TERM -12345\n\n# Everything in the family, before you decide\npgrep -af node"
    },
    {
      "t": "p",
      "x": "The shapes this takes, roughly in order of how often you will meet them:"
    },
    {
      "t": "ul",
      "items": [
        "A dev runner such as `nodemon`, `vite`, `next dev` or `concurrently` supervises the real server. Killing the supervisor leaves the child listening.",
        "`npm run dev` inserts a shell and an npm process between your Ctrl-C and the server. Signal delivery through that chain is unreliable, and npm has historically exited without waiting for its child.",
        "The process was started with `&`, `nohup`, `disown` or `--detach` and is no longer attached to the terminal you closed.",
        "An IDE run configuration or a debugger still owns it. The process appears under the editor, not under any shell you can see.",
        "A `docker compose` service is still up. The local process really is gone, but the container publishing the port is not.",
        "A previous run is in a restart loop under a supervisor like `systemd` or `pm2`, grabbing the port again between your checks."
      ]
    },
    {
      "t": "p",
      "x": "Once the tree is visible, kill the process group instead of a single PID. `kill -TERM -<pgid>` signals every member at once, which is what you actually wanted."
    },
    {
      "t": "h2",
      "x": "TIME_WAIT is rarely your problem"
    },
    {
      "t": "p",
      "x": "The most repeated answer to `EADDRINUSE` is `TIME_WAIT`, and for modern servers it is usually wrong. A socket that closed a connection sits in `TIME_WAIT` for up to a couple of minutes so that late packets cannot be delivered to a new connection reusing the same four-tuple. Those sockets are not listeners. They are corpses of individual connections."
    },
    {
      "t": "p",
      "x": "A bind fails because of them only when your server does not set `SO_REUSEADDR`, and nearly every runtime sets it on your behalf. Node does, through libuv. Go's `net.Listen` does. Python's `http.server` sets `allow_reuse_address`. If you are writing raw socket code, you have to ask for it yourself, before `bind`:"
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # must precede bind()\ns.bind((\"127.0.0.1\", 3000))\ns.listen()"
    },
    {
      "t": "p",
      "x": "You can check whether `TIME_WAIT` is involved at all rather than guessing: `ss -tan state time-wait '( sport = :3000 or dport = :3000 )'`. Empty output means the theory is dead and no kernel tunable will help. Resist `SO_REUSEPORT` as a workaround too: it lets several processes listen on one port simultaneously, which hides a collision instead of reporting it, and you end up with requests arriving at the wrong build."
    },
    {
      "t": "h2",
      "x": "When nothing seems to own the port"
    },
    {
      "t": "p",
      "x": "Occasionally every tool agrees the port is free and the bind still fails. Work down this list."
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "Likely cause",
        "Check or fix"
      ],
      "rows": [
        [
          "Windows, high port, no visible process",
          "Hyper-V or WSL2 reserved a block of ports",
          "`netsh interface ipv4 show excludedportrange protocol=tcp`. As administrator, `net stop winnat` then `net start winnat` releases them."
        ],
        [
          "macOS, only ports 5000 and 7000",
          "AirPlay Receiver listens there on macOS 12 and later",
          "System Settings, General, AirDrop & Handoff. Turn AirPlay Receiver off, or move your app. Confirm on your own macOS version."
        ],
        [
          "A container is running",
          "Docker publishes the port through the daemon, not your process",
          "`docker ps`, then `docker compose down` or `docker rm -f <name>`"
        ],
        [
          "Fails on `0.0.0.0:3000`, works on `127.0.0.1:3000`",
          "Another process holds the wildcard address",
          "A wildcard bind conflicts with every specific address on that port, in both directions"
        ],
        [
          "Only ports below 1024 fail",
          "This is a permissions error, not a collision",
          "You will see `EACCES`, not `EADDRINUSE`. Use a high port behind a proxy, or grant `CAP_NET_BIND_SERVICE`."
        ],
        [
          "Linux, a service you never started",
          "`systemd` socket activation holds the socket",
          "`systemctl list-sockets`, then `systemctl status <unit>.socket`"
        ]
      ],
      "caption": "Work top to bottom. The first three cover the large majority of cases where no process appears to own the port."
    },
    {
      "t": "p",
      "x": "The Docker case deserves a note. When a published port collides, the error comes from the daemon before your code runs at all, so no amount of application configuration will fix it. If the container itself is misbehaving rather than merely occupying a port, see [why a Docker container exits immediately](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "h2",
      "x": "The same error, spoken by different layers"
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use` on Linux, `[Errno 48]` on macOS"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`"
        ],
        [
          ".NET, Kestrel",
          "`Failed to bind to address http://127.0.0.1:5000: address already in use.`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`"
        ],
        [
          "Docker",
          "Wording has changed across versions, but it names the port: `Bind for 0.0.0.0:3000 failed: port is already allocated`"
        ]
      ],
      "caption": "One operating system error, reported by seven layers. Exact strings differ between versions, so match on the port number rather than the sentence."
    },
    {
      "t": "p",
      "x": "The `:::3000` in the Node message is not a typo or a truncated address. It is the IPv6 wildcard, `::`, followed by the port, which tells you the server asked for every interface. A message reading `127.0.0.1:3000` instead means it asked only for loopback, and that distinction is what makes the wildcard row in the table above worth knowing."
    },
    {
      "t": "h2",
      "x": "Make the next restart clean"
    },
    {
      "t": "p",
      "x": "Most of these incidents trace back to a shutdown path that never ran. Handle the signals, close the server, and give yourself an escape hatch:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(3000);\n\nlet shuttingDown = false;\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => {\n    if (shuttingDown) process.exit(1);   // second Ctrl-C: stop waiting\n    shuttingDown = true;\n\n    server.close(() => process.exit(0)); // refuse new, drain in-flight\n    server.closeIdleConnections?.();     // Node 18.2+: drop idle keep-alives\n\n    // Never hang forever on a stuck connection.\n    setTimeout(() => process.exit(1), 10_000).unref();\n  });\n}"
    },
    {
      "t": "p",
      "x": "`server.close()` on its own can hang indefinitely, which is how a process ends up alive and holding a port after you asked it to stop. It stops accepting new connections but waits for existing ones, and an idle keep-alive socket from a browser or a load balancer counts as existing. `closeIdleConnections()` clears those. `closeAllConnections()` is the blunt version that also drops requests still in flight. Both arrived in Node 18.2."
    },
    {
      "t": "p",
      "x": "Two habits prevent the rest. Bind to `127.0.0.1` in development rather than the wildcard address, so a stray container or a colleague's service cannot collide with you. Then give every project its own port through an environment variable. The reason collisions feel constant is that every framework template in existence defaults to 3000, 5000 or 8080."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One line that pays for itself",
      "x": "Put `PORT=3117` in the project's `.env` and read it with a fallback: `app.listen(process.env.PORT || 3000)`. Pick an unusual number per service and this whole class of interruption mostly disappears."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I find out what is using port 3000?",
          "a": "Run `lsof -i tcp:3000 -sTCP:LISTEN` on macOS or Linux, `ss -ltnp \"sport = :3000\"` on Linux, or `netstat -ano | findstr :3000` on Windows followed by `tasklist /FI \"PID eq <pid>\"`. If the command prints nothing but the bind still fails, repeat it with `sudo`: without root you only see your own processes."
        },
        {
          "q": "How do I kill the process on a port in one command?",
          "a": "On macOS and Linux, `kill -TERM $(lsof -ti tcp:3000 -sTCP:LISTEN)`, or `fuser -k 3000/tcp` on Linux. `npx kill-port 3000` works anywhere Node is installed. On Windows it takes two steps: find the PID with `netstat -ano | findstr :3000`, then `taskkill /PID <pid> /F`."
        },
        {
          "q": "Why is the port still in use after my app crashed?",
          "a": "Because something in the process tree is still alive. A child process that inherited the listening file descriptor keeps the port bound even after the parent dies, and dev runners like `nodemon` or `concurrently` make that arrangement common. Inspect the tree with `pgrep -af node` and kill the process group with `kill -TERM -<pgid>` rather than a single PID."
        },
        {
          "q": "Is it safe to use kill -9 on a port?",
          "a": "It reliably frees the port, since the kernel reclaims the descriptors when the process dies. The cost is that no cleanup runs: no flushed logs, no closed transactions, no removed lock files. Send `SIGTERM` first, wait a couple of seconds, and reach for `SIGKILL` only when the process ignores it."
        },
        {
          "q": "Why does port 5000 fail on my Mac when nothing is running?",
          "a": "AirPlay Receiver has listened on ports 5000 and 7000 since macOS Monterey. Turn it off under System Settings, General, AirDrop & Handoff, or run your app on another port. Check the exact location on your own macOS version, because Apple moves these panels between releases."
        },
        {
          "q": "How long do I have to wait for a port to be released?",
          "a": "If a process owns the port, waiting does nothing at all: kill it. If the port is genuinely lingering in `TIME_WAIT`, that clears within about two minutes, but this is rare in practice because almost every runtime sets `SO_REUSEADDR` for you. Confirm with `ss -tan state time-wait '( sport = :3000 )'` before blaming the kernel."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When the container stops rather than holds a port, start with PID 1 and the exit code.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this error: nothing is listening where you expected something to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "The other startup failure that stops a server before it ever reaches listen().",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Node.js"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-30",
  "updated": "2026-09-30",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
