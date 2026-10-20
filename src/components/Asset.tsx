import type { CSSProperties } from 'react'
import { asset } from '../lib/assets'
import { IMAGE_SIZES } from '../lib/image-sizes'

type Props = {
  name: string
  alt?: string
  className?: string
  style?: CSSProperties
  eager?: boolean
}

export function Asset({ name, alt = '', className, style, eager }: Props) {
  const [width, height] = IMAGE_SIZES[name] ?? [undefined, undefined]
  const decorative = alt === ''

  return (
    <img
      className={className}
      src={asset(name)}
      alt={alt}
      aria-hidden={decorative || undefined}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      style={style}
    />
  )
}
