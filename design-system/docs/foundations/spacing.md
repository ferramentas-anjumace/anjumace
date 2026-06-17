# Espaçamento

Escala consistente em **base 4 / 8pt**. Whitespace é parte da identidade — prefira o lado **generoso**.

## Escala

| Token | rem | px | Uso típico |
|---|---|---|---|
| `--space-0_5` | 0.125 | 2 | hairline / ajuste fino |
| `--space-1` | 0.25 | 4 | gap mínimo (ícone↔texto) |
| `--space-2` | 0.5 | 8 | gap compacto |
| `--space-3` | 0.75 | 12 | padding de chip |
| `--space-4` | 1 | 16 | padding base / gap de lista |
| `--space-5` | 1.25 | 20 | — |
| `--space-6` | 1.5 | 24 | **padding de card** |
| `--space-8` | 2 | 32 | gap entre blocos |
| `--space-10` | 2.5 | 40 | — |
| `--space-12` | 3 | 48 | gap de seção (mobile) |
| `--space-16` | 4 | 64 | padding vertical de seção |
| `--space-20` | 5 | 80 | — |
| `--space-24` | 6 | 96 | **seção (desktop)** |
| `--space-32` | 8 | 128 | bloco hero |
| `--space-40 / 48 / 64` | 10 / 12 / 16 | 160 / 192 / 256 | respiro editorial |

## Ritmo recomendado

- **Padding de seção:** `py-16` (mobile) → `py-24` (desktop).
- **Gap entre cards:** `gap-4` a `gap-6`.
- **Padding interno de card:** `p-6` (`--card-padding`).
- **Espaço título→corpo:** `mt-2` a `mt-4`.

## Uso

```jsx
<section className="py-16 md:py-24">
  <div className="container space-y-8">…</div>
</section>
```

Disponível em todos os utilitários de espaçamento Tailwind (`p-*`, `m-*`, `gap-*`, `space-*`).

### Do / Don't
- ✅ Manter múltiplos da escala (4/8).
- ✅ Respiro generoso entre seções.
- ❌ Não usar valores arbitrários (`p-[13px]`).
