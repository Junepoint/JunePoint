module.exports = {
  slug: 'uuid-generator',
  title: 'UUID Generator — v4 and v7, Bulk, Cryptographic',
  h1: 'UUID Generator',
  eyebrow: 'Developer tool',
  description:
    'Generate UUID v4 and time-ordered UUID v7 in bulk, using your browser’s cryptographic random source. Multiple formats, no server involved.',
  standfirst:
    'Generate cryptographically random UUID v4 or time-sortable UUID v7, one at a time or a thousand at once. Everything is produced locally by your browser’s crypto API.',
  keywords: ['uuid generator', 'uuid v4 generator', 'uuid v7', 'guid generator', 'random uuid', 'bulk uuid'],
  published: '2026-03-18',
  updated: '2026-08-17',
  author: 'jackson',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-tool-grid">
    <div class="jp-field">
      <label for="uu-version">Version</label>
      <select class="jp-select" id="uu-version">
        <option value="4">v4 — random (the default choice)</option>
        <option value="7">v7 — time-ordered (best for database keys)</option>
        <option value="nil">Nil UUID (all zeroes)</option>
        <option value="max">Max UUID (all ones)</option>
      </select>
    </div>
    <div class="jp-field">
      <label for="uu-count">How many</label>
      <input class="jp-input" type="number" id="uu-count" value="10" min="1" max="1000" step="1" />
    </div>
    <div class="jp-field">
      <label for="uu-format">Format</label>
      <select class="jp-select" id="uu-format">
        <option value="lower">Lowercase with hyphens (canonical)</option>
        <option value="upper">UPPERCASE with hyphens</option>
        <option value="plain">No hyphens</option>
        <option value="braces">Braced {…} — Microsoft style</option>
        <option value="urn">URN — urn:uuid:…</option>
        <option value="sql">SQL INSERT values</option>
      </select>
    </div>
  </div>

  <div class="jp-toolbar">
    <button class="jp-btn" type="button" id="uu-generate">Generate</button>
    <button class="jp-btn jp-btn--ghost" type="button" data-copy="uu-output">Copy all</button>
  </div>

  <div class="jp-field">
    <label for="uu-output">Output</label>
    <textarea class="jp-textarea" id="uu-output" spellcheck="false" readonly style="min-height:230px"></textarea>
  </div>
  <p class="jp-status jp-status--ok" id="uu-status" role="status" aria-live="polite">&nbsp;</p>
</div>`,

    js: `
(function () {
  var output = document.getElementById('uu-output');
  var status = document.getElementById('uu-status');

  function randomBytes(n) {
    var bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function format(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' +
           hex.slice(16, 20) + '-' + hex.slice(20, 32);
  }

  function v4() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;  // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80;  // RFC 4122 variant
    return format(bytes);
  }

  // v7: 48-bit big-endian Unix millisecond timestamp, then version, variant and
  // random. The 12 bits after the version hold a counter (RFC 9562 "method 1")
  // so that UUIDs minted inside the same millisecond still sort in creation
  // order — without it, a bulk generation comes out shuffled.
  var lastMs = 0;
  var counter = 0;

  function v7() {
    var bytes = randomBytes(16);
    var ms = Date.now();

    if (ms === lastMs) {
      counter++;
      if (counter > 0xfff) { ms = ++lastMs; counter = 0; }  // borrow from the next ms
    } else {
      lastMs = ms;
      // Seed low in the range so there is room to count up within this ms.
      counter = ((bytes[6] & 0x0f) << 4) | (bytes[7] & 0x0f);
    }

    bytes[0] = (ms / 1099511627776) & 0xff;
    bytes[1] = (ms / 4294967296) & 0xff;
    bytes[2] = (ms / 16777216) & 0xff;
    bytes[3] = (ms / 65536) & 0xff;
    bytes[4] = (ms / 256) & 0xff;
    bytes[5] = ms & 0xff;
    bytes[6] = 0x70 | ((counter >> 8) & 0x0f);  // version 7 + counter high bits
    bytes[7] = counter & 0xff;                  // counter low bits
    bytes[8] = (bytes[8] & 0x3f) | 0x80;        // variant
    return format(bytes);
  }

  var SPECIAL = {
    nil: '00000000-0000-0000-0000-000000000000',
    max: 'ffffffff-ffff-ffff-ffff-ffffffffffff'
  };

  function apply(uuid, style) {
    switch (style) {
      case 'upper': return uuid.toUpperCase();
      case 'plain': return uuid.replace(/-/g, '');
      case 'braces': return '{' + uuid + '}';
      case 'urn': return 'urn:uuid:' + uuid;
      case 'sql': return "  ('" + uuid + "'),";
      default: return uuid;
    }
  }

  function generate() {
    var version = document.getElementById('uu-version').value;
    var count = Math.max(1, Math.min(1000, parseInt(document.getElementById('uu-count').value, 10) || 1));
    var style = document.getElementById('uu-format').value;

    var list = [];
    for (var i = 0; i < count; i++) {
      list.push(apply(SPECIAL[version] || (version === '7' ? v7() : v4()), style));
    }

    if (style === 'sql') {
      list[list.length - 1] = list[list.length - 1].replace(/,$/, ';');
      list.unshift('INSERT INTO items (id) VALUES');
    }

    output.value = list.join('\\n');
    status.textContent = count + ' UUID' + (count === 1 ? '' : 's') + ' generated locally using crypto.getRandomValues()';
  }

  ['uu-version', 'uu-count', 'uu-format'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', generate);
  });
  document.getElementById('uu-generate').addEventListener('click', generate);
  generate();
})();`,
  },

  blocks: [
    { t: 'h2', x: 'v4 or v7? The decision in one paragraph' },
    {
      t: 'p',
      x: 'If the UUID is a **primary key in a database**, use v7. If it is anything else — a correlation ID, an idempotency key, a filename, a request trace — use v4. That single rule covers almost every real case, and the reason comes down to what random keys do to a B-tree index.',
    },

    { t: 'h2', x: 'Why random UUIDs hurt database performance' },
    {
      t: 'p',
      x: 'A v4 UUID is 122 bits of randomness. Consecutive inserts land at unrelated points in the index, so the database is writing to pages scattered all over the disk instead of appending to the end. Three things get worse at once:',
    },
    {
      t: 'ul',
      items: [
        '**Page splits.** Inserting into the middle of a full index page splits it, which is expensive and leaves both halves partly empty.',
        '**Index bloat.** Those half-empty pages mean the index consumes far more space than the data justifies — and a bigger index is a slower index.',
        '**Cache misses.** Random writes touch pages that are not in memory. On a large table with a hot insert path, this is the difference between a buffer-pool hit and a disk read.',
      ],
    },
    {
      t: 'p',
      x: 'The effect is invisible on a table with ten thousand rows and unmissable on one with fifty million. It is also worse on MySQL with InnoDB, where the primary key *is* the physical row order, than on PostgreSQL, where the heap is separate — but it is real on both.',
    },

    { t: 'h2', x: 'What v7 changes' },
    {
      t: 'p',
      x: 'UUID v7 puts a 48-bit Unix millisecond timestamp in the leading bits and fills the rest with randomness. The result is still a 128-bit UUID that fits every existing UUID column and library, but it sorts by creation time — so inserts append to the right-hand edge of the index exactly like an auto-incrementing integer.',
    },
    {
      t: 'code',
      lang: 'text',
      x: `v4:  9f8d1c47-3b2e-4a15-9c6d-8e7f0a1b2c3d   ← nothing sortable
     b1e05c92-7d4a-4f68-a2b1-5c9e3d7f8a0b   ← lands somewhere else entirely

