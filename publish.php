<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respondJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $error): never
{
    respondJson($status, ['ok' => false, 'error' => $error]);
}

function esc(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function normalizeHexColor(mixed $value, string $fallback = '#18181b'): string
{
    if (!is_string($value)) {
        return $fallback;
    }

    if (!preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', trim($value), $matches)) {
        return $fallback;
    }

    $hex = strtolower($matches[1]);
    if (strlen($hex) === 3) {
        return sprintf('#%s%s%s%s%s%s', $hex[0], $hex[0], $hex[1], $hex[1], $hex[2], $hex[2]);
    }

    return "#{$hex}";
}

function requireString(mixed $value, int $maxLength, string $label, bool $allowEmpty = false): string
{
    if (!is_string($value)) {
        fail(400, "Champ invalide : {$label}.");
    }

    $trimmed = trim($value);
    if ($trimmed === '' && !$allowEmpty) {
        fail(400, "Champ invalide : {$label}.");
    }

    if (strlen($trimmed) > $maxLength) {
        fail(400, "Champ trop long : {$label}.");
    }

    return $trimmed;
}

function requireIntInRange(mixed $value, int $min, int $max, string $label): int
{
    if (!is_int($value) || $value < $min || $value > $max) {
        fail(400, "Champ invalide : {$label}.");
    }

    return $value;
}

function requireOptionalClueId(mixed $value, string $prefix, string $label): ?string
{
    if ($value === null) {
        return null;
    }

    if (!is_string($value) || !preg_match('/^' . preg_quote($prefix, '/') . '\d+$/', $value)) {
        fail(400, "Champ invalide : {$label}.");
    }

    return $value;
}

function parseCellKey(string $key, string $label): array
{
    if (!preg_match('/^(\d+)-(\d+)$/', $key, $matches)) {
        fail(400, "Champ invalide : {$label}.");
    }

    return [(int) $matches[1], (int) $matches[2]];
}

function validateClueList(mixed $input, string $dir, int $rows, int $cols): array
{
    if (!is_array($input)) {
        fail(400, "Liste d'indices invalide : {$dir}.");
    }

    $validated = [];
    $seenIds = [];

    foreach ($input as $index => $rawWord) {
        if (!is_array($rawWord)) {
            fail(400, "Indice invalide : {$dir}.");
        }

        $id = requireString($rawWord['id'] ?? null, 16, "clues.{$dir}[{$index}].id");
        if (!preg_match('/^' . $dir . '-\d+$/', $id)) {
            fail(400, "Champ invalide : clues.{$dir}[{$index}].id.");
        }
        if (isset($seenIds[$id])) {
            fail(400, "Identifiant dupliqué : {$id}.");
        }

        $number = requireIntInRange($rawWord['number'] ?? null, 1, 999, "clues.{$dir}[{$index}].number");
        if ($id !== "{$dir}-{$number}") {
            fail(400, "Identifiant incohérent : clues.{$dir}[{$index}].id.");
        }

        $answer = requireString($rawWord['answer'] ?? null, 40, "clues.{$dir}[{$index}].answer");
        if (!preg_match('/^[A-Z]{2,40}$/', $answer)) {
            fail(400, "Réponse invalide : clues.{$dir}[{$index}].answer.");
        }

        $clue = requireString($rawWord['clue'] ?? '', 500, "clues.{$dir}[{$index}].clue", true);
        $row = requireIntInRange($rawWord['row'] ?? null, 0, $rows - 1, "clues.{$dir}[{$index}].row");
        $col = requireIntInRange($rawWord['col'] ?? null, 0, $cols - 1, "clues.{$dir}[{$index}].col");
        $length = requireIntInRange($rawWord['length'] ?? null, 2, 40, "clues.{$dir}[{$index}].length");

        if ($length !== strlen($answer)) {
            fail(400, "Longueur incohérente : clues.{$dir}[{$index}].length.");
        }

        $cells = $rawWord['cells'] ?? null;
        if (!is_array($cells) || count($cells) !== $length) {
            fail(400, "Cellules invalides : clues.{$dir}[{$index}].cells.");
        }

        $validatedCells = [];
        $seenCells = [];
        foreach ($cells as $cellIndex => $cellKey) {
            $key = requireString($cellKey, 16, "clues.{$dir}[{$index}].cells[{$cellIndex}]");
            [$cellRow, $cellCol] = parseCellKey($key, "clues.{$dir}[{$index}].cells[{$cellIndex}]");

            if ($cellRow < 0 || $cellRow >= $rows || $cellCol < 0 || $cellCol >= $cols) {
                fail(400, "Cellule hors limites : clues.{$dir}[{$index}].cells[{$cellIndex}].");
            }

            $expectedRow = $dir === 'H' ? $row : $row + $cellIndex;
            $expectedCol = $dir === 'H' ? $col + $cellIndex : $col;
            if ($cellRow !== $expectedRow || $cellCol !== $expectedCol) {
                fail(400, "Suite de cellules invalide : clues.{$dir}[{$index}].cells.");
            }

            if (isset($seenCells[$key])) {
                fail(400, "Cellule dupliquée : clues.{$dir}[{$index}].cells.");
            }

            $seenCells[$key] = true;
            $validatedCells[] = $key;
        }

        $validated[] = [
            'id' => $id,
            'number' => $number,
            'clue' => $clue,
            'answer' => $answer,
            'row' => $row,
            'col' => $col,
            'length' => $length,
            'cells' => $validatedCells,
        ];
        $seenIds[$id] = true;
    }

    return $validated;
}

function validateCrosswordPayload(mixed $input): array
{
    if (!is_array($input)) {
        fail(400, 'Données de grille invalides.');
    }

    $rows = requireIntInRange($input['rows'] ?? null, 1, 35, 'rows');
    $cols = requireIntInRange($input['cols'] ?? null, 1, 35, 'cols');
    $title = requireString($input['title'] ?? 'Mots Croisés', 80, 'title');
    $blockColor = normalizeHexColor($input['blockColor'] ?? '#18181b');

    $cellsInput = $input['cells'] ?? null;
    if (!is_array($cellsInput) || $cellsInput === []) {
        fail(400, 'Cellules invalides.');
    }

    if (count($cellsInput) > $rows * $cols) {
        fail(400, 'Trop de cellules pour cette grille.');
    }

    $cellMap = [];
    foreach ($cellsInput as $index => $rawCell) {
        if (!is_array($rawCell)) {
            fail(400, "Cellule invalide : cells[{$index}].");
        }

        $row = requireIntInRange($rawCell['row'] ?? null, 0, $rows - 1, "cells[{$index}].row");
        $col = requireIntInRange($rawCell['col'] ?? null, 0, $cols - 1, "cells[{$index}].col");
        $key = requireString($rawCell['key'] ?? null, 16, "cells[{$index}].key");

        if ($key !== "{$row}-{$col}") {
            fail(400, "Clé incohérente : cells[{$index}].key.");
        }

        $solution = requireString($rawCell['solution'] ?? null, 1, "cells[{$index}].solution");
        if (!preg_match('/^[A-Z]$/', $solution)) {
            fail(400, "Solution invalide : cells[{$index}].solution.");
        }

        $number = $rawCell['number'] ?? null;
        if ($number !== null) {
            $number = requireIntInRange($number, 1, 999, "cells[{$index}].number");
        }

        $across = requireOptionalClueId($rawCell['across'] ?? null, 'H-', "cells[{$index}].across");
        $down = requireOptionalClueId($rawCell['down'] ?? null, 'V-', "cells[{$index}].down");

        if (isset($cellMap[$key])) {
            fail(400, "Cellule dupliquée : {$key}.");
        }

        $cellMap[$key] = [
            'key' => $key,
            'row' => $row,
            'col' => $col,
            'solution' => $solution,
            'number' => $number,
            'across' => $across,
            'down' => $down,
        ];
    }

    $cluesInput = $input['clues'] ?? null;
    if (!is_array($cluesInput)) {
        fail(400, 'Indices invalides.');
    }

    $clues = [
        'H' => validateClueList($cluesInput['H'] ?? null, 'H', $rows, $cols),
        'V' => validateClueList($cluesInput['V'] ?? null, 'V', $rows, $cols),
    ];

    $wordMap = [];
    foreach (['H', 'V'] as $dir) {
        foreach ($clues[$dir] as $word) {
            $wordMap[$word['id']] = $word;
        }
    }

    foreach ($clues as $dir => $words) {
        foreach ($words as $word) {
            foreach ($word['cells'] as $offset => $key) {
                if (!isset($cellMap[$key])) {
                    fail(400, "Référence de cellule inconnue : {$key}.");
                }

                $cell = $cellMap[$key];
                $expectedId = $word['id'];
                $linkedId = $dir === 'H' ? $cell['across'] : $cell['down'];
                if ($linkedId !== $expectedId) {
                    fail(400, "Référence incohérente entre cellule et indice : {$expectedId}.");
                }

                $expectedLetter = $word['answer'][$offset];
                if ($cell['solution'] !== $expectedLetter) {
                    fail(400, "Lettre incohérente pour {$expectedId}.");
                }
            }
        }
    }

    foreach ($cellMap as $cell) {
        if ($cell['across'] !== null && !isset($wordMap[$cell['across']])) {
            fail(400, 'Indice horizontal manquant.');
        }
        if ($cell['down'] !== null && !isset($wordMap[$cell['down']])) {
            fail(400, 'Indice vertical manquant.');
        }
        if ($cell['across'] === null && $cell['down'] === null) {
            fail(400, 'Cellule orpheline détectée.');
        }
    }

    usort($clues['H'], static fn(array $a, array $b): int => $a['number'] <=> $b['number']);
    usort($clues['V'], static fn(array $a, array $b): int => $a['number'] <=> $b['number']);
    $cells = array_values($cellMap);
    usort($cells, static fn(array $a, array $b): int => ($a['row'] <=> $b['row']) ?: ($a['col'] <=> $b['col']));

    return [
        'title' => $title,
        'generatedAt' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DATE_ATOM),
        'blockColor' => $blockColor,
        'rows' => $rows,
        'cols' => $cols,
        'cells' => $cells,
        'clues' => $clues,
    ];
}

