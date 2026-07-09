import { AppTemploSingular } from './landing/singular/AppTemploSingular'
import { AppObrigadoTemplo } from './landing/obrigado/AppObrigadoTemplo'
import { AppListaEspera } from './landing/lista-espera/AppListaEspera'

// Site no ar = Lista de Espera (raiz e /lista-de-espera) — a landing
// "App 7 dias" (src/landing/App7Dias.jsx) está fora do ar por ora.
// /singular = landing "Plano Templo Singular" (consultoria individualizada).
// /obrigado = página de obrigado do Plano Templo (pós-compra).
// O showcase do design system continua em src/showcase/Showcase.jsx (fora do ar).
export default function App() {
  if (window.location.pathname.startsWith('/singular')) return <AppTemploSingular />
  if (window.location.pathname.startsWith('/obrigado')) return <AppObrigadoTemplo />
  return <AppListaEspera />
}
