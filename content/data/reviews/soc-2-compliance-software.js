module.exports = {
  slug: 'soc-2-compliance-software',
  title: 'SOC 2 Compliance Software: What It Does and Costs',
  h1: 'SOC 2 compliance software',
  eyebrow: 'Buying guide',
  schemaType: 'Article',
  itemListName: 'SOC 2 compliance automation platforms',
  description:
    'What compliance automation covers, what remains manual, the total cost of a SOC 2 report including the auditor, and how the main platforms differ.',
  standfirst:
    'Compliance platforms collect and organize evidence; they neither operate the controls nor issue the report. The full budget needs to include software, audit fees and internal time.',
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
  author: 'jackson',
  cardDesc: 'What automation covers, the full cost including the auditor, and the practical differences among Vanta, Drata and Sprinto.',

  blocks: [
    {
      t: 'note',
      kind: 'warn',
      title: 'How this guide was made',
      x: 'This research-based analysis draws on vendor documentation, published pricing and public audit-firm guidance. We are software developers, **not auditors**. Nothing here is a compliance opinion, and your CPA firm’s judgement governs. See our [editorial policy](/legal/editorial-policy/).',
    },

    {
      t: 'takeaways',
      items: [
        'Software is roughly a third of the cost. **The auditor is a separate firm and a separate bill**, as required by law.',
        'Automation collects evidence continuously. It does not write your policies, run your access reviews, or fix a control you do not operate.',
        'Type I is a point-in-time snapshot. **Type II covers a period, usually 3 to 12 months, and is what enterprise buyers ask for.**',
        'Budget $25,000–$60,000 all-in for a first SOC 2 Type II at a small company, and three to nine months of calendar time.',
      ],
    },

    { t: 'h2', x: 'What a SOC 2 report is' },
    {
      t: 'p',
      x: 'SOC 2 is an attestation report produced by an independent CPA firm that assesses controls against the AICPA’s Trust Services Criteria. It is not a certification and there is no certificate. The deliverable is a report for customers’ security teams to review.',
    },
    {
      t: 'p',
      x: 'There are five Trust Services Criteria. **Security is mandatory**; Availability, Confidentiality, Processing Integrity and Privacy are optional. For a first report, scope only Security unless a customer contract requires more. Each additional criterion adds controls, evidence and audit fees.',
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

    { t: 'h2', x: 'What the software does and what remains manual' },
    {
      t: 'p',
      x: 'The distinction matters because an automated check is not the same as an operating control.',
    },
    {
      t: 'table',
      head: ['The platform does', 'You still have to'],
      rows: [
        ['Connect to AWS, GitHub, Okta, HR systems and monitor configuration continuously', 'Fix what it finds; the platform reports but does not remediate'],
        ['Provide policy templates', 'Read, adapt, approve and follow them'],
        ['Track employee security training and policy acceptance', 'Make people complete it'],
        ['Collect and organize evidence for the auditor', 'Perform the underlying activities: access reviews, incident response, vendor reviews'],
        ['Map one set of controls to SOC 2, ISO 27001, HIPAA and others', 'Pay for each separate audit'],
        ['Flag drift when a control breaks', 'Own the remediation and the timeline'],
      ],
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'The dashboard being green does not mean you pass',
      x: 'A platform showing 100% means its automated checks are satisfied. Auditors also test matters an integration cannot see: whether a competent person performed the access review, whether the incident response plan has been exercised, and whether change management holds under deadline pressure. A green dashboard does not guarantee a clean audit.',
    },

    { t: 'h2', x: 'The full cost, end to end' },
    {
      t: 'table',
      head: ['Line item', 'Typical range (small company)', 'Notes'],
      rows: [
        ['Compliance platform', '$7,000–$25,000 / year', 'Scales with headcount and frameworks'],
        ['Audit firm (Type II)', '$12,000–$40,000', 'Always a separate vendor'],
        ['Penetration test', '$5,000–$20,000', 'Not strictly required, but customers ask'],
        ['Security awareness training', '$0–$3,000 / year', 'Often bundled with the platform'],
        ['Internal time', '100–300 hours', 'Often omitted from the budget'],
        ['**Total, first year**', '**$25,000–$60,000+**', 'Renewals are cheaper because the report is annual'],
      ],
      caption: 'Indicative ranges as of August 2026 for a company under roughly 50 employees. Larger scope moves all of these up.',
    },
    {
      t: 'p',
      x: 'Internal time is easy to leave out of the budget. Someone must own policy work, evidence collection and auditor coordination. At a small company, that is typically 20–30% of one person’s time for several months.',
    },

    { t: 'h2', x: 'The platforms' },

    {
      t: 'pick',
      rank: 1,
      name: 'Vanta',
      award: 'Most established, largest audit-firm network',
      summary:
        'The best-known platform in the category, with the widest integration catalog and a large partner network of audit firms.',
      price: 'Roughly $10,000–$30,000+ per year depending on headcount and frameworks',
      bestFor: 'Startups going through SOC 2 for the first time who want a well-trodden path',
      deployment: 'SaaS, integrations connected via API',
      body: [
        'Vanta’s advantages are maturity and ecosystem. Its integration catalog is extensive, the Trust Center gives sales teams a place to direct prospects, and the partner network makes it easier to find an auditor familiar with the evidence format. That familiarity can reduce avoidable back-and-forth during a first audit.',
        'The platform is priced as the market leader. Some users also find its questionnaire automation and policy tooling less flexible once the environment departs from a standard configuration.',
      ],
      pros: [
        'Largest integration catalog in the category',
        'Extensive network of familiar audit partners',
        'Trust Center supports security reviews in sales cycles',
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
        'Drata is frequently shortlisted with Vanta. It offers granular continuous monitoring and more flexibility in mapping custom controls, which can help when an architecture does not match the standard startup template.',
        'Personnel compliance is also well developed, including onboarding and offboarding checks, background-verification tracking and device monitoring. The decision between Drata and Vanta often comes down to workflow fit and the quote rather than one decisive capability gap.',
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
        'For a 15-person company, the difference between a $8,000 platform and a $25,000 one is material. Sprinto covers the same core categories of evidence collection, policy templates, continuous monitoring and auditor coordination at a lower price point.',
        'The integration catalog is smaller and the audit-partner network less extensive, which can mean more manual evidence work. For a straightforward AWS-and-GitHub environment, that gap is often negligible.',
      ],
      pros: [
        'Substantially cheaper than the market leaders',
        'Fast time to first audit for simple environments',
        'Good support experience reported by small teams',
      ],
      cons: [
        'Fewer integrations can mean more manual evidence collection',
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
        'A spreadsheet, a document repository and a disciplined owner can produce a SOC 2 report. It costs time rather than license fees.',
      price: 'Auditor fee only',
      bestFor: 'Very small teams with simple infrastructure and someone who has done it before',
      body: [
        'SOC 2 predates compliance automation, and organizations can still complete an audit without a platform. With fewer than 20 people, one cloud provider and one identity provider, manual evidence collection is tedious but possible; auditors accept screenshots and exports.',
        'The workload grows with the organization. Type II requires evidence sampled *throughout* the observation period, so a manual process may require monthly collection for a year. Platforms reduce the risk of missing that schedule, and many teams that begin manually adopt one by the second or third audit.',
      ],
      pros: ['No license cost', 'Requires direct understanding of your own controls', 'Acceptable to auditors'],
      cons: [
        'Significant ongoing manual effort, especially for Type II',
        'No continuous monitoring or drift detection',
        'Easy to miss evidence and discover it at audit time',
      ],
    },

    { t: 'h2', x: 'Choosing an auditor' },
    {
      t: 'p',
      x: 'Choose the auditor separately from the software. The report carries the audit firm’s name, and sophisticated buyers may consider that firm during their review.',
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
        { title: 'Months 1–2: policies and remediation', x: 'Adopt and adapt policies, then close the gaps the platform surfaces: MFA everywhere, encryption at rest, logging, offboarding and vendor reviews. This is the bulk of the work.' },
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
          a: 'For a small company, budget $25,000–$60,000 in the first year: roughly $7,000–$25,000 for a compliance platform, $12,000–$40,000 for the audit firm, and often a penetration test on top. Renewals cost less because the readiness work is already done. Internal time, typically 100–300 hours, is another cost that rarely appears in the budget.',
        },
        {
          q: 'Does Vanta or Drata make me SOC 2 compliant?',
          a: 'No. They automate evidence collection and monitoring, but compliance requires the controls to operate, and only a licensed CPA firm can issue the report. A green dashboard is not a passing audit.',
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
