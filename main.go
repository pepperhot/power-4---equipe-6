package main

import (
	"fmt"
	"log"
	"net/http"
	"power4/src/config"
	"power4/src/database"
	"power4/src/routes"
)

func main() {
	if err := database.InitDatabase(); err != nil {
		panic(err)
	}
	defer config.DB.Close()
	routes.Redirection()
	fmt.Println("Serveur lancé sur http://localhost:3000/login")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
