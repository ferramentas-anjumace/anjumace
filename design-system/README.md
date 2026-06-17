# Anju Mace · Design System

Design system **premium, minimalista e editorial** (referência Apple) para todo o ecossistema da Anju Mace — personal & nutricionista: páginas de vendas, captura, formulários, quizzes, criativos sociais, slides de aula, app (área de membros) e landing pages.

Construído em **React + Vite + Tailwind CSS**, com tokens em 3 camadas (CSS variables) e **tema claro/escuro nativos**. Todos os valores foram **extraídos do material real** da marca (Figma) — nada genérico.

```bash
npm install
npm run dev      # showcase em http://localhost:5173
npm run build    # build de produção
```

---

## Princípios de design

1. **Editorial e premium** — hierarquia conduzida por **tipografia, não por cor**.
2. **Cor como acento** sobre base neutra generosa: grafite + creme (base) · **sálvia** (acento primário) · **dourado** (secundário/premium).
3. **Whitespace generoso** e grid disciplinado (escala 4/8pt).
4. **Profundidade sutil** — sombras suaves, vidro (glass) leve.
5. **Motion curto e suave** — 150–400ms, easings `cubic-bezier`.
6. **Acessível** — contraste WCAG AA verificado, foco visível, `prefers-reduced-motion`.

## Identidade (resumo)

| | |
|---|---|
| **Display / títulos** | Lexend (peso light em tamanhos grandes) |
| **Texto / UI** | Outfit |
| **Acento primário** | Sálvia `#9EAB87` |
| **Acento secundário** | Dourado `#DABE81` |
| **Base clara** | Creme `#F5F5DD` |
| **Base escura** | Grafite `#282828` |
| **Ícones** | Monoline geométrico (traço ~1.5px) |

---

## Arquitetura de tokens

```
src/tokens/primitives.css   valores brutos        --sage-400, --space-4, --text-5xl …
src/tokens/semantic.css     propósito + tema      --accent, --surface, --text-primary  [data-theme]
                            + camada de componente --button-*, --input-*, --card-* …
src/tokens/index.css        agrega as camadas
src/index.css               fontes + tokens + Tailwind + base + classes .text-*
tailwind.config.js          mapeia tokens → utilitários
```

**Regra de ouro:** componentes consomem a **camada semântica** (`bg-accent`, `text-content`, `bg-surface`), nunca primitivos ou hex.

### Tema

```html
<html data-theme="light">  <!-- padrão -->
<html data-theme="dark">
```

O mesmo componente troca de tema sem alteração de código — só os tokens semânticos remapeiam.

---

## Uso

```jsx
import { Button, Card, Hero, SocialProof } from './src/components'

<Hero
  image="/hero.jpg"
  eyebrow="Método Anju Mace"
  title="A transformação que você merece começa aqui."
  actions={<Button size="lg">Avaliação exclusiva</Button>}
/>
```

Classes de tipografia da marca: `.text-display`, `.text-h1…h6`, `.text-body`, `.text-label`.
Utilitário de vidro: `.glass`.

---

## Estrutura

```
design-system/
├─ src/
│  ├─ tokens/          primitives · semantic · index
│  ├─ components/      ~45 componentes (1 pasta cada)
│  ├─ showcase/        página renderável (6 abas) + tema
│  ├─ lib/cn.js        helper de classes (clsx + tailwind-merge)
│  └─ index.css        entrypoint de estilos
├─ docs/
│  ├─ foundations/     color · type · spacing · elevation · motion · grid · iconography
│  └─ components/      base · marketing · app · forms-quiz · overlays · templates
├─ tailwind.config.js
└─ README.md
```

## Showcase

`npm run dev` abre uma página com **6 abas**: Foundations (tokens visuais), Base, Marketing, App, Forms/Quiz e Templates — com **seletor de tema claro/escuro** persistente. É a forma mais rápida de ver o sistema inteiro.

## Catálogo de componentes

- **Base** — Button, Input, Textarea, Select, Checkbox, Radio, Toggle, Label, Badge, Chip, Avatar, Divider, Tooltip
- **Marketing** — Hero, Section/SectionHeader, Card, Feature, Stat, SocialProof, Testimonial, MediaPlayer, FAQ, Pricing, CTABlock, LeadCapture
- **App/Membros** — ProfileHeader, CalendarStrip, WorkoutCard, BottomNav, ListItem, ProgressBar/Ring, CommunityPost
- **Quiz** — Quiz, QuizQuestion, QuizOption, QuizProgress, QuizResult
- **Overlays** — Modal, Drawer, Toast
- **Marca/Templates** — Wordmark, DocPage, ChecklistTemplate, Slide(Cover/Content/Quote/Closing), SocialCard

Documentação completa em [`docs/`](./docs/README.md).
