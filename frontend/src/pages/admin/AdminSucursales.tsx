import { useState, type FormEvent } from 'react'
import { admin, catalogo, type SucursalForm } from '../../api/api'
import type { Sucursal } from '../../api/tipos'
import { useCarga } from '../../hooks/useCarga'
import { hora } from '../../utils/formato'
import { Aviso, Cargando, MensajeError } from '../../components/Estados'
import estilos from './Admin.module.css'

const VACIA: SucursalForm = { nombre: '', direccion: '', ciudad: 'Córdoba', telefono: '', horarioApertura: '09:00', horarioCierre: '18:00', cierreSabado: '13:00' }

export default function AdminSucursales() {
  const sucursales = useCarga(() => catalogo.sucursales(), [])
  const [form, setForm] = useState<{ id: number | null; datos: SucursalForm } | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function ejecutar(fn: () => Promise<unknown>, ok: string) {
    setMensaje(null)
    try { await fn(); setMensaje({ tipo: 'ok', texto: ok }); sucursales.recargar(); return true }
    catch (e) { setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error' }); return false }
  }
  const editar = (s: Sucursal) => setForm({ id: s.id, datos: {
    nombre: s.nombre, direccion: s.direccion, ciudad: s.ciudad, telefono: s.telefono ?? '',
    horarioApertura: hora(s.horarioApertura), horarioCierre: hora(s.horarioCierre), cierreSabado: s.cierreSabado ? hora(s.cierreSabado) : null,
  } })
  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    const ok = await ejecutar(() => (form.id ? admin.editarSucursal(form.id, form.datos) : admin.crearSucursal(form.datos)), 'Sucursal guardada.')
    if (ok) setForm(null)
  }
  const set = (c: Partial<SucursalForm>) => form && setForm({ ...form, datos: { ...form.datos, ...c } })

  return (
    <div className={estilos.seccion}>
      <div className={estilos.barraTitulo}>
        <h1>Sucursales</h1>
        <button type="button" className="btn btn--primario" onClick={() => setForm({ id: null, datos: VACIA })}>Nueva sucursal</button>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {form && (
        <form className={estilos.formulario} onSubmit={guardar}>
          <h2>{form.id ? 'Editar sucursal' : 'Nueva sucursal'}</h2>
          <div className={estilos.campos}>
            <label className="campo"><span>Nombre</span><input required value={form.datos.nombre} onChange={(e) => set({ nombre: e.target.value })} /></label>
            <label className="campo"><span>Dirección</span><input required value={form.datos.direccion} onChange={(e) => set({ direccion: e.target.value })} /></label>
            <label className="campo"><span>Ciudad</span><input required value={form.datos.ciudad} onChange={(e) => set({ ciudad: e.target.value })} /></label>
            <label className="campo"><span>Teléfono</span><input value={form.datos.telefono} onChange={(e) => set({ telefono: e.target.value })} /></label>
            <label className="campo"><span>Abre (lun a sáb)</span><input type="time" required value={form.datos.horarioApertura} onChange={(e) => set({ horarioApertura: e.target.value })} /></label>
            <label className="campo"><span>Cierra (lun a vie)</span><input type="time" required value={form.datos.horarioCierre} onChange={(e) => set({ horarioCierre: e.target.value })} /></label>
            <label className="campo"><span>Cierra los sábados</span>
              <input type="time" value={form.datos.cierreSabado ?? ''} onChange={(e) => set({ cierreSabado: e.target.value || null })} />
              <span className="campo__ayuda">Vacío = no abre los sábados</span>
            </label>
          </div>
          <div className={estilos.botones}>
            <button type="submit" className="btn btn--primario">Guardar</button>
            <button type="button" className="btn btn--fantasma" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {sucursales.cargando && <Cargando />}
      {sucursales.error && <MensajeError mensaje={sucursales.error} />}
      <div className="tabla-scroll">
        <table className="tabla">
          <thead><tr><th>Sucursal</th><th>Dirección</th><th>Horario</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
          <tbody>
            {(sucursales.datos ?? []).map((s) => (
              <tr key={s.id}>
                <td><strong>{s.nombre}</strong><span className={estilos.sub}>{s.telefono}</span></td>
                <td>{s.direccion}, {s.ciudad}</td>
                <td>Lun a vie {hora(s.horarioApertura)} a {hora(s.horarioCierre)}<span className={estilos.sub}>{s.cierreSabado ? `Sáb hasta ${hora(s.cierreSabado)}` : 'Sábados cerrado'}</span></td>
                <td className={estilos.acciones}>
                  <button type="button" className="btn btn--fantasma" onClick={() => editar(s)}>Editar</button>
                  <button type="button" className="btn btn--fantasma" onClick={() => ejecutar(() => admin.eliminarSucursal(s.id), 'Sucursal eliminada.')}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
