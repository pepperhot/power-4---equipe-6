package ai

import (
	"math/rand"
	"power4/src/config"
	"time"
)

// -------------------------------
// CONFIGURATION DE L'IA
// -------------------------------

// Niveau de l'IA (facile, medium, hard, impossible)
var Level = "medium"

// SetLevel définit le niveau de l'IA
func SetLevel(level string) {
	if level == "" {
		level = "medium"
	}
	Level = level
}

// GetLevel retourne le niveau actuel de l'IA
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

// IsValidLevel vérifie si le niveau fourni est valide
func IsValidLevel(level string) bool {
	switch level {
	case "easy", "medium", "hard", "impossible":
		return true
	default:
		return false
	}
}

// -------------------------------
// FONCTIONS D'IA
// -------------------------------

// GetBestMove retourne la meilleure colonne à jouer selon le niveau de difficulté
func GetBestMove() int {
	rows, cols := config.GetDimensions()
	aiPlayer := "J" // L'IA est toujours le joueur 2 (J)
	humanPlayer := "R" // Le joueur humain est toujours le joueur 1 (R)

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

// getEasyMove : L'IA joue presque aléatoirement (avec quelques erreurs)
func getEasyMove(cols int) int {
	rand.Seed(time.Now().UnixNano())
	
	// 70% de chance de jouer aléatoirement
	// 30% de chance de jouer dans une colonne valide mais pas optimale
	if rand.Float32() < 0.7 {
		// Jouer complètement aléatoirement
		return rand.Intn(cols)
	}
	
	// Parfois jouer dans une colonne valide mais pas la meilleure
	validCols := getValidColumns(cols)
	if len(validCols) > 0 {
		// Prendre une colonne aléatoire parmi les valides
		return validCols[rand.Intn(len(validCols))]
	}
	
	return rand.Intn(cols)
}

// getMediumMove : L'IA essaie de bloquer l'adversaire et fait des alignements simples
func getMediumMove(rows, cols int, aiPlayer, humanPlayer string) int {
	// 1. Vérifier si on peut gagner
	if col := canWin(rows, cols, aiPlayer); col != -1 {
		return col
	}
	
	// 2. Vérifier si on doit bloquer l'adversaire
	if col := canWin(rows, cols, humanPlayer); col != -1 {
		return col
	}
	
	// 3. Jouer au centre ou près du centre (stratégie de base)
	center := cols / 2
	validCols := getValidColumns(cols)
	if len(validCols) == 0 {
		return center
	}
	
	// Préférer le centre et les colonnes adjacentes
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
	
	// Sinon, prendre une colonne valide aléatoire
	return validCols[rand.Intn(len(validCols))]
}

// getHardMove : Utilise minimax avec profondeur limitée
func getHardMove(rows, cols int, aiPlayer, humanPlayer string) int {
	// 1. Vérifier si on peut gagner
	if col := canWin(rows, cols, aiPlayer); col != -1 {
		return col
	}
	
	// 2. Vérifier si on doit bloquer l'adversaire
	if col := canWin(rows, cols, humanPlayer); col != -1 {
		return col
	}
	
	// 3. Utiliser minimax avec profondeur 4
	bestCol := -1
	bestScore := -10000
	
	validCols := getValidColumns(cols)
	for _, col := range validCols {
		row := getDropRow(col, rows)
		if row == -1 {
			continue
		}
		
		// Simuler le coup
		config.Grid[row][col] = aiPlayer
		score := minimax(rows, cols, 4, false, aiPlayer, humanPlayer, -10000, 10000)
		config.Grid[row][col] = "" // Annuler le coup
		
		if score > bestScore {
			bestScore = score
			bestCol = col
		}
	}
	
	if bestCol != -1 {
		return bestCol
	}
	
	// Fallback : jouer au centre
	center := cols / 2
	if isValidColumn(center, cols) {
		return center
	}
	
	// Dernier recours : colonne valide aléatoire
	if len(validCols) > 0 {
		return validCols[rand.Intn(len(validCols))]
	}
	
	return cols / 2
}

// getImpossibleMove : Utilise minimax avec alpha-beta pruning, profondeur maximale
func getImpossibleMove(rows, cols int, aiPlayer, humanPlayer string) int {
	// 1. Vérifier si on peut gagner
	if col := canWin(rows, cols, aiPlayer); col != -1 {
		return col
	}
	
	// 2. Vérifier si on doit bloquer l'adversaire
	if col := canWin(rows, cols, humanPlayer); col != -1 {
		return col
	}
	
	// 3. Utiliser minimax avec alpha-beta pruning, profondeur 6 (optimisé pour la vitesse)
	bestCol := -1
	bestScore := -10000
	
	validCols := getValidColumns(cols)
	for _, col := range validCols {
		row := getDropRow(col, rows)
		if row == -1 {
			continue
		}
		
		// Simuler le coup
		config.Grid[row][col] = aiPlayer
		score := minimax(rows, cols, 6, false, aiPlayer, humanPlayer, -10000, 10000)
		config.Grid[row][col] = "" // Annuler le coup
		
		if score > bestScore {
			bestScore = score
			bestCol = col
		}
	}
	
	if bestCol != -1 {
		return bestCol
	}
	
	// Fallback : jouer au centre
	center := cols / 2
	if isValidColumn(center, cols) {
		return center
	}
	
	// Dernier recours : colonne valide aléatoire
	if len(validCols) > 0 {
		return validCols[rand.Intn(len(validCols))]
	}
	
	return cols / 2
}

// -------------------------------
// FONCTIONS UTILITAIRES
// -------------------------------

// canWin vérifie si un joueur peut gagner en jouant dans une colonne
func canWin(rows, cols int, player string) int {
	validCols := getValidColumns(cols)
	for _, col := range validCols {
		row := getDropRow(col, rows)
		if row == -1 {
			continue
		}
		
		// Simuler le coup
		config.Grid[row][col] = player
		won := checkWinSimulation(row, col, rows, cols, player)
		config.Grid[row][col] = "" // Annuler le coup
		
		if won {
			return col
		}
	}
	return -1
}

// checkWinSimulation vérifie si un joueur a gagné (simulation)
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

// minimax implémente l'algorithme minimax avec alpha-beta pruning
func minimax(rows, cols, depth int, isMaximizing bool, aiPlayer, humanPlayer string, alpha, beta int) int {
	// Vérifier les conditions de fin
	if depth == 0 {
		return evaluateBoard(rows, cols, aiPlayer, humanPlayer)
	}
	
	// Vérifier si quelqu'un a gagné en parcourant la grille
	// (on vérifie directement dans la grille plutôt que d'utiliser canWin récursivement)
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
		return 0 // Match nul
	}
	
	if isMaximizing {
		maxScore := -10000
		// Trier les colonnes par priorité (centre d'abord) pour améliorer le pruning
		center := cols / 2
		// Réorganiser validCols pour mettre le centre en premier si possible
		sortedCols := make([]int, len(validCols))
		copy(sortedCols, validCols)
		// Trouver le centre et le mettre en premier
		for i, col := range sortedCols {
			if col == center {
				// Échanger avec le premier
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
				break // Alpha-beta pruning
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
				break // Alpha-beta pruning
			}
		}
		return minScore
	}
}

// evaluateBoard évalue la position du plateau
func evaluateBoard(rows, cols int, aiPlayer, humanPlayer string) int {
	score := 0
	
	// Évaluer les alignements possibles
	score += countThreats(rows, cols, aiPlayer) * 100
	score -= countThreats(rows, cols, humanPlayer) * 100
	
	// Bonus pour le centre
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

// countThreats compte les menaces (alignements de 2 ou 3)
func countThreats(rows, cols int, player string) int {
	count := 0
	target := config.GetWinLength()
	
	// Vérifier toutes les directions
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

// getValidColumns retourne la liste des colonnes valides (non pleines)
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

// isValidColumn vérifie si une colonne est valide
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

// getDropRow trouve la ligne où le jeton tombera dans une colonne
func getDropRow(col, rows int) int {
	if config.CurrentMode == "gravity" {
		// Gravité inversée: on remplit depuis le haut
		for i := 0; i < rows; i++ {
			if config.Grid[i][col] == "" {
				return i
			}
		}
	} else {
		// Gravité normale: on remplit depuis le bas
		for i := rows - 1; i >= 0; i-- {
			if config.Grid[i][col] == "" {
				return i
			}
		}
	}
	return -1
}
