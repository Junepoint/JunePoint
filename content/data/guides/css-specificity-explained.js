module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Your CSS rule is not applying: read the cascade in order",
  "eyebrow": "Fundamentals",
  "description": "Specificity is only one step in the CSS cascade. Work through matching, origin, layers, specificity and source order to find out why your rule loses.",
  "standfirst": "The browser resolves conflicting declarations in a fixed order, and specificity sits fifth in that order. Check the earlier steps first, because inline styles and !important beat any selector you can write.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "important css",
    "specificity calculation"
  ],
  "cardDesc": "Specificity, cascade layers, inline styles and !important, in the order the browser actually checks them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before you touch specificity, confirm the selector matches. A rule that does not match the element is absent from the DevTools Styles pane; a rule that matches but loses is shown with a line through it. Those two symptoms have completely different fixes.",
        "Specificity is step five of seven. Origin and importance, encapsulation context, element-attached styles and cascade layers are all compared before it, which is how a single type selector can beat a chain of classes.",
        "Specificity is three independent counters written `A-B-C`: IDs, then classes, attributes and pseudo-classes, then element types and pseudo-elements. They never carry. Eleven classes (`0-11-0`) lose to one ID (`1-0-0`).",
        "Cascade layers invert for important declarations. Normal: unlayered beats layered, and later layers beat earlier ones. Important: the earliest layer wins, and unlayered important styles come last.",
        "`!important` is a fight you have to keep winning. `@layer`, `:where()` and `revert-layer` solve the same problems without the escalation."
      ]
    },
    {
      "t": "h2",
      "x": "First: is the rule matching at all?"
    },
    {
      "t": "p",
      "x": "Most \"specificity problems\" are not specificity problems. The rule never applied to the element in the first place, and no amount of added selectors will change that. Rule out the boring causes before you start counting."
    },
    {
      "t": "ul",
      "items": [
        "**The selector describes a DOM that does not exist.** `.card > .title` fails the moment a framework wraps the title in another element. `>` and `+` are the fragile ones.",
        "**The stylesheet is not loaded, or an older copy is.** Check the Network panel and the Sources panel, not the file on disk. A cached bundle and a stale build output look identical from the editor.",
        "**The declaration is invalid and was dropped at parse time.** One typo in a property name or value, and the browser discards that declaration silently. Both Chrome and Firefox DevTools mark it with a warning icon.",
        "**An `@media`, `@supports` or `@container` condition is false.** The rule is in the file, parsed, and inert.",
        "**The property does not apply to that element.** `width` on a non-replaced inline element does nothing. Neither does `gap` outside a flex, grid or multi-column container, or `z-index` on a statically positioned box.",
        "**Scoping is keeping you out.** A declaration in the document cannot reach inside a shadow root unless the component exposes a part or a custom property."
      ]
    },
    {
      "t": "p",
      "x": "The Styles pane is the fastest discriminator here. Select the element, then look for your selector. If it is not in the list, the selector does not match and you have a selector bug. If it is in the list with the declaration struck through, it matched and lost, and the rest of this article applies."
    },
    {
      "t": "h2",
      "x": "The order the browser actually checks"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the cascade compares them one criterion at a time. The first criterion that differs decides it, and nothing further down is consulted. Specificity is a long way down the list."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What it compares",
        "Why it bites"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "User agent, user and author styles, each split into normal and important",
          "An author `!important` outranks every normal declaration regardless of selector"
        ],
        [
          "2. Encapsulation context",
          "Shadow DOM boundaries",
          "For normal declarations the outer context wins; for important declarations the inner one does"
        ],
        [
          "3. Element-attached styles",
          "A `style` attribute versus anything in a stylesheet",
          "Inline styles are not \"infinite specificity\". They win at an earlier step, which is why a stylesheet `!important` still beats them"
        ],
        [
          "4. Cascade layers",
          "Which `@layer` the declaration is in",
          "A one-type selector in a later layer beats a five-class selector in an earlier one"
        ],
        [
          "5. Specificity",
          "The `A-B-C` counters",
          "The step everyone reaches for first"
        ],
        [
          "6. Scoping proximity",
          "Distance to the nearest `@scope` root",
          "Newer and unevenly supported; verify on caniuse before relying on it"
        ],
        [
          "7. Order of appearance",
          "Which declaration comes last",
          "The final tiebreak, and the one your bundler quietly controls"
        ]
      ],
      "caption": "The cascade, highest-priority criterion first. The first difference wins."
    },
    {
      "t": "p",
      "x": "Step one deserves spelling out, because the important variants are not simply \"on top\". They are interleaved, and the user and user-agent origins reverse."
    },
    {
      "t": "code",
      "lang": "text",
      "x": "Wins\n  ^   transition declarations\n  |   !important  user-agent styles\n  |   !important  user styles          (browser accessibility settings)\n  |   !important  author styles        (your stylesheet)\n  |   animation declarations           (@keyframes, while running)\n  |   normal      author styles\n  |   normal      user styles\n  v   normal      user-agent styles\nLoses"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Animations and transitions are not selectors",
      "x": "A running `@keyframes` animation overrides every normal author declaration, no matter how specific, and an in-flight transition overrides even `!important`. If a value is correct until something hovers or mounts and then snaps back, stop counting selectors and look for a `transition` or an `animation` on that property."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Three counters, compared left to right: IDs, then class-level selectors, then type-level selectors. Class-level covers classes, attribute selectors and pseudo-classes. Type-level covers element names and pseudo-elements. Universal selectors and combinators contribute nothing."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0-0-1 */   p { }\n/* 0-0-2 */   ul li { }\n/* 0-1-0 */   .intro { }\n/* 0-1-0 */   [data-theme=\"dark\"] { }        /* attributes count as class-level */\n/* 0-1-0 */   :hover { }\n/* 0-1-1 */   p.intro { }\n/* 0-1-1 */   .card::before { }              /* pseudo-ELEMENT is type-level */\n/* 1-0-0 */   #main { }\n/* 0-1-0 */   [id=\"main\"] { }                /* same element, very different weight */\n/* 0-0-1 */   * > p { }                      /* * and > add nothing */"
    },
    {
      "t": "p",
      "x": "The counters are independent. There is no carry, no base 10, no total. A selector with eleven classes scores `0-11-0`, and it loses to a single ID at `1-0-0` because the first column already differs. This is the single most common miscalculation, and it is why \"just add another class\" sometimes does nothing at all."
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes are where modern CSS gets interesting. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument. `:where()` always contributes zero, whatever is inside it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1-0-1 : :is() takes its heaviest argument (#main), plus h2 */\n:is(#main, .card) h2 { margin: 0; }\n\n/* 0-0-1 : :where() zeroes its contents, so only h2 counts */\n:where(#main, .card) h2 { margin: 0; }\n\n/* 1-0-0 : :not() is not free */\n:not(#sidebar) { }\n\n/* 0-1-0 : the argument's weight is what matters, not the function */\n:has(> .badge) { }\n\n/* Nesting: & behaves like :is() of the parent selector list,\n   so this is 1-0-1, not 0-0-2. */\n#main, article {\n  & h2 { margin: 0; }\n}"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Use :where() for anything you expect to be overridden",
      "x": "Reset rules, base typography and library defaults are all better written with zero specificity. `:where(h1, h2, h3) { margin-block: 0; }` can be overridden by a single class, forever, without anyone having to match your selector shape. The cost is that you cannot win a fight later, which is exactly the point."
    },
    {
      "t": "h2",
      "x": "Cascade layers, and why they invert"
    },
    {
      "t": "p",
      "x": "`@layer` moved the hardest part of this problem out of selector golf and into one declaration at the top of your stylesheet. Layer order is decided by the order the layer names are first seen, not by where the rules live, so one `@layer` statement sets the priority of your whole codebase."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. Later layers win for normal rules. */\n@layer reset, vendor, base, components, utilities;\n\n@layer vendor {\n  /* A third-party selector you cannot edit */\n  #widget .btn.btn-primary { background: rebeccapurple; }  /* 1-2-0 */\n}\n\n@layer components {\n  /* Wins on layer order. Specificity is never consulted. */\n  .btn { background: var(--brand); }                        /* 0-1-0 */\n}\n\n/* Unlayered normal declarations beat every layer. Use this\n   sparingly: it is the new equivalent of leaning on !important. */\n.btn { background: hotpink; }"
    },
    {
      "t": "p",
      "x": "Two rules about layers catch people out. First, unlayered normal declarations have higher priority than any layer, which is the opposite of what most developers assume on day one. Second, the entire layer order reverses for important declarations: an `!important` in the first layer beats an `!important` in the last, and unlayered important declarations rank below all layered ones."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Check how your tooling emits layers",
      "x": "Build tools increasingly emit native `@layer` blocks of their own, and a framework's layer names participate in the same ordering as yours. If overrides stop behaving the way the source suggests, read the generated CSS rather than the source, and look for where each layer name appears first. Layer order is global to the document, so an `@import` that introduces a name early pins it early."
    },
    {
      "t": "p",
      "x": "Cascade layers have been supported across Chrome, Firefox, Safari and Edge since early 2022. That is long enough to use them without a fallback in most projects, but confirm against your own browser support target rather than taking a date from an article."
    },
    {
      "t": "h2",
      "x": "!important, and the things that replace it"
    },
    {
      "t": "p",
      "x": "`!important` works. That is the problem. It wins at step one, so it ends the argument instantly, and the next person who needs to override your rule has exactly one tool available: another `!important`, this time with a heavier selector. Specificity wars are annoying. Importance wars are unwinnable, because the tiebreak between two important author declarations falls back to layers, then specificity, then source order, and source order in a bundle is not something you control from the file you are editing."
    },
    {
      "t": "p",
      "x": "Reach for these first."
    },
    {
      "t": "ul",
      "items": [
        "**Put the thing you want to lose into a layer.** `@layer vendor` around an imported stylesheet makes every one of its rules overridable by a plain class, whatever its selectors look like.",
        "**Lower your own weight with `:where()`.** Most of the time the fix is to make the existing rule weaker, not the new rule stronger.",
        "**Use `revert-layer` to step back one level.** `color: revert-layer` rolls the property back to the value it would have had from earlier layers, which is a precise way to undo a component default inside one context.",
        "**Use `revert` to go back to the user-agent or user value.** Useful inside a reset, and clearer than hardcoding `margin: 0` on everything.",
        "**Scope with a wrapper class, not an ID.** `.theme-compact .btn` is `0-2-0` and easy to live with. `#app .btn` is `1-1-0` and drags every future override up with it."
      ]
    },
    {
      "t": "p",
      "x": "There are two honest uses left for `!important`. One is a utility class whose whole job is to win, such as a visually-hidden or a print-only helper, and even then a late cascade layer usually does the job. The other is a one-line fix in production while the real change goes through review. Leave a comment saying which it is."
    },
    {
      "t": "h2",
      "x": "Look-alikes that are not specificity"
    },
    {
      "t": "p",
      "x": "When the Styles pane shows your declaration as the winner and the element still looks wrong, the conflict is somewhere else entirely."
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand later in the cascade.** `background: red` resets `background-image`. `font: 16px/1.5 system-ui` resets `font-weight`. The longhand did not lose a specificity contest; it was overwritten by a shorthand that sets it to its initial value.",
        "**Inheritance is not the cascade.** An inherited `color` on the parent cannot override a rule that targets the child directly, however weak that child rule is. The cascade runs per element, and only then does inheritance fill in what nothing set.",
        "**The value is being set by JavaScript.** `element.style.color = ...` writes an inline style, which wins at step three. In the Styles pane it appears as `element.style`.",
        "**Two custom property definitions.** Custom properties cascade like any other property, so the winner is resolved on the element where the `var()` is used, following the same seven steps.",
        "**Source order inside a bundle.** When specificity ties, the last declaration wins, and \"last\" is decided by import order, chunk order and CSS module output. This is why the same two files can behave differently in development and in a production build.",
        "**The browser never got the property.** An unknown property, an unsupported value or a unit typo makes the declaration invalid at parse time. It will not appear in the Computed pane at all."
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
          "title": "Select the element and find your selector in the Styles pane",
          "x": "Not listed means it does not match, so fix the selector. Listed and struck through means it matched and lost, so continue. This one check separates the two halves of the problem and takes five seconds."
        },
        {
          "title": "Open the Computed pane and expand the property",
          "x": "This lists every declaration that set the property, winner first, each linked to its source. You will usually see the culprit immediately, and if the winner is `element.style` you are looking for JavaScript, not CSS."
        },
        {
          "title": "Walk the seven steps against the winner",
          "x": "Compare importance, then inline, then layer, then specificity, then order. Stop at the first difference. The following declarations are in ascending order of priority, and only the last pair is decided by selectors at all.",
          "code": "/* 1. loses: normal, unlayered, 1-1-0 */\n#app .btn { color: red; }\n\n/* 2. wins over 1: important beats normal, even at 0-0-1 */\nbutton { color: blue !important; }\n\n/* 3. wins over 2: important author, earlier layer */\n@layer a { .btn { color: green !important; } }\n@layer b { .btn { color: pink  !important; } }"
        },
        {
          "title": "Fix it at the level where it broke",
          "x": "Lost on layers? Move a layer, do not add a class. Lost on specificity? Lower the winner with `:where()` before you raise the loser. Lost on source order with equal specificity? That is a tooling question, and adding selectors will only mask it until the next build."
        },
        {
          "title": "Leave the codebase one step calmer",
          "x": "A working fix that adds an ID or an `!important` has bought today's result with next quarter's debugging. Deleting one unnecessary ID selector is often worth more than any override you could write."
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Four usual reasons. Something else also uses `!important` and beats you on layer order, specificity or source order. An in-flight CSS transition is overriding the property, which outranks even important declarations. The declaration is invalid and was dropped, so check for a warning icon next to it in DevTools. Or the rule never matched the element, in which case `!important` changes nothing. Confirm which by expanding the property in the Computed pane and reading the list of contributors."
        },
        {
          "q": "Does an inline style override !important?",
          "a": "No. Importance is compared before element-attached styles, so a stylesheet rule with `!important` beats a normal `style` attribute. An inline style with its own `!important` is a different matter: both declarations are then important author declarations, so the cascade moves on to the element-attached step and the inline one wins. That combination is effectively unoverridable from CSS, which is a good reason not to write it."
        },
        {
          "q": "How many classes equal an ID in CSS?",
          "a": "None. The three specificity counters are compared independently from left to right and never carry, so `0-256-0` still loses to `1-0-0`. The old folklore about 256 classes equalling an ID came from browsers that once stored specificity in fixed-width fields. That behaviour is long gone, and it was a bug even then."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, layers are compared first. A `.btn` rule in a later layer beats `#widget .btn.btn-primary` in an earlier one, and the specificity numbers are never looked at. Specificity still decides conflicts within a single layer. Note that unlayered normal declarations outrank every layer, and that the whole layer order reverses for `!important` declarations."
        },
        {
          "q": "Why does DevTools show my CSS crossed out?",
          "a": "A line through a declaration means it matched the element but something else won the cascade for that property, or a later shorthand reset it. It does not mean the selector is broken. Click through to the Computed pane to see which declaration took priority and where it came from. A declaration with a warning triangle instead is a different failure: that one is invalid and was never in the running."
        },
        {
          "q": "How do I override a third-party stylesheet without !important?",
          "a": "Wrap the import in a layer and declare that layer first: `@layer vendor, app;` then `@import url(\"vendor.css\") layer(vendor);`. Every rule in that file now loses to anything in `app`, regardless of how many IDs its selectors use. If you cannot change how the file is loaded, the next best option is a single wrapper class on a container plus your normal component selectors, which raises your specificity by one class rather than committing you to an importance war."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Pick the layout model first, then the properties. Half of all specificity fights start as layout fights.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Fundamentals"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check the computed foreground and background you actually ended up with against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "How to Diagnose and Fix CORS Errors",
          "desc": "Another problem where the browser is reporting a rule you did not write. Same debugging discipline, different layer.",
          "href": "/guides/fix-cors-errors/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-17",
  "updated": "2026-11-17",
  "author": "jackson",
  "related": []
};
