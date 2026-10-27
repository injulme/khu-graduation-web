import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { useFitWidth } from '../lib/useFitWidth'
import { inkOn } from '../lib/objects'
import { objectSrc, photoSrc, WASTE_PHOTOS, type WasteColor, type WasteObject } from '../lib/waste'

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
  // 스크롤 고정 애니메이션의 출발(start)/도착(end) 위치. 도착 위치 이미지는 표시 없이 자리만 잡는다
  pin?: 'start' | 'end'
  // 피그마가 공용 이미지와 다른 원본을 잘라 써서, 피그마에서 내보낸 이미지(public/archiving)를 쓴다
  figma?: boolean
  // 첫 화면 등장 방향. down 은 위에서 아래로, up 은 아래에서 위로 움직이며 나타난다
  enter?: 'down' | 'up'
}

const ITEMS: Item[] = [
  { name: 'lid-red', w: 435.34, h: 359.05, x: -28.13, y: 394.88, angle: -134.18, enter: 'down' },
  { name: 'net-green', w: 239.27, h: 338.03, x: 447.28, y: 488.75, enter: 'up' },
  { name: 'bag-blue', w: 389, h: 384, x: 981, y: 442, blend: 'darken', enter: 'up' },
  { name: 'can-pocari', w: 189.05, h: 305.38, x: 1373.14, y: 497.39, enter: 'down' },
  // 공용 이미지는 피그마보다 더 기울어 있어서, 피그마 노드(140:2094)를 2x 로 내보낸 이미지를 쓴다
  { name: 'can-coke-crushed', w: 249.99, h: 376.17, x: 1614.01, y: 456.23, figma: true, enter: 'up' },
  // 트레이는 같은 이미지가 두 군데 있다. 피그마 데이터엔 회전 후 외곽 박스(301.5×217.84)만 있어서
  // 피그마 렌더와 실루엣을 맞춰 원본 비율 크기와 각도를 역산했다
  { name: 'tray-foam', w: 271.96, h: 158.74, x: 1469, y: 1194, angle: 13.5, front: true, pin: 'start' },
  { name: 'tray-foam', w: 271.96, h: 158.74, x: 1469, y: 2236, angle: 13.5, front: true, pin: 'end' },
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

// hover 사진: 위치·크기는 목록 왼쪽 위(첫 줄 글자 윗부분) 기준 px. 사진은 피그마 노드를 2x 로 내보낸 것
type HoverImgSpec = { file: string; x: number; y: number; w: number; h: number }

// materials 목록. hover 하면 오른쪽에 그 재질 사진이 나온다 (피그마 Waste Type 섹션 140:3193)
const MATERIALS = [
  { name: 'Paper', img: { file: 'material-paper', x: 600, y: -130, w: 155, h: 200 } },
  { name: 'Glass', img: { file: 'material-glass', x: 558, y: -75, w: 171, h: 256 } },
  { name: 'Metal', img: { file: 'material-metal', x: 471, y: 30, w: 312.01, h: 280.27 } },
  { name: 'Plastic', img: { file: 'material-plastic', x: 529, y: 97, w: 179.95, h: 312.54 } },
  { name: 'Plastic Film', img: { file: 'material-plastic-film', x: 515, y: 274, w: 240, h: 253 } },
  { name: 'Other', img: { file: 'material-other', x: 515, y: 391, w: 293.99, h: 278.69 } },
] as const satisfies readonly { name: string; img: HoverImgSpec }[]
const LIST_ROW = 110 // 목록 한 줄 간격
const LIST_ROW_TOP = -20.5 // 줄 박스 윗부분: 글자 윗부분 기준 (app.css .archiving__list-item margin-top)
const LIST_ROW_LINE = 110 // 줄 아래 구분선: 줄 박스 윗부분 기준 (app.css .archiving__list-item::after top)

// hover 사진. 줄 아래 구분선을 바닥 삼아 그 아래는 잘라서, 선 밑에 숨어 있던 사진이 선 위로 뛰어오른다
// 사진이 선보다 아래로 내려와 있으면(materials Other, colors Yellow·Blue 등) 사진 아랫부분을 바닥으로 삼는다
function HoverImg({ img, row }: { img: HoverImgSpec; row: number }) {
  // 목록 기준 좌표를 이 줄 박스 기준으로 바꾼다
  const top = img.y - (row * LIST_ROW + LIST_ROW_TOP)
  const floor = Math.max(img.h, LIST_ROW_LINE - top) // 사진 윗부분에서 바닥까지
  return (
    <span
      className="archiving__hover-img"
      style={{ left: img.x, top, width: img.w, height: floor, '--drop': `${floor}px` } as CSSProperties}
    >
      <img src={figmaSrc(img.file)} alt="" style={{ width: img.w, height: img.h }} />
    </span>
  )
}
const COLORS: WasteColor[] = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Brown', 'Black', 'White']

// colors 목록 hover 배경색. 프로젝트·피그마에 색 이름별로 정해 둔 값이 없어 직접 정한다 ('#rrggbb')
// null 이면 materials 와 같은 검정. 글자색은 배경 밝기에 맞춰 검정/흰색이 자동으로 정해진다
const COLOR_FILL: Record<WasteColor, string | null> = {
  Red: '#FF0000',
  Orange: '#FF6200',
  Yellow: '#FFEA00',
  Green: '#00FF47',
  Blue: '#006DFF',
  Purple: '#9500FF',
  Brown: '#673711',
  Black: '#000000',
  White: '#FFFFFF',
}

// colors 목록 hover 사진. 목록 왼쪽에 나온다 (피그마 Similar Color 섹션 140:3376)
const COLOR_IMG: Record<WasteColor, HoverImgSpec> = {
  Red: { file: 'color-red', x: 70, y: -147, w: 287, h: 237 },
  Orange: { file: 'color-orange', x: 116, y: -109, w: 191, h: 288 },
  Yellow: { file: 'color-yellow', x: 0, y: -15, w: 353.75, h: 350.77 },
  Green: { file: 'color-green', x: 60, y: 179, w: 306, h: 204 },
  Blue: { file: 'color-blue', x: 24, y: 226, w: 423.69, h: 423.69 },
  Purple: { file: 'color-purple', x: 105, y: 400, w: 236, h: 228 },
  Brown: { file: 'color-brown', x: 0, y: 397, w: 474.03, h: 405.68 },
  Black: { file: 'color-black', x: 60, y: 563, w: 304.74, h: 304.74 },
  White: { file: 'color-white', x: 84, y: 796, w: 256, h: 150 },
}

// hover 배경색과 그 위 글자색을 CSS 변수로 넘긴다
const fillStyle = (fill: string | null) =>
  (fill ? { '--fill': fill, '--fill-ink': inkOn(fill) } : undefined) as CSSProperties | undefined

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

// 피그마 내보내기 칸이 실제로 어떤 사진인지. 이미지를 로컬 사진과 비교해 찾았다
// null 은 로컬 waste 사진에 없는 사진이라 번호·색을 모른다. 알면 사진 이름('White-06' 등)을 적는다
const EXPORT_PHOTO: Record<number, string | null> = {
  2183: 'Purple-05',
  2202: 'Red-05',
  2207: 'Red-06',
  2212: 'Red-07',
  2221: 'Red-04',
  2232: 'Red-08',
  2365: 'Blue-03',
  2373: 'Green-02',
  2398: 'Blue-02',
  2417: 'Purple-02',
  2430: 'Orange-05',
  2448: 'Orange-04',
  2457: 'Orange-06',
  2462: 'Black-03',
  2467: 'Green-01',
  2500: 'White-01',
  2508: null, // 흰 일회용 컵 더미
  2513: null, // 흰 스티로폼 도시락 용기
}
// 칸의 waste 사진 이름 (모르면 null)
const photoName = (cell: Cell) => (typeof cell === 'string' ? cell : (EXPORT_PHOTO[cell] ?? null))

// 같은 사진인지 가르는 값. 사진 이름을 모르는 내보내기 칸은 피그마 id 로 가른다
const cellId = (cell: Cell) => photoName(cell) ?? `#${cell}`
// 번호는 전체 그리드 첫 칸부터 001, 002… 순서. 필터 화면에서도 같은 사진은 같은 번호를 쓴다
// 전체 그리드에 없는 사진은 그 뒤 번호를 이어 붙인다 (GRID_NO 는 아래 GRID_CELLS 뒤에서 만든다)
const cellNo = (cell: Cell) => String(GRID_NO.get(cellId(cell)) ?? 0).padStart(3, '0')
// 피그마 표기 그대로 '( No.001)' — 닫는 괄호 앞에 공백 없음
const cellLabel = (cell: Cell) => `( No.${cellNo(cell)})`
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
  // 폭을 다 읽은 뒤 한 번에 쓴다. 읽고 쓰기를 글자마다 번갈아 하면 글자 수만큼 레이아웃을 다시 계산한다
  const widths = chars.map((c) => getComputedStyle(c).width)
  chars.forEach((c, i) => {
    c.style.width = widths[i]
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

// 고정되는 화면 위치(1920 기준 px). 이미지 윗부분이 화면 맨 위에서 86px 아래에 닿으면 고정 시작
// (data-pin-anchor="bottom" 이면 아랫부분이 화면 맨 아래에서 86px 위에 닿으면)
const PIN_TOP = 86
const FLOAT = 16 // 둥실둥실 뜨는 폭: 제자리 기준 위아래(px)
const FLOAT_DURATION = 1 // 위에서 아래까지 걸리는 시간(초). 왕복은 2배

// 트레이·커피컵: 화면 위쪽에 닿으면 그 자리에 고정된 채로 내려가다가, 두 번째 배치 위치에 닿으면 내려놓인다.
// data-pin-start / data-pin-end 값이 같은 이미지끼리 짝이다. 실제로 움직이는 건 출발 이미지이고, 도착 이미지는 위치 표시로만 쓴다.
// 내내 위아래로 둥실둥실 뜬다
function usePinFloat(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    // 1920 기준 px 를 화면 축소(zoom) 배율에 맞춘다
    const pinAt = () => PIN_TOP * (parseFloat(getComputedStyle(root).zoom) || 1)
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-pin-start]').forEach((from) => {
        const to = root.querySelector<HTMLElement>(`[data-pin-end="${from.dataset.pinStart}"]`)
        if (!to) return
        // 기본은 이미지 윗부분이 화면 위에서 PIN_TOP 만큼 아래, bottom 이면 이미지 아랫부분이 화면 아래에서 PIN_TOP 만큼 위
        // 화면에 보이는 높이를 재서 윗부분 기준으로 바꿔 쓴다. 이미지 로드 전에 재도 맞도록 이미지 높이는 style 에 지정해 둔다
        const at = () =>
          from.dataset.pinAnchor === 'bottom'
            ? `top ${innerHeight - pinAt() - from.getBoundingClientRect().height}px`
            : `top ${pinAt()}px`
        gsap.to(from, {
          // 출발·도착 이미지는 크기·회전이 같아서 top 만 옮기면 도착 위치와 정확히 겹친다
          top: to.style.top,
          ease: 'none',
          scrollTrigger: {
            trigger: from,
            start: at,
            endTrigger: to,
            // 도착도 같은 기준이어야 내려놓이는 위치가 정확히 겹친다
            end: at,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        // 둥실둥실: 고정 애니메이션(top)·회전(transform)과 겹치지 않게 translate 로 따로 움직인다
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.fromTo(
            from,
            { '--float': `${-FLOAT}px` },
            { '--float': `${FLOAT}px`, duration: FLOAT_DURATION, ease: 'sine.inOut', repeat: -1, yoyo: true },
          )
        }
      })
    }, root)
    return () => ctx.revert()
  }, [ref])
}

