module.exports = {
  slug: 'base64-encoder-decoder',
  title: 'Base64 Encoder & Decoder — Unicode Safe, Offline',
  h1: 'Base64 Encoder and Decoder',
  eyebrow: 'Developer tool',
  description:
    'Encode and decode Base64 and Base64url in your browser, with correct UTF-8 handling for emoji and accented characters. No uploads, no tracking.',
  standfirst:
    'Convert text to Base64 and back, including the URL-safe variant. Handles Unicode properly, which the usual one-line browser trick does not.',
  keywords: ['base64 encode', 'base64 decode', 'base64url', 'base64 converter', 'decode base64 online'],
  published: '2026-03-11',
  updated: '2026-08-18',
  author: 'jackson',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-toolbar">
    <button class="jp-btn" type="button" id="b64-encode">Encode &darr;</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="b64-decode">&uarr; Decode</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="b64-swap">Swap</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="b64-clear">Clear</button>
    <label class="jp-checkline"><input type="checkbox" id="b64-urlsafe" /> URL-safe (Base64url)</label>
    <label class="jp-checkline"><input type="checkbox" id="b64-wrap" /> Wrap at 76 chars</label>
  </div>

  <div class="jp-field">
    <label for="b64-plain">Plain text</label>
    <textarea class="jp-textarea" id="b64-plain" spellcheck="false" style="min-height:150px"
      placeholder="Type or paste text here…"></textarea>
  </div>

  <div class="jp-field">
    <label for="b64-encoded">Base64</label>
    <textarea class="jp-textarea" id="b64-encoded" spellcheck="false" style="min-height:150px"
      placeholder="…or paste Base64 here and press Decode"></textarea>
  </div>

  <div class="jp-toolbar">
    <button class="jp-btn jp-btn--ghost" type="button" data-copy="b64-plain">Copy plain text</button>
    <button class="jp-btn jp-btn--ghost" type="button" data-copy="b64-encoded">Copy Base64</button>
  </div>

  <p class="jp-status" id="b64-status" role="status" aria-live="polite">&nbsp;</p>
  <div class="jp-results" id="b64-stats"></div>
</div>`,

    js: `
(function () {
  var plain = document.getElementById('b64-plain');
  var encoded = document.getElementById('b64-encoded');
  var status = document.getElementById('b64-status');
  var stats = document.getElementById('b64-stats');
  var urlsafe = document.getElementById('b64-urlsafe');
  var wrap = document.getElementById('b64-wrap');

  function setStatus(message, kind) {
    status.textContent = message || '\\u00a0';
    status.className = 'jp-status' + (kind ? ' jp-status--' + kind : '');
  }

  // btoa() only handles Latin-1, so anything above U+00FF has to become UTF-8
  // bytes first. Skipping this step is why "btoa(emoji)" throws.
  function toBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function fromBase64(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function showStats(text, b64) {
    var inBytes = new TextEncoder().encode(text).length;
    stats.innerHTML =
      '<div class="jp-stat"><p class="jp-stat-label">Input</p><p class="jp-stat-value">' + inBytes +
        '</p><p class="jp-stat-sub">bytes (' + text.length + ' characters)</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Base64</p><p class="jp-stat-value">' + b64.length +
        '</p><p class="jp-stat-sub">characters</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Overhead</p><p class="jp-stat-value">' +
        (inBytes ? '+' + Math.round((b64.length / inBytes - 1) * 100) + '%' : '—') +
        '</p><p class="jp-stat-sub">size increase</p></div>';
  }

  function encode() {
    var text = plain.value;
    if (!text) { encoded.value = ''; setStatus(''); stats.innerHTML = ''; return; }
    try {
      var out = toBase64(text);
      if (urlsafe.checked) out = out.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
      if (wrap.checked) out = out.replace(/.{76}/g, '$&\\n');
      encoded.value = out;
      setStatus('Encoded ' + new TextEncoder().encode(text).length + ' bytes', 'ok');
      showStats(text, out);
    } catch (error) {
      setStatus('Could not encode: ' + error.message, 'err');
    }
  }

  function decode() {
    var raw = encoded.value.replace(/\\s+/g, '');
    if (!raw) { plain.value = ''; setStatus(''); stats.innerHTML = ''; return; }
    var normalised = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (normalised.length % 4) normalised += '=';
    try {
      var text = fromBase64(normalised);
      plain.value = text;
      setStatus('Decoded successfully', 'ok');
      showStats(text, raw);
    } catch (error) {
      setStatus(
        /character|atob/i.test(error.message)
          ? 'Not valid Base64 — check for stray characters, or tick URL-safe if it contains - and _'
          : 'Decoded bytes are not valid UTF-8 text. This is probably binary data such as an image.',
        'err'
      );
    }
  }

  document.getElementById('b64-encode').addEventListener('click', encode);
  document.getElementById('b64-decode').addEventListener('click', decode);
  document.getElementById('b64-clear').addEventListener('click', function () {
    plain.value = ''; encoded.value = ''; setStatus(''); stats.innerHTML = ''; plain.focus();
  });
  document.getElementById('b64-swap').addEventListener('click', function () {
    var a = plain.value; plain.value = encoded.value; encoded.value = a;
  });
  plain.addEventListener('input', encode);
  encoded.addEventListener('input', function () { if (document.activeElement === encoded) decode(); });
  urlsafe.addEventListener('change', encode);
  wrap.addEventListener('change', encode);
})();`,
  },

  blocks: [
    { t: 'h2', x: 'What Base64 is for' },
    {
      t: 'p',
      x: 'Base64 takes arbitrary bytes and represents them using 64 characters that survive text-only channels intact: `A–Z`, `a–z`, `0–9`, `+` and `/`, with `=` as padding. It exists because a great deal of internet plumbing — email headers, JSON, URLs, XML — was designed for text and mangles raw binary.',
    },
    {
      t: 'p',
      x: 'Three bytes of input become four characters of output, so **encoded data is about 33% larger** than what went in. That is the price of safe passage, and it is why embedding large images as data URIs is usually a false economy.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Base64 is not encryption',
      x: 'It provides zero confidentiality. Anyone can decode it instantly — this page does it without a key. Never use it to "hide" a password, an API key or a token. If it needs to be secret, it needs to be encrypted.',
    },

    { t: 'h2', x: 'Base64 vs Base64url' },
    {
      t: 'p',
      x: 'Standard Base64 uses `+` and `/`, both of which have special meaning in URLs, and `=` padding, which is awkward in query strings. Base64url swaps them for `-` and `_` and usually drops the padding entirely.',
    },
    {
      t: 'table',
      head: ['', 'Standard', 'URL-safe'],
      rows: [
        ['Character 62', '`+`', '`-`'],
        ['Character 63', '`/`', '`_`'],
        ['Padding', '`=` required', 'usually omitted'],
        ['Used by', 'Email, data URIs, HTTP Basic auth', 'JWTs, URL parameters, filenames'],
      ],
    },
    {
      t: 'p',
      x: 'This is the single most common cause of "invalid Base64" errors: a JWT segment pasted into a standard decoder fails because of the `-` and `_`. Tick the URL-safe box above and it decodes cleanly. The tool also re-adds missing padding automatically.',
    },

    { t: 'h2', x: 'The Unicode problem that breaks most encoders' },
    {
      t: 'p',
      x: 'The browser’s built-in `btoa()` only accepts characters in the Latin-1 range. Give it an emoji, a Chinese character or even a curly apostrophe and it throws:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `btoa('café ☕')
// InvalidCharacterError: The string to be encoded contains
// characters outside of the Latin1 range.`,
    },
    {
      t: 'p',
      x: 'The fix is to convert to UTF-8 bytes first, then encode those bytes. That is what this tool does, which is why it round-trips emoji and accented text correctly where many online converters silently corrupt them:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `function toBase64(text) {
  const bytes = new TextEncoder().encode(text);      // UTF-8 bytes
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}`,
    },

    { t: 'h2', x: 'Where you will meet it in practice' },
    {
      t: 'ul',
      items: [
        '**HTTP Basic authentication** — the header is literally `Authorization: Basic ` followed by `username:password` in Base64. That is obfuscation, not security, which is why Basic auth over plain HTTP is indefensible.',
        '**JWTs** — header and payload are Base64url-encoded JSON. Decode one with the [JWT decoder](/tools/jwt-decoder/) for a proper claims view.',
        '**Data URIs** — `data:image/png;base64,…` inlines a file into HTML or CSS, saving a request at the cost of 33% more bytes and no separate caching.',
        '**Email attachments** — MIME has encoded binary parts this way since the early 1990s.',
        '**Kubernetes secrets** — values in a Secret manifest are Base64. This trips up newcomers constantly: it is encoding for transport, not protection, and anyone with read access to the manifest has the plaintext.',
        '**SSH keys and certificates** — the body of a PEM file between the header and footer lines is Base64-encoded DER.',
      ],
    },

    { t: 'h2', x: 'Doing it from the command line' },
    {
      t: 'code',
      lang: 'bash',
      x: `# Encode a string (the -n stops echo adding a newline to the input)
echo -n 'hello world' | base64

# Decode
echo 'aGVsbG8gd29ybGQ=' | base64 --decode

# macOS uses -D instead of --decode
echo 'aGVsbG8gd29ybGQ=' | base64 -D

# Encode a file
base64 -i logo.png -o logo.txt

# Read a Kubernetes secret value
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 --decode`,
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'The `-n` matters',
      x: 'Without it, `echo` appends a newline that gets encoded along with your text. The result differs from what you expected by exactly one trailing character, which is a genuinely annoying half-hour to debug when comparing against a value generated elsewhere.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does my Base64 string end with one or two equals signs?',
          a: 'Base64 works on three-byte groups. When the input length is not a multiple of three, padding characters bring the final group up to four output characters. One "=" means the input had one byte left over in the final group; two means it had one byte of a three-byte group. Base64url normally omits the padding, and decoders re-add it.',
        },
        {
          q: 'Why does decoding say the result is not valid UTF-8?',
          a: 'Because the encoded data is probably binary — an image, an archive or a certificate — rather than text. It decoded fine at the byte level; those bytes simply do not form readable characters. This tool works with text only.',
        },
        {
          q: 'Is Base64 secure for storing passwords?',
          a: 'Not at all, in any sense. It is a public, reversible encoding with no key. Passwords should be hashed with a slow, salted algorithm designed for the purpose — bcrypt, scrypt or Argon2 — never encoded, and never encrypted with a key that sits next to the data.',
        },
        {
          q: 'Does the tool handle large inputs?',
          a: 'Text up to a few megabytes converts instantly. It works on strings rather than files, so it is not the right tool for encoding a large binary — use the base64 command line utility for that.',
        },
        {
          q: 'Is anything I paste uploaded?',
          a: 'No. Encoding and decoding both happen in your browser with the standard TextEncoder, btoa and atob APIs. Nothing is transmitted.',
        },
      ],
    },
  ],

  related: ['/tools/jwt-decoder/', '/tools/uuid-generator/', '/tools/json-formatter/'],
};
