module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying",
  "eyebrow": "Guides",
  "description": "Specificity, cascade layers and !important, in the order a browser actually resolves them, plus the failures that look like specificity bugs and are not.",
  "standfirst": "How the cascade really decides a winner, why one ID beats eleven classes, and how @layer inverts everything you learned about override order.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Specificity, layers and !important in resolution order, plus the bugs that only look like cascade problems.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Specificity is three numbers compared left to right. One ID beats any number of classes, and the columns never carry.",
        "The cascade checks origin and importance, then encapsulation, then inline styles, then layers, then specificity, then source order. Specificity is fifth on that list, not first.",
        "`@layer` inverts the usual instinct: later layers win, and any unlayered normal declaration beats every layered one.",
        "`!important` reverses layer order. The earliest layer wins, and an unlayered `!important` loses to a layered `!important`.",
        "`:where()` always contributes zero specificity. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument.",
        "If your declaration is not shown at all in the Styles pane, the selector never matched. That is a different bug and `!important` will not touch it."
      ]
    },
    {
      "t": "lede",
      "x": "Select the element, open the Styles pane, and look for your declaration. If it is there with a line struck through it, something else won the cascade and the rest of this article applies. If it is not listed anywhere, the rule never matched the element in the first place. Those two failures feel identical from the outside and have almost nothing in common, so separate them before you touch a selector."
    },
    {
      "t": "h2",
      "x": "First, confirm the rule matched at all"
    },
    {
      "t": "p",
      "x": "A surprising share of \"specificity problems\" are matching problems. The cascade only arbitrates between declarations that apply to the element, so a rule that never applies never enters the contest. Check these before anything else."
    },
    {
      "t": "ul",
      "items": [
        "**The selector does not match the DOM you actually have.** Frameworks add wrapper elements, and `.card > .title` breaks the moment a `<div>` slides in between.",
        "**The stylesheet was not loaded, or was loaded after a build stripped it.** Tailwind and similar tools scan your source for class names, so a class assembled at runtime as `` `bg-${color}-500` `` gets purged and never reaches the CSS file.",
        "**Scoped styles were rewritten.** Vue's `scoped` attribute and CSS Modules hash the class name. The selector in your source file is not the selector in the browser.",
        "**The declaration was discarded as invalid.** One typo in a property name or value drops that single declaration at parse time, silently. `colour: red` and `width: 100px%` both vanish.",
        "**A media query, container query or `@supports` block excluded it.** The rule is fine. The condition is false.",
        "**The element is generated after the stylesheet is evaluated and something re-renders it.** Rare, but worth checking when the style flashes and disappears."
      ]
    },
    {
      "t": "code",
      "lang": "javascript",
      "x": "// Does the selector match anything at all?\ndocument.querySelectorAll('.card > .title').length\n\n// What did the element actually resolve to?\nconst el = document.querySelector('.title');\ngetComputedStyle(el).color\n\n// Which stylesheets are loaded, and did any fail to parse?\n[...document.styleSheets].map(s => s.href)"
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "A zero result is the fastest answer you will get",
      "x": "`document.querySelectorAll(sel).length === 0` ends the investigation in two seconds. Paste the selector exactly as written in your CSS, including the combinators. If the count is zero, stop reading about specificity and go look at the DOM."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "Every selector gets three numbers, usually written as `(A, B, C)`. They count different kinds of thing, and they are never added together into a single score."
    },
    {
      "t": "table",
      "head": [
        "Column",
        "Counts",
        "Examples"
      ],
      "rows": [
        [
          "A (IDs)",
          "ID selectors",
          "`#main`, `#nav`"
        ],
        [
          "B (classes)",
          "Class selectors, attribute selectors, pseudo-classes",
          "`.card`, `[data-open]`, `[href^=\"https\"]`, `:hover`, `:nth-child(2)`"
        ],
        [
          "C (types)",
          "Type selectors and pseudo-elements",
          "`div`, `li`, `::before`, `::placeholder`"
        ],
        [
          "Nothing",
          "Universal selector and combinators contribute zero",
          "`*`, `>`, `+`, `~`, descendant space"
        ]
      ],
      "caption": "Pseudo-elements count in the type column, not the class column. That trips people up, because they are written with two colons and feel more specific than they are."
    },
    {
      "t": "p",
      "x": "Comparison runs left to right and stops at the first difference. `(1,0,0)` beats `(0,11,0)` because column A settles it and column B is never consulted. There is no base, no carrying, no threshold at which enough classes add up to an ID. Eleven classes lose to one ID, and so would a hundred."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "p                        { }  /* (0,0,1) */\n.note                    { }  /* (0,1,0) */\np.note                   { }  /* (0,1,1) */\na.note[href^=\"https\"]    { }  /* (0,2,1) */\nli::before               { }  /* (0,0,2) */\n#main                    { }  /* (1,0,0) */\n#main .note p            { }  /* (1,1,1) */\n\n* > .note                { }  /* (0,1,0)  universal and > count for nothing */\n:not(.note)              { }  /* (0,1,0)  :not takes its argument's value */\n:is(#main, .note) p      { }  /* (1,0,1)  :is takes the MOST specific argument */\n.card:has(.badge)        { }  /* (0,2,0)  :has behaves the same way */\n:where(#main) p          { }  /* (0,0,1)  :where is always zero */"
    },
    {
      "t": "p",
      "x": "Each complex selector in a list is scored on its own. In `#main p, .note { }` the first has specificity `(1,0,1)` and the second `(0,1,0)`, and they compete separately against whatever else targets the element. Grouping selectors is a formatting choice, not a specificity one."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Inline styles are not (1,0,0,0)",
      "x": "You will still see specificity described as four numbers with `style=\"\"` occupying the leftmost. That was the old model. In the current cascade spec, element-attached styles are a separate and earlier step than specificity, which is why nothing you write in a stylesheet can outspecify them. Only `!important` in a stylesheet gets above an inline declaration, and only because importance is checked earlier still."
    },
    {
      "t": "h2",
      "x": "The order the cascade resolves in"
    },
    {
      "t": "p",
      "x": "Specificity is one tiebreaker among several, and it is applied late. The browser works down this list and stops as soon as one criterion separates the candidates."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author, user and user agent styles, each split into normal and important.",
        "**Encapsulation context.** Shadow DOM boundaries, which decide whether an outer stylesheet can reach in at all.",
        "**Element-attached styles.** Anything in a `style` attribute.",
        "**Cascade layers.** Layer order, with unlayered treated as its own final layer for normal declarations.",
        "**Specificity.** The three numbers above.",
        "**Scope proximity.** For `@scope`, the rule whose scope root is nearest the element wins.",
        "**Order of appearance.** The last matching declaration in source order wins."
      ]
    },
    {
      "t": "p",
      "x": "Two things follow from the shape of that list. Source order only decides ties, so \"put it last in the file\" works right up until the moment somebody else's rule is one class more specific. And importance is checked at the very top, which is why `!important` feels like a universal override: it is not beating specificity, it is skipping the round where specificity would have been asked."
    },
    {
      "t": "p",
      "x": "The origin ordering is also inverted for important declarations. Normal author styles beat normal user styles beat normal user agent styles. Important user agent styles beat important user styles beat important author styles. A user stylesheet with `!important` is therefore able to override anything a site author writes, which is the mechanism accessibility overrides rely on. Transition declarations sit above all of it, and running animations sit between important and normal author styles."
    },
    {
      "t": "h2",
      "x": "Cascade layers, and why they feel backwards"
    },
    {
      "t": "p",
      "x": "`@layer` gives you an explicit priority ordering that is consulted before specificity. That is the whole point of it. A one-class selector in a later layer beats an ID selector in an earlier one, and no amount of selector rewriting in the earlier layer will change the outcome."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up top. This line establishes priority\n   even though the layers are empty at this point. */\n@layer reset, base, components, utilities;\n\n@layer components {\n  #promo .button { background: rebeccapurple; }  /* (1,1,0) */\n}\n\n@layer utilities {\n  .bg-white { background: #fff; }                /* (0,1,0) */\n}\n\n/* .bg-white wins. utilities comes after components, and layer order\n   is compared before specificity is ever looked at. */"
    },
    {
      "t": "p",
      "x": "Three rules about layers cause most of the confusion:"
    },
    {
      "t": "ul",
      "items": [
        "**Order is fixed at first mention.** A bare `@layer a, b, c;` statement at the top of your entry file establishes the order. Later `@layer a { ... }` blocks add to the existing layer without moving it.",
        "**Unlayered normal styles beat every layer.** Anything outside a layer is treated as a final, highest-priority layer. Put your reset in a layer and your one-off page tweak outside it, and the tweak always wins. This is usually what you want, and it is a trap the first time you meet it.",
        "**Nested layers sort within their parent.** `@layer framework.base` and `@layer framework.overrides` order relative to each other inside `framework`, and the whole `framework` layer keeps its position relative to its siblings."
      ]
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Push a third-party stylesheet into a low-priority layer\n   so your own unlayered styles can override it without !important. */\n@layer vendor, app;\n\n@import url(\"some-framework.css\") layer(vendor);\n\n@layer app {\n  .button { border-radius: 0; }\n}"
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "!important reverses layer order",
      "x": "Inside the important context, the priority of layers flips. The **earliest** layer wins, and an unlayered `!important` declaration is the weakest of all rather than the strongest. Given `@layer base, theme;` with `.btn { color: red !important }` in `base` and `.btn { color: blue !important }` in `theme`, the text is red. This is deliberate: it lets a low-level reset layer declare a genuinely non-negotiable value that downstream layers cannot stamp on."
    },
    {
      "t": "p",
      "x": "`@scope` adds one more tiebreaker, sitting between specificity and source order in the list above. Given two scoped rules of equal specificity, the one whose scope root is a closer ancestor of the element wins. Support landed across the major engines, but check caniuse against the browsers you actually ship to rather than trusting this sentence, which describes the position as of September 2026."
    },
    {
      "t": "h2",
      "x": "!important, and the honest cases for it"
    },
    {
      "t": "p",
      "x": "The advice to never use `!important` is too strong. The realistic complaint is that it removes your ability to override the declaration later by any normal means, which turns a small local fix into a constraint on everyone downstream. Once two important declarations are competing, you are back to comparing layers and specificity, and now you are doing it in a context where the escape hatch has already been spent."
    },
    {
      "t": "p",
      "x": "Defensible uses:"
    },
    {
      "t": "ul",
      "items": [
        "Overriding a third-party widget that writes inline styles you cannot reach any other way.",
        "User stylesheets and accessibility overrides, where beating the author is the entire intent.",
        "A print stylesheet forcing colors and backgrounds for output.",
        "A temporary probe while debugging, to confirm the selector matches before you go looking for the real winner."
      ]
    },
    {
      "t": "p",
      "x": "Indefensible, and common: reaching for it because a selector lost and you did not check why. If the answer turns out to be a layer ordering problem, `!important` will produce the opposite of what you expect the next time somebody adds a layer."
    },
    {
      "t": "note",
      "kind": "danger",
      "title": "The .foo.foo.foo trick has a cost",
      "x": "Repeating a class to inflate specificity works, and `.btn.btn` really does score `(0,2,0)`. It is also invisible to anyone reading the file later, and it starts an arms race that ends with someone writing `.btn.btn.btn.btn`. If you need a guaranteed override, a cascade layer states the intent explicitly and does not degrade. If you need it locally and cheaply, `:is(.btn, .btn)` and `:not(#\\9)` are the same hack with better manners, but they are still a hack."
    },
    {
      "t": "h2",
      "x": "Selectors that deliberately weigh nothing"
    },
    {
      "t": "p",
      "x": "`:where()` takes any selector list and reports zero specificity for the whole thing. It is the single most useful tool for writing library CSS that consumers can override without a fight."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0,1,1): every consumer now needs a two-class selector to win */\n.prose h2 { margin-block-start: 2rem; }\n\n/* (0,0,1): a bare .heading class in the consumer's CSS beats this */\n:where(.prose) h2 { margin-block-start: 2rem; }\n\n/* Nesting: & behaves like :is(), so it takes the parent's\n   most specific selector, not zero. */\n#app, .app {\n  & .title { color: red; }   /* (1,0,0) + (0,1,0) = (1,1,0) */\n}"
    },
    {
      "t": "p",
      "x": "The nesting case catches people who assume `&` is a textual expansion. It is not. It resolves like `:is()`, so one ID anywhere in the parent selector list raises the specificity of every nested rule underneath it. If that is not what you want, wrap the parent in `:where()`."
    },
    {
      "t": "h2",
      "x": "Failures that are not about specificity at all"
    },
    {
      "t": "h3",
      "x": "Inheritance always loses to a direct match"
    },
    {
      "t": "p",
      "x": "An inherited value has no specificity, because it is not a declaration on that element. `#page { color: navy }` sets navy on `#page`, and it is inherited by descendants only where nothing else claims them. A plain `a { color: blue }` at `(0,0,1)` wins on every link inside, and nothing about the ID enters into it. If a child looks wrong, check whether some rule is targeting the child directly before you go counting columns on the ancestor."
    },
    {
      "t": "h3",
      "x": "Shorthands overwrite longhands you did not mention"
    },
    {
      "t": "p",
      "x": "`background: red` does not only set the color. It resets `background-image`, `background-position`, `background-size` and the rest to their initial values. Write your longhand first and the shorthand after it, at equal specificity, and the shorthand quietly wipes it. Same story with `font`, `border`, `grid` and `flex`. The property that vanished is usually the one you never wrote."
    },
    {
      "t": "h3",
      "x": "A broken var() falls back to inherit, not to the previous rule"
    },
    {
      "t": "p",
      "x": "This one wastes hours. If `var(--brand)` resolves to something invalid for the property, the declaration becomes invalid at computed-value time. That is a late-stage failure, after the cascade has already picked a winner, so the browser does not fall back to the next-best rule. Instead the property computes to the inherited value if it is an inherited property, or to its initial value if not. Your carefully written fallback rule two lines above is not consulted."
    },
    {
      "t": "code",
      "lang": "css",
      "x": ".btn { color: blue; }\n.btn { color: var(--brand); }   /* --brand is \"12px\" or undefined */\n\n/* Result is NOT blue. The second declaration won the cascade,\n   then failed at computed-value time, so color inherits from the parent.\n   Guard it at the point of use instead: */\n.btn { color: var(--brand, blue); }"
    },
    {
      "t": "h3",
      "x": "Custom properties cascade separately from where they are used"
    },
    {
      "t": "p",
      "x": "`--brand` resolves on the element that reads it, using whichever declaration of `--brand` won the cascade *on that element*. A low-specificity rule setting `--brand` directly on the button beats a high-specificity rule setting it on `:root`, because they are not competing: they apply to different elements, and the nearer one wins by inheritance. This is a feature, and it means a theming bug often has nothing to do with the selector on the property you are watching."
    },
    {
      "t": "h3",
      "x": "Shadow DOM boundaries"
    },
    {
      "t": "p",
      "x": "Inside a shadow root, your page stylesheet does not apply at all except through inherited properties, `::part()` and exposed custom properties. Encapsulation context is checked before specificity, so no selector you write in the page can reach in. `!important` does not change that either."
    },
    {
      "t": "h2",
      "x": "A diagnostic order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the selector matches",
          "x": "Run the selector against the live DOM. Zero matches ends the investigation immediately, and it is the single most common cause.",
          "code": "document.querySelectorAll('#promo .button').length"
        },
        {
          "title": "Read the Styles pane top to bottom",
          "x": "The winning declaration is the one not struck through. Your rule being absent means no match. Your rule being struck through means you lost, and the rule above it is the one that beat you. Chrome and Firefox both label the cascade layer a rule came from, which turns a guessing game into a reading exercise."
        },
        {
          "title": "Ask which criterion separated them",
          "x": "Walk the list in order. Is one of them important? Inline? In a later layer, or unlayered while yours is layered? Only when all of those match should you start counting the three numbers."
        },
        {
          "title": "Compare the computed value, not the declaration",
          "x": "The Computed pane shows the final value and, when expanded, which rule produced it. If the computed value is neither of your candidates, suspect an invalid var() substitution or a shorthand reset.",
          "code": "getComputedStyle(document.querySelector('.btn')).getPropertyValue('color')"
        },
        {
          "title": "Fix it at the right level",
          "x": "If the real problem is that a vendor stylesheet outranks yours everywhere, one `!important` treats a symptom. Import the vendor CSS into a low-priority layer once and the whole class of problem goes away."
        }
      ]
    },
    {
      "t": "h2",
      "x": "Keeping specificity low on purpose"
    },
    {
      "t": "p",
      "x": "The practical goal is a codebase where most selectors sit at `(0,1,0)` and overriding something is boring. A few habits get you there. Style with classes rather than IDs, since an ID in a selector permanently raises the floor for everyone downstream. Wrap library and reset selectors in `:where()` so consumers never have to escalate. Declare a layer order early, put third-party CSS in the lowest layer and your utilities in the highest. Keep the nesting shallow, because every level of nesting adds to the score whether or not you needed it. None of this makes a single rule easier to write. It makes the tenth override easier to write, which is where the time actually goes."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing the layout model before you start fighting the cascade over it.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check the color that actually won against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same shape of bug one layer up: the value is right, the render is not.",
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
          "a": "Four likely reasons. The selector never matched, so there is nothing to make important. Another `!important` declaration beat yours, decided by layer order (earliest layer wins in the important context) and then specificity. The value is invalid and the declaration was dropped at parse time. Or the property is being set somewhere the cascade cannot reach, such as inside a shadow root or by JavaScript writing to `element.style` after paint. Check `document.querySelectorAll(yourSelector).length` first, then look at what the Styles pane shows as the winner."
        },
        {
          "q": "What beats !important in CSS?",
          "a": "Another important declaration from a higher-priority origin: important user agent styles beat important user styles, which beat important author styles. Within author styles, an important declaration in an earlier cascade layer beats one in a later layer, and any layered important declaration beats an unlayered one. CSS transitions sit above everything. Note that an important declaration in your stylesheet does beat an inline `style` attribute, because importance is checked before element-attached styles."
        },
        {
          "q": "How do I calculate CSS specificity?",
          "a": "Count three separate numbers for the selector. A is the number of ID selectors. B is class selectors, attribute selectors and pseudo-classes. C is type selectors and pseudo-elements. The universal selector and combinators count for nothing. Compare A first, then B, then C, stopping at the first difference. `#main .btn` is `(1,1,0)` and `.btn.primary.large` is `(0,3,0)`, so the first wins on column A alone."
        },
        {
          "q": "Do more classes ever beat an ID in CSS?",
          "a": "No. The columns are compared independently and never carry, so `(0,50,0)` still loses to `(1,0,0)`. What can beat an ID selector is a different criterion entirely: a rule in a later cascade layer, an unlayered rule when the ID rule is layered, an inline style, or an important declaration. If you are trying to override an ID-based rule from a stylesheet you do not control, a cascade layer is the clean answer and adding classes is not."
        },
        {
          "q": "Why does my utility class not override the component style?",
          "a": "Usually the component selector is more specific, and utilities are single classes at `(0,1,0)`. Framework versions differ in how they handle this. Tailwind 4 emits native `@layer theme, base, components, utilities`, so utilities win on layer order regardless of specificity, provided your own CSS is not sitting unlayered above them. Check the version in your `package.json` and look at the generated CSS rather than assuming, since this behaviour changed between major versions."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically. They differ only in specificity: `:is()` takes the specificity of its most specific argument, and `:where()` always contributes zero. So `:is(#main, .card) p` is `(1,0,1)` while `:where(#main, .card) p` is `(0,0,1)`. Use `:where()` for anything you want callers to override easily, such as resets and library defaults. Use `:is()` when you genuinely want the selector to carry weight."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-09",
  "updated": "2026-09-09",
  "author": "jackson",
  "related": [
    "/guides/css-grid-vs-flexbox/"
  ]
};
