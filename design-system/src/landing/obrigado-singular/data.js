/** ============================================================================
 *  PÁGINA DE OBRIGADO · PLANO TEMPLO SINGULAR — conteúdo (copy aprovada).
 *  Mantido separado do template para facilitar edição de textos e links.
 *  ========================================================================= */

/* App do Circle nas lojas (mesmos links do Templo). */
export const CIRCLE_ANDROID_URL = 'https://play.google.com/store/apps/details?id=so.circle.circle'
export const CIRCLE_IOS_URL = 'https://apps.apple.com/us/app/circle-communities/id1509651625'
/* Espaço "Comece por Aqui" dentro da comunidade no Circle.
   TODO: confirmar a URL do espaço do Singular (usando a do Templo por ora). */
export const COMECE_POR_AQUI_URL = 'https://anju-mace.circle.so/c/primeiro-passos-templo'

export const HERO = {
  eyebrow: 'ACESSO À ALIANÇA CONFIRMADO',
  title: 'Bem-vinda ao Plano Templo Singular.',
  /* Quebras de linha: mobile quebra nas três partes; desktop só antes da última. */
  descriptionPart1: 'Você escolheu o nível mais profundo do método:',
  descriptionPart2: 'um ciclo prescrito por Anju para o seu corpo,',
  descriptionPart3: 'a partir da sua avaliação.',
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
    title: 'Abra o espaço Comece por Aqui',
    /* O trecho em destaque ("Receba o seu Treino") é montado no template. */
    textBefore: 'Lá, em ',
    highlight: 'Receba o seu Treino',
    textAfter:
      ', você faz a sua avaliação individual, o primeiro passo do seu ciclo. Depois de respondê-la, Anju prescreve a sua ficha singular, feita para o seu corpo e para a prioridade que você declarar.',
  },
]

export const LABELS = {
  android: 'Baixar para Android',
  ios: 'Baixar para iOS',
  primeirosPassos: 'Ir para Primeiros Passos',
}

/* Enquanto a Prescrição Singular não chega, o Templo já está liberado. */
export const AVISO = {
  before: 'Enquanto a sua ficha singular não chega, você já treina: ',
  highlight: 'o Plano Templo está liberado no seu acesso',
  after: ', com fichas prontas para você usar enquanto a Prescrição Singular não chega.',
}

/* Fechamento — no mobile quebra em duas linhas, entre as duas partes. */
export const FECHAMENTO = {
  line1: 'Em movimento,',
  line2: 'em liberdade.',
}
