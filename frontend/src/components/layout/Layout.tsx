import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Encabezado } from './Encabezado'
import { Pie } from './Pie'
import { Cargando } from '../Estados'

export function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      <a href="#contenido" className="saltar">Saltar al contenido</a>
      <Encabezado />
      <main id="contenido">
        <Suspense fallback={<div className="contenedor"><Cargando /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Pie />
    </>
  )
}
