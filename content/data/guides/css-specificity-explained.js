module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers, and the rule that will not apply",
  "eyebrow": "Troubleshooting",
  "description": "Your declaration is losing to something else. Work out what: specificity tuples, cascade layers, inline styles, and where !important really sits.",
  "standfirst": "A checklist for finding out which part of the cascade beat your declaration, and how to fix it without starting a specificity war.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "!important css",
    "css specificity calculator"
  ],
  "cardDesc": "Specificity tuples, cascade layers, inline styles and !important, in the order the browser actually applies them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before touching specificity, find out whether the declaration reached the element at all. Struck through in DevTools means it lost the cascade. Absent from the Styles pane means the selector never matched, or the value was invalid and the parser threw the declaration away.",
        "Specificity is a three-part tuple compared left to right: IDs, then classes/attributes/pseudo-classes, then element types and pseudo-elements. It is not a sum. Two hundred classes still lose to one ID.",
        "Cascade layers outrank specificity entirely. A bare `a` selector in a later layer beats `#sidebar .nav a` in an earlier one, and unlayered styles beat every layered style.",
        "`!important` inverts both layer order and origin order. Important declarations in the *first* layer win, and unlayered important declarations lose to layered ones.",
        "`:where()` costs zero specificity. It is the cleanest way to ship defaults that other people can override with a single class."
      ]
    },
    {
      "t": "lede",
      "x": "A CSS rule that is not applying has failed one of four tests: the selector never matched the element, the declaration was invalid and got dropped, something else beat it in the cascade, or you are styling a property on a parent that does not inherit. Only the third is about specificity, and it is the one everyone reaches for first. Work through them in order and you will write far fewer `!important` flags."
    },
    {
      "t": "h2",
      "x": "First, find out which failure you have"
    },
    {
      "t": "p",
      "x": "Open the element inspector and look at the Styles pane. Browsers list every rule that matched the selected element, in cascade order, winner at the top. Losing declarations are struck through. That single visual distinction splits your problem in half: struck through means a cascade fight you lost, and missing entirely means the rule never matched in the first place."
    },
    {
      "t": "p",
      "x": "If the property appears nowhere, check the value. CSS error handling is per declaration: `margin-inline: 2rm` is dropped silently while every other declaration in the block survives, so the rule looks fine in the file and simply does nothing on screen. Firefox flags invalid declarations with a warning triangle, which is often faster than squinting at the source. The Computed pane is the other half of the answer. It shows the final resolved value for every property and, when you expand it, the rule that supplied it. If Computed says `display: block` and you wrote `display: flex`, you now know exactly which selector to argue with."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "One bad selector can take out an entire rule",
      "x": "In a comma-separated selector list, a single selector the browser does not understand invalidates the whole list, not just that one entry. Write `.card, :has(.badge), .panel` in a browser without `:has()` support and `.card` and `.panel` stop being styled too. `:is()` and `:where()` use forgiving parsing, so unknown selectors inside their arguments are ignored rather than fatal."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Every selector gets a tuple of three numbers, conventionally written A,B,C. A counts ID selectors. B counts classes, attribute selectors and pseudo-classes. C counts element types and pseudo-elements. Comparison runs left to right and stops at the first difference. There is no carrying and no base, which is why the old habit of calling `#id` \"100 points\" gives the right answer for the wrong reason and eventually gives the wrong answer too."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "A,B,C",
        "Notes"
      ],
      "rows": [
        [
          "`*`, `>`, `+`, `~`",
          "0,0,0",
          "The universal selector and combinators contribute nothing"
        ],
        [
          "`li`, `::before`",
          "0,0,1",
          "Element types and pseudo-elements"
        ],
        [
          "`.card`, `[type='text']`, `:hover`",
          "0,1,0",
          "Classes, attributes and pseudo-classes all sit in the same column"
        ],
        [
          "`#checkout`",
          "1,0,0",
          "IDs"
        ],
        [
          "`:where(...)`",
          "0,0,0",
          "Always zero, whatever is inside it"
        ],
        [
          "`:is(...)`, `:not(...)`, `:has(...)`",
          "most specific argument",
          "The pseudo-class itself adds nothing; its argument does"
        ],
        [
          "`style=\"...\"`",
          "n/a",
          "Element-attached styles are sorted before specificity is consulted, so they beat every selector"
        ]
      ],
      "caption": "Specificity components. Compared left to right, never summed."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,0,1  */  a { color: blue; }\n/* 0,1,1  */  a.external { color: teal; }\n/* 0,2,1  */  .prose a.external { color: green; }\n/* 1,0,1  */  #main a { color: red; }        /* wins over all of the above */\n/* 0,9,0  */  .a.b.c.d.e.f.g.h.i { color: pink; }  /* still loses to #main a */"
    },
    {
      "t": "p",
      "x": "The last line is the part people find counterintuitive. Nine classes produce 0,9,0. One ID produces 1,0,0. The comparison hits the A column first, finds 1 against 0, and stops. Nothing you stack in the B column can ever climb into the A column. This is the reason mature codebases avoid styling by ID: an ID in a stylesheet is a ceiling, and the only ways past it are another ID, an inline style, or `!important`."
    },
    {
      "t": "h2",
      "x": "The selectors that change the arithmetic"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` take the specificity of their most specific argument. `:where()` is permanently zero. That pairing is genuinely useful rather than trivia, because it lets you decide how hard your own CSS is to override."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1,1,0 : the #app inside :is() counts */\n:is(#app, .app) .title { font-size: 1.5rem; }\n\n/* 0,1,0 : :where() zeroes the same argument list */\n:where(#app, .app) .title { font-size: 1.5rem; }\n\n/* 0,1,0 : :not() is free, .promo is not */\nbutton:not(.promo) { background: #eee; }"
    },
    {
      "t": "p",
      "x": "If you are writing a component library or a base stylesheet, wrap the scoping part of your selectors in `:where()`. Consumers can then override you with one plain class instead of reverse-engineering your nesting depth. If you are writing application code that genuinely needs to win, `:is()` does the same grouping job while keeping the weight."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Native nesting inherits :is() behaviour",
      "x": "In native CSS nesting, the `&` reference and implicit nesting behave like `:is()` of the parent selector list. Nest a rule under `#app, .app` and the child inherits 1,0,0 whether or not the element ever matches `#app`. If nested rules are winning fights you did not expect them to, this is usually why."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the question being asked"
    },
    {
      "t": "p",
      "x": "Layers sit above specificity in the sort order. Once two declarations are in different layers, the browser picks the winner by layer and never looks at the selectors. This is the single biggest change to practical CSS debugging in years, and it breaks the mental model most of us built in the 2010s."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declaring the order up front is the whole trick.\n   Later layers win for normal declarations. */\n@layer reset, base, components, utilities;\n\n@layer base {\n  #sidebar .nav a { color: red; }   /* 1,1,1 */\n}\n\n@layer components {\n  a { color: blue; }               /* 0,0,1 */\n}\n\n/* Unlayered styles beat every layer, regardless of specificity. */\na { color: rebeccapurple; }"
    },
    {
      "t": "p",
      "x": "Links come out `rebeccapurple`. Remove the unlayered rule and they are blue, because `components` is declared after `base` and layer order decides it before specificity gets a vote. Unlayered normal declarations beating all layered ones is deliberate: it means adding layers to an existing codebase does not silently demote the CSS you already had."
    },
    {
      "t": "p",
      "x": "The most valuable use of layers is defusing third-party CSS you cannot edit. Import it into a low layer and its `!important`-free selectors stop mattering, however heavy they are."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer vendor, app;\n\n@import url('some-widget.css') layer(vendor);\n\n@layer app {\n  .widget-button { background: var(--brand); }   /* wins on layer order alone */\n}"
    },
    {
      "t": "p",
      "x": "Cascade layers have been supported in all the major evergreen browsers since 2022. Check caniuse.com for the exact versions that matter to your support matrix rather than trusting a number in an article, including this one. There is no graceful degradation worth relying on: a browser that does not understand `@layer` ignores the at-rule and the styles inside it, so the failure mode is unstyled rather than mis-styled."
    },
    {
      "t": "h2",
      "x": "Where !important actually sits"
    },
    {
      "t": "p",
      "x": "`!important` is not a specificity booster. It moves the declaration into a different bucket in the origin-and-importance step, which is the very first comparison the cascade makes. From weakest to strongest, the ladder runs:"
    },
    {
      "t": "ol",
      "items": [
        "User-agent normal declarations (the browser's own defaults)",
        "User normal declarations (a user stylesheet or an accessibility extension)",
        "Author normal declarations (yours)",
        "CSS animation declarations, while an animation is running",
        "Author `!important`",
        "User `!important`",
        "User-agent `!important`",
        "CSS transition declarations, while a transition is running"
      ]
    },
    {
      "t": "p",
      "x": "Two consequences fall out of that list. A user's important declaration beats your important declaration, which is how accessibility overrides such as forced high-contrast modes are able to work at all. And a running transition outranks everything, which is why a value can look correct in the Styles pane while the rendered pixels disagree for a few hundred milliseconds."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Important declarations reverse layer order",
      "x": "For normal declarations, later layers win and unlayered wins over everything. For important declarations, it flips: earlier layers win, and unlayered important declarations lose to layered ones. A `!important` in your `reset` layer outranks an `!important` in `utilities`. This is consistent once you see the intent, which is that the layer closest to the foundation gets the final say when someone escalates."
    },
    {
      "t": "p",
      "x": "There are legitimate uses. Overriding an inline style written by a third-party widget you do not control requires `!important`, because nothing else outranks element-attached styles. Print stylesheets and user stylesheets are reasonable places for it too. Inside your own application code it is usually a symptom, and each one raises the cost of the next override. If you write one, put a comment next to it naming the exact rule it exists to defeat, so the person who deletes that rule in eighteen months knows the flag can go with it."
    },
    {
      "t": "p",
      "x": "One quiet exception: `!important` inside `@keyframes` is ignored. Declarations in a keyframe block that carry the flag are dropped rather than promoted, which catches people trying to force a value mid-animation."
    },
    {
      "t": "h2",
      "x": "Fixes, in order of preference"
    },
    {
      "t": "ol",
      "items": [
        "Move the styles into the right layer. If you already use layers, the answer is nearly always layer order, not selector weight.",
        "Lower the specificity of whatever is beating you instead of raising yours. Wrapping a scoping selector in `:where()` is a one-line change that ends the arms race permanently.",
        "Match specificity exactly and rely on source order. Later wins, and the resulting selectors stay readable.",
        "Add a class to the element rather than nesting another level deeper. `.card--compact` is easier to find in six months than `.page .content .card > div:first-child`.",
        "Use `revert-layer`, `revert` or `unset` to undo a declaration rather than fighting it with a competing value. `all: revert-layer` on a component root is a clean way to shed inherited defaults.",
        "Only then reach for `!important`, with a comment explaining what it overrides."
      ]
    },
    {
      "t": "h2",
      "x": "Things that look like specificity but are not"
    },
    {
      "t": "ul",
      "items": [
        "**Inheritance.** `color` and `font-family` inherit. `border`, `padding` and `background` do not. Setting a non-inherited property on a parent and expecting the child to pick it up is a different bug with the same symptom.",
        "**Shorthands clobbering longhands.** `background: red` later in the file resets `background-image` to `none`. The struck-through property in DevTools will be the longhand, and the winner will be a shorthand that does not mention it by name.",
        "**Media and support queries add nothing.** `@media (min-width: 40em) { a { color: red } }` is still 0,0,1. If a desktop override is losing to a mobile rule with a class, the breakpoint is not the reason.",
        "**Custom properties resolve per element.** A `var()` reference picks up whatever value is in effect on *that* element. A low-specificity rule setting `--brand` on `:root` can still be the one supplying the value, because nothing more specific ever set it on the element you are inspecting.",
        "**Shadow DOM encapsulation.** Styles inside a shadow tree and styles outside it are compared by context before specificity. Outer page styles generally lose to inner ones for normal declarations, and the flag flips that too.",
        "**The stylesheet did not load.** Check the Network tab for a 404 before you spend an afternoon on tuples. It happens more often than anyone admits."
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
          "title": "Confirm the element is the one you think it is",
          "x": "Select it in the inspector rather than reasoning from the source. Frameworks add wrapper elements, and the class you wrote may be on a parent of the box you are looking at."
        },
        {
          "title": "Look for the property in the Computed pane",
          "x": "Expand it to see the winning rule and its file and line. This answers \"what beat me\" in one click, without reading the Styles list top to bottom."
        },
        {
          "title": "Decide: never matched, or lost the fight",
          "x": "Not in the Styles pane at all means a selector or parse problem. Present but struck through means a cascade problem. These have almost no overlap in their fixes."
        },
        {
          "title": "For a cascade problem, check layer before specificity",
          "code": "/* In the console, on the selected element: */\ngetComputedStyle($0).color;\n\n/* And to see every rule the browser matched, in order: */\ngetMatchedCSSRules; /* removed from browsers; use the Styles pane instead */"
        },
        {
          "title": "Fix at the lowest level that works",
          "x": "Layer order, then `:where()`, then an equal-specificity rule placed later, then a new class. Escalating to `!important` should feel like a decision, not a reflex."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the right layout module, and the sizing gotchas that make items overflow.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA before you ship the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of bug one layer up: the value is right in the source and wrong on screen.",
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
          "a": "Check whether the rule appears in the element's Styles pane at all. If it does not, the selector did not match, the stylesheet did not load, or a sibling selector in the same comma-separated list was invalid and killed the whole rule. If it does appear but is struck through, something beat it: a later layer, an unlayered rule, a higher specificity, an inline style, or an important declaration."
        },
        {
          "q": "Does one ID really beat a hundred classes?",
          "a": "Yes. Specificity is a tuple compared column by column, not a score. The ID column is checked first, and a difference there ends the comparison. The folklore about 256 classes overflowing into an ID comes from old engines that packed the components into a fixed number of bits; current engines compare the numbers directly."
        },
        {
          "q": "How do I override a third-party stylesheet without !important?",
          "a": "Import it into a cascade layer: @import url('vendor.css') layer(vendor), then declare @layer vendor, app so your own layer comes later. Layer order is decided before specificity, so your single-class rules win over their deeply nested ones. This does not help against their !important declarations or their inline styles, which still need the flag."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They group selectors identically and both use forgiving parsing. The only difference is weight: :is() takes the specificity of its most specific argument, while :where() is always zero. Use :where() when you want your rule to be easy to override, and :is() when you want it to hold its ground."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes. Element-attached styles are sorted before specificity but after origin and importance, so an author !important declaration in a stylesheet beats a plain style attribute. An inline style that itself carries !important beats your stylesheet's important declaration, and only a user or user-agent important declaration goes higher."
        },
        {
          "q": "Should I add cascade layers to an existing project?",
          "a": "You can do it incrementally, because unlayered styles outrank all layered ones for normal declarations. Move your reset and vendor CSS into low layers first and leave application styles unlayered; nothing changes behaviour on day one. The risk is in !important declarations, which reverse layer order, so audit those before moving anything that has them."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-18",
  "updated": "2026-09-18",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
