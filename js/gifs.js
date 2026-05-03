const els = {
    framesInput: document.getElementById('framesInput'),
    addFramesBtn: document.getElementById('addFramesBtn'),
    clearFramesBtn: document.getElementById('clearFramesBtn'),
    syncSizeBtn: document.getElementById('syncSizeBtn'),
    applyDelayBtn: document.getElementById('applyDelayBtn'),
    widthInput: document.getElementById('widthInput'),
    heightInput: document.getElementById('heightInput'),
    fitModeSelect: document.getElementById('fitModeSelect'),
    backgroundColorInput: document.getElementById('backgroundColorInput'),
    transparentBgBtn: document.getElementById('transparentBgBtn'),
    defaultDelayInput: document.getElementById('defaultDelayInput'),
    loopCountInput: document.getElementById('loopCountInput'),
    dropZone: document.getElementById('dropZone'),
    previewCanvas: document.getElementById('previewCanvas'),
    previewBoard: document.querySelector('.gif-preview-board'),
    emptyPreview: document.getElementById('emptyPreview'),
    emptySequence: document.getElementById('emptySequence'),
    frameList: document.getElementById('frameList'),
    framesCountPill: document.getElementById('framesCountPill'),
    durationPill: document.getElementById('durationPill'),
    sizePill: document.getElementById('sizePill'),
    downloadGifBtn: document.getElementById('downloadGifBtn'),
    previewToggleBtn: document.getElementById('previewToggleBtn')
};

const previewCtx = els.previewCanvas.getContext('2d', { alpha: true });

const state = {
    frames: [],
    activeFrameIndex: 0,
    isPlaying: true,
    transparentBackground: false,
    previewTimer: null,
    exportInProgress: false,
    nextFrameId: 1
};

function clamp(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, number));
}

function setStatus(message) {
    void message;
}

function readInputNumber(element, min, max, fallback) {
    return clamp(element.value, min, max, fallback);
}

function commitInputNumber(element, min, max, fallback) {
    const value = readInputNumber(element, min, max, fallback);
    element.value = String(value);
    return value;
}

function updateCanvasSize(commit = false) {
    const width = commit
        ? commitInputNumber(els.widthInput, 32, 1600, 640)
        : readInputNumber(els.widthInput, 32, 1600, 640);
    const height = commit
        ? commitInputNumber(els.heightInput, 32, 1600, 360)
        : readInputNumber(els.heightInput, 32, 1600, 360);

    if (els.previewCanvas.width !== width || els.previewCanvas.height !== height) {
        els.previewCanvas.width = width;
        els.previewCanvas.height = height;
    }

    els.sizePill.textContent = `${width} × ${height}`;
}

function getDefaultDelay(commit = false) {
    return commit
        ? commitInputNumber(els.defaultDelayInput, 20, 5000, 400)
        : readInputNumber(els.defaultDelayInput, 20, 5000, 400);
}

function getLoopCount(commit = false) {
    return commit
        ? commitInputNumber(els.loopCountInput, 0, 999, 0)
        : readInputNumber(els.loopCountInput, 0, 999, 0);
}

function formatFrameCount(count) {
    return `${count} ${count > 1 ? 'images' : 'image'}`;
}

function formatDuration(totalMs) {
    if (totalMs < 1000) {
        return `${totalMs} ms`;
    }

    const seconds = totalMs / 1000;
    return `${seconds.toFixed(seconds >= 10 ? 1 : 2)} s`;
}

function updateSummary() {
    const count = state.frames.length;
    const totalDuration = state.frames.reduce((sum, frame) => sum + frame.delay, 0);
    const loopCount = getLoopCount(false);

    els.framesCountPill.textContent = formatFrameCount(count);
    els.durationPill.textContent = formatDuration(totalDuration);
    els.previewCanvas.classList.toggle('is-empty', count === 0);
    els.previewCanvas.classList.toggle('is-transparent-bg', state.transparentBackground);
    els.previewBoard.classList.toggle('has-frames', count > 0);
    els.previewBoard.classList.toggle('is-transparent', state.transparentBackground);
    els.previewBoard.style.setProperty('--gif-preview-bg', els.backgroundColorInput.value);
    els.transparentBgBtn.classList.toggle('is-active', state.transparentBackground);
    els.transparentBgBtn.setAttribute('aria-pressed', state.transparentBackground ? 'true' : 'false');
    els.emptyPreview.classList.toggle('is-hidden', count > 0);
    els.emptySequence.classList.toggle('is-hidden', count > 0);
    els.downloadGifBtn.disabled = count < 2 || state.exportInProgress;
    els.previewToggleBtn.disabled = count < 2;
    els.clearFramesBtn.disabled = count === 0;
    els.applyDelayBtn.disabled = count === 0;
    els.syncSizeBtn.disabled = count === 0;
}

