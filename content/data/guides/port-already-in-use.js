module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port Already in Use",
  "h1": "Fixing EADDRINUSE: address already in use",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means bind() failed because something already owns the port. Find the owner on macOS, Linux or Windows, then free it safely.",
  "standfirst": "The commands that identify which process holds a port, and the reasons a port stays busy after a crash even when nothing appears to be listening.",
  "keywords": [
    "eaddrinuse",
    "address already in use",
    "kill process on port",
    "port already in use",
    "lsof port 3000"
  ],
  "cardDesc": "Find the process holding a port, end it safely, and understand why it survives a crash.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "EADDRINUSE comes from `bind()`, before your server handles a single request. Something else already owns that address and port.",
        "Identify the owner before you kill anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `Get-NetTCPConnection -LocalPort 3000` on Windows.",
        "After a crash the usual cause is an orphaned child process, not a lingering TCP state. Look for a live PID before you blame TIME_WAIT.",
        "`kill -9` is the second attempt, not the first. SIGTERM gives the process a chance to close its listener and release file locks.",
        "If nothing is listening and the bind still fails, suspect a Windows reserved port range, AirPlay Receiver on macOS port 5000, or a container you forgot was published."
      ]
    },
    {
      "t": "h2",
      "x": "The fastest path to an answer"
    },
    {
      "t": "p",
      "x": "Two steps. Find the process that holds the port, then end it. On macOS and Linux, `lsof` gives you the PID and the command that owns it:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n# COMMAND   PID   USER   FD   TYPE  DEVICE  SIZE/OFF  NODE NAME\n# node    48213   ada   23u  IPv6  0x9f1a       0t0   TCP *:3000 (LISTEN)\n\n# Linux without lsof installed\nss -lptn 'sport = :3000'\n\n# Ask it to stop, then check again before escalating\nkill 48213\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Only if it is still there a few seconds later\nkill -9 48213"
    },
    {
      "t": "p",
      "x": "The `-nP` flags stop `lsof` resolving hostnames and port names, which makes it noticeably faster and keeps the output readable. `-sTCP:LISTEN` filters out established connections that merely pass through the port, which is what makes the plain `lsof -i :3000` output confusing on a busy machine."
    },
    {
      "t": "p",
      "x": "On Windows, PowerShell gives you the same two steps:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "Get-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\nGet-Process -Id 18244 | Select-Object Id, ProcessName, Path\n\nStop-Process -Id 18244 -Force"
    },
    {
      "t": "code",
      "lang": "bat",
      "x": ":: The older cmd.exe equivalent\nnetstat -ano | findstr :3000\ntaskkill /PID 18244 /F"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "npx kill-port is fine on a laptop",
      "x": "`npx kill-port 3000` collapses both steps into one command and works across platforms. It also kills whatever holds the port without telling you what that was, so keep it for your own development machine and not for anything shared."
    },
    {
      "t": "h2",
      "x": "What the error is actually reporting"
    },
    {
      "t": "p",
      "x": "A server binds before it listens. The bind is a request to the kernel for exclusive use of one address and port pair, and EADDRINUSE is the kernel refusing. Your process started normally, read its config, connected to its database perhaps, and then failed at the last step. That is why the error arrives after several seconds of apparently healthy startup logs."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:...)\n    at listenInCluster (node:net:...)\n  errno: -98,          // Linux; macOS reports -48\n  code: 'EADDRINUSE',\n  syscall: 'listen',\n  address: '::',\n  port: 3000"
    },
    {
      "t": "p",
      "x": "Read the `address` field. `:::3000` and `::` mean the IPv6 wildcard, `0.0.0.0` means the IPv4 wildcard, and `127.0.0.1` means loopback only. That distinction matters later. The stack frames vary between Node versions, so match on the first line rather than on line numbers you found in a search result."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What it prints"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`"
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
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`"
        ]
      ],
      "caption": "One syscall failure, five vocabularies. Errno 98 is Linux; macOS and the BSDs use 48."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EACCES is a different problem",
      "x": "`EACCES` on a port below 1024 means you lack permission to bind a privileged port, not that the port is taken. Run on a high port and put a reverse proxy in front of it, or grant the capability explicitly on Linux with `setcap 'cap_net_bind_service=+ep' /usr/bin/node`. Note that granting it to the Node binary grants it to every script that binary runs."
    },
    {
      "t": "h2",
      "x": "Why the port stays busy after a crash"
    },
    {
      "t": "p",
      "x": "\"Crash\" covers several different situations, and they do not share a fix. Work through them in this order, because the first one accounts for most reports."
    },
    {
      "t": "h3",
      "x": "The process did not actually die"
    },
    {
      "t": "p",
      "x": "This is the common case by a wide margin. `npm run dev` is a parent that spawns a shell that spawns your server, and sometimes a watcher in between. Pressing Ctrl+C sends SIGINT to the terminal's foreground process group, which usually reaches all of them. Closing the terminal window, killing only the top PID from Activity Monitor, or having a watcher detach its child breaks that chain. The parent disappears from your view, the child keeps the socket, and your next start fails."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# What is actually still running?\npgrep -af node\n\n# Find the process group, then signal the whole group\nps -o pgid= -p 48213 | tr -d ' '   # -> 48200\nkill -TERM -48200                  # negative PID means process group"
    },
    {
      "t": "p",
      "x": "A debugger session counts too. If you attached an inspector and the editor is still holding the process, the socket is held with it. So does a test runner that forked a server and never tore it down; `pgrep -af node` will show a command line ending in your test file, which is a useful clue."
    },
    {
      "h3": null,
      "t": "h3",
      "x": "The old process is shutting down slowly"
    },
    {
      "t": "p",
      "x": "`server.close()` in Node stops the server accepting new connections and then waits for existing ones to finish. HTTP keep-alive sockets are existing connections. An idle browser tab can therefore hold your shutdown open until its keep-alive timeout expires, which looks exactly like a hung process. Node 18.2 added `server.closeAllConnections()` and `server.closeIdleConnections()` for this; check what your version supports before relying on them."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT, and the advice that does not work"
    },
    {
      "t": "p",
      "x": "When a socket closes, the side that closed first keeps an entry in TIME_WAIT so late-arriving packets are not delivered to an unrelated new connection. If your server's old connections are in TIME_WAIT with a local port equal to its listening port, a fresh `bind()` can be refused. The fix is the `SO_REUSEADDR` socket option, set at bind time, which tells the kernel to allow it."
    },
    {
      "t": "p",
      "x": "Most modern runtimes already set it. libuv sets `SO_REUSEADDR` for TCP binds, so Node servers generally restart immediately, and Go's `net.Listen` does the same. Python is the usual exception: `http.server.HTTPServer` sets `allow_reuse_address = 1`, while a plain `socketserver.TCPServer` historically does not. If you wrote raw socket code, set the option yourself before binding."
    },
    {
      "t": "code",
      "lang": "python",
      "x": "import socket\n\ns = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\ns.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # before bind, not after\ns.bind((\"0.0.0.0\", 8000))\ns.listen()"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Lowering tcp_fin_timeout does not shorten TIME_WAIT",
      "x": "This is the most repeated wrong answer to EADDRINUSE. On Linux, `net.ipv4.tcp_fin_timeout` controls the FIN_WAIT_2 state, a different part of the close sequence. TIME_WAIT is fixed at 60 seconds in the kernel and is not exposed as a sysctl. `net.ipv4.tcp_tw_reuse` applies to outgoing connections, not to listeners, and `tcp_tw_recycle` was removed in Linux 4.12 after years of silently breaking clients behind NAT. Set `SO_REUSEADDR` instead of tuning the kernel."
    },
    {
      "t": "p",
      "x": "`SO_REUSEADDR` is also not `SO_REUSEPORT`. The first lets you rebind over closing sockets. The second lets several processes listen on the same port at once and have the kernel distribute connections between them, which is a load-balancing feature and not something you want by accident during development. Their exact semantics differ between Linux and the BSDs."
    },
    {
      "t": "h3",
      "x": "A supervisor restarted it for you"
    },
    {
      "t": "p",
      "x": "If the port frees for a second and is taken again, something is restarting the service. `systemctl status myapp` will show `Restart=always` doing its job. So will `pm2 list`, a Docker restart policy, or a Compose file still running in another terminal. Stop the supervisor, not the process, or you will be killing PIDs forever."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and the bind still fails"
    },
    {
      "t": "p",
      "x": "Occasionally `lsof` and `netstat` come back empty and the port is still refused. There are four explanations worth checking."
    },
    {
      "t": "h3",
      "x": "Windows has reserved the port range"
    },
    {
      "t": "code",
      "lang": "bat",
      "x": "netsh interface ipv4 show excludedportrange protocol=tcp"
    },
    {
      "t": "p",
      "x": "Hyper-V, WSL2 and Docker Desktop reserve blocks of the dynamic port range at boot. A reservation is not a listening socket, so nothing appears in `netstat -ano`, and the bind fails anyway. If your port falls inside a listed range, the commonly reported workaround is to restart the NAT driver from an elevated prompt with `net stop winnat` and `net start winnat`, start your app, and accept that this briefly disrupts port forwarding for anything else using it. Moving your app to a port outside the excluded ranges is the less disruptive option."
    },
    {
      "t": "h3",
      "x": "macOS AirPlay Receiver owns 5000 and 7000"
    },
    {
      "t": "p",
      "x": "On recent macOS releases the AirPlay Receiver service listens on ports 5000 and 7000, which is why Flask's default port stopped working for a lot of people. `lsof -nP -iTCP:5000 -sTCP:LISTEN` shows the owner as `ControlCe`, truncated from ControlCenter. Turn it off under System Settings, General, AirDrop & Handoff, or just move your app to another port. Menu paths and behaviour shift between macOS versions, so confirm with `lsof` on your own machine rather than trusting this description as of September 2026."
    },
    {
      "t": "h3",
      "x": "The address matters as much as the port"
    },
    {
      "t": "p",
      "x": "Read the Local Address column, not only the port. A process bound to `127.0.0.1:3000` and one bound to `0.0.0.0:3000` are not the same binding, and whether they collide depends on the platform and on whether `SO_REUSEADDR` is in play. On Linux, a socket bound to `[::]` also accepts IPv4 connections while `net.ipv6.bindv6only` is 0, which is the default, so an IPv6 wildcard listener can be the thing blocking your IPv4 bind. Check what is bound rather than reasoning about what should conflict."
    },
    {
      "t": "h3",
      "x": "It belongs to another user or another namespace"
    },
    {
      "t": "p",
      "x": "Without root, `lsof` and `ss` may only show you your own processes, so an empty result can mean \"not yours\" rather than \"not there\". Re-run with `sudo`. Containers are the other half of this: depending on the networking mode, a published port shows up as `docker-proxy`, as the container process, or as nothing recognisable at all."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "sudo lsof -nP -iTCP:3000 -sTCP:LISTEN\ndocker ps --format \"{{.Names}} {{.Ports}}\"\nsudo fuser -k 3000/tcp    # Linux: kill whatever holds it, bluntly"
    },
    {
      "t": "h2",
      "x": "Killing the right process, in the right order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Identify the owner and its full command line",
          "x": "A PID alone is not enough context to decide. `ps` shows you what you are about to end, which matters when the answer turns out to be Postgres or a system service rather than your dev server.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN\nps -p 48213 -o pid,ppid,user,etime,command"
        },
        {
          "title": "Check that it is yours to kill",
          "x": "If the USER column is not you, or the command lives under `/usr/sbin`, stop and think. Killing a shared service on a staging box to free a port is how a small annoyance becomes an incident."
        },
        {
          "title": "Send SIGTERM first",
          "x": "Plain `kill` sends SIGTERM, which gives the process a chance to close its listener, finish in-flight requests, release advisory file locks and flush buffered logs. Wait about five seconds.",
          "code": "kill 48213"
        },
        {
          "title": "Escalate only if it ignores you",
          "x": "`kill -9` sends SIGKILL, which cannot be caught. The process stops mid-write. Expect stale lock files, truncated logs and, for a database, recovery on next start.",
          "code": "kill -9 48213"
        },
        {
          "title": "Verify before restarting",
          "x": "A clean second check saves you from an identical error thirty seconds later, and confirms you killed the listener rather than one of its children.",
          "code": "lsof -nP -iTCP:3000 -sTCP:LISTEN || echo \"port 3000 free\""
        }
      ]
    },
    {
      "t": "h2",
      "x": "Making it stop happening"
    },
    {
      "t": "p",
      "x": "The default behaviour is bad: your app throws a stack trace naming an internal Node file and says nothing about how to fix it. Handle the error and print the command the reader needs."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const http = require('node:http');\n\nconst port = Number(process.env.PORT ?? 3000);\nconst server = http.createServer(app);\n\nserver.on('error', (err) => {\n  if (err.code !== 'EADDRINUSE') throw err;\n  console.error(`Port ${port} is already in use.`);\n  console.error(`Find the owner: lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n  process.exit(1);\n});\n\nserver.listen(port);\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.once(signal, () => {\n    server.close(() => process.exit(0));\n    // Node 18.2+: do not wait on idle keep-alive sockets\n    server.closeAllConnections?.();\n  });\n}"
    },
    {
      "t": "p",
      "x": "Two habits remove most of the remaining cases. In tests, never hard-code a port: bind to 0 and let the kernel allocate one, then read it back. Parallel test workers stop fighting each other, and a leaked test server no longer blocks your dev server."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0);\nconst { port } = server.address();\nconst baseUrl = `http://127.0.0.1:${port}`;"
    },
    {
      "t": "p",
      "x": "Second, make your dev runner kill process groups rather than single PIDs, and prefer `docker compose down` over closing the terminal. Containers that spawn children should run with `--init` so signals reach them and zombies get reaped. None of this is glamorous. It is the difference between a port that frees itself on Ctrl+C and one you hunt down twice a day."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit code 0, 137 and the PID 1 signal problems behind them.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "Check listen_addresses, pg_hba.conf and the network path in order.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "How Node resolves a specifier, and where that resolution breaks.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "What does EADDRINUSE mean?",
          "a": "The kernel refused your bind() call because another socket already holds that address and port combination. It happens during startup, before your server accepts any request, so the code that failed is the listen call and not your application logic. The error object includes an address field, and reading it tells you whether the conflict is on loopback, the IPv4 wildcard 0.0.0.0 or the IPv6 wildcard ::."
        },
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "On macOS or Linux, run lsof -nP -iTCP:3000 -sTCP:LISTEN to get the PID, then kill that PID. Wait a few seconds and re-run the lsof command; escalate to kill -9 only if the process is still there. On Windows, use Get-NetTCPConnection -LocalPort 3000 -State Listen to find the OwningProcess, then Stop-Process -Id with that number. npx kill-port 3000 does the whole thing in one step but does not show you what it killed."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl+C?",
          "a": "Usually an orphaned child. Dev scripts spawn a chain of processes, and Ctrl+C signals the terminal's foreground process group rather than any detached child. Run pgrep -af node to see what survived. If the listener has a process group of its own, signal the group with a negative PID: kill -TERM -48200. The other possibility is that the old server is still closing and a keep-alive connection is holding it open."
        },
        {
          "q": "Why is port 5000 already in use on my Mac?",
          "a": "On recent macOS releases, the AirPlay Receiver service listens on ports 5000 and 7000. Run lsof -nP -iTCP:5000 -sTCP:LISTEN and you will see an owner named ControlCe, which is ControlCenter truncated. Disable AirPlay Receiver under System Settings, General, AirDrop & Handoff, or run your app on a different port. Menu locations move between macOS versions, so confirm against your own system."
        },
        {
          "q": "Windows says address already in use but netstat shows nothing listening. What now?",
          "a": "Check for a reserved range with netsh interface ipv4 show excludedportrange protocol=tcp. Hyper-V, WSL2 and Docker Desktop reserve blocks of the dynamic port range at boot, and a reservation blocks binds without creating a listening socket that netstat would report. Either pick a port outside the excluded ranges, or restart the NAT driver from an elevated prompt with net stop winnat followed by net start winnat, which will briefly disrupt port forwarding for anything else relying on it."
        },
        {
          "q": "Does kill -9 free the port immediately?",
          "a": "The listening socket is released as soon as the process is gone, so in practice yes. Established connections belonging to that process move through the normal close states, and a new bind can still be refused if your runtime does not set SO_REUSEADDR. Node and Go set it by default, so an immediate restart normally works. Reach for SIGTERM first regardless, because SIGKILL stops the process mid-write and leaves lock files and truncated logs behind."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-15",
  "updated": "2026-09-15",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
