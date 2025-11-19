package ai

// -------------------------------
// CONFIGURATION DE L'IA
// -------------------------------

// Niveau de l'IA (facile, medium, hard, impossible)
var Level = "medium"

// SetLevel définit le niveau de l'IA
func SetLevel(level string) {
	if level == "" {
		level = "medium"
	}
	Level = level
}

// GetLevel retourne le niveau actuel de l'IA
func GetLevel() string {
	return Level
}

// GetAIName retourne le nom de l'IA selon son niveau
func GetAIName() string {
	switch Level {
	case "easy":
		return "IA Facile"
	case "medium":
		return "IA Moyen"
	case "hard":
		return "IA Difficile"
	case "impossible":
		return "IA Impossible"
	default:
		return "IA"
	}
}

// IsValidLevel vérifie si le niveau fourni est valide
func IsValidLevel(level string) bool {
	switch level {
	case "easy", "medium", "hard", "impossible":
		return true
	default:
		return false
	}
}

