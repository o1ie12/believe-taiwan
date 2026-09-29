import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerspectiveCamera, useGLTF, useTexture, View } from '@react-three/drei'
import * as THREE from 'three'
import { createFabricTexture, createRibTexture, createTee } from './tee'
import { MODEL, prepareModel, useModelAvailable } from './model'
import { MOBILE_POSES, POSES, ui } from './poses'

const FABRIC_BLACK = new THREE.Color('#141415')
const FABRIC_WHITE = new THREE.Color('#f6f5f0')
const SHEEN_BLACK = new THREE.Color('#707074')
const SHEEN_WHITE = new THREE.Color('#ffffff')
const INK_WHITE = new THREE.Color('#f4f3ee')
const INK_BLACK = new THREE.Color('#0d0d0d')
const KEYS = Object.keys(POSES[Object.keys(POSES)[0]])

// Pointer in normalised (-1..1) and pixel coordinates, shared by every tee.
export const pointer = { x: 0, y: 0, px: -1e4, py: -1e4 }
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    pointer.px = e.clientX
    pointer.py = e.clientY
  })
}

const smooth = (t) => t * t * (3 - 2 * t)

// Blend the poses of the two sections whose centres straddle the viewport centre.
function readScrollPose(out, table = POSES) {
  const els = document.querySelectorAll('[data-pose]')
  if (!els.length) return Object.assign(out, table.hero)
  const mid = window.innerHeight / 2
  const d = Array.from(els, (el) => {
    const r = el.getBoundingClientRect()
    // data-anchor="start": the pose is reached when the section's top hits mid-screen
    return (el.dataset.anchor === 'start' ? r.top : r.top + r.height / 2) - mid
  })
  let i = 0
  while (i < d.length - 1 && d[i + 1] <= 0) i++
  const a = table[els[i].dataset.pose]
  const bEl = els[Math.min(i + 1, els.length - 1)]
  const b = table[bEl.dataset.pose]
  const span = d[i + 1] - d[i]
  const t = span > 0 ? smooth(THREE.MathUtils.clamp(-d[i] / span, 0, 1)) : 0
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t
  // Hover previews (product card colorway, drop chooser), weighted by how
  // close we are to the pose they belong to (full strength when parked on it).
  const h = ui.hover
  if (h) {
    const aOn = els[i].dataset.pose === h.pose
    const bOn = bEl !== els[i] && bEl.dataset.pose === h.pose
    const w = (aOn ? 1 - t : 0) + (bOn ? t : 0)
    for (const k in h.values) out[k] += (h.values[k] - out[k]) * w
  }
  return out
}

// ---- Shared tee building blocks (main scroll tee + shop gallery cards) ----

let proceduralCache
const preparedCache = new WeakMap()
const textureCache = new Map()
const cached = (key, make) => textureCache.get(key) || textureCache.set(key, make()).get(key)

function ProceduralTeeData({ render }) {
  const tee = useMemo(() => (proceduralCache ||= createTee()), [])
  return render(tee, 1.4)
}

function ModelTeeData({ render }) {
  const { scene } = useGLTF(MODEL.url)
  const tee = useMemo(() => {
    if (!preparedCache.has(scene)) preparedCache.set(scene, prepareModel(scene))
    return preparedCache.get(scene)
  }, [scene])
  // glTF UVs usually span 0–1 across the whole garment, so tile the knit finer
  return render(tee, 16)
}

// If tee.glb fails to load or parse, fall back to the procedural shirt.
class ModelBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn('[believe] tee.glb failed, using procedural tee:', err)
  }
  render() {
    return this.state.failed ? <ProceduralTeeData render={this.props.render} /> : this.props.children
  }
}

// Resolves the tee geometry (real model if present, else procedural) and
// hands it to `render(tee, fabricRepeat)`.
export function WithTee({ render }) {
  const hasModel = useModelAvailable()
  if (hasModel === null) return null
  return hasModel ? (
    <ModelBoundary render={render}>
      <ModelTeeData render={render} />
    </ModelBoundary>
  ) : (
    <ProceduralTeeData render={render} />
  )
}

