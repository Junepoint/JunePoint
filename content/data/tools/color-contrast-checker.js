module.exports = {
  slug: 'color-contrast-checker',
  title: 'Color Contrast Checker — WCAG AA & AAA Ratios',
  h1: 'Colour Contrast Checker',
  eyebrow: 'Accessibility',
  description:
    'Check any foreground and background colour pair against WCAG 2.2 AA and AAA contrast requirements, with a live preview and suggested fixes.',
  standfirst:
    'Enter two colours and get the exact contrast ratio, which WCAG levels it passes, and a one-click nudge to the nearest shade that passes.',
  keywords: [
    'color contrast checker',
    'wcag contrast ratio',
    'accessibility contrast',
    'aa aaa contrast',
    'contrast ratio calculator',
  ],
  published: '2026-04-02',
  updated: '2026-08-21',
  author: 'alexander',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-tool-grid">
    <div>
      <div class="jp-field">
        <label for="cx-fg">Foreground (text)</label>
        <input class="jp-input" type="text" id="cx-fg" value="#6b7f99" spellcheck="false" />
        <input class="jp-range" type="color" id="cx-fg-picker" value="#6b7f99" aria-label="Pick foreground colour" />
      </div>
      <div class="jp-field">
        <label for="cx-bg">Background</label>
        <input class="jp-input" type="text" id="cx-bg" value="#ffffff" spellcheck="false" />
        <input class="jp-range" type="color" id="cx-bg-picker" value="#ffffff" aria-label="Pick background colour" />
      </div>
      <div class="jp-toolbar">
        <button class="jp-btn jp-btn--ghost" type="button" id="cx-swap">Swap</button>
        <button class="jp-btn" type="button" id="cx-fix">Fix to AA</button>
      </div>
      <p class="jp-status" id="cx-fix-note" aria-live="polite">&nbsp;</p>
    </div>

    <div>
      <div class="jp-swatch" id="cx-preview" style="height:auto;padding:1rem;display:block">
        <p style="font-size:1.55rem;font-weight:700;margin:0 0 .4rem">Large heading text</p>
        <p style="font-size:1rem;font-weight:400;margin:0 0 .4rem">Normal body text at 16px, which is the size most of your interface actually uses.</p>
        <p style="font-size:.8rem;margin:0">Small print at 12.8px.</p>
      </div>
    </div>

    <div>
      <div class="jp-stat jp-stat--primary" style="margin-bottom:.75rem">
        <p class="jp-stat-label">Contrast ratio</p>
        <p class="jp-stat-value" id="cx-ratio">—</p>
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

  // WCAG 2.x relative luminance.
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
    return '<span class="jp-badge jp-badge--' + (pass ? 'pass">PASS' : 'fail">FAIL') + '</span>';
  }

  function render() {
    var f = parse(fg.value), b = parse(bg.value);
    var levels = document.getElementById('cx-levels');
    if (!f || !b) {
      document.getElementById('cx-ratio').textContent = '—';
      document.getElementById('cx-ratio-sub').textContent = 'Enter a hex or rgb() colour';
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
      r >= 7 ? 'Passes everything' : r >= 4.5 ? 'Passes AA for all text' :
      r >= 3 ? 'Large text and UI only' : 'Fails every threshold';

    levels.innerHTML =
      '<dt>AA · normal text</dt><dd>' + badge(r >= 4.5) + ' needs 4.5:1</dd>' +
      '<dt>AA · large text</dt><dd>' + badge(r >= 3) + ' needs 3:1</dd>' +
      '<dt>AA · UI &amp; graphics</dt><dd>' + badge(r >= 3) + ' needs 3:1</dd>' +
      '<dt>AAA · normal text</dt><dd>' + badge(r >= 7) + ' needs 7:1</dd>' +
      '<dt>AAA · large text</dt><dd>' + badge(r >= 4.5) + ' needs 4.5:1</dd>';
  }

  // Walk the foreground toward black or white — whichever direction the
  // background is further from — until it clears 4.5:1.
  document.getElementById('cx-fix').addEventListener('click', function () {
    var f = parse(fg.value), b = parse(bg.value);
    var note = document.getElementById('cx-fix-note');
    if (!f || !b) return;
    if (ratio(f, b) >= 4.5) { note.textContent = 'Already passes AA — nothing to change.'; note.className = 'jp-status jp-status--ok'; return; }

    var target = luminance(b) > 0.5 ? [0, 0, 0] : [255, 255, 255];
    for (var step = 1; step <= 100; step++) {
      var t = step / 100;
      var candidate = f.map(function (c, i) { return c + (target[i] - c) * t; });
      if (ratio(candidate, b) >= 4.5) {
        fg.value = toHex(candidate);
        render();
        note.textContent = 'Adjusted to ' + toHex(candidate) + ' — nearest shade in the same hue family that passes AA.';
        note.className = 'jp-status jp-status--ok';
        return;
      }
    }
    note.textContent = 'No shade of this colour reaches 4.5:1 on that background. Change the background instead.';
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
    { t: 'h2', x: 'The thresholds, and what counts as "large"' },
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
      x: '**Large text** means at least 18pt (24px), or 14pt (18.66px) when bold. Below that, the 4.5:1 requirement applies — and this is where most designs fail, because the small grey timestamps, captions and helper text are exactly the elements that get styled by eye late in a project.',
    },
    {
      t: 'p',
      x: 'The **3:1 requirement for UI components** is the one teams miss most often. It came in with WCAG 2.1 and covers input borders, focus indicators, toggle states and icons that carry meaning. A form field with a `#e5e7eb` border on white sits at about 1.2:1 — invisible to a lot of people, and a straightforward failure.',
    },

    { t: 'h2', x: 'Why AA is the number that matters' },
    {
      t: 'p',
      x: 'AA is the level written into law. The European Accessibility Act, the EN 301 549 standard behind EU public-sector procurement, Section 508 in the United States and the UK’s Public Sector Bodies Accessibility Regulations all reference WCAG level AA. ADA settlements in the US have consistently used AA as the remediation standard.',
    },
    {
      t: 'p',
      x: 'AAA is a worthwhile goal for body text and genuinely helps readers with low vision, but WCAG itself does not recommend it as a blanket requirement for entire sites — some content simply cannot reach it.',
    },

    { t: 'h2', x: 'Where designs usually fail' },
    {
      t: 'ul',
      items: [
        '**Placeholder text.** Browser defaults are around 3:1. If a placeholder is doing real work — and it should not be, use a label — it needs to pass.',
        '**Disabled controls.** WCAG exempts them, so they are technically compliant at any contrast. They are still frequently unreadable, and users cannot tell "disabled" from "broken".',
        '**Text over images.** The ratio changes across the image. A scrim, a gradient overlay or a solid text panel is the reliable fix; picking a colour that works over the average is not.',
        '**Brand colours on white.** A great many corporate blues and greens land between 3:1 and 4.5:1. Darken the shade for text and keep the original for large display type and logos, which are exempt.',
        '**Light-grey secondary text.** `#999999` on white is 2.85:1 and fails. `#767676` is 4.54:1 and passes. That is the smallest change that fixes the most common violation on the web.',
        '**Dark mode, assumed rather than checked.** Pure white on pure black is 21:1 and causes halation for readers with astigmatism. Off-white on very dark grey reads better and still passes comfortably.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'The greys worth memorising (on white)',
      x: '`#767676` = 4.54:1, the lightest grey that passes AA for body text. `#595959` = 7.0:1, the lightest that passes AAA. `#949494` = 3.0:1, the lightest usable for large text and UI borders. Anything lighter than #767676 for small text is a failure.',
    },

    { t: 'h2', x: 'How the ratio is calculated' },
    {
      t: 'p',
      x: 'Contrast ratio is defined as `(L1 + 0.05) / (L2 + 0.05)`, where L1 and L2 are the relative luminances of the lighter and darker colours. Luminance itself is a weighted sum of the gamma-corrected channels:',
    },
    {
      t: 'code',
      lang: 'javascript',
      x: `function luminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;   // green dominates
}`,
    },
    {
      t: 'p',
      x: 'The green coefficient of 0.7152 reflects how much more sensitive human vision is to green than to blue. It also explains a result that surprises people: pure blue `#0000ff` on white is only 8.6:1, while pure yellow `#ffff00` on white is 1.07:1 and effectively invisible.',
    },
    { t: 'p', x: 'The ratio ranges from 1:1 (identical colours) to 21:1 (pure black on pure white).' },

    {
      t: 'note',
      kind: 'info',
      title: 'This formula has known flaws',
      x: 'WCAG 2.x contrast is a simple model and it is wrong at the edges — it is notably unreliable for dark backgrounds and for thin fonts. **APCA**, the successor being developed for WCAG 3, models perceived lightness far more accurately. It is not yet a standard and not yet a legal requirement, so WCAG 2.x remains what you must comply with today.',
    },

    { t: 'h2', x: 'Contrast is necessary but not sufficient' },
    {
      t: 'p',
      x: 'Passing 4.5:1 does not make an interface accessible. Two adjacent failures commonly ship alongside good contrast:',
    },
    {
      t: 'ol',
      items: [
        '**Colour used as the only signal.** Red for errors and green for success fails for roughly one in twelve men with colour vision deficiency. Add an icon, a label or a pattern — WCAG 1.4.1 requires it regardless of contrast.',
        '**Missing focus indicators.** Keyboard users need to see where they are. `outline: none` without a replacement is one of the most damaging single lines of CSS on the web, and the indicator itself must clear 3:1 against the adjacent colour.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What contrast ratio do I actually need?',
          a: '4.5:1 for normal text, 3:1 for large text and for UI components such as borders, icons and focus rings. That is WCAG level AA, which is the level referenced by accessibility law in the EU, UK and US.',
        },
        {
          q: 'Do logos and brand marks need to pass?',
          a: 'No. WCAG explicitly exempts logotypes and incidental text. The exemption is narrow, though — it does not extend to a tagline set in body copy, or to navigation styled in brand colours.',
        },
        {
          q: 'Does contrast apply to dark mode separately?',
          a: 'Yes, and it must be checked separately. Inverting a palette does not preserve contrast ratios, because luminance is non-linear. A pairing that comfortably passes in light mode can fail in dark mode, which is why the swap button above is worth using on every colour pair you ship.',
        },
        {
          q: 'What about text over a photograph?',
          a: 'The ratio has to hold over every part of the image the text sits on, which in practice means adding a semi-transparent scrim or a gradient overlay. Testing against one sampled pixel is not enough — check the lightest region the text crosses.',
        },
        {
          q: 'Is APCA something I should switch to now?',
          a: 'Not for compliance. APCA is a substantially better perceptual model and worth understanding, but it is still in development for WCAG 3 and no regulation references it. Design to WCAG 2.2 AA today; treat APCA as a tiebreaker when the 2.x formula gives an answer that plainly contradicts your eyes.',
        },
      ],
    },
  ],

  related: ['/guides/css-grid-vs-flexbox/', '/tools/regex-tester/', '/guides/http-status-codes-explained/'],
};
