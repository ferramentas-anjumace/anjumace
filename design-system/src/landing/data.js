/** ============================================================================
 *  LANDING "APP 7 DIAS" — conteúdo (copy real extraída da página WordPress).
 *  Mantido separado das seções para facilitar edição de textos/preços/stats.
 *
 *  ⚠️ Alguns números de estatística foram perdidos na exportação do site
 *  (contadores animados que vieram como "0"). Os valores marcados com
 *  // CONFIRMAR são a melhor estimativa a partir da fonte citada — revise.
 *  ========================================================================= */

export const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Metodologia', href: '#metodologia' },
  { label: 'Planos', href: '#planos' },
  { label: 'Garantia', href: '#garantia' },
  { label: 'Contato', href: '#contato' },
]

export const HERO = {
  eyebrow: 'Honre seu templo · Fortaleça seu corpo · Eleve sua alma',
  title: 'Desperte sua força',
  description:
    'Sua verdadeira potência exige técnica e propósito. Treine mais que o corpo: encontre a musa interior.',
  primaryCta: 'Baixe o app e inicie a jornada',
  secondaryCta: 'Iniciar sua jornada',
}

export const VIDEO = {
  title:
    'Descubra como despertar sua força interior e potencializar não apenas seu corpo, mas sua essência',
  caption: 'Assista ao vídeo e entenda',
  cta: 'Quero despertar minha musa interior',
  poster: '/landing/Modulo-3.webp',
}

export const MANIFESTO = {
  title: 'Aqui o movimento certo desperta a sua verdadeira força',
  lead: 'O exercício é a chave. Reencontrar sua essência é o destino.',
  paragraphs: [
    'Cada treino é uma chance de respeitarmos o nosso corpo enquanto olhamos pra dentro. Não buscamos apenas melhorar a aparência, mas quem somos por dentro.',
    'Baixe o app e encontre um espaço onde o suor vira conexão interior e a força física ajuda a revelar a pessoa incrível que você nasceu para ser.',
    'Quando você move o corpo com consciência, não apenas esculpe músculos — desperta potência, blinda a mente e liberta a musa interior.',
  ],
  cta: 'Iniciar sua jornada',
  screens: ['/landing/Frame-1707478510-1.webp', '/landing/Frame-1707478511.webp'],
}

