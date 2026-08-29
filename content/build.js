#!/usr/bin/env node
/**
 * Static site generator for the JunePoint content network.
 *
 * Writes plain HTML into `public/`, which Create React App copies verbatim into
 * `build/`. That gives every network page real server-delivered markup — the
 * React SPA at "/" renders client-side and would be invisible to crawlers, and
 * an empty shell is not a page AdSense can review or Google can rank.
 *
 * The React portfolio is never touched, and no ad markup is emitted anywhere
 * except the pages generated here.
 *
 *   node content/build.js
 */

const fs = require('fs');
const path = require('path');

const { site, sections, ads, SITE_URL } = require('./config');
const renderers = require('./lib/renderers');
const adUnits = require('./lib/ads');
const buildPortal = require('./data/portal');
const standalonePages = require('./data/pages');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

/** Directories this generator owns. Wiped and rewritten on every build. */
const OWNED_DIRS = ['tools', 'guides', 'reviews', 'resources', 'about', 'contact', 'legal', 'assets/jp'];
const OWNED_FILES = ['sitemap.xml', 'robots.txt', 'ads.txt'];

/* -------------------------------------------------------------------------- */

function loadSection(dir, sectionKey) {
  const folder = path.join(__dirname, 'data', dir);
  if (!fs.existsSync(folder)) return [];

  return fs
    .readdirSync(folder)
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .map((file) => {
      const doc = require(path.join(folder, file));
      const expected = file.replace(/\.js$/, '');
      if (doc.slug !== expected) {
        throw new Error(`Slug mismatch in data/${dir}/${file}: slug is "${doc.slug}"`);
      }
      return { ...doc, section: sectionKey, path: `/${sections[sectionKey].slug}/${doc.slug}/` };
    })
    .sort((a, b) => (b.updated || b.published).localeCompare(a.updated || a.published));
}

/** Lookup used for "keep reading" modules and sidebar cross-links. */
function buildRegistry(all) {
  const byPath = new Map(all.map((doc) => [doc.path, doc]));
  return {
    get: (p) => byPath.get(p),
    all: () => all,
  };
}

function write(relPath, contents) {
  const target = path.join(PUBLIC, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
  return target;
}

/** A page path like "/tools/foo/" becomes public/tools/foo/index.html. */
const pageFile = (p) => path.join(p.replace(/^\/|\/$/g, ''), 'index.html');

function clean() {
  OWNED_DIRS.forEach((dir) => fs.rmSync(path.join(PUBLIC, dir), { recursive: true, force: true }));
  OWNED_FILES.forEach((file) => fs.rmSync(path.join(PUBLIC, file), { force: true }));
}

/* ---- sitemap / robots / ads.txt ------------------------------------------ */

function sitemap(entries) {
  const urls = entries
    .map(
      ({ path: p, updated, priority, changefreq }) => `  <url>
    <loc>${SITE_URL}${p}</loc>
    <lastmod>${updated}</lastmod>
    <changefreq>${changefreq || 'monthly'}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function robots() {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Ad crawlers need explicit access to serve relevant ads on resource pages.
User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function adsTxt() {
  if (!adUnits.enabled()) {
    return `# Authorized Digital Sellers — https://iabtechlab.com/ads-txt/
#
# Populate this once an AdSense publisher ID exists. The single line below is
# all AdSense requires; uncomment it and replace the publisher ID.
#
# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
`;
  }
  const publisherId = ads.client.replace(/^ca-/, '');
  return `# Authorized Digital Sellers — https://iabtechlab.com/ads-txt/
google.com, ${publisherId}, DIRECT, f08c47fec0942fa0
`;
}

/* -------------------------------------------------------------------------- */

function main() {
  const started = Date.now();
  clean();

  const tools = loadSection('tools', 'tools');
  const guides = loadSection('guides', 'guides');
  const reviews = loadSection('reviews', 'reviews');
  const registry = buildRegistry([...tools, ...guides, ...reviews]);

  const written = [];
  const sitemapEntries = [];
  const today = new Date().toISOString().slice(0, 10);

  const record = (p, updated, priority, changefreq) =>
    sitemapEntries.push({ path: p, updated: updated || today, priority, changefreq });

  // Shared assets
  ['site.css', 'site.js'].forEach((file) => {
    written.push(write(`assets/jp/${file}`, fs.readFileSync(path.join(__dirname, 'assets', file))));
  });

  // Tier 3 — tools
  tools.forEach((doc) => {
    written.push(write(pageFile(doc.path), renderers.renderTool(doc, registry)));
    record(doc.path, doc.updated, doc.featured ? '0.9' : '0.8');
  });

  // Tier 2 — guides, Tier 1 — buying guides
  [...guides, ...reviews].forEach((doc) => {
    written.push(write(pageFile(doc.path), renderers.renderArticle(doc, registry)));
    record(doc.path, doc.updated, doc.featured ? '0.9' : '0.8');
  });

  // Section hubs
  const hubIntros = require('./data/hub-intros');
  [
    ['tools', tools],
    ['guides', guides],
    ['reviews', reviews],
  ].forEach(([key, entries]) => {
    written.push(write(pageFile(`/${sections[key].slug}/`), renderers.renderHub(key, entries, hubIntros[key])));
    record(`/${sections[key].slug}/`, today, '0.9', 'weekly');
  });

  // Portal
  written.push(write(pageFile(site.portalPath), buildPortal({ tools, guides, reviews })));
  record(site.portalPath, today, '1.0', 'weekly');

  // About, contact, legal
  standalonePages.forEach((doc) => {
    written.push(write(pageFile(doc.path), renderers.renderProse(doc)));
    if (doc.robots !== 'noindex') record(doc.path, doc.updated, doc.priority || '0.4', 'yearly');
  });

  // The portfolio home page is a real static file and belongs in the sitemap.
  //
  // Its sub-routes (/personal-websites, /video-games, …) deliberately are NOT
  // listed. They exist only inside React Router, and GitHub Pages has no SPA
  // fallback here — a direct request for one returns 404, so submitting them
  // would be feeding Google known-dead URLs. Adding a public/404.html that
  // serves the app shell would make them reachable; until then they stay out.
  record('/', today, '1.0', 'monthly');

  written.push(write('sitemap.xml', sitemap(sitemapEntries)));
  written.push(write('robots.txt', robots()));
  written.push(write('ads.txt', adsTxt()));

  const pageCount = tools.length + guides.length + reviews.length + 4 + standalonePages.length;
  console.log(
    `content: ${pageCount} pages (${tools.length} tools, ${guides.length} guides, ${reviews.length} buying guides) ` +
      `→ public/ in ${Date.now() - started}ms`
  );
  if (!adUnits.enabled()) {
    console.log(
      'content: AdSense is not configured — no ad markup emitted. Set ADSENSE_CLIENT=ca-pub-… to enable, ' +
        'or AD_PREVIEW=1 to draw placeholder slots.'
    );
  }
}

main();
