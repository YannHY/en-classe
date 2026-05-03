"use strict";

(function () {
    function init() {
    const notesArea = document.querySelector('.notes-area');
    const saveIndicator = document.querySelector('.save-indicator');
    const saveStatus = document.getElementById('saveStatus');
    const wordCountEl = document.getElementById('wordCount');
    const charCountEl = document.getElementById('charCount');
    const clearBtn = document.getElementById('clearNotesBtn');
    const downloadBtn = document.getElementById('downloadNotesBtn');
    const downloadMenu = document.getElementById('downloadMenu');
    const editorShell = document.querySelector('.notes-editor-shell');
    const resizeHandle = document.querySelector('.notes-resize-handle');
    const timestampBtn = document.getElementById('insertTimestampBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const tabBar = document.getElementById('notesTabBar');
    const addTabBtn = document.getElementById('addNoteTab');

    if (!notesArea) return;

    const LEGACY_KEY = 'dashboardNotes';
    const TABS_KEY = 'noteTabs';
    const THEME_TEXT_COLORS = {
        '#2c3e50': true,
        '#fff': true,
        '#ffffff': true,
        'rgb(44,62,80)': true,
        'rgb(255,255,255)': true
    };
    let saveTimeout;

    // ===== Gestion des onglets =====
    function getTabsData() {
        try {
            return JSON.parse(localStorage.getItem(TABS_KEY));
        } catch (e) {
            return null;
        }
    }

    function setTabsData(data) {
        localStorage.setItem(TABS_KEY, JSON.stringify(data));
    }

    function getActiveTab(data) {
        if (!data || !data.tabs || !data.tabs.length) return null;
        return data.tabs.find(function (tab) {
            return tab.id === data.activeTabId;
        }) || data.tabs[0];
    }

    function normalizeColorValue(value) {
        return (value || '').toLowerCase().replace(/\s+/g, '');
    }

    function shouldInheritThemeColor(value) {
        return Boolean(THEME_TEXT_COLORS[normalizeColorValue(value)]);
    }

    function normalizeThemeTextColors(root) {
        if (!root || !root.querySelectorAll) return;

        root.querySelectorAll('[style], font[color]').forEach(function (element) {
            if (element.style && shouldInheritThemeColor(element.style.color)) {
                element.style.removeProperty('color');
                if (!element.getAttribute('style')) {
                    element.removeAttribute('style');
                }
            }

            if (element.tagName === 'FONT' && shouldInheritThemeColor(element.getAttribute('color'))) {
                element.removeAttribute('color');
            }
        });
    }

    function migrateIfNeeded() {
        var data = getTabsData();
        if (data && data.tabs && data.tabs.length > 0) return data;

        var existingContent = localStorage.getItem(LEGACY_KEY) || '';
        var id = 'note-' + Date.now();
        var tabs = {
            activeTabId: id,
            tabs: [{ id: id, title: 'Sans titre', createdAt: Date.now() }]
        };
        setTabsData(tabs);
        if (existingContent) {
            localStorage.setItem(id, existingContent);
        }
        return tabs;
    }

    var tabsData = migrateIfNeeded();

    function renderTabs() {
        var data = getTabsData();
        if (!data || !tabBar) return;
        // Remove existing tabs (keep add button)
        tabBar.querySelectorAll('.notes-tab').forEach(function (t) { t.remove(); });

        data.tabs.forEach(function (tab) {
            var btn = document.createElement('div');
            btn.className = 'notes-tab' + (tab.id === data.activeTabId ? ' active' : '');
            btn.setAttribute('data-tab-id', tab.id);
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('aria-pressed', tab.id === data.activeTabId ? 'true' : 'false');
            btn.title = tab.title;

            var titleSpan = document.createElement('span');
            titleSpan.className = 'notes-tab-title';
            titleSpan.textContent = tab.title;
            titleSpan.addEventListener('click', function (e) {
                e.stopPropagation();
                var currentData = getTabsData();
                if (!currentData) return;
                if (tab.id !== currentData.activeTabId) {
                    switchTab(tab.id);
                    return;
                }
                renameTabInline(btn, tab.id);
            });
            btn.appendChild(titleSpan);

            // Close button (visible only when >1 tab)
            if (data.tabs.length > 1) {
                var closeSpan = document.createElement('span');
                closeSpan.className = 'notes-tab-close';
                closeSpan.innerHTML = '&times;';
                closeSpan.title = 'Supprimer';
                closeSpan.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (confirm('Supprimer l\u2019onglet \u00ab ' + tab.title + ' \u00bb ?')) {
                        deleteTab(tab.id);
                    }
                });
                btn.appendChild(closeSpan);
            }

            // Click to switch
            btn.addEventListener('click', function () {
                switchTab(tab.id);
            });

            btn.addEventListener('keydown', function (e) {
                if (btn.querySelector('.notes-tab-rename')) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchTab(tab.id);
                }
            });

            // Double-click to rename
            btn.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                renameTabInline(btn, tab.id);
            });

            // Right-click to delete (alternative)
            btn.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                var d = getTabsData();
                if (d.tabs.length <= 1) return;
                if (confirm('Supprimer l\u2019onglet \u00ab ' + tab.title + ' \u00bb ?')) {
                    deleteTab(tab.id);
                }
            });

            tabBar.insertBefore(btn, addTabBtn);
        });
    }

    function switchTab(id) {
        // Save current note first
        saveNotes();
        // Close search if open
        if (window.notesSearchClose) window.notesSearchClose();

        var data = getTabsData();
        if (!data) return;
        data.activeTabId = id;
        setTabsData(data);

        var content = localStorage.getItem(id) || '';
        notesArea.innerHTML = content;
        normalizeThemeTextColors(notesArea);
        updateCounts();
        renderTabs();
    }

    function createTab() {
        saveNotes();
        var data = getTabsData();
        if (!data) return;
        var id = 'note-' + Date.now();
        var num = data.tabs.length + 1;
        data.tabs.push({ id: id, title: 'Note ' + num, createdAt: Date.now() });
        data.activeTabId = id;
        setTabsData(data);

        notesArea.innerHTML = '';
        updateCounts();
        renderTabs();
        startRenameActiveTab();
    }

    function deleteTab(id) {
        var data = getTabsData();
        if (!data || data.tabs.length <= 1) return;
        data.tabs = data.tabs.filter(function (t) { return t.id !== id; });
        localStorage.removeItem(id);
        if (data.activeTabId === id) {
            data.activeTabId = data.tabs[0].id;
        }
        setTabsData(data);
        switchTab(data.activeTabId);
    }

    function renameTabInline(btnEl, id) {
        if (!btnEl || btnEl.querySelector('.notes-tab-rename')) return;

        var data = getTabsData();
        if (!data) return;
        var tab = data.tabs.find(function (t) { return t.id === id; });
        if (!tab) return;

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'notes-tab-rename';
        input.value = tab.title;
        input.style.width = Math.max(60, btnEl.offsetWidth) + 'px';

        // Hide tab content, show input
        var titleSpan = btnEl.querySelector('.notes-tab-title');
        var closeSpan = btnEl.querySelector('.notes-tab-close');
        if (titleSpan) titleSpan.style.display = 'none';
        if (closeSpan) closeSpan.style.display = 'none';
        btnEl.appendChild(input);
        input.focus();
        input.select();

        function finishRename() {
            var previousTitle = tab.title;
            var newTitle = input.value.trim() || tab.title;
            tab.title = newTitle;
            var d = getTabsData();
            if (!d || !d.tabs) {
                renderTabs();
                return;
            }
            var t = d.tabs.find(function (x) { return x.id === id; });
            if (t) t.title = newTitle;
            setTabsData(d);
            renderTabs();
            if (newTitle !== previousTitle) {
                showSaveStatus('Note renommée');
            }
        }

        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', function (e) {
            e.stopPropagation();
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { input.value = tab.title; input.blur(); }
        });
        input.addEventListener('keyup', function (e) {
            e.stopPropagation();
        });
        input.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        input.addEventListener('mousedown', function (e) {
            e.stopPropagation();
        });
    }

    function startRenameActiveTab() {
        var data = getTabsData();
        var activeTab = getActiveTab(data);
        if (!activeTab || !tabBar) return;

        var activeBtn = tabBar.querySelector('[data-tab-id="' + activeTab.id + '"]');
        if (!activeBtn) return;

        renameTabInline(activeBtn, activeTab.id);
    }

    if (addTabBtn) {
        addTabBtn.addEventListener('click', createTab);
    }

    // Load active tab content
    var activeContent = localStorage.getItem(tabsData.activeTabId);
    if (activeContent) {
        notesArea.innerHTML = activeContent;
        normalizeThemeTextColors(notesArea);
    }
    renderTabs();

    // ===== Compteur de mots et caractères =====
    function updateCounts() {
        var text = notesArea.innerText || '';
        var cleanText = text.trim();
        var charCount = cleanText.length;
        var wordCount = cleanText === '' ? 0 : cleanText.split(/\s+/).filter(Boolean).length;

        if (wordCountEl) {
            wordCountEl.textContent = wordCount + (wordCount <= 1 ? ' mot' : ' mots');
        }
        if (charCountEl) {
            charCountEl.textContent = charCount + (charCount <= 1 ? ' caractère' : ' caractères');
        }
    }

    // ===== Sauvegarde automatique =====
    function showSaveStatus(msg) {
        var message = msg || 'Sauvegardé';
        if (saveStatus) {
            saveStatus.textContent = message;
            saveStatus.classList.add('is-visible');
            setTimeout(function () {
                saveStatus.classList.remove('is-visible');
            }, 2000);
        }
        if (saveIndicator && !msg) {
            saveIndicator.classList.add('visible');
            setTimeout(function () {
                saveIndicator.classList.remove('visible');
            }, 2000);
        }
    }

    function getCleanHTML() {
        // Nettoyer les marques de recherche avant de sauvegarder
        var clone = notesArea.cloneNode(true);
        clone.querySelectorAll('mark.notes-search-highlight').forEach(function (mark) {
            var parent = mark.parentNode;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
        });
        normalizeThemeTextColors(clone);
        return clone.innerHTML;
    }

    function saveNotes() {
        var data = getTabsData();
        if (!data) return;
        localStorage.setItem(data.activeTabId, getCleanHTML());
        // Also keep legacy key for backward compat
        localStorage.setItem(LEGACY_KEY, getCleanHTML());
        showSaveStatus();
    }

    // Expose globally for color-button.js and image-upload.js
    window.saveNotesContent = function () {
        saveNotes();
    };

    notesArea.addEventListener('input', function () {
        clearTimeout(saveTimeout);
        updateCounts();
        saveTimeout = setTimeout(saveNotes, 800);
    });

    if (window.MutationObserver) {
        var themeObserver = new MutationObserver(function () {
            normalizeThemeTextColors(notesArea);
        });

        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        if (document.body) {
            themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    // ===== Boutons de formatage =====
    document.querySelectorAll('.format-btn[data-command]').forEach(function (button) {
        button.addEventListener('click', function () {
            var command = button.getAttribute('data-command');
            if (!command) return;
            notesArea.focus();
            document.execCommand(command, false, null);
        });
    });

    // ===== Raccourcis clavier =====
    notesArea.addEventListener('keydown', function (e) {
        var isMod = e.ctrlKey || e.metaKey;
        if (!isMod) return;

        var key = e.key.toLowerCase();
        var command = null;

        switch (key) {
            case 'z': command = e.shiftKey ? 'redo' : 'undo'; break;
            case 'y': command = 'redo'; break;
            case 'b': command = 'bold'; break;
            case 'i': command = 'italic'; break;
            case 'u': command = 'underline'; break;
            case 'e': command = 'justifyCenter'; break;
            case 'l': command = 'justifyLeft'; break;
            case 'r': command = 'justifyRight'; break;
        }

        if (command) {
            e.preventDefault();
            document.execCommand(command, false, null);
        }
    });

    // ===== Horodatage =====
    if (timestampBtn) {
        timestampBtn.addEventListener('click', function () {
            notesArea.focus();
            var now = new Date();
            var formatted = now.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            var stamp = '<span class="notes-timestamp">&mdash; ' + formatted + ' &mdash;</span>&nbsp;';
            document.execCommand('insertHTML', false, stamp);
        });
    }

    // ===== Plein écran =====
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function () {
            document.body.classList.toggle('notes-fullscreen');
            var isFs = document.body.classList.contains('notes-fullscreen');
            fullscreenBtn.innerHTML = isFs
                ? '<i class="fas fa-compress"></i>'
                : '<i class="fas fa-expand"></i>';
            fullscreenBtn.title = isFs ? 'Quitter le plein écran' : 'Plein écran';
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('notes-fullscreen')) {
                fullscreenBtn.click();
            }
        });
    }

    // ===== Export dropdown =====
    var downloadWrapper = downloadBtn ? downloadBtn.closest('.notes-download-dropdown') : null;
    if (downloadBtn && downloadMenu) {
        downloadBtn.addEventListener('mousedown', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            downloadMenu.classList.toggle('is-open');
        });

        document.addEventListener('mousedown', function (e) {
            if (downloadWrapper && downloadWrapper.contains(e.target)) return;
            downloadMenu.classList.remove('is-open');
        });

        downloadMenu.addEventListener('click', function (e) {
            var option = e.target.closest('[data-export]');
            if (!option) return;
            e.stopPropagation();
            downloadMenu.classList.remove('is-open');

            var exportType = option.getAttribute('data-export');
            var text = notesArea.innerText || '';
            var cleanText = text.trim();

            if (!cleanText && exportType !== 'print') {
                showSaveStatus('Rien à exporter');
                return;
            }

            var now = new Date();
            var date = now.toISOString().slice(0, 10);

            if (exportType === 'txt') {
                var blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
                downloadFile(blob, 'notes-' + date + '.txt');
                showSaveStatus('Notes téléchargées (.txt)');
            } else if (exportType === 'html') {
                var htmlContent = '<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="UTF-8">\n<title>Notes - ' + date + '</title>\n<style>\nbody { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #2c3e50; }\nimg { max-width: 100%; height: auto; border-radius: 6px; }\ntable { border-collapse: collapse; width: 100%; margin: 12px 0; }\ntd { border: 1px solid #e0e0e0; padding: 8px 12px; }\n.notes-timestamp { color: #888; font-style: italic; }\n</style>\n</head>\n<body>\n' + getCleanHTML() + '\n</body>\n</html>';
                var blob2 = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                downloadFile(blob2, 'notes-' + date + '.html');
                showSaveStatus('Notes téléchargées (.html)');
            } else if (exportType === 'print') {
                window.print();
            }
        });
    }

    function downloadFile(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ===== Effacer les notes =====
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            var text = (notesArea.innerText || '').trim();
            if (text === '') return;

            if (confirm('Voulez-vous effacer les notes de cet onglet ?')) {
                notesArea.innerHTML = '';
                var data = getTabsData();
                if (data) {
                    localStorage.removeItem(data.activeTabId);
                }

                updateCounts();
                showSaveStatus('Notes effacées');
            }
        });
    }

    // ===== Redimensionnement de la zone de notes =====
    if (editorShell && resizeHandle) {
        var startY = 0;
        var startHeight = 0;
        var minHeight = 240;

        function stopResize() {
            editorShell.classList.remove('is-resizing');
            document.removeEventListener('pointermove', onResize);
            document.removeEventListener('pointerup', stopResize);
        }

        function onResize(e) {
            var nextHeight = Math.max(minHeight, startHeight + (e.clientY - startY));
            editorShell.style.height = nextHeight + 'px';
        }

        resizeHandle.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            startY = e.clientY;
            startHeight = editorShell.getBoundingClientRect().height;
            editorShell.classList.add('is-resizing');
            document.addEventListener('pointermove', onResize);
            document.addEventListener('pointerup', stopResize);
        });
    }

    // ===== Ctrl+F pour ouvrir la recherche =====
    document.addEventListener('keydown', function (e) {
        if (e.key === 'F2') {
            e.preventDefault();
            startRenameActiveTab();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            var searchBar = document.getElementById('notesSearchBar');
            if (searchBar) {
                searchBar.hidden = false;
                var input = document.getElementById('searchInput');
                if (input) input.focus();
            }
        }
    });

    // ===== Initialisation =====
    updateCounts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
