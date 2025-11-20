package game

import (
	"encoding/json"
	"net/http"
	"power4/src/ai"
	"power4/src/config"
)

// HandleStart initialise une nouvelle partie avec le mode et le niveau IA choisis
func HandleStart(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "normal"
	}
	aiLevel := r.URL.Query().Get("aiLevel")
	ai.SetLevel(aiLevel)
	config.CurrentMode = mode
	rows, cols := config.GetDimensions()
	config.DB.Exec("DELETE FROM grille")
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			config.Grid[i][j] = ""
		}
	}
	config.CurrentPlayer = "R"
	config.Winner = ""
	if aiLevel != "" {
		config.Player2Name = ai.GetAIName()
	} else {
		config.Player2Name = "Joueur 2"
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "started", "mode": mode, "aiLevel": ai.GetLevel(), "player2Name": config.Player2Name,
	})
}
