package database

import (
	"database/sql"
	"power4/src/config"
	_ "github.com/go-sql-driver/mysql"
)

// InitDatabase initialise la connexion à la base de données MySQL
func InitDatabase() error {
	var err error
	config.DB, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/power_4")
	if err != nil {
		return err
	}
	return config.DB.Ping()
}
