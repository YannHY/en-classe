# En classe

**En classe** est une collection d'outils web pour animer, organiser et préparer le travail en classe. Le site regroupe des minuteurs, un tableau de bord, un générateur de groupes, un tableau Kanban collaboratif, un éditeur de notes, des outils de lecture accessible, ainsi que plusieurs utilitaires pour créer des QR codes, partager des vidéos, générer des GIF ou préparer des supports visuels.

Le projet est principalement construit en HTML, CSS et JavaScript. La plupart des pages fonctionnent directement dans le navigateur. Certaines fonctions avancées, comme la publication de mots croisés ou la synchronisation Kanban, s'appuient sur des services côté serveur ou externes.

## Accès

- Site : [https://www.ralentirtravaux.com/apps/en-classe/](https://www.ralentirtravaux.com/apps/en-classe/)
- Dépôt GitHub : [https://github.com/YannHY/en-classe](https://github.com/YannHY/en-classe)

## Fonctionnalités principales

### Tableau de bord

Page : `index.html`

- **Calendrier** : affiche le mois en cours, permet de naviguer entre les mois et met en évidence la date du jour.
- **Date du jour** : présente clairement le jour et le numéro du jour pour une utilisation en projection.
- **Météo** : affiche une ligne météo sur la page d'accueil.
- **Horloge** : propose une horloge numérique et une horloge analogique, avec un affichage repliable.
- **Minuteur** : permet de régler heures, minutes et secondes, puis de démarrer, mettre en pause, arrêter ou réinitialiser le compte à rebours.
- **Feu de classe** : utilise trois états visuels, rouge, orange et vert, pour indiquer rapidement le niveau de bruit ou d'échange autorisé.
- **Rappels** : permet d'ajouter des tâches courtes, de les cocher, les supprimer et définir des alertes.
- **Persistance locale** : plusieurs réglages et données sont conservés dans le navigateur grâce au stockage local.

### Minuteurs multiples

Page : `activities.html`

- **Cinq minuteurs d'activités** : chaque ligne correspond à une activité avec son titre et sa durée.
- **Démarrage global** : un bouton permet de lancer tous les minuteurs dans l'ordre.
- **Progression visuelle** : une barre indique l'avancement de chaque activité.
- **États par activité** : chaque activité dispose d'un indicateur coloré que l'on peut changer manuellement.
- **Alarme de fin** : un son signale la fin d'un minuteur.
- **Reprise après changement d'onglet** : l'état des minuteurs est restauré après une interruption ou un retour sur la page.

### Notes

Page : `notes.html`

- **Éditeur riche** : permet de rédiger des notes avec gras, italique, souligné, couleurs, surlignage et alignements.
- **Listes** : prend en charge les listes à puces et les listes numérotées.
- **Images** : permet d'insérer des images dans la note.
- **Tableaux** : permet d'ajouter des tableaux directement dans l'éditeur.
- **Date et heure** : insère rapidement un horodatage.
- **Onglets de notes** : permet de gérer plusieurs notes séparées.
- **Recherche et remplacement** : offre une recherche dans le texte, une navigation entre occurrences et un remplacement simple ou global.
- **Plein écran** : agrandit l'espace d'écriture pour une utilisation confortable.
- **Export** : permet d'exporter en texte, en HTML ou d'imprimer la note.
- **Compteurs** : affiche le nombre de mots et de caractères.
- **Sauvegarde automatique** : conserve les notes localement dans le navigateur.

### Groupes

Page : `groupes.html`

- **Roue de tirage** : tire un nom au hasard depuis une liste d'élèves.
- **Nom unique** : affiche un élève à la fois, avec navigation précédente et suivante.
- **Liste ordonnée** : génère un ordre de passage.
- **Groupes de taille fixe** : crée automatiquement des groupes de deux, trois, quatre élèves ou plus selon le réglage choisi.
- **Équipes** : répartit la classe selon un nombre d'équipes défini.
- **Plan de classe** : génère une disposition en lignes et colonnes.
- **Modification des noms** : permet de coller ou éditer une liste, avec un nom par ligne.
- **Mélange rapide** : remélange les résultats à tout moment.
- **Copie** : copie les résultats pour les réutiliser ailleurs.
- **Plein écran** : facilite l'affichage au tableau.

### Kanban

Page : `kanban.html`

- **Projets** : crée un nouveau tableau de projet.
- **Colonnes personnalisées** : ajoute des colonnes avec un titre et une couleur.
- **Tâches** : crée des cartes avec titre, description, priorité et personne assignée.
- **Priorités** : distingue les tâches de priorité basse, moyenne ou haute.
- **Déplacement des tâches** : organise les cartes entre les colonnes.
- **Code de partage** : affiche un code permettant de rejoindre un projet.
- **Collaboration** : permet de rejoindre un tableau partagé à partir d'un code.
- **Synchronisation** : utilise un module Firebase pour la collaboration en temps réel.
- **Interface bilingue** : le code contient une couche d'internationalisation français/anglais pour les libellés Kanban.

### Mots croisés

Page : `mots-croises.html`

- **Création manuelle** : ajoute des mots, définitions et directions horizontales ou verticales.
- **Import de listes** : accepte des fichiers `.txt`, `.md` et `.csv`.
- **Collage direct** : permet de coller une liste de mots dans une zone de texte.
- **Formats souples** : reconnaît les formats CSV, texte avec `MOT: définition`, sections horizontales/verticales et listes simples.
- **Génération automatique** : construit la grille à partir des mots saisis.
- **Affichage des indices** : sépare les définitions horizontales et verticales.
- **Solution** : affiche ou masque la solution.
- **Couleur de fond** : personnalise la couleur des cases bloquées.
- **Export HTML** : génère une version HTML de la grille.
- **Export PNG** : exporte la grille sous forme d'image.
- **Impression** : prépare la grille pour une utilisation papier.
- **Publication en ligne** : envoie la grille vers `publish.php` et retourne un lien partageable.
- **CLI** : fournit une commande `mots-croises` pour publier ou générer une grille depuis le Terminal.

### Lecture

Page : `lecture.html`

- **Zone de texte éditable** : permet de coller ou écrire un texte à adapter.
- **Mise en forme rapide** : propose gras, italique, souligné, titre, listes, couleur et suppression du formatage.
- **Lecture audio** : lit le texte à voix haute avec la synthèse vocale du navigateur.
- **Vitesse de lecture** : ajuste la vitesse de la voix.
- **Langue de lecture** : prend en charge plusieurs langues, dont le français, l'anglais, l'espagnol, l'allemand, l'italien et le portugais.
- **Typographie** : modifie la police, la taille, l'espacement des lettres et l'interligne.
- **Couleurs** : règle la couleur du texte et du fond.
- **Thèmes recommandés** : applique rapidement des combinaisons de couleurs lisibles.
- **Lecture bionique** : met en valeur le début des mots pour faciliter le balayage visuel.
- **Surlignage des lignes** : améliore le repérage pendant la lecture.
- **Règle de lecture** : affiche une règle horizontale pour guider l'oeil.
- **Dictionnaire / définitions** : permet de cliquer sur un mot pour afficher sa définition dans une fenêtre contextuelle.
- **Recherche Wiktionnaire** : détecte la langue du mot et interroge le Wiktionnaire adapté, notamment français, anglais, espagnol, allemand, italien ou portugais.
- **Mode concentration** : affiche le texte dans une vue dédiée, plus immersive.
- **Partage** : copie un lien de partage du texte.
- **Préférences** : sauvegarde les réglages choisis dans le navigateur.

### Boutons

Page : `boutons.html`

- **Boutons sonores** : déclenche des sons courts pour rythmer la classe.
- **Catégories** : regroupe les sons en approbation, désapprobation, action, ambiance, musique inquiétante et célébration.
- **Compteurs** : certains boutons comptabilisent le nombre de clics.
- **Usage immédiat** : fonctionne comme une table de sons pour projection ou animation orale.

## Utilitaires

### QR Code

Page : `qrcode.html`

- **Contenu libre** : encode une URL ou du texte.
- **Couleurs personnalisées** : modifie le fond, le QR code, les marqueurs et les icônes.
- **Fond transparent** : génère un QR code sans fond opaque.
- **Dégradés** : applique un dégradé linéaire ou radial.
- **Cadre et texte** : ajoute un cadre avec un libellé, par exemple "Scannez-moi !".
- **Formes** : change le style des modules et des coins du QR code.
- **Logo** : ajoute une image personnelle au centre du QR code.
- **Icônes sociales** : propose des logos prédéfinis pour certains usages.
- **Correction d'erreur** : règle le niveau de robustesse du QR code.
- **Taille et marge** : ajuste les dimensions et l'espace autour du code.
- **Export** : télécharge le QR code en PNG, JPEG ou SVG.

### QR Code Florimont

Page : `florimont.html`

- **Générateur simplifié** : crée rapidement un QR code aux couleurs de l'Institut Florimont.
- **Logo Florimont** : ajoute ou retire le logo selon le besoin.
- **Couleurs institutionnelles** : propose les couleurs principales de l'établissement.
- **Fond blanc ou transparent** : choisit le type d'arrière-plan.
- **Export** : télécharge le QR code en PNG, JPEG ou SVG.

### Vidéo

Page : `video.html`

- **Partage de vidéo** : transforme un lien YouTube en page de visionnage simple.
- **Titre personnalisé** : ajoute un titre pour contextualiser la vidéo.
- **Consigne** : ajoute une courte instruction pour les élèves.
- **Aperçu intégré** : affiche la vidéo dans un lecteur embarqué.
- **Lien élève** : génère et copie un lien prêt à partager.
- **Réinitialisation** : efface rapidement les paramètres.

### GIF

Page : `gifs.html`

- **Import d'images** : accepte plusieurs images par sélection ou glisser-déposer.
- **Aperçu animé** : affiche le rendu dans un canvas avant export.
- **Dimensions** : règle la largeur et la hauteur du GIF.
- **Cadrage** : propose les modes contenir, couvrir ou étirer.
- **Fond** : choisit une couleur de fond ou un arrière-plan transparent.
- **Durée** : règle le délai entre les images.
- **Boucles** : définit un nombre de répétitions ou une boucle infinie.
- **Taille automatique** : adapte les dimensions à partir des images importées.
- **Uniformisation** : applique une même durée à toutes les images.
- **Séquence** : affiche la liste des images de l'animation.
- **Export** : télécharge le GIF généré.

### Captures

Page : `captures.html`

- **Import de capture** : charge une capture d'écran depuis l'ordinateur.
- **Cadres Apple** : ajoute un cadre iPhone ou iPad.
- **Détection automatique** : choisit le cadre adapté quand c'est possible.
- **Choix manuel du cadre** : permet de sélectionner un modèle précis.
- **Arrière-plan** : utilise un fond uni, transparent ou en gradient.
- **Marge externe** : ajuste l'espace autour de l'appareil.
- **Aperçu** : affiche le rendu final sur canvas.
- **Export PNG** : télécharge l'image encadrée.

### Signature

Page : `signature.html`

- **Signature email** : génère une signature Outlook pour l'Institut Florimont.
- **Informations personnelles** : renseigne nom, fonction, téléphone, email et site web.
- **Aperçu en direct** : affiche le rendu pendant la saisie.
- **Copie** : copie la signature prête à coller dans Outlook.
- **Instructions** : indique le chemin d'ajout d'une signature dans Outlook.

## CLI Mots croisés

Le projet contient un outil en ligne de commande pour générer ou publier des grilles.

Installation depuis le site :

```bash
curl -fsSL https://www.ralentirtravaux.com/apps/en-classe/install-mots-croises.sh | zsh
```

Commandes principales :

```bash
mots-croises publish liste.txt
mots-croises build liste.txt --out grille.json
```

Options utiles :

```bash
mots-croises publish liste.txt --title "Vocabulaire de la poésie"
mots-croises publish liste.txt --block-color "#222222"
mots-croises publish - 
```

Le CLI lit des fichiers texte, Markdown ou CSV, génère une structure de grille et peut publier le résultat via l'endpoint `publish.php`.

## Structure du projet

```text
.
├── index.html                  # Tableau de bord de classe
├── activities.html             # Minuteurs multiples
├── notes.html                  # Éditeur de notes
├── groupes.html                # Tirage, groupes, équipes et plan de classe
├── kanban.html                 # Tableau Kanban
├── mots-croises.html           # Générateur de mots croisés
├── lecture.html                # Outil de lecture accessible
├── boutons.html                # Table de sons
├── qrcode.html                 # Générateur complet de QR codes
├── florimont.html              # QR codes Florimont
├── video.html                  # Partage de vidéos
├── gifs.html                   # Générateur de GIF
├── captures.html               # Encadrement de captures iPhone/iPad
├── signature.html              # Générateur de signature Outlook
├── css/                        # Feuilles de style
├── js/                         # Scripts des pages
├── images/                     # Logos, boutons, cadres d'appareils
├── boutons-sons/               # Fichiers audio des boutons
├── bin/                        # CLI mots croisés
├── grilles/                    # Grilles publiées ou exemples
├── publish.php                 # Endpoint de publication des mots croisés
└── install-mots-croises.sh     # Script d'installation du CLI
```

## Lancer le projet en local

Comme il s'agit d'un site statique, un serveur local simple suffit pour la majorité des pages :

```bash
python3 -m http.server 8000
```

Puis ouvrir :

```text
http://localhost:8000/
```

Pour tester `publish.php`, il faut utiliser un serveur PHP :

```bash
php -S localhost:8000
```

## Technologies utilisées

- **HTML5** pour la structure des pages.
- **CSS3** pour les interfaces et les thèmes.
- **JavaScript vanilla** pour les interactions.
- **Canvas** pour les QR codes, les GIF, les captures encadrées et les mots croisés.
- **LocalStorage** pour sauvegarder des préférences ou contenus côté navigateur.
- **Firebase** pour la synchronisation du tableau Kanban.
- **PHP** pour la publication des grilles de mots croisés.
- **Node.js** pour le CLI de mots croisés.

## Données et confidentialité

- La plupart des outils fonctionnent côté navigateur.
- Les notes, préférences et états locaux sont sauvegardés dans le navigateur de l'utilisateur.
- Les fichiers importés, comme les images ou captures, sont traités localement par le navigateur sauf fonction spécifique de publication.
- Les grilles de mots croisés publiées sont envoyées au serveur via `publish.php`.
- Le Kanban collaboratif s'appuie sur Firebase pour partager les projets.

## Licence

Le site indique une licence Creative Commons **CC BY-SA**. Vous pouvez partager et adapter le projet en créditant l'auteur et en conservant la même licence pour les adaptations.

## Auteur

Réalisé par [Yann Houry](https://yann-houry.netlify.app), responsable de l'innovation à l'Institut Florimont de Genève.
