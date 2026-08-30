/**
 * Shared page shell for generated resource pages.
 *
 * One layout keeps every section visually consistent and lets new sections use
 * existing templates.
 */

const { site, sections, SITE_URL } = require('../config');
const { esc, jsonLd, displayDate } = require('./html');
const ads = require('./ads');

const ASSET_VERSION = '2';

const NAV = [
  { href: '/tools/', label: sections.tools.navLabel },
  { href: '/guides/', label: sections.guides.navLabel },
  { href: '/reviews/', label: sections.reviews.navLabel },
];

function metaTags({ title, description, canonical, image, robots, published, updated, type }) {
  const ogImage = image ? (/^https?:/.test(image) ? image : `${SITE_URL}${image}`) : `${SITE_URL}${site.logo}`;
  return [
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    robots ? `<meta name="robots" content="${esc(robots)}" />` : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />',
    `<meta property="og:type" content="${esc(type === 'article' ? 'article' : 'website')}" />`,
    `<meta property="og:site_name" content="${esc(site.publication)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:locale" content="${esc(site.locale)}" />`,
    published ? `<meta property="article:published_time" content="${esc(published)}" />` : '',
    updated ? `<meta property="article:modified_time" content="${esc(updated)}" />` : '',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:site" content="${esc(site.twitter)}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

function breadcrumbNav(trail) {
  if (!trail || trail.length < 2) return '';
  const items = trail
    .map((crumb, i) =>
      i === trail.length - 1
        ? `<li aria-current="page">${esc(crumb.label)}</li>`
        : `<li><a href="${esc(crumb.href)}">${esc(crumb.label)}</a></li>`
    )
    .join('');
  return `<nav class="jp-breadcrumbs" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
}

function header(activePath) {
  const links = NAV.map((item) => {
    const active = activePath.startsWith(item.href) ? ' aria-current="page"' : '';
    return `<a href="${item.href}"${active}>${esc(item.label)}</a>`;
  }).join('');

  return `<a class="jp-skip" href="#main">Skip to content</a>
<header class="jp-header">
  <div class="jp-header-inner">
    <a class="jp-brand" href="${site.portalPath}">
      <span class="jp-brand-mark">JunePoint</span>
      <span class="jp-brand-sub">Resources</span>
    </a>
    <nav class="jp-nav" aria-label="Sections">${links}</nav>
    <div class="jp-header-actions">
      <a class="jp-header-portfolio" href="/">Studio&nbsp;&rsaquo;</a>
    </div>
    <button class="jp-menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="jp-mobile-nav" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <nav class="jp-mobile-nav" id="jp-mobile-nav" aria-label="Sections" hidden>
    ${NAV.map((i) => `<a href="${i.href}">${esc(i.label)}</a>`).join('')}
    <a href="${site.portalPath}">All resources</a>
    <a href="/">JunePoint Studio</a>
  </nav>
</header>`;
}

function footer() {
  const sectionLinks = Object.values(sections)
    .map((s) => `<li><a href="/${s.slug}/">${esc(s.title)}</a></li>`)
    .join('');

  return `<footer class="jp-footer">
  <div class="jp-footer-inner">
    <div class="jp-footer-brand">
      <p class="jp-brand-mark">JunePoint</p>
      <p>${esc(site.tagline)}</p>
      <p class="jp-footer-note">JunePoint Resources is the publishing arm of JunePoint, a cross-platform software studio.</p>
    </div>
    <div>
      <h2>Sections</h2>
      <ul>${sectionLinks}</ul>
    </div>
    <div>
      <h2>Publication</h2>
      <ul>
        <li><a href="/about/">About &amp; authors</a></li>
        <li><a href="/legal/editorial-policy/">Editorial policy</a></li>
        <li><a href="/contact/">Contact</a></li>
        <li><a href="/resources/">Resource index</a></li>
      </ul>
    </div>
    <div>
      <h2>Legal</h2>
      <ul>
        <li><a href="/legal/privacy/">Privacy policy</a></li>
        <li><a href="/legal/terms/">Terms of use</a></li>
        <li><a href="/legal/disclosure/">Advertising disclosure</a></li>
        <li><a href="/">JunePoint Studio</a></li>
      </ul>
    </div>
  </div>
  <div class="jp-footer-bar">
    <p>&copy; ${new Date().getFullYear()} JunePoint. All rights reserved.</p>
    <p>Tools run locally in your browser. We never receive the data you paste into them.</p>
  </div>
</footer>`;
}

function tocMarkup(items) {
  if (!items || items.length < 3) return '';
  return `<nav class="jp-toc" aria-labelledby="jp-toc-title">
  <h2 id="jp-toc-title">On this page</h2>
  <ol>${items.map((i) => `<li><a href="#${esc(i.id)}">${esc(i.text)}</a></li>`).join('')}</ol>
</nav>`;
}

function bylineMarkup({ author, published, updated, readingTime }) {
  if (!author) return '';
  const parts = [
    `<span class="jp-byline-author">By <a href="/about/#${esc(author.id)}">${esc(author.name)}</a></span>`,
    published ? `<span>Published ${esc(displayDate(published))}</span>` : '',
    updated && updated !== published ? `<span>Updated ${esc(displayDate(updated))}</span>` : '',
    readingTime ? `<span>${esc(readingTime)} min read</span>` : '',
  ].filter(Boolean);
  return `<div class="jp-byline">${parts.join('<span class="jp-dot" aria-hidden="true">·</span>')}</div>`;
}

/**
 * Assemble a complete HTML document.
 *
 * @param {object} opts
 * @param {string} opts.title Document title, preferably at most 60 characters
 * @param {string} opts.description Meta description, preferably about 150 characters
 * @param {string} opts.path Absolute site path with a trailing slash
 * @param {string} opts.body Main page markup
 * @param {object[]} opts.schema Structured data graph nodes
 */
function page(opts) {
  const canonical = `${SITE_URL}${opts.path}`;
  const bodyClasses = ['jp', opts.bodyClass || '', ads.enabled() || require('../config').ads.preview ? 'has-ads' : '']
    .filter(Boolean)
    .join(' ');

  return `<!DOCTYPE html>
<html lang="${esc(site.language)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="author" content="${esc(site.author)}" />
    <meta name="theme-color" content="#0b1220" />
    <title>${esc(opts.title)}</title>
    ${metaTags({ ...opts, canonical })}
    <link rel="preload" as="style" href="/assets/jp/site.css?v=${ASSET_VERSION}" />
    <link rel="stylesheet" href="/assets/jp/site.css?v=${ASSET_VERSION}" />
    <link rel="icon" href="/imgs/junepoint.png" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    ${ads.enabled() ? '<link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin />' : ''}
    ${ads.verificationMeta()}
    ${ads.loaderScript()}
    <script type="application/ld+json">${jsonLd({
      '@context': 'https://schema.org',
      '@graph': opts.schema,
    })}</script>
  </head>
  <body class="${esc(bodyClasses)}">
    ${header(opts.path)}
    ${opts.body}
    ${footer()}
    <script src="/assets/jp/site.js?v=${ASSET_VERSION}" defer></script>
    ${ads.autoAdsScript()}
  </body>
</html>
`;
}

module.exports = { page, breadcrumbNav, tocMarkup, bylineMarkup, NAV };
