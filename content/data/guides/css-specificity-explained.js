module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "CSS specificity, cascade layers and !important",
  "eyebrow": "Troubleshooting",
  "description": "Your CSS rule is not applying. Work through selector matching, specificity, cascade layers and !important in the order a browser actually uses.",
  "standfirst": "How a browser resolves two conflicting declarations, why cascade layers now outrank specificity, and how to tell a losing rule from one that never matched at all.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important override",
    "specificity calculator"
  ],
  "cardDesc": "Specificity, cascade layers and !important, in the order the browser resolves them.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before blaming specificity, check that the selector matched and the value parsed. A discarded declaration and a defeated one look identical in your editor and completely different in DevTools.",
        "Specificity is three independent counters: IDs, then classes, then types. Compare them left to right with no carrying. One ID beats any number of classes, forever.",
        "Cascade layers are checked **before** specificity. A single class in a later layer beats an ID selector in an earlier one.",
        "`!important` reverses layer order. An important declaration in your first layer beats an important declaration in your last.",
        "`:where()` has zero specificity. It is the cheapest way to stop writing selectors you will have to out-shout later."
      ]
    },
    {
      "t": "lede",
      "x": "Open DevTools before you open the stylesheet. Almost every hour lost to this problem is lost by someone editing a rule that was never going to apply, because the real failure was a typo in the selector, a value the parser threw away, or a stylesheet that is not on the page. The cascade is deterministic and it is short. Once you know the order it runs in, the answer is usually visible in about ten seconds."
    },
    {
      "t": "h2",
      "x": "First, is your declaration even in the fight?"
    },
    {
      "t": "p",
      "x": "There are three distinct failure states and they need different fixes. The rule can be absent, meaning the selector matched nothing or the stylesheet never loaded. The declaration can be invalid, meaning the browser parsed the rule but dropped that one line. Or the declaration can be present, valid, applied, and then beaten by another one. Only the third is a cascade problem."
    },
    {
      "t": "p",
      "x": "The Styles pane in Chrome, Firefox and Safari tells you which you have. A declaration that lost the cascade is shown with a line through it. A declaration that failed to parse is shown greyed out, usually with a warning triangle next to it. A rule that does not appear in the pane at all did not match the selected element, and no amount of adding `!important` will change that."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Parsed, then discarded. The rest of the rule still applies. */\n.card {\n  color: blue;\n  padding: 10;        /* invalid: no unit, dropped at parse time */\n  bakcground: red;    /* invalid: typo in the property name, dropped */\n  width: calc(100% -20px); /* invalid: calc needs spaces around the minus */\n}"
    },
    {
      "t": "p",
      "x": "That last one catches people repeatedly. `calc(100% - 20px)` is valid and `calc(100% -20px)` is not, because without the space the parser reads `-20px` as a signed number rather than an operator and a number. The rule around it still works, so the element gets its color and you spend twenty minutes wondering why the width is ignored."
    },
    {
      "t": "note",
      "kind": "tip",
      "title": "Use the Computed tab, not the Styles tab",
      "x": "The Computed pane shows the final value of every property and, when you expand a property, the exact rule that produced it with a link to the source file and line. It answers \"who won\" directly instead of asking you to read a stack of struck-through rules and infer it."
    },
    {
      "t": "h2",
      "x": "How specificity is actually counted"
    },
    {
      "t": "p",
      "x": "A selector's specificity is a triple, commonly written (A, B, C). A counts ID selectors. B counts classes, attribute selectors and pseudo-classes. C counts element type selectors and pseudo-elements. Nothing else contributes: the universal selector `*` and the combinators `>`, `+`, `~` and descendant space are all worth zero."
    },
    {
      "t": "p",
      "x": "Comparison runs left to right and stops at the first difference. There is no carrying between columns. Eleven classes is (0,11,0) and still loses to a single ID at (1,0,0). Old browsers stored these counters in fixed-width fields that could overflow, which produced the folklore that enough classes eventually beat an ID. That has not been true in any current engine, so do not build on it."
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
          "`*`",
          "(0,0,0)",
          "The universal selector and all combinators contribute nothing."
        ],
        [
          "`li`",
          "(0,0,1)",
          "One type selector."
        ],
        [
          "`li::before`",
          "(0,0,2)",
          "Pseudo-elements count in the same column as element types."
        ],
        [
          "`.card`",
          "(0,1,0)",
          "One class."
        ],
        [
          "`[href^='https']`",
          "(0,1,0)",
          "Attribute selectors count as classes, whatever the operator."
        ],
        [
          "`a:hover`",
          "(0,1,1)",
          "One pseudo-class plus one type."
        ],
        [
          "`#app`",
          "(1,0,0)",
          "One ID beats any quantity of classes."
        ],
        [
          "`.card .title a`",
          "(0,2,1)",
          "Two classes and a type; the descendant spaces are free."
        ],
        [
          "`:where(#app) .title`",
          "(0,1,0)",
          "`:where()` zeroes everything inside it."
        ],
        [
          "`:not(#app)`",
          "(1,0,0)",
          "`:not()` takes the specificity of its most specific argument."
        ],
        [
          "`style=\"...\"`",
          "n/a",
          "Inline styles sit above every selector in the same origin and importance bucket."
        ]
      ],
      "caption": "Specificity of common selectors. Compare left to right and stop at the first column that differs."
    },
    {
      "t": "h3",
      "x": "The functional pseudo-classes change the arithmetic"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` all take the specificity of the most specific selector in their argument list. `:where()` is the exception and always contributes zero, no matter what you put inside it. This is the single most useful specificity tool added to CSS in years, because it lets you write a selector that is precise without being hard to override."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* (1,0,1): the #app in the list drags the whole thing up */\n:is(#app, .page) h2 { margin-block: 0; }\n\n/* (0,0,1): same match, but anyone can override it with a single class */\n:where(#app, .page) h2 { margin-block: 0; }\n\n/* A deliberate bump: repeating a class raises column B legitimately */\n.btn.btn { border-radius: 999px; }   /* (0,2,0) */"
    },
    {
      "t": "p",
      "x": "That repetition trick is worth knowing. `.btn.btn` matches exactly what `.btn` matches, but scores (0,2,0), so it wins on source order tie-breaks and beats a single class. It is honest in a way `!important` is not, because it stays inside the specificity system and can still be overridden by something more specific."
    },
    {
      "t": "h3",
      "x": "Nesting inherits the specificity of its parent"
    },
    {
      "t": "p",
      "x": "Native CSS nesting resolves `&` like `:is()` applied to the parent selector list. If the parent list contains an ID, every nested rule underneath it carries that ID's weight, whether or not you wanted it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "#app, .page {\n  .title { color: red; }   /* (1,1,0), because :is(#app, .page) scores (1,0,0) */\n}\n\n/* Keep the match, drop the weight */\n:where(#app, .page) {\n  .title { color: red; }   /* (0,1,0) */\n}"
    },
    {
      "t": "h2",
      "x": "The order the browser really uses"
    },
    {
      "t": "p",
      "x": "Specificity is one step of six, and it is not the first. When two declarations set the same property on the same element, the browser works down this list and stops as soon as one side wins."
    },
    {
      "t": "ol",
      "items": [
        "**Origin and importance.** Author styles beat user styles beat the browser's default stylesheet. For `!important` declarations that order flips, which is how a user's accessibility stylesheet can force a font size your site cannot undo.",
        "**Context.** Styles from outside a shadow tree and styles from inside it are separated here, which is why a web component's internals resist your page CSS.",
        "**Inline styles.** A `style` attribute beats any selector in the same origin and importance bucket.",
        "**Cascade layers.** Later layers win. Unlayered styles behave as though they come after every layer.",
        "**Specificity.** The (A,B,C) triple, compared left to right.",
        "**Order of appearance.** The last matching declaration in document order wins. Everything else being equal, this is the tie-break."
      ]
    },
    {
      "t": "p",
      "x": "Two things sit outside that list and surprise people. Declarations produced by a running CSS animation override normal author declarations, including inline styles, for as long as the animation applies. Declarations produced by a running transition override everything, including `!important`, while the transition is in flight. If a value is correct at rest and wrong for a fraction of a second, look at your transitions rather than your selectors."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "!important inside @keyframes does nothing",
      "x": "The specification says an `!important` declaration in a keyframe block is ignored outright. If you have added one to force an animation step to stick, it is not doing what you think, and the behaviour you are seeing has another cause."
    },
    {
      "t": "h2",
      "x": "Cascade layers outrank specificity"
    },
    {
      "t": "p",
      "x": "`@layer` is the part that breaks people's mental model, because a rule with lower specificity can now beat one with higher specificity purely because of which layer it sits in. Layer order is fixed by the first place each layer name appears, which is why the single-line declaration at the top of a stylesheet is the conventional way to write it."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Declare the order once, up front. Later layers win. */\n@layer reset, vendor, components, utilities;\n\n@layer components {\n  #sidebar .card .title { color: rebeccapurple; }  /* (1,2,1) */\n}\n\n@layer utilities {\n  .text-black { color: black; }                    /* (0,1,0) */\n}\n\n/* black wins: the utilities layer is later, and layers are\n   compared before specificity is ever looked at. */"
    },
    {
      "t": "p",
      "x": "Unlayered styles are the trap in the other direction. Anything not inside a layer is treated as if it were in a final, implicit layer after all the named ones. Import a third-party stylesheet without wrapping it, and its plain `.button` rule will beat your carefully ordered component layer. Wrapping it fixes that in one line: `@import url('vendor.css') layer(vendor);`."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "Layer order reverses for !important",
      "x": "For normal declarations, the last layer wins. For important declarations, the **first** layer wins, and layered important styles beat unlayered ones. So `!important` in a reset layer outranks `!important` in a utilities layer, which is the exact opposite of what the same two files do without the keyword. If a team adds `!important` to fight a layering problem, the result is frequently worse than the original."
    },
    {
      "t": "p",
      "x": "There is one further step between layers and source order in newer engines: scope proximity, from `@scope`. When two rules are otherwise tied, the one whose scope root is nearer the element wins. Browser support arrived in Chrome and Safari first and in Firefox during 2024, so check caniuse.com for current numbers before you depend on it."
    },
    {
      "t": "h2",
      "x": "When !important is defensible, and what it costs"
    },
    {
      "t": "p",
      "x": "It has real uses. Overriding inline styles written by a third-party widget you do not control is one, because nothing else in the author origin can reach an inline style. Print stylesheets are another. Accessibility overrides in a user stylesheet are the case the mechanism was designed for in the first place."
    },
    {
      "t": "p",
      "x": "The cost is that you have left the ordinary system. Once a declaration is important, the only things that beat it are another important declaration with higher specificity, an important declaration later in source order at equal specificity, an important declaration in an earlier layer, or a user or user-agent important declaration. Each `!important` you add makes the next override harder, and the usual end state is a codebase where the answer to every conflict is another exclamation mark."
    },
    {
      "t": "p",
      "x": "Before reaching for it, try the cheaper options: put the rule in a later layer, repeat a class to raise column B, or wrap the noisy parts of the competing selector in `:where()` so it stops being a problem for everyone else too."
    },
    {
      "t": "h2",
      "x": "Failures that have nothing to do with the cascade"
    },
    {
      "t": "p",
      "x": "A good share of \"specificity\" bugs are not about specificity at all. Work through these before you start counting columns."
    },
    {
      "t": "ul",
      "items": [
        "**The property does not apply to that element.** `width` and vertical `margin` are ignored on non-replaced inline elements. Setting `display: inline-block` or `block` makes them take effect.",
        "**A shorthand later in the file reset your longhand.** `background: red` after `background-image: url(...)` wipes the image, because a shorthand sets every longhand it owns, including the ones you did not mention.",
        "**The property is not inherited.** `border` and `padding` do not pass down. Only inherited properties such as `color`, `font-family` and `line-height` reach descendants on their own.",
        "**The build renamed your class.** CSS Modules, styled-components and similar tools hash class names. The selector in your source file and the class in the DOM are different strings.",
        "**The stylesheet is not on the page.** A 404 on a `<link>`, a stale build output, or a file excluded by a content-scanning step in your framework all look the same from the browser: nothing.",
        "**A media or container query does not match.** The rule is in the file, greyed out in DevTools, and waiting for a viewport you are not testing at.",
        "**The value is unsupported in that browser.** The parser discards values it does not recognise, silently, per declaration.",
        "**Something injects a `<style>` tag after yours.** Runtime CSS-in-JS and many third-party scripts append to the head, which puts them later in source order and wins every tie."
      ]
    },
    {
      "t": "h2",
      "x": "A debugging order that works"
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Confirm the element and the rule",
          "x": "Select the element in DevTools and look for your selector in the Styles pane. Not present means it did not match. Check the DOM for the actual class attribute rather than trusting your source file.",
          "code": "/* Sanity check from the console: does the selector match anything? */\ndocument.querySelectorAll('.card .title').length"
        },
        {
          "title": "Check the declaration parsed",
          "x": "Greyed-out text or a warning icon means the value was rejected. Fix the unit, the function syntax or the spelling before considering anything else."
        },
        {
          "title": "Ask the Computed pane who won",
          "x": "Expand the property in the Computed tab. It names the winning rule and its source location. That is your opponent, and everything below is about beating it specifically."
        },
        {
          "title": "Compare layer, then specificity, then order",
          "x": "In that sequence. If the winner is in a later layer, no specificity change will help. If it is in the same layer with the same specificity, it is winning purely on source order, and moving your rule down the file is enough."
        },
        {
          "title": "Fix it at the lowest level that works",
          "x": "Move the rule into the right layer, or lower the opponent's specificity with `:where()`, or raise yours by repeating a class. Treat `!important` as the last option rather than the first."
        }
      ]
    },
    {
      "t": "p",
      "x": "One habit prevents most of this from recurring. Keep author selectors flat and cheap, ideally one class, and let layers carry the ordering. Specificity then stops being a resource you spend and becomes a detail you rarely have to think about, which is the point of the layer mechanism existing at all."
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even with !important?",
          "a": "Three common reasons. The selector is not matching the element, so the rule never enters the cascade and importance is irrelevant. The declaration is invalid and was discarded at parse time, which `!important` does not rescue. Or another important declaration is beating yours, either at higher specificity, later in source order at equal specificity, or in an earlier cascade layer. Check the Styles pane first: a rule you cannot see there did not match."
        },
        {
          "q": "Do multiple classes beat an ID selector?",
          "a": "No. Specificity columns are compared left to right with no carrying, so any selector containing one ID beats any selector containing none, regardless of how many classes are stacked up. Old browsers had counter overflow bugs that made this appear to work, and current engines do not. To beat an ID without adding one, put your rule in a later cascade layer, or wrap the ID in `:where()` in the original selector so it scores zero."
        },
        {
          "q": "How do I override an inline style without !important?",
          "a": "You mostly cannot from the author origin, which is one of the legitimate uses of `!important`. An inline `style` attribute outranks every author selector at the same importance level, so an important author declaration is the normal answer. The alternatives are removing or editing the attribute in JavaScript, or, if the inline style comes from an animation library, letting it finish and styling the resting state instead."
        },
        {
          "q": "What order do cascade layers apply in?",
          "a": "Layers apply in the order their names first appear, and later layers win for normal declarations. Styles that are not in any layer act as a final implicit layer, so unlayered CSS beats all layered CSS. For `!important` declarations the order reverses: the earliest layer wins, and layered important styles beat unlayered ones. Declaring the full order in one `@layer a, b, c;` statement at the top of your entry stylesheet keeps this predictable."
        },
        {
          "q": "What is the difference between :is() and :where()?",
          "a": "They match identically and group a list of selectors. `:is()` takes the specificity of the most specific selector in its list, so `:is(#app, .page)` scores (1,0,0). `:where()` always contributes zero. Use `:where()` for anything you or another developer may need to override later, particularly around resets, base styles and nesting parents."
        },
        {
          "q": "Why does my style apply and then get overwritten a moment later?",
          "a": "Look at transitions, animations and scripts. Declarations from a running transition sit above `!important` in the cascade, and declarations from a running animation sit above normal author styles including inline ones. A script that writes to `element.style` after load produces the same symptom. If the computed value changes without any user interaction, record a performance trace or set a DOM attribute-modification breakpoint on the element to catch the writer."
        }
      ]
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Choosing a layout model, and the sizing rules that cause overflow.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guide"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Test foreground and background pairs against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tool"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The other class of bug where the code looks right and the output disagrees.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Troubleshooting"
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-09-16",
  "updated": "2026-09-16",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
