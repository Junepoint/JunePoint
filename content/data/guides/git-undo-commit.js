module.exports = {
  slug: 'git-undo-commit',
  title: 'How to Undo a Git Commit Without Losing Work',
  h1: 'How to undo a Git commit',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Choose between Git reset, revert, amend and rebase based on whether a commit was shared and whether its file changes should be kept.',
  standfirst:
    'First decide whether the commit reached a shared branch and whether you still need its changes. Those two answers determine the command and the recovery risk.',
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
  cardDesc: 'Choose reset, revert, amend or rebase, and use the reflog when a history rewrite goes wrong.',

  blocks: [
    {
      t: 'note',
      kind: 'tip',
      title: 'Committed work is usually recoverable',
      x: '`git reflog` records recent positions of `HEAD`, including commits no longer named by a branch. Entries for unreachable commits normally remain for at least 30 days. If a reset or rebase just moved the branch unexpectedly, use [the recovery section](#i-ran-the-wrong-command-getting-your-work-back) before making more history changes.',
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

    { t: 'h2', x: 'Decide whether the history is shared' },
    {
      t: 'p',
      x: '**Has the commit been pushed to a shared branch?**',
    },
    {
      t: 'ul',
      items: [
        '**No:** `reset`, `amend` and `rebase` can rewrite the local branch without disrupting another clone.',
        '**Yes:** prefer `revert`. Rewriting published history makes collaborators reconcile their local branches and can discard work during a careless force-push.',
      ],
    },
    {
      t: 'p',
      x: 'After that, choose whether the original file changes should stay staged, remain unstaged or be discarded.',
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
      x: '`--amend` creates a replacement for the previous commit, so its SHA changes. Use it freely before pushing. After publishing the original commit, updating the remote requires a force-push and coordination with anyone using that branch.',
    },

    { t: 'h3', x: 'Undo the commit but keep the work' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Changes return to the staging area, ready to re-commit\ngit reset --soft HEAD~1\n\n# Changes return to the working directory, unstaged
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
        ['`--hard`', 'Yes', 'Cleared', '**Overwritten; work lost**'],
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: '`--hard` also overwrites the working tree',
      x: 'A hard reset moves the branch and replaces files in the working tree. Committed work can be found through the reflog, but **uncommitted** changes removed by `--hard` were never stored in Git’s object database and cannot be restored by Git. Stash uncertain work before running it.',
    },

    { t: 'h2', x: 'Undoing a commit that is already pushed' },
    {
      t: 'p',
      x: '`git revert` creates a **new** commit containing the inverse of an earlier commit. Existing history remains in place, so collaborators can receive the change with an ordinary pull.',
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
      x: 'The new commit appears in the log as "Revert ...". That extra entry records both what happened and how it was corrected. On a shared branch, this trace is preferable to rewriting commits that others may already have based work on.',
    },

    { t: 'h3', x: 'Reverting a merge' },
    {
      t: 'p',
      x: 'A merge commit has two parents, so Git needs to know which one to treat as the mainline:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# -m 1 means "keep the first parent," usually the branch you merged into
git revert -m 1 <merge-sha>`,
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'A reverted merge remains part of history',
      x: 'Git still considers the original commits merged. Fixing the feature branch and merging it again does **not** restore the reverted changes because those commits are not new work. Revert the revert with `git revert <revert-sha>` before merging the branch again.',
    },

    { t: 'h2', x: 'Removing a commit from the middle of history' },
    {
      t: 'p',
      x: 'Interactive rebase rewrites every affected commit from the selected point forward. Keep it to unpushed work or a personal branch that no one else is using.',
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
      x: 'Save and close the editor to begin. If a conflict appears, resolve it, stage the resolved files with `git add`, then run `git rebase --continue`. Use `git rebase --abort` to return to the pre-rebase state.',
    },

    { t: 'h2', x: 'Undoing things that are not commits' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Unstage a file, keep the edits
git restore --staged src/app.ts

# Discard uncommitted edits to a file. This is NOT recoverable.
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
      x: 'Git 2.23 introduced `git restore` and `git switch` to separate file restoration from branch changes. `git checkout -- file` still works, but `restore` states the file operation more clearly.',
    },

    { t: 'h2', x: 'Recovering after the wrong command', id: 'i-ran-the-wrong-command-getting-your-work-back' },
    {
      t: 'p',
      x: 'The reflog is a local record of recent `HEAD` positions, including commits that no branch currently names. Use it to locate the state before a mistaken reset, rebase or branch deletion.',
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
      x: 'The reflog cannot recover content that Git never stored. Uncommitted edits removed by `git reset --hard`, `git restore` or `git clean` are absent from the object database. An editor backup or local-history feature may still have a separate copy.',
    },

    { t: 'h2', x: 'Force-pushing without hurting anyone' },
    {
      t: 'p',
      x: 'If you intentionally rewrote a branch that already exists on the remote, update it with the guarded force option:',
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
      x: '`--force-with-lease` verifies that the remote branch still points where your clone expects. If another push changed it, Git rejects your update instead of overwriting those commits. Plain `--force` omits that protection.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is the difference between git reset and git revert?',
          a: 'reset moves a branch pointer and can remove commits from that branch’s visible history. Use it for local, unshared work. revert adds a new commit that reverses an earlier one, so it is the usual choice after the original commit has been shared.',
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
          a: 'It is appropriate for commits you have not pushed, and git rebase --abort can stop an in-progress rebase. Rebasing shared commits requires everyone who pulled them to reconcile a rewritten branch. Interactive rebase also needs an editor, so it is not suitable for many automated environments.',
        },
      ],
    },
  ],

  related: ['/guides/npm-eresolve-error/', '/guides/ssh-permission-denied-publickey/', '/guides/fix-cors-errors/'],
};
