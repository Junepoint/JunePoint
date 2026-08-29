module.exports = {
  slug: 'gdpr-compliance-software',
  title: 'GDPR Compliance Software: What You Need and What You Don’t',
  h1: 'GDPR compliance software',
  eyebrow: 'Buying guide',
  schemaType: 'Article',
  itemListName: 'GDPR and privacy compliance platforms',
  description:
    'Consent management, data mapping, DSAR handling and vendor risk — which GDPR tools are genuinely necessary at your size, and which are enterprise overhead.',
  standfirst:
    'Most small organisations need a cookie banner that works and a process for subject access requests. Everything beyond that is a question of scale — here is where each threshold sits.',
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
  author: 'alexander',
  cardDesc: 'CMPs, data mapping and DSAR tooling — what you actually need at 10, 100 and 1,000 employees.',

  blocks: [
    {
      t: 'note',
      kind: 'warn',
      title: 'Not legal advice',
      x: 'We are software developers, not data protection lawyers. This is research-based analysis of the **tooling** landscape, written to help you scope a purchase. GDPR obligations depend on your specific processing activities, and a data protection lawyer or DPO is the right source for whether you comply. See our [editorial policy](/legal/editorial-policy/).',
    },

    {
      t: 'takeaways',
      items: [
        'Software does not make you GDPR compliant. **A lawful basis for each processing activity does** — the tooling helps you evidence and operate it.',
        'A **consent management platform** is the one purchase almost every organisation with a website needs, because the requirements are technical and unforgiving.',
        'Fines are calculated on **global annual turnover** — up to 4% or €20 million, whichever is higher.',
        'Under-10 employees does not exempt you. The small-business carve-out only applies to the record-keeping obligation, and it has conditions most companies fail.',
      ],
    },

    { t: 'h2', x: 'What you are actually obliged to do' },
    {
      t: 'p',
      x: 'Before shopping, it helps to separate the legal obligations from the products sold against them. The core duties are:',
    },
    {
      t: 'ol',
      items: [
        '**Have a lawful basis** for every processing activity — consent, contract, legal obligation, vital interests, public task or legitimate interests. Consent is only one of six and often the weakest choice.',
        '**Maintain records of processing activities (ROPA)** under Article 30 — what you collect, why, on what basis, who you share it with, how long you keep it.',
        '**Honour data subject rights** within one month: access, rectification, erasure, portability, restriction and objection.',
        '**Report qualifying breaches** to your supervisory authority within 72 hours of becoming aware.',
        '**Have data processing agreements** with every processor handling personal data on your behalf.',
        '**Conduct a DPIA** for high-risk processing.',
        '**Implement appropriate technical and organisational measures** — encryption, access control, and the security basics.',
      ],
    },
    {
      t: 'note',
      kind: 'info',
      title: 'The Article 30 small-business exemption is narrower than people think',
      x: 'Organisations under 250 employees are exempt from full ROPA — **unless** the processing is not occasional, risks the rights of individuals, or involves special-category data. Regular customer or employee data processing is not occasional, so most businesses fall outside the exemption in practice. Assume it does not apply to you.',
    },

    { t: 'h2', x: 'The four categories of tooling' },
    {
      t: 'table',
      head: ['Category', 'What it does', 'Who needs it'],
      rows: [
        ['**Consent management (CMP)**', 'Cookie banner, consent capture, preference storage, tag blocking', 'Anyone with a website using non-essential cookies'],
        ['**Data mapping / ROPA**', 'Inventory of processing activities, data flows, retention', 'Anyone above the Article 30 threshold — effectively most'],
        ['**DSAR automation**', 'Intake, identity verification, discovery across systems, response', 'Consumer-facing businesses, or anyone above ~10 requests a month'],
        ['**Vendor risk / TIA**', 'Processor inventory, DPAs, transfer impact assessments', 'Organisations with many sub-processors or international transfers'],
      ],
    },
    {
      t: 'p',
      x: 'Very few organisations need all four as separate products. The realistic sequencing is: get a proper CMP first, keep the ROPA in a spreadsheet until it becomes unmanageable, handle DSARs manually until volume forces the issue.',
    },

    { t: 'h2', x: 'Consent management: the one that is genuinely hard' },
    {
      t: 'p',
      x: 'This is where most enforcement action against small organisations lands, because the requirements are specific and a homemade banner almost always fails at least one:',
    },
    {
      t: 'ul',
      items: [
        '**No pre-ticked boxes and no implied consent.** Continuing to browse is not consent.',
        '**Rejecting must be as easy as accepting.** A prominent "Accept all" with "Reject" buried behind two clicks has been repeatedly ruled non-compliant, including in enforcement against very large sites.',
        '**No cookies before consent.** Analytics and marketing tags must not fire until permission is given. Most homemade banners display a notice while the tags have already loaded — which is the whole violation.',
        '**Consent must be granular** by purpose, withdrawable as easily as given, and logged with a timestamp as evidence.',
      ],
    },
    {
      t: 'p',
      x: 'Getting tag blocking right is a genuine engineering problem, which is why a CMP is worth buying rather than building. If you serve EU users and run Google services, you also need **Google Consent Mode v2** — without it, Google restricts data collection and remarketing for EU traffic regardless of what your banner says.',
    },

    {
      t: 'pick',
      rank: 1,
      name: 'Cookiebot (Usercentrics)',
      award: 'Best CMP for most websites',
      summary:
        'Automatically scans your site, classifies cookies, blocks tags before consent and maintains a consent log — the technical parts that are hard to get right by hand.',
      price: 'Free for very small sites; paid plans typically €10–€50 per month per domain',
      bestFor: 'Small and mid-sized websites needing a defensible cookie banner quickly',
      body: [
        'The monthly scan-and-classify feature is the real value: it finds trackers you did not know were on your site, which is a common and awkward discovery. Automatic prior blocking means tags genuinely do not fire before consent rather than merely appearing not to.',
        'The free tier is genuinely usable for a small site. Costs scale by page count and domain, so a large multi-site estate gets expensive.',
      ],
      pros: [
        'Automatic cookie scanning and classification',
        'Genuine prior blocking, not just a notice',
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
        'The most comprehensive privacy platform available — consent, data mapping, DSAR workflow, vendor risk and assessments in one suite. Priced and scoped accordingly.',
      price: 'Enterprise agreements; typically five figures annually and up',
      bestFor: 'Large organisations with a dedicated privacy function and multi-jurisdiction obligations',
      body: [
        'If you have a DPO, operate across several jurisdictions and process personal data at scale, OneTrust is the category benchmark and covers essentially everything. Its breadth is the point.',
        'That breadth is also the caution. Small organisations that buy it routinely use a fraction of it while paying for the whole platform, and implementation is a project rather than a signup. Do not buy this because it is the most complete option; buy it when you have the obligations that justify it.',
      ],
      pros: [
        'Broadest functional coverage in the market',
        'Handles GDPR, CCPA/CPRA, LGPD and more in one place',
        'Mature DSAR workflow and assessment automation',
        'Extensive integration catalogue',
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
        'Osano occupies the gap between a standalone CMP and a full enterprise privacy suite. Its vendor monitoring — tracking privacy-policy changes at your sub-processors — is a genuinely useful feature that is tedious to do manually.',
        'It is less comprehensive than OneTrust, which is the intended trade: faster to adopt, cheaper, and enough for a company without a dedicated privacy team.',
      ],
      pros: ['Faster to implement than enterprise suites', 'Vendor privacy monitoring included', 'Covers GDPR and US state laws', 'Transparent pricing'],
      cons: ['Less depth than OneTrust for complex needs', 'Smaller integration catalogue', 'DSAR automation is more basic'],
    },

    {
      t: 'pick',
      rank: 4,
      name: 'A spreadsheet, a lawyer and a good CMP',
      award: 'The right answer under about 50 people',
      summary:
        'For most small organisations, a compliant consent banner plus a maintained ROPA spreadsheet and a documented DSAR process is genuinely sufficient.',
      price: 'CMP cost plus a few hours of legal advice',
      bestFor: 'Small businesses with straightforward processing and no special-category data',
      body: [
        'A 20-person B2B company processing customer contact details and employee records does not need a privacy platform. It needs a working cookie banner, a spreadsheet ROPA that someone actually maintains, signed DPAs with its processors, a privacy notice that describes reality, and a written procedure for handling a subject access request within a month.',
        'Spending a few hours with a data protection lawyer to validate your lawful bases and review your privacy notice is a better use of the same budget than a platform licence. The tooling becomes worthwhile when volume — of systems, vendors or requests — exceeds what a person can track.',
      ],
      pros: ['Minimal cost', 'Forces genuine understanding of your own processing', 'Entirely acceptable to regulators when properly maintained'],
      cons: [
        'Depends on one person keeping it current',
        'No automated discovery of new data flows',
        'Scales badly past a few dozen systems or regular DSARs',
      ],
    },

    { t: 'h2', x: 'DSARs: where the operational pain actually is' },
    {
      t: 'p',
      x: 'A subject access request must be answered within one month, extendable to three for complex cases. The difficulty is rarely legal — it is finding every copy of one person’s data across your CRM, support desk, analytics, backups, logs and marketing tools.',
    },
    {
      t: 'p',
      x: 'Automation is worth buying when volume makes manual handling unreliable, roughly above ten requests a month. Below that, a documented runbook naming each system and who searches it is usually enough, and considerably cheaper.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Write the DSAR runbook before you receive one',
      x: 'The clock starts when the request arrives, not when you work out what to do. A one-page list of every system holding personal data, who can search it and what the export looks like turns a stressful month into an afternoon. It is also the fastest route to a ROPA, since it is much the same information.',
    },

    { t: 'h2', x: 'International transfers' },
    {
      t: 'p',
      x: 'Moving personal data outside the EEA needs a valid transfer mechanism. For the US, the **EU–US Data Privacy Framework** provides adequacy for certified organisations — check whether each vendor is actually certified rather than assuming. Otherwise, Standard Contractual Clauses plus a transfer impact assessment are required.',
    },
    {
      t: 'p',
      x: 'This area has been overturned twice by the Court of Justice of the EU (Safe Harbour, then Privacy Shield) and the current framework faces ongoing legal challenge. If your architecture depends on it, know which vendors are certified and have a contingency plan.',
    },

    { t: 'h2', x: 'What to buy, by size' },
    {
      t: 'table',
      head: ['Organisation', 'Sensible spend'],
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
          a: 'Most organisations with a website need a consent management platform, because getting cookie consent technically right — particularly blocking tags before consent — is genuinely hard to do by hand. Beyond that, tooling is driven by scale. A small company with simple processing can meet its obligations with a maintained spreadsheet and a documented process.',
        },
        {
          q: 'Does GDPR apply to my US company?',
          a: 'It applies if you offer goods or services to people in the EU or UK, or monitor their behaviour — including through analytics and advertising. Having no EU office is irrelevant. If EU visitors reach your site and you run tracking on them, you are in scope.',
        },
        {
          q: 'What are the GDPR fines?',
          a: 'Up to €20 million or 4% of global annual turnover, whichever is higher, for the most serious infringements; up to €10 million or 2% for lesser ones. Regulators also issue warnings, reprimands and orders to stop processing — which can be more disruptive than a fine.',
        },
        {
          q: 'Is a free cookie banner good enough?',
          a: 'Only if it genuinely blocks non-essential cookies until consent, makes rejection as easy as acceptance, offers granular choice by purpose and logs consent as evidence. Many free banners display a notice while the tracking scripts have already run, which is precisely the violation regulators act on.',
        },
        {
          q: 'How long do I have to respond to a data subject access request?',
          a: 'One month from receipt, extendable by a further two months for complex or numerous requests — provided you inform the individual of the extension and the reason within the first month.',
        },
        {
          q: 'Do I need a Data Protection Officer?',
          a: 'A DPO is mandatory for public authorities, for organisations whose core activities require large-scale regular monitoring of individuals, or large-scale processing of special-category data. Most SMBs do not need one, but should still name someone internally as accountable for privacy.',
        },
      ],
    },
  ],

  related: ['/reviews/soc-2-compliance-software/', '/reviews/best-endpoint-security-software/', '/reviews/best-crm-for-small-business/'],
};
