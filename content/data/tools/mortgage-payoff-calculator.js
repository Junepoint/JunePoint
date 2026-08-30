module.exports = {
  slug: 'mortgage-payoff-calculator',
  title: 'Mortgage Payoff Calculator: Extra Payment Savings',
  h1: 'Mortgage Payoff Calculator',
  eyebrow: 'Personal finance',
  description:
    'Estimate how extra monthly, annual or lump-sum principal payments change mortgage interest and payoff time.',
  standfirst:
    'Enter your remaining balance, rate and term, then compare the original schedule with monthly, annual or one-time extra payments.',
  keywords: [
    'mortgage payoff calculator',
    'extra mortgage payment calculator',
    'pay off mortgage early',
    'mortgage amortization calculator',
    'biweekly mortgage payment',
  ],
  published: '2026-02-26',
  updated: '2026-08-22',
  author: 'jackson',
  appCategory: 'FinanceApplication',
  featured: true,

  tool: {
    html: `
<div class="jp-tool">
  <div class="jp-tool-grid">
    <div>
      <h2 class="jp-tool-h">Loan details</h2>
      <div class="jp-field">
        <label for="mp-balance">Remaining balance ($)</label>
        <input class="jp-input" type="number" id="mp-balance" value="320000" min="0" step="1000" />
      </div>
      <div class="jp-field">
        <label for="mp-rate">Interest rate (% APR)</label>
        <input class="jp-input" type="number" id="mp-rate" value="6.5" min="0" max="30" step="0.01" />
      </div>
      <div class="jp-field">
        <label for="mp-years">Years remaining</label>
        <input class="jp-input" type="number" id="mp-years" value="28" min="1" max="50" step="1" />
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">Extra payments</h2>
      <div class="jp-field">
        <label for="mp-extra">Extra per month ($)</label>
        <input class="jp-input" type="number" id="mp-extra" value="300" min="0" step="25" />
      </div>
      <div class="jp-field">
        <label for="mp-annual">Extra annual payment ($)</label>
        <input class="jp-input" type="number" id="mp-annual" value="0" min="0" step="100" />
        <span class="jp-hint">Applied after every 12 monthly payments.</span>
      </div>
      <div class="jp-field">
        <label for="mp-lump">One-time payment today ($)</label>
        <input class="jp-input" type="number" id="mp-lump" value="0" min="0" step="1000" />
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">Estimated result</h2>
      <div class="jp-stat jp-stat--primary" style="margin-bottom:.75rem">
        <p class="jp-stat-label">Interest saved</p>
        <p class="jp-stat-value" id="mp-saved">$0</p>
        <p class="jp-stat-sub" id="mp-saved-sub">&nbsp;</p>
      </div>
      <div class="jp-stat">
        <p class="jp-stat-label">Time removed from term</p>
        <p class="jp-stat-value" id="mp-sooner">0</p>
        <p class="jp-stat-sub" id="mp-payoff-date">&nbsp;</p>
      </div>
    </div>
  </div>

  <div class="jp-results" id="mp-results" aria-live="polite"></div>

  <div class="jp-table-wrap" style="margin-top:1.5rem">
    <table class="jp-table" id="mp-compare">
      <thead>
        <tr><th scope="col">&nbsp;</th><th scope="col">Minimum payment only</th><th scope="col">With extra payments</th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <p class="jp-table-note">Includes principal and interest only. Property tax, insurance and HOA dues are excluded.</p>
  </div>
</div>`,

    js: `
(function () {
  var ids = ['mp-balance','mp-rate','mp-years','mp-extra','mp-annual','mp-lump'];
  var MAX_MONTHS = 720;

  function num(id) {
    var el = document.getElementById(id);
    var v = parseFloat(el && el.value);
    return isFinite(v) && v > 0 ? v : 0;
  }

  function money(v) {
    return '$' + Math.round(v).toLocaleString('en-US');
  }

  function monthlyPayment(principal, monthlyRate, months) {
    if (principal <= 0 || months <= 0) return 0;
    if (monthlyRate === 0) return principal / months;
    var factor = Math.pow(1 + monthlyRate, months);
    return principal * monthlyRate * factor / (factor - 1);
  }

  function amortize(principal, monthlyRate, payment, extraMonthly, extraAnnual, lump) {
    var balance = Math.max(0, principal - lump);
    var interest = 0;
    var months = 0;

    while (balance > 0.005 && months < MAX_MONTHS) {
      var accrued = balance * monthlyRate;
      var due = payment + extraMonthly + ((months + 1) % 12 === 0 ? extraAnnual : 0);

      // A payment that never covers the interest can't amortize the loan.
      if (due <= accrued && monthlyRate > 0) return { months: Infinity, interest: Infinity, stalled: true };

      var principalPaid = Math.min(due - accrued, balance);
      interest += accrued;
      balance -= principalPaid;
      months++;
    }
    return { months: months, interest: interest, stalled: false };
  }

  function term(months) {
    if (!isFinite(months)) return 'No payoff';
    var y = Math.floor(months / 12), m = months % 12;
    if (y === 0) return m + (m === 1 ? ' month' : ' months');
    if (m === 0) return y + (y === 1 ? ' year' : ' years');
    return y + 'y ' + m + 'm';
  }

  function payoffDate(months) {
    if (!isFinite(months)) return '';
    var d = new Date();
    d.setMonth(d.getMonth() + months);
    return 'Estimated payoff: ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function render() {
    var balance = num('mp-balance');
    var rate = num('mp-rate') / 100 / 12;
    var months = Math.round(num('mp-years') * 12);
    var extra = num('mp-extra');
    var annual = num('mp-annual');
    var lump = Math.min(num('mp-lump'), balance);

    var payment = monthlyPayment(balance, rate, months);
    var base = amortize(balance, rate, payment, 0, 0, 0);
    var fast = amortize(balance, rate, payment, extra, annual, lump);

    var savedInterest = base.interest - fast.interest;
    var savedMonths = base.months - fast.months;

    document.getElementById('mp-saved').textContent = money(Math.max(0, savedInterest));
    document.getElementById('mp-saved-sub').textContent =
      base.interest > 0 ? Math.round((savedInterest / base.interest) * 100) + '% less interest paid' : '\\u00a0';
    document.getElementById('mp-sooner').textContent = savedMonths > 0 ? term(savedMonths) : 'Not available';
    document.getElementById('mp-payoff-date').textContent = payoffDate(fast.months);

    document.getElementById('mp-results').innerHTML =
      '<div class="jp-stat"><p class="jp-stat-label">Required monthly payment</p><p class="jp-stat-value">' +
        money(payment) + '</p><p class="jp-stat-sub">Principal and interest</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Monthly payment with extra</p><p class="jp-stat-value">' +
        money(payment + extra) + '</p><p class="jp-stat-sub">Includes ' + money(extra) + ' extra</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">New payoff term</p><p class="jp-stat-value">' +
        term(fast.months) + '</p><p class="jp-stat-sub">Without extra: ' + term(base.months) + '</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Total interest</p><p class="jp-stat-value">' +
        money(fast.interest) + '</p><p class="jp-stat-sub">Without extra: ' + money(base.interest) + '</p></div>';

    document.querySelector('#mp-compare tbody').innerHTML =
      '<tr><th scope="row">Monthly payment</th><td>' + money(payment) + '</td><td>' + money(payment + extra) + '</td></tr>' +
      '<tr><th scope="row">Time to payoff</th><td>' + term(base.months) + '</td><td>' + term(fast.months) + '</td></tr>' +
      '<tr><th scope="row">Total interest</th><td>' + money(base.interest) + '</td><td>' + money(fast.interest) + '</td></tr>' +
      '<tr><th scope="row">Total paid</th><td>' + money(balance + base.interest) + '</td><td>' +
        money(balance + fast.interest) + '</td></tr>';
  }

  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', render);
  });
  render();
})();`,
  },

  blocks: [
    {
      t: 'takeaways',
      items: [
        'An extra payment made early avoids interest for more months than the same payment made near the end of the loan.',
        'For the default $320,000 balance at 6.5% with 28 years remaining, an extra $300 each month removes 7 years 8 months and about $119,000 of interest.',
        'Extra principal shortens the term but does not reduce the next required payment. Keep a separate emergency fund.',
        'Compare mortgage prepayment with higher-interest debt, available employer retirement matches, liquidity needs and any tax effect.',
      ],
    },

    { t: 'h2', x: 'Why payment timing matters' },
    {
      t: 'p',
      x: 'Each mortgage payment covers accrued interest first and then reduces principal. On a $320,000 balance at 6.5% with 28 years remaining, the required payment is about **$2,070**. About $1,733 of the first payment is interest, leaving **$337 to reduce the balance.**',
    },
    {
      t: 'p',
      x: 'An extra principal payment lowers the balance immediately. Interest is then calculated on that lower balance for each remaining month. A $300 payment made in month one of a 28-year term affects roughly 336 later monthly calculations, so its total interest effect can exceed the payment itself.',
    },
    {
      t: 'p',
      x: 'The same $300 paid in year 25 has much less time to reduce interest. When the budget and other priorities allow it, earlier principal payments produce the larger interest reduction.',
    },

    { t: 'h2', x: 'Ways to make extra payments' },
    {
      t: 'ol',
      items: [
        '**Round up the monthly payment.** Increasing the example payment from $2,070 to $2,150 adds $80 each month and removes about 2 years 8 months and $43,000 of interest.',
        '**Make biweekly payments.** Paying half the monthly amount every two weeks produces 26 half-payments, equal to 13 monthly payments per year. On the example loan, that extra annual payment is equivalent to about $173 per month and removes about 5 years 1 month and $81,000 of interest. Enter one twelfth of the required payment in **Extra per month** to model it.',
        '**Apply an annual amount.** Enter a recurring tax refund, bonus or other annual payment in **Extra annual payment**.',
        '**Apply a lump sum.** Enter a one-time amount to compare paying it today with leaving the original balance unchanged.',
      ],
    },

    {
      t: 'note',
      kind: 'warn',
      title: 'Tell your servicer where the money goes',
      x: 'A servicer may treat extra funds as an early payment of the next bill or hold them in a suspense account instead of reducing principal. Follow the servicer’s process for a principal-only payment, then confirm on the next statement that the full amount reduced the balance.',
    },

    { t: 'h2', x: 'When extra payments may not fit' },
    {
      t: 'p',
      x: 'Reducing principal avoids future mortgage interest, but it also moves cash into home equity. Consider these priorities before making extra payments:',
    },
    {
      t: 'ul',
      items: [
        '**Higher-interest debt.** Credit cards and personal loans may cost much more than the mortgage. Compare rates and address the more expensive balance first.',
        '**No emergency fund.** Home equity is not liquid. Recovering a principal payment may require a refinance or HELOC, so keep an appropriate cash reserve before prepaying.',
        '**An unused employer match.** A retirement-plan match may provide more immediate value than mortgage prepayment. Capture the available match before comparing the remaining options.',
        '**A low mortgage rate.** A savings account may pay more than a low-rate mortgage costs, although taxes and changing deposit rates affect the comparison. Some borrowers still prefer the certainty of reducing debt.',
      ],
    },
    {
      t: 'p',
      x: 'Prepaying shortens the term but does not reduce the *required* monthly payment unless the loan is recast. When household income is uncertain, accessible cash may be more useful than additional home equity.',
    },

    { t: 'h2', x: 'Recasting versus refinancing versus prepaying' },
    {
      t: 'table',
      head: ['Option', 'What it does', 'Typical cost', 'Best when'],
      rows: [
        [
          'Prepaying',
          'Shortens the term, payment unchanged',
          'Free',
          'You want maximum interest saved and keep your current rate',
        ],
        [
          'Recasting',
          'Re-amortizes a lower balance over the original term, lowering the monthly payment',
          '$150–$500 fee',
          'You made a large lump sum and want breathing room in monthly cash flow',
        ],
        [
          'Refinancing',
          'Replaces the loan entirely with a new rate and term',
          '2–5% of the balance in closing costs',
          'Market rates have fallen enough to recover closing costs within a few years',
        ],
      ],
    },
    {
      t: 'p',
      x: 'A recast keeps the existing interest rate and recalculates the required payment after a large principal reduction. Fees are often lower than refinance closing costs. Not every servicer offers recasting, and government-backed loans generally do not qualify, so ask the servicer about eligibility and fees.',
    },

    { t: 'h2', x: 'How the calculation works' },
    {
      t: 'p',
      x: 'The calculator converts APR to a monthly rate and derives the required principal-and-interest payment from the standard annuity formula. It then processes the balance month by month: interest accrues on the current balance, and the rest of each payment reduces principal.',
    },
    {
      t: 'code',
      lang: 'text',
      x: `payment = P × r × (1 + r)^n / ((1 + r)^n − 1)

  P = current balance
  r = APR ÷ 12
  n = months remaining`,
    },
    {
      t: 'p',
      x: 'A second schedule applies the entered monthly, annual and one-time amounts to principal, then compares the payoff time and total interest with the original schedule. The calculation runs in the browser and this tool does not send the entered values to a server.',
    },
    {
      t: 'note',
      kind: 'info',
      title: 'Principal and interest only',
      x: 'The figures exclude property taxes, homeowners insurance, PMI and HOA dues, so an escrowed payment will be higher. Extra principal may help reach an equity threshold for PMI cancellation sooner, but this calculator does not include that possible saving.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is it better to pay extra monthly or make one lump sum a year?',
          a: 'Monthly payments begin reducing the balance sooner, so they save more interest than the same total paid at the end of the year. Compare both schedules, then choose a timing that fits your cash flow.',
        },
        {
          q: 'Do biweekly payments really save that much?',
          a: 'The saving comes from making 26 half-payments, which equals 13 full monthly payments per year instead of 12. You can model the same annual amount by dividing one monthly payment by 12 and adding that amount to each regular payment. Check whether a third-party biweekly service charges a fee.',
        },
        {
          q: 'Will paying extra lower my monthly payment?',
          a: 'No. A principal prepayment shortens the payoff term while the required payment remains fixed. A recast can lower the required payment by re-amortizing the reduced balance over the remaining term.',
        },
        {
          q: 'Are there prepayment penalties?',
          a: 'Some non-qualified and older US loans still have prepayment penalties. Qualified mortgages cannot impose them after the first three years. Read the prepayment clause in your loan documents before sending a large amount.',
        },
        {
          q: 'Does the mortgage interest deduction change the maths?',
          a: 'Only taxpayers who itemize can deduct qualifying mortgage interest. If the deduction applies, the after-tax cost of the loan may be lower than its APR, which also lowers the financial return from prepayment. Consult a tax professional for your circumstances.',
        },
        {
          q: 'Is my financial information stored?',
          a: 'No. The calculation runs in client-side JavaScript. This tool does not send or save the values you enter.',
        },
      ],
    },

    {
      t: 'note',
      kind: 'info',
      title: 'Not financial advice',
      x: 'This calculator provides an estimate and does not account for your full tax situation, other debts, income stability or goals. Consult a licensed financial adviser or mortgage professional before a large prepayment or refinancing decision.',
    },
  ],

  related: ['/tools/saas-seat-cost-calculator/', '/reviews/best-tax-software-for-freelancers/', '/tools/cloud-cost-calculator/'],
};
