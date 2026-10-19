module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port In Use",
  "h1": "Port already in use: find the process, free the port",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means a live process still holds the port. Find its owner with ss, lsof or netstat, kill it safely, and stop it recurring after a crash.",
  "standfirst": "The port is almost never held by a ghost. Identify the process that owns it, decide whether killing it is safe, then fix the shutdown path that left it running.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port in use"
  ],
  "cardDesc": "Identify the process holding a port on Linux, macOS or Windows, then stop it happening after the next crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` means a socket is already bound to that address and port combination. Something is alive and holding it. A process that has fully exited releases its sockets automatically.",
        "One command gets you the owner: `ss -ltnp | grep :3000` on Linux, `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS, `netstat -ano | findstr :3000` on Windows.",
        "Read the process name before you kill anything. `lsof -ti:5432 | xargs kill -9` will cheerfully stop your database.",
        "After a crash the usual culprit is an orphaned child process whose parent died without passing the signal along, not a socket stuck in `TIME_WAIT`.",
        "If the process keeps coming back after you kill it, something is restarting it: nodemon, a supervisor, systemd with `Restart=always`, or a Docker restart policy."
      ]
    },
    {
      "t": "h2",
      "x": "Find the process that owns the port"
    },
    {
      "t": "p",
      "x": "Do this before anything else. The error tells you a port is taken; it does not tell you by what, and the answer changes what you should do next. Substitute your own port number for 3000 in everything below."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: listening TCP sockets, numeric, with the owning process\nss -ltnp | grep :3000\n\n# Linux: same thing, filtered by the kernel rather than grep\nss -ltnp 'sport = :3000'\n\n# macOS and Linux: who is listening on 3000\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Just the PIDs, for piping\nlsof -ti:3000\n\n# UDP instead of TCP (same error, different socket type)\nss -lunp | grep :3000"
    },
    {
      "t": "p",
      "x": "The flags matter more than they look. `-n` and `-P` stop `lsof` resolving hostnames and port names, which makes it fast and keeps the output greppable. `-sTCP:LISTEN` filters out established connections that merely involve port 3000 at the far end, which is what makes plain `lsof -i :3000` output so confusing. On Linux, `ss` is the maintained tool; `netstat` still works where the `net-tools` package is installed, but it has been deprecated for years."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, PowerShell: the owning PID\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Turn that PID into a name you recognise\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Classic equivalent, works in cmd.exe too\nnetstat -ano | findstr :3000\n\n# Stop it\ntaskkill /PID 1234 /F"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The one-liner everyone pastes is sharper than it looks",
      "x": "`kill -9 $(lsof -ti:3000)` works, and it is fine for a dev server you started two minutes ago. Run the same thing against 5432, 6379 or 8080 on a shared box and you may take out Postgres, Redis or a colleague's tunnel. It also hides the useful information: if you never see the process name, you never learn why the port was busy. Look first, kill second."
    },
    {
      "t": "h2",
      "x": "The error message already names the address"
    },
    {
      "t": "p",
      "x": "Every runtime reports the same underlying `errno`, so the wording differs but the meaning does not. Linux uses errno 98 for this condition, and the BSDs, including macOS, use 48."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see",
        "Notes"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` is the IPv6 wildcard address, not a typo"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Shows `[Errno 48]` on macOS"
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Often wrapped in a framework's own startup failure message"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Frequently a second nginx, or an Apache still running"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "The daemon refuses before your container starts"
        ]
      ],
      "caption": "The same kernel refusal, reported five different ways."
    },
    {
      "t": "p",
      "x": "Read the address part, not just the port. A server bound to `127.0.0.1:3000` and one bound to `0.0.0.0:3000` are not the same binding, and the second will fail while the first is running. Dual stack adds a wrinkle: on Linux, a listener on `[::]:3000` also accepts IPv4 traffic unless `net.ipv6.bindv6only` is set, so an IPv6 wildcard listener blocks an IPv4 wildcard one. That is why two dev servers, each configured with a different default host, can collide in a way that looks arbitrary."
    },
    {
      "t": "h2",
      "x": "Why it happens after a crash"
    },
    {
      "t": "p",
      "x": "Here is the part worth internalising. A process that has exited holds nothing. The kernel closes every file descriptor it owned, sockets included, as part of tearing it down. So if a port is still bound, there is still a process bound to it, and your job is to work out which one and how it survived."
    },
    {
      "t": "h3",
      "x": "An orphaned child outlived its parent"
    },
    {
      "t": "p",
      "x": "This is the common case by a wide margin. Your dev workflow is usually a chain: a terminal runs `npm run dev`, which runs a shell, which runs a bundler, which spawns the actual server. Kill or crash something in the middle of that chain and the leaf process can keep running, reparented to init, still holding the listening socket. Nothing in your terminal shows it. `ps` does: run `ps -ef | grep node` and look at the parent PID column, where a `1` tells you the process was orphaned."
    },
    {
      "t": "h3",
      "x": "Ctrl+C did not reach the process that mattered"
    },
    {
      "t": "p",
      "x": "Ctrl+C sends `SIGINT` to the foreground process group of your terminal. That covers most children, which is why it normally works. It misses anything that moved itself into a different process group or session, anything started with `setsid` or `nohup`, and anything whose parent spawned it through a wrapper that does not forward signals. Shell scripts are a frequent offender: a script that runs `node server.js` as its last line keeps the shell alive as the signal target. Writing `exec node server.js` instead replaces the shell with the server, so signals land on the right process."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT is usually not your problem"
    },
    {
      "t": "p",
      "x": "The most repeated answer to this error is \"a socket is stuck in `TIME_WAIT`, wait 60 seconds\". It is true that Linux holds a closed connection in `TIME_WAIT` for 60 seconds, and that this is a compile-time constant rather than a sysctl you can tune. It is also mostly irrelevant to your dev server. `TIME_WAIT` applies to accepted connections rather than to the listening socket, and libuv sets `SO_REUSEADDR` on TCP listeners by default on Unix-like systems, which is exactly the option that permits a rebind over those lingering connections. Node, and anything else built on libuv, restarts cleanly through `TIME_WAIT`."
    },
    {
      "t": "p",
      "x": "Two consequences follow. If waiting a minute genuinely fixes it, you are probably looking at a process with a slow shutdown, or a supervisor backing off between restarts, not at TCP state. And if waiting does not fix it, stop waiting. Go find the PID."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "\"Zombie process\" is the wrong name for this",
      "x": "A zombie is a process that has already exited and whose exit status has not yet been collected by its parent. It holds no memory, no file descriptors and no sockets. Whatever is sitting on your port is a live process, so searching for how to kill a zombie sends you down the wrong path. Orphan is the word you want."
    },
    {
      "t": "h3",
      "x": "Something is restarting it for you"
    },
    {
      "t": "p",
      "x": "If you kill the PID, confirm it is gone, and the port is taken again seconds later, you are fighting a supervisor rather than a process. Check for a systemd unit with `Restart=always`, a container started with `--restart unless-stopped`, a `pm2` or `forever` daemon, or a file watcher relaunching a server that then crashes on startup. The telltale sign is a PID that increments every time you look. Stop the supervisor, not the child."
    },
    {
      "t": "h2",
      "x": "A safe sequence for clearing a port"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify the owner and its command line",
          "x": "You want the full command, not just the name, because four `node` processes look identical until you see their arguments.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN\nps -p <PID> -o pid,ppid,user,etime,command"
        },
        {
          "title": "Decide whether it is yours to kill",
          "x": "A dev server you started is fair game. A database, a system service or another user's process is not. If `ps` shows a user other than yours, ask rather than reaching for sudo."
        },
        {
          "title": "Ask politely first",
          "x": "Plain `kill` sends `SIGTERM`, which gives the process a chance to close connections, flush writes and remove its own lockfiles. Most well-behaved servers exit within a second or two.",
          "code": "kill <PID>\n# Confirm it actually went away\nlsof -ti:3000"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`SIGKILL` cannot be caught, so cleanup handlers never run, but the kernel still reclaims the socket. Expect to clear stale lockfiles or temporary state afterwards.",
          "code": "kill -9 <PID>\n\n# Linux shortcut that does the lookup and the signal in one step\nfuser -k 3000/tcp"
        },
        {
          "title": "Signal the whole group if the leaf respawns",
          "x": "When a watcher keeps relaunching the server, target the watcher's process group rather than the server. A negative PID means the group.",
          "code": "# Find the group leader, then signal the group\nps -o pgid= -p <PID>\nkill -TERM -<PGID>"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Stop it happening next time"
    },
    {
      "t": "p",
      "x": "Most of the fix is making shutdown deliberate instead of accidental. A server that handles its termination signals and closes its listener leaves nothing behind for you to hunt down later."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`);\n});\n\n// Stop accepting new connections, let in-flight ones finish,\n// then exit. Covers Ctrl+C (SIGINT) and most supervisors (SIGTERM).\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n    // Do not hang forever on a keep-alive connection.\n    setTimeout(() => process.exit(1), 5000).unref();\n  });\n}\n\n// Surface the real cause instead of an unhandled exception.\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`port ${port} is already in use`);\n    process.exit(1);\n  }\n  throw err;\n});"
    },
    {
      "t": "ul",
      "items": [
        "**Use `exec` in wrapper scripts.** `exec node server.js` replaces the shell with the server, so signals reach it directly instead of dying at a shell that never forwards them.",
        "**Let tests pick their own port.** Listening on port 0 asks the kernel for a free ephemeral port, and `server.address().port` tells you which one you got. Parallel test runs stop fighting over a hardcoded number.",
        "**Bring Docker stacks down properly.** `docker compose down` releases published ports. Ctrl+C in an attached terminal can leave containers running, and `docker ps` will show them.",
        "**Keep dev ports out of the ephemeral range.** On Linux, `cat /proc/sys/net/ipv4/ip_local_port_range` commonly prints `32768 60999`. A dev server inside that range can lose a race against an outbound connection that borrowed the port first, which produces a genuinely intermittent `EADDRINUSE`.",
        "**Pick a deterministic port per project and write it down.** Two services that both default to 8080 will collide eventually, and a line in the README is cheaper than rediscovering the assignment."
      ]
    },
    {
      "t": "h2",
      "x": "Cases that look impossible"
    },
    {
      "t": "p",
      "x": "A few situations produce `EADDRINUSE` with no listener visible anywhere, which is where people start blaming the runtime."
    },
    {
      "t": "ul",
      "items": [
        "**You cannot see other users' processes.** Without root, `lsof` and `ss` omit process details you are not entitled to, so the port looks unowned. Re-run the lookup with `sudo` before concluding that nothing holds it.",
        "**Reserved port ranges on Windows.** Hyper-V, WSL2 and Docker Desktop reserve blocks of ports for dynamic use, and a bind inside a reserved block fails even though nothing is listening. `netsh interface ipv4 show excludedportrange protocol=tcp` lists them.",
        "**macOS AirPlay Receiver takes 5000 and 7000.** `ControlCenter` listens on both, which breaks the old Flask default of 5000 in a confusing way. The toggle lives in System Settings under AirDrop & Handoff (checked October 2026; Apple moves these panes between releases, so verify on your version).",
        "**A different network namespace.** A container, a WSL2 distribution or a VM has its own networking stack. A port held inside Docker does not appear in the host's `ss` output as a normal process, though the host-side `docker-proxy` usually does. Check `docker ps` for published ports.",
        "**`SO_REUSEPORT` made the conflict silent instead.** If every process sets that option, several can bind the same port and the kernel spreads connections between them. The symptom is not an error; it is half your requests reaching a stale server.",
        "**It is actually `EACCES`.** Binding below port 1024 without privileges gives you permission denied, a different problem with a similar feel. Use a high port in development and put a reverse proxy in front in production."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of this story: the container that died and left its port mapped.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Nothing listening, rather than something already listening.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node: cannot find module",
          "desc": "When the dev server you just freed the port for refuses to boot at all.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is running on port 3000?",
          "a": "On Linux or macOS, `lsof -ti:3000 | xargs kill` sends `SIGTERM` to every process listening there, and adding `-9` escalates if that fails. On Windows, find the PID with `netstat -ano | findstr :3000` and then run `taskkill /PID <pid> /F`. Check the process name with `ps -p <pid> -o command` first, because the command does not care whether the port belongs to your dev server or to a database."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Ctrl+C signals the foreground process group, and the process actually holding the socket is often outside it: a bundler's child, a server spawned through a script that did not forward the signal, or something started with `nohup`. Look for a process whose parent PID is 1, which means it was orphaned when its parent exited."
        },
        {
          "q": "Do I have to wait 60 seconds for the port to free up?",
          "a": "Almost never. That advice comes from TCP's `TIME_WAIT` state, which applies to accepted connections rather than to the listening socket, and libuv sets `SO_REUSEADDR` by default on Unix-like systems so Node rebinds through it anyway. If a wait appears to help, something was shutting down slowly or a supervisor was backing off before its next restart."
        },
        {
          "q": "What does `:::3000` mean in the Node error?",
          "a": "It is the IPv6 wildcard address `::` followed by `:3000`, so the message reads \"any IPv6 address, port 3000\". On Linux such a listener usually accepts IPv4 connections too, which is why an IPv6 wildcard bind can block a later `0.0.0.0` bind on the same port."
        },
        {
          "q": "Nothing shows up in lsof but the port is still in use. What now?",
          "a": "Three things to rule out. Run the lookup with `sudo`, because you cannot see process details for other users. Check whether the port lives in another network namespace by running `docker ps` and reading the published ports. On Windows, run `netsh interface ipv4 show excludedportrange protocol=tcp`, since Hyper-V and WSL2 reserve ranges that refuse a bind with nothing listening on them."
        },
        {
          "q": "Is `kill -9` safe for a dev server?",
          "a": "For a local dev server, yes in practice. `SIGKILL` cannot be caught, so shutdown handlers do not run and the process may leave lockfiles, temporary directories or a partially written build behind, but the kernel always reclaims the socket. Send plain `kill` first and reserve `-9` for a process that ignores it. For a database or a queue worker, use the service's own stop command instead."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-19",
  "updated": "2026-10-19",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
