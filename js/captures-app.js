const els = {
  screenshotInput: document.getElementById("screenshotInput"),
  frameSelect: document.getElementById("frameSelect"),
  autoDetect: document.getElementById("autoDetect"),
  bgMode: document.getElementById("bgMode"),
  bgColor: document.getElementById("bgColor"),
  bgGradientFrom: document.getElementById("bgGradientFrom"),
  bgGradientTo: document.getElementById("bgGradientTo"),
  bgGradientAngle: document.getElementById("bgGradientAngle"),
  bgGradientAngleValue: document.getElementById("bgGradientAngleValue"),
  solidBgRow: document.getElementById("solidBgRow"),
  gradientBgRow: document.getElementById("gradientBgRow"),
  gradientAngleRow: document.getElementById("gradientAngleRow"),
  padding: document.getElementById("padding"),
  paddingValue: document.getElementById("paddingValue"),
  downloadBtn: document.getElementById("downloadBtn"),
  status: document.getElementById("status"),
  outputCanvas: document.getElementById("outputCanvas")
};

const state = {
  frames: [],
  selectedFrameId: "",
  uploadedImage: null,
  uploadedFileName: "capture",
  lastDetectedRotation: 0,
  assetCache: new Map(),
  derivedMaskCache: new Map(),
  renderToken: 0,
  catalogReady: false,
  catalogPromise: null
};

function getCurrentLang() {
  const lang = localStorage.getItem("site_lang") || localStorage.getItem("kanban_lang") || "fr";
  return lang === "en" ? "en" : "fr";
}

function tCanvasPlaceholder() {
  return getCurrentLang() === "en"
    ? "Upload a screenshot to generate the render"
    : "Charge une capture pour générer le rendu";
}

function getCanvasPlaceholderColor() {
  const rootStyles = getComputedStyle(document.documentElement);
  const textSecondary = rootStyles.getPropertyValue("--text-secondary").trim();
  const textMuted = rootStyles.getPropertyValue("--text-muted").trim();
  return textSecondary || textMuted || "#627384";
}

function setStatus(text) {
  els.status.textContent = text;
}

async function ensureCatalogReady() {
  if (state.catalogReady) {
    return;
  }

  if (state.catalogPromise) {
    setStatus("Chargement du catalogue de cadres...");
    await state.catalogPromise;
    return;
  }

  throw new Error("Le catalogue de cadres n'est pas encore disponible.");
}

