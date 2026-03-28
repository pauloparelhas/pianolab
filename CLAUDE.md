# PianoLab — Documentação do Projeto

## O que é
Curso de piano interativo para crianças de 7-9 anos. Vanilla HTML/CSS/JS, sem build step, sem npm.
Publicado em: `https://pauloparelhas.github.io/pianolab/`
Repositório: `https://github.com/pauloparelhas/pianolab`
Deploy: push para `main` → GitHub Pages atualiza em ~1 min.

---

## Arquitetura

### Arquivos centrais
| Arquivo | Papel |
|---------|-------|
| `base.js` | Motor central: AudioEngine, createPianoKeyboard, buildChord, noteToMidi, midiToNote, createStaff, cycleFontSize, showHelp, AudioRecognizer (stub), Settings, LockMode, TTS, goTo |
| `base.css` | Design system: cores, tipografia, variáveis CSS |
| `piano.css` | Estilos do teclado de piano — ÚNICO ponto de controle visual do piano |
| `index.html` | Hub do curso — lista de módulos, progresso, navegação |

### Módulos ativos
| Arquivo | Conteúdo |
|---------|----------|
| `m3_acordes.html` | 12 acordes maiores (7 naturais + 5 sustenidos) |
| `m4_campo.html` | 7 campos harmônicos maiores — funções T, SD, D |
| `m5_progressoes.html` | Progressão I–vi–IV–V com inversões e voice leading, 7 tonalidades |

### Módulos retirados temporariamente (redesign pendente)
- `m1_hub.html` — Conhecendo as teclas
- `m2_escalas.html` — 7 escalas maiores
- `demo.html` — Piano livre

---

## Tecnologia

### Áudio
- Web Audio API: osciladores triangle + sine, envelope ADSR
- `AudioEngine.play(noteStr, duration)` — nota única
- `AudioEngine.playChord(notes[], delay, duration)` — acorde com arpejo
- AudioContext inicializado só na primeira interação do usuário (requisito do browser)

### Piano
```javascript
const kb = createPianoKeyboard(container, {
  startNote: 'C4', endNote: 'B5',
  showLabels: true, responsive: true,
  onNoteOn(noteStr) { /* callback */ }
});
// API: kb.highlight(n), kb.release(n), kb.releaseAll(),
//      kb.hint(n), kb.clearHints(),
//      kb.nextHint(n), kb.clearNextHints(),
//      kb.showChord(notes[]), kb.clearHighlights(),
//      kb.getKeyElement(noteStr)
```

### Teoria musical (algoritmos)
```javascript
// MIDI ↔ nota
noteToMidi('C4')  → 60
midiToNote(60)    → 'C4'
transpose('C4', 4) → 'E4'

// Construção de acordes
buildChord('C4', [0,4,7])  → ['C4','E4','G4']  // maior
buildChord('A4', [0,3,7])  → ['A4','C5','E5']  // menor

// Escala maior: intervalos [2,2,1,2,2,2,1]
// Campo harmônico: GRAUS_ST=[0,2,4,5,7,9,11], QUALIDADES=['M','m','m','M','M','m','dim']
// Inversões: root[0,4,7] → 1ª inv[4,7,12] → 2ª inv[7,12,16]
```

---

## Padrões de Design

### Visual
- Tema escuro, fundo `#0d1117` / `#111827`
- Azul principal: `#4FC3F7` (destaques, links, teclas ativas)
- 7 cores de notas: `--nota-do` a `--nota-si` (usadas nas funções harmônicas)
- Funções harmônicas: Tônica `#4FC3F7`, Subdominante `#81C784`, Dominante `#F9A825`

### Fluxo de fases (padrão de todo módulo)
```
Intro → Demo → Play-Along → Livre → Celebração
```
Implementado com `FASES_ORDEM[]` + `irFase(fase)` + `.fase-nav` padronizada.

### Persistência
```javascript
// Cada módulo salva em localStorage:
localStorage.setItem('piano_m3_progresso', JSON.stringify({ acordeIdx, fase, completo }));
localStorage.setItem('piano_m4_progresso', JSON.stringify({ campoIdx, fase, completo }));
localStorage.setItem('piano_m5_progresso', JSON.stringify({ concluidas:[], completo }));
```
`completo: true` desbloqueia o módulo seguinte no index.

### Pentagrama (staff)
```javascript
const staff = createStaff(container); // container = div vazio acima do piano
staff.showNotes([60, 64, 67]);        // Array de MIDI — exibe cabeças de nota
staff.clear();                         // limpa notas
// Clave de sol, C4–B5, linhas suplementares automáticas, acidentes ♯
// CSS em piano.css: .staff-wrap, .staff-line, .staff-clef, .staff-note, .staff-ledger, .staff-acc
```

