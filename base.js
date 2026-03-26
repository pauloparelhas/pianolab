/* =============================================================
   PianoLab — base.js
   Motor central: áudio, teclado piano, settings, nav, TTS
   ============================================================= */

'use strict';

/* ── 1. AUDIO ENGINE ──────────────────────────────────────── */

const AudioEngine = (() => {
  let ctx = null;

  // Frequências base — oitava 4 (MIDI 60 = C4)
  const FREQ_BASE = {
    C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13,
    E: 329.63, F: 349.23, 'F#': 369.99, G: 392.00,
    'G#': 415.30, A: 440.00, 'A#': 466.16, B: 493.88
  };

  // Calcula frequência de qualquer nota em qualquer oitava
  // Ex: freq('C', 4) = 261.63 | freq('G', 5) = 784.00
  function freq(note, octave = 4) {
    const base = FREQ_BASE[note];
    if (!base) return null;
    return base * Math.pow(2, octave - 4);
  }

  // Inicializa AudioContext na primeira interação do usuário
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  }

  // Toca nota individual com envelope ADSR simples
  // note: 'C4', 'F#5', etc. | duration em segundos
  function play(noteStr, duration = 0.6) {
    if (!Settings.getSoundOn()) return;
    init();

    const match = noteStr.match(/^([A-G]#?)(\d)$/);
    if (!match) return;
    const [, note, oct] = match;
    const hz = freq(note, parseInt(oct));
    if (!hz) return;

    const vol = Settings.getVolume();
    const now = ctx.currentTime;

    // Osciladores encadeados para timbre mais rico (piano sintético)
    const osc1 = ctx.createOscillator(); // fundamental
    const osc2 = ctx.createOscillator(); // 2ª harmônica (oitava)
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.value = hz;
    osc2.type = 'sine';
    osc2.frequency.value = hz * 2;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    // Envelope: attack rápido → decay → sustain → release
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.35, now + 0.012);  // attack
    gain.gain.exponentialRampToValueAtTime(vol * 0.18, now + 0.1); // decay
    gain.gain.setValueAtTime(vol * 0.18, now + duration - 0.08);   // sustain
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);  // release

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // Toca acorde: array de noteStr, com delay em ms entre cada nota (arpejo)
  // delay=0 → simultâneo | delay=80 → arpejo rápido
  function playChord(notes, arpeggioDelay = 80, duration = 1.5) {
    notes.forEach((n, i) => {
      setTimeout(() => play(n, duration), i * arpeggioDelay);
    });
  }

  return { play, playChord, init };
})();

/* ── 2. MAPEAMENTO MUSICAL ────────────────────────────────── */