function markActiveFrame() {
    const cards = els.frameList.querySelectorAll('.gif-frame-card');
    cards.forEach((card, index) => {
        card.classList.toggle('is-active', index === state.activeFrameIndex);
    });
}

function drawBackground(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);

    if (state.transparentBackground) {
        return;
    }

    ctx.save();
    ctx.fillStyle = els.backgroundColorInput.value;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

function drawFrameToCanvas(frame, canvas, ctx) {
    const width = canvas.width;
    const height = canvas.height;
    const image = frame.image;
    const fitMode = els.fitModeSelect.value;

    drawBackground(ctx, width, height);

    if (!image) {
        return;
    }

    if (fitMode === 'stretch') {
        ctx.drawImage(image, 0, 0, width, height);
        return;
    }

    const imageRatio = image.width / image.height;
    const canvasRatio = width / height;
    const scale = fitMode === 'cover'
        ? Math.max(width / image.width, height / image.height)
        : Math.min(width / image.width, height / image.height);

    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    if (!Number.isFinite(imageRatio) || !Number.isFinite(canvasRatio)) {
        ctx.drawImage(image, 0, 0, width, height);
        return;
    }

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function renderPreview() {
    updateCanvasSize(false);
    previewCtx.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);

    if (!state.frames.length) {
        return;
    }

    const safeIndex = Math.min(state.activeFrameIndex, state.frames.length - 1);
    state.activeFrameIndex = Math.max(0, safeIndex);
    drawFrameToCanvas(state.frames[state.activeFrameIndex], els.previewCanvas, previewCtx);
    markActiveFrame();
}

function clearPreviewTimer() {
    if (state.previewTimer) {
        window.clearTimeout(state.previewTimer);
        state.previewTimer = null;
    }
}

function schedulePreview() {
    clearPreviewTimer();

    if (!state.isPlaying || state.frames.length < 2) {
        return;
    }

    const currentFrame = state.frames[state.activeFrameIndex] || state.frames[0];
    const fallbackDelay = getDefaultDelay(false);
    const delay = clamp(currentFrame?.delay, 20, 5000, fallbackDelay);

    state.previewTimer = window.setTimeout(() => {
        state.activeFrameIndex = (state.activeFrameIndex + 1) % state.frames.length;
        renderPreview();
        schedulePreview();
    }, delay);
}

function refreshPreviewPlayback() {
    renderPreview();
    schedulePreview();
    els.previewToggleBtn.innerHTML = state.isPlaying
        ? '<i class="fas fa-pause" aria-hidden="true"></i><span>Pause</span>'
        : '<i class="fas fa-play" aria-hidden="true"></i><span>Lecture</span>';
}

function syncSizeFromFirstFrame() {
    if (!state.frames.length) {
        return;
    }

    const firstFrame = state.frames[0];
    const maxWidth = 960;
    const maxHeight = 1600;
    const scale = Math.min(maxWidth / firstFrame.width, maxHeight / firstFrame.height, 1);
    els.widthInput.value = String(Math.round(firstFrame.width * scale));
    els.heightInput.value = String(Math.round(firstFrame.height * scale));
    updateCanvasSize(true);
    refreshPreviewPlayback();
}

