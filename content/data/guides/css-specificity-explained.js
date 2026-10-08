module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Your CSS rule is not applying: cascade, specificity, !important",
  "eyebrow": "Guides",
  "description": "Specificity is three numbers, not one, and cascade layers outrank all of them. How to find out which rule actually won, and why.",
  "standfirst": "Most rules that \"do not work\" never matched the element at all. For the ones that did, here is the order the browser resolves them in, and where !important and @layer sit in it.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Work out which CSS rule won and why: matching, the cascade order, specificity weights, @layer and !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check matching before specificity. A rule the browser never applied and a rule that lost a cascade contest look identical in the rendered page but completely different in DevTools.",
        "Specificity is three independent numbers: IDs, then classes/attributes/pseudo-classes, then element types/pseudo-elements. They are compared left to right, so one ID beats eleven classes.",
        "Cascade layers are compared *before* specificity. A `#hero .title` rule in an early layer loses to a `.title` rule in a later one.",
        "For normal declarations, unlayered CSS behaves as the last and strongest layer. For `!important` declarations the whole order flips.",
        "`!important` is not a tie-break inside the normal cascade. It moves the declaration onto a higher rung of the origin ladder.",
        "`:where()` contributes zero specificity. It is the cheapest way to stop an escalation war before it starts."
      ]
    },
    {
      "t": "h2",
      "x": "Rule out the boring causes first"
    },
    {
      "t": "p",
      "x": "Specificity gets blamed for a lot of problems it did not cause. Before you count selectors, open DevTools and look at the Styles pane for the element. If your rule is listed with the property struck through, you have a genuine cascade contest and the rest of this page applies. If your rule is not listed at all, the selector never matched, and no amount of weight will help."
    },
    {
      "t": "p",
      "x": "These are the causes worth eliminating first, roughly in order of how often they turn out to be the answer:"
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** A typo in a BEM class, `>` where you meant a descendant, a class that JavaScript adds after paint, or a hashed class name from CSS Modules that bears no resemblance to what you wrote in the source file.",
        "**The declaration was dropped at parse time.** An invalid value, a misspelled property, a missing unit on a non-zero length. The browser discards that one declaration and keeps the rest of the rule. DevTools flags it with a warning marker rather than a strikethrough, and the two are easy to confuse at a glance.",
        "**A shorthand later in the file reset your longhand.** `background` wipes `background-color`. The `font` shorthand resets `line-height` to `normal` unless you specify it. `all: unset` erases everything you set above it.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements. `gap` does nothing outside flex, grid and multi-column. `z-index` is ignored unless the element is positioned or is a flex or grid item.",
        "**The property is not inherited.** Setting `border` on a wrapper does not give its children borders. Only a specific list of properties inherits, and layout properties mostly do not.",
        "**The stylesheet never arrived.** A 404, a stale build output, a `media` attribute that does not match, a `@supports` guard that fails, or a container query evaluated against an element with no containment.",
        "**Something is painting over it.** A pseudo-element, a background on a child, an overlay. The cascade resolved exactly as you wanted and you cannot see the result."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Two console lines settle the matching question",
      "x": "`document.querySelectorAll('.card__title').length` tells you whether the element exists under the name you think it has. `el.matches('#hero .card__title')` tells you whether your full selector reaches it. If either answer surprises you, stop reading about specificity."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple, usually written `(a,b,c)`. Count ID selectors into `a`, count classes, attribute selectors and pseudo-classes into `b`, count element types and pseudo-elements into `c`. Compare two selectors by looking at `a` first. Only if they tie do you look at `b`, and then `c`. The components never carry over into each other."
    },
    {
      "t": "table",
      "head": [
        "Column",
        "What counts in it",
        "Examples"
      ],
      "rows": [
        [
          "a (IDs)",
          "ID selectors only",
          "`#hero`, `#app`"
        ],
        [
          "b (classes)",
          "Classes, attribute selectors, pseudo-classes",
          "`.btn`, `[disabled]`, `[href^=\"https\"]`, `:hover`, `:nth-child(2)`"
        ],
        [
          "c (types)",
          "Element type selectors and pseudo-elements",
          "`div`, `li`, `::before`, `::marker`"
        ],
        [
          "Nothing",
          "The universal selector and every combinator",
          "`*`, `>`, `+`, `~`, the descendant space"
        ]
      ],
      "caption": "Three buckets, compared one at a time. Pseudo-elements sit with element types, not with pseudo-classes."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,1)  one type selector */\nli { color: #555; }\n\n/* (0,1,0)  one class */\n.nav-item { color: #06c; }\n\n/* (0,2,1)  two classes and a type */\n.nav .nav-item a { color: #06c; }\n\n/* (0,2,0)  an attribute selector and a pseudo-class both count as classes */\n[href^=\"https\"]:hover { color: #093; }\n\n/* (0,0,2)  a pseudo-element counts as a type */\nli::marker { color: #999; }\n\n/* (0,0,0)  the universal selector and combinators count for nothing */\n* > * + * { margin-block-start: 1rem; }\n\n/* #sidebar is (1,0,0) and wins. The rule below it is (0,11,0), and eleven\n   classes still lose to one id: this is not base ten arithmetic. */\n#sidebar { color: #000; }\n.a.b.c.d.e.f.g.h.i.j.k { color: red; }"
    },
    {
      "t": "p",
      "x": "The functional pseudo-classes are where people get caught out, because they decouple matching from weight. `:where()` always contributes zero, no matter what you put inside it. `:is()` and `:not()` contribute the specificity of their most specific argument, which means one stray ID inside an `:is()` list quietly makes the whole selector an ID-weight selector."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,0): only .card contributes. :where() is free, always. */\n:where(#app, .theme-dark) .card { padding: 1rem; }\n\n/* (1,1,0): :is() takes #app, its most specific argument. */\n:is(#app, .theme-dark) .card { padding: 1rem; }\n\n/* (0,2,0): :not() counts its argument too. */\n.card:not(.card--compact) { padding: 1rem; }"
    },
    {
      "t": "p",
      "x": "That asymmetry is useful. Write the parts of a selector you need for *matching* inside `:where()`, and keep outside it only the parts you want to carry *weight*. A component library built that way can be overridden by a single class, which is usually the behaviour you want from a library."
    },
    {
      "t": "h2",
      "x": "Specificity is one step, and not the first"
    },
    {
      "t": "p",
      "x": "Here is the part that explains most of the genuinely confusing cases. The browser does not start with specificity. It works through a sequence of tests and stops at the first one that separates the two declarations. Specificity is near the bottom."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Browser default styles, user styles and author styles each have a normal and an important band, arranged into one fixed ladder.",
        "**Encapsulation context.** For normal declarations, rules from outside a shadow tree beat rules inside it. For important declarations, the inner context wins instead.",
        "**Element-attached styles.** A `style` attribute beats any selector-based rule in the same origin and importance band, regardless of specificity.",
        "**Cascade layers.** Later layers beat earlier ones. Unlayered declarations act as a final layer after all the named ones.",
        "**Scope proximity.** With `@scope`, the declaration whose scoping root is nearest the element wins. Support is still uneven across browsers as of October 2026, so check your own targets before relying on it.",
        "**Specificity.** The triple described above.",
        "**Order of appearance.** The last matching declaration in source order wins. This is the only tie-break left."
      ]
    },
    {
      "t": "p",
      "x": "The origin ladder deserves spelling out, because two of its rungs surprise people. From weakest to strongest: browser defaults, user styles, author styles, CSS animations, author `!important`, user `!important`, browser-default `!important`, and finally CSS transitions. Yes, a user stylesheet's `!important` outranks yours. That is deliberate, and it is how a reader who needs a 24px minimum font size gets one on your site."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "A transition can outrank !important",
      "x": "A transitioning property sits at the very top of the ladder for as long as the transition lasts. So a value that appears to ignore your `!important` for a few hundred milliseconds and then snaps into place is not a cascade bug. It is a transition finishing."
    },
    {
      "t": "h2",
      "x": "Cascade layers reorder everything above specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the feature that makes most specificity arguments unnecessary, and it is also the feature most likely to make an otherwise sensible rule lose. Declare your layer order once, up front. Any rule in a later layer then beats any normal rule in an earlier layer, whatever the selectors look like."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order first. This single line decides every contest below. */\n@layer reset, base, components, utilities;\n\n@layer components {\n  /* (1,1,0). High specificity, early layer. */\n  #hero .title { font-size: 2rem; }\n}\n\n@layer utilities {\n  /* (0,1,0). Lower specificity, later layer: this one wins. */\n  .text-sm { font-size: 0.875rem; }\n}\n\n/* Unlayered, so it acts as a layer after all of the above.\n   For normal declarations, it beats both. */\n.title { font-size: 3rem; }"
    },
    {
      "t": "p",
      "x": "The practical payoff is third-party CSS. Import a vendor stylesheet into a layer and every normal declaration in it loses to your own unlayered rules, without you out-specifying anything. This happens at import time, so you never touch the vendor file."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Vendor rules now sit below everything unlayered, by construction. */\n@import url(\"vendor/widget.css\") layer(vendor);\n\n/* No #id prefix, no doubled class, no !important. Just a class. */\n.widget-title { color: inherit; }"
    },
    {
      "t": "p",
      "x": "One caveat with that trick: it disciplines only *normal* declarations. An `!important` inside the vendor layer still beats your unlayered normal rule, because importance is tested before layers. Layers sort declarations within a band. They do not move them between bands."
    },
    {
      "t": "h2",
      "x": "What !important actually does"
    },
    {
      "t": "p",
      "x": "`!important` does not add specificity. It moves the declaration into the author-important band, which is a separate pass of the cascade. Inside that band, specificity and source order still apply normally, which is why two competing `!important` rules can still fight each other and why adding a third does not reliably settle anything."
    },
    {
      "t": "p",
      "x": "With layers in play there is a twist that catches almost everyone the first time. For important declarations, author layer order is reversed, and unlayered important declarations drop to the bottom rather than rising to the top."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, theme;\n\n@layer base {\n  .btn { color: blue !important; }   /* first layer: this one wins */\n}\n\n@layer theme {\n  .btn { color: red !important; }    /* later layer: loses */\n}\n\n/* Unlayered !important has the LOWEST priority of these three: the opposite\n   of how unlayered normal declarations behave. */\n.btn { color: green !important; }"
    },
    {
      "t": "p",
      "x": "Read that sample twice if it looks wrong. It is the most counter-intuitive consequence of layers, and it means that wrapping a legacy stylesheet in a layer can make a legacy `!important` *stronger* than it was before, relative to your unlayered overrides."
    },
    {
      "t": "p",
      "x": "There are legitimate uses for `!important`. Utility classes whose entire purpose is to win, such as `.sr-only` or `.hidden`, are the clearest case, since a utility that silently loses is worse than useless. Print stylesheets are another. What it should not be is a reflex: every `!important` you add raises the floor for the next person, and in a codebase where the floor has been raised a few times the only remaining move is another `!important`."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "An inline style is not automatically the winner",
      "x": "The ladder runs: normal selector rule, then normal `style` attribute, then author `!important` in a stylesheet, then `!important` in a `style` attribute. A stylesheet rule with `!important` therefore beats an inline style, which is why `element.style.display = 'block'` sometimes appears to do nothing at all. Setting `display: none !important` in CSS and then fighting it from JavaScript is a losing game. Toggle a class instead."
    },
    {
      "t": "h2",
      "x": "Finding the winner instead of guessing"
    },
    {
      "t": "p",
      "x": "DevTools already computed the answer. The Styles pane lists every matching rule in winning order, with overridden declarations struck through. The Computed pane is better for a single property: expand it and you get the winning declaration plus a link straight to the rule and line that produced it. That link is the fastest route to the file you did not know was loaded."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const el = document.querySelector('.card__title');\n\n// 1. Did the selector ever match? Cheapest possible check.\nel.matches('#hero .card__title');\n\n// 2. What actually won, after the whole cascade?\ngetComputedStyle(el).fontSize;\n\n// 3. Is the value even valid? A dropped declaration never enters the cascade.\nCSS.supports('width', 'fit-content');   // false => the browser discarded it\n\n// 4. Is an inline style involved, and is it important?\nel.getAttribute('style');\nel.style.getPropertyPriority('color');  // \"important\" or \"\"\n\n// Note: getMatchedCSSRules() was a non-standard extension and has been removed\n// from Chromium. Use the Styles pane rather than hunting for a replacement."
    },
    {
      "t": "p",
      "x": "Custom properties add one more wrinkle. The cascade resolves the custom property itself, then substitution happens afterwards, so `color: var(--brand)` always uses whichever `--brand` declaration won on that element. Putting `!important` on `color` does nothing to protect the value inside the variable. If the colour keeps changing on you, work out what won for `--brand`, not for `color`. The Computed pane lists custom properties alongside everything else."
    },
    {
      "t": "h2",
      "x": "Keeping it from happening again"
    },
    {
      "t": "p",
      "x": "Specificity problems are a symptom of unmanaged ordering. Decide the order once, in one place, and the day-to-day fights mostly disappear."
    },
    {
      "t": "ul",
      "items": [
        "**Declare `@layer` order at the top of your entry stylesheet.** One `@layer reset, vendor, base, components, utilities;` line documents the whole precedence model, and the layers themselves can then be defined in any file order.",
        "**Keep author selectors flat.** Single classes, mostly `(0,1,0)`. If a selector needs an ID or four classes to win, the real problem is usually the rule it is competing with.",
        "**Avoid styling IDs.** An ID selector is a ratchet that turns one way only. Use IDs for fragment links and `aria-labelledby`, not for styling.",
        "**Double a class instead of adding an ID.** `.btn.btn { }` is `(0,2,0)` and reads as exactly what it is: a deliberate, minimal escalation. It is also easy to undo later.",
        "**Wrap matching-only selector parts in `:where()`.** Theme hooks, state classes on `html`, ancestor containers. They need to match. They do not need weight.",
        "**Put vendor CSS in a layer at import time.** `layer(vendor)` is less work than every alternative and does not involve editing anyone else's file."
      ]
    },
    {
      "t": "p",
      "x": "One diagnostic habit pays for itself. When a rule does not apply, name the cascade step you think is deciding it before you change any code. Most of the time, answering that question tells you the rule never matched, and you were never in a cascade contest at all."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three usual answers. Another declaration is also important and wins on layer order, specificity or source order, including an important declaration in a style attribute. Or your declaration is invalid and the browser dropped it at parse time, in which case !important changes nothing. Or the selector never matched the element, which element.matches() in the console will tell you in a second. A running CSS transition also outranks !important while it lasts."
        },
        {
          "q": "Does an ID always beat a class in CSS?",
          "a": "Within the specificity step, yes. One ID outranks any number of classes, because the three components of a specificity triple are compared one at a time rather than summed. But specificity is only consulted after origin, importance, inline styles and cascade layers have all been checked. An ID selector in an early layer still loses to a plain class in a later one."
        },
        {
          "q": "How do I override a CSS rule without using !important?",
          "a": "In order of preference. Put the stylesheet you do not control into a cascade layer with @import layer(vendor), so your unlayered rules win automatically. Or match the competing specificity and place your rule later in source order. Or escalate deliberately by repeating a class, as in .btn.btn, which is honest about what it is doing and easy to reverse. Wrapping selector parts you only need for matching in :where() keeps your own selectors cheap enough that the first option usually suffices."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes. Layer order is compared before specificity, so any declaration in a later layer beats every normal declaration in an earlier one regardless of selectors. Unlayered styles behave as a final, strongest layer for normal declarations. For important declarations the order reverses: the earliest layer wins, and unlayered important declarations end up with the lowest priority of the author importants."
        },
        {
          "q": "Why is my inline style being ignored?",
          "a": "A style attribute beats selector-based rules of any specificity, but only within the same importance band. Any author rule with !important beats a normal inline style, and an inline style with !important beats that in turn. Check also that a framework is not rewriting the attribute on re-render, and that the property applies to the element at all."
        },
        {
          "q": "What is the specificity of :is(), :where() and :not()?",
          "a": ":where() contributes zero, always, whatever selectors it contains. :is() and :not() contribute the specificity of their most specific argument, so :is(#app, p) counts as an ID selector. Matching behaviour is unaffected in both cases. Only the weight differs."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Once the right rule is winning, the next question is which layout model should own the axis.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check the colour that actually won against the WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "React useState not updating",
          "desc": "The same shape of problem one layer up: the value you set is not the value you see.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-08",
  "updated": "2026-10-08",
  "author": "jackson",
  "related": [
    "/guides/css-grid-vs-flexbox/",
    "/tools/color-contrast-checker/"
  ]
};
