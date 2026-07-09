/** ============================================================================
 *  PÁGINA DE OBRIGADO · PLANO TEMPLO — conteúdo (copy aprovada).
 *  Mantido separado das seções para facilitar edição de textos e links.
 *  ========================================================================= */

/* App do Circle nas lojas. */
export const CIRCLE_ANDROID_URL = 'https://play.google.com/store/apps/details?id=so.circle.circle'
export const CIRCLE_IOS_URL = 'https://apps.apple.com/us/app/circle-communities/id1509651625'
/* Espaço "Primeiros Passos" dentro da comunidade no Circle. */
export const PRIMEIROS_PASSOS_URL = 'https://anju-mace.circle.so/c/primeiro-passos-templo'

export const HERO = {
  eyebrow: 'ACESSO À ALIANÇA CONFIRMADO',
  title: 'Bem-vinda ao Plano Templo.',
  /* Quebras de linha: mobile quebra nas três partes; desktop só antes da última. */
  descriptionPart1: 'Você acaba de entrar num método',
  descriptionPart2: 'que trata o treino como jornada,',
  descriptionPart3: 'e a jornada como identidade.',
  /* Botão da dobra 1 — no mobile quebra em duas linhas, entre as duas partes. */
  kickerLine1: 'Faltam dois passos simples',
  kickerLine2: 'para você começar!',
}

export const PASSOS = [
  {
    title: 'Baixe o aplicativo do Circle',
    text: 'Com o app você pode ver a execução dos treinos, orientada por Anju, direto do seu celular.',
  },
  {
    title: 'Abra o espaço Primeiros Passos',
    /* O trecho em destaque ("Receba o seu Treino") é montado na seção. */
    textBefore: 'Lá, em ',
    highlight: 'Receba o seu Treino',
    textAfter:
      ', estão as instruções para você receber a sua ficha de treino e dar o primeiro passo dentro do Método T.E.M.P.L.O.',
  },
]

export const LABELS = {
  android: 'Baixar para Android',
  ios: 'Baixar para iOS',
  primeirosPassos: 'Ir para Primeiros Passos',
}

/* Fechamento — no mobile quebra em duas linhas, entre as duas partes. */
export const FECHAMENTO = {
  line1: 'Em movimento,',
  line2: 'em liberdade.',
}
