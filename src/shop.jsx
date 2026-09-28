import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { scroll } from './scroll'
import { ui } from './poses'
import { PinnedSection } from './pinned'

// Shopee listing links. Paste them in when the listings are live. With one
// listing for both colours, use the same link for each. Empty = "Coming soon".
const SHOPEE = {
  black: '',
  white: '',
}

export const PRICE = 'NT$700'
const SIZES = ['S', 'M', 'L']
// Measurements in cm, from the official BELIEVE sizing chart.
const SIZE_CHART = {
  S: { length: 66, chest: 49, shoulder: 47, sleeve: 21 },
  M: { length: 69, chest: 52, shoulder: 50, sleeve: 22 },
  L: { length: 72, chest: 55, shoulder: 53, sleeve: 22 },
}

export const PRODUCTS = [
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

export function ProductCard({ p }) {
  const [guide, setGuide] = useState(false)
  const link = SHOPEE[p.id]
  return (
    <article
      className="card"
      onMouseEnter={() => (ui.hover = { pose: 'shop', values: { white: p.white ? 1 : 0 } })}
      onMouseLeave={() => (ui.hover = null)}
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

export function ShopSection({ children }) {
  return (
    <PinnedSection id="shop" pose="shop" className="shop-pin">
      {children}
    </PinnedSection>
  )
}
