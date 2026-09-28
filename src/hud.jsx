import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { scroll } from './scroll'
import { Link, useRouter } from './router'
import { DROPS, SECTIONS_01 } from './drops'

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))

export function Wordmark({ className = '' }) {
  return <img className={`wordmark ${className}`} src="/brand/wordmark.png" alt="BELIEVE" />
}

// Full-screen intro that counts up while the 3D assets load.
export function Loader() {
  const { progress } = useProgress()
  const target = useRef(0)
  target.current = progress
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState('loading') // loading → leaving → gone

  useEffect(() => {
    scroll.lenis?.stop()
    const start = performance.now()
    let shown = 0
    let prev = start
    let raf
    const tick = () => {
      const now = performance.now()
      const t = now - start
      const dt = Math.min((now - prev) / 1000, 0.1)
      prev = now
      const loaded = target.current >= 100 || t > 6000
      // creep forward even if nothing reports progress, but only finish once loaded
      const goal = loaded ? 100 : Math.max(Math.min(target.current, 99), Math.min(88, t / 22))
      shown += (goal - shown) * (1 - Math.exp(-dt * 7))
      if (loaded && shown > 98.5) shown = 100
      setCount(Math.floor(shown))
      if (shown >= 100 && t > 1400) {
        setPhase('leaving')
        document.documentElement.classList.add('loaded')
        scroll.lenis?.start()
        setTimeout(() => setPhase('gone'), 1300)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (phase === 'gone') return null
  return (
    <div className={`loader ${phase}`} aria-hidden="true">
      <span className="loader-corner tl mono">[ BELIEVE ]</span>
      <span className="loader-corner tr mono">[ MARK 9:23 ]</span>
      <span className="loader-corner bl mono">25.0330° N — 121.5654° E</span>
      <span className="loader-corner br mono">[ LOADING ]</span>
      <div className="loader-center">
        <span className="loader-count">{String(count).padStart(3, '0')}</span>
        <span className="loader-line"><i style={{ transform: `scaleX(${count / 100})` }} /></span>
      </div>
    </div>
  )
}

function Menu({ onClose }) {
  const { path, navigate } = useRouter()
  useEffect(() => {
    scroll.lenis?.stop()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      scroll.lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const go = (e, to) => {
    e.preventDefault()
    onClose()
    // wait a frame so smooth scrolling is running again before we move
    requestAnimationFrame(() => navigate(to))
  }
  const items = [{ path: '/', name: 'Home' }, ...DROPS]

  return (
    <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="menu-head">
        <span className="mono">[ INDEX ]</span>
        <button className="chip" onClick={onClose}>Close</button>
      </div>
      <nav className="menu-list">
        {items.map((d, i) => (
          <div key={d.path} className={`menu-item ${path === d.path ? 'is-here' : ''}`} style={{ '--i': i }}>
            <a href={d.path} onClick={(e) => go(e, d.path)}>
              <span className="mono">{String(i).padStart(2, '0')}</span>
              {d.name}
              {d.soon && <span className="mono menu-tag">Soon</span>}
            </a>
            {d.path === '/believe-01' && (
              <div className="menu-sub">
                {SECTIONS_01.map(([id, label]) => (
                  <a key={id} href={`/believe-01#${id}`} onClick={(e) => go(e, `/believe-01#${id}`)}>{label}</a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <p className="menu-foot mono">BELIEVE — Everything is possible for one who believes — Mark 9:23</p>
    </div>
  )
}

// What the info bar says on each page.
const BAR = {
  '/': ['BELIEVE — Taiwan', 'BELIEVE 01 · BELIEVE 02 soon'],
  '/believe-01': ['BELIEVE 01 — Limited tee', '40 pieces · Black / White'],
  '/believe-02': ['BELIEVE 02 — Coming soon', 'Reveal on Instagram'],
}

// Thin technical info bar across the top, with a live Taipei clock.
export function InfoBar() {
  const { path } = useRouter()
  const [a, b] = BAR[path] || BAR['/']
  const [time, setTime] = useState('')
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <header className="bar">
        <Link to="/" className="bar-logo" aria-label="BELIEVE — home">
          <img src="/brand/wordmark.png" alt="" />
        </Link>
        <span className="bar-item bar-dot">{a}</span>
        <span className="bar-item">{b}</span>
        <span className="bar-item mono">TPE {time}</span>
        <div className="bar-actions">
          <Link to="/believe-01#shop" className="chip">Shop</Link>
          <button className="chip" onClick={() => setOpen(true)} aria-haspopup="dialog">Menu</button>
        </div>
      </header>
      {open && <Menu onClose={() => setOpen(false)} />}
    </>
  )
}

// Fixed crosshair + an orbit ring that the 3D scene positions around the tee.
export function Scope() {
  return (
    <div className="scope" aria-hidden="true">
      <span className="scope-v" />
      <span className="scope-h" />
      <div className="hud-ring">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="49.6" className="ring-outer" />
          <circle cx="50" cy="50" r="44" className="ring-dash" />
          <path d="M50 0.4v4 M50 95.6v4 M0.4 50h4 M95.6 50h4" className="ring-ticks" />
        </svg>
        <span className="hud-label hud-top mono" id="hud-name">[ BELIEVE 01 ]</span>
        <span className="hud-label hud-bottom mono">ROT <b id="hud-rot">000</b>°</span>
      </div>
    </div>
  )
}

// Giant light section title with a numbered badge; rises in on reveal.
export function SectionTitle({ n, children }) {
  return (
    <div className="stitle reveal-title">
      <h2>{children}</h2>
      <span className="stitle-n mono">{n}</span>
    </div>
  )
}

// Large statement whose letters brighten from dim to white as it scrolls by.
export function FillStatement({ lines }) {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    const chars = [...el.querySelectorAll('.fc')]
    let raf
    let last = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      if (r.bottom < 0 || r.top > vh) return
      const p = clamp((vh * 0.85 - r.top) / (r.height * 0.9 + vh * 0.25), 0, 1)
      if (Math.abs(p - last) < 0.0005) return
      last = p
      const n = chars.length
      chars.forEach((c, i) => {
        c.style.opacity = (0.14 + 0.86 * clamp(p * n * 1.04 - i, 0, 1)).toFixed(3)
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <p className="statement-text" ref={ref} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span className="sl" key={li} aria-hidden="true">
          {[...line].map((ch, i) => (
            <span className="fc" key={i}>{ch}</span>
          ))}
        </span>
      ))}
    </p>
  )
}

const STATS = [
  ['40', 'Pieces total'],
  ['NT$700', 'One price'],
  ['S — L', 'Three sizes'],
  ['2', 'Colorways'],
]

// Pinned section: stats light up one at a time while the tee turns to a new
// angle for each (via the stat0–stat3 pose anchors).
export function DropStats() {
  const ref = useRef()
  useEffect(() => {
    const el = ref.current
    const cells = [...el.querySelectorAll('.stat')]
    let raf
    let last = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      if (r.bottom < 0 || r.top > vh) return
      const p = clamp(-r.top / (r.height - vh), 0, 1)
      el.style.setProperty('--p', p.toFixed(4))
      const idx = Math.round(p * (cells.length - 1))
      if (idx === last) return
      last = idx
      cells.forEach((c, i) => (i === idx ? c.setAttribute('data-on', '') : c.removeAttribute('data-on')))
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section id="details" className="drop" ref={ref}>
      {STATS.map((_, k) => (
        <span
          key={k}
          className="drop-anchor"
          data-pose={`stat${k}`}
          style={{ top: `calc(50vh + ${k} * (100% - 100vh) / ${STATS.length - 1})` }}
        />
      ))}
      <div className="drop-sticky">
        <SectionTitle n="04">The Drop</SectionTitle>
        <p className="drop-note lead reveal">
          Forty pieces.{' '}
          <span className="dim">In Scripture, forty marks a season of testing before a promise — forty days of rain, forty years in the desert, forty days in the wilderness.</span>
        </p>
        <div className="drop-stats">
          <span className="drop-progress"><i /></span>
          {STATS.map(([v, l]) => (
            <div className="stat" key={l}>
              <strong>{v}</strong>
              <span className="mono">[ {l} ]</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
