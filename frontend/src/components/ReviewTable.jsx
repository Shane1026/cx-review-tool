import { useState, useMemo } from 'react'

const THEMES = [
  'Product Quality', 'Efficacy', 'Taste/Smell', 'Packaging',
  'Delivery', 'Customer Service', 'Pricing', 'Other'
]
const SENTIMENTS = ['Positive', 'Negative', 'Neutral']

function SentimentBadge({ sentiment }) {
  const cls = {
    Positive: 'badge badge-positive',
    Negative: 'badge badge-negative',
    Neutral: 'badge badge-neutral'
  }[sentiment] || 'badge badge-neutral'
  return <span className={cls}>{sentiment || '—'}</span>
}

function ReviewTable({ reviews, onThemeClick }) {
  const [search, setSearch] = useState('')
  const [filterTheme, setFilterTheme] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = !search ||
        r.review_text?.toLowerCase().includes(search.toLowerCase()) ||
        r.product?.toLowerCase().includes(search.toLowerCase())
      const matchTheme = !filterTheme || r.theme === filterTheme
      const matchSentiment = !filterSentiment || r.sentiment === filterSentiment
      return matchSearch && matchTheme && matchSentiment
    })
  }, [reviews, search, filterTheme, filterSentiment])

  return (
    <div className="review-table-card">
      <h3>All Reviews ({filtered.length} of {reviews.length})</h3>
      <div className="filters">
        <input
          placeholder="Search reviews..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)}>
          <option value="">All Themes</option>
          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)}>
          <option value="">All Sentiments</option>
          {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterTheme || filterSentiment) && (
          <button
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
            onClick={() => { setSearch(''); setFilterTheme(''); setFilterSentiment('') }}
          >
            Clear
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Review</th>
              <th>Theme</th>
              <th>Sentiment</th>
              <th>Key Phrases</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{r.product}</td>
                <td className="review-text-cell">{r.review_text}</td>
                <td>
                  <span
                    className="badge badge-theme"
                    style={{ cursor: onThemeClick ? 'pointer' : 'default' }}
                    onClick={() => onThemeClick && r.theme && onThemeClick(r.theme)}
                    title={onThemeClick ? `Filter by ${r.theme}` : ''}
                  >
                    {r.theme || '—'}
                  </span>
                </td>
                <td><SentimentBadge sentiment={r.sentiment} /></td>
                <td className="key-phrases">
                  {Array.isArray(r.key_phrases)
                    ? r.key_phrases.join(' · ')
                    : (r.key_phrases || '—')}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                  No reviews match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReviewTable
