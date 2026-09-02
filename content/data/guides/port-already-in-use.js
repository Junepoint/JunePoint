module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Busy Port",
  "h1": "Port already in use: finding the process that holds it",
  "eyebrow": "Troubleshooting",
  "description": "Identify the process holding a bound port on macOS, Linux and Windows, stop it safely, and understand why a crashed server keeps its socket.",
  "standfirst": "A bind failure names a specific address and port. Find the owner of that socket first, then decide whether killing it is the right move.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "address already in use",
    "kill process on port",
    "find process using port"
  ],
  "cardDesc": "Locate the owner of a bound port, stop it safely, and fix the crash pattern that keeps leaving it occupied.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is a bind failure. Something already holds that address and port pair, and the kernel refused to hand it out twice.",
        "List the owner before killing anything: `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, `ss -lptn \"sport = :3000\"` on Linux, `netstat -ano | findstr :3000` on Windows.",
        "After a crash the culprit is almost always a surviving child process, not a socket stuck in `TIME_WAIT`.",
        "`kill -9` frees the port fastest and skips every cleanup handler the process had. Send the default `SIGTERM` first and give it a couple of seconds.",
        "If nothing is listening and the bind still fails, suspect Docker port publishing, a Windows reserved port range, or a wildcard address clash."
      ]
    },
    {
      "t": "h2",
      "x": "Find out what holds the port"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: listening sockets only\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed (run as root to see process names)\nss -lptn 'sport = :3000'\n\n# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess\nGet-Process -Id <pid>\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq <pid>\""
    },
    {
      "t": "p",
      "x": "The `-sTCP:LISTEN` filter matters more than it looks. Plain `lsof -i :3000` matches any socket with 3000 at either end, so it also returns every browser tab and every `curl` currently connected to your dev server. Those are clients. Killing them does nothing for the bind, and on a shared machine it can take down something you did not intend to touch."
    },
    {
      "t": "p",
      "x": "On Linux, `ss` only prints the owning process when it has permission to look, so an empty `users:` column usually means you need `sudo`. That is a common source of the belief that a port is held by nothing at all."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Ask politely first: SIGTERM, so the process can run its shutdown handlers\nkill <pid>\n\n# Still there after a few seconds? Now escalate.\nkill -9 <pid>\n\n# Windows\ntaskkill /PID <pid>\ntaskkill /PID <pid> /F"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "The popular one-liner is broader than you think",
      "x": "`lsof -ti:3000 | xargs kill -9` is the answer you will find everywhere. It selects both listeners and connected clients, and it sends `SIGKILL` to all of them without asking. Add the listen filter and drop the `-9`: `lsof -tnP -iTCP:3000 -sTCP:LISTEN | xargs kill`. Reach for `-9` only when the polite version has already failed."
    },
    {
      "t": "h2",
      "x": "Read the error text before you reach for a fix"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:...)\n    ...\n{\n  code: 'EADDRINUSE',\n  errno: -98,          // -48 on macOS and other BSDs\n  syscall: 'listen',\n  address: '::',\n  port: 3000\n}"
    },
    {
      "t": "p",
      "x": "Stack frame line numbers are trimmed above because they move between Node releases. The useful parts are the last three fields. `syscall: listen` tells you the failure happened at bind time rather than during a request, and `address` tells you exactly which interface was requested. `::` is the IPv6 wildcard, which on a dual-stack host normally covers IPv4 as well."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "Message",
        "Worth noticing"
      ],
      "rows": [
        [
          "Node.js",
          "`listen EADDRINUSE: address already in use :::3000`",
          "`:::3000` is the wildcard bind, not a typo"
        ],
        [
          "Python",
          "`OSError: [Errno 98] Address already in use`",
          "Errno 98 is Linux; macOS reports 48"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`",
          "The `bind:` prefix names the failing syscall"
        ],
        [
          "Spring Boot",
          "`Web server failed to start. Port 8080 was already in use.`",
          "Wraps a `java.net.BindException`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Often a second nginx, or Apache"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:3000 failed: port is already allocated`",
          "The clash is on the host, not inside the container"
        ]
      ],
      "caption": "Same kernel error, different wrappers. All of them name the address and port that failed."
    },
    {
      "t": "h2",
      "x": "Why a crash leaves the port occupied"
    },
    {
      "t": "h3",
      "x": "The process never actually died"
    },
    {
      "t": "p",
      "x": "This is the boring answer and it is right most of the time. A crash in a request handler prints a stack trace and rejects one request; it does not stop the process. The listening socket keeps the event loop alive, so a Node server that logged an exception ten minutes ago is very likely still sitting there holding port 3000. Check with `pgrep -af node` before assuming otherwise."
    },
    {
      "t": "h3",
      "x": "A child inherited the socket"
    },
    {
      "t": "p",
      "x": "Dev commands are usually a chain: your shell starts `npm`, `npm` starts a framework CLI, that CLI starts a worker. The worker holds the descriptor. Kill only the top of the chain and the worker survives, reparented to init, still bound. Ctrl-C avoids this because the terminal sends `SIGINT` to the whole foreground process group, but a targeted `kill <pid>` on the wrapper does not."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Who is the parent, and who are the children?\nps -o pid,ppid,pgid,command -p <pid>\npgrep -af 'node|next|vite'\n\n# Signal the whole process group by negating the PGID\nkill -- -<pgid>"
    },
    {
      "t": "h3",
      "x": "You suspended it instead of stopping it"
    },
    {
      "t": "p",
      "x": "Ctrl-Z looks like Ctrl-C at a glance and does something completely different. It sends `SIGTSTP`, the process stops, and every file descriptor it owns stays open, including the listening socket. Run `jobs` in the shell you were using. If a suspended server is sitting there, `kill %1` clears it, and `fg` brings it back if you would rather stop it properly."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT: mostly a red herring"
    },
    {
      "t": "p",
      "x": "The standard folklore explanation is that the kernel is holding your port in `TIME_WAIT` for a minute after the crash. That state belongs to individual connections that closed, not to the listening socket, and it only blocks a fresh bind when the new socket lacks `SO_REUSEADDR`. Node sets that option through libuv, Go sets it, and Python's `http.server.HTTPServer` sets `allow_reuse_address`. Bare `socketserver.TCPServer` does not, which is exactly why a hand-rolled Python socket server refuses to restart for about a minute while `python -m http.server` restarts instantly."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not fix this with sysctls",
      "x": "Search results still recommend `net.ipv4.tcp_tw_recycle` for `TIME_WAIT` problems. That knob broke connections from clients behind NAT and was removed from Linux in kernel 4.12, so on any current kernel the advice is at best a no-op. If you genuinely have a bind blocked by `TIME_WAIT`, set `SO_REUSEADDR` on the socket instead of changing global network behaviour for every process on the box."
    },
    {
      "t": "h2",
      "x": "Conflicts that do not look like conflicts"
    },
    {
      "t": "p",
      "x": "A port is not owned on its own. The kernel keys listening sockets on the address and port together, so `127.0.0.1:3000` and `192.168.1.20:3000` can happily belong to two different processes. Read the address column in `lsof` output carefully: `*:3000` means the wildcard, `127.0.0.1:3000` means loopback only, and the two overlap."
    },
    {
      "t": "p",
      "x": "Whether a wildcard bind is allowed alongside an existing loopback bind depends on the platform and on which options each socket set. Linux is more permissive here than macOS. Treat any overlap as a conflict rather than relying on the difference, because code that binds successfully on your laptop and fails in CI is a bad trade for one saved port number."
    },
    {
      "t": "p",
      "x": "One more case worth knowing on macOS: AirPlay Receiver listens on port 5000, and on 7000 as well, on Monterey and later. Flask's default port is 5000, which is why so many Mac users hit this on their first `flask run`. You can turn AirPlay Receiver off in System Settings under General, though Apple has moved that panel between releases, so check the current location for your OS version rather than trusting an old screenshot."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and it still fails"
    },
    {
      "t": "p",
      "x": "Two environments produce a bind failure with no visible listener at all."
    },
    {
      "t": "p",
      "x": "**Docker.** Published ports are held by the daemon, not by the process you are looking for, and a container in a restart loop republishes its port on every attempt. `docker ps -a --format \"{{.Names}}\\t{{.Status}}\\t{{.Ports}}\"` shows the mapping and the restart state together. If a compose stack is the owner, `docker compose down` releases the ports properly, which a `docker stop` on one container may not. Our guide on [containers that exit immediately](/guides/docker-container-exits-immediately/) covers the restart loop itself."
    },
    {
      "t": "p",
      "x": "**Windows with Hyper-V or WSL2.** The virtual switch reserves blocks of ports up front, and a reservation blocks binds without anything listening. This is the one case where developers reasonably conclude their machine is lying to them."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Is your port inside a reserved block? Run as Administrator.\nnetsh interface ipv4 show excludedportrange protocol=tcp\n\n# Releasing the reservations: restarts the NAT service\nnet stop winnat\nnet start winnat\n\n# Claim a port for yourself so Hyper-V stops taking it\nnetsh int ipv4 add excludedportrange protocol=tcp startport=3000 numberofports=1"
    },
    {
      "t": "p",
      "x": "The same idea applies on Linux, less often. Outbound connections draw from the ephemeral port range, so a dev server on a high port can lose a race against an ordinary client socket. Check the range with `cat /proc/sys/net/ipv4/ip_local_port_range`, and if your chosen port sits inside it, choose a lower one."
    },
    {
      "t": "h2",
      "x": "Shut down cleanly so the port comes back"
    },
    {
      "t": "p",
      "x": "Most repeat offenders come from a server with no shutdown path. Adding one takes a few lines and removes the whole category of problem."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(3000);\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n\n  server.close(() => process.exit(0));\n\n  // Keep-alive sockets hold the server open past close().\n  // Both methods need Node 18.2 or newer; check with `node -v`.\n  server.closeIdleConnections?.();\n\n  // Hard deadline. unref() so this timer alone cannot keep us alive.\n  setTimeout(() => {\n    server.closeAllConnections?.();\n    process.exit(1);\n  }, 10_000).unref();\n}\n\nfor (const signal of ['SIGINT', 'SIGTERM']) {\n  process.on(signal, () => shutdown(signal));\n}"
    },
    {
      "t": "p",
      "x": "Note the ordering. `closeIdleConnections()` drops sockets sitting between requests, while `closeAllConnections()` destroys in-flight ones too, so it belongs after a grace period rather than at the start. Without either, `server.close()` waits for keep-alive connections that a browser is in no hurry to release, and your process hangs for as long as the client feels like holding it."
    },
    {
      "t": "p",
      "x": "Two environment quirks defeat even correct handlers. In Docker, a shell-form `CMD` makes `/bin/sh` PID 1 and `sh` does not forward signals to your app, so use the exec form or run with `--init`. And in an `npm run` chain, signal delivery depends on the terminal signalling the process group; if you start servers from a script rather than a terminal, propagate signals yourself instead of assuming they arrive."
    },
    {
      "t": "h2",
      "x": "Or stop competing for the port at all"
    },
    {
      "t": "p",
      "x": "Fixed ports are a convenience for humans. Tests do not need one, and a suite that hardcodes 3000 will fail the moment two suites run at once on a CI worker."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// Port 0 asks the OS for any free port. Read back what you got.\nconst server = app.listen(0, () => {\n  const { port } = server.address();\n  process.env.BASE_URL = `http://127.0.0.1:${port}`;\n});"
    },
    {
      "t": "p",
      "x": "For everyday development, an environment variable is enough: `PORT=3001 npm run dev` while you work out what owns 3000. That is a detour, not a fix. If you find yourself doing it every morning, something in your stop path is broken, and the sections above will tell you which one."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "Find the listener with `lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, then `kill <pid>`. On Windows, `netstat -ano | findstr :3000` gives you the PID in the last column, and `taskkill /PID <pid>` stops it. Confirm what the PID actually is before you kill it: on a shared or production host the port you want may belong to a service someone else depends on."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl-C?",
          "a": "Usually because a child process outlived the one you stopped, or because you pressed Ctrl-Z at some point and suspended a server rather than stopping it. Run `jobs` in that shell and `pgrep -af node` in another. A suspended process keeps every socket it had open."
        },
        {
          "q": "Is `kill -9` safe?",
          "a": "It is safe for the port and unsafe for the process. `SIGKILL` cannot be caught, so nothing runs: no flushing of buffered writes, no removal of lockfiles or PID files, no closing of database connections. Try plain `kill` first, wait a few seconds, and escalate only if the process ignores it."
        },
        {
          "q": "What does `:::3000` mean in the Node error?",
          "a": "It is the IPv6 wildcard address `::` followed by `:3000`. The server asked for every interface rather than a specific one. On a dual-stack machine that bind usually covers IPv4 too, which is why a process listening on `:::3000` blocks another one trying to take `0.0.0.0:3000`."
        },
        {
          "q": "Nothing shows up in lsof but the bind still fails. What now?",
          "a": "Re-run the command with `sudo`, since you cannot see other users' sockets otherwise. If it is still empty, check Docker with `docker ps -a`, and on Windows check `netsh interface ipv4 show excludedportrange protocol=tcp` for a reserved range covering your port. Reservations block binds with no listener present."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES on a port?",
          "a": "`EADDRINUSE` means the address is taken. `EACCES` means you are not allowed to bind it, which on Unix normally means a port below 1024 without privileges. The fix is different: for `EACCES` use a high port with a reverse proxy in front, or grant the binary `CAP_NET_BIND_SERVICE`, rather than hunting for a process that does not exist."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Why a restart loop keeps republishing the port you want.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Guide"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The other side of a port problem: nothing is listening where you expected.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Guide"
        },
        {
          "title": "Diagnosing CORS errors",
          "desc": "Once the dev server starts, the next thing the browser complains about.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-02",
  "updated": "2026-09-02",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
