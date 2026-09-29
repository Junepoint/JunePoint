module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important: why your rule loses",
  "eyebrow": "Guides",
  "description": "Work out why a CSS declaration is being overridden: selector specificity, the cascade sorting order, @layer, and the cases where !important is the right answer.",
  "standfirst": "Specificity is the last tiebreaker, not the first rule. Check the four things that outrank it before you start adding class names to a selector.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "important css",
    "css cascade order"
  ],
  "cardDesc": "Diagnose an overridden CSS declaration: specificity, layers, !important, and the causes that are none of those.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers compared left to right: IDs, then classes and attributes and pseudo-classes, then element types. There is no carry. One ID beats twenty classes.",
        "Specificity only breaks ties *inside* one origin, one importance level and one cascade layer. If those differ, specificity is never consulted.",
        "Unlayered author styles beat every `@layer` for normal declarations. For `!important` declarations the layer order reverses, so the first layer wins.",
        "A struck-through declaration in DevTools lost the cascade. A declaration that is absent entirely was either never matched or dropped as invalid at parse time. Different bugs, different fixes.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument."
      ]
    },
    {
      "t": "h2",
      "x": "First check that the rule matched at all"
    },
    {
      "t": "p",
      "x": "Most specificity problems are not specificity problems. Select the element in DevTools and look at the Styles pane. If your rule is not listed there, the selector never matched, and no amount of extra class names in front of it will change that. If the rule is listed but the declaration has a line through it, something outranked it, and the rest of this page is about why."
    },
    {
      "t": "p",
      "x": "There is a third case that trips people up more often than either. The declaration is simply not there, while the ones around it are. That means the value failed to parse and the browser discarded the whole declaration before the cascade ran. `margin: 10 px` is invalid because of the space. So is `color: #ff` and `width: calc(100% -20px)`, where the missing space around the minus sign makes it a malformed expression rather than a subtraction."
    },
    {
      "t": "ul",
      "items": [
        "**The property does not apply to that box.** `width`, `height` and vertical `margin` do nothing on a non-replaced inline element. Set `display: inline-block` and look again.",
        "**The property is not inherited.** `color`, `font-family` and `visibility` flow down to descendants. `border`, `background` and `padding` do not.",
        "**A later shorthand reset it.** `background: white` after `background-image: url(hero.jpg)` wipes the image, because the shorthand sets every longhand it covers back to its initial value.",
        "**The class attribute is not what you think.** CSS Modules, styled-components and Tailwind's JIT all rewrite class names at build time. Read the class attribute off the live element rather than the source file.",
        "**Two stylesheets, and the bundler changed the order.** With equal specificity, the last one parsed wins. Import order in your entry file decides that."
      ]
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector gets three numbers, usually written as `0,0,0`. The first counts ID selectors. The second counts class selectors, attribute selectors and pseudo-classes. The third counts element type selectors and pseudo-elements. Compare them left to right, and stop at the first difference."
    },
    {
      "t": "p",
      "x": "The part people get wrong is that the columns do not add up or carry. Eleven classes score `0,11,0`, and a single ID scores `1,0,0`, and the ID wins. It is not base ten arithmetic. It is a tuple comparison, and the leftmost column that differs settles the whole thing."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,1,0 */\n.card { color: blue; }\n\n/* 0,2,1  two classes plus one element type */\n.page .card p { color: green; }\n\n/* 1,0,0  beats both of the above */\n#main { color: red; }\n\n/* 0,1,0  :where() is always free, so .sidebar costs nothing */\n:where(.sidebar) .card { color: orange; }\n\n/* 1,1,0  :is() takes its MOST specific argument, here #main */\n:is(.sidebar, #main) .card { color: purple; }\n\n/* 0,2,0  :not() also takes its most specific argument */\n.card:not(.featured) { color: black; }"
    },
    {
      "t": "p",
      "x": "Combinators are free. The descendant space, `>`, `+` and `~` contribute nothing, and neither does the universal selector `*`. So `* > * .card` and `.card` have identical specificity. `:has()` follows the same rule as `:is()` and `:not()`, taking the specificity of its most specific argument, which is worth knowing before you write `.row:has(#total)` and wonder why it beats everything else you wrote that day."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Use :where() for defaults you expect to be overridden",
      "x": "If you are writing a component library or a reset, wrapping selectors in `:where()` gives them zero specificity. Consumers can then override with a plain class selector instead of escalating. `:where(.btn) { padding: 8px 16px; }` is trivially overridable by `.btn { padding: 0; }`, which is usually what you want from a default."
    },
    {
      "t": "h2",
      "x": "Specificity only breaks ties"
    },
    {
      "t": "p",
      "x": "Before the browser compares any numbers, it sorts declarations by origin, importance and layer. Specificity is consulted only among the survivors of that sort. This is the step that explains most confusing overrides, because a weak selector in a stronger position beats a strong selector in a weaker one, every time."
    },
    {
      "t": "table",
      "head": [
        "Precedence",
        "What sits here",
        "Where it comes from"
      ],
      "rows": [
        [
          "1. Transitions",
          "The value of a property mid-transition",
          "A running `transition`"
        ],
        [
          "2. Important user agent",
          "Browser defaults marked important",
          "Very rare; some form control behaviour"
        ],
        [
          "3. Important user",
          "The reader's own stylesheet",
          "Browser extensions, accessibility settings"
        ],
        [
          "4. Important author",
          "`!important` in your CSS",
          "Layer order **reverses** here; an inline `!important` sits at the top"
        ],
        [
          "5. Animations",
          "Values from `@keyframes` while running",
          "A running `animation`"
        ],
        [
          "6. Normal author",
          "Ordinary rules you wrote",
          "Inline `style`, then unlayered rules, then the last layer backwards"
        ],
        [
          "7. Normal user",
          "The reader's ordinary preferences",
          "User stylesheets"
        ],
        [
          "8. Normal user agent",
          "Browser defaults",
          "`ul { list-style: disc }` and friends"
        ]
      ],
      "caption": "Cascade sorting order, strongest first. Specificity is only compared between declarations that land in the same row, the same origin and the same layer."
    },
    {
      "t": "p",
      "x": "Two practical consequences fall out of that table. An `!important` declaration on a bare element selector beats a normal declaration on `#app .widget .title`, because rows four and six are never compared on specificity. And a CSS animation overrides your normal rules while it runs, which is why an element can snap back to a colour that appears nowhere in the winning rule set until you look at the `@keyframes`."
    },
    {
      "t": "h2",
      "x": "Cascade layers move the goalposts"
    },
    {
      "t": "p",
      "x": "`@layer` lets you set precedence explicitly instead of arms-racing selector length. Declare the order once, at the top, and every layer beats the ones named before it regardless of specificity inside them."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Order is fixed by this one line. Later names win. */\n@layer reset, vendor, base, components, utilities;\n\n/* Pull a third-party stylesheet into a weak layer.\n   The layer() function must be on the @import itself. */\n@import url(\"vendor-widget.css\") layer(vendor);\n\n@layer components {\n  #app .card .title { color: rebeccapurple; }  /* 1,2,0 */\n}\n\n@layer utilities {\n  .text-black { color: black; }                /* 0,1,0, and it wins */\n}"
    },
    {
      "t": "p",
      "x": "That is the payoff. A single utility class in a later layer beats an ID selector in an earlier one, so utility classes stop needing `!important` to do their job. Anything you leave outside a layer beats every layer, which makes unlayered CSS a quiet escape hatch and, in a large codebase, a slow leak. Pick a layer for everything, including your application styles."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "For important declarations the layer sort runs backwards, so the *first* layer wins. In `@layer base, overrides` with `p { color: red !important }` in `base` and `p { color: blue !important }` in `overrides`, the text is red. Important declarations outside any layer lose to important declarations inside one. This is deliberate, so that a reset layer can hold a genuinely non-negotiable rule, but it surprises nearly everyone the first time."
    },
    {
      "t": "p",
      "x": "Cascade layers shipped in the current versions of Chrome, Edge, Firefox and Safari some years ago and are safe for general use as of September 2026. Check caniuse.com against your own support floor before relying on it, particularly if you still serve older WebView or Samsung Internet builds. The failure mode is not graceful: a browser that does not understand `@layer` ignores the whole block, so those rules vanish rather than degrading."
    },
    {
      "t": "h2",
      "x": "When !important is the right answer"
    },
    {
      "t": "p",
      "x": "It has a bad reputation and mostly deserves it, but there are cases where it is correct rather than lazy. Overriding a third-party widget that writes inline styles from JavaScript is the clearest one, because an author `!important` rule is the only thing in a stylesheet that beats a normal inline `style` attribute. Print stylesheets and forced-colors adjustments are another. Anything that must hold regardless of what the rest of the codebase does later is a legitimate candidate."
    },
    {
      "t": "p",
      "x": "The cost is that you have removed the property from the cascade. The next person who needs to override it has two options: another `!important` with a more specific selector, or an inline `style` attribute carrying `!important` of its own. Both are worse than what you started with. A team that uses `!important` freely ends up with declarations nobody can override without understanding the entire history of the file."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Beating a widget that sets element.style from JS */\n.third-party-modal { z-index: 9000 !important; }\n\n/* Better, if the widget's CSS is under your control:\n   put it in an early layer and skip !important entirely */\n@layer vendor, app;\n\n/* Escape hatch when you need to discard everything a layer set */\n.reset-island { all: revert-layer; }"
    },
    {
      "t": "p",
      "x": "`revert-layer` rolls a property back to whatever the previous layer computed, and `revert` rolls it back to the user-agent or user value. Both are cleaner than escalating, because they undo rather than outbid. Support is broad in current browsers, though `revert-layer` arrived later than `revert`, so verify it if you support older versions."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the rule appears in the Styles pane",
          "x": "Select the element, not its parent. If the rule is missing, the selector does not match: check for a typo, a rewritten class name, or a structural assumption that no longer holds."
        },
        {
          "title": "Look at what is struck through, and read the rule above it",
          "x": "Chrome and Firefox list the winning declaration first. The rule that beat yours is usually two lines up and obvious once you look at it rather than at your own CSS."
        },
        {
          "title": "Check the Computed tab for the real source",
          "x": "Expand the property and follow the arrow to the winning rule. This is the fastest way to find a declaration coming from a stylesheet you forgot was loaded."
        },
        {
          "title": "Compare position before specificity",
          "x": "Different layer, different importance, different origin? Then specificity never entered into it, and adding class names to your selector will do nothing at all."
        },
        {
          "title": "Only then count the three numbers",
          "x": "If both rules sit in the same layer at the same importance, compare IDs, then classes, then element types. Equal all the way down means the later rule in source order wins.",
          "code": "/* Raise specificity without an ID and without !important.\n   Repeating a class is legal and costs 0,1,0 each time. */\n.btn.btn { color: white; }   /* 0,2,0 */"
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
          "eyebrow": "Guides"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same shape of bug one layer up: the value is there, something else won.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guides"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check whether the rule appears in the DevTools Styles pane for that element. If it is absent, the selector is not matching and specificity is irrelevant. If it is present but struck through, something outranked it. If a single declaration is missing while its neighbours show, its value was invalid and the browser discarded it at parse time."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "An `!important` declaration in a stylesheet beats a normal declaration in a `style` attribute, yes. It does not beat `!important` inside the `style` attribute itself, which sits at the top of the author important level. That inline important is in turn outranked only by important user and user-agent declarations and by a running transition."
        },
        {
          "q": "How do I override an ID selector without using !important?",
          "a": "Three options. Put your rule in a later cascade layer, which wins no matter what the earlier selector scores. Repeat a class in the selector, since `.btn.btn.btn` is legal and scores `0,3,0`. Or wrap an ID you know exists in `:is()`, as in `:is(#app) .btn`, to borrow its specificity deliberately."
        },
        {
          "q": "What does 0,1,0 mean in CSS specificity?",
          "a": "It is the three-column score for a selector: no ID selectors, one class or attribute selector or pseudo-class, no element type selectors. `.card` scores `0,1,0`. Compare two scores left to right and stop at the first column that differs. The columns never carry, so `1,0,0` beats `0,99,0`."
        },
        {
          "q": "Do cascade layers replace BEM and utility classes?",
          "a": "No, they remove the reason those conventions had to encode precedence in names. BEM stays useful for making ownership obvious. Utility classes still need to win over component styles, and a `utilities` layer declared last does that without `!important`. Layers handle ordering; naming conventions handle everything else."
        },
        {
          "q": "Why does my Tailwind or utility class lose to a component style?",
          "a": "Because the component selector is more specific and both live at the same level, or because the component CSS is imported after the utilities in the bundle. Declaring `@layer base, components, utilities` and putting each bucket in its own layer fixes it permanently, which is the approach Tailwind itself takes."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-29",
  "updated": "2026-09-29",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
