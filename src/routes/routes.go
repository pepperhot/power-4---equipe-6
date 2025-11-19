package routes

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"path/filepath"
	"power4/src/admin"
	"power4/src/auth"
	"power4/src/config"
	"power4/src/game"
	"strings"
)

// ServeStatic sert les fichiers statiques (HTML, CSS, JS)
func ServeStatic(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "/login.html"
	}

	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".html":
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
	case ".css":
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	}

	http.ServeFile(w, r, "."+path)
}

// ServeLogin sert la page de login
func ServeLogin(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./temp/login/login.html")
}

// ServeHomepage sert la page d'accueil
func ServeHomepage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./temp/homepage/homepage.html")
}

// ServeDashboard sert la page du dashboard admin
func ServeDashboard(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./temp/admin/dashboard.html")
}

// GetPlayers retourne les noms des joueurs
func GetPlayers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"name1": config.Player1Name,
		"name2": config.Player2Name,
	})
}

// GetWinner retourne le gagnant actuel
func GetWinner(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"winner": config.Winner,
	})
}

// GetProfile retourne les informations du profil utilisateur
func GetProfile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Si aucun utilisateur n'est connecté, retourner des valeurs par défaut
	if config.Player1Name == "Joueur 1" || config.Player1Name == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":   false,
			"message":   "Aucun utilisateur connecté",
			"firstName": "Jean",
			"lastName":  "Dupont",
			"pseudo":    "jdupont",
			"country":   "",
			"avatar":    "",
			"bio":       "",
		})
		return
	}

	var firstName, lastName, pseudo, country string
	var avatar sql.NullString
	var bio sql.NullString

	err := config.DB.QueryRow("SELECT nickname, surname, pseudo, country, avatar, bio FROM login WHERE pseudo = ?", config.Player1Name).
		Scan(&firstName, &lastName, &pseudo, &country, &avatar, &bio)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Utilisateur non trouvé",
		})
		return
	}

	avatarStr := ""
	if avatar.Valid {
		avatarStr = avatar.String
	}

	bioStr := ""
	if bio.Valid {
		bioStr = bio.String
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"firstName": firstName,
		"lastName":  lastName,
		"pseudo":    pseudo,
		"country":   country,
		"avatar":    avatarStr,
		"bio":       bioStr,
	})
}

// UpdateProfile met à jour les informations du profil utilisateur
func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Si aucun utilisateur n'est connecté
	if config.Player1Name == "Joueur 1" || config.Player1Name == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Aucun utilisateur connecté",
		})
		return
	}

	// Parse multipart form pour gérer l'upload de fichier
	err := r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		// Si pas de multipart, essayer form classique
		r.ParseForm()
	}

	firstName := r.FormValue("firstName")
	lastName := r.FormValue("lastName")
	newPseudo := r.FormValue("pseudo")
	bio := r.FormValue("bio")
	avatarData := r.FormValue("avatar") // Pour data URL base64

	if newPseudo == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Le pseudo ne peut pas être vide",
		})
		return
	}

	// Gérer l'upload de fichier image si présent
	file, _, err := r.FormFile("avatarFile")
	if err == nil {
		defer file.Close()
		// Lire l'image
		imageData, err := io.ReadAll(file)
		if err == nil {
			// Convertir en base64 pour stockage
			avatarData = "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(imageData)
		}
	}

	// Mettre à jour la base de données avec avatar et bio
	_, err = config.DB.Exec("UPDATE login SET nickname = ?, surname = ?, pseudo = ?, avatar = ?, bio = ? WHERE pseudo = ?",
		firstName, lastName, newPseudo, avatarData, bio, config.Player1Name)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la mise à jour: " + err.Error(),
		})
		return
	}

	// Mettre à jour le pseudo en mémoire si changé
	config.Player1Name = newPseudo

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Profil mis à jour avec succès",
	})
}

// WayLink configure toutes les routes de l'application
func WayLink() {
	http.HandleFunc("/", ServeStatic)
	http.HandleFunc("/login", ServeLogin)
	http.HandleFunc("/connect", auth.HandleLogin)
	http.HandleFunc("/register", auth.HandleRegister)
	http.HandleFunc("/homepage", ServeHomepage)
	http.HandleFunc("/dashboard", ServeDashboard)
	http.HandleFunc("/players", GetPlayers)
	http.HandleFunc("/winner", GetWinner)
	http.HandleFunc("/profile", GetProfile)
	http.HandleFunc("/profile/update", UpdateProfile)
	http.HandleFunc("/admin/check", admin.CheckAdmin)
	http.HandleFunc("/admin/users", admin.GetAllUsers)
	http.HandleFunc("/admin/user/update", admin.UpdateUser)
	http.HandleFunc("/admin/user/delete", admin.DeleteUser)
	http.HandleFunc("/start", game.HandleStart)
	http.HandleFunc("/click", game.HandleClick)
	http.HandleFunc("/state", game.GetState)
	http.HandleFunc("/reset", game.ResetGame)
}
