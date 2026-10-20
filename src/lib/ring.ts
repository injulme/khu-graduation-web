import { WASTE_SIZES, type WasteObject } from './waste'

export type Side = 'left' | 'right'

export const SIDES: Side[] = ['left', 'right']

export const RING_ORDER: WasteObject[] = [
  'cup-noodle',
  'can-tuna',
  'can-coke-crushed',
  'box-foam',
  'cup-yogurt',
  'glove-black',
  'can-coke',
  'cap-blue',
  'glove-purple',
  'ashtray-jar',
  'box-adidas',
  'lid-red',
  'box-stack',
  'can-gatorade',
  'cup-coffee',
  'handle-yellow',
  'part-blue',
  'straw-red',
]

type Spot = { x: number; y: number; w: number }

const GATHER: Partial<Record<WasteObject, Spot>> = {
  'straw-red': { x: 50.4, y: 13.5, w: 24.8 },
  'glove-purple': { x: 15.6, y: 36.9, w: 21.3 },
  'part-blue': { x: 66.4, y: 23.3, w: 13.5 },
  'box-foam': { x: 20.3, y: 18.4, w: 16.3 },
  'handle-yellow': { x: 89.4, y: 27.0, w: 12.1 },
  'can-gatorade': { x: 17.0, y: 76.2, w: 15.6 },
  'cup-coffee': { x: 67.7, y: 43.7, w: 11.1 },
  'ashtray-jar': { x: 29.1, y: 61.4, w: 18.4 },
  'box-stack': { x: 85.8, y: 59.7, w: 22.0 },
  'cup-noodle': { x: 31.5, y: 27.0, w: 10.6 },
  'lid-red': { x: 69.8, y: 71.7, w: 16.7 },
  'box-adidas': { x: 36.6, y: 78.1, w: 22.0 },
  'cap-blue': { x: 55.3, y: 84.8, w: 7.8 },
  'can-coke-crushed': { x: 9.2, y: 70.8, w: 15.6 },
}

const CUP_X: Record<Side, number> = { left: 0, right: 100 }

const SPAN = 1.6
const UNIT = 9

export type Piece = {
  name: WasteObject
  side: Side
  angle: number
  gx: number
  gy: number
  dx: number
  dy: number
  gw: number
  late: boolean
  w: number
  delay: number
  float: number
}

const round = (n: number) => Math.round(n * 100) / 100

function widthOf(name: WasteObject) {
  const size = WASTE_SIZES[`object/${name}`]
  const ratio = size ? Math.min(1.18, Math.max(0.85, size[0] / size[1])) : 1
  return UNIT * Math.sqrt(ratio)
}

function entry(spot: Spot) {
  const EDGE = 40
  const near = Math.min(spot.x, 100 - spot.x, spot.y, 100 - spot.y)
  if (near === spot.x) return { dx: -round(spot.x + EDGE), dy: 0 }
  if (near === 100 - spot.x) return { dx: round(100 - spot.x + EDGE), dy: 0 }
  if (near === spot.y) return { dx: 0, dy: -round(spot.y + EDGE) }
  return { dx: 0, dy: round(100 - spot.y + EDGE) }
}

export const PIECES: Piece[] = (() => {
  const n = RING_ORDER.length

  return SIDES.flatMap((side) =>
    RING_ORDER.map((name, i): Piece => {
      const here = GATHER[name]
      const spot = here && (here.x < 50 ? 'left' : 'right') === side ? here : undefined
      const w = round(widthOf(name))
      const in_ = spot ? entry(spot) : { dx: 0, dy: 0 }

      return {
        name,
        side,
        angle: round(((i * 360) / n - 90) * (side === 'left' ? 1 : -1)),
        gx: spot ? round(spot.x - CUP_X[side]) : 0,
        gy: spot ? round(spot.y - 50) : 0,
        dx: in_.dx,
        dy: in_.dy,
        gw: spot ? spot.w : 0,
        late: !spot,
        w,
        delay: spot ? round(Math.random() * SPAN) : 0,
        float: 4.5 + (i % 4) * 0.7,
      }
    }),
  )
})()

export const GATHER_MS = Math.round((Math.max(...PIECES.map((p) => p.delay)) + 1.5 + 1) * 1000)

export const piecesOf = (side: Side) => PIECES.filter((p) => p.side === side)

export const arriveOf = (side: Side): Side => (side === 'left' ? 'right' : 'left')

export const cupSideOf = (side: Side): Side => side