**REGRA CRÍTICA — Piano fixo C4-B5:**
```javascript
// SEMPRE assim — nunca modificar startNote/endNote
const kb = createPianoKeyboard(container, { startNote:'C4', endNote:'B5', ... });
// Piano criado UMA VEZ ao carregar — nunca recriar ao trocar tonalidade
// Transposição = apenas matemática nos offsets MIDI
```

**REGRA CRÍTICA — Gameplay display-only:**
- Piano virtual mostra o acorde (highlights), criança toca no piano REAL
- Avanço via botão "Próximo →", nunca via detecção de acordes pressionados
- `onNoteOn()` apenas para som individual ao explorar o teclado

### Acessibilidade e ajuda contextual
```javascript
// Cicla tamanho de fonte: 85% → 100% → 120%, persiste em localStorage
cycleFontSize(btnEl);

// Cria/reutiliza #help-modal genérico com conteúdo HTML
showHelp(text);

// Padrão por módulo: objeto HELP_FASES com texto por fase
const HELP_FASES = { intro: '...', demo: '...', play: '...', livre: '...', celebracao: '...' };
// Chamada: showHelp(HELP_FASES[faseAtual])
```

### AudioRecognizer (stub — inativo)
```javascript
// Pitch detection via microfone (FFT/autocorrelação) — comentado em base.js
// Ativar quando necessário: descomentar e chamar AudioRecognizer.start(callback)
// Infra pronta; aguarda decisão de ativação
```

### Piano responsivo
```css
.piano-wrap.responsive { width: 100%; }
.piano.responsive      { width: 100%; }
/* O container pai precisa ter width definida para o responsive funcionar */
.piano-stage #piano-container { width: 100%; display: flex; align-items: center; }
/* Landscape mobile: --key-h clamp(55px,42dvh,180px); digital-panel max-height: 40dvh */
```

---

## Regras de Desenvolvimento

1. **Vanilla only** — sem npm, sem build, sem frameworks
2. **Um arquivo por módulo** — HTML + CSS inline + JS inline, auto-contido
3. **base.js não muda** sem necessidade — é a fundação estável
4. **piano.css é o único ponto** de controle do teclado — não estilizar piano inline
5. **Cores de destaque uniformes**: sempre `#9EEAFF` para teclas ativas (azul claro, pulso brightness) — sem cores por nota no visual, sem box-shadow externo
6. **Commit + push ao final de toda implementação** — o usuário confere direto no site publicado

---

## Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-03 | M1 e M2 removidos do site | Padrão visual/funcional abaixo do alcançado em M3+ |
| 2026-03 | Piano Livre removido | Padrão insatisfatório |
| 2026-03 | Cores por nota removidas dos destaques | Sem função pedagógica, poluição visual |
| 2026-03 | Acordes sustenidos como "extras" no M3 | Não fazem parte da sequência default |
| 2026-03 | Inversão exata obrigatória no M5 | Força o aprendizado do voice leading |
| 2026-03-26 | M5 display-only (sem chord detection) | Crianças 7-9a não conseguem pressionar 3 teclas |
| 2026-03-26 | Piano fixo C4-B5 em todos os módulos | Violação detectada: range dinâmico = piano degradado |
| 2026-03-26 | createStaff() adicionado ao base.js | Pentagrama compartilhado por todos os módulos |
| 2026-03-26 | Topbar unificado; .fase-nav separada eliminada | Consistência visual entre módulos |
| 2026-03-26 | Highlight de tecla: #9EEAFF + brightness | box-shadow externo tampava teclas pretas adjacentes |
| 2026-03-26 | cycleFontSize() e showHelp() em base.js | Acessibilidade e ajuda contextual por fase em todos os módulos |
| 2026-03-26 | AudioRecognizer stub em base.js | Infra de pitch detection pronta; ativação aguarda decisão |
| 2026-03-26 | M5: PROGRESSAO_BASE com 3 inversões + clamping MIDI 60-83 | Voice leading matematicamente correto em todas as tonalidades |

---

## Próximos Passos (roadmap)

1. **Validar M5 ao vivo** — conferir I–vi–IV–V (Raiz/1ª/2ª Inv) em todas as 7 tonalidades
2. **Expandir M5** — adicionar as outras 4 progressões após validação do I–vi–IV–V
3. **Staff com compassos** — 4 notas por compasso com barras automáticas (estrutura ready em base.js)
4. **AudioRecognizer** — ativar pitch detection via microfone quando necessário (stub já em base.js)
5. **Redesign retroativo M1** — Conhecendo as teclas (padrão M3+)
6. **Redesign retroativo M2** — Escalas (padrão M3+, HELP_FASES já implementado)
7. **Redesign Piano Livre** — exploração livre com qualidade
