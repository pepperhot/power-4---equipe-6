package routes

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"power4/src/config"
	"strings"
)

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

func ServeLogin(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./temp/login/login.html")
}

func ServeHomepage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./temp/homepage/homepage.html")
}

// GetPlayers retourne les noms des joueurs
func GetPlayers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"name1": config.Player1Name,
		"name2": config.Player2Name,
	})
}

// GetWinner vérifie s'il y a un gagnant
func GetWinner(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"winner": config.Winner,
	})
}
