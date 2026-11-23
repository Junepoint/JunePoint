module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying: Specificity",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "A diagnostic order for CSS that will not apply: confirm the match, then work through origin, cascade layers, specificity, source order and !important.",
  "standfirst": "Specificity is only one of six things the cascade checks, and it is rarely the first one you should suspect. Here is the order to work through, and what cascade layers changed about it.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "Work out why a declaration loses: match, origin, layers, specificity, source order, !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "**Most \"specificity problems\" are not specificity problems.** The selector does not match, the property value is invalid, or a later shorthand is resetting it.",
        "The cascade compares declarations in a fixed order: origin and importance, then shadow context, then inline styles, then cascade **layers**, then specificity, then source order. Specificity is step five.",
        "Specificity is three independent counts (IDs, classes/attributes/pseudo-classes, types/pseudo-elements). It is **not** base 10. Twelve classes still lose to one ID.",
        "A declaration in a later `@layer` beats one in an earlier layer no matter how specific the earlier selector was. For `!important` declarations this order is reversed.",
        "`:where()` contributes zero specificity. `:is()` and `:not()` take the specificity of their most specific argument, which surprises people."
      ]
    },
    {
      "t": "h2",
      "x": "First, confirm the declaration is even in the fight"
    },
    {
      "t": "p",
      "x": "**Before counting anything, verify the rule matches the element and the value parsed.** A declaration that the browser discarded never reaches the cascade, so no amount of specificity will rescue it. Open DevTools and look at the Styles panel for the element. If your rule is not listed there at all, it did not match. If it is listed but struck through, it matched and lost, and the rest of this article applies."
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match.** Run `document.querySelectorAll('.card .button').length` in the console. Zero means the structure is not what you think it is, often because a wrapper element sits between the two.",
        "**The value is invalid.** Browsers drop declarations they cannot parse, usually with a warning icon next to the property. A missing unit, `100` instead of `100px`, is the classic version.",
        "**A shorthand later in the same rule reset it.** `background-color: red` followed by `background: url(x.png)` loses the color, because the shorthand resets every longhand it owns.",
        "**The stylesheet did not load.** Check the Network panel for a 404 on the CSS file, and check that your build actually emitted the class you are using.",
        "**The property does not apply to that element.** `width` on an inline, non-replaced element does nothing. Neither does `justify-content` on a non-flex, non-grid container.",
        "**A media query, container query or `@supports` block excluded it.** These do not change specificity, but they do decide whether the rule participates."
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Fast sanity check",
      "x": "Temporarily add `outline: 3px solid lime` to the rule you think should be winning. If the outline appears, the selector matches and you have a cascade conflict. If nothing happens, you have a matching problem, which is a completely different investigation."
    },
    {
      "t": "h2",
      "x": "The cascade decides in a fixed order"
    },
    {
      "t": "p",
      "x": "When two declarations both set the same property on the same element, the browser walks through a sequence of comparisons and stops at the first one that separates them. Specificity sits near the end of that sequence. This is why a less specific selector sometimes wins, and why people conclude CSS is arbitrary."
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
          "1. Origin and importance",
          "User agent, user, and author styles, each split into normal and important",
          "Author `!important` beats normal author styles, but loses to user `!important`, which is how browser accessibility overrides keep working"
        ],
        [
          "2. Context",
          "Shadow tree versus outer document",
          "Outer-document normal styles beat shadow-tree normal styles for inherited properties; for important declarations the shadow tree wins"
        ],
        [
          "3. Element-attached styles",
          "`style=\"\"` attribute versus stylesheet rules",
          "An inline normal declaration beats any normal stylesheet rule regardless of specificity"
        ],
        [
          "4. Cascade layers",
          "Which `@layer` the declaration is in",
          "Later layer wins for normal declarations; unlayered normal styles beat all layered ones"
        ],
        [
          "5. Specificity",
          "The three selector counts",
          "Only consulted when everything above ties"
        ],
        [
          "6. Order of appearance",
          "Document position of the declaration",
          "Last one wins, which is why file order in your bundle matters"
        ]
      ],
      "caption": "The cascade stops at the first step that produces a winner. Specificity is step five of six."
    },
    {
      "t": "p",
      "x": "Two things sit outside this list. A running CSS transition overrides everything, including `!important`, for its duration. Animations sit above normal author declarations but below important ones, so an `!important` declaration will fight your `@keyframes` and win. If a value flickers or snaps back, suspect a transition or animation before you suspect the cascade."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "**Specificity is a triple, written here as (A,B,C).** A counts ID selectors. B counts classes, attribute selectors and pseudo-classes. C counts element types and pseudo-elements. The triple is compared left to right, and a higher A wins outright no matter what B and C contain. Combinators, the universal selector and `:where()` all contribute nothing."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,0) one class */\n.button { background: #2563eb; }\n\n/* (0,1,1) class plus element type */\nbutton.button { background: #7c3aed; }\n\n/* (0,2,0) two classes, beats both of the above */\n.card .button { background: #1e40af; }\n\n/* (1,0,0) a single ID beats any number of classes */\n#checkout .card .button:hover:focus { background: #991b1b; }"
    },
    {
      "t": "p",
      "x": "The common mistake is treating the triple as a three-digit number. It is not. Eleven classes give you (0,11,0), which still loses to (1,0,0). There is no carrying between columns, so you cannot out-class an ID. You can only match it with another ID, move the rule to a later cascade layer, or reach for `!important`."
    },
    {
      "t": "p",
      "x": "Functional pseudo-classes are the other trap. `:is()`, `:not()` and `:has()` all take the specificity of their most specific argument, even when the matching element did not involve that argument. `:where()` is the deliberately zero-specificity version, and it exists so library authors can ship defaults that are trivial to override."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,0,1): :where() adds nothing, so this is as easy to override as `a` */\n:where(.prose) a { color: var(--link); }\n\n/* (1,0,1): the #main argument sets the score, even for .content matches */\n:is(#main, .content) a { color: crimson; }\n\n/* (1,0,1): :not() behaves the same way */\nli:not(#first) { color: navy; }\n\n/* (0,2,0): a legitimate way to add weight without an ID */\n.button.button { background: seagreen; }"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Nesting and &",
      "x": "In native CSS nesting, the nested selector behaves like `:is(...)` of the parent selector list. So nesting a rule inside `#app, .app` gives the child rule (1,0,0) from the parent alone. If you nest inside long selector lists, specificity grows in ways that are easy to miss when reading the source."
    },
    {
      "t": "h2",
      "x": "Cascade layers change the question"
    },
    {
      "t": "p",
      "x": "`@layer` moved a whole class of conflicts out of the specificity argument. Layers are compared before specificity, so a one-class selector in a later layer beats an ID selector in an earlier one. Declare the order once at the top of your entry stylesheet and the priority of each bucket stops depending on how clever anyone was with selectors."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* The order of this statement is the order of priority, lowest first. */\n@layer reset, vendor, base, components, utilities;\n\n@layer components {\n  #sidebar .nav-link { color: navy; }   /* (1,1,0) */\n}\n\n@layer utilities {\n  .text-red { color: red; }             /* (0,1,0) but wins: later layer */\n}\n\n/* Unlayered normal declarations outrank every layer. Use sparingly. */\n.nav-link { color: green; }             /* this is what actually renders */"
    },
    {
      "t": "p",
      "x": "That last rule catches people out. Unlayered normal styles form an implicit final layer, so any stylesheet you forgot to wrap in `@layer` silently outranks your whole design system. When you adopt layers in an existing codebase, the usual move is to import third-party CSS into a low layer and leave your own application styles unlayered at first, then migrate inward."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "For important declarations the layer sequence runs backwards: an `!important` rule in your `reset` layer beats an `!important` rule in `utilities`, and important declarations in any layer beat unlayered important declarations. This is intentional, so that low-level layers can lock a value down, but it makes `!important` inside layered code genuinely hard to reason about."
    },
    {
      "t": "p",
      "x": "Layer support landed in the stable versions of Chrome, Firefox, Edge and Safari during the first half of 2022, so as of November 2026 it is safe for most audiences. Check your own analytics and caniuse before committing if you support long-lived embedded browsers. There is no useful polyfill, because the feature is about cascade order rather than syntax."
    },
    {
      "t": "h2",
      "x": "What !important actually does"
    },
    {
      "t": "p",
      "x": "`!important` does not raise specificity. It moves the declaration into a different origin bucket at step one of the cascade, which is why it feels absolute. Within that bucket the normal rules resume: two important author declarations are still compared by layer, then specificity, then source order. So `!important` versus `!important` is the same fight, one level up, and that is how escalation wars start."
    },
    {
      "t": "ul",
      "items": [
        "**Defensible uses:** overriding third-party CSS you cannot edit, a utility class whose entire job is to win, and print stylesheets fighting inline styles from a CMS.",
        "**Avoid it inside your own component styles.** If a component needs `!important` to beat another component, the two are competing at the wrong level and a layer boundary is the better fix.",
        "**An inline `!important` is close to unbeatable** by author CSS, since element-attached important styles outrank important stylesheet declarations. If a third-party widget writes `style=\"display: none !important\"`, you are usually stuck with a JavaScript fix.",
        "**`revert` and `revert-layer` are the quiet alternatives.** `revert` rolls a property back to the user-agent or user value, and `revert-layer` rolls it back to whatever the previous layer set, which is often exactly the escape hatch you wanted."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Hand control back to the layer below instead of escalating */\n@layer utilities {\n  .inherit-color { color: revert-layer; }\n}\n\n/* Nuclear option for a single element, scoped and legible */\n.print-only-reset {\n  all: revert;\n}"
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Select the element and read the Styles panel top to bottom",
          "x": "Browsers list matching rules in winning order, with losers struck through. The rule immediately above your struck-through declaration is the one beating it. That usually ends the investigation in about ten seconds."
        },
        {
          "title": "Confirm the computed value",
          "x": "The Computed tab shows what the element ended up with, and expanding a property reveals which rule supplied it. This matters for inherited properties, where the winning declaration lives on an ancestor and will not appear in the element's own rule list.",
          "code": "getComputedStyle(document.querySelector('.button')).backgroundColor"
        },
        {
          "title": "Check whether you are fighting the right element",
          "x": "Padding on a button that visually does nothing is often padding on a wrapper, or a child with its own background covering the parent. Toggle the rule off and watch what moves."
        },
        {
          "title": "Look for layers and origin in the panel",
          "x": "Chrome and Safari DevTools show the `@layer` a rule belongs to, and inline styles appear as an `element.style` block at the top. If the winner is `element.style`, your fix is in the JavaScript that set it, not in CSS."
        },
        {
          "title": "Fix it at the lowest level that works",
          "x": "In order of preference: make the selector match correctly, move the rule to the appropriate layer, add a second class to the selector, and only then consider `!important`. Each step down that list costs the next person more time."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Keeping specificity flat on purpose"
    },
    {
      "t": "p",
      "x": "Specificity wars are a symptom of selectors that encode position rather than intent. The long-standing fix is to keep nearly every selector at a single class, which keeps every rule at (0,1,0) and makes source order the only tiebreaker. Utility-first frameworks get their predictability from exactly this property, not from anything clever. Tailwind CSS v4, for example, ships its own styles inside native cascade layers so that utilities land above your component CSS without specificity tricks."
    },
    {
      "t": "ul",
      "items": [
        "Avoid IDs in selectors. Keep `id` attributes for fragment links, `label[for]` and JavaScript hooks.",
        "Wrap third-party CSS in a low layer at import time: `@import url(vendor.css) layer(vendor);`",
        "Use `:where()` for library and reset defaults so consumers can override with a single class.",
        "Prefer custom properties for theming. Changing a variable on a scope avoids the override question entirely, since there is only ever one declaration to win.",
        "Treat a long descendant selector as a code smell worth a comment explaining why it needs that weight."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing a layout module, with the sizing details that cause overflow bugs.",
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
          "desc": "The same style of diagnosis applied to stale state and render timing.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even with !important?",
          "a": "Four common reasons. The selector does not match, so the declaration is not in the cascade at all. The value is invalid and was dropped. A competing declaration is also important and wins on layer order, specificity or source order. Or the winning value comes from an inline style attribute with its own !important, which outranks important stylesheet rules. Check DevTools: if your rule is not listed for the element, importance is irrelevant."
        },
        {
          "q": "Does !important override inline styles?",
          "a": "An !important declaration in a stylesheet does beat a normal inline style, because importance is compared before element-attached styles. It does not beat an inline style that is itself marked !important. For that case you have to remove or override the attribute in JavaScript, since author CSS has nothing left to escalate to."
        },
        {
          "q": "How do I override an ID selector without using !important?",
          "a": "Three options. Match the ID count with your own ID selector, which keeps the problem but makes it symmetrical. Put your rule in a later cascade layer, since layers are compared before specificity and a single class in a later layer wins. Or borrow specificity explicitly with :is(#some-id, .my-class), which reads as a deliberate choice rather than an accident."
        },
        {
          "q": "Do media queries or @supports increase specificity?",
          "a": "No. Conditional group rules decide whether their contents apply, and nothing more. If a rule inside a media query appears to beat an identical rule outside one, the real reason is source order: the media query usually comes later in the file. Move it earlier and the behaviour flips, which is a useful way to confirm the diagnosis."
        },
        {
          "q": "Which rule wins when two selectors have the same specificity?",
          "a": "The one that appears later in document order, counting across stylesheets in the order the browser loaded them. That makes bundler and import order part of your cascade. If a rule wins locally but loses in production, compare the order of declarations in the built CSS rather than in your source tree."
        },
        {
          "q": "Is calculating specificity as a number like 0-1-2 wrong?",
          "a": "The three-part notation is fine. Collapsing it into a single base-10 number is wrong, because the columns never carry. Ten classes are (0,10,0) and still lose to one ID at (1,0,0). Any tool or explanation that adds the columns into 010 will give you the right answer for small selectors and the wrong answer exactly when you need it."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-23",
  "updated": "2026-11-23",
  "author": "jackson",
  "related": []
};
