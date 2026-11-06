import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/cliente'
import { Aviso } from '../components/Estados'
import estilos from './Cuenta.module.css'

export default function Registro() {
  const { registrarse } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const estado = (location.state ?? {}) as { desde?: string }
  const [datos, setDatos] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '', repetir: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const set = (campo: keyof typeof datos) => (e: ChangeEvent<HTMLInputElement>) => setDatos((d) => ({ ...d, [campo]: e.target.value }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const locales: Record<string, string> = {}
    if (datos.password.length < 8) locales.password = 'Usá al menos 8 caracteres.'
    if (datos.password !== datos.repetir) locales.repetir = 'Las contraseñas no coinciden.'
    setErrores(locales)
    if (Object.keys(locales).length) return

    setEnviando(true)
    setError(null)
    try {
      await registrarse({ nombre: datos.nombre, apellido: datos.apellido, email: datos.email, password: datos.password, telefono: datos.telefono || undefined })
      navigate(estado.desde ?? '/mis-turnos', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setErrores(err.campos)
        setError(err.mensaje)
      } else setError('No pudimos crear la cuenta.')
    } finally {
      setEnviando(false)
    }
  }

  const campo = (nombre: keyof typeof datos, etiqueta: string, tipo = 'text', autoComplete?: string, ayuda?: string) => (
    <label className={`campo ${errores[nombre] ? 'campo--error' : ''}`}>
      <span>{etiqueta}</span>
      <input type={tipo} value={datos[nombre]} onChange={set(nombre)} autoComplete={autoComplete} aria-invalid={!!errores[nombre]} />
      {errores[nombre] ? <span className="campo__error">{errores[nombre]}</span> : ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </label>
  )

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        <h1>Crear cuenta</h1>
        <p className={estilos.bajada}>La necesitás para reservar test drives y clases, y para cancelarlos si no podés ir.</p>
        <div className={estilos.fila}>
          {campo('nombre', 'Nombre', 'text', 'given-name')}
          {campo('apellido', 'Apellido', 'text', 'family-name')}
        </div>
        {campo('email', 'Email', 'email', 'email', 'Ahí te mandamos los recordatorios.')}
        {campo('telefono', 'Teléfono (opcional)', 'tel', 'tel', 'Para que el vendedor te confirme el turno.')}
        {campo('password', 'Contraseña', 'password', 'new-password', 'Mínimo 8 caracteres.')}
        {campo('repetir', 'Repetí la contraseña', 'password', 'new-password')}
        {error && <Aviso tipo="error">{error}</Aviso>}
        <button type="submit" className="btn btn--primario" disabled={enviando || !datos.nombre || !datos.apellido || !datos.email}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <p className={estilos.alternativa}>¿Ya tenés cuenta? <Link to="/ingresar" state={estado}>Ingresá</Link></p>
      </form>
    </div>
  )
}
