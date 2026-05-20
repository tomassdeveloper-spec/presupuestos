import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface InvoiceListProps {
  setCurrentView: (view: string) => void;
  setSelectedInvoiceId: (id: string | null) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  setCurrentView,
  setSelectedInvoiceId,
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Notificaciones y confirmación de borrado
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error al cargar presupuestos:', err);
      showNotification('error', 'No se pudieron cargar los presupuestos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let result = [...documents];

    // Buscar por cliente o número o importe
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.client_name.toLowerCase().includes(term) ||
          doc.number.toLowerCase().includes(term) ||
          String(doc.total).includes(term)
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'todos') {
      result = result.filter((doc) => doc.status === statusFilter);
    }

    setFilteredDocs(result);
  }, [documents, searchTerm, statusFilter]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateNew = () => {
    setCurrentView('invoice-form-new');
  };

  const handleView = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentView('invoice-detail');
  };

  const handleEdit = (id: string) => {
    setSelectedInvoiceId(id);
    setCurrentView('invoice-form-edit');
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', deleteConfirmId);
      if (error) throw error;

      showNotification('success', 'Presupuesto eliminado correctamente.');
      setDocuments((prev) => prev.filter((d) => d.id !== deleteConfirmId));
    } catch (err) {
      console.error('Error al borrar presupuesto:', err);
      showNotification('error', 'No se pudo eliminar el presupuesto.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className="flex flex-col w-full">
      {/* NOTIFICACIÓN EFECTIVA */}
      {notification && (
        <div
          className="flex align-center gap-2 p-4 rounded-md mb-4"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000,
            backgroundColor:
              notification.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
            color:
              notification.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
            border: `1px solid ${
              notification.type === 'success'
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(239, 68, 68, 0.2)'
            }`,
            boxShadow: 'var(--shadow-lg)',
            minWidth: '300px',
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN BORRADO NATIVO ESTILIZADO */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '1rem', padding: '2rem' }}>
            <h3 className="text-lg font-bold flex align-center gap-2 text-danger">
              <AlertCircle size={22} />
              ¿Confirmas la eliminación?
            </h3>
            <p className="text-secondary text-sm mt-2 mb-6">
              Esta acción no se puede deshacer. El presupuesto se eliminará permanentemente de tu base de datos de Supabase.
            </p>
            <div className="flex justify-between gap-3">
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger flex-1"
                onClick={confirmDelete}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA */}
      <div className="page-header flex justify-between align-center flex-wrap gap-4">
        <div>
          <h1 className="page-title">Historial de Presupuestos</h1>
          <p className="text-secondary">Visualiza, filtra y administra tus presupuestos emitidos.</p>
        </div>

        <div>
          <button
            onClick={handleCreateNew}
            className="btn btn-primary"
          >
            <PlusCircle size={18} />
            <span>Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="card flex flex-col gap-4 mb-6">
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* BUSCADOR */}
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
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
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar por cliente, nº de presupuesto o importe..."
              className="form-control"
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* FILTRO ESTADO */}
          <div className="flex align-center gap-2">
            <span className="text-sm font-semibold text-secondary flex align-center gap-1">
              <Filter size={14} /> Estado:
            </span>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado (Pendiente)</option>
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>
      </div>

      {/* LISTADO PRINCIPAL */}
      {loading ? (
        <div className="flex flex-col justify-center align-center card" style={{ height: '300px' }}>
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
          <p className="text-secondary mt-3">Obteniendo tus presupuestos...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="card flex flex-col align-center justify-center p-8 text-center" style={{ minHeight: '300px' }}>
          <FileText size={56} className="text-muted" style={{ marginBottom: '1rem', strokeWidth: 1.5 }} />
          <h3 className="text-lg font-bold text-secondary">No se encontraron presupuestos</h3>
          <p className="text-muted text-sm mt-1" style={{ maxWidth: '400px' }}>
            No hay ningún presupuesto que coincida con tus criterios de búsqueda o filtros. ¡Intenta modificarlos o crea uno nuevo!
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
          {/* Vista de escritorio: Tabla */}
          <div className="table-responsive hide-on-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>{new Date(doc.date).toLocaleDateString('es-ES')}</td>
                    <td className="font-semibold">{doc.number}</td>
                    <td>{doc.client_name}</td>
                    <td>
                      <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                    </td>
                    <td className="font-semibold">{formatCurrency(doc.total)}</td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-center" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleView(doc.id)}
                          className="btn btn-secondary btn-icon-only btn-sm"
                          title="Ver Previsualización"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(doc.id)}
                          className="btn btn-secondary btn-icon-only btn-sm"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(doc.id, e)}
                          className="btn btn-danger btn-icon-only btn-sm"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil: Tarjetas estilizadas */}
          <div className="show-on-mobile mobile-card-list" style={{ padding: '0.5rem' }}>
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="mobile-item-card">
                <div className="mobile-card-row">
                  <span className="font-bold text-accent" style={{ fontSize: '1rem' }}>{doc.number}</span>
                  <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                </div>
                <div className="mobile-card-row" style={{ marginTop: '0.25rem', alignItems: 'flex-start' }}>
                  <span className="font-semibold text-sm text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', maxWidth: '70%', lineHeight: '1.2' }}>
                    {doc.client_name}
                  </span>
                  <span className="font-bold text-base text-primary" style={{ whiteSpace: 'nowrap' }}>{formatCurrency(doc.total)}</span>
                </div>
                <div className="mobile-card-row" style={{ marginTop: '0.25rem' }}>
                  <span className="text-xs text-muted">
                    Emitido: {new Date(doc.date).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="mobile-card-divider" />
                <div className="mobile-card-row" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleView(doc.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.5rem 0.75rem', gap: '0.375rem' }}
                    title="Ver"
                  >
                    <Eye size={14} />
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={() => handleEdit(doc.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.5rem 0.75rem', gap: '0.375rem' }}
                    title="Editar"
                  >
                    <Edit2 size={14} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(doc.id, e)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.5rem 0.75rem', gap: '0.375rem' }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 text-xs text-muted text-right">
            Total mostrados: {filteredDocs.length} presupuestos
          </div>
        </div>
      )}
    </div>
  );
};