function useTeeMaterials(tee, fabricRepeat) {
  const fabric = cached(`fabric:${fabricRepeat}`, () => createFabricTexture(fabricRepeat))
  const rib = cached('rib', () => createRibTexture())
  const [frontTex, backTex] = useTexture(['/brand/mark.png', '/brand/wordmark.png'], (texs) =>
    texs.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
    }),
  )
  return useMemo(() => {
    const ink = (map) =>
      new THREE.MeshStandardMaterial({
        map,
        color: INK_WHITE.clone(),
        transparent: true,
        roughness: 0.85,
        metalness: 0,
        envMapIntensity: 0.4,
        bumpMap: fabric,
        bumpScale: 0.4,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      })
    return {
      outer: new THREE.MeshPhysicalMaterial({
        color: FABRIC_BLACK.clone(),
        vertexColors: true,
        roughness: 0.92,
        sheen: 1,
        sheenRoughness: 0.65,
        sheenColor: SHEEN_BLACK.clone(),
        bumpMap: fabric,
        bumpScale: 0.8,
        side: tee.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      }),
      band: new THREE.MeshPhysicalMaterial({
        color: FABRIC_BLACK.clone(),
        roughness: 0.9,
        sheen: 1,
        sheenRoughness: 0.6,
        sheenColor: SHEEN_BLACK.clone(),
        bumpMap: rib,
        bumpScale: 1.5,
      }),
      // the inside of the shirt, seen through the neck, hem and cuffs
      inner: new THREE.MeshStandardMaterial({ color: FABRIC_BLACK.clone(), roughness: 1, side: THREE.BackSide }),
      front: ink(frontTex),
      back: ink(backTex),
    }
  }, [fabric, rib, frontTex, backTex, tee.doubleSided])
}

// white: 0 = black tee / white print, 1 = white tee / black print. ink: print opacity.
function applyLook(m, white, ink) {
  m.outer.color.lerpColors(FABRIC_BLACK, FABRIC_WHITE, white)
  m.outer.sheenColor.lerpColors(SHEEN_BLACK, SHEEN_WHITE, white)
  m.band.color.copy(m.outer.color)
  m.band.sheenColor.copy(m.outer.sheenColor)
  m.inner.color.copy(m.outer.color).multiplyScalar(0.4)
  m.front.color.lerpColors(INK_WHITE, INK_BLACK, white)
  m.back.color.copy(m.front.color)
  m.front.opacity = m.back.opacity = ink
  m.front.visible = m.back.visible = ink > 0.01
}

function TeeMeshes({ tee, m }) {
  return (
    <>
      {tee.shell.map((geo, i) => (
        <group key={i}>
          <mesh geometry={geo} material={m.outer} />
          {!tee.doubleSided && <mesh geometry={geo} material={m.inner} />}
        </group>
      ))}
      {tee.bands.map((geo, i) => (
        <mesh key={i} geometry={geo} material={m.band} />
      ))}
      {tee.stitches.map((geo, i) => (
        <mesh key={`s${i}`} geometry={geo} material={m.band} />
      ))}
      <mesh geometry={tee.frontPrint} material={m.front} />
      <mesh geometry={tee.backPrint} material={m.back} />
    </>
  )
}

function Tee({ tee, fabricRepeat }) {
  const group = useRef()
  const { size } = useThree()

  const m = useTeeMaterials(tee, fabricRepeat)

  // Start below and turned away so the tee "arrives" on load.
  const cur = useRef({ rotY: -Math.PI * 1.2, rotX: 0.5, x: 0, y: -4.5, scale: 0.7, white: 0, hud: 0, ink: 1 })
  const target = useRef({})
  const hud = useRef(null)
  const nameEl = useRef(null)
  const rotEl = useRef(null)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const pxPerUnit = size.height / (2 * 12 * Math.tan((15 * Math.PI) / 180))
    const phone = size.width < 820
    if (phone) {
      // phone poses with `track` ride along with an element (e.g. the gap above cards)
      for (const pose of Object.values(MOBILE_POSES)) {
        if (!pose.track) continue
        const el = document.querySelector(pose.track)
        if (!el) continue
        const r = el.getBoundingClientRect()
        pose.y = (size.height / 2 - (r.top + r.height / 2)) / pxPerUnit
      }
    }
    const t = readScrollPose(target.current, phone ? MOBILE_POSES : POSES)
    const c = cur.current
    const mobile = size.width < 820
    const aspect = size.width / size.height
    const xScale = mobile ? 0 : THREE.MathUtils.clamp(aspect / 1.78, 0.6, 1.2)
    const sScale = mobile ? 0.72 : 1

    for (const k of KEYS) c[k] = THREE.MathUtils.damp(c[k], t[k], 3.2, dt)

    const g = group.current
    const time = state.clock.elapsedTime
    g.position.set(c.x * xScale, c.y + Math.sin(time * 0.9) * 0.06, 0)
    g.scale.setScalar(c.scale * sScale)
    g.rotation.set(c.rotX + pointer.y * 0.08, c.rotY + pointer.x * 0.22, Math.sin(time * 0.6) * 0.015)

    // Scope ring overlay (DOM) tracks the tee's screen position and size.
    const ring = hud.current || (hud.current = document.querySelector('.hud-ring'))
    if (ring) {
      const v = tmp.copy(g.position).project(state.camera)
      ring.style.setProperty('--x', `${(((v.x + 1) / 2) * size.width).toFixed(1)}px`)
      ring.style.setProperty('--y', `${(((1 - v.y) / 2) * size.height).toFixed(1)}px`)
      ring.style.setProperty('--d', `${(4.1 * c.scale * sScale * pxPerUnit).toFixed(1)}px`)
      ring.style.setProperty('--o', c.hud.toFixed(3))
      const name = nameEl.current?.isConnected ? nameEl.current : (nameEl.current = document.getElementById('hud-name'))
      const label = c.ink > 0.5 ? '[ BELIEVE 01 ]' : '[ BELIEVE 02 ]'
      if (name && name.textContent !== label) name.textContent = label
      const rot = rotEl.current || (rotEl.current = document.getElementById('hud-rot'))
      if (rot) {
        const deg = Math.round((((c.rotY + pointer.x * 0.22) * 180) / Math.PI) % 360 + 360) % 360
        rot.textContent = String(deg).padStart(3, '0')
      }
    }

    // colorway + prints (prints fade out for the BELIEVE 02 silhouette)
    applyLook(m, c.white, c.ink)
  })

  return (
    <group ref={group}>
      <TeeMeshes tee={tee} m={m} />
    </group>
  )
}

