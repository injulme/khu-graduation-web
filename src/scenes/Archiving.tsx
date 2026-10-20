import type { CSSProperties } from 'react'

import { objectSrc, photoSrc, WASTE_PHOTOS, type WasteObject } from '../lib/waste'

const base = import.meta.env.BASE_URL
const calloutSrc = (name: string) => `${base}archiving/${name}.svg`

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

// 사진 그리드: 피그마 블록 → 줄 → 칸 순서. null 은 피그마 레이어명으로 파일을 특정할 수 없어 비워둔 칸
type Cell = string | null
// tight: 이미지-라벨 간격 20px, fixed: 줄 높이 409px 고정 (피그마 값, 나머지 줄은 28px / 413px)
type Block = { rows: Cell[][]; pad?: boolean; tight?: number[]; fixed?: number[] }

const GRID: Block[] = [
  {
    rows: [
      ['Red-15', 'Purple-07', 'Purple-08', 'Red-21'],
      ['Red-10', 'Red-20', 'Red-18', null],
      ['Red-09', 'Red-11', 'Red-13', 'Red-14'],
      [null, null, null, 'Red-02'],
      [null, 'Red-16', 'Red-19', null],
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
      ['Blue-07', null, 'Orange-02', null],
      ['Blue-11', 'Blue-10', 'Blue-04', 'Blue-08'],
      ['Blue-09', 'Blue-12', null, 'Blue-06'],
    ],
  },
  // 피그마에서 이 블록만 padding 10px 이 들어가 있다
  { rows: [['Blue-13', 'Purple-09', 'Blue-05', null]], pad: true },
  {
    rows: [
      ['Orange-21', 'Orange-09', null, 'Brown-01'],
      ['Red-17', 'Red-01', 'Orange-07', null],
    ],
  },
  { rows: [['Black-05', null, null, null]], fixed: [0] },
  {
    rows: [
      ['White-03', 'Red-12', 'White-05', 'White-04'],
      ['Black-06', 'Black-07', 'Yellow-01', 'Black-01'],
      [null, 'White-02', null, null],
    ],
    fixed: [0],
  },
]

const NO = new Map(WASTE_PHOTOS.map((p) => [p.name, p.no]))
// 피그마 표기 그대로 '( No.001)' — 닫는 괄호 앞에 공백 없음. 비운 칸은 피그마 값(001) 유지
const cellLabel = (name: Cell) => `( No.${String((name && NO.get(name)) ?? 1).padStart(3, '0')})`

const at = (x: number, y: number): CSSProperties => ({ left: x, top: y })

export function Archiving() {
  return (
    <main className="archiving">
      <div className="archiving__canvas">
        {/* 상단: 타이틀과 오브젝트 */}
        <h1 className="archiving__title">COLORS WE LEFT BEHIND</h1>
        <span className="archiving__rule archiving__rule--left" aria-hidden="true" />
        <span className="archiving__rule archiving__rule--right" aria-hidden="true" />
        <p className="archiving__sub archiving__sub--left">COLORS WE PASSED BY.</p>
        <p className="archiving__sub archiving__sub--right">
          익숙해서 지나쳤던 색들을 다시 바라봅니다.
          <br />
          우리가 수집한 풍경 속에 남겨진 색의 흔적들.
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
        {/* 담배갑(피그마 image 6346066)은 로컬 파일이 없어 비워둠: 647, 419 / 429.51×449.11 */}
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
        <span className="archiving__arrow" aria-hidden="true">
          ↓
        </span>

        {/* 소개 */}
        <h2 className="archiving__heading archiving__heading--intro">
          COLLECT <span className="archiving__dim">· TRACE · REVEAL</span>
        </h2>
        <p className="archiving__intro">
          {`Since April, we have traveled across the country, photographing discarded objects and collecting the colors found within them. What we discovered was a landscape far more colorful than expected.
These are not colors we created, but colors that already exist in the world we live in.

Discarded things have remained with us for so long that they have become part of the landscape.
We have adapted to a polluted world, until even pollution begins to feel natural.
So, can we really call this colorful world beautiful?`}
        </p>
        <p className="archiving__intro-ko">
          버려진 풍경 속 색을 수집하며, 우리가 자연스럽다고 믿어온 환경을 다시 바라봅니다.
        </p>
        {/* 커피컵(피그마 image 6346080)은 로컬 cup-coffee 와 기울기가 달라 비워둠: 131, 1662 / 336.5×344.8 */}

        {/* 질문과 분류 선택 */}
        <h2 className="archiving__heading" style={at(287, 2384)}>
          WHERE DID THIS COLOR COME FROM?
        </h2>
        <h2 className="archiving__heading archiving__heading--dim" style={at(461, 2492)}>
          Explore the traces we found.
        </h2>
        {/* 커피컵(피그마 image 6346082) 비워둠: 131, 2704 / 336.5×344.8 */}
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
        {/* 캔 더미 사진(피그마 image 6345964)은 레이어명이 로컬 파일과 맞지 않아 비워둠 */}
        <div className="archiving__photo archiving__photo--empty" style={at(329, 3505)} />
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
                {row.map((name, k) => (
                  <figure key={k} className="archiving__cell">
                    {name ? (
                      <img className="archiving__cell-img" src={photoSrc(name)} alt="" loading="lazy" />
                    ) : (
                      <div className="archiving__cell-img archiving__cell-img--empty" />
                    )}
                    <figcaption className="archiving__cell-label">{cellLabel(name)}</figcaption>
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
