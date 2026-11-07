#!/usr/bin/env node
/**
 * Descarga fotos reales de los autos desde Wikimedia Commons (licencias libres),
 * las guarda en el frontend y genera la migración con los créditos de cada una.
 *
 * Uso (desde la raíz del repositorio, con Node 18 o superior):
 *   node scripts/fotos/descargar-fotos.mjs              busca, elige y descarga
 *   node scripts/fotos/descargar-fotos.mjs --simular    muestra qué elegiría, sin descargar ni escribir
 *
 * Genera:
 *   frontend/public/fotos/<modelo>-<n>.jpg                          las fotos (1280 px de ancho)
 *   backend/src/main/resources/db/migration/R__fotos_modelos.sql     migración repetible de Flyway
 *   database/fotos_modelos.sql                                       copia para consultar
 *   docs/creditos-fotos.md                                           autor y licencia de cada foto
 *   scripts/fotos/revision.html                                      página para revisar las fotos elegidas
 *
 * Si una foto no corresponde, agregá su nombre a "descartar" del modelo en fotos.config.json
 * (o fijá las que querés en "archivos") y volvé a correr el script.
 *
 * Sin dependencias: usa fetch de Node.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '..', '..')
const API = process.env.COMMONS_API ?? 'https://commons.wikimedia.org/w/api.php'
// Wikimedia pide identificar al cliente con un User-Agent descriptivo; los genéricos se bloquean.
const USER_AGENT = 'Km0AutomotoresTFI/1.0 (https://github.com/AgusS05/km0-automotores; proyecto academico UTN)'
const SIMULAR = process.argv.includes('--simular')

const RUTAS = {
  fotos: path.join(RAIZ, 'frontend', 'public', 'fotos'),
  migracion: path.join(RAIZ, 'backend', 'src', 'main', 'resources', 'db', 'migration', 'R__fotos_modelos.sql'),
  copiaSql: path.join(RAIZ, 'database', 'fotos_modelos.sql'),
  creditos: path.join(RAIZ, 'docs', 'creditos-fotos.md'),
  revision: path.join(AQUI, 'revision.html'),
}

/** Licencias que permiten usar la foto con atribución (sin NC ni ND). */
const LICENCIA_LIBRE = /^(cc[ -]by(-sa)?[ -]?[\d.]*|cc0|cc[ -]zero|public domain|pd|pdm)/i
const LICENCIA_RESTRINGIDA = /(nc|nd|non-?commercial|no ?deriv)/i

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// ------------------------------------------------------------------ API de Commons

async function pedirJson(params, intento = 1) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
  if (res.status === 429 && intento <= 4) {
    await esperar(2000 * intento)
    return pedirJson(params, intento + 1)
  }
  if (!res.ok) throw new Error(`Commons respondió ${res.status} para ${url}`)
  return res.json()
}

const PROPS_IMAGEN = {
  prop: 'imageinfo',
  iiprop: 'url|size|mime|extmetadata',
  iiurlwidth: '1280',
  iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
}

/** Datos de archivos puntuales ("archivos" de la configuración). Ignora los que no existen. */
async function buscarPorNombre(nombres) {
  if (nombres.length === 0) return []
  const titulos = nombres.map((n) => `File:${n.replace(/^File:/, '').replace(/_/g, ' ')}`)
  const datos = await pedirJson({ action: 'query', titles: titulos.join('|'), ...PROPS_IMAGEN })
  const paginas = datos.query?.pages ?? []
  const faltantes = paginas.filter((p) => p.missing).map((p) => p.title)
  if (faltantes.length) console.log(`    · no existen en Commons: ${faltantes.join(', ')}`)
  // Respetar el orden en que se fijaron en la configuración
  return titulos
    .map((t) => paginas.find((p) => p.title === t && !p.missing))
    .filter(Boolean)
    .map(aCandidato)
    .filter(Boolean)
}

