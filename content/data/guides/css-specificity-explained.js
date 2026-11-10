module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying: specificity, layers and !important",
  "eyebrow": "Troubleshooting",
  "description": "Most CSS that should work fails for reasons other than specificity. Here is the order the browser resolves declarations in, and how to debug each step.",
  "standfirst": "Specificity is only the fourth tiebreaker the browser reaches for. Work through matching, origin, layers, specificity and source order in that sequence and the mystery usually collapses in under a minute.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "The order the browser really resolves declarations in, and why your rule keeps losing.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is the fourth tiebreaker, not the first. Origin and importance come first, then inline styles, then cascade layers, then specificity, then source order.",
        "Most reported specificity problems are not specificity. The selector never matched, or the declaration was dropped as invalid at parse time.",
        "If a property is missing from the Computed pane entirely, no rule lost the cascade. The browser threw your declaration away.",
        "Specificity is a three-part tuple compared left to right: IDs, then classes and attributes and pseudo-classes, then types and pseudo-elements. Twelve classes still lose to one ID.",
        "`:where()` always counts as zero. `:is()`, `:not()` and `:has()` count as their most specific argument.",
        "`!important` inverts cascade layer order. An important declaration in your *first* layer beats an important declaration in your last, and unlayered `!important` is the weakest important author declaration of all.",
        "The durable fix is almost always to lower the rule that is beating you, not to raise the rule that is losing."
      ]
    },
    {
      "t": "h2",
      "x": "The order the browser actually resolves in"
    },
    {
      "t": "p",
      "x": "Before any specificity arithmetic happens, the browser has already discarded most of the candidates. It parses each declaration and drops the ones it cannot understand. It matches selectors against the element in its current state. Only the survivors go into the cascade, and the cascade sorts them with specificity near the bottom of its list of criteria."
    },
    {
      "t": "ol",
      "items": [
        "**Is the declaration valid?** An unparseable value is dropped on the floor at parse time. No cascade, no competition, nothing in DevTools except a warning icon.",
        "**Does the selector match?** Right now, for this element, in this state. A class added by JavaScript after paint, a hashed CSS Modules name, or a child combinator where you meant a descendant all fail here.",
        "**Origin and importance.** Author, user and user-agent styles, with `!important` flipping the comparison.",
        "**Encapsulation context.** Shadow tree styles and document styles are compared before specificity is considered.",
        "**Element-attached styles.** A `style` attribute outranks every selector-based normal author declaration.",
        "**Cascade layers.** Later layers beat earlier ones for normal declarations; unlayered normal styles beat all layers.",
        "**Specificity.** Only now, and only between declarations that tied on everything above.",
        "**Order of appearance.** The last one in the final stylesheet wins. Your bundler decides this, not your intent."
      ]
    },
    {
      "t": "table",
      "head": [
        "Level",
        "Origin and importance",
        "Practical note"
      ],
      "rows": [
        [
          "1 (wins)",
          "Running CSS transitions",
          "A transition in flight beats every declaration, including `!important`."
        ],
        [
          "2",
          "`!important` user-agent",
          "Rare, but real for a handful of form control internals."
        ],
        [
          "3",
          "`!important` user",
          "Extensions, OS-level user stylesheets, accessibility overrides."
        ],
        [
          "4",
          "`!important` author",
          "Your stylesheets. This is the ceiling you can reach from a CSS file."
        ],
        [
          "5",
          "Running CSS animations",
          "A `@keyframes` animation beats normal author rules while it runs. A frequent cause of a rule that applies for 300ms and then stops."
        ],
        [
          "6",
          "Normal author",
          "Where you spend 99% of your time, and where specificity matters."
        ],
        [
          "7",
          "Normal user",
          ""
        ],
        [
          "8 (loses)",
          "Normal user-agent",
          "Browser defaults. The weakest thing on the page, which is why a single class can restyle a button."
        ]
      ],
      "caption": "Origin and importance precedence, strongest first. Specificity is never compared across these levels."
    },
    {
      "t": "p",
      "x": "That table explains something people find surprising: a user-agent default is the easiest thing in the world to override, but a user-agent `!important` is beyond your reach. It also explains the animation case. If your rule applies and then reverts, stop counting selectors and look for a `@keyframes` block or a `transition` that is still running."
    },
    {
      "t": "h2",
      "x": "Before you blame specificity"
    },
    {
      "t": "p",
      "x": "Specificity gets blamed for a lot of failures it had no part in. Four causes account for most of them, and all four are faster to rule out than a specificity audit is to perform."
    },
    {
      "t": "p",
      "x": "**The selector does not match.** This is the big one. `.card > .title` does not match a `.title` nested two levels down. A Vue or Svelte scoped style compiles to an attribute selector that your dynamically injected markup never receives. A CSS Modules class becomes `Card_title__x7f2k`, so your hand-written `.title` in a global file matches nothing at all."
    },
    {
      "t": "p",
      "x": "**The declaration is invalid and was discarded.** `width: 50` with no unit, `color: #ff00`, a typo in a property name, a `var()` reference that resolves to nothing usable. CSS error recovery is silent by design: the browser drops the bad declaration and keeps going. Nothing fails loudly."
    },
    {
      "t": "p",
      "x": "**The property does not apply to that element.** `width` on an inline non-replaced element does nothing. Neither does `justify-content` on a parent that is not a flex or grid container, nor `z-index` on a `position: static` element, nor `gap` on a plain block. The declaration is valid, it wins the cascade, and it has no effect."
    },
    {
      "t": "p",
      "x": "**A shorthand later in the file reset your longhand.** `background: #fff` clears `background-image`. The `font` shorthand resets `line-height` to normal. `all: unset` wipes the lot. These are not specificity losses, they are perfectly legitimate overrides that you did not notice writing."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches at all",
          "x": "Paste the selector into the console. A length of zero ends the investigation immediately, and it is zero more often than anyone expects.",
          "code": "document.querySelectorAll('.card > .title').length\n// 0 -> your selector is the bug, not the cascade"
        },
        {
          "title": "Read the Computed pane, not the Styles pane",
          "x": "Find the property in Computed and expand it. DevTools lists every declaration that targeted it, winner at the top, with a link to the source line. If the property is not listed under Computed with a value you can trace, nothing you wrote ever became a candidate.",
          "code": "getComputedStyle(document.querySelector('.card')).color"
        },
        {
          "title": "Look for the strikethrough and read what beat you",
          "x": "A crossed-out declaration in the Styles pane means it lost. Hovering the winning rule shows its origin and, in current Chrome and Firefox builds, its `@layer`. That is the rule you have to deal with. Guessing at this point wastes time.",
          "code": ""
        },
        {
          "title": "Check origin, inline styles and layer before specificity",
          "x": "Is the winner in a `style` attribute? In a different layer? Marked `!important`? If any of those is true, specificity was never consulted and raising yours will change nothing.",
          "code": ""
        },
        {
          "title": "Only now count the tuple",
          "x": "Count IDs, then classes plus attributes plus pseudo-classes, then types plus pseudo-elements. Compare left to right. If you tie, source order decides, and the later declaration wins.",
          "code": ""
        }
      ]
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is three numbers, not one. Write it as (A, B, C). A counts ID selectors. B counts classes, attribute selectors and pseudo-classes. C counts element types and pseudo-elements. The comparison is lexicographic: compare A, and only look at B if A ties. This is why no quantity of classes ever defeats a single ID. There was a historical implementation cap in very old browsers; it is irrelevant now, and the tuple is effectively unbounded."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,1) */   p { color: black; }\n/* (0,0,2) */   article p { color: gray; }\n/* (0,1,0) */   .note { color: teal; }\n/* (0,1,1) */   p.note { color: green; }\n/* (0,2,0) */   .page .note { color: orange; }\n/* (0,2,1) */   p.note[data-state=\"open\"] { color: purple; }\n/* (1,0,0) */   #sidebar { color: blue; }   /* beats every line above */\n\n/* Combinators and the universal selector contribute nothing: */\n/* (0,1,1) */   .page > * + article { color: red; }\n\n/* Pseudo-elements count as type-level, not class-level: */\n/* (0,1,1) */   .note::before { content: \"!\"; }"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Attribute selectors are class-level",
      "x": "`[data-state=\"open\"]`, `[href^=\"https\"]` and `[disabled]` all count exactly the same as a class: one in the B column. The length or complexity of the match has no bearing on it. `[class=\"btn\"]` and `.btn` have identical specificity, though they match differently, since the attribute form requires an exact full-attribute match."
    },
    {
      "t": "h2",
      "x": "Where :is(), :not(), :has() and :where() change the math"
    },
    {
      "t": "p",
      "x": "These four functional pseudo-classes are the most common source of specificity results that look wrong. Three of them take the specificity of their most specific argument. One of them takes nothing at all."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* :is() takes its most specific argument -> (1,0,0), not (0,1,0) */\n:is(#main, .card) p { color: red; }\n\n/* :not() behaves the same way -> (1,0,0) */\np:not(#main) { color: blue; }\n\n/* :has() too -> (0,1,0) from .error */\narticle:has(.error) { border-color: crimson; }\n\n/* :where() is always (0,0,0), however alarming the contents */\n:where(#main .card.featured p) { color: green; }\n\n/* So this single class wins over the :where() rule above */\n.lede { color: black; }"
    },
    {
      "t": "p",
      "x": "`:where()` is the useful one. Wrap the selectors in a reset, a normalize layer or a library default in `:where()` and they become trivially overridable by a single class, which is almost always what a default should be. The flip side is that a careless `:is(#id, .class)` smuggles an ID-level specificity into a rule that reads like a class selector. If a grouped selector is suddenly unbeatable, look inside the parentheses."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Native nesting inherits this behaviour",
      "x": "In nested CSS, the implicit relative selector behaves like `:is()` on the parent selector list. A nested rule under `#app, .app` therefore carries ID-level specificity even when the element you are styling has no ID anywhere near it. Flatten the parent list or wrap it in `:where()` if that matters to you."
    },
    {
      "t": "h2",
      "x": "Cascade layers, and what !important does to them"
    },
    {
      "t": "p",
      "x": "Cascade layers (`@layer`) let you declare precedence explicitly instead of inferring it from specificity and file order. Declare the order once, at the top, and a declaration in a later layer beats a declaration in an earlier layer no matter how the selectors compare. A ten-class selector in `base` loses to a single class in `utilities`. Specificity is only consulted inside a layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once. Everything else follows from this line. */\n@layer reset, base, components, utilities;\n\n@layer base {\n  /* (0,3,0), and it still loses to the utility below */\n  .page .card .btn { background: #64748b; }\n}\n\n@layer utilities {\n  /* (0,1,0) in a later layer -> wins */\n  .bg-blue { background: #2563eb; }\n}\n\n/* Unlayered normal styles beat EVERY layer. This wins over both. */\n.btn { background: hotpink; }\n\n@layer reset {\n  /* !important inverts layer order, so important in the FIRST\n     layer outranks important in any later layer. This wins overall. */\n  .btn { background: black !important; }\n}"
    },
    {
      "t": "p",
      "x": "The inversion in that last block is the part that catches people. For normal declarations, later layers are stronger and unlayered styles are strongest. For important declarations the whole order reverses: earlier layers are stronger, and unlayered `!important` becomes the weakest important author declaration there is. Put differently, your reset layer is the quietest place for normal rules and the loudest place for important ones. Use that deliberately or avoid `!important` inside layers entirely."
    },
    {
      "t": "p",
      "x": "Layers also fix a problem that has nothing to do with specificity: source order you do not control. When two declarations tie, the last one in the final stylesheet wins, and that order comes out of your bundler's module graph. Add a component, reorder an import, switch bundlers, and the winner changes. Shipping a layer order makes the decision explicit and immune to that. `@layer` shipped across Chrome, Firefox and Safari during the first half of 2022; confirm current support against caniuse before you depend on it in a product with old-browser requirements."
    },
    {
      "t": "h2",
      "x": "Inline styles and the !important ladder"
    },
    {
      "t": "p",
      "x": "A normal declaration in a `style` attribute beats every selector-based normal author declaration, regardless of specificity. You cannot out-select it. What you can do is outrank it on importance: a stylesheet `!important` beats a normal inline style. Above that sits inline `!important`, which is in practice the strongest author declaration on the page and effectively unanswerable from a CSS file."
    },
    {
      "t": "p",
      "x": "This is why inline styles written by a third-party widget or an animation library are so frustrating. The honest fixes are not CSS fixes. Stop the code from writing the attribute, remove the property at runtime with `el.style.removeProperty('color')`, or pass the library a custom property it will consume instead of a literal value. Reaching for `!important` works for the one property, and quietly removes your ability to override it anywhere else later."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// What the element is carrying inline, property by property\nel.getAttribute('style');\nel.style.getPropertyPriority('color');  // \"important\" or \"\"\n\n// Remove rather than fight\nel.style.removeProperty('color');"
    },
    {
      "t": "h2",
      "x": "Custom properties do not play by specificity rules"
    },
    {
      "t": "p",
      "x": "Custom properties resolve by inheritance, and that is a different mechanism. The value an element sees is whatever the nearest ancestor that sets `--brand` set it to. Specificity decides which declaration wins *on a given element*, and nothing more. A heavily specific `html body:not(.x) { --brand: blue }` loses to a plain `.card { --brand: red }` for everything inside that card, because the card is closer. Proximity beats specificity across elements, always."
    },
    {
      "t": "p",
      "x": "The second trap is invalid at computed-value time. If `color: var(--nope)` cannot resolve and there is no fallback, the declaration does not fall back to the previous one in the cascade. It still wins, and the property becomes `unset`, which means inherited for inherited properties and the initial value for everything else. Your text goes transparent or black rather than reverting to the rule you expected. Provide a fallback: `var(--brand, #2563eb)`."
    },
    {
      "t": "h2",
      "x": "What to do instead of adding !important"
    },
    {
      "t": "p",
      "x": "Escalation is a trap because it is symmetrical. Every `!important` you add raises the bar for the next person, who adds theirs, and within a year the codebase has a layer of important declarations fighting each other with no tiebreaker left except source order. Ordered roughly from best to worst:"
    },
    {
      "t": "ul",
      "items": [
        "**Make the selector match correctly.** Far more often than not this is the entire fix.",
        "**Lower the rule that is beating you.** Replace an ID selector with a class, or wrap a default in `:where()` so it costs nothing. One change here removes the conflict for everyone.",
        "**Declare layer order.** `@layer reset, base, components, utilities` encodes the intent you were otherwise expressing through selector weight.",
        "**Duplicate a class to buy one point.** `.btn.btn { ... }` is (0,2,0) and matches exactly the same elements. It is a hack, but it is a legible, bounded one, and `:is(.btn.btn)` reads slightly better.",
        "**Add `!important`, and leave a comment saying what you were overriding.** Genuinely correct for third-party widget overrides and for single-purpose utility classes, which are the two cases where you really do mean *always*.",
        "**Add an ID or an inline style to win.** This is the move that produces the next bug report. Avoid it."
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "One legitimate use of !important worth knowing",
      "x": "Utility classes that express a single hard override (`.hidden { display: none !important }`) are a reasonable use, because a utility that silently loses to a component rule is worse than useless. Keep those in one place, keep them one property wide, and do not let the pattern spread to component styles."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Once the right rule applies, the next question is which layout model you should have used.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of problem in another layer: your value is correct, something else wins.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnose and fix CORS errors",
          "desc": "For when the stylesheet is not losing the cascade, it simply never loaded.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check in this order. Run `document.querySelectorAll('your selector').length` in the console; if it is zero, the selector is the bug. Then look at the Computed pane in DevTools: if the property is not listed there at all, the declaration was invalid and the browser discarded it silently. If it is listed but with another value, expand it to see which rule won and where it came from. Only after all three checks is specificity a plausible explanation."
        },
        {
          "q": "Do ten classes beat an ID in CSS?",
          "a": "No. Specificity is a three-part tuple compared left to right, not a single number, so the ID column is checked first and decides the comparison outright. (1,0,0) beats (0,10,0) and would beat (0,1000,0). The idea that classes accumulate into ID-level weight comes from the old habit of writing specificity as \"100 vs 10 vs 1\", which is a teaching shorthand rather than how the comparison works."
        },
        {
          "q": "How do I override an inline style without !important?",
          "a": "From a stylesheet, you cannot. A normal declaration in a `style` attribute outranks every selector-based normal author declaration regardless of specificity, so the only CSS answer is `!important`. The better answers are outside CSS: stop the code writing the attribute, remove the property at runtime with `el.style.removeProperty('color')`, or have the library write a custom property that your stylesheet consumes. Note that an inline style only wins for the exact properties it sets, so everything else is still yours."
        },
        {
          "q": "Does !important inside a cascade layer beat !important outside layers?",
          "a": "Yes, and this surprises almost everyone. Layer precedence inverts for important declarations: earlier layers win over later ones, and unlayered important declarations are the weakest important author declarations in the document. So `!important` in your `reset` layer outranks `!important` in `utilities`, which outranks `!important` in an unlayered file. The simplest way to stay sane is to keep `!important` out of layered CSS."
        },
        {
          "q": "Why does my !important not work?",
          "a": "Four usual reasons. Another `!important` is beating it on inline style, layer order or source order. A running CSS transition is in play, and transitions outrank even important declarations. The property does not apply to that element, so it wins and does nothing. Or the declaration is invalid, in which case `!important` on a broken value changes nothing at all. The Computed pane tells you which of the four it is in a few seconds."
        },
        {
          "q": "Should I use cascade layers or just keep specificity low?",
          "a": "Low specificity is still the foundation: single classes, no IDs for styling, `:where()` around defaults. Layers solve a different problem, which is precedence between whole groups of CSS that you did not write together, such as a reset, a vendor stylesheet, your components and your utilities. If you have ever been bitten by a bundler reordering imports and changing which rule won, layers are the fix for that specific pain. If your stylesheet is small and you control all of it, they buy you less."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-10",
  "updated": "2026-11-10",
  "author": "jackson",
  "related": []
};
