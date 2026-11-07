import { useState } from 'react'
import type { TipoCarroceria } from '../api/tipos'
import { SiluetaAuto } from './SiluetaAuto'
import estilos from './FotoAuto.module.css'

/**
 * Para una miniatura de Wikimedia (".../thumb/a/ab/Archivo.jpg/1280px-Archivo.jpg")
 * devuelve el archivo original (".../a/ab/Archivo.jpg"). Sirve de segundo intento
 * si la miniatura no existe (por ejemplo, si la foto original es más chica).
 */
function urlOriginal(url: string): string | null {
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/thumb\/(.+)\/[^/]+$/)
  return m ? `${m[1]}/${m[2]}` : null
}

interface Props {
  url: string | null | undefined
  alt: string
  tipo: TipoCarroceria
  className?: string
  /** "eager" para la foto principal visible al cargar; el resto se carga al hacer scroll */
  carga?: 'lazy' | 'eager'
}

/** Foto de un auto con plan B: miniatura → original → silueta dibujada. */
export function FotoAuto({ url, alt, tipo, className, carga = 'lazy' }: Props) {
  const [intento, setIntento] = useState(0)
  const candidatos = url ? [url, urlOriginal(url)].filter((u): u is string => !!u) : []
  const actual = candidatos[intento]

  if (!actual) {
    return (
      <div className={`${estilos.marco} ${estilos.sinFoto} ${className ?? ''}`} role="img" aria-label={alt}>
        <SiluetaAuto tipo={tipo} className={estilos.silueta} />
      </div>
    )
  }
  return (
    <div className={`${estilos.marco} ${className ?? ''}`}>
      <img
        key={actual}
        src={actual}
        alt={alt}
        loading={carga}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setIntento((i) => i + 1)}
        className={estilos.img}
      />
    </div>
  )
}
