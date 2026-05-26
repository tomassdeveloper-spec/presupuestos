import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  FileQuestion,
  PlusCircle,
  ArrowUpRight,
  Eye,
  FileText,
  Hammer,
} from 'lucide-react';

interface DashboardProps {
  setCurrentView: (view: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setCurrentView,
  setSelectedInvoiceId,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBudgeted: 0,
    acceptedBudgeted: 0,
    pendingBudgeted: 0,
    rejectedBudgeted: 0,
  });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Obtener todos los presupuestos del usuario
        const { data: documents, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        if (documents) {
          let totalBudgeted = 0;
          let acceptedBudgeted = 0;
          let pendingBudgeted = 0;
          let rejectedBudgeted = 0;

          documents.forEach((doc: any) => {
            const amount = Number(doc.total);
            totalBudgeted += amount;

            if (doc.status === 'aceptado') {
              acceptedBudgeted += amount;
            } else if (doc.status === 'borrador' || doc.status === 'enviado') {
              pendingBudgeted += amount;
            } else if (doc.status === 'rechazado') {
              rejectedBudgeted += amount;
            }
          });

          setStats({
            totalBudgeted,
            acceptedBudgeted,
            pendingBudgeted,
            rejectedBudgeted,
          });

          // Obtener los 5 presupuestos más recientes
          setRecentDocs(documents.slice(0, 5));
        }
      } catch (err) {
        console.error('Error al cargar datos del Dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const handleQuickCreate = () => {
    setCurrentView('invoice-form-new');
  };

  const handleViewDoc = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentView('invoice-detail');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  const { totalBudgeted, acceptedBudgeted, pendingBudgeted, rejectedBudgeted } = stats;

  const acceptedPercent =
    totalBudgeted > 0 ? Math.round((acceptedBudgeted / totalBudgeted) * 100) : 0;
  const pendingPercent =
    totalBudgeted > 0 ? Math.round((pendingBudgeted / totalBudgeted) * 100) : 0;
  const rejectedPercent =
    totalBudgeted > 0 ? Math.max(0, 100 - acceptedPercent - pendingPercent) : 0;

  if (loading) {
    return (
      <div className="flex flex-col flex-1 justify-center align-center" style={{ height: '70vh' }}>
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
        <p className="text-secondary mt-3 font-medium">Cargando resumen de presupuestos...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* CABECERA */}
      <div className="page-header flex justify-between align-center flex-wrap gap-4">
        <div>
          <h1 className="page-title">Resumen de Presupuestos</h1>
          <p className="text-secondary">Bienvenido a tu panel de control de presupuestos.</p>
        </div>

        <div>
          <button
            onClick={handleQuickCreate}
            className="btn btn-primary"
          >
            <PlusCircle size={18} />
            <span>Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {/* METRICAS */}
      <div className="metrics-grid">
        <div className="card metric-card card-hover">
          <div className="flex justify-between align-center">
            <span className="text-sm font-semibold text-secondary">Total Presupuestado</span>
            <div
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-color)',
                padding: '0.375rem',
                borderRadius: '6px',
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="metric-value text-accent">{formatCurrency(totalBudgeted)}</span>
          <div className="metric-change text-muted">
            <span>Histórico acumulado</span>
          </div>
        </div>

        <div className="card metric-card card-hover">
          <div className="flex justify-between align-center">
            <span className="text-sm font-semibold text-secondary">Aceptados</span>
            <div
              style={{
                backgroundColor: 'var(--success-light)',
                color: 'var(--success-color)',
                padding: '0.375rem',
                borderRadius: '6px',
              }}
            >
              <CheckCircle size={20} />
            </div>
          </div>
          <span className="metric-value text-success">{formatCurrency(acceptedBudgeted)}</span>
          <div className="metric-change text-muted">
            <span>Presupuestos aprobados</span>
          </div>
        </div>

        <div className="card metric-card card-hover">
          <div className="flex justify-between align-center">
            <span className="text-sm font-semibold text-secondary">Pendientes</span>
            <div
              style={{
                backgroundColor: 'var(--warning-light)',
                color: 'var(--warning-color)',
                padding: '0.375rem',
                borderRadius: '6px',
              }}
            >
              <Clock size={20} />
            </div>
          </div>
          <span className="metric-value text-warning">{formatCurrency(pendingBudgeted)}</span>
          <div className="metric-change text-muted">
            <span>En borrador o enviados</span>
          </div>
        </div>

        <div className="card metric-card card-hover">
          <div className="flex justify-between align-center">
            <span className="text-sm font-semibold text-secondary">Rechazados</span>
            <div
              style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-color)',
                padding: '0.375rem',
                borderRadius: '6px',
              }}
            >
              <FileQuestion size={20} />
            </div>
          </div>
          <span className="metric-value text-danger">{formatCurrency(rejectedBudgeted)}</span>
          <div className="metric-change text-muted">
            <span>Presupuestos no aceptados</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: '1.5rem',
        }}
        id="dashboard-grid-widgets"
      >
        <style>{`
          @media (max-width: 1024px) {
            #dashboard-grid-widgets {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* LISTADO DE ACTIVIDAD RECIENTE */}
        <div className="card flex flex-col gap-4">
          <div className="flex justify-between align-center">
            <h2 className="text-lg font-bold">Presupuestos Recientes</h2>
            <button
              onClick={() => setCurrentView('invoices')}
              className="btn btn-secondary btn-sm"
            >
              Ver todos
              <ArrowUpRight size={14} />
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div
              className="flex flex-col align-center justify-center p-6 text-center"
              style={{ minHeight: '200px' }}
            >
              <FileText size={48} className="text-muted" style={{ marginBottom: '0.75rem', strokeWidth: 1.5 }} />
              <p className="font-semibold text-secondary">Sin presupuestos aún</p>
              <p className="text-muted text-sm mt-1">Crea tu primer presupuesto para empezar.</p>
            </div>
          ) : (
            <>
              {/* Vista de escritorio: Tabla */}
              <div className="table-responsive hide-on-mobile">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th className="text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocs.map((doc) => (
                      <tr key={doc.id}>
                        <td className="font-semibold">{doc.number}</td>
                        <td>{doc.client_name}</td>
                        <td>
                          <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                        </td>
                        <td className="font-semibold">{formatCurrency(doc.total)}</td>
                        <td className="text-right">
                          <button
                            onClick={() => handleViewDoc(doc.id)}
                            className="btn btn-secondary btn-icon-only btn-sm"
                            title="Ver Detalle"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil: Lista de tarjetas táctiles */}
              <div className="show-on-mobile mobile-card-list">
                {recentDocs.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="mobile-item-card" 
                    onClick={() => handleViewDoc(doc.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mobile-card-row">
                      <span className="font-bold text-accent" style={{ fontSize: '0.95rem' }}>{doc.number}</span>
                      <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                    </div>
                    <div className="mobile-card-row" style={{ marginTop: '0.25rem', alignItems: 'flex-start' }}>
                      <span className="font-semibold text-sm text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', maxWidth: '70%', lineHeight: '1.2' }}>
                        {doc.client_name}
                      </span>
                      <span className="font-bold text-base text-primary" style={{ whiteSpace: 'nowrap' }}>{formatCurrency(doc.total)}</span>
                    </div>
                    <div className="mobile-card-divider" />
                    <div className="mobile-card-row">
                      <span className="text-xs text-muted">
                        {new Date(doc.date).toLocaleDateString('es-ES')}
                      </span>
                      <span className="text-xs text-accent flex align-center gap-1 font-semibold">
                        Ver detalle <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* GRÁFICO VISUAL DE PRESUPUESTOS Y RATIOS */}
        <div className="card flex flex-col gap-6">
          <h2 className="text-lg font-bold">Distribución de Presupuestos</h2>

          {totalBudgeted === 0 ? (
            <div
              className="flex flex-col align-center justify-center p-6 text-center"
              style={{ minHeight: '200px' }}
            >
              <Hammer size={48} className="text-muted" style={{ marginBottom: '0.75rem', strokeWidth: 1.5 }} />
              <p className="font-semibold text-secondary">Sin presupuestos creados</p>
              <p className="text-muted text-sm mt-1">
                La proporción de estados se calculará una vez crees presupuestos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6" style={{ height: '100%', justifyContent: 'center' }}>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-success">Aceptados ({acceptedPercent}%)</span>
                  <span className="text-warning">Pendientes ({pendingPercent}%)</span>
                  <span className="text-danger">Rechazados ({rejectedPercent}%)</span>
                </div>

                {/* Barra de progreso CSS nativa */}
                <div
                  style={{
                    width: '100%',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--border-color)',
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${acceptedPercent}%`,
                      backgroundColor: 'var(--success-color)',
                      transition: 'width 0.8s ease-out',
                    }}
                  />
                  <div
                    style={{
                      width: `${pendingPercent}%`,
                      backgroundColor: 'var(--warning-color)',
                      transition: 'width 0.8s ease-out',
                    }}
                  />
                  <div
                    style={{
                      width: `${rejectedPercent}%`,
                      backgroundColor: 'var(--danger-color)',
                      transition: 'width 0.8s ease-out',
                    }}
                  />
                </div>
              </div>

              {/* Leyenda de valores */}
              <div className="flex flex-col gap-3 mt-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <div className="flex justify-between align-center">
                  <div className="flex align-center gap-2">
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--success-color)',
                        display: 'inline-block',
                      }}
                    />
                    <span className="text-sm text-secondary font-medium">Aceptados</span>
                  </div>
                  <span className="font-bold text-success">{formatCurrency(acceptedBudgeted)}</span>
                </div>

                <div className="flex justify-between align-center">
                  <div className="flex align-center gap-2">
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--warning-color)',
                        display: 'inline-block',
                      }}
                    />
                    <span className="text-sm text-secondary font-medium">Pendientes (Borrador/Enviados)</span>
                  </div>
                  <span className="font-bold text-warning">{formatCurrency(pendingBudgeted)}</span>
                </div>

                <div className="flex justify-between align-center">
                  <div className="flex align-center gap-2">
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--danger-color)',
                        display: 'inline-block',
                      }}
                    />
                    <span className="text-sm text-secondary font-medium">Rechazados</span>
                  </div>
                  <span className="font-bold text-danger">{formatCurrency(rejectedBudgeted)}</span>
                </div>

                <div
                  className="flex justify-between align-center"
                  style={{
                    borderTop: '1px dashed var(--border-color)',
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <span className="text-sm font-semibold">Total Presupuestado</span>
                  <span className="font-bold text-lg">{formatCurrency(totalBudgeted)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
