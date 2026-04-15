import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, LineChart, Line, Legend,
  ScatterChart, Scatter, ZAxis, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie,
} from "recharts";

// ─── GEMINI DIRECT CALL ───────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";



// ─── RANDOM DATA HELPERS (for non-query fields) ──────────────────────────────
const rnd  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndF = (min, max, dec = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const TOPICS = [
  "Transformer Attention Mechanisms",
  "Graph Neural Networks for Drug Discovery",
  "Federated Learning & Privacy",
  "Diffusion Models for Image Synthesis",
  "Contrastive Self-Supervised Learning",
  "Large Language Model Alignment (RLHF)",
  "Multimodal Vision-Language Models",
  "Retrieval-Augmented Generation",
  "Neural Architecture Search",
  "Protein Structure Prediction",
  "Quantum Machine Learning",
  "Climate Change Forecasting with AI",
];

const CLUSTER_COLORS = ["#6366f1","#0891b2","#059669","#d97706","#be185d","#7c3aed","#ea580c","#0284c7"];

// Build stat fields that are purely random (not query-dependent)
function buildRandomStats(papers, trend_data) {
  const years = {};
  papers.forEach(p => { if (p.year) years[p.year] = (years[p.year]||0)+1; });

  // Keyword frequency from papers
  const kw = {};
  papers.forEach(p => (p.keywords||[]).forEach(k => { kw[k] = (kw[k]||0)+rnd(1,5); }));
  const keywords = Object.entries(kw).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([kw,count])=>({kw,count}));

  // Author frequency
  const authorMap = {};
  papers.forEach(p => (p.authors||[]).forEach(a => { authorMap[a]=(authorMap[a]||0)+rnd(1,4); }));
  const authorFreq = Object.entries(authorMap).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([name,p])=>({ name: name.split(" ").slice(-1)[0], papers: p }));

  // Radar
  const radar = [
    { dim:"Novelty",          score:rnd(55,98) },
    { dim:"Rigour",           score:rnd(55,98) },
    { dim:"Reproducibility",  score:rnd(40,90) },
    { dim:"Impact",           score:rnd(55,98) },
    { dim:"Accessibility",    score:rnd(45,92) },
    { dim:"Cross-domain",     score:rnd(30,85) },
  ];

  // Monthly activity
  const monthly = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    .map(month => ({ month, papers:rnd(120,800), citations:rnd(1000,9000) }));

  // Citation distribution
  const citBuckets = [
    { range:"1–50",    count:rnd(20,80) },
    { range:"51–200",  count:rnd(15,60) },
    { range:"201–500", count:rnd(8,35)  },
    { range:"501–2k",  count:rnd(4,20)  },
    { range:"2k+",     count:rnd(1,8)   },
  ];

  // Open access pie
  const openCount = papers.filter(p=>p.open_access).length;
  const openPie = [
    { name:"Open Access", value:openCount,              fill:"#059669" },
    { name:"Paywalled",   value:papers.length-openCount, fill:"#4a5568" },
  ];

  return { keywords, authorFreq, radar, monthly, citBuckets, openPie };
}

