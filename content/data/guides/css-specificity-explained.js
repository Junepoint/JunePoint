module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, the cascade, and !important",
  "eyebrow": "CSS",
  "description": "Specificity is three numbers, not one. How origin, cascade layers and !important decide which CSS declaration wins, and how to find the one that beat yours.",
  "standfirst": "The cascade checks four other things before it ever counts selectors. Here is the real order of operations, and the fastest way to find the declaration that overruled you.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "important css",
    "css cascade order"
  ],
  "cardDesc": "Count specificity correctly, read the cascade in the right order, and use @layer instead of another !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers compared left to right: ids, then classes and their equivalents, then element names. One `#id` beats eleven classes. The columns never carry.",
        "Before counting anything, check whether the declaration is in the Styles pane at all. If it is absent, the selector never matched or the sheet never loaded, and `!important` will not help.",
        "Specificity is step five of six. Origin and importance, shadow tree context, the `style` attribute and cascade layer are all checked first.",
        "`!important` is not a specificity bonus. It moves the declaration to a different bucket, then layer and specificity decide as usual.",
        "`@layer` is the escape from the arms race: a late layer beats an early one no matter how the selectors are written. For `!important` declarations, that layer order runs backwards."
      ]
    },
    {
      "t": "h2",
      "x": "Start by proving the rule actually lost"
    },
    {
      "t": "p",
      "x": "Two different bugs hide behind the same sentence. Either your declaration reached the element and lost a fight, or it never reached the element at all. The Styles pane in DevTools separates them in a few seconds. Look for your selector in the list: if the property is there with a line through it, something overruled you and the rest of this page applies. If the selector is nowhere in the list, specificity is innocent."
    },
    {
      "t": "p",
      "x": "Rules that never arrive usually fail for one of these reasons:"
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** `.navBar` is not `.navbar`. Class and id selectors are case sensitive in standards mode, and a stray descendant combinator (`.card .title` instead of `.card.title`) changes the meaning completely.",
        "**The stylesheet never loaded.** A 404, a blocked MIME type or a failed build leaves no trace in the Styles pane. Check the Network tab.",
        "**The property does not apply to that element.** `width` is ignored on a non-replaced inline element, and `gap` does nothing outside a flex, grid or multi-column container.",
        "**The build dropped the class.** Content scanning in a utility framework, a CSS modules hash mismatch, or an over-eager purge step can remove a class that is right there in your source.",
        "**Something is rewriting the element.** A component re-rendering with a different `className`, or a library assigning to `element.style`, both look exactly like CSS failing."
      ]
    },
    {
      "t": "p",
      "x": "Three console checks settle which world you are in:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does anything match the selector at all?\ndocument.querySelectorAll('.card-title').length    // 0 means it is the selector, not the cascade\n\n// What did the element actually end up with?\nconst el = document.querySelector('.card-title');\ngetComputedStyle(el).color                         // \"rgb(15, 23, 42)\"\n\n// Did the sheet load? (href is readable even for cross-origin sheets)\n[...document.styleSheets].map(s => s.href)"
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "Write it the way the spec does, as three columns: ids, then classes and their equivalents, then element names and pseudo-elements. Specificity is compared column by column, left to right, and the first difference ends the comparison. Treat it like a version number rather than a score. That is why `0-11-0` loses to `1-0-0`: the id column is read first, and nothing in the class column can make up the gap. Ten classes do not add up to an id, and a thousand would not either."
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
          "`*`, `>`, `+`, `~`, `:where()`",
          "0-0-0",
          "Free. Combinators and the universal selector add nothing."
        ],
        [
          "`div`, `::before`",
          "0-0-1",
          "Element names and pseudo-elements."
        ],
        [
          "`.card`, `[type=\"text\"]`, `:hover`",
          "0-1-0",
          "Classes, attribute selectors and ordinary pseudo-classes all share the middle column."
        ],
        [
          "`#header`",
          "1-0-0",
          "One id outranks any number of entries in the other two columns."
        ],
        [
          "`style=\"...\"`",
          "Not comparable",
          "Element-attached styles are sorted before specificity is even considered."
        ],
        [
          "`!important`",
          "Not specificity",
          "Changes which importance bucket the declaration lands in."
        ]
      ],
      "caption": "The three specificity columns, compared left to right."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-0-1  one element selector */\na { color: #0f172a; }\n\n/* 0-1-0  one class */\n.link { color: #2563eb; }\n\n/* 0-2-1  one element, two classes */\na.link.link-muted { color: #64748b; }\n\n/* 1-0-0  one id, and it beats everything above */\n#footer-link { color: rebeccapurple; }\n\n/* 0-11-0  eleven classes, and it still loses to 1-0-0 */\n.link.link.link.link.link.link.link.link.link.link.link { color: red; }"
    },
    {
      "t": "p",
      "x": "The fact that classes and attribute selectors share a column gives you two useful tricks, one for raising weight and one for keeping it low."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Raise weight without introducing an id. Repeating a class is legal. 0-2-0 */\n.btn.btn { padding: 0.5rem 1rem; }\n\n/* Target a unique element at class weight instead of id weight. 0-1-0, not 1-0-0 */\n[id=\"signup\"] { background: #2563eb; }"
    },
    {
      "t": "p",
      "x": "Repeating a class is ugly but honest, and far easier to unwind later than an id selector or an `!important`. The attribute form is the better default inside a design system: it lets you style one known element while leaving consumers able to override you with a single class."
    },
    {
      "t": "h2",
      "x": "The cascade checks four things before specificity"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser sorts them in a fixed order: origin and importance, then shadow tree context, then whether the declaration came from a `style` attribute, then cascade layer, then specificity, and only then order of appearance. Specificity is late in that list. Most of the losses that feel inexplicable are decided in the earlier steps."
    },
    {
      "t": "table",
      "head": [
        "Priority",
        "Declaration group"
      ],
      "rows": [
        [
          "1 (strongest)",
          "CSS transitions, while interpolating"
        ],
        [
          "2",
          "`!important` user-agent styles"
        ],
        [
          "3",
          "`!important` user styles, including accessibility settings and extensions"
        ],
        [
          "4",
          "`!important` author styles, meaning yours"
        ],
        [
          "5",
          "CSS animations, while running"
        ],
        [
          "6",
          "Normal author styles"
        ],
        [
          "7",
          "Normal user styles"
        ],
        [
          "8 (weakest)",
          "Normal user-agent styles, the browser default sheet"
        ]
      ],
      "caption": "Origin and importance, the first sorting step. Everything in a higher group wins outright."
    },
    {
      "t": "p",
      "x": "Two rows deserve a second look. A running animation outranks your normal author styles, which is why a `@keyframes` rule can hold a property hostage, and why `animation-fill-mode: forwards` keeps winning after it finishes. Transitions sit above even `!important` for as long as they are interpolating, so a value that snaps back mid-hover is usually a transition, not a specificity problem. The user rows matter too: a user `!important` rule is designed to beat you, and overriding one is a bug, not a victory."
    },
    {
      "t": "h2",
      "x": "What !important really does"
    },
    {
      "t": "p",
      "x": "`!important` does not add to specificity. It moves the declaration into a different group in step one, and inside that group the normal rules resume: layer, then specificity, then source order. Two `!important` declarations on the same property still have to fight each other on specificity. This is how teams end up with `!important` bolted onto a selector that could never have won anyway, which explains the common and baffling report that \"even !important doesn't work\"."
    },
    {
      "t": "p",
      "x": "Inline styles follow the same logic. An author `!important` rule in a stylesheet does beat `style=\"color: red\"`, because importance is sorted before element-attached styles. It loses to `style=\"color: red !important\"`, because that declaration is in the same importance group and then wins on the `style` attribute step."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The escalation trap",
      "x": "`!important` in a component stylesheet is a promise that nobody downstream can change that property without their own `!important` and a more specific selector. It is defensible in two places: a utility class whose entire job is to override something (`.hidden`, `.sr-only`), and a one-line patch over a vendor sheet you do not control. Anywhere else it is a bill you are sending to the next person who opens the file."
    },
    {
      "t": "h2",
      "x": "Cascade layers are the real fix"
    },
    {
      "t": "p",
      "x": "`@layer` gives you a priority order that specificity cannot cross. Declare the order once, near the top of your entry stylesheet, and every rule in a later layer beats every rule in an earlier one regardless of how the selectors are written. An id selector in an early layer loses to a single class in a late layer. That is the whole feature, and it removes most of the reasons people reach for `!important`."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once. First listed is weakest. */\n@layer reset, vendor, base, components, utilities;\n\n@layer vendor {\n  #widget .title { color: black; }    /* 1-1-0, and it loses anyway */\n}\n\n@layer components {\n  .widget-title { color: #0f172a; }   /* 0-1-0, wins: later layer */\n}\n\n/* Unlayered rules sit above every layer for normal declarations. */\n.widget-title { color: teal; }        /* wins overall */"
    },
    {
      "t": "p",
      "x": "Unlayered rules being the strongest group makes migration cheap. Wrap the sheets you want to demote, leave your own code where it is, and nothing else has to change. Third-party CSS can be demoted at import time without editing the file:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@import url(\"vendor/datepicker.css\") layer(vendor);"
    },
    {
      "t": "p",
      "x": "The inversion is the part that catches people out. For `!important` declarations the layer order runs backwards, and unlayered styles become the weakest group instead of the strongest."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base {\n  .price { color: red !important; }    /* this one wins */\n}\n\n@layer theme {\n  .price { color: blue !important; }   /* later layer, but importance reverses the order */\n}"
    },
    {
      "t": "p",
      "x": "That behaviour is deliberate: it lets a low-level reset or theme assert something that later layers cannot casually undo. It also means that if both `!important` and `@layer` appear in a codebase, you cannot predict any override without reading the `@layer` statement first. Put it in one place and comment it."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support, and the usual caveat",
      "x": "`@layer` shipped across the major engines in the first half of 2022: Chrome 99 and Safari 15.4 in March 2022, Firefox 97 in February 2022. Those figures are as of October 2026 and describe the engines, not the browsers your users are actually running. Check caniuse.com against your own support target before you depend on it, and remember that a browser without `@layer` support drops the whole block, which fails loudly rather than gracefully."
    },
    {
      "t": "h2",
      "x": "Functional pseudo-classes change the arithmetic"
    },
    {
      "t": "p",
      "x": "`:where()` always contributes zero, whatever is inside it. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, which can bite: one innocent-looking `:is()` smuggles an id into a selector that reads like a single class. If you are writing CSS other people will override, default to `:where()`."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-0-1 overall. :where() adds nothing, so a plain `.prose a` beats this. */\n:where(.prose, .markdown) a { text-decoration: underline; }\n\n/* 1-1-0. :is() took #main, its most specific argument. */\n:is(#main, .wrapper) .note { color: #334155; }\n\n/* 1-1-0 too, even though #nope matches nothing on the page. */\n.btn:not(#nope) { color: white; }\n\n/* 0-2-0. :has() takes .error from inside the parentheses. */\n.field:has(.error) { border-color: #dc2626; }"
    },
    {
      "t": "h2",
      "x": "Inline styles and shadow DOM"
    },
    {
      "t": "p",
      "x": "A `style` attribute wins against every selector in the same origin and importance group, because element-attached styles are sorted before layers and specificity. You cannot out-specify it. You can only out-importance it. When a JavaScript library keeps writing to `element.style`, the honest options are to stop the library doing it, or to accept one `!important` and leave a comment explaining which library forced your hand."
    },
    {
      "t": "p",
      "x": "Shadow DOM adds its own twist at step two. Normal declarations from the outer tree beat normal declarations from inside the shadow tree, and `!important` declarations from inside the shadow tree beat `!important` declarations from outside it. The practical consequence is that a web component's internal `!important` cannot be overridden from the page at all, which is one more argument against component authors using it. Custom properties, `::part()` and the `:host` family are the supported ways in."
    },
    {
      "t": "h2",
      "x": "Debug it in this order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches something",
          "x": "This takes one line and eliminates the largest category of false specificity bugs. A zero here means you are in the wrong article.",
          "code": "document.querySelectorAll('.card-title').length"
        },
        {
          "title": "Read the Styles pane top to bottom",
          "x": "DevTools lists matching rules in cascade order, strongest first, with overridden declarations struck through. If your declaration is not listed anywhere, go back to step one."
        },
        {
          "title": "Expand the property in the Computed pane",
          "x": "This is the fastest move and the one most people skip. Expanding a computed property lists every declaration that set it, in order, each linked to its source file. The top entry is the rule you have to beat. Now you know its name instead of guessing."
        },
        {
          "title": "Write both selectors as three numbers",
          "x": "Compare the winner against yours column by column. If you are behind on the first differing column, matching it is not enough: equal specificity falls through to source order, so your rule also has to come later in the final stylesheet."
        },
        {
          "title": "Fix the winner, not the loser, where you can",
          "x": "Lowering the winning selector or moving it into an earlier layer leaves the codebase better than it was. Raising your own selector is for code you do not own, and `!important` is for code you cannot edit."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Things that look like specificity and are not"
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand wiping a longhand.** `background: red` after `background-color: blue` erases it at identical specificity, because the shorthand sets every sub-property it owns, including the ones you did not mention. Same for `font`, `border` and `inset`.",
        "**Custom property resolution.** `var()` is substituted on the element, so the custom property runs its own cascade first. A `--accent` set by a losing rule never arrives, and the fallback in `var(--accent, #333)` quietly takes over. The value you see is correct for a variable you did not set.",
        "**Non-inherited properties.** Putting `border` on a parent does nothing for a child. The Computed pane distinguishes inherited values from declared ones.",
        "**Source order after bundling.** Two rules of equal specificity are decided by which comes later in the output file, and that order follows your import graph rather than your directory names. A change to chunk splitting can flip a style with no CSS edit at all, which is the usual answer to \"it works locally\".",
        "**Utility frameworks.** Utility classes mostly share specificity, so conflicts resolve by position in the generated CSS and never by the order you typed classes in the markup. Tailwind 4 emits native cascade layers, so read the `@layer` statement in your generated output before reasoning about overrides.",
        "**`@scope` proximity.** Where `@scope` is in use, proximity to the scope root breaks ties ahead of source order, so two rules you believed were equal are not. Browser support was still uneven as of October 2026; verify before relying on it."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "how many classes does it take to beat an id in css",
          "a": "None. The id column is compared before the class column, so `1-0-0` beats `0-99-0`. The ways past an id selector are: an id of your own plus anything extra, an equal-specificity rule placed later, an inline style, a later cascade layer, or `!important`. The layer option is the one that will not haunt you."
        },
        {
          "q": "does !important override inline styles",
          "a": "Yes, as long as the inline style is a normal declaration. Importance is sorted before element-attached styles, so `.price { color: red !important; }` in a stylesheet beats `style=\"color: blue\"`. It does not beat `style=\"color: blue !important\"`, which is in the same importance group and then wins on the `style` attribute step."
        },
        {
          "q": "why is my css struck through in devtools",
          "a": "Two causes, and they look identical. Either another declaration won for that property, in which case the Computed pane will name the winner, or the declaration itself is invalid and the browser discarded it. A misspelled property, a bad unit, or a value the browser does not support all produce a strikethrough with no competing rule. DevTools usually shows a warning icon for that second case."
        },
        {
          "q": "is !important ever ok to use",
          "a": "In two places. A utility class whose only purpose is to override, such as `.hidden`, is a reasonable use because overriding is the entire contract. A patch over a third-party sheet you cannot edit is the other. In your own component CSS, prefer `@layer`: it gets you the same override without removing anyone else's ability to override you later."
        },
        {
          "q": "why does my css work in development but not production",
          "a": "Almost always source order or a build step rather than specificity. Bundlers can emit stylesheets in a different order than the dev server, minifiers merge and reorder rules with identical declarations, and purge or content-scanning steps delete classes they could not find in your source. Compare the generated CSS from both builds for your selector before touching the selector itself."
        },
        {
          "q": "should i add cascade layers to an existing project",
          "a": "You can do it incrementally, which is the appealing part. Unlayered CSS is the strongest group for normal declarations, so wrapping vendor imports in `layer(vendor)` demotes them while your own code keeps working untouched. Start there, then move your reset and base styles into layers. Hold off on layering code that already uses `!important` until you have read the importance inversion above, because that is where the surprises live."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout model fits the problem, and why the answer is usually both.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "React useState Not Updating",
          "desc": "Five causes, including the stale closure that makes state look one step behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA in the browser.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-12",
  "updated": "2026-10-12",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
