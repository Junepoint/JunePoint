/** Page-type renderers. Each returns a complete HTML document string. */

const { site, sections, SITE_URL } = require('../config');
const { esc, inline, slugify, displayDate } = require('./html');
const blocks = require('./blocks');
const seo = require('./seo');
const ads = require('./ads');
const { page, breadcrumbNav, tocMarkup, bylineMarkup } = require('./layout');
const authors = require('../data/authors');

/** Rough reading time from the text content of a block list. */
function readingTime(list) {
  const text = JSON.stringify(list).replace(/[^A-Za-z' ]+/g, ' ');
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 230));
}

/**
 * Decide where ad units are spliced into an article.
 *
 * In-content units are snapped forward to the next h2 so they land on a section
 * boundary rather than interrupting a paragraph run — better to read, and better
 * viewability than a unit stranded mid-argument. Units are kept at least five
 * blocks apart and out of the closing blocks, so the FAQ and the related-links
 * module are not buried under a wall of advertising.
 */
function adPositions(list) {
  const positions = {};
  if (list.length < 8) return positions;

  positions[Math.min(3, list.length - 1)] = 'articleTop';

  // h2, FAQ and vendor-card boundaries are all natural breaks. Long buying
  // guides are mostly consecutive `pick` blocks with no headings between them,
  // so without `pick` here the densest part of the page gets no unit at all.
  const BOUNDARY = new Set(['h2', 'faq', 'pick']);
  const sectionStarts = list
    .map((block, i) => (BOUNDARY.has(block.t) ? i : -1))
    .filter((i) => i > 6 && i < list.length - 2);

  const MAX_IN_CONTENT = 4;
  const MIN_GAP = 7;
  let lastPlaced = 3;
  let placed = 0;

  for (const index of sectionStarts) {
    if (placed >= MAX_IN_CONTENT) break;
    if (index - lastPlaced < MIN_GAP) continue;
    positions[index] = 'inContent';
    lastPlaced = index;
    placed++;
  }
  return positions;
}

function relatedMarkup(paths, registry) {
  const items = (paths || [])
    .map((path) => registry.get(path))
    .filter(Boolean)
    .slice(0, 3);
  if (!items.length) return '';
  return `<section class="jp-related">
  <h2>Keep reading</h2>
  <div class="jp-cards">${items
    .map(
      (item) => `<a class="jp-card" href="${esc(item.path)}">
        <span class="jp-card-eyebrow">${esc(item.sectionLabel)}</span>
        <h3>${esc(item.h1 || item.title)}</h3>
        <p>${esc(item.cardDesc || item.description)}</p>
      </a>`
    )
    .join('')}</div>
</section>`;
}

function sidebarMarkup({ toc, section, registry, extra = '' }) {
  const siblings = registry
    .all()
    .filter((entry) => entry.section === section && entry.type !== 'hub')
    .slice(0, 6);

  const siblingList = siblings.length
    ? `<div class="jp-panel">
        <h2>More in ${esc(sections[section].label)}</h2>
        <ul>${siblings.map((s) => `<li><a href="${esc(s.path)}">${esc(s.h1 || s.title)}</a></li>`).join('')}</ul>
      </div>`
    : '';

  return `<aside class="jp-side">
  ${toc}
  ${extra}
  ${ads.unit('sidebar')}
  ${siblingList}
</aside>`;
}

/* -------------------------------------------------------------------------- */

