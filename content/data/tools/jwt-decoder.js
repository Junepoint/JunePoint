module.exports = {
  slug: 'jwt-decoder',
  title: 'JWT Decoder for Claims and Expiry',
  h1: 'JWT Decoder',
  eyebrow: 'Developer tool',
  description:
    'Decode a JSON Web Token in your browser to inspect its header, payload, registered claims and expiry time.',
  standfirst:
    'Paste a JWT to read its claims and validity window. The decoder runs locally and does not verify the signature.',
  keywords: ['jwt decoder', 'decode jwt token', 'jwt debugger', 'json web token decoder', 'jwt expiry check'],
  published: '2026-03-04',
  updated: '2026-08-20',
  author: 'jackson',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-field">
    <label for="jd-input">JSON Web Token</label>
    <textarea class="jp-textarea" id="jd-input" spellcheck="false" autocapitalize="off" autocorrect="off"
      style="min-height:120px" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.signature"></textarea>
    <span class="jp-hint">Decoding happens locally. Avoid entering a live production token into any web page.</span>
  </div>
  <div class="jp-toolbar">
    <button class="jp-btn jp-btn--ghost" type="button" id="jd-sample">Load sample token</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jd-clear">Clear</button>
  </div>

  <p class="jp-status" id="jd-status" role="status" aria-live="polite">&nbsp;</p>
  <div class="jp-results" id="jd-summary"></div>

  <div id="jd-panels" hidden>
    <h2 class="jp-tool-h" style="margin-top:1.5rem">Decoded header</h2>
    <pre class="jp-out" id="jd-header"></pre>
    <h2 class="jp-tool-h" style="margin-top:1.25rem">Decoded payload</h2>
    <pre class="jp-out" id="jd-payload"></pre>
    <h2 class="jp-tool-h" style="margin-top:1.25rem">Registered claims</h2>
    <dl class="jp-kv" id="jd-claims"></dl>
    <h2 class="jp-tool-h" style="margin-top:1.25rem">Encoded signature</h2>
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
      setStatus('A JWT needs three dot-separated segments. This value has ' + parts.length + '.', 'err');
      panels.hidden = true; summary.innerHTML = '';
      return;
    }

    var header, payload;
    try {
      header = JSON.parse(b64urlDecode(parts[0]));
      payload = JSON.parse(b64urlDecode(parts[1]));
    } catch (error) {
      setStatus('Could not decode the token: ' + error.message, 'err');
      panels.hidden = true; summary.innerHTML = '';
      return;
    }

    panels.hidden = false;
    document.getElementById('jd-header').textContent = JSON.stringify(header, null, 2);
    document.getElementById('jd-payload').textContent = JSON.stringify(payload, null, 2);
    document.getElementById('jd-signature').textContent = parts[2] || 'No signature data';

    var now = Math.floor(Date.now() / 1000);
    var expired = typeof payload.exp === 'number' && payload.exp < now;
    var notYet = typeof payload.nbf === 'number' && payload.nbf > now;

    setStatus('Token decoded. The signature has not been verified.', 'ok');

    var lifetime = (typeof payload.exp === 'number' && typeof payload.iat === 'number')
      ? Math.round((payload.exp - payload.iat) / 60) + ' min'
      : 'Not available';

    summary.innerHTML =
      '<div class="jp-stat' + (expired ? '' : ' jp-stat--primary') + '">' +
        '<p class="jp-stat-label">Status</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        (expired ? 'Expired' : notYet ? 'Not yet valid' : 'Within validity window') + '</p>' +
        '<p class="jp-stat-sub">' + (typeof payload.exp === 'number' ? relative(payload.exp) : 'No exp claim') + '</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Algorithm</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        (header.alg || 'Not available') + '</p><p class="jp-stat-sub">' + (header.kid ? 'kid: ' + header.kid : 'No kid claim') + '</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Lifetime</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        lifetime + '</p><p class="jp-stat-sub">From iat to exp</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Claims</p><p class="jp-stat-value" style="font-size:1.2rem">' +
        Object.keys(payload).length + '</p><p class="jp-stat-sub">Payload properties</p></div>';

    var claims = document.getElementById('jd-claims');
    claims.innerHTML = Object.keys(CLAIM_NAMES).filter(function (key) {
      return payload[key] !== undefined;
    }).map(function (key) {
      var value = payload[key];
      var display = (key === 'exp' || key === 'iat' || key === 'nbf') && typeof value === 'number'
        ? timestamp(value)
        : (Array.isArray(value) ? value.join(', ') : String(value));
      var flag = '';
      if (key === 'exp' && expired) flag = ' <span class="jp-badge jp-badge--fail">Expired</span>';
      if (key === 'nbf' && notYet) flag = ' <span class="jp-badge jp-badge--fail">Not active yet</span>';
      return '<dt>' + CLAIM_NAMES[key] + ' (' + key + ')</dt><dd>' + display + flag + '</dd>';
    }).join('') || '<dt>Status</dt><dd>No registered claims found.</dd>';

    if (header.alg === 'none') {
      setStatus('Warning: alg is "none". This token is unsigned and must not be trusted.', 'err');
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
      x: 'This tool reads the token but does **not** check its signature. Verification requires the expected public key or secret, which should not be pasted into a web page. Decoding shows the issuer’s claims; server-side signature verification determines whether the token can be trusted.',
    },

    { t: 'h2', x: 'How a JWT is structured' },
    {
      t: 'p',
      x: 'A JSON Web Token has three Base64url-encoded segments separated by dots: `header.payload.signature`. The header and payload contain JSON with Base64 padding omitted. Anyone who has the token can decode those two segments without a key.',
    },
    {
      t: 'p',
      x: '**A signed JWT is not encrypted.** Base64url encoding does not hide the payload. A client or logging system that receives the token can read any user IDs, email addresses, roles or other data stored in it.',
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

    { t: 'h2', x: 'Registered claims' },
    {
      t: 'table',
      head: ['Claim', 'Name', 'What it does'],
      rows: [
        ['`iss`', 'Issuer', 'Identifies who issued the token. Reject values your API does not trust.'],
        ['`sub`', 'Subject', 'Identifies the token’s subject, often with a stable opaque user ID.'],
        ['`aud`', 'Audience', 'Identifies the intended recipient. Validate it to prevent use against a different service.'],
        ['`exp`', 'Expiry', 'Gives the Unix time after which the token must be rejected.'],
        ['`nbf`', 'Not before', 'Gives the Unix time before which the token is not valid.'],
        ['`iat`', 'Issued at', 'Records when the token was issued and helps identify unexpectedly old tokens.'],
        ['`jti`', 'Token ID', 'Provides a unique identifier that can be used in a revocation list.'],
      ],
      caption: 'JWT timestamps use seconds since the Unix epoch, not milliseconds. Using milliseconds shifts the date by a factor of 1,000.',
    },

    { t: 'h2', x: 'Checking a token after a 401 response' },
    {
      t: 'p',
      x: 'Use the decoded header and payload to check these common causes of token rejection.',
    },
    {
      t: 'ol',
      items: [
        '**Expired token.** Check `exp` and the status panel. Allow for clock differences between the issuer and verifier; many libraries support a small tolerance such as 30–60 seconds.',
        '**Wrong audience.** Compare `aud` with the audience configured by the receiving service, especially when services share an identity provider.',
        '**Wrong issuer.** Compare `iss` with the expected issuer for the environment. A staging token should not be accepted by production.',
        '**Missing scopes or roles.** Inspect `scope`, `permissions` and custom role claims. A 403 often means authentication succeeded but the token lacks permission.',
        '**Wrong signing key.** Confirm that the `kid` in the header identifies a key the server currently has, including after key rotation.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Bearer prefixes are accepted',
      x: 'You can paste a value beginning with `Bearer `. The decoder removes that prefix before splitting the token.',
    },

    { t: 'h2', x: 'Security checks' },

    { t: 'h3', x: 'Never accept `alg: none`' },
    {
      t: 'p',
      x: 'The JWT specification defines an unsigned mode. If a verifier accepts the algorithm named by the token instead of enforcing its own configuration, it may accept `alg: none` with no signature. Configure the expected algorithm on the server. The decoder flags `none` as a warning.',
    },

    { t: 'h3', x: 'The RS256-to-HS256 confusion attack' },
    {
      t: 'p',
      x: 'A verifier that trusts the header’s algorithm can confuse asymmetric and symmetric verification. An attacker can change `RS256` to `HS256` and use the public RSA key as an HMAC secret. Prevent this by configuring the permitted algorithm independently of the token.',
    },

    { t: 'h3', x: 'Keep lifetimes short' },
    {
      t: 'p',
      x: 'A stateless access token usually remains usable until it expires unless the system adds a revocation check. Keep access-token lifetimes short and use a refresh-token flow for longer sessions. A stolen token can otherwise remain valid for its full lifetime.',
    },

    { t: 'h3', x: 'Storage' },
    {
      t: 'p',
      x: 'JavaScript running on the page can read a token in `localStorage`, so an XSS vulnerability can expose it. JavaScript cannot read an `HttpOnly`, `Secure`, `SameSite=Strict` cookie, but cookie-based authentication still needs appropriate CSRF protection. Choose storage based on both risks.',
    },

    { t: 'h2', x: 'Verifying a JWT on the server' },
    {
      t: 'p',
      x: 'Applications must verify tokens in code. This Node example uses the `jose` library:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `import { jwtVerify, createRemoteJWKSet } from 'jose';

const jwks = createRemoteJWKSet(new URL('https://auth.example.com/.well-known/jwks.json'));

const { payload } = await jwtVerify(token, jwks, {
  issuer: 'https://auth.example.com',   // pin the issuer
  audience: 'api.example.com',          // pin the audience
  algorithms: ['RS256'],                // pin the algorithm; do not trust the header
  clockTolerance: 30,                   // seconds of allowed skew
});`,
    },
    {
      t: 'p',
      x: 'Each constraint is part of verification. The `algorithms` option prevents algorithm confusion, while `issuer` and `audience` reject tokens created for a different authority or service.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is my token sent to your server?',
          a: 'No. Decoding uses the browser’s `atob` and `TextDecoder` APIs, and this tool does not send the token to a server. A live production token is still a credential, so use an expired or test token when possible.',
        },
        {
          q: 'Why can I read the payload without a key?',
          a: 'Base64url is an encoding, not encryption. A valid signature can prove that the signed content was not altered, but it does not hide that content. Do not put secrets in a signed JWT; use JWE when encrypted token content is required.',
        },
        {
          q: 'Can this tool verify the signature?',
          a: 'No. Verification requires the expected signing secret or public key. Keep that material in your application and verify the token on the server with a maintained library.',
        },
        {
          q: 'My token looks valid but the API still returns 401. What now?',
          a: 'Compare `aud` and `iss` with the service configuration, confirm that `kid` matches a current verification key, and compare the issuer and server clocks. A clock difference can make `nbf` or `exp` fail even when the token appears current on your machine.',
        },
        {
          q: 'What is the difference between a JWT and a session cookie?',
          a: 'A session cookie can point to server-side state that you revoke by deleting the session. A self-contained JWT can be checked without a session lookup, but early revocation requires a denylist or another server-side check. Short access-token lifetimes limit that tradeoff.',
        },
      ],
    },
  ],

  related: ['/tools/base64-encoder-decoder/', '/tools/json-formatter/', '/guides/fix-cors-errors/'],
};
