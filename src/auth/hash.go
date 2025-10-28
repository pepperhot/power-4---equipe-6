package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword génère un hash bcrypt pour le mot de passe fourni.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPasswordHash compare un hash bcrypt avec un mot de passe en clair.
func CheckPasswordHash(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
