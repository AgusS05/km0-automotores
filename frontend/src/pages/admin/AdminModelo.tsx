import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { admin, catalogo, type ModeloForm, type VersionForm } from '../../api/api'
import type { Combustible, TipoCarroceria, Version } from '../../api/tipos'
import { useCarga } from '../../hooks/useCarga'
import { nombreCarroceria, nombreCombustible, precio } from '../../utils/formato'
import { FotoAuto } from '../../components/FotoAuto'
import { Aviso, Cargando, MensajeError } from '../../components/Estados'
import estilos from './Admin.module.css'

const versionVacia = (modeloId: number): VersionForm => ({
  modeloId, nombreVersion: '', precio: 0, motor: '', potenciaCv: null, transmision: '', combustible: 'NAFTA', traccion: '', puertas: null, plazas: 5,
})

export default function AdminModelo() {
  const { id } = useParams()
  const modeloId = Number(id)
  const navigate = useNavigate()
  const detalle = useCarga(() => catalogo.modelo(modeloId), [modeloId])
  const marcas = useCarga(() => catalogo.marcas(), [])
  const [form, setForm] = useState<ModeloForm | null>(null)
  const [version, setVersion] = useState<{ id: number | null; datos: VersionForm } | null>(null)
  const [foto, setFoto] = useState({ url: '', fuenteUrl: '', credito: '' })
  const [color, setColor] = useState({ nombre: '', hex: '#1F3A93' })
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    const d = detalle.datos
    if (d) setForm({ marcaId: d.marcaId, nombre: d.nombre, tipoCarroceria: d.tipoCarroceria, anio: d.anio, descripcion: d.descripcion ?? '', destacado: d.destacado })
  }, [detalle.datos])

  async function ejecutar(fn: () => Promise<unknown>, ok: string) {
    setMensaje(null)
    try { await fn(); setMensaje({ tipo: 'ok', texto: ok }); detalle.recargar(); return true }
    catch (e) { setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error' }); return false }
  }

  if (detalle.cargando && !detalle.datos) return <Cargando />
  if (detalle.error || !detalle.datos || !form) return <MensajeError mensaje={detalle.error ?? 'No existe el modelo.'} />
  const d = detalle.datos

  const guardarModelo = (e: FormEvent) => { e.preventDefault(); ejecutar(() => admin.editarModelo(modeloId, form), 'Modelo guardado.') }
  const guardarVersion = async (e: FormEvent) => {
    e.preventDefault()
    if (!version) return
    const ok = await ejecutar(() => (version.id ? admin.editarVersion(version.id, version.datos) : admin.crearVersion(version.datos)),
      version.id ? 'Versión actualizada.' : 'Versión agregada.')
    if (ok) setVersion(null)
  }
  const editarVersion = (v: Version) => setVersion({ id: v.id, datos: {
    modeloId, nombreVersion: v.nombreVersion, precio: v.precio, motor: v.motor ?? '', potenciaCv: v.potenciaCv, transmision: v.transmision ?? '',
    combustible: v.combustible, traccion: v.traccion ?? '', puertas: v.puertas, plazas: v.plazas,
  } })
  const setV = (cambios: Partial<VersionForm>) => version && setVersion({ ...version, datos: { ...version.datos, ...cambios } })
  const numero = (valor: string) => (valor === '' ? null : Number(valor))

  return (
    <div className={estilos.seccion}>
      <p><Link to="/admin/catalogo">Volver al catálogo</Link></p>
      <div className={estilos.barraTitulo}>
        <h1>{d.marcaNombre} {d.nombre}</h1>
        <Link to={`/modelos/${d.id}`} target="_blank">Ver en el sitio</Link>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      <form className={estilos.formulario} onSubmit={guardarModelo}>
        <h2>Datos del modelo</h2>
        <div className={estilos.campos}>
          <label className="campo"><span>Marca</span>
            <select value={form.marcaId} onChange={(e) => setForm({ ...form, marcaId: Number(e.target.value) })}>
              {(marcas.datos ?? []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </label>
          <label className="campo"><span>Nombre</span><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
          <label className="campo"><span>Carrocería</span>
            <select value={form.tipoCarroceria} onChange={(e) => setForm({ ...form, tipoCarroceria: e.target.value as TipoCarroceria })}>
              {(Object.keys(nombreCarroceria) as TipoCarroceria[]).map((c) => <option key={c} value={c}>{nombreCarroceria[c]}</option>)}
            </select>
          </label>
          <label className="campo"><span>Año</span><input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })} /></label>
          <label className={`campo ${estilos.campoAncho}`}><span>Descripción</span>
            <textarea value={form.descripcion} maxLength={1000} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </label>
          <label className={estilos.check}><input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} /> Destacado en el inicio</label>
        </div>
        <div className={estilos.botones}>
          <button type="submit" className="btn btn--primario">Guardar cambios</button>
          <button type="button" className="btn btn--peligro" disabled={d.versiones.length > 0}
            title={d.versiones.length > 0 ? 'Primero eliminá sus versiones' : undefined}
            onClick={() => ejecutar(() => admin.eliminarModelo(modeloId), 'Modelo eliminado.').then((ok) => ok && navigate('/admin/catalogo'))}>
            Eliminar modelo
          </button>
        </div>
      </form>

      <section className={estilos.panel}>
        <div className={estilos.barraTitulo}>
          <h2>Versiones</h2>
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => setVersion({ id: null, datos: versionVacia(modeloId) })}>Agregar versión</button>
        </div>
        {version && (
          <form className={estilos.formulario} onSubmit={guardarVersion}>
            <div className={estilos.campos}>
              <label className="campo"><span>Nombre</span><input required value={version.datos.nombreVersion} onChange={(e) => setV({ nombreVersion: e.target.value })} /></label>
              <label className="campo"><span>Precio</span><input type="number" min={1} required value={version.datos.precio || ''} onChange={(e) => setV({ precio: Number(e.target.value) })} /></label>
              <label className="campo"><span>Motor</span><input value={version.datos.motor} onChange={(e) => setV({ motor: e.target.value })} /></label>
              <label className="campo"><span>Potencia (CV)</span><input type="number" value={version.datos.potenciaCv ?? ''} onChange={(e) => setV({ potenciaCv: numero(e.target.value) })} /></label>
              <label className="campo"><span>Caja</span><input value={version.datos.transmision} onChange={(e) => setV({ transmision: e.target.value })} /></label>
              <label className="campo"><span>Combustible</span>
                <select value={version.datos.combustible} onChange={(e) => setV({ combustible: e.target.value as Combustible })}>
                  {(Object.keys(nombreCombustible) as Combustible[]).map((c) => <option key={c} value={c}>{nombreCombustible[c]}</option>)}
                </select>
              </label>
              <label className="campo"><span>Tracción</span><input value={version.datos.traccion} onChange={(e) => setV({ traccion: e.target.value })} /></label>
              <label className="campo"><span>Puertas</span><input type="number" min={2} max={5} value={version.datos.puertas ?? ''} onChange={(e) => setV({ puertas: numero(e.target.value) })} /></label>
              <label className="campo"><span>Plazas</span><input type="number" min={2} max={9} value={version.datos.plazas ?? ''} onChange={(e) => setV({ plazas: numero(e.target.value) })} /></label>
            </div>
            <div className={estilos.botones}>
              <button type="submit" className="btn btn--primario">{version.id ? 'Guardar versión' : 'Agregar versión'}</button>
              <button type="button" className="btn btn--fantasma" onClick={() => setVersion(null)}>Cancelar</button>
            </div>
          </form>
        )}
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Versión</th><th>Motor</th><th>Caja</th><th>Combustible</th><th>Precio</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
            <tbody>
              {d.versiones.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.nombreVersion}</strong></td>
                  <td>{v.motor} {v.potenciaCv ? `(${v.potenciaCv} CV)` : ''}</td>
                  <td>{v.transmision}</td>
                  <td>{nombreCombustible[v.combustible]}</td>
                  <td>{precio(v.precio)}</td>
                  <td className={estilos.acciones}>
                    <button type="button" className="btn btn--fantasma" onClick={() => editarVersion(v)}>Editar</button>
                    <button type="button" className="btn btn--fantasma" onClick={() => ejecutar(() => admin.eliminarVersion(v.id), 'Versión eliminada.')}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className={estilos.paneles}>
        <section className={estilos.panel}>
          <h2>Fotos</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {d.imagenes.map((img) => (
              <li key={img.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <FotoAuto url={img.url} alt="" tipo={d.tipoCarroceria} className={estilos.miniatura} />
                <span className={estilos.sub} style={{ flex: 1, wordBreak: 'break-all' }}>{img.credito ?? img.url}</span>
                <button type="button" className="btn btn--fantasma" onClick={() => ejecutar(() => admin.eliminarImagen(img.id), 'Foto eliminada.')}>Quitar</button>
              </li>
            ))}
          </ul>
          <form className={estilos.campos} onSubmit={(e) => { e.preventDefault(); ejecutar(() => admin.agregarImagen(modeloId, foto), 'Foto agregada.').then((ok) => ok && setFoto({ url: '', fuenteUrl: '', credito: '' })) }}>
            <label className={`campo ${estilos.campoAncho}`}><span>URL de la foto</span><input type="url" required value={foto.url} onChange={(e) => setFoto({ ...foto, url: e.target.value })} /></label>
            <label className="campo"><span>Página de origen</span><input type="url" value={foto.fuenteUrl} onChange={(e) => setFoto({ ...foto, fuenteUrl: e.target.value })} /></label>
            <label className="campo"><span>Crédito</span><input value={foto.credito} onChange={(e) => setFoto({ ...foto, credito: e.target.value })} /></label>
            <button type="submit" className="btn btn--secundario">Agregar foto</button>
          </form>
        </section>

        <section className={estilos.panel}>
          <h2>Colores</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {d.colores.map((c) => (
              <li key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><span className={estilos.muestra} style={{ background: c.hex }} />{c.nombre} <span className={estilos.sub} style={{ display: 'inline' }}>{c.hex}</span></span>
                <button type="button" className="btn btn--fantasma" onClick={() => ejecutar(() => admin.eliminarColor(c.id), 'Color eliminado.')}>Quitar</button>
              </li>
            ))}
          </ul>
          <form className={estilos.botones} onSubmit={(e) => { e.preventDefault(); ejecutar(() => admin.agregarColor(modeloId, color), 'Color agregado.').then((ok) => ok && setColor({ nombre: '', hex: '#1F3A93' })) }}>
            <label className="campo" style={{ flex: 1 }}><span>Nombre</span><input required value={color.nombre} onChange={(e) => setColor({ ...color, nombre: e.target.value })} /></label>
            <label className="campo"><span>Color</span><input type="color" value={color.hex} onChange={(e) => setColor({ ...color, hex: e.target.value })} style={{ padding: 2, width: 60 }} /></label>
            <button type="submit" className="btn btn--secundario" style={{ alignSelf: 'end' }}>Agregar</button>
          </form>
        </section>
      </div>
    </div>
  )
}
