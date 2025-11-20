# 🎮 Puissance 4 - Jeu en Ligne Multi-joueurs

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg)

**Un jeu de Puissance 4 moderne avec système d'XP, leaderboard, support client et intelligence artificielle**

---

## 🚀 Installation Rapide

### Prérequis
- **Go** 1.21+ ([Télécharger](https://golang.org/dl/))
- **MySQL** 8.0+ ([Télécharger](https://dev.mysql.com/downloads/mysql/))

### Étapes

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd power-4---equipe-6
   ```

2. **Installer les dépendances**
   ```bash
   go mod download
   ```

3. **Configurer la base de données**
   - Créer la base `power_4` dans MySQL
   - Modifier les credentials dans `src/database/database.go` si nécessaire
   - Exécuter les scripts SQL pour créer les tables

4. **Lancer l'application**
   ```bash
   go run main.go
   ```

5. **Accéder à l'application**
   - Ouvrir `http://localhost:3000/login`

---

## ✨ Fonctionnalités

### Modes de Jeu
- **Mode Facile** : Grille 6x7, aligner 3 jetons
- **Mode Normal** : Grille 6x7, aligner 4 jetons
- **Mode Difficile** : Grille 7x8, aligner 7 jetons
- **Mode Gravité** : Variante avec gravité inversée

### Intelligence Artificielle
- 4 niveaux de difficulté : Facile, Moyen, Difficile, Impossible
- Algorithme Minimax avec élagage alpha-bêta

### Système de Progression
- **XP** : Gagnez de l'expérience en remportant des parties (5 à 50 XP selon la difficulté)
- **Niveaux** : Progression basée sur l'XP (100 XP par niveau)
- **Leaderboard** : Classement des meilleurs joueurs

### Support Client
- Système de tickets avec chat en temps réel
- Gestion des statuts (Ouvert, En cours, Résolu, Fermé)
- Interface admin pour répondre aux tickets

### Administration
- Dashboard admin pour gérer les utilisateurs
- CRUD complet sur les comptes
- Gestion des tickets de support

---

## 🛠️ Technologies

- **Backend** : Go 1.21+, MySQL 8.0+, net/http
- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Bibliothèques** : `github.com/go-sql-driver/mysql`

---

## 📁 Structure du Projet

```
power-4---equipe-6/
├── main.go                 # Point d'entrée
├── src/
│   ├── admin/             # Gestion administrative
│   ├── ai/                # Intelligence artificielle
│   ├── auth/              # Authentification
│   ├── config/            # Configuration
│   ├── database/          # Connexion BDD
│   ├── game/              # Logique du jeu
│   ├── routes/            # Routes HTTP
│   ├── script/            # Scripts JavaScript
│   └── support/           # Système de support
├── templates/             # Templates HTML
└── assets/                # Styles CSS
```

---

## ⚙️ Configuration

### Base de Données
Modifier `src/database/database.go` :
```go
config.DB, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/power_4")
```

### Port du Serveur
Modifier `main.go` :
```go
log.Fatal(http.ListenAndServe(":3000", nil))
```

---

## 🎯 Utilisation

1. **Créer un compte** sur `/login`
2. **Choisir un mode** : VS IA ou 1V1
3. **Sélectionner la difficulté** et le mode de jeu
4. **Jouer** : Cliquer sur une colonne pour placer un jeton
5. **Gagner de l'XP** et monter en niveau

---

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Vérification des permissions sur toutes les routes sensibles
- Protection contre les injections SQL (requêtes préparées)
- Validation des données côté serveur

---

## 📝 Routes Principales

- `/login` : Page de connexion
- `/homepage` : Page d'accueil
- `/dashboard` : Panel admin
- `/state` : État actuel de la grille
- `/click` : Effectuer un mouvement
- `/award-xp` : Attribuer de l'XP
- `/leaderboard` : Classement des joueurs
- `/support/*` : Routes du système de support
- `/admin/*` : Routes administratives

---

## 👥 Équipe

Développé par l'**Équipe 6** dans le cadre du projet B1 Ynov.

---

## 📄 License

Ce projet est sous licence MIT.
