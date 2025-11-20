package admin

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"power4/src/auth"
	"power4/src/config"
	"strconv"
)

// isOwner vérifie si l'utilisateur est le propriétaire (utilisateur avec is_owner = TRUE)
func isOwner(pseudo string) (bool, error) {
	var isOwnerUser bool
	err := config.DB.QueryRow("SELECT COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isOwnerUser)
	if err != nil {
		return false, err
	}

	return isOwnerUser, nil
}

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
	var isOwnerUser bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"isAdmin": false,
			"message": "Erreur lors de la vérification",
		})
		return
	}

	// L'utilisateur peut accéder au dashboard s'il est admin OU propriétaire
	canAccess := isAdmin || isOwnerUser

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"isAdmin": canAccess,
		"isOwner": isOwnerUser,
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
	var isOwnerUser bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)
	if err != nil || (!isAdmin && !isOwnerUser) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin ou Propriétaire requis",
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

	// Vérifier si l'utilisateur actuel est le propriétaire
	isOwnerUser, _ = isOwner(pseudo)
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"users":   users,
		"isOwner": isOwnerUser,
	})
}

// UpdateUser permet à un admin de modifier un utilisateur
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	log.Println("🔵 [UPDATE] Début de UpdateUser")
	
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Parse multipart form (FormData)
	err := r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		// Si erreur, essayer avec ParseForm (pour les formulaires classiques)
		err = r.ParseForm()
		if err != nil {
			log.Println("❌ [UPDATE] Erreur lors du parsing du formulaire:", err)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Erreur lors du parsing du formulaire",
			})
			return
		}
	}

	// Récupérer le pseudo de l'admin connecté depuis les paramètres de requête ou le formulaire
	pseudo := r.URL.Query().Get("pseudo")
	log.Println("🔵 [UPDATE] pseudo depuis URL.Query:", pseudo)
	if pseudo == "" {
		pseudo = r.FormValue("adminPseudo") // Champ spécifique pour l'admin connecté
		log.Println("🔵 [UPDATE] pseudo depuis FormValue(adminPseudo):", pseudo)
	}
	if pseudo == "" {
		pseudo = r.FormValue("pseudo") // Fallback sur le champ pseudo
		log.Println("🔵 [UPDATE] pseudo depuis FormValue(pseudo):", pseudo)
	}
	if pseudo == "" {
		pseudo = config.Player1Name
		log.Println("🔵 [UPDATE] pseudo depuis config.Player1Name:", pseudo)
	}

	log.Println("🔵 [UPDATE] pseudo final utilisé pour l'authentification:", pseudo)

	if pseudo == "" || pseudo == "Joueur 1" {
		log.Println("❌ [UPDATE] Pseudo vide ou invalide")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Non autorisé",
		})
		return
	}

	var isAdmin bool
	var isOwnerUser bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)
	log.Println("🔵 [UPDATE] Résultat authentification - isAdmin:", isAdmin, "isOwnerUser:", isOwnerUser, "err:", err)
	if err != nil || (!isAdmin && !isOwnerUser) {
		log.Println("❌ [UPDATE] Accès refusé - Admin ou Propriétaire requis, err:", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin ou Propriétaire requis",
		})
		return
	}

	userIDStr := r.FormValue("userId")
	log.Println("🔵 [UPDATE] userId depuis FormValue:", userIDStr)
	if userIDStr == "" {
		log.Println("❌ [UPDATE] ID utilisateur requis - userIDStr est vide")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur requis",
		})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		log.Println("❌ [UPDATE] ID utilisateur invalide:", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur invalide",
		})
		return
	}
	log.Println("🔵 [UPDATE] userID converti:", userID)

	nickname := r.FormValue("nickname")
	surname := r.FormValue("surname")
	userPseudo := r.FormValue("pseudo")
	email := r.FormValue("email")
	country := r.FormValue("country")
	bio := r.FormValue("bio")
	password := r.FormValue("password")
	isAdminStr := r.FormValue("isAdmin")

	log.Println("🔵 [UPDATE] Données du formulaire:")
	log.Println("  - nickname:", nickname)
	log.Println("  - surname:", surname)
	log.Println("  - userPseudo:", userPseudo)
	log.Println("  - email:", email)
	log.Println("  - country:", country)
	log.Println("  - isAdminStr:", isAdminStr)
	log.Println("  - password fourni:", password != "")

	// Convertir isAdmin string en bool
	userIsAdmin := isAdminStr == "true" || isAdminStr == "1"
	log.Println("🔵 [UPDATE] userIsAdmin:", userIsAdmin)

	if userPseudo == "" {
		log.Println("❌ [UPDATE] Le pseudo ne peut pas être vide")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Le pseudo ne peut pas être vide",
		})
		return
	}

	// Vérifier si l'utilisateur actuel (admin) est le propriétaire
	adminPseudo := pseudo
	isOwnerUser, err = isOwner(adminPseudo)
	log.Println("🔵 [UPDATE] isOwnerUser après vérification:", isOwnerUser)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la vérification des permissions",
		})
		return
	}

	// Récupérer l'ancien statut admin de l'utilisateur à modifier
	var oldIsAdmin bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE) FROM login WHERE id = ?", userID).Scan(&oldIsAdmin)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Utilisateur non trouvé",
		})
		return
	}

	// Seul le propriétaire peut modifier les droits admin
	if userIsAdmin != oldIsAdmin && !isOwnerUser {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Seul le propriétaire peut modifier les droits administrateur",
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
			nickname, surname, userPseudo, email, country, bio, userIsAdmin, hashed, userID)
	} else {
		// Mettre à jour sans changer le mot de passe
		_, err = config.DB.Exec("UPDATE login SET nickname = ?, surname = ?, pseudo = ?, email = ?, country = ?, bio = ?, is_admin = ? WHERE id = ?",
			nickname, surname, userPseudo, email, country, bio, userIsAdmin, userID)
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
	log.Println("🔴 [DELETE] Début de DeleteUser")
	
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Parse multipart form (FormData)
	err := r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		// Si erreur, essayer avec ParseForm (pour les formulaires classiques)
		err = r.ParseForm()
		if err != nil {
			log.Println("❌ [DELETE] Erreur lors du parsing du formulaire:", err)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Erreur lors du parsing du formulaire",
			})
			return
		}
	}

	// Récupérer le pseudo de l'admin connecté depuis les paramètres de requête ou le formulaire
	pseudo := r.URL.Query().Get("pseudo")
	log.Println("🔴 [DELETE] pseudo depuis URL.Query:", pseudo)
	if pseudo == "" {
		pseudo = r.FormValue("adminPseudo") // Champ spécifique pour l'admin connecté
		log.Println("🔴 [DELETE] pseudo depuis FormValue(adminPseudo):", pseudo)
	}
	if pseudo == "" {
		pseudo = r.FormValue("pseudo") // Fallback sur le champ pseudo
		log.Println("🔴 [DELETE] pseudo depuis FormValue(pseudo):", pseudo)
	}
	if pseudo == "" {
		pseudo = config.Player1Name
		log.Println("🔴 [DELETE] pseudo depuis config.Player1Name:", pseudo)
	}

	log.Println("🔴 [DELETE] pseudo final utilisé pour l'authentification:", pseudo)

	if pseudo == "" || pseudo == "Joueur 1" {
		log.Println("❌ [DELETE] Pseudo vide ou invalide")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Non autorisé",
		})
		return
	}

	var isAdmin bool
	var isOwnerUser bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwnerUser)
	if err != nil || (!isAdmin && !isOwnerUser) {
		log.Println("❌ [DELETE] Accès refusé - Admin ou Propriétaire requis, err:", err, "isAdmin:", isAdmin, "isOwner:", isOwnerUser)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin ou Propriétaire requis",
		})
		return
	}

	log.Println("✅ [DELETE] Authentification réussie - isAdmin:", isAdmin, "isOwner:", isOwnerUser)

	// Afficher tous les champs du formulaire reçus
	log.Println("🔴 [DELETE] Tous les champs du formulaire:")
	for key, values := range r.Form {
		log.Printf("  - %s: %v", key, values)
	}
	
	userIDStr := r.FormValue("userId")
	log.Println("🔴 [DELETE] userId reçu:", userIDStr)
	if userIDStr == "" {
		log.Println("❌ [DELETE] userId est vide!")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur requis",
		})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		log.Println("❌ [DELETE] Erreur conversion userId:", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID utilisateur invalide",
		})
		return
	}
	log.Println("🔴 [DELETE] userId converti en int:", userID)

	// Supprimer l'utilisateur
	_, err = config.DB.Exec("DELETE FROM login WHERE id = ?", userID)

	if err != nil {
		log.Println("❌ [DELETE] Erreur lors de la suppression:", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la suppression: " + err.Error(),
		})
		return
	}

	log.Println("✅ [DELETE] Utilisateur supprimé avec succès")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Utilisateur supprimé avec succès",
	})
}
