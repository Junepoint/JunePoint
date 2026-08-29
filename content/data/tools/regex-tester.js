module.exports = {
  slug: 'regex-tester',
  title: 'Regex Tester — Live Match Highlighting & Groups',
  h1: 'Regex Tester',
  eyebrow: 'Developer tool',
  description:
    'Test JavaScript regular expressions with live highlighting, capture groups, named groups and a library of ready-made patterns. Runs offline in your browser.',
  standfirst:
    'Write a pattern, see every match highlighted as you type, and inspect capture groups without leaving the page.',
  keywords: ['regex tester', 'regular expression tester', 'regex101 alternative', 'javascript regex', 'test regex online'],
  published: '2026-04-09',
  updated: '2026-08-16',
  author: 'alexander',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-field">
    <label for="rx-pattern">Pattern</label>
    <input class="jp-input" type="text" id="rx-pattern" spellcheck="false" autocapitalize="off"
      style="font-family:var(--mono)" value="(\\w+)@(\\w+)\\.(\\w{2,})" />
  </div>

  <div class="jp-toolbar">
    <label class="jp-checkline"><input type="checkbox" id="rx-g" checked /> <code>g</code> global</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-i" /> <code>i</code> ignore case</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-m" /> <code>m</code> multiline</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-s" /> <code>s</code> dotall</label>
    <label class="jp-checkline"><input type="checkbox" id="rx-u" /> <code>u</code> unicode</label>
  </div>

  <div class="jp-field">
    <span class="jp-field-legend" id="rx-presets-label">Start from a pattern</span>
    <div class="jp-chips" id="rx-presets" role="group" aria-labelledby="rx-presets-label"></div>
  </div>

  <div class="jp-field">
    <label for="rx-subject">Test string</label>
    <textarea class="jp-textarea" id="rx-subject" spellcheck="false" style="min-height:150px">Contact ada@example.com or grace@navy.mil before Friday.
Escalations go to oncall@junepoint.com — do not email root@localhost.</textarea>
  </div>

  <p class="jp-status" id="rx-status" role="status" aria-live="polite">&nbsp;</p>

  <h2 class="jp-tool-h" style="margin-top:1.25rem">Highlighted result</h2>
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
    ['Hex colour', '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\\\b'],
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
        if (m[0] === '') re.lastIndex++;   // zero-length match would loop forever
      }
    } else {
      var single = re.exec(text);
      if (single) matches.push(single);
    }

    if (!matches.length) {
      setStatus('No matches', 'err');
      highlight.textContent = text;
      matchList.innerHTML = '<p style="color:var(--text-mute)">Nothing matched. Check your escaping, and remember the pattern is not anchored unless you add ^ and $.</p>';
      return;
    }

    setStatus(matches.length + ' match' + (matches.length === 1 ? '' : 'es') + ' found', 'ok');

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
            (match.groups[name] === undefined ? '—' : escapeHtml(match.groups[name])) + '</dd>';
        });
      }
      return '<div class="jp-stat" style="margin-bottom:.6rem">' +
        '<p class="jp-stat-label">Match ' + (i + 1) + ' · index ' + match.index + '</p>' +
        '<p style="font-family:var(--mono);font-weight:700;margin:.2rem 0 .5rem;word-break:break-all">' +
          escapeHtml(match[0]) + '</p>' +
        (groups ? '<dl class="jp-kv">' + groups + '</dl>' : '') +
      '</div>';
    }).join('') + (matches.length > 50 ? '<p style="color:var(--text-mute)">Showing the first 50 of ' + matches.length + '.</p>' : '');
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
      title: 'This tests the JavaScript flavour',
      x: 'Regex dialects differ. JavaScript has no lookbehind in older Safari, no possessive quantifiers and no recursion. PCRE, Python’s `re`, Go’s RE2 and Java each vary. A pattern verified here will behave identically in Node and in every current browser — check it separately if the target is another language.',
    },

    { t: 'h2', x: 'The syntax you will use ninety percent of the time' },
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
        ['`\\b`', 'Word boundary', 'The fix for matching `cat` inside `concatenate`'],
        ['`(…)`', 'Capture group', '`(?:…)` groups without capturing'],
        ['`(?<name>…)`', 'Named capture group', 'Read it back as `match.groups.name`'],
        ['`(?=…)` `(?!…)`', 'Lookahead, positive and negative', 'Asserts without consuming characters'],
      ],
    },

    { t: 'h2', x: 'Greedy versus lazy: the classic bug' },
    {
      t: 'p',
      x: 'Quantifiers are greedy — they take as much as possible and give back only when forced. Against `<b>bold</b> and <i>italic</i>`, the pattern `<.+>` matches the **entire string**, not the first tag, because `.+` swallows everything and backtracks just enough for the final `>` to match.',
    },
    {
      t: 'p',
      x: 'Adding `?` makes a quantifier lazy: `<.+?>` stops at the first `>` and matches each tag separately. Paste both into the tester above with that string and the difference is immediate.',
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
      x: 'The third form is the one to reach for. A negated character class cannot overshoot in the first place, so there is nothing to backtrack — which matters more than elegance, for the reason below.',
    },

    { t: 'h2', x: 'Catastrophic backtracking, and why it is a security bug' },
    {
      t: 'p',
      x: 'Nested quantifiers over overlapping character sets can make the engine explore an exponential number of paths before admitting failure. The canonical example is `(a+)+$` against a long run of `a` characters followed by a `!`.',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `// Innocent-looking. Hangs the thread.
/(a+)+$/.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaa!');

// A real-world shape of the same problem: nested quantifier
// with an overlapping inner set.
/^(\\s*\\w+)+$/.test('    lots of words here     x');`,
    },
    {
      t: 'p',
      x: 'This has a name — **ReDoS**, regular expression denial of service — and it has taken down production systems, including a well-known Cloudflare outage in 2019. If a pattern ever runs against user-supplied input, it is attack surface.',
    },
    {
      t: 'ul',
      items: [
        'Avoid nesting quantifiers, especially `(x+)+`, `(x*)*` and `(x|y)*` where `x` and `y` can match the same text.',
        'Prefer negated character classes (`[^>]+`) to lazy dot (`.+?`) — they cannot backtrack into each other.',
        'Anchor patterns with `^` and `$` so failure is detected early instead of retried at every offset.',
        'On a server, cap input length before matching, or use a linear-time engine such as Go’s RE2 or Rust’s `regex` crate, neither of which can backtrack at all.',
      ],
    },

    { t: 'h2', x: 'Things regex should not be used for' },
    {
      t: 'p',
      x: 'Two rules save a lot of pain. **Do not parse HTML or XML with regex** — they are recursively nested, regular expressions are not, and every attempt eventually meets a nested tag or a comment containing markup. Use a DOM parser.',
    },
    {
      t: 'p',
      x: '**Do not write a strict email validator.** The full RFC 5322 grammar permits quoted local parts, comments and IP-literal domains; the widely circulated "complete" regex for it runs to several thousand characters and still rejects valid addresses. In practice, check for a single `@` with something on either side, then send a confirmation email. Deliverability is the only validation that means anything.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Comment complex patterns',
      x: 'JavaScript has no `x` (extended) flag, so build long patterns from named pieces and combine them with `new RegExp()`. A pattern you cannot read in six months is a pattern you will rewrite from scratch rather than fix.',
    },

    { t: 'h2', x: 'Capture groups in practice' },
    {
      t: 'code',
      lang: 'javascript',
      x: `const LOG = /^(?<ts>\\S+) \\[(?<level>\\w+)\\] (?<msg>.+)$/;

const { groups } = LOG.exec('2026-08-16T09:14:02Z [ERROR] payment declined');
groups.level;   // 'ERROR'
groups.msg;     // 'payment declined'

// Every match, with position and groups
for (const m of text.matchAll(/(\\w+)=(\\w+)/g)) {
  console.log(m[1], m[2], m.index);
}

// Reference groups in a replacement
'2026-08-16'.replace(/(\\d{4})-(\\d{2})-(\\d{2})/, '$3/$2/$1');  // '16/08/2026'`,
    },
    {
      t: 'p',
      x: 'Named groups are worth the extra characters. `groups.level` survives someone inserting a group in the middle of the pattern; `match[2]` does not.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Why does my global regex skip every other match?',
          a: 'A regex object with the g flag carries a mutable lastIndex property between calls. Reusing the same object across test() or exec() calls resumes from where the last one stopped. Either create the regex fresh each time, or reset lastIndex to 0 before reusing it — this is one of the most common bugs in JavaScript regex code.',
        },
        {
          q: 'How do I match across multiple lines?',
          a: 'Two different flags, often confused. The s (dotall) flag makes . match newline characters. The m (multiline) flag changes ^ and $ to match at the start and end of each line rather than the whole string. You often want both.',
        },
        {
          q: 'Is my test data sent anywhere?',
          a: 'No. The pattern is compiled and executed by your browser’s own regex engine. Nothing is transmitted, which means you can safely test against log excerpts you would not paste into a hosted service.',
        },
        {
          q: 'Why is a pattern from Stack Overflow failing here?',
          a: 'Most likely a flavour difference. Lookbehind (?<=…) is unsupported in older Safari; possessive quantifiers (a++) and atomic groups (?>…) do not exist in JavaScript at all; and \\Z, \\A and recursion are PCRE features. This tool tests the JavaScript flavour specifically.',
        },
        {
          q: 'Does the tester protect me from a runaway pattern?',
          a: 'Partially. Match collection is capped at 5,000 and zero-length matches are advanced so they cannot loop forever. It cannot interrupt catastrophic backtracking inside a single exec call — if the page freezes after you type a nested quantifier, that is exactly the ReDoS behaviour described above, and closing the tab is the fix.',
        },
      ],
    },
  ],

  related: ['/tools/cron-expression-generator/', '/tools/json-formatter/', '/guides/fix-cors-errors/'],
};
