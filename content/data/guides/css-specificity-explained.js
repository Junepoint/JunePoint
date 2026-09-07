module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Why your CSS rule is not applying: specificity, cascade layers and !important",
  "eyebrow": "Guides",
  "description": "A declaration loses for a handful of reasons. How to read specificity as three counters, where cascade layers sit, and when !important is the right call.",
  "standfirst": "The order a browser actually resolves competing declarations in, why twelve classes never beat one ID, and the console checks that find the culprit in about a minute.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important",
    "specificity calculation"
  ],
  "cardDesc": "Read specificity as three counters, see where cascade layers sit, and find the declaration that is actually winning.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before blaming specificity, prove the selector matches something. `document.querySelectorAll('.card__title').length` answers that in one line.",
        "Specificity is three independent counters, `(IDs, classes, types)`, compared from the left. Twelve classes lose to one ID because the comparison never reaches the second number.",
        "Cascade layers outrank specificity. A plain `.btn` in a later layer beats `#page .btn` in an earlier one, and unlayered styles beat every layer.",
        "`!important` reverses layer order. The earliest layer then wins, and unlayered important declarations lose to layered ones.",
        "`:where()` always contributes zero. `:is()`, `:not()` and `:has()` contribute the weight of their most specific argument.",
        "A struck-through declaration in DevTools lost the cascade. A warning icon next to it means the browser threw the declaration away as invalid, which is a different bug with a different fix."
      ]
    },
    {
      "t": "lede",
      "x": "Most rules that \"do not apply\" never entered the competition. The selector missed, the value failed to parse, or the property has no effect on that kind of box. Specificity takes the blame because it is the part everyone half remembers, but it is only the fourth thing the browser consults. Check the cheaper explanations first."
    },
    {
      "t": "h2",
      "x": "Check that the rule is even in play"
    },
    {
      "t": "p",
      "x": "Four things have to be true before a declaration can win anything, and the cascade is the last of them. Work down the list in order, because each check is faster than the one after it."
    },
    {
      "t": "ol",
      "items": [
        "**The selector matches the element.** Scoped styles in Vue, CSS Modules and any build step that hashes class names mean the string in your editor is not always the string in the DOM. A conditional class that never gets added produces exactly the same symptom.",
        "**The declaration parsed.** `color: #ff` and `width: 100px%` are discarded on their own; the surrounding declarations in the block survive. That is why one broken character can look like the cascade behaving at random.",
        "**The property applies to that element.** `width` does nothing on a non-replaced inline element. `gap` does nothing unless the element is a flex, grid or multi-column container. `z-index` does nothing on a `position: static` element that is not a flex or grid item.",
        "**Nothing stronger overrode it.** Only now is specificity worth thinking about."
      ]
    },
    {
      "t": "code",
      "lang": "js",
      "x": "// 1. Does the selector match anything at all?\ndocument.querySelectorAll('.card__title').length   // 0 means stop here\n\n// 2. What value actually won?\nconst el = document.querySelector('.card__title')\ngetComputedStyle(el).fontSize                      // \"16px\"\n\n// 3. Does this element match the selector you wrote?\nel.matches('.card > .card__title')                 // false is very informative"
    },
    {
      "t": "p",
      "x": "The third check catches the most embarrassing class of bug. You wrote a child combinator and the markup has a wrapper div in between. Or the class lives on the parent, not the element you are inspecting. Neither of those produces an error anywhere, so the stylesheet looks correct right up until you ask the DOM directly."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Shorthands reset properties you never mentioned",
      "x": "`background: url('/hero.jpg')` written after `background-color: navy` resets the color to its initial value, because a shorthand sets every longhand it owns, including the ones you omitted. `font`, `border`, `flex`, `grid-area` and `transition` behave the same way. If a property keeps reverting to a value you never typed, search the file for a shorthand that contains it."
    },
    {
      "t": "h2",
      "x": "Specificity is three counters, not a score"
    },
    {
      "t": "p",
      "x": "Count ID selectors into A. Count class selectors, attribute selectors and pseudo-classes into B. Count type selectors and pseudo-elements into C. Then compare the two tuples from the left, stopping at the first difference. `(1, 0, 0)` beats `(0, 12, 4)` because the browser never reads past A. The familiar \"100 points, 10 points, 1 point\" model gives the right answer most of the time and the wrong answer as soon as you stack ten classes, which is exactly the situation where you need it to be right."
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "(A, B, C)",
        "Notes"
      ],
      "rows": [
        [
          "`*`, `>`, `+`, `~`",
          "0, 0, 0",
          "The universal selector and all combinators contribute nothing"
        ],
        [
          "`li`, `::before`",
          "0, 0, 1",
          "Type selectors and pseudo-elements"
        ],
        [
          "`.card`, `[type=\"text\"]`, `:hover`",
          "0, 1, 0",
          "Classes, attribute selectors and ordinary pseudo-classes"
        ],
        [
          "`#app`",
          "1, 0, 0",
          "One ID outranks any number of classes"
        ],
        [
          "`:where(#app, .card)`",
          "0, 0, 0",
          "Always zero, whatever is inside it"
        ],
        [
          "`:is(#app, .card)`",
          "1, 0, 0",
          "Takes its most specific argument"
        ],
        [
          "`:not(.card)`",
          "0, 1, 0",
          "Same rule. The argument counts, the `:not` wrapper does not"
        ],
        [
          "`a:has(> img)`",
          "0, 0, 2",
          "`a` plus the most specific argument, `img`"
        ],
        [
          "`style=\"color: red\"`",
          "n/a",
          "Inline styles are a separate, higher step in the cascade, not a specificity value"
        ]
      ],
      "caption": "How common selectors count. Any difference in A settles the match before B is read."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (0, 3, 1) */\n.page .card.is-active p { color: red; }\n\n/* (1, 0, 0) and it wins: A is compared first, and 1 > 0 */\n#promo { color: blue; }\n\n/* (0, 0, 0) on purpose, so any single class overrides it */\n:where(.btn) { padding: 8px 12px; }"
    },
    {
      "t": "p",
      "x": "That last pattern is the useful one. Wrapping a library's default selectors in `:where()` sets their specificity to zero, so consumers override them with a plain class instead of escalating. The trade-off is that anything inside `:where()` is now trivially overridable by accident too, including resets you would rather keep."
    },
    {
      "t": "p",
      "x": "Native CSS nesting follows the `:is()` rule, and this catches people out. A nested `&` takes the specificity of the most specific selector in the enclosing list. Nest something inside `#page, .page` and the nested rule carries the ID's weight in every branch, including the one that matched on the class. Nesting shipped across Chrome, Safari and Firefox during 2023, with a later revision relaxing the syntax rules; check current support against your own browser targets rather than trusting a snapshot in an article."
    },
    {
      "t": "h2",
      "x": "Cascade layers sit above specificity"
    },
    {
      "t": "p",
      "x": "This is the part that changes how the old rules feel. Cascade layers are compared before specificity, so a layer assignment beats any selector you could write. Declare the order once at the top of your entry stylesheet and the rest follows from it: for normal declarations, a later layer wins, and declarations in no layer at all beat everything in a layer."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, base, components;\n\n@layer base {\n  #page .btn { color: black; }   /* (1, 1, 0), but an early layer */\n}\n\n@layer components {\n  .btn { color: white; }         /* beats the ID above: later layer */\n}\n\n.btn { color: rebeccapurple; }   /* unlayered, so it beats both */"
    },
    {
      "t": "p",
      "x": "Now the flip. For important declarations the layer order is reversed, and the implicit \"no layer\" bucket moves from the top of the pile to the bottom. So `!important` inside your reset layer outranks `!important` in your components layer, and an unlayered `!important` loses to both. It reads as backwards until you see the intent: it lets a low-level layer state a rule that higher layers cannot casually undo."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer base {\n  .btn { color: black !important; }   /* wins: earliest layer */\n}\n\n@layer components {\n  .btn { color: white !important; }   /* loses */\n}\n\n.btn { color: red !important; }       /* unlayered important: loses to both */"
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Support and escape hatches",
      "x": "`@layer` shipped in Chrome, Firefox and Safari in spring 2022, so it is safe for evergreen targets and unusable in anything older without a fallback. Two related keywords are worth knowing: `revert` rolls a property back to the value it would have had from the previous origin, and `revert-layer` rolls it back to the previous cascade layer. Both are cleaner than guessing at an initial value."
    },
    {
      "t": "h2",
      "x": "The order the browser actually resolves"
    },
    {
      "t": "p",
      "x": "When two declarations set the same property on the same element, the browser sorts them by these criteria in order and stops at the first one that separates them."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** From weakest to strongest: normal browser defaults, normal user styles, normal author styles, running animations, important author styles, important user styles, important browser defaults, running transitions.",
        "**Context.** Declarations from outside a shadow tree and declarations from inside it are ranked separately, which is why a component's internal styles can be harder to reach than their specificity suggests.",
        "**Element-attached styles.** The `style` attribute wins over any selector in a stylesheet of the same importance.",
        "**Cascade layers**, as described above, with the order reversed for important declarations.",
        "**Specificity**, the three counters, compared from the left.",
        "**Order of appearance.** The last matching declaration in source order wins. This is the tiebreak most stylesheets actually depend on."
      ]
    },
    {
      "t": "p",
      "x": "Two consequences of that first line are worth holding on to. An `!important` declaration in a stylesheet overrides a normal inline `style` attribute, which surprises people who were taught that inline styles always win. And a running transition sits above important author styles, so `!important` will not stop a transition mid-flight, while it will override a CSS animation, because animations sit below it."
    },
    {
      "t": "p",
      "x": "Browser default styles matter more than their position implies, because they apply where you forgot to. Form controls are the usual case: `input`, `select`, `button` and `textarea` do not inherit the page font, so a `font-family` set on `body` genuinely does not reach them until you write `font: inherit` yourself. Nothing is overriding you there. Nothing ever matched."
    },
    {
      "t": "h2",
      "x": "When !important is the right answer"
    },
    {
      "t": "p",
      "x": "It has two honest uses. The first is overriding a third-party stylesheet you cannot edit and cannot load in a lower layer. The second is a diagnostic: add `!important` temporarily, and if the value still does not change, the selector was never matching and specificity was never the problem. That single test collapses most of this article into ten seconds of work."
    },
    {
      "t": "p",
      "x": "The reason to avoid it elsewhere is that it has no ceiling worth reaching. Once one rule is important, the next override must also be important, then more specific, then important and inline, and at that point the file has no usable structure left. Cascade layers solve the same problem without the escalation, because a layer boundary is a statement about intent rather than a brute-force win. If you inherit a codebase where important declarations are already fighting each other, moving whole stylesheets into layers is usually less work than untangling the selectors."
    },
    {
      "t": "h2",
      "x": "Finding the winner in DevTools"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm you selected the right node",
          "x": "Inspect the element and read the breadcrumb trail at the bottom of the elements panel. A wrapper div, a fragment root or a portal target will happily accept your click and show you styles for something adjacent to what you meant."
        },
        {
          "title": "Read the Styles pane from the top",
          "x": "Rules are listed strongest first. Anything with a line through it lost the cascade, and hovering the selector will tell you which rule beat it. If your declaration is not listed anywhere in the pane, the selector never matched."
        },
        {
          "title": "Look for warning icons, not just strikethrough",
          "x": "A warning next to a declaration means the browser rejected it. Firefox goes further and flags properties that parsed correctly but have no effect on that element, along with a sentence explaining why, which is the fastest way to catch the `gap` and `z-index` cases."
        },
        {
          "title": "Switch to the Computed tab",
          "x": "Expand the property in question and you get the winning value plus a link to the exact rule and file it came from. This is the reliable way to find a declaration hiding in a vendor bundle you did not know was loaded."
        },
        {
          "title": "Verify from the console",
          "x": "Selector matching and computed values are both queryable, so you never have to guess.",
          "code": "// Everything the selector matches, as live nodes\n$$('.card > .card__title')\n\n// The value the cascade settled on\ngetComputedStyle($0).color"
        }
      ]
    },
    {
      "t": "p",
      "x": "One habit is worth building out of all this. When a rule does not apply, resist the urge to make the selector longer. A longer selector is a bet that specificity is the problem, and most of the time it is not, so the bet costs you a permanently worse stylesheet in exchange for a fix that could have been one keystroke. Check that it matches, check that it parsed, check that the property does anything on that element. Then, and only then, argue about weight."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not applying even though the selector looks right?",
          "a": "In order of likelihood: the selector matches zero elements, the declaration was dropped as invalid, the property has no effect on that element type, or something later in the cascade won. Run `document.querySelectorAll('your-selector').length` first. A zero rules out every cascade explanation instantly, and it is a zero more often than most developers expect."
        },
        {
          "q": "Do more classes beat an ID in CSS?",
          "a": "No. Specificity is three separate counters compared from the left, so the browser compares ID counts first and stops there if they differ. `#promo` beats `.a.b.c.d.e.f.g.h.i.j.k.l`. The old \"IDs are worth 100 points\" mental model implies that eleven classes would tie, which is not how any current engine behaves."
        },
        {
          "q": "What is the specificity of :is(), :where(), :not() and :has()?",
          "a": "`:where()` always contributes zero, regardless of its contents. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, so `:is(#app, p)` counts as an ID even when it matched the `p`. The pseudo-class itself adds nothing in any of these cases; only the arguments count."
        },
        {
          "q": "How do cascade layers interact with !important?",
          "a": "They invert. For normal declarations, later layers win and unlayered styles beat all layers. For important declarations, earlier layers win and unlayered important declarations rank below every layered one. A practical use is putting accessibility or reset rules in your first layer with `!important`, where later layers cannot override them by accident."
        },
        {
          "q": "Is !important always bad practice?",
          "a": "No, but it is usually the wrong first move. It is reasonable for overriding a third-party stylesheet you cannot edit, and it is genuinely useful as a temporary diagnostic. The cost is that it has no ceiling: the only thing above an important author declaration is an inline important one, so every subsequent override gets uglier. Cascade layers give you the same control without the ratchet."
        },
        {
          "q": "Why did a stylesheet override my inline style attribute?",
          "a": "Because an important author declaration outranks a normal inline one. Inline styles sit above cascade layers and specificity, but below importance, so `color: red !important` in a stylesheet beats `style=\"color: blue\"` on the element. To win from inline, the inline declaration also has to be marked important."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model fits the problem, and why gap and alignment behave differently in each.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA before you commit the color.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The other reason a class never reaches the DOM: state that is one render behind what you expect.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-07",
  "updated": "2026-09-07",
  "author": "jackson",
  "related": []
};
