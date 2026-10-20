import { mkdir, readdir, writeFile, readFile } from 'node:fs/promises'
import { join, parse } from 'node:path'
import { stat } from 'node:fs/promises'
import sharp from 'sharp'
import { COLORS } from './waste-color.mjs'

const SRC = 'assets-src/waste'
const OUT = 'public/waste'

const JOB = [
  ['object', 1200, 86, 'object'],
  ['photo', 1800, 80, 'photo'],
  ['photo', 640, 72, 'photo/thumb'],
]

const FORCE = process.argv.includes('--force')

async function probe(file) {
  try {
    const { width, height } = await sharp(file).metadata()
    const { size } = await stat(file)
    return { width, height, size }
  } catch {
    return null
  }
}

const sizes = {}
let before = 0
let after = 0

for (const [dir, width, quality, outDir] of JOB) {
  await mkdir(join(OUT, outDir), { recursive: true })
  for (const f of (await readdir(join(SRC, dir))).sort()) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue
    const name = parse(f).name
    const dest = join(OUT, outDir, name + '.webp')
    const buf = await readFile(join(SRC, dir, f))

    let info = FORCE ? null : await probe(dest)
    if (!info) {
      info = await sharp(buf).resize({ width, withoutEnlargement: true })
        .webp({ quality, alphaQuality: 100, effort: 6 }).toFile(dest)
    }
    if (outDir !== 'photo/thumb') {
      before += buf.length
      after += info.size
      sizes[`${dir}/${name}`] = [info.width, info.height]
    }
  }
}

const manifest = JSON.parse(await readFile(join(SRC, '_manifest.json'), 'utf8'))

manifest.photo.sort(
  (a, b) => COLORS.indexOf(a.color) - COLORS.indexOf(b.color) || a.name.localeCompare(b.name),
)
manifest.photo.forEach((p, i) => { p.no = i + 1 })
await writeFile('scripts/waste-manifest.json', JSON.stringify(manifest, null, 1))
await writeFile(
  'src/lib/waste.ts',
  `export type WasteColor = ${COLORS.map((c) => `'${c}'`).join(' | ')}

export const WASTE_COLORS: WasteColor[] = [${COLORS.map((c) => `'${c}'`).join(', ')}]

export const WASTE_OBJECTS = [
${manifest.object.map((o) => `  '${o.name}',`).join('\n')}
] as const

export type WasteObject = (typeof WASTE_OBJECTS)[number]

export const WASTE_PHOTOS: { no: number; name: string; color: WasteColor }[] = [
${manifest.photo.map((p) => `  { no: ${p.no}, name: '${p.name}', color: '${p.color}' },`).join('\n')}
]

export const WASTE_SIZES: Record<string, readonly [number, number]> = {
${Object.entries(sizes).map(([k, v]) => `  '${k}': [${v[0]}, ${v[1]}],`).join('\n')}
}

const base = import.meta.env.BASE_URL

export const objectSrc = (name: WasteObject) => \`\${base}waste/object/\${name}.webp\`
export const photoSrc = (name: string) => \`\${base}waste/photo/\${name}.webp\`
export const thumbSrc = (name: string) => \`\${base}waste/photo/thumb/\${name}.webp\`

export const photosOf = (color: WasteColor) => WASTE_PHOTOS.filter((p) => p.color === color)

export const photoLabel = (no: number) => \`( No.\${String(no).padStart(3, '0')} )\`

export const photoByNo = (no: number) => WASTE_PHOTOS.find((p) => p.no === no)
`,
)

console.log(`원본 ${(before / 1024 / 1024).toFixed(0)}MB → WebP ${(after / 1024 / 1024).toFixed(1)}MB`)
