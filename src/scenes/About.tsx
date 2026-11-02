import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { useFitWidth } from '../lib/useFitWidth'
import { objectSrc, photoSrc, type WasteObject } from '../lib/waste'
import '../styles/about.css'

gsap.registerPlugin(ScrollTrigger)

// 피그마 "웹 화면 비율"(1920×12960) 좌표 그대로. 색 구역은 3240 씩 내려가며 같은 틀을 쓴다
const SECTION = 3240

const CAPTION_LEFT = ['버려진 것들을 촬영하고,', '그 안에 남겨진 색을 수집하다.']
const CAPTION_RIGHT = ['자연스럽다고 받아들이기 시작한 풍경을', '다시 낯설게 바라보는 데서 시작하다.']
const QUESTION = '너무 익숙해서, 그 안의 변화를 알아채지 못한 채'

// 첫 화면 그리드 사진 (피그마 칸 순서: 왼쪽 묶음, 오른쪽 묶음 · 한 줄에 둘)
const GRID = [
  { left: 60, photos: ['Black-01', 'Orange-17', 'Yellow-07', 'Orange-07', 'Red-09', 'Red-07'] },
  { left: 1302.87, photos: ['Yellow-01', 'Orange-09', 'White-03', 'Red-17', 'Orange-14', 'Green-06'] },
]
const CELL = { w: 267.2, h: 220.73, gap: 23.23 }

const STRIP = ['Black-08', 'Blue-11', 'Red-07', 'Yellow-07', 'Blue-04']

const READ_LINES = [
  { text: 'We see it every day.', top: 2276 },
  { text: 'So often that we stopped noticing it.', top: 2346 },
  { text: '오랫동안 마주한 오염은 어느새 일상에 스며들고,', top: 2464 },
  { text: '우리는 그 변화마저 자연스러운 풍경으로 받아들인다.', top: 2534 },
]

const H_LINES = [322, 757, 1402, 1837, 2483, 2918]

type Box = { x: number; y: number; w: number; h: number; r?: number }

type Palette = {
  key: string
  no: number
  name: string
  hex: string
  panel: string
  inset: string
  side: string
  object: WasteObject
  objectBox: Box
  heading: string
  titleAt: { x: number; y: number; noX: number; noY: number }
  insetFrom: { x: number; y: number }
  enRight: number
  tagline: string[]
  tags: string
  ko1: string[]
  en: string[]
  ko2: string[]
}

