import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Asset } from '../components/Asset'
import { asset } from '../lib/assets'
import { GATHER_MS, SIDES, piecesOf, type Piece } from '../lib/ring'
import { objectPath } from '../lib/useRoute'
import { objectSrc } from '../lib/waste'

type Stage = 'out' | 'gather' | 'ring'

const TURN_MS = 900
const FLY_MS = 620

function cardSpot(cupLeft: boolean) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const saved = sessionStorage.getItem(`orbit-shot-${cupLeft ? 'left' : 'right'}`)
  if (saved) {
    try {
      const at = JSON.parse(saved) as { x: number; y: number; w?: number; h?: number }
      if (at.x > 0 && at.x < 1 && at.y > 0 && at.y < 1)
        return { x: at.x * vw, y: at.y * vh, w: (at.w ?? 0.1) * vw, h: (at.h ?? 0.06) * vh }
    } catch {
    }
  }

  const pad = Math.min(Math.max(16, vw * 0.042), 80)
  const col = (vw - pad * 2 - 20 * 4) / 5
  const x = cupLeft ? vw - pad - col * 0.277 : pad + col * 0.277
  return { x, y: vh * 0.558, w: col * 1.46 * 0.46 * 1.5, h: vh * 0.1 }
}

function imgSpin(orbit: HTMLElement) {
  const img = orbit.querySelector<HTMLElement>('.cupring__item img')
  return img ? spinNow(img) : 0
}

function spinNow(el: HTMLElement) {
  const now = getComputedStyle(el).rotate
  const deg = now && now !== 'none' ? parseFloat(now) : 0
  return Number.isFinite(deg) ? deg : 0
}

export function Landing({ covered = false }: { covered?: boolean }) {
  const [stage, setStage] = useState<Stage>('out')
  const [picked, setPicked] = useState<Piece | null>(null)
  const [away, setAway] = useState(false)
  const orbits = useRef<Record<string, HTMLDivElement | null>>({})
  const turn = useRef<{ side: string; hold: Record<string, number>; to: number; img?: number } | null>(null)

  useEffect(() => {
    setPicked(null)
    setAway(false)
  }, [covered])

  function turnTo(p: Piece, el: HTMLElement) {
    const orbit = orbits.current[p.side]
    if (!orbit) return
    const from = spinNow(orbit)
    const inner = p.side === 'left' ? 0 : 180
    let delta = (inner - p.angle - from) % 360
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360

    const hold: Record<string, number> = {}
    SIDES.forEach((side) => {
      const el = orbits.current[side]
      if (el) hold[side] = spinNow(el)
    })
    turn.current = { side: p.side, hold, to: from + delta }

    const spot = cardSpot(p.side === 'left')
    const ringPx = Math.min(window.innerHeight, window.innerWidth) * 0.9
    const cupPx = Math.min(ringPx, window.innerWidth * 0.6) / 2
    const atX = p.side === 'left' ? cupPx : window.innerWidth - cupPx
    const dx = spot.x - atX
    const dy = spot.y - window.innerHeight / 2

    const rad = ((from + delta) * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const main = orbit.closest('.landing') as HTMLElement | null
    main?.style.setProperty('--exx', `${dx * cos + dy * sin}px`)
    main?.style.setProperty('--exy', `${-dx * sin + dy * cos}px`)

    const now = el.offsetWidth
    const img = el.querySelector('img')
    const nw = img?.naturalWidth || 1
    const nh = img?.naturalHeight || 1
    const drawn = nw * Math.min(spot.w / nw, spot.h / nh)
    if (now) main?.style.setProperty('--land', `${drawn / now}`)

    turn.current = { ...turn.current!, img: imgSpin(orbit) }
  }

  useLayoutEffect(() => {
    const t = turn.current
    if (!picked || !t) return
    Object.entries(t.hold).forEach(([side, deg]) => {
      orbits.current[side]?.style.setProperty('--spin', `${deg}deg`)
    })
    orbits.current[t.side]
      ?.querySelector<HTMLElement>('.is-picked img')
      ?.style.setProperty('--upright', `${t.img ?? 0}deg`)
  }, [picked])

  useEffect(() => {
    if (!picked) return
    const t = turn.current
    const spin = setTimeout(() => {
      if (t) orbits.current[t.side]?.style.setProperty('--spin', `${t.to}deg`)
    }, 30)
    const fly = setTimeout(() => {
      if (t) {
        orbits.current[t.side]
          ?.querySelector<HTMLElement>('.is-picked img')
          ?.style.setProperty('--upright', `${-t.to}deg`)
      }
      setAway(true)
    }, TURN_MS)
    const go = setTimeout(() => {
      location.hash = objectPath(picked.name)
    }, TURN_MS + FLY_MS)
    return () => {
      clearTimeout(spin)
      clearTimeout(fly)
      clearTimeout(go)
    }
  }, [picked])

  useEffect(() => {
    const open = setTimeout(() => setStage('gather'), 60)
    const spread = setTimeout(() => setStage('ring'), GATHER_MS)
    return () => {
      clearTimeout(open)
      clearTimeout(spread)
    }
  }, [])

  return (
    <main
      className={
        `landing landing--${stage}` + (picked ? ' landing--picked' : '') + (away ? ' landing--away' : '')
      }
      aria-label="TOXIC EARTH ARCHIVE"
    >
      <h1 className="landing__logo">
        <Asset name="logo-tea-dark.webp" alt="TOXIC EARTH ARCHIVE" eager />
      </h1>

      {SIDES.map((side) => (
        <div key={side} className={`cupring cupring--${side}`}>
          <img className="cupring__cup" src={asset('cup-tea.webp')} alt="" aria-hidden="true" />
          <div
            className="cupring__orbit"
            ref={(el) => {
              orbits.current[side] = el
            }}
          >
            {piecesOf(side).map((p) => {
              const mine = picked?.name === p.name && picked.side === p.side
              return (
              <button
                key={p.name}
                className={'cupring__item' + (p.late ? ' is-late' : '') + (mine ? ' is-picked' : '')}
                onClick={(event) => {
                  sessionStorage.setItem('orbit-side', p.side)
                  turnTo(p, event.currentTarget)
                  setPicked(p)
                }}
                style={{
                  ['--a' as string]: `${p.angle}deg`,
                  ['--gx' as string]: p.gx,
                  ['--gy' as string]: p.gy,
                  ['--dx' as string]: p.dx,
                  ['--dy' as string]: p.dy,
                  ['--gw' as string]: p.gw,
                  ['--w' as string]: p.w,
                  ['--in' as string]: `${p.delay}s`,
                  ['--float' as string]: `${p.float}s`,
                }}
                title={p.name}
              >
                <span className="cupring__float">
                  <img src={objectSrc(p.name)} alt="" aria-hidden="true" />
                </span>
              </button>
              )
            })}
          </div>
        </div>
      ))}
    </main>
  )
}
