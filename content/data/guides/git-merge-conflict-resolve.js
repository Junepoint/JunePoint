module.exports = {
  "slug": "git-merge-conflict-resolve",
  "title": "Resolving a Git Merge Conflict Without Losing Work",
  "h1": "How to resolve a Git merge conflict properly",
  "eyebrow": "Guides",
  "description": "Git stops only where both branches touched the same lines. Work out which side is ours, which is theirs, and prove nothing was dropped.",
  "standfirst": "Which version is HEAD, why the labels invert during a rebase, and the checks that catch a resolution that quietly deleted half of someone's work.",
  "keywords": [
    "git merge conflict",
    "resolve merge conflict",
    "git ours vs theirs",
    "conflict markers",
    "git merge abort",
    "git rerere"
  ],
  "cardDesc": "Read the conflict markers correctly, keep both sides where both matter, and verify the merge against each parent.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "In a merge, `ours` is the branch you already had checked out and `theirs` is the branch you named in the `git merge` command.",
        "During a rebase or `git pull --rebase` the labels invert. `ours` becomes the upstream you are replaying onto, and `theirs` is your own work.",
        "Set `merge.conflictStyle` to `zdiff3` so each conflict shows the common ancestor. Choosing between two versions is guesswork until you can see what each side actually changed.",
        "`git checkout --ours <file>` replaces the whole file, including hunks that merged cleanly. It is a blunt instrument, not a resolution.",
        "Verify with `git diff --check` for stray markers, then diff the merge commit against each parent, then run the tests. A clean text merge can still be a broken build."
      ]
    },
    {
      "t": "lede",
      "x": "Git stops the merge only where two branches changed the same region of the same file, or where one side edited a file the other removed. Everything else has already been merged and written to disk. The job in front of you is almost always smaller than the wall of angle brackets suggests, and the risk is not that you fail to make the file compile. The risk is that you make it compile by throwing away somebody's change."
    },
    {
      "t": "h2",
      "x": "What Git has actually stopped on"
    },
    {
      "t": "p",
      "x": "A conflicted merge looks like this. Git names each file it could not resolve, then refuses to create the merge commit."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "$ git merge feature/checkout\nAuto-merging src/cart.js\nCONFLICT (content): Merge conflict in src/cart.js\nAutomatic merge failed; fix conflicts and then commit the result."
    },
    {
      "t": "p",
      "x": "`Auto-merging` is good news. That file was changed on both sides and Git combined the changes without help. The `CONFLICT` line is the work list. Get the full list without scrolling through merge output:"
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# just the conflicted paths\ngit diff --name-only --diff-filter=U\n\n# with the conflict type in the two status columns\ngit status --short\n# UU src/cart.js      both modified\n# AA src/config.js    both added\n# DU src/old.js       deleted by us, modified by them"
    },
    {
      "t": "p",
      "x": "Until you resolve those paths the repository sits in a partially merged state. `MERGE_HEAD` exists, the index holds several versions of each conflicted file, and most commands that want a clean index will refuse to run. That state is recorded on disk, so it survives closing your terminal. There is no timer and nothing is lost while you think."
    },
    {
      "t": "h2",
      "x": "Which side is ours and which is theirs"
    },
    {
      "t": "p",
      "x": "This is the part people get wrong, and it is worth being precise because the answer flips depending on the command you ran. `ours` is always the side that was already checked out when the operation began. `theirs` is always the side being applied on top."
    },
    {
      "t": "table",
      "head": [
        "Command you ran",
        "ours / HEAD",
        "theirs"
      ],
      "rows": [
        [
          "`git merge topic` while on `main`",
          "`main`, your current branch",
          "`topic`, the branch you named"
        ],
        [
          "`git rebase main` while on `topic`",
          "`main`, the new base",
          "your `topic` commits, replayed one at a time"
        ],
        [
          "`git pull --rebase`",
          "the commits fetched from the remote",
          "your local commits"
        ],
        [
          "`git cherry-pick <sha>`",
          "your current branch",
          "the commit being picked"
        ],
        [
          "`git stash pop`",
          "your working tree and `HEAD`",
          "the stashed changes"
        ]
      ],
      "caption": "The side labelled ours is whatever was checked out first."
    },
    {
      "t": "p",
      "x": "The rebase row surprises people, so here is the reason. A rebase checks out the upstream branch and then replays each of your commits onto it, as though each one were being merged in. From Git's point of view you are the incoming change. If you rebase your feature branch onto `main` and reflexively pick `--ours` on every conflict, you will discard your own feature commit by commit and end up with a branch that looks exactly like `main`."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Check the marker, not your memory",
      "x": "The bottom marker names the incoming side, for example `>>>>>>> feature/checkout` during a merge or `>>>>>>> a1b2c3d (fix rounding)` during a rebase. Read that label each time rather than relying on which side you think you are on."
    },
    {
      "t": "h2",
      "x": "Make Git show you the common ancestor"
    },
    {
      "t": "p",
      "x": "The default conflict style shows two versions and no context. That is enough to see the disagreement but not enough to resolve it, because you cannot tell which side changed what. Turn on the three-way style once and every conflict afterwards is easier."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "git config --global merge.conflictStyle zdiff3\n\n# older Git, same idea with slightly noisier output\ngit config --global merge.conflictStyle diff3"
    },
    {
      "t": "p",
      "x": "`zdiff3` arrived in Git 2.35, released in January 2022. Run `git --version` to check what you have before assuming it is available. Here is the same conflict in that style:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "<<<<<<< HEAD\n  const total = subtotal + shipping + tax;\n||||||| 3f2a1c9\n  const total = subtotal + tax;\n=======\n  const total = applyDiscount(subtotal) + tax;\n>>>>>>> feature/checkout"
    },
    {
      "t": "p",
      "x": "Now the resolution is obvious rather than a coin flip. The ancestor was `subtotal + tax`. One branch added shipping. The other wrapped the subtotal in a discount. Neither change replaces the other, so the correct result keeps both:"
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "  const total = applyDiscount(subtotal) + shipping + tax;"
    },
    {
      "t": "p",
      "x": "Without the middle section you would have picked one line and silently dropped either shipping or the discount. That is the most common way real work disappears in a merge, and nothing in the tooling will warn you about it, because a file with no markers looks resolved."
    },
    {
      "t": "h2",
      "x": "When you need more than the markers"
    },
    {
      "t": "p",
      "x": "The index holds three full versions of every conflicted file. Stage 1 is the merge base, stage 2 is ours, stage 3 is theirs. You can pull any of them out and diff them with ordinary tools."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "git show :1:src/cart.js > /tmp/base.js\ngit show :2:src/cart.js > /tmp/ours.js\ngit show :3:src/cart.js > /tmp/theirs.js\n\ndiff -u /tmp/base.js /tmp/theirs.js   # what did the other side change?\n\n# same question, without temp files\ngit diff --base src/cart.js\ngit diff --ours src/cart.js\ngit diff --theirs src/cart.js"
    },
    {
      "t": "p",
      "x": "When the change is unclear, read the commits behind it. `git log --merge` limits the log to commits that touch a conflicted path and exist on only one of the two sides, which is usually a handful of commits with messages that explain the intent."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "git log --merge --oneline -- src/cart.js\ngit log --merge -p -- src/cart.js      # with the patches"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "You can put the markers back",
      "x": "If you mangle a conflicted file while editing, `git checkout --merge src/cart.js` regenerates it from the index with fresh markers. Nothing is lost as long as you have not run `git add` on the broken version."
    },
    {
      "t": "h2",
      "x": "Resolve, mark, continue"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Edit the file so it says what both sides meant",
          "x": "Delete all three or four marker lines and leave code that reflects the intent of each branch. Combine where both changes matter, choose a side only where the two are genuinely alternatives.",
          "code": null
        },
        {
          "title": "Stage the file to mark it resolved",
          "x": "`git add` is what tells Git the conflict is settled. For a modify/delete conflict where the file should go away, `git rm` is the resolution instead.",
          "code": "git add src/cart.js\n# or, if the file should be deleted\ngit rm src/old.js"
        },
        {
          "title": "Check for anything you missed",
          "x": "`git diff --check` reports leftover conflict markers as well as whitespace errors. It is fast and it catches the mistake that is most embarrassing in review.",
          "code": "git diff --check\ngit grep -n '^<<<<<<< '"
        },
        {
          "title": "Finish the operation",
          "x": "`git merge --continue` opens the prepared merge message and commits. Plain `git commit` does the same thing. During a rebase or cherry-pick use the matching `--continue` form for that command.",
          "code": "git merge --continue\n# rebase\ngit rebase --continue\n# cherry-pick\ngit cherry-pick --continue"
        }
      ]
    },
    {
      "t": "p",
      "x": "If you try to commit with unmerged paths still in the index, Git stops you:"
    },
    {
      "t": "code",
      "lang": "text",
      "x": "error: Committing is not possible because you have unmerged files.\nfatal: Exiting because of an unresolved conflict."
    },
    {
      "t": "p",
      "x": "That means a file you edited never got staged. Run `git status` again and look for the `Unmerged paths` section."
    },
    {
      "t": "h2",
      "x": "Verify that nothing was dropped"
    },
    {
      "t": "p",
      "x": "A merge commit has two parents, and that is the cheapest audit available. `HEAD^1` is the branch you were on, `HEAD^2` is the branch you merged in. Diff the merge result against each of them, restricted to the files that conflicted."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "# what the merge brought in, relative to your branch\ngit diff HEAD^1 HEAD -- src/cart.js\n\n# what survived from your branch, relative to theirs\ngit diff HEAD^2 HEAD -- src/cart.js"
    },
    {
      "t": "p",
      "x": "Read both. The first should look like the other branch's work arriving. The second should look like your branch's work still present. Anything that appears in neither diff is something you invented during the resolution, and anything you expected to see but cannot find is something you deleted. Restricting to the conflicted paths keeps the output small, because an unrestricted diff against the second parent includes every commit your branch made since the merge base."
    },
    {
      "t": "p",
      "x": "Then run the build and the test suite before pushing. Text merging works on lines and knows nothing about meaning, so two changes can merge with no conflict at all and still be incompatible. One branch renames `calculateTotal` to `computeTotal` across the files it touches. Another branch adds a new call to `calculateTotal` in a file the first branch never opened. Git merges both without a murmur. In a compiled language you get a build error, which is the good outcome. In JavaScript or Python you get a `TypeError` in production. No amount of careful marker reading catches that class of problem; only running the code does."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Look before you commit",
      "x": "`git merge --no-commit --no-ff other-branch` performs the merge and stops with the result staged, conflicts or not. It is a good habit for merges you expect to be awkward, because you review the combined tree while backing out is still a single `git merge --abort`."
    },
    {
      "t": "h2",
      "x": "Conflicts that are not about lines of code"
    },
    {
      "t": "table",
      "head": [
        "Conflict type",
        "What happened",
        "Resolution"
      ],
      "rows": [
        [
          "`CONFLICT (content)`",
          "Both sides changed overlapping lines.",
          "Edit the markers, then `git add`."
        ],
        [
          "`CONFLICT (modify/delete)`",
          "One side deleted the file, the other edited it. Git leaves the surviving version in the tree and names which side it came from.",
          "Decide whether the deletion was intentional. `git rm` to accept it, `git add` to keep the file."
        ],
        [
          "`CONFLICT (add/add)`",
          "Both sides created a file at the same path. Status shows `AA`.",
          "The file has markers like a content conflict. Merge the two versions by hand."
        ],
        [
          "`CONFLICT (rename/rename)`",
          "The same source file was renamed to two different paths.",
          "Pick one path, `git rm` the other, and re-check that imports point at the survivor."
        ],
        [
          "Submodule conflict",
          "Each side points the submodule at a different commit.",
          "Enter the submodule, check out the commit you want, then `git add` the submodule path in the parent repo."
        ],
        [
          "Binary file",
          "Git cannot merge the contents and leaves one version in place.",
          "Choose a whole file with `git checkout --ours` or `--theirs`, which is the one situation where those flags are exactly right."
        ]
      ],
      "caption": "Not every conflict is fixed by editing markers."
    },
    {
      "t": "p",
      "x": "Rename conflicts and modify/delete conflicts are the ones most likely to lose work quietly, because there are no markers to remind you a decision is being made. If a file was deleted on one side, find out why before accepting the deletion. `git log --diff-filter=D -- src/old.js` on the deleting branch shows the commit that removed it and, with luck, a message explaining what replaced it."
    },
    {
      "t": "h2",
      "x": "Backing out"
    },
    {
      "t": "p",
      "x": "Nothing about a conflicted state is permanent until you commit. Abort and the branch returns to where it was."
    },
    {
      "t": "code",
      "lang": "bash",
      "x": "git merge --abort\ngit rebase --abort\ngit cherry-pick --abort\n\n# if abort refuses and you are sure the working tree is expendable\ngit reset --merge"
    },
    {
      "t": "p",
      "x": "If you see `fatal: There is no merge to abort (MERGE_HEAD missing).` then the merge already finished, or it never started. Git's own documentation warns that `--abort` may not be able to reconstruct the original state if you had uncommitted changes when the merge began, which is the practical argument for committing or stashing first. Already committed a bad merge? That is a different problem, and [undoing a commit](/guides/git-undo-commit/) covers `git revert -m 1` and the reflog."
    },
    {
      "t": "h2",
      "x": "Having fewer conflicts next time"
    },
    {
      "t": "ul",
      "items": [
        "**Merge or rebase from the mainline often.** Conflict difficulty grows faster than branch age. A week of divergence is a chore; two months of divergence is an archaeology project.",
        "**Turn on rerere.** `git config --global rerere.enabled true` records how you resolved a conflict and replays that resolution when the same conflict appears again, which happens constantly when you rebase a long branch repeatedly. The trade-off is that it applies silently, so check the result rather than assuming the replay was right.",
        "**Do not hand-merge lockfiles.** For `package-lock.json`, `yarn.lock` or `poetry.lock`, take either side wholesale and regenerate: `git checkout --theirs package-lock.json && npm install`. A hand-edited lockfile can install a dependency graph that neither branch ever had, which is a fast route to [an ERESOLVE failure](/guides/npm-eresolve-error/) or a build that only breaks in CI.",
        "**Set up a merge tool if you like one.** `git mergetool` drives whatever three-way editor you configure. It is a preference, not a correctness feature, and the verification steps above still apply afterwards."
      ]
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "`-s ours` is not a way to resolve conflicts",
      "x": "A common suggestion for a painful merge is `git merge -s ours other-branch`. That creates a merge commit whose content is identical to your branch and discards every change from the other side, while recording in history that the branches were merged. Nobody gets a warning and the missing work is hard to spot later. What people usually want is `-X ours`, which favours your side only in the hunks that actually conflict and keeps the other side's non-conflicting changes. One character, completely different outcome."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "What do the <<<<<<< and ======= lines in my file mean?",
          "a": "They delimit the two versions Git could not reconcile. Everything between `<<<<<<< HEAD` and `=======` is the version from the branch you had checked out. Everything between `=======` and `>>>>>>> branch-name` is the incoming version. With `merge.conflictStyle` set to `diff3` or `zdiff3` you also get a third section after `|||||||` showing the common ancestor. Delete all the marker lines when you resolve, and run `git diff --check` to confirm none survived."
        },
        {
          "q": "Which side is HEAD in a merge conflict?",
          "a": "HEAD is the branch you were on before you started. If you were on `main` and ran `git merge feature`, HEAD is `main` and `feature` is the incoming side labelled at the bottom marker. The one reliable way to check mid-conflict is to read the branch name Git printed after `>>>>>>>`."
        },
        {
          "q": "Why are ours and theirs backwards during a rebase?",
          "a": "They are not backwards, they are consistent. A rebase checks out the upstream branch first and then replays your commits onto it, so the upstream is what was already there (`ours`) and each of your commits is the incoming change (`theirs`). Picking `--ours` throughout a rebase discards your own work."
        },
        {
          "q": "How do I check I did not lose changes when resolving a conflict?",
          "a": "After the merge commit exists, run `git diff HEAD^1 HEAD -- <conflicted-file>` and `git diff HEAD^2 HEAD -- <conflicted-file>`. The first shows what arrived from the other branch, the second shows what remained of yours. Anything expected but absent from both is something the resolution dropped. Then run the tests, because a merge can be textually clean and semantically broken."
        },
        {
          "q": "Can I just use git checkout --ours to fix conflicts quickly?",
          "a": "Only when you genuinely want the entire file from one side, such as a binary asset or a regenerated lockfile. It operates on whole files, so it also throws away the other side's changes in parts of the file that merged cleanly and never conflicted. For source code it is nearly always the wrong tool."
        },
        {
          "q": "How do I fix a merge conflict in package-lock.json?",
          "a": "Do not edit it. Take one complete version with `git checkout --theirs package-lock.json` (or `--ours`), then run `npm install` to regenerate it against the merged `package.json`, then `git add` the result. A manually merged lockfile can describe a dependency tree that neither branch ever installed or tested."
        },
        {
          "q": "How do I cancel a merge and start over?",
          "a": "`git merge --abort` returns the branch to its pre-merge state, and `git rebase --abort` does the same for a rebase. Both work only while the operation is still in progress. If you have already committed the merge, revert it with `git revert -m 1 <merge-sha>` or move the branch back with the reflog."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "eyebrow": "Guide",
          "title": "Undo a Git commit without losing work",
          "desc": "Reset, revert, amend or rebase, chosen by whether the commit is shared, plus reflog recovery.",
          "href": "/guides/git-undo-commit/"
        },
        {
          "eyebrow": "Guide",
          "title": "npm ERESOLVE dependency conflicts",
          "desc": "What the resolver is complaining about and why regenerating a lockfile beats editing one.",
          "href": "/guides/npm-eresolve-error/"
        },
        {
          "eyebrow": "Guide",
          "title": "SSH Permission denied (publickey)",
          "desc": "Diagnose the push that fails before any merge happens, layer by layer.",
          "href": "/guides/ssh-permission-denied-publickey/"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-08-30",
  "updated": "2026-08-30",
  "author": "jackson"
};
