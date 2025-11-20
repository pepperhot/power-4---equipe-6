package ai

import (
	"math/rand"
	"power4/src/config"
	"time"
)

var Level = "medium"

// SetLevel définit le niveau de difficulté de l'IA
func SetLevel(level string) {
	if level == "" {
		level = "medium"
	}
	Level = level
}

// GetLevel retourne le niveau de difficulté actuel de l'IA
func GetLevel() string {
	return Level
}

// GetAIName retourne le nom de l'IA selon son niveau
func GetAIName() string {
	switch Level {
	case "easy":
		return "IA Facile"
	case "medium":
		return "IA Moyen"
	case "hard":
		return "IA Difficile"
	case "impossible":
		return "IA Impossible"
	default:
		return "IA"
	}
}

// IsValidLevel vérifie si un niveau de difficulté est valide
func IsValidLevel(level string) bool {
	switch level {
	case "easy", "medium", "hard", "impossible":
		return true
	default:
		return false
	}
}

// GetBestMove calcule le meilleur coup pour l'IA selon son niveau
func GetBestMove() int {
	rows, cols := config.GetDimensions()
	aiPlayer := "J"
	humanPlayer := "R"
	switch Level {
	case "easy":
		return getEasyMove(cols)
	case "medium":
		return getMediumMove(rows, cols, aiPlayer, humanPlayer)
	case "hard":
		return getHardMove(rows, cols, aiPlayer, humanPlayer)
	case "impossible":
		return getImpossibleMove(rows, cols, aiPlayer, humanPlayer)
	default:
		return getMediumMove(rows, cols, aiPlayer, humanPlayer)
	}
}

// getEasyMove génère un coup aléatoire pour le niveau facile
func getEasyMove(cols int) int {
	rand.Seed(time.Now().UnixNano())
	if rand.Float32() < 0.7 {
		return rand.Intn(cols)
	}
	validCols := getValidColumns(cols)
	if len(validCols) > 0 {
		return validCols[rand.Intn(len(validCols))]
	}
	return rand.Intn(cols)
}

// getMediumMove calcule un coup stratégique pour le niveau moyen
func getMediumMove(rows, cols int, aiPlayer, humanPlayer string) int {
	if col := canWin(rows, cols, aiPlayer); col != -1 {
		return col
	}
	if col := canWin(rows, cols, humanPlayer); col != -1 {
		return col
	}
	center := cols / 2
	validCols := getValidColumns(cols)
	if len(validCols) == 0 {
		return center
	}
	preferredCols := []int{center}
	if center > 0 {
		preferredCols = append(preferredCols, center-1)
	}
	if center < cols-1 {
		preferredCols = append(preferredCols, center+1)
	}
	for _, prefCol := range preferredCols {
		if isValidColumn(prefCol, cols) {
			return prefCol
		}
	}
	return validCols[rand.Intn(len(validCols))]
}

// getHardMove calcule un coup optimisé avec minimax pour le niveau difficile
func getHardMove(rows, cols int, aiPlayer, humanPlayer string) int {
	if col := canWin(rows, cols, aiPlayer); col != -1 {
		return col
	}
	if col := canWin(rows, cols, humanPlayer); col != -1 {
		return col
	}
	bestCol := -1
	bestScore := -10000
	validCols := getValidColumns(cols)
	for _, col := range validCols {
		row := getDropRow(col, rows)
		if row == -1 {
			continue
		}
		config.Grid[row][col] = aiPlayer
		score := minimax(rows, cols, 4, false, aiPlayer, humanPlayer, -10000, 10000)
		config.Grid[row][col] = ""
		if score > bestScore {
			bestScore = score
			bestCol = col
		}
	}
	if bestCol != -1 {
		return bestCol
	}
	center := cols / 2
	if isValidColumn(center, cols) {
		return center
	}
	if len(validCols) > 0 {
		return validCols[rand.Intn(len(validCols))]
	}
	return cols / 2
}

// getImpossibleMove calcule le meilleur coup avec minimax profond pour le niveau impossible
func getImpossibleMove(rows, cols int, aiPlayer, humanPlayer string) int {
	if col := canWin(rows, cols, aiPlayer); col != -1 {
		return col
	}
	if col := canWin(rows, cols, humanPlayer); col != -1 {
		return col
	}
	bestCol := -1
	bestScore := -10000
	validCols := getValidColumns(cols)
	for _, col := range validCols {
		row := getDropRow(col, rows)
		if row == -1 {
			continue
		}
		config.Grid[row][col] = aiPlayer
		score := minimax(rows, cols, 6, false, aiPlayer, humanPlayer, -10000, 10000)
		config.Grid[row][col] = ""
		if score > bestScore {
			bestScore = score
			bestCol = col
		}
	}
	if bestCol != -1 {
		return bestCol
	}
	center := cols / 2
	if isValidColumn(center, cols) {
		return center
	}
	if len(validCols) > 0 {
		return validCols[rand.Intn(len(validCols))]
	}
	return cols / 2
}

