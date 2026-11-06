/**
 * Simulación de crédito con sistema francés (cuota fija), igual a CalculadoraFinanciacion.java.
 * Se usa para mostrar la cuota mientras el cliente completa el formulario; el valor que queda
 * en el presupuesto lo calcula el backend.
 *
 *   cuota = monto × i / (1 − (1 + i)^−n)      con  i = TNA / 12 / 100
 */
export function cuotaMensual(monto: number, cuotas: number, tnaPorcentaje: number): number {
  if (cuotas <= 0) throw new Error('La cantidad de cuotas tiene que ser positiva')
  const i = tnaPorcentaje / 1200
  const cuota = i === 0 ? monto / cuotas : (monto * i) / (1 - (1 + i) ** -cuotas)
  return Math.round(cuota * 100) / 100
}

/** Anticipo mínimo en pesos (redondeado hacia arriba al peso), igual que el backend. */
export function anticipoMinimo(precio: number, porcentaje: number): number {
  return Math.ceil((precio * porcentaje) / 100)
}

/** El motivo por el que el pedido de financiación no es válido, o null si está bien (mismas reglas que el backend). */
export function validarFinanciacion(precio: number, anticipo: number | null, cuotas: number | null,
  cuotasPermitidas: number[], porcentajeMinimo: number): string | null {
  if (anticipo == null || Number.isNaN(anticipo)) return 'Indicá cuánto pagás de anticipo.'
  if (cuotas == null || !cuotasPermitidas.includes(cuotas)) return 'Elegí la cantidad de cuotas.'
  if (anticipo >= precio) return 'El anticipo cubre todo el precio: elegí pago de contado.'
  if (anticipo < anticipoMinimo(precio, porcentajeMinimo)) return `El anticipo mínimo es el ${porcentajeMinimo} % del precio.`
  return null
}
