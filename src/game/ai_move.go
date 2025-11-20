package game

import (
	"encoding/json"
	"net/http"
	"power4/src/ai"
	"power4/src/config"
)

// HandleAIMove gère le placement automatique d'un jeton par l'IA
func HandleAIMove(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	if config.CurrentPlayer != "J" {
		json.NewEncoder(w).Encode(map[string]string{"error": "Not AI's turn"})
		return
	}
	if len(config.Player2Name) < 2 || config.Player2Name[:2] != "IA" {
		json.NewEncoder(w).Encode(map[string]string{"error": "AI not active"})
		return
	}
	if config.Winner != "" {
		json.NewEncoder(w).Encode(map[string]string{"error": "Game over"})
		return
	}
	rows, cols := config.GetDimensions()
	col := ai.GetBestMove()
	if col < 0 || col >= cols {
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid column from AI"})
		return
	}
	row := -1
	if config.CurrentMode == "gravity" {
		for i := 0; i < rows; i++ {
			if config.Grid[i][col] == "" {
				row = i
				break
			}
		}
	} else {
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
	config.Grid[row][col] = config.CurrentPlayer
	config.DB.Exec("INSERT INTO grille (ligne, colonne, joueur) VALUES (?, ?, ?)", row, col, config.CurrentPlayer)
	if CheckWin(row, col) {
		config.Winner = config.CurrentPlayer
	} else {
		config.CurrentPlayer = "R"
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, "grid": config.Grid, "current": config.CurrentPlayer,
		"winner": config.Winner, "aiMove": true, "col": col, "row": row,
	})
}

