export const HERO_CUTS = 3

const ARCHIVE_HEADER_TOP = 0.083

export function measureCuts(): number[] {
  const root = document.querySelector<HTMLElement>('.lens__layer--light')
  if (!root) return [0]

  const vh = innerHeight
  const max = Math.max(0, document.documentElement.scrollHeight - vh)
  const raw: number[] = []

  const push = (y: number) => raw.push(Math.min(Math.max(Math.round(y), 0), max))

  const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY

  const hero = root.querySelector<HTMLElement>('.hero')
  if (hero) for (let i = 0; i < HERO_CUTS; i++) push(docTop(hero) + i * vh)

  const intro = root.querySelector<HTMLElement>('.intro')
  if (intro) push(docTop(intro))

  const header = root.querySelector<HTMLElement>('.js-archive-header')
  if (header) push(docTop(header) - vh * ARCHIVE_HEADER_TOP)

  return raw
    .sort((a, b) => a - b)
    .filter((v, i, all) => i === 0 || v - all[i - 1] > 8)
}

export function nearestCut(cuts: number[], y: number): number {
  let best = 0
  let bestGap = Infinity
  for (let i = 0; i < cuts.length; i++) {
    const gap = Math.abs(cuts[i] - y)
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  }
  return best
}
