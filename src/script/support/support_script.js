// Script pour gérer le système de support/tickets

let currentTicketId = null;
let isAdmin = false;
let refreshInterval = null;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminStatus();
    setupEventListeners();
    loadUserTickets();
});

// Vérifier si l'utilisateur est admin ou propriétaire
// checkAdminStatus vérifie si l'utilisateur connecté est administrateur ou propriétaire
async function checkAdminStatus() {
    try {
        const adminBtn = document.getElementById('supportAdminBtn');
        if (!adminBtn) return;
        
        // Cacher le bouton par défaut (sécurité) - même méthode que le Dashboard
        adminBtn.style.display = 'none';
        isAdmin = false;
        
        // Récupérer le pseudo depuis localStorage ou utiliser celui du backend
        const storedPseudo = localStorage.getItem('userPseudo') || '';
        const url = storedPseudo 
            ? `/admin/check?pseudo=${encodeURIComponent(storedPseudo)}`
            : '/admin/check';

        const response = await fetch(url);
        const data = await response.json();
        
        console.log('[SUPPORT] Réponse admin check:', data);
        
        // Afficher le bouton seulement si l'utilisateur est admin OU propriétaire
        // data.isAdmin est true si l'utilisateur est admin OU propriétaire (selon le backend)
        if (data.success && data.isAdmin) {
            isAdmin = true;
            adminBtn.style.display = 'flex';
            console.log('[SUPPORT] Bouton Support Admin affiché - utilisateur admin/propriétaire');
        } else {
            adminBtn.style.display = 'none';
            console.log('[SUPPORT] Utilisateur non admin/propriétaire - bouton Support Admin masqué');
        }
    } catch (error) {
        console.error('[SUPPORT] Erreur lors de la vérification du statut admin:', error);
        // En cas d'erreur, cacher le bouton par sécurité
        const adminBtn = document.getElementById('supportAdminBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        isAdmin = false;
    }
}

// Configuration des event listeners
// setupEventListeners configure tous les écouteurs d'événements pour les modals de support
function setupEventListeners() {
    // Boutons Support
    const supportBtn = document.getElementById('supportBtn');
    const supportAdminBtn = document.getElementById('supportAdminBtn');
    
    if (supportBtn) {
        supportBtn.addEventListener('click', () => openSupportModal());
    }
    
    if (supportAdminBtn) {
        supportAdminBtn.addEventListener('click', () => openSupportAdminModal());
    }
    
    // Fermer les modals en cliquant sur le backdrop
    const supportModal = document.getElementById('supportModal');
    const supportAdminModal = document.getElementById('supportAdminModal');
    
    if (supportModal) {
        const backdrop = supportModal.querySelector('.support-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeSupportModal();
                }
            });
        }
    }
    
    if (supportAdminModal) {
        const backdrop = supportAdminModal.querySelector('.support-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeSupportAdminModal();
                }
            });
        }
    }
    
    // Fermeture des modals
    const closeSupportModalBtn = document.getElementById('closeSupportModal');
    const closeSupportAdminModalBtn = document.getElementById('closeSupportAdminModal');
    
    if (closeSupportModalBtn) {
        closeSupportModalBtn.addEventListener('click', () => closeSupportModal());
    }
    
    if (closeSupportAdminModalBtn) {
        closeSupportAdminModalBtn.addEventListener('click', () => closeSupportAdminModal());
    }
    
    // Formulaire de création de ticket
    const createTicketForm = document.getElementById('createTicketForm');
    if (createTicketForm) {
        createTicketForm.addEventListener('submit', handleCreateTicket);
    }
    
    // Boutons de navigation
    const btnNewTicket = document.getElementById('btnNewTicket');
    const btnBackToTickets = document.getElementById('btnBackToTickets');
    const btnBackToAdminTickets = document.getElementById('btnBackToAdminTickets');
    
    if (btnNewTicket) {
        btnNewTicket.addEventListener('click', () => showCreateTicketView());
    }
    
    if (btnBackToTickets) {
        btnBackToTickets.addEventListener('click', () => showTicketsListView());
    }
    
    if (btnBackToAdminTickets) {
        btnBackToAdminTickets.addEventListener('click', () => showAdminTicketsListView());
    }
    
    // Chat
    const btnSendMessage = document.getElementById('btnSendMessage');
    const chatMessageInput = document.getElementById('chatMessageInput');
    
    if (btnSendMessage) {
        btnSendMessage.addEventListener('click', () => sendMessage());
    }
    
    if (chatMessageInput) {
        chatMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Admin chat
    const btnSendAdminMessage = document.getElementById('btnSendAdminMessage');
    const adminChatMessageInput = document.getElementById('adminChatMessageInput');
    
    if (btnSendAdminMessage) {
        btnSendAdminMessage.addEventListener('click', () => sendAdminMessage());
    }
    
    if (adminChatMessageInput) {
        adminChatMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAdminMessage();
            }
        });
    }
    
    // Mise à jour du statut (admin)
    const btnUpdateTicketStatus = document.getElementById('btnUpdateTicketStatus');
    if (btnUpdateTicketStatus) {
        btnUpdateTicketStatus.addEventListener('click', () => updateTicketStatus());
    }
    
    // Filtres admin
    const adminFilterStatus = document.getElementById('adminFilterStatus');
    const adminFilterType = document.getElementById('adminFilterType');
    
    if (adminFilterStatus) {
        adminFilterStatus.addEventListener('change', () => loadAdminTickets());
    }
    
    if (adminFilterType) {
        adminFilterType.addEventListener('change', () => loadAdminTickets());
    }
}

