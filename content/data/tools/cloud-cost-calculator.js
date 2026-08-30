module.exports = {
  slug: 'cloud-cost-calculator',
  title: 'Cloud Cost Calculator for AWS, Azure and Google Cloud',
  h1: 'Cloud Cost Calculator',
  eyebrow: 'Infrastructure',
  description:
    'Compare estimated monthly AWS, Azure and Google Cloud costs for compute, storage, outbound transfer, managed databases and load balancing.',
  standfirst:
    'Describe a workload and compare its estimated monthly cost across three cloud providers, with optional one-year or three-year commitment discounts.',
  keywords: [
    'cloud cost calculator',
    'aws vs azure vs gcp pricing',
    'cloud pricing comparison',
    'aws monthly cost estimate',
    'cloud migration cost',
  ],
  published: '2026-02-18',
  updated: '2026-08-24',
  author: 'jackson',
  appCategory: 'BusinessApplication',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-tool-grid">
    <div>
      <h2 class="jp-tool-h">Compute</h2>
      <div class="jp-field">
        <label for="cc-instances">Instances</label>
        <input class="jp-input" type="number" id="cc-instances" value="3" min="0" max="10000" step="1" />
      </div>
      <div class="jp-field">
        <label for="cc-vcpu">vCPUs per instance</label>
        <input class="jp-input" type="number" id="cc-vcpu" value="4" min="1" max="256" step="1" />
      </div>
      <div class="jp-field">
        <label for="cc-ram">RAM per instance (GB)</label>
        <input class="jp-input" type="number" id="cc-ram" value="16" min="1" max="2048" step="1" />
      </div>
      <div class="jp-field">
        <label for="cc-hours">Runtime per instance (hours/month)</label>
        <input class="jp-input" type="number" id="cc-hours" value="730" min="1" max="744" step="1" />
        <span class="jp-hint">730 hours approximates continuous operation for one month.</span>
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">Storage &amp; transfer</h2>
      <div class="jp-field">
        <label for="cc-block">Block storage (GB)</label>
        <input class="jp-input" type="number" id="cc-block" value="500" min="0" step="10" />
      </div>
      <div class="jp-field">
        <label for="cc-object">Object storage (GB)</label>
        <input class="jp-input" type="number" id="cc-object" value="1000" min="0" step="50" />
      </div>
      <div class="jp-field">
        <label for="cc-egress">Outbound data transfer (GB/month)</label>
        <input class="jp-input" type="number" id="cc-egress" value="750" min="0" step="50" />
        <span class="jp-hint">This model excludes the first 100 GB for each provider.</span>
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">Managed services</h2>
      <div class="jp-field">
        <label for="cc-db-vcpu">Managed database vCPUs</label>
        <input class="jp-input" type="number" id="cc-db-vcpu" value="2" min="0" max="128" step="1" />
      </div>
      <div class="jp-field">
        <label for="cc-db-ram">Managed database RAM (GB)</label>
        <input class="jp-input" type="number" id="cc-db-ram" value="8" min="0" max="1024" step="1" />
      </div>
      <div class="jp-field">
        <label for="cc-lb">Load balancers</label>
        <input class="jp-input" type="number" id="cc-lb" value="1" min="0" max="100" step="1" />
      </div>
      <div class="jp-field">
        <label for="cc-commit">Commitment</label>
        <select class="jp-select" id="cc-commit">
          <option value="0">On-demand (no commitment)</option>
          <option value="1">1-year commitment</option>
          <option value="3">3-year commitment</option>
        </select>
        <span class="jp-hint">The model applies this discount only to compute and database instances.</span>
      </div>
    </div>
  </div>

  <div class="jp-results" id="cc-results" aria-live="polite"></div>

  <div class="jp-table-wrap" style="margin-top:1.5rem">
    <table class="jp-table" id="cc-breakdown">
      <thead>
        <tr><th scope="col">Line item</th><th scope="col">AWS</th><th scope="col">Azure</th><th scope="col">Google Cloud</th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <p class="jp-table-note">Estimated monthly cost in USD using the representative US-East list rates shown below.</p>
  </div>
</div>`,

    js: `
(function () {
  var HOURS = 730;
  var PROVIDERS = [
    { key: 'aws', name: 'AWS',
      vcpu: 0.0310, ram: 0.00420, block: 0.080, object: 0.0230, egress: 0.090,
      dbVcpu: 0.0580, dbRam: 0.00780, lb: 16.20, freeEgress: 100,
      commit: { 1: 0.32, 3: 0.52 } },
    { key: 'azure', name: 'Azure',
      vcpu: 0.0316, ram: 0.00410, block: 0.080, object: 0.0184, egress: 0.087,
      dbVcpu: 0.0555, dbRam: 0.00750, lb: 18.25, freeEgress: 100,
      commit: { 1: 0.30, 3: 0.50 } },
    { key: 'gcp', name: 'Google Cloud',
      vcpu: 0.0316, ram: 0.00424, block: 0.100, object: 0.0200, egress: 0.120,
      dbVcpu: 0.0590, dbRam: 0.00800, lb: 18.25, freeEgress: 100,
      commit: { 1: 0.37, 3: 0.55 } }
  ];

  var ids = ['cc-instances','cc-vcpu','cc-ram','cc-hours','cc-block','cc-object','cc-egress','cc-db-vcpu','cc-db-ram','cc-lb','cc-commit'];
  var results = document.getElementById('cc-results');
  var breakdown = document.querySelector('#cc-breakdown tbody');

  function num(id) {
    var el = document.getElementById(id);
    var v = parseFloat(el && el.value);
    return isFinite(v) && v >= 0 ? v : 0;
  }

  function money(v) {
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function estimate(p, input) {
    var discount = input.commit ? (p.commit[input.commit] || 0) : 0;
    var computeHours = input.instances * input.hours;
    var compute = computeHours * (input.vcpu * p.vcpu + input.ram * p.ram) * (1 - discount);
    var database = (input.dbVcpu * p.dbVcpu + input.dbRam * p.dbRam) * HOURS * (1 - discount);
    var block = input.block * p.block;
    var object = input.object * p.object;
    var egress = Math.max(0, input.egress - p.freeEgress) * p.egress;
    var lb = input.lb * p.lb;
    return {
      compute: compute, database: database, block: block, object: object,
      egress: egress, lb: lb,
      total: compute + database + block + object + egress + lb
    };
  }

  function render() {
    var input = {
      instances: num('cc-instances'), vcpu: num('cc-vcpu'), ram: num('cc-ram'),
      hours: Math.min(num('cc-hours'), 744), block: num('cc-block'), object: num('cc-object'),
      egress: num('cc-egress'), dbVcpu: num('cc-db-vcpu'), dbRam: num('cc-db-ram'),
      lb: num('cc-lb'), commit: num('cc-commit')
    };

    var rows = PROVIDERS.map(function (p) { return { p: p, e: estimate(p, input) }; });
    var cheapest = rows.reduce(function (a, b) { return a.e.total <= b.e.total ? a : b; });
    var dearest = rows.reduce(function (a, b) { return a.e.total >= b.e.total ? a : b; });
    var spread = dearest.e.total - cheapest.e.total;

    results.innerHTML = rows.map(function (r) {
      var best = r.p.key === cheapest.p.key;
      return '<div class="jp-stat' + (best ? ' jp-stat--primary' : '') + '">' +
        '<p class="jp-stat-label">' + r.p.name + (best ? ' (lowest estimate)' : '') + '</p>' +
        '<p class="jp-stat-value">' + money(r.e.total) + '</p>' +
        '<p class="jp-stat-sub">' + money(r.e.total * 12) + ' annualized</p>' +
      '</div>';
    }).join('') +
    '<div class="jp-stat"><p class="jp-stat-label">Difference between estimates</p><p class="jp-stat-value">' + money(spread) +
    '</p><p class="jp-stat-sub">' + (cheapest.e.total > 0 ? Math.round((spread / cheapest.e.total) * 100) : 0) +
    '% above the lowest estimate</p></div>';

    var lines = [
      ['Compute instances', 'compute'],
      ['Managed database', 'database'],
      ['Block storage', 'block'],
      ['Object storage', 'object'],
      ['Outbound transfer', 'egress'],
      ['Load balancing', 'lb']
    ];

    breakdown.innerHTML = lines.map(function (line) {
      return '<tr><th scope="row">' + line[0] + '</th>' + rows.map(function (r) {
        return '<td>' + money(r.e[line[1]]) + '</td>';
      }).join('') + '</tr>';
    }).join('') +
    '<tr><th scope="row"><strong>Monthly total</strong></th>' + rows.map(function (r) {
      return '<td><strong>' + money(r.e.total) + '</strong></td>';
    }).join('') + '</tr>';
  }

  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.addEventListener('input', render); el.addEventListener('change', render); }
  });
  render();
})();`,
  },

  blocks: [
    { t: 'h2', x: 'Reading the estimate' },
    {
      t: 'p',
      x: 'The compute rates used here are close to one another, while storage and outbound transfer rates vary more. A small difference between totals usually means compute dominates these inputs. For a larger difference, compare the **outbound transfer** and storage rows first.',
    },
    {
      t: 'p',
      x: 'As a rough planning check, an always-on application may spend 50–70% on compute, 10–20% on storage and 2–40% on outbound transfer, depending on its traffic. If this estimate differs substantially, review runtime hours and transfer volume before relying on it.',
    },

    { t: 'h2', x: 'Inputs with the largest effect' },
    {
      t: 'ol',
      items: [
        '**Runtime hours.** The model uses 730 hours for continuous monthly operation. If development or staging systems run only during working hours, enter their actual schedule rather than the production schedule.',
        '**RAM-to-vCPU ratio.** The listed memory rate is lower per unit than the vCPU rate. When a workload needs more memory but not more CPU, compare a memory-optimized instance family instead of increasing a general-purpose instance only to obtain RAM.',
        '**Outbound data transfer.** The model uses about $0.12/GB for Google Cloud, $0.09/GB for AWS and $0.087/GB for Azure after the first 100 GB. At 10 TB per month, those rates differ by more than $300. A CDN may change both volume and transfer pricing, so price it separately.',
        '**Commitment term.** The modeled one-year discounts are 30–37%, and the three-year discounts are 50–55%. Apply a commitment only to baseline capacity that you expect to keep using.',
      ],
    },

    {
      t: 'note',
      kind: 'tip',
      title: 'Check utilization before changing providers',
      x: 'Right-sizing an underused instance reduces the full compute line, while a provider change affects only the difference between rates. Review CPU, memory and runtime data before treating a cross-cloud price comparison as the main savings opportunity.',
    },

    { t: 'h2', x: 'Rates used by the calculator' },
    {
      t: 'p',
      x: 'The calculator uses representative list prices for general-purpose Linux compute in a US-East region. It expresses compute as per-vCPU-hour and per-GB-RAM-hour rates. Google Cloud publishes pricing in that form; the AWS and Azure figures approximate comparable instance families for planning.',
    },
    {
      t: 'table',
      head: ['Component', 'AWS', 'Azure', 'Google Cloud'],
      rows: [
        ['vCPU / hour', '$0.0310', '$0.0316', '$0.0316'],
        ['GB RAM / hour', '$0.00420', '$0.00410', '$0.00424'],
        ['Block storage / GB-month', '$0.080 (gp3)', '$0.080 (SSD)', '$0.100 (balanced PD)'],
        ['Object storage / GB-month', '$0.023 (S3 Standard)', '$0.0184 (Blob Hot)', '$0.020 (Standard)'],
        ['Egress / GB after 100 GB', '$0.090', '$0.087', '$0.120'],
        ['Load balancer / month', '~$16.20', '~$18.25', '~$18.25'],
      ],
      caption:
        'Representative US-East list rates. Cloud prices can change, so use these for planning rather than as vendor quotes.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'This is an estimate, not a quote',
      x: 'Actual bills can include request charges, provisioned IOPS, NAT gateways, snapshots, support, cross-zone traffic and regional adjustments that this model omits. Use the result for an initial comparison, then confirm the workload in each provider’s official pricing calculator before approving a budget.',
    },

    { t: 'h2', x: 'Costs this calculator does not include' },
    {
      t: 'ul',
      items: [
        '**Cross-availability-zone traffic:** approximately $0.01/GB in each direction on AWS. Traffic between services in different zones can add a separate transfer charge.',
        '**NAT gateways:** approximately $0.045/hour plus $0.045/GB processed on AWS. One continuously running gateway is about $33/month before data processing.',
        '**Provisioned IOPS and throughput:** gp3 volumes include a baseline, while capacity above it is billed separately.',
        '**Support plans:** AWS Business support is the greater of $100/month or approximately 10% of spend at lower volumes. A $2,000 bill would add about $200 at that rate.',
        '**Snapshots and backups:** these are commonly billed by stored volume, and longer retention increases the total.',
        '**Egress to other clouds or on-premises**, which is charged at standard internet rates unless you have a dedicated interconnect.',
      ],
    },

    { t: 'h2', x: 'A worked example' },
    {
      t: 'p',
      x: 'The default workload has three 4-vCPU, 16 GB instances running continuously, 500 GB of block storage, 1 TB of object storage, 750 GB of monthly outbound transfer, one managed 2-vCPU, 8 GB PostgreSQL instance and one load balancer. With the listed rates, its on-demand estimate is about **$680–730 per month**, depending on provider, and compute accounts for about 60%. The difference between the lowest and highest estimate is about 7%.',
    },
    {
      t: 'p',
      x: 'With a three-year commitment selected, the same modeled workload falls to about **$400 per month, a 42% reduction**. The discount applies to compute and the managed database, not storage, transfer or load balancing. Confirm that the baseline is stable and review the provider’s commitment terms before purchasing.',
    },

    { t: 'h2', x: 'Related tools and reading' },
    {
      t: 'cards',
      items: [
        {
          eyebrow: 'Tool',
          title: 'SaaS Seat Cost Calculator',
          desc: 'Project per-seat software costs as headcount changes and compare monthly with annual billing.',
          href: '/tools/saas-seat-cost-calculator/',
        },
        {
          eyebrow: 'Buying guide',
          title: 'Best Cloud Backup for Business',
          desc: 'Compare business backup vendors, including restore and outbound transfer costs.',
          href: '/reviews/best-cloud-backup-for-business/',
        },
        {
          eyebrow: 'Guide',
          title: 'Fixing Docker containers that exit immediately',
          desc: 'Check common reasons a container starts and then exits before producing useful logs.',
          href: '/guides/docker-container-exits-immediately/',
        },
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is AWS more expensive than Azure and Google Cloud?',
          a: 'Not necessarily. The representative general-purpose compute rates in this model are within about 2% of one another. Transfer, managed services, commitment terms, region and negotiated pricing can create larger differences than the virtual-machine rate.',
        },
        {
          q: 'Does this calculator include free tier credits?',
          a: 'It includes only the modeled 100 GB monthly outbound-transfer allowance. Signup credits and time-limited free tiers are excluded because they do not represent the ongoing cost after the promotion ends.',
        },
        {
          q: 'How accurate is the commitment discount?',
          a: 'It is a blended approximation. AWS Savings Plans, Azure Reservations and Google Cloud committed use discounts differ in coverage, payment timing and flexibility. Upfront terms can have larger discounts than no-upfront terms. Use the vendor calculator for an exact offer.',
        },
        {
          q: 'Should I run this workload on a cheaper VPS provider instead?',
          a: 'A VPS provider may quote lower raw compute and include more transfer for a predictable application. Compare the managed services, compliance certifications, support and regions you need before treating the compute price as equivalent.',
        },
        {
          q: 'Does my data leave the browser?',
          a: 'No. The calculation runs in client-side JavaScript, and this tool does not send the entered values to a server.',
        },
      ],
    },
  ],

  related: [
    '/tools/saas-seat-cost-calculator/',
    '/reviews/best-cloud-backup-for-business/',
    '/guides/docker-container-exits-immediately/',
  ],
};
