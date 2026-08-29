module.exports = {
  slug: 'javascript-async-await-explained',
  title: 'JavaScript async/await Explained (With the Traps)',
  h1: 'JavaScript async/await, properly explained',
  eyebrow: 'JavaScript',
  schemaType: 'TechArticle',
  description:
    'How async/await really works, why await in a loop is slow, why forEach ignores it, and how to handle errors without swallowing them.',
  standfirst:
    'Most async bugs come from four misunderstandings. Here they are, with the pattern that fixes each one.',
  keywords: [
    'async await javascript',
    'await in for loop',
    'promise.all',
    'async foreach not working',
    'unhandled promise rejection',
  ],
  published: '2026-06-04',
  updated: '2026-08-09',
  author: 'alexander',
  cardDesc: 'Sequential awaits, forEach silently ignoring async, and error handling that does not swallow failures.',

  blocks: [
    { t: 'h2', x: 'What `async` and `await` actually do' },
    {
      t: 'p',
      x: '`async` on a function means one thing: **it returns a Promise.** If you return a value, it is wrapped in a resolved Promise; if you throw, you get a rejected one.',
    },
    {
      t: 'p',
      x: '`await` pauses that function until a Promise settles, then unwraps it. Crucially, it pauses **only that function** — the rest of the program continues. JavaScript is still single-threaded, and `await` never blocks the main thread.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `async function getUser(id) {
  return { id };            // returns Promise<{id}>
}

// Identical behaviour, written with the underlying Promise API
function getUser(id) {
  return Promise.resolve({ id });
}`,
    },

    { t: 'h2', x: 'Trap 1: awaiting in a loop when you did not need to' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Sequential — 100 requests × 200ms = 20 seconds
const users = [];
for (const id of ids) {
  users.push(await fetchUser(id));
}

// ✓ Concurrent — all in flight at once, ~200ms
const users = await Promise.all(ids.map(id => fetchUser(id)));`,
    },
    {
      t: 'p',
      x: 'The first version waits for each request before starting the next. Since the requests do not depend on each other, that is pure waste. `Promise.all` starts them all immediately and resolves when the last finishes.',
    },
    {
      t: 'p',
      x: 'Sequential is correct when each iteration **depends** on the previous, or when you are deliberately rate-limiting. Otherwise it is a performance bug — and one of the easiest large speedups available in most codebases.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'Do not fire 10,000 requests at once',
      x: '`Promise.all` over a large array will exhaust sockets, trip rate limits or take down the service you are calling. Batch it — with `p-limit`, a chunked loop, or a small concurrency pool. Concurrency of 5 to 20 is usually the sweet spot for HTTP.',
    },

    { t: 'h2', x: 'Trap 2: `forEach` ignores your async callback' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Logs "done" immediately; nothing has been saved yet
items.forEach(async (item) => {
  await save(item);
});
console.log('done');`,
    },
    {
      t: 'p',
      x: '`forEach` calls your function and discards the return value. Your callback returns a Promise; `forEach` throws it away. Nothing waits for anything, and — worse — a rejection inside becomes an unhandled rejection that can crash a Node process.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✓ Concurrent, and awaited
await Promise.all(items.map(item => save(item)));

// ✓ Sequential, when order matters
for (const item of items) {
  await save(item);
}`,
    },
    {
      t: 'p',
      x: 'The rule: **`for…of` supports `await`; `forEach` does not.** The same applies to `map`, `filter` and `reduce` — an async callback gives you an array of Promises, which is fine for `map` (feed it to `Promise.all`) and useless for `filter`.',
    },

    { t: 'h2', x: 'Trap 3: one rejection kills the whole batch' },
    {
      t: 'p',
      x: '`Promise.all` rejects as soon as any input rejects, and you lose the results that did succeed. When partial success is acceptable, use `allSettled`:',
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
        ['`Promise.all`', 'All fulfil, or any rejects', 'All-or-nothing work'],
        ['`Promise.allSettled`', 'All settle, whatever the outcome', 'Batch jobs where partial success is fine'],
        ['`Promise.race`', 'The first one settles, fulfilled or rejected', 'Timeouts'],
        ['`Promise.any`', 'The first one fulfils', 'Redundant sources — try several mirrors'],
      ],
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// A timeout with Promise.race — but prefer AbortSignal, below,
// because race leaves the losing request running.
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
]);

