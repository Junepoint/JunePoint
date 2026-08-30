# Editorial pipeline

Drafts articles with Claude, gates them, and opens a pull request.

```bash
npm run draft -- --dry-run          # show what is queued, call nothing
ANTHROPIC_API_KEY=… npm run draft -- --count 2
npm run lint:style                  # house style + duplicate check
```

Scheduled by `.github/workflows/editorial.yml`, weekdays at 09:00 UTC.

## What is actually enforced

`house-style-lint.js` fails the build on any of these, and they are all tested:

| Rule | How |
| --- | --- |
| No em-dash in prose | Direct scan, code spans excluded |
| No spaced en-dash as a connector | Unspaced ranges (`$10–$30`) and compounds (`EU–US`) allowed |
| No filler phrases | Banlist of 22 machine-writing tells |
| Human-like cadence | Standard deviation of sentence length must be >= 6 words |
| No wall-of-text sentences | Under 15% of sentences may exceed 45 words |
| Enough substance | 900 words of prose, 600 for a tool page |
| FAQ present | Required for FAQPage structured data |
| **No duplicate articles** | Fails on a matching slug, >60% title overlap, or 3+ shared keywords with any published page |

`validate.js` then checks schema, canonicals, structured data, internal links,
duplicate titles and descriptions, and image alt text.

## What is NOT enforced, and cannot be

Be clear-eyed about this. The pipeline is mechanical.

- **Factual accuracy.** A model will produce a confident, wrong price or version
  number. Nothing here can catch that. In building this site by hand, two
  incorrect figures were caught only by running the calculator they described.
  An unattended pipeline has no equivalent check.
- **Plagiarism.** Nothing compares output against the open web. If that matters,
  add a Copyscape or Originality.ai call as a gate before the PR opens.
- **Whether the article is worth publishing at all.**

That is why the workflow opens a pull request instead of pushing to `main`, and
why the PR body carries a review checklist.

## Volume

The cron is set to **weekdays, two per day** rather than daily. That is roughly
500 pages a year, which is already fast.

Google's spam policy on *scaled content abuse* targets mass-produced pages made
mainly to rank, and it applies whether a person or a model wrote them. The
penalty lands on the whole domain, not the individual page. Turning this up to
three a day, seven days a week, on a domain with no established authority, is
the shape of thing that policy exists to catch.

The queue in `commissions.json` is the real throttle. It is deliberately finite: an
empty queue stops the pipeline rather than inventing filler. Add topics you would
have written anyway.

## Publishing without review

Change the last workflow step to push to `main` instead of opening a PR. Before
doing that, decide who is accountable when a wrong number goes live on a page
that gives people tax or security guidance, because at that point nobody has
read it.
