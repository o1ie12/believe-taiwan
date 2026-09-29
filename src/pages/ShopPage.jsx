import { useEffect, useRef, useState } from 'react'
import { View } from '@react-three/drei'
import { SectionTitle } from '../hud'
import { Link } from '../router'
import { SHOP_ITEMS, SizeGuide } from '../shop'
import { CardScene } from '../Scene'

// One gallery card: a live 3D tee (drawn by the shared canvas into this card's
// stage) that spins and turns toward the cursor, plus a direct buy link.
function GalleryCard({ item, index }) {
  const card = useRef()
  const [guide, setGuide] = useState(false)
  return (
    <article className={`g-card ${item.soon ? 'is-soon' : ''}`} ref={card}>
      <div className="g-stage">
        <View className="g-view">
          <CardScene white={item.white} ink={item.ink} trackRef={card} offset={index * 2.1} />
        </View>
        <span className="g-tag mono">[ {item.name} ]</span>
        <span className="g-index mono">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="g-info">
        <div className="card-top">
          {!item.soon && <span className={`swatch ${item.white ? 'swatch-white' : ''}`} />}
          <span className="eyebrow">{item.color}</span>
        </div>
        <h3>{item.name}</h3>
        <p className="price">{item.price}</p>
        <p className="g-sizes">{item.soon ? 'Details at the reveal' : 'Sizes S · M · L'}</p>
        {item.soon ? (
          <Link to={item.page} className="add g-buy">
            Take a look <span aria-hidden="true">→</span>
          </Link>
        ) : item.link ? (
          <a className="add g-buy" href={item.link} target="_blank" rel="noopener">
            Buy on Shopee <span aria-hidden="true">→</span>
          </a>
        ) : (
          <span className="add add-soon g-buy" aria-disabled="true">Coming soon on Shopee</span>
        )}
        {!item.soon && (
          <div className="g-links">
            <button className="link" onClick={() => setGuide(true)}>Size guide</button>
            <Link to={item.page} className="g-details">Details →</Link>
          </div>
        )}
      </div>
      {guide && <SizeGuide onClose={() => setGuide(false)} />}
    </article>
  )
}

export default function ShopPage() {
  useEffect(() => {
    document.title = 'Shop — BELIEVE'
  }, [])

  return (
    <section id="top" className="gallery-page" data-pose="gallery">
      <SectionTitle n={String(SHOP_ITEMS.length).padStart(2, '0')}>Shop</SectionTitle>
      <p className="lead g-sub reveal">
        Every piece in one place. <span className="dim">Pick one and buy it on Shopee.</span>
      </p>
      <div className="g-grid">
        {SHOP_ITEMS.map((item, i) => (
          <GalleryCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}
