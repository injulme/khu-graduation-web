export type GachaCell =
  | { row: number; col: number; kind: 'photo'; src: string; alt: string }
  | { row: number; col: number; kind: 'color'; color: string; name: string }

export const GACHA_CELLS: readonly GachaCell[] = [
  { row: 0, col: 3, kind: 'color', color: '#d5d4c7', name: '베이지' },
  { row: 0, col: 10, kind: 'photo', src: 'gacha-asphalt.webp', alt: '아스팔트 위 노란 선' },
  { row: 1, col: 1, kind: 'color', color: '#fbed64', name: '노랑' },
  { row: 1, col: 6, kind: 'photo', src: 'gacha-box.webp', alt: '버려진 파란 운동화 상자' },
  { row: 2, col: 1, kind: 'photo', src: 'gacha-lock.webp', alt: '길바닥에 떨어진 노란 자물쇠' },
  { row: 2, col: 4, kind: 'photo', src: 'gacha-cups.webp', alt: '마시다 버린 플라스틱 컵 두 개' },
  { row: 2, col: 8, kind: 'color', color: '#fbe0ed', name: '연분홍' },
  { row: 2, col: 9, kind: 'color', color: '#ffaba2', name: '살구' },
  { row: 3, col: 0, kind: 'color', color: '#1a6edd', name: '파랑' },
  { row: 3, col: 5, kind: 'photo', src: 'gacha-tag.webp', alt: '아스팔트 위에 버려진 종이 태그' },
  { row: 4, col: 1, kind: 'photo', src: 'gacha-cups.webp', alt: '마시다 버린 플라스틱 컵 두 개' },
  { row: 4, col: 3, kind: 'color', color: '#eefbff', name: '연하늘' },
  { row: 4, col: 8, kind: 'photo', src: 'gacha-milk.webp', alt: '풀숲에 버려진 딸기우유 팩' },
  { row: 5, col: 4, kind: 'color', color: '#dbd9de', name: '연회색' },
]

export const CELL = 180

// 1920 기준 180px. 더 좁은 화면은 같은 비율로 줄여 1920 과 같은 11×6 배치를 유지한다
export const cellSize = (viewportWidth: number) =>
  Math.floor(CELL * Math.min(1, viewportWidth / 1920))
