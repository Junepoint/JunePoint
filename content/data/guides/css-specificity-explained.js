module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important: why your rule loses",
  "eyebrow": "CSS",
  "description": "Specificity is step five of the cascade, not step one. Count it correctly, read cascade layers, and find the declaration that is actually winning.",
  "standfirst": "A struck-through declaration in DevTools has lost one of six cascade comparisons. This page tells you which one, in the order the browser checks them.",
  "keywords": [
    "css specificity",
    "cascade layers",
    "css important",
    "css rule not applying",
    "specificity calculator"
  ],
  "cardDesc": "Work out which cascade step your CSS rule lost at, and fix it without reaching for !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The cascade compares six things in a fixed order: origin and importance, encapsulation context, inline styles, cascade layers, specificity, then source order. Specificity is the fifth tie-breaker, not the first.",
        "Specificity is three numbers, `(ID, class, type)`, compared left to right. The columns never carry. Twenty class selectors lose to one `#id`.",
        "Unlayered author styles beat every `@layer`. For `!important` declarations that order flips and the earliest layer wins.",
        "An inherited value never competes on specificity. Any rule that matches the element directly beats a value inherited from an ancestor, including `* { color: red }`.",
        "`!important` does not add specificity. It moves the declaration into a higher band, where specificity and source order are compared all over again.",
        "A strike-through in DevTools means your declaration was beaten. A warning icon means it was never parsed, which is a different problem with a different fix."
      ]
    },
    {
      "t": "lede",
      "x": "The fast version: open the Computed pane rather than the Styles pane, expand the property, and read the list of declarations that matched. The winner is at the top with a link to the file and line. Everything below is what you wrote. The rest of this page explains how that order gets decided, and why the rule that wins is often less specific than the one that lost."
    },
    {
      "t": "h2",
      "x": "First prove it is a cascade problem at all"
    },
    {
      "t": "p",
      "x": "Three failures look exactly like a specificity loss and none of them are one. Each takes about ten seconds to rule out, and skipping them is how people end up adding `!important` to a rule that was never going to work."
    },
    {
      "t": "ul",
      "items": [
        "**The declaration was never parsed.** An unknown property or an invalid value is thrown away at parse time. `padding: 10` and `transform: translateX(20)` are both discarded because a non-zero length needs a unit. The declaration will be greyed out with a warning icon, not struck through.",
        "**The selector does not match.** `.card .title` and `.card.title` are one character apart and mean entirely different things. Paste the selector into the console as `document.querySelectorAll('.card.title')` and you will know in one line whether it matches anything on the page.",
        "**The property does not apply to that element.** `width` and `height` do nothing on a non-replaced inline element. `gap` does nothing outside flex, grid or multi-column layout. `z-index` does nothing on a statically positioned element that is not a flex or grid item. `position: sticky` does nothing if the nearest scrolling ancestor is not the one you think it is."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The element.style test",
      "x": "In DevTools, click the `element.style` block at the top of the Styles pane and type the declaration there. An inline style beats every selector-based author rule that is not marked important, so if the value still does not change, the problem is the property or the element, not the cascade. If it does change, you have a cascade fight on your hands and the sections below apply."
    },
    {
      "t": "h2",
      "x": "The cascade in the order the browser evaluates it"
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What it compares",
        "The surprise it causes"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "Highest to lowest: running transitions, browser `!important`, user `!important`, author `!important`, animations, author normal, user normal, browser normal",
          "A running transition or a filling animation outranks your normal rule, so the value looks frozen for no visible reason."
        ],
        [
          "2. Encapsulation context",
          "Outer tree against shadow tree",
          "For normal declarations the outer document wins. For important declarations the shadow tree wins, which is the opposite of what most people assume."
        ],
        [
          "3. Element-attached styles",
          "The `style` attribute against any selector",
          "A normal inline style beats `#id` selectors, but loses to an author `!important` rule, because importance was already settled in step one."
        ],
        [
          "4. Cascade layers",
          "Later layer beats earlier layer; unlayered beats layered",
          "A one-class unlayered rule beats a long `#id .a .b` rule sitting in a layer."
        ],
        [
          "5. Specificity",
          "`(ID, class, type)` compared left to right",
          "People add class selectors expecting them to eventually outweigh an ID. They never do."
        ],
        [
          "6. Order of appearance",
          "The last matching declaration wins",
          "Bundle order, `@import` position and CSS-in-JS injection order decide it, and none of those are visible in your source file."
        ]
      ],
      "caption": "Each row only runs if the row above produced a tie. The browser stops at the first difference."
    },
    {
      "t": "p",
      "x": "That ordering explains most of the confusing cases. Specificity is never compared across origins, never compared across layers, and never compared against an inline style. So when a short selector beats a long one, the usual answer is that they were never in the same contest."
    },
    {
      "t": "h2",
      "x": "Counting specificity without guessing"
    },
    {
      "t": "p",
      "x": "Specificity is three numbers. Count ID selectors in the first column. Count class selectors, attribute selectors and pseudo-classes in the second. Count type selectors and pseudo-elements in the third. Combinators and the universal selector contribute nothing. Compare left to right and stop at the first difference."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (ID, class, type) */\n\n*                      /* 0,0,0   the universal selector is free */\n:where(#app, .card)    /* 0,0,0   :where() always contributes zero */\nli                     /* 0,0,1 */\nli::marker             /* 0,0,2   a pseudo-element counts in the type column */\n.card                  /* 0,1,0 */\n[type='text']          /* 0,1,0   attribute selectors count as a class */\n:hover                 /* 0,1,0   and so do pseudo-classes */\n:nth-child(2)          /* 0,1,0 */\nli.card a::after       /* 0,1,3 */\n#main                  /* 1,0,0 */\n#main #nav .item       /* 2,1,0 */\n:is(#main, .card)      /* 1,0,0   the most specific argument sets the value */\n:not(.a, #b)           /* 1,0,0   :not() behaves the same way */\n:has(> img)            /* 0,0,1 */\na:where(.external)     /* 0,0,1   the wrapped class contributes nothing */\n\n/* 0,20,0 loses to 1,0,0. The columns do not carry. */"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` all take the specificity of their most specific argument, and that argument is counted by the normal rules. `:where()` is the escape hatch: it matches the same elements and contributes zero, which makes it the right wrapper for defaults you expect people to override. Browser support for `:has()` arrived in Firefox noticeably later than in Chrome and Safari, around late 2023, so check it against your support target before you rely on it."
    },
    {
      "t": "p",
      "x": "Native CSS nesting is where this catches people who have not read the spec. The `&` selector carries the specificity of `:is()` applied to the whole parent selector list, so a single ID anywhere in that list promotes every nested rule into the ID column."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* & behaves like :is(<parent selector list>) */\n\n#app, .card {\n  & .title { color: teal; }     /* 1,1,0, not 0,1,1 */\n}\n\n/* Wrapping the parent list in :where() keeps the nested rules cheap */\n:where(#app, .card) {\n  & .title { color: teal; }     /* 0,1,0 */\n}"
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer completely"
    },
    {
      "t": "p",
      "x": "Layers sort above specificity, so once a project uses `@layer` the specificity numbers only matter inside a single layer. Two consequences catch people out. The first is that unlayered styles win: anything outside a layer beats everything inside one, no matter how specific the layered selector is. The second is that layer order is set by first mention, not by where the rules live, which is why the one-line `@layer` statement at the top of an entry stylesheet is worth writing even when it looks redundant."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, at the top of the entry stylesheet. */\n@layer reset, vendor, base, components, utilities;\n\n@layer components {\n  #sidebar .nav-link { color: rebeccapurple; }   /* 1,1,0 */\n}\n\n/* Not in any layer, so it wins anyway. */\n.nav-link { color: teal; }                       /* 0,1,0 */"
    },
    {
      "t": "p",
      "x": "For important declarations the whole layer ordering is reversed. The earliest layer wins, and unlayered important declarations drop to the bottom of the author important band. This is deliberate: it means a reset layer can hold a genuinely non-negotiable rule, and it means `!important` in a utility layer does not silently become the strongest thing in the codebase."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base {\n  .btn { color: red !important; }     /* wins: earliest layer, important */\n}\n\n@layer theme {\n  .btn { color: blue !important; }\n}\n\n/* Unlayered important loses to every layered important declaration. */\n.btn { color: green !important; }"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "revert-layer",
      "x": "`revert-layer` rolls a property back to the value it would have had if the current layer did not exist, which is the clean way for a component layer to opt out of a theme without guessing at the original value. `revert` goes further and rolls back to the user or browser value. Layers themselves shipped across Chrome, Firefox and Safari during the first half of 2022; confirm the exact versions against caniuse before you drop a fallback."
    },
    {
      "t": "h2",
      "x": "What !important actually does"
    },
    {
      "t": "p",
      "x": "It moves one declaration into a higher band in step one. That is the whole mechanism. It adds no specificity, and inside the important band the browser runs through context, inline styles, layers, specificity and source order exactly as before. Two important declarations on the same property still fight, and the fight looks identical to the normal one."
    },
    {
      "t": "p",
      "x": "So an author `!important` can still lose. The things that beat it:"
    },
    {
      "t": "ul",
      "items": [
        "A running CSS transition on that property, which sits at the very top of the cascade. This is the common cause of a hover colour that refuses to change.",
        "A user or browser `!important` declaration. Rare in practice, but forced-colors modes and user stylesheets use it, which is one reason overriding colour with `!important` is risky for accessibility.",
        "An `!important` declaration in the `style` attribute, which beats important selector rules in the same origin.",
        "An `!important` declaration in an earlier cascade layer, or in any layer at all if yours is unlayered.",
        "A more specific important selector, or an equally specific important declaration that appears later in the final stylesheet order.",
        "Nothing, if you wrote it inside `@keyframes`, where `!important` is ignored entirely."
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The honest trade-off",
      "x": "`!important` is sometimes the correct tool: utility classes whose whole purpose is to win, and overrides of third-party CSS you do not control. It is almost never right in your own component CSS, because it leaves the next person one move from the end of the ladder. The cost is not aesthetic. It is that every future override has to be important too, and then those have to fight each other on source order, which is the hardest thing in CSS to reason about from a single file."
    },
    {
      "t": "h2",
      "x": "Problems that look like specificity and are not"
    },
    {
      "t": "h3",
      "x": "Inheritance loses to any direct match"
    },
    {
      "t": "p",
      "x": "Inheritance is not a declaration. It supplies a value only when nothing matched the element for that property. So a browser default that matches the element directly beats your inherited value, even though author styles outrank browser styles in step one. The two were never compared, because your rule produced no declaration for that element at all. Links staying blue after you set `color` on `body` is the classic version."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "body { color: #222; }        /* inherited by anything with no direct match */\n\n/* Simplified from the browser default: this matches the <a> itself,\n   so the <a> never inherits from body. */\na:any-link { color: blue; }\n\n/* The fix is a rule that matches the link, not a more specific body rule. */\na { color: inherit; }"
    },
    {
      "t": "h3",
      "x": "A later shorthand resets your longhand"
    },
    {
      "t": "p",
      "x": "A shorthand sets every longhand it expands to, including the ones you did not mention, which get their initial values. Nothing is struck through in a way that makes the cause obvious, because the two declarations have different names."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".panel {\n  background-color: #fff;\n  background: url('/grid.svg') no-repeat;  /* background-color is now transparent */\n\n  line-height: 1.6;\n  font: 1rem/1.2 system-ui;                /* line-height is now 1.2 */\n}\n\n/* all is the extreme case: this resets every property on the element */\n.reset { all: revert; }"
    },
    {
      "t": "h3",
      "x": "An animation or transition is holding the value"
    },
    {
      "t": "p",
      "x": "Animation declarations outrank normal author declarations, and transition declarations outrank everything while they run. An animation with `animation-fill-mode: forwards` keeps applying its final keyframe after it finishes, which looks permanent and is not coming from any rule you can find by searching for the property. Check the Animations panel in DevTools before you search the stylesheet again."
    },
    {
      "t": "h3",
      "x": "The at-rule condition is false"
    },
    {
      "t": "p",
      "x": "A `@media`, `@supports` or `@container` block that does not match contributes nothing, and a malformed media query evaluates as false rather than being ignored. `@media (min-width: 768)` has no unit, so the whole block silently never applies. `@import` is another quiet one: it is only honoured at the start of a stylesheet, after `@charset` and `@layer` statements but before any style rules, and an `@import` that drifts below a rule during a refactor is dropped without a console error."
    },
    {
      "t": "h3",
      "x": "The element is inside a shadow root"
    },
    {
      "t": "p",
      "x": "Selectors in your page stylesheet do not reach into a shadow tree. You can style the host element, anything the component exposes through `::part()`, and content you slot into it. If a web component or a library built on one is ignoring your CSS entirely, specificity is not the lever."
    },
    {
      "t": "h2",
      "x": "A debugging order that usually finds it in a minute"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Test it as an inline style first",
          "x": "Add the declaration to `element.style` in DevTools. If the value does not change, stop looking at selectors: the property is invalid, or it does not apply to this element, or an important rule or a transition is above you."
        },
        {
          "title": "Read the Computed pane rather than the Styles pane",
          "x": "Expand the property. You get every declaration that matched the element, in cascade order, each linked to its source. This answers 'what beat me' directly, which is not the same question as 'what rules match this element'."
        },
        {
          "title": "Tell a strike-through from a warning icon",
          "x": "Struck through means overridden, so go on to step four. A warning icon means the declaration never parsed, so fix the syntax instead. Greyed out without either usually means the property does not apply to the element."
        },
        {
          "title": "Search the built CSS, not just your source",
          "x": "The winner is often in vendor CSS, a layer you forgot about, or a file whose bundle position changed.",
          "code": "grep -rn 'border-radius' src/ | grep '!important'"
        },
        {
          "title": "Compare the two rules on the real criteria",
          "x": "In order: is one important and the other not, is one inline, are they in different layers, and only then count `(ID, class, type)`. If both are equal on all of that, it is source order and you are looking at a bundling question."
        },
        {
          "title": "Fix at the lowest level that works",
          "x": "Move the rule into the right layer, or put it later in the same layer, or make the selector match more precisely. Raising specificity with a repeated class such as `.btn.btn` works and is occasionally the pragmatic answer, but it is a loan against the next change."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Keeping specificity flat on purpose"
    },
    {
      "t": "ul",
      "items": [
        "Declare your layer order in one place, in the entry stylesheet, and import third-party CSS straight into a layer with `@import url('vendor.css') layer(vendor);` so it can never outrank your components.",
        "Put utilities in the last layer. They then win by layer order rather than by `!important`, which is the entire reason layers were added.",
        "Wrap defaults in `:where()`. A reset written as `:where(ul, ol) { margin: 0 }` is overridden by a single bare `ul` selector, with no fight.",
        "Do not style with IDs. One ID in a selector puts that rule permanently above anything built from classes, and the only replies are another ID or `!important`.",
        "Watch what nesting does to `&`. Flat nesting reads well and quietly multiplies specificity when the parent list contains anything expensive.",
        "Keep component CSS in a single layer so that within a component, source order is the only tie-breaker left. That is the one rule everybody on the team already understands."
      ]
    },
    {
      "t": "p",
      "x": "If the rule that is losing is a layout property, it is worth checking that the property applies to the formatting context you are actually in before blaming the cascade at all. Our [CSS Grid vs. Flexbox guide](/guides/css-grid-vs-flexbox/) covers the cases where `align-items` or `gap` is simply not a property of the container you set it on."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Because `!important` only moves the declaration into a higher band, where the same comparisons run again. Check, in order: a running transition on that property, an `!important` in the `style` attribute, an `!important` in an earlier cascade layer, a more specific important selector, and a later important declaration with equal specificity. Also check that the declaration parsed at all, since `!important` on an invalid value is still invalid."
        },
        {
          "q": "How do I calculate CSS specificity?",
          "a": "Count three numbers. First column: ID selectors. Second column: classes, attribute selectors and pseudo-classes. Third column: type selectors and pseudo-elements. Compare left to right and stop at the first difference. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, `:where()` always contributes zero, and inline styles sit outside this system entirely."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "An author rule with `!important` does override a normal inline style, because importance is compared before inline styles are considered. It does not override an inline style that is itself marked `!important`. That combination is close to unoverridable from a stylesheet, which is why `style=\"...!important\"` in generated markup is worth removing at the source."
        },
        {
          "q": "Is a selector with eleven classes more specific than one ID?",
          "a": "No. The three specificity columns are compared independently and never carry, so any selector with one ID beats any selector with none, whatever the class count. The common claim that specificity works like base 10 was never true in practice and is explicitly not how the specification defines the comparison."
        },
        {
          "q": "Why does my unlayered CSS override a rule inside @layer?",
          "a": "That is the defined behaviour. For normal declarations, unlayered author styles take precedence over every layer in the author origin, regardless of specificity. For important declarations it reverses and unlayered styles have the lowest priority. If you want a stylesheet to participate in layer ordering, it has to be in a layer, including third-party CSS pulled in with `@import url('vendor.css') layer(vendor)`."
        },
        {
          "q": "Should I add !important or make the selector more specific?",
          "a": "Usually neither. Prefer moving the rule into the correct cascade layer, or later within its layer, because that fixes the ordering without raising the floor for future changes. If layers are not in the codebase yet, a duplicated class such as `.btn.btn` is the smaller of the two bad options, since it stays inside the specificity system instead of jumping bands. Save `!important` for utilities and for overriding CSS you do not control."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which module describes your layout, and the sizing traps in each.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The other common case of a value that refuses to change on screen.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-18",
  "updated": "2026-11-18",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
