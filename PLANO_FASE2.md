# PLANO FASE 2 — PianoLab
**Auditoria + Plano de Implementação**
Gerado por: PianoLab Agent (PIA-2)
Data: 2026-03-25

---

## SEÇÃO 1: DIAGNÓSTICO

### Problema 1 — index.html com aparência de pasta do Windows Explorer
**Status:** PARCIALMENTE CONFIRMADO — melhorado mas incompleto

O index.html atual já tem um hero com logo 🎹, título "PianoLab" e subtitle "Curso interativo de piano", que supera a aparência de pasta. Porém, o problema real persiste de forma mais sutil:

- **Causa raiz:** Os módulos listados (M1–M8) não refletem uma identidade de curso coesa. O card "M1 · O Dó Central" com desc "3 fases · a primeira nota" apresenta um exercício isolado como se fosse um módulo completo, sem hierarquia clara de módulos → exercícios.
- **Código problemático (index.html linha 158–167):**
  ```js
  const MODULOS = [
    { n:1, nome:'O Dó Central',  desc:'3 fases · a primeira nota', ... },
    { n:2, nome:'5 Primeiras Notas', desc:'7 fases · Dó Ré Mi Fá Sol', ... },
    { n:3, nome:'As 7 Notas',    desc:'em breve · + Lá e Si', ... },
    { n:4, nome:'Escalas',       desc:'em breve · 12 tonalidades', ... },
    ...
  ```
  Os 3 primeiros módulos são sub-exercícios de "Conhecendo as Teclas" sendo exibidos como se fossem módulos independentes de mesmo nível que Escalas e Acordes.
- **Gravidade:** MÉDIO — funciona, mas confunde a hierarquia pedagógica

---

### Problema 2 — Piano pequeno em portrait (proporção errada)
**Status:** CONFIRMADO — crítico em m1.html, resolvido em m2.html

**m1.html:**
- Override manual: `:root { --key-h: 120px; --key-bk-h: 72px; }` (linha 13)
- Range: C4–B5 = 2 oitavas = 14 teclas brancas × 44px = **616px de largura** em tela de 360px
- Modo: `createPianoKeyboard(..., { startNote:'C4', endNote:'B5', ... })` — SEM `responsive: true`
- Resultado: piano rola horizontalmente, teclas pequenas e fixas
- **Causa raiz:** m1.html não usa o modo responsivo nem o layout `piano-stage` do m2.html

**m2.html (referência correta):**
- Usa `responsive: true` no createPianoKeyboard
- Stage com `--key-h: clamp(140px, 36vh, 300px)` — adapta ao viewport
- Range: C4–C5 = 1 oitava = 8 teclas brancas = preenche toda a tela
- **Gravidade:** CRÍTICO — em portrait, 2 oitavas com teclas fixas impossibilita uso confortável para criança de 7–9 anos (touch targets abaixo de 44px na largura)

---

### Problema 3 — m1.html não migrado para layout piano-body
**Status:** CONFIRMADO

m1.html usa estrutura completamente diferente de m2.html:

| Aspecto | m1.html | m2.html |
|---|---|---|
| Container | `.layout` (custom) | `.piano-body` |
| Background | `var(--bg)` = #FAFAFA (claro) | `#111827` (escuro) |
| Header | `.header` do base.css | `.panel-topbar` + `.digital-panel` |
| Navegação | `.nav-fases` do base.css | `.panel-nav` custom |
| Teclado | div simples, scroll | `.piano-stage` com responsive |
| Controles | Apenas 🔊 som | Fácil ☆, Tema ☀️, Cadeado 🔓, Som 🔊 |

- **Código problemático (m1.html linhas 18–24):**
  ```css
  .layout {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    max-width: 480px;
    margin: 0 auto;
  }
  ```
  Usa `.layout` em vez de `.piano-body`

- **Causa raiz:** m1.html foi criado antes do redesign do m2.html e nunca foi migrado
- **Gravidade:** ALTO — visualmente incoerente, experiências completamente diferentes entre módulos

---

### Problema 4 — M1 chamado de "módulo" quando deveria ser exercício
**Status:** CONFIRMADO

