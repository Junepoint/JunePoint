module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity and Why Your Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "How CSS specificity is really counted, where cascade layers and !important sit in the cascade, and a debugging order for a rule that refuses to take effect.",
  "standfirst": "Specificity is three numbers compared in order, and it is only the fourth thing the cascade looks at. Here is what the browser checks first, and how to find the declaration that is beating yours.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculation",
    "css cascade order"
  ],
  "cardDesc": "Count specificity correctly, understand cascade layers and !important, and debug an overridden declaration in order.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers compared in order, not one score. A selector with eleven classes (`0-11-0`) still loses to a single ID (`1-0-0`).",
        "The cascade checks origin and importance first, then cascade layers, then specificity, then source order. When a rule loses, specificity is often not the reason.",
        "A declaration that matches an element directly always beats an inherited value, however specific the ancestor's rule is. This is why `.content { color: #333 }` leaves your links blue.",
        "For normal declarations, later layers win and unlayered styles win over all layers. For `!important` declarations that order is reversed, and unlayered important styles come last.",
        "Before touching specificity, prove the selector matches: `document.querySelectorAll('.card > .title').length` in the console."
      ]
    },
    {
      "t": "h2",
      "x": "First, prove the rule matches anything"
    },
    {
      "t": "p",
      "x": "The most common reason a rule does not apply is that it never entered the competition. Specificity is a tie-breaker between declarations that both match the same element for the same property. If your selector matches nothing, no amount of weight will help, and every minute spent adding classes to it is wasted."
    },
    {
      "t": "p",
      "x": "Ask the document directly. Select the element in the browser's element inspector so that `$0` refers to it, then run three checks in the console:"
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// 1. Does the selector match anything at all?\ndocument.querySelectorAll('.card > .title').length\n\n// 2. Does the selected element match it specifically?\n$0.matches('.card > .title')\n\n// 3. What value did the browser actually settle on?\ngetComputedStyle($0).color"
    },
    {
      "t": "p",
      "x": "A length of `0` means the selector is wrong, the markup is different from what you remember, or the element is created later by a script. A `false` from `matches()` on a selector that does match other elements usually means a direct-child combinator where you wanted a descendant, or a class that is applied to a wrapper rather than the node you are inspecting."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The Styles pane tells you which of the two problems you have",
      "x": "A rule that matches the element appears in the Styles pane, with overridden declarations struck through. A rule that does not match does not appear at all. Struck through means a cascade problem. Absent means a selector problem. Those two take completely different fixes, and this is the fastest way to tell them apart."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a tuple of three counts. Written as `a-b-c`, they are:"
    },
    {
      "t": "ul",
      "items": [
        "`a`: the number of ID selectors (`#main`)",
        "`b`: the number of class selectors (`.btn`), attribute selectors (`[type=\"text\"]`) and pseudo-classes (`:hover`, `:nth-child()`)",
        "`c`: the number of type selectors (`div`, `a`) and pseudo-elements (`::before`)"
      ]
    },
    {
      "t": "p",
      "x": "The comparison is lexicographic. Compare `a`. If the `a` values differ, you are done. Only on a tie do you look at `b`, and only on another tie do you look at `c`. The older explanation that treats specificity as a base-10 number with weights of 100, 10 and 1 gives the right answer for ordinary selectors and the wrong answer as soon as counts climb, because there is no carrying between columns."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#sidebar a.active        { }  /* 1-1-1 */\nnav ul li a              { }  /* 0-0-4 */\n.theme-dark .btn:hover   { }  /* 0-3-0 */\ninput[type=\"text\"]       { }  /* 0-1-1 */\nli::before               { }  /* 0-0-2 */\na:not(.external)         { }  /* 0-1-1 */\na:is(#home, .nav)        { }  /* 1-0-1 */\na:where(#home, .nav)     { }  /* 0-0-1 */\n* > .card                { }  /* 0-1-0 */"
    },
    {
      "t": "p",
      "x": "Three of those lines are worth sitting with. `:not()`, `:is()` and `:has()` take the specificity of their most specific argument, so `:is(#home, .nav)` contributes a full ID even when the element matched through the class. `:where()` always contributes zero, which makes it the right tool for authoring low-weight defaults that consumers can override without a fight. The universal selector and the combinators (`>`, `+`, `~`, whitespace) contribute nothing, so `* > .card` is just one class."
    },
    {
      "t": "p",
      "x": "Two things people expect to find in the tuple are not in it. An inline `style` attribute has no specificity, because it is sorted at a different stage of the cascade and simply beats every selector you can write. `!important` is not specificity either. It moves a declaration into a different origin band, which is a much bigger move than any selector can make."
    },
    {
      "t": "h2",
      "x": "Specificity is the fourth thing the cascade checks"
    },
    {
      "t": "p",
      "x": "This is the part that resolves most arguments. The cascade sorts declarations through a sequence of tests, and specificity sits well down the list. If two declarations land in different bands above it, their selectors are never compared."
    },
    {
      "t": "table",
      "head": [
        "Priority",
        "Declaration source",
        "Notes"
      ],
      "rows": [
        [
          "1, lowest",
          "Normal user-agent styles",
          "The browser's own defaults, such as its rule for `a` or `h1` margins"
        ],
        [
          "2",
          "Normal user styles",
          "User stylesheets, in practice usually injected by an extension"
        ],
        [
          "3",
          "Normal author styles",
          "Your CSS. Cascade layers, then specificity, then source order are resolved inside this band"
        ],
        [
          "4",
          "Normal inline `style` attribute",
          "Beats any selector in your stylesheets, regardless of how it was written"
        ],
        [
          "5",
          "Animation declarations",
          "A running `@keyframes` animation overrides normal declarations while it is active"
        ],
        [
          "6",
          "`!important` author styles",
          "Layer order is reversed here, see below"
        ],
        [
          "7",
          "`!important` in a `style` attribute",
          "Beats `!important` declarations from your stylesheets"
        ],
        [
          "8",
          "`!important` user styles",
          "Why user-level accessibility overrides are able to win"
        ],
        [
          "9",
          "`!important` user-agent styles",
          "Rare, but it exists"
        ],
        [
          "10, highest",
          "Transition declarations",
          "An in-flight transition wins over everything, `!important` included"
        ]
      ],
      "caption": "Simplified cascade order from CSS Cascading and Inheritance Level 5. Specificity only breaks ties within a single band."
    },
    {
      "t": "p",
      "x": "Read row 5 again if you have ever watched a value flicker back during an animation. Read row 10 if a transition appears to ignore a rule you marked important. Neither is a specificity problem and neither can be fixed by adding another class to the selector."
    },
    {
      "t": "h2",
      "x": "Cascade layers, and the reversal that catches everyone"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare the precedence order of groups of styles up front, independently of where those styles appear in the file or when they load. Declare the order once, in one place, as early as possible:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Order is set by this statement, not by where the blocks appear below */\n@layer reset, vendor, base, components, utilities;\n\n@import url(\"bootstrap.css\") layer(vendor);\n\n@layer components {\n  .btn { color: #1b4; }\n}\n\n@layer base {\n  .btn { color: #333; }   /* loses: base is an earlier layer */\n}\n\n/* Not in any layer. Beats every layer above for normal declarations. */\n.btn { color: #000; }"
    },
    {
      "t": "p",
      "x": "For normal declarations the rule is simple: later layers beat earlier layers, and unlayered styles beat all of them. Layer order is checked before specificity, so a `div.btn` in `base` still loses to a bare `.btn` in `components`. That is the whole point. You get to stop writing defensive selectors."
    },
    {
      "t": "p",
      "x": "Now the surprise. For `!important` declarations the layer order is reversed, and unlayered styles go from first to last:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, theme;\n\n@layer reset {\n  .btn { color: black !important; }\n}\n\n@layer theme {\n  .btn { color: rebeccapurple !important; }\n}\n\n.btn { color: red !important; }\n\n/* Computed colour: black.\n   Among important author declarations, the earliest layer wins,\n   and the unlayered one has the lowest priority of the three.\n   Drop every !important and the result flips to red. */"
    },
    {
      "t": "p",
      "x": "The logic is that a layer you placed early is a layer you consider foundational, so an emergency override inside it should be the hardest thing to displace. Whether or not that matches your intuition, it is the behaviour you will be debugging. If an `!important` in your own stylesheet is losing to one from a vendor file you imported into a layer, this is why."
    },
    {
      "t": "p",
      "x": "`revert-layer` is the companion worth knowing. It discards the current layer's declarations for that property and falls back to the value a previous layer would have produced, which is a cleaner way to opt an element out of a component style than overriding it with something more specific."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support",
      "x": "`@layer` shipped in Chrome, Edge, Firefox and Safari during the first half of 2022, with Safari gaining it in 15.4 (March 2022). Treat those as starting points and check current support data for the browser versions you actually need, since this page does desk research rather than device testing."
    },
    {
      "t": "h2",
      "x": "!important, and the alternatives worth trying first"
    },
    {
      "t": "p",
      "x": "`!important` is not forbidden. It is a tool with one honest use, which is overriding styles you do not control: a third-party widget, an inline style written by a script, a vendor stylesheet you cannot edit. Used there, it is the correct answer and the clearest statement of intent."
    },
    {
      "t": "p",
      "x": "The cost is that it is a one-way door. Once a declaration is important, the only ways past it are another important declaration in a higher band, an earlier layer, an inline important, or a transition. Teams that reach for it casually end up with stylesheets where every override needs one, and then with `!important` on both sides of a conflict, which puts you back to comparing specificity anyway with none of the readability you started with."
    },
    {
      "t": "p",
      "x": "Before you add one, try these in order:"
    },
    {
      "t": "ol",
      "items": [
        "Move the styles you are fighting into an earlier cascade layer. This removes the conflict entirely rather than winning it.",
        "Check source order. Two declarations with identical specificity resolve by position, and that includes the order your bundler concatenated the files in. Reordering an import is often the whole fix.",
        "Match the property more precisely. If a shorthand is clobbering you, set the longhand later, or stop using the shorthand in the broad rule.",
        "Add one more class to the element and the selector, so you win by `0-2-0` against `0-1-0`. Honest, legible, and easy for the next person to beat if they need to.",
        "Use `:is()` deliberately to raise specificity without changing what matches: `:is(.card) .title` reads as a weight adjustment, which is clearer than `.card .card .title`."
      ]
    },
    {
      "t": "h2",
      "x": "Five failures that look like specificity and are not"
    },
    {
      "t": "h3",
      "x": "1. Inheritance losing to a direct match"
    },
    {
      "t": "p",
      "x": "An inherited value is the weakest possible source for a property. Any declaration that matches the element itself beats it, whatever the specificity of the ancestor rule. The browser's own stylesheet has a rule that targets links directly, so setting a colour on a container never reaches them:"
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Links inside .content stay the browser's blue.\n   The UA stylesheet matches the <a> directly; this only inherits. */\n.content { color: #333; }\n\n/* This works, and 0-1-1 is all it takes. */\n.content a { color: #333; }"
    },
    {
      "t": "h3",
      "x": "2. A shorthand resetting your longhand"
    },
    {
      "t": "p",
      "x": "Shorthands set every longhand they cover, including the ones you left out, which go to their initial values. A later `background` declaration silently resets `background-color` to `transparent`. The same trap exists with `font`, `border`, `grid-area`, `flex` and `inset`."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card { background-color: #fff; }\n.card { background: url(\"paper.png\") no-repeat; }\n/* background-color is now transparent, not #fff */"
    },
    {
      "t": "h3",
      "x": "3. A declaration dropped at parse time"
    },
    {
      "t": "p",
      "x": "An invalid value makes the browser discard that declaration and keep going. No console error, no visible trace except that nothing changed. Firefox's inspector flags inactive and invalid declarations with an icon and a short explanation, which is the quickest way to catch this class of typo."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".hero { height: 50 vh; }   /* space breaks the dimension: dropped */\n.hero { color: #ff; }       /* not a valid hex length: dropped */\n.hero { padding: 10px;; }   /* harmless, the empty declaration is ignored */"
    },
    {
      "t": "h3",
      "x": "4. One bad selector killing a whole list"
    },
    {
      "t": "p",
      "x": "In a comma-separated selector list, an unparseable selector invalidates the entire rule, not just that branch. This bites when you use a selector a target browser does not recognise. Wrapping the risky part in `:is()` or `:where()` contains the damage, because both are forgiving selector lists."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* If :unsupported is unknown, h1 and h2 get nothing either */\nh1, h2, h3:unsupported { margin-block: 0; }\n\n/* h1 and h2 still apply; the unknown branch is ignored */\nh1, h2, :is(h3:unsupported) { margin-block: 0; }"
    },
    {
      "t": "h3",
      "x": "5. The property does not apply to that element"
    },
    {
      "t": "p",
      "x": "`width` and `height` have no effect on a non-replaced inline element. `gap` does nothing outside a flex, grid or multi-column container. `z-index` is ignored on a statically positioned element that is not a flex or grid item. In each case the declaration wins the cascade and then does nothing, which looks identical to losing it."
    },
    {
      "t": "h2",
      "x": "A debugging order that holds up"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "Console first, Styles pane second. If the rule is absent from the Styles pane for that element, nothing below this step matters.",
          "code": "document.querySelectorAll('.card > .title').length\n$0.matches('.card > .title')"
        },
        {
          "title": "Find the winner, not your loser",
          "x": "Open the Computed pane, expand the property, and follow the link to the rule that produced the value. This is faster and more reliable than scrolling the Styles list looking for strikethrough, and it names the file and line."
        },
        {
          "title": "Classify the winner",
          "x": "Is it inline? Important? In a layer? An animation or transition? Each of those outranks specificity, and each has a different fix. Chrome and Firefox both show `@layer` membership in the Styles pane."
        },
        {
          "title": "Check the property identity",
          "x": "Confirm the winning declaration is setting the same longhand you are. A shorthand further down the file is a frequent culprit, as is a custom property resolving to something unexpected.",
          "code": "getComputedStyle($0).getPropertyValue('--brand-color')"
        },
        {
          "title": "Fix at the lowest level that works",
          "x": "Layer placement, then source order, then one extra class. Reach for `!important` only against code you cannot edit, and leave a comment saying which third party you are overriding and why."
        }
      ]
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Watch for ID selectors in shared code",
      "x": "A single `#app` in a selector sets `a` to 1 and puts the rule out of reach of any class-based override. In a codebase where several people write CSS, one ID selector in a shared component can force everyone downstream into `!important`. If you need the element-level hook, use an attribute selector such as `[id=\"app\"]`, which matches the same element at `0-1-0`."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check in this order: the selector matches no element, the declaration is being overridden, the declaration was dropped as invalid, or the property does not apply to that element. The Styles pane distinguishes the first two instantly. A rule that does not appear at all is a selector problem; a rule that appears with strikethrough is a cascade problem."
        },
        {
          "q": "Can a class ever beat an ID in CSS?",
          "a": "Not on specificity alone, no matter how many classes you stack, because the ID column is compared before the class column. A class-based declaration can still win by being in a later cascade layer, by being unlayered while the ID rule sits in a layer, by using !important, or by being in an inline style attribute."
        },
        {
          "q": "Is !important bad practice?",
          "a": "It is the right answer for overriding styles you do not control, such as a vendor stylesheet or an inline style set by a script. It becomes a problem inside your own codebase, because the only things that can beat it are another important declaration in a higher band, an earlier cascade layer, an inline important, or a transition. If you need it to win against your own CSS, the cascade is telling you something about the architecture."
        },
        {
          "q": "What is the specificity of :is(), :where() and :not()?",
          "a": ":is(), :not() and :has() take the specificity of their most specific argument, so :is(#home, .nav) contributes a full ID column even when the element matched via the class. :where() always contributes zero, which makes it useful for defaults that you want consumers to override easily."
        },
        {
          "q": "Why does my !important in an unlayered rule lose to one inside a layer?",
          "a": "Because the layer order is reversed for important declarations. Among important author declarations, earlier layers beat later layers, and unlayered styles have the lowest priority of all. Remove !important from both sides and the normal ordering returns, where unlayered styles win."
        },
        {
          "q": "Do cascade layers replace specificity?",
          "a": "No, they sit above it. Layer order is resolved before specificity, so specificity only decides conflicts between declarations within the same layer. In practice that means you write simpler selectors, because you no longer need to out-weight a rule that lives in a lower layer."
        },
        {
          "q": "Why does an animation or transition override my !important rule?",
          "a": "Declarations from an active transition sit at the very top of the cascade and beat important declarations. Animation declarations sit above all normal declarations but below important ones. If a value only looks wrong while something is moving, inspect the transition or @keyframes rather than the selector."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module fits the problem, and the sizing traps in each.",
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
          "desc": "The front-end cousin of this problem: the value is set, and the screen disagrees.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-06",
  "updated": "2026-11-06",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
