module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying: specificity, layers and !important",
  "eyebrow": "Guides",
  "description": "Specificity is only one step of the cascade. How a browser really resolves a property, what @layer changes, and when !important is the correct tool.",
  "standfirst": "The order a browser resolves a declaration in, how to read specificity as three numbers instead of one, and the non-specificity reasons a rule silently loses.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Read the cascade in the order the browser does: origin, layers, specificity, then document order.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is one step out of six. Check the earlier steps before you lengthen a selector.",
        "Specificity is a triple, `(ID, class, type)`, compared left to right with no carrying. One class beats eleven element selectors.",
        "Cascade layers are consulted before specificity. A weak selector in a later layer beats a strong one in an earlier layer.",
        "For normal declarations, unlayered CSS beats every layer. For `!important` declarations that order flips completely.",
        "If the selector does not appear in the DevTools Styles pane at all, the problem is matching or parsing, not weight."
      ]
    },
    {
      "t": "lede",
      "x": "A declaration can lose for at least six different reasons, and only one of them is specificity. The browser resolves each property on each element by walking a fixed order: origin and importance, then context, then inline styles, then cascade layers, then specificity, then document order. A rule that was eliminated at the layer step will not be rescued by another class. A declaration the parser threw away never entered the competition at all. So the useful first question is not how do I make this stronger, it is which step removed it."
    },
    {
      "t": "h2",
      "x": "Find the step that dropped it"
    },
    {
      "t": "p",
      "x": "Open the element in DevTools and read the Styles pane top to bottom. Three states matter, and they mean different things. A declaration with a line through it lost the cascade to something listed above it. A declaration with a warning icon next to it was invalid and was discarded at parse time, so it never competed. And a selector that does not appear in the pane at all never matched the element, which is by far the most common cause and the one people spend longest not checking."
    },
    {
      "t": "p",
      "x": "The Computed pane answers the follow-up question. Expand any property there and you get the winning declaration plus every overridden one, in resolution order, each with a link to its source line. That list is the cascade result for that one property on that one element. Specificity is not global and not per rule: it is recalculated per element, per property. The same stylesheet can win for `color` and lose for `background-color` in the same rule."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Check inheritance separately",
      "x": "An inherited value loses to any declaration that matches the element directly, no matter how weak that declaration is. Setting `color` on `body` will not colour your links, because the browser's own `a { color: ... }` rule matches the anchor directly and inheritance does not compete with it. In the Styles pane these appear under an `Inherited from` heading, visually separated for exactly this reason."
    },
    {
      "t": "h2",
      "x": "The order the browser resolves a property in"
    },
    {
      "t": "p",
      "x": "Origin and importance are decided first, before any selector is weighed. Nothing lower on this list can beat anything higher, however specific it is."
    },
    {
      "t": "table",
      "head": [
        "Precedence",
        "Source",
        "Notes"
      ],
      "rows": [
        [
          "1 (highest)",
          "Transition declarations",
          "A value being animated by a running transition wins outright, which is why a property can look ignored for a fraction of a second."
        ],
        [
          "2",
          "User agent `!important`",
          "Browser defaults marked important. Rare, and mostly around form control internals."
        ],
        [
          "3",
          "User `!important`",
          "The reader's own stylesheet or an accessibility override. Deliberately unbeatable by page authors."
        ],
        [
          "4",
          "Author `!important`",
          "Your stylesheets, and a `style` attribute declaration marked important."
        ],
        [
          "5",
          "Animation declarations",
          "A running `@keyframes` animation beats normal author rules for the properties it sets."
        ],
        [
          "6",
          "Author normal",
          "Almost everything you write."
        ],
        [
          "7",
          "User normal",
          "The reader's stylesheet, unmarked."
        ],
        [
          "8 (lowest)",
          "User agent normal",
          "Browser defaults: link colours, form control fonts, default margins."
        ]
      ],
      "caption": "Origin and importance, highest precedence first. Specificity is only compared between declarations that tie on this table."
    },
    {
      "t": "p",
      "x": "Two rows here surprise people. Animations sit above your normal rules, so a `@keyframes` step that sets `opacity` will beat `.thing { opacity: 1 }` for as long as it runs. And user importance outranks author importance, which is the whole point of `!important` in its original design: it existed so a reader could force a larger font and keep it, not so authors could win arguments with themselves."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "Count ID selectors, then class-like selectors (classes, attribute selectors, pseudo-classes), then type-like selectors (element names and pseudo-elements). Combinators and the universal selector contribute nothing."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "selector                     (ID, class, type)\n---------------------------------------------\n*                            (0, 0, 0)\nli                           (0, 0, 1)\nli::marker                   (0, 0, 2)\n.card                        (0, 1, 0)\n[data-state=\"open\"]          (0, 1, 0)\na:hover                      (0, 1, 1)\n.card p.intro                (0, 2, 1)\n#app .card > p               (1, 1, 1)\n:is(#app, .card) p           (1, 0, 1)   most specific argument counts\n:where(#app, .card) p        (0, 0, 1)   :where() always contributes zero\np:not(.intro, #skip)         (1, 0, 1)   :not() counts its heaviest argument"
    },
    {
      "t": "p",
      "x": "Compare the triples left to right and stop at the first difference. There is no carrying between the columns, so `(0,1,0)` beats `(0,0,11)` and always will. Any single ID beats any number of classes. This is why the old habit of writing specificity as a base-10 number like 0-1-0 becoming 10 is misleading: it suggests ten element selectors could add up to a class, and they cannot."
    },
    {
      "t": "h3",
      "x": ":where() is the useful one"
    },
    {
      "t": "p",
      "x": "`:where()` takes zero specificity regardless of what you put inside it. That makes it the right tool for anything you intend to be a default: base styles in a design system, resets, component defaults that consumers must be able to override with a plain class. `:is()` behaves the opposite way and quietly raises a selector's weight to that of its heaviest argument, so `:is(#app, .card)` is as strong as an ID even when it matched via `.card`."
    },
    {
      "t": "h3",
      "x": "Native nesting inherits the parent's weight"
    },
    {
      "t": "p",
      "x": "A nested rule resolves as though the parent selector were wrapped in `:is()`. That means nesting inside an ID drags the ID's weight into every child rule, which catches people migrating from Sass, where the same nesting produced the same result but was at least visible in the compiled output."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#sidebar {\n  .btn { color: blue; }   /* (1,1,0), not (0,1,0) */\n}\n\n/* If you only need the scoping, not the weight: */\n:where(#sidebar) {\n  .btn { color: blue; }   /* (0,1,0) */\n}"
    },
    {
      "t": "h2",
      "x": "Cascade layers decide before specificity does"
    },
    {
      "t": "p",
      "x": "`@layer` introduces a sorting step that runs earlier than specificity, so a one-class selector in a later layer beats an ID selector in an earlier one. Layer order is set by the first `@layer` statement that names them, which is why the convention is to declare the full order once at the top of the entry stylesheet."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, components, utilities;\n\n@layer components {\n  #sidebar .btn { color: blue; }   /* (1,1,0) */\n}\n\n@layer utilities {\n  .text-red { color: red; }        /* (0,1,0), and it wins: later layer */\n}\n\n/* Unlayered normal declarations beat every layer. */\n.btn { color: green; }             /* wins over both of the above */"
    },
    {
      "t": "p",
      "x": "That last line is the rule people trip over. Unlayered CSS is not treated as layer zero: for normal declarations it sits above all named layers. Migrating a codebase to layers halfway therefore does very little, because the legacy unlayered sheet still outranks the new structure. Move everything, or nothing."
    },
    {
      "t": "p",
      "x": "Importance reverses the whole arrangement. Among `!important` author declarations, earlier layers beat later ones and unlayered is the weakest of all."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base      { .x { color: red !important; } }    /* this one wins */\n@layer overrides { .x { color: blue !important; } }\n.x { color: green !important; }                       /* unlayered important: weakest */"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support",
      "x": "Cascade layers shipped in Chrome 99, Firefox 97 and Safari 15.4, all in early 2022, so they are safe for most projects now. `@scope`, which adds a proximity tiebreak between specificity and document order, arrived considerably later and reached Firefox last. Check current support against your own browser matrix rather than trusting this paragraph, which describes the position as of September 2026."
    },
    {
      "t": "h2",
      "x": "What !important actually beats"
    },
    {
      "t": "p",
      "x": "Marking a declaration important moves it from row 6 of the table above to row 4. It does not make it infinitely strong. It still loses to a user stylesheet, to a browser important default, and to any other author important declaration that outranks it on layer order, then inline placement, then specificity, then document order. Within author importance the order is: a `style` attribute declaration marked important, then layered declarations from earliest layer to latest, then unlayered."
    },
    {
      "t": "p",
      "x": "There is one thing `!important` does uniquely well. An inline `style` attribute set by a third-party widget or an old jQuery plugin cannot be beaten from a stylesheet by any selector, because inline styles are sorted above all of them. An important declaration in your stylesheet is the only way to override it without touching the markup. That is a legitimate use and worth keeping in the toolbox."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The escalation problem",
      "x": "The cost of `!important` is not the first one, it is the fourth. Once two important declarations meet, the only remaining tiebreaks are layer, specificity and source order, and the usual response is to add an ID or duplicate a class to force a win. Cascade layers solve the same problem without the ratchet, because a layer can be reordered later without editing a single selector."
    },
    {
      "t": "h2",
      "x": "Reasons that have nothing to do with specificity"
    },
    {
      "t": "p",
      "x": "Before spending any more time on weight, rule these out. Most of them show up in DevTools in under a minute, and several of them are invisible in the source file."
    },
    {
      "t": "ol",
      "items": [
        "**The declaration is invalid and was discarded.** CSS error handling is silent by design: one bad property or value is dropped and the rest of the rule still applies.",
        "**A stray space changed the selector.** `.menu:hover .item` and `.menu :hover .item` are different selectors and both parse cleanly.",
        "**A shorthand later in the sheet reset your longhand.** `background: url(x.png)` sets `background-color` back to `transparent`. `font` resets `line-height`. `all: unset` resets nearly everything.",
        "**The property does not apply to that element.** `width` and vertical margins do nothing on a non-replaced inline element. `z-index` does nothing without `position` or a flex, grid or other stacking context.",
        "**The class name on the element is not the one you wrote.** CSS Modules, styled-components and most CSS-in-JS tools hash the name at build time. Copy the class from the DOM, not from the source.",
        "**A media or container query is not matching.** DevTools shows non-matching at-rules dimmed rather than hiding them, so scroll for a grey block.",
        "**File order differs from what you expect.** Two equally specific rules are resolved by document order, and a bundler, a dynamically injected `<style>` or a late `<link>` can reverse it between dev and production builds.",
        "**The element is not the one you think.** Pseudo-elements, slotted shadow DOM content and framework wrappers all produce boxes that look right in the viewport and are not the node your selector targets."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  colour: red;                 /* unknown property: dropped */\n  margin-top: 10;              /* no unit: dropped */\n  width: calc(100% -20px);     /* needs spaces around the minus: dropped */\n  color: red;                  /* this one survives */\n}"
    },
    {
      "t": "h2",
      "x": "Fixes that hold up over time"
    },
    {
      "t": "p",
      "x": "The structural answer is to keep author specificity flat and let layers do the ordering. In practice that means a small number of conventions, applied consistently."
    },
    {
      "t": "ul",
      "items": [
        "Declare your layer order once, at the top of the entry stylesheet, and put third-party CSS in an early layer so your own rules win without escalation.",
        "Do not leave a large unlayered sheet behind during a migration. It outranks every layer you just created.",
        "Wrap library and default styles in `:where()` so consumers can override them with a single plain class.",
        "Style with one class per component and reach for state via a data attribute, such as `[data-state=\"open\"]`, which weighs the same as a class and reads better in the DOM.",
        "Avoid ID selectors for styling entirely. They are unmatchable by any number of classes and there is no way back down."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout module actually describes the problem you have.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same shape of problem one layer up: the value is fine, the timing is not.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guides"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Usually one of four things. Another important declaration outranks yours on layer order, inline placement or specificity. The declaration is invalid and was dropped at parse time. A running transition or a user stylesheet sits above author importance. Or the selector never matched the element, in which case importance is irrelevant. Check whether the rule appears in the DevTools Styles pane at all before assuming it is a weight problem."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "Yes, that is its one genuinely unique power. A normal inline `style` attribute declaration beats every selector in your stylesheets, but an important declaration in a stylesheet beats it. The exception is an inline declaration that is itself marked important, which outranks important declarations in author stylesheets."
        },
        {
          "q": "Does one class beat ten element selectors?",
          "a": "Yes. Specificity is compared column by column from the left, with no carrying, so `(0,1,0)` beats `(0,0,10)` and any number of type selectors will never add up to a class. The same logic means a single ID beats any number of classes."
        },
        {
          "q": "How do I override a third-party stylesheet without !important?",
          "a": "Import it into an early cascade layer. Everything in a later layer then wins regardless of how many IDs the vendor used, and you never touch the vendor selectors. If the library injects inline styles rather than a stylesheet, layers will not help and an important declaration is the correct answer."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "They are checked before it. Two declarations are sorted by layer first, and specificity is only compared when they are in the same layer. A single class in a later layer therefore beats an ID selector in an earlier one. Remember that unlayered normal declarations sit above all named layers, and that important declarations reverse the layer order entirely."
        },
        {
          "q": "Why does my utility class lose to a component class?",
          "a": "Most often because the component selector is more specific and both are in the same layer, or because the component CSS is unlayered while the utilities are in a layer. Put utilities in the last declared layer, component styles in an earlier one, and make sure neither sheet is left unlayered."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-03",
  "updated": "2026-09-03",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
