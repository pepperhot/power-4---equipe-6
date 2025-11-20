package game

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"power4/src/ai"
	"power4/src/config"
)

// CalculateLevel calcule le niveau d'un joueur à partir de son XP
// CalculateLevel calcule le niveau d'un joueur à partir de son XP (100 XP par niveau)
func CalculateLevel(xp int) int {
	if xp < 0 {
		xp = 0
	}
	return 1 + (xp / 100)
}

// GetXPForAILevel retourne l'XP gagné selon le niveau de difficulté de l'IA
// GetXPForAILevel retourne l'XP gagné selon le niveau de difficulté de l'IA battue
func GetXPForAILevel(aiLevel string) int {
	switch aiLevel {
	case "easy":
		return 10
	case "medium":
		return 25
	case "hard":
		return 50
	case "impossible":
		return 100
	default:
		return 10
	}
}

// AwardXP attribue de l'XP à un joueur et met à jour son niveau
// AwardXP attribue de l'XP à un joueur et met à jour automatiquement son niveau
func AwardXP(pseudo string, xpGained int) error {
	var currentXP sql.NullInt64
	err := config.DB.QueryRow("SELECT COALESCE(xp, 0) FROM login WHERE pseudo = ?", pseudo).Scan(&currentXP)
	if err != nil {
		return err
	}
	xpValue := int(currentXP.Int64)
	if !currentXP.Valid {
		xpValue = 0
	}
	newXP := xpValue + xpGained
	if newXP < 0 {
		newXP = 0
	}
	newLevel := CalculateLevel(newXP)
	_, err = config.DB.Exec("UPDATE login SET xp = ?, level = ? WHERE pseudo = ?", newXP, newLevel, pseudo)
	return err
}

// GetUserXP récupère l'XP et le niveau d'un utilisateur
// GetUserXP récupère l'XP et le niveau actuel d'un utilisateur depuis la base de données
func GetUserXP(pseudo string) (int, int, error) {
	var xp, level int
	err := config.DB.QueryRow("SELECT COALESCE(xp, 0), COALESCE(level, 1) FROM login WHERE pseudo = ?", pseudo).Scan(&xp, &level)
	if err != nil {
		return 0, 1, err
	}
	return xp, level, nil
}

// HandleAwardXP attribue de l'XP au joueur gagnant selon le mode de jeu
// HandleAwardXP gère l'attribution d'XP au joueur gagnant selon le mode de jeu
func HandleAwardXP(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if config.Player1Name == "Joueur 1" || config.Player1Name == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Aucun utilisateur connecté"})
		return
	}
	var winner, player2Name, aiLevelParam string
	var isAI bool
	if r.Header.Get("Content-Type") == "application/json" {
		var body map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
			if w, ok := body["winner"].(string); ok {
				winner = w
			}
			if p2, ok := body["player2Name"].(string); ok {
				player2Name = p2
			}
			if al, ok := body["aiLevel"].(string); ok {
				aiLevelParam = al
			}
			if ai, ok := body["isAI"].(bool); ok {
				isAI = ai
			}
		}
	}
	if winner == "" {
		winner = config.Winner
	}
	if player2Name == "" {
		player2Name = config.Player2Name
	}
	if !isAI && player2Name != "" && len(player2Name) >= 2 {
		isAI = player2Name[:2] == "IA"
	}
	if winner != "R" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Le joueur n'a pas gagné"})
		return
	}
	var xpGained int
	if isAI {
		var aiLevel string
		if aiLevelParam != "" {
			aiLevel = aiLevelParam
		} else {
			aiLevel = ai.GetLevel()
		}
		xpGained = GetXPForAILevel(aiLevel)
	} else {
		xpGained = 5
	}
	err := AwardXP(config.Player1Name, xpGained)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de l'attribution de l'XP"})
		return
	}
	xp, level, _ := GetUserXP(config.Player1Name)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true, "xpGained": xpGained, "xp": xp, "level": level, "message": "XP attribué avec succès",
	})
}

