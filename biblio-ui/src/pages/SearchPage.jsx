import { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { Button, Tag, Empty } from '../components/UI';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

/* ── Colour palette for clusters ─────────────────── */
const PALETTE = [
  'var(--blue)', 'var(--purple)', 'var(--cyan)',
  'var(--green)', 'var(--amber)', '#f472b6', '#34d399',
];

/* ── Score colour helper ─────────────────────────── */
function scoreColor(s) {
  if (s >= 0.85) return 'var(--green)';
  if (s >= 0.65) return 'var(--blue)';
  return 'var(--amber)';
}

/* ── Similarity matrix of top papers ─────────── */
function SimilarityMatrix({ papers }) {
  const [hover, setHover] = useState(null);

  if (!papers || papers.length < 2) return null;

  const maxPapers = papers.slice(0, 8);

  // Build a pseudo cosine-similarity matrix from semantic_score (approximate)
  // We'll use 1 - |scoreA - scoreB| as a proxy since we only have individual scores
  const matrix = useMemo(() => {
    return maxPapers.map((a, i) =>
      maxPapers.map((b, j) => {
        if (i === j) return 1;
        return parseFloat((1 - Math.abs(a.semantic_score - b.semantic_score) * 0.5).toFixed(3));
      })
    );
  }, [maxPapers]);

  const shortTitle = t => t ? (t.length > 22 ? t.slice(0, 22) + '…' : t) : 'Paper';

  return (
    <div className="chart-card" style={{ gridColumn: '1/-1', position: 'relative' }}>
      <p className="chart-title">Semantic Similarity Matrix <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 400 }}>(top {maxPapers.length} results)</span></p>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${maxPapers.length}, 1fr)`, gap: 2, minWidth: 500 }}>
          {/* Header row */}
          <div />
          {maxPapers.map((p, j) => (
            <div key={j} style={{ fontSize: 9, color: 'var(--subtle)', textAlign: 'center', padding: '0 2px', height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
              P{j + 1}
            </div>
          ))}

          {/* Data rows */}
          {matrix.map((row, i) => (
            <>
              <div key={`l${i}`} style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', height: 28, paddingRight: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                P{i + 1}: {shortTitle(maxPapers[i]?.title)}
              </div>
              {row.map((val, j) => {
                const alpha = val;
                const bg = i === j
                  ? '#3b82f6'
                  : `rgba(59,130,246,${(alpha * 0.8).toFixed(2)})`;
                const isHov = hover && hover[0] === i && hover[1] === j;
                return (
                  <div
                    key={j}
                    className="sim-cell"
                    style={{ background: bg, height: 28, opacity: isHov ? 0.6 : 1 }}
                    title={`P${i + 1} ↔ P${j + 1}: ${(val * 100).toFixed(1)}%`}
                    onMouseEnter={() => setHover([i, j])}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {maxPapers.map((p, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--subtle)' }}>P{i + 1}: {shortTitle(p.title)}</span>
        ))}
      </div>

      {/* Colour legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--subtle)' }}>Low similarity</span>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'linear-gradient(90deg, rgba(59,130,246,0.05), #3b82f6)' }} />
        <span style={{ fontSize: 11, color: 'var(--subtle)' }}>High</span>
      </div>
    </div>
  );
}

/* ── Year bar chart ──────────────────────────────── */
function YearChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="chart-card">
      <p className="chart-title">Publications by Year</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
          <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'var(--text)' }}
            cursor={{ fill: '#1e2d4530' }}
          />
          <Bar dataKey="papers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Citations scatter ───────────────────────────── */
function CitationScatter({ papers }) {
  if (!papers || papers.length === 0) return null;
  const data = papers.map((p, i) => ({
    x: p.year || 2020,
    y: p.citations || 0,
    z: (p.semantic_score || 0) * 100,
    name: p.title,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="chart-card">
      <p className="chart-title">Citation Impact vs Year <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 400 }}>(bubble = similarity %)</span></p>
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
          <XAxis dataKey="x" name="Year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} type="number" domain={['auto', 'auto']} />
          <YAxis dataKey="y" name="Citations" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <ZAxis dataKey="z" range={[40, 200]} name="Similarity %" />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="tooltip-box" style={{ position: 'static' }}>
                  <p style={{ fontWeight: 600, marginBottom: 4, maxWidth: 200 }}>{d.name}</p>
                  <p>Year: {d.x} · Citations: {d.y} · Sim: {d.z?.toFixed(0)}%</p>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.75} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Top keywords bar ────────────────────────────── */
function KeywordChart({ papers }) {
  const freq = useMemo(() => {
    const counts = {};
    papers.forEach(p => {
      (p.keywords || []).forEach(k => {
        if (!k || k === 'N/A') return;
        const key = k.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw, count]) => ({ kw, count }));
  }, [papers]);

  if (freq.length === 0) return null;
  const max = freq[0].count;

  return (
    <div className="chart-card">
      <p className="chart-title">Top Keywords</p>
      <div className="bar-list">
        {freq.map(({ kw, count }) => (
          <div key={kw} className="bar-row">
            <span className="bar-label" title={kw}>{kw}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(count / max) * 100}%` }} /></div>
            <span className="bar-val">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cluster distribution ────────────────────────── */
