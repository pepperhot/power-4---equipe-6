// Vérifier si l'utilisateur est admin ou propriétaire au chargement
document.addEventListener('DOMContentLoaded', async function() {
    // Vérifier le statut admin ou propriétaire
    try {
        // Récupérer le pseudo depuis localStorage
        const pseudo = localStorage.getItem('userPseudo') || '';
        const response = await fetch(`/admin/check?pseudo=${encodeURIComponent(pseudo)}`);
        const data = await response.json();
        
        // L'utilisateur peut accéder s'il est admin OU propriétaire
        if (!data.success || !data.isAdmin) {
            alert('Accès refusé. Vous devez être administrateur ou propriétaire pour accéder à cette page.');
            window.location.href = '/homepage';
            return;
        }
        
        // Charger les utilisateurs
        loadUsers();
    } catch (error) {
        console.error('Erreur lors de la vérification admin:', error);
        alert('Erreur lors de la vérification des permissions.');
        window.location.href = '/homepage';
    }
});

// Variable globale pour stocker si l'utilisateur est le propriétaire
let isOwner = false;

// loadUsers charge la liste de tous les utilisateurs depuis le serveur
async function loadUsers() {
    const loading = document.getElementById('loading');
    const usersTable = document.getElementById('usersTable');
    const usersTableBody = document.getElementById('usersTableBody');
    
    try {
        // Récupérer le pseudo depuis localStorage
        const pseudo = localStorage.getItem('userPseudo') || '';
        const response = await fetch(`/admin/users?pseudo=${encodeURIComponent(pseudo)}`);
        const data = await response.json();
        
        console.log('Réponse /admin/users :', data);
        
        if (!data.success) {
            loading.style.display = 'none';
            usersTable.style.display = 'none';
            showMessage('Erreur lors du chargement des utilisateurs: ' + (data.message || 'inconnue'), 'error');
            return;
        }
        
        // Stocker si l'utilisateur est le propriétaire
        isOwner = data.isOwner || false;
        
        loading.style.display = 'none';
        usersTable.style.display = 'table';
        
        // Vider le tableau
        usersTableBody.innerHTML = '';
        
        // Ajouter chaque utilisateur
        data.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nickname || '-'}</td>
                <td>${user.surname || '-'}</td>
                <td>${user.pseudo || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.country || '-'}</td>
                <td>${user.isAdmin ? '<span class="badge-admin">Admin</span>' : '<span class="badge-user">Utilisateur</span>'}</td>
                <td>
                    <button class="btn-edit" onclick="editUser(${user.id}, '${escapeHtml(user.nickname || '')}', '${escapeHtml(user.surname || '')}', '${escapeHtml(user.pseudo || '')}', '${escapeHtml(user.email || '')}', '${escapeHtml(user.country || '')}', '${escapeHtml(user.bio || '')}', ${user.isAdmin}, '${escapeHtml(user.avatar || '')}')">Modifier</button>
                    <button class="btn-delete" onclick="deleteUser(${user.id}, '${escapeHtml(user.pseudo || '')}')">Supprimer</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        showMessage('Erreur lors du chargement des utilisateurs.', 'error');
        loading.style.display = 'none';
    }
}

// escapeHtml échappe les caractères HTML pour éviter les injections XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// editUser ouvre le modal d'édition avec les informations d'un utilisateur
function editUser(id, nickname, surname, pseudo, email, country, bio, isAdmin, avatar) {
    console.log('🔵 [EDIT] Ouverture du modal pour userId:', id, '(type:', typeof id, ')');
    document.getElementById('editUserId').value = id;
    console.log('🔵 [EDIT] editUserId.value après assignation:', document.getElementById('editUserId').value);
    document.getElementById('editNickname').value = nickname;
    document.getElementById('editSurname').value = surname;
    document.getElementById('editPseudo').value = pseudo;
    document.getElementById('editEmail').value = email;
    document.getElementById('editCountry').value = country;
    document.getElementById('editBio').value = bio;
    
    const isAdminCheckbox = document.getElementById('editIsAdmin');
    isAdminCheckbox.checked = isAdmin;
    
    // Désactiver la case "Administrateur" si l'utilisateur n'est pas le propriétaire
    if (!isOwner) {
        isAdminCheckbox.disabled = true;
        isAdminCheckbox.title = 'Seul le propriétaire peut modifier les droits administrateur';
    } else {
        isAdminCheckbox.disabled = false;
        isAdminCheckbox.title = '';
    }
    
    // Vider les champs de mot de passe à chaque ouverture
    const pwd = document.getElementById('editPassword');
    const pwdConfirm = document.getElementById('editPasswordConfirm');
    if (pwd) pwd.value = '';
    if (pwdConfirm) pwdConfirm.value = '';
    
    const avatarPreview = document.getElementById('editAvatarPreview');
    if (avatar && avatar.trim() !== '') {
        avatarPreview.src = avatar;
        avatarPreview.style.display = 'block';
    } else {
        avatarPreview.style.display = 'none';
    }
    
    document.getElementById('editModal').style.display = 'block';
}

