module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "Why a CSS rule loses: specificity scoring, cascade layers, !important and the origin order that decides which declaration wins.",
  "standfirst": "Specificity is usually not the reason. Here is the order a browser really resolves declarations in, and the checks that find the actual cause in about a minute.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "The cascade order browsers really use, why one ID beats any number of classes, and how layers invert !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is the fourth thing a browser compares, not the first. Origin, importance, inline styles and cascade layer all come before it.",
        "Specificity is three numbers, not one. IDs, then classes and attributes and pseudo-classes, then element types. The columns never carry, so a single ID beats a hundred classes.",
        "Many rules that look outranked were never in the running. The selector did not match, the value was invalid and got dropped, or the property does not apply to that kind of box.",
        "An `!important` declaration in a stylesheet beats a `style` attribute. Without editing the HTML, that is the only straightforward way to win against inline styles.",
        "Cascade layers reverse for `!important`: an earlier layer beats a later one, and unlayered important declarations rank below every layered one."
      ]
    },
    {
      "t": "h2",
      "x": "First, prove the rule is even matching"
    },
    {
      "t": "p",
      "x": "**Before reasoning about specificity, check that the browser ever considered your rule.** Select the element in DevTools and look for your selector in the Styles pane. If it is not listed there, nothing was outranked. The rule did not match, or the stylesheet did not load."
    },
    {
      "t": "p",
      "x": "Three console checks settle it quickly. The first asks whether the selector matches anything on the page. The second asks whether it matches the element you have selected, since `$0` in Chrome and Firefox refers to the currently inspected node. The third reads back the value that won."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Does the selector match anything at all?\ndocument.querySelectorAll('.card > .title').length\n\n// Does it match the element selected in DevTools?\n$0.matches('.card > .title')\n\n// What value actually won on that element?\ngetComputedStyle($0).getPropertyValue('color')"
    },
    {
      "t": "p",
      "x": "A zero from the first line usually means a structural assumption is wrong. `.card > .title` needs `.title` to be a direct child, and a wrapper element added by a component library breaks it silently. CSS has no error reporting for a selector that matches nothing, which is why this failure mode survives so long."
    },
    {
      "t": "p",
      "x": "One more trap lives in selector lists. If any selector in a comma-separated list is invalid, the whole rule is thrown away, including the parts that were fine. `:is()` and `:where()` are forgiving, so they absorb an unknown selector instead of killing the rule around it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* One bad selector, and the color never applies to either element. */\n.title, ::-moz-nonsense {\n  color: rebeccapurple;\n}\n\n/* Forgiving: the unknown selector is ignored, the rest still works. */\n:is(.title, ::-moz-nonsense) {\n  color: rebeccapurple;\n}"
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a tuple of three counts, written here as (A,B,C). A counts ID selectors. B counts classes, attribute selectors and pseudo-classes. C counts element types and pseudo-elements. Comparison is lexicographic: A decides, and only if A ties does B matter."
    },
    {
      "t": "p",
      "x": "That is why the old advice about ten classes beating an ID is wrong. No base-10 arithmetic is involved and nothing carries between columns. (0,100,0) still loses to (1,0,0)."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#nav a                     /* (1,0,1) */\n.nav .item a.active        /* (0,3,1) */\na.active.current.featured  /* (0,3,1)  ties with the line above */\nul li a                    /* (0,0,3) */\n\n:where(#nav) a             /* (0,0,1)  :where() always contributes zero */\n:is(#nav, .nav) a          /* (1,0,1)  :is() takes its strongest argument */\n:not(.a, #b) span          /* (1,0,1)  :not() does the same */\n\n[data-state=\"open\"]        /* (0,1,0)  attribute selectors count as classes */\n:hover                     /* (0,1,0)  so do pseudo-classes */\n::before                   /* (0,0,1)  but pseudo-elements count as types */"
    },
    {
      "t": "p",
      "x": "`:where()` is the useful one for library authors. It lets you ship defaults at zero specificity that any consumer rule can override, with no `!important` and no selector arms race. `:is()` is the opposite: convenient for grouping, but it quietly raises a rule to the specificity of its strongest argument."
    },
    {
      "t": "p",
      "x": "Native nesting has the same edge. A nested selector takes the specificity of `:is()` applied to the parent selector list, so nesting inside `.card, #promo` lands at (1,0,0) even when you are styling a plain class. Flat selectors are easier to predict than deep ones."
    },
    {
      "t": "h2",
      "x": "Specificity is the fourth tie-break"
    },
    {
      "t": "p",
      "x": "The cascade runs through several comparisons in a fixed order, and it stops at the first one that separates two declarations. Specificity sits fairly late in that list. If a declaration lost on origin, importance or layer, its selector could be as sharp as you like and it would still lose."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What it decides"
      ],
      "rows": [
        [
          "Origin and importance",
          "An author `!important` declaration beats every normal author declaration, whatever the specificity. A user `!important` rule beats both, which is how accessibility overrides work."
        ],
        [
          "Inline `style` attribute",
          "Beats any normal rule from a stylesheet, regardless of selector. It does not beat an `!important` rule."
        ],
        [
          "Cascade layer",
          "A later layer beats an earlier one. Unlayered normal declarations beat every layer. The order inverts for `!important`."
        ],
        [
          "Specificity",
          "Compared only between declarations that tied on everything above."
        ],
        [
          "Scope proximity",
          "Breaks ties between equally specific `@scope` rules. The nearer scope root wins."
        ],
        [
          "Order of appearance",
          "The last matching declaration in source order wins. A tie always ends here."
        ]
      ],
      "caption": "Simplified cascade order, strongest first. Running transitions and animations sit outside this list and can override all of it while they are active."
    },
    {
      "t": "p",
      "x": "That last row explains a whole category of build-order bug. Two rules of identical specificity, in two different files, resolve by whichever file the bundler emitted last. Change an import order, or let a code-splitting change reorder your chunks, and the winner flips with no CSS edit at all."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "If the element is in a shadow tree",
      "x": "Your page rules may not reach it in the first place. Styles do not cross a shadow boundary, so you need `::part()`, `::slotted()`, an inherited property, or a custom property the component reads. No amount of specificity opens that door."
    },
    {
      "t": "h2",
      "x": "Cascade layers, and why !important runs backwards in them"
    },
    {
      "t": "p",
      "x": "`@layer` exists to stop specificity fights. Declare the order once, and a later layer wins over an earlier one no matter how weak its selectors are. A single class in a late layer can override an ID selector in an early one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order up front. Later layers win. */\n@layer reset, vendor, components, utilities;\n\n@layer components {\n  #sidebar .button { background: rebeccapurple; }  /* (1,1,0), still loses */\n}\n\n@layer utilities {\n  .bg-white { background: #fff; }                  /* (0,1,0), wins */\n}\n\n/* Unlayered styles beat every normal declaration in every layer. */\n.button { background: black; }"
    },
    {
      "t": "p",
      "x": "The part that catches people is what happens once you add `!important`. For important declarations the layer order reverses, and unlayered important declarations drop to the bottom instead of rising to the top."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base, overrides;\n\n@layer base      { .title { color: red !important; } }   /* this one wins */\n@layer overrides { .title { color: blue !important; } }\n\n.title { color: green !important; }  /* unlayered important: weakest here */"
    },
    {
      "t": "p",
      "x": "There is a reason for the inversion. It lets a reset or base layer protect something it genuinely must keep, and stops later convenience layers from stomping on it. It also means sprinkling `!important` through a layered codebase produces results that feel random until you know the rule. Cascade layers shipped across the major browsers during the first half of 2022, but check caniuse against your own support floor before relying on them."
    },
    {
      "t": "h2",
      "x": "Beating an inline style"
    },
    {
      "t": "p",
      "x": "A `style` attribute outranks every selector-based rule in the author origin. Specificity does not enter into it, so writing `html body #widget.widget` changes nothing. The one reliable override from CSS is `!important`."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* <div id=\"widget\" style=\"display: none\"> injected by a third-party script */\n\n#widget { display: block; }             /* loses to the attribute */\n.widget { display: block !important; }  /* wins, despite the weaker selector */"
    },
    {
      "t": "p",
      "x": "This is the clearest legitimate use of `!important`. If a widget or a framework writes inline styles at runtime, you have no selector to outrank and no HTML to edit. Worth knowing: if the script rewrites that attribute on every render, CSS is not your fix. Intervene in the script instead."
    },
    {
      "t": "h2",
      "x": "Sometimes the selector is fine and the declaration is not"
    },
    {
      "t": "p",
      "x": "A declaration with an invalid value is dropped at parse time. The rest of the block survives, which makes the failure look selective and confusing. DevTools marks these with a warning triangle, and that triangle is easy to miss next to a dozen other declarations."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".panel {\n  width: 100%;\n  padding: 16;      /* dropped: a length needs a unit */\n  colour: #333;     /* dropped: not a property */\n  color: #33;       /* dropped: a hex color needs 3, 4, 6 or 8 digits */\n  gap: 1rem;        /* parsed fine, but ignored unless .panel is flex or grid */\n}"
    },
    {
      "t": "p",
      "x": "The last line is a different failure: valid CSS with no effect on that element. The same thing happens with `width` on a non-replaced inline element, `vertical-align` on a block, `flex-grow` on a child of a non-flex container, and `z-index` on an element whose `position` is still `static`."
    },
    {
      "t": "ul",
      "items": [
        "**A shorthand later in the file reset your longhand.** `background: red` after `background-image: url(...)` wipes the image, because the shorthand sets every background longhand back to its initial value.",
        "**You styled an ancestor with a property that does not inherit.** `color` and `font-family` inherit. `border`, `padding`, `background` and `display` do not.",
        "**The rule sits inside a `@media` or `@supports` block that does not apply.** Unmatched conditional blocks are simply absent from the Styles pane, so there is nothing to strike through.",
        "**The old stylesheet is still in the browser cache**, or a hashed filename changed and the HTML still references the previous one. Check the Network panel, not the CSS.",
        "**A transition or animation is holding the value.** Animated values override normal declarations while they run, so an element can sit visibly at a value no rule in your file sets."
      ]
    },
    {
      "t": "h2",
      "x": "A diagnostic order that gets there faster"
    },
    {
      "t": "p",
      "x": "Work through these in sequence. Each step rules out a whole class of cause, which is why it beats guessing."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Does the rule appear in the Styles pane at all?",
          "x": "Select the element and scan for your selector. Absent means it did not match, or the stylesheet is not loaded. Present means you have a cascade question rather than a matching question."
        },
        {
          "title": "Is the property struck through?",
          "x": "A strike-through means something else won. Chrome DevTools links the winner from the Computed pane: expand the property and click the arrow next to the rule that set it."
        },
        {
          "title": "Read the winner's selector and origin",
          "x": "Note whether it carries `!important`, lives in a layer, comes from `element.style`, or is a user-agent default. That tells you which comparison you lost, which tells you what to change.",
          "code": "getComputedStyle($0).color  // the computed value, not the author value"
        },
        {
          "title": "Check for a warning icon beside your own declaration",
          "x": "That is the parser telling you the value was invalid and dropped, or that the property does not apply to this element."
        },
        {
          "title": "Fix the cause, not the symptom",
          "x": "If you lost on layer order, move the rule or adjust the `@layer` statement. If you lost on specificity, match the winner's shape instead of piling on selectors. Reach for `!important` only when you are fighting an inline style or a stylesheet you cannot change."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A quick sanity check",
      "x": "Set `outline: 2px solid red` on the selector you are debugging. If no outline appears, the selector is wrong and no amount of cascade reasoning will help. It is a cheaper test than reading three stylesheets."
    },
    {
      "t": "h2",
      "x": "Using !important without regret"
    },
    {
      "t": "p",
      "x": "`!important` is not evil, it is just loud. The problem is that it moves a declaration into a separate comparison where the only way to beat it is another `!important`, and that escalation has nowhere to go. Two or three rounds in, nobody can predict the outcome by reading the code."
    },
    {
      "t": "p",
      "x": "Reasonable uses: overriding runtime inline styles, pinning a utility class that must always win, patching a vendor stylesheet you do not control, and temporary debugging. Unreasonable uses: winning an argument with your own components, or compensating for selectors that grew too specific. For that second case, a cascade layer or `:where()` fixes the structure rather than the symptom."
    },
    {
      "t": "p",
      "x": "The underlying habit is worth more than any single rule. Keep selectors flat, keep IDs out of stylesheets, declare your layer order in one place, and the cascade stops being something you fight. Layout choices feed into this too: a predictable structure built with [Grid or Flexbox](/guides/css-grid-vs-flexbox/) usually needs fewer descendant selectors to target, which means fewer collisions later."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "A decision rule for picking a layout module, plus the details that prevent overflow bugs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against the WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same kind of debugging problem one layer up: the code looks right and the value is stale.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guide"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three common reasons. Another `!important` declaration is beating yours, in which case specificity and source order are compared among the important declarations only. Or you are in a cascade layer, where the layer order reverses for important declarations and an earlier layer wins. Or the rule never matched the element, which `!important` cannot fix. Check whether your declaration appears in the DevTools Styles pane before anything else."
        },
        {
          "q": "Do ten classes beat one ID in CSS?",
          "a": "No. Specificity compares the ID count first and moves to the class count only if the IDs tie, so (0,10,0) loses to (1,0,0). The idea that specificity is a base-10 number is a persistent myth from older articles, and it predicts the wrong winner as soon as the counts get large."
        },
        {
          "q": "How do I override an inline style without !important?",
          "a": "From a stylesheet, you cannot. A `style` attribute outranks every selector-based normal declaration in the author origin, so no selector is specific enough. The alternatives are to stop the inline style being written in the first place, remove the attribute with JavaScript, or use `!important`."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, for normal declarations. Layer order is compared before specificity, so a low-specificity rule in a later layer beats a high-specificity rule in an earlier one. Unlayered normal declarations beat everything in any layer. That is exactly why layers are useful: they let you order stylesheets by intent instead of by selector strength."
        },
        {
          "q": "How do I find which CSS rule is winning in DevTools?",
          "a": "Select the element, open the Computed pane, expand the property you care about, and follow the arrow next to the rule listed there. It jumps to the declaration that won. The Styles pane then shows the losers as struck-through text in cascade order, which usually makes the reason obvious."
        },
        {
          "q": "Does :is() affect specificity?",
          "a": "Yes. `:is()` takes the specificity of its most specific argument, so `:is(#promo, .card) p` scores (1,0,1) even when you only meant to match `.card p`. `:where()` matches identically but always contributes zero, which makes it the safer choice for defaults you want consumers to override."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-02",
  "updated": "2026-10-02",
  "author": "jackson",
  "related": []
};
