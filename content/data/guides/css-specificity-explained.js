module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, the cascade and !important",
  "eyebrow": "CSS",
  "description": "Work out why a CSS declaration loses: selector weight, cascade layers, inline styles, !important, and the order the browser actually applies.",
  "standfirst": "Specificity is only one of six steps the browser works through, and it is not the first. Knowing the order tells you which fix will work and which will just start a specificity war.",
  "keywords": [
    "css specificity",
    "css not applying",
    "css important override",
    "cascade layers",
    "css cascade order"
  ],
  "cardDesc": "A debugging order for overridden CSS: matching, layers, specificity, source order and !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before blaming specificity, confirm the rule matches and the declaration is valid. A dropped value and a lost cascade battle look identical on the page, but DevTools shows them differently.",
        "Specificity is three independent counts, written `ID, class, type`. Compare them left to right. Eleven classes never beat one ID.",
        "**Cascade layers are checked before specificity.** A single class in a later layer beats an ID selector in an earlier one.",
        "`!important` reverses the normal order of origins and layers rather than switching it off, which is why two competing `!important` rules still need a tie-break.",
        "Reach for `:where()` to write zero-specificity defaults. It is usually a better fix than adding selectors."
      ]
    },
    {
      "t": "h2",
      "x": "First question: is the rule even matching?"
    },
    {
      "t": "p",
      "x": "**Most “specificity problems” are not specificity problems.** They are selectors that match nothing, or declarations the parser threw away. Check this before you touch a selector, because the fix is completely different."
    },
    {
      "t": "p",
      "x": "Open the element in DevTools and look at the Styles pane. If your rule is listed with the declaration struck through, it matched and lost: that is a cascade question. If the rule is not listed at all, the selector did not match. If the rule is listed but one property inside it is struck through with a warning triangle, the value was invalid and discarded at parse time."
    },
    {
      "t": "p",
      "x": "That third case catches people constantly. CSS discards invalid declarations individually and silently carries on. A stray unit on a `line-height` you meant to be unitless, a malformed `calc()`, `width: 100%` on an element whose `display` is `inline`: none of these produce an error anywhere except the Styles pane."
    },
    {
      "t": "ul",
      "items": [
        "A descendant combinator where you wanted a child. `.card p` also matches paragraphs nested three levels deeper inside a widget you forgot about.",
        "A property that does not apply to the element’s box type. `width`, `height` and vertical padding behave differently on non-replaced inline elements.",
        "A property that is not inherited. Setting `border` on a wrapper does nothing for its children.",
        "A shorthand later in the file quietly resetting your longhand. `background: red` wipes `background-image`; `font` resets `font-weight` and `line-height`.",
        "An `@media`, `@supports` or `@container` condition that is not true in the viewport you are testing."
      ]
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Specificity is a triple, not a number. Sort the selector’s components into three buckets and compare the buckets from left to right."
    },
    {
      "t": "ol",
      "items": [
        "**ID selectors.** `#main`.",
        "**Class selectors, attribute selectors and pseudo-classes.** `.card`, `[type=\"text\"]`, `:hover`, `:nth-child(2)`.",
        "**Type selectors and pseudo-elements.** `div`, `li`, `::before`, `::placeholder`."
      ]
    },
    {
      "t": "p",
      "x": "The universal selector `*` and the combinators `>`, `+`, `~` and descendant whitespace contribute nothing. Comparison is strictly column by column: the left column decides, and only a tie moves the comparison right. One ID beats any quantity of classes. That is worth stating plainly, because the old folklore about specificity being a base-10 or base-256 number still circulates and it does not describe any current engine."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "ID",
        "Class",
        "Type",
        "Notes"
      ],
      "rows": [
        [
          "`*`",
          "0",
          "0",
          "0",
          "Free. Use it without specificity cost."
        ],
        [
          "`li`",
          "0",
          "0",
          "1",
          "Type selector."
        ],
        [
          "`li::before`",
          "0",
          "0",
          "2",
          "Pseudo-elements count in the type column."
        ],
        [
          "`.card`",
          "0",
          "1",
          "0",
          "Same weight as `[hidden]` or `:hover`."
        ],
        [
          "`#main`",
          "1",
          "0",
          "0",
          "Beats `.a.b.c.d.e.f`."
        ],
        [
          "`#main .card li`",
          "1",
          "1",
          "1",
          "Columns accumulate independently."
        ],
        [
          "`p:not(.promo)`",
          "0",
          "1",
          "1",
          "`:not()` adds its argument’s weight."
        ],
        [
          "`:is(.a, #b) p`",
          "1",
          "0",
          "1",
          "Takes the *most* specific argument."
        ],
        [
          "`:where(.a, #b) p`",
          "0",
          "0",
          "1",
          "Always zero, whatever is inside."
        ]
      ],
      "caption": "Specificity of common selectors, written as ID / class / type."
    },
    {
      "t": "p",
      "x": "The last three rows are the useful ones. `:is()` and `:not()` take the specificity of their heaviest argument, which makes `:is(h1, h2, .page-title)` stickier than it looks if one branch is heavy. `:where()` is always zero. That makes it the right tool for anything you expect to be overridden later, such as a reset or a theme baseline."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Specificity 0,0,1 for the <a>: trivially overridable */\n:where(.prose) a {\n  color: var(--link);\n  text-decoration: underline;\n}\n\n/* Specificity 0,1,1: a plain .footer-link class cannot beat this */\n.prose a {\n  color: var(--link);\n}\n\n/* Equal specificity, so source order decides. Later wins. */\n.btn { background: #2563eb; }\n.btn { background: #16a34a; } /* this one applies */"
    },
    {
      "t": "h2",
      "x": "Specificity is step five of six"
    },
    {
      "t": "p",
      "x": "The cascade resolves competing declarations in a fixed sequence, and each step is only consulted when the previous one produced a tie. Specificity sits near the bottom."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Browser default, user stylesheet, author stylesheet, combined with whether each declaration is `!important`.",
        "**Context.** Shadow DOM encapsulation boundaries.",
        "**Element-attached styles.** The `style` attribute.",
        "**Cascade layers.** The order your `@layer` statements established.",
        "**Specificity.** The three-column comparison above.",
        "**Order of appearance.** The last matching declaration wins."
      ]
    },
    {
      "t": "p",
      "x": "Read that list from the bottom and the practical lesson is clear. Source order is the weakest tie-break available, so moving a rule to the end of the file only helps when specificity already matches. If you are losing to a layer or to an inline style, reordering does nothing at all."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Two things not in that list",
      "x": "Animations and transitions are handled outside normal author declarations. `@keyframes` declarations override normal author rules while the animation runs, and `!important` inside a keyframe block is ignored entirely. An in-flight transition overrides everything, including `!important`. If a value flickers to the right thing and then back, look for a transition before you look at selectors."
    },
    {
      "t": "p",
      "x": "Newer engines also weigh `@scope` proximity, evaluated before specificity: among scoped rules, the one whose scope root is nearest the element wins. Chromium and Safari shipped `@scope` before Firefox did, so check current browser support before depending on it."
    },
    {
      "t": "h2",
      "x": "Cascade layers beat specificity, and that is the point"
    },
    {
      "t": "p",
      "x": "`@layer` exists so you can stop arguing about selector weight. Declare the layer order once. Every rule in a later layer then wins against every rule in an earlier layer, regardless of how the selectors are written."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order first. Later layers win for normal declarations. */\n@layer reset, vendor, components, utilities;\n\n@layer components {\n  /* 1,1,0 */\n  #sidebar .btn { background: rebeccapurple; }\n}\n\n@layer utilities {\n  /* 0,1,0 but in a later layer, so this one applies */\n  .bg-transparent { background: transparent; }\n}\n\n/* Unlayered rules beat every layer for normal declarations. */\n.btn { background: black; } /* wins over both of the above */"
    },
    {
      "t": "p",
      "x": "Two behaviours catch people out. Unlayered styles are not “layer zero”: for normal declarations they take precedence over all layered styles, so wrapping a third-party sheet in a layer while leaving your own code unlayered hands your code the upper hand automatically. And layer order is fixed by first appearance, so a bare `@layer a, b, c;` statement at the top of your entry stylesheet is the only reliable way to control it."
    },
    {
      "t": "p",
      "x": "The ordering flips for `!important`. Among important author declarations, earlier layers win over later ones, and an important declaration inside any layer beats an important declaration outside every layer. It is consistent with the rest of the spec, where importance reverses precedence rather than removing it, but it reads backwards the first time you hit it."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layers do not isolate",
      "x": "A layer changes cascade precedence only. It does not scope selectors, block inheritance, or stop a rule in `reset` from matching your component. For that you want `@scope`, shadow DOM, or disciplined naming."
    },
    {
      "t": "h2",
      "x": "What !important really does"
    },
    {
      "t": "p",
      "x": "`!important` does not mean “always win”. It moves a declaration into a separate comparison where the usual origin order runs backwards. Strongest first:"
    },
    {
      "t": "ol",
      "items": [
        "Browser default stylesheet, `!important`",
        "User stylesheet, `!important`",
        "Author stylesheet, `!important`",
        "CSS animations",
        "Author stylesheet, normal",
        "User stylesheet, normal",
        "Browser default stylesheet, normal"
      ]
    },
    {
      "t": "p",
      "x": "Notice what that implies for accessibility. A user stylesheet with `!important` outranks anything you write, and that is deliberate: it is how a reader forces a minimum font size or a high-contrast palette onto your site. Fighting it is both futile and rude."
    },
    {
      "t": "p",
      "x": "The real cost of `!important` is what happens next. Once a declaration is important, the only ways to override it are another important declaration that wins on layer order, specificity or source order, or an important inline style. You have not ended the argument. You have restarted it one level up, with fewer tools left. In a codebase where three people have each reached for it in turn, the result is a set of rules nobody can change safely."
    },
    {
      "t": "p",
      "x": "There are defensible uses: overriding a third-party widget whose stylesheet you cannot edit, a print stylesheet that must force backgrounds off, or a utility class whose entire contract is that it wins, which is how Tailwind’s important modifier is meant to be read. What those share is that the override is deliberate and documented, rather than a guess made at 6pm."
    },
    {
      "t": "p",
      "x": "To override an inline `style` attribute from a stylesheet you need `!important`, because element-attached styles outrank all normal author declarations. If the inline declaration is itself `!important`, no stylesheet can beat it. At that point, change the component writing the attribute."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element",
          "x": "Inspect the exact node, not its parent or a wrapper. Component libraries often render an extra element, and the class you expect on the button sits on a `<span>` inside it."
        },
        {
          "title": "Read the Computed pane, not just the Styles pane",
          "x": "Expand the property in question. DevTools lists every declaration that targeted it, strongest first, with a link to the winning rule and its file. That link answers “what is beating me” in one click. Guessing does not."
        },
        {
          "title": "Look for a struck-through property with a warning icon",
          "x": "That means invalid value, not lost cascade. Fix the value; the selector was fine all along."
        },
        {
          "title": "Identify which cascade step you lost at",
          "x": "Is the winner an inline style, a rule in a different layer, a heavier selector, or the same selector further down the file? Each has a different fix, and only the third is solved by adding selectors."
        },
        {
          "title": "Fix at the right level",
          "x": "Lost on specificity between your own rules: lower the winner instead of raising the loser, usually by wrapping its context in `:where()`. Lost to a third-party sheet: put that sheet in an early layer. Lost to an inline style: fix the code setting it.",
          "code": "/* Instead of escalating to #app .card .title.title */\n:where(#app .card) .title { font-size: 1.25rem; }"
        },
        {
          "title": "Verify the stylesheet you edited is the one being served",
          "x": "A cached bundle, a stale dev server or a CSS file that failed to rebuild makes a correct fix look like a cascade mystery. The file path shown in DevTools is the ground truth."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Build tools, Tailwind and CSS modules"
    },
    {
      "t": "p",
      "x": "In a bundled app, source order is decided by your build rather than by the order of your import statements in any obvious way. Two consequences come up repeatedly."
    },
    {
      "t": "p",
      "x": "CSS modules give you hashed class names, so nearly every rule is a single class and specificity is almost always tied. That is healthy. It also means order of appearance decides everything, and the order in which the bundler concatenates module CSS can shift when you add an import. If a style breaks after an unrelated refactor, suspect emitted order before you suspect your selector."
    },
    {
      "t": "p",
      "x": "Utility frameworks lean on layers. Tailwind v4 emits its own output into named layers such as `theme`, `base`, `components` and `utilities`, which is why a utility class beats a component rule with a heavier selector. Custom CSS written outside those layers wins against every utility, which is occasionally what you want and more often the cause of “my `text-center` stopped working”. Put custom rules in the matching layer and the framework’s precedence keeps holding."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A fast sanity check",
      "x": "Add the declaration directly to the element in the DevTools Styles pane, which creates an inline style. If it takes effect, the property and value are valid and your problem is cascade or selector. If it does nothing, the property does not apply to that element and no amount of specificity will help."
    },
    {
      "t": "h2",
      "x": "Habits that stop this recurring"
    },
    {
      "t": "ul",
      "items": [
        "Keep selectors flat. One class is enough for most components, and a flat selector is easy to override later without escalation.",
        "Avoid ID selectors in stylesheets. Use IDs for fragment links and `label[for]`, and style with classes.",
        "Put third-party CSS into an early layer the moment you add it. Doing it later means auditing every override you wrote in the meantime.",
        "Wrap reset and theme defaults in `:where()` so they cost nothing to override.",
        "Treat each `!important` as needing a one-line comment naming what it is fighting. If nobody can write that comment, delete it."
      ]
    },
    {
      "t": "p",
      "x": "None of this makes the cascade simple. It does make it predictable, which is the part that matters when a release is blocked on a button that will not turn blue."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector looks right?",
          "a": "Check DevTools first. If the rule does not appear in the Styles pane, the selector did not match the node you inspected. If it appears with the declaration struck through, it matched and lost the cascade. If one property is struck through with a warning icon, the value was invalid and discarded at parse time, which is the case people miss most often."
        },
        {
          "q": "Does !important always override everything?",
          "a": "No. It moves the declaration into the important comparison, where origin order reverses. A user stylesheet’s `!important` and the browser default’s `!important` both outrank yours, an active transition overrides important declarations, and `!important` inside `@keyframes` is ignored. Two competing important author declarations are still resolved by layer order, then specificity, then source order."
        },
        {
          "q": "How do I override an inline style from a stylesheet?",
          "a": "Add `!important` to your declaration. The `style` attribute outranks every normal author declaration, so nothing weaker works. If the inline declaration is itself `!important`, no stylesheet can beat it and you have to change whatever code writes the attribute."
        },
        {
          "q": "Can multiple classes beat an ID selector?",
          "a": "Not in any current browser. The three specificity columns are compared left to right and the ID column is decided first, so `#main` beats a selector with any number of classes. The idea that specificity is a single number with carry-over comes from very old engines."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match the same elements. `:is()` takes the specificity of its most specific argument, so `:is(#a, .b)` contributes a full ID. `:where()` always contributes zero. Use `:where()` for defaults you want to be easy to override, and `:is()` when you want the selector to hold its weight."
        },
        {
          "q": "Should I add cascade layers to an existing project?",
          "a": "You can do it incrementally, and the cheapest first move is to wrap imported third-party CSS in an early layer. Because unlayered normal declarations take precedence over every layer, your existing unlayered code keeps winning and nothing else has to change. Converting your own CSS into layers is a bigger job worth planning, since the precedence of every rule you move changes at once."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout module fits the problem, and the details that prevent overflow bugs.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check foreground and background pairs against WCAG AA and AAA thresholds.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "Five causes to check when state looks one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-05",
  "updated": "2026-11-05",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