function updateFrameList() {
    if (!state.frames.length) {
        els.frameList.replaceChildren();
        return;
    }
    const fragment = document.createDocumentFragment();

    state.frames.forEach((frame, index) => {
        const item = document.createElement('li');
        item.className = `gif-frame-card${index === state.activeFrameIndex ? ' is-active' : ''}`;
        item.dataset.frameId = String(frame.id);

        const thumb = document.createElement('img');
        thumb.className = 'gif-frame-thumb';
        thumb.src = frame.objectUrl;
        thumb.alt = '';

        const main = document.createElement('div');
        main.className = 'gif-frame-main';

        const title = document.createElement('h3');
        title.title = frame.name;
        title.textContent = frame.name;

        const meta = document.createElement('div');
        meta.className = 'gif-frame-meta';
        meta.textContent = `${frame.width} × ${frame.height} px`;

        const settings = document.createElement('div');
        settings.className = 'gif-frame-settings';

        const delayField = document.createElement('div');
        delayField.className = 'gif-delay-field';

        const delayLabel = document.createElement('label');
        delayLabel.htmlFor = `delay-${frame.id}`;
        delayLabel.textContent = 'Durée';

        const delayInput = document.createElement('input');
        delayInput.id = `delay-${frame.id}`;
        delayInput.className = 'gif-input';
        delayInput.type = 'number';
        delayInput.min = '20';
        delayInput.max = '5000';
        delayInput.step = '10';
        delayInput.value = String(frame.delay);
        delayInput.dataset.action = 'delay';

        delayField.append(delayLabel, delayInput);
        settings.append(delayField);
        main.append(title, meta, settings);

        const actions = document.createElement('div');
        actions.className = 'gif-frame-actions';

        const makeActionButton = (action, titleText, iconClass, disabled = false) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'gif-icon-button';
            button.dataset.action = action;
            button.title = titleText;
            button.disabled = disabled;

            const icon = document.createElement('i');
            icon.className = iconClass;
            icon.setAttribute('aria-hidden', 'true');

            button.append(icon);
            return button;
        };

        actions.append(
            makeActionButton('select', 'Afficher cette image', 'fas fa-eye'),
            makeActionButton('up', 'Déplacer vers le haut', 'fas fa-arrow-up', index === 0),
            makeActionButton('down', 'Déplacer vers le bas', 'fas fa-arrow-down', index === state.frames.length - 1),
            makeActionButton('delete', 'Supprimer cette image', 'fas fa-trash')
        );

        item.append(thumb, main, actions);
        fragment.append(item);
    });

    els.frameList.replaceChildren(fragment);
}

function rebuildUI() {
    updateCanvasSize(false);
    updateSummary();
    updateFrameList();
    refreshPreviewPlayback();
}

function revokeFrameUrls(frames = state.frames) {
    frames.forEach((frame) => {
        if (frame?.objectUrl) {
            URL.revokeObjectURL(frame.objectUrl);
        }
    });
}

function createImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Impossible de charger ${url}`));
        image.src = url;
    });
}

async function normalizeFiles(fileList) {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    const delay = getDefaultDelay(true);

    const loadedFrames = [];

    for (const file of files) {
        const objectUrl = URL.createObjectURL(file);

        try {
            const image = await createImageFromUrl(objectUrl);
            loadedFrames.push({
                id: state.nextFrameId++,
                name: file.name,
                file,
                image,
                objectUrl,
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
                delay
            });
        } catch (error) {
            URL.revokeObjectURL(objectUrl);
            setStatus(`Impossible de charger ${file.name}.`);
        }
    }

    return loadedFrames;
}

async function addFiles(fileList) {
    const newFrames = await normalizeFiles(fileList);

    if (!newFrames.length) {
        if (!state.frames.length) {
            setStatus('Ajoute des images.');
        }
        return;
    }

    const hadFrames = state.frames.length > 0;
    state.frames.push(...newFrames);

    if (!hadFrames) {
        syncSizeFromFirstFrame();
        setStatus(state.frames.length > 1
            ? 'Images importées.'
            : 'Ajoute encore une image.');
    } else {
        setStatus(`${newFrames.length} image${newFrames.length > 1 ? 's ajoutées' : ' ajoutée'}.`);
    }

    rebuildUI();
}

function moveFrame(frameId, direction) {
    const index = state.frames.findIndex((frame) => frame.id === frameId);
    const newIndex = index + direction;

    if (index < 0 || newIndex < 0 || newIndex >= state.frames.length) {
        return;
    }

    const [frame] = state.frames.splice(index, 1);
    state.frames.splice(newIndex, 0, frame);
    state.activeFrameIndex = newIndex;
    rebuildUI();
}

function removeFrame(frameId) {
    const index = state.frames.findIndex((frame) => frame.id === frameId);
    if (index < 0) {
        return;
    }

    const [removed] = state.frames.splice(index, 1);
    revokeFrameUrls([removed]);

    if (state.activeFrameIndex >= state.frames.length) {
        state.activeFrameIndex = Math.max(0, state.frames.length - 1);
    }

    setStatus(state.frames.length
        ? 'Image supprimée.'
        : 'Séquence vide.');

    rebuildUI();
}

function clearFrames() {
    revokeFrameUrls();
    state.frames = [];
    state.activeFrameIndex = 0;
    clearPreviewTimer();
    setStatus('Séquence vidée.');
    rebuildUI();
}

function applyDelayToAllFrames() {
    const delay = getDefaultDelay(true);
    state.frames = state.frames.map((frame) => ({ ...frame, delay }));
    setStatus(`${delay} ms sur toute la séquence.`);
    rebuildUI();
}

function getPaletteForImageData(imageData) {
    const buckets = new Map();
    const pixels = imageData.data;

    for (let offset = 0; offset < pixels.length; offset += 4) {
        const alpha = pixels[offset + 3];
        if (alpha < 16) {
            continue;
        }

        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const bucketKey = ((red >> 4) << 8) | ((green >> 4) << 4) | (blue >> 4);
        const bucket = buckets.get(bucketKey) || { count: 0, red: 0, green: 0, blue: 0 };

        bucket.count += 1;
        bucket.red += red;
        bucket.green += green;
        bucket.blue += blue;

        buckets.set(bucketKey, bucket);
    }

    const palette = Array.from(buckets.values())
        .sort((left, right) => right.count - left.count)
        .slice(0, 255)
        .map((bucket) => [
            Math.round(bucket.red / bucket.count),
            Math.round(bucket.green / bucket.count),
            Math.round(bucket.blue / bucket.count)
        ]);

    palette.unshift([0, 0, 0]);

    while (palette.length < 256) {
        const lastColor = palette[palette.length - 1];
        palette.push([...lastColor]);
    }

    return palette;
}

function colorDistanceSquared(aRed, aGreen, aBlue, bRed, bGreen, bBlue) {
    const redDiff = aRed - bRed;
    const greenDiff = aGreen - bGreen;
    const blueDiff = aBlue - bBlue;
    return redDiff * redDiff + greenDiff * greenDiff + blueDiff * blueDiff;
}

function indexPixels(imageData, palette) {
    const pixels = imageData.data;
    const indexedPixels = new Uint8Array(imageData.width * imageData.height);
    const lookup = new Map();

    for (let pixelIndex = 0, offset = 0; offset < pixels.length; offset += 4, pixelIndex += 1) {
        const alpha = pixels[offset + 3];
        if (alpha < 16) {
            indexedPixels[pixelIndex] = 0;
            continue;
        }

        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const key = ((red >> 4) << 8) | ((green >> 4) << 4) | (blue >> 4);

        if (lookup.has(key)) {
            indexedPixels[pixelIndex] = lookup.get(key);
            continue;
        }

        let bestIndex = 1;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (let paletteIndex = 1; paletteIndex < palette.length; paletteIndex += 1) {
            const [paletteRed, paletteGreen, paletteBlue] = palette[paletteIndex];
            const distance = colorDistanceSquared(red, green, blue, paletteRed, paletteGreen, paletteBlue);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = paletteIndex;

                if (distance === 0) {
                    break;
                }
            }
        }

        lookup.set(key, bestIndex);
        indexedPixels[pixelIndex] = bestIndex;
    }

    return indexedPixels;
}

function createIndexedFrame(imageData, delay) {
    const palette = getPaletteForImageData(imageData);
    const indexedPixels = indexPixels(imageData, palette);
    return { palette, indexedPixels, delay };
}

class ByteWriter {
    constructor() {
        this.bytes = [];
    }

    writeByte(value) {
        this.bytes.push(value & 0xff);
    }

    writeWord(value) {
        this.writeByte(value & 0xff);
        this.writeByte((value >> 8) & 0xff);
    }

    writeAscii(text) {
        for (let index = 0; index < text.length; index += 1) {
            this.writeByte(text.charCodeAt(index));
        }
    }

    writeBytes(values) {
        for (const value of values) {
            this.writeByte(value);
        }
    }

    toUint8Array() {
        return new Uint8Array(this.bytes);
    }
}

class BitWriter {
    constructor() {
        this.bytes = [];
        this.current = 0;
        this.bitIndex = 0;
    }

    write(code, size) {
        for (let bit = 0; bit < size; bit += 1) {
            if (code & (1 << bit)) {
                this.current |= 1 << this.bitIndex;
            }

            this.bitIndex += 1;

            if (this.bitIndex === 8) {
                this.bytes.push(this.current);
                this.current = 0;
                this.bitIndex = 0;
            }
        }
    }

    finish() {
        if (this.bitIndex > 0) {
            this.bytes.push(this.current);
            this.current = 0;
            this.bitIndex = 0;
        }

        return this.bytes;
    }
}

function lzwEncode(indexedPixels, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    let nextCode = endCode + 1;
    let codeSize = minCodeSize + 1;
    let dictionary = new Map();

    const resetDictionary = () => {
        dictionary = new Map();
        for (let code = 0; code < clearCode; code += 1) {
            dictionary.set(String(code), code);
        }
        nextCode = endCode + 1;
        codeSize = minCodeSize + 1;
    };

    resetDictionary();

    const bitWriter = new BitWriter();
    bitWriter.write(clearCode, codeSize);

    let prefix = indexedPixels[0];

    for (let index = 1; index < indexedPixels.length; index += 1) {
        const value = indexedPixels[index];
        const candidate = `${prefix},${value}`;

        if (dictionary.has(candidate)) {
            prefix = dictionary.get(candidate);
            continue;
        }

        bitWriter.write(prefix, codeSize);

        if (nextCode < 4096) {
            dictionary.set(candidate, nextCode);
            nextCode += 1;

            if (nextCode === 1 << codeSize && codeSize < 12) {
                codeSize += 1;
            }
        } else {
            bitWriter.write(clearCode, codeSize);
            resetDictionary();
        }

        prefix = value;
    }

    bitWriter.write(prefix, codeSize);
    bitWriter.write(endCode, codeSize);

    return bitWriter.finish();
}

function writeColorTable(writer, palette) {
    for (const color of palette) {
        writer.writeByte(color[0]);
        writer.writeByte(color[1]);
        writer.writeByte(color[2]);
    }
}

function writeSubBlocks(writer, bytes) {
    for (let offset = 0; offset < bytes.length; offset += 255) {
        const block = bytes.slice(offset, offset + 255);
        writer.writeByte(block.length);
        writer.writeBytes(block);
    }
    writer.writeByte(0);
}

function encodeGif(frames, width, height, loopCount) {
    const writer = new ByteWriter();

    writer.writeAscii('GIF89a');
    writer.writeWord(width);
    writer.writeWord(height);
    writer.writeByte(0x70);
    writer.writeByte(0);
    writer.writeByte(0);

    writer.writeByte(0x21);
    writer.writeByte(0xff);
    writer.writeByte(11);
    writer.writeAscii('NETSCAPE2.0');
    writer.writeByte(3);
    writer.writeByte(1);
    writer.writeWord(loopCount);
    writer.writeByte(0);

    frames.forEach((frame) => {
        writer.writeByte(0x21);
        writer.writeByte(0xf9);
        writer.writeByte(4);
        writer.writeByte(0x01);
        writer.writeWord(Math.max(2, Math.round(frame.delay / 10)));
        writer.writeByte(0);
        writer.writeByte(0);

        writer.writeByte(0x2c);
        writer.writeWord(0);
        writer.writeWord(0);
        writer.writeWord(width);
        writer.writeWord(height);
        writer.writeByte(0x87);
        writeColorTable(writer, frame.palette);
        writer.writeByte(8);
        writeSubBlocks(writer, lzwEncode(frame.indexedPixels, 8));
    });

    writer.writeByte(0x3b);
    return writer.toUint8Array();
}

async function buildIndexedFrames() {
    const width = commitInputNumber(els.widthInput, 32, 1600, 640);
    const height = commitInputNumber(els.heightInput, 32, 1600, 360);
    const scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = width;
    scratchCanvas.height = height;
    const scratchCtx = scratchCanvas.getContext('2d', { alpha: true, willReadFrequently: true });
    const indexedFrames = [];

    for (let index = 0; index < state.frames.length; index += 1) {
        const frame = state.frames[index];
        drawFrameToCanvas(frame, scratchCanvas, scratchCtx);
        const imageData = scratchCtx.getImageData(0, 0, width, height);
        indexedFrames.push(createIndexedFrame(imageData, frame.delay));

        if (index < state.frames.length - 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
    }

    return { indexedFrames, width, height };
}

async function downloadGif() {
    if (state.frames.length < 2 || state.exportInProgress) {
        return;
    }

    state.exportInProgress = true;
    updateSummary();
        setStatus('Préparation du GIF...');

    try {
        const { indexedFrames, width, height } = await buildIndexedFrames();
        setStatus('Encodage...');

        const bytes = encodeGif(indexedFrames, width, height, getLoopCount(true));
        const blob = new Blob([bytes], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        const baseName = state.frames[0]?.name?.replace(/\.[^.]+$/, '') || 'animation';

        downloadLink.href = url;
        downloadLink.download = `${baseName}.gif`;
        downloadLink.click();

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus('GIF téléchargé.');
    } catch (error) {
        console.error(error);
        setStatus("Export impossible. Essaie plus petit.");
    } finally {
        state.exportInProgress = false;
        updateSummary();
    }
}

function handleFrameListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) {
        return;
    }

    const card = button.closest('.gif-frame-card');
    const frameId = Number(card?.dataset.frameId);
    if (!frameId) {
        return;
    }

    const action = button.dataset.action;

    if (action === 'select') {
        state.activeFrameIndex = state.frames.findIndex((frame) => frame.id === frameId);
        refreshPreviewPlayback();
        return;
    }

    if (action === 'up') {
        moveFrame(frameId, -1);
        return;
    }

    if (action === 'down') {
        moveFrame(frameId, 1);
        return;
    }

    if (action === 'delete') {
        removeFrame(frameId);
    }
}

function handleFrameListInput(event) {
    const input = event.target.closest('input[data-action="delay"]');
    if (!input) {
        return;
    }

    const card = input.closest('.gif-frame-card');
    const frameId = Number(card?.dataset.frameId);
    const frame = state.frames.find((item) => item.id === frameId);

    if (!frame) {
        return;
    }

    frame.delay = clamp(input.value, 20, 5000, getDefaultDelay(false));
    input.value = String(frame.delay);
    updateSummary();
    schedulePreview();
}

function wireDropZone() {
    const activateInput = () => els.framesInput.click();

    els.dropZone.addEventListener('click', activateInput);
    els.dropZone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activateInput();
        }
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
        els.dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            els.dropZone.classList.add('is-dragover');
        });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        els.dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            els.dropZone.classList.remove('is-dragover');
        });
    });

    els.dropZone.addEventListener('drop', (event) => {
        addFiles(event.dataTransfer?.files);
    });
}

function bindEvents() {
    els.addFramesBtn.addEventListener('click', () => els.framesInput.click());
    els.framesInput.addEventListener('change', async (event) => {
        await addFiles(event.target.files);
        event.target.value = '';
    });

    els.clearFramesBtn.addEventListener('click', clearFrames);
    els.syncSizeBtn.addEventListener('click', () => {
        syncSizeFromFirstFrame();
        setStatus('Taille calée sur la première image.');
    });
    els.applyDelayBtn.addEventListener('click', applyDelayToAllFrames);
    els.downloadGifBtn.addEventListener('click', downloadGif);
    els.previewToggleBtn.addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        refreshPreviewPlayback();
    });

    [els.widthInput, els.heightInput, els.fitModeSelect, els.backgroundColorInput, els.loopCountInput].forEach((element) => {
        element.addEventListener('input', () => {
            updateSummary();
            refreshPreviewPlayback();
        });
    });

    els.transparentBgBtn.addEventListener('click', () => {
        state.transparentBackground = !state.transparentBackground;
        updateSummary();
        refreshPreviewPlayback();
    });

    els.defaultDelayInput.addEventListener('input', updateSummary);
    [els.widthInput, els.heightInput].forEach((element) => {
        element.addEventListener('blur', () => {
            updateCanvasSize(true);
            refreshPreviewPlayback();
        });
    });
    els.defaultDelayInput.addEventListener('blur', () => {
        getDefaultDelay(true);
        updateSummary();
    });
    els.loopCountInput.addEventListener('blur', () => {
        getLoopCount(true);
        updateSummary();
    });
    els.frameList.addEventListener('click', handleFrameListClick);
    els.frameList.addEventListener('input', handleFrameListInput);
}

function init() {
    wireDropZone();
    bindEvents();
    updateCanvasSize(true);
    rebuildUI();
    drawBackground(previewCtx, els.previewCanvas.width, els.previewCanvas.height);
}

window.addEventListener('beforeunload', () => {
    clearPreviewTimer();
    revokeFrameUrls();
});

document.addEventListener('DOMContentLoaded', init);
