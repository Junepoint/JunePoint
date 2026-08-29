/**
 * AdSense unit rendering.
 *
 * Scoped entirely to generated network pages. The React portfolio never calls
 * into this module, so /, /personal-websites, /business-websites,
 * /cross-platform-apps, /local-apps and /video-games stay ad-free.
 */

const { ads } = require('../config');
const { esc } = require('./html');

const enabled = () => /^ca-pub-\d{10,}$/.test(ads.client);

/** The loader script, emitted once per page in <head>. */
function loaderScript() {
  if (!enabled()) return '';
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(
    ads.client
  )}" crossorigin="anonymous"></script>`;
}

/** Auto Ads opt-in, only when explicitly turned on. */
function autoAdsScript() {
  if (!enabled() || !ads.auto) return '';
  return `<script>(adsbygoogle=window.adsbygoogle||[]).push({google_ad_client:"${esc(
    ads.client
  )}",enable_page_level_ads:true});</script>`;
}

const PLACEMENTS = {
  articleTop: { slot: 'articleTop', format: 'auto', label: 'Article top' },
  inContent: { slot: 'inContent', format: 'fluid', layout: 'in-article', label: 'In-content' },
  sidebar: { slot: 'sidebar', format: 'auto', label: 'Sidebar', sticky: true },
  footer: { slot: 'footer', format: 'auto', label: 'Footer' },
  toolTop: { slot: 'toolTop', format: 'auto', label: 'Above tool' },
  toolResult: { slot: 'toolResult', format: 'auto', label: 'Below results' },
  hub: { slot: 'hub', format: 'auto', label: 'Hub' },
};

/**
 * Render one ad unit.
 *
 * Emits nothing at all unless a real publisher ID is configured — a stranded
 * <ins> element collapses to zero height and looks like a broken implementation
 * to both users and AdSense review. Set AD_PREVIEW=1 to draw layout
 * placeholders locally instead.
 */
function unit(name) {
  const placement = PLACEMENTS[name];
  if (!placement) throw new Error(`Unknown ad placement: ${name}`);

  const wrapperClass = `jp-ad jp-ad--${name}${placement.sticky ? ' jp-ad--sticky' : ''}`;

  if (!enabled()) {
    if (!ads.preview) return '';
    return `<div class="${wrapperClass} jp-ad--preview" role="presentation"><span>Ad slot · ${esc(
      placement.label
    )}</span></div>`;
  }

  const slotId = ads.slots[placement.slot];
  const insAttrs = [
    'class="adsbygoogle"',
    'style="display:block"',
    `data-ad-client="${esc(ads.client)}"`,
    slotId ? `data-ad-slot="${esc(slotId)}"` : '',
    `data-ad-format="${esc(placement.format)}"`,
    placement.layout ? `data-ad-layout="${esc(placement.layout)}"` : '',
    placement.format === 'auto' ? 'data-full-width-responsive="true"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<div class="${wrapperClass}">
  <span class="jp-ad-label">Advertisement</span>
  <ins ${insAttrs}></ins>
  <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>
</div>`;
}

module.exports = { unit, loaderScript, autoAdsScript, enabled };
