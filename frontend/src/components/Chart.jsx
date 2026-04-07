import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts'

const SENTIMENT_COLORS = {
  Positive: '#10b981',
  Negative: '#ef4444',
  Neutral: '#9ca3af'
}

const THEME_COLORS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981',
  '#ef4444', '#06b6d4', '#f97316', '#84cc16'
]

function Chart({ analytics, onThemeClick, chartType }) {
  if (chartType === 'bar') {
    const data = Object.entries(analytics.theme_distribution || {})
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    return (
      <div className="chart-card">
        <h3>Theme Distribution {onThemeClick && '— click a bar to drill down'}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 12, left: -8, bottom: 60 }}
            onClick={(e) => {
              if (e?.activeLabel && onThemeClick) onThemeClick(e.activeLabel)
            }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" cursor={onThemeClick ? 'pointer' : 'default'} radius={[4,4,0,0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (chartType === 'pie') {
    const data = Object.entries(analytics.sentiment_breakdown || {}).map(([name, value]) => ({
      name,
      value
    }))

    return (
      <div className="chart-card">
        <h3>Sentiment Breakdown</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={45}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={SENTIMENT_COLORS[entry.name] || '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip formatter={(val, name) => [val, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}

export default Chart
