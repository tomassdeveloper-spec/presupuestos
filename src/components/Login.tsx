import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Hammer, Lock, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Correo electrónico o contraseña incorrectos.');
        } else {
          setError(error.message);
        }
      }
    } catch (err: any) {
      setError('Ocurrió un error inesperado al intentar iniciar sesión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Hammer size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold">Presupuestos Pro</h1>
          <p className="text-secondary text-sm mt-1">
            Gestión Profesional de Presupuestos y Facturas
          </p>
        </div>

        {error && (
          <div
            className="flex align-center gap-2 p-3 text-sm rounded-md mb-4"
            style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger-color)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                }}
              >
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '40px' }}
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                }}
              >
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full font-semibold mt-2"
            disabled={loading}
          >
            {loading ? 'Iniciando Sesión...' : 'Entrar al Panel'}
          </button>
        </form>

        <div className="text-center text-xs text-muted mt-6">
          <p>Esta aplicación está protegida por contraseña.</p>
          <p className="mt-1">
            Crea tu usuario único en Supabase console para acceder.
          </p>
        </div>
      </div>
    </div>
  );
};
