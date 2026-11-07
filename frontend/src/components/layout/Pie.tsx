import { Link } from 'react-router'
import { useCarga } from '../../hooks/useCarga'
import { catalogo } from '../../api/api'
import { hora } from '../../utils/formato'
import estilos from './Pie.module.css'

export function Pie() {
  const { datos: sucursales } = useCarga(() => catalogo.sucursales(), [])
  return (
    <footer className={`${estilos.pie} no-imprimir`}>
      <div className={`contenedor ${estilos.grilla}`}>
        <div>
          <h2 className={estilos.titulo}>Sucursales</h2>
          <ul className={estilos.sucursales}>
            {(sucursales ?? []).map((s) => (
              <li key={s.id}>
                <strong>{s.nombre}</strong>
                <span>{s.direccion}, {s.ciudad}</span>
                <span>
                  Lun a vie {hora(s.horarioApertura)} a {hora(s.horarioCierre)}
                  {s.cierreSabado ? `, sáb ${hora(s.horarioApertura)} a ${hora(s.cierreSabado)}` : ''}
                </span>
                {s.telefono && <a href={`tel:${s.telefono.replace(/\s|-/g, '')}`}>{s.telefono}</a>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className={estilos.titulo}>Explorar</h2>
          <ul className={estilos.links}>
            <li><Link to="/modelos">Todos los modelos</Link></li>
            <li><Link to="/comparar">Comparar versiones</Link></li>
            <li><Link to="/test-drive">Reservar test drive</Link></li>
            <li><Link to="/escuela">Escuela de manejo</Link></li>
            <li><Link to="/creditos">Créditos de las fotos</Link></li>
          </ul>
        </div>
      </div>
      <div className={`contenedor ${estilos.legal}`}>
        <p>
          Km0 Automotores es un proyecto académico (Trabajo Final Integrador, Tecnicatura Universitaria en
          Programación, UTN). Precios y fichas técnicas son de referencia; las marcas pertenecen a sus dueños.
        </p>
      </div>
    </footer>
  )
}
