import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { LENS_STOPS } from '../lib/lensPath'
import { measureCuts } from '../lib/cuts'

type Props = { children: ReactNode }

type Key = { at: number; x: number; y: number }

function buildKeys(cuts: number[]): Key[] {
  const keys: Key[] = cuts.map((at, i) => {
    const stop = LENS_STOPS[Math.min(i, LENS_STOPS.length - 1)]
    return { at, x: stop.x, y: stop.y }
  })

  let at = cuts[cuts.length - 1] ?? 0
  for (let i = cuts.length; i < LENS_STOPS.length; i++) {
    at += innerHeight
    keys.push({ at, x: LENS_STOPS[i].x, y: LENS_STOPS[i].y })
  }

  return keys
}

const smoothstep = (t: number) => t * t * (3 - 2 * t)

const FREE_LERP = 0.09

function sample(keys: Key[], scroll: number) {
  if (keys.length === 0) return { x: 50, y: 50 }
  if (scroll <= keys[0].at) return keys[0]

  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]
    if (scroll > b.at) continue

    const a = keys[i - 1]
    const span = b.at - a.at
    const t = span <= 0 ? 1 : smoothstep((scroll - a.at) / span)
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  }

  return keys[keys.length - 1]
}

export function Lens({ children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let keys: Key[] = []
    let deckEnd = 0
    let curX = NaN
    let curY = NaN
    let lastX = NaN
    let lastY = NaN

    const remeasure = () => {
      const cuts = measureCuts()
      deckEnd = cuts[cuts.length - 1] ?? 0
      keys = buildKeys(cuts)
    }
    remeasure()
    const observer = new ResizeObserver(remeasure)
    observer.observe(root)
    addEventListener('resize', remeasure)

    const tick = () => {
      const target = sample(keys, scrollY)

      if (Number.isNaN(curX) || scrollY <= deckEnd) {
        curX = target.x
        curY = target.y
      } else {
        curX += (target.x - curX) * FREE_LERP
        curY += (target.y - curY) * FREE_LERP
      }

      const px = (curX / 100) * innerWidth
      const py = (curY / 100) * innerHeight + scrollY
      if (px === lastX && py === lastY) return

      lastX = px
      lastY = py
      root.style.setProperty('--lx', `${px}px`)
      root.style.setProperty('--ly', `${py}px`)
    }

    gsap.ticker.add(tick)
    return () => {
      observer.disconnect()
      removeEventListener('resize', remeasure)
      gsap.ticker.remove(tick)
    }
  }, [])

  return (
    <div className="lens" ref={rootRef}>
      <div className="lens__layer lens__layer--light">{children}</div>
      <div className="lens__layer lens__layer--dark" aria-hidden="true">
        {children}
      </div>
    </div>
  )
}
