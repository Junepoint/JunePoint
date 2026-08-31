module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Kill Whatever Owns the Port",
  "h1": "Port already in use: find the process, then decide what to do with it",
  "eyebrow": "Troubleshooting",
  "description": "EADDRINUSE means a live process holds the port. Find it with lsof, ss or netstat, kill it safely, and learn why it survives a crash.",
  "standfirst": "A single command identifies the process holding the port on any platform. The harder question is why an old copy of your server is still running, and this walks through each reason.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use",
    "lsof port"
  ],
  "cardDesc": "Identify the process holding a port on macOS, Linux or Windows, kill it without collateral damage, and stop it recurring.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Nine times out of ten the port is held by a live process, and that process is an earlier copy of your own server.",
        "macOS and Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Linux without lsof: `ss -lptn 'sport = :3000'`. Windows: `netstat -ano | findstr :3000`.",
        "Send `SIGTERM` before `SIGKILL`. A `kill -9` skips cleanup handlers and can leave child processes still holding the socket.",
        "`TIME_WAIT` gets blamed far more often than it deserves. Node, nginx and most servers set `SO_REUSEADDR`, which makes lingering `TIME_WAIT` entries harmless for a new listener.",
        "If genuinely nothing is listening and the bind still fails, suspect a Windows reserved port range, a `::` listener your IPv4 search missed, or `EACCES` on a privileged port."
      ]
    },
    {
      "t": "p",
      "x": "The error is not ambiguous and it is not usually a bug in your code. The operating system refused to hand you the socket because something else already has it. Your job is to identify that something, confirm it is safe to remove, and remove it. The rest of this page is about the cases where that turns out to be less obvious than it sounds."
    },
    {
      "t": "h2",
      "x": "Find it and kill it"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# macOS and Linux: what is listening on 3000?\nlsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Linux, no lsof installed (ss ships with iproute2)\nss -lptn 'sport = :3000'\n\n# Just the PIDs, for scripting\nlsof -t -iTCP:3000 -sTCP:LISTEN\n\n# Ask it to shut down cleanly first\nkill $(lsof -t -iTCP:3000 -sTCP:LISTEN)\n\n# Only if it ignores that\nkill -9 $(lsof -t -iTCP:3000 -sTCP:LISTEN)"
    },
    {
      "t": "p",
      "x": "The flags matter. `-n` skips reverse DNS lookups and `-P` skips port-name lookups, which is the difference between an instant answer and a two-second hang. `-sTCP:LISTEN` is the important one: without it, `lsof -i:3000` also returns established connections *to* port 3000, so a browser tab or a `curl` still in flight shows up alongside the actual server. Kill that PID list blindly and you may kill your browser."
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# Windows, PowerShell\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Turn the PID into a name before you kill it\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# Windows, cmd\nnetstat -ano | findstr :3000\ntaskkill /PID 12345 /F"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Check the name before the kill",
      "x": "`netstat -ano | findstr :3000` matches `:3000` anywhere in the line, so it also returns a connection to a remote port 3000 and, on a busy machine, entries like `:30001`. Always resolve the PID to a process name first. If the answer is `System` (PID 4) or a service you did not start, you are looking at a different problem, not a stale dev server."
    },
    {
      "t": "h2",
      "x": "Read the error before you act on it"
    },
    {
      "t": "p",
      "x": "Every runtime words this differently, and the wording tells you which address family is affected. Node, for example, reports the address it tried to bind, not just the port."
    },
    {
      "t": "table",
      "head": [
        "Runtime",
        "What you see",
        "Reads as"
      ],
      "rows": [
        [
          "Node.js",
          "`Error: listen EADDRINUSE: address already in use :::3000`",
          "Tried to bind the IPv6 wildcard on 3000"
        ],
        [
          "Python (Linux)",
          "`OSError: [Errno 98] Address already in use`",
          "errno 98 is `EADDRINUSE` on Linux"
        ],
        [
          "Python (macOS)",
          "`OSError: [Errno 48] Address already in use`",
          "Same condition, different errno number"
        ],
        [
          "Django dev server",
          "`Error: That port is already in use.`",
          "Wrapped and friendlier, same cause"
        ],
        [
          "Java / Spring Boot",
          "`java.net.BindException: Address already in use`",
          "Often nested inside a startup failure trace"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`",
          "Names the exact address and errno"
        ],
        [
          "Docker",
          "`Bind for 0.0.0.0:8080 failed: port is already allocated`",
          "The host port, not a port inside the container"
        ]
      ],
      "caption": "Errno numbers are platform-specific: 98 on Linux, 48 on macOS and the BSDs."
    },
    {
      "t": "p",
      "x": "Those three colons in `:::3000` confuse people constantly. It is not a typo. It is the IPv6 wildcard address `::` followed by the `:3000` separator and port. A process bound to `::` on a dual-stack system with `IPV6_V6ONLY` disabled, which is the default on Linux, also occupies the IPv4 port. That is why `lsof -i4 -P -n | grep 3000` can come back empty while the bind keeps failing. Search both families or search neither."
    },
    {
      "t": "h2",
      "x": "Why the port is still busy after a crash"
    },
    {
      "t": "p",
      "x": "This is the part people actually want explained. The server \"crashed\", the terminal is back at a prompt, and yet the port is gone. Here is what is normally happening, roughly in order of frequency."
    },
    {
      "t": "h3",
      "x": "The parent died and a child inherited the socket"
    },
    {
      "t": "p",
      "x": "Process managers, watchers and build tools spawn children. `nodemon`, `next dev`, `concurrently`, `pm2`, Vite's dependency optimizer and anything wrapped in a shell script all do it. When the parent is killed with `SIGKILL`, it never gets the chance to signal its children. The child keeps running, keeps the listening socket open, and is now reparented to init or launchd with no obvious connection to the command you originally typed. `ps -o pid,ppid,command -p <pid>` on the PID that `lsof` returned will show you a parent PID of 1, which is the giveaway."
    },
    {
      "t": "h3",
      "x": "The process is stuck, not dead"
    },
    {
      "t": "p",
      "x": "`Ctrl+C` sends `SIGINT`. If your code registers a `SIGINT` handler and that handler awaits something that never resolves, such as draining a connection pool against a database that is already gone, the process hangs with the socket still open. Your shell prompt returns because the foreground job stopped reading input, but the process is very much alive. Check with `ps -p <pid>`."
    },
    {
      "t": "h3",
      "x": "A container still owns the host port"
    },
    {
      "t": "p",
      "x": "Docker publishes ports through the daemon, so a stopped-but-not-removed container, or a `docker-proxy` process that outlived its container, can hold a host port while `lsof` reports something you do not recognise. `docker ps -a --filter publish=8080` lists every container claiming that host port, running or not. If a restart policy is set, killing the process by PID achieves nothing at all: the daemon starts it again immediately."
    },
    {
      "t": "h3",
      "x": "TIME_WAIT, and why it is usually the wrong answer"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "\"Just wait 60 seconds for TIME_WAIT to clear\" is bad advice most of the time",
      "x": "It is the most repeated answer to this error and it is usually wrong. `SO_REUSEADDR` exists precisely so a listener can bind a port that has connections sitting in `TIME_WAIT`, and Node, nginx, Apache and `http.server` set it by default. If your server sets `SO_REUSEADDR` and the bind still fails, a live process holds the port and waiting will not help. You will burn a minute, retry, get the same error, and still not have looked at `lsof`. The advice is sound only for the narrower case of a raw socket server that never set the option, which includes Python's `socketserver.TCPServer` when subclassed directly, since its `allow_reuse_address` defaults to false."
    },
    {
      "t": "p",
      "x": "Worth separating two things that sound alike. `SO_REUSEADDR` lets you bind over `TIME_WAIT` remnants. `SO_REUSEPORT`, which is a different option, lets multiple live processes bind the identical address and port at the same time so the kernel can load-balance across them. If your code sets `SO_REUSEPORT` you will not see this error at all; you will see two servers quietly splitting traffic and half your requests hitting stale code. That failure is considerably more annoying to diagnose than a clean `EADDRINUSE`."
    },
    {
      "t": "h2",
      "x": "Killing it without collateral damage"
    },
    {
      "t": "p",
      "x": "Reach for `SIGTERM` first, every time. It gives the process a chance to close its listening socket, flush logs, release file locks, deregister from a service discovery system and shut down its own children. `SIGKILL` gives it none of that. On a dev server the cost is usually zero, but on anything holding a lock file or a partially written database you have just created a second problem to debug."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Polite, then firm\nPID=$(lsof -t -iTCP:3000 -sTCP:LISTEN)\nkill -TERM \"$PID\"\nsleep 2\nkill -0 \"$PID\" 2>/dev/null && kill -9 \"$PID\"\n\n# Kill the whole process group, which catches inherited children.\n# The minus sign means \"group\", and PGID is not always the same as PID.\nps -o pgid= -p \"$PID\"\nkill -TERM -<PGID>\n\n# fuser is blunt: it kills every process with that port open,\n# including established client connections. Preview first.\nfuser -n tcp 3000\nfuser -k -n tcp 3000"
    },
    {
      "t": "p",
      "x": "Avoid `sudo kill -9 $(lsof -t -i:3000)` as a reflex, which is the form that circulates most widely. It drops the `LISTEN` filter, so it includes clients. It uses `-9`, so nothing gets to clean up. And it adds `sudo`, so it will happily kill a system daemon that had a perfectly good reason to be there. If the process needed `sudo` to kill, that is a signal to look at what it is before killing it, not to escalate."
    },
    {
      "t": "h2",
      "x": "When nothing is listening and the bind still fails"
    },
    {
      "t": "p",
      "x": "Occasionally `lsof` and `ss` both come back empty and the port is still refused. A few real causes:"
    },
    {
      "t": "ul",
      "items": [
        "**Windows reserved port ranges.** Hyper-V, WSL2, Docker Desktop and the Windows NAT service reserve blocks of ephemeral ports, and those blocks move between reboots. Nothing is listening, but the range is excluded. Check with `netsh interface ipv4 show excludedportrange protocol=tcp`. If your port sits inside a reserved range, pick a different port or reconfigure the dynamic port range; killing processes will not help.",
        "**It is `EACCES`, not `EADDRINUSE`.** Binding below port 1024 without privileges gives you `Error: listen EACCES: permission denied 0.0.0.0:80`. Different error, different fix. People conflate the two from memory and then spend twenty minutes hunting a process that was never there.",
        "**macOS reserves some low-numbered ports for its own services.** Port 5000 in particular is commonly taken by AirPlay Receiver on recent macOS versions, which trips up Flask defaults. Confirm the owner with `lsof` before assuming, then either disable that receiver in System Settings or move your app to another port. Apple changes these defaults between releases, so verify against your own machine rather than trusting a blog post, including this one.",
        "**You are looking in the wrong network namespace.** Inside a container, `ss` shows only that container's namespace. A host process holding the port is invisible from in there, and the reverse is also true.",
        "**The wrong interface.** A process bound to `127.0.0.1:3000` blocks another bind to `0.0.0.0:3000`, because the wildcard includes the loopback address. Binding order matters: the specific one can succeed first, then the wildcard fails."
      ]
    },
    {
      "t": "h2",
      "x": "Making it stop happening"
    },
    {
      "t": "p",
      "x": "Two changes remove most repeat occurrences. Handle termination signals so the socket actually closes, and fail with a message that says what to do instead of a raw stack trace."
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "const server = app.listen(port);\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is in use. Find the owner with:`);\n    console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);\n    process.exit(1);\n  }\n  throw err;\n});\n\nfunction shutdown(signal) {\n  console.log(`${signal} received, closing server`);\n  server.close(() => process.exit(0));\n  // Do not hang forever on a connection that will not drain.\n  setTimeout(() => process.exit(1), 10000).unref();\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));\nprocess.on('SIGINT', () => shutdown('SIGINT'));"
    },
    {
      "t": "p",
      "x": "The `unref()` on that timeout is deliberate. Without it, the timer itself keeps the event loop alive for the full ten seconds even after every connection has closed, so a clean shutdown feels like a hang. With it, the timer only fires if something else is still keeping the process up."
    },
    {
      "t": "p",
      "x": "For tests and short-lived tools, stop picking ports at all. Binding to port `0` asks the kernel for any free port, and you read back the real one from `server.address().port`. That eliminates the entire class of problem for parallel test runs, which is where it bites hardest: two Jest workers racing for port 3001 produce a flaky failure that looks like a timeout rather than a bind error."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A note on the npm shortcut",
      "x": "`npx kill-port 3000` works and is convenient. It is also a network round trip and an unpinned package execution, and it does exactly what one `lsof` invocation does. Fine on your own laptop, worth thinking twice about inside CI or on a shared host."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill the process running on port 3000?",
          "a": "On macOS or Linux: kill $(lsof -t -iTCP:3000 -sTCP:LISTEN). Keep the -sTCP:LISTEN filter so you only match the server, not clients connected to it. On Windows, run netstat -ano | findstr :3000, confirm the process name with Get-Process -Id <pid>, then taskkill /PID <pid> /F. Try a normal kill before adding -9 or /F."
        },
        {
          "q": "Why do I get EADDRINUSE when nothing is running?",
          "a": "Usually something is running and you have not found it yet. Check both address families, because a process on the IPv6 wildcard :: also occupies the IPv4 port on a dual-stack host. Check for orphaned children whose parent PID is now 1. Check for stopped Docker containers still publishing the port. If lsof and ss are genuinely empty, look at Windows reserved port ranges, a macOS system service on a low port, or an EACCES permission error you have misremembered as EADDRINUSE."
        },
        {
          "q": "Do I have to wait for TIME_WAIT to expire?",
          "a": "Almost never. SO_REUSEADDR lets a new listener bind a port that has old connections in TIME_WAIT, and Node, nginx and Python's http.server all set it by default. If your server sets it, the failure means a live process holds the port and waiting changes nothing. The wait-it-out advice applies only to raw socket code that never set the option, such as a direct socketserver.TCPServer subclass."
        },
        {
          "q": "What does :::3000 with three colons mean?",
          "a": "It is the IPv6 wildcard address :: followed by the colon separator and the port number. Node prints the address it tried to bind, so :::3000 means it attempted the IPv6 any-address on port 3000. On Linux that binding normally covers IPv4 as well, which is why an IPv4-only search can look empty."
        },
        {
          "q": "Is kill -9 safe for a dev server?",
          "a": "Usually harmless, occasionally not. SIGKILL cannot be caught, so the process never runs its shutdown handler: no closed sockets, no released lock files, no flushed writes, no signal passed to its own children. Those children are the reason the port is sometimes still busy after the kill appears to succeed. Send SIGTERM, give it a couple of seconds, then escalate."
        },
        {
          "q": "Why is port 5000 already in use on my Mac?",
          "a": "Recent macOS versions run AirPlay Receiver on port 5000, which collides with the Flask default. Confirm the owner with lsof -nP -iTCP:5000 -sTCP:LISTEN rather than assuming, since Apple moves these defaults between releases. Then either turn the receiver off in System Settings or run your app on a different port, which is the less disruptive choice."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "When PID 1 stops the container stops, and the port binding goes with it.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The mirror image of this error: nothing is listening where you expected.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnosing CORS errors",
          "desc": "Once the server is finally up, the next thing the browser blocks.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-08-31",
  "updated": "2026-08-31",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/"
  ]
};
