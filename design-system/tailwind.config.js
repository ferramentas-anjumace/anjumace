/** ============================================================================
 *  ANJU MACE · DESIGN SYSTEM — tailwind.config.js
 *  Mapeia os tokens (CSS variables) para utilitários Tailwind.
 *  Regra: utilitários SEMÂNTICOS (bg-surface, text-primary, bg-accent) são a
 *  via preferida em componentes. As ramps primitivas (sage-400, gold-300…)
 *  existem para casos pontuais e para o showcase.
 *  ========================================================================= */

/**
 * Torna um token var(--x) compatível com o modificador de opacidade do
 * Tailwind (ex.: bg-accent/30). Sem isso, o v3 descarta a declaração
 * silenciosamente, porque não consegue aplicar alpha num hex escondido
 * numa CSS variable. Com <alpha-value> = 1 (sem modificador) o color-mix
 * devolve a cor original.
 */
const withAlpha = (value) =>
  `color-mix(in srgb, ${value} calc(<alpha-value> * 100%), transparent)`

const alphaColors = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === 'string' ? withAlpha(v) : alphaColors(v),
    ]),
  )

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    /* Breakpoints derivados dos formatos do material (mobile 390 → desktop 1440) */
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        md: '2.5rem',
        lg: '4rem',
        xl: '5rem',
      },
      screens: {
        '2xl': '1200px', // largura útil de conteúdo
      },
    },
    extend: {
      colors: alphaColors({
        /* ----- SEMÂNTICOS (preferir em componentes) ----- */
        surface: {
          DEFAULT: 'var(--surface)',
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
          sunken: 'var(--surface-sunken)',
          muted: 'var(--surface-muted)',
          warm: 'var(--surface-warm)',
          inverse: 'var(--surface-inverse)',
          glass: 'var(--surface-glass)',
        },
        content: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
          inverse: 'var(--text-inverse)',
          link: 'var(--text-link)',
          'on-accent': 'var(--text-on-accent)',
          'on-accent-2': 'var(--text-on-accent-2)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          active: 'var(--accent-active)',
          subtle: 'var(--accent-subtle)',
          text: 'var(--accent-text)',
          on: 'var(--on-accent)',
        },
        'accent-2': {
          DEFAULT: 'var(--accent-2)',
          hover: 'var(--accent-2-hover)',
          active: 'var(--accent-2-active)',
          subtle: 'var(--accent-2-subtle)',
          text: 'var(--accent-2-text)',
          on: 'var(--on-accent-2)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          subtle: 'var(--border-subtle)',
          accent: 'var(--border-accent)',
          inverse: 'var(--border-inverse)',
        },
        success: { DEFAULT: 'var(--success)', surface: 'var(--success-surface)', text: 'var(--success-text)' },
        warning: { DEFAULT: 'var(--warning)', surface: 'var(--warning-surface)', text: 'var(--warning-text)' },
        danger:  { DEFAULT: 'var(--danger)',  surface: 'var(--danger-surface)',  text: 'var(--danger-text)' },
        info:    { DEFAULT: 'var(--info)',    surface: 'var(--info-surface)',    text: 'var(--info-text)' },
        focus:   'var(--focus-ring)',

        /* ----- PRIMITIVOS (ramps de marca) ----- */
        graphite: {
          50: 'var(--graphite-50)', 100: 'var(--graphite-100)', 200: 'var(--graphite-200)',
          300: 'var(--graphite-300)', 400: 'var(--graphite-400)', 500: 'var(--graphite-500)',
          600: 'var(--graphite-600)', 700: 'var(--graphite-700)', 800: 'var(--graphite-800)',
          900: 'var(--graphite-900)', 950: 'var(--graphite-950)',
        },
        cream: { 50: 'var(--cream-50)', 100: 'var(--cream-100)', 200: 'var(--cream-200)', 300: 'var(--cream-300)' },
        sand:  { 50: 'var(--sand-50)', 100: 'var(--sand-100)', 200: 'var(--sand-200)' },
        mist:  { 50: 'var(--mist-50)', 100: 'var(--mist-100)', 200: 'var(--mist-200)', 300: 'var(--mist-300)' },
        sage: {
          50: 'var(--sage-50)', 100: 'var(--sage-100)', 200: 'var(--sage-200)', 300: 'var(--sage-300)',
          400: 'var(--sage-400)', 500: 'var(--sage-500)', 600: 'var(--sage-600)', 700: 'var(--sage-700)',
          800: 'var(--sage-800)', 900: 'var(--sage-900)',
        },
        celery: { 100: 'var(--celery-100)', 200: 'var(--celery-200)', 300: 'var(--celery-300)' },
        gold: {
          50: 'var(--gold-50)', 100: 'var(--gold-100)', 200: 'var(--gold-200)', 300: 'var(--gold-300)',
          400: 'var(--gold-400)', 500: 'var(--gold-500)', 600: 'var(--gold-600)', 700: 'var(--gold-700)', 800: 'var(--gold-800)',
        },
        taupe: { 100: 'var(--taupe-100)', 300: 'var(--taupe-300)', 500: 'var(--taupe-500)', 700: 'var(--taupe-700)' },
        slate: { 200: 'var(--slate-200)', 300: 'var(--slate-300)', 400: 'var(--slate-400)', 500: 'var(--slate-500)', 600: 'var(--slate-600)' },
      }),

      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        '2xs': 'var(--text-2xs)',
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
        '7xl': 'var(--text-7xl)',
      },
      fontWeight: {
        thin: 'var(--weight-thin)',
        light: 'var(--weight-light)',
        normal: 'var(--weight-regular)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
        bold: 'var(--weight-bold)',
        black: 'var(--weight-black)',
      },
      lineHeight: {
        none: 'var(--leading-none)',
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
      },
      letterSpacing: {
        tighter: 'var(--tracking-tighter)',
        tight: 'var(--tracking-tight)',
        normal: 'var(--tracking-normal)',
        wide: 'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
      },
      spacing: {
        0.5: 'var(--space-0_5)', 1: 'var(--space-1)', 1.5: 'var(--space-1_5)', 2: 'var(--space-2)',
        3: 'var(--space-3)', 4: 'var(--space-4)', 5: 'var(--space-5)', 6: 'var(--space-6)',
        8: 'var(--space-8)', 10: 'var(--space-10)', 12: 'var(--space-12)', 16: 'var(--space-16)',
        20: 'var(--space-20)', 24: 'var(--space-24)', 32: 'var(--space-32)', 40: 'var(--space-40)',
        48: 'var(--space-48)', 64: 'var(--space-64)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glass: 'var(--shadow-glass)',
        focus: 'var(--focus-shadow)',
        none: 'none',
      },
      backdropBlur: {
        sm: 'var(--blur-sm)',
        md: 'var(--blur-md)',
        lg: 'var(--blur-lg)',
        xl: 'var(--blur-xl)',
        '2xl': 'var(--blur-2xl)',
      },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        moderate: 'var(--duration-moderate)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        out: 'var(--ease-out)',
        in: 'var(--ease-in)',
        'in-out': 'var(--ease-in-out)',
        spring: 'var(--ease-spring)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        /* Landing / marketing — decorativos longos (fora da UI de app) */
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        'ken-burns': { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.1)' } },
        /* Zoom que vai e volta — pulsação lenta de foto de fundo. */
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        cue: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.9' },
          '50%': { transform: 'translateY(8px)', opacity: '0.35' },
        },
        shine: {
          from: { transform: 'translateX(-160%) skewX(-18deg)' },
          to: { transform: 'translateX(260%) skewX(-18deg)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(3rem, -2.5rem) scale(1.1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-moderate) var(--ease-out) both',
        'fade-in-up': 'fade-in-up var(--duration-slow) var(--ease-out) both',
        'scale-in': 'scale-in var(--duration-base) var(--ease-spring) both',
        marquee: 'marquee 38s linear infinite',
        float: 'float 7s var(--ease-in-out) infinite',
        'float-slow': 'float 11s var(--ease-in-out) infinite',
        'ken-burns': 'ken-burns 18s var(--ease-out) both',
        breathe: 'breathe 18s var(--ease-in-out) infinite',
        cue: 'cue 2.2s var(--ease-in-out) infinite',
        shine: 'shine 7s var(--ease-in-out) infinite',
        'spin-slow': 'spin 48s linear infinite',
        drift: 'drift 9s var(--ease-in-out) infinite',
        'drift-slow': 'drift 14s var(--ease-in-out) infinite reverse',
      },
    },
  },
  plugins: [],
}
