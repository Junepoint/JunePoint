#!/usr/bin/env node
/**
 * Post-build step: turn the React portfolio's sub-routes into real 200 pages.
 *
 * Those routes existed only inside React Router, so GitHub Pages had no file to
 * serve and answered 404 for every direct visit and every crawl. A 404 is never
 * indexed, which cost the site five pages and any sitelinks they might earn.
 *
 * This writes a real HTML file at each route containing:
 *   - a per-route title, description and canonical (the SPA gave all five the
 *     homepage's metadata, so even when reachable they were duplicates)
 *   - the project list as static markup, so crawlers that do not run JavaScript
 *     still get the content
 *   - CollectionPage + ItemList structured data
 *   - the same CRA bundle tags as index.html
 *
 * src/index.js mounts with createRoot().render(), which REPLACES the contents of
 * #root rather than hydrating them. The static markup below is therefore a
 * crawler-facing fallback that React discards on load — it cannot drift out of
 * sync with the live UI, and no design duplication is required.
 *
 * Runs after react-scripts build because the bundle filenames are hashed.
 */

const fs = require('fs');
const path = require('path');

const { routes } = require('./data/portfolio-routes');
const { esc } = require('./lib/html');
const { SITE_URL } = require('./config');

const BUILD = path.join(__dirname, '..', 'build');
const shellPath = path.join(BUILD, 'index.html');

if (!fs.existsSync(shellPath)) {
  console.error('prerender-routes: build/index.html not found — run react-scripts build first.');
  process.exit(1);
}

const shell = fs.readFileSync(shellPath, 'utf8');

/** Pull the hashed CRA asset tags out of the built shell. */
function assetTags() {
  const scripts = shell.match(/<script[^>]+src="\/static\/js\/[^"]+"[^>]*><\/script>/g) || [];
  const styles = shell.match(/<link[^>]+href="\/static\/css\/[^"]+"[^>]*>/g) || [];
  if (!scripts.length) {
    console.error('prerender-routes: no bundle <script> found in build/index.html — aborting.');
    process.exit(1);
  }
  return { scripts: scripts.join('\n    '), styles: styles.join('\n    ') };
}

const { scripts, styles } = assetTags();

function projectMarkup(project) {
  const tech = (project.tech || []).map((t) => `<li>${esc(t)}</li>`).join('');
  const links = [
    project.liveUrl ? `<a href="${esc(project.liveUrl)}" rel="noopener">View live</a>` : '',
    project.githubUrl ? `<a href="${esc(project.githubUrl)}" rel="noopener">Source code</a>` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<article>
        <h3>${esc(project.title)}</h3>
        <p>${esc(project.description)}</p>
        ${tech ? `<ul>${tech}</ul>` : ''}
        ${links ? `<p>${links}</p>` : ''}
      </article>`;
}

function schema(route, url) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        name: route.heading,
        description: route.description,
        url,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'JunePoint', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: route.heading, item: url },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#list`,
        name: route.heading,
        numberOfItems: route.projects.length,
        itemListElement: route.projects.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.title,
          ...(p.liveUrl ? { url: p.liveUrl } : {}),
        })),
      },
    ],
  };
}

function page(route) {
  const url = `${SITE_URL}${route.path}`;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(route.title)}</title>
    <meta name="description" content="${esc(route.description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta name="author" content="Jackson Abeyta" />
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="JunePoint Software" />
    <meta property="og:title" content="${esc(route.title)}" />
    <meta property="og:description" content="${esc(route.description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${SITE_URL}/imgs/junepoint.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(route.title)}" />
    <meta name="twitter:description" content="${esc(route.description)}" />
    <meta name="twitter:image" content="${SITE_URL}/imgs/junepoint.png" />
    <script type="application/ld+json">${JSON.stringify(schema(route, url), null, 2).replace(/</g, '\\u003c')}</script>
    ${styles}
  </head>
  <body>
    <noscript>You need to enable JavaScript for the interactive version of this page.</noscript>
    <div id="root">
      <main>
        <nav aria-label="Breadcrumb"><a href="/">JunePoint</a> / ${esc(route.heading)}</nav>
        <h1>${esc(route.heading)}</h1>
        <p>${esc(route.intro)}</p>
        ${route.projects.map(projectMarkup).join('\n        ')}
        <nav aria-label="Related">
          <a href="/">Home</a>
          <a href="/resources/">Free tools and guides</a>
        </nav>
      </main>
    </div>
    ${scripts}
  </body>
</html>
`;
}

let written = 0;
for (const route of routes) {
  const dir = path.join(BUILD, route.path.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(route));
  written++;
}

console.log(`prerender-routes: ${written} portfolio routes written as real 200 pages`);
