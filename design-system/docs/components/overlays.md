# Overlays — Modal · Drawer · Toast

Camadas acima do conteúdo. Usam portal (`createPortal`), scrim de marca, ESC para fechar e bloqueio de scroll do body.

```jsx
import { Modal, Drawer, ToastProvider, useToast } from './components'
```

## Modal

Diálogo centralizado.

| Prop | Descrição |
|---|---|
| `open`, `onClose` | controle |
| `title`, `description` | cabeçalho |
| `size` | `sm` \| `md` \| `lg` \| `xl` |
| `footer` | ações (ReactNode) |
| `closeOnBackdrop` | default `true` |

```jsx
<Modal open={open} onClose={close} title="Confirmar avaliação"
  footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button>Confirmar</Button></>}>
  …conteúdo…
</Modal>
```

Acessível: `role="dialog"`, `aria-modal`, foco no painel, ESC fecha, scroll travado.

## Drawer

Painel deslizante (filtros, menu, detalhes).

| Prop | Descrição |
|---|---|
| `open`, `onClose` | controle |
| `side` | `right` \| `left` \| `bottom` |
| `title`, `footer` | cabeçalho/rodapé |

## Toast

Notificações empilhadas. Coloque `<ToastProvider>` no topo da app e use o hook `useToast()`.

```jsx
// App
<ToastProvider><App/></ToastProvider>

// dentro de qualquer componente
const toast = useToast()
toast({ title: 'Treino salvo!', description: '…', variant: 'success' })
```

`variant`: `success` \| `warning` \| `danger` \| `info`. Auto-dismiss (default 4s, via `duration` no provider).

### Do / Don't
- ✅ Modal para decisões/confirmações curtas; Drawer para listas/filtros.
- ✅ Toast curto e acionável; nunca para erro crítico que exige decisão (use Modal).
- ❌ Empilhar múltiplos modais.
- ❌ Toast sem texto (só cor) — sempre `title`.
