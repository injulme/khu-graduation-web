import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { measureCuts, nearestCut } from './cuts'

const DURATION = 1.35
const COOLDOWN = 160
const SWIPE = 48

const KEY_STEP: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  PageDown: 1,
  ' ': 1,
  ArrowUp: -1,
  ArrowLeft: -1,
  PageUp: -1,
}

export function useCutDeck() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    history.scrollRestoration = 'manual'

    let cuts = measureCuts()
    let index = nearestCut(cuts, scrollY)
    let animating = false
    let lockedUntil = 0
    let tween: gsap.core.Tween | null = null

    const deckEnd = () => cuts[cuts.length - 1] ?? 0

    const isFree = (goingDown: boolean) =>
      scrollY > deckEnd() + 2 || (goingDown && scrollY >= deckEnd() - 2)

    const sync = () => {
      if (!animating) index = nearestCut(cuts, scrollY)
      return index
    }

    const goTo = (next: number) => {
      const target = Math.min(Math.max(next, 0), cuts.length - 1)
      if (target === index && !animating) return

      index = target
      animating = true
      tween?.kill()

      const proxy = { y: scrollY }
      tween = gsap.to(proxy, {
        y: cuts[index],
        duration: DURATION,
        ease: 'power2.inOut',
        onUpdate: () => scrollTo(0, proxy.y),
        onComplete: () => {
          animating = false
          lockedUntil = performance.now() + COOLDOWN
        },
      })
    }

    const onWheel = (e: WheelEvent) => {
      if (isFree(e.deltaY > 0)) {
        tween?.kill()
        animating = false
        return
      }
      e.preventDefault()

      const now = performance.now()
      if (animating || now < lockedUntil) {
        lockedUntil = Math.max(lockedUntil, now + COOLDOWN)
        return
      }
      if (Math.abs(e.deltaY) < 4) return

      goTo(sync() + (e.deltaY > 0 ? 1 : -1))
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const el = e.target as HTMLElement | null
      if (el?.closest('a, button, input, select, textarea, [contenteditable]')) return

      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        if (!animating) goTo(e.key === 'Home' ? 0 : cuts.length - 1)
        return
      }

      const step = KEY_STEP[e.key]
      if (step === undefined) return
      if (isFree(step > 0)) return
      e.preventDefault()
      if (animating) return
      goTo(sync() + step)
    }

    let touchY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (isFree(touchY - e.touches[0].clientY > 0)) return
      e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (animating || performance.now() < lockedUntil) return
      const dy = touchY - e.changedTouches[0].clientY
      if (Math.abs(dy) < SWIPE) return
      if (isFree(dy > 0)) return
      goTo(sync() + (dy > 0 ? 1 : -1))
    }

    const onResize = () => {
      cuts = measureCuts()
      index = Math.min(index, cuts.length - 1)
      tween?.kill()
      animating = false
      scrollTo(0, cuts[index])
      ScrollTrigger.refresh()
    }

    scrollTo(0, cuts[index])

    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKeyDown)
    addEventListener('touchstart', onTouchStart, { passive: true })
    addEventListener('touchmove', onTouchMove, { passive: false })
    addEventListener('touchend', onTouchEnd, { passive: true })
    addEventListener('resize', onResize)

    return () => {
      tween?.kill()
      removeEventListener('wheel', onWheel)
      removeEventListener('keydown', onKeyDown)
      removeEventListener('touchstart', onTouchStart)
      removeEventListener('touchmove', onTouchMove)
      removeEventListener('touchend', onTouchEnd)
      removeEventListener('resize', onResize)
      history.scrollRestoration = 'auto'
    }
  }, [])
}
