# CLAUDE.md — [NOME_DO_PROJETO]
## Aplicativo de Ensino de Piano — Criança de 7–9 Anos
**Versão:** 1.0 | [DATA_DE_INÍCIO]

---

## PROTOCOLO DE TRABALHO — INVIOLÁVEL

**ANTES de implementar qualquer coisa: analisar → propor → aguardar aprovação → só então executar.**

O usuário decide. Claude propõe e executa quando autorizado. Nunca assumir aprovação implícita.

Isso se aplica a: criar arquivos, instalar dependências, alterar stack, criar contas em serviços externos, qualquer ação irreversível.

---

## CONTEXTO DO PROJETO

**Projeto:** [NOME_DO_PROJETO] — Curso interativo de piano
**Público:** Filha de 7–9 anos, celular/tablet com supervisão do pai
**Objetivo:** Ensinar piano de forma progressiva, visual e interativa — do nome das notas ao campo harmônico
**Currículo:**
1. Notas (nome + posição no teclado)
2. Escalas (maior, menor)
3. Intervalos
4. Acordes e cifras
5. Campo harmônico
6. Progressões e padrões
7. Transposição (adaptação matemática de tom)
8. Frases musicais e leitura de partitura

**Princípios pedagógicos para 7–9 anos:**
- Já sabe ler — texto curto é aceitável, mas nunca substituir imagem/som
- Progressão clara e explícita: a criança sabe em qual fase está
- Uma habilidade por sessão — não sobrepor conteúdo novo
- Repetição espaçada: reforçar no dia seguinte, na semana, no mês
- Gamificação leve: estrelas, fases desbloqueadas, conquistas — sem ranking ou comparação
- Errar não é ruim — animação de "tente de novo" SEM penalização
- Feedback imediato e positivo ao acertar (som + animação + elogio)
- Sem timer em exercícios de aprendizado; timer OPCIONAL em desafios avançados

---

## MODO PLANEJAMENTO — ATIVAR AO INICIAR SESSÃO NOVA

Na primeira mensagem de cada sessão, Claude DEVE:
1. Invocar `Agent(subagent_type="gerente")` para retomar contexto
2. Apresentar: o que foi feito, o que está pendente, sugestão de próxima ação
3. Aguardar aprovação antes de implementar qualquer coisa

---

## AGENTES OBRIGATÓRIOS

Os agentes ficam em `.claude/agents/`. São invocados com `Agent(subagent_type="nome")`.

| Momento | Agente | O que faz |
|---|---|---|
| Início de sessão | `gerente` | Retoma contexto via memory/, lista tarefas pendentes, coordena |
| Antes de codar (teoria musical) | `teoria` | Traduz lógica musical em matemática (MIDI, semitons, fórmulas de acordes, transposição) |
| Antes de codar (UX/pedagogia) | `pedagogico` | Valida design para 7–9 anos, valida progressão musical |
| Antes de declarar pronto | `ti` | DOM trace, mental render 360px, checklist completo |
| Após entregar | `arquivista` | Atualiza memory/, verifica documentação |

**NUNCA declarar módulo como "pronto" sem rodar o agente `ti` antes.**
**NUNCA começar a codar sem rodar o agente `pedagogico` antes.**
**NUNCA implementar lógica musical (acordes, intervalos, transposição, campo harmônico) sem rodar o agente `teoria` antes.**

### Definição dos agentes

#### `.claude/agents/gerente.md`
```markdown
---
name: gerente
description: Coordena sessão do projeto [NOME_DO_PROJETO], retoma contexto, prioriza backlog de módulos musicais
---

Você é o gerente do projeto. Ao ser invocado:
1. Leia memory/project_status.md (fonte de verdade do estado atual)
2. Leia memory/MEMORY.md (índice de memórias)
3. Liste o que foi concluído, o que está em andamento, o que está pendente
4. Sugira a próxima ação com justificativa pedagógica
5. Pergunte ao usuário se concorda antes de prosseguir

Nunca inicie implementação. Apenas coordene e proponha.
```

