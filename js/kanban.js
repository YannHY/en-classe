// État de l'application
let state = {
    projectId: null,
    projectName: 'Mon Projet',
    shareCode: null,
    columns: [],
    collaborators: []
};

// Référence à l'écouteur Firestore actif
let unsubscribeListener = null;

// Éléments du DOM
const kanbanBoard = document.getElementById('kanban-board');
const shareCodeEl = document.getElementById('share-code');
const syncStatusEl = document.getElementById('sync-status');

// Modals
const modalNewProject = document.getElementById('modal-new-project');
const modalCollaborate = document.getElementById('modal-collaborate');
const modalAddColumn = document.getElementById('modal-add-column');
const modalTask = document.getElementById('modal-task');

// Attendre que Firebase soit prêt
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseReady) {
            resolve();
        } else {
            document.addEventListener('firebaseReady', resolve);
        }
    });
}

// Initialisation
async function init() {
    await waitForFirebase();
    updateSyncStatus('connected');

    // Charger le projet depuis localStorage (juste l'ID)
    const savedProjectId = localStorage.getItem('kanban_current_project');

    if (savedProjectId) {
        await loadProjectFromFirebase(savedProjectId);
    } else {
        // Créer un projet par défaut
        await createDefaultProject();
    }

    setupEventListeners();
}

init();

// Couleur de la colonne "Fait/Done"
function getDoneColumnColor() {
    const kApp = document.querySelector('.k-app');
    if (kApp) {
        const colorFromCss = getComputedStyle(kApp).getPropertyValue('--k-accent').trim();
        if (colorFromCss) return colorFromCss;
    }
    return '#06b6d4';
}

// Uniformiser la couleur de la colonne "Fait/Done" avec le cyan principal
function normalizeDoneColumnColor(projectData) {
    if (!projectData || !Array.isArray(projectData.columns)) return projectData;

    const doneTitles = new Set(['Fait', 'Done']);
    const doneColor = getDoneColumnColor();
    let hasChanges = false;

    const normalizedColumns = projectData.columns.map((column) => {
        const isDoneColumn = column?.titleKey === 'columnDone' ||
            (!column?.titleKey && doneTitles.has(column?.title));

        if (isDoneColumn && column.color !== doneColor) {
            hasChanges = true;
            return { ...column, color: doneColor };
        }

        return column;
    });

    return hasChanges ? { ...projectData, columns: normalizedColumns } : projectData;
}

// Mise à jour du statut de synchronisation
function updateSyncStatus(status) {
    const statusEl = document.getElementById('sync-status');
    const getText = (key, fallback) => window.t ? t(key) : fallback;

    switch(status) {
        case 'connected':
            statusEl.innerHTML = '<i class="fa-solid fa-circle" style="color: #10b981;"></i> <span data-i18n="connected">' + getText('connected', 'Connecté') + '</span>';
            statusEl.style.color = '#10b981';
            break;
        case 'syncing':
            statusEl.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> <span data-i18n="syncing">' + getText('syncing', 'Synchronisation...') + '</span>';
            statusEl.style.color = '#f59e0b';
            break;
        case 'offline':
            statusEl.innerHTML = '<i class="fa-solid fa-circle" style="color: #ef4444;"></i> <span data-i18n="offline">' + getText('offline', 'Hors ligne') + '</span>';
            statusEl.style.color = '#ef4444';
            break;
        default:
            statusEl.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> <span data-i18n="connecting">' + getText('connecting', 'Connexion...') + '</span>';
            statusEl.style.color = '#64748b';
    }
}

