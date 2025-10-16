
function showTab(event, tabName) {
document.querySelectorAll('.form-container').forEach(el => {
    el.classList.remove('active');
});

document.querySelectorAll('.tab').forEach(el => {
    el.classList.remove('active');
});

document.getElementById(tabName).classList.add('active');
event.target.classList.add('active');
}

// Affiche un message
function showMessage(elementId, message, isSuccess) {
const msgElement = document.getElementById(elementId);
msgElement.textContent = message;
msgElement.className = 'message ' + (isSuccess ? 'success' : 'error');
msgElement.style.display = 'block';

// Cache le message après 3 secondes
setTimeout(() => {
    msgElement.style.display = 'none';
}, 3000);
}

// Gestion de la connexion
document.addEventListener('DOMContentLoaded', function() {
const loginForm = document.querySelector('#login form');
const registerForm = document.querySelector('#register form');

// CONNEXION
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    try {
    const response = await fetch('/connect', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    
    if (data.success) {
        showMessage('login-message', '✅ ' + data.message + ' - Bienvenue ' + data.pseudo, true);
        setTimeout(() => {
        window.location.href = '/homepage';
        }, 1000);
    } else {
        showMessage('login-message', '❌ ' + data.message, false);
    }
    } catch (error) {
    showMessage('login-message', '❌ Erreur de connexion au serveur', false);
    }
});

// INSCRIPTION
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    try {
    const response = await fetch('/register', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    
    if (data.success) {
        showMessage('register-message', '✅ ' + data.message + ' - Bienvenue ' + data.pseudo, true);
        // Change vers l'onglet connexion après 1.5 secondes
        setTimeout(() => {
        registerForm.reset();
        showTab('login');
        showMessage('login-message', 'Vous pouvez maintenant vous connecter', true);
        }, 1500);
    } else {
        showMessage('register-message', '❌ ' + data.message, false);
    }
    } catch (error) {
    showMessage('register-message', '❌ Erreur de connexion au serveur', false);
    }
});
});