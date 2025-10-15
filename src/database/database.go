package database

import (
	"database/sql"
	"log"
	"power4/src/config"

	_ "github.com/go-sql-driver/mysql"
)

// InitDatabase initialise la connexion à la base de données
func InitDatabase() error {
	var err error
	config.DB, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/power_4")
	if err != nil {
		return err
	}

	if err := config.DB.Ping(); err != nil {
		return err
	}

	log.Println("Base de données connectée avec succès")
	return nil
}
