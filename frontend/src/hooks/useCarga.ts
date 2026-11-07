import { useCallback, useEffect, useRef, useState } from 'react'

interface Estado<T> {
  datos: T | null
  error: string | null
  cargando: boolean
}

/**
 * Ejecuta una función async al montar (y cuando cambian las dependencias) y
 * expone datos/error/cargando. Ignora respuestas viejas si las dependencias
 * cambiaron mientras tanto (ej. el usuario cambió de filtro rápido).
 *
 * @param fn   función que pide los datos (ej. `() => catalogo.modelo(id)`)
 * @param deps cuándo volver a pedir (como en useEffect)
 * @returns datos, error y cargando, más `recargar()` y `setDatos()` para actualizar sin volver a pedir
 * @example
 * const { datos, cargando, error } = useCarga(() => catalogo.modelo(id), [id])
 */
export function useCarga<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [estado, setEstado] = useState<Estado<T>>({ datos: null, error: null, cargando: true })
  const pedido = useRef(0)

  const cargar = useCallback(() => {
    const id = ++pedido.current
    setEstado((e) => ({ ...e, cargando: true, error: null }))
    fn()
      .then((datos) => { if (id === pedido.current) setEstado({ datos, error: null, cargando: false }) })
      .catch((err: unknown) => {
        if (id === pedido.current) {
          const mensaje = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
          setEstado({ datos: null, error: mensaje, cargando: false })
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { cargar() }, [cargar])

  return { ...estado, recargar: cargar, setDatos: (d: T) => setEstado({ datos: d, error: null, cargando: false }) }
}
