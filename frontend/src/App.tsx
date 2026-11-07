import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthContext'
import { RequiereRol } from './auth/RequiereRol'
import { Layout } from './components/layout/Layout'

// Cada página se descarga recién cuando se visita (code splitting).
// Así el visor 3D (three.js) no se carga en las páginas que no lo usan.
const Inicio = lazy(() => import('./pages/Inicio'))
const Catalogo = lazy(() => import('./pages/Catalogo'))
const ModeloDetalle = lazy(() => import('./pages/ModeloDetalle'))
const Comparador = lazy(() => import('./pages/Comparador'))
const ReservarTestDrive = lazy(() => import('./pages/ReservarTestDrive'))
const EscuelaManejo = lazy(() => import('./pages/EscuelaManejo'))
const Ingresar = lazy(() => import('./pages/Ingresar'))
const Registro = lazy(() => import('./pages/Registro'))
const MisTurnos = lazy(() => import('./pages/MisTurnos'))
const PanelVendedor = lazy(() => import('./pages/panel/PanelVendedor'))
const PanelInstructor = lazy(() => import('./pages/panel/PanelInstructor'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminMetricas = lazy(() => import('./pages/admin/AdminMetricas'))
const AdminCatalogo = lazy(() => import('./pages/admin/AdminCatalogo'))
const AdminModelo = lazy(() => import('./pages/admin/AdminModelo'))
const AdminSucursales = lazy(() => import('./pages/admin/AdminSucursales'))
const AdminUnidades = lazy(() => import('./pages/admin/AdminUnidades'))
const AdminUsuarios = lazy(() => import('./pages/admin/AdminUsuarios'))
const AdminReservas = lazy(() => import('./pages/admin/AdminReservas'))
const AdminSolicitudes = lazy(() => import('./pages/admin/AdminSolicitudes'))
const Comprar = lazy(() => import('./pages/Comprar'))
const Presupuesto = lazy(() => import('./pages/Presupuesto'))
const Creditos = lazy(() => import('./pages/Creditos'))
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'))

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="modelos" element={<Catalogo />} />
            <Route path="modelos/:id" element={<ModeloDetalle />} />
            <Route path="comparar" element={<Comparador />} />
            <Route path="test-drive" element={<ReservarTestDrive />} />
            <Route path="escuela" element={<EscuelaManejo />} />
            <Route path="comprar" element={<Comprar />} />
            <Route path="solicitudes/:id" element={<RequiereRol roles={['CLIENTE', 'VENDEDOR', 'ADMIN']}><Presupuesto /></RequiereRol>} />
            <Route path="ingresar" element={<Ingresar />} />
            <Route path="registro" element={<Registro />} />
            <Route path="creditos" element={<Creditos />} />

            <Route path="mis-turnos" element={<RequiereRol roles={['CLIENTE']}><MisTurnos /></RequiereRol>} />
            <Route path="panel/vendedor" element={<RequiereRol roles={['VENDEDOR', 'ADMIN']}><PanelVendedor /></RequiereRol>} />
            <Route path="panel/instructor" element={<RequiereRol roles={['INSTRUCTOR', 'ADMIN']}><PanelInstructor /></RequiereRol>} />

            <Route path="admin" element={<RequiereRol roles={['ADMIN']}><AdminLayout /></RequiereRol>}>
              <Route index element={<AdminMetricas />} />
              <Route path="reservas" element={<AdminReservas />} />
              <Route path="solicitudes" element={<AdminSolicitudes />} />
              {/* Las mismas agendas del vendedor y del instructor, pero dentro del panel (con su menú) */}
              <Route path="agenda-test-drive" element={<PanelVendedor enAdmin />} />
              <Route path="agenda-escuela" element={<PanelInstructor enAdmin />} />
              <Route path="catalogo" element={<AdminCatalogo />} />
              <Route path="catalogo/:id" element={<AdminModelo />} />
              <Route path="sucursales" element={<AdminSucursales />} />
              <Route path="unidades" element={<AdminUnidades />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
            </Route>

            <Route path="*" element={<NoEncontrado />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
