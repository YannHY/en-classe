(function () {
    "use strict";

    var MAX_ROWS = 8;
    var MAX_COLS = 10;
    var tableBtn = document.getElementById('insertTableBtn');
    var notesArea = document.querySelector('.notes-area');
    var popup = null;

    if (!tableBtn || !notesArea) return;

    function closePopup() {
        if (popup) {
            popup.remove();
            popup = null;
        }
    }

    function insertTable(rows, cols) {
        notesArea.focus();
        var html = '<table class="notes-inserted-table"><tbody>';
        for (var r = 0; r < rows; r++) {
            html += '<tr>';
            for (var c = 0; c < cols; c++) {
                html += '<td>&nbsp;</td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table><p><br></p>';
        document.execCommand('insertHTML', false, html);
        if (window.saveNotesContent) window.saveNotesContent();
    }

    function showPopup() {
        if (popup) { closePopup(); return; }

        popup = document.createElement('div');
        popup.className = 'notes-table-popup';

        var btnRect = tableBtn.getBoundingClientRect();
        popup.style.position = 'absolute';
        popup.style.zIndex = '9999';
        popup.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';

        var leftPos = btnRect.left + window.scrollX;
        var popupWidth = MAX_COLS * 26 + 20;
        if (leftPos + popupWidth > window.innerWidth) {
            leftPos = window.innerWidth - popupWidth - 10;
        }
        popup.style.left = Math.max(10, leftPos) + 'px';

        var label = document.createElement('div');
        label.className = 'notes-table-label';
        label.textContent = 'Choisir la taille';

        var grid = document.createElement('div');
        grid.className = 'notes-table-grid';

        var cells = [];

        for (var r = 0; r < MAX_ROWS; r++) {
            for (var c = 0; c < MAX_COLS; c++) {
                var cell = document.createElement('div');
                cell.className = 'notes-table-cell';
                cell.setAttribute('data-row', r);
                cell.setAttribute('data-col', c);
                grid.appendChild(cell);
                cells.push(cell);
            }
        }

        grid.addEventListener('mouseover', function (e) {
            var target = e.target.closest('.notes-table-cell');
            if (!target) return;
            var hoverRow = parseInt(target.getAttribute('data-row'));
            var hoverCol = parseInt(target.getAttribute('data-col'));
            label.textContent = (hoverRow + 1) + ' × ' + (hoverCol + 1);

            cells.forEach(function (c) {
                var cr = parseInt(c.getAttribute('data-row'));
                var cc = parseInt(c.getAttribute('data-col'));
                c.classList.toggle('highlighted', cr <= hoverRow && cc <= hoverCol);
            });
        });

        grid.addEventListener('click', function (e) {
            var target = e.target.closest('.notes-table-cell');
            if (!target) return;
            var rows = parseInt(target.getAttribute('data-row')) + 1;
            var cols = parseInt(target.getAttribute('data-col')) + 1;
            closePopup();
            insertTable(rows, cols);
        });

        popup.appendChild(grid);
        popup.appendChild(label);
        document.body.appendChild(popup);
    }

    tableBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showPopup();
    });

    document.addEventListener('click', function (e) {
        if (popup && !popup.contains(e.target) && e.target !== tableBtn) {
            closePopup();
        }
    });

    // Tab key navigation in tables
    notesArea.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var sel = window.getSelection();
        if (!sel.anchorNode) return;

        var td = sel.anchorNode.nodeType === 1
            ? sel.anchorNode.closest('td')
            : sel.anchorNode.parentElement.closest('td');
        if (!td) return;

        e.preventDefault();
        var row = td.parentElement;
        var table = row.closest('table');
        if (!table) return;

        var allCells = Array.from(table.querySelectorAll('td'));
        var idx = allCells.indexOf(td);

        var nextIdx;
        if (e.shiftKey) {
            nextIdx = idx > 0 ? idx - 1 : allCells.length - 1;
        } else {
            nextIdx = idx < allCells.length - 1 ? idx + 1 : 0;
        }

        var nextCell = allCells[nextIdx];
        if (nextCell) {
            var range = document.createRange();
            range.selectNodeContents(nextCell);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });
})();
