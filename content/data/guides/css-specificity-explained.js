module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity: Why Your Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "How specificity is counted, where cascade layers, inline styles and !important sit in the cascade, and the parse errors that silently drop a declaration.",
  "standfirst": "A rule that does nothing has either lost a cascade comparison, never matched the element, or been thrown away before the comparison happened. These are three different problems with three different fixes.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "override important css",
    "css cascade order"
  ],
  "cardDesc": "Count specificity correctly, then work down the cascade: layers, inline styles, !important and dropped declarations.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check matching before specificity. If your selector is absent from the DevTools Styles pane, it never matched, and adding classes will not help.",
        "Specificity is three numbers compared left to right: ids, then classes and attributes and pseudo-classes, then element types and pseudo-elements. Eleven classes do not beat one id.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument.",
        "Cascade layers outrank specificity. A later layer wins over an earlier one, and unlayered normal rules beat every layered normal rule.",
        "`!important` reverses layer order, so the *first* layer wins among important declarations and unlayered important rules are the weakest author ones.",
        "A declaration with a misspelled property, an invalid value, or an undefined `var()` is discarded rather than outranked. The symptom looks identical."
      ]
    },
    {
      "t": "p",
      "x": "Most of the time the rule is not losing a specificity contest. Either the selector does not match the element, or the browser dropped the declaration at parse time and nothing ever competed. Work out which of the three cases you are in first. Specificity arithmetic on a selector that never matched is wasted effort."
    },
    {
      "t": "h2",
      "x": "Check that the rule matches at all"
    },
    {
      "t": "p",
      "x": "Select the element in DevTools and read the Styles pane. Every rule that matches is listed there, roughly in cascade order, with overridden declarations struck through. That splits your problem cleanly. If your selector appears and its declaration is struck through, it matched and lost, and the cascade sections below explain the loss. If your selector is not in the list, it never matched the element, and the fix is in the selector or the markup."
    },
    {
      "t": "p",
      "x": "Selectors that read correctly but match nothing usually fail for structural reasons. A child combinator such as `.menu > .item` breaks the moment a framework inserts a wrapper div. A sibling combinator breaks when the order changes. Attribute selectors compare values case sensitively unless you add the `i` flag, so `[data-state=\"Open\"]` and `[data-state=\"open\"]` are two different selectors. A rule inside `@media (min-width: 900px)` is simply not there at 860px, and a rule inside a mistyped `@supports` condition is never there at all."
    },
    {
      "t": "p",
      "x": "There is one failure mode that catches people repeatedly: an invalid selector poisons its whole selector list. If any selector in a comma-separated list is not understood, the browser discards the entire rule, including the parts it did understand."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One unknown pseudo-element kills the whole block. */\n.search-input::-webkit-input-placeholder,\n.search-input::-some-invented-thing {\n  color: #888;   /* never applies anywhere */\n}\n\n/* Forgiving selector lists survive. :is() and :where() ignore\n   arguments they do not understand. */\n.search-input:is(::-webkit-input-placeholder, .fallback) {\n  color: #888;\n}\n\n/* Safest: split vendor-specific selectors into separate rules. */\n.search-input::placeholder { color: #888; }"
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a tuple of three counts. Ids go in the first column. Classes, attribute selectors and pseudo-classes go in the second. Element type selectors and pseudo-elements go in the third. Universal selectors and combinators count for nothing."
    },
    {
      "t": "p",
      "x": "The columns are compared left to right and the comparison stops at the first difference. There is no carrying between columns. Eleven classes, specificity (0,11,0), still lose to a single id, specificity (1,0,0). The base-256 overflow behaviour that old browsers had is history, so do not plan around it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "button                          { }  /* (0,0,1) */\n.btn                            { }  /* (0,1,0) */\nbutton.btn[disabled]            { }  /* (0,2,1) */\n#checkout .btn                  { }  /* (1,1,0) */\n#checkout                       { }  /* (1,0,0) */\n\n/* :where() always contributes zero */\n:where(#checkout, .modal) .btn  { }  /* (0,1,0) */\n\n/* :is(), :not() and :has() take their most specific argument */\n.card :is(#main, .sidebar)      { }  /* (1,1,0) */\n.card:not(.featured)            { }  /* (0,2,0) */\n.row:has(> #total)              { }  /* (1,1,0) */\n\n/* Inside :nth-child(), the \"of S\" selector counts too */\nli:nth-child(2 of .visible)     { }  /* (0,2,1) */"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Zero-specificity defaults",
      "x": "`:where()` is the practical tool here. Write library or reset styles as `:where(.card) h2 { ... }` and any single class in consuming code can override them. It is the opposite move to `!important`: instead of making your rule unbeatable, you make it trivially beatable on purpose."
    },
    {
      "t": "p",
      "x": "When two declarations have equal specificity, the later one in source order wins. Source order means the order the browser saw the declarations, which is not always the order you think. A bundler that hoists imports, a `<style>` tag injected at runtime by a component library, or a stylesheet loaded second in the document head all change the answer without changing any selector. If a rule works locally and loses in production, compare the order of the loaded stylesheets before suspecting anything subtler."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity entirely"
    },
    {
      "t": "p",
      "x": "`@layer` is the part that surprises people who learned the cascade before 2022. Layer order is compared *before* specificity, not after. Specificity only breaks ties between declarations in the same layer. Declare your layer order once, near the top of your CSS, and the ordering holds no matter where the rules themselves are written."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, components, utilities;\n\n@layer components {\n  #sidebar .btn { background: navy; }   /* (1,1,0) */\n}\n\n@layer utilities {\n  .bg-white { background: white; }      /* (0,1,0) wins: later layer */\n}\n\n/* Unlayered normal rules behave as the last, highest-priority layer. */\n.btn { background: hotpink; }           /* wins over both of the above */"
    },
    {
      "t": "p",
      "x": "So a layered rule with an id selector loses to an unlayered rule with one class. That is working as designed, and it is why mixing layered and unlayered CSS in the same codebase gets confusing fast. Pick one approach. If you adopt layers, put everything in a layer, including third-party CSS pulled in with `@import url(...) layer(vendor)`."
    },
    {
      "t": "p",
      "x": "Layers also give you a cleaner undo. `revert-layer` on a property rolls it back to the value it would have had from earlier layers, which is more precise than `revert` (back to the previous origin) or `unset`. Browser support for `@layer` has been broad since early 2022, but verify against current browser support data for your own baseline before you rely on it."
    },
    {
      "t": "h2",
      "x": "Where inline styles and !important sit"
    },
    {
      "t": "p",
      "x": "Importance and origin are compared before everything else, including layers. The full ordering, from the declaration that wins to the one that loses:"
    },
    {
      "t": "table",
      "head": [
        "Priority",
        "Declaration"
      ],
      "rows": [
        [
          "1 (wins)",
          "A declaration from a running CSS transition"
        ],
        [
          "2",
          "`!important` in browser (user agent) styles"
        ],
        [
          "3",
          "`!important` in user styles, for example an accessibility stylesheet"
        ],
        [
          "4",
          "`!important` in author styles, your CSS"
        ],
        [
          "5",
          "A declaration from a running CSS animation"
        ],
        [
          "6",
          "Normal author styles, your CSS"
        ],
        [
          "7",
          "Normal user styles"
        ],
        [
          "8 (loses)",
          "Normal browser (user agent) styles"
        ]
      ],
      "caption": "Cascade sorting by origin and importance. Only when two declarations tie here do context, inline styles, layers, specificity and source order get consulted."
    },
    {
      "t": "p",
      "x": "Two consequences are worth internalising. First, a declaration inside a running animation beats your normal rule, so a transform that will not budge may be owned by a keyframe rather than by another selector. Second, `!important` does not raise specificity. It moves the declaration into a different bucket, and within that bucket the normal rules of layers, specificity and source order apply again."
    },
    {
      "t": "p",
      "x": "Importance also reverses layer order. Among important author declarations, the *earliest* layer wins, and unlayered important declarations are the weakest of the set. This is deliberate: it lets a reset layer hold a line that utility CSS cannot cross. It is also the single easiest thing to get backwards when debugging."
    },
    {
      "t": "p",
      "x": "Inline `style` attributes sit above all author rules of the same importance, so a normal inline style beats a normal rule with ten ids. An author `!important` rule beats a normal inline style. An inline style that is itself marked `!important` beats author `!important` rules, which is why overriding a third-party widget that writes inline styles from JavaScript usually ends in `!important` whether you like it or not."
    },
    {
      "t": "h2",
      "x": "Declarations that were discarded, not outranked"
    },
    {
      "t": "p",
      "x": "This category produces the most time wasted, because the symptom is identical to losing the cascade and the cause is nowhere in the cascade. Browsers drop a declaration they cannot parse, silently, and carry on with the rest of the rule."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  font-color: red;        /* no such property; dropped at parse time */\n  width: 50px%;           /* invalid value; dropped */\n  color: black;\n  color: var(--brand);    /* --brand is never defined */\n}\n\n/* Shorthands reset longhands you set earlier. */\n.card {\n  background-image: url(hero.jpg);\n  background: #fff;       /* resets background-image to none */\n}"
    },
    {
      "t": "p",
      "x": "The `var()` case has a sharp edge. An undefined custom property with no fallback makes the declaration invalid at computed-value time, which is handled differently from a parse error: the property becomes `unset` instead of falling back to the previous declaration. Because `color` is inherited, that element inherits its parent's color. It does not go back to `black`. Give custom properties a fallback, `color: var(--brand, black)`, or register them with `@property` so an invalid value falls back to the registered initial value."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Non-inherited properties and the wrong element",
      "x": "Setting `display: flex` on a parent and then wondering why `align-self` on a grandchild does nothing is a matching problem wearing a cascade costume. Most layout properties are not inherited, and flex item properties only apply to direct children of the flex container. The declaration is applying. It just has no effect on that element."
    },
    {
      "t": "h2",
      "x": "A diagnostic order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "Look for your rule in the DevTools Styles pane. Not present means it did not match. You can also test the selector against the live DOM from the console."
        },
        {
          "title": "Check for a dropped declaration",
          "x": "DevTools marks invalid properties and values with a warning icon. A declaration that is present, unstruck, and still not applied is almost always invalid at computed-value time, usually an undefined `var()`.",
          "code": "document.querySelectorAll('.menu > .item').length  // 0 means the selector is the problem\ngetComputedStyle($0).getPropertyValue('--brand')  // empty string means it is not defined"
        },
        {
          "title": "Read the winner, not your rule",
          "x": "The Computed tab shows the value that won and which rule supplied it. Expand the property to see the full list of competing declarations in priority order. Fix the winner or outrank it deliberately."
        },
        {
          "title": "Identify the bucket",
          "x": "Is the winner inline? Important? From an animation or a browser default? Each of those needs a different response, and only one of them is answered by a longer selector."
        },
        {
          "title": "Compare layers before specificity",
          "x": "If the project uses `@layer`, find which layer each rule is in. A later layer beats an earlier one for normal declarations, and the relationship flips for important ones."
        },
        {
          "title": "Only then count specificity",
          "x": "If both declarations are normal, unlayered and in the same origin, now the three-column comparison decides it, and source order breaks a tie."
        }
      ]
    },
    {
      "t": "p",
      "x": "If you use `@scope`, add one more consideration: when two scoped rules match the same element, the rule whose scope root is the nearer ancestor wins, and that proximity check applies before source order. Support arrived in Chromium and Safari ahead of other engines, so check current browser support data before depending on it (November 2026)."
    },
    {
      "t": "h2",
      "x": "When !important is the right answer"
    },
    {
      "t": "p",
      "x": "The honest answer is that it is sometimes the only tool available. Overriding a third-party widget that sets inline styles from JavaScript, or a print stylesheet that must force black text, are legitimate uses. Utility-first frameworks have shipped important utilities for years for the same reason."
    },
    {
      "t": "p",
      "x": "The cost is that it is contagious. One `!important` forces the next person to use one, and specificity wars escalate from there because the normal ordering tools stop working. Before reaching for it, try the two cheaper moves: put the rule in a later layer, or lower the specificity of the rule that is winning by wrapping its selector in `:where()`. Both keep the cascade legible. `!important` wins the argument and ends the conversation."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module to reach for, and why 1fr tracks overflow.",
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
          "desc": "The same class of bug one layer up: the code runs, the result is stale.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check whether the rule appears in the DevTools Styles pane for that element. If it is missing, the selector did not match: a wrapper element broke a child combinator, a media query is not active, or an invalid selector elsewhere in the same comma-separated list caused the browser to discard the whole rule. If it appears but is struck through, it matched and lost the cascade. If it appears unstruck and still has no visible effect, the declaration is probably invalid, often an undefined `var()`."
        },
        {
          "q": "How do I override an !important declaration?",
          "a": "With another important declaration that outranks it. Options, from least to most disruptive: put your important rule in an earlier cascade layer, since importance reverses layer order; match the selector with equal or higher specificity in a later rule and mark it important; or set it as an important inline style, which beats author important rules. A user stylesheet marked important outranks all author CSS, but that is a browser-level setting, not something a site can do."
        },
        {
          "q": "Does an inline style always win?",
          "a": "No. A normal inline style beats every normal author rule regardless of specificity, but an author rule marked `!important` beats a normal inline style. An inline style marked `!important` beats author important rules in turn. Transitions and important browser or user styles still sit above it."
        },
        {
          "q": "Do eleven classes beat one id in CSS?",
          "a": "No. The three specificity columns are compared independently from left to right, so (1,0,0) beats (0,11,0) because the id column differs and the comparison stops there. Some very old browsers used base-256 arithmetic that could overflow, but no current engine does."
        },
        {
          "q": "How do cascade layers interact with !important?",
          "a": "They invert. For normal declarations, later layers win and unlayered rules win over all layered rules. For important declarations, earlier layers win and unlayered important rules are the weakest author declarations. This is what lets a low-level reset layer declare something important that a utilities layer cannot override."
        },
        {
          "q": "Is there a way to make my CSS easier to override later?",
          "a": "Yes, and it is worth doing in shared or library code. Wrap selectors in `:where()` so they contribute zero specificity, and publish your styles inside a named `@layer` so consumers can order their own CSS after it. Both let someone override you with a single plain class instead of escalating."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-16",
  "updated": "2026-11-16",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
