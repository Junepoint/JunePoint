module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity: Why Your Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "How specificity is counted, where the cascade and @layer override it, and the non-specificity reasons a CSS rule silently loses.",
  "standfirst": "Specificity is only one of the cascade's tiebreakers, and it is often not the one deciding your bug. Here is the order the browser actually uses, and how to read it in DevTools.",
  "keywords": [
    "css specificity",
    "css not applying",
    "important css",
    "cascade layers",
    "css specificity calculator"
  ],
  "cardDesc": "Read the cascade in the order the browser does: origin, inline, layers, specificity, source order.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers, not one: `(ID, class, type)`. They are compared left to right, so `(0,11,0)` loses to `(1,0,0)`.",
        "Specificity is the fifth tiebreaker. Origin and importance, inline styles, and cascade layer order are all checked before it.",
        "`@layer` inverts for `!important`: a normal declaration in a later layer wins, but an important declaration in an *earlier* layer wins.",
        "`:where()` contributes zero specificity. `:is()`, `:not()` and `:has()` contribute their most specific argument.",
        "Before reaching for `!important`, confirm the declaration is actually losing. A struck-through line in DevTools means it lost. No struck-through line means the rule never matched, or the value was dropped as invalid."
      ]
    },
    {
      "t": "h2",
      "x": "Find out what is actually winning"
    },
    {
      "t": "p",
      "x": "**Do not start by adding specificity. Start by asking the browser which declaration won, and why.**"
    },
    {
      "t": "p",
      "x": "Open DevTools, select the element, and look at the Styles pane. Four different pictures mean four different bugs, and they are easy to tell apart once you know what to look for."
    },
    {
      "t": "ul",
      "items": [
        "**Your declaration is there with a line through it.** It matched, and it lost a cascade comparison. This is the only case where specificity, layers or `!important` are relevant.",
        "**Your declaration is there, not struck through, and the page still looks wrong.** The rule won on this element, but the visible change is coming from somewhere else: a child painting over it, a pseudo-element, a non-inherited property on a parent, or a transform that moved the thing you are staring at.",
        "**Your rule is not listed at all.** The selector did not match. Check the structure in the Elements tree rather than the selector in your editor, because the DOM is frequently not shaped the way the source template suggests.",
        "**The property shows a warning triangle, or has vanished from the rule entirely.** The value failed to parse. CSS discards the whole declaration when a value is invalid, so one bad `calc()` or one missing unit removes that line and reports the problem nowhere else."
      ]
    },
    {
      "t": "p",
      "x": "The Computed pane is the faster tool for the first case. Expand a property and it lists every declaration that set it, winner first, each linked to its source location. That gives you the file and line of the rule you are fighting, which is more useful than knowing its specificity score."
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// Sanity check from the console: what did the element actually compute to?\nconst el = document.querySelector('.card-title');\ngetComputedStyle(el).color;        // \"rgb(204, 0, 0)\"\n\n// Does the selector you wrote match anything at all?\ndocument.querySelectorAll('#hero .card .card-title').length;  // 0 means the selector is the bug"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A zero here saves an hour",
      "x": "If `querySelectorAll` returns 0, no amount of specificity will help. The selector does not match the DOM you have."
    },
    {
      "t": "h2",
      "x": "How specificity is counted"
    },
    {
      "t": "p",
      "x": "Every selector gets a triple. The first slot counts ID selectors. The second counts classes, attribute selectors and pseudo-classes. The third counts element type selectors and pseudo-elements. Universal selectors and combinators count for nothing, so `* > div` and `div` are equally specific."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Specificity",
        "Why"
      ],
      "rows": [
        [
          "`li`",
          "0,0,1",
          "One type selector"
        ],
        [
          "`.card-title`",
          "0,1,0",
          "One class"
        ],
        [
          "`a:hover`",
          "0,1,1",
          "A pseudo-class counts as a class"
        ],
        [
          "`input[type=\"radio\"]`",
          "0,1,1",
          "An attribute selector counts as a class"
        ],
        [
          "`#hero`",
          "1,0,0",
          "One ID"
        ],
        [
          "`.a.b.c.d.e.f.g.h.i.j.k`",
          "0,11,0",
          "Eleven classes, and still beaten by `#hero`"
        ],
        [
          "`li::marker`",
          "0,0,2",
          "Pseudo-elements count as type selectors"
        ],
        [
          "`:where(#app) .btn`",
          "0,1,0",
          "`:where()` always contributes zero"
        ]
      ],
      "caption": "Specificity triples for common selectors. Compare left to right, never as a single number."
    },
    {
      "t": "p",
      "x": "The comparison is the part people get wrong. You compare the first slot; if that ties you compare the second; only then the third. Ten classes do not add up to an ID. A hundred would not either. The old habit of writing specificity as `0-1-0`, or worse as `010`, encourages base-10 thinking, and base-10 thinking is what produces the surprised bug report."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,1,0 */\n.card-title { color: #333; }\n\n/* 0,2,0 wins over the above */\n.card .card-title { color: #0b6; }\n\n/* 1,0,0 wins over both, despite being shorter */\n#hero .card-title { color: #c00; }\n\n/* 0,11,0 still loses to #hero. The slots never carry. */\n.a.b.c.d.e.f.g.h.i.j.card-title { color: blue; }"
    },
    {
      "t": "h3",
      "x": "The functional pseudo-classes"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` take the specificity of their most specific argument. That argument list is where accidental specificity creeps in, because a single `#id` inside an otherwise harmless `:is()` drags the whole selector up a slot."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 1,1,0: the #app inside :is() counts */\n:is(.theme-dark, #app) .btn { color: red; }\n\n/* 0,1,0: :where() zeroes its arguments out */\n:where(.theme-dark, #app) .btn { color: red; }\n\n/* 0,2,0: :not() contributes .disabled, exactly as if you had written it directly */\n.btn:not(.disabled) { cursor: pointer; }"
    },
    {
      "t": "p",
      "x": "`:where()` is the right tool for library and reset styles. Give your defaults zero specificity and any consumer selector, however plain, can override them without a fight. It is the cheapest piece of CSS architecture available, and it is supported in all current major browsers as of November 2026. Check your own baseline before shipping it to old targets."
    },
    {
      "t": "h2",
      "x": "Specificity is the fifth tiebreaker, not the first"
    },
    {
      "t": "p",
      "x": "The cascade sorts declarations through a sequence of steps, and specificity sits near the bottom of it. If an earlier step decides the contest, specificity is never consulted. That is why a rule with a seemingly unbeatable selector can still lose."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Important author declarations beat normal author declarations, which beat normal user-agent declarations. Important user-agent declarations beat everything you write, which is how forced-colors modes hold their ground.",
        "**Context.** Declarations from outside a shadow tree and from inside it are sorted here, which is why a component's internal CSS can be unreachable from the page around it.",
        "**Element-attached styles.** A `style` attribute beats any style rule in the same origin and importance bucket. Not because of specificity: inline styles have none. They win at a separate step.",
        "**Cascade layers.** Layer order decides before specificity does. The newer `@scope` proximity rule is also compared here, ahead of specificity.",
        "**Specificity.** The triple, compared slot by slot.",
        "**Order of appearance.** The last matching declaration in document order wins. Only reached when everything above it ties."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences are worth remembering. An `!important` declaration in a stylesheet overrides a normal inline style, because importance is sorted before the inline-style step. And transitions and animations are part of this ordering too: declarations from a running animation outrank normal author declarations, while `!important` inside `@keyframes` is ignored outright."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Shorthands are a separate trap",
      "x": "`background: red` also resets `background-image`, `background-position` and the rest of the longhands to their initial values. A later shorthand quietly wipes out an earlier longhand even when the longhand looks more targeted, because the shorthand expands into the same properties and then wins on source order."
    },
    {
      "t": "h2",
      "x": "Cascade layers, and why !important runs backwards in them"
    },
    {
      "t": "p",
      "x": "`@layer` lets you declare the priority order of groups of CSS once, up front, independently of specificity and file order. It is the modern answer to the import-order problem. It also has one rule that catches everybody."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order first. Later layers win for normal declarations. */\n@layer reset, framework, components, utilities;\n\n@layer framework {\n  #hero .card-title { color: rebeccapurple; }   /* 1,1,0 */\n}\n\n@layer components {\n  .card-title { color: #0b6; }                  /* 0,1,0, and it beats the ID above */\n}\n\n/* Unlayered styles beat every layer for normal declarations. */\n.card-title { color: #111; }                    /* this one wins overall */"
    },
    {
      "t": "p",
      "x": "Inside a layer, specificity works normally. Between layers, specificity is irrelevant: a one-class selector in `components` beats an ID selector in `framework`, because the layer comparison happens first. Unlayered CSS acts as a final, highest-priority layer, so dropping a stylesheet in without `@layer` puts it on top of everything layered."
    },
    {
      "t": "p",
      "x": "Now the reversal. For `!important` declarations, layer order flips. Earlier layers win, and unlayered important declarations lose to important declarations in any layer. The logic holds together once you see it: an important declaration is a hard constraint, and the cascade treats the lower-level, more fundamental layers as the authority on constraints. In practice it means `!important` in your `reset` layer beats `!important` in your `utilities` layer, which is the opposite of what the normal ordering trained you to expect."
    },
    {
      "t": "table",
      "head": [
        "Comparison",
        "Normal declarations",
        "`!important` declarations"
      ],
      "rows": [
        [
          "`reset` vs `utilities`, declared in that order",
          "`utilities` wins",
          "`reset` wins"
        ],
        [
          "Unlayered vs any layer",
          "Unlayered wins",
          "The layer wins"
        ],
        [
          "Author vs user-agent",
          "Author wins",
          "User-agent wins"
        ],
        [
          "Inline style vs author stylesheet",
          "Inline wins",
          "The stylesheet rule wins"
        ]
      ],
      "caption": "Where the cascade reverses direction for !important. Layer and origin order both flip; specificity does not."
    },
    {
      "t": "h2",
      "x": "When specificity is not the problem at all"
    },
    {
      "t": "p",
      "x": "Most reports of a specificity issue turn out to be something else. Work through this list before you touch a selector. Every item here produces the same symptom: the style is in the file and not on the screen."
    },
    {
      "t": "ul",
      "items": [
        "**The property does not inherit.** `border`, `padding`, `background` and most layout properties apply only to the element you set them on. Setting them on a wrapper does nothing to the child.",
        "**The element cannot take that property.** `width` and `height` are ignored on a non-replaced inline element. An `<a>` needs `display: block` or `inline-block` first.",
        "**The build reordered your files.** Bundlers, CSS Modules and PostCSS plugins decide final source order, and source order is the last tiebreaker. Two rules of equal specificity in different files can swap winners between a dev server and a production build.",
        "**A utility framework ships its own order.** Tailwind's generated classes sit in `@layer` groups with a fixed internal order, so `p-4` and `p-8` on the same element do not resolve by the order you typed them in the markup. One of them always wins.",
        "**JavaScript is setting an inline style.** Anything that writes `element.style.*` beats your stylesheet unless you use `!important`. Animation libraries do this constantly.",
        "**The media or container query does not match.** A `@media (min-width: 768px)` block at a 767px viewport is not a specificity problem.",
        "**The stylesheet is not loaded, or is stale.** A 404 on a CSS file is silent in the page itself. Check the Network tab, and hard-reload before trusting what you see.",
        "**Shadow DOM.** Styles outside a shadow root do not reach inside it, apart from inherited properties and whatever the component exposes through `::part()` or custom properties."
      ]
    },
    {
      "t": "h2",
      "x": "Using !important without regret"
    },
    {
      "t": "p",
      "x": "`!important` is not a crime. It is a blunt instrument that is occasionally the right one, and the trouble is almost never the first use. The trouble is the second, when somebody has to beat your important declaration and the only move available is another important declaration plus a higher-specificity selector. That ratchet turns one way."
    },
    {
      "t": "p",
      "x": "Two cases make it genuinely correct. Overriding an inline style you do not control, because nothing else in the author origin can. And utility classes whose entire contract is one property with no exceptions, where the alternative is a specificity arms race with component CSS."
    },
    {
      "t": "p",
      "x": "Everything else usually has a cheaper fix. Move the rule into a later cascade layer. Wrap your base styles in `:where()` so they stop competing in the first place. Or add one more class to the selector, which costs a single slot in the second position and leaves the next person a way out."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "The one-way ratchet",
      "x": "Counting occurrences of `!important` in a codebase is a decent proxy for how much specificity debt it has accumulated. If the count is rising release over release, the fix is a layer strategy, not more exclamation marks."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the declaration is losing",
          "x": "Struck through in the Styles pane, or listed second in the Computed pane. If neither is true, the problem is the selector or the value, and specificity is a dead end."
        },
        {
          "title": "Identify the winner's source",
          "x": "Follow the Computed pane's source link. Note whether the winner is inline, in a layer, important, or simply later in the file.",
          "code": "getComputedStyle(el).getPropertyPriority('color')  // \"important\" or \"\""
        },
        {
          "title": "Match the winner's mechanism, not its score",
          "x": "Losing to a layer calls for a layer. Losing to an inline style calls for `!important`. Losing by one class calls for one more class. Escalating the wrong axis is how a `0,1,0` rule becomes a `2,4,1` rule that still does not work."
        },
        {
          "title": "Re-check at every breakpoint, and in a production build",
          "x": "Source order is the final tiebreaker and the build controls it. A fix that depends on order is a fix a bundler upgrade can undo."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Pick the right layout module before you start debugging it.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "CSS"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same debugging shape, applied to state that looks one render behind.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "React"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though it is the last rule in the file?",
          "a": "Source order is the final tiebreaker, so it only decides once origin, importance, inline styles, layers and specificity have all tied. A more specific selector earlier in the file still wins. Check DevTools: if your declaration is not struck through, the rule is not losing at all, and the cause is usually a selector that does not match the real DOM or a value that failed to parse."
        },
        {
          "q": "Does !important override an inline style?",
          "a": "Yes, if the inline style is a normal declaration. Importance is sorted before the inline-style step in the cascade, so an `!important` declaration in a stylesheet beats `style=\"color: red\"`. It does not beat `style=\"color: red !important\"`, which is the one thing in the author origin that outranks it."
        },
        {
          "q": "How do I calculate CSS specificity?",
          "a": "Count IDs, then classes plus attribute selectors plus pseudo-classes, then type selectors plus pseudo-elements. Compare the three numbers left to right and stop at the first difference. Do not add them together: `(0,11,0)` loses to `(1,0,0)` because the ID slot is compared first."
        },
        {
          "q": "Do cascade layers beat specificity?",
          "a": "Yes. Layer order is compared before specificity, so a `.btn` rule in a later layer beats a `#hero .btn` rule in an earlier one. Within a single layer, specificity decides normally. Unlayered styles act as a final layer that outranks every declared layer for normal declarations."
        },
        {
          "q": "Why is my !important rule losing to another !important rule?",
          "a": "Three likely reasons. The other rule sits in an earlier cascade layer, because layer order reverses for important declarations. Or it is an important inline style. Or both are unlayered and equally important, in which case specificity and then source order decide as usual."
        },
        {
          "q": "Does :has() increase specificity?",
          "a": "Yes. `:has()` takes the specificity of its most specific argument, the same as `:is()` and `:not()`. So `.card:has(#hero)` scores `(1,1,0)`. Wrap the argument in `:where()` if you want the match without the specificity: `.card:has(:where(#hero))` scores `(0,1,0)`."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-04",
  "updated": "2026-11-04",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
