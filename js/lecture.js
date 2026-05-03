// ===== DOM Elements =====
const editableText = document.getElementById('editable-text');
const fontFamilySelect = document.getElementById('font-family');
const fontSizeRange = document.getElementById('font-size');
const fontColorInput = document.getElementById('font-color');
const backgroundColorInput = document.getElementById('background-color');
const letterSpacingRange = document.getElementById('letter-spacing');
const spacingRange = document.getElementById('spacing');
const lineBackgroundCheckbox = document.getElementById('line-background');
const bionicReadingCheckbox = document.getElementById('bionic-reading');
const readingRulerCheckbox = document.getElementById('reading-ruler');
const playPauseBtn = document.getElementById('play-pause-btn');
const stopBtn = document.getElementById('stop-btn');
const speechRateInput = document.getElementById('speech-rate');
const speechLangSelect = document.getElementById('speech-lang-select');
const focusModeBtn = document.getElementById('focus-mode-btn');
const exitFocusBtn = document.getElementById('exit-focus-btn');
const focusOverlay = document.getElementById('focus-overlay');
const focusTextArea = document.getElementById('focus-text-area');
const readingRuler = document.getElementById('reading-ruler-element');
const focusReadingRuler = document.getElementById('focus-reading-ruler-element');
const charCount = document.getElementById('char-count');
const clearTextBtn = document.getElementById('clear-text');
const copyTextBtn = document.getElementById('copy-text');
const shareLinkBtn = document.getElementById('share-link');
const resetSettingsBtn = document.getElementById('reset-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const toastContainer = document.getElementById('toast-container');
const formatToolbar = document.getElementById('format-toolbar');
const wordDefinitionCheckbox = document.getElementById('word-definition');
const definitionPopup = document.getElementById('definition-popup');
const definitionWord = document.getElementById('definition-word');
const definitionPos = document.getElementById('definition-pos');
const definitionBody = document.getElementById('definition-body');
const definitionClose = document.getElementById('definition-close');

// Range value displays
const rateValue = document.getElementById('rate-value');
const sizeValue = document.getElementById('size-value');
const letterValue = document.getElementById('letter-value');
const lineValue = document.getElementById('line-value');

// Speech Synthesis
const synth = window.speechSynthesis;
let voicesLoaded = false;
let originalText = '';
let isFirstClick = true;
let isSpeaking = false;
let hasUserEditedText = false;
let contentSaveTimeout = null;

const STORAGE_KEYS = {
  settings: 'dyslexicHelperSettings',
  content: 'dyslexicHelperContent'
};
const defaultEditorText = editableText.textContent.trim();

// ===== Font Options =====
const fontOptions = [
  { name: 'OpenDyslexic', value: 'OpenDyslexic, sans-serif' },
  { name: 'Luciole', value: 'Luciole, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", "Comic Neue", cursive' },
  { name: 'Courier New', value: '"Courier New", monospace' }
];

// ===== Default Settings =====
const defaultSettings = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 18,
  fontColor: '#2d3748',
  backgroundColor: '#ffffff',
  letterSpacing: 0,
  lineHeight: 1.6,
  bionicReading: false,
  lineBackground: false,
  readingRuler: false,
  wordDefinition: false,
  speechRate: 1,
  speechLang: 'fr-FR'
};

const ALLOWED_EDITOR_TAGS = new Set([
  'B', 'BLOCKQUOTE', 'BR', 'DIV', 'EM', 'FONT', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'I', 'LI', 'OL', 'P', 'SPAN', 'STRONG', 'U', 'UL'
]);
const DROP_EDITOR_TAGS = new Set([
  'BUTTON', 'EMBED', 'FORM', 'IFRAME', 'INPUT', 'LINK', 'META', 'OBJECT',
  'SCRIPT', 'SELECT', 'STYLE', 'SVG', 'TEXTAREA'
]);
const ALLOWED_SPAN_CLASSES = new Set(['inline-heading']);
const ALLOWED_EDITOR_STYLE_PROPS = new Set(['color']);
const ALLOWED_SPEECH_LANGS = new Set(['fr-FR', 'en-US', 'en-GB', 'es-ES', 'de-DE', 'it-IT', 'pt-PT']);
const DICTIONARY_LANG_BY_SPEECH = {
  'fr-FR': 'fr',
  'en-US': 'en',
  'en-GB': 'en',
  'es-ES': 'es',
  'de-DE': 'de',
  'it-IT': 'it',
  'pt-PT': 'pt'
};
const DICTIONARY_LANGUAGE_CONFIGS = {
  fr: {
    label: 'Français',
    section: 'Français',
    diacritics: /[àâæçéèêëîïôœùûüÿ]/i,
    stopWords: new Set(['au', 'aux', 'avec', 'ce', 'ces', 'dans', 'de', 'des', 'du', 'elle', 'en', 'est', 'et', 'il', 'je', 'la', 'le', 'les', 'mais', 'ne', 'nous', 'ou', 'par', 'pas', 'pour', 'que', 'qui', 'se', 'ses', 'sur', 'tu', 'un', 'une', 'vous'])
  },
  en: {
    label: 'Anglais',
    section: 'Anglais',
    diacritics: null,
    stopWords: new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'for', 'from', 'has', 'have', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'she', 'that', 'the', 'their', 'they', 'this', 'to', 'was', 'we', 'with', 'you'])
  },
  es: {
    label: 'Espagnol',
    section: 'Espagnol',
    diacritics: /[áéíñóúü¡¿]/i,
    stopWords: new Set(['al', 'como', 'con', 'de', 'del', 'el', 'ella', 'en', 'es', 'esta', 'este', 'la', 'las', 'lo', 'los', 'más', 'no', 'para', 'pero', 'por', 'que', 'se', 'su', 'sus', 'un', 'una', 'y'])
  },
  de: {
    label: 'Allemand',
    section: 'Allemand',
    diacritics: /[äöüß]/i,
    stopWords: new Set(['aber', 'auch', 'auf', 'aus', 'bei', 'das', 'dem', 'den', 'der', 'des', 'die', 'du', 'ein', 'eine', 'er', 'es', 'für', 'ich', 'im', 'in', 'ist', 'mit', 'nicht', 'sie', 'und', 'von', 'wir', 'zu'])
  },
  it: {
    label: 'Italien',
    section: 'Italien',
    diacritics: /[àèéìíîòóù]/i,
    stopWords: new Set(['che', 'con', 'dei', 'del', 'della', 'di', 'e', 'è', 'gli', 'ha', 'il', 'in', 'la', 'le', 'lo', 'ma', 'nei', 'nel', 'non', 'per', 'più', 'si', 'sono', 'su', 'tra', 'un', 'una'])
  },
  pt: {
    label: 'Portugais',
    section: 'Portugais',
    diacritics: /[áâãàçéêíóôõú]/i,
    stopWords: new Set(['a', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'é', 'ela', 'ele', 'em', 'esta', 'este', 'mais', 'na', 'não', 'no', 'nos', 'o', 'os', 'para', 'por', 'que', 'se', 'um', 'uma'])
  }
};
const DICTIONARY_DETECTION_MIN_SCORE = 3;
const DICTIONARY_DETECTION_MARGIN = 2;
const NATIVE_WIKTIONARY_SOURCES = {
  en: {
    apiBase: 'https://en.wiktionary.org/w/api.php',
    languageHeading: 'English',
    directTypes: ['Noun', 'Proper noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Personal pronoun', 'Determiner', 'Preposition', 'Conjunction', 'Interjection', 'Article'],
    formTypes: ['Verb form', 'Noun form', 'Proper noun form', 'Adjective form', 'Pronoun form', 'Participle'],
    meaningLabel: null
  },
  es: {
    apiBase: 'https://es.wiktionary.org/w/api.php',
    languageHeading: 'Español',
    directTypes: ['Sustantivo', 'Sustantivo femenino', 'Sustantivo masculino', 'Sustantivo neutro', 'Nombre propio', 'Verbo', 'Adjetivo', 'Adverbio', 'Pronombre', 'Determinante', 'Preposición', 'Conjunción', 'Interjección', 'Artículo'],
    formTypes: ['Forma flexiva', 'Forma verbal', 'Forma adjetiva', 'Forma sustantiva', 'Forma pronominal'],
    meaningLabel: null
  },
  de: {
    apiBase: 'https://de.wiktionary.org/w/api.php',
    languageHeading: /\(Deutsch\)$/i,
    directTypes: ['Substantiv', 'Eigenname', 'Verb', 'Adjektiv', 'Adverb', 'Pronomen', 'Personalpronomen', 'Determinativ', 'Präposition', 'Konjunktion', 'Interjektion', 'Artikel'],
    formTypes: ['Deklinierte Form', 'Konjugierte Form', 'Partizip'],
    meaningLabel: 'Bedeutungen:'
  },
  it: {
    apiBase: 'https://it.wiktionary.org/w/api.php',
    languageHeading: 'Italiano',
    directTypes: ['Sostantivo', 'Nome proprio', 'Verbo', 'Aggettivo', 'Avverbio', 'Pronome', 'Determinativo', 'Preposizione', 'Congiunzione', 'Interiezione', 'Articolo'],
    formTypes: ['Voce verbale', 'Forma flessa', 'Participio'],
    meaningLabel: null
  },
  pt: {
    apiBase: 'https://pt.wiktionary.org/w/api.php',
    languageHeading: 'Português',
    directTypes: ['Substantivo', 'Substantivo próprio', 'Verbo', 'Adjetivo', 'Advérbio', 'Pronome', 'Determinante', 'Preposição', 'Conjunção', 'Interjeição', 'Artigo'],
    formTypes: ['Forma verbal', 'Forma de substantivo', 'Forma de adjetivo', 'Particípio'],
    meaningLabel: null
  }
};

function sanitizeHexColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#([0-9a-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeSettings(rawSettings = {}) {
  const allowedFontValues = new Set(fontOptions.map(font => font.value));

  return {
    fontFamily: allowedFontValues.has(rawSettings.fontFamily) ? rawSettings.fontFamily : defaultSettings.fontFamily,
    fontSize: clampNumber(rawSettings.fontSize, 12, 48, defaultSettings.fontSize),
    fontColor: sanitizeHexColor(rawSettings.fontColor, defaultSettings.fontColor),
    backgroundColor: sanitizeHexColor(rawSettings.backgroundColor, defaultSettings.backgroundColor),
    letterSpacing: clampNumber(rawSettings.letterSpacing, 0, 10, defaultSettings.letterSpacing),
    lineHeight: clampNumber(rawSettings.lineHeight, 1, 3, defaultSettings.lineHeight),
    bionicReading: Boolean(rawSettings.bionicReading),
    lineBackground: Boolean(rawSettings.lineBackground),
    readingRuler: Boolean(rawSettings.readingRuler),
    wordDefinition: Boolean(rawSettings.wordDefinition),
    speechRate: clampNumber(rawSettings.speechRate, 0.5, 2, defaultSettings.speechRate),
    speechLang: ALLOWED_SPEECH_LANGS.has(rawSettings.speechLang) ? rawSettings.speechLang : defaultSettings.speechLang
  };
}

function isSafeEditorStyle(property, value) {
  if (!value) return false;
  if (/expression|url\s*\(|javascript:|@import/i.test(value)) return false;

  if (property === 'color') {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', value);
  }

  return false;
}

function sanitizeEditorStyle(styleText) {
  if (typeof styleText !== 'string' || !styleText.trim()) return '';

  const probe = document.createElement('span');
  probe.style.cssText = styleText;
  const safeRules = [];

  for (const property of probe.style) {
    if (!ALLOWED_EDITOR_STYLE_PROPS.has(property)) continue;
    const value = probe.style.getPropertyValue(property).trim();
    if (isSafeEditorStyle(property, value)) {
      safeRules.push(`${property}: ${value}`);
    }
  }

  return safeRules.join('; ');
}

function sanitizeEditorNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return;
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.remove();
    return;
  }

  const tag = node.tagName.toUpperCase();

  if (DROP_EDITOR_TAGS.has(tag)) {
    node.remove();
    return;
  }

  if (!ALLOWED_EDITOR_TAGS.has(tag)) {
    const parent = node.parentNode;
    if (!parent) {
      node.remove();
      return;
    }
    while (node.firstChild) {
      const child = node.firstChild;
      parent.insertBefore(child, node);
      sanitizeEditorNode(child);
    }
    node.remove();
    return;
  }

  if (tag === 'FONT') {
    const color = node.getAttribute('color');
    Array.from(node.attributes).forEach(attr => node.removeAttribute(attr.name));
    if (color && isSafeEditorStyle('color', color.trim())) {
      node.setAttribute('color', color.trim());
    }
  } else {
    Array.from(node.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
        return;
      }
      if (name === 'style') {
        const safeStyle = sanitizeEditorStyle(attr.value);
        if (safeStyle) {
          node.setAttribute('style', safeStyle);
        } else {
          node.removeAttribute(attr.name);
        }
        return;
      }
      if (tag === 'SPAN' && name === 'class') {
        const safeClasses = attr.value
          .split(/\s+/)
          .filter(className => ALLOWED_SPAN_CLASSES.has(className));
        if (safeClasses.length) {
          node.setAttribute('class', safeClasses.join(' '));
        } else {
          node.removeAttribute(attr.name);
        }
        return;
      }
      node.removeAttribute(attr.name);
    });
  }

  Array.from(node.childNodes).forEach(sanitizeEditorNode);
}

function sanitizeEditorHTML(html) {
  if (typeof html !== 'string' || !html.trim()) return '';

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const wrapper = doc.body.firstElementChild;
  if (!wrapper) return '';

  Array.from(wrapper.childNodes).forEach(sanitizeEditorNode);
  return wrapper.innerHTML;
}

function setEditorHTML(html) {
  editableText.innerHTML = sanitizeEditorHTML(html);
}

// ===== Initialize =====
function init() {
  populateFontSelect();
  loadSettings();
  const loadedFromURL = loadTextFromURL();
  if (!loadedFromURL) {
    loadSavedEditorContent();
  }
  initFloatingToolbar();
  initSpeechSynthesis();
  initEventListeners();
  initFocusModeEvents();
  initWordDefinition();
  updateCharCount();
  updateRangeDisplays();
}

// ===== Format Toolbar =====
let savedSelection = null;

function initFloatingToolbar() {
  // Show/hide toolbar on mouseup (after selection is complete)
  editableText.addEventListener('mouseup', () => {
    setTimeout(() => {
      showToolbarIfSelection();
    }, 10);
  });

  // Also handle keyboard selection
  editableText.addEventListener('keyup', (e) => {
    if (e.shiftKey) {
      showToolbarIfSelection();
    }
  });

  // Hide toolbar when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (!formatToolbar.contains(e.target) && e.target !== editableText && !editableText.contains(e.target)) {
      formatToolbar.classList.remove('visible');
    }
  });

  // Handle format button clicks
  formatToolbar.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent losing selection
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Restore selection if lost
      if (savedSelection) {
        restoreSelection(savedSelection);
      }

      const command = btn.dataset.command;
      const value = btn.dataset.value || null;

      if (command) {
        // Special handling for heading - wrap in <big> instead of formatBlock for inline text
        if (command === 'formatBlock' && value === 'h2') {
          applyInlineHeading();
        } else {
          document.execCommand(command, false, value);
        }

        // Save the new selection state after applying format
        setTimeout(() => {
          savedSelection = saveSelection();
          updateToolbarButtonStates();
        }, 10);

        updateCharCount();
      }
    });
  });

  // Handle text color picker
  const formatTextColor = document.getElementById('format-text-color');
  const colorIndicator = document.getElementById('color-indicator');

  if (formatTextColor && colorIndicator) {
    formatTextColor.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Save selection before color picker opens
      savedSelection = saveSelection();
    });

    formatTextColor.addEventListener('input', (e) => {
      const color = e.target.value;
      // Restore selection and apply color
      if (savedSelection) {
        restoreSelection(savedSelection);
      }
      document.execCommand('foreColor', false, color);
      colorIndicator.style.background = color;
    });

    formatTextColor.addEventListener('change', (e) => {
      const color = e.target.value;
      if (savedSelection) {
        restoreSelection(savedSelection);
      }
      document.execCommand('foreColor', false, color);
      colorIndicator.style.background = color;
    });
  }

  // Keyboard shortcuts
  editableText.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false, null);
          updateToolbarButtonStates();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false, null);
          updateToolbarButtonStates();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false, null);
          updateToolbarButtonStates();
          break;
      }
    }
  });
}

function showToolbarIfSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Check if selection is inside editableText
    const isInEditor = editableText.contains(container) ||
      (container.nodeType === 3 && editableText.contains(container.parentNode));

    if (isInEditor && selectedText.length > 0) {
      savedSelection = saveSelection();
      formatToolbar.classList.add('visible');
      updateToolbarButtonStates();
      return;
    }
  }

  formatToolbar.classList.remove('visible');
}

function saveSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    return selection.getRangeAt(0).cloneRange();
  }
  return null;
}

