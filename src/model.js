import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { PRINT_ASPECT } from './tee'

// Drop a real 3D tee at public/models/tee.glb and the site uses it instead of
// the procedural one. Materials, colorway switching and prints are applied
// automatically. Tweak these if the model's orientation or print spots are off.
export const MODEL = {
  url: '/models/tee.glb',
  // radians; turn so the shirt's FRONT faces +Z (the camera). The Sketchfab tee
  // ships rotated ~29.5° with its front toward (-0.49, 0.87) in xz.
  rotationY: 0.515,
  height: 3.3, // scene units the model is scaled to
  front: { x: 0.04, y: 0.75, width: 0.5 }, // y = fraction of height from the hem
  back: { x: 0, y: 0.74, width: 1.62 },
  // CC BY 4.0 requires crediting the creator wherever the model is shown.
  credit: {
    title: 'T Shirt',
    author: 'funlab117',
    url: 'https://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
}

// True once we know public/models/tee.glb exists (dev servers answer missing
// files with the HTML page, so check the content type too).
let probe
export function useModelAvailable() {
  const [available, setAvailable] = useState(null)
  useEffect(() => {
    probe ||= fetch(MODEL.url, { method: 'HEAD' })
      .then((r) => r.ok && !(r.headers.get('content-type') || '').includes('html'))
      .catch(() => false)
    probe.then(setAvailable)
  }, [])
  return available
}

const V = THREE.Vector3

function toFloat(attr) {
  const n = attr.count, size = attr.itemSize
  const out = new Float32Array(n * size)
  for (let i = 0; i < n; i++) {
    out[i * size] = attr.getX(i)
    if (size > 1) out[i * size + 1] = attr.getY(i)
    if (size > 2) out[i * size + 2] = attr.getZ(i)
    if (size > 3) out[i * size + 3] = attr.getW(i)
  }
  return new THREE.Float32BufferAttribute(out, size)
}

// Keep only decal triangles whose normal points along `dir`.
function keepFacing(geo, dir, minDot = 0.3) {
  const pos = geo.attributes.position, nrm = geo.attributes.normal, uv = geo.attributes.uv
  const keep = { position: [], normal: [], uv: [] }
  const n = new V()
  for (let t = 0; t < pos.count; t += 3) {
    n.set(0, 0, 0)
    for (let k = 0; k < 3; k++) n.x += nrm.getX(t + k), n.y += nrm.getY(t + k), n.z += nrm.getZ(t + k)
    if (n.normalize().dot(dir) < minDot) continue
    for (let k = 0; k < 3; k++) {
      keep.position.push(pos.getX(t + k), pos.getY(t + k), pos.getZ(t + k))
      keep.normal.push(nrm.getX(t + k), nrm.getY(t + k), nrm.getZ(t + k))
      keep.uv.push(uv.getX(t + k), uv.getY(t + k))
    }
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(keep.position, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(keep.normal, 3))
  out.setAttribute('uv', new THREE.Float32BufferAttribute(keep.uv, 2))
  return out
}

// Flatten a loaded glTF scene into one normalised geometry plus print decals,
// in the same shape createTee() returns.
export function prepareModel(root) {
  root.updateMatrixWorld(true)
  const geos = []
  root.traverse((o) => {
    if (!o.isMesh) return
    const src = o.geometry
    const g = new THREE.BufferGeometry()
    // Compressed (meshopt/quantized) files store attributes as normalised
    // integers; unpack to floats so transforms and merging behave.
    for (const k of ['position', 'normal', 'uv']) if (src.attributes[k]) g.setAttribute(k, toFloat(src.attributes[k]))
    if (src.index) g.setIndex(Array.from(src.index.array))
    g.applyMatrix4(o.matrixWorld)
    if (!g.attributes.normal) g.computeVertexNormals()
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
    geos.push(g)
  })
  if (!geos.length) throw new Error('tee.glb contains no meshes')
  // mergeGeometries needs all-indexed or all-non-indexed
  if (!geos.every((g) => g.index)) geos.forEach((g, i) => g.index && (geos[i] = g.toNonIndexed()))

  const geo = mergeGeometries(geos)
  geo.rotateY(MODEL.rotationY)
  geo.computeBoundingBox()
  const size = geo.boundingBox.getSize(new V())
  const center = geo.boundingBox.getCenter(new V())
  const s = MODEL.height / size.y
  geo.translate(-center.x, -center.y, -center.z)
  geo.scale(s, s, s)
  geo.computeBoundingBox()
  // outer material uses vertex colours for baked occlusion; default to none
  geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3))

  const b = geo.boundingBox
  const H = b.max.y - b.min.y
  const D = b.max.z - b.min.z
  const projector = new THREE.Mesh(geo)
  const { front, back } = MODEL
  const frontPrint = new DecalGeometry(
    projector,
    new V(front.x, b.min.y + front.y * H, b.max.z - D * 0.2),
    new THREE.Euler(0, 0, 0),
    new V(front.width, front.width * PRINT_ASPECT.mark, D * 0.7),
  )
  const backPrint = new DecalGeometry(
    projector,
    new V(back.x, b.min.y + back.y * H, b.min.z + D * 0.2),
    new THREE.Euler(0, Math.PI, 0),
    new V(back.width, back.width * PRINT_ASPECT.wordmark, D * 0.7),
  )
  // doubleSided: real garment models carry their own inner fabric surface
  return {
    shell: [geo],
    bands: [],
    stitches: [],
    // drop print fragments landing on fabric that faces sideways/away (side seams, inner layer)
    frontPrint: keepFacing(frontPrint, new V(0, 0, 1)),
    backPrint: keepFacing(backPrint, new V(0, 0, -1)),
    // real garment models carry their own inner fabric surface
    doubleSided: true,
  }
}
