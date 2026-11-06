import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useAuth, inicioSegunRol } from '../../auth/AuthContext'
import { Odometro } from '../Odometro'
import estilos from './Encabezado.module.css'

export function Encabezado() {
  const { usuario, salir } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const location = useLocation()

  // Al salir se recarga el inicio: así ninguna página protegida "recuerda" a dónde volver.
  // Al navegar se cierra el menú del celular
  useEffect(() => { setAbierto(false) }, [location.pathname])

  const claseLink = ({ isActive }: { isActive: boolean }) => `${estilos.link} ${isActive ? estilos.activo : ''}`

  return (
    <header className={`${estilos.encabezado} no-imprimir`}>
      <div className={`contenedor ${estilos.barra}`}>
        <Link to="/" className={estilos.logo} aria-label="Km0 Automotores, ir al inicio">
          <Odometro />
        </Link>

        <button
          type="button"
          className={estilos.menuBtn}
          aria-expanded={abierto}
          aria-controls="navegacion-principal"
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? 'Cerrar' : 'Menú'}
        </button>

        <nav id="navegacion-principal" className={`${estilos.nav} ${abierto ? estilos.navAbierta : ''}`} aria-label="Principal">
          <NavLink to="/modelos" className={claseLink}>Modelos</NavLink>
          <NavLink to="/comparar" className={claseLink}>Comparar</NavLink>
          <NavLink to="/escuela" className={claseLink}>Escuela de manejo</NavLink>

          <div className={estilos.cuenta}>
            {usuario ? (
              <>
                <NavLink to={inicioSegunRol(usuario)} className={claseLink}>
                  {usuario.rol === 'CLIENTE' ? 'Mis turnos' : 'Mi panel'}
                </NavLink>
                <button type="button" className={estilos.salir} onClick={() => { salir(); window.location.assign('/') }}>
                  Salir <span className={estilos.quien}>({usuario.nombre})</span>
                </button>
              </>
            ) : (
              <NavLink to="/ingresar" className={claseLink}>Ingresar</NavLink>
            )}
            {(!usuario || usuario.rol === 'CLIENTE') && (
              <Link to="/test-drive" className={`btn btn--claro ${estilos.cta}`}>Reservar test drive</Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
