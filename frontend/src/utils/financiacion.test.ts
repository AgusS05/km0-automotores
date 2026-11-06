import { describe, expect, it } from 'vitest'
import { anticipoMinimo, cuotaMensual, validarFinanciacion } from './financiacion'

describe('simulación de crédito (mismos resultados que CalculadoraFinanciacion.java)', () => {
  it('1.000.000 al 12 % anual en 12 cuotas da 88.848,79', () => {
    expect(cuotaMensual(1_000_000, 12, 12)).toBe(88848.79)
  })

  it('coincide con la cuota de los datos de ejemplo de la base (Corolla Cross Hybrid, 40 % de anticipo, 36 cuotas, TNA 39 %)', () => {
    expect(cuotaMensual(49_900_000 - 19_960_000, 36, 39)).toBe(1422997.69)
  })

  it('sin interés divide el monto en partes iguales', () => {
    expect(cuotaMensual(6_000_000, 24, 0)).toBe(250000)
  })

  it('el anticipo mínimo se redondea hacia arriba', () => {
    expect(anticipoMinimo(10_000_000, 30)).toBe(3_000_000)
    expect(anticipoMinimo(33, 30)).toBe(10)
  })

  it('valida anticipo y plazo', () => {
    const cuotas = [12, 24, 36]
    expect(validarFinanciacion(10_000_000, 3_000_000, 36, cuotas, 30)).toBeNull()
    expect(validarFinanciacion(10_000_000, 2_999_999, 36, cuotas, 30)).toMatch(/mínimo/)
    expect(validarFinanciacion(10_000_000, 10_000_000, 36, cuotas, 30)).toMatch(/contado/)
    expect(validarFinanciacion(10_000_000, 5_000_000, 18, cuotas, 30)).toMatch(/cuotas/)
    expect(validarFinanciacion(10_000_000, null, 36, cuotas, 30)).toMatch(/anticipo/)
  })
})
