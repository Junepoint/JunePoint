module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guide",
  "description": "Specificity, cascade layers, inline styles and !important each decide which declaration wins. Work through the order the browser actually uses.",
  "standfirst": "The browser resolves conflicting declarations in a fixed order, and specificity is only one step in it. Check the steps in sequence and the mystery usually disappears in under a minute.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css !important",
    "specificity calculation"
  ],
  "cardDesc": "Work out which declaration wins, and why, using the order the browser resolves conflicts in.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before you reason about specificity, confirm the selector matches at all: `el.matches('.card .title')` in the console answers that in one line.",
        "Specificity is three independent counters, not a score. `#id` is 1,0,0 and beats eleven classes. It is never additive across columns.",
        "Specificity is step five of the cascade. Origin and importance, inline styles, and cascade layers are all decided before it, so a less specific selector frequently wins.",
        "Unlayered styles beat every normal declaration inside `@layer`. For `!important` declarations the layer order reverses, which surprises almost everyone the first time.",
        "A declaration can also lose because it was never valid. An unknown value is dropped at parse time, and an undefined `var()` fails later, at computed-value time, without falling back to the previous rule."
      ]
    },
    {
      "t": "lede",
      "x": "There are really only two failure modes: the declaration never entered the cascade, or it entered and lost. Those need different debugging, and guessing at specificity when the problem is a typo in a class name wastes a lot of time. Work out which one you have first, then work down the cascade in the order the browser uses."
    },
    {
      "t": "h2",
      "x": "First check whether the rule matches anything"
    },
    {
      "t": "p",
      "x": "In the Elements panel, select the element and look for your selector in the Styles pane. If it is not listed, the browser never matched it, and no amount of `!important` will help. A struck-through declaration means the opposite: it matched, it was parsed, and something else beat it. That one visual distinction tells you which half of this article you need."
    },
    {
      "t": "p",
      "x": "Three console checks cover most of the non-matching cases:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does anything in the document match the selector?\ndocument.querySelectorAll('.card .title').length;\n\n// Does this particular element match it?\nconst el = document.querySelector('[data-testid=title]');\nel.matches('.card .title');\n\n// What actually applied?\ngetComputedStyle(el).fontSize;"
    },
    {
      "t": "p",
      "x": "A zero from the first line usually means the class on the element is not the class in your stylesheet. CSS Modules hash class names, so the `.title` you authored becomes something like `.title_a3f9c`. Component libraries rename props into different attributes. A descendant combinator silently fails when the DOM nests one level deeper than you assumed, and a child combinator fails when a framework inserts a wrapper element. Read the class list on the live element rather than the source."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The stylesheet itself may not be there",
      "x": "Check the Network panel for a 404 on the CSS file, a response served as `text/html`, or a Content Security Policy block. If a bundler reordered your imports, the file may load but be overridden by order of appearance rather than by anything you wrote."
    },
    {
      "t": "h2",
      "x": "What specificity actually counts"
    },
    {
      "t": "p",
      "x": "Specificity is a triple, usually written A,B,C. A counts ID selectors. B counts class selectors, attribute selectors and pseudo-classes. C counts type selectors and pseudo-elements. The columns are compared left to right and never carry over, so a single ID outranks any number of classes and a single class outranks any number of element names."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "A,B,C",
        "Note"
      ],
      "rows": [
        [
          "`*`",
          "0,0,0",
          "The universal selector adds nothing"
        ],
        [
          "`ul li`",
          "0,0,2",
          "Two type selectors"
        ],
        [
          "`li::marker`",
          "0,0,2",
          "A pseudo-element counts in the C column"
        ],
        [
          "`.nav`",
          "0,1,0",
          "Beats `ul li` outright"
        ],
        [
          "`[type=\"text\"]`",
          "0,1,0",
          "Attribute selectors sit with classes"
        ],
        [
          "`a:hover`",
          "0,1,1",
          "Pseudo-classes sit with classes"
        ],
        [
          "`.btn:not(.btn-ghost)`",
          "0,2,0",
          "`:not()` takes its argument's specificity"
        ],
        [
          "`:is(.a, #b) p`",
          "1,0,1",
          "`:is()` takes its *most specific* argument"
        ],
        [
          "`:where(.a, #b) p`",
          "0,0,1",
          "`:where()` is always zero"
        ],
        [
          "`#sidebar`",
          "1,0,0",
          "Beats every row above it"
        ]
      ],
      "caption": "Specificity of common selectors. Compare column by column, never as a single number."
    },
    {
      "t": "p",
      "x": "Two details catch people out. `:is()`, `:not()` and `:has()` all adopt the specificity of their most specific argument, which means a tidy-looking `:has(#app)` quietly drags an ID into your selector. And in native nesting, `&` behaves like `:is()` over the parent selector list, so nesting inside `.card, #app` gives every nested rule the weight of `#app`. If you want low-specificity defaults that are easy to override later, wrap the context in `:where()`."
    },
    {
      "t": "p",
      "x": "Media queries, container queries and `@supports` add nothing to specificity. Neither does the number of selectors in a comma-separated list; each one is evaluated on its own."
    },
    {
      "t": "h2",
      "x": "The order the browser resolves conflicts in"
    },
    {
      "t": "p",
      "x": "This is the part that explains most of the genuinely confusing cases. The browser compares two competing declarations by working through a sequence of criteria and stops at the first one that separates them. Specificity is late in that sequence."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Browser default styles, user styles and your styles, with `!important` reshuffling the ranking.",
        "**Context.** Shadow DOM encapsulation decides between a declaration inside a component and one outside it.",
        "**Element-attached styles.** A `style` attribute beats every selector-based author rule, whatever its specificity.",
        "**Cascade layers.** Layer order decides before specificity is even looked at.",
        "**Specificity.** The A,B,C comparison above.",
        "**Order of appearance.** The last matching declaration in document order wins the tie."
      ]
    },
    {
      "t": "p",
      "x": "Within the importance step, the full ranking from weakest to strongest is: browser normal, user normal, author normal, running CSS animations, author `!important`, user `!important`, browser `!important`, running transitions. Two consequences are worth remembering. An element with a running `@keyframes` animation ignores your normal declarations, because animations outrank them, and only an `!important` will take the property back. A property mid-transition outranks everything, including `!important`, which is why a value can look correct in the Styles pane and still render differently for a few hundred milliseconds."
    },
    {
      "t": "p",
      "x": "Scope proximity, used by `@scope`, is a further criterion the cascade specification places between layers and specificity. Support has been landing unevenly across engines, so check current browser support before relying on it rather than trusting any version number you read, including one in an article dated October 2026."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer"
    },
    {
      "t": "p",
      "x": "`@layer` has been available in Chrome, Firefox and Safari since early 2022, and design systems now use it heavily. It lets a one-class utility beat a two-class component rule, which looks like specificity being ignored. It is not being ignored, it is being skipped, because layer order was decided one step earlier."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, base, components, utilities;\n\n@layer components {\n  .card .title { font-size: 1.25rem; }  /* 0,2,0 */\n}\n\n@layer utilities {\n  .text-sm { font-size: 0.875rem; }     /* 0,1,0, and it wins */\n}\n\n/* Not in any layer, so it beats every normal\n   declaration in every layer above. */\n.title { font-size: 1rem; }"
    },
    {
      "t": "p",
      "x": "Two rules govern the behaviour. Later layers beat earlier layers, and unlayered styles beat all layered normal declarations. That second rule is the one people forget. Dropping a quick fix into a stylesheet that happens to be outside any layer will override a carefully ordered design system, which is convenient once and a maintenance problem thereafter."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "!important reverses layer order",
      "x": "For important declarations the entire layer ordering flips: the earliest layer wins, and layered important declarations beat unlayered ones. So `!important` inside `@layer reset` outranks `!important` inside `@layer utilities`. If you are debugging a system that uses both layers and `!important`, that reversal is the first thing to check."
    },
    {
      "t": "h2",
      "x": "!important, and what it costs"
    },
    {
      "t": "p",
      "x": "`!important` works. The cost is that it moves the declaration into a separate ranking where only other important declarations can argue with it, and the normal tools for reasoning about overrides stop applying. To beat an author `!important` you need another author `!important` that wins on layer order, then specificity, then document order, or an inline `style` attribute carrying its own `!important`."
    },
    {
      "t": "p",
      "x": "There are defensible uses. Utility classes whose entire purpose is to win, accessibility overrides such as forced reduced motion, and print stylesheets all have a reasonable claim. Reaching for it because a third-party widget ships `#widget .btn { color: red }` is understandable but worth recording as debt, because the widget's next release can break your fix without touching your code."
    },
    {
      "t": "p",
      "x": "When you are undoing rather than overriding, the revert keywords are cleaner than a higher-specificity fight:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Roll a property back to the value it would have had\n   if this layer had never contributed anything. */\n.card .title { font-size: revert-layer; }\n\n/* Roll everything back to the browser default,\n   useful as a temporary debugging probe. */\n.debug-me { all: revert; }\n\n/* `unset` is different again: inherit for inherited\n   properties, initial for the rest. */\n.plain { color: unset; }"
    },
    {
      "t": "h2",
      "x": "Raising specificity without !important"
    },
    {
      "t": "p",
      "x": "If you need one rule to win and you do not want an important flag, repeat a compound selector. Duplicating a class is valid CSS and adds to the B column with no change to what matches."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,2,0 and matches exactly the same elements as .btn */\n.btn.btn { padding: 0.5rem 1rem; }\n\n/* Same weight, but it reads as deliberate rather than\n   like a typo someone will clean up later. */\n:is(.btn):is(.btn) { padding: 0.5rem 1rem; }\n\n/* The opposite move: zero-specificity defaults that any\n   single class can override. */\n:where(.prose) p { margin-block: 1em; }"
    },
    {
      "t": "p",
      "x": "Leave a comment saying what you are overriding. A bare `.btn.btn` with no explanation gets refactored into `.btn` by the next person, and the bug returns with no obvious cause."
    },
    {
      "t": "h2",
      "x": "When specificity is not the problem at all"
    },
    {
      "t": "p",
      "x": "A declaration can be the undisputed cascade winner and still have no visible effect. These cases are common enough to check before you start counting selectors:"
    },
    {
      "t": "ul",
      "items": [
        "**The value is invalid.** CSS drops a declaration with an unparseable value at parse time, so `color: #gggggg` simply does not exist. DevTools flags it with a warning marker, and the previous rule wins by default.",
        "**An undefined custom property.** `color: var(--brand)` with no `--brand` defined is invalid at computed-value time, which behaves differently from a parse error: the property becomes inherited or initial instead of falling back to an earlier declaration. Give `var()` a fallback when the property might be missing.",
        "**A shorthand reset a longhand.** `background: #fff` after `background-color: red` wipes every background longhand, including ones set elsewhere. Order of appearance decides, and the shorthand is usually the aggressor.",
        "**The property does not apply to that box.** `width` and vertical padding do nothing useful on a non-replaced inline element. `z-index` is ignored unless the element is positioned or is a flex or grid item. `height: 100%` needs an ancestor with a resolved height.",
        "**The pseudo-element has no content.** `::before` and `::after` generate nothing without a `content` declaration, even an empty string.",
        "**Nothing is inheriting.** Most layout properties are not inherited. Setting `border` on a container does not give its children borders.",
        "**A duplicate later in the bundle.** Two identical selectors in a concatenated stylesheet are resolved by document order, which depends on your build config rather than on anything visible in the source file you are editing."
      ]
    },
    {
      "t": "h2",
      "x": "Read it in DevTools instead of guessing"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element",
          "x": "Select the element in the Elements panel and read its live class list and attributes. Framework output often differs from the JSX or template you wrote.",
          "code": "$0.className"
        },
        {
          "title": "Scan the Styles pane top to bottom",
          "x": "Rules are listed with the most authoritative first. A struck-through property lost; hovering it in Chrome tells you what beat it. An absent selector never matched."
        },
        {
          "title": "Use the Computed tab for the verdict",
          "x": "Expand the property and you get every declaration that tried to set it, winner first, each linked to its source line. This is the fastest way to find an override hiding in a vendor stylesheet."
        },
        {
          "title": "Check for animation and transition interference",
          "x": "If the computed value changes while you watch, a transition or animation owns the property, and the cascade ranking above explains why your rule cannot touch it.",
          "code": "getComputedStyle(el).transitionProperty"
        },
        {
          "title": "Probe with a throwaway override",
          "x": "Add the declaration directly in the Styles pane as an inline style. If it takes effect there but not from your stylesheet, the problem is cascade position. If it does nothing even inline, the problem is the property or the box, not the cascade."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One habit that prevents most of this",
      "x": "Keep author specificity low and flat, put third-party and reset CSS into named layers, and reserve `!important` for utilities. When everything sits in the 0,1,0 to 0,2,0 range, order of appearance does the work and overrides stay predictable."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the layout module that describes what you are building.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a pair of colors against WCAG AA and AAA before you ship the override.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState not updating",
          "desc": "The same debugging shape in a different layer: find out what actually won.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three likely reasons. Another `!important` is beating yours on layer order, specificity or document order, and remember that layer order reverses for important declarations. Or a running transition is holding the property, since transitions outrank even important declarations. Or the declaration is invalid and was dropped, in which case the Styles pane shows a warning marker rather than a struck-through line."
        },
        {
          "q": "Does a class ever beat an ID in CSS?",
          "a": "Yes, when the comparison never reaches specificity. An ID selector in a cascade layer loses to a class selector outside any layer, because layer order is resolved first. An ID selector also loses to an inline `style` attribute, and to an `!important` declaration from any author rule."
        },
        {
          "q": "How is CSS specificity calculated?",
          "a": "Count three separate numbers: ID selectors, then classes plus attribute selectors plus pseudo-classes, then type selectors plus pseudo-elements. Compare them left to right and stop at the first difference. The columns do not add together, so ten classes (0,10,0) still lose to one ID (1,0,0)."
        },
        {
          "q": "What is the difference between :is() and :where() for specificity?",
          "a": "`:where()` always contributes zero specificity. `:is()` contributes the specificity of its most specific argument, so `:is(.a, #b)` counts as 1,0,0. Use `:where()` for defaults you want to be easy to override, and `:is()` when you genuinely want the weight."
        },
        {
          "q": "Why do unlayered styles override my @layer styles?",
          "a": "That is the specified behaviour. Normal declarations outside any cascade layer rank above normal declarations in every layer, no matter how specific the layered selector is. If you want a stylesheet to participate in the ordering you designed, put it in a layer rather than leaving it unlayered."
        },
        {
          "q": "How do I find out which CSS rule is overriding mine?",
          "a": "Open the Computed tab in DevTools, expand the property, and read the list of declarations that tried to set it. The winner is listed first and each entry links to its source line. The Styles pane shows the same information less directly, with losing declarations struck through."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-26",
  "updated": "2026-10-26",
  "author": "jackson",
  "related": []
};
