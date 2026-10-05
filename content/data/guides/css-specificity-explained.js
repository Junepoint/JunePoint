module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers and !important",
  "eyebrow": "Guides",
  "description": "A matching CSS rule can still lose. Work through the cascade in order: origin, inline styles, layers, specificity, source order, and the non-specificity traps.",
  "standfirst": "Specificity is the fifth tiebreaker in the cascade, not the first. Here is the order the browser actually resolves in, and how to find which step your rule lost at.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "important css",
    "css cascade order"
  ],
  "cardDesc": "The real resolution order behind a CSS rule that loses, and how to read it out of DevTools.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The cascade is a sort with six criteria. Specificity is the fifth. If two declarations differ at an earlier step, their specificity is never compared at all.",
        "Specificity is three numbers compared left to right: `A-B-C` for IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements. `1-0-0` beats `0-50-0`, and nothing carries.",
        "A later `@layer` wins over an earlier one no matter how specific the earlier selector was. Unlayered styles beat every layer.",
        "`!important` reverses the layer order and the origin order. An important declaration inside a layer beats an important declaration outside all layers, which surprises almost everyone the first time.",
        "Plenty of \"specificity problems\" are not specificity: a dropped invalid value, a shorthand resetting your longhand, a selector that never matched, or one bad selector in a comma list killing the whole rule."
      ]
    },
    {
      "t": "lede",
      "x": "When a rule that clearly matches an element has no effect, it lost at one of six steps, and only one of those steps is specificity. Counting selector weight first is the usual mistake. Sort the question the way the browser does, from the top, and the answer normally falls out in under a minute."
    },
    {
      "t": "h2",
      "x": "The order the browser resolves in"
    },
    {
      "t": "p",
      "x": "Every declaration that matches an element is collected, then sorted. The first criterion that separates two declarations decides the winner, and nothing further down the list is consulted. That is the part people skip. An ID selector cannot beat a `style` attribute, and no selector, however baroque, beats a declaration sitting in a later cascade layer."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Browser defaults lose to user styles, which lose to your author styles. `!important` flips that ordering, so an important user style beats an important author style. Declarations produced by a running CSS transition sit above all of it.",
        "**Context.** For normal declarations, styles from the outer tree win over styles from inside a shadow tree. For important declarations, the shadow tree wins.",
        "**Element-attached styles.** A `style` attribute beats any selector in a stylesheet of the same origin and importance.",
        "**Cascade layers.** A later `@layer` beats an earlier one, and unlayered declarations beat all of them. Important declarations reverse this.",
        "**Specificity.** The `A-B-C` count, compared left to right.",
        "**Order of appearance.** The last matching declaration wins. This is the only step where file order, `@import` position and bundler output decide anything."
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Where @scope fits",
      "x": "The CSS Cascading and Inheritance Level 6 draft adds a scope proximity step: among declarations in `@scope` blocks, the one whose scope root is nearest the element wins. It sits after specificity and before order of appearance, so it is a tiebreaker rather than a trump card. Browser support is uneven, so check caniuse.com before relying on it."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "Write it as `A-B-C`. `A` is the number of ID selectors. `B` is classes, attribute selectors and pseudo-classes. `C` is element types and pseudo-elements. Compare the triples left to right, the way you compare version numbers. Ten classes do not add up to an ID, because there is no carrying and no single total. The old habit of saying \"specificity 110\" works right up to the day someone stacks eleven classes on a selector and the arithmetic quietly lies to you."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-1-1 : one class, one type */\nnav .menu { color: red; }\n\n/* 0-2-0 : two classes. Wins. */\n.sidebar .menu { color: blue; }\n\n/* 1-0-1 : one ID, one type */\n#sidebar a { color: #555; }\n\n/* 0-3-1 : three classes and pseudo-classes, one type.\n   Still loses to the line above. */\na.button.primary:hover { color: rebeccapurple; }"
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "A-B-C",
        "Notes"
      ],
      "rows": [
        [
          "`*`",
          "0-0-0",
          "The universal selector and the combinators `>`, `+`, `~` and `||` contribute nothing."
        ],
        [
          "`li`, `::before`",
          "0-0-1",
          "Type selectors and real pseudo-elements. `::before` counts here, not as a pseudo-class."
        ],
        [
          "`.card`, `[type=\"text\"]`, `:hover`",
          "0-1-0",
          "Classes, attribute selectors and pseudo-classes all weigh the same. An attribute selector is a class in disguise."
        ],
        [
          "`#main`",
          "1-0-0",
          "One ID outranks any quantity of the row above."
        ],
        [
          "`:where(#main, .card)`",
          "0-0-0",
          "`:where()` always contributes zero, whatever is inside it."
        ],
        [
          "`:is(#main, .card)`, `:has(#main)`, `:not(.card)`",
          "1-0-0 / 1-0-0 / 0-1-0",
          "These take the specificity of their most specific argument. A single ID buried in an `:is()` list raises the whole selector."
        ],
        [
          "`.nav li a:hover`",
          "0-2-2",
          "One class plus one pseudo-class, two types."
        ],
        [
          "`style=\"color: red\"`",
          "n/a",
          "Not specificity at all. Inline styles win at an earlier step, which is why you cannot out-specify them."
        ]
      ],
      "caption": "Specificity contributions by selector type. Compare triples left to right."
    },
    {
      "t": "p",
      "x": "The `:is()` and `:where()` difference is the one worth memorising, because it changes how a utility library behaves. `:where(.btn) { padding: 1rem }` can be overridden by a bare `button` type selector. `:is(.btn)` cannot. Reset sheets wrap their selectors in `:where()` on purpose, so that authors never have to fight them."
    },
    {
      "t": "h2",
      "x": "Cascade layers beat specificity, every time"
    },
    {
      "t": "p",
      "x": "Layers exist to take specificity out of the argument. You declare an order once, and then a declaration in a later layer wins against anything in an earlier layer regardless of how the selectors compare. This is the fix for the usual problem of a vendor stylesheet shipping `#app .widget .title` and leaving you no honest way to override it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order up front. Later layers win. */\n@layer reset, vendor, app;\n\n@layer vendor {\n  #sidebar .link { color: red; }   /* 1-1-0 */\n}\n\n@layer app {\n  a { color: blue; }               /* 0-0-1 */\n}\n\n/* Blue wins: the layer comparison happens before specificity.\n   And this, outside any layer, beats both of them: */\na { color: green; }"
    },
    {
      "t": "p",
      "x": "Two details catch people out. First, layer order is fixed by the first time a layer name appears, so the `@layer reset, vendor, app;` statement at the top of your entry file is the only reliable way to control it; declaring the statement after an `@import` that already created the layers does nothing. Second, unlayered styles are treated as the last and highest layer for normal declarations. If you put your own code in a layer and the third-party CSS is unlayered, you lose."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Import a stylesheet straight into a layer",
      "x": "`@import url(\"vendor.css\") layer(vendor);` puts someone else's entire sheet underneath yours without touching a line of it. The `@import` must still come before any style rules in the file."
    },
    {
      "t": "h2",
      "x": "What `!important` actually does"
    },
    {
      "t": "p",
      "x": "It does not add specificity. It moves the declaration into a separate, higher bucket at step one of the sort, and inside that bucket several orderings run backwards. Important author declarations lose to important user declarations, the opposite of the normal case, which is how a reader's accessibility stylesheet manages to win. More practically for day-to-day work: important declarations reverse the layer order."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .btn { color: red !important; }\n}\n\n@layer overrides {\n  .btn { color: blue !important; }\n}\n\n.btn { color: green !important; }   /* unlayered */\n\n/* Red wins.\n   Important declarations invert layer order, so the EARLIEST\n   layer wins, and unlayered important declarations rank lowest\n   of the three. */"
    },
    {
      "t": "p",
      "x": "Read that twice if it looks wrong. It is the behaviour defined in the cascade specification, and it gives you a clean way to beat an important declaration you do not control: put your override in a layer declared before theirs, and mark it important too. If their important declaration is unlayered, any layer of yours will do. That is a far better answer than the usual advice of piling on IDs."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Two cases where important still loses",
      "x": "A running CSS transition sits above important author declarations, so a colour mid-transition will not match what your important rule asked for. And an important declaration in a `style` attribute beats an important declaration in your stylesheet, because element-attached styles are compared after importance but before specificity. Scripts and widget libraries that write to `style` are a common source of this."
    },
    {
      "t": "h2",
      "x": "Reasons that have nothing to do with specificity"
    },
    {
      "t": "p",
      "x": "Before you touch a selector, rule these out. In practice they account for more lost rules than the cascade does."
    },
    {
      "t": "ul",
      "items": [
        "**The declaration was thrown away.** An unparseable value drops that one declaration silently: `width: 100 px` with a space, `color: #ff` with four digits, a custom property holding an empty string. The rule still shows in DevTools, crossed out.",
        "**One bad selector killed the whole rule.** In a plain comma-separated selector list, a single selector the browser cannot parse invalidates every selector in the list. Wrapping the list in `:is()` or `:where()` makes it forgiving, so unknown selectors are skipped instead.",
        "**A shorthand reset your longhand.** `background: url(x.png)` later in the cascade wipes out an earlier `background-color`. Same for `font` over `line-height`, `inset` over `top`, and `all` over everything. Check the Computed tab, not the declaration you wrote.",
        "**The selector never matched.** A class applied conditionally and currently absent, a `&` in nested CSS pointing at a different element than you assumed, `::before` on an `<img>` or `<input>` where no generated content is possible, or a descendant selector that needed to be a child selector.",
        "**You set it on the wrong element.** Inherited properties like `color` pass down; `border` and `padding` do not. Equally, a value inherited from an ancestor loses to *any* declaration that matches the element directly, no matter how weak that declaration is. Specificity is not compared across those two cases.",
        "**The property is being ignored, not overridden.** `width` on a non-replaced inline element, `z-index` without a positioning or stacking context, `vertical-align` on a block, `gap` on a non-flex, non-grid parent. The declaration wins the cascade and then does nothing."
      ]
    },
    {
      "t": "h2",
      "x": "Reading the answer out of DevTools"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the rule is in the list",
          "x": "Select the element and read the Styles pane from the top. The panel is already sorted by cascade priority, winners first. If your rule is not listed at all, the selector did not match and specificity is irrelevant.",
          "code": null
        },
        {
          "title": "Look for strikethrough and warning icons",
          "x": "A crossed-out declaration with a warning triangle is an invalid value. A crossed-out declaration with no icon was overridden by something higher in the list. These two look similar at a glance and mean completely different things."
        },
        {
          "title": "Use the Computed tab to find the winner",
          "x": "Expand the property in Computed and follow the link to the rule that actually supplied the value. This is the fastest route when a shorthand is the culprit, because the longhand is listed under its own name."
        },
        {
          "title": "Check the inherited section",
          "x": "Scroll to the bottom of the Styles pane. Declarations under \"Inherited from\" come from an ancestor, and a direct declaration on the element always outranks them."
        },
        {
          "title": "Verify with the DOM, not the source",
          "x": "Read the `class` attribute on the element in the Elements panel rather than trusting your template. A typo in a conditional class, or a framework that scopes class names at build time, shows up immediately here.",
          "code": "/* Quick check from the console: does anything match? */\ndocument.querySelectorAll('.sidebar > .menu a').length\n\n/* What did the element actually end up with? */\ngetComputedStyle($0).color"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Writing CSS that does not need the fight"
    },
    {
      "t": "p",
      "x": "Specificity wars are a symptom of an undeclared architecture. The cure is to decide the priority order once, in one place, and then keep selectors flat. Three habits do most of the work."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1. One layer statement, at the top of the entry file. */\n@layer reset, base, components, utilities;\n\n/* 2. Zero-specificity resets, so authors never fight them. */\n@layer reset {\n  :where(h1, h2, h3, p) { margin-block: 0; }\n}\n\n/* 3. Utilities last, so they win without !important. */\n@layer utilities {\n  .mt-0 { margin-top: 0; }\n}\n\n/* When you genuinely need a nudge, repeat the class.\n   Honest, greppable, and it raises B rather than A. */\n.card.card { border-color: currentColor; }   /* 0-2-0 */"
    },
    {
      "t": "p",
      "x": "Keep IDs out of stylesheets. Use them for anchors, labels and JavaScript hooks, where they belong. Once a `#app` prefix is in your selectors, every override downstream has to carry an ID too, and the floor of the whole sheet rises permanently. The `.card.card` trick is sometimes called out as a hack, and it is, but it beats `#main #content .card` and it tells the next reader exactly what you meant. The older `:not(#\\9)` variants of the same idea are harder to read with no advantage, so skip them."
    },
    {
      "t": "p",
      "x": "One last option that tends to be forgotten: `revert-layer`. Setting `color: revert-layer` rolls the property back to whatever the previous layer computed, which is often cleaner than guessing the original value and restating it. `revert` goes further and hands the property back to the user or browser default. Both are useful when you are undoing a component's own styling in a specific context."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check in this order: does the rule appear in the Styles pane at all (if not, the selector does not match), is the declaration crossed out with a warning icon (invalid value), is a shorthand later in the cascade resetting it, and only then compare specificity. A rule can also win the cascade and still do nothing, for example `width` on an inline element."
        },
        {
          "q": "Does an inline style override !important?",
          "a": "No. Importance is compared before element-attached styles, so `.btn { color: red !important }` in a stylesheet beats `style=\"color: blue\"` on the element. What does beat it is `style=\"color: blue !important\"`, because that declaration is both important and element-attached."
        },
        {
          "q": "How do I override !important in a third-party stylesheet?",
          "a": "Use cascade layers. Important declarations invert layer order, so a declaration marked `!important` in a layer declared *before* theirs wins. If their CSS is unlayered, putting yours in any layer with `!important` is enough. Failing that, `@import url(\"vendor.css\") layer(vendor)` lets you place their whole sheet in the order you want without editing it."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations. Layer comparison happens before specificity, so a `0-0-1` type selector in a later layer beats a `1-1-0` selector in an earlier one. Unlayered declarations behave as the final, highest layer. For important declarations the layer order runs backwards and unlayered ranks lowest."
        },
        {
          "q": "What is the specificity of :is(), :where() and :has()?",
          "a": "`:where()` is always `0-0-0`. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, so `:is(a, #main)` counts as `1-0-0` even when it matched the `a`. This is why a single ID inside an `:is()` list can quietly raise a whole selector."
        },
        {
          "q": "Does writing a class twice, like .btn.btn, really increase specificity?",
          "a": "It does. The specificity algorithm counts occurrences, not distinct simple selectors, so `.btn.btn` is `0-2-0` and matches exactly the same elements as `.btn`. It is a deliberate hack, but a legible one, and it is preferable to introducing an ID you will have to out-rank forever."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout model fits the problem, and the cases where the answer is both.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Test foreground and background pairs against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same debugging instinct applied to state: find which step actually swallowed your change.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guides"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-05",
  "updated": "2026-10-05",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
