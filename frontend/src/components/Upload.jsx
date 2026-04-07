import { useState, useRef } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:8000'

function Upload({ onComplete }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | analyzing | done | error
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setError('')
      setStatus('idle')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped)
      setError('')
      setStatus('idle')
    } else {
      setError('Please drop a .csv file')
    }
  }

  const handleSubmit = async () => {
    if (!file) return

    try {
      setStatus('uploading')
      setError('')

      const formData = new FormData()
      formData.append('file', file)

      const uploadResp = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const { upload_id, count } = uploadResp.data

      setStatus('analyzing')
      await axios.post(`${API_URL}/analyze/${upload_id}`)

      setStatus('done')
      onComplete(upload_id)
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Upload failed'
      setError(msg)
      setStatus('error')
    }
  }

  const statusText = {
    uploading: 'Uploading CSV...',
    analyzing: 'Analyzing with AI (this may take a minute)...',
    error: 'Upload & Analyze',
    idle: 'Upload & Analyze',
    done: 'Done!'
  }

  return (
    <div className="upload-container">
      <h2>Upload Reviews CSV</h2>
      <p className="subtitle">
        Upload your weekly customer reviews CSV and AI will automatically categorise
        each review by theme and sentiment.
      </p>

      <div
        className="file-drop-zone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="drop-icon">📄</span>
        {file ? (
          <>
            <p>Selected file:</p>
            <p className="file-name">{file.name}</p>
          </>
        ) : (
          <>
            <p>Drag & drop a CSV file here</p>
            <p style={{ marginTop: 6, fontSize: '0.8rem' }}>or click to browse</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
      </div>

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={!file || status === 'uploading' || status === 'analyzing'}
        style={{ width: '100%' }}
      >
        {statusText[status] || 'Upload & Analyze'}
      </button>

      {(status === 'uploading' || status === 'analyzing') && (
        <p className="upload-status">{statusText[status]}</p>
      )}

      {error && <div className="error-msg">{error}</div>}
    </div>
  )
}

export default Upload
