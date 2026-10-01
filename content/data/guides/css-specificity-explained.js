module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers and !important",
  "eyebrow": "CSS",
  "description": "A debugging order for CSS rules that refuse to apply: how specificity is counted, how cascade layers reorder it, and when !important is the honest fix.",
  "standfirst": "Three different failures look identical in the browser: a selector that never matched, a declaration that lost the cascade, and a value that was thrown away. Here is how to tell them apart in about thirty seconds.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "Tell apart a selector that never matched, a declaration that lost the cascade, and a value the browser discarded.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Open devtools before theorising. A declaration with a line through it **lost the cascade**. A selector that does not appear in the Styles panel at all **never matched**.",
        "Specificity is three numbers, not one: ID count, then class/attribute/pseudo-class count, then type count. A higher left-hand column wins outright, whatever the columns to its right say.",
        "Cascade layers are checked *before* specificity. Unlayered author CSS beats anything inside an `@layer`, which is why a single-class rule can defeat a long descendant selector.",
        "`!important` reverses the layer order: important declarations in a layer beat unlayered important ones, and earlier layers win over later ones.",
        "Many \"rule not applying\" bugs are not cascade bugs. A shorthand later in the file, an invalid `var()`, or a selector that matches zero elements all look the same from the outside."
      ]
    },
    {
      "t": "h2",
      "x": "First work out which of the three failures you have"
    },
    {
      "t": "p",
      "x": "**Inspect the element and look at the Styles panel. What you see there tells you which problem you have, and the three problems have nothing to do with each other.**"
    },
    {
      "t": "ul",
      "items": [
        "**Your selector is not in the list.** It did not match. The cascade never got involved. Check the markup, the class spelling, the element nesting, and whether the stylesheet loaded at all.",
        "**Your selector is listed but the declaration is struck through.** It matched and lost. This is the cascade, and the rest of this page is about it.",
        "**Your selector is listed, the declaration is not struck through, and nothing changed.** The value was discarded or overridden by something that is not a selector: an invalid value, a shorthand, an inherited property on a different element, or a `transform` on an element that cannot be transformed."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Use the Computed tab",
      "x": "The Computed tab in Chrome and Firefox shows the final value for every property, and expanding a property lists every declaration that tried to set it, in cascade order, with the winner at the top. That is usually faster than reading the Styles panel top to bottom."
    },
    {
      "t": "p",
      "x": "A quick sanity check for the first case: run your selector in the console. If it returns zero elements, stop reading about specificity."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "document.querySelectorAll('.card > .card__title').length\n// 0  -> the selector is wrong, or the DOM is not what you think it is"
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a triple. Count the ID selectors, then the class, attribute and pseudo-class selectors, then the type and pseudo-element selectors. Combinators (`>`, `+`, `~`, and the descendant space) and the universal selector `*` contribute nothing."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/*                        (ID, CLASS, TYPE) */\n#sidebar a            { color: red;   }  /* (1,0,1) */\n.nav .nav__link       { color: blue;  }  /* (0,2,0) */\na.nav__link:hover     { color: green; }  /* (0,2,1) */\nnav ul li a           { color: black; }  /* (0,0,4) */\n* > a                 { color: grey;  }  /* (0,0,1) */"
    },
    {
      "t": "p",
      "x": "For a hovered link inside `#sidebar` that has all of these classes, the winner is `#sidebar a` at (1,0,1). The hover rule looks more specific when you read it, because it names the element, the class and the state. It is not. The columns are compared left to right and the comparison stops at the first difference."
    },
    {
      "t": "p",
      "x": "This is the part people get wrong most often: the columns do not carry. Eleven classes score (0,11,0), and (0,11,0) loses to (1,0,0). You cannot reach an ID by stacking classes, ever. That single fact explains most of the long, ugly selectors in old codebases."
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
          "`*`",
          "(0,0,0)",
          "Adds nothing, but still beats an inherited value."
        ],
        [
          "`li`, `::before`",
          "(0,0,1)",
          "Type selectors and pseudo-elements share the third column."
        ],
        [
          "`.card`, `[data-open]`, `:hover`",
          "(0,1,0)",
          "Classes, attribute selectors and pseudo-classes share the second column."
        ],
        [
          "`#app`",
          "(1,0,0)",
          "One ID outranks any number of classes."
        ],
        [
          "`.a.b.c.d.e.f.g.h.i.j.k`",
          "(0,11,0)",
          "Eleven classes, and still loses to `#app`."
        ],
        [
          "`:where(#app .card)`",
          "(0,0,0)",
          "Everything inside `:where()` counts as zero."
        ],
        [
          "`:is(#app, .card)`",
          "(1,0,0)",
          "Takes the specificity of its most specific argument, matched or not."
        ],
        [
          "`style=\"color: red\"`",
          "not applicable",
          "Inline styles are not ranked by specificity at all."
        ]
      ],
      "caption": "Specificity is compared left to right; the first non-equal column decides it."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Inline styles are a separate rung",
      "x": "A `style` attribute is still author CSS, but it sits above every author rule of the same importance, layered or not. So a normal inline declaration beats your stylesheet, and an `!important` declaration in your stylesheet beats a normal inline declaration. An `!important` inside the `style` attribute beats both."
    },
    {
      "t": "h2",
      "x": "The functional pseudo-classes change the arithmetic"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` all take the specificity of their most specific argument. `:where()` is identical to `:is()` in what it matches and always scores zero. That zero is the useful part."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,0): the :where() wrapper contributes nothing */\n:where(.prose) a { color: var(--link, #0b5cad); }\n\n/* (1,0,1): :is() inherits the specificity of #app */\n:is(#app, .widget) a { color: hotpink; }\n\n/* (0,1,1): :not() takes .ignore's score */\na:not(.ignore) { text-decoration: underline; }"
    },
    {
      "t": "p",
      "x": "Wrapping the context part of a selector in `:where()` is the cleanest way to publish defaults that consumers can override with a plain class. Library authors should use it far more than they do. The flip side is that a zero-specificity rule loses to everything, including a stray `a { }` further down the file, so source order starts to matter a lot."
    },
    {
      "t": "h2",
      "x": "Cascade layers sit above specificity"
    },
    {
      "t": "p",
      "x": "**If a low-specificity rule is beating a high-specificity one, check for `@layer`.** Layers are resolved before specificity is ever consulted, and specificity only breaks ties inside a single layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, base, components, utilities;\n\n@layer components {\n  #page .button { background: navy; }   /* (1,1,0) */\n}\n\n@layer utilities {\n  .bg-white { background: white; }      /* (0,1,0) beats the rule above */\n}\n\n/* Outside any layer: wins over both, at any specificity */\n.theme-dark .button { background: #111; }"
    },
    {
      "t": "p",
      "x": "Two rules to memorise. Later layers beat earlier layers, in the order the layer names were first declared, not the order the blocks appear. And unlayered author CSS beats every layer. Tailwind v4, Open Props and several component libraries put their own output in layers precisely so that your plain stylesheet can override them without a specificity fight."
    },
    {
      "t": "p",
      "x": "`!important` inverts both rules. An important declaration in the `reset` layer beats an important declaration in `utilities`, and important declarations outside any layer are the weakest important declarations in the document. This feels backwards until you see the intent: a reset layer can declare something genuinely non-negotiable, and the author of a page cannot casually shout over it."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support",
      "x": "Cascade layers shipped in the current versions of Chrome, Firefox, Safari and Edge during early 2022, so they are safe for most projects as of October 2026. `@scope`, which adds a proximity step between layers and specificity, landed later and unevenly. Check a current support table before relying on it."
    },
    {
      "t": "h2",
      "x": "The full order the browser uses"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser works down this list and stops at the first step that separates them. Highest priority first:"
    },
    {
      "t": "ol",
      "items": [
        "Declarations from a running CSS **transition**.",
        "`!important` from the **browser's own stylesheet**.",
        "`!important` from a **user stylesheet** or an accessibility setting.",
        "`!important` from **your CSS** (layer order reversed, unlayered weakest).",
        "Declarations from a running **animation** or `@keyframes`.",
        "Normal declarations from **your CSS** (unlayered first, then later layers, then earlier layers).",
        "Normal declarations from a **user stylesheet**.",
        "Normal declarations from the **browser's own stylesheet**."
      ]
    },
    {
      "t": "p",
      "x": "Only after all of that does the browser look at scope proximity, then specificity, then source order, with the last declaration winning. Note where animations sit: an active animation overrides your normal rules, which is why a property that mysteriously refuses to change may be owned by a keyframe you forgot about. Note also that a user stylesheet with `!important` outranks anything you write. That is deliberate and it is an accessibility feature."
    },
    {
      "t": "h2",
      "x": "When !important is defensible"
    },
    {
      "t": "p",
      "x": "It is a legitimate tool with a narrow brief. The usual advice to never use it produces selectors like `#app .page .widget .widget__item.is-active a` that are worse than the thing they avoid."
    },
    {
      "t": "ul",
      "items": [
        "**Overriding third-party CSS you cannot edit.** A widget that writes inline styles leaves you no other option.",
        "**Utility classes that must win.** A `.hidden { display: none !important; }` that silently fails is worse than useless. If you control the build, a late cascade layer is the better version of this.",
        "**Debugging.** Paste it in, confirm the property is the one you think it is, then take it out again.",
        "**Accessibility overrides** in a user stylesheet, where winning is the entire point."
      ]
    },
    {
      "t": "p",
      "x": "What makes `!important` expensive is not the keyword. It is that the only way to beat it is another `!important` with higher specificity, so the next person has to escalate. Keep each one on a single property with a comment saying what it is fighting, and never put it on a shorthand."
    },
    {
      "t": "h2",
      "x": "Problems that look like specificity and are not"
    },
    {
      "t": "h3",
      "x": "A shorthand later in the file"
    },
    {
      "t": "p",
      "x": "Shorthands reset every longhand they cover, including the ones you did not mention. Equal specificity, later wins, and your colour is gone."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card { background-color: #fff; }\n.card { background: url(paper.png) no-repeat; }\n/* background-color is now transparent: the shorthand reset it */\n\n/* Same trap with font, border, inset, grid, transition, mask, all */\n.title { font-weight: 700; }\n.title { font: 16px/1.4 system-ui; }   /* font-weight is back to normal */"
    },
    {
      "t": "h3",
      "x": "An invalid value, including a missing custom property"
    },
    {
      "t": "p",
      "x": "If a value fails to parse, the browser drops that one declaration and the previous one stands. Custom properties behave differently and the difference catches people out. An undefined `var()` is syntactically fine, so the declaration survives parsing and then becomes invalid at computed-value time, which means the property is set to `unset`. For an inherited property such as `color` you get the parent's value, not your earlier fallback."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  color: #222;\n  color: var(--text);   /* --text undefined: colour is now INHERITED, not #222 */\n}\n\n.card {\n  color: var(--text, #222);   /* do this instead */\n}"
    },
    {
      "t": "h3",
      "x": "Inheritance versus a direct match"
    },
    {
      "t": "p",
      "x": "An inherited value loses to any matching declaration on the element itself, at any specificity. Setting `font-family` on `#app` with three IDs will not touch a `button`, because the browser's own stylesheet matches `button` directly. This is why resets exist and why `font: inherit` on form controls is so common."
    },
    {
      "t": "h3",
      "x": "Media queries and source order"
    },
    {
      "t": "p",
      "x": "`@media`, `@supports` and `@container` add nothing to specificity. If your breakpoint rule has the same specificity as the base rule and appears earlier in the file, the base rule wins at every width, and the media query looks broken. Two overlapping media queries follow the same rule: `max-width: 768px` and `min-width: 640px` both match at 700px, and the later one takes the property."
    },
    {
      "t": "h3",
      "x": "Build order and framework conventions"
    },
    {
      "t": "p",
      "x": "Source order is decided by the bundler, not by your import statements' intent. CSS Modules, styled-components and Tailwind each inject styles at a point you do not directly control, and a component that renders later can inject a rule that wins. If a rule applies in dev and not in prod, suspect chunk order before you suspect specificity. One more detail: `@import` must come before every rule except `@charset` and `@layer`, and a misplaced `@import` is silently ignored."
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
          "x": "Run it in the console. Zero elements means the problem is your markup or your selector, and nothing in the cascade matters yet.",
          "code": "document.querySelectorAll('your > selector').length"
        },
        {
          "title": "Look for the strike-through",
          "x": "Struck through means it matched and lost. Absent means it never matched. Those are different bugs with different fixes, and conflating them wastes most of the time people spend on this."
        },
        {
          "title": "Open the Computed tab and expand the property",
          "x": "You get the winning declaration, its source file and line, and everything it beat. If the winner is a browser default or an animation, you have your answer already."
        },
        {
          "title": "Compare the two selectors column by column",
          "x": "Count IDs, then classes and pseudo-classes, then types. Stop at the first column that differs. Do not add the numbers together."
        },
        {
          "title": "Check for cascade layers",
          "x": "If the lower-specificity rule is winning, something is layered. This lists the layer rules the page has actually loaded.",
          "code": "[...document.styleSheets]\n  .flatMap(s => { try { return [...s.cssRules] } catch { return [] } })\n  .filter(r => r.constructor.name.startsWith('CSSLayer'))\n  .map(r => r.name ?? [...r.nameList].join(', '))"
        },
        {
          "title": "Fix it at the lowest level that works",
          "x": "In order of preference: move the rule later in the same layer, put it in a later layer, add one class to the selector, then `!important` on a single longhand property with a comment. Adding an ID to win an argument is the option that costs the next person the most."
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "Check the Styles panel in devtools. If your selector is not listed, it did not match the element, so the cascade is irrelevant and the bug is in your selector or your markup. If it is listed with a line through it, something beat it: compare specificity column by column, and check for cascade layers, inline styles and animations. If it is listed and not struck through but nothing changed, the value was discarded, usually by a shorthand later in the file or an undefined custom property."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes. An `!important` declaration in a stylesheet beats a normal declaration in a `style` attribute, because importance is checked before the inline-style ranking. The exception is an inline style that also uses `!important`, which outranks every other author declaration. If you are fighting a third-party script that rewrites inline styles on every render, `!important` is the only CSS-level answer."
        },
        {
          "q": "How many classes equal one ID in CSS specificity?",
          "a": "None. Specificity columns are compared left to right and never carry, so a single ID at (1,0,0) beats any number of classes. If you need to override an ID-based rule, your options are another ID, an `!important`, a later cascade layer, or editing the original selector. In new code, keeping IDs out of selectors entirely avoids the whole problem."
        },
        {
          "q": "Does the order of my CSS files matter?",
          "a": "Yes, whenever two declarations tie on origin, importance, layer and specificity. The last one in source order wins. The order is whatever your bundler emits, which may not match your import statements, and it can differ between development and production builds. That is a common cause of styling that only breaks after deployment."
        },
        {
          "q": "What is the specificity of :has() and :not()?",
          "a": "Both take the specificity of their most specific argument. `:has(.active)` scores (0,1,0) and `:has(#main)` scores (1,0,0). The same applies to `:is()`. Only `:where()` is different: it always contributes zero, which makes it the right wrapper for styles you want consumers to override easily."
        },
        {
          "q": "Why does my media query not override the base style?",
          "a": "Media queries do not add specificity. If the rule inside the query has the same specificity as the base rule but appears earlier in the stylesheet, the base rule wins at every viewport size. Move the media query after the rule it is meant to override. The same applies to `@supports` and `@container`, and to two overlapping media queries where both conditions are true at once."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "A decision rule for layout, plus the sizing details that cause overflow bugs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The front-end sibling of this problem: code that looks correct and visibly is not.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-01",
  "updated": "2026-10-01",
  "author": "jackson",
  "related": []
};