// Configuration des événements
function setupEventListeners() {
    // Boutons toolbar
    document.getElementById('btn-new-project').addEventListener('click', () => openModal(modalNewProject));
    document.getElementById('btn-collaborate').addEventListener('click', () => openModal(modalCollaborate));
    document.getElementById('btn-add-column').addEventListener('click', () => openModal(modalAddColumn));
    document.getElementById('btn-copy-code').addEventListener('click', copyShareCode);

    // Formulaires
    document.getElementById('form-new-project').addEventListener('submit', handleNewProject);
    document.getElementById('form-collaborate').addEventListener('submit', handleCollaborate);
    document.getElementById('form-add-column').addEventListener('submit', handleAddColumn);
    document.getElementById('form-task').addEventListener('submit', handleTaskSubmit);

    // Fermeture des modals
    document.querySelectorAll('.k-modal .k-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.k-modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.k-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Raccourci clavier pour fermer les modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.k-modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Écouter le changement de langue
    document.addEventListener('languageChanged', () => {
        renderBoard();
        updateSyncStatus('connected');
    });
}

// Génération d'ID unique
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Génération de code de partage
function generateShareCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Gestion des modals
function openModal(modal) {
    modal.classList.add('active');
    const firstInput = modal.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Sauvegarder dans Firebase
async function saveToFirebase() {
    if (!state.projectId) return;

    updateSyncStatus('syncing');

    try {
        const docRef = window.firebaseDoc(window.firebaseDB, 'projects', state.projectId);
        await window.firebaseSetDoc(docRef, {
            ...state,
            updatedAt: new Date().toISOString()
        });

        // Sauvegarder l'ID du projet actuel en local
        localStorage.setItem('kanban_current_project', state.projectId);

        updateSyncStatus('connected');
    } catch (error) {
        console.error('Erreur de sauvegarde Firebase:', error);
        updateSyncStatus('offline');
        showToast(t('syncError'), 'error');
    }
}

// Charger un projet depuis Firebase
async function loadProjectFromFirebase(projectId) {
    try {
        const docRef = window.firebaseDoc(window.firebaseDB, 'projects', projectId);
        const docSnap = await window.firebaseGetDoc(docRef);

        if (docSnap.exists()) {
            state = normalizeDoneColumnColor(docSnap.data());
            renderBoard();

            // Écouter les changements en temps réel
            listenToProjectChanges(projectId);
        } else {
            // Projet non trouvé, créer un nouveau
            await createDefaultProject();
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
        updateSyncStatus('offline');
        // Fallback: créer un projet local
        await createDefaultProject();
    }
}

// Écouter les changements en temps réel
function listenToProjectChanges(projectId) {
    // Désabonner l'ancien écouteur si existant
    if (unsubscribeListener) {
        unsubscribeListener();
    }

    const docRef = window.firebaseDoc(window.firebaseDB, 'projects', projectId);

    unsubscribeListener = window.firebaseOnSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            const newData = normalizeDoneColumnColor(doc.data());
            // Éviter de re-render si c'est notre propre changement
            if (JSON.stringify(newData.columns) !== JSON.stringify(state.columns) ||
                newData.projectName !== state.projectName) {
                state = newData;
                renderBoard();
                showToast(t('updateReceived'), 'success');
            }
        }
    }, (error) => {
        console.error('Erreur d\'écoute:', error);
        updateSyncStatus('offline');
    });
}

// Chercher un projet par code de partage
async function findProjectByShareCode(shareCode) {
    try {
        const projectsRef = window.firebaseCollection(window.firebaseDB, 'projects');
        const q = window.firebaseQuery(projectsRef, window.firebaseWhere('shareCode', '==', shareCode.toUpperCase()));
        const querySnapshot = await window.firebaseGetDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Erreur de recherche:', error);
        return null;
    }
}

// Créer un projet par défaut
async function createDefaultProject() {
    const doneColor = getDoneColumnColor();
    state = {
        projectId: generateId(),
        projectName: t('defaultProjectName'),
        shareCode: generateShareCode(),
        columns: [
            {
                id: generateId(),
                title: t('columnTodo'),
                titleKey: 'columnTodo',
                color: '#ef4444',
                tasks: [
                    {
                        id: generateId(),
                        title: t('exampleTask'),
                        titleKey: 'exampleTask',
                        description: t('exampleTaskDesc'),
                        descriptionKey: 'exampleTaskDesc',
                        priority: 'medium',
                        assignee: '',
                        createdAt: new Date().toISOString()
                    }
                ]
            },
            {
                id: generateId(),
                title: t('columnInProgress'),
                titleKey: 'columnInProgress',
                color: '#f59e0b',
                tasks: []
            },
            {
                id: generateId(),
                title: t('columnDone'),
                titleKey: 'columnDone',
                color: doneColor,
                tasks: []
            }
        ],
        collaborators: [],
        createdAt: new Date().toISOString()
    };

    await saveToFirebase();
    renderBoard();
    listenToProjectChanges(state.projectId);
}

