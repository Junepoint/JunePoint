module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity: Why Your Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Troubleshooting",
  "description": "Why a CSS rule does not apply: how to tell a selector miss from a cascade loss, how specificity is really counted, and how layers and !important change it.",
  "standfirst": "Four different things can stop a rule from applying, and only one of them is specificity. Here is the order to check them in, and what cascade layers changed about the answer.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "override important css",
    "css specificity calculator"
  ],
  "cardDesc": "Diagnose a rule that will not apply: selector misses, invalid values, specificity, layers and !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check whether the rule matched at all before you touch specificity. If your declaration is missing from the Styles pane entirely, rather than struck through, it is a selector or syntax bug.",
        "Specificity is three counters compared left to right: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. There is no carrying. A thousand classes lose to one ID.",
        "Cascade layers sit **above** specificity. A plain `li` selector in a later layer beats an ID selector in an earlier one, and unlayered styles beat every layer.",
        "`!important` reverses layer order. The earliest layer wins, and an unlayered `!important` declaration loses to every layered one.",
        "An inherited value always loses to any declaration that matches the element directly, no matter how weak that selector looks. This is why setting `color` on `body` does not recolor your links.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, and so does the `&` in native nesting."
      ]
    },
    {
      "t": "lede",
      "x": "\"My CSS is not applying\" is four separate bugs wearing the same hat. The selector never matched, the declaration was thrown away as invalid, the property does not do anything on that element, or another declaration won the cascade. Only the last one is a specificity problem, and it is the one people reach for first. Checking in the right order turns most of these into a two-minute fix."
    },
    {
      "t": "h2",
      "x": "Work through the four causes in order"
    },
    {
      "t": "ol",
      "items": [
        "**The selector did not match.** Select the element in devtools and look for your declaration in the Styles pane. If it is not listed at all, not even with a line through it, no rule matched this element. Read the class attribute on the live element rather than in your source: CSS Modules, styled-components and Vue scoped styles all rewrite or suffix class names at build time, so `.card` in your file may be `.card_x7f2a` in the DOM.",
        "**The declaration was invalid and got dropped.** `width: 100` with no unit and `color: #ggg` are discarded silently during parsing. So is everything following an unclosed brace or an unterminated comment, which is why one typo can appear to break the bottom half of a stylesheet. One malformed selector in a comma-separated list invalidates the entire list, so `h1, h2:foo, h3 { color: red }` styles nothing at all.",
        "**The property does not apply to that element.** `width` and `height` do nothing on an inline non-replaced element. `gap` needs a flex, grid or multi-column container. `top` needs a `position` other than `static`. `align-items` on a block container is inert. The value computes correctly and has no visible effect, which looks exactly like being overridden until you check.",
        "**Something else won the cascade.** Now specificity is worth measuring, but note where it ranks: it is the fifth tiebreak, not the first."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The Computed pane answers this faster than the Styles pane",
      "x": "In Chrome or Edge devtools, open **Computed**, tick *Show all*, filter for the property, and expand it. You get the value that actually won plus a link to the exact rule and line that set it. If the property shows its initial or inherited value and your rule is not in the expanded list, you have cause 1, 2 or 3 rather than a cascade conflict. Firefox shows the same thing in its Computed tab, and marks rules that matched but lost."
    },
    {
      "t": "h2",
      "x": "What the cascade compares, and in what order"
    },
    {
      "t": "p",
      "x": "The cascade runs through a fixed sequence of tiebreaks. Each step only gets consulted if the previous one came out level, so a difference at step 3 makes steps 4 and 5 irrelevant. Working from strongest to weakest:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Important user agent styles beat important user styles, which beat important author styles, which beat animations, which beat normal author styles, which beat normal user agent styles. Your stylesheet is the author origin. The browser's defaults are the user agent origin, and they lose to anything you write unless they are marked important, which for a handful of accessibility-related defaults they are.",
        "**Context.** For normal declarations, styles from the outer document beat styles defined inside a shadow tree. For important declarations the order flips and the inner tree wins.",
        "**Element-attached styles.** A normal declaration in a `style` attribute beats every normal declaration from a stylesheet, whatever the selector. This is the step inline styles win at, not a specificity score of 1000.",
        "**Layer order.** Later layers beat earlier layers for normal declarations. Unlayered styles behave as a final, highest-priority layer.",
        "**Specificity.** The three counters, compared left to right.",
        "**Order of appearance.** Last one in document order wins. For two stylesheets, that means the order of your `link` tags or the order your bundler concatenated them."
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Transitions and animations do not play by these rules",
      "x": "A declaration from a running transition outranks everything, including `!important`. Animation declarations from an active `@keyframes` rule sit between normal author styles and important author styles, so a normal rule cannot override an animating property but an important one can. And `!important` inside a `@keyframes` block is ignored outright. If a value flickers or snaps back under your control, check whether a transition or animation owns it."
    },
    {
      "t": "h2",
      "x": "Counting specificity correctly"
    },
    {
      "t": "p",
      "x": "Specificity is a triple, usually written as (A, B, C) or 0-1-0. A counts ID selectors. B counts class selectors, attribute selectors and pseudo-classes. C counts element type selectors and pseudo-elements. Comparison is lexicographic: compare A, and only if the A values are equal do you look at B."
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
          "`*`, `>`, `+`, `~`",
          "0-0-0",
          "The universal selector and all combinators contribute nothing"
        ],
        [
          "`li`, `::before`",
          "0-0-1",
          "Pseudo-elements count at the same level as element types"
        ],
        [
          "`.card`, `[type='text']`, `:hover`, `:nth-child(2)`",
          "0-1-0",
          "Attribute selectors and pseudo-classes rank with classes"
        ],
        [
          "`#main`",
          "1-0-0",
          "An ID selector in any position"
        ],
        [
          "`.a.b.c`",
          "0-3-0",
          "Compounds add up within a category"
        ],
        [
          "`#main .card li`",
          "1-1-1",
          "Descendant combinators add nothing of their own"
        ],
        [
          "`:where(#main, .card)`",
          "0-0-0",
          "Always zero, regardless of its arguments"
        ],
        [
          "`:is(#main, p)`",
          "1-0-0",
          "Takes its most specific argument, even if a weaker one matched"
        ],
        [
          "`:not(.a)`",
          "0-1-0",
          "The argument counts; `:not` itself does not"
        ],
        [
          "`[id='main']`",
          "0-1-0",
          "The same element, matched at class strength"
        ]
      ],
      "caption": "The `[id='x']` row is the practical escape hatch for overriding ID selectors in CSS you do not own."
    },
    {
      "t": "p",
      "x": "The last row is genuinely useful. If a vendor stylesheet ships `#widget .label { color: #999 }` and you cannot edit it, `[id='widget'] .label` matches exactly the same elements at 0-2-0 instead of 1-1-0. It still loses, because 1 beats 0 in the A column, so you then add a class and stay at the same order of magnitude instead of escalating to `!important`."
    },
    {
      "t": "p",
      "x": "Which brings up the thing people get wrong most often. Specificity is not a base-ten number."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1-0-0 */\n#app { color: red; }\n\n/* 0-11-0, and it still loses */\n.a.b.c.d.e.f.g.h.i.j.k { color: blue; }\n\n/* 0-1-0 beats 0-0-6, because the B column is compared first */\n.title { font-weight: 400; }\nbody main article section h2 span { font-weight: 700; }"
    },
    {
      "t": "p",
      "x": "There is no carrying between columns. Eleven classes do not roll over into an ID. Older rendering engines had counter overflow bugs somewhere around 256 selectors in one category, which is where the \"specificity is base 256\" folklore comes from, but current engines compare per category and relying on overflow was never a plan."
    },
    {
      "t": "h3",
      "x": "The nesting trap"
    },
    {
      "t": "p",
      "x": "Native CSS nesting desugars the parent reference to `:is(...)` of the whole parent selector list, so the specificity of `&` is that of the *most specific* selector in the list. One ID anywhere in a comma-separated parent raises the specificity of every nested rule inside it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-2-0 : :is(.card) .title */\n.card {\n  .title { color: red; }\n}\n\n/* 1-1-0 : :is(.card, #promo) .title */\n.card, #promo {\n  .title { color: blue; }\n}\n\n/* Every .card .title is now blue, including cards nowhere near #promo. */"
    },
    {
      "t": "p",
      "x": "This bites hardest when someone adds an ID to an existing selector list months later and a dozen nested rules silently gain an ID's worth of weight. If you want the grouping without the weight, wrap the list in `:where()` yourself: `:where(.card, #promo) { .title { ... } }` keeps the nested rule at 0-1-0."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the part that invalidates a lot of older advice, and it has been available in Chrome, Edge, Firefox and Safari since early 2022. Verify against your own support matrix, but for most projects it is no longer the risky choice. Layers add a tiebreak that runs *before* specificity, which means specificity only decides between rules in the same layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. This line decides everything. */\n@layer reset, vendor, base, components, utilities;\n\n@layer components {\n  #hero .title { font-size: 2rem; }   /* 1-1-0 */\n}\n\n@layer utilities {\n  .text-sm { font-size: 0.875rem; }   /* 0-1-0, and it wins */\n}\n\n/* Not in any layer, so it beats both of the above. */\n.title { font-size: 1rem; }"
    },
    {
      "t": "p",
      "x": "That last rule is the detail that surprises people. Unlayered normal declarations are treated as the final, highest-priority layer, so sprinkling a few loose rules at the end of a layered codebase gives them authority over everything. Sometimes that is what you want. More often it means a stray unlayered file is quietly overriding your utility layer, and the fix is to put it in a layer rather than to add weight to the loser."
    },
    {
      "t": "p",
      "x": "Two practical notes. The `@layer reset, vendor, base, components, utilities;` statement at the top of your entry file is what fixes the order, so declare it before any imports and keep it in one place. And `revert-layer` lets a declaration roll back to whatever the previous layer computed, which is a cleaner undo than guessing at an initial value."
    },
    {
      "t": "h2",
      "x": "!important, and what to reach for instead"
    },
    {
      "t": "p",
      "x": "Marking a declaration `!important` moves it into a different importance bucket, where it is compared only against other important declarations. Inside that bucket, layer order runs backwards."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .alert { color: red !important; }      /* wins: earliest layer */\n}\n\n@layer overrides {\n  .alert { color: blue !important; }\n}\n\n.alert { color: green !important; }      /* loses to both: unlayered */"
    },
    {
      "t": "p",
      "x": "Red wins. For important declarations the implicit unlayered group has the *lowest* priority, and the first layer declared has the highest. This is deliberate: it lets a reset layer lock down a value that nothing downstream can casually reclaim. It also means the reflex of adding `!important` to the end of your stylesheet can leave you weaker than you were, which is a confusing afternoon if you do not know about the reversal."
    },
    {
      "t": "p",
      "x": "Before using it, try these in order:"
    },
    {
      "t": "ul",
      "items": [
        "**Put the third-party CSS in an earlier layer.** `@import url('vendor.css') layer(vendor);` takes a whole stylesheet out of the specificity argument. Your own layers then beat it regardless of how many IDs it uses.",
        "**Neutralize their selectors with `:where()`.** If you control the library's source or can re-author a few selectors, `:where(#widget) .label` is 0-0-0 and anything you write beats it.",
        "**Add the smallest amount of specificity that works.** One extra class, or the `[id='x']` form, rather than an ID or a long descendant chain. Long chains are brittle because they encode document structure you will later change.",
        "**Use `revert-layer` or `revert`** when you want to undo rather than override, so you inherit the previous layer's or the browser's value instead of hard-coding a guess.",
        "**Keep `!important` for the two honest cases:** overriding an inline style you cannot remove (common with third-party widgets and some CMS output), and utility classes whose entire job is to win."
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "What actually beats an !important you cannot edit",
      "x": "Within the author origin, only another important declaration with higher precedence: an important declaration in an earlier layer, in a `style` attribute, or with higher specificity in the same layer. An important declaration in a user stylesheet or a browser extension beats all author important styles, and a running transition beats everything. If you are fighting an `!important` in minified vendor CSS, moving that file into a layer with `@import ... layer()` is almost always less painful than an escalation war."
    },
    {
      "t": "h2",
      "x": "Inheritance is not the cascade"
    },
    {
      "t": "p",
      "x": "An element only inherits a property if no declaration in the cascade set that property on the element itself. Inheritance is the fallback after the cascade produces nothing, so it loses to every matching declaration, including a 0-0-1 one from the browser's own stylesheet."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "body { color: #c026d3; }   /* 0-0-1, and your links ignore it */\n\n/* The user agent stylesheet already matches the <a> directly,\n   roughly: a:-webkit-any-link { color: -webkit-link; }\n   Inherited magenta never gets a chance, so you must target the link. */\na { color: inherit; }      /* or set an explicit link color */"
    },
    {
      "t": "p",
      "x": "The same mechanism explains form controls that refuse your font, headings that keep their own margins, and `button` elements that stay grey. Nothing is overriding you in the sense you assume. The browser set the property directly, and your ancestor rule was never in the running. `font: inherit` on form controls and `color: inherit` on links are the usual answers, which is most of what a CSS reset does."
    },
    {
      "t": "h2",
      "x": "Utility frameworks and third-party CSS"
    },
    {
      "t": "p",
      "x": "Utility-first CSS deliberately flattens specificity: every utility is a single class, so two conflicting utilities on the same element are decided by their order in the generated stylesheet, which you do not write. Tailwind 4 emits real `@layer` rules and sorts utilities by property, so `p-4 p-2` does not resolve by the order you typed the class names. Check the version in your project, because Tailwind 3 processed its layer directives at build time and stripped them from the output, meaning the cascade behavior differs between the two."
    },
    {
      "t": "p",
      "x": "When a utility is losing, the culprit is usually a component stylesheet in a later layer, or an unlayered global file. Look at which layer each rule came from in devtools before adding the framework's important modifier. If you do need the hammer, scoping it is better than globalizing it, and `@scope` is starting to offer a cleaner alternative to specificity games, though support is still uneven enough that you should check before depending on it."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A reproducible way to settle any argument",
      "x": "Make a minimal copy. Two selectors, one property, one element, in a scratch HTML file. Nine times out of ten the conflict you were debugging disappears, which tells you the real cause was a build-order or selector-matching problem rather than specificity. The tenth time you have a clean test case you can reason about in thirty seconds."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model to pick, and why some properties quietly do nothing.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a color pair against WCAG AA and AAA once the right rule finally wins.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState not updating",
          "desc": "The same category of bug in another layer of the stack: your change applied, just not where you looked.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check whether the rule matched before you assume it was overridden. Select the element in devtools: if your declaration is not in the Styles pane at all, the selector did not match or the declaration was dropped as invalid. Common causes are a build-time rewritten class name, a missing unit, an unclosed brace earlier in the file, and one bad selector invalidating a whole comma-separated list. If the declaration is there and struck through, then it is a cascade conflict and specificity is worth measuring."
        },
        {
          "q": "Do multiple classes ever beat an ID in CSS?",
          "a": "No. Specificity is three counters compared left to right, and ID selectors occupy the first. Eleven classes are 0-11-0 and one ID is 1-0-0, so the ID wins with no contest. There is no carrying between columns. To beat an ID selector without `!important`, add an ID of your own, rewrite the opposing selector as `[id='name']` so it drops to class level, or put the stylesheet containing it into an earlier cascade layer."
        },
        {
          "q": "How do I override an !important I cannot edit?",
          "a": "You need another important declaration that outranks it. In the same layer, that means higher specificity. Across layers, an important declaration in an earlier layer wins, which is why `@import url('vendor.css') layer(vendor);` is usually the cleanest fix: it puts the vendor rules in a layer you declared first, so your own important rules in later layers beat them. An important declaration in a `style` attribute beats any stylesheet rule in the author origin."
        },
        {
          "q": "Is !important ever acceptable?",
          "a": "Yes, in two situations. Utility classes whose explicit purpose is to win, and overriding an inline style you cannot remove, which is common with embedded third-party widgets. What it should not be is a response to losing a specificity contest in your own CSS, because the next person's fix is a second `!important` and you have moved the whole argument up one level without resolving it."
        },
        {
          "q": "Why do cascade layers beat a more specific selector?",
          "a": "Because layer order is compared before specificity, not after. The cascade checks origin and importance, then context, then inline styles, then layer order, and only reaches specificity when two declarations are level on all of those. So a single class in a later layer beats an ID selector in an earlier layer, and an unlayered rule beats both, since unlayered normal declarations behave as the highest-priority layer. For important declarations the layer order reverses and the earliest layer wins."
        },
        {
          "q": "Why doesn't the color I set on body apply to my links?",
          "a": "Because the browser's own stylesheet sets `color` on anchor elements directly, and a declaration that matches the element always beats an inherited value, however specific the ancestor rule. Inheritance is the fallback when nothing matched, not a weak competitor in the cascade. Set `color: inherit` on `a`, or give links their own explicit color. The same thing explains form controls ignoring your font family, which `font: inherit` fixes."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-09",
  "updated": "2026-11-09",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
