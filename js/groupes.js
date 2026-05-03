// ===== STATE =====
const state = {
    names: ['Léa','Hugo','Manon','Lucas','Chloé','Nathan','Camille','Théo','Inès','Louis','Emma','Raphaël','Jade','Antoine','Sarah'],
    shuffled: [],
    currentTab: 'spinner',
    singleIndex: 0,
    lineupIndex: 0,
    spinning: false,
    spinAngle: 0,
    swapFirst: null,
    viewTransitioning: false,
    spinAnimation: null,
};

function getCardColor(index, total) {
    const safeTotal = Math.max(total, 1);
    const hue = Math.round((360 / safeTotal) * index);
    const isDark = document.body.classList.contains('dark-mode');

    return {
        accent: `hsl(${hue}, 72%, ${isDark ? 64 : 60}%)`,
        tint: `hsla(${hue}, 72%, ${isDark ? 64 : 60}%, ${isDark ? 0.12 : 0.09})`,
    };
}

function normalizeNames(list) {
    return list.map(n => n.trim()).filter(n => n.length > 0);
}

function readNamesFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('names');
    if (!raw) return null;
    const names = normalizeNames(raw.split('|'));
    return names.length ? names : null;
}

function writeNamesToUrl(names) {
    const url = new URL(window.location.href);
    const normalized = normalizeNames(names);
    if (normalized.length) {
        url.searchParams.set('names', normalized.join('|'));
    } else {
        url.searchParams.delete('names');
    }
    window.history.replaceState({}, '', url);
}

function syncCurrentOrderToUrl() {
    state.names = [...state.shuffled];
    writeNamesToUrl(state.names);
}

// ===== INIT =====
function init() {
    const namesFromUrl = readNamesFromUrl();
    if (namesFromUrl) {
        state.names = namesFromUrl;
        state.shuffled = [...state.names];
    } else {
        state.shuffled = shuffle([...state.names]);
    }
    setupTabs();
    setupToolbar();
    setupSingleNav();
    setupLineupNav();
    setupGroupControls();
    setupTeamControls();
    setupChartControls();
    setupEditModal();
    setupKeyboard();
    setupMotionEnhancements();
    setupSpinnerInteraction();
    populateGroupSelect();
    populateTeamSelect();
    writeNamesToUrl(state.shuffled);
    renderCurrentView();
}

// ===== UTILITIES =====
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function hslColor(index, total, saturation = 75, lightness = 55) {
    const hue = Math.round((360 / total) * index);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function showToast(msg = 'Copié !') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 1600);
}

// ===== TABS =====
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
}

function switchTab(nextTab) {
    if (state.viewTransitioning || nextTab === state.currentTab) return;

    const currentView = document.getElementById(`${state.currentTab}-view`);
    const nextView = document.getElementById(`${nextTab}-view`);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === nextTab));
    state.currentTab = nextTab;
    state.swapFirst = null;

    if (!currentView || !nextView || prefersReducedMotion) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        nextView.classList.add('active');
        renderCurrentView();
        return;
    }

    state.viewTransitioning = true;
    currentView.animate(
        [
            { opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' },
            { opacity: 0, transform: 'translateY(-6px) scale(0.99)', filter: 'blur(2px)' },
        ],
        { duration: 180, easing: 'ease-out', fill: 'forwards' }
    ).finished
        .catch(() => {})
        .then(() => {
            currentView.classList.remove('active');
            nextView.classList.add('active');
            renderCurrentView();
            return nextView.animate(
                [
                    { opacity: 0, transform: 'translateY(10px) scale(0.99)', filter: 'blur(2px)' },
                    { opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' },
                ],
                { duration: 280, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'forwards' }
            ).finished.catch(() => {});
        })
        .finally(() => {
            currentView.style.opacity = '';
            currentView.style.transform = '';
            currentView.style.filter = '';
            nextView.style.opacity = '';
            nextView.style.transform = '';
            nextView.style.filter = '';
            state.viewTransitioning = false;
        });
}

function setupMotionEnhancements() {
    setupRippleEffects();
    attachPointerParallax(document.getElementById('single-name-display'), 6);
}

function setupSpinnerInteraction() {
    const container = document.querySelector('.spinner-container');
    if (!container) return;
    container.addEventListener('click', () => {
        if (!state.spinning) spinWheel();
    });
}

function setupRippleEffects() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    document.addEventListener('click', (e) => {
        const button = e.target.closest('#content button, #toolbar button, #tab-bar button');
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.15;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 520);
    });
}

