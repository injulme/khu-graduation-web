import { readdir, mkdir, rename, unlink, stat } from 'node:fs/promises'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const SRC = 'assets-src'
const OUT = 'public/interaction'

const LINE_ART = /^(logo-|nav)/

await mkdir(SRC, { recursive: true })

for (const file of await readdir(OUT)) {
  if (file.endsWith('.png')) await rename(join(OUT, file), join(SRC, file))
}

const files = (await readdir(SRC)).filter((f) => f.endsWith('.png')).sort()
let before = 0
let after = 0

for (const file of files) {
  const src = join(SRC, file)
  const dest = join(OUT, `${parse(file).name}.webp`)
  const { size } = await stat(src)
  const lossless = LINE_ART.test(file)

  const info = await sharp(src)
    .webp(lossless ? { lossless: true, effort: 6 } : { quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(dest)

  before += size
  after += info.size
  const pct = Math.round((1 - info.size / size) * 100)
  console.log(
    `${file.padEnd(26)} ${(size / 1024).toFixed(0).padStart(6)}KB → ${(info.size / 1024).toFixed(0).padStart(6)}KB` +
      `  ${String(pct).padStart(3)}% 절감  ${lossless ? '무손실' : '손실'}`,
  )
}

const kept = new Set(files.map((f) => `${parse(f).name}.webp`))
for (const file of await readdir(OUT)) {
  if (file.endsWith('.webp') && !kept.has(file)) {
    await unlink(join(OUT, file))
    console.log(`${file} — 원본이 없어 삭제`)
  }
}

console.log(`\n전체 ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(1)}MB`)
