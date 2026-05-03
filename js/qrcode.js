        // ==================== State ====================
        const state = {
            url: '',
            bgColor: '#ffffff',
            transparentBg: false,
            fgColor: '#000000',
            fgColor2: '#0ea5e9',
            cornerColor: '#000000',
            useGradient: false,
            gradientType: 'linear',
            dotsStyle: 'square',
            cornersStyle: 'square',
            logo: null,
            logoPresetId: '',
            logoIconColor: '#111111',
            logoSize: 30,
            logoBg: true,
            showFrame: false,
            frameText: 'Scannez-moi !',
            frameColor: '#06b6d4',
            frameFont: 'Inter',
            size: 300,
            errorCorrection: 'Q',
            margin: 2
        };

        const FRAME_LABEL_FONT_SIZE = 14;

        // ==================== Section Toggle ====================
        function toggleSection(section) {
            section.classList.toggle('collapsed');
        }

        // ==================== Color Pickers ====================
        function syncCornerColorWithFg(color) {
            const cornerInput = document.getElementById('cornerColor');
            const cornerPreview = document.getElementById('cornerColorPreview');
            const cornerValueInput = document.getElementById('cornerColorValue');
            if (!cornerInput || !cornerPreview || !cornerValueInput) return;

            cornerInput.value = color;
            cornerPreview.style.background = color;
            cornerValueInput.value = color;
            state.cornerColor = color;
        }

        function setupColorPicker(inputId, previewId, valueId, stateKey) {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);
            const valueInput = document.getElementById(valueId);
            const openNativePicker = () => {
                if (typeof input.showPicker === 'function') {
                    input.showPicker();
                    return;
                }
                input.click();
            };

            preview.addEventListener('click', (e) => {
                if (e.target !== input) openNativePicker();
            });

            input.addEventListener('input', (e) => {
                const color = e.target.value;
                preview.style.background = color;
                valueInput.value = color;
                state[stateKey] = color;
                if (stateKey === 'fgColor') syncCornerColorWithFg(color);
                if (state.url) generateQR();
            });

            valueInput.addEventListener('change', (e) => {
                let color = e.target.value;
                if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                    color = state[stateKey];
                }
                input.value = color;
                preview.style.background = color;
                valueInput.value = color;
                state[stateKey] = color;
                if (stateKey === 'fgColor') syncCornerColorWithFg(color);
                if (state.url) generateQR();
            });
        }

        setupColorPicker('bgColor', 'bgColorPreview', 'bgColorValue', 'bgColor');
        setupColorPicker('fgColor', 'fgColorPreview', 'fgColorValue', 'fgColor');
        setupColorPicker('fgColor2', 'fgColor2Preview', 'fgColor2Value', 'fgColor2');
        setupColorPicker('cornerColor', 'cornerColorPreview', 'cornerColorValue', 'cornerColor');
        setupColorPicker('frameColor', 'frameColorPreview', 'frameColorValue', 'frameColor');

        // ==================== Transparent Background Toggle ====================
        function toggleTransparentBg() {
            state.transparentBg = !state.transparentBg;
            document.getElementById('transparentBgToggle').classList.toggle('active', state.transparentBg);
            document.getElementById('bgColorGroup').style.display = state.transparentBg ? 'none' : 'block';
            updatePreviewFrameBackground();

            if (state.url) generateQR();
        }

        // ==================== Gradient Toggle ====================
        function toggleGradient() {
            state.useGradient = !state.useGradient;
            document.getElementById('gradientToggle').classList.toggle('active', state.useGradient);
            document.getElementById('gradientOptions').classList.toggle('hidden', !state.useGradient);
            if (state.url) generateQR();
        }

        document.querySelectorAll('.qr-app .gradient-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.qr-app .gradient-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.gradientType = btn.dataset.type;
                if (state.url) generateQR();
            });
        });

        // ==================== Shape Selectors ====================
        function setupShapeSelector(containerId, stateKey) {
            const container = document.getElementById(containerId);
            container.querySelectorAll('.shape-option').forEach(option => {
                option.addEventListener('click', () => {
                    container.querySelectorAll('.shape-option').forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                    state[stateKey] = option.dataset.style;
                    if (state.url) generateQR();
                });
            });
        }

        setupShapeSelector('dotsStyle', 'dotsStyle');
        setupShapeSelector('cornersStyle', 'cornersStyle');

        // ==================== Logo Upload ====================
        const logoInput = document.getElementById('logoInput');
        const logoUpload = document.getElementById('logoUpload');
        const logoPreview = document.getElementById('logoPreview');
        const logoSizeGroup = document.getElementById('logoSizeGroup');
        const logoBgToggle = document.getElementById('logoBgToggle');
        const logoPresetGrid = document.getElementById('logoPresetGrid');
        const logoIconColorInput = document.getElementById('logoIconColor');
        const logoIconColorPreview = document.getElementById('logoIconColorPreview');
        const logoIconColorValue = document.getElementById('logoIconColorValue');

        const socialLogoPresets = [
            {
                id: 'facebook',
                label: 'Facebook',
                icon: 'facebook'
            },
            {
                id: 'instagram',
                label: 'Instagram',
                icon: 'instagram'
            },
            {
                id: 'linkedin',
                label: 'LinkedIn',
                icon: 'linkedin',
                fallbackSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="20" cy="21" r="4" fill="#111"/><rect x="16" y="28" width="8" height="22" rx="2" fill="#111"/><path fill="#111" d="M30 28h7v3.2c1.4-2.3 4-3.7 7.4-3.7 5.7 0 9.6 3.8 9.6 10.6V50h-8V39.4c0-3.1-1.2-5-4-5s-4 1.9-4 5V50h-8V28Z"/></svg>'
            },
            {
                id: 'youtube',
                label: 'YouTube',
                icon: 'youtube'
            },
            {
                id: 'x',
                label: 'X',
                icon: 'x'
            },
            {
                id: 'mastodon',
                label: 'Mastodon',
                icon: 'mastodon'
            },
            {
                id: 'bluesky',
                label: 'Bluesky',
                icon: 'bluesky'
            },
            {
                id: 'discord',
                label: 'Discord',
                icon: 'discord'
            },
            {
                id: 'whatsapp',
                label: 'WhatsApp',
                icon: 'whatsapp'
            }
        ];

        const presetLogoCache = new Map();

        function svgToDataUri(svg) {
            return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
        }

        function normalizeHexColor(color, fallback = '#111111') {
            const value = String(color || '').trim();
            return /^#[0-9A-Fa-f]{6}$/.test(value) ? value.toLowerCase() : fallback.toLowerCase();
        }

        function getSimpleIconUrl(iconName, color = state.logoIconColor) {
            const colorHex = normalizeHexColor(color, '#111111').slice(1);
            return `https://cdn.simpleicons.org/${iconName}/${colorHex}`;
        }

        function colorizeSvg(svg, color) {
            const normalizedColor = normalizeHexColor(color, '#111111');
            return svg
                .replace(/fill="#[0-9A-Fa-f]{3,8}"/g, `fill="${normalizedColor}"`)
                .replace(/stroke="#[0-9A-Fa-f]{3,8}"/g, `stroke="${normalizedColor}"`);
        }

        function getFallbackPresetDataUri(preset, color = state.logoIconColor) {
            if (!preset.fallbackSvg) return '';
            return svgToDataUri(colorizeSvg(preset.fallbackSvg, color));
        }

        async function getPresetLogoDataUri(preset, color = state.logoIconColor) {
            const normalizedColor = normalizeHexColor(color, state.logoIconColor);
            const cacheKey = `${preset.icon}:${normalizedColor}`;
            if (presetLogoCache.has(cacheKey)) {
                return presetLogoCache.get(cacheKey);
            }

            try {
                const response = await fetch(getSimpleIconUrl(preset.icon, normalizedColor), { mode: 'cors' });
                if (!response.ok) {
                    throw new Error(`Icon load failed: ${preset.icon}`);
                }
                const svg = await response.text();
                const dataUri = svgToDataUri(svg);
                presetLogoCache.set(cacheKey, dataUri);
                return dataUri;
            } catch (error) {
                const fallback = getFallbackPresetDataUri(preset, normalizedColor);
                if (fallback) {
                    presetLogoCache.set(cacheKey, fallback);
                    return fallback;
                }
                throw error;
            }
        }

        function getPresetById(presetId) {
            return socialLogoPresets.find((preset) => preset.id === presetId);
        }

        function updatePresetSelection(activePresetId = '') {
            if (!logoPresetGrid) return;
            logoPresetGrid.querySelectorAll('.logo-preset-btn').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.presetId === activePresetId);
            });
        }

        function setLogoImage(src, presetId = '') {
            state.logo = src;
            state.logoPresetId = presetId;
            logoPreview.src = src;
            logoUpload.classList.add('has-file');
            logoSizeGroup.style.display = 'block';
            logoBgToggle.style.display = 'flex';
            updatePresetSelection(presetId);
            if (state.url) generateQR();
        }

        function renderLogoPresets() {
            if (!logoPresetGrid) return;
            logoPresetGrid.innerHTML = '';
            socialLogoPresets.forEach((preset) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'logo-preset-btn';
                button.dataset.presetId = preset.id;
                button.setAttribute('aria-label', `Inserer le logo ${preset.label}`);
                button.innerHTML = `<img src="${getSimpleIconUrl(preset.icon, state.logoIconColor)}" alt="${preset.label}">`;
                const imgEl = button.querySelector('img');
                const fallbackPreview = getFallbackPresetDataUri(preset, state.logoIconColor);
                if (imgEl && fallbackPreview) {
                    imgEl.addEventListener('error', () => {
                        imgEl.src = fallbackPreview;
                    }, { once: true });
                }
                button.addEventListener('click', async () => {
                    logoInput.value = '';
                    try {
                        const src = await getPresetLogoDataUri(preset, state.logoIconColor);
                        setLogoImage(src, preset.id);
                    } catch (error) {
                        console.error(error);
                        alert("Impossible de charger cette icone pour l'instant.");
                    }
                });
                logoPresetGrid.appendChild(button);
            });
            updatePresetSelection(state.logoPresetId);
        }

        function refreshPresetPreviewIcons() {
            if (!logoPresetGrid) return;
            logoPresetGrid.querySelectorAll('.logo-preset-btn').forEach((btn) => {
                const preset = getPresetById(btn.dataset.presetId);
                const imgEl = btn.querySelector('img');
                if (!preset || !imgEl) return;

                imgEl.src = getSimpleIconUrl(preset.icon, state.logoIconColor);
                const fallbackPreview = getFallbackPresetDataUri(preset, state.logoIconColor);
                imgEl.onerror = fallbackPreview ? () => { imgEl.src = fallbackPreview; } : null;
            });
        }

        async function applyLogoIconColor(color) {
            state.logoIconColor = normalizeHexColor(color, state.logoIconColor);
            const requestedColor = state.logoIconColor;
            if (logoIconColorInput) logoIconColorInput.value = state.logoIconColor;
            if (logoIconColorPreview) logoIconColorPreview.style.background = state.logoIconColor;
            if (logoIconColorValue) logoIconColorValue.value = state.logoIconColor;

            refreshPresetPreviewIcons();

            if (!state.logoPresetId) return;
            const preset = getPresetById(state.logoPresetId);
            if (!preset) return;

            try {
                const src = await getPresetLogoDataUri(preset, requestedColor);
                if (state.logoPresetId === preset.id && state.logoIconColor === requestedColor) {
                    setLogoImage(src, preset.id);
                }
            } catch (error) {
                console.error(error);
            }
        }

        function setupLogoIconColorPicker() {
            if (!logoIconColorInput || !logoIconColorPreview || !logoIconColorValue) return;

            const openNativePicker = () => {
                if (typeof logoIconColorInput.showPicker === 'function') {
                    logoIconColorInput.showPicker();
                    return;
                }
                logoIconColorInput.click();
            };

            logoIconColorPreview.addEventListener('click', (e) => {
                if (e.target !== logoIconColorInput) openNativePicker();
            });

            logoIconColorInput.addEventListener('input', (e) => {
                applyLogoIconColor(e.target.value);
            });

            logoIconColorValue.addEventListener('change', (e) => {
                applyLogoIconColor(e.target.value);
            });
        }

        renderLogoPresets();
        setupLogoIconColorPicker();
        applyLogoIconColor(state.logoIconColor);

        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    alert('Le fichier est trop volumineux (max 2MB)');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    setLogoImage(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });

        function removeLogo(e) {
            if (e) e.stopPropagation();
            state.logo = null;
            state.logoPresetId = '';
            logoInput.value = '';
            logoUpload.classList.remove('has-file');
            logoSizeGroup.style.display = 'none';
            logoBgToggle.style.display = 'none';
            updatePresetSelection('');
            if (state.url) generateQR();
        }

        const logoSizeInput = document.getElementById('logoSize');
        const logoSizeValue = document.getElementById('logoSizeValue');
        logoSizeInput.addEventListener('input', (e) => {
            state.logoSize = parseInt(e.target.value);
            logoSizeValue.textContent = state.logoSize + '%';
            if (state.url) generateQR();
        });

        function toggleLogoBg() {
            state.logoBg = !state.logoBg;
            document.getElementById('logoBgToggleBtn').classList.toggle('active', state.logoBg);
            if (state.url) generateQR();
        }

        // ==================== Frame Toggle ====================
        function toggleFrame() {
            state.showFrame = !state.showFrame;
            document.getElementById('frameToggle').classList.toggle('active', state.showFrame);
            document.getElementById('frameOptions').classList.toggle('hidden', !state.showFrame);
            if (state.url) generateQR();
        }

        document.getElementById('frameText').addEventListener('input', (e) => {
            state.frameText = e.target.value || 'Scannez-moi !';
            if (state.url) generateQR();
        });

        document.getElementById('frameFont').addEventListener('change', (e) => {
            state.frameFont = e.target.value;
            applyFrameLabelStyles();
            if (state.url) generateQR();
        });

        // ==================== Settings ====================
        const qrSizeInput = document.getElementById('qrSize');
        const sizeValue = document.getElementById('sizeValue');
        qrSizeInput.addEventListener('input', (e) => {
            state.size = parseInt(e.target.value);
            sizeValue.textContent = state.size;
            if (state.url) generateQR();
        });

        document.getElementById('errorCorrection').addEventListener('change', (e) => {
            state.errorCorrection = e.target.value;
            if (state.url) generateQR();
        });

        const qrMarginInput = document.getElementById('qrMargin');
        const marginValue = document.getElementById('marginValue');
        qrMarginInput.addEventListener('input', (e) => {
            state.margin = parseInt(e.target.value);
            marginValue.textContent = state.margin;
            if (state.url) generateQR();
        });

        // ==================== QR Code Generation ====================
        const urlInput = document.getElementById('urlInput');
        const generateBtn = document.getElementById('generateBtn');
        const placeholder = document.getElementById('placeholder');
        const qrFrame = document.getElementById('qrFrame');
        const qrCanvas = document.getElementById('qrCanvas');
        const qrLabel = document.getElementById('qrLabel');
        const downloadOptions = document.getElementById('downloadOptions');
        const transparentPreviewBg = 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)';

        function updatePreviewFrameBackground() {
            if (!qrFrame) return;
            if (state.transparentBg) {
                qrFrame.style.background = transparentPreviewBg;
                qrFrame.style.backgroundSize = '16px 16px';
                qrFrame.style.backgroundPosition = '0 0, 0 8px, 8px -8px, -8px 0px';
                return;
            }

            qrFrame.style.background = state.bgColor;
            qrFrame.style.backgroundSize = '';
            qrFrame.style.backgroundPosition = '';
        }

        function applyFrameLabelStyles() {
            qrLabel.style.background = state.frameColor;
            qrLabel.style.fontFamily = state.frameFont;
            qrLabel.style.fontSize = `${FRAME_LABEL_FONT_SIZE}px`;
            qrLabel.style.padding = '6px 16px';
            qrLabel.style.borderRadius = '18px';
            qrLabel.style.marginTop = '4px';
        }

        generateBtn.addEventListener('click', generateQR);
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') generateQR();
        });

        function generateQR() {
            let url = urlInput.value.trim();
            if (!url) {
                urlInput.focus();
                urlInput.style.borderColor = 'var(--qr-error)';
                setTimeout(() => urlInput.style.borderColor = '', 2000);
                return;
            }

            if (!/^https?:\/\//i.test(url) && !url.includes(' ') && url.includes('.')) {
                url = 'https://' + url;
            }
            state.url = url;

            // Create QR code
            const qr = qrcode(0, state.errorCorrection || 'Q');
            qr.addData(url);
            qr.make();

            const moduleCount = qr.getModuleCount();
            const scale = 3; // High resolution multiplier
            const baseSize = state.size * scale;
            const moduleSize = Math.floor((baseSize - state.margin * 2 * 10 * scale) / moduleCount);
            const size = moduleCount * moduleSize + state.margin * 2 * moduleSize;

            qrCanvas.width = size;
            qrCanvas.height = size;
            qrCanvas.style.width = (size / scale) + 'px';
            qrCanvas.style.height = (size / scale) + 'px';
            const ctx = qrCanvas.getContext('2d');

            // Background (white/color or transparent)
            if (!state.transparentBg) {
                ctx.fillStyle = state.bgColor;
                ctx.fillRect(0, 0, size, size);
            } else {
                ctx.clearRect(0, 0, size, size);
            }

            // Prepare foreground color/gradient
            let fillStyle = state.fgColor;
            if (state.useGradient) {
                if (state.gradientType === 'linear') {
                    fillStyle = ctx.createLinearGradient(0, 0, size, size);
                } else {
                    fillStyle = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
                }
                fillStyle.addColorStop(0, state.fgColor);
                fillStyle.addColorStop(1, state.fgColor2);
            }

            const margin = state.margin * moduleSize;

            // Draw modules
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        const x = margin + col * moduleSize;
                        const y = margin + row * moduleSize;

                        // Check if this is a finder pattern
                        const isFinderPattern =
                            (row < 7 && col < 7) ||
                            (row < 7 && col >= moduleCount - 7) ||
                            (row >= moduleCount - 7 && col < 7);

                        const moduleStyle = isFinderPattern ? state.cornersStyle : state.dotsStyle;
                        ctx.fillStyle = isFinderPattern ? state.cornerColor : fillStyle;
                        drawModule(ctx, x, y, moduleSize, moduleStyle);
                    }
                }
            }

            // Draw logo
            if (state.logo) {
                const img = new Image();
                img.onload = () => {
                    const logoMaxSize = size * (state.logoSize / 100);
                    const ratio = Math.min(logoMaxSize / img.width, logoMaxSize / img.height);
                    const logoW = img.width * ratio;
                    const logoH = img.height * ratio;
                    const logoX = (size - logoW) / 2;
                    const logoY = (size - logoH) / 2;

                    if (state.logoBg) {
                        const padding = 8;
                        if (!state.transparentBg) {
                            ctx.fillStyle = state.bgColor;
                            ctx.beginPath();
                            roundRect(ctx, logoX - padding, logoY - padding, logoW + padding * 2, logoH + padding * 2, 8);
                            ctx.fill();
                        } else {
                            // Clear the area behind logo for transparent background
                            ctx.clearRect(logoX - padding, logoY - padding, logoW + padding * 2, logoH + padding * 2);
                        }
                    }

                    ctx.drawImage(img, logoX, logoY, logoW, logoH);
                    showQR();
                };
                img.src = state.logo;
            } else {
                showQR();
            }
        }

        function drawModule(ctx, x, y, size, style) {
            const s = size * 0.9;
            const offset = (size - s) / 2;

            ctx.beginPath();
            switch (style) {
                case 'rounded':
                    roundRect(ctx, x + offset, y + offset, s, s, s * 0.3);
                    break;
                case 'dots':
                    ctx.arc(x + size/2, y + size/2, s/2, 0, Math.PI * 2);
                    break;
                case 'classy':
                    ctx.moveTo(x + size/2, y + offset);
                    ctx.lineTo(x + size - offset, y + size/2);
                    ctx.lineTo(x + size/2, y + size - offset);
                    ctx.lineTo(x + offset, y + size/2);
                    break;
                default:
                    ctx.rect(x + offset, y + offset, s, s);
            }
            ctx.fill();
        }

        function roundRect(ctx, x, y, w, h, r) {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
        }

        function showQR() {
            placeholder.classList.add('hidden');
            qrFrame.classList.remove('hidden');
            updatePreviewFrameBackground();

            downloadOptions.classList.remove('hidden');

            if (state.showFrame && state.frameText) {
                qrLabel.textContent = state.frameText;
                applyFrameLabelStyles();
                qrLabel.classList.remove('hidden');
            } else {
                qrLabel.classList.add('hidden');
            }

            qrFrame.classList.add('fade-in');
            setTimeout(() => qrFrame.classList.remove('fade-in'), 300);
        }

        // ==================== Download ====================
        const filenameInput = document.getElementById('filenameInput');

        function downloadQR(format) {
            const filename = filenameInput.value.trim() || 'qrcode';
            const link = document.createElement('a');

            if (format === 'svg') {
                // Create SVG version
                const svgData = canvasToSVG();
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                link.href = URL.createObjectURL(blob);
                link.download = `${filename}.svg`;
            } else {
                const finalCanvas = createFinalCanvas();
                link.href = finalCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
                link.download = `${filename}.${format}`;
            }

            link.click();
        }

        document.querySelectorAll('.qr-app .section-header').forEach((header) => {
            header.addEventListener('click', () => {
                toggleSection(header.parentElement);
            });
        });

        document.getElementById('transparentBgRow')?.addEventListener('click', toggleTransparentBg);
        document.getElementById('gradientToggleRow')?.addEventListener('click', toggleGradient);
        document.getElementById('frameToggleRow')?.addEventListener('click', toggleFrame);
        document.getElementById('removeLogoBtn')?.addEventListener('click', removeLogo);
        document.getElementById('logoBgToggle')?.addEventListener('click', toggleLogoBg);

        document.querySelectorAll('[data-download-format]').forEach((button) => {
            button.addEventListener('click', () => {
                downloadQR(button.dataset.downloadFormat);
            });
        });

        function createFinalCanvas() {
            const padding = state.showFrame && state.frameText
                ? 60
                : 0;
            const canvas = document.createElement('canvas');
            canvas.width = qrCanvas.width;
            canvas.height = qrCanvas.height + padding;
            const ctx = canvas.getContext('2d');

            // Background (only if not transparent)
            if (!state.transparentBg) {
                ctx.fillStyle = state.bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // QR Code
            ctx.drawImage(qrCanvas, 0, 0);

            // Frame label
            if (state.showFrame && state.frameText) {
                const fontSize = FRAME_LABEL_FONT_SIZE;
                const labelHeight = 36;
                const labelY = qrCanvas.height + Math.round((padding - labelHeight) / 2);
                ctx.font = `600 ${fontSize}px ${state.frameFont}`;
                const textWidth = ctx.measureText(state.frameText).width;
                const labelWidth = Math.max(160, Math.ceil(textWidth + 32));

                ctx.fillStyle = state.frameColor;
                ctx.beginPath();
                roundRect(
                    ctx,
                    canvas.width / 2 - labelWidth / 2,
                    labelY,
                    labelWidth,
                    labelHeight,
                    Math.round(labelHeight / 2)
                );
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(state.frameText, canvas.width / 2, labelY + labelHeight / 2);
            }

            return canvas;
        }

        function canvasToSVG() {
            // Simple SVG export - basic representation
            const size = qrCanvas.width;
            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
            svg += `<rect width="${size}" height="${size}" fill="${state.bgColor}"/>`;

            // Simplified: embed as image
            svg += `<image href="${qrCanvas.toDataURL()}" width="${size}" height="${size}"/>`;
            svg += '</svg>';

            return svg;
        }
