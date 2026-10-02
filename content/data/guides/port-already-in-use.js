module.exports = {
  "slug": "port-already-in-use",
  "title": "Port Already in Use: Find and Kill the Process",
  "h1": "EADDRINUSE: something already holds that port",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means another process already holds the port. Find its owner with lsof or ss, kill it cleanly, and fix the orphan that caused it.",
  "standfirst": "One command names the process holding the port. The harder question is why it outlived your last crash, and the answer is usually an orphaned child rather than TIME_WAIT.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port in use",
    "port 3000 already in use"
  ],
  "cardDesc": "Identify the process holding a port on Linux, macOS or Windows, end it cleanly, and fix the orphan behind it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux names the owning process in one line. On Windows, `netstat -ano | findstr :3000` gives you a PID to look up.",
        "After a crash, the usual cause is an orphaned child process still holding the listening socket. The kernel is not keeping the port from you.",
        "Send `SIGTERM` before `SIGKILL`. A `kill -9` skips every cleanup path and can leave lock files, temp directories and half-open database connections behind.",
        "If the process reappears a second after you kill it, something is supervising it: systemd, pm2, a Docker restart policy or your own file watcher.",
        "Binding to port `0` makes the kernel pick a free port. For test suites that is almost always the right answer."
      ]
    },
    {
      "t": "h2",
      "x": "Read the whole error first"
    },
    {
      "t": "p",
      "x": "The message carries two pieces of information people skip past: the address and the port. `:::3000` is not the same as `127.0.0.1:3000`, and that difference decides whether a conflict is even possible."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What it prints",
        "Worth noticing"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` is the IPv6 wildcard. On a dual-stack host it also covers IPv4."
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 on Linux, errno 48 on macOS. Same meaning, different number."
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "The wrapped `bind` syscall error, so the address is printed verbatim."
        ],
        [
          "Java",
          "`java.net.BindException: Address already in use`",
          "Often buried several frames below a Spring startup failure."
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "The clash is on the host side, not inside the container."
        ],
        [
          "Windows",
          "`Only one usage of each socket address ... is normally permitted`",
          "`WSAEADDRINUSE`. The port may also be in a reserved range."
        ]
      ],
      "caption": "The same kernel error, surfaced differently by each runtime."
    },
    {
      "t": "p",
      "x": "A wildcard bind conflicts with everything on that port. A bind to `127.0.0.1:5432` conflicts only with another loopback bind or a wildcard one, which is why a service listening on a single interface can coexist with what looks like the same port in use elsewhere. If your error names a specific address, check that address."
    },
    {
      "t": "h2",
      "x": "Find the process that owns it"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listeners only, no DNS or port-name lookup\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof installed. -p needs root (or sudo) to show the PID.\nss -ltnp 'sport = :3000'\n\n# Everything touching the port, including established connections\nlsof -nP -i :3000\n\n# Just the PIDs, for scripting\nlsof -t -nP -iTCP:3000 -sTCP:LISTEN"
    },
    {
      "t": "p",
      "x": "Read the `COMMAND` column, not only the PID. Seeing `node` tells you little. Seeing `com.docker` tells you the port is published by a container and that killing the proxy is the wrong move. Confirm the full command line before you kill anything:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "ps -o pid,ppid,lstart,command -p 48213\n\n# Linux: what is this process's parent, and is it a child of something you own?\nps -o pid,ppid,command --forest -g $(ps -o sid= -p 48213)"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, PowerShell 5.1 and later\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe equivalent\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 1234\""
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "An empty result is information",
      "x": "If nothing is listening on the port and you still cannot bind, you are not fighting another process. Suspect a permissions problem (ports below 1024 need privileges or `CAP_NET_BIND_SERVICE`), a reserved port range on Windows, or an address that does not exist on this host. Binding to an IP the machine does not have produces `EADDRNOTAVAIL`, which looks similar at a glance and means something different."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Ask it to stop",
          "x": "`SIGTERM` is the default signal and gives the process a chance to close its socket, flush writes and remove its PID file. Most servers handle it. Give it a couple of seconds.",
          "code": "kill 48213"
        },
        {
          "title": "Check whether it actually went",
          "x": "A process stuck in a `D` state or waiting on a hung network call will ignore your polite request. Re-run the lookup rather than assuming.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN"
        },
        {
          "title": "Only then force it",
          "x": "`SIGKILL` cannot be caught or handled. The port is released immediately, and so is anything the process was in the middle of writing.",
          "code": "kill -9 48213"
        },
        {
          "title": "Kill the group when a wrapper is involved",
          "x": "Scripts launched through `npm run`, `concurrently` or a shell wrapper leave children behind when you kill only the parent. Negate the process group ID to take the whole tree. Find the PGID with `ps -o pgid= -p <pid>`.",
          "code": "kill -TERM -- -48210"
        }
      ]
    },
    {
      "t": "p",
      "x": "There are shortcuts. `fuser -k 3000/tcp` on Linux and `npx kill-port 3000` are both one-liners that do the lookup and the kill together. They are fine on a laptop. On a shared or production host, look before you shoot: a pattern match such as `pkill -f node` is a good way to end a database migration you did not know was running."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part that confuses people. The process is gone from your terminal, you saw the stack trace, and the port is still taken. There are four common explanations, and only one of them involves the kernel."
    },
    {
      "t": "h3",
      "x": "An orphaned child still holds the socket"
    },
    {
      "t": "p",
      "x": "This accounts for most cases. Your file watcher or task runner spawned the server as a child process. Ctrl-C delivered `SIGINT` to the foreground process group, the parent exited, and a grandchild that had re-parented or detached kept running with the listening file descriptor open. The terminal looks idle. The server is not."
    },
    {
      "t": "p",
      "x": "The same thing happens with clustering. A primary process creates the listening socket and passes it to workers; if the primary dies badly, the workers inherit the descriptor and keep accepting. You will see several PIDs on the port, which is a strong hint that you are looking at a worker pool rather than a stray instance."
    },
    {
      "t": "h3",
      "x": "Something is restarting it"
    },
    {
      "t": "p",
      "x": "If the PID changes every time you check, you are racing a supervisor. Stop the supervisor, not the process."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "systemctl status myapp          # is systemd managing it?\npm2 list                        # pm2 resurrects saved processes on boot\ndocker ps --filter publish=3000 # a container publishing the port\ndocker ps -a | grep Restarting  # a restart policy in a crash loop"
    },
    {
      "t": "h3",
      "x": "TIME_WAIT gets blamed far more than it deserves"
    },
    {
      "t": "p",
      "x": "The usual advice is to wait a minute or two for `TIME_WAIT` to expire. That advice is mostly wrong for a server you are restarting, and it sends people off to wait instead of to look."
    },
    {
      "t": "p",
      "x": "`TIME_WAIT` applies to a closed connection's four-tuple, not to a listening socket. A server that sets `SO_REUSEADDR` can bind a listening socket while old connections from the previous run sit in `TIME_WAIT`, and most runtimes set that option by default. Node and Go both do. If a plain restart genuinely fails for a minute and no process is listening, you have either a runtime that does not set the option or a bind to a specific address and port pair that matches a lingering connection. Check for listeners first:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Are these real listeners, or just connections winding down?\nss -tan 'sport = :3000'\n\n# LISTEN means a live process. TIME_WAIT or FIN-WAIT-2 means it is closing.\nlsof -nP -i :3000 | awk '{print $1, $2, $10}'"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not reduce TIME_WAIT as a fix",
      "x": "Shortening `TIME_WAIT`, or enabling `net.ipv4.tcp_tw_recycle` on an older kernel, has real consequences: late duplicate packets from an old connection can be delivered into a new one, and the recycle option breaks clients behind NAT. The option was removed from Linux in 4.12 for that reason. If the symptom is a port you cannot bind on restart, this is not the dial to turn."
    },
    {
      "t": "h3",
      "x": "The port was never available to you"
    },
    {
      "t": "p",
      "x": "Some ports are quietly claimed by the operating system. On macOS Monterey and later, the AirPlay Receiver service listens on port 5000, which is why a Flask default suddenly stopped working for a lot of people; turn the receiver off in System Settings or move your app. On Windows, Hyper-V and WSL2 reserve dynamic port ranges, and a reserved range will refuse your bind with no process to find:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "netsh int ipv4 show excludedportrange protocol=tcp\nnetsh int ipv4 show dynamicport tcp"
    },
    {
      "t": "h2",
      "x": "Make your own process stop causing this"
    },
    {
      "t": "p",
      "x": "Every fix above is a cleanup. The real fix is a server that releases its port when asked. Handle the termination signals, close the server, and set a deadline so a stuck connection cannot hold shutdown open forever."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port, () => console.log(`listening on ${port}`));\n\n// A clear message beats a stack trace you have read 50 times.\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is in use. Find the owner with: lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nlet shuttingDown = false;\nfunction shutdown(signal) {\n  if (shuttingDown) return;   // a second Ctrl-C should not re-enter this\n  shuttingDown = true;\n\n  const deadline = setTimeout(() => process.exit(1), 10_000);\n  deadline.unref();\n\n  server.close(() => {\n    clearTimeout(deadline);\n    process.exit(0);\n  });\n\n  // server.close() stops accepting but waits on keep-alive sockets.\n  // closeIdleConnections() needs Node 18.2 or later.\n  server.closeIdleConnections?.();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "Two details matter in containers. `SIGTERM` reaches PID 1 only, so a server started through `sh -c` will never see it; use the exec form of `CMD` or add an init process with `--init`. And Docker waits ten seconds by default before escalating to `SIGKILL`, so a shutdown deadline longer than that is decorative."
    },
    {
      "t": "p",
      "x": "For tests, stop hard-coding the port. Ask the kernel for a free one and read back what you were given. No conflicts, no cleanup, and parallel test workers stop fighting each other."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  baseUrl = `http://127.0.0.1:${port}`;\n});"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A shell function worth keeping",
      "x": "Add `port() { lsof -nP -iTCP:\"$1\" -sTCP:LISTEN; }` to your shell profile. Typing `port 3000` and reading the answer takes less time than recalling the flags, and it keeps you looking at the process list rather than guessing."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of a failed startup: the container that died before the port mattered.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Nothing is listening, which is the exact opposite problem and a layered check.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "JavaScript async/await",
          "desc": "An unhandled rejection is a common way for a server to die without releasing anything.",
          "href": "/guides/javascript-async-await-explained/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "Find it with `lsof -nP -iTCP:3000 -sTCP:LISTEN`, check the command name, then `kill <pid>`. If it survives that, `kill -9 <pid>`. On Windows, `netstat -ano | findstr :3000` gives the PID and `taskkill /PID <pid> /F` ends it. Look at the process name before killing: the owner is sometimes Docker's proxy or a system service, and killing the wrong one trades a bound port for a broken machine."
        },
        {
          "q": "Why is the port still in use after I closed the terminal?",
          "a": "Closing a terminal does not reliably end everything it started. A detached or re-parented child keeps running with the listening socket open, now owned by init or systemd rather than your shell. Find it by PID and kill it directly. Running `ps -ef | grep <your app>` usually shows it with a parent PID of 1."
        },
        {
          "q": "Do I have to wait for TIME_WAIT to clear before restarting?",
          "a": "Usually not. `TIME_WAIT` holds a closed connection's four-tuple, not the listening port, and most runtimes set `SO_REUSEADDR` so a new listener can bind anyway. If a restart fails and no process is listening, check whether your server binds to a specific address and port pair, and whether it sets that option. Do not shorten the kernel timeout to work around it."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES?",
          "a": "`EADDRINUSE` means another socket already holds the address. `EACCES` on a bind means you are not allowed to use it, most often a port below 1024 without privileges, or a Windows reserved range. The fix is different in each case: find a process for the first, change the port or grant the capability for the second."
        },
        {
          "q": "Why does Docker say the port is already allocated when nothing is running?",
          "a": "A stopped container can still hold the host port mapping, and `docker ps` hides stopped containers. Run `docker ps -a` and `docker ps --filter publish=3000`. If a container is listed as Restarting, a restart policy is bringing it back faster than you can inspect it; `docker stop` it before anything else. A leftover `docker-proxy` process after a daemon crash is rarer, and restarting the daemon clears it."
        },
        {
          "q": "Is it safe to use kill -9 on a development server?",
          "a": "Usually, but it is a habit worth not forming. `SIGKILL` cannot be handled, so nothing runs: no flush, no lock file removal, no clean database disconnect. On a dev server that normally costs you nothing. The same reflex applied to a database or a queue worker mid-transaction costs more, so try `SIGTERM` first and keep the escalation deliberate."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-02",
  "updated": "2026-10-02",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
