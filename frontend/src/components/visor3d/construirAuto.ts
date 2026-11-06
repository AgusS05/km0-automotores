import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { TipoCarroceria } from '../../api/tipos'

/**
 * Construye un auto estilizado con geometría de three.js, según el tipo de carrocería.
 * No es la réplica exacta de un modelo (los modelos 3D oficiales de las marcas no son
 * de uso libre): es una representación del tipo de vehículo que se puede girar y pintar
 * con los colores reales de cada modelo.
 *
 * Sistema de coordenadas: x = largo (+x es el frente), y = altura, z = ancho. Unidades ≈ metros.
 */

interface Proporciones {
  largo: number
  ancho: number
  piso: number            // altura del borde inferior de la carrocería
  frente: number          // altura del capó en la trompa
  cintura: number         // línea de cintura (donde empiezan los vidrios)
  techo: number
  ejeDelantero: number
  ejeTrasero: number
  radioRueda: number
  parabrisasBase: number  // x donde arranca el parabrisas
  parabrisasTope: number  // x donde el parabrisas toca el techo
  lunetaTope: number      // x donde el techo baja hacia atrás
  lunetaBase: number      // x donde termina la luneta
  cola: number            // altura de la cola (baúl / portón)
  caja?: boolean          // pickup: caja de carga detrás de la cabina
}

const PROPORCIONES: Record<TipoCarroceria, Proporciones> = {
  SEDAN: {
    largo: 4.6, ancho: 1.8, piso: 0.3, frente: 0.74, cintura: 0.9, techo: 1.42,
    ejeDelantero: 1.38, ejeTrasero: -1.3, radioRueda: 0.33,
    parabrisasBase: 0.72, parabrisasTope: -0.08, lunetaTope: -0.95, lunetaBase: -1.62, cola: 0.98,
  },
  HATCHBACK: {
    largo: 4.05, ancho: 1.75, piso: 0.29, frente: 0.76, cintura: 0.9, techo: 1.47,
    ejeDelantero: 1.24, ejeTrasero: -1.28, radioRueda: 0.31,
    parabrisasBase: 0.66, parabrisasTope: -0.1, lunetaTope: -1.5, lunetaBase: -1.86, cola: 0.92,
  },
  SUV: {
    largo: 4.45, ancho: 1.85, piso: 0.38, frente: 0.86, cintura: 1.06, techo: 1.66,
    ejeDelantero: 1.36, ejeTrasero: -1.3, radioRueda: 0.37,
    parabrisasBase: 0.8, parabrisasTope: 0.02, lunetaTope: -1.72, lunetaBase: -2.02, cola: 1.08,
  },
  PICKUP: {
    largo: 5.3, ancho: 1.9, piso: 0.44, frente: 0.98, cintura: 1.14, techo: 1.84,
    ejeDelantero: 1.7, ejeTrasero: -1.55, radioRueda: 0.39,
    parabrisasBase: 0.98, parabrisasTope: 0.26, lunetaTope: -0.74, lunetaBase: -0.8, cola: 1.14, caja: true,
  },
}

// Radio de los bordes redondeados de la carrocería (hombros, trompa, cola)
const BISEL = 0.13

export interface AutoConstruido {
  grupo: THREE.Group
  pintura: THREE.MeshPhysicalMaterial
  largo: number
  altura: number
  liberar: () => void
}

