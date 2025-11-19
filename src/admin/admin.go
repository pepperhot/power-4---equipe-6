package admin

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"power4/src/auth"
	"power4/src/config"
	"strconv"
)

// CheckAdmin vérifie si l'utilisateur connecté est un admin
func CheckAdmin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Récupérer le pseudo depuis les paramètres de requête ou le formulaire
	pseudo := r.URL.Query().Get("pseudo")
	if pseudo == "" {
		pseudo = r.FormValue("pseudo")
	}

	// Si pas de pseudo dans la requête, essayer avec config.Player1Name (fallback)
	if pseudo == "" {
		pseudo = config.Player1Name
	}

	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"isAdmin": false,
			"message": "Aucun utilisateur connecté",
		})
		return
	}

	var isAdmin bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"isAdmin": false,
			"message": "Erreur lors de la vérification",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"isAdmin": isAdmin,
	})
}

// GetAllUsers retourne la liste de tous les utilisateurs (admin seulement)
func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Récupérer le pseudo depuis les paramètres de requête ou le formulaire
	pseudo := r.URL.Query().Get("pseudo")
	if pseudo == "" {
		pseudo = r.FormValue("pseudo")
	}
	if pseudo == "" {
		pseudo = config.Player1Name
	}

	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Non autorisé",
		})
		return
	}

	var isAdmin bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin)
	if err != nil || !isAdmin {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin requis",
		})
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
		if avatar.Valid {
			avatarStr = avatar.String
		}

		bioStr := ""
		if bio.Valid {
			bioStr = bio.String
		}

		users = append(users, map[string]interface{}{
			"id":       id,
			"nickname": nickname,
			"surname":  surname,
			"pseudo":   pseudo,
			"email":    email,
			"country":  country,
			"isAdmin":  isAdmin,
			"avatar":   avatarStr,
			"bio":      bioStr,
		})
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"users":   users,
	})
}

// UpdateUser permet à un admin de modifier un utilisateur
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Vérifier si l'utilisateur est admin
	if config.Player1Name == "Joueur 1" || config.Player1Name == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Non autorisé",
		})
		return
	}

	var isAdmin bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE) FROM login WHERE pseudo = ?", config.Player1Name).Scan(&isAdmin)
	if err != nil || !isAdmin {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin requis",
		})
		return
	}

	// Parse form
	err = r.ParseForm()
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors du parsing du formulaire",
		})
		return
	}

	userIDStr := r.FormValue("userId")
	if userIDStr == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur requis",
		})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur invalide",
		})
		return
	}

	nickname := r.FormValue("nickname")
	surname := r.FormValue("surname")
	pseudo := r.FormValue("pseudo")
	email := r.FormValue("email")
	country := r.FormValue("country")
	bio := r.FormValue("bio")
	password := r.FormValue("password")
	isAdminStr := r.FormValue("isAdmin")

	// Convertir isAdmin string en bool
	userIsAdmin := isAdminStr == "true" || isAdminStr == "1"

	if pseudo == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Le pseudo ne peut pas être vide",
		})
		return
	}

	// Si un nouveau mot de passe est fourni, le hasher et l'enregistrer
	if password != "" {
		hashed, hashErr := auth.HashPassword(password)
		if hashErr != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Erreur lors du hachage du mot de passe",
			})
			return
		}

		_, err = config.DB.Exec("UPDATE login SET nickname = ?, surname = ?, pseudo = ?, email = ?, country = ?, bio = ?, is_admin = ?, password = ? WHERE id = ?",
			nickname, surname, pseudo, email, country, bio, userIsAdmin, hashed, userID)
	} else {
		// Mettre à jour sans changer le mot de passe
		_, err = config.DB.Exec("UPDATE login SET nickname = ?, surname = ?, pseudo = ?, email = ?, country = ?, bio = ?, is_admin = ? WHERE id = ?",
			nickname, surname, pseudo, email, country, bio, userIsAdmin, userID)
	}

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la mise à jour: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Utilisateur mis à jour avec succès",
	})
}

// DeleteUser permet à un admin de supprimer un utilisateur
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Vérifier si l'utilisateur est admin
	if config.Player1Name == "Joueur 1" || config.Player1Name == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Non autorisé",
		})
		return
	}

	var isAdmin bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE) FROM login WHERE pseudo = ?", config.Player1Name).Scan(&isAdmin)
	if err != nil || !isAdmin {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin requis",
		})
		return
	}

	// Parse form
	err = r.ParseForm()
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors du parsing du formulaire",
		})
		return
	}

	userIDStr := r.FormValue("userId")
	if userIDStr == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur requis",
		})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur invalide",
		})
		return
	}

	// Supprimer l'utilisateur
	_, err = config.DB.Exec("DELETE FROM login WHERE id = ?", userID)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la suppression: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Utilisateur supprimé avec succès",
	})
}
