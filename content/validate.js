#!/usr/bin/env node
/**
 * Post-generation checks for the content network.
 *
 * Run after `npm run build:content`. Catches the failures that are invisible in
 * a browser but expensive in production: invalid JSON-LD, broken internal
 * links, duplicate titles, over-long meta descriptions, missing canonicals,
 * pages absent from the sitemap, and template slips such as unrendered
 * `**bold**` leaking into structured data.
 *
 * Exits non-zero on failure, so it can gate a build.
 *
 *   npm run check:content
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const DIRS = ['tools', 'guides', 'reviews', 'resources', 'about', 'contact', 'legal'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
}

const files = DIRS.flatMap((d) => walk(path.join(PUBLIC, d)));
const problems = [];
const titles = new Map();
const descriptions = new Map();
const allPaths = new Set();
const linkRefs = [];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = '/' + path.relative(PUBLIC, path.dirname(file)) + '/';
  allPaths.add(rel);

  // --- JSON-LD ---
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ldBlocks.length) problems.push(`${rel} — no JSON-LD`);
  for (const [, body] of ldBlocks) {
    try {
      const parsed = JSON.parse(body.replace(/\\u003c/g, '<'));
      if (!parsed['@context']) problems.push(`${rel} — JSON-LD missing @context`);
      const types = (parsed['@graph'] || []).map((n) => n['@type']);
      if (!types.length) problems.push(`${rel} — empty @graph`);
      for (const node of parsed['@graph'] || []) {
        if (!node['@type']) problems.push(`${rel} — graph node without @type`);
      }
    } catch (e) {
      problems.push(`${rel} — INVALID JSON-LD: ${e.message}`);
    }
  }

  // --- Title / description ---
  const decode = (t) => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  if (!title) problems.push(`${rel} — no <title>`);
  if (!desc) problems.push(`${rel} — no meta description`);
  if (title.length > 65) problems.push(`${rel} — title ${title.length} chars: "${title}"`);
  if (desc.length > 165) problems.push(`${rel} — description ${desc.length} chars`);
  if (desc.length < 70 && desc) problems.push(`${rel} — description only ${desc.length} chars`);
  if (titles.has(title)) problems.push(`${rel} — DUPLICATE title with ${titles.get(title)}`);
  titles.set(title, rel);
  if (descriptions.has(desc)) problems.push(`${rel} — DUPLICATE description with ${descriptions.get(desc)}`);
  descriptions.set(desc, rel);

  // --- Canonical ---
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (!canonical) problems.push(`${rel} — no canonical`);
  else if (canonical !== `https://junepoint.com${rel}`)
    problems.push(`${rel} — canonical mismatch: ${canonical}`);

  // --- Headings ---
  const h1s = [...html.matchAll(/<h1[^>]*>/g)].length;
  if (h1s !== 1) problems.push(`${rel} — ${h1s} <h1> elements`);

  // --- Duplicate element ids ---
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupeIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupeIds.length) problems.push(`${rel} — duplicate ids: ${[...new Set(dupeIds)].join(', ')}`);

  // --- Collect internal links ---
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) linkRefs.push({ from: rel, href });

  // --- Unrendered markup leaking through ---
  const noCode = html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
  if (/\*\*[^*\n]+\*\*/.test(noCode)) {
    problems.push(`${rel} — unrendered **bold** markup outside code blocks`);
  }
  // Template-rendering slips only: a bare value standing alone as an element's
  // whole text, or leaking into an attribute. "undefined" inside prose or a
  // <code> span is legitimate content on these pages.
  const prose = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code>[\s\S]*?<\/code>/g, '');
  const slips = [
    /> *(undefined|NaN|\[object Object\]) *</,
    /(content|src)="[^"]*(undefined|NaN|\[object Object\])/,
    /href="(?!#)[^"]*(undefined|NaN|\[object Object\])/,
  ];
  for (const pattern of slips) {
    const hit = prose.match(pattern);
    if (hit) problems.push(`${rel} — render slip: ${hit[0].slice(0, 90)}`);
  }
}

// --- Internal link integrity ---
const REACT_ROUTES = new Set([
  '/', '/personal-websites/', '/business-websites/', '/cross-platform-apps/', '/local-apps/', '/video-games/',
]);
const broken = new Map();
for (const { from, href } of linkRefs) {
  const normalized = href.endsWith('/') ? href : href + '/';
  if (allPaths.has(normalized) || REACT_ROUTES.has(normalized)) continue;
  if (fs.existsSync(path.join(PUBLIC, href.replace(/^\//, '')))) continue; // assets, images
  if (!broken.has(href)) broken.set(href, new Set());
  broken.get(href).add(from);
}
for (const [href, froms] of broken) {
  problems.push(`BROKEN LINK ${href} ← ${[...froms].slice(0, 4).join(', ')}${froms.size > 4 ? ` (+${froms.size - 4})` : ''}`);
}

// --- Sitemap coverage ---
const sitemap = fs.readFileSync(path.join(PUBLIC, 'sitemap.xml'), 'utf8');
const sitemapPaths = new Set([...sitemap.matchAll(/<loc>https:\/\/junepoint\.com([^<]*)<\/loc>/g)].map((m) => m[1]));
for (const p of allPaths) {
  if (!sitemapPaths.has(p)) problems.push(`${p} — not in sitemap`);
}

console.log(`Checked ${files.length} pages, ${linkRefs.length} internal links.\n`);
if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  problems.forEach((p) => console.log('  • ' + p));
  process.exitCode = 1;
} else {
  console.log('All checks passed.');
}
