package game

import (
	"encoding/json"
	"log"
	"net/http"
	"power4/src/ai"
	"power4/src/config"
)

// HandleStart initialise une nouvelle partie selon le mode
func HandleStart(w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "normal"
	}

	aiLevel := r.URL.Query().Get("aiLevel")
	
	// Définir le niveau de l'IA
	ai.SetLevel(aiLevel)
	
	config.CurrentMode = mode
	rows, cols := config.GetDimensions()

	// Supprimer les données de la base de données pour réinitialiser complètement
	_, err := config.DB.Exec("DELETE FROM grille")
	if err != nil {
		log.Println("Erreur lors de la suppression de la grille:", err)
	}

	// Vide la grille en mémoire
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			config.Grid[i][j] = ""
		}
	}

	config.CurrentPlayer = "R"
	config.Winner = ""

	// Définir le nom du joueur 2 selon le niveau IA
	// Si un niveau IA est spécifié (même vide car SetLevel gère le défaut), utiliser le nom de l'IA
	// Sinon, garder "Joueur 2" par défaut
	if aiLevel != "" {
		config.Player2Name = ai.GetAIName()
	} else {
		config.Player2Name = "Joueur 2"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "started",
		"mode":        mode,
		"aiLevel":     ai.GetLevel(),
		"player2Name": config.Player2Name, // Debug: retourner le nom du joueur 2
	})
}
