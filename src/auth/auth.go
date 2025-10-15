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
	err := config.DB.QueryRow("SELECT pseudo FROM login WHERE email = ? AND password = ?", email, password).Scan(&pseudo)

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

	// Mettre à jour le pseudo du joueur 1
	config.Player1Name = pseudo

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"pseudo":  pseudo,
		"message": "Connexion réussie",
	})
}

// HandleRegister gère l'inscription des nouveaux utilisateurs
func HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

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

	_, err = config.DB.Exec("INSERT INTO login (pseudo, email, password) VALUES (?, ?, ?)", pseudo, email, password)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de l'inscription",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"pseudo":  pseudo,
		"message": "Inscription réussie",
	})
}
