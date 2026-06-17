# Componentes de Marketing / Vendas

Blocos para páginas de venda, captura e landing. Compõem-se entre si e com os componentes base. Todos em tokens, responsivos e com tema claro/escuro.

```jsx
import {
  Section, SectionHeader, Eyebrow, Highlight,
  Hero, Feature, FeatureGrid, Card, Stat, StatGroup,
  SocialProof, Rating, Testimonial, MediaPlayer,
  FAQ, PricingCard, PricingTable, CTABlock, LeadCapture,
} from './components'
```

---

## Section · SectionHeader

Ritmo editorial da página.

**Section** — `tone` (`base`/`surface`/`muted`/`warm`/`inverse`), `padding` (`sm`/`md`/`lg`), `container` (bool), `as`.
**SectionHeader** — `eyebrow`, `title`, `description`, `align` (`left`/`center`), `as`.
**Eyebrow** — label bullet caixa-alta. **Highlight** — palavra com acento sálvia dentro do título.

```jsx
<Section tone="surface" padding="md">
  <SectionHeader eyebrow="Who we are"
    title={<>Pioneiras em <Highlight>transformação consciente</Highlight></>}
    description="Uma abordagem que redefine o treino feminino." />
</Section>
```

## Hero

Abertura. Com `image` entra em modo imersivo (foto escura + texto claro + scrim).

| Prop | Descrição |
|---|---|
| `eyebrow`, `title`, `description` | conteúdo |
| `actions` | CTAs (ReactNode) |
| `aside` | bloco extra (ex. `<SocialProof variant="glass" />`) |
| `image` | foto de fundo (ativa modo imersivo) |
| `overlay` | 0–100 intensidade do scrim |
| `align` | `left` \| `center` |
| `minH` | classe de altura mínima |

```jsx
<Hero image="/hero.jpg" eyebrow="Método" title="A transformação que você merece começa aqui."
  actions={<><Button size="lg">Avaliação</Button><Button variant="ghost">Vídeo</Button></>}
  aside={<SocialProof variant="glass" people={people} label="+2.000 alunas" />} />
```

## Feature · FeatureGrid

`Feature`: `icon`, `title`, `description`, `align`, `iconStyle` (`plain`/`circle`).
`FeatureGrid`: `columns` (2/3/4).

## Card

`variant` (`surface`/`elevated`/`outline`/`muted`/`glass`), `padding` (`none`/`sm`/`md`/`lg`), `interactive`, `as`. Subcomponentes: `CardHeader/Title/Description/Content/Footer`.

## Stat · StatGroup

Destaque numérico (`value`, `label`, `align`) em grade (`StatGroup`).

## SocialProof · Rating · Testimonial

**SocialProof** — `people[]`, `rating`, `label`, `variant` (`plain`/`card`/`glass`).
**Rating** — `value`, `max`, `size` (estrelas douradas).
**Testimonial** — `quote`, `author`, `role`, `avatarSrc`, `rating`, `variant`.

## MediaPlayer

Foto/vídeo com botão play de vidro. `image`, `alt`, `ratio` (`video`/`square`/`portrait`), `chip` (ex. `<Chip glass>12:30</Chip>`), `onPlay`.

## FAQ

Accordion estilo **timeline** (linha + nós). `items=[{question, answer, icon?}]`, `defaultOpenIndex`. Acessível (`aria-expanded`/`region`).

## Pricing

**PricingCard** — `name`, `price`, `period`, `description`, `features[]`, `featured`, `badge`, `cta` (`{label,onClick}` ou ReactNode).
**PricingTable** — grade de 3.

## CTABlock

Chamada final. `eyebrow`, `title`, `description`, `actions`, `tone` (`inverse`/`accent`/`surface`), `align`.

## LeadCapture

Captura de e-mail. `title`, `description`, `layout` (`inline`/`stacked`), `ctaLabel`, `placeholder`, `note`, `onSubmit`, `tone`.

---

### Do / Don't
- ✅ Uma seção = uma ideia; respiro generoso entre elas (`Section padding`).
- ✅ Hero imersivo: headline em peso light, scrim suficiente para contraste.
- ✅ Um único `primary` por seção; dourado para premium.
- ❌ Empilhar acentos competindo (sálvia + dourado fortes no mesmo bloco).
- ❌ Texto sobre foto sem scrim/contraste.
