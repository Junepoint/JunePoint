module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers and !important: why your rule loses",
  "eyebrow": "Guides",
  "description": "A declaration that does not apply is either unmatched, invalid, or losing the cascade. How to tell which, and how specificity and @layer really rank.",
  "standfirst": "Specificity gets blamed for failures it had nothing to do with. Here is the order the browser resolves in, and how to read the real answer out of devtools in about ten seconds.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "css cascade order"
  ],
  "cardDesc": "Tell an unmatched selector from an invalid value from a lost cascade fight, then fix the right one.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "A declaration that has no effect is unmatched, invalid, or beaten. Decide which before you change anything.",
        "Specificity is the fifth tiebreaker, not the first. Origin and importance, shadow context, inline styles and cascade layers all settle the question before a single selector gets counted.",
        "Specificity is three independent counters (ID, class, type), compared left to right. Eleven classes still lose to one ID.",
        "An unlayered rule beats a layered one regardless of specificity. `@layer` is the cleanest way to make vendor CSS lose on purpose.",
        "`!important` inverts the order, and it inverts layer order with it. Earlier layers win among important declarations, which surprises almost everyone the first time.",
        "In devtools: struck-through means it lost the cascade, a warning triangle means the parser threw it away, and absent from the list means the selector never matched."
      ]
    },
    {
      "t": "h2",
      "x": "Rule out the boring causes first"
    },
    {
      "t": "p",
      "x": "Specificity is the famous explanation, which is exactly why it gets blamed for failures it had nothing to do with. Before you count selectors, confirm your declaration is even in the fight. Inspect the element, find the property in the Styles pane, and read which of four states you are looking at."
    },
    {
      "t": "ul",
      "items": [
        "**The rule is not in the list at all.** The selector never matched. Look at the DOM rather than the stylesheet: a class your framework renders conditionally, a `>` where you wanted a descendant, a typo, a wrapper element that got added, or a target inside a shadow root your selector cannot cross.",
        "**The rule is there and the declaration is struck through.** It matched and lost. This is the only case where specificity, layers and `!important` are the right thing to be thinking about.",
        "**The declaration has a warning triangle next to it.** The parser rejected the value and discarded the whole declaration. Nothing downstream can rescue it, because it never entered the cascade.",
        "**It applied, and nothing moved.** The property is valid and winning, but it does not do anything to that kind of box. This one produces the longest debugging sessions, because every tool reports success."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Winning, and inert */\nspan      { width: 200px; }   /* non-replaced inline boxes ignore width and height */\n.row      { gap: 1rem; }      /* no effect without flex, grid or multi-column */\n.badge    { z-index: 10; }    /* needs position, or a flex/grid parent */\n.sidebar  { float: left; }    /* ignored on a flex item or a grid item */\n\n/* Dropped at parse time: look for the warning triangle */\n.title { width: 20; }         /* no unit */\n.title { font-wieght: bold; } /* unknown property */\n.title { color: #ff; }        /* not a valid color */"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Inheritance is not the cascade",
      "x": "`border`, `padding`, `background` and `width` are not inherited. Setting them on a parent does nothing to a child, and the child's Styles pane will not even mention the rule. Only the Computed pane, with the inherited section expanded, shows what a property is actually resolving to and where that value came from. When a value looks like it arrived from nowhere, that pane is where you find it."
    },
    {
      "t": "h2",
      "x": "The cascade, in the order it really runs"
    },
    {
      "t": "p",
      "x": "Two declarations set the same property on the same element. The browser works through these criteria in sequence and stops at the first one that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author styles beat user styles beat browser defaults, and `!important` flips that order inside each pairing. An `!important` user style outranks an `!important` author style, which is the mechanism accessibility overrides and browser extensions rely on.",
        "**Encapsulation context.** When a shadow tree is involved, normal declarations from the outer page win over the component's own, and `!important` declarations inside the shadow tree win over the page. That inversion is how a component author protects a style it cannot afford to lose.",
        "**Inline styles.** A `style` attribute beats every selector-based author rule for normal declarations. An `!important` declaration in a stylesheet still beats a normal inline style.",
        "**Cascade layers.** Within one origin and importance, layer order decides. Specificity has not been consulted yet.",
        "**Specificity.** Only now are the selectors counted.",
        "**Scope proximity, then source order.** With `@scope` in play, the nearer scope root wins. Otherwise the declaration that appears later in the stylesheet wins."
      ]
    },
    {
      "t": "p",
      "x": "Animations and transitions sit inside that first step and are easy to forget. A running CSS transition outranks everything, `!important` included. A running animation outranks normal declarations but loses to `!important`. If a value snaps back to something you did not ask for a moment after you set it, suspect a transition or a `@keyframes` rule still holding the property rather than a selector you miscounted."
    },
    {
      "t": "h2",
      "x": "Counting specificity properly"
    },
    {
      "t": "p",
      "x": "Specificity is not a score. It is three counters, usually written `A,B,C`: ID selectors, then class selectors plus attribute selectors plus pseudo-classes, then type selectors plus pseudo-elements. Comparison runs left to right and stops at the first difference. That is the whole rule, and it is why the folk wisdom about adding another class to win so often fails."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "A,B,C",
        "Why"
      ],
      "rows": [
        [
          "`* > p + p`",
          "0,0,2",
          "The universal selector and all combinators contribute nothing. Only the two `p` type selectors count."
        ],
        [
          "`:where(#app) .title`",
          "0,1,0",
          "`:where()` always contributes zero, whatever you put inside it. The ID is neutralized."
        ],
        [
          "`li::marker`",
          "0,0,2",
          "Pseudo-elements count at the type level, not the class level."
        ],
        [
          "`[data-open=\"true\"]`",
          "0,1,0",
          "Attribute selectors sit at the class level, including `[id=\"app\"]`, which is why that is weaker than `#app`."
        ],
        [
          "`a:hover`",
          "0,1,1",
          "Pseudo-classes count as classes."
        ],
        [
          "`:not(.a, #b)`",
          "1,0,0",
          "`:not()`, `:is()` and `:has()` take the specificity of their most specific argument."
        ],
        [
          "`#main .card > p`",
          "1,1,1",
          "One of each."
        ],
        [
          "`style=\"color:red\"`",
          "outside the triple",
          "Resolved before specificity is reached. Only `!important` in a stylesheet gets past it."
        ]
      ],
      "caption": "`.a.b.c.d.e.f.g.h.i.j.k` is 0,11,0 and still loses to `#x` at 1,0,0. The columns do not carry."
    },
    {
      "t": "p",
      "x": "Native nesting has made one specificity trap much more common. The `&` nesting selector behaves like `:is()` applied to the parent selector list, so the most specific selector in that list sets the weight for everything nested under it. One ID in a comma-separated parent list quietly promotes every child rule."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* The ID leaks downward */\n#app, .panel {\n  & .title { color: red; }   /* 1,1,0: :is(#app, .panel) counts as 1,0,0 */\n}\n\n/* Same match, deliberately cheap */\n:where(#app, .panel) .title { color: red; }   /* 0,1,0 */\n\n/* Deliberately expensive, when you must outrank something and own both ends */\n.btn.btn { padding-inline: 1rem; }            /* 0,2,0 */"
    },
    {
      "t": "p",
      "x": "That `:where()` habit is worth building. Wrapping the structural part of a selector in `:where()` gives you a default that anything else can override with a plain class, which is how most design systems keep their base styles out of the way."
    },
    {
      "t": "h2",
      "x": "Cascade layers decide who loses, up front"
    },
    {
      "t": "p",
      "x": "`@layer` is the first genuinely new tool in this area for years, and it solves the specific problem of third-party CSS you cannot edit. Declare your layer order once, near the top of your entry stylesheet. Later layers beat earlier ones. Anything outside every layer beats everything inside them."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Order is fixed by this one line, wherever the rules themselves load from */\n@layer reset, vendor, base, components, utilities;\n\n@layer vendor {\n  /* An aggressive third-party selector, now in the weakest useful layer */\n  #widget-root .widget-button { background: #0af; }   /* 1,1,0 */\n}\n\n@layer components {\n  .btn { background: rebeccapurple; }                 /* 0,1,0 wins */\n}\n\n/* Unlayered. Beats both, at 0,1,0, with no !important anywhere. */\n.btn-override { background: black; }"
    },
    {
      "t": "p",
      "x": "That `1,1,0` selector losing to a `0,1,0` one is not a bug. Layers are resolved before specificity, so the comparison never gets as far as counting. Wrapping a vendor stylesheet is a one-liner: `@import url(\"vendor.css\") layer(vendor);`, and layers can be nested, which makes something like `components.card` a usable namespace in a large codebase."
    },
    {
      "t": "p",
      "x": "`revert-layer` is the companion worth knowing. It rolls a property back to whatever the previous layer resolved it to, rather than to the browser default, so you can opt out of one override without hunting down the value it replaced."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer theme {\n  .card { border-color: #ddd; }\n}\n\n@layer overrides {\n  .card { border-color: revert-layer; }  /* falls back to the theme layer's value */\n}\n\n/* Related keywords, for the record:\n   revert   -> back to the previous origin (user styles, then browser default)\n   initial  -> the property's spec-defined initial value, ignoring inheritance\n   unset    -> inherit if the property inherits, otherwise initial */"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "Among important declarations, earlier layers win, and unlayered important declarations lose to every layered one. So `!important` in your `reset` layer beats `!important` in your `utilities` layer, the exact opposite of normal behavior. This is intentional: it lets a low-level layer protect an invariant. It also means mixing `!important` into layered CSS without a plan produces results nobody on the team can predict."
    },
    {
      "t": "h2",
      "x": "What !important actually costs"
    },
    {
      "t": "p",
      "x": "`!important` works. That is the problem. It wins the argument today, and tomorrow it is the thing your next override has to beat, so the only move left is another `!important` with more specificity behind it. Teams end up with four competing important declarations on one property and no way to reason about any of them. Before reaching for it, find out what you are losing to, because the answer usually has a smaller fix."
    },
    {
      "t": "table",
      "head": [
        "Instead of",
        "Try",
        "Trade-off"
      ],
      "rows": [
        [
          "`!important` to beat vendor CSS",
          "Put the vendor stylesheet in an early `@layer`",
          "Needs you to control the import, and the layer statement must come before the rules it names"
        ],
        [
          "`!important` to beat an ID selector",
          "`:where()` around the ID, or match with `[id=\"app\"]` at class weight",
          "Only possible if you own the selector doing the damage"
        ],
        [
          "`!important` on one stubborn property",
          "Duplicate the class: `.btn.btn`",
          "Looks like a typo, so it needs a comment explaining itself"
        ],
        [
          "`!important` for a runtime value",
          "A custom property, or an inline style",
          "Inline styles are hard to override later and cannot carry media queries"
        ],
        [
          "`!important` because order is wrong",
          "Fix the import or bundle order",
          "Build-dependent, and easy for a later refactor to undo silently"
        ]
      ],
      "caption": "Most important declarations are a load-order or layer problem wearing a disguise."
    },
    {
      "t": "p",
      "x": "There are honest uses. A user stylesheet or a browser extension has no other way in. A utility whose entire contract is that it wins, such as `.visually-hidden` or a print-only `display: none`, reads more clearly with it than without. As a temporary probe in devtools it tells you quickly whether you are fighting the cascade or fighting an invalid value. The distinction is whether the declaration is meant to be the final word, or whether you just want it to be the final word right now."
    },
    {
      "t": "h2",
      "x": "Build pipelines and injection order"
    },
    {
      "t": "p",
      "x": "When specificity and layers both check out, the remaining suspect is source order, and in a modern toolchain you probably did not choose it. Equal specificity means last one wins, so whichever file the bundler emitted later takes the property. That can differ between your dev server and your production build."
    },
    {
      "t": "ul",
      "items": [
        "**Utility frameworks.** Tailwind utilities are mostly single classes at `0,1,0`. Two that touch the same property resolve by position in the generated CSS, not by the order you wrote them in the `class` attribute. Your component CSS needs to sit in an earlier layer to lose to utilities predictably.",
        "**CSS Modules and scoped styles.** Hashing makes class names unique, not more specific. Two scoped rules at the same weight still fall through to import order, which your module graph decides.",
        "**Runtime CSS-in-JS.** Styles are injected as `<style>` elements in execution order, so a lazily loaded component can land after everything else and start winning fights it should lose.",
        "**`@import` placement.** An `@import` has to appear before any style rules, with only `@charset`, `@layer` statements and other imports allowed ahead of it, and the imported rules sit at that position in the cascade. Put it halfway down a file and the browser ignores it.",
        "**The file is not loading.** A 404 on a `<link>`, a stale service worker cache, or a build that excluded the file produces a rule that is simply absent from devtools. Check the Network panel before doubting your selector."
      ]
    },
    {
      "t": "h2",
      "x": "A routine that finds it quickly"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element",
          "x": "Select the exact node, not its parent or a wrapper your framework generated. Then test the selector against the live DOM from the console. An empty result ends the investigation immediately.",
          "code": "// Does it match anything at all, and how many?\ndocument.querySelectorAll('.card > .title').length\n\n// Does it match this specific element?\n$0.matches('.card > .title')\n\n// What is the element actually resolving to?\ngetComputedStyle($0).color"
        },
        {
          "title": "Read the Styles pane top to bottom",
          "x": "Devtools lists matched rules in cascade order, strongest first. Your declaration's position tells you what beat it. A warning triangle means the value was invalid, which is a different bug, and not one `!important` can fix."
        },
        {
          "title": "Check the Computed pane",
          "x": "Expand the property to see the winning declaration and its source file, plus anything inherited from an ancestor. This is the fastest way to explain a value that no rule in the Styles pane seems to account for."
        },
        {
          "title": "Test the hypothesis destructively",
          "x": "Add `!important` to your declaration in devtools. If it applies now, you had a cascade problem and can go find the real winner. If nothing changes, the property does not apply to that box, something outranks it at a higher step such as a transition, or the element is not the one you think it is."
        },
        {
          "title": "Fix it at the right level",
          "x": "A layer if the winner is third-party CSS. A reordered import if it is your own. A corrected selector if it never matched. Raising specificity is the last option, because it is the one that makes the next person's job harder."
        }
      ]
    },
    {
      "t": "p",
      "x": "The habit matters more than any of these mechanics. CSS failures feel like the browser ignoring you, so the instinct is to push harder with a heavier selector. Reading the state first tells you whether pushing can possibly work. It is the same discipline as [React state that looks one render behind](/guides/react-usestate-not-updating/): the code looks right, the output disagrees, and the fix only becomes obvious once you stop guessing about which step failed."
    },
    {
      "t": "h2",
      "x": "The order to work through"
    },
    {
      "t": "ol",
      "items": [
        "Does the selector match? `document.querySelectorAll()` or `$0.matches()` answers that in one line.",
        "Is the value valid? A warning triangle in devtools means the declaration never existed as far as the cascade is concerned.",
        "Does the property apply to this box? Check `display`, `position` and the parent's layout mode.",
        "Is it inherited when you assumed it was, or the other way round? Use the Computed pane.",
        "Is something winning at a higher step: `!important`, an inline style, a shadow boundary, a running transition?",
        "Are layers involved? Unlayered beats layered, later layers beat earlier ones, and important reverses both.",
        "Only then count specificity, left to right, three columns.",
        "Equal specificity? Then it is source order, which means it is probably your build."
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the layout model, which decides which properties can apply to a box in the first place.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check a WCAG AA or AAA ratio before you commit the theme override that finally won.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        },
        {
          "title": "React useState not updating",
          "desc": "The same debugging shape one layer up the stack: read the real state before changing code.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even with !important?",
          "a": "Three usual reasons. The selector does not match, so there is nothing to make important. The value is invalid and the parser discarded the declaration, in which case devtools shows a warning triangle. Or something outranks it: another `!important` later in the file, an `!important` inline style, an `!important` declaration in an earlier cascade layer, or a running transition, which beats everything. A fourth possibility is that it applies perfectly well and the property has no effect on that element, such as `width` on an inline `<span>`."
        },
        {
          "q": "How is CSS specificity calculated?",
          "a": "Count three things separately: ID selectors, then classes plus attribute selectors plus pseudo-classes, then type selectors plus pseudo-elements. Write it `A,B,C` and compare left to right, stopping at the first difference. The columns never carry, so `0,11,0` loses to `1,0,0`. Combinators and `*` count for nothing, `:where()` contributes zero, and `:is()`, `:not()` and `:has()` take the specificity of their most specific argument."
        },
        {
          "q": "Do cascade layers override specificity?",
          "a": "Yes, and that is the point of them. Layer order is resolved before specificity, so a `0,1,0` selector in a later layer beats a `1,1,0` selector in an earlier one. Unlayered styles beat all layered styles for normal declarations. Among `!important` declarations the order inverts: earlier layers win, and unlayered important declarations are the weakest of all."
        },
        {
          "q": "Is it ever okay to use !important?",
          "a": "Yes, in narrow cases. User stylesheets and browser extensions have no other mechanism. A utility whose whole contract is winning, such as a visually-hidden helper or a print-only `display: none`, reads more honestly with it. It is also a good throwaway diagnostic in devtools. What it should not be is the routine answer to losing a cascade fight, because the next override then needs a bigger hammer and nobody can predict the outcome after the third round."
        },
        {
          "q": "Why does my Tailwind class get overridden by component CSS?",
          "a": "Because both are single classes at the same specificity, so the winner is whichever appears later in the generated stylesheet. The order of names inside the `class` attribute is irrelevant. Put your component CSS where it loses on purpose, in a cascade layer that sits before the utilities, rather than bumping specificity until it happens to work in the current build."
        },
        {
          "q": "Why does a style on the parent not reach the child?",
          "a": "Most properties are not inherited. `color`, `font-family`, `line-height` and `visibility` pass down; `border`, `padding`, `background` and `width` do not. The child's Styles pane will not list the parent rule at all, which looks exactly like a selector failure. Check the Computed pane with the inherited section expanded, and use `inherit` explicitly on the child if you want a non-inherited property to follow its ancestor."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-24",
  "updated": "2026-11-24",
  "author": "jackson",
  "related": [
    "/guides/postgres-connection-refused/"
  ]
};
