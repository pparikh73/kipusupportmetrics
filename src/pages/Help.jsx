import { useState, useMemo } from 'react'
import { ARTICLES } from '../lib/helpArticles'

// Render **bold** inside a plain string.
function inline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

// Build one flat, lowercased string from an article so we can do full-text search.
function articleText(a) {
  let s = `${a.title} ${a.summary} ${a.category}`
  a.blocks.forEach((b) => {
    if (b.text) s += ' ' + b.text
    if (b.caption) s += ' ' + b.caption
    if (b.items) s += ' ' + b.items.join(' ')
    if (b.headers) s += ' ' + b.headers.join(' ')
    if (b.rows) s += ' ' + b.rows.map((r) => r.join(' ')).join(' ')
  })
  return s.toLowerCase()
}

// A screenshot placeholder. Tries to load /help-images/<id>.jpg; until that file
// exists it shows a labelled grey box so it's obvious what's still needed.
function Shot({ id, caption }) {
  const [failed, setFailed] = useState(false)
  const src = `${import.meta.env.BASE_URL}help-images/${id}.jpg`
  return (
    <figure className="help-shot">
      {!failed ? (
        <img className="help-shot-img" src={src} alt={caption} onError={() => setFailed(true)} />
      ) : (
        <div className="help-shot-ph">
          <div className="help-shot-ph-id">{id}</div>
          <div className="help-shot-ph-cap">📷 {caption}</div>
          <div className="help-shot-ph-note">Screenshot coming soon</div>
        </div>
      )}
      <figcaption className="help-shot-cap">{caption}</figcaption>
    </figure>
  )
}

function Block({ block }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="help-h2">{block.text}</h2>
    case 'p':
      return <p className="help-p">{inline(block.text)}</p>
    case 'steps':
      return (
        <ol className="help-steps">
          {block.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
        </ol>
      )
    case 'list':
      return (
        <ul className="help-list">
          {block.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
        </ul>
      )
    case 'callout':
      return (
        <div className={`help-callout help-callout-${block.variant || 'info'}`}>
          <span className="help-callout-icon">
            {block.variant === 'warning' ? '⚠️' : block.variant === 'tip' ? '💡' : 'ℹ️'}
          </span>
          <span>{inline(block.text)}</span>
        </div>
      )
    case 'shot':
      return <Shot id={block.id} caption={block.caption} />
    case 'table':
      return (
        <div className="help-table-wrap">
          <table className="help-table">
            <thead>
              <tr>{block.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>{row.map((c, ci) => <td key={ci}>{inline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}

export default function Help() {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  // Pre-compute the searchable text once.
  const indexed = useMemo(
    () => ARTICLES.map((a) => ({ article: a, text: articleText(a) })),
    []
  )

  const q = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q) return indexed
    const terms = q.split(/\s+/)
    return indexed.filter(({ text }) => terms.every((t) => text.includes(t)))
  }, [q, indexed])

  const openArticle = openId ? ARTICLES.find((a) => a.id === openId) : null

  // ── Reading view ──────────────────────────────────────────────────────────
  if (openArticle) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn btn-secondary btn-sm" onClick={() => setOpenId(null)} style={{ marginBottom: 12 }}>
            ← Back to Help
          </button>
          <h1 className="page-title">{openArticle.title}</h1>
          <p className="page-subtitle">{openArticle.summary}</p>
        </div>
        <div className="help-article">
          {openArticle.blocks.map((b, i) => <Block key={i} block={b} />)}
        </div>
      </div>
    )
  }

  // ── Index / search view ──────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Help &amp; Playbook</h1>
        <p className="page-subtitle">Guides for using the tool. Search by keyword or pick an article below.</p>
      </div>

      <div className="help-search-wrap">
        <span className="help-search-icon">🔍</span>
        <input
          className="help-search"
          placeholder="Search the help articles… (e.g. tolerance, holiday, inactive agent)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="help-search-clear" onClick={() => setQuery('')} title="Clear">×</button>
        )}
      </div>

      {q && (
        <p className="help-results-count">
          {matches.length === 0
            ? 'No articles match your search.'
            : `${matches.length} article${matches.length === 1 ? '' : 's'} found`}
        </p>
      )}

      {matches.length === 0 && !q ? (
        <div className="empty-state"><h3>No articles yet</h3></div>
      ) : (
        <div className="help-grid">
          {matches.map(({ article }) => (
            <button key={article.id} className="help-card" onClick={() => setOpenId(article.id)}>
              <div className="help-card-cat">{article.category}</div>
              <div className="help-card-title">{article.title}</div>
              <div className="help-card-summary">{article.summary}</div>
              <div className="help-card-link">Read article →</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
