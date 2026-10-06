module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity and the Cascade: Why a Rule Loses",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Work out why a CSS declaration loses: specificity counting, inheritance, cascade layers, dropped values and the narrow cases where !important is correct.",
  "standfirst": "Most rules that \"do nothing\" are either not matching at all or losing to something that is compared before specificity. Here is the order to check, and how to fix each case without escalating.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "Specificity counting, cascade layers, inheritance and the dropped declarations that look like specificity bugs.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Open devtools before you count anything. If your selector is not listed in the Styles pane at all, the problem is matching or loading, not specificity.",
        "Specificity is three numbers compared left to right: IDs, then classes and attributes and pseudo-classes, then types and pseudo-elements. The columns do not carry, so `(0,20,0)` still loses to `(1,0,0)`.",
        "An inherited value loses to any declaration that matches the element directly, however specific the ancestor rule was. This is the most common false specificity bug.",
        "Cascade layers are compared before specificity. An unlayered `a { color: blue; }` beats `#nav a { color: red; }` written inside `@layer framework`.",
        "For `!important` declarations the layer order flips: earlier layers win, and unlayered `!important` is the weakest of the author important declarations.",
        "`:where()` contributes zero specificity. Reach for it, and for layers, before reaching for `!important`."
      ]
    },
    {
      "t": "h2",
      "x": "Prove the rule matches before you count anything"
    },
    {
      "t": "p",
      "x": "The useful first question is not which rule wins. It is whether your rule is in the comparison at all. A selector that never matches and a selector that matches and loses look identical from the rendered page, and they need completely different fixes. Five minutes in the Styles pane saves an hour of guessing."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Select the element and read the Styles pane top to bottom",
          "x": "Chrome, Firefox and Safari all list matching rules in winning order, most relevant first, with the source file on the right. Your rule should be in that list."
        },
        {
          "title": "If your declaration is there with a line through it, you lost a comparison",
          "x": "Something above it won. Read what is above it: that tells you whether you are fighting specificity, order, a layer, an inline style or a shorthand."
        },
        {
          "title": "If it is not there at all, the selector does not match this element",
          "x": "Check for a typo in the class name, a class that JavaScript adds later, a parent that is not where you assumed, a stylesheet that 404ed, or a scoped build artifact that renamed your class."
        },
        {
          "title": "Switch to Computed and expand the property",
          "x": "Devtools shows which rule supplied the final value and lists the ones it beat. This is the fastest way to find a winner you did not write, such as a user agent default or a library rule."
        },
        {
          "title": "Only now start counting specificity",
          "x": "By this point you usually know you do not need to."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Look for the warning icon",
      "x": "Devtools puts a small warning triangle next to declarations the parser dropped. An unknown property or an invalid value is discarded at parse time, which looks exactly like losing the cascade. That icon is easy to scroll straight past."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Every selector that matches an element produces three numbers. Count the IDs. Count the classes, attribute selectors and pseudo-classes. Count the element types and pseudo-elements. Write that as (A,B,C), then compare two selectors column by column from the left. The first column that differs ends the comparison."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,1) */\na { color: blue; }\n\n/* (0,1,0) */\n.callout { color: rebeccapurple; }\n\n/* (0,2,1) */\n.callout.is-active a { color: green; }\n\n/* (1,0,0) wins over all of the above */\n#footer { color: grey; }\n\n/* (0,0,0): :where() always contributes nothing */\n:where(#footer, .callout) a { color: red; }"
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
          "`a`, `::before`",
          "(0,0,1)",
          "Element types and pseudo-elements share the last column"
        ],
        [
          "`.btn`, `[type=\"text\"]`, `:hover`",
          "(0,1,0)",
          "Classes, attribute selectors and pseudo-classes are all worth the same"
        ],
        [
          "`#main`",
          "(1,0,0)",
          "One ID outranks any number of classes"
        ],
        [
          "`.btn.btn-primary:hover`",
          "(0,3,0)",
          "Three class-level components in one selector"
        ],
        [
          "`*`, `:where(.card)`",
          "(0,0,0)",
          "The universal selector and `:where()` add no weight"
        ],
        [
          "`:is(#main, .side) p`",
          "(1,0,1)",
          "`:is()`, `:not()` and `:has()` take their most specific argument"
        ],
        [
          "`style=\"color: red\"`",
          "not applicable",
          "Inline styles are compared before specificity and beat every author selector"
        ]
      ],
      "caption": "Specificity components for common selector shapes."
    },
    {
      "t": "p",
      "x": "Two details catch people out. First, the columns do not carry into each other. Twenty classes give you (0,20,0), one ID gives you (1,0,0), and the ID column is compared first, so the 20 never participates. The old \"100 for an ID, 10 for a class, 1 for an element\" arithmetic gives the right answer for almost every realistic selector and the wrong answer at exactly this edge. Second, pseudo-classes carry class weight. `a:hover` is (0,1,1) and `.nav a` is also (0,1,1). They tie, so whichever appears later in the final stylesheet wins, which is why the old `:link`, `:visited`, `:hover`, `:active` ordering still matters."
    },
    {
      "t": "p",
      "x": "Conditional rules add nothing. A declaration inside `@media (min-width: 60em)`, `@supports` or `@container` has the same specificity as the same declaration written outside it, so it loses to an equally specific rule that comes later in the file. Moving the media query block below the rule it is meant to override is frequently the entire fix."
    },
    {
      "t": "h2",
      "x": "Inheritance loses to anything that matches directly"
    },
    {
      "t": "p",
      "x": "Inherited values are not part of the specificity comparison. Inheritance is the fallback used when no declaration matched the element at all. If the element has its own matching rule, the ancestor never gets a turn."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".theme-dark { color: #eaeaea; }  /* descendants inherit this */\na            { color: #0645ad; }  /* matches the <a> directly */"
    },
    {
      "t": "p",
      "x": "Inside `.theme-dark`, paragraphs go light grey and links stay the default blue. On paper `.theme-dark` is (0,1,0) and `a` is (0,0,1), so the class looks like the winner. It is not in the fight. The link has a declaration of its own, so it never falls back to the inherited value. The fix is a selector that reaches the link: `.theme-dark a { color: #9ad; }`."
    },
    {
      "t": "p",
      "x": "Form controls are the same trap wearing a different hat. The user agent stylesheet sets `font` and sometimes `color` on `input`, `button`, `select` and `textarea`, so a `font-family` on `body` leaves them untouched. You want `input, button, select, textarea { font: inherit; }`, or the `:where()` version below if you are writing a reset other people need to override. Before you debug further, also check that the property inherits at all. `color`, `font-family` and `line-height` do. `background-color`, `border`, `padding` and `display` do not, and no amount of specificity changes that."
    },
    {
      "t": "h2",
      "x": "Cascade layers are compared before specificity"
    },
    {
      "t": "p",
      "x": "Within the author origin, normal declarations are sorted by layer first. Specificity is only consulted between declarations that sit in the same layer. Declare the order once, near the top of your entry stylesheet, before any layer has content."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, components, utilities;\n\n@import url(\"normalize.css\") layer(reset);\n@import url(\"vendor.css\") layer(vendor);\n\n@layer components {\n  #toolbar .btn { background: steelblue; }   /* (1,1,0) */\n}\n\n/* unlayered: wins over every layer, despite (0,1,0) */\n.btn { background: tomato; }"
    },
    {
      "t": "p",
      "x": "Unlayered rules beat all layered rules for normal declarations, whatever the selectors look like. That is the feature, not a quirk. Put a third-party stylesheet into a layer and you can override it afterwards with ordinary one-class selectors, permanently, without ever matching its ID-heavy selectors. Layers have been supported across current Chrome, Firefox, Safari and Edge for several years; check a support table if you still ship to old engines, because there is no polyfill worth using."
    },
    {
      "t": "p",
      "x": "Then there is the part that surprises everyone. For `!important` declarations, the layer precedence is reversed, and unlayered important declarations drop to the bottom of the author stack."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .btn { color: red !important; }     /* wins */\n}\n\n@layer overrides {\n  .btn { color: blue !important; }    /* loses: important order is reversed */\n}\n\n.btn { color: green !important; }     /* loses to both layered importants */"
    },
    {
      "t": "p",
      "x": "The reasoning is that an `!important` in an early layer such as a reset is usually a hard constraint, so it should survive the later layers that are otherwise allowed to win. The practical consequence is worth memorising: `!important` inside a layer is strong, `!important` outside every layer is weak against it, and that is the opposite of the intuition most of us built before layers existed."
    },
    {
      "t": "h2",
      "x": "Five failures that look like specificity and are not"
    },
    {
      "t": "h3",
      "x": "A shorthand further down the file reset your longhand"
    },
    {
      "t": "p",
      "x": "`background: url(bg.png)` resets `background-color` to transparent. `font: 16px/1.4 system-ui` resets `font-weight` and `font-style`. `inset: 0` writes all four of `top`, `right`, `bottom` and `left`. Order decides this, not specificity, and devtools will show you the shorthand that did it."
    },
    {
      "t": "h3",
      "x": "The declaration was dropped at parse time"
    },
    {
      "t": "p",
      "x": "An unknown property, a misspelling like `aling-items`, a malformed color, or a value the engine does not implement yet: all are discarded when the stylesheet is parsed, so the rule below wins by default. The symptom is a declaration that appears correct in your editor and is simply absent from the computed value."
    },
    {
      "t": "h3",
      "x": "Two rules tie and your bundler chose the order"
    },
    {
      "t": "p",
      "x": "Equal specificity means last one in the output wins. With CSS modules, a component library and a bundler, the final order is whatever the import graph produced, and it can change when you move an import statement. If a fix works in the browser devtools but not after a build, read the compiled CSS rather than the source."
    },
    {
      "t": "h3",
      "x": "A transition or animation is holding the value"
    },
    {
      "t": "p",
      "x": "Animation declarations outrank normal author declarations, and declarations from a running transition outrank even author `!important`. A property that ignores your rule for a few hundred milliseconds and then accepts it is a transition, not a specificity problem. Set the transition on a different property, or change the value the element transitions toward."
    },
    {
      "t": "h3",
      "x": "The element lives inside a shadow root"
    },
    {
      "t": "p",
      "x": "Page selectors do not reach into a shadow DOM. Inherited properties and custom properties cross the boundary, and beyond that you get whatever the component exposes through `::part()`. If devtools shows `#shadow-root` above your element, stop writing selectors and start setting custom properties."
    },
    {
      "t": "h2",
      "x": "Lower the specificity instead of raising it"
    },
    {
      "t": "p",
      "x": "If you are writing CSS that others will override, including your own future self, the goal is for your selectors to be easy to beat. `:where()` makes that explicit: everything inside it counts as zero."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,2,0): a single utility class cannot override this */\n.card .title { font-size: 1.25rem; }\n\n/* (0,1,0): the .card part contributes nothing */\n:where(.card) .title { font-size: 1.25rem; }\n\n/* (0,0,0): still matches, loses to any one class */\n:where(.card .title) { font-size: 1.25rem; }\n\n/* a reset that never fights the author */\n:where(input, button, select, textarea) { font: inherit; }"
    },
    {
      "t": "p",
      "x": "Native nesting has its own version of this, and it is a quiet source of specificity inflation. `&` expands to `:is(<parent selector list>)`, and `:is()` takes the most specific item in that list, so one ID in the parent list raises every nested rule."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card, #hero {\n  /* & is :is(.card, #hero) -> (1,0,0), plus .title -> (1,1,0) */\n  & .title { color: tomato; }\n}"
    },
    {
      "t": "p",
      "x": "`@scope` adds one more step to the cascade: when two scoped rules are otherwise equal, the one whose scope root is closer to the element wins. That proximity check happens after specificity and before document order, so it breaks ties, it does not reset weight. Browser support was still uneven through 2026, so verify it against a current support table before you build on it."
    },
    {
      "t": "p",
      "x": "For layout problems specifically, a surprising number of \"this rule is not applying\" reports turn out to be a property that the layout model ignores, such as `vertical-align` on a flex item or `width` on a stretched grid child. Our notes on [CSS Grid versus Flexbox](/guides/css-grid-vs-flexbox/) cover which properties each model actually reads."
    },
    {
      "t": "h2",
      "x": "When !important is the right answer"
    },
    {
      "t": "p",
      "x": "There is a legitimate use: a declaration that must not be overridden by the normal flow of your stylesheets. A `.sr-only` visibility utility. A `prefers-reduced-motion` guard that kills animation durations. A print rule that must hide a fixed header. These are constraints, and marking them as constraints is honest."
    },
    {
      "t": "p",
      "x": "The illegitimate use is winning a fight you could have won by fixing a selector. One test works well: if a second `!important` would ever be needed to beat this one, you are escalating rather than deciding, and the escalation has no ceiling. Put the constraint in an early layer instead, where the reversed important ordering keeps it on top without a shouting match."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The override you cannot out-select",
      "x": "Inline styles beat every author selector, and `style=\"color: red !important\"` beats every author `!important`. If a script is writing inline styles, no stylesheet change inside the author origin will reliably win. Fix the script, or stop it from running."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Work through the cases in order. The selector may not match, so the declaration is never considered. The value may be invalid and dropped at parse time. An inline style with !important beats author !important. A running transition outranks author !important entirely. And if you are using cascade layers, your unlayered !important is the weakest of the author important declarations, so an !important inside a layer will beat it."
        },
        {
          "q": "Does an ID really beat 100 classes in CSS?",
          "a": "Yes. Specificity is three separate counts compared left to right, not a single base-10 number, so the class count never carries into the ID column. Engines compare (1,0,0) against (0,100,0) by looking at the first column and stopping there. Very old engines had overflow bugs around this, but nothing in current use behaves that way."
        },
        {
          "q": "How do I override a CSS rule without using !important?",
          "a": "In rough order of preference: put the stylesheet you want to override into a cascade layer and write your rule unlayered; add a class to your own selector so it matches more specifically; reorder so your rule comes last among equally specific rules; or wrap parts of the other selector in :where() if you control that file. Each of these leaves the next person able to override you, which !important does not."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "They are checked before it. Normal declarations are sorted by layer, and specificity only decides between declarations in the same layer, so an unlayered rule with one class beats a layered rule with an ID. For !important declarations the layer order is reversed, meaning earlier layers win and unlayered important declarations come last."
        },
        {
          "q": "Why does the color on my parent element not apply to links inside it?",
          "a": "Because the link has its own matching declaration, usually from the browser default stylesheet. Inherited values are only used when nothing matched the element directly, so they never compete on specificity. Target the link itself, for example .theme-dark a, and the inherited value stops mattering."
        },
        {
          "q": "How can I see which CSS rule actually won?",
          "a": "Use the Computed panel in devtools rather than the Styles panel. Expand the property and the browser names the rule that supplied the final value, plus the rules it beat and their source files. The Styles panel shows you candidates with the losers struck through, which is useful for the comparison but slower for finding the winner."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model reads which properties, and how to pick one without guessing.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA before you ship the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-06",
  "updated": "2026-10-06",
  "author": "jackson",
  "related": [
    "/guides/css-grid-vs-flexbox/",
    "/tools/color-contrast-checker/"
  ]
};
