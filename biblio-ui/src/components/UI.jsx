export function Button({ children, variant = 'primary', size = '', full = false, loading = false, disabled = false, onClick, style = {} }) {
  return (
    <button
      className={`btn btn-${variant}${size ? ` btn-${size}` : ''}${full ? ' btn-full' : ''}`}
      onClick={onClick}
      disabled={loading || disabled}
      style={style}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}

export function Tag({ children, color = 'subtle' }) {
  return <span className={`tag tag-${color}`}>{children}</span>;
}

export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </Field>
  );
}

export function Divider({ text }) {
  return <div className="divider">{text}</div>;
}

export function Empty({ icon = '🔬', title, hint }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {hint && <div className="empty-hint">{hint}</div>}
    </div>
  );
}