// Better: actually cancel the request
const response = await fetch(url, { signal: AbortSignal.timeout(5000) });`,
    },

    { t: 'h2', x: 'Trap 4: error handling that hides the failure' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Swallows the error and returns undefined — the caller has no idea
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
      x: 'The caller receives `undefined` and carries on. The failure surfaces later as a `TypeError` somewhere unrelated, with no trace of the original cause. **Only catch an error if you are going to do something about it** — otherwise let it propagate.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✓ Add context, keep the original cause attached
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
      x: 'The `cause` option preserves the original error and its stack, so your logs show both the context and the root failure.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: '`return await` inside `try` is not redundant',
      x: 'Dropping the `await` in `return await somePromise()` inside a `try` block means the function returns before the Promise settles — so a rejection escapes your `catch` entirely. Outside a `try`, the `await` genuinely is redundant. Inside one, keep it.',
    },

    { t: 'h2', x: 'The fetch mistake everyone makes' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ fetch does NOT reject on 404 or 500
const response = await fetch('/api/users');
const data = await response.json();   // throws a confusing JSON parse error`,
    },
    {
      t: 'p',
      x: '`fetch` only rejects on a network failure. A 404 or a 500 is a perfectly successful HTTP transaction as far as it is concerned. You must check `response.ok` yourself:',
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
      x: 'This is why so many apps report "Unexpected token < in JSON at position 0" — the server returned an HTML error page, and `json()` tried to parse it.',
    },

    { t: 'h2', x: 'Starting work before you await it' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Sequential — 300ms total
const user  = await fetchUser(id);
const posts = await fetchPosts(id);

// ✓ Concurrent — 200ms, and neither depends on the other
const userPromise  = fetchUser(id);
const postsPromise = fetchPosts(id);
const [user, posts] = [await userPromise, await postsPromise];

// ✓ Equivalent and clearer
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);`,
    },
    {
      t: 'p',
      x: 'A Promise starts executing the moment it is created, not when you await it. Creating both first, then awaiting, overlaps the work. This is worth reaching for whenever two awaits sit next to each other and neither uses the other’s result.',
    },

    { t: 'h2', x: 'Unhandled rejections' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Node: crashes the process by default since v15
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled rejection');
  process.exit(1);
});

// Browser
window.addEventListener('unhandledrejection', (event) => {
  reportError(event.reason);
  event.preventDefault();   // stop the console noise once reported
});`,
    },
    {
      t: 'p',
      x: 'The usual sources are a forgotten `await`, an async callback passed to `forEach`, and an async event handler with no internal try/catch. Handlers cannot await your function, so an error inside one has nowhere to go.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Does await block the main thread?',
          a: 'No. It suspends only the async function it appears in and returns control to the event loop, so timers, event handlers and rendering continue. Long synchronous work between awaits does block — await is not a fix for a slow loop.',
        },
        {
          q: 'Why does await not work inside forEach?',
          a: 'forEach discards the return value of its callback, so the Promise your async callback returns is thrown away and nothing waits for it. Use for…of for sequential work, or Promise.all with map for concurrent work.',
        },
        {
          q: 'Should I use await in a loop?',
          a: 'Only when each iteration depends on the previous one, or when you are deliberately rate-limiting. If the operations are independent, awaiting in a loop turns parallel work into sequential work and multiplies the total time by the number of items.',
        },
        {
          q: 'What is the difference between Promise.all and Promise.allSettled?',
          a: 'Promise.all rejects immediately when any input rejects, discarding successful results. Promise.allSettled always waits for all of them and returns an array describing each outcome. Use allSettled when partial success is useful.',
        },
        {
          q: 'Why does my fetch not throw on a 404?',
          a: 'By design — fetch only rejects on network failure. A 404 or 500 is a completed HTTP exchange. Check response.ok and throw yourself, otherwise .json() will attempt to parse an HTML error page and produce a misleading parse error.',
        },
        {
          q: 'Can I use await at the top level of a file?',
          a: 'Yes, in ES modules — top-level await is supported in modern Node and all current browsers. It is not available in CommonJS files, where you still need an async wrapper function.',
        },
      ],
    },
  ],

  related: ['/guides/fix-cors-errors/', '/guides/react-usestate-not-updating/', '/guides/http-status-codes-explained/'],
};
