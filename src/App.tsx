// import { Cursor } from './components/Cursor'
import { Header } from './components/Header'
import { useRoute } from './lib/useRoute'
import { Landing } from './scenes/Landing'
import { Gacha } from './scenes/Gacha'
import { Archiving } from './scenes/Archiving'
import { ObjectPage } from './scenes/ObjectPage'
import './styles/app.css'

export default function App() {
  const { route, arg } = useRoute()
  const onLanding = route === 'landing' || route === 'object'

  return (
    <>
      <Header route={route} variant={route === 'gacha' ? 'inline' : 'reveal'} />
      {onLanding && <Landing covered={route === 'object'} />}
      {route === 'object' && arg && <ObjectPage name={arg} />}
      {route === 'gacha' && <Gacha />}
      {route === 'archiving' && <Archiving />}
      {/* <Cursor /> */}
    </>
  )
}
