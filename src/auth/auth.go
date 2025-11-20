package auth

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/url"
	"power4/src/config"
)

// HandleLogin gère la connexion d'un utilisateur en vérifiant email et mot de passe
func HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := r.FormValue("email")
	password := r.FormValue("password")

	var pseudo string
	var storedHash string
	var isAdmin bool
	err := config.DB.QueryRow("SELECT pseudo, password, COALESCE(is_admin, FALSE) FROM login WHERE email = ?", email).Scan(&pseudo, &storedHash, &isAdmin)

	w.Header().Set("Content-Type", "application/json")
	if err == sql.ErrNoRows {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Identifiants incorrects"})
		return
	} else if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur serveur"})
		return
	}
	if !CheckPasswordHash(storedHash, password) {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Identifiants incorrects"})
		return
	}
	config.Player1Name = pseudo
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "pseudo": pseudo, "isAdmin": isAdmin, "message": "Connexion réussie"})
}

// HandleRegister crée un nouveau compte utilisateur avec avatar par défaut
func HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	nickname := r.FormValue("prenom")
	surname := r.FormValue("nom")
	country := r.FormValue("pays")
	pseudo := r.FormValue("pseudo")
	email := r.FormValue("email")
	password := r.FormValue("password")

	w.Header().Set("Content-Type", "application/json")
	if len(pseudo) < 3 {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Le pseudo doit contenir au moins 3 caractères"})
		return
	}
	var exists int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM login WHERE email = ?", email).Scan(&exists)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur serveur"})
		return
	}
	if exists > 0 {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Cet email est déjà utilisé"})
		return
	}
	hashed, hashErr := HashPassword(password)
	if hashErr != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur serveur"})
		return
	}
	defaultAvatar := "https://ui-avatars.com/api/?name=" + url.QueryEscape(pseudo) + "&background=667eea&color=fff&size=120&bold=true"
	_, err = config.DB.Exec("INSERT INTO login (nickname, surname, country, pseudo, email, password, avatar, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)",
		nickname, surname, country, pseudo, email, hashed, defaultAvatar)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de l'inscription"})
		return
	}
	config.Player1Name = pseudo
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "pseudo": pseudo, "message": "Inscription réussie"})
}
