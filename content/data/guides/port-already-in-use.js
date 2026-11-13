module.exports = {
  "slug": "port-already-in-use",
  "title": "EADDRINUSE: Find and Free a Port That Is In Use",
  "h1": "Port already in use: finding the process and freeing the port",
  "eyebrow": "Troubleshooting",
  "description": "Why EADDRINUSE happens, how to find the process holding a port on Linux, macOS and Windows, and why a crashed server often leaves the port occupied.",
  "standfirst": "EADDRINUSE means a bind() call was refused because something already owns that address and port. Here is how to identify the owner, stop it safely, and understand why it survives a crash.",
  "keywords": [
    "eaddrinuse",
    "port already in use",
    "kill process on port",
    "address already in use node",
    "lsof port 3000"
  ],
  "cardDesc": "Identify what holds a port, kill it without collateral damage, and fix the orphaned-child problem behind most cases.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`EADDRINUSE` is the kernel refusing `bind()`. Something already holds that address and port, so identify the holder before killing anything.",
        "Linux: `sudo ss -ltnp 'sport = :3000'`. Linux or macOS: `sudo lsof -nP -iTCP:3000 -sTCP:LISTEN`. Windows: `Get-NetTCPConnection -LocalPort 3000 -State Listen`.",
        "The popular `kill -9 $(lsof -ti:3000)` one-liner is wider than it looks. Without `-sTCP:LISTEN` it also matches sockets *connected* to port 3000 somewhere else, so it can kill a client you wanted to keep.",
        "After a crash the usual culprit is an orphaned child process, not `TIME_WAIT`. Listening sockets in most runtimes set `SO_REUSEADDR`, so a genuinely dead server does not hold the port.",
        "If no process appears to hold it, suspect Docker's published port mappings, a Windows reserved port range, or AirPlay Receiver on macOS ports 5000 and 7000."
      ]
    },
    {
      "t": "lede",
      "x": "This is one of the few errors that states precisely what failed and nothing at all about who caused it. The stack trace points at your own `listen()` call, which is never where the problem is. Everything useful happens outside your process, so the fix is an investigation of the machine rather than of the code."
    },
    {
      "t": "h2",
      "x": "What the error actually means"
    },
    {
      "t": "p",
      "x": "Your process asked the kernel for a specific local address and port. The kernel said no, because an existing socket already claims it in a way that conflicts. The request was well formed, the permissions were fine, the port number was valid. Another socket simply got there first."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:...)\n    ...\n  code: 'EADDRINUSE',\n  errno: -98,\n  syscall: 'listen',\n  address: '::',\n  port: 3000"
    },
    {
      "t": "p",
      "x": "The `errno` value is worth recognising because some log pipelines strip the symbolic name and leave only the number. It is 98 on Linux and 48 on macOS and the other BSDs. Negative in Node, because libuv negates errno values. The `address` and `port` fields tell you exactly what was requested, which matters more than it first appears."
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
          "`OSError: [Errno 98] Address already in use`"
        ],
        [
          "Go",
          "`listen tcp :8080: bind: address already in use`"
        ],
        [
          "nginx",
          "`nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`"
        ],
        [
          "Spring Boot",
          "`Web server failed to start. Port 8080 was already in use.`"
        ]
      ],
      "caption": "One errno, five wordings. Substitute 48 for 98 on macOS."
    },
    {
      "t": "p",
      "x": "Pay attention to which address is in the message. `:::3000` is the IPv6 wildcard, `0.0.0.0:3000` is the IPv4 wildcard, and `127.0.0.1:3000` is loopback only. On Linux with the default `net.ipv6.bindv6only=0`, a wildcard IPv6 bind also accepts IPv4 traffic, so a process listening on `:::3000` will block a later attempt to bind `0.0.0.0:3000`. The reverse also happens. This is why the address in your error sometimes does not literally match the address in your `lsof` output, and why people conclude the tools are lying to them."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "EADDRINUSE is not EACCES",
      "x": "`Error: listen EACCES: permission denied 0.0.0.0:80` is a different failure. Ports below 1024 require privileges on Unix systems, and Windows reserves ranges of its own. If you see `EACCES`, the port is probably free and you are not allowed to have it. Do not go hunting for a process."
    },
    {
      "t": "h2",
      "x": "Find the process that holds it"
    },
    {
      "t": "p",
      "x": "Ask for listening sockets specifically. A general query for port 3000 returns every socket with 3000 at either end, which includes your browser's connection to someone else's server on that port."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Linux: listening sockets on 3000, with the owning process\nsudo ss -ltnp 'sport = :3000'\n\n# Linux or macOS: the same question, numeric output, listeners only\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN\n\n# Everything touching port 3000, inbound and outbound\nsudo lsof -nP -i :3000\n\n# Shortest answer on Linux: just the PIDs\nfuser 3000/tcp"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "# PowerShell: who is listening\nGet-NetTCPConnection -LocalPort 3000 -State Listen |\n  Select-Object LocalAddress, LocalPort, OwningProcess\n\n# Turn that PID into a name\nGet-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess\n\n# cmd.exe equivalent\nnetstat -ano | findstr :3000\ntasklist /FI \"PID eq 1234\"\ntaskkill /PID 1234 /F"
    },
    {
      "t": "p",
      "x": "Run these with elevated privileges. Without root, `lsof` silently omits sockets owned by other users and `ss -p` omits the process column, so you get a confident empty result and start believing in ghosts. On macOS, `lsof` without `sudo` is a particularly common source of this confusion."
    },
    {
      "t": "p",
      "x": "One thing you can rule out immediately: a process shown as `<defunct>` in `ps` output. A zombie has already exited and released every file descriptor it held, so it cannot own a listening socket. If a zombie is the only suspicious thing you can see, the real holder is somewhere else, usually its parent."
    },
    {
      "t": "h2",
      "x": "Stop it without collateral damage"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "The famous one-liner is sharper than advertised",
      "x": "`kill -9 $(lsof -ti:3000)` is the answer you will find everywhere, and it is genuinely risky. `lsof -i :3000` matches a socket whose *local or remote* port is 3000. If you have a browser tab, a `curl`, or a service client connected to something on port 3000 elsewhere, its PID lands in that list too and gets a `SIGKILL`. Add `-sTCP:LISTEN`. Read the output before you pipe it into `kill`."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# 1. Look at what you are about to kill\nsudo lsof -nP -iTCP:3000 -sTCP:LISTEN\nps -o pid,ppid,user,command -p 51234\n\n# 2. Ask politely first\nkill 51234\n\n# 3. Only if it is still there\nkill -9 51234"
    },
    {
      "t": "p",
      "x": "`kill` sends `SIGTERM`, which gives the process a chance to close connections and flush state. `kill -9` sends `SIGKILL`, which cannot be caught or ignored. For a stuck dev server that distinction rarely matters. For a database, a queue consumer mid-batch, or anything holding a write buffer, it very much does. Try the signal that allows cleanup first and escalate after a few seconds."
    },
    {
      "t": "p",
      "x": "If the port is occupied again within a second of a successful kill, you are fighting a supervisor rather than a process. Something is restarting it: `pm2 list`, `systemctl status <unit>`, `docker ps`, `launchctl list` on macOS. Stop the supervisor, not the child. A unit with `Restart=always` will win this argument indefinitely."
    },
    {
      "t": "h2",
      "x": "Why the port is still held after a crash"
    },
    {
      "t": "p",
      "x": "This is where most of the real confusion lives. Your terminal returned to a prompt, the logs stopped, the process looks gone. The port says otherwise. In the overwhelming majority of cases, the server is still running and you killed its parent."
    },
    {
      "t": "p",
      "x": "Consider `npm run dev`. npm spawns a shell, the shell spawns `node`, and `node` may spawn workers of its own. Ctrl-C delivers `SIGINT` to the foreground process group, which usually covers the whole tree. Usually. A child that called `setsid` or was spawned with `detached: true` is in a different process group and never sees the signal. A wrapper script that traps `SIGINT` without forwarding it has the same effect. The visible process dies, the one holding the socket does not."
    },
    {
      "t": "p",
      "x": "Other reliable ways to orphan a listener: closing a terminal tab or IDE panel rather than stopping the task, detaching a debugger from a process that was started under it, backgrounding a server with `&` and then forgetting, running `concurrently` or `nodemon` in a shell that gets killed abruptly, or a container that was stopped while its entrypoint had forked. Containers that exit for related reasons are covered in [why a Docker container exits immediately](/guides/docker-container-exits-immediately/)."
    },
    {
      "t": "p",
      "x": "So look for the orphan by name rather than by port, then confirm with the socket query:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# Find the tree, including the parent you did not expect\nps -ef --forest | grep -i node\n\n# macOS has no --forest; this is close enough\nps -A -o pid,ppid,etime,command | grep -i node\n\n# Kill an entire process group (note the leading dash on the PGID)\nkill -- -51234"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "TIME_WAIT is usually not your problem",
      "x": "The widely repeated explanation is that the old socket sits in `TIME_WAIT` for up to two minutes and blocks the rebind. For *listening* sockets this is mostly folklore. libuv, Go's net package, nginx and most other server stacks set `SO_REUSEADDR` on the listening socket, which exists precisely so a restart is not blocked by lingering connections from the previous instance. If your restart is refused, something is almost certainly alive. Check `ss -tnp state time-wait '( sport = :3000 )'` if you want to confirm, and spend your time on the process tree instead. Windows is the exception worth remembering: it binds exclusively by default and its semantics differ, so treat Windows results on their own terms."
    },
    {
      "t": "h2",
      "x": "When genuinely nothing holds the port"
    },
    {
      "t": "p",
      "x": "Occasionally the tools are right and there is no process. Three causes account for nearly all of it."
    },
    {
      "t": "h3",
      "x": "Docker still has the mapping"
    },
    {
      "t": "p",
      "x": "A published port is held by the Docker proxy or by a kernel NAT rule, not by anything that looks like your application. A container stuck in a restart loop reclaims the port between your checks, which produces a maddening intermittent failure."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "docker ps -a --format '{{.Names}}\\t{{.Status}}\\t{{.Ports}}'\ndocker compose down   # releases mappings for the whole project"
    },
    {
      "t": "h3",
      "x": "Windows has reserved the range"
    },
    {
      "t": "p",
      "x": "Hyper-V, WSL2 and the Windows NAT service reserve blocks of dynamic ports, and a bind inside a reserved block fails with nothing listening. Run this in an elevated Windows prompt:"
    },
    {
      "t": "code",
      "lang": "powershell",
      "x": "netsh interface ipv4 show excludedportrange protocol=tcp\n\n# Often clears a stale reservation (drops WSL and Hyper-V networking briefly)\nnet stop winnat\nnet start winnat"
    },
    {
      "t": "h3",
      "x": "macOS AirPlay Receiver owns 5000 and 7000"
    },
    {
      "t": "p",
      "x": "Since macOS Monterey, AirPlay Receiver listens on ports 5000 and 7000 as part of `ControlCenter`, which breaks the default port of several Python and Rails-adjacent dev servers. You can turn the receiver off in System Settings or move your server to another port. The exact settings path has moved between releases, so search Settings for AirPlay rather than trusting a written path, including this one. As of November 2026 this behaviour still applies to current macOS versions; verify on your own machine with `sudo lsof -nP -iTCP:5000 -sTCP:LISTEN`."
    },
    {
      "t": "p",
      "x": "Systemd socket activation is a rarer fourth cause. The socket unit holds the port and starts the service on demand, so the port is bound even when the service is not running. `systemctl list-sockets` will show it."
    },
    {
      "t": "h2",
      "x": "Make it stop happening"
    },
    {
      "t": "p",
      "x": "Two changes remove most repeat occurrences: shut down cleanly, and fail with a message that tells you what to do."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(port, () => {\n  console.log(`listening on ${port}`)\n})\n\nserver.on('error', (err) => {\n  if (err.code === 'EADDRINUSE') {\n    console.error(`Port ${port} is taken. Try: lsof -nP -iTCP:${port} -sTCP:LISTEN`)\n    process.exit(1)\n  }\n  throw err\n})\n\nconst shutdown = () => {\n  server.close(() => process.exit(0))\n  // Keep-alive sockets will otherwise hold the server open indefinitely.\n  server.closeIdleConnections?.()\n  setTimeout(() => process.exit(1), 5000).unref()\n}\n\nprocess.on('SIGINT', shutdown)\nprocess.on('SIGTERM', shutdown)"
    },
    {
      "t": "p",
      "x": "`server.close()` stops accepting new connections but waits for existing ones, and HTTP keep-alive means an idle browser tab can keep it waiting. `closeIdleConnections()` and `closeAllConnections()` were added in Node 18.2; as of November 2026 they are present in all maintained release lines, but check yours with `node -v` before relying on them. The timeout with `.unref()` is a backstop so a hung shutdown still terminates instead of leaving you the exact orphan you are trying to prevent."
    },
    {
      "t": "p",
      "x": "In tests, stop choosing ports at all. Bind to port 0 and let the kernel allocate a free one:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const server = app.listen(0)\nconst { port } = server.address()\n// Point the test client at `port`. Parallel test runs stop colliding.\n"
    },
    {
      "t": "p",
      "x": "For containers, `docker run --init` installs a minimal init process as PID 1 so signals reach your application and reaped children do not accumulate. And resist `pkill -f node` as a habit. It is satisfying, and it will eventually take out your editor's language server, a watcher, and something you had carefully left running."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I kill whatever is using port 3000?",
          "a": "Find the listener first: `sudo lsof -nP -iTCP:3000 -sTCP:LISTEN` on macOS or Linux, or `sudo ss -ltnp 'sport = :3000'` on Linux. Check the PID with `ps -o pid,ppid,user,command -p <pid>`, then `kill <pid>` and only escalate to `kill -9 <pid>` if it ignores you. On Windows, `Get-NetTCPConnection -LocalPort 3000 -State Listen` gives you `OwningProcess`, and `taskkill /PID <pid> /F` ends it."
        },
        {
          "q": "Why is the port still in use after I pressed Ctrl-C?",
          "a": "Almost always because a child process survived. Ctrl-C signals the foreground process group, and a child that was detached or spawned through a wrapper that does not forward signals stays alive holding the socket. Run `ps -ef --forest | grep -i node` to find it, or kill the whole group with `kill -- -<pgid>`."
        },
        {
          "q": "Does TIME_WAIT cause EADDRINUSE?",
          "a": "Rarely, for a listening socket. Node, Go, nginx and most server stacks set `SO_REUSEADDR`, which is specifically there so lingering connections from a previous instance do not block a restart. If your bind is refused, look for a live process before blaming TIME_WAIT. Windows is the main exception, since it binds exclusively by default."
        },
        {
          "q": "What is the difference between EADDRINUSE and EACCES?",
          "a": "`EADDRINUSE` means the address and port are taken. `EACCES` means you are not permitted to bind them, typically a port below 1024 without privileges, or a Windows reserved range. Searching for a process to kill will not help with `EACCES`."
        },
        {
          "q": "Can two processes listen on the same port?",
          "a": "Yes, if both set `SO_REUSEPORT` on Linux 3.9 or later, which is how nginx and some Go servers spread accepts across workers. The confusing part is the symptom: instead of `EADDRINUSE` you get two live instances sharing traffic, so half your requests hit stale code. If responses look inconsistent rather than failing, check for duplicate listeners."
        },
        {
          "q": "Why does Windows say the port is in use when nothing is running?",
          "a": "Hyper-V, WSL2 and the Windows NAT service reserve dynamic port ranges, and binds inside a reserved range fail with no process listening. Run `netsh interface ipv4 show excludedportrange protocol=tcp` in an elevated prompt to see the reservations. Restarting `winnat` often clears a stale one, at the cost of briefly dropping WSL and Hyper-V networking."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Docker container exits immediately",
          "desc": "Exit codes, PID 1 and why a container that looks stopped may still hold its ports.",
          "href": "/guides/docker-container-exits-immediately/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "PostgreSQL connection refused",
          "desc": "The opposite failure: nothing is listening where you expected something to be.",
          "href": "/guides/postgres-connection-refused/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "The other error that stops a dev server before it ever reaches listen().",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-13",
  "updated": "2026-11-13",
  "author": "jackson",
  "related": [
    "/guides/cannot-find-module-node/",
    "/reviews/best-crm-for-small-business/"
  ]
};