function attachPointerParallax(el, intensity = 8) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || prefersReducedMotion) return;

    let raf = null;
    let tx = 0;
    let ty = 0;

    el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        tx = x * intensity;
        ty = y * intensity;

        if (raf) return;
        raf = requestAnimationFrame(() => {
            el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
            raf = null;
        });
    });

    el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 220ms ease';
        el.style.transform = 'translate3d(0, 0, 0)';
        setTimeout(() => {
            el.style.transition = '';
        }, 240);
    });
}

function animateElementsStagger(container, selector, step = 30, duration = 300) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !container) return;

    const elements = container.querySelectorAll(selector);
    elements.forEach((el, i) => {
        el.animate(
            [
                { opacity: 0, transform: 'translateY(8px) scale(0.99)' },
                { opacity: 1, transform: 'translateY(0px) scale(1)' },
            ],
            {
                duration,
                delay: Math.min(i * step, 260),
                easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
                fill: 'both',
            }
        );
    });
}

// ===== TOOLBAR =====
function setupToolbar() {
    document.getElementById('btn-shuffle').addEventListener('click', reshuffleAll);
    document.getElementById('btn-edit').addEventListener('click', openEditModal);
    document.getElementById('btn-copy').addEventListener('click', copyCurrentView);
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
}

function reshuffleAll() {
    state.shuffled = shuffle([...state.names]);
    syncCurrentOrderToUrl();
    state.singleIndex = 0;
    state.lineupIndex = 0;
    state.swapFirst = null;
    renderCurrentView();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        document.body.classList.add('fullscreen');
    } else {
        document.exitFullscreen();
        document.body.classList.remove('fullscreen');
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen');
    }
});

// ===== KEYBOARD =====
function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        switch (e.key.toLowerCase()) {
            case 'r':
                reshuffleAll();
                break;
            case 'arrowleft':
            case 'arrowup':
            case 'p':
                e.preventDefault();
                navigatePrev();
                break;
            case 'arrowright':
            case 'arrowdown':
            case 'n':
                e.preventDefault();
                navigateNext();
                break;
            case 's':
                if (state.currentTab === 'spinner' && !state.spinning) {
                    spinWheel();
                }
                break;
            case ' ':
                if (state.currentTab === 'spinner' && !state.spinning) {
                    e.preventDefault();
                    spinWheel();
                }
                break;
            case 'escape':
                document.getElementById('edit-modal').classList.add('hidden');
                break;
        }
    });
}

function navigatePrev() {
    if (state.currentTab === 'single') {
        state.singleIndex = (state.singleIndex - 1 + state.shuffled.length) % state.shuffled.length;
        renderSingle();
    } else if (state.currentTab === 'lineup') {
        state.lineupIndex = (state.lineupIndex - 1 + state.shuffled.length) % state.shuffled.length;
        renderLineup();
    }
}

function navigateNext() {
    if (state.currentTab === 'single') {
        state.singleIndex = (state.singleIndex + 1) % state.shuffled.length;
        renderSingle();
    } else if (state.currentTab === 'lineup') {
        state.lineupIndex = (state.lineupIndex + 1) % state.shuffled.length;
        renderLineup();
    }
}

// ===== RENDER =====
function renderCurrentView() {
    switch (state.currentTab) {
        case 'spinner': renderSpinner(); break;
        case 'single': renderSingle(); break;
        case 'lineup': renderLineup(); break;
        case 'groups': renderGroups(); break;
        case 'teams': renderTeams(); break;
        case 'chart': renderChart(); break;
    }
}

// ===== SPINNER / WHEEL =====
function renderSpinner() {
    drawWheel();
    document.getElementById('spinner-result').classList.add('hidden');
}

