import type { CSSProperties } from 'react'

import { objectSrc, type WasteObject } from '../lib/waste'

type Item = {
  name: WasteObject
  // 피그마 값 그대로: 회전 전 크기(w, h), 회전 후 외곽 박스의 좌상단(x, y), 반시계 방향 각도
  w: number
  h: number
  x: number
  y: number
  angle?: number
  blend?: CSSProperties['mixBlendMode']
}

const ITEMS: Item[] = [
  { name: 'lid-red', w: 435.34, h: 359.05, x: -28.13, y: 394.88, angle: -134.18 },
  { name: 'net-green', w: 239.27, h: 338.03, x: 447.28, y: 488.75 },
  { name: 'bag-blue', w: 389, h: 384, x: 981, y: 442, blend: 'darken' },
  { name: 'can-pocari', w: 189.05, h: 305.38, x: 1373.14, y: 497.39 },
  // 이미지 파일에 기울기가 이미 들어가 있어서, 피그마 회전(345×172, 76.1°) 대신 회전 후 외곽 박스 크기로 넣는다
  { name: 'can-coke-crushed', w: 250, h: 376.17, x: 1614.01, y: 456.23 },
]

// 회전 후 외곽 박스 중심에 이미지 중심을 맞춘다
const itemStyle = ({ w, h, x, y, angle = 0, blend }: Item): CSSProperties => {
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
  }
}

export function Archiving() {
  return (
    <main className="archiving">
      <h1 className="archiving__title">COLORS WE LEFT BEHIND</h1>
      <span className="archiving__rule archiving__rule--left" aria-hidden="true" />
      <span className="archiving__rule archiving__rule--right" aria-hidden="true" />
      <p className="archiving__sub archiving__sub--left">COLORS WE PASSED BY.</p>
      <p className="archiving__sub archiving__sub--right">
        익숙해서 지나쳤던 색들을 다시 바라봅니다.
        <br />
        우리가 수집한 풍경 속에 남겨진 색의 흔적들.
      </p>
      <p className="archiving__label">LEFTOVER VALUE</p>
      {ITEMS.map((item) => (
        <img
          key={item.name}
          className="archiving__object"
          src={objectSrc(item.name)}
          alt=""
          style={itemStyle(item)}
        />
      ))}
      <span className="archiving__arrow" aria-hidden="true">
        ↓
      </span>
    </main>
  )
}