// Création d'un nouveau projet
async function handleNewProject(e) {
    e.preventDefault();
    const title = document.getElementById('project-title').value.trim();

    if (title) {
        const doneColor = getDoneColumnColor();
        // Désabonner de l'ancien projet
        if (unsubscribeListener) {
            unsubscribeListener();
        }

        state = {
            projectId: generateId(),
            projectName: title,
            shareCode: generateShareCode(),
            columns: [
                {
                    id: generateId(),
                    title: t('columnTodo'),
                    titleKey: 'columnTodo',
                    color: '#ef4444',
                    tasks: []
                },
                {
                    id: generateId(),
                    title: t('columnDone'),
                    titleKey: 'columnDone',
                    color: doneColor,
                    tasks: []
                }
            ],
            collaborators: [],
            createdAt: new Date().toISOString()
        };

        await saveToFirebase();
        renderBoard();
        listenToProjectChanges(state.projectId);

        closeModal(modalNewProject);
        document.getElementById('project-title').value = '';
        showToast(t('projectCreated'), 'success');
    }
}

// Rejoindre un projet via code
async function handleCollaborate(e) {
    e.preventDefault();
    const code = document.getElementById('collab-code').value.trim().toUpperCase();

    if (code) {
        updateSyncStatus('syncing');

        const project = await findProjectByShareCode(code);

        if (project) {
            // Désabonner de l'ancien projet
            if (unsubscribeListener) {
                unsubscribeListener();
            }

            state = project;
            localStorage.setItem('kanban_current_project', state.projectId);
            renderBoard();
            listenToProjectChanges(state.projectId);

            closeModal(modalCollaborate);
            document.getElementById('collab-code').value = '';
            updateSyncStatus('connected');
            showToast(t('projectJoined'), 'success');
        } else {
            updateSyncStatus('connected');
            showToast(t('invalidCode'), 'error');
        }
    }
}

// Ajouter une colonne
async function handleAddColumn(e) {
    e.preventDefault();
    const title = document.getElementById('column-title').value.trim();
    const color = document.getElementById('column-color').value;

    if (title) {
        const newColumn = {
            id: generateId(),
            title: title,
            color: color,
            tasks: []
        };

        state.columns.push(newColumn);
        await saveToFirebase();
        renderBoard();
        closeModal(modalAddColumn);
        document.getElementById('column-title').value = '';
        showToast(t('columnAdded'), 'success');
    }
}

// Supprimer une colonne
async function deleteColumn(columnId) {
    if (confirm(t('confirmDeleteColumn'))) {
        state.columns = state.columns.filter(col => col.id !== columnId);
        await saveToFirebase();
        renderBoard();
        showToast(t('columnDeleted'), 'success');
    }
}

// Ouvrir le modal de tâche
function openTaskModal(columnId, task = null) {
    document.getElementById('task-column-id').value = columnId;
    document.getElementById('modal-task-title').textContent = task ? t('editTask') : t('addTask');

    if (task) {
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-assignee').value = task.assignee || '';
    } else {
        document.getElementById('task-id').value = '';
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-assignee').value = '';
    }

    openModal(modalTask);
}

// Soumettre une tâche
async function handleTaskSubmit(e) {
    e.preventDefault();

    const columnId = document.getElementById('task-column-id').value;
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const assignee = document.getElementById('task-assignee').value.trim();

    if (!title) return;

    const column = state.columns.find(col => col.id === columnId);
    if (!column) return;

    if (taskId) {
        // Modifier une tâche existante
        const task = column.tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.assignee = assignee;
            task.updatedAt = new Date().toISOString();
        }
        showToast(t('taskModified'), 'success');
    } else {
        // Créer une nouvelle tâche
        const newTask = {
            id: generateId(),
            title: title,
            description: description,
            priority: priority,
            assignee: assignee,
            createdAt: new Date().toISOString()
        };
        column.tasks.push(newTask);
        showToast(t('taskAdded'), 'success');
    }

    await saveToFirebase();
    renderBoard();
    closeModal(modalTask);
}

// Supprimer une tâche
async function deleteTask(columnId, taskId) {
    if (confirm(t('confirmDeleteTask'))) {
        const column = state.columns.find(col => col.id === columnId);
        if (column) {
            column.tasks = column.tasks.filter(task => task.id !== taskId);
            await saveToFirebase();
            renderBoard();
            showToast(t('taskDeleted'), 'success');
        }
    }
}