export function construirAuto(tipo: TipoCarroceria, colorInicial: string): AutoConstruido {
  const p = PROPORCIONES[tipo]
  const grupo = new THREE.Group()
  const geometrias: THREE.BufferGeometry[] = []
  const materiales: THREE.Material[] = []
  const reg = <T extends THREE.BufferGeometry>(g: T) => (geometrias.push(g), g)
  const mat = <T extends THREE.Material>(m: T) => (materiales.push(m), m)

  // Pintura metalizada con laca: poco "metal" para que el color se vea intenso, y una capa de brillo encima
  const pintura = mat(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorInicial), metalness: 0.25, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.06,
    envMapIntensity: 0.5,
  }))
  const vidrio = mat(new THREE.MeshPhysicalMaterial({
    color: 0x0c1116, metalness: 0.35, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02,
  }))
  const plastico = mat(new THREE.MeshStandardMaterial({ color: 0x1a1d21, roughness: 0.75, metalness: 0.1 }))
  const goma = mat(new THREE.MeshStandardMaterial({ color: 0x131416, roughness: 0.92 }))
  const llanta = mat(new THREE.MeshStandardMaterial({ color: 0xc9cdd3, metalness: 1, roughness: 0.28 }))
  const farol = mat(new THREE.MeshStandardMaterial({ color: 0xf4f7ff, emissive: 0xdfe8ff, emissiveIntensity: 1.1 }))
  const stop = mat(new THREE.MeshStandardMaterial({ color: 0x7a0c10, emissive: 0xff2430, emissiveIntensity: 0.8 }))

  const F = p.largo / 2
  const R = -p.largo / 2
  const radioArco = p.radioRueda + 0.06 + BISEL

  // ---------------------------------------------------------------- carrocería inferior
  // Perfil lateral (con los pasaruedas recortados) extruido a lo ancho con bordes redondeados.
  const perfil = new THREE.Shape()
  perfil.moveTo(R + 0.14, p.piso)
  perfil.lineTo(p.ejeTrasero - radioArco, p.piso)
  perfil.absarc(p.ejeTrasero, p.radioRueda, radioArco, Math.PI, 0, true)
  perfil.lineTo(p.ejeDelantero - radioArco, p.piso)
  perfil.absarc(p.ejeDelantero, p.radioRueda, radioArco, Math.PI, 0, true)
  perfil.lineTo(F - 0.16, p.piso)
  perfil.quadraticCurveTo(F, p.piso, F, p.piso + 0.14)                      // paragolpes delantero
  perfil.lineTo(F, p.frente - 0.12)
  perfil.quadraticCurveTo(F, p.frente, F - 0.2, p.frente)                    // trompa
  perfil.quadraticCurveTo(p.parabrisasBase + 0.6, p.frente + 0.06, p.parabrisasBase, p.cintura) // capó
  if (p.caja) {
    perfil.lineTo(R + 0.12, p.cola)                                          // borde de la caja
  } else {
    perfil.lineTo(p.lunetaBase, p.cintura + (p.cola - p.cintura) * 0.6)
    perfil.quadraticCurveTo(R + 0.2, p.cola + 0.02, R + 0.12, p.cola)        // baúl / portón
  }
  perfil.quadraticCurveTo(R, p.cola, R, p.cola - 0.14)
  perfil.lineTo(R, p.piso + 0.14)
  perfil.quadraticCurveTo(R, p.piso, R + 0.14, p.piso)                       // paragolpes trasero

  const profundidad = p.ancho - 2 * BISEL
  const carroceria = reg(new THREE.ExtrudeGeometry(perfil, {
    depth: profundidad, bevelEnabled: true, bevelThickness: BISEL, bevelSize: BISEL, bevelSegments: 8, curveSegments: 28,
  }))
  carroceria.translate(0, 0, -profundidad / 2)
  grupo.add(new THREE.Mesh(carroceria, pintura))

  // ---------------------------------------------------------------- habitáculo (vidrios)
  const anchoCabina = p.ancho * 0.84
  const cabina = new THREE.Shape()
  cabina.moveTo(p.parabrisasBase, p.cintura - 0.02)
  cabina.quadraticCurveTo(p.parabrisasBase - (p.parabrisasBase - p.parabrisasTope) * 0.35, p.techo - 0.04,
    p.parabrisasTope, p.techo)
  cabina.lineTo(p.lunetaTope, p.techo)
  cabina.quadraticCurveTo(p.lunetaTope - (p.lunetaTope - p.lunetaBase) * 0.55, p.techo - 0.03,
    p.lunetaBase, p.cintura - 0.02)
  cabina.lineTo(p.parabrisasBase, p.cintura - 0.02)
  const profCabina = anchoCabina - 0.12
  const geoCabina = reg(new THREE.ExtrudeGeometry(cabina, {
    depth: profCabina, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 20,
  }))
  geoCabina.translate(0, 0, -profCabina / 2)
  const caida = 0.13 // cuánto se angosta el habitáculo hacia el techo
  afinar(geoCabina, p.cintura, p.techo + 0.06, caida, 1)
  geoCabina.computeVertexNormals()
  grupo.add(new THREE.Mesh(geoCabina, vidrio))

  // Parantes (B y C) pintados sobre los costados del vidrio: dividen las ventanillas
  const xB = (p.parabrisasTope + p.lunetaTope) / 2 + (p.caja ? 0.05 : 0.12)
  const parantes: THREE.Shape[] = []
  const paranteB = new THREE.Shape()
  paranteB.moveTo(xB - 0.06, p.cintura)
  paranteB.lineTo(xB + 0.06, p.cintura)
  paranteB.lineTo(xB + 0.05, p.techo - 0.02)
  paranteB.lineTo(xB - 0.05, p.techo - 0.02)
  parantes.push(paranteB)
  if (!p.caja) {
    const anchoC = tipo === 'SEDAN' ? 0.22 : 0.34
    const paranteC = new THREE.Shape()
    paranteC.moveTo(p.lunetaTope + anchoC, p.cintura)
    paranteC.lineTo(p.lunetaTope + anchoC - 0.04, p.techo - 0.02)
    paranteC.lineTo(p.lunetaTope, p.techo - 0.02)
    paranteC.quadraticCurveTo(p.lunetaTope - (p.lunetaTope - p.lunetaBase) * 0.55, p.techo - 0.05, p.lunetaBase + 0.02, p.cintura)
    paranteC.lineTo(p.lunetaTope + anchoC, p.cintura)
    parantes.push(paranteC)
  }
  for (const forma of parantes) {
    for (const lado of [-1, 1]) {
      const geo = reg(new THREE.ExtrudeGeometry(forma, { depth: 0.025, bevelEnabled: false, curveSegments: 12 }))
      geo.translate(0, 0, lado > 0 ? profCabina / 2 + 0.055 : -profCabina / 2 - 0.08)
      afinar(geo, p.cintura, p.techo + 0.06, caida, 1)
      grupo.add(new THREE.Mesh(geo, pintura))
    }
  }

  // Techo pintado sobre el habitáculo
  const largoTecho = p.parabrisasTope - p.lunetaTope - 0.12
  const techo = new THREE.Mesh(reg(new RoundedBoxGeometry(largoTecho, 0.07, (anchoCabina + 0.02) * (1 - caida), 3, 0.03)), pintura)
  techo.position.set((p.parabrisasTope + p.lunetaTope) / 2, p.techo + 0.03, 0)
  grupo.add(techo)

  // Pickup: cobertor de la caja de carga
  if (p.caja) {
    const largoCaja = p.lunetaBase - (R + 0.2) - 0.1
    const cobertor = new THREE.Mesh(reg(new RoundedBoxGeometry(largoCaja, 0.04, p.ancho * 0.86, 2, 0.015)), plastico)
    cobertor.position.set((p.lunetaBase - 0.1 + R + 0.2) / 2, p.cola + BISEL + 0.01, 0)
    grupo.add(cobertor)
  }

  // ---------------------------------------------------------------- detalles
  const zFaro = p.ancho / 2 - 0.32
  for (const lado of [-1, 1]) {
    const faro = new THREE.Mesh(reg(new RoundedBoxGeometry(0.08, 0.09, 0.46, 2, 0.03)), farol)
    faro.position.set(F + BISEL - 0.03, p.frente - 0.14, lado * zFaro)
    grupo.add(faro)

    const luzTrasera = new THREE.Mesh(reg(new RoundedBoxGeometry(0.06, 0.1, 0.38, 2, 0.02)), stop)
    luzTrasera.position.set(R - BISEL + 0.03, p.cola - 0.12, lado * (p.ancho / 2 - 0.26))
    grupo.add(luzTrasera)

    const espejo = new THREE.Mesh(reg(new RoundedBoxGeometry(0.16, 0.11, 0.14, 2, 0.04)), pintura)
    espejo.position.set(p.parabrisasBase - 0.12, p.cintura + 0.1, lado * (p.ancho / 2 + 0.04))
    grupo.add(espejo)
  }

  if (tipo === 'SUV' || tipo === 'PICKUP') {
    const moldura = new THREE.Shape()
    moldura.absarc(0, 0, radioArco - BISEL + 0.12, 0, Math.PI, false)
    moldura.absarc(0, 0, radioArco - BISEL + 0.01, Math.PI, 0, true)
    const geoMoldura = reg(new THREE.ExtrudeGeometry(moldura, { depth: 0.06, bevelEnabled: false, curveSegments: 24 }))
    for (const x of [p.ejeDelantero, p.ejeTrasero]) {
      for (const lado of [-1, 1]) {
        const m = new THREE.Mesh(geoMoldura, plastico)
        m.position.set(x, p.radioRueda, lado > 0 ? p.ancho / 2 - 0.03 : -p.ancho / 2 - 0.03)
        grupo.add(m)
      }
    }
  }

  const parrilla = new THREE.Mesh(reg(new RoundedBoxGeometry(0.05, 0.2, p.ancho * 0.46, 2, 0.02)), plastico)
  parrilla.position.set(F + BISEL - 0.02, p.piso + 0.26, 0)
  grupo.add(parrilla)

  // ---------------------------------------------------------------- ruedas
  const anchoCubierta = 0.27
  const geoCubierta = reg(new THREE.CylinderGeometry(p.radioRueda, p.radioRueda, anchoCubierta, 40))
  geoCubierta.rotateX(Math.PI / 2)
  const geoLlanta = reg(crearLlanta(p.radioRueda * 0.68))
  const geoMaza = reg(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 20))
  geoMaza.rotateX(Math.PI / 2)

  for (const x of [p.ejeDelantero, p.ejeTrasero]) {
    for (const lado of [-1, 1]) {
      const rueda = new THREE.Group()
      rueda.add(new THREE.Mesh(geoCubierta, goma))
      const aro = new THREE.Mesh(geoLlanta, llanta)
      aro.position.z = lado * (anchoCubierta / 2 - 0.01)
      if (lado < 0) aro.rotation.y = Math.PI
      rueda.add(aro)
      const maza = new THREE.Mesh(geoMaza, plastico)
      maza.position.z = lado * (anchoCubierta / 2 + 0.02)
      rueda.add(maza)
      rueda.position.set(x, p.radioRueda, lado * (p.ancho / 2 - 0.2))
      grupo.add(rueda)
    }
  }

  // ---------------------------------------------------------------- sombra de contacto
  const sombra = new THREE.Mesh(
    reg(new THREE.PlaneGeometry(p.largo * 1.35, p.ancho * 1.9)),
    mat(new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false })),
  )
  sombra.rotation.x = -Math.PI / 2
  sombra.position.y = 0.004
  grupo.add(sombra)

  grupo.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = false
  })

  return {
    grupo,
    pintura,
    largo: p.largo,
    altura: p.techo,
    liberar: () => {
      geometrias.forEach((g) => g.dispose())
      materiales.forEach((m) => {
        const conMapa = m as THREE.MeshBasicMaterial
        conMapa.map?.dispose()
        m.dispose()
      })
    },
  }
}

