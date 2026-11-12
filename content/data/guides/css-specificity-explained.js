module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "A debugging order for CSS that will not apply: check the match first, then cascade layers, specificity, !important and source order.",
  "standfirst": "Specificity is only one step of the cascade, and it is not the first one. Here is the order browsers actually use, and how to find which step your rule lost at.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important",
    "specificity calculator"
  ],
  "cardDesc": "The real order of the CSS cascade, and a fast way to find which step your rule lost at.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "A rule fails in one of three ways: it never matched, it matched and lost, or it won and the property does nothing on that element. Tell them apart before touching the selector.",
        "Within normal author styles, the browser compares inline styles, then cascade **layers**, then **specificity**, then source order. Layers are decided before specificity ever gets a vote.",
        "Specificity is three counts compared left to right: IDs, then classes/attributes/pseudo-classes, then elements/pseudo-elements. Nothing carries between them.",
        "`!important` does not just add weight. Among important author declarations the layer order runs backwards, and unlayered important styles become the weakest ones.",
        "An inherited value loses to any declaration on the element itself, no matter how specific the ancestor selector was."
      ]
    },
    {
      "t": "h2",
      "x": "First, work out which failure you have"
    },
    {
      "t": "p",
      "x": "**Select the element in DevTools and look for your selector in the Styles pane.** What you see there splits the problem three ways, and each way has a different fix."
    },
    {
      "t": "p",
      "x": "If your selector is not listed at all, it did not match this element, or the stylesheet never reached the browser. No amount of specificity work will help. If the selector is listed with the declaration struck through, it matched and lost the cascade, which is the case the rest of this guide is about. If it is listed and not struck through, your CSS is applying: you are either looking at the wrong element, or the property genuinely has no effect on this box."
    },
    {
      "t": "p",
      "x": "The Computed tab answers the middle case faster than reading rules top to bottom. Expand a property there and the browser lists every declaration that tried to set it, winner first, each linked to its source line. That list is the cascade's own answer, not a reconstruction of it."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does the selector match the element you think it does?\nconst el = document.querySelector('.price');\nel.matches('.card .price');   // false means the selector is the bug\n\n// What actually won?\ngetComputedStyle(el).color;\n\n// Did every stylesheet load? Compare against the Network tab.\n[...document.styleSheets].map(s => s.href);"
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, compared left to right"
    },
    {
      "t": "p",
      "x": "**Count IDs, then classes, then element names, and compare those counts in order.** One ID beats twelve classes, because the first number settles it before the second is even read. Nothing carries. The folklore about 256 classes overflowing into an ID describes browsers that stopped shipping well over a decade ago, and it is not worth planning around."
    },
    {
      "t": "ul",
      "items": [
        "**First number:** ID selectors, such as `#checkout`.",
        "**Second number:** classes (`.btn`), attribute selectors (`[disabled]`, `[data-state='open']`) and pseudo-classes (`:hover`, `:nth-child(2)`).",
        "**Third number:** type selectors (`div`, `a`) and pseudo-elements (`::before`).",
        "**Zero:** the universal selector `*`, every combinator (`>`, `+`, `~` and the descendant space), and anything written inside `:where()`."
      ]
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
          "`.price`",
          "0,1,0",
          "One class"
        ],
        [
          "`h2.title`",
          "0,1,1",
          "One class, one element"
        ],
        [
          "`#main .title`",
          "1,1,0",
          "One ID, one class"
        ],
        [
          "`[data-state='open']`",
          "0,1,0",
          "Attribute selectors count in the class column"
        ],
        [
          "`.btn:not(.ghost)`",
          "0,2,0",
          "`:not()` adds nothing itself; its argument counts"
        ],
        [
          "`:where(.sidebar) .title`",
          "0,1,0",
          "`:where()` always contributes zero"
        ],
        [
          "`:is(h1, #title)`",
          "1,0,0",
          "Takes the most specific argument, even when matching a plain `h1`"
        ],
        [
          "`a:has(> img)`",
          "0,0,2",
          "The `a`, plus `img` as the most specific argument of `:has()`"
        ],
        [
          "`* > .title`",
          "0,1,0",
          "The universal selector and the child combinator are free"
        ],
        [
          "`.price.price`",
          "0,2,0",
          "Repeating a class is legal and doubles its weight"
        ]
      ],
      "caption": "Written as IDs, classes, elements. Compare the columns left to right, like version numbers."
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes are where people get caught. `:is()`, `:not()` and `:has()` contribute nothing on their own but take the specificity of their most specific argument, so one stray ID inside an `:is()` list quietly makes the whole selector a `1,0,0`. Native CSS nesting follows the same rule: `&` behaves as if the parent selector list were wrapped in `:is()`, which means a nested rule inherits the weight of the heaviest parent, not the one you had in mind."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* The element: <span id=\"price\" class=\"price\"> inside <div class=\"card summary\"> */\n\n.price           { color: #111;  }  /* 0,1,0 */\n.card .price     { color: #666;  }  /* 0,2,0, beats the line above */\n.summary .price  { color: green; }  /* 0,2,0 as well, and later, so it wins */\n#price           { color: #c00;  }  /* 1,0,0, beats all of them */"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Inheritance does not compete",
      "x": "`#checkout { color: red }` on an ancestor loses to `span { color: blue }` on the element itself. Inherited values are only used when nothing targets the element directly, so a very specific ancestor selector still loses to a trivial one on the child. If a colour or font is not changing, check whether you are setting it on a parent and expecting it to beat a direct declaration."
    },
    {
      "t": "h2",
      "x": "Cascade layers are settled before specificity"
    },
    {
      "t": "p",
      "x": "**If two declarations sit in different cascade layers, specificity is never consulted.** The browser picks the winning layer and stops. Layers are ordered by where they are first named, later layers win, and anything outside a layer beats everything inside one."
    },
    {
      "t": "p",
      "x": "That last part reverses the instinct most people have. Unlayered styles are not the weakest default. They are the strongest group of normal author declarations, which is what makes `@layer` useful for third party CSS: push the vendor sheet into an early layer and your own unlayered rules win with a single class, no selector arms race required."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, app;              /* fix the order once, up front */\n@import url('vendor.css') layer(vendor);\n\n@layer vendor {\n  #sidebar .btn { background: navy; }    /* 1,1,0 */\n}\n\n@layer app {\n  .btn { background: teal; }             /* 0,1,0, and it wins: app is later */\n}\n\n.btn { background: hotpink; }            /* unlayered, so it beats both layers */"
    },
    {
      "t": "p",
      "x": "Chrome and Firefox both show layer names in the Styles pane, grouped above the rules they contain. If a rule you expected to win is sitting in a layer you did not know existed, that is your answer. Build tools and frameworks emit layers now as well, so read the generated CSS rather than the source before concluding that a utility class lost on specificity."
    },
    {
      "t": "h2",
      "x": "What `!important` actually does"
    },
    {
      "t": "p",
      "x": "**`!important` moves a declaration into a different bucket, and inside that bucket several of the usual comparisons run backwards.** It is not a bigger specificity number. The full order, strongest first:"
    },
    {
      "t": "ol",
      "items": [
        "Declarations from a transition that is currently running.",
        "`!important` user agent styles (browser defaults).",
        "`!important` user styles (an OS or extension stylesheet the reader installed).",
        "`!important` author styles (yours).",
        "Declarations from a running CSS animation.",
        "Normal author styles.",
        "Normal user styles.",
        "Normal user agent styles."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences are worth holding on to. A user's important stylesheet outranks anything you write, which is exactly the point: accessibility overrides are supposed to survive your design system. And a running animation outranks your normal declarations, so a rule that works until an element animates and then stops working is usually a keyframe, not a specificity problem."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Important layer order is reversed",
      "x": "Among important author declarations, the **earliest** layer wins and unlayered important declarations are the weakest of all. This is deliberate. It lets a low level layer assert something that higher layers must respect. It also means `!important` on an unlayered override can lose to `!important` inside a vendor layer, which looks like a browser bug and is not one."
    },
    {
      "t": "p",
      "x": "A few more details. `!important` on a shorthand marks every longhand it expands to, so `background: red !important` locks `background-image` too. The flag affects which declaration wins, never which elements match. And it does nothing about the three failures in the first section: an important declaration in a rule that does not match is still a rule that does not match."
    },
    {
      "t": "p",
      "x": "There are honest uses. Overriding a third party widget whose markup you cannot touch, a genuine utility class that is meant to be final, print stylesheets, and user stylesheets are all reasonable. The cost is that the next person has only one move left, and it is the same move. Reach for layers first and keep `!important` for code you do not control."
    },
    {
      "t": "h2",
      "x": "Winning without `!important`"
    },
    {
      "t": "p",
      "x": "Ordered from least to most damaging, these are the levers that do not burn the escape hatch."
    },
    {
      "t": "ul",
      "items": [
        "**Publish defaults at zero specificity.** Wrapping the ancestor part of a selector in `:where()` makes your base styles trivially overridable. This is the single most useful habit for shared component CSS.",
        "**Move the fight to layers.** Import the library into an earlier layer and the specificity question disappears entirely.",
        "**Fix source order.** Two selectors of equal specificity in the same layer are decided by which comes last in the final bundle, which is decided by your import order, not your file names.",
        "**Repeat a class.** `.price.price` is a documented, legal way to add exactly one step of weight when you cannot change order or layers. Leave a comment saying what it is fighting.",
        "**Match the shape of the selector you are losing to,** rather than adding an ID you will have to live with later."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Zero specificity default: any single class can override this */\n:where(.card) .price { color: #111; }\n\n/* One deliberate step of weight, with the reason recorded */\n.price.price { color: #c00; }  /* beats .card .price from vendor.css */\n\n/* Borrowing specificity on purpose rather than by accident */\n:is(#checkout, .checkout) .price { color: #c00; }  /* 1,1,0 */"
    },
    {
      "t": "h2",
      "x": "When specificity is not the problem at all"
    },
    {
      "t": "p",
      "x": "Plenty of rules that look like cascade failures never entered the cascade. Check these before you start counting selectors."
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** A space where you meant none (`.card .price` instead of `.card.price`), a hashed class name from CSS Modules, or a scoping attribute injected by a framework.",
        "**The value is invalid.** Browsers drop a single bad declaration and keep the rest of the block, so one typo in a `clamp()` can silently remove one line. DevTools marks it with a warning icon.",
        "**A syntax error upstream.** An unclosed brace can swallow the rules that follow it. If a whole run of rules vanished, look above them.",
        "**The property does not apply here.** `width` on a non-replaced inline element, `gap` without flex or grid, `z-index` on a statically positioned box. Our [Grid and Flexbox guide](/guides/css-grid-vs-flexbox/) covers the layout half of this.",
        "**A shorthand later in the file reset your longhand.** `background: #fff` clears `background-image` set above it.",
        "**A media, container or `@supports` query is not matching.** The rule is real and simply inactive.",
        "**The file did not load.** Check the Network tab for a 404 or a stale cached response before anything else."
      ]
    },
    {
      "t": "h2",
      "x": "A checking order that stays fast"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element",
          "x": "Select it in the Elements panel, then prove the selector matches it from the console. This takes five seconds and rules out most typos.",
          "code": "$0.matches('.card .price')"
        },
        {
          "title": "Confirm the CSS arrived",
          "x": "Network tab, filter to CSS, look for 404s and for a cached response older than your last deploy. A hard reload here is cheaper than an hour of selector work."
        },
        {
          "title": "Read the Computed tab, not the Styles pane",
          "x": "Expand the property in question. The browser lists every competing declaration in its own winning order, with source links. Whatever is at the top is what you are actually fighting."
        },
        {
          "title": "Check layers before specificity",
          "x": "If the winner sits in a different layer, specificity is irrelevant and changing your selector will not help. Fix the layer order instead."
        },
        {
          "title": "Only then compare the three numbers",
          "x": "Count IDs, classes and elements for both selectors. If they tie, the later one in the bundle wins, so check the build output order rather than the source tree."
        },
        {
          "title": "Write the smallest fix, and comment it",
          "x": "A doubled class or a `:where()` wrapper with a one line comment is maintainable. An `!important` with no comment is a question someone will have to answer again in six months."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which module to reach for, and the details that prevent overflow and alignment bugs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "React useState Not Updating",
          "desc": "Five causes of state that looks one render behind, in the same debugging-order style.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        },
        {
          "title": "HTTP Status Codes",
          "desc": "Useful when a stylesheet returns 304 or 404 and you need to read the Network tab precisely.",
          "href": "/guides/http-status-codes-explained/",
          "eyebrow": "Reference"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Does !important override inline styles?",
          "a": "An `!important` declaration in a stylesheet beats a normal inline `style` attribute, yes. That is the common case and it is reliable. Inline `!important` against stylesheet `!important` is a genuine corner of the spec, and rather than trusting a half-remembered rule, test it in the browsers you support before you build anything on the answer. Better still, avoid arriving there: if you are writing `!important` on both sides, the real fix is cascade layers."
        },
        {
          "q": "Do 256 classes beat one ID in CSS?",
          "a": "No. The three specificity counts are compared left to right and nothing carries from one column to the next, so a single ID outranks any number of classes. The overflow behaviour people remember came from old browser implementations that packed the counts into small integers, and it is not something current engines do."
        },
        {
          "q": "Why is my CSS not working even though DevTools shows the rule?",
          "a": "If the declaration is struck through, something won the cascade: open the Computed tab and read the top entry. If it is not struck through, the CSS is applying and the problem is elsewhere. The usual culprits are a property that does nothing on that element (`gap` with no flex or grid container, `width` on an inline element), an inherited value you expected to win over a direct declaration, or a different element than the one you inspected."
        },
        {
          "q": "How do I override a third party stylesheet without !important?",
          "a": "Import it into a cascade layer: `@layer vendor; @import url('vendor.css') layer(vendor);`. Your own unlayered rules then win regardless of how many IDs the vendor used, because the layer comparison happens before specificity. If you cannot control the import, the next cheapest option is repeating a class in your selector, which adds exactly one step of weight and is easy to explain in a comment."
        },
        {
          "q": "Does the order of my CSS files matter?",
          "a": "Yes, for any tie. Two declarations with the same importance, the same layer and the same specificity are decided by which appears last in the final stylesheet. In a bundled app that order comes from your import graph, not from file names or directory layout, so check the built output rather than the source tree when a tie is behaving unexpectedly."
        },
        {
          "q": "What specificity do :is(), :where() and :has() have?",
          "a": "`:where()` always contributes zero, which makes it the right tool for publishing defaults that others can override. `:is()` and `:has()` contribute the specificity of their most specific argument, so `:is(.a, #b)` counts as `1,0,0` even when it matched the `.a` branch. `:not()` works the same way. Keep IDs out of `:is()` argument lists unless you want that weight everywhere the selector is used."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-12",
  "updated": "2026-11-12",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
