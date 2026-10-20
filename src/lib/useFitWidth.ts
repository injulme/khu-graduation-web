import { useEffect, type RefObject } from 'react'

// 1920 기준으로 px 고정 배치한 화면을, 더 좁은 화면에서 같은 비율로 통째로 줄인다.
// zoom 은 vw/vh 값까지 한 번 더 줄이므로 px 로만 배치한 요소에만 쓴다
export function useFitWidth(ref: RefObject<HTMLElement | null>, designWidth = 1920) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      // 스크롤바 폭을 빼려고 innerWidth 대신 clientWidth 를 쓴다
      const scale = Math.min(1, document.documentElement.clientWidth / designWidth)
      el.style.zoom = scale === 1 ? '' : String(scale)
    }
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [ref, designWidth])
}
