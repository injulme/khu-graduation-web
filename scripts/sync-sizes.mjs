import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const DIR = 'public/interaction'

const files = (await readdir(DIR)).filter((f) => /\.(webp|png|jpe?g)$/i.test(f)).sort()
const entries = await Promise.all(
  files.map(async (f) => {
    const { width, height } = await sharp(join(DIR, f)).metadata()
    return `  '${f}': [${width}, ${height}],`
  }),
)

await writeFile(
  'src/lib/image-sizes.ts',
  `export const IMAGE_SIZES: Record<string, readonly [number, number]> = {
${entries.join('\n')}
}

export const FRAME_WIDTH = 1920

export const frameRatio = (name: string) => {
  const size = IMAGE_SIZES[name]
  return size ? (size[0] / FRAME_WIDTH) * 100 : 100
}
`,
)
console.log(`image-sizes.ts 갱신 — ${files.length}개`)