function restoreSelection(range) {
  if (range) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function updateToolbarButtonStates() {
  formatToolbar.querySelectorAll('.format-btn').forEach(btn => {
    const command = btn.dataset.command;
    if (['bold', 'italic', 'underline'].includes(command)) {
      if (document.queryCommandState(command)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

// Apply inline heading style (larger, bold text without block formatting)
function applyInlineHeading() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) return;

  // Check if already wrapped in a heading span
  const parentSpan = selection.anchorNode.parentElement;
  if (parentSpan && parentSpan.classList.contains('inline-heading')) {
    // Remove the heading style
    const textNode = document.createTextNode(parentSpan.textContent);
    parentSpan.parentNode.replaceChild(textNode, parentSpan);
    return;
  }

  // Create a span with heading styles
  const headingSpan = document.createElement('span');
  headingSpan.className = 'inline-heading';
  headingSpan.textContent = selectedText;

  // Replace selection with the styled span
  range.deleteContents();
  range.insertNode(headingSpan);

  // Select the new element
  const newRange = document.createRange();
  newRange.selectNodeContents(headingSpan);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

// ===== URL Text Sharing with LZ-String Compression =====

function compressData(str) {
  // Compress and encode for URL safety
  return LZString.compressToEncodedURIComponent(str);
}

function decompressData(str) {
  // Decompress from URL-safe format
  return LZString.decompressFromEncodedURIComponent(str);
}

function loadTextFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('d'); // New compressed format
  const encodedText = urlParams.get('text'); // Legacy format

  // Try new compressed format first
  if (compressedData) {
    try {
      const jsonData = decompressData(compressedData);
      const data = JSON.parse(jsonData);

      // Load HTML content
      setEditorHTML(data.html || '');
      isFirstClick = false;
      hasUserEditedText = true;
      updateCharCount();

      // Load settings if present
      if (data.settings) {
        applyShareSettings(normalizeSettings(data.settings));
      }

      showToast('Texte et réglages chargés depuis le lien', 'success');
      return true;
    } catch (e) {
      console.error('Erreur lors de la décompression:', e);
      showToast('Erreur lors du chargement du texte', 'error');
      return false;
    }
  }

  // Fallback to legacy format (for old shared links)
  if (encodedText) {
    try {
      const content = decodeURIComponent(escape(atob(encodedText)));
      setEditorHTML(content);
      isFirstClick = false;
      hasUserEditedText = true;
      updateCharCount();

      const encodedSettings = urlParams.get('settings');
      if (encodedSettings) {
        try {
          const settings = JSON.parse(decodeURIComponent(escape(atob(encodedSettings))));
          applyShareSettings(normalizeSettings(settings));
          showToast('Texte et réglages chargés depuis le lien', 'success');
        } catch (e) {
          showToast('Texte chargé (réglages non disponibles)', 'info');
        }
      } else {
        showToast('Texte chargé depuis le lien', 'success');
      }
      return true;
    } catch (e) {
      console.error('Erreur lors du décodage du texte:', e);
      showToast('Erreur lors du chargement du texte', 'error');
      return false;
    }
  }

  return false;
}

function scheduleEditorContentSave() {
  clearTimeout(contentSaveTimeout);
  contentSaveTimeout = setTimeout(() => {
    saveEditorContent();
  }, 250);
}

function flushEditorContentSave() {
  if (contentSaveTimeout) {
    clearTimeout(contentSaveTimeout);
    contentSaveTimeout = null;
  }
  saveEditorContent();
}

function saveEditorContent() {
  const plainText = editableText.textContent.trim();
  const isUntouchedDefault = !hasUserEditedText && plainText === defaultEditorText;

  if (isUntouchedDefault) {
    return;
  }

  if (!plainText) {
    localStorage.removeItem(STORAGE_KEYS.content);
    return;
  }

  const payload = {
    html: sanitizeEditorHTML(getStructuredContent()),
    updatedAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEYS.content, JSON.stringify(payload));
}

function loadSavedEditorContent() {
  const rawSaved = localStorage.getItem(STORAGE_KEYS.content);
  if (!rawSaved) {
    return false;
  }

  try {
    const parsed = JSON.parse(rawSaved);
    const html = typeof parsed === 'string' ? parsed : parsed.html;

    if (!html || !String(html).trim()) {
      return false;
    }

    const sanitizedHtml = sanitizeEditorHTML(html);
    if (!sanitizedHtml.trim()) {
      localStorage.removeItem(STORAGE_KEYS.content);
      return false;
    }

    editableText.innerHTML = sanitizedHtml;
    if (typeof parsed !== 'string' && parsed.html !== sanitizedHtml) {
      localStorage.setItem(STORAGE_KEYS.content, JSON.stringify({
        ...parsed,
        html: sanitizedHtml
      }));
    }
    isFirstClick = false;
    hasUserEditedText = true;
    updateCharCount();
    return true;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.content);
    return false;
  }
}

function applyShareSettings(settings) {
  const safeSettings = normalizeSettings(settings);

  // Apply font settings
  if (safeSettings.fontFamily) {
    fontFamilySelect.value = safeSettings.fontFamily;
    editableText.style.fontFamily = safeSettings.fontFamily;
  }
  if (safeSettings.fontSize) {
    fontSizeRange.value = safeSettings.fontSize;
    editableText.style.fontSize = `${safeSettings.fontSize}px`;
    sizeValue.textContent = `${safeSettings.fontSize}px`;
  }
  if (safeSettings.fontColor) {
    fontColorInput.value = safeSettings.fontColor;
    editableText.style.color = safeSettings.fontColor;
  }
  if (safeSettings.backgroundColor) {
    backgroundColorInput.value = safeSettings.backgroundColor;
    editableText.style.backgroundColor = safeSettings.backgroundColor;
  }
  if (safeSettings.letterSpacing !== undefined) {
    letterSpacingRange.value = safeSettings.letterSpacing;
    editableText.style.letterSpacing = `${safeSettings.letterSpacing}px`;
    letterValue.textContent = `${safeSettings.letterSpacing}px`;
  }
  if (safeSettings.lineHeight) {
    spacingRange.value = safeSettings.lineHeight;
    editableText.style.lineHeight = safeSettings.lineHeight;
    lineValue.textContent = safeSettings.lineHeight;
  }

  // Apply accessibility settings
  if (safeSettings.bionicReading) {
    bionicReadingCheckbox.checked = true;
    applyBionicReading();
  }
  if (safeSettings.lineBackground) {
    lineBackgroundCheckbox.checked = true;
    applyLineHighlight();
  }
}

function generateShareLink() {
  // Get HTML content (preserving formatting like bold, italic, lists, etc.)
  // But remove accessibility features (bionic reading strong tags)
  let htmlContent = getStructuredContent();

  // Check if there's actual content
  const textContent = editableText.textContent.trim();
  if (!textContent) {
    showToast('Aucun texte à partager', 'error');
    return null;
  }

  try {
    // Gather current settings
    const settings = {
      fontFamily: fontFamilySelect.value,
      fontSize: fontSizeRange.value,
      fontColor: fontColorInput.value,
      backgroundColor: backgroundColorInput.value,
      letterSpacing: letterSpacingRange.value,
      lineHeight: spacingRange.value,
      bionicReading: bionicReadingCheckbox.checked,
      lineBackground: lineBackgroundCheckbox.checked
    };

    // Combine HTML and settings into one object
    const shareData = {
      html: htmlContent,
      settings: settings
    };

    // Compress the data
    const compressed = compressData(JSON.stringify(shareData));

    // Check URL length (increased limit thanks to compression)
    // Most browsers support URLs up to 8000+ chars, we'll use 6000 as safe limit
    if (compressed.length > 6000) {
      showToast('Texte trop long pour être partagé via URL', 'error');
      return null;
    }

    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const shareUrl = `${baseUrl}?d=${compressed}`;

    // Show compression stats in console for debugging
    const originalSize = JSON.stringify(shareData).length;
    const compressedSize = compressed.length;
    const ratio = Math.round((1 - compressedSize / originalSize) * 100);
    console.log(`Compression: ${originalSize} → ${compressedSize} (${ratio}% de réduction)`);

    return shareUrl;
  } catch (e) {
    console.error('Erreur lors de la génération du lien:', e);
    showToast('Erreur lors de la génération du lien', 'error');
    return null;
  }
}

// ===== Populate Font Select =====
function populateFontSelect() {
  fontOptions.forEach(font => {
    const option = document.createElement('option');
    option.value = font.value;
    option.textContent = font.name;
    option.style.fontFamily = font.value;
    fontFamilySelect.appendChild(option);
  });
}

// ===== Event Listeners =====
function initEventListeners() {
  // Font family
  fontFamilySelect.addEventListener('change', () => {
    editableText.style.fontFamily = fontFamilySelect.value;
    saveCurrentSettings();
  });

  // Font size
  fontSizeRange.addEventListener('input', () => {
    editableText.style.fontSize = `${fontSizeRange.value}px`;
    sizeValue.textContent = `${fontSizeRange.value}px`;
    if (lineBackgroundCheckbox.checked) {
      updateLineHighlightHeight();
    }
    saveCurrentSettings();
  });

  // Font color
  fontColorInput.addEventListener('input', () => {
    editableText.style.color = fontColorInput.value;
    saveCurrentSettings();
  });

  // Background color
  backgroundColorInput.addEventListener('input', () => {
    editableText.style.backgroundColor = backgroundColorInput.value;
    saveCurrentSettings();
  });

  // Letter spacing
  letterSpacingRange.addEventListener('input', () => {
    editableText.style.letterSpacing = `${letterSpacingRange.value}px`;
    letterValue.textContent = `${letterSpacingRange.value}px`;
    saveCurrentSettings();
  });

  // Line spacing
  spacingRange.addEventListener('input', () => {
    editableText.style.lineHeight = spacingRange.value;
    lineValue.textContent = spacingRange.value;
    if (lineBackgroundCheckbox.checked) {
      updateLineHighlightHeight();
    }
    saveCurrentSettings();
  });

  // Speech rate
  speechRateInput.addEventListener('input', () => {
    rateValue.textContent = `${speechRateInput.value}x`;
    if (synth.speaking) {
      synth.cancel();
      handlePlayPause();
    }
    saveCurrentSettings();
  });

  // Speech language
  speechLangSelect.addEventListener('change', () => {
    stopSpeech();
    saveCurrentSettings();
  });

  // Bionic reading
  bionicReadingCheckbox.addEventListener('change', () => {
    if (bionicReadingCheckbox.checked) {
      applyBionicReading();
    } else {
      removeBionicReading();
    }
    saveCurrentSettings();
  });

  // Word definition
  wordDefinitionCheckbox.addEventListener('change', () => {
    if (!wordDefinitionCheckbox.checked) hideDefinition();
    saveCurrentSettings();
  });

  // Line background
  lineBackgroundCheckbox.addEventListener('change', () => {
    if (lineBackgroundCheckbox.checked) {
      applyLineHighlight();
    } else {
      removeLineHighlight();
    }
    saveCurrentSettings();
  });

  // Reading ruler
  if (readingRulerCheckbox && readingRuler) {
    // Function to calculate ruler height based on font size and line height
    function updateRulerHeight() {
      const fontSize = parseFloat(fontSizeRange.value);
      const lineHeight = parseFloat(spacingRange.value);
      // Ruler height = font size * line height * 1.2 (a bit larger for comfort)
      const rulerHeight = Math.round(fontSize * lineHeight * 1.2);
      readingRuler.style.height = `${rulerHeight}px`;
      return rulerHeight;
    }

    readingRulerCheckbox.addEventListener('change', () => {
      if (readingRulerCheckbox.checked) {
        updateRulerHeight();
        readingRuler.classList.add('active');
      } else {
        readingRuler.classList.remove('active');
      }
      saveCurrentSettings();
    });

    // Update ruler height when font size changes
    fontSizeRange.addEventListener('input', () => {
      if (readingRulerCheckbox.checked) {
        updateRulerHeight();
      }
    });

    // Update ruler height when line height changes
    spacingRange.addEventListener('input', () => {
      if (readingRulerCheckbox.checked) {
        updateRulerHeight();
      }
    });

    // Mouse move for reading ruler (only within text area)
    const textWrapper = editableText.parentElement;
    textWrapper.addEventListener('mousemove', (e) => {
      if (readingRulerCheckbox.checked && readingRuler.classList.contains('active')) {
        const rect = textWrapper.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const rulerHeight = readingRuler.offsetHeight;
        const minY = 0;
        const maxY = rect.height - rulerHeight;
        const clampedY = Math.max(minY, Math.min(relativeY - rulerHeight / 2, maxY));
        readingRuler.style.top = `${clampedY}px`;
        readingRuler.style.transform = 'none';
      }
    });

    // Hide ruler when mouse leaves text area
    textWrapper.addEventListener('mouseleave', () => {
      if (readingRulerCheckbox.checked) {
        readingRuler.style.top = '0';
        readingRuler.style.transform = 'none';
      }
    });
  }

  // Play/Pause
  playPauseBtn.addEventListener('click', handlePlayPause);

  // Stop
  stopBtn.addEventListener('click', () => {
    stopSpeech();
  });

  // Focus mode
  focusModeBtn.addEventListener('click', enterFocusMode);
  exitFocusBtn.addEventListener('click', exitFocusMode);

  // Keyboard shortcut for focus mode
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && focusOverlay.classList.contains('active')) {
      exitFocusMode();
    }
  });

  // Clear text on first click
  editableText.addEventListener('focus', () => {
    if (isFirstClick) {
      editableText.textContent = '';
      updateCharCount();
      isFirstClick = false;
      hasUserEditedText = true;
    }
  });

  // Paste as plain text only (remove formatting but keep paragraphs and lists)
  editableText.addEventListener('paste', (e) => {
    e.preventDefault();

    // Try to extract text from HTML first to preserve line breaks from web content
    let text;
    const htmlData = e.clipboardData.getData('text/html');
    if (htmlData) {
      const tempDoc = new DOMParser().parseFromString(htmlData, 'text/html');
      // Replace block elements with line breaks before extracting text
      tempDoc.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
      tempDoc.querySelectorAll('p, div, li, tr, h1, h2, h3, h4, h5, h6, blockquote').forEach(el => {
        el.prepend('\n');
      });
      text = tempDoc.body.textContent || '';
    } else {
      text = e.clipboardData.getData('text/plain');
    }

    // Normalize line breaks: convert \r\n to \n
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\r/g, '\n');

    // Replace 3+ consecutive line breaks with 2 (paragraph separator)
    text = text.replace(/\n{3,}/g, '\n\n');

    // Replace multiple spaces with a single space (but keep line breaks)
    text = text.replace(/[^\S\n]+/g, ' ');

    // Process lines to detect and format bullet points
    const processedLines = text.split('\n').map(line => {
      line = line.trim();

      // Detect various bullet point formats and normalize them
      // Matches: •, -, *, ●, ○, ▪, ▸, >, numbers with . or )
      if (/^[•\-\*●○▪▸►>]\s*/.test(line)) {
        // Replace with standard bullet
        return '• ' + line.replace(/^[•\-\*●○▪▸►>]\s*/, '');
      } else if (/^\d+[\.\)]\s*/.test(line)) {
        // Keep numbered lists as-is
        return line;
      }
      return line;
    });

    text = processedLines.join('\n');

    // Insert using innerHTML to preserve line breaks as <br> or <div>
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Convert line breaks to HTML
      const lines = text.split('\n\n'); // Split by paragraphs
      const fragment = document.createDocumentFragment();

      lines.forEach((paragraph, index) => {
        if (index > 0) {
          // Add paragraph break (two <br> for visual separation)
          fragment.appendChild(document.createElement('br'));
          fragment.appendChild(document.createElement('br'));
        }
        // Handle single line breaks within paragraphs
        const subLines = paragraph.split('\n');
        subLines.forEach((line, lineIndex) => {
          if (lineIndex > 0) {
            fragment.appendChild(document.createElement('br'));
          }
          fragment.appendChild(document.createTextNode(line));
        });
      });

      range.insertNode(fragment);

      // Move cursor to end
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    updateCharCount();
    hasUserEditedText = true;
    scheduleEditorContentSave();
  });

  // Character count
  editableText.addEventListener('input', () => {
    hasUserEditedText = true;
    updateCharCount();
    scheduleEditorContentSave();
    if (lineBackgroundCheckbox.checked) {
      buildLineHighlightOverlay();
    }
  });

  // Clear text
  clearTextBtn.addEventListener('click', () => {
    editableText.textContent = '';
    updateCharCount();
    hasUserEditedText = true;
    saveEditorContent();
    showToast('Texte effacé', 'success');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEditorContentSave();
    }
  });
  window.addEventListener('pagehide', flushEditorContentSave);

  // Copy text
  copyTextBtn.addEventListener('click', () => {
    const text = editableText.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Texte copié !', 'success');
    }).catch(() => {
      showToast('Erreur lors de la copie', 'error');
    });
  });

  // Share link
  shareLinkBtn.addEventListener('click', async () => {
    const link = generateShareLink();
    if (link) {
      console.log('Lien généré:', link);
      try {
        await navigator.clipboard.writeText(link);
        showToast('Lien copié ! Collez-le pour le partager.', 'success');
      } catch (err) {
        // Fallback: show link in prompt
        console.error('Clipboard error:', err);
        prompt('Copiez ce lien :', link);
      }
    }
  });

  // Color presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bg = btn.dataset.bg;
      const text = btn.dataset.text;

      backgroundColorInput.value = bg;
      fontColorInput.value = text;

      editableText.style.backgroundColor = bg;
      editableText.style.color = text;

      // Add ripple effect
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => btn.style.transform = '', 150);

      saveCurrentSettings();
      showToast('Thème appliqué', 'success');
    });
  });

  // Reset settings
  resetSettingsBtn.addEventListener('click', () => {
    // Stop any ongoing speech synthesis
    stopSpeech();

    // Remove accessibility features before resetting
    if (bionicReadingCheckbox.checked) {
      removeBionicReading();
    }
    if (lineBackgroundCheckbox.checked) {
      removeLineHighlight();
    }
    if (readingRulerCheckbox.checked) {
      readingRuler.classList.remove('active');
    }

    applySettings(defaultSettings);
    saveCurrentSettings();
    showToast('Paramètres réinitialisés', 'success');
  });

  // Save settings
  saveSettingsBtn.addEventListener('click', () => {
    saveCurrentSettings();
    flushEditorContentSave();
    showToast('Préférences sauvegardées !', 'success');
  });

  // Add subtle hover effect to cards
  document.querySelectorAll('.control-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

}

