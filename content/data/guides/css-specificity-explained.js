module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS Specificity, the Cascade and !important",
  "eyebrow": "CSS",
  "description": "Why a CSS rule does not apply: how the cascade sorts declarations, how specificity is counted, what cascade layers change, and when !important is the answer.",
  "standfirst": "Specificity is only the third tiebreaker a browser reaches. This is the order it actually uses, how to find the rule that won, and how to fix the conflict without starting an arms race.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Debug a CSS rule that will not apply: cascade order, specificity tuples, @layer, and the limits of !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The cascade sorts declarations in a fixed order: **origin and importance, then cascade layer, then specificity, then source order**. Specificity is only consulted once the earlier questions are settled.",
        "Specificity is three numbers compared left to right: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. Eleven classes never beat one ID.",
        "`:where()` always counts as zero. `:is()`, `:not()` and `:has()` count as their most specific argument. That difference is the cheapest tool you have for writing overridable CSS.",
        "Inside the author origin, `!important` **reverses** layer order, and an unlayered `!important` is the weakest of the group.",
        "Before blaming specificity, confirm the selector matched and the declaration parsed. A large share of these bugs are a typo or a dropped value, not a cascade problem."
      ]
    },
    {
      "t": "h2",
      "x": "Rule out the cheap explanations first"
    },
    {
      "t": "p",
      "x": "**Most reports of \"my CSS is not applying\" are not specificity problems.** Select the element in DevTools and read the Styles panel from the top. Three signals tell you most of what you need."
    },
    {
      "t": "p",
      "x": "If your selector is not listed at all, it never matched. Look for a misspelled class, a stylesheet that failed to load, or a child combinator where you wanted a descendant. If the selector is listed but the declaration is struck through, something beat it, and the panel usually shows the winner a few rows up. If the declaration carries a warning icon, the browser discarded it while parsing, before the cascade ever ran. `width: 100 px` and `color: #ff00` both die there, and neither produces a console error."
    },
    {
      "t": "p",
      "x": "Then check for a shorthand stepping on a longhand. This is the quietest version of the bug, because the selector matches and the value is valid:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  background-color: rebeccapurple;\n  /* The shorthand resets every background longhand it does not\n     mention, so background-color goes back to transparent. */\n  background: url(texture.png) no-repeat center;\n}"
    },
    {
      "t": "p",
      "x": "`font`, `border`, `inset`, `grid-area`, `transition` and `all` behave the same way. Order the shorthand first, then the longhand that refines it."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Media queries do not add specificity",
      "x": "`@media`, `@supports`, `@container` and `@layer` are not part of a selector's specificity. Two matching `min-width` blocks that set the same property on the same selector are decided purely by source order, which is why a `min-width: 768px` rule later in the file can override a `min-width: 1024px` rule above it. The same applies to the layout properties discussed in [CSS Grid vs. Flexbox](/guides/css-grid-vs-flexbox/)."
    },
    {
      "t": "h2",
      "x": "The cascade's order of operations"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser works through a sorted list of questions and stops at the first one that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Which stylesheet it came from, and whether it is marked `!important`.",
        "**Cascade layer.** Within one origin and importance level, which `@layer` the declaration sits in.",
        "**Specificity.** Only now does the selector's shape matter.",
        "**Order of appearance.** Last one wins, where \"last\" means last in the final resolved order of stylesheets."
      ]
    },
    {
      "t": "table",
      "head": [
        "Declaration",
        "Comes from",
        "Practical note"
      ],
      "rows": [
        [
          "Transitions",
          "An in-flight CSS transition",
          "Wins over everything while it runs, `!important` included."
        ],
        [
          "`!important` user agent",
          "Browser default stylesheet",
          "Rare, and mostly tied to form controls and accessibility."
        ],
        [
          "`!important` user",
          "User stylesheet or browser setting",
          "Deliberately above your CSS, so a reader's overrides survive."
        ],
        [
          "`!important` author",
          "Your CSS and third-party CSS",
          "Inside this bucket, layer order runs in reverse."
        ],
        [
          "Animations",
          "A running `@keyframes` animation",
          "Beats your normal declarations, which is why an animating element can ignore a perfectly good rule."
        ],
        [
          "Normal author",
          "Your CSS, plus inline `style` attributes",
          "Where nearly every day-to-day conflict lives."
        ],
        [
          "Normal user",
          "User stylesheet",
          "Below author CSS, which is the usual complaint about user styles."
        ],
        [
          "Normal user agent",
          "Browser defaults",
          "Link color, `button` font, `input` padding."
        ]
      ],
      "caption": "Cascade precedence, strongest first. Specificity is only compared inside one of these rows."
    },
    {
      "t": "p",
      "x": "Two consequences are worth internalizing. An `!important` in a vendor stylesheet cannot be beaten by any selector you write, however specific, because importance is settled before specificity is read. And a transition or animation outranks your static rules, so an element mid-animation will seem to refuse instructions until it settles."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "**Specificity is a three-part tuple compared left to right, not a score that adds up.** Write it as `1-0-0` for an ID, `0-1-0` for a class, `0-0-1` for an element type. A selector with `0-1-0` beats `0-0-11`, and nothing in the second or third column ever carries into the first."
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
          "`*`",
          "0-0-0",
          "The universal selector and the combinators `>`, `+`, `~` add nothing."
        ],
        [
          "`li`",
          "0-0-1",
          "One type selector."
        ],
        [
          "`li::marker`",
          "0-0-2",
          "Pseudo-elements count in the type column."
        ],
        [
          "`.note`",
          "0-1-0",
          "Classes, attribute selectors and pseudo-classes share the middle column."
        ],
        [
          "`[data-state='open']`",
          "0-1-0",
          "An attribute selector costs exactly what a class costs."
        ],
        [
          "`a:hover`",
          "0-1-1",
          "One pseudo-class and one type."
        ],
        [
          "`#main`",
          "1-0-0",
          "A single ID outranks any number of classes."
        ],
        [
          "`:where(#main, .note)`",
          "0-0-0",
          "`:where()` zeroes whatever you put inside it."
        ],
        [
          "`:is(#main, .note)`",
          "1-0-0",
          "`:is()`, `:not()` and `:has()` take their most specific argument."
        ],
        [
          "`style=\"color: red\"`",
          "n/a",
          "Inline styles beat every author selector but lose to any `!important`."
        ]
      ],
      "caption": "Common selectors and their specificity. The `:is()` and `:where()` rows are the ones people get wrong."
    },
    {
      "t": "p",
      "x": "Native nesting has a specificity trap built into it. A nested selector takes the specificity of its parent as if the parent were wrapped in `:is()`, so one stray ID in a selector list raises everything nested beneath it:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card,\n#hero {\n  /* Parent resolves as :is(.card, #hero), so this is 1-1-0,\n     not the 0-2-0 you probably expected. */\n  & .title {\n    color: var(--ink);\n  }\n}"
    },
    {
      "t": "p",
      "x": "The flip side is useful. `:where()` lets you ship defaults that anyone can override with a single class, which is how most modern resets and design-system base layers are written:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-2-0: a consumer now needs two classes to override it */\n.prose a.cta { text-decoration: underline; }\n\n/* 0-0-0: any single class wins, including .cta itself */\n:where(.prose a.cta) { text-decoration: underline; }"
    },
    {
      "t": "h2",
      "x": "Cascade layers change the question being asked"
    },
    {
      "t": "p",
      "x": "`@layer` moves precedence from the selector to the group. Because layer order is compared before specificity, a bare class in a later layer beats an ID selector in an earlier one. For normal declarations, later layers win."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. The first mention fixes it. */\n@layer reset, vendor, components, utilities;\n\n@layer vendor {\n  #widget .button { background: hotpink; }  /* 1-1-0 */\n}\n\n@layer utilities {\n  .bg-white { background: white; }           /* 0-1-0, and it wins */\n}\n\n/* Third-party CSS can be wrapped on the way in. */\n@import url(\"vendor-widget.css\") layer(vendor);"
    },
    {
      "t": "p",
      "x": "Unlayered normal styles sit above every layer. That makes incremental adoption possible, and it also makes it confusing: the legacy stylesheet you have not migrated yet outranks everything you carefully placed in layers. Expect a transitional period where some overrides look backwards."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "Within the author origin, important declarations are sorted in reverse layer order, and an unlayered `!important` is the weakest of them. So an `!important` in `@layer reset` beats an `!important` in `@layer utilities`. Putting a vendor stylesheet in an early layer makes its normal rules easy to override and its `!important` rules harder. That asymmetry is intentional, and it surprises almost everyone the first time."
    },
    {
      "t": "h2",
      "x": "Living with !important"
    },
    {
      "t": "p",
      "x": "`!important` is not forbidden. It is the correct tool for overriding a third-party `!important`, for a print stylesheet that must win, and for a user stylesheet whose entire job is to override the page. The cost is that you have spent the top of the cascade, so the next conflict has nowhere left to go, and the one after that gets solved with `#id .cls !important`."
    },
    {
      "t": "p",
      "x": "Note that two `!important` declarations fight each other with the ordinary rules: layer first, then specificity, then source order. Importance only lifts a declaration into a higher bucket. It does not make it unconditionally final."
    },
    {
      "t": "p",
      "x": "Before reaching for it, consider the keywords that undo a declaration instead of outranking it. They are frequently confused:"
    },
    {
      "t": "ul",
      "items": [
        "`initial` resets to the property's spec-defined initial value, which is often not the browser default. `display: initial` on a `div` yields `inline`.",
        "`inherit` takes the parent's computed value, even for properties that do not normally inherit.",
        "`unset` behaves as `inherit` for inherited properties and `initial` for the rest.",
        "`revert` rolls back to the previous origin. On a `button`, `all: revert` gives you the browser's own styling back, which `initial` will not.",
        "`revert-layer` rolls back to the value the previous cascade layer produced. This is the clean way for a component layer to opt out of a utility it does not want."
      ]
    },
    {
      "t": "h2",
      "x": "It matches, the specificity is fine, and it still loses"
    },
    {
      "t": "p",
      "x": "A handful of causes sit outside the selector comparison entirely. These are the ones that burn an afternoon."
    },
    {
      "t": "ul",
      "items": [
        "**Inline styles set by JavaScript.** A carousel or tooltip library writing `element.style.height` produces a declaration no author selector can outrank. Only `!important` beats it, or stopping the library from setting it.",
        "**Shadow DOM boundaries.** Page styles do not cross into a shadow root, apart from inherited properties, custom properties, and whatever the component exposes via `::part()`. Your selector is not losing, it is not in scope.",
        "**Custom property resolution.** `var(--ink)` resolves to whichever declaration of `--ink` won the cascade **on that element**. The specificity of the rule that declared the variable is what matters, not the specificity of the rule that used it, so a value can arrive from a stylesheet you are not looking at.",
        "**Bundler and framework ordering.** With CSS Modules, Tailwind's preflight, or two components importing the same file, equal specificity means the last declaration wins, and \"last\" is decided by the build graph rather than your source file. Check the order in the emitted CSS, not in the editor.",
        "**A property that does not inherit.** Setting `color` on a wrapper reaches the children. Setting `border` or `padding` does not. If an anchor or an `input` looks untouched, a user-agent style on that child is usually beating the inherited value.",
        "**A condition that never matched.** A `@container` query with no ancestor declaring `container-type` can never apply, and a `@supports` block guarding a now-shipped feature may be dead code pointing the wrong way."
      ]
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches something",
          "x": "Run the selector in the console before theorizing about the cascade. A result of 0 ends the investigation immediately.",
          "code": "document.querySelectorAll('.card .title').length"
        },
        {
          "title": "Confirm the declaration parsed",
          "x": "In the Styles panel, a warning icon beside the property means the value was invalid and dropped. Check units, commas and closing parentheses on `var()` and `clamp()`."
        },
        {
          "title": "Read the Computed tab, not the Styles tab",
          "x": "Expand the property in question. DevTools names the winning declaration and links to its file and line, which answers \"what beat me\" directly rather than by inspection."
        },
        {
          "title": "Identify which bucket the winner is in",
          "x": "Is it `!important`? An inline style? A layer above yours? An animation? The answer determines the fix, and it is usually not \"add another class\"."
        },
        {
          "title": "Fix at the level the conflict lives on",
          "x": "Reorder layers, lower your own defaults with `:where()`, or use `revert-layer`. Adding `#id` or `!important` resolves today's conflict by making tomorrow's harder."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A sanity check on the fix",
      "x": "After changing a color to win a cascade fight, verify the result still passes contrast requirements with the [color contrast checker](/tools/color-contrast-checker/). Overrides that win the cascade and fail accessibility are a common pairing."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my !important not working?",
          "a": "Something above it won. Check for another `!important` on the same property later in source order, one in an earlier cascade layer (important declarations reverse layer order), a running transition or animation, or a user-agent `!important` on a form control. Also confirm the syntax: it belongs before the semicolon, as `color: red !important;`."
        },
        {
          "q": "How many classes do I need to beat an ID?",
          "a": "No number of classes beats an ID. Specificity is a tuple compared left to right, so `1-0-0` wins against `0-1-0` and against `0-99-0` alike. Your options are matching the ID, wrapping it in `:is(#main)` to borrow its weight, placing your rule in a later cascade layer, or using `!important`."
        },
        {
          "q": "Does a media query increase specificity?",
          "a": "No. `@media`, `@supports`, `@container` and `@layer` contribute nothing to specificity. Two matching media blocks with identical selectors are resolved by source order, which is why a narrower breakpoint declared earlier can lose to a wider one declared later."
        },
        {
          "q": "Why did my styles break after I adopted cascade layers?",
          "a": "Three usual reasons. Unlayered styles outrank every layer, so a partially migrated codebase has inverted precedence. The order of layers is fixed by their first mention, so a stray `@layer components {}` early in a file can lock in an order you did not intend. And `!important` declarations sort in reverse layer order."
        },
        {
          "q": "Should I stop using IDs in selectors?",
          "a": "For styling, mostly yes, though not for moral reasons. An ID's `1-0-0` is hard to unwind later and tends to force `!important` downstream. If you need to target an element by its id attribute, `[id='main']` matches the same element at `0-1-0`. IDs remain fine for fragment links, labels and scripting."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. `:where()` always has zero specificity, while `:is()` takes the specificity of its most specific argument. Use `:where()` for base styles and resets you want others to override easily, and `:is()` when you want to keep a selector's weight while shortening it."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "A decision rule for picking a layout module, plus the patterns that avoid overflow bugs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check any foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The five causes behind state that looks one render behind, including stale closures.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-21",
  "updated": "2026-10-21",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
