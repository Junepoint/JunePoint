module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "Your selector matches but the rule still loses. How the cascade orders origin, layers, specificity and source order, and how to find the declaration that wins.",
  "standfirst": "A declaration can be ignored for six or seven different reasons, and only some of them are about specificity. This is the order to check them in.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "important css",
    "specificity calculator"
  ],
  "cardDesc": "Specificity, cascade layers, !important and the quieter reasons a valid CSS declaration gets thrown away.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is only the **sixth** tiebreaker. Origin, importance, the `style` attribute and cascade layers are all decided before the browser counts selectors.",
        "Specificity is three numbers, not one: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. There is no carrying between columns.",
        "A layered declaration loses to an unlayered one, whatever the selectors look like. Add `!important` and that ordering flips.",
        "If DevTools shows your property struck through with a warning icon, the value is invalid and the cascade never even considered it.",
        "Before blaming the cascade, confirm the selector matches. `document.querySelectorAll()` in the console answers that in one line."
      ]
    },
    {
      "t": "h2",
      "x": "First, prove the selector matches"
    },
    {
      "t": "p",
      "x": "**Half of \"my CSS is not applying\" turns out to be a selector that matches nothing.** The cascade is irrelevant if no element was ever a candidate. Check it before reading another line of stylesheet."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Paste the selector exactly as written in the stylesheet.\ndocument.querySelectorAll('.card > .title');\n// NodeList(0) []  -> the selector is the problem, not the cascade\n\n// Is the stylesheet even loaded and same-origin?\n[...document.styleSheets].map(s => [s.href, (() => {\n  try { return s.cssRules.length } catch { return 'CORS blocked' }\n})()]);"
    },
    {
      "t": "p",
      "x": "Things that produce an empty NodeList more often than people expect: a child combinator where the DOM has an extra wrapper, a class that a framework renamed at build time, an element that React or HTMX inserts after the stylesheet was written, and content inside a shadow root, which outer page rules cannot reach at all."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Read the Styles pane as a list of losers",
      "x": "In Chrome and Firefox DevTools, every rule that matched the element is listed, newest winner first. Properties that lost are struck through. Hovering a struck-through property tells you why, and the Computed pane lets you expand any property to jump straight to the declaration that actually won."
    },
    {
      "t": "h2",
      "x": "The order the browser really uses"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser works down a fixed list of tiebreakers and stops at the first one that separates them. Specificity sits near the bottom. That is why a rule with four classes can still lose to a rule with one."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author styles beat user styles beat browser defaults, but `!important` inverts that, so a user's important declaration beats an author's important one. Active transitions sit above everything.",
        "**Context.** Declarations from a shadow tree and from the outer document are ordered against each other.",
        "**Element-attached styles.** Anything in a `style` attribute wins over every selector-based author rule of the same importance.",
        "**Cascade layers.** Unlayered normal declarations beat layered ones, and later layers beat earlier layers.",
        "**Scope proximity.** Where `@scope` is involved, the rule whose scope root is nearer the element wins.",
        "**Specificity.** Only now does the browser count the selector.",
        "**Order of appearance.** Last one in the final stylesheet wins."
      ]
    },
    {
      "t": "p",
      "x": "Step seven catches people out in bundled projects. \"Last in the stylesheet\" means last in the file the browser received, and that file is assembled by a bundler from an import graph you may not have looked at. Two components with equally specific selectors will fight, and the winner depends on which module got imported first. Changing an unrelated import can change your layout. If that is happening to you, the fix is a layer, not a higher specificity."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "@scope support",
      "x": "`@scope` is the newest of these mechanisms. As of September 2026 it ships in Chrome, Edge and Safari and in current Firefox, but check caniuse against whatever baseline you actually support before relying on it."
    },
    {
      "t": "h2",
      "x": "Counting specificity properly"
    },
    {
      "t": "p",
      "x": "Specificity is a triple, usually written `(A, B, C)`. Compare A first; only if A ties do you look at B. There is no carrying, so a thousand classes never add up to one ID. Browsers do cap these counters internally, but the caps are high enough that you should treat them as unbounded and never write code that depends on overflow."
    },
    {
      "t": "table",
      "head": [
        "Column",
        "Counts",
        "Does not count"
      ],
      "rows": [
        [
          "A (IDs)",
          "`#main`",
          ""
        ],
        [
          "B (classes)",
          "`.card`, `[data-open]`, `:hover`, `:nth-child()`",
          ""
        ],
        [
          "C (types)",
          "`div`, `::before`, `::marker`",
          ""
        ],
        [
          "Zero",
          "`*`, `>`, `+`, `~`, `:where()`",
          "Combinators and the universal selector add nothing"
        ]
      ],
      "caption": "Attribute selectors weigh the same as classes. Pseudo-elements weigh the same as element names."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,0) */   .card { color: red }\n/* (0,2,0) */   .card.is-active { color: blue }\n/* (0,1,1) */   a.card { color: green }\n/* (1,0,0) */   #app { color: rebeccapurple }\n\n/* :is() and :has() and :not() take their MOST specific argument */\n/* (1,0,0) */   :is(#app, .card) { color: teal }\n/* (0,1,0) */   :not(.card) { color: teal }\n\n/* :where() always contributes zero, including its arguments */\n/* (0,0,1) */   :where(#app .card) a { color: teal }\n\n/* Nesting: & behaves like :is() of the whole parent selector list */\n#app, .card {\n  & a { color: teal }   /* (1,0,1), because :is(#app, .card) is (1,0,0) */\n}"
    },
    {
      "t": "p",
      "x": "That last example is the one worth memorizing. Nested CSS looks tidy and quietly inherits the specificity of the most aggressive selector in the parent list. A single stray ID at the top of a nested block raises the specificity of everything underneath it."
    },
    {
      "t": "p",
      "x": "The practical use of `:where()` is the opposite trick. Wrap the parts of a selector that exist for targeting rather than for weight, and the rule becomes easy to override later. Library authors use this constantly, and it is the reason a well-built component library can be restyled with a single class while a hand-rolled one needs `!important` everywhere."
    },
    {
      "t": "h2",
      "x": "Cascade layers beat specificity outright"
    },
    {
      "t": "p",
      "x": "Layers are the step most likely to produce a result that looks impossible. A layered rule with an ID loses to an unlayered rule with one class. Nothing is broken. Layer order was decided at step four and specificity never got a turn."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One @layer statement fixes the order for the whole document. */\n@layer reset, base, components, utilities;\n\n@layer components {\n  #app .btn { background: navy }      /* (1,1,0) */\n}\n\n@layer utilities {\n  .bg-white { background: white }     /* (0,1,0) */\n}\n\n/* An unlayered rule outranks BOTH of the above. */\n.btn { background: hotpink }          /* (0,1,0), wins */"
    },
    {
      "t": "p",
      "x": "Declare your layer order once, near the top, before any layer has content. Layers are ordered by first mention, so a stray `@layer foo { }` inside an imported file can append a layer you did not plan for. If a third-party stylesheet is fighting you, import the whole thing into a low-priority layer: `@import url(vendor.css) layer(vendor);` puts every rule in that file below your own work regardless of how specific its selectors are."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "Among important declarations, the ordering flips: earlier layers win over later ones, and an important declaration inside a layer beats an important unlayered one. So `!important` inside your `reset` layer outranks `!important` in `utilities`. This is deliberate, and it is a good reason to keep important declarations rare enough to reason about."
    },
    {
      "t": "h2",
      "x": "When !important is defensible"
    },
    {
      "t": "p",
      "x": "It has a bad reputation and mostly deserves it, but it is the correct tool in a few situations. Overriding a third-party widget you cannot rebuild. Beating an inline `style` attribute written by a script you do not control, which nothing else can do. Forcing a print or reduced-motion override that must apply no matter what. Those are real cases."
    },
    {
      "t": "p",
      "x": "What it should not be is a way to win an argument with your own stylesheet. Each `!important` raises the floor for the next override, and a codebase two years into that habit needs `!important` on everything just to stay functional. If you reach for it inside your own components, the honest fix is usually a layer or a less specific selector."
    },
    {
      "t": "h2",
      "x": "The rule applies, but the value is thrown away"
    },
    {
      "t": "p",
      "x": "Sometimes nothing in the cascade is wrong. The declaration wins and still does nothing, because the browser discarded the value or the property simply does not apply to that element."
    },
    {
      "t": "ul",
      "items": [
        "**Invalid value.** One bad declaration is dropped and the rest of the block is kept. DevTools strikes it through and shows a warning triangle next to it.",
        "**Custom property poisoning.** An unregistered custom property accepts almost any token stream, so the error surfaces later, at the point of substitution.",
        "**Shorthand reset.** A later `background: url(...)` resets `background-color` to transparent. The same trap exists with `font`, `grid-area`, `inset` and `border`.",
        "**Property does not apply.** `width` on a non-replaced inline element, `gap` outside flex or grid, `z-index` without a positioning or layout context that creates a stacking order.",
        "**Something animates it.** While a CSS animation is running, its declarations sit above normal author rules, so your static value is correct and invisible.",
        "**Inheritance, not the cascade.** An inherited property with no matching rule at all comes from an ancestor, which is a different problem to debug."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": ":root { --brand: #gg0055 }   /* parsed fine: custom properties accept nearly anything */\n\n.headline {\n  color: crimson;\n  color: var(--brand);       /* substitutes to #gg0055 -> invalid at computed-value time */\n}\n/* Result: the heading inherits its parent's color.\n   It does NOT fall back to crimson. */\n\n.panel {\n  --pad: ;                   /* an empty value is valid, not \"missing\" */\n  padding: var(--pad, 1rem); /* the fallback is skipped; padding ends up unset */\n}"
    },
    {
      "t": "p",
      "x": "This failure mode is worth knowing because it breaks the mental model most of us carry. An ordinary invalid declaration falls back to the previous one in the block. A declaration that becomes invalid after `var()` substitution does not: it behaves as `unset`, which means inherited for inherited properties and initial for the rest. The old value you thought you had as a safety net is gone."
    },
    {
      "t": "h2",
      "x": "A diagnostic order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element matches",
          "x": "Run the selector in the console. An empty NodeList ends the investigation immediately.",
          "code": "document.querySelectorAll('.card > .title').length"
        },
        {
          "title": "Look for a strikethrough with a warning icon",
          "x": "That means the value was rejected, not overridden. Fix the syntax and stop reading about specificity."
        },
        {
          "title": "Use the Computed pane, not the Styles pane",
          "x": "Expand the property in question. DevTools names the winning declaration and its source file, which is faster than guessing."
        },
        {
          "title": "Check for a style attribute",
          "x": "Inline styles beat every normal selector-based rule. Ask what is setting it, since it is usually a script or a chart library rather than your CSS."
        },
        {
          "title": "Check layers before counting selectors",
          "x": "List the layer order and note whether the winner is unlayered. Both Chrome and Firefox DevTools label author rules with their layer."
        },
        {
          "title": "Only now compare specificity",
          "x": "Write both triples out. If they tie, the winner is whichever appears later in the served stylesheet, which your bundler decides."
        }
      ]
    },
    {
      "t": "p",
      "x": "Following that order instead of jumping to step six saves real time. Most of the cases that feel mysterious are resolved by step two or step four, and the ones that genuinely come down to selector weight are usually obvious once you write the two triples side by side."
    },
    {
      "t": "h2",
      "x": "Related reading"
    },
    {
      "t": "cards",
      "items": [
        {
          "eyebrow": "Guide",
          "title": "CSS Grid vs. Flexbox",
          "desc": "A decision rule for picking a layout module, plus the details that prevent overflow and alignment bugs.",
          "href": "/guides/css-grid-vs-flexbox/"
        },
        {
          "eyebrow": "Tool",
          "title": "Color Contrast Checker",
          "desc": "Check foreground and background pairs against WCAG AA and AAA before shipping a theme override.",
          "href": "/tools/color-contrast-checker/"
        },
        {
          "eyebrow": "Guide",
          "title": "React useState Not Updating",
          "desc": "The component equivalent of this problem: the value is right, the render you are looking at is not.",
          "href": "/guides/react-usestate-not-updating/"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks correct?",
          "a": "In rough order of likelihood: the selector matches nothing because the DOM differs from what you expect, the value is invalid and was dropped, another rule wins on layers or the `style` attribute, or the property does not apply to that element's display type. Specificity is a common cause but far from the first one to check. Run the selector through `document.querySelectorAll()` before anything else."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes. A `style` attribute beats all normal selector-based author rules, but an author `!important` declaration in a stylesheet beats a normal inline style. The only thing that beats that is `!important` written inside the `style` attribute itself, or a user stylesheet's important declaration. This is the one situation where `!important` is genuinely the right answer rather than a shortcut."
        },
        {
          "q": "Can I beat an ID selector by repeating a class?",
          "a": "No. Specificity columns do not carry, so `.a.a.a.a` is `(0,4,0)` and still loses to `#a` at `(1,0,0)`. Repeating a class is a legitimate way to outrank other class-based rules without adding an ID, and some teams use it deliberately, but it can never cross into the ID column. If you need to beat an ID without adding one, use a cascade layer or `!important`."
        },
        {
          "q": "Why does my Tailwind or utility class lose to a component style?",
          "a": "Almost always layer order or source order. If utilities live in a later layer than components, they win; if the component CSS is unlayered and the utilities are layered, the component wins no matter how specific either selector is. Check which rules are unlayered first, then check whether your bundler is emitting the component CSS after the utility CSS."
        },
        {
          "q": "Do media queries add specificity?",
          "a": "No. `@media`, `@supports` and `@container` are conditions on whether a rule applies at all; they contribute nothing to the specificity triple. Two rules with identical selectors, one inside a media query and one outside, are separated by source order alone. Putting the media query last in the file is what makes it win, not the media query itself."
        },
        {
          "q": "How do I see which CSS rule is actually winning?",
          "a": "Select the element, open the Computed pane rather than the Styles pane, and expand the property. Both Chrome and Firefox show the winning declaration with a link to its source file and line, along with the overridden ones beneath it. The Styles pane is useful for reading struck-through properties and spotting invalid values, but the Computed pane answers the question directly."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-28",
  "updated": "2026-09-28",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