// ===== Update Range Displays =====
function updateRangeDisplays() {
  rateValue.textContent = `${speechRateInput.value}x`;
  sizeValue.textContent = `${fontSizeRange.value}px`;
  letterValue.textContent = `${letterSpacingRange.value}px`;
  lineValue.textContent = spacingRange.value;
}

// ===== Character Count =====
function updateCharCount() {
  const count = editableText.textContent.length;
  charCount.textContent = count;

  // Animate the count
  charCount.style.transform = 'scale(1.2)';
  setTimeout(() => charCount.style.transform = '', 150);
}

// ===== Speech Synthesis =====

// Priorité des voix par qualité (les meilleures en premier)
const preferredVoices = {
  'fr-FR': [
    'Google français',
    'Thomas', // macOS Siri
    'Amelie', // macOS
    'Audrey', // macOS premium
    'Aurelie', // macOS premium
    'Microsoft Paul', // Windows
    'Microsoft Hortense', // Windows
  ],
  'en-US': [
    'Google US English',
    'Samantha', // macOS Siri
    'Alex', // macOS
    'Microsoft David', // Windows
    'Microsoft Zira', // Windows
  ],
  'en-GB': [
    'Google UK English Female',
    'Google UK English Male',
    'Daniel', // macOS
    'Kate', // macOS
    'Microsoft Hazel', // Windows
  ],
  'es-ES': [
    'Google español',
    'Monica', // macOS
    'Jorge', // macOS
    'Microsoft Helena', // Windows
    'Microsoft Laura', // Windows
  ],
  'de-DE': [
    'Google Deutsch',
    'Anna', // macOS
    'Markus', // macOS
    'Microsoft Hedda', // Windows
    'Microsoft Katja', // Windows
  ],
  'it-IT': [
    'Google italiano',
    'Alice', // macOS
    'Luca', // macOS
    'Microsoft Elsa', // Windows
  ],
  'pt-PT': [
    'Google português',
    'Joana', // macOS
    'Microsoft Helia', // Windows
  ]
};

