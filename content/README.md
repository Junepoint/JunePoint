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
static HTML. No JavaScript is required to read a page, there is no hydration, and one cached
stylesheet across the whole site. The React app is never touched.

```
content/data/**  →  node content/build.js  →  public/**  →  react-scripts build  →  build/**
```

## Commands

```bash
npm run build:content    # generate into public/
npm run check:content    # validate the generated output (exits non-zero on failure)
npm run build            # build:content, React build, then the SPA 404 fallback
npm start                # build:content, then the dev server
```

Generated output is gitignored. `content/data/**` is the source of truth.

## Turning ads on

Ads are off until `ADSENSE_CLIENT` is set. Nothing is emitted before that: no
loader script, no `<ins>` units, and `ads.txt` stays commented out. An unfilled
`<ins>` collapses to zero height and reads as a broken implementation, which is
worse than no ad at all.

The order matters, because AdSense will not review a site it cannot verify.

1. **Deploy the content first.** AdSense reviews a live site. The pages must be
   reachable at junepoint.com and indexed well enough to look like a real
   publication.

2. **Apply at adsense.google.com** with `junepoint.com` as the site. You get a
   publisher ID of the form `ca-pub-0000000000000000` immediately, before
   approval.

3. **Add it as a GitHub Actions secret.** Settings → Secrets and variables →
   Actions → New repository secret, named `ADSENSE_CLIENT`. The workflow already
   passes it to the build.

4. **Redeploy.** That publishes two verification signals at once:
   - `junepoint.com/ads.txt` containing `google.com, pub-…, DIRECT, f08c47fec0942fa0`
   - a `<meta name="google-adsense-account">` tag on every generated page

   Either satisfies AdSense's ownership check. The ads.txt route is preferred
   here because it needs no change to the React shell.

   Note the gap this closes: AdSense usually checks the root domain, and
   `junepoint.com/` is the React portfolio, which deliberately carries no ad
   code. `ads.txt` sits at the root and solves that. If AdSense insists on the
   meta tag instead, add this one line to `public/index.html` — it is a
   verification tag and displays nothing:

   ```html
   <meta name="google-adsense-account" content="ca-pub-0000000000000000" />
   ```

5. **Verify in the AdSense console**, then wait for review. This takes anywhere
   from a few days to several weeks. Units render blank during review; that is
   expected and not a fault.

6. **On approval, create seven display units** in AdSense and copy each slot ID
   into a matching secret:

   | Secret | Placement | Suggested unit type |
   | --- | --- | --- |
   | `AD_SLOT_ARTICLE_TOP` | after the article intro | Display, responsive |
   | `AD_SLOT_IN_CONTENT` | between sections (up to 4×) | In-article |
   | `AD_SLOT_SIDEBAR` | sticky sidebar, desktop only | Display, vertical |
   | `AD_SLOT_FOOTER` | end of page | Display, responsive |
   | `AD_SLOT_TOOL_TOP` | above a tool | Display, horizontal |
   | `AD_SLOT_TOOL_RESULT` | below tool results | Display, responsive |
   | `AD_SLOT_HUB` | section hubs and portal | Display, responsive |

   Units work without slot IDs, but AdSense cannot report per-placement revenue,
   so you lose the data needed to optimise.

7. **Redeploy and confirm.** `curl -s https://junepoint.com/tools/json-formatter/ | grep adsbygoogle`
   should return the `<ins>` markup.

### Local preview

```bash
AD_PREVIEW=1 npm run build:content    # dashed placeholder boxes, no real ads
ADSENSE_CLIENT=ca-pub-0000000000000000 npm run build:content   # real markup, test ID
```

Never leave a test publisher ID in a deployed build.

### Where ads appear

Only on generated pages. `lib/ads.js` is unreachable from `src/`, so the React
portfolio at `/` and its routes carry no ad markup and no loader script. Legal,
about and contact pages are also excluded.

Placement is decided in `lib/renderers.js → adPositions()`: one unit after the
opening blocks, up to four in-content units snapped to section boundaries at
least seven blocks apart, one sticky sidebar unit (hidden below 1040px), and one
footer unit.

## The SPA 404 fallback

`content/spa-fallback.js` runs after `react-scripts build` and copies
`build/index.html` to `build/404.html`. GitHub Pages serves that file for any
path it cannot resolve, so React routes survive a direct link or a refresh, and
unknown paths hit the catch-all in `src/App.js`.

The HTTP status remains 404 even though the page renders. That is why the React
sub-routes are still kept out of `sitemap.xml` — submitting them would feed
Google URLs that answer 404. Generated pages under `/tools`, `/guides` and
`/reviews` are real files and return a genuine 200.

## Adding a page

Drop a file in `content/data/{tools,guides,reviews}/`. The filename must match
the `slug`; the build asserts this. It is picked up automatically: hub listing,
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
string** because it lives inside a template literal in the data file.

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
  build.js             entry point; loads data, renders, writes public/
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
  validate.js          post-generation checks (npm run check:content)
  spa-fallback.js      post-build: writes build/404.html
```

## Editorial constraints worth preserving

The buying guides state plainly that they are desk research rather than hands-on
testing, and `/legal/editorial-policy/` sets out what that method cannot tell
you. That framing is deliberate. Fabricated test results would be both
dishonest and a Google "helpful content" liability. Keep it if you extend the
reviews section, and keep pricing dated with a note to verify.
