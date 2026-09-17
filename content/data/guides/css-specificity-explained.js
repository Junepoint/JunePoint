module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Your CSS rule is not applying: work the cascade in order",
  "eyebrow": "Guides",
  "description": "Specificity, cascade layers, !important and invalid-value traps, worked through in the order a browser actually resolves them.",
  "standfirst": "Specificity is only one of several sorting criteria, and it is not the first one. Here is the order the browser uses, and the checks that find the real cause fastest.",
  "keywords": [
    "css specificity",
    "cascade layers",
    "css important",
    "css rule not applying",
    "specificity calculator"
  ],
  "cardDesc": "Specificity, cascade layers, !important and invalid-value traps, in the order the browser resolves them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "**Specificity is three numbers, not one.** IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements. The columns never carry, so one ID beats twenty classes.",
        "**Layers are compared before specificity.** A `#id` rule in an early layer loses to a plain `.class` rule in a later one.",
        "**`!important` inverts layer order.** The *earliest* layer wins, and unlayered important declarations rank below every layered one.",
        "**`:where()` costs nothing; `:is()`, `:not()` and `:has()` cost as much as their most specific argument.**",
        "**Plenty of 'not applying' is not the cascade at all.** An invalid value, a typo that kills the whole rule block, a shorthand further down the file, or a property that simply does not inherit."
      ]
    },
    {
      "t": "p",
      "x": "A browser resolves each property on each element by sorting every declaration that could apply to it. Origin and importance come first, then encapsulation context, then element-attached styles, then cascade layers, then specificity, then source order. Most developers reach for specificity immediately, which is why the confusing cases stay confusing: the winning declaration was decided two steps earlier."
    },
    {
      "t": "h2",
      "x": "First, prove the rule is even in play"
    },
    {
      "t": "p",
      "x": "Open devtools, select the element, and read the Styles pane. There are three different failures hiding behind the same complaint, and they need different fixes."
    },
    {
      "t": "ul",
      "items": [
        "**The rule is not listed at all.** The selector does not match the element, or the stylesheet never loaded, or a build step dropped it. Check the Network panel and confirm the class name on the element in the Elements tree.",
        "**The rule is listed but the declaration is struck through.** Something else won, or the value is invalid. Chrome and Firefox both show a warning marker next to a declaration they could not parse.",
        "**The rule is listed and applied, but the page looks wrong anyway.** A parent's `overflow`, `transform` or `display` is reshaping the result, or a later shorthand quietly reset your longhand."
      ]
    },
    {
      "t": "p",
      "x": "That second case splits again. An invalid *value* drops only that one declaration and leaves the rest of the block alone. An invalid *selector* drops the entire rule block, every declaration in it, silently. One stray character in a selector list can therefore take out five perfectly good rules, and nothing in the console will tell you."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Forgiving selector lists",
      "x": "`:is()` and `:where()` use forgiving parsing. They ignore the arguments they do not understand instead of invalidating the rule, so `:is(.card, :some-future-thing)` still styles `.card`. That makes them a useful hedge when you need to ship a selector that only newer browsers know."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a tuple of three counts, usually written 1-2-0. Compare the first column; if it ties, compare the second; if that ties, compare the third. A tie across all three is broken by source order, with the last declaration winning."
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
          "Combinators and the universal selector contribute nothing"
        ],
        [
          "`div`, `::before`, `::marker`",
          "0-0-1",
          "Type selectors and pseudo-elements"
        ],
        [
          "`.card`, `[type=\"text\"]`, `:hover`, `:nth-child(2)`",
          "0-1-0",
          "Classes, attribute selectors and ordinary pseudo-classes"
        ],
        [
          "`#checkout`",
          "1-0-0",
          "IDs"
        ],
        [
          "`style=\"...\"`",
          "n/a",
          "Element-attached styles are sorted before layers and specificity ever come up"
        ]
      ],
      "caption": "The three columns are compared independently. 0-20-0 still loses to 1-0-0."
    },
    {
      "t": "p",
      "x": "Older articles describe specificity as a base-10 number: 100 for an ID, 10 for a class, 1 for an element. That model gives the right answer almost all the time and the wrong answer when a selector has eleven or more classes, which modern utility-heavy code does hit. Think in columns instead."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-1-1 */\nnav a { color: teal; }\n\n/* 0-2-1  more classes, so it beats the rule above */\nnav.primary a.link { color: rebeccapurple; }\n\n/* 1-0-1  the ID column is compared first, so this wins outright */\n#site-nav a { color: crimson; }"
    },
    {
      "t": "h2",
      "x": ":is(), :where(), :not() and :has()"
    },
    {
      "t": "p",
      "x": "These four break the simple counting rules, and they are the most common source of a specificity surprise in current code. `:where()` is always zero, no matter what you put inside it. The other three take the specificity of their most specific argument, even when the element matched through a different, cheaper one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-1-0. The :where() part is free, so .card carries the whole thing. */\n:where(html.theme-dark) .card { background: #111; }\n\n/* 1-1-0. :is() is priced at its most specific argument (#app),\n   even on a page where it matched via .theme-dark. */\n:is(#app, .theme-dark) .card { background: #111; }\n\n/* 0-2-0, not 0-1-0. :not() adds the cost of its argument. */\n.card:not(.featured) { opacity: 0.8; }\n\n/* 0-2-0 as well. :has() is priced the same way. */\n.card:has(.badge) { border-color: gold; }"
    },
    {
      "t": "p",
      "x": "The practical use of `:where()` is writing defaults that anyone can override. A design system that ships `:where(.btn) { padding: 0.5rem 1rem; }` can be corrected by a single unqualified `.btn` rule in application code, because the library's declaration has zero specificity. Library authors who do the opposite, wrapping everything in IDs, are the reason `!important` exists in so many codebases."
    },
    {
      "t": "h2",
      "x": "Cascade layers are compared before specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the tool that makes specificity fights stop. Declare the order once, and every declaration inside a later layer beats every declaration in an earlier one for normal declarations, regardless of how the selectors were written. Specificity is only consulted to break ties within a single layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One statement at the top fixes the order for the whole project.\n   A layer's position is set by where its name first appears, so\n   re-opening `components` later adds to it without moving it. */\n@layer reset, vendor, base, components, utilities;\n\n@import url(\"legacy-theme.css\") layer(vendor);\n\n@layer vendor {\n  #app .btn.btn-primary { background: #6c757d; }  /* 1-2-0 */\n}\n\n@layer components {\n  .btn { background: #2563eb; }                   /* 0-1-0, and it wins */\n}\n\n/* Unlayered styles sort after every layer, so this beats both. */\n.btn { background: hotpink; }"
    },
    {
      "t": "p",
      "x": "That last rule is the part people trip over. Unlayered normal declarations are treated as though they sit in an implicit final layer, so they outrank everything you put in a named layer. If you adopt layers halfway through a project, the legacy stylesheet you did not migrate will keep winning. Either move it into a low layer with `@import ... layer(...)`, or accept that your new layered code needs to move above it."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support",
      "x": "Cascade layers shipped in Chrome, Edge, Firefox and Safari in early 2022, so they are safe in evergreen browsers. `@scope` arrived considerably later and reached the three engines at different times. Check current support data for your own baseline rather than trusting this paragraph, which describes the position in September 2026."
    },
    {
      "t": "h2",
      "x": "!important, and why it runs layers backwards"
    },
    {
      "t": "p",
      "x": "Marking a declaration important moves it into a different bucket in the origin sort. Inside that bucket, the layer comparison is reversed: the earliest layer wins, and unlayered important declarations are the weakest of the author's important declarations rather than the strongest."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .title { color: red !important; }     /* wins */\n}\n\n@layer overrides {\n  .title { color: blue !important; }    /* loses, despite being later */\n}\n\n.title { color: green !important; }     /* weakest of the three */"
    },
    {
      "t": "p",
      "x": "The reversal is deliberate. It means a low layer can hold a genuinely non-negotiable declaration, and it means a third-party sheet stuffed into a bottom layer cannot use `!important` to claw its way back over your code. It also means a stray `!important` in a reset layer is now capable of beating everything you write later, which is a new way to lose an afternoon."
    },
    {
      "t": "table",
      "head": [
        "Rank",
        "What it is",
        "Detail"
      ],
      "rows": [
        [
          "Strongest",
          "A running CSS transition",
          "While a transition is animating, its value overrides the lot. A declaration struck through with nothing visibly beating it is often this."
        ],
        [
          "2",
          "User agent `!important`",
          "Browser defaults marked important. Rare, but it is why some form control behaviour is unreachable."
        ],
        [
          "3",
          "User `!important`",
          "A reader's own stylesheet. This ranking is what keeps accessibility overrides working against hostile pages."
        ],
        [
          "4",
          "Author `!important`",
          "Inline first, then the earliest layer, then unlayered."
        ],
        [
          "5",
          "CSS animations",
          "`@keyframes` values beat normal author declarations while running. `!important` inside a keyframe block is ignored entirely."
        ],
        [
          "6",
          "Author normal",
          "Inline, then unlayered, then the latest layer, then specificity, then source order."
        ],
        [
          "Weakest",
          "User normal, then user agent normal",
          "The browser's own defaults sit at the bottom, which is why an unstyled `a` is blue."
        ]
      ],
      "caption": "The full sort for a single property on a single element."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "When !important is the right answer",
      "x": "Overriding an inline style written by third-party JavaScript. A print stylesheet. A user stylesheet. A deliberate utility class that is meant to be final. Everything else is usually a layer problem wearing a disguise, and each `!important` you add raises the floor for the next person."
    },
    {
      "t": "h2",
      "x": "Source order, shorthands and the build step"
    },
    {
      "t": "p",
      "x": "When two declarations tie on everything else, the later one wins. Later means later in the final concatenated output, which is not always what your editor shows you. Bundlers decide chunk order, `@import` resolution order and code-splitting boundaries, and a rule that wins in the dev server can lose in a production build because two chunks swapped places. If a style regresses only after deployment, look at the emitted CSS, not the source."
    },
    {
      "t": "p",
      "x": "Shorthands are the other quiet overwrite. `background: #fff` resets `background-image`, `background-position` and six other longhands to their initial values. `font` resets `line-height`. `border` resets all three border longhands on all four sides. None of this shows up as a specificity problem, because the shorthand genuinely won and did exactly what it says."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".hero {\n  background-image: url(\"/hero.avif\");\n}\n\n/* Two hundred lines later, in a different file: */\n.hero {\n  background: #0f172a;   /* the image is gone, and nothing looks wrong here */\n}"
    },
    {
      "t": "h2",
      "x": "Inheritance is a separate mechanism"
    },
    {
      "t": "p",
      "x": "The cascade picks a winner among declarations that target the element. Inheritance only supplies a value when there is no such declaration at all. An inherited value therefore loses to *any* declaration on the element itself, including one from the browser's own stylesheet. That is the real reason setting `color` on `body` does not change your links, and setting `font-family` on a wrapper does not change the text inside a `button`: the user agent stylesheet has its own rule for those elements, and a rule beats an inheritance."
    },
    {
      "t": "p",
      "x": "The fix is to target the element explicitly, or to set the property to `inherit`. Many resets do the second: `button, input, select, textarea { font: inherit; }`."
    },
    {
      "t": "p",
      "x": "Custom properties add a related trap. If `var(--brand)` refers to a property that was never defined and you gave no fallback, the declaration is invalid at computed-value time. It is not dropped at parse time, so devtools shows it as applied, but the property computes to its inherited or initial value instead. The result looks like a rule that won and then did nothing. Always pass a fallback where the variable might be missing: `color: var(--brand, #2563eb)`."
    },
    {
      "t": "h2",
      "x": "Encapsulation: shadow DOM and scoped class names"
    },
    {
      "t": "p",
      "x": "Encapsulation context is sorted before specificity, which is a polite way of saying your page styles do not get into a shadow root at all. Inherited properties cross the boundary, and custom properties cross it, and that is roughly the whole list. To style a web component from outside you need the parts it chose to expose with `::part()`, or a documented set of custom properties. No amount of `!important` will help, because the outer declaration is not in the running."
    },
    {
      "t": "p",
      "x": "Scoped class names from CSS Modules, Vue SFCs or CSS-in-JS produce a milder version of the same confusion. The class in your source file is not the class in the DOM. Before debugging the cascade, copy the actual class name out of the Elements panel and search the emitted stylesheet for it."
    },
    {
      "t": "h2",
      "x": "The order to check things in"
    },
    {
      "t": "ol",
      "items": [
        "Does the element in the DOM carry the class or attribute you are selecting on? Read it from the Elements panel, not from your source.",
        "Is the rule listed in the Styles pane? If not, the selector does not match or the sheet did not load.",
        "Is the declaration struck through with a parse warning? Fix the value. A whole missing rule block usually means a syntax error in the selector.",
        "Open the Computed tab, expand the property, and click through to whatever is listed first. That is the winner, named for you, and it skips all the guessing.",
        "If the winner is in a different layer, fix the layer order rather than the selector.",
        "If the winner ties on specificity, it is source order. Check the built output.",
        "If nothing appears to be winning, look for a transition or animation on that property.",
        "If the property was never set on this element, you are looking at inheritance or a user agent default, not at your rule."
      ]
    },
    {
      "t": "p",
      "x": "The Computed tab step is worth the habit. It answers the actual question, which is not \"what is my rule's specificity\" but \"which declaration won and where does it live\". Everything in this article is a way of understanding that answer once you have it."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module fits which problem, and the sizing traps in both.",
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
          "desc": "The same shape of problem one layer up the stack.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the rule looks right?",
          "a": "Check whether the rule appears in the Styles pane at all. If it is missing, the selector does not match the element or the stylesheet did not load. If it is there but struck through, either the value failed to parse or another declaration won. A syntax error anywhere in a selector discards the entire rule block without any console warning, so a typo in one selector can silently remove several working rules."
        },
        {
          "q": "Does !important always win?",
          "a": "No. An important declaration in a user stylesheet beats an important declaration from the page, which is how accessibility overrides survive. A running CSS transition beats both. And among the page's own important declarations, layer order runs backwards, so an important rule in your first cascade layer beats an important rule in your last one."
        },
        {
          "q": "How do I override a rule without using !important?",
          "a": "Put your styles in a later cascade layer than the rule you are fighting, since layers are compared before specificity. If layers are not an option, add a selector you already control: repeat the class (`.btn.btn`) to gain a column, or qualify with an ancestor. Repeating a class is uglier than a layer but far easier to undo later than `!important`."
        },
        {
          "q": "Do cascade layers beat specificity?",
          "a": "Yes, for normal declarations. Layer order is a higher sorting criterion, so a single class inside a later layer beats an ID selector inside an earlier one. Specificity only breaks ties between declarations in the same layer. Note that styles in no layer at all sort after every named layer, so unmigrated legacy CSS keeps winning until you import it into a layer."
        },
        {
          "q": "What is the specificity of :is() and :where()?",
          "a": "`:where()` is always 0-0-0 and contributes nothing. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, which applies even when the element matched through a cheaper one, so `:is(#app, .card)` counts as an ID selector every time."
        },
        {
          "q": "Why does my style work locally but not after a build?",
          "a": "Almost always source order. When two declarations tie on origin, layer and specificity, the later one in the final output wins, and bundlers decide that order through chunk splitting and import resolution. Inspect the emitted CSS from the production build rather than your source files, and consider cascade layers so the outcome no longer depends on file order."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-17",
  "updated": "2026-09-17",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