async function initSpeechSynthesis() {
  if (typeof synth === 'undefined' || !synth) {
    showToast('La synthèse vocale n\'est pas supportée', 'error');
    playPauseBtn.disabled = true;
    return;
  }

  await new Promise((resolve) => {
    if (synth.getVoices().length !== 0) {
      voicesLoaded = true;
      resolve();
    } else {
      synth.addEventListener('voiceschanged', () => {
        if (synth.getVoices().length !== 0) {
          voicesLoaded = true;
          resolve();
        }
      });
      synth.getVoices();
    }
  });

  // Populate voice selector with available voices
  populateVoiceSelector();
}

function populateVoiceSelector() {
  const voices = synth.getVoices();

  // Group voices by language
  const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));
  const englishUSVoices = voices.filter(v => v.lang === 'en-US');
  const englishUKVoices = voices.filter(v => v.lang === 'en-GB');

  // Log available voices for debugging (can be removed later)
  console.log('Voix disponibles:', voices.map(v => `${v.name} (${v.lang})`));
}

function getBestVoice(lang) {
  const voices = synth.getVoices();
  const preferred = preferredVoices[lang] || [];

  // Try to find a preferred voice
  for (const prefName of preferred) {
    const found = voices.find(v =>
      v.name.includes(prefName) && v.lang.startsWith(lang.split('-')[0])
    );
    if (found) {
      console.log(`Voix sélectionnée: ${found.name}`);
      return found;
    }
  }

  // Fallback: prefer voices marked as "premium" or "enhanced"
  const premiumVoice = voices.find(v =>
    v.lang.startsWith(lang.split('-')[0]) &&
    (v.name.toLowerCase().includes('premium') ||
     v.name.toLowerCase().includes('enhanced') ||
     v.name.toLowerCase().includes('neural') ||
     v.localService === false) // Remote voices are often better quality
  );
  if (premiumVoice) {
    console.log(`Voix premium trouvée: ${premiumVoice.name}`);
    return premiumVoice;
  }

  // Last fallback: any voice matching the language
  const fallbackVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
  if (fallbackVoice) {
    console.log(`Voix de secours: ${fallbackVoice.name}`);
  }
  return fallbackVoice;
}

function createUtterance() {
  const textToSpeak = editableText.textContent.replace(/•/g, '');
  const lang = speechLangSelect.value;
  const rate = parseFloat(speechRateInput.value);

  const voice = getBestVoice(lang);

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  utterance.lang = lang;

  return utterance;
}

function stopSpeech() {
  synth.cancel();
  isSpeaking = false;
  updatePlayPauseIcon(false);
}

function handlePlayPause() {
  // If currently speaking, pause
  if (isSpeaking && synth.speaking && !synth.paused) {
    synth.pause();
    updatePlayPauseIcon(false);
    return;
  }

  // If paused, resume
  if (synth.paused) {
    synth.resume();
    updatePlayPauseIcon(true);
    return;
  }

  // Start new speech
  if (voicesLoaded && !isSpeaking) {
    // Cancel any pending speech and wait a bit
    synth.cancel();

    setTimeout(() => {
      const utterance = createUtterance();

      utterance.onstart = () => {
        isSpeaking = true;
        updatePlayPauseIcon(true);
      };

      utterance.onend = () => {
        isSpeaking = false;
        updatePlayPauseIcon(false);
      };

      utterance.onerror = (e) => {
        console.error('Speech error:', e);
        isSpeaking = false;
        updatePlayPauseIcon(false);
      };

      synth.speak(utterance);
    }, 100);
  }
}

function updatePlayPauseIcon(isPlaying) {
  const icon = playPauseBtn.querySelector('i');
  if (isPlaying) {
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
    playPauseBtn.classList.add('playing');
  } else {
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
    playPauseBtn.classList.remove('playing');
  }
}

// ===== Style Preservation =====
function getCurrentStyles() {
  return {
    fontFamily: editableText.style.fontFamily,
    fontSize: editableText.style.fontSize,
    color: editableText.style.color,
    backgroundColor: editableText.style.backgroundColor,
    letterSpacing: editableText.style.letterSpacing,
    lineHeight: editableText.style.lineHeight
  };
}

function applyStyles(styles) {
  if (styles.fontFamily) editableText.style.fontFamily = styles.fontFamily;
  if (styles.fontSize) editableText.style.fontSize = styles.fontSize;
  if (styles.color) editableText.style.color = styles.color;
  if (styles.backgroundColor) editableText.style.backgroundColor = styles.backgroundColor;
  if (styles.letterSpacing) editableText.style.letterSpacing = styles.letterSpacing;
  if (styles.lineHeight) editableText.style.lineHeight = styles.lineHeight;
}

// ===== Accessibility Features =====

// Helper function to get plain text from editableText (for sharing, speech, etc.)
function getPlainText() {
  // Convert <br> to newlines for plain text
  const clone = editableText.cloneNode(true);
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  clone.querySelectorAll('strong').forEach(strong => strong.replaceWith(strong.textContent));
  return clone.textContent;
}

// Helper function to get HTML content preserving structure
function getStructuredContent() {
  // Clone and strip generated overlays/formatting helpers before persistence/sharing
  const clone = editableText.cloneNode(true);
  clone.querySelectorAll('.line-highlight-overlay').forEach(el => el.remove());
  clone.querySelectorAll('strong').forEach(strong => strong.replaceWith(strong.textContent));
  return sanitizeEditorHTML(clone.innerHTML);
}

// Helper function to apply bionic formatting to HTML content
function bionicFormatHTML(html) {
  // Split by HTML tags to preserve them
  const parts = html.split(/(<[^>]+>)/);

  return parts.map(part => {
    // If it's an HTML tag, keep it as-is
    if (part.startsWith('<')) return part;

    // Apply bionic formatting to text content
    const words = part.split(/(\s+)/);
    return words.map(word => {
      if (/^\s+$/.test(word)) return word;
      if (!/[a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]/.test(word)) return word;

      const letters = word.match(/[a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]+/g);
      if (!letters) return word;

      let result = word;
      letters.forEach(w => {
        const boldLength = Math.ceil(w.length * 0.4);
        const boldPart = w.substring(0, boldLength);
        const normalPart = w.substring(boldLength);
        result = result.replace(w, `<strong>${boldPart}</strong>${normalPart}`);
      });

      return result;
    }).join('');
  }).join('');
}

// Main function to apply all accessibility features
function applyAccessibilityFeatures() {
  const styles = getCurrentStyles();

  // Get the structured HTML content (preserving <br> tags)
  let html = getStructuredContent();

  // Store original content if not already stored
  if (!originalText && html.trim()) {
    originalText = html;
  }

  if (!html || html.trim() === '') {
    return;
  }

  const useBionic = bionicReadingCheckbox.checked;
  const useLineHighlight = lineBackgroundCheckbox.checked;

  // Handle line highlight via CSS class (no DOM manipulation needed)
  if (useLineHighlight) {
    editableText.classList.add('line-highlight-active');
    updateLineHighlightHeight();
  } else {
    editableText.classList.remove('line-highlight-active');
  }

  // Apply bionic reading if enabled
  if (useBionic) {
    editableText.innerHTML = bionicFormatHTML(html);
  } else if (!useBionic && originalText) {
    editableText.innerHTML = originalText;
    originalText = '';
  }

  applyStyles(styles);
}

let _lineHighlightTimer = null;

function buildLineHighlightOverlay() {
  clearTimeout(_lineHighlightTimer);
  _lineHighlightTimer = setTimeout(() => buildLineHighlightFor(editableText), 50);
}

function buildLineHighlightFor(target) {
  // Remove existing overlay
  const existing = target.querySelector('.line-highlight-overlay');
  if (existing) existing.remove();

  const text = target.textContent;
  if (!text || !text.trim()) return;

  // Collect all text nodes, skipping the overlay itself
  const textNodes = [];
  function walk(node) {
    if (node.classList && node.classList.contains('line-highlight-overlay')) return;
    if (node.nodeType === Node.TEXT_NODE && node.textContent.length > 0) {
      textNodes.push(node);
    } else {
      for (const child of node.childNodes) walk(child);
    }
  }
  walk(target);
  if (textNodes.length === 0) return;

  // Build a flat index: array of { node, offset } for all characters
  const flatIndex = [];
  for (const tn of textNodes) {
    for (let i = 0; i < tn.textContent.length; i++) {
      flatIndex.push({ node: tn, offset: i });
    }
  }
  if (flatIndex.length === 0) return;

  const range = document.createRange();

  function getTopAt(charIdx) {
    const entry = flatIndex[charIdx];
    range.setStart(entry.node, entry.offset);
    range.setEnd(entry.node, Math.min(entry.offset + 1, entry.node.textContent.length));
    return range.getBoundingClientRect().top;
  }

  // Walk through to find each line break using binary search
  const linePositions = [];
  let i = 0;
  while (i < flatIndex.length) {
    const entry = flatIndex[i];
    range.setStart(entry.node, entry.offset);
    range.setEnd(entry.node, Math.min(entry.offset + 1, entry.node.textContent.length));
    const rect = range.getBoundingClientRect();
    linePositions.push({ top: rect.top, height: rect.height });

    const currentTop = Math.round(rect.top);

    // Binary search for the first char on the next line
    let lo = i + 1;
    let hi = flatIndex.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (Math.round(getTopAt(mid)) <= currentTop) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    i = lo;
  }

  if (linePositions.length === 0) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'line-highlight-overlay';

  const containerRect = target.getBoundingClientRect();
  const scrollTop = target.scrollTop;

  for (let j = 0; j < linePositions.length; j++) {
    if (j % 2 !== 0) continue; // highlight every other line
    const line = linePositions[j];
    const stripe = document.createElement('div');
    stripe.className = 'line-highlight-stripe';
    stripe.style.top = `${line.top - containerRect.top + scrollTop}px`;
    stripe.style.height = `${line.height}px`;
    overlay.appendChild(stripe);
  }

  target.style.position = 'relative';
  target.appendChild(overlay);
}

