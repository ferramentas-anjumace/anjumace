# Componentes base

Átomos do design system. Todos consomem **tokens semânticos**, têm estados resolvidos (hover/active/focus/disabled) e funcionam em light/dark sem alteração.

Import:

```jsx
import { Button, Badge, Avatar, Divider, Chip, Tooltip,
         Input, Textarea, Select, Checkbox, Radio, Toggle } from './components'
```

---

## Button

Pill da marca. Render polimórfico via `as`.

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `variant` | `primary` `secondary` `outline` `ghost` `link` `danger` | `primary` | estilo |
| `size` | `sm` `md` `lg` | `md` | altura/padding |
| `leftIcon` / `rightIcon` | ReactNode | — | ícone |
| `iconOnly` | boolean | `false` | botão circular (exige `aria-label`) |
| `loading` | boolean | `false` | spinner + desabilita |
| `fullWidth` | boolean | `false` | ocupa 100% |
| `as` | elemento | `button` | ex. `as="a"` |

```jsx
<Button leftIcon={<Mail className="size-4" strokeWidth={1.5} />}>Inscrever</Button>
<Button variant="outline" rightIcon={<ArrowRight className="size-4" />}>Saber mais</Button>
<Button iconOnly aria-label="Play" variant="secondary"><Play className="size-4" /></Button>
```

- ✅ `primary` (sálvia) para a ação principal; **um por bloco**.
- ✅ `secondary` (dourado) para premium/VIP.
- ❌ Não usar dois `primary` competindo.

---

## Badge

Rótulo compacto.

| Prop | Tipo | Default |
|---|---|---|
| `variant` | `neutral` `accent` `accent-2` `solid` `solid-2` `success` `warning` `danger` `info` `outline` | `neutral` |
| `size` | `sm` `md` `lg` | `md` |
| `icon` | ReactNode | — |
| `uppercase` | boolean | `false` (estilo label tracking largo) |

```jsx
<Badge variant="solid-2" uppercase>VIP</Badge>
<Badge variant="success">Ativo</Badge>
```

## Chip

Pílula de metadado; suporta vidro da marca.

| Prop | Tipo | Descrição |
|---|---|---|
| `glass` | boolean | vidro + backdrop-blur (sobre foto) |
| `icon` | ReactNode | à esquerda |
| `onRemove` | function | mostra botão remover |

```jsx
<Chip glass>45 minutos</Chip>
<Chip onRemove={() => removeFilter(id)}>Força</Chip>
```

> `glass` só sobre foto/superfície escura — em fundo liso vira cinza.

## Avatar

| Prop | Tipo | Descrição |
|---|---|---|
| `src` / `alt` | string | imagem |
| `name` | string | gera iniciais quando sem imagem |
| `size` | `xs` `sm` `md` `lg` `xl` | — |
| `vip` | boolean | aro dourado |
| `status` | `online` `offline` `busy` | dot |

```jsx
<Avatar name="Anju Mace" size="lg" vip />
<Avatar src="/foto.jpg" alt="Bia" status="online" />
```

---

## Input / Textarea / Select

Campos com `label`, `hint`, `error`, `success`, `required`. Acessíveis (ids/aria ligados automaticamente). `error` pinta a borda e a mensagem.

**Input** — extra: `leftIcon`, `rightIcon`, `size`.
**Select** — extra: `options=[{value,label}]` ou `<option>` children, `placeholder`.
**Textarea** — extra: `rows`.

```jsx
<Input label="E-mail" type="email" leftIcon={<Mail className="size-4" />} hint="Não compartilhamos." />
<Input label="Senha" type="password" error="Mínimo de 8 caracteres." />
<Select label="Objetivo" placeholder="Selecione" options={[{value:'forca',label:'Força'}]} />
<Textarea label="Mensagem" rows={4} />
```

Helpers exportados: `Field` (wrapper label+mensagem), `Label`, `controlBase`.

---

## Checkbox / Radio / Toggle

Controles booleanos acessíveis (input nativo + visual custom). Props comuns: `label`, `description`, `disabled`, + nativos (`checked`, `defaultChecked`, `onChange`, `name`).

- **Checkbox** — quadrado da marca (`size: sm|md`).
- **Radio** — circular; agrupe pelo mesmo `name`.
- **Toggle** — switch (`size: sm|md`, `role="switch"`).

```jsx
<Checkbox label="Aceito os termos" description="Li a política." />
<Radio name="plano" label="Anual" />
<Toggle label="Notificações" defaultChecked />
```

---

## Tooltip · Divider

**Tooltip** — `content`, `side: top|bottom|left|right`. Envolve um elemento interativo.
**Divider** — `orientation`, `dashed` (tracejado da marca), `label` (centralizado).

```jsx
<Tooltip content="Dica"><Button variant="outline">?</Button></Tooltip>
<Divider label="ou" />
<Divider dashed />
```
