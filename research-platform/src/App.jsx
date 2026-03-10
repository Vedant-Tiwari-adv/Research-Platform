import { useState, useEffect, useRef } from "react";

// ─── SAMPLE DATA (realistic API responses) ─────────────────────────────────
const SAMPLE_RESULTS = {
  query: "transformer attention mechanisms in natural language processing",
  embedding_time_ms: 84,
  total_papers: 12847,
  papers: [
    {
      id: "s2:204e3073",
      title: "Attention Is All You Need",
      authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "+5"],
      year: 2017,
      journal: "NeurIPS",
      citations: 87432,
      semantic_score: 0.98,
      abstract: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models are superior in quality.",
      keywords: ["attention mechanism", "transformer", "self-attention", "multi-head attention"],
      doi: "10.48550/arXiv.1706.03762",
      open_access: true,
      cluster: "Foundational Architectures",
    },
    {
      id: "s2:df2b0e67",
      title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
      year: 2019,
      journal: "NAACL",
      citations: 53210,
      semantic_score: 0.94,
      abstract: "We introduce BERT, designed to pretrain deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
      keywords: ["BERT", "pre-training", "bidirectional", "language model"],
      doi: "10.18653/v1/N19-1423",
      open_access: true,
      cluster: "Pre-trained Language Models",
    },
    {
      id: "s2:9405e045",
      title: "Efficient Transformers: A Survey",
      authors: ["Yi Tay", "Mostafa Dehghani", "Dara Bahri", "Donald Metzler"],
      year: 2022,
      journal: "ACM Computing Surveys",
      citations: 8921,
      semantic_score: 0.91,
      abstract: "This survey covers efficient transformer models which address the quadratic complexity of self-attention through sparse, linear, and low-rank approximations.",
      keywords: ["efficient transformers", "sparse attention", "linear attention", "survey"],
      doi: "10.1145/3530811",
      open_access: false,
      cluster: "Efficiency & Scalability",
    },
    {
      id: "s2:1e077b4b",
      title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
      authors: ["Tri Dao", "Dan Fu", "Stefano Ermon", "Atri Rudra", "Christopher Ré"],
      year: 2022,
      journal: "NeurIPS",
      citations: 4873,
      semantic_score: 0.88,
      abstract: "We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce the number of memory reads/writes between GPU HBM and on-chip SRAM.",
      keywords: ["flash attention", "GPU optimization", "memory efficiency", "IO-aware"],
      doi: "10.48550/arXiv.2205.14135",
      open_access: true,
      cluster: "Efficiency & Scalability",
    },
    {
      id: "s2:abc12345",
      title: "Longformer: The Long-Document Transformer",
      authors: ["Iz Beltagy", "Matthew Peters", "Arman Cohan"],
      year: 2020,
      journal: "arXiv",
      citations: 6341,
      semantic_score: 0.85,
      abstract: "We introduce Longformer, a transformer model with an attention mechanism that scales linearly with sequence length, enabling processing of documents with thousands of tokens.",
      keywords: ["long documents", "sliding window attention", "global attention", "sequence length"],
      doi: "10.48550/arXiv.2004.05150",
      open_access: true,
      cluster: "Long-Context Models",
    },
    {
      id: "s2:def67890",
      title: "Scaling Laws for Neural Language Models",
      authors: ["Jared Kaplan", "Sam McCandlish", "Tom Henighan", "+7"],
      year: 2020,
      journal: "arXiv",
      citations: 5892,
      semantic_score: 0.81,
      abstract: "We study empirical scaling laws for language model performance on the cross-entropy loss. The loss scales as a power-law with model size, dataset size, and compute.",
      keywords: ["scaling laws", "language models", "compute", "model size"],
      doi: "10.48550/arXiv.2001.08361",
      open_access: true,
      cluster: "Scaling & Emergent Behavior",
    },
  ],
  clusters: [
    { name: "Foundational Architectures", count: 2341, color: "#6366f1" },
    { name: "Pre-trained Language Models", count: 3812, color: "#0891b2" },
    { name: "Efficiency & Scalability", count: 1923, color: "#059669" },
    { name: "Long-Context Models", count: 987, color: "#d97706" },
    { name: "Scaling & Emergent Behavior", count: 1244, color: "#be185d" },
    { name: "Vision Transformers", count: 2540, color: "#7c3aed" },
  ],
  research_gaps: [
    { gap: "Theoretical convergence guarantees for sparse attention variants remain underexplored", confidence: 0.87, papers_in_area: 34 },
    { gap: "Cross-modal attention fusion for audio-visual transformers lacks benchmark standardization", confidence: 0.79, papers_in_area: 21 },
    { gap: "Attention head pruning during inference without quality degradation is an open problem", confidence: 0.73, papers_in_area: 58 },
  ],
  ai_insight: "The transformer attention landscape has shifted from foundational architectural innovations (2017–2020) toward efficiency optimizations and application-specific variants. The dominant research thread is reducing O(n²) attention complexity — FlashAttention, Longformer, and sparse attention variants collectively represent 34% of recent citations. An emerging underexplored area is theoretical convergence guarantees for these approximate methods. Researchers building on this topic should focus on long-context efficiency or multimodal attention fusion, both showing rapid citation growth with limited review coverage.",
  trend_data: [
    { year: 2018, papers: 312 },
    { year: 2019, papers: 891 },
    { year: 2020, papers: 2341 },
    { year: 2021, papers: 3812 },
    { year: 2022, papers: 4921 },
    { year: 2023, papers: 5632 },
    { year: 2024, papers: 6102 },
  ],
};