#### `.claude/agents/pedagogico.md`
```markdown
---
name: pedagogico
description: Valida design pedagógico para criança de 7–9 anos antes de implementar qualquer módulo musical
---

Você é o especialista em pedagogia musical para crianças de 7–9 anos. Ao ser invocado com a descrição de um módulo:
1. Avalie se a proposta respeita a faixa etária
2. Verifique se a progressão musical está correta (pré-requisitos satisfeitos?)
3. Confirme que há apenas UMA habilidade por tela
4. Verifique se o feedback é positivo e imediato
5. Aponte riscos de frustração ou sobrecarga cognitiva
6. Sugira ajustes antes da implementação

Nunca implemente. Apenas valide e sugira.
```

#### `.claude/agents/ti.md`
```markdown
---
name: ti
description: Auditoria técnica completa de módulos do [NOME_DO_PROJETO] antes de declarar pronto
---

Você é o engenheiro de QA. Ao ser invocado com o código de um módulo:
1. Faça DOM trace: leia o HTML estático, depois o JS que modifica o DOM
2. Mental render em 360px: posição e tamanho de cada elemento
3. Verifique touch targets (mínimo 80px)
4. Verifique user flow: criança vê → quer tocar → acerta/erra → o que acontece?
5. Execute o checklist pré-entrega completo (ver seção CHECKLIST)
6. Reporte cada item com PASS/FAIL e linha de código responsável

Nunca declare pronto se qualquer item do checklist falhar.
```

#### `.claude/agents/teoria.md`
```markdown
---
name: teoria
description: Traduz lógica musical em linguagem matemática precisa. Valida construção de acordes, intervalos, transposição e progressões antes de qualquer implementação musical no PianoLab.
---

Especialista em teoria musical com linguagem matemática.
Converte qualquer lógica musical em fórmulas de semitons / MIDI numbers.
Valida que o código cobre os edge cases (range do teclado, enarmonia, oitavas).
Nunca implementa código — apenas valida a matemática e documenta o modelo.
```

#### `.claude/agents/arquivista.md`
```markdown
---
name: arquivista
description: Atualiza documentação e memória do projeto após cada entrega de módulo
---

Você é o arquivista. Após cada entrega:
1. Atualize memory/project_status.md com o novo status do módulo
2. Atualize memory/MEMORY.md se houver novo padrão ou decisão
3. Atualize memory/PADRAO.md se um novo padrão ou anti-padrão foi descoberto
4. Verifique se CLAUDE.md reflete o estado atual
5. Reporte o que foi atualizado e o que ficou pendente

Se detectar documentação desatualizada, ALERTE antes de prosseguir.
```

---

## GESTÃO DE CONTEXTO E AUTONOMIA DO CLAUDE CODE

### Níveis de autonomia — ativar conforme necessidade

**Nível 1 — Eliminar prompts de permissão (ativar desde o início)**
```bash
claude --dangerously-skip-permissions
```
Use em desenvolvimento local. Claude não pergunta "posso editar este arquivo?" a cada 30 segundos.
> Atenção: nunca usar em produção ou com acesso a dados sensíveis.

**Nível 2 — Gestão do contexto (ativar desde o início)**
- Use `/clear` entre tarefas independentes (evita contaminação de contexto)
- Use `/compact` quando o contexto atingir 60% — não espere 90% (o modelo já começa a esquecer instruções)
- Regra: uma tarefa por contexto sempre que possível

**Nível 3 — Subagentes (ativar quando sessões ultrapassarem 30min)**
- Builds, testes e git rodam em contextos separados via `Agent()`
- O contexto principal nunca acumula output de builds ou testes
- Permite sessões de 2h+ sem intervenção

**Nível 4 — Loop autônomo com Stop hook (ativar para tarefas longas)**

Crie o arquivo `.claude/hooks/stop.sh`:
```bash
#!/bin/bash
# Stop hook: bloqueia a saída e reinicia com o mesmo prompt
echo "Tarefa não concluída. Retomando..." >&2
exit 1  # exit 1 = bloqueia a saída do Claude
```

