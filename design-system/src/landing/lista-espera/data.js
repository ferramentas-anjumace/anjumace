/* ============================================================================
   LISTA DE ESPERA — copy da página (rota /lista-de-espera)
   Copy do hero e do formulário reproduzida verbatim da página original
   (anjumace.com.br/lista-de-espera). Estados novos (sucesso/erro/privacidade)
   não existiam na original — texto próprio, curto e no tom da marca.
   ========================================================================= */

export const HERO = {
  title: 'Lista de espera.',
  description:
    'Clique no botão abaixo e esteja entre as primeiras a receber novidades sobre o meu acompanhamento individual.',
  cta: 'Entrar na lista de espera',
}

export const FORM = {
  title: 'Preencha o formulário para entrar na lista de espera',
  namePlaceholder: 'Seu nome...*',
  emailPlaceholder: 'Seu e-mail...*',
  whatsappPlaceholder: 'WhatsApp com DDD...*',
  consentBefore: 'Eu li e estou de acordo com as ',
  consentLink: 'políticas de privacidade',
  submit: 'Entrar na lista de espera',
}

export const ERROS = {
  name: 'Digite seu nome.',
  email: 'Digite um e-mail válido.',
  whatsapp: 'Digite seu WhatsApp com DDD.',
  consent: 'É preciso aceitar as políticas de privacidade.',
  network: 'Não foi possível enviar agora. Tente novamente em instantes.',
}

export const SUCESSO = {
  title: 'Você está na lista!',
  description:
    'Recebemos os seus dados. Em breve você vai saber das novidades do acompanhamento individual em primeira mão.',
  close: 'Fechar',
}

export const PRIVACIDADE = {
  title: 'Políticas de privacidade',
  paragraphs: [
    'Os dados informados neste formulário (nome, e-mail e WhatsApp) são usados exclusivamente para contato sobre a lista de espera do acompanhamento individual da Anju Mace.',
    'Não compartilhamos suas informações com terceiros. Você pode pedir a remoção dos seus dados a qualquer momento respondendo a qualquer um dos nossos contatos, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
  ],
  close: 'Entendi',
}
