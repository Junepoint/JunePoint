module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity, Layers and !important Explained",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Why a CSS rule does not apply: how specificity is really counted, how cascade layers reorder the fight, and where !important and inline styles sit.",
  "standfirst": "A diagnostic order for losing declarations: matching first, then specificity as three separate numbers, then cascade layers, then importance. Plus the common cases where the cascade was never the problem.",
  "keywords": [
    "css specificity",
    "cascade layers",
    "css important not working",
    "why is my css not applying",
    "specificity calculation"
  ],
  "cardDesc": "Specificity, cascade layers and !important, in the order you should check them when a rule loses.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check that your selector matches the element at all before you reason about priority. A rule that never appears in the Styles pane lost a matching contest, not a cascade one.",
        "Specificity is three independent counts (ID, class-like, type-like) compared left to right. One class beats any number of element selectors, and no number of classes ever beats one ID.",
        "Cascade layers outrank specificity. A `0,0,1` selector in a later layer beats a `1,0,0` selector in an earlier one.",
        "`!important` reverses layer order. Important declarations in the *first* layer win, and important declarations outside any layer are the weakest of the author's important declarations.",
        "Inherited values lose to any declaration that matches the element directly, however weak. This is why adding `!important` to the parent so often changes nothing.",
        "`:where()` contributes zero specificity; `:is()`, `:not()` and `:has()` take the specificity of their most specific argument."
      ]
    },
    {
      "t": "p",
      "x": "When a declaration does not take effect, the cause is one of five things, and they are worth checking in this order: the selector does not match, something else matches with higher specificity, something else sits in a later cascade layer, something else is marked `!important`, or the property was never going to apply to that element in the first place. Browser DevTools answers the first four in about ten seconds. The fifth is the one that wastes an afternoon."
    },
    {
      "t": "h2",
      "x": "Start with matching, not priority"
    },
    {
      "t": "p",
      "x": "Open the element in DevTools and look at the Styles pane. Your rule will be in one of three states. Listed and applied, in which case the value you are seeing comes from somewhere else entirely. Listed with the declaration struck through, which means it matched and lost, and the browser will tell you what beat it if you hover or scroll up. Or absent, which means the selector never matched this element and specificity is irrelevant."
    },
    {
      "t": "p",
      "x": "Absent is the good case, because the list of reasons is short and mechanical. A typo in a class name. A selector written for a DOM shape that changed, usually a direct-child combinator (`>`) where a wrapper got inserted. A component library that hashes class names at build time, so the `.button` you wrote is `.button_a7f3e` in the document. Attribute selectors that are case sensitive for values even when the attribute name is not. Pseudo-classes applied to elements that cannot be in that state, such as `:disabled` on a `div`. And the quiet one: the element lives in a shadow root or an iframe, so your document stylesheet does not reach it."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Confirm the match in the console",
      "x": "`document.querySelectorAll('.card > .title')` is faster than staring at a selector. If it returns an empty list, you have a matching bug. If it returns the element, you have a cascade bug."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "The common mental model, where an ID is worth 100 and a class is worth 10, gives the right answer most of the time and then fails exactly when you need it. Specificity is a triple. Count ID selectors into the first slot, class selectors plus attribute selectors plus pseudo-classes into the second, and type selectors plus pseudo-elements into the third. Compare the triples left to right, stopping at the first difference. There is no carrying between slots, which is why `0,1,0` beats `0,0,11` and would still beat `0,0,100`."
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
          "1,0,1",
          "An ID anywhere in the selector dominates everything below it."
        ],
        [
          "`[id=\"nav\"] a`",
          "0,1,1",
          "Same element targeted, far lower specificity. Useful as a deliberate de-escalation."
        ],
        [
          "`.nav .item a`",
          "0,2,1",
          "Two classes and a type."
        ],
        [
          "`a.item:hover`",
          "0,2,1",
          "Identical triple to the row above, so document order decides."
        ],
        [
          "`nav ul li a`",
          "0,0,4",
          "Loses to any single class. Long descendant chains buy nothing."
        ],
        [
          "`:is(#nav, p) a`",
          "1,0,1",
          "Takes the most specific argument, the ID, not the average."
        ],
        [
          "`:where(#nav) a`",
          "0,0,1",
          "`:where()` always contributes zero, whatever is inside it."
        ],
        [
          "`* > a`",
          "0,0,1",
          "The universal selector contributes nothing."
        ]
      ],
      "caption": "Specificity triples in ID, class-like, type-like order. Compared slot by slot, never summed."
    },
    {
      "t": "p",
      "x": "Two consequences are worth internalising. First, a tie on specificity is resolved by order of appearance in the document, so the later rule wins, and \"later\" means after bundling and after whatever order your build tool emitted. Second, `:where()` is the one tool that lets you write a long, readable selector with zero weight, which makes it the right wrapper for defaults you expect consumers to override."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,1,0 for the whole thing: the :where() contents are free */\n:where(.prose, .prose-compact, article) h2 {\n  margin-block-start: 2rem;\n}\n\n/* 0,2,0 even though :not() looks like it should not count */\n.btn:not(.btn-ghost) {\n  border: 1px solid currentColor;\n}\n\n/* Nesting behaves like :is(), so this is 1,1,0, not 0,1,0 */\n#app, .app {\n  & .title { font-weight: 600; }\n}"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Nesting inherits the worst case",
      "x": "The nesting selector takes the specificity of the most specific selector in the parent list. One stray ID at the top of a nested block raises the specificity of every rule inside it, which is a common surprise when migrating Sass to native nesting."
    },
    {
      "t": "h2",
      "x": "Cascade layers beat specificity outright"
    },
    {
      "t": "p",
      "x": "Layers sit above specificity in the cascade, so they are checked first and specificity only breaks ties inside a layer. Declare the order once with a `@layer` statement, and the declaration order of layers is then fixed regardless of where the rules themselves appear in the file. Later layers win. Anything outside a layer wins over every layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, base, theme;\n\n@layer theme {\n  a { color: rebeccapurple; }        /* 0,0,1 */\n}\n\n@layer base {\n  #content .link a { color: navy; }   /* 1,1,1, and it still loses */\n}\n\n/* Unlayered, so this beats both for normal declarations */\na { color: teal; }"
    },
    {
      "t": "p",
      "x": "That is the behaviour people want from layers: wrap a third-party stylesheet in an early layer and your own CSS stops fighting it, no matter how aggressively the vendor wrote their selectors. `@import url(vendor.css) layer(vendor);` does it in one line. The trap is that unlayered CSS is strongest, so a half-migrated codebase where some files are layered and some are not can behave in ways that look random until you notice which is which."
    },
    {
      "t": "h3",
      "x": "!important flips the layer order"
    },
    {
      "t": "p",
      "x": "This is the part that catches experienced people. For important declarations, layer precedence is reversed. The first layer wins, later layers lose, and important declarations outside any layer are the weakest important declarations in the author origin. The logic is defensible once you see it: a reset layer declared first is the layer most likely to represent a hard constraint. It is still deeply counterintuitive at 11pm."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, theme;\n\n@layer reset {\n  a { color: navy !important; }     /* WINS: earliest layer */\n}\n\n@layer theme {\n  a { color: purple !important; }   /* loses */\n}\n\na { color: teal !important; }        /* loses to both: unlayered important is weakest */"
    },
    {
      "t": "p",
      "x": "Cascade layers have been supported across Chrome, Edge, Firefox and Safari since early 2022, so for most teams the support question is settled. `@scope`, which adds proximity to the cascade so that the nearer scope root wins, landed in the Chromium browsers and Safari first and arrived in Firefox later. Verify current support before you depend on it, because this is the kind of detail that changes between the time an article is written and the time you read it."
    },
    {
      "t": "h2",
      "x": "Where !important and inline styles actually sit"
    },
    {
      "t": "p",
      "x": "Importance is resolved before specificity and before layers, as part of the origin comparison. Written out from strongest to weakest, the full ordering is less mysterious than it looks:"
    },
    {
      "t": "ol",
      "items": [
        "Declarations from a running CSS transition.",
        "`!important` declarations from the user agent stylesheet.",
        "`!important` declarations from the user origin (browser or OS level user preferences).",
        "`!important` declarations from the author (your CSS, plus any `!important` in an inline `style` attribute, which is the strongest of these).",
        "Declarations from a running CSS animation.",
        "Normal author declarations, including normal declarations in an inline `style` attribute, which outrank normal declarations in stylesheets.",
        "Normal user declarations.",
        "Normal user agent declarations."
      ]
    },
    {
      "t": "p",
      "x": "Two practical readings fall out of that list. An `!important` rule in your stylesheet does override a normal inline `style` attribute, which is how you can sometimes win against a script that writes inline styles. And a normal declaration can never beat an animation that is currently running on the same property, which explains the classic \"my hover color does nothing during the transition\" report."
    },
    {
      "t": "p",
      "x": "Beating an existing `!important` is where the layer inversion becomes useful rather than annoying. If a vendor stylesheet in a layer has an important declaration, an important declaration of yours in an *earlier* layer wins. Inside the same layer, you need equal or higher specificity plus `!important`, with document order breaking the tie. The nuclear option, an inline `style` attribute marked important, wins over everything in the author origin, and should feel like what it is: a patch, not a fix."
    },
    {
      "t": "h2",
      "x": "When the cascade was never the problem"
    },
    {
      "t": "p",
      "x": "Several failure modes look exactly like a lost specificity fight and are not. Inheritance is the biggest. Inherited values are not declarations; they are what an element falls back to when nothing matches it directly. So any matching declaration, however weak, beats an inherited value from an ancestor."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* The intent: all text in the card is dark grey */\n.card { color: #333 !important; }\n\n/* But links inside it stay blue, because this matches the <a> directly */\na { color: blue; }\n\n/* Fix the actual target, and the !important above becomes unnecessary */\n.card a { color: #333; }"
    },
    {
      "t": "p",
      "x": "The rest of the list is shorter to scan than to debug:"
    },
    {
      "t": "ul",
      "items": [
        "**Invalid or unsupported value.** A declaration the parser cannot understand is discarded entirely at parse time. DevTools marks it with a warning icon rather than a strikethrough, and the two look similar at a glance.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements. `z-index` and `top` do nothing on `position: static`. `gap` needs a flex, grid or multi-column container. `flex: 1` on a child whose parent is not a flex container is inert.",
        "**A shorthand later in the cascade reset your longhand.** `background: red` wipes `background-size`. `font` resets `line-height`. The shorthand is not more specific, it simply came later and set every longhand it owns.",
        "**An animation or transition is holding the value.** `animation-fill-mode: forwards` keeps the final keyframe value in place after the animation ends, outranking your normal declarations until you remove it.",
        "**Scoped styling from the framework.** Vue's `scoped` attribute adds an attribute selector, which adds `0,1,0` to every rule it touches. CSS Modules hash class names. Utility frameworks depend on their own emitted order, so where your custom CSS lands in the bundle decides the outcome.",
        "**The stylesheet is not the one you are editing.** A cached build, a service worker serving an old asset, or a second copy of the same library pulled in transitively. Confirm by searching for the declaration in the Sources panel, not in your editor."
      ]
    },
    {
      "t": "h2",
      "x": "A debugging order that holds up"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Find the winning declaration, not your losing one",
          "x": "In the Styles pane, work from the top. The first unstruck occurrence of the property is the winner. Click through to its source file. Half the time the answer is \"that rule is not where I assumed it was\"."
        },
        {
          "title": "Check the computed value",
          "x": "The Computed pane shows the resolved value and lets you expand it to see every declaration that tried to set it, in cascade order. If your rule does not appear in that expanded list, it did not match the element.",
          "code": "getComputedStyle(el).color  // what the browser actually resolved"
        },
        {
          "title": "Compare specificity slot by slot",
          "x": "Write both triples down. If the first slot differs, nothing else matters. If they are equal, the later rule in document order wins, so check the bundle order rather than the source order."
        },
        {
          "title": "Look for a layer",
          "x": "DevTools shows the layer name next to the rule's origin. If the winner is in a later layer, no amount of added specificity on your side will help; move your rule into a layer at or after that one."
        },
        {
          "title": "Only then reach for !important",
          "x": "And when you do, leave a comment saying what you are overriding and why, because the next person will otherwise have to repeat this entire process."
        }
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "revert-layer is the gentler tool",
      "x": "`revert-layer` rolls a property back to the value it would have had from the previous layer, and `revert` rolls it back to the user agent or user value. Both are often what people actually want when they type `!important`, and neither leaves a specificity trap behind."
    },
    {
      "t": "h2",
      "x": "Keeping specificity low on purpose"
    },
    {
      "t": "p",
      "x": "Most specificity pain is self-inflicted and accumulates slowly. One ID in a selector forces every future override to also use an ID. One `!important` forces every future override to be important too, and then those compete on specificity, and within a year you have `#app .modal .btn.btn-primary:not(.disabled) { color: red !important }` and nobody can change a button color. The fixes are unglamorous. Target with a single class where you can. Use `:where()` to make structural context free. Put anything you do not own, and anything you expect to override, into an early cascade layer. Reserve IDs for fragment links and form labels, where they are what the HTML is for."
    },
    {
      "t": "p",
      "x": "None of this is about purity. A flat specificity profile means the only question you have to answer when a rule loses is \"which file came last\", and that is a question you can answer in seconds instead of minutes."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model fits the problem, and how to stop fighting the one you picked.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "React useState Not Updating",
          "desc": "Five causes for state that looks one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Diagnose and Fix CORS Errors",
          "desc": "Read the browser's message properly, then fix it on the server where it belongs.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check whether the rule appears at all in the DevTools Styles pane for that element. If it is missing, the selector did not match, and the usual causes are a changed DOM shape, a hashed or scoped class name, or an element inside a shadow root. If it appears with a strikethrough, it matched and lost, and the winning declaration is listed above it."
        },
        {
          "q": "How many classes does it take to beat an ID in CSS?",
          "a": "No number of classes beats one ID. Specificity is compared as three separate counts rather than summed, so the ID column is checked first and decides the outcome on its own. To override an ID-based rule without adding an ID of your own, put your CSS in a later cascade layer, or match the element with an attribute selector such as `[id=\"nav\"]` plus enough classes, or use `!important`."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes, if the inline style is a normal declaration. An `!important` declaration in an author stylesheet outranks a normal declaration in a `style` attribute. An inline declaration that is itself marked `!important` is the strongest author declaration there is, and nothing in your stylesheets will beat it."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes. Layer order is evaluated before specificity, so a single-type selector in a later layer beats an ID selector in an earlier layer. Specificity only decides contests between rules in the same layer. Unlayered CSS beats all layers for normal declarations."
        },
        {
          "q": "How do I override an !important rule from a third-party stylesheet?",
          "a": "If the vendor CSS is inside a cascade layer, put your own `!important` declaration in an earlier layer, because layer order is reversed for important declarations. Otherwise match the specificity or exceed it and add `!important`, keeping your rule later in the bundle. Also consider `revert-layer`, which steps the property back to the previous layer's value without adding another important declaration."
        },
        {
          "q": "Does :has() add specificity?",
          "a": "`:has()` takes the specificity of its most specific argument, the same way `:is()` and `:not()` do. So `.card:has(#hero)` carries an ID in its first specificity slot. If you want the match without the weight, wrap the argument in `:where()`, which always contributes zero."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-26",
  "updated": "2026-11-26",
  "author": "jackson",
  "related": [
    "/guides/javascript-async-await-explained/",
    "/guides/ssh-permission-denied-publickey/"
  ]
};
