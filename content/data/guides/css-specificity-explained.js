module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Troubleshooting",
  "description": "Your rule is not losing on specificity as often as you think. How the cascade sorts declarations, what layers change, and when !important is fair.",
  "standfirst": "A declaration that never takes effect is usually failing for one of five reasons, and only one of them is specificity. Here is the order to check them in.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "The cascade sorts on origin, layers and specificity in that order. Work out which step is actually beating your rule.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "First question, always: does the selector match anything? A rule that is absent from the Styles pane is not losing a contest. It never entered one.",
        "The cascade compares origin and importance, then context, then inline styles, then cascade layers, then specificity, then document order. Specificity is the fifth tiebreak, not the first.",
        "Specificity is three independent counts (IDs, classes, elements) compared left to right. Eleven classes never outrank one ID.",
        "Cascade layers invert for `!important`: the *earliest* layer wins, and unlayered `!important` is the weakest author important declaration there is.",
        "An unknown property or an invalid value drops that single declaration silently, which looks exactly like a specificity problem in the browser and is not one."
      ]
    },
    {
      "t": "p",
      "x": "Start by separating the two failure modes, because they have nothing in common. Select the element in DevTools and look for your selector in the Styles pane. If it is listed with a line struck through your declaration, another rule beat it, and the sorting rules below explain which one and why. If the selector is not listed at all, specificity is irrelevant: either the selector does not match this element, or the stylesheet never arrived, or the declaration was discarded as invalid before the cascade ever ran."
    },
    {
      "t": "h2",
      "x": "Is the selector matching at all?"
    },
    {
      "t": "p",
      "x": "This is the most common cause and the least interesting one, which is probably why people skip past it and go straight to `!important`. Three lines in the console settle it."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does the selector match anything on the page right now?\ndocument.querySelectorAll('.card .title').length\n\n// $0 is the element currently selected in the Elements panel.\n// Does *this* element match the selector you wrote?\n$0.matches('.card > .title:not(.is-muted)')\n\n// What did the browser end up using?\ngetComputedStyle($0).color"
    },
    {
      "t": "p",
      "x": "A zero from the first line ends the investigation. The usual culprits are boring. A typo in a BEM class, one underscore where the markup has two. A `>` child combinator that a component library quietly broke by wrapping your element in an extra `div`. A class that JavaScript adds after hydration, so it is present when you inspect but absent when the first paint happens. Scoped styles in Vue or Svelte compile to an attribute selector that only lands on elements the compiler saw, so anything injected with `v-html` or rendered by a child component will not carry it. CSS Modules hash your class names, so `.title` in the source is `.title_x7f2a` in the browser and a hand-written `.title` selector matches nothing."
    },
    {
      "t": "p",
      "x": "Also check the wrapper. If the rule is inside `@media (min-width: 900px)` and your window is 880 pixels wide, the rule exists and does not apply. Firefox and Chrome both grey out non-matching media blocks in the Styles pane, which is easy to miss at a glance."
    },
    {
      "t": "h2",
      "x": "The cascade decides in a fixed order"
    },
    {
      "t": "p",
      "x": "When two declarations both match and both set the same property, the browser walks a list of tiebreaks and stops at the first one that separates them. Most developers know the last two steps and assume the whole contest happens there. It does not."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What is compared",
        "Practical effect"
      ],
      "rows": [
        [
          "Origin and importance",
          "Author, user and user agent styles, with `!important` inverting their order",
          "Your `!important` beats any normal author rule and any browser default. A user stylesheet's `!important`, which is how some accessibility extensions work, beats yours."
        ],
        [
          "Context",
          "A shadow tree versus the outer document",
          "Only relevant with web components. For normal declarations the outer document wins, and for important declarations the shadow tree wins."
        ],
        [
          "Element-attached styles",
          "A `style` attribute versus anything in a stylesheet",
          "A normal inline style beats every normal author rule no matter how specific. It still loses to an author `!important` in a stylesheet."
        ],
        [
          "Cascade layers",
          "Which `@layer` a declaration sits in",
          "Later layers beat earlier ones, and unlayered normal styles beat every layer. Reversed for `!important`."
        ],
        [
          "Specificity",
          "The (IDs, classes, elements) triple",
          "Consulted only after everything above has tied."
        ],
        [
          "Scope proximity",
          "How close the `@scope` root is to the element",
          "A recent addition to the cascade that applies only inside `@scope`. Check the current spec before relying on where it sits."
        ],
        [
          "Order of appearance",
          "Which declaration the parser saw last",
          "Last one wins. This is why the order of your `<link>` tags relative to a framework's matters."
        ]
      ],
      "caption": "Cascade sorting order, highest priority step first. The browser stops at the first step that produces a winner."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Two things that outrank !important",
      "x": "A declaration belonging to a running CSS transition wins over everything, including `!important`. That is why a property under a transition can appear stuck at a value nothing in your stylesheet sets. Animation declarations sit lower: they override normal declarations but lose to `!important`, which is the usual reason an `!important` breaks a keyframe animation."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple. Count ID selectors, then class, attribute and pseudo-class selectors, then type and pseudo-element selectors. Compare the triples left to right and stop at the first difference. There is no carrying and no base-10 arithmetic, so a selector with eleven classes, (0,11,0), still loses to a single ID at (1,0,0). The old claim that 256 classes overflow into an ID came from a genuine bug in Internet Explorer 6 and has not been true in any browser you support."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "p                       { color: black; }        /* (0,0,1) */\n.note                   { color: blue; }         /* (0,1,0) */\np.note                  { color: green; }        /* (0,1,1) */\n#intro                  { color: red; }          /* (1,0,0) */\n* > .note               { color: teal; }         /* (0,1,0): * and > count for nothing */\n\n/* :is() and :not() take the specificity of their most specific argument */\n:is(#sidebar, .theme-dark) .note { color: orange; }      /* (1,1,0) */\n:not(.a, #b) .note               { color: brown; }       /* (1,1,0) */\n\n/* :where() always contributes zero, whatever is inside it */\n:where(#sidebar, .theme-dark) .note { color: rebeccapurple; }  /* (0,1,0) */"
    },
    {
      "t": "p",
      "x": "`:where()` is the useful one. Wrapping the contextual part of a selector in it lets you write `:where(.theme-dark) .btn` and keep the rule at the specificity of `.btn` alone, so a plain `.btn` override later in the file still works. Design systems that want to be overridable without a fight lean on this heavily."
    },
    {
      "t": "p",
      "x": "Native nesting has a trap here. The `&` reference behaves like `:is()` wrapped around the entire parent selector list, so it inherits the specificity of the most specific selector in that list, not of the branch that happened to match."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#app, .card {\n  & .title { color: red; }\n}\n\n/* Equivalent to :is(#app, .card) .title, which is (1,0,1). */\n/* So this later rule loses, even on a .card that has no #app ancestor: */\n.card .title { color: blue; }"
    },
    {
      "t": "h2",
      "x": "Cascade layers, and the reversal nobody expects"
    },
    {
      "t": "p",
      "x": "`@layer` exists to take these arguments away from specificity. You declare an order once, and from then on a rule in a later layer beats a rule in an earlier layer no matter how the selectors compare. A one-class selector in your app layer beats an ID selector from a framework layer. Support landed across Chrome, Firefox and Safari in spring 2022, so it is safe for most projects now, but confirm against your own browser support matrix rather than taking that from here."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order first. Layers listed later win. */\n@layer reset, framework, app;\n\n@layer framework {\n  #app .button { background: gray; }   /* (1,1,0) */\n}\n\n@layer app {\n  .button { background: rebeccapurple; }  /* (0,1,0), and it wins */\n}\n\n/* Unlayered normal styles beat every layer, whatever the specificity. */\n.button { background: hotpink; }  /* this is what you actually get */"
    },
    {
      "t": "p",
      "x": "That last line catches people out. Unlayered normal declarations are treated as an implicit final layer, so half-migrating a codebase to layers can make the unmigrated half unexpectedly dominant. Either put everything in a layer or accept that the leftovers always win."
    },
    {
      "t": "p",
      "x": "The genuinely counterintuitive part is what `!important` does to layer order. It flips it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base {\n  .btn { color: red !important; }    /* wins: earliest layer */\n}\n\n@layer overrides {\n  .btn { color: blue !important; }   /* loses, despite being a later layer */\n}\n\n.btn { color: green !important; }    /* weakest of the three */"
    },
    {
      "t": "p",
      "x": "This is deliberate rather than a quirk. A reset layer declared first can mark a few declarations important and be confident that nothing downstream, including a stray unlayered `!important`, can dislodge them. It reads backwards the first few times you meet it. If you use Tailwind v4, note that it registers its own layers natively, so your unlayered CSS sits above all of them and does not need an `!important` to override a utility."
    },
    {
      "t": "h2",
      "x": "When !important is the right call"
    },
    {
      "t": "p",
      "x": "The blanket advice to never use it is not honest. There are cases where it is the correct tool. Overriding a third-party widget that writes inline styles from JavaScript is one, because nothing in a stylesheet except `!important` beats a `style` attribute. Print stylesheets that must force a background off are another. Utility classes whose entire contract is \"this wins\" are a third, though cascade layers now express that intent better."
    },
    {
      "t": "p",
      "x": "The failure pattern is using it as a first response to a cascade you have not diagnosed. One `!important` gets overridden by a more specific `!important`, that one gets a third, and within a year the only way to change a colour is to add another. If you have a build step, a lint rule capping `!important` usage tends to be more effective than a policy nobody enforces at review time."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important does not defeat the transition rule",
      "x": "If a property is mid-transition, the transitioned value wins over your `!important` for the duration of the transition. Setting `transition: none` on the element in DevTools is a quick way to confirm whether that is what you are looking at."
    },
    {
      "t": "h2",
      "x": "Reasons that have nothing to do with the cascade"
    },
    {
      "t": "p",
      "x": "Plenty of rules that appear to lose never competed. Work through these before touching specificity:"
    },
    {
      "t": "ul",
      "items": [
        "**The declaration is invalid.** An unknown property name or a value the property does not accept causes the browser to drop that one declaration and keep parsing. `color: #ff` and `wdith: 10px` both vanish without a console error.",
        "**A syntax error swallowed the rest of the block.** A missing closing brace or a stray semicolon inside a declaration block can cause the parser to discard rules that follow. Chrome's Styles pane marks unparsed declarations with a warning triangle.",
        "**A shorthand later in the file reset your longhand.** `background: red` after `background-image: url(...)` clears the image. Same for `font`, `flex`, `grid-area` and `inset`.",
        "**The property does not apply to that element.** `width` and `height` are ignored on a non-replaced inline element. `justify-content` does nothing outside a flex, grid or multi-column container. `z-index` is ignored on a `position: static` element unless it is a flex or grid item.",
        "**The property is not inherited.** Setting `border` on a parent does not give children a border. Only inherited properties, mostly text-related ones, pass down without an explicit rule.",
        "**The stylesheet is stale.** A 304 from a CDN, a service worker serving an old bundle, or a build that did not rerun. Hard reload with the cache disabled before you debug for an hour.",
        "**The value is being overwritten by JavaScript.** A component that writes `el.style.width` each render will beat any normal rule you write, permanently."
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
          "title": "Confirm the selector matches the element you are inspecting",
          "x": "Run the selector against the document, then test the specific element. If either comes back empty or false, stop and fix the selector. Nothing further in this list applies.",
          "code": "document.querySelectorAll('.card .title').length\n$0.matches('.card .title')"
        },
        {
          "title": "Read the Styles pane from the top",
          "x": "DevTools lists matching rules in cascade order, strongest first, with losing declarations struck through. The rule immediately above your struck-through declaration is the one beating it. Read its selector and its file, and check whether the difference is specificity, a layer, an inline style or plain source order."
        },
        {
          "title": "Cross-check with the Computed pane",
          "x": "Expand the property in the Computed tab. It shows the winning value and a link straight to the rule that produced it, which is faster than scrolling the Styles pane on a heavily styled element."
        },
        {
          "title": "Rule out an invalid declaration",
          "x": "Look for the warning icon next to the property. If the declaration is greyed out or marked invalid, the value is the problem, not the cascade. Retyping the value in DevTools and watching whether it takes effect is the quickest confirmation."
        },
        {
          "title": "Change the cascade, deliberately",
          "x": "Prefer a layer or a slightly more specific selector that reflects real structure. If you need more weight without inventing an ID, repeating a class is the standard trick and stays readable.",
          "code": "/* Preferred: state the order once and stop fighting */\n@layer framework, app;\n\n/* Escape hatch: (0,2,0) without touching the markup */\n.btn.btn { padding-inline: 1rem; }\n\n/* Lower a selector's weight so others can override it */\n:where(.theme-dark) .btn { color: white; }"
        }
      ]
    },
    {
      "t": "p",
      "x": "One quick sanity check worth keeping in your snippets: apply an obnoxious `outline: 3px solid magenta !important` to the selector in question. If no outline appears anywhere on the page, the selector does not match, and you have saved yourself from debugging a cascade that was never involved."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout module fits which problem, and the sizing traps in both.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same shape of bug in JavaScript: the value you set is not the value you see.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check whether the selector matches before assuming it lost a specificity contest. Run document.querySelectorAll('your selector').length in the console. A zero means the problem is the selector, the markup, a hashed class name from CSS Modules, or a stylesheet that never loaded. Only if the rule appears in the Styles pane, struck through, is the cascade actually involved."
        },
        {
          "q": "Does an ID always beat a class in CSS?",
          "a": "Between two author rules with no layers and no !important, yes. Specificity compares ID count first, so (1,0,0) beats (0,11,0). But specificity is only the fifth tiebreak. A class rule in a later cascade layer, an inline style, or an !important declaration all beat an ID selector before specificity is ever consulted."
        },
        {
          "q": "Is it ever OK to use !important?",
          "a": "Yes, in narrow cases. Overriding inline styles written by a third-party script is the clearest one, because nothing else in a stylesheet can beat a style attribute. Print stylesheets and user accessibility stylesheets are others. What causes trouble is reaching for it before you have identified which rule is winning, since that starts an escalation you cannot easily unwind."
        },
        {
          "q": "How do I override a framework stylesheet without !important?",
          "a": "Put the framework in a cascade layer and your own CSS in a later one, or leave your own CSS unlayered, since unlayered normal styles beat every layer. If the framework does not support being wrapped, importing it with @import url(framework.css) layer(framework) achieves the same thing. Failing that, doubling a class such as .btn.btn raises specificity without adding an ID."
        },
        {
          "q": "Why did my rule stop working after I wrapped it in @layer?",
          "a": "Because unlayered normal declarations beat every layer. Moving a rule into a layer weakens it relative to any rule still outside one. Either move everything into layers or keep your highest-priority overrides unlayered on purpose."
        },
        {
          "q": "How do I calculate specificity for :is, :has and :not?",
          "a": ":is(), :not() and :has() all take the specificity of their most specific argument, so :is(#main, .card) counts as one ID. :where() always contributes zero regardless of its contents. The universal selector and combinators contribute nothing at all."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-08-31",
  "updated": "2026-08-31",
  "author": "jackson",
  "related": []
};
