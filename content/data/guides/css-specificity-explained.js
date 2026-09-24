module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying: matching, specificity, layers and !important",
  "eyebrow": "Guides",
  "description": "Work out why a CSS declaration loses: selector matching, the real specificity tuple, cascade layers, inline styles and where !important actually sits.",
  "standfirst": "Before you add another `!important`, find out which step of the cascade your rule is losing at. Most of the time it is not specificity.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "!important css",
    "css cascade order"
  ],
  "cardDesc": "Diagnose an overridden CSS declaration properly: matching, specificity, cascade layers and inline styles.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check first whether the declaration is struck through in DevTools. Struck through means it lost the cascade. Absent entirely means the selector never matched or the value was invalid.",
        "Specificity is a three-part tuple compared left to right, not a score. Eleven classes still lose to one `#id`.",
        "Cascade layers are compared **before** specificity. A bare `a { }` in a later layer beats `#nav .list .item a` in an earlier one.",
        "`!important` reverses layer order. The earliest layer wins, and unlayered important declarations rank below every layered one.",
        "`:where()` contributes zero specificity, which makes it the cleanest way to ship defaults that application code can override without a fight."
      ]
    },
    {
      "t": "p",
      "x": "The fastest diagnostic takes about four seconds. Inspect the element, find your selector in the Styles pane, and look at the declaration. If it is there with a line through it, another declaration won and everything below about the cascade applies. If the selector is not listed at all, the rule never matched this element, and no amount of specificity will help."
    },
    {
      "t": "h2",
      "x": "Rule out the boring failures first"
    },
    {
      "t": "p",
      "x": "Specificity gets blamed for a lot of bugs it did not cause. These are more common, and each one is faster to check than reasoning about the cascade:"
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** A typo, a class the framework renames at build time, a descendant combinator where you needed a child combinator, or a state class that is applied to a parent rather than the element.",
        "**The declaration is invalid, so the browser dropped it.** Parsing discards a single bad declaration and keeps the rest of the rule, silently. A missing unit (`width: 20`), a malformed color, or a property name your target browser has not shipped all vanish without a console message.",
        "**A shorthand later in the file reset your longhand.** `background: #fff` wipes out an earlier `background-image`. `font` resets `line-height`. This looks exactly like an override because it is one.",
        "**The property does not inherit.** Setting `border` on a wrapper does nothing for the child. Only a specific set of properties, mostly text-related, inherit by default.",
        "**A media or container query is not matching.** Worth checking at the exact viewport you are testing, not the one you assume.",
        "**The stylesheet is stale.** A dev server that did not rebuild, a cached file, or a CSS module hashed under a different name."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  color: red;      /* applied */\n  width: 20;       /* invalid: no unit, discarded at parse time */\n  colour: blue;    /* invalid: unknown property, discarded */\n  padding: 1rem;   /* applied */\n}"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Make the invalid ones visible",
      "x": "Chrome and Firefox both flag unparsed declarations in the Styles pane with a warning icon and usually a strike-through in a different style from a cascade override. Stylelint catches the same class of error before it reaches the browser, which is a better place to catch it."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is three numbers: ID selectors, then class-like selectors, then type-like selectors. Write it `(a,b,c)`. Browsers compare `a` first; only if `a` ties do they look at `b`, and only if `b` ties do they look at `c`. It is not base 10 and it never overflows."
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
          "`#nav`",
          "(1,0,0)",
          "One ID beats any quantity of classes."
        ],
        [
          "`.nav .item`",
          "(0,2,0)",
          "Two class selectors."
        ],
        [
          "`a[href^=\"https\"]`",
          "(0,1,1)",
          "Attribute selectors count at the class level."
        ],
        [
          "`li:first-child`",
          "(0,1,1)",
          "Pseudo-classes count at the class level."
        ],
        [
          "`li::marker`",
          "(0,0,2)",
          "Pseudo-elements count at the type level."
        ],
        [
          "`* > .item + .item`",
          "(0,2,0)",
          "The universal selector and all combinators contribute nothing."
        ],
        [
          "`:is(#nav, p)`",
          "(1,0,0)",
          "Takes the specificity of its most specific argument."
        ],
        [
          "`:not(.a, #b)`",
          "(1,0,0)",
          "Same rule as `:is()`. The negation itself is free."
        ],
        [
          "`:where(#nav, p)`",
          "(0,0,0)",
          "Always zero, whatever you put inside."
        ],
        [
          "`style=\"color: red\"`",
          "not a selector",
          "Ranks above every selector in your stylesheets."
        ]
      ],
      "caption": "Specificity of common selector shapes, written as (ID, class, type)."
    },
    {
      "t": "p",
      "x": "The tuple comparison is the part people get wrong. A rule with `(0,11,0)` loses to `(1,0,0)`. Old teaching material described specificity as points, with an ID worth 100 and a class worth 10, which produces the right answer often enough to be believed and the wrong answer exactly when you are debugging something hard."
    },
    {
      "t": "p",
      "x": "One more thing about how this resolves: the cascade runs per property, not per rule. A low-specificity rule that sets four properties still applies the three nobody else touched. When a single declaration goes missing while its neighbours land, you are looking at a targeted override of that one property, which is usually a shorthand or a utility class."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,0) */\n.button { background: #2563eb; }\n\n/* (0,2,0) beats the rule above */\n.card .button { background: #16a34a; }\n\n/* (1,0,0) beats both, forever */\n#checkout .button { background: #dc2626; }\n\n/* (0,1,0) again: :where() zeroes out the id */\n:where(#checkout) .button { background: #7c3aed; }"
    },
    {
      "t": "h2",
      "x": "Specificity is only step five"
    },
    {
      "t": "p",
      "x": "The cascade compares declarations through a sequence of steps, and it stops at the first step that produces a winner. Specificity sits near the bottom of that sequence. If two declarations differ at an earlier step, their selectors are irrelevant."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What is compared"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "Browser default, user stylesheet, your CSS, and whether a declaration carries `!important`."
        ],
        [
          "2. Context",
          "Shadow tree versus outer document. Only relevant if you ship web components."
        ],
        [
          "3. Element-attached styles",
          "A `style` attribute outranks every selector in a stylesheet of the same importance."
        ],
        [
          "4. Cascade layers",
          "Layer order decides. Unlayered normal declarations outrank all layers."
        ],
        [
          "5. Specificity",
          "The three-part tuple, compared left to right."
        ],
        [
          "6. Order of appearance",
          "Last one wins. The tiebreaker, not the starting point."
        ]
      ],
      "caption": "Simplified cascade sorting order. Comparison stops at the first step that separates two declarations."
    },
    {
      "t": "p",
      "x": "Step six explains a whole genre of bug. Two rules with identical specificity, and the one that wins is whichever the bundler emitted last. Change an import order, reorder a CSS module, split a chunk differently, and the page changes with no diff in any stylesheet you wrote. If a style flips between dev and production builds, look at output order before you look at anything else."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Where @scope fits",
      "x": "Newer cascade specs insert a scoping proximity step between layers and specificity, so a rule from a closer `@scope` root wins against a more distant one at equal layer. Support is still uneven across browsers as of September 2026, so check current browser support tables before relying on it."
    },
    {
      "t": "h2",
      "x": "Cascade layers change which question you are asking"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare a priority order up front and then stop caring about selector weight inside each bucket. Because layers are compared before specificity, a one-token selector in a later layer beats a deeply nested one in an earlier layer. That is the whole point: a third-party stylesheet with aggressive selectors can be confined to a low-priority layer and overridden with ordinary application CSS."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, at the top. Later layers win. */\n@layer reset, vendor, components, app;\n\n@layer vendor {\n  #sidebar .nav ul li a { color: rebeccapurple; }  /* (1,3,3) */\n}\n\n@layer app {\n  a { color: black; }                              /* (0,0,1) */\n}\n\n/* black wins: layer order is decided before specificity */"
    },
    {
      "t": "p",
      "x": "Two behaviours surprise people. First, anything outside a layer is treated as higher priority than every layer, for normal declarations. That is a sensible default for adopting layers incrementally, and it is also why moving a file into a layer can quietly demote it. Second, `!important` inverts the whole thing."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base      { p { color: red  !important; } }\n@layer overrides { p { color: blue !important; } }\n\n/* red wins. For important declarations the earliest layer outranks\n   the latest, and unlayered important declarations rank lowest. */"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The layer order is fixed by first mention",
      "x": "A layer's position is set the first time its name appears, not where its rules live. Declaring `@layer reset, vendor, app;` once at the top of your entry file is the reliable pattern. Scatter `@layer` blocks across files without that statement and the order depends on import sequence, which puts you back where you started."
    },
    {
      "t": "p",
      "x": "Layers landed in Chrome 99, Firefox 97 and Safari 15.4, which shipped in early 2022. Tailwind v4 registers its own layers natively rather than emulating them with the older directive syntax. Confirm both against your current versions and support matrix before you commit to the pattern."
    },
    {
      "t": "h2",
      "x": "Where !important really sits"
    },
    {
      "t": "p",
      "x": "`!important` is not a specificity bonus. It moves the declaration into a different importance bucket, and buckets are compared at step one. An important declaration in your stylesheet beats a normal inline `style` attribute, which is genuinely useful when a script is writing inline styles you do not control. It also beats a running CSS animation, because animation declarations rank below important author styles."
    },
    {
      "t": "p",
      "x": "It does not beat an inline `!important`. That combination is an important author declaration that also wins the element-attached step, so no stylesheet rule can outrank it. If a widget writes `style=\"display: none !important\"`, your CSS has lost; fix the markup or the script."
    },
    {
      "t": "p",
      "x": "There is one thing above all of it. Declarations from a running CSS transition beat everything, important declarations included, for the duration of the transition. A value that is correct after the animation settles but wrong during it is usually this, not a cascade problem."
    },
    {
      "t": "p",
      "x": "The honest trade-off: `!important` is fine in narrow, documented cases, and corrosive as a habit. Print stylesheets, accessibility overrides such as forced `prefers-reduced-motion` rules, and neutralising a vendor script are all reasonable. Reaching for it because a rule would not stick is how a codebase ends up with `!important` on both sides of the same property and no way to reason about either."
    },
    {
      "t": "h2",
      "x": "How to win without escalating"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Lower the loser instead of raising the winner",
          "x": "Find the rule that is beating you and wrap its heavy parts in `:where()`. The declarations still apply, they just stop dominating. This is the single highest-value refactor in a codebase with runaway selectors.",
          "code": "/* before: (1,2,1) */\n#app .sidebar .nav a { color: #333; }\n\n/* after: (0,0,1), same match, no weight */\n:where(#app .sidebar .nav) a { color: #333; }"
        },
        {
          "title": "Put third-party CSS in an early layer",
          "x": "Import vendor stylesheets directly into a layer. Everything you write afterwards outranks them regardless of how their selectors are built.",
          "code": "@layer reset, vendor, app;\n@import url(\"vendor-widget.css\") layer(vendor);"
        },
        {
          "title": "Use revert-layer to step back one level",
          "x": "`revert-layer` rolls a property back to the value it would have had from earlier layers, rather than to the initial value. `revert` goes further back, to the browser default.",
          "code": "@layer components { .btn { padding: 1rem 1.5rem; } }\n@layer app        { .btn.is-bare { padding: revert-layer; } }"
        },
        {
          "title": "Match the winner, then rely on source order",
          "x": "Two declarations at equal specificity resolve by position, so an equally specific rule placed later wins. It works, but it makes the file fragile: anything that reorders your bundle output reverses the result. Prefer layers if you have them."
        },
        {
          "title": "Only then consider !important",
          "x": "If you do use it, leave a comment saying which rule it is fighting and why the fight cannot be won another way. Future you will want that sentence."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Reading the answer in DevTools"
    },
    {
      "t": "p",
      "x": "The Styles pane lists matching rules in cascade order, strongest first, with overridden declarations struck through. Hover a struck-through declaration in Chrome and it will point you at the rule that beat it. The Computed pane is often faster: expand a property and it shows the winning declaration plus the ones it displaced, which answers the question directly without you having to scan the list."
    },
    {
      "t": "p",
      "x": "Two habits worth forming. Toggle the `:hov` state simulator before concluding that a hover rule does not work, because you cannot inspect a state you are not in. And check the element's `class` attribute in the Elements panel rather than in your source, since frameworks add, remove and hash classes at runtime, and the class you are styling may never reach the DOM."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the right layout model, which removes a surprising number of override fights.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "React useState not updating",
          "desc": "The same debugging discipline applied to state that looks like it is ignoring you.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check the color you are fighting over actually passes WCAG AA before you ship it.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Inspect the element and look for your selector in the Styles pane. If it is missing, the rule is not matching: check for a renamed or hashed class, a state class applied to the wrong element, or a stale build. If it is present but struck through, something outranked it. If it is present and the single declaration is struck through with a warning icon, the value is invalid and the browser discarded it, which happens silently with things like `width: 20` or an unknown property name."
        },
        {
          "q": "Can a class ever beat an ID in CSS?",
          "a": "Not on specificity alone, no matter how many classes you chain. It can win at an earlier step of the cascade: if the class rule is in a later cascade layer, or unlayered while the ID rule is layered, or carries `!important` while the ID rule does not. You can also neutralise the ID by wrapping it in `:where()`, which drops its contribution to zero while keeping the same match."
        },
        {
          "q": "How do I override an inline style?",
          "a": "Add `!important` to your stylesheet declaration. Important author declarations beat normal element-attached ones, so this works and it is one of the legitimate uses of the keyword. If the inline style itself has `!important`, author CSS cannot beat it at all, and your options are changing the markup, stopping the script that writes it, or removing the attribute from JavaScript."
        },
        {
          "q": "Is !important always bad practice?",
          "a": "No, but it is usually a symptom. Reasonable uses: print stylesheets, accessibility overrides such as disabling animation under `prefers-reduced-motion`, and neutralising inline styles from third-party widgets. Unreasonable use: reaching for it because a rule would not stick. That leads to important declarations on both sides of the same property, at which point the only tiebreaker left is source order and nobody can predict the outcome by reading the code."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically and group selector lists the same way. The difference is weight. `:is()` takes the specificity of its most specific argument, so `:is(#a, p)` counts as `(1,0,0)`. `:where()` always contributes zero. Use `:where()` for defaults and resets you want application code to override easily, and `:is()` when you want the grouping without giving up specificity."
        },
        {
          "q": "Why does my Tailwind utility class get overridden?",
          "a": "Usually because the competing rule is a multi-part selector that outweighs a single utility class, or because it sits outside a cascade layer while the utilities sit inside one. Look at what is winning in DevTools before changing anything. The important modifier exists as an escape hatch, with v3 prefixing the utility and v4 moving the `!` to the end, so check the syntax for the version you are actually running."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-24",
  "updated": "2026-09-24",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