// 질문 두 줄: 스크롤하면 회색 → 검정 → 회색. 위치는 줄 윗부분이 화면 위에서 몇 % 지점에 있는지 기준
const LINE_GRAY = '#b8b8b8'
const LINE_BLACK = '#000000'
// 줄마다 [검정으로 바뀌는 구간, 다시 회색으로 바뀌는 구간]. 회색 구간은 검정 구간 뒤여야 한다
type LineRange = { toBlack: [string, string]; toGray: [string, string] }
const LINES: Record<string, LineRange> = {
  question: { toBlack: ['top 35%', 'top 25%'], toGray: ['top 25%', 'top 15%'] },
  // 첫 줄보다 108px 아래라 같은 % 면 첫 줄이 검정이 된 뒤에 시작한다
  explore: { toBlack: ['top 35%', 'top 25%'], toGray: ['top 25%', 'top 15%'] },
}

function useLineHighlight(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-line-highlight]').forEach((el) => {
        const range = LINES[el.dataset.lineHighlight ?? '']
        if (!range) return
        gsap.set(el, { color: LINE_GRAY })
        const [blackStart, blackEnd] = range.toBlack
        const [grayStart, grayEnd] = range.toGray
        gsap.to(el, {
          color: LINE_BLACK,
          ease: 'none',
          scrollTrigger: { trigger: el, start: blackStart, end: blackEnd, scrub: true },
        })
        gsap.fromTo(
          el,
          { color: LINE_BLACK },
          {
            color: LINE_GRAY,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: el, start: grayStart, end: grayEnd, scrub: true },
          },
        )
      })
    }, root)
    return () => ctx.revert()
  }, [ref])
}

// Waste Type · Similar Colors 단어, 재질·색 목록: 스크롤로 화면에 들어오면 단어마다 아래에서 위로 올라오며 나타난다
// 같은 group 끼리 첫 단어가 보일 때 함께 시작하고, 단어 사이는 RISE_STAGGER 만큼 늦게 올라온다
const RISE_DURATION = 0.8 // 한 단어가 올라오는 시간(초)
const RISE_STAGGER = 0.15 // 다음 단어가 늦게 시작하는 간격(초)
const RISE_VIEW_START = 'top 85%'

// 단어 박스 밖은 잘라서 아래에 숨겨 둔 글자가 박스 안으로 올라오며 보이게 한다
function RiseWord({ group, style, children }: { group: string; style: CSSProperties; children: string }) {
  return (
    <span className="archiving__heading archiving__rise" style={style}>
      <span className="archiving__rise-inner" data-rise={group}>
        {children}
      </span>
    </span>
  )
}

function useRise(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const groups = new Map<string, HTMLElement[]>()
      root.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
        const key = el.dataset.rise ?? ''
        groups.set(key, [...(groups.get(key) ?? []), el])
      })
      groups.forEach((words) => {
        gsap.from(words, {
          yPercent: 100,
          duration: RISE_DURATION,
          ease: 'power3.out',
          stagger: RISE_STAGGER,
          // 글자는 아래로 내려가 있으니 제자리인 바깥 박스를 기준으로 잰다
          scrollTrigger: { trigger: words[0].parentElement, start: RISE_VIEW_START, once: true },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [ref])
}

// 첫 화면 오브젝트 등장: data-enter 가 down 이면 화면 위 끝 밖에서 아래로, up 이면 화면 아래 끝 밖에서 위로 들어오며 투명에서 나타난다
// 첫 렌더 직후 화면이 잠깐 멈춰서 CSS 애니메이션은 그 사이에 지나가 버린다. gsap 은 멈춘 시간을 건너뛰지 않는다
const ENTER_DURATION = 1 // 나타나는 시간(초)
const ENTER_SCREEN_H = 1080 // 출발 위치 기준 화면 높이 (1920×1080 기준 px)

function useEnter(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      // 회전까지 들어간 실제 보이는 박스를 1920 기준 px 로 잰다 (축소 화면에서는 zoom 만큼 나눈다)
      const rootRect = root.getBoundingClientRect()
      const scale = rootRect.width / root.offsetWidth
      root.querySelectorAll<HTMLElement>('[data-enter]').forEach((el) => {
        const r = el.getBoundingClientRect()
        const top = (r.top - rootRect.top) / scale
        const bottom = (r.bottom - rootRect.top) / scale
        // down: 아래 끝이 화면 위 끝에 닿은 자리, up: 위 끝이 화면 아래 끝에 닿은 자리에서 출발
        const from = el.dataset.enter === 'down' ? -bottom : ENTER_SCREEN_H - top
        // transform 에는 위치·회전이 들어 있어서, 따로 노는 CSS translate 를 --enter-y 로 움직인다
        gsap.fromTo(
          el,
          { '--enter-y': `${from}px`, opacity: 0 },
          { '--enter-y': '0px', opacity: 1, duration: ENTER_DURATION, ease: 'power3.out' },
        )
      })
    }, root)
    return () => ctx.revert()
  }, [ref])
}

// Waste Type · Similar Colors 큰 제목: 화면에 보이면 한 번, data-slide 방향의 화면 바깥에서 제자리로 들어온다
const SLIDE_DURATION = 1.2 // 들어오는 시간(초)
const SLIDE_VIEW_START = 'top 85%'

function useSlideIn(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-slide]').forEach((el) => {
        gsap.from(el, {
          // 왼쪽이면 오른쪽 끝이 화면 왼쪽 밖, 오른쪽이면 왼쪽 끝이 화면 오른쪽 밖에 있는 데서 출발 (1920 기준 px)
          x: () => (el.dataset.slide === 'left' ? -(el.offsetLeft + el.offsetWidth) : root.offsetWidth - el.offsetLeft),
          duration: SLIDE_DURATION,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: SLIDE_VIEW_START, once: true },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [ref])
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

// 그리드 사진 클릭: 화면 가운데 확대(피그마 140:3005) → 잠시 뒤 상세 화면(피그마 140:3093)으로 이어진다
// 확대: 1920 기준 화면 가운데 1332×971.25, 번호는 사진 윗부분에서 180px 아래
const ZOOM_W = 1332
const ZOOM_H = 971.25
const ZOOM_LABEL_TOP = 180.23
const ZOOM_DURATION = 0.6 // 커지고 줄어드는 시간(초)
const ZOOM_EASE = 'power3.inOut'
const ZOOM_LABEL_FADE = 0.3 // 번호가 나타나고 사라지는 시간(초)
const ZOOM_HOLD = 0.6 // 확대가 끝난 뒤 상세 화면으로 넘어가기까지 머무는 시간(초)
// 상세: 사진이 왼쪽 절반을 채우고 오른쪽 절반에 사진 색 패널이 들어온다
const DETAIL_DURATION = 0.8
const DETAIL_EASE = 'power3.inOut'
const DETAIL_SWAP = 0.4 // 이전/다음 사진으로 바뀔 때 나타나는 시간(초)

