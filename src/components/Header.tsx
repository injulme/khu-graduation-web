import { useState } from 'react'

import { routePath, type Route } from '../lib/useRoute'

const LINKS: { label: string; route: Route | null }[] = [
  { label: 'About', route: null },
  { label: 'Archiving', route: 'archiving' },
  { label: 'Magazine', route: null },
  { label: 'Gacha', route: 'gacha' },
]

type Props = {
  route: Route
  variant?: 'reveal' | 'inline'
}

export function Header({ route, variant = 'reveal' }: Props) {
  const [open, setOpen] = useState(false)
  const active = variant === 'inline' || open

  return (
    <header
      className={`nav nav--${variant}${active ? ' is-active' : ''}`}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setOpen(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setOpen(false)
      }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <div className="nav__hit">
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={active}
          aria-controls="nav-menu"
          onClick={() => {
            location.hash = routePath('landing')
          }}
          title="처음으로"
        >
          <svg className="nav__grid" viewBox="0 0 28 28" aria-hidden="true">
            <rect className="nav__grid-fill" x="0" y="0" width="28" height="28" />
            <path
              className="nav__grid-lines"
              d="M0.5 0V28M9.5 0V28M18.5 0V28M27.5 0V28M0 0.5H28M0 9.5H28M0 18.5H28M0 27.5H28"
            />
          </svg>
          <span className="nav__label">메뉴</span>
        </button>

        <nav className="nav__menu" id="nav-menu" aria-label="주요 메뉴">
          {LINKS.map((link) => {
            const current = link.route === route
            return (
              <a
                key={link.label}
                className={`nav__link${current ? ' is-current' : ''}`}
                href={link.route ? routePath(link.route) : '#'}
                aria-current={current ? 'page' : undefined}
                aria-disabled={link.route ? undefined : true}
                tabIndex={active ? undefined : -1}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
