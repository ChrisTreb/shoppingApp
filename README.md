# Listahan (ShoppingApp) 🛒

> **Votre compagnon intelligent de listes de courses sur mobile.**  
> Site officiel : [https://christreb.github.io/Listahan-website/](https://christreb.github.io/Listahan-website/)

Application mobile **React Native** développée avec **Expo SDK 52**, utilisant une base de données locale **SQLite** embarquée pour un fonctionnement 100 % hors-ligne, fluide et sécurisé.

---

## 📋 Sommaire

- [Fonctionnalités & Description Métier](#-fonctionnalités--description-métier)
  - [1. Liste de courses active (My list)](#1-liste-de-courses-active-my-list)
  - [2. Catalogue & Recherche (Products)](#2-catalogue--recherche-products)
  - [3. Tableau de bord & Historique (Dashboard)](#3-tableau-de-bord--historique-dashboard)
  - [4. Import & Export CSV](#4-import--export-csv)
  - [5. Catalogue initial pré-intégré](#5-catalogue-initial-pré-intégré)
- [Architecture & Description Technique](#-architecture--description-technique)
  - [Stack technologique](#stack-technologique)
  - [Structure du projet](#structure-du-projet)
  - [Modèle de données (SQLite)](#modèle-de-données-sqlite)
  - [Optimisations de performance appliquées](#optimisations-de-performance-appliquées)
- [Guide de Démarrage & Déploiement](#-guide-de-démarrage--déploiement)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Lancer en développement (Metro)](#lancer-en-développement-metro)
  - [Compiler avec Android Studio](#compiler-avec-android-studio)
- [Scripts npm disponibles](#-scripts-npm-disponibles)

---

## 📱 Fonctionnalités & Description Métier

### 1. Liste de courses active (My list)
* **Visualisation immédiate** : Affiche les articles de la liste en cours classés par catégorie avec leurs icônes dédiées.
* **Mode Panier interactif** : Durant les courses, touchez un produit pour le marquer comme pris dans votre caddie et le retirer de l'affichage en direct.
* **Édition de liste** : Bouton d'édition rapide permettant de supprimer des articles de la liste active sans les effacer du catalogue permanent.
* **Gestion de l'état vide** : Visuel et message d'accueil conviviaux invitant l'utilisateur à créer une liste ou à sélectionner des articles.

### 2. Catalogue & Recherche (Products)
* **Recherche instantanée** : Filtre en temps réel sur les noms de produits et les rayons/catégories.
* **Ajout en un clic** : Bouton `+` pour insérer un produit directement dans la liste active en cours. Un indicateur visuel signale les articles déjà présents.
* **Ajout de produit personnalisé** : Modal de saisie rapide d'un article avec le composant sélecteur de catégorie `TypePicker`.
* **Création d'une nouvelle liste** : Saisie d'un nom de liste (max. 24 caractères) qui devient instantanément la liste active.
* **Suppression sécurisée** : Confirmation par dialogue avant toute suppression définitive d'un article du catalogue.

### 3. Tableau de bord & Historique (Dashboard)
* **Gestion des listes sauvegardées** : Consultation de toutes les listes créées avec date de création et nombre d'articles.
* **Bascule de liste active** : Activez n'importe quelle ancienne liste en un seul clic grâce à une transaction atomique.
* **Consultation du contenu** : Modal d'inspection détaillée du contenu de chaque liste archivée.
* **Zone de danger sécurisée** : Purge et réinitialisation séparée du catalogue produit ou de l'historique des listes.

### 4. Import & Export CSV
* **Export Catalog** : Génération et partage d'un fichier `shopping_catalog_YYYY-MM-DD.csv` conforme RFC 4180.
* **Export List** : Exportation de la liste active courante (`shopping_[nom]_YYYY-MM-DD.csv`) pour partage par message, email ou tableur.
* **Import CSV intelligent** :
  * Détection automatique du délimiteur (virgule `,` ou point-virgule `;` standard Excel FR).
  * Reconnaissance automatique des en-têtes (`name`, `nom`, `produit` / `type`, `catégorie`, etc.).
  * Traitement par lots sans doublons (mise à jour si existant, création sinon).

### 5. Catalogue initial pré-intégré
À la première installation, l'application détecte une base vierge et injecte automatiquement **40 produits essentiels** de supermarché répartis sur 8 rayons :
* 🍎 **Fruits et légumes** : Pommes Golden, Bananes, Tomates grappe, Salade, Carottes...
* 🧀 **Produits frais** : Lait, Beurre doux, Oeufs, Emmental, Blancs de poulet, Camembert...
* 🍝 **Épicerie** : Pâtes Penne, Riz basmati, Café, Huile d'olive, Thon, Sauce tomate...
* 💧 **Liquides** : Eau minérale, Jus d'orange, Lait d'amande, Thé vert...
* ❄️ **Surgelés** : Haricots verts, Pizza Margherita, Glace vanille, Saumon...
* 🧼 **Hygiène & Droguerie** : Dentifrice, Gel douche, Papier toilette, Lessive, Liquide vaisselle...
* Une première liste active intitulée **"Mes premières courses"** est pré-générée pour permettre un test immédiat.

---

## 🛠️ Architecture & Description Technique

### Stack technologique

| Composant | Technologie / Version | Rôle |
| :--- | :--- | :--- |
| **Runtime Mobile** | React Native `0.76.9` | Moteur applicatif natif multiplateforme |
| **UI Framework** | React `18.3.1` | Rendu déclaratif par composants fonctionnels et Hooks |
| **Framework & Outils** | Expo SDK `52.0.49` | Écosystème mobile, bundling Hermes et modules natifs |
| **Base de Données** | `expo-sqlite` `15.1.4` | SQLite embarqué natif avec mode WAL activé |
| **Navigation** | `@react-navigation/bottom-tabs` `6.6.1` | Navigation par onglets inférieurs |
| **Système de Fichiers** | `expo-file-system` / `expo-sharing` | Manipulation de fichiers locaux et partage natif |
| **Sélecteur de Fichiers**| `expo-document-picker` | Sélection de fichiers CSV pour l'importation |
| **Icônes** | `@expo/vector-icons` (`Ionicons`) | Iconographie vectorielle fluide et légère |

### Structure du projet

```
shoppingApp/
├── assets/                  # Icônes de l'application, adaptive icons et splash screen
├── android/                 # Projet natif Android Studio (Gradle, Manifest, wrapper)
├── components/              # Composants réutilisables optimisés
│   ├── SearchBar.jsx        # Barre de recherche avec détection d'effacement
│   └── TypePicker.jsx       # Sélecteur modal de catégories avec icônes visuelles
├── database/                # Gestion de la persistance locale
│   ├── functions/
│   │   └── DatabaseConnect.jsx  # Singleton DB, service métier dbService et migrations
│   └── seedData.js          # Jeu de données initial de 40 articles supermarché
├── img/                     # Ressources graphiques et illustrations
│   ├── home/                # Illustration d'état vide (cat.png)
│   └── products/            # Icônes haute résolution par catégorie de produit
├── lists/functions/         # Fonctions utilitaires métier
│   ├── GetProductImage.jsx  # Résolution O(1) de l'image selon la catégorie
│   └── GetProductsFromList.jsx # Parser résilient JSON / format texte
├── navigation/              # Architecture de navigation
│   ├── MainContainer.jsx    # Configuration du TabNavigator et de la StatusBar
│   └── screens/
│       ├── HomeScreen.jsx       # Écran "My list"
│       ├── ProductsScreen.jsx   # Écran "Products"
│       └── OverviewScreen.jsx   # Écran "Dashboard" & Import/Export
├── services/
│   └── csvService.js        # Parser et générateur CSV RFC 4180
├── variables/               # Constantes globales
│   ├── theme.js             # Design tokens (palette de couleurs, bordures)
│   └── Types.jsx            # Nomenclature des 9 catégories de produits
├── App.js                   # Point d'entrée de l'application & initialisation DB
├── app.json                 # Configuration Expo et plugins natifs
└── package.json             # Dépendances unifiées npm
```

### Modèle de données (SQLite)

Le schéma relationnel repose sur deux tables principales gérées dans `database/functions/DatabaseConnect.jsx` :

#### Table `products`
```sql
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  inCurrentList INTEGER DEFAULT 0,
  lastOrder TIMESTAMP,
  numOrdered INTEGER DEFAULT 0
);
```

#### Table `productsLists`
```sql
CREATE TABLE IF NOT EXISTS productsLists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listName VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP,
  products TEXT,
  currentList INTEGER DEFAULT 0
);
```

### Optimisations de performance appliquées

1. **Requêtes préparées & sécurité SQL** : Toutes les opérations utilisent des requêtes préparées avec paramètres positionnels (`?`), éliminant tout risque d'injection SQL et protégeant l'application contre les plantages sur les apostrophes (ex : *"Jus d'orange"*).
2. **Transactions atomiques (ACID)** : Les opérations multi-tables (activation d'une liste, création de liste, import par lots) sont exécutées dans des blocs `withTransactionSync()` uniques.
3. **Write-Ahead Logging (WAL)** : La directive `PRAGMA journal_mode = WAL;` est activée pour accélérer les opérations d'écriture et de lecture concurrentes.
4. **Feuilles de style statiques** : Tous les `StyleSheet.create()` sont déclarés hors des fonctions de composants, évitant la réallocation d'objets à chaque cycle de rendu.
5. **Mémoïsation FlatList (60 FPS)** :
   * Items encapsulés dans `React.memo` pour prévenir les re-rendus intempestifs.
   * Callbacks stabilisés avec `useCallback`.
   * Paramètres FlatList optimisés : `initialNumToRender={15}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, `removeClippedSubviews={true}`.
6. **Moteur JS Hermes** : Bundling optimisé en bytecode avec temps de démarrage instantané.

---

## 🚀 Guide de Démarrage & Déploiement

### Prérequis
* [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée).
* Gestionnaire de paquets **npm** (inclus avec Node.js).
* [Android Studio](https://developer.android.com/studio) configuré avec le SDK Android (API 34+) pour le build natif.

### Installation
Clonez le dépôt puis installez les dépendances :
```bash
npm install
```

### Lancer en développement (Metro)
Pour démarrer le bundler Expo Metro :
```bash
npm start
```
Vous pouvez ensuite appuyer sur `a` dans le terminal pour ouvrir sur un émulateur Android connecté, ou scanner le QR code avec l'application Expo Go.

### Compiler avec Android Studio
1. Ouvrez **Android Studio**.
2. Cliquez sur **Open** (Ouvrir un projet existant).
3. Naviguez jusqu'au répertoire du projet et sélectionnez le sous-dossier **`android`** :
   ```
   shoppingApp/android
   ```
4. Laissez Gradle synchroniser les dépendances et indexer le projet.
5. Branchez un appareil Android avec le débogage USB activé ou démarrez un Virtual Device (AVD).
6. Cliquez sur le bouton vert **Run 'app'** (`Shift + F10`) pour compiler et installer l'APK directement.

---

## 📜 Scripts npm disponibles

* `npm start` : Démarre le serveur de développement Expo Metro.
* `npm run android` : Compile et exécute directement l'application sur un terminal/émulateur Android via Expo CLI.
* `npm run ios` : Lance le build sur simulateur iOS (nécessite macOS et Xcode).
* `npm run web` : Démarre l'application dans un navigateur web avec le mock SQLite en mémoire.
