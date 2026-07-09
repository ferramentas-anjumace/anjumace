import { ObrigadoTemplate } from '../obrigado/ObrigadoTemplate'
import {
  HERO,
  PASSOS,
  LABELS,
  AVISO,
  FECHAMENTO,
  CIRCLE_ANDROID_URL,
  CIRCLE_IOS_URL,
  COMECE_POR_AQUI_URL,
} from './data'

/**
 * Página de obrigado do Plano Templo Singular (rota /obrigado-singular).
 * Copy em ./data.js; layout compartilhado em ../obrigado/ObrigadoTemplate.jsx.
 * Diferença estrutural: o aviso de que o Templo já está liberado enquanto a
 * Prescrição Singular não chega.
 */
export function AppObrigadoSingular() {
  return (
    <ObrigadoTemplate
      docTitle="Anju Mace · Bem-vinda ao Plano Templo Singular"
      hero={HERO}
      passos={PASSOS}
      labels={LABELS}
      aviso={AVISO}
      fechamento={FECHAMENTO}
      urls={{
        android: CIRCLE_ANDROID_URL,
        ios: CIRCLE_IOS_URL,
        primeirosPassos: COMECE_POR_AQUI_URL,
      }}
    />
  )
}
