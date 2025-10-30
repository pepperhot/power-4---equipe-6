package config

import "database/sql"

// -------------------------------
// CONFIGURATION DU JEU
// -------------------------------

// Dimensions pour chaque mode
const (
	ROWS_EASY   = 6
	COLS_EASY   = 7
	BLOCKS_EASY = 3

	ROWS_NORMAL   = 6
	COLS_NORMAL   = 7
	BLOCKS_NORMAL = 5

	// Mode gravité inverse (mêmes dimensions que normal)
	ROWS_GRAVITY   = ROWS_NORMAL
	COLS_GRAVITY   = COLS_NORMAL
	BLOCKS_GRAVITY = BLOCKS_NORMAL

	ROWS_HARD   = 7
	COLS_HARD   = 8
	BLOCKS_HARD = 7

	// Longueur d'alignement pour gagner selon le mode
	WIN_EASY    = 3
	WIN_NORMAL  = 4
	WIN_HARD    = 7
	WIN_GRAVITY = 4
)

// Mode de jeu actuel (par défaut "normal")
var CurrentMode = "normal"

// -------------------------------
// VARIABLES GLOBALES
// -------------------------------
var (
	// On garde une seule grille, avec la taille maximale (mode hard)
	Grid [ROWS_HARD][COLS_HARD]string

	CurrentPlayer = "R"
	Winner        = ""

	DB *sql.DB

	Player1Name = "Joueur 1"
	Player2Name = "Joueur 2"
)

// -------------------------------
// FONCTIONS UTILES
// -------------------------------

// GetDimensions renvoie le nombre de lignes et de colonnes
// selon le mode sélectionné
func GetDimensions() (int, int) {
	switch CurrentMode {
	case "easy":
		return ROWS_EASY, COLS_EASY
	case "gravity":
		return ROWS_GRAVITY, COLS_GRAVITY
	case "hard":
		return ROWS_HARD, COLS_HARD
	default: // normal
		return ROWS_NORMAL, COLS_NORMAL
	}
}

// GetStartingBlocks renvoie le nombre de cases à remplir au début
func GetStartingBlocks() int {
	switch CurrentMode {
	case "easy":
		return BLOCKS_EASY
	case "gravity":
		return BLOCKS_GRAVITY
	case "hard":
		return BLOCKS_HARD
	default:
		return BLOCKS_NORMAL
	}
}

// GetWinLength renvoie le nombre de jetons à aligner pour gagner
func GetWinLength() int {
	switch CurrentMode {
	case "easy":
		return WIN_EASY
	case "gravity":
		return WIN_GRAVITY
	case "hard":
		return WIN_HARD
	default:
		return WIN_NORMAL
	}
}
