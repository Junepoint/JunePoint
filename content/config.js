/**
 * JunePoint content network: global configuration.
 *
 * This file drives the static site generator in `content/build.js`. It has no
 * relationship to the React portfolio app in `src/` and is never imported by it.
 */

const SITE_URL = (process.env.SITE_URL || 'https://junepoint.com').replace(/\/$/, '');

/**
 * AdSense wiring.
 *
 * Ads are rendered ONLY on generated network pages (/tools, /guides, /reviews,
 * /resources). The React portfolio at "/" and its sub-routes never receive ad
 * markup or the AdSense loader script.
 *
 * Until `client` is a real publisher ID, no ad markup and no loader script are
 * emitted at all. An empty <ins> unit is worse than no unit (it can trip
 * "low value / broken implementation" flags during AdSense review).
 *
 * Set via env at build time so the ID never has to be committed:
 *   ADSENSE_CLIENT=ca-pub-0000000000000000 npm run build
 */
const ads = {
  client: process.env.ADSENSE_CLIENT || '',

  // Set ADSENSE_AUTO=1 to also let Auto Ads place units. Manual units below
  // give far better control over layout shift, so auto is off by default.
  auto: process.env.ADSENSE_AUTO === '1',

  // Draw labelled dashed boxes where ad units will sit, for local layout work.
  //   AD_PREVIEW=1 npm run build:content
  preview: process.env.AD_PREVIEW === '1',

  /**
   * Create these units in the AdSense dashboard, then paste the slot IDs here
   * (or supply them as env vars). Names map to placements in `lib/ads.js`.
   */
  slots: {
    articleTop: process.env.AD_SLOT_ARTICLE_TOP || '',
    inContent: process.env.AD_SLOT_IN_CONTENT || '',
    sidebar: process.env.AD_SLOT_SIDEBAR || '',
    footer: process.env.AD_SLOT_FOOTER || '',
    toolTop: process.env.AD_SLOT_TOOL_TOP || '',
    toolResult: process.env.AD_SLOT_TOOL_RESULT || '',
    hub: process.env.AD_SLOT_HUB || '',
  },
};

/**
 * Sections of the network. `tier` is the monetisation tier from the strategy:
 *   1 = high CPC / low traffic requirement (buyer intent)
 *   2 = medium CPC / high volume (evergreen editorial)
 *   3 = utility / programmatic (tools, high pageviews + retention)
 */
const sections = {
  reviews: {
    slug: 'reviews',
    tier: 1,
    label: 'Business Software',
    navLabel: 'Software',
    title: 'Business Software Buying Guides',
    tagline: 'Vendor comparisons for backup, security, compliance, payroll and finance software.',
    description:
      'Independent, research-based buying guides for business software: cloud backup, endpoint security, GDPR and SOC 2 compliance, payroll, CRM and freelance tax tools.',
    accent: '#2563eb',
  },
  guides: {
    slug: 'guides',
    tier: 2,
    label: 'Developer Guides',
    navLabel: 'Guides',
    title: 'Developer Guides & Troubleshooting',
    tagline: 'Plain-English fixes for the errors that stop a build, and the concepts behind them.',
    description:
      'Step-by-step developer guides and troubleshooting walkthroughs for CORS, Git, npm, Docker, Postgres, SSH, React and CSS, with the reasoning behind each command.',
    accent: '#0891b2',
  },
  tools: {
    slug: 'tools',
    tier: 3,
    label: 'Free Tools',
    navLabel: 'Tools',
    title: 'Free Online Developer & Finance Tools',
    tagline: 'Calculators, formatters and converters that run entirely in your browser.',
    description:
      'Free browser-based tools: cloud cost and SaaS seat calculators, mortgage payoff projections, JSON and JWT inspection, regex testing and cron building.',
    accent: '#0d9488',
  },
};

const site = {
  name: 'JunePoint',
  author: 'Jackson Abeyta',
  /** Publication identity for the network half of the domain. */
  publication: 'JunePoint Resources',
  url: SITE_URL,
  portalPath: '/resources/',
  tagline: 'Tools, guides and software research for people who build things.',
  description:
    'JunePoint Resources publishes free browser-based developer tools, troubleshooting guides and independent business-software buying research.',
  locale: 'en_US',
  language: 'en',
  twitter: '@junepoint',
  email: 'info@junepoint.com',
  logo: '/imgs/junepoint.png',
  founded: '2025',
  organization: 'JunePoint',
};

module.exports = { site, ads, sections, SITE_URL };
