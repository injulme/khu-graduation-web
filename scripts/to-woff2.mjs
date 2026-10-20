import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

const tries = ['python3', '/usr/local/bin/python3', '/opt/homebrew/bin/python3', '/usr/bin/python3']
const python = tries.find((bin) => {
  try {
    execFileSync(bin, ['-c', 'import fontTools, brotli'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})
if (!python) {
  console.error('fontTools 를 가진 파이썬이 없습니다. `python3 -m pip install fonttools brotli`')
  process.exit(1)
}
execFileSync(python, [join(here, 'to-woff2.py')], { cwd: join(here, '..'), stdio: 'inherit' })
