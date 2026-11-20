module.exports = {
  "slug": "css-specificity-explained",
  "title": "CSS Specificity: Why Your Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "CSS",
  "description": "How CSS specificity is really counted, where cascade layers sit in the cascade, what !important actually overrides, and how to debug a rule that loses.",
  "standfirst": "Specificity settles fewer arguments than most people assume. Origin, importance, cascade layers and source order all have their say, and a rule that looks ignored is usually losing at one of those steps or being thrown away before the cascade starts.",
  "keywords": [
    "css specificity",
    "css not applying",
    "cascade layers",
    "css important override",
    "specificity calculation"
  ],
  "cardDesc": "How specificity is counted, where cascade layers sit, and why !important is rarely the right fix.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is **three numbers compared left to right**: IDs, then classes and attributes and pseudo-classes, then element types and pseudo-elements. Eleven classes still lose to one ID.",
        "Specificity is checked **late**. Origin, importance, inline styles and cascade layers are all resolved first, so a lower-specificity selector in a winning layer beats a higher-specificity one.",
        "`!important` does not raise specificity. It moves the declaration into a different, higher band of the cascade, where specificity is then compared again against other important declarations.",
        "If a declaration shows no strikethrough in DevTools and still has no effect, it is probably **invalid, inapplicable to that element, or reset by a later shorthand**, which is not a cascade problem at all."
      ]
    },
    {
      "t": "h2",
      "x": "Three numbers, compared left to right"
    },
    {
      "t": "p",
      "x": "**A selector's specificity is a tuple, not a score.** The browser counts ID selectors, then class, attribute and pseudo-class selectors, then type and pseudo-element selectors, and compares those three counts in order. The first column that differs decides the match. There is no carrying between columns, which is why the old habit of writing specificity as a base-10 number like `0110` is misleading."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,0,1 */\nbutton            { background: gray; }\n\n/* 0,1,0 */\n.primary          { background: blue; }\n\n/* 0,1,1 */\nbutton.primary    { background: green; }\n\n/* 1,0,0 */\n#checkout         { background: red; }\n\n/* 0,11,0 - eleven classes, and still beaten by #checkout */\n.a.b.c.d.e.f.g.h.i.j.k { background: orange; }"
    },
    {
      "t": "p",
      "x": "The universal selector `*`, combinators (`>`, `+`, `~`, descendant whitespace) and the `:where()` pseudo-class contribute nothing. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, which catches people out: `:not(#sidebar)` carries a full ID's worth of weight even though it names nothing you are styling."
    },
    {
      "t": "p",
      "x": "Inline `style` attributes are often described as specificity `1,0,0,0`. They are not. Element-attached styles are a separate, higher step in the cascade, which is why no selector you write in a stylesheet can out-specify one. That distinction matters in a moment, because a normal inline style loses to an important declaration in a stylesheet."
    },
    {
      "t": "h2",
      "x": "Specificity is one step, and not an early one"
    },
    {
      "t": "p",
      "x": "When two declarations target the same property on the same element, the browser works through a fixed sequence. Specificity sits near the bottom of it. Most confusing cases are decided above it, which is why counting selectors sometimes predicts the wrong winner."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What it compares"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "User-agent, user and author stylesheets, with normal and important declarations ranked separately. Transitions sit above everything; animations sit above normal author styles."
        ],
        [
          "2. Context",
          "Shadow DOM tree versus the outer document."
        ],
        [
          "3. Element-attached styles",
          "An inline `style` attribute beats any selector of the same importance."
        ],
        [
          "4. Cascade layers",
          "Layer order, in the order the layers were declared."
        ],
        [
          "5. Specificity",
          "The three-number comparison, only among declarations that tied above."
        ],
        [
          "6. Order of appearance",
          "Last one in source order wins. This is the final tiebreak."
        ]
      ],
      "caption": "The cascade resolves top to bottom. Specificity is step five."
    },
    {
      "t": "p",
      "x": "The full origin ordering, weakest to strongest, runs: user-agent normal, user normal, author normal, CSS animations, author important, user important, user-agent important, CSS transitions. Two consequences are worth remembering. An active transition wins over an `!important` author declaration for as long as it is running, and an `!important` declaration in a user stylesheet beats an `!important` declaration in yours. The second one is deliberate. It is how a reader who needs larger text or higher contrast overrides a site that hard-codes against them."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important inside @keyframes is ignored",
      "x": "A declaration marked `!important` within a keyframe block is dropped by the spec, not promoted. If an animated property refuses to animate, check whether something else is declaring it `!important` outside the keyframes, because that will beat the animation."
    },
    {
      "t": "h2",
      "x": "Cascade layers run before specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the tool for the problem `!important` used to be reached for. Layers are compared before specificity, so a single class in a later layer beats an ID selector in an earlier one. You get to decide the override order once, at the top of the stylesheet, instead of escalating selectors file by file."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order first. Later layers win. */\n@layer reset, vendor, components, utilities;\n\n@layer vendor {\n  /* A third-party ID selector: 1,0,0 */\n  #widget .button { padding: 12px 20px; }\n}\n\n@layer utilities {\n  /* 0,1,0 and it still wins, because utilities comes last */\n  .p-0 { padding: 0; }\n}\n\n/* Importing someone else's CSS straight into a layer */\n@import url(\"vendor.css\") layer(vendor);"
    },
    {
      "t": "p",
      "x": "Two behaviors surprise people. Unlayered styles are treated as the last layer for normal declarations, so anything outside `@layer` beats everything inside it. And for important declarations the layer order reverses: an `!important` rule in your `reset` layer beats an `!important` rule in `utilities`, and unlayered important styles are the weakest of the important set. If that sounds backwards, the reasoning is that a layer you deliberately put first is the one declaring a non-negotiable base."
    },
    {
      "t": "p",
      "x": "Layer support landed across Chrome, Edge, Firefox and Safari during the first half of 2022, so it is a reasonable default for new work in late 2026. Check your own browser-support floor before shipping it, since the fallback is ugly: a browser that does not understand `@layer` drops the whole block."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Scope proximity is a newer tiebreak",
      "x": "`@scope` adds a proximity comparison, where the rule whose scope root is closer to the element wins among otherwise-equal declarations. Support is considerably newer than cascade layers and still worth verifying against current browser data before you depend on it."
    },
    {
      "t": "h2",
      "x": "What !important is actually for"
    },
    {
      "t": "p",
      "x": "`!important` moves a declaration into a higher origin band. Inside that band, everything starts again: layers (reversed), then specificity, then source order. Two important declarations on the same property are resolved exactly the way two normal ones would be, which is why adding `!important` a second time to the losing rule changes nothing and people end up writing `#app .thing.thing { color: red !important; }`."
    },
    {
      "t": "p",
      "x": "There are honest uses. Overriding a third-party widget that writes inline styles from JavaScript is one, because an important stylesheet declaration does beat a normal inline style. Print stylesheets and accessibility overrides are others. What makes it corrosive is not the keyword, it is that one use creates the conditions for the next: once a value can only be beaten by another important value, every future override must escalate too."
    },
    {
      "t": "p",
      "x": "If you are reaching for it to beat your own code, the alternative is almost always structural. Put the stubborn rules in an early layer, drop IDs from selectors, or wrap low-priority defaults in `:where()` so they carry no weight at all."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* 0,0,0: a default any single class can override */\n:where(.prose) a { color: inherit; text-decoration: underline; }\n\n/* 0,2,0: .prose plus the most specific argument of :is() */\n.prose :is(h1, .title) { margin-block-start: 0; }\n\n/* Keep component selectors flat and let layers do the arbitration */\n@layer components {\n  .card__title { font-size: 1.125rem; }\n}"
    },
    {
      "t": "h2",
      "x": "When the rule is not losing, it is being discarded"
    },
    {
      "t": "p",
      "x": "A large share of \"my CSS is not applying\" cases have nothing to do with the cascade. The declaration never entered it. DevTools is the fast check here: a crossed-out property lost the cascade, while a property that is missing entirely, or shown with a warning icon, was thrown away during parsing."
    },
    {
      "t": "ul",
      "items": [
        "**Invalid value.** One unparseable declaration is dropped and the rest of the rule survives. `width: 100px;` is fine; `width: 100 px;` quietly vanishes.",
        "**Unknown property or missing prefix.** Same outcome, no error anywhere except DevTools.",
        "**Invalid selector in a comma-separated list.** In a classic selector list, one unsupported selector invalidates the whole rule. Wrapping the risky part in `:is()` or `:where()` makes it forgiving instead.",
        "**The property does not apply to that element.** `width` and `height` are ignored on non-replaced inline elements. `vertical-align` does nothing on a flex item. `gap` does nothing without a flex, grid or multi-column container.",
        "**A later shorthand reset it.** `background` resets `background-color` to transparent, `font` resets `line-height`, `all` resets nearly everything. The shorthand does not need to mention the longhand to clobber it.",
        "**The stylesheet or rule is not live.** A 404 on the `<link>`, a media query that does not match, a build that did not rebuild, or a hashed class name that no longer matches the markup after a CSS-modules rebuild."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".badge { background-color: var(--brand); }\n\n/* Later, in another file, this wipes out the color above:\n   the background shorthand sets every background longhand,\n   and the ones it omits go back to their initial values. */\n.badge { background: no-repeat center / contain url(\"dot.svg\"); }"
    },
    {
      "t": "p",
      "x": "Custom properties have their own failure mode. An invalid value in `var()` does not fall back to the previous declaration. It resolves to the property's inherited or initial value instead, a behavior the spec calls invalid at computed-value time, and the result can look like an unrelated rule winning."
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element is the one you think it is",
          "x": "Select it in DevTools and read the breadcrumb. Dynamically rendered components, portals and pseudo-elements are a common source of a selector that matches nothing. Run the selector in the console to count real matches.",
          "code": "document.querySelectorAll('.card > .title').length"
        },
        {
          "title": "Look for the strikethrough",
          "x": "In the Styles pane, a crossed-out declaration lost the cascade and the rule that beat it is listed above it. No strikethrough and no effect means the declaration was dropped or does not apply to that element."
        },
        {
          "title": "Read the Computed pane, not the Styles pane",
          "x": "Computed shows the value that actually won, and expanding a property traces it back to the winning rule and its source file. This is the quickest way to find an override coming from a stylesheet you forgot was loaded."
        },
        {
          "title": "Check for inline styles and JavaScript",
          "x": "An inline `style` attribute written by a component library will beat your selectors. Look at the element in the Elements panel rather than trusting the source, since frameworks and animation libraries both write styles at runtime."
        },
        {
          "title": "Only then count specificity",
          "x": "If two author rules tie on origin, importance, inline status and layer, compare the three numbers. If they tie on specificity too, the later one in source order wins, which makes bundle order the real culprit more often than the selectors."
        },
        {
          "title": "Fix it at the lowest level that works",
          "x": "Move the rule to a later layer, or make the selector match the element's own class rather than its ancestors. Adding an ID or an `!important` solves today's case and creates tomorrow's."
        }
      ]
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Force the state before you measure",
      "x": "Hover, focus and active styles cannot be inspected while you are holding the mouse still. Use the `:hov` toggle in Chrome DevTools or the equivalent in Firefox to pin the state, then read the Computed pane. Half of \"my focus ring will not override\" reports are an unmeasured state."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which module owns the layout, and why gap sometimes does nothing.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color contrast checker",
          "desc": "Check an override against WCAG AA before you ship it.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState not updating",
          "desc": "The same debugging instinct applied to state that looks stale.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the selector matches?",
          "a": "Check DevTools first. A crossed-out declaration lost the cascade to a more specific rule, an inline style, a later layer or an important declaration. A declaration that does not appear at all was dropped during parsing, usually because of an invalid value or a property that does not apply to that element, such as `width` on a non-replaced inline element."
        },
        {
          "q": "Do ten classes beat one ID in CSS?",
          "a": "No. Specificity is three separate counts compared left to right, so a selector with eleven classes is `0,11,0` and loses to `#id` at `1,0,0` on the first column. There is no carrying between columns, which is why treating specificity as a single number gives the wrong answer."
        },
        {
          "q": "What beats !important?",
          "a": "Another important declaration that wins on layer order, specificity or source order; an important declaration from a user or user-agent stylesheet; and an active CSS transition. Within author styles, the reversed layer ordering means an important rule in your first declared layer beats an important rule in a later one."
        },
        {
          "q": "Do cascade layers change specificity?",
          "a": "No, they are compared before it. Layer order is step four of the cascade and specificity is step five, so a single-class selector in a later layer beats an ID selector in an earlier layer without either selector changing. Unlayered normal styles behave as though they were the final layer."
        },
        {
          "q": "How do I override a third-party stylesheet without !important?",
          "a": "Import it into a layer you declared first, with `@import url(\"vendor.css\") layer(vendor);`, then write your own rules in a later layer. If the library writes inline styles from JavaScript, layers will not help and an important declaration is a legitimate answer, because an important stylesheet declaration does beat a normal inline style."
        },
        {
          "q": "Does inline style always win?",
          "a": "Only against normal declarations. Element-attached styles are a step above selector matching, so no stylesheet selector out-specifies them, but an `!important` declaration in a stylesheet still wins because importance is compared earlier than inline status."
        },
        {
          "q": "Why did my background-color disappear when I added a background image?",
          "a": "The `background` shorthand sets every background longhand, and any longhand it omits is reset to its initial value, which for `background-color` is transparent. Either set `background-image` specifically or include the color in the shorthand. The same trap exists with `font` and `line-height`."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-11-20",
  "updated": "2026-11-20",
  "author": "jackson",
  "related": []
};
