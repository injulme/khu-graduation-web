import { useEffect, useState } from 'react'

export type Route = 'landing' | 'archiving' | 'gacha' | 'object'

export type At = { route: Route; arg: string | null }

const read = (): At => {
  const [head = '', arg = ''] = location.hash.replace(/^#\/?/, '').split('/')
  if (head === 'object' && arg) return { route: 'object', arg: decodeURIComponent(arg) }
  if (head === 'gacha') return { route: 'gacha', arg: null }
  if (head === 'archiving') return { route: 'archiving', arg: null }
  return { route: 'landing', arg: null }
}

export const routePath = (route: Route) => (route === 'landing' ? '#/' : `#/${route}`)

export const objectPath = (name: string) => `#/object/${name}`

export function useRoute(): At {
  const [at, setAt] = useState<At>(() =>
    typeof location === 'undefined' ? { route: 'landing', arg: null } : read(),
  )

  useEffect(() => {
    const onChange = () => setAt(read())
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])

  return at
}
