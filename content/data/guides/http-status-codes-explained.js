module.exports = {
  slug: 'http-status-codes-explained',
  title: 'HTTP Status Codes Explained (And Which to Actually Use)',
  h1: 'HTTP status codes, and which to actually use',
  eyebrow: 'Web fundamentals',
  schemaType: 'TechArticle',
  description:
    'A working reference to HTTP status codes: what each class means, the dozen you will really use, and the ones API developers routinely get wrong.',
  standfirst:
    'There are 60-odd status codes and you need about a dozen. Here they are, plus the distinctions that matter — 401 vs 403, 301 vs 308, 400 vs 422.',
  keywords: [
    'http status codes',
    '401 vs 403',
    '301 vs 302 redirect',
    'http 422 vs 400',
    'rest api status codes',
  ],
  published: '2026-06-25',
  updated: '2026-08-08',
  author: 'jackson',
  cardDesc: '401 vs 403, 301 vs 308, 400 vs 422 — the distinctions that matter, and the codes worth using.',

  blocks: [
    { t: 'h2', x: 'The five classes' },
    {
      t: 'table',
      head: ['Class', 'Meaning', 'Who should fix it'],
      rows: [
        ['`1xx`', 'Informational — request received, still processing', 'Nobody; rarely seen'],
        ['`2xx`', 'Success', 'Nobody'],
        ['`3xx`', 'Redirection — go somewhere else', 'Nobody, if configured correctly'],
        ['`4xx`', 'Client error — the request was wrong', 'The caller'],
        ['`5xx`', 'Server error — the request was fine, the server failed', 'You'],
      ],
    },
    {
      t: 'p',
      x: 'That last distinction is the one that matters operationally. **4xx means the client sent something invalid; 5xx means you broke.** Returning 500 for a validation failure sends your error rate through the roof and pages someone at 3am for a user who typed a bad email address.',
    },

    { t: 'h2', x: 'The dozen you will actually use' },
    {
      t: 'table',
      head: ['Code', 'Name', 'When'],
      rows: [
        ['`200`', 'OK', 'Successful GET, PUT or PATCH with a body'],
        ['`201`', 'Created', 'POST created a resource — include a `Location` header'],
        ['`204`', 'No Content', 'Success with nothing to return — DELETE, or a PUT you do not echo'],
        ['`301`', 'Moved Permanently', 'The URL has changed for good'],
        ['`302`', 'Found', 'Temporary redirect — but see 307 below'],
        ['`304`', 'Not Modified', 'The cached copy is still good'],
        ['`400`', 'Bad Request', 'Malformed request the server cannot parse'],
        ['`401`', 'Unauthorized', 'Not authenticated — who are you?'],
        ['`403`', 'Forbidden', 'Authenticated, but not allowed'],
        ['`404`', 'Not Found', 'No such resource'],
        ['`409`', 'Conflict', 'State conflict — duplicate, or a concurrent edit'],
        ['`422`', 'Unprocessable Content', 'Well-formed but semantically invalid'],
        ['`429`', 'Too Many Requests', 'Rate limited — always include `Retry-After`'],
        ['`500`', 'Internal Server Error', 'You have a bug'],
        ['`503`', 'Service Unavailable', 'Temporarily down or overloaded'],
      ],
    },

    { t: 'h2', x: '401 vs 403: authentication vs authorisation' },
    {
      t: 'p',
      x: 'The naming is genuinely unhelpful — 401 is called "Unauthorized" but means *unauthenticated*.',
    },
    {
      t: 'ul',
      items: [
        '**401** — I do not know who you are. No credentials, expired token, invalid signature. Retrying with valid credentials could work. The response **must** include a `WWW-Authenticate` header, though most APIs ignore this requirement.',
        '**403** — I know who you are and you may not do this. Retrying with the same credentials will never work.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'When 404 is the better answer than 403',
      x: 'Returning 403 confirms that a resource exists. For anything where the identifier itself is sensitive — private repositories, other tenants’ records — returning 404 for both "does not exist" and "not yours" avoids leaking existence. GitHub does exactly this on private repositories.',
    },

    { t: 'h2', x: '400 vs 422' },
    {
      t: 'ul',
      items: [
        '**400** — the server cannot understand the request at all: malformed JSON, a missing required parameter, a broken `Content-Type`.',
        '**422** — the syntax is fine and the meaning is invalid: an email that is not an email, an end date before the start date, a quantity of −1.',
      ],
    },
    {
      t: 'p',
      x: 'This is a genuine grey area and reasonable teams disagree. Many large APIs use 400 for everything and put the detail in the body, which is defensible and simpler. What is not defensible is being inconsistent within one API. Pick a convention, document it, and return machine-readable details either way:',
    },
    {
      t: 'code',
      lang: 'json',
      x: `{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "errors": [
    { "field": "email",   "code": "invalid_format", "message": "Must be a valid email address" },
    { "field": "endDate", "code": "before_start",   "message": "Must be after startDate" }
  ]
}`,
    },
    {
      t: 'p',
      x: 'That shape follows RFC 9457 (Problem Details for HTTP APIs), which is worth adopting — it gives clients a documented structure instead of a bespoke one per endpoint.',
    },

    { t: 'h2', x: 'Redirects: 301, 302, 307, 308' },
    {
      t: 'table',
      head: ['Code', 'Duration', 'Method preserved?'],
      rows: [
        ['`301`', 'Permanent', 'No — POST usually becomes GET'],
        ['`302`', 'Temporary', 'No — POST usually becomes GET'],
        ['`307`', 'Temporary', '**Yes**'],
        ['`308`', 'Permanent', '**Yes**'],
      ],
    },
    {
      t: 'p',
      x: 'The method-changing behaviour of 301 and 302 was never in the specification — browsers did it, and it became so widespread the standard documented it. 307 and 308 exist to give you the same redirect semantics without the surprise.',
    },
    {
      t: 'ul',
      items: [
        '**Moving a page permanently, for SEO:** use 301. It is the code search engines treat as a signal to transfer ranking and update the index.',
        '**Redirecting an API POST:** use 307 or 308, or the request body will be silently dropped.',
        '**Post/Redirect/Get after a form submission:** 303 See Other is the correct code — it deliberately converts the follow-up to a GET so a refresh does not resubmit.',
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: '301 responses are cached aggressively and effectively forever',
      x: 'Browsers cache permanent redirects on disk and may not recheck for months. A 301 pointing at the wrong place is very hard to take back from users who already received it. Test redirect rules with a 302, then switch to 301 once you are certain.',
    },

    { t: 'h2', x: 'The codes API developers get wrong' },

    { t: 'h3', x: 'Returning 200 with an error in the body' },
    {
      t: 'code',
      lang: 'json',
      x: `HTTP/1.1 200 OK
{ "success": false, "error": "User not found" }`,
    },
    {
      t: 'p',
      x: 'This breaks everything that reads status codes: HTTP client error handling, retry logic, monitoring, CDN caching, load-balancer health checks. Your error rate looks like zero while users see failures. Use the status line — it exists for this.',
    },

    { t: 'h3', x: 'Using 500 for anything you did not anticipate' },
    {
      t: 'p',
      x: '500 should mean "there is a bug in my code". If a user sent bad input, that is a 4xx. Conflating the two makes your error dashboards useless: you cannot distinguish a real incident from a client sending nonsense.',
    },

    { t: 'h3', x: 'Forgetting `Retry-After` on 429 and 503' },
    {
      t: 'code',
      lang: 'http',
      x: `HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1767229200`,
    },
    {
      t: 'p',
      x: 'Without `Retry-After`, well-behaved clients guess — and badly behaved ones retry immediately, turning a rate limit into a self-inflicted denial of service. It accepts either a delay in seconds or an HTTP date.',
    },

    { t: 'h3', x: 'Using 404 for an empty collection' },
    {
      t: 'p',
      x: '`GET /users?role=admin` matching nothing is a **200 with an empty array**. The collection exists; it happens to be empty. 404 means the endpoint itself does not exist, and clients will treat it as a routing bug.',
    },

    { t: 'h2', x: 'Which errors are safe to retry' },
    {
      t: 'table',
      head: ['Code', 'Retry?', 'Strategy'],
      rows: [
        ['`408`, `429`', 'Yes', 'Honour `Retry-After`'],
        ['`500`, `502`, `503`, `504`', 'Yes', 'Exponential backoff with jitter'],
        ['`400`, `401`, `403`, `404`, `422`', 'No', 'Retrying cannot change the outcome'],
        ['`409`', 'Sometimes', 'Only after re-reading the current state'],
      ],
    },
    {
      t: 'p',
      x: '**Add jitter to your backoff.** Without it, every client that failed during an outage retries at the same instants and hammers the service just as it recovers — the thundering herd that turns a brief blip into a long outage.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `async function withRetry(fn, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const retryable = [408, 429, 500, 502, 503, 504].includes(error.status);
      if (!retryable || i === attempts - 1) throw error;

      const base = 2 ** i * 250;                  // 250, 500, 1000 ms
      await new Promise(r => setTimeout(r, base + Math.random() * base));
    }
  }
}`,
    },

    { t: 'h2', x: '502, 503 and 504: which layer failed' },
    {
      t: 'ul',
      items: [
        '**502 Bad Gateway** — the proxy reached your application and got an invalid response, or none. Usually the app crashed or is not listening.',
        '**503 Service Unavailable** — the server is up but deliberately not serving: maintenance mode, no healthy backends, or a shed load. The only 5xx that is often intentional.',
        '**504 Gateway Timeout** — the app was reachable but too slow. Look at slow queries and upstream calls, not at the proxy.',
      ],
    },
    {
      t: 'p',
      x: 'The distinction tells you where to look: 502 means "is the process alive?", 504 means "why is it slow?". Guessing between them wastes the first ten minutes of an incident.',
    },

    { t: 'h2', x: 'Two worth knowing that you rarely see' },
    {
      t: 'ul',
      items: [
        '**`202 Accepted`** — the request is valid and queued, but not finished. The right answer for anything asynchronous: return 202 with a status URL the client can poll, rather than holding a connection open.',
        '**`412 Precondition Failed`** — with `If-Match` and `ETag`, this gives you optimistic concurrency control. The client sends the version it read; if the resource has changed since, the update is rejected instead of silently overwriting someone else’s work.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is the difference between 401 and 403?',
          a: '401 means not authenticated — no valid credentials were supplied, and providing some might work. 403 means authenticated but not permitted — the same credentials will never grant access. The name "Unauthorized" for 401 is a historical misnomer.',
        },
        {
          q: 'Should I use 301 or 302 for a redirect?',
          a: '301 for permanent moves, which is what transfers SEO ranking. 302 for temporary ones. If the request might be a POST, use 308 or 307 instead — 301 and 302 cause browsers to convert POST to GET and drop the body.',
        },
        {
          q: 'Is it acceptable to return 200 with an error in the body?',
          a: 'No. It defeats every layer that reads status codes: client libraries, retry logic, monitoring, caching and health checks. Your dashboards will show a zero error rate while users are failing.',
        },
        {
          q: 'What should an API return when nothing matches a filter?',
          a: '200 with an empty array. The collection exists and is empty. 404 signals that the endpoint itself does not exist, which clients reasonably interpret as a bug in their URL.',
        },
        {
          q: 'When should I use 422 instead of 400?',
          a: '400 when the request cannot be parsed — malformed JSON, missing required fields. 422 when it parses cleanly but the values are invalid. Many APIs use 400 for both and put detail in the body, which is fine as long as it is consistent and documented.',
        },
        {
          q: 'Which status codes are safe to retry automatically?',
          a: '408, 429 and the 5xx family, using exponential backoff with jitter and honouring Retry-After. Never retry 400, 401, 403, 404 or 422 — the request is wrong and repeating it will not help.',
        },
      ],
    },
  ],

  related: ['/guides/fix-cors-errors/', '/guides/javascript-async-await-explained/', '/tools/jwt-decoder/'],
};