Configure em `.claude/settings.json`:
```json
{
  "hooks": {
    "Stop": [{ "matcher": "", "hooks": [{"type": "command", "command": "bash .claude/hooks/stop.sh"}] }]
  }
}
```
> Claude trabalha → tenta sair → hook bloqueia → recomeça vendo arquivos modificados e histórico git.

**Nível 5 — AutoResearch / Eval loops (backlog — para experimentos futuros)**
- Defina uma métrica (ex: % de acertos na fase X)
- Claude executa → mede → analisa falhas → melhora → repete
- Útil para otimizar progressão pedagógica com dados reais de uso

**Nível 6 — VPS + 24/7 (backlog — quando o projeto escalar)**
- Rode Claude Code em VPS dentro de `tmux`
- Feche o laptop sem matar a sessão
- OpenClaw: gateway persistente conectando Claude a git, email, calendários

---

## FERRAMENTAS DE GESTÃO E PRODUTIVIDADE

### GitHub Issues/Projects (usar desde o início)

**Por quê:** integrado ao `gh` CLI, zero tokens extras, Claude acessa diretamente.

**Setup inicial:**
```bash
gh repo create [nome-do-projeto] --private
gh label create pedagogia --color "#7B61FF"
gh label create qa --color "#F9A825"
gh label create backlog --color "#AAAAAA"
```

**Fluxo de trabalho:**
- Bug encontrado → `gh issue create --label bug`
- Feature nova → `gh issue create --label feature`
- Módulo concluído → fechar issue + criar milestone para o próximo
- Claude consulta issues abertas no início de cada sessão via gerente

**Milestones sugeridos:**
1. `v0.1` — Piano interativo + Notas
2. `v0.2` — Escalas + Intervalos
3. `v0.3` — Acordes + Cifras
4. `v0.4` — Campo harmônico + Progressões
5. `v1.0` — Transposição + Leitura de partitura

### Paperclip.ing (avaliar antes de usar)

**O que é:** Kanban visual integrado ao Claude Code.

**Status:** Verificar se possui API ou webhook compatível antes de adotar.
- Se tiver conector: configurar como fonte de tarefas para o agente `gerente`
- Se não tiver: usar GitHub Projects como alternativa completa

**Fallback garantido:** GitHub Projects (kanban nativo, gratuito, integrado).

### NotebookLM — Google (usar para teoria musical)

**Por quê:** Gratuito, processa PDFs longos sem consumir tokens da API do Claude.

**Fluxo recomendado:**
```
PDF de teoria musical (ex: "Teoria da Música" - Koellreutter)
       ↓
  NotebookLM (upload + geração de resumo/podcast)
       ↓
  Copiar resumo → memory/teoria_musical.md
       ↓
  Claude lê memory/ no início da sessão (contexto sem custo de reprocessamento)
```

**Casos de uso:**
- Processar método Suzuki, livros de harmonia, apostilas de conservatório
- Gerar glossário de termos musicais para alimentar o TTS do app
- Criar progressão pedagógica baseada em método validado

---

## STACK TECNOLÓGICA — PROGRESSÃO

### Regra: não pular fase sem necessidade real demonstrada.

### Fase 1 — HTML + CSS + JS puro (começar aqui)

**Quando usar:** do início até o produto ter usuários reais e necessidade de conta/nuvem.

**Vantagens:**
- Zero configuração — abrir no Chrome direto
- Funciona offline no tablet
- Claude Code edita e você vê o resultado imediatamente
- Sem Node, sem build, sem deploy

**Limitações (aceitáveis na Fase 1):**
- Progresso salvo em `localStorage` (sem backup na nuvem)
- Sem login/conta de usuário
- Sem sync entre dispositivos

**Web Audio API** — síntese de notas de piano sem dependência externa:
```javascript
const ctx = new AudioContext();
function tocarNota(frequencia, duracao = 0.5) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = frequencia;
  osc.type = 'triangle'; // mais parecido com piano que 'sine'
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao);
  osc.start(); osc.stop(ctx.currentTime + duracao);
}
// Frequências: Dó4=261.63, Ré4=293.66, Mi4=329.63, Fá4=349.23...
```

