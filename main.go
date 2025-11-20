package main

import (
	"fmt"
	"log"
	"net/http"
	"power4/src/config"
	"power4/src/database"
	"power4/src/routes"
)

// main initialise la base de données, configure les routes et démarre le serveur HTTP
func main() {
	if err := database.InitDatabase(); err != nil {
		log.Fatal("Erreur de connexion à la base de données:", err)
	}
	defer config.DB.Close()
	routes.WayLink()
	fmt.Println("Serveur lancé sur http://localhost:3000/login")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