/** 6 módulos da metodologia. stats: número grande + unidade + descrição + fonte. */
export const MODULES = [
  {
    n: 1,
    title: 'Resgatar a Dignidade e a Virtude do Corpo Feminino',
    image: '/landing/Modulo-1.webp',
    description:
      'Reconheça seu corpo como templo sagrado e harmonize força com delicadeza. Aprenda a distinguir elegância de vulgaridade, transformando o autocuidado em um ato de respeito profundo que projeta sua identidade e virtude ao mundo.',
    quote: 'A estética atrai o olhar, mas é a essência que conquista o respeito.',
    stats: [
      {
        value: '91', unit: '%', label: 'das mulheres insatisfeitas',
        text: '91% das mulheres estão insatisfeitas com seus corpos. Essa rejeição alimenta a busca desesperada por validação externa. Saia da estatística: troque a insegurança pela dignidade de ser única.',
        source: 'Pesquisa Global sobre Imagem Corporal',
      },
      {
        value: '7', unit: 's', label: 'para a primeira impressão',
        text: 'A neurociência revela que o cérebro leva apenas 7 segundos para formar uma primeira impressão sólida. Aqui você domina a técnica para que esse julgamento transmita virtude, elegância e autoridade.',
        source: 'Neurociência da percepção social',
      },
    ],
  },
  {
    n: 2,
    title: 'Ensinar Execução Técnica para Resultados',
    image: '/landing/Modulo-2.webp',
    description:
      'Domine a biomecânica e os ajustes finos que separam o esforço vazio do resultado real. Aprenda a manipular a falha muscular, corrigir vícios invisíveis e aplicar a ciência do movimento para esculpir seu corpo com segurança. Técnica perfeita é o respeito e a eficiência que seu corpo merece.',
    stats: [
      {
        value: '22', unit: '%', label: 'mais ativação muscular', // CONFIRMAR
        text: 'O aumento na ativação muscular ao usar a "conexão mente-músculo" (foco interno) durante o exercício. Treinar distraída reduz drasticamente o recrutamento de fibras no músculo-alvo.',
        source: 'Calatayud, J. et al. (2016). PubMed',
      },
      {
        value: '2', unit: 'x', label: 'mais hipertrofia',
        text: 'A amplitude completa no agachamento pode gerar mais que o dobro de hipertrofia nos glúteos comparado a movimentos parciais. A profundidade não é detalhe, é determinante para o resultado.',
        source: 'Kubo, K. et al. (2019). PubMed',
      },
    ],
  },
  {
    n: 3,
    title: 'Estética Feminina com Propósito',
    image: '/landing/Modulo-3.webp',
    description:
      'Descubra a estética como linguagem silenciosa de dignidade, não vaidade. Use roupas, cores e postura para honrar sua essência. Domine a arte de alinhar imagem e valores, transformando sua presença em uma ferramenta de influência e respeito imediato. Sua imagem é um manifesto de quem você é.',
    stats: [
      {
        value: '100', unit: 'ms', label: 'Milissegundos', // CONFIRMAR
        text: 'É o tempo que o cérebro leva para formar uma primeira impressão sobre você apenas pela aparência. Antes de você dizer "olá", sua imagem já comunicou competência, confiança e dignidade — ou a falta delas.',
        source: 'Association for Psychological Science',
      },
      {
        value: '20', unit: '%', label: 'a mais de salário', // CONFIRMAR
        text: 'A diferença salarial média que pessoas com apresentação pessoal cuidada ("grooming") têm sobre as que negligenciam a imagem. A elegância não é futilidade, é um investimento de alto retorno na carreira.',
        source: 'The Washington Post / Wong & Penner',
      },
    ],
  },
  {
    n: 4,
    title: 'Fortalecer a Identidade Feminina',
    image: '/landing/Modulo-4.webp',
    description:
      'Liberte-se da exaustão de tentar ser quem não é. Abandone a competição e a insegurança para ancorar sua vida em uma identidade sólida. Harmonize força e delicadeza, cultive virtudes inabaláveis e construa relacionamentos dignos. A verdadeira força não grita, ela acolhe. Descubra o poder de ser, finalmente, você mesma.',
    stats: [
      {
        value: '70', unit: '%', label: 'sentem pressão por estereótipos', // CONFIRMAR
        text: 'Percentual de mulheres que sentem pressão para se parecerem com os modelos que veem na mídia. O módulo ensina a quebrar esse ciclo, trocando a comparação externa por uma segurança interna inabalável.',
        source: 'Pesquisa Global Dove sobre Beleza e Confiança',
      },
      {
        value: '2', unit: 'x', label: 'mais ansiedade',
        text: 'Mulheres têm duas vezes mais chances de desenvolver transtornos de ansiedade do que homens. Ao fortalecer identidade, propósito e virtudes, você cria uma barreira natural contra a insegurança crônica.',
        source: 'Anxiety and Depression Association of America',
      },
    ],
  },
  {
    n: 5,
    title: 'Crítica Cultural com Base Moral',
    image: '/landing/Modulo-5.webp',
    description:
      'Vivemos em um mundo que vende prazer imediato e esconde o custo. Desenvolva a visão crítica para não ser massa de manobra. Blinde sua mente contra a inversão de valores, o consumismo sem fim e ideologias que fragilizam a família. Seja a mulher que tem coragem de definir o próprio padrão de verdade.',
    stats: [
      {
        value: '78', unit: '%', label: 'das famílias endividadas', // CONFIRMAR
        text: 'A idolatria do sucesso material criou uma geração que gasta o que não tem para provar valor. A verdadeira dignidade não está no que você compra, mas na integridade de quem você é.',
        source: 'CNC / Agência Brasil',
      },
      {
        value: '11', unit: 'mi', label: 'de mães solo no Brasil',
        text: 'A desvalorização cultural da complementaridade entre homem e mulher gera sobrecarga real. A ideologia que nega a importância dos papéis familiares ignora a necessidade de uma base social estável.',
        source: 'Agência Brasil (2022)',
      },
    ],
  },
  {
    n: 6,
    title: 'Desenvolvimento Pessoal Feminino',
    image: '/landing/Modulo-6.webp',
    description:
      'Domine a disciplina elegante e transforme intenção em realidade. Gerencie seu tempo como o bem mais precioso e use o poder dos pequenos hábitos para construir sua identidade. Saia do caos para uma vida de ordem, leveza e constância. Disciplina não é rigidez, é a forma mais alta de amor-próprio.',
    stats: [
      {
        value: '40', unit: '%', label: 'da vida no automático', // CONFIRMAR
        text: 'Quase metade do que você faz diariamente não é decisão, é hábito. Seus rituais invisíveis pilotam sua vida. Ou você desenha seus hábitos conscientemente, ou será refém de padrões que não escolheu.',
        source: 'NPR / Duke University',
      },
      {
        value: '1', unit: '%', label: 'melhor a cada dia', // CONFIRMAR (stat reconstruída)
        text: 'Pequenos avanços diários se acumulam. A constância vence a intensidade: 1% melhor todos os dias constrói, ao longo de um ano, uma versão imensamente mais forte de você.',
        source: 'James Clear — Hábitos Atômicos',
      },
    ],
  },
]