### Fase 2 — React + Vite (quando a Fase 1 ficar complexa)

**Quando migrar:** quando o código de um módulo ultrapassar 600 linhas OU quando precisar de componentes reutilizáveis em múltiplos módulos.

**Vantagens:**
- Componentes: `<Piano />`, `<Partitura />`, `<Exercicio />` são peças separadas
- Ecossistema: bibliotecas de piano (react-piano), partitura (VexFlow, ABC.js)
- Deploy gratuito na Vercel ou Netlify

**Setup:**
```bash
npm create vite@latest [nome-do-projeto] -- --template react
cd [nome-do-projeto] && npm install
```

### Fase 3 — Next.js (quando precisar de nuvem)

**Quando migrar:** quando precisar de progresso salvo na nuvem, login da filha, histórico de desempenho.

**Vantagens:**
- Frontend + backend no mesmo projeto
- Banco de dados (PostgreSQL via Prisma ou Supabase gratuito)
- Autenticação simples (NextAuth)
- Deploy na Vercel (plano gratuito cobre o início)

---

## ARQUITETURA DO PROJETO (Fase 1)

```
[nome-do-projeto]/
├── CLAUDE.md                    ← este arquivo
├── index.html                   ← hub de navegação (lista de módulos)
├── base.css                     ← design system compartilhado
├── base.js                      ← sistema central (áudio, tema, nav, lock, TTS)
├── memory/
│   ├── MEMORY.md                ← índice de memórias
│   ├── project_status.md        ← status e backlog (fonte de verdade)
│   ├── PADRAO.md                ← padrões e anti-padrões descobertos
│   └── teoria_musical.md        ← resumos do NotebookLM (opcional)
├── .claude/
│   ├── settings.json            ← permissões e hooks
│   └── agents/
│       ├── gerente.md
│       ├── pedagogico.md
│       ├── ti.md
│       └── arquivista.md
├── notas.html                   ← Módulo 1: nome e posição das notas
├── escalas.html                 ← Módulo 2: escalas maior e menor
├── intervalos.html              ← Módulo 3: intervalos
├── acordes.html                 ← Módulo 4: acordes e cifras
├── harmonia.html                ← Módulo 5: campo harmônico
├── progressoes.html             ← Módulo 6: progressões e padrões
└── transposicao.html            ← Módulo 7: mudança de tom
```

**Regras de arquitetura:**
- Um arquivo `.html` por módulo — contém hub + TODOS os jogos do módulo
- Novo jogo = nova tela (div) dentro do mesmo arquivo, não novo arquivo
- `base.css` e `base.js` importados por todos os módulos
- Componente `<piano-keyboard>` reutilizável (definido em `base.js`)

---

## SISTEMA DE DESIGN

```css
/* Paleta — 7 notas = 7 cores (associação visual permanente) */
--nota-do:    #E53935;  /* vermelho */
--nota-re:    #FB8C00;  /* laranja */
--nota-mi:    #F9A825;  /* amarelo */
--nota-fa:    #43A047;  /* verde */
--nota-sol:   #1E88E5;  /* azul */
--nota-la:    #8E24AA;  /* roxo */
--nota-si:    #E91E63;  /* rosa */
--nota-sustenido: #37474F; /* tecla preta */

/* Tipografia */
--sm:  calc(1.2rem * var(--fs));
--md:  calc(1.55rem * var(--fs));
--lg:  calc(2.1rem * var(--fs));
--xl:  calc(2.7rem * var(--fs));
--2xl: calc(3.4rem * var(--fs));

/* Componentes — tudo ≥ 80px para touch */
--btn-h:   80px;
--key-w:   44px;   /* tecla branca do piano */
--key-h:   160px;  /* altura do teclado */
--rad:     18px;
--radlg:   26px;
```

**Teclado de piano (touch):**
- Teclas brancas: `--key-w` × `--key-h`, borda arredondada na base
- Teclas pretas: 60% da largura, 60% da altura, sobrepostas
- Nota ativa: cor da paleta acima + escala 1.05 + sombra
- Nota correta: animação pulse verde
- Nota errada: animação shake leve (sem som de erro, sem vermelho agressivo)

