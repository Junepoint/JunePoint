module.exports = {
  slug: 'best-cloud-backup-for-business',
  title: 'Best Cloud Backup for Business: 2026 Buyer’s Guide',
  h1: 'Best cloud backup for business',
  eyebrow: 'Buying guide',
  schemaType: 'Article',
  itemListName: 'Business cloud backup platforms',
  description:
    'How to choose business cloud backup: immutability, restore testing, egress fees and the SaaS data gap. Six platforms compared by what they are genuinely best at.',
  standfirst:
    'Backup software is bought on price and judged on one restore. Here is what actually separates these platforms — and the questions that expose a vendor who will fail you when it matters.',
  keywords: [
    'best cloud backup for business',
    'enterprise cloud backup software',
    'business backup solution',
    'immutable backup',
    'ransomware backup protection',
    'microsoft 365 backup',
  ],
  published: '2026-02-20',
  updated: '2026-08-28',
  author: 'alexander',
  featured: true,
  cardDesc: 'Immutability, restore testing and the Microsoft 365 data gap — with six platforms compared on fit.',

  blocks: [
    {
      t: 'note',
      kind: 'warn',
      title: 'How this guide was made',
      x: 'This is **research-based analysis, not a hands-on lab test.** We have not deployed each of these platforms across a thousand endpoints or timed their restores under load. What follows is drawn from vendor documentation, published pricing, security architecture papers and support terms, and it is written to help you ask better questions — not to substitute for a proof of concept. Our [editorial policy](/legal/editorial-policy/) explains the method and its limits in full.',
    },

    {
      t: 'takeaways',
      items: [
        '**Immutability is the single most important feature.** Ransomware now targets backups first. If your backups can be deleted by a compromised admin account, you do not have backups.',
        '**Microsoft 365 and Google Workspace do not back up your data.** Both operate a shared responsibility model. Retention policies and a recycle bin are not backup, and this gap surprises people badly.',
        '**Egress and restore fees can exceed the storage cost** during the one event you bought the product for. Get them in writing before you sign.',
        '**An untested backup is a hypothesis.** Schedule quarterly restore drills and measure how long a full recovery actually takes.',
      ],
    },

    { t: 'h2', x: 'Start with the two numbers that define your requirement' },
    {
      t: 'p',
      x: 'Before comparing products, write these down. Every meaningful decision follows from them.',
    },
    {
      t: 'ul',
      items: [
        '**RPO — Recovery Point Objective.** How much data can you afford to lose? Nightly backups mean up to 24 hours of work gone. Continuous replication means minutes. The gap in price between them is large.',
        '**RTO — Recovery Time Objective.** How long can you be down? Restoring 8 TB over a 500 Mbps link takes about 36 hours at theoretical line rate, and considerably longer in reality. If your RTO is four hours, cloud-only restore cannot meet it and you need a local appliance or seeded recovery.',
      ],
    },
    {
      t: 'p',
      x: 'Most organisations discover their real RTO is far shorter than assumed once someone asks what a full day offline costs in revenue, payroll and reputation. Do that calculation first — it sets your budget more honestly than any feature comparison.',
    },

    { t: 'h2', x: 'What actually matters when comparing platforms' },

    { t: 'h3', x: 'Immutability and air gap' },
    {
      t: 'p',
      x: 'Modern ransomware operators spend days inside a network before encrypting anything, and their first target is the backup infrastructure. If an attacker with domain admin can delete your backups, the ransom is unavoidable.',
    },
    {
      t: 'p',
      x: 'What you want is **object-lock style immutability**: once written, a backup cannot be modified or deleted by anyone — including your own administrators and including the vendor’s support staff — until its retention period expires. Ask specifically whether immutability is enforced by the storage layer or merely by application-level permissions. Only the former survives a compromised admin account.',
    },

    { t: 'h3', x: 'The 3-2-1-1-0 rule' },
    {
      t: 'p',
      x: 'The old 3-2-1 rule has been extended for the ransomware era, and it is a genuinely useful checklist:',
    },
    {
      t: 'ul',
      items: [
        '**3** copies of your data',
        '**2** different media types',
        '**1** copy offsite',
        '**1** copy immutable or air-gapped',
        '**0** errors — verified by an actual test restore',
      ],
    },

    { t: 'h3', x: 'The SaaS data gap' },
    {
      t: 'p',
      x: 'This is the most commonly overlooked exposure in small and mid-sized organisations. Microsoft and Google both operate a **shared responsibility model**: they guarantee the availability of the service, you remain responsible for your data. Their documentation states this plainly, and third-party backup is recommended in it.',
    },
    {
      t: 'p',
      x: 'The recycle bin and retention policies are not backup. They will not save you from a departing employee’s deletions discovered four months later, from ransomware that syncs encrypted files to OneDrive, or from an admin misconfiguration that removes a mailbox. If you run Microsoft 365 or Google Workspace, dedicated SaaS backup is not optional.',
    },

    { t: 'h3', x: 'Restore granularity and speed' },
    {
      t: 'p',
      x: 'Full-image restore is the least common thing you will do. What you will do weekly is recover one mailbox, one file, one database table. Ask whether the platform supports item-level recovery without staging an entire image first — and whether an "instant recovery" feature runs a VM directly from backup storage while the full restore streams in behind it. That feature is often the difference between meeting a four-hour RTO and missing it.',
    },

    { t: 'h3', x: 'The pricing model, and what is not in it' },
    {
      t: 'p',
      x: 'Per-workload, per-TB and per-user models produce wildly different bills for the same environment. Beyond the headline number, ask about:',
    },
    {
      t: 'ul',
      items: [
        '**Egress and restore fees.** Some providers charge nothing to restore; others charge per GB retrieved. That charge lands precisely when you are already having your worst week.',
        '**API and retrieval charges on archive tiers.** Cheap cold storage frequently has expensive retrieval and a minimum storage duration.',
        '**Overage handling.** Does exceeding your allowance stop backups, or silently bill you?',
        '**Whether deduplication and compression are counted before or after** when measuring your consumption.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'The single most valuable question to ask a vendor',
      x: '"Walk me through, in writing, exactly what a full restore of our environment costs and how long it takes." A vendor who cannot answer that concretely has told you something important. A vendor who will put a restore-time commitment in the contract has told you something better.',
    },

    { t: 'h2', x: 'The platforms, and what each is genuinely best at' },
    {
      t: 'p',
      x: 'These are grouped by the buyer they suit rather than ranked, because "best" depends entirely on what you are protecting. Pricing is indicative list pricing as of August 2026 and moves frequently — treat it as a starting point and get a quote.',
    },

    {
      t: 'pick',
      rank: 1,
      name: 'Veeam Data Platform',
      award: 'Best for mixed and hybrid estates',
      summary:
        'The default choice for organisations running a mixture of on-premises VMs, physical servers, cloud workloads and Microsoft 365 — its breadth of supported workloads is the widest in the category.',
      price: 'Per-workload licensing; Veeam Data Cloud tiers start in the low tens of dollars per user per year for Microsoft 365',
      bestFor: 'IT teams with heterogeneous infrastructure and in-house expertise',
      deployment: 'Self-managed, or Veeam Data Cloud as a managed service',
      body: [
        'Veeam’s strength is coverage: VMware, Hyper-V, Nutanix, physical Windows and Linux, AWS, Azure, Google Cloud, Microsoft 365, Salesforce and Kubernetes are all first-class rather than bolted on. For an estate that grew organically and now spans several of those, consolidating on one platform has real operational value.',
        'It also has a well-developed immutability story, with hardened Linux repositories and object-lock support on S3-compatible storage, and its instant-recovery feature is mature. The trade-off is complexity: Veeam is a platform rather than an appliance, and it assumes someone owns it. Small teams without dedicated infrastructure staff often find it heavier than they need.',
      ],
      pros: [
        'The broadest workload coverage in the category',
        'Strong immutability options including hardened repositories',
        'Mature instant-recovery and granular restore',
        'Storage-agnostic — you are not locked to one cloud',
      ],
      cons: [
        'Meaningful learning curve; expects a competent administrator',
        'Per-workload licensing gets complicated in mixed estates',
        'Self-managed deployments mean you own the backup infrastructure’s own resilience',
      ],
    },

    {
      t: 'pick',
      rank: 2,
      name: 'Acronis Cyber Protect',
      award: 'Best all-in-one for small IT teams',
      summary:
        'Combines backup with endpoint security, patch management and disaster recovery in one agent and one console — attractive when the same one or two people own everything.',
      price: 'Per-workload subscription, with cloud storage bundled or purchased separately',
      bestFor: 'Small to mid-sized businesses and managed service providers wanting fewer vendors',
      deployment: 'Cloud console with agents; hybrid local storage supported',
      body: [
        'The integration argument is genuine. One agent doing backup, anti-malware and patching means fewer things to deploy and one place to look. For a two-person IT team supporting 150 staff, that consolidation can matter more than best-of-breed depth in any single area.',
        'The counter-argument is equally genuine: bundled security is not usually as strong as a dedicated endpoint platform, and consolidating backup and security into one product means one compromise affects both. Evaluate the security component on its own merits rather than treating it as free.',
      ],
      pros: [
        'Backup, anti-malware and patching in a single agent',
        'Strong MSP tooling and multi-tenancy',
        'Straightforward for teams without deep backup expertise',
        'Flexible local and cloud storage combinations',
      ],
      cons: [
        'Bundled security is not equivalent to a dedicated EDR platform',
        'Broad feature set means more surface area to configure correctly',
        'Consolidation concentrates risk in one vendor',
      ],
    },

    {
      t: 'pick',
      rank: 3,
      name: 'Rubrik Security Cloud',
      award: 'Best for enterprise ransomware recovery',
      summary:
        'Built around the assumption that you will be attacked, with immutability by default, anomaly detection on backup data and tooling for identifying a clean recovery point.',
      price: 'Enterprise agreements; expect a substantial annual commitment',
      bestFor: 'Larger organisations with a formal security programme and budget to match',
      deployment: 'Cloud-native, or appliance-based for on-premises',
      body: [
        'Rubrik’s architecture treats backup as a security control rather than an IT housekeeping task. Backups are immutable by design rather than by configuration, and the platform analyses backup data for signs of encryption or mass deletion — which helps answer the question that paralyses ransomware recovery: *which restore point is clean?*',
        'That capability is genuinely differentiated, and so is the price. This is not a small-business product, and the evaluation should involve your security team rather than only IT.',
      ],
      pros: [
        'Immutable architecture rather than optional immutability',
        'Anomaly detection helps identify an uninfected recovery point',
        'Sensitive-data discovery supports compliance work',
        'Well-regarded for large-scale recovery orchestration',
      ],
      cons: [
        'Enterprise pricing puts it out of reach for most SMBs',
        'Considerable platform to adopt — expect a real implementation project',
        'Overkill unless ransomware recovery is a board-level concern',
      ],
    },

    {
      t: 'pick',
      rank: 4,
      name: 'Backblaze B2 + a backup client',
      award: 'Best value for storage-heavy workloads',
      summary:
        'Not a backup application but a storage back end, priced far below the hyperscalers and with no egress charge up to three times your average monthly stored data.',
      price: 'Around $6 per TB per month; free egress up to 3× stored data',
      bestFor: 'Teams with their own backup software that need cheap, S3-compatible immutable storage',
      deployment: 'S3-compatible object storage; pair with Veeam, Restic, Duplicati or similar',
      body: [
        'For organisations already running backup software, the storage bill is often the dominant cost, and B2 undercuts S3 substantially while remaining S3-compatible and supporting object lock for immutability. Veeam, MSP360, Restic, Duplicati and most other clients integrate with it directly.',
        'The generous egress allowance deserves emphasis, because egress is where cloud backup economics usually break: a large restore from a hyperscaler can produce a bill that dwarfs a year of storage. What you do not get is a backup application, a support relationship covering your whole recovery process, or anyone to call when a restore fails. You are assembling the solution yourself.',
      ],
      pros: [
        'Dramatically cheaper than hyperscaler object storage',
        'Free egress up to 3× average monthly stored data',
        'Object Lock immutability supported',
        'S3-compatible, so most backup clients work with it',
      ],
      cons: [
        'Storage only — you still need and must operate backup software',
        'Fewer regions than AWS, Azure or Google Cloud',
        'Support covers the storage layer, not your recovery outcome',
      ],
    },

    {
      t: 'pick',
      rank: 5,
      name: 'Datto (Kaseya)',
      award: 'Best for MSP-delivered BCDR',
      summary:
        'A local appliance plus cloud replication, sold through managed service providers, with the fastest realistic RTO in this list because recovery starts on hardware already in your building.',
      price: 'Sold through partners; appliance plus subscription',
      bestFor: 'SMBs who buy IT through an MSP and need genuinely fast recovery',
      deployment: 'On-premises appliance with cloud replication',
      body: [
        'The hybrid appliance model addresses the RTO problem directly. A failed server can be virtualised on the local Datto device in minutes, while the cloud copy provides the offsite and disaster-recovery layer. For a business where a day of downtime is unacceptable but a six-figure enterprise platform is unaffordable, this shape of solution is often the right answer.',
        'The constraints are structural: you generally buy it through an MSP rather than directly, so your experience depends heavily on that partner’s competence, and there is hardware in your environment to maintain. Since the Kaseya acquisition, some customers have reported pricing and packaging changes — worth raising directly during negotiation.',
      ],
      pros: [
        'Local appliance enables recovery in minutes rather than hours',
        'Cloud replication provides the offsite copy automatically',
        'Well-established MSP channel with mature tooling',
        'Screenshot verification of backup bootability',
      ],
      cons: [
        'Usually only available via a partner, not direct',
        'Hardware to buy, house and maintain',
        'Your outcome depends substantially on your MSP',
      ],
    },

    {
      t: 'pick',
      rank: 6,
      name: 'Dedicated Microsoft 365 backup (Veeam, AvePoint, Dropsuite)',
      award: 'The gap almost everyone has',
      summary:
        'Whatever else you choose, if you run Microsoft 365 or Google Workspace you need a separate backup for it. This is the cheapest meaningful risk reduction available to most organisations.',
      price: 'Typically $3–$8 per user per month',
      bestFor: 'Every organisation using Microsoft 365 or Google Workspace',
      deployment: 'SaaS, usually deployed in under an hour',
      body: [
        'Exchange Online, SharePoint, OneDrive and Teams data is your responsibility under Microsoft’s shared responsibility model. Native retention protects against Microsoft losing your data — not against you deleting it, an attacker deleting it, or a sync client propagating encryption.',
        'Microsoft has introduced its own first-party backup offering, which is a reasonable option and worth pricing. Many organisations still prefer a third party on the principle that a backup living in the same tenant, under the same identity provider, shares a failure domain with the thing it is protecting. At a few dollars per user per month, this is the highest return on investment in this guide.',
      ],
      pros: [
        'Closes a genuine and widely underestimated gap',
        'Fast to deploy and inexpensive per user',
        'Item-level restore of mail, files, sites and Teams content',
        'Retains data beyond the licence lifetime of departed staff',
      ],
      cons: [
        'Another vendor and another bill',
        'Teams backup coverage varies notably between products — test it',
        'Restores into a live tenant need care to avoid duplicates',
      ],
    },

    { t: 'h2', x: 'Comparison at a glance' },
    {
      t: 'table',
      head: ['Platform', 'Best for', 'Immutability', 'Typical buyer'],
      rows: [
        ['Veeam', 'Mixed/hybrid estates', 'Hardened repos, object lock', 'IT team with expertise'],
        ['Acronis', 'All-in-one simplicity', 'Immutable cloud storage', 'Small IT team or MSP'],
        ['Rubrik', 'Enterprise ransomware recovery', 'Immutable by architecture', 'Security-led enterprise'],
        ['Backblaze B2', 'Cheap storage layer', 'Object Lock', 'Team with its own software'],
        ['Datto', 'Fast RTO via appliance', 'Cloud-side immutability', 'SMB buying through an MSP'],
        ['M365 backup', 'The SaaS gap', 'Varies by vendor', 'Everyone on Microsoft 365'],
      ],
      caption:
        'Indicative positioning based on vendor documentation as of August 2026. Verify current capabilities and pricing directly — this category changes quickly.',
    },

    { t: 'h2', x: 'The thing that matters more than which product you pick' },
    {
      t: 'p',
      x: 'Test your restores. Quarterly, on a schedule, with someone other than the person who built the system doing it.',
    },
    {
      t: 'p',
      x: 'Backup jobs report success for years while silently excluding a critical volume, or writing to a repository nobody has verified is readable. The failure is discovered during the incident, which is the worst possible moment. A restore drill answers three questions no dashboard can:',
    },
    {
      t: 'ol',
      items: [
        '**Does the data come back intact?** Not "did the job succeed" — does the restored database actually open and pass a consistency check?',
        '**How long does it really take?** Measure it. Compare against the RTO you committed to. The gap is usually uncomfortable.',
        '**Can someone else do it?** If recovery depends on one person’s undocumented knowledge, you have a single point of failure that no amount of redundancy addresses.',
      ],
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'Store recovery credentials outside the systems being recovered',
      x: 'If your backup console password is in a password manager that authenticates through the Active Directory the ransomware just encrypted, you cannot log in to start recovering. Keep offline, tested copies of recovery credentials and runbooks. Organisations discover this constraint at the worst possible time with depressing regularity.',
    },

    { t: 'h2', x: 'A shortlist process that works' },
    {
      t: 'ol',
      items: [
        'Write down your RPO and RTO, and what an hour of downtime costs. Everything else follows from these.',
        'Inventory what needs protecting — servers, endpoints, SaaS, databases, cloud workloads. The SaaS line is the one usually missing.',
        'Shortlist two or three platforms that cover your actual mix without heavy add-ons.',
        'Run a proof of concept on real data. Restore something. Time it.',
        'Get restore costs, egress fees and support response times **in writing** before signing.',
        'Schedule the first restore drill for 90 days after go-live, and put it in the calendar now.',
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Does Microsoft 365 back up my data?',
          a: 'Not in the sense you need. Microsoft operates a shared responsibility model: it guarantees service availability and protects against its own infrastructure failures, while your data remains your responsibility. Recycle bins and retention policies have limited windows and will not protect you from deletion, ransomware syncing encrypted files, or an admin error found months later. Microsoft’s own documentation recommends third-party backup.',
        },
        {
          q: 'What is immutable backup and do I need it?',
          a: 'Immutable backups cannot be modified or deleted until their retention period expires — not by an attacker, not by an administrator, not by the vendor. Given that ransomware operators specifically target backup infrastructure before encrypting anything, yes: it is the single most important feature in this category.',
        },
        {
          q: 'How much should business cloud backup cost?',
          a: 'SaaS backup is typically $3–$8 per user per month. Server and workload backup varies enormously with data volume and retention. As a sanity check, most organisations land between 1% and 3% of their total IT budget. If a quote is dramatically below that, check what is excluded — usually egress and restore charges.',
        },
        {
          q: 'How often should I test restores?',
          a: 'Quarterly at minimum, and after any significant infrastructure change. Test a full system restore at least annually, timed, with the results compared against your stated RTO. Have someone who did not build the system perform the drill.',
        },
        {
          q: 'Is cloud backup enough on its own, or do I need local backup too?',
          a: 'It depends on your RTO. Restoring several terabytes over a typical business internet connection takes many hours or days. If you cannot tolerate that, you need a local copy for speed and the cloud copy for disaster recovery — which is the hybrid appliance model.',
        },
        {
          q: 'What is the 3-2-1-1-0 rule?',
          a: 'Three copies of your data, on two different media types, with one offsite, one immutable or air-gapped, and zero errors verified by an actual test restore. It is the 3-2-1 rule updated for ransomware, and it makes a useful audit checklist.',
        },
      ],
    },
  ],

  related: [
    '/reviews/best-endpoint-security-software/',
    '/tools/cloud-cost-calculator/',
    '/reviews/soc-2-compliance-software/',
  ],
};
