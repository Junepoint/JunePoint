module.exports = {
  slug: 'postgres-connection-refused',
  title: 'PostgreSQL "Connection Refused" — Fix It in Order',
  h1: 'Fixing PostgreSQL connection refused',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Work through the six layers between client and Postgres — process, port, listen_addresses, pg_hba.conf, firewall and Docker — in fault-finding order.',
  standfirst:
    '"Connection refused" means nothing was listening. "Connection timed out" means a firewall ate it. Those are different problems, and the distinction saves you an hour.',
  keywords: [
    'postgres connection refused',
    'could not connect to server postgresql',
    'pg_hba.conf no entry',
    'postgres listen_addresses',
    'psql connection error',
  ],
  published: '2026-03-05',
  updated: '2026-08-12',
  author: 'jackson',
  cardDesc: 'Six layers, checked in the right order — plus the pg_hba.conf and Docker networking traps.',

  blocks: [
    { t: 'h2', x: 'First: read which error you actually have' },
    {
      t: 'table',
      head: ['Message', 'Meaning', 'Go to'],
      rows: [
        ['`Connection refused`', 'Something answered and said no — nothing is listening on that port', 'Layers 1–3'],
        ['`Connection timed out`', 'Nothing answered at all — a firewall dropped the packet', 'Layer 5'],
        ['`no pg_hba.conf entry for host`', 'Postgres is running and reachable, but refuses this client', 'Layer 4'],
        ['`password authentication failed`', 'You reached Postgres. Credentials are wrong.', 'Layer 6'],
        ['`could not connect to server: No such file or directory`', 'A Unix-socket attempt — the socket path is wrong', 'Layer 2'],
        ['`database "x" does not exist`', 'Fully connected. Wrong database name.', 'Layer 6'],
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Refused versus timed out',
      x: '**Refused** is an active rejection: the host is reachable, nothing is bound to that port. **Timed out** means the packet vanished — almost always a firewall or security group. Getting this distinction right eliminates half the possible causes before you start.',
    },

    { t: 'h2', x: 'Layer 1: is Postgres actually running?' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS (Homebrew)
brew services list
brew services start postgresql@16

# Docker
docker ps -a | grep postgres
docker logs <container>`,
    },
    {
      t: 'p',
      x: 'If the service will not start, the logs say why — usually a port already in use, a permissions problem on the data directory, or an unclean shutdown needing recovery.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `sudo tail -50 /var/log/postgresql/postgresql-16-main.log   # Debian/Ubuntu
tail -50 /usr/local/var/log/postgresql@16.log              # macOS Homebrew`,
    },

    { t: 'h2', x: 'Layer 2: is anything listening on 5432?' },
    {
      t: 'code',
      lang: 'bash',
      x: `# What is bound to the port
sudo lsof -i :5432
sudo ss -tlnp | grep 5432

# Can you reach it at all?
nc -zv localhost 5432`,
    },
    {
      t: 'p',
      x: 'Look closely at the **address** in the output, not just the port:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `127.0.0.1:5432   ← localhost only. Remote clients will be refused.
0.0.0.0:5432     ← all interfaces. Reachable from outside.`,
    },
    {
      t: 'p',
      x: 'A second Postgres is a common cause of confusion: Homebrew’s and Postgres.app’s, or a local install and a Docker container, both wanting 5432. The one you are talking to is not the one you think you are configuring. If two versions are installed, they will be on 5432 and 5433.',
    },

    { t: 'h2', x: 'Layer 3: `listen_addresses`' },
    {
      t: 'p',
      x: 'Postgres binds to localhost only by default. To accept remote connections, edit `postgresql.conf`:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Find the file the running server is actually using
psql -U postgres -c 'SHOW config_file;'

# In postgresql.conf
listen_addresses = '*'          # all interfaces
# listen_addresses = 'localhost,10.0.1.5'   # or be specific
port = 5432`,
    },
    {
      t: 'p',
      x: 'This change requires a **restart**, not a reload — it is one of the few settings that does. `SHOW config_file` is worth knowing: on a machine with several installations, editing the wrong `postgresql.conf` is an easy hour to lose.',
    },

    { t: 'h2', x: 'Layer 4: `pg_hba.conf`' },
    {
      t: 'p',
      x: 'This is client authentication, evaluated **top to bottom, first match wins**. If you see `no pg_hba.conf entry for host`, you have reached Postgres successfully and it has declined to talk to you.',
    },
    {
      t: 'code',
      lang: 'text',
      x: `# TYPE  DATABASE  USER  ADDRESS          METHOD

local   all       all                    peer
host    all       all   127.0.0.1/32     scram-sha-256
host    all       all   ::1/128          scram-sha-256
host    all       all   10.0.0.0/8       scram-sha-256    ← add your subnet
hostssl all       all   0.0.0.0/0        scram-sha-256    ← require TLS for the internet`,
    },
    {
      t: 'p',
      x: 'Then reload — no restart needed:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `sudo systemctl reload postgresql
# or
psql -U postgres -c 'SELECT pg_reload_conf();'`,
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Never use `trust` on a network address',
      x: '`trust` means *no password at all* — anyone who can reach the port is a superuser. It is occasionally defensible for `local` on a development laptop and never acceptable for a `host` line. Compromised Postgres instances found by internet scanners are overwhelmingly this line.',
    },
    {
      t: 'p',
      x: 'The `peer` method for `local` connections matches your **operating system** username against the database role. This is why `psql mydb` works as your own user but `psql -U postgres mydb` fails on a fresh Ubuntu install — you are not logged in as `postgres`. Use `sudo -u postgres psql` instead.',
    },

    { t: 'h2', x: 'Layer 5: firewalls, security groups and the network' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Ubuntu
sudo ufw allow from 10.0.0.0/8 to any port 5432
sudo ufw status

# RHEL / Fedora
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload`,
    },
    {
      t: 'ul',
      items: [
        '**AWS RDS** — the inbound rule on the security group must allow port 5432 from your source. Check "Publicly accessible" too, and note that a public instance still needs the security group.',
        '**Cloud SQL / Azure Database** — add your IP to authorised networks, or connect through the proxy.',
        '**Kubernetes** — a `ClusterIP` service is unreachable from outside the cluster by design. Port-forward to test: `kubectl port-forward svc/postgres 5432:5432`.',
      ],
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'Do not open 5432 to the internet',
      x: 'Automated scanners find exposed Postgres instances within hours. Put it on a private subnet and reach it through a bastion, a VPN or a managed proxy. If public access is genuinely unavoidable, require TLS with `hostssl`, use strong `scram-sha-256` credentials, and restrict by source address.',
    },

    { t: 'h2', x: 'Layer 6: connection strings and credentials' },
    {
      t: 'code',
      lang: 'text',
      x: `postgresql://user:password@host:5432/dbname?sslmode=require`,
    },
    {
      t: 'ul',
      items: [
        '**Special characters in the password must be percent-encoded.** An `@` in a password splits the URL in the wrong place and produces a baffling host-not-found error. `@` is `%40`, `#` is `%23`, `/` is `%2F`.',
        '**`localhost` and `127.0.0.1` are not always equivalent.** `localhost` may resolve to IPv6 `::1`, and if Postgres only listens on IPv4 you get a refusal. Try the literal `127.0.0.1`.',
        '**Check `sslmode`.** Managed providers usually require `require` or `verify-full`. Some clients default to `prefer` and fall back silently, others fail outright.',
      ],
    },

    { t: 'h2', x: 'The Docker special case' },
    {
      t: 'p',
      x: 'Inside a container, `localhost` is *that container*, not your machine and not another container. This is the single most common Docker–Postgres error.',
    },
    {
      t: 'code',
      lang: 'yaml',
      x: `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"        # only needed to reach it from the HOST
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10

  api:
    build: .
    environment:
      # 'db' — the service name. NOT localhost.
      DATABASE_URL: postgresql://postgres:secret@db:5432/app
    depends_on:
      db:
        condition: service_healthy`,
    },
    {
      t: 'ul',
      items: [
        '**Container to container:** use the service name (`db`), on the container port (5432), regardless of any host port mapping.',
        '**Host to container:** use `localhost` and the *host* side of the mapping.',
        '**Container to host machine:** use `host.docker.internal` on Docker Desktop, or `172.17.0.1` on Linux.',
        '**Postgres takes a few seconds to become ready.** `depends_on` without `condition: service_healthy` starts your app too early, and the first connection is refused.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Environment variables are ignored on an existing volume',
      x: '`POSTGRES_PASSWORD` and `POSTGRES_DB` only take effect when the data directory is initialised. Changing them later does nothing, because the database already exists. Remove the volume (`docker compose down -v`) to reinitialise — destroying the data, so be certain first.',
    },

    { t: 'h2', x: 'A one-pass diagnostic' },
    {
      t: 'code',
      lang: 'bash',
      x: `# 1. Is the process alive?
sudo systemctl status postgresql

# 2. Is it listening, and on what address?
sudo ss -tlnp | grep 5432

# 3. Can you reach the port from the client machine?
nc -zv db-host 5432

# 4. Local connection as the postgres OS user
sudo -u postgres psql -c 'SELECT version();'

# 5. TCP connection with explicit host — bypasses the Unix socket
psql -h 127.0.0.1 -p 5432 -U myuser -d mydb

# 6. What does the server think it is configured with?
sudo -u postgres psql -c 'SHOW listen_addresses; SHOW port; SHOW hba_file;'`,
    },
    {
      t: 'p',
      x: 'Whichever step first fails identifies the layer. Step 4 succeeding while step 5 fails points squarely at `listen_addresses` or `pg_hba.conf`.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is the difference between connection refused and connection timed out?',
          a: 'Refused means the host was reachable and actively rejected the connection — nothing is listening on that port. Timed out means the packet was silently dropped, which is firewall behaviour. Refused points at the database configuration; timed out points at the network.',
        },
        {
          q: 'Why does psql work locally but my application cannot connect?',
          a: 'psql without -h uses a Unix socket, which bypasses listen_addresses and matches a "local" line in pg_hba.conf. Your application uses TCP, which needs both listen_addresses to include the interface and a matching "host" line. Test with psql -h 127.0.0.1 to reproduce what your app is doing.',
        },
        {
          q: 'Why does my Docker container get connection refused to localhost?',
          a: 'Because inside a container, localhost is the container itself. Use the Compose service name to reach another container, or host.docker.internal to reach a service on your machine.',
        },
        {
          q: 'What does "no pg_hba.conf entry for host" mean?',
          a: 'Good news, in a sense: you reached Postgres. It has no rule permitting your client IP, database and user combination. Add a matching host line and reload the configuration — no restart required.',
        },
        {
          q: 'Do I need to restart Postgres after changing configuration?',
          a: 'pg_hba.conf changes need only a reload. listen_addresses, port and shared_buffers require a full restart. SHOW pending_restart in psql lists settings you have changed that are waiting for one.',
        },
      ],
    },
  ],

  related: ['/guides/docker-container-exits-immediately/', '/tools/uuid-generator/', '/guides/ssh-permission-denied-publickey/'],
};
