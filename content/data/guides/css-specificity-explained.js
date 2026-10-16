module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity, Cascade Layers and !important",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "A debugging order for CSS that will not apply: matching, invalid values, specificity, cascade layers, and what !important actually outranks.",
  "standfirst": "Specificity gets blamed for most of these failures and causes maybe half of them. Here is how to tell which half you are in before you reach for !important.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "Work out why a declaration lost: matching, invalid values, specificity, layers, and the !important reversal.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Three different bugs look identical on screen: the rule never matched, the declaration was thrown away as invalid, or it matched and lost the cascade. Only the third one is about specificity.",
        "Specificity is three counters compared left to right: IDs, then classes/attributes/pseudo-classes, then element types/pseudo-elements. Two hundred classes still lose to one ID.",
        "Cascade layers are compared **before** specificity. A single class in a later layer beats `#card .title` in an earlier one.",
        "For normal declarations, unlayered styles beat layered ones. For `!important` declarations that reverses: layered beats unlayered, and the *earliest* layer wins.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` contribute as much as their most specific argument.",
        "An author `!important` beats a `style=\"\"` attribute. A running CSS transition beats `!important`."
      ]
    },
    {
      "t": "h2",
      "x": "First work out which failure you have"
    },
    {
      "t": "p",
      "x": "Open the element in DevTools and look at the Styles pane. Your declaration is in one of three states, and each one points somewhere different."
    },
    {
      "t": "ul",
      "items": [
        "**Struck through, no icon.** It matched and lost. This is the cascade, and the rest of this page applies.",
        "**Struck through with a warning icon.** The property name or the value was not understood, so the browser discarded that one declaration and kept the rest of the rule. Nothing about specificity will help.",
        "**Not in the pane at all.** The selector never matched this element, or the stylesheet never arrived. Stop reasoning about weight and go look at the DOM and the Network tab."
      ]
    },
    {
      "t": "p",
      "x": "Four lines in the console separate those cases faster than reading the pane does."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const el = document.querySelector('[data-testid=\"card-title\"]');\n\nel.matches('.card > .title');      // false: the selector never had a chance\ngetComputedStyle(el).color;        // what actually won, inheritance included\ndocument.styleSheets.length;       // 0: nothing loaded, check the Network tab\nel.closest('[hidden]');            // the parent you forgot about"
    },
    {
      "t": "p",
      "x": "`el.matches()` is the one people skip, and it is the cheapest. A child combinator where you needed a descendant combinator, a class the framework renames at build time, a `<div>` that moved inside a wrapper last sprint: all of those return `false` here, and all of them are invisible if you go straight to counting selectors."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one score"
    },
    {
      "t": "p",
      "x": "The browser builds a triple for every selector, written here as (A, B, C). A counts ID selectors. B counts classes, attribute selectors and pseudo-classes. C counts element types and pseudo-elements. The comparison is lexicographic: compare A, and only if A ties do you look at B, and only if B ties do you look at C."
    },
    {
      "t": "p",
      "x": "That is why the familiar \"IDs are worth 100, classes 10, elements 1\" shortcut eventually lies to you. It agrees with the real rule for small selectors and disagrees once a column gets crowded. Count three columns instead and you never have to remember where the shortcut breaks."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "(A, B, C)",
        "Notes"
      ],
      "rows": [
        [
          "`*`",
          "0, 0, 0",
          "The universal selector and all combinators (`>`, `+`, `~`, whitespace) are free."
        ],
        [
          "`li`",
          "0, 0, 1",
          "Element type."
        ],
        [
          "`.active`",
          "0, 1, 0",
          "Same column as `[data-state=\"open\"]` and `:hover`."
        ],
        [
          "`li:nth-child(2)`",
          "0, 1, 1",
          "A pseudo-class is a B, the element is a C."
        ],
        [
          "`::before`",
          "0, 0, 1",
          "Pseudo-elements land in C, not B."
        ],
        [
          "`#main`",
          "1, 0, 0",
          "No number of classes reaches this."
        ],
        [
          "`#main .list li`",
          "1, 1, 1",
          "One of each."
        ],
        [
          "`:where(#main) .list`",
          "0, 1, 0",
          "`:where()` zeroes out everything inside it."
        ],
        [
          "`:is(#main, .fallback) .list`",
          "1, 1, 0",
          "Takes the weight of its *most* specific argument, `#main`."
        ],
        [
          "`li:not(.done)`",
          "0, 1, 1",
          "`:not()` is free itself but passes through its argument's weight."
        ],
        [
          "`.card:has(> img)`",
          "0, 1, 1",
          "`:has()` behaves like `:is()` for specificity."
        ]
      ],
      "caption": "Specificity of common selectors. Compare left to right and the first difference decides."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#nav a            { color: blue; }   /* 1,0,1 */\n.nav .link.is-on  { color: red;  }   /* 0,3,0 */\n\n/* The link is blue. A decides it at 1 vs 0, and B is never consulted. */"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The useful consequence of :where()",
      "x": "If you want a rule that consumers can override with a plain class, write it as `:where(.card) .title { … }` instead of `.card .title { … }`. Its weight becomes (0, 0, 1) and a single class on the title wins. This is how several design systems keep their defaults overridable without asking anyone to count selectors."
    },
    {
      "t": "h3",
      "x": "Nesting inherits the weight of the outer selector"
    },
    {
      "t": "p",
      "x": "Native CSS nesting resolves `&` to the weight of the *most* specific selector in the enclosing list, the same way `:is()` does. One ID in an outer selector list therefore raises every rule nested beneath it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#app, .fallback {\n  .title { color: red; }   /* 1,1,0, not 0,1,0 */\n}\n\n/* Sass would have flattened this to two separate selectors:\n   #app .title (1,1,0) and .fallback .title (0,1,1).\n   Moving a Sass codebase to native nesting can change weights. */"
    },
    {
      "t": "h2",
      "x": "Where specificity has nothing to do with it"
    },
    {
      "t": "p",
      "x": "Several failures get misdiagnosed as specificity problems often enough to check them before you count anything."
    },
    {
      "t": "h3",
      "x": "Inherited values never compete with matched ones"
    },
    {
      "t": "p",
      "x": "Inheritance is not part of the cascade. It is the fallback used when the cascade produced nothing for that element and that property. A weak rule that matches the element directly beats a strong rule that merely matched an ancestor."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#sidebar { color: navy; }   /* 1,0,0, inherited by descendants */\np        { color: gray; }   /* 0,0,1, matched on the <p> itself */\n\n/* Paragraphs in the sidebar are gray. The <p> rule is not competing\n   with the #sidebar rule; it is replacing the inherited value. */"
    },
    {
      "t": "h3",
      "x": "Shorthands quietly reset longhands"
    },
    {
      "t": "p",
      "x": "A shorthand sets every longhand it covers, including the ones you did not mention, back to their initial values. Source order then does the damage."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card { background-color: tomato; }\n.card { background: url(/paper.png) no-repeat; }\n/* background-color is now transparent, not tomato */\n\n.quote { line-height: 1.7; }\n.quote { font: italic 1rem Georgia, serif; }\n/* line-height is back to normal */"
    },
    {
      "t": "h3",
      "x": "One bad selector kills the whole rule"
    },
    {
      "t": "p",
      "x": "A selector list is parsed as a unit. If any selector in it is invalid, the entire rule is dropped, including the selectors that were fine. This is why one typo can delete styling you can see nothing wrong with."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One typo and .card loses its border too. */\n.card, .card:hoover { border: 1px solid; }\n\n/* :is() and :where() take forgiving selector lists:\n   the bad argument is ignored and .card still matches. */\n:is(.card, .card:hoover) { border: 1px solid; }"
    },
    {
      "t": "h3",
      "x": "An invalid value drops only its own declaration"
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  width: 100;      /* no unit, so this declaration is thrown away */\n  padding: 1rem;   /* unaffected, still applies */\n}"
    },
    {
      "t": "p",
      "x": "Declaration-level error recovery is why half a rule can work. A missing unit, a color function with the wrong separators, a `var()` that resolves to something unusable: the browser drops that line and carries on without raising a console error."
    },
    {
      "t": "h3",
      "x": "Component-scoped CSS changes matching, not weight"
    },
    {
      "t": "p",
      "x": "Scoped styles in Vue and Svelte compile to an extra attribute selector, which adds one to the B column. CSS Modules rename the class and leave the weight alone. Shadow DOM is a different thing again: it is a separate encapsulation context, and normal declarations from the outer document beat normal declarations inside the shadow tree, while `!important` declarations inside the shadow tree beat the outer document. If a style will not reach into a web component, specificity is almost never the reason."
    },
    {
      "t": "h2",
      "x": "Cascade layers sit above specificity"
    },
    {
      "t": "p",
      "x": "`@layer` changed the shape of this problem. Layer order is compared before specificity, so a weak selector in the right layer beats a strong selector in the wrong one. If you have ever wondered why a one-class utility overrode a component rule full of IDs, this is usually the reason."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* This line fixes the order. Later layers win for normal declarations. */\n@layer reset, components, utilities;\n\n@layer components {\n  #card .title { color: rebeccapurple; }   /* 1,1,0 */\n}\n\n@layer utilities {\n  .text-muted { color: #6b7280; }          /* 0,1,0 and it wins */\n}\n\n/* Unlayered. Outranks every normal declaration in every layer above. */\n.title { color: black; }"
    },
    {
      "t": "p",
      "x": "Two details cause most of the confusion here. Layer order is set by the first mention of each name, which is why that bare `@layer reset, components, utilities;` statement belongs at the top of your entry file: declare the order once, before an import can establish it by accident. And unlayered styles are not \"layer zero\". They form their own bucket that beats all layers for normal declarations, so wrapping a vendor stylesheet in a layer makes your own loose CSS stronger than it was yesterday."
    },
    {
      "t": "p",
      "x": "`revert-layer` is the escape hatch that does not escalate. It rolls one property back to the value it would have had from the previous layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer framework, app;\n\n@layer framework { .btn { background: navy; } }\n\n@layer app {\n  .btn          { background: teal; }\n  .btn.is-plain { background: revert-layer; }   /* navy, from framework */\n}"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Proximity, for scoped styles",
      "x": "`@scope` adds one more tiebreaker. When specificity ties, the rule whose scope root is nearer the element wins, and that proximity check runs before source order. Support is still uneven across browsers, so verify the current state before depending on it rather than trusting any support claim, including this one."
    },
    {
      "t": "h2",
      "x": "What !important actually outranks"
    },
    {
      "t": "p",
      "x": "`!important` does not add weight. It moves the declaration into a different bucket, and the buckets are ordered like this, highest precedence first."
    },
    {
      "t": "ol",
      "items": [
        "CSS transitions that are currently running",
        "`!important` user-agent declarations",
        "`!important` user declarations, from browser settings, user stylesheets or some extensions",
        "`!important` author declarations, including `style=\"color: red !important\"`",
        "CSS animations that are currently running",
        "Normal author declarations, including a plain `style=\"\"` attribute",
        "Normal user declarations",
        "Normal user-agent declarations"
      ]
    },
    {
      "t": "p",
      "x": "Read line 4 against line 6 and a common surprise resolves: an author `!important` in a stylesheet beats an inline `style` attribute, because an inline attribute is only a normal author declaration with nowhere higher to go. Read lines 1 and 5 and another one resolves. A running animation overrides your normal rule, and a running transition overrides even your `!important`. A value that looks wrong for 200ms and then corrects itself is a transition, not a cascade bug."
    },
    {
      "t": "p",
      "x": "Inside the author `!important` bucket, specificity and source order still apply as usual, with one inversion."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base  { p { color: red   !important; } }\n@layer theme { p { color: green !important; } }\np            { color: blue  !important; }\n\n/* Result: red.\n   For !important declarations, earlier layers win and layered beats unlayered,\n   which is the exact opposite of the normal-declaration rule. */"
    },
    {
      "t": "p",
      "x": "That reversal is deliberate. It lets a reset layer declare something genuinely non-negotiable, and it means an `!important` inside a vendor's layer cannot be beaten by an `!important` in your unlayered stylesheet. If you hit that wall, the answer is to put your override in an earlier layer, not to add a second exclamation mark."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important on a custom property is not what it looks like",
      "x": "`--accent: red !important` makes the *custom property* unoverridable by normal declarations. It says nothing about the declaration that consumes it. `color: var(--accent)` is still a normal declaration, so any later normal `color` rule of equal or greater specificity beats it. Substitution happens at computed-value time, after the cascade has already picked its winner for `color`."
    },
    {
      "t": "h2",
      "x": "A debugging order that terminates"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the stylesheet is there",
          "x": "A 404, a wrong build output path, or an `@import` that is not at the top of the file produces exactly the same symptom as losing the cascade. Check the loaded sheets before anything else.",
          "code": "[...document.styleSheets].map(s => s.href ?? '(inline)');"
        },
        {
          "title": "Confirm the selector matches",
          "x": "Paste your real selector into `el.matches()`. If it returns false, nothing downstream matters. Count the matches too: a selector that should hit one node and hits forty is a different bug.",
          "code": "el.matches('.card > .title');\ndocument.querySelectorAll('.card > .title').length;"
        },
        {
          "title": "Look for the warning marker",
          "x": "In the Styles pane, a struck-through declaration carrying a warning marker is an invalid value, not a lost fight. Fix the value and stop there."
        },
        {
          "title": "Find the one declaration that beat you",
          "x": "The Styles pane lists matched rules strongest first, and current Chrome and Firefox both show which layer a rule belongs to. You need the single winning declaration, not an audit of every rule on the element."
        },
        {
          "title": "Check you are fighting the right property",
          "x": "Read the computed longhand rather than the shorthand you wrote. `background` losing and `background-color` losing are different problems with different fixes.",
          "code": "getComputedStyle(el).backgroundColor;"
        },
        {
          "title": "Only now change specificity",
          "x": "And change it as little as you can. Prefer moving the rule into the correct layer, or lowering the loser with `:where()`, over raising the winner. Escalation is permanent in a way that reordering is not."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Picking a fix you will not regret"
    },
    {
      "t": "table",
      "head": [
        "Approach",
        "What it costs you"
      ],
      "rows": [
        [
          "Move the rule into a later layer",
          "Cleanest option when you already own the layer order. Useless if the project has no layers, and retrofitting them shifts every existing override at once."
        ],
        [
          "Wrap the losing rule in `:where()`",
          "Drops its weight to near zero so anything can override it. Requires editing the rule that is winning, which rules it out for vendor code."
        ],
        [
          "Add a real class and target that",
          "Verbose but honest, and it survives refactoring. Needs a template change as well as a CSS change."
        ],
        [
          "Match the weight and rely on source order",
          "Works until a bundler, a code splitter or a new `@import` reorders your sheets. Quietly fragile."
        ],
        [
          "Duplicate a class: `.btn.btn`",
          "Raises specificity without changing what matches. A recognized hack, cheap and ugly, and it invites the next person to write `.btn.btn.btn`."
        ],
        [
          "`!important`",
          "Reliable against normal declarations and legitimate for third-party widgets you cannot edit. It also raises the floor, because the next override has to start from here."
        ],
        [
          "Inline `style`",
          "Awkward to override from media queries and pseudo-classes, and it still loses to any author `!important`. Reach for it when a value is genuinely computed at runtime, not otherwise."
        ]
      ],
      "caption": "Roughly best to worst for code that has to live a while."
    },
    {
      "t": "p",
      "x": "One thing worth saying plainly, because the specificity-is-evil genre tends to skip it. High specificity is not a bug in itself. A deeply specific selector that describes a genuinely specific situation is fine, and flattening it would only move the complexity into your class names. The real problem is specificity used as a weapon in an argument between two stylesheets, because that argument has no upper bound and each round makes the next round more expensive. Layers exist so the argument can be settled by structure instead."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the layout module that describes the problem removes a lot of override-fighting before it starts.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color contrast checker",
          "desc": "Once the right color finally wins the cascade, check it passes WCAG AA against its background.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "Regex tester",
          "desc": "For the other half of this job: working out what a build-time class-name transform is actually matching.",
          "href": "/tools/regex-tester/",
          "eyebrow": "Tools"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "How do I calculate CSS specificity?",
          "a": "Count three things separately: ID selectors, then classes plus attribute selectors plus pseudo-classes, then element types plus pseudo-elements. Compare two selectors column by column from the left, and the first difference decides. The universal selector and combinators contribute nothing, and `:where()` contributes nothing regardless of what sits inside it."
        },
        {
          "q": "Why is my CSS not applying even though it is more specific?",
          "a": "In rough order of likelihood: the rule is in an earlier cascade layer than the one that won, a later shorthand reset the longhand you set, the value was invalid and silently discarded, a typo elsewhere in the selector list invalidated the whole rule, you are looking at an inherited value rather than a matched one, or the selector does not match the element at all. Run `el.matches()` with your real selector before counting anything."
        },
        {
          "q": "Does !important always win?",
          "a": "No. A running CSS transition outranks it, a user-agent or user `!important` outranks an author one, and among author `!important` declarations the earliest cascade layer wins while unlayered styles come last. Two `!important` declarations in the same layer are still compared by specificity and then by source order."
        },
        {
          "q": "Do cascade layers beat specificity?",
          "a": "For normal declarations, yes. Layer order is compared first, so one class in a later layer beats `#id .a .b` in an earlier layer. Specificity is only consulted when both declarations sit in the same layer. For `!important` declarations the layer comparison still comes first, but it runs in the opposite direction."
        },
        {
          "q": "Is it ever acceptable to use !important?",
          "a": "Yes, in two situations. Overriding a third-party widget whose stylesheet you cannot edit, and utility classes whose entire purpose is to win. Inside code you control it is usually a sign that specificity is doing work a cascade layer should be doing, and every one you add raises the cost of the next override."
        },
        {
          "q": "Why does my utility class not override a component style?",
          "a": "Almost always because the component selector carries more weight than a single class, or because the two sit in layers whose order is not what you assumed. Check which layer each rule is in from the DevTools Styles pane, then either move the component rule into an earlier layer or wrap its selector in `:where()`. Utility frameworks ship an important modifier for this, but the syntax differs between major versions, so check the docs for the version you are on instead of copying a snippet."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-16",
  "updated": "2026-10-16",
  "author": "jackson",
  "related": []
};
