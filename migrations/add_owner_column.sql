-- Migration: Ajout de la colonne is_owner à la table login
-- Le propriétaire est l'utilisateur qui peut donner les droits administrateur
-- Exécuter cette commande dans MySQL:

ALTER TABLE login ADD COLUMN is_owner BOOLEAN DEFAULT FALSE;

-- Définir le premier utilisateur (ID le plus petit) comme propriétaire
-- Note: Exécutez d'abord cette requête pour trouver l'ID minimum:
-- SELECT MIN(id) FROM login;
-- Puis utilisez cet ID dans la requête UPDATE ci-dessous (remplacez 1 par l'ID trouvé):
-- UPDATE login SET is_owner = TRUE WHERE id = 1;

-- OU définir un utilisateur spécifique comme propriétaire (remplacer l'email)
-- UPDATE login SET is_owner = TRUE WHERE email = 'votre_email@example.com';

