import { useLayoutEffect, useRef } from 'react'

// A section that pins once it's fully on screen and holds for a moment
// (--hold in index.css: 70vh on desktop, none on phones) before the page moves
// on. The pinned block carries the tee's pose anchor, so the tee stays put too.
export function PinnedSection({ id, pose, className = '', children }) {
  const section = useRef()
  const pin = useRef()
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => section.current.style.setProperty('--pin-h', `${pin.current.offsetHeight}px`))
    ro.observe(pin.current)
    return () => ro.disconnect()
  }, [])
  return (
    <section id={id} className="pinned" ref={section}>
      <div className={`pin ${className}`} ref={pin} data-pose={pose}>
        {children}
      </div>
    </section>
  )
}
