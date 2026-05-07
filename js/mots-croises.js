/* ─────────────────────────────────────────────────────────────
   Générateur de Mots Croisés — Logique principale
   Algorithme de placement + rendu Canvas + UI
───────────────────────────────────────────────────────────── */

'use strict';

const CLUE_HEADING_DEFAULTS = {
  fr: { H: 'Horizontalement', V: 'Verticalement' },
  en: { H: 'Across', V: 'Down' },
};

const CLUE_HEADING_ARIA_LABELS = {
  fr: { H: 'Titre des définitions horizontales', V: 'Titre des définitions verticales' },
  en: { H: 'Across clues heading', V: 'Down clues heading' },
};

/* ══════════════════════════════════════════════════════════════
   1. UTILITAIRES & PARSER D'IMPORT
══════════════════════════════════════════════════════════════ */

/** Retire les accents et met en majuscules */
function normalize(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

/** Valide et normalise une couleur hexadécimale */
function sanitizeColor(value, fallback = '#18181b') {
  if (typeof value !== 'string') return fallback;
  const match = value.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return fallback;
  const hex = match[1].toLowerCase();
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  return `#${hex}`;
}

/** Nettoie le titre affiche dans les exports */
function sanitizeTitle(value, fallback = 'Mots Croisés') {
  if (typeof value !== 'string') return fallback;
  const title = value.replace(/\s+/g, ' ').trim();
  return title ? title.slice(0, 80) : fallback;
}

/** Nettoie les titres de sections de définitions */
function sanitizeClueHeading(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const heading = value.replace(/\s+/g, ' ').trim();
  return heading ? heading.slice(0, 40) : fallback;
}

function normalizeSiteLang(lang) {
  return lang === 'en' ? 'en' : 'fr';
}

function getCurrentSiteLang() {
  return normalizeSiteLang(
    document.documentElement.lang ||
    localStorage.getItem('site_lang') ||
    localStorage.getItem('kanban_lang') ||
    'fr'
  );
}

function getDefaultClueHeading(dir, lang = getCurrentSiteLang()) {
  return CLUE_HEADING_DEFAULTS[normalizeSiteLang(lang)]?.[dir] || CLUE_HEADING_DEFAULTS.fr[dir];
}

function isDefaultClueHeading(dir, value) {
  const normalizedValue = sanitizeClueHeading(value, '');
  return Object.values(CLUE_HEADING_DEFAULTS).some(defaults => defaults[dir] === normalizedValue);
}

/** Transforme un titre en nom de fichier lisible */
function slugifyFilename(value, fallback = 'mots-croises') {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

/**
 * Parse un texte brut (txt, md, csv, coller) et retourne un tableau de mots.
 * Formats supportés :
 *   CSV     → MOT, H, Définition  /  MOT; H; Définition
 *   Texte   → H MOT: Définition   /  MOT: Définition
 *   Sections→ # Horizontal / # Vertical (ou HORIZONTAL / VERTICAL)
 *   Simple  → MOT (un par ligne, direction courante)
 */
function parseImportText(raw) {
  const lines = raw.split(/\r?\n/);
  const words = [];
  let currentDir = 'H';

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Nettoyer les marqueurs Markdown de liste (-, *, •) et la numérotation (1. 2. etc.)
    line = line.replace(/^[-*•]\s+/, '');
    line = line.replace(/^\d+[.)]\s*/, '');
    if (!line) continue;

    // ── Entêtes de section ──────────────────────────────────
    const lineUp = line.toUpperCase().replace(/[#\-_*>\s]/g, '');
    if (/^HORIZONT/.test(lineUp)) { currentDir = 'H'; continue; }
    if (/^VERTIC/.test(lineUp))   { currentDir = 'V'; continue; }

    // ── CSV : MOT, H, Définition  ou  MOT; H; Définition ───
    const sep = line.includes(';') ? ';' : ',';
    const parts = line.split(sep).map(s => s.trim());

    if (parts.length >= 2) {
      // Cas : MOT, H, Clue
      if (parts.length >= 3 && /^[HhVv]$/.test(parts[1])) {
        const text = normalize(parts[0]);
        if (text.length >= 2) {
          words.push({ text, dir: parts[1].toUpperCase(), clue: parts.slice(2).join(sep).trim() });
          continue;
        }
      }
      // Cas : MOT, Clue (pas de colonne direction)
      const maybeWord = normalize(parts[0]);
      if (maybeWord.length >= 2 && !/\s/.test(parts[0])) {
        words.push({ text: maybeWord, dir: currentDir, clue: parts.slice(1).join(sep).trim() });
        continue;
      }
    }

    // ── Direction inline : H MOT: Clue  ou  V MOT: Clue ────
    const dirInline = line.match(/^([HhVv])\s+(.+)$/);
    if (dirInline) {
      const dir  = dirInline[1].toUpperCase();
      const rest = dirInline[2];
      const colonIdx = rest.indexOf(':');
      if (colonIdx !== -1) {
        const text = normalize(rest.slice(0, colonIdx));
        if (text.length >= 2) {
          words.push({ text, dir, clue: rest.slice(colonIdx + 1).trim() });
          continue;
        }
      } else {
        const text = normalize(rest.split(/\s/)[0]);
        if (text.length >= 2) {
          words.push({ text, dir, clue: rest.replace(text, '').trim() });
          continue;
        }
      }
    }

    // ── MOT: Clue  ou  MOT - Clue ───────────────────────────
    const wordClue = line.match(/^([A-Za-zÀ-ÿ]+)\s*[:\-–—]\s*(.*)$/);
    if (wordClue) {
      const text = normalize(wordClue[1]);
      if (text.length >= 2) {
        words.push({ text, dir: currentDir, clue: wordClue[2].trim() });
        continue;
      }
    }

    // ── Simple : un mot seul par ligne ──────────────────────
    const single = normalize(line.split(/\s/)[0]);
    if (single.length >= 2) {
      words.push({ text: single, dir: currentDir, clue: '' });
    }
  }

  return words;
}

/* ══════════════════════════════════════════════════════════════
   2. ALGORITHME DE PLACEMENT
══════════════════════════════════════════════════════════════ */

class CrosswordPlacer {
  constructor() {
    this.grid     = new Map(); // "r,c" → lettre
    this.cellDirs = new Map(); // "r,c" → Set{H|V}
    this.placed   = [];        // [{text, dir, clue, row, col, number}]
  }

  _key(r, c) { return `${r},${c}`; }

  /** Vérifie si on peut placer `word` (direction `dir`) à (row, col) */
  canPlace(word, dir, row, col) {
    const n = word.length;

    // Cellule juste avant le début
    const beforeKey = dir === 'H'
      ? this._key(row, col - 1)
      : this._key(row - 1, col);
    if (this.grid.has(beforeKey)) return false;

    // Cellule juste après la fin
    const afterKey = dir === 'H'
      ? this._key(row, col + n)
      : this._key(row + n, col);
    if (this.grid.has(afterKey)) return false;

    for (let k = 0; k < n; k++) {
      const r = row + (dir === 'V' ? k : 0);
      const c = col + (dir === 'H' ? k : 0);
      const key = this._key(r, c);

      if (this.grid.has(key)) {
        // Lettre existante : doit correspondre
        if (this.grid.get(key) !== word[k]) return false;
        // Et doit être une intersection (direction opposée déjà en place)
        const dirs = this.cellDirs.get(key);
        if (dirs && dirs.has(dir)) return false;
      } else {
        // Cellule vide : voisins perpendiculaires doivent être libres
        if (dir === 'H') {
          if (this.grid.has(this._key(r - 1, c))) return false;
          if (this.grid.has(this._key(r + 1, c))) return false;
        } else {
          if (this.grid.has(this._key(r, c - 1))) return false;
          if (this.grid.has(this._key(r, c + 1))) return false;
        }
      }
    }
    return true;
  }

  /** Pose effectivement le mot sur la grille */
  _doPlace(word, dir, row, col) {
    for (let k = 0; k < word.length; k++) {
      const r = row + (dir === 'V' ? k : 0);
      const c = col + (dir === 'H' ? k : 0);
      const key = this._key(r, c);
      this.grid.set(key, word[k]);
      if (!this.cellDirs.has(key)) this.cellDirs.set(key, new Set());
      this.cellDirs.get(key).add(dir);
    }
  }

  /** Compte les intersections si on place `word` à (row, col) */
  _scorePos(word, dir, row, col) {
    let s = 0;
    for (let k = 0; k < word.length; k++) {
      const r = row + (dir === 'V' ? k : 0);
      const c = col + (dir === 'H' ? k : 0);
      if (this.grid.has(this._key(r, c))) s++;
    }
    return s;
  }

  /** Retourne la distance au centre de la grille actuelle */
  _distToCenter(row, col) {
    const b = this._bounds();
    const cr = (b.minR + b.maxR) / 2;
    const cc = (b.minC + b.maxC) / 2;
    return Math.abs(row - cr) + Math.abs(col - cc);
  }

  /** Cherche la meilleure position pour un nouveau mot via intersections */
  _findBestPosition(word, dir) {
    let best = null;
    let bestScore = -Infinity;

    for (const pw of this.placed) {
      if (pw.dir === dir) continue; // même direction → pas d'intersection

      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < pw.text.length; j++) {
          if (word[i] !== pw.text[j]) continue;

          let row, col;
          if (dir === 'H') {
            // word H, placed V : intersection à (pw.row+j, pw.col)
            row = pw.row + j;
            col = pw.col - i;
          } else {
            // word V, placed H : intersection à (pw.row, pw.col+j)
            row = pw.row - i;
            col = pw.col + j;
          }

          if (!this.canPlace(word, dir, row, col)) continue;

          const intersections = this._scorePos(word, dir, row, col);
          const dist = this._distToCenter(row, col);

          // Bonus aspect-ratio : favorise l'étalement dans la dimension la plus courte
          const b = this._bounds();
          const gridW = b.maxC - b.minC + 1 || 1;
          const gridH = b.maxR - b.minR + 1 || 1;
          const aspect = gridW / gridH;
          let aspectBonus = 0;
          if (dir === 'H' && aspect < 0.85) {
            // Grille trop haute → récompenser les mots H qui s'étendent à droite
            const wordRight = col + word.length - 1;
            aspectBonus = Math.max(0, wordRight - b.maxC) * 25;
          } else if (dir === 'V' && aspect > 1.15) {
            // Grille trop large → récompenser les mots V qui s'étendent vers le bas
            const wordBottom = row + word.length - 1;
            aspectBonus = Math.max(0, wordBottom - b.maxR) * 25;
          }

          // Score = intersections prioritaires, puis aspect, puis proximité au centre
          const score = intersections * 1000 + aspectBonus - dist;

          if (score > bestScore) {
            bestScore = score;
            best = { row, col };
          }
        }
      }
    }
    return best;
  }

  /** Borne de la grille actuelle */
  _bounds() {
    if (this.grid.size === 0) return { minR: 0, maxR: 0, minC: 0, maxC: 0 };
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const key of this.grid.keys()) {
      const [r, c] = key.split(',').map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
    return { minR, maxR, minC, maxC };
  }

  /** Tente de placer un mot seul (sans intersection) hors du groupe existant */
  _placeSolo(word, dir) {
    const b = this._bounds();
    const gap = 2;

    // On essaie plusieurs positions autour de la grille
    const candidates = [];
    if (dir === 'H') {
      // En dessous
      for (let c = b.minC; c <= b.maxC - word.length + 1; c++) {
        candidates.push({ row: b.maxR + gap, col: c });
      }
      candidates.push({ row: b.maxR + gap, col: b.minC });
    } else {
      // À droite
      for (let r = b.minR; r <= b.maxR - word.length + 1; r++) {
        candidates.push({ row: r, col: b.maxC + gap });
      }
      candidates.push({ row: b.minR, col: b.maxC + gap });
    }

    for (const { row, col } of candidates) {
      if (this.canPlace(word, dir, row, col)) return { row, col };
    }

    // Fallback absolu
    const row = dir === 'H' ? b.maxR + gap : b.minR;
    const col = dir === 'H' ? b.minC : b.maxC + gap;
    return { row, col };
  }

  /** Assigne les numéros dans l'ordre lecture (haut→bas, gauche→droite) */
  _assignNumbers() {
    const starts = new Map(); // "r,c" → numéro
    const sorted = [...this.placed].sort((a, b) =>
      a.row !== b.row ? a.row - b.row : a.col - b.col
    );
    let n = 1;
    for (const pw of sorted) {
      const key = this._key(pw.row, pw.col);
      if (!starts.has(key)) {
        starts.set(key, n++);
      }
      pw.number = starts.get(key);
    }
  }

  /**
   * Point d'entrée principal.
   * @param {Array<{text:string, dir:string, clue:string}>} wordsInput
   */
  generate(wordsInput) {
    if (!wordsInput.length) return [];

    // ── Normaliser ───────────────────────────────────────────
    const words = wordsInput.map(w => ({
      text: normalize(w.text),
      dir:  (w.dir || 'H')[0].toUpperCase(),
      clue: w.clue || '',
    })).filter(w => w.text.length >= 2);

    if (!words.length) return [];

    // ── Préparer les groupes H/V ──────────────────────────────
    const hWords = words.filter(w => w.dir === 'H').sort((a, b) => b.text.length - a.text.length);
    const vWords = words.filter(w => w.dir === 'V').sort((a, b) => b.text.length - a.text.length);

    // Si tous dans la même direction, alterner automatiquement
    if (!hWords.length) {
      vWords.forEach((w, i) => { if (i % 2 === 0) w.dir = 'H'; });
      hWords.push(...vWords.filter(w => w.dir === 'H'));
      vWords.splice(0, vWords.length, ...vWords.filter(w => w.dir === 'V'));
    } else if (!vWords.length) {
      hWords.forEach((w, i) => { if (i % 2 === 1) w.dir = 'V'; });
      vWords.push(...hWords.filter(w => w.dir === 'V'));
      hWords.splice(0, hWords.length, ...hWords.filter(w => w.dir === 'H'));
    }

    // Ordre canonique : interleaver H/V, longs en premier
    const canonical = [];
    const maxLen = Math.max(hWords.length, vWords.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < hWords.length) canonical.push(hWords[i]);
      if (i < vWords.length) canonical.push(vWords[i]);
    }

    // ── Multi-restart : essayer plusieurs ordres, garder le meilleur ──
    const ATTEMPTS   = 14;
    const MAX_PASSES = 7;
    let bestGrid         = null;
    let bestCellDirs     = null;
    let bestPlaced       = null;
    let bestUnplacedWords = canonical.slice(1); // pire cas initial
    let bestUnplacedCount = Infinity;

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      // 1ère tentative = ordre canonique ; suivantes = mélangé (ancre fixe)
      let order;
      if (attempt === 0) {
        order = [...canonical];
      } else {
        const rest = [...canonical.slice(1)].sort(() => Math.random() - 0.5);
        order = [canonical[0], ...rest];
      }

      // Réinitialiser l'état
      this.grid.clear();
      this.cellDirs.clear();
      this.placed = [];

      // Placer le premier mot comme ancre
      const first = order[0];
      this._doPlace(first.text, first.dir, 0, 0);
      this.placed.push({ text: first.text, dir: first.dir, clue: first.clue, row: 0, col: 0, number: 0 });

      const unplaced = order.slice(1);

      // Passes successives
      for (let pass = 0; pass < MAX_PASSES && unplaced.length; pass++) {
        const stillUnplaced = [];
        for (const wd of unplaced) {
          const pos = this._findBestPosition(wd.text, wd.dir);
          if (pos) {
            this._doPlace(wd.text, wd.dir, pos.row, pos.col);
            this.placed.push({ text: wd.text, dir: wd.dir, clue: wd.clue, row: pos.row, col: pos.col, number: 0 });
          } else {
            stillUnplaced.push(wd);
          }
        }
        unplaced.length = 0;
        unplaced.push(...stillUnplaced);
      }

      // Tentative avec direction inversée
      const toFlip = [...unplaced];
      unplaced.length = 0;
      for (const wd of toFlip) {
        const flippedDir = wd.dir === 'H' ? 'V' : 'H';
        const pos = this._findBestPosition(wd.text, flippedDir);
        if (pos) {
          this._doPlace(wd.text, flippedDir, pos.row, pos.col);
          this.placed.push({ text: wd.text, dir: flippedDir, clue: wd.clue, row: pos.row, col: pos.col, number: 0 });
        } else {
          unplaced.push(wd);
        }
      }

      // Conserver si meilleur résultat
      if (unplaced.length < bestUnplacedCount) {
        bestUnplacedCount = unplaced.length;
        bestUnplacedWords = [...unplaced];
        bestGrid     = new Map(this.grid);
        bestCellDirs = new Map(this.cellDirs);
        bestPlaced   = this.placed.map(p => ({ ...p }));
        if (bestUnplacedCount === 0) break; // parfait, inutile d'en faire plus
      }
    }

    // ── Appliquer le meilleur résultat ────────────────────────
    this.grid     = bestGrid;
    this.cellDirs = bestCellDirs;
    this.placed   = bestPlaced;

    // Placement isolé pour les mots restants (dernier recours)
    for (const wd of bestUnplacedWords) {
      const pos = this._placeSolo(wd.text, wd.dir);
      this._doPlace(wd.text, wd.dir, pos.row, pos.col);
      this.placed.push({ text: wd.text, dir: wd.dir, clue: wd.clue, row: pos.row, col: pos.col, number: 0 });
    }

    this._assignNumbers();
    this._unplacedCount = bestUnplacedWords.length;
    return this.placed;
  }

  bounds() { return this._bounds(); }
}

