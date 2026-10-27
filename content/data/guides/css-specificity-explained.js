module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity and the Cascade: Why Rules Lose",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Troubleshooting",
  "description": "Your selector looks right and the style still does not stick. How specificity is counted, where cascade layers and !important sit, and what to check first.",
  "standfirst": "Specificity is one of seven things the cascade checks, and it is often not the thing that beat you. Here is the order the browser really uses, and how to read it in DevTools.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "How specificity is counted, where cascade layers and !important fit, and the non-specificity reasons a rule loses.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Open the Styles panel before you change anything. A declaration with a line through it lost the cascade. A rule that is absent entirely never matched.",
        "Specificity is three numbers, not one: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. Columns never carry, so twenty classes still lose to a single ID.",
        "Cascade layers are checked *before* specificity. One class in a later layer beats an ID selector in an earlier layer, and unlayered styles beat every layer.",
        "`!important` reverses layer order. An important declaration in your first layer outranks an important declaration in your last one, which surprises nearly everyone the first time they hit it.",
        "Many failures are not cascade failures at all: a declaration dropped at parse time, a property that does not apply to that element, a stylesheet that never loaded."
      ]
    },
    {
      "t": "lede",
      "x": "A rule that does not apply has failed in one of two ways. Either the browser never matched the selector, or it matched and then lost. Those two look identical in your editor and completely different in DevTools, so find out which one you have before you start adding weight to selectors."
    },
    {
      "t": "h2",
      "x": "Decide which failure you have"
    },
    {
      "t": "p",
      "x": "The Styles panel lists every rule that matched the selected element, in the order the browser resolved them. Winning declarations render plain. Losing ones are struck through. If the rule you are hunting for is not in that list at all, specificity is beside the point: the selector did not match this element, or the file is not on the page."
    },
    {
      "t": "p",
      "x": "The Computed panel answers the other half of the question. Expand a property and it names the rule that won, with a link to the file and line. Go there first. It tells you what you are actually competing with rather than what you assume you are competing with, and those are different things more often than not."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does the selector match anything at all?\ndocument.querySelectorAll('.card > .title').length;   // 0 means the selector is wrong\n\n// What did the element actually end up with?\nconst el = document.querySelector('.title');\ngetComputedStyle(el).color;\n\n// Did something set it inline, after your stylesheet loaded?\nel.getAttribute('style');\n\n// Which stylesheets are really on the page?\n[...document.styleSheets].map(s => s.href);"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Inspect the DOM you shipped, not the one you wrote",
      "x": "Elements that only exist after hydration, and class names added by a framework at runtime, mean the DOM in the inspector can differ from your template. Select the element and read its real class list before you trust your selector."
    },
    {
      "t": "h2",
      "x": "The declaration may never have been parsed"
    },
    {
      "t": "p",
      "x": "CSS error handling is silent by design. An unknown property or an invalid value makes the browser discard that single declaration and keep the rest of the block. Nothing appears in the console. The file looks fine in your editor, and in DevTools the declaration shows up struck through with a warning icon rather than missing, which is a useful signal once you know to look for it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Each bad declaration is dropped on its own. The others still apply. */\n.btn {\n  colr: red;          /* unknown property */\n  width: 100;         /* number with no unit */\n  background: #ggg;   /* not a valid color */\n  padding: 1rem;      /* this one works */\n}\n\n/* Dropped entirely: one bad selector invalidates the whole list. */\n.btn, .btn:hoverr {\n  color: red;\n}\n\n/* Survives: :is() is forgiving and ignores the branch it cannot parse. */\n.btn, :is(.btn:hoverr) {\n  color: red;\n}"
    },
    {
      "t": "p",
      "x": "The middle case is the one that eats an afternoon. A selector list is all or nothing. If any selector in a comma-separated list fails to parse, the browser throws away the entire rule, including the branches that were perfectly valid. That is how adding one experimental `:has()` branch to a grouped selector can silently delete styling you wrote months ago. Wrapping the risky branch in `:is()` makes the list forgiving, though it changes the specificity of that branch, which is the subject of the next two sections."
    },
    {
      "t": "h2",
      "x": "How specificity is counted"
    },
    {
      "t": "p",
      "x": "Every selector gets three counts, conventionally written `1-2-1`. IDs go in the first column. Classes, attribute selectors and pseudo-classes go in the second. Element types and pseudo-elements go in the third. The browser compares left to right, and the first column that differs decides the winner outright."
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
          "`*`, `>`, `+`, `~`",
          "0-0-0",
          "The universal selector and all combinators count for nothing."
        ],
        [
          "`li`",
          "0-0-1",
          "One element type."
        ],
        [
          "`li::marker`",
          "0-0-2",
          "Pseudo-elements count in the type column."
        ],
        [
          "`.nav`",
          "0-1-0",
          "One class."
        ],
        [
          "`[aria-current=\"page\"]`",
          "0-1-0",
          "Attribute selectors rank as classes."
        ],
        [
          "`:hover`",
          "0-1-0",
          "Most pseudo-classes rank as classes."
        ],
        [
          "`#main .nav li`",
          "1-1-1",
          "One of each column."
        ],
        [
          "`:where(#main) li`",
          "0-0-1",
          "`:where()` zeroes everything inside it."
        ],
        [
          "`style=\"color: red\"`",
          "not applicable",
          "An inline declaration is a separate, higher step in the cascade, not a specificity value."
        ]
      ],
      "caption": "Specificity reads IDs-classes-types. Columns are compared independently."
    },
    {
      "t": "p",
      "x": "Nothing carries between columns. Eleven classes do not add up to an ID. A thousand element selectors do not add up to one class. This is why the folk advice to just add another class until it works fails unpredictably, and why stylesheets built on ID selectors accumulate `!important` around their edges over time."
    },
    {
      "t": "h2",
      "x": "`:is()`, `:where()`, `:not()` and the `&` in nested CSS"
    },
    {
      "t": "p",
      "x": "These are the only tools that let you set specificity deliberately rather than as a side effect of how you happened to write the selector. Learn what each one contributes and most specificity fights stop happening."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* :is() takes the specificity of its MOST specific argument */\n:is(h1, #title) a { color: red; }      /* 1-0-1 */\n\n/* :where() always contributes zero, whatever is inside it */\n:where(h1, #title) a { color: blue; }  /* 0-0-1, so it loses above */\n\n/* :not() is counted the same way as :is() */\np:not(.lead, #hero) { color: red; }    /* 1-0-1, because of #hero */\n\n/* In nested CSS, & carries the whole parent selector list */\n#app, .card {\n  & .title { color: red; }             /* 1-1-0 for both branches, */\n}                                      /* not 0-2-0 for the .card one */"
    },
    {
      "t": "p",
      "x": "Reach for `:where()` when you are writing defaults that other people should be able to override. Everything inside it contributes nothing, so a consumer can win with a single plain class and no escalation. `:is()` is the opposite trade: convenient for grouping, and it quietly imports the weight of the heaviest thing in the list. Native nesting has the same sharp edge, because `&` is defined as having the specificity of `:is()` applied to the entire parent selector list. Put one ID in that list and every nested rule inside inherits an ID's worth of weight."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "Layers changed the shape of this problem. A layer is an explicit precedence bucket, and layer order is compared before specificity ever comes up. A weak selector in a later layer beats a strong selector in an earlier one, by design."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;   /* declaring the order up front is the clearest way */\n\n@layer base {\n  #app .btn { background: gray; }       /* 1-1-0 */\n}\n\n@layer theme {\n  .btn { background: rebeccapurple; }   /* 0-1-0, and this is what you see */\n}\n\n.btn { background: white; }             /* unlayered: beats every layer */"
    },
    {
      "t": "p",
      "x": "Unlayered styles sit above all layers for normal declarations. That is the useful part: drop a third-party stylesheet into a low-priority layer, leave your own CSS unlayered, and ordinary class selectors are suddenly enough to override whatever the vendor did with ID selectors."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer vendor, app;                          /* order is fixed here */\n@import url(\"vendor/bootstrap.css\") layer(vendor);\n\n@layer app {\n  .btn { padding: 0.5rem 1rem; }             /* one class now wins */\n}\n\n/* Hand a single property back to the layer underneath */\n.btn:disabled { background: revert-layer; }"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Check what your bundler does to @import",
      "x": "Several build tools inline `@import` statements rather than leaving them for the browser, and the `layer()` function can be lost or reordered in the process. Verify in the shipped CSS, not the source, before you rely on layer order for a vendor override."
    },
    {
      "t": "p",
      "x": "Then there is the part that catches people. For important declarations, layer precedence runs backwards."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base  { .btn { color: red   !important; } }\n@layer theme { .btn { color: blue  !important; } }\n.btn         { color: green !important; }   /* unlayered */\n\n/* Computed color: red.\n   For important declarations the layer order is reversed, and\n   unlayered important declarations rank lowest, not highest. */"
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "An important reset layer is very hard to get out of",
      "x": "If a reset or normalize layer declared first uses `!important`, it outranks the important declarations in every layer you add afterwards, for the lifetime of the project. Keep `!important` out of layered CSS unless the whole team understands the reversal."
    },
    {
      "t": "h2",
      "x": "The order the browser actually uses"
    },
    {
      "t": "p",
      "x": "Specificity is the fifth of seven sort criteria. The browser works down this list and stops at the first one that separates two declarations."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Transition declarations beat everything. Then important declarations from the browser, then the user, then you. Then running animations. Then normal author styles, then normal user styles, then browser defaults.",
        "**Context.** Shadow DOM encapsulation. For an element both the page and a shadow tree can style, normal declarations from the outer context win, and important declarations from the inner context do.",
        "**Element-attached styles.** A declaration in a `style` attribute outranks your stylesheets at the same importance. An important inline declaration is effectively the end of the road for author CSS, which is why a drag or chart library that writes inline styles can feel unbeatable.",
        "**Cascade layers.** Declared order for normal declarations, reversed for important ones, as above.",
        "**Specificity.** The three columns.",
        "**Scope proximity.** With `@scope`, the rule whose scope root sits nearer the element wins a tie at equal specificity. Support is newer and uneven, so check current browser support before depending on it.",
        "**Order of appearance.** The last matching declaration wins. This is the final tiebreak, not the first."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences are worth holding on to. Order of appearance only decides things when everything above it ties, so moving a rule to the bottom of the file is not a general fix. And `!important` is not a specificity bonus. It moves the declaration into a different band of criterion one, which is why it beats an ID selector written after it, and why two important declarations then fall back to layers and specificity between themselves."
    },
    {
      "t": "h2",
      "x": "Failures that are not about the cascade at all"
    },
    {
      "t": "p",
      "x": "Before you accept a specificity explanation, rule these out. Each of them produces a rule that looks correct, matches the element, and changes nothing."
    },
    {
      "t": "ul",
      "items": [
        "**The property does not inherit.** `padding`, `border` and `display` apply where you set them. Padding on a wrapper will never pad the child. `color` and `font-family` do inherit, which is why those cases feel inconsistent.",
        "**The property does not apply to that element.** `width` and `height` are ignored on a non-replaced inline element. `gap` does nothing unless the container is flex, grid or multi-column. `z-index` does nothing on `position: static`. See [CSS Grid vs. Flexbox](/guides/css-grid-vs-flexbox/) for which properties belong to which layout model.",
        "**A shorthand wiped it.** `background: url(hero.png)` after `background-color: red` resets the color to its initial value. `font` resets `line-height`. `all: unset` resets everything on the element.",
        "**The stylesheet never loaded, or a stale build did.** Check `document.styleSheets` and the Network panel. Hashed class names from CSS Modules or a scoped-style compiler also drift out of sync with hand-written selectors.",
        "**A media, container or supports query did not match.** The rule exists in the file and never appears in the Styles panel, which reads exactly like a selector that did not match.",
        "**An animation or transition owns the value.** Animations outrank normal author declarations while they run, and `animation-fill-mode: forwards` makes that permanent.",
        "**`:visited` is restricted.** Browsers honor only a short list of properties on visited links, for privacy reasons. Layout and most other changes there are ignored without comment.",
        "**Link pseudo-class order.** `:link`, `:visited`, `:hover`, `:active` all carry the same specificity, so writing `:hover` before `:link` means the hover style loses on order alone.",
        "**JavaScript is rewriting the inline style.** A `style` prop that recomputes on every render will overwrite your CSS on each state change. If the value flickers back, suspect this. Stale values in a React render pass have their own set of causes, covered in [useState not updating](/guides/react-usestate-not-updating/)."
      ]
    },
    {
      "t": "h2",
      "x": "Fixing it without starting an arms race"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "One line in the console settles it. A count of zero means you have a selector or a DOM problem, and no amount of cascade work will help.",
          "code": "document.querySelectorAll('.card > .title').length"
        },
        {
          "title": "Read the Computed panel",
          "x": "Find out which rule actually won and where it lives. Guessing at this step is what produces stylesheets with three competing overrides for the same property."
        },
        {
          "title": "Lower the winner rather than raising the loser",
          "x": "Wrap the overbearing selector in `:where()`, drop its ID selector, or move it into a lower layer. Reducing specificity is a change the next person can reason about. Escalating is a change they will have to escalate past."
        },
        {
          "title": "Put CSS you do not control into a layer",
          "x": "Everything you did not write goes in a low-priority layer, and your own styles stay unlayered or in a layer declared after it. Most vendor override pain disappears at this point.",
          "code": "@layer vendor, app;\n@import url(\"vendor/bootstrap.css\") layer(vendor);"
        },
        {
          "title": "Keep `!important` for the cases it was designed for",
          "x": "Overriding an inline style written by code you do not control, user stylesheets, and accessibility overrides such as forced reduced motion. Everything else is a cascade you can restructure instead."
        }
      ]
    },
    {
      "t": "p",
      "x": "One habit pays for itself. When you catch yourself writing a third selector to beat the second, stop and look at the first. A specificity fight is almost always a sign that two parts of the codebase disagree about who owns a property, and layers exist to make that ownership explicit instead of implicit in selector weight."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model fits the problem, and which properties only work inside each one.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA before you ship the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "When the value you render is one step behind, and inline styles keep snapping back.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three likely reasons. Something else is also using `!important` and winning on layer order or specificity between the two. The value is being set as an inline style with `!important`, which author stylesheets cannot beat. Or the declaration is invalid or does not apply to that element, in which case `!important` changes nothing because the declaration was never in the running. Check the Styles panel: if your important declaration is struck through, you lost a competition; if it has a warning icon, it was never parsed."
        },
        {
          "q": "Do ten classes beat one ID in CSS?",
          "a": "No. The three specificity columns are compared independently and never carry into each other, so `.a.b.c.d.e.f.g.h.i.j` at `0-10-0` loses to `#main` at `1-0-0`. If you are counting classes to try to win, restructure instead: remove the ID from the competing selector, wrap it in `:where()`, or separate the two rules into cascade layers."
        },
        {
          "q": "How do I override an inline style?",
          "a": "An `!important` declaration in a stylesheet overrides a normal inline style, because importance is sorted before the element-attached step. An inline style that itself uses `!important` cannot be overridden from an author stylesheet at all. The fix there is to stop the code that writes it, or remove the attribute with JavaScript, which usually means finding the library option that disables its inline styling."
        },
        {
          "q": "What is the specificity of :is(), :where() and :not()?",
          "a": "`:where()` always contributes `0-0-0`, no matter what is inside it. `:is()` and `:not()` take the specificity of their most specific argument, so `:not(#hero)` counts as a full ID. The pseudo-class itself adds nothing in either case. In nested CSS, `&` behaves like `:is()` wrapped around the entire parent selector list."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations. Layer order is compared before specificity, so a `0-1-0` selector in a later layer beats a `1-0-0` selector in an earlier one. Unlayered styles rank above every layer. This is the mechanism that makes third-party CSS manageable without an override cascade of your own."
        },
        {
          "q": "Why does my !important in the last cascade layer lose?",
          "a": "Because layer precedence is reversed for important declarations. Important declarations in the first declared layer outrank important declarations in later layers, and important declarations outside any layer rank lowest of the three. It is consistent once you see it as the same reversal that puts important author styles above normal ones, but it is the single most surprising rule in the modern cascade."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-27",
  "updated": "2026-10-27",
  "author": "jackson",
  "related": []
};
