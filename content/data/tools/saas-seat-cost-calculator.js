module.exports = {
  slug: 'saas-seat-cost-calculator',
  title: 'SaaS Seat Cost Calculator — 3-Year Total Cost',
  h1: 'SaaS Seat Cost Calculator',
  eyebrow: 'Software budgeting',
  description:
    'Project per-seat software spend as your team grows, compare monthly against annual billing, and see the three-year total before you sign.',
  standfirst:
    'Per-seat pricing looks cheap at ten people and expensive at eighty. Model the growth, the annual-billing discount and the seats you are not using before you commit.',
  keywords: [
    'saas cost calculator',
    'per seat pricing calculator',
    'software license cost',
    'saas total cost of ownership',
    'software budget calculator',
  ],
  published: '2026-05-07',
  updated: '2026-08-25',
  author: 'alexander',
  appCategory: 'BusinessApplication',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-tool-grid">
    <div>
      <h2 class="jp-tool-h">Your team</h2>
      <div class="jp-field">
        <label for="ss-seats">Seats needed today</label>
        <input class="jp-input" type="number" id="ss-seats" value="24" min="1" max="100000" step="1" />
      </div>
      <div class="jp-field">
        <label for="ss-growth">Headcount growth (% per year)</label>
        <input class="jp-input" type="number" id="ss-growth" value="25" min="-50" max="300" step="1" />
      </div>
      <div class="jp-field">
        <label for="ss-years">Years to project</label>
        <input class="jp-input" type="number" id="ss-years" value="3" min="1" max="10" step="1" />
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">The contract</h2>
      <div class="jp-field">
        <label for="ss-price">Price per seat, per month ($)</label>
        <input class="jp-input" type="number" id="ss-price" value="18" min="0" step="1" />
      </div>
      <div class="jp-field">
        <label for="ss-discount">Annual billing discount (%)</label>
        <input class="jp-input" type="number" id="ss-discount" value="20" min="0" max="90" step="1" />
        <span class="jp-hint">Two months free is the usual offer — that is about 17%.</span>
      </div>
      <div class="jp-field">
        <label for="ss-uplift">Annual price uplift (%)</label>
        <input class="jp-input" type="number" id="ss-uplift" value="7" min="0" max="50" step="1" />
        <span class="jp-hint">Renewal increases. Cap this in the contract if you can.</span>
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">Reality adjustments</h2>
      <div class="jp-field">
        <label for="ss-unused">Seats provisioned but unused (%)</label>
        <input class="jp-input" type="number" id="ss-unused" value="15" min="0" max="80" step="1" />
        <span class="jp-hint">Leavers, contractors, over-buying at renewal.</span>
      </div>
      <div class="jp-field">
        <label for="ss-platform">Fixed platform fee ($/month)</label>
        <input class="jp-input" type="number" id="ss-platform" value="0" min="0" step="50" />
      </div>
      <div class="jp-field">
        <label for="ss-onboarding">One-off setup / migration ($)</label>
        <input class="jp-input" type="number" id="ss-onboarding" value="0" min="0" step="500" />
      </div>
    </div>
  </div>

  <div class="jp-results" id="ss-results" aria-live="polite"></div>

  <div class="jp-table-wrap" style="margin-top:1.5rem">
    <table class="jp-table" id="ss-schedule">
      <thead>
        <tr>
          <th scope="col">Year</th><th scope="col">Seats</th><th scope="col">Price/seat/mo</th>
          <th scope="col">Billed monthly</th><th scope="col">Billed annually</th><th scope="col">Saving</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <p class="jp-table-note">Growth compounds annually. Seats are rounded up — you cannot buy 24.3 licences.</p>
  </div>
</div>`,

    js: `
(function () {
  var ids = ['ss-seats','ss-growth','ss-years','ss-price','ss-discount','ss-uplift','ss-unused','ss-platform','ss-onboarding'];

  function num(id) {
    var v = parseFloat(document.getElementById(id).value);
    return isFinite(v) ? v : 0;
  }

  function money(v) {
    return '$' + Math.round(v).toLocaleString('en-US');
  }

  function render() {
    var seats = Math.max(1, num('ss-seats'));
    var growth = num('ss-growth') / 100;
    var years = Math.max(1, Math.min(10, Math.round(num('ss-years'))));
    var price = num('ss-price');
    var discount = Math.min(90, num('ss-discount')) / 100;
    var uplift = num('ss-uplift') / 100;
    var unused = Math.min(80, num('ss-unused')) / 100;
    var platform = num('ss-platform');
    var onboarding = num('ss-onboarding');

    var rows = [];
    var totalMonthly = 0, totalAnnual = 0, wasted = 0;

    for (var y = 0; y < years; y++) {
      var yearSeats = Math.ceil(seats * Math.pow(1 + growth, y));
      var yearPrice = price * Math.pow(1 + uplift, y);
      var monthlyBilled = yearSeats * yearPrice * 12 + platform * 12;
      var annualBilled = yearSeats * yearPrice * (1 - discount) * 12 + platform * 12;

      totalMonthly += monthlyBilled;
      totalAnnual += annualBilled;
      wasted += yearSeats * unused * yearPrice * (1 - discount) * 12;

      rows.push({ year: y + 1, seats: yearSeats, price: yearPrice, monthly: monthlyBilled, annual: annualBilled });
    }

    totalMonthly += onboarding;
    totalAnnual += onboarding;

    var finalSeats = rows[rows.length - 1].seats;
    var perEmployee = finalSeats ? totalAnnual / years / finalSeats : 0;

    document.getElementById('ss-results').innerHTML =
      '<div class="jp-stat jp-stat--primary"><p class="jp-stat-label">' + years + '-year total (annual billing)</p>' +
        '<p class="jp-stat-value">' + money(totalAnnual) + '</p>' +
        '<p class="jp-stat-sub">' + money(totalAnnual / years) + ' per year on average</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Same, billed monthly</p>' +
        '<p class="jp-stat-value">' + money(totalMonthly) + '</p>' +
        '<p class="jp-stat-sub">' + money(totalMonthly - totalAnnual) + ' more</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Cost per employee / year</p>' +
        '<p class="jp-stat-value">' + money(perEmployee) + '</p>' +
        '<p class="jp-stat-sub">at ' + finalSeats + ' seats</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Spent on unused seats</p>' +
        '<p class="jp-stat-value">' + money(wasted) + '</p>' +
        '<p class="jp-stat-sub">' + (totalAnnual ? Math.round(wasted / totalAnnual * 100) : 0) + '% of the contract</p></div>';

    document.querySelector('#ss-schedule tbody').innerHTML = rows.map(function (r) {
      return '<tr><th scope="row">Year ' + r.year + '</th><td>' + r.seats + '</td><td>$' + r.price.toFixed(2) +
        '</td><td>' + money(r.monthly) + '</td><td>' + money(r.annual) + '</td><td>' +
        money(r.monthly - r.annual) + '</td></tr>';
    }).join('') +
    '<tr><th scope="row"><strong>Total</strong></th><td>—</td><td>—</td><td><strong>' + money(totalMonthly) +
      '</strong></td><td><strong>' + money(totalAnnual) + '</strong></td><td><strong>' +
      money(totalMonthly - totalAnnual) + '</strong></td></tr>';
  }

  ids.forEach(function (id) { document.getElementById(id).addEventListener('input', render); });
  render();
})();`,
  },

  blocks: [
    {
      t: 'takeaways',
      items: [
        'Per-seat pricing compounds with headcount. A tool at $18/seat is a rounding error at 10 people and a real budget line at 100.',
        'The annual-billing discount is usually worth taking, but it converts a monthly problem into a twelve-month commitment — price the flexibility you are giving up.',
        'Unused seats are the largest single source of waste in most software budgets. Offboarding that does not reclaim licences quietly costs thousands.',
        'Model the renewal uplift. A 7% annual increase compounds to roughly 22% more by year four.',
      ],
    },

    { t: 'h2', x: 'Why per-seat pricing surprises people' },
    {
      t: 'p',
      x: 'Software is bought when a team is small, when the per-seat figure feels trivial next to the problem it solves. The commitment is then evaluated once, and never re-evaluated as headcount doubles.',
    },
    {
      t: 'p',
      x: 'Run the default inputs above — 24 seats at $18, growing 25% a year with a 7% annual uplift — and the three-year total lands near $200,000 against a starting run-rate of about $4,150 a month. The cost did not change; the multiplier did. Now repeat that across the fifteen or twenty tools a growing company accumulates and the picture gets uncomfortable.',
    },

    { t: 'h2', x: 'The four numbers vendors would rather you did not model' },

    { t: 'h3', x: '1. The renewal uplift' },
    {
      t: 'p',
      x: 'Most contracts permit an annual increase, and many default to somewhere between 5% and 10%. It rarely appears in the first-year quote. At 7%, a $100,000 contract is $122,500 by year four before adding a single seat.',
    },
    {
      t: 'p',
      x: '**Negotiate a cap.** A clause fixing increases at, say, CPI or 3% — whichever is lower — is one of the highest-value things you can ask for, and vendors concede it far more readily than a discount on year one.',
    },

    { t: 'h3', x: '2. Unused seats' },
    {
      t: 'p',
      x: 'Seat counts ratchet up and almost never down. People leave, contracts end, a project winds up — and the licence stays provisioned because nobody owns reclaiming it. Fifteen percent is a conservative default; audits routinely find 25–30%.',
    },
    {
      t: 'p',
      x: 'The fix is process, not procurement: put licence reclamation in the offboarding checklist, run a quarterly review of last-login data, and make one named person accountable for each contract.',
    },

    { t: 'h3', x: '3. The tier cliff' },
    {
      t: 'p',
      x: 'The feature you need — SSO, audit logs, SCIM provisioning, role-based permissions — is frequently gated behind an enterprise tier at three or four times the per-seat price. Discovering at 60 people that mandatory SSO triples your bill is a genuinely common and entirely avoidable surprise.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Ask the tier question before you buy, not at renewal',
      x: 'Get a written quote for the tier you will need at your projected headcount, not the one you need today. If SSO is on the enterprise plan, model the enterprise price from year one — you will be paying it eventually, and you will have far less leverage once your data is already inside.',
    },

    { t: 'h3', x: '4. Switching costs' },
    {
      t: 'p',
      x: 'The exit price is never on the pricing page. Before signing, get answers to three questions in writing: can we export our full data in a documented format, do we retain access during a notice period, and what does the vendor charge for migration assistance? A tool you cannot leave has no price ceiling at renewal.',
    },

    { t: 'h2', x: 'Monthly or annual billing?' },
    {
      t: 'table',
      head: ['', 'Monthly', 'Annual'],
      rows: [
        ['Typical cost', 'List price', '15–20% less'],
        ['Commitment', 'Cancel any month', 'Locked for 12 months'],
        ['Seat reductions', 'Adjust next cycle', 'Usually only at renewal'],
        ['Cash flow', 'Smooth', 'Large single payment'],
        ['Best when', 'Evaluating, or headcount is volatile', 'The tool is proven and headcount is stable or growing'],
      ],
    },
    {
      t: 'p',
      x: 'The discount is real money and usually worth taking for established tools. The judgement call is what you are buying it with: an annual contract removes your ability to shrink. If there is a realistic chance the team contracts, or that the tool does not survive its first quarter of real use, the monthly premium is cheap insurance.',
    },
    {
      t: 'p',
      x: 'One asymmetry worth knowing: most vendors let you **add** seats mid-term at a pro-rated rate, but not remove them. So an annual commitment sets a floor on your spend, never a ceiling.',
    },

    { t: 'h2', x: 'Questions to ask before signing' },
    {
      t: 'ol',
      items: [
        'What is the maximum annual increase permitted at renewal, and will you cap it in writing?',
        'Can seat counts be reduced at renewal, and what notice period applies? (Auto-renewal windows as short as 30 days are common — diarise them.)',
        'Which features are gated behind higher tiers, and what is the per-seat price at each?',
        'Are there read-only, guest or viewer seats at a lower rate? Many teams pay full price for people who only ever look.',
        'What happens to our data at termination — export format, retention period, and any fee?',
        'Is there a minimum seat commitment, and does it float upward if we exceed it mid-term?',
      ],
    },

    {
      t: 'note',
      kind: 'info',
      title: 'What this calculator does not model',
      x: 'Volume-tier price breaks, multi-year prepayment discounts, usage-based components (storage, API calls, build minutes), sales tax or VAT, and currency movement on non-USD contracts. It models the seat-driven core of the bill, which is the part that compounds.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is a reasonable software spend per employee?',
          a: 'It varies enormously by function. Engineering-heavy teams commonly run $2,000–$5,000 per person per year across their full stack; a sales organisation with CRM and enablement tooling can exceed that substantially. The number matters less than the trend — if per-employee spend is rising while headcount rises, tools are being added faster than they are being retired.',
        },
        {
          q: 'Is the annual discount always worth taking?',
          a: 'For a tool you have used for a year and know you will keep, yes — 15–20% is a large, certain saving. For anything in its first six months, or where headcount might fall, pay monthly. The premium buys you an exit, and exits are worth more than they look on a spreadsheet.',
        },
        {
          q: 'How do I find unused seats?',
          a: 'Most admin consoles expose a last-active or last-login column; anything dormant for 60 days is a candidate. If you have an identity provider such as Okta or Entra ID, its application usage reports cover every connected tool at once and are considerably faster than auditing each vendor separately.',
        },
        {
          q: 'Can I negotiate on a small contract?',
          a: 'More than most people assume. Below roughly $10,000 a year you are usually on self-serve pricing with little room. Above that a salesperson is involved, and quarter-end and year-end are genuinely better times to ask. Multi-year terms, case-study participation and prepayment all buy discount.',
        },
        {
          q: 'Are my figures stored anywhere?',
          a: 'No. Everything is calculated in your browser and nothing is transmitted. You can model a real contract without it leaving your machine.',
        },
      ],
    },
  ],

  related: [
    '/tools/cloud-cost-calculator/',
    '/reviews/best-crm-for-small-business/',
    '/reviews/best-payroll-software-small-business/',
  ],
};
