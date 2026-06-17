# Elevação, sombra, raio & vidro

Profundidade **sutil**: sombras suaves e difusas, nunca pesadas. Glassmorphism leve quando faz sentido (chips/players sobre foto).

## Sombras (extraídas do material)

| Token | Classe | Valor | Uso |
|---|---|---|---|
| `--shadow-xs` | `shadow-xs` | `0 1px 2px rgba(28,28,28,.05)` | borda elevada sutil |
| `--shadow-sm` | `shadow-sm` | `0 2px 8px -2px rgba(28,28,28,.08)` | card em repouso |
| `--shadow-md` | `shadow-md` | `0 8px 24px -6px rgba(28,28,28,.10)` | **card padrão** |
| `--shadow-lg` | `shadow-lg` | `0 13px 58px -12px rgba(28,28,28,.12)` | card flutuante / hover |
| `--shadow-xl` | `shadow-xl` | `0 24px 80px -20px rgba(28,28,28,.16)` | modal / overlay |
| `--shadow-glass` | `shadow-glass` | `0 1px 16px rgba(0,0,0,.24)` | chip de vidro |
| `--focus-shadow` | `shadow-focus` | anel sálvia 4px | foco de teclado |

No tema dark, `--shadow-ambient` aprofunda para `rgba(0,0,0,.55)`.

## Raios

| Token | px | Uso |
|---|---|---|
| `--radius-xs` | 4 | tag pequena |
| `--radius-sm` | 8 | input compacto |
| `--radius-md` | 12 | **input / select** |
| `--radius-lg` | 16 | card pequeno |
| `--radius-xl` | 20 | card |
| `--radius-2xl` | 24 | **card grande / media** |
| `--radius-3xl` | 32 | bloco hero |
| `--radius-full` | 9999 | **pills, avatar, foto redonda** |

## Glassmorphism

Classe utilitária `.glass` (em `index.css`):

```jsx
<span className="glass rounded-full px-3 py-1 text-label">45 minutos</span>
```

Combina `--surface-glass` + `backdrop-blur(--blur-xl)` + borda sutil + `--shadow-glass`. Blur tokens: `--blur-sm 8` · `md 16` · `lg 24` · `xl 40` · `2xl 64`.

### Do / Don't
- ✅ Sombra suave e ampla (raio de blur alto, opacidade baixa).
- ✅ Vidro só sobre foto/superfície com textura.
- ❌ Sombras duras/escuras (`0 2px 4px rgba(0,0,0,.5)`).
- ❌ Vidro sobre fundo liso (vira cinza sujo).
