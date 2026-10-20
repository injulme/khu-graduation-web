import { Fragment, useLayoutEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { useFitWidth } from '../lib/useFitWidth'
import { objectSrc, photoSrc, WASTE_PHOTOS, type WasteObject } from '../lib/waste'

const base = import.meta.env.BASE_URL
const calloutSrc = (name: string) => `${base}archiving/${name}.svg`
// 로컬에 없어서 피그마에서 내보낸 이미지
const figmaSrc = (name: string) => `${base}archiving/${name}.webp`

type Item = {
  name: WasteObject
  // 피그마 값 그대로: 회전 전 크기(w, h), 회전 후 외곽 박스의 좌상단(x, y), 반시계 방향 각도
  w: number
  h: number
  x: number
  y: number
  angle?: number
  blend?: CSSProperties['mixBlendMode']
  // 피그마에서 글자보다 위 레이어
  front?: boolean
}

const ITEMS: Item[] = [
  { name: 'lid-red', w: 435.34, h: 359.05, x: -28.13, y: 394.88, angle: -134.18 },
  { name: 'net-green', w: 239.27, h: 338.03, x: 447.28, y: 488.75 },
  { name: 'bag-blue', w: 389, h: 384, x: 981, y: 442, blend: 'darken' },
  { name: 'can-pocari', w: 189.05, h: 305.38, x: 1373.14, y: 497.39 },
  // 이미지 파일에 기울기가 이미 들어가 있어서, 피그마 회전(345×172, 76.1°) 대신 회전 후 외곽 박스 크기로 넣는다
  { name: 'can-coke-crushed', w: 250, h: 376.17, x: 1614.01, y: 456.23 },
  // 트레이는 같은 이미지가 두 군데 있다. 피그마 데이터엔 회전 후 외곽 박스(301.5×217.84)만 있어서
  // 피그마 렌더와 실루엣을 맞춰 원본 비율 크기와 각도를 역산했다
  { name: 'tray-foam', w: 271.96, h: 158.74, x: 1469, y: 1194, angle: 13.5, front: true },
  { name: 'tray-foam', w: 271.96, h: 158.74, x: 1469, y: 2236, angle: 13.5, front: true },
]

// 회전 후 외곽 박스 중심에 이미지 중심을 맞춘다
const itemStyle = ({ w, h, x, y, angle = 0, blend, front }: Item): CSSProperties => {
  const rad = (angle * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  return {
    left: x + (w * cos + h * sin) / 2,
    top: y + (w * sin + h * cos) / 2,
    width: w,
    height: h,
    transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
    mixBlendMode: blend,
    zIndex: front ? 1 : undefined,
  }
}

// 오브젝트 라벨 (피그마 좌상단 좌표)
const LABELS = [
  { text: 'DISCARDED COLOR', x: 355, y: 441 },
  { text: 'LEFTOVER VALUE', x: 748.13, y: 394.95 },
  { text: 'CRUSHED BLUE', x: 1524, y: 424 },
  { text: 'COLLECTED WASTE', x: 579, y: 874 },
  { text: 'PACKAGING', x: 1211, y: 868 },
  { text: 'CRUSHED SILVER', x: 1508.99, y: 870.49 },
]

// 라벨 지시선 SVG (피그마에서 내보낸 크기 그대로)
const CALLOUTS = [
  { name: 'callout-discarded', x: 180, y: 449 },
  { name: 'callout-collected', x: 475, y: 792 },
  { name: 'callout-leftover', x: 811.5, y: 441.5 },
  { name: 'callout-packaging', x: 1108, y: 785 },
  { name: 'callout-blue', x: 1411, y: 433 },
  { name: 'callout-silver', x: 1671.7, y: 790.7 },
]

// 지시선 끝의 빈 원
const RINGS = [
  { x: 806, y: 436 },
  { x: 1666, y: 845 },
]

const MATERIALS = ['Paper', 'Glass', 'Metal', 'Plastic', 'Plastic Film', 'Other']
const COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Brown', 'Black', 'White']

// 사진 그리드: 피그마 블록 → 줄 → 칸 순서.
// 문자열은 waste 사진 이름, 숫자는 피그마 레이어명으로 파일을 특정할 수 없어 피그마에서 내보낸 칸(Mask group 노드 id 140:xxxx)
type Cell = string | number
// tight: 이미지-라벨 간격 20px, fixed: 줄 높이 409px 고정 (피그마 값, 나머지 줄은 28px / 413px)
type Block = { rows: Cell[][]; pad?: boolean; tight?: number[]; fixed?: number[] }

const GRID: Block[] = [
  {
    rows: [
      ['Red-15', 'Purple-07', 'Purple-08', 'Red-21'],
      ['Red-10', 'Red-20', 'Red-18', 2183],
      ['Red-09', 'Red-11', 'Red-13', 'Red-14'],
      [2202, 2207, 2212, 'Red-02'],
      [2221, 'Red-16', 'Red-19', 2232],
    ],
    tight: [1],
  },
  {
    rows: [
      ['Orange-10', 'Orange-11', 'Orange-12', 'Red-03'],
      ['Orange-15', 'Orange-13', 'Orange-03', 'Orange-17'],
      ['Orange-19', 'Orange-22', 'Black-08', 'Orange-18'],
    ],
  },
  {
    rows: [
      ['Orange-14', 'Yellow-06', 'Yellow-02', 'Yellow-03'],
      ['Yellow-08', 'Yellow-05', 'Orange-16', 'Orange-20'],
    ],
  },
  {
    rows: [
      ['Yellow-09', 'Green-04', 'Green-05', 'Green-10'],
      ['Yellow-04', 'Green-11', 'Green-09', 'Green-03'],
      ['Green-06', 'Green-07', 'Green-08', 'Yellow-07'],
    ],
  },
  {
    rows: [
      ['Blue-07', 2365, 'Orange-02', 2373],
      ['Blue-11', 'Blue-10', 'Blue-04', 'Blue-08'],
      ['Blue-09', 'Blue-12', 2398, 'Blue-06'],
    ],
  },
  // 피그마에서 이 블록만 padding 10px 이 들어가 있다
  { rows: [['Blue-13', 'Purple-09', 'Blue-05', 2417]], pad: true },
  {
    rows: [
      ['Orange-21', 'Orange-09', 2430, 'Brown-01'],
      ['Red-17', 'Red-01', 'Orange-07', 2448],
    ],
  },
  { rows: [['Black-05', 2457, 2462, 2467]], fixed: [0] },
  {
    rows: [
      ['White-03', 'Red-12', 'White-05', 'White-04'],
      ['Black-06', 'Black-07', 'Yellow-01', 'Black-01'],
      [2500, 'White-02', 2508, 2513],
    ],
    fixed: [0],
  },
]

const NO = new Map(WASTE_PHOTOS.map((p) => [p.name, p.no]))
// 피그마 표기 그대로 '( No.001)' — 닫는 괄호 앞에 공백 없음. 번호를 모르는 피그마 내보내기 칸은 피그마 값(001) 유지
const cellLabel = (cell: Cell) =>
  `( No.${String((typeof cell === 'string' && NO.get(cell)) || 1).padStart(3, '0')})`
const cellSrc = (cell: Cell) => (typeof cell === 'string' ? photoSrc(cell) : figmaSrc(`grid-${cell}`))

gsap.registerPlugin(ScrollTrigger)

const at = (x: number, y: number): CSSProperties => ({ left: x, top: y })

const TITLE = 'COLORS WE LEFT BEHIND'

// 스크램블 중에도 원래 글자를 알 수 있게 data-char 에 둔다
const charOf = (c: HTMLElement) => c.dataset.char ?? c.textContent ?? ''

// 글자를 span 으로 나누면 글자 쌍 사이 커닝이 빠져 폭이 넓어진다(제목 1246 → 1261px).
// 캔버스로 쌍마다 커닝 값을 재서 앞 글자의 margin-right 로 되돌린다
function restoreKerning(el: HTMLElement, chars: HTMLElement[]) {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return
  const cs = getComputedStyle(el)
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const w = (t: string) => ctx.measureText(t).width
  chars.forEach((c, i) => {
    // 줄바꿈(<br>)을 사이에 둔 글자끼리는 커닝이 없다
    const next = c.nextSibling === chars[i + 1] ? charOf(chars[i + 1]) : null
    if (!next) return
    const a = charOf(c)
    c.style.marginRight = `${w(a + next) - w(a) - w(next)}px`
  })
}

// 글자마다 span 으로 나눈다. 스크린리더는 부모의 aria-label 을 읽는다
const splitChars = (text: string, className: string) =>
  [...text].map((c, i) => (
    <span key={i} className={className} data-char={c} aria-hidden="true">
      {c}
    </span>
  ))

// 자동 줄바꿈되는 문단용: 단어를 줄바꿈 안 되는 span 으로 묶고 그 안에서 글자를 나눈다.
// 글자만 나누면 단어 중간에서 줄이 바뀐다. 공백은 일반 텍스트로 두어 원래처럼 줄이 바뀌게 한다
const splitWords = (text: string, className: string) =>
  text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.split(' ').map((word, j) => (
        <Fragment key={j}>
          {j > 0 && ' '}
          <span className="archiving__type-word">{splitChars(word, className)}</span>
        </Fragment>
      ))}
    </Fragment>
  ))

