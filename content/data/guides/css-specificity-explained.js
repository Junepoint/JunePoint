module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Specificity, cascade layers and !important, in the order the browser actually resolves them, plus the non-specificity reasons a rule silently does nothing.",
  "standfirst": "A debugging order for CSS that does not apply: what to rule out first, how specificity is really counted, and where @layer and !important sit in the cascade.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Specificity, @layer and !important explained in the order the browser resolves them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Most of the time the rule is not losing a specificity fight. It is not matching, or the declaration was discarded as invalid. Check for a strikethrough versus a warning icon in DevTools before you count selectors.",
        "Specificity is three numbers compared left to right, never a sum. One ID beats eleven classes.",
        "Cascade layers outrank specificity. A plain `a { color: red }` in a later layer beats `#nav a` in an earlier one.",
        "For `!important` declarations the layer order flips, and unlayered `!important` becomes the weakest of the lot.",
        "`:where()` always contributes zero specificity, which makes it the honest way to ship defaults other people can override."
      ]
    },
    {
      "t": "lede",
      "x": "You wrote a rule. The element ignores it. Before you add `!important` and move on, spend thirty seconds establishing which of three very different failures you are actually looking at: the selector does not match the element, the declaration was parsed and thrown away, or the declaration is valid and losing to another one. Only the third is a cascade problem, and it is the least common of the three."
    },
    {
      "t": "h2",
      "x": "First, check whether the rule is even in play"
    },
    {
      "t": "p",
      "x": "Open the Elements panel, select the element, and look at the Styles pane. Browsers give you three distinct signals and they mean different things. A declaration with a **line through it** matched the element and lost the cascade. A declaration that is greyed out with a **warning triangle** was rejected by the parser: the property name is unknown or the value is invalid for that property. A rule that **does not appear at all** never matched, which means your selector is wrong, the markup is not what you think it is, or the stylesheet did not load."
    },
    {
      "t": "p",
      "x": "That last case swallows a lot of time. A single invalid selector poisons an entire selector list. If you write `.card, ::-webkit-slider-thumb { color: red; }` and the browser does not recognise the second selector, the whole rule is dropped, including the part that would have worked. Split vendor-prefixed pseudo-elements into their own rules. Selector lists inside `:is()` and `:where()` are forgiving by design, so unknown selectors there are skipped rather than fatal, but a plain comma-separated list is not."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Broken: one unsupported selector kills both */\n.card,\n::-webkit-slider-thumb {\n  border-radius: 4px;\n}\n\n/* Fine: independent rules fail independently */\n.card { border-radius: 4px; }\n::-webkit-slider-thumb { border-radius: 4px; }"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Custom properties fail quietly",
      "x": "If a `var()` substitution produces something invalid, the property does not fall back to an earlier declaration. It becomes unset, which means inherited for an inherited property and initial for everything else. A typo like `--pad: 8pxx` will not leave your old padding in place, it will collapse padding to `0`. DevTools shows the computed value, not the typo, so check the custom property definition itself."
    },
    {
      "t": "h2",
      "x": "The order the browser resolves in"
    },
    {
      "t": "p",
      "x": "Specificity is one step in a longer sequence, and it is nowhere near the top. When two declarations set the same property on the same element, the browser compares them in this order and stops at the first difference."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author, user and user-agent stylesheets, with `!important` inverting the usual order between them.",
        "**Encapsulation context.** Shadow DOM boundaries; the outer context normally wins, and the inner one wins for `!important`.",
        "**Element-attached styles.** The `style` attribute beats any selector-based author rule of the same importance.",
        "**Cascade layers.** Later layer wins for normal declarations, earlier layer wins for important ones.",
        "**Specificity.** Only now do we count IDs, classes and elements.",
        "**Order of appearance.** Last one in the final stylesheet order wins the tie."
      ]
    },
    {
      "t": "p",
      "x": "Written out as a single ladder, from weakest to strongest, the origin and importance step looks like the table below. Two entries surprise people. CSS animations sit above all normal author declarations, so a running `@keyframes` will beat your rule no matter how many IDs you stack in front of it. Transitions sit at the very top, above every `!important` in the document, which is why a mid-transition value cannot be forced."
    },
    {
      "t": "table",
      "head": [
        "Precedence",
        "Source",
        "Practical note"
      ],
      "rows": [
        [
          "1 (weakest)",
          "User-agent normal",
          "Browser defaults. Your reset beats these trivially."
        ],
        [
          "2",
          "User normal",
          "Reader stylesheets and some extensions."
        ],
        [
          "3",
          "Author normal",
          "Almost everything you write lives here."
        ],
        [
          "4",
          "CSS animations",
          "A running keyframe beats any normal author rule."
        ],
        [
          "5",
          "Author `!important`",
          "Beats the `style` attribute, but not an inline `!important`."
        ],
        [
          "6",
          "User `!important`",
          "Accessibility overrides. Deliberately unbeatable by sites."
        ],
        [
          "7",
          "User-agent `!important`",
          "A tiny set, mostly around form control internals."
        ],
        [
          "8 (strongest)",
          "CSS transitions",
          "Nothing overrides a transition in progress."
        ]
      ],
      "caption": "Origin and importance, lowest to highest. This comparison happens before specificity is looked at."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a triple, usually written `(A, B, C)`. `A` counts ID selectors. `B` counts classes, attribute selectors and pseudo-classes. `C` counts element type selectors and pseudo-elements. The comparison is lexicographic: compare `A`, and only if it ties compare `B`, and only then `C`. There is no carrying. `(0, 11, 0)` loses to `(1, 0, 0)` every time, which is the single most useful thing to internalise here."
    },
    {
      "t": "p",
      "x": "Combinators (`>`, `+`, `~`, whitespace) add nothing. The universal selector `*` adds nothing. Everything else is countable, including the ones that look like they should be free."
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
          "0, 0, 0",
          "Universal selector is always free."
        ],
        [
          "`li`",
          "0, 0, 1",
          "One type selector."
        ],
        [
          "`ul > li + li`",
          "0, 0, 3",
          "Three type selectors, combinators are free."
        ],
        [
          "`.card`",
          "0, 1, 0",
          "One class."
        ],
        [
          "`[data-open=\"true\"]`",
          "0, 1, 0",
          "Attribute selectors count as classes."
        ],
        [
          "`a:hover`",
          "0, 1, 1",
          "Pseudo-class counts as a class."
        ],
        [
          "`p::first-line`",
          "0, 0, 2",
          "Pseudo-elements count as type selectors."
        ],
        [
          "`#main`",
          "1, 0, 0",
          "One ID."
        ],
        [
          "`:is(#main, .card) p`",
          "1, 0, 1",
          "`:is()` takes its most specific argument."
        ],
        [
          "`:where(#main, .card) p`",
          "0, 0, 1",
          "`:where()` always contributes zero."
        ],
        [
          "`.card:has(.badge)`",
          "0, 2, 0",
          "`:has()` also takes its most specific argument."
        ],
        [
          "`:not(.a, #b)`",
          "1, 0, 0",
          "`:not()` is not free either."
        ]
      ],
      "caption": "Specificity of common selectors. Compare left to right, never add the columns together."
    },
    {
      "t": "p",
      "x": "The `style` attribute is often described as `(1, 0, 0, 0)`. That is a useful mental shortcut and a slightly wrong model. In the current cascade specification, element-attached styles are a separate comparison step that happens before specificity is consulted at all. The practical consequence is the same: you cannot out-specify an inline style with a selector. You can beat it with `!important`, and that is one of the few places `!important` is the correct tool rather than a surrender."
    },
    {
      "t": "h2",
      "x": "Cascade layers sit above specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the feature that makes most `!important` usage unnecessary. Declare an order once, and any declaration in a later layer beats any declaration in an earlier layer, regardless of how specific either one is. Specificity still decides fights inside a single layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One statement fixes the order for the whole document. */\n@layer reset, vendor, components, utilities;\n\n@layer components {\n  #sidebar a { color: #111; }      /* (1,0,1) */\n}\n\n@layer utilities {\n  .link-muted { color: #767676; }  /* (0,1,0) but wins */\n}"
    },
    {
      "t": "p",
      "x": "The low-specificity utility class wins because `utilities` was listed after `components`. That is the whole feature. It lets you keep sane selectors in your own code instead of escalating to `#app #sidebar a.link.link-muted` to beat a framework."
    },
    {
      "t": "p",
      "x": "Unlayered styles are not the weakest. For normal declarations they behave as though they sit in an implicit final layer, so anything outside `@layer` beats everything inside one. This trips people up when they add layers to an existing codebase: the old unlayered CSS suddenly outranks the new layered CSS. Either move everything into layers or accept that unlayered code is your top tier."
    },
    {
      "t": "p",
      "x": "To capture a third-party stylesheet in a layer, import it with `layer()`. A layer statement rule is allowed before `@import`, which is what you want, because the order in that statement is what counts."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, app;\n@import url(\"vendor/bootstrap.min.css\") layer(vendor);\n\n@layer app {\n  .btn { border-radius: 0; }  /* no !important needed */\n}"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support",
      "x": "`@layer` shipped in Chrome 99, Firefox 97 and Safari 15.4, all during the first quarter of 2022. `:has()` landed later, reaching Firefox in version 121 in December 2023. Both are widely available as of this writing in September 2026, but check current browser support data and your own analytics before relying on either, particularly if you support long-lived embedded browsers."
    },
    {
      "t": "h2",
      "x": "What !important really does, including the part that surprises people"
    },
    {
      "t": "p",
      "x": "`!important` moves a declaration into a different bucket in step one of the cascade. It does not change specificity. Two important declarations still fight each other, and that fight follows the same ladder: layers first, then specificity, then order. Which is where the trap lives."
    },
    {
      "t": "p",
      "x": "**Within important declarations, layer order is reversed.** Earlier layers beat later layers, and unlayered important declarations are the weakest of all rather than the strongest. So the `!important` you added to your app code, sitting outside any layer, will lose to an `!important` inside a vendor layer you imported. This is deliberate: it means a low-level layer can protect a declaration that higher layers must not casually stomp on. It is also genuinely confusing the first time you hit it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base {\n  .alert { color: red !important; }   /* wins */\n}\n\n@layer theme {\n  .alert { color: blue !important; }  /* loses */\n}\n\n.alert { color: green !important; }   /* unlayered, loses to both */"
    },
    {
      "t": "p",
      "x": "There are defensible uses. Overriding an inline style set by a script you do not control is one. Print stylesheets are another. Accessibility-driven user stylesheets are the case the specification was designed around, and they outrank anything an author writes. What `!important` should not be is a substitute for understanding why your rule lost, because the next person will need a second `!important` to beat yours, and that escalation has no ceiling."
    },
    {
      "t": "h2",
      "x": "The failures that are not cascade failures at all"
    },
    {
      "t": "p",
      "x": "Assume the rule matched and was valid, and it still is not taking effect. Work through these before touching specificity."
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand later in the file reset your longhand.** `background: url(hero.jpg)` sets `background-color` back to `transparent`. Same story for `font`, `border`, `grid`, `flex` and `inset`.",
        "**You styled a parent and expected inheritance.** `color` and `font-family` inherit. `border`, `padding` and `background` do not.",
        "**An inherited value is losing to a direct match.** Inheritance is not part of the specificity comparison. Any rule that matches the element directly, including a browser default, beats a value inherited from an ancestor.",
        "**The property does not apply to that element.** `width` on an inline element, `vertical-align` on a block, `z-index` without positioning or a flex or grid parent.",
        "**Build order is not source order.** Your bundler may concatenate stylesheets in a different order than your imports suggest. Check the compiled output, not the source.",
        "**The element is inside shadow DOM.** Outer page rules do not cross the boundary unless the component exposes `::part()` or accepts custom properties.",
        "**A media or container query matched later** and set the property back."
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
          "title": "Confirm the element matches",
          "x": "In the console, run the selector directly. If it returns nothing, stop: this is a selector problem, not a cascade problem.",
          "code": "document.querySelectorAll('#sidebar a.link-muted').length"
        },
        {
          "title": "Read the Computed tab, not the Styles tab",
          "x": "Expand the property in question. The browser shows the winning declaration and a link straight to the rule that produced it. That link answers 'what beat me' faster than any manual reasoning."
        },
        {
          "title": "Check for a parse error",
          "x": "A warning icon next to the declaration means it was discarded. Look at the value, not the selector."
        },
        {
          "title": "Compare layers before specificity",
          "x": "If the winning rule lives in a different `@layer`, specificity is irrelevant. Fix the layer order or move your rule."
        },
        {
          "title": "Then, and only then, count",
          "x": "Compare the two triples left to right. If yours genuinely is lower, prefer restructuring or a layer over adding an ID."
        },
        {
          "title": "Lower the other rule instead of raising yours",
          "x": "Wrapping a library's selector in `:where()` drops it to zero specificity and is usually cleaner than escalating your own.",
          "code": ":where(.prose) a { color: inherit; }  /* 0,0,1 */"
        }
      ]
    },
    {
      "t": "p",
      "x": "The habit worth building is resisting the escalation. Every ID you add to win an argument makes the next rule harder to write, and the codebase drifts toward selectors nobody can safely delete. Layers, `:where()` and a shallow selector convention cost a little setup and remove most of the fights permanently."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though it is more specific?",
          "a": "Check three things in order. Is the rule shown at all in DevTools (if not, the selector does not match)? Is it greyed out with a warning (the declaration is invalid and was discarded)? Is the winning rule in a later cascade layer, an inline `style` attribute, or a running animation or transition? All three of those are resolved before specificity is ever compared."
        },
        {
          "q": "Does an inline style always win?",
          "a": "It beats every normal author declaration, no matter how specific the selector. It does not beat an author declaration marked `!important`. An inline style that itself carries `!important` beats that too, and at that point your only author-side options are removing the attribute in JavaScript or a user stylesheet."
        },
        {
          "q": "How do I override a third-party library without !important?",
          "a": "Import it into a cascade layer with `@import url(\"lib.css\") layer(vendor)` and declare `@layer vendor, app` so your own layer comes later. Every declaration in `app` then beats every declaration in `vendor` regardless of specificity. If you cannot use layers, wrap the library selectors in `:where()` in a local override sheet, or scope your own rules under a container class you control."
        },
        {
          "q": "Why does my !important rule lose to another !important rule?",
          "a": "Because important declarations follow the same ladder, with one inversion: cascade layer order is reversed. Earlier layers win, and unlayered important declarations are the weakest rather than the strongest. If both declarations sit in the same layer, it falls through to specificity and then to source order as normal."
        },
        {
          "q": "How many classes does it take to beat an ID?",
          "a": "No number of classes beats an ID. Specificity is compared column by column, left to right, with no carrying, so `(0, 50, 0)` still loses to `(1, 0, 0)`. To win against an ID selector you need an ID of your own, a later cascade layer, an inline style, or `!important`."
        },
        {
          "q": "Is :where() or :is() better for keeping specificity low?",
          "a": "`:where()` contributes zero specificity, always. `:is()` takes the specificity of its most specific argument, so `:is(#main, .card)` costs a full ID. Use `:where()` for defaults and library styles you want people to override easily, and `:is()` when you just want to shorten a selector list and are happy to keep the weight."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout model fits which problem, without the false dichotomy.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check any foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "Five causes of state that looks one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-10",
  "updated": "2026-09-10",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
