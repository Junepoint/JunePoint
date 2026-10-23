module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Troubleshooting",
  "description": "Why a CSS rule does not apply: how specificity is really counted, where cascade layers and the style attribute outrank it, and safer options than !important.",
  "standfirst": "Specificity is the famous answer and often the wrong one. Here is the order a browser actually resolves declarations in, and what to check at each step.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Specificity, cascade layers and !important, in the order the browser really checks them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers compared left to right: IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements. Ten classes still lose to one ID.",
        "Specificity is nearly the *last* tiebreak. Origin, importance, encapsulation context, the `style` attribute and cascade layers are all decided before it.",
        "In a sheet that uses `@layer`, layer order beats specificity, so a single-class utility can override a `#id .class` rule. For `!important` declarations the layer order is reversed.",
        "A large share of \"my rule is not applying\" reports are not cascade problems at all: a declaration dropped as invalid, a selector that never matched, a property that does not inherit, or a stylesheet that never loaded.",
        "`:where()` contributes zero specificity and is the clean way to write defaults you intend to be overridden. Try `revert-layer` or `all: revert` before reaching for `!important`."
      ]
    },
    {
      "t": "h2",
      "x": "First, rule out everything that is not the cascade"
    },
    {
      "t": "p",
      "x": "Open devtools, select the element, and look for your rule in the Styles pane. That single observation splits the problem in two. If the rule is listed but struck through, the cascade is overriding it and the rest of this page applies. If the rule is not listed at all, the selector never matched this element and specificity has nothing to do with it. People skip this check constantly and then spend twenty minutes stacking classes onto a selector that was misspelled."
    },
    {
      "t": "p",
      "x": "When the rule is missing, or present but having no visible effect, the cause is usually one of these:"
    },
    {
      "t": "ul",
      "items": [
        "**The declaration was invalid and got discarded.** CSS error handling is silent by design: the parser throws away a declaration it cannot understand and carries on. `margin: 10 px` and `color: #ff00` are both dropped without a console error. Devtools flags them with a warning icon, which is easy to miss.",
        "**A later shorthand overwrote the longhand.** `background: #fff` after `background-image: url(hero.jpg)` erases the image, because the shorthand resets every component it covers to its initial value.",
        "**The property does not apply to that box.** `width` and `height` are ignored on a non-replaced inline element. Vertical padding on one paints but does not push the surrounding lines apart. Many flex and grid properties do nothing unless the parent actually has `display: flex` or `display: grid`.",
        "**The property is not inherited.** `color`, `font-family` and `line-height` flow down to children. `border`, `padding` and `background` do not. Styling a wrapper and expecting the child to pick it up only works for the inherited set.",
        "**The DOM does not have the class you wrote.** Build-time scoping rewrites selectors: CSS Modules hashes them, Vue `scoped` appends a data attribute, Angular's emulated encapsulation does something similar. The authored file and the shipped page legitimately disagree, so trust the Elements panel over your editor.",
        "**The stylesheet never arrived.** A 404, a blocked cross-origin request, a wrong MIME type or a stale service worker cache all produce a page where your rule simply does not exist. The Network tab settles it in seconds.",
        "**A condition is false.** `@media`, `@supports` and `@container` blocks are invisible in the Styles pane when they do not match, which looks identical to a rule that was never written.",
        "**A shadow boundary is in the way.** A page-level selector cannot reach inside a shadow root. You need custom properties, `::part()` or `:host` styles from inside the component."
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Silence is the normal behaviour",
      "x": "CSS has no exceptions. An unknown property, an unparseable value or a malformed selector is skipped and the next declaration is read. That resilience is why a browser from 2015 can still render a page using features from 2026, and it is also why a typo produces no error anywhere except the devtools styling panes."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,1)  one type selector */\nli { color: red; }\n\n/* (0,1,0)  one class */\n.item { color: blue; }\n\n/* (0,2,2)  two classes, two types */\nnav.primary li.item { color: green; }\n\n/* (1,0,0)  one ID outranks all of the above */\n#sidebar { color: rebeccapurple; }\n\n/* (0,11,0) eleven classes still lose to #sidebar */\n.a.b.c.d.e.f.g.h.i.j.k { color: hotpink; }\n\n/* (0,0,0)  :where() zeroes out whatever is inside it */\n:where(#sidebar, .item) { color: orange; }\n\n/* (1,0,0)  :is() takes its most specific argument */\n:is(#sidebar, .item) { color: teal; }\n\n/* (0,1,1)  :not() does the same; the colon itself counts for nothing */\na:not(.external) { color: maroon; }"
    },
    {
      "t": "p",
      "x": "The three components are compared independently, left to right, and the first difference decides it. There is no carrying between columns, which is why that eleven-class selector loses: `(0,11,0)` versus `(1,0,0)` is settled in the first column and the other numbers are never read. The old folklore about ten classes rolling over into an ID came from base-10 implementations in very old browsers and has not been true in anything shipping for many years."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Contributes",
        "Notes"
      ],
      "rows": [
        [
          "`*`, `>`, `+`, `~`",
          "(0,0,0)",
          "The universal selector and combinators are free. `.a > .b` and `.a .b` have identical specificity."
        ],
        [
          "`div`, `::before`",
          "(0,0,1)",
          "Type selectors and pseudo-elements sit in the third column."
        ],
        [
          "`.card`, `[type=\"text\"]`, `:hover`",
          "(0,1,0)",
          "Classes, attribute selectors and ordinary pseudo-classes all count the same."
        ],
        [
          "`#main`",
          "(1,0,0)",
          "One ID dominates any quantity of the two columns to its right."
        ],
        [
          "`:where(...)`",
          "(0,0,0)",
          "Always zero, no matter how specific its arguments are."
        ],
        [
          "`:is(...)`, `:not(...)`, `:has(...)`",
          "most specific argument",
          "`:is(h1, #title)` counts as `(1,0,0)` even when it matched the `h1`."
        ],
        [
          "`&` in nesting",
          "most specific in parent list",
          "`&` behaves like `:is()` over the parent selector list, which makes nested specificity jump unexpectedly."
        ],
        [
          "`style=\"...\"`",
          "outranks every selector",
          "Not part of the tuple at all. It is sorted at an earlier step."
        ],
        [
          "`!important`",
          "moves the declaration to another group",
          "Not a specificity bonus. It changes which bucket the declaration competes in."
        ]
      ],
      "caption": "Specificity components, written as (IDs, classes, types). Verify any single case against a specificity calculator rather than counting in your head."
    },
    {
      "t": "h2",
      "x": "The cascade checks these things in order"
    },
    {
      "t": "p",
      "x": "Specificity only gets consulted when everything above it ties. The browser works down this list and stops at the first step that produces a winner:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author styles, user styles and browser defaults, split by whether the declaration is `!important`.",
        "**Encapsulation context.** Which shadow tree the declaration came from. Normal declarations from the inner tree win; important ones from the outer tree win.",
        "**Element-attached styles.** A declaration in the `style` attribute beats one from a stylesheet of the same importance.",
        "**Cascade layers.** Layer order, which the author controls explicitly.",
        "**Specificity.** The three-number comparison above.",
        "**Order of appearance.** Last one in the document wins. This is the only step most people remember correctly."
      ]
    },
    {
      "t": "p",
      "x": "Importance is worth spelling out, because `!important` does not mean \"wins\". Ranked from strongest to weakest, the browser prefers: a running transition, then important browser defaults, then important user styles, then important author styles, then declarations from a running animation, then normal author styles, then normal user styles, then normal browser defaults. Two consequences follow. An author `!important` cannot be beaten by any other author declaration except an inline `!important`, which is sorted earlier at step three. And a transition or animation outranks your normal rules entirely, which is the usual explanation for an element that keeps snapping back to a value you did not write."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "An element whose style you cannot change at all",
      "x": "If a value refuses to budge regardless of what you add, check for a running CSS animation or transition on that property, and check for an inline `style` being set by script on every frame. Both sit above normal author CSS in the list, and neither shows up as a rule you can override in the Styles pane."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity, and invert under !important"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, at the top. Later layers win. */\n@layer reset, vendor, components, utilities;\n\n@layer components {\n  #card .title { font-size: 1.5rem; }   /* (1,1,0) */\n}\n\n@layer utilities {\n  .text-sm { font-size: 0.875rem; }     /* (0,1,0) and it wins */\n}\n\n/* Not in any layer: beats every layer for normal declarations. */\n.title { font-size: 2rem; }             /* this wins over both */"
    },
    {
      "t": "p",
      "x": "Layers are the reason a utility class can reliably beat a component rule that is far more specific. Because layer order is checked before specificity, a one-class selector in a later layer defeats an ID-plus-class selector in an earlier one. Unlayered styles behave as if they were an implicit final layer, so anything you write outside `@layer` sits above all of your layers. That is a useful escape hatch and also a common accident: a stray unlayered rule in a late-loaded file quietly outranks a carefully ordered layer stack."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layer order reverses for !important",
      "x": "For important declarations the layer precedence is flipped. An `!important` in the *earliest* layer beats an `!important` in a later one, and unlayered important declarations are the weakest of the author important group rather than the strongest. If `!important` in your utilities layer stopped working after someone added `!important` to the reset layer, this is why."
    },
    {
      "t": "p",
      "x": "Cascade layers have been supported across Chrome, Edge, Firefox and Safari since early 2022, so they are safe for most projects as of October 2026. Check caniuse against your own support matrix before committing, especially if you still ship to embedded or locked-down browsers. Several frameworks now emit native layers themselves, Tailwind CSS v4 among them, which means you may already be inside a layered document without having written an `@layer` rule. Confirm by looking for `@layer` in the shipped CSS rather than assuming either way."
    },
    {
      "t": "h2",
      "x": "Write selectors that are easy to override later"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Hard to live with: (1,1,1), so every override needs an ID too */\n#app .card h2 { margin-block-end: 0; }\n\n/* Matches exactly the same elements at (0,0,1) */\n:where(#app .card) h2 { margin-block-end: 0; }\n\n/* Nesting inherits the parent's most specific selector */\n.card, #promo {\n  & .title { color: black; }   /* (1,1,0), because of #promo */\n}\n\n/* Keep it flat by zeroing the parent list */\n:where(.card, #promo) {\n  & .title { color: black; }   /* (0,0,0) plus .title => (0,1,0) */\n}"
    },
    {
      "t": "p",
      "x": "Most specificity pain is self-inflicted and arrives months later, when someone needs to change one component on one page. Two habits prevent nearly all of it. Keep IDs out of your stylesheets and use them for fragment links and script hooks instead, since an ID in a selector forces every future override into the first column. And wrap structural context in `:where()` so the selector still describes where a rule applies without charging you specificity for the description. The trade-off is real: low-specificity rules are easier to override, including by accident, so source order and layer order carry more of the weight. That is a better problem to have than an unoverridable rule."
    },
    {
      "t": "h2",
      "x": "When !important is defensible, and how to undo one"
    },
    {
      "t": "p",
      "x": "There are legitimate uses. Overriding a third-party widget whose styles you cannot edit, a print stylesheet that must flatten everything, an accessibility utility such as a forced-visible focus ring, or a user stylesheet where `!important` is the designed mechanism. What makes it corrosive is using it to win an argument inside your own codebase, because the next person has only two moves: another `!important` later in the file, or an inline style. Both make the sheet worse."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Roll a property back to what the previous layer said */\n.card { background: revert-layer; }\n\n/* Roll everything back to the browser default, ignoring author styles */\n.reset-me { all: revert; }\n\n/* Unset per property: inherited props inherit, the rest go initial */\n.card { border-color: unset; }"
    },
    {
      "t": "p",
      "x": "To beat someone else's `!important` without adding your own, raise the step rather than the specificity. Put your rule in a layer that wins, or move the declaration into the `style` attribute, or if the value was set by a running animation, cancel the animation instead of fighting its output. `revert-layer` is the surgical option when a later layer needs to defer to an earlier one for a single property."
    },
    {
      "t": "h2",
      "x": "Reading the Styles pane like a cascade trace"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Read top to bottom, because the pane is already sorted",
          "x": "Devtools lists matching rules in winning order, strongest first. A property with a line through it lost; the surviving copy of that property is above it."
        },
        {
          "title": "Use the Computed pane to find the winner",
          "x": "Expand the property in Computed and it shows which rule supplied the final value, with a link to the source line. This is faster than scanning the Styles pane when a dozen rules match."
        },
        {
          "title": "Check whether the rule is in a layer",
          "x": "Current Chrome and Firefox builds annotate layered rules with the layer name. The exact placement of that label moves between versions, so look for it in your own browser rather than trusting a screenshot from a blog post."
        },
        {
          "title": "Toggle the checkbox off and watch",
          "x": "Disabling the winning declaration reveals the next contender immediately. Repeating that a few times tells you the real precedence chain without any counting."
        },
        {
          "title": "If the rule is absent, search the DOM instead of the CSS",
          "x": "Copy the selector into the console with `document.querySelectorAll()`. Zero results means the selector is the bug. Results that do not include your element means the element is the bug.",
          "code": "document.querySelectorAll('#app .card h2').length"
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Picking the right layout model, and the sizing traps in each.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Verify a color pair against WCAG AA and AAA before shipping it.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "Diagnose and fix CORS errors",
          "desc": "For the case where the stylesheet or font never loaded in the first place.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check whether the rule appears in the devtools Styles pane at all. If it is absent, the selector did not match, so look for a typo, a build-time scoping rewrite, a false `@media` condition, or a stylesheet that returned 404. If it is present but struck through, something outranked it: another declaration with higher specificity, a later layer, an inline style, an `!important`, or a running animation or transition."
        },
        {
          "q": "Do 11 classes beat 1 ID in CSS?",
          "a": "No. Specificity is three separate numbers compared left to right with no carrying, so `(0,11,0)` loses to `(1,0,0)` on the first comparison. The idea that classes roll over into an ID came from base-10 implementations in long-obsolete browsers."
        },
        {
          "q": "How do I override an !important without using !important?",
          "a": "Win at an earlier step in the cascade instead of trying to out-specify it. Move your declaration into a cascade layer that takes precedence, put it in the element's `style` attribute, or if a transition or animation is producing the value, stop the animation. `revert-layer` on the property is the tidy option when an earlier layer already had the value you want."
        },
        {
          "q": "Does an inline style beat !important?",
          "a": "It depends which is which. A normal inline style loses to an `!important` in a stylesheet, because importance is compared before element-attached styles. An `!important` inside a `style` attribute beats an `!important` in a stylesheet, because within the same importance group the inline declaration is sorted first."
        },
        {
          "q": "What order do cascade layers apply in?",
          "a": "Layers apply in the order they are first declared, with later layers winning for normal declarations. Declare the full order up front with a single statement such as `@layer reset, components, utilities;` so it does not depend on import order. Unlayered styles act as an implicit final layer and beat all named layers. For `!important` declarations the whole order is reversed, and unlayered important styles become the weakest rather than the strongest."
        },
        {
          "q": "Is it bad practice to use IDs in CSS selectors?",
          "a": "It is rarely worth the cost. An ID in a selector pins every future override to the first specificity column, which pushes the next person toward `!important`. Use IDs for fragment links, label associations and script hooks, and style with classes. When you genuinely need an ID in a selector for matching reasons, wrap it in `:where()` so it matches without contributing specificity."
        },
        {
          "q": "Does :has() raise specificity?",
          "a": "Yes. `:has()` takes the specificity of its most specific argument, the same as `:is()` and `:not()`. So `.card:has(#promo)` counts as `(1,1,0)` even though the element matched is the `.card`. Wrap the argument in `:where()` if you want the match without the weight."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-23",
  "updated": "2026-10-23",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
