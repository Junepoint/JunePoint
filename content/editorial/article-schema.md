# Output schema

Return exactly one JSON object with this shape. No markdown fence, no commentary.

```json
{
  "slug": "must-match-the-assigned-slug",
  "title": "Under 60 characters, distinctive, no brand suffix",
  "h1": "Page heading, may differ from title",
  "eyebrow": "Short category label, e.g. Troubleshooting",
  "description": "Meta description, 70 to 160 characters",
  "standfirst": "One or two sentences under the h1. Says what the reader gets.",
  "keywords": ["primary term", "secondary term", "third term"],
  "cardDesc": "One line for listing pages, under 120 characters",
  "featured": false,
  "blocks": [ ... ]
}
```

## Block types

| `t` | Fields | Use for |
| --- | --- | --- |
| `p` | `x` | A paragraph |
| `lede` | `x` | Opening paragraph, slightly larger |
| `h2` | `x` | Section heading. Becomes a table-of-contents entry. |
| `h3` | `x` | Sub-heading |
| `ul` / `ol` | `items: []` | Bullet or numbered list |
| `code` | `lang`, `x` | A code sample. Never lint-checked, so it must be correct. |
| `note` | `kind`, `title`, `x` | Callout. `kind` is `info`, `tip`, `warn` or `danger`. |
| `takeaways` | `items: []` | Summary box near the top |
| `steps` | `items: [{title, x, code}]` | Ordered walkthrough |
| `table` | `head: []`, `rows: [[]]`, `caption` | Comparison table. First cell of each row is its header. |
| `faq` | `items: [{q, a}]` | **Required.** Feeds FAQPage structured data. |
| `cards` | `items: [{title, desc, href, eyebrow}]` | Links to related pages |

Inline formatting inside any text: `**bold**`, `*italic*`, `` `code` ``,
`[label](/internal/path/)`. Everything else is escaped, so no raw HTML.

## Structural expectations

- Open with `takeaways` or a `lede`, never a paragraph restating the title.
- Use `h2` to break the article into at least four sections.
- Include at least one `code` block for a developer topic, or one `table` for a
  comparison topic.
- Close with a `faq` block of five or six genuine questions. Write the questions
  the way a person would type them into a search box.
- Link to two or three existing pages using `cards` or inline links.
