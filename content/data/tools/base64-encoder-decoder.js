module.exports = {
  slug: 'base64-encoder-decoder',
  title: 'Base64 Encoder and Decoder for UTF-8 and Base64url',
  h1: 'Base64 Encoder and Decoder',
  eyebrow: 'Developer tool',
  description:
    'Encode UTF-8 text as Base64 or Base64url, or decode it locally in your browser. Emoji and accented characters are supported.',
  standfirst:
    'Paste text or Base64 to convert it in either direction. Choose Base64url for values used in URLs and tokens.',
  keywords: ['base64 encode', 'base64 decode', 'base64url', 'base64 converter', 'decode base64 online'],
  published: '2026-03-11',
  updated: '2026-08-18',
  author: 'jackson',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-toolbar">
    <button class="jp-btn" type="button" id="b64-encode">Encode as Base64 &darr;</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="b64-decode">&uarr; Decode to text</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="b64-swap">Swap</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="b64-clear">Clear</button>
    <label class="jp-checkline"><input type="checkbox" id="b64-urlsafe" /> Use Base64url</label>
    <label class="jp-checkline"><input type="checkbox" id="b64-wrap" /> Wrap lines at 76 characters</label>
  </div>

  <div class="jp-field">
    <label for="b64-plain">Text</label>
    <textarea class="jp-textarea" id="b64-plain" spellcheck="false" style="min-height:150px"
      placeholder="Type or paste text here…"></textarea>
  </div>

  <div class="jp-field">
    <label for="b64-encoded">Base64 text</label>
    <textarea class="jp-textarea" id="b64-encoded" spellcheck="false" style="min-height:150px"
      placeholder="Paste Base64 here to decode it…"></textarea>
  </div>

  <div class="jp-toolbar">
    <button class="jp-btn jp-btn--ghost" type="button" data-copy="b64-plain">Copy decoded text</button>
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
      '<div class="jp-stat"><p class="jp-stat-label">Text size</p><p class="jp-stat-value">' + inBytes +
        '</p><p class="jp-stat-sub">bytes (' + text.length + ' characters)</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Base64 length</p><p class="jp-stat-value">' + b64.length +
        '</p><p class="jp-stat-sub">characters</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Size increase</p><p class="jp-stat-value">' +
        (inBytes ? '+' + Math.round((b64.length / inBytes - 1) * 100) + '%' : 'Not available') +
        '</p><p class="jp-stat-sub">compared with UTF-8 bytes</p></div>';
  }

  function encode() {
    var text = plain.value;
    if (!text) { encoded.value = ''; setStatus(''); stats.innerHTML = ''; return; }
    try {
      var out = toBase64(text);
      if (urlsafe.checked) out = out.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
      if (wrap.checked) out = out.replace(/.{76}/g, '$&\\n');
      encoded.value = out;
      setStatus('Encoded ' + new TextEncoder().encode(text).length + ' bytes.', 'ok');
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
      setStatus('Decoded Base64 as UTF-8 text.', 'ok');
      showStats(text, raw);
    } catch (error) {
      setStatus(
        /character|atob/i.test(error.message)
          ? 'This is not valid Base64. Remove stray characters, or select Base64url if the value contains - or _.'
          : 'The decoded bytes are not valid UTF-8 text. The input may contain binary data, such as an image.',
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
    { t: 'h2', x: 'What Base64 does' },
    {
      t: 'p',
      x: 'Base64 represents arbitrary bytes with characters that text-based systems can carry safely: `A–Z`, `a–z`, `0–9`, `+` and `/`, plus `=` for padding. It is used when formats such as email, JSON, URLs and XML need to carry binary data as text.',
    },
    {
      t: 'p',
      x: 'Each three-byte input group becomes four output characters, so **Base64 adds about 33% to the original byte count**. That overhead is one reason large images are usually better served as separate files than embedded as data URIs.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Base64 is not encryption',
      x: 'Base64 provides no confidentiality and requires no key to decode. Do not use it to hide a password, API key or token. Sensitive data needs encryption, not encoding.',
    },

    { t: 'h2', x: 'Base64 and Base64url' },
    {
      t: 'p',
      x: 'Standard Base64 uses `+`, `/` and `=` padding. Those characters can need special handling in URLs. Base64url replaces `+` and `/` with `-` and `_`, and it usually omits the padding.',
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
      x: 'A standard Base64 decoder may reject a JWT segment because Base64url uses `-` and `_`. Select **Use Base64url** for that input. The decoder restores omitted padding automatically.',
    },

    { t: 'h2', x: 'Why Unicode needs an extra step' },
    {
      t: 'p',
      x: 'The browser’s `btoa()` function accepts only Latin-1 characters. Passing an emoji, a Chinese character or a curly apostrophe directly to it throws an error:',
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
      x: 'Convert the text to UTF-8 bytes before encoding it. To decode, reverse those steps and interpret the bytes as UTF-8. This tool follows that process for emoji and accented text:',
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

    { t: 'h2', x: 'Common uses' },
    {
      t: 'ul',
      items: [
        '**HTTP Basic authentication:** the `Authorization: Basic ` header contains `username:password` encoded as Base64. It provides no protection without HTTPS.',
        '**JWTs:** the header and payload are Base64url-encoded JSON. Use the [JWT decoder](/tools/jwt-decoder/) to inspect their claims.',
        '**Data URIs:** `data:image/png;base64,…` embeds a file in HTML or CSS. It avoids a separate request but adds Base64 overhead and prevents separate caching.',
        '**Email attachments:** MIME represents binary attachment data as Base64 text.',
        '**Kubernetes secrets:** values in a Secret manifest are Base64-encoded for transport, not protected. Anyone who can read the manifest can decode them.',
        '**SSH keys and certificates:** the content between the header and footer of a PEM file is Base64-encoded DER.',
      ],
    },

    { t: 'h2', x: 'Using Base64 from the command line' },
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
      x: 'Without `-n`, `echo` appends a newline and encodes it with the text. Use the option when you need the output to match a value created without that trailing newline.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does my Base64 string end with one or two equals signs?',
          a: 'Base64 processes input in three-byte groups. If the final group is short, `=` characters pad its output to four characters. One `=` means the final group contained two input bytes; two `=` characters mean it contained one. Base64url usually omits this padding, and decoders can restore it.',
        },
        {
          q: 'Why does decoding say the result is not valid UTF-8?',
          a: 'The Base64 may represent binary data, such as an image, archive or certificate, rather than text. The bytes can be valid even when they do not form valid UTF-8 characters. This tool displays text only.',
        },
        {
          q: 'Is Base64 secure for storing passwords?',
          a: 'No. Base64 is a reversible encoding with no key. Store password hashes produced by a slow, salted password-hashing algorithm such as bcrypt, scrypt or Argon2. Do not store an encoded password or an encrypted password beside its key.',
        },
        {
          q: 'Does the tool handle large inputs?',
          a: 'The tool loads the full value as text in browser memory. For a large binary file, use the `base64` command-line utility instead.',
        },
        {
          q: 'Is anything I paste uploaded?',
          a: 'No. The page encodes and decodes with the browser’s `TextEncoder`, `btoa` and `atob` APIs. The tool does not send the input to a server.',
        },
      ],
    },
  ],

  related: ['/tools/jwt-decoder/', '/tools/uuid-generator/', '/tools/json-formatter/'],
};
