module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important",
  "eyebrow": "Guides",
  "description": "Specificity, cascade layers and !important in the order the browser actually applies them, plus a debugging sequence for a rule that refuses to stick.",
  "standfirst": "Specificity is the fifth tiebreaker the browser reaches for, not the first. Work through the real order and most stubborn CSS bugs stop being mysterious.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Specificity maths, cascade layers, !important, and a debugging order for a rule the browser keeps ignoring.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is the fifth tiebreaker, not the first. Origin, importance, inline styles and cascade layers are all resolved before the browser counts a single selector.",
        "Specificity is three numbers, `(ID, class, type)`, compared left to right and never summed. Eleven classes still lose to one ID.",
        "Inside the author origin, a cascade layer outranks specificity. A plain `.button` rule in a later layer beats `#sidebar .button` in an earlier one.",
        "`!important` reverses layer order: the earliest layer wins, and unlayered important declarations lose to layered ones.",
        "Half the time the rule is not losing the cascade at all. It never matched, or its value was invalid, or a shorthand further down wiped it out."
      ]
    },
    {
      "t": "h2",
      "x": "Start by proving the rule matches"
    },
    {
      "t": "p",
      "x": "Before you count anything, inspect the element and look at the Styles pane. There are three distinct pictures and they point at three different bugs. If your declaration is shown with a line through it, the rule matched and lost the cascade, which is the case the rest of this article is about. If the rule is not listed at all, the selector never matched the element and specificity is irrelevant. If the declaration is struck through *and* carries a warning triangle, the browser parsed it and threw it away as invalid."
    },
    {
      "t": "p",
      "x": "That third case catches people constantly, because a single malformed value is discarded silently at parse time. The rest of the block still applies, so the rule looks alive and healthy in the sheet while one property quietly vanishes."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".banner {\n  /* fine */\n  background: rgb(0 0 0 / 40%);\n\n  /* dropped: calc needs whitespace around the minus sign,\n     otherwise -20px parses as a signed number, not an operator */\n  width: calc(100% -20px);\n\n  /* dropped: no unit on a non-zero length */\n  padding: 12;\n}"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Shorthands overwrite longhands",
      "x": "`padding: 1rem` sets all four padding longhands, including ones you set deliberately three lines earlier. Same for `background`, `font`, `border` and `grid-area`. If a longhand keeps reverting to something you never wrote, look for a shorthand below it in the same rule or in a later one."
    },
    {
      "t": "p",
      "x": "Other reasons a rule can be entirely absent from the pane: the stylesheet returned a 404, the build hashed a class name that your handwritten selector does not know about, a CSS module scoped it behind a generated suffix, the element lives inside a shadow root that your document styles cannot reach, or there is a typo in a selector that is still perfectly valid CSS. `.reciept-total` parses fine. It just never matches anything."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple. The first number counts ID selectors, the second counts classes, attribute selectors and pseudo-classes, the third counts element types and pseudo-elements. The browser compares the first numbers, and only if they tie does it look at the second, and so on. Nothing is added together, so there is no threshold at which classes overtake an ID."
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
          "`#nav a`",
          "1, 0, 1",
          "One ID, one type."
        ],
        [
          "`.nav .item a`",
          "0, 2, 1",
          "Longer, more specific-looking, still loses to the row above."
        ],
        [
          "`a.item:hover`",
          "0, 2, 1",
          "Pseudo-classes count in the class column."
        ],
        [
          "`a[href^=\"https\"]`",
          "0, 1, 1",
          "Attribute selectors count in the class column too."
        ],
        [
          ":is(#nav, .nav) a",
          "1, 0, 1",
          "`:is()` takes the most specific argument, so the ID sets the weight."
        ],
        [
          ":where(#nav) a",
          "0, 0, 1",
          "`:where()` always contributes zero, whatever is inside it."
        ],
        [
          "`:not(.a, #b) span`",
          "1, 0, 1",
          "`:not()` behaves like `:is()`; the negation itself is free."
        ],
        [
          "`li::marker`",
          "0, 0, 2",
          "Pseudo-elements count as types."
        ],
        [
          "`*`",
          "0, 0, 0",
          "The universal selector adds nothing."
        ],
        [
          "`style=\"...\"`",
          "not a selector",
          "Beats every author selector. See the ordering section below."
        ]
      ],
      "caption": "Specificity written as (ID, class, type), compared left to right and never summed."
    },
    {
      "t": "p",
      "x": "Native nesting follows the same logic. The `&` in a nested rule carries the specificity of the most specific selector in its parent list, exactly as `:is()` does. So nesting a modest `.btn` inside a block whose parent list is `#app, .app` gives that inner rule an ID's worth of weight that you never typed. Worth knowing before you convert a large sheet to nesting and watch overrides start failing."
    },
    {
      "t": "h2",
      "x": "The order the browser actually uses"
    },
    {
      "t": "p",
      "x": "Specificity only gets a vote once several more powerful things have tied. The cascade sorts declarations in this sequence:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author styles beat user styles beat browser defaults. Important declarations flip that order, so a user's `!important` outranks yours, which is how accessibility overrides survive.",
        "**Context.** Shadow DOM encapsulation, which is why a component's internal styles are unreachable from your document sheet unless the author exposed a part or a custom property.",
        "**Element-attached styles.** Anything in a `style` attribute, whether you wrote it or a JavaScript animation library did.",
        "**Cascade layers.** Later layers win, and unlayered styles win over every layer.",
        "**Specificity.** The triple above.",
        "**Order of appearance.** The last matching declaration wins the tie."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences are worth internalising. An inline style beats any selector you can write, no matter how many IDs you stack, but a stylesheet's `!important` beats a normal inline style, and an `!important` inside the style attribute beats that in turn. And inheritance is not part of this contest at all: an inherited value only applies when *nothing* matched the element directly. A bare `* { color: inherit }` will defeat the colour your `body` rule was passing down, despite specificity of `0, 0, 0`, because a match at zero specificity still outranks no match."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Transitions and animations sit outside the list",
      "x": "A running CSS transition beats everything, including `!important`. A running animation beats normal declarations but loses to `!important`. If a value snaps back the instant you stop hovering, or sticks after an animation with `animation-fill-mode: forwards`, you are fighting the animation system rather than the cascade."
    },
    {
      "t": "h2",
      "x": "Cascade layers reorder everything below them"
    },
    {
      "t": "p",
      "x": "`@layer` is the first real tool CSS has given us for saying \"this whole body of styles should be overridable\" without arguing about selector length. Declare the order once, at the top, and the order of the declarations stands regardless of what the selectors inside each layer look like."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Establish the order first. Names only, no blocks.\n   Earlier in this list means lower priority. */\n@layer reset, framework, app;\n\n@layer framework {\n  #sidebar .button { background: gray; }   /* 1,1,0 */\n}\n\n@layer app {\n  .button { background: teal; }            /* 0,1,0 */\n}\n\n/* teal wins. The layer decided it before specificity was consulted. */"
    },
    {
      "t": "p",
      "x": "Anything you leave unlayered sits above every layer. That is deliberate, and it makes adoption incremental: wrap the vendor CSS you do not control in a layer, leave your own styles where they are, and your styles win by default."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Pull a third-party sheet into a layer at import time */\n@import url(\"bootstrap.css\") layer(framework);\n\n/* Your own CSS stays unlayered and outranks all of it */\n.card__title { font-size: 1.125rem; }"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Unsupported browsers drop the whole block",
      "x": "An unrecognised at-rule is discarded along with its contents, so a browser without `@layer` support does not merely ignore the layering, it throws away every rule inside. `@layer` shipped in Chrome 99, Firefox 97 and Safari 15.4, all in the first quarter of 2022. Check your own analytics and caniuse.com before relying on it, because the failure mode is an unstyled page rather than a slightly wrong one."
    },
    {
      "t": "h2",
      "x": "!important, and the layer flip"
    },
    {
      "t": "p",
      "x": "`!important` moves a declaration into a different bucket in step one of the cascade. Within that bucket, all the later steps still run, and one of them runs backwards: layer order is reversed for important declarations. The earliest layer wins, and unlayered important declarations are the weakest of all."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .alert { color: red !important; }\n}\n\n@layer overrides {\n  .alert { color: blue !important; }\n}\n\n.alert { color: green !important; }  /* unlayered, loses to both */\n\n/* red wins: for important declarations, the first layer has the last word. */"
    },
    {
      "t": "p",
      "x": "This looks perverse for about a minute, then the logic lands. A reset or base layer is exactly where a team puts the handful of declarations that genuinely must not be overridden, and the reversal means putting something in your lowest-priority layer makes its important declarations strongest. The practical takeaway is blunt: if you are using layers, sprinkling `!important` through your application layer is now the weakest possible move, not the strongest."
    },
    {
      "t": "p",
      "x": "There are two places `!important` is defensible. One is overriding an inline style written by code you do not control, such as a charting library that sets `style=\"height: 400px\"` on its container. The other is a utility class whose entire contract is \"this always wins\", like `.visually-hidden`. Everything else is a note to the next developer saying the cascade was not understood here."
    },
    {
      "t": "h2",
      "x": "Lower the specificity instead of raising it"
    },
    {
      "t": "p",
      "x": "The usual fix for a rule that will not apply is to make the selector heavier. It works, and it makes the next override harder, and six months later the sheet is full of `#app .page .card .title` selectors that nobody dares touch. Push the other way."
    },
    {
      "t": "p",
      "x": "`:where()` is the cleanest tool for this. It takes a selector list and contributes zero specificity, which makes it ideal for defaults that should be trivially overridable."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Typographic defaults inside long-form content.\n   Specificity is 0,0,0, so any single class beats them. */\n:where(.prose) :where(h2, h3) {\n  margin-block-start: 1.5em;\n  text-wrap: balance;\n}\n\n/* A single class later in the sheet wins without ceremony */\n.prose-tight { margin-block-start: 0.5em; }"
    },
    {
      "t": "ul",
      "items": [
        "Style with classes. Keep IDs for fragment links, labels and JavaScript hooks, where their uniqueness is the point.",
        "Prefer one class per component element over descendant chains. `.card__title` beats `.card .title` for maintenance even though it is weaker on paper.",
        "Put resets, third-party CSS and utilities in explicit layers so priority is stated in one place rather than inferred from selector length.",
        "If an override needs to win, duplicate the class instead of adding an ID: `.btn.btn` is `0, 2, 0` and far easier to undo later than `#app .btn`."
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
          "title": "Confirm you are inspecting the right element",
          "x": "Framework output rarely matches the mental model. Check for a wrapper div the component library inserted, a pseudo-element painting over your background, or a shadow root marked in the elements tree."
        },
        {
          "title": "Decide between 'never matched' and 'lost the cascade'",
          "x": "Absent from the Styles pane means the selector does not match, so stop thinking about specificity. Struck through means it matched and something beat it. A warning icon means the value was invalid."
        },
        {
          "title": "Read the Computed tab, not the Styles tab",
          "x": "Computed shows the winning value and links to the file and line it came from. Expanding a property lists every contributing declaration in cascade order, winner first, which usually ends the investigation in seconds."
        },
        {
          "title": "Check which layer each rule is in",
          "x": "DevTools groups matched rules by `@layer`. If the winner sits in a later layer, no amount of extra specificity in an earlier one will help. Change the layer order or move the rule."
        },
        {
          "title": "Only now compare specificity, and test it cheaply",
          "x": "Paste a throwaway rule at the very end of the last stylesheet, unlayered, with an obvious value. If it applies, you had an ordering or specificity problem. If it does not, the property or value is the problem and the cascade was never involved.",
          "code": ".your-selector { outline: 3px solid hotpink !important; }"
        }
      ]
    },
    {
      "t": "p",
      "x": "That last step is worth keeping as a habit. It separates the two failure families in one edit, and the pink outline is impossible to miss or to forget to remove. Most of the time the answer arrives before you have counted a single selector, which is the point: specificity gets blamed for a great deal of work it did not do."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks correct?",
          "a": "Inspect the element and check whether the rule appears in the Styles pane at all. If it is missing, the selector does not match, so look for a build-time class rename, a shadow root, a 404 on the stylesheet, or a typo that is still valid CSS. If it appears struck through with a warning icon, the value was invalid and the browser discarded that declaration while keeping the rest of the rule."
        },
        {
          "q": "Do 10 classes beat 1 ID in CSS specificity?",
          "a": "No. Specificity is three numbers compared left to right, not a single total. `#a` is `1, 0, 0` and ten classes are `0, 10, 0`, and the ID column is checked first, so the ID wins. There is no number of classes that changes this."
        },
        {
          "q": "How do cascade layers interact with specificity?",
          "a": "Layers are checked before specificity, so they override it entirely within the author origin. A `.button` rule in a later layer beats `#sidebar .button` in an earlier one. Unlayered styles sit above every layer, which is what makes it safe to wrap a third-party sheet in a layer and leave your own CSS as it is."
        },
        {
          "q": "Why does my !important in a later layer lose?",
          "a": "Layer order reverses for important declarations. The earliest layer has the highest priority for `!important`, and unlayered important declarations are the weakest of all. It sounds backwards until you notice it makes a reset layer the right home for declarations that truly must not be overridden."
        },
        {
          "q": "How do I override a framework's styles without using !important?",
          "a": "Import the framework into a cascade layer and keep your own CSS unlayered, or declare an explicit order with your layer last. Both approaches let a single-class selector beat the framework's longest one, and neither leaves `!important` scattered through the codebase for the next person to unpick."
        },
        {
          "q": "Does an inline style always win?",
          "a": "It beats every selector in your stylesheets, however specific, because element-attached styles are sorted before specificity. But a stylesheet declaration marked `!important` beats a normal inline style, and an `!important` inside the style attribute beats that. A running CSS transition outranks all of them."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Once the rule applies, this is the next argument: which layout model the component actually needs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same shape of bug one layer up: the code is right, the mental model of the ordering is not.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check that the colour winning the cascade actually clears WCAG AA against its background.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-21",
  "updated": "2026-09-21",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
