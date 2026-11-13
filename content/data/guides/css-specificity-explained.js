module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying: specificity, layers and !important",
  "eyebrow": "Troubleshooting",
  "description": "Your CSS rule is not applying: how the cascade sorts declarations, how specificity is really counted, what cascade layers change, and when to use !important.",
  "standfirst": "Specificity is only the fifth thing the browser compares, and it is rarely the real cause. Here is the full sort order, the counting rules that trip people up, and a debugging sequence that finds the answer fast.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "The cascade sorts declarations several ways before specificity matters. Here is the order, and how to debug it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "First confirm the rule is even in the running. If devtools does not list the selector on the element at all, the problem is a non-matching selector, an unloaded stylesheet or a false `@media` block, and no amount of `!important` will help.",
        "Specificity is three independent columns, compared left to right: IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements. There is no carrying. Eleven classes still lose to one ID.",
        "The cascade compares origin and importance, then context, then inline styles, then cascade layers, and only then specificity. A low-specificity rule in a later layer beats a high-specificity rule in an earlier one.",
        "`!important` reverses layer order. The earliest layer wins, and an unlayered `!important` ranks below every layered `!important`, which is the opposite of how normal declarations behave.",
        "A declaration with an invalid value is dropped at parse time, so it never competes. That looks identical to losing the cascade but is fixed in a completely different way."
      ]
    },
    {
      "t": "lede",
      "x": "A declaration that has no effect has a short list of possible causes, and most developers reach for the least likely one first. Adding `!important` makes the symptom go away roughly half the time, which is exactly often enough to teach the wrong lesson. The useful habit is to work through the causes in the order the browser does."
    },
    {
      "t": "h2",
      "x": "Step one: is the rule in the running at all?"
    },
    {
      "t": "p",
      "x": "Select the element in devtools and read the Styles pane. Every rule whose selector matched that element appears there, winners and losers alike. If your selector is not in the list, the cascade is irrelevant, because your declaration was never a candidate. Check the obvious things in this order: the selector matches something other than what you think it does, the stylesheet failed to load or the build output is stale, or the rule sits inside a `@media`, `@supports` or `@container` block whose condition is false at the current viewport."
    },
    {
      "t": "p",
      "x": "Descendant combinators are a frequent culprit. `.card .title` requires `.title` to be inside `.card`; if a wrapper changed and they are now siblings, the rule silently stops matching. So does a single mistyped class name, which produces valid CSS that matches nothing. Neither of these shows up as an error anywhere."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Read the three signals devtools gives you",
      "x": "A declaration with a line through it lost the cascade. A declaration with a warning icon next to it was dropped as invalid. A property that appears only in the Computed pane, with no rule behind it, was inherited or came from the user-agent stylesheet. Those are three different bugs, and the Styles pane tells them apart before you change any code."
    },
    {
      "t": "h2",
      "x": "The cascade compares five things before specificity"
    },
    {
      "t": "p",
      "x": "When two declarations both match the same element and both set the same property, the browser sorts them through a fixed sequence of tests. The first test that distinguishes them decides the winner, and the rest are never consulted. Specificity sits near the bottom."
    },
    {
      "t": "table",
      "head": [
        "Order",
        "What is compared",
        "What this means in practice"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "Author, user and user-agent styles, with `!important` flipping their relative order",
          "Your `!important` beats your normal styles. A running CSS animation beats your normal styles but loses to your `!important`. A CSS transition in progress beats everything."
        ],
        [
          "2. Context",
          "Shadow tree versus outer document",
          "For normal declarations, a tie across a shadow boundary goes to the outer context. Document styles mostly cannot reach inside shadow DOM at all except through inheritance and `::part()`."
        ],
        [
          "3. Element-attached styles",
          "The `style` attribute",
          "An inline style has no specificity value; it simply ranks above all selector-based author rules of the same importance."
        ],
        [
          "4. Cascade layers",
          "`@layer` order",
          "For normal declarations, later layers win and unlayered styles win over everything layered. For `!important`, the whole order is reversed."
        ],
        [
          "5. Specificity",
          "The three-column count",
          "Only reached if everything above ties."
        ],
        [
          "6. Order of appearance",
          "Document position of the last matching declaration",
          "The later rule wins. This is what resolves the common case of two identical class selectors."
        ]
      ],
      "caption": "Simplified cascade sort order. CSS Cascade Level 6 adds scope proximity for @scope between specificity and order of appearance; check current browser support on caniuse before relying on it (November 2026)."
    },
    {
      "t": "p",
      "x": "Two consequences of this table explain most confusing overrides. A single class selector in a later cascade layer beats a four-class selector in an earlier one, because layers are compared before specificity is ever counted. And an element being animated by `@keyframes` will ignore your perfectly specific rule for the whole duration of the animation, because animations outrank normal author declarations regardless of selector."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is not a number. It is a tuple of three counts, usually written `A,B,C`, compared from left to right like version numbers. A higher `A` ends the comparison immediately; `B` and `C` are not even looked at."
    },
    {
      "t": "table",
      "head": [
        "Column",
        "Counts",
        "Examples",
        "Value"
      ],
      "rows": [
        [
          "A",
          "ID selectors",
          "`#main`, `#app`",
          "1,0,0"
        ],
        [
          "B",
          "Classes, attribute selectors, pseudo-classes",
          "`.card`, `[data-open]`, `[type=\"text\"]`, `:hover`, `:nth-child(2)`",
          "0,1,0"
        ],
        [
          "C",
          "Type selectors and pseudo-elements",
          "`div`, `a`, `::before`, `::marker`",
          "0,0,1"
        ],
        [
          "Nothing",
          "Universal selector and combinators",
          "`*`, `>`, `+`, `~`, descendant space",
          "0,0,0"
        ]
      ],
      "caption": "Specificity weights. @media, @supports and @layer wrappers add nothing to the selector's specificity."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Three classes and a type selector. Specificity 0,3,1. */\ndiv.card.promo.featured { color: teal; }\n\n/* One ID. Specificity 1,0,0. This one wins. */\n#intro { color: crimson; }\n\n/* Column A is 1 against 0, so the browser stops there.\n   The three classes are never weighed against anything. */"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "The attribute-selector escape hatch",
      "x": "`[id=\"intro\"]` matches exactly the same elements as `#intro` but counts as 0,1,0 instead of 1,0,0. If you maintain a stylesheet that others will override, writing IDs in attribute form keeps their class-based overrides working. It is also a legitimate way to defuse an ID selector you inherited and cannot remove from the markup."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer"
    },
    {
      "t": "p",
      "x": "`@layer` exists so that specificity stops being the arbiter between unrelated chunks of CSS. You declare the layer order once, and from then on a declaration's layer matters more than how its selector was written. Layers have been supported across Chrome, Edge, Firefox and Safari since 2022, so this is production-safe rather than experimental."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. Later layers win. */\n@layer reset, base, components, utilities;\n\n@layer base {\n  a { color: #0645ad; }          /* 0,0,1 */\n}\n\n@layer utilities {\n  .muted { color: #666; }        /* 0,1,0, and in a later layer */\n}\n\n/* Unlayered styles beat every normal declaration in every layer,\n   whatever the specificity on either side. */\na { color: rebeccapurple; }"
    },
    {
      "t": "p",
      "x": "That last rule is the part people forget. Unlayered normal declarations are treated as the final, highest-priority layer. If you move your own styles into `@layer app` and leave a third-party stylesheet unlayered, the third party now wins every tie, which is usually the reverse of what you wanted. The standard pattern is to wrap the vendor stylesheet in a low layer at import time with `@import url(\"vendor.css\") layer(vendor);` and keep your own rules unlayered."
    },
    {
      "t": "h2",
      "x": "!important and the layer reversal"
    },
    {
      "t": "p",
      "x": "For important declarations, the layer order runs backwards. The earliest layer wins, and unlayered `!important` ranks below every layered `!important`. This is deliberate: it means a design system can mark something important in a base layer and have that hold, rather than losing to whatever was appended last. It also means a utilities layer full of `!important`, which is a very common setup, is the weakest important layer in the file."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base {\n  .btn { background: navy !important; }\n}\n\n@layer theme {\n  .btn { background: red !important; }\n}\n\n.btn { background: green !important; }\n\n/* Result: navy.\n   Earliest layer wins among important declarations, and the\n   unlayered one ranks lowest of the three. */"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Escalating !important does not work the way it used to",
      "x": "In a layered codebase, adding `!important` to a rule in your last layer can make it lose to a rule it was previously beating, because you have moved it out of the normal ordering and into the reversed one. If an `!important` makes things worse rather than better, that reversal is the first thing to suspect."
    },
    {
      "t": "p",
      "x": "When you genuinely need to opt out of a layer's styling rather than fight it, the cascade keywords are cleaner than `!important`. `revert-layer` rolls a property back to the value it would have had if the current layer had not set it. `revert` goes all the way back to the user and user-agent origins, and `all: revert` does that for every property at once."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer components {\n  .card { padding: 1rem; border: 1px solid #ddd; }\n}\n\n@layer overrides {\n  /* On an element with both classes, padding returns to whatever it\n     was before the components layer touched it. */\n  .card.is-bare { padding: revert-layer; }\n}"
    },
    {
      "t": "h2",
      "x": "Selector functions that cost more than they look"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` take the specificity of their most specific argument. The pseudo-class itself adds nothing, but one ID inside the parentheses raises the whole selector into column A. `:where()` is the exception and always contributes zero, which is what makes it the right tool for defaults you expect people to override."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,0,1. :where() contributes nothing, even with an ID inside. */\n:where(.sidebar, #app) a { color: inherit; }\n\n/* 1,0,1. :is() inherits the #app, so this now costs an ID. */\n:is(.sidebar, #app) a { color: red; }\n\n/* 1,0,0. :not() follows the same rule. */\n:not(#app) { color: blue; }"
    },
    {
      "t": "p",
      "x": "Native CSS nesting has the same trap, because a nested selector is matched as though its parent were wrapped in `:is()`. If any selector in the parent list contains an ID, every nested rule underneath inherits that ID's weight."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card, #hero {\n  /* Matched as :is(.card, #hero) .title, so specificity is 1,0,1,\n     not the 0,1,1 you would get from .card .title alone. */\n  & .title { font-weight: 600; }\n}"
    },
    {
      "t": "h2",
      "x": "When specificity is not the problem"
    },
    {
      "t": "p",
      "x": "A good share of unapplied rules never reach the cascade. These are the cases where the Styles pane shows your declaration with a warning icon, or shows it as applied while the Computed pane disagrees."
    },
    {
      "t": "ul",
      "items": [
        "**The declaration is invalid and was dropped at parse time.** One bad character in a color or a malformed `calc()` discards that whole declaration, and the previous value stays. Unknown properties and unknown values go the same way, silently.",
        "**A shorthand later in the cascade reset it.** `background: red` after `background-image: url(...)` wipes the image, because the shorthand sets every one of its sub-properties, including the ones you did not mention.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements. `align-self` does nothing outside a flex or grid container, and `gap` does nothing on a block container. See [CSS Grid vs. Flexbox](/guides/css-grid-vs-flexbox/) for which properties belong to which layout model.",
        "**The property is not inherited and you set it on the wrong element.** `border`, `padding` and `background` do not pass down to children. `color`, `font-family` and `line-height` do.",
        "**A `var()` reference resolved to nothing.** If the custom property is unset, the declaration is invalid at computed-value time, which means the property falls back to its inherited or initial value rather than to an earlier declaration of the same property. Use the second argument, `var(--space, 1rem)`, to control that.",
        "**`:visited` is restricted.** Browsers only honour a small set of properties on visited links, and they lie to `getComputedStyle` about them, for privacy reasons.",
        "**Something is setting the style in JavaScript.** An inline style written by a framework or a third-party script outranks every selector you can write short of `!important`."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".badge {\n  color: #ff00gg;         /* invalid hex, dropped at parse time */\n  padidng: 4px;           /* unknown property, dropped */\n  width: calc(100% - );   /* malformed, dropped */\n  gap: var(--space);      /* if --space is unset, gap becomes its\n                             initial value, not an earlier value */\n}"
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matched",
          "x": "Find the rule in the Styles pane for that exact element. If it is absent, stop thinking about specificity and check the selector, the stylesheet request in the Network tab, and any media or container conditions."
        },
        {
          "title": "Check the declaration is valid",
          "x": "A warning icon or a greyed-out property means it was discarded before the cascade ran. Fix the value rather than raising the weight."
        },
        {
          "title": "Find who actually won",
          "x": "Open the Computed pane, expand the property, and read the source of the winning declaration. This is the single highest-value step, because it tells you what you are competing with instead of making you guess."
        },
        {
          "title": "Classify the winner",
          "x": "Inline style, `!important`, a different cascade layer, higher specificity, or simply later in the file. Each has a different fix, and only the fourth one is about specificity."
        },
        {
          "title": "Fix at the lowest level that works",
          "x": "Prefer moving the rule into the right layer, or making the losing selector match more precisely, over adding weight. If you must add weight, add one class the element already has rather than duplicating a selector or chaining `.a.a.a`."
        },
        {
          "title": "Check the selector you are copying",
          "x": "Paste the winning selector into a specificity calculator if the count is not obvious, especially if it contains `:is()`, `:has()`, `:not()` or nesting. Those are where hand-counting goes wrong.",
          "code": "/* Quick sanity check in the console: does it match what you think? */\ndocument.querySelectorAll('.card .title').length"
        }
      ]
    },
    {
      "t": "p",
      "x": "The broader point is that specificity was never meant to be a scoring system you win. It is a tie-breaker of last resort, and treating it as the main mechanism is what produces the selector arms races that make stylesheets unmaintainable. Layers, `:where()` for defaults and a flat single-class convention all exist to keep the tie-breaker from mattering. The trade-off is real: layers add a concept to learn and a file-level discipline to maintain, and on a small site with one stylesheet they are overhead for no benefit. On anything with a design system and third-party CSS in the mix, they repay that cost quickly."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Do 10 classes beat an ID in CSS?",
          "a": "No. Specificity columns are compared independently, left to right, with no carrying between them. `#intro` is 1,0,0 and `.a.b.c.d.e.f.g.h.i.j` is 0,10,0, so the browser compares the first column, sees 1 against 0, and stops. The old \"IDs are worth 100 points\" mnemonic gives the right answer for small counts and the wrong answer here."
        },
        {
          "q": "How do I override an inline style without !important?",
          "a": "You mostly cannot, if the inline style stays in place. Inline styles rank above all selector-based author rules, so `!important` on your rule is the only pure-CSS override for a normal inline declaration. The better fixes are to stop whatever is writing the inline style, or to have that code write a class instead. If a framework sets it on every render, changing your CSS is a losing battle anyway."
        },
        {
          "q": "Why is my !important in a utilities layer not working?",
          "a": "Because layer order is reversed for important declarations. Your utilities layer is last, which makes it the strongest for normal declarations and the weakest for important ones. An `!important` in an earlier layer, such as a reset or base layer, beats it. Either move the important declaration to an earlier layer or drop `!important` and rely on the normal layer order instead."
        },
        {
          "q": "Does a media query increase specificity?",
          "a": "No. `@media`, `@supports`, `@container` and `@layer` wrappers contribute nothing to a selector's specificity. A rule inside a media query wins over an identical rule outside it only because it comes later in the document, so if you move the media query above the base rule it will stop applying. Keep media queries after the rules they modify."
        },
        {
          "q": "Why does my CSS rule show as crossed out in devtools?",
          "a": "A line through a declaration means it matched but lost the cascade to another declaration for the same property. Expand the property in the Computed pane to see which rule won and where it came from. A warning triangle instead of a line means something different: the declaration was invalid and discarded, so it never competed at all."
        },
        {
          "q": "What is the lowest-specificity way to write default styles?",
          "a": "Wrap the selector in `:where()`, which always contributes zero specificity, and put the rules in an early cascade layer. `:where(.prose) a { color: inherit; }` counts as 0,0,1, so any single class selector elsewhere can override it without the author having to think about weights. This is the standard approach for library and design-system defaults."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which properties belong to which layout model, and why some declarations are ignored outright.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "React useState Not Updating: Five Causes to Check",
          "desc": "Another case where the obvious explanation is almost never the real one.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module': Why Resolution Fails",
          "desc": "If your stylesheet import never resolves, the cascade is not your problem.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-13",
  "updated": "2026-11-13",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
