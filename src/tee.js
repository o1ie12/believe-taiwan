import * as THREE from 'three'

import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js'

// ---------------------------------------------------------------------------
// Volumetric "ghost mannequin" tee, built procedurally:
//  - body: a lofted tube whose cross-section morphs from a boxy superellipse
//    at the hem to a round neck opening, with a scooped front neckline
//  - sleeves: tapered, flattened tubes angled down from the shoulders
//  - rib bands for collar, hem and cuffs
//  - low-frequency noise + drape/pull folds so it reads as fabric
// ---------------------------------------------------------------------------

const V = THREE.Vector3
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

function hash(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return h - Math.floor(h)
}
function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = x - xi, yf = y - yi, zf = z - zi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf)
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz)
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  )
}
const fbm = (x, y, z) =>
  noise(x, y, z) * 0.55 + noise(x * 2.03 + 5.1, y * 2.03, z * 2.03) * 0.3 + noise(x * 4.1, y * 4.1 + 3.3, z * 4.1) * 0.15 - 0.5

const ROWS = 120
const COLS = 160
const NECK_Y = 1.58
const SHOULDER_Y = 1.08

// Half-width of the body as you travel up from hem to neck (arc-length sampled).
function bodyProfile() {
  const p = new THREE.Path()
  p.moveTo(0.94, -1.72)
  p.lineTo(0.97, 0.3)
  p.lineTo(0.98, 1.06)
  p.quadraticCurveTo(1.0, 1.34, 0.78, 1.43)
  p.lineTo(0.44, NECK_Y)
  return p.getSpacedPoints(ROWS - 1)
}

function gridIndex(rows, cols, flip) {
  const idx = []
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * cols + j
      const b = (i + 1) * cols + j
      const c = i * cols + ((j + 1) % cols)
      const d = (i + 1) * cols + ((j + 1) % cols)
      if (flip) idx.push(a, c, b, c, d, b)
      else idx.push(a, b, c, b, d, c)
    }
  }
  return idx
}

