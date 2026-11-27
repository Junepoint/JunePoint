module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Specificity is three numbers, not a score. Cascade layers beat it, inline styles sidestep it, and !important flips the layer order.",
  "standfirst": "The cascade decides in a fixed sequence, and most lost arguments about specificity were settled two steps earlier. This walks the sequence in order, with the selector arithmetic that goes with it.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "important override",
    "specificity calculation",
    "css cascade order"
  ],
  "cardDesc": "Specificity, cascade layers, inline styles and !important, in the order the browser actually applies them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Three failures look identical from the outside: a selector that never matched, a declaration the parser threw away, and a declaration that lost the cascade. Check them in that order.",
        "Specificity is three numbers compared left to right, not a total. One ID selector beats twenty class selectors. Always.",
        "Cascade layers are compared *before* specificity, so an unlayered `.title` beats a layered `#page .card .title`.",
        "For `!important` declarations the layer order reverses, and unlayered important styles become the weakest author styles in the document.",
        "An inherited value loses to any declaration that targets the element directly, no matter how weak that selector is.",
        "`:where()` has zero specificity. It is the cleanest way to write defaults you intend other rules to beat."
      ]
    },
    {
      "t": "h2",
      "x": "First, rule out the failures that are not the cascade"
    },
    {
      "t": "p",
      "x": "Before counting selectors, confirm the declaration exists in the browser's model of the page. Select the element in DevTools and look for your rule in the Styles pane. There are three possible outcomes and they need three different fixes."
    },
    {
      "t": "ul",
      "items": [
        "**The rule is not listed at all.** Then the selector did not match this element, or the stylesheet never arrived. Check the class list in the DOM rather than in your source, look for a 404 in the Network panel, and remember that utility frameworks which scan source files for class names cannot emit a class you assembled from a string at runtime.",
        "**The rule is listed, but your declaration is struck through with a warning icon next to it.** The value was invalid for that property, so the parser discarded the whole declaration. `color: redd` and `margin: 10` do not fall back to something sensible. They never exist.",
        "**The declaration is live and the element still looks wrong.** The property may not apply to that element. `width` does nothing on a `display: inline` element, `z-index` does nothing without positioning (flex and grid children aside), and `height: 100%` needs an ancestor with a resolved height. Firefox marks most of these with an Inactive CSS warning and explains which change would make the property take effect."
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "A strikethrough has two very different meanings",
      "x": "DevTools strikes a declaration through both when another rule overrode it and when the parser rejected the value. Hover the icon and read the tooltip. If it says the property value is invalid, that is a parse error, and no amount of `!important` will rescue it."
    },
    {
      "t": "h2",
      "x": "The cascade resolves in a fixed order"
    },
    {
      "t": "p",
      "x": "When two declarations apply to the same element and disagree, the browser works through a sequence of tests and stops at the first one that separates them. Reading that sequence in order explains nearly every surprise."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Where the declaration came from, and whether it carries `!important`.",
        "**Context.** Shadow DOM encapsulation boundaries, which decide between a page-level rule and one written inside a component.",
        "**Element-attached styles.** A `style` attribute outranks any selector of the same importance.",
        "**Cascade layers.** Layer order, decided before specificity is ever looked at.",
        "**Specificity.** The three-number comparison people mean when they say specificity.",
        "**Order of appearance.** The last matching declaration in source order wins."
      ]
    },
    {
      "t": "p",
      "x": "Most arguments about CSS are arguments about step five. The tie was usually broken at step one or step four, which is why adding another class selector so often changes nothing at all."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a triple. The first number counts ID selectors, the second counts class selectors, attribute selectors and pseudo-classes, and the third counts type selectors and pseudo-elements."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (ids, classes-attributes-pseudo-classes, types-pseudo-elements) */\n\n*                        /* (0,0,0) */\nli                       /* (0,0,1) */\nli::before               /* (0,0,2) */\n.item                    /* (0,1,0) */\n[data-state=\"open\"]      /* (0,1,0) */\n:root                    /* (0,1,0)  a pseudo-class, not a type selector */\na:hover                  /* (0,1,1) */\nli:nth-child(2n + 1)     /* (0,1,1) */\n#nav a.active            /* (1,1,1) */\n.nav .list .item .link   /* (0,4,0) */\n#sidebar                 /* (1,0,0)  and this beats the line above it */"
    },
    {
      "t": "p",
      "x": "The comparison is lexicographic. Compare the first number, and only if it ties do you look at the second. There is no base ten and no carrying, so eleven class selectors never add up to one ID. Combinators contribute nothing, including the descendant space, and the universal selector contributes nothing either."
    },
    {
      "t": "p",
      "x": "Inline styles sit outside the triple completely. A `style` attribute wins against every author selector at the same importance level. That is why a carefully built rule with four class selectors loses to the two properties a component library wrote onto the element, and why raising the selector weight is wasted effort in that case."
    },
    {
      "t": "h2",
      "x": "The functional pseudo-classes change the arithmetic"
    },
    {
      "t": "code",
      "lang": "css",
      "x": ":is(.card, #page) p    /* (1,0,1)  takes its most specific argument */\n:where(.card, #page) p /* (0,0,1)  always contributes zero */\n:not(.card)            /* (0,1,0) */\n.card:has(> img)       /* (0,2,0) */\n\n/* Nesting: & carries the parent list's specificity, as if wrapped in :is() */\n.card, #page {\n  & .title { color: black; }   /* (1,1,0), because of #page */\n}\n\n/* Same structure, none of the inherited weight */\n:where(.card, #page) {\n  & .title { color: black; }   /* (0,1,0) */\n}"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` each take the specificity of their most specific argument. One ID buried in a long `:is()` list silently promotes the whole selector to ID weight, which is a nasty thing to debug three months later. `:where()` is the opposite: it always contributes zero, so it is the right wrapper for resets, themes and framework defaults that you expect a single class selector to override later."
    },
    {
      "t": "p",
      "x": "Nesting inherits this behaviour. Nest a rule under `.card, #page` and every nested rule carries ID weight, because `&` resolves as though the parent selector list were wrapped in `:is()`. Declaring the parent as `:where(.card, #page)` keeps the structure and drops the weight."
    },
    {
      "t": "h2",
      "x": "Inheritance is only a fallback"
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card { color: #334155; }   /* descendants inherit this */\na     { color: #2563eb; }   /* (0,0,1), and the link stays blue */\n\n/* What you actually wanted */\n.card a { color: inherit; }"
    },
    {
      "t": "p",
      "x": "This one eats afternoons. The link inside `.card` refuses to change colour, and escalating to `#page .card.card.card` does nothing, because the two declarations were never competing. An inherited value is used only when no declaration targets the element itself. Any matching rule outranks inheritance, however feeble its selector, and the browser's own default stylesheet counts as a matching rule for links, headings, form controls and tables."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "`@layer` moved the real leverage out of selector golf. Layers are compared at step four, before specificity, so where a rule lives decides the winner regardless of how the selectors look."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. Later layers win for normal declarations. */\n@layer reset, vendor, base, components, utilities;\n\n/* @layer statements may precede @import. Almost nothing else may. */\n@import url(\"ui-kit.css\") layer(vendor);\n\n@layer components {\n  #page .card .title { color: rebeccapurple; }  /* (1,2,0) */\n}\n\n.title { color: black; }  /* (0,1,0), unlayered, and it wins */"
    },
    {
      "t": "p",
      "x": "Normal declarations outside any layer behave as if they sat in a final layer appended after all the others, so they beat everything inside a layer. That gives you a tidy way to win against a third-party stylesheet without touching `!important`: import the vendor CSS into a layer and leave your own styles unlayered. A single class selector then overrides their most baroque five-part selector."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layer order reverses for !important",
      "x": "Given `@layer a, b;`, an `!important` declaration in layer `a` beats one in layer `b`, the opposite of how normal declarations behave. Important declarations in unlayered styles end up weakest of all your author styles. People reach for `!important` inside a utilities layer, watch it lose to the reset, and conclude the browser is broken. Confirm the result in DevTools rather than reasoning it out from memory, because the reversal is easy to get backwards."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "revert-layer is often what you actually wanted",
      "x": "`revert-layer` rolls a property back to the value it would have taken from the previous layer, and `revert` rolls it back to the user or user-agent value. Both express 'undo what the framework did, here' far better than `!important`, which expresses 'win forever, everywhere'."
    },
    {
      "t": "h2",
      "x": "Where !important actually sits"
    },
    {
      "t": "p",
      "x": "`!important` does not mean maximum priority. It moves a declaration into a different band, and some of those bands belong to the browser and to the reader rather than to you. Highest priority first:"
    },
    {
      "t": "table",
      "head": [
        "Priority",
        "Declaration",
        "What it means for you"
      ],
      "rows": [
        [
          "1",
          "Transition declarations",
          "A property mid-transition outranks everything, including important declarations. A value that looks stuck for a moment is often a transition still running."
        ],
        [
          "2",
          "Important user agent",
          "Browser defaults marked important. Rare, and mostly about form controls and accessibility behaviour."
        ],
        [
          "3",
          "Important user",
          "Styles the reader installed. Your `!important` cannot lock a user stylesheet out, which is deliberate."
        ],
        [
          "4",
          "Important author",
          "Your `!important` declarations, with layer order reversed as described above."
        ],
        [
          "5",
          "Animation declarations",
          "A running `@keyframes` animation beats any normal declaration, so a rule that will not apply may be an animation holding the property."
        ],
        [
          "6",
          "Normal author",
          "Nearly all of your CSS lives here."
        ],
        [
          "7",
          "Normal user",
          "Reader styles without `!important`."
        ],
        [
          "8",
          "Normal user agent",
          "The default stylesheet, where an unstyled heading's size comes from."
        ]
      ],
      "caption": "Cascade order by origin and importance. Specificity is only ever compared within a single band."
    },
    {
      "t": "p",
      "x": "Two consequences are worth keeping. An `!important` declaration in a stylesheet beats a normal inline style, and that is the one use of the keyword that keeps earning its place: overriding inline styles set by a widget or a script you do not control. The other consequence is the cost. Once a property is `!important` somewhere, every later override of it has to be `!important` too, and specificity gets compared only among those important declarations. That is the mechanism by which a stylesheet acquires four hundred of them."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Check the element, not your intent",
          "x": "Inspect the real DOM node and read its class list there. A conditional class that never rendered, a wrapper component that spread props onto a different element, or a server and client mismatch will all leave your selector matching nothing while the source looks correct."
        },
        {
          "title": "Find your rule in the Styles pane",
          "x": "If it is absent, the problem is matching or loading. If it is present but struck through, read the tooltip to learn whether another rule beat it or the parser rejected the value. Chrome also shows a selector's specificity on hover and badges rules with the layer they came from, both of which save guessing. DevTools features move between releases, so check what your own build offers (noted November 2026)."
        },
        {
          "title": "Read the Computed pane instead of arguing with the Styles pane",
          "x": "Computed shows the value that won, and expanding a property lists every declaration that tried, in cascade order, with a link to each source line. This is the fastest way to discover that the winner is a rule from a dependency you forgot you shipped.",
          "code": "/* Confidence check in the console: what is the browser actually using? */\ngetComputedStyle(document.querySelector('.title')).color"
        },
        {
          "title": "Work up the sequence, not down",
          "x": "Importance first, then inline styles, then layers, then specificity, then source order. Checking in that order usually lands on the answer within a minute. Starting with specificity sends you adding class selectors to a rule that was never the problem."
        },
        {
          "title": "Fix it at the layer level where you can",
          "x": "Moving a stylesheet into a layer, or pulling your own override out of one, resolves the conflict structurally. Compare that with raising specificity, which wins today and leaves the next person a selector they have to beat."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Keeping it from happening again"
    },
    {
      "t": "p",
      "x": "Specificity fights are a symptom of an unplanned cascade. A handful of habits remove most of them."
    },
    {
      "t": "ul",
      "items": [
        "Declare your layer order in one place, at the top of the entry stylesheet, so it never depends on which file a bundler happened to emit first. This also heads off the works-locally-breaks-in-production variant, where the dev server loads stylesheets in import order and the production build concatenates them in another.",
        "Keep IDs out of selectors. Use them for anchors, `label` targets and JavaScript hooks, and style with classes, so the first number of the triple stays at zero everywhere.",
        "Wrap resets and theme defaults in `:where()`. Zero specificity means a component can override them without escalation.",
        "Treat `!important` as a tool with exactly one job: beating inline styles you do not own. Leave a comment naming which ones.",
        "Watch shorthands. A later `background: red` wipes out the `background-image` you set earlier in the same rule, and that reads exactly like a specificity problem until you notice the shorthand resetting its longhands."
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working at all?",
          "a": "Work through three causes in order. The selector may not match the element, so check the class list on the real DOM node. The declaration may have been discarded for an invalid value, which DevTools shows as a strikethrough with a warning icon. Or it matched and lost the cascade, in which case the Computed pane will name the rule that beat it. Only the third case is a specificity problem."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes, when the `!important` is in a stylesheet and the inline style is a normal declaration. Importance is compared at the very first step, before the browser gets as far as element-attached styles, so an important author declaration outranks the `style` attribute. An inline `!important` wins again, because both are then important author declarations and the element-attached one takes precedence."
        },
        {
          "q": "How many classes does it take to beat an ID in CSS?",
          "a": "None. The three numbers are compared left to right, so a selector with one ID beats a selector with zero IDs regardless of how many class selectors it carries. To beat an ID rule without adding an ID, your options are cascade layers, source order within the same layer, repeating a selector such as `.title.title.title`, or `!important`. Prefer layers."
        },
        {
          "q": "What is the specificity of :where() and :is()?",
          "a": "`:where()` always contributes zero, whatever is inside it. `:is()` contributes the specificity of its most specific argument, and so do `:not()` and `:has()`. So `:is(.a, #b) p` is (1,0,1) while `:where(.a, #b) p` is (0,0,1). In nested CSS, `&` behaves like `:is()` over the parent selector list, which is how ID weight leaks into nested rules nobody wrote an ID into."
        },
        {
          "q": "Do cascade layers override !important?",
          "a": "No. Importance is compared first, so an important declaration beats a normal one from any layer. Within the important author band, layer order is reversed: the earliest declared layer wins, and important declarations in unlayered styles rank lowest. That reversal is the part people get backwards, so test it in the browser before building on it."
        },
        {
          "q": "How do I override a third-party stylesheet without !important?",
          "a": "Import it into a cascade layer and keep your own styles out of any layer. Normal unlayered declarations beat normal layered ones before specificity is considered, so one class selector of yours overrides whatever they wrote. The syntax is `@import url(\"vendor.css\") layer(vendor);`. It works for a CSS file whose import you control, not for one a widget injects at runtime."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Once the right rule is applying, the next question is which layout module should own it.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a colour pair against WCAG AA and AAA before you commit it to a theme layer.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of bug one level up: the code looks right, so the model of what runs when is wrong.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-27",
  "updated": "2026-11-27",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
