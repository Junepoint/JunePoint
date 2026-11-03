module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important",
  "eyebrow": "Guides",
  "description": "A debugging order for CSS that will not apply: tell a lost cascade from a typo, read specificity correctly, and understand what @layer and !important really do.",
  "standfirst": "The cascade compares origin, importance and layers before it ever looks at specificity. Knowing that order turns most \"why is this ignored\" bugs into a thirty second check.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Work out why a CSS declaration lost, in the order the browser actually decides it.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Find out which bug you have before you change anything. A declaration that lost the cascade shows struck through in DevTools. A declaration with an invalid value shows a warning marker. A rule whose selector never matched does not appear in the Styles pane at all. Those are three unrelated problems with three different fixes.",
        "Specificity is near the end of the comparison, not the start. Origin and importance come first, then inline styles, then cascade layers, then specificity, then source order.",
        "Specificity is three independent counts, written `(ids, classes, types)` and read left to right. Eleven classes lose to one ID. There is no carrying between columns.",
        "`!important` is not a specificity bonus. It moves the declaration into a higher priority bucket, and only another important declaration can beat it there.",
        "Inheritance has no specificity. Any declaration matching the element itself beats a value inherited from an ancestor, no matter how specific the ancestor's selector was."
      ]
    },
    {
      "t": "h2",
      "x": "First, work out which bug you have"
    },
    {
      "t": "p",
      "x": "\"My CSS is not applying\" covers at least four distinct failures, and specificity is only one of them. The others are a selector that does not match, a property or value the browser rejected, and a file that never loaded or never rebuilt. Guessing between them wastes time, because the browser will tell you which one it is if you ask."
    },
    {
      "t": "p",
      "x": "Open DevTools, select the element, and read the Styles pane from the top. Rules appear in the order the browser resolved them, winners first. A declaration the cascade overruled is drawn with a line through it. A declaration the parser could not understand is greyed out with a warning icon next to it, which usually means a typo in the property name, a missing unit, or a value that property does not accept. If your rule is not listed anywhere, the selector did not match this element, and no amount of extra classes in front of it will help."
    },
    {
      "t": "p",
      "x": "The console settles the matching question directly."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "const el = document.querySelector('.btn');\n\n// Does the selector you wrote actually match this element?\nel.matches('.page .card .btn');   // false means the selector is the bug\n\n// What value is really in effect, after the whole cascade?\ngetComputedStyle(el).padding;\n\n// Is something setting it inline, from JS or a framework?\nel.getAttribute('style');\n\n// Every rule the browser matched to this element, winners last\n// (Chromium and Safari only; wrap in a try/catch in shared code)\nel.ownerDocument.defaultView\n  .getMatchedCSSRules?.(el);"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A fast sanity check for \"did my file even load\"",
      "x": "Add `outline: 3px solid magenta` to the rule you are debugging. If the outline does not appear, the stylesheet, the build step or the selector is at fault, and specificity is not involved. This is faster than reasoning about cache headers, and it is honest about what you have proved."
    },
    {
      "t": "h2",
      "x": "The order the cascade really uses"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser walks a fixed sequence of tie-breakers and stops at the first one that separates them. Most developers remember specificity and source order and skip the three or four steps in front of them. That is where the surprising losses come from."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What it compares",
        "The surprise it causes"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "Transitions, then important user-agent, user and author styles, then animations, then normal author, user and user-agent styles",
          "A running transition outranks `!important`. An active animation outranks every normal declaration you write."
        ],
        [
          "2. Context",
          "Shadow tree versus the outer document",
          "A web component's internal styles and your page styles are sorted before specificity is consulted."
        ],
        [
          "3. Element-attached styles",
          "The `style` attribute",
          "Inline styles are not \"specificity 1000\". They win at their own step, which is why a library setting `style.display` cannot be beaten by a longer selector."
        ],
        [
          "4. Cascade layers",
          "Layer order, with unlayered normal styles last and therefore strongest",
          "An unlayered `.btn` rule beats `#app .btn` inside `@layer components`, because layers are compared before specificity."
        ],
        [
          "5. Specificity",
          "IDs, then classes and attributes and pseudo-classes, then types and pseudo-elements",
          "Columns are compared one at a time. The class column never overflows into the ID column."
        ],
        [
          "6. Order of appearance",
          "The last matching declaration in document order",
          "Link and bundle order decides identical-specificity ties, so a build change can silently flip your styling."
        ]
      ],
      "caption": "Cascade sorting, highest-priority step first. CSS Cascading and Inheritance Level 6 adds a scope proximity step for @scope between specificity and order of appearance; check current browser support before relying on it."
    },
    {
      "t": "p",
      "x": "Read that table once with your own bug in mind. If the two competing declarations differ at step 1, 3 or 4, then rewriting the selector is pointless, and plenty of people spend an afternoon doing exactly that."
    },
    {
      "t": "h2",
      "x": "Reading a specificity value without guessing"
    },
    {
      "t": "p",
      "x": "Specificity is a triple. The first number counts ID selectors. The second counts classes, attribute selectors and pseudo-classes. The third counts element types and pseudo-elements. Combinators, the universal selector and `:where()` all contribute nothing. Compare the triples left to right and stop at the first difference."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,0) one class */\n.card { color: red; }\n\n/* (0,2,1) two classes, one type */\n.page .card a { color: blue; }\n\n/* (0,11,0) eleven classes, and it still loses to the next rule */\n.a.b.c.d.e.f.g.h.i.j.k { color: teal; }\n\n/* (1,0,0) one ID */\n#promo { color: green; }\n\n/* (1,0,0) :is() takes the specificity of its MOST specific argument,\n   so adding a class alternative here changes nothing */\n:is(#promo, .card) { color: rebeccapurple; }\n\n/* (0,0,0) :where() is always zero, which makes it the right tool\n   for defaults you expect authors to override */\n:where(.card, #promo) h2 { color: inherit; }   /* (0,0,1) overall */\n\n/* (0,2,0) :not() and :has() also count their most specific argument */\n.btn:not(.is-disabled) { opacity: 1; }\n\n/* (0,1,0) an attribute selector counts the same as a class */\n[data-state='open'] { display: block; }"
    },
    {
      "t": "p",
      "x": "Two practical consequences follow. First, `:where()` is how you ship a reset or a default theme that other people's single-class rules can override without a fight. Second, an ID in a selector is a commitment: nothing in the class column will ever outrank it, so you end up adding IDs or `!important` to every later override. That is the whole reason BEM and utility frameworks avoid IDs in the first place."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Do not compute specificity as a number",
      "x": "The old trick of scoring 100 per ID, 10 per class and 1 per type gives the right answer most of the time and then quietly fails. Ten classes do not equal one ID. Treat the three columns as independent, which is what the spec says and what browsers do."
    },
    {
      "t": "h2",
      "x": "Cascade layers change which rule wins before specificity is read"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare priority buckets up front, so that a framework reset cannot outrank your components by accident. Declaration order of the layers themselves decides the winner, and specificity is only used inside a layer. The major browsers have supported cascade layers since early 2022, so this is a safe tool for most projects, though you should still confirm against your own support targets."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, usually at the top of your entry stylesheet.\n   Later layers win for normal declarations. */\n@layer reset, vendor, base, components, utilities;\n\n@layer components {\n  #app .card .btn { padding: 1rem; }   /* (1,2,0), and it still loses */\n}\n\n@layer utilities {\n  .p-0 { padding: 0; }                 /* (0,1,0), wins: later layer */\n}\n\n/* Not inside any layer at all. Unlayered normal declarations are\n   sorted as if they were the final layer, so this beats both above. */\n.btn { padding: 2rem; }"
    },
    {
      "t": "p",
      "x": "There is a trap worth memorising. For important declarations, the layer order is reversed: an `!important` in the first layer you declared beats an `!important` in the last one, and an unlayered `!important` is the weakest of all your author important styles. The reasoning is consistent once you see it, because the layers you declare first are the ones you intend as the lowest priority, and importance flips the whole axis. In practice it means that sprinkling `!important` inside a layered codebase produces results that feel random until you stop and work through the order."
    },
    {
      "t": "p",
      "x": "`revert-layer` is the companion tool. It rolls a property back to the value it would have had if the current layer did not exist, which is a clean way to undo one layer's opinion without hunting for the original value. `all: revert` goes further and returns everything to the user-agent or user style, useful when you need an island of unstyled content inside a heavily themed page."
    },
    {
      "t": "h2",
      "x": "!important, and overriding one you cannot edit"
    },
    {
      "t": "p",
      "x": "`!important` is not a stronger selector. It lifts the declaration into a separate priority band, and inside that band the same comparisons run again: layer order first, reversed, then specificity, then source order. So the only honest way to beat someone else's important declaration is another important declaration that wins one of those steps, or removing the original."
    },
    {
      "t": "ul",
      "items": [
        "**Same file, you control both.** Delete the `!important` instead of answering it. Two competing important declarations are a problem you will have to debug again in six months.",
        "**A third-party stylesheet you cannot change.** Put the vendor styles in an early layer, for example `@layer vendor`, and your overrides in a later one. For normal declarations this fixes it outright. If the vendor used `!important`, your important override must sit in an *earlier* layer than theirs, or be unlayered and matched with a higher specificity.",
        "**Inline styles set by JavaScript.** An `!important` declaration in a stylesheet does beat a normal inline style, because importance is compared at step 1 and inline styles only win at step 3. This is the one case where `!important` is routinely the correct answer.",
        "**A property mid-transition.** Transitions sit above `!important` in the cascade order. If a value flickers back during an interaction, look at `transition-property` before you look at specificity.",
        "**Utility classes losing to component CSS.** This is almost always layer or bundle order, not specificity. Check the generated output, not the source."
      ]
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Accessibility styles are a legitimate use",
      "x": "User stylesheets and forced-colors adjustments are designed around importance. A user's `!important` beats your normal styles, and only your `!important` beats theirs. Think twice before using importance on colour, contrast or font size, because you may be overriding somebody's accommodation."
    },
    {
      "t": "h2",
      "x": "Five failures that look like specificity and are not"
    },
    {
      "t": "h3",
      "x": "A shorthand later in the same rule reset your longhand"
    },
    {
      "t": "p",
      "x": "Shorthands write every property they cover, including the ones you left out, which get their initial value. Order inside a single rule decides the outcome."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".alert {\n  background-color: #fee;   /* silently discarded */\n  background: #fff;         /* resets background-color, image, position... */\n}\n\n.panel {\n  border-radius: 8px;       /* survives: border does not cover radius */\n  border: 1px solid #ccc;\n}\n\n/* Same trap, different shorthands: font, inset, grid-area,\n   flex, transition, mask, place-items. */"
    },
    {
      "t": "h3",
      "x": "You are fighting inheritance, not a rule"
    },
    {
      "t": "p",
      "x": "Inherited values lose to any declaration that matches the element directly. If `body { color: #333 }` is not reaching your paragraph, look for a weak rule on the paragraph itself. A bare `p { color: initial }` or a stray `color: inherit` on an intermediate wrapper will do it, and both have lower specificity than the rule you expected to win."
    },
    {
      "t": "h3",
      "x": "The custom property resolved, the rule did not"
    },
    {
      "t": "p",
      "x": "Custom properties cascade independently of the properties that consume them. `var(--brand)` is substituted after the cascade picks a winner for `--brand`, so an override can fail because the variable is defined on the wrong element rather than because the rule lost. An invalid substitution makes the property invalid at computed-value time, which falls back to the inherited value or the initial value and is easy to mistake for a cascade loss. Inspect the custom property itself in DevTools, not only the property using it."
    },
    {
      "t": "h3",
      "x": "The at-rule never matched"
    },
    {
      "t": "p",
      "x": "A rule inside `@media`, `@supports` or `@container` only exists when the condition holds. A container query that resolves against the wrong ancestor, or a missing `container-type`, produces a rule that simply is not there. DevTools shows media query blocks in the Styles pane with their condition, so check that the one you want is listed before assuming the selector lost."
    },
    {
      "t": "h3",
      "x": "The build changed the order"
    },
    {
      "t": "p",
      "x": "Identical specificity ties break on source order, and bundlers decide source order. A code-split route, a lazily injected `<style>` tag, or a CSS module imported from a different entry point can reorder the output without any change to your source files. Framework behaviour here varies by version, so read your own generated CSS rather than trusting a blog post about it. Tailwind's v4 release moved its own output into native cascade layers, which changes how handwritten CSS interacts with utilities; verify the layer names in the output for the version you have installed."
    },
    {
      "t": "h2",
      "x": "A debugging order that holds up"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the rule exists and matches",
          "x": "Select the element and look for your selector in the Styles pane. If it is absent, run `el.matches('your selector')` in the console. Fix the selector and stop here.",
          "code": "document.querySelector('.btn').matches('.page .card .btn')"
        },
        {
          "title": "Check for a parse error",
          "x": "A greyed-out declaration with a warning marker means the browser rejected the property or value. Hover it for the reason. Misspelled properties, missing units and unsupported values all land here."
        },
        {
          "title": "Read the winner, not your rule",
          "x": "Find the declaration that is actually in effect and note where it came from: a file, a layer, the style attribute, or an animation. The fix is determined by the winner's position in the cascade, not by yours."
        },
        {
          "title": "Identify which step decided it",
          "x": "Walk the six steps in order. Different origin or importance, inline style, different layer, different specificity, or just later in the file. Only one of those is a specificity problem."
        },
        {
          "title": "Fix at that step",
          "x": "Move a layer, remove an ID from a selector, delete an inline style, or reorder an import. Reach for a longer selector only when specificity genuinely is the deciding step, and reach for `!important` only when the winner is an inline style you do not control."
        },
        {
          "title": "Leave the codebase easier to override",
          "x": "Prefer `:where()` for defaults, keep IDs out of selectors, and declare your layer order in one place. Each of these removes a future version of this same bug."
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check in this order: does the rule appear in the DevTools Styles pane at all (if not, the selector does not match), is the declaration greyed out with a warning (a parse error), and is it struck through (it lost the cascade). Only the third case is a cascade problem, and even then the deciding step is often origin, an inline style, or layer order rather than specificity."
        },
        {
          "q": "Does 10 classes beat an ID in CSS?",
          "a": "No. Specificity compares three independent counts, IDs first, then classes and attributes and pseudo-classes, then element types. A selector with one ID beats any selector with zero IDs, regardless of how many classes it has. The old \"100 points per ID, 10 per class\" formula gives the right answer often enough to be misleading."
        },
        {
          "q": "How do I override an !important from a library I cannot edit?",
          "a": "You need an important declaration of your own that wins a higher-priority step. If you use cascade layers, put the library in a later layer than your overrides, because layer order is reversed for important declarations. Without layers, match the element with higher specificity and mark your declaration important too. If the library sets the value inline from JavaScript, a stylesheet `!important` will beat it."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations. Layer order is compared before specificity, so a one-class rule in a later layer beats an ID rule in an earlier layer, and an unlayered rule beats both because unlayered normal styles sort as the final layer. Specificity still decides ties within the same layer."
        },
        {
          "q": "Is !important always bad practice?",
          "a": "No, but it is usually a symptom. Legitimate uses include overriding inline styles you do not control, user stylesheets, and accessibility overrides. Inside a codebase you own, an `!important` almost always means the underlying problem is an ID in a selector or an unclear layer order, and it will make the next override harder."
        },
        {
          "q": "Why does my inline style not win?",
          "a": "Inline styles are beaten by any `!important` author declaration, by animations and by transitions, because all of those are sorted ahead of element-attached styles. Inline styles are also not a specificity value, so they cannot be compared against a selector score at all."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. `:is()` takes the specificity of its most specific argument, so `:is(#id, .class)` counts as one ID. `:where()` always contributes zero specificity, which makes it the better choice for resets, defaults and theme styles you want authors to override with a plain class."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox: How to Choose",
          "desc": "Which layout module fits the problem, and the sizing traps that bite in both.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker for WCAG AA and AAA",
          "desc": "Check a foreground and background pair before you commit the token.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating: Five Causes",
          "desc": "The same debugging habit applied to state that appears one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-03",
  "updated": "2026-11-03",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
