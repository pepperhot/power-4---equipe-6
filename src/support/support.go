package support

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"power4/src/config"
	"time"
)

type Ticket struct {
	ID           int        `json:"id"`
	UserPseudo   string     `json:"userPseudo"`
	UserEmail    string     `json:"userEmail"`
	TicketType   string     `json:"ticketType"`
	Subject      string     `json:"subject"`
	Status       string     `json:"status"`
	Priority     string     `json:"priority"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	ResolvedAt   *time.Time `json:"resolvedAt,omitempty"`
	MessageCount int        `json:"messageCount"`
}

type Message struct {
	ID           int       `json:"id"`
	TicketID     int       `json:"ticketId"`
	SenderPseudo string    `json:"senderPseudo"`
	IsAdmin      bool      `json:"isAdmin"`
	Message      string    `json:"message"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CreateTicket crée un nouveau ticket de support avec un message initial
func CreateTicket(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	pseudo := config.Player1Name
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Vous devez être connecté pour créer un ticket"})
		return
	}
	ticketType := r.FormValue("ticketType")
	subject := r.FormValue("subject")
	message := r.FormValue("message")
	userEmail := r.FormValue("userEmail")
	priority := r.FormValue("priority")
	if priority == "" {
		priority = "medium"
	}
	if ticketType == "" || subject == "" || message == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Tous les champs sont requis"})
		return
	}
	if userEmail == "" {
		config.DB.QueryRow("SELECT email FROM login WHERE pseudo = ?", pseudo).Scan(&userEmail)
	}
	result, err := config.DB.Exec(
		"INSERT INTO support_tickets (user_pseudo, user_email, ticket_type, subject, status, priority) VALUES (?, ?, ?, ?, 'open', ?)",
		pseudo, userEmail, ticketType, subject, priority,
	)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de la création du ticket: " + err.Error()})
		return
	}
	ticketID, _ := result.LastInsertId()
	_, err = config.DB.Exec(
		"INSERT INTO support_messages (ticket_id, sender_pseudo, is_admin, message) VALUES (?, ?, FALSE, ?)",
		ticketID, pseudo, message,
	)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de l'ajout du message: " + err.Error()})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "ticketId": ticketID, "message": "Ticket créé avec succès"})
}

// GetUserTickets récupère tous les tickets de l'utilisateur connecté
func GetUserTickets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	pseudo := config.Player1Name
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Vous devez être connecté"})
		return
	}

	rows, err := config.DB.Query(`
		SELECT 
			t.id, t.user_pseudo, t.user_email, t.ticket_type, t.subject, 
			t.status, t.priority, t.created_at, t.updated_at, t.resolved_at,
			COUNT(m.id) as message_count
		FROM support_tickets t
		LEFT JOIN support_messages m ON t.id = m.ticket_id
		WHERE t.user_pseudo = ?
		GROUP BY t.id
		ORDER BY t.created_at DESC
	`, pseudo)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de la récupération des tickets: " + err.Error()})
		return
	}
	defer rows.Close()
	var tickets []Ticket
	for rows.Next() {
		var t Ticket
		var createdAtStr, updatedAtStr, resolvedAt sql.NullString
		err := rows.Scan(
			&t.ID, &t.UserPseudo, &t.UserEmail, &t.TicketType, &t.Subject,
			&t.Status, &t.Priority, &createdAtStr, &updatedAtStr, &resolvedAt,
			&t.MessageCount,
		)
		if err != nil {
			continue
		}
		if createdAtStr.Valid && createdAtStr.String != "" {
			if parsedTime, err := time.Parse("2006-01-02 15:04:05", createdAtStr.String); err == nil {
				t.CreatedAt = parsedTime
			}
		}
		if updatedAtStr.Valid && updatedAtStr.String != "" {
			if parsedTime, err := time.Parse("2006-01-02 15:04:05", updatedAtStr.String); err == nil {
				t.UpdatedAt = parsedTime
			}
		}
		if resolvedAt.Valid && resolvedAt.String != "" {
			if parsedTime, err := time.Parse("2006-01-02 15:04:05", resolvedAt.String); err == nil {
				t.ResolvedAt = &parsedTime
			}
		}
		tickets = append(tickets, t)
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "tickets": tickets})
}

// GetAllTickets récupère tous les tickets (admin uniquement)
func GetAllTickets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Vérifier si l'utilisateur est admin
	pseudo := config.Player1Name
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Non autorisé",
		})
		return
	}

	var isAdmin bool
	var isOwner bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwner)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la vérification des permissions: " + err.Error(),
		})
		return
	}
	if !isAdmin && !isOwner {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin ou Propriétaire requis",
		})
		return
	}

	rows, err := config.DB.Query(`
		SELECT 
			t.id, t.user_pseudo, t.user_email, t.ticket_type, t.subject, 
			t.status, t.priority, t.created_at, t.updated_at, t.resolved_at,
			COUNT(m.id) as message_count
		FROM support_tickets t
		LEFT JOIN support_messages m ON t.id = m.ticket_id
		GROUP BY t.id
		ORDER BY t.created_at DESC
	`)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de la récupération des tickets: " + err.Error()})
		return
	}
	defer rows.Close()
	var tickets []Ticket
	for rows.Next() {
		var t Ticket
		var createdAtStr, updatedAtStr, resolvedAt sql.NullString
		err := rows.Scan(
			&t.ID, &t.UserPseudo, &t.UserEmail, &t.TicketType, &t.Subject,
			&t.Status, &t.Priority, &createdAtStr, &updatedAtStr, &resolvedAt,
			&t.MessageCount,
		)
		if err != nil {
			continue
		}
		if createdAtStr.Valid && createdAtStr.String != "" {
			if parsedTime, err := time.Parse("2006-01-02 15:04:05", createdAtStr.String); err == nil {
				t.CreatedAt = parsedTime
			}
		}
		if updatedAtStr.Valid && updatedAtStr.String != "" {
			if parsedTime, err := time.Parse("2006-01-02 15:04:05", updatedAtStr.String); err == nil {
				t.UpdatedAt = parsedTime
			}
		}
		if resolvedAt.Valid && resolvedAt.String != "" {
			if parsedTime, err := time.Parse("2006-01-02 15:04:05", resolvedAt.String); err == nil {
				t.ResolvedAt = &parsedTime
			}
		}
		tickets = append(tickets, t)
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "tickets": tickets})
}