v7:  019512a3-4f80-7c21-9d3e-1a2b3c4d5e6f   ← 019512a3-4f80 is the timestamp
     019512a3-5b1c-7e04-8f2a-6b7c8d9e0f1a   ← next insert sorts after it`,
    },
    {
      t: 'p',
      x: 'You keep what made UUIDs attractive — generate them on the client, no round trip to the database, no coordination between services, no leaking of row counts — while dropping most of the index penalty. Generate a few v7s above and note that they arrive in ascending order.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'v7 leaks a creation timestamp',
      x: 'The time an entity was created is recoverable from its ID, to the millisecond. That is usually harmless and occasionally useful, but if the IDs are public and the timing is sensitive — signup order, medical records, sealed bids — that is a real disclosure. Use v4 there.',
    },

    { t: 'h2', x: 'Collision risk, concretely' },
    {
      t: 'p',
      x: 'The standard reassurance is that UUID v4 collisions are "practically impossible", which is true but unhelpfully vague. The actual figure: you would need to generate roughly **2.7 quintillion** v4 UUIDs before reaching a 50% chance of a single collision. At a million per second, that is about 85,000 years.',
    },
    {
      t: 'p',
      x: 'The caveat that matters far more than the birthday maths: this holds **only with a cryptographically secure random source.** A `Math.random()`-based generator has vastly less entropy and produces predictable, occasionally colliding values. This tool uses `crypto.randomUUID()` where available and `crypto.getRandomValues()` otherwise — never `Math.random()`.',
    },

    { t: 'h2', x: 'Storing UUIDs efficiently' },
    {
      t: 'p',
      x: 'A UUID is 16 bytes. Its canonical text form is 36 characters. Storing it as `VARCHAR(36)` therefore more than doubles the storage and slows every comparison, and this is one of the most common schema mistakes in the wild.',
    },
    {
      t: 'table',
      head: ['Database', 'Use this', 'Not this'],
      rows: [
        ['PostgreSQL', '`uuid` (native, 16 bytes)', '`varchar(36)` / `text`'],
        ['MySQL 8+', '`BINARY(16)` with `UUID_TO_BIN(uuid, 1)`', '`CHAR(36)`'],
        ['SQL Server', '`uniqueidentifier`', '`nvarchar(36)`'],
        ['SQLite', '`BLOB`, or `TEXT` if you value readability', '—'],
      ],
      caption: 'The second argument to MySQL’s UUID_TO_BIN swaps the time fields to improve index locality for v1 UUIDs.',
    },

    { t: 'h2', x: 'Generating UUIDs in your own code' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// JavaScript — built in since 2021, no dependency needed.
// Requires a secure context (HTTPS or localhost).
const id = crypto.randomUUID();

// Node.js
import { randomUUID } from 'node:crypto';
const id = randomUUID();`,
    },
    {
      t: 'code',
      lang: 'sql',
      x: `-- PostgreSQL 13+ (v4)
SELECT gen_random_uuid();

-- PostgreSQL 18+ adds native v7
SELECT uuidv7();

-- MySQL 8+ (v1, not v4 — note the difference)
SELECT UUID();`,
    },
    {
      t: 'code',
      lang: 'python',
      x: `import uuid
uuid.uuid4()          # random
str(uuid.uuid4())     # canonical string form`,
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'crypto.randomUUID is undefined on plain HTTP',
      x: 'It is restricted to secure contexts. On an insecure origin — a LAN IP during development, for instance — it is simply not there, which produces a confusing `crypto.randomUUID is not a function`. Use `localhost` rather than the IP address, or enable HTTPS locally.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Are these UUIDs generated on your server?',
          a: 'No. They are produced in your browser by the Web Crypto API, which draws from the operating system’s cryptographically secure random source. Nothing is transmitted, logged or stored, so no one — including us — has ever seen the values you generate.',
        },
        {
          q: 'What is the difference between a UUID and a GUID?',
          a: 'Nothing meaningful. GUID is Microsoft’s name for the same 128-bit identifier. The braced uppercase format in the dropdown above is the conventional Windows presentation of it.',
        },
        {
          q: 'Should I use a UUID or an auto-incrementing integer?',
          a: 'Integers are smaller and faster but require a database round trip, reveal how many rows you have, and are painful to merge across shards or offline clients. UUIDs cost more storage but can be generated anywhere with no coordination. UUID v7 narrows the performance gap enough that it is a reasonable default for distributed systems.',
        },
        {
          q: 'Is v7 finalised?',
          a: 'Yes. UUID v7 was standardised in RFC 9562, published in May 2024, which supersedes RFC 4122. Library and database support has been arriving steadily since — PostgreSQL added a native uuidv7() function in version 18.',
        },
        {
          q: 'What are the nil and max UUIDs for?',
          a: 'The nil UUID (all zeroes) is the conventional "no value" sentinel where null is not available. The max UUID (all ones) was formalised in RFC 9562 and is useful as an upper bound in range queries. Neither is random and neither should ever be used as a real identifier.',
        },
      ],
    },
  ],

  related: ['/tools/base64-encoder-decoder/', '/tools/jwt-decoder/', '/guides/postgres-connection-refused/'],
};
