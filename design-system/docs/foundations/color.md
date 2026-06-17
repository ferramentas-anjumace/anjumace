# Cor

A paleta da ANJU MACE é **restrita e intencional**: base neutra dominante (grafite + creme) com cor usada como **acento**, nunca como ruído. Verde **sálvia** é o acento primário; **dourado** o secundário (premium/VIP).

> Todos os valores foram extraídos do material real (amostragem de 9.194 nós no Figma). Nada inventado.

## Camadas de token

```
primitivo            →  semântico              →  componente
--sage-400 #9EAB87       --accent                  --button-primary-bg
--graphite-800 #282828   --text-primary            --input-text
```

Em componentes, **use sempre a camada semântica** (`bg-accent`, `text-content`, `bg-surface`). As ramps primitivas (`bg-sage-400`) existem para casos pontuais e para o showcase.

## Primitivos de marca

| Família | Papel | Âncora |
|---|---|---|
| **Graphite** `50→950` | neutro escuro / "preto grafite" | `--graphite-800` `#282828` |
| **Cream** `50→300` | neutro claro / superfície clara | `--cream-100` `#F5F5DD` |
| **Sand** `50→200` | creme quente/acolhedor | `--sand-50` `#FFF7F0` |
| **Mist** `50→300` | neutro frio "system gray" | `--mist-100` `#F5F5F7` |
| **Sage** `50→900` | **acento primário** (sálvia/oliva) | `--sage-400` `#9EAB87` · `--sage-600` `#7A8569` |
| **Gold** `50→800` | **acento secundário** (dourado) | `--gold-300` `#DABE81` · `--gold-500` `#BE9234` |
| **Taupe** `100→700` | neutro quente terroso | `--taupe-700` `#6A6158` |
| **Slate** `200→600` | neutro frio (texto subtle) | `--slate-500` `#7B7E91` |
| Red / Green / Amber / Blue | feedback | `--red-400 #F95252` … |

## Semânticos

### Superfícies
`--surface-base` (página) · `--surface` (card) · `--surface-elevated` · `--surface-sunken` · `--surface-muted` · `--surface-warm` · `--surface-inverse` · `--surface-glass`

### Texto
`--text-primary` · `--text-secondary` · `--text-muted` · `--text-subtle` · `--text-inverse` · `--text-link` · `--text-on-accent` · `--on-accent`

### Acentos
`--accent` / `-hover` / `-active` / `-subtle` / `-text` · `--on-accent`
`--accent-2` / `-hover` / `-active` / `-subtle` / `-text` · `--on-accent-2`

### Bordas & foco
`--border` · `--border-strong` · `--border-subtle` · `--border-accent` · `--focus-ring`

### Feedback
`--success` · `--warning` · `--danger` · `--info` (cada um com `-surface`, `-text` e `on-*`)

## Temas

Troca via atributo no `<html>`:

```html
<html data-theme="light">  <!-- padrão -->
<html data-theme="dark">   <!-- grafite da marca -->
```

`:root` = light. O mesmo componente troca de tema sem nenhuma alteração de código — só os semânticos remapeiam.

## Contraste (WCAG AA verificado)

| Par | Ratio | Status |
|---|---|---|
| text-primary `#282828` / cream `#F5F5DD` | **13.33** | AAA ✓ |
| text-primary / white | **14.74** | AAA ✓ |
| text-muted `#5C5C5C` / white | 6.69 | AA ✓ |
| text-link sálvia `#636E55` / cream | 4.88 | AA ✓ |
| **on-accent** grafite / sálvia `#9EAB87` | 6.06 | AA ✓ |
| **on-accent-2** grafite / dourado `#DABE81` | 8.19 | AAA ✓ |
| danger-text `#9A2D2D` / white | 7.53 | AAA ✓ |
| (dark) cream / grafite `#282828` | 13.33 | AAA ✓ |
| (dark) muted `#8F99A3` / grafite | 5.09 | AA ✓ |

### ⚠️ Regras de acessibilidade aprendidas do material
- **Branco sobre sálvia-400 reprova (2.43).** Botão primário usa **grafite sobre sálvia** (`--on-accent`). Para texto claro sobre verde, use `sage-700+`.
- **Sálvia como texto/link** deve ser `sage-700` (não 400/500/600).
- **Danger sólido** usa `red-600` (não `red-400`, que só passa em texto grande).

## Uso

```jsx
<div className="bg-surface text-content border border-subtle rounded-2xl">…</div>
<button className="bg-accent text-accent-on hover:bg-accent-hover">CTA</button>
<span className="text-accent-text">link sálvia</span>
<span className="badge bg-accent-2 text-accent-2-on">VIP</span>
```

### Do / Don't
- ✅ Cor como acento sobre base neutra generosa.
- ✅ Sálvia para ação/marca; dourado para premium/destaque.
- ❌ Não usar dois acentos competindo no mesmo bloco.
- ❌ Não colocar texto branco sobre sálvia-400.
- ❌ Não hardcodar hex em componente — sempre token.