function flattenFrameTree(node, path = [], out = []) {
  if (!node || typeof node !== "object") {
    return out;
  }

  const isLeaf =
    Object.prototype.hasOwnProperty.call(node, "name") &&
    Object.prototype.hasOwnProperty.call(node, "x") &&
    Object.prototype.hasOwnProperty.call(node, "y");

  if (isLeaf) {
    out.push({
      path,
      name: String(node.name),
      x: Number(node.x),
      y: Number(node.y)
    });
    return out;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "version") {
      continue;
    }

    flattenFrameTree(value, [...path, key], out);
  }

  return out;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger ${url}`));
    img.src = url;
  });
}

async function getImage(url) {
  if (state.assetCache.has(url)) {
    return state.assetCache.get(url);
  }

  const image = await loadImage(url);
  state.assetCache.set(url, image);
  return image;
}

function makeOptionLabel(frame) {
  return frame.name.replace(/\s*-\s*/g, " ").replace(/\s+/g, " ").trim();
}

const frameLabelCollator = new Intl.Collator("fr", {
  numeric: true,
  sensitivity: "base"
});

function sortFramesForSelect(frames) {
  const familyOrder = {
    iPhone: 0,
    iPad: 1
  };
  const orientationOrder = {
    Portrait: 0,
    Landscape: 1
  };

  return [...frames].sort((a, b) => {
    const aFamily = familyOrder[a.path?.[0]] ?? 99;
    const bFamily = familyOrder[b.path?.[0]] ?? 99;
    if (aFamily !== bFamily) {
      return aFamily - bFamily;
    }

    const aOrientation = orientationOrder[a.path?.at(-1)] ?? 99;
    const bOrientation = orientationOrder[b.path?.at(-1)] ?? 99;

    const aBaseLabel = makeOptionLabel(a).replace(/\b(Portrait|Landscape)\b/giu, "").trim();
    const bBaseLabel = makeOptionLabel(b).replace(/\b(Portrait|Landscape)\b/giu, "").trim();
    const labelCompare = frameLabelCollator.compare(aBaseLabel, bBaseLabel);
    if (labelCompare !== 0) {
      return labelCompare;
    }

    if (aOrientation !== bOrientation) {
      return aOrientation - bOrientation;
    }

    return frameLabelCollator.compare(makeOptionLabel(a), makeOptionLabel(b));
  });
}

function getFrameOrientation(frame) {
  const name = frame.name.toLowerCase();
  if (name.includes("landscape")) {
    return "landscape";
  }
  if (name.includes("portrait")) {
    return "portrait";
  }
  return "unknown";
}

function chooseBestMatch(matches, targetOrientation) {
  if (!matches.length) {
    return null;
  }

  const sorted = [...matches].sort((a, b) => {
    const aOrientationPenalty = getFrameOrientation(a.frame) === targetOrientation ? 0 : 1;
    const bOrientationPenalty = getFrameOrientation(b.frame) === targetOrientation ? 0 : 1;

    if (aOrientationPenalty !== bOrientationPenalty) {
      return aOrientationPenalty - bOrientationPenalty;
    }

    const aRotationPenalty = a.rotation === 0 ? 0 : 1;
    const bRotationPenalty = b.rotation === 0 ? 0 : 1;

    if (aRotationPenalty !== bRotationPenalty) {
      return aRotationPenalty - bRotationPenalty;
    }

    const aSpecificity = Array.isArray(a.frame.path) ? a.frame.path.length : a.frame.name.split(" - ").length;
    const bSpecificity = Array.isArray(b.frame.path) ? b.frame.path.length : b.frame.name.split(" - ").length;

    if (aSpecificity !== bSpecificity) {
      return aSpecificity - bSpecificity;
    }

    if (a.confidence !== b.confidence) {
      return a.confidence === "exact" ? -1 : 1;
    }

    return a.frame.name.localeCompare(b.frame.name);
  });

  return sorted[0];
}

function detectFrameForImage(width, height) {
  const targetOrientation = width >= height ? "landscape" : "portrait";
  const exact = [];

  for (const frame of state.frames) {
    if (width === frame.captureW && height === frame.captureH) {
      exact.push({ frame, rotation: 0, confidence: "exact" });
      continue;
    }

    if (width === frame.captureH && height === frame.captureW) {
      exact.push({ frame, rotation: 90, confidence: "exact" });
    }
  }

  if (exact.length > 0) {
    return chooseBestMatch(exact, targetOrientation);
  }

  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const frame of state.frames) {
    const scores = [
      {
        rotation: 0,
        ratioDiff: Math.abs(width / height - frame.captureW / frame.captureH),
        pixelDiff: Math.abs(width - frame.captureW) + Math.abs(height - frame.captureH)
      },
      {
        rotation: 90,
        ratioDiff: Math.abs(width / height - frame.captureH / frame.captureW),
        pixelDiff: Math.abs(width - frame.captureH) + Math.abs(height - frame.captureW)
      }
    ];

    for (const score of scores) {
      const weighted = score.ratioDiff * 10000 + score.pixelDiff;
      if (weighted < bestScore) {
        bestScore = weighted;
        best = {
          frame,
          rotation: score.rotation,
          confidence: "approx"
        };
      }
    }
  }

  return chooseBestMatch(best ? [best] : [], targetOrientation);
}

function drawCover(ctx, image, targetW, targetH) {
  const imgW = image.width || image.naturalWidth;
  const imgH = image.height || image.naturalHeight;
  const scale = Math.max(targetW / imgW, targetH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const offsetX = (targetW - drawW) / 2;
  const offsetY = (targetH - drawH) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawW, drawH);
}

function rotateImage90(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.height;
  canvas.height = image.width;

  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  return canvas;
}

function inferRotationForFrame(frame, screenshot) {
  if (screenshot.width === frame.captureW && screenshot.height === frame.captureH) {
    return 0;
  }

  if (screenshot.width === frame.captureH && screenshot.height === frame.captureW) {
    return 90;
  }

  const directRatioDiff = Math.abs(screenshot.width / screenshot.height - frame.captureW / frame.captureH);
  const rotatedRatioDiff = Math.abs(
    screenshot.width / screenshot.height - frame.captureH / frame.captureW
  );

  return rotatedRatioDiff < directRatioDiff ? 90 : 0;
}

function drawBackground(ctx, width, height) {
  const mode = els.bgMode.value;

  if (mode === "transparent") {
    return;
  }

  if (mode === "gradient") {
    const angle = Number(els.bgGradientAngle.value);
    const radians = (angle * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const halfLength = Math.sqrt(width * width + height * height) / 2;
    const dx = Math.cos(radians) * halfLength;
    const dy = Math.sin(radians) * halfLength;
    const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);

    gradient.addColorStop(0, els.bgGradientFrom.value);
    gradient.addColorStop(1, els.bgGradientTo.value);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  ctx.fillStyle = els.bgColor.value;
  ctx.fillRect(0, 0, width, height);
}

function getScreenCornerRadius(frame) {
  const smaller = Math.min(frame.captureW, frame.captureH);
  const name = frame.name.toLowerCase();

  if (name.includes("iphone")) {
    return Math.round(smaller * 0.14);
  }
  if (name.includes("ipad")) {
    return Math.round(smaller * 0.04);
  }
  if (name.includes("watch")) {
    return Math.round(smaller * 0.25);
  }
  if (name.includes("mac") || name.includes("imac")) {
    return Math.round(smaller * 0.02);
  }
  return Math.round(smaller * 0.06);
}

function createDerivedMaskFromFrame(frame, frameImage) {
  if (state.derivedMaskCache.has(frame.id)) {
    return state.derivedMaskCache.get(frame.id);
  }

  const w = frame.captureW;
  const h = frame.captureH;
  const r = getScreenCornerRadius(frame);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = w;
  maskCanvas.height = h;
  const ctx = maskCanvas.getContext("2d");

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  state.derivedMaskCache.set(frame.id, maskCanvas);
  return maskCanvas;
}

async function renderPreview() {
  const frame = state.frames.find((f) => f.id === state.selectedFrameId);

  if (!frame || !state.uploadedImage) {
    const ctx = els.outputCanvas.getContext("2d");
    els.outputCanvas.width = 1400;
    els.outputCanvas.height = 840;
    ctx.clearRect(0, 0, els.outputCanvas.width, els.outputCanvas.height);
    ctx.fillStyle = getCanvasPlaceholderColor();
    ctx.font = "600 32px 'Avenir Next', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(tCanvasPlaceholder(), els.outputCanvas.width / 2, 420);
    els.downloadBtn.disabled = true;
    return;
  }

  const pad = Number(els.padding.value);
  const rotation = inferRotationForFrame(frame, state.uploadedImage);
  const token = ++state.renderToken;

  let frameImage;
  let maskImage;

  try {
    frameImage = await getImage(frame.frameUrl);
    maskImage = createDerivedMaskFromFrame(frame, frameImage);
  } catch {
    setStatus("Impossible de charger les assets du cadre selectionne.");
    els.downloadBtn.disabled = true;
    return;
  }

  if (token !== state.renderToken) {
    return;
  }

  const screenshotSurface = document.createElement("canvas");
  screenshotSurface.width = frame.captureW;
  screenshotSurface.height = frame.captureH;

  const screenshotCtx = screenshotSurface.getContext("2d");
  const source = rotation === 90 ? rotateImage90(state.uploadedImage) : state.uploadedImage;
  drawCover(screenshotCtx, source, frame.captureW, frame.captureH);

  if (maskImage) {
    screenshotCtx.globalCompositeOperation = "destination-in";
    screenshotCtx.drawImage(maskImage, 0, 0, frame.captureW, frame.captureH);
    screenshotCtx.globalCompositeOperation = "source-over";
  }

  const deviceSurface = document.createElement("canvas");
  deviceSurface.width = frame.frameW;
  deviceSurface.height = frame.frameH;

  const deviceCtx = deviceSurface.getContext("2d");
  deviceCtx.drawImage(screenshotSurface, frame.x, frame.y, frame.captureW, frame.captureH);
  deviceCtx.drawImage(frameImage, 0, 0, frame.frameW, frame.frameH);

  els.outputCanvas.width = frame.frameW + pad * 2;
  els.outputCanvas.height = frame.frameH + pad * 2;

  const out = els.outputCanvas.getContext("2d");
  out.clearRect(0, 0, els.outputCanvas.width, els.outputCanvas.height);
  drawBackground(out, els.outputCanvas.width, els.outputCanvas.height);
  out.drawImage(deviceSurface, pad, pad);

  els.downloadBtn.disabled = false;
}

function updatePaddingOutput() {
  els.paddingValue.textContent = `${els.padding.value} px`;
}

function updateGradientAngleOutput() {
  els.bgGradientAngleValue.textContent = `${els.bgGradientAngle.value} deg`;
}

function syncColorInputPreview(input) {
  if (!input) {
    return;
  }

  // Force visible color preview on browsers/themes that flatten native color inputs.
  input.style.background = input.value;
}

function syncAllColorInputPreviews() {
  syncColorInputPreview(els.bgColor);
  syncColorInputPreview(els.bgGradientFrom);
  syncColorInputPreview(els.bgGradientTo);
}

function updateBackgroundControls() {
  const mode = els.bgMode.value;

  els.solidBgRow.classList.toggle("cap-hidden", mode !== "solid");
  els.gradientBgRow.classList.toggle("cap-hidden", mode !== "gradient");
  els.gradientAngleRow.classList.toggle("cap-hidden", mode !== "gradient");
}

async function handleScreenshotUpload(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  const url = URL.createObjectURL(file);

  try {
    await ensureCatalogReady();
    const image = await loadImage(url);
    state.uploadedImage = image;
    state.uploadedFileName = file.name.replace(/\.[^.]+$/, "") || "capture";

    // Filter frames to those compatible with this screenshot's aspect ratio
    const compatible = getCompatibleFrames(image);
    populateFrameSelect(compatible);

    if (els.autoDetect.checked) {
      const detected = detectFrameForImage(image.width, image.height);

      if (detected && compatible.some((f) => f.id === detected.frame.id)) {
        state.selectedFrameId = detected.frame.id;
        state.lastDetectedRotation = detected.rotation;
        els.frameSelect.value = detected.frame.id;

        if (detected.confidence === "exact") {
          setStatus(
            `Cadre detecte : ${detected.frame.name} (${image.width} x ${image.height}) — ${compatible.length} cadre(s) compatible(s)`
          );
        } else {
          setStatus(
            `Detection approx : ${detected.frame.name} — ${compatible.length} cadre(s) compatible(s)`
          );
        }
      } else {
        setStatus(
          `${compatible.length} cadre(s) compatible(s) avec cette capture (${image.width} x ${image.height})`
        );
      }
    } else {
      setStatus(
        `Capture chargee (${image.width} x ${image.height}). ${compatible.length} cadre(s) compatible(s).`
      );
    }

    renderPreview();
  } catch {
    setStatus("Echec du chargement de la capture. Reessaie avec un autre fichier image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function handleFrameSelection(event) {
  state.selectedFrameId = event.target.value;
  const frame = state.frames.find((f) => f.id === state.selectedFrameId);

  if (frame) {
    setStatus(`Cadre actif: ${frame.name}`);
  }

  renderPreview();
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Blob vide"));
    }, "image/png");
  });
}

async function downloadOutput() {
  if (els.downloadBtn.disabled) {
    return;
  }

  const frame = state.frames.find((f) => f.id === state.selectedFrameId);
  const suffix = frame ? frame.name.replace(/\s+/g, "-").toLowerCase() : "frame";
  const fileName = `${state.uploadedFileName}-${suffix}.png`;

  try {
    const blob = await canvasToBlob(els.outputCanvas);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    a.rel = "noopener";
    document.body.append(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
    setStatus(`PNG exporte: ${fileName}`);
  } catch {
    try {
      const fallbackUrl = els.outputCanvas.toDataURL("image/png");
      const popup = window.open(fallbackUrl, "_blank", "noopener");

      if (!popup) {
        throw new Error("popup bloquee");
      }

      setStatus("Le navigateur a bloque le telechargement direct. Image ouverte dans un nouvel onglet.");
    } catch {
      setStatus(
        "Export bloque par le navigateur. Essaie via un serveur local: python3 -m http.server 8000"
      );
    }
  }
}

function getCompatibleFrames(screenshot) {
  if (!screenshot) {
    return state.frames;
  }

  const imgRatio = screenshot.width / screenshot.height;
  const tolerance = 0.15;
  const scored = [];

  for (const frame of state.frames) {
    const frameRatio = frame.captureW / frame.captureH;
    const rotatedRatio = frame.captureH / frame.captureW;
    const directDiff = Math.abs(imgRatio - frameRatio) / Math.max(imgRatio, frameRatio);
    const rotatedDiff = Math.abs(imgRatio - rotatedRatio) / Math.max(imgRatio, rotatedRatio);
    const bestDiff = Math.min(directDiff, rotatedDiff);

    if (bestDiff <= tolerance) {
      scored.push({ frame, diff: bestDiff });
    }
  }

  scored.sort((a, b) => a.diff - b.diff);
  return scored.length > 0 ? scored.map((s) => s.frame) : state.frames;
}

function populateFrameSelect(frames) {
  const sortedFrames = sortFramesForSelect(frames);
  els.frameSelect.innerHTML = "";

  for (const frame of sortedFrames) {
    const option = document.createElement("option");
    option.value = frame.id;
    option.textContent = makeOptionLabel(frame);
    els.frameSelect.append(option);
  }

  els.frameSelect.disabled = sortedFrames.length === 0;

  if (sortedFrames[0]) {
    state.selectedFrameId = sortedFrames[0].id;
    els.frameSelect.value = sortedFrames[0].id;
  } else {
    state.selectedFrameId = "";
  }
}

async function buildFrameCatalog() {
  if (Array.isArray(window.FRAMES_CATALOG) && window.FRAMES_CATALOG.length > 0) {
    return window.FRAMES_CATALOG;
  }

  let config = window.FRAMES_DATA;

  if (!config) {
    try {
      const response = await fetch("images/Frames/Frames.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      config = await response.json();
    } catch {
      throw new Error(
        "Impossible de lire les donnees de cadres. Ouvre index.html tel quel ou lance un serveur local."
      );
    }
  }

  const leaves = flattenFrameTree(config)
    .filter((leaf) => Number.isFinite(leaf.x) && Number.isFinite(leaf.y))
    .sort((a, b) => a.name.localeCompare(b.name));

  const catalog = (await Promise.all(
    leaves.map(async (leaf) => {
      const frameUrl = `images/Frames/${leaf.name}.png`;

      try {
        const frameImage = await loadImage(frameUrl);

        // Cache frame image for later use in renderPreview
        state.assetCache.set(frameUrl, frameImage);

        const captureW = Math.max(1, frameImage.naturalWidth - leaf.x * 2);
        const captureH = Math.max(1, frameImage.naturalHeight - leaf.y * 2);

        return {
          id: `${leaf.name}-${leaf.x}-${leaf.y}`,
          name: leaf.name,
          path: leaf.path,
          x: leaf.x,
          y: leaf.y,
          frameW: frameImage.naturalWidth,
          frameH: frameImage.naturalHeight,
          captureW,
          captureH,
          frameUrl,
          maskUrl: null
        };
      } catch {
        // Ignore entries that point to files that do not exist.
        return null;
      }
    })
  )).filter(Boolean);

  if (!catalog.length) {
    throw new Error("Aucun cadre valide trouve dans le dossier images/Frames.");
  }

  return catalog;
}

async function init() {
  updatePaddingOutput();
  updateGradientAngleOutput();
  syncAllColorInputPreviews();
  updateBackgroundControls();
  renderPreview();

  state.catalogPromise = (async () => {
    try {
      setStatus("Preparation du catalogue de cadres...");
      state.frames = await buildFrameCatalog();
      state.catalogReady = true;
      populateFrameSelect(state.frames);
      setStatus(`${state.frames.length} cadres charges. Tu peux importer une capture.`);
      renderPreview();
    } catch (error) {
      state.catalogReady = false;
      setStatus(error.message);
    }
  })();

  await state.catalogPromise;
}

els.screenshotInput.addEventListener("change", handleScreenshotUpload);
els.frameSelect.addEventListener("change", handleFrameSelection);
els.bgMode.addEventListener("change", () => {
  updateBackgroundControls();
  renderPreview();
});
els.bgColor.addEventListener("input", () => {
  syncColorInputPreview(els.bgColor);
  renderPreview();
});
els.bgGradientFrom.addEventListener("input", () => {
  syncColorInputPreview(els.bgGradientFrom);
  renderPreview();
});
els.bgGradientTo.addEventListener("input", () => {
  syncColorInputPreview(els.bgGradientTo);
  renderPreview();
});
els.bgGradientAngle.addEventListener("input", () => {
  updateGradientAngleOutput();
  renderPreview();
});
els.padding.addEventListener("input", () => {
  updatePaddingOutput();
  renderPreview();
});
els.autoDetect.addEventListener("change", () => {
  if (!state.uploadedImage) {
    return;
  }

  if (els.autoDetect.checked) {
    const compatible = getCompatibleFrames(state.uploadedImage);
    populateFrameSelect(compatible);

    const detected = detectFrameForImage(state.uploadedImage.width, state.uploadedImage.height);
    if (detected && compatible.some((f) => f.id === detected.frame.id)) {
      state.selectedFrameId = detected.frame.id;
      state.lastDetectedRotation = detected.rotation;
      els.frameSelect.value = detected.frame.id;
      setStatus(`Detection auto active : ${detected.frame.name}`);
    }
  } else {
    // Show all frames when auto-detect is disabled
    populateFrameSelect(state.frames);
  }

  renderPreview();
});
els.downloadBtn.addEventListener("click", downloadOutput);
document.addEventListener("siteLanguageChanged", () => {
  renderPreview();
});

init();
