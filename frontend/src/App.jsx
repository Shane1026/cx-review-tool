import { useState } from 'react'
import Upload from './components/Upload'
import Dashboard from './components/Dashboard'

function App() {
  const [view, setView] = useState('upload')
  const [uploadId, setUploadId] = useState(null)

  const handleUploadComplete = (id) => {
    setUploadId(id)
    setView('dashboard')
  }

  const handleReset = () => {
    setUploadId(null)
    setView('upload')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>CX Review Intelligence</h1>
          <p>AI-powered thematic analysis for customer reviews</p>
        </div>
        {view === 'dashboard' && (
          <button className="btn-secondary" onClick={handleReset}>
            Upload New File
          </button>
        )}
      </header>
      <main className="app-main">
        {view === 'upload' && <Upload onComplete={handleUploadComplete} />}
        {view === 'dashboard' && <Dashboard uploadId={uploadId} />}
      </main>
    </div>
  )
}

export default App
