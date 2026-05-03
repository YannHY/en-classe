document.addEventListener('DOMContentLoaded', function() {
    const getSiteLang = () => ((localStorage.getItem('site_lang') || localStorage.getItem('kanban_lang') || 'fr') === 'en' ? 'en' : 'fr');

    let currentDate = new Date();
    const calendar = document.getElementById('calendarDays');
    const monthDisplay = document.getElementById('currentMonth');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const calendarSection = document.querySelector('.calendar-section');
    const calendarContent = document.getElementById('calendarContent');
    const calendarToggleBtn = document.getElementById('calendarToggleBtn');

    function setCalendarCollapsed(collapsed) {
        if (!calendarSection || !calendarContent || !calendarToggleBtn) return;

        const icon = calendarToggleBtn.querySelector('i');
        calendarSection.classList.toggle('is-collapsed', collapsed);
        calendarContent.hidden = collapsed;
        calendarToggleBtn.setAttribute('aria-expanded', String(!collapsed));

        const label = getSiteLang() === 'en'
            ? (collapsed ? 'Expand calendar' : 'Collapse calendar')
            : (collapsed ? 'Déplier le calendrier' : 'Replier le calendrier');
        calendarToggleBtn.setAttribute('aria-label', label);
        calendarToggleBtn.setAttribute('title', label);

        if (icon) {
            icon.classList.toggle('fa-chevron-down', collapsed);
            icon.classList.toggle('fa-chevron-up', !collapsed);
        }

        if (!collapsed) {
            equalizeCalendarHeight();
        }
    }

    if (calendarToggleBtn) {
        calendarToggleBtn.addEventListener('click', () => {
            const isCollapsed = calendarSection && calendarSection.classList.contains('is-collapsed');
            setCalendarCollapsed(!isCollapsed);
        });
    }

    function updateCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Mise à jour du titre
        const monthNames = getSiteLang() === 'en'
            ? ['January', 'February', 'March', 'April', 'May', 'June',
               'July', 'August', 'September', 'October', 'November', 'December']
            : ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        monthDisplay.textContent = `${monthNames[month]} ${year}`;

        // Vider le calendrier
        calendar.innerHTML = '';

        // Premier jour du mois
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Ajuster pour commencer par lundi (1) au lieu de dimanche (0)
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;

        // Jours du mois précédent
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = prevMonthDays - i;
            dayDiv.className = 'other-month';
            calendar.appendChild(dayDiv);
        }

        // Jours du mois actuel
        const today = new Date();
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = i;
            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                dayDiv.className = 'today';
            }
            calendar.appendChild(dayDiv);
        }
    }

    prevMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
        equalizeCalendarHeight();
    });

    nextMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
        equalizeCalendarHeight();
    });

    // Fonction pour mettre à jour la date
    function updateDateDisplay() {
        const jours = getSiteLang() === 'en'
            ? ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
            : ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        
        // Date actuelle
        const maintenant = new Date();
        const jour = maintenant.getDay(); // 0-6
        const numero = maintenant.getDate(); // 1-31
        
        // Sélection des éléments
        const dayNameElement = document.querySelector('.day-name');
        const dayNumberElement = document.querySelector('.big-day-number');
        
        // Mise à jour du contenu
        if (dayNameElement) dayNameElement.textContent = jours[jour];
        if (dayNumberElement) dayNumberElement.textContent = numero;
        

    }

    document.addEventListener('siteLanguageChanged', () => {
        updateCalendar();
        updateDateDisplay();
        const isCollapsed = calendarSection && calendarSection.classList.contains('is-collapsed');
        setCalendarCollapsed(Boolean(isCollapsed));
        equalizeCalendarHeight();
    });
    
    // Mettre à jour la date immédiatement
    updateDateDisplay();

    // Adapter le grand chiffre pour que l'affichage de date ait la même hauteur que le calendrier
    function equalizeCalendarHeight() {
        const calContainer = document.querySelector('.calendar-container');
        const dateDisplay = document.querySelector('.date-display');
        const dayName = document.querySelector('.day-name');
        const bigNumber = document.querySelector('.big-day-number');
        if (!calContainer || !dateDisplay || !dayName || !bigNumber) return;

        if (calendarSection && calendarSection.classList.contains('is-collapsed')) return;

        // Réinitialiser
        bigNumber.style.fontSize = '';
        dayName.style.fontSize = '';
        dateDisplay.style.minHeight = '';

        // Uniquement en mode 2 colonnes (desktop)
        if (window.innerWidth <= 768) return;

        const calHeight = calContainer.offsetHeight;

        // Répartir la hauteur : 20% pour le nom du jour, 75% pour le chiffre, 5% de marge
        const style = window.getComputedStyle(dateDisplay);
        const pt = parseFloat(style.paddingTop) || 0;
        const pb = parseFloat(style.paddingBottom) || 0;
        const totalAvailable = calHeight - pt - pb;

        if (totalAvailable > 60) {
            // Limiter la taille pour éviter un affichage disproportionné.
            const dayNameSize = Math.max(24, Math.min(totalAvailable * 0.14, 42));
            const dayNumberSize = Math.max(72, Math.min(totalAvailable * 0.5, 160));
            dayName.style.fontSize = dayNameSize + 'px';
            bigNumber.style.fontSize = dayNumberSize + 'px';
            dateDisplay.style.minHeight = calHeight + 'px';
        }
    }

    window.addEventListener('resize', equalizeCalendarHeight);

    // Planifier la mise à jour à minuit précis, puis toutes les 24h
    function scheduleMidnightUpdate() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const msUntilMidnight = midnight - now;
        setTimeout(function() {
            updateDateDisplay();
            updateCalendar();
            equalizeCalendarHeight();
            scheduleMidnightUpdate();
        }, msUntilMidnight);
    }
    scheduleMidnightUpdate();

    updateCalendar();
    setCalendarCollapsed(false);
    equalizeCalendarHeight();
});
