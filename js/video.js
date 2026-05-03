document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        urlInput: document.getElementById('videoUrlInput'),
        titleInput: document.getElementById('videoTitleInput'),
        noteInput: document.getElementById('videoNoteInput'),
        loadButton: document.getElementById('loadVideoBtn'),
        copyButton: document.getElementById('copyShareBtn'),
        resetButton: document.getElementById('resetVideoBtn'),
        shareLinkBlock: document.getElementById('shareLinkBlock'),
        shareLinkOutput: document.getElementById('shareLinkOutput'),
        statusMessage: document.getElementById('statusMessage'),
        videoFrame: document.getElementById('videoFrame'),
        emptyState: document.getElementById('videoEmptyState')
    };

    if (!elements.urlInput || !elements.videoFrame) {
        return;
    }

    const state = {
        videoId: '',
        start: 0,
        title: '',
        note: ''
    };

    const sanitizeText = (value, maxLength) => (value || '').trim().replace(/\s+/gu, ' ').slice(0, maxLength);

    const setStatus = (message, type = 'neutral') => {
        elements.statusMessage.textContent = message;
        elements.statusMessage.classList.remove('is-success', 'is-error');
        if (type === 'success') {
            elements.statusMessage.classList.add('is-success');
        } else if (type === 'error') {
            elements.statusMessage.classList.add('is-error');
        }
    };

    const parseTimeValue = (value) => {
        if (!value) return 0;

        const trimmed = String(value).trim();
        if (/^\d+$/u.test(trimmed)) {
            return Number.parseInt(trimmed, 10);
        }

        const timeMatch = trimmed.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/iu);
        if (!timeMatch) return 0;

        const hours = Number.parseInt(timeMatch[1] || '0', 10);
        const minutes = Number.parseInt(timeMatch[2] || '0', 10);
        const seconds = Number.parseInt(timeMatch[3] || '0', 10);

        return (hours * 3600) + (minutes * 60) + seconds;
    };

    const normalizeVideoId = (value) => {
        if (!value) return '';
        const trimmed = value.trim();
        return /^[a-zA-Z0-9_-]{11}$/u.test(trimmed) ? trimmed : '';
    };

    const extractVideoData = (rawValue) => {
        const directId = normalizeVideoId(rawValue);
        if (directId) {
            return { videoId: directId, start: 0 };
        }

        try {
            const url = new URL(rawValue.trim());
            const host = url.hostname.replace(/^www\./u, '').replace(/^m\./u, '');
            let videoId = '';

            if (host === 'youtu.be') {
                videoId = url.pathname.split('/').filter(Boolean)[0] || '';
            } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
                videoId = url.searchParams.get('v') || '';

                if (!videoId) {
                    const segments = url.pathname.split('/').filter(Boolean);
                    if (segments[0] === 'shorts' || segments[0] === 'embed' || segments[0] === 'live') {
                        videoId = segments[1] || '';
                    }
                }
            }

            const start = parseTimeValue(url.searchParams.get('start') || url.searchParams.get('t'));
            const normalized = normalizeVideoId(videoId);

            if (!normalized) {
                return null;
            }

            return { videoId: normalized, start };
        } catch (error) {
            const fallback = rawValue.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/u);
            if (!fallback) {
                return null;
            }

            return { videoId: fallback[1], start: parseTimeValue(rawValue.match(/[?&](?:t|start)=([^&]+)/u)?.[1]) };
        }
    };

    const buildEmbedUrl = (videoId, start) => {
        const url = new URL(`https://www.youtube.com/embed/${videoId}`);
        url.searchParams.set('rel', '0');
        url.searchParams.set('playsinline', '1');
        url.searchParams.set('iv_load_policy', '3');
        url.searchParams.set('modestbranding', '1');
        if (start > 0) {
            url.searchParams.set('start', String(start));
        }
        return url.toString();
    };

    const buildShareUrl = () => {
        if (!state.videoId) return '';

        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.searchParams.set('v', state.videoId);
        if (state.title) url.searchParams.set('title', state.title);
        if (state.note) url.searchParams.set('note', state.note);
        if (state.start > 0) url.searchParams.set('start', String(state.start));
        url.searchParams.set('view', 'student');
        return url.toString();
    };

    const showShareOutput = () => {
        elements.shareLinkOutput.value = buildShareUrl();
        elements.shareLinkBlock.hidden = !elements.shareLinkOutput.value;
    };

    const renderState = () => {
        if (!state.videoId) {
            elements.videoFrame.hidden = true;
            elements.videoFrame.src = '';
            elements.emptyState.style.display = '';
            elements.shareLinkOutput.value = '';
            elements.shareLinkBlock.hidden = true;
            return;
        }

        elements.videoFrame.src = buildEmbedUrl(state.videoId, state.start);
        elements.videoFrame.hidden = false;
        elements.emptyState.style.display = 'none';
    };

    const updateStateFromInputs = () => {
        const videoData = extractVideoData(elements.urlInput.value);
        if (!videoData) {
            setStatus('Lien invalide.', 'error');
            return false;
        }

        state.videoId = videoData.videoId;
        state.start = videoData.start;
        state.title = sanitizeText(elements.titleInput.value, 180);
        state.note = sanitizeText(elements.noteInput.value, 320);
        renderState();
        setStatus('');
        return true;
    };

    const resetState = () => {
        state.videoId = '';
        state.start = 0;
        state.title = '';
        state.note = '';

        elements.urlInput.value = '';
        elements.titleInput.value = '';
        elements.noteInput.value = '';

        renderState();
        setStatus('');

        if (window.location.search) {
            history.replaceState({}, '', window.location.pathname);
        }
    };

    const fallbackCopy = (text) => {
        elements.shareLinkOutput.focus();
        elements.shareLinkOutput.select();
        elements.shareLinkOutput.setSelectionRange(0, text.length);
        return document.execCommand('copy');
    };

    const copyShareLink = async () => {
        if (!state.videoId && !updateStateFromInputs()) {
            return;
        }

        const shareUrl = buildShareUrl();
        if (!shareUrl) {
            setStatus('Aucun lien.', 'error');
            return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
            } else if (!fallbackCopy(shareUrl)) {
                throw new Error('copy-failed');
            }

            showShareOutput();
            setStatus('Lien copié.');
        } catch (error) {
            showShareOutput();
            setStatus('Copie impossible.', 'error');
        }
    };

    const applyParams = () => {
        const params = new URLSearchParams(window.location.search);
        const isStudentView = params.get('view') === 'student';
        const paramId = normalizeVideoId(params.get('v'));

        if (!isStudentView || !paramId) {
            if (!isStudentView && window.location.search) {
                history.replaceState({}, '', window.location.pathname);
            }
            renderState();
            return;
        }

        state.videoId = paramId;
        state.start = Math.max(0, Number.parseInt(params.get('start') || '0', 10) || 0);
        state.title = sanitizeText(params.get('title'), 180);
        state.note = sanitizeText(params.get('note'), 320);

        elements.urlInput.value = paramId;
        elements.titleInput.value = state.title;
        elements.noteInput.value = state.note;

        document.body.classList.add('youtube-student-view');

        renderState();
        setStatus('');
    };

    elements.loadButton.addEventListener('click', () => {
        document.body.classList.remove('youtube-student-view');
        updateStateFromInputs();
    });

    elements.copyButton.addEventListener('click', () => {
        copyShareLink();
    });

    elements.resetButton.addEventListener('click', () => {
        document.body.classList.remove('youtube-student-view');
        resetState();
    });

    elements.urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            updateStateFromInputs();
        }
    });

    applyParams();
});
