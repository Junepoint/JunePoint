module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important",
  "eyebrow": "Guide",
  "description": "Your CSS rule is being ignored. Work out whether it is specificity, cascade layers, source order, an invalid value, or a selector that never matched.",
  "standfirst": "Specificity gets blamed for most losing declarations, and it is guilty less than half the time. Here is the order the browser really decides in, and how to read the answer out of DevTools.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "The cascade in decision order: origin, layers, specificity, source order, plus the non-cascade reasons a rule is ignored.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "The browser compares declarations in a fixed order: origin and importance, then element-attached styles, then cascade layers, then specificity, then source order. Specificity is one round of a longer fight, and often not the round you lost.",
        "Specificity is three counters compared left to right: `(ids, classes, types)`. No number of classes ever outranks a single id.",
        "`:where()` contributes zero. `:is()`, `:not()` and `:has()` contribute the specificity of their most specific argument.",
        "Unlayered styles beat layered ones. For `!important` declarations, the layer order reverses and unlayered loses.",
        "A struck-through declaration in DevTools with a warning icon is not a cascade problem at all. The value was invalid and the browser dropped it while parsing."
      ]
    },
    {
      "t": "h2",
      "x": "First check that the rule is even in the fight"
    },
    {
      "t": "p",
      "x": "Select the element in DevTools and read the Styles panel. There are three outcomes and they point at three unrelated problems. If your rule is not listed at all, the selector did not match this element or the stylesheet never loaded. If it is listed with the declaration struck through, something beat it and you have a genuine cascade question. If it is listed, struck through, and carrying a warning triangle, the property or value is invalid, the browser discarded it at parse time, and no amount of `!important` will resurrect it."
    },
    {
      "t": "p",
      "x": "Only the middle case is about specificity. Before spending time on counting selectors, rule out the boring causes, which are far more common in a real codebase than people admit:"
    },
    {
      "t": "ul",
      "items": [
        "**A missing or extra space in the selector.** `.card.title` matches one element carrying both classes. `.card .title` matches a descendant. They are different selectors and only one of them matches your markup.",
        "**An invalid value.** `color: #ff` and `width: 100` are dropped silently. CSS has no exceptions; a bad declaration is thrown away and the rest of the block still applies.",
        "**A shorthand later in the file.** `background: url(x.png)` resets `background-color` to its initial value. Same for `font`, `border`, `grid` and `flex`. The longhand you wrote earlier did apply, then got reset.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements. A pseudo-element without a `content` value is not generated at all.",
        "**The property is not inherited.** `color` and `font-family` flow down. `border`, `background` and `padding` do not, so styling the parent does nothing for the child.",
        "**The element is not the one you think.** Framework components often render a wrapper around the node you targeted, and your class lands on the wrapper.",
        "**The stylesheet is stale.** A cached build, a dev server that failed to recompile, or a CSS module hash that changed. Hard reload before you debug anything else."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Each of these fails for a reason that has nothing to do with specificity. */\n\n.btn { colour: red; }              /* not a property; whole declaration dropped */\n.btn { color: #ff0000ff0; }        /* not a valid color; dropped */\n.btn { width: 200; }               /* no unit on a length; dropped */\n\n.nav.item { color: red; }          /* matches <li class=\"nav item\">, not a child */\n\n.card { background-color: navy; }\n.card { background: url(bg.png); } /* shorthand resets background-color to transparent */\n\nspan.badge { height: 2rem; }       /* ignored: inline element, no display change */"
    },
    {
      "t": "h2",
      "x": "The order the browser actually decides in"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser walks a list of tie-breakers. It stops at the first one that separates them. Specificity sits well down that list."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Normal author styles beat normal user styles, which beat the browser's own defaults. Adding `!important` reverses that entire ordering, which is why a user stylesheet or an accessibility extension can override your important declaration and you cannot fight back.",
        "**Element-attached styles.** A `style` attribute wins against selectors of any specificity within the same origin and importance level. An `!important` declaration in a stylesheet still beats a normal inline style, because importance was compared one step earlier.",
        "**Cascade layers.** Later layers beat earlier ones. Unlayered styles beat every layer. Specificity is not consulted across a layer boundary at all.",
        "**Specificity.** The three counters, compared column by column.",
        "**Source order.** The last matching declaration in document order wins. This is where bundlers, import order and `<link>` order quietly decide your styling."
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Two steps this article skips over",
      "x": "Shadow DOM context and `@scope` proximity add their own steps. Scoped styles are compared by how close the scoping root is to the element, before specificity is looked at. Support for `@scope` has been landing across browsers, so check it against your own baseline rather than trusting a blog post's version numbers, including this one's."
    },
    {
      "t": "h2",
      "x": "Counting specificity without a calculator"
    },
    {
      "t": "p",
      "x": "Specificity is a triple. Column A counts id selectors. Column B counts classes, attribute selectors and pseudo-classes. Column C counts element types and pseudo-elements. Compare A first; if A ties, compare B; if B ties, compare C. The columns do not carry, so `(0,11,0)` loses to `(1,0,0)`. Combinators, the universal selector `*` and the `:where()` pseudo-class add nothing."
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
          "`li`",
          "(0,0,1)",
          "One element type"
        ],
        [
          "`ul > li a`",
          "(0,0,3)",
          "Combinators are free; the three types are not"
        ],
        [
          "`.nav a:hover`",
          "(0,2,1)",
          "A pseudo-class counts as a class"
        ],
        [
          "`a[href^=\"https\"]`",
          "(0,1,1)",
          "Attribute selectors count as classes"
        ],
        [
          "`#main .card p`",
          "(1,1,1)",
          "Beats any selector with no id, whatever else it contains"
        ],
        [
          "`li::marker`",
          "(0,0,2)",
          "Pseudo-elements count as types, unlike pseudo-classes"
        ],
        [
          "`:where(.sidebar) a`",
          "(0,0,1)",
          "`:where()` zeroes its argument"
        ],
        [
          "`:is(.sidebar, #app) a`",
          "(1,0,1)",
          "Takes the most specific argument, even the branch that did not match"
        ],
        [
          "`p:not(.intro, #x)`",
          "(1,0,1)",
          "`:not()` behaves the same way"
        ],
        [
          "`style=\"color:red\"`",
          "n/a",
          "Not a selector. Wins by being element-attached"
        ]
      ],
      "caption": "Specificity as (ids, classes, types). Columns are compared left to right and never carry over."
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes are where people get caught. `:is()`, `:not()` and `:has()` all take the specificity of their most specific argument, and they take it whether or not that argument is the branch that matched. Writing `:is(#app, .card) p` to save typing gives every match the weight of an id selector. If that is not what you want, wrap the loose end in `:where()`, which always contributes zero. CSS nesting has the same trap: a nested `&` carries the specificity of the most specific selector in the parent list, so one stray id at the top of a nested block raises everything underneath it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Deliberately weak, so anything can override it. */\n:where(.prose) a { color: inherit; text-decoration: underline; }\n\n/* Deliberately strong, without inventing an id. Repeating a class is legal\n   and each repeat adds to column B. */\n.btn.btn { padding: 0.5rem 1rem; }        /* (0,2,0) */\n\n/* Same trick, arguably more readable, same result. */\n.btn:not(#\\9) { padding: 0.5rem 1rem; }   /* (0,1,0) plus nothing useful; prefer .btn.btn */\n\n/* Nesting inherits the parent's weight. */\n#app {\n  .card { color: red; }                   /* (1,1,0), not (0,1,0) */\n}"
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer entirely"
    },
    {
      "t": "p",
      "x": "Layers exist so you can stop fighting specificity across boundaries you do not control. A declaration in a later layer beats one in an earlier layer no matter how the selectors compare, and unlayered styles beat everything in a layer. Declare the order once, near the top, and the order of the `@layer` names is fixed from then on regardless of where the blocks themselves appear."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order first. Everything after this obeys it. */\n@layer reset, vendor, components, utilities;\n\n@import url(\"bootstrap.css\") layer(vendor);\n\n@layer components {\n  #sidebar .card .title { color: rebeccapurple; }   /* (1,2,1) */\n}\n\n@layer utilities {\n  .text-ink { color: #111; }                        /* (0,1,0) and it wins */\n}\n\n/* Unlayered. Beats both of the above for normal declarations. */\nh2 { color: teal; }"
    },
    {
      "t": "p",
      "x": "That last rule surprises people who adopt layers halfway through a project. Any stylesheet you have not moved into a layer sits above all of them, so a partial migration can leave your utility layer permanently losing to legacy CSS. Migrate whole files at a time, or wrap the legacy bundle in a low-priority layer with `@import url(old.css) layer(legacy)`."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important flips the layer order",
      "x": "Among `!important` declarations, layer precedence runs backwards: the *first* layer wins, and important declarations in unlayered CSS have the lowest priority of all. So `@layer reset { .a { color: red !important } }` beats `@layer utilities { .a { color: blue !important } }`. This is intentional, since a reset layer is where a genuinely non-negotiable rule belongs, but it means sprinkling `!important` into a layered codebase produces results that look random until you know the rule."
    },
    {
      "t": "h2",
      "x": "When !important is the right call"
    },
    {
      "t": "p",
      "x": "It is not never. A utility class whose entire contract is \"this element is hidden, full stop\" is a reasonable place for it, and so is patching a third-party widget that inlines its own styles and gives you no other handle. The problem is not the keyword, it is what happens next: the only way to beat an important declaration is another important declaration, so one of them in a shared stylesheet tends to breed a dozen more."
    },
    {
      "t": "p",
      "x": "Try these in order before reaching for it. Move the rule into a later cascade layer, which is exactly the problem layers were designed for. Add a second class to the selector to raise column B. Fix the source order in your bundle if two files are simply loading the wrong way round. Only then consider `!important`, and when you do, leave a comment saying what it is overriding, because the person who deletes it later will have no other way to find out."
    },
    {
      "t": "p",
      "x": "One case has no clean answer: an inline `style` attribute carrying `!important`. That combination sits at the top of the author stack, and from your own stylesheet you cannot outrank it. The fix is to stop the attribute being written, whether that means a component prop, a `MutationObserver` as a last resort, or a bug report to whoever ships the widget."
    },
    {
      "t": "h2",
      "x": "A five step routine that ends the argument"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Read the Computed panel, not the Styles panel",
          "x": "Select the element, open Computed, expand the property. It lists the value that won and the exact rule and file it came from. This answers 'what beat me' in one click instead of by inspection."
        },
        {
          "title": "Check for a warning icon on your declaration",
          "x": "A struck-through declaration with a warning is invalid and was never in the cascade. A struck-through declaration without one lost fairly."
        },
        {
          "title": "Compare origins and importance",
          "x": "Look for `!important` on the winner, and for a `style` attribute on the element itself. Either one ends the comparison before specificity is reached."
        },
        {
          "title": "Compare layers",
          "x": "DevTools groups rules by layer. If the winner is unlayered and yours is in a layer, specificity is irrelevant and you need to move the rule, not strengthen the selector.",
          "code": "document.styleSheets[0].cssRules[0].cssText"
        },
        {
          "title": "Only now count the selectors",
          "x": "Count ids, then classes and attributes and pseudo-classes, then types. If the triples are equal, the later rule in source order won, and your fix is a build configuration change rather than a CSS change."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Keep the numbers low on purpose",
      "x": "A codebase where almost every selector is `(0,1,0)` never needs any of this. Single classes, no ids in stylesheets, layers for third-party CSS, and `:where()` for anything meant as a default. Specificity debugging is a symptom of a selector strategy, not a skill worth getting good at."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Picking the right layout model, which removes a good share of the override wars before they start.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of bug in another language: the code ran, the value lost, and the reason is an ordering rule.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node cannot find module",
          "desc": "When the stylesheet or component genuinely never loaded, resolution is usually the culprit.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks correct?",
          "a": "In roughly this order: the value is invalid and was dropped at parse time, the selector does not match the element you think it does, a shorthand later in the file reset your longhand, the property is not inherited or does not apply to that element type, or the stylesheet is a stale build. Check the Styles panel first. If your rule is not listed at all, it is not a specificity problem."
        },
        {
          "q": "Do multiple classes ever beat an id in CSS?",
          "a": "No. Specificity is compared column by column and the columns do not carry, so any selector containing one id beats a selector with a hundred classes. If you need to override an id-based rule without adding an id of your own, put your rule in a later cascade layer, or use a functional pseudo-class such as :is(#nonexistent, .my-class) to raise the id column deliberately."
        },
        {
          "q": "How do I override an inline style without using !important?",
          "a": "For a normal inline style you cannot do it with a normal declaration; element-attached styles win against every selector. An !important declaration in your stylesheet does beat a normal inline style, because importance is compared before the element-attached step. If the inline style itself carries !important, no author stylesheet can beat it and you have to stop the attribute being written."
        },
        {
          "q": "What order do cascade layers apply in?",
          "a": "Layers apply in the order their names are first declared, later layers winning over earlier ones, and unlayered styles winning over all layers. For !important declarations the order reverses: the earliest layer wins and unlayered important declarations rank lowest. Specificity is only compared within the same layer."
        },
        {
          "q": "Why does :is() or :has() make my selector stronger?",
          "a": "Both take the specificity of their most specific argument, regardless of which argument actually matched. So :is(.card, #app) p counts an id even when it matched via .card. Use :where() instead when you want the grouping without the weight, since :where() always contributes zero to all three columns."
        },
        {
          "q": "What does a crossed-out property in Chrome DevTools mean?",
          "a": "Either another declaration won the cascade, or the declaration was invalid. The two look similar, and the difference is the warning icon next to invalid ones. For overridden declarations, the Computed panel names the rule and file that won, which is faster than working it out by reading selectors."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-08",
  "updated": "2026-09-08",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
