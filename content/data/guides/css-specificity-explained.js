module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "Work out why a CSS rule loses: specificity scoring, cascade layers, !important, and the causes that have nothing to do with either.",
  "standfirst": "Four separate mechanisms decide which declaration wins, and specificity is only one of them. This walks them in the order the browser applies them, so you can find the rule beating yours.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important",
    "specificity calculator"
  ],
  "cardDesc": "Why a CSS rule loses: specificity scoring, cascade layers, !important, and the causes that are not specificity.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "A declaration fails for one of four reasons: the selector never matched, the value was invalid, something with more weight won, or something with equal weight came later.",
        "Specificity is three numbers, not one: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. They are compared left to right and never carry. Eleven classes still lose to one ID.",
        "Cascade layers sit **above** specificity. A single-class selector in a later layer beats an ID selector in an earlier one, and unlayered styles beat every layer.",
        "`!important` reverses layer order and origin order. That reversal is why it behaves in ways people find surprising.",
        "`:where()` contributes zero specificity, which makes it the cleanest way to write defaults that are easy to override later."
      ]
    },
    {
      "t": "h2",
      "x": "Rule out the causes that are not specificity"
    },
    {
      "t": "p",
      "x": "**Before you count anything, confirm the declaration is reaching the element at all.** Most of the time I have chased a specificity problem, it turned out not to be one. The rule was never in the running."
    },
    {
      "t": "p",
      "x": "Open DevTools and select the element. If your rule is not in the Styles panel at all, the selector did not match. If it is there but the whole rule is greyed out, the stylesheet or the media query is not active. If a single property is struck through, something else won it, and DevTools will usually show you what. If the property name itself is greyed out with a warning triangle, the value was invalid and the browser threw the declaration away at parse time."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".button {\n  color: #zzz;      /* invalid hex, dropped at parse time */\n  padding: 10;      /* invalid: non-zero lengths need a unit */\n  width: 20rem;     /* ignored on a non-replaced inline element */\n  background: blue; /* this one is fine */\n}"
    },
    {
      "t": "p",
      "x": "CSS discards bad declarations individually and keeps parsing, which is forgiving at runtime and unhelpful at debugging time. A typo in one line does not break the rest of the block, so nothing shouts at you."
    },
    {
      "t": "p",
      "x": "There is a subtler version involving custom properties. If a declaration uses `var()` and the referenced property is not defined anywhere, the declaration becomes invalid at computed-value time. That is not the same as being dropped at parse time. The property falls back to its inherited value, or to its initial value if it does not inherit, so you get an unexpected color rather than no color. Always pass a fallback when the property might be missing: `color: var(--brand, #1f2937)`."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Transitions and animations outrank everything",
      "x": "While a transition is running, the transitioned value wins over every author declaration, including `!important`. Values applied from a running `@keyframes` animation sit above normal declarations too. If a property only looks wrong for a moment, or only on hover, look for a transition before you look at selectors."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a triple. Write it as (A, B, C)."
    },
    {
      "t": "ul",
      "items": [
        "**A** counts ID selectors: `#header`.",
        "**B** counts class selectors, attribute selectors and pseudo-classes: `.card`, `[disabled]`, `:hover`, `:nth-child(2)`.",
        "**C** counts element types and pseudo-elements: `div`, `a`, `::before`, `::marker`."
      ]
    },
    {
      "t": "p",
      "x": "Combinators contribute nothing. The universal selector `*` contributes nothing. Comparison runs left to right and stops at the first difference, with no carrying between columns, which is the part people get wrong. A selector made of eleven classes scores (0, 11, 0) and loses to a single ID at (1, 0, 0). There is no amount of class stacking that closes that gap."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "a                        /* (0,0,1) */\nli::marker               /* (0,0,2) */\n.card a                  /* (0,1,1) */\na[href^='https']         /* (0,1,1) */\na:hover                  /* (0,1,1) */\np:not(.lead)             /* (0,1,1)  :not() adds nothing, its argument does */\n:is(.card, #main) a      /* (1,0,1)  :is() takes its most specific argument */\n:where(#main) a          /* (0,0,1)  :where() is always zero */\n#main a                  /* (1,0,1) */\n.a.b.c.d.e.f.g.h.i.j.k   /* (0,11,0) loses to #main a on the first column */"
    },
    {
      "t": "p",
      "x": "Two functional pseudo-classes deserve attention because they are the main lever you have over specificity today. `:is()` and `:not()` take the specificity of their most specific argument, so `:is(.card, #main)` costs you an ID whether or not the ID is the part that matched. `:where()` always scores zero no matter what you put inside it. That asymmetry is deliberate and useful."
    },
    {
      "t": "p",
      "x": "Native CSS nesting follows the `:is()` rule. A nested `&` takes the specificity of the whole parent selector list, so nesting inside a rule that happens to include an ID quietly raises the cost of everything underneath it."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Score",
        "Note"
      ],
      "rows": [
        [
          "`.nav .item.active a`",
          "(0, 3, 1)",
          "Three class-level parts, one type"
        ],
        [
          "`#nav .item a.active`",
          "(1, 2, 1)",
          "Beats the row above on the ID column alone"
        ],
        [
          "`nav ul li a`",
          "(0, 0, 4)",
          "Long, deep and still very weak"
        ],
        [
          "`:where(.theme-dark) .btn`",
          "(0, 1, 0)",
          "The theme wrapper is free"
        ],
        [
          "`input[type='text']:focus`",
          "(0, 2, 1)",
          "Attribute and pseudo-class both count in B"
        ],
        [
          "`style=\"color: red\"`",
          "n/a",
          "The style attribute sits above all selectors"
        ]
      ],
      "caption": "Worked specificity examples. The style attribute is not scored; it is a separate, higher step in the cascade."
    },
    {
      "t": "h2",
      "x": "Ties are broken by source order, per property"
    },
    {
      "t": "p",
      "x": "When two declarations have equal weight, the one that appears later in the document wins. Later means later in the final concatenated order the browser sees, which is the order your `<link>` elements appear in, or the order your bundler emitted the chunks in. This is the reason a rule works locally and fails in production often enough to be worth checking first when the two environments split CSS differently."
    },
    {
      "t": "p",
      "x": "The cascade resolves each property independently, not each rule. A rule can win `color` and lose `background-color` to a different rule in the same document. That is normal and it is why DevTools strikes through individual lines rather than whole blocks."
    },
    {
      "t": "p",
      "x": "Shorthands complicate this. `background: red` sets every background longhand, including resetting `background-image` to `none`. If you set `background-image` earlier and a shorthand later, the shorthand wins at equal specificity and your image disappears. Same story with `font`, `border` and `grid-area`."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity entirely"
    },
    {
      "t": "p",
      "x": "**If layers are in play, check them before you count anything.** Layer order is evaluated before specificity, so a weak selector in a later layer beats a strong selector in an earlier one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. This is the important line. */\n@layer reset, vendor, components, utilities;\n\n@layer components {\n  #sidebar .promo .title { color: rebeccapurple; }  /* (1,2,0) */\n}\n\n@layer utilities {\n  .text-slate { color: #475569; }                   /* (0,1,0) */\n}\n\n/* .text-slate wins. utilities is declared after components,\n   and layer order is checked before specificity is. */\n\nh1 { color: black; }\n/* Unlayered normal styles beat every layer, however weak they look. */"
    },
    {
      "t": "p",
      "x": "That last line catches people out. Unlayered author styles have the highest priority among normal author declarations, above all layers. So dropping a third-party stylesheet into `@layer vendor` is an effective way to make your own unlayered styles win without raising their specificity. Do this on purpose, or not at all: a codebase where half the CSS is layered and half is not becomes very hard to reason about."
    },
    {
      "t": "p",
      "x": "The first `@layer` statement establishes the order. Later `@layer` blocks with the same name append to an existing layer rather than moving it. If you never declare the order explicitly, layers are ordered by first appearance, which makes the outcome depend on import order."
    },
    {
      "t": "p",
      "x": "CSS also has `@scope`, which adds a proximity tiebreak so the nearest scope root wins. It is genuinely useful for theming, but browser support arrived more recently than layers did, so check current support before you depend on it in production."
    },
    {
      "t": "h2",
      "x": "What !important actually does"
    },
    {
      "t": "p",
      "x": "`!important` does not add specificity. It moves the declaration into a different origin bucket, and those buckets are compared before specificity is. The full order, from lowest priority to highest:"
    },
    {
      "t": "ol",
      "items": [
        "Browser default (user agent) normal declarations",
        "User stylesheet normal declarations",
        "Author normal declarations, which is your CSS",
        "Values from a running animation",
        "Author `!important` declarations",
        "User `!important` declarations",
        "Browser default `!important` declarations",
        "Values from a running transition"
      ]
    },
    {
      "t": "p",
      "x": "Two consequences matter in practice. A user stylesheet with `!important` beats anything you write, which is how accessibility overrides are meant to work. And within author styles, `!important` **reverses** layer order: earlier layers now win over later ones, and unlayered important declarations drop to the bottom instead of rising to the top."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The reversal bites hardest in utility CSS",
      "x": "If you put a vendor stylesheet in an early layer to keep it out of your way, any `!important` inside that vendor CSS becomes the hardest thing to override in your entire document. Layers do not neutralise `!important`, they invert it."
    },
    {
      "t": "p",
      "x": "There are legitimate uses. Overriding a third-party widget that writes inline styles is one, because a stylesheet declaration with `!important` does beat a plain style attribute. Print stylesheets are another. Debugging is a third: adding `!important` temporarily tells you quickly whether you have a cascade problem or a matching problem. As a default tool for winning arguments with your own CSS, it just moves the fight up a level, and the next person needs two of them."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "Run the selector against the element in the console. If `matches()` returns false, stop here: nothing about specificity matters yet. Check for a missing class, a dynamically added wrapper, or an element that only exists after hydration.",
          "code": "const el = document.querySelector('.promo .title');\nel.matches('#sidebar .promo .title');   // false means the rule never applied\ndocument.querySelectorAll('.promo .title').length;"
        },
        {
          "title": "Read the computed value, not the rule list",
          "x": "`getComputedStyle` tells you what the browser settled on. Comparing that to what you expected usually narrows the problem to one property.",
          "code": "getComputedStyle(el).color;\ngetComputedStyle(el).getPropertyValue('--brand');  // custom properties too"
        },
        {
          "title": "Find the winner in the Styles panel",
          "x": "Your declaration will be struck through. Scroll up: the rule showing the same property without a strikethrough is the one beating you. DevTools lists rules in cascade order, strongest first, and labels the layer when layers are used."
        },
        {
          "title": "Ask why it won, in this order",
          "x": "Is it in a later layer, or unlayered while yours is layered? Does it use `!important`? Is it an inline style? Is it higher specificity? Or is it simply later in the file at the same specificity? Those are the only options, and they are checked in that order."
        },
        {
          "title": "Fix at the lowest level you can",
          "x": "Prefer moving the rule later in the same layer, or matching the existing specificity pattern of the codebase. Raising specificity works once. Doing it repeatedly is how a stylesheet ends up with selectors nobody can safely delete."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Keeping specificity low on purpose"
    },
    {
      "t": "p",
      "x": "The long-term fix is to keep most of your selectors at the same weight so that source order does the work. A few habits get you most of the way there."
    },
    {
      "t": "ul",
      "items": [
        "Style with single class selectors. A flat codebase at (0, 1, 0) is trivially overridable by anything you add later.",
        "Do not use IDs in CSS. Keep them for anchors, labels and JavaScript hooks where they cost nothing.",
        "Wrap contextual ancestors in `:where()`. `:where(.theme-dark) .btn` scores the same as `.btn` alone, so themes do not inflate everything beneath them.",
        "Put third-party CSS in an early layer, once, at the point of import.",
        "Reach for `!important` only against code you do not control, and leave a comment saying which library and why."
      ]
    },
    {
      "t": "p",
      "x": "None of this is free. Low-specificity systems depend on source order, which means they depend on build output, and that is a different kind of fragility. The trade you are making is a problem you can see in one file for a problem spread across many. Most teams find that worth it, but it is a trade, not a free win."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Four common reasons. Something else also uses `!important` and has higher specificity or comes later. A running transition or animation is supplying the value, and both outrank `!important`. Your declaration is inside a cascade layer and a competing important declaration sits in an earlier layer, because `!important` reverses layer order. Or the value is invalid and was discarded, in which case `!important` on a broken declaration changes nothing."
        },
        {
          "q": "Can a class ever beat an ID in CSS?",
          "a": "Not on specificity alone, no matter how many classes you chain. It can win in other ways: if the class rule is in a later cascade layer, if it is unlayered while the ID rule is layered, if it uses `!important` and the ID rule does not, or if the ID selector is wrapped in `:where()`, which zeroes it out."
        },
        {
          "q": "How do I check the specificity of a selector?",
          "a": "Count the three columns by hand, which is quick once you know the rules, or hover the selector in the Chrome DevTools Styles panel to see the computed triple. Remember that `:is()` and `:not()` inherit the weight of their most specific argument and `:where()` is always zero."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes. Layer order is compared before specificity for normal declarations, so any declaration in a later layer beats any declaration in an earlier one regardless of selector weight. Unlayered normal styles sit above all layers. For `!important` declarations the whole order flips."
        },
        {
          "q": "Why does DevTools show my CSS crossed out?",
          "a": "Either another declaration won that property, in which case it appears in a rule higher up the panel, or the declaration is invalid. Invalid declarations usually also show a warning icon and the property name greyed out. Hovering the struck-through line normally names the rule that beat it."
        },
        {
          "q": "Should I use IDs in CSS at all?",
          "a": "As selectors, generally no. They win on the first specificity column, which means the only way to override them later is another ID or `!important`, and both choices push the problem forward. Use IDs for fragment links, `label` associations and JavaScript lookups, and style through classes."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "A decision rule for layout, plus the patterns where each one stops fighting you.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The other common 'my change is not showing up' bug, from the JavaScript side.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-30",
  "updated": "2026-09-30",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
