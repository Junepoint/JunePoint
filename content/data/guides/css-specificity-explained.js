module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Your CSS rule is matching. It is losing.",
  "eyebrow": "Guide",
  "description": "Specificity, cascade layers and !important decide which CSS declaration wins. Work out why yours loses, and fix it without starting an override war.",
  "standfirst": "Most rules that \"do not work\" match the element perfectly well and then lose the cascade. Here is how to tell those two failures apart in under a minute, and what to change once you know which one you have.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "important css",
    "specificity calculator"
  ],
  "cardDesc": "Read the specificity, find the rule beating yours, and fix it without adding another !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Two different failures look identical in the browser: a selector that never matched, and a declaration that matched and was outranked. Open DevTools and check whether your rule appears with a line through it. Struck through means it matched and lost.",
        "Specificity is three numbers, not one: IDs, then classes and attributes and pseudo-classes, then types and pseudo-elements. They are compared left to right and the first difference ends the comparison.",
        "Source order only breaks ties. A rule at the bottom of your stylesheet does not beat a more specific rule at the top.",
        "Cascade layers are decided *before* specificity. A 0-1-0 selector in a later layer beats a 1-1-0 selector in an earlier one, and unlayered styles beat every layer.",
        "`!important` does not raise specificity. It moves the declaration into a separate, higher-priority pass that is sorted by its own rules, including a reversed layer order.",
        "Some things bypass the contest completely: inline styles, running transitions, `@keyframes` while an animation plays, and properties that simply do not apply to that element's box."
      ]
    },
    {
      "t": "lede",
      "x": "Before you touch specificity, rule out the boring answer. A rule that does not appear in DevTools at all never matched, and no amount of `!important` will save it. A typo in a class name, a descendant combinator where you wanted a child, an invalid value that the parser silently dropped, a stylesheet returning 404: these account for a large share of the cases people bring to a specificity article. Confirm the rule matched first. Then read on."
    },
    {
      "t": "h2",
      "x": "Separate 'did not match' from 'matched and lost'"
    },
    {
      "t": "p",
      "x": "In the Elements panel, select the element and look at the Styles pane. Your rule will be in one of three states. Absent means the selector did not match, or the file did not load. Present with the declaration struck through means something else won, and the pane lists the winner above it. Present and not struck through, yet the page looks wrong, usually means the property does not do what you think it does on that element."
    },
    {
      "t": "p",
      "x": "That third case catches people out. `width` on a non-replaced inline element does nothing. `gap` needs a flex, grid or multi-column container to have any effect. `z-index` is ignored on a `position: static` element outside a flex or grid parent. The declaration is applied, it is just inert. The Computed pane is the tiebreaker: it shows the value the browser actually resolved, and expanding a property jumps you straight to the rule that provided it."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Did the selector match anything at all?\ndocument.querySelectorAll('.card .btn').length\n\n// What did the browser actually compute?\ngetComputedStyle(document.querySelector('.btn')).color\n\n// Is something setting it inline from JavaScript?\ndocument.querySelector('.btn').getAttribute('style')"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Check the parse, not just the match",
      "x": "An invalid declaration is discarded at parse time and never shows up in the cascade. `margin: 10` without a unit, `color: #gggggg`, a stray semicolon inside a value: each one drops that single declaration while the rest of the rule survives. Chrome and Firefox both flag these with a warning icon in the Styles pane, which is easy to miss if you are scanning for struck-through text."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Every selector gets three counters, usually written `A-B-C`. A counts IDs. B counts classes, attribute selectors and pseudo-classes. C counts element types and pseudo-elements. Compare A first. If A differs, you are done, and nothing in B or C matters. Only when A ties do you look at B, and only when B ties do you look at C."
    },
    {
      "t": "p",
      "x": "This is why the folk wisdom about ten classes beating an ID is wrong. In current browsers the counters do not overflow into each other, so a selector with fifty classes still loses to a single `#id`. The idea comes from very old implementations that packed the three numbers into a base-256 integer, and it has outlived the browsers it described."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Specificity",
        "Notes"
      ],
      "rows": [
        [
          "`*`",
          "0-0-0",
          "The universal selector and the combinators `>`, `+`, `~` and descendant space all contribute nothing."
        ],
        [
          "`li::before`",
          "0-0-2",
          "Type selectors and pseudo-elements both count in the third slot."
        ],
        [
          "`.card`",
          "0-1-0",
          "Same weight as `[type=\"text\"]` and `:hover`. Attribute selectors and pseudo-classes are not special."
        ],
        [
          "`#main`",
          "1-0-0",
          "Beats any number of classes."
        ],
        [
          "`:is(.a, #b)`",
          "1-0-0",
          "Takes the specificity of its most specific argument, even if a different argument is what matched."
        ],
        [
          "`:not(.a)`",
          "0-1-0",
          "Same rule as `:is()`. The parentheses count, the `:not` itself does not."
        ],
        [
          "`:has(#b)`",
          "1-0-0",
          "Also takes its most specific argument, which makes `:has()` easy to over-weight by accident."
        ],
        [
          "`:where(.a, #b)`",
          "0-0-0",
          "Always zero, whatever is inside it. The one deliberate escape hatch."
        ],
        [
          "`style=\"color: red\"`",
          "not a selector",
          "Sorted above all normal author rules regardless of how specific they are."
        ]
      ],
      "caption": "The three counters, and the selectors that behave unexpectedly."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-2-0. Written first, and it still wins. */\n.card .btn { color: gray; }\n\n/* 0-1-0. Written last, still loses. Source order only breaks ties. */\n.btn { color: teal; }\n\n/* 0-1-1. Beats .btn, loses to .card .btn. */\na.btn { color: rebeccapurple; }"
    },
    {
      "t": "p",
      "x": "Two related misreadings are worth naming. The order of names inside a `class` attribute means nothing; `class=\"a b\"` and `class=\"b a\"` produce identical results, because the winner is decided by the stylesheet, not the markup. And a media query adds no specificity at all. If a rule inside `@media (min-width: 60rem)` is losing to a rule outside it, move it later in the file or match its specificity, because the media query itself will not help you."
    },
    {
      "t": "h2",
      "x": "Use :where() to make styles easy to override"
    },
    {
      "t": "p",
      "x": "The usual response to a losing rule is to make it heavier. Prefix it with a parent class, add the ID of a wrapper, repeat the class (`.btn.btn`) for a cheap extra point. Each of these works once and raises the floor for everyone who comes after you. Six months later the floor is `#app .page .card .btn` and nobody can style a button without reading the whole file."
    },
    {
      "t": "p",
      "x": "`:where()` runs the other way. It accepts a selector list and always contributes zero, which lets you scope a rule tightly while leaving it cheap to override. This is the right tool for resets, typography defaults and anything a consumer of your stylesheet is expected to change."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-1-0: overriding this now requires at least one class */\n.prose h2 { margin-block-start: 2rem; }\n\n/* 0-0-1: the .prose scoping is free, so a bare .tight-heading wins */\n:where(.prose) h2 { margin-block-start: 2rem; }\n\n/* Useful for broad resets that should never fight anyone */\n:where(ul, ol)[role=\"list\"] { list-style: none; padding-inline-start: 0; }"
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity entirely"
    },
    {
      "t": "p",
      "x": "`@layer` changes the order of the comparison, and that is the part people miss. Specificity is not consulted until the browser has established that two declarations sit in the same layer. Between layers, the later layer wins outright. A single utility class in a late layer will beat a four-part ID selector in an early one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, at the top. This line alone establishes precedence. */\n@layer reset, base, components, utilities;\n\n@layer components {\n  #page .btn { color: gray; }   /* 1-1-0 */\n}\n\n@layer utilities {\n  .text-brand { color: var(--brand); }  /* 0-1-0, and it wins */\n}\n\n/* Not in any layer. Beats every layered rule above, at any specificity. */\n.btn { color: black; }"
    },
    {
      "t": "p",
      "x": "That last block is the rule to memorize: unlayered author styles take priority over all layered author styles. It is designed so that adopting layers gradually does not break your existing CSS, but it also means sprinkling `@layer` into one file while the rest of the codebase stays unlayered will do the opposite of what you want. Layers pay off when the low-priority stuff goes into layers and your own application CSS stays outside them, or when everything is layered and the order is declared in one place."
    },
    {
      "t": "p",
      "x": "The most practical use is taming a third-party stylesheet whose selectors are heavier than yours. Import it into a layer and its specificity stops mattering."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer vendor, app;\n\n/* @layer statements may precede @import; other rules may not. */\n@import url(\"some-framework.css\") layer(vendor);\n\n@layer app {\n  .btn { border-radius: 0; }  /* 0-1-0 beats anything in vendor */\n}"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layer order is fixed by first mention",
      "x": "A layer's position is set the first time its name appears, not where its rules live. If a stray `@layer components { ... }` block loads before your `@layer reset, base, components, utilities;` statement, the order you get is the one that arrived first. Declare the full order in a single statement at the very top of your entry stylesheet and never rely on file ordering to establish it."
    },
    {
      "t": "h2",
      "x": "What !important really does"
    },
    {
      "t": "p",
      "x": "`!important` does not add specificity. It moves the declaration into a completely separate sorting pass. Normal declarations are sorted user agent, then user, then author. Important declarations are sorted in the reverse direction: author important, then user important, then user agent important. That reversal is the whole design. It exists so a user stylesheet forcing a larger font size can override a site that insists on 11px, which is an accessibility feature and not an accident."
    },
    {
      "t": "p",
      "x": "Inside the author origin, important declarations have their own quirks. Layer order reverses, so an earlier layer beats a later one for important declarations, and unlayered important declarations have the *lowest* priority of all author important declarations. Within a single layer, ordinary specificity then applies as usual. An `!important` declaration in a stylesheet also beats a normal inline `style` attribute, which is the one case where important genuinely solves a problem you cannot solve any other way."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "The escalation trap",
      "x": "Once two important declarations collide, the only ways forward are more specificity or an inline important. Codebases reach `#app .modal .btn.btn { color: red !important }` one honest fix at a time. If you are adding a second `!important` to defeat a first, stop and put the losing stylesheet in a layer instead. That fixes the whole class of conflict rather than one property."
    },
    {
      "t": "p",
      "x": "There are legitimate uses. Overriding a widget that writes inline styles from JavaScript. A debugging probe you will delete in ten minutes. A single-purpose utility class in a design system where the contract is explicitly \"this always wins\". What makes those acceptable is that they are bounded. An `!important` inside a general-purpose component style is a promise you cannot keep."
    },
    {
      "t": "h2",
      "x": "The things that ignore all of this"
    },
    {
      "t": "p",
      "x": "A handful of mechanisms sit outside the specificity comparison entirely, and they explain the cases where every rule you can find appears to be losing to nothing at all."
    },
    {
      "t": "ul",
      "items": [
        "**Transitions.** A declaration from a running transition beats everything, including author `!important`. If a color snaps back mid-hover, look for a transition before you look at the cascade.",
        "**Animations.** While an animation is running, `@keyframes` declarations override all normal author declarations. `!important` inside a keyframe block is ignored outright, per spec. With `animation-fill-mode: forwards`, the final frame keeps applying after the animation ends, which looks exactly like a stuck style.",
        "**Inline styles.** The `style` attribute outranks every normal author rule. If a library writes to `element.style`, you are not going to win with a selector, however long.",
        "**Presentational attributes.** Legacy attributes such as `width` on a table cell act as author-origin declarations with zero specificity, so they lose to any rule you write, including a bare type selector.",
        "**Shadow DOM.** Styles inside a shadow root are isolated. Outer page rules do not reach in, regardless of specificity. You need `::part()`, a custom property the component reads, or `:host` styling from inside.",
        "**Inheritance.** An inherited value is not a competitor. If nothing on the element itself sets `color`, the inherited value applies, and the fix belongs on the ancestor or on the element, not in an override war."
      ]
    },
    {
      "t": "h2",
      "x": "A repair order that does not make things worse"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the rule matched",
          "x": "Find it in the Styles pane. Absent means a selector or loading problem, and nothing below this step will help. Run the selector through `querySelectorAll` to be certain.",
          "code": "document.querySelectorAll('.card .btn').length"
        },
        {
          "title": "Read the winner, not your own rule",
          "x": "DevTools lists the rule that won above yours, with its source file and line. That selector, not a guess, is what you have to account for. Copy it somewhere before you start editing."
        },
        {
          "title": "Check for a layer before counting specificity",
          "x": "If the winning rule sits under an `@layer` heading in DevTools and yours does not, or the layers differ, specificity was never consulted. Fix the layer assignment and stop."
        },
        {
          "title": "Count the three numbers for both selectors",
          "x": "IDs, then classes and attributes and pseudo-classes, then types. Compare left to right. If they tie, source order decided it and moving your rule later is the correct and complete fix."
        },
        {
          "title": "Match the weight, do not exceed it",
          "x": "If you need more weight, add the smallest amount that works and prefer a class over an ID. Doubling a class is an honest way to add exactly one point without inventing a fake ancestor.",
          "code": ".btn.btn { color: teal; } /* 0-2-0, no imaginary wrapper required */"
        },
        {
          "title": "Reach for layers before !important",
          "x": "If the conflict is structural rather than a one-off, move the losing stylesheet into an earlier layer. That resolves every future collision with it, not just this property."
        }
      ]
    },
    {
      "t": "p",
      "x": "One habit prevents most of this work. Keep almost all of your selectors at a single class of weight, put resets and third-party code in layers below your application styles, and wrap structural scoping in `:where()` so it costs nothing. Flat specificity means source order does the deciding, and source order is something you can read at a glance. Once you are laying out those components, the choice between [Grid and Flexbox](/guides/css-grid-vs-flexbox/) is a separate question, and one with a clearer answer."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout system fits which problem, without the usual hand-waving.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Once the right color finally applies, check it passes WCAG AA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState not updating",
          "desc": "When the class name is correct but the element never re-rendered with it.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check DevTools first. If the rule is not listed for the element, the selector did not match or the file did not load. If it is listed with a line through it, another rule won and DevTools names it. If it is listed and not struck through but nothing changed, the property probably does not apply to that element, such as `width` on an inline element or `gap` outside a flex, grid or multi-column container."
        },
        {
          "q": "How many classes does it take to beat an ID?",
          "a": "No number. Specificity is compared as three separate counters and IDs occupy the first one, so the browser stops before it ever looks at your classes. The claim that 256 classes beat an ID describes very old implementations that packed the counters into one integer. It is not true in any current browser."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "An `!important` declaration in a stylesheet does beat a normal inline `style` attribute, because importance is sorted before the style attribute's own priority. It does not beat an inline declaration that is itself marked `!important`, and it does not beat a running CSS transition. If a JavaScript library keeps rewriting `element.style`, the durable fix is stopping the library, not out-shouting it."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, and this surprises people. The browser compares layer order first and only falls through to specificity when both declarations are in the same layer. A 0-1-0 selector in a later layer beats a 1-0-0 selector in an earlier one. Unlayered author styles sit above every layer, so partially adopting layers can invert the result you expected."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. The difference is specificity: `:is()` takes the weight of its most specific argument, so `:is(.a, #b)` counts as 1-0-0 even when `.a` is what matched, while `:where()` always contributes zero. Use `:where()` for defaults and resets you want others to override easily, and `:is()` when you genuinely want the weight."
        },
        {
          "q": "How do I override a third-party library's styles without !important?",
          "a": "Import it into a cascade layer: `@layer vendor, app;` followed by `@import url(\"lib.css\") layer(vendor);`. Everything in that layer now loses to your unlayered or later-layered rules no matter how specific its selectors are. If the library is bundled by your build tool rather than imported by CSS, wrap the import in `@layer vendor { ... }` at the point it is included, and declare the layer order once at the top of your entry stylesheet."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-14",
  "updated": "2026-09-14",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
