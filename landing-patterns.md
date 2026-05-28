# Landing Pages — Padrões & Workflow

Padrões reutilizáveis para projetos de landing page da **Almeida Escala Digital**.
Copie este arquivo para a raiz de cada novo projeto. Se quiser que o Claude carregue
automaticamente em toda sessão, renomeie para `CLAUDE.md`.

---

## 1. Idioma & Comunicação

- **Prompts** podem vir em **inglês** (transcrição via Wispr, que traduz a fala
  PT-BR → EN para melhorar o raciocínio do modelo).
- **Respostas do Claude** SEMPRE em **português do Brasil**, mesmo quando o
  prompt vier em inglês. Esta é a regra prioritária deste arquivo.
- Comentários e nomes de arquivos/variáveis em código podem seguir o que já estiver
  no projeto (geralmente PT-BR descritivo, EN para termos técnicos).

> Por que isso funciona: o raciocínio interno em inglês reduz ambiguidade em prompts
> complexos, mas o feedback final em PT-BR garante que decisões cheguem na língua
> que o operador (você) consegue revisar rapidamente.

---

## 2. Stack Padrão

Para landing pages de baixa complexidade (95% dos casos):

| Camada | Escolha |
|---|---|
| HTML | HTML5 estático |
| CSS | Tailwind via CDN com config inline + arquivo `styles.css` para extensões |
| JS | Vanilla + GSAP 3 / ScrollTrigger via CDN |
| Build | **Nenhum** — sem `package.json`, sem Node, sem framework |
| Deploy | Vercel / Netlify / Cloudflare Pages / GitHub Pages (estático) |
| Versionamento | Git + GitHub |

Para casos com formulário complexo ou CMS, subir para Astro ou Next.js só quando
realmente justificar.

---

## 3. Seções Padrão

Pedido recorrente dos clientes — assumir como base e cortar se o cliente disser
que não quer:

1. **Hero** — headline + CTA primário (WhatsApp) + CTA secundário (rolar para
   "Especialidades" / "Localização") sobre imagem de contexto.
2. **Sobre** — bio, foto profissional, diferenciais, observações de escopo de
   atendimento (faixa etária, planos, etc.).
3. **Especialidades / Serviços** — bento grid ou cards listando o que é
   oferecido.
4. **Localização** — endereço, horário, mapa embed, botão "Ver Rotas" (Google
   Maps Directions API com `destination` = endereço da clínica/escritório;
   `origin` omitido para o Maps usar localização atual do usuário).
5. **Blog** — quando o cliente pede. Geralmente 3-6 cards de posts recentes com
   link para o post inteiro. Costuma vir como pedido extra, mas surge MUITAS
   vezes — já considerar grid pronto no design.
6. **FAQ** — accordion com `<details>` nativo, 3-5 perguntas.
7. **CTA Final** — chamada forte + botão sand-accent grande.
8. **Footer** — logo, navegação, legal, contatos, redes sociais, crédito da
   Almeida Escala.

Seções opcionais comuns:
- Diferenciais + Quote (cita o profissional)
- Galeria de fotos do espaço (junto da Localização ou em seção própria)
- Depoimentos
- Newsletter (raro em landing simples)

---

## 4. Conversão & Leads

### WhatsApp é o canal primário

**Sempre** a forma principal de contato. Clientes consistentemente reportam que
é o que mais converte e fecha negócio.

Implementação mínima:
- Botão "Agendar via WhatsApp" no Hero
- Botão "WhatsApp" no card de Contatos do Footer
- **FAB redondo verde (`#25D366`) fixo no mobile** com folga acima da sticky bar
- **Sticky CTA bar branca no rodapé do mobile** com botão navy "Agendar Consulta"
  → abre WhatsApp
- Cada link usa formato `https://wa.me/55<DDD><número>` (sem espaços, sem hífens)

Use ícone WhatsApp como PNG silhueta + CSS mask com `background-color` para
trocar cor por hover (verde `#25D366` quando colocar o cursor).

### Rotas alternativas ao formulário

Clientes valorizam **ter rotas diretas além do formulário/lead capturado por
LGPD-compliant form**. Em especialidades ou no blog, costuma render bem oferecer:
- Link direto pra WhatsApp em cada card
- Telefone clicável
- Botão "Ver Rotas" → Google Maps direto

Forma menos atrito = mais conversão. Não esconda contatos atrás de formulário.

---

## 5. Redes Sociais — Padrão de Footer

Sempre incluir as **redes do cliente** no card "Contatos" do footer, com ícones
PNG silhueta + CSS mask. O `<a>` é totalmente transparente (sem borda/bloco);
**apenas o ícone troca de cor** no hover.

| Rede | Hover color | Quando incluir |
|---|---|---|
| **WhatsApp** | `#25D366` | Sempre |
| **Instagram** | `#E1306C` | Quase sempre |
| **LinkedIn** | `#0A66C2` | Profissionais B2B, advogados, médicos sênior |
| **Facebook** | `#1877F2` | Comum em saúde, estética, varejo local |
| **Nicho específico** | cor temática | Quando o cliente tiver presença ativa lá |

### Redes de nicho — exemplos

| Cliente / nicho | Rede específica | Domínio |
|---|---|---|
| Médico (geral) | **Médicos Brasil** | `medicosbrasil.com` |
| Advogado | Jusbrasil | `jusbrasil.com.br` |
| Arquiteto | Houzz / Behance | `houzz.com` / `behance.net` |
| Restaurante | iFood / Goomer / TripAdvisor | — |
| Profissional fitness | Strava / Gympass | — |

