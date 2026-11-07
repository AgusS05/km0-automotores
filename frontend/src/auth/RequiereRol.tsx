import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import type { Rol } from '../api/tipos'
import { useAuth } from './AuthContext'
import { Cargando } from '../components/Estados'

/** Protege una página: si no hay sesión manda a /ingresar; si el rol no corresponde, al inicio. */
export function RequiereRol({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { usuario, verificando } = useAuth()
  const location = useLocation()
  if (verificando) return <Cargando texto="Verificando tu sesión" />
  if (!usuario) return <Navigate to="/ingresar" replace state={{ desde: location.pathname + location.search }} />
  if (!roles.includes(usuario.rol)) return <Navigate to="/" replace />
  return <>{children}</>
}
