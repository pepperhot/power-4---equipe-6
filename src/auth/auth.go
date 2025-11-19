package auth

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"power4/src/config"
)

// HandleLogin gère la connexion des utilisateurs
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
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Identifiants incorrects",
		})
		return
	} else if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur serveur",
		})
		return
	}

	// Vérifier le mot de passe
	if !CheckPasswordHash(storedHash, password) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Identifiants incorrects",
		})
		return
	}

	// Mettre à jour le pseudo du joueur 1
	config.Player1Name = pseudo

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"pseudo":  pseudo,
		"isAdmin": isAdmin,
		"message": "Connexion réussie",
	})
}

// HandleRegister gère l'inscription des nouveaux utilisateurs
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
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Le pseudo doit contenir au moins 3 caractères",
		})
		return
	}

	var exists int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM login WHERE email = ?", email).Scan(&exists)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur serveur",
		})
		return
	}

	if exists > 0 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Cet email est déjà utilisé",
		})
		return
	}

	// Hacher le mot de passe avant de le stocker
	hashed, hashErr := HashPassword(password)
	if hashErr != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur serveur",
		})
		return
	}

	_, err = config.DB.Exec("INSERT INTO login (nickname, surname, country, pseudo, email, password) VALUES (?, ?, ?, ?, ?, ?)",
		nickname, surname, country, pseudo, email, hashed)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de l'inscription",
		})
		return
	}

	// Mettre à jour le pseudo du joueur 1 après inscription
	config.Player1Name = pseudo

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"pseudo":  pseudo,
		"message": "Inscription réussie",
	})
}