const PALETTES: Palette[] = [
  {
    key: 'red',
    no: 1,
    name: 'RED',
    hex: '8B0113',
    panel: 'Red-13',
    inset: 'Red-07',
    side: 'Red-11',
    object: 'net-red',
    objectBox: { x: 1157, y: 2205.5, w: 649.48, h: 991.18, r: -14.02 },
    heading: 'NETTED SHELLS',
    titleAt: { x: 80, y: 110, noX: 80, noY: 830 },
    insetFrom: { x: 1190, y: 290 },
    enRight: 1224,
    tagline: ['RED IS STILL A WARNING.', 'WE JUST STOPPED NOTICING IT.'],
    tags: 'VISIBLE / PERSISTENT / IGNORE',
    ko1: ['가장 먼저 눈에 들어오는 색,', '그리고 가장 쉽게 지나쳐버린 경고.'],
    en: [
      'THE COLOR WE STOPPED NOTICING.',
      'Once a color of warning,',
      'red now remains in the things we throw away.',
      'The warning is still there.',
      'We have simply learned to live with it.',
    ],
    ko2: [
      '우리가 수집한 풍경 속 빨강은',
      '버려진 플라스틱과 포장재, 생활용품 곳곳에 남아 있었다.',
      '위험을 알리는 색은 사라지지 않았지만,',
      '반복되는 풍경 속에서 우리는 그 경고에 익숙해졌다.',
    ],
  },
  {
    key: 'blue',
    no: 2,
    name: 'BLUE',
    hex: '247FF5',
    panel: 'Blue-08',
    inset: 'Blue-04',
    side: 'Blue-12',
    object: 'box-adidas',
    objectBox: { x: 874.53, y: 2188.53, w: 1030.57, h: 1030.57, r: 29.65 },
    heading: 'ABANDONED COBALT',
    titleAt: { x: 80, y: 110, noX: 71, noY: 830 },
    insetFrom: { x: 1204, y: 296 },
    enRight: 1089,
    tagline: ['BLUE STILL LOOKS CLEAN.', 'WE JUST STOPPED QUESTIONING IT.'],
    tags: 'CLEAR / DISGUISED / POLLUTED',
    ko1: ['깨끗함을 떠올리게 하는 색,', '그리고 가장 조용히 오염을 감추는 색.'],
    en: [
      'THE COLOR WE MISTOOK FOR CLEAN.',
      'Once a color of clarity,',
      'blue now remains in the things we leave behind.',
      'The surface still looks clean.',
      'What lies beneath it does not.',
    ],
    ko2: [
      '우리가 수집한 풍경 속 파랑은',
      '버려진 페트병과 비닐, 일회용품 곳곳에 남아 있었다.',
      '깨끗함을 떠올리게 하는 색은 그대로였지만,',
      '그 아래 남겨진 오염은 더 이상 깨끗하지 않았다.',
    ],
  },
  {
    key: 'green',
    no: 3,
    name: 'GREEN',
    hex: '01602C',
    panel: 'Green-04',
    inset: 'Green-07',
    side: 'Green-09',
    object: 'net-green',
    objectBox: { x: 1204, y: 2234, w: 679.43, h: 959.87, r: -7.09 },
    heading: 'TANGLED GREEN',
    titleAt: { x: 138, y: 178, noX: 129, noY: 828 },
    insetFrom: { x: 1204, y: 290 },
    enRight: 1089,
    tagline: ['GREEN STILL LOOKS NATURAL.', 'WE JUST STOPPED QUESTIONING IT.'],
    tags: 'NATURAL / BLENDED / ARTIFICIAL',
    ko1: ['자연을 떠올리게 하는 색,', '그리고 가장 자연스럽게 섞여버린 흔적.'],
    en: [
      'THE COLOR WE MISTOOK FOR NATURE.',
      'Once a color of nature,',
      'green now remains in the things we discard.',
      'It blends into the landscape.',
      'But belonging is not the same as being natural.',
    ],
    ko2: [
      '우리가 수집한 풍경 속 초록은',
      '버려진 병과 포장재, 생활용품 곳곳에 남아 있었다.',
      '자연을 닮은 색은 풍경 속에 쉽게 섞여들었지만,',
      '그곳에 어울려 보인다고 자연의 일부가 되는 것은 아니었다.',
    ],
  },
]

// 사진이 옮겨 가 서는 자리(색 구역 기준). 세 구역이 같다
const INSET_TO = { x: 716, y: 1376 }

// 피그마의 회전 개체: 회전 전 크기(w, h)와 회전 후 외곽 박스 좌상단(x, y). 외곽 박스 가운데에 맞춘다
const boxStyle = ({ x, y, w, h, r = 0 }: Box): CSSProperties => {
  const rad = (r * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  return {
    left: x + (w * cos + h * sin) / 2,
    top: y + (w * sin + h * cos) / 2,
    width: w,
    height: h,
    transform: `translate(-50%, -50%) rotate(${-r}deg)`,
  }
}

const chars = (text: string) =>
  [...text].map((c, i) => (
    <span key={i} className="about-type" aria-hidden="true">
      {c}
    </span>
  ))

// 글자가 한 자씩 찍히듯 나타난다
function useTyping(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-type]').forEach((box) => {
        gsap.fromTo(
          box.querySelectorAll('.about-type'),
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.01,
            stagger: 0.045,
            ease: 'none',
            scrollTrigger: { trigger: box, start: 'top 85%', toggleActions: 'play none none reverse' },
          },
        )
      })
    }, el)
    return () => ctx.revert()
  }, [root])
}

