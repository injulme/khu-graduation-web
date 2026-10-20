import { Asset } from '../components/Asset'
import { HERO_LABELS, HERO_LINES, HERO_OBJECTS } from '../lib/assets'

export function Hero() {
  return (
    <section className="hero js-hero-spacer" aria-label="COLORS WE LEFT BEHIND">
      <div className="hero__sticky">
        <div className="stage">
          <div className="hero__headline js-hero-headline">
            <Asset
              className="stage__item ink"
              name="title-colors.webp"
              alt="COLORS WE LEFT BEHIND"
              eager
              style={{ left: '3.78%', top: '8.59%', width: '91.64%' }}
            />
            <Asset
              className="stage__item photo"
              name="photo-desk.webp"
              alt="수집한 쓰레기 사진을 책상 위에 늘어놓고 작업하는 장면"
              eager
              style={{ left: '18.67%', top: '21.56%', width: '14.67%' }}
            />
          </div>

          {HERO_OBJECTS.map((o) => (
            <Asset
              key={o.src}
              className="stage__item cutout js-hero-object"
              name={o.src}
              alt={o.alt}
              eager
              style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%` }}
            />
          ))}

          {HERO_LINES.map((l) => (
            <Asset
              key={l.src}
              className="stage__item ink js-hero-annotation"
              name={l.src}
              style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%` }}
            />
          ))}

          {HERO_LABELS.map((l) => (
            <Asset
              key={l.src}
              className="stage__item ink js-hero-annotation"
              name={l.src}
              alt={l.alt}
              style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%` }}
            />
          ))}

          <Asset
            className="stage__item cutout"
            name="obj-foam-tray.webp"
            alt="버려진 스티로폼 트레이"
            eager
            style={{ left: '87.8%', top: '91.6%', width: '12.2%' }}
          />
        </div>
      </div>
    </section>
  )
}