const INTRO = 1.5 // 들어오는 시간(초)
const WAVE_AMP = 24 // 위아래 움직임(px)
const WAVE_CYCLES = 1 // 들어오는 동안 한 글자가 오르내리는 횟수
const WAVE_LENGTH = 20 // 물결 한 개가 걸치는 글자 수
const WAVE_FADE = 0.2 // 끝부분에서 물결이 잦아드는 구간(전체 대비)

// 타이틀: 화면 왼쪽 밖에서 제자리로 1.5초 동안 일정한 속도로 들어온다.
// 들어오는 동안 글자마다 위아래(WAVE_AMP)로 움직이고, 옆 글자와 박자를 어긋나게 해 물결처럼 이어진다
function useTitleIntro(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const chars = [...el.querySelectorAll<HTMLElement>('.archiving__char')]
    // 폰트가 늦게 로드되면 다시 잰다
    restoreKerning(el, chars)
    let alive = true
    document.fonts.ready.then(() => alive && restoreKerning(el, chars))
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => void (alive = false)

    const ctx = gsap.context(() => {
      // 타이틀 왼쪽 여백 + 타이틀 폭만큼 밀어 두면 화면 밖에서 시작한다
      gsap.from(el, { x: -(el.offsetLeft + el.offsetWidth), duration: INTRO, ease: 'none' })

      const setY = chars.map((c) => gsap.quickSetter(c, 'y', 'px'))
      const wave = { p: 0 }
      gsap.to(wave, {
        p: 1,
        duration: INTRO,
        ease: 'none',
        onUpdate: () => {
          const { p } = wave
          // 끝 구간에서 진폭을 부드럽게 0 으로 줄여 제자리에서 멈춘다
          const fade = p < 1 - WAVE_FADE ? 1 : 0.5 * (1 + Math.cos((Math.PI * (p - 1 + WAVE_FADE)) / WAVE_FADE))
          setY.forEach((set, i) => {
            const phase = 2 * Math.PI * (WAVE_CYCLES * p - i / WAVE_LENGTH)
            set(WAVE_AMP * Math.sin(phase) * fade)
          })
        },
        onComplete: () => setY.forEach((set) => set(0)),
      })
    }, el)
    return () => {
      alive = false
      ctx.revert()
      chars.forEach((c) => gsap.set(c, { clearProps: 'transform' }))
    }
  }, [ref])
}

