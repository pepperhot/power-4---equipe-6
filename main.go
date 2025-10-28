package main

import (
	"fmt"
	"log"
	"net/http"
	"power4/src/auth"
	"power4/src/config"
	"power4/src/database"
	"power4/src/game"
	"power4/src/routes"
)

func main() {
	// Initialisation de la base de données
	if err := database.InitDatabase(); err != nil {
		panic(err)
	}
	defer config.DB.Close()

	http.HandleFunc("/", routes.ServeStatic)
	http.HandleFunc("/login", routes.ServeLogin)
	http.HandleFunc("/connect", auth.HandleLogin)
	http.HandleFunc("/register", auth.HandleRegister)
	http.HandleFunc("/homepage", routes.ServeHomepage)
	http.HandleFunc("/players", routes.GetPlayers)
	http.HandleFunc("/winner", routes.GetWinner)
	http.HandleFunc("/click", game.HandleClick)
	http.HandleFunc("/state", game.GetState)
	http.HandleFunc("/reset", game.ResetGame)
	http.HandleFunc("/start", routes.StartGame)

	fmt.Println("Serveur lancé sur http://localhost:3000/login")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
