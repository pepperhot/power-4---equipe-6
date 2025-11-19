// Vérifier si l'utilisateur est admin au chargement
document.addEventListener('DOMContentLoaded', async function() {
    // Vérifier le statut admin
    try {
        // Récupérer le pseudo depuis localStorage
        const pseudo = localStorage.getItem('userPseudo') || '';
        const response = await fetch(`/admin/check?pseudo=${encodeURIComponent(pseudo)}`);
        const data = await response.json();
        
        if (!data.success || !data.isAdmin) {
            alert('Accès refusé. Vous devez être administrateur pour accéder à cette page.');
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

// Charger la liste des utilisateurs
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

// Échapper les caractères HTML pour éviter les injections
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Ouvrir le modal d'édition
function editUser(id, nickname, surname, pseudo, email, country, bio, isAdmin, avatar) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editNickname').value = nickname;
    document.getElementById('editSurname').value = surname;
    document.getElementById('editPseudo').value = pseudo;
    document.getElementById('editEmail').value = email;
    document.getElementById('editCountry').value = country;
    document.getElementById('editBio').value = bio;
    document.getElementById('editIsAdmin').checked = isAdmin;
    
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

// Fermer le modal
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

    if (password !== passwordConfirm) {
        showMessage('Les mots de passe ne correspondent pas.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('nickname', document.getElementById('editNickname').value);
    formData.append('surname', document.getElementById('editSurname').value);
    formData.append('pseudo', document.getElementById('editPseudo').value);
    formData.append('email', document.getElementById('editEmail').value);
    formData.append('country', document.getElementById('editCountry').value);
    formData.append('bio', document.getElementById('editBio').value);
    formData.append('isAdmin', document.getElementById('editIsAdmin').checked ? 'true' : 'false');
    // Mot de passe optionnel : seulement si rempli
    if (password) {
        formData.append('password', password);
    }
    
    try {
        const response = await fetch('/admin/user/update', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Utilisateur mis à jour avec succès!', 'success');
            closeModal();
            loadUsers();
        } else {
            showMessage('Erreur: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        showMessage('Erreur lors de la mise à jour de l\'utilisateur.', 'error');
    }
});

// Supprimer un utilisateur
async function deleteUser(userId, pseudo) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${pseudo}" ? Cette action est irréversible.`)) {
        return;
    }
    
    const formData = new FormData();
    formData.append('userId', userId);
    
    try {
        const response = await fetch('/admin/user/delete', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Utilisateur supprimé avec succès!', 'success');
            loadUsers();
        } else {
            showMessage('Erreur: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showMessage('Erreur lors de la suppression de l\'utilisateur.', 'error');
    }
}

// Afficher un message
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

