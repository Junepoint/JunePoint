module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important",
  "eyebrow": "Guides",
  "description": "A rule that will not apply has usually lost the cascade, not failed to match. How specificity is counted, how layers reorder it, and when !important is defensible.",
  "standfirst": "How the browser picks a winning declaration, in the order it actually decides, and what to change when the rule you wrote keeps losing.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "!important css",
    "specificity calculation"
  ],
  "cardDesc": "Specificity, cascade layers and !important, in the order the browser resolves them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Open DevTools first. A declaration shown with a line through it lost the cascade. A rule that does not appear in the Styles pane at all never matched the element, which is a different bug with different fixes.",
        "Specificity is three numbers compared left to right: IDs, then classes and attributes and pseudo-classes, then elements and pseudo-elements. It is not base 10, so twenty classes still lose to one ID.",
        "Cascade layers outrank specificity entirely. A single-class rule in a later layer beats an ID rule in an earlier one.",
        "`!important` reverses layer order. Important declarations in the *first* layer win, and unlayered important declarations lose to layered ones. This surprises almost everyone the first time.",
        "Source order is the last tiebreak, not the first. If it decides your bug, your real dependency is on whatever order your bundler emits files in."
      ]
    },
    {
      "t": "h2",
      "x": "Check that the rule matched before blaming specificity"
    },
    {
      "t": "p",
      "x": "Select the element, look at the Styles pane, and find your selector. If it is listed with the losing declaration struck through, skip to the next section: the cascade is working and you are on the wrong end of it. If the selector is not listed at all, nothing below will help, because the rule never applied to this element in the first place."
    },
    {
      "t": "p",
      "x": "Selectors fail to match for dull reasons. Work through them before touching specificity:"
    },
    {
      "t": "ul",
      "items": [
        "The stylesheet did not load, or a build step dropped it. Check the Network tab and the Sources list, not the file on disk.",
        "A CSS Modules or styled-components class was hashed, so `.card` in your source is `.card_a3f9b` in the DOM.",
        "The combinator is wrong. `.nav > .item` requires a direct child; a wrapper `<ul>` in between breaks it silently.",
        "The element is inside a shadow root. Author styles from the outer document do not cross that boundary.",
        "An `@media`, `@supports` or `@container` condition is false at the current viewport or container size.",
        "The property or value is invalid, so the parser threw the declaration away. Chrome and Firefox both flag these with a warning icon. `margin: 10 px` and `color: #ff00gg` vanish without any runtime error."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One property or the whole rule?",
      "x": "An invalid value drops that single declaration. An invalid selector drops the entire rule block, including the declarations that would have been fine. That is why one typo in a comma-separated selector list can take out styles you never touched."
    },
    {
      "t": "h2",
      "x": "The order the browser resolves in"
    },
    {
      "t": "p",
      "x": "Specificity is step four. Three things are checked before it, which is why a more specific selector sometimes still loses. The full sort runs like this:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Browser defaults, user stylesheets and your stylesheets are ranked against each other, with `!important` flipping parts of that ranking.",
        "**Cascade layers.** Within one origin, layers are compared in declaration order. Unlayered normal styles sit above every layer.",
        "**Inline styles.** A `style` attribute beats any selector you can write in an author stylesheet, unless that stylesheet uses `!important`.",
        "**Specificity.** Only now do the three numbers matter, and only between declarations that survived every step above.",
        "**Order of appearance.** Equal specificity in the same layer: the one that comes later wins."
      ]
    },
    {
      "t": "table",
      "head": [
        "Priority",
        "Source",
        "Practical meaning"
      ],
      "rows": [
        [
          "Highest",
          "Transition declarations",
          "A property mid-transition holds its transitioned value, above everything else."
        ],
        [
          "2",
          "`!important` browser and user styles",
          "Accessibility overrides the user set deliberately. You cannot beat these, and should not try."
        ],
        [
          "3",
          "`!important` author styles",
          "Your `!important`. Beats inline styles and beats running animations."
        ],
        [
          "4",
          "Animation declarations",
          "An active `@keyframes` rule beats your normal declarations while it runs."
        ],
        [
          "5",
          "Normal author styles",
          "Where almost all of your CSS lives."
        ],
        [
          "Lowest",
          "Normal user and browser styles",
          "The user agent stylesheet. Any rule you write beats it."
        ]
      ],
      "caption": "Cascade origin and importance, highest priority first."
    },
    {
      "t": "p",
      "x": "Two rows are worth remembering. Transitions outrank `!important`, which is why an element mid-fade ignores the color you just forced. And animations outrank your normal styles but lose to your important ones, which is the entire reason `!important` sometimes appears to be the only thing that stops a keyframe from winning."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Count three buckets and write them as a triple. First the IDs. Then the classes, attribute selectors and pseudo-classes. Then the element types and pseudo-elements. Compare left to right and stop at the first difference."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,0,1 */   p { }\n/* 0,0,2 */   li::before { }\n/* 0,1,0 */   .price { }\n/* 0,1,0 */   [data-open] { }\n/* 0,1,0 */   :hover { }\n/* 0,2,1 */   a.btn:focus-visible { }\n/* 0,3,0 */   .card .title .badge { }\n/* 1,0,0 */   #checkout { }\n/* 1,3,2 */   #checkout .row .cell a.link span { }\n\n/* combinators are free */\n/* 0,2,0 */   .nav > .item + .item { }   /* still two classes */\n\n/* the universal selector contributes nothing */\n/* 0,1,0 */   * .price { }"
    },
    {
      "t": "p",
      "x": "`.card .title .badge` is `0,3,0`. `#checkout` is `1,0,0`. The ID wins, and no number of extra classes changes that, because the comparison never reaches the second bucket. This is the single most common surprise: people add another class, see no change, and conclude that CSS is broken."
    },
    {
      "t": "h3",
      "x": "The functional pseudo-classes"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` take the specificity of their most specific argument, which makes them easy to misjudge. `:where()` always contributes zero, which makes it the most useful specificity tool in current CSS."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1,0,0  — the #sidebar argument sets the whole thing */\n:is(p, #sidebar) { }\n\n/* 0,0,0  — :where() is always zero, arguments included */\n:where(p, #sidebar) { }\n\n/* 0,1,1  — :not() counts its argument */\nli:not(.done) { }\n\n/* 0,1,0  — a zero-specificity reset that any component can override */\n:where(.prose) :where(h2, h3, p) {\n  margin-block: 0;\n}"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Reading specificity in DevTools",
      "x": "Recent Chrome versions show a selector's computed specificity in a tooltip when you hover it in the Styles pane. Whether your build has it depends on your version, so check before relying on it in a debugging session."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer"
    },
    {
      "t": "p",
      "x": "`@layer` moves the decision above specificity. Declare the order once, near the top of your entry stylesheet, and every rule inside a layer is ranked by its layer first. Specificity only settles fights within the same layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* order is fixed here, by first mention, regardless of where the rules land */\n@layer reset, vendor, base, components, utilities;\n\n@layer components {\n  #checkout .submit { background: navy; }   /* 1,1,0 */\n}\n\n@layer utilities {\n  .bg-red { background: red; }              /* 0,1,0 */\n}\n\n/* red wins: utilities is a later layer, so specificity is never compared */"
    },
    {
      "t": "p",
      "x": "Two rules about layers cause most of the confusion. Unlayered normal declarations beat every layered normal declaration, so a stray rule outside your layer structure quietly sits on top of all of it. And importance inverts the order: among `!important` declarations, the earliest layer wins and unlayered ones lose. A reset layer declared first becomes the strongest place in the sheet the moment you add `!important` to it, which is almost never what the author intended."
    },
    {
      "t": "p",
      "x": "The ordering is fixed by the first mention of each layer name. That one line of `@layer reset, vendor, base, components, utilities;` is what makes layers predictable under a bundler, because it stops the order from depending on which file happened to be concatenated first."
    },
    {
      "t": "h2",
      "x": "When !important is defensible"
    },
    {
      "t": "p",
      "x": "It has real uses. A third-party widget that writes inline styles from JavaScript cannot be overridden any other way, because inline styles beat every selector you can write. Print stylesheets that must force a background off are another. So are the handful of utility classes in a design system where the whole point is that the utility wins."
    },
    {
      "t": "p",
      "x": "The cost is that `!important` is only beatable by another `!important` with higher specificity, or by one in an earlier layer. Every use raises the floor for the next person, and codebases that start down this path tend to accumulate `!important` on rules that never needed it. If you are adding one to beat your own stylesheet, the layer structure is the better fix."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The escalation you cannot undo",
      "x": "There is no way to lower the priority of an `!important` declaration from another stylesheet. Once a dependency ships one, your only options are a more specific `!important`, an earlier cascade layer, or patching the dependency. Treat it as a one-way door in shared code."
    },
    {
      "t": "h2",
      "x": "Raising specificity on purpose"
    },
    {
      "t": "p",
      "x": "Sometimes you genuinely need one rule to win and cannot restructure the layers. Repeating a class is the cleanest way to add weight without adding meaning, because `.btn.btn` matches exactly what `.btn` matches and scores `0,2,0`."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,2,0 — same match, more weight, no !important */\n.theme-dark.theme-dark .btn { color: white; }\n\n/* the :is() variant, if repetition reads badly to you */\n/* 1,1,0 — borrows the ID's weight without requiring an id in the DOM */\n:is(#specificity-bump, .theme-dark) .btn { color: white; }\n\n/* going the other way: send a declaration back to the previous layer's value */\n.reset-me { all: revert-layer; }"
    },
    {
      "t": "p",
      "x": "`revert-layer` is the underused one. It does not reset a property to its initial value the way `unset` does. It rolls the property back to whatever the previous layer decided, which is usually the behavior people actually want when they say they want to undo a style."
    },
    {
      "t": "h2",
      "x": "A checklist for a rule that refuses to apply"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm it matched",
          "x": "Find the selector in the Styles pane. Not there means a matching problem, not a cascade problem. Stop and fix that instead."
        },
        {
          "title": "Look for the strikethrough",
          "x": "Click the winning declaration's source link. That tells you which file and which selector you are actually fighting, which is often not the one you assumed."
        },
        {
          "title": "Check the layer before the numbers",
          "x": "If the winner sits in a later layer, or outside layers entirely, specificity is irrelevant and raising it will change nothing."
        },
        {
          "title": "Check for an inline style",
          "x": "A `style` attribute, usually written by a framework or a widget, beats any normal author rule regardless of selector.",
          "code": "document.querySelector('.btn').getAttribute('style')"
        },
        {
          "title": "Check whether the property is animating",
          "x": "An active transition or `@keyframes` animation outranks normal declarations. Pause the animation in the Animations panel and see whether your value appears."
        },
        {
          "title": "Then, and only then, adjust specificity",
          "x": "Move the rule into the right layer, or double the class. Reach for `!important` when you are overriding something you do not control."
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three likely causes. Something else also uses !important with higher specificity, or sits in an earlier cascade layer, which beats yours. The property is mid-transition, and transition declarations outrank important author styles. Or the rule never matched the element at all, in which case !important has nothing to act on. Check the Styles pane for a strikethrough before assuming it is a cascade fight."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes. An !important declaration in an author stylesheet beats a normal inline style. It does not beat an inline style that is itself marked !important, and it does not beat an !important declaration in a user stylesheet, which exists so that accessibility overrides cannot be defeated by a site."
        },
        {
          "q": "How many classes equal one ID in specificity?",
          "a": "None. Specificity is not a base 10 number. The browser compares the ID count first and stops if it differs, so a selector with fifty classes still loses to a single ID selector. If you need to beat an ID without adding one, borrow its weight with :is(#anything, .your-class) or move your rule to a later cascade layer."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations. Layer comparison happens before specificity, so a single-class rule in a later layer beats an ID rule in an earlier one. Unlayered normal styles beat all layered ones. For !important declarations the layer order reverses: the earliest layer wins, and unlayered important styles rank lowest."
        },
        {
          "q": "Why does my CSS work in development but not in production?",
          "a": "Usually source order. If two rules have identical specificity in the same layer, the later one wins, and bundlers can emit files in a different order once minification, code splitting or CSS extraction is involved. Cascade layers fix this properly, because a declared layer order does not depend on concatenation order."
        },
        {
          "q": "Should I stop using IDs in CSS?",
          "a": "For styling, mostly yes. An ID selector creates a ceiling that later rules have to match or beat, and it cannot be overridden by any number of classes. Keep IDs in the HTML for fragment links, label associations and JavaScript hooks. Style through classes, data attributes or layers instead."
        },
        {
          "q": "What is :where() actually for?",
          "a": "Zero specificity. Anything inside :where() contributes nothing to the count, which makes it the right tool for resets, base typography and library defaults that consumers should be able to override with a plain class. Its sibling :is() looks similar but takes the specificity of its most specific argument, so the two are not interchangeable."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module fits the problem, and why nesting them is normal.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "React useState not updating",
          "desc": "Five causes for state that appears to be one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-22",
  "updated": "2026-09-22",
  "author": "jackson",
  "related": []
};
