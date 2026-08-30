module.exports = {
  slug: 'ssh-permission-denied-publickey',
  title: 'SSH "Permission denied (publickey)": How to Diagnose It',
  h1: 'Fixing SSH permission denied (publickey)',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Diagnose SSH key rejection with verbose output: wrong key offered, wrong username, bad file permissions, agent problems and unsupported key formats.',
  standfirst:
    'The final error says only that public-key authentication failed. Use `ssh -vvv` to see whether a key was found, offered, accepted or rejected, then investigate that stage.',
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
  cardDesc: 'Read the ssh -vvv trace to find a missing key, rejected identity, wrong user, permission problem or legacy algorithm.',

  blocks: [
    { t: 'h2', x: 'Start with verbose output' },
    {
      t: 'p',
      x: '`-vvv` shows which identities the client considered, which keys it offered and how the server responded. That sequence tells you where authentication stopped.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `ssh -vvv git@github.com
ssh -vvv -i ~/.ssh/id_ed25519 user@server.example.com`,
    },
    {
      t: 'p',
      x: 'Look for a sequence like this:',
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
        ['No `Offering public key` lines at all', 'The client found no usable key to offer; see cause 2'],
        ['`Offering…` then `Authentications that can continue`', 'The server rejected the offered key; see cause 1'],
        ['`Server accepts key` then failure', 'The key test passed, but a later authentication or authorisation step failed; see cause 5'],
        ['`Bad permissions`, `UNPROTECTED PRIVATE KEY FILE`', 'The client rejected a key because of its file mode; see cause 3'],
        ['`send_pubkey_test: no mutual signature algorithm`', 'The client and server do not share an allowed signature algorithm; see cause 6'],
      ],
    },

    { t: 'h2', x: 'Cause 1: the server does not have your public key' },
    {
      t: 'p',
      x: 'When the trace shows a key being offered and then rejected, compare it with the entries in that account’s `~/.ssh/authorized_keys`. The matching public key may be absent, malformed or installed for a different user.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Install the key and set its permissions automatically
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

    # Install manually when another access path is available
cat ~/.ssh/id_ed25519.pub | ssh user@server \\
  'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'`,
    },
    {
      t: 'p',
      x: 'Compare fingerprints instead of relying on filenames. This establishes whether the exact key offered by the client appears in the server file:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Read the local key fingerprint
ssh-keygen -lf ~/.ssh/id_ed25519.pub

    # Read every fingerprint accepted by the server
ssh-keygen -lf ~/.ssh/authorized_keys`,
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'One key per line, no wrapping',
      x: 'Each `authorized_keys` entry must remain on one line. An editor or chat client can insert a line break while copying, leaving a visually plausible entry that OpenSSH cannot parse.',
    },

    { t: 'h2', x: 'Cause 2: no key was offered' },
    {
      t: 'p',
      x: 'If the trace contains no `Offering public key` line, the client found no identity it could send. Confirm that a private key exists and that SSH knows its path.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `ls -la ~/.ssh/

# Create a key when none exists
ssh-keygen -t ed25519 -C "you@example.com"`,
    },
    {
      t: 'p',
      x: 'By default, SSH looks for names such as `id_rsa`, `id_ecdsa` and `id_ed25519`. A key named `work_key` needs an `IdentityFile` entry or an explicit `-i` argument. Put recurring host-specific choices in `~/.ssh/config`:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `# Client settings in ~/.ssh/config
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
      x: 'Without this setting, the client may also offer identities from its agent. Servers commonly cap authentication attempts at six, so a connection can close before the intended key is tried. `IdentitiesOnly yes` limits offers to identities selected for that host.',
    },

    { t: 'h2', x: 'Cause 3: file permissions' },
    {
      t: 'p',
      x: 'The client refuses a private key that other users can read. On the server, `sshd` can ignore `authorized_keys` when the file or a containing directory is writable by other users. The remote client often receives only the generic authentication error.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Secure files on the client
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/config

# Secure files on the server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown -R $USER:$USER ~/.ssh

# Reject group and world writes to the home directory
chmod 755 ~`,
    },
    {
      t: 'p',
      x: 'Remember to inspect the home directory as well as `.ssh`. If `~` is mode 775 or 777, `sshd` may refuse to trust `authorized_keys`; the useful explanation appears in the server log rather than the client error.',
    },

    { t: 'h2', x: 'Cause 4: the wrong username' },
    {
      t: 'p',
      x: 'Unless configured otherwise, SSH uses the local username for the remote account. Public keys are installed per account, so a correct key offered for the wrong username is still rejected.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Git hosts expect their service account
    ssh -T git@github.com          # Correct service account
    ssh -T jackson@github.com      # Wrong account

    # Cloud images use different default accounts
    ssh ubuntu@…      # Default for Ubuntu on AWS
    ssh ec2-user@…    # Default for Amazon Linux
    ssh admin@…       # Default for Debian
    ssh core@…        # Default for Flatcar or CoreOS`,
    },
    {
      t: 'p',
      x: 'A successful GitHub test prints `Hi username! You\'ve successfully authenticated, but GitHub does not provide shell access.` The lack of shell access is expected; the message confirms that the key was accepted.',
    },

    { t: 'h2', x: 'Cause 5: the agent, and forwarding' },
    {
      t: 'code',
      lang: 'bash',
      x: `# List identities held by the agent
ssh-add -l

    # Fix "Could not open a connection to your authentication agent"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

    # Keep the passphrase in the macOS keychain
ssh-add --apple-use-keychain ~/.ssh/id_ed25519`,
    },
    {
      t: 'p',
      x: 'On macOS, the following host defaults load the named key through the agent and Keychain:',
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
      x: 'For a connection through a bastion, agent forwarding avoids placing the private-key file on the intermediate host. Copying a private key to a shared jump box gives that machine direct access to the credential:',
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
      x: 'OpenSSH 8.8, released in 2021, disabled `ssh-rsa` signatures using SHA-1 by default. An older RSA setup may therefore stop working after an upgrade and report this distinctive message:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `debug1: send_pubkey_test: no mutual signature algorithm`,
    },
    {
      t: 'p',
      x: 'Generate an Ed25519 key when both ends support it. It is smaller and faster than legacy RSA configurations and does not depend on SHA-1 signatures:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `ssh-keygen -t ed25519 -C "you@example.com"`,
    },
    {
      t: 'p',
      x: 'If rotation must be delayed, re-enable the legacy algorithm only for the affected host and keep the exception temporary:',
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
      x: 'GitHub removed `ssh-rsa` support in 2022, and OpenSSH 9.8 removed DSA support entirely. Replace keys and algorithms that depend on those legacy options.',
    },

    { t: 'h2', x: 'When you have access to the server' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Read the server reason hidden from the client
    sudo tail -f /var/log/auth.log          # Debian or Ubuntu log
    sudo journalctl -u sshd -f              # Systemd log

    # Inspect the effective configuration
sudo sshd -T | grep -Ei 'pubkey|authorizedkeys|permitroot|allowusers'

    # Validate changes before restarting the service
sudo sshd -t`,
    },
    {
      t: 'p',
      x: 'A valid key can still be rejected by the effective server configuration. Check these settings in the `sshd -T` output:',
    },
    {
      t: 'ul',
      items: [
        '`PubkeyAuthentication no`: public-key authentication is disabled.',
        '`AllowUsers` or `AllowGroups` that does not include your account.',
        '`PermitRootLogin no` when you are connecting as root.',
        '`AuthorizedKeysFile` pointing somewhere other than `.ssh/authorized_keys`.',
        'Incorrect SELinux contexts on RHEL-family systems; repair them with `restorecon -R -v ~/.ssh`.',
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Keep a second session open',
      x: 'Before restarting `sshd`, validate the configuration with `sudo sshd -t` and leave the current session connected. Test the new settings in a *separate* terminal. If the configuration blocks new sessions, the existing connection gives you a way to repair it without console or rescue access.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does permission denied (publickey) appear even though my key is correct?',
          a: 'A valid key can be installed for a different remote user, ignored because of file permissions or absent from the client’s offered identities. Run ssh -vvv. If it shows no "Offering public key" line, inspect client-side identity selection before changing the server.',
        },
        {
          q: 'How do I know which key SSH is using?',
          a: 'ssh -vvv prints each offered key and its fingerprint. Compare that value with ssh-keygen -lf on the local public key and with the fingerprints from the server’s authorized_keys file.',
        },
        {
          q: 'Why did my RSA key stop working?',
          a: 'OpenSSH 8.8 disabled SHA-1 RSA signatures by default, and GitHub removed ssh-rsa support in 2022. Generate an Ed25519 key: ssh-keygen -t ed25519. Re-enabling ssh-rsa is possible per-host but should be a stopgap only.',
        },
        {
          q: 'What permissions should ~/.ssh have?',
          a: 'Use 700 for the .ssh directory, 600 for private keys and authorized_keys, and 644 for public keys. The home directory must not be group- or world-writable; 755 or stricter is appropriate. Check server logs when sshd ignores an overly permissive path.',
        },
        {
          q: 'Why does it work with -i but not without?',
          a: 'SSH only auto-loads keys named id_rsa, id_ecdsa and id_ed25519. A differently named key must be declared with IdentityFile in ~/.ssh/config, ideally with IdentitiesOnly yes so it is the only key offered.',
        },
        {
          q: 'Can I use the same key on several machines?',
          a: 'The protocol allows it, but separate keys per device give you better revocation boundaries. Keep each private key on the device that generated it and install all required public keys on the server. Losing one device then requires revoking only its key.',
        },
      ],
    },
  ],

  related: ['/guides/git-undo-commit/', '/guides/postgres-connection-refused/', '/tools/base64-encoder-decoder/'],
};