function applyBionicReading() {
  applyAccessibilityFeatures();
}

function removeBionicReading() {
  applyAccessibilityFeatures();
}

function applyLineHighlight() {
  buildLineHighlightOverlay();
}

function removeLineHighlight() {
  const existing = editableText.querySelector('.line-highlight-overlay');
  if (existing) existing.remove();
}

function updateLineHighlightHeight() {
  if (lineBackgroundCheckbox.checked) {
    buildLineHighlightOverlay();
  }
}

// ===== Focus Mode =====
let focusRulerActive = false;

function enterFocusMode() {
  // Copy text content with styles, excluding any existing overlay
  focusTextArea.innerHTML = editableText.innerHTML;
  const copiedOverlay = focusTextArea.querySelector('.line-highlight-overlay');
  if (copiedOverlay) copiedOverlay.remove();

  focusTextArea.style.fontFamily = editableText.style.fontFamily;
  focusTextArea.style.fontSize = editableText.style.fontSize;
  focusTextArea.style.color = editableText.style.color;
  focusTextArea.style.backgroundColor = editableText.style.backgroundColor;
  focusTextArea.style.letterSpacing = editableText.style.letterSpacing;
  focusTextArea.style.lineHeight = editableText.style.lineHeight;

  // Activate reading ruler in focus mode only if already enabled
  if (readingRulerCheckbox.checked) {
    focusRulerActive = true;
    focusReadingRuler.style.display = 'block';
    updateFocusRulerHeight();
  }

  focusOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Skip animation, show directly so we can measure lines accurately
  focusTextArea.style.opacity = '1';
  focusTextArea.style.transform = 'none';
  focusTextArea.style.transition = '';

  // Build line highlight overlay once layout is stable
  if (lineBackgroundCheckbox.checked) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        buildLineHighlightFor(focusTextArea);
      });
    });
  }
}

function exitFocusMode() {
  focusTextArea.style.opacity = '0';
  focusTextArea.style.transform = 'scale(0.95)';

  setTimeout(() => {
    focusOverlay.classList.remove('active');
    document.body.style.overflow = '';
    focusTextArea.style.transition = '';
    // Clean up focus mode accessibility states
    const focusOverlayEl = focusTextArea.querySelector('.line-highlight-overlay');
    if (focusOverlayEl) focusOverlayEl.remove();
    focusReadingRuler.style.display = 'none';
    focusRulerActive = false;
  }, 300);
}

function updateFocusRulerHeight() {
  const fontSize = parseFloat(focusTextArea.style.fontSize) || 20;
  const lineHeight = parseFloat(focusTextArea.style.lineHeight) || 2;
  const rulerHeight = fontSize * lineHeight;
  focusReadingRuler.style.height = `${rulerHeight}px`;
}

// Focus mode reading ruler mouse tracking
function initFocusModeEvents() {
  const focusTextWrapper = document.querySelector('.focus-text-wrapper');

  focusTextWrapper.addEventListener('mousemove', (e) => {
    if (!focusRulerActive) return;

    const rect = focusTextWrapper.getBoundingClientRect();
    const rulerHeight = focusReadingRuler.offsetHeight;
    let y = e.clientY - rect.top - (rulerHeight / 2);

    y = Math.max(0, Math.min(y, rect.height - rulerHeight));
    focusReadingRuler.style.top = `${y}px`;
  });
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? 'fa-check-circle' :
               type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

  const iconEl = document.createElement('i');
  iconEl.className = `fas ${icon}`;

  const textEl = document.createElement('span');
  textEl.textContent = message;

  toast.appendChild(iconEl);
  toast.appendChild(textEl);

  toastContainer.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'lf-slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Settings Persistence =====
function saveCurrentSettings() {
  const settings = normalizeSettings({
    fontFamily: fontFamilySelect.value,
    fontSize: fontSizeRange.value,
    fontColor: fontColorInput.value,
    backgroundColor: backgroundColorInput.value,
    letterSpacing: letterSpacingRange.value,
    lineHeight: spacingRange.value,
    bionicReading: bionicReadingCheckbox.checked,
    lineBackground: lineBackgroundCheckbox.checked,
    readingRuler: readingRulerCheckbox.checked,
    wordDefinition: wordDefinitionCheckbox.checked,
    speechRate: speechRateInput.value,
    speechLang: speechLangSelect.value
  });

  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function loadSettings() {
  const saved = localStorage.getItem(STORAGE_KEYS.settings);
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      applySettings(settings);
    } catch (e) {
      applySettings(defaultSettings);
    }
  } else {
    applySettings(defaultSettings);
  }
}

function applySettings(settings) {
  const safeSettings = normalizeSettings(settings);

  // Font family
  fontFamilySelect.value = safeSettings.fontFamily;
  editableText.style.fontFamily = safeSettings.fontFamily;

  // Font size
  fontSizeRange.value = safeSettings.fontSize;
  editableText.style.fontSize = `${safeSettings.fontSize}px`;

  // Colors
  fontColorInput.value = safeSettings.fontColor;
  editableText.style.color = safeSettings.fontColor;

  backgroundColorInput.value = safeSettings.backgroundColor;
  editableText.style.backgroundColor = safeSettings.backgroundColor;

  // Spacing
  letterSpacingRange.value = safeSettings.letterSpacing;
  editableText.style.letterSpacing = `${safeSettings.letterSpacing}px`;

  spacingRange.value = safeSettings.lineHeight;
  editableText.style.lineHeight = safeSettings.lineHeight;

  // Checkboxes
  bionicReadingCheckbox.checked = safeSettings.bionicReading;
  lineBackgroundCheckbox.checked = safeSettings.lineBackground;
  readingRulerCheckbox.checked = safeSettings.readingRuler;
  wordDefinitionCheckbox.checked = safeSettings.wordDefinition;

  if (safeSettings.readingRuler) {
    readingRuler.classList.add('active');
  }

  if (safeSettings.bionicReading) {
    applyBionicReading();
  }

  if (safeSettings.lineBackground) {
    applyLineHighlight();
  } else {
    removeLineHighlight();
  }

  // Speech
  speechRateInput.value = safeSettings.speechRate;
  speechLangSelect.value = safeSettings.speechLang;

  // Update displays
  updateRangeDisplays();
}

// ===== Update Year =====

// ===== Word Definition =====
function getDictionaryLangFromSpeechLang(speechLang = speechLangSelect.value) {
  return DICTIONARY_LANG_BY_SPEECH[speechLang] || 'fr';
}

function getDictionaryLanguageLabel(dictionaryLang) {
  return DICTIONARY_LANGUAGE_CONFIGS[dictionaryLang]?.label || 'Français';
}

function mapLangHintToDictionaryLang(rawLang) {
  if (typeof rawLang !== 'string') return null;

  const normalized = rawLang.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('de')) return 'de';
  if (normalized.startsWith('it')) return 'it';
  if (normalized.startsWith('pt')) return 'pt';
  return null;
}

function getDictionaryLangFromNode(node) {
  let current = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;

  while (current && current !== editableText) {
    const hintedLang = mapLangHintToDictionaryLang(current.getAttribute?.('lang'));
    if (hintedLang) return hintedLang;
    current = current.parentElement;
  }

  const editorLang = mapLangHintToDictionaryLang(editableText.getAttribute('lang'));
  return editorLang || null;
}