// Rendu du tableau
function renderBoard() {
    shareCodeEl.textContent = state.shareCode || '-';

    kanbanBoard.innerHTML = '';

    state.columns.forEach(column => {
        const columnEl = createColumnElement(column);
        kanbanBoard.appendChild(columnEl);
    });
}

// Créer un élément colonne
function createColumnElement(column) {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.dataset.columnId = column.id;

    const columnTitle = getTranslatedText(column.title, column.titleKey);

    columnEl.innerHTML = `
        <div class="column-header" style="border-bottom-color: ${column.color}">
            <h3>
                <span class="column-dot" style="color: ${column.color}"><i class="fa-solid fa-circle"></i></span>
                ${escapeHtml(columnTitle)}
                <span class="task-count">${column.tasks.length}</span>
            </h3>
            <div class="column-actions">
                <button class="btn-icon delete-column-btn" title="${t('deleteColumn')}"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        <div class="column-tasks" data-column-id="${column.id}">
            ${column.tasks.length === 0 ? '<div class="empty-column"><i class="fa-regular fa-clipboard"></i><br>' + t('noTasks') + '</div>' : ''}
        </div>
        <button class="add-task-btn">
            <i class="fa-solid fa-plus"></i> ${t('addTaskBtn')}
        </button>
    `;

    const tasksContainer = columnEl.querySelector('.column-tasks');
    const deleteColumnButton = columnEl.querySelector('.delete-column-btn');
    const addTaskButton = columnEl.querySelector('.add-task-btn');

    deleteColumnButton.addEventListener('click', () => {
        deleteColumn(column.id);
    });

    addTaskButton.addEventListener('click', () => {
        openTaskModal(column.id);
    });

    // Ajouter les tâches
    column.tasks.forEach(task => {
        const taskEl = createTaskElement(task, column.id);
        tasksContainer.appendChild(taskEl);
    });

    // Configuration du drag & drop
    setupDragAndDrop(tasksContainer);

    return columnEl;
}

// Créer un élément tâche
function createTaskElement(task, columnId) {
    const taskEl = document.createElement('div');
    taskEl.className = 'task-card';
    taskEl.draggable = true;
    taskEl.dataset.taskId = task.id;
    taskEl.dataset.columnId = columnId;

    const priorityLabels = {
        low: t('priorityLow'),
        medium: t('priorityMedium'),
        high: t('priorityHigh')
    };

    const taskTitle = getTranslatedText(task.title, task.titleKey);
    const taskDescription = getTranslatedText(task.description, task.descriptionKey);

    // Stocker les données de la tâche pour l'édition
    taskEl.dataset.task = JSON.stringify(task);

    taskEl.innerHTML = `
        <div class="task-card-header">
            <span class="task-card-title">${escapeHtml(taskTitle)}</span>
            <div class="task-card-actions">
                <button class="btn-icon edit-task-btn" title="${t('editTask')}"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon delete-task-btn" title="${t('deleteTask')}"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        ${taskDescription ? `<p class="task-card-description">${escapeHtml(taskDescription)}</p>` : ''}
        <div class="task-card-footer">
            <span class="task-priority ${task.priority}">${priorityLabels[task.priority] || t('priorityMedium')}</span>
            ${task.assignee ? `<span class="task-assignee"><i class="fa-solid fa-user"></i> ${escapeHtml(task.assignee)}</span>` : ''}
        </div>
    `;

    // Ajouter les événements des boutons
    taskEl.querySelector('.edit-task-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openTaskModal(columnId, task);
    });

    taskEl.querySelector('.delete-task-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(columnId, task.id);
    });

    // Événements drag & drop (desktop avec souris)
    taskEl.addEventListener('dragstart', handleDragStart);
    taskEl.addEventListener('dragend', handleDragEnd);

    // Événements tactiles (iPad doigt / mobile)
    taskEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    taskEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    taskEl.addEventListener('touchend', handleTouchEnd);
    taskEl.addEventListener('touchcancel', handleTouchCancel);

    // Événements pointer (iPad trackpad)
    taskEl.addEventListener('pointerdown', handlePointerDown);

    return taskEl;
}

