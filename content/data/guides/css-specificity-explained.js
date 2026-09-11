module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Isn't Applying",
  "h1": "CSS specificity, cascade layers and !important",
  "eyebrow": "CSS",
  "description": "Work out why a CSS rule loses: parse errors, the six cascade steps, specificity as three separate counters, @layer ordering and !important.",
  "standfirst": "A rule that does not apply has lost at one of six steps, and only one of them is specificity. This walks through them in the order the browser uses them.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "css cascade order"
  ],
  "cardDesc": "Find out why a CSS rule loses, from parse errors to @layer ordering, and fix it without an !important war.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Most \"my CSS is not applying\" bugs never reach the cascade. The selector does not match, the declaration failed to parse, or a later rule quietly overwrote it.",
        "The browser compares origin and importance, then context, then inline styles, then cascade layers, then specificity, then source order. Specificity is the fifth tiebreaker.",
        "Specificity is three counters (IDs, classes, elements) compared left to right. Ten classes never beat one ID.",
        "`@layer` moves the argument out of specificity. A single class in a later layer beats an ID selector in an earlier one.",
        "`!important` reverses layer order, so an important declaration in your *first* layer beats one in your last."
      ]
    },
    {
      "t": "h2",
      "x": "Rule out the boring causes first"
    },
    {
      "t": "p",
      "x": "**Before counting IDs and classes, confirm the browser ever saw the rule.** Open the Styles panel in devtools with the element selected. A declaration that lost the cascade is shown struck through, with the winner above it. A rule that is missing from the panel entirely did not match the element, or never parsed."
    },
    {
      "t": "p",
      "x": "Those are two different bugs and they need different fixes. Here is what causes each."
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** A typo, a class applied to the wrong node, or a CSS Modules build that hashed `.title` into `.title_a3f9c`. Check with `document.querySelectorAll()` in the console.",
        "**The declaration was invalid and got dropped.** CSS discards bad declarations one at a time. `width: 100` with no unit vanishes; the rest of the block still applies. This is why a block can be half working.",
        "**The selector list was invalid and the whole rule got dropped.** One unrecognised pseudo-class in a comma-separated list kills every selector in that list. `:is()` and `:where()` are forgiving and will survive an unknown argument, which is a real reason to use them.",
        "**A condition is false.** An `@media` or `@supports` block that does not match, or a `@container` query with no container to query.",
        "**The file is not there.** A 404 on the stylesheet, a stale build, a cached bundle. The Network panel settles this in seconds.",
        "**A boundary is in the way.** Styles in the main document do not cross into shadow DOM except through inherited properties, custom properties and `::part()`."
      ]
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// With the element selected in the Elements panel, $0 is that element.\n\n// 1. Does anything match the selector you wrote?\ndocument.querySelectorAll('.card > .title').length   // 0 means the selector is wrong\n\n// 2. What did the element actually compute?\ngetComputedStyle($0).color        // 'rgb(0, 0, 0)'\ngetComputedStyle($0).marginTop    // '0px'\n\n// 3. Is a script setting an inline style behind your back?\n$0.getAttribute('style')"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The shorthand trap",
      "x": "A shorthand resets every longhand it covers, including ones you did not mention. `background: url(paper.png)` after `background-color: white` puts the colour back to transparent. The same applies to `font`, `border`, `grid-area`, `flex` and `inset`. Source order, not specificity, decides this one."
    },
    {
      "t": "h2",
      "x": "The cascade order, in the order it runs"
    },
    {
      "t": "p",
      "x": "When two declarations both set the same property on the same element, the browser works through a fixed list of comparisons and stops at the first one that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Where the declaration came from, and whether it is marked `!important`.",
        "**Context.** Whether the declaration comes from the shadow tree or the outer document.",
        "**Element-attached styles.** The `style` attribute beats rules from stylesheets.",
        "**Cascade layers.** Layer order, which you control with `@layer`.",
        "**Specificity.** The three counters.",
        "**Order of appearance.** The last one in the document wins."
      ]
    },
    {
      "t": "p",
      "x": "Read that list again and notice how much happens before specificity. If your rule is losing and you cannot see why, the answer is often in steps one to four, and no amount of adding classes to the selector will help."
    },
    {
      "t": "p",
      "x": "Step one deserves a closer look, because `!important` does not simply mean \"win\". It moves a declaration to a different rung of this ladder, lowest priority first:"
    },
    {
      "t": "ol",
      "items": [
        "Normal declarations from the browser's own stylesheet",
        "Normal declarations from the user's stylesheet",
        "Normal declarations from your stylesheet",
        "Declarations in a running CSS animation",
        "`!important` declarations from your stylesheet",
        "`!important` declarations from the user's stylesheet",
        "`!important` declarations from the browser's stylesheet",
        "Declarations in a running CSS transition"
      ]
    },
    {
      "t": "p",
      "x": "Two things fall out of that. User `!important` outranks author `!important`, which is how browser accessibility settings and user styles are able to force a font size on a page that fights them. And a property currently being animated by a transition beats everything, which explains the classic report that a colour \"only applies after half a second\"."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "**Specificity is a triple, written here as (A, B, C), compared left to right with no carrying.** A is the number of ID selectors. B counts classes, attribute selectors and pseudo-classes. C counts element types and pseudo-elements. The universal selector `*` and combinators like `>` contribute nothing."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "(A, B, C)",
        "Notes"
      ],
      "rows": [
        [
          "`*`",
          "0, 0, 0",
          "The universal selector never adds weight"
        ],
        [
          "`li`",
          "0, 0, 1",
          "One element type"
        ],
        [
          "`li::marker`",
          "0, 0, 2",
          "Pseudo-elements count in column C"
        ],
        [
          "`.nav li`",
          "0, 1, 1",
          "One class, one type"
        ],
        [
          "`input[type=\"text\"]`",
          "0, 1, 1",
          "Attribute selectors count as classes"
        ],
        [
          "`a:hover`",
          "0, 1, 1",
          "Pseudo-classes count as classes"
        ],
        [
          "`#main`",
          "1, 0, 0",
          "Beats any number of classes"
        ],
        [
          "`#main .nav a:hover`",
          "1, 2, 1",
          "One ID, two class-level, one type"
        ],
        [
          "`:where(#main) a`",
          "0, 0, 1",
          "`:where()` always contributes zero"
        ],
        [
          "`:is(#main, .nav) a`",
          "1, 0, 1",
          "Takes its most specific argument"
        ],
        [
          "`a:not(.external)`",
          "0, 1, 1",
          "`:not()` also uses its most specific argument"
        ]
      ],
      "caption": "Common selectors and what they weigh. Compare left to right and stop at the first difference."
    },
    {
      "t": "p",
      "x": "No carrying is the part that trips people up. A selector with eleven classes is (0, 11, 0), and it loses to `#main` at (1, 0, 0), because column A is compared first and 0 is less than 1. Adding a twelfth class will not help. Adding an ID would, and that is how specificity wars start."
    },
    {
      "t": "h3",
      "x": ":is(), :where(), :not() and :has()"
    },
    {
      "t": "p",
      "x": "These four take their specificity from their most specific argument, with one exception: `:where()` is always zero. That makes `:where()` the right tool for defaults in a design system or a library, because consumers can override them with a plain class."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (1, 1, 0) - the #app inside :is() counts in full */\n:is(#app, .theme-dark) .btn { background: black; }\n\n/* (0, 1, 0) - :where() zeroes its argument out entirely */\n:where(#app, .theme-dark) .btn { background: black; }\n\n/* A library default that is trivial to override */\n:where(.card) { padding: 1rem; border-radius: 4px; }\n\n/* This wins, despite being \"only\" one class */\n.card { padding: 0; }"
    },
    {
      "t": "p",
      "x": "One warning about `:is()`. Because it takes the highest specificity of anything in its list, `:is(h1, h2, h3, #legacy-heading)` gives every branch the weight of that ID. Keep ID selectors out of `:is()` lists unless you mean it."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "**Layer order is compared before specificity, so a low-specificity rule in a later layer beats a high-specificity rule in an earlier one.** You declare the order once, usually at the top of your entry stylesheet, and everything after that sorts itself out."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declaring the order up front is the whole trick.\n   Later in this list means higher priority. */\n@layer reset, base, components, utilities;\n\n@layer components {\n  #sidebar .nav-link { color: navy; }   /* (1, 1, 0) */\n}\n\n@layer utilities {\n  .text-red { color: red; }             /* (0, 1, 0) */\n}\n\n/* .text-red wins. Specificity is never consulted, because\n   utilities is declared after components. */"
    },
    {
      "t": "p",
      "x": "Anything outside a layer is unlayered, and unlayered normal declarations beat every layer. This is deliberate: it lets you adopt layers incrementally without your existing stylesheet suddenly losing to a vendor layer. It also means a stray unlayered rule can quietly outrank a carefully built layer stack, so check for one when a layered override does nothing."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@import url(\"bootstrap.css\") layer(vendor);\n@layer vendor, app;\n\n@layer app {\n  .btn { border-radius: 0; }    /* beats .btn.btn-primary from vendor */\n}\n\n.btn { border-radius: 999px; }  /* unlayered: beats both of the above */"
    },
    {
      "t": "p",
      "x": "Importing third-party CSS straight into a layer is the single most useful thing layers do. It ends the usual routine of inspecting a framework's selectors and writing something one notch heavier."
    },
    {
      "t": "h3",
      "x": "!important reverses layer order"
    },
    {
      "t": "p",
      "x": "This is the part that catches everyone once. For normal declarations, later layers win. For `!important` declarations, the order flips: earlier layers win, and any layered `!important` beats an unlayered one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base      { p { color: green !important; } }\n@layer overrides { p { color: red !important; } }\n\n/* green wins. For important declarations the first layer\n   in the order has the final say. */"
    },
    {
      "t": "p",
      "x": "It is consistent once you see the logic. A layer you put first is one you consider most foundational, so when it insists on something, it should be able to insist. In practice it means you should not sprinkle `!important` through a layered codebase and expect the usual intuition to hold."
    },
    {
      "t": "h2",
      "x": "!important, inline styles and what beats what"
    },
    {
      "t": "p",
      "x": "**An `!important` declaration in a stylesheet overrides a plain inline `style` attribute.** Importance is compared at step one; the style attribute only matters at step three, and by then the comparison is over. This is the standard escape hatch when a chart library or an animation script writes inline styles you cannot edit."
    },
    {
      "t": "p",
      "x": "`style=\"color: red !important\"` is a different matter. Now both declarations sit on the same rung of the importance ladder, so the element-attached step decides it, and the inline one wins. From author CSS there is no way past that. You are down to changing the script, removing the attribute in JavaScript, or a user stylesheet."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important on a custom property is narrower than it looks",
      "x": "`--brand: red !important` wins the cascade for the value of `--brand`, exactly as you would expect. What it does not do is make `color: var(--brand)` important. Substitution happens after the cascade has already picked a winner for `color`, so a later `color` declaration still overrides it."
    },
    {
      "t": "h2",
      "x": "How to win without escalating"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the rule matches before touching the selector",
          "x": "If devtools does not list your rule for the element at all, specificity is irrelevant. Fix the match or the parse error first."
        },
        {
          "title": "Read the winner, not just the loser",
          "x": "Devtools shows which declaration won and which file it came from. Half the time that file belongs to a dependency nobody remembered was there."
        },
        {
          "title": "Match specificity and use source order",
          "x": "Equal specificity means the later rule wins. Moving your import after the one you are fighting is cheaper and less fragile than outweighing it.",
          "code": "/* Instead of #app .card .title { ... } to beat .card .title,\n   write the same weight and load it later. */\n.card .title { font-weight: 600; }"
        },
        {
          "title": "Put third-party CSS in a layer",
          "x": "One import line makes every unlayered rule you own outrank the whole framework, whatever its selectors look like.",
          "code": "@import url(\"vendor.css\") layer(vendor);\n@layer vendor, app;"
        },
        {
          "title": "Ship library defaults through :where()",
          "x": "Zero specificity means consumers override you with a plain class instead of filing an issue about it."
        },
        {
          "title": "Keep !important for things you cannot reach",
          "x": "Inline styles from a third-party script, and utility classes whose entire job is to win. Everywhere else it removes your ability to override later, and the next person reaches for a second !important."
        }
      ]
    },
    {
      "t": "p",
      "x": "The `.card.card.card` repetition trick, where you repeat a class to inflate column B, does work and is valid CSS. It is also a signal. If you need it more than once or twice in a codebase, the real fix is a layer boundary or a rethink of where those styles live."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "A decision rule for layout, plus the details that prevent overflow and alignment bugs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "React useState Not Updating",
          "desc": "Another case where the code looks right and the output disagrees. Five causes, in order.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks correct?",
          "a": "Check whether the rule appears in the devtools Styles panel at all. If it is listed but struck through, something beat it in the cascade. If it is not listed, the selector did not match the element, the rule failed to parse, or the stylesheet never loaded. Those are the more common cases, and no change to specificity will fix them."
        },
        {
          "q": "Do multiple classes ever beat an ID in CSS?",
          "a": "No. Specificity is three counters compared left to right with no carrying, and IDs occupy the leftmost column. A selector with fifty classes is (0, 50, 0) and still loses to `#main` at (1, 0, 0). If you need to beat an ID selector, use a cascade layer, an `!important` declaration, or change the selector you are fighting."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes, if the inline style is not itself important. Importance is compared before the browser considers where a declaration lives, so `color: blue !important` in a stylesheet beats `style=\"color: red\"`. It does not beat `style=\"color: red !important\"`, which wins over any author stylesheet declaration."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. The difference is weight: `:is()` takes the specificity of its most specific argument, while `:where()` always contributes zero. Use `:where()` for defaults you want people to override easily, and be careful about putting ID selectors inside `:is()`, because every branch then inherits that weight."
        },
        {
          "q": "Why does my !important rule in the last cascade layer not win?",
          "a": "Because `!important` reverses layer order. Normal declarations in later layers win; important declarations in earlier layers win. An important declaration in your first layer outranks one in your last, and any layered important declaration outranks an unlayered one."
        },
        {
          "q": "Can I use @layer in production?",
          "a": "Cascade layers shipped in Chrome and Edge 99, Firefox 97 and Safari 15.4, all in early 2022, so as of September 2026 they are available in every current browser. Verify against your own support baseline before relying on them, because a browser that does not understand `@layer` ignores the whole block rather than falling back to unlayered styles."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-11",
  "updated": "2026-09-11",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
