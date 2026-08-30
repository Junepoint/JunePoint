module.exports = {
  slug: 'uuid-generator',
  title: 'UUID v4 and v7 Generator with Bulk Output',
  h1: 'UUID Generator',
  eyebrow: 'Developer tool',
  description:
    'Generate UUID v4 or time-ordered UUID v7 values with the browser Web Crypto API, in batches of up to 1,000 and several output formats.',
  standfirst:
    'Choose UUID v4, UUID v7, nil or max values, then generate lowercase, uppercase, compact, braced, URN or SQL output.',
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
        <option value="4">v4: random</option>
        <option value="7">v7: time-ordered</option>
        <option value="nil">Nil UUID (all zeroes)</option>
        <option value="max">Max UUID (all ones)</option>
      </select>
    </div>
    <div class="jp-field">
      <label for="uu-count">Number to generate</label>
      <input class="jp-input" type="number" id="uu-count" value="10" min="1" max="1000" step="1" />
    </div>
    <div class="jp-field">
      <label for="uu-format">Format</label>
      <select class="jp-select" id="uu-format">
        <option value="lower">Lowercase with hyphens (canonical)</option>
        <option value="upper">UPPERCASE with hyphens</option>
        <option value="plain">No hyphens</option>
        <option value="braces">Braced {…} format</option>
        <option value="urn">URN format: urn:uuid:…</option>
        <option value="sql">SQL INSERT values</option>
      </select>
    </div>
  </div>

  <div class="jp-toolbar">
    <button class="jp-btn" type="button" id="uu-generate">Generate UUIDs</button>
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
  // order. Without it, a bulk generation comes out shuffled.
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
    status.textContent = 'Generated ' + count + ' UUID' + (count === 1 ? '' : 's') + ' locally in this browser.';
  }

  ['uu-version', 'uu-count', 'uu-format'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', generate);
  });
  document.getElementById('uu-generate').addEventListener('click', generate);
  generate();
})();`,
  },

  blocks: [
    { t: 'h2', x: 'Choosing UUID v4 or v7' },
    {
      t: 'p',
      x: 'Use v4 when you need an opaque random identifier, such as a correlation ID, idempotency key or filename. Consider v7 for a database key when insertion order matters. Its leading timestamp makes new values sort by creation time, but it also reveals when the ID was created.',
    },

    { t: 'h2', x: 'How random UUIDs affect database indexes' },
    {
      t: 'p',
      x: 'A v4 UUID contains 122 random bits. Consecutive values can land at unrelated positions in a B-tree index instead of near its right edge. On write-heavy indexed tables, that pattern can increase:',
    },
    {
      t: 'ul',
      items: [
        '**Page splits.** An insert into a full interior index page can split the page and leave unused space in both resulting pages.',
        '**Index size.** Lower page occupancy can make the index larger than one built from sequential values.',
        '**Cache misses.** Inserts distributed across the index may touch more pages than inserts concentrated near one edge.',
      ],
    },
    {
      t: 'p',
      x: 'The effect depends on table size, write rate, cache and database engine. It can matter more in MySQL InnoDB, where the primary key controls clustered row order, than in PostgreSQL, where heap storage is separate from the index.',
    },

    { t: 'h2', x: 'What v7 changes' },
    {
      t: 'p',
      x: 'UUID v7 places a 48-bit Unix millisecond timestamp in the leading bits and uses the remaining fields for version, variant and random or monotonic data. It remains a 128-bit UUID and sorts broadly by creation time, which gives index inserts more locality than v4.',
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
      x: 'UUID v7 values can still be generated without a database sequence or coordination between services, and they do not expose a simple row count. This generator uses a counter within the same millisecond so values produced in one batch remain ordered.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'v7 exposes a creation timestamp',
      x: 'The leading bits reveal the generation time to millisecond precision. Use v4 when a public identifier must not disclose timing, such as an ID associated with signup order, medical records or sealed bids.',
    },

    { t: 'h2', x: 'UUID v4 collision probability' },
    {
      t: 'p',
      x: 'A v4 UUID has 122 random bits after its version and variant bits are fixed. The birthday bound reaches a 50% chance of at least one collision after roughly **2.7 quintillion** generated values. At one million values per second, reaching that count would take about 85,000 years.',
    },
    {
      t: 'p',
      x: 'That probability assumes a **cryptographically secure random source**. `Math.random()` is not suitable because its entropy and predictability depend on the implementation. This tool uses `crypto.randomUUID()` when available and `crypto.getRandomValues()` as its fallback.',
    },

    { t: 'h2', x: 'Storing UUIDs efficiently' },
    {
      t: 'p',
      x: 'A UUID contains 16 bytes, while its canonical text form uses 36 characters. A native UUID type or 16-byte binary column uses less index and row storage than `VARCHAR(36)` and avoids text collation during comparison.',
    },
    {
      t: 'table',
      head: ['Database', 'Use this', 'Not this'],
      rows: [
        ['PostgreSQL', '`uuid` (native, 16 bytes)', '`varchar(36)` / `text`'],
        ['MySQL 8+', '`BINARY(16)` with `UUID_TO_BIN(uuid, 1)`', '`CHAR(36)`'],
        ['SQL Server', '`uniqueidentifier`', '`nvarchar(36)`'],
        ['SQLite', '`BLOB`, or `TEXT` when readability is preferred', 'Not applicable'],
      ],
      caption: 'The second argument to MySQL’s UUID_TO_BIN swaps time fields to improve index locality for version 1 UUIDs.',
    },

    { t: 'h2', x: 'Generating UUIDs in your own code' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// JavaScript; built in since 2021, no dependency needed.
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

-- MySQL 8+ (v1, not v4; note the difference)
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
      x: '`crypto.randomUUID()` is available only in secure contexts. An HTTP page opened through a LAN IP may not expose it. Use `localhost` during local development or serve the page over HTTPS.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Are these UUIDs generated on your server?',
          a: 'No. The browser generates them through the Web Crypto API, which uses a cryptographically secure random source supplied by the platform. This tool does not send or store the generated values.',
        },
        {
          q: 'What is the difference between a UUID and a GUID?',
          a: 'GUID is Microsoft terminology for the same general 128-bit identifier format. Windows APIs often display GUIDs in uppercase inside braces, which is one of the output options above.',
        },
        {
          q: 'Should I use a UUID or an auto-incrementing integer?',
          a: 'Integers use less storage and preserve insertion order, but a central sequence may require coordination and can reveal approximate row counts. UUIDs can be generated independently across services and offline clients at the cost of larger keys. UUID v7 adds time ordering when index locality is important.',
        },
        {
          q: 'Is v7 finalised?',
          a: 'Yes. RFC 9562 standardized UUID v7 in May 2024 and superseded RFC 4122. PostgreSQL added a native `uuidv7()` function in version 18, while support in other libraries and databases varies by version.',
        },
        {
          q: 'What are the nil and max UUIDs for?',
          a: 'The nil UUID contains all zero bits and can serve as a sentinel when `null` is unavailable. RFC 9562 defines the max UUID with all bits set, which can serve as an upper range bound. Neither value is random, so do not assign either as a unique entity ID.',
        },
      ],
    },
  ],

  related: ['/tools/base64-encoder-decoder/', '/tools/jwt-decoder/', '/guides/postgres-connection-refused/'],
};
