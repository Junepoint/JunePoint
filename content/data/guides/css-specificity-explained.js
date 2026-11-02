module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity, Layers and Why Your Rule Loses",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Your CSS rule either lost the cascade or never matched. How specificity is counted, where cascade layers and !important fit, and how to tell which one bit you.",
  "standfirst": "Specificity is only the third tiebreaker in the cascade, and plenty of broken rules never reach it. A practical order of checks, from parse errors to cascade layers.",
  "keywords": [
    "css specificity",
    "css not applying",
    "css important",
    "cascade layers",
    "css specificity calculator"
  ],
  "cardDesc": "Specificity is only the third tiebreaker. Work out which step of the cascade your rule actually lost.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is checked third, after origin and importance, and after cascade layers. Counting selectors first is why people get stuck.",
        "Specificity has three columns: IDs, then classes/attributes/pseudo-classes, then element types. Columns are compared separately, so ten classes still lose to one ID.",
        "If DevTools shows the declaration struck through, you lost the cascade. If the rule is missing entirely, the selector never matched or the declaration was dropped as invalid.",
        "`!important` inverts cascade layer order and beats normal inline styles. That makes it powerful and makes it very hard to undo.",
        "`:where()` has zero specificity. `:is()` and `:not()` take the specificity of their most specific argument. Use the first for defaults you expect to be overridden."
      ]
    },
    {
      "t": "h2",
      "x": "Check the cascade order before you count selectors"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser works through a fixed list of tiebreakers and stops at the first one that separates them. Specificity sits part way down that list. Most of the time people reach for it immediately, which is why a rule with four class selectors can still lose to a rule with one."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Transitions in progress win outright. Then important user-agent styles, then important user styles, then important author styles, then running animations, then normal author styles, then normal user styles, then normal user-agent styles. Your stylesheet is the author origin.",
        "**Cascade layers**, within the author origin. For normal declarations a later layer beats an earlier one, and unlayered styles beat every layer. For `!important` declarations the whole order flips.",
        "**Specificity.** Only now do selector weights matter.",
        "**Order of appearance.** Identical specificity means the declaration that comes later in the stylesheet wins. With bundlers, that order is decided by your import graph, not by the order you wrote things."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences are worth holding onto. A running CSS animation outranks every normal author rule regardless of selector, which is why a `transform` you set on a class appears to be ignored while a keyframe animation is active. And an `!important` declaration in a linked stylesheet beats a plain inline `style` attribute, even though inline styles normally win against any selector."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Scope proximity",
      "x": "Newer specifications add a proximity step for `@scope`, sitting between specificity and source order. If you are not using `@scope`, it never fires. If you are, be aware there is now a tiebreaker that has nothing to do with selector weight."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is three numbers, usually written `A,B,C`. Count the ID selectors for A, the class selectors, attribute selectors and pseudo-classes for B, and the type selectors and pseudo-elements for C. Combinators, the universal selector and the nesting of rules contribute nothing by themselves."
    },
    {
      "t": "table",
      "head": [
        "Selector part",
        "A",
        "B",
        "C",
        "Example"
      ],
      "rows": [
        [
          "ID",
          "1",
          "0",
          "0",
          "`#main`"
        ],
        [
          "Class",
          "0",
          "1",
          "0",
          "`.card`"
        ],
        [
          "Attribute",
          "0",
          "1",
          "0",
          "`[data-open]`"
        ],
        [
          "Pseudo-class",
          "0",
          "1",
          "0",
          "`:hover`, `:nth-child()`"
        ],
        [
          "Type",
          "0",
          "0",
          "1",
          "`div`"
        ],
        [
          "Pseudo-element",
          "0",
          "0",
          "1",
          "`::before`"
        ],
        [
          "Universal and combinators",
          "0",
          "0",
          "0",
          "`*`, `>`, `+`, `~`"
        ],
        [
          "`:where()`",
          "0",
          "0",
          "0",
          "Always zero, arguments ignored"
        ],
        [
          "`:is()`, `:not()`, `:has()`",
          "varies",
          "varies",
          "varies",
          "Takes its most specific argument"
        ],
        [
          "Inline `style`",
          "n/a",
          "n/a",
          "n/a",
          "Not specificity. Beats normal author rules."
        ]
      ],
      "caption": "Specificity contributions by selector type. Compared column by column, left to right."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* All of these match the same element:\n   <ul id=\"list\" class=\"list\"><li id=\"first\" class=\"item\">…</li></ul> */\n\nul li                    { color: red; }     /* 0,0,2 */\n.list .item              { color: blue; }    /* 0,2,0 */\nul li.item:first-child   { color: green; }   /* 0,2,2 */\n#first                   { color: orange; }  /* 1,0,0 */\n#list .item              { color: teal; }    /* 1,1,0  <- winner */"
    },
    {
      "t": "p",
      "x": "The columns do not carry. `0,11,0` loses to `1,0,0` because A is compared first and 0 is less than 1, and nothing in column B can ever add up to an ID. This is the single most useful fact about specificity, and it is the reason adding one more class selector to a rule that is losing to an ID will never help."
    },
    {
      "t": "p",
      "x": "CSS nesting folds into the same system. The `&` selector, and the implied parent in a nested rule, carry the specificity of the most specific selector in the parent list, exactly like `:is()`. A nested rule inside `#app, .app { … }` therefore starts at `1,0,0`, which surprises people who thought nesting was only a syntax convenience."
    },
    {
      "t": "h2",
      "x": "The rule might never have matched at all"
    },
    {
      "t": "p",
      "x": "Before you blame the cascade, confirm the browser ever accepted the declaration. CSS error handling is silent and granular: an unknown property or an invalid value drops that one declaration and keeps the rest of the rule. Nothing is logged to the console."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  colour: red;                /* unknown property: dropped */\n  width: 100;                 /* missing unit: dropped */\n  color: #gggggg;             /* invalid value: dropped */\n  transform: translateX(10);  /* needs a length: dropped */\n  padding: 1rem;              /* survives */\n}"
    },
    {
      "t": "p",
      "x": "Other common causes that have nothing to do with specificity:"
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand later in the file resets your longhand.** `background: url(t.png)` sets `background-color` back to `transparent`. `font:` resets `line-height`. `all: unset` resets effectively everything.",
        "**The selector does not describe the DOM you have.** `.card > .title` fails if a wrapper sits between them. Frameworks also render class names you did not expect.",
        "**An unclosed brace earlier in the file.** The parser recovers at the next matching brace, which can swallow several following rules. Those rules will be absent from DevTools entirely.",
        "**The property does not apply to that element.** `width` on an inline non-replaced element, `gap` outside flex or grid, `text-align` where you meant `justify-content`.",
        "**You set an inherited property on the wrong element**, or a non-inherited one on a parent. Form controls do not inherit `font` from the page by default.",
        "**A media, container or supports query is false.** None of these change specificity. They only gate whether the rule exists.",
        "**Shadow DOM.** Outside styles do not reach inside a shadow root, apart from inherited properties, custom properties and `::part()`.",
        "**JavaScript is writing inline styles** after paint. Animation libraries and chart libraries do this constantly."
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Custom properties fail differently",
      "x": "A bad value in a custom property is only detected at computed-value time, so it does not get dropped at parse time. The property it feeds becomes `unset` instead, which for a non-inherited property means the initial value. The result is an element that looks unstyled rather than one that falls back to a previous rule. `var(--x, 1rem)` only supplies the fallback when `--x` is missing, not when it is garbage."
    },
    {
      "t": "h2",
      "x": "Cascade layers change which rule wins"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare precedence up front instead of fighting selector weights. Layer order is set by the first `@layer` statement that names the layers, and it beats specificity outright: a single class in a later layer wins against an ID selector in an earlier one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, before anything else */\n@layer reset, vendor, components, utilities;\n\n@import url(\"normalize.css\") layer(reset);\n@import url(\"bootstrap.css\") layer(vendor);\n\n@layer components {\n  .btn { padding: 0.5rem 1rem; }   /* 0,1,0 beats #btn.primary in vendor */\n}"
    },
    {
      "t": "p",
      "x": "The flip side is the inversion for `!important`. For important declarations, earlier layers beat later ones, and unlayered important declarations are the weakest of all the important author styles. This catches people out the first time they try to force something through a layered design system."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base  { .x { color: red  !important; } }\n@layer theme { .x { color: blue !important; } }\n\n.x { color: green !important; }   /* unlayered: weakest important */\n\n/* Result: red. Earlier layer wins for !important. */"
    },
    {
      "t": "p",
      "x": "`@layer` shipped in Chrome and Edge 99, Firefox 97 and Safari 15.4, all in the first half of 2022, so it is safe for most projects as of November 2026. Check it against your own support matrix before committing, and note that there is no graceful degradation: a browser that does not understand `@layer` ignores the block and loses those styles completely."
    },
    {
      "t": "h2",
      "x": "Lowering specificity on purpose with :where()"
    },
    {
      "t": "p",
      "x": "`:is()` and `:where()` are identical in what they match. They differ only in weight. `:where()` always contributes zero, which makes it the right tool for defaults, resets and library styles you want consumers to override with a single class."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ":where(h1, h2, h3) { margin-block: 0; }   /* 0,0,0 */\n:is(h1, h2, h3)    { margin-block: 0; }   /* 0,0,1 */\n\n:is(#app, p) span  { }   /* 1,0,1  the #app sets the weight */\n:not(.a, #b)       { }   /* 1,0,0  same rule applies */\narticle:has(> img) { }   /* 0,0,2  article + the img inside :has() */\n\n/* A library default that any single class can beat */\n:where(.prose) :where(a) { color: inherit; }"
    },
    {
      "t": "p",
      "x": "`:has()` is supported across current major browsers, with Firefox the last to ship it in late 2023. Its specificity trips people up because the argument counts: `:has(.active)` adds a class to column B even though `.active` is not the element being styled."
    },
    {
      "t": "h2",
      "x": "Utility classes and the class attribute myth"
    },
    {
      "t": "p",
      "x": "With Tailwind and similar utility frameworks, every utility is a single class, so almost everything has specificity `0,1,0`. Ties are broken by stylesheet order. The order you write classes in the HTML attribute is irrelevant: `class=\"p-4 p-2\"` and `class=\"p-2 p-4\"` produce the same result, whichever of the two the generated stylesheet emits last."
    },
    {
      "t": "p",
      "x": "That is why a utility fails to override a component rule written with `.card .title` at `0,2,0`, and why Tailwind's own guidance is to put component styles in an earlier cascade layer rather than to escalate specificity. If you cannot use layers, `!important` on utilities is the older workaround, and it has the usual cost."
    },
    {
      "t": "h2",
      "x": "When !important is the right answer"
    },
    {
      "t": "p",
      "x": "It has legitimate uses. Overriding inline styles written by a third-party script is the clearest one, because nothing else in the author origin can do it. User stylesheets and accessibility overrides are another: an important user declaration outranks important author styles, which is the mechanism behind forced colors and reader modes. Print stylesheets that must beat a screen theme are a third."
    },
    {
      "t": "p",
      "x": "What it is bad at is being the fastest fix in your own codebase. One important declaration makes the next override harder, which produces a second one, and the equilibrium is a stylesheet where everything is important and ordinary specificity no longer functions. The debt is real and it compounds in a way that a slightly ugly selector does not."
    },
    {
      "t": "p",
      "x": "Two things that will not work regardless: `!important` inside `@keyframes` is ignored by the spec, and `!important` cannot defeat a running transition on the same property."
    },
    {
      "t": "h2",
      "x": "A five-minute routine for a rule that will not apply"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches something",
          "x": "Run it against the live DOM rather than reading the markup. A zero-length result ends the investigation immediately.",
          "code": "document.querySelectorAll('.card > .title').length"
        },
        {
          "title": "Look for the rule in the Styles panel",
          "x": "Select the element and search the panel for your selector. If it is not there at all, the stylesheet did not load, the selector does not match, or a parse error upstream consumed the rule. Check the Network tab and the Sources view of the actual delivered CSS, not your source file."
        },
        {
          "title": "Check whether the declaration is struck through",
          "x": "Struck through means it was found and then beaten. In Chrome and Edge the winning rule is listed at the top of the panel, so the thing that beat you is usually one scroll away. A warning triangle next to the property means it was invalid and dropped instead."
        },
        {
          "title": "Read the Computed tab",
          "x": "Expand the property to see exactly which rule supplied the final value, including user-agent and inherited sources. This answers \"where did this value come from\" faster than reasoning about the cascade."
        },
        {
          "title": "Only now compare specificity",
          "x": "Write both selectors down with their `A,B,C` values. If the winner has a higher A, adding classes cannot help you."
        },
        {
          "title": "Fix at the lowest level that works",
          "x": "In order of preference: move one of the rules into the correct cascade layer, reduce the specificity of the rule that is winning, wrap library defaults in `:where()`, add a single class to the losing selector. Reach for `!important` only to beat styles you do not control."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A quick sanity check",
      "x": "Temporarily set an obviously wrong value, something like `outline: 5px solid magenta`, on the rule you believe should apply. If the outline appears, your selector is fine and the problem is a specific property being overridden or invalid. If nothing happens, the rule itself is not reaching the element."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model fits the problem, and how to stop fighting the one you picked.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check any foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same debugging instinct applied to state that looks one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks correct?",
          "a": "Three causes account for most of it. The declaration was dropped as invalid, so it never existed. A shorthand later in the file reset it. Or another rule won the cascade, in which case DevTools shows it struck through. Check in that order: a struck-through declaration is a cascade problem, a missing declaration is a matching or parsing problem."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "Yes. An `!important` declaration in a stylesheet beats a normal `style` attribute, because importance is compared before the inline-style advantage applies. An inline style that is itself marked `!important` beats that back. The only things above it are important user styles, important user-agent styles and transitions in progress."
        },
        {
          "q": "How do I calculate CSS specificity by hand?",
          "a": "Count IDs, then classes plus attribute selectors plus pseudo-classes, then element types plus pseudo-elements. Write it as `A,B,C` and compare left to right, stopping at the first column that differs. Combinators and `*` count for nothing, `:where()` counts for nothing, and `:is()`, `:not()` and `:has()` take the weight of their most specific argument."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, layer order is checked before specificity. A `0,1,0` class selector in a later layer beats a `1,0,0` ID selector in an earlier layer. For `!important` declarations the order reverses, so earlier layers win and unlayered important styles are the weakest important author styles."
        },
        {
          "q": "Is it ever acceptable to use !important?",
          "a": "To override inline styles injected by code you do not control, yes, because nothing else in the author origin can. Also for user stylesheets, accessibility overrides and print rules that must beat a screen theme. Inside your own stylesheet it is almost always better to use a cascade layer or to lower the specificity of whatever is winning, because each important declaration makes the next override harder."
        },
        {
          "q": "Why doesn't my Tailwind utility override my component CSS?",
          "a": "Every utility is a single class at `0,1,0`, so it loses to anything with two classes or an ID. The order of classes in the HTML attribute has no effect at all. Put your component styles in an earlier cascade layer than the utilities, or reduce their selectors to a single class."
        },
        {
          "q": "Why does my style get ignored only while an animation runs?",
          "a": "Declarations from a running CSS animation sit above all normal author rules in the cascade, so no selector will beat them. Either target the keyframes, change the animation's `fill-mode`, or use `!important`, which outranks animations but is ignored when written inside `@keyframes` itself."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-02",
  "updated": "2026-11-02",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