// canWin vérifie si un joueur peut gagner au prochain coup
func canWin(rows, cols int, player string) int {
	validCols := getValidColumns(cols)
	for _, col := range validCols {
		row := getDropRow(col, rows)
		if row == -1 {
			continue
		}
		config.Grid[row][col] = player
		won := checkWinSimulation(row, col, rows, cols, player)
		config.Grid[row][col] = ""
		if won {
			return col
		}
	}
	return -1
}

// checkWinSimulation simule un coup et vérifie s'il crée un alignement gagnant
func checkWinSimulation(row, col, rows, cols int, player string) bool {
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

// minimax implémente l'algorithme minimax avec élagage alpha-bêta pour trouver le meilleur coup
func minimax(rows, cols, depth int, isMaximizing bool, aiPlayer, humanPlayer string, alpha, beta int) int {
	if depth == 0 {
		return evaluateBoard(rows, cols, aiPlayer, humanPlayer)
	}
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			if config.Grid[i][j] == aiPlayer {
				if checkWinSimulation(i, j, rows, cols, aiPlayer) {
					return 10000 + depth
				}
			} else if config.Grid[i][j] == humanPlayer {
				if checkWinSimulation(i, j, rows, cols, humanPlayer) {
					return -10000 - depth
				}
			}
		}
	}
	validCols := getValidColumns(cols)
	if len(validCols) == 0 {
		return 0
	}
	if isMaximizing {
		maxScore := -10000
		center := cols / 2
		sortedCols := make([]int, len(validCols))
		copy(sortedCols, validCols)
		for i, col := range sortedCols {
			if col == center {
				sortedCols[0], sortedCols[i] = sortedCols[i], sortedCols[0]
				break
			}
		}
		for _, col := range sortedCols {
			row := getDropRow(col, rows)
			if row == -1 {
				continue
			}
			config.Grid[row][col] = aiPlayer
			score := minimax(rows, cols, depth-1, false, aiPlayer, humanPlayer, alpha, beta)
			config.Grid[row][col] = ""
			if score > maxScore {
				maxScore = score
			}
			if score > alpha {
				alpha = score
			}
			if beta <= alpha {
				break
			}
		}
		return maxScore
	} else {
		minScore := 10000
		for _, col := range validCols {
			row := getDropRow(col, rows)
			if row == -1 {
				continue
			}
			config.Grid[row][col] = humanPlayer
			score := minimax(rows, cols, depth-1, true, aiPlayer, humanPlayer, alpha, beta)
			config.Grid[row][col] = ""
			if score < minScore {
				minScore = score
			}
			if score < beta {
				beta = score
			}
			if beta <= alpha {
				break
			}
		}
		return minScore
	}
}

// evaluateBoard évalue la position du plateau et retourne un score
func evaluateBoard(rows, cols int, aiPlayer, humanPlayer string) int {
	score := 0
	score += countThreats(rows, cols, aiPlayer) * 100
	score -= countThreats(rows, cols, humanPlayer) * 100
	center := cols / 2
	for i := 0; i < rows; i++ {
		if config.Grid[i][center] == aiPlayer {
			score += 10
		} else if config.Grid[i][center] == humanPlayer {
			score -= 10
		}
	}
	return score
}

// countThreats compte le nombre de menaces (alignements partiels) d'un joueur
func countThreats(rows, cols int, player string) int {
	count := 0
	target := config.GetWinLength()
	directions := [][]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}}
	for _, dir := range directions {
		dr, dc := dir[0], dir[1]
		for i := 0; i < rows; i++ {
			for j := 0; j < cols; j++ {
				consecutive := 0
				for k := 0; k < target; k++ {
					r, c := i+dr*k, j+dc*k
					if r >= 0 && r < rows && c >= 0 && c < cols && config.Grid[r][c] == player {
						consecutive++
					} else {
						break
					}
				}
				if consecutive >= 2 && consecutive < target {
					count++
				}
			}
		}
	}
	return count
}

// getValidColumns retourne la liste des colonnes où un jeton peut être placé
func getValidColumns(cols int) []int {
	valid := []int{}
	rows, _ := config.GetDimensions()
	for col := 0; col < cols; col++ {
		if getDropRow(col, rows) != -1 {
			valid = append(valid, col)
		}
	}
	return valid
}

// isValidColumn vérifie si une colonne peut encore recevoir un jeton
func isValidColumn(col, cols int) bool {
	if col < 0 || col >= cols {
		return false
	}
	rows, _ := config.GetDimensions()
	return getDropRow(col, rows) != -1
}

// abs retourne la valeur absolue d'un entier
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// getDropRow trouve la ligne où un jeton tombera dans une colonne donnée
func getDropRow(col, rows int) int {
	if config.CurrentMode == "gravity" {
		for i := 0; i < rows; i++ {
			if config.Grid[i][col] == "" {
				return i
			}
		}
	} else {
		for i := rows - 1; i >= 0; i-- {
			if config.Grid[i][col] == "" {
				return i
			}
		}
	}
	return -1
}
