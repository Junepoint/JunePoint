/** Renders the resource directory and its section links. */

const { site, sections, SITE_URL } = require('../config');
const { esc, displayDate } = require('../lib/html');
const { page, breadcrumbNav } = require('../lib/layout');
const ads = require('../lib/ads');
const seo = require('../lib/seo');

const ICONS = {
  tools: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3Z"/><path d="m9 9-3.5-3.5"/><path d="M5.5 5.5 3 8"/></svg>',
  guides:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  reviews:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
};

function tierCard(key, count) {
  const section = sections[key];
  return `<a class="jp-tier" href="/${section.slug}/">
    <span class="jp-tier-icon">${ICONS[key]}</span>
    <h2>${esc(section.title)}</h2>
    <p>${esc(section.tagline)}</p>
    <span class="jp-tier-cta">${count} ${count === 1 ? 'page' : 'pages'} &rarr;</span>
  </a>`;
}

function listBlock(heading, href, entries, limit = 5) {
  return `<div class="jp-section-head">
    <h2>${esc(heading)}</h2>
    <a href="${esc(href)}">View all &rarr;</a>
  </div>
  <ul class="jp-list">${entries
    .slice(0, limit)
    .map(
      (e) => `<li><a href="${esc(e.path)}">
        <span class="jp-list-meta">${esc(e.eyebrow || '')} · Updated ${esc(displayDate(e.updated || e.published))}</span>
        <h3>${esc(e.h1 || e.title)}</h3>
        <p>${esc(e.cardDesc || e.description)}</p>
      </a></li>`
    )
    .join('')}</ul>`;
}

module.exports = function renderPortal({ tools, guides, reviews }) {
  const path = site.portalPath;
  const url = `${SITE_URL}${path}`;
  const trail = [{ label: 'JunePoint', href: '/' }, { label: 'Resources', href: path }];

  const recent = [...tools, ...guides, ...reviews]
    .sort((a, b) => (b.updated || b.published).localeCompare(a.updated || a.published))
    .slice(0, 6);

  const body = `<div class="jp-wrap">${breadcrumbNav(trail)}</div>
<header class="jp-pagehead jp-pagehead--hero">
  <div class="jp-wrap">
    <p class="jp-eyebrow">JunePoint Resources</p>
    <h1>Tools, guides and software research</h1>
    <p class="jp-standfirst">${esc(site.tagline)} Browser-based calculators, technical troubleshooting guides
      and software comparisons based on published documentation, pricing and policies.</p>
    <p><a class="jp-btn" href="/tools/">Browse the tools</a>
       <a class="jp-btn jp-btn--ghost" href="/">See what JunePoint builds</a></p>
  </div>
</header>

<main id="main" class="jp-wrap">
  <div class="jp-tierstrip">
    ${tierCard('tools', tools.length)}
    ${tierCard('guides', guides.length)}
    ${tierCard('reviews', reviews.length)}
  </div>

  ${ads.unit('hub')}

  ${listBlock('Recently updated', '/resources/', recent, 6)}
  ${listBlock(sections.tools.label, '/tools/', tools)}
  ${listBlock(sections.guides.label, '/guides/', guides)}
  ${listBlock(sections.reviews.label, '/reviews/', reviews)}

  <section class="jp-cta">
    <h2>JunePoint also builds software</h2>
    <p>Jackson Abeyta writes this publication through JunePoint, a cross-platform software studio. JunePoint also
      builds web and mobile applications, and its studio portfolio carries no advertising.</p>
    <a class="jp-btn" href="/">Visit JunePoint Studio</a>
  </section>

  ${ads.unit('footer')}
</main>`;

  return page({
    title: 'JunePoint Resources | Free Tools, Guides & Software Research',
    description: site.description,
    path,
    body,
    schema: [
      seo.organization(),
      seo.website(),
      seo.breadcrumbs(trail),
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        name: 'JunePoint Resources',
        description: site.description,
        url,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        hasPart: Object.values(sections).map((s) => ({
          '@type': 'CollectionPage',
          name: s.title,
          url: `${SITE_URL}/${s.slug}/`,
          description: s.description,
        })),
      },
      seo.itemList(
        recent.map((e) => ({ name: e.h1 || e.title, href: e.path })),
        url,
        'Recently updated'
      ),
    ],
  });
};