function finish(pos, uv, ao, index) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new THREE.Float32BufferAttribute(ao.flatMap((a) => [a, a, a]), 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

function buildBody() {
  const prof = bodyProfile()
  const pos = [], uv = [], ao = []
  const rings = []
  prof.forEach((pt, i) => {
    const frac = i / (ROWS - 1)
    const a = pt.x
    const t = clamp((0.98 - a) / (0.98 - 0.44), 0, 1)
    const chest = 0.5 + 0.09 * Math.exp(-(((pt.y - 0.6) / 0.8) ** 2))
    const b = lerp(chest, 0.35, Math.pow(t, 0.9))
    const n = lerp(2.35, 2.0, t)
    const ring = []
    for (let j = 0; j < COLS; j++) {
      const th = (j / COLS) * Math.PI * 2
      const c = Math.cos(th), s = Math.sin(th)
      let x = a * Math.sign(c) * Math.abs(c) ** (2 / n)
      let z = b * Math.sign(s) * Math.abs(s) ** (2 / n)
      // the chest pushes the front panel forward
      z += Math.max(0, s) ** 2 * 0.05 * Math.exp(-(((pt.y - 0.75) / 0.45) ** 2)) * (1 - t)
      // scoop the neckline: compress the upper rows more at the front
      const yTop = NECK_Y - 0.25 * Math.max(0, s) ** 2.2 - 0.05 * Math.max(0, -s) ** 2
      let y = pt.y > SHOULDER_Y ? SHOULDER_Y + ((pt.y - SHOULDER_Y) * (yTop - SHOULDER_Y)) / (NECK_Y - SHOULDER_Y) : pt.y

      // displacement along the outward normal of the cross-section
      const nrm = new V(x / (a * a), 0, z / (b * b)).normalize()
      const fade = smoothstep(0, 0.05, frac) * smoothstep(1, 0.9, frac)
      let d = fbm(x * 1.2, y * 1.2, z * 1.2) * 0.035
      d += Math.sin(th * 6 + fbm(x * 0.7, y * 0.35, z * 0.7) * 7) * 0.009 * smoothstep(0.5, -1.5, y)
      let occl = 1
      for (const sx of [-1, 1]) {
        const dx = x - sx * 0.95, dy = y - 0.3
        const r = Math.hypot(dx, dy)
        const ang = Math.atan2(dy, dx * sx)
        d += Math.sin(ang * 9) * 0.01 * Math.exp(-r * 2.6) * Math.abs(s)
        occl -= 0.35 * Math.exp(-(r * r) * 9)
      }
      d *= fade
      x += nrm.x * d
      z += nrm.z * d
      pos.push(x, y, z)
      uv.push((j / COLS) * 5.2, y)
      ao.push(clamp(occl + d * 3, 0.45, 1))
      ring.push(new V(x, y, z))
    }
    rings.push(ring)
  })
  return { geo: finish(pos, uv, ao, gridIndex(ROWS, COLS, false)), rings }
}

function buildSleeve(side) {
  const S = 60, T = 72
  const alpha = -0.9
  const dir = new V(side * Math.cos(alpha), Math.sin(alpha), 0)
  const up = new V(-side * Math.sin(alpha), Math.cos(alpha), 0)
  const fwd = new V(0, 0, 1)
  const root = new V(side * 0.76, 1.0, 0)
  const L = 1.0
  const pos = [], uv = [], ao = []
  const rings = []
  for (let i = 0; i < S; i++) {
    const s = i / (S - 1)
    const C = root.clone().addScaledVector(dir, s * L)
    const band = 1 + 0.035 * smoothstep(0.9, 0.93, s)
    const ru = lerp(0.4, 0.32, s) * band
    const rw = lerp(0.3, 0.26, s) * band
    const ring = []
    for (let j = 0; j < T; j++) {
      const th = (j / T) * Math.PI * 2
      const c = Math.cos(th), sn = Math.sin(th)
      const p = C.clone().addScaledVector(up, ru * c).addScaledVector(fwd, rw * sn)
      const nrm = up.clone().multiplyScalar(c / ru).addScaledVector(fwd, sn / rw).normalize()
      const fade = smoothstep(1, 0.94, s)
      let d = fbm(p.x * 1.3, p.y * 1.3, p.z * 1.3) * 0.03
      d += Math.sin(s * 16 + c * 2.2 + fbm(p.x, p.y, p.z) * 4) * 0.01 * (1 - s) ** 1.5
      // fabric sags on the underside
      p.addScaledVector(up, -0.03 * Math.max(0, -c) * s)
      p.addScaledVector(nrm, d * fade)
      pos.push(p.x, p.y, p.z)
      uv.push((j / T) * 1.8, s * L)
      ao.push(clamp(1 - 0.4 * smoothstep(0.35, 0, s) * Math.max(0, -c) + d * 3, 0.45, 1))
      ring.push(p)
    }
    rings.push(ring)
  }
  return { geo: finish(pos, uv, ao, gridIndex(S, T, side > 0)), rings }
}

function ringTube(points, radius, segs = 240) {
  const curve = new THREE.CatmullRomCurve3(points, true)
  return new THREE.TubeGeometry(curve, segs, radius, 10, true)
}

// Walk inward from an edge ring until the fabric is `dist` away from it.
function ringAt(rings, fromEnd, dist) {
  const n = rings.length
  const edge = fromEnd ? rings[n - 1] : rings[0]
  const probe = Math.floor(edge.length / 4)
  for (let k = 1; k < n; k++) {
    const r = fromEnd ? rings[n - 1 - k] : rings[k]
    if (r[probe].distanceTo(edge[probe]) >= dist) return r
  }
  return rings[fromEnd ? 0 : n - 1]
}

// Lift a ring off the surface along the outward direction from `center`.
const lift = (ring, amount, center) =>
  ring.map((p) => {
    const c = center(p)
    return p.clone().add(p.clone().sub(c).normalize().multiplyScalar(amount))
  })

// A flat rib band laid over the fabric between two rings.
function bandStrip(lower, upper, center, height = 0.012) {
  const ROWS_B = 6
  const cols = upper.length
  const pos = [], uv = []
  for (let i = 0; i < ROWS_B; i++) {
    const t = i / (ROWS_B - 1)
    const off = height + 0.006 * Math.sin(Math.PI * t)
    for (let j = 0; j < cols; j++) {
      const p = lower[j].clone().lerp(upper[j], t)
      const c = center(p)
      p.add(p.clone().sub(c).normalize().multiplyScalar(off))
      pos.push(p.x, p.y, p.z)
      uv.push(j / cols, t)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(gridIndex(ROWS_B, cols, false))
  g.computeVertexNormals()
  return g
}

// height / width of the print artwork files
export const PRINT_ASPECT = { mark: 835 / 1159, wordmark: 493 / 1638 }

export function createTee() {
  const body = buildBody()
  const right = buildSleeve(1)
  const left = buildSleeve(-1)

  const bodyCenter = (p) => new V(0, p.y, 0)
  const sleeveCenter = (side) => (p) => {
    // nearest point on the sleeve axis
    const alpha = -0.9
    const root = new V(side * 0.76, 1.0, 0)
    const dir = new V(side * Math.cos(alpha), Math.sin(alpha), 0)
    return root.clone().addScaledVector(dir, p.clone().sub(root).dot(dir))
  }

  const neck = body.rings[ROWS - 1]
  const neckLow = ringAt(body.rings, true, 0.1)
  const hem = body.rings[0]
  const hemStitch = ringAt(body.rings, false, 0.075)

  const bands = [
    bandStrip(neckLow, neck, bodyCenter),
    ringTube(lift(neck, 0.012, bodyCenter), 0.024),
    ringTube(lift(hem, 0.004, bodyCenter), 0.016),
  ]
  const stitches = [
    ringTube(lift(neckLow, 0.02, bodyCenter), 0.0045),
    ringTube(lift(hemStitch, 0.006, bodyCenter), 0.0045),
  ]
  for (const [sl, side] of [[right, 1], [left, -1]]) {
    const center = sleeveCenter(side)
    const cuff = sl.rings[sl.rings.length - 1]
    bands.push(ringTube(lift(cuff, 0.004, center), 0.016, 120))
    stitches.push(ringTube(lift(ringAt(sl.rings, true, 0.07), 0.006, center), 0.0045, 120))
  }

  const projector = new THREE.Mesh(body.geo)
  // Sized to the artwork's aspect ratio (public/brand/mark.png, wordmark.png).
  const MARK_W = 0.62, WORD_W = 1.72
  const frontPrint = new DecalGeometry(projector, new V(0.1, 0.86, 0.6), new THREE.Euler(0, 0, 0), new V(MARK_W, MARK_W * PRINT_ASPECT.mark, 0.9))
  const backPrint = new DecalGeometry(projector, new V(0, 0.8, -0.6), new THREE.Euler(0, Math.PI, 0), new V(WORD_W, WORD_W * PRINT_ASPECT.wordmark, 0.9))

  return {
    shell: [body.geo, right.geo, left.geo],
    bands,
    stitches,
    frontPrint,
    backPrint,
  }
}

// Vertical rib knit for the collar/hem/cuff bands.
export function createRibTexture() {
  const c = document.createElement('canvas')
  c.width = 64; c.height = 8
  const ctx = c.getContext('2d')
  for (let x = 0; x < 64; x++) {
    const v = 128 + Math.sin((x / 64) * Math.PI * 2) * 110
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(x, 0, 1, 8)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(160, 1)
  return tex
}

// Fine knit noise used as a bump map so the surface reads as cotton.
export function createFabricTexture(repeat = 1.4) {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const knit = Math.sin(x * 1.6) * 0.5 + Math.sin(y * 0.8 + Math.sin(x * 0.4)) * 0.5
      const v = 128 + knit * 26 + (Math.random() - 0.5) * 60
      const i = (y * size + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  return tex
}
