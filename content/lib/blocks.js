/**
 * Content block renderer.
 *
 * Articles are authored as arrays of small typed blocks rather than raw HTML so
 * that structure stays machine-readable: headings feed the table of contents,
 * `faq` blocks feed FAQPage schema, and `pick` blocks feed product schema.
 */

const { esc, inline, slugify } = require('./html');

/** Blocks that become h2 entries in the table of contents. */
function headings(blocks) {
  return blocks
    .filter((b) => b.t === 'h2')
    .map((b) => ({ id: b.id || slugify(b.x), text: b.x }));
}

/** Every FAQ pair in a document, for FAQPage structured data. */
function faqs(blocks) {
  return blocks.filter((b) => b.t === 'faq').flatMap((b) => b.items);
}

function renderTable(block) {
  const head = block.head
    ? `<thead><tr>${block.head.map((h) => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead>`
    : '';
  const body = block.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, i) => (i === 0 ? `<th scope="row">${inline(cell)}</th>` : `<td>${inline(cell)}</td>`))
          .join('')}</tr>`
    )
    .join('');
  return `<div class="jp-table-wrap"><table class="jp-table">${head}<tbody>${body}</tbody></table>${
    block.caption ? `<p class="jp-table-note">${inline(block.caption)}</p>` : ''
  }</div>`;
}

function renderPick(block, index) {
  const rank = block.rank || index + 1;
  const pros = (block.pros || []).map((p) => `<li>${inline(p)}</li>`).join('');
  const cons = (block.cons || []).map((c) => `<li>${inline(c)}</li>`).join('');
  const meta = [
    block.price ? `<div><dt>Pricing</dt><dd>${inline(block.price)}</dd></div>` : '',
    block.bestFor ? `<div><dt>Best for</dt><dd>${inline(block.bestFor)}</dd></div>` : '',
    block.deployment ? `<div><dt>Deployment</dt><dd>${inline(block.deployment)}</dd></div>` : '',
  ].join('');

  return `<section class="jp-pick" id="${esc(block.id || slugify(block.name))}">
  <header class="jp-pick-head">
    <span class="jp-pick-rank" aria-hidden="true">${esc(rank)}</span>
    <div>
      <h3 class="jp-pick-name">${inline(block.name)}</h3>
      ${block.award ? `<p class="jp-pick-award">${inline(block.award)}</p>` : ''}
    </div>
  </header>
  ${block.summary ? `<p class="jp-pick-summary">${inline(block.summary)}</p>` : ''}
  ${meta ? `<dl class="jp-pick-meta">${meta}</dl>` : ''}
  ${(block.body || []).map((p) => `<p>${inline(p)}</p>`).join('')}
  <div class="jp-proscons">
    ${pros ? `<div class="jp-pros"><h4>Strengths</h4><ul>${pros}</ul></div>` : ''}
    ${cons ? `<div class="jp-cons"><h4>Trade-offs</h4><ul>${cons}</ul></div>` : ''}
  </div>
</section>`;
}

function renderBlock(block, index) {
  switch (block.t) {
    case 'p':
      return `<p>${inline(block.x)}</p>`;

    case 'lede':
      return `<p class="jp-lede">${inline(block.x)}</p>`;

    case 'h2':
      return `<h2 id="${esc(block.id || slugify(block.x))}">${inline(block.x)}</h2>`;

    case 'h3':
      return `<h3 id="${esc(block.id || slugify(block.x))}">${inline(block.x)}</h3>`;

    case 'ul':
      return `<ul>${block.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;

    case 'ol':
      return `<ol>${block.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`;

    case 'code':
      return `<pre class="jp-code"${block.lang ? ` data-lang="${esc(block.lang)}"` : ''}><code>${esc(
        block.x
      )}</code></pre>`;

    case 'note':
      return `<aside class="jp-note jp-note--${esc(block.kind || 'info')}">
        ${block.title ? `<p class="jp-note-title">${inline(block.title)}</p>` : ''}
        <p>${inline(block.x)}</p>
      </aside>`;

    case 'takeaways':
      return `<aside class="jp-takeaways">
        <h2 id="key-takeaways">${esc(block.title || 'Key takeaways')}</h2>
        <ul>${block.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>
      </aside>`;

    case 'steps':
      return `<ol class="jp-steps">${block.items
        .map(
          (s) =>
            `<li><h3 id="${esc(slugify(s.title))}">${inline(s.title)}</h3>${
              Array.isArray(s.x) ? s.x.map((p) => `<p>${inline(p)}</p>`).join('') : `<p>${inline(s.x)}</p>`
            }${s.code ? `<pre class="jp-code"><code>${esc(s.code)}</code></pre>` : ''}</li>`
        )
        .join('')}</ol>`;

    case 'table':
      return renderTable(block);

    case 'pick':
      return renderPick(block, index);

    case 'faq':
      return `<section class="jp-faq">
        <h2 id="${esc(block.id || 'faq')}">${esc(block.title || 'Frequently asked questions')}</h2>
        ${block.items
          .map(
            (item) => `<details class="jp-faq-item">
              <summary><h3>${inline(item.q)}</h3></summary>
              <div class="jp-faq-answer">${
                Array.isArray(item.a) ? item.a.map((p) => `<p>${inline(p)}</p>`).join('') : `<p>${inline(item.a)}</p>`
              }</div>
            </details>`
          )
          .join('')}
      </section>`;

    case 'cards':
      return `<div class="jp-cards">${block.items
        .map(
          (c) => `<a class="jp-card" href="${esc(c.href)}">
            ${c.eyebrow ? `<span class="jp-card-eyebrow">${esc(c.eyebrow)}</span>` : ''}
            <h3>${esc(c.title)}</h3>
            <p>${esc(c.desc)}</p>
          </a>`
        )
        .join('')}</div>`;

    case 'html':
      return block.x;

    default:
      throw new Error(`Unknown content block type: ${block.t}`);
  }
}

/** Render a document, splicing in ad units at the requested block offsets. */
function render(blocks, { adAt = {}, renderAd = () => '' } = {}) {
  return blocks
    .map((block, i) => {
      const ad = adAt[i] ? renderAd(adAt[i]) : '';
      return ad + renderBlock(block, i);
    })
    .join('\n');
}

module.exports = { render, renderBlock, headings, faqs };