// 상세 화면 사진별 내용 (피그마 컬러칩 완성형 338:1748). 키는 cellId (사진 이름, 모르면 '#피그마 id')
// 피그마 컬러칩 번호는 필터에만 있는 사진을 중간에 끼워 069 부터 그리드 번호와 다르다. 사진은 썸네일로 맞췄다
// color 는 패널 색, hex 는 패널 색과 다르게 적힌 표기(피그마 그대로), ink 'black' 은 검정 글자(기본 흰색)
// nameSize·nameSpacing 은 긴 이름을 피그마에서 줄인 값 (기본 94.15px, -0.01em)
type CellDetail = {
  name: string
  nameSize?: number
  nameSpacing?: string
  color: string
  hex?: string
  ink?: 'black'
  type: string
  text: string
}
const DETAIL_PERIOD = 'DECADES — CENTURIES' // 피그마 100장 모두 같은 값
const CELL_DETAILS: Partial<Record<string, CellDetail>> = {
  // No.001
  'Red-15': { name: 'DIRTY RUBY', color: 'FD5B64', type: 'Other', text: '붉은 비닐봉투가 겹겹이 쌓이며 만들어낸 루비색. 버려진 순간에도 선명한 색을 유지한 채, 거리의\n익숙한 풍경 속에 자연스럽게 섞여 있다.' },
  // No.002
  'Purple-07': { name: 'NEON PETAL', color: 'F55396', type: 'Other', text: '검은 망 사이로 드러난 형광빛 분홍색. 버려진 포장재의 선명한 색이 자연물처럼 흩어져\n낯선 꽃잎의 흔적을 만든다.' },
  // No.003
  'Purple-08': { name: 'BIN PINK', color: 'EE4A75', type: 'Plastic', text: '낡은 공간 속 플라스틱 통에서 발견한 강렬한 분홍색. 일상을 담아내던 용기는 버려진 공간에서도 여전히\n또렷한 색으로 존재한다.' },
  // No.004
  'Red-21': { name: 'WORN STRAWBERRY', nameSize: 88.0, nameSpacing: '-0.05em', color: 'F93A5D', type: 'Paper', text: '풀숲 사이 버려진 포장지에서 발견한 달콤한 딸기빛. 먹고 남은 기억을 담았던 포장은 자연 속에 남아 새로운 풍경의 일부가 된다.' },
  // No.005
  'Red-10': { name: 'CLOUDY PEACH', color: 'F086B4', type: 'Metal', text: '무채색 공간 속에서 유난히 선명하게 드러난 분홍빛 캔. 한때 음료를 담고 있던 물건은 비워진 뒤에도 소비의 흔적을 색으로 남긴다.' },
  // No.006
  'Red-20': { name: 'DUST BUNNY', color: 'AE8474', type: 'Other', text: '아스팔트 위에 홀로 남겨진 인형에서 발견한 부드러운 갈색. 누군가의 일상이었던 작은 존재가 버려진 뒤에는 낯선 거리의 풍경으로 남아 있다.' },
  // No.007
  'Red-18': { name: 'ENERGY CORAL', color: 'FA6D80', type: 'Metal', text: '수많은 캔이 속 차갑고 반사적인 분홍빛. 반복된 소비의 흔적들이 쌓이며 하나의 새로운 금속\n풍경을 만들어낸다.' },
  // No.008
  'Purple-05': { name: 'WASTE PINK', color: 'E2266B', type: 'Plastic Film', text: '구겨진 포장지 위에 남은 선명한 분홍색. 작고 가벼운 소비의 흔적 하나가 길 위에 남아 예상보다 오래 풍경을 차지한다.' },
  // No.009
  'Red-09': { name: 'BIN ORANGE', color: 'F44E1C', type: 'Plastic', text: '낡은 플라스틱 상자에서 발견한 따뜻한 주황색. 버려진 물건은 본래의 용도를 잃고도 강한 색만큼은\n그대로 간직한다.' },
  // No.010
  'Red-11': { name: 'TRACE RED', color: 'E5303D', type: 'Other', text: '돌과 식물 사이 과자통에서 발견한 깊은 붉은색. 자연의 무채색 틈에 남겨진 인공적인 색이 오히려\n풍경의 중심이 된다.' },
  // No.011
  'Red-13': { name: 'THICK DARK RED', color: '7A1B17', type: 'Other', text: '겹겹이 쌓인 붉은 봉투가 만들어낸 탁한 붉은색. 버려진 봉투들은 자연스럽게 쌓여 하나의 덩어리가\n되고, 어느새 익숙한 풍경처럼 자리 잡는다.' },
  // No.012
  'Red-14': { name: 'PLASTIK PEACH', color: 'CB6F6F', type: 'Plastic', text: '투명한 플라스틱 병에 남은 복숭아빛. 한때 손에 쥐고 마셨던 물건이 이제는 길가에 남아\n일상의 흔적이 된다.' },
  // No.013
  'Red-05': { name: 'BIG SCARLET', color: 'E1041F', type: 'Plastic Film', text: '돌 틈 속 과자 포장에서 발견한 강렬한 주홍색. 자연의 거친 질감 사이에 소비의 색이 선명하게\n박혀 있다.' },
  // No.014
  'Red-06': { name: 'PLASTIK RED', color: 'E82C33', type: 'Plastic Film', text: '돌무더기 위 길게 놓인 빨대에서 발견한 선명한 붉은색. 작고 가벼운 물건 하나가 자연의 무채색 풍경 속에서 예상치 못한 색의 흔적을 남긴다.' },
  // No.015
  'Red-07': { name: 'NETTED SHELLS', color: '8B0113', type: 'Other', text: '낡은 배관 아래에 매달린 붉은 망 속에서 발견한 색. 버려진 것과 자연의 흔적이 뒤섞인 채,\n어느새 익숙한 풍경의 일부로 남아 있다.' },
  // No.016
  'Red-02': { name: 'ROLLER RED', color: 'B01922', type: 'Plastic', text: '모래 위에 버려진 헤어롤에서 발견한 선명한 붉은색. 한때 일상의 도구였던 물건은 버려진 뒤에도\n색을 잃지 않은 채 낯선 풍경의 일부로 남아 있다.' },
  // No.017
  'Red-04': { name: 'CRUSHED RED', color: 'DD122A', type: 'Plastic Film', text: '길 위에 버려진 작은 포장에서 발견한 선명한 붉은색. 귀여운 캐릭터를 담았던 소비의 이미지는 버려진 뒤에도 강렬한 색으로 풍경에 남아 있다.' },
  // No.018
  'Red-16': { name: 'RUST RED', color: 'F23333', type: 'Metal', text: '물 속에 빠진 찌그러진 캔에서 발견한 익숙한 붉은색. 수많은 사람에게 익숙한 브랜드의 색이 소비 이후에는 거리의 흔적으로 남는다.' },
  // No.019
  'Red-19': { name: 'CRIMSON TRACE', color: 'F63326', type: 'Plastic Film', text: '아스팔트 위에 버려진 포장에서 발견한 짙은 붉은색. 작은 포장 하나가 무채색 거리 위에 선명한 흔적을 남기며 시선을 붙잡는다.' },
  // No.020
  'Red-08': { name: 'ASH BLUSH', color: 'F9837C', type: 'Plastic Film', text: '구겨진 비닐봉투에서 발견한 옅은 분홍빛. 한 번의 소비를 위해 사용된 얇은 막이 버려진 뒤에도 거리의 색으로 남아 있다.' },
  // No.021
  'Orange-10': { name: 'ACID VITA', color: 'F2950C', type: 'Glass', text: '나무 아래 놓인 병에서 발견한 깊고 따뜻한 호박색. 자연의 어두운 색 사이에 놓인 유리병은 주변 풍경과\n묘하게 닮은 색을 띤다.' },
  // No.022
  'Orange-11': { name: 'DISCARD TANGERINE', nameSize: 89.15, nameSpacing: '-0.05em', color: 'F07702', type: 'Other', text: '수많은 쓰레기봉투 사이에서 발견한 선명한 주황색. 반복해서 쌓인 봉투들은 어느새 하나의 거대한 색 덩어리가 되어버린다.' },
  // No.023
  'Orange-12': { name: 'FILM YELLOW', color: 'F0B053', type: 'Plastic Film', text: '투명한 봉투 사이로 드러난 장난감의 노란색. 놀이의 흔적이었던 밝은 색은 버려진 순간부터 자연과 어울리지 않는 낯선 풍경이 된다.' },
  // No.024
  'Red-03': { name: 'RUST YELLOW', color: 'EDD71A', ink: 'black', type: 'Metal', text: '버려진 캔의 뚜껑에서 발견한 오래된 노란빛. 작은 금속 조각 하나가 주변의 회색 풍경과 대비되며 강한 존재감을 남긴다.' },
  // No.025
  'Orange-15': { name: 'AMBER CUP', color: 'ED8B30', type: 'Paper', text: '길거리 쓰레기들 사이에서 발견한 따뜻한 주황빛. 일상적으로 사용되던 용기가 버려진 뒤에도 소비의 순간을 떠올리게 하는 색을 간직한다.' },
  // No.026
  'Orange-13': { name: 'FALLEN WRAP', color: 'F3BE56', type: 'Plastic Film', text: '노란 포장재가 겹쳐진 틈에서 발견한 밝은 오렌지색. 가벼운 포장 하나가 버려진 공간에 예상치 못한 생생한 색을 남긴다.' },
  // No.027
  'Orange-03': { name: 'GARBAGE GOLD', color: 'BB8546', type: 'Other', text: '종이상자와 포장재가 뒤섞인 곳에서 발견한 탁한 황금빛. 상품을 보호하던 포장들은 소비가 끝난 뒤 하나의 거대한 폐기 풍경으로 변한다.' },
  // No.028
  'Orange-17': { name: 'POLLUTED SCARLET', nameSize: 93.15, nameSpacing: '-0.05em', color: 'BC4917', type: 'Glass', text: '길가에 남겨진 여러 병에서 발견한 짙은 주황색. 투명한 병과 어두운 유리의 색이 겹쳐지며 오래된 거리의 풍경처럼 남아 있다.' },
  // No.029
  'Orange-19': { name: 'BARLEY YELLOW', color: 'FFBD00', type: 'Plastic', text: '풀숲 사이에 놓인 음료병에서 발견한 귀여운 노란색. 자연의 잎과 어우러진 병은 마치 식물의 일부처럼 풍경에 스며든다.' },
  // No.030
  'Orange-22': { name: 'GOLDEN FOIL', color: 'A88648', type: 'Plastic Film', text: '구겨진 포장재에서 발견한 탁한 금빛. 빛을 반사하던 인공적인 표면이 자연물 사이에 놓이며 낯선 질감을 만든다.' },
  // No.031
  'Black-08': { name: 'MURSKY MILK', color: 'E9DBB4', ink: 'black', type: 'Plastic', text: '깨끗한 흰 플라스틱 용기 속 비치는 바나나 우유의 색. 자연의 어두운 색과 대비되며 너무 익숙해서 쉽게 지나치는 일상의 색을 드러낸다.' },
  // No.032
  'Orange-18': { name: 'PAPER BEIGE', color: 'E2C7AD', ink: 'black', type: 'Paper', text: '찢겨진 종이 포장에서 발견한 부드러운 베이지색. 한때 물건을 담고 보호하던 종이는 버려진 뒤 자연과 인공의 경계를 흐리며 남아 있다.' },
  // No.033
  'Orange-14': { name: 'BIN MUSTARD', color: 'E6C559', type: 'Other', text: '길가에 놓인 노란 봉투에서 발견한 탁한 겨자색. 자연의 흙빛과 닮은 색을 가진 비닐은 오히려 자연 속에서 쉽게 모습을 감춘다.' },
  // No.034
  'Yellow-06': { name: 'FADED LEMON', color: 'EBE87B', ink: 'black', type: 'Plastic Film', text: '풀숲 사이에 버려진 과자 포장에서 발견한 밝은 레몬색. 자연의 초록 사이에 자리 잡은 인공적인 노란색이 마치 하나의 식물처럼 보인다.' },
  // No.035
  'Yellow-02': { name: 'WASTE KICK', color: 'F0C400', type: 'Plastic Film', text: '땅에 떨어진 과자 포장에서 발견한 선명한 노란색.\n먹는 순간을 위해 만들어진 포장이 소비 이후에는 자연 속에 남겨진 인공적인 색이 된다.' },
  // No.036
  'Yellow-03': { name: 'FOGGY YELLOW', color: 'F3F55E', ink: 'black', type: 'Plastic Film', text: '반투명한 비닐에서 발견한 흐릿한 노란빛. 빛을 통과시키는 얇은 막이 자연의 색과 겹쳐지며 쉽게 구분되지 않는 풍경을 만든다.' },
  // No.037
  'Yellow-08': { name: 'PLASTIK YELLOW', color: 'FCE435', ink: 'black', type: 'Plastic', text: '아스팔트 위 노란 조각에서 발견한 강렬한 신호색. 위험을 알리는 듯한 색이지만 반복되는 거리의 풍경\n속에서는 쉽게 무시된다.' },
  // No.038
  'Yellow-05': { name: 'DUST YELLOW', color: 'CFB86C', type: 'Paper', text: '풀과 흙밭 속 노란 포장재에서 발견한 탁한 황색. 자연의 흙빛과 비슷한 색을 가진 인공물이 어느새 풍경 속에 자연스럽게 섞여 있다.' },
  // No.039
  'Orange-16': { name: 'CARDBOARD GOLD', nameSpacing: '-0.03em', color: 'E1C157', type: 'Paper', text: '쌓여 있는 폐박스에서 발견한 바랜 황금빛. 상품을 담았던 종이상자는 소비가 끝난 뒤 또 다른 도시의 풍경을 구성한다.' },
  // No.040
  'Orange-20': { name: 'DIRTY HONEY', color: 'CEB057', type: 'Plastic Film', text: '풀숲에 남겨진 과자 포장지에서 발견한 달콤한 꿀빛. 먹고 남은 포장은 자연의 갈색과 비슷한 색을 띠며\n조용히 주변에 스며든다.' },
  // No.041
  'Yellow-09': { name: 'COCA CAN MOSS', color: 'CECE51', type: 'Metal', text: '돌 위에 놓인 찌그러진 캔에서 발견한 탁한 이끼색. 자연의 초록과 닮아버린 인공적인 색은 버려진 물건과 주변 환경의 경계를 흐린다.' },
  // No.042
  'Green-04': { name: 'THROWN GREENTEA', nameSize: 90.15, nameSpacing: '-0.05em', color: '96A942', type: 'Plastic', text: '초록빛이 번진 바닥 위에서 발견한 투명 플라스틱 컵. 버려진 컵과 주변의 색이 겹쳐지며 자연인지 폐기물인지 쉽게 구분되지 않는 장면을 만든다.' },
  // No.043
  'Green-05': { name: 'DISCARD NEON', color: '9EF028', ink: 'black', type: 'Plastic', text: '낙엽 사이에서 발견한 라이터의 강렬한 형광 연두색. 자연에서는 보기 어려운 인공적인 색이 오히려 주변의 초록과 섞이며 하나의 풍경이 된다.' },
  // No.044
  'Green-10': { name: 'BOTTLE GREEN', color: '51A452', type: 'Plastic', text: '길가에 투명한 페트병에서 발견한 선명한 라임색. 맑은 물을 담았던 병은 비워진 뒤에도 그 색으로 소비의 흔적을 남긴다.' },
  // No.045
  'Yellow-04': { name: 'PLASTIK LIME', color: 'CBD917', type: 'Plastic', text: '비닐 봉지 속 플라스틱 물체에서 발견한 밝은 연두색. 눈에 잘 띄도록 만들어진 색이지만, 반복되는 일상 속에서는 그 존재마저 익숙해진다.' },
  // No.046
  'Green-11': { name: 'WASTE GREEN', color: '68DC5A', type: 'Paper', text: '풀숲 위에 놓인 포장에서 발견한 부드러운 그린. 자연을 닮은 색을 가진 소비재가 오히려 자연 속에서 낯설지 않게 섞여 있다.' },
  // No.047
  'Green-09': { name: 'TOXIC GREEN', color: '96E95A', type: 'Other', text: '겹겹이 쌓인 초록 비닐봉투에서 발견한 강렬한 녹색. 자연을 연상시키는 색이지만, 그 표면에는 우리가 버린 것들의 흔적이 겹겹이 쌓여 있다.' },
  // No.048
  'Green-03': { name: 'METAL OLIVE', color: '185838', type: 'Metal', text: '오래된 식용유 용기 표면에서 발견한 짙은 올리브색. 일상의 소비를 담았던 금속 용기는 버려진 뒤에도 무게감 있는 색으로 공간에 남아 있다.' },
  // No.049
  'Green-06': { name: 'WORN OLIVE', color: 'A1AE94', type: 'Plastic', text: '돌 틈에 묻힌 낡은 페트병에서 발견한 탁한 올리브색. 버려진 플라스틱은 주변의 자연과 뒤섞이며 오래된 풍경처럼 자리를 잡고 있다.' },
  // No.050
  'Green-07': { name: 'TANGLED GREEN', color: '20764E', type: 'Other', text: '뒤엉킨 그물망 사이에 남겨진 선명한 초록색. 수거를 기다리는 쓰레기들은 서로 얽힌 채, 골목 한편의 익숙한 풍경이 되어간다.' },
  // No.051
  'Green-08': { name: 'GRAFFITI GREEN', color: '025229', type: 'Other', text: '낡은 쓰레기통 위에 덧칠된 거친 초록색. 버려진 공간 위에 또 다른 흔적이 쌓이며, 도시의 시간이 겹겹이 남아 있다.' },
  // No.052
  'Yellow-07': { name: 'FADING OLIVE', nameSize: 90.15, color: 'BDC5A1', ink: 'black', type: 'Paper', text: '길 위에 버려진 오래된 책에서 발견한 바랜 올리브색. 한때 누군가의 공간을 채웠던 기록은 이제 거리의 낯선 잔해가 되었다.' },
  // No.053
  'Blue-07': { name: 'WORN MINT', color: '4FC2BE', type: 'Other', text: '거리 한편에 버려진 소파에서 발견한 바랜 민트색. 누군가의 일상을 담았던 물건은 버려진 뒤에도 한때의 흔적을 고스란히 남긴다.' },
  // No.054
  'Blue-03': { name: 'STAINED TEAL', color: '008499', type: 'Paper', text: '흙과 낙엽 사이 구겨진 포장지에서 발견한 탁한 청록색. 한때 깨끗했던 색은 구겨지고 오염된 채 주변의 잔해와 뒤섞여 있다.' },
  // No.055
  'Orange-02': { name: 'TARNISHED TEAL', color: '165353', type: 'Plastic', text: '모래 위에 찌그러진 포장재에서 발견한 탁한 청록색. 본래의 형태를 잃은 물건은 낯선 풍경 속에서 색만을 남긴 채 놓여 있다.' },
  // No.056
  'Green-02': { name: 'CRUSHED EMERALD', nameSize: 93.15, nameSpacing: '-0.05em', color: '2DB057', type: 'Metal', text: '찌그러진 캔의 틈에서 번지는 어두운 에메랄드색. 한때 가득 차 있던 음료는 사라지고, 구겨진 금속만이 거리 위에 남았다.' },
  // No.057
  'Blue-11': { name: 'FADING SKY', color: '92DBFF', ink: 'black', type: 'Other', text: '흩어진 플라스틱과 포장재에서 발견한 흐린 하늘색. 깨끗한 색을 품은 물건들은 버려진 뒤 서로 겹쳐져 낯선 풍경을 만든다.' },
  // No.058
  'Blue-10': { name: 'SACKED BLUE', color: '0486DB', type: 'Other', text: '골목 위 커다란 쓰레기봉투에서 발견한 짙은 파란색. 무언가를 감추듯 묶인 봉투는 버려진 것들의 마지막 모습을 품고 있다.' },
  // No.059
  'Blue-04': { name: 'ABANDONED COBALT', nameSize: 84.15, nameSpacing: '-0.05em', color: '015BD8', type: 'Paper', text: '쓰레기 사이에 놓인 상자에서 발견한 선명한 코발트색. 익숙한 브랜드의 색은 소비가 끝난 순간, 도시의 잔해 속으로 남겨졌다.' },
  // No.060
  'Blue-08': { name: 'POLLUTED BLUE', color: '2962C2', type: 'Metal', text: '여러 페트병과 캔 사이에서 발견한 탁한 파란색. 한 번의 소비가 남긴 흔적들이 겹쳐지며 거리 위에 하나의 색을 만든다.' },
  // No.061
  'Blue-09': { name: 'FADING COBALT', color: '101A70', type: 'Metal', text: '풀숲 사이에 버려진 캔에서 발견한 짙은 코발트색. 자연 속에 놓인 인공적인 색은 쉽게 사라지지 않은 채 오래 남아 있다.' },
  // No.062
  'Blue-12': { name: 'DIRTY COBALT', nameSize: 90.15, nameSpacing: '-0.05em', color: '003A9D', hex: '96A942', type: 'Plastic', text: '아스팔트 위 흩어진 병뚜껑의 선명한 코발트색. 작고 가벼운 플라스틱 조각은 발길에 밀려나며 도시 곳곳에 남겨진다.' },
  // No.063
  'Blue-02': { name: 'STAINED BLUE', color: '7AA5CE', type: 'Paper', text: '길가에 버려진 물통에서 발견한 탁한 푸른색. 구겨진 표면과 얼룩진 흔적 사이로 남은 색이 버려진 시간을 드러낸다.' },
  // No.064
  'Blue-06': { name: 'WORN AQUA', color: '63E5FD', ink: 'black', type: 'Plastic', text: '돌 사이에 놓인 낡은 물건에서 발견한 옅은 아쿠아색. 자연의 색 사이에 남겨진 인공적인 빛은 어색하게 풍경에 섞여 있다.' },
  // No.065
  'Blue-13': { name: 'ABANDONED VIOLET', nameSize: 89.15, nameSpacing: '-0.05em', color: '453492', type: 'Plastic', text: '나뭇잎 사이에 버려진 페트병에서 발견한 흐린 보라색. 비어버린 병은 자연에 기대어 놓인 채, 누군가의 소비가 남긴 흔적이 되었다.' },
  // No.066
  'Purple-09': { name: 'WORN VIOLET', color: '8944BB', type: 'Other', text: '길 위에 버려진 장갑에서 발견한 낡은 보랏빛. 한때 손을 보호하던 물건은 이제 차가운 바닥 위에 홀로 남아 있다.' },
  // No.067
  'Blue-05': { name: 'DIRTY VIOLET', color: '503393', type: 'Other', text: '보도 위에 흩어진 천에서 발견한 짙은 보랏빛. 구겨지고 늘어진 천은 본래의 쓰임을 잃은 채 거리의 일부가 되어간다.' },
  // No.068
  'Purple-02': { name: 'POLLUTED PURPLE', nameSpacing: '-0.05em', color: '5B2382', type: 'Plastic', text: '쓰레기통을 뒤덮은 봉투에서 발견한 강렬한 보라색. 화려한 색과 뒤섞인 쓰레기들은 도시의 일상적인 풍경처럼 놓여 있다.' },
  // No.069 (피그마 No.073)
  'Orange-21': { name: 'STALE OCHRE', color: 'C4AE77', type: 'Plastic', text: '길 위에 쓰러진 음료병에서 발견한 탁한 황색. 남겨진 음료와 먼지가 뒤섞인 병은 한때의 소비를 그대로 품고 있다.' },
  // No.070 (피그마 No.074)
  'Orange-09': { name: 'RUSTED OCHRE', color: 'B37C4B', type: 'Other', text: '거칠게 부식된 물체에서 발견한 탁한 황토색. 오랜 시간 방치된 표면에는 녹과 먼지가 겹쳐져 시간이 색처럼 쌓여 있다.' },
  // No.071 (피그마 No.075)
  'Orange-05': { name: 'WEATHERED BROWN', nameSize: 85.15, nameSpacing: '-0.05em', color: '6F5445', type: 'Other', text: '부서진 목재와 폐자재 사이에서 발견한 바랜 갈색. 한때 건물의 일부였던 재료들은 해체된 뒤 또 다른 형태의 잔해가 되었다.' },
  // No.072 (피그마 No.076)
  'Brown-01': { name: 'STALE AMBER', color: '81552B', type: 'Glass', text: '버려진 유리병 사이에서 발견한 오래된 호박색. 빛을 머금던 병들은 이제 비워진 채 서로 기대어 버려진 시간만을 남긴다.' },
  // No.073 (피그마 No.077)
  'Red-17': { name: 'STAINED BROWN', color: '44281B', type: 'Glass', text: '담배꽁초가 쌓인 재떨이에서 발견한 탁한 갈색. 수많은 흔적이 겹쳐진 표면은 반복된 소비의 시간을 고스란히 보여준다.' },
  // No.074 (피그마 No.078)
  'Red-01': { name: 'CRUSHED CRIMSON', nameSpacing: '-0.05em', color: '2C1C1C', type: 'Plastic Film', text: '짓눌린 사탕 포장지에서 발견한 어두운 크림슨색. 한때 선명했던 포장은 구겨진 채 바닥에 남아 소비의 끝을 보여준다.' },
  // No.075 (피그마 No.079)
  'Orange-07': { name: 'ASHEN BEIGE', color: 'A47A4B', type: 'Other', text: '길 위에 쌓인 담배꽁초에서 발견한 탁한 베이지색. 수없이 버려진 흔적들은 작은 조각이 되어 바닥에 오래 남아 있다.' },
  // No.076 (피그마 No.080)
  'Orange-04': { name: 'ROTTEN AMBER', color: '96491B', type: 'Other', text: '썩어가는 버섯 사이에서 발견한 탁한 갈색과 황금빛. 자연스럽게 사라지는 것과 오래 남겨지는 것의 경계가 한 장면 안에 겹쳐 있다.' },
  // No.077 (피그마 No.081)
  'Black-05': { name: 'SOILED BLACK', color: '111111', type: 'Plastic Film', text: '검은 봉투 안에 남겨진 음식물에서 발견한 깊은 검정색. 버려진 것들은 봉투 안에서 뒤섞인 채 보이지 않는 풍경으로 남아 있다.' },
  // No.078 (피그마 No.082)
  'Orange-06': { name: 'WORN CHARCOAL', nameSize: 90.15, color: '2C313B', type: 'Plastic', text: '거리 한편에 버려진 스피커에서 발견한 짙은 차콜색. 소리를 내던 물건은 기능을 잃은 뒤 조용한 도시의 잔해가 되었다.' },
  // No.079 (피그마 No.083)
  'Black-03': { name: 'FADED BLACK', color: '46474C', type: 'Other', text: '길 위에 버려진 장갑에서 발견한 바랜 검정색. 한때 누군가의 손을 감싸던 물건은 차가운 바닥 위에 홀로 남아 있다.' },
  // No.080 (피그마 No.084)
  'Green-01': { name: 'SOILED BLACK', color: '010400', type: 'Other', text: '나뭇잎을 담고 있는 쓰레기봉투의 검은색. 버려진 봉투와 그 틈을 뚫고 나온 식물은 인공적인 것과 자연적인 것이 뒤섞인 장면을 만든다.' },
  // No.081 (피그마 No.089)
  'White-03': { name: 'SOILED IVORY', color: 'F9F3E4', ink: 'black', type: 'Paper', text: '바닥에 버려진 종이컵에서 발견한 탁한 아이보리색. 깨끗했던 표면에는 시간이 지나며 먼지와 흔적이 하나씩 내려앉았다.' },
  // No.082 (피그마 No.090)
  'Red-12': { name: 'CRUSHED SILVER', color: 'C1C5CE', ink: 'black', type: 'Metal', text: '짓눌린 캔에서 발견한 거칠고 차가운 은색. 반짝이던 금속은 찌그러진 뒤에도 빛을 잃지 않은 채 바닥에 남아 있다.' },
  // No.083 (피그마 No.091)
  'White-05': { name: 'WORN WHITE', color: 'DEE4ED', ink: 'black', type: 'Metal', text: '구겨진 음료 캔에서 발견한 낡은 흰색. 본래의 깨끗함을 잃은 종이는 바닥의 먼지와 섞여 오래된 흔적처럼 남는다.' },
  // No.084 (피그마 No.092)
  'White-04': { name: 'STAINED WHITE', nameSize: 90.15, color: 'FAFAFA', ink: 'black', type: 'Other', text: '풀숲 사이에 버려진 용기에서 발견한 탁한 흰색. 깨끗한 표면 위로 자연의 흔적이 겹쳐지며 버려진 시간을 드러낸다.' },
  // No.085 (피그마 No.093)
  'Black-06': { name: 'DIRTY CLEAR', color: 'D2D9DB', ink: 'black', type: 'Plastic', text: '길 위에 버려진 투명 컵에서 발견한 흐릿한 투명색. 투명했던 물체는 먼지와 오염을 머금은 채 더 이상 깨끗하지 않은 빛을 반사한다.' },
  // No.086 (피그마 No.094)
  'Black-07': { name: 'ABANDONED WHITE', nameSize: 91.15, nameSpacing: '-0.05em', color: 'F5FCFF', ink: 'black', type: 'Plastic', text: '도로 위에 버려진 치실에서 발견한 선명한 푸른빛 흰색. 무언가를 걸어두던 일상의 도구는 쓰임을 잃고 길 위에 홀로 남았다.' },
  // No.087 (피그마 No.095)
  'Yellow-01': { name: 'SOILED WHITE', color: 'E1E5EB', hex: 'DBE0E9', ink: 'black', type: 'Plastic Film', text: '찢어진 비닐봉투에서 발견한 탁한 흰색. 가벼운 비닐은 바람에 흩어진 뒤 거리 곳곳에 오래 남는 흔적이 된다.' },
  // No.088 (피그마 No.096)
  'Black-01': { name: 'FADING CLEAR', color: 'CDD2D9', ink: 'black', type: 'Other', text: '풀숲에 방치된 비닐 포장재에서 발견한 흐린 투명색. 자연을 비추던 얇은 표면은 주변의 색을 머금은 채 풍경 속에 묻혀간다.' },
  // No.089 (피그마 No.097)
  'White-01': { name: 'TOXIC WHITE', color: 'EAEAEA', ink: 'black', type: 'Metal', text: '풀숲에 버려진 일회용 캔에서 발견한 낡은 흰색. 찌그러진 용기들은 본래의 형태를 잃은 채 자연과 뒤섞여 남아 있다.' },
  // No.090 (피그마 No.098)
  'White-02': { name: 'WORN WHITE', color: 'E4E5E5', ink: 'black', type: 'Plastic Film', text: '건물 틈에 놓인 낡은 봉투에서 발견한 흐린 흰색. 한때 깨끗했던 비닐은 구겨지고 늘어진 채 도시의 한구석에 남았다.' },
  // No.091 (피그마 No.099)
  '#2508': { name: 'STAINED IVORY', color: 'E0DDD8', ink: 'black', type: 'Plastic', text: '흩어진 일회용 용기에서 발견한 탁한 아이보리색. 깨끗했던 용기들은 버려진 뒤 서로 겹쳐지며 하나의 무질서한 풍경을 만든다.' },
  // No.092 (피그마 No.100)
  '#2513': { name: 'STYROFOAM WHITE', nameSpacing: '-0.05em', color: 'F8F9FD', ink: 'black', type: 'Other', text: '자갈 위에 버려진 포장 용기에서 발견한 바랜 흰색. 단단했던 형태는 바닥에 놓인 채 낡아가며 주변의 풍경 속으로 천천히 묻혀간다.' },
  // No.093 (피그마 No.088)
  'Blue-01': { name: 'STAINED BLACK', color: '515353', type: 'Paper', text: '버려진 커피컵과 담배꽁초에서 발견한 탁한 검정색. 한 번의 소비가 남긴 작은 흔적들이 길 위에 겹겹이 쌓여 있다.' },
  // No.094 (피그마 No.072)
  'Purple-03': { name: 'ABANDONED PURPLE', nameSize: 85.15, nameSpacing: '-0.05em', color: '655088', type: 'Metal', text: '여러 플라스틱 물건 사이에서 발견한 깊은 보랏빛. 일상에서 사용되던 물건들은 버려진 순간 하나의 색 덩어리처럼 쌓여 있다.' },
  // No.095 (피그마 No.087)
  'Orange-08': { name: 'WORN BLACK', color: '272929', type: 'Other', text: '폐자재 속 버려진 검은 물체에서 발견한 낡은 검정색. 부서지고 뒤섞인 잔해 속에서 한때의 물건은 형태만 남긴 채 놓여 있다.' },
  // No.096 (피그마 No.070)
  'Purple-04': { name: 'DIRTY PURPLE', color: '7546C9', type: 'Plastic', text: '흙과 자갈 위에 버려진 물병에서 발견한 탁한 보랏빛. 찌그러진 플라스틱 표면에 묻은 먼지가 색을 더욱 낡고 거칠게 만든다.' },
  // No.097 (피그마 No.085)
  'Black-02': { name: 'DISCARDED BLACK', nameSpacing: '-0.03em', color: '353535', type: 'Plastic', text: '겹겹이 쌓인 검은 용기에서 발견한 깊은 검정색. 한 번의 사용을 끝낸 용기들은 서로 포개진 채 도시의 잔해처럼 쌓여 있다.' },
  // No.098 (피그마 No.069)
  'Purple-01': { name: 'STAINED LILAC', color: 'C59CCF', type: 'Paper', text: '바닥에 흘러 굳은 흔적에서 발견한 탁한 라일락색. 깨끗했던 색은 바닥에 얼룩처럼 남아 쉽게 지워지지 않는 흔적이 되었다.' },
  // No.099 (피그마 No.071)
  'Purple-06': { name: 'WORN VIOLET', color: '6E3DD3', type: 'Other', text: '길 위에 떨어진 천 조각에서 발견한 짙은 보랏빛. 바닥에 구겨진 채 놓인 천은 지나가는 사람들의 발끝 아래에서 천천히 닳아간다.' },
  // No.100 (피그마 No.086)
  'Black-04': { name: 'MUDDY OLIVE', color: '2B3F3F', type: 'Other', text: '흙과 먼지에 뒤덮인 타이어에서 발견한 탁한 올리브색. 오랜 시간 길 위를 굴렀던 흔적이 표면에 그대로 남아 있다.' },
}