const INTRO_TEXT = `Since April, we have traveled across the country, photographing discarded objects and collecting the colors found within them. What we discovered was a landscape far more colorful than expected.
These are not colors we created, but colors that already exist in the world we live in.

Discarded things have remained with us for so long that they have become part of the landscape.
We have adapted to a polluted world, until even pollution begins to feel natural.
So, can we really call this colorful world beautiful?`
const INTRO_KO = '버려진 풍경 속 색을 수집하며, 우리가 자연스럽다고 믿어온 환경을 다시 바라봅니다.'

const SUB_LEFT = 'COLORS WE PASSED BY.'
const SUB_RIGHT = ['익숙해서 지나쳤던 색들을 다시 바라봅니다.', '우리가 수집한 풍경 속에 남겨진 색의 흔적들.']

const TYPE_DELAY = 0 // 타이틀 애니메이션과 동시에 시작(초)
const TYPE_SPEED = 0.04 // 앞 글자부터 원래 글자로 고정되는 간격(초)
const SCRAMBLE_LEAD = 0.3 // 첫 글자가 고정되기 전까지 랜덤 글자만 도는 시간(초)
const SCRAMBLE_SWAP = 0.05 // 랜덤 글자를 바꾸는 간격(초)
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// 스크롤로 시작하는 문구는 문구 윗부분이 화면 아래에서 15% 올라왔을 때 시작
const SCRAMBLE_VIEW_START = 'top 85%'

