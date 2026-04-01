import { useRef, useState } from 'react'

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/avi', 'video/webm']
const ACCEPTED_EXT = ['.mp4', '.mov', '.avi', '.webm']

export default function VideoDropzone({ file, onChange }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState(null)

  function validate(f) {
    if (!f) return null
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXT.includes(ext)) {
      return `Unsupported format. Please upload ${ACCEPTED_EXT.join(', ')}`
    }
    if (f.size > 500 * 1024 * 1024) {
      return 'File exceeds 500 MB limit.'
    }
    return null
  }

  function handleFile(f) {
    const err = validate(f)
    setError(err)
    if (!err) onChange(f)
  }

  function onInputChange(e) {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  function formatSize(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}
          ${file ? 'border-green-400 bg-green-50' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={onInputChange}
        />
        {file ? (
          <div className="space-y-2">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-green-700">{file.name}</p>
            <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
            <p className="text-xs text-blue-500 underline">Click to change</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📹</div>
            <p className="font-semibold text-gray-700">
              Drag & drop your video here
            </p>
            <p className="text-sm text-gray-400">or tap to browse</p>
            <p className="text-xs text-gray-400">MP4, MOV, AVI, WebM · Max 500 MB</p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
