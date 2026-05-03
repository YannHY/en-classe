(function () {
    "use strict";

    var searchBar = document.getElementById('notesSearchBar');
    var searchInput = document.getElementById('searchInput');
    var replaceInput = document.getElementById('replaceInput');
    var searchCount = document.getElementById('searchCount');
    var searchPrev = document.getElementById('searchPrev');
    var searchNext = document.getElementById('searchNext');
    var searchClose = document.getElementById('searchClose');
    var replaceBtn = document.getElementById('replaceBtn');
    var replaceAllBtn = document.getElementById('replaceAllBtn');
    var toggleBtn = document.getElementById('searchToggleBtn');
    var notesArea = document.querySelector('.notes-area');

    if (!searchBar || !notesArea) return;

    var matches = [];
    var currentIndex = -1;
    var searchTimeout = null;

    function clearHighlights() {
        notesArea.querySelectorAll('mark.notes-search-highlight').forEach(function (mark) {
            var parent = mark.parentNode;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
        });
        notesArea.normalize();
        matches = [];
        currentIndex = -1;
        if (searchCount) searchCount.textContent = '';
    }

    function performSearch() {
        clearHighlights();

        var query = searchInput.value;
        if (!query) return;

        var walker = document.createTreeWalker(notesArea, NodeFilter.SHOW_TEXT, null, false);
        var textNodes = [];
        var node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        var queryLower = query.toLowerCase();

        // Process in reverse to avoid offset issues
        for (var i = textNodes.length - 1; i >= 0; i--) {
            var textNode = textNodes[i];
            var text = textNode.textContent;
            var textLower = text.toLowerCase();
            var startPos = 0;
            var positions = [];

            while (true) {
                var idx = textLower.indexOf(queryLower, startPos);
                if (idx === -1) break;
                positions.push(idx);
                startPos = idx + queryLower.length;
            }

            // Wrap matches in reverse order within this text node
            for (var j = positions.length - 1; j >= 0; j--) {
                var pos = positions[j];
                var range = document.createRange();
                range.setStart(textNode, pos);
                range.setEnd(textNode, pos + query.length);

                var mark = document.createElement('mark');
                mark.className = 'notes-search-highlight';
                range.surroundContents(mark);
            }
        }

        matches = Array.from(notesArea.querySelectorAll('mark.notes-search-highlight'));

        if (matches.length > 0) {
            currentIndex = 0;
            updateActiveMatch();
        }
        updateCount();
    }

    function updateActiveMatch() {
        matches.forEach(function (m) {
            m.classList.remove('notes-search-highlight--active');
        });
        if (currentIndex >= 0 && currentIndex < matches.length) {
            matches[currentIndex].classList.add('notes-search-highlight--active');
            matches[currentIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    function updateCount() {
        if (searchCount) {
            if (matches.length === 0 && searchInput.value) {
                searchCount.textContent = '0 résultat';
            } else if (matches.length > 0) {
                searchCount.textContent = (currentIndex + 1) + '/' + matches.length;
            } else {
                searchCount.textContent = '';
            }
        }
    }

    function goNext() {
        if (matches.length === 0) return;
        currentIndex = (currentIndex + 1) % matches.length;
        updateActiveMatch();
        updateCount();
    }

    function goPrev() {
        if (matches.length === 0) return;
        currentIndex = (currentIndex - 1 + matches.length) % matches.length;
        updateActiveMatch();
        updateCount();
    }

    function replaceCurrent() {
        if (currentIndex < 0 || currentIndex >= matches.length) return;
        var mark = matches[currentIndex];
        var replacement = document.createTextNode(replaceInput.value);
        mark.parentNode.replaceChild(replacement, mark);
        matches.splice(currentIndex, 1);
        if (currentIndex >= matches.length) currentIndex = 0;
        if (matches.length > 0) {
            updateActiveMatch();
        }
        updateCount();
        notesArea.normalize();
        if (window.saveNotesContent) window.saveNotesContent();
    }

    function replaceAll() {
        if (matches.length === 0) return;
        var replaceText = replaceInput.value;
        matches.forEach(function (mark) {
            var replacement = document.createTextNode(replaceText);
            mark.parentNode.replaceChild(replacement, mark);
        });
        matches = [];
        currentIndex = -1;
        updateCount();
        notesArea.normalize();
        if (window.saveNotesContent) window.saveNotesContent();
    }

    function openSearch() {
        searchBar.hidden = false;
        searchInput.focus();
        // If there's selected text, use it as the search query
        var sel = window.getSelection();
        if (sel.toString().trim()) {
            searchInput.value = sel.toString().trim();
            performSearch();
        }
    }

    function closeSearch() {
        clearHighlights();
        searchBar.hidden = true;
        searchInput.value = '';
        replaceInput.value = '';
    }

    // Expose close function globally for tab switching
    window.notesSearchClose = closeSearch;

    // Event listeners
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            if (searchBar.hidden) {
                openSearch();
            } else {
                closeSearch();
            }
        });
    }

    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300);
    });

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) goPrev(); else goNext();
        }
        if (e.key === 'Escape') closeSearch();
    });

    replaceInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSearch();
    });

    if (searchNext) searchNext.addEventListener('click', goNext);
    if (searchPrev) searchPrev.addEventListener('click', goPrev);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    if (replaceBtn) replaceBtn.addEventListener('click', replaceCurrent);
    if (replaceAllBtn) replaceAllBtn.addEventListener('click', replaceAll);
})();
