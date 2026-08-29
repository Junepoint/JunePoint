module.exports = {
  slug: 'css-grid-vs-flexbox',
  title: 'CSS Grid vs Flexbox: Which to Use, and When',
  h1: 'CSS Grid vs Flexbox',
  eyebrow: 'CSS',
  schemaType: 'TechArticle',
  description:
    'A practical rule for choosing between Grid and Flexbox, the layouts each one does better, and copy-paste patterns for the ones you build most often.',
  standfirst:
    'One rule decides it in most cases: Grid for two-dimensional layout you control, Flexbox for one-dimensional distribution of content whose size you do not know.',
  keywords: ['css grid vs flexbox', 'when to use css grid', 'flexbox or grid', 'css layout guide', 'responsive grid css'],
  published: '2026-05-14',
  updated: '2026-08-10',
  author: 'alexander',
  featured: true,
  cardDesc: 'The one-dimensional / two-dimensional rule, plus copy-paste patterns for holy grail, card grids and sidebars.',

  blocks: [
    {
      t: 'takeaways',
      items: [
        '**Grid** controls rows and columns at once; you define the layout and place content into it.',
        '**Flexbox** distributes items along a single axis; content sizes itself and the container adapts.',
        'They are not competitors. Almost every real page uses Grid for page structure and Flexbox inside the components.',
        '`gap` works in both, and has for years. Stop using margins for spacing between layout items.',
      ],
    },

    { t: 'h2', x: 'The rule' },
    {
      t: 'p',
      x: '**Grid is layout-first. Flexbox is content-first.**',
    },
    {
      t: 'p',
      x: 'With Grid you draw the structure — three columns, two rows, this item spans two of them — and place content into it. With Flexbox you hand items to a container and say how to distribute whatever space is left over. The items’ own sizes drive the result.',
    },
    {
      t: 'p',
      x: 'So: do you know the shape you want? Use Grid. Do you have a row of things of unknown width that should sit sensibly next to each other? Use Flexbox.',
    },
    {
      t: 'table',
      head: ['', 'Grid', 'Flexbox'],
      rows: [
        ['Axes', 'Two at once', 'One at a time'],
        ['Driven by', 'The container’s definition', 'The items’ content'],
        ['Overlapping items', 'Yes, via grid areas', 'No'],
        ['Alignment across rows', 'Columns line up automatically', 'Each line is independent'],
        ['Best for', 'Page structure, dashboards, card grids, forms', 'Navbars, toolbars, button groups, tag lists, centring'],
      ],
    },

    { t: 'h2', x: 'The tell: does content need to line up across rows?' },
    {
      t: 'p',
      x: 'This is the most reliable practical test. In a wrapped Flexbox container, each line is laid out independently — so items on row two need not align with those on row one. In Grid, columns are defined once and every row obeys them.',
    },
    {
      t: 'p',
      x: 'A card grid where every card must be the same width is a Grid. A row of filter pills that wraps naturally is Flexbox. Building a card grid with Flexbox is the most common misapplication in production CSS, and it is why so many grids have a ragged final row.',
    },

    { t: 'h2', x: 'Patterns worth memorising' },

    { t: 'h3', x: 'Responsive card grid with no media queries' },
    {
      t: 'code',
      lang: 'css',
      x: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}`,
    },
    {
      t: 'p',
      x: 'Columns are at least 260px, share space equally, and the count adjusts to the viewport. No breakpoints, no JavaScript. `auto-fill` keeps empty tracks when there are few items; `auto-fit` collapses them so the items stretch to fill the row — that one keyword is the entire difference between the two.',
    },

    { t: 'h3', x: 'Sidebar that collapses on narrow screens' },
    {
      t: 'code',
      lang: 'css',
      x: `.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 3rem;
}

@media (max-width: 1040px) {
  .layout { grid-template-columns: minmax(0, 1fr); }
}`,
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Use `minmax(0, 1fr)`, not `1fr`',
      x: 'A `1fr` track has a minimum size of `auto`, so a wide element inside — a long code block, a table, a `<pre>` — forces the track wider and breaks your layout. `minmax(0, 1fr)` lets the track shrink so its content scrolls instead. This single substitution fixes most mysterious horizontal-scroll bugs in Grid layouts.',
    },

    { t: 'h3', x: 'Full page layout with named areas' },
    {
      t: 'code',
      lang: 'css',
      x: `.page {
  display: grid;
  min-height: 100dvh;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 240px 1fr;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
}

.page > header  { grid-area: header; }
.page > nav     { grid-area: sidebar; }
.page > main    { grid-area: main; }
.page > footer  { grid-area: footer; }

@media (max-width: 768px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main" "sidebar" "footer";
  }
}`,
    },
    {
      t: 'p',
      x: 'Named areas make the layout legible in the stylesheet itself, and rearranging for mobile is a rewritten template rather than a pile of overrides. Note `100dvh` rather than `100vh` — it accounts for mobile browser chrome that appears and disappears on scroll.',
    },

    { t: 'h3', x: 'Navbar: logo left, links right' },
    {
      t: 'code',
      lang: 'css',
      x: `.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-links {
  margin-left: auto;   /* absorbs all remaining space */
}`,
    },
    {
      t: 'p',
      x: '`margin-left: auto` on a flex item is the cleanest way to push it and everything after it to the end. It beats `justify-content: space-between` when you have three or more groups to position.',
    },

    { t: 'h3', x: 'Footer pinned to the bottom on short pages' },
    {
      t: 'code',
      lang: 'css',
      x: `body {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

main { flex: 1; }   /* takes all leftover height */`,
    },

    { t: 'h3', x: 'Centring' },
    {
      t: 'code',
      lang: 'css',
      x: `/* Either works. Grid is one line shorter. */
.centre { display: grid; place-items: center; }
.centre { display: flex; align-items: center; justify-content: center; }`,
    },

    { t: 'h2', x: 'Things people get wrong' },

    { t: 'h3', x: 'Using margins instead of `gap`' },
    {
      t: 'code',
      lang: 'css',
      x: `/* ✗ Needs a hack to remove the trailing margin */
.item { margin-right: 1rem; }
.item:last-child { margin-right: 0; }

/* ✓ */
.container { display: flex; gap: 1rem; }`,
    },
    {
      t: 'p',
      x: '`gap` has been supported in Flexbox by every major browser since 2021. It only applies *between* items, so there is no trailing space and no `:last-child` override.',
    },

    { t: 'h3', x: 'Not understanding `flex: 1`' },
    {
      t: 'code',
      lang: 'css',
      x: `flex: 1;        /* = flex: 1 1 0%   — equal widths regardless of content */
flex: auto;     /* = flex: 1 1 auto — sized by content, then grows */
flex: none;     /* = flex: 0 0 auto — never grows or shrinks */`,
    },
    {
      t: 'p',
      x: 'The difference between `flex: 1` and `flex: auto` is the basis: `0%` ignores content size entirely and gives every item an equal share; `auto` starts from the content’s natural width. Choosing the wrong one is why "equal columns" sometimes are not.',
    },

    { t: 'h3', x: 'Flex items overflowing their container' },
    {
      t: 'p',
      x: 'A flex item’s default `min-width` is `auto`, meaning it refuses to shrink below its content. A long unbroken string or a wide table then blows out the layout.',
    },
    {
      t: 'code',
      lang: 'css',
      x: `.flex-child {
  min-width: 0;        /* allow shrinking below content size */
  overflow-x: auto;    /* let the content scroll instead */
}`,
    },
    {
      t: 'p',
      x: 'Together with `minmax(0, 1fr)` in Grid, this is the answer to nearly every "why does my page scroll sideways on mobile" question.',
    },

    { t: 'h2', x: 'Order, and why it can be an accessibility bug' },
    {
      t: 'p',
      x: 'Both `order` in Flexbox and explicit placement in Grid change **visual** order only. The DOM order is unchanged, and that is what screen readers announce and what Tab follows.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Visual order and focus order must match',
      x: 'Reordering items visually so that keyboard focus jumps around the screen is a WCAG 2.4.3 failure. It is genuinely disorienting for keyboard and screen-reader users. Use reordering for cosmetic adjustments; if the reading order should change, change the HTML.',
    },

    { t: 'h2', x: 'Subgrid' },
    {
      t: 'p',
      x: 'Subgrid lets a nested grid inherit its parent’s tracks — which finally solves aligning content *inside* cards across a row. Without it, three cards with different-length titles have their buttons at three different heights.',
    },
    {
      t: 'code',
      lang: 'css',
      x: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;   /* title, body and footer align across all cards */
}`,
    },
    {
      t: 'p',
      x: 'Supported in every current major browser since late 2023. If you must support older versions, the fallback is a fixed `min-height` on the title, or Flexbox with `margin-top: auto` on the footer.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Should I use Grid or Flexbox?',
          a: 'Grid when you are defining a layout in two dimensions and want content placed into it. Flexbox when you are distributing a row or column of items whose sizes you do not control. Most pages use both — Grid for page structure, Flexbox inside components.',
        },
        {
          q: 'Is Grid slower than Flexbox?',
          a: 'Not in any way you will measure. Both are implemented natively and highly optimised. Choose on which one expresses the layout more clearly; layout performance problems in practice come from thrashing and forced reflows, not from the choice of layout module.',
        },
        {
          q: 'Can I nest Grid inside Flexbox and vice versa?',
          a: 'Yes, and you should. A flex navbar containing a grid dropdown is entirely normal. Each container establishes its own formatting context, so they compose freely.',
        },
        {
          q: 'Why is my grid item overflowing its column?',
          a: 'Because 1fr has a minimum of auto, so wide content forces the track wider. Use minmax(0, 1fr) instead, and add overflow-x: auto to the offending child. The Flexbox equivalent is min-width: 0.',
        },
        {
          q: 'What is the difference between auto-fill and auto-fit?',
          a: 'auto-fill keeps empty tracks in place when there are not enough items, so three cards in a six-column grid stay card-width. auto-fit collapses the empty tracks, letting the three cards stretch across the whole row. Choose based on whether you want items to stretch when few.',
        },
        {
          q: 'Do I still need media queries?',
          a: 'Far fewer. minmax with auto-fill handles most responsive grids intrinsically. Container queries go further, letting a component respond to its own width rather than the viewport — which is what you usually wanted from a media query in the first place.',
        },
      ],
    },
  ],

  related: ['/tools/color-contrast-checker/', '/guides/react-usestate-not-updating/', '/guides/javascript-async-await-explained/'],
};
