module.exports = {
  slug: 'color-contrast-checker',
  title: 'Color Contrast Checker for WCAG AA and AAA',
  h1: 'Color Contrast Checker',
  eyebrow: 'Accessibility',
  description:
    'Check a foreground and background color against WCAG 2.2 AA and AAA contrast thresholds, with a preview and an adjusted foreground option.',
  standfirst:
    'Enter two colors to calculate their contrast ratio and see which text and interface thresholds they meet.',
  keywords: [
    'color contrast checker',
    'wcag contrast ratio',
    'accessibility contrast',
    'aa aaa contrast',
    'contrast ratio calculator',
  ],
  published: '2026-04-02',
  updated: '2026-08-21',
  author: 'jackson',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-tool-grid">
    <div>
      <div class="jp-field">
        <label for="cx-fg">Text or foreground color</label>
        <input class="jp-input" type="text" id="cx-fg" value="#6b7f99" spellcheck="false" />
        <input class="jp-range" type="color" id="cx-fg-picker" value="#6b7f99" aria-label="Choose foreground color" />
      </div>
      <div class="jp-field">
        <label for="cx-bg">Background color</label>
        <input class="jp-input" type="text" id="cx-bg" value="#ffffff" spellcheck="false" />
        <input class="jp-range" type="color" id="cx-bg-picker" value="#ffffff" aria-label="Choose background color" />
      </div>
      <div class="jp-toolbar">
        <button class="jp-btn jp-btn--ghost" type="button" id="cx-swap">Swap colors</button>
        <button class="jp-btn" type="button" id="cx-fix">Adjust foreground to AA</button>
      </div>
      <p class="jp-status" id="cx-fix-note" aria-live="polite">&nbsp;</p>
    </div>

    <div>
      <div class="jp-swatch" id="cx-preview" style="height:auto;padding:1rem;display:block">
        <p style="font-size:1.55rem;font-weight:700;margin:0 0 .4rem">Large text preview</p>
        <p style="font-size:1rem;font-weight:400;margin:0 0 .4rem">Normal text preview at 16px.</p>
        <p style="font-size:.8rem;margin:0">Small text preview at 12.8px.</p>
      </div>
    </div>

    <div>
      <div class="jp-stat jp-stat--primary" style="margin-bottom:.75rem">
        <p class="jp-stat-label">Contrast ratio</p>
        <p class="jp-stat-value" id="cx-ratio">Not available</p>
        <p class="jp-stat-sub" id="cx-ratio-sub">&nbsp;</p>
      </div>
      <dl class="jp-kv" id="cx-levels"></dl>
    </div>
  </div>
</div>`,

    js: `
(function () {
  var fg = document.getElementById('cx-fg');
  var bg = document.getElementById('cx-bg');
  var fgPicker = document.getElementById('cx-fg-picker');
  var bgPicker = document.getElementById('cx-bg-picker');
  var preview = document.getElementById('cx-preview');

  var NAMED = { white: '#ffffff', black: '#000000', red: '#ff0000', blue: '#0000ff', green: '#008000' };

  function parse(value) {
    var text = String(value).trim().toLowerCase();
    if (NAMED[text]) text = NAMED[text];

    var rgb = /^rgba?\\(\\s*(\\d+)[\\s,]+(\\d+)[\\s,]+(\\d+)/.exec(text);
    if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];

    var hex = text.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/.test(hex)) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }

  function toHex(rgb) {
    return '#' + rgb.map(function (c) {
      return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
    }).join('');
  }

  // Calculate relative luminance for WCAG 2.x.
  function luminance(rgb) {
    var channels = rgb.map(function (c) {
      var s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function ratio(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function badge(pass) {
    return '<span class="jp-badge jp-badge--' + (pass ? 'pass">Pass' : 'fail">Fail') + '</span>';
  }

  function render() {
    var f = parse(fg.value), b = parse(bg.value);
    var levels = document.getElementById('cx-levels');
    if (!f || !b) {
      document.getElementById('cx-ratio').textContent = 'Not available';
      document.getElementById('cx-ratio-sub').textContent = 'Enter a hex or rgb() color.';
      levels.innerHTML = '';
      return;
    }

    fgPicker.value = toHex(f);
    bgPicker.value = toHex(b);
    preview.style.background = toHex(b);
    preview.style.color = toHex(f);

    var r = ratio(f, b);
    document.getElementById('cx-ratio').textContent = r.toFixed(2) + ':1';
    document.getElementById('cx-ratio-sub').textContent =
      r >= 7 ? 'Passes AAA for normal and large text' : r >= 4.5 ? 'Passes AA for normal text and AAA for large text' :
      r >= 3 ? 'Passes AA for large text and interface graphics only' : 'Does not pass the listed thresholds';

    levels.innerHTML =
      '<dt>AA · normal text</dt><dd>' + badge(r >= 4.5) + ' requires 4.5:1</dd>' +
      '<dt>AA · large text</dt><dd>' + badge(r >= 3) + ' requires 3:1</dd>' +
      '<dt>AA · UI &amp; graphics</dt><dd>' + badge(r >= 3) + ' requires 3:1</dd>' +
      '<dt>AAA · normal text</dt><dd>' + badge(r >= 7) + ' requires 7:1</dd>' +
      '<dt>AAA · large text</dt><dd>' + badge(r >= 4.5) + ' requires 4.5:1</dd>';
  }

  // Move the foreground toward the more distant endpoint.
  // Stop when contrast reaches 4.5:1.
  document.getElementById('cx-fix').addEventListener('click', function () {
    var f = parse(fg.value), b = parse(bg.value);
    var note = document.getElementById('cx-fix-note');
    if (!f || !b) return;
    if (ratio(f, b) >= 4.5) { note.textContent = 'The current colors already pass AA for normal text.'; note.className = 'jp-status jp-status--ok'; return; }

    var target = luminance(b) > 0.5 ? [0, 0, 0] : [255, 255, 255];
    for (var step = 1; step <= 100; step++) {
      var t = step / 100;
      var candidate = f.map(function (c, i) { return c + (target[i] - c) * t; });
      if (ratio(candidate, b) >= 4.5) {
        fg.value = toHex(candidate);
        render();
        note.textContent = 'Adjusted the foreground to ' + toHex(candidate) + '. It now passes AA for normal text.';
        note.className = 'jp-status jp-status--ok';
        return;
      }
    }
    note.textContent = 'The foreground could not reach 4.5:1 with this adjustment. Change the background color instead.';
    note.className = 'jp-status jp-status--err';
  });

  document.getElementById('cx-swap').addEventListener('click', function () {
    var a = fg.value; fg.value = bg.value; bg.value = a; render();
  });

  fg.addEventListener('input', render);
  bg.addEventListener('input', render);
  fgPicker.addEventListener('input', function () { fg.value = fgPicker.value; render(); });
  bgPicker.addEventListener('input', function () { bg.value = bgPicker.value; render(); });
  render();
})();`,
  },

  blocks: [
    { t: 'h2', x: 'WCAG thresholds and large text' },
    {
      t: 'table',
      head: ['Level', 'Applies to', 'Minimum ratio'],
      rows: [
        ['AA', 'Normal text', '4.5:1'],
        ['AA', 'Large text', '3:1'],
        ['AA', 'UI components and meaningful graphics', '3:1'],
        ['AAA', 'Normal text', '7:1'],
        ['AAA', 'Large text', '4.5:1'],
      ],
    },
    {
      t: 'p',
      x: '**Large text** means at least 18pt (24px), or 14pt (18.66px) when bold. Smaller text needs a ratio of at least 4.5:1 at level AA. Check captions, timestamps and helper text as well as body copy.',
    },
    {
      t: 'p',
      x: 'WCAG 2.1 added a **3:1 requirement for meaningful UI components and graphics**. It covers elements such as input boundaries, focus indicators, toggle states and informative icons. For example, a `#e5e7eb` border on white is about 1.2:1 and does not meet that threshold.',
    },

    { t: 'h2', x: 'Why level AA is commonly required' },
    {
      t: 'p',
      x: 'Several laws and procurement standards reference WCAG level AA, including EN 301 549 for EU public-sector procurement, Section 508 in the United States and the UK Public Sector Bodies Accessibility Regulations. US accessibility settlements also commonly use AA as a remediation target.',
    },
    {
      t: 'p',
      x: 'AAA provides stronger contrast for body text, but WCAG does not recommend requiring level AAA across an entire site because some content cannot meet every AAA criterion.',
    },

    { t: 'h2', x: 'Color pairs that need attention' },
    {
      t: 'ul',
      items: [
        '**Placeholder text.** A placeholder that conveys information must meet the text threshold, but it should not replace a persistent label.',
        '**Disabled controls.** WCAG exempts inactive controls from contrast requirements. They still need enough visual distinction for users to recognize their state.',
        '**Text over images.** Contrast changes across an image. Check every area behind the text and add a scrim, overlay or solid panel when the ratio varies too much.',
        '**Brand colors on white.** Some brand colors fall between 3:1 and 4.5:1. Use a darker variant for normal text while retaining the original color for exempt logos or qualifying large text.',
        '**Light gray secondary text.** `#999999` on white is 2.85:1 and fails for normal text. `#767676` is 4.54:1 and passes AA.',
        '**Dark mode.** Recheck each pair rather than inverting the light palette. Pure white on black reaches 21:1 and can produce halation for some readers; off-white on dark gray may be easier to read while still passing.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Reference grays on white',
      x: '`#767676` has a 4.54:1 ratio and passes AA for normal text. `#595959` reaches 7.0:1 and passes AAA. `#949494` reaches 3.0:1 for large text and qualifying UI components. Lighter gray values do not meet the corresponding threshold on white.',
    },

    { t: 'h2', x: 'How the ratio is calculated' },
    {
      t: 'p',
      x: 'WCAG 2.x defines contrast as `(L1 + 0.05) / (L2 + 0.05)`, where L1 is the lighter color’s relative luminance and L2 is the darker color’s. Relative luminance is a weighted sum of the gamma-corrected color channels:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `function luminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;   // Green has the greatest weight
}`,
    },
    {
      t: 'p',
      x: 'The green coefficient is larger because human vision is more sensitive to green than blue. As a result, pure blue `#0000ff` on white has a ratio of about 8.6:1, while pure yellow `#ffff00` on white is about 1.07:1.',
    },
    { t: 'p', x: 'The ratio ranges from 1:1 (identical colors) to 21:1 (pure black on pure white).' },

    {
      t: 'note',
      kind: 'info',
      title: 'This formula has known flaws',
      x: 'The WCAG 2.x formula has known perceptual limitations, especially for dark backgrounds and thin type. **APCA** is being developed for WCAG 3 to model perceived contrast differently. It is not yet the applicable compliance standard, so use WCAG 2.x thresholds for current conformance work.',
    },

    { t: 'h2', x: 'Contrast is necessary but not sufficient' },
    {
      t: 'p',
      x: 'A 4.5:1 text ratio addresses one accessibility requirement. Check these related requirements separately:',
    },
    {
      t: 'ol',
      items: [
        '**Color used as the only signal.** Do not rely only on red for errors or green for success. Add text, an icon or a pattern as required by WCAG 1.4.1.',
        '**Missing focus indicators.** Keyboard users need a visible focus location. If CSS removes the default outline, provide a replacement that reaches 3:1 against adjacent colors.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What contrast ratio do I need?',
          a: 'At level AA, normal text needs 4.5:1. Large text and meaningful UI components such as boundaries, icons and focus indicators need 3:1. Check the specific law or procurement standard that applies to your organization.',
        },
        {
          q: 'Do logos and brand marks need to pass?',
          a: 'Logotypes and incidental text are exempt under WCAG. The exemption does not automatically cover a tagline used as body text or navigation text set in a brand color.',
        },
        {
          q: 'Does contrast apply to dark mode separately?',
          a: 'Yes. Check dark mode separately because luminance is nonlinear and an inverted palette does not preserve contrast ratios. Test each foreground and background pair used by the dark theme.',
        },
        {
          q: 'What about text over a photograph?',
          a: 'The required ratio must hold across the full area behind the text. Check the lightest and darkest regions it crosses, and add a scrim, overlay or solid text background when needed.',
        },
        {
          q: 'Is APCA something I should switch to now?',
          a: 'Not as a replacement for current compliance checks. APCA is being developed for WCAG 3, while current regulations and standards reference WCAG 2.x. You can use APCA as additional design information, but still test the applicable WCAG 2.2 criteria.',
        },
      ],
    },
  ],

  related: ['/guides/css-grid-vs-flexbox/', '/tools/regex-tester/', '/guides/http-status-codes-explained/'],
};