const randomChar = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]

// 원래 글자로 폭을 재서 고정한다. 랜덤 글자는 폭이 달라 오른쪽 정렬 줄이 흔들리기 때문
// 스크램블 중에 다시 재도 보이던 글자는 그대로 되돌린다
function lockWidths(chars: HTMLElement[]) {
  const shown = chars.map((c) => c.textContent)
  chars.forEach((c) => {
    c.textContent = charOf(c)
    c.style.width = ''
  })
  chars.forEach((c, i) => {
    c.style.width = getComputedStyle(c).width
    c.textContent = shown[i]
  })
}

// 랜덤 글자가 돌다가 앞 글자부터 차례로 원래 글자로 고정되는 트윈. 공백은 바꾸지 않는다
function scrambleTween(groups: HTMLElement[][], vars: gsap.TweenVars = {}) {
  const slots = groups.map((chars) => chars.filter((c) => charOf(c).trim()))
  const longest = Math.max(...slots.map((s) => s.length))
  const clock = { t: 0 }
  let lastSwap = -Infinity
  // 시작 전에도 랜덤 글자를 보여준다
  slots.flat().forEach((c) => (c.textContent = randomChar()))
  return gsap.to(clock, {
    t: SCRAMBLE_LEAD + longest * TYPE_SPEED,
    duration: SCRAMBLE_LEAD + longest * TYPE_SPEED,
    ease: 'none',
    onStart: () => (lastSwap = -Infinity),
    onUpdate: () => {
      const settled = Math.floor((clock.t - SCRAMBLE_LEAD) / TYPE_SPEED) + 1
      const swap = clock.t - lastSwap >= SCRAMBLE_SWAP
      if (swap) lastSwap = clock.t
      slots.forEach((chars) =>
        chars.forEach((c, i) => {
          if (i < settled) c.textContent = charOf(c)
          else if (swap) c.textContent = randomChar()
        }),
      )
    },
    onComplete: () => slots.flat().forEach((c) => (c.textContent = charOf(c))),
    ...vars,
  })
}

// 문구 스크램블: 모든 자리에서 랜덤 알파벳이 바뀌다가, 앞 글자부터 차례로 원래 글자로 고정된다.
// onView 면 문구마다 스크롤로 화면에 들어올 때 한 번 시작하고, 아니면 페이지에 들어오자마자 다 같이 시작한다
function useScramble(refs: RefObject<HTMLElement | null>[], onView = false) {
  useLayoutEffect(() => {
    const els = refs.map((r) => r.current).filter((el): el is HTMLElement => !!el)
    const groups = els.map((el) => [...el.querySelectorAll<HTMLElement>('.archiving__type-char')])
    const layout = () =>
      els.forEach((el, i) => {
        restoreKerning(el, groups[i])
        lockWidths(groups[i])
      })
    layout()
    // 폰트가 늦게 로드되면 다시 잰다
    let alive = true
    document.fonts.ready.then(() => alive && layout())
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => void (alive = false)

    const ctx = gsap.context(() => {
      if (!onView) {
        scrambleTween(groups, { delay: TYPE_DELAY })
        return
      }
      els.forEach((el, i) => {
        // .archiving__type-part 로 나눈 부분은 동시에 시작한다
        const parts = [...el.querySelectorAll<HTMLElement>('.archiving__type-part')].map((part) => [
          ...part.querySelectorAll<HTMLElement>('.archiving__type-char'),
        ])
        const tween = scrambleTween(parts.length ? parts : [groups[i]], { paused: true })
        ScrollTrigger.create({ trigger: el, start: SCRAMBLE_VIEW_START, once: true, onEnter: () => tween.play() })
      })
    })
    return () => {
      alive = false
      ctx.revert()
      groups.flat().forEach((c) => (c.textContent = charOf(c)))
    }
  }, [refs, onView])
}

