module.exports = {
  slug: 'jwt-decoder',
  title: 'JWT Decoder — Inspect Token Claims Offline',
  h1: 'JWT Decoder',
  eyebrow: 'Developer tool',
  description:
    'Decode a JSON Web Token to read its header and claims, with expiry shown in plain English. Runs entirely in your browser — the token is never transmitted.',
  standfirst:
    'Paste a JWT to read its header and payload, see exactly when it expires, and check the claims an API is rejecting. Nothing leaves your browser.',
  keywords: ['jwt decoder', 'decode jwt token', 'jwt debugger', 'json web token decoder', 'jwt expiry check'],
  published: '2026-03-04',
  updated: '2026-08-20',
  author: 'jackson',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-field">
    <label for="jd-input">Paste a JSON Web Token</label>
    <textarea class="jp-textarea" id="jd-input" spellcheck="false" autocapitalize="off" autocorrect="off"
      style="min-height:120px" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.signature"></textarea>
    <span class="jp-hint">Tokens are decoded locally. Even so, avoid pasting live production tokens into any web page.</span>
  </div>
  <div class="jp-toolbar">
    <button class="jp-btn jp-btn--ghost" type="button" id="jd-sample">Load sample</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jd-clear">Clear</button>
  </div>

  <p class="jp-status" id="jd-status" role="status" aria-live="polite">&nbsp;</p>
  <div class="jp-results" id="jd-summary"></div>

  <div id="jd-panels" hidden>
    <h2 class="jp-tool-h" style="margin-top:1.5rem">Header</h2>
    <pre class="jp-out" id="jd-header"></pre>
    <h2 class="jp-tool-h" style="margin-top:1.25rem">Payload</h2>
    <pre class="jp-out" id="jd-payload"></pre>
    <h2 class="jp-tool-h" style="margin-top:1.25rem">Registered claims</h2>
    <dl class="jp-kv" id="jd-claims"></dl>
    <h2 class="jp-tool-h" style="margin-top:1.25rem">Signature</h2>
    <pre class="jp-out" id="jd-signature"></pre>
  </div>
</div>`,

    js: `
(function () {
  var input = document.getElementById('jd-input');
  var status = document.getElementById('jd-status');
  var panels = document.getElementById('jd-panels');
  var summary = document.getElementById('jd-summary');

  var SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InByb2Qta2V5LTIifQ.' +
    'eyJzdWIiOiJ1c2VyXzk5ODIiLCJuYW1lIjoiQXZlcnkgTGluIiwicm9sZXMiOlsiYWRtaW4iLCJiaWxsaW5nIl0sImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6ImFwaS5leGFtcGxlLmNvbSIsImlhdCI6MTc2NzIyNTYwMCwiZXhwIjoxNzY3MjI5MjAwfQ.' +
    'not-a-real-signature';

  var CLAIM_NAMES = {
    iss: 'Issuer', sub: 'Subject', aud: 'Audience', exp: 'Expires at',
    nbf: 'Not valid before', iat: 'Issued at', jti: 'Token ID'
  };

  function b64urlDecode(segment) {
    var padded = segment.replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    var binary = atob(padded);
    // Recover UTF-8 so non-ASCII names and scopes display correctly.
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function setStatus(message, kind) {
    status.textContent = message || '\\u00a0';
    status.className = 'jp-status' + (kind ? ' jp-status--' + kind : '');
  }

  function relative(seconds) {
    var delta = seconds * 1000 - Date.now();
    var abs = Math.abs(delta);
    var units = [['day', 86400000], ['hour', 3600000], ['minute', 60000], ['second', 1000]];
    for (var i = 0; i < units.length; i++) {
      if (abs >= units[i][1] || i === units.length - 1) {
        var n = Math.round(abs / units[i][1]);
        var label = n + ' ' + units[i][0] + (n === 1 ? '' : 's');
        return delta < 0 ? label + ' ago' : 'in ' + label;
      }
    }
  }

  function timestamp(seconds) {
    return new Date(seconds * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC') +
      '  (' + relative(seconds) + ')';
  }

  function render() {
    var raw = input.value.trim().replace(/^Bearer\\s+/i, '');
    if (!raw) { setStatus(''); panels.hidden = true; summary.innerHTML = ''; return; }

    var parts = raw.split('.');
    if (parts.length !== 3) {
      setStatus('Not a JWT — expected three dot-separated segments, found ' + parts.length + '.', 'err');
      panels.hidden = true; summary.innerHTML = '';
      return;
    }

    var header, payload;
    try {
      header = JSON.parse(b64urlDecode(parts[0]));
      payload = JSON.parse(b64urlDecode(parts[1]));
    } catch (error) {
      setStatus('Could not decode: ' + error.message, 'err');
      panels.hidden = true; summary.innerHTML = '';
      return;
    }

    panels.hidden = false;
    document.getElementById('jd-header').textContent = JSON.stringify(header, null, 2);
    document.getElementById('jd-payload').textContent = JSON.stringify(payload, null, 2);
    document.getElementById('jd-signature').textContent = parts[2] || '(none)';

    var now = Math.floor(Date.now() / 1000);
    var expired = typeof payload.exp === 'number' && payload.exp < now;
    var notYet = typeof payload.nbf === 'number' && payload.nbf > now;

    setStatus('Decoded — signature not verified (see below)', 'ok');

    var lifetime = (typeof payload.exp === 'number' && typeof payload.iat === 'number')
      ? Math.round((payload.exp - payload.iat) / 60) + ' min'
      : '—';

    summary.innerHTML =
      '<div class="jp-stat' + (expired ? '' : ' jp-stat--primary') + '">' +
        '<p class="jp-stat-label">Status</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        (expired ? 'Expired' : notYet ? 'Not yet valid' : 'Within validity window') + '</p>' +
        '<p class="jp-stat-sub">' + (typeof payload.exp === 'number' ? relative(payload.exp) : 'no exp claim') + '</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Algorithm</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        (header.alg || '—') + '</p><p class="jp-stat-sub">' + (header.kid ? 'kid: ' + header.kid : 'no key id') + '</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Lifetime</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        lifetime + '</p><p class="jp-stat-sub">iat to exp</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Claims</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        Object.keys(payload).length + '</p><p class="jp-stat-sub">in the payload</p></div>';

    var claims = document.getElementById('jd-claims');
    claims.innerHTML = Object.keys(CLAIM_NAMES).filter(function (key) {
      return payload[key] !== undefined;
    }).map(function (key) {
      var value = payload[key];
      var display = (key === 'exp' || key === 'iat' || key === 'nbf') && typeof value === 'number'
        ? timestamp(value)
        : (Array.isArray(value) ? value.join(', ') : String(value));
      var flag = '';
      if (key === 'exp' && expired) flag = ' <span class="jp-badge jp-badge--fail">EXPIRED</span>';
      if (key === 'nbf' && notYet) flag = ' <span class="jp-badge jp-badge--fail">TOO EARLY</span>';
      return '<dt>' + CLAIM_NAMES[key] + ' (' + key + ')</dt><dd>' + display + flag + '</dd>';
    }).join('') || '<dt>—</dt><dd>No registered claims present</dd>';

    if (header.alg === 'none') {
      setStatus('Warning: alg is "none" — this token is unsigned and must never be trusted.', 'err');
    }
  }

  input.addEventListener('input', render);
  document.getElementById('jd-sample').addEventListener('click', function () { input.value = SAMPLE; render(); });
  document.getElementById('jd-clear').addEventListener('click', function () { input.value = ''; render(); input.focus(); });
})();`,
  },

  blocks: [
    {
      t: 'note',
      kind: 'warn',
      title: 'Decoding is not verifying',
      x: 'This tool reads a token. It does **not** check the signature, because doing so requires the secret or public key — and you should never paste either into a web page. A decoded token tells you what the issuer claims; only signature verification on your server tells you whether to believe it.',
    },

    { t: 'h2', x: 'What a JWT actually is' },
    {
      t: 'p',
      x: 'A JSON Web Token is three Base64url-encoded segments joined by dots: `header.payload.signature`. The first two are plain JSON with the padding stripped — anyone holding the token can read them, no key required.',
    },
    {
      t: 'p',
      x: 'That last point is the one that trips people up most often. **A JWT is signed, not encrypted.** Encoding is not obfuscation. If you put an internal user ID, an email address or a permissions matrix in a payload, every client holding that token can read all of it, and so can anything that logs the token.',
    },
    {
      t: 'code',
      lang: 'text',
      x: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← header  { "alg": "HS256", "typ": "JWT" }
.
eyJzdWIiOiJ1c2VyXzk5ODIiLCJleHAiOjE3Njd9  ← payload { "sub": "user_9982", "exp": ... }
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQ    ← signature over the first two segments`,
    },

    { t: 'h2', x: 'The registered claims and what they are for' },
    {
      t: 'table',
      head: ['Claim', 'Name', 'What it does'],
      rows: [
        ['`iss`', 'Issuer', 'Who minted the token. Your API should reject anything from an unexpected issuer.'],
        ['`sub`', 'Subject', 'Who the token is about — usually a stable, opaque user ID.'],
        ['`aud`', 'Audience', 'Who the token is *for*. Checking it stops a token minted for one service being replayed against another.'],
        ['`exp`', 'Expiry', 'Unix seconds after which the token must be rejected. Not optional in practice.'],
        ['`nbf`', 'Not before', 'Unix seconds before which the token is not yet valid.'],
        ['`iat`', 'Issued at', 'When it was minted. Useful for detecting suspiciously old tokens.'],
        ['`jti`', 'Token ID', 'A unique identifier, which lets you build a revocation list.'],
      ],
      caption: 'All timestamps are seconds since the Unix epoch — not milliseconds. That off-by-1000 is a classic bug.',
    },

    { t: 'h2', x: 'Debugging a 401 with this tool' },
    {
      t: 'p',
      x: 'When an API rejects a token, the cause is almost always one of five things, and the decoder tells you which within seconds.',
    },
    {
      t: 'ol',
      items: [
        '**It expired.** Check the status panel. Clock skew between your machine and the server can also expire a token that looks live to you — most libraries allow a 30–60 second leeway for exactly this reason.',
        '**Wrong audience.** The `aud` claim does not match what the receiving service expects. Extremely common when several services share one identity provider.',
        '**Wrong issuer.** A staging token sent at a production API, or vice versa. Compare `iss` against the environment you are calling.',
        '**Missing scopes or roles.** Look at the payload for `scope`, `permissions` or a custom roles claim. A 403 rather than a 401 usually means the token was valid but under-privileged.',
        '**Signed with the wrong key.** If `kid` in the header points at a key the server does not have — after a rotation, say — verification fails even though everything else looks perfect.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Bearer prefixes are handled',
      x: 'You can paste the whole `Authorization: Bearer eyJ…` value straight from your network tab. The tool strips the prefix for you.',
    },

    { t: 'h2', x: 'Security notes worth internalising' },

    { t: 'h3', x: 'Never accept `alg: none`' },
    {
      t: 'p',
      x: 'The JWT specification includes an unsigned mode. A verifier that reads the algorithm out of the *token* rather than from its own configuration can be handed a token with `alg` set to `none` and no signature — and some early libraries accepted it. Always pin the expected algorithm server-side. This tool flags `none` in red for that reason.',
    },

    { t: 'h3', x: 'The RS256-to-HS256 confusion attack' },
    {
      t: 'p',
      x: 'If a server verifies with whatever algorithm the header names, an attacker can take your *public* RSA key, switch `alg` to `HS256`, and sign a forged token using that public key as the HMAC secret. The server then verifies it successfully. The fix is the same: never let the token choose the algorithm.',
    },

    { t: 'h3', x: 'Keep lifetimes short' },
    {
      t: 'p',
      x: 'Because a stateless JWT cannot be revoked before it expires, its lifetime is the window an attacker gets with a stolen token. Access tokens should live minutes, not days, with a refresh token doing the long-lived work. A 30-day access token is a 30-day breach.',
    },

    { t: 'h3', x: 'Storage' },
    {
      t: 'p',
      x: 'A token in `localStorage` is readable by any JavaScript that runs on your page, which makes any XSS bug a total account compromise. An `HttpOnly`, `Secure`, `SameSite=Strict` cookie is not reachable from JavaScript at all. The cookie approach requires CSRF protection; the `localStorage` approach requires XSS to never happen. Choose accordingly.',
    },

    { t: 'h2', x: 'Verifying properly, server-side' },
    {
      t: 'p',
      x: 'Decoding is for humans; verification is for code. In Node, with the `jose` library:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `import { jwtVerify, createRemoteJWKSet } from 'jose';

const jwks = createRemoteJWKSet(new URL('https://auth.example.com/.well-known/jwks.json'));

const { payload } = await jwtVerify(token, jwks, {
  issuer: 'https://auth.example.com',   // pin the issuer
  audience: 'api.example.com',          // pin the audience
  algorithms: ['RS256'],                // pin the algorithm — do not trust the header
  clockTolerance: 30,                   // seconds of allowed skew
});`,
    },
    {
      t: 'p',
      x: 'Every one of those options matters. Omit `algorithms` and you are open to the confusion attack above; omit `audience` and a token for another service will sail through.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is my token sent to your server?',
          a: 'No. Decoding happens in your browser using the built-in atob and TextDecoder APIs. There is no network request and no server component. That said, treat any live production token as a credential — the safest habit is to use expired or test tokens when debugging in any web tool, including this one.',
        },
        {
          q: 'Why can I read the payload without a key?',
          a: 'Because JWTs are signed, not encrypted. Base64url is an encoding, not a cipher. The signature guarantees the contents have not been altered; it does nothing to hide them. If you need confidentiality, you want JWE — or, far more simply, do not put secrets in tokens.',
        },
        {
          q: 'Can this tool verify the signature?',
          a: 'Deliberately not. Verification needs the signing secret or public key, and asking you to paste a signing key into a web page would be irresponsible regardless of where the code runs. Verify on your server with a maintained library.',
        },
        {
          q: 'My token looks valid but the API still returns 401. What now?',
          a: 'Check the audience and issuer claims against what that specific service expects, confirm the kid in the header matches a key the server currently holds, and check for clock skew — a server running two minutes fast will reject a freshly minted token that looks perfectly valid on your machine.',
        },
        {
          q: 'What is the difference between a JWT and a session cookie?',
          a: 'A session cookie is a pointer to state your server holds, so you can revoke it instantly by deleting that state. A JWT carries the state itself, so it needs no lookup — and cannot be revoked before it expires without reintroducing exactly the server-side store it was meant to remove. Short lifetimes are the standard compromise.',
        },
      ],
    },
  ],

  related: ['/tools/base64-encoder-decoder/', '/tools/json-formatter/', '/guides/fix-cors-errors/'],
};
