package game

import (
	"encoding/json"
	"net/http"
	"power4/src/config"
)

// HandleStart initialise une nouvelle partie selon le mode
func HandleStart(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "normal"
	}

	config.CurrentMode = mode
	rows, cols := config.GetDimensions()

	// Vide la grille
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			config.Grid[i][j] = ""
		}
	}

	config.CurrentPlayer = "R"
	config.Winner = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "started",
		"mode":   mode,
	})
}
