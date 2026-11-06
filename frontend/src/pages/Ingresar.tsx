import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth, inicioSegunRol } from '../auth/AuthContext'
import { Aviso } from '../components/Estados'
import estilos from './Cuenta.module.css'

const MOSTRAR_DEMO = import.meta.env.VITE_OCULTAR_CUENTAS_DEMO !== 'true'
const CUENTAS_DEMO = [
  { rol: 'Cliente', email: 'cliente@example.com' },
  { rol: 'Vendedor', email: 'martin.ferreyra@km0.com.ar' },
  { rol: 'Instructora', email: 'valeria.ponce@km0.com.ar' },
  { rol: 'Administradora', email: 'admin@km0.com.ar' },
]

export default function Ingresar() {
  const { ingresar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const estado = (location.state ?? {}) as { desde?: string; motivo?: string }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const u = await ingresar(email, password)
      navigate(estado.desde ?? inicioSegunRol(u), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        <h1>Ingresar</h1>
        {estado.motivo && <Aviso>{estado.motivo}</Aviso>}
        <label className="campo">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="campo">
          <span>Contraseña</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <button type="submit" className="btn btn--primario" disabled={enviando || !email || !password}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className={estilos.alternativa}>
          ¿No tenés cuenta? <Link to="/registro" state={estado}>Creala en un minuto</Link>
        </p>
      </form>

      {MOSTRAR_DEMO && (
        <aside className={estilos.demo} aria-label="Cuentas de prueba">
          <h2>Cuentas de prueba</h2>
          <p>Para recorrer el sistema con cada rol. La contraseña de todas es <code>Demo1234</code>.</p>
          <ul>
            {CUENTAS_DEMO.map((c) => (
              <li key={c.email}>
                <button type="button" className="btn btn--fantasma" onClick={() => { setEmail(c.email); setPassword('Demo1234') }}>
                  Usar cuenta de {c.rol.toLowerCase()}
                </button>
                <span>{c.email}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}