/**
 * Angosta la geometría en z a medida que sube: entre yDesde y yHasta el ancho se
 * reduce hasta (1 - factor). Con potencia 2 la curva es suave (hombros redondeados).
 */
function afinar(geo: THREE.BufferGeometry, yDesde: number, yHasta: number, factor: number, potencia: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(Math.max((pos.getY(i) - yDesde) / (yHasta - yDesde), 0), 1)
    pos.setZ(i, pos.getZ(i) * (1 - factor * Math.pow(t, potencia)))
  }
  pos.needsUpdate = true
}

/** Llanta de aleación de 5 rayos: un disco con 5 huecos, extruido. */
function crearLlanta(radio: number): THREE.ExtrudeGeometry {
  const disco = new THREE.Shape()
  disco.absarc(0, 0, radio, 0, Math.PI * 2, false)
  const rayos = 5
  const paso = (Math.PI * 2) / rayos
  const huecoAngulo = paso * 0.68
  for (let i = 0; i < rayos; i++) {
    const a0 = i * paso + (paso - huecoAngulo) / 2
    const a1 = a0 + huecoAngulo
    const hueco = new THREE.Path()
    hueco.absarc(0, 0, radio * 0.84, a0, a1, false)
    hueco.absarc(0, 0, radio * 0.34, a1, a0, true)
    disco.holes.push(hueco)
  }
  const geo = new THREE.ExtrudeGeometry(disco, {
    depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32,
  })
  return geo
}

/** Degradé radial oscuro para simular la sombra del auto sobre el piso. */
function texturaSombra(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
  g.addColorStop(0, 'rgba(10, 14, 20, 0.55)')
  g.addColorStop(0.55, 'rgba(10, 14, 20, 0.28)')
  g.addColorStop(1, 'rgba(10, 14, 20, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  return textura
}
