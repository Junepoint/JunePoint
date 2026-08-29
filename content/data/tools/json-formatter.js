module.exports = {
  slug: 'json-formatter',
  title: 'JSON Formatter & Validator — Free, Private, Instant',
  h1: 'JSON Formatter and Validator',
  eyebrow: 'Developer tool',
  description:
    'Format, validate, minify and sort JSON in your browser. Pinpoints syntax errors by line and column. Nothing is uploaded — your data never leaves the page.',
  standfirst:
    'Paste JSON, get it beautified or minified instantly, with syntax errors located by line and column. Everything runs locally — nothing is ever sent to a server.',
  keywords: ['json formatter', 'json validator', 'json beautifier', 'json minifier', 'format json online', 'json pretty print'],
  published: '2026-01-22',
  updated: '2026-08-19',
  author: 'jackson',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-toolbar">
    <button class="jp-btn" type="button" id="jf-format">Format</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-minify">Minify</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-sort">Sort keys</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-escape">Unescape string</button>
    <button class="jp-btn jp-btn--ghost" type="button" data-copy="jf-input">Copy</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-sample">Load sample</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-clear">Clear</button>
    <label class="jp-checkline" for="jf-indent">
      Indent
      <select class="jp-select" id="jf-indent" style="width:auto">
        <option value="2" selected>2 spaces</option>
        <option value="4">4 spaces</option>
        <option value="tab">Tab</option>
      </select>
    </label>
  </div>

  <div class="jp-field">
    <label for="jf-input">JSON input</label>
    <textarea class="jp-textarea" id="jf-input" spellcheck="false" autocapitalize="off" autocorrect="off"
      placeholder='{"paste":"your JSON here"}'></textarea>
  </div>

  <p class="jp-status" id="jf-status" role="status" aria-live="polite">&nbsp;</p>
  <div class="jp-results" id="jf-stats"></div>
</div>`,

    js: `
(function () {
  var input = document.getElementById('jf-input');
  var status = document.getElementById('jf-status');
  var stats = document.getElementById('jf-stats');

  var SAMPLE = '{"service":"payments-api","version":3,"enabled":true,"retries":null,' +
    '"endpoints":[{"path":"/charges","methods":["GET","POST"],"rateLimit":{"burst":40,"perMinute":600}},' +
    '{"path":"/refunds","methods":["POST"],"rateLimit":{"burst":10,"perMinute":60}}],' +
    '"owners":["platform-team","billing-team"]}';

  function indent() {
    var v = document.getElementById('jf-indent').value;
    return v === 'tab' ? '\\t' : parseInt(v, 10);
  }

  function setStatus(message, kind) {
    status.textContent = message || '\\u00a0';
    status.className = 'jp-status' + (kind ? ' jp-status--' + kind : '');
  }

  /* JSON.parse reports a character offset; translate it to line and column. */
  function locate(text, error) {
    var match = /position (\\d+)/.exec(error.message);
    if (!match) return error.message;
    var offset = parseInt(match[1], 10);
    var before = text.slice(0, offset);
    var line = before.split('\\n').length;
    var column = offset - before.lastIndexOf('\\n');
    var snippet = text.split('\\n')[line - 1] || '';
    if (snippet.length > 70) snippet = snippet.slice(Math.max(0, column - 35), column + 35);
    return error.message.replace(/ in JSON at position \\d+.*/, '') +
      ' — line ' + line + ', column ' + column + '  ›  ' + snippet.trim();
  }

  function describe(value) {
    var keys = 0, arrays = 0, depth = 0, nodes = 0;
    (function walk(node, level) {
      nodes++;
      if (level > depth) depth = level;
      if (Array.isArray(node)) {
        arrays++;
        node.forEach(function (item) { walk(item, level + 1); });
      } else if (node && typeof node === 'object') {
        Object.keys(node).forEach(function (k) { keys++; walk(node[k], level + 1); });
      }
    })(value, 1);
    return { keys: keys, arrays: arrays, depth: depth, nodes: nodes };
  }

  function bytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }

  function parse() {
    var text = input.value.trim();
    if (!text) { setStatus(''); stats.innerHTML = ''; return null; }
    try {
      var value = JSON.parse(text);
      var info = describe(value);
      setStatus('Valid JSON', 'ok');
      stats.innerHTML =
        '<div class="jp-stat"><p class="jp-stat-label">Size</p><p class="jp-stat-value">' + bytes(text.length) + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Keys</p><p class="jp-stat-value">' + info.keys + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Arrays</p><p class="jp-stat-value">' + info.arrays + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Max depth</p><p class="jp-stat-value">' + info.depth + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Total nodes</p><p class="jp-stat-value">' + info.nodes + '</p></div>';
      return value;
    } catch (error) {
      setStatus(locate(text, error), 'err');
      stats.innerHTML = '';
      return null;
    }
  }

  function sortDeep(node) {
    if (Array.isArray(node)) return node.map(sortDeep);
    if (node && typeof node === 'object') {
      return Object.keys(node).sort().reduce(function (out, key) {
        out[key] = sortDeep(node[key]);
        return out;
      }, {});
    }
    return node;
  }

  document.getElementById('jf-format').addEventListener('click', function () {
    var value = parse();
    if (value !== null) { input.value = JSON.stringify(value, null, indent()); parse(); }
  });

  document.getElementById('jf-minify').addEventListener('click', function () {
    var value = parse();
    if (value !== null) {
      var before = input.value.length;
      input.value = JSON.stringify(value);
      parse();
      setStatus('Minified — ' + bytes(before) + ' to ' + bytes(input.value.length) +
        ' (' + Math.round((1 - input.value.length / before) * 100) + '% smaller)', 'ok');
    }
  });

  document.getElementById('jf-sort').addEventListener('click', function () {
    var value = parse();
    if (value !== null) { input.value = JSON.stringify(sortDeep(value), null, indent()); parse(); }
  });

  document.getElementById('jf-escape').addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) return;
    try {
      // A JSON document that has been embedded in another string arrives
      // double-encoded; parsing once yields the real document as a string.
      var unwrapped = JSON.parse(text);
      if (typeof unwrapped !== 'string') { setStatus('Input is already a JSON value, not an escaped string.', 'err'); return; }
      input.value = JSON.stringify(JSON.parse(unwrapped), null, indent());
      parse();
    } catch (error) {
      setStatus('Could not unescape: ' + error.message, 'err');
    }
  });

  document.getElementById('jf-sample').addEventListener('click', function () {
    input.value = JSON.stringify(JSON.parse(SAMPLE), null, indent());
    parse();
  });

  document.getElementById('jf-clear').addEventListener('click', function () {
    input.value = ''; parse(); input.focus();
  });

  input.addEventListener('input', parse);
  document.getElementById('jf-indent').addEventListener('change', function () {
    var value = parse();
    if (value !== null) input.value = JSON.stringify(value, null, indent());
  });
})();`,
  },

  blocks: [
    { t: 'h2', x: 'What this tool does' },
    {
      t: 'ul',
      items: [
        '**Format** — expands minified JSON into indented, readable structure with 2 spaces, 4 spaces or tabs.',
        '**Validate** — checks syntax as you type and reports the exact line, column and offending text when parsing fails.',
        '**Minify** — strips all insignificant whitespace and reports how many bytes you saved.',
        '**Sort keys** — recursively alphabetises object keys, which makes two config files diffable against each other.',
        '**Unescape string** — unwraps JSON that has been double-encoded inside another string, the usual state of a payload pulled out of a log line.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Your data never leaves this page',
      x: 'Everything runs in JavaScript on your own machine. There is no upload, no request, no server-side logging, and no analytics on your input. That matters: pasting production payloads containing customer records or credentials into an unknown online formatter is a genuine data-exfiltration route, and several popular ones do post your input to their backend.',
    },

    { t: 'h2', x: 'The JSON syntax errors you will actually hit' },
    {
      t: 'p',
      x: 'JSON is a deliberately small format, so there are only a handful of ways to break it. Nearly every parse failure is one of these five.',
    },

    { t: 'h3', x: 'Trailing commas' },
    {
      t: 'p',
      x: 'Legal in JavaScript, illegal in JSON. This is the single most common cause of `Unexpected token }`:',
    },
    {
      t: 'code',
      lang: 'json',
      x: `{
  "name": "api",
  "port": 8080,      ← the comma after the last pair is invalid
}`,
    },

    { t: 'h3', x: 'Single quotes' },
    {
      t: 'p',
      x: 'JSON strings must use double quotes, and keys must be quoted. `{name: \'api\'}` is a valid JavaScript object literal and an invalid JSON document. If you are hand-writing config, this catches almost everyone at least once.',
    },

    { t: 'h3', x: 'Comments' },
    {
      t: 'p',
      x: 'There are no comments in JSON — neither `//` nor `/* */`. Tools like VS Code accept them in their own settings files under the informal "JSONC" convention, but a standard parser will reject them. If you need annotation, add a `"_comment"` key or move to YAML or TOML.',
    },

    { t: 'h3', x: 'NaN, Infinity and undefined' },
    {
      t: 'p',
      x: 'None of these are JSON values. `JSON.stringify` silently converts `NaN` and `Infinity` to `null` and drops `undefined` properties entirely, which is a common source of fields that mysteriously vanish between a service and its client.',
    },

    { t: 'h3', x: 'Unescaped control characters in strings' },
    {
      t: 'p',
      x: 'A literal newline, tab or raw backslash inside a string breaks the document. They must be escaped as `\\n`, `\\t` and `\\\\`. This one shows up constantly when a stack trace or a Windows file path gets concatenated into a JSON payload without encoding.',
    },

    { t: 'h2', x: 'Reading the error message' },
    {
      t: 'p',
      x: 'Browsers report a character offset rather than a line number, which is not much use in a 4,000-line document. This tool converts that offset into a line, a column and the surrounding text so you can jump straight to the problem.',
    },
    {
      t: 'p',
      x: 'One thing worth knowing: the reported position is where the parser gave up, which is usually *after* the actual mistake. A missing comma on line 40 is typically reported at the start of line 41. When the flagged line looks fine, check the line above it.',
    },

    { t: 'h2', x: 'Minifying JSON: when it is worth it' },
    {
      t: 'p',
      x: 'Formatting is for humans; minification is for wires. Removing whitespace typically cuts an indented document by 20–30%, and for API responses served at scale that is real bandwidth. But two caveats are worth stating plainly.',
    },
    {
      t: 'p',
      x: 'First, if your server already applies gzip or Brotli — and it should — most of that saving is redundant. Compression handles repeated whitespace extremely well, so the difference between minified and formatted JSON after gzip is often under 5%. Second, never minify files that humans maintain. A minified `package.json` or Terraform variables file produces unreadable diffs and pointless merge conflicts.',
    },

    { t: 'h2', x: 'Sorting keys for diffable config' },
    {
      t: 'p',
      x: 'JSON objects are unordered by specification, but almost every serializer preserves insertion order in practice. That means two functionally identical config files can produce an enormous diff purely because the keys came out in a different sequence.',
    },
    {
      t: 'p',
      x: 'Running both through **Sort keys** normalises them, so the diff shows only genuine differences. This is the fastest way to answer "what actually changed between staging and production config?" — a question that otherwise consumes an unreasonable amount of an afternoon.',
    },

    { t: 'h2', x: 'Doing this from the command line' },
    {
      t: 'p',
      x: 'For scripting and larger files, the same operations are available locally. `jq` is the standard tool:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Format (pretty-print)
jq '.' input.json

# Minify
jq -c '.' input.json

# Sort keys recursively
jq -S '.' input.json

# Validate only — exit code 0 means valid
jq empty input.json && echo "valid"

# No jq installed? Python is usually there
python3 -m json.tool input.json`,
    },
    {
      t: 'p',
      x: 'For files above a few hundred megabytes, neither this page nor `jq` in whole-document mode is the right answer — both load the entire structure into memory. Use a streaming parser instead (`jq --stream`, or `ijson` in Python).',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is my JSON uploaded anywhere?',
          a: 'No. All parsing, formatting and validation happens in your browser with the built-in JSON engine. There is no network request involved and no server-side component to receive your data. You can verify this by opening your browser devtools network tab while using the tool.',
        },
        {
          q: 'Why does my JSON fail even though it looks correct?',
          a: 'Check for a trailing comma before a closing brace or bracket, single quotes instead of double quotes, unquoted keys, comments, or a smart quote pasted in from a word processor or chat client. Curly quotes are invisible in most editors and break parsing every time.',
        },
        {
          q: 'What is the difference between JSON and JSON5 or JSONC?',
          a: 'JSON5 and JSONC are relaxed supersets that permit comments, trailing commas, unquoted keys and single quotes. They are convenient for configuration files, but standard parsers reject them. This tool validates strict JSON as defined by RFC 8259 — which is what any API you talk to will expect.',
        },
        {
          q: 'Can it handle very large files?',
          a: 'Documents up to a few megabytes format instantly. Beyond roughly 10 MB the browser may stall while parsing, since the whole structure has to be held in memory. Use a streaming command-line tool for anything larger.',
        },
        {
          q: 'What does "Unescape string" do?',
          a: 'When JSON has been embedded inside another JSON string — the usual result of logging a payload as a field — it arrives with every quote escaped as \\". That button parses the outer layer once to recover the real document, then formats it.',
        },
      ],
    },
  ],

  related: ['/tools/jwt-decoder/', '/tools/base64-encoder-decoder/', '/guides/fix-cors-errors/'],
};
