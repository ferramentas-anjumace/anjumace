# Formulários & Quiz

Formulários usam os **componentes base** (`Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Toggle`) com `label`, `hint`, `error` e `success` — ver [base.md](./base.md). Aqui ficam os componentes de **quiz** e os padrões de composição.

```jsx
import { Quiz, QuizQuestion, QuizOption, QuizProgress, QuizResult } from './components'
```

## Padrão de formulário com validação

Cada campo aceita `error` (pinta borda + mensagem em vermelho) e `success` (verde). Use `required` para o asterisco. Acessibilidade (ids/aria) é automática.

```jsx
<Input label="E-mail" type="email" required
  error={invalid ? 'E-mail inválido.' : undefined}
  success={valid ? 'E-mail válido!' : undefined} />
```

---

## Quiz (fluxo completo)

Componente controlado internamente. Single-choice **avança sozinho**; múltipla escolha usa o botão "Próximo".

| Prop | Descrição |
|---|---|
| `questions` | `[{ id, question, help?, multi?, options }]` |
| `options` | `[{ value, label, description?, emoji?, icon? }]` |
| `onComplete(answers)` | callback ao finalizar (`answers = { [id]: value | value[] }`) |
| `renderResult(answers)` | ReactNode da tela final (use `<QuizResult/>`) |
| `progressVariant` | `bar` \| `dots` |

```jsx
<Quiz
  questions={QUESTIONS}
  renderResult={(answers) => (
    <QuizResult tone="accent" title="Construtora de Força"
      description="Sua trilha focada em performance."
      media={<ProgressRing value={92} size={104}><Sparkles /></ProgressRing>}
      actions={<Button>Ver minha trilha</Button>} />
  )}
/>
```

### Subcomponentes (uso avulso)

- **QuizProgress** — `step`, `total`, `variant` (`bar`/`dots`). Mostra "Pergunta X de N" + %.
- **QuizQuestion** — `question`, `help`, `children` (as opções). Layout puro.
- **QuizOption** — opção-card selecionável. `selected`, `onSelect`, `label`, `description`, `emoji`/`icon`, `multi` (quadrado vs círculo). Acessível (`role=radio|checkbox`, `aria-checked`).
- **QuizResult** — tela final. `eyebrow`, `title`, `description`, `media`, `meta`, `actions`, `tone` (`surface`/`inverse`/`accent`).

---

### Do / Don't
- ✅ Uma pergunta por tela; opções grandes e tocáveis (mobile).
- ✅ Feedback imediato de seleção (estado sálvia).
- ✅ Mostrar progresso sempre (reduz abandono).
- ✅ Resultado com CTA claro (próximo passo).
- ❌ Mais de ~5–6 opções por pergunta.
- ❌ Erros de validação sem mensagem textual (não confie só na cor).
