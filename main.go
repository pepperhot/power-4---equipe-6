package main

import (
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "grille.html")
	})
	log.Println("Serveur lancé sur http://localhost:8080")
	http.ListenAndServe(":8080", nil)

}
