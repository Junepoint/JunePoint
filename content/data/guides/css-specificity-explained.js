module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Troubleshooting",
  "description": "Your CSS rule is not applying. Work through selector matching, specificity, cascade layers and !important in the order the browser actually uses.",
  "standfirst": "Specificity is only one of six tiebreakers, and it is rarely the one that beat you. Here is the order a browser really resolves declarations in, and how to read the Styles pane to find out where your rule lost.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "!important css",
    "css override not working"
  ],
  "cardDesc": "Specificity, layers and !important in the order the browser applies them, plus bugs that only look like specificity.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before touching specificity, prove the selector matches. In DevTools, a declaration that lost the cascade appears struck through. A declaration that never appears at all did not match, or was dropped as invalid.",
        "Specificity is three numbers compared left to right: IDs, then classes/attributes/pseudo-classes, then element types/pseudo-elements. Twenty classes `(0,20,0)` still lose to one ID `(1,0,0)`.",
        "Cascade layers are checked *before* specificity. A selector like `#sidebar .nav a.link` inside an early layer loses to a bare `.link` in a later layer.",
        "Normal declarations outside any layer beat every layered declaration. That single rule explains most surprises in Tailwind, CSS Modules and vendor stylesheets.",
        "`!important` inverts layer order. An important declaration outside any layer is the *weakest* author important declaration, not the strongest.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` contribute as much as their most specific argument.",
        "A media query adds nothing to specificity. Neither do combinators, `*`, or the number of selectors in a comma-separated list."
      ]
    },
    {
      "t": "h2",
      "x": "Prove the selector matches before you blame the cascade"
    },
    {
      "t": "p",
      "x": "Most reports of \"specificity problems\" are not specificity problems. The rule never applied to the element in the first place, or the browser threw the declaration away while parsing it. Both cases look identical from the outside, and both are distinguishable in about fifteen seconds."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Look for the rule in the Styles pane",
          "x": "Select the element and scan the rule list. If your selector is not listed, it did not match this element. Check the class name for a typo, check that the element is where you think it is in the DOM, and check that a framework has not renamed the class (CSS Modules hashes to something like `Button_link__a1b2c`).",
          "code": "document.querySelectorAll('.nav a.link').length\n// 0 means the selector matches nothing. Stop debugging specificity."
        },
        {
          "title": "Check whether the declaration is struck through",
          "x": "A line through the property name means another declaration won. Hover it and the tooltip names the winner in most browsers. This is the only reliable signal that you have an actual cascade conflict rather than a matching problem."
        },
        {
          "title": "Check whether the value was parsed",
          "x": "An invalid value is discarded at parse time, so the declaration shows with a warning icon and is not struck through. `width: 100px;` inside a declaration that also says `wdith: 100px;` will sit there silently doing nothing. Common culprits are a missing unit, a stray semicolon inside a `calc()`, and a custom property that resolves to an empty string."
        },
        {
          "title": "Read the Computed tab last",
          "x": "The Computed tab shows the value that actually applied and lets you expand each property to see every declaration that tried. If the computed value matches your rule but the page looks wrong, the problem is layout or paint, not the cascade."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Inherited values have no rule to strike through",
      "x": "If a property is inherited, it will not appear as a matched rule on the child. Colors, fonts and `visibility` inherit. `background`, `border`, `padding` and `display` do not. A missing `border` on a child is never the parent's `border` failing to reach it."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple. Call it `(A, B, C)`. `A` counts ID selectors. `B` counts class selectors, attribute selectors and pseudo-classes. `C` counts element type selectors and pseudo-elements. The browser compares `A` first; only if `A` ties does `B` matter, and only if `B` ties does `C` matter. There is no carrying between the columns, which is why the old \"specificity is base 10\" shorthand breaks on real stylesheets."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,1) */\na                  { color: teal; }\n\n/* (0,1,0) */\n.link              { color: blue; }\n\n/* (0,1,1) */\na.link             { color: green; }\n\n/* (0,3,0) wins over (0,1,1), loses to anything with an ID */\n.page .nav .link   { color: rebeccapurple; }\n\n/* (1,0,0) beats every rule above, whatever its order */\n#masthead          { color: red; }"
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Specificity",
        "Note"
      ],
      "rows": [
        [
          "`*`",
          "(0,0,0)",
          "Universal selector contributes nothing"
        ],
        [
          "`ul > li + li`",
          "(0,0,3)",
          "Combinators themselves add nothing"
        ],
        [
          "`a::before`",
          "(0,0,2)",
          "Pseudo-elements count as element types"
        ],
        [
          "`[href^=\"https\"]`",
          "(0,1,0)",
          "Attribute selectors count as classes"
        ],
        [
          "`[id=\"nav\"]`",
          "(0,1,0)",
          "Matching the id *attribute* is not an ID selector"
        ],
        [
          "`li:nth-child(2)`",
          "(0,1,1)",
          "Most pseudo-classes count as classes"
        ],
        [
          "`#nav .item a`",
          "(1,1,1)",
          "One of each"
        ],
        [
          "`:where(#nav) a`",
          "(0,0,1)",
          "`:where()` zeroes out its argument"
        ],
        [
          "`style=\"...\"`",
          "n/a",
          "Not a selector; outranks all author selectors in a separate cascade step"
        ]
      ],
      "caption": "A=IDs, B=classes/attributes/pseudo-classes, C=types/pseudo-elements."
    },
    {
      "t": "p",
      "x": "Two things people expect to raise specificity and do not: wrapping a rule in `@media` or `@supports`, and adding more selectors to a comma-separated list. Each selector in a list is evaluated on its own, so `h1, #title { }` has specificity `(0,0,1)` when it matches an `h1` and `(1,0,0)` when it matches `#title`. The at-rules are just filters on whether the block applies."
    },
    {
      "t": "h3",
      "x": "The functional pseudo-classes change the arithmetic"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` take the specificity of their most specific argument. That is a sharp edge. Putting an ID into an `:is()` list silently promotes the whole selector into the ID column, and nothing with classes will ever beat it again."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (1,1,0): the :is() contributes #app */\n:is(#app, .page) .title { color: red; }\n\n/* (0,1,0): :where() contributes nothing, so .title is all that counts */\n:where(#app, .page) .title { color: red; }\n\n/* (0,1,1): p plus one class from the :not() argument */\np:not(.excluded) { margin-block: 0; }\n\n/* (0,2,0): .card plus the most specific argument of :has() */\n.card:has(.badge) { padding-block-start: 2rem; }"
    },
    {
      "t": "p",
      "x": "The practical consequence is that `:where()` is the right tool for anything a consumer is expected to override: resets, normalizers, default theming, the base styles in a component library. Write `:where(.btn) { padding: 0.5rem 1rem; }` and a single `.btn-lg` class in the consumer's stylesheet will win on source order without any escalation."
    },
    {
      "t": "h2",
      "x": "The full cascade, in the order it is applied"
    },
    {
      "t": "p",
      "x": "Specificity is step five of six. Everything above it is decided first, which is why a one-class selector can beat a four-class selector and leave you staring at DevTools. Highest precedence first:"
    },
    {
      "t": "ol",
      "items": [
        "**Declarations from a transition in flight.** While a transition is running, the interpolated value sits above everything else, including `!important`. This is why a hover transition can appear to ignore a rule you just added.",
        "**`!important` in the user agent stylesheet.** The browser's own defaults. Rare, but it exists.",
        "**`!important` in a user stylesheet.** Browser extensions, user styles, and OS-level accessibility overrides live here. They are allowed to beat your important declarations by design.",
        "**`!important` in author CSS.** Your stylesheets, and the vendor stylesheets you ship.",
        "**Declarations from a running animation.** A `@keyframes` rule in effect outranks all normal author CSS, which is the usual reason a static rule cannot hold a property an animation also touches.",
        "**Normal author CSS.** Where almost all of your work happens.",
        "**Normal user CSS**, then **normal user agent CSS.**"
      ]
    },
    {
      "t": "p",
      "x": "Within one of those buckets, say normal author CSS, the browser then compares, in order: the encapsulation context (shadow tree versus outer document), whether the declaration came from a `style` attribute, cascade layer, specificity, and finally order of appearance. Source order is the last tiebreaker, not the first. Two rules only come down to \"whichever is lower in the file\" when their layer and specificity are identical."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Order of appearance depends on your bundler",
      "x": "In a build with CSS-in-JS or imported stylesheets, \"lower in the file\" means lower in the concatenated output, and the injection order is decided by the module graph. If a rule wins in development and loses in production, compare the emitted CSS rather than your source files."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "`@layer` moved the whole conversation. Layer comparison happens before specificity is even considered, so a layer's position decides the winner regardless of how the selectors inside it are written. Declare the order once, at the top, and the rest follows."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, base, components, utilities;\n\n@layer components {\n  /* (1,2,1) and it still loses */\n  #sidebar .nav a.link { color: rebeccapurple; }\n}\n\n@layer utilities {\n  /* (0,1,0) and it wins, because utilities is declared later */\n  .text-blue { color: blue; }\n}"
    },
    {
      "t": "p",
      "x": "This is the one genuinely good answer to selector arms races. You can also pull third-party CSS into a layer you control at import time, which caps its influence without editing a single vendor selector:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* everything in the vendor sheet now sits in the 'vendor' layer */\n@import url(\"vendor.css\") layer(vendor);\n\n/* reset one element back to what the previous layer said */\n.card .btn {\n  all: revert-layer;\n}"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Unlayered normal declarations beat every layer",
      "x": "Anything not inside an `@layer` is treated as the last layer for normal declarations. A plain `.card { padding: 0 }` in your own stylesheet will override a layered `.card.card--roomy { padding: 2rem }` from a design system. This is the single most common cascade-layers surprise, and the fix is to put your own CSS in a layer too so that the ordering is explicit."
    },
    {
      "t": "p",
      "x": "Tailwind CSS v4 emits native cascade layers (`theme`, `base`, `components`, `utilities`), so the same rule applies to utility classes: unlayered CSS of your own can quietly win over a utility. Versions and layer names change between major releases, so check the generated output for the version you have installed rather than trusting a remembered layer list. That description is accurate for v4 as of October 2026."
    },
    {
      "t": "h2",
      "x": "Important declarations invert layer order"
    },
    {
      "t": "p",
      "x": "For `!important`, the layer comparison runs backwards. The earliest declared layer wins, and declarations outside any layer have the *lowest* priority rather than the highest. Read that twice, because it is the opposite of the normal case and it is easy to debug for an hour without knowing it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .btn { color: red !important; }      /* wins */\n}\n\n@layer overrides {\n  .btn { color: green !important; }    /* loses to base */\n}\n\n.btn { color: blue !important; }       /* unlayered important: weakest of the three */"
    },
    {
      "t": "p",
      "x": "The colour here is red. The logic is consistent once you see the intent: layers exist so that the author of a layer can state how much power it has, and an important declaration deep in a foundational layer is treated as a deliberate, non-negotiable decision. It also means that sprinkling `!important` into your own unlayered stylesheet is the least effective place you could possibly put it, which is a good argument for not reaching for it at all."
    },
    {
      "t": "h2",
      "x": "What !important actually does"
    },
    {
      "t": "p",
      "x": "`!important` moves one declaration into a higher bucket in the list above. It does not raise specificity, and it is not a global trump card. Within the author important bucket, the usual comparison still runs: context, style attribute, layer (reversed), specificity, source order. So two important declarations fight each other on exactly the same terms as two normal ones."
    },
    {
      "t": "ul",
      "items": [
        "On a shorthand, it applies to every longhand that shorthand sets. `font: ... !important` makes `font-weight`, `font-size`, `line-height` and the rest important as well, which is far more reach than most people intend.",
        "It cannot be overridden by a normal declaration in a `style` attribute. Setting `el.style.color = 'red'` from JavaScript will not beat a stylesheet's `color: ... !important`; the DOM API for the important flag is `el.style.setProperty('color', 'red', 'important')`, and even that is a patch rather than a fix. Adding a class in a later layer is the maintainable route.",
        "It does not win against a transition in flight, and it is not needed to win against an animation, since author important already outranks `@keyframes` declarations.",
        "It is legitimate in a few places: utility classes whose entire purpose is to override (`.sr-only`, `.hidden`), print stylesheets, and patching a third-party widget you cannot rebuild. Outside those, treat each one as debt."
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "An !important you cannot find",
      "x": "If a value refuses to budge and nothing in your CSS explains it, check for a `style` attribute written by JavaScript, an inline `<style>` injected by a widget, and browser extensions. User stylesheets from extensions sit above author important in the cascade, so a page can be unstyleable in one profile and fine in another."
    },
    {
      "t": "h2",
      "x": "Winning without raising specificity"
    },
    {
      "t": "p",
      "x": "Ranked roughly by how well each one ages:"
    },
    {
      "t": "ol",
      "items": [
        "**Put everything in a declared layer order.** One `@layer` statement at the top of your entry stylesheet, with vendor CSS imported into its own layer, removes most conflicts permanently.",
        "**Write defaults with `:where()`** so consumers can override them with a single class.",
        "**Keep IDs out of selectors.** One ID in a selector is unreachable by any number of classes, which forces the next person into `!important`. Style by class, use the ID for the anchor link and for JavaScript.",
        "**Repeat a class to raise specificity deliberately.** `.btn.btn { }` is `(0,2,0)` and matches exactly the same elements as `.btn`. It is an ugly but honest way to add one point without inventing a wrapper, and it is easier to unwind later than `!important`.",
        "**Reach for `all: revert-layer`** when you want one component to fall back to what the previous layer said instead of restating a dozen properties."
      ]
    },
    {
      "t": "p",
      "x": "There is one more cascade step worth knowing about if you work on component libraries. `@scope` adds a proximity comparison that sits between layers and specificity: when two scoped rules both match, the one whose scope root is nearer the element wins, regardless of specificity. It landed in Chrome in late 2023 and in Safari and Firefox during 2024, so support is broad but not universal in older installed browsers. Check current support figures before relying on it, and remember that unscoped rules are not affected by proximity at all."
    },
    {
      "t": "h2",
      "x": "When the cascade is not the problem"
    },
    {
      "t": "p",
      "x": "A rule can win the cascade and still appear to do nothing. These are the usual reasons, and none of them will show a strikethrough in the Styles pane:"
    },
    {
      "t": "ul",
      "items": [
        "**The property does not apply to that element.** `width` and `height` are ignored on a non-replaced inline element. `vertical-align` does nothing on a block. `gap` needs a flex, grid or multi-column container.",
        "**A later shorthand reset your longhand.** `background-color: red;` followed by `background: url(x.png);` leaves the colour at `transparent`, because the shorthand resets every component it owns.",
        "**The user agent stylesheet is more specific about form controls than you expect.** Buttons, selects and inputs often need `font: inherit` and `appearance: none` before your typography reaches them.",
        "**The custom property is invalid or undefined.** A `var()` that resolves to nothing makes the declaration invalid at computed-value time, which is a different failure mode from a parse error and is easy to miss. Give fallbacks: `var(--brand, #333)`.",
        "**The media or container query does not match.** Check the condition in DevTools rather than reasoning about it, especially with `prefers-color-scheme` and container queries on an element that is not actually a container.",
        "**A parent is clipping or collapsing it.** `overflow: hidden`, a zero height, a `transform` creating a new containing block, or `position: fixed` resolving against an ancestor you forgot about.",
        "**The stale build.** A cached stylesheet or a dev server that has not recompiled is responsible for a non-trivial share of all \"my CSS is not applying\" time. Hard reload, then check the response in the Network tab before anything else."
      ]
    },
    {
      "t": "p",
      "x": "The useful habit is to answer one question at a time, in the browser rather than in your head: does it match, did it win, did it compute, is it visible. Each has a different signal in DevTools, and the answer at any step tells you which tool to pick up next. Specificity, for all the attention it gets, is responsible for a surprisingly small slice of the bugs."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check in this order. If the rule is absent from the Styles pane, the selector does not match that element; verify it with document.querySelectorAll in the console. If it is present but struck through, you lost the cascade to another declaration. If it is present with a warning icon, the value failed to parse. If it is present and unmarked but nothing changed, the property probably does not apply to that element, or a later shorthand reset it."
        },
        {
          "q": "How many classes do you need to beat an ID in CSS?",
          "a": "No number of classes can beat an ID. Specificity columns are compared separately, so (0,99,0) still loses to (1,0,0). To win against an ID selector you need an ID of your own, a higher cascade layer, a style attribute, or !important. This is the main practical reason to avoid IDs in stylesheets."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes. Layer order is compared before specificity, so a low-specificity rule in a later layer beats a high-specificity rule in an earlier one. For normal declarations, anything outside a layer is treated as the final layer and beats all layered rules. For important declarations the order reverses, and unlayered declarations become the weakest."
        },
        {
          "q": "Does !important always win?",
          "a": "No. It moves the declaration into a higher cascade bucket, but it still competes with other important declarations on layer order, specificity and source order. An important user stylesheet, an important user agent rule and a transition in flight all outrank author important. And an important declaration outside any layer loses to one inside a layer."
        },
        {
          "q": "Is an inline style stronger than a class?",
          "a": "For normal declarations, yes. A style attribute is compared in its own cascade step, above layers and specificity, so it beats any selector in the same origin. It does not beat an !important declaration in a stylesheet, which is why el.style.color often appears to do nothing on a page that uses !important heavily."
        },
        {
          "q": "How do I override a third-party stylesheet without !important?",
          "a": "Import it into its own cascade layer with @import url(\"vendor.css\") layer(vendor), declare that layer before yours, and your rules win no matter what selectors the vendor used. If the vendor sheet ships with !important inside it, put your overriding important declarations in an earlier layer, since important layer order runs backwards."
        },
        {
          "q": "Does a media query increase specificity?",
          "a": "No. @media, @supports and @container are conditions on whether a block applies at all. The selectors inside them keep their normal specificity, so a rule inside a media query can lose to an identical rule outside it purely on source order."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout module fits which problem, and the sizing gotchas in each.",
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
          "desc": "The same debugging shape applied to state that appears one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-15",
  "updated": "2026-10-15",
  "author": "jackson",
  "related": [
    "/guides/javascript-async-await-explained/",
    "/guides/ssh-permission-denied-publickey/"
  ]
};
