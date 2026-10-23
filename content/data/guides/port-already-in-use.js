module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is In Use",
  "h1": "Port already in use: find what is holding it",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens after a crash, how to name the process holding a port on Linux, macOS and Windows, and how to kill it without collateral damage.",
  "standfirst": "The port is not stuck. Something is still listening on it, and one command will tell you what.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Name the process holding your port on Linux, macOS or Windows, kill it safely, and stop it recurring.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`lsof -nP -iTCP:3000 -sTCP:LISTEN` on Linux or macOS names the process and its PID. On Windows, `netstat -ano | findstr :3000` gives you the PID to look up.",
        "After a crash, the usual cause is a surviving child process that inherited the listening socket, not a socket the kernel is holding onto.",
        "`TIME_WAIT` rarely blocks a Node, Python or Go server from rebinding, because those runtimes set `SO_REUSEADDR` on the listening socket.",
        "Send `SIGTERM` first. `kill -9` skips the process's own cleanup, which is how you end up with an orphaned child holding the same port a second time.",
        "If nothing appears to be listening, suspect a published Docker port, a reserved Windows port range, or a macOS system service on 5000 or 7000."
      ]
    },
    {
      "t": "h2",
      "x": "Name the process in one command"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux and macOS: what is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux without lsof installed\nss -ltnp 'sport = :3000'\n\n# Linux, blunt but quick\nfuser -n tcp 3000"
    },
    {
      "t": "p",
      "x": "The flags matter more than they look. `-n` skips DNS lookups and `-P` skips port-name lookups, so the output appears immediately instead of hanging on a slow resolver. `-sTCP:LISTEN` filters out established connections to that port, which is what you want when you are hunting a server rather than a client. Without it, a busy port returns dozens of rows and the listener is buried among them."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, cmd\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 18324\"\ntaskkill /PID 18324 /F\n\n# Windows, PowerShell: straight to the process\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\nStop-Process -Id 18324"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "An empty result is not always an empty port",
      "x": "`lsof` only reports processes you are allowed to see. If the port is held by another user, by root, or by a container runtime, an unprivileged `lsof` returns nothing at all while the bind keeps failing. Re-run it with `sudo` before concluding the port is free."
    },
    {
      "t": "h2",
      "x": "Kill it, in the right order"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# 1. Ask politely. The process runs its shutdown handlers.\nkill 18324\n\n# 2. Still there a few seconds later? Then force it.\nkill -9 18324\n\n# One-liner, handy but unforgiving: kills every listener on the port\nkill $(lsof -t -iTCP:3000 -sTCP:LISTEN)"
    },
    {
      "t": "p",
      "x": "`kill` with no signal sends `SIGTERM`, which a well-written server intercepts so it can finish in-flight requests, flush logs and close its database pool. `kill -9` sends `SIGKILL`, which cannot be intercepted. The process stops mid-instruction. Anything it was responsible for cleaning up, including child processes it spawned, is left behind. That is a common way to turn one stuck port into two."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Read the row before you kill it",
      "x": "The PID on port 5432 may well be the PostgreSQL instance holding your development data, and the PID on 3000 may be a colleague's container on a shared box. Check the `COMMAND` column first. Never pipe `lsof` output into `kill` on a server you do not fully own."
    },
    {
      "t": "h2",
      "x": "Why it happens right after a crash"
    },
    {
      "t": "p",
      "x": "This is the case that confuses people, because the terminal clearly showed a stack trace and the prompt came back. The server looks dead. Then the restart fails with a message very close to this one:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1872:16)\n    at listenInCluster (node:net:1920:12)"
    },
    {
      "t": "p",
      "x": "Other runtimes say the same thing in their own dialect. Python raises `OSError: [Errno 98] Address already in use` on Linux and `[Errno 48]` on macOS. Go returns `listen tcp :3000: bind: address already in use`. Docker refuses with `Bind for 0.0.0.0:3000 failed: port is already allocated`. All four mean the kernel already has a socket bound to that address and port, held by a process that is still alive."
    },
    {
      "t": "p",
      "x": "The usual suspects, roughly in order of how often they turn out to be the answer:"
    },
    {
      "t": "ul",
      "items": [
        "**A surviving child.** Your dev wrapper (nodemon, `ts-node-dev`, `concurrently`, a shell script) spawned the real server as a child. The wrapper died. The child inherited the listening file descriptor and kept running, now reparented and invisible in your shell's job list.",
        "**A backgrounded job in another tab.** The one you started with `&` an hour ago, or in a terminal pane you have since scrolled away from. `jobs` only shows the current shell's jobs, which is why this hides so well.",
        "**The crash never reached the process.** An unhandled rejection printed a trace, the request handler died, and the HTTP server carried on listening. The log looks fatal. The process is fine.",
        "**A debugger or test runner holding on.** A paused breakpoint or a watch-mode runner keeps the socket open for as long as it is suspended.",
        "**A restart policy.** `docker run --restart=always`, systemd with `Restart=on-failure`, or a Kubernetes liveness probe cheerfully brought the thing back up for you."
      ]
    },
    {
      "t": "h3",
      "x": "The TIME_WAIT answer is usually wrong"
    },
    {
      "t": "p",
      "x": "The most repeated explanation on the internet is that closed connections sit in `TIME_WAIT` for a minute or two and block the port, so you should wait it out. For a listening server socket, that is mostly a misdiagnosis, and acting on it wastes time you could have spent finding the real process."
    },
    {
      "t": "p",
      "x": "The reason is `SO_REUSEADDR`. On Linux and the BSDs, that socket option lets a bind succeed even when connections to the same local port linger in `TIME_WAIT`. Node sets it by default through libuv, Go sets it on TCP listeners, and Python's `http.server` and most WSGI and ASGI servers set it too. So if your Node server reports `EADDRINUSE`, a conflicting live socket is nearly always the explanation. You can confirm what the kernel thinks:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Sockets in TIME_WAIT on this port (usually harmless for a listener)\nss -tan state time-wait '( sport = :3000 or dport = :3000 )'\n\n# A live listener on this port (this is the one that blocks you)\nss -ltn 'sport = :3000'"
    },
    {
      "t": "p",
      "x": "If the second command prints a row, you have your answer and no amount of waiting will help. Two genuine exceptions exist. Windows is stricter about rebinding than Unix, so a short wait sometimes does clear it there. And `SO_REUSEADDR` does not let two processes share a listener, which is what `SO_REUSEPORT` is for; if you deliberately want several workers on one port, you need the latter, and Node's cluster module gets the same effect by having the primary accept connections and hand them out."
    },
    {
      "t": "h3",
      "x": "Kill the group, not the process"
    },
    {
      "t": "p",
      "x": "When the holdout is an inherited child, killing the PID you remember does nothing useful, because it is already gone. Find the process group and signal the whole thing."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Show the parent and process group of whatever holds the port\nps -o pid,ppid,pgid,etime,command -p $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Signal the entire group: note the leading minus on the PGID\nkill -TERM -4821\n\n# Last resort, by name, after you have checked what matches\npkill -f 'node dist/server.js'"
    },
    {
      "t": "p",
      "x": "The same trick is worth building into anything that spawns a server. If you start a child with `detached: true` in Node, the child becomes its own group leader, and `process.kill(-child.pid, 'SIGTERM')` then takes down the child and everything below it in one call. Without that, a wrapper that exits on `Ctrl+C` leaves its grandchildren running, and you are back here tomorrow."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and the bind still fails"
    },
    {
      "t": "p",
      "x": "Occasionally `lsof` and `ss` both come back empty, even under `sudo`, and the bind keeps failing. At that point the port is held by something that does not look like an ordinary process."
    },
    {
      "t": "table",
      "head": [
        "Symptom",
        "Likely cause",
        "What to check"
      ],
      "rows": [
        [
          "Ports 5000 or 7000 refuse to bind on macOS",
          "AirPlay Receiver and related Control Center services listen there on recent macOS releases",
          "`sudo lsof -nP -iTCP:5000 -sTCP:LISTEN`. Turn off AirPlay Receiver in System Settings, or move your app to another port."
        ],
        [
          "Windows fails with no visible listener",
          "Hyper-V, WSL or Docker Desktop reserved a dynamic port range and your port falls inside it",
          "`netsh int ipv4 show excludedportrange protocol=tcp`"
        ],
        [
          "Docker reports the port is already allocated",
          "A running container publishes it, or a stale `docker-proxy` survived a daemon restart",
          "`docker ps -a --format '{{.Names}}\\t{{.Ports}}'`, then `docker compose down --remove-orphans`"
        ],
        [
          "Binding to `0.0.0.0` fails but a specific IP works",
          "Another process already holds the wildcard address, which overlaps every interface",
          "Compare the Local Address column in `ss -ltnp`"
        ],
        [
          "A port below 1024 fails for a normal user",
          "This is `EACCES`, a permissions error, not `EADDRINUSE`",
          "Read the error code. Use a high port in development and a reverse proxy in production."
        ],
        [
          "The port frees itself, then reappears seconds later",
          "A supervisor is restarting the service",
          "`systemctl status <unit>`, or `docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' <id>`"
        ]
      ],
      "caption": "Cases where the port is occupied by infrastructure rather than by your own server."
    },
    {
      "t": "h2",
      "x": "Make the failure stop recurring"
    },
    {
      "t": "p",
      "x": "Finding and killing the process is a two-command fix. Not needing to do it twice a day is a code change. Three things help, in increasing order of effort."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Handle shutdown signals",
          "x": "Close the server on `SIGINT` and `SIGTERM`, and give yourself a hard deadline so a hung keep-alive connection cannot hold the socket open forever. `closeIdleConnections()` and `closeAllConnections()` exist on Node's `http.Server` from Node 18.2 onward; check your version before relying on them.",
          "code": "const server = app.listen(port);\n\nconst shutdown = () => {\n  server.close(() => process.exit(0));\n  server.closeIdleConnections();\n  setTimeout(() => process.exit(1), 5_000).unref();\n};\n\nprocess.on('SIGINT', shutdown);\nprocess.on('SIGTERM', shutdown);"
        },
        {
          "title": "Fail with a message a human can act on",
          "x": "An `EADDRINUSE` stack trace from deep inside `node:net` tells the reader nothing about which port or which project. Catch it on the server's error event and say what to do next.",
          "code": "server.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(\n      `Port ${port} is in use. Find it with:\\n` +\n      `  lsof -nP -iTCP:${port} -sTCP:LISTEN`\n    );\n    process.exit(1);\n  }\n  throw err;\n});"
        },
        {
          "title": "Let tests pick their own port",
          "x": "Binding to port 0 asks the kernel for any free port, which removes the collision entirely. This is the right default for integration tests and for anything that may run more than once in parallel on the same machine, CI included.",
          "code": "const server = app.listen(0, () => {\n  const { port } = server.address();\n  console.log(`test server on ${port}`);\n});"
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One port per project",
      "x": "Collisions cluster on 3000, 5000 and 8080 because every framework template picks them. Assign each project a distinct port in its `.env` and read it with a default, for example `const port = Number(process.env.PORT) || 4317`. It is a trivial change that quietly deletes a whole category of interruption."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "The other half of this problem: a container that cannot start, or that restarts into your port.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite symptom, checked layer by layer, when nothing is listening at all.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "Another startup failure that reads like a crash but is really a resolution problem.",
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
          "a": "On Linux or macOS, `kill $(lsof -t -iTCP:3000 -sTCP:LISTEN)`. On Windows, run `netstat -ano | findstr :3000`, read the PID from the last column, then `taskkill /PID <pid> /F`. Check the process name before you kill it, especially on a shared machine, because the row might be a database you did not mean to stop."
        },
        {
          "q": "Why does EADDRINUSE happen even though my app crashed?",
          "a": "Because something related to it is still alive. Most often a child process inherited the listening socket and outlived the parent that printed the stack trace. A supervisor such as systemd or Docker's restart policy is the next most likely explanation. The kernel releases a listening socket as soon as the last process holding it exits, so a persistent error means a process persists."
        },
        {
          "q": "Should I wait for TIME_WAIT to expire?",
          "a": "On Linux and macOS, usually not. Node, Go and most Python servers set `SO_REUSEADDR`, which lets a listener bind despite lingering `TIME_WAIT` connections. Confirm with `ss -ltn 'sport = :3000'`: if that prints a live listener, waiting will not help. Windows is less permissive, so there a short wait occasionally does clear the condition."
        },
        {
          "q": "Why can't I bind to port 5000 on my Mac?",
          "a": "Recent macOS versions run AirPlay Receiver on ports 5000 and 7000. You can disable AirPlay Receiver in System Settings, or simply move your app to a different port, which is the less disruptive choice. Confirm what holds it first with `sudo lsof -nP -iTCP:5000 -sTCP:LISTEN`, since the details vary by macOS release."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES?",
          "a": "`EADDRINUSE` means the address and port are already taken. `EACCES` means you are not permitted to bind there, typically because the port is below 1024 and you are not root, or because a local security policy blocks it. They need different fixes, so read the code rather than the prose in the message."
        },
        {
          "q": "How do I find a port conflict inside Docker?",
          "a": "List published ports with `docker ps -a --format '{{.Names}}\\t{{.Ports}}'`. If the daemon reports `port is already allocated` but no container shows the port, a stale `docker-proxy` or a half-removed network is the likely cause; `docker compose down --remove-orphans` clears most of those, and restarting the Docker daemon clears the rest. On Windows, also check for a reserved port range with `netsh int ipv4 show excludedportrange protocol=tcp`."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-23",
  "updated": "2026-10-23",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
