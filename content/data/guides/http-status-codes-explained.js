module.exports = {
  slug: 'http-status-codes-explained',
  title: 'HTTP Status Codes: A Practical API Reference',
  h1: 'HTTP status codes for application developers',
  eyebrow: 'Web fundamentals',
  schemaType: 'TechArticle',
  description:
    'A working reference for common HTTP status codes, including authentication, validation, redirects, retries and gateway failures.',
  standfirst:
    'Most application code uses a small part of the HTTP status registry. Focus on the codes your clients can act on, especially the distinctions between 401 and 403, 400 and 422, and temporary and permanent redirects.',
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
  cardDesc: 'Choose useful status codes for authentication, validation, redirects, retries and upstream failures.',

  blocks: [
    { t: 'h2', x: 'The five classes' },
    {
      t: 'table',
      head: ['Class', 'Meaning', 'Who should fix it'],
      rows: [
        ['`1xx`', 'Informational; request received, still processing', 'Usually protocol handling; rarely seen in application code'],
        ['`2xx`', 'Success', 'Nobody'],
        ['`3xx`', 'Redirection to another location or cached representation', 'Configuration, if the destination is wrong'],
        ['`4xx`', 'The request cannot be fulfilled as sent', 'The caller'],
        ['`5xx`', 'The server failed to complete a valid request', 'The service operator'],
      ],
    },
    {
      t: 'p',
      x: 'The 4xx and 5xx boundary matters to monitoring and retry behavior. A validation failure belongs in 4xx because the caller can change the request. A 5xx response tells operators and clients that the server failed, so using it for invalid input creates false incident signals.',
    },

    { t: 'h2', x: 'The common application codes' },
    {
      t: 'table',
      head: ['Code', 'Name', 'When'],
      rows: [
        ['`200`', 'OK', 'Successful GET, PUT or PATCH with a body'],
        ['`201`', 'Created', 'POST created a resource; include a `Location` header'],
        ['`204`', 'No Content', 'Success with nothing to return, such as DELETE or a PUT you do not echo'],
        ['`301`', 'Moved Permanently', 'The URL has changed for good'],
        ['`302`', 'Found', 'Temporary redirect; compare its method behavior with 307'],
        ['`304`', 'Not Modified', 'The cached copy is still good'],
        ['`400`', 'Bad Request', 'Malformed request the server cannot parse'],
        ['`401`', 'Unauthorized', 'Valid authentication is missing'],
        ['`403`', 'Forbidden', 'Authenticated, but not allowed'],
        ['`404`', 'Not Found', 'No such resource'],
        ['`409`', 'Conflict', 'State conflict, such as a duplicate or concurrent edit'],
        ['`422`', 'Unprocessable Content', 'Well-formed but semantically invalid'],
        ['`429`', 'Too Many Requests', 'Rate limited; include `Retry-After`'],
        ['`500`', 'Internal Server Error', 'You have a bug'],
        ['`503`', 'Service Unavailable', 'Temporarily down or overloaded'],
      ],
    },

    { t: 'h2', x: '401 vs 403: authentication vs authorization' },
    {
      t: 'p',
      x: 'The historical name of 401 is misleading. In application terms, 401 means the request is not authenticated, while 403 concerns permission after the caller is known.',
    },
    {
      t: 'ul',
      items: [
        '**401:** no credentials, an expired token or an invalid signature. Supplying valid credentials could change the outcome. The response **must** include a `WWW-Authenticate` header, although many APIs omit it.',
        '**403:** the server recognizes the caller but does not allow this action. Retrying with the same identity will not change the result.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'When 404 is the better answer than 403',
      x: 'A 403 response confirms that the target exists. When existence is sensitive, as with private repositories or another tenant’s records, returning 404 for both "not found" and "not visible to this caller" avoids that disclosure. GitHub uses this approach for private repositories.',
    },

    { t: 'h2', x: '400 vs 422' },
    {
      t: 'ul',
      items: [
        '**400:** the server cannot process the request syntax or basic shape, such as malformed JSON, a missing required parameter or an invalid `Content-Type`.',
        '**422:** the syntax is valid but the values fail semantic validation, such as a malformed email, an end date before the start date or a quantity of −1.',
      ],
    },
    {
      t: 'p',
      x: 'Reasonable APIs draw this line differently. Some use 400 for both parsing and validation errors, then describe the distinction in the body. Either approach can work if it is documented and consistent within the API. Return machine-readable details so clients do not have to parse prose:',
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
      x: 'This follows RFC 9457, Problem Details for HTTP APIs. Adopting that structure gives clients one documented error format instead of a different shape for each endpoint.',
    },

    { t: 'h2', x: 'Redirects: 301, 302, 307, 308' },
    {
      t: 'table',
      head: ['Code', 'Duration', 'Method preserved?'],
      rows: [
        ['`301`', 'Permanent', 'No; POST usually becomes GET'],
        ['`302`', 'Temporary', 'No; POST usually becomes GET'],
        ['`307`', 'Temporary', '**Yes**'],
        ['`308`', 'Permanent', '**Yes**'],
      ],
    },
    {
      t: 'p',
      x: 'Browsers historically changed POST to GET when following 301 and 302, even though the original specifications did not define that behavior. The standards later documented the established practice. Codes 307 and 308 provide temporary and permanent redirects while preserving the method and body.',
    },
    {
      t: 'ul',
      items: [
        '**Moving a page permanently, for SEO:** use 301. It is the code search engines treat as a signal to transfer ranking and update the index.',
        '**Redirecting an API POST:** use 307 or 308, or the request body will be silently dropped.',
        '**Post/Redirect/Get after a form submission:** use 303 See Other. It deliberately converts the follow-up request to GET so refreshing the result does not resubmit the form.',
      ],
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Test a permanent redirect before publishing it',
      x: 'Browsers can cache permanent redirects on disk for months. Correcting a bad 301 may not help clients that already stored it. Test the routing rule with a 302, then change it to 301 after confirming the destination.',
    },

    { t: 'h2', x: 'Status-code mistakes that affect clients' },

    { t: 'h3', x: 'Returning 200 with an error in the body' },
    {
      t: 'code',
      lang: 'json',
      x: `HTTP/1.1 200 OK
{ "success": false, "error": "User not found" }`,
    },
    {
      t: 'p',
      x: 'A 200 response tells client libraries, retry code, monitoring, caches and health checks that the request succeeded. Putting an error only in the body hides the failure from each of those layers. Return the error status on the HTTP status line and use the body for detail.',
    },

    { t: 'h3', x: 'Using 500 for anything you did not anticipate' },
    {
      t: 'p',
      x: 'Reserve 500 for an unexpected server failure. Invalid input belongs in 4xx. Keeping those categories separate makes dashboards and alerts reflect service incidents instead of routine client mistakes.',
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
      x: 'Without `Retry-After`, clients must guess when to try again, and immediate retries can increase load during an already constrained period. The header accepts either a delay in seconds or an HTTP date.',
    },

    { t: 'h3', x: 'Using 404 for an empty collection' },
    {
      t: 'p',
      x: 'When `GET /users?role=admin` finds no matches, return **200 with an empty array**. The collection exists and the filter produced no members. A 404 suggests that the resource or route itself does not exist.',
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
      x: '**Add jitter to exponential backoff.** Without it, clients that failed together also retry together, producing synchronized load while the service is recovering. A random component spreads those attempts over time.',
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

      const base = 2 ** i * 250;                  // Retry delays are 250, 500, 1000 ms
      await new Promise(r => setTimeout(r, base + Math.random() * base));
    }
  }
}`,
    },

    { t: 'h2', x: '502, 503 and 504: which layer failed' },
    {
      t: 'ul',
      items: [
        '**502 Bad Gateway:** the proxy received an invalid response from the application, or no response at all. Check whether the app crashed or is listening on the expected address.',
        '**503 Service Unavailable:** the server is available but cannot currently serve the request, for example during maintenance, load shedding or when no healthy backend remains.',
        '**504 Gateway Timeout:** the upstream application was reachable but did not respond in time. Investigate slow queries and upstream calls as well as configured timeouts.',
      ],
    },
    {
      t: 'p',
      x: 'Use the gateway’s observation to choose the first check. For 502, verify that the process is healthy and returning valid HTTP. For 504, trace where the upstream request spent its time.',
    },

    { t: 'h2', x: 'Two worth knowing that you rarely see' },
    {
      t: 'ul',
      items: [
        '**`202 Accepted`:** the server accepted the request but has not finished processing it. For asynchronous work, return 202 with a status URL the client can poll instead of holding the original connection open.',
        '**`412 Precondition Failed`:** use `If-Match` with `ETag` for optimistic concurrency control. The client sends the version it read; if that resource has since changed, the server rejects the update instead of overwriting newer work.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is the difference between 401 and 403?',
          a: '401 means the request lacks valid authentication, so supplying valid credentials might work. 403 means the server recognizes the caller but does not grant that identity permission. The name "Unauthorized" for 401 is a historical misnomer.',
        },
        {
          q: 'Should I use 301 or 302 for a redirect?',
          a: 'Use 301 for a permanent move and 302 for a temporary one. Search engines use 301 as a signal to update indexing and ranking. If the original request may be a POST, use 308 or 307 to preserve its method and body.',
        },
        {
          q: 'Is it acceptable to return 200 with an error in the body?',
          a: 'Not for a failed HTTP operation. Client libraries, retry logic, monitoring, caches and health checks all interpret 200 as success. Return an appropriate error status and put the structured details in the response body.',
        },
        {
          q: 'What should an API return when nothing matches a filter?',
          a: '200 with an empty array. The collection exists and is empty. 404 signals that the endpoint itself does not exist, which clients reasonably interpret as a bug in their URL.',
        },
        {
          q: 'When should I use 422 instead of 400?',
          a: 'Use 400 when the request cannot be parsed or is missing its required shape. Use 422 when parsing succeeds but the values fail semantic validation. Some APIs use 400 for both; consistency and a documented error body matter more than forcing this distinction.',
        },
        {
          q: 'Which status codes are safe to retry automatically?',
          a: '408, 429 and transient 5xx responses are typical retry candidates. Use exponential backoff with jitter and honor Retry-After. Do not automatically retry 400, 401, 403, 404 or 422 without changing the request or credentials.',
        },
      ],
    },
  ],

  related: ['/guides/fix-cors-errors/', '/guides/javascript-async-await-explained/', '/tools/jwt-decoder/'],
};
