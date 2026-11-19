module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity, Layers and !important: What Wins",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Why your CSS rule is not applying: how specificity is counted, where cascade layers and !important sit in the cascade, and which cheaper checks to run first.",
  "standfirst": "The cascade compares origin, inline styles and layers before it ever looks at specificity. Here is the order it really uses, plus the faster checks that explain most failures.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "css cascade order"
  ],
  "cardDesc": "Specificity columns, cascade order, the layer reversal for !important, and how to find why a rule lost.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Rule out the cheap causes first. An invalid value, a selector that does not match, or a property that does not apply to that element costs nothing to check and explains most cases.",
        "Specificity is three numbers compared left to right: IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements. The columns never carry, so eleven classes still lose to one ID.",
        "The cascade sorts by origin and importance, then element-attached (inline) styles, then cascade layers, and only then specificity. A one-class selector in a later layer beats an ID selector in an earlier layer.",
        "Layer order reverses for `!important`. Among important declarations the earliest layer wins, and unlayered important declarations rank below every layered one.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument.",
        "A transitioning value outranks `!important`. An animating value does not, which is why an important rule can appear to break `@keyframes`."
      ]
    },
    {
      "t": "lede",
      "x": "Specificity is blamed for a lot of problems it did not cause. Before you count selector columns, open the Computed tab in DevTools and look at the property you expected to change. If your value is not listed there at all, as either the winner or a struck-through loser, then no rule beat you: the declaration never entered the competition. That distinction decides which half of this page you need."
    },
    {
      "t": "h2",
      "x": "First check that your declaration is even in the running"
    },
    {
      "t": "p",
      "x": "CSS fails quietly by design. The parser drops what it cannot understand and carries on with the rest of the stylesheet, so a single bad character removes one line instead of breaking the page. Useful behaviour, and a confusing one when you are the person who typed the bad character. Work through these before touching specificity."
    },
    {
      "t": "ul",
      "items": [
        "**The property or value is invalid.** `colour: red`, `width: 100` with no unit, `transform: translateX(10)` without a unit: all discarded. Chrome and Firefox both flag the line in the Styles pane, so look for the warning icon rather than assuming the rule lost a fight.",
        "**The selector does not match.** `.card > .title` fails the moment a wrapper element appears between them. A class your framework adds after hydration will not match while you are inspecting server-rendered markup. Paste the selector into `document.querySelectorAll()` and check the count.",
        "**The property does not apply to that element.** `width` and vertical `margin` do nothing on a non-replaced inline element. `gap` does nothing unless the parent is a flex, grid or multi-column container. `z-index` does nothing on a `position: static` element. `align-items` does nothing on a block container.",
        "**A shorthand later in the cascade reset it.** `background: url(hero.png)` after `background-color: #c00` wipes the colour, because a shorthand sets every longhand it owns, including the ones you omitted. `all`, `font`, `border` and `grid-area` cause the same surprise.",
        "**A `var()` resolved to nothing.** If a custom property is unset or holds a value the property cannot use, the declaration becomes invalid at computed-value time. The property then inherits or falls back to its initial value, rather than keeping whatever it had before.",
        "**The stylesheet is not loaded, or the class was renamed.** A 404 on a `<link>`, a CSS Modules hash you did not expect, a utility class removed by the build because it only ever appeared in a template string."
      ]
    },
    {
      "t": "p",
      "x": "If the Computed tab does show your declaration, struck through, then something genuinely outranked it. Now the cascade matters."
    },
    {
      "t": "h2",
      "x": "How specificity is counted"
    },
    {
      "t": "p",
      "x": "Specificity is not one number. It is three, usually written as a triple, and they are compared from left to right like version numbers. The first column counts ID selectors. The second counts class selectors, attribute selectors and pseudo-classes. The third counts type selectors and pseudo-elements. The universal selector `*`, combinators such as `>` and `+`, and the specificity-neutral pseudo-classes contribute nothing at all."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,0,1  one type selector */\np { color: #333; }\n\n/* 0,1,0  one class */\n.lead { color: #c00; }\n\n/* 0,1,1  one class, one type */\np.lead { color: #060; }\n\n/* 0,2,2  .lead and :first-of-type in column B; article and p in column C */\narticle p.lead:first-of-type { color: #06c; }\n\n/* 0,1,0  an attribute selector counts the same as a class */\n[data-state=\"open\"] { color: #a0f; }\n\n/* 0,0,2  a pseudo-element counts as a type selector */\nli::marker { color: #888; }\n\n/* 1,0,0  one ID, and this beats 0,2,2 because column A decides first */\n#intro { color: #000; }"
    },
    {
      "t": "p",
      "x": "The columns do not carry. Ten classes give you 0,10,0, which still loses to 1,0,0. No current browser overflows these counters either, so the old advice about stacking enough classes to beat an ID is simply wrong. If two declarations tie on all three columns, the one that appears later in the final stylesheet order wins. That order comes from your `<link>` sequence or your bundler's concatenation, not from file names, which is why a tie can resolve differently in development and production."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Inline styles are not \"specificity 1,0,0,0\"",
      "x": "That shorthand predicts the right answer most of the time, but inline styles are handled by their own step in the cascade, above layers and above specificity. This matters in practice: you cannot out-specify a `style` attribute from a stylesheet, no matter how many IDs you chain, because the comparison never reaches the specificity step."
    },
    {
      "t": "h3",
      "x": "The selectors that deliberately count as zero"
    },
    {
      "t": "p",
      "x": "`:where()` was added so that library authors could write broad selectors without inflating specificity. Its arguments always contribute zero. `:is()`, `:not()` and `:has()` behave differently: each takes the specificity of its most specific argument, which makes a single long `:is()` list a hidden specificity trap."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,1,0  :where() adds nothing; only .btn counts */\n:where(article, #main, .wrapper) .btn { padding: .5rem 1rem; }\n\n/* 1,1,0  :is() takes its most specific argument, #main */\n:is(article, #main, .wrapper) .btn { padding: .5rem 1rem; }\n\n/* 0,2,0  .btn plus the .disabled inside :not() */\n.btn:not(.disabled) { cursor: pointer; }\n\n/* 0,2,0  :has() counts its argument too */\n.card:has(.badge) { border-color: gold; }\n\n/* 0,1,0  the :where() wrapper neutralises the argument again */\n.card:where(:has(.badge)) { border-color: gold; }"
    },
    {
      "t": "p",
      "x": "A practical habit: write your own base and component styles with `:where()` around anything structural, so application code can override them with a plain class. `:has()` reached all three major engines during 2023, with Firefox last in December of that year. `:where()` and `:is()` landed earlier. Check caniuse.com for the support floor your project needs rather than trusting a date in an article."
    },
    {
      "t": "h2",
      "x": "The cascade compares several things before specificity"
    },
    {
      "t": "p",
      "x": "CSS Cascading and Inheritance Level 5 defines the sort order, and specificity is near the bottom of it. The engine first groups declarations by origin and importance. Origin means who wrote the rule: the browser's own default stylesheet, the user's stylesheet or accessibility override, or you, the author. Importance means whether the declaration carries `!important`, which does not raise specificity; it moves the declaration into a different, higher bucket."
    },
    {
      "t": "table",
      "head": [
        "Precedence",
        "What it is",
        "Worth knowing"
      ],
      "rows": [
        [
          "1. Transitions",
          "A property currently mid-transition",
          "Outranks everything, including `!important`. A value can visibly disagree with your important rule for the duration of the transition."
        ],
        [
          "2. UA `!important`",
          "Browser default stylesheet, important",
          "Rare, and deliberately unreachable from author CSS."
        ],
        [
          "3. User `!important`",
          "User stylesheet or accessibility override",
          "This is the layer that lets a reader force their own font size over yours. It is meant to beat you."
        ],
        [
          "4. Author `!important`",
          "Your important rules and your dependencies'",
          "Sorted internally by inline first, then layers in reverse order, then specificity, then document order."
        ],
        [
          "5. Animations",
          "A property driven by `@keyframes`",
          "Beats normal author rules, loses to author `!important`. This is the usual reason an important rule appears to stop an animation."
        ],
        [
          "6. Normal author",
          "Almost all of your CSS",
          "Sorted by inline, then layers, then specificity, then document order."
        ],
        [
          "7. Normal user",
          "User stylesheet, not important",
          "Below your normal styles."
        ],
        [
          "8. Normal UA",
          "Browser defaults",
          "The floor, and the reason `h1` has a margin you did not ask for."
        ]
      ],
      "caption": "Cascade precedence, highest first, per CSS Cascading and Inheritance Level 5."
    },
    {
      "t": "p",
      "x": "Inside a single bucket the engine keeps going: encapsulation context such as shadow DOM, then element-attached styles, then cascade layers, then `@scope` proximity where supported, then specificity, then order of appearance. Each step only runs if the previous one produced a tie. Specificity is a tiebreaker, not the main event."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer entirely"
    },
    {
      "t": "p",
      "x": "`@layer` shipped across Chrome, Firefox and Safari in the first half of 2022, and it is the cleanest tool available for the \"a library keeps beating me\" problem. Layers are compared before specificity, and the order you declare them in is the order of increasing precedence for normal declarations. Declare the order once, at the top of your entry stylesheet, so it does not depend on which file imports what."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One authoritative ordering. Later layers win for normal declarations. */\n@layer reset, vendor, components, utilities;\n\n@layer vendor {\n  #app .button { background: rebeccapurple; }  /* 1,1,0 */\n}\n\n@layer components {\n  .button { background: teal; }                /* 0,1,0 */\n}\n\n/* teal wins. The layer comparison resolves first, so 1,1,0 vs 0,1,0\n   is never evaluated. */\n\n/* Unlayered normal styles behave as a final, highest layer. */\n.button { background: coral; }  /* this one actually wins */"
    },
    {
      "t": "p",
      "x": "That last line is the part people trip over. Unlayered normal declarations beat every layer, so moving a third-party stylesheet into `@layer vendor` is usually enough to tame it, and you can do that at the import site with `@import url(\"vendor.css\") layer(vendor);`. Note that this only works for stylesheets you can route through `@import` or an `@layer` block; a `<link>` tag cannot be assigned a layer."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layer order reverses for !important",
      "x": "Among important declarations, the **earliest** layer wins, and unlayered important declarations rank **below** every layered one. So `@layer base { .x { color: red !important } }` beats `@layer overrides { .x { color: blue !important } }`, and a bare `.x { color: green !important }` loses to both. The reasoning is that an important declaration in a low-level layer is a deliberate hard constraint, but the result reads as backwards until you have hit it once."
    },
    {
      "t": "p",
      "x": "Layers also give you `revert-layer`, which drops a property back to the value it would have had from lower layers. That is a better escape hatch than guessing at a value, particularly inside a component that may be used under different themes."
    },
    {
      "t": "h2",
      "x": "!important, and what to reach for instead"
    },
    {
      "t": "p",
      "x": "`!important` is not always wrong. It is the correct tool for a utility class that must always hold, such as a `.sr-only` or a forced `display: none`, and for overriding a third-party widget that writes inline styles from JavaScript. What makes it corrosive is that it is unanswerable: once a value is important, the only author-level responses are another important declaration or an inline important declaration, and both escalate. Teams end up with important rules competing on document order, which is the least stable tiebreaker there is."
    },
    {
      "t": "ul",
      "items": [
        "**To beat a library's normal rules:** put the library in an earlier `@layer`. Specificity stops mattering, and you keep your own selectors short.",
        "**To beat a library's important rules:** match or exceed it with an important declaration of your own, then win on inline, layer order (earliest layer), specificity, or document order, in that sequence.",
        "**To beat an inline style set by a script:** an important author declaration is enough, because inline normal styles sit in bucket 6 while your important rule sits in bucket 4.",
        "**To beat an inline `!important` set by a script:** you cannot, from a stylesheet. Change the script, remove the attribute with `element.style.removeProperty()`, or accept it.",
        "**To keep your own defaults overridable:** wrap structural parts of the selector in `:where()` so authors can override with a single class."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A sharper question than \"how do I win\"",
      "x": "If you need three IDs or an important declaration to style a component, the selector is usually telling you the component has no stable hook of its own. Adding a dedicated class to the markup, or a `data-` attribute you control, is cheaper to maintain than a selector that has to out-rank something."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Read the Computed tab, not the Styles tab",
          "x": "Find the property and expand it. DevTools lists every declaration that targeted it, winner first, losers struck through, each with the source file and line. If your declaration is absent from that list, the selector did not match or the declaration was invalid. Stop and fix that."
        },
        {
          "title": "Confirm the selector matches the element you think it does",
          "x": "Run the selector in the console and check the result includes your element. `$0` in DevTools is the currently selected node, so the match test is a one-liner.",
          "code": "document.querySelectorAll('.card > .title').length\n$0.matches('.card > .title')"
        },
        {
          "title": "Check whether the value is even inherited",
          "x": "`color`, `font-*`, `line-height` and `visibility` inherit. `background`, `border`, `padding` and `display` do not. A rule on a parent that seems ignored by a child is often working exactly as specified."
        },
        {
          "title": "Identify the winner's bucket before counting columns",
          "x": "Look at the winning declaration in the Computed list. Is it inline? Does it carry `!important`? Is it inside an `@layer`? Any of those decides the outcome before specificity is consulted, so counting selector columns first wastes your time."
        },
        {
          "title": "Only now count specificity, and compare document order on a tie",
          "x": "Equal triples resolve by position in the final stylesheet. If the winner changes between dev and a production build, you have an ordering problem in the bundle rather than a specificity problem in the selector."
        },
        {
          "title": "Check for an animation or transition on the property",
          "x": "A property under an active transition ignores your rule for the duration. A property under a running animation beats normal author rules. The Animations panel in DevTools will tell you which."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Raising specificity on purpose, without !important"
    },
    {
      "t": "p",
      "x": "Sometimes you do need one more point of specificity and layers are not available to you, for instance in a stylesheet injected into a page you do not control. There are two reasonably honest techniques. Doubling a class is the oldest, and it reads clearly enough once you have seen it. Wrapping in `:is()` with a repeated argument does the same thing with a little more intent."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,2,0  the doubled class adds one to column B without changing what it matches */\n.btn.btn { background: teal; }\n\n/* 0,2,0  same effect, slightly more explicit about why */\n.btn:is(.btn) { background: teal; }\n\n/* 0,1,0  the opposite move: keep a default easy to override */\n:where(.theme-dark) .btn { background: #222; }"
    },
    {
      "t": "p",
      "x": "Both tricks scale badly. Two competing codebases each doubling their classes ends up where important rules end up, just with more typing. Treat them as a local repair, not a convention, and write down why the line exists in a comment. If you own the build, moving the other stylesheet into a lower layer is the fix that will still make sense in a year."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three common reasons. The declaration is invalid, so it was discarded before importance mattered: check for a warning icon on the line in DevTools. The property is being transitioned, and transition declarations outrank important ones while the transition runs. Or something with higher precedence is winning, such as an inline `!important` written by a script, an important rule in an earlier cascade layer, or a user stylesheet. Expand the property in the Computed tab to see exactly which declaration won and where it came from."
        },
        {
          "q": "Does an inline style always win over a stylesheet?",
          "a": "No. An inline style is a normal author declaration, so any author `!important` rule beats it. What an inline style cannot be beaten by is specificity: the cascade handles element-attached styles in a step above layers and specificity, so chaining IDs will not help. An inline declaration that itself carries `!important` cannot be overridden from an author stylesheet at all."
        },
        {
          "q": "How do I override an !important rule from a library?",
          "a": "Match it with your own `!important` and then win a tiebreaker. Among important author declarations the order is inline, then layer order with the earliest layer winning, then specificity, then document order. Putting your important rule in a layer declared before the library's layer is the most predictable option. If the library writes inline important styles from JavaScript, no stylesheet will reach it and you need to change the script or strip the attribute."
        },
        {
          "q": "Do eleven classes beat one ID in CSS?",
          "a": "No. Specificity columns are compared left to right and never carry, so 0,11,0 loses to 1,0,0 in every current browser. The idea comes from very old engines that stored each component in a small integer and could overflow. Treat the three columns as independent and compare them in order."
        },
        {
          "q": "Why does my rule show with a line through it in DevTools?",
          "a": "A struck-through declaration lost to another declaration for the same property on the same element. Hover it, or open the Computed tab, to see which one won and which file it came from. A struck-through line with a warning triangle means something different: the browser could not parse the property or value, or the property does not apply to that element."
        },
        {
          "q": "Should I use cascade layers or just increase specificity?",
          "a": "Use layers when you are deciding how whole groups of styles relate, such as reset below library below components below utilities. Declare the order once and the question stops recurring. Raise specificity only for local, documented repairs. The one thing to internalise before adopting layers is that the order reverses for `!important` declarations, where the earliest layer wins."
        },
        {
          "q": "Does @scope affect which rule wins?",
          "a": "Yes. Scope proximity is compared after cascade layers and before specificity, so a more closely scoped rule can beat a more specific one. Browser support arrived later than for cascade layers, with Chrome 118 in October 2023 and Safari 17.4 in March 2024, and Firefox after those. Verify current support before relying on it."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model fits the problem, and why one-dimensional thinking usually decides it.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "React useState not updating",
          "desc": "Stale closures, batching and the other reasons state looks one step behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-19",
  "updated": "2026-11-19",
  "author": "jackson",
  "related": [
    "/guides/css-grid-vs-flexbox/",
    "/tools/color-contrast-checker/",
    "/guides/react-usestate-not-updating/"
  ]
};