function renderPublishedCrossword(array $data, string $slug): string
{
    $publishedAt = esc((new DateTimeImmutable($data['generatedAt']))->setTimezone(new DateTimeZone('Europe/Paris'))->format('d/m/Y H:i'));

    $template = <<<'HTML'
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>__TITLE__</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --surface: #ffffff;
      --surface-2: #eef2f7;
      --border: #d8dee8;
      --text-1: #1e2430;
      --text-2: #5a6474;
      --accent: #2f5bea;
      --accent-soft: #e9efff;
      --danger: #b42318;
      --success: #067647;
      --block: __BLOCK_COLOR__;
      --cell: 42px;
      --radius: 16px;
      --shadow: 0 12px 30px rgba(21, 32, 56, .08);
      font-family: Inter, system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(47, 91, 234, .08), transparent 26%),
        linear-gradient(180deg, #fbfcff, var(--bg));
      color: var(--text-1);
      font: 15px/1.5 Inter, system-ui, sans-serif;
    }
    .page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 20px 40px;
    }
    .hero {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(28px, 4vw, 40px);
      line-height: 1.02;
      letter-spacing: -.04em;
    }
    .meta {
      color: var(--text-2);
      font-size: 13px;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(320px, auto) minmax(280px, 360px);
      gap: 24px;
      align-items: start;
    }
    .card {
      background: color-mix(in srgb, var(--surface) 92%, white);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .board {
      padding: 20px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
    }
    .btn {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-1);
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: transform .12s ease, border-color .18s ease, background .18s ease;
    }
    .btn:hover { transform: translateY(-1px); border-color: #bac6db; background: #fafcff; }
    .btn:active { transform: translateY(0); }
    .btn--accent { border-color: rgba(47, 91, 234, .28); background: var(--accent-soft); color: var(--accent); }
    .status {
      min-height: 22px;
      color: var(--text-2);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .status.is-error { color: var(--danger); }
    .status.is-success { color: var(--success); }
    .grid-wrap {
      overflow: auto;
      padding: 8px;
      border-radius: 20px;
      background: var(--block);
    }
    .grid {
      display: grid;
      gap: 1px;
      width: max-content;
      background: var(--block);
    }
    .cell {
      position: relative;
      width: var(--cell);
      height: var(--cell);
      background: #fff;
    }
    .cell.is-block { background: var(--block); }
    .cell.is-active { outline: 2px solid rgba(47, 91, 234, .95); outline-offset: -2px; z-index: 2; }
    .cell.is-word { background: #eef3ff; }
    .cell.is-correct input { color: var(--success); }
    .cell.is-wrong input { color: var(--danger); }
    .cell-num {
      position: absolute;
      top: 3px;
      left: 4px;
      font-size: 9px;
      line-height: 1;
      color: #6b7280;
      pointer-events: none;
    }
    .cell-input {
      width: 100%;
      height: 100%;
      border: 0;
      padding: 0;
      text-align: center;
      font: 700 22px/1 Inter, system-ui, sans-serif;
      text-transform: uppercase;
      color: #111827;
      background: transparent;
      outline: none;
      caret-color: transparent;
    }
    .sidebar {
      padding: 20px;
      position: sticky;
      top: 16px;
    }
    .sidebar h2 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--text-2);
      margin: 0 0 12px;
    }
    .clue-section + .clue-section { margin-top: 22px; }
    .clue-list {
      display: grid;
      gap: 8px;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .clue-btn {
      width: 100%;
      text-align: left;
      border: 1px solid transparent;
      background: transparent;
      border-radius: 12px;
      padding: 8px 10px;
      font: inherit;
      color: var(--text-1);
      cursor: pointer;
      transition: background .16s ease, border-color .16s ease, transform .12s ease;
    }
    .clue-btn:hover { background: #f7f9fc; border-color: var(--border); transform: translateX(1px); }
    .clue-btn.is-active { background: var(--accent-soft); border-color: rgba(47, 91, 234, .22); }
    .clue-num {
      display: inline-block;
      min-width: 24px;
      color: var(--accent);
      font-weight: 700;
    }
    .legend {
      margin-top: 18px;
      color: var(--text-2);
      font-size: 13px;
    }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { position: static; }
      .hero { align-items: start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <div>
        <h1>__TITLE__</h1>
        <div class="meta">Grille interactive exportée le __DATE__</div>
      </div>
    </header>

    <section class="layout">
      <div class="card board">
        <div class="toolbar">
          <button class="btn btn--accent" type="button" id="checkBtn">Vérifier</button>
          <button class="btn" type="button" id="clearBtn">Réinitialiser</button>
          <button class="btn" type="button" id="revealBtn">Révéler la solution</button>
        </div>
        <div class="status" id="status">Cliquez sur une définition ou une case pour commencer.</div>
        <div class="grid-wrap">
          <div class="grid" id="grid" aria-label="Grille de mots croisés"></div>
        </div>
      </div>

      <aside class="card sidebar">
        <section class="clue-section">
          <h2>Horizontalement</h2>
          <ol class="clue-list" id="cluesH"></ol>
        </section>
        <section class="clue-section">
          <h2>Verticalement</h2>
          <ol class="clue-list" id="cluesV"></ol>
        </section>
        <p class="legend">Astuce: utilisez les flèches du clavier pour naviguer et cliquez une deuxième fois sur une case croisée pour changer de direction.</p>
      </aside>
    </section>
  </main>

  <div hidden id="crossword-data" data-crossword-src="__DATA_FILE__"></div>
  <script src="../js/crossword-player.js"></script>
</body>
</html>
HTML;

    return strtr($template, [
        '__TITLE__' => esc($data['title']),
        '__BLOCK_COLOR__' => esc($data['blockColor']),
        '__DATE__' => $publishedAt,
        '__DATA_FILE__' => esc($slug . '.json'),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Methode non autorisee.');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$hostHeader = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && $hostHeader !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = parse_url('http://' . $hostHeader, PHP_URL_HOST);
    if (!is_string($originHost) || !is_string($requestHost) || strcasecmp($originHost, $requestHost) !== 0) {
        fail(403, 'Origine non autorisee.');
    }
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '', 2)[0]));
if ($contentType !== '' && $contentType !== 'application/json') {
    fail(415, 'Content-Type non supporte.');
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') {
    fail(400, 'Requete vide.');
}

if (strlen($raw) > 512 * 1024) {
    fail(413, 'Requete trop volumineuse.');
}

try {
    $payload = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    fail(400, 'JSON invalide.');
}

if (!is_array($payload)) {
    fail(400, 'JSON invalide.');
}

$crossword = validateCrosswordPayload($payload['crossword'] ?? null);

$slug = sprintf(
    'mots-croises-%s-%s',
    gmdate('Ymd-His'),
    substr(bin2hex(random_bytes(3)), 0, 6)
);

$json = json_encode(
    $crossword,
    JSON_UNESCAPED_SLASHES
    | JSON_UNESCAPED_UNICODE
);

if ($json === false) {
    fail(500, 'Impossible de generer les donnees de la grille.');
}

$html = renderPublishedCrossword($crossword, $slug);

$publishDir = __DIR__ . DIRECTORY_SEPARATOR . 'grilles';
if (!is_dir($publishDir) && !mkdir($publishDir, 0755, true) && !is_dir($publishDir)) {
    fail(500, 'Creation du dossier impossible.');
}

$targetPath = $publishDir . DIRECTORY_SEPARATOR . $slug . '.html';
$dataPath = $publishDir . DIRECTORY_SEPARATOR . $slug . '.json';

if (file_put_contents($dataPath, $json, LOCK_EX) === false) {
    fail(500, 'Ecriture du fichier de donnees impossible.');
}

if (file_put_contents($targetPath, $html, LOCK_EX) === false) {
    fail(500, 'Ecriture du fichier impossible.');
}

$basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$url = sprintf(
    '%s://%s%s/grilles/%s.html',
    $scheme,
    $hostHeader,
    $basePath === '' ? '' : $basePath,
    $slug
);

respondJson(200, [
    'ok' => true,
    'slug' => $slug,
    'url' => $url,
]);