const INK_DURATION = 0.5 // 검정이 퍼지는 시간(초)
// 원 반지름 71% 면 단어 박스 모서리까지 덮는다 (clip-path circle 의 % 기준은 대각선/√2)
const INK_FULL = 'circle(71% at 50% 50%)'
const INK_NONE = 'circle(0% at 50% 50%)'

// 회색 단어 위에 같은 단어를 검정으로 겹쳐 두고, hover 하면 가운데부터 원형으로 드러낸다
function InkWord({ children }: { children: string }) {
  const inkRef = useRef<HTMLSpanElement>(null)
  const ink = (clipPath: string) =>
    gsap.to(inkRef.current, { clipPath, duration: INK_DURATION, ease: 'power2.out', overwrite: true })
  return (
    <span className="archiving__ink-word" onMouseEnter={() => ink(INK_FULL)} onMouseLeave={() => ink(INK_NONE)}>
      {children}
      <span ref={inkRef} className="archiving__ink" aria-hidden="true" style={{ clipPath: INK_NONE }}>
        {children}
      </span>
    </span>
  )
}

export function Archiving() {
  const ref = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  useFitWidth(ref)
  useTitleIntro(titleRef)
  const subLeftRef = useRef<HTMLParagraphElement>(null)
  const subRightRef = useRef<HTMLParagraphElement>(null)
  const scrambleRefs = useMemo(() => [subLeftRef, subRightRef], [])
  useScramble(scrambleRefs)
  const introRef = useRef<HTMLParagraphElement>(null)
  const introKoRef = useRef<HTMLParagraphElement>(null)
  const introRefs = useMemo(() => [introRef, introKoRef], [])
  useScramble(introRefs, true)

  return (
    <main ref={ref} className="archiving">
      <div className="archiving__canvas">
        {/* 상단: 타이틀과 오브젝트 */}
        <h1 ref={titleRef} className="archiving__title" aria-label={TITLE}>
          {[...TITLE].map((c, i) => (
            <span key={i} className="archiving__char" aria-hidden="true">
              {c}
            </span>
          ))}
        </h1>
        <span className="archiving__rule archiving__rule--left" aria-hidden="true" />
        <span className="archiving__rule archiving__rule--right" aria-hidden="true" />
        <p ref={subLeftRef} className="archiving__sub archiving__sub--left" aria-label={SUB_LEFT}>
          {splitChars(SUB_LEFT, 'archiving__type-char')}
        </p>
        <p ref={subRightRef} className="archiving__sub archiving__sub--right" aria-label={SUB_RIGHT.join(' ')}>
          {splitChars(SUB_RIGHT[0], 'archiving__type-char')}
          <br />
          {splitChars(SUB_RIGHT[1], 'archiving__type-char')}
        </p>
        {ITEMS.map((item) => (
          <img
            key={`${item.name}-${item.y}`}
            className="archiving__object"
            src={objectSrc(item.name)}
            alt=""
            style={itemStyle(item)}
          />
        ))}
        {CALLOUTS.map((c) => (
          <img key={c.name} className="archiving__callout" src={calloutSrc(c.name)} alt="" style={at(c.x, c.y)} />
        ))}
        {RINGS.map((r) => (
          <img key={r.x} className="archiving__callout" src={calloutSrc('callout-ring')} alt="" style={at(r.x, r.y)} />
        ))}
        {LABELS.map((l) => (
          <p key={l.text} className="archiving__label" style={at(l.x, l.y)}>
            {l.text}
          </p>
        ))}
        {/* 담배갑(피그마에서 지시선·라벨보다 위 레이어): 피그마 Mask group 140:2525 내보내기. 마스크로 잘린 실제 보이는 영역 크기라 위치는 피그마 렌더와 맞춰 측정 */}
        <img className="archiving__figma" src={figmaSrc('cigarette')} alt="" style={{ ...at(714, 462), width: 290 }} />
        <span className="archiving__arrow" aria-hidden="true">
          ↓
        </span>

        {/* 소개 */}
        <h2 className="archiving__heading archiving__heading--intro archiving__dim">
          <InkWord>COLLECT</InkWord> · <InkWord>TRACE</InkWord> · <InkWord>REVEAL</InkWord>
        </h2>
        <p ref={introRef} className="archiving__intro" aria-label={INTRO_TEXT}>
          {/* 빈 줄 앞뒤 두 부분을 동시에 스크램블한다 */}
          {INTRO_TEXT.split('\n\n').map((part, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <>
                  <br />
                  <br />
                </>
              )}
              <span className="archiving__type-part">{splitWords(part, 'archiving__type-char')}</span>
            </Fragment>
          ))}
        </p>
        <p ref={introKoRef} className="archiving__intro-ko" aria-label={INTRO_KO}>
          {splitWords(INTRO_KO, 'archiving__type-char')}
        </p>
        {/* 커피컵: 로컬 cup-coffee 와 기울기가 달라 피그마 140:2529 내보내기 사용 */}
        <img className="archiving__figma" src={figmaSrc('cup-coffee-tilt')} alt="" style={{ ...at(131, 1662), width: 336.5 }} />

        {/* 질문과 분류 선택 */}
        <h2 className="archiving__heading" style={at(287, 2384)}>
          WHERE DID THIS COLOR COME FROM?
        </h2>
        <h2 className="archiving__heading archiving__heading--dim" style={at(461, 2492)}>
          Explore the traces we found.
        </h2>
        <img className="archiving__figma" src={figmaSrc('cup-coffee-tilt')} alt="" style={{ ...at(131, 2704), width: 336.5 }} />
        <span className="archiving__paren archiving__paren--sm" style={at(375, 2719)}>(</span>
        <span className="archiving__heading" style={at(507, 2732)}>Waste</span>
        <span className="archiving__heading" style={at(533, 2837)}>Type</span>
        <span className="archiving__paren archiving__paren--sm" style={at(799, 2719)}>)</span>
        <span className="archiving__paren archiving__paren--sm" style={at(1059, 2719)}>(</span>
        <span className="archiving__heading" style={at(1175.16, 2732)}>Similar</span>
        <span className="archiving__heading" style={at(1190.16, 2837)}>Colors</span>
        <span className="archiving__paren archiving__paren--sm" style={at(1482.16, 2719)}>)</span>

        {/* Waste Type */}
        <span className="archiving__paren" style={at(163, 3571)}>(</span>
        {/* 캔 더미 사진: 레이어명이 로컬 파일과 맞지 않아 피그마 140:2152 내보내기 사용 */}
        <img className="archiving__photo" src={figmaSrc('cans')} alt="" style={at(329, 3505)} />
        <span className="archiving__paren" style={at(799, 3571)}>)</span>
        <ul className="archiving__list" style={at(1109, 3451)}>
          {MATERIALS.map((m) => (
            <li key={m} className="archiving__list-item archiving__list-item--material">
              {m}
            </li>
          ))}
        </ul>

        {/* Similar Colors */}
        <ul className="archiving__list" style={at(-1, 4337)}>
          {COLORS.map((c) => (
            <li key={c} className="archiving__list-item archiving__list-item--color">
              {c}
            </li>
          ))}
        </ul>
        <span className="archiving__paren" style={at(1051, 4686.5)}>(</span>
        <img className="archiving__photo" src={photoSrc('Blue-11')} alt="" style={at(1220, 4621)} />
        <span className="archiving__paren" style={at(1686, 4686.5)}>)</span>
        <h2 className="archiving__similar">Similar Colors</h2>
      </div>

      {/* 사진 그리드 */}
      <div className="archiving__grid">
        {GRID.map((block, i) => (
          <div key={i} className={`archiving__block${block.pad ? ' archiving__block--pad' : ''}`}>
            {block.rows.map((row, j) => (
              <div
                key={j}
                className={[
                  'archiving__row',
                  block.tight?.includes(j) && 'archiving__row--tight',
                  block.fixed?.includes(j) && 'archiving__row--fixed',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {row.map((cell, k) => (
                  <figure key={k} className="archiving__cell">
                    <img className="archiving__cell-img" src={cellSrc(cell)} alt="" loading="lazy" />
                    <figcaption className="archiving__cell-label">{cellLabel(cell)}</figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}