function tokenizeLanguageSample(text) {
  if (typeof text !== 'string' || !text.trim()) return [];

  return (text.toLowerCase().replace(/[’']/g, ' ').match(/[a-zÀ-ÿ\u0100-\u017F]+/g) || [])
    .filter(Boolean);
}

function getLanguageDetectionSample(wordContext) {
  const parts = [];
  if (wordContext?.context) parts.push(wordContext.context);

  const parentText = wordContext?.textNode?.parentElement?.textContent;
  if (typeof parentText === 'string' && parentText.trim()) {
    parts.push(parentText);
  }

  return parts.join(' ').trim();
}

function detectDictionaryLanguage(wordContext, normalizedWord) {
  const hintedLang = getDictionaryLangFromNode(wordContext?.textNode);
  if (hintedLang) {
    return hintedLang;
  }

  const fallbackLang = getDictionaryLangFromSpeechLang();
  const tokens = tokenizeLanguageSample(getLanguageDetectionSample(wordContext));
  if (!tokens.length) {
    return fallbackLang;
  }

  const targetWord = normalizedWord?.lower || '';
  const scores = Object.entries(DICTIONARY_LANGUAGE_CONFIGS)
    .map(([lang, config]) => {
      let score = 0;

      for (const token of tokens) {
        if (config.stopWords.has(token)) {
          score += token === targetWord ? 3 : 2;
        }
        if (config.diacritics && config.diacritics.test(token)) {
          score += token === targetWord ? 3 : 1;
        }
      }

      return { lang, score };
    })
    .sort((a, b) => b.score - a.score);

  const bestMatch = scores[0];
  const secondMatch = scores[1];
  if (!bestMatch || bestMatch.score < DICTIONARY_DETECTION_MIN_SCORE) {
    return fallbackLang;
  }
  if (secondMatch && bestMatch.score - secondMatch.score < DICTIONARY_DETECTION_MARGIN) {
    return fallbackLang;
  }

  return bestMatch.lang;
}

function normalizeWordForDefinition(rawWord) {
  let cleaned = rawWord
    .replace(/[^a-zA-ZÀ-ÿ\u0100-\u017F'-]/g, '')
    .replace(/^['-]+|['-]+$/g, '')
    .trim();

  // Handle French elisions: l'impromptu → impromptu, d'accord → accord, qu'il → il
  if (/^[ldnmjstcq]u?'/i.test(cleaned)) {
    cleaned = cleaned.replace(/^[ldnmjstcq]u?'/i, '');
  }

  return {
    original: cleaned,
    lower: cleaned.toLowerCase()
  };
}

function getDefinitionCandidates(normalizedWord) {
  if (!normalizedWord.lower) return [];

  const titleCase = normalizedWord.original.charAt(0).toUpperCase() + normalizedWord.original.slice(1);
  return [...new Set([normalizedWord.original, titleCase, normalizedWord.lower].filter(Boolean))];
}

function initWordDefinition() {
  editableText.addEventListener('click', handleWordClick);
  definitionClose.addEventListener('click', hideDefinition);
  document.addEventListener('click', (e) => {
    if (!definitionPopup.contains(e.target) && !editableText.contains(e.target)) {
      hideDefinition();
    }
  });
}

function handleWordClick(e) {
  if (!wordDefinitionCheckbox.checked) return;

  // Don't trigger if user is selecting text
  const selection = window.getSelection();
  if (selection.toString().trim().length > 1) return;

  const wordContext = getWordAtPoint(e.clientX, e.clientY);
  if (!wordContext?.word) return;

  const normalizedWord = normalizeWordForDefinition(wordContext.word);
  if (!normalizedWord.lower || normalizedWord.lower.length < 2) return;

  const candidates = getDefinitionCandidates(normalizedWord);
  showDefinition(candidates, normalizedWord, wordContext, e);
}

function getWordAtPoint(x, y) {
  let range;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (!pos) return null;
    range = document.createRange();
    range.setStart(pos.offsetNode, pos.offset);
    range.setEnd(pos.offsetNode, pos.offset);
  }

  if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) return null;

  const textNode = range.startContainer;
  const offset = range.startOffset;
  const text = textNode.textContent;

  // Find word boundaries using letters and accented characters
  const isWordChar = c => /[a-zA-ZÀ-ÿ\u0100-\u017F'-]/.test(c);
  let start = offset;
  let end = offset;

  while (start > 0 && isWordChar(text[start - 1])) start--;
  while (end < text.length && isWordChar(text[end])) end++;

  const result = text.slice(start, end);
  if (!result) return null;

  const contextRadius = 120;
  const contextStart = Math.max(0, start - contextRadius);
  const contextEnd = Math.min(text.length, end + contextRadius);

  return {
    word: result,
    textNode,
    start,
    end,
    context: text.slice(contextStart, contextEnd)
  };
}

async function showDefinition(candidates, normalizedWord, wordContext, event) {
  // Position popup near click
  const rect = editableText.getBoundingClientRect();
  let left = event.clientX - rect.left + editableText.scrollLeft;
  let top = event.clientY - rect.top + editableText.scrollTop + 24;

  const popupWidth = 320;
  if (left + popupWidth > editableText.clientWidth) {
    left = editableText.clientWidth - popupWidth - 8;
  }
  if (left < 0) left = 8;

  definitionPopup.style.left = `${rect.left + left}px`;
  definitionPopup.style.top = `${rect.top + top - editableText.scrollTop}px`;
  definitionPopup.style.position = 'fixed';

  const dictionaryLang = detectDictionaryLanguage(wordContext, normalizedWord);
  const dictionaryLabel = getDictionaryLanguageLabel(dictionaryLang);

  definitionWord.textContent = normalizedWord.original || normalizedWord.lower;
  definitionPos.textContent = dictionaryLabel;
  definitionBody.innerHTML = '<div class="def-loading"><i class="fas fa-spinner fa-spin"></i> Recherche\u2026</div>';
  definitionPopup.classList.add('active');

  try {
    let result = null;
    let lookupWord = normalizedWord.lower;

    for (const candidate of candidates) {
      result = await fetchWiktionaryDefinition(candidate, dictionaryLang, false);
      if (result) {
        lookupWord = candidate;
        break;
      }
    }

    // Fallback morphologique ciblé pour le français.
    if (!result && dictionaryLang === 'fr') {
      const variants = getStemVariants(normalizedWord.lower);
      for (const variant of variants) {
        result = await fetchWiktionaryDefinition(variant, dictionaryLang, false);
        if (result) {
          lookupWord = variant;
          result.displayWord = variant;
          break;
        }
      }
    }

    if (!result) throw new Error('not found');

    definitionWord.textContent = result.displayWord || lookupWord;
    definitionPos.textContent = result.partOfSpeech
      ? `${dictionaryLabel} · ${result.partOfSpeech}`
      : dictionaryLabel;
    definitionBody.innerHTML = result.html;

  } catch (err) {
    definitionPos.textContent = dictionaryLabel;
    definitionBody.innerHTML = `<div class="def-error">Définition non trouvée pour ce mot en ${dictionaryLabel.toLowerCase()}.</div>`;
  }
}

const FRENCH_WIKTIONARY_SECTION = 'Français';

function normalizeWikiText(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingMatches(text, matcher) {
  const normalizedText = normalizeWikiText(text);
  if (!normalizedText) return false;
  if (matcher instanceof RegExp) return matcher.test(normalizedText);
  return normalizedText === normalizeWikiText(matcher);
}

function startsWithHeadingType(text, types) {
  const normalizedText = normalizeWikiText(text);
  return types.some(type => normalizedText.startsWith(type));
}

function getHeadingBlocks(doc) {
  const wrappedBlocks = Array.from(doc.querySelectorAll('.mw-heading'))
    .map((container) => {
      const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
      if (!heading) return null;
      return {
        container,
        heading,
        level: Number.parseInt(heading.tagName.slice(1), 10),
        text: normalizeWikiText(heading.textContent)
      };
    })
    .filter(Boolean);

  if (wrappedBlocks.length) return wrappedBlocks;

  return Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((heading) => ({
    container: heading,
    heading,
    level: Number.parseInt(heading.tagName.slice(1), 10),
    text: normalizeWikiText(heading.textContent)
  }));
}

function getDefinitionTextFromNode(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('ul, ol, dl, table, style, sup.reference, .reference').forEach((el) => el.remove());
  return clone.textContent
    .replace(/\s+/g, ' ')
    .replace(/^\[(\d+)\]\s*/, '')
    .trim();
}

function buildDefinitionHtml(items) {
  const filteredItems = items.filter(Boolean).slice(0, 4);
  if (!filteredItems.length) return null;
  return `<ol>${filteredItems.map(item => `<li>${item}</li>`).join('')}</ol>`;
}

function looksLikeHeadwordMetadata(text) {
  return /\b(pl\.|sing|m sing|f sing|m pl|f pl)\b/i.test(text) ||
    /\b(approfondimento|citazioni)\b/i.test(text);
}

function extractDefinitionsFromOl(ol) {
  const entries = [];

  for (const item of Array.from(ol.querySelectorAll(':scope > li'))) {
    const nestedItems = Array.from(item.querySelectorAll(':scope > ul > li, :scope > ol > li'));
    const directText = getDefinitionTextFromNode(item);

    if (nestedItems.length && looksLikeHeadwordMetadata(directText)) {
      entries.push(...nestedItems.map(getDefinitionTextFromNode).filter(Boolean));
      continue;
    }

    if (directText) {
      entries.push(directText);
    }
  }

  return buildDefinitionHtml(entries);
}

function extractDefinitionsFromDl(dl) {
  const entries = [];
  let currentLabel = '';

  for (const child of Array.from(dl.children)) {
    if (child.tagName === 'DT') {
      currentLabel = getDefinitionTextFromNode(child).replace(/^\d+\s*/, '').trim();
      continue;
    }

    if (child.tagName !== 'DD') continue;

    const definition = getDefinitionTextFromNode(child);
    if (!definition) continue;

    const item = currentLabel && /[A-Za-zÀ-ÿ\u0100-\u017F]/.test(currentLabel)
      ? `${currentLabel}. ${definition}`
      : definition;
    entries.push(item);
    currentLabel = '';
  }

  return buildDefinitionHtml(entries);
}

function extractNativeDefinitions(nodes, source) {
  if (!nodes.length) return null;

  if (source.meaningLabel) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.tagName === 'P' && normalizeWikiText(node.textContent) === source.meaningLabel) {
        const nextDl = nodes.slice(i + 1).find(candidate => candidate.tagName === 'DL');
        if (nextDl) {
          const html = extractDefinitionsFromDl(nextDl);
          if (html) return html;
        }
      }
    }
  }

  for (const node of nodes) {
    if (node.tagName === 'OL') {
      const html = extractDefinitionsFromOl(node);
      if (html) return html;
    }
    if (node.tagName === 'DL') {
      const html = extractDefinitionsFromDl(node);
      if (html) return html;
    }
  }

  return null;
}

function getLinkedBaseWord(container) {
  const link = container.querySelector('a[href^="/wiki/"]');
  if (!link) return null;
  return decodeURIComponent(link.getAttribute('href').replace('/wiki/', '').replace(/#.*/, ''));
}

async function fetchNativeWiktionaryDefinition(word, dictionaryLang, isRedirect = false) {
  const source = NATIVE_WIKTIONARY_SOURCES[dictionaryLang];
  if (!source) return null;

  const pageUrl = `${source.apiBase}?action=parse&page=${encodeURIComponent(word)}&prop=text&format=json&origin=*`;
  const pageRes = await fetch(pageUrl);
  if (!pageRes.ok) return null;
  const pageData = await pageRes.json();
  if (pageData.error || !pageData.parse?.text?.['*']) return null;

  const doc = new DOMParser().parseFromString(pageData.parse.text['*'], 'text/html');
  const headingBlocks = getHeadingBlocks(doc);
  const languageIndex = headingBlocks.findIndex(block => headingMatches(block.text, source.languageHeading));
  if (languageIndex === -1) return null;

  const languageBlock = headingBlocks[languageIndex];
  let partOfSpeech = '';
  let posIndex = -1;
  let isForm = false;

  for (let i = languageIndex + 1; i < headingBlocks.length; i++) {
    const block = headingBlocks[i];
    if (block.level <= languageBlock.level) break;

    if (startsWithHeadingType(block.text, source.directTypes)) {
      partOfSpeech = block.text;
      posIndex = i;
      isForm = false;
      break;
    }

    if (posIndex === -1 && startsWithHeadingType(block.text, source.formTypes)) {
      partOfSpeech = block.text;
      posIndex = i;
      isForm = true;
    }
  }

  if (posIndex === -1) return null;

  const posBlock = headingBlocks[posIndex];
  const boundaryBlock = headingBlocks.slice(posIndex + 1).find(block => block.level <= posBlock.level);
  const contentNodes = [];

  for (
    let node = posBlock.container.nextElementSibling;
    node && node !== boundaryBlock?.container;
    node = node.nextElementSibling
  ) {
    contentNodes.push(node);
  }

  const definitionsHtml = extractNativeDefinitions(contentNodes, source);
  if (definitionsHtml) {
    return { displayWord: word, partOfSpeech, html: definitionsHtml };
  }

  if (isForm && !isRedirect) {
    const contentContainer = document.createElement('div');
    contentNodes.forEach(node => contentContainer.appendChild(node.cloneNode(true)));
    const baseWord = getLinkedBaseWord(contentContainer);
    if (baseWord && baseWord !== word) {
      const baseResult = await fetchNativeWiktionaryDefinition(baseWord, dictionaryLang, true);
      if (baseResult) {
        baseResult.displayWord = baseWord;
        baseResult.partOfSpeech = `${partOfSpeech} → ${baseResult.partOfSpeech}`;
        return baseResult;
      }
    }
  }

  return null;
}

async function fetchFrenchWiktionaryDefinition(word, isRedirect = false) {
  const baseUrl = 'https://fr.wiktionary.org/w/api.php';

  const sectionsUrl = `${baseUrl}?action=parse&page=${encodeURIComponent(word)}&prop=sections&format=json&origin=*`;
  const sectionsRes = await fetch(sectionsUrl);
  if (!sectionsRes.ok) return null;
  const sectionsData = await sectionsRes.json();
  if (sectionsData.error) return null;

  const sections = sectionsData.parse.sections;

  let langStart = -1;
  let langEnd = sections.length;
  for (let i = 0; i < sections.length; i++) {
    const line = normalizeWikiText(sections[i].line);
    if (sections[i].level === '2') {
      if (line === FRENCH_WIKTIONARY_SECTION) {
        langStart = i;
      } else if (langStart !== -1) {
        langEnd = i;
        break;
      }
    }
  }
  if (langStart === -1) return null;

  const langSections = sections.slice(langStart, langEnd);
  const directTypes = ['Nom commun', 'Nom propre', 'Verbe', 'Adjectif', 'Adverbe', 'Pronom', 'Pronom personnel', 'Déterminant', 'Préposition', 'Conjonction', 'Interjection', 'Article'];
  const formTypes = ['Forme de verbe', 'Forme de nom commun', 'Forme de nom propre', 'Forme d\'adjectif', 'Forme de pronom'];

  let defSection = null;
  let isForm = false;

  for (const section of langSections) {
    const line = normalizeWikiText(section.line);
    if (startsWithHeadingType(line, directTypes)) {
      defSection = section;
      isForm = false;
      break;
    }
    if (!defSection && startsWithHeadingType(line, formTypes)) {
      defSection = section;
      isForm = true;
    }
  }

  if (!defSection) return null;

  const partOfSpeech = normalizeWikiText(defSection.line);
  const textUrl = `${baseUrl}?action=parse&page=${encodeURIComponent(word)}&prop=text&section=${defSection.index}&format=json&origin=*`;
  const textRes = await fetch(textUrl);
  if (!textRes.ok) return null;
  const textData = await textRes.json();
  if (textData.error || !textData.parse?.text?.['*']) return null;

  const doc = new DOMParser().parseFromString(textData.parse.text['*'], 'text/html');
  const ol = doc.querySelector('ol');
  if (ol) {
    const items = ol.querySelectorAll(':scope > li');

    if (isForm && !isRedirect && items.length > 0) {
      const firstText = normalizeWikiText(items[0].textContent);
      const formPatterns = /^(Pluriel|Singulier|Féminin|Masculin|Première|Deuxième|Troisième|Participe|Variante) /i;
      if (formPatterns.test(firstText)) {
        const baseWord = getLinkedBaseWord(ol);
        if (baseWord && baseWord !== word) {
          const baseResult = await fetchFrenchWiktionaryDefinition(baseWord, true);
          if (baseResult) {
            baseResult.displayWord = baseWord;
            baseResult.partOfSpeech = `${partOfSpeech} → ${baseResult.partOfSpeech}`;
            return baseResult;
          }
        }
      }
    }

    const html = extractDefinitionsFromOl(ol);
    if (html) {
      return { displayWord: word, partOfSpeech, html };
    }
  }

  if (isForm && !isRedirect) {
    const baseWord = getLinkedBaseWord(doc);
    if (baseWord && baseWord !== word) {
      const baseResult = await fetchFrenchWiktionaryDefinition(baseWord, true);
      if (baseResult) {
        baseResult.displayWord = baseWord;
        baseResult.partOfSpeech = `${partOfSpeech} → ${baseResult.partOfSpeech}`;
        return baseResult;
      }
    }
  }

  return null;
}

async function fetchWiktionaryDefinition(word, dictionaryLang, isRedirect = false) {
  if (dictionaryLang === 'fr') {
    return fetchFrenchWiktionaryDefinition(word, isRedirect);
  }

  return fetchNativeWiktionaryDefinition(word, dictionaryLang, isRedirect);
}

function getStemVariants(word) {
  const variants = [];
  // Plurals: -aux → -al, -eaux → -eau
  if (word.endsWith('aux')) variants.push(word.slice(0, -3) + 'al');
  if (word.endsWith('eaux')) variants.push(word.slice(0, -4) + 'eau');
  // Plurals: -s, -x
  if (word.endsWith('s') && word.length > 3) variants.push(word.slice(0, -1));
  if (word.endsWith('x') && word.length > 3) variants.push(word.slice(0, -1));
  // Feminine: -se → -x, -ive → -if, -euse → -eur, -trice → -teur
  if (word.endsWith('euse')) variants.push(word.slice(0, -4) + 'eur');
  if (word.endsWith('trice')) variants.push(word.slice(0, -5) + 'teur');
  if (word.endsWith('ive')) variants.push(word.slice(0, -3) + 'if');
  if (word.endsWith('se')) variants.push(word.slice(0, -2) + 'x');
  // Feminine: -e
  if (word.endsWith('e') && word.length > 3) variants.push(word.slice(0, -1));
  // Verb forms: -ent, -ait, -aient, -ant, -és, -ées, -er
  if (word.endsWith('aient')) variants.push(word.slice(0, -5) + 'er');
  if (word.endsWith('ait')) variants.push(word.slice(0, -3) + 'er');
  if (word.endsWith('ent')) variants.push(word.slice(0, -3) + 'er');
  if (word.endsWith('ant')) variants.push(word.slice(0, -3) + 'er');
  if (word.endsWith('és')) variants.push(word.slice(0, -2) + 'er');
  if (word.endsWith('ées')) variants.push(word.slice(0, -3) + 'er');
  // Remove duplicates and the original word
  return [...new Set(variants)].filter(v => v !== word && v.length >= 2);
}

function hideDefinition() {
  definitionPopup.classList.remove('active');
}

// ===== Initialize on DOM Ready =====
document.addEventListener('DOMContentLoaded', init);
