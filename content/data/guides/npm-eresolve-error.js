module.exports = {
  slug: 'npm-eresolve-error',
  title: 'Fix npm ERESOLVE: Unable to Resolve Dependency Tree',
  h1: 'Fixing npm ERESOLVE dependency conflicts',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'What ERESOLVE actually means, how to read the conflict report, and why --force and --legacy-peer-deps are not the same thing. With permanent fixes.',
  standfirst:
    'The error is npm telling you two packages disagree about a shared dependency. Here is how to read the report, and which of the four fixes is right for your case.',
  keywords: [
    'npm eresolve',
    'unable to resolve dependency tree',
    'legacy-peer-deps',
    'npm peer dependency conflict',
    'npm install error',
  ],
  published: '2026-02-05',
  updated: '2026-08-14',
  author: 'jackson',
  cardDesc: 'Read the conflict report properly, then pick between overrides, --legacy-peer-deps and an actual upgrade.',

  blocks: [
    {
      t: 'takeaways',
      items: [
        'ERESOLVE means two packages require incompatible versions of a shared **peer** dependency.',
        '`--legacy-peer-deps` ignores peer requirements entirely. `--force` installs a tree npm knows is broken. They are not interchangeable.',
        'The correct permanent fix is usually `overrides` in `package.json`, or upgrading the package that is behind.',
        'Whatever you choose, put it in `.npmrc` so CI and your teammates get the same tree — a flag typed by one person is not a fix.',
      ],
    },

    { t: 'h2', x: 'What the error means' },
    {
      t: 'p',
      x: 'A **peer dependency** is a package’s way of saying "I plug into this, and there must be exactly one copy of it". React components declare `react` as a peer so that they use *your* React rather than bundling a second, incompatible copy.',
    },
    {
      t: 'p',
      x: 'ERESOLVE fires when two packages state peer requirements that cannot both be satisfied. npm 7 began enforcing this strictly; npm 6 installed anyway and let you discover the breakage at runtime, which is why upgrading Node often surfaces conflicts that were always there.',
    },

    { t: 'h2', x: 'Reading the conflict report' },
    {
      t: 'code',
      lang: 'text',
      x: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR!
npm ERR! While resolving: my-app@1.0.0
npm ERR! Found: react@18.3.1                          ← what you have
npm ERR! node_modules/react
npm ERR!   react@"^18.2.0" from the root project
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^17.0.0" from react-legacy-ui@3.2.0   ← what wants something else
npm ERR! node_modules/react-legacy-ui
npm ERR!   react-legacy-ui@"^3.2.0" from the root project`,
    },
    {
      t: 'p',
      x: 'Three lines carry all the information:',
    },
    {
      t: 'ol',
      items: [
        '**`Found:`** — the version currently in the tree, and who asked for it.',
        '**`Could not resolve dependency: peer …`** — the requirement that cannot be met.',
        '**The package name on the following line** — the culprit. Here, `react-legacy-ui` has not been updated for React 18.',
      ],
    },
    {
      t: 'p',
      x: 'Before choosing a fix, check whether the culprit has simply been updated. `npm view react-legacy-ui peerDependencies` shows the requirement for the latest version, and `npm view react-legacy-ui versions --json` lists what exists. Very often the answer is a one-line version bump.',
    },

    { t: 'h2', x: 'The four fixes, best first' },

    { t: 'h3', x: '1. Upgrade the outdated package' },
    {
      t: 'p',
      x: 'The real fix, when it is available. The maintainer has usually already widened the peer range:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `npm view react-legacy-ui versions --json
npm install react-legacy-ui@latest`,
    },

    { t: 'h3', x: '2. Use `overrides` to force one version' },
    {
      t: 'p',
      x: 'When the package works fine with the newer version but its declared range is merely stale — very common — tell npm to substitute it. This is a targeted, committed, reviewable fix, and it is the right answer far more often than the flags below.',
    },
    {
      t: 'code',
      lang: 'json',
      x: `{
  "overrides": {
    "react-legacy-ui": {
      "react": "$react",
      "react-dom": "$react-dom"
    }
  }
}`,
    },
    {
      t: 'p',
      x: 'The `$` syntax means "whatever version the root project uses", so it stays correct when you upgrade React later. You can also pin a literal version. Yarn calls this `resolutions`; pnpm uses `pnpm.overrides`.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Overrides make a claim on your behalf',
      x: 'You are asserting the package works with a version its author did not test against. That is usually true for a minor React bump and occasionally false. Exercise the affected components before shipping.',
    },

    { t: 'h3', x: '3. `--legacy-peer-deps`' },
    {
      t: 'code',
      lang: 'bash',
      x: `npm install --legacy-peer-deps`,
    },
    {
      t: 'p',
      x: 'Restores npm 6 behaviour: peer dependencies are not installed automatically and conflicts are ignored. It is a **global** switch — it silences every peer check in the project, not just the one that failed, so a genuinely broken dependency added six months from now installs silently.',
    },
    {
      t: 'p',
      x: 'Reasonable as a temporary measure on a large legacy tree. If you use it, commit it so everyone gets the same result:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# .npmrc in the project root
legacy-peer-deps=true`,
    },

    { t: 'h3', x: '4. `--force`' },
    {
      t: 'p',
      x: 'The last resort, and rarely correct. `--force` installs a tree npm has determined is broken, which can mean two copies of React in one bundle — producing "Invalid hook call" errors that look nothing like a dependency problem.',
    },
    {
      t: 'p',
      x: '**`--force` is not a stronger `--legacy-peer-deps`.** They do different things: one ignores peer requirements, the other overrides npm’s refusal to write a conflicting tree. If `--legacy-peer-deps` did not work, `--force` is unlikely to be the answer.',
    },

    { t: 'h2', x: 'When nothing works: reset the tree' },
    {
      t: 'code',
      lang: 'bash',
      x: `rm -rf node_modules package-lock.json
npm cache clean --force
npm install`,
    },
    {
      t: 'p',
      x: 'A lockfile that was generated under a different npm major version, or hand-edited during a merge conflict, can encode a tree that cannot be reproduced. Regenerating it resolves a surprising share of otherwise inexplicable ERESOLVE failures.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Never resolve a package-lock.json conflict by hand',
      x: 'Take either side wholesale, then regenerate: `git checkout --theirs package-lock.json && npm install`. A hand-merged lockfile is a tree no npm version ever produced.',
    },

    { t: 'h2', x: 'Making CI behave the same as your laptop' },
    {
      t: 'p',
      x: 'A flag you type locally does not exist in CI, which is why "works on my machine" is such a common ending to this story. Put the decision in the repository:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# .npmrc — commit this file
legacy-peer-deps=true
engine-strict=true`,
    },
    {
      t: 'p',
      x: 'And use `npm ci` in CI rather than `npm install`. It installs strictly from the lockfile, fails if `package.json` and the lockfile disagree, and is considerably faster. It also means a dependency conflict fails the build instead of being silently resolved differently on each run.',
    },

    { t: 'h2', x: 'Preventing the next one' },
    {
      t: 'ul',
      items: [
        '**Keep the lockfile in version control.** Always, including for libraries — it makes CI reproducible even though consumers ignore it.',
        '**Update in small batches.** `npm outdated` weekly is far less painful than a twelve-month arrears bump that changes forty packages at once.',
        '**Check peer requirements before adding a package.** `npm view <pkg> peerDependencies` takes two seconds.',
        '**Pin your Node version** with `.nvmrc` and an `engines` field. Different Node versions ship different npm versions, and npm 6, 7 and 9+ resolve trees differently.',
        '**Consider pnpm.** Its strict, symlinked `node_modules` makes phantom dependencies impossible and surfaces peer problems more clearly than npm does.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is --legacy-peer-deps safe to use permanently?',
          a: 'It works, and plenty of large projects run this way. The cost is that you lose peer-dependency checking entirely, so a genuinely incompatible package installs without complaint. Treat it as technical debt with a note explaining why it is there, not as a settled configuration.',
        },
        {
          q: 'What is the difference between --force and --legacy-peer-deps?',
          a: '--legacy-peer-deps ignores peer dependency rules, reverting to npm 6 behaviour. --force tells npm to write a dependency tree it has already judged invalid, which can produce duplicate copies of a framework in one bundle. Reach for --legacy-peer-deps first; --force is rarely the right tool.',
        },
        {
          q: 'Why did this start after upgrading Node?',
          a: 'Because a Node upgrade brings a new npm. npm 6 ignored peer conflicts silently; npm 7 and later enforce them. The conflict was almost certainly present before — you are only now being told about it.',
        },
        {
          q: 'Should I delete package-lock.json?',
          a: 'Not routinely — it is what makes builds reproducible. Deleting and regenerating it is a legitimate troubleshooting step when the tree is genuinely corrupt, but it should be a deliberate action followed by a full test run, not a reflex.',
        },
        {
          q: 'Do yarn or pnpm avoid this?',
          a: 'They handle it differently rather than avoiding it. Yarn Classic warns instead of failing; Yarn Berry and pnpm both enforce peer dependencies, pnpm particularly strictly. The underlying incompatibility exists regardless of which client reports it.',
        },
      ],
    },
  ],

  related: ['/guides/git-undo-commit/', '/guides/docker-container-exits-immediately/', '/guides/react-usestate-not-updating/'],
};
