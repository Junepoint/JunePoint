#!/usr/bin/env node
/**
 * House style and originality gate for generated articles.
 *
 * Enforces the rules that a machine can actually verify. Rules it cannot
 * verify (factual accuracy, plagiarism against the open web) are deliberately
 * NOT claimed here; see content/editorial/README.md for what still needs a human or a
 * third-party service.
 *
 *   node content/editorial/house-style-lint.js [file...]      # defaults to all content
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const SECTIONS = ['tools', 'guides', 'reviews'];

/* Phrases that read as machine-written filler. Kept deliberately short: a long
   banlist starts rejecting legitimate prose. */
const BANNED_PHRASES = [
  'delve into', 'in today\'s fast-paced', 'in the ever-evolving', 'digital landscape',
  'rich tapestry', 'it is worth noting that', 'it\'s worth noting that', 'game-changer',
  'unleash the power', 'seamlessly integrate', 'robust solution', 'navigate the complexities',
  'in conclusion', 'furthermore,', 'moreover,', 'look no further', 'when it comes to',
  'the world of', 'unlock the', 'take your', 'to the next level', 'best-in-class',
];

/** Collect every prose string from a document's block tree. */
function proseOf(doc) {
  const out = [];
  const walk = (node) => {
    if (typeof node === 'string') return out.push(node);
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (key === 'code' || node.t === 'code') continue; // never lint code samples
        walk(value);
      }
    }
  };
  walk(doc.blocks || []);
  [doc.title, doc.h1, doc.description, doc.standfirst, doc.cardDesc].forEach((s) => s && out.push(s));
  return out;
}

function sentences(text) {
  return text
    .replace(/`[^`]*`/g, '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 2);
}

function stdev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
}

function loadAll() {
  const docs = [];
  for (const section of SECTIONS) {
    const dir = path.join(DATA, section);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      const full = path.join(dir, file);
      docs.push({ file: full, rel: `content/data/${section}/${file}`, doc: require(full) });
    }
  }
  return docs;
}

/** Jaccard overlap on normalised word sets — cheap near-duplicate detection. */
function overlap(a, b) {
  const norm = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3));
  const A = norm(a), B = norm(b);
  if (!A.size || !B.size) return 0;
  const shared = [...A].filter((w) => B.has(w)).length;
  return shared / new Set([...A, ...B]).size;
}

function lint(target, all) {
  const { doc, rel } = target;
  const problems = [];
  const prose = proseOf(doc);
  const text = prose.join(' ');

  // --- Punctuation ---
  // Inline code spans are samples, not prose: `A–Z` is a character range.
  const bare = prose.map((s) => s.replace(/`[^`]*`/g, ''));
  bare.forEach((s) => {
    const at = s.indexOf('—');
    if (at !== -1) problems.push(`em-dash used in prose: "…${s.slice(Math.max(0, at - 40), at + 40)}…"`);
  });
  // A SPACED en-dash is the connector to avoid. Unspaced ones are correct
  // typography: numeric ranges ($10–$30) and compounds (EU–US) both stay.
  bare.forEach((s) => {
    for (const m of s.matchAll(/.{0,25}\s–\s.{0,25}/g)) {
      problems.push(`spaced en-dash used as a connector: "…${m[0].trim()}…"`);
    }
  });

  // --- Banned filler ---
  const lower = text.toLowerCase();
  BANNED_PHRASES.forEach((p) => {
    if (lower.includes(p)) problems.push(`banned filler phrase: "${p}"`);
  });

  // --- Cadence: uniform sentence length reads as machine-written ---
  const lengths = sentences(text).map((s) => s.split(/\s+/).length);
  if (lengths.length >= 12) {
    const sd = stdev(lengths);
    if (sd < 6) problems.push(`sentence length too uniform (stdev ${sd.toFixed(1)}, want >= 6) — vary short and long sentences`);
    const longRun = lengths.filter((l) => l > 45).length;
    if (longRun > lengths.length * 0.15) problems.push(`${longRun} sentences over 45 words — break them up`);
  }

  // --- Substance ---
  const words = text.split(/\s+/).filter(Boolean).length;
  const floor = doc.tool ? 600 : 900;   // a tool page's value is the tool itself
  if (words < floor) problems.push(`only ${words} words of prose (want >= ${floor})`);
  if (!(doc.blocks || []).some((b) => b.t === 'faq')) problems.push('no FAQ block — required for FAQPage schema');
  if (!doc.keywords || doc.keywords.length < 3) problems.push('fewer than 3 keywords');

  // --- Originality against everything already published ---
  for (const other of all) {
    if (other.rel === rel) continue;
    if (other.doc.slug === doc.slug) problems.push(`duplicate slug with ${other.rel}`);
    const t = overlap(doc.title, other.doc.title);
    if (t > 0.6) problems.push(`title ${Math.round(t * 100)}% overlap with ${other.rel}: "${other.doc.title}"`);
    const shared = (doc.keywords || []).filter((k) => (other.doc.keywords || []).includes(k));
    if (shared.length >= 3) problems.push(`shares ${shared.length} keywords with ${other.rel}: ${shared.join(', ')}`);
  }

  return problems;
}

const all = loadAll();

/**
 * Files changed in the working tree, per git. Used by --changed so CI gates the
 * drafts it just produced rather than failing on a pre-existing page. Without
 * this, one legacy style violation blocks every future run of the pipeline.
 */
function changedFiles() {
  const { execSync } = require('child_process');
  const root = path.join(__dirname, '..', '..');
  const out = execSync('git status --porcelain -- content/data', { cwd: root, encoding: 'utf8' });
  return out
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(root, f));
}

const args = process.argv.slice(2);
let targets;
if (args.includes('--changed')) {
  const changed = new Set(changedFiles());
  targets = all.filter((d) => changed.has(d.file));
  if (!targets.length) {
    console.log('house-style: no changed content files. Nothing to check.');
    process.exit(0);
  }
} else if (args.length) {
  targets = all.filter((d) => args.some((a) => d.file.endsWith(path.basename(a))));
} else {
  targets = all;
}

let failed = 0;
for (const target of targets) {
  const problems = lint(target, all);
  if (problems.length) {
    failed++;
    console.log(`\n${target.rel}`);
    problems.forEach((p) => console.log(`  • ${p}`));
  }
}

console.log(`\nhouse-style: ${targets.length} checked, ${failed} with problems.`);
process.exitCode = failed ? 1 : 0;
