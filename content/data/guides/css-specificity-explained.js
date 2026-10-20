module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Specificity is only the fifth tiebreaker in the cascade. Check origin, importance, inline styles and cascade layers first, then count the three numbers.",
  "standfirst": "A rule that loses is not always outranked. Work down the cascade in the order the browser does, and most of these bugs resolve in under a minute.",
  "keywords": [
    "css specificity",
    "cascade layers",
    "css important override",
    "css rule not applying",
    "specificity calculation"
  ],
  "cardDesc": "Read the cascade in the order the browser does: origin, importance, inline, layers, then specificity.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers, not one: ID selectors, then class, attribute and pseudo-class selectors, then type selectors and pseudo-elements. Eleven classes `(0,11,0)` still lose to a single ID `(1,0,0)`.",
        "Specificity is the fifth question the browser asks. Origin and importance, shadow context, `style` attributes and cascade layers are all settled before any selector gets compared.",
        "`@layer` reverses direction for `!important`. Later layers win for normal declarations; earlier layers win for important ones. Unlayered styles beat every layer on normal declarations and lose to every layer on important ones.",
        "An inherited value never competes with a declaration that matches the element directly, no matter how specific the ancestor selector was.",
        "If DevTools shows your declaration struck through *with* a warning icon, nothing outranked it. It was dropped as invalid, or a `var()` inside it failed to resolve."
      ]
    },
    {
      "t": "h2",
      "x": "The cascade in the order it is applied"
    },
    {
      "t": "p",
      "x": "Plenty of \"my selector is not specific enough\" bugs turn out to be something else: a typo in a value, a shorthand later in the file, a stylesheet loaded in the wrong order. Checking specificity first is why they take an hour. The browser resolves a conflict between two declarations for the same property by working through these questions and stopping at the first one that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Where the declaration came from (browser default, user stylesheet, your stylesheet) combined with whether it carries `!important`.",
        "**Context.** Whether it came from inside a shadow tree or from the outer document.",
        "**Element-attached styles.** A declaration in a `style` attribute beats one from a stylesheet rule of the same origin and importance.",
        "**Cascade layers.** Which `@layer` the declaration belongs to, if any.",
        "**Specificity.** The three numbers, compared left to right.",
        "**Order of appearance.** Last one in document order wins."
      ]
    },
    {
      "t": "p",
      "x": "Step one is where `!important` does its work, and it is worth seeing the full ladder. The surprise for most people sits at the top: a running CSS transition outranks an important author declaration, which is why a hover color can appear to ignore a rule you are certain about."
    },
    {
      "t": "table",
      "head": [
        "Precedence",
        "Source",
        "Note"
      ],
      "rows": [
        [
          "1 (weakest)",
          "User-agent normal",
          "The browser's own default stylesheet."
        ],
        [
          "2",
          "User normal",
          "A user stylesheet or browser preference. Rare on the open web, common in accessibility setups."
        ],
        [
          "3",
          "Author normal",
          "Your stylesheets and your `style` attributes."
        ],
        [
          "4",
          "CSS animations",
          "A `@keyframes` declaration beats normal author CSS while the animation runs."
        ],
        [
          "5",
          "Author `!important`",
          "Beats every normal declaration, including inline ones."
        ],
        [
          "6",
          "User `!important`",
          "A user's important declaration beats yours. This is deliberate."
        ],
        [
          "7",
          "User-agent `!important`",
          "Reserved for things the browser will not let you break."
        ],
        [
          "8 (strongest)",
          "CSS transitions",
          "A transition in progress wins over everything, author `!important` included."
        ]
      ],
      "caption": "Origin and importance, weakest to strongest. Settled before specificity is ever considered."
    },
    {
      "t": "p",
      "x": "Two practical consequences. An `!important` declaration in a stylesheet beats a normal inline `style` attribute, because importance is decided at step 1 and inline styles only matter at step 3. And `style=\"color: red !important\"` beats an important stylesheet rule, because both are author-important and inline wins that tie."
    },
    {
      "t": "h2",
      "x": "How the three numbers work"
    },
    {
      "t": "p",
      "x": "Specificity is a triple, written `(A,B,C)`. `A` counts ID selectors. `B` counts class selectors, attribute selectors and pseudo-classes. `C` counts type selectors and pseudo-elements. Compare `A` first; only if it ties do you look at `B`, and only then at `C`. Combinators (`>`, `+`, `~`, and the descendant space) add nothing, and neither does `*`."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "(A,B,C)",
        "Why"
      ],
      "rows": [
        [
          "`*`",
          "(0,0,0)",
          "The universal selector is free."
        ],
        [
          "`li`",
          "(0,0,1)",
          "One type selector."
        ],
        [
          "`li::before`",
          "(0,0,2)",
          "Pseudo-elements count as type selectors."
        ],
        [
          "`.card`",
          "(0,1,0)",
          "One class."
        ],
        [
          "`[data-state=\"open\"]`",
          "(0,1,0)",
          "Attribute selectors count as classes."
        ],
        [
          "`:hover`",
          "(0,1,0)",
          "So do pseudo-classes."
        ],
        [
          "`#main`",
          "(1,0,0)",
          "One ID."
        ],
        [
          "`[id=\"main\"]`",
          "(0,1,0)",
          "Same element, a tenth of the weight. Occasionally very useful."
        ],
        [
          "`.a > .b + .c`",
          "(0,3,0)",
          "Three classes. The combinators are not counted."
        ],
        [
          "`:is(#main, .card)`",
          "(1,0,0)",
          "Takes the specificity of its most specific argument."
        ],
        [
          "`:not(.card)`",
          "(0,1,0)",
          "Same rule as `:is()`."
        ],
        [
          "`:has(> img)`",
          "(0,0,1)",
          "Same rule again, applied to `> img`."
        ],
        [
          "`:where(#main, .card)`",
          "(0,0,0)",
          "Always zero, whatever is inside it."
        ]
      ],
      "caption": "Specificity of common selectors. Each selector in a comma-separated list is counted on its own."
    },
    {
      "t": "p",
      "x": "The old shortcut of scoring IDs as 100, classes as 10 and elements as 1 gives the right answer often enough to be believed, and the wrong one often enough to cost you an afternoon. Under that model eleven classes (110) would beat an ID (100). They do not. Compare the columns, never a sum."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Nesting and `&` inherit `:is()` semantics",
      "x": "A nested selector is resolved as though the parent selector were wrapped in `:is()`, so it takes the weight of the most specific branch. In `.card, #hero { & .title { ... } }` the inner rule scores `(1,1,0)` even when it is matching inside `.card`. The same applies to `&` written explicitly. This one catches people moving a flat stylesheet over to native nesting."
    },
    {
      "t": "h2",
      "x": "The inheritance trap"
    },
    {
      "t": "p",
      "x": "This looks like a specificity failure and is not. An inherited value only reaches an element when no declaration matches that element directly. A single type selector on the element itself beats any ancestor rule, however specific, because the ancestor rule was never in the competition."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (1,2,0) on the ancestor. Looks unbeatable. */\n#sidebar .widget .note {\n  color: rebeccapurple;\n}\n\n/* (0,0,1) on the element itself. This wins for <a> children. */\na {\n  color: blue;\n}\n\n/* Fix: target the element, or opt the property into inheritance. */\n#sidebar .widget .note a {\n  color: rebeccapurple;\n}\n\n/* or */\n#sidebar .widget .note a {\n  color: inherit;\n}"
    },
    {
      "t": "p",
      "x": "Links, buttons, inputs and `select` elements are the usual victims, because the user-agent stylesheet sets `color` and font properties on them directly. A reset that only sets `color` on `body` will never reach any of them."
    },
    {
      "t": "h2",
      "x": "When the declaration was never in the running"
    },
    {
      "t": "p",
      "x": "Before the cascade can sort anything, the parser has to accept it. Whatever it cannot parse is discarded, silently, with no console error. Chrome and Firefox both render these as struck-through text with a warning triangle in the Styles pane, and that is the fastest signal available to you. A strikethrough with a warning means invalid. A strikethrough without one means overridden. Those are two completely different bugs."
    },
    {
      "t": "ul",
      "items": [
        "**A misspelled property or value.** `collor: red` and `color: redd` are both dropped on the floor. So is a value with a missing unit, like `width: 50`.",
        "**An invalid selector in a list.** `h1, h2::, h3 { ... }` invalidates the whole rule in standard CSS, taking `h1` and `h3` down with `h2::`. Wrapping the list in `:is()` or `:where()` makes it forgiving, so unknown branches are ignored rather than fatal.",
        "**A failed `var()`.** A declaration that references an undefined or invalid custom property is *invalid at computed-value time*. It does not fall back to the previous declaration. The property becomes `unset`, which for a non-inherited property means its initial value, so a missing `--brand` turns a background white instead of leaving it the old color.",
        "**A shorthand later in the file.** `background: #fff` after `background-image: url(x.png)` wipes the image. `font: 1rem/1.5 system-ui` resets `font-weight`. Specificity is irrelevant here; this is order of appearance doing exactly what it should.",
        "**A condition that is not met.** `@media`, `@supports` and `@container` blocks whose condition is false contribute nothing at all. A container query also needs an ancestor with `container-type` set, which is easy to lose when a component moves.",
        "**The stylesheet is not where you think it is.** Two `<link>` elements, a bundler that concatenates in a different order in production, or a cached file. Check the Network and Sources panels before blaming the selector."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".panel {\n  background-image: linear-gradient(white, #eee);\n  background-color: #fff;\n}\n\n/* Later in the file. Intended to change only the color; kills the gradient. */\n.panel--muted {\n  background: #f5f5f5;\n}\n\n/* What was almost certainly meant: */\n.panel--muted {\n  background-color: #f5f5f5;\n}"
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer"
    },
    {
      "t": "p",
      "x": "`@layer` adds a sorting step above specificity, which makes it the right tool for the problem people usually reach for `!important` to solve. Declare the layer order once, near the top of your entry stylesheet, and that statement decides the rest. Later layers win. Any rule outside a layer wins against all of them."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order first. Later layers win for normal declarations. */\n@layer reset, vendor, components, utilities;\n\n@layer vendor {\n  /* A third-party widget with a (1,2,0) selector. */\n  #widget .wgt-button.wgt-primary {\n    background: hotpink;\n  }\n}\n\n@layer components {\n  /* (0,1,0), and it wins anyway: components is the later layer. */\n  .button {\n    background: #0b5fff;\n  }\n}\n\n/* Unlayered. Beats every layer above it on normal declarations. */\n.button {\n  border-radius: 6px;\n}"
    },
    {
      "t": "p",
      "x": "You can pull a dependency straight into a layer with `@import url(\"vendor.css\") layer(vendor);`, and its internal specificity stops being your problem. One honest cost: this moves the argument from \"which selector is stronger\" to \"which layer is this in\", and a stylesheet with eight layers and no documented order is not an improvement on what you had. Keep the list short, keep it in one file, and leave a comment explaining it."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "`!important` runs the layer order backwards",
      "x": "For important declarations the layer sort is reversed. An `!important` rule in your first layer beats an `!important` rule in your last layer, and an unlayered `!important` loses to an important declaration in any layer. This is intentional, since it lets a reset or theme layer hold the line against downstream overrides, and it is the most common way a layered stylesheet surprises someone. If an important declaration in `utilities` is being ignored, look for something important in an earlier layer."
    },
    {
      "t": "p",
      "x": "`revert-layer` is the companion worth knowing. It rolls a property back to the value it had from earlier layers rather than to its initial value. `all: revert` goes further and hands the property back to the user-agent or user origin, which is a cleaner way to neutralize a block of inherited styling than a pile of hand-written resets."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "`@scope` adds proximity",
      "x": "Scoped styles introduce one more tiebreaker, sitting between specificity and order of appearance: when two declarations tie on specificity, the one whose scope root is nearer the element wins. Support landed in Chromium and Safari first and in Firefox later, so check its current Baseline status before depending on it in production."
    },
    {
      "t": "h2",
      "x": "What to reach for instead of !important"
    },
    {
      "t": "p",
      "x": "`!important` is not forbidden. It is just hard to undo. Once a declaration is important, the only things that beat it are another important declaration from a stronger origin, one in an earlier layer, or one with higher specificity in the same layer. That is a small and awkward set of options to leave for whoever opens the file next, and the usual response is a second `!important`."
    },
    {
      "t": "ul",
      "items": [
        "Put third-party CSS in an early layer and your own in a later one. This solves the common case outright.",
        "Wrap broad defaults in `:where()` so they contribute zero specificity. `:where(ul, ol) { margin: 0 }` can be overridden by a single class, which is what you want from a reset.",
        "Keep component selectors flat. One class per component element means specificity ties, and ties are broken by source order, which you control.",
        "Use `!important` on purpose for utility classes, where winning is the entire point, and for overriding inline styles injected by a script you do not control. Those two cases are what it is for."
      ]
    },
    {
      "t": "p",
      "x": "A word on utility frameworks, since they come up constantly here. Tailwind generates single-class utilities, so a `.card .title` selector in your own CSS outranks `text-sm` on specificity alone and the utility quietly does nothing. Tailwind v4 emits native `@layer` rules, which changes how its output interacts with yours (current as of October 2026; confirm against the version in your lockfile). Its important modifier exists for the cases that remain after you have flattened your own selectors."
    },
    {
      "t": "h2",
      "x": "Debug it in two minutes"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches at all",
          "x": "Prove the selector hits the element before you theorize about anything else. The console is faster than re-reading the rule, and it catches a missing descendant space or a `>` that should not be there.",
          "code": "document.querySelectorAll('.card > .title').length\n// 0 means the problem is the selector, not the cascade"
        },
        {
          "title": "Read the strikethrough",
          "x": "Find your declaration in the Styles pane. Struck through with a warning icon means it was dropped as invalid, so fix the property or the value. Struck through with no icon means something outranked it, and hovering or scrolling up the pane shows what."
        },
        {
          "title": "Use the Computed pane, not the Styles pane",
          "x": "Expand the property in Computed. It lists every declaration that targeted it, winner first, each linked to its source line. This is the only view that shows the whole picture, user-agent stylesheet included."
        },
        {
          "title": "Compare the three numbers, in order",
          "x": "Count IDs, then classes plus attributes plus pseudo-classes, then types plus pseudo-elements. Remember that `:is()`, `:not()` and `:has()` inherit their argument's weight, and that `:where()` contributes nothing."
        },
        {
          "title": "Check layer and origin last",
          "x": "Chromium DevTools labels layered rules with their `@layer` name in the Styles pane. If the winning declaration is important and sits in an earlier layer, no amount of added specificity in a later layer will help. Move the rule or change the layer order instead."
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Four likely reasons. Something else is also important and comes from a stronger origin, an earlier cascade layer, or a higher specificity within the same layer. The declaration is invalid and was dropped, which DevTools shows as a strikethrough with a warning icon. A CSS transition is running, and transitions outrank author important declarations. Or the selector simply does not match the element, in which case importance changes nothing."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "Yes, as long as the inline style is not itself important. Importance is decided before the inline-versus-stylesheet tiebreak, so an important rule in a stylesheet beats style=\"color: red\". It does not beat style=\"color: red !important\", because both are author-important and the inline declaration wins that tie."
        },
        {
          "q": "How do I calculate CSS specificity?",
          "a": "Count three separate values. A is the number of ID selectors, B is the number of class, attribute and pseudo-class selectors, and C is the number of type selectors and pseudo-elements. Compare A first, then B, then C. Do not combine them into one number: eleven classes do not beat one ID."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes. Layer order is checked before specificity, so a one-class selector in a later layer beats an ID selector in an earlier one for normal declarations. For important declarations the layer order reverses and earlier layers win."
        },
        {
          "q": "Why does an unlayered rule beat my layer?",
          "a": "By design. Normal declarations outside any layer sort as the strongest in the layer step, so unlayered CSS overrides every layer you have. The reverse holds for important declarations, where unlayered styles are the weakest of the important group. If you use layers at all, put nearly everything in one."
        },
        {
          "q": "Why does my parent element's color not apply to links inside it?",
          "a": "Because the user-agent stylesheet sets color on the a element directly, and a declaration matching the element always beats an inherited value. Specificity on the ancestor rule makes no difference. Target the link itself, or set color: inherit on it."
        },
        {
          "q": "Is it bad practice to use IDs in CSS selectors?",
          "a": "Mostly, for one practical reason: an ID selector is an order of magnitude harder to override than a class, and you cannot weaken it later without rewriting both rules. If you must style an element that only has an ID, select it with the attribute form [id=\"main\"], which scores as a class."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module fits which problem, plus the sizing gotchas in each.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA before you ship the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of bug one layer up: the code is right and the value you are reading is stale.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-20",
  "updated": "2026-10-20",
  "author": "jackson",
  "related": []
};
