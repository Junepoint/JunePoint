module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important, in the order the browser checks them",
  "eyebrow": "Guides",
  "description": "Work through the CSS cascade in order: origin, inline styles, layers, specificity, source order, and the failures that only look like specificity.",
  "standfirst": "Specificity is the fourth tiebreaker the browser reaches for, not the first. Find out what actually won, then fix the cause instead of stacking another !important.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css !important",
    "css cascade order"
  ],
  "cardDesc": "The cascade in order, how specificity is really counted, and the reasons a rule loses that have nothing to do with specificity.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers, not one: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. Compared left to right. A hundred classes never beat one ID.",
        "The browser sorts declarations by origin and importance, then element-attached (inline) styles, then cascade layer, then specificity, then document order. Specificity is fourth in that list.",
        "Unlayered author styles beat every layered author style. For `!important` declarations the layer order reverses, so the **first** layer wins and unlayered loses.",
        "Most \"my rule is ignored\" reports are not specificity at all: the selector never matched, the value was invalid and dropped at parse time, a shorthand later in the file reset it, or the property was only ever inherited.",
        "`:where()` sets its arguments to zero specificity. It is the cheapest way to write defaults that other people can override without a fight."
      ]
    },
    {
      "t": "p",
      "x": "Before reasoning about any of this, look at the element. Guessing which rule won is slower and less reliable than reading it off the page, and the answer is frequently something you would not have guessed."
    },
    {
      "t": "h2",
      "x": "Find out what actually won"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Open the Styles pane and read top to bottom",
          "x": "Chrome, Edge, Firefox and Safari all list matching rules in cascade order, winner first, with losing declarations struck through. If your rule is not in the list at all, the selector did not match and specificity is irrelevant."
        },
        {
          "title": "Look for a warning marker next to the declaration",
          "x": "An invalid property name or an unparseable value is discarded when the stylesheet is parsed. The browsers flag these in the Styles pane. A single bad character, such as a missing closing bracket or a unit on a unitless value, quietly removes the declaration."
        },
        {
          "title": "Jump from Computed back to the source",
          "x": "The Computed pane shows the final value for every property and expands to reveal which rule supplied it, with a link to the file and line. This is the fastest route when many stylesheets are in play."
        },
        {
          "title": "Confirm the match in the console",
          "x": "Select the element, then test the selector directly. A `false` here ends the investigation.",
          "code": "// $0 is the element selected in the Elements panel\n$0.matches('.card .title')      // did the selector match at all?\ngetComputedStyle($0).color      // what value actually won\n$0.getAttribute('class')        // is the class even on the element?"
        }
      ]
    },
    {
      "t": "h2",
      "x": "How specificity is counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple. Count the ID selectors, count the class, attribute and pseudo-class selectors, count the element type and pseudo-element selectors. Compare the three numbers left to right, and stop at the first difference. The columns do not carry: there is no number of classes that adds up to an ID, which is why a design system built on IDs is so painful to theme."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,0,1 */\nbutton { background: gray; }\n\n/* 0,1,1 */\n.toolbar button { background: blue; }\n\n/* 0,4,0 - four classes, still loses to the rule below */\n.a.b.c.d { background: red; }\n\n/* 1,0,0 - one ID beats them all */\n#app { background: green; }"
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
          "`li`",
          "0,0,1",
          "Element types and pseudo-elements sit in the last column."
        ],
        [
          "`.nav li`",
          "0,1,1",
          "Classes go in the middle column."
        ],
        [
          "`[data-state=\"open\"]`",
          "0,1,0",
          "Attribute selectors count the same as a class."
        ],
        [
          "`:hover`",
          "0,1,0",
          "Ordinary pseudo-classes count as a class."
        ],
        [
          "`::before`",
          "0,0,1",
          "Pseudo-elements count as an element, not a class."
        ],
        [
          "`#header .nav li`",
          "1,1,1",
          "One of each."
        ],
        [
          "`*` and `>` `+` `~`",
          "0,0,0",
          "The universal selector and combinators contribute nothing."
        ],
        [
          "`:is(#id, p)`",
          "1,0,0",
          "Takes the specificity of its most specific argument."
        ],
        [
          "`:not(.a)`",
          "0,1,0",
          "Same rule. The negation itself is free, the argument is not."
        ],
        [
          "`:where(#id, p)`",
          "0,0,0",
          "Always zero, whatever is inside it."
        ],
        [
          "`style=\"...\"`",
          "not applicable",
          "Inline styles are sorted before specificity is considered."
        ],
        [
          "`!important`",
          "not applicable",
          "Changes which origin bucket the declaration lands in."
        ]
      ],
      "caption": "Specificity of common selector forms. Nesting with `&` behaves like `:is()`, so it inherits the most specific branch of the parent."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": ":is() can surprise you",
      "x": "`:is(.sidebar, #main) p` has specificity 1,0,1, because `#main` is the most specific argument, and that applies even for elements inside `.sidebar`. If you want the grouping without the cost, use `:where()`."
    },
    {
      "t": "h2",
      "x": "The full sort order, of which specificity is one step"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser works through a fixed sequence and stops as soon as one wins. Origin and importance first: user agent styles, then user styles, then author styles for normal declarations, and that order inverts for important ones. Then element-attached styles, meaning the `style` attribute. Then cascade layer. Then specificity. Then, finally, which one came last in the document."
    },
    {
      "t": "p",
      "x": "Two consequences catch people out. A normal inline style beats any author selector you can write, however many IDs you pile into it, because inline is settled a step earlier. And an `!important` declaration in an author stylesheet still beats that inline style, because importance is settled a step earlier still. The only thing above all of it is a running CSS transition."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the question"
    },
    {
      "t": "p",
      "x": "`@layer` moves the fight up a level. Once a rule is inside a layer, its specificity only matters against other rules in the same layer. A later layer beats an earlier one no matter how weak its selectors are, and anything outside a layer beats everything inside one. That last part is the piece people forget."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declaring the order up front is the whole point.\n   Layer order is fixed by first appearance, not by where the rules live. */\n@layer reset, components, utilities;\n\n@layer components {\n  #main .card__title { color: rebeccapurple; }  /* 1,1,0 */\n}\n\n@layer utilities {\n  .text-muted { color: gray; }                  /* 0,1,0, and it wins */\n}\n\n/* Not in any layer, so it beats both of the above */\n.text-muted { color: black; }"
    },
    {
      "t": "p",
      "x": "This is why a utility class can stop working the moment someone adds a plain stylesheet to the build. Their unlayered rule now outranks your entire layered system. If you adopt layers, put your own code in layers too, including the one file everyone forgets."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Check your framework's output",
      "x": "Whether a CSS framework emits native `@layer` blocks depends on its major version, and this has changed across releases in more than one popular toolchain. Read your compiled CSS rather than the documentation for a version you might not be running. Browser support for `@layer` arrived in the major engines during 2022; if you support anything older, verify against current browser data before relying on it."
    },
    {
      "t": "h2",
      "x": "!important, and the trick it plays with layers"
    },
    {
      "t": "p",
      "x": "Marking a declaration `!important` does not make it more specific. It moves it into a separate bucket that is sorted in the opposite direction. Author important beats author normal. User important beats author important, which is how a reader's accessibility stylesheet is able to override your typography. And within author styles, layer order flips: the first layer now wins, and unlayered important declarations come last."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base {\n  a { color: blue !important; }   /* wins: earliest layer, important */\n}\n\n@layer theme {\n  a { color: red !important; }\n}\n\na { color: green !important; }    /* unlayered important loses to both */"
    },
    {
      "t": "p",
      "x": "Read that twice if you have just spent an afternoon on it. The reversal is deliberate: it lets a low-level layer protect a handful of declarations from everything built on top, which is exactly what a reset or a hard accessibility requirement wants. It also means adding `!important` to the losing rule can move it further from winning, not closer."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The cost of !important is paid later",
      "x": "An important declaration cannot be overridden by anything except another important declaration at a higher rank. That is fine for a print stylesheet or for wrestling with a third-party widget you do not control. Inside your own components it converts every future override into another `!important`, and once two of them collide you are back to comparing specificity, only now with fewer options."
    },
    {
      "t": "h2",
      "x": "Reasons a rule loses that are not specificity"
    },
    {
      "t": "p",
      "x": "In practice this is where most of the time goes. Work through these before touching a selector."
    },
    {
      "t": "h3",
      "x": "The selector never matched"
    },
    {
      "t": "p",
      "x": "A class renamed in the template but not the stylesheet. A descendant combinator where a child combinator was meant. An element added to the DOM after the rule was written. `$0.matches()` in the console settles it in one line, and if the rule is absent from the Styles pane entirely, it did not match."
    },
    {
      "t": "h3",
      "x": "The declaration was thrown away"
    },
    {
      "t": "p",
      "x": "CSS discards what it cannot parse and carries on silently. `width: 100` without a unit, a property spelled for a different platform, a custom property that resolves to nothing usable. The rule appears in DevTools, the declaration is marked invalid, and every developer scrolls straight past the marker."
    },
    {
      "t": "h3",
      "x": "A shorthand reset it"
    },
    {
      "t": "p",
      "x": "Shorthands write every longhand they cover, including the ones you did not mention, which get their initial values. Order inside the same block decides it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".badge {\n  background-color: tomato;\n  background: url(\"stripes.svg\");  /* background-color is now transparent */\n}\n\n/* Same trap: border resets border-color, font resets line-height,\n   flex resets flex-basis, and grid-area resets all four placement longhands. */"
    },
    {
      "t": "h3",
      "x": "The value was inherited, not applied"
    },
    {
      "t": "p",
      "x": "Inheritance only supplies a value when no declaration matched the element at all. Any matching rule, including one from the browser's own stylesheet, beats an inherited value regardless of how specific the ancestor's selector was. This is the real reason a link inside a styled paragraph stays link-colored: the browser stylesheet has a rule for anchors, and your `color` on the parent was never in the running."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".article { color: #222; }        /* inherited by descendants with no rule of their own */\n.article a { color: inherit; }   /* the explicit opt back in that anchors need */"
    },
    {
      "t": "h3",
      "x": "Source order changed underneath you"
    },
    {
      "t": "p",
      "x": "Equal specificity means the last one wins, and \"last\" is decided by your bundler, by import order, by which chunk loaded first, and by code splitting that reorders CSS between development and production builds. A bug that only appears in production is often this. Media queries and `@supports` do not add specificity, so a mobile override placed above a desktop rule of equal weight loses at every viewport width."
    },
    {
      "t": "h2",
      "x": "Ways to win without !important"
    },
    {
      "t": "ul",
      "items": [
        "**Lower the other rule instead of raising yours.** Wrap the context part of a selector in `:where()` and it stops contributing. `:where(.prose) h2` matches identically to `.prose h2` at a specificity of 0,0,1.",
        "**Put third-party CSS in an early layer.** `@import url(\"vendor.css\") layer(vendor);` demotes an entire stylesheet below your own work in one line, without editing any of its selectors.",
        "**Keep component selectors flat.** One class per rule, no ID selectors, no ancestor chains added for weight. Predictable specificity is worth more than clever selectors.",
        "**Repeat the class when you genuinely need one more step.** `.btn.btn { ... }` is 0,2,0 and matches the same elements. It is a hack, it is visible as a hack, and it is far easier to unwind later than an important declaration.",
        "**Reach for `!important` deliberately, not reflexively.** Print stylesheets, accessibility overrides, and patching a widget whose markup you cannot touch are all legitimate. Leave a comment saying which one it is."
      ]
    },
    {
      "t": "p",
      "x": "One more habit is worth building. When a rule loses, resist the urge to make it win in the fastest available way, and ask why the winner exists. Half the time the winning rule is doing something reasonable and the real fix belongs there. The other half it is a leftover nobody has dared touch, and deleting it is cheaper than routing around it forever."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check in this order: does the selector match the element (`$0.matches()` in the console), is the declaration marked invalid in DevTools, is a shorthand later in the same block resetting it, and is the property one you only expected to inherit. Specificity is worth investigating only after those four come back clean, and DevTools will show you the winning rule directly in the Computed pane."
        },
        {
          "q": "Does !important always win?",
          "a": "No. A user stylesheet's important declaration beats an author's, and inside author styles the layer order reverses, so an important declaration in an earlier layer beats one in a later layer, and an unlayered important declaration loses to both. Adding !important to the rule that is losing can therefore move it further down the order."
        },
        {
          "q": "How many classes equal one ID in CSS specificity?",
          "a": "None. Specificity is compared column by column from the left, and the columns do not carry, so any selector containing an ID beats any selector containing none, whatever else is in it. Older Internet Explorer versions had an overflow bug here; current browsers do not."
        },
        {
          "q": "Why does my utility class get overridden by a component style?",
          "a": "Usually because the component rule has higher specificity within the same layer, or because it sits in a later cascade layer, or because it is not in a layer at all while the utilities are. Unlayered author styles beat every layered author style for normal declarations. Read the compiled CSS to see which layers your build actually emits."
        },
        {
          "q": "Do media queries increase specificity?",
          "a": "No. `@media` and `@supports` are conditional groups; they do not change the specificity of the selectors inside them. When two rules of equal specificity both apply, the later one in source order wins, so a responsive override has to come after the rule it overrides."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. `:is()` takes the specificity of its most specific argument, so a single ID inside it raises the whole selector, while `:where()` always contributes zero. Use `:where()` for defaults you want others to override easily, and `:is()` when you want the grouping to keep its weight."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout module fits the problem, and the sizing traps that make items overflow their tracks.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker for WCAG AA and AAA",
          "desc": "Check a foreground and background pair against the AA and AAA thresholds before shipping the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating: Five Causes to Check",
          "desc": "The same debugging shape applied to state that appears one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-02",
  "updated": "2026-09-02",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
