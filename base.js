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

/* ── 8. INICIALIZAÇÃO ─────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  Settings.init();
});

/* ── EXPORTAÇÕES (para uso nos módulos) ──────────────────── */
// AudioEngine, createPianoKeyboard, buildChord, transpose,
// noteToMidi, midiToNote, FORMULAS, noteCssClass,
// Settings, LockMode, TTS, goToIndex, goTo
