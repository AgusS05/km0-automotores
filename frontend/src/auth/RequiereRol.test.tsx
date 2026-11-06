import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import type { Usuario } from '../api/tipos'
import { RequiereRol } from './RequiereRol'
import { inicioSegunRol, useAuth } from './AuthContext'

// Se reemplaza solo useAuth: así se prueba la protección de rutas sin backend.
vi.mock('./AuthContext', async (original) => ({
  ...(await original<typeof import('./AuthContext')>()),
  useAuth: vi.fn<typeof import('./AuthContext').useAuth>(),
}))

function usuario(rol: Usuario['rol']): Usuario {
  return { id: 1, nombre: 'Ana', apellido: 'Gómez', email: 'ana@example.com', telefono: null, rol, sucursalId: null, sucursalNombre: null, activo: true }
}

type Sesion = ReturnType<typeof useAuth>

function sesion(u: Usuario | null, verificando = false) {
  vi.mocked(useAuth).mockReturnValue({
    usuario: u, verificando,
    ingresar: vi.fn<Sesion['ingresar']>(), registrarse: vi.fn<Sesion['registrarse']>(), salir: vi.fn<Sesion['salir']>(),
  })
}

/** Muestra a qué ruta terminó yendo la navegación y desde dónde venía. */
function Destino({ nombre }: { nombre: string }) {
  const { state } = useLocation()
  return <p>{nombre}{state?.desde ? ` (volver a ${state.desde})` : ''}</p>
}

function abrir(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<Destino nombre="Inicio" />} />
        <Route path="/ingresar" element={<Destino nombre="Ingresar" />} />
        <Route path="/admin" element={<RequiereRol roles={['ADMIN']}><p>Panel de administración</p></RequiereRol>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequiereRol', () => {
  afterEach(cleanup)

  it('sin sesión manda a ingresar y recuerda a dónde volver', () => {
    sesion(null)
    abrir('/admin')
    expect(screen.getByText('Ingresar (volver a /admin)')).toBeTruthy()
  })

  it('con un rol que no corresponde manda al inicio', () => {
    sesion(usuario('CLIENTE'))
    abrir('/admin')
    expect(screen.getByText('Inicio')).toBeTruthy()
    expect(screen.queryByText('Panel de administración')).toBeNull()
  })

  it('con el rol correcto muestra la página', () => {
    sesion(usuario('ADMIN'))
    abrir('/admin')
    expect(screen.getByText('Panel de administración')).toBeTruthy()
  })

  it('mientras se verifica el token no redirige', () => {
    sesion(null, true)
    abrir('/admin')
    expect(screen.queryByText(/Ingresar/)).toBeNull()
  })
})

describe('inicioSegunRol', () => {
  it('lleva a cada usuario a su pantalla principal', () => {
    expect(inicioSegunRol(usuario('ADMIN'))).toBe('/admin')
    expect(inicioSegunRol(usuario('VENDEDOR'))).toBe('/panel/vendedor')
    expect(inicioSegunRol(usuario('INSTRUCTOR'))).toBe('/panel/instructor')
    expect(inicioSegunRol(usuario('CLIENTE'))).toBe('/mis-turnos')
  })
})
