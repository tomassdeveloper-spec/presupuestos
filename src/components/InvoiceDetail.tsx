import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Edit2,
  CheckCircle,
  AlertCircle,
  Briefcase,
  User,
  Download,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceDetailProps {
  setCurrentView: (view: string) => void;
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  setCurrentView,
  selectedInvoiceId,
  setSelectedInvoiceId,
}) => {
  const { user, profile } = useAuth();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'a4'>('summary');
  const [downloading, setDownloading] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (!selectedInvoiceId || !user) return;

    const fetchInvoiceDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', selectedInvoiceId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setInvoice(data);
      } catch (err) {
        console.error('Error al recuperar detalles:', err);
        showNotification('error', 'No se pudieron recuperar los detalles del documento.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [selectedInvoiceId, user]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-sheet-a4');
    if (!element) {
      showNotification('error', 'No se encontró la hoja del documento.');
      return;
    }

    setDownloading(true);
    showNotification('success', 'Generando PDF de alta calidad, espera un momento...');

    try {
      // Esperar brevemente para asegurar que los estilos y fuentes se apliquen bien
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2.5, // Alta densidad de píxeles para máxima nitidez
        useCORS: true, // Permitir imágenes CORS
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024, // Forzar ancho de renderizado estable
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Crear documento PDF en formato A4 (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Páginas adicionales si el documento es muy largo
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fileName = `Presupuesto_${invoice?.number || 'documento'}.pdf`;
      pdf.save(fileName);
      showNotification('success', '¡PDF generado y descargado correctamente!');
    } catch (err) {
      console.error('Error al generar PDF con jsPDF:', err);
      showNotification('error', 'Hubo un error al compilar el PDF. Inténtalo de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  const handleEdit = () => {
    setCurrentView('invoice-form-edit');
  };

  const handleBack = () => {
    setSelectedInvoiceId(null);
    setCurrentView('invoices');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 justify-center align-center" style={{ height: '50vh' }}>
        <div
          style={{
            border: '4px solid var(--border-color)',
            borderTop: '4px solid var(--accent-color)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p className="text-secondary mt-3">Cargando vista previa...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="card text-center p-8 flex flex-col align-center justify-center" style={{ height: '300px' }}>
        <AlertCircle size={48} className="text-danger mb-3" />
        <h3 className="text-lg font-bold">Documento no encontrado</h3>
        <p className="text-muted text-sm mt-1">
          No tienes permisos para ver este documento o ha sido eliminado.
        </p>
        <button onClick={handleBack} className="btn btn-secondary mt-4">
          Volver a Documentos
        </button>
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

      {/* CABECERA ACCIONES */}
      <div className="page-header flex justify-between align-center flex-wrap gap-4 no-print">
        <div className="flex align-center gap-3">
          <button
            onClick={handleBack}
            className="btn btn-secondary btn-icon-only btn-sm"
            title="Volver al Listado"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">{invoice.number}</h1>
            <p className="text-secondary">
              Vista previa del presupuesto.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleEdit} className="btn btn-secondary">
            <Edit2 size={18} />
            Editar
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-primary" disabled={downloading}>
            {downloading ? (
              <div
                style={{
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  animation: 'spin 1s linear infinite',
                }}
              />
            ) : (
              <Download size={18} />
            )}
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* METRICAS ACCIONES RÁPIDAS (Borrador/Pagado etc) */}
      <div
        className="card flex justify-between align-center p-4 mb-6 flex-wrap gap-3 no-print"
        style={{
          borderLeft: `4px solid ${
            invoice.status === 'pagado' || invoice.status === 'aceptado'
              ? 'var(--success-color)'
              : invoice.status === 'vencido' || invoice.status === 'rechazado'
              ? 'var(--danger-color)'
              : 'var(--secondary-accent)'
          }`,
        }}
      >
        <div className="flex align-center gap-2">
          <span className="text-sm font-semibold text-secondary">Estado actual:</span>
          <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
        </div>

        <div className="text-sm text-muted">
          <span>Detalles y condiciones de este presupuesto.</span>
        </div>
      </div>

      {/* Selector de Vista en Móvil */}
      <div className="show-on-mobile no-print" style={{ marginBottom: '1rem' }}>
        <div className="flex gap-2 p-1 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('summary')}
            className="btn btn-sm flex-1"
            style={{
              backgroundColor: activeTab === 'summary' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'summary' ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: activeTab === 'summary' ? 'var(--shadow-sm)' : 'none',
              fontWeight: activeTab === 'summary' ? '600' : '500',
              padding: '0.375rem 0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('a4')}
            className="btn btn-sm flex-1"
            style={{
              backgroundColor: activeTab === 'a4' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'a4' ? 'var(--accent-color)' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: activeTab === 'a4' ? 'var(--shadow-sm)' : 'none',
              fontWeight: activeTab === 'a4' ? '600' : '500',
              padding: '0.375rem 0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            Documento A4
          </button>
        </div>
      </div>

      {/* Aviso de deslizamiento para móvil */}
      {activeTab === 'a4' && (
        <div className="show-on-mobile no-print" style={{ marginBottom: '0.75rem' }}>
          <div 
            style={{
              textAlign: 'center',
              backgroundColor: 'var(--accent-light)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-border)'
            }}
          >
            <p className="text-xs text-accent font-medium">
              💡 Desliza hacia los lados para ver el presupuesto completo.
            </p>
          </div>
        </div>
      )}

      {/* VISTA MÓVIL NATIVA: RESUMEN DE DETALLES */}
      {activeTab === 'summary' && (
        <div className="show-on-mobile no-print">
          {/* Tarjeta Principal de Resumen */}
          <div className="card flex flex-col gap-3 mb-4">
            <div className="flex justify-between align-center">
              <span className="text-xs text-muted">Presupuesto {invoice.number}</span>
              <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-secondary">Total del Presupuesto</span>
              <h2 className="text-2xl font-bold text-accent mt-1">{formatCurrency(invoice.total)}</h2>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }} className="flex justify-between text-xs text-muted">
              <span>Fecha de Emisión:</span>
              <span className="font-semibold text-secondary">{new Date(invoice.date).toLocaleDateString('es-ES')}</span>
            </div>
          </div>

          {/* Tarjeta de Datos del Cliente */}
          <div className="card mb-4">
            <h3 className="text-sm font-bold text-secondary mb-3 flex align-center gap-2">
              <User size={16} /> Datos del Cliente
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Nombre:</span>
                <span className="font-medium text-primary">{invoice.client_name}</span>
              </div>
              {invoice.client_tax_id && (
                <div className="flex justify-between">
                  <span className="text-muted">CIF/NIF:</span>
                  <span className="font-medium text-primary">{invoice.client_tax_id}</span>
                </div>
              )}
              {invoice.client_phone && (
                <div className="flex justify-between">
                  <span className="text-muted">Teléfono:</span>
                  <span className="font-medium text-primary">{invoice.client_phone}</span>
                </div>
              )}
              {invoice.client_email && (
                <div className="flex justify-between">
                  <span className="text-muted">Email:</span>
                  <span className="font-medium text-primary">{invoice.client_email}</span>
                </div>
              )}
              {invoice.client_address && (
                <div className="flex flex-col gap-1 mt-1" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                  <span className="text-xs text-muted">Dirección de Obra / Envío:</span>
                  <span className="font-medium text-primary">{invoice.client_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Conceptos / Trabajos */}
          <div className="card mb-4">
            <h3 className="text-sm font-bold text-secondary mb-3 flex align-center gap-2">
              <Briefcase size={16} /> Conceptos y Trabajos
            </h3>
            <div className="flex flex-col gap-3">
              {invoice.items && invoice.items.map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <p className="font-semibold text-sm text-primary">{item.description}</p>
                  <div className="flex justify-between text-xs text-muted mt-2">
                    <span>Cant: <strong className="text-secondary">{item.quantity}</strong></span>
                    <span>Precio: <strong className="text-secondary">{formatCurrency(item.unit_price)}</strong></span>
                    <span className="font-bold text-accent">{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de Totales */}
          <div className="card mb-4">
            <h3 className="text-sm font-bold text-secondary mb-3">Resumen Económico</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal (Neto):</span>
                <span className="font-medium text-primary">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">IVA ({invoice.tax_rate}%):</span>
                <span className="font-medium text-primary">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              {invoice.irpf_rate > 0 && (
                <div className="flex justify-between text-danger">
                  <span>Retención IRPF (-{invoice.irpf_rate}%):</span>
                  <span className="font-medium">-{formatCurrency(invoice.irpf_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-2" style={{ borderTop: '2px solid var(--border-color)', paddingTop: '0.75rem', color: 'var(--accent-color)' }}>
                <span>Total Presupuesto:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          {invoice.notes && (
            <div className="card mb-4" style={{ borderLeft: '3px solid var(--secondary-accent)' }}>
              <h3 className="text-xs font-bold text-secondary mb-1">Notas adicionales</h3>
              <p className="text-sm text-muted italic">{invoice.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* PREVISUALIZACIÓN DE FACTURA (A4 FISICO DE OBRA) */}
      <div className={`pdf-preview-container ${activeTab !== 'a4' ? 'hide-on-mobile' : ''}`}>
        <div className="a4-sheet" id="invoice-sheet-a4">
          
          {/* CABECERA DOCUMENTO */}
          <div>
            <div className="pdf-header">
              <div className="pdf-company-details">
                <div className="pdf-company-name">{profile?.company_name || 'MI EMPRESA DE REFORMAS'}</div>
                <div style={{ fontSize: '9pt', color: '#555555' }}>
                  <p><strong>Titular:</strong> {profile?.owner_name || 'Tomás Pérez'}</p>
                  <p><strong>NIF/CIF:</strong> {profile?.tax_id || 'B87654321'}</p>
                  <p><strong>Dirección:</strong> {profile?.address || 'C/ Mayor 2, Madrid'}</p>
                  {profile?.phone && <p><strong>Teléfono:</strong> {profile.phone}</p>}
                  {profile?.email && <p><strong>Email:</strong> {profile.email}</p>}
                </div>
              </div>

              <div className="pdf-invoice-title-section">
                <div className="pdf-invoice-title">
                  PRESUPUESTO
                </div>
                <div className="pdf-invoice-number">
                  Número: {invoice.number}
                </div>
                <div style={{ fontSize: '9.5pt', color: '#666666', marginTop: '6pt' }}>
                  <p><strong>Fecha:</strong> {new Date(invoice.date).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>

            {/* DETALLES DEL CLIENTE */}
            <div className="pdf-details-grid">
              <div>
                <div className="pdf-section-title">
                  <span className="flex align-center gap-1" style={{ fontSize: '8pt', color: '#888' }}>
                    <User size={12} /> DATOS DEL CLIENTE
                  </span>
                </div>
                <div style={{ fontSize: '9.5pt', lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '2pt' }}>{invoice.client_name}</p>
                  {invoice.client_tax_id && <p><strong>CIF/NIF:</strong> {invoice.client_tax_id}</p>}
                  {invoice.client_address && <p><strong>Dirección:</strong> {invoice.client_address}</p>}
                  {invoice.client_phone && <p><strong>Teléfono:</strong> {invoice.client_phone}</p>}
                  {invoice.client_email && <p><strong>Email:</strong> {invoice.client_email}</p>}
                </div>
              </div>

              <div>
                {/* LUGAR U OBRA */}
                <div className="pdf-section-title">
                  <span className="flex align-center gap-1" style={{ fontSize: '8pt', color: '#888' }}>
                    <Briefcase size={12} /> REFERENCIA DE OBRA
                  </span>
                </div>
                <div style={{ fontSize: '9.5pt', lineHeight: 1.5, color: '#444' }}>
                  <p><strong>Concepto:</strong> Trabajos de Albañilería general</p>
                  <p><strong>Ubicación:</strong> {invoice.client_address || 'Dirección de obra facilitada'}</p>
                  <p><strong>Moneda:</strong> Euro (€)</p>
                </div>
              </div>
            </div>

            {/* TABLA DE CONCEPTOS */}
            <table className="pdf-table">
              <thead>
                <tr>
                  <th style={{ width: '60%' }}>Descripción del Concepto / Obras y Materiales</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Cantidad</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Precio Unit.</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items &&
                  invoice.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500', color: '#222' }}>{item.description}</td>
                      <td style={{ textAlign: 'center', color: '#555' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', color: '#555' }}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* DESGLOSE TOTAL */}
          <div>
            <div className="pdf-summary-container">
              <table className="pdf-summary-table">
                <tbody>
                  <tr>
                    <td style={{ color: '#666', fontWeight: '500' }}>Subtotal (Neto):</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#666', fontWeight: '500' }}>IVA ({invoice.tax_rate}%):</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(invoice.tax_amount)}</td>
                  </tr>
                  {invoice.irpf_rate > 0 && (
                    <tr style={{ color: '#c2410c' }}>
                      <td style={{ fontWeight: '500' }}>Retención IRPF (-{invoice.irpf_rate}%):</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>-{formatCurrency(invoice.irpf_amount)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td style={{ fontWeight: 'bold', color: '#111' }}>TOTAL PRESUPUESTO:</td>
                    <td style={{ textAlign: 'right', fontWeight: '900', color: '#111', fontSize: '14pt' }}>
                      {formatCurrency(invoice.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* NOTAS Y FIRMA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20pt', marginTop: '10pt', borderTop: '1px solid #eeeeee', paddingTop: '15pt' }}>
              <div style={{ fontSize: '8.5pt', color: '#555555', lineHeight: 1.5 }}>
                {invoice.notes && (
                  <div style={{ borderLeft: '2px solid #ccc', paddingLeft: '6pt', fontStyle: 'italic' }}>
                    <strong>Notas adicionales:</strong> {invoice.notes}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', fontSize: '9pt' }}>
                <div style={{ width: '120pt', borderBottom: '1px solid #999', height: '40pt' }}></div>
                <p style={{ marginTop: '6pt', color: '#666', fontWeight: '500' }}>Firma del Emisor</p>
              </div>
            </div>

            {/* PIE DE PÁGINA COMERCIAL */}
            <div className="pdf-footer">
              <p>Gracias por confiar en mis servicios.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
