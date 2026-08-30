module.exports = {
  slug: 'react-usestate-not-updating',
  title: 'React useState Not Updating: Five Causes to Check',
  h1: 'Why your React useState is not updating',
  eyebrow: 'React',
  schemaType: 'TechArticle',
  description:
    'Diagnose old values, direct state mutations, stale closures, batched updates and props copied into React state.',
  standfirst:
    'A state setter schedules another render; it does not replace the value captured by the current render. That distinction explains many update problems, while reference identity and component structure explain the rest.',
  keywords: [
    'usestate not updating',
    'react state not updating immediately',
    'stale closure react',
    'react state one step behind',
    'usestate console log old value',
  ],
  published: '2026-04-23',
  updated: '2026-08-15',
  author: 'jackson',
  cardDesc: 'Check captured values, state mutation, batching and effect dependencies when a state update seems to disappear.',

  blocks: [
    {
      t: 'note',
      kind: 'info',
      title: 'A setter does not change the current render',
      x: 'Calling `setState` schedules another render. It does not change the `state` variable already captured by the current render. The next render receives a new value, while handlers and effects created by the previous render retain the value from their own scope.',
    },

    { t: 'h2', x: 'Cause 1: logging state straight after setting it' },
    {
      t: 'code',
      lang: 'javascript',
      x: `const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  console.log(count);   // 0, the value from this render
}`,
    },
    {
      t: 'p',
      x: 'This log is showing the value that belonged to the render which created `handleClick`. React calls the component again with the updated count, but the existing handler’s local binding does not change.',
    },
    {
      t: 'p',
      x: 'To observe committed changes, log during rendering or use an effect that depends on the value:',
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
      x: `// ✗ Increments by 1, not 3; every call reads the same count
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
      x: 'React batches these updates into one render. Each direct call calculates the same value from the `count` captured by the handler, so setting that value three times still adds only one. The **updater function** receives the latest pending value, allowing React to apply each increment in sequence.',
    },
    {
      t: 'p',
      x: 'Use the updater form when the next value depends on the previous one. Besides handling queued updates correctly, it can remove an otherwise unnecessary state dependency from an effect or callback.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'React 18 batches everywhere',
      x: 'Before React 18, updates inside promises, `setTimeout` and native event handlers generally triggered separate renders. React 18 extended automatic batching to those contexts. Keep that change in mind when an upgrade alters the timing or number of renders.',
    },

    { t: 'h2', x: 'Cause 3: mutating state instead of replacing it' },
    {
      t: 'p',
      x: 'React compares the previous and next state with `Object.is`. Mutating an object or array keeps the same reference, so React can skip the render even though properties or elements changed in memory.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Same array reference, so React can skip the render\nitems.push(newItem);\nsetItems(items);\n\n// ✗ Same object reference, with the same result
user.name = 'Ada';
setUser(user);

// ✓ New references
setItems([...items, newItem]);
setUser({ ...user, name: 'Ada' });`,
    },
    {
      t: 'p',
      x: 'For a nested update, create a new reference at **each changed level**. Reusing one inner object is still a mutation of the previous state:',
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
      x: 'For deeply nested state, Immer (`useImmer`) can make immutable updates easier to read. It is also worth checking whether the component needs that entire nested object; flatter or more local state is usually simpler to update.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: '`sort`, `reverse`, `splice`, `push` and `pop` all mutate',
      x: 'These methods change the array they receive. `map`, `filter`, `slice` and `concat` return new arrays. Copy before sorting with `[...items].sort(…)`. Development Strict Mode invokes render logic more than once, which can expose accidental mutations earlier.',
    },

    { t: 'h2', x: 'Cause 4: stale closures in effects, intervals and callbacks' },
    {
      t: 'p',
      x: 'Stale closures often look plausible because the callback works on its first run and then stops seeing later values.',
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
}, []);                    // empty deps, so the effect never re-runs`,
    },
    {
      t: 'p',
      x: 'The effect runs once and captures `count` as `0`. Its interval callback keeps that closure, so every tick calculates `0 + 1`. Choose a fix based on whether the callback needs the state value for anything beyond the update:',
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
      x: 'For this counter, the updater form is preferable because the interval can remain subscribed while each update receives the latest pending state.',
    },
    {
      t: 'p',
      x: 'The same issue appears in event listeners, WebSocket handlers and other callbacks registered for a long time. When such a callback needs the latest value without being re-registered, keep that value in a ref:',
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
      title: 'Treat exhaustive-deps warnings as design feedback',
      x: 'Adding `// eslint-disable-next-line react-hooks/exhaustive-deps` hides the mismatch between an effect and the values it reads. If adding a dependency causes an unwanted rerun, consider an updater function, a ref or moving that work outside the effect before suppressing the check.',
    },

    { t: 'h2', x: 'Cause 5: state that is not really state' },
    {
      t: 'p',
      x: 'Some apparent update failures come from storing a value that should not be independent state.',
    },
    { t: 'h3', x: 'Initialising state from props' },
    {
      t: 'code',
      lang: 'javascript',
      x: `// ✗ Runs only on the first render; later prop changes are ignored
function Profile({ user }) {
  const [name, setName] = useState(user.name);
  // ...
}`,
    },
    {
      t: 'p',
      x: 'The argument to `useState` is an *initial* value. A later prop change does not reset that state. Derive the displayed value from the prop when no local edits are needed; when the component truly needs fresh local state for each record, a changing `key` can remount it:',
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
      x: 'A value that can be calculated from current state does not usually need its own setter. Storing both sources creates a synchronization problem and often adds an effect plus another render. Use `useMemo` only when measurement shows that the calculation is expensive enough to cache.',
    },

    { t: 'h2', x: 'A quick diagnostic' },
    {
      t: 'ol',
      items: [
        '**Does the component render again?** Put a temporary log at the top of the component. If no render follows the setter, check whether the old object or array reference was passed back.',
        '**Does the next render still use an old value?** Look for a long-lived closure and inspect the dependency arrays of effects and callbacks.',
        '**Do several updates produce only one change?** Use an updater function when each call depends on the previous value.',
        '**Does the value reset unexpectedly?** Check whether a changing `key` remounts the component or whether state was initialised from a prop.',
        '**Inspect the component in React DevTools.** The Components panel shows whether the state committed even when a log comes from an older closure.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does console.log show the old state right after setState?',
          a: 'The function is reading the state value captured by the render that created it. setState schedules another render with a new value; it does not change the existing local binding. Log in an effect that depends on the value when you need to observe committed updates.',
        },
        {
          q: 'How do I run code after state updates?',
          a: 'Use an effect with the state in its dependency array: useEffect(() => { … }, [count]). There is no callback argument to the useState setter as there was with this.setState in class components.',
        },
        {
          q: 'Why does calling setCount three times only add one?',
          a: 'Each direct call reads the same count and calculates the same next value. Use setCount(c => c + 1) so each queued updater receives the latest pending value.',
        },
        {
          q: 'Why does my component not re-render when I push to an array in state?',
          a: 'push mutates the existing array, so the reference is unchanged and React’s Object.is comparison sees no difference. Create a new array: setItems([...items, newItem]).',
        },
        {
          q: 'When should I use useRef instead of useState?',
          a: 'Use a ref for a value that must persist across renders without triggering another render, such as a timer ID, DOM node, previous value or current data needed by a long-lived callback. Keep displayed data in state because changing a ref does not update the UI.',
        },
        {
          q: 'Why does my effect run twice in development?',
          a: 'Development Strict Mode mounts, unmounts and remounts components to expose effects without adequate cleanup. This check does not run the same way in production. If remounting breaks the effect, add the cleanup needed to make setup repeatable.',
        },
      ],
    },
  ],

  related: ['/guides/javascript-async-await-explained/', '/guides/npm-eresolve-error/', '/guides/css-grid-vs-flexbox/'],
};
