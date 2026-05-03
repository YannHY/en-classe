'use strict';

async function loadCrosswordData() {
  const dataNode = document.getElementById('crossword-data');
  if (!dataNode) {
    throw new Error('Crossword data node not found.');
  }

  const source = dataNode.dataset.crosswordSrc;
  if (!source) {
    throw new Error('Crossword data source is missing.');
  }

  const response = await fetch(source, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to load crossword data: ${response.status}`);
  }

  return response.json();
}

function renderPublishedCrossword(data) {
  const gridEl = document.getElementById('grid');
  const cluesH = document.getElementById('cluesH');
  const cluesV = document.getElementById('cluesV');
  const statusEl = document.getElementById('status');
  const cellMap = new Map(data.cells.map((cell) => [cell.key, cell]));
  const inputMap = new Map();
  const clueMap = new Map();
  let activeWordId = data.clues.H[0]?.id || data.clues.V[0]?.id || null;
  let activeDir = activeWordId ? activeWordId[0] : 'H';

  gridEl.style.gridTemplateColumns = `repeat(${data.cols}, var(--cell))`;

  const setStatus = (message, tone = '') => {
    statusEl.textContent = message;
    statusEl.className = `status${tone ? ` is-${tone}` : ''}`;
  };

  const wordsById = new Map([...data.clues.H, ...data.clues.V].map((word) => [word.id, word]));

  const clearEvaluationState = () => {
    gridEl.querySelectorAll('.cell').forEach((cell) => {
      cell.classList.remove('is-correct', 'is-wrong');
    });
    if (statusEl.classList.contains('is-error') || statusEl.classList.contains('is-success')) {
      setStatus('Continuez la grille.');
    }
  };

  const focusCell = (key) => {
    const input = inputMap.get(key);
    if (input) {
      input.focus();
    }
  };

  const moveByOffset = (key, dRow, dCol, dir) => {
    activeDir = dir;
    const cell = cellMap.get(key);
    if (!cell) {
      return;
    }
    let row = cell.row + dRow;
    let col = cell.col + dCol;

    while (row >= 0 && row < data.rows && col >= 0 && col < data.cols) {
      const nextKey = `${row}-${col}`;
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
    if (!word) {
      return;
    }
    const index = word.cells.indexOf(key);
    const nextKey = word.cells[index + step];
    if (nextKey) {
      focusCell(nextKey);
    }
  };

  const moveToNext = (key) => moveWithinWord(key, 1);
  const moveToPrev = (key) => moveWithinWord(key, -1);

  const highlight = () => {
    gridEl.querySelectorAll('.cell').forEach((cell) => {
      cell.classList.remove('is-active', 'is-word');
    });
    clueMap.forEach((button) => button.classList.remove('is-active'));

    const word = wordsById.get(activeWordId);
    if (!word) {
      return;
    }

    word.cells.forEach((key) => {
      const cellEl = gridEl.querySelector(`.cell[data-key="${key}"]`);
      if (cellEl) {
        cellEl.classList.add('is-word');
      }
    });

    const focused = document.activeElement?.dataset?.key;
    if (focused && word.cells.includes(focused)) {
      const activeCell = gridEl.querySelector(`.cell[data-key="${focused}"]`);
      if (activeCell) {
        activeCell.classList.add('is-active');
      }
    } else {
      const firstCell = gridEl.querySelector(`.cell[data-key="${word.cells[0]}"]`);
      if (firstCell) {
        firstCell.classList.add('is-active');
      }
    }

    const clueButton = clueMap.get(word.id);
    if (clueButton) {
      clueButton.classList.add('is-active');
    }
  };

  const renderGrid = () => {
    for (let row = 0; row < data.rows; row += 1) {
      for (let col = 0; col < data.cols; col += 1) {
        const key = `${row}-${col}`;
        const cell = cellMap.get(key);
        const cellEl = document.createElement('div');
        cellEl.className = `cell${cell ? '' : ' is-block'}`;
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
        input.setAttribute('aria-label', `Case ${row + 1},${col + 1}`);
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
        input.addEventListener('input', (event) => {
          event.target.value = (event.target.value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
          clearEvaluationState();
          moveToNext(key);
        });
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Backspace' && !event.target.value) {
            event.preventDefault();
            moveToPrev(key);
            return;
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveByOffset(key, 0, 1, 'H');
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveByOffset(key, 0, -1, 'H');
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveByOffset(key, 1, 0, 'V');
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveByOffset(key, -1, 0, 'V');
          }
        });

        cellEl.appendChild(input);
        inputMap.set(key, input);
        gridEl.appendChild(cellEl);
      }
    }
  };

  const renderClues = (dir, container) => {
    data.clues[dir].forEach((word) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      const clueNumber = document.createElement('span');
      const clueText = document.createElement('span');

      button.type = 'button';
      button.className = 'clue-btn';
      clueNumber.className = 'clue-num';
      clueNumber.textContent = `${word.number}.`;
      clueText.textContent = word.clue;

      button.appendChild(clueNumber);
      button.appendChild(document.createTextNode(' '));
      button.appendChild(clueText);
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

  const evaluate = () => {
    let filled = 0;
    let correct = 0;

    data.cells.forEach((cell) => {
      const input = inputMap.get(cell.key);
      const cellEl = input?.parentElement;
      if (!input || !cellEl) {
        return;
      }
      cellEl.classList.remove('is-correct', 'is-wrong');
      if (!input.value) {
        return;
      }
      filled += 1;
      if (input.value === cell.solution) {
        correct += 1;
        cellEl.classList.add('is-correct');
      } else {
        cellEl.classList.add('is-wrong');
      }
    });

    if (!filled) {
      setStatus('Remplissez au moins une case avant de verifier.', 'error');
      return;
    }

    if (correct === data.cells.length && filled === data.cells.length) {
      setStatus('Grille complete et correcte.', 'success');
      return;
    }

    setStatus(`${correct} case${correct > 1 ? 's' : ''} correcte${correct > 1 ? 's' : ''} sur ${data.cells.length}.`, 'error');
  };

  document.getElementById('checkBtn').addEventListener('click', evaluate);
  document.getElementById('clearBtn').addEventListener('click', () => {
    inputMap.forEach((input) => {
      input.value = '';
    });
    clearEvaluationState();
    setStatus('Grille reinitialisee.');
    const firstWord = wordsById.get(activeWordId) || data.clues.H[0] || data.clues.V[0];
    if (firstWord) {
      focusCell(firstWord.cells[0]);
    }
  });
  document.getElementById('revealBtn').addEventListener('click', () => {
    data.cells.forEach((cell) => {
      const input = inputMap.get(cell.key);
      if (input) {
        input.value = cell.solution;
      }
    });
    clearEvaluationState();
    setStatus('Solution affichee.', 'success');
  });

  renderGrid();
  renderClues('H', cluesH);
  renderClues('V', cluesV);
  highlight();
  const firstWord = wordsById.get(activeWordId) || data.clues.H[0] || data.clues.V[0];
  if (firstWord) {
    focusCell(firstWord.cells[0]);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadCrosswordData();
    renderPublishedCrossword(data);
  } catch (error) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'Impossible de charger cette grille.';
      statusEl.className = 'status is-error';
    }
    console.error(error);
  }
});