// closeModal ferme le modal d'édition et réinitialise le formulaire
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editUserForm').reset();
}

// Gestionnaires d'événements pour le modal
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelEdit').addEventListener('click', closeModal);

// Fermer le modal en cliquant en dehors
window.addEventListener('click', function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Soumettre le formulaire d'édition
document.getElementById('editUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const password = document.getElementById('editPassword').value;
    const passwordConfirm = document.getElementById('editPasswordConfirm').value;

    console.log('🔵 [EDIT] Début de la soumission du formulaire');
    console.log('🔵 [EDIT] userId:', userId);
    console.log('🔵 [EDIT] password rempli:', password ? 'Oui' : 'Non');

    if (password !== passwordConfirm) {
        console.log('❌ [EDIT] Les mots de passe ne correspondent pas');
        showMessage('Les mots de passe ne correspondent pas.', 'error');
        return;
    }

    // Récupérer le pseudo de l'utilisateur connecté (admin)
    const adminPseudo = localStorage.getItem('userPseudo') || '';
    console.log('🔵 [EDIT] adminPseudo depuis localStorage:', adminPseudo);
    
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('adminPseudo', adminPseudo); // Pseudo de l'admin connecté pour l'authentification
    formData.append('nickname', document.getElementById('editNickname').value);
    formData.append('surname', document.getElementById('editSurname').value);
    formData.append('pseudo', document.getElementById('editPseudo').value); // Pseudo de l'utilisateur à modifier
    formData.append('email', document.getElementById('editEmail').value);
    formData.append('country', document.getElementById('editCountry').value);
    formData.append('bio', document.getElementById('editBio').value);
    formData.append('isAdmin', document.getElementById('editIsAdmin').checked ? 'true' : 'false');
    // Mot de passe optionnel : seulement si rempli
    if (password) {
        formData.append('password', password);
    }
    
    // Afficher tous les champs du FormData
    console.log('🔵 [EDIT] FormData envoyé:');
    for (let [key, value] of formData.entries()) {
        console.log(`  - ${key}:`, key === 'password' ? '***' : value);
    }
    
    try {
        console.log('🔵 [EDIT] Envoi de la requête POST vers /admin/user/update');
        const response = await fetch('/admin/user/update', {
            method: 'POST',
            body: formData
        });
        
        console.log('🔵 [EDIT] Réponse reçue, status:', response.status);
        const data = await response.json();
        console.log('🔵 [EDIT] Données de la réponse:', data);
        
        if (data.success) {
            console.log('✅ [EDIT] Utilisateur mis à jour avec succès');
            showMessage('Utilisateur mis à jour avec succès!', 'success');
            closeModal();
            loadUsers();
        } else {
            console.log('❌ [EDIT] Erreur:', data.message);
            showMessage('Erreur: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ [EDIT] Erreur lors de la mise à jour:', error);
        showMessage('Erreur lors de la mise à jour de l\'utilisateur.', 'error');
    }
});

// deleteUser supprime un utilisateur de la base de données après confirmation
async function deleteUser(userId, pseudo) {
    console.log('🔴 [DELETE] Début de la suppression');
    console.log('🔴 [DELETE] userId:', userId);
    console.log('🔴 [DELETE] pseudo utilisateur à supprimer:', pseudo);
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${pseudo}" ? Cette action est irréversible.`)) {
        console.log('🔴 [DELETE] Suppression annulée par l\'utilisateur');
        return;
    }
    
    // Récupérer le pseudo de l'utilisateur connecté (admin)
    const adminPseudo = localStorage.getItem('userPseudo') || '';
    console.log('🔴 [DELETE] adminPseudo depuis localStorage:', adminPseudo);
    
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('adminPseudo', adminPseudo); // Pseudo de l'admin connecté pour l'authentification
    
    // Afficher tous les champs du FormData
    console.log('🔴 [DELETE] FormData envoyé:');
    for (let [key, value] of formData.entries()) {
        console.log(`  - ${key}:`, value);
    }
    
    try {
        console.log('🔴 [DELETE] Envoi de la requête POST vers /admin/user/delete');
        const response = await fetch('/admin/user/delete', {
            method: 'POST',
            body: formData
        });
        
        console.log('🔴 [DELETE] Réponse reçue, status:', response.status);
        const data = await response.json();
        console.log('🔴 [DELETE] Données de la réponse:', data);
        
        if (data.success) {
            console.log('✅ [DELETE] Utilisateur supprimé avec succès');
            showMessage('Utilisateur supprimé avec succès!', 'success');
            loadUsers();
        } else {
            console.log('❌ [DELETE] Erreur:', data.message);
            showMessage('Erreur: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ [DELETE] Erreur lors de la suppression:', error);
        showMessage('Erreur lors de la suppression de l\'utilisateur.', 'error');
    }
}

// showMessage affiche un message de succès ou d'erreur temporaire
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Masquer le message après 5 secondes
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

