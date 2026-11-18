import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIPreferencesProvider } from './context/UIPreferencesContext';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComprasLotesPage } from './pages/ComprasLotesPage';
import { AlmacenPage } from './pages/AlmacenPage';
import { SeleccionVentaPage } from './pages/SeleccionVentaPage';
import { HistorialVentasPage } from './pages/HistorialVentasPage';
import { CatalogosPage } from './pages/CatalogosPage';
import { LaboratorioPage } from './pages/LaboratorioPage';
import { TrazabilidadPage } from './pages/TrazabilidadPage';
import { AuditoriaPage } from './pages/AuditoriaPage';
import { RespaldoPage } from './pages/RespaldoPage';
import { CotizacionesPage } from './pages/CotizacionesPage';

function AppRoutes() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] dark:bg-[#050B11] text-[#0F172A] dark:text-[#F8FAFC]">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-3 border-[#06B6D4] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
            Iniciando MineralFlow 2.0...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/compras" element={<ComprasLotesPage />} />
        <Route path="/almacen" element={<AlmacenPage />} />
        <Route path="/seleccion-venta" element={<SeleccionVentaPage />} />
        <Route path="/historial-ventas" element={<HistorialVentasPage />} />
        <Route path="/catalogos" element={<CatalogosPage />} />
        <Route path="/cotizaciones" element={<CotizacionesPage />} />
        <Route path="/laboratorio" element={<LaboratorioPage />} />
        <Route path="/trazabilidad" element={<TrazabilidadPage />} />
        <Route path="/auditoria" element={<AuditoriaPage />} />
        <Route path="/respaldo" element={<RespaldoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UIPreferencesProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </UIPreferencesProvider>
    </BrowserRouter>
  );
}
