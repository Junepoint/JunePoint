module.exports = {
  slug: 'mortgage-payoff-calculator',
  title: 'Mortgage Payoff Calculator: Extra Payment Savings',
  h1: 'Mortgage Payoff Calculator',
  eyebrow: 'Personal finance',
  description:
    'See how much interest an extra monthly payment saves and how many years it cuts off your mortgage. Free amortization calculator, no signup, runs in your browser.',
  standfirst:
    'Add an extra payment — monthly, annual or a one-off lump sum — and see exactly how many months come off your term and how much interest you keep.',
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
      <h2 class="jp-tool-h">Your loan</h2>
      <div class="jp-field">
        <label for="mp-balance">Current balance ($)</label>
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
        <label for="mp-annual">Extra once a year ($)</label>
        <input class="jp-input" type="number" id="mp-annual" value="0" min="0" step="100" />
        <span class="jp-hint">Tax refund, bonus, anything seasonal.</span>
      </div>
      <div class="jp-field">
        <label for="mp-lump">One-off lump sum today ($)</label>
        <input class="jp-input" type="number" id="mp-lump" value="0" min="0" step="1000" />
      </div>
    </div>

    <div>
      <h2 class="jp-tool-h">Result</h2>
      <div class="jp-stat jp-stat--primary" style="margin-bottom:.75rem">
        <p class="jp-stat-label">Interest saved</p>
        <p class="jp-stat-value" id="mp-saved">$0</p>
        <p class="jp-stat-sub" id="mp-saved-sub">&nbsp;</p>
      </div>
      <div class="jp-stat">
        <p class="jp-stat-label">Paid off sooner by</p>
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
    <p class="jp-table-note">Principal and interest only. Property tax, insurance and HOA dues are not included.</p>
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
    if (!isFinite(months)) return 'never';
    var y = Math.floor(months / 12), m = months % 12;
    if (y === 0) return m + (m === 1 ? ' month' : ' months');
    if (m === 0) return y + (y === 1 ? ' year' : ' years');
    return y + 'y ' + m + 'm';
  }

  function payoffDate(months) {
    if (!isFinite(months)) return '';
    var d = new Date();
    d.setMonth(d.getMonth() + months);
    return 'Paid off around ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
    document.getElementById('mp-sooner').textContent = savedMonths > 0 ? term(savedMonths) : '—';
    document.getElementById('mp-payoff-date').textContent = payoffDate(fast.months);

    document.getElementById('mp-results').innerHTML =
      '<div class="jp-stat"><p class="jp-stat-label">Required monthly payment</p><p class="jp-stat-value">' +
        money(payment) + '</p><p class="jp-stat-sub">Principal and interest</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Your total monthly</p><p class="jp-stat-value">' +
        money(payment + extra) + '</p><p class="jp-stat-sub">Including the extra ' + money(extra) + '</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">New term</p><p class="jp-stat-value">' +
        term(fast.months) + '</p><p class="jp-stat-sub">Was ' + term(base.months) + '</p></div>' +
      '<div class="jp-stat"><p class="jp-stat-label">Total interest</p><p class="jp-stat-value">' +
        money(fast.interest) + '</p><p class="jp-stat-sub">Was ' + money(base.interest) + '</p></div>';

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
        'An extra payment early in a loan is worth several times the same payment made late — every dollar of principal removed stops compounding for the entire remaining term.',
        'On a $320,000 balance at 6.5% with 28 years to run, an extra $300 a month removes 7 years 8 months and about $119,000 of interest.',
        'Extra principal shortens the term. It does not reduce next month’s required payment, so it is not an emergency-fund substitute.',
        'Paying down a mortgage is a guaranteed, tax-adjusted return equal to your interest rate — compare it against your other debts and your employer match before committing.',
      ],
    },

    { t: 'h2', x: 'Why an extra payment does so much' },
    {
      t: 'p',
      x: 'A mortgage payment is split between interest and principal, and early in the loan that split is lopsided. On a $320,000 balance at 6.5% with 28 years remaining, the required payment is about **$2,070** — and $1,733 of that first payment is interest. Just **$337 actually reduces the balance.**',
    },
    {
      t: 'p',
      x: 'Any extra dollar you send skips that split entirely and lands directly on principal. That dollar then stops accruing interest for every remaining month of the loan. Send $300 extra in month one of a 28-year term and you avoid roughly 336 months of compounding on it — which is why the interest saved is a large multiple of the extra amount paid.',
    },
    {
      t: 'p',
      x: 'The corollary matters just as much: the same $300 sent in year 25 saves almost nothing, because there is barely any term left for it to shorten. **Front-load extra payments if you are going to make them at all.**',
    },

    { t: 'h2', x: 'Four ways to pay extra, ranked by how painless they are' },
    {
      t: 'ol',
      items: [
        '**Round up.** Take that $2,070 payment to $2,150. It is $80 a month, it is invisible in a budget, and it still removes 2 years 8 months and roughly $43,000 of interest.',
        '**Biweekly payments.** Pay half your monthly amount every two weeks. Because there are 26 fortnights in a year, you make the equivalent of 13 monthly payments instead of 12 — one extra payment a year without ever feeling it. On the example loan that is about $173 a month, worth 5 years 1 month and roughly $81,000. Enter one twelfth of your payment in the "extra per month" field above to model it.',
        '**Annual windfalls.** Tax refunds and bonuses go in the "once a year" field. They are money you have already learned to live without.',
        '**Lump sum after a windfall.** The most powerful and the least frequent. Model it in the lump sum field to see the effect of applying it today rather than spreading it.',
      ],
    },

    {
      t: 'note',
      kind: 'warn',
      title: 'Tell your servicer where the money goes',
      x: 'Extra funds are not automatically applied to principal. Many servicers hold them as a prepayment of next month’s bill, or park them in a suspense account, which saves you nothing. Send extra payments as a separate transaction explicitly marked "apply to principal", then check the following statement to confirm the balance dropped by the full amount.',
    },

    { t: 'h2', x: 'When you should not pay extra' },
    {
      t: 'p',
      x: 'Paying down a mortgage is a guaranteed return equal to your interest rate, with no volatility. That is genuinely good. But it is not automatically the best use of the money, and there are four situations where it clearly is not:',
    },
    {
      t: 'ul',
      items: [
        '**You carry higher-interest debt.** Credit cards at 22% and personal loans in the teens dwarf a mortgage rate. Clear those first; the arithmetic is not close.',
        '**You have no emergency fund.** Home equity is not liquid. Money sent to the lender is very difficult to get back without a refinance or a HELOC, and lenders are least willing to lend at exactly the moment you would need it. Three to six months of expenses in cash comes first.',
        '**You are leaving an employer match on the table.** A 50% or 100% match on retirement contributions is an immediate, guaranteed return that no mortgage rate approaches.',
        '**Your rate is very low.** If you locked a sub-4% mortgage, an ordinary high-yield savings account may pay more than your loan costs. Prepaying is then a negative-spread decision — though some people accept that for the certainty of owning outright, which is a legitimate preference rather than a mistake.',
      ],
    },
    {
      t: 'p',
      x: 'One more consideration: prepaying shortens your term but never reduces your *required* monthly payment. If your household income is unstable, cash in an account is a more useful buffer than equity in a house, even though the equity earns a better headline return.',
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
      x: 'Recasting is the least-known of the three and often the best fit after an inheritance or a bonus: you keep your existing interest rate, drop the required payment, and pay a few hundred dollars instead of thousands in closing costs. Not every servicer offers it, and government-backed loans generally do not qualify — but it is always worth a phone call before assuming a refinance is the only option.',
    },

    { t: 'h2', x: 'How the calculation works' },
    {
      t: 'p',
      x: 'The tool builds a standard amortization schedule. It converts your APR to a monthly rate, derives the required payment from the standard annuity formula, then walks the loan month by month: interest accrues on the outstanding balance, the payment covers that interest first, and whatever remains reduces principal.',
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
      x: 'The "with extra payments" run repeats that walk with your additional amounts applied to principal, and the two totals are compared. Everything happens in your browser — no balance, rate or personal detail is ever transmitted anywhere.',
    },
    {
      t: 'note',
      kind: 'info',
      title: 'Principal and interest only',
      x: 'The figures here exclude property taxes, homeowners insurance, PMI and HOA dues. Your actual escrowed payment will be higher. Extra principal payments can, however, get you to the 20% equity threshold sooner and let you cancel PMI — a saving this calculator does not attempt to model.',
    },

    {
      t: 'faq',
      items: [
        {
          q: 'Is it better to pay extra monthly or make one lump sum a year?',
          a: 'Monthly wins slightly, because each payment starts reducing the balance sooner and therefore stops accruing interest earlier. Over a full mortgage the difference between $300 a month and $3,600 once a year is real but modest — usually a few thousand dollars. Choose whichever you will actually stick to.',
        },
        {
          q: 'Do biweekly payments really save that much?',
          a: 'The saving is real, but it comes from making 13 monthly payments a year instead of 12 — not from any compounding magic in the fortnightly schedule. You can get the identical result by dividing one monthly payment by twelve and adding it to each payment yourself, without paying a third-party service to administer it.',
        },
        {
          q: 'Will paying extra lower my monthly payment?',
          a: 'No. Prepayment shortens the term while leaving the required payment fixed. If you want a lower monthly payment, ask your servicer about a recast, which re-amortizes the reduced balance over the remaining original term.',
        },
        {
          q: 'Are there prepayment penalties?',
          a: 'They are rare on modern conforming US mortgages and prohibited on qualified mortgages after the first three years, but they do still exist on some non-qualified and older loans. Check the prepayment clause in your note before sending a large lump sum.',
        },
        {
          q: 'Does the mortgage interest deduction change the maths?',
          a: 'For most filers, no. The standard deduction has been high enough since 2018 that a large majority of households do not itemise at all, so mortgage interest gives them no tax benefit. If you do itemise, your effective rate is roughly your APR times (1 minus your marginal tax rate), which lowers the return on prepayment somewhat.',
        },
        {
          q: 'Is my financial information stored?',
          a: 'No. The calculator runs entirely in your browser using client-side JavaScript. Nothing you enter is sent to a server, logged or saved.',
        },
      ],
    },

    {
      t: 'note',
      kind: 'info',
      title: 'Not financial advice',
      x: 'This calculator is an educational tool. It cannot see your tax situation, your other debts, your job security or your goals. Talk to a licensed financial adviser or a mortgage professional before making a large prepayment or refinancing decision.',
    },
  ],

  related: ['/tools/saas-seat-cost-calculator/', '/reviews/best-tax-software-for-freelancers/', '/tools/cloud-cost-calculator/'],
};
