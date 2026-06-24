import type { Config } from 'tailwindcss'

/**
 * Tailwind mapeado 1:1 para os CSS custom properties de tokens.css.
 * Regra do sistema: componentes usam classes Tailwind que resolvem para
 * tokens — zero hex hardcoded fora de tokens.css.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Espaçamento: usa a escala padrão do Tailwind, que já corresponde ao ritmo
    // base-4 da spec (0.5→2px, 1→4px, 2→8px, 3→12px … 32→128px) e inclui os
    // meios-passos (2.5, 3.5 …). Os tokens --space-* ficam em tokens.css como
    // documentação / uso em CSS cru.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      // Sólidas via canais RGB → habilitam modificadores de opacidade do
      // Tailwind (ex.: bg-ink-deep/70, border-err/40, hover:bg-slate-800/60).
      ink: {
        DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
        deep: 'rgb(var(--ink-deep-rgb) / <alpha-value>)',
      },
      slate: {
        900: 'rgb(var(--slate-900-rgb) / <alpha-value>)',
        800: 'rgb(var(--slate-800-rgb) / <alpha-value>)',
        700: 'rgb(var(--slate-700-rgb) / <alpha-value>)',
        600: 'rgb(var(--slate-600-rgb) / <alpha-value>)',
      },
      steel: {
        300: 'rgb(var(--steel-300-rgb) / <alpha-value>)',
        400: 'rgb(var(--steel-400-rgb) / <alpha-value>)',
        500: 'rgb(var(--steel-500-rgb) / <alpha-value>)',
        600: 'rgb(var(--steel-600-rgb) / <alpha-value>)',
        700: 'rgb(var(--steel-700-rgb) / <alpha-value>)',
        // tint/glow já são rgba prontos — não recebem alpha do utilitário.
        tint: 'var(--steel-tint)',
        glow: 'var(--steel-glow)',
      },
      sand: {
        100: 'rgb(var(--sand-100-rgb) / <alpha-value>)',
        200: 'rgb(var(--sand-200-rgb) / <alpha-value>)',
        300: 'rgb(var(--sand-300-rgb) / <alpha-value>)',
        deep: 'rgb(var(--sand-deep-rgb) / <alpha-value>)',
        tint: 'var(--sand-tint)',
      },
      // Texto. Obs.: a cor do corpo é "fg" (não "body") para não colidir com
      // o tamanho de fonte "body" — text-body é exclusivamente tamanho.
      strong: 'rgb(var(--text-strong-rgb) / <alpha-value>)',
      fg: 'rgb(var(--text-rgb) / <alpha-value>)',
      muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
      faint: 'rgb(var(--text-faint-rgb) / <alpha-value>)',
      'on-sand': 'rgb(var(--text-on-sand-rgb) / <alpha-value>)',
      // Foreground sobre preenchimento de accent (texto/ícone) e puck de
      // controle (Switch). Temáveis — não recebem modificador de opacidade.
      'accent-fg': 'var(--accent-fg)',
      knob: 'var(--knob)',
      // Status
      ok: {
        DEFAULT: 'rgb(var(--ok-rgb) / <alpha-value>)',
        tint: 'var(--ok-tint)',
      },
      err: {
        DEFAULT: 'rgb(var(--err-rgb) / <alpha-value>)',
        tint: 'var(--err-tint)',
      },
      warn: {
        DEFAULT: 'rgb(var(--warn-rgb) / <alpha-value>)',
        tint: 'var(--warn-tint)',
      },
    },
    // Linhas (hairlines) — usadas como borderColor
    borderColor: ({ theme }) => ({
      ...theme('colors'),
      DEFAULT: 'var(--line)',
      subtle: 'var(--line-subtle)',
      line: 'var(--line)',
      strong: 'var(--line-strong)',
    }),
    ringColor: ({ theme }) => ({
      ...theme('colors'),
      DEFAULT: 'var(--steel-glow)',
    }),
    fontFamily: {
      display: 'var(--font-display)',
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    },
    fontSize: {
      // [size, { lineHeight, letterSpacing }]
      // Lexend (display) tem boa legibilidade; tracking apertado em display.
      'display-xl': ['56px', { lineHeight: '1.04', letterSpacing: '-0.02em' }],
      'display-l': ['40px', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
      h1: ['30px', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
      h2: ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      h3: ['19px', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
      'body-l': ['16px', { lineHeight: '1.55' }],
      body: ['14px', { lineHeight: '1.55' }],
      'body-s': ['13px', { lineHeight: '1.5' }],
      caption: ['12px', { lineHeight: '1.45' }],
      'mono-label': ['11.5px', { lineHeight: '1.2', letterSpacing: '0.12em' }],
      'mono-data': ['13px', { lineHeight: '1.4' }],
    },
    borderRadius: {
      none: '0',
      xs: 'var(--r-xs)',
      sm: 'var(--r-sm)',
      md: 'var(--r-md)',
      lg: 'var(--r-lg)',
      xl: 'var(--r-xl)',
      '2xl': 'var(--r-2xl)',
      full: 'var(--r-full)',
    },
    boxShadow: {
      none: 'none',
      e1: 'var(--e1)',
      e2: 'var(--e2)',
      e3: 'var(--e3)',
      focus: 'var(--focus-ring)',
      active: 'var(--glow-active)',
    },
    extend: {
      backgroundImage: {
        'glow-steel': 'var(--glow-steel)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        inout: 'var(--ease-inout)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        DEFAULT: 'var(--dur)',
        slow: 'var(--dur-slow)',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1100',
        drawer: '1200',
        modal: '1300',
        popover: '1400',
        toast: '1500',
        tooltip: '1600',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in': 'fade-in var(--dur) var(--ease-out)',
        'slide-up': 'slide-up var(--dur) var(--ease-out)',
        'slide-in-right': 'slide-in-right var(--dur-slow) var(--ease-out)',
        spin: 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
