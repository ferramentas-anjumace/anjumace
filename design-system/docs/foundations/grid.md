# Grid & responsividade

Grid disciplinado, container central com margens generosas. Formatos derivados do material: mobile **390** (app), desktop **1440** (landing), docs **A4 595×842**, social **1080²** e **1242×2688**.

## Breakpoints

| Token | Largura | Alvo |
|---|---|---|
| `sm` | 640px | phone landscape |
| `md` | 768px | tablet |
| `lg` | 1024px | tablet grande / laptop |
| `xl` | 1280px | desktop |
| `2xl` | 1440px | desktop largo (landing) |

Mobile-first: estilize a base para 390–414px e aumente com prefixos (`md:`, `lg:`).

## Container

`.container` (Tailwind, centralizado):
- padding lateral: `1.5rem` → `2.5rem` (md) → `4rem` (lg) → `5rem` (xl)
- largura útil máxima de conteúdo: **1200px** (`2xl`)

```jsx
<section className="py-16 md:py-24">
  <div className="container">…</div>
</section>
```

## Colunas

Use CSS grid utilitário:
- **Feature row:** `grid grid-cols-1 md:grid-cols-3 gap-6`
- **Pricing:** `grid grid-cols-1 md:grid-cols-3 gap-4`
- **Galeria/posts:** `grid grid-cols-2 md:grid-cols-3 gap-2`

## Formatos de canvas (criativos/docs)

| Formato | px | Uso |
|---|---|---|
| Feed quadrado | 1080×1080 | post |
| Feed retrato | 1080×1350 | post/carrossel |
| Story/Reels | 1080×1920 (1242×2688) | vertical |
| Slide/aula | 1920×1080 | apresentação |
| Documento | 595×842 (A4) | checklist, ebook, receita |

### Do / Don't
- ✅ Margens laterais amplas; conteúdo respirando.
- ✅ Quebrar em 1 coluna no mobile.
- ❌ Conteúdo colado nas bordas.
- ❌ Mais de 3–4 colunas em texto.