// 첫 화면: 형광펜, 둥실거림, 비닐봉지 고정, 양옆에서 들어오는 사진, 한 줄씩 읽히는 문장, 가운데 사진 확대
function useIntro(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.about-mark').forEach((mark) => {
        gsap.fromTo(
          mark,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.9,
            delay: 0.4,
            ease: 'power2.out',
            scrollTrigger: { trigger: mark, start: 'top bottom', toggleActions: 'play none none reverse' },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('.about-bob').forEach((node, i) => {
        gsap.to(node, { y: -10, duration: 2.2 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      })

      gsap.utils.toArray<HTMLElement>('.about-grid__cell').forEach((cell) => {
        const fromLeft = cell.dataset.side === 'left'
        gsap.from(cell, {
          x: fromLeft ? -420 : 420,
          opacity: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: cell, start: 'top 95%', end: 'top 60%', scrub: true },
        })
      })

      gsap.utils.toArray<HTMLElement>('.about-read__line').forEach((line) => {
        gsap
          .timeline({ scrollTrigger: { trigger: line, start: 'top 65%', end: 'top 35%', scrub: true } })
          .to(line, { opacity: 1, duration: 1 })
          .to(line, { opacity: 0.3, duration: 1 })
      })

      gsap.fromTo(
        '.about-strip__zoom',
        { scale: 400 / 488 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.about-strip__zoom', start: 'top 80%', end: 'top 30%', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [root])
}

// 색 구역: 차오르는 색, 옮겨 가는 사진, 시간차로 들어오는 줄, 빠져나오는 개체
function useColors(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.about-color').forEach((sec) => {
        const q = gsap.utils.selector(sec)
        const st = (start: string, end: string) => ({ trigger: sec, start, end, scrub: true })

        gsap.fromTo(q('.about-color__fill'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: st('top 90%', 'top 20%') })
        gsap.from(q('.about-color__name'), { yPercent: 110, opacity: 0, ease: 'power2.out', scrollTrigger: st('top 50%', 'top 10%') })
        gsap.from(q('.about-color__suffix'), { xPercent: -40, opacity: 0, ease: 'power2.out', scrollTrigger: st('top 45%', 'top 5%') })

        const inset = q('.about-color__inset')[0]
        gsap
          .timeline({ scrollTrigger: st('top 20%', '+=1100') })
          .fromTo(
            inset,
            { x: 0, y: 0 },
            { x: () => +inset.dataset.dx!, y: () => +inset.dataset.dy!, ease: 'none' },
            0,
          )
          .fromTo(q('.about-color__tint'), { opacity: 0 }, { opacity: 0.5, ease: 'none' }, 0)

        gsap.from(q('.about-color__tagline > *'), {
          x: 160,
          opacity: 0,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: { trigger: q('.about-color__tagline')[0], start: 'top 85%', toggleActions: 'play none none reverse' },
        })
        gsap.from(q('.about-color__big'), {
          x: 600,
          opacity: 0,
          ease: 'power2.out',
          scrollTrigger: { trigger: q('.about-color__big')[0], start: 'top 100%', end: 'top 60%', scrub: true },
        })

        gsap.fromTo(
          q('.about-color__object'),
          { x: -560, y: -900, scale: 0.45, opacity: 0 },
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            ease: 'power1.inOut',
            scrollTrigger: { trigger: q('.about-color__label')[0], start: 'top 95%', end: 'top 25%', scrub: true },
          },
        )

        gsap.from(q('.about-color__line'), {
          x: -160,
          opacity: 0,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: { trigger: q('.about-color__label')[0], start: 'top 70%', toggleActions: 'play none none reverse' },
        })
      })
    }, el)
    return () => ctx.revert()
  }, [root])
}

function Callout({ side }: { side: 'left' | 'right' }) {
  const lines = side === 'left' ? CAPTION_LEFT : CAPTION_RIGHT
  return (
    <div className={`about-callout about-callout--${side}`}>
      <svg className="about-callout__stroke about-bob" viewBox="0 0 620 170" aria-hidden="true">
        {side === 'left' ? (
          <>
            <polyline points="611,9 461,9 402,104 113,104" />
            <circle cx="611" cy="9" r="7" />
            <circle cx="611" cy="9" r="3" className="about-callout__dot" />
          </>
        ) : (
          <>
            <polyline points="9,9 167,9 221,163 588,163" />
            <circle cx="9" cy="9" r="7" />
            <circle cx="9" cy="9" r="3" className="about-callout__dot" />
          </>
        )}
      </svg>
      <p className="about-callout__text" data-type aria-label={lines.join(' ')}>
        {lines.map((line, i) => (
          <span key={i} className="about-callout__line">
            {chars(line)}
          </span>
        ))}
      </p>
    </div>
  )
}

