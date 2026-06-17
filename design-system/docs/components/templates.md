# Marca & Templates — Docs · Slides · Social

Templates editoriais para infoprodutos, aulas e redes, todos com a assinatura da marca.

```jsx
import {
  Wordmark, DocPage, ChecklistTemplate,
  Slide, SlideCover, SlideContent, SlideQuote, SlideClosing,
  SocialCard,
} from './components'
```

## Wordmark

Assinatura "**ANJU** MACE" (forte + leve, tracking largo). `size` (`sm`/`md`/`lg`/`xl`), `tone` (`default`/`inverse`).

## DocPage · ChecklistTemplate

**DocPage** — folha A4 (595×842) com header de marca + rodapé. `title`, `footer`, `tone` (`cream`/`surface`).
**ChecklistTemplate** — checklist pronto. `title`, `intro`, `items=[{label, description}]`, `footer`.

```jsx
<ChecklistTemplate title="Morning Checklist" intro="…" items={items} footer="anjumace.com" />
```

Base também para ebooks, receitas e infográficos — componha dentro de `<DocPage>`.

## Slides (16:9)

Base `Slide` com `tone` (`cream`/`graphite`/`sage`), `kicker`, `footer`, `pageNumber`. Variações prontas:

- **SlideCover** — capa (`kicker`, `title`, `subtitle`).
- **SlideContent** — conteúdo (`title`, `children` com bullets).
- **SlideQuote** — citação centralizada (`quote`, `author`).
- **SlideClosing** — encerramento (`title`, `subtitle`, `cta`).

```jsx
<SlideCover kicker="Aula 01" title="Fundamentos do movimento" subtitle="…" />
<SlideQuote quote="O movimento é a forma mais pura de evolução." author="Anju Mace" />
```

## SocialCard

Criativo de feed/story. `format` (`square` 1:1 / `portrait` 4:5 / `story` 9:16), `tone` (`cream`/`graphite`/`sage`/`photo`), `image` (com `tone="photo"`), `kicker`, `title`, `footer`.

```jsx
<SocialCard tone="cream" kicker="Mindset" title="O movimento é um privilégio." />
<SocialCard tone="photo" image="/foto.jpg" kicker="Treino do dia" title="Comece agora." />
```

### Do / Don't
- ✅ Wordmark presente em todo material de marca.
- ✅ Alternar tons (creme/grafite/sálvia) para ritmo entre páginas/slides.
- ✅ Citações em peso light, muito respiro.
- ❌ Encher o criativo de texto — um conceito por peça.
- ❌ Texto sobre foto sem gradiente.
