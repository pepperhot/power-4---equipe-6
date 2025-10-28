package game

import (
	"encoding/json"
	"log"
	"net/http"
	"power4/src/config"
	"strconv"
)

// HandleClick gère les clics sur la grille de jeu
func HandleClick(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}

	rows, cols := config.GetDimensions()

	colStr := r.FormValue("col")
	col, err := strconv.Atoi(colStr)
	if err != nil || col < 0 || col >= cols {
		http.Error(w, "Invalid column", http.StatusBadRequest)
		return
	}

	if config.Winner != "" {
		json.NewEncoder(w).Encode(map[string]string{"error": "Game over"})
		return
	}

	row := -1
	for i := rows - 1; i >= 0; i-- {
		if config.Grid[i][col] == "" {
			row = i
			break
		}
	}

	if row == -1 {
		json.NewEncoder(w).Encode(map[string]string{"error": "Column full"})
		return
	}

	config.Grid[row][col] = config.CurrentPlayer

	_, err = config.DB.Exec("INSERT INTO grille (ligne, colonne, joueur) VALUES (?, ?, ?)", row, col, config.CurrentPlayer)
	if err != nil {
		log.Println("DB error:", err)
	}

	if CheckWin(row, col) {
		config.Winner = config.CurrentPlayer
	} else {
		if config.CurrentPlayer == "R" {
			config.CurrentPlayer = "J"
		} else {
			config.CurrentPlayer = "R"
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"grid":    config.Grid,
		"current": config.CurrentPlayer,
		"winner":  config.Winner,
	})
}

// GetState récupère l'état actuel du jeu depuis la base de données
func GetState(w http.ResponseWriter, r *http.Request) {
	rows, cols := config.GetDimensions()

	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			config.Grid[i][j] = ""
		}
	}
	config.CurrentPlayer = "R"
	config.Winner = ""

	dbRows, err := config.DB.Query("SELECT ligne, colonne, joueur FROM grille ORDER BY id")
	if err != nil {
		log.Println("Query error:", err)
	} else {
		defer dbRows.Close()
		for dbRows.Next() {
			var ligne, colonne int
			var joueur string
			if err := dbRows.Scan(&ligne, &colonne, &joueur); err == nil {
				if ligne < rows && colonne < cols {
					config.Grid[ligne][colonne] = joueur
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"grid":    config.Grid,
		"current": config.CurrentPlayer,
		"winner":  config.Winner,
	})
}

// ResetGame remet à zéro la partie
func ResetGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}

	rows, cols := config.GetDimensions()

	_, err := config.DB.Exec("DELETE FROM grille")
	if err != nil {
		log.Println("Reset error:", err)
	}

	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			config.Grid[i][j] = ""
		}
	}
	config.CurrentPlayer = "R"
	config.Winner = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// CheckWin vérifie si un joueur a gagné
func CheckWin(row, col int) bool {
	rows, cols := config.GetDimensions()
	player := config.Grid[row][col]
	target := config.GetWinLength()

	check := func(dr, dc int) bool {
		count := 1
		for i := 1; i < target; i++ {
			r, c := row+dr*i, col+dc*i
			if r < 0 || r >= rows || c < 0 || c >= cols || config.Grid[r][c] != player {
				break
			}
			count++
		}
		for i := 1; i < target; i++ {
			r, c := row-dr*i, col-dc*i
			if r < 0 || r >= rows || c < 0 || c >= cols || config.Grid[r][c] != player {
				break
			}
			count++
		}
		return count >= target
	}

	return check(0, 1) || check(1, 0) || check(1, 1) || check(1, -1)
}
