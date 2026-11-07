import type { ErrorApi } from './tipos'

/** URL del backend. En desarrollo apunta a localhost:8080; en Vercel se define VITE_API_URL. */
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080'

const CLAVE_TOKEN = 'km0.token'

/** Guarda el token JWT (o lo borra si es null) en localStorage. */
export function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token)
    else localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // navegación privada sin storage: la sesión dura lo que dure la pestaña
  }
}

/** Token guardado, o null si no hay sesión o el navegador no permite storage. */
export function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

/** Error con el formato que devuelve el GlobalExceptionHandler del backend. */
export class ApiError extends Error implements ErrorApi {
  status: number
  mensaje: string
  campos: Record<string, string>

  constructor(status: number, mensaje: string, campos: Record<string, string> = {}) {
    super(mensaje)
    this.status = status
    this.mensaje = mensaje
    this.campos = campos
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Si el backend responde 401 con un token guardado, la sesión venció: se avisa a la app. */
let alVencerSesion: (() => void) | null = null
/** Registra qué hacer cuando la sesión vence (lo usa AuthContext para cerrar la sesión). */
export function onSesionVencida(fn: () => void) {
  alVencerSesion = fn
}

/**
 * Hace un pedido HTTP al backend con JSON y el token de la sesión (si hay).
 *
 * @param metodo método HTTP
 * @param ruta   ruta de la API, ej. "/api/modelos"
 * @param cuerpo objeto a enviar como JSON (opcional)
 * @returns el cuerpo de la respuesta ya parseado (undefined si es 204)
 * @throws {ApiError} con el status y el mensaje del backend; status 0 si no hubo conexión
 * @example
 * const modelos = await pedir<ModeloResumen[]>('GET', '/api/modelos?carroceria=SUV')
 */
export async function pedir<T>(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = leerToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.')
  }

  if (respuesta.status === 204) return undefined as T

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) alVencerSesion?.()
    const mensaje = (datos && typeof datos.mensaje === 'string' && datos.mensaje) || `Error ${respuesta.status}`
    throw new ApiError(respuesta.status, mensaje, (datos && datos.campos) || {})
  }
  return datos as T
}

/** Arma "?a=1&b=2" ignorando valores vacíos. */
export function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}
