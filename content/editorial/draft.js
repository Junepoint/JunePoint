#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const EDITORIAL = __dirname;
const DATA = path.join(EDITORIAL, '..', 'data');
const COMMISSIONS = path.join(EDITORIAL, 'commissions.json');

const MODEL = process.env.CONTENT_MODEL || 'claude-opus-5';
const API_KEY = process.env.ANTHROPIC_API_KEY;
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const COUNT = Number((args[args.indexOf('--count') + 1] || '').replace(/\D/g, '')) || 1;

if (!API_KEY && !DRY_RUN) {
  console.error('draft: ANTHROPIC_API_KEY is not set.');
  process.exit(1);
}

function published() {
  return ['tools', 'guides', 'reviews'].flatMap((section) => {
    const dir = path.join(DATA, section);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => {
      const doc = require(path.join(dir, f));
      return { slug: doc.slug, title: doc.title, keywords: doc.keywords || [] };
    });
  });
}

function buildPrompt(topic, existing, previousFailures) {
  const style = fs.readFileSync(path.join(EDITORIAL, 'house-style.md'), 'utf8');
  const schema = fs.readFileSync(path.join(EDITORIAL, 'article-schema.md'), 'utf8');

  return `${style}

---

${schema}

---

## Already published (do not duplicate any of these)

${existing.map((e) => `- ${e.title}  [keywords: ${e.keywords.join(', ')}]`).join('\n')}

---

## Your assignment

Section: ${topic.section}
Slug: ${topic.slug}
Angle: ${topic.angle}

Write this article. Return ONLY a single JSON object, no prose around it, no
markdown fence. It must parse with JSON.parse and match the schema above.
${
  previousFailures
    ? `\n## Your previous attempt was REJECTED. Fix every one of these and try again:\n${previousFailures
        .map((f) => `- ${f}`)
        .join('\n')}\n`
    : ''
}`;
}

async function askClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${(await response.text()).slice(0, 400)}`);
  }
  const body = await response.json();
  return body.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
}

function parseDocument(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in model response');
  return JSON.parse(raw.slice(start, end + 1));
}

const ALLOWED_BLOCKS = new Set(['p', 'lede', 'h2', 'h3', 'ul', 'ol', 'code', 'note', 'takeaways', 'steps', 'table', 'faq', 'cards', 'pick']);

function assertShape(doc, topic) {
  const required = ['slug', 'title', 'h1', 'description', 'standfirst', 'keywords', 'blocks'];
  for (const key of required) if (!doc[key]) throw new Error(`missing required field: ${key}`);
  if (doc.slug !== topic.slug) throw new Error(`slug is "${doc.slug}", expected "${topic.slug}"`);
  if (!Array.isArray(doc.blocks) || !doc.blocks.length) throw new Error('blocks must be a non-empty array');
  for (const block of doc.blocks) {
    if (!ALLOWED_BLOCKS.has(block.t)) throw new Error(`unknown block type: ${block.t}`);
  }
  if (JSON.stringify(doc).includes('<script')) throw new Error('model output contained a <script> tag');
}

function serialise(doc, topic) {
  const today = new Date().toISOString().slice(0, 10);
  const full = {
    ...doc,
    schemaType: topic.section === 'guides' ? 'TechArticle' : 'Article',
    published: doc.published || today,
    updated: today,
    author: doc.author || 'jackson',
  };
  return `module.exports = ${JSON.stringify(full, null, 2)};\n`;
}

function gate(file) {
  const failures = [];
  const run = (cmd, cmdArgs) => {
    try {
      execFileSync(cmd, cmdArgs, { cwd: path.join(EDITORIAL, '..', '..'), stdio: 'pipe' });
      return null;
    } catch (error) {
      return `${(error.stdout || '').toString()}${(error.stderr || '').toString()}`.trim();
    }
  };
  const styleOut = run('node', ['content/editorial/house-style-lint.js', path.basename(file)]);
  if (styleOut) failures.push(...styleOut.split('\n').filter((l) => l.trim().startsWith('•')).map((l) => l.replace(/^\s*•\s*/, '')));

  const buildOut = run('npm', ['run', 'build:content']);
  if (buildOut) failures.push(`build failed: ${buildOut.slice(0, 300)}`);
  else {
    const validateOut = run('npm', ['run', 'check:content']);
    if (validateOut) failures.push(`validation failed: ${validateOut.slice(0, 300)}`);
  }
  return failures;
}

async function writeOne(topic, existing) {
  const file = path.join(DATA, topic.section, `${topic.slug}.js`);
  let failures = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    console.log(`draft: ${topic.slug} (attempt ${attempt}/2)`);
    const raw = await askClaude(buildPrompt(topic, existing, failures));
    let doc;
    try {
      doc = parseDocument(raw);
      assertShape(doc, topic);
    } catch (error) {
      failures = [String(error.message)];
      console.log(`  rejected: ${error.message}`);
      continue;
    }

    fs.writeFileSync(file, serialise(doc, topic));
    failures = gate(file);
    if (!failures.length) {
      console.log(`  accepted: ${file}`);
      return true;
    }
    console.log(`  rejected by gates:\n${failures.map((f) => `    - ${f}`).join('\n')}`);
    fs.unlinkSync(file);
  }

  console.log(`draft: giving up on ${topic.slug}; leaving it in the queue.`);
  return false;
}

(async () => {
  const queue = JSON.parse(fs.readFileSync(COMMISSIONS, 'utf8'));
  const pending = queue.topics.filter((t) => !t.done).slice(0, COUNT);

  if (!pending.length) {
    console.log('draft: queue is empty. Add topics to content/editorial/commissions.json.');
    return;
  }
  if (DRY_RUN) {
    console.log(`draft: dry run. Would draft ${pending.length}:`);
    pending.forEach((t) => console.log(`  ${t.section}/${t.slug} — ${t.angle}`));
    return;
  }

  const existing = published();
  let accepted = 0;
  for (const topic of pending) {
    if (await writeOne(topic, existing)) {
      topic.done = true;
      accepted++;
    }
  }
  fs.writeFileSync(COMMISSIONS, `${JSON.stringify(queue, null, 2)}\n`);
  console.log(`\ngenerate: ${accepted} of ${pending.length} accepted.`);
  if (!accepted) process.exitCode = 1;
})();
