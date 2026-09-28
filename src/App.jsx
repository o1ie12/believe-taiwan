import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Lenis from 'lenis'
import Scene from './Scene'
import Lookbook from './Lookbook'
import { scroll } from './scroll'
import { DropStats, FillStatement, InfoBar, Loader, Scope, SectionTitle } from './hud'
import { ui } from './poses'
import { MODEL, useModelAvailable } from './model'

function Wordmark({ className = '' }) {
  return <img className={`wordmark ${className}`} src="/brand/wordmark.png" alt="Believe Taiwan" />
}

// Shopee listing links. Paste them in when the listings are live. With one
// listing for both colours, use the same link for each. Empty = "Coming soon".
const SHOPEE = {
  black: '',
  white: '',
}

const PRICE = 'NT$700'
const SIZES = ['S', 'M', 'L']
// Measurements in cm, from the official BELIEVE sizing chart.
const SIZE_CHART = {
  S: { length: 66, chest: 49, shoulder: 47, sleeve: 21 },
  M: { length: 69, chest: 52, shoulder: 50, sleeve: 22 },
  L: { length: 72, chest: 55, shoulder: 53, sleeve: 22 },
}

const PRODUCTS = [
  { id: 'black', name: 'BELIEVE 01', color: 'Black', white: false },
  { id: 'white', name: 'BELIEVE 01', color: 'White', white: true },
]

