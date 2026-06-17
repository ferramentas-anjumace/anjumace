# Iconografia & ilustração

Estilo **monoline geométrico**: traço fino e uniforme, formas abstratas/simbólicas, muito ar. Os ícones-símbolo da marca (alvo, mola, círculos concêntricos) traduzem conceitos — precisão, foco, inteligência feminina, auto-respeito.

## Princípios

- **Traço:** ~1.5–2px, uniforme, pontas arredondadas (`stroke-linecap: round`).
- **Estilo:** outline (nunca preenchido sólido), geométrico, minimalista.
- **Grade:** desenhe em 24×24 com padding óptico; mantenha peso visual consistente.
- **Cor:** herda `currentColor` → controlada por `text-*`. Em fundo escuro, traço creme/sálvia.

## UI icons

Para ícones de interface (navegação, ações, feedback), use um set monoline compatível — recomendado **[Lucide](https://lucide.dev)** (`stroke-width={1.5}`), que casa com o peso do material.

```jsx
import { Bell, Play, ChevronRight } from 'lucide-react'

<Bell className="size-5 text-content-muted" strokeWidth={1.5} />
<button className="text-accent-text"><ChevronRight strokeWidth={1.5} /></button>
```

> Convenção de tamanho: `size-4` (16) inline · `size-5` (20) padrão · `size-6` (24) destaque.

## Ícones-símbolo da marca

São ilustrações conceituais (não ícones de UI). Use-os grandes, como elemento gráfico em seções (FAQ, features, capas), com traço fino sobre superfície neutra. Não os reduza a tamanho de ícone de botão.

## Ilustração / fotografia

- **Fotografia:** editorial, contraste alto, P&B ou cor dessaturada; corpo/movimento em foco.
- **Tratamento:** cantos arredondados (`rounded-2xl`/`rounded-3xl`), às vezes com overlay grafite para texto legível.

### Do / Don't
- ✅ Traço fino e uniforme; `currentColor`.
- ✅ Ícones-símbolo grandes como grafismo.
- ❌ Misturar ícones filled + outline.
- ❌ Traço grosso/inconsistente.
- ❌ Foto saturada/colorida demais (quebra o tom editorial).
