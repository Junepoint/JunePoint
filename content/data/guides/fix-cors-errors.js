module.exports = {
  slug: 'fix-cors-errors',
  title: 'How to Diagnose and Fix CORS Errors',
  h1: 'How to fix CORS errors',
  eyebrow: 'Troubleshooting',
  schemaType: 'TechArticle',
  description:
    'Use the browser’s CORS error and network trace to identify missing headers, failed preflights, origin mismatches and credential conflicts.',
  standfirst:
    'The browser reports CORS at the point where it blocks access to a response. Read that message alongside the network request, then fix the server, proxy or URL responsible for it.',
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
  cardDesc: 'Match the browser error to a missing header, failed preflight, origin mismatch or credential conflict.',

  blocks: [
    {
      t: 'takeaways',
      items: [
        'The browser enforces CORS, but the server that owns the response grants permission through its headers.',
        'Use the exact error text and the failed network request to narrow the problem before changing configuration.',
        '`Access-Control-Allow-Origin: *` cannot be combined with a credentialed request such as `credentials: "include"`.',
        'For a failed preflight, inspect the `OPTIONS` response and make sure CORS handling runs before authentication.',
        'A browser extension can help confirm a diagnosis locally, but it does not fix the application for anyone else.',
      ],
    },

    { t: 'h2', x: 'What CORS actually is' },
    {
      t: 'p',
      x: 'Browsers enforce the **same-origin policy**. JavaScript on `https://app.example.com` cannot read a response from `https://api.example.com` unless that server permits the origin. An origin consists of the scheme, host and port. That makes `http://localhost:3000` different from `http://localhost:5173`, and `http` different from `https` on the same host.',
    },
    {
      t: 'p',
      x: 'Cross-Origin Resource Sharing is the response-header protocol a server uses to grant that access. Two details explain many otherwise confusing reports:',
    },
    {
      t: 'ol',
      items: [
        '**The server may have completed the request.** The browser can receive a response and then withhold it from JavaScript because the required permission header is missing. That is why the request can appear in server logs while `fetch` still rejects.',
        '**The same-origin policy is a browser constraint.** `curl`, Postman, native mobile clients and server-side code do not apply it. A request working in Postman confirms reachability, not a valid CORS configuration.',
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'CORS is not a security feature protecting your API',
      x: 'CORS protects users from cross-origin reads made through their browser. It does not stop direct requests from non-browser clients. A restrictive CORS policy is therefore not a substitute for authentication and authorization, and a permissive policy does not by itself expose an otherwise public API.',
    },

    { t: 'h2', x: 'Read the error message first' },
    {
      t: 'p',
      x: 'Chrome and Firefox usually name the failed check. Match the relevant phrase to the response before choosing a fix.',
    },
    {
      t: 'table',
      head: ['Error text contains', 'What it means', 'Fix'],
      rows: [
        ['`No "Access-Control-Allow-Origin" header`', 'The server sent no CORS headers at all', 'Enable CORS on the server'],
        ['`does not match the supplied origin` / `The "Access-Control-Allow-Origin" header has a value ... that is not equal`', 'Headers exist but name a different origin', 'Add the exact origin to the allowed list; check for a trailing slash'],
        ['`Response to preflight request doesn\'t pass`', 'The `OPTIONS` request failed or returned an error status', 'Handle `OPTIONS` before auth middleware, return 204'],
        ['`Request header field ... is not allowed`', 'Your custom header is not in `Access-Control-Allow-Headers`', 'Add the header name to that list'],
        ['`Method ... is not allowed`', '`Access-Control-Allow-Methods` omits your verb', 'Add `PUT`, `PATCH` or `DELETE` as needed'],
        ['`credentials mode is "include"` with a wildcard', 'You cannot combine `*` with cookies', 'Echo the specific origin instead of `*`'],
      ],
    },

    { t: 'h2', x: 'Cause 1: no CORS headers at all' },
    {
      t: 'p',
      x: 'Most servers do not send CORS headers until you configure them. At minimum, the response needs an `Access-Control-Allow-Origin` value that permits the requesting origin.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Express middleware manages the response headers
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
      x: `# FastAPI middleware configuration
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
      x: `# Return OPTIONS before proxying the request
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
      x: 'Without `always`, Nginx can omit headers from 4xx and 5xx responses. The browser then reports a CORS failure instead of exposing the useful error status and body, which sends the investigation in the wrong direction.',
    },

    { t: 'h2', x: 'Cause 2: the origin does not match exactly' },
    {
      t: 'p',
      x: 'Origin matching is exact. These values differ in ways that matter to CORS:',
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
      x: 'A trailing slash in an allow-list is easy to overlook. The browser’s `Origin` header has no path or trailing slash, so `https://app.example.com/` does not match `https://app.example.com`.',
    },

    { t: 'h2', x: 'Cause 3: the preflight is failing' },
    {
      t: 'p',
      x: 'Before a request that does not qualify as "simple," the browser sends an `OPTIONS` request for permission. A simple request uses `GET`, `HEAD` or `POST`, has no custom request headers, and limits `Content-Type` to `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`.',
    },
    {
      t: 'p',
      x: 'A JSON request triggers a preflight because `application/json` is not a simple content type. An `Authorization` header does as well, so preflights are routine for authenticated JSON APIs.',
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
      x: 'A cross-origin preflight carries **no credentials** such as cookies or an `Authorization` header. Authentication middleware placed before CORS handling may reject `OPTIONS` with 401, leaving the browser to report a CORS failure. Register the CORS handler before authentication and inspect the preflight response directly.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Set Access-Control-Max-Age',
      x: 'This header lets the browser cache a successful preflight instead of sending `OPTIONS` before each matching call. Chrome caps the value at 7,200 seconds and Firefox at 86,400. For an API that receives frequent non-simple requests, caching can remove a substantial number of round trips.',
    },

    { t: 'h2', x: 'Cause 4: wildcard plus credentials' },
    {
      t: 'p',
      x: 'If a request sends cookies or uses `credentials: "include"`, the server cannot respond with a wildcard origin. The specification requires a specific allowed origin so an arbitrary site cannot make credentialed requests on the user’s behalf.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Browsers reject this combination\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true\n\n// Return the validated origin and vary the cached response\nAccess-Control-Allow-Origin: https://app.example.com\nAccess-Control-Allow-Credentials: true\nVary: Origin`,
    },
    {
      t: 'p',
      x: 'Include `Vary: Origin` when the response origin changes by request. Otherwise a CDN or proxy can reuse a response cached for one origin when serving another, creating failures that depend on cache order.',
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'Do not blindly reflect the Origin header',
      x: 'Returning `req.headers.origin` with `Allow-Credentials: true` and no validation lets any requesting website use the user’s credentials. Compare the incoming origin with an explicit allow-list before returning it.',
    },

    { t: 'h2', x: 'Cause 5: you cannot read the response header you need' },
    {
      t: 'p',
      x: 'Cross-origin JavaScript can read only the CORS-safelisted response headers by default. Expose custom values such as pagination counts, rate-limit state or request IDs explicitly:',
    },
    {
      t: 'code',
      lang: 'http',
      x: `Access-Control-Expose-Headers: X-Total-Count, X-Request-Id, X-RateLimit-Remaining`,
    },
    {
      t: 'p',
      x: 'A missing expose header does not reject the request. The fetch succeeds, but JavaScript receives `null` when it tries to read that response header.',
    },

    { t: 'h2', x: 'Cause 6: it is a redirect, or the server is down' },
    {
      t: 'p',
      x: 'Before changing headers, rule out two failures that browsers may surface alongside CORS messages:',
    },
    {
      t: 'ul',
      items: [
        '**A redirect on a preflight.** Preflight requests may not follow redirects. Calling `http://api.example.com` when the server redirects to `https://` can therefore appear as a CORS failure. Point the front end at the final URL.',
        '**The server is unreachable.** When nothing is listening, there is no response carrying CORS headers. Check the network panel for a `(failed)` status before treating the issue as header configuration.',
      ],
    },

    { t: 'h2', x: 'The local development fix: use a proxy' },
    {
      t: 'p',
      x: 'When you cannot change an API during local development, route the request through the development server. The browser calls same-origin `/api`, and the server-side proxy forwards it to the remote backend.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Vite proxy configuration
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
      x: `// Create React App proxy configuration
{
  "proxy": "http://localhost:8080"
}`,
    },
    {
      t: 'p',
      x: 'The same-origin pattern also works well in production. Serving the front end and an `/api` route behind one CDN or load balancer removes the cross-origin boundary, along with its preflights and third-party-cookie constraints.',
    },

    { t: 'h2', x: 'What not to do' },
    {
      t: 'ul',
      items: [
        '**Do not rely on a "CORS unblock" browser extension.** It changes one browser and can hide the problem until deployment. Keep it to short diagnostic use.',
        '**Do not set `mode: "no-cors"` on fetch.** It does not disable CORS. It gives JavaScript an opaque response with status `0` and an unreadable body.',
        '**Do not route production traffic through a public CORS proxy.** That gives a third party access to each request and response, including tokens.',
        '**Do not treat `Access-Control-Allow-Origin: *` as a general fix for an authenticated API.** It does not work with credentials, and reflecting arbitrary origins would expose credentialed actions.',
      ],
    },

    { t: 'h2', x: 'A five-minute debugging checklist' },
    {
      t: 'ol',
      items: [
        'Open the network panel and select the **failing request**, not only the JavaScript error. A status of `(failed)` or `0` points to reachability rather than a CORS response.',
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
          a: 'Postman does not enforce the browser’s same-origin policy and does not use CORS response headers to decide whether your code may read a response. A successful Postman request confirms that the endpoint is reachable, but it does not validate the browser-facing CORS configuration.',
        },
        {
          q: 'Can I fix CORS from my front-end code?',
          a: 'The permission must come from the server that owns the resource; a client cannot grant itself cross-origin access. You can instead avoid the browser’s cross-origin request by sending it through a same-origin server or proxy you control.',
        },
        {
          q: 'Why do I get a CORS error only on POST and not on GET?',
          a: 'A POST with a JSON body triggers a preflight `OPTIONS` request, while a simple GET does not. Inspect that preflight. Authentication middleware often rejects it before the CORS handler runs because the preflight does not carry credentials.',
        },
        {
          q: 'Is Access-Control-Allow-Origin: * dangerous?',
          a: 'A wildcard can be appropriate for a public, unauthenticated API. It cannot be used with cookies or other credentialed requests. Do not work around that restriction by reflecting arbitrary origins, since doing so would let any site act with a logged-in user’s credentials.',
        },
        {
          q: 'Why does my API work locally but fail in production?',
          a: 'Compare the deployed `Origin` value with the server’s allow-list; production domains are often missing even when localhost is present. Also check the scheme and confirm that a CDN is not reusing origin-specific responses without `Vary: Origin`.',
        },
        {
          q: 'What is a "simple request"?',
          a: 'It is a GET, HEAD or POST with no custom request headers and a Content-Type limited to text/plain, multipart/form-data or application/x-www-form-urlencoded. Simple requests skip preflight. JSON and Authorization headers do not meet those conditions.',
        },
      ],
    },
  ],

  related: ['/guides/http-status-codes-explained/', '/tools/jwt-decoder/', '/guides/javascript-async-await-explained/'],
};
