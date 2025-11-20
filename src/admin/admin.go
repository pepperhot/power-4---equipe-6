package admin

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/url"
	"power4/src/auth"
	"power4/src/config"
	"strconv"
)

// isOwner vérifie si un utilisateur est propriétaire
func isOwner(pseudo string) (bool, error) {
	var isOwnerUser bool
	err := config.DB.QueryRow("SELECT COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isOwnerUser)
	if err != nil {
		return false, err
	}

	return isOwnerUser, nil
}

// CheckAdmin vérifie si un utilisateur a les droits administrateur
func CheckAdmin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	pseudo := r.URL.Query().Get("pseudo")
	if pseudo == "" {
		pseudo = r.FormValue("pseudo")
	}
	if pseudo == "" {
		pseudo = config.Player1Name
	}
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "isAdmin": false, "message": "Aucun utilisateur connecté"})
		return
	}
	var isAdmin bool
	var isOwnerUser bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "isAdmin": false, "message": "Erreur lors de la vérification"})
		return
	}
	canAccess := isAdmin || isOwnerUser
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "isAdmin": canAccess, "isOwner": isOwnerUser})
}

// GetAllUsers retourne la liste de tous les utilisateurs (admin uniquement)
func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	pseudo := r.URL.Query().Get("pseudo")
	if pseudo == "" {
		pseudo = r.FormValue("pseudo")
	}
	if pseudo == "" {
		pseudo = config.Player1Name
	}
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Non autorisé"})
		return
	}
	var isAdmin bool
	var isOwnerUser bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)
	if err != nil || (!isAdmin && !isOwnerUser) {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Accès refusé - Admin ou Propriétaire requis"})
		return
	}

	rows, err := config.DB.Query("SELECT id, nickname, surname, pseudo, email, country, COALESCE(is_admin, FALSE), COALESCE(avatar, ''), COALESCE(bio, '') FROM login ORDER BY id")
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la récupération des utilisateurs: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var nickname, surname, pseudo, email, country string
		var isAdmin bool
		var avatar, bio sql.NullString

		err := rows.Scan(&id, &nickname, &surname, &pseudo, &email, &country, &isAdmin, &avatar, &bio)
		if err != nil {
			continue
		}

		avatarStr := ""
		if avatar.Valid && avatar.String != "" {
			avatarStr = avatar.String
		} else {
			avatarStr = "https://ui-avatars.com/api/?name=" + url.QueryEscape(pseudo) + "&background=667eea&color=fff&size=120&bold=true"
		}

		bioStr := ""
		if bio.Valid {
			bioStr = bio.String
		}

		users = append(users, map[string]interface{}{
			"id": id, "nickname": nickname, "surname": surname, "pseudo": pseudo,
			"email": email, "country": country, "isAdmin": isAdmin, "avatar": avatarStr, "bio": bioStr,
		})
	}
	isOwnerUser, _ = isOwner(pseudo)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "users": users, "isOwner": isOwnerUser})
}

// UpdateUser met à jour les informations d'un utilisateur (admin uniquement)
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		err = r.ParseForm()
		if err != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors du parsing du formulaire"})
			return
		}
	}
	pseudo := r.URL.Query().Get("pseudo")
	if pseudo == "" {
		pseudo = r.FormValue("adminPseudo")
	}
	if pseudo == "" {
		pseudo = r.FormValue("pseudo")
	}
	if pseudo == "" {
		pseudo = config.Player1Name
	}
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Non autorisé"})
		return
	}
	var isAdmin bool
	var isOwnerUser bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)
	if err != nil || (!isAdmin && !isOwnerUser) {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Accès refusé - Admin ou Propriétaire requis"})
		return
	}
	userIDStr := r.FormValue("userId")
	if userIDStr == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "ID utilisateur requis"})
		return
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "ID utilisateur invalide"})
		return
	}
	nickname := r.FormValue("nickname")
	surname := r.FormValue("surname")
	userPseudo := r.FormValue("pseudo")
	email := r.FormValue("email")
	country := r.FormValue("country")
	bio := r.FormValue("bio")
	password := r.FormValue("password")
	isAdminStr := r.FormValue("isAdmin")
	userIsAdmin := isAdminStr == "true" || isAdminStr == "1"
	if userPseudo == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Le pseudo ne peut pas être vide"})
		return
	}
	adminPseudo := pseudo
	isOwnerUser, err = isOwner(adminPseudo)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de la vérification des permissions"})
		return
	}
	var oldIsAdmin bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE) FROM login WHERE id = ?", userID).Scan(&oldIsAdmin)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Utilisateur non trouvé"})
		return
	}
	if userIsAdmin != oldIsAdmin && !isOwnerUser {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Seul le propriétaire peut modifier les droits administrateur"})
		return
	}
	if password != "" {
		hashed, hashErr := auth.HashPassword(password)
		if hashErr != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors du hachage du mot de passe"})
			return
		}
		_, err = config.DB.Exec("UPDATE login SET nickname = ?, surname = ?, pseudo = ?, email = ?, country = ?, bio = ?, is_admin = ?, password = ? WHERE id = ?",
			nickname, surname, userPseudo, email, country, bio, userIsAdmin, hashed, userID)
	} else {
		_, err = config.DB.Exec("UPDATE login SET nickname = ?, surname = ?, pseudo = ?, email = ?, country = ?, bio = ?, is_admin = ? WHERE id = ?",
			nickname, surname, userPseudo, email, country, bio, userIsAdmin, userID)
	}
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de la mise à jour: " + err.Error()})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Utilisateur mis à jour avec succès"})
}

// DeleteUser supprime un utilisateur de la base de données (admin uniquement)
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		err = r.ParseForm()
		if err != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors du parsing du formulaire"})
			return
		}
	}
	pseudo := r.URL.Query().Get("pseudo")
	if pseudo == "" {
		pseudo = r.FormValue("adminPseudo")
	}
	if pseudo == "" {
		pseudo = r.FormValue("pseudo")
	}
	if pseudo == "" {
		pseudo = config.Player1Name
	}
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Non autorisé"})
		return
	}
	var isAdmin bool
	var isOwnerUser bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)
	if err != nil || (!isAdmin && !isOwnerUser) {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Accès refusé - Admin ou Propriétaire requis"})
		return
	}
	userIDStr := r.FormValue("userId")
	if userIDStr == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "ID utilisateur requis"})
		return
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "ID utilisateur invalide"})
		return
	}
	_, err = config.DB.Exec("DELETE FROM login WHERE id = ?", userID)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de la suppression: " + err.Error()})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Utilisateur supprimé avec succès"})
}
