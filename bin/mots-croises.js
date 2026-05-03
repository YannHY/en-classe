#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  buildCrosswordPayload,
  parseImportText,
} = require('../js/crossword-cli-core.js');

function colorize(text, colorCode) {
  if (!process.stdout.isTTY) return text;
  return `\u001b[${colorCode}m${text}\u001b[0m`;
}

function commandLine(command, rest = '') {
  return `  ${colorize(command, '36')}${rest ? ` ${rest}` : ''}`;
}

function printBanner() {
  const banner = [
    '███╗   ███╗ ██████╗ ████████╗███████╗',
    '████╗ ████║██╔═══██╗╚══██╔══╝██╔════╝',
    '██╔████╔██║██║   ██║   ██║   ███████╗',
    '██║╚██╔╝██║██║   ██║   ██║   ╚════██║',
    '██║ ╚═╝ ██║╚██████╔╝   ██║   ███████║',
    '╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚══════╝',
    '',
    ' ██████╗██████╗  ██████╗ ██╗███████╗███████╗███████╗',
    '██╔════╝██╔══██╗██╔═══██╗██║██╔════╝██╔════╝██╔════╝',
    '██║     ██████╔╝██║   ██║██║███████╗█████╗  ███████╗',
    '██║     ██╔══██╗██║   ██║██║╚════██║██╔══╝  ╚════██║',
    '╚██████╗██║  ██║╚██████╔╝██║███████║███████╗███████║',
    ' ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝╚══════╝╚══════╝',
  ];

  process.stdout.write(`${colorize(banner.join('\n'), '36')}\n\n`);
  process.stdout.write(`${colorize('CLI de publication de grilles de mots croisés', '90')}\n\n`);
}

function printUsage() {
  printBanner();
  process.stdout.write(
    [
      colorize('Usage', '1'),
      commandLine('mots-croises', 'publish liste.txt'),
      commandLine('mots-croises', 'build liste.txt --out grille.json'),
      '',
      colorize('Commandes', '1'),
      commandLine('mots-croises', 'publish <fichier|-> [--endpoint URL] [--title "Titre"] [--block-color #18181b]'),
      commandLine('mots-croises', 'build <fichier|-> [--out fichier.json] [--title "Titre"] [--block-color #18181b]'),
      '',
      colorize('Exemples', '1'),
      commandLine('mots-croises', 'publish futur.txt'),
      commandLine('mots-croises', 'publish futur.txt --title "Futur de l’indicatif"'),
      commandLine('mots-croises', 'publish futur.txt --block-color "#222222"'),
      '',
      colorize('Notes', '1'),
      '  - Utilisez "-" pour lire depuis stdin.',
      '  - endpoint par défaut: https://www.ralentirtravaux.com/apps/en-classe/publish.php',
      '  - "publish" envoie la grille sur le site et renvoie une URL.',
      '  - "build" génère seulement le JSON, sans publication.',
      '',
    ].join('\n')
  );
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    _: [],
    endpoint: 'https://www.ralentirtravaux.com/apps/en-classe/publish.php',
    title: 'Mots Croisés',
    blockColor: '#18181b',
    out: '',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (arg === '--endpoint') {
      args.endpoint = argv[++i] || '';
      continue;
    }
    if (arg === '--title') {
      args.title = argv[++i] || '';
      continue;
    }
    if (arg === '--block-color') {
      args.blockColor = argv[++i] || '';
      continue;
    }
    if (arg === '--out') {
      args.out = argv[++i] || '';
      continue;
    }
    args._.push(arg);
  }

  return args;
}

async function readInput(inputArg) {
  if (!inputArg || inputArg === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8');
  }

  const inputPath = path.resolve(process.cwd(), inputArg);
  return fs.readFileSync(inputPath, 'utf8');
}

function loadWords(raw) {
  const words = parseImportText(raw);
  if (!words.length) {
    fail('Aucun mot exploitable dans l’entrée.');
  }
  return words;
}

async function buildCommand(options) {
  const inputArg = options._[1];
  if (!inputArg) {
    printUsage();
    fail('Commande build: fichier d’entrée manquant.');
  }

  const raw = await readInput(inputArg);
  const words = loadWords(raw);
  const payload = buildCrosswordPayload(words, {
    title: options.title,
    blockColor: options.blockColor,
  });
  const json = `${JSON.stringify(payload, null, 2)}\n`;

  if (options.out) {
    const outPath = path.resolve(process.cwd(), options.out);
    fs.writeFileSync(outPath, json, 'utf8');
    process.stdout.write(`${outPath}\n`);
    return;
  }

  process.stdout.write(json);
}

async function publishCommand(options) {
  const inputArg = options._[1];
  if (!inputArg) {
    printUsage();
    fail('Commande publish: fichier d’entrée manquant.');
  }
  if (!options.endpoint) {
    fail('Commande publish: endpoint manquant.');
  }

  const raw = await readInput(inputArg);
  const words = loadWords(raw);
  const payload = buildCrosswordPayload(words, {
    title: options.title,
    blockColor: options.blockColor,
  });

  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crossword: payload }),
  });

  let result = null;
  try {
    result = await response.json();
  } catch (error) {
    fail(`Réponse invalide du serveur (${error.message}).`);
  }

  if (!response.ok || !result || result.ok !== true || !result.url) {
    fail(result && result.error ? result.error : `Publication impossible (${response.status}).`);
  }

  process.stdout.write(`${result.url}\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options._.length) {
    printUsage();
    return;
  }

  const command = options._[0];
  if (command === 'build') {
    await buildCommand(options);
    return;
  }

  if (command === 'publish') {
    await publishCommand(options);
    return;
  }

  printUsage();
  fail(`Commande inconnue: ${command}`);
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
