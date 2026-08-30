module.exports = {
  slug: 'postgres-connection-refused',
  title: 'PostgreSQL "Connection Refused": Check Each Layer in Order',
  h1: 'Fixing PostgreSQL connection refused',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Trace a PostgreSQL connection failure through the process, listener, listen_addresses, pg_hba.conf, network and client configuration.',
  standfirst:
    'A refused connection and a timed-out connection point to different layers. Identify the exact error first, then test each boundary from the server process outward.',
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
  cardDesc: 'Check the process, listener, access rules, network and Docker address from the server outward.',

  blocks: [
    { t: 'h2', x: 'Start with the exact error' },
    {
      t: 'table',
      head: ['Message', 'Meaning', 'Go to'],
      rows: [
        ['`Connection refused`', 'The host rejected the TCP connection; nothing is listening on that address and port', 'Layers 1–3'],
        ['`Connection timed out`', 'No TCP response arrived; a firewall or network path may have dropped the packet', 'Layer 5'],
        ['`no pg_hba.conf entry for host`', 'Postgres is running and reachable, but refuses this client', 'Layer 4'],
        ['`password authentication failed`', 'You reached Postgres. Credentials are wrong.', 'Layer 6'],
        ['`could not connect to server: No such file or directory`', 'A Unix-socket attempt used a path where no server socket exists', 'Layer 2'],
        ['`database "x" does not exist`', 'Fully connected. Wrong database name.', 'Layer 6'],
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Refused versus timed out',
      x: '**Refused** is an active TCP rejection, which confirms the host was reachable but no process accepted the connection on that address and port. **Timed out** means no response came back, commonly because of a firewall, security group or broken route. Use the distinction to choose between server-listener and network checks.',
    },

    { t: 'h2', x: 'Layer 1: is Postgres actually running?' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Linux service
sudo systemctl status postgresql
sudo systemctl start postgresql

    # Homebrew on macOS
brew services list
brew services start postgresql@16

    # Docker container
docker ps -a | grep postgres
docker logs <container>`,
    },
    {
      t: 'p',
      x: 'If the service does not start, read its logs before changing connection settings. Common causes include another process using the port, incorrect data-directory permissions and recovery after an unclean shutdown.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `sudo tail -50 /var/log/postgresql/postgresql-16-main.log   # Debian or Ubuntu log
    tail -50 /usr/local/var/log/postgresql@16.log              # Homebrew log on macOS`,
    },

    { t: 'h2', x: 'Layer 2: is anything listening on 5432?' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Show the process bound to the port
sudo lsof -i :5432
sudo ss -tlnp | grep 5432

    # Test whether the port is reachable
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
      x: 'Multiple installations can obscure which server you are configuring. Homebrew and Postgres.app, or a local service and a container, may both try to use 5432. Check the process bound to each port; a second installed version may have moved to 5433.',
    },

    { t: 'h2', x: 'Layer 3: `listen_addresses`' },
    {
      t: 'p',
      x: 'Postgres normally binds to localhost by default. To accept a remote TCP connection, edit the `postgresql.conf` used by the running process:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Find the active configuration file
psql -U postgres -c 'SHOW config_file;'

    # Settings for postgresql.conf
    listen_addresses = '*'          # Listen on every interface
    # listen_addresses = 'localhost,10.0.1.5'   # Bind only selected addresses
port = 5432`,
    },
    {
      t: 'p',
      x: 'A `listen_addresses` change requires a **restart**, not only a reload. Use `SHOW config_file` to confirm the active file, especially on a machine with several PostgreSQL installations.',
    },

    { t: 'h2', x: 'Layer 4: `pg_hba.conf`' },
    {
      t: 'p',
      x: '`pg_hba.conf` controls client authentication and is evaluated **top to bottom; the first matching rule wins**. An error saying `no pg_hba.conf entry for host` confirms that the connection reached PostgreSQL but matched no permitted rule.',
    },
    {
      t: 'code',
      lang: 'text',
      x: `# Rule columns: TYPE  DATABASE  USER  ADDRESS          METHOD

local   all       all                    peer
host    all       all   127.0.0.1/32     scram-sha-256
host    all       all   ::1/128          scram-sha-256
host    all       all   10.0.0.0/8       scram-sha-256    ← add your subnet
hostssl all       all   0.0.0.0/0        scram-sha-256    ← require TLS for the internet`,
    },
    {
      t: 'p',
      x: 'Reload the configuration after editing this file; a full restart is not required:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `sudo systemctl reload postgresql
    # Reload through SQL instead
psql -U postgres -c 'SELECT pg_reload_conf();'`,
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Never use `trust` on a network address',
      x: '`trust` accepts the database identity without a password. On a `host` rule, anyone who can reach the port can claim an allowed role, including a superuser role. Limit any development use to an appropriate local connection; use authenticated methods such as `scram-sha-256` for network clients.',
    },
    {
      t: 'p',
      x: 'For `local` connections, the `peer` method compares the **operating-system** user with the requested database role. On a fresh Ubuntu installation, `psql mydb` may work as your own user while `psql -U postgres mydb` fails because the shell user is not `postgres`. Use `sudo -u postgres psql` for that administrative role.',
    },

    { t: 'h2', x: 'Layer 5: firewalls, security groups and the network' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Ubuntu firewall
sudo ufw allow from 10.0.0.0/8 to any port 5432
sudo ufw status

    # RHEL or Fedora firewall
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload`,
    },
    {
      t: 'ul',
      items: [
        '**AWS RDS:** the security group needs an inbound rule allowing port 5432 from the client source. Also check "Publicly accessible" when connecting over the public internet; that setting does not replace the security-group rule.',
        '**Cloud SQL / Azure Database:** add the client IP to the provider’s authorised network rules or connect through the supported proxy.',
        '**Kubernetes:** a `ClusterIP` service is reachable only from within the cluster. To test from your machine, run `kubectl port-forward svc/postgres 5432:5432`.',
      ],
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'Do not open 5432 to the internet',
      x: 'Automated scanners continuously probe public database ports. Prefer a private subnet reached through a bastion, VPN or managed proxy. When public access is unavoidable, restrict source addresses, require TLS with `hostssl`, and use strong `scram-sha-256` credentials.',
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
        '**Percent-encode special characters in the password.** An `@` can split the URL at the wrong point and produce a misleading host error. `@` is `%40`, `#` is `%23`, and `/` is `%2F`.',
        '**`localhost` and `127.0.0.1` may resolve differently.** `localhost` can resolve to IPv6 `::1`; a server listening only on IPv4 will refuse that connection. Test with the literal `127.0.0.1`.',
        '**Check `sslmode`.** Managed providers commonly require `require` or `verify-full`. Client defaults vary: some prefer TLS and fall back, while others fail when their expected mode is unavailable.',
      ],
    },

    { t: 'h2', x: 'The Docker special case' },
    {
      t: 'p',
      x: 'Inside a container, `localhost` refers to that container’s own network namespace. It does not refer to the host or to another Compose service.',
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
      - "5432:5432"        # Publish only for host access
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10

  api:
    build: .
    environment:
      # Use the db service name instead of localhost
      DATABASE_URL: postgresql://postgres:secret@db:5432/app
    depends_on:
      db:
        condition: service_healthy`,
    },
    {
      t: 'ul',
      items: [
        '**Container to container:** use the Compose service name (`db`) and the container port (5432), regardless of the host port mapping.',
        '**Host to container:** use `localhost` with the host side of the published port mapping.',
        '**Container to host machine:** use `host.docker.internal` on Docker Desktop or `172.17.0.1` on a typical Linux bridge.',
        '**Account for database startup time.** Without `condition: service_healthy`, `depends_on` starts the application after the database container starts, not after PostgreSQL is ready for connections.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Environment variables are ignored on an existing volume',
      x: '`POSTGRES_PASSWORD` and `POSTGRES_DB` apply only when the image initializes an empty data directory. Changing them later does not alter the existing database. Removing the volume with `docker compose down -v` forces reinitialization and destroys its data, so confirm that loss is acceptable first.',
    },

    { t: 'h2', x: 'A one-pass diagnostic' },
    {
      t: 'code',
      lang: 'bash',
      x: `# 1. Check whether the process is running
sudo systemctl status postgresql

    # 2. Find the listening address
sudo ss -tlnp | grep 5432

    # 3. Test the port from the client
nc -zv db-host 5432

    # 4. Connect locally as the postgres system user
sudo -u postgres psql -c 'SELECT version();'

    # 5. Bypass the Unix socket with an explicit TCP host
psql -h 127.0.0.1 -p 5432 -U myuser -d mydb

    # 6. Read the active server settings
sudo -u postgres psql -c 'SHOW listen_addresses; SHOW port; SHOW hba_file;'`,
    },
    {
      t: 'p',
      x: 'The first failed step narrows the layer to investigate. For example, step 4 succeeding while step 5 fails shows that the server is running but its TCP listener or `pg_hba.conf` rules need attention.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is the difference between connection refused and connection timed out?',
          a: 'Refused means the host returned an active TCP rejection because nothing accepted the connection on that address and port. Timed out means no response arrived, commonly because a firewall or network path dropped the traffic. Start with the listener for a refusal and the network path for a timeout.',
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
          a: 'The connection reached PostgreSQL, but no rule permits that combination of client address, database and role. Add an appropriately scoped host rule and reload the configuration; this change does not require a restart.',
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
