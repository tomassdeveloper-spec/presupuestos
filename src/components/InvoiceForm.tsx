import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Save,
  Plus,
  Trash2,
  Briefcase,
  User,
  Calculator,
  CornerDownRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: string | number;
  unit_price: string | number;
  total: number;
}

interface InvoiceFormProps {
  currentView: 'invoice-form-new' | 'invoice-form-edit';
  setCurrentView: (view: string) => void;
  selectedInvoiceId: string | null;
}

// Auxiliares para manejo de decimales en dispositivos móviles (comas/puntos)
const parseLocaleFloat = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  const str = String(val).replace(',', '.');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

const sanitizeDecimalInput = (value: string): string => {
  // Permitir números y un único separador decimal (punto o coma)
  let sanitized = value.replace(/[^0-9.,]/g, '');
  const firstSeparatorIndex = sanitized.search(/[.,]/);
  if (firstSeparatorIndex !== -1) {
    const prefix = sanitized.slice(0, firstSeparatorIndex + 1);
    const suffix = sanitized.slice(firstSeparatorIndex + 1).replace(/[.,]/g, '');
    sanitized = prefix + suffix;
  }
  return sanitized;
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  currentView,
  setCurrentView,
  selectedInvoiceId,
}) => {
  const { user } = useAuth();
  const isEditMode = currentView === 'invoice-form-edit';

  // Datos del Presupuesto
  const [docNumber, setDocNumber] = useState('');
  const [docStatus, setDocStatus] = useState('borrador');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);

  // Datos del Cliente
  const [clientName, setClientName] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Clientes pasados para autocompletar
  const [pastClients, setPastClients] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Conceptos / Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: '1', unit_price: '0', total: 0 },
  ]);

  // Tasas e Impuestos
  const [taxRate, setTaxRate] = useState(21); // 21% IVA por defecto
  const [irpfRate, setIrpfRate] = useState(0); 
  const [applyIrpf, setApplyIrpf] = useState(false);

  // Totales Calculados
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [irpfAmount, setIrpfAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Cargar clientes históricos para autocompletar
  useEffect(() => {
    if (!user) return;
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('client_name, client_tax_id, client_address, client_email, client_phone')
        .eq('user_id', user.id);
      
      if (!error && data) {
        const uniqueClients: any[] = [];
        const seen = new Set();
        data.forEach((c: any) => {
          if (!seen.has(c.client_name.toLowerCase().trim())) {
            seen.add(c.client_name.toLowerCase().trim());
            uniqueClients.push(c);
          }
        });
        setPastClients(uniqueClients);
      }
    };
    fetchClients();
  }, [user]);

  // Cargar datos si estamos en modo Edición
  useEffect(() => {
    if (!isEditMode || !selectedInvoiceId || !user) return;

    const fetchInvoiceDetails = async () => {
      setPageLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', selectedInvoiceId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setDocNumber(data.number);
          setDocStatus(data.status);
          setDocDate(data.date);
          
          setClientName(data.client_name);
          setClientTaxId(data.client_tax_id || '');
          setClientAddress(data.client_address || '');
          setClientEmail(data.client_email || '');
          setClientPhone(data.client_phone || '');

          setItems(data.items || []);
          setTaxRate(Number(data.tax_rate));
          setIrpfRate(Number(data.irpf_rate));
          setApplyIrpf(Number(data.irpf_rate) > 0);
          setNotes(data.notes || '');
        }
      } catch (err) {
        console.error('Error al recuperar presupuesto:', err);
        showNotification('error', 'No se pudieron recuperar los detalles del presupuesto.');
      } finally {
        setPageLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [selectedInvoiceId, isEditMode, user]);

  // Auto-generar número correlativo sugerido para nuevos presupuestos
  useEffect(() => {
    if (isEditMode || !user) return;

    const generateSuggestedNumber = async () => {
      try {
        const prefix = 'P';
        const year = new Date().getFullYear();
        
        const { data, error } = await supabase
          .from('invoices')
          .select('number')
          .eq('user_id', user.id)
          .like('number', `${prefix}-${year}-%`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const latestNum = data[0].number;
          const parts = latestNum.split('-');
          const lastSeq = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastSeq)) {
            const nextSeq = String(lastSeq + 1).padStart(3, '0');
            setDocNumber(`${prefix}-${year}-${nextSeq}`);
            return;
          }
        }
        
        setDocNumber(`${prefix}-${year}-001`);
      } catch (err) {
        console.error('Error al generar correlativo sugerido:', err);
      }
    };

    generateSuggestedNumber();
  }, [isEditMode, user]);

  // Recalcular Subtotales e Impuestos
  useEffect(() => {
    let sub = 0;
    const updatedItems = items.map((item) => {
      const qty = parseLocaleFloat(item.quantity);
      const price = parseLocaleFloat(item.unit_price);
      const lineTotal = Number((qty * price).toFixed(2));
      sub += lineTotal;
      return { ...item, total: lineTotal };
    });

    let changed = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].total !== updatedItems[i].total) {
        changed = true;
        break;
      }
    }
    if (changed) {
      setItems(updatedItems);
    }

    const calculatedTax = Number((sub * (taxRate / 100)).toFixed(2));
    const activeIrpfRate = applyIrpf ? (irpfRate > 0 ? irpfRate : 15) : 0;
    if (applyIrpf && irpfRate === 0) setIrpfRate(15); 

    const calculatedIrpf = Number((sub * (activeIrpfRate / 100)).toFixed(2));
    const calculatedTotal = Number((sub + calculatedTax - calculatedIrpf).toFixed(2));

    setSubtotal(sub);
    setTaxAmount(calculatedTax);
    setIrpfAmount(calculatedIrpf);
    setTotal(calculatedTotal);
  }, [items, taxRate, irpfRate, applyIrpf]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    if (field === 'quantity') {
      newItems[index].quantity = sanitizeDecimalInput(String(value));
    } else if (field === 'unit_price') {
      newItems[index].unit_price = sanitizeDecimalInput(String(value));
    } else if (field === 'description') {
      newItems[index].description = String(value);
    }
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: '1', unit_price: '0', total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      showNotification('error', 'El presupuesto debe contener al menos un concepto.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Guardar presupuesto en Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const invalidItem = items.some((i) => i.description.trim() === '' || parseLocaleFloat(i.quantity) <= 0);
    if (invalidItem) {
      showNotification('error', 'Completa la descripción y cantidad de todos los conceptos.');
      return;
    }

    setLoading(true);
    
    const payload = {
      user_id: user.id,
      number: docNumber,
      status: docStatus,
      date: docDate,
      client_name: clientName,
      client_tax_id: clientTaxId,
      client_address: clientAddress,
      client_email: clientEmail,
      client_phone: clientPhone,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      irpf_rate: applyIrpf ? irpfRate : 0,
      irpf_amount: applyIrpf ? irpfAmount : 0,
      total,
      notes,
      items: items.map((item) => ({
        description: item.description,
        quantity: parseLocaleFloat(item.quantity),
        unit_price: parseLocaleFloat(item.unit_price),
        total: item.total,
      })),
      type: 'presupuesto', // Compatibilidad con bases de datos que aún tienen la columna NOT NULL
      due_date: docDate,    // Compatibilidad con bases de datos que aún tienen la columna due_date NOT NULL
    };

    try {
      if (isEditMode && selectedInvoiceId) {
        const { error } = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', selectedInvoiceId);

        if (error) throw error;
        showNotification('success', '¡Presupuesto actualizado correctamente!');
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert(payload);

        if (error) throw error;
        showNotification('success', '¡Presupuesto guardado correctamente!');
      }
      
      setTimeout(() => {
        setCurrentView('invoices');
      }, 1500);

    } catch (err: any) {
      console.error('Error al guardar presupuesto:', err);
      showNotification('error', err.message || 'Error al guardar el presupuesto.');
    } finally {
      setLoading(false);
    }
  };

  const selectPastClient = (c: any) => {
    setClientName(c.client_name);
    setClientTaxId(c.client_tax_id || '');
    setClientAddress(c.client_address || '');
    setClientEmail(c.client_email || '');
    setClientPhone(c.client_phone || '');
    setShowAutocomplete(false);
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col flex-1 justify-center align-center" style={{ height: '50vh' }}>
        <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
        <p className="text-secondary mt-3">Cargando datos del editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* NOTIFICACIÓN FLOTANTE */}
      {notification && (
        <div
          className="flex align-center gap-2 p-4 rounded-md mb-4"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000,
            backgroundColor: notification.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
            color: notification.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            boxShadow: 'var(--shadow-lg)',
            minWidth: '300px',
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* CABECERA */}
      <div className="page-header flex justify-between align-center flex-wrap gap-4">
        <div className="flex align-center gap-3">
          <button
            onClick={() => setCurrentView('invoices')}
            className="btn btn-secondary btn-icon-only btn-sm"
            title="Volver"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">
              {isEditMode ? `Editar Presupuesto` : `Crear Nuevo Presupuesto`}
            </h1>
            <p className="text-secondary">Rellena los campos para generar tu presupuesto de obra o servicios.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={loading}
            type="submit"
          >
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar Presupuesto'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6" style={{ maxWidth: '1000px' }}>
        
        {/* WIDGET CONFIG GLOBAL DEL DOCUMENTO */}
        <div className="card grid grid-cols-3 gap-4" id="form-header-grid">
          <style>{`
            @media (max-width: 768px) {
              #form-header-grid {
                grid-template-columns: 1fr 1fr !important;
              }
            }
            @media (max-width: 480px) {
              #form-header-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          <div className="form-group">
            <label className="form-label">Número de Presupuesto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: P-2026-001"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              className="form-control"
              value={docStatus}
              onChange={(e) => setDocStatus(e.target.value)}
            >
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado al Cliente</option>
              <option value="aceptado">Aceptado (Aprobado)</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de Emisión</label>
            <input
              type="date"
              className="form-control"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="card flex flex-col gap-4">
          <h2 className="text-lg font-bold flex align-center gap-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <User size={18} className="text-accent" />
            Datos del Cliente
          </h2>

          <div style={{ position: 'relative' }}>
            <div className="form-group">
              <label className="form-label">Nombre del Cliente / Razón Social</label>
              <input
                type="text"
                className="form-control"
                placeholder="Busca o escribe el nombre del cliente..."
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                required
              />
            </div>

            {/* Listado Autocompletar */}
            {showAutocomplete && pastClients.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {pastClients
                  .filter((c) => c.client_name.toLowerCase().includes(clientName.toLowerCase()))
                  .map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectPastClient(c)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className="nav-link"
                    >
                      <span className="font-semibold block">{c.client_name}</span>
                      <span className="text-xs text-muted">
                        NIF: {c.client_tax_id || 'N/A'} • Email: {c.client_email || 'N/A'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4" id="form-client-subgrid">
            <style>{`
              @media (max-width: 600px) {
                #form-client-subgrid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            
            <div className="form-group">
              <label className="form-label">CIF / NIF / DNI del Cliente</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: 12345678Z"
                value={clientTaxId}
                onChange={(e) => setClientTaxId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dirección Completa</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Calle Mayor 15, Valencia"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" id="form-client-contactgrid">
            <style>{`
              @media (max-width: 600px) {
                #form-client-contactgrid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-control"
                placeholder="Ej: cliente@correo.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono de Contacto</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Ej: 699 999 999"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* CONCEPTOS / DETALLES DE OBRA */}
        <div className="card flex flex-col gap-4">
          <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h2 className="text-lg font-bold flex align-center gap-2">
              <Briefcase size={18} className="text-accent" />
              Conceptos de Albañilería / Servicios
            </h2>
          </div>

          {/* Vista de escritorio: Tabla de conceptos */}
          <div className="hide-on-mobile" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="w-full text-sm invoice-items-table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Descripción del Trabajo / Material</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Precio Unit. (€)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total (€)</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Mano de obra alicatado de paredes o Saco de cemento cola..."
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="form-control text-center"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="form-control text-right"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        required
                      />
                    </td>
                    <td className="text-right font-semibold" style={{ paddingRight: '1rem' }}>
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.total)}
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="btn btn-danger btn-icon-only btn-sm"
                        style={{ padding: '0.375rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil: Bloques apilados en tarjetas */}
          <div className="show-on-mobile w-full" style={{ display: 'none' }}>
            {items.map((item, index) => (
              <div key={index} className="form-item-mobile-card">
                <div className="form-item-mobile-header">
                  <span>Concepto #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="btn btn-danger btn-icon-only btn-sm"
                    style={{ padding: '0.375rem', border: 'none', background: 'none', display: 'flex', alignItems: 'center' }}
                    title="Eliminar Concepto"
                  >
                    <Trash2 size={16} className="text-danger" />
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Descripción del Trabajo / Material</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Mano de obra alicatado..."
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ textAlign: 'left' }}>Cantidad</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control text-center"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ textAlign: 'right' }}>Precio Unit. (€)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-control text-right"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-between align-center" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <span className="text-xs text-muted font-semibold">Total de línea:</span>
                  <span className="font-bold text-accent" style={{ fontSize: '1.1rem' }}>
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Botón de añadir línea en la parte inferior para evitar scroll de búsqueda */}
          <div className="flex justify-center" style={{ marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={addItemRow}
              className="btn btn-secondary w-full"
              style={{
                padding: '0.75rem',
                borderStyle: 'dashed',
                borderWidth: '2px',
                borderColor: 'var(--accent-border)',
                color: 'var(--accent-color)',
                backgroundColor: 'var(--accent-light)',
                fontWeight: 600,
                gap: '0.5rem',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} />
              <span>Añadir Nuevo Concepto / Trabajo</span>
            </button>
          </div>
        </div>

        {/* IMPUESTOS Y RESUMEN ECONÓMICO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '1.5rem',
          }}
          id="form-summary-grid"
        >
          <style>{`
            @media (max-width: 768px) {
              #form-summary-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>

          {/* OPCIONES IMPUESTOS / RETENCIÓN */}
          <div className="card flex flex-col gap-4">
            <h2 className="text-lg font-bold flex align-center gap-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Calculator size={18} className="text-accent" />
              Impuestos y Retenciones
            </h2>

            <div className="form-group">
              <label className="form-label">Porcentaje de IVA (%)</label>
              <select
                className="form-control"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              >
                <option value="21">21% IVA General (Mano de obra y obras normales)</option>
                <option value="10">10% IVA Reducido (Reformas de vivienda habitual)</option>
                <option value="4">4% IVA Superreducido</option>
                <option value="0">0% Exento de IVA</option>
              </select>
            </div>

            <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <label className="flex align-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={applyIrpf}
                  onChange={(e) => setApplyIrpf(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Aplicar Retención de IRPF (Autónomos)
              </label>
              
              {applyIrpf && (
                <div className="flex align-center gap-2 mt-3" style={{ paddingLeft: '1.75rem' }}>
                  <span className="text-sm text-secondary font-medium">Porcentaje IRPF:</span>
                  <select
                    className="form-control"
                    style={{ width: '120px', padding: '0.375rem' }}
                    value={irpfRate}
                    onChange={(e) => setIrpfRate(Number(e.target.value))}
                  >
                    <option value="15">15% General</option>
                    <option value="7">7% Nuevos Autónomos</option>
                    <option value="2">2% Mínimo</option>
                  </select>
                  <span className="text-xs text-muted">(Se resta del total)</span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <label className="form-label">Notas o Condiciones del Presupuesto</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Ej: Plazo de ejecución estimado de 15 días. Validez de este presupuesto: 30 días."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* DESGLOSE ECONÓMICO FINAL */}
          <div className="card flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '2px solid var(--border-color)' }}>
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Desglose de Totales</h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex justify-between align-center">
                  <span className="text-secondary font-medium">Subtotal (Neto):</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between align-center">
                  <span className="text-secondary font-medium">IVA ({taxRate}%):</span>
                  <span className="text-accent font-semibold">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(taxAmount)}
                  </span>
                </div>

                {applyIrpf && (
                  <div className="flex justify-between align-center text-danger">
                    <span className="font-medium flex align-center gap-1">
                      <CornerDownRight size={14} />
                      Retención IRPF (-{irpfRate}%):
                    </span>
                    <span className="font-semibold">
                      -{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(irpfAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '2rem' }}>
              <div className="flex justify-between align-center">
                <span className="text-lg font-bold">Total Presupuesto:</span>
                <span className="text-2xl font-black" style={{ color: 'var(--accent-color)' }}>
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(total)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

