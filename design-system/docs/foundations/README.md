# Foundations — Anju Mace Design System

Fundamentos do sistema. Cada doc traz tabela de tokens, regras de uso e do/don't.

| Doc | Cobre |
|---|---|
| [color.md](./color.md) | Paleta (primitiva → semântica → componente), temas light/dark, contraste WCAG AA |
| [type.md](./type.md) | Lexend + Outfit, escala, pesos, tracking, classes `.text-*` |
| [spacing.md](./spacing.md) | Escala 4/8pt e ritmo de seção |
| [elevation.md](./elevation.md) | Sombras, raios, glassmorphism, blur |
| [motion.md](./motion.md) | Durações, easings, animações |
| [grid.md](./grid.md) | Breakpoints, container, colunas, formatos de canvas |
| [iconography.md](./iconography.md) | Estilo monoline, UI icons, símbolos da marca, foto |

## Princípios de design

1. **Editorial, premium, minimalista** — referência Apple.
2. **Hierarquia por tipografia, não por cor.**
3. **Cor como acento** (sálvia primário · dourado secundário) sobre base neutra (grafite · creme).
4. **Whitespace generoso**, grid disciplinado (4/8pt).
5. **Profundidade sutil** — sombras suaves, vidro leve.
6. **Motion curto e suave** (150–400ms, cubic-bezier).
7. **Acessível** — foco visível, contraste AA, reduced-motion.

## Arquitetura de tokens

```
src/tokens/primitives.css   → valores brutos (--sage-400, --space-4…)
src/tokens/semantic.css     → propósito + temas (--accent, --surface…) [data-theme]
                              + camada de componente (--button-*, --input-*…)
src/tokens/index.css        → agrega os dois
src/index.css               → fontes + tokens + Tailwind + base + classes .text-*
tailwind.config.js          → mapeia tokens → utilitários
```

**Regra de ouro:** componente consome **semântico** (`bg-accent`, `text-content`), nunca primitivo nem hex.