export const ECOSYSTEM = {
  title:
    'Um ecossistema de transformação onde técnica, ciência e sabedoria se fundem para sua evolução integral',
  items: [
    {
      icon: 'BookOpen', title: 'Blog',
      description:
        'Mergulhe em ensaios profundos que unem rigor científico e filosofia de vida. Acesse o conhecimento que fundamenta sua prática, educa seu olhar e liberta você de mitos superficiais do mercado.',
    },
    {
      icon: 'Dumbbell', title: 'Programa de Treinos',
      description:
        'Acesse a metodologia que une precisão anatômica e consciência corporal. Treinos periodizados para esculpir com segurança, respeitando sua biologia e maximizando cada movimento.',
    },
    {
      icon: 'Users', title: 'Comunidade',
      description:
        'Junte-se à Aliança das Musas. Um ambiente seguro de elevação mútua, onde mulheres comprometidas com a excelência compartilham experiências e celebram a construção de uma força real.',
    },
    {
      icon: 'Sparkles', title: 'A.I. Planning',
      description:
        'Tecnologia a serviço da sua individualidade. Nossa inteligência adapta a periodização ao seu ritmo e necessidades, garantindo um planejamento que serve à sua vida — e não o contrário.',
    },
  ],
}

export const JOURNEY = {
  title: 'Não entregamos apenas treinos, desenhamos sua ascensão.',
  description:
    'Da técnica precisa à identidade inabalável, percorra o caminho que transforma esforço físico em potência feminina absoluta. Sua evolução não é linear, é estrutural.',
  stages: [
    {
      n: '01', title: 'O Despertar da Consciência Corporal',
      description:
        'Domine a execução perfeita e saia do piloto automático. Cada repetição é um ato de presença que constrói uma base física sólida e prepara você para voos maiores.',
    },
    {
      n: '02', title: 'A Força da Disciplina Inegociável',
      description:
        'A constância vence a intensidade. Transforme o esforço diário em um hábito elegante que blinda sua mente contra a preguiça e estrutura uma vida de realizações reais.',
    },
    {
      n: '03', title: 'A Expressão da Sua Potência Real',
      description:
        'O estágio final é a liberdade. Com corpo forte e mente ordenada, você manifesta sua verdadeira essência: uma mulher segura, feminina e dona da própria história.',
    },
  ],
}

export const TESTIMONIALS = {
  title: 'Musas despertas',
  lead: 'Não são apenas corpos esculpidos, são narrativas reescritas.',
  description:
    'Conheça as mulheres que uniram a precisão técnica à sabedoria feminina, abandonando a superficialidade para viver uma transformação integral — visível no espelho e sentida na alma.',
  // ⚠️ Depoimentos eram placeholder (lorem ipsum) na página original.
  // Substitua por depoimentos reais quando tiver.
  items: [
    { quote: 'Substituir por depoimento real.', author: 'Nome da aluna', role: 'Aliança das Musas' },
    { quote: 'Substituir por depoimento real.', author: 'Nome da aluna', role: 'Aliança das Musas' },
    { quote: 'Substituir por depoimento real.', author: 'Nome da aluna', role: 'Aliança das Musas' },
  ],
}

export const PLANS_INTRO = {
  title: 'Um caminho. Uma escolha. Uma transformação integral.',
  description:
    'Para a mulher que decidiu parar de esperar o momento certo e começou a criar o ambiente que sua evolução exige. Aqui você encontra método, presença e uma comunidade que acredita no que você ainda está descobrindo em si mesma.',
}

