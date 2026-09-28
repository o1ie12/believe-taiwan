import { Component, Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei'
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

const pointer = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
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

function ProceduralTee() {
  const tee = useMemo(() => createTee(), [])
  return <Tee tee={tee} fabricRepeat={1.4} />
}

function ModelTee() {
  const { scene } = useGLTF(MODEL.url)
  const tee = useMemo(() => prepareModel(scene), [scene])
  // glTF UVs usually span 0–1 across the whole garment, so tile the knit finer
  return <Tee tee={tee} fabricRepeat={16} />
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
    return this.state.failed ? <ProceduralTee /> : this.props.children
  }
}

function Tee({ tee, fabricRepeat }) {
  const group = useRef()
  const { size } = useThree()

  const fabric = useMemo(() => createFabricTexture(fabricRepeat), [fabricRepeat])
  const rib = useMemo(() => createRibTexture(), [])
  const [frontTex, backTex] = useTexture(['/brand/mark.png', '/brand/wordmark.png'], (texs) =>
    texs.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
    }),
  )

  const outerMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
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
    [fabric, tee.doubleSided],
  )
  const bandMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: FABRIC_BLACK.clone(),
        roughness: 0.9,
        sheen: 1,
        sheenRoughness: 0.6,
        sheenColor: SHEEN_BLACK.clone(),
        bumpMap: rib,
        bumpScale: 1.5,
      }),
    [rib],
  )
  // The inside of the shirt, seen through the neck, hem and cuffs.
  const innerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FABRIC_BLACK.clone(), roughness: 1, side: THREE.BackSide }),
    [],
  )
  const inkMat = (map) =>
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
  const frontMat = useMemo(() => inkMat(frontTex), [frontTex])
  const backMat = useMemo(() => inkMat(backTex), [backTex])

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

    outerMat.color.lerpColors(FABRIC_BLACK, FABRIC_WHITE, c.white)
    outerMat.sheenColor.lerpColors(SHEEN_BLACK, SHEEN_WHITE, c.white)
    bandMat.color.copy(outerMat.color)
    bandMat.sheenColor.copy(outerMat.sheenColor)
    innerMat.color.copy(outerMat.color).multiplyScalar(0.4)
    frontMat.color.lerpColors(INK_WHITE, INK_BLACK, c.white)
    backMat.color.copy(frontMat.color)
    // prints fade out for the BELIEVE 02 silhouette
    frontMat.opacity = backMat.opacity = c.ink
    frontMat.visible = backMat.visible = c.ink > 0.01
  })

  return (
    <group ref={group}>
      {tee.shell.map((geo, i) => (
        <group key={i}>
          <mesh geometry={geo} material={outerMat} />
          {!tee.doubleSided && <mesh geometry={geo} material={innerMat} />}
        </group>
      ))}
      {tee.bands.map((geo, i) => (
        <mesh key={i} geometry={geo} material={bandMat} />
      ))}
      {tee.stitches.map((geo, i) => (
        <mesh key={`s${i}`} geometry={geo} material={bandMat} />
      ))}
      <mesh geometry={tee.frontPrint} material={frontMat} />
      <mesh geometry={tee.backPrint} material={backMat} />
    </group>
  )
}

function Studio() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={3} position={[0, 4, 6]} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
      <Lightformer form="rect" intensity={4} position={[6, 2, -4]} rotation-y={-Math.PI / 2} scale={[4, 6, 1]} />
      <Lightformer form="ring" intensity={1.5} position={[0, -3, 4]} scale={3} />
    </Environment>
  )
}

export default function Scene() {
  const hasModel = useModelAvailable()
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
        <ambientLight intensity={0.35} />
        <directionalLight position={[-4, 6, 7]} intensity={3} />
        <directionalLight position={[6, 3, -5]} intensity={4} color="#e6ecff" />
        <directionalLight position={[-6, 1, -4]} intensity={2.5} />
        <directionalLight position={[4, -3, 4]} intensity={0.5} />
        <Studio />
        <Suspense fallback={null}>
          {hasModel === true && (
            <ModelBoundary>
              <ModelTee />
            </ModelBoundary>
          )}
          {hasModel === false && <ProceduralTee />}
        </Suspense>
      </Canvas>
    </div>
  )
}
