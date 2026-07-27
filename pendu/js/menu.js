document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.main-nav');
    const menuToggle = document.getElementById('mainMenuToggle');
    const menuPanel = document.getElementById('mainMenuPanel');
    const themeToggle = document.getElementById('themeToggle');

    if (!nav || !menuToggle || !menuPanel) {
        return;
    }

    const UI_TEXT = {
        fr: {
            openMenu: 'Ouvrir le menu',
            closeMenu: 'Fermer le menu',
            menuTitle: 'Menu',
            languageSelector: 'Choix de la langue',
            switchToFrench: 'Passer le site en français',
            switchToEnglish: 'Passer le site en anglais'
        },
        en: {
            openMenu: 'Open menu',
            closeMenu: 'Close menu',
            menuTitle: 'Menu',
            languageSelector: 'Language selector',
            switchToFrench: 'Switch site to French',
            switchToEnglish: 'Switch site to English'
        }
    };

    const TITLE_FR_TO_EN = {
        'En classe': 'Classroom',
        'Minuteurs': 'Timers',
        'Groupes': 'Groups',
        'Mots Croisés': 'Crossword',
        'Mots croisés': 'Crossword',
        'Pendu': 'Hangman',
        'Notes': 'Notes',
        'Boutons': 'Buttons',
        'Lecture facile': 'Easy Reading',
        'Vidéo': 'Video',
        'Aide - Lecture facile': 'Help - Easy Reading',
        'Captures': 'Screenshots',
        'Signature Outlook': 'Outlook Signature'
    };

    const FR_TO_EN_EXACT = {
        'Navigation principale': 'Main navigation',
        'Onglets Groupes': 'Group tabs',
        "Retour à l'accueil": 'Back to home',
        'Accueil': 'Home',
        'En classe': 'Classroom',
        'Minuteurs': 'Timers',
        'Groupes': 'Groups',
        'Mots croisés': 'Crossword',
        'Mots Croisés': 'Crossword',
        'Pendu': 'Hangman',
        'Jeu de mots': 'Word game',
        'Nouvelle partie': 'New game',
        'Catégorie littéraire': 'Literary category',
        'Catégorie': 'Category',
        'Erreurs': 'Mistakes',
        'Série': 'Streak',
        'Clavier': 'Keyboard',
        'Toutes les catégories': 'All categories',
        'Boutons': 'Buttons',
        'Lecture': 'Reading',
        'Aide': 'Help',
        'Vidéo': 'Video',
        'Lecture facile': 'Easy Reading',
        'Aide - Lecture facile': 'Help - Easy Reading',
        'Réalisé avec': 'Made with',
        'par Yann Houry': 'by Yann Houry',
        'Soutenez': 'Support',
        'en faisant': 'by making',
        'ou en': 'or by',
        "m'offrant un": 'buying me',
        'Faire un don sur PayPal': 'Donate on PayPal',
        'Offrir un café via Buy Me a Coffee': 'Buy me a coffee via Buy Me a Coffee',
        'Notes sauvegardées': 'Notes saved',
        'Chargement de la météo...': 'Loading weather...',
        'Météo en cours...': 'Weather loading...',
        'Météo indisponible': 'Weather unavailable',
        'Calendrier': 'Calendar',
        'Replier le calendrier': 'Collapse calendar',
        'Déplier le calendrier': 'Expand calendar',
        'Horloge': 'Clock',
        "Replier l'horloge": 'Collapse clock',
        "Déplier l'horloge": 'Expand clock',
        "Afficher l'horloge analogique": 'Show analog clock',
        "Afficher l'horloge digitale": 'Show digital clock',
        'Minuteur': 'Timer',
        'Heures': 'Hours',
        'Minutes': 'Minutes',
        'Secondes': 'Seconds',
        'Démarrer': 'Start',
        'Réinitialiser': 'Reset',
        'Feu': 'Traffic light',
        'Silence complet': 'Complete silence',
        'Chuchotements autorisés': 'Whispering allowed',
        'Discussion autorisée': 'Discussion allowed',
        'Cliquez sur une lumière': 'Click a light',
        'Sélectionnez une lumière pour afficher les instructions': 'Select a light to show instructions',
        'Défense de parler': 'No talking',
        'Notes': 'Notes',
        'Replier les notes': 'Collapse notes',
        'Déplier les notes': 'Expand notes',
        'Indiquer vos notes': 'Type your notes',
        'Gras': 'Bold',
        'Italique': 'Italic',
        'Souligné': 'Underline',
        'Couleur du texte': 'Text color',
        'Liste à puces': 'Bullet list',
        'Liste numérotée': 'Numbered list',
        'Alignement à gauche': 'Align left',
        'Centrer': 'Center',
        'Alignement à droite': 'Align right',
        'Insérer une image': 'Insert an image',
        'Réduire la taille': 'Decrease size',
        'Augmenter la taille': 'Increase size',
        'Réduire la taille de police': 'Decrease font size',
        'Augmenter la taille de police': 'Increase font size',
        'Télécharger les notes': 'Download notes',
        'Effacer les notes': 'Clear notes',
        'Voulez-vous effacer toutes les notes ?': 'Do you want to clear all notes?',
        'Notes effacées': 'Notes cleared',
        'Rien à télécharger': 'Nothing to download',
        'Notes téléchargées': 'Notes downloaded',
        'Sauvegardé': 'Saved',
        'mot': 'word',
        'mots': 'words',
        'caractère': 'character',
        'Minuteurs multiples': 'Multiple timers',
        'Rappels': 'Reminders',
        'Replier les rappels': 'Collapse reminders',
        'Déplier les rappels': 'Expand reminders',
        'Ajouter un rappel...': 'Add a reminder...',
        'Ajouter un rappel': 'Add reminder',
        'Aucun rappel pour le moment.': 'No reminders for now.',
        'caractères': 'characters',
        'Lu': 'Mon',
        'Ma': 'Tue',
        'Me': 'Wed',
        'Je': 'Thu',
        'Ve': 'Fri',
        'Sa': 'Sat',
        'Di': 'Sun',
        'Voulez-vous réinitialiser votre localisation ?': 'Do you want to reset your location?',
        'Veuillez configurer un temps avant de démarrer le minuteur.': 'Please set a time before starting the timer.',
        'Localisation inconnue': 'Unknown location',
        'Ciel dégagé': 'Clear sky',
        'Partiellement nuageux': 'Partly cloudy',
        'Ciel couvert': 'Overcast sky',
        'Brouillard': 'Fog',
        'Bruine': 'Drizzle',
        'Pluie': 'Rain',
        'Neige': 'Snow',
        'Averses': 'Showers',
        'Averses de neige': 'Snow showers',
        'Orage': 'Thunderstorm',
        'Conditions variables': 'Variable conditions',
        'Démarrer tous les timers': 'Start all timers',
        'Arrêter tous les timers': 'Stop all timers',
        'Réinitialiser tous les timers': 'Reset all timers',
        "Cliquez pour changer l'état": 'Click to change state',
        'Roue': 'Wheel',
        'Nom': 'Name',
        'Liste': 'List',
        'Équipes': 'Teams',
        'Plan': 'Seating plan',
        'Mélanger': 'Shuffle',
        'Mélanger (R)': 'Shuffle (R)',
        'Modifier les noms': 'Edit names',
        'Noms': 'Names',
        'Copier': 'Copy',
        'Plein écran': 'Fullscreen',
        'Retirer ce nom': 'Remove this name',
        'Remélanger': 'Reshuffle',
        'Colonnes': 'Columns',
        'Lignes': 'Rows',
        'Appliquer': 'Apply',
        'Un nom par ligne :': 'One name per line:',
        'Annuler': 'Cancel',
        'Copié !': 'Copied!',
        'Erreur de copie': 'Copy error',
        'Code de partage': 'Share code',
        'Code de partage :': 'Share code:',
        'Nouveau Projet': 'New Project',
        'Collaborer': 'Collaborate',
        'Connexion...': 'Connecting...',
        'Synchronisation...': 'Syncing...',
        'Ajouter une colonne': 'Add a column',
        'Créer un nouveau projet': 'Create a new project',
        'Nom du projet': 'Project name',
        'Créer': 'Create',
        'Rejoindre un projet': 'Join a project',
        'Rejoindre': 'Join',
        'Ajouter': 'Add',
        'Importer': 'Import',
        'Mots': 'Words',
        'Effacer tout': 'Clear all',
        'Générer la grille': 'Generate grid',
        'Publier': 'Publish',
        'Imprimer': 'Print',
        'Direction du mot': 'Word direction',
        'Horizontal': 'Across',
        'Vertical': 'Down',
        'Ajouter une tâche': 'Add a task',
        'Aucune tâche': 'No tasks',
        'Partager': 'Share',
        'Effacer': 'Clear',
        'Guide des fonctionnalités': 'Feature guide',
        "Retour à l'application": 'Back to app',
        'Comment ça marche ?': 'How does it work?',
        'Découvrir toutes les fonctionnalités': 'Discover all features',
        "Copie et colle ton texte ci-dessous, puis ajuste les paramètres selon tes préférences. Tu peux modifier la police, la taille, les couleurs, l'espacement et même écouter le texte à voix haute.": 'Copy and paste your text below, then adjust the settings to your preferences. You can change the font, size, colors, spacing, and even listen to the text aloud.',
        'Colle ou écris directement ton texte dans la zone de saisie. Le compteur de caractères se met à jour en temps réel.': 'Paste or write your text directly in the input area. The character counter updates in real time.',
        'Copie le contenu de la zone de texte dans le presse-papiers.': 'Copy the text area content to the clipboard.',
        "Génère un lien de partage contenant ton texte et tous tes réglages. Idéal pour envoyer un texte déjà mis en forme à quelqu'un.": 'Generate a share link containing your text and all your settings. Ideal for sending someone a pre-formatted text.',
        'Supprime tout le contenu de la zone de texte.': 'Delete all content from the text area.',
        'Sélectionne du texte pour faire apparaître la barre de formatage. Elle te permet de mettre en forme ton texte rapidement.': 'Select text to display the formatting toolbar. It lets you format your text quickly.',
        'Applique une mise en forme au texte sélectionné. Raccourcis :': 'Apply formatting to selected text. Shortcuts:',
        'Transforme le texte sélectionné en titre mis en évidence.': 'Turn selected text into a highlighted heading.',
        'Crée une liste à puces ou une liste numérotée à partir du texte sélectionné.': 'Create a bullet list or a numbered list from selected text.',
        'Change la couleur du texte sélectionné grâce au sélecteur de couleurs.': 'Change the color of selected text using the color picker.',
        'Supprime toute la mise en forme du texte sélectionné pour revenir au style par défaut.': 'Remove all formatting from selected text to return to the default style.',
        'Annule ou rétablit la dernière action. Raccourcis :': 'Undo or redo the last action. Shortcuts:',
        'Lance la synthèse vocale de ton texte. Appuie à nouveau pour mettre en pause ou reprendre la lecture.': 'Start text-to-speech for your text. Press again to pause or resume playback.',
        'Arrête complètement la lecture audio et revient au début.': 'Stop audio playback completely and return to the beginning.',
        'Ajuste la vitesse de lecture de 0,5x (lente) à 2x (rapide). La valeur par défaut est 1x.': 'Adjust reading speed from 0.5x (slow) to 2x (fast). Default is 1x.',
        'Sélectionne la langue de la voix parmi 7 langues disponibles : français, anglais (US/UK), espagnol, allemand, italien et portugais.': 'Select the voice language from 7 available languages: French, English (US/UK), Spanish, German, Italian, and Portuguese.',
        'Choisis parmi 9 polices dont OpenDyslexic (conçue pour les dyslexiques) et Luciole (conçue pour les malvoyants).': 'Choose from 9 fonts, including OpenDyslexic (designed for dyslexic readers) and Luciole (designed for low vision).',
        'Ajuste la taille du texte de 12px à 48px pour un meilleur confort de lecture.': 'Adjust text size from 12px to 48px for better reading comfort.',
        "Augmente l'espace entre chaque lettre (de 0 à 10px). Un espacement plus grand aide à distinguer les lettres similaires.": 'Increase spacing between letters (from 0 to 10px). Greater spacing helps distinguish similar letters.',
        "Contrôle l'espace entre les lignes de texte (de 1 à 3). Un interligne plus grand facilite le suivi des lignes.": 'Control spacing between text lines (from 1 to 3). Greater line spacing makes lines easier to follow.',
        "Personnalise la couleur du texte et de l'arrière-plan avec les sélecteurs de couleurs.": 'Customize text and background color with the color pickers.',
        '5 thèmes de couleurs prédéfinis optimisés pour le confort visuel :': '5 preset color themes optimized for visual comfort:',
        'Active le mode sombre global via le bouton dans le menu. Réduit la fatigue oculaire dans les environnements peu éclairés.': 'Enable global dark mode via the menu button. Reduces eye strain in low-light environments.',
        "Met en gras le début de chaque mot pour guider l'œil et accélérer la lecture. Le cerveau complète automatiquement la fin des mots.": 'Bold the beginning of each word to guide the eye and speed up reading. The brain automatically completes the end of words.',
        'Alterne les couleurs de fond entre les lignes de texte. Aide à ne pas perdre sa ligne pendant la lecture.': 'Alternate background colors between text lines. Helps keep your place while reading.',
        'Affiche une bande horizontale qui suit la souris pour isoler la ligne en cours de lecture. Les zones au-dessus et en dessous sont assombries.': 'Display a horizontal band that follows the mouse to isolate the current reading line. Areas above and below are dimmed.',
        'Clique sur un mot pour voir sa définition. Les définitions sont récupérées depuis le Wiktionnaire français.': 'Click a word to see its definition. Definitions are fetched from French Wiktionary.',
        'Ouvre le texte en plein écran sans distraction. La règle de lecture est disponible dans ce mode. Appuie sur': 'Open the text in full screen with no distractions. The reading ruler is available in this mode. Press',
        'Échap': 'Escape',
        'pour quitter.': 'to exit.',
        "Enregistre tous tes réglages actuels (police, taille, couleurs, options d'accessibilité). Ils seront restaurés automatiquement à ta prochaine visite.": 'Save all your current settings (font, size, colors, accessibility options). They will be restored automatically on your next visit.',
        'Remet tous les réglages à leurs valeurs par défaut (police Arial, taille 18px, fond crème).': 'Reset all settings to default values (Arial font, 18px size, cream background).',
        "Tes préférences sont sauvegardées localement dans ton navigateur. Elles ne sont pas partagées avec d'autres appareils.": 'Your preferences are saved locally in your browser. They are not shared with other devices.',
        'Ton texte': 'Your text',
        'Lecture audio': 'Read aloud',
        'Lecture / Pause': 'Play / Pause',
        'Arrêter': 'Stop',
        'Vitesse': 'Speed',
        'Langue': 'Language',
        'Typographie': 'Typography',
        'Police': 'Font',
        'Taille': 'Size',
        'Espacement des lettres': 'Letter spacing',
        'Espacement lettres': 'Letter spacing',
        'Interligne': 'Line spacing',
        'Couleurs': 'Colors',
        'Texte': 'Text',
        'Fond': 'Background',
        'Thèmes recommandés': 'Recommended themes',
        'Mode sombre': 'Dark mode',
        'Accessibilité': 'Accessibility',
        'Lecture bionique': 'Bionic reading',
        'Surligner les lignes': 'Highlight lines',
        'Règle de lecture': 'Reading ruler',
        'Définitions': 'Definitions',
        'Mode concentration': 'Focus mode',
        'Préférences': 'Preferences',
        'Sauvegarder': 'Save',
        'Réinitialiser': 'Reset',
        'Éditeur de texte': 'Text editor',
        'Zone de texte': 'Text area',
        'Formatage du texte': 'Text formatting',
        'Barre de formatage': 'Formatting toolbar',
        'Gras, Italique, Souligné': 'Bold, Italic, Underline',
        'Titre': 'Heading',
        'Listes': 'Lists',
        'Effacer le formatage': 'Clear formatting',
        'Annuler / Rétablir': 'Undo / Redo',
        'Couleur du texte et du fond': 'Text and background color',
        'URL ou texte à encoder': 'URL or text to encode',
        'Contenu': 'Content',
        'Générer le QR Code': 'Generate QR code',
        'Cadre & Texte': 'Frame & Text',
        'Formes': 'Shapes',
        'Paramètres': 'Settings',
        'Fond transparent': 'Transparent background',
        'Couleur de fond': 'Background color',
        'Utiliser un dégradé': 'Use gradient',
        'Linéaire': 'Linear',
        'Radial': 'Radial',
        'Deuxième couleur': 'Second color',
        'Couleur du QR Code': 'QR code color',
        'Ajouter un cadre': 'Add frame',
        'Texte du cadre': 'Frame text',
        'Couleur du cadre': 'Frame color',
        'Icônes de réseaux sociaux': 'Social media icons',
        'Couleur des icônes': 'Icon color',
        'Taille du logo': 'Logo size',
        'Fond derrière le logo': 'Background behind logo',
        'Taille (pixels)': 'Size (pixels)',
        "Correction d'erreur": 'Error correction',
        'Marge': 'Margin',
        'Style des modules': 'Module style',
        'Style des marqueurs (coins)': 'Corner marker style',
        'Couleur des marqueurs': 'Marker color',
        'Cliquez ou glissez une image': 'Click or drag an image',
        'Entrez une URL et cliquez sur Générer': 'Enter a URL and click Generate',
        'Scannez-moi !': 'Scan me!',
        'Nom du fichier': 'File name',
        'Importer une liste': 'Import a list',
        'Ajouter un mot': 'Add a word',
        'Mot': 'Word',
        'Définition': 'Definition',
        'Direction': 'Direction',
        "Aucun mot pour l'instant": 'No words yet',
        'Grille': 'Grid',
        'Solution': 'Solution',
        'Fond grille': 'Grid background',
        "Couleur de l'arrière-plan de la grille": 'Grid background color',
        "Choisir la couleur d'arrière-plan de la grille": 'Choose the grid background color',
        'En ligne :': 'Online:',
        'Copier le lien': 'Copy link',
        'Ajoutez des mots': 'Add words',
        'et générez la grille': 'and generate the grid',
        'Horizontalement': 'Across',
        'Verticalement': 'Down',
        'Importer des mots': 'Import words',
        'Fermer': 'Close',
        'Zone de dépôt de fichier': 'File drop area',
        'Parcourir': 'Browse',
        'ou': 'or',
        'Collez votre liste': 'Paste your list',
        'Formats acceptés': 'Accepted formats',
        'Formats acceptés : .md, .txt et .csv.': 'Accepted formats: .md, .txt and .csv.',
        'Texte et réglages chargés depuis le lien': 'Text and settings loaded from link',
        'Erreur lors du chargement du texte': 'Error while loading text',
        'Texte chargé (réglages non disponibles)': 'Text loaded (settings unavailable)',
        'Texte chargé depuis le lien': 'Text loaded from link',
        'Aucun texte à partager': 'No text to share',
        'Texte trop long pour être partagé via URL': 'Text is too long to share via URL',
        'Erreur lors de la génération du lien': 'Error while generating the link',
        'Texte effacé': 'Text cleared',
        'Texte copié !': 'Text copied!',
        'Erreur lors de la copie': 'Copy error',
        'Lien copié ! Collez-le pour le partager.': 'Link copied! Paste it to share.',
        'Thème appliqué': 'Theme applied',
        'Paramètres réinitialisés': 'Settings reset',
        'Préférences sauvegardées !': 'Preferences saved!',
        'Sauvegarder mes préférences': 'Save my preferences',
        "La synthèse vocale n'est pas supportée": 'Speech synthesis is not supported',
        'Définition non trouvée pour ce mot.': 'Definition not found for this word.',
        "Impossible de charger cette icone pour l'instant.": "Unable to load this icon right now.",
        'Le fichier est trop volumineux (max 2MB)': 'The file is too large (max 2MB)',
        'Aucun': 'None',
        'Impossible de placer les mots.': 'Unable to place the words.',
        "Générez d’abord une grille.": 'Generate a grid first.',
        'La publication en ligne nécessite l’application hébergée sur le site.': 'Online publishing requires the hosted app.',
        'Grille publiee en ligne.': 'Grid published online.',
        'Vérifier': 'Check',
        'Révéler la solution': 'Reveal solution',
        'Cliquez sur une définition ou une case pour commencer.': 'Click a clue or cell to start.',
        'Grille de mots croisés': 'Crossword grid',
        'Astuce: utilisez les flèches du clavier pour naviguer et cliquez une deuxième fois sur une case croisée pour changer de direction.': 'Tip: use arrow keys to navigate and click a crossed cell again to change direction.',
        'Remplissez au moins une case avant de vérifier.': 'Fill at least one cell before checking.',
        'Grille complète et correcte.': 'Grid complete and correct.',
        'Grille réinitialisée.': 'Grid reset.',
        'Solution affichée.': 'Solution shown.',
        'Approuvé': 'Approved',
        'Afficher les boutons': 'Show buttons',
        'Applaudissements': 'Applause',
        'Quand un élève donne une excellente réponse, fait des efforts et montre de la bonne volonté.': 'When a student provides an excellent answer, makes an effort, shows good will.',
        'Très bien': 'Very good',
        'Quand un élève donne une bonne réponse, fait des efforts et montre de la bonne volonté.': 'When a student provides a good answer, makes an effort, shows good will.',
        "Quand un élève réussit très bien ou fait quelque chose d'inattendu mais de positif.": 'When a student performs very well, is successful or does something unexpected but positive.',
        'Bravo': 'Congrats',
        "Féliciter un ou plusieurs élèves pour ce qu'ils ont accompli.": 'Congrats one or several students for what they have accomplished.',
        'Youhou': 'Yeeha',
        'Une démonstration joyeuse pour soutenir ou encourager les élèves.': 'Any cheerful demonstration of joy to support or encourage students.',
        'Waouh': 'WOW',
        'Cet élève a été incroyable ! Vous êtes impressionné !': 'This student has been amazing! You are in awe!',
        'Désapprouvé': 'Unapproved',
        'Oh non !': 'Oh no!',
        "Exprimer avec humour que la réponse est fausse (et que ce n'est pas grave).": "Express in a funny way that the answer is wrong (and that's OK).",
        'Avertissement': 'Warning',
        'Avertir vos élèves que quelque chose va se passer.': 'Warn your students that something is going to happen.',
        'Rire démoniaque': 'Evil laugh',
        'Montrer à vos élèves votre côté démoniaque avant de leur donner une tâche difficile.': 'Show your students how demonic you are before assigning them a challenging task.',
        'Mais enfin ?': 'What the hell',
        "Exprimer votre surprise (et qu'il faut se remettre au travail).": 'Express how surprised you are (and that we need to go back to work).',
        'Ronflement': 'Snore',
        '"Mon Dieu, à quoi ressemble ton drôle de petit cerveau ? Ça doit être tellement ennuyeux" (Sherlock Holmes)': '"Dear God, what is it like in your funny little brain? It must be so boring" (Sherlock Holmes)',
        'Ayez foi': 'Have faith',
        '"Je trouve votre manque de foi affligeant." (Darth Vader)': '"I find your lack of faith disturbing." (Darth Vader)',
        'Sons': 'Sounds',
        "J'ai le regret de vous informer que la réponse que vous venez de donner est malheureusement fausse.": 'I regret to inform you that the answer you have just given me is unfortunately wrong.',
        'Sifflet': 'Whistle',
        "C'est une urgence. Pas le temps de discuter. Il faut travailler.": 'This is an emergency. No time to argue. Work has to be done.',
        'Cloche': 'Bell',
        "Cela peut être le signal d'un défi ou d'une discussion de groupe.": 'This could be the sound of a challenge or of a group discussion.',
        '3,2,1 Partez !': '3,2,1 Go',
        "C'est le début de la course. Le temps tourne !": "This is the beginning of the race. Clock's ticking!",
        'Terminé': 'Game Over',
        'On arrête tout ! Le temps est écoulé ! Rendez votre travail.': "Stop everything! Time's up! Hand over your work.",
        'Silence, les élèves ! Il est temps de revenir à la tâche et de se concentrer !': "Quiet, students! It's time to get back to the task in hand and focus!",
        'Déçu': 'Disappointed',
        'La déception mène à un nouvel effort. Ne vous découragez pas !': "Disappointment leads to a new effort. Don't beat yourself up!",
        'Alerte info': 'Breaking News',
        'Annonce spéciale ! Écoutez attentivement ce que votre professeur va révéler !': 'Special announcements! Pay attention to what your teacher is about to reveal!',
        'Au travail': 'Back to work',
        "J'espère que vous avez bien profité de votre pause méritée et que vous êtes prêts à vous remettre au travail. Enfin !": 'I hope you enjoyed your well-deserved break and are ready to get back to work. At long last!',
        "C'est assez explicite : on arrête tout !": "That's pretty self-explanatory: stop everything!",
        'Musique inquiétante': 'Ominous Music',
        'Violon triste': 'Sad violin',
        "C'est triste, mais même si c'est difficile, ne désespérez pas.": "It's sad, but even if it's difficult, don't despair.",
        'Marche impériale': 'Imperial March',
        "C'est le son de l'évaluation. Préparez-vous.": "That's the sound of evaluation. Get ready for it.",
        'Cantina Star Wars': 'Star Wars Cantina',
        'Faites attention. Les apparences peuvent être trompeuses, alors méfiez-vous.': 'Be careful. Appearances can be deceiving, so beware.',
        'Psychose': 'Psycho',
        "Danger ! Préparez-vous ! Cela peut être n'importe quoi : une question difficile, une évaluation, etc.": 'Danger! Brace yourself! It can be anything: a tough question, an assessment, etc.',
        'Les Dents de la mer': 'Jaws',
        "Danger imminent ! Ne bougez pas, restez où vous êtes, n'approchez pas du professeur !": 'Imminent danger! Stand still, stay where you are, do not go near teacher!',
        "C'est la catastrophe ! Il est temps de réagir !": "It's a disaster! It's time to do something about it!",
        'Célébrer': 'Celebrate',
        'Ode à la joie': 'Ode to Joy',
        "C'est assez simple. Célébrons le travail accompli.": "This is pretty straightforward. Let's celebrate the work we've done.",
        'Alléluia': 'Hallelujah',
        'Le travail paie ! Cet élève a enfin trouvé son chemin dans le labyrinthe des connaissances !': 'Hard work pays off! This student has finally found her/his way through the maze of knowledge!',
        'Joyeux anniversaire': 'Happy birthday',
        "Prenons un moment pour célébrer et dire combien nous sommes heureux d'être ensemble.": "Let's take some time to celebrate and how happy we are to be together.",
        'Je suis heureux': "I'm happy",
        'Exprimez votre joie face aux résultats de vos élèves. Ils méritent des applaudissements.': "Express your delight at your students' results. They deserve a round of applause.",
        'Le son de la gloire. Vous le méritez ! Vous avez assuré !': 'The sound of fame. You deserve it! You nailed it!',
        'Français': 'French',
        'Español': 'Spanish',
        'Deutsch': 'German',
        'Italiano': 'Italian',
        'Português': 'Portuguese',
        'Crème': 'Cream',
        'Bleu clair': 'Light blue',
        'Vert clair': 'Light green',
        'Lavande': 'Lavender',
        'Sombre': 'Dark',
        'Copiez ce lien :': 'Copy this link:',
        'Recherche…': 'Searching...',
        'Carré': 'Square',
        'L - Faible (7%)': 'L - Low (7%)',
        'M - Moyenne (15%)': 'M - Medium (15%)',
        'Q - Élevée (25%)': 'Q - High (25%)',
        'H - Maximale (30%)': 'H - Maximum (30%)',
        'Glissez un fichier ici': 'Drag a file here',
        'ex. École genevoise renommée': 'e.g. Renowned Geneva school',
        'Ajoute un cadre Apple à tes captures iPhone ou iPad, puis exporte en PNG.': 'Add an Apple frame to your iPhone or iPad screenshots, then export as PNG.',
        'Réglages': 'Settings',
        "Capture d'écran": 'Screenshot',
        'Cadre': 'Frame',
        'Chargement des cadres...': 'Loading frames...',
        'Détection auto': 'Auto detect',
        'Arrière-plan': 'Background',
        'Uni': 'Solid',
        'Marge externe': 'Outer margin',
        'Couleur unie': 'Solid color',
        'Gradient - couleur 1': 'Gradient - color 1',
        'Gradient - couleur 2': 'Gradient - color 2',
        'Angle du gradient': 'Gradient angle',
        'Télécharger le PNG': 'Download PNG',
        'Chargement des informations de cadres...': 'Loading frame information...',
        'Aperçu': 'Preview',
        'Aperçu du rendu avec cadre': 'Framed render preview',
        'Charge une capture pour generer le rendu': 'Upload a screenshot to generate the render',
        'Impossible de charger les assets du cadre selectionne.': 'Unable to load the selected frame assets.',
        'Echec du chargement de la capture. Reessaie avec un autre fichier image.': 'Failed to load the screenshot. Try another image file.',
        'Blob vide': 'Empty blob',
        'Le navigateur a bloque le telechargement direct. Image ouverte dans un nouvel onglet.': 'The browser blocked direct download. Image opened in a new tab.',
        'Export bloque par le navigateur. Essaie via un serveur local: python3 -m http.server 8000': 'Export blocked by the browser. Try a local server: python3 -m http.server 8000',
        'Impossible de lire les donnees de cadres. Ouvre index.html tel quel ou lance un serveur local.': 'Unable to read frame data. Open index.html as is or run a local server.',
        'Aucun cadre valide trouve dans le dossier Frames.': 'No valid frame found in the Frames folder.',
        'Preparation du catalogue de cadres...': 'Preparing frame catalog...',
        'Vos informations': 'Your information',
        'Prénom et Nom': 'First and last name',
        'Prénom et nom': 'First and last name',
        'Fonction / Titre': 'Role / Title',
        'Fonction ou titre': 'Role or title',
        'Téléphone': 'Phone',
        'Site web': 'Website',
        'Copier la signature': 'Copy signature',
        'Commencez à saisir vos informations…': 'Start entering your information...',
        'Comment utiliser :': 'How to use:',
        'Générateur de signature email — Institut Florimont': 'Email signature generator — Institut Florimont',
        'Cordialement,': 'Kind regards,',
        'Tél. :': 'Phone:',
        'Cliquez sur « Copier la signature », puis dans Outlook : Fichier → Options → Courrier → Signatures → Nouvelle signature → collez avec Ctrl+V.': 'Click "Copy signature", then in Outlook: File -> Options -> Mail -> Signatures -> New signature -> paste with Ctrl+V.',
        'Partager une vidéo': 'Share a video',
        'Collez le lien': 'Paste the link',
        "Ajoutez l'URL de la vidéo.": 'Add the video URL.',
        'Ajoutez un titre': 'Add a title',
        'Optionnel, avec une courte consigne.': 'Optional, with a short instruction.',
        'Copiez le lien élève': 'Copy the student link',
        'Le lecteur est prêt à être partagé.': 'The player is ready to be shared.',
        'Lien élève': 'Student link',
        'Lien': 'Link',
        'Titre': 'Title',
        'Consigne': 'Instructions',
        'Afficher la vidéo': 'Show video',
        'Copier le lien élève': 'Copy student link',
        'Lien généré': 'Generated link',
        'Le lien apparaîtra ici': 'The link will appear here',
        'Départ immédiat': 'Starts immediately',
        'Lecteur vidéo intégré': 'Embedded video player',
        'Aperçu': 'Preview',
        'Lien invalide.': 'Invalid link.',
        'Lien prêt.': 'Link ready.',
        'Aucun lien.': 'No link.',
        'Lien copié.': 'Link copied.',
        'Copie impossible.': 'Copy failed.'
    };

    const FR_TO_EN_REGEX = [
        [/^Description de l'activité (\d+)$/u, 'Activity $1 description'],
        [/^Équipe (\d+)$/u, 'Team $1'],
        [/^(\d+) mot(s?) importé(s?) !$/u, '$1 word$2 imported!'],
        [/^(\d+) mot(s?) détecté(s?) — (\d+) horizontal(aux?)?, (\d+) vertical(aux?)?$/u, '$1 word$2 detected - $4 across, $6 down'],
        [/^(\d+) mot(s?) sans intersection — placé(s?) séparément\.$/u, '$1 word$2 without intersection - placed separately.'],
        [/^Supprimer (.+)$/u, 'Delete $1'],
        [/^Lire le son (\d+)$/u, 'Play Audio $1'],
        [/^Impossible de charger (.+)$/u, 'Unable to load $1'],
        [/^Cadre detecte : (.+) \((\d+) x (\d+)\) — (\d+) cadre\(s\) compatible\(s\)$/u, 'Detected frame: $1 ($2 x $3) - $4 compatible frame(s)'],
        [/^Detection approx : (.+) — (\d+) cadre\(s\) compatible\(s\)$/u, 'Approximate detection: $1 - $2 compatible frame(s)'],
        [/^(\d+) cadre\(s\) compatible\(s\) avec cette capture \((\d+) x (\d+)\)$/u, '$1 compatible frame(s) with this screenshot ($2 x $3)'],
        [/^Capture chargee \((\d+) x (\d+)\)\. (\d+) cadre\(s\) compatible\(s\)\.$/u, 'Screenshot loaded ($1 x $2). $3 compatible frame(s).'],
        [/^Cadre actif: (.+)$/u, 'Active frame: $1'],
        [/^PNG exporte: (.+)$/u, 'PNG exported: $1'],
        [/^(\d+) cadres charges\. Tu peux importer une capture\.$/u, '$1 frames loaded. You can import a screenshot.'],
        [/^Detection auto active : (.+)$/u, 'Auto detection enabled: $1'],
        [/^Départ à (.+)$/u, 'Starts at $1']
    ];

    const FR_TO_EN_FRAGMENTS = [
        ['Janvier', 'January'],
        ['Février', 'February'],
        ['Mars', 'March'],
        ['Avril', 'April'],
        ['Mai', 'May'],
        ['Juin', 'June'],
        ['Juillet', 'July'],
        ['Août', 'August'],
        ['Septembre', 'September'],
        ['Octobre', 'October'],
        ['Novembre', 'November'],
        ['Décembre', 'December'],
        ['lundi', 'monday'],
        ['mardi', 'tuesday'],
        ['mercredi', 'wednesday'],
        ['jeudi', 'thursday'],
        ['vendredi', 'friday'],
        ['samedi', 'saturday'],
        ['dimanche', 'sunday'],
        ['LUNDI', 'MONDAY'],
        ['MARDI', 'TUESDAY'],
        ['MERCREDI', 'WEDNESDAY'],
        ['JEUDI', 'THURSDAY'],
        ['VENDREDI', 'FRIDAY'],
        ['SAMEDI', 'SATURDAY'],
        ['DIMANCHE', 'SUNDAY'],
        ["Réalisé avec", 'Made with'],
        ['Soutenez', 'Support'],
        ['en faisant', 'by making'],
        [' ou en ', ' or by '],
        ["m'offrant un", 'buying me'],
        ['un don sur', 'a donation on'],
        ['Chargement de la météo...', 'Loading weather...'],
        ['Météo en cours...', 'Weather loading...'],
        ['Météo indisponible', 'Weather unavailable'],
        ['École genevoise renommée', 'Renowned Geneva school'],
        ['Récit de fiction', 'Fiction narrative'],
        ['Action de lire', 'Act of reading'],
        ['Texte en vers', 'Text in verse']
    ];

    const textNodeOriginalMap = new WeakMap();
    const directTextNodeOriginalMap = new WeakMap();
    const attrOriginalMap = new WeakMap();
    let isApplyingTranslations = false;
    let translationObserver = null;

    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalizeLang = (lang) => lang === 'en' ? 'en' : 'fr';
    const getStoredLanguage = () => normalizeLang(localStorage.getItem('site_lang') || localStorage.getItem('kanban_lang') || 'fr');
    const ui = (lang, key) => UI_TEXT[normalizeLang(lang)][key];

    const isKanbanPage = () => window.location.pathname.endsWith('/kanban.html') || window.location.pathname.endsWith('kanban.html');

    const shouldSkipElement = (element) => {
        if (!element) return true;
        if (element.closest('script, style, noscript, textarea, code, pre')) return true;
        if (element.closest('[contenteditable="true"]')) return true;
        if (isKanbanPage() && element.closest('.k-app, .k-modal, .k-share-code-fixed')) return true;
        return false;
    };

    const translateFrenchToEnglishCore = (text) => {
        if (!text) return text;
        if (FR_TO_EN_EXACT[text]) return FR_TO_EN_EXACT[text];
        const normalizedText = text.replace(/\s+/gu, ' ').trim();
        if (FR_TO_EN_EXACT[normalizedText]) return FR_TO_EN_EXACT[normalizedText];

        let translated = text;
        for (const [pattern, replacement] of FR_TO_EN_REGEX) {
            translated = translated.replace(pattern, replacement);
        }

        for (const [fr, en] of FR_TO_EN_FRAGMENTS) {
            if (translated.includes(fr)) {
                translated = translated.replace(new RegExp(escapeRegExp(fr), 'g'), en);
            }
        }
        return translated;
    };

    const translatePreservingWhitespace = (text, lang) => {
        if (lang !== 'en' || typeof text !== 'string' || text.length === 0) {
            return text;
        }

        const leading = text.match(/^\s*/u)?.[0] || '';
        const trailing = text.match(/\s*$/u)?.[0] || '';
        const core = text.slice(leading.length, text.length - trailing.length);
        if (!core) return text;
        return `${leading}${translateFrenchToEnglishCore(core)}${trailing}`;
    };

    const translateTextNode = (node, lang, mutationDriven = false) => {
        if (!node) return;
        const parent = node.parentElement || node.parentNode;
        if (!parent || shouldSkipElement(parent)) return;

        if (lang === 'fr') {
            if (textNodeOriginalMap.has(node)) {
                const original = textNodeOriginalMap.get(node);
                if (node.nodeValue !== original) {
                    node.nodeValue = original;
                }
            }
            return;
        }

        if (!textNodeOriginalMap.has(node)) {
            textNodeOriginalMap.set(node, node.nodeValue);
        } else if (mutationDriven) {
            const storedOriginal = textNodeOriginalMap.get(node);
            const expectedTranslated = translatePreservingWhitespace(storedOriginal, lang);
            if (node.nodeValue !== storedOriginal && node.nodeValue !== expectedTranslated) {
                textNodeOriginalMap.set(node, node.nodeValue);
            }
        }

        const original = textNodeOriginalMap.get(node);
        const translated = translatePreservingWhitespace(original, lang);
        if (node.nodeValue !== translated) {
            node.nodeValue = translated;
        }
    };

    const translateElementAttributes = (element, lang, mutationDriven = false) => {
        if (!element || shouldSkipElement(element)) return;

        const attrs = ['title', 'aria-label', 'placeholder', 'alt'];
        if (!attrOriginalMap.has(element)) {
            attrOriginalMap.set(element, {});
        }
        const originalAttrs = attrOriginalMap.get(element);

        attrs.forEach((attr) => {
            if (!element.hasAttribute(attr)) return;

            if (originalAttrs[attr] === undefined) {
                originalAttrs[attr] = element.getAttribute(attr);
            } else if (mutationDriven) {
                const currentAttrValue = element.getAttribute(attr);
                const expectedTranslated = translatePreservingWhitespace(originalAttrs[attr], lang);
                if (currentAttrValue !== originalAttrs[attr] && currentAttrValue !== expectedTranslated) {
                    originalAttrs[attr] = currentAttrValue;
                }
            }

            if (lang === 'fr') {
                if (element.getAttribute(attr) !== originalAttrs[attr]) {
                    element.setAttribute(attr, originalAttrs[attr]);
                }
            } else {
                const translatedAttr = translatePreservingWhitespace(originalAttrs[attr], lang);
                if (element.getAttribute(attr) !== translatedAttr) {
                    element.setAttribute(attr, translatedAttr);
                }
            }
        });
    };

    const translateSubtree = (root, lang, mutationDriven = false) => {
        if (!root) return;

        if (root.nodeType === Node.TEXT_NODE) {
            translateTextNode(root, lang, mutationDriven);
            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE) return;
        const element = root;

        translateElementAttributes(element, lang, mutationDriven);
        if (shouldSkipElement(element)) return;

        const textWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let currentTextNode = textWalker.nextNode();
        while (currentTextNode) {
            translateTextNode(currentTextNode, lang, mutationDriven);
            currentTextNode = textWalker.nextNode();
        }

        element.querySelectorAll('[title], [aria-label], [placeholder], [alt]').forEach((el) => {
            translateElementAttributes(el, lang, mutationDriven);
        });
    };

    const applyTitleTranslation = (lang) => {
        const titleEl = document.querySelector('title');
        if (!titleEl) return;

        if (!titleEl.dataset.frTitle) {
            titleEl.dataset.frTitle = titleEl.textContent.trim();
        }
        const frTitle = titleEl.dataset.frTitle;

        if (lang === 'fr') {
            titleEl.textContent = frTitle;
            return;
        }

        titleEl.textContent = TITLE_FR_TO_EN[frTitle] || translateFrenchToEnglishCore(frTitle);
    };

    const applyDirectTextPass = (lang) => {
        const targets = document.querySelectorAll('p, h1, h2, h3, label, button, a, span, option, summary, legend');

        targets.forEach((element) => {
            if (shouldSkipElement(element)) return;

            element.childNodes.forEach((node) => {
                if (node.nodeType !== Node.TEXT_NODE) return;

                if (lang === 'fr') {
                    const original = textNodeOriginalMap.get(node) ?? directTextNodeOriginalMap.get(node);
                    if (original !== undefined && original !== null) {
                        if (node.nodeValue !== original) {
                            node.nodeValue = original;
                        }
                    }
                    return;
                }

                if (!directTextNodeOriginalMap.has(node)) {
                    directTextNodeOriginalMap.set(node, textNodeOriginalMap.get(node) ?? node.nodeValue);
                }

                const original = directTextNodeOriginalMap.get(node);
                const translated = translatePreservingWhitespace(original, lang);
                if (node.nodeValue !== translated) {
                    node.nodeValue = translated;
                }
            });
        });
    };

    const updateLanguageSelectorLabels = (lang) => {
        const selector = document.querySelector('.main-nav-lang-selector');
        if (selector) {
            selector.setAttribute('aria-label', ui(lang, 'languageSelector'));
        }

        const frBtn = document.getElementById('btn-lang-fr');
        const enBtn = document.getElementById('btn-lang-en');
        if (frBtn) {
            frBtn.setAttribute('title', ui(lang, 'switchToFrench'));
            frBtn.setAttribute('aria-label', ui(lang, 'switchToFrench'));
        }
        if (enBtn) {
            enBtn.setAttribute('title', ui(lang, 'switchToEnglish'));
            enBtn.setAttribute('aria-label', ui(lang, 'switchToEnglish'));
        }
    };

    const setupTranslationObserver = (lang) => {
        if (translationObserver) {
            translationObserver.disconnect();
            translationObserver = null;
        }

        if (lang !== 'en' || !document.body) {
            return;
        }

        translationObserver = new MutationObserver((mutations) => {
            if (isApplyingTranslations) return;

            isApplyingTranslations = true;
            try {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'characterData') {
                        translateTextNode(mutation.target, 'en', true);
                    } else if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => translateSubtree(node, 'en', true));
                    }
                });
            } finally {
                isApplyingTranslations = false;
            }
        });

        translationObserver.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    };

    const applySiteTranslations = (lang) => {
        const normalizedLang = normalizeLang(lang);
        isApplyingTranslations = true;

        try {
            applyTitleTranslation(normalizedLang);
            translateSubtree(document.body, normalizedLang);
            applyDirectTextPass(normalizedLang);
            updateLanguageSelectorLabels(normalizedLang);

            if (typeof window.refreshThemeToggleLabel === 'function') {
                window.refreshThemeToggleLabel();
            }
        } finally {
            isApplyingTranslations = false;
        }

        setupTranslationObserver(normalizedLang);
    };

    if (!window.__siteI18nDialogPatch) {
        const nativeAlert = window.alert.bind(window);
        const nativeConfirm = window.confirm.bind(window);
        const nativePrompt = window.prompt.bind(window);

        window.alert = (message) => {
            const lang = getStoredLanguage();
            nativeAlert(lang === 'en' ? translateFrenchToEnglishCore(String(message)) : String(message));
        };

        window.confirm = (message) => {
            const lang = getStoredLanguage();
            return nativeConfirm(lang === 'en' ? translateFrenchToEnglishCore(String(message)) : String(message));
        };

        window.prompt = (message, defaultValue) => {
            const lang = getStoredLanguage();
            const translatedMessage = lang === 'en' ? translateFrenchToEnglishCore(String(message)) : String(message);
            return nativePrompt(translatedMessage, defaultValue);
        };

        window.__siteI18nDialogPatch = true;
    }

    const syncLanguageButtons = (lang) => {
        document.querySelectorAll('.btn-lang').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    };

    const setMenuA11yLabels = (isOpen, lang) => {
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? ui(lang, 'closeMenu') : ui(lang, 'openMenu'));
        menuToggle.setAttribute('title', ui(lang, 'menuTitle'));
    };

    const setLanguageState = (lang) => {
        const normalizedLang = normalizeLang(lang);
        localStorage.setItem('site_lang', normalizedLang);
        localStorage.setItem('kanban_lang', normalizedLang);
        document.documentElement.lang = normalizedLang;
        syncLanguageButtons(normalizedLang);
        applySiteTranslations(normalizedLang);
        setMenuA11yLabels(nav.classList.contains('is-open'), normalizedLang);

        document.dispatchEvent(new CustomEvent('siteLanguageChanged', {
            detail: { lang: normalizedLang }
        }));
    };

    if (!document.getElementById('btn-lang-fr') && themeToggle) {
        const langSelector = document.createElement('div');
        langSelector.className = 'main-nav-lang-selector';
        langSelector.setAttribute('role', 'group');
        langSelector.innerHTML = `
            <i class="fa-solid fa-globe" aria-hidden="true"></i>
            <button type="button" id="btn-lang-fr" class="btn-lang" data-lang="fr">FR</button>
            <span class="main-nav-lang-separator" aria-hidden="true">|</span>
            <button type="button" id="btn-lang-en" class="btn-lang" data-lang="en">EN</button>
        `;
        menuPanel.insertBefore(langSelector, themeToggle);
    }

    const applyLanguage = (lang) => {
        if (typeof window.setLanguage === 'function') {
            window.setLanguage(lang);
        }
        setLanguageState(lang);
    };

    const currentLang = typeof window.currentLang === 'function'
        ? normalizeLang(window.currentLang())
        : getStoredLanguage();
    setLanguageState(currentLang);

    document.getElementById('btn-lang-fr')?.addEventListener('click', () => applyLanguage('fr'));
    document.getElementById('btn-lang-en')?.addEventListener('click', () => applyLanguage('en'));

    const mobileQuery = window.matchMedia('(max-width: 48rem)');
    const menuIcon = menuToggle.querySelector('i');

    const setMenuState = (isOpen) => {
        const lang = getStoredLanguage();
        nav.classList.toggle('is-open', isOpen);
        setMenuA11yLabels(isOpen, lang);

        if (menuIcon) {
            menuIcon.classList.toggle('fa-bars', !isOpen);
            menuIcon.classList.toggle('fa-xmark', isOpen);
        }
    };

    const closeMenu = () => setMenuState(false);

    menuToggle.addEventListener('click', () => {
        setMenuState(!nav.classList.contains('is-open'));
    });

    menuPanel.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', (e) => {
            if (link.classList.contains('main-nav-link-active')) {
                e.preventDefault();
            }
            if (mobileQuery.matches) {
                closeMenu();
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!mobileQuery.matches || !nav.classList.contains('is-open')) {
            return;
        }

        if (!nav.contains(event.target)) {
            closeMenu();
        }
    });

    const handleBreakpointChange = () => {
        if (!mobileQuery.matches) {
            closeMenu();
        }
    };

    if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', handleBreakpointChange);
    } else if (typeof mobileQuery.addListener === 'function') {
        mobileQuery.addListener(handleBreakpointChange);
    }
});
