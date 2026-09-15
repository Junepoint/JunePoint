module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "A CSS rule that does nothing either never matched, lost the cascade, or had an invalid value. How to tell which, using specificity, layers and !important.",
  "standfirst": "How the browser picks a winner: the specificity tuple, where cascade layers cut in ahead of it, what !important actually changes, and the failures that are not cascade problems at all.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "css cascade order"
  ],
  "cardDesc": "Specificity maths, cascade layers, !important, and the non-cascade reasons a rule silently does nothing.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "A rule that does not apply is failing in one of three ways: it never matched the element, it matched and lost the cascade, or it won and its value was discarded as invalid. Each has a different fix.",
        "Specificity is three numbers compared left to right: IDs, then classes/attributes/pseudo-classes, then types/pseudo-elements. The columns never carry, so `(0,11,0)` still loses to `(1,0,0)`.",
        "Cascade layers are sorted *before* specificity. One class in a later layer beats an ID selector in an earlier layer, every time.",
        "`!important` is not a larger specificity number. It moves the declaration into a different importance bucket that is compared before layers, inline styles and specificity.",
        "For important declarations the layer order reverses, and a layered `!important` beats an unlayered `!important`. That is the cleanest way to win against a third-party widget.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` contribute as much as their most specific argument, even when a cheaper argument is the one that matched."
      ]
    },
    {
      "t": "lede",
      "x": "Most bugs filed as specificity problems are matching problems. The selector has a stray child combinator, or the class name is hashed by the build, or the stylesheet never loaded. So before working out whether `#sidebar .link` outranks `nav ul li a.link:hover`, spend ten seconds proving the selector matches anything at all."
    },
    {
      "t": "h2",
      "x": "First: does the selector match?"
    },
    {
      "t": "p",
      "x": "The Styles panel in DevTools shows every author rule that matches the inspected element. A declaration that matched but lost appears with a line through it. A rule that never matched does not appear at all. That absence is the single most useful signal available, and it is easy to miss because an empty result looks like a tooling failure rather than an answer."
    },
    {
      "t": "p",
      "x": "Confirm it from the console. Select the element in the Elements panel so it is available as `$0`, then ask directly:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// 0 means the selector is wrong, not that the cascade beat you\ndocument.querySelectorAll('.card > .title').length\n\n// Does this specific element match?\n$0.matches('.card > .title')\n\n// What did the element actually end up with?\ngetComputedStyle($0).color\n\n// Which classes are really on it? Useful with CSS Modules or styled-components\n$0.className"
    },
    {
      "t": "p",
      "x": "Common reasons a selector silently matches nothing:"
    },
    {
      "t": "ul",
      "items": [
        "A child combinator where a wrapper element has appeared between parent and target. `.card > .title` breaks the moment a framework wraps the heading in a div; `.card .title` survives it.",
        "Hashed class names. CSS Modules turns `.title` into something like `.title_x7f3a`, so a hand-written `.title` rule in a global stylesheet never matches the element.",
        "Case. Class and ID names are case-sensitive in standards-mode HTML, so `.Button` and `.button` are unrelated selectors.",
        "`:nth-child()` counts element siblings, including elements your markup generator inserts. `:nth-of-type()` is often what you meant.",
        "The stylesheet is not loaded. Check the Network panel for a 404 on the CSS file before anything else, and check `document.styleSheets.length` if it is injected by a bundler."
      ]
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Every selector gets a triple. Column one counts ID selectors. Column two counts classes, attribute selectors and pseudo-classes. Column three counts type selectors and pseudo-elements. Comparison is left to right, and it stops at the first difference. Nothing carries between columns, which is the part people get wrong: eleven classes do not add up to one ID, and they never will."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#sidebar .link          { color: red; }   /* (1,1,0) wins */\nnav ul li a.link:hover  { color: blue; }  /* (0,2,4) loses */\n\n/* Ties break on document order: the later declaration wins */\n.btn { padding: 8px; }\n.btn { padding: 12px; }  /* 12px */"
    },
    {
      "t": "p",
      "x": "Combinators are free. The space, `>`, `+` and `~` contribute nothing, so a long descendant chain buys far less than it looks like it should. The universal selector `*` is also zero. Document order means position in the final concatenated stylesheet, which includes the order of your `<link>` elements and the order of `@import` statements, so a bundler that reorders files can flip a tie without any source change."
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
          "`*`, `>`, `+`, `~`",
          "(0,0,0)",
          "The universal selector and all combinators are free."
        ],
        [
          "`div`, `::before`",
          "(0,0,1)",
          "Type selectors and pseudo-elements share the third column."
        ],
        [
          "`.card`, `[href^='https']`, `:hover`",
          "(0,1,0)",
          "Classes, attribute selectors and pseudo-classes all count here."
        ],
        [
          "`#main`",
          "(1,0,0)",
          "One ID outranks any number of classes."
        ],
        [
          "`:where(.a, #b)`",
          "(0,0,0)",
          "Always zero, whatever is inside it."
        ],
        [
          "`:is(.a, #b)`",
          "(1,0,0)",
          "Takes its most specific argument, even if `.a` is what matched."
        ],
        [
          "`:not(.a)`",
          "(0,1,0)",
          "Same rule as `:is()`. The negation itself costs nothing."
        ],
        [
          "`style='...'`",
          "not applicable",
          "Not a selector. Sorted in an earlier cascade step, so it beats author selectors unless importance is involved."
        ]
      ],
      "caption": "Specificity contributions by selector form. Read the triple as (IDs, classes, types)."
    },
    {
      "t": "h2",
      "x": "Where :is(), :where() and nesting change the maths"
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes are the main reason a modern stylesheet's specificity is not what a quick glance suggests. `:where()` always contributes zero. `:is()`, `:not()` and `:has()` contribute the specificity of their most specific argument, computed once, regardless of which argument did the matching. So this rule is expensive even on an element that has no ID anywhere near it:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": ":is(#app, .app) .title { color: teal; }   /* (1,1,0) */\n:where(#app, .app) .title { color: teal; } /* (0,1,0) */\n\n/* Nesting behaves like :is() over the parent selector list */\n#app, .card {\n  & .title { color: teal; }  /* (1,1,0), inherited from #app */\n}\n\n/* Same nesting, cheap on purpose */\n:where(#app, .card) {\n  & .title { color: teal; }  /* (0,1,0) */\n}"
    },
    {
      "t": "p",
      "x": "This is worth exploiting rather than merely avoiding. Write resets, defaults and library base styles inside `:where()` so that a single class in application code can override them without an arms race. Keep `:is()` for the cases where you genuinely want the grouping to carry weight."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "One ID is a lot of ID",
      "x": "If you inherit a stylesheet full of ID selectors, rewriting `#header .nav a` as `:where(#header) .nav a` preserves the matching behaviour exactly while dropping the rule to (0,1,1). It is a mechanical, low-risk change, and it usually removes the reason someone reached for `!important` in the first place."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "Layers sit above specificity in the sorting order, so they settle the contest before specificity is ever consulted. For normal declarations, a later layer beats an earlier one, and declarations outside every layer beat all layered declarations."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. A layer's position is fixed\n   the first time its name appears. */\n@layer reset, vendor, base, components, utilities;\n\n@layer base {\n  #content a { color: rebeccapurple; }  /* (1,0,1) */\n}\n\n@layer utilities {\n  .text-muted { color: gray; }          /* (0,1,0) and it wins */\n}\n\n/* Push third-party CSS to the bottom of the stack without editing it */\n@import url('vendor-widget.css') layer(vendor);"
    },
    {
      "t": "p",
      "x": "That last trick is the practical payoff. Importing a vendor stylesheet into a low-priority layer means its `#widget .button` rules can no longer outrank your `.button` utility, and you delete a column of `!important` from your own code. The cost is that layer order becomes a piece of architecture you have to maintain and document, because a rule's position in the file no longer predicts whether it wins."
    },
    {
      "t": "p",
      "x": "`revert-layer` is the companion keyword. It rolls a property back to the value it would have had from earlier layers, which is a cleaner escape hatch than `initial` or `unset` when you want to undo one layer's opinion without guessing what the underlying value was."
    },
    {
      "t": "h2",
      "x": "Origins, inline styles and what !important really does"
    },
    {
      "t": "p",
      "x": "The browser sorts competing declarations in this order, stopping as soon as one step produces a winner:"
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author, user and user-agent stylesheets, split by whether the declaration is important.",
        "**Context.** Shadow trees versus the outer document. The direction of this step reverses for important declarations, so verify against the spec before relying on it in a web component.",
        "**Element-attached styles.** The `style` attribute.",
        "**Layer.**",
        "**Specificity.**",
        "**Order of appearance.**"
      ]
    },
    {
      "t": "p",
      "x": "Within step one, precedence runs from weakest to strongest: normal user-agent, normal user, normal author, CSS animations, important author, important user, important user-agent, and finally CSS transitions. Three consequences catch people out. An author `!important` in a stylesheet beats a normal inline `style` attribute, because importance is compared before the element-attached step. A running `@keyframes` animation beats every normal author declaration, which is why your class-based color change does nothing mid-animation. And a transition in flight beats everything, including important declarations, for as long as it runs."
    },
    {
      "t": "p",
      "x": "So `!important` does not make a selector more specific. It relocates the declaration to a bucket that is compared earlier. Two important declarations from the same origin still have to be separated somehow, and that is where the reversal matters:"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Important declarations reverse the layer order",
      "x": "For important declarations, earlier layers beat later layers, and declarations inside any layer beat declarations outside every layer. An `!important` rule you put in `@layer utilities` therefore beats a widget's unlayered `!important`, which is the opposite of the normal-declaration behaviour. Layers have shipped in every evergreen browser since 2022, but the inverted ordering is surprising enough that it belongs in a comment next to the rule."
    },
    {
      "t": "p",
      "x": "When you have to defeat someone else's `!important` and cannot edit their file, the options in rough order of preference are: import their stylesheet into a low-priority layer so the fight never starts; put your own important declaration inside a layer, since layered beats unlayered for important rules; raise specificity among important declarations, for example by adding an attribute selector; or set the important value inline, which wins the element-attached step. Inline important is a last resort because it is invisible to anyone reading the stylesheet."
    },
    {
      "t": "h2",
      "x": "Failures that are not cascade problems"
    },
    {
      "t": "p",
      "x": "Once the Styles panel shows your declaration present and not struck through, the cascade has already agreed with you. Something else is discarding the value."
    },
    {
      "t": "ul",
      "items": [
        "**Invalid value.** A malformed declaration is dropped at parse time, and the fallback is whatever the previous declaration said. `width: 100 px` with a space is thrown away; DevTools flags it with a warning icon next to the property.",
        "**Custom properties fail later, and harder.** `var()` substitution happens after parsing, so `color: var(--nope)` with no fallback does not fall back to the previous `color` declaration. It becomes invalid at computed-value time, and the property resets to its inherited or initial value. This is why one typo in a token name can turn text black rather than leaving it as it was.",
        "**A shorthand resetting your longhand.** `background: url(hero.jpg)` later in the file wipes out an earlier `background-color`, because the shorthand sets every one of its longhands, including the ones you omitted.",
        "**The property does not inherit.** Setting `border` or `padding` on a parent does nothing for the child. `color`, `font-family` and `line-height` do inherit; most box properties do not.",
        "**The formatting context ignores it.** `width` and vertical margins do nothing on a non-replaced inline element, and `align-items` does nothing unless the parent is a flex or grid container. See [CSS Grid vs. Flexbox](/guides/css-grid-vs-flexbox/) for which properties belong to which layout model.",
        "**The media or container query does not match.** A `@media` block adds no specificity, so a rule inside one loses ties to an identical rule outside it. Check the query is true at the current viewport before blaming the selector.",
        "**Stale output.** Two utility frameworks in one bundle, a hot-reload that dropped a rule, or a cached CSS file. Hard-reload and check the served file in the Network panel rather than the source on disk."
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
          "title": "Prove the selector matches",
          "x": "Run the selector through `querySelectorAll` in the console. A count of zero ends the investigation; the problem is the selector or the markup, not the cascade.",
          "code": "document.querySelectorAll('#sidebar .link').length"
        },
        {
          "title": "Read the Styles panel top to bottom",
          "x": "Matching rules are listed strongest first. If your declaration is struck through, the rule above it won and you can read that rule's selector directly. If your declaration is not listed, go back to step one."
        },
        {
          "title": "Compare the computed value, not the declaration",
          "x": "The Computed tab shows the value that survived, and expanding a property reveals the winning declaration with a link to its source line. This is the fastest way to find an override buried in a vendor file.",
          "code": "getComputedStyle($0).getPropertyValue('color')"
        },
        {
          "title": "Work out which step decided it",
          "x": "Different origin or importance, different layer, higher specificity, or later in the document. Only one of those is true, and the fix differs for each. Escalating with `!important` when the real cause was layer order will work today and break the next time someone adds a layer."
        },
        {
          "title": "Fix at the lowest step you can",
          "x": "Prefer reordering or relayering over raising specificity, and prefer raising specificity over `!important`. If you do add `!important`, leave a comment saying what it is fighting, so it can be removed when that rule goes away."
        }
      ]
    },
    {
      "t": "p",
      "x": "One further step is arriving in the platform: `@scope` adds a proximity comparison, so that among two matching rules the one whose scope root is nearer the element wins, independently of specificity. Browser support has been landing gradually rather than all at once, so check the support tables for the browsers you actually ship to before building a design system on it, and keep a specificity-based fallback for anything load-bearing. Support data here is accurate as of September 2026 only in the sense that it was changing; verify it yourself."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model owns which properties, and how to choose between them.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "React useState not updating",
          "desc": "The other bug that looks like your code was ignored. Five causes to check.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        },
        {
          "title": "Node 'Cannot find module'",
          "desc": "Resolution order, and where the lookup you assumed happens actually stops.",
          "href": "/guides/cannot-find-module-node/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check in this order. Does the selector match anything? Run document.querySelectorAll with it in the console; a count of zero means the selector or the markup is wrong. If it matches, open DevTools and look at the Styles panel: a declaration with a line through it lost to a stronger rule, which will be listed above it. If the declaration is present and not struck through, the value itself is being discarded, usually because it is malformed, because a shorthand later in the file reset it, or because a var() reference failed to resolve."
        },
        {
          "q": "Do ten classes beat one ID in CSS?",
          "a": "No. Specificity is three separate counters compared left to right, and they never carry. A selector with eleven classes is (0,11,0) and an ID selector is (1,0,0), so the ID wins on the first column and the class count is never even looked at. The only ways to beat an ID selector are another ID, an inline style, an important declaration, a higher-priority cascade layer, or wrapping the ID in :where() so it stops counting."
        },
        {
          "q": "How do I override !important without using !important myself?",
          "a": "The cleanest option is cascade layers. Import the offending stylesheet into a low-priority layer with @import url('theirs.css') layer(vendor), and its important declarations lose to important declarations in your own layers, because layered important beats unlayered important and earlier layers beat later ones for important rules. If you cannot control how the file is loaded, your remaining choices are to add your own important declaration with higher specificity, or to set the value inline with important, which wins the element-attached step of the cascade."
        },
        {
          "q": "Is !important ever acceptable?",
          "a": "Yes, in narrow cases. Accessibility overrides in a user stylesheet are exactly what the user-important bucket exists for. Overriding a third-party widget that ships ID-based selectors and gives you no hook is a legitimate use when layers are not available. Print stylesheets that must win regardless of screen rules are another. What makes it a problem is using it as a general-purpose tiebreaker inside your own codebase, because the next person has no move left except adding another one."
        },
        {
          "q": "Do cascade layers beat specificity?",
          "a": "Yes. Layer is compared before specificity in the cascade sorting order, so a single-class rule in a later layer beats an ID selector in an earlier layer for normal declarations. Declarations outside every layer beat all layered normal declarations. For important declarations the ordering inverts: earlier layers win, and layered wins over unlayered."
        },
        {
          "q": "Why does my style disappear only while an element is animating?",
          "a": "Because CSS animations and transitions sit in their own importance buckets. A running @keyframes animation takes precedence over every normal author declaration, so a class you toggle mid-animation has no visible effect on the animated properties. An author important declaration does beat animations, but transitions outrank even important declarations while they are running. If a value only misbehaves during movement, look at what the animation or transition is touching rather than at your selector."
        },
        {
          "q": "How do I see which rule is winning in DevTools?",
          "a": "Select the element, then use the Computed tab rather than the Styles tab. Expand the property and DevTools lists the declarations that contributed, strongest first, each linked to its source file and line. The Styles tab is useful for the complementary question: it shows all matching rules in cascade order with the losers struck through, which tells you whether your rule matched at all."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-15",
  "updated": "2026-09-15",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
