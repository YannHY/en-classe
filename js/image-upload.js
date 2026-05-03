// Fichier dédié à la fonctionnalité d'upload d'image avec redimensionnement
(function() {

    function makeImageResizable(wrapper) {
        const img = wrapper.querySelector('img');
        const handle = wrapper.querySelector('.img-resize-handle');
        if (!img || !handle) return;

        let startX, startWidth;

        function onPointerDown(e) {
            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startWidth = img.offsetWidth;
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            wrapper.classList.add('is-resizing');
        }

        function onPointerMove(e) {
            var newWidth = Math.max(60, startWidth + (e.clientX - startX));
            var maxWidth = wrapper.parentElement ? wrapper.parentElement.clientWidth : 800;
            newWidth = Math.min(newWidth, maxWidth);
            img.style.width = newWidth + 'px';
        }

        function onPointerUp() {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            wrapper.classList.remove('is-resizing');

            // Sauvegarder
            if (window.saveNotesContent) {
                window.saveNotesContent();
            } else {
                var notesArea = document.querySelector('.notes-area');
                if (notesArea && window.localStorage) {
                    localStorage.setItem('dashboardNotes', notesArea.innerHTML);
                }
            }
        }

        handle.addEventListener('pointerdown', onPointerDown);
    }

    function wrapImage(imageElement) {
        var wrapper = document.createElement('span');
        wrapper.className = 'img-resize-wrapper';
        wrapper.contentEditable = 'false';

        imageElement.style.width = imageElement.style.width || '100%';
        imageElement.style.maxWidth = '100%';
        imageElement.style.height = 'auto';
        imageElement.style.display = 'block';
        imageElement.draggable = false;

        var handle = document.createElement('span');
        handle.className = 'img-resize-handle';
        handle.title = 'Glisser pour redimensionner';

        wrapper.appendChild(imageElement);
        wrapper.appendChild(handle);

        // Activer le redimensionnement après insertion dans le DOM
        setTimeout(function() { makeImageResizable(wrapper); }, 0);

        return wrapper;
    }

    // S'assurer qu'un paragraphe éditable existe après un wrapper d'image
    function ensureEditableAfter(wrapper) {
        var next = wrapper.nextSibling;
        // S'il y a déjà un élément bloc éditable juste après, rien à faire
        if (next && next.nodeType === 1 && next.tagName === 'P') return;
        // S'il y a un nœud texte non vide après, rien à faire non plus
        if (next && next.nodeType === 3 && next.textContent.trim() !== '') return;

        var p = document.createElement('p');
        p.appendChild(document.createElement('br'));
        wrapper.parentNode.insertBefore(p, wrapper.nextSibling);
    }

    function initResizableImages() {
        // Rendre redimensionnables les images déjà présentes (chargées depuis localStorage)
        var notesArea = document.querySelector('.notes-area');
        if (!notesArea) return;

        // Images déjà dans un wrapper (rechargées)
        notesArea.querySelectorAll('.img-resize-wrapper').forEach(function(wrapper) {
            makeImageResizable(wrapper);
            ensureEditableAfter(wrapper);
        });

        // Images orphelines (insérées sans wrapper dans une ancienne version)
        notesArea.querySelectorAll('img:not(.img-resize-wrapper img)').forEach(function(img) {
            var wrapper = wrapImage(img.cloneNode(true));
            img.parentNode.replaceChild(wrapper, img);
            ensureEditableAfter(wrapper);
        });

        // Clic dans l'espace vide sous le contenu → créer un paragraphe et y placer le curseur
        notesArea.addEventListener('click', function(e) {
            if (e.target !== notesArea) return;
            var last = notesArea.lastElementChild;
            if (!last) return;
            // Vérifier si le clic est en dessous du dernier élément
            var lastRect = last.getBoundingClientRect();
            if (e.clientY > lastRect.bottom) {
                // S'il n'y a pas de paragraphe éditable à la fin, en créer un
                if (last.classList && last.classList.contains('img-resize-wrapper')) {
                    var p = document.createElement('p');
                    p.appendChild(document.createElement('br'));
                    notesArea.appendChild(p);
                    last = p;
                }
                // Placer le curseur dans le dernier élément
                var range = document.createRange();
                var sel = window.getSelection();
                range.setStart(last, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }

    function setupImageUpload() {
        var imageButton = document.getElementById('insertImageBtn');

        if (!imageButton) return;

        function handleImageInsert(event) {
            event.preventDefault();
            event.stopPropagation();

            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';

            fileInput.onchange = function() {
                if (fileInput.files && fileInput.files[0]) {
                    var selectedFile = fileInput.files[0];
                    var reader = new FileReader();

                    reader.onload = function(e) {
                        var notesArea = document.querySelector('.notes-area');
                        if (!notesArea) return;

                        var imageElement = new Image();
                        imageElement.src = e.target.result;
                        imageElement.style.margin = '10px 0';

                        var wrapper = wrapImage(imageElement);

                        // Insérer à la position du curseur
                        notesArea.focus();
                        var selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            var range = selection.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(wrapper);
                        } else {
                            notesArea.appendChild(wrapper);
                        }

                        // Ajouter un paragraphe après l'image pour pouvoir écrire en dessous
                        var afterP = document.createElement('p');
                        afterP.appendChild(document.createElement('br'));
                        if (wrapper.nextSibling) {
                            wrapper.parentNode.insertBefore(afterP, wrapper.nextSibling);
                        } else {
                            wrapper.parentNode.appendChild(afterP);
                        }

                        // Placer le curseur dans le nouveau paragraphe
                        var newRange = document.createRange();
                        var sel = window.getSelection();
                        newRange.setStart(afterP, 0);
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);

                        // Sauvegarder
                        if (window.saveNotesContent) {
                            window.saveNotesContent();
                        } else if (window.localStorage) {
                            localStorage.setItem('dashboardNotes', notesArea.innerHTML);
                        }
                    };

                    reader.onerror = function() {
                        alert("Impossible de charger l'image. Veuillez réessayer.");
                    };

                    reader.readAsDataURL(selectedFile);
                }
            };

            fileInput.click();
        }

        // Remplacer le bouton pour nettoyer les anciens listeners
        var newButton = imageButton.cloneNode(true);
        imageButton.parentNode.replaceChild(newButton, imageButton);
        newButton.addEventListener('click', handleImageInsert);
    }

    // Initialiser
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupImageUpload();
            initResizableImages();
        });
    } else {
        setupImageUpload();
        initResizableImages();
    }
})();
