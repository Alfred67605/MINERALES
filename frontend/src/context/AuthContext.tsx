import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export type RolUsuario = 'ADMINISTRADOR' | 'ALMACENERO' | 'VENDEDOR' | 'LABORATORIO' | 'CONSULTA';

export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  username: string;
  rol: RolUsuario;
}

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  login: (identificador: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  tienePermiso: (...roles: RolUsuario[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('mineralflow_token');
      if (!token) {
        setCargando(false);
        return;
      }
      try {
        const res = await apiFetch<{ usuario: UsuarioSesion }>('/api/auth/me');
        setUsuario(res.usuario);
      } catch {
        localStorage.removeItem('mineralflow_token');
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    };
    verificarSesion();
  }, []);

  const login = async (identificador: string, password: string) => {
    const res = await apiFetch<{ token: string; usuario: UsuarioSesion }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identificador, password }),
    });
    localStorage.setItem('mineralflow_token', res.token);
    setUsuario(res.usuario);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar error de red al cerrar sesión
    }
    localStorage.removeItem('mineralflow_token');
    setUsuario(null);
  };

  const tienePermiso = (...roles: RolUsuario[]) => {
    if (!usuario) return false;
    return roles.includes(usuario.rol);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return ctx;
}

