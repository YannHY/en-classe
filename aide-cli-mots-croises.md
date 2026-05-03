# Aide rapide - CLI Mots Croisés

Le CLI permet de publier une grille de mots croisés sur le site directement depuis le Terminal.

## Ce qu'il faut

- Node.js installé (`brew install node`)
- un fichier texte contenant les mots

## Installer le CLI

Lance simplement cette commande dans le Terminal :

```bash
curl -fsSL https://www.ralentirtravaux.com/apps/en-classe/install-mots-croises.sh | zsh
```

Par défaut, le CLI sera installé ici :

```text
~/Documents/Mots-croises
```

Tu peux aussi choisir un autre dossier :

```bash
curl -fsSL https://www.ralentirtravaux.com/apps/en-classe/install-mots-croises.sh | zsh -s ~/Documents/Mots-croises
```

## La commande essentielle

Place-toi d'abord dans le dossier où le CLI a été installé :

```bash
cd ~/Documents/Mots-croises
```

Puis lance :

```bash
mots-croises publish liste.txt
```

Si tout se passe bien, le Terminal renvoie une URL de publication.

## Format conseillé pour `liste.txt`

```text
HORIZONTAL
MOT : DÉFINITION
MOT : DÉFINITION

VERTICAL
MOT : DÉFINITION
MOT : DÉFINITION
```

Explication :

- `HORIZONTAL` indique la section horizontale
- `VERTICAL` indique la section verticale
- chaque ligne contient un mot, puis `:`, puis sa définition

## Exemple complet

1. créer un fichier `liste.txt`
2. y mettre par exemple :

```text
Conjugue les verbes entre parenthèses au futur de l'indicatif.

HORIZONTAL
SERAI : ÊTRE — 1re personne du singulier
MOURRA : MOURIR — 3e personne du singulier
VIENDREZ : VENIR — 2e personne du pluriel
FERAS : FAIRE — 2e personne du singulier
POURRONS : POUVOIR — 1re personne du pluriel
AURA : AVOIR — 3e personne du singulier
PARTIRONT : PARTIR — 3e personne du pluriel
RENDRAI : RENDRE — 1re personne du singulier
VOUDRAS : VOULOIR — 2e personne du singulier
TROUVEREZ : TROUVER — 2e personne du pluriel

VERTICAL
IRONS : ALLER — 1re personne du pluriel
SAURAS : SAVOIR — 2e personne du singulier
PRENDRAI : PRENDRE — 1re personne du singulier
FAUDRA : FALLOIR — 3e personne du singulier
DIREZ : DIRE — 2e personne du pluriel
GUÉRIRONT : GUÉRIR — 3e personne du pluriel
VERRAI : VOIR — 1re personne du singulier
RECEVRONS : RECEVOIR — 1re personne du pluriel
SORTIRAS : SORTIR — 2e personne du singulier
DEVRONT : DEVOIR — 3e personne du pluriel
```

3. lancer :

```bash
cd ~/Documents/Mots-croises
mots-croises publish liste.txt
```

4. ouvrir l'URL renvoyée

## Variantes utiles

Définir un titre :

```bash
mots-croises publish liste.txt --title "Vocabulaire de la poésie"
```

Changer la couleur de fond :

```bash
mots-croises publish liste.txt --block-color "#222222"
```

Lire directement depuis le Terminal :

```bash
mots-croises publish liste.txt
```

## Vérifier que Node.js est installé

```bash
node -v
```

Si un numéro de version s'affiche, c'est bon.

## En cas de problème

### `node: command not found`

Node.js n'est pas installé, ou n'est pas accessible dans le Terminal.

Site officiel :

[https://nodejs.org/](https://nodejs.org/)

### `Aucun mot exploitable dans l'entrée.`

Le fichier n'est pas dans un format reconnu, ou il est vide.

Le format le plus simple à utiliser reste :

```text
HORIZONTAL
SERAI : ÊTRE — 1re personne du singulier
VERTICAL
IRONS : ALLER — 1re personne du pluriel
```

### `fetch failed`

Le service de publication n'a pas répondu, ou la connexion internet ne fonctionne pas.

Vérifie que cette page s'ouvre bien :

[https://www.ralentirtravaux.com/apps/en-classe/mots-croises.html](https://www.ralentirtravaux.com/apps/en-classe/mots-croises.html)

## Aide intégrée

```bash
mots-croises --help
```

## En résumé

```bash
cd ~/Documents/Mots-croises
mots-croises publish liste.txt
```