export const PLANS = [
  {
    name: 'Iniciação', price: 'R$ 0', period: '',
    description:
      'O primeiro passo para sair da superficialidade do mercado. Acesse a biblioteca de ensaios e observe a dinâmica de uma comunidade que valoriza a excelência técnica e moral.',
    features: ['Blog completo', 'Comunidade (visualização)', 'Curadoria'],
    cta: 'Criar conta gratuita',
  },
  {
    name: 'Aliança', price: 'R$ 147', period: '/mês', featured: true, badge: 'Mais escolhido',
    description:
      'Para a mulher que decidiu investir em si mesma. Acesso irrestrito a todo o acervo e seu lugar de fala dentro da nossa aliança.',
    features: ['Comunidade', 'Acervo completo', 'Evolução constante', 'Materiais complementares', 'AI Planning', 'Experiência premium'],
    cta: 'Firmar compromisso mensal',
  },
  {
    name: 'Experiência VIP', price: 'R$ 197', period: '/mês',
    description:
      'A união definitiva entre ciência e individualidade. Receba a inteligência estratégica que adapta a metodologia à sua realidade biológica e rotina.',
    features: ['Tudo do plano Aliança', 'Materiais complementares', 'AI Planning', 'Experiência premium'],
    cta: 'Elevar meu padrão',
  },
  {
    name: 'Mentoria', price: 'R$ 249', period: '/mês',
    description:
      'Não caminhe sozinha. Um olhar clínico sobre seu planejamento e uma parceira de responsabilidade para garantir que a disciplina vença a inércia.',
    features: ['Planejamento individual', 'Acompanhamento', 'Accountability partner'],
    cta: 'Acelerar resultados',
  },
  {
    name: 'Elite', price: 'R$ 249', period: '/mês',
    description:
      'Acesso direto à Anju Mace, eventos que marcam a alma e um grupo seleto de mulheres que vibram na mais alta frequência de potência e realização.',
    features: ['Grupo exclusivo', 'Eventos fechados', 'Mentoria com Anju'],
    cta: 'Aplicar para o círculo',
  },
]

export const GUARANTEE = {
  title: 'Confiança absoluta na transformação: você tem 7 dias para decidir ficar',
  description:
    'Explore a plataforma e a comunidade. Se em até 7 dias sentir que este não é o ambiente ideal para sua evolução, basta um e-mail. Sem burocracia, realizamos o reembolso integral do valor.',
}

export const SERIES = {
  title:
    'Séries originais que fundem biomecânica avançada e sabedoria ancestral',
  description:
    'Do rigor técnico à filosofia de vida. Selecione sua trilha e dê o play em conteúdos cinematográficos que respeitam sua inteligência, educam seu movimento e transformam sua realidade.',
  covers: [
    '/landing/Modulo-1.webp', '/landing/Modulo-2.webp', '/landing/Modulo-3.webp',
    '/landing/Modulo-4.webp', '/landing/Modulo-5.webp', '/landing/Modulo-6.webp',
  ],
}

export const FAQ_ITEMS = [
  {
    question: 'Como funciona a consultoria de treino personalizada?',
    answer:
      'Começamos com uma análise técnica aprofundada do seu perfil: histórico de treinamento, objetivos específicos, particularidades biomecânicas e contexto de vida. A partir dessa avaliação, desenvolvemos protocolos personalizados que respeitam sua singularidade enquanto aplicam os princípios científicos mais avançados de periodização e progressão — com ajustes contínuos e orientação precisa em cada fase.',
  },
  {
    question: 'Qual a diferença entre a sua metodologia e outros programas de treino?',
    answer:
      'Enquanto o mercado vende exaustão e estética a qualquer custo, nós entregamos precisão biomecânica integrada à construção de identidade. Não dissociamos o corpo da essência: aqui, a estética refinada é consequência inevitável de um corpo funcional, de uma técnica perfeita e de uma mente ordenada por virtudes.',
  },
  {
    question: 'Preciso ter experiência prévia com treinamento?',
    answer:
      'Absolutamente não. A metodologia foi desenhada para conduzir você do zero à maestria — dos fundamentos da postura aos ajustes finos mais avançados. Iniciar sem vícios técnicos pode, inclusive, acelerar seu aprendizado e garantir uma base sólida desde o primeiro dia.',
  },
  {
    question: 'Quanto tempo leva para ter resultados significativos?',
    answer:
      'A mudança mental e postural é imediata. A resposta física respeita a biologia: com a aplicação correta da técnica e constância, mudanças visíveis na composição corporal e no tônus muscular tornam-se evidentes entre 8 e 12 semanas. Não vendemos milagres, mas a certeza de que a disciplina inteligente gera evolução.',
  },
  {
    question: 'Como funciona o planejamento de treino?',
    answer:
      'Você responde um questionário rápido sobre objetivos, nível de experiência e rotina. A partir disso, nossa inteligência gera um protocolo estruturado e adaptado ao seu perfil, com progressão planejada e ajustes conforme sua evolução. Sem burocracia, sem espera: prático, preciso e pronto para executar.',
  },
]

export const FOOTER = {
  tagline:
    'Não é apenas sobre beleza, é sobre quem você se torna no processo. Transforme o esforço físico em um ritual de autodescoberta. Movimento consciente para mulheres que exigem profundidade.',
  whatsapp: 'WhatsApp',
  email: 'suporte@anjumace.com.br',
  nav: ['Início', 'Metodologia', 'Planos', 'Garantia', 'Contato'],
  legal: ['Termos & Regulamento', 'Política de Privacidade'],
  copyright: 'Anju Mace — Todos os direitos reservados',
}
