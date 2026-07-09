import { ObrigadoTemplate } from './ObrigadoTemplate'
import {
  HERO,
  PASSOS,
  LABELS,
  FECHAMENTO,
  CIRCLE_ANDROID_URL,
  CIRCLE_IOS_URL,
  PRIMEIROS_PASSOS_URL,
} from './data'

/**
 * Página de obrigado do Plano Templo (rota /obrigado-templo; o /obrigado
 * antigo continua caindo aqui). Copy em ./data.js; layout compartilhado
 * com a versão Singular em ./ObrigadoTemplate.jsx.
 */
export function AppObrigadoTemplo() {
  return (
    <ObrigadoTemplate
      docTitle="Anju Mace · Bem-vinda ao Plano Templo"
      hero={HERO}
      passos={PASSOS}
      labels={LABELS}
      fechamento={FECHAMENTO}
      urls={{
        android: CIRCLE_ANDROID_URL,
        ios: CIRCLE_IOS_URL,
        primeirosPassos: PRIMEIROS_PASSOS_URL,
      }}
    />
  )
}
