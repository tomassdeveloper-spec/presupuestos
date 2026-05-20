import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import { EnvConfigError } from './components/EnvConfigError';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceDetail } from './components/InvoiceDetail';
import { ProfileSettings } from './components/ProfileSettings';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Enrutador sencillo basado en estados para GitHub Pages SPA
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        className="flex flex-col justify-center align-center w-full"
        style={{
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          style={{
            border: '4px solid var(--border-color)',
            borderTop: '4px solid var(--accent-color)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p className="text-secondary mt-3 font-semibold">Iniciando Presupuestos Pro...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Si no hay usuario autenticado, renderizar la pantalla de Login
  if (!user) {
    return <Login />;
  }

  // Renderizar la vista correspondiente según el estado del enrutador
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            setCurrentView={setCurrentView}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case 'invoices':
        return (
          <InvoiceList
            setCurrentView={setCurrentView}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case 'invoice-form-new':
        return (
          <InvoiceForm
            currentView="invoice-form-new"
            setCurrentView={setCurrentView}
            selectedInvoiceId={null}
          />
        );
      case 'invoice-form-edit':
        return (
          <InvoiceForm
            currentView="invoice-form-edit"
            setCurrentView={setCurrentView}
            selectedInvoiceId={selectedInvoiceId}
          />
        );
      case 'invoice-detail':
        return (
          <InvoiceDetail
            setCurrentView={setCurrentView}
            selectedInvoiceId={selectedInvoiceId}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case 'profile':
        return <ProfileSettings />;
      default:
        return (
          <Dashboard
            setCurrentView={setCurrentView}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

function App() {
  if (!isSupabaseConfigured) {
    return <EnvConfigError />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
