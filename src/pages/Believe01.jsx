import { useEffect } from 'react'
import Lookbook from '../Lookbook'
import { DropStats, SectionTitle } from '../hud'
import { Link } from '../router'
import { PRICE, PRODUCTS, ProductCard, ShopSection } from '../shop'
import { FitDiagram, Specs } from '../fit'

export default function Believe01() {
  useEffect(() => {
    document.title = 'BELIEVE 01 — BELIEVE'
  }, [])

  return (
    <>
      <section id="top" className="p-hero" data-pose="p-hero">
        <p className="eyebrow p-eyebrow">Drop 01</p>
        <h1 className="p-title">BELIEVE 01</h1>
        <div className="hero-foot">
          <div>
            <p className="lead">
              Limited to 40 pieces.<br />
              <span className="dim">Black &amp; white · {PRICE}</span>
            </p>
          </div>
          <p className="scroll-cue mono">Scroll down <span className="dots"><i /><i /><i /></span></p>
        </div>
      </section>

      <section id="mark" className="panel" data-pose="mark">
        <SectionTitle n="01">The Mark</SectionTitle>
        <div className="copy reveal">
          <p className="eyebrow">Front</p>
          <p className="lead">
            A star to follow.{' '}
            <span className="dim">The B★ sits small on the chest, italic and leaning forward.</span>
          </p>
          <Specs
            rows={[
              ['Print', 'B★ mark'],
              ['Placement', 'Centered on the chest'],
              ['Color', 'White on black · Black on white'],
            ]}
          />
        </div>
      </section>

      <section id="word" className="panel panel-right" data-pose="word">
        <SectionTitle n="02">The Word</SectionTitle>
        <div className="copy reveal">
          <p className="eyebrow">Back</p>
          <p className="lead">
            The cross in the I.{' '}
            <span className="dim">Look closely: a cross stands where the I should be. BELIEVE runs shoulder to shoulder, with TAIWAN underneath.</span>
          </p>
          <Specs
            rows={[
              ['Print', 'BELIEVE wordmark, arched, with TAIWAN beneath'],
              ['Placement', 'Upper back, shoulder to shoulder'],
              ['Detail', 'A cross in place of the I'],
            ]}
          />
        </div>
      </section>

      <section id="colorway" className="colorway" data-pose="colorway">
        <p className="eyebrow reveal">03 — Colorway</p>
        <h2 className="behind">Night &amp; Day</h2>
        <div className="colorway-note reveal">
          <p className="lead">
            Black with a white print.<br />
            <span className="dim">White with a black print.</span>
          </p>
          <p className="ref mono">[ Two colorways ]</p>
        </div>
      </section>

      <section id="fit" className="panel">
        <SectionTitle n="04">The Fit</SectionTitle>
        {/* pose anchor on the copy: the tee settles while the diagram is being read */}
        <div className="copy wide reveal" data-pose="fit">
          <p className="eyebrow">Sizing</p>
          <p className="lead">
            Three sizes, one cut.{' '}
            <span className="dim">Pick a size to see its measurements, in centimetres.</span>
          </p>
          <FitDiagram />
        </div>
      </section>

      <DropStats />

      <Lookbook />

      <ShopSection>
        <SectionTitle n="07">Shop</SectionTitle>
        <p className="shop-sub lead reveal">
          BELIEVE 01. <span className="dim">{PRICE} · Limited to 40 pieces total across black and white.</span>
        </p>
        <div className="shop-grid">
          <ProductCard p={PRODUCTS[0]} />
          <div className="shop-gap" />
          <ProductCard p={PRODUCTS[1]} />
        </div>
      </ShopSection>

      <section className="next-drop" data-pose="next">
        <Link to="/believe-02" className="next-link">
          <span className="next-label">
            <span className="eyebrow">Next</span>
            <span className="next-name">BELIEVE 02</span>
          </span>
          <span className="next-gap" aria-hidden="true" />
          <span className="mono next-cta">Coming soon →</span>
        </Link>
      </section>
    </>
  )
}