// 목록 필터: Waste Type 재질 또는 Similar Colors 색
type Material = (typeof MATERIALS)[number]['name']
type Filter = { kind: 'material'; value: Material } | { kind: 'color'; value: WasteColor }

// 필터별 그리드 줄 배치 (피그마 필터 화면 그대로). 칸은 전체 그리드와 같은 사진 이름·내보내기 번호
const FILTER_ROWS: Record<Material | WasteColor, Cell[][]> = {
  Paper: [
    ['Red-21', 'Red-11', 'Orange-15', 'Orange-03'],
    ['Orange-18', 'Orange-16', 'Yellow-07', 'Green-11'],
    ['Blue-11', 'Blue-04', 2398, 'White-03'],
    ['Blue-01', 2508],
  ],
  Glass: [
    ['Orange-10', 'Orange-17', 'Brown-01'],
  ],
  Metal: [
    ['Red-10', 'Red-18', 'Red-16', 'Red-03'],
    ['Yellow-09', 'Green-03', 2365, 2373],
    ['Blue-11', 'Blue-08', 'Blue-09', 'Purple-03'],
    ['Orange-08', 'Red-12', 'White-05', 2500],
  ],
  Plastic: [
    ['Red-14', 2207, 'Red-02', 'Orange-13'],
    ['Orange-19', 'Black-08', 'Yellow-08', 'Green-04'],
    ['Green-05', 'Green-10', 'Yellow-04', 'Green-06'],
    ['Blue-11', 'Blue-12', 'Blue-06', 'Blue-13'],
    ['Purple-04', 'Orange-21', 'Black-06', 'Black-07'],
    ['Black-02', 2508],
  ],
  'Plastic Film': [
    [2183, 2202, 2221, 'Red-19'],
    [2232, 'Orange-12', 'Orange-13', 'Yellow-06'],
    ['Yellow-02', 'Yellow-05', 'Orange-20', 'Red-01'],
    ['Black-05', 2467, 'Yellow-01'],
  ],
  Other: [
    ['Red-15', 'Purple-07', 'Purple-08', 'Red-20'],
    ['Red-09', 'Red-13', 2212, 'Orange-11'],
    ['Orange-03', 'Orange-22', 'Orange-14', 'Yellow-03'],
    ['Green-09', 'Green-07', 'Green-08', 'Blue-07'],
    ['Blue-10', 'Purple-09', 'Blue-05', 2417],
    ['Purple-01', 'Purple-06', 'Orange-09', 2430],
    ['Red-17', 'Orange-07', 2457, 2462],
    ['Black-04', 'White-04', 'Black-01', 2513],
  ],
  Red: [
    ['Red-15', 'Purple-07', 'Purple-08', 'Red-21'],
    ['Red-10', 'Red-20', 'Red-18', 2183],
    ['Red-09', 'Red-11', 'Red-13', 'Red-14'],
    [2202, 2207, 2212, 'Red-02'],
    [2221, 'Red-16', 'Red-19', 2232],
  ],
  Orange: [
    ['Orange-10', 'Orange-11', 'Orange-12', 'Red-03'],
    ['Orange-15', 'Orange-13', 'Orange-03', 'Orange-17'],
    ['Orange-19', 'Orange-22', 'Black-08', 'Orange-18'],
  ],
  Yellow: [
    ['Orange-14', 'Yellow-06', 'Yellow-02', 'Yellow-03'],
    ['Yellow-08', 'Yellow-05', 'Orange-16', 'Orange-20'],
  ],
  Green: [
    ['Yellow-09', 'Green-04', 'Green-05', 'Green-10'],
    ['Yellow-04', 'Green-11', 'Green-09', 'Green-03'],
    ['Green-06', 'Green-07', 'Green-08', 'Yellow-07'],
  ],
  Blue: [
    ['Blue-07', 2365, 'Orange-02', 2373],
    ['Blue-11', 'Blue-10', 'Blue-04', 'Blue-08'],
    ['Blue-09', 'Blue-12', 2398, 'Blue-06'],
  ],
  Purple: [
    ['Blue-13', 'Purple-09', 'Blue-05', 2417],
    ['Purple-01', 'Purple-04', 'Purple-06', 'Purple-03'],
  ],
  Brown: [
    ['Orange-21', 'Orange-09', 2430, 'Brown-01'],
    ['Red-17', 'Red-01', 'Orange-07', 2448],
  ],
  Black: [
    ['Black-05', 2457, 2462, 2467],
    ['Black-02', 'Black-04', 'Orange-08', 'Blue-01'],
  ],
  White: [
    ['White-03', 'Red-12', 'White-05', 'White-04'],
    ['Black-06', 'Black-07', 'Yellow-01', 'Black-01'],
    [2500, 'White-02', 2508, 2513],
  ],
}
const filterRows = (f: Filter) => FILTER_ROWS[f.value]
const filterCells = (f: Filter): GridCell[] =>
  filterRows(f).flatMap((row, j) => row.map((cell, k) => ({ key: `f-${j}-${k}`, cell })))

