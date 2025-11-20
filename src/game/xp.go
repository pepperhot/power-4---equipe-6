package game

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"power4/src/ai"
	"power4/src/config"
)

// CalculateLevel calcule le niveau basé sur l'XP
// Formule : level = 1 + sqrt(xp / 100)
func CalculateLevel(xp int) int {
	if xp < 0 {
		xp = 0
	}
	// Formule simple : niveau = 1 + (XP / 100)
	// Chaque niveau nécessite 100 XP de plus
	level := 1 + (xp / 100)
	return level
}

// GetXPForAILevel retourne l'XP gagné selon le niveau de l'IA battue
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

// AwardXP attribue de l'XP à un utilisateur et met à jour son niveau
func AwardXP(pseudo string, xpGained int) error {
	// Récupérer l'XP actuel (gérer NULL avec COALESCE)
	var currentXP sql.NullInt64
	err := config.DB.QueryRow("SELECT COALESCE(xp, 0) FROM login WHERE pseudo = ?", pseudo).Scan(&currentXP)
	if err != nil {
		log.Printf("Erreur lors de la récupération de l'XP pour %s: %v", pseudo, err)
		return err
	}
	
	xpValue := int(currentXP.Int64)
	if !currentXP.Valid {
		xpValue = 0
	}

	// Calculer le nouveau XP
	newXP := xpValue + xpGained
	if newXP < 0 {
		newXP = 0
	}

	// Calculer le nouveau niveau
	newLevel := CalculateLevel(newXP)

	// Mettre à jour dans la base de données
	_, err = config.DB.Exec("UPDATE login SET xp = ?, level = ? WHERE pseudo = ?", newXP, newLevel, pseudo)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour de l'XP pour %s: %v", pseudo, err)
		return err
	}

	log.Printf("XP attribué: %s a gagné %d XP (total: %d, niveau: %d)", pseudo, xpGained, newXP, newLevel)
	return nil
}

// GetUserXP récupère l'XP et le niveau d'un utilisateur
func GetUserXP(pseudo string) (int, int, error) {
	var xp, level int
	err := config.DB.QueryRow("SELECT COALESCE(xp, 0), COALESCE(level, 1) FROM login WHERE pseudo = ?", pseudo).Scan(&xp, &level)
	if err != nil {
		return 0, 1, err
	}
	return xp, level, nil
}

// HandleAwardXP gère l'attribution d'XP après une victoire contre l'IA
func HandleAwardXP(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Vérifier qu'un utilisateur est connecté
	if config.Player1Name == "Joueur 1" || config.Player1Name == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Aucun utilisateur connecté",
		})
		return
	}

	// Récupérer les paramètres depuis la requête (depuis le body JSON ou les query params)
	var winner, player2Name, aiLevelParam string
	var isAI bool
	
	// Essayer de lire depuis le body JSON
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
	
	// Sinon, utiliser les valeurs du config (pour compatibilité)
	if winner == "" {
		winner = config.Winner
	}
	if player2Name == "" {
		player2Name = config.Player2Name
	}
	
	// Vérifier si c'est contre l'IA
	if !isAI && player2Name != "" && len(player2Name) >= 2 {
		isAI = player2Name[:2] == "IA"
	}

	// Vérifier que le joueur a gagné (Winner = "R" = joueur 1)
	if winner != "R" {
		log.Printf("[XP] Le joueur n'a pas gagné. Winner: %s", winner)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Le joueur n'a pas gagné",
		})
		return
	}

	// Calculer l'XP gagné
	var xpGained int
	if isAI {
		// Récupérer le niveau de l'IA (depuis le paramètre ou depuis ai.GetLevel())
		var aiLevel string
		if aiLevelParam != "" {
			aiLevel = aiLevelParam
		} else {
			aiLevel = ai.GetLevel()
		}
		xpGained = GetXPForAILevel(aiLevel)
		log.Printf("[XP] Attribution de %d XP pour victoire contre IA niveau: %s", xpGained, aiLevel)
	} else {
		// En 1V1, donner 5 XP (fixe)
		xpGained = 5
		log.Printf("[XP] Attribution de %d XP pour victoire en 1V1", xpGained)
	}

	// Attribuer l'XP
	err := AwardXP(config.Player1Name, xpGained)
	if err != nil {
		log.Printf("[XP] Erreur lors de l'attribution: %v", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de l'attribution de l'XP",
		})
		return
	}

	// Récupérer le nouvel XP et niveau
	xp, level, _ := GetUserXP(config.Player1Name)
	log.Printf("[XP] XP attribué avec succès: %s a maintenant %d XP (niveau %d)", config.Player1Name, xp, level)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"xpGained": xpGained,
		"xp":       xp,
		"level":    level,
		"message":  "XP attribué avec succès",
	})
}