function ColorSection({ p }: { p: Palette }) {
  const style = { '--c': `#${p.hex}` } as CSSProperties
  const objectBox = boxStyle(p.objectBox)
  return (
    <section className={`about-color about-color--${p.key}`} style={style} aria-label={p.name}>
      <img className="about-color__photo" src={photoSrc(p.panel)} alt="" />
      <div className="about-color__panel">
        <span className="about-color__fill" aria-hidden="true" />
        <h2 className="about-color__title" style={{ left: p.titleAt.x, top: p.titleAt.y }}>
          <span className="about-color__name">{p.name}</span>
          <span className="about-color__suffix">_COLOR</span>
        </h2>
        <p className="about-color__no" style={{ left: p.titleAt.noX, top: p.titleAt.noY }}>
          ( {p.no} )
        </p>
      </div>
      <img className="about-color__side" src={photoSrc(p.side)} alt="" />

      <div
        className="about-color__inset"
        style={{ left: p.insetFrom.x, top: p.insetFrom.y }}
        data-dx={INSET_TO.x - p.insetFrom.x}
        data-dy={INSET_TO.y - p.insetFrom.y}
      >
        <img src={photoSrc(p.inset)} alt="" />
        <span className="about-color__tint" aria-hidden="true" />
      </div>

      <div className="about-color__tagline">
        <p className="about-color__key">( {p.name} )</p>
        <p className="about-color__claim">
          {p.tagline.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </p>
        <p className="about-color__tags">{p.tags}</p>
      </div>
      <p className="about-color__big" aria-hidden="true">
        {p.name}
      </p>

      <p className="about-color__label about-color__line">
        {p.name} <span className="about-color__hex"># {p.hex}</span>
      </p>
      <span className="about-color__rule about-color__rule--lead about-color__line" aria-hidden="true" />
      <h3 className="about-color__heading about-color__line">{p.heading}</h3>
      <p className="about-color__ko about-color__ko--lead about-color__line">
        {p.ko1.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </p>
      <p className="about-color__en about-color__line" style={{ right: 1920 - p.enRight }}>
        {p.en.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </p>
      <span
        className="about-color__rule about-color__rule--mid about-color__line"
        style={{ width: p.enRight + 12 }}
        aria-hidden="true"
      />
      <p className="about-color__ko about-color__ko--tail about-color__line">
        {p.ko2.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </p>
      <span className="about-color__rule about-color__rule--end about-color__line" aria-hidden="true" />

      {/* 움직임은 바깥이, 가운데 맞춤과 기울기는 이미지가 맡는다. 한 요소에 두면 GSAP 가 -50% 를 잃는다 */}
      <div className="about-color__object" style={{ transformOrigin: `${objectBox.left}px ${objectBox.top}px` }}>
        <img src={objectSrc(p.object)} alt="" style={objectBox} />
      </div>
    </section>
  )
}

export function About() {
  const ref = useRef<HTMLElement>(null)
  useFitWidth(ref)
  useTyping(ref)
  useIntro(ref)
  useColors(ref)

  return (
    <main ref={ref} className="about">
      <section className="about-hero" style={{ height: SECTION }}>
        <span className="about-hero__vline" style={{ left: 587 }} aria-hidden="true" />
        <span className="about-hero__vline" style={{ left: 1332 }} aria-hidden="true" />
        {H_LINES.map((y) => (
          <span key={y} className="about-hero__hline" style={{ top: y }} aria-hidden="true" />
        ))}

        <span className="about-mark" style={{ left: 67, top: 117, width: 51 }} aria-hidden="true" />
        <h1 className="about-hero__title about-bob">Is the nature</h1>

        <div className="about-bag">
          <div className="about-bag__pin">
            <img className="about-bob" src={objectSrc('bag-blue')} alt="" />
          </div>
        </div>

        <p className="about-hero__ask">
          우리가 보는 자연은
          <br />
          진짜 자연의 모습인가
        </p>

        <Callout side="left" />
        <Callout side="right" />

        <span className="about-mark" style={{ left: 890, top: 907, width: 972 }} aria-hidden="true" />
        <p className="about-hero__seeing about-bob">we are seeing truly nature?</p>

        <p className="about-hero__question" data-type aria-label={QUESTION}>
          {chars(QUESTION)}
        </p>

        {GRID.map((g, gi) =>
          g.photos.map((name, i) => (
            <img
              key={`${gi}-${name}`}
              className="about-grid__cell"
              data-side={gi === 0 ? 'left' : 'right'}
              src={photoSrc(name)}
              alt=""
              style={{
                left: g.left + (i % 2) * (CELL.w + CELL.gap),
                top: 1329 + Math.floor(i / 2) * (CELL.h + CELL.gap),
                width: CELL.w,
                height: CELL.h,
              }}
            />
          )),
        )}

        {READ_LINES.map((l) => (
          <p key={l.text} className="about-read__line" style={{ top: l.top }}>
            {l.text}
          </p>
        ))}

        {STRIP.map((name, i) => (
          <img
            key={`${name}-${i}`}
            className="about-strip__photo"
            src={photoSrc(name)}
            alt=""
            style={{ left: -120 + i * 440, top: 2722 }}
          />
        ))}
        <img className="about-strip__zoom" src={photoSrc(STRIP[2])} alt="" />
      </section>

      {PALETTES.map((p) => (
        <ColorSection key={p.key} p={p} />
      ))}
    </main>
  )
}
