module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Your CSS rule is not applying: specificity, layers and !important",
  "eyebrow": "Guides",
  "description": "A debugging order for CSS that will not apply: confirm the selector matched, count specificity properly, then use cascade layers instead of an !important war.",
  "standfirst": "How to tell a selector that never matched from a declaration that matched and lost, how specificity is really counted, and why cascade layers beat adding another class.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "important css",
    "css cascade order"
  ],
  "cardDesc": "Diagnose a CSS rule that will not apply, in the order the browser actually decides.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Look at the Styles pane before you theorize. A selector that never matched looks completely different from a declaration that matched and lost, and the two have different fixes.",
        "Specificity is three numbers compared left to right: IDs, then classes/attributes/pseudo-classes, then element types and pseudo-elements. Eleven classes beat ten classes and never beat one ID.",
        "Cascade layers are consulted *before* specificity. A plain `.card-title` in a later layer beats `#widget .title` in an earlier one, which makes layers the real answer for third-party CSS you cannot edit.",
        "`!important` inverts layer order. Among author important declarations the first layer wins, and important declarations outside any layer are the weakest of the set.",
        "Plenty of cases are not cascade problems at all: an invalid value silently dropped at parse time, a shorthand that resets your property further down the file, or a property that does nothing on that element's display type."
      ]
    },
    {
      "t": "lede",
      "x": "The useful question is not \"how do I make this rule win\". It is \"which of the four possible failures am I looking at\": the selector did not match, the declaration was discarded as invalid, the declaration lost a cascade comparison, or the property applies but has no visible effect here. Devtools answers that in about ten seconds, and the answer tells you which fix is appropriate."
    },
    {
      "t": "h2",
      "x": "Check that the rule is in play before blaming specificity"
    },
    {
      "t": "p",
      "x": "Select the element in the inspector. The Styles pane lists every rule whose selector matched that element, in cascade order, with the highest priority at the top. This is the single most informative screen in front-end debugging and it is routinely skipped."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Is your rule listed at all?",
          "x": "If your selector does not appear in the Styles pane for that element, it did not match. Specificity has nothing to do with it. Typos, an extra descendant combinator, a single colon on a pseudo-element, or markup that is not nested the way you assumed are the usual causes. Count the matches from the console to be certain.",
          "code": "document.querySelectorAll('.card > .title').length  // 0 means the selector is wrong, not weak"
        },
        {
          "title": "Is the declaration struck through?",
          "x": "Strikethrough means the declaration matched and was overridden. Something else won. Click the source link on the right of the winning rule to jump to the file and line that beat you."
        },
        {
          "title": "Is it greyed out with a warning icon?",
          "x": "That is a parse failure, not a cascade loss. One bad value invalidates its own declaration, so `width: 100px;` survives a neighbouring `colour: red;` but `margin: 10 px;` is simply gone. Both Chrome and Firefox flag unknown properties and invalid values in the Styles pane."
        },
        {
          "title": "Read the Computed tab",
          "x": "Expand the property there and you get the full chain of declarations that tried to set it, winner first, each with its source. This is faster than reasoning about specificity and it catches the cases you would not have guessed, such as a user-agent default or an inherited value."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The property may not apply to that element",
      "x": "`width` and `height` do nothing on a non-replaced inline element. `vertical-align` does nothing on a block. `gap` needs a flex, grid or multi-column container. `z-index` needs a positioned element or a flex/grid item. In all of these the declaration appears in devtools, unstruck and valid, and still changes nothing. The Computed tab will show the value you set while the layout ignores it."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a three-part tuple, usually written `(a,b,c)`. Column `a` counts ID selectors. Column `b` counts classes, attribute selectors and pseudo-classes. Column `c` counts element type selectors and pseudo-elements. Universal selectors and combinators count for nothing."
    },
    {
      "t": "p",
      "x": "The comparison is lexicographic. Compare `a`, and only if `a` is tied compare `b`, and only then `c`. There is no base-10 carrying and no total score, which is the misconception behind most bad advice on this topic. A selector with eleven type selectors is `(0,0,11)` and loses to a single class at `(0,1,0)`."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,2)  two type selectors */\nsection p { color: #555; }\n\n/* (0,1,0)  one class, beats the above */\n.lead { color: navy; }\n\n/* (0,2,1)  one type, two classes */\na.btn.btn-primary { color: #fff; }\n\n/* (1,0,0)  one ID, beats every rule above it here */\n#intro { color: crimson; }\n\n/* (0,1,1)  :hover is a pseudo-class, counts in column b */\nbutton:hover { color: teal; }\n\n/* (0,0,1)  ::before is a pseudo-element, counts in column c */\nli::before { content: \"-\"; }"
    },
    {
      "t": "p",
      "x": "Three functional pseudo-classes break the pattern often enough to matter. `:is()` and `:not()` take the specificity of their single most specific argument, so `:is(#main, .sidebar) p` is `(1,0,1)` even when it matched via `.sidebar`. `:where()` always contributes zero, no matter what is inside it. That makes `:where()` the deliberate tool for publishing styles you want others to override easily."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Specificity (0,2,0): hard to override from a component file */\n.prose .lead { margin-block: 1rem; }\n\n/* Same elements matched, specificity (0,1,0) */\n:where(.prose) .lead { margin-block: 1rem; }\n\n/* Same elements matched, specificity (0,0,0) */\n:where(.prose .lead) { margin-block: 1rem; }"
    },
    {
      "t": "p",
      "x": "Native CSS nesting has the same trap. A nested selector computes its specificity as though `&` were `:is()` of the whole parent selector list, so one heavy selector in that list quietly raises every rule nested beneath it. If `.card, #promo { ... }` has nested rules, those nested rules all carry `(1,0,0)` from the `#promo` branch."
    },
    {
      "t": "h2",
      "x": "Cascade layers are decided before specificity"
    },
    {
      "t": "p",
      "x": "This is the part that changes how you fix conflicts. Layer order sits above specificity in the cascade, so a weak selector in a later layer beats a strong selector in an earlier one. No class-stacking required."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, at the top. Later layers win. */\n@layer reset, vendor, base, components, utilities;\n\n@layer vendor {\n  #widget .title { color: rebeccapurple; }   /* (1,1,0) */\n}\n\n@layer components {\n  .card-title { color: teal; }               /* (0,1,0) and it wins */\n}"
    },
    {
      "t": "p",
      "x": "The standard pattern for a stylesheet you do not control is to import it into an early layer: `@import url(\"vendor.css\") layer(vendor);`. Everything in your own later layers then outranks it regardless of how many IDs it used. You can also wrap a `<style>` block or any rules you do control with `@layer vendor { ... }`."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Unlayered CSS acts as the last layer",
      "x": "Normal declarations that are not in any layer behave as though they were in a final layer after every declared one, so they beat all of your layered rules. Partial adoption therefore feels backwards: you move your design system into layers, and the one stray unlayered rule in a page template starts winning everything. Either layer all author CSS or be deliberate about what you leave outside."
    },
    {
      "t": "p",
      "x": "Two keywords pair well with layers. `revert-layer` rolls a property back to whatever the previous layer computed, which is the clean way to undo a component style in a theme override. `revert` rolls all the way back to the user-agent or user value. Both are better than guessing at `initial`, which gives you the spec's initial value rather than the browser default and produces surprises on properties like `display`."
    },
    {
      "t": "p",
      "x": "Cascade layers shipped across Chrome, Firefox and Safari in the first half of 2022 (Chrome 99, Firefox 97, Safari 15.4), so they are safe in anything evergreen. `@scope`, which adds proximity-based resolution and donut-shaped scoping, landed considerably later and its support picture is still the uneven one; check caniuse against your own browser matrix before depending on it. Versions and support here were accurate to our desk research in October 2026 and are worth re-verifying."
    },
    {
      "t": "h2",
      "x": "!important, and the reversal nobody expects"
    },
    {
      "t": "p",
      "x": "`!important` does not add specificity. It moves the declaration into a different band of the cascade, and the bands are ordered like this, lowest priority first:"
    },
    {
      "t": "ol",
      "items": [
        "User-agent normal declarations (the browser's own defaults)",
        "User normal declarations (an extension or OS-level stylesheet)",
        "Author normal declarations (your CSS)",
        "CSS animations, while a `@keyframes` animation is applying a property",
        "Author `!important`",
        "User `!important`",
        "User-agent `!important`",
        "CSS transitions, while one is in flight"
      ]
    },
    {
      "t": "p",
      "x": "Two consequences are worth internalising. An animation overrides your normal declarations but loses to `!important`, which is why an `!important` colour makes a keyframe animation on that property look broken. And a transition outranks everything, including `!important`, so a value that snaps back during a hover is usually a transition still running rather than a cascade bug."
    },
    {
      "t": "p",
      "x": "Inside the author band, importance is evaluated first, then shadow DOM context, then element-attached styles, then layers, then specificity, then document order. So a stylesheet `!important` beats a normal inline `style` attribute, and an inline `style=\"color: red !important\"` beats your stylesheet `!important` back again."
    },
    {
      "t": "p",
      "x": "Then the reversal. For important declarations, layer order runs backwards: the earliest declared layer wins, and important declarations outside any layer are the weakest author important declarations of all. Move a third-party stylesheet into your first layer to defeat its normal rules and you have simultaneously made its `!important` rules the hardest thing in the document to override. This is a genuinely confusing interaction and it is specified behaviour, not a bug."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer vendor, components;\n\n@layer vendor {\n  .btn { color: purple !important; }   /* wins: earlier layer, important */\n}\n\n@layer components {\n  .btn { color: teal !important; }     /* loses */\n}\n\n.btn { color: orange !important; }     /* loses to both: unlayered important is weakest */"
    },
    {
      "t": "h2",
      "x": "Choosing a fix instead of escalating"
    },
    {
      "t": "p",
      "x": "The reflex fix is to add another class, or an ID, or `!important`. Each one works once and raises the floor for every future conflict in that area. Pick by cause."
    },
    {
      "t": "table",
      "head": [
        "Approach",
        "Effect on specificity",
        "Use when",
        "Cost"
      ],
      "rows": [
        [
          "Lower the winning selector",
          "Removes weight from the other rule",
          "You own both rules",
          "None, and it is the fix that keeps working"
        ],
        [
          "Wrap selectors in `:where()`",
          "The wrapped part drops to zero",
          "You publish CSS others need to override",
          "You can no longer rely on winning from inside it"
        ],
        [
          "Put vendor CSS in an early `@layer`",
          "Irrelevant; layer order decides first",
          "Third-party CSS you cannot edit",
          "Unlayered rules then beat your layers, and vendor `!important` gets stronger"
        ],
        [
          "Add a class to your selector",
          "+ (0,1,0)",
          "A local, one-off conflict",
          "Ratchets up; the next conflict needs two"
        ],
        [
          "Use an ID selector",
          "+ (1,0,0)",
          "Almost never, in stylesheets",
          "Only `!important` can beat it afterwards"
        ],
        [
          "`!important`",
          "Changes band, not specificity",
          "Utility classes that must win, user stylesheets, quick bisection",
          "Only another `!important`, an inline important, or a transition beats it"
        ]
      ],
      "caption": "Ways to win a CSS conflict, roughly in order of how well they age."
    },
    {
      "t": "p",
      "x": "A reasonable default for a codebase: no ID selectors in stylesheets, one class of specificity for components, utilities in a final layer, and `!important` reserved for single-purpose utility classes where overriding everything is the stated job. Tailwind and similar frameworks get away with heavy use of `!important` in their utility layer precisely because the intent is unambiguous."
    },
    {
      "t": "h2",
      "x": "When specificity was never the problem"
    },
    {
      "t": "p",
      "x": "Several failures mimic a lost cascade battle. Work through them before rewriting selectors."
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand later in the file.** `background: #fff` resets `background-image`. `font: 16px/1.5 system-ui` resets `font-weight`. `all: unset` resets everything. The shorthand need not be more specific, only later.",
        "**An invalid custom property.** A `var()` that resolves to something the property cannot accept is invalid at computed-value time, so the property falls back to its inherited or initial value rather than to your previous declaration. Devtools shows the declaration as valid, because the token was valid CSS.",
        "**The property is not inherited.** Setting `border` on a parent does not give children borders. Only some properties inherit, and `inherit` has to be asked for explicitly on the rest.",
        "**A media or feature query that does not match.** Chrome's Styles pane shows the query above the rule; a misread `max-width` boundary or a `prefers-color-scheme` block is easy to miss when you are focused on the selector.",
        "**The file is not the file.** A stale build, a cached stylesheet, a dev server serving an earlier bundle, or two copies of a component library on the page. Edit the value in devtools: if the change takes effect live, your rule is fine and your pipeline is not."
      ]
    },
    {
      "t": "p",
      "x": "The live-edit test is the fastest single check available. Type the declaration directly into the Styles pane on the element. If it works there, nothing about the cascade is beating you and the problem is upstream in matching, tooling or delivery. If it does not work even there, the property does not apply to that element and no amount of specificity will change that."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though it is more specific?",
          "a": "Most often because the comparison never happened. Either the selector did not match the element, or the declaration was dropped as invalid, or something above specificity in the cascade decided it: importance, an inline style, or layer order. Check whether your rule even appears in the Styles pane for that element before comparing selectors."
        },
        {
          "q": "How do I calculate CSS specificity?",
          "a": "Count three numbers: IDs, then classes plus attribute selectors plus pseudo-classes, then element types plus pseudo-elements. Compare the first column, then the second only on a tie, then the third. `#nav a:hover` is (1,1,1). `.nav .item .link` is (0,3,0), and the ID selector wins. Combinators and `*` add nothing, and `:where()` contributes zero."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations. Layer order is evaluated before specificity, so any rule in a later layer beats any rule in an earlier layer however heavy that earlier selector is. Rules outside all layers act as a final layer and beat every layered normal rule. For `!important` declarations the layer order is reversed."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "An `!important` declaration in a stylesheet does beat a normal `style` attribute. It does not beat `style=\"...: ... !important\"` on the element, and it does not beat a CSS transition that is currently animating the property. Inside the author origin, importance is checked first and the inline style only wins among declarations of equal importance."
        },
        {
          "q": "Is it ever acceptable to use !important?",
          "a": "Yes, in three places: single-purpose utility classes whose entire job is to win, user stylesheets and browser extensions overriding a site, and temporary debugging to confirm which element and property you are actually looking at. Using it to resolve a conflict between two rules you own is a sign the losing selector should be fixed instead."
        },
        {
          "q": "How do I override a third-party stylesheet I cannot edit?",
          "a": "Import it into an early cascade layer, for example `@import url(\"vendor.css\") layer(vendor);`, and declare your own layers after it. Your normal rules then win on layer order alone. Watch for `!important` inside the vendor file, because moving it to an early layer makes those particular declarations stronger rather than weaker."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout model fits the problem, and where each one quietly fights you.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same debugging shape in JavaScript: five reasons a change you made does not appear.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "When the file you edited is not the file being loaded, resolution order is the answer.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-30",
  "updated": "2026-10-30",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