**localStorage:**
| Chave | Valores | Descrição |
|-------|---------|-----------|
| piano-theme | 'light'/'dark' | Tema |
| piano-font | 0.7–1.5 | Escala de fonte |
| piano-lang | 'pt'/'en' | Idioma |
| piano-sound | 'on'/'off' | Som |
| piano-volume | 0–1 | Volume |
| {modulo}_progresso | JSON | Progresso por módulo |

---

## PROTOCOLO QA OBRIGATÓRIO

### Passo 1 — INTENT
- QUEM usa? (criança sozinha? com supervisão?)
- O QUE deve acontecer em cada interação?
- A criança de 7–9 anos vai entender SEM instrução verbal?

### Passo 2 — DOM TRACE
1. Ler HTML estático
2. Ler JS que gera/modifica o DOM
3. Identificar relação pai-filho REAL
4. SÓ ENTÃO definir CSS

**Regra:** NUNCA mexer em CSS sem verificar qual JS gera o DOM.

### Passo 3 — MENTAL RENDER em 360px
- Teclado de piano: cabe na tela? Teclas são tocáveis (≥ touch area 44px por tecla)?
- Texto: legível? Não cortado?
- Botões de navegação: ≥ 80px?
- Tudo visível sem scroll durante o exercício?

### Passo 4 — USER FLOW
- "Criança vê a tela → o que chama atenção primeiro? → ela quer tocar? → o que acontece?"
- "Criança erra → animação de incentivo? → sem som de fracasso?"
- "Criança acerta → celebração? → ela quer continuar?"
- "Fase concluída → desbloqueou algo novo? → ficou animada?"

---

## CHECKLIST PRÉ-ENTREGA

- [ ] Uma única habilidade por tela
- [ ] Todo alvo de toque ≥ 80px (navbar, botões de resposta)
- [ ] Teclas do piano: área de toque adequada para dedos de criança
- [ ] Sem texto de instrução longa — visual + áudio sempre que possível
- [ ] Feedback positivo imediato ao acerto (som correto + animação + elogio)
- [ ] Feedback neutro ao erro — SEM som de fracasso, SEM X vermelho agressivo
- [ ] Ciclo curto: máximo 5–7 interações por rodada, então celebração
- [ ] Sem timer em exercícios de aprendizado
- [ ] Randomização: nova rodada = sequência diferente
- [ ] Modal de confirmação para sair (não para a criança)
- [ ] Lock mode implementado (fullscreen + bloqueio de navegação)
- [ ] TTS fala o nome da nota/acorde no idioma ativo
- [ ] Som toggle funcional (persiste em localStorage)
- [ ] Tudo visível em 360px — sem scroll durante exercício
- [ ] `goToIndex()` aponta para `index.html`
- [ ] localStorage key única: `piano_{modulo}_progresso`
- [ ] Celebração após completar todas as fases do módulo
- [ ] Progressão desbloqueada visivelmente após conclusão
- [ ] Layout mobile-first testado mentalmente em 360px

---

## REGRA CRÍTICA — ARQUIVOS GRANDES E AGENTES

**NUNCA delegar a escrita de arquivo HTML/JS completo para um agente.**

Agentes têm limite de output. Arquivos de módulos têm 300–800 linhas. Um agente trunca silenciosamente.

**Regra inviolável:**
- Arquivos com mais de 300 linhas: escrever do contexto principal (Write tool), em partes
- Agentes só revisam/validam — nunca escrevem
- Salvar após cada parte completada
- Commit após cada mudança funcional

**Granularidade obrigatória:**
1. Estrutura HTML (cabeçalho, navbar, containers)
2. CSS (variáveis, layout, telas)
3. JS — dados e inicialização (notas, frequências, fases)
4. JS — lógica do módulo (regras do exercício)
5. JS — feedback e animações
6. Teste mental QA
7. Commit

