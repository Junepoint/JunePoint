module.exports = {
  slug: 'ssh-permission-denied-publickey',
  title: 'SSH "Permission denied (publickey)" — How to Fix It',
  h1: 'Fixing SSH permission denied (publickey)',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Diagnose SSH key rejection with verbose output: wrong key offered, wrong username, bad file permissions, agent problems and unsupported key formats.',
  standfirst:
    'The server rejected every key you offered. `ssh -vvv` tells you which keys were tried and why each failed — and that output makes the fix obvious.',
  keywords: [
    'permission denied publickey',
    'ssh key not working',
    'ssh authentication failed',
    'git@github.com permission denied',
    'ssh bad permissions',
  ],
  published: '2026-03-19',
  updated: '2026-08-11',
  author: 'jackson',
  cardDesc: 'Read ssh -vvv properly, then fix the cause: wrong key, wrong user, bad permissions or an empty agent.',

  blocks: [
    { t: 'h2', x: 'Start with verbose output' },
    {
      t: 'p',
      x: 'Do not guess. `-vvv` shows every key SSH offered and what the server said about each.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `ssh -vvv git@github.com
ssh -vvv -i ~/.ssh/id_ed25519 user@server.example.com`,
    },
    {
      t: 'p',
      x: 'The lines that matter:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `debug1: Offering public key: /home/you/.ssh/id_ed25519 ED25519 SHA256:AbC...
debug1: Authentications that can continue: publickey        ← rejected, trying next
debug1: No more authentication methods to try.
Permission denied (publickey).`,
    },
    {
      t: 'table',
      head: ['What you see', 'What it means'],
      rows: [
        ['No `Offering public key` lines at all', 'SSH never found a key to try — see cause 2'],
        ['`Offering…` then `Authentications that can continue`', 'The key was offered and rejected — see cause 1'],
        ['`Server accepts key` then failure', 'Authentication succeeded, authorisation did not — see cause 5'],
        ['`Bad permissions`, `UNPROTECTED PRIVATE KEY FILE`', 'File mode problem — see cause 3'],
        ['`send_pubkey_test: no mutual signature algorithm`', 'Old RSA key against a modern server — see cause 6'],
      ],
    },

    { t: 'h2', x: 'Cause 1: the server does not have your public key' },
    {
      t: 'p',
      x: 'The key was offered and refused, so the corresponding public key is not in `~/.ssh/authorized_keys` on the server — or it is there with a typo.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# The reliable way to install it (fixes permissions for you)
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# By hand, if password auth is disabled and you have another route in
cat ~/.ssh/id_ed25519.pub | ssh user@server \\
  'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'`,
    },
    {
      t: 'p',
      x: 'Verify the fingerprint the client offered matches one the server holds. This turns "is my key installed?" into a definite yes or no:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Local key fingerprint
ssh-keygen -lf ~/.ssh/id_ed25519.pub

# Fingerprints the server accepts
ssh-keygen -lf ~/.ssh/authorized_keys`,
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'One key per line, no wrapping',
      x: 'Each entry in `authorized_keys` must be a single unbroken line. Copying through an editor or a chat client often inserts a line break, which silently invalidates the key. The file will look right and never work.',
    },

    { t: 'h2', x: 'Cause 2: no key was offered' },
    {
      t: 'p',
      x: 'If there are no `Offering public key` lines, SSH found nothing to send. Either no key exists, or it has a non-default name SSH does not look for automatically.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `ls -la ~/.ssh/

# Create one if needed
ssh-keygen -t ed25519 -C "you@example.com"`,
    },
    {
      t: 'p',
      x: 'SSH only tries `id_rsa`, `id_ecdsa` and `id_ed25519` by default. A key named `work_key` is invisible unless you point at it. Configure it once rather than typing `-i` forever:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `# ~/.ssh/config
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_ed25519
  IdentitiesOnly yes

Host prod
  HostName 10.0.1.42
  User deploy
  IdentityFile ~/.ssh/prod_ed25519
  IdentitiesOnly yes`,
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'IdentitiesOnly yes is doing real work',
      x: 'Without it, SSH offers every key it knows about, in an arbitrary order. Servers commonly cap authentication attempts at six, so with several keys loaded you can be disconnected before your correct key is ever tried. `IdentitiesOnly yes` sends only the key you named.',
    },

    { t: 'h2', x: 'Cause 3: file permissions' },
    {
      t: 'p',
      x: 'SSH refuses to use keys that others can read, and `sshd` ignores an `authorized_keys` file in a directory others can write to. Both refusals are silent from the other end.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# On the client
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/config

# On the server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown -R $USER:$USER ~/.ssh

# Your home directory must not be group- or world-writable
chmod 755 ~`,
    },
    {
      t: 'p',
      x: 'The home directory permission catches people out. If `~` is mode 775 or 777, `sshd` refuses to read `authorized_keys` and logs nothing useful to the client.',
    },

    { t: 'h2', x: 'Cause 4: the wrong username' },
    {
      t: 'p',
      x: 'SSH defaults to your local username. On the server, the key lives in one specific user’s `authorized_keys`.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Git hosts always want their service account, never your name
ssh -T git@github.com          # ✓
ssh -T jackson@github.com      # ✗ Permission denied (publickey)

# Cloud images each have their own default
ssh ubuntu@…      # Ubuntu on AWS
ssh ec2-user@…    # Amazon Linux
ssh admin@…       # Debian
ssh core@…        # Flatcar / CoreOS`,
    },
    {
      t: 'p',
      x: 'A successful GitHub test prints `Hi username! You\'ve successfully authenticated, but GitHub does not provide shell access.` That message is the goal — it is not an error.',
    },

    { t: 'h2', x: 'Cause 5: the agent, and forwarding' },
    {
      t: 'code',
      lang: 'bash',
      x: `# What is the agent holding?
ssh-add -l

# "Could not open a connection to your authentication agent"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# macOS: store the passphrase in the keychain so it survives reboots
ssh-add --apple-use-keychain ~/.ssh/id_ed25519`,
    },
    {
      t: 'p',
      x: 'On macOS, add this to `~/.ssh/config` so keys load automatically:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519`,
    },
    {
      t: 'p',
      x: 'If you are hopping through a bastion, forward the agent rather than copying a private key onto the intermediate host — a private key on a shared jump box is a key you have effectively published:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `Host bastion
  HostName bastion.example.com
  User jump
  ForwardAgent yes

Host prod-*
  ProxyJump bastion
  User deploy`,
    },

    { t: 'h2', x: 'Cause 6: your key format is too old' },
    {
      t: 'p',
      x: 'OpenSSH 8.8 (2021) disabled `ssh-rsa` — RSA with SHA-1 signatures — by default. Older RSA keys that worked for years began failing after a server upgrade, with a distinctive message:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `debug1: send_pubkey_test: no mutual signature algorithm`,
    },
    {
      t: 'p',
      x: 'The correct fix is a new key. Ed25519 is smaller, faster and has no SHA-1 problem:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `ssh-keygen -t ed25519 -C "you@example.com"`,
    },
    {
      t: 'p',
      x: 'If you genuinely cannot rotate yet, re-enable the algorithm for that host only — and treat it as temporary:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `Host legacy-server
  PubkeyAcceptedAlgorithms +ssh-rsa
  HostKeyAlgorithms +ssh-rsa`,
    },
    {
      t: 'p',
      x: 'GitHub removed `ssh-rsa` support in 2022 and DSA keys are gone entirely from OpenSSH 9.8. If your key is more than a few years old, regenerating is the fix.',
    },

    { t: 'h2', x: 'When you have access to the server' },
    {
      t: 'code',
      lang: 'bash',
      x: `# The server-side reason, which the client is never told
sudo tail -f /var/log/auth.log          # Debian/Ubuntu
sudo journalctl -u sshd -f              # systemd

# Check the effective configuration
sudo sshd -T | grep -Ei 'pubkey|authorizedkeys|permitroot|allowusers'

# Validate a config change before restarting and locking yourself out
sudo sshd -t`,
    },
    {
      t: 'p',
      x: 'Server-side settings that produce this exact error even with a perfect key:',
    },
    {
      t: 'ul',
      items: [
        '`PubkeyAuthentication no` — key authentication disabled entirely.',
        '`AllowUsers` or `AllowGroups` that does not include your account.',
        '`PermitRootLogin no` when you are connecting as root.',
        '`AuthorizedKeysFile` pointing somewhere other than `.ssh/authorized_keys`.',
        'SELinux contexts on RHEL-family systems — fix with `restorecon -R -v ~/.ssh`.',
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Keep a second session open',
      x: 'Before restarting `sshd` after a configuration change, run `sudo sshd -t` and keep your existing session connected. Test the new setting in a *separate* terminal. A mistake in `sshd_config` with no open session means a console or rescue-mode recovery.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does permission denied (publickey) appear even though my key is correct?',
          a: 'Most often the key is not in the right user’s authorized_keys on the server, or file permissions are too open, or SSH is not offering that key at all. Run ssh -vvv: if you see no "Offering public key" lines, the key is never being tried and the problem is client-side configuration.',
        },
        {
          q: 'How do I know which key SSH is using?',
          a: 'ssh -vvv shows every key offered with its fingerprint. Compare against ssh-keygen -lf on the public key and against the fingerprints in the server’s authorized_keys. This turns guesswork into a definitive check.',
        },
        {
          q: 'Why did my RSA key stop working?',
          a: 'OpenSSH 8.8 disabled SHA-1 RSA signatures by default, and GitHub removed ssh-rsa support in 2022. Generate an Ed25519 key: ssh-keygen -t ed25519. Re-enabling ssh-rsa is possible per-host but should be a stopgap only.',
        },
        {
          q: 'What permissions should ~/.ssh have?',
          a: '700 for the directory, 600 for private keys and authorized_keys, 644 for public keys. Your home directory must not be group- or world-writable — 755 or stricter. SSH silently ignores files that are too permissive.',
        },
        {
          q: 'Why does it work with -i but not without?',
          a: 'SSH only auto-loads keys named id_rsa, id_ecdsa and id_ed25519. A differently named key must be declared with IdentityFile in ~/.ssh/config, ideally with IdentitiesOnly yes so it is the only key offered.',
        },
        {
          q: 'Can I use the same key on several machines?',
          a: 'Technically yes, but do not. A private key should never leave the device that generated it. Generate a separate key per machine and add each public key to the server — then losing one laptop means revoking one key rather than rotating everywhere.',
        },
      ],
    },
  ],

  related: ['/guides/git-undo-commit/', '/guides/postgres-connection-refused/', '/tools/base64-encoder-decoder/'],
};
