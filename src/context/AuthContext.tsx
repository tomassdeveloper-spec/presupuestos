import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface CompanyProfile {
  id: string;
  company_name: string;
  owner_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: CompanyProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener el perfil de la empresa:', error);
      } else if (data) {
        setProfile(data as CompanyProfile);
      }
    } catch (err) {
      console.error('Excepción al obtener el perfil:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Cargar el perfil de la empresa de forma aislada y desacoplada del flujo de auth para evitar deadlocks de Web Locks en Supabase
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  // 2. Controlar la inicialización de la sesión y escuchar eventos de cambio de auth
  useEffect(() => {
    let active = true;

    // Fallback de seguridad: forzar la desactivación del loader principal a los 5 segundos si algo en la red se atasca
    const fallbackTimer = setTimeout(() => {
      if (active) {
        console.warn('Carga de sesión atascada. Desactivando loader por fallback de seguridad.');
        setLoading(false);
      }
    }, 5000);

    // Obtener la sesión inicial de forma segura
    try {
      supabase.auth.getSession()
        .then(({ data: { session } }: any) => {
          if (!active) return;
          setSession(session);
          setUser(session?.user ?? null);
          clearTimeout(fallbackTimer);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error al obtener la sesión inicial:', err);
          if (active) {
            clearTimeout(fallbackTimer);
            setLoading(false);
          }
        });
    } catch (err) {
      console.error('Excepción al obtener la sesión:', err);
      clearTimeout(fallbackTimer);
      setLoading(false);
    }

    // Suscribirse a cambios de estado de autenticación (completamente síncrono para evitar deadlocks en el cliente de Supabase)
    let subscription: any = null;
    try {
      const res = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
        if (!active) return;
        setSession(session);
        setUser(session?.user ?? null);
      });
      subscription = res.data?.subscription;
    } catch (err) {
      console.error('Error al suscribirse a onAuthStateChange:', err);
    }

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
