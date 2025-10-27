// Éléments pour les couleurs
const saveBtn = document.querySelector('.btn-save-colors');
const player1Color = document.getElementById('player1-color');
const player2Color = document.getElementById('player2-color');

// Éléments pour les pseudos
const saveNamesBtn = document.querySelector('.btn-save-names');
const player1Name = document.getElementById('player1-name');
const player2Name = document.getElementById('player2-name');

// Charger les couleurs sauvegardées
if (localStorage.getItem('player1Color')) {
    player1Color.value = localStorage.getItem('player1Color');
}
if (localStorage.getItem('player2Color')) {
    player2Color.value = localStorage.getItem('player2Color');
}

// Charger les pseudos sauvegardés
if (localStorage.getItem('player1Name')) {
    player1Name.value = localStorage.getItem('player1Name');
}
if (localStorage.getItem('player2Name')) {
    player2Name.value = localStorage.getItem('player2Name');
}

// Sauvegarder les couleurs
saveBtn.addEventListener('click', () => {
    localStorage.setItem('player1Color', player1Color.value);
    localStorage.setItem('player2Color', player2Color.value);
});

// Boutons de difficulté (pour l'instant: Easy uniquement)
const easyModeBtn = document.querySelector('.btn-easy-mode');
const normalModeBtn = document.querySelector('.btn-normale-mode');
const hardModeBtn = document.querySelector('.btn-hard-mode');
const gravityModeBtn = document.querySelector('.btn-gravities-mode');

if (easyModeBtn) easyModeBtn.addEventListener('click', () => {
    // Active le mode facile et lance la partie
    localStorage.setItem('gameMode', 'easy');
    window.location.href = '/temp/grid/grideasy.html';
});
