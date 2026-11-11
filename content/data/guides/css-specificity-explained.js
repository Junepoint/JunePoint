module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers and !important",
  "eyebrow": "CSS",
  "description": "Why a CSS rule does not apply: how specificity is calculated, how cascade layers and !important change the result, and a debugging order that works.",
  "standfirst": "Specificity gets blamed for most overridden styles, and it is usually innocent. Here is the order the browser actually resolves declarations in, and how to find the one that beat yours.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "The real order the cascade resolves declarations in, and how to find the rule that beat yours.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Check that the rule matches and the declaration is valid before you count selectors. A dropped property and a lost specificity contest look identical in the browser and completely different in DevTools.",
        "Specificity is three numbers compared left to right: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. One ID beats any number of classes.",
        "Cascade layers are sorted **before** specificity. A `div` selector in a later layer beats an `#id` selector in an earlier one.",
        "`!important` does not raise specificity. It moves the declaration into a higher bucket, reverses layer order, and makes the rule much harder to override later.",
        "An inherited value loses to any rule that matches the element directly, including `* { }`. Specificity is never compared across elements."
      ]
    },
    {
      "t": "h2",
      "x": "First: is anything actually overriding it?"
    },
    {
      "t": "p",
      "x": "**Open DevTools, select the element, and look at whether your declaration appears at all.** There are only three possibilities, and they need different fixes."
    },
    {
      "t": "p",
      "x": "If the declaration shows with a line through it, something won the cascade and you have an override problem. If it shows with a warning icon next to it, the browser parsed the property or value and threw it away. If the rule does not appear in the panel at all, the selector never matched this element, or the stylesheet never loaded."
    },
    {
      "t": "p",
      "x": "That third case is the one people waste the most time on. A missing build output, a scoped-styles hash that no longer matches, a typo in a class name, a component that renders `className` into a prop the library ignores: none of these are specificity problems, and no amount of selector surgery fixes them. Confirm the rule is in the Styles panel before you touch it."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "The fastest triage in DevTools",
      "x": "Use the **Computed** tab rather than Styles. Expand the property you care about and it lists every declaration that matched, in winning order, with a link to each source. If your rule is not in that list, it did not match. If it is second, you can click straight through to whatever beat it."
    },
    {
      "t": "p",
      "x": "Invalid declarations are quietly dropped per declaration, not per rule, which is why a block can half-apply. A typo in one line leaves the rest of the block working. Chrome marks the bad line with a triangle; Firefox labels it as an unknown property or an invalid value in its rules panel."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".card {\n  color: red;              /* applies */\n  padding: 12;             /* dropped: unitless length is invalid */\n  background: var(--bg);   /* dropped at computed-value time if --bg is unset */\n  border-radius: 8px;      /* applies */\n}"
    },
    {
      "t": "p",
      "x": "The `var()` line deserves its own warning. A custom property that resolves to something invalid at computed-value time does not fall back to the previous declaration. It falls back to the inherited value, or to the initial value if the property does not inherit. So a misspelled custom property on a `background` can give you a transparent box rather than the earlier `background: white` you expected to still be in play."
    },
    {
      "t": "h2",
      "x": "How specificity is calculated"
    },
    {
      "t": "p",
      "x": "Specificity is a three-part value, often written `(a, b, c)`. Count the selector once, then compare the three numbers left to right. The first difference decides it, and there is no carrying: `(0, 1, 0)` beats `(0, 0, 99)` outright."
    },
    {
      "t": "table",
      "head": [
        "Position",
        "Counts",
        "Does not count"
      ],
      "rows": [
        [
          "a (IDs)",
          "`#main`",
          "Nothing else reaches this position"
        ],
        [
          "b (classes)",
          "`.btn`, `[type=\"text\"]`, `:hover`, `:nth-child()`",
          "`:where()`"
        ],
        [
          "c (types)",
          "`div`, `a`, `::before`, `::placeholder`",
          "`*`, combinators (`>`, `+`, `~`, descendant)"
        ]
      ],
      "caption": "The universal selector and combinators contribute nothing. Pseudo-elements count as a type; pseudo-classes count as a class."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* All of these match <a class=\"btn primary lg\" id=\"save\" href=\"#\"> */\n\n#save                  { color: red; }    /* (1,0,0) */\na.btn.primary.lg:hover { color: blue; }   /* (0,4,1) */\nnav a[href]            { color: green; }  /* (0,1,1) */\n\n/* red wins. One ID outranks four classes, and always will. */"
    },
    {
      "t": "p",
      "x": "Two details catch people out. `:is()` and `:not()` take the specificity of their single most specific argument, so `:not(.a)` counts as a class and `:is(#x, p)` counts as an ID even when it matched the `p`. `:where()` is the deliberate escape hatch: it always contributes zero, no matter what is inside it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,1): .sidebar contributes its class weight */\n:is(.sidebar, main) h2 { margin-top: 0; }\n\n/* (0,0,1): overridable by a single class anywhere */\n:where(.sidebar, main) h2 { margin-top: 0; }"
    },
    {
      "t": "p",
      "x": "The second detail is that specificity is a tiebreaker, not a ranking of rules. It is consulted only after origin, importance and layer order have already been compared, and only between declarations that survived those rounds. Which is why a correct specificity calculation sometimes predicts the wrong winner."
    },
    {
      "t": "h2",
      "x": "The order the cascade really uses"
    },
    {
      "t": "p",
      "x": "**Specificity is step four, not step one.** The browser sorts competing declarations for a property roughly like this, stopping at the first step that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Browser defaults, user stylesheets and your stylesheets are separate buckets, and `!important` moves a declaration between them.",
        "**Element-attached styles.** A `style` attribute beats any selector of the same importance.",
        "**Cascade layers.** Later layers beat earlier ones for normal declarations. Unlayered styles beat all layers.",
        "**Specificity.** Only now do the three numbers get compared.",
        "**Order of appearance.** Last one in document and stylesheet order wins the tie."
      ]
    },
    {
      "t": "p",
      "x": "Written out as a single precedence ladder, from weakest to strongest, it looks like the table below. It is worth reading once, because two rows in it surprise almost everyone: CSS animations outrank your normal declarations, and transitions outrank even `!important`."
    },
    {
      "t": "table",
      "head": [
        "Strength",
        "Source",
        "Practical note"
      ],
      "rows": [
        [
          "1 (weakest)",
          "Browser default styles",
          "Normal user-agent rules. Easy to override."
        ],
        [
          "2",
          "User stylesheet, normal",
          "Extensions, OS-level user CSS."
        ],
        [
          "3",
          "Author normal, layered",
          "Earlier layers are weaker than later ones."
        ],
        [
          "4",
          "Author normal, unlayered",
          "Your ordinary stylesheet beats every layer."
        ],
        [
          "5",
          "Inline `style` attribute",
          "Still beaten by anything in the rows below."
        ],
        [
          "6",
          "CSS animations",
          "A running `@keyframes` overrides normal declarations."
        ],
        [
          "7",
          "Author `!important`",
          "Layered important beats unlayered important."
        ],
        [
          "8",
          "User `!important`",
          "This is why user accessibility overrides work."
        ],
        [
          "9",
          "Browser `!important`",
          "A short list, mostly form and security related."
        ],
        [
          "10 (strongest)",
          "CSS transitions",
          "A transition in flight wins outright, briefly."
        ]
      ],
      "caption": "Declaration precedence in the CSS cascade, weakest first. Importance is compared before specificity, so nothing in a lower row can be fixed by adding selectors."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Why your !important loses to a transition",
      "x": "If a property is mid-transition, the transitioned value wins over everything, including author `!important`. This is temporary and ends when the transition does, but it makes for a convincing bug report: the style is correct in the inspector and wrong on screen for a few hundred milliseconds. Check for a `transition` on the property before assuming your rule is the problem."
    },
    {
      "t": "p",
      "x": "Note also that `!important` inside `@keyframes` is ignored entirely. The specification says so and browsers follow it, so there is no point reaching for it when an animation will not take effect."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the feature that most changes the old mental model. Layer order is decided by where the layer is first named, not by where the rules inside it live, and layer order is compared before specificity. A single type selector in a late layer beats an ID selector in an early one."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, at the top. This line decides everything. */\n@layer reset, framework, components, utilities;\n\n@layer framework {\n  #page .article h1 { font-size: 2rem; }  /* (1,1,1) */\n}\n\n@layer utilities {\n  h1 { font-size: 3rem; }                 /* (0,0,1) */\n}\n\n/* 3rem wins: utilities is a later layer, so specificity is never compared. */"
    },
    {
      "t": "p",
      "x": "This is the point of the feature. You import a framework into an early layer, and your own one-class overrides stop needing to out-specify it. No `#id #id .class` arms race, no `!important` just because a vendor used three classes."
    },
    {
      "t": "p",
      "x": "Two behaviours to internalise. Unlayered normal styles are the strongest normal author styles, stronger than every layer, so a stray rule outside your layers can quietly override a whole design system. And for important declarations the layer order flips: layered important beats unlayered important, and the earliest layer wins. That inversion is intentional, and it means a reset layer using `!important` is harder to override than it looks."
    },
    {
      "t": "p",
      "x": "`@layer` has shipped in Chrome, Edge, Firefox and Safari since early 2022, so it is safe for most projects as of November 2026, but confirm against your own support matrix and analytics before relying on it. There is no graceful degradation: a browser that does not understand `@layer` drops the whole block, which means the styles vanish rather than merely losing order."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layers are not scoping",
      "x": "A layer changes precedence, not matching. Rules inside a layer still apply to every element they match across the page. If you want proximity-based containment instead, that is `@scope` or a component-level convention, and `@scope` is considerably newer than `@layer`, so check current browser support before depending on it."
    },
    {
      "t": "h2",
      "x": "What !important actually costs"
    },
    {
      "t": "p",
      "x": "`!important` does not add specificity. It takes the declaration out of the normal competition and puts it in a bucket that normal declarations cannot reach at all. Within that bucket, specificity and source order still decide, which is the part that makes `!important` so unpleasant to live with: once two rules both use it, you are back to the same contest, one level up, with fewer options."
    },
    {
      "t": "p",
      "x": "There are legitimate uses. Utility classes that must win by design, a user stylesheet enforcing an accessibility preference, a one-line fix against third-party CSS you cannot edit. The problem is not the keyword. It is reaching for it as the first response to an override you have not diagnosed, because it works immediately and leaves the next person with a worse version of your problem."
    },
    {
      "t": "p",
      "x": "Before you use it, the cheaper options in rough order of preference:"
    },
    {
      "t": "ul",
      "items": [
        "Put the rule you want to lose into an earlier `@layer`, or the rule you want to win into a later one.",
        "Lower the specificity of the losing rule with `:where()` rather than raising yours.",
        "Move your rule later in source order, if the specificity is already equal.",
        "Add one real class that describes the state, instead of stacking selectors to win on points.",
        "Duplicate a class in the selector (`.btn.btn`) if you need exactly one more step and cannot change load order. It is ugly and honest, which beats `!important`."
      ]
    },
    {
      "t": "p",
      "x": "And if you must override someone else's `!important`, you need your own, with higher specificity or later source order. There is no way around it from a normal declaration. Record why in a comment, because this is precisely the line that someone deletes during a cleanup in eight months."
    },
    {
      "t": "h2",
      "x": "Inheritance is not a weak match"
    },
    {
      "t": "p",
      "x": "**Any declaration that matches the element directly beats an inherited value, regardless of specificity.** This trips people up constantly, and it is not a specificity rule at all. Inheritance only supplies a value when nothing matched the element for that property."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#wrapper { color: rebeccapurple; }  /* (1,0,0), applies to #wrapper */\np        { color: black; }           /* (0,0,1), applies to each <p> */\n\n/* <div id=\"wrapper\"><p>...</p></div>\n   The paragraph is black. The ID rule never competed:\n   it set a color on the div, which the p would only\n   have inherited had nothing matched the p itself. */"
    },
    {
      "t": "p",
      "x": "The related trap is properties that do not inherit at all. `border`, `padding`, `background` and `display` are not inherited, so setting them on a parent and expecting children to pick them up will fail silently. `inherit` as an explicit value forces it where you genuinely want it."
    },
    {
      "t": "p",
      "x": "Shorthands are the other quiet source of this. `background: blue` resets `background-image`, `background-position` and the rest of the longhands to their initial values, including ones you set in an earlier rule. If a longhand keeps disappearing, search for a shorthand that writes the same family later in the cascade."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the rule reached the browser",
          "x": "Search for the selector in the Sources or Network panel, not in your editor. A stale build, an unprocessed import or a cached bundle explains more mystery overrides than the cascade does."
        },
        {
          "title": "Check the Computed tab for the property",
          "x": "Expand the property and read the ordered list of matched declarations. This answers 'did it match' and 'what beat it' in one look, and links to the source of the winner."
        },
        {
          "title": "Look for a warning icon on the declaration",
          "x": "If the property or value was invalid, it was dropped before any cascade comparison happened. Unitless lengths, misspelled keywords and unresolved `var()` references all land here."
        },
        {
          "title": "Identify the winner's bucket before its specificity",
          "x": "Is it inline? Important? In a later layer? Each of those beats you regardless of selector weight, and each has a different fix."
        },
        {
          "title": "Only now compare specificity",
          "x": "Count IDs, then classes, then types. If you are close but losing, prefer lowering the other rule with `:where()` over raising yours.",
          "code": "/* Make a framework rule trivially overridable */\n:where(.framework .btn) { padding: 0.5rem 1rem; }"
        },
        {
          "title": "Verify the element matches what you think it does",
          "x": "Run the selector in the console to see what it actually hits. If the count is zero, the problem was never the cascade.",
          "code": "document.querySelectorAll('nav > a.btn:not(.disabled)').length"
        }
      ]
    },
    {
      "t": "p",
      "x": "One more class of failure sits outside all of this: the property applies, wins the cascade, and still does nothing, because it is meaningless for that element's layout. `width` on a non-replaced inline element, `vertical-align` on a block, `z-index` without a positioning or stacking context, `gap` on a container that is neither flex nor grid. The Computed tab will show your value happily set and the element ignoring it. If a declaration wins and nothing changes, question whether the property applies to that box rather than whether the cascade cheated."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module to reach for, and the sizing details that cause overflow bugs.",
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
          "desc": "The same shape of problem one layer up: the value is set, and the render disagrees.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector is correct?",
          "a": "Check the Computed tab in DevTools for that property. If your declaration is not listed among the matched rules, the selector did not match this element or the stylesheet did not load. If it is listed but struck through, read the rule above it: that is the winner, and its bucket (inline, important, later layer) tells you the fix. If it is listed with a warning icon, the value was invalid and was dropped before any comparison happened."
        },
        {
          "q": "Does an ID always beat a class in CSS?",
          "a": "Within the same origin, importance and cascade layer, yes. One ID beats any number of classes, because the three specificity numbers are compared left to right with no carrying. Across layers it is not true at all: a type selector in a later layer beats an ID selector in an earlier one, because layer order is compared before specificity."
        },
        {
          "q": "How do I override !important without using !important?",
          "a": "From a normal declaration in the same origin, you cannot. Importance is sorted before specificity, so no selector is strong enough. The real options are to remove the !important at its source, use !important yourself with higher specificity or later source order, or restructure the rules into layers. In a user stylesheet or browser extension, a user !important does outrank an author one."
        },
        {
          "q": "What is the specificity of :is(), :where() and :not()?",
          "a": "The :is() and :not() pseudo-classes take the specificity of their most specific argument, so :is(#id, p) counts as an ID even when it matched the p. :where() always contributes zero, which makes it the standard way to publish rules you want consumers to override with a single class."
        },
        {
          "q": "Do cascade layers beat specificity?",
          "a": "Yes, for normal declarations. Layer order is compared first, so specificity only breaks ties within the same layer. Unlayered styles are stronger than every layer. For !important declarations the layer order reverses: layered important beats unlayered important, and the earliest layer wins."
        },
        {
          "q": "Why does my inline style attribute lose to a stylesheet rule?",
          "a": "Because importance is compared before element-attached styles. A style attribute beats any selector of the same importance, but an author rule with !important beats a normal inline style. Adding !important inside the style attribute puts it back on top of ordinary author rules."
        },
        {
          "q": "Why does the computed value look right but the element look wrong?",
          "a": "Usually because the property does not apply to that box, or something else is painting over it. width on a non-replaced inline element, z-index without a stacking context, or gap on a block container all compute fine and do nothing. A transition in flight is another candidate, since transitions outrank even !important for as long as they run."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-11",
  "updated": "2026-11-11",
  "author": "jackson",
  "related": []
};