// Traduire un texte : utilise la clé i18n si disponible,
// sinon cherche si le texte correspond à une traduction connue
function getTranslatedText(text, key) {
    if (key) return t(key);
    if (!text) return text;
    // Chercher si ce texte correspond à une valeur dans les traductions FR ou EN
    // pour retrouver la clé automatiquement (projets existants sans titleKey)
    const langs = ['fr', 'en'];
    for (const lang of langs) {
        const entries = Object.entries(translations[lang]);
        for (const [k, v] of entries) {
            if (v === text) return t(k);
        }
    }
    return text;
}

// Échapper les caractères HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Configuration du drag & drop pour une zone
function setupDragAndDrop(container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
}

// Handlers du drag & drop
let draggedTask = null;
let sourceColumnId = null;

// Variables pour le support tactile
let touchDraggedElement = null;
let touchClone = null;
let touchStartX = 0;
let touchStartY = 0;
let touchOffsetX = 0;
let touchOffsetY = 0;
let isTouchDragging = false;
let longPressTimer = null;

function handleDragStart(e) {
    draggedTask = e.target;
    sourceColumnId = e.target.dataset.columnId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.k-app .column-tasks').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('column-tasks')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('column-tasks')) {
        e.target.classList.remove('drag-over');
    }
}

async function handleDrop(e) {
    e.preventDefault();

    const targetContainer = e.target.closest('.column-tasks');
    if (!targetContainer || !draggedTask) return;

    targetContainer.classList.remove('drag-over');

    const targetColumnId = targetContainer.dataset.columnId;
    const taskId = draggedTask.dataset.taskId;

    if (sourceColumnId === targetColumnId) {
        // Réorganisation dans la même colonne
        return;
    }

    // Trouver la tâche et la déplacer
    const sourceColumn = state.columns.find(col => col.id === sourceColumnId);
    const targetColumn = state.columns.find(col => col.id === targetColumnId);

    if (sourceColumn && targetColumn) {
        const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const [task] = sourceColumn.tasks.splice(taskIndex, 1);
            targetColumn.tasks.push(task);

            await saveToFirebase();
            renderBoard();
            showToast(t('taskMoved'), 'success');
        }
    }

    draggedTask = null;
    sourceColumnId = null;
}

// ===== SUPPORT TACTILE POUR IPAD/MOBILE =====

function handleTouchStart(e) {
    // Ignorer si on touche un bouton d'action
    if (e.target.closest('.btn-icon') || e.target.closest('.task-card-actions')) {
        return;
    }

    const taskCard = e.target.closest('.task-card');
    if (!taskCard) return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // Calculer l'offset du toucher par rapport au coin de la carte
    const rect = taskCard.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;

    // Commencer le drag après un appui long (300ms)
    longPressTimer = setTimeout(() => {
        startTouchDrag(taskCard, touch);
    }, 300);
}

function startTouchDrag(taskCard, touch) {
    isTouchDragging = true;
    touchDraggedElement = taskCard;
    sourceColumnId = taskCard.dataset.columnId;

    // Créer un clone visuel pour le drag
    touchClone = taskCard.cloneNode(true);
    touchClone.classList.add('k-touch-dragging-clone');
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '10000';
    touchClone.style.width = taskCard.offsetWidth + 'px';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.opacity = '0.9';
    touchClone.style.transform = 'rotate(3deg) scale(1.05)';
    touchClone.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
    touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';

    document.body.appendChild(touchClone);

    // Marquer l'élément original comme en cours de drag
    taskCard.classList.add('dragging');
    taskCard.style.opacity = '0.3';

    // Vibration tactile si disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function handleTouchMove(e) {
    // Annuler le timer de long press si on bouge trop vite
    if (longPressTimer && !isTouchDragging) {
        const touch = e.touches[0];
        const moveX = Math.abs(touch.clientX - touchStartX);
        const moveY = Math.abs(touch.clientY - touchStartY);

        if (moveX > 10 || moveY > 10) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        return;
    }

    if (!isTouchDragging || !touchClone) return;

    e.preventDefault();

    const touch = e.touches[0];

    // Déplacer le clone
    touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
    touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';

    // Trouver la colonne sous le doigt
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const columnBelow = elemBelow ? elemBelow.closest('.column-tasks') : null;

    // Mettre à jour les indicateurs visuels
    document.querySelectorAll('.k-app .column-tasks').forEach(col => {
        col.classList.remove('drag-over');
    });

    if (columnBelow) {
        columnBelow.classList.add('drag-over');
    }
}

