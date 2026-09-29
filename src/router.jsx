import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { scroll } from './scroll'

// Tiny client-side router: three pages, history API, and a curtain that wipes
// across the screen while the page underneath swaps.
export const PAGES = ['/', '/believe-01', '/believe-02', '/shop']

const clean = (p) => {
  const path = p.replace(/\/+$/, '') || '/'
  return PAGES.includes(path) ? path : '/'
}

const RouterCtx = createContext({ path: '/', navigate: () => {} })
export const useRouter = () => useContext(RouterCtx)

const scrollToHash = (hash, immediate) => {
  const lenis = scroll.lenis
  const el = document.getElementById(hash)
  if (!lenis || !el) return
  if (!immediate) return lenis.scrollTo(el, { duration: 1.6 })
  // A freshly swapped page may be taller than Lenis last measured; re-measure
  // first, and repeat next frame in case layout was still settling.
  lenis.resize()
  lenis.scrollTo(el, { immediate: true, force: true })
  requestAnimationFrame(() => {
    lenis.resize()
    lenis.scrollTo(el, { immediate: true, force: true })
  })
}

export function RouterProvider({ children }) {
  const [path, setPath] = useState(() => clean(window.location.pathname))
  const [curtain, setCurtain] = useState('idle') // idle → in → out → idle
  const busy = useRef(false)

  useEffect(() => {
    const onPop = () => {
      setPath(clean(window.location.pathname))
      scroll.lenis?.scrollTo(0, { immediate: true, force: true })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Deep links like /believe-01#shop: scroll once the page has rendered.
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) setTimeout(() => scrollToHash(hash, true), 300)
  }, [])

  const navigate = useCallback(
    (to) => {
      const [p, hash] = to.split('#')
      const target = clean(p || path)
      if (target === path) {
        if (hash) scrollToHash(hash)
        else scroll.lenis?.scrollTo(0, { duration: 1.4 })
        return
      }
      if (busy.current) return
      busy.current = true
      setCurtain('in')
      setTimeout(() => {
        window.history.pushState({}, '', target + (hash ? `#${hash}` : ''))
        setPath(target)
        scroll.lenis?.resize()
        scroll.lenis?.scrollTo(0, { immediate: true, force: true })
        window.scrollTo(0, 0)
        setTimeout(() => {
          if (hash) scrollToHash(hash, true)
          setCurtain('out')
          setTimeout(() => {
            setCurtain('idle')
            busy.current = false
          }, 750)
        }, 180)
      }, 650)
    },
    [path],
  )

  return (
    <RouterCtx.Provider value={{ path, navigate }}>
      {children}
      <div className={`curtain curtain-${curtain}`} aria-hidden="true">
        <img src="/brand/mark.png" alt="" />
      </div>
    </RouterCtx.Provider>
  )
}

// In-app link: plain <a> (so it can be opened in a new tab) that animates on click.
export function Link({ to, children, onClick, ...rest }) {
  const { navigate } = useRouter()
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
