import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Hammer,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  setCurrentView,
}) => {
  const { profile, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const companyInitials = profile?.company_name
    ? profile.company_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PP';

  return (
    <div className="app-container" style={{ flexDirection: 'column', width: '100%' }}>
      {/* Barra de cabecera superior para móviles */}
      <header className="mobile-header no-print">
        <div className="flex align-center gap-2">
          <div className="brand-logo" style={{ padding: '0.375rem', borderRadius: 'var(--radius-sm)' }}>
            <Hammer size={18} strokeWidth={2.5} />
          </div>
          <span className="brand-name" style={{ fontSize: '1.15rem' }}>Presupuestos Pro</span>
        </div>
        <button
          className="btn btn-secondary btn-icon-only"
          onClick={() => setSidebarOpen(true)}
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
          title="Abrir menú"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Overlay difuminado de fondo para móvil */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''} no-print`} 
        onClick={() => setSidebarOpen(false)} 
      />

      <div className="flex w-full" style={{ minHeight: '100vh', flex: 1 }}>
        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''} no-print`}>
          <div>
            <div className="brand-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex align-center gap-2">
                <div className="brand-logo">
                  <Hammer size={24} strokeWidth={2.5} />
                </div>
                <span className="brand-name">Presupuestos Pro</span>
              </div>
              
              {/* Botón cerrar para móviles */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="btn btn-secondary btn-icon-only show-on-mobile"
                style={{ border: 'none', background: 'none', padding: '0.25rem' }}
                title="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="nav-links">
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`nav-link w-full btn-icon ${
                  currentView === 'dashboard' ? 'active' : ''
                }`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <LayoutDashboard size={20} />
                <span>Resumen</span>
              </button>

              <button
                onClick={() => handleNavClick('invoices')}
                className={`nav-link w-full btn-icon ${
                  currentView === 'invoices' ? 'active' : ''
                }`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <FileText size={20} />
                <span>Presupuestos</span>
              </button>

              <button
                onClick={() => handleNavClick('invoice-form-new')}
                className={`nav-link w-full btn-icon ${
                  currentView === 'invoice-form-new' ? 'active' : ''
                }`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <PlusCircle size={20} />
                <span>Nuevo Presupuesto</span>
              </button>

              <button
                onClick={() => handleNavClick('profile')}
                className={`nav-link w-full btn-icon ${
                  currentView === 'profile' ? 'active' : ''
                }`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <Settings size={20} />
                <span>Datos Empresa</span>
              </button>
            </nav>
          </div>

          <div className="sidebar-footer">
            {/* Botón de cambio de tema */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary w-full"
              style={{ justifyContent: 'center' }}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={18} />
                  <span>Modo Oscuro</span>
                </>
              ) : (
                <>
                  <Sun size={18} />
                  <span>Modo Claro</span>
                </>
              )}
            </button>

            {/* Información del perfil del usuario actual */}
            <div className="user-profile">
              <div className="user-avatar">{companyInitials}</div>
              <div className="flex flex-col flex-1" style={{ overflow: 'hidden' }}>
                <span className="font-semibold text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.company_name || 'Mi Empresa'}
                </span>
                <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.owner_name || 'Albañil'}
                </span>
              </div>
              <button
                onClick={signOut}
                className="btn btn-secondary btn-icon-only text-danger"
                style={{ border: 'none', padding: '0.25rem', display: 'flex', background: 'none' }}
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};
