import { Link } from 'react-router'
import type { ModeloResumen } from '../api/tipos'
import { nombreCarroceria, nombreCombustible, precio } from '../utils/formato'
import { FotoAuto } from './FotoAuto'
import estilos from './TarjetaModelo.module.css'

export function TarjetaModelo({ modelo }: { modelo: ModeloResumen }) {
  return (
    <article className={estilos.tarjeta}>
      <FotoAuto url={modelo.imagenUrl} alt={`${modelo.marcaNombre} ${modelo.nombre}`} tipo={modelo.tipoCarroceria} />
      <div className={estilos.cuerpo}>
        <p className={estilos.marca}>{modelo.marcaNombre}</p>
        <h3 className={estilos.nombre}>
          <Link to={`/modelos/${modelo.id}`} className={estilos.enlace}>{modelo.nombre}</Link>
        </h3>
        <p className={estilos.datos}>
          {nombreCarroceria[modelo.tipoCarroceria]}, {modelo.combustibles.map((c) => nombreCombustible[c].toLowerCase()).join(' o ')}
        </p>
        <p className={estilos.precio}>
          <span>Desde</span> {precio(modelo.precioDesde)}
        </p>
      </div>
    </article>
  )
}
