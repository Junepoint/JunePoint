module.exports = {
  slug: 'react-usestate-not-updating',
  title: 'React useState Not Updating? The Five Real Causes',
  h1: 'Why your React useState is not updating',
  eyebrow: 'React',
  schemaType: 'TechArticle',
  description:
    'State that logs the old value, mutations React cannot see, stale closures in effects and intervals, and batched updates — with the fix for each.',
  standfirst:
    'State updates are asynchronous and the value in scope never changes. Once that clicks, every one of these bugs looks the same — and the fixes are short.',
  keywords: [
    'usestate not updating',
    'react state not updating immediately',
    'stale closure react',
    'react state one step behind',
    'usestate console log old value',
  ],
  published: '2026-04-23',
  updated: '2026-08-15',
  author: 'alexander',
  cardDesc: 'Stale closures, mutation, batching and the setInterval trap — why state logs the old value.',

  blocks: [
    {
      t: 'note',
      kind: 'info',
      title: 'The one idea behind all five bugs',
      x: 'Calling `setState` does not change the `state` variable you are holding. It schedules a re-render, and the *next* render gets a **new** variable with the new value. The one in your current scope keeps its old value forever, because it is a `const` captured by that render’s closure.',
    },

    { t: 'h2', x: 'Cause 1: logging state straight after setting it' },
    {
      t: 'code',
      lang: 'javascript',
      x: `const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  console.log(count);   // 0 — always the previous value
}`,
    },
    {
      t: 'p',
      x: 'This is not a bug and there is nothing to fix. `count` in this function belongs to the render that created the handler. React will call your component again with a new `count`; this closure will never see it.',
    },
    {
      t: 'p',
      x: 'To observe the new value, log during render or in an effect:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `useEffect(() => {
  console.log('count is now', count);
}, [count]);`,
    },

    { t: 'h2', x: 'Cause 2: several updates in one handler' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Increments by 1, not 3 — every call reads the same stale count
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);

// ✓ The updater form receives the latest pending value
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);   // now +3`,
    },
    {
      t: 'p',
      x: 'React batches updates within an event handler into a single re-render. With the direct form all three calls compute from the same `count`, so the last one wins. The **updater function** form queues a transformation instead of a value, and React applies each in turn.',
    },
    {
      t: 'p',
      x: 'Rule of thumb: **if the new state depends on the old state, use the updater form.** It is never wrong, and it removes the state variable from your effect dependency arrays as a bonus.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'React 18 batches everywhere',
      x: 'Before React 18, updates inside promises, `setTimeout` and native event handlers were not batched — each triggered its own render. React 18’s automatic batching covers all of them. If a component behaved differently after upgrading, this is usually why.',
    },

    { t: 'h2', x: 'Cause 3: mutating state instead of replacing it' },
    {
      t: 'p',
      x: 'React compares the previous and next state with `Object.is`. Mutating an object or array leaves the reference identical, so React concludes nothing changed and skips the re-render — even though your data is different.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Same array reference — no re-render
items.push(newItem);
setItems(items);

// ✗ Same object reference — no re-render
user.name = 'Ada';
setUser(user);

// ✓ New references
setItems([...items, newItem]);
setUser({ ...user, name: 'Ada' });`,
    },
    {
      t: 'p',
      x: 'Nested updates need a new reference at **every level you change**, which is where this gets tedious and error-prone:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ The outer object is new, but settings is the same object
setUser({ ...user, settings: Object.assign(user.settings, { theme: 'dark' }) });

// ✓ New object at each level
setUser({
  ...user,
  settings: { ...user.settings, theme: 'dark' },
});

// Arrays: map and filter return new arrays; sort and reverse mutate in place
setItems(items.map(i => i.id === id ? { ...i, done: true } : i));
setItems([...items].sort((a, b) => a.order - b.order));   // copy first`,
    },
    {
      t: 'p',
      x: 'For deeply nested state, reach for Immer (`useImmer`) rather than hand-writing spreads three levels down — or reconsider whether the state should be that shape at all. Flat state is easier to update correctly.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: '`sort`, `reverse`, `splice`, `push` and `pop` all mutate',
      x: 'They return the same array they were called on. `map`, `filter`, `slice` and `concat` return new ones. Copy before sorting: `[...items].sort(…)`. In Strict Mode during development, React double-invokes renders partly to make mutation bugs like this surface early.',
    },

    { t: 'h2', x: 'Cause 4: stale closures in effects, intervals and callbacks' },
    {
      t: 'p',
      x: 'The most confusing of the five, because the code looks correct and works once.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Logs 0, 1, 1, 1, 1 … then sticks
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);   // 'count' is frozen at 0 forever
  }, 1000);
  return () => clearInterval(id);
}, []);                    // empty deps — the effect never re-runs`,
    },
    {
      t: 'p',
      x: 'The effect runs once, capturing `count` as `0`. The interval callback keeps that closure for its whole life, so every tick computes `0 + 1`. Two clean fixes:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✓ The updater form never reads the captured variable
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);

