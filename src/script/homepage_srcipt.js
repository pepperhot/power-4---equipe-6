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
    const btnGravity = document.getElementById('gravityBtn') || document.querySelector('.btn-gravities-mode');
    const btnPlay = document.getElementById('playBtn') || document.querySelector('.btn-play');
    let selectedMode = localStorage.getItem('selectedMode') || 'normal';

    function setMode(mode) {
        selectedMode = mode;
        try { localStorage.setItem('selectedMode', mode); } catch(_) {}
        updateModeButtons();
        console.log('[mode] sélectionné =', mode);
    }

    // Force la sélection visuelle immédiate et sans condition
    function forceSelect(mode) {
        selectedMode = mode;
        try { localStorage.setItem('selectedMode', mode); } catch(_) {}
        resetButtonVisuals();
        if (mode === 'easy') markActive(btnEasy);
        else if (mode === 'hard') markActive(btnHard);
        else if (mode === 'gravity') markActive(btnGravity);
        else markActive(btnNormal);
    }

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
        if (btnGravity) {
            btnGravity.classList.remove('active');
            btnGravity.setAttribute('aria-pressed','false');
            btnGravity.style.outline = '';
            btnGravity.style.boxShadow = '';
            btnGravity.style.filter = '';
            btnGravity.textContent = 'Gravité';
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
        if (btn === btnGravity) btnGravity.textContent = 'Gravité (sélectionné)';
    }

    function updateModeButtons() {
        resetButtonVisuals();
        if (selectedMode === 'easy') markActive(btnEasy);
        else if (selectedMode === 'hard') markActive(btnHard);
        else if (selectedMode === 'gravity') markActive(btnGravity);
        else markActive(btnNormal);
    }

    // Appliquer l'état initial
    updateModeButtons();

    if (btnEasy) btnEasy.addEventListener('click', () => setMode('easy'));
    if (btnNormal) btnNormal.addEventListener('click', () => setMode('normal'));
    if (btnHard) btnHard.addEventListener('click', () => setMode('hard'));
    if (btnGravity) {
        const onSelectGravity = (e) => { e.preventDefault(); forceSelect('gravity'); };
        btnGravity.addEventListener('click', onSelectGravity);
        btnGravity.addEventListener('mousedown', onSelectGravity);
        btnGravity.addEventListener('touchstart', onSelectGravity, { passive: true });
    }

    // Fallback: délégation d'évènement au cas où l'id/classe change
    const modesContainer = document.querySelector('.mode-buttons');
    if (modesContainer) {
        modesContainer.addEventListener('click', (e) => {
            const t = e.target;
            if (!(t instanceof Element)) return;
            const btn = t.closest('#gravityBtn, .btn-gravities-mode');
            if (btn) {
                forceSelect('gravity');
                return;
            }
        });
    }

    // Sécurité ultime: capture au niveau document pour tout clic sur le bouton
    document.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const btn = t.closest('#gravityBtn, .btn-gravities-mode');
        if (btn) forceSelect('gravity');
    }, true);

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
            } else if (selectedMode === 'gravity') {
                window.location.href = '/temp/grid/grid_gravity.html';
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

    // ---------- Profile section (prénom, nom, pseudo, avatar, bio) ----------
    const profileAvatar = document.getElementById('profileAvatar');
    const profilePseudoMainEl = document.getElementById('profilePseudoMain');
    const profilePseudoHandleEl = document.getElementById('profilePseudo');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileModal = document.getElementById('profileModal');
    const avatarInput = document.getElementById('profileAvatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    const profileFirstNameInput = document.getElementById('profileFirstNameInput');
    const profileLastNameInput = document.getElementById('profileLastNameInput');
    const profilePseudoInput = document.getElementById('profilePseudoInput');
    const profileBioInput = document.getElementById('profileBioInput');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');

    // Variable pour stocker les données du profil
    let profile = { firstName: '', lastName: '', pseudo: '', avatar: '', bio: '', country: '' };

    // Fonction pour charger le profil depuis la DB via /profile
    async function loadProfileFromDB() {
        try {
            const res = await fetch('/profile');
            const data = await res.json();
            if (data.success) {
                profile.firstName = data.firstName || '';
                profile.lastName = data.lastName || '';
                profile.pseudo = data.pseudo || '';
                profile.country = data.country || '';
                profile.avatar = data.avatar || '';
                profile.bio = data.bio || '';
                renderProfile();
            } else {
                // Si pas d'utilisateur connecté, ne rien afficher (pas de valeurs par défaut)
                profile.firstName = '';
                profile.lastName = '';
                profile.pseudo = '';
                renderProfile();
            }
        } catch (err) {
            console.warn('Impossible de charger le profil depuis la DB', err);
            // Pas de fallback vers localStorage, on laisse vide
            profile.firstName = '';
            profile.lastName = '';
            profile.pseudo = '';
            renderProfile();
        }
    }

    function renderProfile() {
        if (profileAvatar) {
            if (profile.avatar) {
                profileAvatar.src = profile.avatar;
            } else {
                profileAvatar.src = '';
            }
        }
        // Afficher uniquement le pseudo comme grand titre
        if (profilePseudoMainEl) profilePseudoMainEl.textContent = profile.pseudo || '';
        // Et en dessous, le handle @pseudo
        if (profilePseudoHandleEl) profilePseudoHandleEl.textContent = profile.pseudo ? ('@' + profile.pseudo) : '';
    }

    function openProfileModal() {
        if (!profileModal) return;
        if (profileFirstNameInput) profileFirstNameInput.value = profile.firstName || '';
        if (profileLastNameInput) profileLastNameInput.value = profile.lastName || '';
        if (profilePseudoInput) profilePseudoInput.value = profile.pseudo || '';
        if (profileBioInput) profileBioInput.value = profile.bio || '';
        if (avatarPreview) avatarPreview.src = profile.avatar || '';
        profileModal.classList.remove('hidden');
    }

    function closeProfileModal() {
        if (!profileModal) return;
        profileModal.classList.add('hidden');
    }

    if (editProfileBtn) editProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openProfileModal();
    });

    // Avatar file -> preview as data URL
    if (avatarInput) avatarInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try { avatarPreview.src = ev.target.result; } catch(_) {}
        };
        reader.readAsDataURL(f);
    });

    if (removeAvatarBtn) removeAvatarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (avatarPreview) avatarPreview.src = '';
    });

    if (saveProfileBtn) saveProfileBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const fn = profileFirstNameInput ? profileFirstNameInput.value.trim() : profile.firstName;
            const ln = profileLastNameInput ? profileLastNameInput.value.trim() : profile.lastName;
            const pseudo = profilePseudoInput ? profilePseudoInput.value.trim() : profile.pseudo;
            const newBio = profileBioInput ? profileBioInput.value.trim() : profile.bio;
            const newAvatar = avatarPreview && avatarPreview.src && avatarPreview.src.startsWith('data:') ? avatarPreview.src : (profile.avatar || '');

            const formData = new FormData();
            formData.append('firstName', fn);
            formData.append('lastName', ln);
            formData.append('pseudo', pseudo);
            formData.append('bio', newBio);
            formData.append('avatar', newAvatar);

            const res = await fetch('/profile/update', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!data.success) {
                console.warn('Erreur mise à jour profil:', data.message);
            } else {
                // Mettre à jour l'objet local avec les nouvelles valeurs validées
                profile.firstName = fn;
                profile.lastName = ln;
                profile.pseudo = pseudo;
                profile.bio = newBio;
                profile.avatar = newAvatar;

                // Mettre à jour le pseudo stocké pour l'admin / autres usages
                try {
                    if (profile.pseudo) {
                        localStorage.setItem('userPseudo', profile.pseudo);
                    }
                } catch(_) {}

                renderProfile();
                closeProfileModal();
            }
        } catch (err) {
            console.warn('Impossible de sauvegarder le profil', err);
        }
    });

    if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeProfileModal();
    });

    // close modal on outside click
    if (profileModal) profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) closeProfileModal();
    });

    // initial render (vide) puis chargement réel depuis la BDD
    renderProfile();
    loadProfileFromDB();
});
