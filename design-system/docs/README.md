# Documentação · Anju Mace Design System

Índice geral. Comece pelo [README do projeto](../README.md) para visão e instalação.

## Foundations

| Doc | Cobre |
|---|---|
| [foundations/color.md](./foundations/color.md) | Paleta (primitiva → semântica → componente), temas, contraste WCAG AA |
| [foundations/type.md](./foundations/type.md) | Lexend + Outfit, escala, pesos, tracking, classes `.text-*` |
| [foundations/spacing.md](./foundations/spacing.md) | Escala 4/8pt e ritmo de seção |
| [foundations/elevation.md](./foundations/elevation.md) | Sombras, raios, glass, blur |
| [foundations/motion.md](./foundations/motion.md) | Durações, easings, animações |
| [foundations/grid.md](./foundations/grid.md) | Breakpoints, container, formatos de canvas |
| [foundations/iconography.md](./foundations/iconography.md) | Estilo monoline, UI icons, símbolos, foto |

## Componentes

| Doc | Cobre |
|---|---|
| [components/base.md](./components/base.md) | Button, Badge, Chip, Avatar, Inputs, Checkbox/Radio/Toggle, Divider, Tooltip |
| [components/marketing.md](./components/marketing.md) | Hero, Section, Card, Feature, Stat, SocialProof, Testimonial, MediaPlayer, FAQ, Pricing, CTA, LeadCapture |
| [components/app.md](./components/app.md) | ProfileHeader, CalendarStrip, WorkoutCard, BottomNav, ListItem, Progress, CommunityPost |
| [components/forms-quiz.md](./components/forms-quiz.md) | Validação de formulário, Quiz completo e subcomponentes |
| [components/overlays.md](./components/overlays.md) | Modal, Drawer, Toast |
| [components/templates.md](./components/templates.md) | Wordmark, DocPage, ChecklistTemplate, Slides, SocialCard |

## Showcase ao vivo

`npm run dev` → 6 abas (Foundations · Base · Marketing · App · Forms/Quiz · Templates) com seletor de tema.

## Convenções

- **Tokens semânticos** em componentes (`bg-accent`, `text-content`), nunca hex.
- **1 pasta por componente** em `src/components/<Nome>/<Nome>.jsx`, reexportado em `src/components/index.js`.
- Classes utilitárias da marca: `.text-display`…`.text-label`, `.glass`.
- Helper `cn()` (clsx + tailwind-merge) para mesclar `className`.
- Acessibilidade: foco visível, labels/aria, contraste AA, `prefers-reduced-motion`.
