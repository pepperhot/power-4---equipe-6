document.addEventListener('DOMContentLoaded', () => {
    // Éléments pour les couleurs
    const saveBtn = document.querySelector('.btn-save-colors');
    const player1Color = document.getElementById('player1-color');
    const player2Color = document.getElementById('player2-color');

    // Éléments pour les pseudos
    const saveNamesBtn = document.querySelector('.btn-save-names');
    const player1Name = document.getElementById('player1-name');
    const player2Name = document.getElementById('player2-name');

    // Sélection de mode
    const btnEasy = document.getElementById('easyBtn') || document.querySelector('.btn-easy-mode');
    const btnNormal = document.getElementById('normalBtn') || document.querySelector('.btn-normale-mode');
    const btnHard = document.getElementById('hardBtn') || document.querySelector('.btn-hard-mode');
    const btnPlay = document.getElementById('playBtn') || document.querySelector('.btn-play');
    let selectedMode = localStorage.getItem('selectedMode') || 'normal';

    function resetButtonVisuals() {
        if (btnEasy) {
            btnEasy.classList.remove('active');
            btnEasy.setAttribute('aria-pressed','false');
            btnEasy.style.outline = '';
            btnEasy.style.boxShadow = '';
            btnEasy.style.filter = '';
            btnEasy.textContent = 'Facile';
        }
        if (btnNormal) {
            btnNormal.classList.remove('active');
            btnNormal.setAttribute('aria-pressed','false');
            btnNormal.style.outline = '';
            btnNormal.style.boxShadow = '';
            btnNormal.style.filter = '';
            btnNormal.textContent = 'Normal';
        }
        if (btnHard) {
            btnHard.classList.remove('active');
            btnHard.setAttribute('aria-pressed','false');
            btnHard.style.outline = '';
            btnHard.style.boxShadow = '';
            btnHard.style.filter = '';
            btnHard.textContent = 'Difficile';
        }
    }

    function markActive(btn) {
        if (!btn) return;
        btn.classList.add('active');
        btn.setAttribute('aria-pressed','true');
        btn.style.outline = '3px solid rgba(0,0,0,0.25)';
        btn.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.9) inset, 0 0 0 4px rgba(0,0,0,0.2)';
        btn.style.filter = 'brightness(0.95)';
        if (btn === btnEasy) btnEasy.textContent = 'Facile (sélectionné)';
        if (btn === btnNormal) btnNormal.textContent = 'Normal (sélectionné)';
        if (btn === btnHard) btnHard.textContent = 'Difficile (sélectionné)';
    }

    function updateModeButtons() {
        resetButtonVisuals();
        if (selectedMode === 'easy') markActive(btnEasy);
        else if (selectedMode === 'hard') markActive(btnHard);
        else markActive(btnNormal);
    }

    // Appliquer l'état initial
    updateModeButtons();

    if (btnEasy) btnEasy.addEventListener('click', () => { selectedMode = 'easy'; localStorage.setItem('selectedMode','easy'); updateModeButtons(); });
    if (btnNormal) btnNormal.addEventListener('click', () => { selectedMode = 'normal'; localStorage.setItem('selectedMode','normal'); updateModeButtons(); });
    if (btnHard) btnHard.addEventListener('click', () => { selectedMode = 'hard'; localStorage.setItem('selectedMode','hard'); updateModeButtons(); });

    if (btnPlay) btnPlay.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/start?mode=${selectedMode}`);
            if (!res.ok) {
                console.error('Erreur start:', res.status);
            }
            if (selectedMode === 'hard') {
                window.location.href = '/temp/grid_hard/grid_hard.html';
            } else if (selectedMode === 'easy') {
                window.location.href = '/temp/grid/grideasy.html';
            } else {
                window.location.href = '/temp/grid/grid.html';
            }
        } catch(e) { console.error('Erreur start:', e); }
    });

    // Charger les couleurs sauvegardées
    if (player1Color && localStorage.getItem('player1Color')) {
        player1Color.value = localStorage.getItem('player1Color');
    }
    if (player2Color && localStorage.getItem('player2Color')) {
        player2Color.value = localStorage.getItem('player2Color');
    }

    // Charger les pseudos sauvegardés
    if (player1Name && localStorage.getItem('player1Name')) {
        player1Name.value = localStorage.getItem('player1Name');
    }
    if (player2Name && localStorage.getItem('player2Name')) {
        player2Name.value = localStorage.getItem('player2Name');
    }

    // Sauvegarder les couleurs
    if (saveBtn) saveBtn.addEventListener('click', () => {
        if (player1Color) localStorage.setItem('player1Color', player1Color.value);
        if (player2Color) localStorage.setItem('player2Color', player2Color.value);
    });
});

// Boutons de difficulté (pour l'instant: Easy uniquement)
const easyModeBtn = document.querySelector('.btn-easy-mode');
const normalModeBtn = document.querySelector('.btn-normale-mode');
const hardModeBtn = document.querySelector('.btn-hard-mode');
const gravityModeBtn = document.querySelector('.btn-gravities-mode');

if (easyModeBtn) easyModeBtn.addEventListener('click', () => {
    localStorage.setItem('gameMode', 'easy');
    selectedMode = 'easy';
    localStorage.setItem('selectedMode','easy');
    // Laisser le bouton Play lancer /start puis rediriger
    updateModeButtons();
});