// openSupportModal ouvre le modal de support utilisateur
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.remove('hidden');
        // S'assurer que toutes les vues sont dans le bon état
        const createView = document.getElementById('supportCreateView');
        const ticketsView = document.getElementById('supportTicketsView');
        const chatView = document.getElementById('supportChatView');
        
        // Afficher uniquement la liste des tickets
        if (createView) createView.classList.add('hidden');
        if (ticketsView) ticketsView.classList.remove('hidden');
        if (chatView) chatView.classList.add('hidden');
        
        // Charger les tickets
        loadUserTickets();
        
        // Réinitialiser le ticket courant
        currentTicketId = null;
        stopAutoRefresh();
    }
}

// closeSupportModal ferme le modal de support utilisateur
function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.add('hidden');
        currentTicketId = null;
        stopAutoRefresh();
    }
}

// openSupportAdminModal ouvre le modal de support administrateur
function openSupportAdminModal() {
    console.log('[SUPPORT ADMIN] Ouverture du modal admin');
    const modal = document.getElementById('supportAdminModal');
    if (modal) {
        modal.classList.remove('hidden');
        showAdminTicketsListView();
        // Charger les tickets après un court délai pour s'assurer que la vue est affichée
        setTimeout(() => {
            loadAdminTickets();
        }, 100);
    }
}

// closeSupportAdminModal ferme le modal de support administrateur
function closeSupportAdminModal() {
    const modal = document.getElementById('supportAdminModal');
    if (modal) {
        modal.classList.add('hidden');
        currentTicketId = null;
        stopAutoRefresh();
    }
}

// showCreateTicketView affiche le formulaire de création de ticket
function showCreateTicketView() {
    const createView = document.getElementById('supportCreateView');
    const ticketsView = document.getElementById('supportTicketsView');
    const chatView = document.getElementById('supportChatView');
    
    if (createView) createView.classList.remove('hidden');
    if (ticketsView) ticketsView.classList.add('hidden');
    if (chatView) chatView.classList.add('hidden');
    
    // Arrêter le rafraîchissement automatique si actif
    stopAutoRefresh();
}

// showTicketsListView affiche la liste des tickets de l'utilisateur
function showTicketsListView() {
    const createView = document.getElementById('supportCreateView');
    const ticketsView = document.getElementById('supportTicketsView');
    const chatView = document.getElementById('supportChatView');
    
    if (createView) createView.classList.add('hidden');
    if (ticketsView) ticketsView.classList.remove('hidden');
    if (chatView) chatView.classList.add('hidden');
    
    loadUserTickets();
}

// showChatView affiche la conversation d'un ticket spécifique
function showChatView(ticketId) {
    const createView = document.getElementById('supportCreateView');
    const ticketsView = document.getElementById('supportTicketsView');
    const chatView = document.getElementById('supportChatView');
    
    if (createView) createView.classList.add('hidden');
    if (ticketsView) ticketsView.classList.add('hidden');
    if (chatView) chatView.classList.remove('hidden');
    
    currentTicketId = ticketId;
    loadTicketMessages(ticketId);
    startAutoRefresh();
}

