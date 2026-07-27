const WORDS = [
  { word: "CENDRILLON", category: "Le conte" },
  { word: "MERVEILLEUX", category: "Le conte" },
  { word: "METAMORPHOSE", category: "Le conte" },
  { word: "OGRE", category: "Le conte" },
  { word: "SORCIERE", category: "Le conte" },
  { word: "PRINCESSE", category: "Le conte" },
  { word: "EPREUVE", category: "Le conte" },
  { word: "QUETE", category: "Le conte" },
  { word: "FORMULE", category: "Le conte" },
  { word: "CHAUDRON", category: "Le conte" },
  { word: "BAGUETTE", category: "Le conte" },
  { word: "CHATEAU", category: "Le conte" },
  { word: "FORET", category: "Le conte" },
  { word: "ADJUVANT", category: "Le conte" },
  { word: "MALFAITEUR", category: "Le conte" },
  { word: "HEROS", category: "Le conte" },
  { word: "MAGIE", category: "Le conte" },
  { word: "SORTILEGE", category: "Le conte" },
  { word: "OBJET MAGIQUE", category: "Le conte" },
  { word: "MORALE", category: "La fable" },
  { word: "CORBEAU", category: "La fable" },
  { word: "RENARD", category: "La fable" },
  { word: "ALLEGORIE", category: "La fable" },
  { word: "ANIMAL", category: "La fable" },
  { word: "SATIRE", category: "La fable" },
  { word: "RUSE", category: "La fable" },
  { word: "LECON", category: "La fable" },
  { word: "DISCOURS", category: "La fable" },
  { word: "RECIT", category: "La fable" },
  { word: "ANE", category: "La fable" },
  { word: "LION", category: "La fable" },
  { word: "LOUP", category: "La fable" },
  { word: "CIGALE", category: "La fable" },
  { word: "FOURMI", category: "La fable" },
  { word: "FABLE", category: "La fable" },
  { word: "VERS", category: "La fable" },
  { word: "PROSE", category: "La fable" },
  { word: "CRITIQUE", category: "La fable" },
  { word: "RIME", category: "La poésie" },
  { word: "VERS", category: "La poésie" },
  { word: "REJET", category: "La poésie" },
  { word: "ENJAMBEMENT", category: "La poésie" },
  { word: "ALLITERATION", category: "La poésie" },
  { word: "ASSONANCE", category: "La poésie" },
  { word: "OCTOSYLLABE", category: "La poésie" },
  { word: "LYRISME", category: "La poésie" },
  { word: "SONNET", category: "La poésie" },
  { word: "STROPHE", category: "La poésie" },
  { word: "CALLIGRAMME", category: "La poésie" },
  { word: "ALEXANDRIN", category: "La poésie" },
  { word: "HEMISTICHE", category: "La poésie" },
  { word: "CESURE", category: "La poésie" },
  { word: "QUATRAIN", category: "La poésie" },
  { word: "TERCET", category: "La poésie" },
  { word: "METAPHORE", category: "La poésie" },
  { word: "COMPARAISON", category: "La poésie" },
  { word: "REFRAIN", category: "La poésie" },
  { word: "RYTHME", category: "La poésie" },
  { word: "DIDASCALIE", category: "Le théâtre" },
  { word: "SCENE", category: "Le théâtre" },
  { word: "DIALOGUE", category: "Le théâtre" },
  { word: "COMEDIE", category: "Le théâtre" },
  { word: "COMIQUE", category: "Le théâtre" },
  { word: "TRAGEDIE", category: "Le théâtre" },
  { word: "ACTE", category: "Le théâtre" },
  { word: "REPLIQUE", category: "Le théâtre" },
  { word: "APARTE", category: "Le théâtre" },
  { word: "MONOLOGUE", category: "Le théâtre" },
  { word: "TIRADE", category: "Le théâtre" },
  { word: "EXPOSITION", category: "Le théâtre" },
  { word: "DENOUEMENT", category: "Le théâtre" },
  { word: "COUP DE THEATRE", category: "Le théâtre" },
  { word: "QUIPROQUO", category: "Le théâtre" },
  { word: "PERSONNAGE", category: "Le théâtre" },
  { word: "SGANARELLE", category: "Le théâtre" },
  { word: "DECOR", category: "Le théâtre" },
  { word: "COSTUME", category: "Le théâtre" },
  { word: "MISE EN SCENE", category: "Le théâtre" },
  { word: "DOUBLE ENONCIATION", category: "Le théâtre" },
  { word: "ULYSSE", category: "La mythologie" },
  { word: "MINOTAURE", category: "La mythologie" },
  { word: "OLYMPE", category: "La mythologie" },
  { word: "THESEE", category: "La mythologie" },
  { word: "ODYSSEE", category: "La mythologie" },
  { word: "HERCULE", category: "La mythologie" },
  { word: "ACHILLE", category: "La mythologie" },
  { word: "ARIANE", category: "La mythologie" },
  { word: "MEDUSE", category: "La mythologie" },
  { word: "CYCLOPE", category: "La mythologie" },
  { word: "LABYRINTHE", category: "La mythologie" },
  { word: "ORACLE", category: "La mythologie" },
  { word: "DESTIN", category: "La mythologie" },
  { word: "METAMORPHOSE", category: "La mythologie" },
  { word: "EPOPEE", category: "La mythologie" },
  { word: "DIEU", category: "La mythologie" },
  { word: "DEESSE", category: "La mythologie" },
  { word: "MONSTRE", category: "La mythologie" },
  { word: "HEROS", category: "La mythologie" },
  { word: "NARRATEUR", category: "Le roman" },
  { word: "PERSONNAGE", category: "Le roman" },
  { word: "CHAPITRE", category: "Le roman" },
  { word: "HEROS", category: "Le roman" },
  { word: "AVENTURE", category: "Le roman" },
  { word: "INTRIGUE", category: "Le roman" },
  { word: "PERIPETIE", category: "Le roman" },
  { word: "PORTRAIT", category: "Le roman" },
  { word: "DESCRIPTION", category: "Le roman" },
  { word: "POINT DE VUE", category: "Le roman" },
  { word: "INCIPIT", category: "Le roman" },
  { word: "CADRE", category: "Le roman" },
  { word: "TEMPS", category: "Le roman" },
  { word: "LIEU", category: "Le roman" },
  { word: "DENOUEMENT", category: "Le roman" },
  { word: "ROMANCIER", category: "Le roman" },
  { word: "FICTION", category: "Le roman" },
  { word: "ACTION", category: "Le roman" },
  { word: "SCHEMA NARRATIF", category: "Le roman" },
  { word: "CHUTE", category: "La nouvelle" },
  { word: "REALISME", category: "La nouvelle" },
  { word: "ELLIPSE", category: "La nouvelle" },
  { word: "SUSPENSE", category: "La nouvelle" },
  { word: "NARRATEUR", category: "La nouvelle" },
  { word: "RECIT BREF", category: "La nouvelle" },
  { word: "INCIPIT", category: "La nouvelle" },
  { word: "DENOUEMENT", category: "La nouvelle" },
  { word: "PERSONNAGE", category: "La nouvelle" },
  { word: "CADRE", category: "La nouvelle" },
  { word: "POINT DE VUE", category: "La nouvelle" },
  { word: "PERIPETIE", category: "La nouvelle" },
  { word: "FANTASTIQUE", category: "La nouvelle" },
  { word: "REALISTE", category: "La nouvelle" },
  { word: "TENSION", category: "La nouvelle" },
  { word: "BREF", category: "La nouvelle" },
  { word: "SURPRISE", category: "La nouvelle" },
  { word: "NOUVELLE", category: "La nouvelle" },
  { word: "NOUVELLISTE", category: "La nouvelle" },
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_MISTAKES = 6;
const CATEGORY_LABELS = {
  all: { fr: "Toutes les catégories", en: "All categories" },
  "Le conte": { fr: "Le conte", en: "Fairy tales" },
  "La fable": { fr: "La fable", en: "Fables" },
  "La poésie": { fr: "La poésie", en: "Poetry" },
  "Le théâtre": { fr: "Le théâtre", en: "Theater" },
  "La mythologie": { fr: "La mythologie", en: "Mythology" },
  "Le roman": { fr: "Le roman", en: "Novels" },
  "La nouvelle": { fr: "La nouvelle", en: "Short stories" },
};
const UI_TEXT = {
  fr: {
    ready: "À toi de jouer.",
    correct: "Bien vu.",
    wrong: "Pas cette lettre.",
    won: "Gagné ! Lance une nouvelle partie.",
    lost: (word) => `Perdu. Le mot était ${word}.`,
    newGame: "Nouvelle partie",
  },
  en: {
    ready: "Your turn.",
    correct: "Good guess.",
    wrong: "Not this letter.",
    won: "You won! Start a new game.",
    lost: (word) => `Game over. The word was ${word}.`,
    newGame: "New game",
  },
};

const categoryEl = document.querySelector("#category");
const categoryFilterEl = document.querySelector("#category-filter");
const mistakesEl = document.querySelector("#mistakes");
const streakEl = document.querySelector("#streak");
const wordEl = document.querySelector("#word");
const messageEl = document.querySelector("#message");
const keyboardEl = document.querySelector("#keyboard");
const newGameButton = document.querySelector("#new-game");
const bodyParts = [...document.querySelectorAll(".body-part")];

let currentWord = "";
let guessedLetters = new Set();
let mistakes = 0;
let streak = 0;
let isFinished = false;
let lastWord = "";
let currentCategory = "";
let currentMessageKey = "ready";

function normalizeLetter(letter) {
  return letter
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function currentLang() {
  const storedLang = localStorage.getItem("site_lang") || localStorage.getItem("kanban_lang") || "fr";
  return storedLang === "en" ? "en" : "fr";
}

function text(key, ...args) {
  const value = UI_TEXT[currentLang()][key] || UI_TEXT.fr[key];
  return typeof value === "function" ? value(...args) : value;
}

function categoryLabel(category) {
  return CATEGORY_LABELS[category]?.[currentLang()] || category;
}

function setMessage(key, className = "") {
  currentMessageKey = key;
  messageEl.textContent = key === "lost" ? text(key, currentWord) : text(key);
  messageEl.className = `message${className ? ` ${className}` : ""}`;
}

function chooseWord() {
  const selectedCategory = categoryFilterEl.value;
  const candidates = selectedCategory === "all"
    ? WORDS
    : WORDS.filter((entry) => entry.category === selectedCategory);
  const freshCandidates = candidates.filter((entry) => entry.word !== lastWord);
  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  lastWord = choice.word;
  return choice;
}

function populateCategoryFilter() {
  const categories = [...new Set(WORDS.map((entry) => entry.category))].sort((a, b) => a.localeCompare(b, "fr"));
  const selectedCategory = categoryFilterEl.value || "all";
  categoryFilterEl.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = categoryLabel("all");
  categoryFilterEl.appendChild(allOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = categoryLabel(category);
    categoryFilterEl.appendChild(option);
  });

  categoryFilterEl.value = [...categoryFilterEl.options].some((option) => option.value === selectedCategory)
    ? selectedCategory
    : "all";
}

function startGame() {
  const choice = chooseWord();
  currentWord = choice.word.toUpperCase();
  currentCategory = choice.category;
  guessedLetters = new Set();
  mistakes = 0;
  isFinished = false;

  categoryEl.textContent = categoryLabel(currentCategory);
  mistakesEl.textContent = mistakes;
  setMessage("ready");

  bodyParts.forEach((part) => part.classList.remove("visible"));
  renderWord();
  renderKeyboard();
}

function renderWord() {
  wordEl.innerHTML = "";
  wordEl.style.setProperty("--slot-count", currentWord.length);
  wordEl.style.setProperty("--letter-size", getLetterSize(currentWord.length));

  currentWord.split("").forEach((letter) => {
    const slot = document.createElement("span");
    const normalized = normalizeLetter(letter);
    slot.className = letter === " " ? "letter-slot space" : "letter-slot";
    slot.textContent = letter === " " || guessedLetters.has(normalized) ? letter : "";
    wordEl.appendChild(slot);
  });
}

function getLetterSize(letterCount) {
  if (letterCount >= 15) {
    return "1.05rem";
  }

  if (letterCount >= 13) {
    return "1.25rem";
  }

  if (letterCount >= 11) {
    return "1.55rem";
  }

  if (letterCount >= 9) {
    return "1.9rem";
  }

  return "2.4rem";
}

function renderKeyboard() {
  keyboardEl.innerHTML = "";

  LETTERS.forEach((letter) => {
    const key = document.createElement("button");
    key.className = "key";
    key.type = "button";
    key.textContent = letter;
    key.disabled = guessedLetters.has(letter) || isFinished;

    if (guessedLetters.has(letter)) {
      key.classList.add(currentWordIncludes(letter) ? "correct" : "wrong");
    }

    key.addEventListener("click", () => guess(letter));
    keyboardEl.appendChild(key);
  });
}

function currentWordIncludes(letter) {
  return currentWord.split("").some((char) => normalizeLetter(char) === letter);
}

function guess(letter) {
  if (isFinished || guessedLetters.has(letter)) {
    return;
  }

  guessedLetters.add(letter);

  if (currentWordIncludes(letter)) {
    setMessage("correct");
  } else {
    mistakes += 1;
    mistakesEl.textContent = mistakes;
    bodyParts[mistakes - 1]?.classList.add("visible");
    setMessage("wrong");
  }

  renderWord();
  checkGameState();
  renderKeyboard();
}

function checkGameState() {
  const won = currentWord
    .split("")
    .every((letter) => letter === " " || guessedLetters.has(normalizeLetter(letter)));

  if (won) {
    streak += 1;
    streakEl.textContent = streak;
    isFinished = true;
    setMessage("won", "won");
  }

  if (mistakes >= MAX_MISTAKES) {
    streak = 0;
    streakEl.textContent = streak;
    isFinished = true;
    revealWord();
    setMessage("lost", "lost");
  }
}

function revealWord() {
  currentWord.split("").forEach((letter) => {
    if (letter !== " ") {
      guessedLetters.add(normalizeLetter(letter));
    }
  });
  renderWord();
}

document.addEventListener("keydown", (event) => {
  const letter = normalizeLetter(event.key);
  if (LETTERS.includes(letter)) {
    guess(letter);
  }
});

newGameButton.addEventListener("click", startGame);
categoryFilterEl.addEventListener("change", () => {
  streak = 0;
  streakEl.textContent = streak;
  startGame();
});
document.addEventListener("siteLanguageChanged", () => {
  populateCategoryFilter();
  categoryEl.textContent = categoryLabel(currentCategory);
  newGameButton.setAttribute("aria-label", text("newGame"));
  newGameButton.setAttribute("title", text("newGame"));
  setMessage(currentMessageKey, messageEl.classList.contains("won") ? "won" : messageEl.classList.contains("lost") ? "lost" : "");
});

populateCategoryFilter();
startGame();
