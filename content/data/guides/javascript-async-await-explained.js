module.exports = {
  slug: 'javascript-async-await-explained',
  title: 'JavaScript async/await: Execution, Concurrency and Errors',
  h1: 'How JavaScript async/await behaves',
  eyebrow: 'JavaScript',
  schemaType: 'TechArticle',
  description:
    'Understand what async and await do, when work is sequential or concurrent, why forEach drops Promises, and how errors propagate.',
  standfirst:
    'Async code becomes easier to reason about when you track when each Promise starts, who awaits it, and where a rejection can be handled.',
  keywords: [
    'async await javascript',
    'await in for loop',
    'promise.all',
    'async foreach not working',
    'unhandled promise rejection',
  ],
  published: '2026-06-04',
  updated: '2026-08-09',
  author: 'jackson',
  cardDesc: 'Trace Promise start order, choose sequential or concurrent work, and keep asynchronous failures visible.',

  blocks: [
    { t: 'h2', x: 'What `async` and `await` actually do' },
    {
      t: 'p',
      x: 'An `async` function **always returns a Promise**. Returning an ordinary value fulfills that Promise with the value; throwing rejects it with the error.',
    },
    {
      t: 'p',
      x: '`await` suspends the current async function until its Promise settles, then produces the fulfilled value or throws the rejection. It suspends **only that function**. Other event-loop work continues, and JavaScript remains single-threaded.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `async function getUser(id) {
  return { id };            // Returns Promise<{id}>
}

// The Promise API behaves the same way
function getUser(id) {
  return Promise.resolve({ id });
}`,
    },

    { t: 'h2', x: 'Independent work should not wait in a line' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Sequential: 100 requests × 200ms = 20 seconds
const users = [];
for (const id of ids) {
  users.push(await fetchUser(id));
}

// Concurrent: all requests run together, ~200ms
const users = await Promise.all(ids.map(id => fetchUser(id)));`,
    },
    {
      t: 'p',
      x: 'The loop waits for each request before starting another. When the requests are independent, create all their Promises first and await the group. `Promise.all` fulfills after every input fulfills and rejects when any input rejects.',
    },
    {
      t: 'p',
      x: 'Sequential execution is appropriate when an iteration **depends** on the previous result or when you are intentionally limiting request rate. Otherwise, measure whether unnecessary serialization is contributing to the slow path.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Do not fire 10,000 requests at once',
      x: '`Promise.all` over a large array can exhaust sockets, trigger rate limits or overload the service being called. Use `p-limit`, a chunked loop or another bounded concurrency pool. For HTTP work, 5 to 20 concurrent requests is a reasonable starting range, but measure against the service’s limits.',
    },

    { t: 'h2', x: '`forEach` does not consume callback Promises' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Logs "done" before any save finishes
items.forEach(async (item) => {
  await save(item);
});
console.log('done');`,
    },
    {
      t: 'p',
      x: '`forEach` calls its callback and ignores each return value. An async callback therefore creates Promises that the surrounding code neither returns nor awaits. A rejection from one of those Promises can become unhandled and terminate a Node process.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Concurrent and awaited
await Promise.all(items.map(item => save(item)));

    // Sequential when order matters
for (const item of items) {
  await save(item);
}`,
    },
    {
      t: 'p',
      x: 'Use **`for…of` with `await`** for sequential work, or `map` plus `Promise.all` for concurrent work. An async callback passed to `map`, `filter` or `reduce` still returns a Promise. That is useful with `map` when you await the resulting array, but it does not make `filter` understand asynchronous predicates.',
    },

    { t: 'h2', x: 'Choose how a group should handle rejection' },
    {
      t: 'p',
      x: '`Promise.all` rejects when any input rejects, so its result does not contain the fulfilled values from the same batch. When callers need every outcome, use `Promise.allSettled`:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `const results = await Promise.allSettled(ids.map(id => fetchUser(id)));

const users  = results.filter(r => r.status === 'fulfilled').map(r => r.value);
const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

console.warn(\`\${failed.length} of \${ids.length} failed\`);`,
    },
    {
      t: 'table',
      head: ['Combinator', 'Settles when', 'Use for'],
      rows: [
        ['`Promise.all`', 'All fulfill, or any rejects', 'All-or-nothing work'],
        ['`Promise.allSettled`', 'All settle, whatever the outcome', 'Batch jobs where partial success is fine'],
        ['`Promise.race`', 'The first one settles, fulfilled or rejected', 'Timeouts'],
        ['`Promise.any`', 'The first one fulfils', 'Redundant sources, such as several mirrors'],
      ],
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Promise.race can enforce a timeout
    // The losing request still runs after the race settles
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
]);

// AbortSignal also cancels the request
const response = await fetch(url, { signal: AbortSignal.timeout(5000) });`,
    },

    { t: 'h2', x: 'Do not turn a rejection into unexplained undefined' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Logs the error and returns undefined
async function getUser(id) {
  try {
    return await api.get(\`/users/\${id}\`);
  } catch (error) {
    console.error(error);
  }
}`,
    },
    {
      t: 'p',
      x: 'The caller receives `undefined` and may fail later with an unrelated `TypeError`. Catch an error where you can recover, translate it for an API boundary or add useful context. Otherwise, allow the rejection to propagate to code that can handle it.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Adds context while retaining the original cause
async function getUser(id) {
  try {
    return await api.get(\`/users/\${id}\`);
  } catch (error) {
    throw new Error(\`Failed to load user \${id}\`, { cause: error });
  }
}`,
    },
    {
      t: 'p',
      x: 'The `cause` option keeps the original error attached, allowing logs to show both the operation that failed and the lower-level reason.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: '`return await` inside `try` is not redundant',
      x: 'Without `await`, returning a Promise from inside `try` ends the block before that Promise settles, so its later rejection bypasses the local `catch`. Outside a `try` that needs to catch the rejection, `return await` is usually redundant. Inside one, keep it.',
    },

    { t: 'h2', x: 'Fetch resolves for HTTP error statuses' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// fetch does not reject for 404 or 500 responses
const response = await fetch('/api/users');
    const data = await response.json();   // JSON parsing can hide the HTTP error`,
    },
    {
      t: 'p',
      x: '`fetch` rejects for network-level failures, not for an HTTP 404 or 500 response. Check `response.ok` before parsing a body that assumes success:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `const response = await fetch('/api/users');

if (!response.ok) {
  throw new Error(\`HTTP \${response.status} \${response.statusText}\`);
}

const data = await response.json();`,
    },
    {
      t: 'p',
      x: 'The familiar "Unexpected token < in JSON at position 0" message often means the server returned an HTML error page and `json()` attempted to parse it as JSON.',
    },

    { t: 'h2', x: 'Starting work before you await it' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Sequential: 300ms total
const user  = await fetchUser(id);
const posts = await fetchPosts(id);

// Concurrent: 200ms, and neither depends on the other
const userPromise  = fetchUser(id);
const postsPromise = fetchPosts(id);
const [user, posts] = [await userPromise, await postsPromise];

// Equivalent and clearer
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);`,
    },
    {
      t: 'p',
      x: 'The operation that produces a Promise starts when you call it, not when you later await its result. Creating both Promises first allows the operations to overlap. Check adjacent awaits for this opportunity when neither call uses the other’s result.',
    },

    { t: 'h2', x: 'Unhandled rejections' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Node exits the process by default since v15
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection');
  process.exit(1);
});

// Browser handling
window.addEventListener('unhandledrejection', (event) => {
  reportError(event.reason);
  event.preventDefault();   // prevents duplicate console reporting
});`,
    },
    {
      t: 'p',
      x: 'Common sources include a missing `await`, an async callback passed to `forEach`, and an async event handler whose returned Promise is ignored. Catch an event-handler error inside the handler or pass its Promise to code that records failures.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Does await block the main thread?',
          a: 'No. It suspends the current async function and returns control to the event loop, allowing timers, handlers and rendering to continue. Synchronous work between awaits still blocks the thread, so adding await does not make a CPU-heavy loop nonblocking.',
        },
        {
          q: 'Why does await not work inside forEach?',
          a: 'forEach discards the return value of its callback, so the Promise your async callback returns is thrown away and nothing waits for it. Use for…of for sequential work, or Promise.all with map for concurrent work.',
        },
        {
          q: 'Should I use await in a loop?',
          a: 'Use it when an iteration depends on the previous result or when sequential execution is your rate limit. For independent operations, create the Promises together and await them with a bounded concurrency strategy appropriate to the workload.',
        },
        {
          q: 'What is the difference between Promise.all and Promise.allSettled?',
          a: 'Promise.all rejects immediately when any input rejects, discarding successful results. Promise.allSettled always waits for all of them and returns an array describing each outcome. Use allSettled when partial success is useful.',
        },
        {
          q: 'Why does my fetch not throw on a 404?',
          a: 'Fetch treats a 404 or 500 as a completed HTTP exchange and rejects only when the request fails at the network level. Check response.ok and throw an application error before parsing a success body.',
        },
        {
          q: 'Can I use await at the top level of a file?',
          a: 'Yes, in ES modules. Modern Node releases and current browsers support top-level await there. CommonJS files still need an async wrapper function.',
        },
      ],
    },
  ],

  related: ['/guides/fix-cors-errors/', '/guides/react-usestate-not-updating/', '/guides/http-status-codes-explained/'],
};