/** Búsqueda de imágenes en Commons. */
async function buscarPorTexto(texto) {
  const datos = await pedirJson({
    action: 'query',
    generator: 'search',
    gsrsearch: `${texto} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '50',
    ...PROPS_IMAGEN,
  })
  return (datos.query?.pages ?? []).map(aCandidato).filter(Boolean)
}

function aCandidato(pagina) {
  const info = pagina.imageinfo?.[0]
  if (!info) return null
  const meta = info.extmetadata ?? {}
  return {
    titulo: pagina.title.replace(/^File:/, ''),
    ancho: info.width,
    alto: info.height,
    mime: info.mime,
    urlDescarga: info.thumburl ?? info.url,
    paginaUrl: info.descriptionurl,
    autor: textoPlano(meta.Artist?.value) || 'Autor desconocido',
    licencia: textoPlano(meta.LicenseShortName?.value) || '',
    licenciaUrl: meta.LicenseUrl?.value ?? '',
  }
}

/** El autor viene como HTML (enlaces a su página de usuario): se deja solo el texto. */
function textoPlano(html) {
  if (!html) return ''
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

// ------------------------------------------------------------------ elección

const normalizar = (s) => s.toLowerCase().replace(/_/g, ' ')

/** ¿Aparece la palabra (o frase) completa? Así "toy" no coincide con "Toyota" ni "rim" con "primera". */
function contiene(texto, palabra) {
  const p = normalizar(palabra).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${p}($|[^a-z0-9])`).test(texto)
}

function licenciaValida(c) {
  return LICENCIA_LIBRE.test(c.licencia) && !LICENCIA_RESTRINGIDA.test(c.licencia)
}

function formatoValido(c, config) {
  const proporcion = c.ancho / c.alto
  return c.mime === 'image/jpeg' && c.ancho >= config.anchoMinimo && proporcion >= 1.2 && proporcion <= 2.2
}

/**
 * ¿El nombre menciona un año anterior al mínimo? (ej. "1987 Chevrolet S10" o "2003 Chevrolet Tracker").
 * No cuenta los números de foto de las cámaras ("IMG 1995", "DSC 2004", "1X7A2010").
 */
function anioViejo(t, minimo) {
  if (!minimo) return false
  for (const m of t.matchAll(/(?:^|[^0-9a-z])((?:19[5-9]|20[0-9])[0-9])(?=$|[^0-9])/g)) {
    const antes = t.slice(Math.max(0, m.index - 5), m.index + 1)
    if (/(img|dsc|dscf)\s?.?$/.test(antes)) continue
    if (Number(m[1]) < minimo) return true
  }
  return false
}

function cumpleNombre(c, modelo, config) {
  const t = normalizar(c.titulo)
  const requeridos = modelo.requerido.every((grupo) => grupo.split('|').some((p) => contiene(t, p)))
  const excluido = [...config.excluirSiempre, ...modelo.excluir].some((p) => contiene(t, p))
  return requeridos && !excluido && !anioViejo(t, modelo.anioMinimo ?? config.anioMinimo)
}

function puntaje(c, modelo) {
  const t = normalizar(c.titulo)
  let p = modelo.preferir.filter((x) => contiene(t, x)).length * 3
  if (/front|frontal|vorne|delantera|avant/.test(t)) p += 2 // vista de frente: la más útil como principal
  if (/rear|heck|trasera|arrière/.test(t)) p += 1
  p += Math.min(c.ancho / 2000, 1) // a igualdad, mejor resolución
  return p
}

/** Evita tres fotos casi iguales de la misma sesión (ej. IMG_1019 e IMG_1020). */
function parecidas(a, b) {
  const base = (s) => normalizar(s).replace(/\.[a-z]+$/, '').replace(/[\d\s()_-]+$/, '')
  const numero = (s) => Number((s.match(/(\d{3,})\D*$/) ?? [])[1])
  return base(a.titulo) === base(b.titulo) && Math.abs(numero(a.titulo) - numero(b.titulo)) <= 3
}

async function elegirFotos(modelo, config) {
  const descartar = new Set(modelo.descartar.map((d) => normalizar(d.replace(/^File:/, ''))))
  const noDescartada = (c) => !descartar.has(normalizar(c.titulo))
  const elegidas = []

  // 1. Las fijadas a mano: solo se controla que existan, tengan licencia libre y no estén descartadas
  for (const c of await buscarPorNombre(modelo.archivos)) {
    if (elegidas.length >= config.cantidadPorModelo) break
    if (!noDescartada(c)) continue
    if (!licenciaValida(c)) {
      console.log(`    · ${c.titulo}: licencia "${c.licencia}" no permitida, se omite`)
      continue
    }
    elegidas.push(c)
  }

  // 2. Completar con la búsqueda
  if (elegidas.length < config.cantidadPorModelo) {
    // "busqueda" puede ser un texto o una lista de textos: se juntan los resultados sin repetir
    const vistos = new Set()
    const encontrados = []
    for (const texto of [].concat(modelo.busqueda)) {
      for (const c of await buscarPorTexto(texto)) {
        if (!vistos.has(c.titulo)) { vistos.add(c.titulo); encontrados.push(c) }
      }
    }
    const candidatos = encontrados
      .filter(noDescartada)
      .filter((c) => !elegidas.some((e) => e.titulo === c.titulo))
      .filter(licenciaValida)
      .filter((c) => formatoValido(c, config))
      .filter((c) => cumpleNombre(c, modelo, config))
      .sort((a, b) => puntaje(b, modelo) - puntaje(a, modelo))
    for (const c of candidatos) {
      if (elegidas.length >= config.cantidadPorModelo) break
      if (elegidas.some((e) => parecidas(e, c))) continue
      elegidas.push(c)
    }
  }
  return elegidas
}

// ------------------------------------------------------------------ descarga

async function existe(ruta) {
  try { await access(ruta); return true } catch { return false }
}

async function descargar(url, destino, intento = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (res.status === 429 && intento <= 4) {
    await esperar(3000 * intento)
    return descargar(url, destino, intento + 1)
  }
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (${res.status})`)
  const bytes = Buffer.from(await res.arrayBuffer())
  await writeFile(destino, bytes)
  return bytes.length
}

// ------------------------------------------------------------------ archivos generados

const sqlTexto = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`)

function credito(c) {
  const texto = `${c.autor} · ${c.licencia || 'licencia libre'}`
  return texto.length > 200 ? `${texto.slice(0, 197)}...` : texto
}

function generarSql(resultado) {
  const lineas = [
    '-- Fotos reales de los modelos, descargadas de Wikimedia Commons con scripts/fotos/descargar-fotos.mjs.',
    '-- Migración REPETIBLE de Flyway (prefijo R__): se vuelve a aplicar sola cada vez que cambia este archivo.',
    '-- No editar a mano: volver a correr el script.',
    '--',
    '-- Reemplaza las fotos de ejemplo (enlaces a Wikimedia) y las de una corrida anterior del script.',
    '-- Las fotos que el administrador haya agregado con otra URL no se tocan.',
    '',
    "DELETE FROM imagen_modelo WHERE url LIKE '/fotos/%' OR url LIKE 'https://upload.wikimedia.org/%';",
    '',
  ]
  for (const { modelo, fotos } of resultado) {
    if (fotos.length === 0) continue
    lineas.push(`-- ${modelo.marca} ${modelo.modelo}`)
    lineas.push('INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)')
    lineas.push(`SELECT m.id, f.url, f.fuente_url, f.credito, f.orden`)
    lineas.push(`FROM modelo m JOIN marca ma ON ma.id = m.marca_id`)
    lineas.push(`CROSS JOIN (VALUES`)
    lineas.push(fotos.map((f, i) =>
      `  (${sqlTexto(f.archivoLocal)}, ${sqlTexto(f.paginaUrl)}, ${sqlTexto(credito(f))}, ${i})`).join(',\n'))
    lineas.push(`) AS f(url, fuente_url, credito, orden)`)
    lineas.push(`WHERE ma.nombre = ${sqlTexto(modelo.marca)} AND m.nombre = ${sqlTexto(modelo.modelo)};`)
    lineas.push('')
  }
  return lineas.join('\n')
}

function generarCreditos(resultado) {
  const lineas = [
    '# Créditos de las fotos',
    '',
    'Fotos de [Wikimedia Commons](https://commons.wikimedia.org) usadas bajo licencias libres que permiten',
    'reutilizarlas citando al autor, salvo las marcadas como foto de prensa (de la marca, usadas solo con fines académicos).',
    'Generado por `scripts/fotos/descargar-fotos.mjs`.',
    '',
    '| Modelo | Archivo local | Autor | Licencia | Original |',
    '|---|---|---|---|---|',
  ]
  for (const { modelo, fotos } of resultado) {
    for (const f of fotos) {
      const licencia = f.licenciaUrl ? `[${f.licencia}](${f.licenciaUrl})` : f.licencia
      lineas.push(`| ${modelo.marca} ${modelo.modelo} | \`frontend/public${f.archivoLocal}\` | ${f.autor.replace(/\|/g, '/')} | ${licencia} | ${f.paginaUrl ? `[${f.titulo.replace(/\|/g, '/')}](${f.paginaUrl})` : f.titulo} |`)
    }
  }
  lineas.push('')
  return lineas.join('\n')
}

function generarRevision(resultado) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const bloques = resultado.map(({ modelo, fotos }) => `
  <section>
    <h2>${esc(modelo.marca)} ${esc(modelo.modelo)} <small>${fotos.length} foto(s)</small></h2>
    <div class="fila">${fotos.map((f) => `
      <figure>
        <img src="${esc(SIMULAR ? f.urlDescarga : `../../frontend/public${f.archivoLocal}`)}" alt="" loading="lazy">
        <figcaption><code>${esc(f.titulo)}</code><br>${esc(f.autor)} · ${esc(f.licencia)}</figcaption>
      </figure>`).join('')}
    </div>
  </section>`).join('')
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Revisión de fotos · Km0</title>
<style>
  body { font: 15px/1.4 system-ui, sans-serif; margin: 24px; background: #f2f3f5; color: #1c2330; }
  h2 { font-size: 18px; margin: 28px 0 8px; } small { color: #667; font-weight: normal; }
  .fila { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  figure { margin: 0; background: #fff; border-radius: 6px; overflow: hidden; }
  img { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; }
  figcaption { padding: 8px; font-size: 12px; } code { font-size: 11px; }
</style></head><body>
<h1>Fotos elegidas</h1>
<p>Si alguna no corresponde al modelo, copiá su nombre (lo que está en gris) en "descartar" de ese modelo
en <code>scripts/fotos/fotos.config.json</code> y volvé a correr el script.</p>
${bloques}
</body></html>
`
}

// ------------------------------------------------------------------ fotos propias

/**
 * Fotos que no vienen de Wikimedia ("propias" en la configuración): se copian a mano a
 * frontend/public/fotos y el script solo las suma al SQL y a los créditos, sin descargar nada.
 * Usar nombres que no terminen en -1.jpg, -2.jpg... para que el script no las pise.
 */
async function fotosPropias(modelo) {
  const lista = []
  for (const p of modelo.propias ?? []) {
    if (!(await existe(path.join(RUTAS.fotos, p.archivo)))) {
      console.log(`  ⚠ No está frontend/public/fotos/${p.archivo}: se omite`)
      continue
    }
    lista.push({
      titulo: p.archivo,
      archivoLocal: `/fotos/${p.archivo}`,
      urlDescarga: `../../frontend/public/fotos/${p.archivo}`,
      paginaUrl: p.fuente ?? null,
      autor: p.autor,
      licencia: p.licencia ?? '',
      licenciaUrl: null,
    })
  }
  return lista
}

// ------------------------------------------------------------------ principal

async function main() {
  const config = JSON.parse(await readFile(path.join(AQUI, 'fotos.config.json'), 'utf8'))
  if (!SIMULAR) await mkdir(RUTAS.fotos, { recursive: true })

  const resultado = []
  for (const modelo of config.modelos) {
    console.log(`\n${modelo.marca} ${modelo.modelo}`)
    const cantidad = modelo.cantidad ?? config.cantidadPorModelo
    const propias = await fotosPropias(modelo)
    const fotos = await elegirFotos(modelo, { ...config, cantidadPorModelo: Math.max(0, cantidad - propias.length) })
    for (const f of propias) console.log(`  · ${f.titulo} (foto propia, ${f.autor})`)
    for (const [i, f] of fotos.entries()) {
      f.archivoLocal = `/fotos/${modelo.slug}-${i + 1}.jpg`
      const destino = path.join(RUTAS.fotos, `${modelo.slug}-${i + 1}.jpg`)
      if (SIMULAR) {
        console.log(`  ${i + 1}. ${f.titulo} (${f.ancho}×${f.alto}, ${f.licencia})`)
        continue
      }
      const kb = Math.round((await descargar(f.urlDescarga, destino)) / 1024)
      console.log(`  ${i + 1}. ${f.titulo} → ${f.archivoLocal} (${kb} kB, ${f.licencia})`)
      await esperar(400) // sin apurar a los servidores de Wikimedia
    }
    if (propias.length + fotos.length < cantidad) {
      console.log(`  ⚠ Solo se encontraron ${propias.length + fotos.length}. Probá cambiar "busqueda" o agregar nombres en "archivos".`)
    }
    // Las propias van primero: la principal de la ficha es la primera
    resultado.push({ modelo, fotos: [...propias, ...fotos] })
  }

  await writeFile(RUTAS.revision, generarRevision(resultado))
  if (SIMULAR) {
    console.log(`\nSimulación terminada. Abrí ${path.relative(RAIZ, RUTAS.revision)} para ver las fotos.`)
    return
  }

  // Borrar fotos sobrantes de una corrida anterior no hace falta: se pisan por nombre.
  const sql = generarSql(resultado)
  await writeFile(RUTAS.migracion, sql)
  await writeFile(RUTAS.copiaSql, sql)
  await writeFile(RUTAS.creditos, generarCreditos(resultado))

  const total = resultado.reduce((n, r) => n + r.fotos.length, 0)
  console.log(`\nListo: ${total} fotos en frontend/public/fotos.`)
  console.log(`Revisalas en ${path.relative(RAIZ, RUTAS.revision)} y reiniciá el backend: Flyway aplica ${path.basename(RUTAS.migracion)}.`)
  if (await existe(path.join(RAIZ, '.git'))) {
    console.log('Después: git add frontend/public/fotos backend docs database scripts && git commit')
  }
}

main().catch((e) => {
  console.error(`\nError: ${e.message}`)
  if (/fetch failed|ENOTFOUND|ECONN/.test(String(e.cause ?? e.message))) {
    console.error('Revisá la conexión a internet (el script necesita acceder a commons.wikimedia.org).')
  }
  process.exit(1)
})
