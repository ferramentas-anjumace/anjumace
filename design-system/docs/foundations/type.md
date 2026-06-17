# Tipografia

Hierarquia conduzida por **tipografia, não por cor** — pesos leves em títulos grandes, tracking negativo sutil, muito respiro. Referência Apple / editorial.

## Famílias

| Papel | Família | Token | Fallback |
|---|---|---|---|
| **Display / títulos** | **Lexend** | `--font-display` | ui-sans-serif, system-ui |
| **Texto / UI / labels** | **Outfit** | `--font-sans` | ui-sans-serif, system-ui |
| Mono (código/dados) | system mono | `--font-mono` | — |

> Decisão de projeto: o brandbook define Lexend + Outfit. DM Sans/Open Sans (vistos na produção) foram **descontinuados** no design system para consistência.

Carregadas via Google Fonts em `src/index.css`. Pesos: Lexend `100/300/400/500/600/700/900`, Outfit `300/400/500/600/700`.

## Escala (deduzida dos tamanhos recorrentes no material)

| Classe | Token | px | Peso | Line-height | Uso |
|---|---|---|---|---|---|
| `.text-display` | `--text-7xl` | 62 | light 300 | 1.0 | hero |
| `.text-display-sm` | `--text-6xl` | 50 | light 300 | 1.0 | abertura |
| `.text-h1` | `--text-5xl` | 40 | light 300 | 1.1 | título de página |
| `.text-h2` | `--text-4xl` | 34 | light 300 | 1.1 | seção |
| `.text-h3` | `--text-3xl` | 28 | regular 400 | 1.2 | subseção |
| `.text-h4` | `--text-2xl` | 24 | regular 400 | 1.2 | destaque / body-lg |
| `.text-h5` | `--text-xl` | 20 | medium 500 | 1.3 | — |
| `.text-h6` | `--text-lg` | 18 | medium 500 | 1.3 | — |
| `.text-body-lg` | `--text-lg` | 18 | regular | 1.5 | intro/lead |
| `.text-body` | `--text-base` | 16 | regular | 1.5 | corpo padrão |
| `.text-body-sm` | `--text-sm` | 14 | regular | 1.3 | apoio |
| `.text-caption` | `--text-xs` | 12 | regular | 1.3 | legenda (muted) |
| `.text-label` | `--text-2xs` | 10 | medium | 1.3 | **eyebrow CAIXA-ALTA + tracking 0.16em** |

## Tracking (letter-spacing)

| Token | Valor | Uso |
|---|---|---|
| `--tracking-tight` | **-0.011em** | padrão de títulos e corpo (assinatura da marca) |
| `--tracking-wider` | **0.16em** | labels/eyebrows caixa-alta, wordmark |

## Line-height

`--leading-none 1.0` (display) · `tight 1.1` (h1/h2) · `snug 1.2` (h3/h4) · `normal 1.3` · `relaxed 1.5` (corpo)

## Wordmark

**ANJU** (peso forte) + **MACE** (peso leve), Lexend, tracking largo (`--tracking-wider`). Sempre com respiro lateral generoso.

## Uso

```jsx
<p className="text-label text-accent-text">Avaliação exclusiva</p>
<h1 className="text-display">A transformação que você merece começa aqui.</h1>
<p className="text-body text-content-secondary">Corpo em Outfit…</p>
```

Equivalentes via utilitários Tailwind também existem (`font-display text-5xl font-light tracking-tight leading-tight`), mas **prefira as classes `.text-*`** — encapsulam a escala da marca.

### Do / Don't
- ✅ Títulos grandes em peso **light**; hierarquia pelo tamanho e respiro.
- ✅ `text-balance` em títulos (já aplicado no base).
- ❌ Não usar bold em display grande (perde o ar editorial).
- ❌ Não misturar mais de 2 famílias.
