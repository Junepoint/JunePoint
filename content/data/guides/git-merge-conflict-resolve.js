module.exports = {
  "slug": "git-merge-conflict-resolve",
  "title": "Git Merge Conflicts: Which Side Is Which",
  "h1": "Resolving a Git merge conflict properly",
  "eyebrow": "Guide",
  "description": "Which side is ours, which is theirs, why the labels flip during a rebase, and the commands that prove your resolution kept both branches' work.",
  "standfirst": "Conflict markers tell you what each side ended up with, not what you should keep. Here is how to read them, why a rebase reverses the ours/theirs labels, and how to check that nothing was quietly dropped.",
  "keywords": [
    "git merge conflict",
    "resolve merge conflict",
    "git ours vs theirs",
    "conflict markers",
    "git rebase conflict",
    "verify merge resolution"
  ],
  "cardDesc": "Read the markers, work out which side is ours, and prove the resolution kept work from both branches.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "`ours` is whatever was already checked out when the conflict happened. In a merge that is your branch. In a rebase it is the branch you are replaying onto, which is usually somebody else's.",
        "Turn on a three-way conflict style so the common ancestor is visible: `git config --global merge.conflictstyle zdiff3`.",
        "Choosing a whole side is the exception. Most conflicts are two intentional edits to the same region, and both need to survive.",
        "`git add` marks a file resolved whether you resolved it or not. Run `git diff --cached --check` before committing.",
        "Once the merge commit exists, `git show --cc <sha>` prints only what differs from both parents. That is your resolution, and nothing in it should surprise you."
      ]
    },
    {
      "t": "h2",
      "x": "Which side is ours?"
    },
    {
      "t": "p",
      "x": "The mechanics never change. Git stores three versions of a conflicted file in the index: stage 1 is the common ancestor, stage 2 is the version that was already checked out, stage 3 is the version being applied on top. `--ours` always means stage 2 and `--theirs` always means stage 3. What moves around is which of your branches lands in which slot."
    },
    {
      "t": "table",
      "head": [
        "Command",
        "`--ours` (stage 2, above `=======`)",
        "`--theirs` (stage 3, below `=======`)"
      ],
      "rows": [
        [
          "`git merge topic` while on `main`",
          "`main`, the branch you are on",
          "`topic`, the branch you named"
        ],
        [
          "`git pull` (merge)",
          "your local branch",
          "the upstream branch"
        ],
        [
          "`git rebase main` while on `topic`",
          "`main`, the branch you are replaying onto",
          "`topic`, the one commit currently being replayed"
        ],
        [
          "`git pull --rebase`",
          "the upstream branch",
          "your local commits"
        ],
        [
          "`git cherry-pick <sha>`",
          "your current `HEAD`",
          "the commit being picked"
        ]
      ],
      "caption": "The bottom two rows are the ones that catch people out."
    },
    {
      "t": "p",
      "x": "Rebase reverses the labels because it reverses the operation. It feels like you are pulling `main` into your feature branch, but Git does the opposite: it checks out `main`, then replays your commits on top one patch at a time. At the moment a conflict appears, the checked-out side is `main` and the incoming patch is yours. Run `git checkout --ours config.js` there, expecting to keep your own work, and you have just deleted it."
    },
    {
      "t": "p",
      "x": "There is a habit that removes the ambiguity entirely: stop thinking in terms of ours and theirs, and read the marker labels instead. Git writes the branch name or the commit subject after `>>>>>>>` for exactly this reason."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "`-X ours` and `-s ours` are not variations of the same thing",
      "x": "`git merge -X ours branch` resolves conflicting hunks in your favour but still takes every clean change from the other branch. `git merge -s ours branch` takes nothing at all. It writes a merge commit whose tree is byte-identical to your current one, and the other branch is then permanently recorded as merged, so no future merge will bring its work across. That behaviour is useful for retiring a dead branch on purpose. It is a disaster as a shortcut past a conflict you did not want to read."
    },
    {
      "t": "h2",
      "x": "Read the markers with the ancestor visible"
    },
    {
      "t": "p",
      "x": "The default conflict style shows you two endings and no history. You see what each side finished with, then infer what each side was trying to change. The three-way styles print the common ancestor between the `|||||||` and `=======` lines, which turns guesswork into reading."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# zdiff3 needs Git 2.35 or newer (released January 2022); check yours first\ngit --version\ngit config --global merge.conflictstyle zdiff3\n\n# On older Git, use the original three-way style\ngit config --global merge.conflictstyle diff3"
    },
    {
      "t": "p",
      "x": "A conflict then looks like this:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "<<<<<<< HEAD\n  timeout: 30,\n  retries: 0,\n||||||| 4a1c9e2\n  timeout: 10,\n  retries: 0,\n=======\n  timeout: 10,\n  retries: 3,\n>>>>>>> feature/http-retries"
    },
    {
      "t": "p",
      "x": "Now the answer is obvious. Our side raised the timeout and left retries alone. Their side left the timeout alone and added retries. Neither block is correct on its own: the resolution is `timeout: 30` with `retries: 3`, and no version of the file anywhere in the repository contains that text yet. Without the ancestor block you would have seen two plausible snippets and a coin toss."
    },
    {
      "t": "ul",
      "items": [
        "`<<<<<<< HEAD` to the next marker is stage 2, readable as `git show :2:path` and selectable with `--ours`.",
        "Between `|||||||` and `=======` is stage 1, the merge base. It appears only under `diff3` or `zdiff3`.",
        "`=======` to `>>>>>>>` is stage 3, readable as `git show :3:path` and selectable with `--theirs`.",
        "The text after `>>>>>>>` is the branch name during a merge, or the hash and subject of the commit being replayed during a rebase."
      ]
    },
    {
      "t": "p",
      "x": "`zdiff3` differs from `diff3` by hoisting lines that all three versions share out of the conflict block and into the surrounding file. The conflict gets smaller and the disagreement gets easier to see. Same information, less scrolling."
    },
    {
      "t": "h2",
      "x": "Work through it one file at a time"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "List every conflicted path",
          "x": "`git status` narrates the situation, but the short form is faster to scan and the filtered list is what you want in a script. In the short output, `UU` is both modified, `AA` is both added, `UD` is modified by us and deleted by them, and `DU` is the reverse.",
          "code": "git status --short\ngit diff --name-only --diff-filter=U"
        },
        {
          "title": "Find out what each side was doing",
          "x": "Before editing anything, read the commits behind each version. The symmetric difference splits them by side: `<` marks a commit on your branch and `>` marks one on theirs. During a rebase, substitute `REBASE_HEAD` for `MERGE_HEAD`.",
          "code": "git log --oneline --left-right HEAD...MERGE_HEAD -- src/config.js\ngit log --merge -p -- src/config.js"
        },
        {
          "title": "Edit the file, not just the marked region",
          "x": "Conflict markers cover the lines Git could not reconcile. They do not cover the consequences. If their side added a required argument that your side's new call sites do not pass, fixing those call sites is part of this resolution, even though nothing near them is marked.",
          "code": "git diff --base -- src/config.js\ngit diff --theirs -- src/config.js"
        },
        {
          "title": "Mark the file resolved",
          "x": "Staging is what tells Git you are finished with that path. Git does not inspect what you staged, so the step is a promise rather than a check.",
          "code": "git add src/config.js"
        },
        {
          "title": "Build and test before the commit exists",
          "x": "A conflicted tree is the cheapest place to discover you got it wrong, because `--abort` is still available and no history has been written yet."
        },
        {
          "title": "Finish the operation",
          "x": "Committing without `-m` keeps the prepared message, which lists the conflicted paths. That list is genuinely useful months later when somebody bisects to your merge and wants to know where the risk was.",
          "code": "git commit              # merge\ngit rebase --continue   # rebase"
        }
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Nothing stops you committing conflict markers",
      "x": "`git add` accepts a file with `<<<<<<<` still in it, and so does `git commit`. Linters usually miss markers inside a comment block, a Markdown file or a test fixture. `git diff --cached --check` reports leftover conflict markers in staged content, and it costs nothing to run."
    },
    {
      "t": "h2",
      "x": "Prove that nothing was dropped"
    },
    {
      "t": "p",
      "x": "This is the step people skip, and it is the one that matters. A resolution that compiles can still have discarded a colleague's bug fix without a murmur, because deleting half of a conflict block usually leaves perfectly valid code behind. Four checks catch nearly all of it."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# 1. Before committing: what does this merge do to my branch?\ngit diff HEAD\n\n# 2. Before committing: what does it do to theirs?\n#    Their work that you dropped shows up here as a deletion.\ngit diff MERGE_HEAD\n\n# 3. Anywhere: markers that survived into the tree\ngit grep -nE '^(<{7}|={7}|>{7})( |$)'\n\n# 4. After committing: only the hunks that match neither parent\ngit show --cc HEAD"
    },
    {
      "t": "p",
      "x": "The second command is the important one. Reading `git diff HEAD` is natural, since it shows the change arriving in your branch, and almost nobody reads the mirror image. Yet that is precisely where a dropped change appears: as a line their branch had and the merge result does not."
    },
    {
      "t": "p",
      "x": "The fourth command is the audit. A combined diff omits any hunk that agrees with one of the parents, so on a well-behaved merge `git show --cc` prints very little: only the regions where you made a decision. Every line in that output should be one you can explain. Lines you do not recognise are the definition of a resolution mistake."
    },
    {
      "t": "p",
      "x": "One caveat about a check that looks stronger than it is. After merging `origin/main`, `git log --oneline HEAD..origin/main` prints nothing, and people read that emptiness as proof the merge is complete. It proves reachability and nothing else. Every one of those commits is now an ancestor of yours, which says exactly nothing about whether their contents survived your editing. Ancestry is bookkeeping. Content is the part you have to check yourself."
    },
    {
      "t": "h2",
      "x": "A clean merge can still be wrong"
    },
    {
      "t": "p",
      "x": "Git merges text. It has no idea what your code means, so two changes can be individually correct, textually far apart, and jointly broken. These are semantic conflicts, and they never produce a marker."
    },
    {
      "t": "ul",
      "items": [
        "One branch renames `getUser` to `fetchUser`. The other adds four new call sites for `getUser`. Different lines, clean merge, failing build.",
        "Both branches add a database migration numbered `0042`. Both files merge in fine, and your migration runner then picks an arbitrary order or refuses to run at all.",
        "One branch tightens a validation rule while the other adds a fixture that violates it. Nothing conflicts. The suite fails on the merge commit and on neither parent.",
        "Both branches pin the same dependency at incompatible versions, one in `package.json` and one in a workspace package."
      ]
    },
    {
      "t": "p",
      "x": "The defence is unglamorous: run the full test suite on the merge result rather than on either branch, and do it before you push. A test that passes on both parents and fails on the merge is not flaky infrastructure. It is the merge telling you something true."
    },
    {
      "t": "h2",
      "x": "Lockfiles, binaries and delete/modify conflicts"
    },
    {
      "t": "p",
      "x": "Some conflicts should never be resolved by hand."
    },
    {
      "t": "ul",
      "items": [
        "**Lockfiles.** Resolve `package.json` first, then regenerate. Recent npm versions can untangle a conflicted `package-lock.json` during `npm install`; if yours cannot, delete the lockfile and reinstall rather than editing the conflict. A hand-merged lockfile describes a dependency tree no resolver would ever have produced. See [npm ERESOLVE](/guides/npm-eresolve-error/) for what tends to happen next.",
        "**Binary and generated files.** There is no merging a PNG or a compiled asset. Pick a side with `git checkout --ours path` or `--theirs`, or regenerate the file from its source. On Git 2.23 and later (August 2019), `git restore --ours path` does the same job under a clearer name.",
        "**Delete/modify conflicts.** One side deleted the file, the other edited it. Choosing a side is close to meaningless here, because one of the stages does not exist. Ask instead whether the edit still needs a home: keep the file with `git add path`, or accept the deletion with `git rm path`."
      ]
    },
    {
      "t": "p",
      "x": "Delete/modify is worth slowing down for. It usually means one branch moved or split a module while another kept working inside the old one, so the honest resolution is often to port the edit into the new location and then take the deletion."
    },
    {
      "t": "h2",
      "x": "Backing out"
    },
    {
      "t": "p",
      "x": "Abandoning a bad resolution is cheap. Do it early, rather than pushing through a merge you no longer understand."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "git merge --abort        # back to the pre-merge state\ngit rebase --abort\ngit cherry-pick --abort\n\n# Botched one file but want to keep the rest of the work?\n# This restores the conflict markers for that path alone.\ngit checkout -m -- src/config.js\n\n# Already committed the merge and want it gone (unpushed branch only)\ngit reset --hard ORIG_HEAD"
    },
    {
      "t": "ul",
      "items": [
        "`--abort` restores the pre-merge state, index included. It can refuse, or leave a mess, if you had uncommitted changes before starting. That is the argument for committing or stashing first.",
        "`git checkout -m -- path` re-creates the conflicted version of one file from the stages still sitting in the index. It works right up until you finish or abort the operation.",
        "Merge sets `ORIG_HEAD` to the commit you were on beforehand, so `git reset --hard ORIG_HEAD` undoes a merge you have not shared. If you already pushed, revert instead of resetting: see [undoing a Git commit](/guides/git-undo-commit/).",
        "`git reflog` still holds the pre-merge position for weeks after a careless reset."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Let Git remember repeated resolutions",
      "x": "`git config --global rerere.enabled true` records how you resolved each conflict hunk and replays that resolution when the identical conflict shows up again. On a long-running branch you rebase repeatedly, it saves real work. It also replays your mistakes without asking, so keep verifying the result: `git rerere diff` shows what it applied on your behalf."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "Undo a Git commit without losing work",
          "desc": "Reset, revert, amend and the reflog, including how to undo a merge you already pushed.",
          "href": "/guides/git-undo-commit/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "npm ERESOLVE dependency conflicts",
          "desc": "What to do after a lockfile conflict leaves the dependency tree inconsistent.",
          "href": "/guides/npm-eresolve-error/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "A merge that moves or renames a file often surfaces here first.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "In a merge conflict, is HEAD my branch or the other one?",
          "a": "During `git merge`, `HEAD` is your branch: the one you were on when you ran the command, shown above the `=======` line. During a rebase it is the branch you are replaying onto, so the block labelled `HEAD` holds the upstream code and your own commit sits below the `=======`. Reading the branch name after `>>>>>>>` is more reliable than remembering the rule."
        },
        {
          "q": "Why does --ours mean the opposite thing during a rebase?",
          "a": "Because the operation is inverted. A rebase checks out the upstream branch and replays your commits on top as a series of patches, so the already-checked-out side, which is what `--ours` always refers to, is upstream rather than yours. Nothing is inconsistent: `--ours` is stage 2 of the index in both cases, and only the contents of that slot differ."
        },
        {
          "q": "How do I keep both changes in a merge conflict?",
          "a": "Edit the file by hand and delete the three marker lines. There is no flag for it, because Git cannot know what combining two edits means for your code. Sometimes the answer is both lines in sequence; sometimes it is one line carrying both intentions. Turning on `merge.conflictstyle zdiff3` shows the common ancestor, which usually makes the combination obvious."
        },
        {
          "q": "How do I check I did not lose someone else's changes?",
          "a": "Before committing, run `git diff MERGE_HEAD`. That shows the merge result from the other branch's point of view, so anything of theirs you dropped appears as a deletion. After committing, `git show --cc <sha>` prints only the hunks matching neither parent, which is a short list on a healthy merge and should contain nothing you cannot account for."
        },
        {
          "q": "Can I just delete the conflict markers and commit?",
          "a": "Git will let you, and that is the problem. Removing markers without deciding what the code should do produces a commit that compiles while silently discarding half of somebody's change. Run `git diff --cached --check` before committing to catch markers you missed, and run the tests against the merge result rather than trusting either parent."
        },
        {
          "q": "How do I fix a merge conflict in package-lock.json?",
          "a": "Do not resolve it by hand. Resolve `package.json`, then let the tool regenerate the lockfile: recent npm versions handle a conflicted lockfile during `npm install`, and deleting the file before reinstalling works everywhere. A hand-edited lockfile can describe a tree the resolver would never produce, which then breaks on a teammate's machine or in CI."
        },
        {
          "q": "What does 'Automatic merge failed; fix conflicts and then commit the result' mean?",
          "a": "Git merged everything it could and stopped on the files it could not. Your working tree now holds a mixture of merged content and marked conflicts, while the index holds all three stages of every conflicted file. Run `git status` for the list, resolve each path, `git add` it, then `git commit`. Nothing is lost at this point, and `git merge --abort` returns you to where you started."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-08-30",
  "updated": "2026-08-30",
  "author": "jackson",
  "related": [
    "/guides/npm-eresolve-error/",
    "/guides/cannot-find-module-node/"
  ]
};
