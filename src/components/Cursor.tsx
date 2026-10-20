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
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
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
