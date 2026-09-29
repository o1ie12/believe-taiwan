import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { scroll } from './scroll'
import { PRICE } from './shop'

const HERO = { src: '/lookbook/taipei-101.jpg', alt: 'Back view of the white BELIEVE 01 tee overlooking Taipei 101' }

const PHOTOS = [
  { src: '/lookbook/pillar-duo.jpg', w: 1122, h: 1402, title: 'Side by side', note: 'Black and white' },
  { src: '/lookbook/print-detail.jpg', w: 1350, h: 1800, title: 'Both prints', note: 'B★ front, BELIEVE back' },
  { src: '/lookbook/car-window-white.jpg', w: 1448, h: 1086, title: 'Window seat', note: 'White · back print' },
  { src: '/lookbook/garage-walk.jpg', w: 1086, h: 1448, title: 'Underground', note: 'Black · chest mark' },
  { src: '/lookbook/flatlay.jpg', w: 1186, h: 1166, title: 'Laid out', note: 'BELIEVE 01 in both colorways' },
  { src: '/lookbook/car-black.jpg', w: 1088, h: 1448, title: 'Through the glass', note: 'Black · back print' },
]

// The horizontal track, left to right. Photos: `h` = height and `top` = offset
// from the top, both in vh, so the collage staggers like a contact sheet.
const TRACK = [
  { type: 'intro' },
  { type: 'photo', i: 0, h: 62, top: 16 },
  { type: 'photo', i: 1, h: 44, top: 42 },
  { type: 'photo', i: 2, h: 42, top: 20 },
  { type: 'photo', i: 3, h: 56, top: 32 },
  { type: 'photo', i: 4, h: 40, top: 14 },
  { type: 'photo', i: 5, h: 60, top: 22 },
  { type: 'end' },
]


const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const lerp = (a, b, t) => a + (b - a) * t
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const EASE = 'cubic-bezier(.7,0,.2,1)'

// Largest box with the photo's aspect ratio that fits the viewport.
function fitRect(p) {
  const vw = window.innerWidth, vh = window.innerHeight
  const maxW = vw * 0.9, maxH = vh * 0.82
  const s = Math.min(maxW / p.w, maxH / p.h)
  const w = p.w * s, h = p.h * s
  return { left: (vw - w) / 2, top: (vh - h) / 2 - vh * 0.02, width: w, height: h }
}
const px = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })

function Lightbox({ index, originEl, onIndex, onClose }) {
  const box = useRef()
  const shade = useRef()
  const [closing, setClosing] = useState(false)
  const photo = PHOTOS[index]

  // Expand from the grid tile to the fitted rect.
  useLayoutEffect(() => {
    const from = originEl.getBoundingClientRect()
    const to = fitRect(photo)
    box.current.animate([px(from), px(to)], { duration: 900, easing: EASE, fill: 'both' })
    shade.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'both' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    const tile = document.querySelector(`[data-tile="${index}"]`)
    const to = tile.getBoundingClientRect()
    const from = box.current.getBoundingClientRect()
    box.current.animate([px(from), px(to)], { duration: 750, easing: EASE, fill: 'both' }).finished.then(onClose)
    shade.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, fill: 'both' })
  }, [closing, index, onClose])

  const step = useCallback(
    (dir) => {
      const next = (index + dir + PHOTOS.length) % PHOTOS.length
      const to = fitRect(PHOTOS[next])
      box.current.animate([px(box.current.getBoundingClientRect()), px(to)], { duration: 600, easing: EASE, fill: 'both' })
      onIndex(next)
    },
    [index, onIndex],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, step])

  return (
    <div className={`lightbox ${closing ? 'closing' : ''}`} role="dialog" aria-modal="true" aria-label={photo.title}>
      <div className="lb-shade" ref={shade} onClick={close} />
      <div className="lb-box" ref={box} onClick={close}>
        <img key={photo.src} src={photo.src} alt={photo.title} />
      </div>
      <div className="lb-ui">
        <p className="lb-meta">
          <span className="lb-count">{String(index + 1).padStart(2, '0')} / {String(PHOTOS.length).padStart(2, '0')}</span>
          <strong>{photo.title}</strong>
          <span className="muted">{photo.note}</span>
        </p>
        <div className="lb-nav">
          <button onClick={() => step(-1)} aria-label="Previous">←</button>
          <button onClick={() => step(1)} aria-label="Next">→</button>
          <button onClick={close} className="lb-close">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function Lookbook() {
  const intro = useRef()
  const cursor = useRef()
  const hs = useRef()
  const railRef = useRef()
  const [open, setOpen] = useState(null) // { index, el }

  // The pinned section is exactly as tall as the sideways distance to travel.
  useLayoutEffect(() => {
    const size = () => {
      const travel = Math.max(0, railRef.current.scrollWidth - window.innerWidth)
      hs.current.style.height = `${travel + window.innerHeight}px`
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(railRef.current)
    window.addEventListener('resize', size)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', size)
    }
  }, [])

  // Scroll-driven effects: expanding hero frame + parallax inside tiles.
  useEffect(() => {
    let raf
    const tick = () => {
      const vw = window.innerWidth, vh = window.innerHeight
      const el = intro.current
      // refs are null for a frame when the page is being swapped out
      if (!el || !hs.current || !railRef.current) {
        raf = requestAnimationFrame(tick)
        return
      }
      const r = el.getBoundingClientRect()
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp(-r.top / (r.height - vh), 0, 1)
        const e = ease(clamp(p / 0.78, 0, 1))
        const mobile = vw < 820
        const startW = mobile ? vw * 0.6 : Math.min(vw * 0.24, vh * 0.46)
        const startH = startW * (4 / 3)
        const w = lerp(startW, vw, e), h = lerp(startH, vh, e)
        el.style.setProperty('--ix', `${(vw - w) / 2}px`)
        el.style.setProperty('--iy', `${(vh - h) / 2}px`)
        el.style.setProperty('--r', `${lerp(6, 0, e)}px`)
        el.style.setProperty('--zoom', lerp(1.35, 1, e))
        el.style.setProperty('--gx', `${(w - startW) / 2}px`)
        el.style.setProperty('--gy', `${(h - startH) / 2}px`)
        el.style.setProperty('--fade', clamp(1 - e * 1.8, 0, 1))
        el.style.setProperty('--shade', e)
        el.style.setProperty('--cap', clamp((p - 0.8) / 0.15, 0, 1))
      }

      // Pinned horizontal track: vertical scroll slides the rail sideways.
      const sec = hs.current
      const sr = sec.getBoundingClientRect()
      if (sr.bottom > 0 && sr.top < vh) {
        const rail = railRef.current
        const max = Math.max(0, rail.scrollWidth - vw)
        const p = clamp(-sr.top / Math.max(1, sr.height - vh), 0, 1)
        rail.style.transform = `translate3d(${(-p * max).toFixed(1)}px, 0, 0)`
        sec.style.setProperty('--hp', p.toFixed(4))
        rail.querySelectorAll('.hs-item').forEach((it) => {
          const ir = it.getBoundingClientRect()
          const cx = ir.left + ir.width / 2
          // 0 at the right edge of the screen → 1 once well inside
          const enter = clamp((vw - ir.left) / (vw * 0.42), 0, 1)
          it.style.setProperty('--e', (1 - Math.pow(1 - enter, 3)).toFixed(3))
          it.style.setProperty('--g', clamp(Math.abs(cx - vw / 2) / (vw * 0.5), 0, 1).toFixed(3))
          it.style.setProperty('--px', `${((cx - vw / 2) * -0.05).toFixed(1)}px`)
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (open) scroll.lenis?.stop()
    else scroll.lenis?.start()
  }, [open])

  const moveCursor = (e) => {
    cursor.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
  }

  return (
    <>
      <section id="lookbook" className="lb-intro" ref={intro} data-pose="lookbook" data-anchor="start">
        <div className="lb-sticky">
          <div className="lb-frame">
            <img src={HERO.src} alt={HERO.alt} />
          </div>
          <p className="eyebrow lb-label">06 — Lookbook</p>
          <h2 className="lb-title" aria-label="Worn in the city">
            <span className="lb-title-a">Worn in</span>
            <span className="lb-title-b">the city</span>
          </h2>
          <div className="lb-caption">
            <p className="eyebrow">Taipei</p>
            <p className="lb-caption-big">Where it all starts.</p>
          </div>
        </div>
      </section>

      <section className="hs" ref={hs} data-pose="lookbook" onPointerMove={moveCursor}>
        <div className="hs-sticky">
          <div className="hs-rail" ref={railRef}>
            {TRACK.map((item, k) => {
              if (item.type === 'intro')
                return (
                  <div className="hs-item hs-text hs-intro" key={k}>
                    <p className="eyebrow">06 — Lookbook</p>
                    <h2>Worn, not styled.</h2>
                    <p className="hs-body">Shot around Taipei. Tap any photo to open it.</p>
                    <p className="mono hs-hint">Keep scrolling →</p>
                  </div>
                )
              if (item.type === 'quote')
                return (
                  <blockquote className="hs-item hs-text hs-quote" key={k}>
                    <p>“{item.text}”</p>
                    <cite className="mono">[ {item.ref} ]</cite>
                  </blockquote>
                )
              if (item.type === 'end')
                return (
                  <div className="hs-item hs-text hs-end" key={k}>
                    <p className="eyebrow">BELIEVE 01</p>
                    <a href="#shop" className="hs-cta">Shop the drop <span aria-hidden="true">→</span></a>
                    <p className="hs-body">Forty pieces. Black and white. {PRICE}.</p>
                  </div>
                )
              const p = PHOTOS[item.i]
              return (
                <figure className="hs-item hs-photo" key={k} style={{ '--h': item.h, '--top': item.top }}>
                  <figcaption className="mono">
                    <span>{String(item.i + 1).padStart(2, '0')}</span> {p.title} — {p.note}
                  </figcaption>
                  <div
                    className={`hs-media ${open?.index === item.i ? 'is-open' : ''}`}
                    data-tile={item.i}
                    style={{ aspectRatio: `${p.w} / ${p.h}` }}
                    onClick={(e) => setOpen({ index: item.i, el: e.currentTarget })}
                    onPointerEnter={() => cursor.current.classList.add('show')}
                    onPointerLeave={() => cursor.current.classList.remove('show')}
                  >
                    <img src={p.src} alt={`${p.title} — ${p.note}`} decoding="async" />
                  </div>
                </figure>
              )
            })}
          </div>
          <div className="hs-foot">
            <span className="mono">[ Lookbook — Taipei ]</span>
            <span className="hs-progress"><i /></span>
            <span className="mono">[ {PHOTOS.length} photos ]</span>
          </div>
        </div>
        <div className="view-cursor" ref={cursor} aria-hidden="true"><span>View</span></div>
      </section>

      {open && (
        <Lightbox
          index={open.index}
          originEl={open.el}
          onIndex={(index) => setOpen((o) => ({ ...o, index }))}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}