/** A standard editorial article: guides (tier 2) and buying guides (tier 1). */
function renderArticle(doc, registry) {
  const section = sections[doc.section];
  const author = authors[doc.author];
  const path = doc.path;
  const url = `${SITE_URL}${path}`;
  const headings = blocks.headings(doc.blocks);
  const faqItems = blocks.faqs(doc.blocks);
  const minutes = readingTime(doc.blocks);

  const trail = [
    { label: 'Resources', href: site.portalPath },
    { label: section.label, href: `/${section.slug}/` },
    { label: doc.h1 || doc.title, href: path },
  ];

  const body = `<div class="jp-wrap">${breadcrumbNav(trail)}</div>
<div class="jp-layout">
  <main id="main">
    <header class="jp-pagehead">
      <p class="jp-eyebrow">${esc(doc.eyebrow || section.label)}</p>
      <h1>${esc(doc.h1 || doc.title)}</h1>
      <p class="jp-standfirst">${inline(doc.standfirst || doc.description)}</p>
      ${bylineMarkup({ author, published: doc.published, updated: doc.updated, readingTime: minutes })}
    </header>
    <article class="jp-article">
      ${blocks.render(doc.blocks, { adAt: adPositions(doc.blocks), renderAd: ads.unit })}
      ${relatedMarkup(doc.related, registry)}
    </article>
    ${ads.unit('footer')}
  </main>
  ${sidebarMarkup({ toc: tocMarkup(headings), section: doc.section, registry })}
</div>`;

  const schema = [
    seo.organization(),
    seo.website(),
    seo.person(author),
    seo.breadcrumbs(trail),
    seo.article({ page: { ...doc, sectionLabel: section.label }, url, author, type: doc.schemaType || 'Article' }),
    seo.faqPage(faqItems, url),
  ];

  if (doc.itemListName) {
    const picks = doc.blocks.filter((b) => b.t === 'pick');
    if (picks.length) {
      schema.push(
        seo.itemList(
          picks.map((p) => ({ name: p.name, href: `${path}#${p.id || slugify(p.name)}` })),
          url,
          doc.itemListName
        )
      );
    }
  }

  return page({
    title: doc.title,
    description: doc.description,
    path,
    body,
    schema,
    type: 'article',
    published: doc.published,
    updated: doc.updated,
    bodyClass: `jp-tier${section.tier}`,
  });
}

/** An interactive tool page: the widget first, supporting content below it. */
function renderTool(doc, registry) {
  const section = sections.tools;
  const author = authors[doc.author];
  const path = doc.path;
  const url = `${SITE_URL}${path}`;
  const headings = blocks.headings(doc.blocks);
  const faqItems = blocks.faqs(doc.blocks);

  const trail = [
    { label: 'Resources', href: site.portalPath },
    { label: 'Tools', href: '/tools/' },
    { label: doc.h1 || doc.title, href: path },
  ];

  const body = `<div class="jp-wrap">${breadcrumbNav(trail)}</div>
<div class="jp-layout">
  <main id="main">
    <header class="jp-pagehead">
      <p class="jp-eyebrow">${esc(doc.eyebrow || 'Free tool')}</p>
      <h1>${esc(doc.h1 || doc.title)}</h1>
      <p class="jp-standfirst">${inline(doc.standfirst || doc.description)}</p>
      ${bylineMarkup({ author, published: doc.published, updated: doc.updated })}
    </header>

    ${ads.unit('toolTop')}
    ${doc.tool.html}
    ${ads.unit('toolResult')}

    <article class="jp-article">
      ${blocks.render(doc.blocks)}
      ${relatedMarkup(doc.related, registry)}
    </article>
    ${ads.unit('footer')}
  </main>
  ${sidebarMarkup({ toc: tocMarkup(headings), section: 'tools', registry })}
</div>
<script>${doc.tool.js}</script>`;

  return page({
    title: doc.title,
    description: doc.description,
    path,
    body,
    schema: [
      seo.organization(),
      seo.website(),
      seo.person(author),
      seo.breadcrumbs(trail),
      seo.softwareApplication({ page: doc, url }),
      seo.article({ page: { ...doc, sectionLabel: section.label }, url, author, type: 'TechArticle' }),
      seo.faqPage(faqItems, url),
    ],
    type: 'article',
    published: doc.published,
    updated: doc.updated,
    bodyClass: 'jp-tier3',
  });
}

