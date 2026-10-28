module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Your CSS rule is not applying. Here is the order to check.",
  "eyebrow": "Guides",
  "description": "Specificity is only one step in the cascade. The real order, how cascade layers change it, and the silent failures that imitate a specificity bug.",
  "standfirst": "A walk through the cascade in the order a browser applies it, which is also the order worth debugging in: match, parse, origin, layer, specificity, source order.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "Specificity, cascade layers, !important and the parse failures that look identical to a losing rule.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Prove the rule matches before counting anything. `document.querySelectorAll('.card .title').length` returning `0` ends the investigation.",
        "Specificity is three numbers, IDs then classes then types, compared left to right. One ID beats a hundred classes and there is no carrying.",
        "Several things outrank specificity entirely: origin, importance, cascade layers, the `style` attribute. A weak selector in a later layer wins without a contest.",
        "For `!important`, layer order reverses. The earliest layer is strongest, and unlayered `!important` is the weakest of all.",
        "A declaration *missing* from the DevTools Styles pane never parsed. A declaration *struck through* lost a cascade contest. Only the second one is a specificity question.",
        "Fix conflicts by lowering the winner, usually with `:where()` or a layer, rather than escalating the loser."
      ]
    },
    {
      "t": "p",
      "x": "Specificity takes most of the blame for this and deserves about a third of it. Before a browser compares two selectors it has already settled origin, importance and cascade layer, and before any of that it has to decide whether the rule matches your element and whether the declaration survived parsing. The ordinary bugs live in those earlier steps. Counting classes first is why a five-minute problem becomes an afternoon."
    },
    {
      "t": "h2",
      "x": "Prove the rule matches before you count anything"
    },
    {
      "t": "p",
      "x": "Ask the console. If the selector matches nothing, the cascade is irrelevant and you have saved yourself twenty minutes of arithmetic. The usual cause is that the DOM is not what the stylesheet assumes: a wrapper element appeared between the two parts of a descendant chain, a component only adds `className` on some code path, or the markup carries `data-state=\"open\"` while the CSS looks for `.is-open`."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does the selector match anything at all?\ndocument.querySelectorAll('#sidebar .link').length;   // 0 means the selector is the bug\n\n// Does this particular element match?\nconst el = document.querySelector('.card .title');\nel.matches('.card .title');      // true?\nel.closest('[data-theme]');      // which ancestor state is actually set?\n\n// And what ended up winning?\ngetComputedStyle(el).color;"
    },
    {
      "t": "p",
      "x": "The Styles pane separates two failure modes, and that distinction is the single most useful signal in CSS debugging. A declaration that is present but struck through lost a contest, so go find the winner. A declaration that is absent from the pane was never parsed: syntax error, unsupported property, or a stylesheet the page never loaded."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The file you edited is not always the file the page loaded",
      "x": "In a bundled app, a class removed by a content-scanning build step, a CSS Module hash that no longer matches the markup, or a dev server handing back a cached chunk all produce a selector that exists in your editor and nowhere in the browser. Search the loaded CSS in the Sources panel for the class name before you start arguing with the cascade."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Three buckets: IDs, then classes and everything that counts as a class, then element types and pseudo-elements. Write it `1-2-0`. Comparison runs left to right and stops at the first difference, so a single ID outranks any number of classes, and the type count only breaks ties between selectors that already tie on IDs and classes. Nothing carries. Ten classes never become an ID."
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
          "`li`",
          "0-0-1",
          "One type selector."
        ],
        [
          "`.nav li`",
          "0-1-1",
          "One class, one type."
        ],
        [
          "`#main`",
          "1-0-0",
          "Outranks every class-only selector."
        ],
        [
          "`[data-state=\"open\"]`",
          "0-1-0",
          "Attribute selectors count in the class bucket."
        ],
        [
          "`:hover`",
          "0-1-0",
          "So do pseudo-classes."
        ],
        [
          "`::before`",
          "0-0-1",
          "Pseudo-elements count as a type."
        ],
        [
          "`.card + .card`",
          "0-2-0",
          "Combinators add nothing; both classes count."
        ],
        [
          "`* > .card`",
          "0-1-0",
          "The universal selector adds nothing."
        ],
        [
          "`:not(.a, #b)`",
          "1-0-0",
          "Takes the specificity of its heaviest argument."
        ],
        [
          "`:is(.a, p)`",
          "0-1-0",
          "Same rule as `:not()`."
        ],
        [
          "`:where(#a, .b)`",
          "0-0-0",
          "Always zero, whatever is inside."
        ],
        [
          "`style=\"color: red\"`",
          "not applicable",
          "Not part of specificity. Settled a tier earlier."
        ]
      ],
      "caption": "Specificity as ID-class-type triples. Compared left to right, first difference wins."
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes are the lever modern CSS gives you. `:is()` and `:not()` inherit the specificity of their most specific argument, which can bite: `:not(#x)` matches nearly everything and weighs as much as an ID. `:where()` is always zero. That makes it the standard way to publish a default that consumers can override without an escalation war."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* theme.css */\n#sidebar a { color: rebeccapurple; }               /* 1-0-1 */\n\n/* components.css, loaded afterwards */\n.sidebar .link.link-muted:hover { color: gray; }   /* 0-4-0 */\n\n/* rebeccapurple wins. Source order never gets a vote,\n   because the ID settles the comparison in the first bucket. */"
    },
    {
      "t": "p",
      "x": "Four classes and a pseudo-class lose to one ID. This is why ID selectors age badly in a shared stylesheet: every later override needs an ID of its own or an `!important`, and the whole file ratchets upward until nobody can predict it."
    },
    {
      "t": "h2",
      "x": "The cascade settles several questions before specificity"
    },
    {
      "t": "p",
      "x": "Simplified to the tiers you will actually meet in an application, highest authority first within each step:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author normal beats user normal beats user-agent normal. Author `!important` beats all normal declarations. User `!important` beats author `!important`, which is how a reader's accessibility stylesheet keeps the upper hand. User-agent `!important` beats that. Running transitions sit above the lot, so an element mid-transition can ignore a rule you have proven is winning.",
        "**Cascade layers**, inside one origin. The rules here are not symmetrical, so they get their own section.",
        "**The `style` attribute.** Not part of the specificity calculation. An inline declaration outranks every selector-based author rule of the same importance.",
        "**Scope proximity.** With `@scope`, the rule whose scope root sits nearer the element wins before specificity is considered.",
        "**Specificity.** The arithmetic above.",
        "**Source order.** Last declaration in the final order wins. `<link>` order and `@import` order decide that, not filenames and not the order you wrote them in your editor."
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "On support dates",
      "x": "Cascade layers landed across Chrome, Firefox and Safari during the first half of 2022, so they are safe in most projects now. `@scope` is newer and arrived in the engines at different times. This page was written in October 2026; check caniuse.com for the current position rather than trusting any support claim in an article, including this one."
    },
    {
      "t": "h2",
      "x": "Cascade layers invert habits you already have"
    },
    {
      "t": "p",
      "x": "Layers let you declare priority once, up front, instead of negotiating it selector by selector. The order of the `@layer` statement is what counts. Where the blocks physically appear later in the file does not matter."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, base, components, utilities;\n\n@layer components {\n  #promo .button { background: navy; }    /* 1-1-0 */\n}\n\n@layer utilities {\n  .bg-white { background: white; }        /* 0-1-0 */\n}\n\n/* white wins: utilities is the later layer, so the\n   specificity numbers are never compared at all. */\n\n.bg-white { background: white; }\n/* Unlayered normal declarations beat every layer. */"
    },
    {
      "t": "p",
      "x": "Two consequences catch people out. Unlayered normal declarations are the strongest normal declarations in the author origin, stronger than anything in any layer, so one stray rule outside your layer structure quietly beats your utilities. And for `!important`, the entire layer order flips."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .alert { color: red !important; }\n}\n\n@layer overrides {\n  .alert { color: blue !important; }\n}\n\n/* red wins. For important declarations the layer order is\n   reversed, so the earliest layer is the strongest, and\n   unlayered important styles are the weakest of all. */"
    },
    {
      "t": "p",
      "x": "The reversal is deliberate. It stops an important declaration in a foundational layer from being undone by an important declaration in a layer that was only ever meant to sit on top for normal rules. It also hands you a clean way to beat a vendor stylesheet, which the FAQ gets to."
    },
    {
      "t": "h2",
      "x": "!important, and three defensible uses"
    },
    {
      "t": "p",
      "x": "It is not forbidden. It is expensive, because it moves the argument to a tier where you have fewer tools and worse diagnostics. Cases where it earns its keep:"
    },
    {
      "t": "ul",
      "items": [
        "A utility whose entire contract is that it wins, such as `.hidden { display: none !important; }`. Try a late layer first; reach for `!important` when unlayered rules in the app keep beating it.",
        "Overriding inline styles written by a script you do not control. From CSS, this is the only way to beat a `style` attribute.",
        "A user stylesheet or browser extension, where overriding the author is the whole point and the cascade is built to let you."
      ]
    },
    {
      "t": "p",
      "x": "What it should not be is the patch for a rule that lost on source order, or for a selector that never matched anything. Both of those come back as a stylesheet nobody can reason about, usually six months later and usually not for you."
    },
    {
      "t": "h2",
      "x": "Failures that look like specificity and are not"
    },
    {
      "t": "p",
      "x": "Each of these shows the same symptom, one property that refuses to change, with no cascade conflict anywhere to find."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  color: #12345;                   /* five hex digits: invalid, this line is dropped */\n  width: 100;                      /* unitless length: invalid, dropped */\n  background-image: url('bg.svg');\n  background: white;               /* shorthand resets background-image to none */\n}\n\n/* Form controls do not inherit the page font unless asked. */\ninput, select, textarea, button { font: inherit; }"
    },
    {
      "t": "ul",
      "items": [
        "**An invalid value drops only its own declaration.** The rest of the block still applies, so you get one stubborn property surrounded by working ones. Missing unit, bad hex, misspelled keyword: all discarded in silence.",
        "**A shorthand resets its longhands.** `background: white` sets `background-image` to `none`. `font: 16px/1.4 system-ui` wipes `font-weight`. If the shorthand wins, everything it covers is reset, including properties set in some other rule entirely.",
        "**Not every property inherits.** `border` on a parent does nothing for its children. Form controls are the classic trap, which is what the `font: inherit` line above is for.",
        "**Shadow DOM boundaries.** A page stylesheet does not reach inside a shadow root. Inherited properties and custom properties cross the boundary; selectors do not, short of `::part()`.",
        "**A condition that never matched.** An `@media`, `@supports` or `@container` block that does not apply is an absence, not a conflict. Container queries need an ancestor with `container-type` set, and a missing `container-type` is a frequent reason a whole block looks ignored.",
        "**A custom property that is invalid at computed-value time.** When `var(--x)` resolves to something the property cannot accept, the property falls back to inherited or initial, not to the declaration above it. The result can look like nothing applied at all."
      ]
    },
    {
      "t": "h2",
      "x": "Fix by lowering the winner"
    },
    {
      "t": "p",
      "x": "The instinct is to make the losing rule heavier. It works exactly once, and it makes the next conflict worse. Better moves, in order: put the competing rules in explicit layers so priority is declared instead of emergent; wrap library defaults in `:where()` so they carry no weight; swap ID selectors for classes, or keep the ID for matching and strip its weight; add specificity only when none of that applies."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* A default published with no weight at all */\n:where(.prose) :where(h2) { margin-block: 1.5rem 0.5rem; }   /* 0-0-0 */\n\n/* Now even a plain two-part selector overrides it */\n.prose h2 { margin-block: 3rem 1rem; }                       /* 0-1-1 */\n\n/* Match inside an ID without paying for the ID */\n:where(#promo) .button { background: navy; }                 /* 0-1-0 */"
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Does the selector match?",
          "x": "One console line. An empty NodeList means the problem is the selector or the DOM, and no amount of cascade reading will help.",
          "code": "document.querySelectorAll('.card .title').length"
        },
        {
          "title": "Does the declaration exist in the browser?",
          "x": "Struck through in the Styles pane means it lost a contest. Absent means it never parsed, or the stylesheet never loaded. Only the first is a cascade problem, and the two have nothing in common except the symptom."
        },
        {
          "title": "Find the winner, do not guess it",
          "x": "The Computed tab in both Chrome and Firefox shows the winning declaration and links to its source, which beats reading the Styles list from the top. Recent Chrome versions also label rules with their cascade layer."
        },
        {
          "title": "Climb the tiers in order",
          "x": "Transitions, then important declarations, then inline style, then layer order, then scope proximity, then specificity, then source order. Stop at the first tier where the two rules differ. If they differ at the layer tier, the specificity numbers are decoration."
        },
        {
          "title": "Change the winner",
          "x": "Lower the rule that won rather than inflating the rule that lost. If the winner belongs to a dependency you cannot edit, import it into a layer you control and the problem becomes structural instead of a fight.",
          "code": "@layer vendor, app;\n@import url('vendor.css') layer(vendor);"
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Picking the layout model before you start overriding it.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a pair of colors against WCAG AA and AAA once your rule finally applies.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same class of bug one layer up: the value looks right and the render disagrees.",
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
          "a": "Take it in order. Confirm the selector matches with `document.querySelectorAll()`, confirm the declaration appears in the Styles pane at all, then find what strikes it out. In practice the three most common causes are a rule that never matched the DOM, a declaration dropped for an invalid value, and a competing rule in a later cascade layer or in an unlayered block. Specificity is a frequent suspect and a less frequent culprit."
        },
        {
          "q": "Does !important always win?",
          "a": "No. It beats every normal declaration in the same origin, including an inline `style` attribute, but it loses to a stronger important declaration: a user stylesheet beats an author stylesheet, and user-agent important beats both. Inside the author origin, an important declaration in an *earlier* cascade layer beats one in a later layer, and unlayered important is the weakest important of all. Running CSS transitions outrank everything."
        },
        {
          "q": "How many classes do I need to beat an ID?",
          "a": "No number works. The three buckets are compared left to right and the comparison stops at the first difference, so the class and type counts are never even read when the ID counts differ. If you need to override an ID selector, change the ID rule, add an ID to your own selector, put your rule in a later cascade layer, or use `!important`. Those are the only routes."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations layer order is checked first and specificity only breaks ties within the same layer. A `0-1-0` rule in a later layer beats a `1-1-0` rule in an earlier one. Keep in mind that unlayered normal declarations sit above every layer, so a rule written outside your layer structure will beat your utilities layer no matter how you ordered it."
        },
        {
          "q": "Is an inline style stronger than a class or an ID?",
          "a": "Stronger than both, for normal declarations. The `style` attribute is not scored for specificity; it is resolved at an earlier tier that outranks all selector-based author rules of the same importance. An `!important` declaration in a stylesheet still beats a normal inline one, which is the usual way to override a `style` attribute written by a third-party script."
        },
        {
          "q": "How do I override a third-party library's !important rule?",
          "a": "If the library's rule is unlayered and yours is too, you need your own `!important` plus higher specificity or later source order. The cleaner fix uses the layer reversal: an important declaration inside any layer beats an unlayered important declaration, so wrapping your override in `@layer app { ... }` with `!important` wins. Best of all, import the library into a layer of its own with `@import url('lib.css') layer(vendor);` and you control the order of everything from then on."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-28",
  "updated": "2026-10-28",
  "author": "jackson",
  "related": []
};
