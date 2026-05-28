# CLAUDE.md — HAAS Advocacia

> Padrões de landing da **Almeida Escala Digital**, adaptados ao caso **HAAS Advocacia**.
>
> Este arquivo é auto-carregado pelo Claude Code a cada sessão. Para padrões genéricos da agência aplicáveis a outros projetos, consultar o `landing-patterns.md` do repositório-mãe.

---

## Identidade do cliente

- **Cliente:** HAAS Advocacia — escritório de advocacia em Brasil.
- **Profissionais:**
  - **Dra. Aline** — Direito **Previdenciário**.
  - **Dra. Heloísa** — Direito **Trabalhista**.
  - Ambas atuam em **Civil e Família**.
- **Tom de marca:** institucional, autoridade, tradição, sóbrio. PT-BR formal mas próximo. Nunca jocoso, nunca casual demais.
- **Referência cultural:** [BNMA Advogados](https://bnmaadvogados.com.br/) — dark cinematográfico premium.
- **Identidade visual completa:** [`DESIGN.md`](DESIGN.md) — paleta black / gold / white, Cinzel + Cormorant Garamond + Inter, vibe dark premium cinematográfico. **Esta é a fonte única de verdade visual** — qualquer decisão de cor, fonte, espaçamento, motion ou componente vem de lá.
- **Contatos / dados oficiais:** [`022 CARTÃO DIGITAL/`](022%20CART%C3%83O%20DIGITAL/) (telefone, e-mail, endereço, OAB das advogadas, redes sociais — consumir o `DADOS.txt`).

---

## 1. Idioma & Comunicação

- **Prompts** podem vir em **inglês** (transcrição via Wispr, que traduz a fala PT-BR → EN para melhorar o raciocínio do modelo).
- **Respostas do Claude** SEMPRE em **português do Brasil**, mesmo quando o prompt vier em inglês. Regra prioritária.
- Comentários e nomes de arquivos/variáveis em código podem seguir o que já estiver no projeto (geralmente PT-BR descritivo, EN para termos técnicos).

> Por que isso funciona: o raciocínio interno em inglês reduz ambiguidade em prompts complexos, mas o feedback final em PT-BR garante que decisões cheguem na língua que o operador (você) revisa rapidamente.

---

## 2. Stack Padrão

Decisão do cliente: **zero Node.js, zero `package.json`, zero build step**.

| Camada | Escolha |
|---|---|
| HTML | HTML5 estático, multi-página |
| CSS | Tailwind v4 via CDN com `@theme` inline + `assets/css/styles.css` para overrides |
| JS | Vanilla JS (ES modules nativos) + GSAP 3 / ScrollTrigger via CDN (jsDelivr) |
| Tipografia | Google Fonts via `<link>` com `preconnect` (Cinzel, Cormorant Garamond, Inter) |
| Vídeo (intro) | `<video>` HTML5 nativo com `<source media="(max-width: 1023px)">` para variante mobile-otimizada |
| Mapa | `<iframe>` Google Maps com `loading="lazy"` |
| Forms | Nenhum no MVP. WhatsApp é o canal primário. Formspree como upgrade se necessário. |
| Blog | Posts HTML escritos à mão em `blog/`. Hugo como upgrade path se a frequência crescer (≥1/semana). |
| Hospedagem | **Hostinger** ([hostinger.com](https://hostinger.com)) — plano Web Hosting |
| Deploy | Git auto-deploy do hPanel apontando para o repositório GitHub. FTP/SFTP como fallback. |
| Versionamento | Git + GitHub (repositório privado) |
| Analytics | Plausible (pago, privacy-first) ou Umami self-hosted. Evitar GA4. |
| Domínio | A confirmar com o cliente (provavelmente `haasadvocacia.com.br`), gerenciado no Hostinger. |

**Atenção no Hostinger:** o vídeo 3D da intro pesa 14.4MB; validar quota do plano contratado antes de subir. Se necessário, hospedar o vídeo num storage externo (Bunny.net Stream, Cloudflare Stream) e embedar via URL.

---

## 3. Seções Padrão

Estrutura confirmada para a HAAS (brief em [`infos.txt`](infos.txt)):

1. **Hero** — entrada cinematográfica com vídeo 3D (ver §8 Animações + spec completa no `DESIGN.md` → "Cinematic Intro Sequence"). Headline gold metálico + par de CTAs (WhatsApp primário + secundário).
2. **Sobre Nós em 2 blocos** — obrigatório:
   - (a) HAAS Advocacia — texto institucional do escritório.
   - (b) Profissionais — perfis de Dra. Aline e Dra. Heloísa lado a lado, com foto em moldura gold, OAB, especialidade, bio resumida, CTA "Ver currículo completo".
3. **Serviços / Áreas de Atuação** — cards das 3 áreas:
   - **Previdenciário** (Dra. Aline) → link para `servicos/previdenciario.html`
   - **Trabalhista** (Dra. Heloísa) → link para `servicos/trabalhista.html`
   - **Civil e Família** (ambas) → link para `servicos/civil-familia.html`
4. **Páginas de Autoridade** — uma por área, template repetível com bio + currículo + lista de sub-áreas (sub-áreas listadas em §4 deste arquivo). Currículos: Aline e Heloísa vão enviar.
5. **Blog** — 3–6 cards de posts iniciais em `blog/index.html`, cada post é um HTML estático em `blog/*.html` no padrão ledger (`max-width: 720px`).
6. **FAQ** — accordion `<details>` nativo, 3–5 perguntas.
7. **Localização** — endereço, horário, mapa embed (`loading="lazy"`), botão "Ver Rotas" (Google Maps Directions URL com `destination=` apenas).
8. **CTA Final** — chamada forte gold metálico + WhatsApp `gold-solid` + telefone `white-ghost`.
9. **Footer** — logo full ([`LOGO.png`](01%20LOGOMARCA%20NORMAL/LOGO.png)), navegação, contatos, redes sociais, crédito Almeida Escala em gold.

Seções opcionais (acrescentar conforme conversa com cliente):
- Depoimentos
- Galeria de fotos do escritório
- Newsletter (raro)

---

## 4. Áreas de Atuação detalhadas

Fonte: [`infos.txt`](infos.txt). Esta lista alimenta as páginas de autoridade — não reinventar.

### Previdenciário — Dra. Aline

- Aposentadoria por Tempo de Contribuição
- Aposentadoria Especial
- Aposentadoria por Invalidez
- Planejamento Previdenciário
- Revisão de Benefícios
- Auxílio-doença e Auxílio-Acidente
- Pensão por Morte
- Benefício Assistencial (LOAS)
- Defesa Administrativa e Judicial contra o INSS
- Contagem de Tempo de Contribuição
- Desaposentação
- Aposentadoria para Servidores Públicos
- Assessoria para Empresas sobre Contribuições Previdenciárias

### Trabalhista — Dra. Heloísa

- Reclamações Trabalhistas (Direitos Trabalhistas)
- Cálculo de Rescisão Trabalhista
- Assédio Moral e Sexual no Trabalho
- Acidentes de Trabalho e Doenças Ocupacionais
- Horas Extras, Adicional Noturno e Insalubridade
- Rescisão Indireta e Justa Causa
- Defesa de Empresas em Processos Trabalhistas
- Acordos e Mediação Trabalhista
- Consultoria para Empresas sobre Direito Trabalhista
- Revisão de Contratos de Trabalho
- Defesa em Processos de Acidente de Trabalho
- Terceirização e Reformas Trabalhistas
- Advocacia Preventiva para Empresas

### Civil e Família — ambas as advogadas

Sem subdivisão obrigatória conforme brief. Texto editorial Cormorant explicando o atendimento conjunto e os tipos de demanda (divórcio, inventário, guarda, contratos civis, dano moral, etc.) a confirmar com as advogadas.

---

## 5. Conversão & Leads

### WhatsApp é o canal primário

**Sempre** a forma principal de contato. Clientes consistentemente reportam que é o que mais converte e fecha negócio.

Implementação mínima:
- Botão "Agendar via WhatsApp" no Hero
- Botão "WhatsApp" no card de Contatos do Footer
- **FAB redondo verde (`#25D366`) fixo no mobile** com folga acima da sticky bar
- **Sticky CTA bar branca no rodapé do mobile** com botão pill `gold-solid` "Agendar Consulta" → abre WhatsApp
- Cada link usa formato `https://wa.me/55<DDD><número>` (sem espaços, sem hífens)
- Telefone real vem de [`022 CARTÃO DIGITAL/DADOS.txt`](022%20CART%C3%83O%20DIGITAL/) — não inventar

Use ícone WhatsApp como PNG silhueta + CSS mask com `background-color` para trocar cor por hover (verde `#25D366`).

### Rotas alternativas ao formulário

Clientes valorizam ter rotas diretas além do formulário. No HAAS:
- Link direto pra WhatsApp em cada card de área (com link específico para a advogada responsável quando aplicável)
- Telefone clicável
- Botão "Ver Rotas" → Google Maps direto
- E-mail clicável em `mailto:`

**Forma menos atrito = mais conversão.** Não esconda contatos atrás de formulário.

---

## 6. Redes Sociais — Padrão de Footer

Sempre incluir as redes do cliente no card "Contatos" do footer, com ícones PNG silhueta + CSS mask. O `<a>` é totalmente transparente; **apenas o ícone troca de cor** no hover.

| Rede | Cor padrão (icone) | Hover color | Quando incluir |
|---|---|---|---|
| **WhatsApp** | `--color-gold` | `#25D366` | Sempre |
| **Instagram** | `--color-gold` | `#E1306C` | Sempre (HAAS tem Instagram ativo) |
| **LinkedIn** | `--color-gold` | `#0A66C2` | Sim — advogadas + escritório, B2B importante |
| **Jusbrasil** | `--color-gold` | `#1B6ABF` (azul Jusbrasil) | Sim — rede de nicho jurídico, eleva autoridade |
| **Facebook** | `--color-gold` | `#1877F2` | Confirmar com cliente — só se houver atividade |

**No HAAS, a cor padrão dos ícones em estado normal é gold (`--color-gold`)** — coerência com a marca. O hover revela a cor da rede.

### Estrutura técnica

```html
<a href="..." target="_blank" rel="noopener" aria-label="..."
   class="social-link social-link--<nome>">
  <span class="social-mask social-mask--<nome>" aria-hidden="true"></span>
</a>
```

```css
.social-mask {
  display: inline-block;
  width: 28px; height: 28px;
  background-color: var(--color-gold);
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-position: center;
          mask-position: center;
  -webkit-mask-size: contain;
          mask-size: contain;
  transition: background-color 0.25s ease;
}
.social-mask--<nome> {
  -webkit-mask-image: url('../images/<nome>-icon.png');
          mask-image: url('../images/<nome>-icon.png');
}
.social-link--<nome>:hover .social-mask { background-color: <brand>; }
```

---

## 7. Crédito Almeida Escala Digital (obrigatório)

No rodapé, **logo abaixo** do copyright do cliente:

```
Site desenvolvido por Almeida Escala Digital. Todos os direitos reservados.
```

- Link: `https://almeidaescaladigital.com/` (`target="_blank" rel="noopener"`)
- Estilo: cor `--color-gold` (Inter 12px), underline discreto, hover muda para `--color-paper-white`.

---

## 8. Identidade Visual — vínculo com `DESIGN.md`

A identidade visual completa do HAAS está em [`DESIGN.md`](DESIGN.md). Inclui:

- Paleta (`--color-onyx`, `--color-gold`, `--color-paper-white`, etc.)
- Tipografia (Cinzel display, Cormorant Garamond body, Inter UI)
- Escala tipográfica completa
- Spacing & shapes (radii pequenos, escala de espaçamento 8→160)
- Cinematic Intro Sequence (spec completa)
- Todos os componentes (Header, Hero, Cards, Página de Autoridade, Sobre Nós, Blog, FAQ, Localização, CTA Final, Footer, Botões)
- Inventário de assets (6 pastas mapeadas para uso no site)
- Do's & Don'ts
- Quick Start CSS + Tailwind v4 + import Google Fonts

**Qualquer dúvida visual: consultar `DESIGN.md` antes de inventar.** O sistema de design é exaustivo para esse propósito.

---

## 9. Animações & Comportamento

- **GSAP 3 + ScrollTrigger** via CDN.
- Padrão de entrada: `fade-up` com leve `stagger` por seção, `start: 'top 85%'`.
- Hero scroll-linked: header retrai progressivamente nos últimos ~220px da hero (transform translateY proporcional, sem CSS transition).
- Reveal threshold cumulativo: header só reaparece após **60px** acumulados de scroll-up. Mini-scrolls não ativam reveal.
- Respeitar `prefers-reduced-motion: reduce` em toda animação não-funcional.
- Hover do botão WhatsApp do hero: bottom-left vira reto suavemente (`transition: border-bottom-left-radius` isolado). No mobile esse estado é permanente.

### Cinematic Intro Sequence — comportamento de marca crítico

Toda primeira visita à home executa a sequência cinematográfica (vídeo 3D autoplay → freeze último frame → header desce → hero fade-up → skip button gold). Definida em detalhes em [`DESIGN.md`](DESIGN.md) → seção "Cinematic Intro Sequence". Cobre:

- Desktop full-cover + mobile com letterboxing preto vertical (vídeo centralizado, largura = largura da tela).
- Skip button gold em duas versões: completa (desktop) e minimalista (mobile, hit-area ≥44×44px).
- Gate `sessionStorage.haas_intro_seen` para não repetir na mesma sessão.
- Fallback `prefers-reduced-motion: reduce` → pular sequência inteira.
- Variante mobile-optimized do vídeo + `canplaythrough` + indicador de loading gold discreto.

**Não duplicar a spec aqui** — fonte única de verdade é o `DESIGN.md`.

---

## 10. Mobile Específico

- **WhatsApp FAB redondo verde** (`#25D366`, w-14 h-14) bottom-right.
- **Sticky CTA bar branca** no rodapé com pill button `gold-solid` "Agendar Consulta".
- FAB posicionado **acima** da sticky bar com folga (`bottom-32` no Tailwind, ~128px).
- Ambos somem em `≥ md` (768px).
- Animações fluidas: ambos aparecem quando o scroll passa de ~55% da hero; somem se voltar ao topo.
- Skip button mobile da intro: versão minimalista (sem border, gold, hit-area ≥44×44px) — ver `DESIGN.md`.

---

## 11. Performance & Acessibilidade

- Fontes via Google Fonts com `preconnect` (Cinzel, Cormorant Garamond, Inter).
- Iframes (mapa) com `loading="lazy"`; imagens fora do hero com `loading="lazy"`.
- Sem build = sem bundle pesado. Tailwind CDN tem overhead aceitável nessa fase.
- **Vídeo da intro toca em desktop e mobile** (decisão do cliente — preserva entrada cinematográfica). Mobile recebe **variante leve (<4MB)** servida via `<source media="(max-width: 1023px)">`; mitigar com `canplaythrough` antes de iniciar e indicador de loading gold discreto. Spec completa no `DESIGN.md`.
- Alvos Lighthouse: Performance ≥ 85 (90 sem vídeo, 85 com), Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- `alt` text em toda imagem informativa em PT-BR; `aria-hidden="true"` nos decorativos.
- Links externos com `target="_blank" rel="noopener"`.
- Skip button da intro com `tabindex="0"`, `aria-label="Pular animação de introdução"`, ativável por Enter/Space, hit-area ≥44×44px.
- Contraste gold/black, gold/white, white/black passa WCAG AA com folga.
- SEO técnico: meta tags por página, schema.org `LegalService` no `<head>` (advogadas como `attorney`), `sitemap.xml` estático, `robots.txt`.

---

## 12. Logo: regras de uso

Resumo curto — detalhes completos em [`DESIGN.md`](DESIGN.md) → seção Do's & Don'ts.

- Logo SEMPRE em destaque maior que padrões genéricos — pedido explícito do cliente.
- **Variações** (todas em [`01 LOGOMARCA NORMAL/`](01%20LOGOMARCA%20NORMAL/)):
  - `LOGO.png` — gold-on-black full → **Hero ornamento, Footer**.
  - `LOGO TRS.png` — transparente → **Header** (sobre vídeo/blur).
  - `LOGO PRETO.png` — preto sólido → fundos brancos.
  - Versões CMYK/PDF/CDR → apenas impressão.
- **Favicon**: [`015 FAVICON SITE/FAV.png`](015%20FAVICON%20SITE/) → copiar para `assets/favicon.png` e gerar `.ico` 32×32.
- **Tamanho mínimo**: 120px de largura. Abaixo disso, usar apenas favicon ou monograma "H".

---

## 13. Diretrizes específicas HAAS

Regras de ouro deste projeto (lei interna — não desvie):

- **Dark premium cinematográfico é a base.** Não inventar seções claras sem justificativa estratégica.
- **Gold é destaque, nunca dominante.** Black domina; white é texto/conteúdo; gold pontua.
- **Cinematic Intro Sequence é não-negociável** no primeiro carregamento — com fallback `prefers-reduced-motion`.
- **Sobre Nós SEMPRE em 2 blocos**: institucional + perfis das advogadas. Não comprimir em um só.
- **Cards de área de atuação SEMPRE linkam** para uma página de autoridade do especialista (Aline → Previdenciário, Heloísa → Trabalhista, ambas → Civil e Família).
- **WhatsApp continua o canal primário** — não substituir por formulário.
- **Reaproveitar os ícones gold do Instagram** ([`017 ÍCONES DESTAQUES INSTAGRAM/`](017%20%C3%8DCONES%20DESTAQUES%20INSTAGRAM/)) como ícones das áreas/seções para coerência cross-channel.
- **Logo em destaque maior** que template genérico — pedido explícito do cliente.
- **Fotos das advogadas SEMPRE dentro de uma das molduras gold** de [`011 MOLDURA/`](011%20MOLDURA/). Escolher uma como padrão e manter.
- **Tipografia**: Cinzel em capitais com tracking positivo (+1px a +2px). Cormorant Garamond para corpo. Inter só em chrome (nav, OAB, labels). Nunca usar sans-serif em editorial.
- **Cor**: só `--color-onyx`, `--color-pure-black`, `--color-charcoal`, `--color-graphite`, `--color-gold`, `--color-gold-deep`, `--color-gold-light`, `--color-paper-white`, `--color-ivory`, `--color-stone`, `--color-whatsapp`. Nada mais.
- **Hit area ≥44×44px** em todo elemento interativo, especialmente skip button da intro mobile.
- **PT-BR formal** em todo conteúdo. "Nós", "o escritório", "nossas clientes" — nunca "a gente".

---

## 14. Validação em browser (Chrome DevTools MCP)

Ao validar mudanças visuais ou comportamentais no site via `chrome-devtools-mcp` (ou qualquer MCP de browser):

- **Default: `evaluate_script`.** Inspecionar `getComputedStyle`, classes, scroll, eventos e estado do DOM via script é instantâneo e ocupa pouco contexto.
- **`take_screenshot` só quando o teste é genuinamente visual** — composição, tipografia, contraste, layout perceptivo. Tipicamente **1 screenshot por cenário crítico**, não vários.
- **Não tirar múltiplos screenshots pra comparar frames de animação.** Extrair `transition`, `transition-duration` e `transition-timing-function` via `getComputedStyle` em vez disso.
- **Exceção**: quando o cliente/usuário pede explicitamente uma revisão visual completa ("ultra-review", "revise todas as páginas", "me mostre o mobile"). Aí pode usar screenshots à vontade.

> Por quê: o ciclo de validação com muitos screenshots come tempo e contexto. Uma correção de UI típica se valida com 0–2 screenshots — dez é excesso.

---

## 15. Estrutura de Arquivos

```
HAAS advocacia/
├── CLAUDE.md                          ← este arquivo (auto-carregado)
├── DESIGN.md                          ← sistema de design (fonte da verdade visual)
├── infos.txt                          ← brief original do cliente
├── .gitignore
├── index.html
├── sobre.html
├── servicos.html
├── servicos/
│   ├── previdenciario.html
│   ├── trabalhista.html
│   └── civil-familia.html
├── blog/
│   ├── index.html
│   └── <posts>.html
├── assets/
│   ├── css/
│   │   └── styles.css                 ← overrides do tema (gradient gold, animações, letterbox mobile)
│   ├── js/
│   │   └── main.js                    ← Cinematic Intro, GSAP, reveals, sessionStorage gate
│   ├── images/
│   │   ├── logo-full.png              ← cópia de LOGO.png renomeada
│   │   ├── logo-transparent.png       ← cópia de LOGO TRS.png
│   │   ├── logo-black.png             ← cópia de LOGO PRETO.png
│   │   ├── favicon.png
│   │   ├── moldura.png                ← uma das 3 molduras escolhida
│   │   ├── icone-previdenciario.png   ← do 017
│   │   ├── icone-trabalhista.png      ← do 017
│   │   ├── icone-civil-familia.png    ← do 017
│   │   ├── icone-sobre.png            ← do 017
│   │   ├── icone-blog.png             ← do 017
│   │   ├── icone-faq.png              ← do 017
│   │   ├── whatsapp-icon.png
│   │   ├── instagram-icon.png
│   │   ├── linkedin-icon.png
│   │   ├── jusbrasil-icon.png
│   │   ├── dra-aline.jpg              ← foto profissional (a receber)
│   │   └── dra-heloisa.jpg            ← foto profissional (a receber)
│   └── video/
│       ├── intro-desktop.mp4          ← cópia de 018 VÍDEO 3D/
│       └── intro-mobile.mp4           ← variante leve <4MB (a gerar)
│
└── Pastas originais do cliente (NÃO MOVER, NÃO RENOMEAR):
    ├── 01 LOGOMARCA NORMAL/
    ├── 011 MOLDURA/
    ├── 015 FAVICON SITE/
    ├── 017 ÍCONES DESTAQUES INSTAGRAM/
    ├── 018 VÍDEO 3D/
    └── 022 CARTÃO DIGITAL/
```

As pastas originais são arquivo de marca/print — referenciá-las nos `.md`, mas no HTML usar as cópias renomeadas em `assets/images/` (caminhos sem espaço, sem maiúscula).

---

## 16. Substituições Pendentes — Checklist por etapa do projeto

Marcar com `<!-- TODO -->` no HTML quando o asset/conteúdo ainda não veio do cliente:

- [ ] Telefone fixo da HAAS (consumir de [`022 CARTÃO DIGITAL/DADOS.txt`](022%20CART%C3%83O%20DIGITAL/))
- [ ] E-mail oficial (idem)
- [ ] Endereço real (Maps direcionando para coordenadas corretas — idem)
- [ ] OAB da Dra. Aline (idem ou currículo)
- [ ] OAB da Dra. Heloísa (idem ou currículo)
- [ ] Currículo completo Dra. Aline (Aline vai enviar)
- [ ] Currículo completo Dra. Heloísa (Heloísa vai enviar)
- [ ] Foto profissional Dra. Aline
- [ ] Foto profissional Dra. Heloísa
- [ ] Foto/B-roll do escritório (opcional, hero alternativo)
- [ ] Conteúdo inicial do blog (3–6 posts)
- [ ] Variante mobile do vídeo 3D (<4MB)
- [ ] Frame estático do vídeo (JPG/WebP) para fallback `prefers-reduced-motion`
- [ ] Texto institucional do bloco "Sobre Nós — escritório" (pode redigir do `infos.txt` + entrevista)
- [ ] Confirmação das redes sociais ativas (Instagram, LinkedIn, Jusbrasil, Facebook?)
- [ ] Confirmação do horário de atendimento
- [ ] Domínio confirmado (`haasadvocacia.com.br`?)

---

## 17. Sobre este arquivo

Este é o `CLAUDE.md` deste projeto, derivado do `landing-patterns.md` da Almeida Escala Digital, com adaptações específicas para o caso HAAS Advocacia (identidade do cliente, áreas de atuação detalhadas, regras de logo, diretrizes HAAS, integração com o `DESIGN.md`).

Mudanças que sejam **genéricas** e valham para qualquer landing da agência devem voltar para o `landing-patterns.md` mestre da agência (não para este arquivo). Mudanças **específicas do HAAS** ficam aqui.
