import { useEffect, useRef } from 'react'

// 브라우저 기본 cursor 이미지는 128px 제한이 있어 DOM 요소로 커서를 대체
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!matchMedia('(pointer: fine)').matches) return

    document.documentElement.classList.add('has-cursor')

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      // 1920 기준 크기라 좁은 화면에서는 화면 축소(useFitWidth)와 같은 비율로 줄인다
      const scale = Math.min(1, document.documentElement.clientWidth / 1920)
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(${scale})`
      el.classList.add('is-visible')
    }
    const onLeave = () => el.classList.remove('is-visible')

    addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    return () => {
      removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  return <div ref={ref} className="cursor" aria-hidden="true" />
}