// 그리드 칸. key 는 칸을 찾고(data-cell-key) 확대 중 숨기는 데 쓴다
type GridCell = { key: string; cell: Cell }
// 전체 그리드: key 는 블록-줄-칸 번호
const GRID_CELLS: GridCell[] = GRID.flatMap((block, i) =>
  block.rows.flatMap((row, j) => row.map((cell, k) => ({ key: `${i}-${j}-${k}`, cell }))),
)
const GRID_NO = new Map<string, number>()
for (const { cell } of [...GRID_CELLS, ...Object.values(FILTER_ROWS).flat(2).map((cell) => ({ cell }))]) {
  if (!GRID_NO.has(cellId(cell))) GRID_NO.set(cellId(cell), GRID_NO.size + 1)
}
const COLOR_OF = new Map(WASTE_PHOTOS.map((p) => [p.name, p.color]))
const detailOf = (cell: Cell): Partial<CellDetail> => CELL_DETAILS[cellId(cell)] ?? {}
const panelColor = (cell: Cell) => {
  const { color: hex } = detailOf(cell)
  if (hex) return `#${hex}`
  const color = COLOR_OF.get(photoName(cell) ?? '')
  return (color && COLOR_FILL[color]) || '#000000'
}
const cellEl = (key: string) => document.querySelector<HTMLImageElement>(`[data-cell-key="${key}"]`)

