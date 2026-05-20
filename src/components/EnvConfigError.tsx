import React from 'react';
import { AlertTriangle, Key, Link as LinkIcon, Database, CheckCircle2 } from 'lucide-react';

export const EnvConfigError: React.FC = () => {
  return (
    <div
      className="flex align-center justify-center w-full"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-premium)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="flex align-center gap-3" style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-color)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
            }}
          >
            <AlertTriangle size={28} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ margin: 0, letterSpacing: '-0.02em' }}>
              Configuración de Supabase Requerida
            </h1>
            <p className="text-xs text-muted" style={{ marginTop: '2px' }}>
              Presupuestos Pro • Configuración Inicial
            </p>
          </div>
        </div>

        <p className="text-secondary text-sm" style={{ lineHeight: '1.6', marginBottom: '2rem' }}>
          Para que la aplicación funcione, es necesario conectarla con tu base de datos de Supabase. Actualmente el archivo <code>.env</code> está ausente, incompleto o contiene los valores por defecto.
        </p>

        <div className="flex flex-col gap-4" style={{ marginBottom: '2.5rem' }}>
          <h2 className="font-semibold text-sm text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pasos para resolverlo
          </h2>

          {/* Paso 1 */}
          <div className="flex gap-3 align-center p-3 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--accent-color)', display: 'flex' }}>
              <LinkIcon size={18} />
            </div>
            <div className="flex-1 text-sm">
              <span className="font-semibold">1. Obtén tus credenciales</span>
              <p className="text-muted text-xs" style={{ marginTop: '2px' }}>
                Ve a tu panel en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="font-medium text-accent" style={{ textDecoration: 'underline' }}>supabase.com</a> y copia la <strong>URL del proyecto</strong> y la <strong>Anon Key</strong> en <em>Project Settings &gt; API</em>.
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="flex gap-3 align-center p-3 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--accent-color)', display: 'flex' }}>
              <Key size={18} />
            </div>
            <div className="flex-1 text-sm">
              <span className="font-semibold">2. Configura tu archivo .env</span>
              <p className="text-muted text-xs" style={{ marginTop: '2px' }}>
                Abre el archivo <code>.env</code> en la raíz de este proyecto y coloca tus credenciales reales en:
              </p>
              <pre style={{
                marginTop: '6px',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}>
                VITE_SUPABASE_URL=tu_supabase_url_real{"\n"}
                VITE_SUPABASE_ANON_KEY=tu_anon_key_real
              </pre>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="flex gap-3 align-center p-3 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--accent-color)', display: 'flex' }}>
              <Database size={18} />
            </div>
            <div className="flex-1 text-sm">
              <span className="font-semibold">3. Inicializa las tablas SQL</span>
              <p className="text-muted text-xs" style={{ marginTop: '2px' }}>
                Copia el contenido de <code>supabase_schema.sql</code> y ejecútalo en la pestaña <em>SQL Editor</em> de Supabase para configurar la base de datos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex align-center gap-2 p-3 text-xs rounded-md" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-color)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>Vite detectará los cambios en tu archivo <code>.env</code> y recargará la aplicación de forma automática en cuanto guardes.</span>
        </div>
      </div>
    </div>
  );
};
