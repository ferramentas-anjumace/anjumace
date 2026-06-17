import { ToastProvider } from './components'
import { Showcase } from './showcase/Showcase'

export default function App() {
  return (
    <ToastProvider>
      <Showcase />
    </ToastProvider>
  )
}
