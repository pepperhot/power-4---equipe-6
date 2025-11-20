package game

import (
	"encoding/json"
	"log"
	"net/http"
	"power4/src/ai"
	"power4/src/config"
)

// HandleAIMove fait jouer l'IA automatiquement
func HandleAIMove(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}

	// Vérifier que c'est bien le tour de l'IA
	if config.CurrentPlayer != "J" {
		json.NewEncoder(w).Encode(map[string]string{"error": "Not AI's turn"})
		return
	}

	// Vérifier que l'IA est bien active (vérifier si Player2Name commence par "IA")
	if len(config.Player2Name) < 2 || config.Player2Name[:2] != "IA" {
		json.NewEncoder(w).Encode(map[string]string{"error": "AI not active"})
		return
	}

	if config.Winner != "" {
		json.NewEncoder(w).Encode(map[string]string{"error": "Game over"})
		return
	}

	rows, cols := config.GetDimensions()

	// Obtenir le meilleur coup de l'IA
	col := ai.GetBestMove()

	// Vérifier que la colonne est valide
	if col < 0 || col >= cols {
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid column from AI"})
		return
	}

	// Trouver la ligne où placer le jeton
	row := -1
	if config.CurrentMode == "gravity" {
		// Gravité inversée: on remplit depuis le haut
		for i := 0; i < rows; i++ {
			if config.Grid[i][col] == "" {
				row = i
				break
			}
		}
	} else {
		// Gravité normale: on remplit depuis le bas
		for i := rows - 1; i >= 0; i-- {
			if config.Grid[i][col] == "" {
				row = i
				break
			}
		}
	}

	if row == -1 {
		json.NewEncoder(w).Encode(map[string]string{"error": "Column full"})
		return
	}

	// Placer le jeton de l'IA
	config.Grid[row][col] = config.CurrentPlayer

	// Sauvegarder dans la base de données
	_, err := config.DB.Exec("INSERT INTO grille (ligne, colonne, joueur) VALUES (?, ?, ?)", row, col, config.CurrentPlayer)
	if err != nil {
		log.Println("DB error:", err)
	}

	// Vérifier si l'IA a gagné
	if CheckWin(row, col) {
		config.Winner = config.CurrentPlayer
	} else {
		// Passer au tour du joueur humain
		config.CurrentPlayer = "R"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"grid":    config.Grid,
		"current": config.CurrentPlayer,
		"winner":  config.Winner,
		"aiMove":  true,
		"col":     col,
		"row":     row,
	})
}

