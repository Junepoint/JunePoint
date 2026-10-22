module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity and the Cascade: Why Your Rule Loses",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Troubleshooting",
  "description": "How the CSS cascade is ordered, how specificity is really counted, what cascade layers change, and the cases where !important is the honest answer.",
  "standfirst": "Specificity is only one step of the cascade, and often it is not the step that beat you. Here is the order a browser actually applies, and how to find the declaration that won.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "css cascade order"
  ],
  "cardDesc": "The cascade decides before specificity does. Find the rule that beat yours, and stop reaching for !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is step five of the cascade, not step one. Origin, importance, shadow context, inline styles and cascade layers are all settled before a browser compares two selectors.",
        "Specificity is three numbers compared left to right, not one score. `.a.b.c.d.e.f.g.h.i.j.k` is (0,11,0) and still loses to `#main` at (1,0,0). It always will.",
        "`!important` reverses layer order. An important declaration in your *first* layer beats one in your last, and an important declaration outside every layer loses to both.",
        "Often the rule is not losing a fight at all. The selector does not match, the value failed to parse, the property does not apply to that element, or a shorthand later in the file reset it.",
        "`:where()` costs zero specificity. `:is()`, `:not()` and `:has()` cost the weight of their heaviest argument. That one difference fixes most override problems in design-system CSS.",
        "The Computed pane answers \"who won\" faster than reading selectors does. Expand the property, click through to the winning rule."
      ]
    },
    {
      "t": "h2",
      "x": "First, confirm the rule is in the fight"
    },
    {
      "t": "p",
      "x": "Before counting anything, prove the declaration reached the element. Inspect it, find your selector in the Styles pane, and sort the symptom into one of three buckets. They have nothing to do with each other."
    },
    {
      "t": "ul",
      "items": [
        "**Listed, struck through.** It lost the cascade, or the value is invalid. The rest of this page is about that case.",
        "**Listed, not struck through, nothing visible changed.** The property almost certainly does not apply to this element. `width` on an inline non-replaced element, `gap` on a container that is neither flex nor grid, `top` on a statically positioned box: all fail quietly, with no warning.",
        "**Not listed at all.** The selector does not match, the stylesheet never loaded, or the rule was dropped during parsing. Specificity is irrelevant here, and raising it will waste your afternoon."
      ]
    },
    {
      "t": "p",
      "x": "Two console lines separate those cases. Select the element so it becomes `$0`, then ask the browser directly rather than reading your own selector back to yourself."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does the selector match the element you think it does?\n$0.matches('.card > .title')   // false means the selector is the bug\n\n// What did the cascade actually produce?\ngetComputedStyle($0).color\n\n// An inline style you forgot about, or one a library set at runtime\n$0.style.color\n\n// Is the property missing from the computed style entirely?\n// Then the declaration never parsed, or you are inspecting the wrong node.\ngetComputedStyle($0).getPropertyValue('padding-inline-start')"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A struck-through declaration has two meanings",
      "x": "DevTools strikes through both overridden declarations and invalid ones. Hover the line: an overridden declaration is just crossed out, while an invalid property or value gets a warning icon. `margin: 10` and `transform: translate(8)` are both dropped at parse time, and no amount of `!important` will revive them."
    },
    {
      "t": "h2",
      "x": "The cascade, in the order the browser applies it"
    },
    {
      "t": "p",
      "x": "The cascade is a sorting procedure. Given two declarations for the same property on the same element, the browser walks these steps in order and stops at the first one that separates them. Most arguments about specificity are really arguments about step 1 or step 4."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What it compares",
        "Where it bites"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "Browser defaults, user styles, author styles, and whether a declaration carries `!important`",
          "A transition in flight outranks every `!important`. A user stylesheet's `!important` outranks anything you write."
        ],
        [
          "2. Context",
          "The outer document versus a shadow tree",
          "For normal declarations the outer tree wins. For `!important` the inside of the shadow tree wins."
        ],
        [
          "3. Element-attached styles",
          "A `style` attribute versus a rule in a stylesheet",
          "Inline `!important` is the strongest thing an author can write."
        ],
        [
          "4. Cascade layers",
          "`@layer` order, with unlayered styles treated as a final implicit layer",
          "Normal declarations: unlayered wins. Important declarations: the order flips, and unlayered loses."
        ],
        [
          "5. Specificity",
          "(IDs, classes, types) compared left to right",
          "`:is()` and `:has()` inherit their heaviest argument's weight."
        ],
        [
          "6. Scope proximity",
          "How close an `@scope` root sits to the element",
          "Only compares two scoped declarations. This step is newer than the others, so check the spec if you lean on it."
        ],
        [
          "7. Order of appearance",
          "The last declaration standing wins",
          "`@import` counts at its import position, not at the end of the importing file."
        ]
      ],
      "caption": "Cascade sorting order. The browser stops at the first step that distinguishes the two declarations."
    },
    {
      "t": "p",
      "x": "Two entries in step 1 surprise people. Declarations produced by a running CSS transition sit above all important declarations, which is why a hover colour can appear to ignore an `!important` for a few hundred milliseconds. Declarations from a running animation sit above normal author declarations but below important ones, so adding `!important` to a property an animation controls will freeze it."
    },
    {
      "t": "h2",
      "x": "How specificity is counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple: the number of ID selectors, then the number of class, attribute and pseudo-class selectors, then the number of type and pseudo-element selectors. Compare the first components. If they differ, you have your answer and the rest is ignored. Only on a tie do you look at the second, then the third."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "(IDs, classes, types)",
        "Note"
      ],
      "rows": [
        [
          "`*`, `>`, `+`, `~`",
          "(0,0,0)",
          "The universal selector and all combinators are free."
        ],
        [
          "`li`",
          "(0,0,1)",
          "Type selector."
        ],
        [
          "`li::marker`",
          "(0,0,2)",
          "A pseudo-element counts as a type selector."
        ],
        [
          "`.nav`",
          "(0,1,0)",
          "Class."
        ],
        [
          "`[data-open]`, `[id='main']`",
          "(0,1,0)",
          "Attribute selectors are class-weight even when the attribute is `id`."
        ],
        [
          "`:hover`, `:nth-child(2)`",
          "(0,1,0)",
          "Ordinary pseudo-classes are class-weight."
        ],
        [
          "`#main`",
          "(1,0,0)",
          "ID selector."
        ],
        [
          "`:where(#main .x)`",
          "(0,0,0)",
          "`:where()` always contributes nothing, whatever is inside it."
        ],
        [
          "`:is(#main, p)`",
          "(1,0,0)",
          "Takes the heaviest argument, even when `p` is the part that matched."
        ],
        [
          "`:not(.a)`",
          "(0,1,0)",
          "Same rule as `:is()`."
        ],
        [
          "`.btn.btn.btn`",
          "(0,3,0)",
          "Legal, ugly, and occasionally the least bad escape hatch."
        ],
        [
          "`style=\"...\"`",
          "not applicable",
          "Inline styles have no specificity. They are an earlier, separate step."
        ]
      ],
      "caption": "Specificity of common selector parts. Combinators never add weight, so selector length is not the same as selector strength."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "There is no exchange rate between columns",
      "x": "The old advice that an ID is \"worth 100\" and a class \"worth 10\" produces the right answer often enough to be dangerous. It is not how browsers compare selectors. Eleven classes do not add up to an ID, and no number of type selectors reaches a class."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Element: <a id=\"cta\" class=\"btn\">Buy</a> */\n\n#cta             { color: red; }    /* (1,0,0) wins */\n.btn.btn.btn.btn { color: blue; }   /* (0,4,0) loses, forever */\n\n/* A tie is broken by source order, so this is the one real rule\n   you can rely on in your own stylesheet: put overrides later. */\n.btn { color: green; }\n.btn { color: hotpink; }  /* (0,1,0) each, hotpink wins */"
    },
    {
      "t": "h2",
      "x": "The functional pseudo-classes change the arithmetic"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` take the specificity of their most specific argument. `:where()` contributes zero, no matter what you put inside. For anyone shipping CSS other people override, that distinction is the whole game: wrap your defaults in `:where()` and a single class in the consuming app can beat them without ceremony."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Library defaults, deliberately weightless at (0,0,1) */\n:where(.card) h2 {\n  margin-block: 0;\n  font-size: 1.25rem;\n}\n\n/* The same selector written with :is() is (1,0,1) because of #app.\n   An app author now needs an ID to override a heading style. */\n:is(#app, .card) h2 { font-size: 1.25rem; }\n\n/* Nesting: & resolves like :is() of the whole parent list */\n#sidebar, .widget {\n  & a { color: teal; }   /* (1,0,1) even inside .widget */\n}"
    },
    {
      "t": "p",
      "x": "That nesting case catches people migrating to native CSS nesting. The `&` does not mean \"whichever parent matched\". It carries the weight of the heaviest selector in the parent list, so one `#sidebar` in a grouped selector silently promotes every nested rule underneath it."
    },
    {
      "t": "h2",
      "x": "Cascade layers are a better lever than specificity"
    },
    {
      "t": "p",
      "x": "`@layer` moves the fight up to step 4, where you control the outcome by declaration rather than by selector weight. Declare the layer order once, near the top of your entry stylesheet. After that, a rule in a later layer beats a rule in an earlier layer regardless of specificity, and you can stop writing `.sidebar .widget .btn.btn` to win."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One line decides the priority order for the whole app. */\n@layer reset, vendor, components, utilities;\n\n/* Third-party CSS goes in a layer you can outrank by name. */\n@import url(\"vendor/bootstrap.css\") layer(vendor);\n\n@layer components {\n  #app .card .title { font-weight: 600; }   /* (1,2,0) */\n}\n\n@layer utilities {\n  .fw-normal { font-weight: 400; }          /* (0,1,0) and it wins */\n}\n\n/* Unlayered styles form a final implicit layer, so normal\n   declarations here outrank every layer above. Use sparingly. */\n.debug-outline { outline: 2px solid magenta; }"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Important declarations invert the layer order",
      "x": "Inside the author origin, `!important` flips step 4 end to end. An important declaration in `reset` beats an important declaration in `utilities`, and an important declaration in unlayered CSS loses to both, because the implicit unlayered layer sorts last. If you put `!important` inside a reset layer you have built a ceiling nobody downstream can get past."
    },
    {
      "t": "p",
      "x": "Every current major browser has supported cascade layers since 2022, so for most teams the question in October 2026 is whether your build tool preserves `@layer` blocks, not whether the feature exists. Check your CSS output, not just your source. Verify browser support against caniuse.com if you still target older versions."
    },
    {
      "t": "h3",
      "x": "@scope and proximity"
    },
    {
      "t": "p",
      "x": "`@scope` adds a different kind of tie-break: when two scoped declarations collide, the one whose scope root is nearer the element wins, independent of specificity. It solves the donut problem (style inside this component but not inside a nested one) that descendant selectors handle badly. Support arrived later than `@layer` did, and the proximity step is newer than the rest of the cascade, so confirm both before shipping it in a library."
    },
    {
      "t": "h2",
      "x": "When the winning rule still does nothing"
    },
    {
      "t": "p",
      "x": "Plenty of these bugs never involve two rules competing. The declaration is applied, uncontested, and has no effect. In rough order of how often they waste a developer's time:"
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand later in the file reset your longhand.** `background` clears `background-image`. `font` resets `line-height` to `normal`. `all: unset` clears everything. The shorthand does not need higher specificity, only a later position.",
        "**The custom property was invalid for the property that used it.** A `var()` fallback covers a missing custom property, not a substituted value that does not parse.",
        "**You set a non-inherited property on the parent.** `border`, `padding` and `background` do not flow down. `color`, `font-family` and `visibility` do.",
        "**The selector matches something else.** `.card.title` means one element with both classes. `.card .title` means a descendant. One missing space changes the meaning completely, and both are valid CSS.",
        "**A syntax error swallowed the block.** An unclosed comment or a stray brace can discard every rule that follows until the parser recovers. The rule simply will not appear in DevTools.",
        "**A shadow DOM boundary.** Your page styles do not reach inside a web component's shadow tree except through inherited properties, `::part()` and custom properties.",
        "**The class never made it into the build.** Utility frameworks that scan source text cannot see a class name assembled at runtime from a template string.",
        "**Injection order.** CSS-in-JS libraries typically insert rules in the order components first render, so a change in render order can change which equal-specificity rule lands last."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Shorthand trap: the second rule wipes out the image */\n.hero { background-image: url(hero.jpg); }\n.hero { background: #0b1020; }\n\n/* Invalid at computed-value time: padding falls back to 0,\n   and the fallback in var() does NOT save you here. */\n:root { --pad: 16; }           /* missing unit */\n.card { padding: var(--pad, 16px); }\n\n/* Fix it at the source */\n:root { --pad: 16px; }\n\n/* font shorthand quietly resets line-height */\n.lead { line-height: 1.6; font: 500 1.125rem/1.6 system-ui; }"
    },
    {
      "t": "h2",
      "x": "!important, honestly"
    },
    {
      "t": "p",
      "x": "It is a legitimate tool with a narrow brief. The problem is not the keyword, it is the escalation: once one override needs it, the next needs `!important` plus more specificity, and the one after that needs an inline `!important`. Then you are out of room, because the only things left above you are a user stylesheet, the browser's own important rules, and transitions. Nobody on your team can go higher."
    },
    {
      "t": "p",
      "x": "Cases where reaching for it is defensible:"
    },
    {
      "t": "ul",
      "items": [
        "Overriding an inline style written by third-party JavaScript you do not control. A stylesheet `!important` is the only CSS-only way to beat a normal inline declaration, because importance is compared before element-attached styles.",
        "Utility classes that are supposed to win by definition. Most frameworks offer an important modifier for exactly this, though a `utilities` cascade layer declared last achieves the same thing without the escalation.",
        "User stylesheets and accessibility overrides, where an important declaration outranks anything the site author wrote. This is the use the feature was designed for.",
        "Temporary debugging, to confirm you are fighting the cascade rather than a selector that does not match. Delete it once you know."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Widget sets style=\"display: none\" from its own script */\n.third-party-widget { display: block !important; }\n\n/* Beaten only by an inline important declaration, which sits one\n   step higher: style=\"display: none !important\" would win. */"
    },
    {
      "t": "p",
      "x": "Before you commit it, try the cheaper moves. Put the override later in the same layer. Put it in a later layer. Drop an ID from the losing selector instead of adding weight to the winning one. Wrap library defaults in `:where()` so nothing has to be overridden at all. Each of those leaves the ceiling intact for whoever touches the file next."
    },
    {
      "t": "h2",
      "x": "A specificity budget that holds up"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Declare your layer order in one place",
          "x": "A single `@layer` statement at the top of the entry stylesheet documents the priority of reset, vendor, components and utilities. Reviewers can then check priority in one line instead of inferring it from import order across twenty files.",
          "code": "@layer reset, vendor, base, components, utilities;"
        },
        {
          "title": "Keep authored selectors at one or two classes",
          "x": "If a selector needs a third class or an ID to win, that is usually a sign the losing rule is in the wrong layer. Fix the layer, not the selector."
        },
        {
          "title": "Never select on an ID for styling",
          "x": "IDs are useful as fragment targets and label references. As style hooks they create a step in the cascade that only an ID or `!important` can clear, and they cannot repeat on a page."
        },
        {
          "title": "Wrap defaults in :where()",
          "x": "Anything shipped as a default, including resets and component base styles, costs you nothing to make overridable. `:where(.card) > :where(h2)` matches identically and weighs (0,0,1)."
        },
        {
          "title": "Decide once about !important in resets",
          "x": "Because layer order inverts for important declarations, an `!important` early in your layer stack is effectively permanent. Treat it as an API decision, not a quick fix."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout module fits the shape of the problem, and the sizing traps in each.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The other \"my change did not apply\" bug: stale closures and batched state.",
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
          "a": "Three common reasons. The declaration may be invalid, in which case importance changes nothing: check for a missing unit or a typo in the value. Another important declaration may outrank yours, either from an inline style attribute, from an earlier cascade layer (important declarations invert layer order), or from a user stylesheet or browser extension. Or the property may not apply to that element at all, which no keyword can fix. Confirm with getComputedStyle before adding anything else."
        },
        {
          "q": "Does an ID always beat a class in CSS?",
          "a": "Within the same origin, layer and context, yes. Specificity compares the ID count first, so a single ID selector beats any number of classes. But specificity is step five of the cascade. A class in a later cascade layer, an inline style, an important declaration or a running transition all beat an ID selector without ever reaching the specificity comparison."
        },
        {
          "q": "How do I override an !important from a library?",
          "a": "Best option: import the library into a cascade layer and put your own CSS in a later layer, then your normal declarations beat its normal ones. That does not help against the library's important declarations, since layer order inverts for those. For an important declaration you must write your own important declaration with greater specificity, or place it later at equal specificity. If the library sets styles inline from JavaScript, a stylesheet !important beats a normal inline declaration but loses to an inline important one."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. They differ only in specificity: :where() always contributes zero, while :is() contributes the weight of its most specific argument. Use :where() for defaults you want others to override easily, and :is() when you want the selector to carry weight. :not() and :has() follow the :is() rule."
        },
        {
          "q": "Do cascade layers replace !important?",
          "a": "For most in-house use, yes. Layers let you decide priority by name instead of by selector weight, so a one-class utility can beat a three-class component rule. They do not replace the cases where !important is genuinely the point, such as a user stylesheet or beating an inline style set by third-party script."
        },
        {
          "q": "Why does my Tailwind class not override my component CSS?",
          "a": "A single utility class is (0,1,0), so a component rule like .card .title at (0,2,0) wins on specificity, and a rule later in the output wins on ties. How you fix it depends on your major version: Tailwind v4 emits native @layer blocks, while v3 relied on its own PostCSS handling and plain source order. Both offer an important modifier, and its syntax changed between those versions, so check the docs for the version your build actually uses. Lowering the component selector's specificity is usually the better fix."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-22",
  "updated": "2026-10-22",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
