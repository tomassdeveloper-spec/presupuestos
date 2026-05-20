import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Building, User as UserIcon, FileSpreadsheet, MapPin, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos actuales del perfil
  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || '');
      setOwnerName(profile.owner_name || '');
      setTaxId(profile.tax_id || '');
      setAddress(profile.address || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          company_name: companyName,
          owner_name: ownerName,
          tax_id: taxId,
          address,
          phone,
          email,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error al guardar el perfil:', err);
      setError(err.message || 'Error al guardar los datos del perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="page-header">
        <h1 className="page-title">Datos de Empresa / Autónomo</h1>
        <p className="text-secondary">
          Configura tus datos fiscales y de contacto. Esta información aparecerá automáticamente como emisor en todos tus presupuestos.
        </p>
      </div>

      <div style={{ maxWidth: '800px', width: '100%' }}>
        {success && (
          <div
            className="flex align-center gap-3 p-4 rounded-md mb-6"
            style={{
              backgroundColor: 'var(--success-light)',
              color: 'var(--success-color)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <CheckCircle size={20} />
            <div>
              <span className="font-semibold block">¡Perfil Guardado!</span>
              <span className="text-sm">Tus datos fiscales se han actualizado correctamente.</span>
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex align-center gap-3 p-4 rounded-md mb-6"
            style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger-color)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertCircle size={20} />
            <div>
              <span className="font-semibold block">Error al Guardar</span>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
          <h2 className="text-xl font-bold" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
            Información Fiscal
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="companyName">
                Nombre de la Empresa o Marca Comercial
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Building size={18} />
                </span>
                <input
                  id="companyName"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ej: Reformas y Albañilería Tomas"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ownerName">
                Nombre del Titular / Propietario
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <UserIcon size={18} />
                </span>
                <input
                  id="ownerName"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ej: Tomás Pérez González"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="taxId">
                CIF / NIF / DNI Fiscal
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <FileSpreadsheet size={18} />
                </span>
                <input
                  id="taxId"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ej: 12345678A o B87654321"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">
                Dirección Fiscal Completa
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <MapPin size={18} />
                </span>
                <input
                  id="address"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ej: Calle Gran Vía 12, 3ºB, Madrid"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold mt-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
            Información de Contacto
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Teléfono de Contacto
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Phone size={18} />
                </span>
                <input
                  id="phone"
                  type="tel"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ej: +34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Correo Electrónico de Contacto
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ej: info@reformas.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Campo IBAN eliminado por petición del usuario */}

          <div className="flex justify-between align-center mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <span className="text-xs text-muted">
              Última actualización: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : 'Nunca'}
            </span>
            <button
              type="submit"
              className="btn btn-primary font-semibold"
              disabled={loading}
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
