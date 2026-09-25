module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying: Specificity & Layers",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "How browsers really count CSS specificity, where cascade layers sit above it, what !important reverses, and the checks to run before you blame any of them.",
  "standfirst": "Prove the selector matches first. Then count specificity the way the browser does, check which cascade layer your rule landed in, and use !important only when nothing cheaper works.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "important css override",
    "specificity calculator",
    "css not working"
  ],
  "cardDesc": "Count specificity correctly, see where cascade layers override it, and reach for !important last.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Most \"my CSS is not applying\" bugs are not specificity. Confirm the selector matches and the declaration is not struck through or greyed out in DevTools before you rewrite anything.",
        "Specificity is three numbers compared left to right: IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements. `(1,0,0)` beats `(0,99,0)`. Nothing carries between columns.",
        "`:where()` scores zero. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument. That is the cheapest way to make a selector weigh less without touching your HTML.",
        "Cascade layers are checked **before** specificity. A `(0,1,0)` rule in a later layer beats a `(1,1,1)` rule in an earlier one, and unlayered styles beat every normal layered style.",
        "`!important` flips layer order and outranks inline styles. `revert-layer`, `revert` and a `:where()` rewrite usually solve the same problem with less collateral damage."
      ]
    },
    {
      "t": "lede",
      "x": "The rule you wrote is probably fine. Something else won, or your selector never matched anything at all, or the browser threw your declaration away because one character in the value was wrong. These are three very different bugs and they look identical from the outside: the element on screen is the wrong color."
    },
    {
      "t": "h2",
      "x": "First, check whether the rule matches at all"
    },
    {
      "t": "p",
      "x": "Open DevTools and select the element. In the Styles panel, a declaration that lost the cascade is shown struck through. A declaration the parser rejected is greyed out, often with a warning triangle. If your rule does not appear in the panel in any form, it never matched, and no amount of specificity will help."
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** A typo, a stale class name, a descendant combinator where you meant a child combinator, or markup that a framework renders differently from what you expect. Paste the selector into `document.querySelectorAll()` in the console and count the results.",
        "**The value is invalid, so the whole declaration is dropped.** `width: 100px;` with a missing unit, an unknown function, a color typo. CSS discards bad declarations silently and keeps parsing.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements. Setting `margin-top` on a table cell does nothing. A flex item ignores `float`.",
        "**The property is not inherited.** `border` on a parent does not reach the child. Only a specific set of properties inherit, mostly typography-related ones.",
        "**A shorthand later in the file reset it.** `background: red` written after `background-image: url(...)` wipes the image, because the shorthand sets every sub-property.",
        "**The stylesheet did not load.** Check the Network panel for a 404, a MIME type the browser refused, or a cross-origin fetch that failed."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The Computed tab is faster than reading source",
      "x": "In Chrome and Firefox, the Computed panel lists the final value of every property and lets you expand it to see which rule produced it, plus every rule that lost. It answers \"what actually won\" directly, without you tracing the cascade by hand."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a tuple of three counters, usually written `(A,B,C)`. A is the number of ID selectors. B counts class selectors, attribute selectors and pseudo-classes. C counts type selectors and pseudo-elements. Comparison runs left to right and stops at the first difference. One ID beats any number of classes, because the browser never gets past column A."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Specificity",
        "Why"
      ],
      "rows": [
        [
          "`a`",
          "(0,0,1)",
          "One type selector. Combinators and the universal selector `*` contribute nothing."
        ],
        [
          "`.link`",
          "(0,1,0)",
          "Classes land in the middle column."
        ],
        [
          "`[href^='https']`",
          "(0,1,0)",
          "Attribute selectors weigh the same as a class."
        ],
        [
          "`:hover`",
          "(0,1,0)",
          "Regular pseudo-classes weigh the same as a class."
        ],
        [
          "`li::before`",
          "(0,0,2)",
          "Pseudo-elements count in the type column, not the class column."
        ],
        [
          "`#nav`",
          "(1,0,0)",
          "IDs sit in the leftmost column on their own."
        ],
        [
          "`#nav .item a`",
          "(1,1,1)",
          "One ID, one class, one type."
        ],
        [
          "`.nav .list .item a.link`",
          "(0,4,1)",
          "Four classes and a type, and it still loses to `#nav` on its own."
        ],
        [
          "`:where(.sidebar) a`",
          "(0,0,1)",
          "`:where()` zeroes out everything inside it."
        ],
        [
          "`:is(#main, .main) p`",
          "(1,0,1)",
          "`:is()` adopts its most specific argument, so the ID counts."
        ],
        [
          "`:not(.active)`",
          "(0,1,0)",
          "The pseudo-class is free; its argument is counted."
        ],
        [
          "Inline `style` attribute",
          "not applicable",
          "Inline styles are a separate cascade step above specificity, not a fourth number."
        ]
      ],
      "caption": "Specificity of common selectors. Compare tuples column by column, never as a decimal number."
    },
    {
      "t": "p",
      "x": "The old habit of adding up specificity as `100 / 10 / 1` works until it does not. Eleven chained classes score `(0,11,0)`, which some mental models round to 110 and call a winner against a single ID at 100. The browser disagrees. It compares `0` against `1` in the first column and stops there."
    },
    {
      "t": "p",
      "x": "CSS nesting follows the same logic as `:is()`. A nested `&` takes the specificity of the most specific selector in the parent list, which means nesting inside `#app, .app` silently gives every nested rule an ID's worth of weight. If you nest, keep the outermost selector as cheap as you can."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Both target the same button. The second one loses. */\n#app .toolbar button { background: navy; }   /* (1,1,1) */\n.toolbar .toolbar-button.is-primary { background: crimson; } /* (0,3,0) */\n\n/* Make the first one cheap instead of making the second one expensive */\n:where(#app .toolbar) button { background: navy; } /* (0,0,1) */"
    },
    {
      "t": "h2",
      "x": "Where specificity sits in the cascade"
    },
    {
      "t": "p",
      "x": "Specificity is one step in a longer sort, and it is closer to the end than most people assume. The browser works through these in order and stops as soon as one of them separates the candidates:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author styles beat user styles beat browser defaults, and every `!important` flips the pairing it belongs to.",
        "**Context.** Styles from outside a shadow tree versus styles inside it.",
        "**Element-attached styles.** The `style` attribute, which outranks every normal declaration from a stylesheet regardless of selector.",
        "**Cascade layers.** Later-declared layers win, and unlayered styles win over all of them.",
        "**Specificity.** The three-column comparison above.",
        "**Order of appearance.** The last matching declaration in source order wins the tie."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences fall out of that order. First, an author `!important` declaration beats a normal inline style, because importance is settled in step one and inline styles are only step three. Second, if a rule in a later cascade layer is winning, its specificity is irrelevant, and rewriting your selector to add another class accomplishes nothing at all."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Animations and transitions are not in the specificity race",
      "x": "Declarations produced by a running `@keyframes` animation override normal author declarations, and an in-flight transition overrides essentially everything, including `!important`. If a value looks correct in the Styles panel but the rendered element disagrees for a fraction of a second, suspect a transition rather than a selector."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer"
    },
    {
      "t": "p",
      "x": "`@layer` lets you set precedence by declaration order instead of by selector weight. You name the layers once, in the order you want them to win, and after that a plain class selector in a later layer beats an ID selector in an earlier one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order up front. Later layers win. */\n@layer reset, vendor, base, components, utilities;\n\n@layer base {\n  #app .card h2 { color: navy; }   /* (1,1,1) */\n}\n\n@layer components {\n  .card-title { color: crimson; }  /* (0,1,0) */\n}\n\n/* crimson wins. Layer order is checked before specificity,\n   so the ID never gets compared. */"
    },
    {
      "t": "p",
      "x": "Unlayered styles are the part that surprises people. Any normal declaration written outside a layer beats every normal declaration inside one, no matter how the layers are ordered. That is deliberate: it lets you drop a third-party stylesheet into a low-priority layer and keep your own unlayered code on top. It also means a stray rule you forgot to wrap in `@layer` will quietly override your carefully ordered utilities."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer components {\n  .btn { padding: 1rem; }\n}\n\n.btn { padding: 0; }   /* unlayered, and it wins */"
    },
    {
      "t": "p",
      "x": "Importing a vendor stylesheet straight into a layer is the main practical payoff. `@import url('bootstrap.css') layer(vendor);` puts every rule in that file, IDs and all, below anything you write in a later layer. No `!important`, no selector arms race."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "For important declarations the layer sort runs backwards: the **earliest** layer wins, and unlayered important declarations rank lowest of all. So `@layer base { .x { color: red !important } }` beats `@layer overrides { .x { color: blue !important } }`. Mixing `!important` with layers is the fastest way to build something nobody can reason about."
    },
    {
      "t": "p",
      "x": "Support has been broad since early 2022, with cascade layers shipping in Chrome 99, Firefox 97 and Safari 15.4 (verify against caniuse.com for the browser range you actually support, and check whether your build tooling rewrites or inlines `@layer` before it reaches the browser). Tailwind CSS v4 builds on native layers, which is worth knowing if you are debugging why a utility class suddenly stops overriding a component style after an upgrade."
    },
    {
      "t": "h2",
      "x": "Using !important without regret"
    },
    {
      "t": "p",
      "x": "`!important` is not forbidden. It is just blunt, and it escalates: the only reliable way to beat one is another one further up the ladder. A few places where it is the correct tool:"
    },
    {
      "t": "ul",
      "items": [
        "**Utility classes** whose entire job is to be the final word. `.hidden { display: none !important }` is defensible, though a late cascade layer does the same job with less noise.",
        "**Overriding a third-party widget** that writes inline styles from JavaScript and gives you no hook to configure it. Author `!important` beats a normal inline style, and it is often the only lever you have.",
        "**Accessibility and print overrides**, where you genuinely want to win against everything the page might do.",
        "**A debugging probe.** Add it temporarily to confirm the element is the one you think it is, then take it out."
      ]
    },
    {
      "t": "p",
      "x": "Before reaching for it, try the cheaper escape hatches. `revert-layer` rolls a property back to whatever the previous layer set, which is far more surgical than winning outright. `revert` rolls back to the browser default. `all: revert` resets an element to user-agent styling in one line, which is useful when you are dropping your own component into a hostile page."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer components {\n  .card { border: 1px solid #ccc; padding: 1rem; }\n}\n\n@layer overrides {\n  /* Take back just the border, keep the padding */\n  .card { border: revert-layer; }\n}"
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element and the match",
          "x": "Select the element in DevTools. Run your selector through `querySelectorAll` and check the count is what you expect. If it is zero, stop here: the bug is in the selector or the markup, not the cascade.",
          "code": "document.querySelectorAll('.card > .title').length"
        },
        {
          "title": "Look for a struck-through or greyed declaration",
          "x": "Struck through means it lost the cascade. Greyed out with a warning means the parser rejected the value and threw the declaration away. These need completely different fixes.",
          "code": ""
        },
        {
          "title": "Find the winner in the Computed tab",
          "x": "Expand the property and read the rule that is on top. Note its selector, its file and, if the panel shows one, its cascade layer. That tells you which sort step you are losing at.",
          "code": ""
        },
        {
          "title": "Ask which step decided it",
          "x": "Different layer? Selector rewrites will not help; move your rule to a later layer. Same layer, different specificity? Compare the tuples. Identical specificity? The later rule in source order won, so check your bundle order rather than your CSS.",
          "code": ""
        },
        {
          "title": "Fix at the lowest level that works",
          "x": "In rough order of preference: reorder or relayer, lower the winning selector's weight with `:where()`, match its specificity, then use `revert-layer`. `!important` is the last option, not the first.",
          "code": ":where(.legacy-theme) .card { color: inherit; }"
        },
        {
          "title": "Check the non-cascade suspects",
          "x": "If the winning rule is yours and still does nothing, the property may not apply to that element, may be overridden by a transition or animation, or may be blocked by a shadow boundary. Elements inside an open shadow root ignore outer selectors unless you go through `::part()` or inherited custom properties.",
          "code": ""
        }
      ]
    },
    {
      "t": "h2",
      "x": "Design so you rarely have to do this"
    },
    {
      "t": "p",
      "x": "The teams who spend the least time on specificity fights tend to do the same handful of things. They keep selectors flat, mostly one class deep, so almost everything scores `(0,1,0)` and source order settles the rest. They avoid ID selectors in stylesheets entirely, keeping IDs for fragment links and JavaScript hooks. They wrap resets and vendor CSS in low layers on day one, because retrofitting layers into a mature codebase is much harder than starting with them."
    },
    {
      "t": "p",
      "x": "They also lean on custom properties for theming. A component that reads `color: var(--card-fg, #222)` can be retargeted by setting one property on an ancestor, which sidesteps the cascade argument completely: you are not competing for the same declaration, you are feeding it a different input. That single habit removes a surprising share of override pressure, and it composes with layers rather than fighting them."
    },
    {
      "t": "p",
      "x": "None of this is free. Flat selectors mean more class names in your markup, custom properties add indirection that can be hard to trace in DevTools, and cascade layers introduce a second ordering system that new contributors have to learn before they can safely add a rule. The trade is deliberate: a little more structure up front against the kind of bug where three people take turns adding `!important` to the same button."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Picking the right layout model removes a lot of the override pressure in the first place.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of bug on the JavaScript side: the code is right, something else won.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "How to diagnose and fix CORS errors",
          "desc": "Worth checking when the stylesheet or font never loaded at all.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three common reasons. Another `!important` is beating yours, either from a later rule at equal or higher specificity, from an inline `style` attribute that also carries `!important`, or from an earlier cascade layer (important declarations reverse layer order). A running transition or animation is overriding the computed value. Or the declaration is invalid and being discarded, in which case `!important` on a broken value changes nothing. Check the Computed tab to see what actually won before adding a second `!important`."
        },
        {
          "q": "Does an ID always override a class in CSS?",
          "a": "Within the same cascade layer and origin, yes. One ID selector scores `(1,0,0)` and beats any number of classes, because the comparison stops at the first column where the tuples differ. Outside that context it is not guaranteed: a class rule in a later cascade layer beats an ID rule in an earlier one, an unlayered class rule beats a layered ID rule, and an author `!important` on a class beats a normal ID rule."
        },
        {
          "q": "How do I override a rule without using !important?",
          "a": "In order of preference: move your rule into a later cascade layer, or wrap the offending selector in `:where()` so it scores zero, or match the winning selector's specificity and place your rule later in source order, or use `revert-layer` to roll back a single property. If the competing styles come from a third-party file, importing it with `@import url('vendor.css') layer(vendor)` puts the whole thing below your own code in one line."
        },
        {
          "q": "Do cascade layers beat specificity?",
          "a": "Yes. Layer order is compared before specificity, so it only falls through to the specificity comparison when both declarations are in the same layer. Later-declared layers win for normal declarations, and unlayered normal declarations beat everything inside a layer. For `!important` declarations the order reverses, with the earliest layer winning and unlayered important declarations ranking lowest."
        },
        {
          "q": "Why does my inline style get overridden?",
          "a": "Because inline styles sit below importance in the cascade sort. Any author `!important` declaration from a stylesheet beats a normal inline style. A CSS animation or an in-flight transition will also override it. If you need an inline style to win against an author `!important`, the inline declaration has to carry `!important` too, though at that point you are usually better off fixing the stylesheet."
        },
        {
          "q": "What is the specificity of :is(), :where(), :not() and :has()?",
          "a": "`:where()` always contributes zero, no matter what is inside it, and the arguments of the others are still counted. `:is()`, `:not()` and `:has()` each take the specificity of their most specific argument, so `:is(#main, .main)` scores `(1,0,0)`. The pseudo-class syntax itself is free in all four cases. CSS nesting with `&` follows the `:is()` rule, which is why nesting under an ID quietly raises the weight of every rule inside."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-25",
  "updated": "2026-09-25",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
