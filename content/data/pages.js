/**
 * Standalone pages: about, contact and the legal set.
 *
 * AdSense review looks for exactly this cluster — a real About page with named
 * humans, a working contact route, a privacy policy that names the ad vendor,
 * and clear terms. A site without them is a common rejection reason.
 */

const authors = require('./authors');
const { site } = require('../config');

const UPDATED = '2026-08-29';
const legalParent = { label: 'Legal', href: '/legal/privacy/' };

const authorCards = Object.values(authors)
  .map(
    (a) => `<div class="jp-author" id="${a.id}">
      <img src="${a.image}" alt="" width="74" height="74" loading="lazy" />
      <div>
        <h3>${a.name}</h3>
        <p class="jp-author-role">${a.role}</p>
        <p>${a.bio}</p>
        <p style="margin-top:.5rem"><a href="${a.sameAs[0]}" rel="noopener" target="_blank">LinkedIn</a> ·
           <a href="${a.sameAs[1]}" rel="noopener" target="_blank">GitHub</a></p>
      </div>
    </div>`
  )
  .join('');

module.exports = [
  /* ---------------------------------------------------------------- About */
  {
    path: '/about/',
    title: 'About JunePoint Resources — Who Writes This',
    h1: 'About JunePoint Resources',
    eyebrow: 'About',
    description:
      'Who runs JunePoint Resources, how the tools and guides are produced, how the site is funded, and how to reach the people who write it.',
    standfirst:
      'JunePoint Resources is the publishing side of JunePoint, a two-person cross-platform software studio. Here is who writes it and how it is paid for.',
    updated: UPDATED,
    priority: '0.6',
    blocks: [
      { t: 'h2', x: 'What this site is' },
      {
        t: 'p',
        x: 'JunePoint is a small software studio that builds web and mobile applications. JunePoint Resources is the part of the site where we publish the things we build for ourselves along the way — the calculators we needed, the troubleshooting notes we kept, and the research we did before spending money on business software.',
      },
      {
        t: 'p',
        x: 'It is organised into three sections. [Tools](/tools/) are free browser-based utilities. [Guides](/guides/) are technical explainers and troubleshooting walkthroughs. [Business software](/reviews/) is buying research for categories where the wrong choice is costly to unwind.',
      },

      { t: 'h2', x: 'Who writes it' },
      { t: 'html', x: authorCards },

      { t: 'h2', x: 'How it is funded' },
      {
        t: 'p',
        x: 'The resource pages carry advertising served through Google AdSense. That is what pays for the time spent writing and maintaining them, and it is why these pages exist at all.',
      },
      {
        t: 'p',
        x: 'Two commitments follow from that. **Advertising never buys coverage or placement** — no advertiser has ever been told what we would write, and none has been given the chance to review it. And **the studio pages carry no advertising at all**; the portfolio at junepoint.com is client-facing work and stays clean. Full detail is in the [advertising disclosure](/legal/disclosure/).',
      },

      { t: 'h2', x: 'How the content is made' },
      {
        t: 'ul',
        items: [
          '**Tools** are written and tested by hand. Every calculation is documented on the page, and where a figure is an approximation we say so and show the rate we used.',
          '**Guides** are drawn from problems we have actually debugged. Commands are run before they are published, and error messages are quoted as they really appear.',
          '**Buying research** is desk research: documentation, pricing pages, security whitepapers, trust centres and support policies. We do not run hands-on lab tests, and we never pretend otherwise. The [editorial policy](/legal/editorial-policy/) explains what that method can and cannot tell you.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Found something wrong?',
        x: `Software changes and prices move. If a figure here is out of date or a fix no longer works, email ${site.email} and we will correct the page and update the "last updated" date on it. Corrections are made in place rather than quietly deleted.`,
      },

      { t: 'h2', x: 'Contact' },
      {
        t: 'p',
        x: `General enquiries, corrections and press: [${site.email}](mailto:${site.email}). More routes on the [contact page](/contact/).`,
      },
    ],
  },

  /* -------------------------------------------------------------- Contact */
  {
    path: '/contact/',
    title: 'Contact JunePoint',
    h1: 'Contact',
    eyebrow: 'Contact',
    description: 'How to reach JunePoint for corrections, editorial enquiries, advertising questions or development work.',
    standfirst: 'One inbox, read by the two people who write this site.',
    updated: UPDATED,
    priority: '0.5',
    blocks: [
      {
        t: 'p',
        x: `Email [${site.email}](mailto:${site.email}). We answer most messages within two business days.`,
      },
      { t: 'h2', x: 'What to include' },
      {
        t: 'table',
        head: ['Reason for writing', 'Please include'],
        rows: [
          ['A correction', 'The page URL, the specific claim, and a source we can verify. These get priority.'],
          ['Editorial enquiry', 'What you would like covered and why it is hard to find good information on today.'],
          ['Vendor or PR', 'Read the [editorial policy](/legal/editorial-policy/) first — we do not accept sponsored placements, paid links or guest posts.'],
          ['Privacy request', 'Your request under GDPR, UK GDPR or CCPA/CPRA. See the [privacy policy](/legal/privacy/) for what we do and do not hold.'],
          ['Development work', 'A description of what you want built and roughly when. That is the studio side of the business.'],
        ],
      },
      { t: 'h2', x: 'What we do not do' },
      {
        t: 'ul',
        items: [
          'Publish guest posts, sponsored articles or paid links, in any form, at any price.',
          'Provide individual financial, legal or tax advice. The calculators are educational tools — talk to a licensed professional about your own situation.',
          'Offer support for third-party software. If a vendor mentioned here has broken, their support team is the right destination.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        title: 'Looking for the studio?',
        x: 'Development enquiries are welcome at the same address. The portfolio of what we build lives at [junepoint.com](/).',
      },
    ],
  },

  /* ---------------------------------------------------------- Privacy */
  {
    path: '/legal/privacy/',
    title: 'Privacy Policy — JunePoint',
    h1: 'Privacy policy',
    eyebrow: 'Legal',
    parent: legalParent,
    description:
      'What data JunePoint collects, what advertising cookies are used, and how to control or opt out of personalised advertising.',
    standfirst: 'Short version: the tools never send your input anywhere, and the only third party involved is Google’s ad platform.',
    updated: UPDATED,
    priority: '0.3',
    blocks: [
      { t: 'h2', x: 'Who we are' },
      {
        t: 'p',
        x: `JunePoint operates junepoint.com. For any question about this policy, contact [${site.email}](mailto:${site.email}).`,
      },

      { t: 'h2', x: 'What we collect directly' },
      {
        t: 'p',
        x: '**Nothing you type into a tool.** Every calculator, formatter and converter on this site runs entirely in your browser using client-side JavaScript. Balances, tokens, JSON payloads and any other input stay on your device. There is no server-side component to receive them, and no request is made carrying them.',
      },
      {
        t: 'p',
        x: '**Local storage.** We store one value in your browser — your light or dark theme preference, under the key `jp-theme`. It never leaves your device and is not an identifier. Clearing site data removes it.',
      },
      {
        t: 'p',
        x: '**Email.** If you write to us, we hold your message and address for as long as needed to deal with it. We do not add you to a mailing list; there isn’t one.',
      },
      {
        t: 'p',
        x: '**Server logs.** This site is hosted on GitHub Pages. GitHub processes standard request data, including IP addresses, as part of serving and protecting the site. See GitHub’s own privacy statement for what they retain.',
      },

      { t: 'h2', x: 'Advertising' },
      {
        t: 'p',
        x: 'Resource pages — those under `/tools/`, `/guides/`, `/reviews/` and `/resources/` — display advertising served by **Google AdSense**. The studio pages carry no advertising and load no advertising code.',
      },
      {
        t: 'ul',
        items: [
          'Google and its partners use cookies and similar technologies to serve ads based on your prior visits to this and other websites.',
          'Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to our sites and/or other sites on the internet.',
          'You can opt out of personalised advertising by visiting [Google Ads Settings](https://adssettings.google.com). Opting out does not remove ads; it makes them less relevant.',
          'You can opt out of third-party vendor cookies more broadly at [aboutads.info/choices](https://optout.aboutads.info/) or [youronlinechoices.eu](https://www.youronlinechoices.eu/).',
          'Third-party vendors, including Google, may place cookies to serve ads based on prior visits. Where required, Google requests consent for personalised advertising in the European Economic Area, the UK and Switzerland before setting such cookies.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Advertising cookies are set by Google, not by us',
        x: 'We do not have access to the cookies Google’s ad platform sets, cannot read them, and receive no personally identifiable information from them. What we see is aggregate reporting — impressions, clicks and revenue by page.',
      },

      { t: 'h2', x: 'Analytics' },
      {
        t: 'p',
        x: 'This site runs no separate analytics product — no Google Analytics, no Plausible, no third-party session recording. Traffic is understood through the aggregate reporting already provided by AdSense and Google Search Console.',
      },

      { t: 'h2', x: 'Your rights' },
      {
        t: 'p',
        x: 'If you are in the EEA, the UK or Switzerland, the GDPR gives you rights of access, rectification, erasure, restriction, portability and objection. If you are a California resident, the CCPA/CPRA gives you rights to know, delete, correct and opt out of the sale or sharing of personal information.',
      },
      {
        t: 'p',
        x: `Because we do not operate accounts, mailing lists or a database, the only personal data we are likely to hold about you is an email you have sent us. To exercise any right, write to [${site.email}](mailto:${site.email}). For data held by Google in connection with advertising, use Google’s own controls linked above — we cannot action those requests on your behalf.`,
      },
      {
        t: 'p',
        x: '**We do not sell personal information**, and we have never shared it with a data broker.',
      },

      { t: 'h2', x: 'Children' },
      {
        t: 'p',
        x: 'This site is aimed at a professional and adult audience and is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with information, contact us and we will delete it.',
      },

      { t: 'h2', x: 'External links' },
      {
        t: 'p',
        x: 'Pages here link to vendor documentation, pricing pages and other external resources. Once you follow such a link, that site’s privacy policy governs, not this one.',
      },

      { t: 'h2', x: 'Changes' },
      {
        t: 'p',
        x: 'Material changes are reflected in the "last updated" date at the top of this page. Continued use of the site after a change constitutes acceptance of the revised policy.',
      },
      {
        t: 'note',
        kind: 'warn',
        title: 'Not legal advice',
        x: 'This policy describes our actual practices in plain language. It is not a substitute for advice from a qualified lawyer about your own jurisdiction and obligations.',
      },
    ],
  },

  /* ------------------------------------------------------------- Terms */
  {
    path: '/legal/terms/',
    title: 'Terms of Use — JunePoint',
    h1: 'Terms of use',
    eyebrow: 'Legal',
    parent: legalParent,
    description: 'The terms that govern use of junepoint.com, its free tools and its published content.',
    standfirst: 'The tools are free and provided as-is. Please do not rely on them for decisions that need a professional.',
    updated: UPDATED,
    priority: '0.3',
    blocks: [
      { t: 'h2', x: 'Acceptance' },
      { t: 'p', x: 'By using junepoint.com you agree to these terms. If you do not agree, please do not use the site.' },

      { t: 'h2', x: 'The tools' },
      {
        t: 'p',
        x: 'The calculators and utilities are provided free of charge, **as-is and without warranty of any kind**, express or implied, including fitness for a particular purpose. They run in your browser and we neither receive nor retain your input.',
      },
      {
        t: 'p',
        x: 'They are educational aids. Financial calculators produce estimates that ignore taxes, fees, insurance and your individual circumstances. Cost calculators use published list prices that change without notice. **Do not use them as the sole basis for a financial, legal, tax or purchasing decision.**',
      },

      { t: 'h2', x: 'The content' },
      {
        t: 'p',
        x: 'Guides and buying research are published in good faith and reviewed periodically, but software, pricing and best practice change constantly. We make no warranty that any page is current, complete or applicable to your situation. Check the "last updated" date and verify anything that matters against the vendor’s own documentation.',
      },
      {
        t: 'p',
        x: 'Nothing here is professional advice. We are software developers, not licensed financial advisers, accountants, lawyers or compliance auditors.',
      },

      { t: 'h2', x: 'Acceptable use' },
      {
        t: 'ul',
        items: [
          'Do not attempt to disrupt, overload or gain unauthorised access to the site or its infrastructure.',
          'Do not scrape the site at a rate that degrades it for others, and do not republish substantial portions of the content as your own.',
          'Do not use anything here to build a product or service that competes by wholesale copying rather than by adding something.',
        ],
      },

      { t: 'h2', x: 'Intellectual property' },
      {
        t: 'p',
        x: 'Original text, design and code on this site are © JunePoint unless stated otherwise. You are welcome to quote short excerpts with a link and attribution. Product names and trademarks referenced belong to their respective owners; their use here is nominative and does not imply affiliation or endorsement.',
      },

      { t: 'h2', x: 'Limitation of liability' },
      {
        t: 'p',
        x: 'To the maximum extent permitted by law, JunePoint and its authors are not liable for any indirect, incidental, consequential or punitive damages, or any loss of profits, revenue, data or goodwill, arising from your use of this site or reliance on its content.',
      },

      { t: 'h2', x: 'Third-party links and advertising' },
      {
        t: 'p',
        x: 'Advertising is served by Google and its partners; we do not select individual advertisements and do not endorse advertisers. External links are provided for reference and we are not responsible for the content or practices of other sites. See the [advertising disclosure](/legal/disclosure/).',
      },

      { t: 'h2', x: 'Changes' },
      { t: 'p', x: 'These terms may be updated. The date at the top of this page reflects the current version.' },
    ],
  },

  /* -------------------------------------------------- Editorial policy */
  {
    path: '/legal/editorial-policy/',
    title: 'Editorial Policy — How We Research and Publish',
    h1: 'Editorial policy',
    eyebrow: 'Legal',
    parent: legalParent,
    description:
      'How JunePoint researches buying guides, what our methodology can and cannot tell you, and the rules we hold ourselves to.',
    standfirst:
      'We think you should know exactly how something was researched before you act on it — including where the method has limits.',
    updated: UPDATED,
    priority: '0.4',
    blocks: [
      {
        t: 'note',
        kind: 'warn',
        title: 'The most important thing on this page',
        x: 'Our buying guides are **desk research, not hands-on lab testing.** We have not deployed every backup platform to a thousand endpoints or run a year of payroll through each provider. Plenty of sites imply that they have. We would rather tell you what we actually did, so you can weigh it accordingly.',
      },

      { t: 'h2', x: 'What we actually do' },
      {
        t: 'ol',
        items: [
          '**Define the buyer.** Every guide states who it is for — team size, technical capability, regulatory position. A recommendation with no stated buyer is meaningless.',
          '**Read the primary sources.** Vendor documentation, published pricing, security whitepapers, trust centres, status-page history, sub-processor lists, DPAs and support SLAs. These are where the real differences show up.',
          '**Set the criteria before the shortlist.** We write down what matters for that category first, so the criteria are not reverse-engineered to justify a favourite.',
          '**Say what each option is genuinely best at**, and where it is a poor fit. Every entry gets a trade-offs section, because everything has them.',
          '**Give you the questions to ask the vendor.** The parts that matter most — real quoted price, migration path, exit terms — are things only the vendor can answer for your situation.',
        ],
      },

      { t: 'h2', x: 'What this method cannot tell you' },
      {
        t: 'ul',
        items: [
          '**Restore reliability under pressure.** No amount of documentation reading tells you whether a backup product restores cleanly at 3am during an incident. Run your own restore test — always, whatever you buy.',
          '**Real support quality.** Published SLAs describe the floor, not the experience. Ask for references from customers your size.',
          '**Your negotiated price.** List pricing is a starting position in this market. Mid-market and enterprise deals routinely land well below it.',
          '**Detection efficacy.** For security products, independent testing labs run controlled evaluations we cannot replicate. We point to them rather than pretending to substitute for them.',
        ],
      },

      { t: 'h2', x: 'Rules we hold ourselves to' },
      {
        t: 'ul',
        items: [
          '**No paid placement, ever.** No vendor can buy a mention, a position, a link or a favourable line. No sponsored posts, no guest posts, no link insertions. We decline these weekly.',
          '**No fabricated testing.** We do not invent benchmark scores, star ratings from tests we did not run, or "we spent 40 hours with each product" claims.',
          '**Advertising is separated from editorial.** Ads are served programmatically by Google. We do not know which advertisers appear on a page, and advertisers have no input into content.',
          '**Prices are dated.** Pricing is stated with the date we last verified it and a note to confirm with the vendor, because it moves.',
          '**Corrections are made in place.** When we get something wrong we fix the page, update the date, and note material corrections rather than deleting quietly.',
        ],
      },

      { t: 'h2', x: 'Affiliate links' },
      {
        t: 'p',
        x: 'At the time of writing, this site carries **no affiliate links**. Revenue comes from display advertising only. If that changes, affiliate relationships will be disclosed clearly on every affected page and in the [advertising disclosure](/legal/disclosure/) before any such link is published — not retroactively.',
      },

      { t: 'h2', x: 'Corrections' },
      {
        t: 'p',
        x: `Spotted an error? Email [${site.email}](mailto:${site.email}) with the URL and the specific claim. Corrections are prioritised over new work.`,
      },
    ],
  },

  /* ------------------------------------------------------- Disclosure */
  {
    path: '/legal/disclosure/',
    title: 'Advertising Disclosure — JunePoint',
    h1: 'Advertising disclosure',
    eyebrow: 'Legal',
    parent: legalParent,
    description: 'How JunePoint makes money, where advertising appears, and what advertisers do and do not influence.',
    standfirst: 'Display advertising on the resource pages. Nothing on the studio pages. No paid placements anywhere.',
    updated: UPDATED,
    priority: '0.3',
    blocks: [
      { t: 'h2', x: 'How this site makes money' },
      {
        t: 'p',
        x: 'JunePoint Resources is funded by display advertising served through **Google AdSense**. Advertisements are selected and delivered programmatically by Google based on page context and, where you have permitted it, your ad settings. We do not choose individual advertisers and generally do not know which ones appear on a given page.',
      },

      { t: 'h2', x: 'Where ads appear — and where they do not' },
      {
        t: 'table',
        head: ['Area', 'Advertising'],
        rows: [
          ['/tools/, /guides/, /reviews/, /resources/', 'Yes — display units within and alongside the content'],
          ['The JunePoint Studio portfolio at /', 'No — no ad units and no advertising code is loaded'],
          ['Legal, about and contact pages', 'No'],
        ],
      },
      {
        t: 'p',
        x: 'Ad units are labelled "Advertisement", kept out of the navigation, and never styled to resemble editorial links or buttons. If you ever see an ad here that is disguised as content, that is a bug — please report it.',
      },

      { t: 'h2', x: 'What advertising does not buy' },
      {
        t: 'ul',
        items: [
          'It does not buy coverage. No advertiser has been offered, or given, any say in what we write.',
          'It does not buy position. Rankings in buying guides are not for sale at any price.',
          'It does not buy links. We publish no sponsored links, paid guest posts or link insertions.',
          'It does not buy pre-publication review. No vendor sees a page before it goes live.',
        ],
      },

      { t: 'h2', x: 'Affiliate relationships' },
      {
        t: 'p',
        x: 'We currently have **none**, and no page on this site contains an affiliate link. Should that change, every affected page will carry a disclosure above the content and this page will be updated first.',
      },

      { t: 'h2', x: 'Free products and vendor relationships' },
      {
        t: 'p',
        x: 'We have not accepted free licences, hardware, paid travel or gifts in exchange for coverage. Where we have genuine commercial experience with a product — usually because the studio uses it — we say so on the page itself.',
      },

      { t: 'h2', x: 'Controlling the ads you see' },
      {
        t: 'p',
        x: 'Personalised advertising can be turned off at [Google Ads Settings](https://adssettings.google.com), and third-party vendor cookies at [aboutads.info/choices](https://optout.aboutads.info/). Full detail is in the [privacy policy](/legal/privacy/).',
      },
    ],
  },
];
