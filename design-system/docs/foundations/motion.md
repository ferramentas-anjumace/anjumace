# Motion

Movimento curto e de qualidade: durações **150–400ms**, easings `cubic-bezier` suaves. Nunca animação longa ou elástica demais. Respeita `prefers-reduced-motion` (desativado no base quando o usuário pede).

## Durações

| Token | Classe | Valor | Uso |
|---|---|---|---|
| `--duration-instant` | `duration-instant` | 100ms | feedback de toque |
| `--duration-fast` | `duration-fast` | 150ms | hover de botão/link |
| `--duration-base` | `duration-base` | 200ms | **transição padrão** |
| `--duration-moderate` | `duration-moderate` | 300ms | troca de tema, acordeão |
| `--duration-slow` | `duration-slow` | 400ms | entrada de seção / modal |

## Easings

| Token | Classe | Curva | Uso |
|---|---|---|---|
| `--ease-standard` | `ease-standard` | `cubic-bezier(.4,0,.2,1)` | propósito geral |
| `--ease-out` | `ease-out` | `cubic-bezier(.16,1,.3,1)` | **entradas (Apple-like)** |
| `--ease-in` | `ease-in` | `cubic-bezier(.4,0,1,1)` | saídas |
| `--ease-in-out` | `ease-in-out` | `cubic-bezier(.65,0,.35,1)` | loop / ida-volta |
| `--ease-spring` | `ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | leve overshoot (badge/scale) |

## Animações prontas (Tailwind)

`animate-fade-in` · `animate-fade-in-up` · `animate-scale-in` — já mapeadas com tokens.

## Uso

```jsx
<button className="transition-colors duration-fast ease-standard hover:bg-accent-hover" />
<div className="animate-fade-in-up" />
<div className="transition-transform duration-base ease-spring hover:scale-[1.02]" />
```

### Do / Don't
- ✅ Animar `opacity` e `transform` (baratos, suaves).
- ✅ Hover ≤ 200ms; entradas ≤ 400ms.
- ❌ Animar `width/height/top/left` (reflow).
- ❌ Durações > 500ms em UI.
