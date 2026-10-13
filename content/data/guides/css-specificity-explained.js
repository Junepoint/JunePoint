module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "Your selector looks right but the style never lands. How specificity, cascade layers, inline styles and !important decide which declaration wins.",
  "standfirst": "Four different failures look identical in the browser. This walks through how to tell them apart, how specificity is really counted, and why cascade layers are checked before it.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "important css override",
    "specificity calculation"
  ],
  "cardDesc": "Four reasons a CSS rule loses, and how to read the cascade before you reach for !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "A declaration can fail for four unrelated reasons: the selector never matched, it matched but lost the cascade, the value was invalid and thrown away at parse time, or the property does not apply to that element. Find out which one before you touch the selector.",
        "Specificity is three independent counts (IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements). `0,1,0` beats `0,0,11`. Nothing carries from one column to the next.",
        "Cascade layers and the `style` attribute are both resolved **before** specificity. A `0,0,1` rule in a later layer beats a `1,2,0` rule in an earlier one.",
        "`!important` inverts the order, including the layer order. `@layer` and `:where()` remove most of the reasons people reach for it."
      ]
    },
    {
      "t": "h2",
      "x": "Work out which failure you have"
    },
    {
      "t": "p",
      "x": "**Open DevTools and look at the element's Styles pane before changing anything.** The pane tells you which of the four failures you are looking at, and the four need completely different fixes. Adding `!important` to a rule that never matched does nothing at all, which is how people end up with three of them stacked on the same property."
    },
    {
      "t": "ol",
      "items": [
        "**Your rule is not listed in the Styles pane at all.** The selector does not match this element, or the stylesheet never loaded. Specificity is irrelevant here.",
        "**It is listed, and the declaration has a line through it.** Something else won. Scroll up: DevTools lists matching rules in winning order, so the rule above it is the one to read.",
        "**It is listed, not struck through, and still has no visible effect.** Either the value was dropped as invalid, or the property does not apply to this kind of element.",
        "**It works, then stops.** A transition, a running animation, or JavaScript writing to `element.style` is overriding it after the fact."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Confirm the match in the console first",
      "x": "One line settles the difference between case 1 and case 2. If the count is `0`, stop editing specificity and fix the selector or the DOM assumption behind it."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does anything match at all?\ndocument.querySelectorAll('.card > .title').length\n\n// What did the element actually compute?\ngetComputedStyle(document.querySelector('.title')).color"
    },
    {
      "t": "p",
      "x": "A frequent cause of a zero count is an extra wrapper. `.card > .title` requires `.title` to be a direct child, and a component library that wraps its slot content in a div breaks that silently. Switching `>` to a descendant combinator usually fixes it, though you give up some precision."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a triple, not a number. Count the IDs in the selector, then the classes, attribute selectors and pseudo-classes, then the element types and pseudo-elements. Compare the columns left to right and stop at the first difference. A single ID outranks any quantity of classes, which is why the \"0.1.0\" dotted notation you may have seen is misleading: there is no base 10 and no carrying."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "p            { color: blue; }    /* 0,0,1 */\n.note        { color: green; }   /* 0,1,0 */\np.note       { color: red; }     /* 0,1,1 */\n[data-open]  { color: teal; }    /* 0,1,0 - attributes count as classes */\np::first-line{ color: gray; }    /* 0,0,2 - pseudo-elements count as types */\n#intro       { color: black; }   /* 1,0,0 */\n\n/* Eleven classes. Still loses to #intro. */\n.a.b.c.d.e.f.g.h.i.j.k { color: orange; }\n\n/* Combinators and * add nothing */\n* > p + p    { color: pink; }     /* 0,0,2 */"
    },
    {
      "t": "p",
      "x": "Three functional pseudo-classes bend this, and they are the ones worth memorising. `:is()` and `:not()` take the specificity of their most specific argument. `:where()` always contributes zero, no matter what you put inside it. That makes `:where()` the right tool for a reset or a set of defaults you expect every component to override."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ":where(#sidebar .widget) a { color: red; }  /* 0,0,1 - the :where() is free */\n:is(#sidebar, .widget) a    { color: red; }  /* 1,0,1 - the #id wins the argument */\na:not(#promo)               { color: red; }  /* 1,0,1 - same rule applies */"
    },
    {
      "t": "p",
      "x": "Native nesting inherits this behaviour, and it catches people out. The `&` in a nested rule resolves as `:is(<parent selector list>)`, so a parent list containing one ID pushes an ID into the specificity of every rule nested inside it, even for the elements that matched through the class."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card, #hero {\n  & .title { font-weight: 600; }  /* 1,1,0 for BOTH .card .title and #hero .title */\n}\n\n/* Split the rule if that is not what you want */\n.card .title { font-weight: 600; }  /* 0,2,0 */"
    },
    {
      "t": "h2",
      "x": "Specificity is only one step of the cascade"
    },
    {
      "t": "p",
      "x": "This is the part that surprises experienced developers. The browser does not start with specificity. It works through a sequence of tests and only reaches specificity if everything earlier is tied, which means a deliberately vague selector can beat a precise one."
    },
    {
      "t": "table",
      "head": [
        "Priority",
        "Declaration"
      ],
      "rows": [
        [
          "1 (highest)",
          "A CSS transition currently in flight"
        ],
        [
          "2",
          "`!important` in the browser's own stylesheet"
        ],
        [
          "3",
          "`!important` in a user stylesheet or extension"
        ],
        [
          "4",
          "`!important` in your stylesheet"
        ],
        [
          "5",
          "A running CSS animation (`@keyframes`)"
        ],
        [
          "6",
          "Normal declarations in your stylesheet"
        ],
        [
          "7",
          "Normal declarations in a user stylesheet"
        ],
        [
          "8 (lowest)",
          "Normal declarations in the browser's stylesheet"
        ]
      ],
      "caption": "Origin and importance, resolved before anything else. Note that importance flips the order of the three origins."
    },
    {
      "t": "p",
      "x": "Once two declarations land in the same box of that table, the browser keeps going: shadow DOM context, then the `style` attribute, then cascade layers, then specificity, then scope proximity for `@scope`, then source order. Two consequences follow. An inline style beats every normal rule you write regardless of selector, because the `style` attribute is checked before layers and specificity are ever considered. And when specificity genuinely ties, the rule that appears later in the final stylesheet order wins, which is why a bundler reordering your imports can change rendering without any CSS changing."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "@scope and proximity",
      "x": "`@scope` adds a proximity test that runs after specificity: among scoped rules, the one whose scope root is nearest the element wins. Browser support is newer than the rest of this article, so check current support before relying on it in production (verify as of October 2026, support has been moving)."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity entirely"
    },
    {
      "t": "p",
      "x": "`@layer` creates ordered buckets. The order is fixed by the first time each layer name is mentioned, not by where the rules live, which is why most projects declare the order in one line at the top of the entry stylesheet. For normal declarations, a later layer beats an earlier one, and unlayered styles beat every layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, components;  /* order fixed here */\n\n@layer vendor {\n  #app .btn.btn-primary { color: black; }  /* 1,2,0 */\n}\n\n@layer components {\n  .btn { color: white; }  /* 0,1,0 - but a later layer, so it wins */\n}\n\n/* Unlayered. Beats every normal declaration in every layer. */\n.btn { color: rebeccapurple; }"
    },
    {
      "t": "p",
      "x": "That is the real fix for third-party CSS whose selectors are more specific than yours. Import it into an early layer and your own styles stop needing matching selectors. The import form is `@import url(\"vendor.css\") layer(vendor);`, or wrap the import in `@layer vendor { ... }`. Either way, a plain `.btn` of your own then overrides their `#app .btn.btn-primary`."
    },
    {
      "t": "p",
      "x": "Layer order reverses for `!important`, and this trips up people who assume importance is a simple override. Among important author declarations, the *earliest* layer wins and unlayered important declarations lose to layered ones."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base      { p { color: red  !important; } }\n@layer overrides { p { color: blue !important; } }\n\n/* red wins: layer precedence is inverted for important declarations */"
    },
    {
      "t": "h2",
      "x": "Rules that match, win, and still do nothing"
    },
    {
      "t": "p",
      "x": "If the declaration is in the Styles pane with no line through it, the cascade is not your problem. Check these instead."
    },
    {
      "t": "ul",
      "items": [
        "**The value was dropped at parse time.** An invalid declaration is discarded and the property keeps its previous value. DevTools marks it with a warning icon, which is easy to miss on a long rule.",
        "**A shorthand later in the cascade reset your longhand.** `background` resets `background-color`. `font` resets `line-height`. `margin` resets `margin-top`. Source order between the two is what matters.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements, `gap` does nothing outside a flex, grid or multi-column container, and `z-index` is ignored on a `position: static` element unless it is a flex or grid item.",
        "**A pseudo-element has no `content`.** `::before` and `::after` generate nothing without it, so every other declaration in the rule is wasted. `content: \"\"` is enough.",
        "**The property is not inherited.** Setting `border` or `background` on a parent does nothing for children. Font and color properties inherit; box and layout properties generally do not.",
        "**An enclosing at-rule does not match.** A `@media`, `@supports` or `@container` condition that is false hides everything inside it, and a container query against an element with no queried container silently never applies.",
        "**The parser is skipping your rule.** An unclosed brace or a stray character causes error recovery that can swallow the following rules. So does an unrecognised pseudo-class in a comma-separated selector list, which invalidates the whole list unless you wrap it in `:is()` or `:where()`.",
        "**JavaScript is writing inline styles.** Animation libraries and drag handlers set `element.style` directly, which outranks any normal rule you write."
      ]
    },
    {
      "t": "h2",
      "x": "When !important is defensible, and what to use instead"
    },
    {
      "t": "p",
      "x": "`!important` is not forbidden. It is just a tool with one job: winning against something you do not control. Utility classes in a framework like Tailwind use it in a few places for exactly that reason, and a user stylesheet for accessibility is a legitimate use of the mechanism by design."
    },
    {
      "t": "p",
      "x": "What makes it painful is that it has no gradations. Once a property is important somewhere in a codebase, the only way to override it is another important declaration earlier in the layer order, and you have replaced a readable cascade with an argument. Reach for these first."
    },
    {
      "t": "table",
      "head": [
        "Instead of",
        "Use",
        "Why"
      ],
      "rows": [
        [
          "`!important` to beat vendor CSS",
          "`@import ... layer(vendor)`",
          "Moves their whole stylesheet below yours regardless of their selectors"
        ],
        [
          "High-specificity reset selectors",
          "`:where(...)` in a reset layer",
          "Contributes zero specificity, so anything overrides it"
        ],
        [
          "`#app #main .thing` selector padding",
          "`:is(#app) .thing` or a layer",
          "Gets you one controlled bump instead of an escalating selector"
        ],
        [
          "`!important` to beat an inline style",
          "`!important`, or remove the attribute",
          "Author important genuinely is the only CSS that beats a normal inline style"
        ]
      ],
      "caption": "The last row is the honest case: there is no non-important CSS that outranks an inline declaration."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "One widely repeated answer is wrong",
      "x": "\"Add `!important` and it will always win\" is not true, and believing it costs real debugging time. An important declaration in a later cascade layer loses to an important declaration in an earlier one, an in-flight transition outranks all of them, and a user stylesheet's important declaration beats yours. If your `!important` is being ignored, look for a layer or a transition rather than adding a second one."
    },
    {
      "t": "h2",
      "x": "A checklist you can run in order"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "Run the selector through `querySelectorAll` in the console. A result of `0` means the problem is the selector or the DOM, and no amount of specificity will help.",
          "code": "document.querySelectorAll('your .selector').length"
        },
        {
          "title": "Read the Styles pane top down",
          "x": "Rules are listed in winning order. If your declaration is struck through, the winner is above it, with its file, line, and layer name shown."
        },
        {
          "title": "Expand the property in the Computed pane",
          "x": "Computed shows the final value and, when expanded, every declaration that competed for it. This is the fastest way to find an inline style or an unexpected important declaration."
        },
        {
          "title": "Check for a layer before you count specificity",
          "x": "DevTools labels layered rules with their `@layer` name. If the winner is in a later layer than yours, counting IDs and classes is wasted effort."
        },
        {
          "title": "Fix it at the lowest level that works",
          "x": "In order of preference: move the third-party CSS into an earlier layer, lower your reset with `:where()`, add one class to the element, add one controlled specificity bump with `:is()`. Treat `!important` as the last option and leave a comment saying what it is fighting."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module fits, and the sizing details that cause overflow bugs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "Five causes for state that looks one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three common reasons. The selector may not match the element at all, in which case importance changes nothing. The winning declaration may be important in an earlier cascade layer, because layer order is reversed for important declarations. Or a CSS transition may be in flight, which outranks every important author declaration while it runs. Check the Styles pane: if your rule is listed but struck through, look at what is above it."
        },
        {
          "q": "How do I override an inline style without !important?",
          "a": "You cannot with a normal declaration. The style attribute is resolved before cascade layers and specificity, so it beats every normal author rule regardless of selector. Your options are an important author declaration, removing or not setting the attribute, or setting the property on a pseudo-element or child that the inline style does not reach. If JavaScript is writing the attribute, changing that is usually the cleaner fix."
        },
        {
          "q": "Does an ID always beat classes in CSS?",
          "a": "Only in the specificity step, and the browser gets there last. One ID beats any number of classes on specificity, but a cascade layer declared later, an inline style, or an important declaration all outrank it before specificity is consulted. That is also why a single class in unlayered CSS can beat an ID selector that lives inside a layer."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. The difference is specificity: :is() takes the specificity of its most specific argument, so :is(#id, .class) contributes 1,0,0, while :where() always contributes zero. Use :where() for resets and defaults you want everything to override, and :is() when you want the grouping without losing specificity. Both accept forgiving selector lists, so an unsupported selector inside them does not invalidate the rest."
        },
        {
          "q": "Do cascade layers work in all browsers?",
          "a": "@layer shipped in Chrome, Firefox and Safari during the first half of 2022, so current versions of all three support it. There is no partial fallback: a browser that does not understand @layer ignores the whole block, so the styles inside disappear rather than degrading. Check caniuse for the exact versions against your own support targets before relying on it."
        },
        {
          "q": "Why does my CSS work locally but not in the production build?",
          "a": "Usually source order. When specificity ties, the later declaration wins, and bundlers decide the final order from the import graph, code splitting and chunk loading, which can differ between dev and production. Look at the shipped stylesheet order in the Network panel. Cascade layers are the durable fix, since an explicit @layer order no longer depends on which file happens to come last."
        },
        {
          "q": "How do I calculate specificity quickly?",
          "a": "Count three things: IDs, then classes plus attribute selectors plus pseudo-classes, then element types plus pseudo-elements. Universal selectors, combinators and :where() count as nothing. Compare left to right and stop at the first column that differs. Browser DevTools shows the computed specificity for a selector when you hover it, which is faster and less error-prone than counting by hand on long selectors."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-13",
  "updated": "2026-10-13",
  "author": "jackson",
  "related": []
};