// ✓ Or declare the dependency honestly and let the effect re-subscribe
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]);   // correct, but tears down and recreates the interval each tick`,
    },
    {
      t: 'p',
      x: 'The first is better here — the interval survives, and the update is always based on current state.',
    },
    {
      t: 'p',
      x: 'The same trap appears in event listeners, WebSocket handlers and any callback registered once. When you genuinely need the latest value inside a long-lived callback without re-subscribing, hold it in a ref:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `const countRef = useRef(count);
useEffect(() => { countRef.current = count; }, [count]);

useEffect(() => {
  const socket = new WebSocket(url);
  socket.onmessage = () => {
    console.log('current count:', countRef.current);   // always fresh
  };
  return () => socket.close();
}, [url]);`,
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'Never silence the exhaustive-deps lint rule',
      x: 'Adding `// eslint-disable-next-line react-hooks/exhaustive-deps` to make a warning go away converts a visible problem into an invisible one. The rule is right essentially every time. If a dependency causes an unwanted re-run, the fix is an updater function, a ref, or moving the value out of the effect — not disabling the check.',
    },

    { t: 'h2', x: 'Cause 5: state that is not really state' },
    {
      t: 'p',
      x: 'Two structural mistakes that look like update bugs.',
    },
    { t: 'h3', x: 'Initialising state from props' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Runs only on the first render — later prop changes are ignored
function Profile({ user }) {
  const [name, setName] = useState(user.name);
  // ...
}`,
    },
    {
      t: 'p',
      x: 'The argument to `useState` is an *initial* value, used once. When the prop changes, the state does not follow, and the component displays stale data. Either derive the value directly during render, or if you truly need resettable local state, remount the component with a `key`:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// The key changes → React discards the old component and its state
<Profile key={user.id} user={user} />`,
    },
    { t: 'h3', x: 'Storing derived values in state' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Two sources of truth that can disagree
const [items, setItems] = useState([]);
const [total, setTotal] = useState(0);

// ✓ One source of truth; derive the rest during render
const [items, setItems] = useState([]);
const total = items.reduce((sum, i) => sum + i.price, 0);`,
    },
    {
      t: 'p',
      x: 'Anything computable from existing state should be computed, not stored. Duplicated state is state that will eventually be out of sync — and it needs an effect to maintain, which is an extra render and an extra bug surface. Wrap it in `useMemo` only if profiling shows the calculation is genuinely expensive.',
    },

    { t: 'h2', x: 'A quick diagnostic' },
    {
      t: 'ol',
      items: [
        '**Does the component re-render at all?** Add `console.log` at the top of the component body. If it does not fire, you mutated state instead of replacing it.',
        '**Does it render with the old value?** You are reading a captured variable — a stale closure. Check effect dependency arrays.',
        '**Does only the last of several updates apply?** Switch to the updater form.',
        '**Does the value reset unexpectedly?** State initialised from a prop, or a `key` changing and remounting the component.',
        '**Install React DevTools** and watch the state change in the Components panel. It removes all guesswork about whether an update actually landed.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does console.log show the old state right after setState?',
          a: 'Because the state variable in that function belongs to the render that created it and never changes. setState schedules a new render with a new variable. This is expected behaviour, not a bug — log inside an effect that depends on the value if you need to see the update.',
        },
        {
          q: 'How do I run code after state updates?',
          a: 'Use an effect with the state in its dependency array: useEffect(() => { … }, [count]). There is no callback argument to the useState setter as there was with this.setState in class components.',
        },
        {
          q: 'Why does calling setCount three times only add one?',
          a: 'Each call reads the same stale count and computes the same result, so the last one wins. Use the updater form — setCount(c => c + 1) — which queues a transformation applied to the latest pending value.',
        },
        {
          q: 'Why does my component not re-render when I push to an array in state?',
          a: 'push mutates the existing array, so the reference is unchanged and React’s Object.is comparison sees no difference. Create a new array: setItems([...items, newItem]).',
        },
        {
          q: 'When should I use useRef instead of useState?',
          a: 'When the value should persist across renders but changing it should not cause one — timer IDs, DOM nodes, previous values, or the latest state needed inside a long-lived callback. Updating a ref never triggers a render, so never store anything you display in one.',
        },
        {
          q: 'Why does my effect run twice in development?',
          a: 'React Strict Mode intentionally mounts, unmounts and remounts components in development to surface missing cleanup. It does not happen in production. If the double run breaks something, your effect is missing a cleanup function — which is exactly what Strict Mode is telling you.',
        },
      ],
    },
  ],

  related: ['/guides/javascript-async-await-explained/', '/guides/npm-eresolve-error/', '/guides/css-grid-vs-flexbox/'],
};
