import { useState, type FormEvent } from 'react'
import { admin, catalogo, type VehiculoForm } from '../../api/api'
import type { VehiculoDemo } from '../../api/tipos'
import { useCarga } from '../../hooks/useCarga'
import { Aviso, Cargando, MensajeError } from '../../components/Estados'
import estilos from './Admin.module.css'

export default function AdminUnidades() {
  const unidades = useCarga(() => admin.vehiculos(), [])
  const versiones = useCarga(() => catalogo.versiones(), [])
  const sucursales = useCarga(() => catalogo.sucursales(), [])
  const [form, setForm] = useState<{ id: number | null; datos: VehiculoForm } | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function ejecutar(fn: () => Promise<unknown>, ok: string) {
    setMensaje(null)
    try { await fn(); setMensaje({ tipo: 'ok', texto: ok }); unidades.recargar(); return true }
    catch (e) { setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error' }); return false }
  }
  const nueva = () => setForm({ id: null, datos: { versionId: versiones.datos?.[0]?.id ?? 0, sucursalId: sucursales.datos?.[0]?.id ?? 0, patente: '', disponible: true } })
  const editar = (u: VehiculoDemo) => setForm({ id: u.id, datos: { versionId: u.versionId, sucursalId: u.sucursalId, patente: u.patente, disponible: u.disponible } })
  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    const ok = await ejecutar(() => (form.id ? admin.editarVehiculo(form.id, form.datos) : admin.crearVehiculo(form.datos)), 'Unidad guardada.')
    if (ok) setForm(null)
  }
  const set = (c: Partial<VehiculoForm>) => form && setForm({ ...form, datos: { ...form.datos, ...c } })

  return (
    <div className={estilos.seccion}>
      <div className={estilos.barraTitulo}>
        <div>
          <h1>Unidades para test drive</h1>
          <p className={estilos.aclaracion}>Si una unidad va al taller, desmarcá "Disponible": deja de ofrecerse sin perder su historial.</p>
        </div>
        <button type="button" className="btn btn--primario" onClick={nueva}>Nueva unidad</button>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {form && (
        <form className={estilos.formulario} onSubmit={guardar}>
          <h2>{form.id ? 'Editar unidad' : 'Nueva unidad'}</h2>
          <div className={estilos.campos}>
            <label className="campo"><span>Versión</span>
              <select value={form.datos.versionId} onChange={(e) => set({ versionId: Number(e.target.value) })}>
                {(versiones.datos ?? []).map((v) => <option key={v.id} value={v.id}>{v.marcaNombre} {v.modeloNombre} {v.nombreVersion}</option>)}
              </select>
            </label>
            <label className="campo"><span>Sucursal</span>
              <select value={form.datos.sucursalId} onChange={(e) => set({ sucursalId: Number(e.target.value) })}>
                {(sucursales.datos ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
            <label className="campo"><span>Patente</span>
              <input required value={form.datos.patente} placeholder="AF123BC" onChange={(e) => set({ patente: e.target.value.toUpperCase() })} />
            </label>
            <label className={estilos.check}><input type="checkbox" checked={form.datos.disponible} onChange={(e) => set({ disponible: e.target.checked })} /> Disponible para test drive</label>
          </div>
          <div className={estilos.botones}>
            <button type="submit" className="btn btn--primario">Guardar</button>
            <button type="button" className="btn btn--fantasma" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {unidades.cargando && <Cargando />}
      {unidades.error && <MensajeError mensaje={unidades.error} />}
      <div className="tabla-scroll">
        <table className="tabla">
          <thead><tr><th>Patente</th><th>Auto</th><th>Sucursal</th><th>Estado</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
          <tbody>
            {(unidades.datos ?? []).map((u) => (
              <tr key={u.id} className={!u.disponible ? estilos.inactivo : undefined}>
                <td><strong>{u.patente}</strong></td>
                <td>{u.marcaNombre} {u.modeloNombre}<span className={estilos.sub}>{u.versionNombre}</span></td>
                <td>{u.sucursalNombre}</td>
                <td>{u.disponible ? 'Disponible' : 'No disponible'}</td>
                <td className={estilos.acciones}>
                  <button type="button" className="btn btn--fantasma" onClick={() => editar(u)}>Editar</button>
                  <button type="button" className="btn btn--fantasma" onClick={() => ejecutar(() => admin.eliminarVehiculo(u.id), 'Unidad eliminada.')}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
