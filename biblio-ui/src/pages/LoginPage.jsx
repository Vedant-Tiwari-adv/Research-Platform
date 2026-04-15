import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input, Divider } from '../components/UI';

export default function LoginPage({ setPage }) {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) { toast('Please fill all fields.', 'error'); return; }
    setLoading(true);
    // Simulated login – swap with real API if auth backend exists
    setTimeout(() => {
      const name = email.split('@')[0];
      login({ name, email });
      setLoading(false);
      setPage('upload');
    }, 800);
  };

  return (
    <div className="auth-wrap">
      <div className="bg-noise" />
      <div className="auth-card fade-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">⬡</div>
          <span className="auth-logo-name">BiblioVec</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your research workspace</p>

        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        <Button full loading={loading} onClick={handleLogin}>Sign In</Button>

        <Divider text="or" />

        <p className="auth-footer">
          Don't have an account?{' '}
          <span onClick={() => setPage('register')}>Create one →</span>
        </p>
      </div>
    </div>
  );
}
