import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

export const COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Brown', 'Black', 'White']

const HUE = [
  [345, 20, 'Red'], [20, 45, 'Orange'], [45, 70, 'Yellow'], [70, 165, 'Green'],
  [165, 255, 'Blue'], [255, 345, 'Purple'],
]
const byHue = (h) => HUE.find(([a, b]) => (a > b ? h >= a || h < b : h >= a && h < b))?.[1 + 1] ?? 'Red'

export async function accent(file) {
  const { data, info } = await sharp(file)
    .resize(160, 160, { fit: 'inside' })
    .flatten({ background: '#ffffff' })
    .raw().toBuffer({ resolveWithObject: true })

  const color = []
  const plain = []
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    if (d < 0.22 || mx < 0.12) { plain.push(mx); continue }
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
    color.push({ h: (h * 60 + 360) % 360, d, v: mx })
  }

  const total = color.length + plain.length
  const ratio = +(color.length / total).toFixed(3)

  if (color.length < total * 0.02) {
    plain.sort((a, b) => a - b)
    const dark = plain[Math.floor(plain.length * 0.05)] ?? 0.5
    const light = plain[Math.floor(plain.length * 0.95)] ?? 0.5
    return { color: 1 - light < dark ? 'White' : 'Black', ratio }
  }

  const score = {}
  for (const { h, d, v } of color) {
    const brown = (h < 45 || h > 345) && v < 0.55 && d < 0.5
    const name = brown ? 'Brown' : byHue(h)
    score[name] = (score[name] ?? 0) + d
  }
  return { color: Object.entries(score).sort((a, b) => b[1] - a[1])[0][0], ratio }
}

if (process.argv[2] === 'run') {
  const dirs = (await readdir('.')).filter((d) => d.startsWith('drive-download-'))
  for (const d of dirs) for (const f of (await readdir(d)).sort()) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue
    const a = await accent(join(d, f))
    console.log([a.color.padEnd(7), String(a.ratio).padStart(6), join(d, f)].join(' '))
  }
}
