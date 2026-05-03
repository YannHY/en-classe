// Système d'internationalisation (i18n) — Kanban en-classe

const translations = {
    fr: {
        // Header
        appTitle: "Kanban",
        newProject: "Nouveau Projet",
        collaborate: "Collaborer",
        connecting: "Connexion...",
        connected: "Connecté",
        syncing: "Synchronisation...",
        offline: "Hors ligne",

        // Project info
        shareCode: "Code de partage :",
        copy: "Copier",
        addColumn: "Ajouter une colonne",

        // Modal - Nouveau projet
        createNewProject: "Créer un nouveau projet",
        projectName: "Nom du projet",
        projectNamePlaceholder: "Ex: Projet de Sciences",
        create: "Créer",

        // Modal - Collaborer
        joinProject: "Rejoindre un projet",
        shareCodeLabel: "Code de partage",
        join: "Rejoindre",

        // Modal - Ajouter colonne
        addColumnTitle: "Ajouter une colonne",
        columnName: "Nom de la colonne",
        columnNamePlaceholder: "Ex: En cours",
        color: "Couleur",
        add: "Ajouter",

        // Modal - Tâche
        addTask: "Ajouter une tâche",
        editTask: "Modifier la tâche",
        title: "Titre",
        taskTitlePlaceholder: "Ex: Faire des recherches",
        description: "Description",
        taskDescPlaceholder: "Détails de la tâche...",
        priority: "Priorité",
        priorityLow: "Basse",
        priorityMedium: "Moyenne",
        priorityHigh: "Haute",
        assignee: "Assigné à",
        assigneePlaceholder: "Nom de l'élève",
        save: "Enregistrer",

        // Colonnes par défaut
        columnTodo: "À faire",
        columnInProgress: "En cours",
        columnDone: "Fait",

        // Tâches
        exampleTask: "Exemple de tâche",
        exampleTaskDesc: "Ceci est un exemple. Partagez le code avec vos camarades pour collaborer !",
        noTasks: "Aucune tâche",
        addTaskBtn: "Ajouter une tâche",

        // Messages toast
        projectCreated: "Projet créé avec succès !",
        projectJoined: "Projet rejoint avec succès !",
        invalidCode: "Code de partage invalide",
        columnAdded: "Colonne ajoutée !",
        columnDeleted: "Colonne supprimée",
        taskAdded: "Tâche ajoutée !",
        taskModified: "Tâche modifiée !",
        taskDeleted: "Tâche supprimée",
        taskMoved: "Tâche déplacée !",
        codeCopied: "Code copié dans le presse-papiers !",
        syncError: "Erreur de synchronisation",
        updateReceived: "Mise à jour reçue !",
        projectSaved: "Projet sauvegardé !",

        // Confirmations
        confirmDeleteColumn: "Êtes-vous sûr de vouloir supprimer cette colonne et toutes ses tâches ?",
        confirmDeleteTask: "Êtes-vous sûr de vouloir supprimer cette tâche ?",

        // Thème
        darkMode: "Mode sombre",
        lightMode: "Mode clair",

        // Projet par défaut
        defaultProjectName: "Mon Premier Projet",

        // Tooltips
        deleteColumn: "Supprimer la colonne",
        deleteTask: "Supprimer"
    },

    en: {
        // Header
        appTitle: "Kanban",
        newProject: "New Project",
        collaborate: "Collaborate",
        connecting: "Connecting...",
        connected: "Connected",
        syncing: "Syncing...",
        offline: "Offline",

        // Project info
        shareCode: "Share code:",
        copy: "Copy",
        addColumn: "Add a column",

        // Modal - New project
        createNewProject: "Create a new project",
        projectName: "Project name",
        projectNamePlaceholder: "Ex: Science Project",
        create: "Create",

        // Modal - Collaborate
        joinProject: "Join a project",
        shareCodeLabel: "Share code",
        join: "Join",

        // Modal - Add column
        addColumnTitle: "Add a column",
        columnName: "Column name",
        columnNamePlaceholder: "Ex: In Progress",
        color: "Color",
        add: "Add",

        // Modal - Task
        addTask: "Add a task",
        editTask: "Edit task",
        title: "Title",
        taskTitlePlaceholder: "Ex: Do research",
        description: "Description",
        taskDescPlaceholder: "Task details...",
        priority: "Priority",
        priorityLow: "Low",
        priorityMedium: "Medium",
        priorityHigh: "High",
        assignee: "Assigned to",
        assigneePlaceholder: "Student name",
        save: "Save",

        // Default columns
        columnTodo: "To Do",
        columnInProgress: "In Progress",
        columnDone: "Done",

        // Tasks
        exampleTask: "Example task",
        exampleTaskDesc: "This is an example. Share the code with your classmates to collaborate!",
        noTasks: "No tasks",
        addTaskBtn: "Add a task",

        // Toast messages
        projectCreated: "Project created successfully!",
        projectJoined: "Project joined successfully!",
        invalidCode: "Invalid share code",
        columnAdded: "Column added!",
        columnDeleted: "Column deleted",
        taskAdded: "Task added!",
        taskModified: "Task modified!",
        taskDeleted: "Task deleted",
        taskMoved: "Task moved!",
        codeCopied: "Code copied to clipboard!",
        syncError: "Synchronization error",
        updateReceived: "Update received!",
        projectSaved: "Project saved!",

        // Confirmations
        confirmDeleteColumn: "Are you sure you want to delete this column and all its tasks?",
        confirmDeleteTask: "Are you sure you want to delete this task?",

        // Theme
        darkMode: "Dark mode",
        lightMode: "Light mode",

        // Default project
        defaultProjectName: "My First Project",

        // Tooltips
        deleteColumn: "Delete column",
        deleteTask: "Delete"
    }
};

