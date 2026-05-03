'use strict';

let selectedColor = '#002c77';
let selectedLogo = 'images/florimont-logo-ecole.png';
let transparentBg = false;
const LOGO_SIZE = 0.28;

const themeToggle = document.getElementById('themeToggle');
const iconSun = themeToggle.querySelector('.icon-sun');
const iconMoon = themeToggle.querySelector('.icon-moon');
const urlInput = document.getElementById('urlInput');
const generateBtn = document.getElementById('generateBtn');
const qrOutput = document.getElementById('qrOutput');
const qrCanvas = document.getElementById('qrCanvas');
const qrFrame = document.querySelector('.qr-frame');

let logoImage = new Image();
logoImage.src = 'images/florimont-logo-ecole.png';

function updateThemeIcon(theme) {
    iconSun.style.display = theme === 'dark' ? 'none' : 'inline';
    iconMoon.style.display = theme === 'dark' ? 'inline' : 'none';
}

function updateOptionButtons(button) {
    button.closest('.option-group').querySelectorAll('.option-btn').forEach((option) => {
        option.classList.remove('active');
    });
    button.classList.add('active');
}

function selectLogo(button) {
    updateOptionButtons(button);
    selectedLogo = button.dataset.logo;

    if (selectedLogo !== 'none') {
        logoImage = new Image();
        logoImage.src = selectedLogo;
        if (qrOutput.classList.contains('visible')) {
            logoImage.onload = () => generateQR();
        }
    } else if (qrOutput.classList.contains('visible')) {
        generateQR();
    }
}

function selectColor(button) {
    updateOptionButtons(button);
    selectedColor = button.dataset.color;

    if (qrOutput.classList.contains('visible')) {
        generateQR();
    }
}

function updatePreviewBackground() {
    if (transparentBg) {
        qrFrame.style.background = 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)';
        qrFrame.style.backgroundSize = '16px 16px';
        qrFrame.style.backgroundPosition = '0 0, 0 8px, 8px -8px, -8px 0px';
        return;
    }

    qrFrame.style.background = 'white';
    qrFrame.style.backgroundSize = '';
    qrFrame.style.backgroundPosition = '';
}

function selectBackground(button) {
    updateOptionButtons(button);
    transparentBg = button.dataset.bg === 'transparent';
    updatePreviewBackground();

    if (qrOutput.classList.contains('visible')) {
        generateQR();
    }
}

function generateQR() {
    let url = urlInput.value.trim();
    if (!url) {
        urlInput.focus();
        urlInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            urlInput.style.borderColor = '';
        }, 2000);
        return;
    }

    if (!/^https?:\/\//i.test(url) && !url.includes(' ') && url.includes('.')) {
        url = `https://${url}`;
    }

    const qr = qrcode(0, 'H');
    qr.addData(url);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const scale = 4;
    const displaySize = 280;
    const size = displaySize * scale;
    const moduleSize = Math.floor(size / (moduleCount + 4));
    const actualSize = moduleSize * (moduleCount + 4);
    const margin = moduleSize * 2;

    qrCanvas.width = actualSize;
    qrCanvas.height = actualSize;
    qrCanvas.style.width = `${actualSize / scale}px`;
    qrCanvas.style.height = `${actualSize / scale}px`;
    const ctx = qrCanvas.getContext('2d');

    if (!transparentBg) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, actualSize, actualSize);
    } else {
        ctx.clearRect(0, 0, actualSize, actualSize);
    }

    for (let row = 0; row < moduleCount; row += 1) {
        for (let col = 0; col < moduleCount; col += 1) {
            if (!qr.isDark(row, col)) {
                continue;
            }

            const x = margin + col * moduleSize;
            const y = margin + row * moduleSize;
            const squareSize = moduleSize * 0.85;
            const offset = (moduleSize - squareSize) / 2;
            const radius = squareSize * 0.25;

            ctx.fillStyle = selectedColor;
            ctx.beginPath();
            roundRect(ctx, x + offset, y + offset, squareSize, squareSize, radius);
            ctx.fill();
        }
    }

    if (selectedLogo !== 'none') {
        if (logoImage.complete && logoImage.naturalWidth > 0) {
            drawLogo(ctx, actualSize);
        } else {
            logoImage.onload = () => {
                drawLogo(ctx, actualSize);
            };
        }
    }

    qrOutput.classList.add('visible');
}

function drawLogo(ctx, size) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const logoMaxSize = size * LOGO_SIZE;
    const ratio = Math.min(logoMaxSize / logoImage.naturalWidth, logoMaxSize / logoImage.naturalHeight);
    const logoWidth = logoImage.naturalWidth * ratio;
    const logoHeight = logoImage.naturalHeight * ratio;
    const logoX = (size - logoWidth) / 2;
    const logoY = (size - logoHeight) / 2;
    const padding = 20;

    if (!transparentBg) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        roundRect(ctx, logoX - padding, logoY - padding, logoWidth + padding * 2, logoHeight + padding * 2, 16);
        ctx.fill();
    } else {
        ctx.clearRect(logoX - padding, logoY - padding, logoWidth + padding * 2, logoHeight + padding * 2);
    }

    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

function downloadQR(format) {
    const filenameInput = document.getElementById('filenameInput');
    const filename = filenameInput.value.trim() || 'qrcode';
    const link = document.createElement('a');

    if (format === 'svg') {
        const size = qrCanvas.width;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
        svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
        svg += `<image href="${qrCanvas.toDataURL()}" width="${size}" height="${size}"/>`;
        svg += '</svg>';

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.svg`;
    } else {
        link.href = qrCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
        link.download = `${filename}.${format}`;
    }

    link.click();
}

const savedTheme = localStorage.getItem('theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);
updatePreviewBackground();

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

generateBtn.addEventListener('click', generateQR);
urlInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        generateQR();
    }
});

document.querySelectorAll('[data-logo]').forEach((button) => {
    button.addEventListener('click', () => {
        selectLogo(button);
    });
});

document.querySelectorAll('[data-color]').forEach((button) => {
    button.addEventListener('click', () => {
        selectColor(button);
    });
});

document.querySelectorAll('[data-bg]').forEach((button) => {
    button.addEventListener('click', () => {
        selectBackground(button);
    });
});

document.querySelectorAll('[data-download-format]').forEach((button) => {
    button.addEventListener('click', () => {
        downloadQR(button.dataset.downloadFormat);
    });
});
