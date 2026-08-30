module.exports = {
  slug: 'css-grid-vs-flexbox',
  title: 'CSS Grid vs. Flexbox: How to Choose',
  h1: 'CSS Grid vs. Flexbox',
  eyebrow: 'CSS',
  schemaType: 'TechArticle',
  description:
    'A practical way to choose between Grid and Flexbox, with common layout patterns and the details that prevent overflow and alignment bugs.',
  standfirst:
    'Use Grid when rows and columns need to work together. Use Flexbox when items need to share space along one axis. Most layouts become easier once you start with that distinction.',
  keywords: ['css grid vs flexbox', 'when to use css grid', 'flexbox or grid', 'css layout guide', 'responsive grid css'],
  published: '2026-05-14',
  updated: '2026-08-10',
  author: 'jackson',
  featured: true,
  cardDesc: 'A practical Grid-or-Flexbox decision rule, with patterns for card grids, sidebars and component layouts.',

  blocks: [
    {
      t: 'takeaways',
      items: [
        '**Grid** manages rows and columns together. The container defines the tracks, and content is placed into them.',
        '**Flexbox** distributes items along one axis. Their content influences their size, and the container handles the remaining space.',
        'The two are complementary. A page might use Grid for its main structure and Flexbox within a navigation bar or toolbar.',
        '`gap` works with both modules and is usually clearer than item margins for spacing within a layout.',
      ],
    },

    { t: 'h2', x: 'Start with the layout’s dimensions' },
    {
      t: 'p',
      x: '**Choose Grid when both rows and columns matter. Choose Flexbox when one axis does most of the work.**',
    },
    {
      t: 'p',
      x: 'With Grid, you define a structure such as three columns and two rows, then decide where content belongs. With Flexbox, you give a container some items and describe how they should use the available space. The items’ intrinsic sizes remain part of that calculation.',
    },
    {
      t: 'p',
      x: 'If you know the shape of the layout before its content arrives, Grid is a good starting point. If you have a row or column of items with variable sizes, Flexbox is often the simpler fit.',
    },
    {
      t: 'table',
      head: ['', 'Grid', 'Flexbox'],
      rows: [
        ['Axes', 'Two at once', 'One at a time'],
        ['Driven by', 'The container’s definition', 'The items’ content'],
        ['Overlapping items', 'Yes, via grid areas', 'No'],
        ['Alignment across rows', 'Columns line up automatically', 'Each line is independent'],
        ['Good fit for', 'Page structure, dashboards, card grids, forms', 'Navbars, toolbars, button groups, tag lists, centring'],
      ],
    },

    { t: 'h2', x: 'Check whether separate rows must align' },
    {
      t: 'p',
      x: 'This is a useful test when the choice is not obvious. A wrapped Flexbox container lays out each line independently, so the items on one row do not have to align with the next row. Grid defines its columns once and uses them for every row.',
    },
    {
      t: 'p',
      x: 'A set of equal-width cards usually belongs in Grid. A row of filter pills that should wrap according to their labels usually belongs in Flexbox. Flexbox can make a card layout, but its independent lines often leave the last row looking unrelated to the rows above it.',
    },

    { t: 'h2', x: 'Useful layout patterns' },

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
      x: 'Each column is at least 260px wide, and the available columns share the remaining space equally. The count changes with the viewport without a breakpoint or JavaScript. `auto-fill` retains empty tracks when there are only a few items; `auto-fit` collapses those tracks and lets the existing items stretch.',
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
      x: 'A `1fr` track has a minimum size of `auto`. Wide content such as a long code block, table or `<pre>` can therefore force the track beyond its container. `minmax(0, 1fr)` allows the track to shrink so the child can scroll instead. Check this first when a Grid layout causes unexpected horizontal scrolling.',
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
      x: 'Named areas make the page structure visible in the stylesheet. For a narrow screen, you can rewrite the template instead of overriding each item’s position. The example uses `100dvh` rather than `100vh` so the height responds to mobile browser controls appearing and disappearing.',
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
      x: 'On a flex item, `margin-left: auto` consumes the free space before that item and pushes it, along with anything after it, to the end. This stays predictable when the navigation contains more than two groups.',
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

    { t: 'h2', x: 'Common trouble spots' },

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
      x: 'Flexbox `gap` has had broad browser support since 2021. It applies only between items, which avoids trailing space and removes the need for a `:last-child` override.',
    },

    { t: 'h3', x: 'Not understanding `flex: 1`' },
    {
      t: 'code',
      lang: 'css',
      x: `flex: 1;        /* = flex: 1 1 0%: equal widths regardless of content */\nflex: auto;     /* = flex: 1 1 auto: sized by content, then grows */\nflex: none;     /* = flex: 0 0 auto: never grows or shrinks */`,
    },
    {
      t: 'p',
      x: 'The important difference between `flex: 1` and `flex: auto` is the basis. A basis of `0%` ignores the content’s width before distributing space, while `auto` starts from the natural width. Use `flex: 1` when equal shares matter more than intrinsic size.',
    },

    { t: 'h3', x: 'Flex items overflowing their container' },
    {
      t: 'p',
      x: 'A flex item defaults to `min-width: auto`, so it will not shrink below the width its content requires. A long unbroken string or wide table can then push the whole container wider.',
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
      x: 'For unexplained horizontal scrolling, inspect `min-width` on flex children and the minimum value of Grid tracks before changing the outer container.',
    },

    { t: 'h2', x: 'Keep visual and document order together' },
    {
      t: 'p',
      x: 'Flexbox `order` and explicit Grid placement change only the **visual** order. Screen readers still announce the DOM order, and keyboard focus follows it as well.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Visual order and focus order must match',
      x: 'When visual reordering makes keyboard focus jump around the screen, the page fails WCAG 2.4.3 and becomes difficult to follow. Reserve CSS reordering for minor presentation changes. If the reading sequence needs to change, update the HTML order.',
    },

    { t: 'h2', x: 'Subgrid' },
    {
      t: 'p',
      x: 'Subgrid lets a nested grid inherit the tracks of its parent. That makes it possible to align content inside neighboring cards even when their titles and body text have different lengths.',
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
      x: 'Current versions of the major browsers have supported Subgrid since late 2023. For older browser versions, use a fixed `min-height` on the title or make each card a flex column and apply `margin-top: auto` to its footer.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Should I use Grid or Flexbox?',
          a: 'Start with Grid when you are defining rows and columns and placing content within them. Start with Flexbox when you are distributing a row or column of items whose sizes vary. It is normal to use Grid for page structure and Flexbox inside individual components.',
        },
        {
          q: 'Is Grid slower than Flexbox?',
          a: 'The performance difference is not meaningful for normal layouts. Browsers implement both natively. Choose the module that describes the layout clearly; repeated layout reads and writes or forced reflows are more likely sources of a rendering problem.',
        },
        {
          q: 'Can I nest Grid inside Flexbox and vice versa?',
          a: 'Yes. A flex navigation bar can contain a Grid-based dropdown, and a Grid cell can contain a flex toolbar. Each container establishes its own formatting context, so nesting them is routine.',
        },
        {
          q: 'Why is my grid item overflowing its column?',
          a: 'A 1fr track has an automatic minimum, so wide content can force the track to grow. Try minmax(0, 1fr), then add overflow-x: auto to the child that should scroll. For a Flexbox child, the corresponding fix is min-width: 0.',
        },
        {
          q: 'What is the difference between auto-fill and auto-fit?',
          a: 'auto-fill preserves empty tracks, so three cards in a six-column grid remain at their track width. auto-fit collapses empty tracks and allows those three cards to fill the row. The choice depends on whether a small number of items should stretch.',
        },
        {
          q: 'Do I still need media queries?',
          a: 'Yes, but intrinsic sizing can remove some of them. minmax with auto-fill handles many responsive grids without a breakpoint. Container queries cover another common case by letting a component respond to its own width instead of the viewport.',
        },
      ],
    },
  ],

  related: ['/tools/color-contrast-checker/', '/guides/react-usestate-not-updating/', '/guides/javascript-async-await-explained/'],
};
