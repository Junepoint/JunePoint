module.exports = {
  slug: 'cloud-cost-calculator',
  title: 'Cloud Cost Calculator: AWS vs Azure vs GCP (Free)',
  h1: 'Cloud Cost Calculator',
  eyebrow: 'Infrastructure',
  description:
    'Estimate and compare monthly AWS, Azure and Google Cloud bills for compute, storage, egress and managed databases. Free, instant, runs in your browser.',
  standfirst:
    'Enter the shape of your workload and get a side-by-side monthly estimate for AWS, Azure and Google Cloud — including what a one- or three-year commitment would save you.',
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
        <label for="cc-hours">Hours running per month</label>
        <input class="jp-input" type="number" id="cc-hours" value="730" min="1" max="744" step="1" />
        <span class="jp-hint">730 = always on. Halve it if you shut down non-production at night.</span>
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
        <span class="jp-hint">The line item that surprises people. First 100 GB is free on all three.</span>
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
        <span class="jp-hint">Discount applies to compute and database instances only.</span>
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
    <p class="jp-table-note">Monthly estimate in USD, based on representative US-East list prices. See the methodology below.</p>
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
        '<p class="jp-stat-label">' + r.p.name + (best ? ' — lowest' : '') + '</p>' +
        '<p class="jp-stat-value">' + money(r.e.total) + '</p>' +
        '<p class="jp-stat-sub">' + money(r.e.total * 12) + ' per year</p>' +
      '</div>';
    }).join('') +
    '<div class="jp-stat"><p class="jp-stat-label">Spread</p><p class="jp-stat-value">' + money(spread) +
    '</p><p class="jp-stat-sub">' + (cheapest.e.total > 0 ? Math.round((spread / cheapest.e.total) * 100) : 0) +
    '% between cheapest and dearest</p></div>';

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
    { t: 'h2', x: 'How to read the estimate' },
    {
      t: 'p',
      x: 'The three major clouds price the same workload within a few percent of each other on compute, and then diverge sharply everywhere else. If your spread looks small, your workload is compute-dominated. If it looks large, look at the **outbound transfer** row — that single line item is usually the reason one provider is hundreds of dollars more expensive per month.',
    },
    {
      t: 'p',
      x: 'A useful sanity check: compute should be roughly 50–70% of a typical always-on application bill, storage 10–20%, and egress anywhere from 2% to 40% depending on whether you are serving media. If your calculated split is wildly different from that, the input that is off is usually hours-per-month or egress.',
    },

    { t: 'h2', x: 'The four inputs that actually move the number' },
    {
      t: 'ol',
      items: [
        '**Hours running per month.** 730 hours means always on. Development, staging and CI environments almost never need to be. Shutting non-production down outside working hours takes the multiplier from 730 to roughly 200 — a 73% cut on that slice of your bill for a scheduled stop/start job you write once.',
        '**RAM-to-vCPU ratio.** Memory is cheap relative to vCPU (roughly 1:7 per unit on all three providers). Over-provisioning CPU to get memory is one of the most common and most expensive mistakes in a lift-and-shift migration. Pick a memory-optimised instance family instead of scaling a general-purpose one.',
        '**Outbound data transfer.** Google Cloud lists roughly $0.12/GB, AWS around $0.09/GB, Azure around $0.087/GB after the first 100 GB. At 10 TB per month that is a $300+/month difference for identical traffic. Putting a CDN in front of anything user-facing changes this line item more than any instance decision will.',
        '**Commitment term.** One-year commitments run about 30–37% off compute; three-year terms reach 50–55%. The discount only applies to steady-state baseline capacity, so commit to your floor, not your peak.',
      ],
    },

    {
      t: 'note',
      kind: 'tip',
      title: 'The cheapest lever is not the provider',
      x: 'Before you migrate anything to save 8%, right-size what you already run. Most fleets we look at have instances sitting under 15% average CPU. Halving instance size across a 20-instance fleet beats any cross-cloud price difference in this calculator, and takes an afternoon rather than a quarter.',
    },

    { t: 'h2', x: 'Where these prices come from' },
    {
      t: 'p',
      x: 'The calculator uses representative published list prices for general-purpose Linux instances in a US-East region, decomposed into a per-vCPU-hour and per-GB-RAM-hour rate. That decomposition is how Google Cloud publishes its pricing directly, and it approximates AWS and Azure instance families closely enough for planning work.',
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
        'Representative US-East list rates. Cloud pricing changes without notice — treat these as planning figures, not quotes.',
    },
    {
      t: 'note',
      kind: 'warn',
      title: 'This is an estimate, not a quote',
      x: 'Real bills include per-request charges, IOPS provisioning, NAT gateway hours, snapshot storage, support plans, cross-AZ traffic and region multipliers that this tool deliberately leaves out to stay usable. Use it to compare shapes and to sanity-check a proposal. Confirm the final number with each vendor’s official pricing calculator before you commit budget.',
    },

    { t: 'h2', x: 'Costs this calculator does not include' },
    {
      t: 'ul',
      items: [
        '**Cross-availability-zone traffic** — roughly $0.01/GB each way on AWS. Chatty microservices spread across AZs can generate a surprisingly large line item that never appears in a napkin estimate.',
        '**NAT gateway** — around $0.045/hour plus $0.045/GB processed on AWS. A single always-on NAT gateway is about $33/month before any data flows through it.',
        '**Provisioned IOPS and throughput** — gp3 volumes include a baseline; anything above it is billed separately.',
        '**Support plans** — AWS Business support is the greater of $100/month or roughly 10% of spend at low volumes. On a $2,000 bill that is another $200.',
        '**Snapshots and backups** — usually billed at object-storage rates, but retention policies compound them quickly.',
        '**Egress to other clouds or on-premises**, which is charged at standard internet rates unless you have a dedicated interconnect.',
      ],
    },

    { t: 'h2', x: 'A worked example' },
    {
      t: 'p',
      x: 'Take a typical production web application: three 4-vCPU / 16 GB instances running around the clock, 500 GB of block storage, 1 TB of object storage, 750 GB of monthly egress, one managed 2-vCPU / 8 GB Postgres instance and a load balancer. Those are the calculator’s default inputs, and they land at roughly **$680–730 per month** on-demand depending on provider — with compute alone making up about 60% of it. The spread between cheapest and dearest is only about 7%, which is the point: on a compute-heavy workload the provider choice barely moves the bill.',
    },
    {
      t: 'p',
      x: 'Now switch the commitment dropdown to three years. The same workload drops to roughly **$400 per month — a 42% cut** — because the discount lands on compute and the database, which is where the money already was. That is the single largest legitimate saving available to a stable workload, and it requires no architectural change at all. If your baseline is genuinely steady, not committing is leaving money on the table.',
    },

    { t: 'h2', x: 'Related tools and reading' },
    {
      t: 'cards',
      items: [
        {
          eyebrow: 'Tool',
          title: 'SaaS Seat Cost Calculator',
          desc: 'Model per-seat software spend across a growing team and compare annual vs monthly billing.',
          href: '/tools/saas-seat-cost-calculator/',
        },
        {
          eyebrow: 'Buying guide',
          title: 'Best Cloud Backup for Business',
          desc: 'What actually matters when comparing business backup vendors, including the egress traps.',
          href: '/reviews/best-cloud-backup-for-business/',
        },
        {
          eyebrow: 'Guide',
          title: 'Fixing Docker containers that exit immediately',
          desc: 'The five causes behind a container that starts and stops before you can read the logs.',
          href: '/guides/docker-container-exits-immediately/',
        },
      ],
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is AWS actually more expensive than Azure and Google Cloud?',
          a: 'Not meaningfully, on compute. List prices for equivalent general-purpose instances sit within about 2% of each other across all three. Real cost differences come from data transfer rates, managed-service pricing, committed-use discount structures and the negotiated enterprise agreement you can get — not from the sticker price of a virtual machine.',
        },
        {
          q: 'Does this calculator include free tier credits?',
          a: 'Only the 100 GB of free monthly egress that all three providers offer, since that materially changes small workloads. Signup credits and 12-month free tiers are excluded because they expire, and planning a budget around them produces a nasty surprise in month 13.',
        },
        {
          q: 'How accurate is the commitment discount?',
          a: 'It is a blended approximation. AWS Savings Plans, Azure Reserved Instances and Google committed use discounts each have different coverage rules, payment options and flexibility. All-upfront three-year terms reach the top of the range; monthly no-upfront terms sit near the bottom. Expect the real figure to land within a few points of the estimate.',
        },
        {
          q: 'Should I run this workload on a cheaper VPS provider instead?',
          a: 'For a single application with predictable traffic, providers like Hetzner, DigitalOcean or OVH are often several times cheaper for raw compute and include far more generous transfer allowances. What you give up is the managed-service catalogue, the compliance certifications and the regional footprint. If you are not using those, you are paying for them anyway.',
        },
        {
          q: 'Does my data leave the browser?',
          a: 'No. Every calculation here runs in JavaScript on your own device. Nothing you type is transmitted to JunePoint or anyone else, and there is no server to send it to.',
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
