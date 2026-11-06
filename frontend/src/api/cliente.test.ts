import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, guardarToken, leerToken, onSesionVencida, pedir, query } from './cliente'

/** Respuesta HTTP simulada con cuerpo JSON. */
function respuesta(status: number, cuerpo?: unknown): Response {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('query', () => {
  it('arma la query string ignorando valores vacíos', () => {
    expect(query({ marcaId: 1, q: '', carroceria: null, destacados: true, x: undefined })).toBe('?marcaId=1&destacados=true')
  })

  it('devuelve cadena vacía si no hay parámetros', () => {
    expect(query({ q: '' })).toBe('')
  })
})

describe('token', () => {
  it('se guarda, se lee y se borra', () => {
    guardarToken('abc')
    expect(leerToken()).toBe('abc')
    guardarToken(null)
    expect(leerToken()).toBeNull()
  })
})

describe('pedir', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSimulado)
    guardarToken(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchSimulado.mockReset()
  })

  it('manda el token y el cuerpo como JSON', async () => {
    guardarToken('mi-token')
    fetchSimulado.mockResolvedValue(respuesta(201, { id: 7 }))

    const datos = await pedir<{ id: number }>('POST', '/api/test-drives', { modeloId: 1 })

    expect(datos).toEqual({ id: 7 })
    const [url, opciones] = fetchSimulado.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/test-drives$/)
    expect(opciones?.method).toBe('POST')
    expect(opciones?.body).toBe('{"modeloId":1}')
    const headers = opciones?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer mi-token')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('sin token no manda el header Authorization', async () => {
    fetchSimulado.mockResolvedValue(respuesta(200, []))
    await pedir('GET', '/api/modelos')
    const headers = fetchSimulado.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('convierte el error del backend en ApiError con mensaje y campos', async () => {
    fetchSimulado.mockResolvedValue(respuesta(400, {
      status: 400, mensaje: 'Revisá los datos ingresados.', campos: { email: 'El email no es válido' },
    }))

    const error = await pedir('POST', '/api/auth/registro', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, mensaje: 'Revisá los datos ingresados.', campos: { email: 'El email no es válido' } })
  })

  it('si el horario se ocupó, el 409 llega con el mensaje del servidor', async () => {
    fetchSimulado.mockResolvedValue(respuesta(409, { status: 409, mensaje: 'Ese horario se acaba de ocupar.' }))
    await expect(pedir('POST', '/api/test-drives', {})).rejects.toMatchObject({ status: 409, mensaje: 'Ese horario se acaba de ocupar.' })
  })

  it('sin conexión responde un ApiError con status 0', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(pedir('GET', '/api/modelos')).rejects.toMatchObject({ status: 0 })
  })

  it('un 401 con sesión iniciada avisa que la sesión venció', async () => {
    const alVencer = vi.fn<() => void>()
    onSesionVencida(alVencer)
    guardarToken('vencido')
    fetchSimulado.mockResolvedValue(respuesta(401, { status: 401, mensaje: 'Tenés que iniciar sesión.' }))

    await expect(pedir('GET', '/api/test-drives/mios')).rejects.toBeInstanceOf(ApiError)
    expect(alVencer).toHaveBeenCalledOnce()
  })

  it('un 204 devuelve undefined', async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(pedir('DELETE', '/api/admin/colores/1')).resolves.toBeUndefined()
  })
})