**Sempre perguntar ao cliente quais redes ele mantém ativas** — colocar rede
abandonada é pior que não colocar.

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
  background-color: #7386a8;     /* cor padrão */
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

## 6. Crédito Almeida Escala Digital (obrigatório)

No rodapé, **logo abaixo** do copyright do cliente, incluir SEMPRE:

```
Site desenvolvido por Almeida Escala Digital. Todos os direitos reservados.
```

- Link: `https://almeidaescaladigital.com/` (target="_blank" rel="noopener")
- Estilo: cor de destaque secundária do projeto (no Carlos Nassif:
  `text-sand-accent`), underline discreto, hover muda para `clinical-white`.

---

## 7. Identidade Visual por Cliente

Mantida em **`design.md`** na raiz do projeto. Inclui:

- Paleta (primary, secondary, accent, neutros)
- Combinação tipográfica (display + body, com pesos)
- Estilo geral (clinical/premium/playful/etc.)
- Logo (variações: full, icon-only, text-only)
- Tom de marca (formal, casual, autoridade, próximo, etc.)
- Imagens de referência fornecidas pelo cliente
- Quaisquer regras específicas (ex.: "atende só adultos" — virou nota cultural
  no Sobre do Carlos Nassif)

`design.md` é por cliente. `landing-patterns.md` (este arquivo) é o padrão da
agência. Os dois andam juntos no projeto.

---

## 8. Animações & Comportamento

- GSAP 3 + ScrollTrigger via CDN
- Padrão de entrada: `fade-up` com leve `stagger` por seção, `start: 'top 85%'`
- Hero scroll-linked: header retrai progressivamente nos últimos ~220px da hero
  (transform translateY proporcional, sem CSS transition)
- Reveal threshold cumulativo: header só reaparece após **60px** acumulados de
  scroll-up. Mini-scrolls não ativam reveal.
- Respeitar `prefers-reduced-motion` (envolver init em
  `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)` ou
  adicionar fallback CSS `.reveal-immediate`)
- Hover do botão WhatsApp do hero: bottom-left vira reto suavemente
  (`transition: border-bottom-left-radius` isolado). No mobile esse estado é
  permanente.

---

## 9. Mobile Específico

- **WhatsApp FAB redondo verde** (`#25D366`, w-14 h-14) bottom-right
- **Sticky CTA bar branca** no rodapé com pill button navy
  ("Agendar Consulta" ou similar)
- FAB posicionado **acima** da sticky bar com folga (`bottom-32` no Tailwind,
  ~128px)
- Ambos somem em `≥ md` (768px)
- Animações fluidas: ambos aparecem quando o scroll passa de ~55% da altura do
  hero. Somem se voltar ao topo.

---

## 10. Performance & Acessibilidade

- Fontes via Google Fonts com `preconnect`
- Iframes (mapa) com `loading="lazy"` (ou `loading="lazy"` em imagens fora do hero)
- Sem build = sem bundle pesado. Tailwind CDN tem overhead aceitável nessa fase.
- Alvos Lighthouse: Performance ≥ 85, Accessibility ≥ 95
- `alt` text em toda imagem informativa; `aria-hidden="true"` nos decorativos
- Links externos com `target="_blank" rel="noopener"`
- Contraste navy/branco passa AA

---

## 11. Estrutura de Arquivos Padrão

```
<projeto>/
├── index.html
├── README.md
├── landing-patterns.md       ← este arquivo
├── design.md                 ← identidade visual do cliente
├── .gitignore
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   └── images/
│       ├── logo-full.png
│       ├── logo-icon.png
│       ├── logo-text.png
│       ├── whatsapp-icon.png
│       ├── instagram-icon.png
│       ├── linkedin-icon.png       (se aplicável)
│       ├── medicosbrasil-icon.png  (se cliente médico)
│       └── ...
└── images/                    ← assets originais entregues pelo cliente (PDFs, fontes, etc.)
```

---

## 12. Substituições Pendentes — Checklist por Projeto

Marcar com `<!-- TODO -->` no HTML:

- [ ] Telefone fixo do cliente
- [ ] E-mail oficial
- [ ] Fotos profissionais (retrato, espaço, equipamento)
- [ ] Foto de fundo da hero
- [ ] Endereço real (Maps direcionando para coordenadas corretas)
- [ ] Links sociais reais (`@usuario`)
- [ ] Conteúdo do blog (quando aplicável)
- [ ] CRM / OAB / CAU / registro profissional aplicável
- [ ] Horário de atendimento confirmado

---

## 13. Sobre a regra de idioma persistir entre projetos

**Pergunta:** "Só com o `.md` exportado entre os projetos, a regra de prompts
EN → resposta PT-BR passa a ser usada em todos os projetos?"

**Resposta:** Sim, **desde que o arquivo seja lido pelo Claude no início da
sessão**. Existem dois caminhos:

1. **Renomear para `CLAUDE.md`** — o Claude Code lê automaticamente todo
   `CLAUDE.md` da raiz do projeto a cada sessão. Zero esforço, regra ativa
   em 100% das interações. Recomendado se a regra for considerada "lei".

2. **Manter como `landing-patterns.md`** — o arquivo só vira contexto quando
   for explicitamente referenciado (ex.: primeira mensagem da sessão dizendo
   "leia o landing-patterns.md antes de começar"). Mais explícito, dá pra
   ligar/desligar.

**Recomendado**: mantenha como `landing-patterns.md` neste repositório (referência
viva e editável), e em cada projeto novo crie um `CLAUDE.md` de uma linha:

```
Siga as regras em landing-patterns.md (importado deste repositório).
```

Isso evita duplicação e mantém uma única fonte de verdade entre projetos.
