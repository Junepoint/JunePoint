module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important",
  "eyebrow": "CSS",
  "description": "Your selector matches but the style loses. How specificity is counted, where cascade layers sit in the order, and when !important is the wrong tool.",
  "standfirst": "A declaration can lose for six different reasons, and only one of them is specificity. Work out which one you have before you start adding classes.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "Find out whether your rule is losing a cascade comparison or never matching at all, then fix the right thing.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Open devtools first. A declaration that is **struck through** lost a comparison. A declaration that is **absent** never matched, or was dropped as invalid. Those are different bugs with different fixes.",
        "Specificity is three numbers compared left to right: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. Ten classes do not beat one ID.",
        "Cascade layers are checked *before* specificity. A low-specificity rule in a later layer beats a high-specificity rule in an earlier one, which is the whole point of them.",
        "For `!important` declarations, layer order reverses and unlayered styles sort last. That surprises people who add `!important` to a global override file and watch it lose.",
        "A directly applied declaration always beats an inherited one, no matter how specific the inherited rule was. Inheritance is not part of the specificity contest."
      ]
    },
    {
      "t": "h2",
      "x": "Is the rule losing, or is it missing?"
    },
    {
      "t": "p",
      "x": "This is the fork in the road, and skipping it is why people spend an afternoon adding `!important` to a rule whose selector has a typo in it. Inspect the element and read the Styles pane in Chrome, Firefox or Safari devtools. Your declaration will be in one of three states."
    },
    {
      "t": "ul",
      "items": [
        "**Present and struck through.** The selector matched. Something else won. This is a cascade problem, and the rest of this article is about it.",
        "**Present but the value is struck through while the rest of the rule is fine.** The value was parsed as invalid and discarded. Check the unit, the function name, the number of arguments.",
        "**Not there at all.** The selector did not match this element, the stylesheet did not load, the property name is misspelled, or the whole rule sits inside a `@media` or `@supports` block that is not currently true."
      ]
    },
    {
      "t": "p",
      "x": "For the third case, switch to the Computed tab and turn on the option to show all properties. Find the property, expand it, and look at the list of rules the browser considered. If your selector is not in that list, the browser never matched it. No amount of specificity will help a selector that does not match."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A quick sanity check from the console",
      "x": "`document.querySelectorAll('.your .selector').length` tells you immediately whether the selector matches anything. If it returns 0, stop reading about the cascade and go fix the selector."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Every selector gets three counts. Write them as a tuple. The browser compares the first number, and only looks at the second if the first is tied, and only at the third if the second is tied too."
    },
    {
      "t": "table",
      "head": [
        "Column",
        "What counts",
        "Example"
      ],
      "rows": [
        [
          "First (ID)",
          "ID selectors",
          "`#save`"
        ],
        [
          "Second (class)",
          "Class selectors, attribute selectors, pseudo-classes",
          "`.primary`, `[disabled]`, `:hover`, `:nth-child(2)`"
        ],
        [
          "Third (type)",
          "Element type selectors and pseudo-elements",
          "`button`, `::before`"
        ],
        [
          "Nothing",
          "Universal selector, combinators, `:where()`",
          "`*`, `>`, `+`, `~`, `:where(.a)`"
        ]
      ],
      "caption": "Specificity has three columns. Combinators and the universal selector add zero."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "button                       { }  /* (0,0,1) */\nbutton.primary               { }  /* (0,1,1) */\n.toolbar button.primary      { }  /* (0,2,1) */\n.a.b.c.d.e.f.g.h.i.j.k       { }  /* (0,11,0) */\n#save                        { }  /* (1,0,0) */\n\n/* #save wins against every rule above it.\n   The first column is 1 against 0, so the other columns\n   are never even looked at. */"
    },
    {
      "t": "p",
      "x": "There is a persistent story that each column is base 10, or base 256, and that enough classes eventually roll over into an ID. They do not. The comparison is lexicographic. One ID beats any number of classes, forever, which is the real argument against putting IDs in your stylesheets: a rule you cannot outrank without another ID is a rule your design system has to live with."
    },
    {
      "t": "h3",
      "x": ":is(), :has(), :not() and :where()"
    },
    {
      "t": "p",
      "x": "These four behave differently from each other, and the difference is load-bearing. `:is()`, `:has()` and `:not()` take the specificity of their most specific argument. `:where()` always contributes zero, no matter what you put inside it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ":is(h1, #title)   { }  /* (1,0,0) - the #title argument sets it */\n:where(h1, #title) { }  /* (0,0,0) - always zero */\n:not(.inactive)    { }  /* (0,1,0) */\nform:has(.error)   { }  /* (0,1,1) */\n\n/* Useful consequence: a reset you want anyone to be able to\n   override without a specificity fight. */\n:where(ul, ol) { margin-block: 0; padding-inline-start: 0; }"
    },
    {
      "t": "p",
      "x": "That last pattern is worth stealing. A reset written with `:where()` has zero specificity, so a single element selector later in the sheet overrides it. A reset written with a long descendant chain is something every component author then has to fight."
    },
    {
      "t": "h2",
      "x": "Specificity is only step five"
    },
    {
      "t": "p",
      "x": "The browser does not start with specificity. It starts with origin and importance, and by the time it reaches specificity most arguments are already settled. The order below is what the cascade actually does, from the first test applied to the last."
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
          "Transitions, then important user-agent, important user, important author styles, then animations, then normal author, normal user, normal user-agent styles",
          "This is why an author `!important` rule beats a normal inline style"
        ],
        [
          "2. Context",
          "Shadow DOM boundaries and scoping proximity",
          "Only relevant if you use web components or `@scope`"
        ],
        [
          "3. Element-attached styles",
          "Inline `style` attributes beat stylesheet rules of the same importance",
          "Inline styles have no specificity value; they win at this earlier step"
        ],
        [
          "4. Cascade layers",
          "Layer order",
          "Reversed for `!important` declarations"
        ],
        [
          "5. Specificity",
          "The three-column comparison",
          "Where most people start, and where the browser nearly finishes"
        ],
        [
          "6. Order of appearance",
          "Last matching declaration wins",
          "The tiebreaker"
        ]
      ],
      "caption": "The cascade sorting order. Specificity is consulted late."
    },
    {
      "t": "p",
      "x": "Read step one again, because it explains a result that looks impossible. An inline `style=\"color: red\"` is normally unbeatable from a stylesheet, so people assume inline always wins. It does not. `color: blue !important` in a stylesheet is an important author declaration, and importance is sorted at step one, while the inline advantage only arrives at step three. Blue wins. The only thing that then beats it is `!important` inside the inline style itself."
    },
    {
      "t": "h2",
      "x": "Cascade layers, and the trap in them"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare precedence up front instead of encoding it in selector length. Declare the order once, at the top of your entry stylesheet, and later layers beat earlier ones regardless of how specific the losing rule was."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, framework, components, overrides;\n\n@layer framework {\n  #sidebar .widget h2.title { color: teal; }   /* (1,2,1) */\n}\n\n@layer components {\n  .card-title { color: rebeccapurple; }        /* (0,1,0) */\n}\n\n/* rebeccapurple wins. components is declared after framework,\n   and layer order is step 4 while specificity is step 5. */"
    },
    {
      "t": "p",
      "x": "Styles written outside any layer are treated as an implicit final layer, so unlayered rules beat all layered ones. That is convenient while you migrate: wrap the vendor framework in a layer, leave your own code unlayered, and your code wins by default."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layer order reverses for !important",
      "x": "Among important declarations in the same origin, the earliest declared layer wins and unlayered styles sort last. So `a { color: hotpink !important; }` sitting outside any layer loses to `@layer base { a { color: teal !important; } }`. If you have a global overrides file full of `!important` and it stopped working after someone introduced layers, this is why."
    },
    {
      "t": "p",
      "x": "Two practical notes on support. Cascade layers shipped across the three major engines in early 2022 (Chrome 99, Firefox 97, Safari 15.4), so they are safe for most projects as of November 2025, but confirm against your own browser support matrix before you restructure a stylesheet around them. `@scope`, which adds proximity-based precedence at step two, landed considerably later and arrived in Firefox after Chrome and Safari. Check current support rather than trusting a date in an article."
    },
    {
      "t": "p",
      "x": "Layers also give you a clean escape hatch. `revert-layer` on a property throws away the value from the current layer and falls back to what the previous layer said, which is a much more surgical instrument than resetting to `initial` and guessing what the old value was."
    },
    {
      "t": "h2",
      "x": "What !important is for, and what it costs"
    },
    {
      "t": "p",
      "x": "It has legitimate uses. Overriding a third-party widget whose styles you cannot edit. Forcing a utility class to behave. Pinning a value in a print stylesheet. Accessibility overrides in a user stylesheet, which is the case the mechanism was designed for in the first place."
    },
    {
      "t": "p",
      "x": "The cost is that it removes a declaration from the normal comparison and puts it in a smaller, nastier one. Once two important declarations collide you are back to comparing specificity, except now inside the important bucket, and your remaining moves are worse. The usual end state is a codebase where every override needs `!important` because every previous override already had it. If you find yourself writing it more than a handful of times in a project, the problem is the architecture of the stylesheet, not the strength of the individual rule."
    },
    {
      "t": "p",
      "x": "One thing `!important` cannot do: beat an animation or a transition while that animation is running. Animations sort above normal author styles, and transitions sort above everything. A value that looks frozen during a transition is not a specificity problem at all."
    },
    {
      "t": "h2",
      "x": "When specificity is not the problem"
    },
    {
      "t": "p",
      "x": "A large share of \"my CSS is not applying\" reports have nothing to do with the cascade. These are the common ones, roughly in order of how often they waste people's time."
    },
    {
      "t": "ul",
      "items": [
        "**You are fighting inheritance.** You set `color` on a container and the links inside stay blue. Nothing overrode your rule. The anchor has its own user-agent `color` declaration, and a directly matched declaration always beats an inherited value.",
        "**A shorthand later in the rule wiped your longhand.** Order inside a single rule matters just as much as order between rules.",
        "**The declaration was dropped as invalid.** A misspelled property, a missing unit, an unquoted string. The browser discards the declaration and says nothing in the console.",
        "**The property does not apply to that element.** `width` and `height` are ignored on a non-replaced inline element. `gap` does nothing without `display: flex` or `grid`. `z-index` does nothing on a `position: static` element.",
        "**The build is serving stale or hashed CSS.** With CSS Modules or a scoped-styles setup, the class in your source is not the class in the DOM. Compare what you wrote with what the element actually has.",
        "**The stylesheet 404s or loads in a different order than you think.** Check the Network panel, then check the order of the `<link>` tags and the bundler's output order."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".btn {\n  background-color: rebeccapurple;\n  background: url(\"/texture.png\") no-repeat;\n  /* The shorthand resets background-color to its initial\n     value. Purple is gone, and it is not a cascade issue. */\n\n  colour: white;   /* dropped: not a property */\n  width: 320;      /* dropped: unitless non-zero length */\n  gap: 1rem;       /* valid, no effect without flex or grid */\n}"
    },
    {
      "t": "h2",
      "x": "A repair order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "Run the selector through `querySelectorAll` in the console. If it matches nothing, fix the selector and stop."
        },
        {
          "title": "Find the winning declaration, not a stronger selector",
          "x": "In the Styles pane, the rule above yours that is not struck through is the winner. Click its source link. Knowing which file it came from usually tells you whether the right fix is a layer, a different selector, or deleting one of the two rules."
        },
        {
          "title": "Compare the tuples left to right",
          "x": "Write both out. If the winner has an ID and yours does not, no number of classes will close the gap, and adding them makes the stylesheet worse."
        },
        {
          "title": "Prefer structure over force",
          "x": "Move the vendor or legacy rules into an earlier `@layer`, or wrap resets in `:where()` so they stop competing. Both fixes lower the other side rather than raising yours."
        },
        {
          "title": "Reach for !important last, and leave a comment",
          "x": "If you genuinely cannot edit the other stylesheet, use it, say in a comment which rule you are overriding, and note that layer order reverses for important declarations so a future refactor does not silently undo it."
        }
      ]
    },
    {
      "t": "p",
      "x": "The underlying habit worth building is distrust of the question \"how do I make this rule stronger\". Most specificity pain is self-inflicted: deep descendant chains written to win a fight, then inherited by the next person as the baseline they have to beat. Layers, `:where()` and a ban on ID selectors in stylesheets remove the fight instead of winning it."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even with !important?",
          "a": "Three likely causes. The selector does not match, so the rule never enters the comparison. Another `!important` declaration beats yours, possibly because it sits in an earlier cascade layer while yours is unlayered, which reverses the usual order. Or the property is being driven by a transition or animation, both of which sort above important author styles while they are active."
        },
        {
          "q": "Do ten classes beat one ID in CSS?",
          "a": "No. The three specificity columns are compared left to right, not added up. `(1,0,0)` beats `(0,10,0)` and would beat `(0,1000,0)`. The old claim that each column is base 10 or base 256 is wrong in every current browser."
        },
        {
          "q": "Does an inline style always win?",
          "a": "No. An `!important` declaration in an author stylesheet beats a normal inline style, because importance is sorted before element-attached styles. Inline styles also have no specificity number of their own, so you cannot out-specify them with a long selector. Only importance gets past them."
        },
        {
          "q": "What is the specificity of :is(), :has() and :where()?",
          "a": "`:is()`, `:has()` and `:not()` take the specificity of their most specific argument, so `:is(h1, #title)` is `(1,0,0)`. `:where()` always contributes zero regardless of its contents, which makes it the right wrapper for resets and defaults you want others to override easily."
        },
        {
          "q": "Should I use cascade layers instead of !important?",
          "a": "For anything you control, yes. Layers let you state precedence once, at the top of the stylesheet, instead of encoding it in selector length at every call site, and `revert-layer` gives you a clean way back to the previous layer's value. Keep `!important` for third-party styles you cannot edit, and remember that layer order reverses for important declarations."
        },
        {
          "q": "How do I see which CSS rule is winning in Chrome?",
          "a": "Inspect the element, then use the Computed tab rather than the Styles pane. Expand the property and Chrome lists every rule that set it, winner first, each with a link to its source file. The Styles pane shows the same information through strikethroughs, and labels the cascade layer each rule belongs to."
        }
      ]
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
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same class of bug one layer up: the code looks right and the value is stale anyway.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-25",
  "updated": "2026-11-25",
  "author": "jackson",
  "related": []
};
