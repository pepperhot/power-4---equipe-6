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

func main() {
	var err error
	db, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/power_4")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		panic(err)
	}

	http.HandleFunc("/", serveStatic)
	http.HandleFunc("/click", handleClick)
	http.HandleFunc("/state", getState)
	http.HandleFunc("/reset", resetGame)
	http.HandleFunc("/login", serveLogin)
	http.HandleFunc("/connect", handleLogin)
	http.HandleFunc("/register", handleRegister)
	http.HandleFunc("/homepage", serveHomepage)

	fmt.Println("Serveur lancé sur http://localhost:8080/login")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func serveStatic(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "/index.html"
	}

	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".html":
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
	case ".css":
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	}

	http.ServeFile(w, r, "."+path)
}

func serveLogin(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./temp/login/login.html")
}

func serveHomepage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./temp/homepage/homepage.html")
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	email := r.FormValue("email")
	password := r.FormValue("password")

	var pseudo string
	err := db.QueryRow("SELECT pseudo FROM login WHERE email = ? AND password = ?", email, password).Scan(&pseudo)

	w.Header().Set("Content-Type", "application/json")
	if err == sql.ErrNoRows {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Identifiants incorrects",
		})
		return
	} else if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur serveur",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"pseudo":  pseudo,
		"message": "Connexion réussie",
	})
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pseudo := r.FormValue("pseudo")
	email := r.FormValue("email")
	password := r.FormValue("password")

	w.Header().Set("Content-Type", "application/json")

	if len(pseudo) < 3 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Le pseudo doit contenir au moins 3 caractères",
		})
		return
	}

	var exists int
	err := db.QueryRow("SELECT COUNT(*) FROM login WHERE email = ?", email).Scan(&exists)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur serveur",
		})
		return
	}

	if exists > 0 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Cet email est déjà utilisé",
		})
		return
	}

	_, err = db.Exec("INSERT INTO login (pseudo, email, password) VALUES (?, ?, ?)", pseudo, email, password)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de l'inscription",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"pseudo":  pseudo,
		"message": "Inscription réussie",
	})
}

func handleClick(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}

	colStr := r.FormValue("col")
	col, err := strconv.Atoi(colStr)
	if err != nil || col < 0 || col >= cols {
		http.Error(w, "Invalid column", http.StatusBadRequest)
		return
	}

	if winner != "" {
		json.NewEncoder(w).Encode(map[string]string{"error": "Game over"})
		return
	}

	row := -1
	for i := rows - 1; i >= 0; i-- {
		if grid[i][col] == "" {
			row = i
			break
		}
	}

	if row == -1 {
		json.NewEncoder(w).Encode(map[string]string{"error": "Column full"})
		return
	}

	grid[row][col] = currentPlayer

	_, err = db.Exec("INSERT INTO grille (ligne, colonne, joueur) VALUES (?, ?, ?)", row, col, currentPlayer)
	if err != nil {
		log.Println("DB error:", err)
	}

	if checkWin(row, col) {
		winner = currentPlayer
	} else {
		if currentPlayer == "R" {
			currentPlayer = "Y"
		} else {
			currentPlayer = "R"
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"grid":    grid,
		"current": currentPlayer,
		"winner":  winner,
	})
}

func getState(w http.ResponseWriter, r *http.Request) {
	// Réinitialise la grille locale
	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			grid[i][j] = ""
		}
	}
	currentPlayer = "R"
	winner = ""

	// ⚠️ Change "rows" en "dbRows" pour éviter le conflit
	dbRows, err := db.Query("SELECT ligne, colonne, joueur FROM grille ORDER BY id")
	if err != nil {
		log.Println("Query error:", err)
	} else {
		defer dbRows.Close()
		for dbRows.Next() {
			var ligne, colonne int
			var joueur string
			if err := dbRows.Scan(&ligne, &colonne, &joueur); err == nil {
				grid[ligne][colonne] = joueur
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"grid":    grid,
		"current": currentPlayer,
		"winner":  winner,
	})
}
func resetGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}

	_, err := db.Exec("DELETE FROM grille")
	if err != nil {
		log.Println("Reset error:", err)
	}

	for i := 0; i < rows; i++ {
		for j := 0; j < cols; j++ {
			grid[i][j] = ""
		}
	}
	currentPlayer = "R"
	winner = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func checkWin(row, col int) bool {
	player := grid[row][col]

	check := func(dr, dc int) bool {
		count := 1
		for i := 1; i < 4; i++ {
			r, c := row+dr*i, col+dc*i
			if r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != player {
				break
			}
			count++
		}
		for i := 1; i < 4; i++ {
			r, c := row-dr*i, col-dc*i
			if r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != player {
				break
			}
			count++
		}
		return count >= 4
	}

	return check(0, 1) || check(1, 0) || check(1, 1) || check(1, -1)
}
