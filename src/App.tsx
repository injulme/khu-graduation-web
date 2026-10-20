import { Header } from './components/Header'
import { Lens } from './components/Lens'
import { useCutDeck } from './lib/useCutDeck'
import { useRoute } from './lib/useRoute'
import { useScrollFx } from './lib/useScrollFx'
import { Hero } from './scenes/Hero'
import { Landing } from './scenes/Landing'
import { Intro } from './scenes/Intro'
import { Archive } from './scenes/Archive'
import { ColorIndex } from './scenes/ColorIndex'
import { Gacha } from './scenes/Gacha'
import { ObjectPage } from './scenes/ObjectPage'
import './styles/app.css'

function ArchiveContent() {
  return (
    <>
      <Hero />
      <Intro />
      <Archive />
      <ColorIndex />
    </>
  )
}

function ArchivePage() {
  useCutDeck()
  useScrollFx()

  return (
    <Lens>
      <ArchiveContent />
    </Lens>
  )
}

export default function App() {
  const { route, arg } = useRoute()
  const onLanding = route === 'landing' || route === 'object'

  return (
    <>
      <Header route={route} variant={route === 'gacha' ? 'inline' : 'reveal'} />
      {onLanding && <Landing covered={route === 'object'} />}
      {route === 'object' && arg && <ObjectPage name={arg} />}
      {route === 'gacha' && <Gacha />}
      {route === 'archiving' && <ArchivePage />}
    </>
  )
}
