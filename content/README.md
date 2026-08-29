# JunePoint content network

A small static site generator that builds the ad-supported publishing side of
junepoint.com. It writes plain HTML into `public/`, which Create React App copies
verbatim into `build/`.

## Why it works this way

The portfolio is a Create React App SPA. Every React route renders client-side
into an empty `<div id="root">`, so a crawler fetching `/business-websites`
receives a blank shell. That is fine for a portfolio and unusable for content
that needs to rank or pass AdSense review.

Anything in `public/` is served as-is. So the network is generated as real
static HTML — no JavaScript required to read a page, no hydration, one cached
stylesheet across the whole site. The React app is never touched.

```
content/data/**  →  node content/build.js  →  public/**  →  react-scripts build  →  build/**
```

## Commands

```bash
npm run build:content    # generate into public/
npm run build            # build:content, then the React build
npm start                # build:content, then the dev server
```

Generated output is gitignored. `content/data/**` is the source of truth.

## Ads

**Ads only ever appear on generated pages.** The React portfolio at `/` and its
routes receive no ad markup and no loader script — `lib/ads.js` is only reachable
from this generator.

Nothing is emitted until a publisher ID is set, because an unfilled `<ins>`
collapses to zero height and reads as a broken implementation:

```bash
ADSENSE_CLIENT=ca-pub-0000000000000000 npm run build   # enable
AD_PREVIEW=1 npm run build:content                     # draw placeholder boxes locally
```

Slot IDs come from `AD_SLOT_*` environment variables (see `config.js`). Add them
to the GitHub Actions workflow as repository secrets so production builds pick
them up. `ads.txt` is generated from `ADSENSE_CLIENT` automatically.

Placement is decided in `lib/renderers.js → adPositions()`: one unit after the
opening blocks, up to four in-content units snapped to section boundaries at
least seven blocks apart, one sticky sidebar unit (hidden below 1040px), and one
footer unit.

## Adding a page

Drop a file in `content/data/{tools,guides,reviews}/`. The filename must match
the `slug` — the build asserts this. It is picked up automatically: hub listing,
sitemap entry, sidebar cross-links and structured data all follow.

```js
module.exports = {
  slug: 'my-page',              // must equal the filename
  title: 'Under 60 chars',      // <title>
  h1: 'Page heading',
  eyebrow: 'Category label',
  description: '70–160 chars',  // meta description
  standfirst: 'One-sentence intro under the h1.',
  keywords: ['primary term', 'secondary term'],
  published: '2026-01-01',
  updated: '2026-08-01',
  author: 'jackson',            // key in data/authors.js
  featured: false,              // surfaces in the hub's "Most used" row
  blocks: [ /* see below */ ],
  related: ['/tools/json-formatter/'],
};
```

Tools additionally take `tool: { html, js }`. The JS is inlined at the end of the
page and must be vanilla and self-contained. **Avoid backticks and `${` in that
string** — it lives inside a template literal in the data file.

## Content blocks

Articles are arrays of typed blocks rather than raw HTML, so structure stays
machine-readable: `h2` blocks build the table of contents, `faq` blocks generate
FAQPage schema, and `pick` blocks generate ItemList schema.

| Type | Shape |
| --- | --- |
| `p`, `lede` | `{ t:'p', x:'text' }` |
| `h2`, `h3` | `{ t:'h2', x:'Heading', id:'optional' }` |
| `ul`, `ol` | `{ t:'ul', items:[…] }` |
| `code` | `{ t:'code', lang:'bash', x:'…' }` |
| `note` | `{ t:'note', kind:'info\|tip\|warn\|danger', title, x }` |
| `takeaways` | `{ t:'takeaways', items:[…] }` |
| `steps` | `{ t:'steps', items:[{title, x, code}] }` |
| `table` | `{ t:'table', head:[…], rows:[[…]], caption }` |
| `pick` | `{ t:'pick', name, award, summary, price, bestFor, body:[…], pros:[…], cons:[…] }` |
| `faq` | `{ t:'faq', items:[{q, a}] }` |
| `cards` | `{ t:'cards', items:[{title, desc, href, eyebrow}] }` |
| `html` | `{ t:'html', x:'<raw markup>' }` |

Inline formatting inside any `x` string: `**bold**`, `*italic*`, `` `code` ``,
`[label](/href)`. Everything else is escaped, so content cannot inject markup.

## Layout

```
content/
  config.js            site identity, sections, AdSense wiring
  build.js             entry point — loads data, renders, writes public/
  assets/              site.css and site.js, copied to public/assets/jp/
  lib/
    html.js            escaping, inline formatting, slugs
    blocks.js          block → HTML renderer
    ads.js             ad units (generated pages only)
    seo.js             JSON-LD graph builders
    layout.js          document shell: head, header, footer
    renderers.js       article / tool / hub / prose page types
  data/
    authors.js         bylines
    hub-intros.js      intro copy per section hub
    portal.js          the /resources/ front door
    pages.js           about, contact, legal
    tools|guides|reviews/
```

## Editorial constraints worth preserving

The buying guides state plainly that they are desk research rather than hands-on
testing, and `/legal/editorial-policy/` sets out what that method cannot tell
you. That framing is deliberate — fabricated test results would be both
dishonest and a Google "helpful content" liability. Keep it if you extend the
reviews section, and keep pricing dated with a note to verify.
