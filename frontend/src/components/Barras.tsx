import type { Conteo } from '../api/tipos'
import estilos from './Barras.module.css'

/** Barras horizontales simples, hechas con CSS (sin librería de gráficos). */
export function BarrasHorizontales({ datos, max = 8, vacio = 'Sin datos en el período' }: { datos: Conteo[]; max?: number; vacio?: string }) {
  if (datos.length === 0) return <p className={estilos.vacio}>{vacio}</p>
  const tope = Math.max(...datos.map((d) => d.cantidad), 1)
  return (
    <ul className={estilos.horizontales}>
      {datos.slice(0, max).map((d) => (
        <li key={d.etiqueta}>
          <span className={estilos.etiqueta}>{d.etiqueta}</span>
          <span className={estilos.pista}>
            <span className={estilos.barra} style={{ width: `${(d.cantidad / tope) * 100}%` }} />
          </span>
          <span className={estilos.valor}>{d.cantidad}</span>
        </li>
      ))}
    </ul>
  )
}

/** Columnas verticales, para los horarios del día. */
export function BarrasVerticales({ datos, titulo }: { datos: Conteo[]; titulo: string }) {
  if (datos.length === 0) return <p className={estilos.vacio}>Sin datos en el período</p>
  const tope = Math.max(...datos.map((d) => d.cantidad), 1)
  const maximo = datos.reduce((a, b) => (b.cantidad > a.cantidad ? b : a))
  return (
    <figure className={estilos.figura}>
      <div className={estilos.verticales} role="img" aria-label={`${titulo}. El horario con más turnos es ${maximo.etiqueta} con ${maximo.cantidad}.`}>
        {datos.map((d) => (
          <div key={d.etiqueta} className={estilos.columna}>
            <span className={estilos.valorV}>{d.cantidad}</span>
            <span className={`${estilos.barraV} ${d === maximo ? estilos.destacada : ''}`} style={{ height: `${(d.cantidad / tope) * 100}%` }} />
            <span className={estilos.etiquetaV}>{d.etiqueta}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}
