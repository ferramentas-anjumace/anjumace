# Componentes de App / Área de membros

Componentes mobile-first (base 390px) para a área de membros. Todos em tokens, tema claro/escuro nativo.

```jsx
import {
  ProfileHeader, CalendarStrip, WorkoutCard, BottomNav,
  ListItem, ProgressBar, ProgressRing, CommunityPost,
} from './components'
```

---

## ProfileHeader

Topo do app: avatar (+VIP) · saudação/data · sino com badge.

| Prop | Descrição |
|---|---|
| `name`, `src`, `vip` | avatar |
| `greeting` | linha superior (ex. "Terça, 19 Jul") |
| `title` | título principal (ex. "Meu treino") |
| `notifications` | nº no sino (0 oculta) |
| `onBell` | handler |

## CalendarStrip

Faixa horizontal de dias (seletor de data). Chip circular; selecionado em dourado; "hoje" com aro.

| Prop | Descrição |
|---|---|
| `days` | `[{ date, weekday?, done? }]` |
| `selected` | índice selecionado |
| `todayIndex` | índice do dia atual |
| `onSelect(i)` | callback |

## WorkoutCard

Card de treino/aula: foto full-bleed, chip de vidro, overlay de título, botão "Iniciar" (pill branco + seta sálvia).

| Prop | Descrição |
|---|---|
| `image`, `alt` | foto |
| `duration` | chip de vidro (ex. "45 minutos") |
| `kicker` | rótulo acima do título |
| `title`, `description` | conteúdo |
| `ctaLabel`, `onStart` | ação (default "Iniciar") |
| `ratio` | `portrait` \| `video` \| `square` |

## BottomNav

Barra flutuante com ação central destacada (círculo dourado).

| Prop | Descrição |
|---|---|
| `items` | `[{ id, icon, label, action? }]` — `action:true` = botão central |
| `active` | id ativo |
| `onChange(id)` | callback |

> No app real, posicione com `fixed bottom-4 inset-x-4` (ou `sticky bottom-4`).

## ListItem

Linha de lista (exercício/aula). `media`, `title`, `subtitle`, `meta`, `done` (check sálvia), `trailing` custom, `onClick` (torna interativa + chevron).

## ProgressBar · ProgressRing

**ProgressBar** — `value` (0–100), `tone` (`accent`/`accent-2`/`success`), `size`, `showLabel`.
**ProgressRing** — `value`, `size`, `stroke`, `tone`, `children` (conteúdo central). Acessível (`role=img` + aria-label).

## CommunityPost

Card de post da comunidade. `author`, `role`, `avatarSrc`, `time`, `text`, `image`, `likes`, `comments`, `liked`, `onLike`, `onComment`.

---

### Do / Don't
- ✅ Hierarquia clara no topo (saudação pequena → título grande).
- ✅ Dourado como destaque de seleção/ação central; sálvia para progresso/estado.
- ✅ Cards de treino sempre com scrim para legibilidade do overlay.
- ❌ Não encher a bottom-nav (4–5 itens no máximo).
- ❌ Não usar foto sem gradiente atrás de texto.