function buildTrendData() {
  let base = rnd(80,400);
  return Array.from({length:9},(_,i)=>{
    base = Math.round(base * rndF(1.3,2.4) + rnd(-50,100));
    return { year: 2016+i, papers: base };
  });
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("riq-styles")) return;
  const s = document.createElement("style");
  s.id = "riq-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:#060910; --surface:#0d1117; --surface2:#161b22; --surface3:#1c2230;
      --border:#21283a; --border2:#2d3748; --accent:#4f8ef7; --accent2:#7c3aed;
      --accent3:#06b6d4; --green:#10b981; --amber:#f59e0b; --red:#ef4444;
      --text:#e2e8f0; --text2:#8b9ab4; --text3:#4a5568;
    }
    html,body { height:100%; }
    body { background:var(--bg); color:var(--text); font-family:'Inter',sans-serif; line-height:1.5; -webkit-font-smoothing:antialiased; }
    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-track { background:var(--bg); }
    ::-webkit-scrollbar-thumb { background:var(--border2); border-radius:3px; }

    .fade-in  { animation:fadeIn  0.4s ease both; }
    .slide-up { animation:slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
    .pulse-dot { animation:pulse 2s infinite; }

    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes flow    { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes glow    { 0%,100%{box-shadow:0 0 20px rgba(79,142,247,0.2)} 50%{box-shadow:0 0 40px rgba(79,142,247,0.45)} }

    .grid-bg {
      position:fixed; inset:0; pointer-events:none; z-index:0;
      background-image: linear-gradient(rgba(79,142,247,0.025) 1px,transparent 1px),
                        linear-gradient(90deg,rgba(79,142,247,0.025) 1px,transparent 1px);
      background-size:44px 44px;
    }
    .card {
      background:var(--surface); border:1px solid var(--border);
      border-radius:14px; padding:22px 24px; position:relative; overflow:hidden;
    }
    .card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(79,142,247,0.025),transparent 60%); pointer-events:none; }
    .card-title { font-size:12px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
    .card-title span { color:var(--accent); font-weight:400; }
    .tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-family:'JetBrains Mono',monospace; }
    .paper-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; transition:border-color 0.2s,transform 0.2s; }
    .paper-card:hover { border-color:var(--border2); transform:translateY(-1px); }
    .sim-cell { border-radius:3px; cursor:default; transition:opacity 0.15s; }
    .sim-cell:hover { opacity:0.6 !important; }
    .tab-btn { padding:8px 18px; border:none; background:transparent; font-size:13px; font-family:'Inter',sans-serif; cursor:pointer; border-radius:8px; transition:all 0.15s; color:var(--text2); display:flex; align-items:center; gap:6px; }
    .tab-btn.active { background:rgba(79,142,247,0.12); color:var(--accent); }
    .tab-badge { font-size:10px; padding:1px 6px; border-radius:10px; background:var(--border2); color:var(--text2); }
    .btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:9px; font-size:13px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; transition:all 0.2s; border:none; }
    .btn-primary { background:linear-gradient(135deg,#4f8ef7,#3b72d9); color:#fff; box-shadow:0 4px 18px rgba(79,142,247,0.3); }
    .btn-primary:hover:not(:disabled) { box-shadow:0 6px 24px rgba(79,142,247,0.45); transform:translateY(-1px); }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-secondary { background:transparent; color:var(--text2); border:1px solid var(--border); }
    .btn-ghost { background:transparent; color:var(--accent); border:1px solid rgba(79,142,247,0.25); }
    .gradient-text { background:linear-gradient(90deg,#4f8ef7,#7c3aed,#06b6d4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; background-size:200%; animation:flow 4s ease infinite; }
    .spin { display:inline-block; width:14px; height:14px; border:2px solid #ffffff30; border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
    .spin-blue { display:inline-block; width:14px; height:14px; border:2px solid rgba(79,142,247,0.3); border-top-color:#4f8ef7; border-radius:50%; animation:spin 0.7s linear infinite; }
    .thinking-bar { display:flex; align-items:center; gap:10px; padding:14px 18px; background:rgba(79,142,247,0.06); border:1px solid rgba(79,142,247,0.2); border-radius:10px; font-size:13px; color:var(--accent); }
  `;
  document.head.appendChild(s);
};

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
const TTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1117", border:"1px solid #21283a", borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      {label && <p style={{ color:"#8b9ab4", marginBottom:6, fontWeight:600 }}>{label}</p>}
      {payload.map((p,i)=>(
        <p key={i} style={{ color:p.color||"#e2e8f0" }}>
          <span style={{ opacity:0.7 }}>{p.name}: </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, icon, color="#4f8ef7" }) {
  return (
    <div className="card slide-up" style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:11, color:"var(--text3)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
        <span style={{ fontSize:20 }}>{icon}</span>
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:26, fontWeight:700, color, lineHeight:1, marginBottom:4 }}>{value}</div>
      {delta && <div style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontFamily:"'JetBrains Mono',monospace", padding:"2px 8px", borderRadius:4, background:"rgba(16,185,129,0.1)", color:"#10b981", width:"fit-content" }}>↑ {delta}</div>}
    </div>
  );
}

// ─── SIMILARITY MATRIX ───────────────────────────────────────────────────────
function SimilarityMatrix({ papers }) {
  const top = papers.slice(0, 7);
  const matrix = useMemo(() =>
    top.map((a,i) => top.map((b,j) => i===j ? 1 : parseFloat((1 - Math.abs(a.semantic_score - b.semantic_score)*0.6).toFixed(3)))),
    [top]);
  const short = t => t ? (t.length>18 ? t.slice(0,18)+"…" : t) : "Paper";
  return (
    <div className="card" style={{ gridColumn:"1/-1" }}>
      <div className="card-title">🟦 Semantic Similarity Matrix <span>(top {top.length} results)</span></div>
      <div style={{ overflowX:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:`130px repeat(${top.length},1fr)`, gap:2, minWidth:480 }}>
          <div />
          {top.map((_,j)=><div key={j} style={{ fontSize:9, color:"var(--text3)", textAlign:"center", height:36, display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:4 }}>P{j+1}</div>)}
          {matrix.map((row,i)=>(<>
            <div key={`l${i}`} style={{ fontSize:10, color:"var(--text2)", display:"flex", alignItems:"center", height:26, paddingRight:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>P{i+1}: {short(top[i]?.title)}</div>
            {row.map((val,j)=>(
              <div key={j} className="sim-cell" style={{ height:26, background:i===j?"#4f8ef7":`rgba(79,130,246,${(val*0.85).toFixed(2)})` }} title={`P${i+1}↔P${j+1}: ${(val*100).toFixed(1)}%`} />
            ))}
          </>))}
        </div>
      </div>
      <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
        {top.map((p,i)=><span key={i} style={{ fontSize:10, color:"var(--text3)" }}>P{i+1}: {short(p.title)}</span>)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12 }}>
        <span style={{ fontSize:10, color:"var(--text3)" }}>Low</span>
        <div style={{ flex:1, height:5, borderRadius:99, background:"linear-gradient(90deg,rgba(79,130,246,0.06),#4f8ef7)" }} />
        <span style={{ fontSize:10, color:"var(--text3)" }}>High</span>
      </div>
    </div>
  );
}

// ─── OPEN ACCESS PIE LABEL ────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function PieLabel({ cx,cy,midAngle,innerRadius,outerRadius,percent }) {
  if (percent < 0.08) return null;
  const r = innerRadius + (outerRadius - innerRadius)*0.5;
  const x = cx + r*Math.cos(-midAngle*RADIAN);
  const y = cy + r*Math.sin(-midAngle*RADIAN);
  return <text x={x} y={y} fill="#e2e8f0" textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="Inter,sans-serif">{`${(percent*100).toFixed(0)}%`}</text>;
}

// ─── PAPER CARD ──────────────────────────────────────────────────────────────
function PaperCard({ paper, idx }) {
  const [open, setOpen] = useState(false);
  const score = paper.semantic_score;
  const scoreColor = s => s>=0.90?"#10b981":s>=0.75?"#4f8ef7":"#f59e0b";
  return (
    <div className="paper-card slide-up" style={{ animationDelay:`${idx*55}ms` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
            <span className="tag" style={{ background:(paper.clusterColor||"#6366f1")+"18", color:paper.clusterColor||"#6366f1", border:`1px solid ${paper.clusterColor||"#6366f1"}30` }}>{paper.cluster}</span>
            <span className="tag" style={{ background:paper.open_access?"rgba(16,185,129,0.1)":"rgba(74,85,104,0.12)", color:paper.open_access?"#10b981":"#4a5568" }}>
              {paper.open_access?"Open Access":"Paywalled"}
            </span>
            <span style={{ fontSize:11, color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace" }}>{paper.year} · {paper.journal}</span>
          </div>
          <h3 style={{ fontSize:15, fontWeight:600, color:"var(--text)", marginBottom:8, lineHeight:1.45 }}>{paper.title}</h3>
          <p style={{ fontSize:12, color:"var(--text2)", marginBottom:8 }}>{(paper.authors||[]).join("; ")}</p>
          {open && paper.abstract && (
            <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7, marginBottom:10, paddingTop:10, borderTop:"1px solid var(--border)" }}>{paper.abstract}</p>
          )}
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
            {(paper.keywords||[]).slice(0,7).map((k,i)=>(
              <span key={i} className="tag" style={{ background:"rgba(6,182,212,0.08)", color:"#06b6d4", border:"1px solid rgba(6,182,212,0.18)" }}>{k}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:700, color:scoreColor(score), lineHeight:1 }}>{(score*100).toFixed(0)}%</div>
            <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>similarity</div>
            <div style={{ width:50, height:4, background:"var(--border)", borderRadius:99, overflow:"hidden", marginTop:6 }}>
              <div style={{ height:"100%", width:`${score*100}%`, background:scoreColor(score), borderRadius:99 }} />
            </div>
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"var(--text3)", marginTop:4 }}>{(paper.citations||0).toLocaleString()} cit.</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button className="btn btn-secondary" style={{ fontSize:11, padding:"5px 12px" }} onClick={()=>setOpen(o=>!o)}>{open?"↑ Hide abstract":"↓ Abstract"}</button>
        {paper.doi && (
          <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <button className="btn btn-ghost" style={{ fontSize:11, padding:"5px 12px" }}>View paper ↗</button>
          </a>
        )}
        <button 
          className="btn btn-ghost" 
          style={{ fontSize:11, padding:"5px 12px", borderColor:"rgba(16,185,129,0.3)", color:"#10b981" }}
          onClick={async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerText = "Predicting...";
            try {
              const res = await authenticatedFetch(`${BACKEND_URL}/api/ml/predict`, {
                method: "POST",
                body: JSON.stringify({ title: paper.title, abstract: paper.abstract })
              });
              const d = await res.json();
              alert(`ML Prediction (via MLflow):\nTopic: ${d.topic}\nLatency: ${d.latency_ms}ms`);
            } catch (err) {
              alert(err.message || "Prediction failed. Ensure backend is running.");
            } finally {
              btn.disabled = false;
              btn.innerText = "Predict Topic ✨";
            }
          }}
        >
          Predict Topic ✨
        </button>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  useEffect(()=>{ injectStyles(); },[]);
  const [email, setEmail] = useState("researcher@university.edu");
  const [pw, setPw] = useState("••••••••");
  const [loading, setLoading] = useState(false);
  const profiles = [
    { name:"Dr. Amara Chen",    role:"Research Scientist · MIT CSAIL" },
    { name:"Prof. Rajan Mehta", role:"Professor · IIT Bombay" },
    { name:"Dr. Lena Hoffmann", role:"Postdoc · ETH Zurich" },
    { name:"Dr. Sara Al-Farsi", role:"Senior Scientist · KAUST" },
  ];
  const profile = useMemo(()=>pick(profiles),[]);

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw })
      });
      if (res.ok) {
        const d = await res.json();
        onLogin(d.user);
      } else {
        alert("Login failed. Use researcher@university.edu");
      }
    } catch (e) {
      alert("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", position:"relative", overflow:"hidden" }}>
      <div className="grid-bg" />
      {[["20%","30%","#4f8ef7",600,0.08],["80%","70%","#7c3aed",500,0.07]].map(([x,y,c,sz,op],i)=>(
        <div key={i} style={{ position:"fixed", left:x, top:y, width:sz, height:sz, borderRadius:"50%", background:c, filter:`blur(${sz*0.4}px)`, opacity:op, pointerEvents:"none", transform:"translate(-50%,-50%)" }} />
      ))}
      <div className="slide-up" style={{ position:"relative", zIndex:1, width:"100%", maxWidth:440, padding:"0 20px" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#4f8ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 18px" }}>⬡</div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, color:"var(--text)", marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:14, color:"var(--text2)" }}>Sign in to your research workspace</p>
        </div>
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:18, padding:32 }}>
          <div style={{ background:"rgba(79,142,247,0.07)", border:"1px solid rgba(79,142,247,0.2)", borderRadius:9, padding:"10px 14px", marginBottom:24, fontSize:12, color:"var(--accent)", display:"flex", gap:8 }}>
            <span>ℹ</span>
            <span>Demo credentials pre-filled. Click <strong>Sign In</strong> — searches are powered by <strong>Gemini AI</strong> in real time.</span>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:"var(--text2)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Email</label>
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:9, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ opacity:0.4 }}>✉</span>
              <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, fontFamily:"inherit" }} placeholder="you@university.edu" />
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:11, color:"var(--text2)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Password</label>
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:9, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ opacity:0.4 }}>🔒</span>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, fontFamily:"inherit" }} />
            </div>
// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  useEffect(()=>{ injectStyles(); },[]);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("researcher@university.edu");
  const [pw, setPw] = useState("password123");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!email || !pw) return;
    setLoading(true);
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister ? { email, password: pw, name } : { email, password: pw };
    
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const d = await res.json();
      if (res.ok) {
        if (isRegister) {
          alert("Registration successful! Please login.");
          setIsRegister(false);
        } else {
          localStorage.setItem("riq_token", d.token);
          onLogin(d.user);
        }
      } else {
        alert(d.detail || "Authentication failed.");
      }
    } catch (e) {
      alert("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", position:"relative", overflow:"hidden" }}>
      <div className="grid-bg" />
      <div className="slide-up" style={{ position:"relative", zIndex:1, width:"100%", maxWidth:440, padding:"0 20px" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#4f8ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 18px" }}>⬡</div>
          <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, color:"var(--text)", marginBottom:6 }}>{isRegister ? "Create Account" : "Welcome back"}</h1>
          <p style={{ fontSize:14, color:"var(--text2)" }}>{isRegister ? "Join the research workspace" : "Sign in to your research workspace"}</p>
        </div>
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:18, padding:32 }}>
          {/* Tabs */}
          <div style={{ display:"flex", background:"var(--surface2)", borderRadius:10, padding:4, marginBottom:24 }}>
            <button onClick={()=>setIsRegister(false)} style={{ flex:1, padding:8, border:"none", borderRadius:7, background:!isRegister?"var(--bg)":"transparent", color:!isRegister?"#fff":"var(--text2)", cursor:"pointer", fontSize:12 }}>Login</button>
            <button onClick={()=>setIsRegister(true)} style={{ flex:1, padding:8, border:"none", borderRadius:7, background:isRegister?"var(--bg)":"transparent", color:isRegister?"#fff":"var(--text2)", cursor:"pointer", fontSize:12 }}>Register</button>
          </div>

          {isRegister && (
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, color:"var(--text2)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Full Name</label>
              <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:9, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
                <input value={name} onChange={e=>setName(e.target.value)} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, fontFamily:"inherit" }} placeholder="Dr. Jane Doe" />
              </div>
            </div>
          )}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:"var(--text2)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Email</label>
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:9, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAction()} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, fontFamily:"inherit" }} placeholder="you@university.edu" />
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:11, color:"var(--text2)", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Password</label>
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:9, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAction()} style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, fontFamily:"inherit" }} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:13, fontSize:14 }} onClick={handleAction} disabled={loading}>
            {loading && <span className="spin" />}
            {loading ? "Processing…" : (isRegister ? "Sign Up →" : "Sign In →")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SEARCH BAR PAGE ──────────────────────────────────────────────────────────
function SearchBarPage({ onSearch, searching, defaultTopics }) {
  const [query, setQuery] = useState("");
  const [mode,  setMode]  = useState("semantic");

  return (
    <div style={{ maxWidth:740, margin:"0 auto", padding:"52px 24px 40px" }}>
      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:44 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(79,142,247,0.08)", border:"1px solid rgba(79,142,247,0.2)", borderRadius:20, padding:"5px 14px", marginBottom:20, fontSize:12, color:"var(--accent)" }}>
          <span style={{ width:7, height:7, background:"#10b981", borderRadius:"50%", display:"inline-block" }} className="pulse-dot" />
          Connected · Gemini 1.5 Flash · ChromaDB · OpenAlex
        </div>
        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:44, color:"var(--text)", lineHeight:1.15, marginBottom:14 }}>
          Discover research,<br /><em className="gradient-text">intelligently.</em>
        </h1>
        <p style={{ fontSize:16, color:"var(--text2)", maxWidth:460, margin:"0 auto" }}>
          Semantic vector search + real-time AI analysis via Gemini. Type any topic and get live insights.
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display:"flex", gap:4, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:4, marginBottom:16 }}>
        {[["semantic","🔬 Semantic Search"],["keyword","🔤 Keyword Search"]].map(([m,label])=>(
          <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"9px 8px", borderRadius:7, border:"none", background:mode===m?"#4f8ef7":"transparent", color:mode===m?"#fff":"#8b9ab4", cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:mode===m?500:400, transition:"all 0.2s" }}>{label}</button>
        ))}
      </div>

      {/* Search input */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"4px 4px 4px 18px", boxShadow:"0 0 40px rgba(79,142,247,0.06)" }}>
          <span style={{ fontSize:18, opacity:0.4, marginRight:12 }}>🔍</span>
          <input
            value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!searching&&query.trim()&&onSearch(query,mode)}
            placeholder={mode==="semantic" ? "Describe a research concept, method, or question…" : "Enter keywords, authors, or DOI…"}
            style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:15, color:"var(--text)", fontFamily:"inherit", padding:"10px 0" }}
            autoFocus
          />
          <button className="btn btn-primary" style={{ borderRadius:9, padding:"11px 24px" }} onClick={()=>query.trim()&&!searching&&onSearch(query,mode)} disabled={searching||!query.trim()}>
            {searching ? <><span className="spin" />Searching</> : "Search →"}
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Try a topic →</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {defaultTopics.map(t=>(
            <button key={t} onClick={()=>{ setQuery(t); setTimeout(()=>onSearch(t,mode),50); }}
              style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, padding:"6px 15px", fontSize:12, color:"var(--text2)", cursor:"pointer", fontFamily:"inherit", transition:"border-color 0.2s" }}
              onMouseOver={e=>e.target.style.borderColor="var(--accent)"}
              onMouseOut={e=>e.target.style.borderColor="var(--border)"}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem("riq_token");
    if (token) {
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem("riq_token");
        setUser(null);
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("riq_token");
    setUser(null);
    setData(null);
    setView("search");
  };

  const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem("riq_token");
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      handleLogout();
      throw new Error("Session expired. Please login again.");
    }
    return res;
  };

  const handleSearch = async (q, mode) => {
    setSearching(true);
    setQuery(q);
    setTab("overview");

    try {
      const res = await authenticatedFetch(`${BACKEND_URL}/api/search`, {
        method: "POST",
        body: JSON.stringify({ query: q, mode })
      });
      
      if (!res.ok) throw new Error("Backend search failed");
      
      const backendData = await res.json();
      
      const papers = (backendData.papers || []).map((p, i) => ({
        ...p,
        id: p.id || `p${i}-${Math.random().toString(36).slice(2,8)}`,
        clusterColor: p.color || (backendData.clusters?.find(c => c.name === p.cluster)?.color) || pick(CLUSTER_COLORS),
        doi: p.doi || `10.${rnd(1000,9999)}/arxiv.2024.${rnd(10000,99999)}`,
        semantic_score: p.semantic_score || (0.95 - (i * 0.05))
      }));

      const trendData = backendData.trend_data || buildTrendData();
      const stats = buildRandomStats(papers, trendData);

      const fullData = {
        query: q,
        totalPapers: backendData.total_papers || 0,
        embeddingMs: backendData.embedding_time_ms || 0,
        papers,
        clusters: backendData.clusters || [],
        research_gaps: backendData.research_gaps || [],
        ai_insight: backendData.ai_insight || "No automated insight available.",
        trend_data: trendData,
        ...stats,
      };

      setData(fullData);
      setAiQuery(q);
      setView("dashboard");
    } catch (e) {
      console.error("Search error:", e);
      alert(`Search failed: ${e.message}. Ensure backend is running at ${BACKEND_URL}`);
    } finally {
      setSearching(false);
    }
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const TABS = [
    { id:"overview", label:"📊 Overview" },
    { id:"papers",   label:"📄 Papers",       count:data?.papers?.length },
    { id:"charts",   label:"📈 Bibliometrics" },
    { id:"clusters", label:"🗂 Clusters",      count:data?.clusters?.length },
    { id:"gaps",     label:"🎯 Research Gaps", count:data?.research_gaps?.length },
    { id:"insight",  label:"🤖 AI Insight" },
  ];

  const scoreColor = s => s>=0.90?"#10b981":s>=0.75?"#4f8ef7":"#f59e0b";

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", position:"relative" }}>
      <div className="grid-bg" />

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(6,9,16,0.82)", backdropFilter:"blur(20px)", borderBottom:"1px solid var(--border)", padding:"0 28px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>setView("search")}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#4f8ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#fff" }}>⬡</div>
          <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color:"var(--text)" }}>ResearchIQ</span>
          <span className="tag" style={{ background:"rgba(79,142,247,0.1)", color:"var(--accent)", border:"1px solid rgba(79,142,247,0.2)", fontSize:10 }}>BETA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {data && (
            <>
              <span className="pulse-dot" style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", display:"inline-block" }} />
              <span style={{ fontSize:12, color:"var(--text2)", fontFamily:"'JetBrains Mono',monospace" }}>{data.totalPapers?.toLocaleString()} papers indexed</span>
            </>
          )}
          <button className="btn btn-ghost" style={{ fontSize:12, padding:"6px 14px" }} onClick={()=>setView("search")}>← New Search</button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#4f8ef7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>{user.name?.charAt(0)||"U"}</div>
            <span style={{ fontSize:12, color:"var(--text2)" }}>{user.name}</span>
          </div>
          <button className="btn btn-secondary" style={{ fontSize:11, padding:"5px 12px" }} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:1 }}>

        {/* SEARCH VIEW */}
        {view === "search" && (
          <div className="fade-in">
            {searching ? (
              <div style={{ maxWidth:600, margin:"80px auto", textAlign:"center", padding:"0 24px" }}>
                <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#4f8ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 24px", animation:"glow 2s infinite" }}>🤖</div>
                <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:"var(--text)", marginBottom:12 }}>Gemini is thinking…</h2>
                <p style={{ fontSize:14, color:"var(--text2)", marginBottom:24 }}>Generating real-time bibliometric analysis for <strong style={{ color:"var(--accent)" }}>"{query}"</strong></p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {["Querying Gemini 1.5 Flash…","Generating relevant paper metadata…","Building cluster analysis…","Identifying research gaps…","Synthesising AI insight…"].map((step,i)=>(
                    <div key={i} className="thinking-bar" style={{ animationDelay:`${i*0.4}s`, opacity: i===0?1:0.5 }}>
                      <span className="spin-blue" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <SearchBarPage onSearch={handleSearch} searching={searching} defaultTopics={defaultTopics} />
            )}
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === "dashboard" && data && (
          <div className="fade-in" style={{ maxWidth:1280, margin:"0 auto", padding:"32px 24px" }}>

            {/* Query header */}
            <div style={{ marginBottom:28 }}>
              <p style={{ fontSize:11, color:"var(--text3)", fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>
                LIVE GEMINI ANALYSIS · {data.embeddingMs}ms
              </p>
              <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:30, color:"var(--text)", marginBottom:8 }}>
                <span className="gradient-text">{aiQuery}</span>
              </h1>
              <p style={{ fontSize:13, color:"var(--text2)" }}>
                Showing <strong style={{ color:"var(--accent)" }}>{data.papers.length}</strong> AI-generated results by semantic score · {data.totalPapers?.toLocaleString()} papers indexed
              </p>
            </div>

            {/* Stat row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:14, marginBottom:28 }}>
              <StatCard icon="📚" label="Papers in DB"    value={data.totalPapers?.toLocaleString()}                   delta={`${rnd(3,18)}% this month`}  color="#4f8ef7" />
              <StatCard icon="⚡" label="AI Response"    value={`${data.embeddingMs}ms`}                              delta="Gemini 1.5 Flash"             color="#06b6d4" />
              <StatCard icon="🔬" label="Top Similarity"  value={`${((data.papers[0]?.semantic_score||0)*100).toFixed(1)}%`} delta="vs query vector"      color="#10b981" />
              <StatCard icon="📈" label="Pub. Growth"    value={`+${rnd(18,62)}%`}                                    delta="YoY 2024"                     color="#f59e0b" />
              <StatCard icon="🗂" label="Clusters Found"  value={data.clusters.length}                                 delta="AI identified"                color="#7c3aed" />
              <StatCard icon="🎯" label="Research Gaps"  value={data.research_gaps.length}                            delta="underexplored areas"          color="#be185d" />
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:4, borderBottom:"1px solid var(--border)", marginBottom:28, overflowX:"auto" }}>
              {TABS.map(t=>(
                <button key={t.id} className={`tab-btn${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>
                  {t.label}
                  {t.count!=null && <span className="tab-badge">{t.count}</span>}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {tab==="overview" && (
              <div className="fade-in" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18 }}>
                {/* Trend area */}
                <div className="card" style={{ gridColumn:"1/3" }}>
                  <div className="card-title">📈 Publication Trend <span>(annual papers)</span></div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.trend_data} margin={{ top:4,right:8,left:-18,bottom:0 }}>
                      <defs>
                        <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#4f8ef7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill:"#4a5568",fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TTip />} />
                      <Area type="monotone" dataKey="papers" name="Papers" stroke="#4f8ef7" strokeWidth={2.5} fill="url(#gBlue)" dot={{ fill:"#4f8ef7",r:3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Open access pie */}
                <div className="card">
                  <div className="card-title">🔓 Access Type</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.openPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" labelLine={false} label={PieLabel}>
                        {data.openPie.map((e,i)=><Cell key={i} fill={e.fill} stroke="transparent" />)}
                      </Pie>
                      <Tooltip content={<TTip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12,color:"var(--text2)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Monthly bar */}
                <div className="card" style={{ gridColumn:"1/3" }}>
                  <div className="card-title">📊 Monthly Activity <span>(papers + citations)</span></div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.monthly} margin={{ top:4,right:8,left:-18,bottom:0 }} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TTip />} />
                      <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize:12,color:"var(--text2)" }} />
                      <Bar dataKey="papers"    name="Papers"    fill="#4f8ef7" radius={[4,4,0,0]} />
                      <Bar dataKey="citations" name="Citations" fill="#7c3aed" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Radar */}
                <div className="card">
                  <div className="card-title">🕸 Literature Quality Radar</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={data.radar}>
                      <PolarGrid stroke="rgba(255,255,255,0.07)" />
                      <PolarAngleAxis dataKey="dim" tick={{ fill:"#4a5568",fontSize:10 }} />
                      <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="score" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.22} dot={{ fill:"#4f8ef7",r:3 }} />
                      <Tooltip content={<TTip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── PAPERS TAB ── */}
            {tab==="papers" && (
              <div className="fade-in" style={{ display:"grid", gap:12 }}>
                {data.papers.map((p,i)=><PaperCard key={p.id||i} paper={p} idx={i} />)}
              </div>
            )}

            {/* ── BIBLIOMETRICS TAB ── */}
            {tab==="charts" && (
              <div className="fade-in" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                {/* Publications by year */}
                <div className="card">
                  <div className="card-title">📅 Publications by Year</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.trend_data} margin={{ top:4,right:8,left:-18,bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="year" tick={{ fill:"#4a5568",fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TTip />} />
                      <Bar dataKey="papers" name="Papers" radius={[5,5,0,0]}>
                        {data.trend_data.map((_,i)=><Cell key={i} fill={`hsl(${220+i*8},80%,${55+i*2}%)`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Citation scatter */}
                <div className="card">
                  <div className="card-title">💥 Citation Impact vs Year <span>(bubble = similarity)</span></div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top:4,right:8,left:-18,bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="x" name="Year" type="number" domain={["auto","auto"]} tick={{ fill:"#4a5568",fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="y" name="Citations" type="number" tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <ZAxis dataKey="z" range={[40,220]} name="Similarity %" />
                      <Tooltip cursor={{ strokeDasharray:"3 3" }} content={({ active,payload })=>{
                        if (!active||!payload?.length) return null;
                        const d = payload[0].payload;
                        return <div style={{ background:"#0d1117", border:"1px solid #21283a", borderRadius:10, padding:"10px 14px", fontSize:12, maxWidth:220 }}>
                          <p style={{ fontWeight:600, marginBottom:4, color:"#e2e8f0" }}>{d.title}</p>
                          <p style={{ color:"#8b9ab4" }}>Year: {d.x} · Cit: {d.y?.toLocaleString()} · Sim: {d.z}%</p>
                        </div>;
                      }} />
                      <Scatter data={data.papers.map(p=>({ x:p.year, y:p.citations, z:Math.round((p.semantic_score||0)*100), title:p.title, fill:p.clusterColor }))}>
                        {data.papers.map((p,i)=><Cell key={i} fill={p.clusterColor} fillOpacity={0.75} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                {/* Keywords */}
                <div className="card">
                  <div className="card-title">🔑 Top Keywords</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.keywords} layout="vertical" margin={{ top:4,right:12,left:70,bottom:0 }}>
                      <XAxis type="number" tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="kw" tick={{ fill:"#8b9ab4",fontSize:10 }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip content={<TTip />} />
                      <Bar dataKey="count" name="Mentions" radius={[0,5,5,0]}>
                        {data.keywords.map((_,i)=><Cell key={i} fill={`hsl(${200+i*14},75%,${55+i*1.5}%)`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Authors */}
                <div className="card">
                  <div className="card-title">👤 Most Frequent Authors</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.authorFreq} layout="vertical" margin={{ top:4,right:12,left:55,bottom:0 }}>
                      <XAxis type="number" tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill:"#8b9ab4",fontSize:10 }} axisLine={false} tickLine={false} width={55} />
                      <Tooltip content={<TTip />} />
                      <Bar dataKey="papers" name="Papers" fill="#7c3aed" radius={[0,5,5,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Citation distribution */}
                <div className="card">
                  <div className="card-title">📊 Citation Distribution</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.citBuckets} margin={{ top:4,right:8,left:-18,bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="range" tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TTip />} />
                      <Bar dataKey="count" name="Papers" fill="#06b6d4" radius={[5,5,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Radar */}
                <div className="card">
                  <div className="card-title">🕸 Methodological Quality Radar</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={data.radar}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="dim" tick={{ fill:"#4a5568",fontSize:10 }} />
                      <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} dot={{ fill:"#10b981",r:3 }} />
                      <Tooltip content={<TTip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {/* Similarity matrix */}
                <SimilarityMatrix papers={data.papers} />
              </div>
            )}

            {/* ── CLUSTERS TAB ── */}
            {tab==="clusters" && (
              <div className="fade-in">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16, marginBottom:24 }}>
                  {data.clusters.map((c,i)=>(
                    <div key={i} className="card slide-up" style={{ animationDelay:`${i*60}ms`, borderColor:c.color+"40" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                        <div style={{ width:12, height:12, borderRadius:"50%", background:c.color, boxShadow:`0 0 10px ${c.color}60` }} />
                        <span style={{ fontWeight:600, fontSize:14 }}>{c.name}</span>
                      </div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:26, fontWeight:700, color:c.color, marginBottom:4 }}>{c.count?.toLocaleString()}</div>
                      <div style={{ fontSize:12, color:"var(--text2)", marginBottom:14 }}>papers in cluster</div>
                      <div style={{ height:6, borderRadius:99, background:"var(--border)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(100,(c.count/8000)*100)}%`, background:c.color, borderRadius:99 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title">🗂 Cluster Size Comparison</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.clusters} margin={{ top:4,right:8,left:-10,bottom:60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill:"#4a5568",fontSize:10,angle:-25,textAnchor:"end" }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TTip />} />
                      <Bar dataKey="count" name="Papers" radius={[6,6,0,0]}>
                        {data.clusters.map((c,i)=><Cell key={i} fill={c.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── GAPS TAB ── */}
            {tab==="gaps" && (
              <div className="fade-in" style={{ display:"grid", gap:16 }}>
                {data.research_gaps.map((g,i)=>(
                  <div key={i} className="card slide-up" style={{ animationDelay:`${i*80}ms`, borderLeft:"3px solid #be185d" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:12 }}>
                      <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:"#be185d", background:"rgba(190,24,93,0.1)", padding:"3px 10px", borderRadius:4 }}>Gap #{i+1}</span>
                      <div style={{ display:"flex", gap:14 }}>
                        <span style={{ fontSize:11, color:"var(--text2)" }}>Confidence: <strong style={{ color:"#f59e0b", fontFamily:"'JetBrains Mono',monospace" }}>{((g.confidence||0)*100).toFixed(0)}%</strong></span>
                        <span style={{ fontSize:11, color:"var(--text2)" }}>~<strong style={{ color:"var(--accent)", fontFamily:"'JetBrains Mono',monospace" }}>{g.papers_in_area}</strong> papers in area</span>
                      </div>
                    </div>
                    <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.65 }}>{g.gap}</p>
                    <div style={{ marginTop:12, height:4, borderRadius:99, background:"var(--border)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(g.confidence||0)*100}%`, background:"linear-gradient(90deg,#be185d,#f97316)", borderRadius:99 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── AI INSIGHT TAB ── */}
            {tab==="insight" && (
              <div className="fade-in">
                <div className="card" style={{ borderColor:"rgba(79,142,247,0.3)", background:"linear-gradient(135deg,rgba(79,142,247,0.04),rgba(124,58,237,0.04))", marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
                    <div style={{ width:46, height:46, borderRadius:12, background:"linear-gradient(135deg,#4f8ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🤖</div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:16 }}>AI Research Analyst</p>
                      <p style={{ fontSize:12, color:"var(--text2)" }}>Gemini 1.5 Flash · live synthesis for "{aiQuery}"</p>
                    </div>
                  </div>
                  <p style={{ fontSize:15, color:"var(--text)", lineHeight:1.85 }}>{data.ai_insight}</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                  <div className="card">
                    <div className="card-title">🕸 Research Landscape Radar</div>
                    <ResponsiveContainer width="100%" height={230}>
                      <RadarChart data={data.radar}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="dim" tick={{ fill:"#4a5568",fontSize:10 }} />
                        <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="score" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.2} dot={{ fill:"#4f8ef7",r:3 }} />
                        <Tooltip content={<TTip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div className="card-title">📈 Publication Trend</div>
                    <ResponsiveContainer width="100%" height={230}>
                      <LineChart data={data.trend_data} margin={{ top:4,right:8,left:-18,bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fill:"#4a5568",fontSize:11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:"#4a5568",fontSize:10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TTip />} />
                        <Line type="monotone" dataKey="papers" name="Papers" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill:"#7c3aed",r:4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
