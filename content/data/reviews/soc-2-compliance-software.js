module.exports = {
  slug: 'soc-2-compliance-software',
  title: 'SOC 2 Compliance Software: What It Does and Costs',
  h1: 'SOC 2 compliance software',
  eyebrow: 'Buying guide',
  schemaType: 'Article',
  itemListName: 'SOC 2 compliance automation platforms',
  description:
    'What compliance automation actually automates, the real total cost of a SOC 2 report including the auditor, and how the main platforms differ.',
  standfirst:
    'Compliance platforms collect evidence. They do not make you compliant, and they are not the auditor. Here is what you are really buying, and what it costs end to end.',
  keywords: [
    'soc 2 compliance software',
    'soc 2 cost',
    'vanta vs drata',
    'compliance automation',
    'soc 2 type 2 audit',
    'iso 27001 software',
  ],
  published: '2026-04-08',
  updated: '2026-08-24',
  author: 'alexander',
  cardDesc: 'What automation really covers, the full cost including the auditor, and how Vanta, Drata and Sprinto differ.',

  blocks: [
    {
      t: 'note',
      kind: 'warn',
      title: 'How this guide was made',
      x: 'Research-based analysis from vendor documentation, published pricing and public audit-firm guidance. We are software developers, **not auditors** — nothing here is a compliance opinion, and your CPA firm’s judgement governs. See our [editorial policy](/legal/editorial-policy/).',
    },

    {
      t: 'takeaways',
      items: [
        'The software is roughly a third of the cost. **The auditor is a separate firm and a separate bill**, and by law it has to be.',
        'Automation collects evidence continuously. It does not write your policies, run your access reviews, or fix a control you do not actually operate.',
        'Type I is a point-in-time snapshot. **Type II covers a period — usually 3 to 12 months — and is what enterprise buyers actually ask for.**',
        'Budget $25,000–$60,000 all-in for a first SOC 2 Type II at a small company, and three to nine months of calendar time.',
      ],
    },

    { t: 'h2', x: 'What SOC 2 is, in one section' },
    {
      t: 'p',
      x: 'SOC 2 is an attestation report produced by an independent CPA firm, assessing your controls against the AICPA’s Trust Services Criteria. It is not a certification and there is no certificate — the deliverable is a report that your customers’ security teams read.',
    },
    {
      t: 'p',
      x: 'There are five Trust Services Criteria. **Security is mandatory**; Availability, Confidentiality, Processing Integrity and Privacy are optional. Scope only Security for your first report unless a customer contract explicitly demands more — each additional criterion adds controls, evidence and audit fee.',
    },
    {
      t: 'table',
      head: ['', 'Type I', 'Type II'],
      rows: [
        ['Assesses', 'Control design at a point in time', 'Design **and operating effectiveness** over a period'],
        ['Observation period', 'A single date', 'Typically 3–12 months'],
        ['Typical timeline', '4–8 weeks', '3–12 months after readiness'],
        ['What buyers want', 'Sometimes accepted as interim', 'This one'],
      ],
    },
    {
      t: 'p',
      x: 'The common path is a Type I to unblock a deal, then a Type II over the following months. If you have time, going straight to a Type II with a three-month window saves an audit fee.',
    },

    { t: 'h2', x: 'What the software actually does — and does not' },
    {
      t: 'p',
      x: 'This is where expectations most often go wrong, so it is worth being blunt.',
    },
    {
      t: 'table',
      head: ['The platform does', 'You still have to'],
      rows: [
        ['Connect to AWS, GitHub, Okta, HR systems and monitor configuration continuously', 'Fix what it finds — it reports, it does not remediate'],
        ['Provide policy templates', 'Read, adapt, approve and actually follow them'],
        ['Track employee security training and policy acceptance', 'Make people complete it'],
        ['Collect and organise evidence for the auditor', 'Perform the underlying activities: access reviews, incident response, vendor reviews'],
        ['Map one set of controls to SOC 2, ISO 27001, HIPAA and others', 'Pay for each separate audit'],
        ['Flag drift when a control breaks', 'Own the remediation and the timeline'],
      ],
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'The dashboard being green does not mean you pass',
      x: 'A platform showing 100% is telling you its automated checks are satisfied. Auditors test things no integration can see — whether your access review was genuinely performed and by someone competent, whether your incident response plan has ever been exercised, whether change management is followed under deadline pressure. Companies do fail audits with a green dashboard.',
    },

    { t: 'h2', x: 'The real cost, end to end' },
    {
      t: 'table',
      head: ['Line item', 'Typical range (small company)', 'Notes'],
      rows: [
        ['Compliance platform', '$7,000–$25,000 / year', 'Scales with headcount and frameworks'],
        ['Audit firm (Type II)', '$12,000–$40,000', 'Separate vendor — always'],
        ['Penetration test', '$5,000–$20,000', 'Not strictly required, but customers ask'],
        ['Security awareness training', '$0–$3,000 / year', 'Often bundled with the platform'],
        ['Internal time', '100–300 hours', 'The cost people forget entirely'],
        ['**Total, first year**', '**$25,000–$60,000+**', 'Renewals are cheaper — the report is annual'],
      ],
      caption: 'Indicative ranges as of August 2026 for a company under roughly 50 employees. Larger scope moves all of these up.',
    },
    {
      t: 'p',
      x: 'The internal-time line is the one that derails plans. Someone has to own this — writing policies, chasing evidence, coordinating the auditor. At a small company that is typically 20–30% of one person’s time for several months, and it is real money.',
    },

    { t: 'h2', x: 'The platforms' },

    {
      t: 'pick',
      rank: 1,
      name: 'Vanta',
      award: 'Most established, largest audit-firm network',
      summary:
        'The category’s best-known name, with the widest integration catalogue and a large network of partner audit firms — which removes a step most first-timers find genuinely difficult.',
      price: 'Roughly $10,000–$30,000+ per year depending on headcount and frameworks',
      bestFor: 'Startups going through SOC 2 for the first time who want a well-trodden path',
      deployment: 'SaaS, integrations connected via API',
      body: [
        'Vanta’s advantages are maturity and ecosystem. Its integration coverage is extensive, its Trust Center gives sales a page to point prospects at, and its partner network means finding an auditor familiar with the platform is straightforward. For a first audit, that familiarity has real value — an auditor who has seen a hundred Vanta evidence packages will move faster than one seeing their first.',
        'It is also priced as the market leader, and some users find the questionnaire-automation and policy tooling less flexible than they would like once their environment stops being standard.',
      ],
      pros: [
        'Largest integration catalogue in the category',
        'Extensive network of familiar audit partners',
        'Trust Center is genuinely useful in sales cycles',
        'Multi-framework mapping across SOC 2, ISO 27001, HIPAA and GDPR',
      ],
      cons: ['Premium pricing', 'Less customisable for unusual environments', 'Annual contracts with limited flexibility'],
    },

    {
      t: 'pick',
      rank: 2,
      name: 'Drata',
      award: 'Strongest automation depth',
      summary:
        'Similar scope to Vanta with a reputation for deeper continuous monitoring and more configurable control mapping.',
      price: 'Comparable to Vanta; commonly $10,000–$30,000+ per year',
      bestFor: 'Teams with more complex infrastructure, or managing several frameworks at once',
      deployment: 'SaaS with agent-based endpoint checks',
      body: [
        'Drata competes directly with Vanta and the two are frequently shortlisted together. Its differentiators are the granularity of continuous monitoring and more flexibility in mapping custom controls — useful once your architecture stops matching the standard startup template.',
        'It also has a well-developed personnel-compliance side: onboarding and offboarding checks, background verification tracking and device monitoring. Choosing between the two usually comes down to the demo and the quote rather than a decisive capability gap.',
      ],
      pros: [
        'Deep continuous monitoring with granular checks',
        'Flexible custom control mapping',
        'Strong personnel and device compliance tracking',
        'Broad multi-framework support',
      ],
      cons: ['Similar price point to Vanta', 'Endpoint agent adds a deployment step', 'Considerable initial configuration'],
    },

    {
      t: 'pick',
      rank: 3,
      name: 'Sprinto',
      award: 'Best value for small teams',
      summary:
        'Aimed at smaller companies with pricing well below the market leaders, focused on getting a first SOC 2 or ISO 27001 done without an enterprise budget.',
      price: 'Frequently below $10,000 per year for small teams',
      bestFor: 'Seed and Series A companies where the platform cost is a material decision',
      deployment: 'SaaS',
      body: [
        'For a 15-person company, the difference between a $8,000 platform and a $25,000 one is not a rounding error. Sprinto covers the same core need — evidence collection, policy templates, continuous monitoring, auditor coordination — at a price aimed squarely at that buyer.',
        'The integration catalogue is smaller and the audit-partner network less extensive, which can mean more manual evidence work. For a straightforward AWS-and-GitHub environment, that gap is often negligible.',
      ],
      pros: [
        'Substantially cheaper than the market leaders',
        'Fast time to first audit for simple environments',
        'Good support experience reported by small teams',
      ],
      cons: [
        'Fewer integrations — more manual evidence collection',
        'Smaller auditor network',
        'Less proven at larger scale or unusual complexity',
      ],
    },

    {
      t: 'pick',
      rank: 4,
      name: 'Doing it without a platform',
      award: 'Viable more often than vendors admit',
      summary:
        'A spreadsheet, a document repository and a disciplined owner can produce a SOC 2 report. It costs time rather than licence fees.',
      price: 'Auditor fee only',
      bestFor: 'Very small teams with simple infrastructure and someone who has done it before',
      body: [
        'SOC 2 predates compliance automation by many years, and plenty of organisations still pass without a platform. If you have fewer than 20 people, one cloud provider and one identity provider, manual evidence collection is tedious rather than impossible — and the auditor will accept screenshots and exports.',
        'The economics flip as you grow. Type II requires evidence sampled *throughout* the observation period, so manual collection means remembering to capture things monthly for a year. That is precisely the discipline that fails under pressure, and it is what the platforms genuinely solve. Most teams that start manual adopt a platform by their second or third audit.',
      ],
      pros: ['No licence cost', 'Forces genuine understanding of your own controls', 'Perfectly acceptable to auditors'],
      cons: [
        'Significant ongoing manual effort, especially for Type II',
        'No continuous monitoring or drift detection',
        'Easy to miss evidence and discover it at audit time',
      ],
    },

    { t: 'h2', x: 'Choosing an auditor' },
    {
      t: 'p',
      x: 'This is a separate decision from the software and arguably a more consequential one — the report carries the audit firm’s name, and sophisticated buyers do look at it.',
    },
    {
      t: 'ul',
      items: [
        '**It must be a licensed CPA firm.** Only CPA firms can issue a SOC 2 report. Anyone else is selling you something that is not a SOC 2.',
        '**Ask about their experience with your platform.** An auditor who regularly works with Vanta or Drata evidence packages will complete faster and ask fewer redundant questions.',
        '**Get the fee and the timeline in writing**, including the cost of a re-test if an exception is found.',
        '**Ask how exceptions are handled.** A qualified opinion is not fatal, but you want to understand the process before you are in it.',
        '**Beware the bundled auditor.** Some platforms push a preferred firm. Convenience is real; independence matters more. Get a second quote.',
      ],
    },

    { t: 'h2', x: 'A realistic timeline' },
    {
      t: 'steps',
      items: [
        { title: 'Months 0–1: scope and select', x: 'Decide Type I or straight to Type II, choose criteria (Security only unless contractually required), select platform and auditor. Getting scope right here saves the most money later.' },
        { title: 'Months 1–2: policies and remediation', x: 'Adopt and adapt policies, close the gaps the platform surfaces — MFA everywhere, encryption at rest, logging, offboarding, vendor reviews. This is the bulk of the real work.' },
        { title: 'Months 2–3: readiness', x: 'Controls operating, evidence flowing, everyone trained. Many teams run a readiness assessment with the auditor here to avoid surprises.' },
        { title: 'Months 3–12: observation window', x: 'For Type II, controls must operate continuously through this period. Access reviews happen on schedule. Drift gets fixed. This is where discipline is tested.' },
        { title: 'Final 4–8 weeks: fieldwork and report', x: 'The auditor samples evidence, interviews staff, and issues the report. Then it renews annually.' },
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'How much does SOC 2 cost?',
          a: 'For a small company, budget $25,000–$60,000 in the first year: roughly $7,000–$25,000 for a compliance platform, $12,000–$40,000 for the audit firm, and often a penetration test on top. Renewals cost less because the readiness work is already done. Internal time — typically 100–300 hours — is a real cost that rarely appears in the budget.',
        },
        {
          q: 'Does Vanta or Drata make me SOC 2 compliant?',
          a: 'No. They automate evidence collection and monitoring, which is genuinely valuable, but compliance means actually operating the controls, and only a licensed CPA firm can issue the report. A green dashboard is not a passing audit.',
        },
        {
          q: 'Should I get Type I or Type II?',
          a: 'Type II is what enterprise buyers want, because it demonstrates controls worked over time rather than on one day. Type I is a reasonable stopgap when a deal is blocked now. If you can wait, going straight to Type II with a three-month window avoids paying for two audits.',
        },
        {
          q: 'How long does SOC 2 take?',
          a: 'Type I is typically four to eight weeks once readiness work is done. Type II requires an observation period of three to twelve months plus fieldwork, so three to nine months end to end is realistic for a well-prepared small company.',
        },
        {
          q: 'Can I do SOC 2 without compliance software?',
          a: 'Yes. SOC 2 long predates these platforms and auditors accept manual evidence. It is most practical for very small, simple environments. The effort grows quickly with headcount and integrations, particularly for Type II where evidence must be sampled throughout the period.',
        },
        {
          q: 'Is ISO 27001 the same thing?',
          a: 'No. SOC 2 is a US attestation report from a CPA firm; ISO 27001 is an international certification of an information security management system, issued by an accredited certification body. Controls overlap substantially, which is why these platforms map both. European and Asian customers more often ask for ISO 27001; US buyers usually ask for SOC 2.',
        },
      ],
    },
  ],

  related: ['/reviews/gdpr-compliance-software/', '/reviews/best-endpoint-security-software/', '/reviews/best-cloud-backup-for-business/'],
};
