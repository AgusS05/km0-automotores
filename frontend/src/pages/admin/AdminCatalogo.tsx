import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { admin, catalogo, type ModeloForm } from '../../api/api'
import type { Marca, TipoCarroceria } from '../../api/tipos'
import { useCarga } from '../../hooks/useCarga'
import { nombreCarroceria, precio } from '../../utils/formato'
import { Aviso, Cargando, MensajeError } from '../../components/Estados'
import estilos from './Admin.module.css'

const MODELO_VACIO: ModeloForm = { marcaId: 0, nombre: '', tipoCarroceria: 'SEDAN', anio: new Date().getFullYear(), descripcion: '', destacado: false }

export default function AdminCatalogo() {
  const navigate = useNavigate()
  const marcas = useCarga(() => catalogo.marcas(), [])
  const modelos = useCarga(() => catalogo.modelos(), [])
  const [nuevaMarca, setNuevaMarca] = useState('')
  const [editando, setEditando] = useState<{ id: number; nombre: string } | null>(null)
  const [modelo, setModelo] = useState<ModeloForm | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  async function ejecutar(fn: () => Promise<unknown>, ok: string) {
    setMensaje(null)
    try { await fn(); setMensaje({ tipo: 'ok', texto: ok }); marcas.recargar(); modelos.recargar() }
    catch (e) { setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'Error' }) }
  }

  async function crearModelo(e: FormEvent) {
    e.preventDefault()
    if (!modelo) return
    try {
      const creado = await admin.crearModelo(modelo)
      navigate(`/admin/catalogo/${creado.id}`)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error' })
    }
  }

  return (
    <div className={estilos.seccion}>
      <div className={estilos.barraTitulo}>
        <h1>Catálogo</h1>
        <button type="button" className="btn btn--primario" onClick={() => setModelo({ ...MODELO_VACIO, marcaId: marcas.datos?.[0]?.id ?? 0 })}>
          Nuevo modelo
        </button>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {modelo && (
        <form className={estilos.formulario} onSubmit={crearModelo}>
          <h2>Nuevo modelo</h2>
          <div className={estilos.campos}>
            <label className="campo"><span>Marca</span>
              <select value={modelo.marcaId} onChange={(e) => setModelo({ ...modelo, marcaId: Number(e.target.value) })}>
                {(marcas.datos ?? []).map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <label className="campo"><span>Nombre</span>
              <input required value={modelo.nombre} onChange={(e) => setModelo({ ...modelo, nombre: e.target.value })} />
            </label>
            <label className="campo"><span>Carrocería</span>
              <select value={modelo.tipoCarroceria} onChange={(e) => setModelo({ ...modelo, tipoCarroceria: e.target.value as TipoCarroceria })}>
                {(Object.keys(nombreCarroceria) as TipoCarroceria[]).map((c) => <option key={c} value={c}>{nombreCarroceria[c]}</option>)}
              </select>
            </label>
            <label className="campo"><span>Año</span>
              <input type="number" value={modelo.anio} onChange={(e) => setModelo({ ...modelo, anio: Number(e.target.value) })} />
            </label>
          </div>
          <p className={estilos.aclaracion}>Después de crearlo vas a poder cargar versiones, fotos y colores.</p>
          <div className={estilos.botones}>
            <button type="submit" className="btn btn--primario">Crear modelo</button>
            <button type="button" className="btn btn--fantasma" onClick={() => setModelo(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className={estilos.paneles}>
        <section className={estilos.panel}>
          <h2>Marcas</h2>
          {marcas.error && <MensajeError mensaje={marcas.error} />}
          <table className="tabla">
            <tbody>
              {(marcas.datos ?? []).map((m: Marca) => (
                <tr key={m.id}>
                  <td>
                    {editando?.id === m.id ? (
                      <input aria-label="Nombre de la marca" value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
                    ) : <>{m.nombre}<span className={estilos.sub}>{m.cantidadModelos} modelos</span></>}
                  </td>
                  <td className={estilos.acciones}>
                    {editando?.id === m.id ? (
                      <>
                        <button type="button" className="btn btn--primario btn--chico"
                          onClick={() => ejecutar(() => admin.editarMarca(m.id, editando.nombre), 'Marca actualizada.').then(() => setEditando(null))}>Guardar</button>
                        <button type="button" className="btn btn--fantasma" onClick={() => setEditando(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn btn--fantasma" onClick={() => setEditando({ id: m.id, nombre: m.nombre })}>Editar</button>
                        <button type="button" className="btn btn--fantasma" disabled={m.cantidadModelos > 0}
                          title={m.cantidadModelos > 0 ? 'Tiene modelos cargados' : undefined}
                          onClick={() => ejecutar(() => admin.eliminarMarca(m.id), 'Marca eliminada.')}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form className={estilos.botones} onSubmit={(e) => { e.preventDefault(); ejecutar(() => admin.crearMarca(nuevaMarca), 'Marca creada.').then(() => setNuevaMarca('')) }}>
            <label className="campo" style={{ flex: 1 }}>
              <span className="visualmente-oculto">Nueva marca</span>
              <input placeholder="Nueva marca" value={nuevaMarca} onChange={(e) => setNuevaMarca(e.target.value)} />
            </label>
            <button type="submit" className="btn btn--secundario" disabled={!nuevaMarca.trim()}>Agregar</button>
          </form>
        </section>

        <section className={estilos.panel}>
          <h2>Modelos</h2>
          {modelos.cargando && <Cargando />}
          {modelos.error && <MensajeError mensaje={modelos.error} />}
          <div className="tabla-scroll">
            <table className="tabla">
              <thead><tr><th>Modelo</th><th>Versiones</th><th>Desde</th><th><span className="visualmente-oculto">Acciones</span></th></tr></thead>
              <tbody>
                {(modelos.datos ?? []).map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.marcaNombre} {m.nombre}</strong><span className={estilos.sub}>{nombreCarroceria[m.tipoCarroceria]}{m.destacado ? ', destacado' : ''}</span></td>
                    <td>{m.cantidadVersiones}</td>
                    <td>{precio(m.precioDesde)}</td>
                    <td><Link to={`/admin/catalogo/${m.id}`}>Editar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