/* ══════════════════════════════════════════════════════════════
   3. RENDU CANVAS
══════════════════════════════════════════════════════════════ */

class CrosswordRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.blockColor = '#18181b';
  }

  /** Charge une police via FontFace API si dispo, sinon fallback */
  _getFont(size, weight = 400) {
    return `${weight} ${size}px 'Inter', system-ui, sans-serif`;
  }

  setBlockColor(color) {
    this.blockColor = sanitizeColor(color, this.blockColor);
  }

  _wrapTextLines(ctx, text, maxWidth) {
    const parts = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return [''];

    const lines = [];
    let current = parts[0];

    for (let i = 1; i < parts.length; i++) {
      const test = `${current} ${parts[i]}`;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        lines.push(current);
        current = parts[i];
      }
    }

    lines.push(current);
    return lines;
  }

  /**
   * Rendu principal de la grille.
   * @param {CrosswordPlacer} placer
   * @param {boolean} showSolution  afficher les lettres ou non
   */
  render(placer, showSolution = false) {
    const dpr = window.devicePixelRatio || 1;
    const CELL  = 44;
    const PAD   = 18;
    const b     = placer.bounds();
    const rows  = b.maxR - b.minR + 1;
    const cols  = b.maxC - b.minC + 1;
    const rOff  = -b.minR;
    const cOff  = -b.minC;

    const W = PAD * 2 + cols * CELL;
    const H = PAD * 2 + rows * CELL;

    this.canvas.width  = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width  = W + 'px';
    this.canvas.style.height = H + 'px';

    const ctx = this.ctx;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Fond général (cellules noires par défaut)
    ctx.fillStyle = this.blockColor;
    ctx.fillRect(0, 0, W, H);

    // Coins arrondis du fond
    // (on garde le fond rectangulaire simple)

    const gridSet = placer.grid;
    const starts  = new Map(placer.placed.map(pw => [`${pw.row},${pw.col}`, pw.number]));

    for (const [key, letter] of gridSet) {
      const [r, c] = key.split(',').map(Number);
      const x = PAD + (c + cOff) * CELL;
      const y = PAD + (r + rOff) * CELL;

      // Cellule blanche
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

      // Lettre
      if (showSolution) {
        ctx.font      = this._getFont(22, 600);
        ctx.fillStyle = '#18181b';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, x + CELL / 2, y + CELL / 2 + 1);
      }

      // Numéro en haut à gauche
      if (starts.has(key)) {
        ctx.font      = this._getFont(9, 500);
        ctx.fillStyle = '#52525b';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(String(starts.get(key)), x + 3, y + 3);
      }
    }

    // Grille fine
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth   = 0.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r - rOff},${c - cOff}`;
        if (gridSet.has(key)) {
          const x = PAD + c * CELL;
          const y = PAD + r * CELL;
          ctx.strokeRect(x + .5, y + .5, CELL - 1, CELL - 1);
        }
      }
    }
  }

  /**
   * Génère un canvas complet (grille + définitions) pour l'export PNG.
   */
  exportCanvas(placer, title = 'Mots Croisés', headings = {}) {
    title = sanitizeTitle(title);
    const hHeading = sanitizeClueHeading(headings.H, 'Horizontalement').toUpperCase();
    const vHeading = sanitizeClueHeading(headings.V, 'Verticalement').toUpperCase();
    const dpr = 2; // toujours en haute résolution pour l'export
    const CELL = 44;
    const PAD = 20;
    const GRID_TOP_BASE = 58;
    const SIDE_PAD = 28;
    const COL_GAP = 32;
    const MIN_CLUE_W = 340;
    const DEFS_TOP_GAP = 34;
    const DEFS_BOTTOM_PAD = 24;
    const HEADING_LINE_H = 20;
    const CLUE_LINE_H = 24;
    const CLUE_GAP = 5;
    const HEADING_FONT_SIZE = 13;
    const CLUE_FONT_SIZE = 15;
    const TITLE_FONT_SIZE = 20;
    const TITLE_LINE_H = 26;

    const b = placer.bounds();
    const rows = b.maxR - b.minR + 1;
    const cols = b.maxC - b.minC + 1;
    const rOff = -b.minR;
    const cOff = -b.minC;

    const gridW = PAD * 2 + cols * CELL;
    const gridH = PAD * 2 + rows * CELL;

    const hWords = placer.placed.filter(p => p.dir === 'H').sort((a, b2) => a.number - b2.number);
    const vWords = placer.placed.filter(p => p.dir === 'V').sort((a, b2) => a.number - b2.number);

    const W = Math.max(gridW + SIDE_PAD * 2, SIDE_PAD * 2 + MIN_CLUE_W * 2 + COL_GAP);
    const CLUE_W = Math.floor((W - SIDE_PAD * 2 - COL_GAP) / 2);

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = `600 ${TITLE_FONT_SIZE}px 'Inter', sans-serif`;
    const titleLines = this._wrapTextLines(measureCtx, title, W - SIDE_PAD * 2);
    const GRID_TOP = GRID_TOP_BASE + Math.max(0, titleLines.length - 1) * TITLE_LINE_H;

    const measureColumnHeight = (words) => {
      let y = 0;
      y += HEADING_LINE_H;
      y += 14; // espace + ligne de séparation
      measureCtx.font = `400 ${CLUE_FONT_SIZE}px 'Inter', sans-serif`;

      for (const pw of words) {
        const clue = pw.clue || pw.text;
        const line = `${pw.number}. ${clue}`;
        const wrapped = this._wrapTextLines(measureCtx, line, CLUE_W);
        y += Math.max(1, wrapped.length) * CLUE_LINE_H + CLUE_GAP;
      }
      return y;
    };

    const defsHeight = Math.max(measureColumnHeight(hWords), measureColumnHeight(vWords)) + DEFS_BOTTOM_PAD;
    const totalH = GRID_TOP + gridH + DEFS_TOP_GAP + defsHeight;

    const canvas = document.createElement('canvas');
    canvas.width = W * dpr;
    canvas.height = totalH * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Fond général
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, W, totalH);

    // Titre
    ctx.font = `600 ${TITLE_FONT_SIZE}px 'Inter', sans-serif`;
    ctx.fillStyle = '#18181b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    titleLines.forEach((line, index) => {
      ctx.fillText(line, W / 2, 36 + index * TITLE_LINE_H);
    });

    // Grille
    const gxOff = (W - gridW) / 2;
    const gyOff = GRID_TOP;
    ctx.fillStyle = this.blockColor;
    ctx.fillRect(gxOff, gyOff, gridW, gridH);

    const gridSet = placer.grid;
    const starts = new Map(placer.placed.map(pw => [`${pw.row},${pw.col}`, pw.number]));

    for (const [key] of gridSet) {
      const [r, c] = key.split(',').map(Number);
      const x = gxOff + PAD + (c + cOff) * CELL;
      const y = gyOff + PAD + (r + rOff) * CELL;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

      if (starts.has(key)) {
        ctx.font = `500 10px 'Inter', sans-serif`;
        ctx.fillStyle = '#52525b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(String(starts.get(key)), x + 3, y + 3);
      }

      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
    }

    // Définitions
    const defY = gyOff + gridH + DEFS_TOP_GAP;
    const colX = [SIDE_PAD, SIDE_PAD + CLUE_W + COL_GAP];
    const sections = [
      { label: hHeading, words: hWords },
      { label: vHeading, words: vWords },
    ];

    sections.forEach(({ label, words }, si) => {
      let y = defY;
      const x = colX[si];

      ctx.font = `600 ${HEADING_FONT_SIZE}px 'Inter', sans-serif`;
      ctx.fillStyle = '#52525b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x, y);
      y += HEADING_LINE_H;

      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + CLUE_W, y);
      ctx.stroke();
      y += 14;

      ctx.font = `400 ${CLUE_FONT_SIZE}px 'Inter', sans-serif`;
      ctx.fillStyle = '#27272a';

      for (const pw of words) {
        const clue = pw.clue || pw.text;
        const wrapped = this._wrapTextLines(ctx, `${pw.number}. ${clue}`, CLUE_W);
        for (const line of wrapped) {
          ctx.fillText(line, x, y);
          y += CLUE_LINE_H;
        }
        y += CLUE_GAP;
      }
    });

    return canvas;
  }
}

/* ══════════════════════════════════════════════════════════════
   4. MODAL D'IMPORT
══════════════════════════════════════════════════════════════ */

class ImportModal {
  constructor(onImport) {
    this.onImport   = onImport; // callback(words, replace)
    this._parsed    = [];

    this.dialog     = document.getElementById('importDialog');
    this.closeBtn   = document.getElementById('importDialogClose');
    this.cancelBtn  = document.getElementById('importCancelBtn');
    this.confirmBtn = document.getElementById('importConfirmBtn');
    this.pasteArea  = document.getElementById('pasteArea');
    this.dropZone   = document.getElementById('dropZone');
    this.fileInput  = document.getElementById('fileInput');
    this.browseBtn  = document.getElementById('browseBtn');
    this.previewEl  = document.getElementById('importPreview');
    this.countEl    = document.getElementById('importPreviewCount');
    this.replaceToggle = document.getElementById('importReplaceToggle');

    this._bind();
  }

  _bind() {
    // Ouvrir/fermer
    this.closeBtn.addEventListener('click',  () => this.close());
    this.cancelBtn.addEventListener('click', () => this.close());
    this.dialog.addEventListener('click', e => {
      if (e.target === this.dialog) this.close();
    });

    // Confirmer
    this.confirmBtn.addEventListener('click', () => {
      if (!this._parsed.length) return;
      this.onImport(this._parsed, this.replaceToggle.checked);
      this.close();
    });

    // Parcourir (évite le click sur file input caché qui serait bloqué)
    this.browseBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.fileInput.click();
    });

    // File input
    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files[0];
      if (file) this._readFile(file);
    });

    // Drag & drop
    this.dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      this.dropZone.classList.add('is-over');
    });
    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('is-over');
    });
    this.dropZone.addEventListener('drop', e => {
      e.preventDefault();
      this.dropZone.classList.remove('is-over');
      const file = e.dataTransfer.files[0];
      if (file) this._readFile(file);
    });

    // Keyboard sur la drop zone
    this.dropZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') this.fileInput.click();
    });

    // Textarea : parse en temps réel
    this.pasteArea.addEventListener('input', () => this._parseAndPreview(this.pasteArea.value));
  }

  _readFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      this.pasteArea.value = text;
      this._parseAndPreview(text);
    };
    reader.readAsText(file, 'UTF-8');
  }

  _parseAndPreview(text) {
    this._parsed = parseImportText(text);
    const n = this._parsed.length;
    this.confirmBtn.disabled = n === 0;
    this.previewEl.hidden    = n === 0;
    if (n > 0) {
      const h = this._parsed.filter(w => w.dir === 'H').length;
      const v = this._parsed.filter(w => w.dir === 'V').length;
      this.countEl.textContent =
        `${n} mot${n > 1 ? 's' : ''} détecté${n > 1 ? 's' : ''} — ${h} horizontal${h > 1 ? 'aux' : ''}, ${v} vertical${v > 1 ? 'aux' : ''}`;
      this.confirmBtn.textContent = `Importer ${n} mot${n > 1 ? 's' : ''}`;
    }
  }

  open() {
    this._parsed = [];
    this.pasteArea.value = '';
    this.confirmBtn.disabled = true;
    this.confirmBtn.textContent = 'Importer';
    this.previewEl.hidden = true;
    this.replaceToggle.checked = false;
    this.fileInput.value = '';
    this.dialog.showModal();
    setTimeout(() => this.pasteArea.focus(), 50);
  }

  close() {
    this.dialog.close();
  }
}

/* ══════════════════════════════════════════════════════════════
   5. INTERFACE UTILISATEUR
══════════════════════════════════════════════════════════════ */

class CrosswordApp {
  constructor() {
    this.words    = [];  // [{text, dir, clue}]
    this.placer   = new CrosswordPlacer();
    this.renderer = null;
    this._toastTimer = null;
    this._customClueHeadings = { H: false, V: false };

    this._init();
  }

  _init() {
    // Éléments DOM
    this.wordForm     = document.getElementById('wordForm');
    this.titleInput   = document.getElementById('crosswordTitleInput');
    this.wordInput    = document.getElementById('wordInput');
    this.clueInput    = document.getElementById('clueInput');
    this.wordList     = document.getElementById('wordList');
    this.emptyMsg     = document.getElementById('emptyMsg');
    this.wordCount    = document.getElementById('wordCount');
    this.clearAllBtn  = document.getElementById('clearAllBtn');
    this.generateBtn  = document.getElementById('generateBtn');
    this.canvas       = document.getElementById('crosswordCanvas');
    this.emptyState   = document.getElementById('emptyState');
    this.previewActions = document.getElementById('previewActions');
    this.publishedLink = document.getElementById('publishedLink');
    this.publishedLinkUrl = document.getElementById('publishedLinkUrl');
    this.copyPublishedLinkBtn = document.getElementById('copyPublishedLink');
    this.cluesContainer = document.getElementById('cluesContainer');
    this.hCluesHeading = document.getElementById('hCluesHeading');
    this.vCluesHeading = document.getElementById('vCluesHeading');
    this.hCluesList   = document.getElementById('hCluesList');
    this.vCluesList   = document.getElementById('vCluesList');
    this.solutionToggle = document.getElementById('solutionToggle');
    this.gridBgColorInput = document.getElementById('gridBgColor');
    this.publishOnlineBtn = document.getElementById('publishOnline');
    this.exportHTMLBtn = document.getElementById('exportHTML');
    this.exportPNGBtn = document.getElementById('exportPNG');
    this.printBtn     = document.getElementById('printBtn');
    this.toast        = document.getElementById('toast');

    this.renderer = new CrosswordRenderer(this.canvas);
    const initialBlockColor = sanitizeColor(this.gridBgColorInput ? this.gridBgColorInput.value : '#18181b');
    this.renderer.setBlockColor(initialBlockColor);
    if (this.gridBgColorInput) this.gridBgColorInput.value = initialBlockColor;
    this._syncClueHeadingsWithLanguage(getCurrentSiteLang());

    // Modal d'import
    this.importModal = new ImportModal((words, replace) => {
      if (replace) this.words = [];
      words.forEach(w => this.words.push(w));
      this._renderWordList();
      this._updateUI();
      const n = words.length;
      this._showToast(`${n} mot${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''} !`);
    });
    document.getElementById('importBtn').addEventListener('click', () => this.importModal.open());

    // Direction sélectionnée
    this._currentDir = 'H';
    document.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const segControl = btn.closest('.seg-control');
        document.querySelectorAll('.seg-btn').forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        this._currentDir = btn.dataset.dir;
        if (segControl) segControl.dataset.activeDir = this._currentDir;
      });
    });

    // Formulaire
    this.wordForm.addEventListener('submit', e => {
      e.preventDefault();
      this._addWord();
    });

    // Effacer tout
    this.clearAllBtn.addEventListener('click', () => this._clearAll());

    // Générer
    this.generateBtn.addEventListener('click', () => this._generate());

    // Titre des exports
    if (this.titleInput) {
      this.titleInput.addEventListener('input', () => this._setPublishedLink(''));
    }

    [this.hCluesHeading, this.vCluesHeading].forEach(heading => {
      if (!heading) return;
      const dir = heading.dataset.clueDir;
      heading.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          heading.blur();
        }
      });
      heading.addEventListener('input', () => {
        if (dir) {
          this._customClueHeadings[dir] = !isDefaultClueHeading(dir, heading.textContent);
        }
        this._setPublishedLink('');
      });
      heading.addEventListener('blur', () => {
        const fallback = dir ? getDefaultClueHeading(dir) : 'Horizontalement';
        const next = sanitizeClueHeading(heading.textContent, fallback);
        heading.textContent = next;
        if (dir) {
          this._customClueHeadings[dir] = !isDefaultClueHeading(dir, next);
        }
      });
    });

    document.addEventListener('siteLanguageChanged', event => {
      this._syncClueHeadingsWithLanguage(event.detail?.lang);
    });

    // Solution toggle
    this.solutionToggle.addEventListener('change', () => {
      this.renderer.render(this.placer, this.solutionToggle.checked);
    });

    // Couleur d'arrière-plan de la grille
    if (this.gridBgColorInput) {
      this.gridBgColorInput.addEventListener('input', () => {
        const nextColor = sanitizeColor(this.gridBgColorInput.value, this.renderer.blockColor);
        this.renderer.setBlockColor(nextColor);
        this.gridBgColorInput.value = nextColor;
        if (this.placer.placed.length) {
          this.renderer.render(this.placer, this.solutionToggle.checked);
        }
      });
    }

    // Publication en ligne
    this.publishOnlineBtn.addEventListener('click', () => this._publishOnline());
    this.copyPublishedLinkBtn.addEventListener('click', () => this._copyPublishedLink());

    // Export HTML interactif
    this.exportHTMLBtn.addEventListener('click', () => this._exportHTML());

    // Export PNG
    this.exportPNGBtn.addEventListener('click', () => this._exportPNG());

    // Imprimer
    this.printBtn.addEventListener('click', () => window.print());

    // Uppercase en temps réel dans le champ mot
    this.wordInput.addEventListener('input', () => {
      const pos = this.wordInput.selectionStart;
      this.wordInput.value = this.wordInput.value.toUpperCase();
      this.wordInput.setSelectionRange(pos, pos);
    });
  }

  _addWord() {
    const raw  = this.wordInput.value.trim();
    const clue = this.clueInput.value.trim();
    if (!raw) {
      this._shake(this.wordInput);
      return;
    }
    const text = normalize(raw);
    if (!text) {
      this._shake(this.wordInput);
      this._showToast('Le mot ne contient pas de lettres valides.');
      return;
    }
    if (text.length < 2) {
      this._shake(this.wordInput);
      this._showToast('Le mot doit faire au moins 2 lettres.');
      return;
    }

    this.words.push({ text, dir: this._currentDir, clue, orig: raw });
    this.wordInput.value = '';
    this.clueInput.value = '';
    this.wordInput.focus();

    this._renderWordList();
    this._updateUI();
    this._setPublishedLink('');
  }

  _removeWord(index) {
    const items = this.wordList.querySelectorAll('.word-item');
    const item  = items[index];
    if (!item) return;

    item.classList.add('is-removing');
    item.addEventListener('transitionend', () => {
      this.words.splice(index, 1);
      this._renderWordList();
      this._updateUI();
      this._setPublishedLink('');
    }, { once: true });
  }

  _clearAll() {
    this.words = [];
    this._renderWordList();
    this._updateUI();
    this._hideGrid();
    this._setPublishedLink('');
  }

  _renderWordList() {
    // Supprimer les items existants (pas le message vide)
    this.wordList.querySelectorAll('.word-item').forEach(el => el.remove());

    if (!this.words.length) {
      this.emptyMsg.hidden = false;
      return;
    }
    this.emptyMsg.hidden = true;

    this.words.forEach((w, i) => {
      const li = document.createElement('li');
      li.className = 'word-item';

      const dir = document.createElement('span');
      dir.className = `word-dir word-dir--${w.dir.toLowerCase()}`;
      dir.textContent = w.dir;

      const textCol = document.createElement('div');
      textCol.className = 'word-text-col';

      const wordText = document.createElement('div');
      wordText.className = 'word-text';
      wordText.textContent = w.text;
      textCol.appendChild(wordText);

      if (w.clue) {
        const clueText = document.createElement('div');
        clueText.className = 'word-clue';
        clueText.textContent = w.clue;
        textCol.appendChild(clueText);
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'word-delete';
      deleteBtn.type = 'button';
      deleteBtn.setAttribute('aria-label', `Supprimer ${w.text}`);
      deleteBtn.title = 'Supprimer';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => this._removeWord(i));

      li.appendChild(dir);
      li.appendChild(textCol);
      li.appendChild(deleteBtn);
      this.wordList.appendChild(li);
    });
  }

  _updateUI() {
    const n = this.words.length;
    this.wordCount.textContent = String(n);
    this.wordCount.classList.remove('is-popping');
    void this.wordCount.offsetWidth; // reflow pour relancer l'animation
    this.wordCount.classList.add('is-popping');

    this.generateBtn.disabled = n < 1;
    this.clearAllBtn.hidden   = n < 1;
  }

  _generate() {
    if (!this.words.length) return;
    this._setPublishedLink('');

    const doRender = () => {
      this.placer.generate(this.words);

      if (!this.placer.placed.length) {
        this._showToast('Impossible de placer les mots.');
        return;
      }

      // Rendu canvas
      this.renderer.render(this.placer, this.solutionToggle.checked);
      this.canvas.hidden = false;
      this.canvas.classList.remove('is-revealed');
      void this.canvas.offsetWidth;
      this.canvas.classList.add('is-revealed');
      this.emptyState.hidden = true;

      // Définitions dans le DOM
      this._renderClues();

      // Afficher les contrôles
      this.previewActions.hidden  = false;
      this.cluesContainer.hidden  = false;

      // Feedback sur les mots isolés
      const isolated = this.placer._unplacedCount || 0;
      if (isolated > 0) {
        this._showToast(`${isolated} mot${isolated > 1 ? 's' : ''} sans intersection — placé${isolated > 1 ? 's' : ''} séparément.`);
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(doRender);
    } else {
      doRender();
    }
  }

  _renderClues() {
    const placed = this.placer.placed;
    const hWords = placed.filter(p => p.dir === 'H').sort((a, b) => a.number - b.number);
    const vWords = placed.filter(p => p.dir === 'V').sort((a, b) => a.number - b.number);

    this._fillClueList(this.hCluesList, hWords);
    this._fillClueList(this.vCluesList, vWords);
  }

  _fillClueList(listEl, words) {
    listEl.innerHTML = '';
    if (!words.length) {
      listEl.innerHTML = '<li style="color:var(--mc-text-3);font-size:13px;font-style:italic">Aucun</li>';
      return;
    }
    for (const pw of words) {
      const li = document.createElement('li');
      li.className = 'clue-item';
      li.innerHTML = `
        <span class="clue-num">${pw.number}.</span>
        <span>${_esc(pw.clue || pw.text)}</span>
      `;
      listEl.appendChild(li);
    }
  }

  _hideGrid() {
    this.canvas.hidden          = true;
    this.emptyState.hidden      = false;
    this.previewActions.hidden  = true;
    this.cluesContainer.hidden  = true;
    this._setPublishedLink('');
  }

  _exportPNG() {
    const title = this._getCrosswordTitle();
    const exportCanvas = this.renderer.exportCanvas(this.placer, title, this._getClueHeadings());
    exportCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${slugifyFilename(title)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  }

  _exportHTML() {
    if (!this.placer.placed.length) {
      this._showToast('Générez d’abord une grille.');
      return;
    }

    const data = this._buildInteractiveExportData();
    const html = this._buildInteractiveHTML(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${data.slug}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    this._showToast(`Fichier HTML exporte: ${data.slug}.html`);
  }

  async _publishOnline() {
    if (!this.placer.placed.length) {
      this._showToast('Générez d’abord une grille.');
      return;
    }

    if (!window.location.protocol.startsWith('http')) {
      this._showToast('La publication en ligne nécessite l’application hébergée sur le site.');
      return;
    }

    const data = this._buildInteractiveExportData();

    this.publishOnlineBtn.disabled = true;
    const prevLabel = this.publishOnlineBtn.textContent;
    this.publishOnlineBtn.textContent = 'Publication...';

    try {
      const response = await fetch('publish.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crossword: data }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok || !result?.url) {
        throw new Error(result?.error || 'Publication impossible.');
      }

      this._setPublishedLink(result.url);
      this._showToast('Grille publiee en ligne.');
      window.open(result.url, '_blank', 'noopener');
    } catch (error) {
      this._showToast(error.message || 'Publication impossible.');
    } finally {
      this.publishOnlineBtn.disabled = false;
      this.publishOnlineBtn.textContent = prevLabel;
    }
  }

  _setPublishedLink(url) {
    if (!url) {
      this.publishedLink.hidden = true;
      this.publishedLinkUrl.href = '#';
      this.publishedLinkUrl.textContent = '';
      return;
    }

    this.publishedLink.hidden = false;
    this.publishedLinkUrl.href = url;
    this.publishedLinkUrl.textContent = url;
  }

  async _copyPublishedLink() {
    const url = this.publishedLinkUrl.textContent.trim();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      this._showToast('Lien copie.');
    } catch {
      this._showToast('Copie impossible.');
    }
  }

  _buildInteractiveExportData() {
    const b = this.placer.bounds();
    const rows = b.maxR - b.minR + 1;
    const cols = b.maxC - b.minC + 1;
    const starts = new Map(this.placer.placed.map(pw => [`${pw.row},${pw.col}`, pw.number]));
    const cells = [];
    const cellsByKey = new Map();
    const timestamp = this._timestampForFilename();
    const slug = `mots-croises-${timestamp}`;

    for (const [key, solution] of this.placer.grid) {
      const [r, c] = key.split(',').map(Number);
      const relRow = r - b.minR;
      const relCol = c - b.minC;
      const cell = {
        key: `${relRow}-${relCol}`,
        row: relRow,
        col: relCol,
        solution,
        number: starts.get(key) || null,
        across: null,
        down: null,
      };
      cells.push(cell);
      cellsByKey.set(cell.key, cell);
    }

    const clueSections = {
      H: this.placer.placed
        .filter(p => p.dir === 'H')
        .sort((a, b2) => a.number - b2.number)
        .map(p => ({
          id: `H-${p.number}`,
          number: p.number,
          clue: p.clue || p.text,
          answer: p.text,
          row: p.row - b.minR,
          col: p.col - b.minC,
          length: p.text.length,
          cells: Array.from({ length: p.text.length }, (_, i) => `${p.row - b.minR}-${p.col - b.minC + i}`),
        })),
      V: this.placer.placed
        .filter(p => p.dir === 'V')
        .sort((a, b2) => a.number - b2.number)
        .map(p => ({
          id: `V-${p.number}`,
          number: p.number,
          clue: p.clue || p.text,
          answer: p.text,
          row: p.row - b.minR,
          col: p.col - b.minC,
          length: p.text.length,
          cells: Array.from({ length: p.text.length }, (_, i) => `${p.row - b.minR + i}-${p.col - b.minC}`),
        })),
    };

    clueSections.H.forEach(word => {
      word.cells.forEach(key => {
        const cell = cellsByKey.get(key);
        if (cell) cell.across = word.id;
      });
    });
    clueSections.V.forEach(word => {
      word.cells.forEach(key => {
        const cell = cellsByKey.get(key);
        if (cell) cell.down = word.id;
      });
    });

    return {
      slug,
      title: this._getCrosswordTitle(),
      generatedAt: new Date().toISOString(),
      blockColor: this.renderer.blockColor,
      clueHeadings: this._getClueHeadings(),
      rows,
      cols,
      cells: cells.sort((a, b2) => (a.row - b2.row) || (a.col - b2.col)),
      clues: clueSections,
    };
  }

  _getCrosswordTitle() {
    return sanitizeTitle(this.titleInput ? this.titleInput.value : '');
  }

  _getClueHeadings() {
    return {
      H: sanitizeClueHeading(this.hCluesHeading ? this.hCluesHeading.textContent : '', getDefaultClueHeading('H')),
      V: sanitizeClueHeading(this.vCluesHeading ? this.vCluesHeading.textContent : '', getDefaultClueHeading('V')),
    };
  }

  _syncClueHeadingsWithLanguage(lang) {
    const normalizedLang = normalizeSiteLang(lang);
    const headings = { H: this.hCluesHeading, V: this.vCluesHeading };

    Object.entries(headings).forEach(([dir, heading]) => {
      if (!heading) return;
      const current = sanitizeClueHeading(heading.textContent, '');
      const shouldUseDefault = !this._customClueHeadings[dir] || isDefaultClueHeading(dir, current);
      if (shouldUseDefault) {
        heading.textContent = getDefaultClueHeading(dir, normalizedLang);
        this._customClueHeadings[dir] = false;
      }
      const ariaLabel = CLUE_HEADING_ARIA_LABELS[normalizedLang]?.[dir] || CLUE_HEADING_ARIA_LABELS.fr[dir];
      heading.setAttribute('aria-label', ariaLabel);
    });
  }

  _buildInteractiveHTML(data) {
    const payload = JSON.stringify(data).replace(/</g, '\\u003c');
    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${_esc(data.title)}</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --surface: #ffffff;
      --surface-2: #eef2f7;
      --border: #d8dee8;
      --text-1: #1e2430;
      --text-2: #5a6474;
      --accent: #2f5bea;
      --accent-soft: #e9efff;
      --danger: #b42318;
      --success: #067647;
      --block: ${_esc(data.blockColor || '#18181b')};
      --cell: 42px;
      --radius: 16px;
      --shadow: 0 12px 30px rgba(21, 32, 56, .08);
      font-family: Inter, system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(47, 91, 234, .08), transparent 26%),
        linear-gradient(180deg, #fbfcff, var(--bg));
      color: var(--text-1);
      font: 15px/1.5 Inter, system-ui, sans-serif;
    }
    .page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 20px 40px;
    }
    .hero {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      margin-bottom: 10px;
      font-size: clamp(28px, 4vw, 40px);
      line-height: 1.02;
      letter-spacing: -.04em;
    }
    .meta {
      color: var(--text-2);
      font-size: 13px;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(320px, auto) minmax(280px, 360px);
      gap: 24px;
      align-items: start;
    }
    .card {
      background: color-mix(in srgb, var(--surface) 92%, white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .board {
      padding: 20px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
    }
    .btn {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-1);
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: transform .12s ease, border-color .18s ease, background .18s ease;
    }
    .btn:hover { transform: translateY(-1px); border-color: #bac6db; background: #fafcff; }
    .btn:active { transform: translateY(0); }
    .btn--accent { border-color: rgba(47, 91, 234, .28); background: var(--accent-soft); color: var(--accent); }
    .status {
      min-height: 22px;
      color: var(--text-2);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .status.is-error { color: var(--danger); }
    .status.is-success { color: var(--success); }
    .grid-wrap {
      overflow: auto;
      padding: 8px;
      border-radius: 20px;
      background: var(--block);
    }
    .grid {
      display: grid;
      gap: 1px;
      width: max-content;
      background: var(--block);
    }
    .cell {
      position: relative;
      width: var(--cell);
      height: var(--cell);
      background: #fff;
    }
    .cell.is-block { background: var(--block); }
    .cell.is-active { outline: 2px solid rgba(47, 91, 234, .95); outline-offset: -2px; z-index: 2; }
    .cell.is-word { background: #eef3ff; }
    .cell.is-correct input { color: var(--success); }
    .cell.is-wrong input { color: var(--danger); }
    .cell-num {
      position: absolute;
      top: 3px;
      left: 4px;
      font-size: 9px;
      line-height: 1;
      color: #6b7280;
      pointer-events: none;
    }
    .cell-input {
      width: 100%;
      height: 100%;
      border: 0;
      padding: 0;
      text-align: center;
      font: 700 22px/1 Inter, system-ui, sans-serif;
      text-transform: uppercase;
      color: #111827;
      background: transparent;
      outline: none;
      caret-color: transparent;
    }
    .sidebar {
      padding: 20px;
      position: sticky;
      top: 16px;
    }
    .sidebar h2 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--text-2);
      margin: 0 0 12px;
    }
    .clue-section + .clue-section { margin-top: 22px; }
    .clue-list {
      display: grid;
      gap: 8px;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .clue-btn {
      width: 100%;
      text-align: left;
      border: 1px solid transparent;
      background: transparent;
      border-radius: 12px;
      padding: 8px 10px;
      font: inherit;
      color: var(--text-1);
      cursor: pointer;
      transition: background .16s ease, border-color .16s ease, transform .12s ease;
    }
    .clue-btn:hover { background: #f7f9fc; border-color: var(--border); transform: translateX(1px); }
    .clue-btn.is-active { background: var(--accent-soft); border-color: rgba(47, 91, 234, .22); }
    .clue-num {
      display: inline-block;
      min-width: 24px;
      color: var(--accent);
      font-weight: 700;
    }
    .legend {
      margin-top: 18px;
      color: var(--text-2);
      font-size: 13px;
    }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { position: static; }
      .hero { align-items: start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <div>
        <h1>${_esc(data.title)}</h1>
        <div class="meta">Grille interactive exportée le ${_esc(new Date(data.generatedAt).toLocaleString('fr-FR'))}</div>
      </div>
    </header>

    <section class="layout">
      <div class="card board">
        <div class="toolbar">
          <button class="btn btn--accent" type="button" id="checkBtn">Vérifier</button>
          <button class="btn" type="button" id="clearBtn">Réinitialiser</button>
          <button class="btn" type="button" id="revealBtn">Révéler la solution</button>
        </div>
        <div class="status" id="status">Cliquez sur une définition ou une case pour commencer.</div>
        <div class="grid-wrap">
          <div class="grid" id="grid" aria-label="Grille de mots croisés"></div>
        </div>
      </div>

      <aside class="card sidebar">
        <section class="clue-section">
          <h2 id="cluesHeadingH">${_esc(data.clueHeadings?.H || 'Horizontalement')}</h2>
          <ol class="clue-list" id="cluesH"></ol>
        </section>
        <section class="clue-section">
          <h2 id="cluesHeadingV">${_esc(data.clueHeadings?.V || 'Verticalement')}</h2>
          <ol class="clue-list" id="cluesV"></ol>
        </section>
        <p class="legend">Astuce: utilisez les flèches du clavier pour naviguer et cliquez une deuxième fois sur une case croisée pour changer de direction.</p>
      </aside>
    </section>
  </main>

  <script id="crossword-data" type="application/json">${payload}</script>
  <script>
    (() => {
      const data = JSON.parse(document.getElementById('crossword-data').textContent);
      const gridEl = document.getElementById('grid');
      const cluesH = document.getElementById('cluesH');
      const cluesV = document.getElementById('cluesV');
      const statusEl = document.getElementById('status');
      const cellMap = new Map(data.cells.map(cell => [cell.key, cell]));
      const inputMap = new Map();
      const clueMap = new Map();
      let activeWordId = data.clues.H[0]?.id || data.clues.V[0]?.id || null;
      let activeDir = activeWordId ? activeWordId[0] : 'H';

      gridEl.style.gridTemplateColumns = 'repeat(' + data.cols + ', var(--cell))';

      const setStatus = (message, tone = '') => {
        statusEl.textContent = message;
        statusEl.className = 'status' + (tone ? ' is-' + tone : '');
      };

      const wordsById = new Map([...data.clues.H, ...data.clues.V].map(word => [word.id, word]));

      const renderGrid = () => {
        for (let row = 0; row < data.rows; row++) {
          for (let col = 0; col < data.cols; col++) {
            const key = row + '-' + col;
            const cell = cellMap.get(key);
            const cellEl = document.createElement('div');
            cellEl.className = 'cell' + (cell ? '' : ' is-block');
            cellEl.dataset.key = key;

            if (!cell) {
              gridEl.appendChild(cellEl);
              continue;
            }

            if (cell.number) {
              const numberEl = document.createElement('span');
              numberEl.className = 'cell-num';
              numberEl.textContent = cell.number;
              cellEl.appendChild(numberEl);
            }

            const input = document.createElement('input');
            input.className = 'cell-input';
            input.maxLength = 1;
            input.autocomplete = 'off';
            input.autocapitalize = 'characters';
            input.spellcheck = false;
            input.setAttribute('aria-label', 'Case ' + (row + 1) + ',' + (col + 1));
            input.dataset.key = key;
            input.addEventListener('focus', () => {
              const preferred = activeDir === 'V' ? cell.down || cell.across : cell.across || cell.down;
              activeWordId = preferred || cell.across || cell.down;
              activeDir = activeWordId ? activeWordId[0] : activeDir;
              highlight();
            });
            input.addEventListener('click', () => {
              if (cell.across && cell.down) {
                const next = activeDir === 'H' ? cell.down : cell.across;
                activeWordId = next;
                activeDir = activeWordId[0];
              } else {
                activeWordId = cell.across || cell.down;
                activeDir = activeWordId ? activeWordId[0] : activeDir;
              }
              highlight();
            });
            input.addEventListener('input', e => {
              e.target.value = (e.target.value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
              clearEvaluationState();
              moveToNext(key);
            });
            input.addEventListener('keydown', e => {
              if (e.key === 'Backspace' && !e.target.value) {
                e.preventDefault();
                moveToPrev(key);
                return;
              }
              if (e.key === 'ArrowRight') { e.preventDefault(); moveByOffset(key, 0, 1, 'H'); }
              if (e.key === 'ArrowLeft')  { e.preventDefault(); moveByOffset(key, 0, -1, 'H'); }
              if (e.key === 'ArrowDown')  { e.preventDefault(); moveByOffset(key, 1, 0, 'V'); }
              if (e.key === 'ArrowUp')    { e.preventDefault(); moveByOffset(key, -1, 0, 'V'); }
            });
            cellEl.appendChild(input);
            inputMap.set(key, input);
            gridEl.appendChild(cellEl);
          }
        }
      };

      const renderClues = (dir, container) => {
        data.clues[dir].forEach(word => {
          const item = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'clue-btn';
          button.innerHTML = '<span class="clue-num">' + word.number + '.</span> ' + escapeHtml(word.clue);
          button.addEventListener('click', () => {
            activeWordId = word.id;
            activeDir = dir;
            highlight();
            focusCell(word.cells[0]);
          });
          clueMap.set(word.id, button);
          item.appendChild(button);
          container.appendChild(item);
        });
      };

      const escapeHtml = value => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      const clearEvaluationState = () => {
        gridEl.querySelectorAll('.cell').forEach(cell => {
          cell.classList.remove('is-correct', 'is-wrong');
        });
        if (statusEl.classList.contains('is-error') || statusEl.classList.contains('is-success')) {
          setStatus('Continuez la grille.');
        }
      };

      const focusCell = key => {
        const input = inputMap.get(key);
        if (input) input.focus();
      };

      const moveByOffset = (key, dRow, dCol, dir) => {
        activeDir = dir;
        const cell = cellMap.get(key);
        if (!cell) return;
        let row = cell.row + dRow;
        let col = cell.col + dCol;
        while (row >= 0 && row < data.rows && col >= 0 && col < data.cols) {
          const nextKey = row + '-' + col;
          if (inputMap.has(nextKey)) {
            focusCell(nextKey);
            return;
          }
          row += dRow;
          col += dCol;
        }
      };

      const moveWithinWord = (key, step) => {
        const word = wordsById.get(activeWordId);
        if (!word) return;
        const index = word.cells.indexOf(key);
        const nextKey = word.cells[index + step];
        if (nextKey) focusCell(nextKey);
      };

      const moveToNext = key => moveWithinWord(key, 1);
      const moveToPrev = key => moveWithinWord(key, -1);

      const highlight = () => {
        gridEl.querySelectorAll('.cell').forEach(cell => {
          cell.classList.remove('is-active', 'is-word');
        });
        clueMap.forEach(button => button.classList.remove('is-active'));

        const word = wordsById.get(activeWordId);
        if (!word) return;

        word.cells.forEach(key => {
          const cellEl = gridEl.querySelector('.cell[data-key="' + key + '"]');
          if (cellEl) cellEl.classList.add('is-word');
        });
        const focused = document.activeElement?.dataset?.key;
        if (focused && word.cells.includes(focused)) {
          const activeCell = gridEl.querySelector('.cell[data-key="' + focused + '"]');
          if (activeCell) activeCell.classList.add('is-active');
        } else {
          const firstCell = gridEl.querySelector('.cell[data-key="' + word.cells[0] + '"]');
          if (firstCell) firstCell.classList.add('is-active');
        }
        const clueBtn = clueMap.get(word.id);
        if (clueBtn) clueBtn.classList.add('is-active');
      };

      const evaluate = () => {
        let filled = 0;
        let correct = 0;
        data.cells.forEach(cell => {
          const input = inputMap.get(cell.key);
          const cellEl = input?.parentElement;
          if (!input || !cellEl) return;
          cellEl.classList.remove('is-correct', 'is-wrong');
          if (!input.value) return;
          filled++;
          if (input.value === cell.solution) {
            correct++;
            cellEl.classList.add('is-correct');
          } else {
            cellEl.classList.add('is-wrong');
          }
        });

        if (!filled) {
          setStatus('Remplissez au moins une case avant de vérifier.', 'error');
          return;
        }
        if (correct === data.cells.length && filled === data.cells.length) {
          setStatus('Grille complète et correcte.', 'success');
          return;
        }
        setStatus(correct + ' case' + (correct > 1 ? 's' : '') + ' correcte' + (correct > 1 ? 's' : '') + ' sur ' + data.cells.length + '.', 'error');
      };

      document.getElementById('checkBtn').addEventListener('click', evaluate);
      document.getElementById('clearBtn').addEventListener('click', () => {
        inputMap.forEach(input => { input.value = ''; });
        clearEvaluationState();
        setStatus('Grille réinitialisée.');
        const firstWord = wordsById.get(activeWordId) || data.clues.H[0] || data.clues.V[0];
        if (firstWord) focusCell(firstWord.cells[0]);
      });
      document.getElementById('revealBtn').addEventListener('click', () => {
        data.cells.forEach(cell => {
          const input = inputMap.get(cell.key);
          if (input) input.value = cell.solution;
        });
        clearEvaluationState();
        setStatus('Solution affichée.', 'success');
      });

      renderGrid();
      renderClues('H', cluesH);
      renderClues('V', cluesV);
      highlight();
      const firstWord = wordsById.get(activeWordId) || data.clues.H[0] || data.clues.V[0];
      if (firstWord) focusCell(firstWord.cells[0]);
    })();
  </script>
</body>
</html>`;
  }

  _timestampForFilename() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      '-',
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join('');
  }

  _shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' },
    ], { duration: 300, easing: 'ease-in-out' });
  }

  _showToast(msg) {
    clearTimeout(this._toastTimer);
    this.toast.textContent = msg;
    this.toast.classList.add('is-visible');
    this._toastTimer = setTimeout(() => {
      this.toast.classList.remove('is-visible');
    }, 3000);
  }
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function _esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  window._app = new CrosswordApp();
});
