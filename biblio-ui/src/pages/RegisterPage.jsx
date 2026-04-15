import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Divider } from '../components/UI';

export default function RegisterPage({ setPage }) {
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', institution: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = () => {
    if (!form.name || !form.email || !form.password) { toast('Please fill required fields.', 'error'); return; }
    if (form.password !== form.confirm) { toast('Passwords do not match.', 'error'); return; }
    setLoading(true);
    setTimeout(() => {
      login({ name: form.name, email: form.email, institution: form.institution });
      setLoading(false);
      setPage('upload');
    }, 900);
  };

  return (
    <div className="auth-wrap">
      <div className="bg-noise" />
      <div className="auth-card fade-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">⬡</div>
          <span className="auth-logo-name">BiblioVec</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start vectorized bibliometric analysis</p>

        <Input label="Full Name *" value={form.name} onChange={upd('name')} placeholder="Dr. Jane Smith" />
        <Input label="Email *" type="email" value={form.email} onChange={upd('email')} placeholder="jane@university.edu" />
        <Input label="Institution" value={form.institution} onChange={upd('institution')} placeholder="MIT CSAIL (optional)" />
        <Input label="Password *" type="password" value={form.password} onChange={upd('password')} placeholder="Min 8 characters" />
        <Input label="Confirm Password *" type="password" value={form.confirm} onChange={upd('confirm')} placeholder="Repeat password" />

        <Button full loading={loading} onClick={handleRegister}>Create Account</Button>
        <Divider text="or" />
        <p className="auth-footer">
          Already have an account?{' '}
          <span onClick={() => setPage('login')}>Sign in →</span>
        </p>
      </div>
    </div>
  );
}
