module.exports = {
  slug: 'git-undo-commit',
  title: 'How to Undo a Git Commit (Safely, Every Case)',
  h1: 'How to undo a Git commit',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Undo the last commit, an old commit, or a pushed commit — with reset, revert and rebase explained. Includes recovering work you thought you destroyed.',
  standfirst:
    'Pick the right command for your situation: whether the commit is pushed, whether you want to keep the changes, and how to get your work back if you already ran the wrong one.',
  keywords: [
    'undo git commit',
    'git reset vs revert',
    'undo last commit',
    'git reset hard',
    'git reflog recover',
    'remove commit from history',
  ],
  published: '2026-01-29',
  updated: '2026-08-27',
  author: 'jackson',
  featured: true,
  cardDesc: 'reset, revert, rebase and reflog — which one to use, and how to recover when you pick wrong.',

  blocks: [
    {
      t: 'note',
      kind: 'tip',
      title: 'The single most important thing on this page',
      x: 'Git almost never truly deletes a commit. `git reflog` records every position `HEAD` has occupied for at least 30 days, so work that looks destroyed is nearly always recoverable. If you have just run something alarming, jump to [the recovery section](#i-ran-the-wrong-command-getting-your-work-back) before doing anything else.',
    },

    { t: 'h2', x: 'Pick your situation' },
    {
      t: 'table',
      head: ['Your situation', 'Command'],
      rows: [
        ['Fix the message of the last commit', '`git commit --amend`'],
        ['Undo last commit, keep changes staged', '`git reset --soft HEAD~1`'],
        ['Undo last commit, keep changes unstaged', '`git reset HEAD~1`'],
        ['Undo last commit, discard changes', '`git reset --hard HEAD~1`'],
        ['Undo a commit that is already pushed', '`git revert <sha>`'],
        ['Undo an old commit, keep the ones after it', '`git revert <sha>`'],
        ['Remove an old commit from history entirely', '`git rebase -i <sha>~1`'],
        ['Undo a merge', '`git revert -m 1 <merge-sha>`'],
        ['Recover something you destroyed', '`git reflog` then `git reset --hard <sha>`'],
      ],
    },

    { t: 'h2', x: 'The one rule that decides everything' },
    {
      t: 'p',
      x: '**Has the commit been pushed to a shared branch?**',
    },
    {
      t: 'ul',
      items: [
        '**No** — you may rewrite history freely. `reset`, `amend` and `rebase` are all fair game.',
        '**Yes** — use `revert`. Rewriting published history forces everyone else to repair their clones, and on a busy branch it reliably destroys someone’s work.',
      ],
    },
    {
      t: 'p',
      x: 'That is the whole decision. Everything below is detail.',
    },

    { t: 'h2', x: 'Fixing the last commit' },

    { t: 'h3', x: 'Wrong message, or you forgot a file' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Reword the message
git commit --amend -m "fix: correct tax rounding on invoices"

# Forgot a file? Stage it and fold it into the previous commit
git add src/tax.ts
git commit --amend --no-edit`,
    },
    {
      t: 'p',
      x: '`--amend` replaces the previous commit with a new one. The SHA changes, so it counts as rewriting history — fine before pushing, and a force-push afterwards.',
    },

    { t: 'h3', x: 'Undo the commit but keep the work' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Changes go back to the staging area — ready to re-commit
git reset --soft HEAD~1

# Changes go back to the working directory — unstaged
git reset HEAD~1          # --mixed is the default

# Changes are destroyed. Nothing is kept.
git reset --hard HEAD~1`,
    },
    {
      t: 'p',
      x: 'The three modes differ only in what happens to your files:',
    },
    {
      t: 'table',
      head: ['Mode', 'Moves branch pointer', 'Staging area', 'Working directory'],
      rows: [
        ['`--soft`', 'Yes', 'Keeps your changes', 'Untouched'],
        ['`--mixed` (default)', 'Yes', 'Cleared', 'Keeps your changes'],
        ['`--hard`', 'Yes', 'Cleared', '**Overwritten — work lost**'],
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: '--hard is the only genuinely dangerous one',
      x: 'It overwrites your working directory. Committed work is recoverable through the reflog, but **uncommitted** changes wiped by `--hard` are gone for good — they were never in Git’s object store. Run `git stash` first if there is any doubt.',
    },

    { t: 'h2', x: 'Undoing a commit that is already pushed' },
    {
      t: 'p',
      x: '`git revert` creates a **new** commit that applies the inverse of an old one. History is preserved, nothing is rewritten, and collaborators need to do nothing but pull.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Undo one commit
git revert a1b2c3d

# Undo several, newest first
git revert a1b2c3d b4e5f6a

# Stage the inverse without committing, so you can adjust it
git revert --no-commit a1b2c3d`,
    },
    {
      t: 'p',
      x: 'The revert commit shows up in the log as "Revert ...". Some people dislike the noise. The alternative — force-pushing a rewritten branch that others have pulled — trades a tidy log for a broken afternoon, and it is not a good trade.',
    },

    { t: 'h3', x: 'Reverting a merge' },
    {
      t: 'p',
      x: 'A merge commit has two parents, so Git needs to know which one to treat as the mainline:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# -m 1 means "keep the first parent" — almost always the branch you merged into
git revert -m 1 <merge-sha>`,
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Reverting a merge poisons the branch',
      x: 'Git now considers those commits already merged. If you fix the feature branch and merge it again, the reverted changes **will not come back** — Git sees no new work. You must revert the revert (`git revert <revert-sha>`) before re-merging. This surprises people badly, and it is worth knowing before you need it.',
    },

    { t: 'h2', x: 'Removing a commit from the middle of history' },
    {
      t: 'p',
      x: 'Interactive rebase rewrites a range of commits. Only use it on unpushed work, or on a personal branch nobody else has.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Rewrite the last five commits
git rebase -i HEAD~5`,
    },
    {
      t: 'p',
      x: 'An editor opens with one line per commit. Change the verb at the start of a line to change what happens:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `pick   a1b2c3d  feat: add invoice export
drop   b4e5f6a  wip: debugging noise        ← delete this commit
squash c7d8e9f  fix typo                    ← fold into the one above
reword d0e1f2a  feat: tax rounding          ← change the message only
edit   e3f4a5b  refactor: extract helper    ← stop here to amend it`,
    },
    {
      t: 'p',
      x: 'Save and close. If a conflict appears, resolve it, `git add` the files, then `git rebase --continue`. To abandon the whole operation at any point: `git rebase --abort`.',
    },

    { t: 'h2', x: 'Undoing things that are not commits' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Unstage a file, keep the edits
git restore --staged src/app.ts

# Discard uncommitted edits to a file — NOT recoverable
git restore src/app.ts

# Discard everything uncommitted
git restore .

# Remove untracked files (-n previews, -d includes directories)
git clean -nd
git clean -fd

# Park your work instead of destroying it
git stash push -m "half-finished refactor"
git stash pop`,
    },
    {
      t: 'p',
      x: '`git restore` and `git switch` were introduced in Git 2.23 to split the overloaded `git checkout` into two clearer commands. `git checkout -- file` still works, but the newer forms are far harder to misuse.',
    },

    { t: 'h2', x: 'I ran the wrong command — getting your work back', id: 'i-ran-the-wrong-command-getting-your-work-back' },
    {
      t: 'p',
      x: 'The reflog is a local record of every value `HEAD` has held — including commits that no branch points at any more. This is how you undo a bad `reset`, a bad `rebase` or a deleted branch.',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `git reflog

# a1b2c3d HEAD@{0}: reset: moving to HEAD~3      ← the mistake
# f9e8d7c HEAD@{1}: commit: feat: add reporting  ← where you want to be
# 8b7a6c5 HEAD@{2}: commit: fix: rounding

# Go back to where you were before the reset
git reset --hard HEAD@{1}`,
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Recover a branch you deleted
git reflog
git branch recovered-feature f9e8d7c

# Find commits no branch references at all
git fsck --lost-found`,
    },
    {
      t: 'p',
      x: 'Reflog entries survive for 90 days by default (30 for unreachable commits) before garbage collection. The practical limit on recovery is therefore time, not permanence.',
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'What the reflog cannot save',
      x: 'Anything never committed. Uncommitted edits destroyed by `git reset --hard`, `git restore` or `git clean` were never written to Git’s object database, so there is nothing to recover. Your editor’s local history may have a copy — that is the only remaining option.',
    },

    { t: 'h2', x: 'Force-pushing without hurting anyone' },
    {
      t: 'p',
      x: 'If you rewrote history on a branch you had already pushed, you must force-push. Use the safe variant:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Refuses to push if someone else has pushed since you last fetched
git push --force-with-lease

# Never do this on a shared branch
git push --force`,
    },
    {
      t: 'p',
      x: '`--force-with-lease` checks that the remote is where you last saw it. If a colleague pushed in the meantime, the push is rejected rather than silently discarding their commits. There is no good reason to prefer plain `--force`.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is the difference between git reset and git revert?',
          a: 'reset moves your branch pointer backwards, erasing commits from the branch as though they never happened — it rewrites history and is only safe on unpushed work. revert adds a new commit that undoes an old one, leaving history intact. Use reset locally, revert on anything already shared.',
        },
        {
          q: 'How do I undo the last commit but keep my changes?',
          a: 'git reset --soft HEAD~1 keeps everything staged and ready to re-commit. git reset HEAD~1 keeps the changes but unstages them. Neither touches your files on disk.',
        },
        {
          q: 'Can I undo a git reset --hard?',
          a: 'Yes, if the work was committed. Run git reflog, find the SHA from before the reset, and git reset --hard back to it. Uncommitted changes destroyed by --hard are not recoverable, because they were never stored in Git.',
        },
        {
          q: 'How do I remove a secret I accidentally committed?',
          a: 'Rewriting history with git filter-repo or BFG Repo-Cleaner removes it from the repository, but treat the credential as compromised regardless and rotate it immediately. It has been on a remote server, in CI logs and in every clone. Rotation is the fix; history rewriting is cleanup.',
        },
        {
          q: 'Why did my reverted changes not come back after re-merging?',
          a: 'Because reverting a merge commit tells Git those changes are already accounted for. Re-merging the same branch brings nothing new. Revert the revert commit first, then merge again.',
        },
        {
          q: 'Is git rebase -i safe?',
          a: 'On commits you have not pushed, yes — and abort at any point with git rebase --abort. On shared branches it is genuinely disruptive: everyone who has pulled must reset their local copy. Note also that interactive rebase needs a terminal, so it is unavailable in many automated environments.',
        },
      ],
    },
  ],

  related: ['/guides/npm-eresolve-error/', '/guides/ssh-permission-denied-publickey/', '/guides/fix-cors-errors/'],
};