const TAU = Math.PI * 2

// Card tee: spins slowly; while the pointer is over its card it turns to face it.
function CardTee({ tee, fabricRepeat, white, ink, trackRef, offset }) {
  const g = useRef()
  const m = useTeeMaterials(tee, fabricRepeat)
  const st = useRef({ ang: offset, tilt: 0.04 })
  useEffect(() => applyLook(m, white, ink), [m, white, ink])
  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const el = trackRef.current
    if (!el || !g.current) return
    const r = el.getBoundingClientRect()
    const lx = ((pointer.px - r.left) / r.width) * 2 - 1
    const ly = ((pointer.py - r.top) / r.height) * 2 - 1
    const s = st.current
    if (Math.abs(lx) < 1 && Math.abs(ly) < 1) {
      // face the cursor, taking the shortest way round from the current spin
      const base = lx * 0.8
      const want = base + Math.round((s.ang - base) / TAU) * TAU
      s.ang = THREE.MathUtils.damp(s.ang, want, 5, dt)
      s.tilt = THREE.MathUtils.damp(s.tilt, ly * 0.3, 5, dt)
    } else {
      s.ang += dt * 0.45
      s.tilt = THREE.MathUtils.damp(s.tilt, 0.04, 3, dt)
    }
    g.current.rotation.set(s.tilt, s.ang, 0)
    g.current.position.y = Math.sin(state.clock.elapsedTime * 0.9 + offset) * 0.05 - 0.05
  })
  return (
    <group ref={g}>
      <TeeMeshes tee={tee} m={m} />
    </group>
  )
}

export function CardScene({ white, ink, trackRef, offset = 0 }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 9.5]} fov={30} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 6, 7]} intensity={3} />
      <directionalLight position={[6, 3, -5]} intensity={4} color="#e6ecff" />
      <directionalLight position={[-6, 1, -4]} intensity={2.5} />
      <Studio resolution={128} />
      <Suspense fallback={null}>
        <WithTee
          render={(tee, rep) => (
            <CardTee tee={tee} fabricRepeat={rep} white={white} ink={ink} trackRef={trackRef} offset={offset} />
          )}
        />
      </Suspense>
    </>
  )
}

// drei <View> (shop gallery cards) leaves the renderer's viewport on the last
// card it drew, so after visiting /shop the main tee would render into that
// small rectangle. Reset to the full canvas at the start of every frame.
function FullViewport() {
  useFrame(({ gl, size }) => {
    gl.setViewport(0, 0, size.width, size.height)
    gl.setScissor(0, 0, size.width, size.height)
    gl.setScissorTest(false)
  })
  return null
}

function Studio({ resolution = 256 }) {
  return (
    <Environment resolution={resolution}>
      <Lightformer form="rect" intensity={3} position={[0, 4, 6]} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
      <Lightformer form="rect" intensity={4} position={[6, 2, -4]} rotation-y={-Math.PI / 2} scale={[4, 6, 1]} />
      <Lightformer form="ring" intensity={1.5} position={[0, -3, 4]} scale={3} />
    </Environment>
  )
}

export default function Scene() {
  return (
    <div className="scene">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 12], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <FullViewport />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-4, 6, 7]} intensity={3} />
        <directionalLight position={[6, 3, -5]} intensity={4} color="#e6ecff" />
        <directionalLight position={[-6, 1, -4]} intensity={2.5} />
        <directionalLight position={[4, -3, 4]} intensity={0.5} />
        <Studio />
        <Suspense fallback={null}>
          <WithTee render={(tee, rep) => <Tee tee={tee} fabricRepeat={rep} />} />
        </Suspense>
        {/* shop gallery cards render their own tees into this canvas */}
        <View.Port />
      </Canvas>
    </div>
  )
}
