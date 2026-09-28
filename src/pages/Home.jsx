import { useEffect } from 'react'
import { FillStatement, SectionTitle, Wordmark } from '../hud'
import { Link } from '../router'
import { DROPS } from '../drops'
import { ui } from '../poses'
import { PinnedSection } from '../pinned'

// Hovering a drop previews it on the 3D tee: BELIEVE 01 with its prints,
// BELIEVE 02 as a blank silhouette.
function DropPanel({ d }) {
  return (
    <Link
      to={d.path}
      className={`drop-panel ${d.soon ? 'is-soon' : ''}`}
      onMouseEnter={() => (ui.hover = { pose: 'chooser', values: { ink: d.soon ? 0 : 1 } })}
      onMouseLeave={() => (ui.hover = null)}
      onClick={() => (ui.hover = null)}
    >
      <span className="eyebrow">Drop {d.n}</span>
      <h3>{d.name}</h3>
      <p className="drop-meta">{d.soon ? 'Coming soon' : d.meta}</p>
      <p className="price">{d.soon ? d.meta : d.price}</p>
      <span className="drop-cta">
        {d.cta} <span aria-hidden="true">→</span>
      </span>
    </Link>
  )
}

export default function Home() {
  useEffect(() => {
    document.title = 'BELIEVE'
  }, [])

  return (
    <>
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

      <PinnedSection id="drops" pose="chooser" className="chooser">
        <SectionTitle n={String(DROPS.length).padStart(2, '0')}>Drops</SectionTitle>
        <p className="chooser-sub lead reveal">
          Choose a drop. <span className="dim">One on the way.</span>
        </p>
        <div className="chooser-grid">
          <DropPanel d={DROPS[0]} />
          <div className="chooser-gap" />
          <DropPanel d={DROPS[1]} />
        </div>
      </PinnedSection>
    </>
  )
}
