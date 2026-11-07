import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth as apiAuth } from '../api/api'
import { guardarToken, leerToken, onSesionVencida } from '../api/cliente'
import type { Usuario } from '../api/tipos'

interface AuthValor {
  usuario: Usuario | null
  /** true mientras se verifica el token guardado al abrir la página */
  verificando: boolean
  ingresar: (email: string, password: string) => Promise<Usuario>
  registrarse: (datos: { nombre: string; apellido: string; email: string; password: string; telefono?: string }) => Promise<Usuario>
  salir: () => void
}

const AuthContext = createContext<AuthValor | null>(null)

/**
 * Mantiene la sesión: al abrir la página valida el token guardado contra el backend
 * (/api/auth/yo) y expone ingresar, registrarse y salir a toda la app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [verificando, setVerificando] = useState(() => leerToken() !== null)

  const salir = useCallback(() => {
    guardarToken(null)
    setUsuario(null)
  }, [])

  // Al cargar la página, si hay un token guardado se pide el usuario al backend.
  useEffect(() => {
    onSesionVencida(salir)
    if (!leerToken()) return
    apiAuth.yo()
      .then(setUsuario)
      .catch(() => guardarToken(null))
      .finally(() => setVerificando(false))
  }, [salir])

  const ingresar = useCallback(async (email: string, password: string) => {
    const r = await apiAuth.login(email, password)
    guardarToken(r.token)
    setUsuario(r.usuario)
    return r.usuario
  }, [])

  const registrarse = useCallback(async (datos: Parameters<AuthValor['registrarse']>[0]) => {
    const r = await apiAuth.registro(datos)
    guardarToken(r.token)
    setUsuario(r.usuario)
    return r.usuario
  }, [])

  const valor = useMemo(() => ({ usuario, verificando, ingresar, registrarse, salir }), [usuario, verificando, ingresar, registrarse, salir])
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

/** Sesión actual. Debe usarse dentro de {@link AuthProvider}. */
export function useAuth(): AuthValor {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

/** Página de inicio de cada rol después del login. */
export function inicioSegunRol(u: Usuario): string {
  switch (u.rol) {
    case 'ADMIN': return '/admin'
    case 'VENDEDOR': return '/panel/vendedor'
    case 'INSTRUCTOR': return '/panel/instructor'
    default: return '/mis-turnos'
  }
}
