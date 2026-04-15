import { useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/UI';

export default function UploadPage({ setPage, setDbCount }) {
  const toast = useToast();
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast('Only CSV files supported.', 'error'); return; }
    setUploading(true);
    setProgress(15);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setProgress(40);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      setProgress(80);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Upload failed');

      setProgress(100);
      setLastResult(data);
      setDbCount(data.total_db_size || 0);
      toast(`✓ ${data.message}`, 'success');
    } catch (err) {
      toast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <main className="page page-sm fade-up">
      <h1 className="page-heading">Upload Dataset</h1>
      <p className="page-sub">
        Upload a Scopus / Web of Science CSV export. The backend will generate semantic embeddings and store them in ChromaDB.
      </p>

      {/* Expected columns hint */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <p className="section-title">Expected CSV columns</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {['Author full names', 'Title', 'Year', 'Source title', 'Volume', 'Cited by', 'Abstract', 'Author Keywords', 'Index Keywords', 'Publisher'].map(c => (
            <span key={c} className="tag tag-subtle">{c}</span>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`upload-zone${drag ? ' drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = null; }}
        />
        <div className="upload-icon">📂</div>
        <p className="upload-title">{drag ? 'Drop to upload' : 'Drop CSV here or click to browse'}</p>
        <p className="upload-hint">Supports Scopus &amp; Web of Science exports</p>
        <Button variant="ghost" size="sm" loading={uploading} onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
          Browse files
        </Button>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Result */}
      {lastResult && (
        <div className="card fade-up" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>✓ Upload successful</p>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{lastResult.message}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="section-title">Total DB size</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 20, color: 'var(--blue)', fontWeight: 700 }}>
                {lastResult.total_db_size?.toLocaleString()}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <Button size="sm" onClick={() => setPage('search')}>Search these papers →</Button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ marginTop: 24 }}>
        <p className="section-title">Processing pipeline</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {[
            ['1', 'Parse CSV', 'Columns normalized, NaN cleaned.'],
            ['2', 'Embed', 'SentenceTransformers encodes Title + Abstract per paper.'],
            ['3', 'Store', 'Vectors + metadata saved to local ChromaDB.'],
            ['4', 'Search', 'Cosine similarity retrieval at query time.'],
          ].map(([n, title, desc]) => (
            <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)', background: 'var(--blue-dim)', padding: '2px 7px', borderRadius: '99px', flexShrink: 0, marginTop: 2 }}>{n}</span>
              <div>
                <p style={{ fontWeight: 500, fontSize: 13 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
