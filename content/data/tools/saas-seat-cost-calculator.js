module.exports = {
  slug: 'saas-seat-cost-calculator',
  title: 'SaaS Seat Cost Calculator for Multi-Year Contracts',
  h1: 'SaaS Seat Cost Calculator',
  eyebrow: 'Software budgeting',
  description:
    'Project per-seat software costs as headcount and prices change, then compare monthly and annual billing over one to ten years.',
  standfirst:
    'Enter seat growth, renewal increases, unused licenses, platform fees and setup costs to estimate the full contract period.',
  keywords: [
    'saas cost calculator',
    'per seat pricing calculator',
    'software license cost',
    'saas total cost of ownership',
    'software budget calculator',
  ],
  published: '2026-05-07',
  updated: '2026-08-25',
  author: 'jackson',
  appCategory: 'BusinessApplication',

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-tool-grid">
    <div>
      <h2 class="jp-tool-h">Team size</h2>
      <div class="jp-field">
        <label for="ss-seats">Seats needed now</label>
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
      <h2 class="jp-tool-h">Contract pricing</h2>
      <div class="jp-field">
        <label for="ss-price">Monthly price per seat ($)</label>
        <input class="jp-input" type="number" id="ss-price" value="18" min="0" step="1" />
      </div>
      <div class="jp-field">
        <label for="ss-discount">Annual billing discount (%)</label>
        <input class="jp-input" type="number" id="ss-discount" value="20" min="0" max="90" step="1" />
        <span class="jp-hint">Two free months are equivalent to a discount of about 17%.</span>
      </div>
      <div class="jp-field">
        <label for="ss-uplift">Annual price uplift (%)</label>
        <input class="jp-input" type="number" id="ss-uplift" value="7" min="0" max="50" step="1" />
        <span class="jp-hint">Enter the price increase expected at each annual renewal.</span>
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">Additional costs</h2>
      <div class="jp-field">
        <label for="ss-unused">Provisioned seats left unused (%)</label>
        <input class="jp-input" type="number" id="ss-unused" value="15" min="0" max="80" step="1" />
        <span class="jp-hint">Include licenses retained after departures or purchased above current need.</span>
      </div>
      <div class="jp-field">
        <label for="ss-platform">Fixed platform fee ($/month)</label>
        <input class="jp-input" type="number" id="ss-platform" value="0" min="0" step="50" />
      </div>
      <div class="jp-field">
        <label for="ss-onboarding">One-time setup or migration ($)</label>
        <input class="jp-input" type="number" id="ss-onboarding" value="0" min="0" step="500" />
      </div>
    </div>
  </div>

  <div class="jp-results" id="ss-results" aria-live="polite"></div>

  <div class="jp-table-wrap" style="margin-top:1.5rem">
    <table class="jp-table" id="ss-schedule">
      <thead>
        <tr>
          <th scope="col">Year</th><th scope="col">Seats</th><th scope="col">Monthly price per seat</th>
          <th scope="col">Monthly plan total</th><th scope="col">Annual plan total</th><th scope="col">Difference</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <p class="jp-table-note">Growth compounds once per year, and each annual seat count is rounded up to a whole license.</p>
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
      '<div class="jp-stat jp-stat--primary"><p class="jp-stat-label">' + years + '-year total with annual billing</p>' +
        '<p class="jp-stat-value">' + money(totalAnnual) + '</p>' +
        '<p class="jp-stat-sub">Average of ' + money(totalAnnual / years) + ' per year</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Total with monthly billing</p>' +
        '<p class="jp-stat-value">' + money(totalMonthly) + '</p>' +
        '<p class="jp-stat-sub">' + money(totalMonthly - totalAnnual) + ' more</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Average cost per employee per year</p>' +
        '<p class="jp-stat-value">' + money(perEmployee) + '</p>' +
        '<p class="jp-stat-sub">Using the final count of ' + finalSeats + ' seats</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Estimated unused-seat cost</p>' +
        '<p class="jp-stat-value">' + money(wasted) + '</p>' +
        '<p class="jp-stat-sub">' + (totalAnnual ? Math.round(wasted / totalAnnual * 100) : 0) + '% of the contract</p></div>';

    document.querySelector('#ss-schedule tbody').innerHTML = rows.map(function (r) {
      return '<tr><th scope="row">Year ' + r.year + '</th><td>' + r.seats + '</td><td>$' + r.price.toFixed(2) +
        '</td><td>' + money(r.monthly) + '</td><td>' + money(r.annual) + '</td><td>' +
        money(r.monthly - r.annual) + '</td></tr>';
    }).join('') +
    '<tr><th scope="row"><strong>Total</strong></th><td>-</td><td>-</td><td><strong>' + money(totalMonthly) +
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
        'Per-seat cost rises with both headcount and the seat price, so model both changes over the full contract period.',
        'Annual billing may reduce the price, but it also limits when you can reduce seat count or leave the product.',
        'Unused provisioned seats still incur the full seat price. Include a realistic unused-seat percentage in the estimate.',
        'A 7% annual price increase makes the fourth-year seat price about 22.5% higher than the first-year price.',
      ],
    },

    { t: 'h2', x: 'How per-seat costs grow' },
    {
      t: 'p',
      x: 'A per-seat quote describes the current team, not the later contract cost. Headcount growth, annual price increases and unused licenses can all increase spend even when the product and plan stay the same.',
    },
    {
      t: 'p',
      x: 'With the default inputs of 24 seats at $18 per month, 25% annual headcount growth, a 7% annual price increase and a 20% annual-billing discount, the three-year annual-plan total is about **$17,212**. The first year costs about $4,147 and the third about $7,518 because both seat count and unit price increase.',
    },

    { t: 'h2', x: 'Four contract costs to include' },

    { t: 'h3', x: '1. The renewal uplift' },
    {
      t: 'p',
      x: 'Check whether the contract permits an annual price increase and whether the first-year quote shows it. At 7% annual growth, a $100,000 first-year price becomes about $122,500 in year four before any seats are added.',
    },
    {
      t: 'p',
      x: '**Ask for a written cap.** For example, a contract could limit annual increases to the lower of CPI or 3%. Compare that protection with a first-year discount when reviewing the full term.',
    },

    { t: 'h3', x: '2. Unused seats' },
    {
      t: 'p',
      x: 'A license can remain assigned after an employee leaves, a contractor finishes or a project closes. Use your own last-login and identity data to set the unused-seat percentage rather than treating the default as a benchmark.',
    },
    {
      t: 'p',
      x: 'Add license reclamation to offboarding, review last-login data on a schedule and assign an owner for each contract. Those steps keep the provisioned count closer to actual use.',
    },

    { t: 'h3', x: '3. The tier cliff' },
    {
      t: 'p',
      x: 'Features such as SSO, audit logs, SCIM provisioning and role-based permissions may require a higher tier. Price the tier that includes your security and administration requirements, not only the entry plan.',
    },
    {
      t: 'note',
      kind: 'tip',
      title: 'Ask the tier question before you buy, not at renewal',
      x: 'Request a written quote for the tier expected at the projected headcount. If a required feature such as SSO is available only on an enterprise plan, include that plan in the forecast before signing.',
    },

    { t: 'h3', x: '4. Switching costs' },
    {
      t: 'p',
      x: 'Before signing, document whether all data can be exported in a usable format, whether access continues through the notice period and whether migration help costs extra. These terms affect the practical cost of switching at renewal.',
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
      x: 'Annual billing reduces the modeled seat charge but may prevent reductions until renewal. Monthly billing costs more under these inputs but allows earlier changes. Compare the discount with the likelihood of lower headcount or replacing the tool.',
    },
    {
      t: 'p',
      x: 'Check the contract for asymmetric seat terms. Some agreements allow prorated additions during the term but defer reductions until renewal, which sets a minimum spend without setting a maximum.',
    },

    { t: 'h2', x: 'Questions to ask before signing' },
    {
      t: 'ol',
      items: [
        'What is the maximum annual increase permitted at renewal, and will you cap it in writing?',
        'Can seat counts be reduced at renewal, and what notice period applies? Record the auto-renewal deadline.',
        'Which features are gated behind higher tiers, and what is the per-seat price at each?',
        'Are read-only, guest or viewer seats available at a lower rate?',
        'What happens to our data at termination, including export format, retention period and fees?',
        'Is there a minimum seat commitment, and does it float upward if we exceed it mid-term?',
      ],
    },

    {
      t: 'note',
      kind: 'info',
      title: 'What this calculator does not model',
      x: 'The estimate excludes volume-tier pricing, multi-year prepayment discounts, usage charges such as storage or API calls, sales tax, VAT and exchange-rate changes on non-USD contracts. It models seat charges, platform fees and one-time setup costs.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'What is a reasonable software spend per employee?',
          a: 'There is no universal benchmark because roles need different software. Calculate your current per-employee cost by function, then track whether it rises faster than headcount and whether added tools replace existing ones.',
        },
        {
          q: 'Is the annual discount always worth taking?',
          a: 'No. An annual discount saves money only if you keep enough seats for the full term. Monthly billing may cost less overall when headcount could fall or the product is still being evaluated.',
        },
        {
          q: 'How do I find unused seats?',
          a: 'Review last-active data in the product admin console and application sign-in data from an identity provider such as Okta or Entra ID. Confirm with the account owner before removing access, since infrequent use may still be required.',
        },
        {
          q: 'Can I negotiate on a small contract?',
          a: 'Ask the vendor which terms are negotiable. Possible tradeoffs include a longer term, prepayment, a larger seat commitment or reference participation, but each adds an obligation that should be priced with the discount.',
        },
        {
          q: 'Are my figures stored anywhere?',
          a: 'No. The calculation runs in client-side JavaScript, and this tool does not send or store the values you enter.',
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
