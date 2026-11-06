import type { ColorAuto } from '../api/tipos'
import estilos from './SelectorColor.module.css'

interface Props {
  colores: ColorAuto[]
  valor: string
  onCambio: (hex: string) => void
}

/** Muestras de color del modelo. El nombre del color elegido se muestra al lado. */
export function SelectorColor({ colores, valor, onCambio }: Props) {
  if (colores.length === 0) return null
  const elegido = colores.find((c) => c.hex.toLowerCase() === valor.toLowerCase())
  return (
    <div className={estilos.selector}>
      <div className={estilos.muestras} role="radiogroup" aria-label="Color del auto">
        {colores.map((c) => {
          const activo = c.hex.toLowerCase() === valor.toLowerCase()
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={c.nombre}
              title={c.nombre}
              className={`${estilos.muestra} ${activo ? estilos.activa : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => onCambio(c.hex)}
            />
          )
        })}
      </div>
      <span className={estilos.nombre} aria-live="polite">{elegido?.nombre ?? ''}</span>
    </div>
  )
}