const rectOf = (el: Element) => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

// 화면 축소(zoom) 영향을 받지 않도록 body 에 띄운다. 크기는 1920 기준 px 에 축소 배율(--z)을 곱해 화면 px 로 쓴다
// hover 로 커진 사진 자리에서 그대로 이어 커지고, 닫으면(확대 중 아무 곳 클릭, ✕, Esc) 지금 보고 있는 사진의 칸 자리로 줄어든다
function CellZoom({
  cells,
  cellKey,
  onNavigate,
  onClosed,
}: {
  cells: GridCell[] // 지금 그리드에 보이는 칸 (이전/다음 순서)
  cellKey: string
  onNavigate: (key: string) => void
  onClosed: () => void
}) {
  const [openKey] = useState(cellKey)
  const [phase, setPhase] = useState<'zoom' | 'detail'>('zoom')
  const rootRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const closeRef = useRef(() => {})
  const swapped = useRef(false)
  const cell = cells.find((c) => c.key === cellKey)?.cell ?? ''
  const detail = detailOf(cell)
  const panel = panelColor(cell)

  // 열기: 칸 → 화면 가운데 확대 → 잠시 머문 뒤 상세 화면
  useLayoutEffect(() => {
    const root = rootRef.current
    const img = imgRef.current
    const label = labelRef.current
    const from = cellEl(openKey)
    if (!root || !from) return
    const z = parseFloat(getComputedStyle(from.closest('.archiving') ?? from).zoom) || 1
    root.style.setProperty('--z', String(z))
    const width = ZOOM_W * z
    const height = ZOOM_H * z
    const to = { left: (innerWidth - width) / 2, top: (innerHeight - height) / 2, width, height }

    // 칸은 이 렌더에서 숨겨졌지만 hover 확대가 풀리기 전이라 커진 자리 그대로 잰다
    const tl = gsap.timeline()
    tl.fromTo(img, rectOf(from), { ...to, duration: ZOOM_DURATION, ease: ZOOM_EASE })
    tl.fromTo(
      label,
      { opacity: 0, top: to.top + ZOOM_LABEL_TOP * z },
      { opacity: 1, duration: ZOOM_LABEL_FADE },
      ZOOM_DURATION * 0.7,
    )
    tl.call(() => setPhase('detail'), [], `+=${ZOOM_HOLD}`)
    tlRef.current = tl

    // 열려 있는 동안 스크롤을 막는다 (overflow 를 바꾸면 스크롤바 폭만큼 화면 배율이 바뀌어서 이벤트로 막는다)
    const keys = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'])
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      else if (keys.has(e.key)) e.preventDefault()
    }
    const block = (e: Event) => e.preventDefault()
    addEventListener('keydown', onKey)
    addEventListener('wheel', block, { passive: false })
    return () => {
      tl.kill()
      gsap.killTweensOf([img, label])
      removeEventListener('keydown', onKey)
      removeEventListener('wheel', block)
    }
  }, [openKey])

  // 상세: 사진은 왼쪽 절반을 채우고, 패널은 오른쪽에서 들어온 뒤 내용이 차례로 나타난다
  useLayoutEffect(() => {
    if (phase !== 'detail') return
    const img = imgRef.current
    const panelEl = panelRef.current
    const detailEl = detailRef.current
    gsap.to(labelRef.current, { opacity: 0, duration: ZOOM_LABEL_FADE, overwrite: true })
    gsap.to(img, { left: 0, top: 0, width: innerWidth / 2, height: innerHeight, duration: DETAIL_DURATION, ease: DETAIL_EASE })
    gsap.fromTo(panelEl, { xPercent: 100 }, { xPercent: 0, duration: DETAIL_DURATION, ease: DETAIL_EASE })
    if (detailEl)
      gsap.fromTo(
        detailEl.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05, delay: DETAIL_DURATION * 0.6 },
      )
  }, [phase])

  // 이전/다음: 사진과 내용을 바꾼 뒤 서서히 나타낸다 (처음 열 때는 건너뛴다)
  useLayoutEffect(() => {
    if (!swapped.current) {
      swapped.current = true
      return
    }
    const detailEl = detailRef.current
    gsap.fromTo([imgRef.current, detailEl], { opacity: 0 }, { opacity: 1, duration: DETAIL_SWAP, ease: 'power1.out' })
  }, [cellKey])

  // 닫기: 지금 보고 있는 사진의 칸으로 줄어든다. 칸이 화면 밖이면 먼저 칸이 보이게 스크롤한다
  useLayoutEffect(() => {
    let closing = false
    closeRef.current = () => {
      const to = cellEl(cellKey)
      if (closing || !to) return
      closing = true
      tlRef.current?.kill()
      const r = to.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) scrollBy(0, r.top - (innerHeight - r.height) / 2)
      gsap.to([labelRef.current, detailRef.current], { opacity: 0, duration: ZOOM_LABEL_FADE, overwrite: true })
      gsap.to(panelRef.current, { xPercent: 100, duration: ZOOM_DURATION, ease: ZOOM_EASE })
      gsap.to(imgRef.current, { ...rectOf(to), duration: ZOOM_DURATION, ease: ZOOM_EASE, overwrite: true, onComplete: onClosed })
    }
  })

  const step = (d: number) => {
    const i = cells.findIndex((c) => c.key === cellKey)
    onNavigate(cells[(i + d + cells.length) % cells.length].key)
  }
  // 피그마에 정해 둔 글자색. 내용이 없는 사진은 패널 밝기로 정한다
  const ink = detail.color ? (detail.ink === 'black' ? '#000000' : '#ffffff') : inkOn(panel)

  return createPortal(
    <div
      ref={rootRef}
      className={`archiving-zoom${phase === 'detail' ? ' archiving-zoom--detail' : ''}`}
      onClick={() => phase === 'zoom' && closeRef.current()}
    >
      <img ref={imgRef} className="archiving-zoom__img" src={cellSrc(cell)} alt="" />
      {/* 번호는 사진의 패널 색으로 쓴다 (피그마 예시 #8B0113 이 붉은 망 사진의 패널 색) */}
      <p ref={labelRef} className="archiving-zoom__label" style={{ color: panel }}>
        {cellLabel(cell)}
      </p>
      {phase === 'detail' && (
        <>
          <div ref={panelRef} className="archiving-detail__panel" style={{ background: panel }} />
          {/* 1920×1080 피그마 좌표 그대로 두고 화면 배율만큼 줄여 세로 가운데에 둔다 */}
          <div
            ref={detailRef}
            className="archiving-detail"
            style={{ color: ink }}
          >
            {detail.name && (
              <p
                className="archiving-detail__name"
                style={{ fontSize: detail.nameSize, letterSpacing: detail.nameSpacing }}
              >
                {detail.name}
              </p>
            )}
            <p className="archiving-detail__no">(No.{cellNo(cell)})</p>
            {detail.name && <p className="archiving-detail__period">{DETAIL_PERIOD}</p>}
            <img className="archiving-detail__thumb" src={cellSrc(cell)} alt="" />
            {detail.color && <p className="archiving-detail__hex"># {detail.hex ?? detail.color}</p>}
            {detail.text && <p className="archiving-detail__text">{detail.text}</p>}
            {detail.type && <p className="archiving-detail__type">{`Waste Type\n${detail.type}`}</p>}
            <button type="button" className="archiving-detail__close" aria-label="닫기" onClick={() => closeRef.current()}>
              ✕
            </button>
            <button type="button" className="archiving-detail__arrow archiving-detail__arrow--prev" aria-label="이전 사진" onClick={() => step(-1)}>
              <svg viewBox="0 0 15 32.14" aria-hidden="true">
                <polyline points="14,1 1,16.07 14,31.14" />
              </svg>
            </button>
            <button type="button" className="archiving-detail__arrow archiving-detail__arrow--next" aria-label="다음 사진" onClick={() => step(1)}>
              <svg viewBox="0 0 15 32.14" aria-hidden="true">
                <polyline points="1,1 14,16.07 1,31.14" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
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
  usePinFloat(ref)
  useLineHighlight(ref)
  useRise(ref)
  useSlideIn(ref)
  useEnter(ref)
  const [zoomKey, setZoomKey] = useState<string | null>(null)
  const closeZoom = useCallback(() => setZoomKey(null), [])
  const [filter, setFilter] = useState<Filter | null>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const shownCells = useMemo(() => (filter ? filterCells(filter) : GRID_CELLS), [filter])
  // 목록을 누르면 그 타입·색으로 거르고 필터 제목으로 내려간다. 같은 줄을 다시 누르면 전체로 돌아간다
  const pick = (next: Filter) => {
    const same = filter?.value === next.value
    setFilter(same ? null : next)
    if (!same) requestAnimationFrame(() => headRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }
  // 필터 제목 위 버튼: Waste Type 목록으로 돌아간다
  const backToList = () =>
    document.querySelector('[data-list="materials"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

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
            src={item.figma ? figmaSrc(item.name) : objectSrc(item.name)}
            alt=""
            style={itemStyle(item)}
            data-pin-start={item.pin === 'start' ? item.name : undefined}
            data-pin-end={item.pin === 'end' ? item.name : undefined}
            data-enter={item.enter}
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
        <img className="archiving__figma" src={figmaSrc('cigarette')} alt="" data-enter="down" style={{ ...at(714, 462), width: 290 }} />
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
        <img
          className="archiving__figma"
          src={figmaSrc('cup-coffee-tilt')}
          alt=""
          style={{ ...at(131, 1662), width: 336.5, height: 344.8 }}
          data-pin-start="cup-coffee"
          // 컵은 아랫부분 기준으로 고정
          data-pin-anchor="bottom"
        />

        {/* 질문과 분류 선택 */}
        <h2 className="archiving__heading" style={at(287, 2384)} data-line-highlight="question">
          WHERE DID THIS COLOR COME FROM?
        </h2>
        <h2 className="archiving__heading archiving__heading--dim" style={at(461, 2492)} data-line-highlight="explore">
          Explore the traces we found.
        </h2>
        <img
          className="archiving__figma"
          src={figmaSrc('cup-coffee-tilt')}
          alt=""
          style={{ ...at(131, 2704), width: 336.5, height: 344.8 }}
          data-pin-end="cup-coffee"
        />
        <span className="archiving__paren archiving__paren--sm" style={at(375, 2719)}>(</span>
        <RiseWord group="waste-type" style={at(507, 2732)}>Waste</RiseWord>
        <RiseWord group="waste-type" style={at(533, 2837)}>Type</RiseWord>
        <span className="archiving__paren archiving__paren--sm" style={at(799, 2719)}>)</span>
        <span className="archiving__paren archiving__paren--sm" style={at(1059, 2719)}>(</span>
        <RiseWord group="similar-colors" style={at(1175.16, 2732)}>Similar</RiseWord>
        <RiseWord group="similar-colors" style={at(1190.16, 2837)}>Colors</RiseWord>
        <span className="archiving__paren archiving__paren--sm" style={at(1482.16, 2719)}>)</span>

        {/* Waste Type */}
        <span className="archiving__paren" style={at(163, 3571)}>(</span>
        {/* 캔 더미 사진: 레이어명이 로컬 파일과 맞지 않아 피그마 140:2152 내보내기 사용 */}
        <img className="archiving__photo" src={figmaSrc('cans')} alt="" style={at(329, 3505)} />
        <span className="archiving__paren" style={at(799, 3571)}>)</span>
        {/* 피그마에는 없음. Similar Colors 제목과 짝을 맞춰 캔 사진 아래 왼쪽에 둔다 */}
        <h2 className="archiving__section-title archiving__section-title--waste" data-slide="left">
          Waste Type
        </h2>
        <ul className="archiving__list" style={at(1109, 3451)} data-list="materials">
          {MATERIALS.map(({ name, img }, i) => (
            <li
              key={name}
              className={`archiving__list-item archiving__list-item--material${filter?.value === name ? ' is-active' : ''}`}
              onClick={() => pick({ kind: 'material', value: name })}
            >
              {/* 줄 높이 박스 밖은 잘라서 글자가 아래에서 올라오며 나타난다 (useRise) */}
              <span className="archiving__rise archiving__rise--line">
                <span className="archiving__rise-inner" data-rise="materials">
                  {name}
                </span>
              </span>
              <HoverImg img={img} row={i} />
            </li>
          ))}
        </ul>

        {/* Similar Colors */}
        <ul className="archiving__list" style={at(-1, 4337)} data-list="colors">
          {COLORS.map((c, i) => (
            <li
              key={c}
              className={`archiving__list-item archiving__list-item--color${filter?.value === c ? ' is-active' : ''}`}
              style={fillStyle(COLOR_FILL[c])}
              onClick={() => pick({ kind: 'color', value: c })}
            >
              <span className="archiving__rise archiving__rise--line">
                <span className="archiving__rise-inner" data-rise="colors">
                  {c}
                </span>
              </span>
              <HoverImg img={COLOR_IMG[c]} row={i} />
            </li>
          ))}
        </ul>
        <span className="archiving__paren" style={at(1051, 4686.5)}>(</span>
        <img className="archiving__photo" src={photoSrc('Blue-11')} alt="" style={at(1220, 4621)} />
        <span className="archiving__paren" style={at(1686, 4686.5)}>)</span>
        <h2 className="archiving__section-title archiving__section-title--similar" data-slide="right">
          Similar Colors
        </h2>
      </div>

      {/* 필터 제목 (피그마 140:3957 등): 버튼 → 구분선 → 타입·색 이름. 필터를 고르면 그리드가 140px 올라와 그 아래에 붙는다 */}
      {filter && (
        <div ref={headRef} className="archiving__filter-head">
          {/* 피그마는 색 필터에서도 'Waste Type →' 이다 */}
          <button type="button" className="archiving__filter-back" onClick={backToList}>
            Waste Type →
          </button>
          <span className="archiving__filter-rule" aria-hidden="true" />
          <h2 className={`archiving__filter-title${filter.value === 'White' ? ' archiving__filter-title--outline' : ''}`}>
            {filter.value}
            {/* 색 필터는 이름 옆에 그 색 원 */}
            {filter.kind === 'color' && (
              <span className="archiving__filter-dot" style={{ background: COLOR_FILL[filter.value] ?? '#000000' }} />
            )}
          </h2>
        </div>
      )}

      {/* 사진 그리드: 전체는 피그마 블록 배치, 필터는 피그마 필터 화면의 줄 배치 */}
      <div key={filter?.value ?? 'all'} className={`archiving__grid${filter ? ' archiving__grid--filtered' : ''}`}>
        {(filter ? [{ rows: filterRows(filter) } as Block] : GRID).map((block, i) => (
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
                {row.map((cell, k) => {
                  const key = filter ? `f-${j}-${k}` : `${i}-${j}-${k}`
                  return (
                    <figure key={k} className="archiving__cell">
                      <img
                        className="archiving__cell-img"
                        src={cellSrc(cell)}
                        alt=""
                        loading="lazy"
                        // 확대 중에는 칸을 숨기고 확대된 사진이 대신 보인다
                        data-cell-key={key}
                        style={zoomKey === key ? { visibility: 'hidden' } : undefined}
                        onClick={() => setZoomKey(key)}
                      />
                      <figcaption className="archiving__cell-label">{cellLabel(cell)}</figcaption>
                    </figure>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
      {zoomKey && <CellZoom cells={shownCells} cellKey={zoomKey} onNavigate={setZoomKey} onClosed={closeZoom} />}
    </main>
  )
}
