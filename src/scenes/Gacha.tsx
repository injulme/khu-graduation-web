import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { asset } from '../lib/assets'
import { CELL, cellSize, GACHA_CELLS, type GachaCell } from '../lib/gachaCells'

function useBoard() {
  const [board, setBoard] = useState(() => ({ cell: 180, cols: 11, rows: 6 }))

  useEffect(() => {
    const measure = () => {
      // 스크롤바 폭을 빼려고 innerWidth 대신 clientWidth 를 쓴다
      const { clientWidth: w, clientHeight: h } = document.documentElement
      const cell = cellSize(w)
      setBoard({ cell, cols: Math.ceil(w / cell), rows: Math.ceil(h / cell) })
    }
    measure()
    addEventListener('resize', measure)
    return () => removeEventListener('resize', measure)
  }, [])

  return board
}

function scatter(cells: readonly GachaCell[], cols: number, rows: number): GachaCell[] {
  const taken = new Set<string>()
  const blocked = (row: number) => row === 0

  return cells.map((cell) => {
    for (let tries = 0; tries < 200; tries++) {
      const row = Math.floor(Math.random() * rows)
      const col = Math.floor(Math.random() * cols)
      const key = `${row}:${col}`
      if (taken.has(key) || blocked(row)) continue
      taken.add(key)
      return { ...cell, row, col }
    }
    return cell
  })
}

export function Gacha() {
  const { cell: cellPx, cols, rows } = useBoard()
  const [drawn, setDrawn] = useState<readonly GachaCell[] | null>(null)
  const [drawing, setDrawing] = useState(false)

  const fitsDesign = cols >= 11 && rows >= 6
  const fallback = useMemo(() => scatter(GACHA_CELLS, cols, rows), [cols, rows])
  const cells = drawn ?? (fitsDesign ? GACHA_CELLS : fallback)

  const draw = useCallback(() => {
    if (drawing) return
    setDrawing(true)
    setDrawn(scatter(GACHA_CELLS, cols, rows))
    setTimeout(() => setDrawing(false), 600)
  }, [cols, rows, drawing])

  const boardStyle = useMemo(
    () => ({ backgroundSize: `${cellPx}px ${cellPx}px` }) as const,
    [cellPx],
  )

  return (
    <main
      className="gacha"
      aria-label="가챠"
      // start 버튼이 칸과 같은 비율로 줄어들도록 1920 기준 배율을 넘긴다
      style={{ '--gacha-scale': cellPx / CELL } as CSSProperties}
    >
      <div className="gacha__board" style={boardStyle} aria-hidden="true">
        {cells.map((cell, i) => (
          <div
            key={`${cell.kind}-${i}`}
            className={`gacha__cell${drawing ? ' is-drawing' : ''}`}
            style={{
              left: `${cell.col * cellPx}px`,
              top: `${cell.row * cellPx}px`,
              width: `${cellPx}px`,
              height: `${cellPx}px`,
              transitionDelay: `${(i % 7) * 40}ms`,
              ...(cell.kind === 'color' ? { background: cell.color } : null),
            }}
          >
            {cell.kind === 'photo' && (
              <img className="gacha__photo" src={asset(cell.src)} alt="" loading="lazy" />
            )}
          </div>
        ))}
      </div>

      <button type="button" className="gacha__start" onClick={draw} disabled={drawing}>
        start
      </button>
    </main>
  )
}
