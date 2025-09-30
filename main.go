package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "grille.html")
	})

	http.ListenAndServe(":8080", nil)
	fmt.Println("lancement du server...")
}
