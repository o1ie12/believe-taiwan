import { useState } from 'react'
import { SIZES, SIZE_CHART } from './shop'

// Flat-lay measurement diagram for BELIEVE 01. All numbers come straight from
// the official size chart (cm). The outline scales a touch per size so the
// difference between S, M and L is visible, not just readable.
const LINES = [
  // key, label (EN / ZH), line [x1,y1,x2,y2], label anchor [x,y], text-anchor
  ['shoulder', 'Shoulder', '肩寬', [80, 38, 320, 38], [200, 28], 'middle'],
  ['chest', 'Chest', '胸寬', [100, 146, 300, 146], [200, 138], 'middle'],
  ['length', 'Length', '衣長', [128, 34, 128, 322], [138, 236], 'start'],
  ['sleeve', 'Sleeve', '袖長', [330, 42, 392, 108], [372, 64], 'start'],
]

export function FitDiagram() {
  const [size, setSize] = useState('M')
  const m = SIZE_CHART[size]
  const scale = m.chest / SIZE_CHART.M.chest

  return (
    <div className="fit">
      <div className="fit-sizes" role="radiogroup" aria-label="Size">
        {SIZES.map((s) => (
          <button key={s} role="radio" aria-checked={s === size} className={s === size ? 'active' : ''} onClick={() => setSize(s)}>
            {s}
          </button>
        ))}
      </div>

      <svg className="fit-svg" viewBox="0 0 420 350" role="img"
        aria-label={`Size ${size}: length ${m.length} cm, chest ${m.chest} cm, shoulder ${m.shoulder} cm, sleeve ${m.sleeve} cm`}>
        <g className="fit-shirt" style={{ transform: `scale(${scale})` }}>
          <path
            className="fit-outline"
            d="M150 30 Q200 62 250 30 L320 50 L388 118 L346 160 L300 126 L300 322 L100 322 L100 126 L54 160 L12 118 L80 50 Z"
          />
          <path className="fit-collar" d="M150 30 Q200 72 250 30" />
          {LINES.map(([k, en, zh, [x1, y1, x2, y2], [tx, ty], anchor]) => (
            <g key={k} className="fit-line">
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <circle cx={x1} cy={y1} r="2.5" />
              <circle cx={x2} cy={y2} r="2.5" />
              <text x={tx} y={ty} textAnchor={anchor}>
                <tspan className="fit-label">{en} {zh}</tspan>
                <tspan className="fit-value" dx="6">{m[k]}</tspan>
              </text>
            </g>
          ))}
        </g>
      </svg>

      <dl className="fit-table">
        {LINES.map(([k, en, zh]) => (
          <div key={k}>
            <dt className="mono">{en} <span>{zh}</span></dt>
            <dd>{m[k]} <small>cm</small></dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Small mono-labelled spec list used inside section copy.
export function Specs({ rows }) {
  return (
    <dl className="spec-rows">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="mono">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}