function ClusterPanel({ clusters }) {
  if (!clusters || clusters.length === 0) return null;
  return (
    <div className="chart-card" style={{ gridColumn: '1/-1' }}>
      <p className="chart-title">Cluster Distribution <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 400 }}>from AI analysis</span></p>
      <div className="cluster-grid" style={{ marginTop: 10 }}>
        {clusters.map((c, i) => (
          <div key={i} className="cluster-card" style={{ borderColor: PALETTE[i % PALETTE.length] + '40' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PALETTE[i % PALETTE.length] }} />
            <p className="cluster-name">{c.name || `Cluster ${i + 1}`}</p>
            {c.count != null && (
              <p className="cluster-count" style={{ color: PALETTE[i % PALETTE.length] }}>
                {c.count.toLocaleString()} papers
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Research Gaps ───────────────────────────────── */
function GapsPanel({ gaps }) {
  if (!gaps || gaps.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {gaps.map((g, i) => (
        <div key={i} className="gap-item">
          <span className="gap-num">Gap #{i + 1}</span>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{g.gap}</p>
            {g.confidence != null && (
              <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
                Confidence: {(g.confidence * 100).toFixed(0)}%
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── AI Insight box ──────────────────────────────── */
function InsightBox({ text, query }) {
  if (!text) return null;
  return (
    <div className="insight-box">
      <div className="insight-header">
        <div className="insight-avatar">🤖</div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>AI Research Analyst</p>
          <p style={{ fontSize: 11, color: 'var(--subtle)' }}>Gemini · context-grounded synthesis for "{query}"</p>
        </div>
      </div>
      <div className="insight-body">{text}</div>
    </div>
  );
}

/* ── Single paper card ───────────────────────────── */
function PaperCard({ paper, idx }) {
  const [open, setOpen] = useState(false);
  const score = paper.semantic_score ?? 0;

  return (
    <div className="paper-card fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
      <div className="paper-meta">
        <Tag color="blue">{paper.year || '—'}</Tag>
        {paper.journal && <Tag color="subtle">{paper.journal}</Tag>}
        {paper.open_access && <Tag color="green">Open Access</Tag>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="paper-score-bar">
            <span style={{ fontSize: 10, color: 'var(--subtle)' }}>Sim</span>
            <div className="score-track">
              <div className="score-fill" style={{ width: `${score * 100}%`, background: scoreColor(score) }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: scoreColor(score), fontWeight: 600 }}>
              {(score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <h3 className="paper-title">{paper.title || 'Untitled'}</h3>
      <p className="paper-authors">{(Array.isArray(paper.authors) ? paper.authors : [paper.authors]).join('; ')}</p>

      {open && paper.abstract && (
        <p className="paper-abstract">{paper.abstract}</p>
      )}

      {paper.keywords?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {paper.keywords.slice(0, 8).map((k, i) => <Tag key={i} color="cyan">{k}</Tag>)}
        </div>
      )}

      <div className="paper-actions">
        {paper.abstract && (
          <button className="btn btn-secondary btn-sm" onClick={() => setOpen(o => !o)}>
            {open ? '↑ Hide abstract' : '↓ Show abstract'}
          </button>
        )}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: 'none' }}
          >
            View paper ↗
          </a>
        )}
        {paper.citations > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--mono)' }}>
            {paper.citations.toLocaleString()} citations
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SEARCH PAGE (main export)
═══════════════════════════════════════════════════ */
export default function SearchPage({ dbCount }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('semantic');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [tab, setTab] = useState('papers');

  const handleSearch = async () => {
    if (!query.trim()) { toast('Enter a search query.', 'error'); return; }
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Search failed');
      setResults(data);
      setTab('papers');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'papers',   label: '📄 Papers',          count: results?.papers?.length },
    { id: 'analysis', label: '📊 Bibliometrics',    count: null },
    { id: 'clusters', label: '🗂 Clusters',          count: results?.clusters?.length },
    { id: 'gaps',     label: '🎯 Research Gaps',    count: results?.research_gaps?.length },
    { id: 'insight',  label: '🤖 AI Insight',       count: null },
  ];

  return (
    <main className="page fade-up">
      <div style={{ maxWidth: 720, margin: '0 auto 28px' }}>
        <h1 className="page-heading">Semantic Search</h1>
        <p className="page-sub">
          Vector similarity search across your uploaded dataset.{' '}
          {dbCount > 0 && <span style={{ color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{dbCount.toLocaleString()} papers indexed.</span>}
        </p>

        {/* Mode tabs */}
        <div className="mode-tabs">
          {[['semantic', '🔬 Semantic'], ['keyword', '🔤 Keyword']].map(([m, label]) => (
            <button key={m} className={`mode-tab${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>{label}</button>
          ))}
        </div>

        {/* Search bar */}
        <div className="search-wrap">
          <span style={{ fontSize: 18, opacity: 0.4 }}>🔍</span>
          <input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={mode === 'semantic'
              ? 'Describe a topic, method, or research question…'
              : 'Enter keywords, author names…'}
          />
          <Button loading={loading} onClick={handleSearch} style={{ borderRadius: 9, padding: '10px 22px' }}>
            {loading ? 'Searching' : 'Search →'}
          </Button>
        </div>
      </div>

      {/* ── No results yet ── */}
      {!results && !loading && (
        <Empty icon="🔬" title="Nothing searched yet" hint="Upload a dataset first, then run a semantic search." />
      )}

      {/* ── Results ── */}
      {results && (
        <>
          {/* Stats bar */}
          <div className="stats-bar">
            <div className="stat-item"><span className="stat-dot" /><span className="stat-label">DB Size</span><span className="stat-val">{results.total_papers?.toLocaleString()}</span></div>
            <div className="stat-item"><span className="stat-label">Query</span><span className="stat-val" style={{ color: 'var(--blue)' }}>"{results.query}"</span></div>
            <div className="stat-item"><span className="stat-label">Results</span><span className="stat-val">{results.papers?.length}</span></div>
            <div className="stat-item"><span className="stat-label">Embed time</span><span className="stat-val" style={{ fontFamily: 'var(--mono)' }}>{results.embedding_time_ms}ms</span></div>
          </div>

          {/* Tab row */}
          <div className="result-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`result-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
                {t.count != null && <span className="tab-count">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* PAPERS TAB */}
          {tab === 'papers' && (
            results.papers?.length > 0
              ? results.papers.map((p, i) => <PaperCard key={p.id || i} paper={p} idx={i} />)
              : <Empty icon="📭" title="No papers returned" hint="Try a different query or upload more data." />
          )}

          {/* BIBLIOMETRICS TAB */}
          {tab === 'analysis' && (
            <div className="chart-grid">
              <YearChart data={results.trend_data} />
              <CitationScatter papers={results.papers} />
              <KeywordChart papers={results.papers} />
              <SimilarityMatrix papers={results.papers} />
            </div>
          )}

          {/* CLUSTERS TAB */}
          {tab === 'clusters' && (
            results.clusters?.length > 0
              ? <div className="chart-grid"><ClusterPanel clusters={results.clusters} /></div>
              : <Empty icon="🗂" title="No clusters returned" hint="Ensure the AI insights service is connected." />
          )}

          {/* RESEARCH GAPS TAB */}
          {tab === 'gaps' && (
            results.research_gaps?.length > 0
              ? <GapsPanel gaps={results.research_gaps} />
              : <Empty icon="🎯" title="No research gaps identified" hint="Run a broader semantic query for gap analysis." />
          )}

          {/* AI INSIGHT TAB */}
          {tab === 'insight' && (
            results.ai_insight
              ? <InsightBox text={results.ai_insight} query={results.query} />
              : <Empty icon="🤖" title="No AI insight" hint="Ensure the Gemini API key is configured in the backend." />
          )}
        </>
      )}
    </main>
  );
}
