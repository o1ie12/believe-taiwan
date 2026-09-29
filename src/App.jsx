import { useEffect } from 'react'
import Lenis from 'lenis'
import Scene from './Scene'
import { scroll } from './scroll'
import { InfoBar, Loader, Scope } from './hud'
import { MODEL, useModelAvailable } from './model'
import { RouterProvider, useRouter } from './router'
import Home from './pages/Home'
import Believe01 from './pages/Believe01'
import Believe02 from './pages/Believe02'
import ShopPage from './pages/ShopPage'

const ROUTES = { '/': Home, '/believe-01': Believe01, '/believe-02': Believe02, '/shop': ShopPage }

const INSTAGRAM = 'https://www.instagram.com/believeapparel__/'

function Footer() {
  const hasModel = useModelAvailable()
  return (
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
          <img className="footer-mark" src="/brand/mark.png" alt="BELIEVE B★ mark" />
          <p className="muted mono">25.0330° N — 121.5654° E</p>
        </div>
        <div className="follow">
          <p className="eyebrow">Next drop — first to know</p>
          <a className="add follow-btn" href={INSTAGRAM} target="_blank" rel="noopener">
            Follow @believeapparel__ <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="links">
          <a href={INSTAGRAM} target="_blank" rel="noopener">Instagram</a>
          <a href={INSTAGRAM} target="_blank" rel="noopener">Contact</a>
        </div>
      </div>
      <div className="copyright muted">
        <p className="mono">© 2026 BELIEVE — Soli Deo gloria</p>
        <p className="notice">
          Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.
        </p>
        {hasModel && (
          <p className="notice">
            3D model: <a href={MODEL.credit.url}>“{MODEL.credit.title}”</a> by {MODEL.credit.author}, licensed under{' '}
            <a href={MODEL.credit.licenseUrl}>{MODEL.credit.license}</a>. Colors and prints applied.
          </p>
        )}
      </div>
    </footer>
  )
}

function Pages() {
  const { path } = useRouter()
  const Page = ROUTES[path] || Home

  // Reveal copy blocks and section titles as they enter the viewport (re-run per page).
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.setAttribute('data-in', '')),
      { threshold: 0.2 },
    )
    document.querySelectorAll('.reveal, .reveal-title').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [path])

  return (
    <>
      <InfoBar />
      <main key={path}>
        <Page />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
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

  return (
    <RouterProvider>
      <Loader />
      <div className="glow" />
      <Scope />
      <Scene />
      <Pages />
    </RouterProvider>
  )
}
