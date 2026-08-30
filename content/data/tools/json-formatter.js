module.exports = {
  slug: 'json-formatter',
  title: 'JSON Formatter and Validator with Error Locations',
  h1: 'JSON Formatter and Validator',
  eyebrow: 'Developer tool',
  description:
    'Format, validate, minify and sort JSON in your browser. Syntax errors include the line, column and nearby text.',
  standfirst:
    'Paste JSON to format it, remove whitespace, sort object keys or unwrap an escaped JSON string. Processing happens in the browser.',
  keywords: ['json formatter', 'json validator', 'json beautifier', 'json minifier', 'format json online', 'json pretty print'],
  published: '2026-01-22',
  updated: '2026-08-19',
  author: 'jackson',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-toolbar">
    <button class="jp-btn" type="button" id="jf-format">Format JSON</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-minify">Minify JSON</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-sort">Sort keys</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-escape">Unescape JSON string</button>
    <button class="jp-btn jp-btn--ghost" type="button" data-copy="jf-input">Copy JSON</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-sample">Load sample JSON</button>
    <button class="jp-btn jp-btn--ghost" type="button" id="jf-clear">Clear</button>
    <label class="jp-checkline" for="jf-indent">
      Indentation
      <select class="jp-select" id="jf-indent" style="width:auto">
        <option value="2" selected>2 spaces</option>
        <option value="4">4 spaces</option>
        <option value="tab">Tab</option>
      </select>
    </label>
  </div>

  <div class="jp-field">
    <label for="jf-input">Paste JSON</label>
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

  /* Convert the JSON.parse offset to a line and column. */
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
      ' at line ' + line + ', column ' + column + ': ' + snippet.trim();
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
      setStatus('JSON is valid.', 'ok');
      stats.innerHTML =
        '<div class="jp-stat"><p class="jp-stat-label">Input size</p><p class="jp-stat-value">' + bytes(text.length) + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Object keys</p><p class="jp-stat-value">' + info.keys + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Arrays</p><p class="jp-stat-value">' + info.arrays + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Maximum depth</p><p class="jp-stat-value">' + info.depth + '</p></div>' +
        '<div class="jp-stat"><p class="jp-stat-label">Total values</p><p class="jp-stat-value">' + info.nodes + '</p></div>';
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
      setStatus('Minified from ' + bytes(before) + ' to ' + bytes(input.value.length) +
        ' (' + Math.round((1 - input.value.length / before) * 100) + '% smaller).', 'ok');
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
      // An encoded JSON document arrives as a string.
      // Parsing once reveals the nested document.
      var unwrapped = JSON.parse(text);
      if (typeof unwrapped !== 'string') { setStatus('The input is a JSON value, not an escaped JSON string.', 'err'); return; }
      input.value = JSON.stringify(JSON.parse(unwrapped), null, indent());
      parse();
    } catch (error) {
      setStatus('Could not unescape the JSON string: ' + error.message, 'err');
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
    { t: 'h2', x: 'Available actions' },
    {
      t: 'ul',
      items: [
        '**Format:** expand compact JSON with two spaces, four spaces or tabs for indentation.',
        '**Validate:** check syntax as you type and show the line, column and nearby text when parsing fails.',
        '**Minify:** remove insignificant whitespace and report the change in size.',
        '**Sort keys:** alphabetize object keys recursively so two configuration files are easier to compare.',
        '**Unescape JSON string:** parse a JSON document that was encoded inside another string, as often happens in structured logs.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Processing stays in the browser',
      x: 'The formatter uses the browser’s JSON parser and does not submit your input to a server. Even with a local tool, avoid pasting production payloads that contain customer data or credentials unless you have confirmed how the surrounding page handles data.',
    },

    { t: 'h2', x: 'Common JSON syntax errors' },
    {
      t: 'p',
      x: 'Strict JSON has a small grammar. These five mistakes account for many parsing failures.',
    },

    { t: 'h3', x: 'Trailing commas' },
    {
      t: 'p',
      x: 'JavaScript object literals can allow trailing commas, but JSON cannot. A comma after the final property can produce an `Unexpected token }` error:',
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
      x: 'JSON strings use double quotes, and object keys must also be quoted. `{name: \'api\'}` is a JavaScript object literal, not valid JSON.',
    },

    { t: 'h3', x: 'Comments' },
    {
      t: 'p',
      x: 'JSON does not allow `//` or `/* */` comments. Some tools, including VS Code, accept comments in JSONC files, but a standard JSON parser rejects them. For annotations, use a `"_comment"` key or a format such as YAML or TOML.',
    },

    { t: 'h3', x: 'NaN, Infinity and undefined' },
    {
      t: 'p',
      x: 'JSON has no `NaN`, `Infinity` or `undefined` value. `JSON.stringify` converts `NaN` and `Infinity` to `null`, and it omits object properties whose value is `undefined`. Check for this conversion when a field disappears between a service and its client.',
    },

    { t: 'h3', x: 'Unescaped control characters in strings' },
    {
      t: 'p',
      x: 'A newline, tab or backslash inside a JSON string must be escaped as `\\n`, `\\t` or `\\\\`. Raw control characters often appear when code inserts a stack trace or Windows path without passing it through a JSON serializer.',
    },

    { t: 'h2', x: 'Reading the error message' },
    {
      t: 'p',
      x: 'A browser may report a character offset for a parse error. The formatter converts that offset to a line and column and includes nearby text to make the location easier to find.',
    },
    {
      t: 'p',
      x: 'The reported position is where the parser stopped, which can be after the actual mistake. For example, a missing comma on one line may be reported at the start of the next line. Check the preceding line when the marked location looks correct.',
    },

    { t: 'h2', x: 'When to minify JSON' },
    {
      t: 'p',
      x: 'Formatting makes JSON easier to read. Minification removes whitespace before data is transferred. An indented document may shrink by 20–30% before transport compression, but two caveats matter.',
    },
    {
      t: 'p',
      x: 'First, gzip and Brotli compress repeated whitespace well, so minifying before compression often changes the final size by less than 5%. Second, keep files that people edit in a readable format. Minified configuration files produce difficult diffs and avoidable merge conflicts.',
    },

    { t: 'h2', x: 'Sorting keys before a comparison' },
    {
      t: 'p',
      x: 'JSON object order has no semantic meaning, although serializers commonly preserve insertion order. Two equivalent configuration files can therefore produce a large diff when their keys appear in a different sequence.',
    },
    {
      t: 'p',
      x: 'Run both files through **Sort keys** before comparing them. With the order normalized, the diff shows changes in values and membership instead of changes in key order.',
    },

    { t: 'h2', x: 'Using JSON tools from the command line' },
    {
      t: 'p',
      x: 'For scripts and local files, `jq` provides the same format, minify, sort and validation operations:',
    },
    {
      t: 'code',
      lang: 'bash',
      x: `# Format with indentation
jq '.' input.json

    # Remove insignificant whitespace
jq -c '.' input.json

    # Sort every object key
jq -S '.' input.json

    # Validate with exit code 0 for success
jq empty input.json && echo "valid"

    # Use Python when jq is unavailable
python3 -m json.tool input.json`,
    },
    {
      t: 'p',
      x: 'This page and the default `jq` mode both load the full document into memory. For files that are too large to hold comfortably, use a streaming parser such as `jq --stream` or Python’s `ijson`.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is my JSON uploaded anywhere?',
          a: 'No. Parsing, formatting and validation use the browser’s built-in JSON engine. This tool does not send the input to a server.',
        },
        {
          q: 'Why does my JSON fail even though it looks correct?',
          a: 'Check for a trailing comma, single-quoted strings, unquoted keys, comments or curly quotation marks pasted from another application. Strict JSON requires quoted keys and straight double quotes.',
        },
        {
          q: 'What is the difference between JSON and JSON5 or JSONC?',
          a: 'JSON5 and JSONC extend JSON with features such as comments and trailing commas. JSON5 also permits unquoted keys and single-quoted strings. Standard JSON parsers reject those extensions. This tool validates strict JSON as defined by RFC 8259.',
        },
        {
          q: 'Can it handle very large files?',
          a: 'The browser must hold the complete document and its parsed structure in memory. For a file that makes the page slow or unresponsive, use a streaming command-line parser instead.',
        },
        {
          q: 'What does "Unescape string" do?',
          a: 'JSON embedded inside another JSON string has backslashes before its quotation marks. **Unescape JSON string** parses that outer string, parses the recovered document and then formats it.',
        },
      ],
    },
  ],

  related: ['/tools/jwt-decoder/', '/tools/base64-encoder-decoder/', '/guides/fix-cors-errors/'],
};
