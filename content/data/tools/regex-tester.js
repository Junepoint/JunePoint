module.exports = {
  slug: 'regex-tester',
  title: 'JavaScript Regex Tester with Match Highlighting',
  h1: 'Regex Tester',
  eyebrow: 'Developer tool',
  description:
    'Test JavaScript regular expressions in your browser. Highlight matches, inspect capture groups and load common pattern examples.',
  standfirst:
    'Enter a pattern and test string to see each match, its index and any numbered or named capture groups.',
  keywords: ['regex tester', 'regular expression tester', 'regex101 alternative', 'javascript regex', 'test regex online'],
  published: '2026-04-09',
  updated: '2026-08-16',
  author: 'jackson',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-field">
    <label for="rx-pattern">Regular expression</label>
    <input class="jp-input" type="text" id="rx-pattern" spellcheck="false" autocapitalize="off"
      style="font-family:var(--mono)" value="(\\w+)@(\\w+)\\.(\\w{2,})" />
  </div>

  <div class="jp-toolbar">
    <label class="jp-checkline"><input type="checkbox" id="rx-g" checked /> <code>g</code> all matches</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-i" /> <code>i</code> ignore letter case</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-m" /> <code>m</code> multiline anchors</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-s" /> <code>s</code> dot matches newlines</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-u" /> <code>u</code> Unicode mode</label>
  </div>

  <div class="jp-field">
    <span class="jp-field-legend" id="rx-presets-label">Example patterns</span>
    <div class="jp-chips" id="rx-presets" role="group" aria-labelledby="rx-presets-label"></div>
  </div>

  <div class="jp-field">
    <label for="rx-subject">Test string</label>
    <textarea class="jp-textarea" id="rx-subject" spellcheck="false" style="min-height:150px">Contact ada@example.com or grace@navy.mil before Friday.
Escalations go to jackson@allwatermarinegroup.com. Do not email root@localhost.</textarea>
  </div>

  <p class="jp-status" id="rx-status" role="status" aria-live="polite">&nbsp;</p>

  <h2 class="jp-tool-h" style="margin-top:1.25rem">Highlighted matches</h2>
  <div class="jp-out" id="rx-highlight" style="white-space:pre-wrap"></div>

  <h2 class="jp-tool-h" style="margin-top:1.25rem">Matches</h2>
  <div id="rx-matches"></div>
</div>`,

    js: `
(function () {
  var pattern = document.getElementById('rx-pattern');
  var subject = document.getElementById('rx-subject');
  var status = document.getElementById('rx-status');
  var highlight = document.getElementById('rx-highlight');
  var matchList = document.getElementById('rx-matches');
  var FLAGS = ['g', 'i', 'm', 's', 'u'];

  var PRESETS = [
    ['Email', '[\\\\w.+-]+@[\\\\w-]+\\\\.[\\\\w.]{2,}'],
    ['URL', 'https?://[\\\\w.-]+(?:/[\\\\w./?%&=-]*)?'],
    ['IPv4', '\\\\b(?:\\\\d{1,3}\\\\.){3}\\\\d{1,3}\\\\b'],
    ['ISO date', '\\\\d{4}-\\\\d{2}-\\\\d{2}'],
    ['Hex color', '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\\\b'],
    ['UK postcode', '[A-Z]{1,2}\\\\d[A-Z\\\\d]?\\\\s?\\\\d[A-Z]{2}'],
    ['US phone', '\\\\(?\\\\d{3}\\\\)?[-.\\\\s]?\\\\d{3}[-.\\\\s]?\\\\d{4}'],
    ['Duplicate words', '\\\\b(\\\\w+)\\\\s+\\\\1\\\\b'],
    ['Named groups', '(?<year>\\\\d{4})-(?<month>\\\\d{2})-(?<day>\\\\d{2})'],
    ['Trailing spaces', '[ \\\\t]+$']
  ];

  function escapeHtml(text) {
    return text.replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  function flags() {
    return FLAGS.filter(function (f) { return document.getElementById('rx-' + f).checked; }).join('');
  }

  function setStatus(message, kind) {
    status.textContent = message || '\\u00a0';
    status.className = 'jp-status' + (kind ? ' jp-status--' + kind : '');
  }

  function run() {
    var source = pattern.value;
    var text = subject.value;

    if (!source) {
      setStatus('');
      highlight.textContent = text;
      matchList.innerHTML = '';
      return;
    }

    var re;
    try {
      re = new RegExp(source, flags());
    } catch (error) {
      setStatus(error.message, 'err');
      highlight.textContent = text;
      matchList.innerHTML = '';
      return;
    }

    var matches = [];
    var guard = 0;
    if (re.global) {
      var m;
      while ((m = re.exec(text)) !== null && guard++ < 5000) {
        matches.push(m);
        if (m[0] === '') re.lastIndex++;   // Empty matches would repeat forever
      }
    } else {
      var single = re.exec(text);
      if (single) matches.push(single);
    }

    if (!matches.length) {
      setStatus('No matches found.', 'err');
      highlight.textContent = text;
      matchList.innerHTML = '<p style="color:var(--text-mute)">The pattern did not match the test string. Check escaped characters and add ^ or $ only when you need an anchor.</p>';
      return;
    }

    setStatus(matches.length + ' match' + (matches.length === 1 ? '' : 'es') + ' found.', 'ok');

    var out = '';
    var cursor = 0;
    matches.forEach(function (match) {
      out += escapeHtml(text.slice(cursor, match.index));
      out += '<mark class="jp-match">' + escapeHtml(match[0]) + '</mark>';
      cursor = match.index + match[0].length;
    });
    out += escapeHtml(text.slice(cursor));
    highlight.innerHTML = out;

    matchList.innerHTML = matches.slice(0, 50).map(function (match, i) {
      var groups = '';
      for (var g = 1; g < match.length; g++) {
        groups += '<dt>Group ' + g + '</dt><dd>' +
          (match[g] === undefined ? '<em style="color:var(--text-mute)">undefined</em>' : escapeHtml(match[g])) + '</dd>';
      }
      if (match.groups) {
        Object.keys(match.groups).forEach(function (name) {
          groups += '<dt>&lt;' + escapeHtml(name) + '&gt;</dt><dd>' +
            (match.groups[name] === undefined ? 'Not captured' : escapeHtml(match.groups[name])) + '</dd>';
        });
      }
      return '<div class="jp-stat" style="margin-bottom:.6rem">' +
        '<p class="jp-stat-label">Match ' + (i + 1) + ' at index ' + match.index + '</p>' +
        '<p style="font-family:var(--mono);font-weight:700;margin:.2rem 0 .5rem;word-break:break-all">' +
          escapeHtml(match[0]) + '</p>' +
        (groups ? '<dl class="jp-kv">' + groups + '</dl>' : '') +
      '</div>';
    }).join('') + (matches.length > 50 ? '<p style="color:var(--text-mute)">Only the first 50 of ' + matches.length + ' matches are shown.</p>' : '');
  }

  document.getElementById('rx-presets').innerHTML = PRESETS.map(function (p, i) {
    return '<button class="jp-chip" type="button" data-preset="' + i + '">' + p[0] + '</button>';
  }).join('');

  document.getElementById('rx-presets').addEventListener('click', function (event) {
    var button = event.target.closest('[data-preset]');
    if (!button) return;
    pattern.value = PRESETS[+button.getAttribute('data-preset')][1];
    run();
  });

  pattern.addEventListener('input', run);
  subject.addEventListener('input', run);
  FLAGS.forEach(function (f) { document.getElementById('rx-' + f).addEventListener('change', run); });
  run();
})();`,
  },

  blocks: [
    {
      t: 'note',
      kind: 'info',
      title: 'This tool uses JavaScript regex syntax',
      x: 'Regular expression syntax differs by engine. Older Safari versions lack lookbehind, and JavaScript does not support possessive quantifiers or recursion. PCRE, Python’s `re`, Go’s RE2 and Java have different features. Test the pattern in its target runtime when that runtime is not the browser.',
    },

    { t: 'h2', x: 'Common JavaScript regex syntax' },
    {
      t: 'table',
      head: ['Token', 'Matches', 'Note'],
      rows: [
        ['`.`', 'Any character except newline', 'Add the `s` flag to include newlines'],
        ['`\\d` `\\w` `\\s`', 'Digit, word character, whitespace', 'Uppercase negates: `\\D` `\\W` `\\S`'],
        ['`[abc]`', 'Any one of a, b or c', '`[^abc]` matches anything else'],
        ['`*` `+` `?`', 'Zero or more, one or more, optional', 'Greedy by default'],
        ['`{2,5}`', 'Between two and five times', '`{3}` is exactly three'],
        ['`^` `$`', 'Start and end of string', 'With the `m` flag, start and end of each line'],
        ['`\\b`', 'Word boundary', 'Prevents `cat` from matching inside `concatenate`'],
        ['`(…)`', 'Capture group', '`(?:…)` groups without capturing'],
        ['`(?<name>…)`', 'Named capture group', 'Read it back as `match.groups.name`'],
        ['`(?=…)` `(?!…)`', 'Lookahead, positive and negative', 'Asserts without consuming characters'],
      ],
    },

    { t: 'h2', x: 'Greedy and lazy quantifiers' },
    {
      t: 'p',
      x: 'Quantifiers are greedy by default: they consume as much text as possible and backtrack only as needed. Against `<b>bold</b> and <i>italic</i>`, `<.+>` matches the **entire string** because `.+` consumes through the last `>`.',
    },
    {
      t: 'p',
      x: 'Adding `?` makes the quantifier lazy. `<.+?>` stops at the next `>` and matches each tag separately. Compare the three forms below:',
    },
    {
      t: 'code',
      lang: 'text',
      x: `<.+>    → <b>bold</b> and <i>italic</i>      (one match, the lot)
<.+?>   → <b>  </b>  <i>  </i>                (four matches)
<[^>]+> → <b>  </b>  <i>  </i>                (four matches, and faster)`,
    },
    {
      t: 'p',
      x: 'The negated character class in the third form cannot cross a `>`, so it avoids the extra backtracking required by a dot quantifier.',
    },

    { t: 'h2', x: 'Catastrophic backtracking and ReDoS' },
    {
      t: 'p',
      x: 'Nested quantifiers over overlapping character sets can force a backtracking engine to explore an exponential number of paths before it reports failure. A standard example is `(a+)+$` applied to many `a` characters followed by `!`.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// This simple pattern can freeze the thread.
/(a+)+$/.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaa!');

    // The same risk appears in nested quantifiers
    // whose inner character sets overlap.
/^(\\s*\\w+)+$/.test('    lots of words here     x');`,
    },
    {
      t: 'p',
      x: 'This failure mode is called **regular expression denial of service (ReDoS)**. It has caused production outages, including Cloudflare’s 2019 outage. Treat any pattern that processes user-controlled input as an application security boundary.',
    },
    {
      t: 'ul',
      items: [
        'Avoid nesting quantifiers, especially `(x+)+`, `(x*)*` and `(x|y)*` where `x` and `y` can match the same text.',
        'Prefer a constrained character class such as `[^>]+` to a lazy dot such as `.+?` when the delimiter is known.',
        'Anchor patterns with `^` and `$` so failure is detected early instead of retried at every offset.',
        'On a server, limit input length before matching or use a non-backtracking engine such as Go’s RE2 or Rust’s `regex` crate.',
      ],
    },

    { t: 'h2', x: 'Cases that need a parser instead' },
    {
      t: 'p',
      x: '**Do not parse HTML or XML with a regular expression.** These formats can nest elements and contain markup inside comments or attributes. Use an HTML, XML or DOM parser that understands the document structure.',
    },
    {
      t: 'p',
      x: '**Do not use a strict regex as proof that an email address works.** RFC 5322 permits quoted local parts, comments and IP-literal domains. A basic shape check can catch obvious input errors, but a confirmation message is needed to establish that the address can receive mail.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Comment complex patterns',
      x: 'JavaScript has no `x` extended flag. Build a long expression from named string fragments and combine them with `new RegExp()` so each part can be reviewed and changed separately.',
    },

    { t: 'h2', x: 'Capture groups in practice' },
    {
      t: 'code',
      lang: 'javascript',
      x: `const LOG = /^(?<ts>\\S+) \\[(?<level>\\w+)\\] (?<msg>.+)$/;

const { groups } = LOG.exec('2026-08-16T09:14:02Z [ERROR] payment declined');
      groups.level;   // level is 'ERROR'
      groups.msg;     // msg is 'payment declined'

      // Iterate through matches with positions and groups
for (const m of text.matchAll(/(\\w+)=(\\w+)/g)) {
  console.log(m[1], m[2], m.index);
}

      // Use groups in replacement text
      '2026-08-16'.replace(/(\\d{4})-(\\d{2})-(\\d{2})/, '$3/$2/$1');  // Produces '16/08/2026'`,
    },
    {
      t: 'p',
      x: 'Named groups make consumers less dependent on group order. `groups.level` still identifies the intended value if another capture group is inserted earlier in the pattern; `match[2]` may not.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does my global regex skip every other match?',
          a: 'A regex with the `g` flag keeps a mutable `lastIndex` between calls. Reusing the same object with `test()` or `exec()` resumes from that position. Create a new regex for each run or reset `lastIndex` to `0` before reuse.',
        },
        {
          q: 'How do I match across multiple lines?',
          a: 'The `s` flag makes `.` match newline characters. The `m` flag changes `^` and `$` so they match line boundaries instead of only the boundaries of the full string. Use either or both according to the pattern.',
        },
        {
          q: 'Is my test data sent anywhere?',
          a: 'No. The browser compiles the pattern and runs it against the text. This tool does not send the pattern or test string to a server.',
        },
        {
          q: 'Why is a pattern from Stack Overflow failing here?',
          a: 'The pattern may target another regex engine. Older Safari versions do not support lookbehind `(?<=…)`. JavaScript does not support possessive quantifiers such as `a++`, atomic groups such as `(?>…)`, `\\Z`, `\\A` or recursive patterns. This tool uses the browser’s JavaScript engine.',
        },
        {
          q: 'Does the tester protect me from a runaway pattern?',
          a: 'Only partly. The tool stops collecting after 5,000 matches and advances past zero-length matches to avoid an endless loop. It cannot interrupt catastrophic backtracking inside one `exec()` call. A pathological pattern can still make the browser tab unresponsive.',
        },
      ],
    },
  ],

  related: ['/tools/cron-expression-generator/', '/tools/json-formatter/', '/guides/fix-cors-errors/'],
};