// Langue actuelle
let currentLang = localStorage.getItem('site_lang') || localStorage.getItem('kanban_lang') || 'fr';

// Obtenir une traduction
function t(key) {
    return translations[currentLang][key] || translations['fr'][key] || key;
}

// Changer la langue
function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('site_lang', lang);
        localStorage.setItem('kanban_lang', lang);
        document.documentElement.lang = lang;
        updatePageTranslations();
        updateLanguageButtons();

        // Mettre à jour le titre de la page
        document.title = t('appTitle');

        // Déclencher un événement pour que kanban.js puisse re-render
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
}

// Mettre à jour toutes les traductions de la page
function updatePageTranslations() {
    // Mettre à jour les éléments avec data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });

    // Mettre à jour les placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });

    // Mettre à jour les options du select de priorité
    const prioritySelect = document.getElementById('task-priority');
    if (prioritySelect) {
        prioritySelect.querySelector('option[value="low"]').textContent = t('priorityLow');
        prioritySelect.querySelector('option[value="medium"]').textContent = t('priorityMedium');
        prioritySelect.querySelector('option[value="high"]').textContent = t('priorityHigh');
    }

    // Mettre à jour le titre de la page
    document.title = t('appTitle');
}

// Mettre à jour l'état des boutons de langue
function updateLanguageButtons() {
    document.querySelectorAll('.btn-lang').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btn-lang-${currentLang}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Initialiser le système i18n
function initI18n() {
    // Appliquer la langue sauvegardée
    document.documentElement.lang = currentLang;
    updatePageTranslations();
    updateLanguageButtons();

    // Événements des boutons de langue
    document.getElementById('btn-lang-fr')?.addEventListener('click', () => setLanguage('fr'));
    document.getElementById('btn-lang-en')?.addEventListener('click', () => setLanguage('en'));
}

// Exposer les fonctions globalement
window.t = t;
window.setLanguage = setLanguage;
window.currentLang = () => currentLang;
window.initI18n = initI18n;

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}
