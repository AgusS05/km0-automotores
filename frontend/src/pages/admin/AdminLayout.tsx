import { NavLink, Outlet } from 'react-router'
import estilos from './Admin.module.css'

const SECCIONES = [
  { to: '/admin', texto: 'Métricas', fin: true },
  { to: '/admin/reservas', texto: 'Reservas' },
  { to: '/admin/solicitudes', texto: 'Ventas' },
  { to: '/admin/agenda-test-drive', texto: 'Agenda test drive' },
  { to: '/admin/agenda-escuela', texto: 'Agenda escuela' },
  { to: '/admin/catalogo', texto: 'Catálogo' },
  { to: '/admin/unidades', texto: 'Unidades demo' },
  { to: '/admin/sucursales', texto: 'Sucursales' },
  { to: '/admin/usuarios', texto: 'Usuarios' },
]

export default function AdminLayout() {
  return (
    <div className={`contenedor ${estilos.layout}`}>
      <nav className={estilos.subnav} aria-label="Administración">
        {SECCIONES.map((s) => (
          <NavLink key={s.to} to={s.to} end={s.fin} className={({ isActive }) => `${estilos.sublink} ${isActive ? estilos.subactivo : ''}`}>
            {s.texto}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
