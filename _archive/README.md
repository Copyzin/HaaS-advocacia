# `_archive/` — Ferramentas de desenvolvimento arquivadas

Esta pasta guarda código que **não roda em produção** mas que pode ser
útil reativar em rodadas futuras de manutenção. Nada aqui é referenciado
por nenhum HTML do site, nenhum `<link>`, nenhum `<script>`. O servidor
estático (Hostinger) entrega os arquivos se acessados por URL direta,
mas nenhum visitante chega aqui por acaso — o prefixo `_` é a convenção
de "interno" e a pasta não aparece em nenhum menu.

---

## Conteúdo

### `tweak.html` — Drawer Tweak Studio

Interface gráfica (sliders, color pickers, inputs) com preview ao vivo
do `nav-drawer` mobile do site HAAS num iframe iPhone 14 Pro (390×844).
Foi usada para iterar nos valores do drawer durante a fase de ajuste.

**Status atual**: arquivado. Os valores finais decididos pelo cliente
estão **inlineados** literal nas regras `.nav-drawer*` em
[`../assets/css/styles.css`](../assets/css/styles.css).

---

## Como reativar o Drawer Tweak Studio

Se você precisar abrir o studio de novo para outra rodada de ajustes:

### Passo 1 — Trazer o bloco de tokens de volta pro CSS

Copiar o bloco `:root --drawer-*` de
[`../assets/css/_drawer-tweak-tokens.example.css`](../assets/css/_drawer-tweak-tokens.example.css)
para o topo de [`../assets/css/styles.css`](../assets/css/styles.css),
**logo depois** do `:root` do "Section background system" (linhas 13-23
no `styles.css` atual).

### Passo 2 — Substituir os valores literais por `var(--drawer-X)`

Nas regras `.nav-drawer*` do `styles.css`, reverter cada valor literal
para a custom property correspondente. Mapeamento direto:

| Propriedade | Valor literal hoje | Substituir por |
|---|---|---|
| `.nav-drawer background-color` | `rgba(0, 0, 0, 0.78)` | `var(--drawer-bg)` |
| `.nav-drawer backdrop-filter blur` | `7px` | `var(--drawer-blur)` |
| `.nav-drawer backdrop-filter saturate` | `165%` | `var(--drawer-saturate)` |
| `.nav-drawer gap` | `32px` | `var(--drawer-gap)` |
| `.nav-drawer::before opacity` | `0.94` | `var(--drawer-moldura-opacity)` |
| `.nav-drawer a font-family` | `'Cinzel', serif` | `var(--drawer-link-font)` |
| `.nav-drawer a font-size` | `24px` | `var(--drawer-link-size)` |
| `.nav-drawer a font-weight` | `700` | `var(--drawer-link-weight)` |
| `.nav-drawer a letter-spacing` | `0.1em` | `var(--drawer-link-tracking)` |
| `.nav-drawer a text-transform` | `uppercase` | `var(--drawer-link-case)` |
| `.nav-drawer a color` | `#F2F2F2` | `var(--drawer-link-color)` |
| `.nav-drawer a:hover color` | `#C9A961` | `var(--drawer-link-color-hover)` |
| `.nav-drawer__close top/right` | `20px` / `20px` | `var(--drawer-close-offset-top)` / `var(--drawer-close-offset-right)` |
| `.nav-drawer__close width/height` | `52px` | `var(--drawer-close-box)` |
| `.nav-drawer__close background` | `rgba(10, 6, 4, 0.55)` | `var(--drawer-close-bg)` |
| `.nav-drawer__close border-color` | `rgba(201, 169, 97, 0.45)` | `var(--drawer-close-border)` |
| `.nav-drawer__close color` | `#C9A961` | `var(--drawer-close-color)` |
| `.nav-drawer__close font-size` | `32px` | `var(--drawer-close-size)` |
| `.nav-drawer__close:hover border-color` | `#C9A961` | `var(--drawer-close-border-hover)` |
| `.nav-drawer__close:hover background` | `rgba(20, 14, 6, 0.7)` | `var(--drawer-close-bg-hover)` |
| `.nav-drawer__close:hover color` | `#E5C77A` | `var(--drawer-close-color-hover)` |
| `.nav-drawer .nav-drawer__cta-whatsapp font-size` | `14px` | `var(--drawer-cta-size)` |
| `.nav-drawer .nav-drawer__cta-whatsapp font-weight` | `800` | `var(--drawer-cta-weight)` |
| `.nav-drawer .nav-drawer__cta-whatsapp letter-spacing` | `0.02em` | `var(--drawer-cta-tracking)` |
| `.nav-drawer .nav-drawer__cta-whatsapp color !important` | `#000000` | `var(--drawer-cta-color)` |
| `.nav-drawer .nav-drawer__cta-whatsapp background` | `#C9A961` | `var(--drawer-cta-bg)` |
| `.nav-drawer .nav-drawer__cta-whatsapp padding` | `12px 24px 12px 18px` | `var(--drawer-cta-padding)` |
| `.nav-drawer .nav-drawer__cta-whatsapp margin-top` | `24px` | `var(--drawer-cta-margin-top)` |
| `.nav-drawer .nav-drawer__cta-whatsapp border-color` | `#E5C77A` | `var(--drawer-cta-border)` |
| `.nav-drawer .nav-drawer__cta-whatsapp max-width` | `min(260px, calc(100% - 120px))` | `var(--drawer-cta-max-width)` |
| `.nav-drawer .nav-drawer__cta-whatsapp:hover color !important` | `#000000` | `var(--drawer-cta-color)` |
| `.nav-drawer .nav-drawer__cta-whatsapp:hover background` | `#A78A4B` | `var(--drawer-cta-bg-hover)` |

**Atalho rápido**: o commit que removeu o tweak (`chore(drawer): inline final
tweak values`) tem o diff exato em sentido inverso. Você pode pegar o SHA
desse commit no `git log` e:

```bash
git show <sha> -- assets/css/styles.css
```

…para ver exatamente cada linha que mudou. Reverter manualmente é seguir
o diff de baixo pra cima.

### Passo 3 — Mover o `tweak.html` de volta pra raiz

```bash
git mv _archive/tweak.html tweak.html
```

Os caminhos relativos dentro do `tweak.html` (`index.html` no iframe,
`assets/css/styles.css` no cache-bust) ficam corretos automaticamente
quando o arquivo está na raiz.

### Passo 4 — Rodar e ajustar

```bash
python -m http.server 5173
```

Abrir `http://localhost:5173/tweak.html` no Chrome. Mexer nos sliders,
clicar "Copiar CSS" quando satisfeito, colar o novo bloco `:root` no
`styles.css`. Quando terminar a rodada, repetir o processo de inline +
arquivar.

---

## Por que essa estrutura

- **Reversibilidade total**: o site final não tem nenhum vestígio runtime
  do tweak — sem variáveis CSS órfãs, sem `<script>` perdido, sem 404 em
  asset. Zero risco de bug residual.
- **Recuperação em minutos**: o conteúdo essencial (bloco de tokens, HTML
  do studio, mapeamento de valores) está aqui no repo, versionado em
  Git. Não depende de buscar no histórico.
- **Sem pegada na build**: como o projeto é estático (sem PostCSS, sem
  bundler), arquivos arquivados simplesmente não são referenciados.
  O prefixo `_` e a extensão `.example.css` reforçam visualmente o
  status de "não usar".
