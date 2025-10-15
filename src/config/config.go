package config

import "database/sql"

// Configuration du jeu
const (
	ROWS = 6
	COLS = 7
)

// Variables globales du jeu
var (
	Grid          [ROWS][COLS]string
	CurrentPlayer = "R"
	Winner        = ""
	DB            *sql.DB
	// Pseudos des joueurs
	Player1Name = "Joueur 1"
	Player2Name = "Joueur 2"
)