// Escala cromática — índice = número de semitons acima de C
const CROMÁTICA = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// Converte noteStr ('C4') → MIDI number (60)
function noteToMidi(noteStr) {
  const m = noteStr.match(/^([A-G]#?)(\d)$/);
  if (!m) return null;
  const idx = CROMÁTICA.indexOf(m[1]);
  return idx + (parseInt(m[2]) + 1) * 12;
}

// Converte MIDI number → noteStr ('C4')
function midiToNote(midi) {
  const oct = Math.floor(midi / 12) - 1;
  const note = CROMÁTICA[midi % 12];
  return note + oct;
}

// Transpõe noteStr n semitons (positivo = sobe, negativo = desce)
function transpose(noteStr, semitones) {
  const midi = noteToMidi(noteStr);
  if (midi === null) return null;
  return midiToNote(midi + semitones);
}

// Constrói acorde a partir de fórmula intervalar
// root: 'C4' | intervals: [0,4,7] (maior) | [0,3,7] (menor)
function buildChord(root, intervals) {
  const midi = noteToMidi(root);
  return intervals.map(i => midiToNote(midi + i));
}

// Fórmulas de acordes comuns (em semitons acima da tônica)
const FORMULAS = {
  maior:     [0, 4, 7],
  menor:     [0, 3, 7],
  dim:       [0, 3, 6],
  aug:       [0, 4, 8],
  maior7:    [0, 4, 7, 11],
  menor7:    [0, 3, 7, 10],
  dom7:      [0, 4, 7, 10],
  sus2:      [0, 2, 7],
  sus4:      [0, 5, 7],
};

// Mapa nota → classe CSS de cor (associação permanente)
const NOTA_COR = {
  C: 'nota-do', D: 'nota-re', E: 'nota-mi', F: 'nota-fa',
  G: 'nota-sol', A: 'nota-la', B: 'nota-si'
};

function noteCssClass(noteStr) {
  const note = noteStr.replace(/[#\d]/g, '').trim();
  return NOTA_COR[note] || '';
}

/* ── 3. PIANO KEYBOARD COMPONENT ─────────────────────────── */

// Configuração de uma oitava: quais posições têm tecla preta
const OITAVA_LAYOUT = [
  { note: 'C',  black: false },
  { note: 'C#', black: true  },
  { note: 'D',  black: false },
  { note: 'D#', black: true  },
  { note: 'E',  black: false },
  { note: 'F',  black: false },
  { note: 'F#', black: true  },
  { note: 'G',  black: false },
  { note: 'G#', black: true  },
  { note: 'A',  black: false },
  { note: 'A#', black: true  },
  { note: 'B',  black: false },
];

// Gera elemento de teclado de piano
// container: elemento DOM onde inserir
// options: {
//   startNote, endNote, showLabels, onNoteOn, onNoteOff,
//   responsive: bool  — usa larguras percentuais (preenche container)
//   pressColor: '#hex' — cor uniforme ao pressionar (override por-nota)
//   labelMap: { 'C4':'Dó', 'D4':'Ré', ... } — texto dos labels por tecla
// }
function createPianoKeyboard(container, options = {}) {
  const {
    startNote  = 'C4',
    endNote    = 'B5',
    showLabels = true,
    onNoteOn   = null,
    onNoteOff  = null,
    responsive = false,
    pressColor = null,
    labelMap   = null,
  } = options;

  const startMidi = noteToMidi(startNote);
  const endMidi   = noteToMidi(endNote);

  const wrap = document.createElement('div');
  wrap.className = 'piano-wrap' + (responsive ? ' responsive' : '');
  const piano = document.createElement('div');
  piano.className = 'piano' + (responsive ? ' responsive' : '');
  wrap.appendChild(piano);

  const keys = {}; // midi → element

  // Conta teclas brancas no range (para percentuais)
  let numWhiteKeys = 0;
  for (let m = startMidi; m <= endMidi; m++) {
    if (!midiToNote(m).includes('#')) numWhiteKeys++;
  }

  // Dimensões — fixas (px) ou responsivas (%)
  const keyWidth   = 44;   // px — var(--key-w), usado no modo não-responsivo
  const blackWidth = 28;   // px — var(--key-bk-w)
  const keyWidthPct   = responsive ? (100 / numWhiteKeys) : null;
  const blackWidthPct = responsive ? (keyWidthPct * 0.636) : null;

  // Posição horizontal das teclas brancas
  let whiteIndex = 0;

  // Primeiro passo: criar teclas brancas (posicionamento normal)
  for (let midi = startMidi; midi <= endMidi; midi++) {
    const noteStr = midiToNote(midi);
    const noteName = noteStr.replace(/\d/, '');
    const isBlack = noteName.includes('#');
    if (isBlack) continue;

    const key = document.createElement('div');
    key.className = 'key ' + noteCssClass(noteStr);
    key.dataset.midi = midi;
    key.dataset.note = noteStr;

    if (responsive) key.style.width = keyWidthPct + '%';
    if (pressColor)  key.style.setProperty('--key-active-color', pressColor);

    if (showLabels) {
      const label = document.createElement('span');
      label.className = 'key__label';
      if (labelMap) {
        label.textContent = labelMap[noteStr] || '';
      } else {
        label.textContent = noteName === 'C' ? noteStr : '';
      }
      key.appendChild(label);
    }

    attachKeyEvents(key, midi, noteStr);
    piano.appendChild(key);
    keys[midi] = key;
    whiteIndex++;
  }

  // Segundo passo: criar teclas pretas (posicionadas com absolute)
  // Precisamos calcular a posição X de cada tecla preta
  let whitePos = 0;
  for (let midi = startMidi; midi <= endMidi; midi++) {
    const noteStr = midiToNote(midi);
    const noteName = noteStr.replace(/\d/, '');
    const isBlack = noteName.includes('#');

    if (!isBlack) {
      whitePos++;
      continue;
    }

    const key = document.createElement('div');
    // Modo responsivo: remove o translateX(-50%) do CSS base via classe
    key.className = 'key key--black' + (responsive ? ' responsive' : '');
    key.dataset.midi = midi;
    key.dataset.note = noteStr;

    if (responsive) {
      // Posição percentual já centra a tecla — sem translateX(-50%)
      key.style.width = blackWidthPct + '%';
      key.style.left  = (whitePos * keyWidthPct - blackWidthPct / 2) + '%';
    } else {
      key.style.left  = (whitePos * keyWidth - blackWidth / 2) + 'px';
    }
    if (pressColor) key.style.setProperty('--key-active-color', pressColor);

    attachKeyEvents(key, midi, noteStr);
    piano.appendChild(key);
    keys[midi] = key;
  }

  container.appendChild(wrap);

  function attachKeyEvents(key, midi, noteStr) {
    const down = (e) => {
      e.preventDefault();
      AudioEngine.play(noteStr);
      key.classList.add('pressed');
      if (onNoteOn) onNoteOn(noteStr, midi);
    };
    const up = (e) => {
      e.preventDefault();
      key.classList.remove('pressed');
      if (onNoteOff) onNoteOff(noteStr, midi);
    };

    key.addEventListener('pointerdown', down);
    key.addEventListener('pointerup', up);
    key.addEventListener('pointerleave', up);
    key.addEventListener('pointercancel', up);
  }

  // API pública do teclado
  return {
    // Acende tecla(s) com cor da nota
    highlight(noteStr) {
      const midi = noteToMidi(noteStr);
      const key = keys[midi];
      if (!key) return;
      key.classList.add('active');
    },

    // Apaga tecla(s)
    release(noteStr) {
      const midi = noteToMidi(noteStr);
      const key = keys[midi];
      if (!key) return;
      key.classList.remove('active', 'pressed');
    },

    // Apaga todas as teclas ativas
    releaseAll() {
      Object.values(keys).forEach(k => k.classList.remove('active', 'pressed'));
    },

    // Adiciona dica visual de modo fácil (borda dourada pulsando)
    hint(noteStr) {
      const midi = noteToMidi(noteStr);
      const key = keys[midi];
      if (!key) return;
      key.classList.add('easy-hint');
    },

    // Remove todas as dicas de modo fácil
    clearHints() {
      Object.values(keys).forEach(k => k.classList.remove('easy-hint'));
    },

    // Destaca acorde: apaga anterior, acende novas teclas
    showChord(notes) {
      this.releaseAll();
      notes.forEach(n => this.highlight(n));
    },

    // Apaga todos os destaques (alias de releaseAll para compatibilidade)
    clearHighlights() {
      Object.values(keys).forEach(k => k.classList.remove('active', 'pressed'));
    },

    // Dica discreta: outline suave SEM mudar background (modo livre)
    nextHint(noteStr) {
      this.clearNextHints();
      const midi = noteToMidi(noteStr);
      const key = keys[midi];
      if (key) key.classList.add('next-hint');
    },

    // Remove todas as dicas discretas
    clearNextHints() {
      Object.values(keys).forEach(k => k.classList.remove('next-hint'));
    },

    // Retorna o elemento DOM da tecla
    getKeyElement(noteStr) {
      const midi = noteToMidi(noteStr);
      return keys[midi] || null;
    },

    element: wrap,
  };
}

/* ── 4. SETTINGS ──────────────────────────────────────────── */

const Settings = (() => {
  const get = (key, def) => {
    const v = localStorage.getItem('piano-' + key);
    return v !== null ? v : def;
  };
  const set = (key, val) => localStorage.setItem('piano-' + key, val);

  return {
    getTheme:    () => get('theme', 'light'),
    setTheme:    (v) => { set('theme', v); document.documentElement.dataset.theme = v; },
    getFontScale:() => parseFloat(get('font', '1')),
    setFontScale:(v) => { set('font', v); document.documentElement.style.setProperty('--fs', v); },
    getSoundOn:  () => get('sound', 'on') === 'on',
    setSoundOn:  (v) => set('sound', v ? 'on' : 'off'),
    getVolume:   () => parseFloat(get('volume', '0.6')),
    setVolume:   (v) => set('volume', v),
    getLang:     () => get('lang', 'pt'),
    setLang:     (v) => set('lang', v),
    getEasyMode: () => get('easy', 'off') === 'on',
    setEasyMode: (v) => set('easy', v ? 'on' : 'off'),
    init() {
      document.documentElement.dataset.theme = this.getTheme();
      document.documentElement.style.setProperty('--fs', this.getFontScale());
    }
  };
})();

/* ── 5. LOCK MODE (fullscreen) ────────────────────────────── */

const LockMode = (() => {
  let locked = false;

  function toggle(btnEl) {
    if (!locked) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
      if (req) req.call(el).catch(() => {});
      locked = true;
      if (btnEl) btnEl.textContent = '🔒';
    } else {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document).catch(() => {});
      }
      locked = false;
      if (btnEl) btnEl.textContent = '🔓';
    }
  }

  // Sincroniza o botão se o usuário sair do fullscreen manualmente (ex: tecla Esc)
  function listenChanges(btnEl) {
    const sync = () => {
      const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      locked = inFs;
      if (btnEl) btnEl.textContent = inFs ? '🔒' : '🔓';
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
  }

  return { toggle, listenChanges };
})();

/* ── 6. TTS (Text-to-Speech) ──────────────────────────────── */

const TTS = (() => {
  function falar(texto, lang = null) {
    if (!Settings.getSoundOn()) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = lang || (Settings.getLang() === 'pt' ? 'pt-BR' : 'en-US');
    u.rate = 0.95;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  }
  return { falar };
})();

/* ── 7. NAVEGAÇÃO ─────────────────────────────────────────── */

function goToIndex() {
  window.location.href = 'index.html';
}

function goTo(page) {
  window.location.href = page;
}

/* ── 8. PENTAGRAMA ────────────────────────────────────────── */
// createStaff(container) — retorna { showNotes(midiArray), clear(), el }
// Posicionamento: clave de sol (C4–B5), 5 linhas, notas com acidentes e
// linhas suplementares automáticas. Sincronizado com o piano via showNotes().

function createStaff(container) {
  // Clave de Sol: linha 1 = Mi4, linha 2 = Sol4, 3 = Si4, 4 = Ré5, 5 = Fá5
  // step 0 = Mi4 (L1), step 2 = Sol4 (L2), step 4 = Si4 (L3),
  //          step 6 = Ré5 (L4), step 8 = Fá5 (L5)
  // Abaixo: step -1 = Ré4, step -2 = Dó4 (linha suplementar)
  // Acima:  step 9 = Sol5, step 10 = Lá5 (linha suplem.), step 11 = Si5
  const STEP_H  = 5;   // px por passo diatônico (metade do espaço entre linhas)
  const TOP_REF = 13;  // passo de referência no topo do container (Si5+2)
  const HEIGHT  = 85;  // px — acomoda Dó4 (step -2) a Si5 (step 11) com margem
  const STAFF_L = 30;  // px — início das linhas (após clave)
  const NOTE_X  = '55%'; // centro horizontal dos acidentes e notas no staff
  const NOTE_R  = 4;   // raio da cabeça de nota (px)

  // Tabela cromático → diatônico dentro da oitava (a partir de Dó)
  const DIAT = [0,0,1,1,2,3,3,4,4,5,5,6];

  function midiToStep(midi) {
    const oct  = Math.floor(midi / 12) - 1;     // oitava MIDI (Dó4 = 4)
    const diat = DIAT[midi % 12];               // posição diatônica na oitava
    return (oct - 4) * 7 + diat - 2;            // step relativo (Mi4 = 0)
  }

  function stepToY(step) {
    return (TOP_REF - step) * STEP_H;           // y do topo da nota
  }

  function isAcc(midi) { return [1,3,6,8,10].includes(midi % 12); }

  // Monta DOM
  const wrap = document.createElement('div');
  wrap.className = 'staff-wrap';
  wrap.style.height = HEIGHT + 'px';

  // Clave de Sol 𝄞 — posicionada para que o caracol fique na linha de Sol4 (step 2, y=55)
  const clef = document.createElement('div');
  clef.className = 'staff-clef';
  clef.textContent = '𝄞';
  clef.style.cssText = `top:${stepToY(9)}px;font-size:3rem;`;
  wrap.appendChild(clef);

  // 5 linhas
  [0, 2, 4, 6, 8].forEach(step => {
    const line = document.createElement('div');
    line.className = 'staff-line';
    line.style.cssText = `left:${STAFF_L}px;top:${stepToY(step)}px;`;
    wrap.appendChild(line);
  });

  container.appendChild(wrap);

  const active = [];

  // Cria e registra elemento no wrap
  function mk(cls, cssText, text) {
    const el = document.createElement('div');
    el.className = cls;
    el.style.cssText = 'position:absolute;' + cssText;
    if (text) el.textContent = text;
    wrap.appendChild(el);
    active.push(el);
    return el;
  }

  return {
    showNotes(midis) {
      this.clear();
      midis.forEach(midi => {
        const step = midiToStep(midi);
        const y    = stepToY(step);
        const acc  = isAcc(midi);

        // Linha suplementar inferior: Dó4 (step -2)
        if (step <= -2)
          mk('staff-ledger', `left:calc(${NOTE_X} - 10px);width:20px;height:1px;background:#3a5068;top:${stepToY(-2)}px;`);

        // Linha suplementar superior: Lá5+ (step >= 10)
        if (step >= 10)
          mk('staff-ledger', `left:calc(${NOTE_X} - 10px);width:20px;height:1px;background:#3a5068;top:${stepToY(10)}px;`);

        // Acidente ♯
        if (acc)
          mk('staff-acc', `left:calc(${NOTE_X} - 16px);top:${y - 8}px;font-size:.65rem;`, '♯');

        // Cabeça de nota
        mk('staff-note', `width:${NOTE_R*2}px;height:${NOTE_R*2}px;left:${NOTE_X};top:${y - NOTE_R}px;`);
      });
    },
    clear() { active.forEach(el => el.remove()); active.length = 0; },
    el: wrap,
  };
}

/* ── 9. PARTITURA SEQUENCIAL ──────────────────────────────── */
// createStaffScore(container, opts)
// Partitura horizontal multi-acorde com rolagem e destaque do acorde atual.
// API: { loadScore(chords), highlight(idx), scrollTo(idx), clear(), el }
// chords = [{ midis:[], duration:'w'|'h'|'q'|'8', label:'' }]
// duration: 'w'=semibreve (vazia, sem haste) 'h'=mínima (vazia+haste)
//           'q'=semínima (cheia+haste)       '8'=colcheia (cheia+haste+bandeira)

function createStaffScore(container, opts = {}) {
  const SLOT  = opts.slotWidth || 76;  // largura de cada slot (px)
  const CLEF  = 50;                    // área da clave (px)
  const H     = 96;                    // altura total SVG (px)
  const STEP  = 4;                     // px por passo diatônico
  const L1Y   = 64;                    // Y da linha 1 do pentagrama (Mi4)
  const NRX   = 4.6;                   // rx da cabeça de nota
  const NRY   = 3.0;                   // ry da cabeça de nota
  const TILT  = -15;                   // rotação da cabeça (graus)
  const STMH  = 25;                    // comprimento da haste (px)
  const LBH   = 12;                    // altura do rótulo no fundo

  const NS   = 'http://www.w3.org/2000/svg';
  // Índice cromático → posição diatônica (a partir de Dó)
  const DIAT = [0,0,1,1,2,3,3,4,4,5,5,6];

  // MIDI → passo diatônico relativo ao Mi4 (Mi4=0, Dó4=-2, Si5=11)
  function mToStep(m) {
    return (Math.floor(m / 12) - 5) * 7 + DIAT[m % 12] - 2;
  }
  function sY(s)        { return L1Y - s * STEP; }
  function isSharp(m)   { return [1,3,6,8,10].includes(m % 12); }
  function isFilled(d)  { return d === 'q' || d === '8'; }

  const $ = (tag, a = {}) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(a)) e.setAttribute(k, String(v));
    return e;
  };

  // Container rolável
  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:100%;overflow-x:auto;overflow-y:hidden;flex-shrink:0;';
  container.appendChild(wrap);

  let svg = null, chords = [], hlIdx = -1;

  function rebuild() {
    if (svg) { svg.remove(); svg = null; }
    if (!chords.length) return;

    const W = CLEF + chords.length * SLOT + 6;
    svg = $('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: 'display:block' });

    // 5 linhas do pentagrama (Mi4,Sol4,Si4,Ré5,Fá5 = passos 0,2,4,6,8)
    [0, 2, 4, 6, 8].forEach(s =>
      svg.appendChild($('line', { x1: CLEF-2, y1: sY(s), x2: W-2, y2: sY(s), stroke: '#3a5068', 'stroke-width': 1 }))
    );

    // Clave de Sol
    const clef = $('text', { x: 2, y: sY(9), fill: '#4a6274', 'font-size': 42, 'dominant-baseline': 'hanging', 'font-family': "'Segoe UI Symbol','Symbola',serif" });
    clef.textContent = '\u{1D11E}';
    svg.appendChild(clef);

    // Linha de compasso inicial
    svg.appendChild($('line', { x1: CLEF-1, y1: sY(0), x2: CLEF-1, y2: sY(8), stroke: '#2a3a4a', 'stroke-width': 1.2 }));

    chords.forEach((ch, i) => {
      const { midis = [], duration = 'w', label = '' } = ch;
      const active = i === hlIdx;
      const cx     = CLEF + i * SLOT + SLOT / 2;
      const steps  = midis.map(mToStep);
      // Ativo = azul padrão; inativo = apagado (quase cor das linhas)
      const col    = active ? '#4FC3F7' : '#3a5068';

      // Cabeças de nota, linhas suplementares, acidentes
      midis.forEach((midi, j) => {
        const step = steps[j];
        const cy   = sY(step);

        if (step <= -2)  // linha suplementar inferior (Dó4)
          svg.appendChild($('line', { x1: cx-8, y1: sY(-2), x2: cx+8, y2: sY(-2), stroke: active ? '#4FC3F7' : '#3a5068', 'stroke-width': 1 }));
        if (step >= 10)  // linha suplementar superior (Lá5+)
          svg.appendChild($('line', { x1: cx-8, y1: sY(10), x2: cx+8, y2: sY(10), stroke: active ? '#4FC3F7' : '#3a5068', 'stroke-width': 1 }));

        if (isSharp(midi)) {
          const acc = $('text', { x: cx-11, y: cy+4.5, fill: active ? '#4FC3F7' : '#6a7a8a', 'font-size': 9, 'font-weight': 'bold', 'text-anchor': 'middle' });
          acc.textContent = '\u266F';
          svg.appendChild(acc);
        }

        svg.appendChild($('ellipse', {
          cx, cy, rx: NRX, ry: NRY,
          fill: isFilled(duration) ? col : 'none',
          stroke: col, 'stroke-width': isFilled(duration) ? 0 : 1.4,
          transform: `rotate(${TILT} ${cx} ${cy})`
        }));
      });

      // Haste (mínima e semínima)
      if (duration !== 'w' && steps.length) {
        const avg = steps.reduce((a, b) => a + b, 0) / steps.length;
        const up  = avg < 4;
        const top = Math.max(...steps), bot = Math.min(...steps);
        const [sx, sy1, sy2] = up
          ? [cx+NRX-0.3, sY(top)-NRY,     sY(top)-NRY-STMH]
          : [cx-NRX+0.3, sY(bot)+NRY,     sY(bot)+NRY+STMH];
        svg.appendChild($('line', { x1: sx, y1: sy1, x2: sx, y2: sy2, stroke: col, 'stroke-width': 1.2 }));

        // Bandeira (colcheia)
        if (duration === '8') {
          const d = up ? 1 : -1;
          svg.appendChild($('path', { d: `M${sx} ${sy2} C${sx+11*d} ${sy2+5} ${sx+10*d} ${sy2+13} ${sx+4*d} ${sy2+17}`, fill: 'none', stroke: col, 'stroke-width': 1.2 }));
        }
      }

      // Linha de compasso final
      svg.appendChild($('line', { x1: CLEF+(i+1)*SLOT, y1: sY(0), x2: CLEF+(i+1)*SLOT, y2: sY(8), stroke: '#2a3a4a', 'stroke-width': 1.2 }));

      // Rótulo abaixo
      if (label) {
        const t = $('text', { x: cx, y: H-2, fill: active ? '#4FC3F7' : '#2e4055', 'font-size': 8.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'sans-serif' });
        t.textContent = label;
        svg.appendChild(t);
      }
    });

    wrap.appendChild(svg);
  }

  return {
    loadScore(c) { chords = c; hlIdx = -1; rebuild(); },
    highlight(i) { hlIdx = i; rebuild(); this.scrollTo(i); },
    scrollTo(i) {
      if (!wrap || i < 0) return;
      wrap.scrollLeft = Math.max(0, CLEF + i * SLOT + SLOT / 2 - wrap.clientWidth / 2);
    },
    clear() { chords = []; hlIdx = -1; if (svg) { svg.remove(); svg = null; } },
    el: wrap
  };
}

/* ── 10. INICIALIZAÇÃO ────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  Settings.init();
});

/* ── EXPORTAÇÕES (para uso nos módulos) ──────────────────── */
// AudioEngine, createPianoKeyboard, buildChord, transpose,
// noteToMidi, midiToNote, FORMULAS, noteCssClass,
// Settings, LockMode, TTS, goToIndex, goTo
