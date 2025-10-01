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

const (
	rows = 6
	cols = 7
)

var grid [rows][cols]string
var currentPlayer = "R" // R ou J

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/" {
			path = "/temp/homepage.html"
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

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))
	http.HandleFunc("/play", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./temp/grille.html")
	})
	http.HandleFunc("/state", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(grid)
	})
	http.HandleFunc("/click", handleClick)

	log.Println("Serveur lancé sur http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleClick(w http.ResponseWriter, r *http.Request) {
	colStr := r.URL.Query().Get("col")
	col, err := strconv.Atoi(colStr)
	if err != nil || col < 0 || col >= cols {
		http.Error(w, "colonne invalide", http.StatusBadRequest)
		return
	}

	// chercher la première case libre depuis le bas
	for row := rows - 1; row >= 0; row-- {
		if grid[row][col] == "" {
			grid[row][col] = currentPlayer
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
