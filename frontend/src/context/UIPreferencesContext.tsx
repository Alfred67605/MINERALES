import React, { createContext, useContext, useState, useEffect } from 'react';

export type DensidadVisual = 'comfortable' | 'compact';
export type Calidad3D = 'auto' | 'high' | 'low';
export type TemaVisual = 'dark' | 'light';

interface UIPreferencesContextValue {
  tema: TemaVisual;
  setTema: (t: TemaVisual) => void;
  densidad: DensidadVisual;
  setDensidad: (d: DensidadVisual) => void;
  escenas3DActivas: boolean;
  setEscenas3DActivas: (v: boolean) => void;
  calidad3D: Calidad3D;
  setCalidad3D: (c: Calidad3D) => void;
}

const UIPreferencesContext = createContext<UIPreferencesContextValue | undefined>(undefined);

export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<TemaVisual>(() => {
    const initial = (localStorage.getItem('mf_tema') as TemaVisual) || 'dark';
    const root = document.documentElement;
    if (initial === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    return initial;
  });

  const [densidad, setDensidadState] = useState<DensidadVisual>(() => {
    return (localStorage.getItem('mf_densidad') as DensidadVisual) || 'comfortable';
  });

  const [escenas3DActivas, setEscenas3DState] = useState<boolean>(() => {
    const saved = localStorage.getItem('mf_3d_activo');
    return saved !== null ? saved === 'true' : true;
  });

  const [calidad3D, setCalidad3DState] = useState<Calidad3D>(() => {
    return (localStorage.getItem('mf_3d_calidad') as Calidad3D) || 'auto';
  });

  const setTema = (t: TemaVisual) => {
    setTemaState(t);
    localStorage.setItem('mf_tema', t);
  };

  const setDensidad = (d: DensidadVisual) => {
    setDensidadState(d);
    localStorage.setItem('mf_densidad', d);
  };

  const setEscenas3DActivas = (v: boolean) => {
    setEscenas3DState(v);
    localStorage.setItem('mf_3d_activo', String(v));
  };

  const setCalidad3D = (c: Calidad3D) => {
    setCalidad3DState(c);
    localStorage.setItem('mf_3d_calidad', c);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (tema === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [tema]);

  useEffect(() => {
    document.body.classList.remove('density-comfortable', 'density-compact');
    document.body.classList.add(`density-${densidad}`);
  }, [densidad]);

  return (
    <UIPreferencesContext.Provider
      value={{
        tema,
        setTema,
        densidad,
        setDensidad,
        escenas3DActivas,
        setEscenas3DActivas,
        calidad3D,
        setCalidad3D,
      }}
    >
      {children}
    </UIPreferencesContext.Provider>
  );
}

export function useUIPreferences() {
  const ctx = useContext(UIPreferencesContext);
  if (!ctx) throw new Error('useUIPreferences debe usarse dentro de UIPreferencesProvider');
  return ctx;
}