// GetTicketMessages récupère tous les messages d'un ticket spécifique
func GetTicketMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ticketID := r.URL.Query().Get("ticketId")
	if ticketID == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID de ticket requis",
		})
		return
	}

	pseudo := config.Player1Name
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Vous devez être connecté",
		})
		return
	}

	// Vérifier si l'utilisateur a accès à ce ticket (propriétaire ou admin)
	var ticketUserPseudo string
	err := config.DB.QueryRow("SELECT user_pseudo FROM support_tickets WHERE id = ?", ticketID).Scan(&ticketUserPseudo)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Ticket introuvable",
		})
		return
	}

	// Vérifier si l'utilisateur est admin
	var isAdmin bool
	var isOwner bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwner)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la vérification des permissions",
		})
		return
	}

	// Vérifier les permissions
	if ticketUserPseudo != pseudo && !isAdmin && !isOwner {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé",
		})
		return
	}

	rows, err := config.DB.Query(`
		SELECT id, ticket_id, sender_pseudo, is_admin, message, created_at
		FROM support_messages
		WHERE ticket_id = ?
		ORDER BY created_at ASC
	`, ticketID)

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la récupération des messages: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var m Message
		var createdAtStr sql.NullString
		err := rows.Scan(&m.ID, &m.TicketID, &m.SenderPseudo, &m.IsAdmin, &m.Message, &createdAtStr)
		if err != nil {
			continue
		}
		if createdAtStr.Valid && createdAtStr.String != "" {
			if parsedTime, err := time.Parse("2006-01-02 15:04:05", createdAtStr.String); err == nil {
				m.CreatedAt = parsedTime
			}
		}
		messages = append(messages, m)
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "messages": messages})
}

// AddMessage ajoute un nouveau message à un ticket de support
func AddMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	ticketID := r.FormValue("ticketId")
	message := r.FormValue("message")

	if ticketID == "" || message == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID de ticket et message requis",
		})
		return
	}

	pseudo := config.Player1Name
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Vous devez être connecté",
		})
		return
	}

	// Vérifier si l'utilisateur a accès à ce ticket
	var ticketUserPseudo string
	err := config.DB.QueryRow("SELECT user_pseudo FROM support_tickets WHERE id = ?", ticketID).Scan(&ticketUserPseudo)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Ticket introuvable",
		})
		return
	}

	// Vérifier si l'utilisateur est admin
	var isAdmin bool
	var isOwner bool
	err = config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwner)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la vérification des permissions",
		})
		return
	}

	// Vérifier les permissions
	if ticketUserPseudo != pseudo && !isAdmin && !isOwner {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé",
		})
		return
	}

	isAdminResponse := (isAdmin || isOwner) && ticketUserPseudo != pseudo
	_, err = config.DB.Exec(
		"INSERT INTO support_messages (ticket_id, sender_pseudo, is_admin, message) VALUES (?, ?, ?, ?)",
		ticketID, pseudo, isAdminResponse, message,
	)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false, "message": "Erreur lors de l'ajout du message: " + err.Error()})
		return
	}
	if isAdminResponse {
		config.DB.Exec("UPDATE support_tickets SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?", ticketID)
	}
	config.DB.Exec("UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", ticketID)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Message ajouté avec succès"})
}

// UpdateTicketStatus met à jour le statut d'un ticket (admin uniquement)
func UpdateTicketStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	pseudo := config.Player1Name
	if pseudo == "" || pseudo == "Joueur 1" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Non autorisé",
		})
		return
	}

	var isAdmin bool
	var isOwner bool
	err := config.DB.QueryRow("SELECT COALESCE(is_admin, FALSE), COALESCE(is_owner, FALSE) FROM login WHERE pseudo = ?", pseudo).Scan(&isAdmin, &isOwner)
	if err != nil || (!isAdmin && !isOwner) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Accès refusé - Admin ou Propriétaire requis",
		})
		return
	}

	ticketID := r.FormValue("ticketId")
	status := r.FormValue("status")

	if ticketID == "" || status == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "ID de ticket et statut requis",
		})
		return
	}

	// Mettre à jour le statut
	_, err = config.DB.Exec(
		"UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP, resolved_at = CASE WHEN ? = 'resolved' OR ? = 'closed' THEN CURRENT_TIMESTAMP ELSE resolved_at END WHERE id = ?",
		status, status, status, ticketID,
	)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Erreur lors de la mise à jour: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Statut mis à jour avec succès",
	})
}