// handleCreateTicket gère la soumission du formulaire de création de ticket
async function handleCreateTicket(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/support/create', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('[SUPPORT] Ticket créé avec succès:', data);
            alert('Ticket créé avec succès !');
            e.target.reset();
            // Afficher la vue des tickets et recharger
            showTicketsListView();
            // Attendre un peu pour que la vue soit affichée avant de recharger
            setTimeout(async () => {
                await loadUserTickets();
            }, 100);
        } else {
            alert('Erreur: ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur lors de la création du ticket:', error);
        alert('Erreur lors de la création du ticket');
    }
}

// loadUserTickets charge tous les tickets de l'utilisateur connecté
async function loadUserTickets() {
    try {
        console.log('[SUPPORT] Chargement des tickets...');
        const response = await fetch('/support/tickets');
        const data = await response.json();
        
        console.log('[SUPPORT] Réponse du serveur:', data);
        
        if (data.success) {
            console.log('[SUPPORT] Tickets reçus:', data.tickets);
            displayUserTickets(data.tickets || []);
        } else {
            console.error('[SUPPORT] Erreur:', data.message);
        }
    } catch (error) {
        console.error('[SUPPORT] Erreur lors du chargement des tickets:', error);
    }
}

// displayUserTickets affiche la liste des tickets dans l'interface utilisateur
function displayUserTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    if (!ticketsList) {
        console.error('[SUPPORT] ticketsList element not found!');
        return;
    }
    
    console.log('[SUPPORT] Affichage de', tickets.length, 'tickets');
    
    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucun ticket pour le moment</p>';
        return;
    }
    
    ticketsList.innerHTML = tickets.map(ticket => {
        console.log('[SUPPORT] Ticket:', ticket);
        return `
        <div class="ticket-item" onclick="showChatView(${ticket.id})">
            <div class="ticket-item-header">
                <p class="ticket-item-subject">${escapeHtml(ticket.subject || 'Sans sujet')}</p>
                <span class="ticket-status-badge ${ticket.status || 'open'}">${getStatusLabel(ticket.status || 'open')}</span>
            </div>
            <div class="ticket-item-info">
                <span class="ticket-item-type">${getTypeLabel(ticket.ticketType || 'other')}</span>
                <span>•</span>
                <span>${formatDate(ticket.createdAt || new Date().toISOString())}</span>
                <span>•</span>
                <span>${ticket.messageCount || 0} message${(ticket.messageCount || 0) > 1 ? 's' : ''}</span>
            </div>
        </div>
        `;
    }).join('');
}

// loadTicketMessages charge tous les messages d'un ticket spécifique
async function loadTicketMessages(ticketId) {
    try {
        const response = await fetch(`/support/messages?ticketId=${ticketId}`);
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.messages, 'chatMessages');
            
            // Mettre à jour le sujet du ticket
            const ticketSubject = document.getElementById('chatTicketSubject');
            const ticketIdSpan = document.getElementById('chatTicketId');
            if (ticketSubject && ticketIdSpan) {
                // On récupère le sujet depuis la liste des tickets
                ticketIdSpan.textContent = ticketId;
            }
        } else {
            console.error('Erreur:', data.message);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
    }
}

// displayMessages affiche les messages dans le conteneur de chat
function displayMessages(messages, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = messages.map(msg => `
        <div class="chat-message ${msg.isAdmin ? 'admin' : 'user'}">
            <div class="chat-message-header">
                <span><strong>${msg.isAdmin ? '👨‍💼 Admin' : '👤 Vous'}</strong></span>
                <span class="chat-message-time">${formatDateTime(msg.createdAt)}</span>
            </div>
            <div class="chat-message-text">${escapeHtml(msg.message)}</div>
        </div>
    `).join('');
    
    // Scroll vers le bas
    container.scrollTop = container.scrollHeight;
}

