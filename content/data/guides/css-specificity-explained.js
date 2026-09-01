module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important",
  "eyebrow": "CSS",
  "description": "Work out why a CSS declaration loses: read DevTools first, then check origin, layers, specificity and source order in the order the browser uses.",
  "standfirst": "A declaration that does nothing is either not matching, not valid, or losing a comparison. Here is how to tell which, and how to fix it without starting a specificity arms race.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "important css",
    "css cascade order"
  ],
  "cardDesc": "Read the cascade in the order the browser does: origin, layers, specificity, then source order.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check DevTools before theorising. A **struck-through** declaration lost a comparison. A **missing** declaration never matched, or was thrown away as invalid.",
        "Specificity is compared as three separate columns, `(id, class, type)`, with no carrying. Eleven classes never beat one id.",
        "Cascade layers are checked **before** specificity, so a low-specificity rule in a later layer beats a high-specificity rule in an earlier one.",
        "`!important` reverses layer order and origin order. That is why it feels unpredictable in a codebase that mixes libraries.",
        "Plenty of rules that look ignored are simply invalid, unmatched, or overwritten by a shorthand further down the file."
      ]
    },
    {
      "t": "lede",
      "x": "Start with the element, not the stylesheet. Select it in the Elements panel, read the Styles pane from the top, and find your declaration. What you see there splits the problem into three cases, and each one has a different fix."
    },
    {
      "t": "h2",
      "x": "Three things DevTools can tell you in ten seconds"
    },
    {
      "t": "p",
      "x": "**If the declaration is struck through, it lost the cascade.** Something else won, and the pane shows you what: scroll up, because the winner is always above the loser in the Styles list. This is the only case where specificity, layers and `!important` are worth thinking about."
    },
    {
      "t": "p",
      "x": "**If the declaration is not struck through but the element still looks wrong, you are probably looking at the wrong property or the wrong element.** A `color` that applies correctly can be invisible because a child sets its own. Switch to the Computed tab, expand the property, and follow the link back to the rule that produced the final value. Computed answers the question directly, which the Styles pane does not always do."
    },
    {
      "t": "p",
      "x": "**If the rule is not in the pane at all, the selector never matched or the declaration was discarded.** Chrome flags discarded declarations with a warning icon and the tooltip `Invalid property value`, and it hides declarations whose property name it does not recognise at all. Firefox marks them in its own way. One typo in a value takes that whole declaration out while the rest of the block keeps working, which is why the failure looks so selective."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A faster way to confirm the selector matches",
      "x": "Run `document.querySelectorAll('.card > .title').length` in the console. Zero means the problem is your selector or your markup, and no amount of `!important` will help. This catches class names that a build step renames, which is common with CSS Modules and most styled-component libraries."
    },
    {
      "t": "h2",
      "x": "The order the browser actually resolves in"
    },
    {
      "t": "p",
      "x": "Specificity is not the first thing checked. It is roughly the fifth. When two declarations set the same property on the same element, the browser works down this list and stops at the first step that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Normal author styles beat normal user styles, which beat browser defaults. For `!important` declarations the order flips: an important user style beats an important author style, and an important browser default beats both.",
        "**Context.** Styles inside a shadow tree and styles outside it are ranked before anything about the selectors is considered.",
        "**Element-attached styles.** A `style` attribute beats any normal declaration from a stylesheet, whatever its selector.",
        "**Cascade layers.** Later layers beat earlier ones, and unlayered styles beat every layer. Important declarations reverse all of that.",
        "**Specificity.** Only now does the `(id, class, type)` comparison happen.",
        "**Order of appearance.** Whichever declaration comes last wins."
      ]
    },
    {
      "t": "p",
      "x": "Reading in that order explains most of the surprises. A carefully targeted `#sidebar .promo h2` still loses to a bare `h2` if the `h2` sits in a later layer, because layers are resolved two steps earlier. The specificity comparison is never reached."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Transitions and animations sit above all of it",
      "x": "Per the cascade specification, a declaration produced by a running transition outranks everything, including `!important` author styles, while the transition is in flight. Animations sit above normal author declarations but below important ones. If a value is briefly correct and then reverts, look for a transition or a keyframe before you look at specificity."
    },
    {
      "t": "h2",
      "x": "How specificity is counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is three numbers. Count id selectors, then class selectors along with attribute selectors and pseudo-classes, then type selectors and pseudo-elements. Compare the first column. If it ties, compare the second. If that ties, compare the third. The columns never carry, so `(0,11,0)` loses to `(1,0,0)` and it is not close."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "id",
        "class",
        "type"
      ],
      "rows": [
        [
          "`*`",
          "0",
          "0",
          "0"
        ],
        [
          "`li`",
          "0",
          "0",
          "1"
        ],
        [
          "`ul li`",
          "0",
          "0",
          "2"
        ],
        [
          "`li::marker`",
          "0",
          "0",
          "2"
        ],
        [
          "`.nav`",
          "0",
          "1",
          "0"
        ],
        [
          "`[type=\"text\"]`",
          "0",
          "1",
          "0"
        ],
        [
          "`a:hover`",
          "0",
          "1",
          "1"
        ],
        [
          "`input:not(.plain)`",
          "0",
          "1",
          "1"
        ],
        [
          "`#main`",
          "1",
          "0",
          "0"
        ],
        [
          "`#main .nav a`",
          "1",
          "1",
          "1"
        ],
        [
          "`:is(#main, .side) a`",
          "1",
          "0",
          "1"
        ],
        [
          "`:where(#main) .nav`",
          "0",
          "1",
          "0"
        ]
      ],
      "caption": "Specificity of common selectors. The last two rows are the interesting ones."
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` take the specificity of their most specific argument, which makes them easy to underestimate. Put a single id inside a long `:is()` list and the entire selector jumps a column. `:where()` is the escape hatch. It always contributes zero, so its arguments still match but add no weight."
    },
    {
      "t": "p",
      "x": "Native CSS nesting behaves like `:is()` around the parent selector, so a nested rule inherits the specificity of the most specific selector in the parent list. Worth knowing before you nest a component under a selector list that happens to contain an id."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Specificity (0,1,0) despite the id, so a consumer can override it\n   with a single class and no !important. */\n:where(#app, .app) .button {\n  background: var(--button-bg, #2b6cb0);\n}\n\n/* Specificity (0,1,0). Wins on source order alone. */\n.button--ghost {\n  background: transparent;\n}"
    },
    {
      "t": "p",
      "x": "Wrapping the high-specificity part of a selector in `:where()` is the most useful single trick here. Defaults stay easy to override, and you avoid teaching everyone who uses the stylesheet a private rule about where their overrides have to live."
    },
    {
      "t": "h2",
      "x": "Cascade layers rearrange the whole comparison"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare priority explicitly rather than encoding it in selector weight. Declare the order once, at the top of the entry stylesheet, and every rule assigned to a layer inherits that ranking regardless of how it is written."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, vendor, base, components, utilities;\n\n@import url(\"normalize.css\") layer(reset);\n@import url(\"vendor-widget.css\") layer(vendor);\n\n@layer components {\n  #page .card .card__title { font-size: 1.125rem; }  /* (1,2,0) */\n}\n\n@layer utilities {\n  .text-sm { font-size: 0.875rem; }                  /* (0,1,0), and it wins */\n}"
    },
    {
      "t": "p",
      "x": "The `utilities` rule wins because its layer comes later, and layers are compared before specificity. That is how a utility library can be made to work reliably against a component library without a single `!important`."
    },
    {
      "t": "p",
      "x": "Two behaviours catch people out. Unlayered styles beat all layered styles for normal declarations, so one stray rule outside any layer quietly outranks the stack you spent an afternoon ordering. And `!important` reverses layer order completely: an important declaration in `reset` beats an important declaration in `utilities`, while an important unlayered declaration becomes the weakest important author style of all. Layers shipped in Chrome, Firefox, Safari and Edge during the first half of 2022, so current versions all support them. Check caniuse against the browsers your project still targets."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layer order is fixed by first mention",
      "x": "The first time a layer name appears, its position is set. Writing `@layer utilities;` again later does not move it to the end. Keep one ordering statement at the top of the entry file, and never let import order decide priority implicitly."
    },
    {
      "t": "h2",
      "x": "!important, and the cases where it is the right answer"
    },
    {
      "t": "p",
      "x": "`!important` is not a specificity value. It moves the declaration into a different bucket, and buckets are compared before layers or selectors are looked at. Two important declarations from the same origin are then compared by the usual rules, with layer order reversed."
    },
    {
      "t": "p",
      "x": "The honest uses are narrow. Overriding a third-party widget that writes inline styles you cannot edit, since a `style` attribute beats every normal stylesheet declaration. User stylesheets and accessibility overrides, where the origin rules mean important user styles are meant to win. Print stylesheets that must force a background off. Utility classes that deliberately sit at the end of the chain, although cascade layers now do that job with fewer side effects."
    },
    {
      "t": "p",
      "x": "The cost is that you have removed a rung from your own ladder. The next override needs `!important` plus higher specificity, and the one after that needs an id as well. Teams end up with important declarations scattered through the codebase and no way to reason about any of them. If you add one, say in a comment what it is fighting and when you checked, so somebody can delete it later with confidence."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Fights inline styles injected by chat-widget v3.\n   Record the version and the date you checked it here.\n   Remove once the widget stops setting style=\"z-index\". */\n#chat-widget-container {\n  z-index: 40 !important;\n}"
    },
    {
      "t": "h2",
      "x": "When specificity is not the problem at all"
    },
    {
      "t": "p",
      "x": "A good share of rules that appear ignored never entered the competition. Rule these out first."
    },
    {
      "t": "ul",
      "items": [
        "**The declaration is invalid and was dropped.** `width: 100px 0` or `color: #ff00zz` is discarded at parse time. The rest of the block still applies, so the failure looks partial and arbitrary.",
        "**A shorthand later in the file reset your longhand.** `background: red` clears `background-image`. `font: 16px/1.5 system-ui` resets `font-weight`. Order inside a single file matters more than people expect.",
        "**The property does not inherit.** `border` and `padding` do not pass to children. Setting them on a wrapper does nothing to the text inside it.",
        "**A custom property resolved to something invalid.** When `var()` substitution produces a value the property cannot use, the declaration is invalid at computed-value time and falls back to `inherit` for inherited properties or `initial` for the rest. DevTools shows the declaration as perfectly valid, which makes this one slow to spot.",
        "**The element is not the one you are styling.** A framework renders an extra wrapper, a portal moves the node out of your subtree, or the class is applied conditionally and the condition is false.",
        "**The stylesheets loaded in a different order than you assumed.** Bundlers, `@import` inside a module and route-level code splitting all reorder things. Equal specificity is decided by source order, and source order at runtime is not always source order in your repo.",
        "**A media or container query is not matching.** Confirm the condition in DevTools instead of trusting the breakpoint.",
        "**A shadow DOM boundary is in the way.** Outside styles do not cross into a shadow tree except through inherited properties, custom properties, and whatever the component exposes with `::part()`."
      ]
    },
    {
      "t": "h2",
      "x": "A repeatable way to fix it"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "Console first. Zero matches means the fix is in the markup or the selector, and every cascade question after that is wasted effort.",
          "code": "document.querySelectorAll('.card > .title').length"
        },
        {
          "title": "Read the computed value and its source",
          "x": "The Computed tab names the exact rule that won. Compare its origin, layer and selector against yours before you change anything."
        },
        {
          "title": "Ask whether a layer decided it",
          "x": "If the winner is in a later layer, or is unlayered while yours is layered, specificity was never consulted. Move your rule into the right layer instead of strengthening the selector."
        },
        {
          "title": "Match, then add one step",
          "x": "If specificity really is the tiebreak, the cheapest fix is equal specificity plus later source order. Repeat your own class to add exactly one column when you need slightly more.",
          "code": ".button.button { /* (0,2,0), no id, no !important */ }"
        },
        {
          "title": "Lower the incumbent instead of raising yourself",
          "x": "If you own the losing rule, wrap its over-specific part in `:where()` and drop it to zero. That fixes the problem once for every future override rather than one override at a time.",
          "code": ":where(#app) .card { padding: 1rem; }   /* was #app .card */"
        },
        {
          "title": "Leave a note if you used !important",
          "x": "Record what it overrides and the version you checked against. It becomes deletable rather than permanent."
        }
      ]
    },
    {
      "t": "p",
      "x": "One structural point to close on. Specificity problems compound because a codebase has no agreed priority order, so each developer encodes their own priority in selectors. Cascade layers give that decision somewhere to live. Declare five or six layers, put third-party CSS low in the order and utilities at the top, and most of the daily fights stop happening on their own. `@scope` adds a proximity rule on top of this and is genuinely useful for component boundaries, but its support is newer and uneven, so check it against your targets before it becomes load-bearing."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the right layout module before you start fighting the cascade.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "Colour contrast checker",
          "desc": "Check the contrast ratio of the colour that actually won.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState not updating",
          "desc": "The same problem one layer up: the class you expected never rendered.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check three things in order. Does the selector match anything, tested with `document.querySelectorAll()` in the console? Is the declaration present in the Styles pane, or was it dropped as invalid? Is it struck through, meaning something won on layer, specificity or source order? Only the third case is a cascade problem, and it is the least common of the three."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "Yes. A `style` attribute beats any normal declaration from a stylesheet, but an important declaration in an author stylesheet beats a normal inline style. An important declaration inside the `style` attribute beats that in turn. This is the strongest argument for using `!important` against third-party widgets that write inline styles you cannot edit."
        },
        {
          "q": "Is a rule with 11 classes stronger than one with an id?",
          "a": "No. The three columns are compared one at a time and never carry, so `(0,11,0)` loses to `(1,0,0)` on the first comparison. This is a deliberate design decision rather than a browser quirk, and it behaves the same way in every engine."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Layers are compared before specificity, so yes: a single class in a later layer beats an id selector in an earlier one. Two exceptions matter. Unlayered styles outrank all layered styles for normal declarations, and `!important` reverses the layer order entirely."
        },
        {
          "q": "How do I override a style without using !important?",
          "a": "Match the winner's specificity and place your rule later, or move it into a later layer. If you need slightly more weight, repeat a class (`.btn.btn`) instead of reaching for an id. If you own the rule that keeps winning, the better fix is to wrap its high-specificity part in `:where()` so it stops outranking everyone."
        },
        {
          "q": "Why does my style work and then disappear a moment later?",
          "a": "Look for a transition, an animation, or JavaScript writing to the `style` attribute. Transition and animation declarations sit above normal author styles in the cascade, and a running transition outranks even `!important`. The Animations panel in DevTools, or a quick look at `element.style` in the console, usually settles it."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-01",
  "updated": "2026-09-01",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
