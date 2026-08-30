/**
 * Global configuration for generated JunePoint resource pages.
 *
 * The React portfolio does not import this file.
 */

const SITE_URL = (process.env.SITE_URL || 'https://junepoint.com').replace(/\/$/, '');

/**
 * AdSense settings for generated resource pages.
 *
 * Portfolio routes never receive ad markup or the loader script. Ads remain
 * disabled until `client` contains a publisher ID, which prevents incomplete
 * units from reaching review.
 *
 * Supply the client ID through `ADSENSE_CLIENT` during the build.
 */
const ads = {
  client: process.env.ADSENSE_CLIENT || '',

  // Auto Ads remain opt in because manual units give tighter layout control.
  auto: process.env.ADSENSE_AUTO === '1',

  // Set `AD_PREVIEW` to `1` to show labelled placeholders during local builds.
  preview: process.env.AD_PREVIEW === '1',

  /**
   * AdSense slot IDs keyed by placements in `lib/ads.js`.
   * Environment values may supply each ID at build time.
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
 * Content sections and their commercial role.
 *
 * Tier 1 serves buyer intent, tier 2 serves evergreen editorial content, and
 * tier 3 serves frequently used tools.
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
  name: 'JunePoint Software',
  alternateName: ['JunePoint', 'junepoint.com'],
  author: 'Jackson Abeyta',
  /** Public identity for generated resource pages. */
  publication: 'JunePoint Resources',
  url: SITE_URL,
  portalPath: '/resources/',
  tagline: 'Tools, guides and software research for people who build things.',
  description:
    'JunePoint Resources publishes free browser-based developer tools, troubleshooting guides and independent business-software buying research.',
  locale: 'en_US',
  language: 'en',
  twitter: '@junepoint',
  email: 'jackson@allwatermarinegroup.com',
  logo: '/imgs/junepoint.png',
  favicon: '/favicon.png',
  founded: '2025',
  organization: 'JunePoint',
};

module.exports = { site, ads, sections, SITE_URL };
