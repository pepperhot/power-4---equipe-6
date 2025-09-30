package main

import (
	"log"
	"net/http"
)

func main() {
	// Servir tous les fichiers du dossier courant avec le bon MIME type
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)

	log.Println("Serveur lancé sur http://localhost:8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
