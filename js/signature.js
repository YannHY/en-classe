'use strict';

const fields = [
    { id: 'field-name', input: 'input-name', next: 'field-title' },
    { id: 'field-title', input: 'input-title', next: 'field-phone' },
    { id: 'field-phone', input: 'input-phone', next: 'field-email' },
    { id: 'field-email', input: 'input-email', next: 'field-web' },
    { id: 'field-web', input: 'input-web', next: null }
];

const revealedFields = new Set(['field-name']);
const IMAGE_URL = 'images/signature-signature-img.png';
const copyButton = document.getElementById('btn-copy');
const previewCopyButton = document.getElementById('preview-copy');
const instructions = document.getElementById('instructions');

function revealNext(currentFieldId) {
    const field = fields.find((item) => item.id === currentFieldId);
    if (!field || !field.next) {
        if (field && field.next === null) {
            copyButton.classList.add('visible');
            instructions.classList.add('visible');
        }
        return null;
    }

    const nextField = fields.find((item) => item.id === field.next);
    const nextInput = nextField ? document.getElementById(nextField.input) : null;

    if (!revealedFields.has(field.next)) {
        revealedFields.add(field.next);
        const nextElement = document.getElementById(field.next);
        setTimeout(() => {
            nextElement.classList.add('visible');
        }, 100);
    }

    return nextInput;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFormValues() {
    return {
        name: document.getElementById('input-name').value.trim(),
        title: document.getElementById('input-title').value.trim(),
        phone: document.getElementById('input-phone').value.trim(),
        email: document.getElementById('input-email').value.trim(),
        web: document.getElementById('input-web').value.trim()
    };
}

function getWebsiteHref(web) {
    if (web === 'florimont.ch') {
        return 'https://www.florimont.ch';
    }
    return web.startsWith('http') ? web : `https://${web}`;
}

function isSignatureComplete(values) {
    return Object.values(values).every((value) => value.length > 0);
}

function updatePreview() {
    const values = getFormValues();
    const { name, title, phone, email, web } = values;
    const placeholder = document.getElementById('placeholder');
    const content = document.getElementById('signature-content');
    const complete = isSignatureComplete(values);

    previewCopyButton.classList.toggle('visible', complete);
    previewCopyButton.disabled = !complete;

    if (!name) {
        placeholder.style.display = 'flex';
        content.style.display = 'none';
        return;
    }

    placeholder.style.display = 'none';
    content.style.display = 'block';

    let html = '<div class="sig-greeting">Cordialement,</div>';
    html += '<br>';
    html += `<div class="sig-name">${escapeHtml(name)}</div>`;

    if (title) {
        html += `<div class="sig-title">${escapeHtml(title)}</div>`;
    }

    html += '<div class="sig-address">INSTITUT FLORIMONT | Avenue du Petit-Lancy 37 | 1213 Petit-Lancy/Genève</div>';

    if (phone) {
        html += `<div class="sig-phone">Tél. : ${escapeHtml(phone)}</div>`;
    }

    if (email) {
        html += `<div class="sig-email"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>`;
    }

    if (web) {
        const href = getWebsiteHref(web);
        html += `<div class="sig-web"><a href="${escapeHtml(href)}">${escapeHtml(web)}</a></div>`;
    }

    html += `<div class="sig-image"><img src="${escapeHtml(IMAGE_URL)}" alt="Institut Florimont"></div>`;
    content.innerHTML = html;
}

function setCopyButtonState(copied) {
    if (copied) {
        copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copié !';
        copyButton.classList.add('copied');
        previewCopyButton.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
        previewCopyButton.classList.add('copied');
        previewCopyButton.setAttribute('aria-label', 'Signature copiée');
        previewCopyButton.setAttribute('title', 'Signature copiée');
        return;
    }

    copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Copier la signature';
    copyButton.classList.remove('copied');
    previewCopyButton.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i>';
    previewCopyButton.classList.remove('copied');
    previewCopyButton.setAttribute('aria-label', 'Copier la signature');
    previewCopyButton.setAttribute('title', 'Copier la signature');
}

function copySignature() {
    const values = getFormValues();
    const { name, title, phone, email, web } = values;

    if (!name) {
        return;
    }

    let sigHtml = `<div style="font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 13px; color: #2c2c2c; line-height: 1.5;">`;
    sigHtml += `<p style="margin: 0 0 1em 0;">Cordialement,</p>`;
    sigHtml += `<p style="margin: 0;"><strong>${escapeHtml(name)}</strong></p>`;

    if (title) {
        sigHtml += `<p style="margin: 0; color: #555;">${escapeHtml(title)}</p>`;
    }

    sigHtml += `<p style="margin: 0; color: #555; font-size: 12px;">INSTITUT FLORIMONT | Avenue du Petit-Lancy 37 | 1213 Petit-Lancy/Genève</p>`;

    if (phone) {
        sigHtml += `<p style="margin: 0; color: #555; font-size: 12px;">Tél. : ${escapeHtml(phone)}</p>`;
    }

    if (email) {
        sigHtml += `<p style="margin: 0; font-size: 12px;"><a href="mailto:${escapeHtml(email)}" style="color: #2c2c2c; text-decoration: underline;">${escapeHtml(email)}</a></p>`;
    }

    if (web) {
        const href = getWebsiteHref(web);
        sigHtml += `<p style="margin: 0; font-size: 12px;"><a href="${escapeHtml(href)}" style="color: #2c2c2c; text-decoration: underline;">${escapeHtml(web)}</a></p>`;
    }

    sigHtml += `<p style="margin: 1em 0 0 0;"><img src="${escapeHtml(IMAGE_URL)}" alt="Institut Florimont" style="max-width: 100%; height: auto;"></p>`;
    sigHtml += '</div>';

    const blob = new Blob([sigHtml], { type: 'text/html' });
    const clipboardItem = new ClipboardItem({ 'text/html': blob });

    navigator.clipboard.write([clipboardItem]).then(() => {
        setCopyButtonState(true);
        setTimeout(() => {
            setCopyButtonState(false);
        }, 2000);
    }).catch(() => {
        const plain = `Cordialement,\n\n${name}\n${title ? `${title}\n` : ''}INSTITUT FLORIMONT | Avenue du Petit-Lancy 37 | 1213 Petit-Lancy/Genève\n${phone ? `Tél. : ${phone}\n` : ''}${email ? `${email}\n` : ''}${web || ''}`;
        navigator.clipboard.writeText(plain).then(() => {
            setCopyButtonState(true);
            setTimeout(() => {
                setCopyButtonState(false);
            }, 2000);
        });
    });
}

fields.forEach((field) => {
    const input = document.getElementById(field.input);

    input.addEventListener('input', () => {
        if (input.value.trim().length > 0) {
            revealNext(field.id);
        }
        updatePreview();
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length > 0) {
            revealNext(field.id);
        }
    });
});

copyButton.addEventListener('click', copySignature);
previewCopyButton.addEventListener('click', copySignature);

updatePreview();
