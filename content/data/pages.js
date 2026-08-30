/** Standalone information and legal pages. */

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
  {
    path: '/about/',
    title: 'About JunePoint Resources | Who Writes This',
    h1: 'About JunePoint Resources',
    eyebrow: 'About',
    description:
      'Who writes JunePoint Resources, how the tools and guides are produced, how the site is funded, and how to contact the author.',
    standfirst:
      'JunePoint Resources is published by JunePoint and written by Jackson Abeyta. This page explains the editorial process and how the site is funded.',
    updated: UPDATED,
    priority: '0.6',
    blocks: [
      { t: 'h2', x: 'What this site is' },
      {
        t: 'p',
        x: 'JunePoint is a software studio that builds web and mobile applications. JunePoint Resources publishes browser-based tools, technical troubleshooting guides and business software research.',
      },
      {
        t: 'p',
        x: 'The site has three sections. [Tools](/tools/) contains free browser-based utilities. [Guides](/guides/) covers technical concepts and troubleshooting steps. [Business software](/reviews/) compares products using published documentation, pricing and policies.',
      },

      { t: 'h2', x: 'Who writes it' },
      { t: 'html', x: authorCards },

      { t: 'h2', x: 'How it is funded' },
      {
        t: 'p',
        x: 'Resource pages carry advertising served through Google AdSense. That revenue supports writing and maintenance.',
      },
      {
        t: 'p',
        x: '**Advertising does not buy coverage or placement.** Advertisers do not decide what is published or review pages before publication. **The studio pages carry no advertising.** The [advertising disclosure](/legal/disclosure/) explains the policy in full.',
      },

      { t: 'h2', x: 'How the content is made' },
      {
        t: 'ul',
        items: [
          '**Tools** are tested before publication. Calculator pages document their formulas and identify estimates and rates that affect the result.',
          '**Guides** provide tested commands, quoted error messages and an explanation of why each fix works.',
          '**Buying research** uses documentation, pricing pages, security whitepapers, trust centres and support policies. It does not include hands-on lab testing. The [editorial policy](/legal/editorial-policy/) explains the limits of that method.',
        ],
      },
      {
        t: 'note',
        kind: 'info',
        title: 'Found something wrong?',
        x: `Software and prices change. If a figure is out of date or a fix no longer works, email ${site.email}. Jackson reviews corrections, updates the page where needed and records the new "last updated" date.`,
      },

      { t: 'h2', x: 'Contact' },
      {
        t: 'p',
        x: `Contact Jackson about editorial questions, corrections or press at [${site.email}](mailto:${site.email}). The [contact page](/contact/) lists what to include.`,
      },
    ],
  },

  {
    path: '/contact/',
    title: 'Contact JunePoint',
    h1: 'Contact',
    eyebrow: 'Contact',
    description: 'How to reach JunePoint for corrections, editorial enquiries, advertising questions or development work.',
    standfirst: 'One inbox, read by Jackson Abeyta, the author of JunePoint Resources.',
    updated: UPDATED,
    priority: '0.5',
    blocks: [
      {
        t: 'p',
        x: `Email [${site.email}](mailto:${site.email}). Jackson usually replies within two business days.`,
      },
      { t: 'h2', x: 'What to include' },
      {
        t: 'table',
        head: ['Reason for writing', 'Please include'],
        rows: [
          ['A correction', 'The page URL, the specific claim and a source that can be checked. Corrections receive priority.'],
          ['Editorial enquiry', 'The topic you would like covered and the information that is currently missing.'],
          ['Vendor or PR', 'Read the [editorial policy](/legal/editorial-policy/) first. JunePoint Resources does not accept sponsored placements, paid links or guest posts.'],
          ['Privacy request', 'Your request under GDPR, UK GDPR or CCPA/CPRA. See the [privacy policy](/legal/privacy/) for what we do and do not hold.'],
          ['Development work', 'A description of what you want built and roughly when. That is the studio side of the business.'],
        ],
      },
      { t: 'h2', x: 'What we do not do' },
      {
        t: 'ul',
        items: [
          'Publish guest posts, sponsored articles or paid links, in any form, at any price.',
          'Provide individual financial, legal or tax advice. The calculators are educational tools; consult a licensed professional about your situation.',
          'Offer support for third-party software. Contact the vendor’s support team for help with its product.',
        ],
      },
      {
        t: 'note',
        kind: 'tip',
        title: 'Looking for the studio?',
        x: 'Send development enquiries to the same address. JunePoint’s development portfolio is at [junepoint.com](/).',
      },
    ],
  },

  {
    path: '/legal/privacy/',
    title: 'Privacy Policy | JunePoint',
    h1: 'Privacy policy',
    eyebrow: 'Legal',
    parent: legalParent,
    description:
      'What data JunePoint collects, what advertising cookies are used, and how to control or opt out of personalised advertising.',
    standfirst: 'Tool inputs stay in your browser. This policy also covers hosting, email and advertising data.',
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
        x: '**Tool inputs.** The calculators, formatters and converters run in your browser using client-side JavaScript. Balances, tokens, JSON payloads and other input stay on your device. The tools have no server-side component that receives this data.',
      },
      {
        t: 'p',
        x: '**Local storage.** The JunePoint Studio theme toggle stores one value in your browser under the key `jp-studio-theme`. Resource pages are always dark and do not store a theme preference. The saved studio preference stays on your device and is not an identifier. Clearing site data removes it.',
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
        x: 'Resource pages under `/tools/`, `/guides/`, `/reviews/` and `/resources/` display advertising served by **Google AdSense**. The studio pages carry no advertising and load no advertising code.',
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
        x: 'JunePoint cannot access or read the cookies set by Google’s ad platform and receives no personally identifiable information from them. Reporting is aggregated by page and includes impressions, clicks and revenue.',
      },

      { t: 'h2', x: 'Analytics' },
      {
        t: 'p',
        x: 'This site runs no separate analytics product. It does not use Google Analytics, Plausible or third-party session recording. Traffic information comes from aggregate reports in AdSense and Google Search Console.',
      },

      { t: 'h2', x: 'Your rights' },
      {
        t: 'p',
        x: 'If you are in the EEA, the UK or Switzerland, the GDPR gives you rights of access, rectification, erasure, restriction, portability and objection. If you are a California resident, the CCPA/CPRA gives you rights to know, delete, correct and opt out of the sale or sharing of personal information.',
      },
      {
        t: 'p',
        x: `JunePoint does not operate accounts, mailing lists or a user database. The only personal data it is likely to hold about you is an email you have sent. To exercise any right, write to [${site.email}](mailto:${site.email}). For data held by Google in connection with advertising, use Google’s controls linked above; JunePoint cannot act on those requests.`,
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

  {
    path: '/legal/terms/',
    title: 'Terms of Use | JunePoint',
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
        x: 'To the maximum extent permitted by law, JunePoint and its author are not liable for any indirect, incidental, consequential or punitive damages, or any loss of profits, revenue, data or goodwill, arising from your use of this site or reliance on its content.',
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

  {
    path: '/legal/editorial-policy/',
    title: 'Editorial Policy | How Research Is Published',
    h1: 'Editorial policy',
    eyebrow: 'Legal',
    parent: legalParent,
    description:
      'How JunePoint researches buying guides, what our methodology can and cannot tell you, and the rules we hold ourselves to.',
    standfirst: 'This policy explains the research behind each buying guide and the limits of that method.',
    updated: UPDATED,
    priority: '0.4',
    blocks: [
      {
        t: 'note',
        kind: 'warn',
        title: 'The most important thing on this page',
        x: 'The buying guides are **desk research, not hands-on lab testing.** They do not include large-scale backup deployments or extended payroll trials. Use the stated method and limitations when weighing the findings.',
      },

      { t: 'h2', x: 'What we actually do' },
      {
        t: 'ol',
        items: [
          '**Define the buyer.** Each guide identifies the relevant team size, technical capability and regulatory position so readers can judge whether a recommendation fits.',
          '**Read the primary sources.** Research uses vendor documentation, published pricing, security whitepapers, trust centres, status-page history, sub-processor lists, DPAs and support SLAs.',
          '**Set the criteria before the shortlist.** Criteria are defined before products are shortlisted so they do not simply justify a preferred option.',
          '**State strengths and poor fits.** Each entry includes trade-offs rather than treating one product as the default choice.',
          '**List questions for the vendor.** Quoted price, migration path and exit terms depend on the buyer’s circumstances and require direct confirmation.',
        ],
      },

      { t: 'h2', x: 'What this method cannot tell you' },
      {
        t: 'ul',
        items: [
          '**Restore reliability under pressure.** Documentation cannot show whether a backup product will restore cleanly during an incident. Run a restore test before relying on it.',
          '**Real support quality.** Published SLAs describe the floor, not the experience. Ask for references from customers your size.',
          '**Your negotiated price.** List pricing is a starting position in this market. Mid-market and enterprise deals routinely land well below it.',
          '**Detection efficacy.** For security products, independent testing labs run controlled evaluations we cannot replicate. We point to them rather than pretending to substitute for them.',
        ],
      },

      { t: 'h2', x: 'Rules we hold ourselves to' },
      {
        t: 'ul',
        items: [
          '**No paid placement.** Vendors cannot buy mentions, positions, links or favourable coverage. The site does not publish sponsored posts, guest posts or paid link insertions.',
          '**No fabricated testing.** The site does not publish invented benchmark scores, ratings from tests that were not run or unsupported claims about time spent with products.',
          '**Advertising is separated from editorial.** Ads are served programmatically by Google. We do not know which advertisers appear on a page, and advertisers have no input into content.',
          '**Prices are dated.** Pricing is stated with the date we last verified it and a note to confirm with the vendor, because it moves.',
          '**Corrections are made in place.** When we get something wrong we fix the page, update the date, and note material corrections rather than deleting quietly.',
        ],
      },

      { t: 'h2', x: 'Affiliate links' },
      {
        t: 'p',
        x: 'At the time of writing, this site carries **no affiliate links**. Revenue comes from display advertising only. If that changes, affiliate relationships will be disclosed on every affected page and in the [advertising disclosure](/legal/disclosure/) before any affiliate link is published.',
      },

      { t: 'h2', x: 'Corrections' },
      {
        t: 'p',
        x: `Spotted an error? Email [${site.email}](mailto:${site.email}) with the URL and the specific claim. Corrections are prioritised over new work.`,
      },
    ],
  },

  {
    path: '/legal/disclosure/',
    title: 'Advertising Disclosure | JunePoint',
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

      { t: 'h2', x: 'Where ads appear and where they do not' },
      {
        t: 'table',
        head: ['Area', 'Advertising'],
        rows: [
          ['/tools/, /guides/, /reviews/, /resources/', 'Yes. Display units appear within and alongside the content'],
          ['The JunePoint Studio portfolio at /', 'No. No ad units or advertising code are loaded'],
          ['Legal, about and contact pages', 'No'],
        ],
      },
      {
        t: 'p',
        x: 'Ad units are labelled "Advertisement" and kept out of the navigation. They are not styled as editorial links or buttons. Please report any ad that appears to be part of the editorial content.',
      },

      { t: 'h2', x: 'What advertising does not buy' },
      {
        t: 'ul',
        items: [
          'Advertisers cannot pay for coverage or influence what is published.',
          'Positions in buying guides are not for sale.',
          'The site does not publish sponsored links, paid guest posts or link insertions.',
          'Vendors do not receive pages for pre-publication review.',
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
        x: 'JunePoint has not accepted free licences, hardware, paid travel or gifts in exchange for coverage. When the studio has commercial experience with a product, that relationship is stated on the page.',
      },

      { t: 'h2', x: 'Controlling the ads you see' },
      {
        t: 'p',
        x: 'Personalised advertising can be turned off at [Google Ads Settings](https://adssettings.google.com), and third-party vendor cookies at [aboutads.info/choices](https://optout.aboutads.info/). Full detail is in the [privacy policy](/legal/privacy/).',
      },
    ],
  },
];
