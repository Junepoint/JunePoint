module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Your CSS rule is not applying: here is the order the browser decides in",
  "eyebrow": "CSS",
  "description": "Specificity gets the blame and is rarely the cause. Work through matching, origin, inline style, cascade layers, specificity and source order in the right order.",
  "standfirst": "Specificity is three numbers, and it is only step five of the cascade. This walks the full resolution order, then shows how to read the winning declaration out of DevTools instead of reaching for !important.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "important css override",
    "css cascade order",
    "specificity calculation"
  ],
  "cardDesc": "Specificity, cascade layers and !important, in the order the browser actually resolves them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before touching specificity, confirm the rule matches anything. `document.querySelectorAll('your selector').length` answers that in two seconds, and a zero means specificity was never the problem.",
        "Specificity is three counters, not four: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. They are compared left to right, so no quantity of classes ever beats a single ID.",
        "Specificity is step five of the cascade. Origin and importance, then the `style` attribute, then cascade layer order all pick a winner before specificity is consulted.",
        "Inside `@layer`, layer order beats specificity. One class in a later layer overrides an ID selector in an earlier one. For `!important` declarations that order reverses and the earliest layer wins.",
        "`!important` is the correct tool in one situation: overriding a stylesheet you cannot edit. Everywhere else it is a loan against your future self, who will need to override it."
      ]
    },
    {
      "t": "h2",
      "x": "First rule out the things that are not specificity"
    },
    {
      "t": "p",
      "x": "A declaration that loses a specificity contest still appears in the Styles panel, struck through, below the rule that beat it. That strikethrough is the signature of a cascade problem. If your declaration is not in the panel at all, the cascade is innocent and something earlier went wrong."
    },
    {
      "t": "ul",
      "items": [
        "**The selector matches nothing.** Paste it into `document.querySelectorAll()` and check the length. Zero usually means a typo, a class the framework renders differently than you expected, or a child combinator (`>`) where the markup needs a descendant selector.",
        "**The stylesheet never loaded.** Check the Network panel for a 404 and the Sources tree for the file. A build that writes to `dist/` while the dev server serves `public/` produces exactly this symptom, and it looks identical to a specificity bug from the outside.",
        "**The declaration was dropped at parse time.** Browsers discard any declaration they cannot parse, silently as far as the page is concerned. `margin: 10` with no unit, or a custom property holding an invalid value, simply ceases to exist. DevTools flags these with a warning marker next to the line.",
        "**A shorthand later in the block wiped it out.** `background-image` followed by `background: #fff` leaves you with no image. Same specificity, same origin, so source order decides, and the shorthand resets every longhand it covers.",
        "**The property does not inherit, or the element has no box to style.** Borders on an inline element with no content, padding on a wrapper you did not know existed, `height: 100%` with no sized parent. The rule applies perfectly and does nothing visible."
      ]
    },
    {
      "t": "p",
      "x": "Those five cover most of the cases. Work through them before you start counting selectors, because counting selectors on a rule that never matched is a slow way to learn nothing."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Three counters. IDs in the first slot, classes and attribute selectors and pseudo-classes in the second, element types and pseudo-elements in the third. The convention is to write them with hyphens, as `1-2-0`, because writing `120` invites people to treat it as a decimal number that ten classes could overtake. They cannot. The comparison is lexicographic: any nonzero first slot wins outright, and only a tie moves the decision to the next slot."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-1-1 */\nbutton.primary { background: rebeccapurple; }\n\n/* 0-0-2, declared later, still loses */\nform button { background: gray; }\n\n/* 0-11-0, and it loses to the line below it */\n.a.a.a.a.a.a.a.a.a.a.a { color: red; }\n\n/* 1-0-0 */\n#app { color: blue; }"
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Specificity",
        "Note"
      ],
      "rows": [
        [
          "`*`, `>`, `+`, `~`",
          "0-0-0",
          "The universal selector and combinators contribute nothing"
        ],
        [
          "`button`, `::before`",
          "0-0-1",
          "Element types and pseudo-elements"
        ],
        [
          "`.primary`, `[disabled]`, `:hover`",
          "0-1-0",
          "Classes, attribute selectors and pseudo-classes all count the same"
        ],
        [
          "`#app`",
          "1-0-0",
          "An ID outranks any number of classes"
        ],
        [
          "`#app .card button`",
          "1-1-1",
          "Counters add up across the whole compound selector"
        ],
        [
          "`:where(#app)`",
          "0-0-0",
          "`:where()` always zeroes out its contents"
        ],
        [
          "`style` attribute",
          "not applicable",
          "Not specificity at all, it wins at an earlier cascade step"
        ]
      ],
      "caption": "Specificity values for common selectors, written as ID-class-type."
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes are where most surprises live. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, which means `a:not(#nope)` quietly weighs `1-0-1` even though no ID is involved in matching. `:where()` is the opposite and always contributes zero, which makes it the right wrapper for anything you intend other people to override."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-0-1: easy for a consumer to override */\n:where(.sidebar, #main) a { color: teal; }\n\n/* 1-0-1: the #main argument sets the weight */\n:is(.sidebar, #main) a { color: maroon; }\n\n/* 1-0-1: the negated ID still counts */\na:not(#nope) { color: olive; }"
    },
    {
      "t": "p",
      "x": "Native CSS nesting inherits this behavior. A nested selector is resolved as though the parent selector list were wrapped in `:is()`, so nesting inside a rule that happens to include an ID gives every child rule a `1-x-x` weight. If your nested utilities stopped overriding anything after a refactor, look at what the outermost selector list contains."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Specificity is per declaration, not per rule",
      "x": "Two rules can both apply, with one winning `color` and the other winning `background`, if each declares properties the other does not. There is no single winning rule for an element. Reason about one property at a time or the logic will not resolve."
    },
    {
      "t": "h2",
      "x": "Specificity is step five, not step one"
    },
    {
      "t": "p",
      "x": "This is the part that explains most of the confusing cases. The cascade compares declarations through a sequence of steps and stops at the first one that separates them. Origin and importance come first, then context such as shadow DOM encapsulation, then whether the declaration came from the `style` attribute, then cascade layer order. Specificity only arbitrates between declarations that tied on all of that, and source order only matters when specificity ties too."
    },
    {
      "t": "table",
      "head": [
        "Priority",
        "Declaration",
        "Beats"
      ],
      "rows": [
        [
          "1",
          "An active CSS transition",
          "Everything, for the duration of the transition"
        ],
        [
          "2",
          "`!important` in the browser default stylesheet",
          "All author and user styles"
        ],
        [
          "3",
          "`!important` in a user stylesheet or extension",
          "All author styles"
        ],
        [
          "4",
          "`!important` in your stylesheet",
          "Animations and all normal declarations"
        ],
        [
          "5",
          "A running CSS animation",
          "All normal declarations"
        ],
        [
          "6",
          "A normal declaration in your stylesheet",
          "Normal user and browser styles"
        ],
        [
          "7",
          "A normal declaration in a user stylesheet",
          "Browser defaults"
        ],
        [
          "8",
          "A normal browser default",
          "Nothing"
        ]
      ],
      "caption": "Cascade origin and importance order. A declaration higher in this table wins regardless of specificity."
    },
    {
      "t": "p",
      "x": "Read row four against row six and the usual `!important` escalation makes sense. Read row one and the mystery of a hover color that refuses to change during a 200ms transition makes sense too. None of this involves counting selectors."
    },
    {
      "t": "p",
      "x": "The `style` attribute deserves its own mention, because it is widely described as being worth `1-0-0-0`. That framing predicts the right outcome and the wrong reason. Inline styles are not ranked by specificity at all. They win at an earlier step, which is why the only author-level way to beat an inline style is `!important`, and why a `1-1-1` selector and a `0-0-1` selector lose to it equally."
    },
    {
      "t": "h2",
      "x": "Cascade layers invert the instinct you have built up"
    },
    {
      "t": "p",
      "x": "`@layer` adds an explicit ordering step above specificity, and it is the single biggest change to how overrides work in CSS in years. Declare the order once, usually at the top of your entry stylesheet, and layers are consulted in that order no matter where the rules physically live."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Order is fixed here, by first appearance of each name */\n@layer reset, vendor, components, utilities;\n\n@import url(\"normalize.css\") layer(reset);\n\n@layer components {\n  /* 1-2-1 */\n  #app .card .title { font-size: 1.25rem; }\n}\n\n@layer utilities {\n  /* 0-1-0, and this is the value that applies */\n  .text-sm { font-size: 0.875rem; }\n}"
    },
    {
      "t": "p",
      "x": "A single class beats an ID selector there, because layer order is compared before specificity and `utilities` was declared last. That is the whole point: utility classes, theme overrides and anything else that exists to win can now win without inflating selectors or using `!important`."
    },
    {
      "t": "p",
      "x": "Two consequences catch people out. Styles outside any layer behave as if they were in an implicit final layer, so unlayered CSS beats all of your layered CSS for normal declarations. And for `!important` declarations the layer order flips completely: the earliest layer wins, and unlayered important styles are the weakest of all. The reasoning is that a reset layer marking something important is making a stronger structural claim than a utility, but the practical effect is that `!important` inside a layered codebase does the opposite of what muscle memory expects."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .btn { color: red !important; }\n}\n\n@layer overrides {\n  .btn { color: blue !important; }\n}\n\n/* Computed color: red. For !important, earlier layers win. */"
    },
    {
      "t": "p",
      "x": "The companion keyword is `revert-layer`, which rolls a property back to whatever value the previous layer produced rather than to the initial value. It is the clean way to undo a framework default without knowing what that default was."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer framework, overrides;\n\n@layer framework {\n  .card { padding: 2rem; }\n}\n\n@layer overrides {\n  /* Falls back to the framework value, not to 0 */\n  .card.compact { padding: revert-layer; }\n}"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support, and what to verify",
      "x": "`@layer` shipped in Chrome 99, Firefox 97 and Safari 15.4, all in the first quarter of 2022. That is correct as of October 2026, but check caniuse.com against your own support floor before committing, because there is no graceful degradation: a browser that does not understand `@layer` drops the entire block, which means every rule inside it disappears rather than merely losing its ordering."
    },
    {
      "t": "h2",
      "x": "When !important is the right answer"
    },
    {
      "t": "p",
      "x": "It is the right answer when you are overriding CSS you do not control and cannot change. A vendor widget, an email client, a third-party embed shipping inline styles, a CMS theme you are not permitted to fork. In those cases you are not escalating an argument with yourself, you are reaching across an origin boundary you have no other access to, and `!important` is the mechanism the cascade provides for exactly that."
    },
    {
      "t": "p",
      "x": "It is the wrong answer inside your own codebase, and the cost is specific rather than moral. Once a declaration is important, the only ways to override it are another important declaration, an earlier cascade layer, or a more specific important selector. You have removed the cheap override and left only expensive ones, which is how a stylesheet ends up with `!important` on three quarters of its color declarations. Accessibility overrides are also affected: a user stylesheet marking `color !important` outranks yours, but only if you have not already started an arms race that pushes authors toward specificity hacks instead."
    },
    {
      "t": "p",
      "x": "If you need a hammer inside your own code, cascade layers are the better one. A late layer wins with a single class and stays overridable by a later layer, which is the property `!important` destroys."
    },
    {
      "t": "h2",
      "x": "Read the answer out of DevTools"
    },
    {
      "t": "p",
      "x": "Counting specificity by hand is a reasonable way to understand the model and a poor way to debug a live page. The browser has already done the computation and will show you the result."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "In the console, query it directly. A length of zero ends the investigation immediately and saves you from debugging the cascade for a rule that was never in the running.",
          "code": "document.querySelectorAll('#app .card > .title').length"
        },
        {
          "title": "Find your declaration in the Styles panel",
          "x": "Select the element and look for your rule. Present and struck through means it lost the cascade and the rest of these steps apply. Absent means go back to the first section of this article. Present with a warning marker means the value failed to parse."
        },
        {
          "title": "Identify what beat it",
          "x": "The winning declaration for that property is the topmost unstruck one. The file and line next to each rule tell you whether the winner is yours, a dependency's, a layer you forgot about, or `element.style`, which is the `style` attribute."
        },
        {
          "title": "Check the Computed tab for the final value",
          "x": "Expand the property to see every declaration that targeted it, ordered, with the winner first. This is the fastest view when several stylesheets are involved, because it collapses the whole cascade for one property into one list."
        },
        {
          "title": "Verify in the console, not by eye",
          "x": "Computed styles are resolved values, so this tells you what the browser settled on rather than what you hoped it would.",
          "code": "getComputedStyle(document.querySelector('.card')).padding"
        }
      ]
    },
    {
      "t": "h2",
      "x": "Keeping this from recurring"
    },
    {
      "t": "p",
      "x": "Most specificity pain is self-inflicted and structural. A few habits remove whole categories of it."
    },
    {
      "t": "ul",
      "items": [
        "**Keep selectors flat.** A single class at `0-1-0` is trivially overridable. `#app .wrapper .card .title span` is not, and every rule written to beat it has to be worse.",
        "**Never style an ID.** Use IDs for fragment links, label associations and JavaScript hooks. The moment one appears in a selector, every override in that part of the tree needs an ID too.",
        "**Wrap defaults in `:where()`.** Anything a consumer is meant to customize should contribute zero specificity, so the obvious override works on the first try.",
        "**Declare your layer order explicitly and early.** One `@layer reset, vendor, base, components, utilities;` line at the top of the entry file documents the whole override hierarchy and makes it stable against import order changes.",
        "**Treat each new `!important` as a question.** If the target is third-party, it is fine. If it is your own code, the real fix is almost always a layer or a shorter selector.",
        "**Reach for `revert-layer` instead of guessing initial values.** It is more honest than `padding: 0` when what you meant was \"whatever it was before this layer\"."
      ]
    },
    {
      "t": "p",
      "x": "None of this is new theory. The cascade has worked roughly this way for twenty years, with layers as the significant recent addition, and the reason it keeps surprising people is that the one step everybody learns, specificity, is neither the first step nor usually the deciding one. If you want a companion piece on the other CSS decision that gets made by habit rather than by reasoning, the [grid versus flexbox guide](/guides/css-grid-vs-flexbox/) covers it."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "The other layout decision people make by reflex, with the cases where each one is clearly correct.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of bug one layer up: the code is right, the mental model of when it runs is not.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "How to fix CORS errors",
          "desc": "Another failure where the browser tells you exactly what happened in a message that reads like it is hiding it.",
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
          "a": "Check whether the declaration appears in the DevTools Styles panel for that element. If it is missing entirely, the selector is not matching, the file did not load, or the value failed to parse and was discarded. If it is there with a line through it, something won the cascade, and the winner is the topmost unstruck declaration for that property. Only in the second case is specificity relevant."
        },
        {
          "q": "Do eleven classes beat one ID in CSS?",
          "a": "No. Specificity is compared slot by slot, not as a decimal number, so `1-0-0` beats `0-11-0` and would beat `0-999-0`. The hyphenated notation exists specifically to stop people reading the counters as digits of a single number."
        },
        {
          "q": "Does inline style count as specificity?",
          "a": "Not technically. The `style` attribute is handled at an earlier cascade step than specificity, which is why the only author-level way to override it is `!important`. The common shorthand of calling it `1-0-0-0` predicts the right winner but will mislead you as soon as cascade layers or important declarations enter the picture."
        },
        {
          "q": "Is !important always bad practice?",
          "a": "It is the correct tool for overriding CSS you cannot edit: a vendor widget, an embed, a locked-down theme. Inside your own codebase it is a real cost, because it removes every cheap way to override that declaration later and leaves only more important declarations or earlier cascade layers. If you control the source, a late `@layer` achieves the same override and stays overridable."
        },
        {
          "q": "How do I override a third-party stylesheet I cannot change?",
          "a": "In order of preference: import it into an early cascade layer with `@import url(...) layer(vendor)` so your own layers outrank it regardless of its selectors, raise your own specificity to match theirs, or use `!important`. The layer approach is best because it works even against their ID selectors and leaves your own styles normal and overridable."
        },
        {
          "q": "Why did !important stop working after I added cascade layers?",
          "a": "Because layer order reverses for important declarations. Normal declarations in later layers win, but important declarations in earlier layers win, and important declarations in unlayered CSS are the weakest author styles of all. If your `!important` override sits outside any layer and the rule it is fighting sits inside one, the layered rule wins."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-14",
  "updated": "2026-10-14",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
