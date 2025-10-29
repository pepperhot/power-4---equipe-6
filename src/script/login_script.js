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
// S'assurer que l'onglet de connexion est actif par défaut
document.getElementById('login').classList.add('active');
document.querySelector('.tab').classList.add('active');

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
        setTimeout(() => {
        window.location.href = '/homepage';
        }, 1000);
    } else {
        showMessage('register-message', '❌ ' + data.message, false);
    }
    } catch (error) {
    showMessage('register-message', '❌ Erreur de connexion au serveur', false);
    }
});
});

// Charger la liste complète des pays via API
fetch('https://restcountries.com/v3.1/all')
    .then(response => response.json())
    .then(data => {
    const select = document.querySelector('select[name="pays"]');
    const pays = data.map(country => country.name.common).sort();
    pays.forEach(pays => {
        const option = document.createElement('option');
        option.value = pays;
        option.textContent = pays;
        select.appendChild(option);
    });
    });