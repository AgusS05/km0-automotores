import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { admin, catalogo, type EmpleadoForm } from '../../api/api'
import type { Rol, Usuario } from '../../api/tipos'
import { useAuth } from '../../auth/AuthContext'
import { useCarga } from '../../hooks/useCarga'
import { nombreRol } from '../../utils/formato'
import { Aviso, Cargando, MensajeError } from '../../components/Estados'
import estilos from './Admin.module.css'

const ROLES_EMPLEADO: Rol[] = ['VENDEDOR', 'INSTRUCTOR', 'ADMIN']

export default function AdminUsuarios() {
  const { usuario: yo } = useAuth()
  // El tipo va en la URL (?tipo=clientes): así el botón Atrás del navegador vuelve a Empleados
  const [params, setParams] = useSearchParams()
  const tipo: 'empleados' | 'clientes' = params.get('tipo') === 'clientes' ? 'clientes' : 'empleados'
  const setTipo = (t: 'empleados' | 'clientes') => {
    if (t === tipo) return
    setForm(null)
    setMensaje(null)
    setParams(t === 'clientes' ? { tipo: 'clientes' } : {})
  }
  const usuarios = useCarga(() => admin.usuarios(tipo), [tipo])
  const sucursales = useCarga(() => catalogo.sucursales(), [])
  const [form, setForm] = useState<{ id: number | null; datos: EmpleadoForm } | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function ejecutar(fn: () => Promise<unknown>, ok: string) {
    setMensaje(null)
    try { await fn(); setMensaje({ tipo: 'ok', texto: ok }); usuarios.recargar(); return true }
    catch (e) { setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error' }); return false }
  }
  const nuevo = () => setForm({ id: null, datos: { nombre: '', apellido: '', email: '', password: '', telefono: '', rol: 'VENDEDOR', sucursalId: sucursales.datos?.[0]?.id ?? null } })
  const editar = (u: Usuario) => setForm({ id: u.id, datos: { nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', telefono: u.telefono ?? '', rol: u.rol, sucursalId: u.sucursalId } })
  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    const ok = await ejecutar(() => (form.id ? admin.editarEmpleado(form.id, form.datos) : admin.crearEmpleado(form.datos)), 'Empleado guardado.')
    if (ok) setForm(null)
  }
  const set = (c: Partial<EmpleadoForm>) => form && setForm({ ...form, datos: { ...form.datos, ...c } })

  return (
    <div className={estilos.seccion}>
      <div className={estilos.barraTitulo}>
        {/* Título y selector juntos: el selector no se mueve al cambiar de Empleados a Clientes */}
        <div className={estilos.tituloConSelector}>
          <h1>Usuarios</h1>
          <div className={estilos.segmentado} role="group" aria-label="Tipo de usuario">
            <button type="button" aria-pressed={tipo === 'empleados'} onClick={() => setTipo('empleados')}>Empleados</button>
            <button type="button" aria-pressed={tipo === 'clientes'} onClick={() => setTipo('clientes')}>Clientes</button>
          </div>
        </div>
        {tipo === 'empleados' && <button type="button" className="btn btn--primario" onClick={nuevo}>Nuevo empleado</button>}
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {form && (
        <form className={estilos.formulario} onSubmit={guardar}>
          <h2>{form.id ? 'Editar empleado' : 'Nuevo empleado'}</h2>
          <div className={estilos.campos}>
            <label className="campo"><span>Nombre</span><input required value={form.datos.nombre} onChange={(e) => set({ nombre: e.target.value })} /></label>
            <label className="campo"><span>Apellido</span><input required value={form.datos.apellido} onChange={(e) => set({ apellido: e.target.value })} /></label>
            <label className="campo"><span>Email</span><input type="email" required value={form.datos.email} onChange={(e) => set({ email: e.target.value })} /></label>
            <label className="campo"><span>Teléfono</span><input value={form.datos.telefono} onChange={(e) => set({ telefono: e.target.value })} /></label>
            <label className="campo"><span>Rol</span>
              <select value={form.datos.rol} onChange={(e) => set({ rol: e.target.value as Rol })}>
                {ROLES_EMPLEADO.map((r) => <option key={r} value={r}>{nombreRol[r]}</option>)}
              </select>
            </label>
            <label className="campo"><span>Sucursal</span>
              <select value={form.datos.sucursalId ?? ''} onChange={(e) => set({ sucursalId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Ninguna</option>
                {(sucursales.datos ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <span className="campo__ayuda">Obligatoria para vendedores e instructores</span>
            </label>
            <label className="campo"><span>{form.id ? 'Nueva contraseña' : 'Contraseña'}</span>
              <input type="password" autoComplete="new-password" required={!form.id} minLength={8} value={form.datos.password} onChange={(e) => set({ password: e.target.value })} />
              {form.id && <span className="campo__ayuda">Dejala vacía para no cambiarla</span>}
            </label>
          </div>
          <div className={estilos.botones}>
            <button type="submit" className="btn btn--primario">Guardar</button>
            <button type="button" className="btn btn--fantasma" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {usuarios.cargando && <Cargando />}
      {usuarios.error && <MensajeError mensaje={usuarios.error} />}
      <div className="tabla-scroll">
        <table className="tabla">
          <thead><tr><th>Nombre</th><th>Email</th>{tipo === 'empleados' && <><th>Rol</th><th>Sucursal</th></>}<th>Estado</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
          <tbody>
            {(usuarios.datos ?? []).map((u) => (
              <tr key={u.id} className={!u.activo ? estilos.inactivo : undefined}>
                <td><strong>{u.nombre} {u.apellido}</strong><span className={estilos.sub}>{u.telefono}</span></td>
                <td>{u.email}</td>
                {tipo === 'empleados' && <><td>{nombreRol[u.rol]}</td><td>{u.sucursalNombre ?? '—'}</td></>}
                <td>{u.activo ? 'Activo' : 'Dado de baja'}</td>
                <td className={estilos.acciones}>
                  {tipo === 'empleados' && <button type="button" className="btn btn--fantasma" onClick={() => editar(u)}>Editar</button>}
                  {u.id !== yo?.id && (
                    <button type="button" className="btn btn--fantasma"
                      onClick={() => ejecutar(() => admin.cambiarActivo(u.id, !u.activo), u.activo ? 'Usuario dado de baja.' : 'Usuario reactivado.')}>
                      {u.activo ? 'Dar de baja' : 'Reactivar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