/** A section hub: /tools/, /guides/, /reviews/. */
function renderHub(sectionKey, entries, intro) {
  const section = sections[sectionKey];
  const path = `/${section.slug}/`;
  const url = `${SITE_URL}${path}`;

  const trail = [
    { label: 'Resources', href: site.portalPath },
    { label: section.label, href: path },
  ];

  const featured = entries.filter((e) => e.featured);
  const rest = entries.filter((e) => !e.featured);

  const cardsFor = (list) =>
    `<div class="jp-cards">${list
      .map(
        (e) => `<a class="jp-card" href="${esc(e.path)}">
          <span class="jp-card-eyebrow">${esc(e.eyebrow || section.label)}</span>
          <h3>${esc(e.h1 || e.title)}</h3>
          <p>${esc(e.cardDesc || e.description)}</p>
        </a>`
      )
      .join('')}</div>`;

  const listFor = (list) =>
    `<ul class="jp-list">${list
      .map(
        (e) => `<li><a href="${esc(e.path)}">
          <span class="jp-list-meta">${esc(e.eyebrow || section.label)} · Updated ${esc(
          displayDate(e.updated || e.published)
        )}</span>
          <h3>${esc(e.h1 || e.title)}</h3>
          <p>${esc(e.cardDesc || e.description)}</p>
        </a></li>`
      )
      .join('')}</ul>`;

  const body = `<div class="jp-wrap">${breadcrumbNav(trail)}</div>
<header class="jp-pagehead jp-pagehead--hero">
  <div class="jp-wrap">
    <p class="jp-eyebrow">Tier ${section.tier} · ${esc(section.label)}</p>
    <h1>${esc(section.title)}</h1>
    <p class="jp-standfirst">${esc(section.tagline)}</p>
    <ul class="jp-pills">${entries
      .slice(0, 8)
      .map((e) => `<li><a href="${esc(e.path)}">${esc(e.pill || e.h1 || e.title)}</a></li>`)
      .join('')}</ul>
  </div>
</header>
<main id="main" class="jp-wrap">
  <div class="jp-article" style="max-width:none">
    ${intro.map((block) => blocks.renderBlock(block, 0)).join('')}
  </div>
  ${ads.unit('hub')}
  ${featured.length ? `<div class="jp-section-head"><h2>Most used</h2></div>${cardsFor(featured)}` : ''}
  <div class="jp-section-head"><h2>${featured.length ? 'Everything else' : 'All ' + esc(section.label.toLowerCase())}</h2></div>
  ${listFor(rest)}
  ${ads.unit('footer')}
</main>`;

  return page({
    title: `${section.title} | JunePoint`,
    description: section.description,
    path,
    body,
    schema: [
      seo.organization(),
      seo.website(),
      seo.breadcrumbs(trail),
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        name: section.title,
        description: section.description,
        url,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      seo.itemList(
        entries.map((e) => ({ name: e.h1 || e.title, href: e.path })),
        url,
        section.title
      ),
    ],
    bodyClass: `jp-tier${section.tier}`,
  });
}

/** A plain prose page: about, contact, legal. */
function renderProse(doc) {
  const path = doc.path;
  const url = `${SITE_URL}${path}`;
  const trail = [
    { label: 'Resources', href: site.portalPath },
    ...(doc.parent ? [doc.parent] : []),
    { label: doc.h1 || doc.title, href: path },
  ];

  const body = `<div class="jp-wrap">${breadcrumbNav(trail)}</div>
<main id="main">
  <header class="jp-pagehead jp-prose" style="padding-bottom:0">
    <p class="jp-eyebrow">${esc(doc.eyebrow || 'JunePoint Resources')}</p>
    <h1>${esc(doc.h1 || doc.title)}</h1>
    ${doc.standfirst ? `<p class="jp-standfirst">${inline(doc.standfirst)}</p>` : ''}
    ${doc.updated ? `<p class="jp-list-meta">Last updated ${esc(displayDate(doc.updated))}</p>` : ''}
  </header>
  <div class="jp-prose jp-article">
    ${blocks.render(doc.blocks)}
  </div>
</main>`;

  return page({
    title: doc.title,
    description: doc.description,
    path,
    body,
    robots: doc.robots,
    schema: [
      seo.organization(),
      seo.website(),
      seo.breadcrumbs(trail),
      {
        '@type': 'WebPage',
        '@id': `${url}#page`,
        name: doc.h1 || doc.title,
        description: doc.description,
        url,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        ...(doc.updated ? { dateModified: doc.updated } : {}),
      },
    ],
  });
}

module.exports = { renderArticle, renderTool, renderHub, renderProse, readingTime };
