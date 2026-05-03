(function () {
    "use strict";

    var highlightColors = [
        '#FEF08A', '#FDE047', '#FACC15',
        '#BBF7D0', '#6EE7B7', '#34D399',
        '#FECDD3', '#FDA4AF', '#FB7185',
        '#BFDBFE', '#93C5FD', '#60A5FA',
        '#FED7AA', '#FDBA74', '#FB923C',
        'transparent'
    ];

    var highlightBtn = document.getElementById('highlight-color-btn');
    var notesArea = document.querySelector('.notes-area');
    var palette = null;
    var savedRange = null;

    if (!highlightBtn || !notesArea) return;

    function saveSelection() {
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
            savedRange = sel.getRangeAt(0);
        }
    }

    function restoreSelection() {
        if (savedRange) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange);
        }
    }

    function closePalette() {
        if (palette) {
            palette.remove();
            palette = null;
        }
    }

    function togglePalette() {
        if (palette) {
            closePalette();
            return;
        }

        saveSelection();

        palette = document.createElement('div');
        palette.className = 'notes-highlight-palette';

        var btnRect = highlightBtn.getBoundingClientRect();
        palette.style.position = 'absolute';
        palette.style.zIndex = '9999';
        palette.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';

        var leftPos = btnRect.left + window.scrollX;
        if (leftPos + 200 > window.innerWidth) {
            leftPos = window.innerWidth - 210;
        }
        palette.style.left = Math.max(10, leftPos) + 'px';

        // Build color grid
        var grid = document.createElement('div');
        grid.className = 'notes-highlight-grid';

        highlightColors.forEach(function (color) {
            var swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = 'notes-highlight-swatch';
            if (color === 'transparent') {
                swatch.innerHTML = '<i class="fas fa-ban" style="font-size:12px;color:var(--text-muted)"></i>';
                swatch.title = 'Supprimer le surlignage';
                swatch.style.border = '1px dashed var(--border-color)';
            } else {
                swatch.style.backgroundColor = color;
                swatch.title = color;
            }

            swatch.addEventListener('click', function () {
                restoreSelection();
                notesArea.focus();
                if (color === 'transparent') {
                    document.execCommand('removeFormat', false, null);
                } else {
                    document.execCommand('hiliteColor', false, color);
                }
                closePalette();
                if (window.saveNotesContent) window.saveNotesContent();
            });

            grid.appendChild(swatch);
        });

        palette.appendChild(grid);
        document.body.appendChild(palette);
    }

    highlightBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        togglePalette();
    });

    document.addEventListener('click', function (e) {
        if (palette && !palette.contains(e.target) && e.target !== highlightBtn) {
            closePalette();
        }
    });
})();
