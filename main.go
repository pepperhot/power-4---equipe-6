package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
)

const rows, cols = 6, 7

var grid [rows][cols]string
var currentPlayer, winner = "R", ""

// ----------------------------
// POINT D’ENTRÉE
// ----------------------------
func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
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
	})

	http.Handle("/assets/static/", http.StripPrefix("/assets/static/", http.FileServer(http.Dir("./assets/static"))))
	http.HandleFunc("/play", func(w http.ResponseWriter, r *http.Request) { http.ServeFile(w, r, "./temp/grid/grid.html") })
	http.HandleFunc("/retour", func(w http.ResponseWriter, r *http.Request) { http.ServeFile(w, r, "./temp/homepage/homepage.html") })
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) { http.ServeFile(w, r, "./temp/login/login.html") })
	http.HandleFunc("/state", func(w http.ResponseWriter, r *http.Request) { json.NewEncoder(w).Encode(grid) })
	http.HandleFunc("/click", handleClick)
	http.HandleFunc("/winner", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"winner": winner})
	})
	http.HandleFunc("/reset", func(w http.ResponseWriter, r *http.Request) {
		for i := 0; i < rows; i++ {
			for j := 0; j < cols; j++ {
				grid[i][j] = ""
			}
		}
		currentPlayer, winner = "R", ""
	})

	log.Println("Serveur lancé sur http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// ----------------------------
// GESTION DES CLICS
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
// VÉRIFICATION DE VICTOIRE
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