async function handleTouchEnd(e) {
    // Annuler le timer si pas encore déclenché
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    if (!isTouchDragging || !touchDraggedElement) {
        return;
    }

    // Trouver la colonne de destination
    const touch = e.changedTouches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetContainer = elemBelow ? elemBelow.closest('.column-tasks') : null;

    // Nettoyer les indicateurs visuels
    document.querySelectorAll('.k-app .column-tasks').forEach(col => {
        col.classList.remove('drag-over');
    });

    // Restaurer l'élément original
    touchDraggedElement.classList.remove('dragging');
    touchDraggedElement.style.opacity = '';

    // Supprimer le clone
    if (touchClone && touchClone.parentNode) {
        touchClone.parentNode.removeChild(touchClone);
    }

    // Effectuer le drop si valide
    if (targetContainer) {
        const targetColumnId = targetContainer.dataset.columnId;
        const taskId = touchDraggedElement.dataset.taskId;

        if (sourceColumnId !== targetColumnId) {
            const sourceColumn = state.columns.find(col => col.id === sourceColumnId);
            const targetColumn = state.columns.find(col => col.id === targetColumnId);

            if (sourceColumn && targetColumn) {
                const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    const [task] = sourceColumn.tasks.splice(taskIndex, 1);
                    targetColumn.tasks.push(task);

                    await saveToFirebase();
                    renderBoard();
                    showToast(t('taskMoved'), 'success');
                }
            }
        }
    }

    // Réinitialiser les variables
    touchDraggedElement = null;
    touchClone = null;
    sourceColumnId = null;
    isTouchDragging = false;
}

function handleTouchCancel(e) {
    // Annuler le timer
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    // Nettoyer si un drag était en cours
    if (isTouchDragging) {
        document.querySelectorAll('.k-app .column-tasks').forEach(col => {
            col.classList.remove('drag-over');
        });

        if (touchDraggedElement) {
            touchDraggedElement.classList.remove('dragging');
            touchDraggedElement.style.opacity = '';
        }

        if (touchClone && touchClone.parentNode) {
            touchClone.parentNode.removeChild(touchClone);
        }
    }

    // Réinitialiser
    touchDraggedElement = null;
    touchClone = null;
    sourceColumnId = null;
    isTouchDragging = false;
}

// ===== SUPPORT TRACKPAD IPAD (Pointer Events) =====

let pointerDraggedElement = null;
let pointerClone = null;
let pointerOffsetX = 0;
let pointerOffsetY = 0;
let isPointerDragging = false;
let pointerLongPressTimer = null;

function handlePointerDown(e) {
    // Seulement pour le trackpad/stylet, pas le doigt (géré par touch events)
    // pointerType: "mouse" = trackpad sur iPad, "pen" = Apple Pencil, "touch" = doigt
    if (e.pointerType === 'touch') {
        return; // Laissé aux touch events
    }

    // Ignorer si on clique sur un bouton d'action
    if (e.target.closest('.btn-icon') || e.target.closest('.task-card-actions')) {
        return;
    }

    const taskCard = e.target.closest('.task-card');
    if (!taskCard) return;

    // Calculer l'offset
    const rect = taskCard.getBoundingClientRect();
    pointerOffsetX = e.clientX - rect.left;
    pointerOffsetY = e.clientY - rect.top;

    // Démarrer après un court délai (évite les clics simples)
    pointerLongPressTimer = setTimeout(() => {
        startPointerDrag(taskCard, e);
    }, 200);

    // Écouter les mouvements et le relâchement
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
}

function startPointerDrag(taskCard, e) {
    isPointerDragging = true;
    pointerDraggedElement = taskCard;
    sourceColumnId = taskCard.dataset.columnId;

    // Désactiver le drag HTML5 natif temporairement
    taskCard.draggable = false;

    // Créer un clone visuel
    pointerClone = taskCard.cloneNode(true);
    pointerClone.classList.add('k-touch-dragging-clone');
    pointerClone.style.position = 'fixed';
    pointerClone.style.zIndex = '10000';
    pointerClone.style.width = taskCard.offsetWidth + 'px';
    pointerClone.style.pointerEvents = 'none';
    pointerClone.style.opacity = '0.9';
    pointerClone.style.transform = 'rotate(3deg) scale(1.05)';
    pointerClone.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    pointerClone.style.left = (e.clientX - pointerOffsetX) + 'px';
    pointerClone.style.top = (e.clientY - pointerOffsetY) + 'px';

    document.body.appendChild(pointerClone);

    // Marquer l'original
    taskCard.classList.add('dragging');
    taskCard.style.opacity = '0.3';
}

