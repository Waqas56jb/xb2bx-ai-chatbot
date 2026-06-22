import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api.js';
import { setToken } from '../auth.js';
import { CONFIG } from '../config.js';
import { Button, ErrorNote } from '../components/ui.jsx';

export default function Login() {
  const [token, setTok] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(token.trim());
      setToken(token.trim());
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-badge">＋</div>
        <h1 className="login-title">{CONFIG.brand} Admin</h1>
        <p className="login-sub">Enter your admin token to continue.</p>
        <input
          className="login-input"
          type="password"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setTok(e.target.value)}
          autoFocus
        />
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={busy || !token.trim()}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