// ─── STYLES ────────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Geist:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #060910;
    --surface: #0d1117;
    --surface2: #161b22;
    --surface3: #1c2230;
    --border: #21283a;
    --border2: #2d3748;
    --accent: #4f8ef7;
    --accent2: #7c3aed;
    --accent3: #06b6d4;
    --success: #10b981;
    --warn: #f59e0b;
    --danger: #ef4444;
    --text: #e2e8f0;
    --text2: #8b9ab4;
    --text3: #4a5568;
    --glow: rgba(79,142,247,0.15);
  }

  html, body { height: 100%; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Geist', sans-serif;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  .serif { font-family: 'DM Serif Display', serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }

  .page { min-height: 100vh; display: flex; flex-direction: column; }
  .fade-in { animation: fadeIn 0.4s ease; }
  .slide-up { animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1); }

  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin { to { transform:rotate(360deg) } }
  @keyframes shimmer {
    0% { background-position: -1000px 0 }
    100% { background-position: 1000px 0 }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%) }
    100% { transform: translateY(100vh) }
  }
  @keyframes glow-pulse {
    0%,100% { box-shadow: 0 0 20px rgba(79,142,247,0.2) }
    50% { box-shadow: 0 0 40px rgba(79,142,247,0.4) }
  }
`;

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────
function GridBg() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: `
        linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
    }} />
  );
}

function Orb({ x, y, color = "#4f8ef7", size = 400, opacity = 0.12 }) {
  return (
    <div style={{
      position: "fixed", left: x, top: y,
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      filter: `blur(${size * 0.4}px)`,
      opacity, pointerEvents: "none", zIndex: 0,
      transform: "translate(-50%, -50%)",
    }} />
  );
}