function handlePointerMove(e) {
    // Annuler le timer si on bouge avant le délai
    if (pointerLongPressTimer && !isPointerDragging) {
        clearTimeout(pointerLongPressTimer);
        pointerLongPressTimer = null;
        cleanupPointerListeners();
        return;
    }

    if (!isPointerDragging || !pointerClone) return;

    e.preventDefault();

    // Déplacer le clone
    pointerClone.style.left = (e.clientX - pointerOffsetX) + 'px';
    pointerClone.style.top = (e.clientY - pointerOffsetY) + 'px';

    // Trouver la colonne sous le curseur
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const columnBelow = elemBelow ? elemBelow.closest('.column-tasks') : null;

    // Mettre à jour les indicateurs visuels
    document.querySelectorAll('.k-app .column-tasks').forEach(col => {
        col.classList.remove('drag-over');
    });

    if (columnBelow) {
        columnBelow.classList.add('drag-over');
    }
}

async function handlePointerUp(e) {
    // Annuler le timer
    if (pointerLongPressTimer) {
        clearTimeout(pointerLongPressTimer);
        pointerLongPressTimer = null;
    }

    cleanupPointerListeners();

    if (!isPointerDragging || !pointerDraggedElement) {
        return;
    }

    // Trouver la colonne de destination
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const targetContainer = elemBelow ? elemBelow.closest('.column-tasks') : null;

    // Nettoyer les indicateurs visuels
    document.querySelectorAll('.k-app .column-tasks').forEach(col => {
        col.classList.remove('drag-over');
    });

    // Restaurer l'élément original
    pointerDraggedElement.classList.remove('dragging');
    pointerDraggedElement.style.opacity = '';
    pointerDraggedElement.draggable = true;

    // Supprimer le clone
    if (pointerClone && pointerClone.parentNode) {
        pointerClone.parentNode.removeChild(pointerClone);
    }

    // Effectuer le drop si valide
    if (targetContainer) {
        const targetColumnId = targetContainer.dataset.columnId;
        const taskId = pointerDraggedElement.dataset.taskId;

        if (sourceColumnId !== targetColumnId) {
            const sourceColumn = state.columns.find(col => col.id === sourceColumnId);
            const targetColumn = state.columns.find(col => col.id === targetColumnId);

            if (sourceColumn && targetColumn) {
                const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    const [task] = sourceColumn.tasks.splice(taskIndex, 1);
                    targetColumn.tasks.push(task);

                    await saveToFirebase();
                    renderBoard();
                    showToast(t('taskMoved'), 'success');
                }
            }
        }
    }

    // Réinitialiser
    pointerDraggedElement = null;
    pointerClone = null;
    sourceColumnId = null;
    isPointerDragging = false;
}

function handlePointerCancel(e) {
    if (pointerLongPressTimer) {
        clearTimeout(pointerLongPressTimer);
        pointerLongPressTimer = null;
    }

    cleanupPointerListeners();

    if (isPointerDragging) {
        document.querySelectorAll('.k-app .column-tasks').forEach(col => {
            col.classList.remove('drag-over');
        });

        if (pointerDraggedElement) {
            pointerDraggedElement.classList.remove('dragging');
            pointerDraggedElement.style.opacity = '';
            pointerDraggedElement.draggable = true;
        }

        if (pointerClone && pointerClone.parentNode) {
            pointerClone.parentNode.removeChild(pointerClone);
        }
    }

    pointerDraggedElement = null;
    pointerClone = null;
    sourceColumnId = null;
    isPointerDragging = false;
}

function cleanupPointerListeners() {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerCancel);
}

// Copier le code de partage
function copyShareCode() {
    if (state.shareCode) {
        navigator.clipboard.writeText(state.shareCode).then(() => {
            showToast(t('codeCopied'), 'success');
        }).catch(() => {
            // Fallback pour les navigateurs qui ne supportent pas clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = state.shareCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast(t('codeCopied'), 'success');
        });
    }
}

// Afficher une notification toast
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'k-toast ' + type;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Exposer les fonctions nécessaires globalement
window.deleteColumn = deleteColumn;
window.openTaskModal = openTaskModal;
window.deleteTask = deleteTask;
