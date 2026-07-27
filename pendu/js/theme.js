// Apply theme immediately to prevent flash
(function() {
    var savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'enabled') {
        document.documentElement.classList.add('dark-mode');
        document.body && document.body.classList.add('dark-mode');
    }
})();

function updateToggleLabel(button, isDark) {
    if (!button) return;
    var lang = localStorage.getItem('site_lang') || localStorage.getItem('kanban_lang') || 'fr';
    var isEnglish = lang === 'en';
    var label = isEnglish
        ? (isDark ? 'Switch to light mode' : 'Switch to dark mode')
        : (isDark ? 'Activer le mode clair' : 'Activer le mode sombre');
    button.innerHTML = isDark
        ? '<i class="fas fa-sun" aria-hidden="true"></i>'
        : '<i class="fas fa-moon" aria-hidden="true"></i>';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
}

window.refreshThemeToggleLabel = function() {
    var button = document.getElementById('themeToggle');
    if (!button) return;
    var isDark = document.body.classList.contains('dark-mode');
    updateToggleLabel(button, isDark);
};

document.addEventListener('DOMContentLoaded', function() {
    var button = document.getElementById('themeToggle');
    var savedTheme = localStorage.getItem('darkMode');
    var isDark = savedTheme === 'enabled';

    // Apply saved theme
    if (isDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
    }

    updateToggleLabel(button, isDark);

    if (!button) return;

    button.addEventListener('click', function() {
        var currentlyDark = document.body.classList.contains('dark-mode');
        var nextDark = !currentlyDark;

        // Rotation animation
        button.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        button.style.transform = 'rotate(360deg) scale(0.85)';

        setTimeout(function() {
            document.documentElement.classList.toggle('dark-mode', nextDark);
            document.body.classList.toggle('dark-mode', nextDark);

            localStorage.setItem('darkMode', nextDark ? 'enabled' : 'disabled');
            updateToggleLabel(button, nextDark);

            button.style.transform = 'rotate(0deg) scale(1)';
        }, 200);
    });
});