function Tag({ children, color = "#4f8ef7" }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      background: color + "18",
      color: color,
      border: `1px solid ${color}30`,
    }}>
      {children}
    </span>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, icon, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: "#8b9ab4", marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
      <div style={{
        position: "relative",
        border: `1px solid ${focused ? "#4f8ef7" : "#21283a"}`,
        borderRadius: 8,
        background: "#0d1117",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.1)" : "none",
      }}>
        {icon && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.5 }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: icon ? "12px 14px 12px 42px" : "12px 14px",
            background: "transparent", border: "none", outline: "none",
            color: "#e2e8f0", fontSize: 14, fontFamily: "'Geist', sans-serif",
          }}
        />
      </div>
      {hint && <p style={{ fontSize: 11, color: "#4a5568", marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", loading, style: s, disabled }) {
  const styles = {
    primary: {
      background: "linear-gradient(135deg, #4f8ef7, #3b72d9)",
      color: "#fff", border: "none",
      boxShadow: "0 4px 20px rgba(79,142,247,0.3)",
    },
    secondary: {
      background: "transparent", color: "#8b9ab4",
      border: "1px solid #21283a",
    },
    ghost: {
      background: "transparent", color: "#4f8ef7",
      border: "1px solid #4f8ef730",
    },
    danger: {
      background: "transparent", color: "#ef4444",
      border: "1px solid #ef444430",
    }
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 500,
        cursor: loading || disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s", fontFamily: "'Geist', sans-serif",
        display: "inline-flex", alignItems: "center", gap: 8,
        ...styles[variant], ...s,
      }}
    >
      {loading && <span style={{ width: 14, height: 14, border: "2px solid #ffffff40", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
      {children}
    </button>
  );
}

function NavBar({ page, setPage, user, setUser }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(6,9,16,0.85)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid #21283a",
      padding: "0 32px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setPage("search")}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#4f8ef7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
        <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: "#e2e8f0" }}>ResearchIQ</span>
        <Tag color="#4f8ef7">BETA</Tag>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {user && (
          <>
            <button onClick={() => setPage("search")} style={{ background: page === "search" ? "#4f8ef715" : "transparent", border: "none", color: page === "search" ? "#4f8ef7" : "#8b9ab4", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Search</button>
            <button onClick={() => setPage("results")} style={{ background: page === "results" ? "#4f8ef715" : "transparent", border: "none", color: page === "results" ? "#4f8ef7" : "#8b9ab4", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Results</button>
            <div style={{ width: 1, height: 20, background: "#21283a", margin: "0 6px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: 13, color: "#8b9ab4" }}>{user.name}</span>
            </div>
            <button onClick={() => { setUser(null); setPage("login"); }} style={{ background: "transparent", border: "1px solid #21283a", color: "#4a5568", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Sign out</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── LOGIN PAGE ─────────────────────────────────────────────────────────────
function LoginPage({ setPage, setUser }) {
  const [email, setEmail] = useState("researcher@university.edu");
  const [password, setPassword] = useState("••••••••••");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      setUser({ name: "Dr. Amara Chen", email, institution: "MIT CSAIL", role: "Research Scientist" });
      setPage("search");
      setLoading(false);
    }, 1400);
  };

  return (
    <div className="page" style={{ position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <GridBg />
      <Orb x="20%" y="30%" color="#4f8ef7" size={600} opacity={0.08} />
      <Orb x="80%" y="70%" color="#7c3aed" size={500} opacity={0.07} />
      <div className="slide-up" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#4f8ef7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>⬡</div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "#e2e8f0", marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "#8b9ab4" }}>Sign in to your research workspace</p>
        </div>

        {/* Card */}
        <div style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 16, padding: 32 }}>
          {/* Demo hint */}
          <div style={{ background: "#4f8ef710", border: "1px solid #4f8ef730", borderRadius: 8, padding: "10px 14px", marginBottom: 24, fontSize: 12, color: "#4f8ef7", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span>ℹ️</span>
            <span>Sample credentials pre-filled. Just click <strong>Sign In</strong> to explore.</span>
          </div>

          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" icon="✉" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" icon="🔒" />

          {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#ef444410", borderRadius: 6, border: "1px solid #ef444430" }}>{error}</p>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8b9ab4", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "#4f8ef7" }} />
              Remember me
            </label>
            <span style={{ fontSize: 13, color: "#4f8ef7", cursor: "pointer" }}>Forgot password?</span>
          </div>

          <Button onClick={handleLogin} loading={loading} style={{ width: "100%", justifyContent: "center" }}>
            Sign In to ResearchIQ
          </Button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#21283a" }} />
            <span style={{ fontSize: 12, color: "#4a5568" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#21283a" }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {["🎓 Google Scholar SSO", "🏛 Institution SSO"].map(t => (
              <button key={t} style={{ flex: 1, padding: "10px 8px", background: "#161b22", border: "1px solid #21283a", borderRadius: 8, color: "#8b9ab4", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#4a5568" }}>
          Don't have an account?{" "}
          <span style={{ color: "#4f8ef7", cursor: "pointer" }} onClick={() => setPage("signup")}>Create workspace →</span>
        </p>
      </div>
    </div>
  );
}

// ─── SIGNUP PAGE ────────────────────────────────────────────────────────────
function SignupPage({ setPage, setUser }) {
  const [form, setForm] = useState({ name: "", email: "", institution: "", role: "Research Scientist", password: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignup = () => {
    setLoading(true);
    setTimeout(() => {
      setUser({ name: form.name || "Researcher", email: form.email, institution: form.institution, role: form.role });
      setPage("search");
      setLoading(false);
    }, 1600);
  };

  const roles = ["Research Scientist", "PhD Student", "Postdoctoral Researcher", "Faculty / Professor", "Industry Researcher", "Data Scientist"];

  return (
    <div className="page" style={{ position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <GridBg />
      <Orb x="75%" y="20%" color="#06b6d4" size={500} opacity={0.08} />
      <Orb x="25%" y="80%" color="#7c3aed" size={600} opacity={0.07} />

      <div className="slide-up" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#06b6d4,#4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>⬡</div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, color: "#e2e8f0", marginBottom: 6 }}>Create workspace</h1>
          <p style={{ fontSize: 14, color: "#8b9ab4" }}>Start discovering research intelligently</p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? "#4f8ef7" : "#21283a", transition: "background 0.3s" }} />
          ))}
        </div>

        <div style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 16, padding: 32 }}>
          {step === 1 ? (
            <>
              <p style={{ fontSize: 12, color: "#8b9ab4", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>Step 1 — Personal Info</p>
              <Input label="Full Name" value={form.name} onChange={upd("name")} placeholder="Dr. Jane Smith" icon="👤" />
              <Input label="Email" type="email" value={form.email} onChange={upd("email")} placeholder="jane@mit.edu" icon="✉" />
              <Input label="Institution / Organization" value={form.institution} onChange={upd("institution")} placeholder="MIT CSAIL" icon="🏛" />
              <Button onClick={() => setStep(2)} style={{ width: "100%", justifyContent: "center" }} disabled={!form.name || !form.email}>
                Continue →
              </Button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 12, color: "#8b9ab4", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>Step 2 — Research Profile</p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, color: "#8b9ab4", marginBottom: 8, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {roles.map(r => (
                    <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))} style={{
                      padding: "9px 12px", borderRadius: 7, fontSize: 12,
                      background: form.role === r ? "#4f8ef715" : "#161b22",
                      border: `1px solid ${form.role === r ? "#4f8ef7" : "#21283a"}`,
                      color: form.role === r ? "#4f8ef7" : "#8b9ab4",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}>{r}</button>
                  ))}
                </div>
              </div>
              <Input label="Password" type="password" value={form.password} onChange={upd("password")} placeholder="Min 8 characters" icon="🔒"
                hint="Your data is encrypted at rest. We never store raw passwords." />

              {/* Research interests */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, color: "#8b9ab4", marginBottom: 8, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Research Interests <span style={{ color: "#4a5568" }}>(optional)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["NLP", "Computer Vision", "Bioinformatics", "Climate Science", "Quantum Computing", "Materials Science"].map(t => (
                    <Tag key={t} color="#06b6d4">{t}</Tag>
                  ))}
                  <Tag color="#4a5568">+ add more</Tag>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="secondary" onClick={() => setStep(1)} style={{ flex: "0 0 auto" }}>← Back</Button>
                <Button onClick={handleSignup} loading={loading} style={{ flex: 1, justifyContent: "center" }}>
                  Create Account
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 20 }}>
          {[["🔍", "Semantic Search"], ["📊", "Bibliometrics"], ["🤖", "AI Insights"]].map(([icon, label]) => (
            <div key={label} style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 11, color: "#4a5568" }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#4a5568" }}>
          Already have an account?{" "}
          <span style={{ color: "#4f8ef7", cursor: "pointer" }} onClick={() => setPage("login")}>Sign in →</span>
        </p>
      </div>
    </div>
  );
}

// ─── SEARCH PAGE ────────────────────────────────────────────────────────────
function SearchPage({ setPage, setResults, user }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("semantic");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ yearFrom: "2018", yearTo: "2024", minCitations: "0", sources: ["Semantic Scholar", "OpenAlex", "arXiv"] });
  const [uploadDrag, setUploadDrag] = useState(false);

  const recentSearches = [
    "transformer attention mechanisms NLP",
    "graph neural networks drug discovery",
    "federated learning privacy healthcare",
    "diffusion models image synthesis",
  ];

  const trendingTopics = [
    { label: "Large Language Models", papers: "84.2k", trend: "+312%" },
    { label: "Multimodal Learning", papers: "23.1k", trend: "+189%" },
    { label: "RLHF Alignment", papers: "12.4k", trend: "+421%" },
    { label: "Protein Structure Prediction", papers: "18.7k", trend: "+67%" },
  ];

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResults({ ...SAMPLE_RESULTS, query });
      setPage("results");
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="page fade-in" style={{ position: "relative", overflow: "hidden" }}>
      <GridBg />
      <Orb x="50%" y="35%" color="#4f8ef7" size={800} opacity={0.06} />
      <Orb x="80%" y="70%" color="#7c3aed" size={500} opacity={0.05} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "60px 24px 40px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#4f8ef710", border: "1px solid #4f8ef730", borderRadius: 20, padding: "5px 14px", marginBottom: 20, fontSize: 12, color: "#4f8ef7" }}>
            <span style={{ width: 7, height: 7, background: "#10b981", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
            Connected · Semantic Scholar · OpenAlex · arXiv
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 46, color: "#e2e8f0", lineHeight: 1.15, marginBottom: 14 }}>
            Discover research,<br /><em style={{ color: "#4f8ef7" }}>intelligently.</em>
          </h1>
          <p style={{ fontSize: 16, color: "#8b9ab4", maxWidth: 480, margin: "0 auto" }}>
            Semantic vector search across 200M+ papers. AI-powered gap detection, trend analysis, and literature insights.
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 4, background: "#0d1117", border: "1px solid #21283a", borderRadius: 10, padding: 4, marginBottom: 16 }}>
          {[["semantic", "🔬 Semantic Search"], ["keyword", "🔤 Keyword Search"], ["upload", "📂 Upload Dataset"]].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "9px 8px", borderRadius: 7, border: "none",
              background: mode === m ? "#4f8ef7" : "transparent",
              color: mode === m ? "#fff" : "#8b9ab4",
              cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: mode === m ? 500 : 400,
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* Search box */}
        {mode !== "upload" ? (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: "#0d1117", border: "1px solid #21283a", borderRadius: 12,
              padding: "4px 4px 4px 18px",
              boxShadow: "0 0 40px rgba(79,142,247,0.08)",
              transition: "border-color 0.2s",
            }}>
              <span style={{ fontSize: 18, opacity: 0.4, marginRight: 12 }}>🔍</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder={mode === "semantic" ? "Describe a research concept, topic, or question…" : "Enter keywords, authors, or DOI…"}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#e2e8f0", fontFamily: "inherit", padding: "10px 0" }}
              />
              <Button onClick={handleSearch} loading={loading} style={{ borderRadius: 9, padding: "11px 24px" }}>
                {loading ? "Searching" : "Search →"}
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setUploadDrag(true); }}
            onDragLeave={() => setUploadDrag(false)}
            onDrop={e => { e.preventDefault(); setUploadDrag(false); handleSearch(); }}
            style={{
              border: `2px dashed ${uploadDrag ? "#4f8ef7" : "#21283a"}`,
              borderRadius: 12, padding: "40px 24px", textAlign: "center", marginBottom: 16,
              background: uploadDrag ? "#4f8ef708" : "#0d1117", transition: "all 0.2s", cursor: "pointer",
            }}
            onClick={handleSearch}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <p style={{ color: "#8b9ab4", marginBottom: 6 }}>Drop your bibliometric CSV or PDF collection here</p>
            <p style={{ fontSize: 12, color: "#4a5568" }}>Supports: Scopus export, Web of Science export, BibTeX, RIS, PDF collections</p>
            <Button variant="ghost" style={{ marginTop: 16 }}>Browse files</Button>
          </div>
        )}

        {/* Filters row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#4a5568" }}>Filters:</span>
          {["2018–2024", "Min 100 citations", "Open Access only", "English"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, background: "#161b22", border: "1px solid #21283a", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#8b9ab4", cursor: "pointer" }}>
              {f} <span style={{ opacity: 0.4 }}>✕</span>
            </div>
          ))}
          <div style={{ background: "#161b22", border: "1px solid #21283a", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#4f8ef7", cursor: "pointer" }}>+ Add filter</div>
        </div>

        {/* Recent searches */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Recent searches</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {recentSearches.map(s => (
              <button key={s} onClick={() => { setQuery(s); }} style={{
                background: "#0d1117", border: "1px solid #21283a", borderRadius: 20,
                padding: "6px 14px", fontSize: 13, color: "#8b9ab4", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ opacity: 0.4 }}>↩</span> {s}
              </button>
            ))}
          </div>
        </div>

        {/* Trending topics */}
        <div>
          <p style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Trending this month</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {trendingTopics.map(t => (
              <div key={t.label} onClick={() => { setQuery(t.label); }}
                style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 10, padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s" }}>
                <div>
                  <p style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 4 }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: "#4a5568", fontFamily: "'JetBrains Mono',monospace" }}>{t.papers} papers</p>
                </div>
                <div style={{ fontSize: 11, color: "#10b981", fontFamily: "'JetBrains Mono',monospace", background: "#10b98115", padding: "3px 8px", borderRadius: 4 }}>{t.trend}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESULTS PAGE ───────────────────────────────────────────────────────────
function ResultsPage({ results, setPage }) {
  const [activeTab, setActiveTab] = useState("papers");
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [saving, setSaving] = useState({});

  const savePaper = (id) => {
    setSaving(s => ({ ...s, [id]: true }));
    setTimeout(() => setSaving(s => ({ ...s, [id]: false })), 1000);
  };

  const maxCitations = Math.max(...results.papers.map(p => p.citations));
  const maxTrend = Math.max(...results.trend_data.map(d => d.papers));
  const barW = 100 / results.trend_data.length;

  const scoreColor = (s) => s > 0.92 ? "#10b981" : s > 0.8 ? "#4f8ef7" : "#f59e0b";

  return (
    <div className="page fade-in" style={{ position: "relative" }}>
      <GridBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Query header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <button onClick={() => setPage("search")} style={{ background: "transparent", border: "1px solid #21283a", color: "#8b9ab4", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>← New search</button>
              <span style={{ fontSize: 12, color: "#4a5568", fontFamily: "'JetBrains Mono',monospace" }}>Embedding: {results.embedding_time_ms}ms</span>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "#e2e8f0" }}>
              "{results.query}"
            </h2>
            <p style={{ fontSize: 13, color: "#8b9ab4", marginTop: 4 }}>
              <span style={{ color: "#4f8ef7", fontFamily: "'JetBrains Mono',monospace" }}>{results.total_papers.toLocaleString()}</span> papers indexed · showing top {results.papers.length} by semantic score
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" style={{ fontSize: 12, padding: "8px 16px" }}>Export CSV</Button>
            <Button variant="ghost" style={{ fontSize: 12, padding: "8px 16px" }}>Save search</Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #21283a", marginBottom: 28 }}>
          {[["papers", "📄 Papers", results.papers.length], ["clusters", "🗂 Clusters", results.clusters.length], ["gaps", "🎯 Research Gaps", results.research_gaps.length], ["trends", "📈 Trends", null], ["insight", "🤖 AI Insight", null]].map(([id, label, count]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              padding: "10px 18px", border: "none", background: "transparent",
              borderBottom: `2px solid ${activeTab === id ? "#4f8ef7" : "transparent"}`,
              color: activeTab === id ? "#4f8ef7" : "#8b9ab4",
              cursor: "pointer", fontSize: 13, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6, marginBottom: -1,
            }}>
              {label}
              {count != null && <span style={{ background: "#21283a", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* PAPERS TAB */}
        {activeTab === "papers" && (
          <div style={{ display: "grid", gap: 12 }}>
            {results.papers.map((p, i) => (
              <div key={p.id} className="slide-up" style={{ animationDelay: `${i * 60}ms`, background: "#0d1117", border: "1px solid #21283a", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "20px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                        <Tag color="#7c3aed">{p.cluster}</Tag>
                        <Tag color={p.open_access ? "#10b981" : "#4a5568"}>{p.open_access ? "Open Access" : "Paywalled"}</Tag>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#4a5568" }}>{p.year} · {p.journal}</span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: "#e2e8f0", marginBottom: 8, lineHeight: 1.4 }}>{p.title}</h3>
                      <p style={{ fontSize: 12, color: "#8b9ab4", marginBottom: 10 }}>
                        {p.authors.join(", ")}
                      </p>
                      {expandedPaper === p.id && (
                        <p style={{ fontSize: 13, color: "#8b9ab4", lineHeight: 1.6, marginBottom: 12, padding: "12px 14px", background: "#161b22", borderRadius: 8, borderLeft: "3px solid #4f8ef7" }}>
                          {p.abstract}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {p.keywords.map(k => <Tag key={k} color="#06b6d4">{k}</Tag>)}
                      </div>
                    </div>
                    {/* Metrics column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", minWidth: 120 }}>
                      {/* Semantic score */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Semantic Match</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: "#21283a", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${p.semantic_score * 100}%`, height: "100%", background: scoreColor(p.semantic_score), borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: scoreColor(p.semantic_score), fontWeight: 600 }}>{(p.semantic_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      {/* Citations */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Citations</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: "#21283a", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${(p.citations / maxCitations) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#f59e0b" }}>{(p.citations / 1000).toFixed(1)}k</span>
                        </div>
                      </div>
                      {/* DOI */}
                      <span style={{ fontSize: 10, color: "#4a5568", fontFamily: "'JetBrains Mono',monospace" }}>DOI: {p.doi.split("/").pop()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #161b22" }}>
                    <button onClick={() => setExpandedPaper(expandedPaper === p.id ? null : p.id)} style={{ background: "transparent", border: "1px solid #21283a", color: "#8b9ab4", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                      {expandedPaper === p.id ? "↑ Less" : "↓ Abstract"}
                    </button>
                    <button onClick={() => savePaper(p.id)} style={{ background: saving[p.id] ? "#10b98115" : "transparent", border: `1px solid ${saving[p.id] ? "#10b981" : "#21283a"}`, color: saving[p.id] ? "#10b981" : "#8b9ab4", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit", transition: "all 0.2s" }}>
                      {saving[p.id] ? "✓ Saved" : "Save"}
                    </button>
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" style={{ background: "transparent", border: "1px solid #21283a", color: "#4f8ef7", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit", textDecoration: "none" }}>
                      View PDF ↗
                    </a>
                    <button style={{ background: "transparent", border: "1px solid #21283a", color: "#8b9ab4", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                      Cite
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLUSTERS TAB */}
        {activeTab === "clusters" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
              {results.clusters.map((c, i) => (
                <div key={c.name} className="slide-up" style={{ animationDelay: `${i * 70}ms`, background: "#0d1117", border: `1px solid ${c.color}30`, borderRadius: 12, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color + "20", border: `1px solid ${c.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🗂</div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: c.color }}>{c.count.toLocaleString()}</span>
                  </div>
                  <h3 style={{ fontSize: 14, color: "#e2e8f0", marginBottom: 8, lineHeight: 1.4 }}>{c.name}</h3>
                  <div style={{ width: "100%", height: 4, background: "#21283a", borderRadius: 2 }}>
                    <div style={{ width: `${(c.count / 4000) * 100}%`, height: "100%", background: c.color, borderRadius: 2 }} />
                  </div>
                  <p style={{ fontSize: 11, color: "#4a5568", marginTop: 8 }}>{((c.count / results.total_papers) * 100).toFixed(1)}% of results</p>
                </div>
              ))}
            </div>

            {/* Cluster map placeholder */}
            <div style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 12, padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#4a5568", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>Cluster Similarity Map</p>
              <div style={{ position: "relative", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {results.clusters.map((c, i) => {
                  const angle = (i / results.clusters.length) * Math.PI * 2;
                  const r = 70;
                  const x = 50 + r * Math.cos(angle);
                  const y = 50 + r * Math.sin(angle);
                  const size = 20 + (c.count / 500);
                  return (
                    <div key={c.name} title={c.name} style={{
                      position: "absolute",
                      left: `${x}%`, top: `${y}%`,
                      width: size, height: size,
                      borderRadius: "50%",
                      background: c.color,
                      opacity: 0.7,
                      transform: "translate(-50%,-50%)",
                      cursor: "pointer",
                      filter: `blur(1px) drop-shadow(0 0 8px ${c.color})`,
                      transition: "all 0.2s",
                    }} />
                  );
                })}
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#4f8ef7", boxShadow: "0 0 20px #4f8ef7" }} />
              </div>
              <p style={{ fontSize: 11, color: "#4a5568" }}>Node size = paper count · Distance = semantic similarity</p>
            </div>
          </div>
        )}

        {/* GAPS TAB */}
        {activeTab === "gaps" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#10b98110", border: "1px solid #10b98130", borderRadius: 12, padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22 }}>🎯</span>
              <div>
                <p style={{ fontSize: 13, color: "#10b981", fontWeight: 500, marginBottom: 4 }}>Research Gap Detection Active</p>
                <p style={{ fontSize: 12, color: "#8b9ab4" }}>Gaps identified by analyzing cluster density, citation network sparsity, and topic coverage using embeddings from {results.total_papers.toLocaleString()} papers.</p>
              </div>
            </div>
            {results.research_gaps.map((g, i) => (
              <div key={i} className="slide-up" style={{ animationDelay: `${i * 80}ms`, background: "#0d1117", border: "1px solid #21283a", borderRadius: 12, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <Tag color="#f59e0b">Gap #{i + 1}</Tag>
                      <Tag color="#4a5568">{g.papers_in_area} papers in area</Tag>
                    </div>
                    <p style={{ fontSize: 15, color: "#e2e8f0", lineHeight: 1.5 }}>{g.gap}</p>
                  </div>
                  <div style={{ textAlign: "center", minWidth: 80 }}>
                    <p style={{ fontSize: 10, color: "#4a5568", textTransform: "uppercase", marginBottom: 6 }}>Confidence</p>
                    <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto" }}>
                      <svg viewBox="0 0 36 36" style={{ width: 56, height: 56, transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#21283a" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#f59e0b" strokeWidth="3"
                          strokeDasharray={`${g.confidence * 94.2} 94.2`} strokeLinecap="round" />
                      </svg>
                      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "#f59e0b" }}>
                        {(g.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <Button variant="ghost" style={{ fontSize: 12, padding: "6px 14px" }}>Explore gap →</Button>
                  <Button variant="secondary" style={{ fontSize: 12, padding: "6px 14px" }}>Find collaborators</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRENDS TAB */}
        {activeTab === "trends" && (
          <div style={{ display: "grid", gap: 20 }}>
            {/* Publication trend chart */}
            <div style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 12, padding: 28 }}>
              <p style={{ fontSize: 13, color: "#8b9ab4", marginBottom: 20 }}>Publications per year · <span style={{ color: "#4f8ef7" }}>{results.query}</span></p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, paddingBottom: 4 }}>
                {results.trend_data.map((d, i) => (
                  <div key={d.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
                    <span style={{ fontSize: 10, color: "#4a5568", fontFamily: "'JetBrains Mono',monospace" }}>{(d.papers / 1000).toFixed(1)}k</span>
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div style={{
                        width: "100%",
                        height: `${(d.papers / maxTrend) * 100}%`,
                        background: `linear-gradient(to top, #4f8ef7, #7c3aed)`,
                        borderRadius: "4px 4px 0 0",
                        minHeight: 4,
                        transition: "height 0.5s cubic-bezier(0.16,1,0.3,1)",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#4a5568" }}>{d.year}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#161b22", borderRadius: 8, display: "flex", gap: 24 }}>
                <div><p style={{ fontSize: 10, color: "#4a5568", marginBottom: 2 }}>YoY Growth (2023→24)</p><p style={{ fontFamily: "'JetBrains Mono',monospace", color: "#10b981", fontSize: 14 }}>+8.3%</p></div>
                <div><p style={{ fontSize: 10, color: "#4a5568", marginBottom: 2 }}>Peak Year</p><p style={{ fontFamily: "'JetBrains Mono',monospace", color: "#4f8ef7", fontSize: 14 }}>2024</p></div>
                <div><p style={{ fontSize: 10, color: "#4a5568", marginBottom: 2 }}>Total Papers</p><p style={{ fontFamily: "'JetBrains Mono',monospace", color: "#e2e8f0", fontSize: 14 }}>{results.total_papers.toLocaleString()}</p></div>
              </div>
            </div>

            {/* Top authors */}
            <div style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 13, color: "#8b9ab4", marginBottom: 16 }}>Top Authors by Influence</p>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { name: "Ashish Vaswani", papers: 34, hIndex: 42, inst: "Google Brain" },
                  { name: "Noam Shazeer", papers: 28, hIndex: 38, inst: "Character.AI" },
                  { name: "Jakob Uszkoreit", papers: 19, hIndex: 29, inst: "Inceptive" },
                  { name: "Llion Jones", papers: 17, hIndex: 24, inst: "Google" },
                ].map((a, i) => (
                  <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "#161b22", borderRadius: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#4a5568", width: 16 }}>#{i + 1}</span>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${i * 60 + 200},60%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{a.name.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: "#e2e8f0" }}>{a.name}</p>
                      <p style={{ fontSize: 11, color: "#4a5568" }}>{a.inst}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 11, color: "#4f8ef7", fontFamily: "'JetBrains Mono',monospace" }}>{a.papers} papers</p>
                      <p style={{ fontSize: 10, color: "#4a5568" }}>h-index: {a.hIndex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI INSIGHT TAB */}
        {activeTab === "insight" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#0d1117", border: "1px solid #7c3aed30", borderRadius: 12, padding: 28 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🤖</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>AI Research Analyst</p>
                  <p style={{ fontSize: 11, color: "#4a5568" }}>Generated from semantic analysis of {results.total_papers.toLocaleString()} papers · Model: ResearchIQ-7B-Analyst</p>
                </div>
                <Tag color="#7c3aed">AI Generated</Tag>
              </div>
              <div style={{ fontSize: 15, color: "#c4cdd8", lineHeight: 1.8, borderLeft: "3px solid #7c3aed40", paddingLeft: 18 }}>
                {results.ai_insight}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <Button variant="ghost" style={{ fontSize: 12, padding: "6px 14px" }}>👍 Helpful</Button>
                <Button variant="secondary" style={{ fontSize: 12, padding: "6px 14px" }}>Regenerate</Button>
                <Button variant="secondary" style={{ fontSize: 12, padding: "6px 14px" }}>Export as PDF</Button>
              </div>
            </div>

            {/* Suggested next steps */}
            <div style={{ background: "#0d1117", border: "1px solid #21283a", borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 13, color: "#8b9ab4", marginBottom: 16 }}>Suggested next actions</p>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { icon: "🔍", text: "Run a focused search on 'sparse attention convergence theory'", action: "Search" },
                  { icon: "📊", text: "Generate a citation network for the Efficiency & Scalability cluster", action: "Analyze" },
                  { icon: "🎯", text: "Find collaborators working on long-context attention gaps", action: "Explore" },
                  { icon: "📄", text: "Export this insight as a literature review section draft", action: "Export" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#161b22", borderRadius: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <p style={{ flex: 1, fontSize: 13, color: "#8b9ab4" }}>{s.text}</p>
                    <button style={{ background: "#4f8ef715", border: "1px solid #4f8ef730", color: "#4f8ef7", padding: "4px 12px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>{s.action}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [results, setResults] = useState(SAMPLE_RESULTS);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = globalStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const showNav = user && (page === "search" || page === "results");

  return (
    <div>
      {showNav && <NavBar page={page} setPage={setPage} user={user} setUser={setUser} />}
      {page === "login" && <LoginPage setPage={setPage} setUser={setUser} />}
      {page === "signup" && <SignupPage setPage={setPage} setUser={setUser} />}
      {page === "search" && user && <SearchPage setPage={setPage} setResults={setResults} user={user} />}
      {page === "results" && user && <ResultsPage results={results} setPage={setPage} />}
    </div>
  );
}
