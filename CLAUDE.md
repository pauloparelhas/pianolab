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
| `base.js` | Motor central: AudioEngine, createPianoKeyboard, buildChord, noteToMidi, midiToNote, Settings, LockMode, TTS, goTo |
| `base.css` | Design system: cores, tipografia, variáveis CSS |
| `piano.css` | Estilos do teclado de piano — ÚNICO ponto de controle visual do piano |
| `index.html` | Hub do curso — lista de módulos, progresso, navegação |

### Módulos ativos
| Arquivo | Conteúdo |
|---------|----------|
| `m3_acordes.html` | 12 acordes maiores (7 naturais + 5 sustenidos) |
| `m4_campo.html` | 7 campos harmônicos maiores — funções T, SD, D |
| `m5_progressoes.html` | 5 progressões com inversões e voice leading *(em desenvolvimento)* |

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

### Piano responsivo
```css
.piano-wrap.responsive { width: 100%; }
.piano.responsive      { width: 100%; }
/* O container pai precisa ter width definida para o responsive funcionar */
.piano-stage #piano-container { width: 100%; display: flex; align-items: center; }
```

---

## Regras de Desenvolvimento

1. **Vanilla only** — sem npm, sem build, sem frameworks
2. **Um arquivo por módulo** — HTML + CSS inline + JS inline, auto-contido
3. **base.js não muda** sem necessidade — é a fundação estável
4. **piano.css é o único ponto** de controle do teclado — não estilizar piano inline
5. **Cores de destaque uniformes**: sempre `#4FC3F7` para teclas ativas — sem cores por nota no visual
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

---

## Próximos Passos (roadmap)

1. **M5 Progressões** *(em desenvolvimento)* — inversões + voice leading + 5 progressões × 7 tonalidades
2. **Redesign retroativo M1** — Conhecendo as teclas (padrão M3+)
3. **Redesign retroativo M2** — Escalas (padrão M3+)
4. **Redesign Piano Livre** — exploração livre com qualidade
