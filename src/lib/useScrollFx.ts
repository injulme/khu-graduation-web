import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_OBJECTS } from './assets'

gsap.registerPlugin(ScrollTrigger)

const WIDE = '(min-width: 861px)'

const FOCUS_SCALE = 1.15

const FOCUS_BAND = { enter: '52%', leave: '8%' }

export function useScrollFx() {
  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add(`${WIDE} and (prefers-reduced-motion: no-preference)`, () => {
      gsap.utils.toArray<HTMLElement>('.js-hero-spacer').forEach((spacer) => {
        const headline = spacer.querySelector('.js-hero-headline')
        if (!headline) return

        gsap.fromTo(
          headline,
          { xPercent: -45.2 },
          {
            xPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: spacer,
              start: () => spacer.offsetTop,
              end: () => spacer.offsetTop + innerHeight * 2,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )

        const stage = spacer.querySelector<HTMLElement>('.stage')
        const stageHeight = () => stage?.offsetHeight ?? 0
        const zigPx = (percent: number) => (stageHeight() * percent) / 100

        const TRAVEL = 0.22

        const enterFrom = (zig: number) =>
          zigPx(zig) + stageHeight() * (zig < 0 ? -TRAVEL : TRAVEL)

        spacer.querySelectorAll<HTMLElement>('.js-hero-object').forEach((obj, i) => {
          const { zig } = HERO_OBJECTS[i % HERO_OBJECTS.length]
          const lag = (i % HERO_OBJECTS.length) * 0.07

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: spacer,
              start: () => spacer.offsetTop,
              end: () => spacer.offsetTop + innerHeight * 2,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })

          tl.fromTo(
            obj,
            { y: () => enterFrom(zig), opacity: 0 },
            { y: () => zigPx(zig), opacity: 1, ease: 'none', duration: 1 },
            0,
          )
            .fromTo(
              obj,
              { y: () => zigPx(zig) },
              { y: 0, ease: 'none', duration: 1 - lag, immediateRender: false },
              1 + lag,
            )
        })

        const annotations = spacer.querySelectorAll('.js-hero-annotation')
        gsap.set(annotations, { opacity: 0 })
        gsap.to(
          annotations,
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.05,
            scrollTrigger: {
              trigger: spacer,
              start: () => spacer.offsetTop + innerHeight * 1.05,
              end: () => spacer.offsetTop + innerHeight * 1.92,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
      })
    })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('.js-float').forEach((el, i) => {
        gsap.to(el, {
          yPercent: -12 * (i % 2 === 0 ? 1.4 : 0.7),
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })

      gsap.utils.toArray<HTMLElement>('.js-focus').forEach((row) => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: row,
              start: `center ${FOCUS_BAND.enter}`,
              end: `center ${FOCUS_BAND.leave}`,
              scrub: 0.6,
            },
          })
          .to(row, { scale: FOCUS_SCALE, ease: 'sine.inOut', duration: 1 })
          .to(row, { scale: 1, ease: 'sine.inOut', duration: 1 })
      })

      gsap.utils.toArray<HTMLElement>('.js-archive-row').forEach((row) => {
        gsap.fromTo(
          row,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: row, start: 'top 95%' },
          },
        )
      })
    })

    const refresh = () => ScrollTrigger.refresh()
    if (document.readyState === 'complete') refresh()
    else addEventListener('load', refresh, { once: true })

    return () => {
      removeEventListener('load', refresh)
      mm.revert()
    }
  }, [])
}
