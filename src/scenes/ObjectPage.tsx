import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { asset } from '../lib/assets'
import { OBJECT_INFO, inkOn } from '../lib/objects'
import { RING_ORDER, cupSideOf, type Side } from '../lib/ring'
import { objectPath, routePath } from '../lib/useRoute'
import { objectSrc, type WasteObject } from '../lib/waste'

const CARDS = [-4, -3, -2, -1, 0, 1, 2, 3]
const HERE = 2

function slotTop(slot: number) {
  const unit = 'calc(var(--ch) + var(--cg))'
  if (slot <= 2) return `calc(${unit} * ${slot})`
  const base = `calc(${unit} * 2 + var(--chh) + var(--cg))`
  return slot === 3 ? base : `calc(${base} + ${unit} * ${slot - 3})`
}

function remember(card: HTMLElement | null, cup: Side) {
  const shot = card?.querySelector<HTMLImageElement>('.obj__card-shot')
  if (!shot) return
  const r = shot.getBoundingClientRect()
  if (!r.width) return
  sessionStorage.setItem(
    `orbit-shot-${cup}`,
    JSON.stringify({
      x: (r.left + r.width / 2) / innerWidth,
      y: (r.top + r.height / 2) / innerHeight,
      w: r.width / innerWidth,
      h: r.height / innerHeight,
    }),
  )
}

export function ObjectPage({ name }: { name: string }) {
  const info = OBJECT_INFO[name as WasteObject]
  const idx = RING_ORDER.indexOf(name as WasteObject)

  const side: Side = (sessionStorage.getItem('orbit-side') as Side) || 'left'
  const cup = cupSideOf(side)

  const [here, setHere] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  const typeRef = useRef<HTMLParagraphElement>(null)
  const hereRef = useRef<HTMLLIElement>(null)
  const [link, setLink] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [settled, setSettled] = useState(false)

  useLayoutEffect(() => {
    setSettled(false)
    const draw = () => {
      const a = typeRef.current?.getBoundingClientRect()
      const b = hereRef.current?.getBoundingClientRect()
      if (!a || !b) return
      remember(hereRef.current, cup)
      const toRight = b.left > a.left
      setLink({
        x1: toRight ? a.left : a.right,
        y1: a.bottom + a.height * 1.15,
        x2: toRight ? b.left : b.right,
        y2: b.top + b.height / 2,
      })
    }
    draw()
    const done = () => {
      draw()
      setSettled(true)
    }
    const cards = hereRef.current?.parentElement
    cards?.addEventListener('transitionend', done)
    const settle = setTimeout(done, 700)
    addEventListener('resize', draw)
    return () => {
      cards?.removeEventListener('transitionend', done)
      clearTimeout(settle)
      removeEventListener('resize', draw)
    }
  }, [name, side, cup])
  useEffect(() => {
    const t = setTimeout(() => setHere(true), 60)
    const v = video.current
    if (v) {
      v.currentTime = 0
      v.play().catch(() => {})
    }
    return () => clearTimeout(t)
  }, [name])

  if (!info || idx < 0) return null

  const ink = inkOn(info.color)

  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--bg', info.color)
    root.setProperty('--ink', ink)
    return () => {
      root.removeProperty('--bg')
      root.removeProperty('--ink')
    }
  }, [info.color, ink])
  const near = CARDS.map((d) => RING_ORDER[(idx + d + RING_ORDER.length) % RING_ORDER.length])

  return (
    <main
      className={`obj obj--cup-${cup}${here ? ' is-here' : ''}`}
      style={{ ['--bg' as string]: info.color, ['--ink' as string]: ink }}
      aria-label={info.title}
    >
      <div className="obj__bar">
        <a className="obj__back" href={routePath('landing')}>
          <span aria-hidden="true">&lt;</span> INDEX
        </a>
      </div>

      <div className="obj__cup">
        <video
          ref={video}
          className="obj__cup-video"
          src={asset('cup-fill.mp4')}
          muted
          playsInline
          autoPlay
          preload="auto"
        />
      </div>

      <div className="obj__text">
        <h1
          className="obj__title"
          aria-label={info.title}
          style={{ ['--len' as string]: info.title.length }}
        >
          {info.title.split(' ').map((word, w, all) => {
            const before = all.slice(0, w).reduce((n, x) => n + x.length + 1, 0)
            return (
              <span key={w} className="obj__word" aria-hidden="true">
                {[...word].map((ch, i) => (
                  <span key={i} className="obj__ch" style={{ ['--i' as string]: before + i }}>
                    {ch}
                  </span>
                ))}
              </span>
            )
          })}
        </h1>
        <p className="obj__era">DECADES &ndash; CENTURIES</p>
        <p className="obj__desc">{info.description}</p>
        <p className="obj__type" ref={typeRef}>
          Waste Type <span>|</span> {info.type}
        </p>
      </div>

      {settled && link && (() => {
        const { x1, y1, x2, y2 } = link
        const dx = x2 - x1
        const turn = x1 + dx * 0.34
        const land = x1 + dx * 0.68
        const stop = x2
        const d = `M ${x1} ${y1} H ${turn} L ${land} ${y2} H ${stop}`
        return (
          <svg className="obj__link" key={name} aria-hidden="true">
            <path pathLength={1} d={d} />
            <g className="obj__link-head" style={{ offsetPath: `path('${d}')` }}>
              <circle className="obj__link-ring" r="7" />
              <circle className="obj__link-dot" r="2.6" />
            </g>
          </svg>
        )
      })()}

      <div className="obj__orbit">
        <p className="obj__orbit-head">
          <a href={routePath('landing')}>ORBIT →</a>
        </p>
        <ol className="obj__cards">
          {near.map((n, i) => {
            const it = OBJECT_INFO[n]
            const slot = i - 2
            const mine = slot === HERE
            return (
              <li
                key={n}
                ref={mine ? hereRef : undefined}
                className={'obj__card' + (mine ? ' is-here' : '')}
                style={{ top: slotTop(slot) }}
              >
                <a href={objectPath(n)}>
                  <span className="obj__card-name">{it?.title ?? n}</span>
                  <span className="obj__card-code">{it?.color.replace('#', '# ')}</span>
                  <img className="obj__card-shot" src={objectSrc(n)} alt="" aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </main>
  )
}
