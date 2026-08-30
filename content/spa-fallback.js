#!/usr/bin/env node
/**
 * Creates the GitHub Pages fallback for the React portfolio.
 *
 * GitHub Pages serves static files, so direct requests for portfolio routes need
 * a copy of the built app shell at `404.html`. BrowserRouter then reads the real
 * path and renders the matching route.
 *
 * Run this after the React build because the shell references hashed bundles.
 * GitHub Pages still returns HTTP 404 for these routes, so they must remain out
 * of the sitemap. Generated resource pages are real files and bypass this path.
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
