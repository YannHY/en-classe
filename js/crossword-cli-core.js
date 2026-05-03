'use strict';

function normalize(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

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

function parseImportText(raw) {
  const lines = String(raw || '').split(/\r?\n/);
  const words = [];
  let currentDir = 'H';

  for (let index = 0; index < lines.length; index++) {
    let line = lines[index];
    line = line.trim();
    if (!line) continue;

    line = line.replace(/^[-*•]\s+/, '');
    line = line.replace(/^\d+[.)]\s*/, '');
    if (!line) continue;

    const lineUp = line.toUpperCase().replace(/[#\-_*>\s]/g, '');
    if (/^(MOTS?)?HORIZONT/.test(lineUp)) {
      currentDir = 'H';
      continue;
    }
    if (/^(MOTS?)?VERTIC/.test(lineUp)) {
      currentDir = 'V';
      continue;
    }

    // ── Format pédagogique sur 2 lignes ─────────────────────
    // PRIS (4 lettres)
    // Définition : PRENDRE — Il a ............ la route.
    const educationalWord = line.match(/^(.+?)\s*\((\d+)\s+lettres?\)$/i);
    if (educationalWord) {
      const text = normalize(educationalWord[1]);
      const expectedLength = Number.parseInt(educationalWord[2], 10);
      let clue = '';
      const nextLine = index + 1 < lines.length ? lines[index + 1].trim() : '';
      const definitionLine = nextLine.match(/^Définition\s*[:\-–—]\s*(.*)$/i);

      if (definitionLine) {
        clue = definitionLine[1].trim();
        index += 1;
      }

      if (text.length >= 2) {
        if (!Number.isNaN(expectedLength) && expectedLength !== text.length) {
          // On garde le mot même si l'indication de longueur ne correspond pas.
          words.push({ text, dir: currentDir, clue });
          continue;
        }
        words.push({ text, dir: currentDir, clue });
        continue;
      }
    }

    const sep = line.includes(';') ? ';' : ',';
    const parts = line.split(sep).map((part) => part.trim());

    if (parts.length >= 2) {
      if (parts.length >= 3 && /^[HhVv]$/.test(parts[1])) {
        const text = normalize(parts[0]);
        if (text.length >= 2) {
          words.push({ text, dir: parts[1].toUpperCase(), clue: parts.slice(2).join(sep).trim() });
          continue;
        }
      }

      const maybeWord = normalize(parts[0]);
      if (maybeWord.length >= 2 && !/\s/.test(parts[0])) {
        words.push({ text: maybeWord, dir: currentDir, clue: parts.slice(1).join(sep).trim() });
        continue;
      }
    }

    const dirInline = line.match(/^([HhVv])\s+(.+)$/);
    if (dirInline) {
      const dir = dirInline[1].toUpperCase();
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

    const wordClue = line.match(/^([A-Za-zÀ-ÿ]+)\s*[:\-–—]\s*(.*)$/);
    if (wordClue) {
      const text = normalize(wordClue[1]);
      if (text.length >= 2) {
        words.push({ text, dir: currentDir, clue: wordClue[2].trim() });
        continue;
      }
    }

    const single = normalize(line.split(/\s/)[0]);
    if (single.length >= 2) {
      words.push({ text: single, dir: currentDir, clue: '' });
    }
  }

  return words;
}

class CrosswordPlacer {
  constructor() {
    this.grid = new Map();
    this.cellDirs = new Map();
    this.placed = [];
    this._unplacedCount = 0;
  }

  _key(row, col) {
    return `${row},${col}`;
  }

  canPlace(word, dir, row, col) {
    const n = word.length;
    const beforeKey = dir === 'H' ? this._key(row, col - 1) : this._key(row - 1, col);
    if (this.grid.has(beforeKey)) return false;

    const afterKey = dir === 'H' ? this._key(row, col + n) : this._key(row + n, col);
    if (this.grid.has(afterKey)) return false;

    for (let k = 0; k < n; k++) {
      const r = row + (dir === 'V' ? k : 0);
      const c = col + (dir === 'H' ? k : 0);
      const key = this._key(r, c);

      if (this.grid.has(key)) {
        if (this.grid.get(key) !== word[k]) return false;
        const dirs = this.cellDirs.get(key);
        if (dirs && dirs.has(dir)) return false;
      } else if (dir === 'H') {
        if (this.grid.has(this._key(r - 1, c)) || this.grid.has(this._key(r + 1, c))) return false;
      } else if (this.grid.has(this._key(r, c - 1)) || this.grid.has(this._key(r, c + 1))) {
        return false;
      }
    }

    return true;
  }

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

  _scorePos(word, dir, row, col) {
    let score = 0;
    for (let k = 0; k < word.length; k++) {
      const r = row + (dir === 'V' ? k : 0);
      const c = col + (dir === 'H' ? k : 0);
      if (this.grid.has(this._key(r, c))) score++;
    }
    return score;
  }

  _bounds() {
    if (!this.grid.size) return { minR: 0, maxR: 0, minC: 0, maxC: 0 };
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;

    for (const key of this.grid.keys()) {
      const [r, c] = key.split(',').map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }

    return { minR, maxR, minC, maxC };
  }

  _distToCenter(row, col) {
    const bounds = this._bounds();
    const centerRow = (bounds.minR + bounds.maxR) / 2;
    const centerCol = (bounds.minC + bounds.maxC) / 2;
    return Math.abs(row - centerRow) + Math.abs(col - centerCol);
  }

  _findBestPosition(word, dir) {
    let best = null;
    let bestScore = -Infinity;

    for (const placedWord of this.placed) {
      if (placedWord.dir === dir) continue;

      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < placedWord.text.length; j++) {
          if (word[i] !== placedWord.text[j]) continue;

          let row;
          let col;

          if (dir === 'H') {
            row = placedWord.row + j;
            col = placedWord.col - i;
          } else {
            row = placedWord.row - i;
            col = placedWord.col + j;
          }

          if (!this.canPlace(word, dir, row, col)) continue;

          const intersections = this._scorePos(word, dir, row, col);
          const distance = this._distToCenter(row, col);
          const bounds = this._bounds();
          const gridW = bounds.maxC - bounds.minC + 1 || 1;
          const gridH = bounds.maxR - bounds.minR + 1 || 1;
          const aspect = gridW / gridH;
          let aspectBonus = 0;

          if (dir === 'H' && aspect < 0.85) {
            const wordRight = col + word.length - 1;
            aspectBonus = Math.max(0, wordRight - bounds.maxC) * 25;
          } else if (dir === 'V' && aspect > 1.15) {
            const wordBottom = row + word.length - 1;
            aspectBonus = Math.max(0, wordBottom - bounds.maxR) * 25;
          }

          const score = intersections * 1000 + aspectBonus - distance;
          if (score > bestScore) {
            bestScore = score;
            best = { row, col };
          }
        }
      }
    }

    return best;
  }

  _placeSolo(word, dir) {
    const bounds = this._bounds();
    const gap = 2;
    const candidates = [];

    if (dir === 'H') {
      for (let col = bounds.minC; col <= bounds.maxC - word.length + 1; col++) {
        candidates.push({ row: bounds.maxR + gap, col });
      }
      candidates.push({ row: bounds.maxR + gap, col: bounds.minC });
    } else {
      for (let row = bounds.minR; row <= bounds.maxR - word.length + 1; row++) {
        candidates.push({ row, col: bounds.maxC + gap });
      }
      candidates.push({ row: bounds.minR, col: bounds.maxC + gap });
    }

    for (const candidate of candidates) {
      if (this.canPlace(word, dir, candidate.row, candidate.col)) return candidate;
    }

    return {
      row: dir === 'H' ? bounds.maxR + gap : bounds.minR,
      col: dir === 'H' ? bounds.minC : bounds.maxC + gap,
    };
  }

  _assignNumbers() {
    const starts = new Map();
    const sorted = [...this.placed].sort((a, b) => (a.row - b.row) || (a.col - b.col));
    let nextNumber = 1;

    for (const placedWord of sorted) {
      const key = this._key(placedWord.row, placedWord.col);
      if (!starts.has(key)) starts.set(key, nextNumber++);
      placedWord.number = starts.get(key);
    }
  }

  generate(wordsInput) {
    if (!Array.isArray(wordsInput) || !wordsInput.length) return [];

    const words = wordsInput
      .map((word) => ({
        text: normalize(word.text),
        dir: String(word.dir || 'H').charAt(0).toUpperCase(),
        clue: word.clue || '',
      }))
      .filter((word) => word.text.length >= 2);

    if (!words.length) return [];

    const hWords = words.filter((word) => word.dir === 'H').sort((a, b) => b.text.length - a.text.length);
    const vWords = words.filter((word) => word.dir === 'V').sort((a, b) => b.text.length - a.text.length);

    if (!hWords.length) {
      vWords.forEach((word, index) => {
        if (index % 2 === 0) word.dir = 'H';
      });
      hWords.push(...vWords.filter((word) => word.dir === 'H'));
      vWords.splice(0, vWords.length, ...vWords.filter((word) => word.dir === 'V'));
    } else if (!vWords.length) {
      hWords.forEach((word, index) => {
        if (index % 2 === 1) word.dir = 'V';
      });
      vWords.push(...hWords.filter((word) => word.dir === 'V'));
      hWords.splice(0, hWords.length, ...hWords.filter((word) => word.dir === 'H'));
    }

    const canonical = [];
    const maxLen = Math.max(hWords.length, vWords.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < hWords.length) canonical.push(hWords[i]);
      if (i < vWords.length) canonical.push(vWords[i]);
    }

    const attempts = 14;
    const maxPasses = 7;
    let bestGrid = null;
    let bestCellDirs = null;
    let bestPlaced = null;
    let bestUnplacedWords = canonical.slice(1);
    let bestUnplacedCount = Infinity;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const order = attempt === 0
        ? [...canonical]
        : [canonical[0], ...canonical.slice(1).sort(() => Math.random() - 0.5)];

      this.grid.clear();
      this.cellDirs.clear();
      this.placed = [];

      const first = order[0];
      this._doPlace(first.text, first.dir, 0, 0);
      this.placed.push({ text: first.text, dir: first.dir, clue: first.clue, row: 0, col: 0, number: 0 });

      const unplaced = order.slice(1);
      for (let pass = 0; pass < maxPasses && unplaced.length; pass++) {
        const stillUnplaced = [];
        for (const word of unplaced) {
          const pos = this._findBestPosition(word.text, word.dir);
          if (pos) {
            this._doPlace(word.text, word.dir, pos.row, pos.col);
            this.placed.push({ text: word.text, dir: word.dir, clue: word.clue, row: pos.row, col: pos.col, number: 0 });
          } else {
            stillUnplaced.push(word);
          }
        }
        unplaced.length = 0;
        unplaced.push(...stillUnplaced);
      }

      const toFlip = [...unplaced];
      unplaced.length = 0;
      for (const word of toFlip) {
        const flippedDir = word.dir === 'H' ? 'V' : 'H';
        const pos = this._findBestPosition(word.text, flippedDir);
        if (pos) {
          this._doPlace(word.text, flippedDir, pos.row, pos.col);
          this.placed.push({ text: word.text, dir: flippedDir, clue: word.clue, row: pos.row, col: pos.col, number: 0 });
        } else {
          unplaced.push(word);
        }
      }

      if (unplaced.length < bestUnplacedCount) {
        bestUnplacedCount = unplaced.length;
        bestUnplacedWords = [...unplaced];
        bestGrid = new Map(this.grid);
        bestCellDirs = new Map(this.cellDirs);
        bestPlaced = this.placed.map((placedWord) => ({ ...placedWord }));
        if (bestUnplacedCount === 0) break;
      }
    }

    this.grid = bestGrid || new Map();
    this.cellDirs = bestCellDirs || new Map();
    this.placed = bestPlaced || [];

    for (const word of bestUnplacedWords) {
      const pos = this._placeSolo(word.text, word.dir);
      this._doPlace(word.text, word.dir, pos.row, pos.col);
      this.placed.push({ text: word.text, dir: word.dir, clue: word.clue, row: pos.row, col: pos.col, number: 0 });
    }

    this._assignNumbers();
    this._unplacedCount = bestUnplacedWords.length;
    return this.placed;
  }

  bounds() {
    return this._bounds();
  }
}

