-- Migration: Ajout de la colonne is_admin à la table login
-- Exécuter cette commande dans MySQL:
-- ALTER TABLE login ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE login ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Optionnel: Créer un utilisateur admin (remplacer 'admin@example.com' et 'password' par vos valeurs)
-- UPDATE login SET is_admin = TRUE WHERE email = 'admin@example.com';