- Em index.html linha 199: `M${m.n} · ${m.nome}` → renderiza "M1 · O Dó Central"
- Em m1.html linha 129: `<span class="header__title">M1 — O Dó Central</span>`
- Nomenclatura implica que "O Dó Central" é um módulo completo de mesmo nível que "Escalas" ou "Acordes"
- Na nova estrutura pedagógica proposta, "O Dó Central" deveria ser o Exercício 1 dentro do Módulo 1 "Conhecendo as Teclas"
- **Causa raiz:** a estrutura de currículo foi atualizada na proposta, mas os arquivos ainda refletem a estrutura original
- **Gravidade:** ALTO — confunde a criança sobre onde ela está na jornada

---

### Problema 5 — Inconsistência visual entre m1 e m2
**Status:** CONFIRMADO — consequência direta do Problema 3

Além das diferenças de layout já listadas no Problema 3:
- m1.html: botão primário azul `btn--primary` (var(--nota-sol) = #1E88E5)
- m2.html: botão estilizado dark `.btn-ouvir` (cor #4FC3F7 sobre fundo #141e2e)
- m1.html: dots de progresso `.nav-fases__dot` com cor `var(--nota-sol)` azul
- m2.html: dots `.panel-dot` com cor `#4FC3F7` azul claro sobre fundo escuro
- m1.html: feedback text via `.feedback` com cores do base.css
- m2.html: feedback via `.feedback-quiz` com esquema dark

**Causa raiz:** Dois sistemas de design coexistindo — base.css/antigo (m1) vs piano-body/novo (m2)
**Gravidade:** ALTO — quebra a sensação de progressão natural entre lições

---

### Problemas adicionais não listados pelo usuário

**P6 — piano_CLAUDE.md com placeholders não preenchidos**
- Linhas 1, 22, 77, 112: `[NOME_DO_PROJETO]` ainda no template
- Linha 3: `**Versão:** 1.0 | [DATA_DE_INÍCIO]` não preenchida
- **Gravidade:** BAIXO — não afeta o app, mas documenta confusão de identidade

**P7 — Range do teclado de m1.html excessivo para o objetivo**
- m1.html usa C4–B5 (2 oitavas) para ensinar uma única nota (Dó)
- m2.html usa C4–C5 (1 oitava) para 5 notas — mais focado e adequado
- Ter 14 teclas quando só 2 são relevantes (C4, C5) sobrecarrega cognitivamente
- **Causa raiz:** range herdado de uma versão anterior, nunca ajustado
- **Gravidade:** MÉDIO — afeta usabilidade e foco pedagógico

**P8 — m1.html não tem modo Fácil (hints), Cadeado ou Tema**
- m2.html implementou `Settings.getEasyMode()` com `kb.hint()` → dica dourada pulsando
- m1.html não tem nenhum desses controles
- Para uma criança de 7–9 anos, a dica dourada é crucial na primeira lição
- **Causa raiz:** features implementadas em m2, nunca retroportadas para m1
- **Gravidade:** ALTO — criança sem dica pode frustrar na primeira interação

**P9 — Botão "Próxima aula" de m1 aponta para m2.html que não é mais o próximo exercício**
- m1.html linha 162: `onclick="goTo('m2.html')"` na tela de celebração
- Se m2.html se tornar Exercício 2 dentro de M1 (e não um módulo separado), essa navegação está semanticamente incorreta
- **Causa raiz:** navegação direta entre arquivos, sem hub de módulo
- **Gravidade:** MÉDIO (contextual — depende da decisão de currículo)

**P10 — index.html lista módulos com currículo desatualizado**
- Linha 161–167 lista: As 7 Notas (M3), Escalas (M4), Intervalos (M5), Acordes (M6), Campo Harmônico (M7), Transposição (M8)
- Proposta nova: Escalas sobe para M2, Acordes para M3, Campo Harmônico para M4, Progressões para M5
- Intervalos: posição a definir
- **Gravidade:** BAIXO por ora (módulos em breve), mas bloqueia implementação correta futura

---

## SEÇÃO 2: PLANO DE IMPLEMENTAÇÃO (ordenado por prioridade)

### [P1] — Migrar m1.html para layout piano-body
**Prioridade:** CRÍTICA | **Complexidade:** MÉDIO

**O que fazer:**
1. **m1.html:** substituir `.layout` por `.piano-body` (com background `#111827`)
2. **m1.html:** substituir `.header` por `.digital-panel` + `.panel-topbar`
3. **m1.html:** substituir a div de piano por `.piano-stage` com `responsive: true`
4. **m1.html:** reduzir range para C4–C5 (era C4–B5)
5. **m1.html:** adicionar controles do painel: btn-easy (☆/⭐), btn-theme (☀️/🌙), btn-lock (🔓), btn-sound
6. **m1.html:** substituir `.nav-fases` por `.panel-nav` com `.panel-dot` estilizados
7. **m1.html:** substituir `btn--primary` por `.btn-ouvir` estilizado dark
8. **m1.html:** implementar `Settings.getEasyMode()` com `kb.hint('C4')` na fase de identificação

**CSS a alterar:**
- Remover todo o bloco `<style>` interno de m1.html relativo ao `.layout`
- Copiar estrutura base de m2.html (`.piano-body`, `.digital-panel`, `.piano-stage`)
- Manter apenas CSS específico de m1: `.nota-circulo`, `.celebracao`, `.tentativa-dot`

**Critério de validação:**
- [ ] m1 e m2 têm fundo escuro idêntico (#111827)
- [ ] Piano de m1 preenche 100% da largura em 360px portrait
- [ ] Teclas de m1 têm altura mínima de 130px em portrait
- [ ] Botões do painel (☆ 🔊 etc.) aparecem em m1

---

### [P2] — Reestruturar currículo no index.html
**Prioridade:** ALTA | **Complexidade:** MÉDIO

**O que fazer:**
1. **index.html:** criar conceito de "módulo container" vs "exercício"
2. **index.html linhas 158–167:** atualizar array `MODULOS` para nova estrutura:
   ```js
   const MODULOS = [
     { n:1, href:'m1_hub.html', nome:'Conhecendo as Teclas',
       desc:'3 exercícios · Dó, 5 notas, 7 notas',
       cor:'var(--nota-do)', key:'piano_m1_completo' },
     { n:2, href:'m2.html', nome:'Escalas',
       desc:'em breve · Dó maior → 12 tonalidades',
       cor:'var(--nota-re)', key:'piano_m2_escala_progresso' },
     { n:3, href:'m3.html', nome:'Acordes',
       desc:'em breve · maior, menor, 7ª',
       cor:'var(--nota-mi)', key:'piano_m3_progresso' },
     { n:4, href:'m4.html', nome:'Campo Harmônico',
       desc:'em breve',
       cor:'var(--nota-fa)', key:'piano_m4_progresso' },
     { n:5, href:'m5.html', nome:'Progressões',
       desc:'em breve',
       cor:'var(--nota-sol)', key:'piano_m5_progresso' },
   ];
   ```
3. **Novo arquivo m1_hub.html:** hub interno do M1 com 3 cards (Exercício 1, 2, 3)
   - Card 1: "O Dó Central" → m1.html
   - Card 2: "As 5 Notas" → m2.html (atual)
   - Card 3: "As 7 Notas" → m3.html (a criar)
   - Lógica de progresso: M1 completo = 3 exercícios concluídos

**Critério de validação:**
- [ ] index.html mostra 5 módulos (não 8)
- [ ] M1 abre um hub com 3 exercícios
- [ ] Progresso de M1 é calculado pela soma dos 3 exercícios
- [ ] localStorage key não quebra saves existentes

**Atenção:** A chave `piano_m1_progresso` já existe em produção (localStorage). A lógica de M1 completo deve checar as 3 chaves dos exercícios (`piano_m1_ex1_progresso`, `piano_m1_ex2_progresso`, `piano_m1_ex3_progresso`) OU manter retrocompatibilidade checando `piano_m1_progresso` E `piano_m2_progresso` E `piano_m3_progresso` como era antes.

---

### [P3] — Corrigir labels e nomenclatura de "módulo" → "exercício"
**Prioridade:** ALTA | **Complexidade:** SIMPLES

**O que fazer:**
1. **m1.html linha 129:** alterar `M1 — O Dó Central` para `Ex 1 · O Dó Central`
   ```html
   <span class="header__title">Ex 1 · O Dó Central</span>
   ```
2. **m2.html linha 408 (panel-title):** alterar `As 5 Notas` para `Ex 2 · As 5 Notas`
3. **m1.html linha 162 (celebração):** alterar texto do botão e destino para `m1_hub.html` em vez de `m2.html`
   ```html
   <button onclick="goTo('m1_hub.html')">Continuar no módulo →</button>
   ```
4. Após criar m1_hub.html, o botão "Próxima aula" do ex2 (m2.html) também deve apontar para `m1_hub.html`

**Critério de validação:**
- [ ] Headers mostram "Ex N ·" em vez de "MN —"
- [ ] Navegação pós-celebração leva ao hub correto

---

### [P4] — Criar m1_hub.html (hub do Módulo 1)
**Prioridade:** ALTA | **Complexidade:** SIMPLES

**O que fazer:**
1. Criar `m1_hub.html` baseado no padrão do index.html (cards de exercícios)
2. Layout: mesmo `.hub` do index, mas para exercícios de M1
3. Cards: ex1 (m1.html), ex2 (m2.html), ex3 (m3.html)
4. Progresso: 3 checkmarks com base em localStorage dos 3 exercícios
5. Desbloqueio sequencial: ex2 desbloqueia quando ex1 completo, ex3 quando ex2 completo
6. Botão voltar → `index.html`

**Critério de validação:**
- [ ] Cards mostram estado correto (disponível/concluído/bloqueado)
- [ ] Ex3 bloqueado inicialmente
- [ ] Botão voltar funcional

---

### [P5] — Ajustar range do teclado de m1.html
**Prioridade:** MÉDIO | **Complexidade:** SIMPLES

**O que fazer:**
1. **m1.html:** alterar parâmetros dos dois teclados de C4–B5 para C4–C5:
   ```js
   // Linha 191-195 (kb1):
   const kb1 = createPianoKeyboard(document.getElementById('piano-s1'), {
     startNote: 'C4', endNote: 'C5',  // era B5
     ...
   });

   // Linha 199-203 (kb2):
   const kb2 = createPianoKeyboard(document.getElementById('piano-s2'), {
     startNote: 'C4', endNote: 'C5',  // era B5
     ...
   });
   ```
2. Isso reduz de 14 para 8 teclas brancas — mais espaço por tecla, mais foco pedagógico
3. O exercício de "encontrar o Dó" continua funcionando (C4 e C5 presentes)

**Critério de validação:**
- [ ] Teclado de m1 mostra C4–C5 (8 teclas brancas)
- [ ] Largura das teclas preenche o container (via responsive)
- [ ] Touch targets ≥ 44px de largura em 360px

---

### [P6] — Preencher placeholders em piano_CLAUDE.md
**Prioridade:** BAIXO | **Complexidade:** SIMPLES

**O que fazer:**
1. **piano_CLAUDE.md linha 1:** `# CLAUDE.md — PianoLab`
2. **piano_CLAUDE.md linha 3:** `**Versão:** 1.0 | 2026-01` (ou data real do início)
3. **piano_CLAUDE.md linhas 22, 77, 112:** substituir `[NOME_DO_PROJETO]` por `PianoLab`

**Critério de validação:**
- [ ] Nenhum `[NOME_DO_PROJETO]` restante no arquivo

---

## SEÇÃO 3: NOVA ESTRUTURA DE CURRÍCULO

### Proposta final com justificativa pedagógica

```
PIANOLAB — Estrutura de Módulos v2

M1: Conhecendo as Teclas
  Ex 1: O Dó Central        (m1.html existente)
  Ex 2: As 5 Primeiras Notas (m2.html existente)
  Ex 3: As 7 Notas Brancas  (m3.html — a criar)
  └── Objetivo: criança nomeia e localiza todas as 7 notas brancas

M2: Escalas
  Fase 1: Escala de Dó Maior (7 notas em sequência)
  Fase 2: Padrão de tons e semitons
  Fase 3-12: Transpor para outras tonalidades
  └── Objetivo: entender que o mesmo padrão funciona em qualquer tecla

[Mini-módulo ou primeiras fases do M2]: Intervalos
  → Ver nota abaixo

M3: Acordes
  Fase 1: Tríade maior (Dó maior = Dó + Mi + Sol)
  Fase 2: Tríade menor
  Fase 3: Acordes com sétima
  └── Pré-requisito: saber escalas (intervalos de terça = base do acorde)

M4: Campo Harmônico
  └── Pré-requisito: acordes + escala completa de uma tonalidade

M5: Progressões
  └── Pré-requisito: campo harmônico
```

**Justificativa para colocar Intervalos no início do M2:**
- Intervalos são a *linguagem* das escalas: uma escala maior = Tom-Tom-Semitom-Tom-Tom-Tom-Semitom
- Ensinar intervalos como Fase 1 de M2 é pedagogicamente mais eficiente do que um mini-módulo isolado
- Para 7–9 anos: presentar "a distância entre duas notas" antes de mostrar o padrão de escala faz sentido sequencial
- **Recomendação:** Intervalos = Fases 1–2 do M2, seguidas das fases de escalas propriamente ditas

**Por que Transposição foi removida do currículo principal:**
- Transposição já está implícita em M2 (aprender escalas em 12 tonalidades = transposição aplicada)
- Como conceito formal separado é mais adequado para M5+ ou para um módulo avançado
- Para criança de 7–9 anos, o conceito matemático de transposição é melhor aprendido fazendo (tocando a mesma música em outro tom) do que estudando isoladamente

### Mapeamento de arquivos: atual → novo

| Arquivo atual | Conteúdo atual | Novo papel |
|---|---|---|
| `index.html` | Hub global | Hub global (atualizado: 5 módulos) |
| `m1.html` | O Dó Central | M1 · Ex 1 · O Dó Central |
| `m2.html` | As 5 Notas | M1 · Ex 2 · As 5 Notas |
| `m3.html` | (não existe) | M1 · Ex 3 · As 7 Notas Brancas |
| `m4.html` | (não existe) | M2 · Escalas (reaproveitando m2.html como template) |
| `m5.html` | (não existe) | M3 · Acordes |
| `m6.html` | (não existe) | M4 · Campo Harmônico |
| `m7.html` | (não existe) | M5 · Progressões |
| `m1_hub.html` | (criar) | Hub do Módulo 1 |
| `demo.html` | Piano livre 4 acordes | Manter como playground |

---

## SEÇÃO 4: RISCOS E LIMITAÇÕES

### Riscos de implementação

**R1 — Quebra de localStorage ao renomear módulos**
- Risco: Usuários com `piano_m1_progresso` salvo veriam M1 "resetado"
- Mitigação: Manter checagem dos keys antigos como fallback; ou aceitar o reset (app ainda em dev, usuário = desenvolvedor/pai)
- Decisão humana necessária: aceitar perda de progresso salvo ou implementar migração?

**R2 — m2.html como "Módulo 2: Escalas" vs "Exercício 2: As 5 Notas"**
- O arquivo m2.html atual É o Exercício 2 de M1 na nova estrutura
- Mas o MODULE config tem `id: 'm2'` e key `piano_m2_progresso`
- Na nova estrutura, um novo m2.html (Escalas) deve ser criado — o atual m2.html permanece como ex2 do M1 mas com path diferente?
- **Decisão humana necessária:** renomear m2.html para m1_ex2.html ou manter e criar ex2 dentro de m1_hub?

**R3 — Tema dark vs light em m1.html**
- m1.html atual usa tema claro. Se migrado para dark (piano-body), muda a experiência visual.
- O botão de tema em m2.html permite alternar dark/light.
- A migração DEVE incluir o botão de tema desde o início, preservando a escolha do usuário.

**R4 — piano_CLAUDE.md com `[NOME_DO_PROJETO]` indica que o arquivo é um template genérico**
- Risco: regras do CLAUDE.md podem não ser específicas para PianoLab
- Verificar se há um CLAUDE.md real preenchido ou se este é o documento definitivo

### O que precisa de decisão humana antes de implementar

1. **Estratégia de nomes de arquivo:** Manter m1.html/m2.html como exercícios de M1, ou renomear (m1_ex1.html, m1_ex2.html)?
2. **Migração de localStorage:** Aceitar perda de progresso salvo ou implementar migração suave?
3. **Posição dos Intervalos:** Fases iniciais do M2 (recomendado) ou mini-módulo entre M1 e M2?
4. **Áudio real vs síntese:** Manter Web Audio API sintético ou investir em samples de piano real? (fora do escopo atual, mas afeta qualidade percebida)

### O que está fora do escopo atual

- Amostras de áudio reais de piano (WAV/MP3) — substituiria Web Audio API
- TTS real (Google Text-to-Speech, ElevenLabs) — substituiria `window.speechSynthesis`
- Sistema de contas/login/sync entre dispositivos
- Backend de analytics pedagógico (tracking de erros por nota, tempo por fase)
- Modo multiplayer / modo professor
- Suporte a partituras (notação musical)

---

## SEÇÃO 5: CHECKLIST DE UX MÍNIMO

Qualquer módulo deve passar TODOS os itens antes de ser considerado pronto:

### Layout e Responsividade
- [ ] **Portrait 360×800px:** piano visível sem scroll horizontal, teclas com altura mínima 120px
- [ ] **Portrait 390×844px (iPhone):** sem overflow, sem elementos cortados
- [ ] **Landscape 800×360px:** painel e teclado dividindo tela horizontalmente (como m2.html)
- [ ] **Landscape pequeno 568×320px:** conteúdo visível, sem overflow vertical
- [ ] **max-width 960px:** funciona em tablet

### Touch e Acessibilidade
- [ ] **Touch targets:** todas as teclas de piano ≥ 44px de largura; botões de ação ≥ 48px de altura
- [ ] **Sem zoom acidental:** `user-scalable=no` no meta viewport
- [ ] **Feedback imediato ao toque:** visual (cor/animação) em ≤ 100ms
- [ ] **Sem delay de 300ms:** `touch-action: manipulation` em todos os elementos clicáveis

### Áudio
- [ ] **Som funciona:** AudioEngine.init() disparado no primeiro pointerdown
- [ ] **Botão mute:** ícone correto (🔊/🔇) reflete estado atual
- [ ] **TTS funciona:** texto falado correto na fase de apresentação
- [ ] **Sem áudio simultâneo:** release antes de novo highlight/play

### Fluxo Pedagógico
- [ ] **Uma habilidade por tela:** tela de apresentação ensina UMA nota; quiz pede UMA nota por vez
- [ ] **Progressão clara:** criança sabe em qual fase está (dots de progresso visíveis)
- [ ] **Acerto: feedback positivo** em ≤ 200ms (som + animação + texto encorajador)
- [ ] **Erro: sem punição** — animação neutra (shake), texto "Tente de novo!", sem decrementar progresso
- [ ] **Modo Fácil ativo:** dica dourada pulsando na tecla correta
- [ ] **Celebração:** animação ao concluir módulo + som de acorde + TTS de parabéns

### Navegação
- [ ] **Botão voltar:** sempre visível, retorna ao hub correto (m1_hub ou index)
- [ ] **Dots clicáveis:** na fase de apresentação, clicar em dot navega para aquela nota (como m2.html)
- [ ] **Botão next desabilitado** na última fase (sem navegar para fase inexistente)
- [ ] **Progresso salvo:** localStorage atualizado ao concluir módulo

### Consistência Visual
- [ ] **Fundo dark (#111827):** mesmo em m1 e m2
- [ ] **Cores das notas:** Dó=vermelho, Ré=laranja, Mi=amarelo, Fá=verde, Sol=azul, Lá=roxo, Si=rosa
- [ ] **Tema respeitado:** data-theme="dark" aplicado ao html quando usuário ativou tema escuro
- [ ] **Fontes e tamanhos:** usa variáveis do base.css (--sm, --md, --lg, --xl)

---

## RESUMO EXECUTIVO

**5 achados mais críticos:**

1. **m1.html não usa teclado responsivo** — piano de 2 oitavas rola horizontalmente em 360px; teclas abaixo do tamanho mínimo para touch de criança [CRÍTICO]

2. **m1.html não foi migrado para piano-body** — visual completamente diferente de m2.html; duas experiências incoerentes numa mesma jornada pedagógica [ALTO]

3. **Ausência de Modo Fácil em m1.html** — m2.html tem hints dourados pulsando; m1 (que é a primeira experiência da criança com o app) não tem nenhuma dica visual [ALTO]

4. **Estrutura de currículo do index.html lista O Dó Central e As 5 Notas como módulos independentes** quando deveriam ser exercícios dentro de "M1: Conhecendo as Teclas" — confunde a hierarquia pedagógica [ALTO]

5. **Decisão de arquitetura pendente sobre m2.html** — o arquivo atual (5 Notas) colide com o "novo m2.html" que deveria ser Escalas; esta decisão precisa ser tomada antes de implementar qualquer novo módulo [BLOQUEANTE para módulos futuros]
