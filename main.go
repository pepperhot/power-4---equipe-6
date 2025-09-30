package main

import (
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

func main() {
	// Créer un gestionnaire de fichiers personnalisé avec les bons MIME types
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Obtenir le chemin du fichier demandé
		path := r.URL.Path
		if path == "/" {
			path = "/grille.html"
		}
		
		// Déterminer le MIME type basé sur l'extension
		ext := strings.ToLower(filepath.Ext(path))
		switch ext {
		case ".css":
			w.Header().Set("Content-Type", "text/css")
		case ".js":
			w.Header().Set("Content-Type", "application/javascript")
		case ".html":
			w.Header().Set("Content-Type", "text/html")
		}
		
		// Servir le fichier
		http.ServeFile(w, r, "."+path)
	})

	log.Println("Serveur lancé sur http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
