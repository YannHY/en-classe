(function () {
    "use strict";

    var decreaseBtn = document.getElementById('decrease-font');
    var increaseBtn = document.getElementById('increase-font');
    var sizeDisplay = document.getElementById('font-size-display');
    var notesArea = document.querySelector('.notes-area');

    if (!notesArea) return;

    var currentSize = 4; // On commence à une taille moyenne

    // Tableau de correspondance pour l'affichage
    var sizes = {
        1: '9px',
        2: '10px',
        3: '11px',
        4: '12px',
        5: '13px',
        6: '14px',
        7: '15px'
    };

    function updateDisplay() {
        if (sizeDisplay) sizeDisplay.textContent = sizes[currentSize];
    }

    if (decreaseBtn) {
        decreaseBtn.onclick = function () {
            if (currentSize > 1) {
                currentSize--;
                notesArea.focus();
                document.execCommand('fontSize', false, currentSize);
                updateDisplay();
            }
        };
    }

    if (increaseBtn) {
        increaseBtn.onclick = function () {
            if (currentSize < 7) {
                currentSize++;
                notesArea.focus();
                document.execCommand('fontSize', false, currentSize);
                updateDisplay();
            }
        };
    }

    // Initialisation
    updateDisplay();
})();
