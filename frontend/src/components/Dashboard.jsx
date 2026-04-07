import { useState, useEffect } from 'react'
import axios from 'axios'
import Chart from './Chart'
import ReviewTable from './ReviewTable'
import Detail from './Detail'

const API_URL = 'http://localhost:8000'

function Dashboard({ uploadId }) {
  const [results, setResults] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsResp, analyticsResp] = await Promise.all([
          axios.get(`${API_URL}/results/${uploadId}`),
          axios.get(`${API_URL}/analytics/${uploadId}`)
        ])
        setResults(resultsResp.data)
        setAnalytics(analyticsResp.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [uploadId])

  if (loading) {
    return <div className="loading">Loading results...</div>
  }

  const total = results.length
  const positive = results.filter(r => r.sentiment === 'Positive').length
  const positivePercent = total ? Math.round((positive / total) * 100) : 0

  const topTheme = analytics?.theme_distribution
    ? Object.entries(analytics.theme_distribution)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
    : 'N/A'

  return (
    <div className="dashboard">
      {/* Summary cards */}
      <div className="summary-cards">
        <div className="card">
          <div className="card-label">Total Reviews</div>
          <div className="card-value">{total}</div>
        </div>
        <div className="card">
          <div className="card-label">Positive %</div>
          <div className="card-value">{positivePercent}%</div>
        </div>
        <div className="card">
          <div className="card-label">Top Theme</div>
          <div className="card-value small">{topTheme}</div>
        </div>
      </div>

      {/* Charts */}
      {analytics && (
        <div className="charts-row">
          <Chart
            analytics={analytics}
            onThemeClick={setSelectedTheme}
            chartType="bar"
          />
          <Chart
            analytics={analytics}
            onThemeClick={null}
            chartType="pie"
          />
        </div>
      )}

      {/* Detail view */}
      {selectedTheme && (
        <Detail
          theme={selectedTheme}
          reviews={results.filter(r => r.theme === selectedTheme)}
          onClose={() => setSelectedTheme(null)}
        />
      )}

      {/* Reviews table */}
      <ReviewTable reviews={results} onThemeClick={setSelectedTheme} />
    </div>
  )
}

export default Dashboard
