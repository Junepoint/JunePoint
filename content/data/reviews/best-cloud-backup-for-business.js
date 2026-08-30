module.exports = {
  slug: 'best-cloud-backup-for-business',
  title: 'Best Cloud Backup for Business: 2026 Buyer’s Guide',
  h1: 'Best cloud backup for business',
  eyebrow: 'Buying guide',
  schemaType: 'Article',
  itemListName: 'Business cloud backup platforms',
  description:
    'How to compare business cloud backup across immutability, restore testing, egress fees and SaaS coverage, with six platforms assessed by fit.',
  standfirst:
    'Backup software is easy to price and difficult to judge until a restore. A useful evaluation starts with recovery targets, then tests whether the platform can meet them.',
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
  author: 'jackson',
  featured: true,
  cardDesc: 'Immutability, restore testing and the Microsoft 365 data gap, with six platforms compared by operational fit.',

  blocks: [
    {
      t: 'note',
      kind: 'warn',
      title: 'How this guide was made',
      x: 'This is **research-based analysis, not a hands-on lab test.** We have not deployed every platform across a thousand endpoints or timed restores under load. The guide draws on vendor documentation, published pricing, security architecture papers and support terms. Use it to frame a proof of concept, not as a substitute for one. Our [editorial policy](/legal/editorial-policy/) explains the method and its limits in full.',
    },

    {
      t: 'takeaways',
      items: [
        '**Immutability is a core requirement.** Ransomware operators target backup infrastructure, so a compromised administrator account must not be able to delete every recovery copy.',
        '**Microsoft 365 and Google Workspace use a shared responsibility model.** Native retention and recycle bins do not provide the same protection as an independent backup.',
        '**Egress and restore fees can exceed storage cost** during a major recovery. Get the full restore cost in writing before signing.',
        '**A successful backup job does not prove recovery.** Run quarterly restore drills and measure a full recovery against the stated RTO.',
      ],
    },

    { t: 'h2', x: 'Start with the two numbers that define your requirement' },
    {
      t: 'p',
      x: 'Write these two targets down before comparing products. They determine the architecture and narrow the shortlist.',
    },
    {
      t: 'ul',
      items: [
        '**RPO (Recovery Point Objective).** How much data can you afford to lose? Nightly backups allow up to 24 hours of work to disappear; continuous replication reduces that window to minutes, at a higher price.',
        '**RTO (Recovery Time Objective).** How long can the service be down? Restoring 8 TB over a 500 Mbps link takes about 36 hours at theoretical line rate and longer in practice. A four-hour RTO therefore requires a local appliance or seeded recovery rather than cloud-only restore.',
      ],
    },
    {
      t: 'p',
      x: 'An RTO often gets shorter once the business prices a full day offline in revenue, payroll and reputation. Do that calculation first; it provides a more defensible budget than a feature list.',
    },

    { t: 'h2', x: 'What matters when comparing platforms' },

    { t: 'h3', x: 'Immutability and air gap' },
    {
      t: 'p',
      x: 'Ransomware operators may spend days inside a network before encryption and often target backup infrastructure first. If a domain administrator can delete every backup, the attacker can remove the main recovery path and gain substantial leverage.',
    },
    {
      t: 'p',
      x: 'Look for **object-lock style immutability**: once written, a backup cannot be modified or deleted by administrators or vendor support until its retention period expires. Ask whether the storage layer enforces that rule or whether it relies on application permissions. Storage-level enforcement is the version designed to survive a compromised admin account.',
    },

    { t: 'h3', x: 'The 3-2-1-1-0 rule' },
    {
      t: 'p',
      x: 'The extended 3-2-1 rule is a useful checklist for ransomware recovery:',
    },
    {
      t: 'ul',
      items: [
        '**3** copies of your data',
        '**2** different media types',
        '**1** copy offsite',
        '**1** copy immutable or air-gapped',
        '**0** errors, verified by an actual test restore',
      ],
    },

    { t: 'h3', x: 'The SaaS data gap' },
    {
      t: 'p',
      x: 'SaaS data is an easy gap to miss in a small or mid-sized organization. Microsoft and Google both use a **shared responsibility model**: they provide service availability while customers remain responsible for their data. Their documentation states this and recommends third-party backup.',
    },
    {
      t: 'p',
      x: 'Recycle bins and retention policies are not independent backups. They may not cover a departing employee’s deletions discovered four months later, ransomware that syncs encrypted files to OneDrive, or an admin error that removes a mailbox. Organizations using Microsoft 365 or Google Workspace should include dedicated SaaS backup in the recovery design.',
    },

    { t: 'h3', x: 'Restore granularity and speed' },
    {
      t: 'p',
      x: 'Full-image restores may be rare; recovering one mailbox, file or database table is a more routine task. Check whether item-level recovery works without staging an entire image. Also verify whether "instant recovery" can run a VM from backup storage while the full restore streams in, a capability that can determine whether a four-hour RTO is achievable.',
    },

    { t: 'h3', x: 'The pricing model, and what is not in it' },
    {
      t: 'p',
      x: 'Per-workload, per-TB and per-user pricing can produce very different bills for the same environment. Ask about the costs outside the headline rate:',
    },
    {
      t: 'ul',
      items: [
        '**Egress and restore fees.** Some providers charge nothing to restore; others charge per GB retrieved. A large recovery can therefore create an additional bill during an incident.',
        '**API and retrieval charges on archive tiers.** Cheap cold storage frequently has expensive retrieval and a minimum storage duration.',
        '**Overage handling.** Does exceeding your allowance stop backups, or silently bill you?',
        '**Whether deduplication and compression are counted before or after** when measuring your consumption.',
      ],
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Ask for the full restore in writing',
      x: 'Ask: "What will a full restore of our environment cost, and how long will it take?" A vague answer exposes uncertainty in the recovery plan. A contractual restore-time commitment is stronger evidence than a sales estimate.',
    },

    { t: 'h2', x: 'The platforms and where each fits' },
    {
      t: 'p',
      x: 'The entries are grouped by buyer fit rather than treated as a universal ranking. Pricing is indicative list pricing as of August 2026 and changes frequently, so use it as a starting point and obtain a quote.',
    },

    {
      t: 'pick',
      rank: 1,
      name: 'Veeam Data Platform',
      award: 'Best for mixed and hybrid estates',
      summary:
        'The broadest workload coverage in this comparison, spanning on-premises VMs, physical servers, cloud workloads and Microsoft 365.',
      price: 'Per-workload licensing; Veeam Data Cloud tiers start in the low tens of dollars per user per year for Microsoft 365',
      bestFor: 'IT teams with heterogeneous infrastructure and in-house expertise',
      deployment: 'Self-managed, or Veeam Data Cloud as a managed service',
      body: [
        'Coverage is Veeam’s main advantage. VMware, Hyper-V, Nutanix, physical Windows and Linux, AWS, Azure, Google Cloud, Microsoft 365, Salesforce and Kubernetes are supported as first-class workloads. An estate spanning several of them can reduce operational fragmentation by consolidating on one platform.',
        'Veeam also supports hardened Linux repositories, object lock on S3-compatible storage and mature instant recovery. That breadth brings complexity: it is a platform that needs an owner, and a small team without dedicated infrastructure staff may find it heavier than necessary.',
      ],
      pros: [
        'The broadest workload coverage in the category',
        'Strong immutability options including hardened repositories',
        'Mature instant-recovery and granular restore',
        'Storage-agnostic, avoiding dependence on one cloud',
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
        'Combines backup, endpoint security, patch management and disaster recovery in one agent and console for small teams with broad responsibilities.',
      price: 'Per-workload subscription, with cloud storage bundled or purchased separately',
      bestFor: 'Small to mid-sized businesses and managed service providers wanting fewer vendors',
      deployment: 'Cloud console with agents; hybrid local storage supported',
      body: [
        'One agent for backup, anti-malware and patching reduces deployment work and puts status in one console. For a two-person IT team supporting 150 staff, that consolidation may matter more than best-of-breed depth in each category.',
        'The corresponding risk is concentration. Bundled security may not match a dedicated endpoint platform, and a compromise of one product can affect both backup and security. Evaluate the security component on its own merits rather than treating it as a free extra.',
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
      bestFor: 'Larger organizations with a formal security program and budget to match',
      deployment: 'Cloud-native, or appliance-based for on-premises',
      body: [
        'Rubrik treats backup as a security control. Backups are immutable by design rather than by optional configuration, and the platform analyses backup data for encryption or mass deletion. That analysis helps identify which restore point is clean during ransomware recovery.',
        'The capability comes with enterprise pricing. This is not positioned as a small-business product, and the evaluation should involve the security team as well as IT.',
      ],
      pros: [
        'Immutable architecture rather than optional immutability',
        'Anomaly detection helps identify an uninfected recovery point',
        'Sensitive-data discovery supports compliance work',
        'Well-regarded for large-scale recovery orchestration',
      ],
      cons: [
        'Enterprise pricing puts it out of reach for most SMBs',
        'A substantial platform that requires an implementation project',
        'Too costly and complex unless ransomware recovery is a board-level concern',
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
        'For organizations already running backup software, the storage bill is often the dominant cost, and B2 undercuts S3 substantially while remaining S3-compatible and supporting object lock for immutability. Veeam, MSP360, Restic, Duplicati and most other clients integrate with it directly.',
        'The egress allowance matters because a large restore from a hyperscaler can cost more than a year of storage. B2 does not include a backup application or end-to-end recovery support, however. Your team selects the client, operates it and owns the restore process.',
      ],
      pros: [
        'Substantially cheaper than hyperscaler object storage',
        'Free egress up to 3× average monthly stored data',
        'Object Lock immutability supported',
        'S3-compatible, so most backup clients work with it',
      ],
      cons: [
        'Storage only; you still need to operate backup software',
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
      bestFor: 'SMBs who buy IT through an MSP and need fast local recovery',
      deployment: 'On-premises appliance with cloud replication',
      body: [
        'The hybrid appliance addresses a short RTO directly. A failed server can be virtualised on the local Datto device in minutes, while the cloud copy supplies the offsite disaster-recovery layer. This model can fit a business that cannot tolerate a day of downtime but cannot fund a six-figure enterprise platform.',
        'Datto is generally purchased through an MSP, so service quality depends heavily on that partner, and the local appliance still needs maintenance. Some customers have reported pricing and packaging changes since the Kaseya acquisition; raise both points during negotiation.',
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
      award: 'Best for a common SaaS coverage gap',
      summary:
        'A separate backup for Microsoft 365 or Google Workspace closes a common gap at a relatively low per-user cost.',
      price: 'Typically $3–$8 per user per month',
      bestFor: 'Every organization using Microsoft 365 or Google Workspace',
      deployment: 'SaaS, usually deployed in under an hour',
      body: [
        'Exchange Online, SharePoint, OneDrive and Teams data remains the customer’s responsibility under Microsoft’s shared responsibility model. Native retention protects against Microsoft losing data, but not every case of user deletion, attacker deletion or a sync client propagating encryption.',
        'Microsoft now offers first-party backup and it belongs on the shortlist. Some organizations prefer a third party because a backup in the same tenant and under the same identity provider shares part of the production failure domain. At a few dollars per user per month, either route can close a large gap for modest cost.',
      ],
      pros: [
        'Closes a genuine and widely underestimated gap',
        'Fast to deploy and inexpensive per user',
        'Item-level restore of mail, files, sites and Teams content',
        'Retains data beyond the license lifetime of departed staff',
      ],
      cons: [
        'Another vendor and another bill',
        'Teams backup coverage varies notably between products and needs testing',
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
        ['M365 backup', 'The SaaS gap', 'Varies by vendor', 'Microsoft 365 customers'],
      ],
      caption:
        'Indicative positioning based on vendor documentation as of August 2026. Verify current capabilities and pricing directly because this category changes quickly.',
    },

    { t: 'h2', x: 'Restore testing matters more than the shortlist' },
    {
      t: 'p',
      x: 'Test your restores. Quarterly, on a schedule, with someone other than the person who built the system doing it.',
    },
    {
      t: 'p',
      x: 'A backup job can report success while excluding a critical volume or writing to a repository nobody has proved readable. A restore drill finds that failure before an incident and answers three questions the dashboard cannot:',
    },
    {
      t: 'ol',
      items: [
        '**Does the data come back intact?** Do not stop at job status; open the restored database and run a consistency check.',
        '**How long does it take?** Measure the recovery and compare it with the committed RTO.',
        '**Can someone else do it?** If recovery depends on one person’s undocumented knowledge, you have a single point of failure that no amount of redundancy addresses.',
      ],
    },
    {
      t: 'note',
      kind: 'danger',
      title: 'Store recovery credentials outside the systems being recovered',
      x: 'If the backup console password sits in a password manager that authenticates through an encrypted Active Directory, the recovery team cannot log in. Keep tested offline copies of recovery credentials and runbooks so the recovery path does not depend on the failed system.',
    },

    { t: 'h2', x: 'A shortlist process that works' },
    {
      t: 'ol',
      items: [
        'Write down your RPO and RTO, and what an hour of downtime costs. Use those figures to assess the remaining choices.',
        'Inventory servers, endpoints, SaaS, databases and cloud workloads. SaaS is commonly missing from the first list.',
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
          a: 'Immutable backups cannot be modified or deleted until their retention period expires, including by an attacker, administrator or vendor. Because ransomware operators target backup infrastructure before encryption, immutability should be a core requirement.',
        },
        {
          q: 'How much should business cloud backup cost?',
          a: 'SaaS backup is typically $3–$8 per user per month. Server and workload backup varies enormously with data volume and retention. As a sanity check, most organizations land between 1% and 3% of their total IT budget. If a quote is far below that, check for excluded egress and restore charges.',
        },
        {
          q: 'How often should I test restores?',
          a: 'Quarterly at minimum, and after any significant infrastructure change. Test a full system restore at least annually, timed, with the results compared against your stated RTO. Have someone who did not build the system perform the drill.',
        },
        {
          q: 'Is cloud backup enough on its own, or do I need local backup too?',
          a: 'It depends on your RTO. Restoring several terabytes over a typical business internet connection takes many hours or days. If that is too slow, use a local copy for speed and a cloud copy for disaster recovery; this is the hybrid appliance model.',
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