Perguntar ao usuário após cada parte antes de continuar.

---

## REGRA DE DOCUMENTAÇÃO — INVIOLÁVEL

**Documentação desatualizada é INACEITÁVEL.**

**Quando atualizar (ANTES de encerrar qualquer entrega):**
- Após cada commit que altera estado de módulos
- Após corrigir bug causado por padrão errado
- Após implementar feature que vira padrão
- Antes de passar para o próximo módulo
- Ao final de TODA sessão

**O que atualizar:**
1. `memory/project_status.md` — tabela de módulos (fonte de verdade)
2. `memory/MEMORY.md` — índice + tabela resumo
3. Este `CLAUDE.md` — seção ESTADO ATUAL
4. `memory/PADRAO.md` — novo padrão ou anti-padrão

---

## ESTADO ATUAL DO PROJETO (atualizar a cada commit)

**Última atualização:** [DATA]

| Módulo | Arquivo | Jogos/Exercícios | Status |
|---|---|---|---|
| Notas | notas.html | — | Não iniciado |
| Escalas | escalas.html | — | Não iniciado |
| Intervalos | intervalos.html | — | Não iniciado |
| Acordes | acordes.html | — | Não iniciado |
| Harmonia | harmonia.html | — | Não iniciado |
| Progressões | progressoes.html | — | Não iniciado |
| Transposição | transposicao.html | — | Não iniciado |

**Shared:** `base.css` + `base.js` (design system + áudio + nav)
**Hub:** `index.html` (navegação entre módulos)

---

## O QUE NÃO FAZER

- NÃO entregar rápido e errado — melhor demorar e acertar
- NÃO tratar sintoma CSS sem investigar causa raiz no JS/DOM
- NÃO usar agente de revisão com prompt vago
- NÃO delegar escrita de arquivo >300 linhas para agente
- NÃO colocar timer em exercícios de aprendizado inicial
- NÃO usar som de fracasso ou animação punitiva para erro
- NÃO sobrepor dois conteúdos novos na mesma tela
- NÃO fazer tela com scroll — tudo deve caber em 360px
- NÃO reduzir botões abaixo de 80px
- NÃO começar a codar sem rodar agente `pedagogico`
- NÃO declarar pronto sem rodar agente `ti`
- NÃO encerrar sessão com documentação desatualizada
- NÃO assumir que documentação de sessões anteriores está correta — verificar antes de usar
- NÃO pular fase da stack sem necessidade real demonstrada
- NÃO adotar ferramenta externa sem verificar API/conector antes

---

## BACKLOG FUTURO

### Módulos pendentes (após Fase 1 completa)
- Leitura de partitura (ABC.js ou VexFlow)
- Ditado rítmico
- Reconhecimento de acorde por ouvido

### Melhorias técnicas
- Web MIDI API: conectar teclado físico (enhancement, não requisito)
- Soundfont: amostras reais de piano no lugar da síntese Web Audio
- PWA (Progressive Web App): instalar no tablet como app nativo

### Integrações futuras
- Paperclip.ing: avaliar API/webhook quando o projeto tiver repositório público
- Sync de progresso na nuvem (Fase 3 — Next.js + Supabase)

---

## REFERÊNCIAS TÉCNICAS

**Web Audio API — frequências das notas (oitava 4):**
| Nota | Hz | Nota | Hz |
|------|----|------|----|
| Dó (C4) | 261.63 | Sol (G4) | 392.00 |
| Ré (D4) | 293.66 | Lá (A4) | 440.00 |
| Mi (E4) | 329.63 | Si (B4) | 493.88 |
| Fá (F4) | 349.23 | Dó (C5) | 523.25 |

**Fórmula para oitava N:** `frequencia = freq_oitava4 × 2^(N-4)`

**Fórmula para semitom acima:** `freq × 2^(1/12)` ≈ `freq × 1.05946`

**Campo harmônico maior (graus):** I ii iii IV V vi vii°

---

*Baseado nas boas práticas do projeto Mafinho Explora (2026) e adaptado para ensino de piano a crianças de 7–9 anos.*
