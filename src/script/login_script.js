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

// Animation du titre au chargement
function animateTitle() {
    const title = document.getElementById('animatedTitle');
    if (title) {
        // Animation de chaque lettre
        const text = title.textContent;
        title.textContent = '';
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.animation = `letterDrop 0.6s ease-out ${index * 0.1}s both`;
            title.appendChild(span);
        });
    }
}

// Ajouter l'animation CSS pour les lettres
const style = document.createElement('style');
style.textContent = `
    @keyframes letterDrop {
        0% {
            opacity: 0;
            transform: translateY(-50px) rotateX(90deg);
        }
        50% {
            transform: translateY(10px) rotateX(-10deg);
        }
        100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
        }
    }
    #animatedTitle span {
        display: inline-block;
    }
`;
document.head.appendChild(style);

// Gestion de la connexion
document.addEventListener('DOMContentLoaded', function() {
    // Lancer l'animation du titre
    animateTitle();
    
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
        // Stocker le pseudo dans localStorage pour la vérification admin
        if (data.pseudo) {
            localStorage.setItem('userPseudo', data.pseudo);
        }
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
        // Stocker le pseudo dans localStorage pour la vérification admin
        if (data.pseudo) {
            localStorage.setItem('userPseudo', data.pseudo);
        }
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