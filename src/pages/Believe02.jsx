import { useEffect } from 'react'
import { FillStatement, SectionTitle } from '../hud'
import { Link } from '../router'
import { PinnedSection } from '../pinned'

const INSTAGRAM = 'https://www.instagram.com/believeapparel__/'

// Teaser: nothing about BELIEVE 02 is confirmed yet, so no product claims —
// the tee appears as a blank silhouette and every detail reads TBA.
const TBA = [
  ['02', 'Drop'],
  ['TBA', 'Pieces'],
  ['TBA', 'Price'],
  ['Soon', 'Release'],
]

export default function Believe02() {
  useEffect(() => {
    document.title = 'BELIEVE 02 — Coming soon — BELIEVE'
  }, [])

  return (
    <>
      <section id="top" className="t-hero" data-pose="t-hero">
        <p className="eyebrow t-eyebrow">Drop 02</p>
        <h1 className="t-word">BELIEVE 02</h1>
        <div className="hero-foot">
          <div>
            <p className="lead">
              Coming soon.<br />
              <span className="dim">Details at the reveal.</span>
            </p>
          </div>
          <p className="scroll-cue mono">[ In the making ] <span className="dots"><i /><i /><i /></span></p>
        </div>
      </section>

      <section className="statement" data-pose="t-verse">
        <div>
          <FillStatement lines={['Something new', 'is on the way.']} />
          <p className="ref mono reveal">[ BELIEVE 02 ]</p>
        </div>
      </section>

      <PinnedSection pose="t-soon" className="t-soon">
        <SectionTitle n="02">Soon</SectionTitle>
        <div className="t-soon-cta reveal">
          <p className="lead">
            Be first to see it. <span className="dim">The reveal lands on Instagram.</span>
          </p>
          <div className="t-links">
            <a className="add" href={INSTAGRAM} target="_blank" rel="noopener">
              Follow @believeapparel__ <span aria-hidden="true">→</span>
            </a>
            <Link to="/believe-01" className="t-back">Meanwhile, BELIEVE 01 →</Link>
          </div>
        </div>
        <div className="t-soon-gap" aria-hidden="true" />
        <div className="drop-stats t-stats">
          {TBA.map(([v, l]) => (
            <div className="stat" data-on="" key={l}>
              <strong>{v}</strong>
              <span className="mono">[ {l} ]</span>
            </div>
          ))}
        </div>
      </PinnedSection>
    </>
  )
}
