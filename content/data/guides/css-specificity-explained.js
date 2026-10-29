module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important: why your rule loses",
  "eyebrow": "CSS",
  "description": "A rule that does not apply is usually losing a cascade comparison you cannot see. How specificity is counted, where layers sit, and what !important really does.",
  "standfirst": "Specificity is only the fifth tiebreaker the browser reaches for. Learn the order the cascade actually runs in, how to read a specificity triple correctly, and how to stop escalating.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "!important css",
    "specificity calculator"
  ],
  "cardDesc": "Read the cascade in the right order: matching, origin, layers, specificity, then source order.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three independent counters, written `A-B-C` for IDs, classes, and types. They are compared left to right and never added together.",
        "Eleven classes do not beat one ID. `0-11-0` loses to `1-0-0` because column A is checked first and the comparison stops there.",
        "Specificity is the fifth step of the cascade, not the first. Origin and importance, shadow context, inline styles, and cascade layers are all resolved before the browser looks at your selectors.",
        "Cascade layers invert for `!important`: normal declarations in later layers win, but important declarations in **earlier** layers win.",
        "`!important` does not override everything. A user stylesheet's `!important`, a user agent's `!important`, and an in-flight transition all outrank it.",
        "Most rules that \"do not apply\" never matched in the first place, or were dropped as invalid at parse time. Check that before you count selectors."
      ]
    },
    {
      "t": "h2",
      "x": "First rule out the cases that have nothing to do with specificity"
    },
    {
      "t": "p",
      "x": "Developers reach for specificity as the explanation far too early. In a lot of cases the losing declaration was never in the running. CSS has no error console of its own: an unparseable declaration is discarded silently and the stylesheet carries on, so a single typo costs you one line and no warning. Open the Styles pane in DevTools and look at how the browser is rendering your rule. A struck-through property with a warning triangle means the value was rejected, and Chrome's tooltip on it reads `Invalid property value`. A rule that does not show in the pane at all did not match the element."
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** A stray descendant combinator, a class on the wrong element, or a component that renders `class=\"card card--wide\"` while your CSS says `.card.wide`.",
        "**The declaration is invalid.** `color: #ff00gg`, `margin: 10`, an unquoted font name with spaces, or a custom property resolving to something the property will not accept.",
        "**The property is not inherited.** Setting `border` on a wrapper does nothing for its children. Only a specific set of properties inherit, mostly typography and text behavior.",
        "**Another property is winning the layout argument.** `width: 800px` under a `max-width: 600px` is not a cascade problem. Both declarations applied, and the used value is 600px.",
        "**The stylesheet is not loaded, or is behind a false condition.** A `@media print` block, an `@supports` test the browser fails, or a build that did not rebuild.",
        "**The element is inside shadow DOM.** Page styles do not cross the boundary except through inherited properties, `::part()`, and custom properties.",
        "**Source order, not specificity.** Two rules at the same specificity in the same layer: the later one wins. Reordering an import can flip a whole component."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Use the Computed tab, not the Styles tab",
      "x": "The Styles pane shows what you wrote. The Computed pane shows what won, and expanding a property lists every declaration that tried to set it, with the losers struck through and each one linked to its source line. If your rule is not in that list, the problem is matching, not specificity."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple. Column A counts ID selectors, column B counts classes, attribute selectors and pseudo-classes, and column C counts element types and pseudo-elements. Combinators, the universal selector, and the nesting selector's own presence contribute nothing. Compare two selectors by looking at A first. If A ties, look at B. If B ties, look at C. The comparison stops at the first column that differs, which is why the familiar \"0-1-0-0 equals 100 points\" mental model is misleading enough to be worth unlearning."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "A-B-C",
        "What to notice"
      ],
      "rows": [
        [
          "`*`, `>`, `+`",
          "0-0-0",
          "The universal selector and all combinators are free."
        ],
        [
          "`p`, `::before`",
          "0-0-1",
          "Type selectors and pseudo-elements share column C."
        ],
        [
          "`.card`, `[data-open]`, `:hover`",
          "0-1-0",
          "Classes, attribute selectors and ordinary pseudo-classes are all column B."
        ],
        [
          "`#main`",
          "1-0-0",
          "Any ID in the selector puts you in a different weight class."
        ],
        [
          "`#main .card p`",
          "1-1-1",
          "Counted per column, never summed."
        ],
        [
          "`:where(#main) .card`",
          "0-1-0",
          "`:where()` zeroes out everything inside it."
        ],
        [
          "`:is(#main, .wrap) p`",
          "1-0-1",
          "`:is()`, `:not()` and `:has()` take their most specific argument."
        ],
        [
          "`style=\"color: red\"`",
          "not ranked",
          "Inline styles win at an earlier cascade step instead."
        ]
      ],
      "caption": "Specificity is three counters compared left to right, not a single base-10 score."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-1-0 */\n.button { background: #2d6cdf; }\n\n/* 0-2-0. It wins over the line above because column B is 2 against 1,\n   not because it is longer or more \"descriptive\". */\n.sidebar .button { background: #777; }\n\n/* 1-0-0. It beats both. Adding ten more classes to the rules above\n   would not change the outcome by even a little. */\n#promo { background: #c33; }"
    },
    {
      "t": "p",
      "x": "Native CSS nesting has a trap that Sass does not. A nested selector behaves as though its parent were wrapped in `:is()`, so it inherits the specificity of the most specific selector in the parent list. Write `.card, #promo { & .title { ... } }` and the nested rule carries `1-1-0` even when it is applied inside a plain `.card`. Sass flattens nesting as text, so the same source produces two separate selectors with their own honest specificity. If you have migrated a stylesheet from Sass to native nesting and overrides started failing, this is the likely reason."
    },
    {
      "t": "h2",
      "x": "The cascade decides most of it before specificity comes up"
    },
    {
      "t": "p",
      "x": "Specificity only breaks ties among declarations that already survived four earlier comparisons. Knowing the full order tells you which lever is the right one to pull. Sorted from the step that runs first to the step that runs last:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Who wrote the declaration (browser, user, author) and whether it carries `!important`.",
        "**Context.** Whether the declaration came from a shadow tree or the outer document.",
        "**Element-attached styles.** The `style` attribute beats any matching rule from a stylesheet at the same importance, regardless of selector.",
        "**Cascade layers.** Resolved in full before any selector is weighed.",
        "**Specificity.** The `A-B-C` comparison above.",
        "**Scope proximity.** Relevant only with `@scope`, and ordered near the bottom; check the current Cascade specification if you depend on the exact position.",
        "**Order of appearance.** The last matching declaration in document order wins."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences follow immediately. An inline `style` attribute cannot be beaten by raising specificity, because the question is settled one step earlier, but it is beaten by an `!important` in a stylesheet, because importance is settled one step earlier still. And a rule in a later cascade layer beats a far more specific rule in an earlier one, which is the entire point of layers."
    },
    {
      "t": "h2",
      "x": "Cascade layers change what the question even is"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare a precedence order up front and then stop caring how specific anything inside each layer is. Declare the order once, in a single statement near the top of your entry stylesheet, before any rules. Layers named later win. A layer that is mentioned in the ordering statement but never filled still holds its slot."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once. Later layers win for normal declarations. */\n@layer reset, base, components, utilities;\n\n@layer components {\n  #promo .button { background: #2d6cdf; }   /* 1-1-0 */\n}\n\n@layer utilities {\n  .bg-red { background: #c33; }             /* 0-1-0, and it still beats\n                                               the components layer */\n}\n\n/* Unlayered normal rules sit above every layer, so this wins over both. */\n.bg-green { background: #2a7; }"
    },
    {
      "t": "p",
      "x": "That last line surprises people. Unlayered normal declarations are treated as the highest layer of all, which makes layers easy to adopt gradually: wrap a third-party reset or a vendor component library in a low layer, leave your own CSS unlayered, and your rules win without a single selector change. The cost is that it also makes partial adoption confusing. Once some of your code is layered and some is not, \"which of these wins\" stops being answerable by reading two selectors."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "For normal declarations, later layers beat earlier layers and unlayered beats everything. For `!important` declarations, the whole thing flips: earlier layers beat later layers, and unlayered `!important` is the **weakest** of the lot. This is deliberate, so that a low-priority reset layer can still force something, but it produces results that look like a browser bug the first time you hit it."
    },
    {
      "t": "p",
      "x": "Layers have been supported in Chrome, Edge, Firefox and Safari since the spring of 2022. `@scope` is much newer and landed in Firefox well after Chrome and Safari, so check current support data before shipping it as a load-bearing part of a design system."
    },
    {
      "t": "h2",
      "x": "What !important actually does, and what it does not"
    },
    {
      "t": "p",
      "x": "`!important` does not jump a declaration to the top of the cascade. It moves the declaration into a different importance band within the first cascade step, and those bands have their own strict order. From strongest to weakest:"
    },
    {
      "t": "ol",
      "items": [
        "Declarations from a running CSS transition",
        "User agent stylesheet, `!important`",
        "User stylesheet, `!important`",
        "Author stylesheet, `!important`",
        "Declarations from a running CSS animation",
        "Author stylesheet, normal",
        "User stylesheet, normal",
        "User agent stylesheet, normal"
      ]
    },
    {
      "t": "p",
      "x": "Read that list against two common claims. First, \"`!important` overrides everything\" is false: a user stylesheet, which is how browser extensions and accessibility overrides work, outranks anything an author can write, and that ordering exists precisely so a reader can force a font size you did not anticipate. Second, \"use `!important` to beat an animation\" is true, and it is the one legitimately common reason to reach for it, because a normal author declaration loses to `@keyframes` output. Within the author-important band, everything starts again from scratch: layers, then specificity, then source order. Two `!important` rules on the same property still have to fight, and that is where `!important` wars come from."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "The escalation that has no top",
      "x": "Adding `!important` to win an argument does not end the argument, it raises the floor. The next person adds `!important` plus an ID, and the one after that adds an inline `style` attribute from JavaScript. If you must use it, confine it to a narrow, documented place: a utility layer, a print stylesheet, a third-party widget override. Never in a component's own base styles."
    },
    {
      "t": "h2",
      "x": "Lower the specificity instead of raising it"
    },
    {
      "t": "p",
      "x": "The durable fix is almost always to make the losing side easier to override rather than to make the winning side harder to beat. `:where()` takes any selector list and reports zero specificity for all of it, which makes it ideal for defaults, resets and opinionated base typography. Supported across the major engines since 2021, it is the single most useful tool here."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Zero specificity. A single class can override any of this. */\n@layer base {\n  :where(article :is(h1, h2, h3)) {\n    margin-block: 1.5rem 0.5rem;\n  }\n}\n\n.tight-heading { margin-block: 0; }   /* 0-1-0, and it wins easily */\n\n/* Hand a property back to whatever the next layer down said,\n   rather than hard-coding a value you will have to maintain. */\n.theme-default .button {\n  background: revert-layer;\n}"
    },
    {
      "t": "p",
      "x": "Three more tools are worth knowing. `revert` rolls a property back to what the user agent or user stylesheet would have given it, which is different from `initial` and usually what you actually wanted. `revert-layer` rolls back to the value from the previous cascade layer. And `all: revert` on a wrapper gives you a clean slate for embedded third-party markup without writing a reset by hand."
    },
    {
      "t": "p",
      "x": "On the structural side, the rules are boring and they work. Keep selectors flat. Prefer a class to a descendant chain, since `.card-title` is both faster to reason about and easier to override than `.page .content .card h2`. Avoid styling by ID. If you inherited a codebase where IDs are load-bearing, `:where(#id)` neutralizes one without touching the HTML."
    },
    {
      "t": "h2",
      "x": "A debugging order that holds up"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element matches",
          "x": "Select the element in DevTools and check whether your rule appears in the Styles pane at all. If it is absent, the selector is wrong or the stylesheet is not loaded. Nothing else matters yet.",
          "code": "/* Paste the selector into the console to count matches. */\ndocument.querySelectorAll('.sidebar .button').length"
        },
        {
          "title": "Confirm the declaration parsed",
          "x": "Look for a strikethrough with a warning icon. That is a rejected value, not a lost cascade fight. Custom properties are a frequent cause here, because an undefined variable makes the whole declaration invalid at computed-value time."
        },
        {
          "title": "Find the winner in the Computed pane",
          "x": "Expand the property. The top entry is what applied. Click through to its source and read the whole rule, including which layer it sits in and whether it carries `!important`."
        },
        {
          "title": "Compare at the right cascade step",
          "x": "Inline style, layer, specificity, source order, in that sequence. Decide which step you lost at before changing anything, because the fix is different at each one."
        },
        {
          "title": "Change the loser, not the winner",
          "x": "Wrap the winning rule in `:where()`, move it into a lower layer, or delete the ID from it. Raising your own selector is the option that costs the next person the most."
        }
      ]
    },
    {
      "t": "p",
      "x": "One habit pays for itself quickly: when a specificity bug reaches production, write down which cascade step it was lost at in the commit message. Over a few months you will see a pattern, and it is usually one file or one vendor stylesheet generating most of them. That file is the one to wrap in a layer."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing a layout module, and the sizing gotchas that follow from each.",
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
          "desc": "The other \"my change is not showing up\" bug, on the JavaScript side.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Check three things in order. The rule may not match the element at all, in which case `!important` changes nothing. Another author declaration may also be `!important` and win on layer, specificity or source order within that band. Or the value is being overridden by something that outranks author-important: a user stylesheet, a browser extension, the user agent's own important rules, or a CSS transition that is still running. An inline `style` attribute carrying `!important` also beats a stylesheet's `!important`."
        },
        {
          "q": "Do 11 classes beat an ID in CSS?",
          "a": "No. Specificity is three separate counters compared left to right, not a base-10 number. `0-11-0` loses to `1-0-0` because the browser compares the ID column first, finds 0 against 1, and stops. The old \"100 points for an ID, 10 for a class\" shorthand gives the right answer for small selectors and the wrong answer here, which is why it is worth dropping."
        },
        {
          "q": "What is the specificity of :where(), :is() and :has()?",
          "a": "`:where()` is always `0-0-0` no matter what is inside it, which makes it the standard way to write overridable defaults. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, so `:is(#main, .wrap)` counts as `1-0-0` even when it matched on the class. Native CSS nesting follows the `:is()` rule for its parent selector, which Sass nesting does not."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, layers are resolved first. A `0-1-0` rule in a later layer beats a `1-1-1` rule in an earlier one. Two caveats: unlayered normal declarations outrank every layer, and for `!important` declarations the layer order reverses, so earlier layers win and unlayered important is weakest."
        },
        {
          "q": "Is it ever okay to use !important?",
          "a": "Yes, in a few narrow places. Overriding a third-party widget whose markup you cannot change, forcing a value in a print stylesheet, beating a CSS animation (normal author declarations lose to `@keyframes` output), and single-purpose utility classes that are meant to be the final word. The problem is not the keyword, it is using it inside component base styles where it leaves the next person no move except to escalate further."
        },
        {
          "q": "Why does my Tailwind class not override my component CSS?",
          "a": "Usually a layer or source-order issue rather than specificity. Tailwind v4, released January 2025, emits its utilities into real cascade layers, which means any unlayered rule in your own stylesheet beats them regardless of how low its specificity is. Moving your component CSS into a layer declared before the utilities layer fixes it properly. Versions differ in how they handle this, so verify against the docs for the version in your `package.json`."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-29",
  "updated": "2026-10-29",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
