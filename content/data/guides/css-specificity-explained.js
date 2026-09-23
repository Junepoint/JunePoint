module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers, and the rule that will not apply",
  "eyebrow": "CSS",
  "description": "Why a CSS rule loses: how specificity is really counted, where cascade layers sit in the order, and the failures that are not specificity at all.",
  "standfirst": "A working order for diagnosing an overridden declaration, from proving the selector matches to reading the six cascade steps that decide which value wins.",
  "keywords": [
    "css specificity",
    "why is my css not working",
    "cascade layers",
    "css important",
    "specificity calculator"
  ],
  "cardDesc": "Specificity, cascade layers and !important, in the order the browser actually applies them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is step five of six. Origin, importance, inline styles and cascade layers are all settled first and never revisited.",
        "Count specificity as three separate numbers, not one. Eleven type selectors give 0-0-11 and still lose to a single class at 0-1-0.",
        "`:where()` always contributes zero. `:is()`, `:not()` and `:has()` inherit the weight of their most specific argument.",
        "For normal declarations, unlayered styles beat every layer. For `!important` declarations the layer order reverses.",
        "Before blaming the cascade, prove the selector matches and the declaration parsed. A dropped value and a losing value look identical on the page."
      ]
    },
    {
      "t": "lede",
      "x": "The rule you are staring at may not be losing. It may not be matching anything, or it may have been thrown away at parse time before the cascade ever saw it. All three failures look identical in the browser and are fixed in completely different ways, so the first job is to tell them apart."
    },
    {
      "t": "h2",
      "x": "Start by proving the rule matches"
    },
    {
      "t": "p",
      "x": "Inspect the element, then drop into the console. `$0` refers to the last element you selected in the inspector, and it works in Chrome, Firefox and Safari."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does this selector hit anything at all?\ndocument.querySelectorAll('.card > .title').length   // 0 ends the investigation\n\n// Does the element you actually care about match it?\n$0.matches('.card > .title')\n\n// What did the browser settle on?\ngetComputedStyle($0).color"
    },
    {
      "t": "p",
      "x": "A zero is good news, because it means the problem is mechanical. The usual causes are a class applied conditionally by a framework where the condition is false, CSS Modules or a styled-components build hashing `.title` into `.title_a3f9b`, a child combinator written against a DOM that has since gained a wrapper `div`, or a plain typo. Nothing warns you about a misspelled class name. To a browser, a selector that matches nothing is not an error, it is just a selector that matches nothing."
    },
    {
      "t": "p",
      "x": "If `matches()` returns `true` and the computed value is still wrong, you have a genuine cascade problem. Everything below applies."
    },
    {
      "t": "h2",
      "x": "The cascade decides in a fixed order"
    },
    {
      "t": "p",
      "x": "Two declarations set the same property on the same element. The browser sorts them by these criteria in order, stopping at the first one that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Whether the declaration came from the browser's default stylesheet, a user stylesheet or your own CSS, and whether it carries `!important`.",
        "**Context.** Which shadow tree it came from, which only matters if you are using web components.",
        "**Element-attached styles.** A `style` attribute on the element beats any stylesheet rule in the same origin and importance bucket.",
        "**Cascade layers.** A later layer beats an earlier one. Unlayered styles beat every layer.",
        "**Specificity.** The three-number count that most people mean when they say specificity.",
        "**Order of appearance.** The last matching declaration in source order wins."
      ]
    },
    {
      "t": "p",
      "x": "Read that list again and notice how far down specificity sits. This is the part that trips people up. A selector with lower specificity can and routinely does beat one with higher specificity, because the argument was already over by step four."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "The importance ladder",
      "x": "`!important` does not add weight to a declaration, it moves the declaration into a different bucket. The full order, weakest to strongest, is: user-agent normal, user normal, author normal, CSS animations, author `!important`, user `!important`, user-agent `!important`, CSS transitions. A running transition outranks everything, including your `!important`, which is why a forced value sometimes appears to do nothing for a few hundred milliseconds and then snaps into place."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Three slots, written here as A-B-C. Slot A counts ID selectors. Slot B counts classes, attribute selectors and pseudo-classes. Slot C counts type selectors and pseudo-elements. Compare the slots left to right and stop at the first difference. Combinators and the universal selector contribute nothing."
    },
    {
      "t": "p",
      "x": "It is not a base-10 number. Eleven type selectors give 0-0-11, and 0-0-11 loses to 0-1-0 every time. Treating the three slots as digits in a single integer works fine until you have ten of something, then it quietly stops working. That is where the folklore about specificity 'overflowing' comes from."
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
          "`*`",
          "0-0-0",
          "The universal selector and all combinators are free."
        ],
        [
          "`li::before`",
          "0-0-2",
          "Pseudo-elements count in the same slot as type selectors."
        ],
        [
          "`.nav li`",
          "0-1-1",
          "One class, one type, descendant combinator adds nothing."
        ],
        [
          "`[data-state=\"open\"]`",
          "0-1-0",
          "Attribute selectors weigh the same as classes."
        ],
        [
          "`:hover`",
          "0-1-0",
          "Ordinary pseudo-classes weigh the same as classes."
        ],
        [
          "`#main`",
          "1-0-0",
          "Only ID selectors fill the first slot."
        ],
        [
          "`[id=\"main\"]`",
          "0-1-0",
          "Matches the same element, far lighter in practice."
        ],
        [
          "`.btn.btn.btn`",
          "0-3-0",
          "Repeating a class is a legal way to buy weight."
        ]
      ],
      "caption": "Specificity of common selectors. Compare slot by slot, left to right."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The four-slot model for inline styles",
      "x": "You will often see inline styles described as specificity 1-0-0-0. It is a useful shorthand and it predicts the right answer most of the time. The spec treats element-attached styles as a separate, earlier step instead, and the difference becomes visible once layers and `!important` are involved. If a mental model is giving you the wrong answer in a layered codebase, this is a likely reason."
    },
    {
      "t": "h2",
      "x": "Selectors that change the arithmetic"
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes added over the last few years all have specificity rules of their own, and they are the fastest route to a surprising result."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* :is(), :not() and :has() take the weight of their\n   most specific argument. */\n\n:is(#app, .page) p    { }  /* 1-0-1, the #app branch sets the weight\n                              even when .page is what matched */\n\n:not(.hidden)         { }  /* 0-1-0 */\n\n:where(#app, .page) p { }  /* 0-0-1, :where() contributes nothing */\n\n/* Nesting: & behaves like :is() of the parent selector list */\n#app, .card {\n  & .title { }             /* :is(#app, .card) .title, so 1-1-0 */\n}"
    },
    {
      "t": "p",
      "x": "`:where()` is the genuinely useful one. Wrapping a default in `:where()` drops it to zero, so any later rule can override it with a bare class and no escalation. Design system authors use it precisely so their base styles never fight the people consuming them. `:is()` does you the opposite favour. It is convenient for grouping, but a single ID anywhere in the argument list sets the weight for every branch, including the branches that contain no ID at all."
    },
    {
      "t": "h2",
      "x": "Cascade layers settle it before specificity is consulted"
    },
    {
      "t": "p",
      "x": "Layers sit above specificity in the sort order. That is the whole point of them. You put third-party CSS in an early layer and stop caring how aggressive its selectors are, because a bare class in a later layer will beat a chain of IDs in an earlier one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, at the top of your entry stylesheet.\n   Layers listed first have the lowest priority. */\n@layer reset, vendor, base, components, utilities;\n\n@import url(\"bootstrap.css\") layer(vendor);\n\n@layer components {\n  #sidebar .btn { background: navy; }   /* 1-1-0 */\n}\n\n@layer utilities {\n  .bg-red { background: red; }          /* 0-1-0, and it wins */\n}"
    },
    {
      "t": "p",
      "x": "Two behaviours catch people out. First, unlayered styles are not the weakest thing in the document, they are the strongest: for normal declarations, anything outside a layer beats everything inside one. Second, importance reverses layer order completely."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base      { .btn { color: red  !important } }\n@layer overrides { .btn { color: blue !important } }\n\n/* red wins. For !important declarations the layer\n   order is reversed, and layered important styles\n   outrank unlayered important styles. */"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Set the layer order explicitly",
      "x": "Layer order is fixed by first appearance, so if you never declare it, your bundler decides it. Put the full `@layer a, b, c;` statement at the top of your entry stylesheet on day one. Otherwise an innocent change to import order silently reorders your cascade, and the resulting bug looks like a specificity problem rather than a build problem."
    },
    {
      "t": "p",
      "x": "On browser support: cascade layers shipped across Chrome, Firefox and Safari during the first half of 2022, in Chrome 99, Firefox 97 and Safari 15.4. Those versions are stated as of September 2026 and worth confirming on caniuse against your own support floor, because the failure mode is harsh. A browser that does not understand `@layer` skips the entire block, so every rule inside it disappears rather than degrading."
    },
    {
      "t": "h2",
      "x": "When !important is the right answer"
    },
    {
      "t": "p",
      "x": "It has real uses. Overriding an inline style written by a third-party widget you do not control is the clearest one, because nothing else in an author stylesheet can beat an inline style. User stylesheets are the other: user `!important` outranks author `!important` by design, and that is the one part of the cascade deliberately built to let a reader overrule a developer. If you are writing an accessibility override, reach for it without guilt."
    },
    {
      "t": "p",
      "x": "What makes it painful inside your own codebase is that the move is one-way. Once a declaration is important, the only thing in the same origin that beats it is another important declaration, so every future override has to escalate too. If you are adding a second `!important` to defeat the first, stop. Move one of the two rules into a layer instead and let the layer order do the work, which is reversible and readable in a way that a trail of `!important` never is."
    },
    {
      "t": "h2",
      "x": "Failures that have nothing to do with specificity"
    },
    {
      "t": "ul",
      "items": [
        "**The value was invalid and got dropped.** `width: 100` with no unit, a colour with the wrong number of hex digits, a misspelled property name. The declaration is discarded at parse time. DevTools greys it out with a small warning triangle, which is easy to scroll past.",
        "**A shorthand later in the file reset your longhand.** `background: url(hero.png)` after `background-size: cover` resets the size back to `auto`. The same trap exists with `font`, `flex`, `border` and `grid-area`.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements. `gap` needs a flex, grid or multi-column container. `z-index` is ignored on a `position: static` element unless it is a flex or grid item.",
        "**A condition around the rule does not match.** A `@media` or `@supports` block that evaluates false means the rule is never listed in the Styles pane at all, which reads as 'my rule vanished' rather than 'my rule lost'.",
        "**The stylesheet never loaded.** A 404 on the CSS file, a stale service worker, a dev server handing back a cached build. Check the Network tab first if the whole file seems inert.",
        "**A transition or animation is still driving the property.** If the value flickers to what you wanted and then reverts, the Animations panel will tell you more than the Styles pane."
      ]
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element and the match",
          "x": "Inspect the element, then check it in the console. If `matches()` is false, the cascade is irrelevant and you are looking for a selector or a DOM bug.",
          "code": "$0.matches('.card > .title')"
        },
        {
          "title": "Read the Styles pane top to bottom",
          "x": "Rules are listed strongest first. A declaration with a line through it lost to something above it. A declaration greyed out with a warning icon was never valid in the first place. Those two states mean completely different things and look similar at a glance."
        },
        {
          "title": "Switch to Computed",
          "x": "The Computed tab shows the value that actually won and links straight to the rule that produced it. This is faster than reasoning about the Styles list, and it is the only reliable way to trace an inherited property back to the ancestor it came from."
        },
        {
          "title": "Test whether it is a cascade problem at all",
          "x": "Temporarily add a deliberately overpowered rule. If the element changes, you have a cascade problem and can work out the minimum weight you need. If nothing changes, the property is being ignored for one of the reasons in the previous section.",
          "code": "/* diagnostic only, delete afterwards */\n#app .card .title { color: red !important; }"
        },
        {
          "title": "Fix it at the right level",
          "x": "Prefer, in order: put the rules in layers so the intent is declared once; add a class; duplicate a class (`.btn.btn`) to buy a point of specificity without inventing markup. Adding an ID to the selector should be the last resort, because it raises the floor for every override that comes after you."
        }
      ]
    },
    {
      "t": "p",
      "x": "Most stubborn override bugs come down to two rules with identical specificity where source order picks the loser, and source order in a bundled application is decided by import graph traversal rather than by anything you wrote. Layers exist to take that decision away from the bundler. If you are fighting the same override fight more than once a month, that is the fix, not another selector."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing a layout model by what the content needs, not by which one you learned first.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "React useState not updating",
          "desc": "Five causes for state that reads one render behind, including stale closures.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        },
        {
          "title": "JavaScript async/await",
          "desc": "Execution order, real concurrency with Promise.all, and where errors go missing.",
          "href": "/guides/javascript-async-await-explained/",
          "eyebrow": "JavaScript"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "There are three candidates and they need different fixes. The selector may match nothing, which you can confirm with `document.querySelectorAll(sel).length` in the console. The declaration may have been dropped as invalid, which DevTools shows as greyed-out text with a warning triangle. Or it matched and parsed and simply lost the cascade, in which case the Styles pane will show it struck through. Check in that order, because only the third case has anything to do with specificity."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes. An `!important` declaration in your stylesheet beats a normal inline `style` attribute, because importance is sorted before element-attached styles are considered. If the inline style is itself marked `!important`, it wins again. That is the usual reason people reach for `!important` against embedded third-party widgets, which frequently write inline styles from JavaScript."
        },
        {
          "q": "Is an ID selector always stronger than a class?",
          "a": "In a straight specificity comparison, yes: one ID beats any number of classes. But specificity is only consulted after layers, so a class in a later cascade layer beats an ID in an earlier one, and an unlayered class beats a layered ID. Wrapping the ID in `:where()` also drops it to zero."
        },
        {
          "q": "How do I override a CSS rule without using !important?",
          "a": "Match the specificity and come later in source order, or exceed it by the smallest possible amount. Repeating a class, as in `.btn.btn`, adds a point without changing your markup or introducing an ID. The cleaner long-term answer is cascade layers: put the styles you want to override in an earlier layer and your overrides in a later one, and specificity stops mattering between them."
        },
        {
          "q": "Why does my utility class not override the component styles?",
          "a": "Usually because both are a single class, so specificity ties and source order decides, and the component CSS happens to be emitted after the utilities. Utility frameworks that support layers solve this by declaring a utilities layer last. If yours does not, check the generated bundle to see which block comes second rather than guessing from your import statements."
        },
        {
          "q": "What is the specificity of :not(), :is() and :has()?",
          "a": "All three take the specificity of their most specific argument. `:not(.hidden)` is 0-1-0. `:is(#app, .page)` is 1-0-0 even when the `.page` branch is the one that matched. `:where()` is the exception and always counts as zero, whatever you put inside it."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-23",
  "updated": "2026-09-23",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
