document.addEventListener('DOMContentLoaded', function() {
    const colorBtn = document.getElementById('text-color-btn');
    const notesArea = document.querySelector('.notes-area');
    let colorPalette = null;
    
    // Palette réorganisée en 4 rangées de 16 couleurs
    const colorRows = [
        // Noirs, gris et bleus
        ['#000000', '#333333', '#555555', '#777777', '#999999', '#BBBBBB', '#DDDDDD', '#191970', 
         '#000080', '#0000CD', '#1F618D', '#2980B9', '#3498DB', '#5DADE2', '#85C1E9', '#D6EAF8'],
        // Verts
        ['#145A32', '#1E8449', '#27AE60', '#2ECC71', '#58D68D', '#7DCEA0', '#A9DFBF', '#D5F5E3',
         '#7D6608', '#9A7D0A', '#B7950B', '#D4AC0D', '#F1C40F', '#F4D03F', '#F7DC6F', '#F9E79F'],
        // Oranges et rouges
        ['#9C640C', '#B9770E', '#CA6F1E', '#D35400', '#E67E22', '#EB984E', '#F0B27A', '#F5CBA7',
         '#641E16', '#7B241C', '#922B21', '#A93226', '#C0392B', '#CD6155', '#D98880', '#E6B0AA'],
        // Violets, pourpres et tons variés
        ['#4A235A', '#5B2C6F', '#6C3483', '#7D3C98', '#8E44AD', '#A569BD', '#BB8FCE', '#D2B4DE',
         '#884EA0', '#AF7AC5', '#7FB3D5', '#48C9B0', '#45B39D', '#52BE80', '#F5B041', '#EB984E']
    ];
    
    colorBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Si la palette existe déjà, la supprimer
        if (colorPalette) {
            document.body.removeChild(colorPalette);
            colorPalette = null;
            return;
        }
        
        // Mémoriser la sélection
        const selection = window.getSelection();
        const hasSelection = selection.rangeCount > 0 && selection.toString().trim() !== '';
        let selectionRange = null;
        
        if (hasSelection) {
            selectionRange = selection.getRangeAt(0).cloneRange();
        }
        
        // Créer la palette de couleurs
        colorPalette = document.createElement('div');
        colorPalette.style.position = 'absolute';
        colorPalette.style.zIndex = '9999';
        colorPalette.style.padding = '8px';
        colorPalette.style.backgroundColor = '#f8f9fa';
        colorPalette.style.color = '#212529';
        colorPalette.style.border = '1px solid #dee2e6';
        colorPalette.style.borderRadius = '4px';
        colorPalette.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        colorPalette.style.width = '420px';
        
        // Positionner la palette près du bouton
        const btnRect = colorBtn.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        let leftPos = btnRect.left + window.scrollX;
        
        if (leftPos + 420 > windowWidth) {
            leftPos = windowWidth - 430;
        }
        
        colorPalette.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
        colorPalette.style.left = Math.max(10, leftPos) + 'px';
        
        // Ajouter un titre à la palette
        const titleBar = document.createElement('div');
        titleBar.style.marginBottom = '8px';
        titleBar.style.fontWeight = 'bold';
        titleBar.style.textAlign = 'center';
        titleBar.textContent = hasSelection ? 'Choisir une couleur pour le texte sélectionné' : 'Choisir une couleur';
        colorPalette.appendChild(titleBar);
        
        // Parcourir les rangées de couleurs
        colorRows.forEach(row => {
            const rowContainer = document.createElement('div');
            rowContainer.style.display = 'flex';
            rowContainer.style.justifyContent = 'space-between';
            rowContainer.style.marginBottom = '2px';
            
            row.forEach(color => {
                const colorSwatch = document.createElement('div');
                colorSwatch.style.width = '22px';
                colorSwatch.style.height = '22px';
                colorSwatch.style.backgroundColor = color;
                colorSwatch.style.cursor = 'pointer';
                colorSwatch.style.margin = '1px';
                colorSwatch.style.border = '1px solid #ddd';
                colorSwatch.style.borderRadius = '2px';
                colorSwatch.title = color;
                
                // Pour les couleurs très foncées, ajouter une bordure plus visible
                if (color === '#000000' || color === '#191970' || color === '#000080' || color === '#145A32' || color === '#641E16' || color === '#4A235A') {
                    colorSwatch.style.border = '1px solid #fff';
                    colorSwatch.style.boxShadow = '0 0 0 1px #000';
                }
                
                colorSwatch.addEventListener('click', function() {
                    // Supprimer la palette
                    document.body.removeChild(colorPalette);
                    colorPalette = null;
                    
                    // Focus sur la zone de notes
                    notesArea.focus();
                    
                    // Utiliser document.execCommand pour plus de compatibilité
                    if (hasSelection && selectionRange) {
                        // Restaurer la sélection
                        selection.removeAllRanges();
                        selection.addRange(selectionRange);
                        
                        // Appliquer directement la couleur avec execCommand
                        document.execCommand('foreColor', false, color);
                    } else {
                        // Aucune sélection, créer un nouvel élément de texte coloré
                        const tempRange = document.createRange();
                        tempRange.selectNodeContents(notesArea);
                        tempRange.collapse(false); // Collapse à la fin
                        selection.removeAllRanges();
                        selection.addRange(tempRange);
                        
                        const textNode = document.createTextNode('Texte coloré ');
                        const span = document.createElement('span');
                        span.style.color = color;
                        span.appendChild(textNode);
                        
                        tempRange.insertNode(span);
                        
                        // Placer le curseur après le texte inséré
                        tempRange.setStartAfter(span);
                        tempRange.setEndAfter(span);
                        selection.removeAllRanges();
                        selection.addRange(tempRange);
                    }
                    
                    // Sauvegarder
                    if (window.saveNotesContent) {
                        window.saveNotesContent();
                    } else {
                        localStorage.setItem('dashboardNotes', notesArea.innerHTML);
                    }
                });
                
                rowContainer.appendChild(colorSwatch);
            });
            
            colorPalette.appendChild(rowContainer);
        });
        
        // Ajouter la palette au document
        document.body.appendChild(colorPalette);
        
        // Fermer la palette si on clique ailleurs
        document.addEventListener('click', function closeColorPalette(event) {
            if (colorPalette && !colorPalette.contains(event.target) && event.target !== colorBtn) {
                document.body.removeChild(colorPalette);
                colorPalette = null;
                document.removeEventListener('click', closeColorPalette);
            }
        });
    });
});