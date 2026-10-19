module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity and Why Your Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Specificity is only the fourth tiebreak in the cascade. Learn the real order, how layers and !important change it, and how to debug a rule that loses.",
  "standfirst": "The cascade decides conflicts in a fixed order, and specificity is not the first step. Here is that order, how to read a specificity score, and what to check before you reach for !important.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "The real order the cascade uses, how specificity is counted, and how layers and !important change the answer.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Confirm the rule matches before blaming specificity. A declaration that never shows up in the DevTools Styles pane lost to a typo, an invalid value or a 404, not to the cascade.",
        "The browser resolves conflicts in this order: origin and importance, then cascade layers, then the style attribute, then specificity, then source order. Specificity is the fourth tiebreak.",
        "Specificity is three separate counts, not one number: IDs, then classes/attributes/pseudo-classes, then element types/pseudo-elements. Eleven classes never beat one ID.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument. That single difference settles most override fights inside a design system.",
        "`!important` reverses layer order: an important declaration in an *earlier* layer beats an important one in a later layer, and both beat unlayered important declarations."
      ]
    },
    {
      "t": "h2",
      "x": "First, check that the rule matches at all"
    },
    {
      "t": "p",
      "x": "Most \"specificity problems\" are not specificity problems. Open DevTools, select the element, and look at the Styles pane. If your rule is not listed there at all, no amount of `!important` will help, because the browser never matched it. If it is listed but struck through, then you have a genuine cascade conflict and the rest of this page applies."
    },
    {
      "t": "p",
      "x": "The usual reasons a rule is missing: the stylesheet 404ed (check the Network tab, filter by CSS); the build did not rebuild, so you are looking at a stale bundle; the selector targets a class the framework renamed during the build, such as a CSS Modules hash; the element you inspected is not the element the selector describes; or the markup changed and the descendant chain no longer holds. Scoped styles in Vue and Angular add an attribute selector to your rule that will not reach into a child component."
    },
    {
      "t": "p",
      "x": "A rule can also match while a single declaration inside it is thrown away. CSS parses declaration by declaration, and an invalid property name or an invalid value is dropped silently at parse time. Chrome and Firefox both show that as a warning triangle next to the line in the Styles pane. `color: #ff00` is four hex digits, which is not a valid color. `width: 100` without a unit is invalid. `gap: 1rem` is valid syntax but does nothing on a container that is not flex, grid or multi-column, which looks identical to being overridden until you check the computed value."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Use the Computed tab, not the Styles tab",
      "x": "The Styles pane shows every matching rule in cascade order, which is a lot to read. The Computed tab shows the final value for each property, and expanding a property lists the declarations that tried to set it, winner first, with a link straight to the source line. When you want the answer rather than the argument, start there."
    },
    {
      "t": "h2",
      "x": "The order the cascade actually uses"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser works down this list and stops at the first step that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Browser default styles lose to user stylesheets, which lose to your stylesheet. `!important` flips the whole stack: important browser styles beat important user styles, which beat important author styles, which beat everything normal. This is why a user accessibility stylesheet can win and should be able to.",
        "**Cascade layers.** Within the author origin, layer order decides. For normal declarations, later layers win, and unlayered styles beat every layer. For important declarations the order is reversed.",
        "**The style attribute.** An inline `style=\"...\"` declaration beats any selector in your stylesheet, but a normal inline declaration still loses to an author `!important` rule.",
        "**Specificity.** Only now does the selector score matter.",
        "**Scope proximity.** Where `@scope` is in play, the declaration whose scope root is nearer the element wins. Support has been landing across browsers at different times, so check current availability before you depend on it.",
        "**Order of appearance.** Last one wins. This is the tiebreak that makes \"just move it to the bottom of the file\" work, and the reason that fix evaporates when someone changes the import order."
      ]
    },
    {
      "t": "p",
      "x": "Two things sit outside the list. CSS transitions override everything while they run, and keyframe animation declarations beat normal author rules but lose to important ones. If a value flickers to the right thing and then back, you are fighting a transition or an animation, not a selector."
    },
    {
      "t": "h2",
      "x": "How specificity is counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is three numbers, usually written `a,b,c`. Column `a` counts ID selectors. Column `b` counts classes, attribute selectors and pseudo-classes. Column `c` counts element types and pseudo-elements. Compare left to right, and the first column that differs decides it. The columns do not carry: there is no number of classes that adds up to an ID."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Specificity",
        "Why"
      ],
      "rows": [
        [
          "`*`",
          "0,0,0",
          "The universal selector and combinators (`>`, `+`, `~`, whitespace) count for nothing."
        ],
        [
          "`li`",
          "0,0,1",
          "One element type."
        ],
        [
          "`ul > li a`",
          "0,0,3",
          "Three element types, combinators free."
        ],
        [
          "`.card`",
          "0,1,0",
          "One class."
        ],
        [
          "`[data-state='open']`",
          "0,1,0",
          "Attribute selectors score as classes."
        ],
        [
          "`li.card::marker`",
          "0,1,2",
          "One type, one class, one pseudo-element."
        ],
        [
          "`#nav`",
          "1,0,0",
          "Beats `.a.b.c.d.e.f.g.h`, and always will."
        ],
        [
          "`:where(#nav) .item`",
          "0,1,0",
          "`:where()` zeroes out everything inside it."
        ],
        [
          "`a:not(.x, #y)`",
          "1,0,1",
          "`:not()` takes its most specific argument, so the `#y` lands in the ID column."
        ],
        [
          "`style=\"...\"`",
          "above all selectors",
          "Not a selector, so it has no score. It simply wins step 3."
        ]
      ],
      "caption": "Specificity is three independent counts compared left to right."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,1,0 */\n.button { background: #2563eb; }\n\n/* 0,2,0 - beats .button no matter where it appears in the file */\n.toolbar .button { background: #475569; }\n\n/* 0,1,1 - beats .button, loses to .toolbar .button */\nbutton.button { background: #16a34a; }\n\n/* 1,0,0 - one ID beats all of the above */\n#save { background: #dc2626; }\n\n/* 0,2,0 again - identical score, so source order decides and this wins */\n.theme-dark .button { background: #0f172a; }"
    },
    {
      "t": "p",
      "x": "The practical lesson is in that last pair. Once two selectors tie, the fix is not to add another class to the front of one of them. That works today and breaks the next time someone reorders imports or a bundler changes chunk order. Ties that matter should be resolved by layers, which are explicit and survive refactoring."
    },
    {
      "t": "h2",
      "x": ":is(), :where(), :not() and :has()"
    },
    {
      "t": "p",
      "x": "These four behave differently enough to cause real confusion. `:is()`, `:not()` and `:has()` all adopt the specificity of their most specific argument. `:where()` always contributes zero, no matter what is inside it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1,0,1 - the #sidebar inside :is() drags the whole thing up */\n:is(#sidebar, .panel) a { color: teal; }\n\n/* 0,0,1 - same match, zero cost, trivially overridable */\n:where(#sidebar, .panel) a { color: teal; }\n\n/* 0,2,0 - :has() takes .featured from its argument */\n.card:has(.featured) { border-color: gold; }\n\n/* A reset that never fights anything it is applied to */\n:where(h1, h2, h3, h4) { margin-block: 0; font-size: inherit; }"
    },
    {
      "t": "p",
      "x": "Wrap defaults in `:where()` and wrap intentional overrides in `:is()`. A reset or base layer built from `:where()` can be overridden by a single bare element selector, which is exactly what you want from a default. The same trick rescues a selector you inherited and cannot shorten: `:where(#legacy-wrapper) .thing` matches identically to `#legacy-wrapper .thing` and scores `0,1,0` instead of `1,1,0`."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the question"
    },
    {
      "t": "p",
      "x": "`@layer` moved the common case out of specificity entirely. Declare your layer order once, at the top, and layer membership outranks every selector score inside those layers. A `1,1,0` selector in an earlier layer loses to a `0,1,0` selector in a later one, which is the behaviour almost everyone wanted all along."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Order declared here, once. Later layers win. */\n@layer reset, vendor, components, utilities;\n\n@layer vendor {\n  #widget .title { color: red; }   /* 1,1,0 */\n}\n\n@layer components {\n  .title { color: navy; }          /* 0,1,0, and it wins */\n}\n\n/* Pull a third-party file straight into a layer */\n@import url(\"vendor.css\") layer(vendor);"
    },
    {
      "t": "p",
      "x": "Unlayered styles are the catch. Any normal declaration that is not inside a layer beats every layered declaration, as if it sat in an implicit final layer. Half-migrating a codebase therefore produces a confusing middle state where your careful layer order is quietly outranked by whatever is still loose in `main.css`. Either layer everything or accept that the unlayered part is the top of the stack."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "Inside the author origin, important declarations invert the layer ranking. An `!important` in your first-declared layer beats an `!important` in the last, and both beat an unlayered `!important`. The reasoning is that the lower-level, more foundational layer is the one asserting a hard requirement. It is correct and it is deeply surprising the first time you hit it, so verify in DevTools rather than reasoning it out from the file order."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base      { .t { color: red !important; } }   /* this one wins */\n@layer overrides { .t { color: blue !important; } }\n\n.t { color: green !important; }                      /* unlayered, loses to both */"
    },
    {
      "t": "h2",
      "x": "!important, and the cheaper alternatives"
    },
    {
      "t": "p",
      "x": "`!important` is not forbidden, it is just expensive. The cost is that it can only be answered by another `!important`, so one use tends to spawn more, and the resulting stylesheet has two parallel cascades running at once. Before adding one, try the alternatives in roughly this order."
    },
    {
      "t": "ul",
      "items": [
        "**Lower the other rule** instead of raising yours. Wrapping an ID in `:where()` costs one line and removes the conflict permanently.",
        "**Put the two rules in different layers.** This is what layers are for, and it expresses the intent (\"utilities beat components\") in a way a selector score cannot.",
        "**Match the specificity and rely on order**, but only within a single file you control, where order is stable.",
        "**Set the property on a different element.** Fighting over `color` on a child is pointless if the parent can set it and let inheritance do the work.",
        "**Use a custom property.** `color: var(--label-color)` lets a consumer change the value by setting one variable, with no override battle at all."
      ]
    },
    {
      "t": "p",
      "x": "There are honest uses left. Utility classes that must win by definition are the main one, which is why utility frameworks offer an important variant. Overriding inline styles written by a third-party script you cannot modify is another, since nothing weaker will reach them. User stylesheets and accessibility overrides are a third, and that case is the reason the mechanism exists."
    },
    {
      "t": "h2",
      "x": "Beating an !important you cannot edit"
    },
    {
      "t": "p",
      "x": "If a vendor stylesheet sets `display: none !important` on something you need visible, you have four moves. Write your own `!important` with higher specificity. Write your own `!important` at equal specificity but later in source order. Put the vendor CSS in a later layer than yours, since important declarations in earlier layers win. Or, if you control the document rather than the stylesheet, set the value in the `style` attribute with `!important`, which outranks an important rule from a stylesheet because it is more specific within the same origin and importance bucket."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Vendor, unreachable: .modal { display: none !important; } */\n\n/* Higher specificity, still important */\nbody .modal.is-open { display: block !important; }\n\n/* Or roll a property back to what the previous layer said */\n@layer overrides {\n  .modal { display: revert-layer; }\n}\n\n/* Or discard every author declaration on the element */\n.reset-me { all: revert; }"
    },
    {
      "t": "p",
      "x": "`revert-layer` rolls a property back to the value it would have had from the previous layer. `revert` rolls back to the user or browser default. Both are better than guessing at an original value, because they do not hard-code a number that the component library might change next release."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Is the rule in the Styles pane?",
          "x": "If not, it never matched. Check the network request, the build output and the actual class names on the element. Stop here until the rule appears."
        },
        {
          "title": "Is the declaration struck through, or flagged invalid?",
          "x": "Struck through means something beat it, so continue. A warning icon means the value failed to parse and nothing beat it at all."
        },
        {
          "title": "Open the Computed tab and expand the property.",
          "x": "The winning declaration is listed first, with its source file and line. Read what actually won before theorising about why."
        },
        {
          "title": "Compare the two in cascade order, not specificity order.",
          "x": "Importance, then layer, then style attribute, then specificity, then source order. Check them in that sequence and the answer usually falls out at step one or two."
        },
        {
          "title": "Fix the loser, not the winner.",
          "x": "Lower the winning selector with :where(), or move one of the rules into a layer. Adding a class to the front of your selector is a fix with a short shelf life.",
          "code": "/* Before: 1,1,0 vs 0,1,0, specificity decides */\n#app .label { color: gray; }\n\n/* After: 0,1,0 vs 0,1,0, source order and layers decide */\n:where(#app) .label { color: gray; }"
        },
        {
          "title": "If the value is right but nothing changes on screen, stop debugging CSS conflicts.",
          "x": "Check for a transform creating a new containing block, a zero height, `overflow: hidden` on an ancestor, a stacking context swallowing your z-index, or an element painted over the top. A computed value that matches your intent means the cascade is already done with you."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the right layout module, and the overflow traps in both.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same debugging shape applied to state that looks one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check whether the rule appears in the DevTools Styles pane at all. If it is absent, the selector did not match or the file did not load, and specificity is irrelevant. If it is present but struck through, another declaration won on importance, layer, the style attribute, specificity or source order, in that order. If it is present and winning but nothing looks different, the problem is layout or painting rather than the cascade."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "Yes, in one direction. An author rule with !important beats a normal declaration in a style attribute. An !important inside the style attribute itself beats an !important rule in your stylesheet, because the style attribute outranks selectors within the same origin and importance level. A user stylesheet with !important beats both."
        },
        {
          "q": "How many classes does it take to override an ID?",
          "a": "No number of classes will do it. The three specificity columns are compared left to right and do not carry, so 0,255,0 still loses to 1,0,0. Wrap the ID in :where() to zero it out, or move the two rules into separate cascade layers."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. :where() always contributes zero specificity, while :is() takes the specificity of its most specific argument. Use :where() for resets, defaults and anything you expect other people to override. Use :is() when you want the selector to hold its ground."
        },
        {
          "q": "Why does my utility class not override the component style?",
          "a": "Usually because the component selector is more specific, or the utility sits in an earlier cascade layer, or the component CSS is unlayered while the utilities are in a layer. Unlayered normal declarations beat every layer, so a partly migrated codebase often produces exactly this. Check which of those applies before adding !important to the utility."
        },
        {
          "q": "Should I ever use !important?",
          "a": "Sometimes. Utility classes that must win by design, overrides against inline styles written by third-party scripts, and user or accessibility stylesheets are all reasonable. The problem is not the keyword, it is that the only reply to an !important is another one, so each use raises the cost of the next change. Try :where(), a cascade layer or a custom property first."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-19",
  "updated": "2026-10-19",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
