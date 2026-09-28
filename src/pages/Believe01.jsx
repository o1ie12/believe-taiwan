import { useEffect } from 'react'
import Lookbook from '../Lookbook'
import { DropStats, SectionTitle } from '../hud'
import { Link } from '../router'
import { PRICE, PRODUCTS, ProductCard, ShopSection } from '../shop'

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
