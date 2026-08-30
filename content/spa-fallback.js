#!/usr/bin/env node
/**
 * Post-build step: give the React SPA a GitHub Pages fallback.
 *
 * GitHub Pages serves static files only. The portfolio's routes
 * (/personal-websites, /video-games, …) exist solely inside React Router, so a
 * direct request or a refresh on one returns 404 — the app shell is never
 * reached and the route never renders.
 *
 * Pages serves 404.html for any path it cannot resolve. Making that file a copy
 * of the app shell means the bundle loads, BrowserRouter reads the real
 * pathname, and the correct route renders. Unknown paths fall through to the
 * catch-all route in src/App.js.
 *
 * This runs AFTER react-scripts build because the shell references the hashed
 * bundle filename, which only exists once the build has run.
 *
 * Note the deliberate limitation: the HTTP status stays 404 even though the
 * page renders. That is fine for humans and for the SPA routes, but it is why
 * those routes are still kept out of sitemap.xml — see content/build.js.
 *
 * Generated network pages under /tools, /guides and /reviews are real files and
 * never touch this path.
 */

const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, '..', 'build');
const shell = path.join(BUILD, 'index.html');
const fallback = path.join(BUILD, '404.html');

if (!fs.existsSync(shell)) {
  console.error('spa-fallback: build/index.html not found — run react-scripts build first.');
  process.exit(1);
}

fs.copyFileSync(shell, fallback);
console.log('spa-fallback: build/404.html written (SPA deep links and refreshes now resolve)');
