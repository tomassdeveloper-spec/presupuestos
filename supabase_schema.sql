-- ====================================================================
-- ESQUEMA DE BASE DE DATOS PARA PRESUPUESTOS PRO
-- ====================================================================
-- Instrucciones:
-- 1. Ve a tu panel de control de Supabase (https://supabase.com).
-- 2. Entra en tu proyecto y navega hasta "SQL Editor" en el menú lateral.
-- 3. Crea una nueva consulta ("New query").
-- 4. Pega todo este código SQL y haz clic en "Run".
-- ====================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. TABLA DE PERFILES (DATOS DE TU EMPRESA / AUTÓNOMO)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para profiles
DROP POLICY IF EXISTS "Permitir lectura del propio perfil" ON public.profiles;
CREATE POLICY "Permitir lectura del propio perfil" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Permitir inserción del propio perfil" ON public.profiles;
CREATE POLICY "Permitir inserción del propio perfil" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Permitir actualización del propio perfil" ON public.profiles;
CREATE POLICY "Permitir actualización del propio perfil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- --------------------------------------------------------------------
-- 2. TABLA DE FACTURAS Y PRESUPUESTOS (INVOICES)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('borrador', 'enviado', 'aceptado', 'rechazado')),
    date DATE NOT NULL,
    client_name TEXT NOT NULL,
    client_tax_id TEXT,
    client_address TEXT,
    client_email TEXT,
    client_phone TEXT,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 21.00,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    irpf_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    irpf_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para invoices (El usuario autenticado solo puede operar en sus propios datos)
DROP POLICY IF EXISTS "Permitir todo sobre facturas propias" ON public.invoices;
CREATE POLICY "Permitir todo sobre facturas propias" 
    ON public.invoices 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 3. TRIGGERS PARA CREACIÓN AUTOMÁTICA DE PERFIL
-- --------------------------------------------------------------------
-- Esta función crea automáticamente un perfil básico vacío cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, owner_name, tax_id, address, phone, email)
  VALUES (
    new.id,
    'Mi Empresa de Albañilería',
    'Tu Nombre',
    'NIF/CIF Temporal',
    'Tu Dirección',
    '',
    new.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