function SizeGuide({ onClose }) {
  useEffect(() => {
    scroll.lenis?.stop()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      scroll.lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const cols = [
    ['length', 'Length', '衣長'],
    ['chest', 'Chest width', '胸寬'],
    ['shoulder', 'Shoulder width', '肩寬'],
    ['sleeve', 'Sleeve length', '袖長'],
  ]
  // Portalled: the product card's backdrop-filter would otherwise trap position: fixed.
  return createPortal(
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Size guide">
      <div className="sheet-shade" onClick={onClose} />
      <div className="sheet-panel">
        <div className="sheet-head">
          <div>
            <p className="eyebrow">BELIEVE 01</p>
            <h3>Size guide</h3>
          </div>
          <button className="sheet-close" onClick={onClose} aria-label="Close size guide">Close</button>
        </div>
        <table className="size-table">
          <thead>
            <tr>
              <th>Size<small>尺碼</small></th>
              {cols.map(([k, en, zh]) => (
                <th key={k}>{en}<small>{zh}</small></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZES.map((s) => (
              <tr key={s}>
                <td>{s}</td>
                {cols.map(([k]) => (
                  <td key={k}>{SIZE_CHART[s][k]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted sheet-note">All measurements in centimetres (cm).</p>
      </div>
    </div>,
    document.body,
  )
}

function ProductCard({ p }) {
  const [guide, setGuide] = useState(false)
  const link = SHOPEE[p.id]
  return (
    <article
      className="card"
      onMouseEnter={() => (ui.shopWhite = p.white)}
      onMouseLeave={() => (ui.shopWhite = null)}
    >
      <div className="card-top">
        <span className={`swatch ${p.white ? 'swatch-white' : ''}`} />
        <span className="eyebrow">{p.color}</span>
      </div>
      <h3>{p.name}</h3>
      <p className="price">{PRICE}</p>
      <dl className="fit-list">
        {SIZES.map((s) => (
          <div key={s}>
            <dt>{s}</dt>
            <dd>{SIZE_CHART[s].length} cm long · {SIZE_CHART[s].chest} cm chest</dd>
          </div>
        ))}
      </dl>
      <button className="link fit-guide" onClick={() => setGuide(true)}>Full size guide</button>
      {link ? (
        <a className="add" href={link} target="_blank" rel="noopener">
          Buy on Shopee <span aria-hidden="true">→</span>
        </a>
      ) : (
        <span className="add add-soon" aria-disabled="true">Coming soon on Shopee</span>
      )}
      {guide && <SizeGuide onClose={() => setGuide(false)} />}
    </article>
  )
}

// The shop pins once it's fully on screen and holds for a moment (--hold in
// index.css: 70vh on desktop, none on phones) before the footer comes up. The
// pinned block is the tee's "shop" pose anchor, so the tee stays put meanwhile.

function ShopSection({ children }) {
  const section = useRef()
  const pin = useRef()
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => section.current.style.setProperty('--pin-h', `${pin.current.offsetHeight}px`))
    ro.observe(pin.current)
    return () => ro.disconnect()
  }, [])
  return (
    <section id="shop" className="shop" ref={section}>
      <div className="shop-pin" ref={pin} data-pose="shop">
        {children}
      </div>
    </section>
  )
}

export default function App() {
  const [joined, setJoined] = useState(false)
  const hasModel = useModelAvailable()

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, anchors: true })
    scroll.lenis = lenis
    if (import.meta.env.DEV) window.__lenis = lenis // for scripted testing
    let raf
    const loop = (t) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  // Reveal copy blocks and section titles as they enter the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.setAttribute('data-in', '')),
      { threshold: 0.2 },
    )
    document.querySelectorAll('.reveal, .reveal-title').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <Loader />
      <div className="glow" />
      <Scope />
      <Scene />
      <InfoBar />

      <main>
        <section id="top" className="hero" data-pose="hero">
          <h1 className="hero-word"><Wordmark /></h1>
          <div className="hero-foot">
            <div>
              <p className="lead">
                Everything is possible<br />
                <span className="dim">for one who believes.</span>
              </p>
              <p className="ref mono">[ Mark 9:23 ]</p>
            </div>
            <p className="scroll-cue mono">Scroll down <span className="dots"><i /><i /><i /></span></p>
          </div>
        </section>

        <section className="statement" data-pose="statement">
          <div>
            <FillStatement lines={['For we live', 'by faith,', 'not by sight.']} />
            <p className="ref mono reveal">[ 2 Corinthians 5:7 ]</p>
          </div>
        </section>

        <section id="mark" className="panel" data-pose="mark">
          <SectionTitle n="01">The Mark</SectionTitle>
          <div className="copy reveal">
            <p className="eyebrow">Front</p>
            <p className="lead">
              A star to follow.{' '}
              <span className="dim">Like the star that led the wise men, the B★ points past itself. Worn on the chest, italic and leaning forward — for those who run with perseverance the race marked out for them.</span>
            </p>
            <p className="ref mono">[ Hebrews 12:1 ]</p>
          </div>
        </section>

        <section id="word" className="panel panel-right" data-pose="word">
          <SectionTitle n="02">The Word</SectionTitle>
          <div className="copy reveal">
            <p className="eyebrow">Back</p>
            <p className="lead">
              Not I, but Christ.{' '}
              <span className="dim">Look closely: the cross stands where the I should be. BELIEVE runs shoulder to shoulder, carried the way you carry your faith — everywhere you go. TAIWAN underneath, where it all starts.</span>
            </p>
            <p className="ref mono">[ Galatians 2:20 ]</p>
          </div>
        </section>

        <section id="colorway" className="colorway" data-pose="colorway">
          <p className="eyebrow reveal">03 — Colorway</p>
          <h2 className="behind">Night &amp; Day</h2>
          <div className="colorway-note reveal">
            <p className="lead">
              The light shines in the darkness,<br />
              <span className="dim">and the darkness has not overcome it.</span>
            </p>
            <p className="ref mono">[ John 1:5 ] — Black with a white print. White with a black print.</p>
          </div>
        </section>

        <DropStats />

        <Lookbook />

        <ShopSection>
          <SectionTitle n="06">Shop</SectionTitle>
          <p className="shop-sub lead reveal">
            BELIEVE 01. <span className="dim">{PRICE} · Limited to 40 pieces total across black and white. Wear what you believe.</span>
          </p>
          <div className="shop-grid">
            <ProductCard p={PRODUCTS[0]} />
            <div className="shop-gap" />
            <ProductCard p={PRODUCTS[1]} />
          </div>
        </ShopSection>
      </main>

      <footer className="footer">
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i}>Believe <i>—</i> Taiwan <i>—</i></span>
            ))}
          </div>
        </div>
        <div className="footer-grid">
          <div>
            <img className="footer-mark" src="/brand/mark.png" alt="Believe B★ mark" />
            <p className="muted mono">25.0330° N — 121.5654° E</p>
          </div>
          <form
            className="newsletter"
            onSubmit={(e) => {
              e.preventDefault()
              setJoined(true)
            }}
          >
            <label htmlFor="email" className="eyebrow">Next drop — first to know</label>
            {joined ? (
              <p className="joined">You’re on the list.</p>
            ) : (
              <div className="field">
                <input id="email" type="email" required placeholder="you@email.com" />
                <button type="submit">Join</button>
              </div>
            )}
          </form>
          <div className="links">
            <a href="https://www.instagram.com/believeapparel__/" target="_blank" rel="noopener">Instagram</a>
            <a href="https://www.instagram.com/believeapparel__/" target="_blank" rel="noopener">Contact</a>
          </div>
        </div>
        <div className="copyright muted">
          <p className="mono">© 2026 Believe Taiwan — Soli Deo gloria</p>
          <p className="notice">
            Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide. “Not I, but Christ” from Galatians 2:20 (KJV).
          </p>
          {hasModel && (
            <p className="notice">
              3D model: <a href={MODEL.credit.url}>“{MODEL.credit.title}”</a> by {MODEL.credit.author}, licensed under{' '}
              <a href={MODEL.credit.licenseUrl}>{MODEL.credit.license}</a>. Colors and prints applied.
            </p>
          )}
        </div>
      </footer>

    </>
  )
}
