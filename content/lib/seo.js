/** Structured data builders. Every generated page ships at least two graphs. */

const { site, SITE_URL } = require('../config');

const abs = (path) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`);

/** Site-wide identity graph, emitted on every page so entities consolidate. */
function organization() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: site.organization,
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: abs(site.logo) },
    email: site.email,
    foundingDate: site.founded,
    sameAs: ['https://github.com/Junepoint'],
  };
}

function website() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: site.name,
    url: `${SITE_URL}/`,
    description: site.description,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: site.language,
  };
}

function breadcrumbs(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: abs(crumb.href),
    })),
  };
}

function person(author) {
  return {
    '@type': 'Person',
    '@id': `${SITE_URL}/about/#${author.id}`,
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    url: `${SITE_URL}/about/`,
    ...(author.sameAs ? { sameAs: author.sameAs } : {}),
  };
}

function article({ page, url, author, type = 'Article' }) {
  return {
    '@type': type,
    '@id': `${url}#article`,
    headline: page.h1 || page.title,
    name: page.title,
    description: page.description,
    datePublished: page.published,
    dateModified: page.updated || page.published,
    inLanguage: site.language,
    isAccessibleForFree: true,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@id': `${SITE_URL}/about/#${author.id}` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(page.keywords ? { keywords: page.keywords.join(', ') } : {}),
    ...(page.sectionLabel ? { articleSection: page.sectionLabel } : {}),
  };
}

function faqPage(items, url) {
  if (!items.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: Array.isArray(item.a) ? item.a.join(' ') : item.a,
      },
    })),
  };
}

function softwareApplication({ page, url }) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${url}#app`,
    name: page.h1 || page.title,
    description: page.description,
    url,
    applicationCategory: page.appCategory || 'DeveloperApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${SITE_URL}/#organization` },
    isAccessibleForFree: true,
  };
}

function itemList(items, url, name) {
  return {
    '@type': 'ItemList',
    '@id': `${url}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: abs(item.href),
    })),
  };
}

function howTo({ page, url, steps }) {
  return {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name: page.h1 || page.title,
    description: page.description,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: Array.isArray(s.x) ? s.x.join(' ') : s.x,
      url: `${url}#${s.anchor}`,
    })),
  };
}

/** Wrap a set of node graphs in a single @graph document. */
function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}

module.exports = {
  abs,
  graph,
  organization,
  website,
  breadcrumbs,
  person,
  article,
  faqPage,
  softwareApplication,
  itemList,
  howTo,
};
