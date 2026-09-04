module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers and !important",
  "eyebrow": "Guides",
  "description": "Your CSS rule is not applying. Work out whether the cause is specificity, cascade layers, source order, or a value the browser silently discarded.",
  "standfirst": "Four different failures look identical in the browser. This walks through how to tell them apart in about thirty seconds, then explains the cascade rules that decide which declaration wins.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "important css override",
    "specificity calculator"
  ],
  "cardDesc": "Tell apart the four reasons a CSS declaration loses, and fix the cause instead of stacking on !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "First check whether your rule appears in DevTools at all. Struck-through means it lost the cascade. Missing entirely means the selector never matched, the value was invalid, or the sheet did not load.",
        "Specificity is three counters compared left to right: IDs, then classes plus attributes plus pseudo-classes, then element types plus pseudo-elements. There is no carrying, so eleven classes never add up to one ID.",
        "Cascade layers are consulted **before** specificity. A single class in a later layer beats an ID selector in an earlier one.",
        "Unlayered normal declarations beat every layer. For `!important` declarations the whole layer order flips, and unlayered ones lose.",
        "`!important` is a cascade origin escalation, not a specificity boost. Two important author declarations still get resolved by specificity between themselves.",
        "Plenty of failures are not cascade failures at all: a shorthand overwriting a longhand, a property that does not apply to that display type, or a value the parser threw away."
      ]
    },
    {
      "t": "h2",
      "x": "Thirty seconds of triage before you touch the selector"
    },
    {
      "t": "p",
      "x": "Open the element in DevTools and look at the Styles pane. Your declaration is in one of three states, and each points at a different bug."
    },
    {
      "t": "ul",
      "items": [
        "**Present, struck through.** Something else won. This is the only case that is genuinely about specificity, layers or source order, and the pane will show you the rule that beat it just above.",
        "**Present, not struck through, but the page still looks wrong.** The declaration is applying and doing nothing useful. Check the Computed pane for the value the browser actually resolved, then ask whether the property does anything on this element. `width` on a non-replaced inline element is ignored. `z-index` on a `position: static` element is ignored. `margin-top` may be collapsing into a parent rather than disappearing.",
        "**Absent from the pane completely.** The selector did not match this element, the stylesheet did not load or was cached from an earlier build, or the declaration was dropped at parse time because the property name or the value was invalid. A single bad declaration is discarded on its own, but a syntax error such as a missing brace can swallow everything after it in that block."
      ]
    },
    {
      "t": "p",
      "x": "That third case is the one people misdiagnose most, because a rule that never applied and a rule that lost look the same on screen. Test the selector directly in the console rather than reading it again."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does the selector match anything at all?\ndocument.querySelectorAll('nav.primary a.link').length\n\n// Does it match the element you have selected in the Elements panel?\n$0.matches('nav.primary a.link')\n\n// What did the browser actually resolve, whatever the Styles pane shows?\ngetComputedStyle($0).color"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Turn on \"Show all\" in Computed",
      "x": "Chrome and Edge let you expand each computed property to see every declaration that tried to set it, in cascade order, with the winner at the top and the losers struck through below. Firefox shows the same thing in its Computed panel. This answers \"what beat me\" faster than any amount of reasoning about selectors."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple, usually written (A, B, C). A counts ID selectors. B counts class selectors, attribute selectors and pseudo-classes. C counts element type selectors and pseudo-elements. Compare A first; only if A ties do you look at B, and only if B ties do you look at C."
    },
    {
      "t": "p",
      "x": "The critical property is that the columns are independent. This is not a three digit number in base ten. A selector with fifteen classes has specificity (0, 15, 0) and still loses to `#header`, which is (1, 0, 0). If you have ever added a third class to a selector hoping to tip it over the edge, this is why nothing changed."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,1) */\na { color: red; }\n\n/* (0,1,1) */\na.link { color: blue; }\n\n/* (0,2,1) */\nnav.primary a.link { color: green; }\n\n/* (1,0,0) beats all three */\n#nav a { color: rebeccapurple; }\n\n/* combinators add nothing: > + ~ and descendant space are free */\n/* the universal selector adds nothing either */\n* { color: black; }   /* (0,0,0) */"
    },
    {
      "t": "p",
      "x": "Attribute selectors sit in the same column as classes, so `[data-state=\"open\"]` and `.open` are worth exactly the same. Pseudo-elements like `::before` sit with element types, in the C column. Inline `style` attributes are not part of the triple at all; they win over any selector in the same origin because the cascade puts element-attached styles above all of them, which is a separate step."
    },
    {
      "t": "h3",
      "x": "The functional pseudo-classes that change the maths"
    },
    {
      "t": "p",
      "x": "Four selectors behave differently from everything else, and they are the ones worth memorising because they give you real control."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* :where() always contributes ZERO, whatever is inside it */\n:where(#sidebar, .panel) .title { }   /* (0,1,0) */\n\n/* :is() takes the specificity of its MOST specific argument */\n:is(#sidebar, .panel) .title { }      /* (1,1,0) */\n\n/* :not() also takes its argument's specificity */\n.title:not(#draft) { }                /* (1,1,0) */\n\n/* :has() behaves like :is() for this purpose */\n.card:has(#featured) { }              /* (1,1,0) */\n\n/* CSS nesting: & resolves like :is(), so it inherits the\n   most specific branch of the parent selector list */\n#hero, .banner {\n  & h2 { }                            /* (1,0,1) */\n}"
    },
    {
      "t": "p",
      "x": "`:where()` is the useful one. Wrap the parts of a selector that exist for targeting rather than for weight, and you get a rule that is trivial to override later. Reset and base layers are the obvious home for it. The trap is the opposite case: writing `:is()` or nesting a rule under an ID because it reads nicely, then finding that every override downstream has to carry an ID too."
    },
    {
      "t": "h2",
      "x": "Cascade layers are decided before specificity"
    },
    {
      "t": "p",
      "x": "This is where a lot of otherwise correct specificity reasoning gives the wrong answer. `@layer` creates ordered buckets inside the author origin, and layer order is compared before any specificity comparison happens. A declaration in a later layer wins over a declaration in an earlier layer even if the earlier one is dramatically more specific."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. Later layers win. */\n@layer reset, vendor, components, utilities;\n\n@layer vendor {\n  #app .btn--primary { background: navy; }   /* (1,2,0) */\n}\n\n@layer utilities {\n  .bg-teal { background: teal; }             /* (0,1,0), and it wins */\n}\n\n/* Unlayered styles beat every layer, no matter how specific\n   the layered rule was. This one wins over both of the above. */\n.btn { background: hotpink; }"
    },
    {
      "t": "p",
      "x": "The order is fixed by that first `@layer` statement, not by where the blocks appear in the file, which is what makes layers worth using. You can import a third party stylesheet into an early layer and stop fighting its selectors forever. Anything unlayered floats to the top of the author origin, so a codebase that is half migrated will find its old unlayered rules quietly beating the new layered ones."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Important declarations reverse the layer order",
      "x": "For `!important` declarations everything flips. The **earliest** layer wins, and unlayered important declarations lose to important declarations in any layer. This is deliberate and follows the same logic as the origin flip, but it surprises everyone the first time. If you are debugging an important rule and reasoning \"later layer, so it wins\", you have the comparison backwards."
    },
    {
      "t": "p",
      "x": "Cascade layers shipped in Chrome, Firefox and Safari during the first quarter of 2022 and are supported by every current evergreen browser as of September 2026. Check caniuse against your own support matrix before relying on them, particularly if you still serve older WebKit builds on locked-down mobile devices. There is no polyfill worth the trouble; the fallback is that layered rules behave as though the layers did not exist, which reorders your entire stylesheet."
    },
    {
      "t": "h2",
      "x": "The full order the browser uses"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser works down this list and stops at the first step that separates them."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What is compared",
        "Note"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "User agent, user, author, and whether the declaration is `!important`",
          "Important author styles beat normal author styles, but lose to important **user** styles. That last part exists for accessibility overrides."
        ],
        [
          "2. Context",
          "Shadow tree versus outer document, and `@scope` proximity",
          "Outer styles win over shadow tree styles for normal declarations; the reverse for important ones."
        ],
        [
          "3. Element-attached styles",
          "The inline `style` attribute",
          "Beats every selector in the same origin. This is why inline styles feel unbeatable without `!important`."
        ],
        [
          "4. Cascade layers",
          "Layer order within the origin",
          "Reversed for `!important`. Unlayered normal declarations sit above all layers."
        ],
        [
          "5. Specificity",
          "The (A, B, C) triple",
          "Only reached if everything above tied."
        ],
        [
          "6. Order of appearance",
          "Whichever declaration is later in the document",
          "Equal specificity means the last one wins. Includes the order your bundler emitted the files in."
        ]
      ],
      "caption": "Simplified from CSS Cascading and Inheritance Level 5. Animations sit above normal author styles, and transitions sit above everything including important declarations."
    },
    {
      "t": "p",
      "x": "Step six causes a specific and annoying class of bug. Two rules with identical specificity, one of which wins locally and loses in production, usually means your build changed the concatenation order of the stylesheets. Code splitting and lazily injected `<style>` tags both do this. The fix is not a more specific selector; it is putting the two rules into named layers so the order stops depending on emission order."
    },
    {
      "t": "h2",
      "x": "!important, and the three things to try first"
    },
    {
      "t": "p",
      "x": "`!important` is not a specificity boost. It moves the declaration into a different bucket at step one, above all normal author declarations. That is why it works on almost everything, and also why it stops helping the moment a second important declaration shows up: between two important author declarations, the browser falls back to layers, then specificity, then order, exactly as before. An arms race of important flags resolves the same way as an arms race of ID selectors, only with worse diagnostics."
    },
    {
      "t": "p",
      "x": "Before reaching for it, try these."
    },
    {
      "t": "ol",
      "items": [
        "**Lower the winner instead of raising the loser.** Wrap the offending selector's structural parts in `:where()`, or drop the ID for a class. One edit, and every future override gets easier rather than harder.",
        "**Put the two rules in explicit layers.** `@layer framework, app;` makes the intent readable and removes the dependence on file order entirely.",
        "**Use `revert-layer` or `revert`.** `all: revert-layer` sends a property back to the value it would have had from earlier layers, which is often what people actually want when they write `!important` on a reset."
      ]
    },
    {
      "t": "p",
      "x": "There are legitimate uses. Utility classes whose entire contract is \"this always applies\" are a reasonable case, and so are one-off patches over a third party widget you cannot edit. Both are better expressed with layers now, but important is still the pragmatic answer when you are patching a stylesheet you do not control and cannot re-order."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "Do not add !important to fix a transition or animation",
      "x": "Declarations marked important are excluded from CSS animations, so an important value inside a `@keyframes` block is ignored outright. In the other direction, an active transition sits at the very top of the cascade and overrides even important declarations while it is running. If a value snaps back mid animation, the cause is one of those two rules, not specificity, and adding important either does nothing or makes it worse."
    },
    {
      "t": "h2",
      "x": "Failures that look like specificity and are not"
    },
    {
      "t": "p",
      "x": "Once you can read the Styles pane confidently, most remaining \"my rule is not applying\" bugs turn out to be one of these."
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand quietly resetting a longhand.** `background: url(x.png)` later in the cascade resets `background-color` to its initial value, because a shorthand sets every longhand it owns. Same for `font`, `border` and `grid-area`. The Styles pane shows the longhand as struck through and the culprit is a property with a different name.",
        "**Invalid values, dropped at parse time.** `width: 100px auto` or a typo'd custom property name produces nothing at all. Custom properties are the sharp edge: `color: var(--brand-colour)` with an undefined variable does not fall back to the previous declaration, it makes the property invalid at computed value time and the element inherits instead.",
        "**Inheritance versus the cascade.** An inherited value on the element loses to *any* declaration that targets the element directly, however weak. A `(0,0,1)` type selector on the child beats a `(1,0,0)` ID selector on the parent, because inheritance only supplies a value when nothing set one locally.",
        "**The property does not apply to that element.** `justify-content` does nothing on a block container. `height` percentages need a resolvable parent height. Grid and flex properties only take effect on the right kind of parent, which is worth checking against our [CSS Grid vs. Flexbox guide](/guides/css-grid-vs-flexbox/) when a gap or alignment rule seems inert.",
        "**Something is not the element you think.** Framework components often forward `className` to an inner wrapper, or drop it entirely. Confirm with `$0` in the console rather than by reading JSX."
      ]
    },
    {
      "t": "h2",
      "x": "A practical convention"
    },
    {
      "t": "p",
      "x": "The version of this that holds up on a large codebase is boring. Declare your layer order in one place at the top of the entry stylesheet. Keep resets and vendor CSS in the earliest layers, components in the middle, utilities last. Keep specificity inside every layer as flat as you can manage, ideally one class, using `:where()` for the structural context. Then almost every override becomes a question of which layer to put the rule in, which is a question with an obvious answer, instead of a question about how many classes to stack, which is not."
    },
    {
      "t": "p",
      "x": "That still leaves you reading the Styles pane occasionally. The difference is that the answer becomes a one line fix rather than an escalation."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even with !important?",
          "a": "Three likely causes. Another important declaration is beating yours, in which case layers, specificity and source order resolve it and the layer order is reversed for important declarations. The rule never matched the element, so check `$0.matches(...)` in the console. Or the declaration is invalid and was dropped at parse time, which you can confirm because it will be missing from the Styles pane entirely rather than struck through. Running transitions also override important declarations while they are active."
        },
        {
          "q": "Does an inline style always win?",
          "a": "Within the author origin, yes, against any selector. Element-attached styles are compared before layers and specificity, so nothing you write in a stylesheet outranks them. An `!important` declaration in a stylesheet does beat a normal inline style, because importance is compared first. An important inline style beats that in turn, and only an important user or user agent declaration goes higher."
        },
        {
          "q": "How many classes equal one ID in CSS specificity?",
          "a": "None. The columns never carry. A selector with a hundred classes is (0, 100, 0) and still loses to a single ID at (1, 0, 0). Old browser implementations that stored specificity in packed fields gave rise to the myth that a large enough number of classes overflows into the ID column, but that behaviour is not in the specification and you should not build on it."
        },
        {
          "q": "What is the specificity of :is(), :not() and :where()?",
          "a": "`:where()` always contributes zero, no matter what is inside it. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, so `:is(.a, #b)` counts as an ID. CSS nesting with `&` follows the `:is()` rule, which means nesting under a selector list that contains one ID makes every nested rule ID-weighted."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations. Layer order is compared before specificity, so one class in a later layer beats an ID selector in an earlier one. Unlayered normal declarations sit above every layer. For `!important` declarations the order reverses: earlier layers win, and unlayered important declarations rank lowest."
        },
        {
          "q": "How do I find out which rule is overriding mine?",
          "a": "Select the element, open the Computed panel, enable \"Show all\", and expand the property. Every declaration that tried to set it is listed in cascade order with a link to its source, winner first. That is faster and more reliable than reading selectors, and it will show you cases where the override came from a shorthand with a completely different property name."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model fits the problem, and why alignment properties sometimes do nothing.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check foreground and background pairs against WCAG AA and AAA before you ship the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same style of debugging applied to state that appears one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-04",
  "updated": "2026-09-04",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
