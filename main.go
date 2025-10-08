package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

const rows, cols = 6, 7

var (
	grid          [rows][cols]string
	currentPlayer = "R"
	winner        = ""
	db            *sql.DB
)

// ----------------------------
// POINT D’ENTRÉE
// ----------------------------
func main() {
	var err error
	db, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/power 4")
	if err != nil {
		panic(err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		panic(err)
	}
	fmt.Println("✅ Connexion MySQL réussie !")

	// Routes
	http.HandleFunc("/", serveStatic)
	http.Handle("/assets/static/", http.StripPrefix("/assets/static/", http.FileServer(http.Dir("./assets/static"))))
	http.HandleFunc("/play", func(w http.ResponseWriter, r *http.Request) { http.ServeFile(w, r, "./temp/grid/grid.html") })
	http.HandleFunc("/retour", func(w http.ResponseWriter, r *http.Request) { http.ServeFile(w, r, "./temp/homepage/homepage.html") })
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) { http.ServeFile(w, r, "./temp/login/login.html") })
	http.HandleFunc("/state", getState)
	http.HandleFunc("/click", handleClick)
	http.HandleFunc("/winner", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"winner": winner})
	})
	http.HandleFunc("/reset", resetGame)

	log.Println("Serveur lancé sur http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// ----------------------------
// SERVE FILES
// ----------------------------
func serveStatic(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "/temp/login/login.html"
	}
	switch strings.ToLower(filepath.Ext(path)) {
	case ".css":
		w.Header().Set("Content-Type", "text/css")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
	case ".html":
		w.Header().Set("Content-Type", "text/html")
	}
	http.ServeFile(w, r, "."+path)
}

// ----------------------------
// CLICS : sauvegarde dans MySQL
// ----------------------------
func handleClick(w http.ResponseWriter, r *http.Request) {
	if winner != "" {
		http.Error(w, "Partie terminée", http.StatusBadRequest)
		return
	}
	col, err := strconv.Atoi(r.URL.Query().Get("col"))
	if err != nil || col < 0 || col >= cols {
		http.Error(w, "colonne invalide", http.StatusBadRequest)
		return
	}
	for row := rows - 1; row >= 0; row-- {
		if grid[row][col] == "" {
			grid[row][col] = currentPlayer
			db.Exec("INSERT INTO grille (ligne, colonne, joueur) VALUES (?, ?, ?)", row, col, currentPlayer)

			if checkVictory(currentPlayer, row, col) {
				winner = currentPlayer
			}
			if currentPlayer == "R" {
				currentPlayer = "J"
			} else {
				currentPlayer = "R"
			}
			fmt.Fprintf(w, "OK placé en ligne %d", row)
			return
		}
	}
}

// ----------------------------
// STATE : lit depuis MySQL
// ----------------------------
func getState(w http.ResponseWriter, r *http.Request) {
	rowsDB, _ := db.Query("SELECT ligne, colonne, joueur FROM grille")
	defer rowsDB.Close()

	// Réinitialise la grille
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			grid[i][j] = ""
		}
	}

	for rowsDB.Next() {
		var l, c int
		var j string
		rowsDB.Scan(&l, &c, &j)
		grid[l][c] = j
	}
	json.NewEncoder(w).Encode(grid)
}

// ----------------------------
// RESET : vide la table et la grille
// ----------------------------
func resetGame(w http.ResponseWriter, r *http.Request) {
	db.Exec("TRUNCATE TABLE grille")
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			grid[i][j] = ""
		}
	}
	currentPlayer, winner = "R", ""
}

// ----------------------------
// CHECK VICTORY
// ----------------------------
func checkVictory(player string, lastRow, lastCol int) bool {
	dirs := [][2]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}}
	for _, d := range dirs {
		count := 1
		for s := 1; s < 4; s++ {
			r, c := lastRow+s*d[0], lastCol+s*d[1]
			if r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != player {
				break
			}
			count++
		}
		for s := 1; s < 4; s++ {
			r, c := lastRow-s*d[0], lastCol-s*d[1]
			if r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != player {
				break
			}
			count++
		}
		if count >= 4 {
			return true
		}
	}
	return false
}
