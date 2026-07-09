/* ----------------------------------------------------------------------------
   Playbook de Onboarding — Marcos de Chegada na Aliança (time de CS)
   ----------------------------------------------------------------------------
   Templates de mensagem e regras operacionais do documento "Playbook de
   Onboarding: Marcos de Chegada na Aliança" (versão soft open, acolhimento
   manual). Copy reproduzida VERBATIM do playbook — [seu nome], [link] e
   [data] ficam como placeholders para o CS preencher; [nome] é substituído
   pelo primeiro nome da cliente ao copiar.

   A trilha muda pelo produto do lead: "Singular" no nome → Plano Templo
   Singular (avaliação individual com prazo); senão → Plano Templo
   (formulário inicial simples).
---------------------------------------------------------------------------- */

/** Valores dos passos no catálogo cs_checklist (migration 0044). */
export const CS_ITEMS = {
  boasVindas: 'Boas-vindas enviada',
  login: 'Login no Circle',
  avaliacao: 'Avaliação/Formulário preenchido',
  perfil: 'Perfil completo',
  app: 'Aplicativo baixado',
  primeiraMissao: 'Primeira Missão (apresentação)',
} as const

/** Os três itens do monitoramento da Fase 2 (regra de escalonamento do D7). */
export const CS_MONITORED: string[] = [CS_ITEMS.avaliacao, CS_ITEMS.perfil, CS_ITEMS.app]

export type CsPlan = 'templo' | 'singular'

export function planOf(product?: string): CsPlan {
  return /singular/i.test(product ?? '') ? 'singular' : 'templo'
}

const BOAS_VINDAS_TEMPLO = `Oi, [nome]! Aqui quem fala é [seu nome], do time de acolhimento da Aliança. Fico muito feliz em ser eu quem te recebe.

Você acabou de dar o primeiro passo de uma jornada que trata o seu corpo como o templo que ele é, e não como mais um projeto estético. Eu vou estar por aqui, de perto, te acompanhando nela.

Para começar, são só duas coisas: entrar na Aliança pelo link [link], e preencher o formulário inicial, que nos ajuda a entender de onde você parte antes do seu primeiro treino:

[link].

Assim que fizer as duas, me conta. Vou adorar saber. E se travar em qualquer parte do caminho, me chama aqui, sem cerimônia.`

const BOAS_VINDAS_SINGULAR = `Oi, [nome]!

Aqui quem fala é [seu nome], do time de acolhimento da Aliança. Fico muito feliz em ser eu quem te recebe no ciclo mais próximo que existe aqui dentro.

Você escolheu um caminho pensado para o seu corpo, do zero, com a Anju te acompanhando de perto. Eu vou estar por aqui com você em cada etapa.

Para começar, são só duas coisas:

entrar na Aliança pelo link abaixo, e responder à sua avaliação individual, dentro de 3 dias.

[link]

É dela que sai a sua ficha, prescrita pela Anju para o seu corpo, com as instruções de exercícios e testes.

Assim que fizer as duas, me conta. Vou adorar saber. E se travar em qualquer parte do caminho, me chama aqui, sem cerimônia.`

const AVALIACAO_PENDENTE_SINGULAR = `Oi, [nome].

Passando aqui só para lembrar, com carinho, que a sua avaliação segue te esperando.

É dela que sai a ficha pensada só para o seu corpo, então vale a pena reservar um tempinho para ela.

O prazo vai até [data].

O link, com as instruções, é este:

[link].

Qualquer dúvida no caminho, estou por aqui.`

const FORMULARIO_PENDENTE_TEMPLO = `Oi, [nome].

Passando aqui só para lembrar: falta um passo simples antes do seu primeiro treino, o formulário inicial.

Leva poucos minutos, e o link é este:

[link].`

const PERFIL_PENDENTE = `Oi, [nome].

Queria te contar mais um passinho dessa jornada: que tal completar o seu perfil na Aliança, com uma foto e um pouco sobre você?

É assim que a comunidade te reconhece e te recebe do jeito certo. Não leva mais que dois minutos.`

const APP_PENDENTE = `Oi, [nome].

Mais uma dica para deixar sua experiência na Aliança ainda mais completa: você já baixou o nosso aplicativo?

Android:

[link].

iOS:

[link].`

/**
 * Template do playbook para um passo pendente (null = passo sem mensagem
 * definida — login é coberto pelas boas-vindas; Primeira Missão está "em
 * aberto" no documento). [nome] sai preenchido com o primeiro nome.
 */
export function templateFor(item: string, plan: CsPlan, clientName?: string): string | null {
  let text: string | null = null
  switch (item) {
    case CS_ITEMS.boasVindas:
      text = plan === 'singular' ? BOAS_VINDAS_SINGULAR : BOAS_VINDAS_TEMPLO
      break
    case CS_ITEMS.avaliacao:
      text = plan === 'singular' ? AVALIACAO_PENDENTE_SINGULAR : FORMULARIO_PENDENTE_TEMPLO
      break
    case CS_ITEMS.perfil:
      text = PERFIL_PENDENTE
      break
    case CS_ITEMS.app:
      text = APP_PENDENTE
      break
    default:
      return null
  }
  const first = (clientName ?? '').trim().split(/\s+/)[0]
  return first ? text.split('[nome]').join(first) : text
}

/** Dias corridos desde a entrada no CS (D0 = dia do acesso). */
export function daysInCs(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}
