# 🎮 Puissance 4 - Jeu en Ligne Multi-joueurs

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Un jeu de Puissance 4 moderne avec système d'XP, leaderboard, support client et intelligence artificielle**

[Fonctionnalités](#-fonctionnalités) • [Installation](#-installation) • [Configuration](#-configuration) • [Documentation](#-documentation)

</div>

---

## 📋 Table des Matières

- [À Propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies Utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du Projet](#-structure-du-projet)
- [Modes de Jeu](#-modes-de-jeu)
- [Système d'XP et Niveaux](#-système-dxp-et-niveaux)
- [Support Client](#-support-client)
- [Administration](#-administration)
- [Base de Données](#-base-de-données)
- [Utilisation](#-utilisation)
- [Développement](#-développement)

---

## 🎯 À Propos

**Puissance 4** est une application web moderne développée en Go qui permet de jouer au célèbre jeu de stratégie Connect Four en ligne. Le projet intègre de nombreuses fonctionnalités avancées telles qu'un système d'expérience et de niveaux, un leaderboard, un système de support client, et plusieurs modes de jeu avec différents niveaux de difficulté.

### Caractéristiques Principales

- 🎮 **Multi-modes de jeu** : Facile, Normal, Difficile, Gravité
- 🤖 **Intelligence Artificielle** : 4 niveaux de difficulté (Facile, Moyen, Difficile, Impossible)
- 👥 **Mode Multi-joueurs** : Affrontez vos amis en 1V1
- 🏆 **Système d'XP et Niveaux** : Gagnez de l'expérience et montez en niveau
- 📊 **Leaderboard** : Classement des meilleurs joueurs
- 💬 **Support Client** : Système de tickets avec chat en temps réel
- 👨‍💼 **Panel d'Administration** : Gestion complète des utilisateurs
- 🎨 **Interface Moderne** : Design responsive avec animations fluides

---

## ✨ Fonctionnalités

### 🎮 Modes de Jeu

- **Mode Facile** : Grille 6x7, aligner 3 jetons pour gagner
- **Mode Normal** : Grille 6x7, aligner 4 jetons pour gagner
- **Mode Difficile** : Grille 7x8, aligner 7 jetons pour gagner
- **Mode Gravité** : Variante avec gravité inversée

### 🤖 Intelligence Artificielle

- **Niveau Facile** : IA basique pour débuter
- **Niveau Moyen** : IA avec stratégie modérée
- **Niveau Difficile** : IA avancée avec anticipation
- **Niveau Impossible** : IA quasi-invincible

### 🏆 Système de Progression

- **Système d'XP** : Gagnez de l'expérience en remportant des parties
- **Niveaux** : Progression basée sur l'XP accumulée (100 XP par niveau)
- **Récompenses** : Plus de difficulté = plus d'XP gagnée
- **Barre de progression** : Visualisation dynamique de votre progression

### 📊 Leaderboard

- Classement en temps réel des meilleurs joueurs
- Affichage du niveau et de l'XP
- Design moderne avec médailles pour le top 3
- Mise à jour automatique

### 💬 Support Client

- **Création de tickets** : Formulaire complet avec types de questions
- **Chat en temps réel** : Communication directe avec les administrateurs
- **Gestion des statuts** : Ouvert, En cours, Résolu, Fermé
- **Priorités** : Faible, Moyenne, Haute, Urgente
- **Interface Admin** : Gestion complète des tickets pour les administrateurs

### 👨‍💼 Administration

- **Dashboard Admin** : Panel de gestion complet
- **Gestion des utilisateurs** : CRUD complet sur les comptes
- **Gestion des tickets** : Réponse et résolution des tickets
- **Système de permissions** : Rôles Admin et Propriétaire

---

## 🛠 Technologies Utilisées

### Backend
- **Go 1.21+** : Langage de programmation principal
- **MySQL 8.0+** : Base de données relationnelle
- **net/http** : Serveur HTTP natif Go

### Frontend
- **HTML5** : Structure des pages
- **CSS3** : Styles et animations
- **JavaScript (ES6+)** : Logique côté client
- **LocalStorage** : Stockage local des données

### Bibliothèques Go
- `github.com/go-sql-driver/mysql` : Driver MySQL
- Packages natifs : `database/sql`, `encoding/json`, `net/http`

---

## 📦 Installation

### Prérequis

- **Go** 1.21 ou supérieur ([Télécharger](https://golang.org/dl/))
- **MySQL** 8.0 ou supérieur ([Télécharger](https://dev.mysql.com/downloads/mysql/))
- **Git** (optionnel, pour cloner le projet)

### Étapes d'Installation

1. **Cloner le repository** (ou télécharger le projet)
   ```bash
   git clone <repository-url>
   cd power-4---equipe-6
   ```

2. **Installer les dépendances Go**
   ```bash
   go mod download
   ```

3. **Configurer la base de données MySQL**
   - Créer une base de données nommée `power_4`
   - Créer un utilisateur MySQL (ou utiliser root)
   - Modifier les credentials dans `src/database/database.go` si nécessaire

4. **Créer les tables de la base de données**
   - Exécuter les scripts SQL nécessaires pour créer les tables :
     - Table `login` (utilisateurs)
     - Table `support_tickets` (tickets de support)
     - Table `support_messages` (messages des tickets)

5. **Compiler et lancer l'application**
   ```bash
   go build -o power4.exe main.go
   ./power4.exe
   ```
   Ou directement :
   ```bash
   go run main.go
   ```

6. **Accéder à l'application**
   - Ouvrir un navigateur
   - Aller sur `http://localhost:3000/login`

---

## ⚙️ Configuration

### Configuration de la Base de Données

Modifier `src/database/database.go` pour changer les paramètres de connexion :

```go
config.DB, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/power_4")
```

Format : `utilisateur:motdepasse@tcp(host:port)/nom_base`

### Configuration du Serveur

Le serveur écoute sur le port **3000** par défaut. Pour changer le port, modifier `main.go` :

```go
log.Fatal(http.ListenAndServe(":3000", nil))
```

### Configuration des Modes de Jeu

Les dimensions et règles des modes sont configurables dans `src/config/config.go` :

```go
const (
    ROWS_EASY   = 6
    COLS_EASY   = 7
    BLOCKS_EASY = 3
    WIN_EASY    = 3
    // ...
)
```

---

## 📁 Structure du Projet

```
power-4---equipe-6/
│
├── main.go                 # Point d'entrée de l'application
├── go.mod                  # Dépendances Go
├── go.sum                  # Checksums des dépendances
│
├── src/                    # Code source Go
│   ├── admin/             # Gestion administrative
│   │   └── admin.go
│   ├── ai/                # Intelligence artificielle
│   │   └── ai.go
│   ├── auth/              # Authentification
│   │   ├── auth.go
│   │   └── hash.go
│   ├── config/            # Configuration globale
│   │   └── config.go
│   ├── database/          # Connexion base de données
│   │   └── database.go
│   ├── game/              # Logique du jeu
│   │   ├── ai_move.go
│   │   ├── game.go
│   │   ├── leaderboard.go
│   │   ├── start.go
│   │   └── xp.go
│   ├── routes/            # Routes HTTP
│   │   └── routes.go
│   ├── script/            # Scripts JavaScript
│   │   ├── dashboard_script.js
│   │   ├── grid_*.js
│   │   ├── homepage_srcipt.js
│   │   ├── login_script.js
│   │   ├── support_script.js
│   │   └── winner_script.js
│   └── support/           # Système de support
│       └── support.go
│
├── temp/                   # Templates HTML
│   ├── admin/
│   │   └── dashboard.html
│   ├── grid/
│   │   ├── grid.html
│   │   ├── grideasy.html
│   │   └── grid_gravity.html
│   ├── grid_hard/
│   │   └── grid_hard.html
│   ├── homepage/
│   │   └── homepage.html
│   ├── login/
│   │   └── login.html
│   └── winner/
│       └── winner.html
│
└── assets/                 # Ressources statiques
    └── static/
        ├── grid_style/
        ├── homepage_style/
        ├── login_style/
        ├── support_style/
        └── winner_style/
```

---

## 🎮 Modes de Jeu

### Mode Facile
- **Grille** : 6 lignes × 7 colonnes
- **Blocs initiaux** : 3 cases pré-remplies
- **Objectif** : Aligner 3 jetons

### Mode Normal
- **Grille** : 6 lignes × 7 colonnes
- **Blocs initiaux** : 5 cases pré-remplies
- **Objectif** : Aligner 4 jetons

### Mode Difficile
- **Grille** : 7 lignes × 8 colonnes
- **Blocs initiaux** : 7 cases pré-remplies
- **Objectif** : Aligner 7 jetons

### Mode Gravité
- **Grille** : 6 lignes × 7 colonnes
- **Mécanique** : Gravité inversée
- **Objectif** : Aligner 4 jetons

---

## 🏆 Système d'XP et Niveaux

### Calcul de l'XP

- **Victoire en 1V1** : +5 XP
- **Victoire contre IA Facile** : +10 XP
- **Victoire contre IA Moyen** : +20 XP
- **Victoire contre IA Difficile** : +30 XP
- **Victoire contre IA Impossible** : +50 XP

### Calcul des Niveaux

- **Niveau 1** : 0-99 XP
- **Niveau 2** : 100-199 XP
- **Niveau 3** : 200-299 XP
- **Formule** : `Niveau = (XP / 100) + 1`

### Fonctionnalités

- Barre de progression dynamique sur la homepage
- Animation de la barre d'XP après chaque victoire
- Pop-up de niveau atteint avec animation
- Affichage du niveau dans le profil et le leaderboard

---

## 💬 Support Client

### Types de Tickets

- **Question simple** : Questions générales
- **Mot de passe oublié** : Assistance pour récupérer le compte
- **Compte piraté** : Signalement de sécurité
- **Bug** : Rapport de problème technique
- **Autre** : Autres demandes

### Statuts des Tickets

- **Ouvert** : Ticket créé, en attente
- **En cours** : Ticket pris en charge par un admin
- **Résolu** : Problème résolu
- **Fermé** : Ticket clôturé

### Priorités

- **Faible** : Demande non urgente
- **Moyenne** : Demande normale
- **Haute** : Demande importante
- **Urgente** : Demande critique

### Interface Admin

- Vue d'ensemble de tous les tickets
- Filtres par statut et type
- Chat en temps réel avec les utilisateurs
- Mise à jour des statuts et priorités

---

## 👨‍💼 Administration

### Accès Admin

- **Rôle Admin** : `is_admin = 1` dans la table `login`
- **Rôle Propriétaire** : `is_owner = 1` dans la table `login`
- Accès au dashboard : `/dashboard`

### Fonctionnalités Admin

- **Gestion des utilisateurs** :
  - Liste de tous les utilisateurs
  - Modification des informations
  - Attribution des droits admin
  - Gestion des avatars et bios

- **Gestion des tickets** :
  - Vue de tous les tickets
  - Réponse aux tickets
  - Changement de statut
  - Modification des priorités

### Sécurité

- Vérification des permissions sur toutes les routes admin
- Protection contre les accès non autorisés
- Validation des données côté serveur

---

## 🗄️ Base de Données

### Table `login`

Stocke les informations des utilisateurs :

```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- nickname (VARCHAR)
- surname (VARCHAR)
- pseudo (VARCHAR, UNIQUE)
- email (VARCHAR)
- password (VARCHAR, HASHED)
- country (VARCHAR)
- avatar (TEXT)
- bio (TEXT)
- is_admin (BOOLEAN, DEFAULT FALSE)
- is_owner (BOOLEAN, DEFAULT FALSE)
- xp (INT, DEFAULT 0)
- level (INT, DEFAULT 1)
- owner (VARCHAR, DEFAULT NULL)
```

### Table `support_tickets`

Stocke les tickets de support :

```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_pseudo (VARCHAR, INDEX)
- user_email (VARCHAR)
- ticket_type (VARCHAR)
- subject (VARCHAR)
- status (VARCHAR, DEFAULT 'open')
- priority (VARCHAR, DEFAULT 'medium')
- created_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- updated_at (DATETIME, ON UPDATE CURRENT_TIMESTAMP)
- resolved_at (DATETIME, NULL)
```

### Table `support_messages`

Stocke les messages des tickets :

```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- ticket_id (INT, INDEX)
- sender_pseudo (VARCHAR, INDEX)
- is_admin (BOOLEAN, DEFAULT FALSE)
- message (TEXT)
- created_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

---

## 🚀 Utilisation

### Première Connexion

1. Accéder à `http://localhost:3000/login`
2. Créer un compte avec un pseudo unique
3. Se connecter avec ses identifiants

### Jouer une Partie

1. **Choisir un mode** :
   - Cliquer sur "VS IA" ou "1V1"
   - Sélectionner le niveau de difficulté (pour l'IA)
   - Choisir le mode de jeu (Facile, Normal, Difficile, Gravité)

2. **Personnaliser** :
   - Choisir les couleurs des jetons
   - Entrer les noms des joueurs (pour 1V1)

3. **Jouer** :
   - Cliquer sur une colonne pour placer un jeton
   - Le premier à aligner le nombre requis de jetons gagne

### Consulter le Profil

- Voir son niveau et XP actuel
- Consulter la barre de progression
- Modifier l'avatar et la bio
- Accéder au dashboard admin (si admin)

### Utiliser le Support

1. Cliquer sur "Support" en haut à droite
2. Créer un nouveau ticket
3. Remplir le formulaire
4. Attendre la réponse d'un administrateur

---

## 🎨 Design et Animations

### Interface Moderne

- **Design responsive** : S'adapte à tous les écrans
- **Animations fluides** : Transitions CSS3 sur tous les éléments
- **Thème cohérent** : Dégradés violets/roses pour une identité visuelle forte
- **Feedback visuel** : Animations au survol et au clic

### Animations Implémentées

- **Boutons** : Scale, translateY, box-shadow au survol
- **Cartes** : Transform et ombres dynamiques
- **Modals** : Fade in/out avec backdrop blur
- **Barre d'XP** : Animation de progression dynamique
- **Leaderboard** : Effets hover sur les items
- **Support** : Animations sur les tickets et messages

---

## 🔧 Développement

### Lancer en Mode Développement

```bash
go run main.go
```

### Compiler pour Production

```bash
go build -o power4.exe main.go
```

### Structure des Routes

Toutes les routes sont définies dans `src/routes/routes.go` :

- `/login` : Page de connexion
- `/homepage` : Page d'accueil
- `/dashboard` : Panel admin
- `/state` : État actuel de la grille
- `/move` : Effectuer un mouvement
- `/award-xp` : Attribuer de l'XP
- `/leaderboard` : Classement des joueurs
- `/support/*` : Routes du système de support
- `/admin/*` : Routes administratives

### Ajout de Fonctionnalités

1. **Nouvelle route** : Ajouter dans `src/routes/routes.go`
2. **Nouvelle page** : Créer le HTML dans `temp/`
3. **Nouveau style** : Créer le CSS dans `assets/static/`
4. **Nouveau script** : Créer le JS dans `src/script/`

---

## 📝 Notes Importantes

### Sécurité

- Les mots de passe sont hashés avec bcrypt
- Vérification des permissions sur toutes les routes sensibles
- Protection contre les injections SQL (requêtes préparées)
- Validation des données côté serveur

### Performance

- Requêtes SQL optimisées avec index
- Cache côté client avec LocalStorage
- Animations CSS optimisées (GPU-accelerated)
- Pagination pour les grandes listes

### Compatibilité

- Navigateurs modernes (Chrome, Firefox, Edge, Safari)
- Responsive design pour mobile et tablette
- MySQL 8.0+ requis

---

## 🤝 Contribution

Ce projet a été développé dans le cadre d'un projet académique. Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👥 Équipe

Développé par l'**Équipe 6** dans le cadre du projet B1 Ynov.

---

## 🎉 Remerciements

- Inspiration : Le jeu classique Connect Four
- Technologies : Go, MySQL, HTML/CSS/JavaScript
- Design : Interface moderne avec animations fluides

---

<div align="center">

**Fait avec ❤️ par l'Équipe 6**

🎮 **Amusez-vous bien !** 🎮

</div>
