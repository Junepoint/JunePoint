module.exports = {
  "slug": "css-specificity-explained",
  "title": "Why Your CSS Rule Is Not Applying",
  "h1": "Specificity, cascade layers and !important",
  "eyebrow": "Guides",
  "description": "Your CSS rule is not applying. Work through matching, the cascade, layers, specificity and !important in the order the browser actually uses.",
  "standfirst": "Most rules that \"do nothing\" are not losing a specificity fight: they never matched, or the declaration was thrown away as invalid. Here is the order to check things in, and what the three specificity numbers really mean.",
  "keywords": [
    "css specificity",
    "css rule not applying",
    "cascade layers",
    "css important",
    "specificity calculator"
  ],
  "cardDesc": "Debug a CSS rule that will not apply: matching first, then layers, specificity, inline styles and !important.",
  "featured": false,
  "blocks": [
    {
      "t": "takeaways",
      "items": [
        "Before counting selectors, prove the rule matched. A selector missing from the Styles pane never applied to anything, and no amount of extra weight will change that.",
        "The cascade compares in a fixed order: origin and importance, context, inline styles, cascade layers, specificity, then source order. A later rule only wins when everything above ties.",
        "Specificity is three independent numbers: ids, then classes/attributes/pseudo-classes, then types/pseudo-elements. `(1,0,0)` beats `(0,20,0)`. Columns never carry over.",
        "`:where()` always counts as zero. `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, and nesting's `&` behaves like `:is()`.",
        "Normal unlayered declarations beat every cascade layer. For `!important` the layer order reverses, so important declarations inside a layer beat unlayered important ones.",
        "A declaration set directly on an element always beats an inherited value, however specific the ancestor's selector was."
      ]
    },
    {
      "t": "h2",
      "x": "First prove the rule actually matched"
    },
    {
      "t": "p",
      "x": "Specificity gets blamed for a lot of problems it did not cause. There are two very different failures that both present as \"my CSS does nothing\": the declaration lost a cascade comparison, or the declaration was never in the running. Devtools tells these apart in about five seconds, and the distinction decides everything you do next."
    },
    {
      "t": "steps",
      "items": [
        {
          "title": "Look for your selector in the Styles pane",
          "x": "Select the element, then scan the Styles pane in Chrome or Edge, or Rules in Firefox. If your selector is not listed at all, it did not match this element. Typos, a parent that is not in the DOM where you assumed, a scoped component style, a stylesheet that 404ed, and a selector written against a class the framework renames at build time all look identical from the page."
        },
        {
          "title": "Check whether the declaration is struck through",
          "x": "A struck-out property means the browser parsed it, kept it, and then something beat it. That is a real cascade problem, and the winning declaration is listed above it in the same pane. Firefox additionally marks declarations that parsed fine but cannot have any effect on this element, which catches a whole category of confusion."
        },
        {
          "title": "Read the Computed pane, not the Styles pane",
          "x": "The Computed tab shows the value that won and lets you expand it to see which rule and file it came from. This is the fastest way to discover that the real winner is an inline style, a `!important` from a vendor bundle, or an animation."
        },
        {
          "title": "Confirm the rule exists in the loaded CSS",
          "x": "If you suspect the build dropped it, ask the page directly. Cross-origin sheets throw on `cssRules`, so the try/catch is not optional. Nested rules will not show up at the top level, so treat an empty result as a hint rather than proof.",
          "code": "[...document.styleSheets]\n  .flatMap(s => { try { return [...s.cssRules]; } catch { return []; } })\n  .filter(r => r.selectorText?.includes('.card-title'))"
        }
      ]
    },
    {
      "t": "h2",
      "x": "The order the browser decides in"
    },
    {
      "t": "p",
      "x": "The cascade is a sort, not a single comparison. Each step below is only consulted when the previous one ties. People tend to jump straight to step five, which is why a rule with a long, impressive selector can still lose to a one-word selector sitting in an unlayered stylesheet."
    },
    {
      "t": "table",
      "head": [
        "Step",
        "What gets compared"
      ],
      "rows": [
        [
          "1. Origin and importance",
          "Author `!important` beats normal author styles. A user stylesheet's `!important` beats the author's, which is how browser accessibility overrides keep working at all."
        ],
        [
          "2. Context",
          "Declarations from inside a shadow tree versus the outer document. Rarely the culprit unless you ship web components."
        ],
        [
          "3. Element-attached styles",
          "A declaration in an inline `style` attribute beats any selector at the same importance level."
        ],
        [
          "4. Cascade layers",
          "Normal declarations: later layers win, and unlayered styles win over all layers. Important declarations: the whole order flips."
        ],
        [
          "5. Specificity",
          "The three-number comparison, left column first."
        ],
        [
          "6. Order of appearance",
          "The last matching declaration wins. This is the tie-breaker, not the first test."
        ]
      ],
      "caption": "Simplified from the CSS cascade sorting order. Scope proximity from @scope sits near the bottom, below specificity."
    },
    {
      "t": "note",
      "kind": "info",
      "title": "Animations and transitions sit outside this",
      "x": "Declarations coming from a running `@keyframes` animation outrank all normal author declarations, including inline styles. Declarations from a running transition outrank everything, `!important` included, for as long as the transition lasts. If a value is correct until something hovers or a class toggles, look for a transition before you look at specificity."
    },
    {
      "t": "h2",
      "x": "Specificity is three numbers, not one"
    },
    {
      "t": "p",
      "x": "Write a selector's specificity as `(a,b,c)`. Ids go in `a`. Classes, attribute selectors and pseudo-classes go in `b`. Type selectors and pseudo-elements go in `c`. The comparison is lexicographic: compare `a`, and only if those are equal compare `b`, and so on. Columns are independent, so twenty classes still lose to one id. The old folklore about 256 classes overflowing into an id came from a browser bug that has not been relevant for many years."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* Assume <a id=\"promo\" class=\"cta\"> inside .footer */\n\na               { color: teal; }          /* (0,0,1) */\na.cta           { color: navy; }          /* (0,1,1) */\n.footer a.cta   { color: rebeccapurple; } /* (0,2,1) */\n#promo          { color: crimson; }       /* (1,0,0) <- wins */"
    },
    {
      "t": "table",
      "head": [
        "Selector",
        "Specificity",
        "Note"
      ],
      "rows": [
        [
          "`*`, `>`, `+`, `~`",
          "(0,0,0)",
          "The universal selector and all combinators add nothing."
        ],
        [
          "`li`, `::before`",
          "(0,0,1)",
          "Type selectors and pseudo-elements share the third column."
        ],
        [
          "`.card`, `[href^='http']`, `:hover`",
          "(0,1,0)",
          "Classes, attribute selectors and pseudo-classes share the second."
        ],
        [
          "`#main`",
          "(1,0,0)",
          "Ids only."
        ],
        [
          "`:where(#main, .card) p`",
          "(0,0,1)",
          "`:where()` zeroes out everything inside it, permanently."
        ],
        [
          "`:is(#main, .card) p`",
          "(1,0,1)",
          "`:is()` takes its most specific argument, so the id leaks out."
        ],
        [
          "`:not(.a):not(.b)`",
          "(0,2,0)",
          "`:not()` is not free. Each one contributes its argument's weight."
        ],
        [
          "`style=\"color: red\"`",
          "No specificity",
          "Wins at step three instead, above every selector of equal importance."
        ]
      ],
      "caption": "Specificity of common selector pieces. Add the columns of each compound selector in the chain."
    },
    {
      "t": "h3",
      "x": "The functional pseudo-classes trip people up"
    },
    {
      "t": "p",
      "x": "`:is()`, `:not()` and `:has()` all adopt the specificity of their most specific argument, which means grouping selectors to save typing can quietly raise your weight. `:where()` is the escape hatch: it matches the same elements and counts as nothing, which makes it the right tool for defaults you expect authors to override. Native nesting resolves `&` as if it were `:is()`, so a nested rule inherits the floor set by the most specific selector in the parent list."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "/* & resolves like :is(), so the id in the parent list sets the floor */\n#app, .widget {\n  & .title { font-weight: 600; }  /* (1,1,0), not (0,2,0) */\n}\n\n/* Defaults that stay cheap to override */\n:where(.prose) :where(h2) {\n  margin-block-start: 1.5em;      /* (0,0,0) */\n}"
    },
    {
      "t": "h2",
      "x": "Cascade layers change the answer entirely"
    },
    {
      "t": "p",
      "x": "`@layer` moves the fight up a level. Within an origin, every normal declaration in a layer loses to every normal declaration that is not in a layer, no matter how lopsided the specificity is. Declare your layer order once at the top of your entry stylesheet and the order of your `@import` statements or bundler output stops mattering."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer reset, base, components, utilities;\n\n@layer components {\n  #sidebar .card a { color: navy; }   /* (1,2,1) */\n}\n\n/* Not in any layer, so this wins anyway */\na { color: red; }                    /* (0,0,1) */"
    },
    {
      "t": "p",
      "x": "That inversion is the single most common surprise when a codebase adopts layers halfway. A legacy stylesheet that was never wrapped in a layer will beat your carefully structured component styles, and the Styles pane shows the loser struck through with a selector that looks far stronger. The fix is to put the legacy sheet in a low layer rather than to escalate the selector."
    },
    {
      "t": "p",
      "x": "`@layer` has been in all four major engines since early 2022, with Chrome 99 and Safari 15.4 both arriving that March. Verify current support before you rely on it if you still carry older Safari point releases. `revert-layer` is its useful companion: it rolls a property back to whatever the previous layer said, which is cleaner than guessing an initial value. `all: revert` does the same against the user-agent styles for every property at once."
    },
    {
      "t": "h2",
      "x": "What !important really does"
    },
    {
      "t": "p",
      "x": "`!important` does not raise specificity. It moves the declaration into a separate, higher bucket at step one, and inside that bucket all the later steps run again. Two important declarations are still compared by layer, then specificity, then source order. The layer comparison runs backwards for important declarations, so the first layer you declared wins, and unlayered important declarations are the weakest of all."
    },
    {
      "t": "code",
      "lang": "css",
      "x": "@layer vendor {\n  .btn { color: white !important; }   /* wins */\n}\n\n.btn { color: black !important; }     /* unlayered important: loses */\n\n/* Beats both, because inline styles outrank selectors\n   and the style attribute honours !important too:\n   <button class=\"btn\" style=\"color: black !important\"> */"
    },
    {
      "t": "p",
      "x": "There are honest uses. Overriding a third-party widget that writes inline styles from JavaScript is one, because nothing else in the author origin can reach it. Print stylesheets and user stylesheets are two more. The cost is that you have removed the normal tools from everyone who comes after you: the next person has to either match your importance or outrank it, and the escalation only goes one way. If you do use it, leave a comment naming the thing you were fighting, so it can be deleted when that dependency goes away."
    },
    {
      "t": "note",
      "kind": "warn",
      "title": "An inline !important is close to final",
      "x": "In the author origin, `!important` inside a `style` attribute cannot be overridden by any stylesheet rule. Your remaining options are to stop the script from setting it, to remove the attribute from the DOM yourself, or to live with it. A user stylesheet's `!important` still beats it, but you cannot ship one of those to your visitors."
    },
    {
      "t": "h2",
      "x": "Five failures that look like specificity and are not"
    },
    {
      "t": "p",
      "x": "If the declaration shows up greyed out, with a warning marker, or does not show up in the rule at all despite being in your source file, the cascade was never involved. The browser discards a declaration with a syntax error at parse time and keeps the rest of the block, so a single bad value disappears silently."
    },
    {
      "t": "ul",
      "items": [
        "**Invalid values.** `margin-top: 10` with no unit, a malformed hex color, or `calc(100% -20px)` where the minus needs spaces around it. All dropped, all still sitting in your file looking correct.",
        "**A custom property that resolves to nothing.** `color: var(--brand)` with `--brand` never defined is invalid at computed-value time. The property does not fall back to the previous declaration in the file: it inherits, or takes its initial value. Supply a fallback as the second argument to `var()` when the variable might be missing.",
        "**A shorthand later in the file.** `background: #fff` after your `background-image` resets it, and `font` resets `line-height`. Specificity is irrelevant when the thing overwriting you is a shorthand reset of the same longhand.",
        "**The property does not apply to that element.** `width` and `height` on a non-replaced inline element, `gap` on something that is not a flex, grid or multi-column container, `z-index` on a `position: static` element.",
        "**The selector never matched because a condition failed.** A media query with the wrong breakpoint direction, a container query where no ancestor declares containment, or an `@supports` test that is false in the browser you are looking at."
      ]
    },
    {
      "t": "p",
      "x": "Inheritance deserves its own mention, because it produces the most convincing false positive. A declaration set directly on an element always beats a value inherited from an ancestor, and the ancestor's specificity is not part of that comparison. `#page #main .content { color: #333 }` will not change the color of a link inside it, because the user-agent stylesheet sets `color` on `a` directly. The selector is not weak. It is aimed at the wrong element."
    },
    {
      "t": "h2",
      "x": "A short decision order"
    },
    {
      "t": "ol",
      "items": [
        "Is the selector listed in the Styles pane? If not, this is a matching problem. Fix the selector or the markup.",
        "Is the declaration greyed or marked invalid? Fix the value.",
        "Is it struck through? Click the winner and find out where it came from.",
        "Is the winner an inline style? Specificity cannot help. Find the script writing it.",
        "Is the winner unlayered while you are inside a layer? Move one of them. Do not inflate the selector.",
        "Only once all of that ties, compare the three specificity numbers, then source order.",
        "`!important` is the last resort, and it gets a comment explaining itself."
      ]
    },
    {
      "t": "p",
      "x": "The habit worth building is reading the Computed pane before editing the selector. Guessing costs a round trip through the build, and an inflated selector that happened to work leaves behind a rule nobody can safely override later. Codebases where every selector carries an id and three classes got that way one urgent fix at a time."
    },
    {
      "t": "cards",
      "items": [
        {
          "title": "CSS Grid vs. Flexbox",
          "desc": "Which layout model fits the problem, and what each one is bad at.",
          "href": "/guides/css-grid-vs-flexbox/",
          "eyebrow": "Guides"
        },
        {
          "title": "React useState Not Updating",
          "desc": "The same shape of bug in another layer: the code looks right and nothing changes.",
          "href": "/guides/react-usestate-not-updating/",
          "eyebrow": "Guides"
        },
        {
          "title": "Color Contrast Checker",
          "desc": "Check a foreground and background pair against WCAG AA and AAA.",
          "href": "/tools/color-contrast-checker/",
          "eyebrow": "Tools"
        }
      ]
    },
    {
      "t": "faq",
      "items": [
        {
          "q": "Why is my CSS not working even though the file is loading?",
          "a": "Check whether the selector appears in the Styles pane for that element. If it is absent, the rule never matched and the cascade was never involved: look at the class names in the rendered DOM, not in your source. If it appears but is greyed out, the value failed to parse. If it appears struck through, something genuinely beat it and devtools will name the winner."
        },
        {
          "q": "Does !important always win?",
          "a": "No. Two important declarations are still compared against each other by cascade layer, then specificity, then source order, and the layer order is reversed for important declarations. A user stylesheet's `!important` beats an author's, and a running CSS transition beats `!important` entirely while it runs."
        },
        {
          "q": "How many classes does it take to beat an id?",
          "a": "There is no number. The three specificity columns are compared independently and never carry over, so `(1,0,0)` beats `(0,99,0)`. To beat an id you need an id of your own, an inline style, a higher cascade layer, or `!important`."
        },
        {
          "q": "What is the specificity of :has()?",
          "a": "The same as its most specific argument, like `:is()` and `:not()`. So `.card:has(#promo)` counts as `(1,1,0)`. Wrap the argument in `:where()` if you want the match without the weight: `.card:has(:where(#promo))` is `(0,1,0)`."
        },
        {
          "q": "Why does my Tailwind or Bootstrap class keep getting overridden?",
          "a": "Usually stylesheet order or layers. A framework that emits its utilities inside a native `@layer` loses to any of your own normal declarations that are not in a layer, regardless of specificity. Confirm what your installed version emits by reading the generated CSS, since the layering approach changed between major releases of several frameworks."
        },
        {
          "q": "How do I override a third-party widget's inline styles?",
          "a": "A selector with `!important` beats a normal inline style, so `.widget-root .title { color: #111 !important }` is often enough. If the widget writes `!important` into the attribute itself, no stylesheet can win: configure the widget, strip the attribute in JavaScript after it renders, or accept it. If the widget uses a shadow DOM, your selectors will not reach inside it at all without an exposed custom property or `::part()`."
        }
      ]
    }
  ],
  "schemaType": "TechArticle",
  "published": "2026-10-07",
  "updated": "2026-10-07",
  "author": "jackson",
  "related": [
    "/tools/cloud-cost-calculator/",
    "/tools/color-contrast-checker/",
    "/tools/cron-expression-generator/"
  ]
};
