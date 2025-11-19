# Migration - Système Admin

## Instructions pour activer le système de dashboard admin

### 1. Exécuter la migration SQL

Connectez-vous à votre base de données MySQL et exécutez la commande suivante :

```sql
ALTER TABLE login ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

Ou utilisez le fichier SQL fourni :

```bash
mysql -u root -p power_4 < migrations/add_admin_column.sql
```

### 2. Créer un utilisateur admin

Pour donner les droits d'administrateur à un utilisateur existant, exécutez :

```sql
UPDATE login SET is_admin = TRUE WHERE email = 'votre_email@example.com';
```

Remplacez `'votre_email@example.com'` par l'email de l'utilisateur que vous souhaitez promouvoir administrateur.

### 3. Vérifier la migration

Pour vérifier que la colonne a bien été ajoutée :

```sql
DESCRIBE login;
```

Vous devriez voir la colonne `is_admin` de type `tinyint(1)` (ou `BOOLEAN`).

### 4. Accéder au dashboard

1. Connectez-vous avec un compte administrateur
2. Sur la page d'accueil, un bouton "🔐 Dashboard Admin" apparaîtra dans la section profil
3. Cliquez sur ce bouton pour accéder au dashboard

### Fonctionnalités du dashboard

- **Voir tous les utilisateurs** : Liste complète avec ID, nom, pseudo, email, pays, statut
- **Modifier un utilisateur** : Cliquez sur "Modifier" pour éditer les informations d'un utilisateur
- **Supprimer un utilisateur** : Cliquez sur "Supprimer" pour supprimer un utilisateur (avec confirmation)
- **Gérer les droits admin** : Cochez/décochez la case "Administrateur" lors de l'édition

### Sécurité

- Seuls les utilisateurs avec `is_admin = TRUE` peuvent accéder au dashboard
- Toutes les routes admin vérifient le statut administrateur
- Les utilisateurs non-admins sont redirigés vers la page d'accueil s'ils tentent d'accéder au dashboard

