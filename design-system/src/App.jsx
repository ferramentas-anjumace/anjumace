import { AppTemploSingular } from './landing/singular/AppTemploSingular'
import { AppObrigadoTemplo } from './landing/obrigado/AppObrigadoTemplo'
import { AppObrigadoSingular } from './landing/obrigado-singular/AppObrigadoSingular'
import { AppListaEspera } from './landing/lista-espera/AppListaEspera'
import { AppGuiaCaptura, GuiaDownloadInterino } from './landing/guia/AppGuiaCaptura'

// Site no ar = Lista de Espera (raiz e /lista-de-espera) — a landing
// "App 7 dias" (src/landing/App7Dias.jsx) está fora do ar por ora.
// /singular = landing "Plano Templo Singular" (consultoria individualizada).
// /obrigado-singular = obrigado do Plano Templo Singular (pós-compra).
// /obrigado-templo = obrigado do Plano Templo; o /obrigado antigo continua
//   caindo nele (links de checkout já configurados não quebram).
// /guia = captura do e-book "Os cinco tipos de falha" (funil de atração);
//   as demais páginas do funil (/guia/obrigado, /guia/templo, /guia/download)
//   entram na sequência.
// O showcase do design system continua em src/showcase/Showcase.jsx (fora do ar).
export default function App() {
  if (window.location.pathname.startsWith('/guia/download')) return <GuiaDownloadInterino />
  if (window.location.pathname.startsWith('/guia')) return <AppGuiaCaptura />
  if (window.location.pathname.startsWith('/singular')) return <AppTemploSingular />
  if (window.location.pathname.startsWith('/obrigado-singular')) return <AppObrigadoSingular />
  if (window.location.pathname.startsWith('/obrigado')) return <AppObrigadoTemplo />
  return <AppListaEspera />
}
