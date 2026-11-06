import estilos from './Odometro.module.css'

/** Logo: un cuentakilómetros en cero (Km0 = auto sin uso). */
export function Odometro({ compacto = false }: { compacto?: boolean }) {
  const digitos = compacto ? 3 : 6
  return (
    <span className={estilos.logo}>
      <span className={estilos.tambores} aria-hidden="true">
        {Array.from({ length: digitos }, (_, i) => <span key={i} className={estilos.tambor}>0</span>)}
        <span className={estilos.unidad}>km</span>
      </span>
      <span className={estilos.marca}>
        <span className={estilos.nombre}>Km0</span>
        <span className={estilos.bajada}>Automotores</span>
      </span>
    </span>
  )
}