// sendMessage envoie un nouveau message dans un ticket
async function sendMessage() {
    const input = document.getElementById('chatMessageInput');
    if (!input || !input.value.trim() || !currentTicketId) return;
    
    const message = input.value.trim();
    input.value = '';
    
    const formData = new FormData();
    formData.append('ticketId', currentTicketId);
    formData.append('message', message);
    
    try {
        const response = await fetch('/support/message/add', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTicketMessages(currentTicketId);
        } else {
            alert('Erreur: ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert('Erreur lors de l\'envoi du message');
    }
}

// loadAdminTickets charge tous les tickets pour l'interface administrateur
async function loadAdminTickets() {
    try {
        console.log('[SUPPORT ADMIN] Chargement des tickets...');
        const statusFilter = document.getElementById('adminFilterStatus')?.value || '';
        const typeFilter = document.getElementById('adminFilterType')?.value || '';
        
        console.log('[SUPPORT ADMIN] Filtres:', { statusFilter, typeFilter });
        
        const response = await fetch('/support/all');
        const data = await response.json();
        
        console.log('[SUPPORT ADMIN] Réponse du serveur:', data);
        
        if (data.success) {
            let tickets = data.tickets || [];
            console.log('[SUPPORT ADMIN] Tickets reçus (avant filtrage):', tickets.length, tickets);
            
            // Filtrer
            if (statusFilter) {
                tickets = tickets.filter(t => t.status === statusFilter);
                console.log('[SUPPORT ADMIN] Tickets après filtre statut:', tickets.length);
            }
            if (typeFilter) {
                tickets = tickets.filter(t => t.ticketType === typeFilter);
                console.log('[SUPPORT ADMIN] Tickets après filtre type:', tickets.length);
            }
            
            console.log('[SUPPORT ADMIN] Tickets à afficher:', tickets.length, tickets);
            displayAdminTickets(tickets);
        } else {
            console.error('[SUPPORT ADMIN] Erreur:', data.message);
            alert('Erreur: ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('[SUPPORT ADMIN] Erreur lors du chargement des tickets admin:', error);
        alert('Erreur lors du chargement des tickets');
    }
}

// displayAdminTickets affiche la liste des tickets dans l'interface admin
function displayAdminTickets(tickets) {
    const ticketsList = document.getElementById('adminTicketsList');
    if (!ticketsList) {
        console.error('[SUPPORT ADMIN] adminTicketsList element not found!');
        return;
    }
    
    console.log('[SUPPORT ADMIN] Affichage de', tickets.length, 'tickets');
    
    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucun ticket</p>';
        return;
    }
    
    ticketsList.innerHTML = tickets.map(ticket => {
        console.log('[SUPPORT ADMIN] Ticket:', ticket);
        return `
        <div class="admin-ticket-item" onclick="showAdminChatView(${ticket.id})">
            <div class="admin-ticket-item-header">
                <p class="admin-ticket-item-subject">${escapeHtml(ticket.subject || 'Sans sujet')}</p>
                <span class="ticket-status-badge ${ticket.status || 'open'}">${getStatusLabel(ticket.status || 'open')}</span>
            </div>
            <div class="admin-ticket-item-info">
                <span><strong>Utilisateur:</strong> ${escapeHtml(ticket.userPseudo || 'Inconnu')}</span>
                <span>•</span>
                <span class="ticket-item-type">${getTypeLabel(ticket.ticketType || 'other')}</span>
                <span>•</span>
                <span>${formatDate(ticket.createdAt || new Date().toISOString())}</span>
                <span>•</span>
                <span>${ticket.messageCount || 0} message${(ticket.messageCount || 0) > 1 ? 's' : ''}</span>
            </div>
        </div>
        `;
    }).join('');
}

// showAdminTicketsListView affiche la vue liste des tickets pour l'admin
function showAdminTicketsListView() {
    const listView = document.getElementById('adminTicketsListView');
    const chatView = document.getElementById('adminChatView');
    
    if (listView) listView.classList.remove('hidden');
    if (chatView) chatView.classList.add('hidden');
    
    currentTicketId = null;
    stopAutoRefresh();
}

// showAdminChatView affiche la conversation d'un ticket pour l'admin
async function showAdminChatView(ticketId) {
    const listView = document.getElementById('adminTicketsListView');
    const chatView = document.getElementById('adminChatView');
    
    if (listView) listView.classList.add('hidden');
    if (chatView) chatView.classList.remove('hidden');
    
    currentTicketId = ticketId;
    
    // Charger les détails du ticket
    await loadAdminTicketDetails(ticketId);
    await loadAdminTicketMessages(ticketId);
    startAutoRefresh();
}

// loadAdminTicketDetails charge les détails complets d'un ticket pour l'admin
async function loadAdminTicketDetails(ticketId) {
    try {
        const response = await fetch('/support/all');
        const data = await response.json();
        
        if (data.success) {
            const ticket = data.tickets.find(t => t.id === ticketId);
            if (ticket) {
                const subjectEl = document.getElementById('adminChatTicketSubject');
                const idEl = document.getElementById('adminChatTicketId');
                const userEl = document.getElementById('adminChatUserPseudo');
                const statusSelect = document.getElementById('adminTicketStatusSelect');
                
                console.log('[SUPPORT ADMIN] Détails du ticket:', ticket);
                
                // Afficher le sujet au lieu de "Ticket #ID"
                if (subjectEl) {
                    const idSpan = subjectEl.querySelector('span');
                    if (idSpan) {
                        subjectEl.innerHTML = escapeHtml(ticket.subject) + ' <span style="font-size: 14px; color: #666;">#' + ticket.id + '</span>';
                    } else {
                        subjectEl.textContent = escapeHtml(ticket.subject);
                    }
                }
                if (idEl) idEl.textContent = ticket.id;
                if (userEl) userEl.textContent = escapeHtml(ticket.userPseudo);
                if (statusSelect) statusSelect.value = ticket.status || 'open';
                
                // Focus sur le champ de saisie
                const input = document.getElementById('adminChatMessageInput');
                if (input) {
                    setTimeout(() => input.focus(), 100);
                }
            } else {
                console.error('[SUPPORT ADMIN] Ticket non trouvé:', ticketId);
            }
        }
    } catch (error) {
        console.error('[SUPPORT ADMIN] Erreur lors du chargement des détails:', error);
    }
}

// loadAdminTicketMessages charge les messages d'un ticket pour l'admin
async function loadAdminTicketMessages(ticketId) {
    try {
        const response = await fetch(`/support/messages?ticketId=${ticketId}`);
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.messages, 'adminChatMessages');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
    }
}

// sendAdminMessage envoie un message admin dans un ticket
async function sendAdminMessage() {
    const input = document.getElementById('adminChatMessageInput');
    if (!input) {
        console.error('[SUPPORT ADMIN] Champ adminChatMessageInput introuvable');
        return;
    }
    
    if (!input.value.trim()) {
        console.log('[SUPPORT ADMIN] Message vide');
        return;
    }
    
    if (!currentTicketId) {
        console.error('[SUPPORT ADMIN] Aucun ticket sélectionné');
        alert('Aucun ticket sélectionné');
        return;
    }
    
    const message = input.value.trim();
    input.value = '';
    
    console.log('[SUPPORT ADMIN] Envoi du message:', message, 'pour le ticket:', currentTicketId);
    
    const formData = new FormData();
    formData.append('ticketId', currentTicketId);
    formData.append('message', message);
    
    try {
        const response = await fetch('/support/message/add', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        console.log('[SUPPORT ADMIN] Réponse serveur:', data);
        
        if (data.success) {
            await loadAdminTicketMessages(currentTicketId);
            // Focus sur le champ après envoi
            input.focus();
        } else {
            alert('Erreur: ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('[SUPPORT ADMIN] Erreur lors de l\'envoi du message:', error);
        alert('Erreur lors de l\'envoi du message');
    }
}

// updateTicketStatus met à jour le statut d'un ticket (admin uniquement)
async function updateTicketStatus() {
    if (!currentTicketId) return;
    
    const statusSelect = document.getElementById('adminTicketStatusSelect');
    if (!statusSelect) return;
    
    const status = statusSelect.value;
    
    const formData = new FormData();
    formData.append('ticketId', currentTicketId);
    formData.append('status', status);
    
    try {
        const response = await fetch('/support/status/update', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Statut mis à jour avec succès');
            loadAdminTickets();
        } else {
            alert('Erreur: ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut');
    }
}

// startAutoRefresh démarre le rafraîchissement automatique des messages
function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(() => {
        if (currentTicketId) {
            if (isAdmin) {
                loadAdminTicketMessages(currentTicketId);
            } else {
                loadTicketMessages(currentTicketId);
            }
        }
    }, 3000); // Rafraîchir toutes les 3 secondes
}

// stopAutoRefresh arrête le rafraîchissement automatique des messages
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// getStatusLabel retourne le libellé français d'un statut de ticket
function getStatusLabel(status) {
    const labels = {
        'open': 'Ouvert',
        'in_progress': 'En cours',
        'resolved': 'Résolu',
        'closed': 'Fermé'
    };
    return labels[status] || status;
}

// getTypeLabel retourne le libellé français d'un type de ticket
function getTypeLabel(type) {
    const labels = {
        'question': 'Question',
        'password_reset': 'Mot de passe',
        'hacked_account': 'Compte piraté',
        'bug': 'Bug',
        'feature': 'Fonctionnalité',
        'other': 'Autre'
    };
    return labels[type] || type;
}

// formatDate formate une date au format français (JJ/MM/AAAA)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// formatDateTime formate une date et heure au format français
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// escapeHtml échappe les caractères HTML pour éviter les injections XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exposer les fonctions globales pour les onclick
window.showChatView = showChatView;
window.showAdminChatView = showAdminChatView;

