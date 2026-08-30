module.exports = {
  slug: 'gdpr-compliance-software',
  title: 'GDPR Compliance Software: What You Need and What You Don’t',
  h1: 'GDPR compliance software',
  eyebrow: 'Buying guide',
  schemaType: 'Article',
  itemListName: 'GDPR and privacy compliance platforms',
  description:
    'Consent management, data mapping, DSAR handling and vendor risk, with guidance on which tools become useful at different levels of complexity.',
  standfirst:
    'A small organization may need little more than working consent controls and a documented subject-access process. Broader privacy platforms become useful as systems, vendors and request volume grow.',
  keywords: [
    'gdpr compliance software',
    'consent management platform',
    'dsar automation',
    'data mapping tool gdpr',
    'cookie consent solution',
    'privacy compliance tools',
  ],
  published: '2026-05-21',
  updated: '2026-08-22',
  author: 'jackson',
  cardDesc: 'CMPs, data mapping and DSAR tooling, with practical buying thresholds at 10, 100 and 1,000 employees.',

  blocks: [
    {
      t: 'note',
      kind: 'warn',
      title: 'Not legal advice',
      x: 'We are software developers, not data protection lawyers. This research-based analysis covers the **tooling** landscape and is intended to help scope a purchase. GDPR obligations depend on your processing activities; a data protection lawyer or DPO is the right source for a compliance opinion. See our [editorial policy](/legal/editorial-policy/).',
    },

    {
      t: 'takeaways',
      items: [
        'Software does not establish GDPR compliance. **Each processing activity needs a lawful basis**; tooling can help operate and document that basis.',
        'A **consent management platform** is often the first useful purchase for a website because prior blocking, granular consent and consent records are technical requirements.',
        'Fines are calculated on **global annual turnover**, up to 4% or €20 million, whichever is higher.',
        'Having fewer than 10 employees does not create a general exemption. The small-business carve-out applies only to record keeping, with conditions that exclude many routine processing activities.',
      ],
    },

    { t: 'h2', x: 'What GDPR requires' },
    {
      t: 'p',
      x: 'Before shopping, it helps to separate the legal obligations from the products sold against them. The core duties are:',
    },
    {
      t: 'ol',
      items: [
        '**Have a lawful basis** for every processing activity: consent, contract, legal obligation, vital interests, public task or legitimate interests. Consent is only one of six and is often the weakest choice.',
        '**Maintain records of processing activities (ROPA)** under Article 30, covering what you collect, why, on what basis, who receives it and how long you retain it.',
        '**Honour data subject rights** within one month: access, rectification, erasure, portability, restriction and objection.',
        '**Report qualifying breaches** to your supervisory authority within 72 hours of becoming aware.',
        '**Have data processing agreements** with every processor handling personal data on your behalf.',
        '**Conduct a DPIA** for high-risk processing.',
        '**Implement appropriate technical and organizational measures**, including encryption, access control and other security basics.',
      ],
    },
    {
      t: 'note',
      kind: 'info',
      title: 'The Article 30 small-business exemption is narrower than people think',
      x: 'Organizations under 250 employees are exempt from full ROPA **unless** processing is not occasional, risks individual rights or involves special-category data. Regular customer or employee processing is not occasional, so many businesses fall outside the exemption. Verify whether it applies before relying on it.',
    },

    { t: 'h2', x: 'The four categories of tooling' },
    {
      t: 'table',
      head: ['Category', 'What it does', 'Who needs it'],
      rows: [
        ['**Consent management (CMP)**', 'Cookie banner, consent capture, preference storage, tag blocking', 'Anyone with a website using non-essential cookies'],
        ['**Data mapping / ROPA**', 'Inventory of processing activities, data flows, retention', 'Anyone above the Article 30 threshold; in practice, many organizations'],
        ['**DSAR automation**', 'Intake, identity verification, discovery across systems, response', 'Consumer-facing businesses, or anyone above ~10 requests a month'],
        ['**Vendor risk / TIA**', 'Processor inventory, DPAs, transfer impact assessments', 'Organizations with many sub-processors or international transfers'],
      ],
    },
    {
      t: 'p',
      x: 'Few small organizations need four separate products at the outset. A practical sequence is to implement a CMP, maintain the ROPA in a spreadsheet while that remains manageable, and automate DSARs when request volume makes the manual process unreliable.',
    },

    { t: 'h2', x: 'Why consent management is technically difficult' },
    {
      t: 'p',
      x: 'Cookie consent is a visible enforcement area, and a homemade banner can easily miss one of the technical requirements:',
    },
    {
      t: 'ul',
      items: [
        '**No pre-ticked boxes and no implied consent.** Continuing to browse is not consent.',
        '**Rejecting must be as easy as accepting.** A prominent "Accept all" with "Reject" buried behind two clicks has been repeatedly ruled non-compliant, including in enforcement against very large sites.',
        '**No cookies before consent.** Analytics and marketing tags must not fire until permission is given. A banner that displays a notice after those tags load does not solve the underlying problem.',
        '**Consent must be granular** by purpose, withdrawable as easily as given, and logged with a timestamp as evidence.',
      ],
    },
    {
      t: 'p',
      x: 'Correct prior blocking requires more than displaying a banner, which is why a CMP can be more reliable than a custom implementation. If you serve EU users and run Google services, you also need **Google Consent Mode v2**. Without it, Google restricts data collection and remarketing for EU traffic regardless of the banner text.',
    },

    {
      t: 'pick',
      rank: 1,
      name: 'Cookiebot (Usercentrics)',
      award: 'Best CMP for most websites',
      summary:
        'Scans a site, classifies cookies, blocks tags before consent and maintains a consent log, covering the parts most difficult to maintain manually.',
      price: 'Free for very small sites; paid plans typically €10–€50 per month per domain',
      bestFor: 'Small and mid-sized websites needing a defensible cookie banner quickly',
      body: [
        'The monthly scan-and-classify feature can find trackers that the site owner did not know were present. Automatic prior blocking is intended to prevent tags from firing before consent, rather than merely displaying a notice over an already loaded tracker.',
        'The free tier can cover a small site. Costs scale by page count and domain, so a large multi-site estate becomes more expensive.',
      ],
      pros: [
        'Automatic cookie scanning and classification',
        'Prior blocking rather than a notice alone',
        'IAB TCF and Google Consent Mode v2 support',
        'Free tier suitable for small sites',
      ],
      cons: ['Pricing scales with pages and domains', 'Default styling needs work to match a brand', 'Scanner can misclassify unusual first-party cookies'],
    },

    {
      t: 'pick',
      rank: 2,
      name: 'OneTrust',
      award: 'The enterprise standard',
      summary:
        'A broad enterprise suite covering consent, data mapping, DSAR workflow, vendor risk and assessments, with enterprise pricing and implementation scope.',
      price: 'Enterprise agreements; typically five figures annually and up',
      bestFor: 'Large organizations with a dedicated privacy function and multi-jurisdiction obligations',
      body: [
        'OneTrust is the category benchmark for organizations with a DPO, several jurisdictions and personal data processed at scale. Its broad coverage is the main reason to shortlist it.',
        'That breadth also creates overhead. A small organization may use only a fraction of the suite while still paying for and implementing the wider platform. The purchase makes sense when the obligations justify that scope, not simply because it is the most complete option.',
      ],
      pros: [
        'Broad functional coverage across privacy operations',
        'Handles GDPR, CCPA/CPRA, LGPD and more in one place',
        'Mature DSAR workflow and assessment automation',
        'Extensive integration catalog',
      ],
      cons: ['Expensive', 'Significant implementation effort', 'Substantially over-scoped for most SMBs'],
    },

    {
      t: 'pick',
      rank: 3,
      name: 'Osano',
      award: 'Best mid-market balance',
      summary:
        'Consent management plus data mapping and vendor monitoring, with a clearer, faster implementation than the enterprise suites.',
      price: 'Mid-market SaaS pricing, well below enterprise platforms',
      bestFor: 'Growing companies that have outgrown a bare cookie banner but do not need OneTrust',
      body: [
        'Osano sits between a standalone CMP and a full enterprise privacy suite. Its vendor monitoring tracks privacy-policy changes at sub-processors, a task that otherwise requires repetitive manual review.',
        'It covers less than OneTrust, in exchange for a faster implementation and lower price. That scope can be enough for a company without a dedicated privacy team.',
      ],
      pros: ['Faster to implement than enterprise suites', 'Vendor privacy monitoring included', 'Covers GDPR and US state laws', 'Transparent pricing'],
      cons: ['Less depth than OneTrust for complex needs', 'Smaller integration catalog', 'DSAR automation is more basic'],
    },

    {
      t: 'pick',
      rank: 4,
      name: 'A spreadsheet, a lawyer and a good CMP',
      award: 'The right answer under about 50 people',
      summary:
        'For a small organization with straightforward processing, a compliant consent banner, maintained ROPA spreadsheet and documented DSAR process may be sufficient.',
      price: 'CMP cost plus a few hours of legal advice',
      bestFor: 'Small businesses with straightforward processing and no special-category data',
      body: [
        'A 20-person B2B company processing customer contact details and employee records may not need a privacy platform. It still needs a working cookie banner, a maintained spreadsheet ROPA, signed DPAs with processors, an accurate privacy notice and a written process for answering a subject access request within one month.',
        'A few hours with a data protection lawyer can validate lawful bases and review the privacy notice before the same budget goes toward a platform license. Tooling becomes more useful when the volume of systems, vendors or requests exceeds what one person can track reliably.',
      ],
      pros: ['Minimal cost', 'Requires direct understanding of your own processing', 'Acceptable to regulators when properly maintained'],
      cons: [
        'Depends on one person keeping it current',
        'No automated discovery of new data flows',
        'Scales badly past a few dozen systems or regular DSARs',
      ],
    },

    { t: 'h2', x: 'The operational work behind DSARs' },
    {
      t: 'p',
      x: 'A subject access request must be answered within one month, extendable to three for complex cases. The operational challenge is locating every copy of one person’s data across the CRM, support desk, analytics, backups, logs and marketing tools.',
    },
    {
      t: 'p',
      x: 'Automation is worth buying when volume makes manual handling unreliable, roughly above ten requests a month. Below that, a documented runbook naming each system and who searches it is usually enough, and considerably cheaper.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Write the DSAR runbook before you receive one',
      x: 'The clock starts when the request arrives. A one-page list of systems holding personal data, the person who can search each one and the available export format makes the response easier to coordinate. The same inventory also provides much of the source material for a ROPA.',
    },

    { t: 'h2', x: 'International transfers' },
    {
      t: 'p',
      x: 'Moving personal data outside the EEA requires a valid transfer mechanism. For the US, the **EU–US Data Privacy Framework** provides adequacy for certified organizations. Check each vendor’s certification rather than assuming it applies; otherwise, Standard Contractual Clauses plus a transfer impact assessment are required.',
    },
    {
      t: 'p',
      x: 'This area has been overturned twice by the Court of Justice of the EU (Safe Harbour, then Privacy Shield) and the current framework faces ongoing legal challenge. If your architecture depends on it, know which vendors are certified and have a contingency plan.',
    },

    { t: 'h2', x: 'What to buy, by size' },
    {
      t: 'table',
      head: ['Organization', 'Sensible spend'],
      rows: [
        ['Under 20 people, simple processing', 'CMP (often free tier) + spreadsheet ROPA + a few hours of legal review'],
        ['20–100 people', 'Paid CMP + a mid-market platform for data mapping, or a well-maintained spreadsheet'],
        ['100–500 people', 'Integrated platform covering consent, mapping and DSAR; likely a designated privacy owner'],
        ['500+, or high-risk processing', 'Enterprise suite, a DPO, and formal DPIA processes'],
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Do I need GDPR compliance software?',
          a: 'Many organizations with a website need a consent management platform because prior blocking and consent records are difficult to maintain by hand. Other tooling is driven by scale. A small company with simple processing may meet its obligations with a maintained spreadsheet and documented processes.',
        },
        {
          q: 'Does GDPR apply to my US company?',
          a: 'It applies if you offer goods or services to people in the EU or UK, or monitor their behavior, including through analytics and advertising. The absence of an EU office does not by itself remove a company from scope. Tracking EU visitors can bring the site within scope.',
        },
        {
          q: 'What are the GDPR fines?',
          a: 'Up to €20 million or 4% of global annual turnover, whichever is higher, for the most serious infringements; up to €10 million or 2% for lesser ones. Regulators also issue warnings, reprimands and orders to stop processing, which can be more disruptive than a fine.',
        },
        {
          q: 'Is a free cookie banner good enough?',
          a: 'Only if it blocks non-essential cookies until consent, makes rejection as easy as acceptance, offers granular choice by purpose and logs consent as evidence. Many free banners display a notice after tracking scripts have already run, which is the violation regulators act on.',
        },
        {
          q: 'How long do I have to respond to a data subject access request?',
          a: 'One month from receipt, extendable by a further two months for complex or numerous requests, provided you inform the individual of the extension and the reason within the first month.',
        },
        {
          q: 'Do I need a Data Protection Officer?',
          a: 'A DPO is mandatory for public authorities, for organizations whose core activities require large-scale regular monitoring of individuals, or large-scale processing of special-category data. Most SMBs do not need one, but should still name someone internally as accountable for privacy.',
        },
      ],
    },
  ],

  related: ['/reviews/soc-2-compliance-software/', '/reviews/best-endpoint-security-software/', '/reviews/best-crm-for-small-business/'],
};
