module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Isn't Applying: Specificity & Layers",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Work out why a CSS declaration loses: check that the selector matches, that the value parsed, then the cascade order that actually picks the winner.",
  "standfirst": "Most \"my CSS is being ignored\" bugs are not specificity problems. Here is the order to check things in, and what the cascade does once you get as far as comparing selectors.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "!important css",
    "css override not working"
  ],
  "cardDesc": "A diagnostic order for CSS that refuses to apply: selector match, parse errors, then cascade, layers and !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check in this order: does the selector match, did the declaration parse, does the property apply to that element, and only then who wins the cascade.",
        "Specificity is three independent counts (IDs, classes, elements) compared left to right. Eleven classes still lose to one ID.",
        "Cascade layers outrank specificity. A bare class in a later `@layer` beats `#app .card` in an earlier one.",
        "`!important` reverses layer order: the *earliest* layer wins, and unlayered important declarations lose to every layered one.",
        "If DevTools strikes a declaration through, something outranked it. If DevTools shows a warning icon beside it, the browser discarded the value and specificity never entered into it."
      ]
    },
    {
      "t": "h2",
      "x": "Start with the three cheap checks"
    },
    {
      "t": "p",
      "x": "Specificity gets blamed for a lot of failures it had nothing to do with. Before you start counting selectors, confirm that the browser ever considered your rule. Select the element in DevTools and look for your selector in the Styles pane. If it is not listed at all, the rule does not match, and no amount of `!important` will change that."
    },
    {
      "t": "p",
      "x": "The usual culprit is a combinator you did not mean to write. A space is the descendant combinator, so `.card .title` and `.card.title` are completely different selectors and only one of them is likely what you wanted."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* A .title anywhere inside .card */\n.card .title { font-weight: 700; }\n\n/* An element carrying BOTH classes */\n.card.title { font-weight: 700; }\n\n/* A .title that is a direct child of .card */\n.card > .title { font-weight: 700; }"
    },
    {
      "t": "p",
      "x": "Next, check that the declaration survived parsing. CSS discards anything it cannot understand at the level of the individual declaration, silently, by design. The rest of the block still applies, which is why a single typo looks like one mysteriously dead property rather than a broken stylesheet."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".btn {\n  colour: red;              /* unknown property: dropped at parse time */\n  color: #gggggg;           /* invalid value: dropped at parse time */\n  padding: 10;              /* no unit on a non-zero length: dropped */\n  width: calc(100% -16px);  /* missing space around the minus: dropped */\n  background: var(--brand); /* parses fine, may still fail later */\n}"
    },
    {
      "t": "p",
      "x": "That last line behaves differently from the others and the difference bites people. A declaration containing `var()` always parses, because the custom property is only substituted later. If `--brand` turns out to be undefined or holds something nonsensical, the declaration becomes invalid at computed-value time. The property does not fall back to an earlier declaration in the same block. It takes its inherited value if the property is inherited, or its initial value if not. So a broken variable can leave you with transparent text rather than with the color you set two lines above."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Give variables a fallback",
      "x": "`background: var(--brand, #4f46e5)` uses the fallback when `--brand` is not set, which keeps the declaration valid and keeps the failure visible rather than invisible."
    },
    {
      "t": "p",
      "x": "The third check is whether the property applies to that element at all. Width and height are ignored on non-replaced inline elements, as are vertical margins. `gap` does nothing on a plain block container, since it needs flex, grid or multi-column. `z-index`, `top` and `left` are ignored while the element is `position: static`. In every one of these cases DevTools will show your declaration applied and un-struck, and nothing will move. The rule won. The property just has no effect here."
    },
    {
      "t": "h2",
      "x": "How the cascade actually picks a winner"
    },
    {
      "t": "p",
      "x": "When two declarations both match the same element and set the same property, the browser sorts them through a fixed sequence of tests and stops at the first one that separates them. Specificity sits surprisingly far down that list."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author `!important` beats author normal. Browser and user `!important` beat author `!important`, which is what lets a reader force a larger font on your site. Transition declarations outrank everything, and keyframe animations outrank normal author rules while losing to author `!important`.",
        "**Element-attached styles.** A normal `style` attribute beats normal declarations from any stylesheet, at any specificity. An important `style` attribute beats `!important` from your stylesheets too.",
        "**Cascade layers.** For normal declarations, a later layer beats an earlier one, and unlayered CSS beats everything in a layer.",
        "**Specificity.** Only at this point does anyone count selectors.",
        "**Order of appearance.** If the declarations are still tied, the one that appears last wins."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences are worth holding on to. First, if a layer or an inline style is involved, counting selectors tells you nothing useful. Second, ties are broken by document order, which makes the load order of your stylesheets part of the design whether you planned for it or not. Bundlers reorder CSS more often than people expect, and a CSS-in-JS runtime decides injection order at runtime. A rule that wins locally and loses in production is usually a step 5 problem, not a step 4 one."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple, conventionally written `(A, B, C)`. `A` counts ID selectors. `B` counts classes, attribute selectors and pseudo-classes. `C` counts type selectors and pseudo-elements. Combinators contribute nothing, and the universal selector `*` contributes nothing."
    },
    {
      "t": "p",
      "x": "The three numbers are compared left to right, and the first difference decides it. They are not digits in a base-10 number. A selector with eleven classes is `(0, 11, 0)` and loses to `#header`, which is `(1, 0, 0)`, because the ID column is compared first and nothing in the class column can make up the gap."
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
          "`*`",
          "0, 0, 0",
          "The universal selector adds nothing"
        ],
        [
          "`li`",
          "0, 0, 1",
          "Type selector"
        ],
        [
          "`ul > li::marker`",
          "0, 0, 3",
          "Two types plus a pseudo-element; the combinator is free"
        ],
        [
          "`.card`",
          "0, 1, 0",
          "Same weight as `[data-open]` and `:hover`"
        ],
        [
          "`#main`",
          "1, 0, 0",
          "Beats any number of classes"
        ],
        [
          "`:is(#main, .card)`",
          "1, 0, 0",
          "Takes the specificity of its most specific argument"
        ],
        [
          "`:where(#main, .card)`",
          "0, 0, 0",
          "Always zero, whatever is inside it"
        ],
        [
          "`:not(.card)`",
          "0, 1, 0",
          "Like `:is()`, the most specific argument counts"
        ],
        [
          "`:has(> img)`",
          "0, 0, 1",
          "The argument's specificity counts, the relation is free"
        ],
        [
          "`html body #app .btn:hover`",
          "1, 2, 2",
          "Long is not the same as specific"
        ]
      ],
      "caption": "Compared left to right. Inline styles are sometimes written as a fourth leading digit, but the spec handles them as a separate, earlier step in the cascade."
    },
    {
      "t": "p",
      "x": "Native nesting has its own rule that catches people out. The `&` selector carries the specificity of `:is()` applied to the whole parent selector list, so nesting inside a list like `.card, #promo` gives every nested rule a specificity of `(1, 0, 0)`, inherited from the most specific branch. If you nest three levels deep inside a component with an ID anywhere in the chain, you will have written a selector you would never have typed out by hand."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#sidebar a             { color: teal; }   /* 1,0,1 */\n.nav .nav__link:hover  { color: coral; }  /* 0,3,0 */\n\n/* teal wins: the ID column is 1 against 0, so the rest is never read */"
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the feature that makes most specificity fights unnecessary, and it is supported across current versions of Chrome, Safari, Firefox and Edge. Declare your layer order once, near the top of your entry stylesheet, because a layer's position is fixed by the first time its name appears."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Order is established here, once. Later layers win. */\n@layer reset, vendor, base, components, utilities;\n\n@import url(\"bootstrap.css\") layer(vendor);\n\n@layer components {\n  #app .card { padding: 1.5rem; }   /* 1,1,0 */\n}\n\n@layer utilities {\n  .p-0 { padding: 0; }              /* 0,1,0 and it still wins */\n}"
    },
    {
      "t": "p",
      "x": "Padding ends up at zero. The `utilities` layer comes later in the order, so the comparison stops there and the specificity difference is never examined. This is the whole point: layers let you decide precedence by intent rather than by selector arithmetic. Importing a third-party stylesheet into an early layer is particularly effective, because any unlayered CSS you write beats all of it with a single class."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "For important declarations the layer comparison runs the other way: the **earliest** layer wins. Unlayered CSS counts as the final layer, so an unlayered `!important` loses to an important declaration in any explicit layer. An `a { color: blue !important }` in your `reset` layer will beat `color: red !important` in `utilities` and beat an unlayered important rule as well. This surprises almost everyone the first time."
    },
    {
      "t": "h2",
      "x": "What !important is actually for"
    },
    {
      "t": "p",
      "x": "`!important` moves a declaration into a separate, higher band of the cascade. Inside that band, the ordinary comparisons resume: layers (reversed), then specificity, then document order. That is why adding `!important` to a rule that is already losing to another `!important` rule changes nothing, and why the advice to \"just add important\" so often produces a second round of the same bug."
    },
    {
      "t": "p",
      "x": "It is a legitimate tool in a few narrow places. Overriding third-party CSS you cannot edit is one. A debugging probe is another: dropping `outline: 2px solid red !important` into DevTools tells you fast whether you are even looking at the right element. Utility classes in a framework are a third, and the reason Tailwind offers an important mode at all. Outside of those, reaching for it inside your own stylesheet means you have given up on knowing where your styles come from, and the next person will have to escalate past you."
    },
    {
      "t": "p",
      "x": "There is one thing it genuinely cannot beat. A CSS transition in progress outranks every author declaration, important or not, which is why a value sometimes refuses to stick for a few hundred milliseconds and then does. If a style seems to arrive late or snap back, look for a `transition` or an `animation` on the element before you touch specificity."
    },
    {
      "t": "h2",
      "x": "Getting the answer out of DevTools"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Look for the selector in the Styles pane",
          "x": "Chrome and Firefox list every matching rule, most specific first, with the winning declarations in plain text. Absent means not matching. Present but struck through means something outranked it. A warning icon beside the declaration means the browser threw the value away, so fix the value and stop thinking about the cascade."
        },
        {
          "title": "Switch to Computed for the verdict",
          "x": "The Computed pane shows the value that actually won, and expanding a property reveals the rule that produced it with a link to the source file and line. This is the fastest way to find out that a style you have been fighting comes from a vendor bundle you forgot was loaded, or is simply inherited from an ancestor."
        },
        {
          "title": "Ask the page, not your memory, what matched",
          "x": "In the console, `getComputedStyle` gives you the resolved value, and the element's own `matches()` tells you whether your selector really hits it. Useful when you suspect a build step mangled a class name.",
          "code": "const el = document.querySelector('.card');\ngetComputedStyle(el).padding;        // the value that won\nel.matches('#app .card');            // does your selector match at all?\nel.className;                        // hashed by CSS Modules? purged?"
        },
        {
          "title": "Confirm the stylesheet is the one you edited",
          "x": "A 404 on a CSS file, a service worker serving a stale bundle, or a dev server that failed to recompile all look exactly like a specificity problem. Check the Network panel for the file, then search the served CSS for your selector before assuming the cascade is at fault."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Failures that are not about specificity"
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand later in the file.** `background: white` resets `background-image`, and `font: 16px/1.5 sans-serif` resets `font-weight`. The shorthand sets every longhand it covers, including the ones you did not mention, back to their initial values.",
        "**An inline style.** Framework components, animation libraries and drag handlers write to the `style` attribute. Normal declarations there beat your stylesheet whatever the specificity, so the fix is to stop the script writing it, not to add another class.",
        "**Shadow DOM.** Styles do not cross the boundary. A web component's internals are reachable only through `::part()`, `::slotted()`, inherited properties and custom properties that the component chose to expose.",
        "**A media or container query that does not match.** DevTools shows the rule but greys it out. Check the condition, including whether `prefers-color-scheme` or a container query is evaluating the way you assume.",
        "**A custom property set too far down.** If `color: var(--fg)` resolves wrong, the losing declaration may be the `--fg` assignment rather than the `color` line. Custom properties cascade and inherit on their own, so inspect `--fg` on the element itself.",
        "**Dead code elimination.** Tailwind and similar tools only emit classes they can see in your source. A class name assembled at runtime, like `` `text-${color}-500` ``, never reaches the output CSS.",
        "**A browser that does not support the property.** DevTools flags it, and `@supports` is the honest way to handle it. Check current support for anything recent rather than trusting a blog post; this applies to `@scope` in particular, which is newer than `@layer` and less evenly supported as of October 2026."
      ]
    },
    {
      "t": "h2",
      "x": "Better levers than escalating"
    },
    {
      "t": "p",
      "x": "Once you understand the sort order, you have several ways to win an override without an arms race. Pick the one that encodes your intent."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1. Zero out specificity so consumers override with one class */\n:where(.btn) a { color: inherit; }        /* 0,0,1 */\n\n/* 2. Raise specificity deliberately and visibly */\n.btn.btn { padding-inline: 1rem; }       /* 0,2,0, no ID needed */\n\n/* 3. Let the layer decide, and leave the selectors simple */\n@layer theme {\n  .btn { background: var(--accent); }\n}"
    },
    {
      "t": "p",
      "x": "`:where()` is the right default for anything shared. A reset or a component library built on zero-specificity selectors is one that nobody has to fight. Repeating a class, as in `.btn.btn`, is a blunter instrument, but it is honest about what it is doing and it does not drag an ID into your markup. And if you are starting a new codebase, declaring four or five layers on day one costs nothing and removes most of this category of bug. For layout questions that look like cascade questions, our [CSS Grid and Flexbox guide](/guides/css-grid-vs-flexbox/) covers the sizing rules that often turn out to be the real cause."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Work through four questions in order. Does the rule appear in the DevTools Styles pane for that element, which tells you whether it matches at all? Is the declaration struck through, meaning something outranked it, or flagged with a warning, meaning the value was discarded at parse time? Does the property apply to that element, since width and vertical margins do nothing on inline elements? And is the stylesheet you are editing the one the browser loaded? Specificity is only one of the four, and usually not the one."
        },
        {
          "q": "Do eleven classes beat one ID in CSS?",
          "a": "No. Specificity is three numbers compared left to right, not a single total. Eleven classes give `(0, 11, 0)` and an ID gives `(1, 0, 0)`, so the ID column decides it immediately and the class count is never read. This is why adding more classes to a selector sometimes has no effect whatsoever on an override."
        },
        {
          "q": "Is !important always bad practice?",
          "a": "It is a reasonable tool in three places: overriding third-party CSS you cannot edit, probing something temporarily in DevTools, and inside framework utility classes that are meant to be final. Inside your own stylesheets it tends to be a symptom. It does not raise specificity, it moves the declaration into a separate higher band where the same comparisons start over, so the next person has to escalate again to get past you."
        },
        {
          "q": "How do I override a library's !important declaration?",
          "a": "You need an important declaration that outranks theirs. If both are unlayered, match or exceed their specificity and make sure your rule loads after theirs. If layers are in play, remember the order is reversed for important declarations: put yours in an earlier layer than the library's. An important declaration in a `style` attribute outranks all of it, which is the last resort when you cannot control load order at all."
        },
        {
          "q": "Why does my inline style lose to a stylesheet rule?",
          "a": "Because the stylesheet rule is marked `!important`. A normal inline style beats normal stylesheet declarations at any specificity, but importance is compared before element-attached styles are considered, so author `!important` wins. An important inline declaration takes the top spot back."
        },
        {
          "q": "Does cascade layer order really beat specificity?",
          "a": "Yes, and that is the main reason to use layers. Layers are compared before specificity, so `.p-0` in a later layer beats `#app .card` in an earlier one. For normal declarations later layers win and unlayered CSS beats every layer. For important declarations earlier layers win and unlayered CSS loses to every layer."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "When a style seems ignored but the real issue is which layout model is sizing the box.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA before you ship the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of bug one layer up: the code ran, the value just was not the one you expected.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-09",
  "updated": "2026-10-09",
  "author": "jackson",
  "related": [
    "/guides/css-grid-vs-flexbox/",
    "/tools/color-contrast-checker/"
  ]
};