function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const names = state.shuffled;
    const n = names.length;
    if (n === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    const size = container.clientWidth || 500;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const radius = size / 2 - 4;
    const arc = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(0);

    for (let i = 0; i < n; i++) {
        const startAngle = i * arc - Math.PI / 2;
        const endAngle = startAngle + arc;

        // Segment
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = hslColor(i, n, 72, 62);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        const fontSize = Math.min(22, Math.max(10, Math.floor(250 / n)));
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 2;
        const textRadius = radius - 18;
        const maxLen = Math.max(8, Math.floor(textRadius / (fontSize * 0.55)));
        const displayName = names[i].length > maxLen ? names[i].slice(0, maxLen - 1) + '…' : names[i];
        ctx.fillText(displayName, textRadius, fontSize * 0.35);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.12, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
    canvas.style.transform = `rotate(${state.spinAngle}deg)`;
}

function spinWheel() {
    if (state.shuffled.length === 0) return;
    state.spinning = true;
    document.getElementById('spinner-result').classList.add('hidden');

    const n = state.shuffled.length;
    const arc = 360 / n;
    const targetIndex = Math.floor(Math.random() * n);
    const targetAngle = -(targetIndex * arc + arc / 2);
    const fullRotations = 360 * (5 + Math.floor(Math.random() * 3));
    const currentNorm = ((state.spinAngle % 360) + 360) % 360;
    const targetNorm = ((targetAngle % 360) + 360) % 360;
    const endAngle = state.spinAngle + fullRotations + (targetNorm - currentNorm);
    const canvas = document.getElementById('wheel-canvas');
    const container = document.querySelector('.spinner-container');

    if (state.spinAnimation) state.spinAnimation.cancel();
    container?.classList.add('spinning');

    state.spinAnimation = canvas.animate(
        [
            { transform: `rotate(${state.spinAngle}deg)` },
            { transform: `rotate(${endAngle}deg)` },
        ],
        {
            duration: 3600,
            easing: 'cubic-bezier(0.12, 0.85, 0.22, 1)',
            fill: 'forwards',
        }
    );

    state.spinAnimation.onfinish = () => {
        state.spinAngle = endAngle;
        state.spinning = false;
        state.spinAnimation = null;
        container?.classList.remove('spinning');
        showSpinnerResult(targetIndex);
    };

    state.spinAnimation.oncancel = () => {
        state.spinning = false;
        state.spinAnimation = null;
        container?.classList.remove('spinning');
    };
}

function showSpinnerResult(index) {
    const resultEl = document.getElementById('spinner-result');
    const nameEl = document.getElementById('spinner-result-name');
    nameEl.textContent = state.shuffled[index];
    resultEl.classList.remove('hidden');

    document.getElementById('btn-remove-name').onclick = () => {
        const removedName = state.shuffled[index];
        state.shuffled.splice(index, 1);
        const sourceIdx = state.names.indexOf(removedName);
        if (sourceIdx !== -1) state.names.splice(sourceIdx, 1);
        syncCurrentOrderToUrl();
        if (state.shuffled.length === 0) {
            state.shuffled = shuffle([...state.names]);
        }
        resultEl.classList.add('hidden');
        drawWheel(state.spinAngle);
    };
}

// ===== SINGLE NAME =====
function setupSingleNav() {
    document.getElementById('single-prev').addEventListener('click', () => {
        state.singleIndex = (state.singleIndex - 1 + state.shuffled.length) % state.shuffled.length;
        renderSingle();
    });
    document.getElementById('single-next').addEventListener('click', () => {
        state.singleIndex = (state.singleIndex + 1) % state.shuffled.length;
        renderSingle();
    });
}

function renderSingle() {
    if (state.shuffled.length === 0) return;
    const display = document.getElementById('single-name-display');
    const name = state.shuffled[state.singleIndex % state.shuffled.length];
    display.textContent = name;
    if (name.length > 12) {
        display.style.fontSize = 'clamp(2.2rem, 7vw, 4.2rem)';
    } else {
        display.style.fontSize = '';
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        display.animate(
            [
                { opacity: 0, transform: 'translateY(10px) scale(0.985)' },
                { opacity: 1, transform: 'translateY(0px) scale(1)' },
            ],
            { duration: 260, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
        );
    }
}

// ===== LINEUP =====
function setupLineupNav() {
    document.getElementById('lineup-prev').addEventListener('click', () => {
        state.lineupIndex = (state.lineupIndex - 1 + state.shuffled.length) % state.shuffled.length;
        renderLineup();
    });
    document.getElementById('lineup-next').addEventListener('click', () => {
        state.lineupIndex = (state.lineupIndex + 1) % state.shuffled.length;
        renderLineup();
    });
}

function renderLineup() {
    if (state.shuffled.length === 0) return;
    const current = document.getElementById('lineup-current');
    const list = document.getElementById('lineup-list');
    const idx = state.lineupIndex % state.shuffled.length;

    current.textContent = `${idx + 1}. ${state.shuffled[idx]}`;

    list.innerHTML = '';
    state.shuffled.forEach((name, i) => {
        const li = document.createElement('li');
        li.textContent = name;
        if (i === idx) li.classList.add('is-current');
        list.appendChild(li);
    });

    const currentLi = list.querySelector('.is-current');
    if (currentLi) {
        currentLi.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    animateElementsStagger(list, 'li', 20, 240);
}

// ===== GROUPS =====
function setupGroupControls() {
    document.getElementById('group-size').addEventListener('change', renderGroups);
    document.getElementById('btn-reshuffle-groups').addEventListener('click', () => {
        state.shuffled = shuffle([...state.names]);
        syncCurrentOrderToUrl();
        state.swapFirst = null;
        renderGroups();
    });
}

function populateGroupSelect() {
    const sel = document.getElementById('group-size');
    const prevVal = sel.value;
    sel.innerHTML = '';
    const max = Math.max(1, state.names.length);
    for (let i = 1; i <= max; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        sel.appendChild(opt);
    }
    sel.value = (prevVal && parseInt(prevVal) <= max) ? prevVal : '2';
}

function renderGroups() {
    const container = document.getElementById('groups-container');
    container.innerHTML = '';
    const size = parseInt(document.getElementById('group-size').value) || 2;
    const names = [...state.shuffled];
    const groups = [];

    for (let i = 0; i < names.length; i += size) {
        groups.push(names.slice(i, i + size));
    }

    groups.forEach((group, gi) => {
        const colors = getCardColor(gi, groups.length);
        const card = document.createElement('div');
        card.className = 'group-card';
        card.style.animationDelay = `${gi * 0.05}s`;
        card.style.setProperty('--card-accent', colors.accent);
        card.style.setProperty('--card-tint', colors.tint);

        const header = document.createElement('div');
        header.className = 'group-card-header';
        header.textContent = `Groupe ${gi + 1}`;

        const body = document.createElement('div');
        body.className = 'group-card-body';

        group.forEach((name, memberIndex) => {
            const member = document.createElement('div');
            member.className = 'group-member';
            member.textContent = name;
            member.dataset.shuffledIndex = String((gi * size) + memberIndex);
            member.addEventListener('click', () => handleSwap(member));
            body.appendChild(member);
        });

        card.appendChild(header);
        card.appendChild(body);
        container.appendChild(card);
    });
    animateElementsStagger(container, '.group-card', 45, 300);
}

// ===== TEAMS =====
function setupTeamControls() {
    document.getElementById('team-count').addEventListener('change', renderTeams);
    document.getElementById('btn-reshuffle-teams').addEventListener('click', () => {
        state.shuffled = shuffle([...state.names]);
        syncCurrentOrderToUrl();
        state.swapFirst = null;
        renderTeams();
    });
}

function populateTeamSelect() {
    const sel = document.getElementById('team-count');
    const prevVal = sel.value;
    sel.innerHTML = '';
    const max = Math.max(1, state.names.length);
    for (let i = 1; i <= max; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        sel.appendChild(opt);
    }
    sel.value = (prevVal && parseInt(prevVal) <= max) ? prevVal : '2';
}

function renderTeams() {
    const container = document.getElementById('teams-container');
    container.innerHTML = '';
    const count = parseInt(document.getElementById('team-count').value) || 2;
    const names = state.shuffled.map((name, index) => ({ name, index }));
    const teams = Array.from({ length: count }, () => []);
    names.forEach((entry, i) => {
        teams[i % count].push(entry);
    });

    teams.forEach((team, ti) => {
        const colors = getCardColor(ti, teams.length);
        const card = document.createElement('div');
        card.className = 'group-card';
        card.style.animationDelay = `${ti * 0.05}s`;
        card.style.setProperty('--card-accent', colors.accent);
        card.style.setProperty('--card-tint', colors.tint);

        const header = document.createElement('div');
        header.className = 'group-card-header';
        header.textContent = `Équipe ${ti + 1}`;

        const body = document.createElement('div');
        body.className = 'group-card-body';

        team.forEach(entry => {
            const member = document.createElement('div');
            member.className = 'group-member';
            member.textContent = entry.name;
            member.dataset.shuffledIndex = String(entry.index);
            member.addEventListener('click', () => handleSwap(member));
            body.appendChild(member);
        });

        card.appendChild(header);
        card.appendChild(body);
        container.appendChild(card);
    });
    animateElementsStagger(container, '.group-card', 45, 300);
}

// ===== SWAP (Groups / Teams) =====
function handleSwap(el) {
    if (state.swapFirst === null) {
        state.swapFirst = el;
        el.classList.add('selected');
    } else {
        if (state.swapFirst === el) {
            el.classList.remove('selected');
            state.swapFirst = null;
            return;
        }
        const firstIndex = parseInt(state.swapFirst.dataset.shuffledIndex, 10);
        const secondIndex = parseInt(el.dataset.shuffledIndex, 10);
        if (!Number.isNaN(firstIndex) && !Number.isNaN(secondIndex)) {
            const tempName = state.shuffled[firstIndex];
            state.shuffled[firstIndex] = state.shuffled[secondIndex];
            state.shuffled[secondIndex] = tempName;
            syncCurrentOrderToUrl();
        }
        const temp = state.swapFirst.textContent;
        state.swapFirst.textContent = el.textContent;
        el.textContent = temp;
        state.swapFirst.classList.remove('selected');
        state.swapFirst = null;
    }
}

// ===== CHART / SEATING =====
function setupChartControls() {
    document.getElementById('btn-apply-chart').addEventListener('click', renderChart);
    document.getElementById('btn-reshuffle-chart').addEventListener('click', () => {
        state.shuffled = shuffle([...state.names]);
        syncCurrentOrderToUrl();
        state.swapFirst = null;
        renderChart();
    });
}

function renderChart() {
    const container = document.getElementById('chart-container');
    container.innerHTML = '';
    const cols = parseInt(document.getElementById('chart-cols').value) || 5;
    const rows = parseInt(document.getElementById('chart-rows').value) || 3;
    const totalSeats = cols * rows;
    const names = [...state.shuffled];
    container.style.gridTemplateColumns = `repeat(${cols}, minmax(100px, 1fr))`;

    for (let i = 0; i < totalSeats; i++) {
        const cell = document.createElement('div');
        const colors = getCardColor(i, totalSeats);
        cell.style.setProperty('--cell-accent', colors.accent);
        cell.style.setProperty('--cell-tint', colors.tint);
        if (i < names.length) {
            cell.className = 'chart-cell';
            cell.dataset.shuffledIndex = String(i);
            setChartCellContent(cell, names[i]);
            cell.addEventListener('click', () => handleChartSwap(cell));
        } else {
            cell.className = 'chart-cell empty';
            delete cell.dataset.shuffledIndex;
            setChartCellContent(cell, '');
        }
        container.appendChild(cell);
    }
    animateElementsStagger(container, '.chart-cell', 12, 220);
}

function setChartCellContent(cell, name) {
    cell.dataset.name = name;
    const seatLayout = document.createElement('div');
    seatLayout.className = 'chart-seat-layout';

    const desk = document.createElement('div');
    desk.className = 'chart-desk';

    const seatName = document.createElement('span');
    seatName.className = 'chart-seat-name';
    seatName.textContent = name || '—';

    desk.appendChild(seatName);
    seatLayout.appendChild(desk);
    cell.replaceChildren(seatLayout);
}

function handleChartSwap(cell) {
    if (cell.classList.contains('empty')) return;

    if (state.swapFirst === null) {
        state.swapFirst = cell;
        cell.classList.add('selected');
    } else {
        if (state.swapFirst === cell) {
            cell.classList.remove('selected');
            state.swapFirst = null;
            return;
        }
        const firstName = state.swapFirst.dataset.name || '';
        const secondName = cell.dataset.name || '';
        const firstIndex = parseInt(state.swapFirst.dataset.shuffledIndex, 10);
        const secondIndex = parseInt(cell.dataset.shuffledIndex, 10);
        if (!Number.isNaN(firstIndex) && !Number.isNaN(secondIndex)) {
            state.shuffled[firstIndex] = secondName;
            state.shuffled[secondIndex] = firstName;
            syncCurrentOrderToUrl();
        }
        setChartCellContent(state.swapFirst, secondName);
        setChartCellContent(cell, firstName);
        state.swapFirst.classList.remove('selected');
        state.swapFirst = null;
    }
}

// ===== EDIT NAMES MODAL =====
function setupEditModal() {
    document.getElementById('btn-cancel-edit').addEventListener('click', closeEditModal);
    document.getElementById('btn-apply-names').addEventListener('click', applyNames);
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-modal')) closeEditModal();
    });
}

function openEditModal() {
    const textarea = document.getElementById('names-textarea');
    textarea.value = state.names.join('\n');
    document.getElementById('edit-modal').classList.remove('hidden');
    setTimeout(() => textarea.focus(), 50);
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

function applyNames() {
    const text = document.getElementById('names-textarea').value.trim();
    if (!text) return;
    const newNames = normalizeNames(text.split('\n'));
    if (newNames.length === 0) return;

    state.names = newNames;
    state.shuffled = shuffle([...state.names]);
    state.singleIndex = 0;
    state.lineupIndex = 0;
    state.spinAngle = 0;
    state.swapFirst = null;

    populateGroupSelect();
    populateTeamSelect();
    syncCurrentOrderToUrl();
    closeEditModal();
    renderCurrentView();
}

// ===== COPY =====
function copyCurrentView() {
    let text = '';

    switch (state.currentTab) {
        case 'spinner': {
            const result = document.getElementById('spinner-result-name').textContent;
            text = result || state.shuffled.join(', ');
            break;
        }
        case 'single':
            text = state.shuffled[state.singleIndex % state.shuffled.length] || '';
            break;
        case 'lineup':
            text = state.shuffled.map((n, i) => `${i + 1}. ${n}`).join('\n');
            break;
        case 'groups': {
            const cards = document.querySelectorAll('#groups-container .group-card');
            cards.forEach(card => {
                const header = card.querySelector('.group-card-header').textContent;
                const members = [...card.querySelectorAll('.group-member')].map(m => m.textContent);
                text += `${header}\n${members.join('\n')}\n\n`;
            });
            break;
        }
        case 'teams': {
            const cards = document.querySelectorAll('#teams-container .group-card');
            cards.forEach(card => {
                const header = card.querySelector('.group-card-header').textContent;
                const members = [...card.querySelectorAll('.group-member')].map(m => m.textContent);
                text += `${header}\n${members.join('\n')}\n\n`;
            });
            break;
        }
        case 'chart': {
            const cols = parseInt(document.getElementById('chart-cols').value) || 5;
            const cells = document.querySelectorAll('#chart-container .chart-cell');
            const rows = [];
            let row = [];
            cells.forEach((cell, i) => {
                row.push(cell.classList.contains('empty') ? '' : (cell.dataset.name || ''));
                if ((i + 1) % cols === 0) {
                    rows.push(row.join('\t'));
                    row = [];
                }
            });
            if (row.length) rows.push(row.join('\t'));
            text = rows.join('\n');
            break;
        }
    }

    if (text) {
        navigator.clipboard.writeText(text.trim()).then(() => showToast()).catch(() => {
            showToast('Erreur de copie');
        });
    }
}

// ===== RESIZE HANDLER =====
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (state.currentTab === 'spinner') {
            drawWheel(state.spinAngle);
        }
    }, 150);
});

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
