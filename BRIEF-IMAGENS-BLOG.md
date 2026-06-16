# Brief de Imagens — Blog HAAS Advocacia

> Documento para sourcing/geração de imagens. São **3 artigos × 2 imagens = 6 imagens** no total.
> Cada artigo tem **uma imagem no topo (banner)** e **uma no fim (figura)**.

---

## Contexto da marca

- **Cliente:** HAAS Advocacia — escritório de advocacia (Previdenciário, Trabalhista, Família, Consumidor).
- **Estética do site:** *dark premium cinematográfico* — fundo preto profundo, dourado (`#C9A961`) como destaque, tipografia serifada clássica. Sóbrio, institucional, autoridade.
- **Tratamento aplicado no site:** as fotos entram **escurecidas + leve grade quente** (no banner do topo, com gradiente escuro por cima para o título dourado ficar legível). Então mande imagens **bem expostas e nítidas** — o site cuida do escurecimento.

## Regras de estilo (valem para TODAS as 6 imagens)

- **Linguagem:** fotografia **documental**, real, sóbria e elegante. Luz natural ou de cena, preferência por tons quentes/neutros.
- **EVITAR (clichês de advocacia e de banco de imagem):** martelo de juiz (gavel), balança da justiça, aperto de mão sorridente genérico, pessoas de terno posando para a câmera, cores berrantes/saturadas, fundos brancos de estúdio, watermark.
- **Composição:** o **banner do topo é recortado nas bordas** (`object-fit: cover`) → mantenha o **foco no centro** e deixe respiro nas pontas (nada essencial nas bordas).
- **Tom emocional:** respeitoso e humano. Em temas delicados (divórcio), nada de dramatização triste — preferir sobriedade/recomeço.

## Especificações técnicas

| Lugar | Proporção | Mínimo | Ideal | Máximo útil | Peso alvo |
|---|---|---|---|---|---|
| **Topo — banner full-bleed** | paisagem **16:9** | 1600×900 | **1920×1080** | 2560×1440 | ≤ 500 KB |
| **Fim — figura inline** | paisagem **16:9** (3:2 também serve) | 1200×675 | **1600×900** | 2000×1200 | ≤ 300 KB |

- **Formato:** WebP (preferível) ou JPG de alta qualidade. Sem necessidade de transparência (não usar PNG).
- **Orientação:** ambas **paisagem**. Nada em retrato.

---

## Artigo 1 — Aposentadoria por Tempo de Contribuição após a Reforma

- **Área:** Direito Previdenciário · **Autora:** Dra. Aline
- **Resumo:** O que mudou com a Reforma da Previdência (EC 103/2019), as 5 regras de transição, a idade mínima (65 anos homens / 62 mulheres), o novo cálculo do benefício e por que o **planejamento previdenciário** virou essencial. Tom: técnico, mas humano — é sobre a vida de contribuição de uma pessoa.

**Imagem TOPO (banner 16:9):**
> Retrato documental de uma **pessoa idosa (60+)** em **luz natural quente** — expressão serena e digna, em ambiente cotidiano (perto de uma janela, em casa, ao ar livre). Transmite **tempo, trajetória e a conquista de uma vida de trabalho**. Foco no rosto/figura ao centro. Sem sorriso forçado de catálogo.

**Imagem FIM (figura 16:9):**
> **Mesa de trabalho** com documentos/extratos previdenciários, óculos e caneta, sob luz lateral quente — sugere **análise técnica e planejamento**. Alternativa: mãos de pessoa madura sobre papéis. Sem rostos obrigatórios.

---

## Artigo 2 — Rescisão Indireta: quando o trabalhador pode pedir

- **Área:** Direito Trabalhista · **Autora:** Dra. Heloísa
- **Resumo:** O empregado pode romper o contrato (art. 483 da CLT) e ainda receber as verbas como se fosse demitido sem justa causa. As 7 hipóteses legais, o prazo de até 2 anos e — o ponto central — **como reunir prova** antes de ajuizar. Tom: firme, técnico, lado do trabalhador (e também consultoria a empresas).

**Imagem TOPO (banner 16:9):**
> **Trabalhador real em ambiente de trabalho** — indústria, construção, oficina, cozinha profissional ou escritório — em **luz dramática/sóbria**, com foco na pessoa e no labor. Transmite o **mundo do trabalho** com dignidade. Evitar pose; preferir flagrante documental.

**Imagem FIM (figura 16:9):**
> **Documentos trabalhistas sobre a mesa** — contrato de trabalho, holerite, carteira de trabalho ou registro de ponto, com caneta — sugerindo **prova e formalização**. Ambiente neutro, luz sóbria.

---

## Artigo 3 — Divórcio Consensual: como funciona na prática

- **Área:** Direito de Família · **Autoras:** Dra. Aline & Dra. Heloísa (atendimento conjunto)
- **Resumo:** Quando o casal termina de comum acordo, há um caminho mais curto e menos litigioso — possível inclusive em cartório (desde 2007), dependendo de filhos, bens e regime. Cobre partilha, guarda, convivência e pensão. Tom: **respeitoso, sereno, sem dramatizar**.

**Imagem TOPO (banner 16:9):**
> Cena **sóbria e respeitosa** que evoque **recomeço/família** sem tristeza: par de alianças repousando sobre um documento, mãos adultas, ou um **lar em luz quente** (chaves, porta, interior aconchegante). Delicado e digno — nunca clichê de casal brigando.

**Imagem FIM (figura 16:9):**
> **Assinatura de acordo/documento** sobre a mesa, com caneta(s), em escritório calmo e luz quente — sugere **acordo consensual e formalização tranquila**. Sem rostos obrigatórios.

---

## Integração (referência técnica)

Quando as imagens estiverem prontas, são salvas em `assets/images/` e plugadas nos 2 `src` de cada post. Nomes sugeridos:

| Artigo | Topo | Fim |
|---|---|---|
| Aposentadoria | `blog-aposentadoria-topo.webp` | `blog-aposentadoria-fim.webp` |
| Rescisão Indireta | `blog-rescisao-topo.webp` | `blog-rescisao-fim.webp` |
| Divórcio Consensual | `blog-divorcio-topo.webp` | `blog-divorcio-fim.webp` |

> Hoje os `src` apontam para placeholders externos (loremflickr) — serão substituídos por esses arquivos locais.
