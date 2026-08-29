module.exports = {
  slug: 'fix-cors-errors',
  title: 'How to Fix CORS Errors (Every Cause, With the Fix)',
  h1: 'How to fix CORS errors',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Every common cause of "blocked by CORS policy", what the error message really means, and the correct server-side fix for each one.',
  standfirst:
    'CORS errors are almost never a bug in your front-end. Here is how to read the exact message, find the real cause, and fix it on the server where it belongs.',
  keywords: [
    'cors error',
    'blocked by cors policy',
    'access-control-allow-origin',
    'fix cors',
    'no access-control-allow-origin header',
    'cors preflight failed',
  ],
  published: '2026-01-16',
  updated: '2026-08-26',
  author: 'jackson',
  featured: true,
  cardDesc: 'Read the exact error, find the real cause, fix it on the server. Includes the wildcard-plus-credentials trap.',

  blocks: [
    {
      t: 'takeaways',
      items: [
        'CORS is enforced by the browser but configured on the **server**. You cannot fix it in your front-end code.',
        'The exact wording of the error tells you which of six causes you have — read it rather than guessing.',
        '`Access-Control-Allow-Origin: *` and `credentials: "include"` are mutually incompatible. This is the single most common dead end.',
        'A failed preflight means your server is not answering the `OPTIONS` request. Handle it before your auth middleware.',
        'Browser extensions that "disable CORS" fix your machine and nobody else’s. Never ship against one.',
      ],
    },

    { t: 'h2', x: 'What CORS actually is' },
    {
      t: 'p',
      x: 'Browsers enforce the **same-origin policy**: JavaScript on `https://app.example.com` cannot read a response from `https://api.example.com` unless that server explicitly permits it. An origin is the triple of scheme, host and port — `http://localhost:3000` and `http://localhost:5173` are different origins, and so are the `http` and `https` versions of the same host.',
    },
    {
      t: 'p',
      x: 'Cross-Origin Resource Sharing is the mechanism a server uses to opt in, by returning headers that tell the browser the request is allowed. Two consequences follow, and internalising both saves hours:',
    },
    {
      t: 'ol',
      items: [
        '**The request usually succeeded.** Your server received it and responded. The browser then read the response, found no permission header, and refused to hand it to your JavaScript. This is why the request appears in your server logs and in the network tab while your code sees an error.',
        '**Only browsers care.** `curl`, Postman, your mobile app and your server-side code have no same-origin policy. "It works in Postman" is not evidence of anything — it is the expected behaviour.',
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'CORS is not a security feature protecting your API',
      x: 'It protects *users* from having their browser weaponised against other sites. It does nothing to stop a direct request from any non-browser client. An open CORS policy does not make your API vulnerable, and a strict one does not make it safe — authentication and authorisation do that.',
    },

    { t: 'h2', x: 'Read the error message first' },
    {
      t: 'p',
      x: 'Chrome and Firefox both tell you precisely which check failed. The table maps each message to its cause.',
    },
    {
      t: 'table',
      head: ['Error text contains', 'What it means', 'Fix'],
      rows: [
        ['`No "Access-Control-Allow-Origin" header`', 'The server sent no CORS headers at all', 'Enable CORS on the server'],
        ['`does not match the supplied origin` / `The "Access-Control-Allow-Origin" header has a value ... that is not equal`', 'Headers exist but name a different origin', 'Add your origin to the allowed list — mind the trailing slash'],
        ['`Response to preflight request doesn\'t pass`', 'The `OPTIONS` request failed or returned an error status', 'Handle `OPTIONS` before auth middleware, return 204'],
        ['`Request header field ... is not allowed`', 'Your custom header is not in `Access-Control-Allow-Headers`', 'Add the header name to that list'],
        ['`Method ... is not allowed`', '`Access-Control-Allow-Methods` omits your verb', 'Add `PUT`, `PATCH` or `DELETE` as needed'],
        ['`credentials mode is "include"` with a wildcard', 'You cannot combine `*` with cookies', 'Echo the specific origin instead of `*`'],
      ],
    },

    { t: 'h2', x: 'Cause 1: no CORS headers at all' },
    {
      t: 'p',
      x: 'The default state of most servers. You need to send `Access-Control-Allow-Origin` on the response.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Express — use the maintained middleware rather than hand-rolling headers
import cors from 'cors';

app.use(cors({
  origin: ['https://app.example.com', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));`,
    },
    {
      t: 'code',
      lang: 'python',
      x: `# FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)`,
    },
    {
      t: 'code',
      lang: 'nginx',
      x: `# Nginx — note that OPTIONS must short-circuit before proxying
location /api/ {
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin  $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        add_header Access-Control-Max-Age       86400;
        return 204;
    }
    add_header Access-Control-Allow-Origin $http_origin always;
    proxy_pass http://backend;
}`,
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'The `always` flag in Nginx matters',
      x: 'Without it, `add_header` is skipped on 4xx and 5xx responses — so your errors arrive as CORS failures instead of the real status code, and you end up debugging the wrong problem entirely.',
    },

    { t: 'h2', x: 'Cause 2: the origin does not match exactly' },
    {
      t: 'p',
      x: 'Origin comparison is a byte-for-byte string match. All of these are different origins:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `https://app.example.com      ← the real origin
https://app.example.com/     ← trailing slash: invalid in this header
http://app.example.com       ← different scheme
https://www.app.example.com  ← different host
https://app.example.com:8443 ← different port`,
    },
    {
      t: 'p',
      x: 'A trailing slash in your allow-list is the classic version of this. The `Origin` header a browser sends never has a path or a trailing slash, so `https://app.example.com/` will never match.',
    },

    { t: 'h2', x: 'Cause 3: the preflight is failing' },
    {
      t: 'p',
      x: 'Before any request that is not "simple", the browser sends an `OPTIONS` request to ask permission. A request is simple only if it is `GET`, `HEAD` or `POST`, carries no custom headers, and uses a `Content-Type` of `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`.',
    },
    {
      t: 'p',
      x: 'That means **sending JSON always triggers a preflight**, because `application/json` is not on the list. So does an `Authorization` header. Almost every real API call is preflighted.',
    },
    {
      t: 'code',
      lang: 'http',
      x: `OPTIONS /api/orders HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400`,
    },
    {
      t: 'p',
      x: 'The preflight carries **no credentials** — no cookies, no `Authorization` header. If your authentication middleware runs before your CORS handling, it will reject the `OPTIONS` request with a 401, and the browser reports a CORS failure. **Register CORS handling before auth.** This is the most common cause of "it works for GET but not POST".',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Set Access-Control-Max-Age',
      x: 'It caches the preflight result so the browser stops sending an OPTIONS request before every call. Chrome caps it at 7,200 seconds, Firefox at 86,400. On a chatty front-end this halves your request count.',
    },

    { t: 'h2', x: 'Cause 4: wildcard plus credentials' },
    {
      t: 'p',
      x: 'This is the one that consumes an afternoon. If your request sends cookies or uses `credentials: "include"`, the browser **refuses a wildcard**. The specification forbids it, because `*` plus cookies would let any site make authenticated requests on a user’s behalf.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Fails — the browser rejects the combination outright
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true

// ✓ Works — echo the specific origin, and vary on it
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin`,
    },
    {
      t: 'p',
      x: 'The `Vary: Origin` header is not optional. Without it, a CDN or proxy will cache the response for one origin and serve it to another, producing failures that appear and disappear seemingly at random.',
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'Do not blindly reflect the Origin header',
      x: 'Echoing `req.headers.origin` back with `Allow-Credentials: true` and no validation means **every website on the internet** can make authenticated requests as your logged-in users. Always check the incoming origin against an explicit allow-list first.',
    },

    { t: 'h2', x: 'Cause 5: you cannot read the response header you need' },
    {
      t: 'p',
      x: 'By default, cross-origin JavaScript can only read six response headers. If your API returns pagination counts, a rate-limit budget or a custom request ID, your code will see `null` unless the server exposes them explicitly:',
    },
    {
      t: 'code',
      lang: 'http',
      x: `Access-Control-Expose-Headers: X-Total-Count, X-Request-Id, X-RateLimit-Remaining`,
    },
    {
      t: 'p',
      x: 'This produces no error at all, which makes it unusually confusing — the fetch succeeds and the header is simply invisible.',
    },

    { t: 'h2', x: 'Cause 6: it is a redirect, or the server is down' },
    {
      t: 'p',
      x: 'Two impostors that report as CORS errors but are not:',
    },
    {
      t: 'ul',
      items: [
        '**A redirect on a preflight.** Preflight requests may not follow redirects. Calling `http://api.example.com` when the server redirects to `https://` fails as a CORS error. Point the front-end at the final URL.',
        '**The server is unreachable.** If nothing is listening, there are no headers to find, and Chrome reports the missing `Access-Control-Allow-Origin` rather than the connection failure. Check the network tab for a `(failed)` status before debugging CORS at all.',
      ],
    },

    { t: 'h2', x: 'The local development fix: use a proxy' },
    {
      t: 'p',
      x: 'When you cannot change the API server, stop making a cross-origin request. Your dev server proxies `/api` to the backend, so from the browser’s perspective everything is same-origin and CORS never applies.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\\/api/, ''),
      },
    },
  },
};`,
    },
    {
      t: 'code',
      lang: 'json',
      x: `// Create React App — add to package.json
{
  "proxy": "http://localhost:8080"
}`,
    },
    {
      t: 'p',
      x: 'This is also the correct production pattern. Serving your front-end and API from the same origin — the API under `/api` behind one CDN or load balancer — eliminates CORS, removes the preflight round-trip entirely, and sidesteps every third-party-cookie problem browsers keep introducing.',
    },

    { t: 'h2', x: 'What not to do' },
    {
      t: 'ul',
      items: [
        '**Do not use a "CORS unblock" browser extension** beyond a one-off diagnostic. It changes your browser and nobody else’s, and it hides the problem until you deploy.',
        '**Do not set `mode: "no-cors"` on fetch.** It does not disable CORS. It returns an opaque response whose status is `0` and whose body you cannot read — usually the least useful outcome available.',
        '**Do not route production traffic through a public CORS proxy.** You are handing a third party every request and response, including tokens.',
        '**Do not set `Access-Control-Allow-Origin: *` on an authenticated API** and consider it solved. It will not work with credentials, and where it does work it is a genuine exposure.',
      ],
    },

    { t: 'h2', x: 'A five-minute debugging checklist' },
    {
      t: 'ol',
      items: [
        'Open the network tab and select the **failing request itself**, not your JavaScript error. Check the status code — if it is `(failed)` or `0`, the server is unreachable and this is not CORS.',
        'Look for a preceding `OPTIONS` request. If it returned 401, 403, 404 or 500, that is your problem: CORS handling is not running before auth or routing.',
        'Compare the `Origin` request header with the `Access-Control-Allow-Origin` response header, character by character. Watch for the trailing slash.',
        'If cookies are involved, confirm the response is **not** using `*` and that `Access-Control-Allow-Credentials: true` is present.',
        'Reproduce with curl to confirm the server side is fine: `curl -H "Origin: https://app.example.com" -I https://api.example.com/endpoint`.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does it work in Postman but not in the browser?',
          a: 'Because Postman is not a browser and does not implement the same-origin policy. It sends no Origin header and ignores CORS response headers entirely. This tells you the server works; it tells you nothing about your CORS configuration.',
        },
        {
          q: 'Can I fix CORS from my front-end code?',
          a: 'No. The permission has to come from the server that owns the resource — if a client could grant itself access, the policy would be meaningless. The only client-side option is to avoid the cross-origin request entirely by proxying through your own server.',
        },
        {
          q: 'Why do I get a CORS error only on POST and not on GET?',
          a: 'POST with a JSON body triggers a preflight OPTIONS request; a simple GET does not. Your server is almost certainly not handling OPTIONS — commonly because authentication middleware rejects it before the CORS handler runs, since preflights carry no credentials.',
        },
        {
          q: 'Is Access-Control-Allow-Origin: * dangerous?',
          a: 'On a public, unauthenticated API, no — it is the appropriate setting. On an API that uses cookies or session credentials it is both dangerous and non-functional: browsers refuse the combination, and reflecting arbitrary origins with credentials enabled lets any site act as your logged-in users.',
        },
        {
          q: 'Why does my API work locally but fail in production?',
          a: 'The deployed origin is not in the server’s allow-list — localhost was, and the production domain was never added. Also check for scheme mismatches (http vs https) and for a CDN stripping CORS headers because Vary: Origin is missing.',
        },
        {
          q: 'What is a "simple request"?',
          a: 'GET, HEAD or POST, with no custom headers, and a Content-Type of text/plain, multipart/form-data or application/x-www-form-urlencoded. Only simple requests skip the preflight. Sending JSON or an Authorization header disqualifies it, which covers nearly every real API call.',
        },
      ],
    },
  ],

  related: ['/guides/http-status-codes-explained/', '/tools/jwt-decoder/', '/guides/javascript-async-await-explained/'],
};
