package game

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"power4/src/config"
)

// GetLeaderboard récupère tous les utilisateurs avec leur niveau, triés par niveau décroissant
func GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := config.DB.Query(`
		SELECT 
			pseudo, 
			COALESCE(level, 1) as level,
			COALESCE(xp, 0) as xp,
			COALESCE(avatar, '') as avatar
		FROM login 
		ORDER BY COALESCE(level, 1) DESC, COALESCE(xp, 0) DESC
		LIMIT 100
	`)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la récupération du leaderboard: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	var leaderboard []map[string]interface{}
	rank := 1
	for rows.Next() {
		var pseudo string
		var level, xp int
		var avatar sql.NullString

		err := rows.Scan(&pseudo, &level, &xp, &avatar)
		if err != nil {
			continue
		}

		avatarStr := ""
		if avatar.Valid {
			avatarStr = avatar.String
		}

		leaderboard = append(leaderboard, map[string]interface{}{
			"rank":   rank,
			"pseudo": pseudo,
			"level":  level,
			"xp":     xp,
			"avatar": avatarStr,
		})
		rank++
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"leaderboard": leaderboard,
	})
}

