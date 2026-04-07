function Detail({ theme, reviews, onClose }) {
  const positive = reviews.filter(r => r.sentiment === 'Positive').length
  const negative = reviews.filter(r => r.sentiment === 'Negative').length
  const neutral  = reviews.filter(r => r.sentiment === 'Neutral').length

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>Theme Detail — {theme}</h3>
        <button onClick={onClose}>Close ✕</button>
      </div>

      <div className="detail-stats">
        <span>Total: {reviews.length}</span>
        <span className="stat-positive">Positive: {positive}</span>
        <span className="stat-negative">Negative: {negative}</span>
        <span className="stat-neutral">Neutral: {neutral}</span>
      </div>

      <div className="detail-reviews">
        {reviews.map((r, i) => (
          <div key={i} className={`review-card ${r.sentiment?.toLowerCase() ?? 'neutral'}`}>
            <div className="rc-product">{r.product}</div>
            <div className="rc-text">{r.review_text}</div>
            {Array.isArray(r.key_phrases) && r.key_phrases.length > 0 && (
              <div className="rc-phrases">Key phrases: {r.key_phrases.join(' · ')}</div>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No reviews in this theme.</p>
        )}
      </div>
    </div>
  )
}

export default Detail