function buildCrosswordPayload(words, options = {}) {
  const placer = new CrosswordPlacer();
  const placed = placer.generate(words);
  if (!placed.length) {
    throw new Error('Impossible de générer une grille à partir de cette liste.');
  }

  const bounds = placer.bounds();
  const rows = bounds.maxR - bounds.minR + 1;
  const cols = bounds.maxC - bounds.minC + 1;
  const starts = new Map(placer.placed.map((word) => [`${word.row},${word.col}`, word.number]));
  const cells = [];
  const cellsByKey = new Map();

  for (const [key, solution] of placer.grid) {
    const [row, col] = key.split(',').map(Number);
    const relRow = row - bounds.minR;
    const relCol = col - bounds.minC;
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

  const clues = {
    H: placer.placed
      .filter((word) => word.dir === 'H')
      .sort((a, b) => a.number - b.number)
      .map((word) => ({
        id: `H-${word.number}`,
        number: word.number,
        clue: word.clue || word.text,
        answer: word.text,
        row: word.row - bounds.minR,
        col: word.col - bounds.minC,
        length: word.text.length,
        cells: Array.from({ length: word.text.length }, (_, i) => `${word.row - bounds.minR}-${word.col - bounds.minC + i}`),
      })),
    V: placer.placed
      .filter((word) => word.dir === 'V')
      .sort((a, b) => a.number - b.number)
      .map((word) => ({
        id: `V-${word.number}`,
        number: word.number,
        clue: word.clue || word.text,
        answer: word.text,
        row: word.row - bounds.minR,
        col: word.col - bounds.minC,
        length: word.text.length,
        cells: Array.from({ length: word.text.length }, (_, i) => `${word.row - bounds.minR + i}-${word.col - bounds.minC}`),
      })),
  };

  for (const word of clues.H) {
    for (const key of word.cells) {
      const cell = cellsByKey.get(key);
      if (cell) cell.across = word.id;
    }
  }

  for (const word of clues.V) {
    for (const key of word.cells) {
      const cell = cellsByKey.get(key);
      if (cell) cell.down = word.id;
    }
  }

  return {
    title: String(options.title || 'Mots Croisés'),
    generatedAt: new Date().toISOString(),
    blockColor: sanitizeColor(options.blockColor || '#18181b'),
    rows,
    cols,
    cells: cells.sort((a, b) => (a.row - b.row) || (a.col - b.col)),
    clues,
  };
}

module.exports = {
  CrosswordPlacer,
  buildCrosswordPayload,
  normalize,
  parseImportText,
  sanitizeColor,
};
