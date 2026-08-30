module.exports = {
  slug: 'npm-eresolve-error',
  title: 'npm ERESOLVE: Diagnose and Fix a Dependency Conflict',
  h1: 'Fixing npm ERESOLVE dependency conflicts',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Read an npm ERESOLVE report, identify the incompatible peer ranges, and choose between an upgrade, override or temporary install policy.',
  standfirst:
    'ERESOLVE means npm cannot satisfy two declared requirements in one dependency tree. Find the package with the incompatible peer range before choosing how to resolve it.',
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
  cardDesc: 'Find the incompatible peer range, then choose an upgrade, targeted override or documented temporary policy.',

  blocks: [
    {
      t: 'takeaways',
      items: [
        'ERESOLVE commonly means that declared **peer dependency** ranges cannot all be satisfied by one installed version.',
        '`--legacy-peer-deps` skips peer requirements. `--force` overrides npm’s refusal to install a conflicting tree; the flags solve different problems.',
        'Prefer upgrading the package with the stale peer range. A targeted `overrides` entry can be reasonable after compatibility has been checked.',
        'Record any project-wide install policy in `.npmrc` so local development and CI resolve dependencies the same way.',
      ],
    },

    { t: 'h2', x: 'What the error means' },
    {
      t: 'p',
      x: 'A **peer dependency** declares that a package integrates with a dependency supplied by the consuming project. A React component library lists `react` as a peer so it uses the application’s React instance instead of bundling another copy.',
    },
    {
      t: 'p',
      x: 'npm reports ERESOLVE when it cannot produce a tree that meets the declared requirements. npm 7 began installing and enforcing peer dependencies more strictly than npm 6. Because Node upgrades often bring a newer npm, an existing conflict may first become visible after upgrading Node.',
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
      x: 'Start with these three parts of the report:',
    },
    {
      t: 'ol',
      items: [
        '**`Found:`** identifies the version currently selected and the package that requested it.',
        '**`Could not resolve dependency: peer …`** shows the range that conflicts with that selection.',
        '**The package name on the following line** identifies the package declaring the incompatible range. In this example, `react-legacy-ui` declares support for React 17 rather than React 18.',
      ],
    },
    {
      t: 'p',
      x: 'Check for a newer compatible release before changing npm’s policy. `npm view react-legacy-ui peerDependencies` shows the latest package’s peer range, and `npm view react-legacy-ui versions --json` lists available versions. If the maintainer widened the range, a normal package upgrade resolves the conflict cleanly.',
    },

    { t: 'h2', x: 'Four resolution paths' },

    { t: 'h3', x: '1. Upgrade the outdated package' },
    {
      t: 'p',
      x: 'An updated release is the least surprising fix because it carries the maintainer’s declared compatibility. Check the release before applying a broader workaround:',
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
      x: 'If testing confirms that the package works with the selected dependency and only its declared range is stale, an override records that decision in `package.json`. This is narrower and easier to review than disabling peer checks across the project.',
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
      x: 'The `$` syntax refers to the dependency specification in the root project, so the override follows later React upgrades. You can instead pin a literal version. Yarn provides `resolutions`, while pnpm uses `pnpm.overrides`.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Overrides make a claim on your behalf',
      x: 'An override asserts compatibility beyond the range published by the package author. A stale range may be harmless, but the constraint may also reflect a real incompatibility. Exercise the affected integration before shipping the override.',
    },

    { t: 'h3', x: '3. `--legacy-peer-deps`' },
    {
      t: 'code',
      lang: 'bash',
      x: `npm install --legacy-peer-deps`,
    },
    {
      t: 'p',
      x: 'This restores npm 6-style peer handling: npm does not build the tree around peer requirements and does not fail on their conflicts. The switch applies to the **whole project**, including dependencies added later, not only the package currently failing.',
    },
    {
      t: 'p',
      x: 'That can be a practical temporary policy for a large legacy tree. If the project depends on it, commit the setting so each environment uses the same resolver behavior:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Project .npmrc settings
legacy-peer-deps=true`,
    },

    { t: 'h3', x: '4. `--force`' },
    {
      t: 'p',
      x: '`--force` tells npm to continue despite protections and conflicts. The resulting tree may contain duplicate framework instances, such as two copies of React, which can later surface as an "Invalid hook call" rather than an install error.',
    },
    {
      t: 'p',
      x: '**`--force` is not a stronger form of `--legacy-peer-deps`.** The latter changes peer-dependency resolution, while the former disables several npm safeguards. A failure that remains under the legacy policy needs its report investigated rather than a stronger flag by default.',
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
      x: 'A lockfile generated by a different npm major or edited during conflict resolution can describe a tree the current npm cannot reproduce. If the declarations themselves are compatible, regenerating the tree is a useful diagnostic step.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Regenerate a conflicted package-lock.json',
      x: 'Choose the appropriate side, then let npm rebuild the lock data: `git checkout --theirs package-lock.json && npm install`. Line-by-line conflict resolution can create a combination that no npm invocation produced.',
    },

    { t: 'h2', x: 'Making CI behave the same as your laptop' },
    {
      t: 'p',
      x: 'A command-line flag used on one laptop does not automatically apply in CI. Put a resolver policy that the project requires in the repository:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Commit these project .npmrc settings
legacy-peer-deps=true
engine-strict=true`,
    },
    {
      t: 'p',
      x: 'Use `npm ci` in CI rather than `npm install`. It installs from the lockfile, fails when `package.json` and the lockfile disagree, and avoids resolving a different dependency tree on each run. It is also generally faster for a clean automated install.',
    },

    { t: 'h2', x: 'Preventing the next one' },
    {
      t: 'ul',
      items: [
        '**Keep the lockfile in version control.** For applications and libraries, it makes development and CI installs reproducible even though library consumers resolve their own tree.',
        '**Update in manageable batches.** Running `npm outdated` regularly makes it easier to associate a conflict with the release that introduced it.',
        '**Check peer requirements before adding a package.** `npm view <pkg> peerDependencies` exposes compatibility constraints before installation.',
        '**Pin your Node version** with `.nvmrc` and an `engines` field. Different Node versions ship different npm versions, and npm 6, 7 and 9+ resolve trees differently.',
        '**Consider pnpm when stricter dependency boundaries help the project.** Its symlinked `node_modules` prevents undeclared phantom dependencies and reports peer issues differently from npm.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is --legacy-peer-deps safe to use permanently?',
          a: 'A project can keep this setting, but npm will no longer enforce peer requirements while building its tree. That allows genuinely incompatible packages to install without a peer-conflict error. Document why the setting is needed and revisit it as the affected dependencies are upgraded.',
        },
        {
          q: 'What is the difference between --force and --legacy-peer-deps?',
          a: '--legacy-peer-deps uses npm 6-style peer handling and does not enforce peer ranges while constructing the tree. --force disables npm safeguards more broadly and may install duplicate framework copies. Investigate the declared conflict before choosing either project-wide behavior.',
        },
        {
          q: 'Why did this start after upgrading Node?',
          a: 'Node releases ship with npm versions that may resolve peer dependencies differently. npm 6 did not enforce peer conflicts the way npm 7 and later do, so a pre-existing incompatible range can become an installation error after the upgrade.',
        },
        {
          q: 'Should I delete package-lock.json?',
          a: 'Not as a routine first step. The lockfile makes installs reproducible. Regenerate it when evidence points to corrupt or incompatible lock data, then review the dependency changes and run the full test suite.',
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
