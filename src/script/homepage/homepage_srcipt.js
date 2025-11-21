// Variable globale pour le profil (sera initialisée dans DOMContentLoaded)
let profile = { firstName: '', lastName: '', pseudo: '', avatar: '', bio: '', country: '', xp: 0, level: 1 };

// Fonction pour vérifier le statut admin et afficher/masquer le bouton Dashboard
// checkAdminStatus vérifie si l'utilisateur connecté est administrateur ou propriétaire
// Copie exacte de la fonction support qui fonctionne
async function checkAdminStatus() {
    try {
        const dashboardLink = document.getElementById('dashboardLink');
        if (!dashboardLink) {
            console.warn('[ADMIN] Élément dashboardLink non trouvé');
            return;
        }
        
        dashboardLink.style.display = 'none';
        
        const storedPseudo = localStorage.getItem('userPseudo') || '';
        const url = storedPseudo 
            ? `/admin/check?pseudo=${encodeURIComponent(storedPseudo)}`
            : '/admin/check';

        const response = await fetch(url);
        const data = await response.json();
        
        console.log('[ADMIN] Réponse admin check:', data);
        
        if (data.success && data.isAdmin) {
            dashboardLink.style.display = 'flex';
            console.log('[ADMIN] ✅ Bouton Dashboard Admin affiché');
        } else {
            dashboardLink.style.display = 'none';
            console.log('[ADMIN] ❌ Bouton Dashboard masqué');
        }
    } catch (error) {
        console.error('[ADMIN] Erreur:', error);
        const dashboardLink = document.getElementById('dashboardLink');
        if (dashboardLink) {
            dashboardLink.style.display = 'none';
        }
    }
}

// Exposer la fonction globalement
window.checkAdminStatus = checkAdminStatus;

document.addEventListener('DOMContentLoaded', () => {
    // Navigation principale
    const btnVsAI = document.getElementById('btnVsAI');
    const btnVsPlayer = document.getElementById('btnVsPlayer');
    const aiSection = document.getElementById('aiSection');
    const playerSection = document.getElementById('playerSection');
    const mainGameButtons = document.querySelector('.main-game-buttons');
    const backFromAI = document.getElementById('backFromAI');
    const backFrom1V1 = document.getElementById('backFrom1V1');

    // Fonction pour afficher une section et cacher les autres
    function showSection(section) {
        if (mainGameButtons) mainGameButtons.style.display = 'none';
        if (aiSection) aiSection.classList.add('hidden');
        if (playerSection) playerSection.classList.add('hidden');
        
        if (section === 'ai' && aiSection) {
            aiSection.classList.remove('hidden');
        } else if (section === 'player' && playerSection) {
            playerSection.classList.remove('hidden');
        } else if (section === 'main' && mainGameButtons) {
            mainGameButtons.style.display = 'flex';
        }
    }

    // Événements pour les boutons principaux
    if (btnVsAI) {
        btnVsAI.addEventListener('click', () => {
            showSection('ai');
        });
    }

    if (btnVsPlayer) {
        btnVsPlayer.addEventListener('click', () => {
            showSection('player');
        });
    }

    // Les gestionnaires pour les boutons de retour seront ajoutés après la définition des fonctions

    // Éléments pour les couleurs
    const saveBtn = document.querySelector('.btn-save-colors');
    const player1Color = document.getElementById('player1-color');
    const player2Color = document.getElementById('player2-color');
    const player1Color1v1 = document.getElementById('player1-color-1v1');
    const player2Color1v1 = document.getElementById('player2-color-1v1');

    // Éléments pour la sélection du niveau IA
    const aiEasyBtn = document.getElementById('aiEasyBtn');
    const aiMediumBtn = document.getElementById('aiMediumBtn');
    const aiHardBtn = document.getElementById('aiHardBtn');
    const aiImpossibleBtn = document.getElementById('aiImpossibleBtn');
    // Aucun niveau IA sélectionné par défaut
    let selectedAILevel = '';
    window.selectedAILevel = selectedAILevel; // Exposer globalement

    // Sélection de mode
    const btnEasy = document.getElementById('easyBtn') || document.querySelector('.btn-easy-mode');
    const btnNormal = document.getElementById('normalBtn') || document.querySelector('.btn-normale-mode');
    const btnHard = document.getElementById('hardBtn') || document.querySelector('.btn-hard-mode');
    const btnGravity = document.getElementById('gravityBtn') || document.querySelector('.btn-gravities-mode');
    const btnPlay = document.getElementById('playBtnAI') || document.getElementById('playBtn1V1') || document.querySelector('.btn-play');
    // Aucun mode sélectionné par défaut
    // Exposer les variables globalement pour que le script inline puisse y accéder
    let selectedMode = '';
    window.selectedMode = selectedMode;

    function setMode(mode) {
        selectedMode = mode;
        window.selectedMode = mode; // Exposer globalement
        // Désélectionner le niveau IA si un mode de jeu est sélectionné
        selectedAILevel = '';
        window.selectedAILevel = ''; // Exposer globalement
        resetAIButtonVisuals();
        // Ne pas sauvegarder dans localStorage pour forcer la sélection à chaque chargement
        // try { localStorage.setItem('selectedMode', mode); } catch(_) {}
        updateModeButtons();
        console.log('[mode] sélectionné =', mode);
    }

    // Force la sélection visuelle immédiate et sans condition
    function forceSelect(mode) {
        selectedMode = mode;
        window.selectedMode = mode; // Exposer globalement
        // Désélectionner le niveau IA si un mode de jeu est sélectionné
        selectedAILevel = '';
        window.selectedAILevel = ''; // Exposer globalement
        resetAIButtonVisuals();
        resetButtonVisuals();
        if (mode === 'easy') markActive(btnEasy);
        else if (mode === 'hard') markActive(btnHard);
        else if (mode === 'gravity') markActive(btnGravity);
        else if (mode === 'normal') markActive(btnNormal);
    }

    function resetButtonVisuals() {
        if (btnEasy) {
            btnEasy.classList.remove('active');
            btnEasy.setAttribute('aria-pressed','false');
            btnEasy.style.outline = '';
            btnEasy.style.boxShadow = '';
            btnEasy.style.filter = '';
            btnEasy.style.transform = '';
            btnEasy.style.transition = '';
        }
        if (btnNormal) {
            btnNormal.classList.remove('active');
            btnNormal.setAttribute('aria-pressed','false');
            btnNormal.style.outline = '';
            btnNormal.style.boxShadow = '';
            btnNormal.style.filter = '';
            btnNormal.style.transform = '';
            btnNormal.style.transition = '';
        }
        if (btnHard) {
            btnHard.classList.remove('active');
            btnHard.setAttribute('aria-pressed','false');
            btnHard.style.outline = '';
            btnHard.style.boxShadow = '';
            btnHard.style.filter = '';
            btnHard.style.transform = '';
            btnHard.style.transition = '';
        }
        if (btnGravity) {
            btnGravity.classList.remove('active');
            btnGravity.setAttribute('aria-pressed','false');
            btnGravity.style.outline = '';
            btnGravity.style.boxShadow = '';
            btnGravity.style.filter = '';
            btnGravity.style.transform = '';
            btnGravity.style.transition = '';
        }
    }

    function markActive(btn) {
        if (!btn) return;
        btn.classList.add('active');
        btn.setAttribute('aria-pressed','true');
        btn.style.outline = '';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        btn.style.filter = 'brightness(1.05)';
        btn.style.transform = 'scale(1.08)';
        btn.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    }

    function updateModeButtons() {
        resetButtonVisuals();
        if (selectedMode === 'easy') markActive(btnEasy);
        else if (selectedMode === 'hard') markActive(btnHard);
        else if (selectedMode === 'gravity') markActive(btnGravity);
        else if (selectedMode === 'normal') markActive(btnNormal);
        // Si selectedMode est vide, aucun bouton n'est sélectionné
    }

    // Ne pas appliquer l'état initial - aucun mode sélectionné par défaut
    // Réinitialiser visuellement tous les boutons au chargement
    resetButtonVisuals();

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

    // Gestion du bouton Play pour l'IA
    const btnPlayAI = document.getElementById('playBtnAI');
    if (btnPlayAI) {
        btnPlayAI.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!selectedAILevel || selectedAILevel === '') {
                alert('Veuillez sélectionner un niveau IA avant de commencer.');
                return;
            }
            
            try {
                // Sauvegarder le niveau de l'IA dans le localStorage
                localStorage.setItem('selectedAILevel', selectedAILevel);
                const res = await fetch(`/start?mode=normal&aiLevel=${selectedAILevel}`);
                if (!res.ok) {
                    console.error('Erreur start:', res.status);
                }
                window.location.href = '/templates/grid/grid.html';
            } catch(e) { console.error('Erreur start:', e); }
        });
    }

    // Gestion du bouton Play pour 1V1
    const btnPlay1V1 = document.getElementById('playBtn1V1');
    if (btnPlay1V1) {
        btnPlay1V1.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!selectedMode || selectedMode === '') {
                alert('Veuillez sélectionner un mode de jeu avant de commencer.');
                return;
            }
            
            try {
                const res = await fetch(`/start?mode=${selectedMode}`);
                if (!res.ok) {
                    console.error('Erreur start:', res.status);
                }
                // Rediriger selon le mode
                if (selectedMode === 'hard') {
                    window.location.href = '/templates/grid/grid_hard.html';
                } else if (selectedMode === 'easy') {
                    window.location.href = '/templates/grid/grideasy.html';
                } else if (selectedMode === 'gravity') {
                    window.location.href = '/templates/grid/grid_gravity.html';
                } else {
                    window.location.href = '/templates/grid/grid.html';
                }
            } catch(e) { console.error('Erreur start:', e); }
        });
    }

    // Charger les couleurs sauvegardées
    if (player1Color && localStorage.getItem('player1Color')) {
        player1Color.value = localStorage.getItem('player1Color');
    }
    if (player2Color && localStorage.getItem('player2Color')) {
        player2Color.value = localStorage.getItem('player2Color');
    }
    if (player1Color1v1 && localStorage.getItem('player1Color')) {
        player1Color1v1.value = localStorage.getItem('player1Color');
    }
    if (player2Color1v1 && localStorage.getItem('player2Color')) {
        player2Color1v1.value = localStorage.getItem('player2Color');
    }

    // Fonctions pour gérer la sélection du niveau IA
    function setAILevel(level) {
        selectedAILevel = level;
        window.selectedAILevel = level; // Exposer globalement
        // Désélectionner le mode de jeu si un niveau IA est sélectionné
        selectedMode = '';
        window.selectedMode = ''; // Exposer globalement
        resetButtonVisuals();
        // Ne pas sauvegarder dans localStorage pour forcer la sélection à chaque chargement
        // try { localStorage.setItem('selectedAILevel', level); } catch(_) {}
        updateAIButtons();
        console.log('[IA] niveau sélectionné =', level);
    }

    function resetAIButtonVisuals() {
        [aiEasyBtn, aiMediumBtn, aiHardBtn, aiImpossibleBtn].forEach(btn => {
            if (btn) {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
                btn.style.outline = '';
                btn.style.boxShadow = '';
                btn.style.filter = '';
                btn.style.transform = '';
                btn.style.transition = '';
            }
        });
    }

    function markAIActive(btn) {
        if (!btn) return;
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.style.outline = '';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        btn.style.filter = 'brightness(1.05)';
        btn.style.transform = 'scale(1.08)';
        btn.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    }

    function updateAIButtons() {
        resetAIButtonVisuals();
        if (selectedAILevel === 'easy') markAIActive(aiEasyBtn);
        else if (selectedAILevel === 'medium') markAIActive(aiMediumBtn);
        else if (selectedAILevel === 'hard') markAIActive(aiHardBtn);
        else if (selectedAILevel === 'impossible') markAIActive(aiImpossibleBtn);
        // Si selectedAILevel est vide, aucun bouton n'est sélectionné
    }

    // Ne pas appliquer l'état initial - aucun niveau IA sélectionné par défaut
    // Réinitialiser visuellement tous les boutons IA au chargement
    resetAIButtonVisuals();

    // Événements pour les boutons IA
    if (aiEasyBtn) aiEasyBtn.addEventListener('click', () => setAILevel('easy'));
    if (aiMediumBtn) aiMediumBtn.addEventListener('click', () => setAILevel('medium'));
    if (aiHardBtn) aiHardBtn.addEventListener('click', () => setAILevel('hard'));
    if (aiImpossibleBtn) aiImpossibleBtn.addEventListener('click', () => setAILevel('impossible'));

    // Gestionnaires pour les boutons de retour (après définition des fonctions)
    if (backFromAI) {
        backFromAI.addEventListener('click', () => {
            showSection('main');
            // Réinitialiser la sélection IA
            selectedAILevel = '';
            window.selectedAILevel = '';
            resetAIButtonVisuals();
        });
    }

    if (backFrom1V1) {
        backFrom1V1.addEventListener('click', () => {
            showSection('main');
            // Réinitialiser la sélection de mode
            selectedMode = '';
            window.selectedMode = '';
            resetButtonVisuals();
        });
    }

    // Sauvegarder les couleurs
    const saveBtns = document.querySelectorAll('.btn-save-colors');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Sauvegarder depuis la section active
            const activeSection = aiSection && !aiSection.classList.contains('hidden') ? 'ai' : 
                                 playerSection && !playerSection.classList.contains('hidden') ? '1v1' : 'ai';
            
            if (activeSection === 'ai') {
                if (player1Color) localStorage.setItem('player1Color', player1Color.value);
                if (player2Color) localStorage.setItem('player2Color', player2Color.value);
            } else if (activeSection === '1v1') {
                if (player1Color1v1) localStorage.setItem('player1Color', player1Color1v1.value);
                if (player2Color1v1) localStorage.setItem('player2Color', player2Color1v1.value);
            }
        });
    });

    // ---------- Profile section (prénom, nom, pseudo, avatar, bio) ----------
    const profileAvatar = document.getElementById('profileAvatar');
    const profilePseudoMainEl = document.getElementById('profilePseudoMain');
    const profilePseudoHandleEl = document.getElementById('profilePseudo');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const avatarInput = document.getElementById('profileAvatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    const profileFirstNameInput = document.getElementById('profileFirstNameInput');
    const profileLastNameInput = document.getElementById('profileLastNameInput');
    const profilePseudoInput = document.getElementById('profilePseudoInput');
    const profileBioInput = document.getElementById('profileBioInput');
    const bioCharCount = document.getElementById('bioCharCount');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');

    // Sauvegarder le contenu original du bouton de sauvegarde
    const saveProfileBtnOriginalContent = saveProfileBtn ? saveProfileBtn.innerHTML : '';

    // Variable pour stocker les données du profil (utilise la variable globale définie plus haut)
    // profile est déjà défini globalement avant DOMContentLoaded

    // Fonction pour charger le profil depuis la DB via /profile
    // loadProfileFromDB charge les informations du profil utilisateur depuis la base de données
    async function loadProfileFromDB() {
        console.log('[HOMEPAGE] Chargement du profil...');
        try {
            const res = await fetch('/profile');
            console.log('[HOMEPAGE] Réponse /profile, status:', res.status);
            const data = await res.json();
            console.log('[HOMEPAGE] Données du profil:', data);
            
            if (data.success) {
                const oldXP = profile.xp || 0;
                const oldLevel = profile.level || 1;
                
                profile.firstName = data.firstName || '';
                profile.lastName = data.lastName || '';
                profile.pseudo = data.pseudo || '';
                profile.country = data.country || '';
                profile.avatar = data.avatar || '';
                profile.bio = data.bio || '';
                profile.xp = data.xp || 0;
                profile.level = data.level || 1;
                
                // Mettre à jour le pseudo dans localStorage pour la vérification admin
                if (profile.pseudo) {
                    try {
                        localStorage.setItem('userPseudo', profile.pseudo);
                        console.log('[HOMEPAGE] Pseudo mis à jour dans localStorage:', profile.pseudo);
                    } catch (e) {
                        console.warn('[HOMEPAGE] Impossible de sauvegarder le pseudo dans localStorage:', e);
                    }
                }
                
                console.log('[HOMEPAGE] XP chargé:', {
                    ancienXP: oldXP,
                    nouveauXP: profile.xp,
                    ancienNiveau: oldLevel,
                    nouveauNiveau: profile.level
                });
                
                // Sauvegarder les anciennes valeurs dans localStorage pour animateXPBar
                try {
                    localStorage.setItem('oldXP', oldXP.toString());
                    localStorage.setItem('oldLevel', oldLevel.toString());
                } catch (e) {
                    console.warn('[HOMEPAGE] Impossible de sauvegarder oldXP/oldLevel:', e);
                }
                
                renderProfile();
                
                // Retourner les anciennes valeurs pour l'animation
                return { oldXP, oldLevel };
            } else {
                console.log('[HOMEPAGE] Pas d\'utilisateur connecté');
                // Si pas d'utilisateur connecté, ne rien afficher (pas de valeurs par défaut)
                profile.firstName = '';
                profile.lastName = '';
                profile.pseudo = '';
                profile.xp = 0;
                profile.level = 1;
                renderProfile();
                return { oldXP: 0, oldLevel: 1 };
            }
        } catch (err) {
            console.error('[HOMEPAGE] ❌ Erreur lors du chargement du profil:', err);
            // Pas de fallback vers localStorage, on laisse vide
            profile.firstName = '';
            profile.lastName = '';
            profile.pseudo = '';
            profile.xp = 0;
            profile.level = 1;
            renderProfile();
            return { oldXP: 0, oldLevel: 1 };
        }
    }

    // renderProfile affiche les informations du profil dans l'interface
    function renderProfile() {
        if (profileAvatar) {
            if (profile.avatar) {
                profileAvatar.src = profile.avatar;
                profileAvatar.style.display = 'block';
            } else {
                profileAvatar.src = '';
                profileAvatar.style.display = 'none';
            }
        }
        // Afficher uniquement le pseudo comme grand titre
        if (profilePseudoMainEl) profilePseudoMainEl.textContent = profile.pseudo || 'Pseudo';
        // Et en dessous, le handle @pseudo
        if (profilePseudoHandleEl) profilePseudoHandleEl.textContent = profile.pseudo ? ('@' + profile.pseudo) : '@pseudo';
        
        // Afficher l'XP et le niveau avec barre de progression
        const profileXP = document.getElementById('profileXP');
        const profileLevel = document.getElementById('profileLevel');
        const xpProgressFill = document.getElementById('xpProgressFill');
        const xpRemaining = document.getElementById('xpRemaining');
        
        const currentXP = profile.xp || 0;
        const currentLevel = profile.level || 1;
        const xpForCurrentLevel = (currentLevel - 1) * 100; // XP nécessaire pour atteindre le niveau actuel
        const xpForNextLevel = currentLevel * 100; // XP nécessaire pour le prochain niveau
        const xpInCurrentLevel = currentXP - xpForCurrentLevel; // XP dans le niveau actuel
        const xpNeededForNext = xpForNextLevel - currentXP; // XP restant pour le prochain niveau
        const progressPercent = (xpInCurrentLevel / 100) * 100; // Pourcentage de progression (100 XP par niveau)
        
        if (profileXP) profileXP.textContent = currentXP.toLocaleString();
        if (profileLevel) profileLevel.textContent = currentLevel;
        
        if (xpProgressFill) {
            xpProgressFill.style.width = Math.min(progressPercent, 100) + '%';
        }
        
        if (xpRemaining) {
            const nextLevel = currentLevel + 1;
            xpRemaining.textContent = `${xpNeededForNext.toLocaleString()} XP pour NIVEAU ${nextLevel}`;
        }
    }

    function updateBioCharCount() {
        if (bioCharCount && profileBioInput) {
            const count = profileBioInput.value.length;
            bioCharCount.textContent = count;
            if (count > 160) {
                bioCharCount.style.color = '#ef4444';
            } else if (count > 140) {
                bioCharCount.style.color = '#f59e0b';
            } else {
                bioCharCount.style.color = '#9ca3af';
            }
        }
    }

    function openProfileModal() {
        if (!profileModal) return;
        if (profileFirstNameInput) profileFirstNameInput.value = profile.firstName || '';
        if (profileLastNameInput) profileLastNameInput.value = profile.lastName || '';
        if (profilePseudoInput) profilePseudoInput.value = profile.pseudo || '';
        if (profileBioInput) {
            profileBioInput.value = profile.bio || '';
            updateBioCharCount();
        }
        if (avatarPreview) {
            if (profile.avatar) {
                avatarPreview.src = profile.avatar;
            } else {
                avatarPreview.src = '';
            }
            updateAvatarDisplay();
        }
        // Réinitialiser l'input file
        if (avatarInput) avatarInput.value = '';
        // Réinitialiser le bouton de sauvegarde
        if (saveProfileBtn) {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = saveProfileBtnOriginalContent;
        }
        profileModal.classList.remove('hidden');
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
    }

    function closeProfileModal() {
        if (!profileModal) return;
        profileModal.classList.add('hidden');
        // Réactiver le scroll du body
        document.body.style.overflow = '';
        // Réinitialiser l'avatar preview si on a annulé
        if (avatarPreview && avatarInput && !avatarInput.files.length) {
            avatarPreview.src = profile.avatar || '';
        }
        // Réinitialiser le bouton de sauvegarde
        if (saveProfileBtn) {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = saveProfileBtnOriginalContent;
        }
    }

    if (editProfileBtn) editProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openProfileModal();
    });

    // Bouton de fermeture
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeProfileModal();
        });
    }

    // Fonction pour mettre à jour l'affichage de l'avatar
    function updateAvatarDisplay() {
        if (avatarPreview) {
            const hasImage = avatarPreview.src && avatarPreview.src.trim() !== '';
            if (hasImage) {
                avatarPreview.style.display = 'block';
            } else {
                avatarPreview.style.display = 'none';
            }
        }
    }

    // Avatar file -> preview as data URL
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) {
                updateAvatarDisplay();
                return;
            }
            
            // Vérifier la taille du fichier (max 5MB)
            if (f.size > 5 * 1024 * 1024) {
                alert('Le fichier est trop volumineux. Taille maximale : 5MB');
                avatarInput.value = '';
                updateAvatarDisplay();
                return;
            }
            
            // Vérifier le type de fichier
            if (!f.type.startsWith('image/')) {
                alert('Veuillez sélectionner une image valide');
                avatarInput.value = '';
                updateAvatarDisplay();
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    if (avatarPreview) {
                        avatarPreview.src = ev.target.result;
                        updateAvatarDisplay();
                    }
                } catch(err) {
                    console.error('Erreur lors de la prévisualisation:', err);
                    updateAvatarDisplay();
                }
            };
            reader.onerror = function() {
                alert('Erreur lors de la lecture du fichier');
                avatarInput.value = '';
                updateAvatarDisplay();
            };
            reader.readAsDataURL(f);
        });
    }

    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (avatarPreview) {
                avatarPreview.src = '';
            }
            if (avatarInput) {
                avatarInput.value = '';
            }
            updateAvatarDisplay();
        });
    }

    // Compteur de caractères pour la bio
    if (profileBioInput) {
        profileBioInput.addEventListener('input', updateBioCharCount);
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Désactiver le bouton pendant la sauvegarde
            saveProfileBtn.disabled = true;
            saveProfileBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Enregistrement...';
            
            try {
                const fn = profileFirstNameInput ? profileFirstNameInput.value.trim() : profile.firstName;
                const ln = profileLastNameInput ? profileLastNameInput.value.trim() : profile.lastName;
                const pseudo = profilePseudoInput ? profilePseudoInput.value.trim() : profile.pseudo;
                
                if (!pseudo) {
                    alert('Le pseudo est obligatoire');
                    saveProfileBtn.disabled = false;
                    saveProfileBtn.innerHTML = saveProfileBtnOriginalContent;
                    return;
                }
                
                const newBio = profileBioInput ? profileBioInput.value.trim() : profile.bio;
                
                const formData = new FormData();
                formData.append('firstName', fn);
                formData.append('lastName', ln);
                formData.append('pseudo', pseudo);
                formData.append('bio', newBio);
                
                // Gérer l'avatar : si un fichier est sélectionné, l'envoyer comme fichier
                // Sinon, envoyer la data URL ou l'ancienne image
                if (avatarInput && avatarInput.files && avatarInput.files.length > 0) {
                    // Un nouveau fichier a été sélectionné, l'envoyer comme fichier
                    formData.append('avatarFile', avatarInput.files[0]);
                } else {
                    // Pas de nouveau fichier, envoyer la data URL ou l'ancienne image
                    let newAvatar = '';
                    if (avatarPreview && avatarPreview.src) {
                        if (avatarPreview.src.startsWith('data:')) {
                            // Nouvelle image sélectionnée (data URL)
                            newAvatar = avatarPreview.src;
                        } else if (avatarPreview.src && !avatarPreview.src.startsWith('data:')) {
                            // Ancienne image toujours là
                            newAvatar = avatarPreview.src;
                        }
                    }
                    // Si l'avatar a été supprimé (pas de src), on envoie une chaîne vide
                    if (avatarPreview && !avatarPreview.src) {
                        newAvatar = '';
                    }
                    formData.append('avatar', newAvatar);
                }

                const res = await fetch('/profile/update', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (!data.success) {
                    console.warn('Erreur mise à jour profil:', data.message);
                    alert('Erreur lors de la mise à jour : ' + (data.message || 'Erreur inconnue'));
                    saveProfileBtn.disabled = false;
                    saveProfileBtn.innerHTML = saveProfileBtnOriginalContent;
                } else {
                    // Mettre à jour le pseudo stocké pour l'admin / autres usages
                    try {
                        if (pseudo) {
                            localStorage.setItem('userPseudo', pseudo);
                        }
                    } catch(_) {}

                    // Recharger le profil depuis la DB pour avoir les données à jour (incluant l'avatar)
                    await loadProfileFromDB();
                    
                    renderProfile();
                    
                    // Re-vérifier le statut admin au cas où il aurait changé
                    await checkAdminStatus();
                    
                    closeProfileModal();
                }
            } catch (err) {
                console.warn('Impossible de sauvegarder le profil', err);
                alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
                saveProfileBtn.disabled = false;
                saveProfileBtn.innerHTML = saveProfileBtnOriginalContent;
            }
        });
    }

    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeProfileModal();
        });
    }

    // Fermer le modal en cliquant sur le backdrop
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            // Si on clique sur le backdrop (pas sur le contenu)
            if (e.target === profileModal || e.target.classList.contains('profile-modal-backdrop')) {
                closeProfileModal();
            }
        });
    }

    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && profileModal && !profileModal.classList.contains('hidden')) {
            closeProfileModal();
        }
    });

    // initial render (vide) puis chargement réel depuis la BDD
    renderProfile();
    loadProfileFromDB().then(() => {
        // Animer la barre d'XP si on vient de gagner de l'XP
        animateXPBar();
        
        // Vérifier le statut admin après le chargement du profil
        // pour s'assurer que le pseudo est bien chargé dans localStorage
        console.log('[ADMIN] Appel de checkAdminStatus() après chargement du profil');
        try {
            checkAdminStatus().catch(err => {
                console.error('[ADMIN] Erreur dans checkAdminStatus():', err);
            });
        } catch (err) {
            console.error('[ADMIN] Erreur lors de l\'appel de checkAdminStatus():', err);
        }
    }).catch((err) => {
        console.error('[HOMEPAGE] Erreur lors du chargement du profil:', err);
        // Même en cas d'erreur, essayer de vérifier le statut admin
        checkAdminStatus();
    });
    
    // Charger le leaderboard
    loadLeaderboard();
    
    // Vérifier le statut admin pour afficher/masquer le bouton Dashboard
    // Fonction inline pour s'assurer qu'elle s'exécute (comme le support)
    (async function() {
        try {
            const dashboardLink = document.getElementById('dashboardLink');
            if (!dashboardLink) {
                console.warn('[ADMIN] Élément dashboardLink non trouvé');
                return;
            }
            
            dashboardLink.style.display = 'none';
            
            const storedPseudo = localStorage.getItem('userPseudo') || '';
            const url = storedPseudo 
                ? `/admin/check?pseudo=${encodeURIComponent(storedPseudo)}`
                : '/admin/check';

            const response = await fetch(url);
            const data = await response.json();
            
            console.log('[ADMIN] Réponse admin check:', data);
            
            if (data.success && data.isAdmin) {
                dashboardLink.style.display = 'flex';
                console.log('[ADMIN] ✅ Bouton Dashboard Admin affiché');
            } else {
                dashboardLink.style.display = 'none';
                console.log('[ADMIN] ❌ Bouton Dashboard masqué');
            }
        } catch (error) {
            console.error('[ADMIN] Erreur:', error);
            const dashboardLink = document.getElementById('dashboardLink');
            if (dashboardLink) {
                dashboardLink.style.display = 'none';
            }
        }
    })();
});


// Fonction pour animer la barre d'XP après une victoire
// animateXPBar anime la barre de progression XP
function animateXPBar() {
    const xpGained = localStorage.getItem('xpGained');
    const newXP = localStorage.getItem('newXP');
    const newLevel = localStorage.getItem('newLevel');
    
    if (xpGained && newXP && newLevel) {
        // Récupérer l'XP actuel depuis localStorage ou utiliser 0 par défaut
        // (profile n'est pas accessible ici car il est dans la portée du DOMContentLoaded)
        const oldXP = parseInt(localStorage.getItem('oldXP')) || 0;
        const oldLevel = parseInt(localStorage.getItem('oldLevel')) || 1;
        const finalXP = parseInt(newXP);
        const finalLevel = parseInt(newLevel);
        
        // Attendre un peu pour que le DOM soit prêt
        setTimeout(() => {
            // Animer directement avec les valeurs du localStorage
            // Le profil a déjà été chargé par loadProfileFromDB() dans DOMContentLoaded
            const xpProgressFill = document.getElementById('xpProgressFill');
            const profileLevel = document.getElementById('profileLevel');
            const xpRemaining = document.getElementById('xpRemaining');
            
            if (xpProgressFill && profileLevel) {
                // Animation du niveau si changement
                if (finalLevel > oldLevel) {
                    animateLevelUp(oldLevel, finalLevel, profileLevel);
                } else {
                    profileLevel.textContent = finalLevel;
                }
                
                // Animation de la barre d'XP
                animateXPProgress(oldXP, finalXP, finalLevel, xpProgressFill, xpRemaining);
            }
            
            // Nettoyer le localStorage après l'animation
            setTimeout(() => {
                localStorage.removeItem('xpGained');
                localStorage.removeItem('newXP');
                localStorage.removeItem('newLevel');
            }, 2000);
        }, 300);
    }
}

// Fonction pour animer la progression de l'XP
// animateXPProgress anime la progression de la barre d'XP entre deux valeurs
function animateXPProgress(startXP, endXP, level, progressBar, xpRemainingEl) {
    const xpForCurrentLevel = (level - 1) * 100;
    const startXPInLevel = Math.max(0, startXP - xpForCurrentLevel);
    const endXPInLevel = Math.max(0, endXP - xpForCurrentLevel);
    const startPercent = Math.min((startXPInLevel / 100) * 100, 100);
    const endPercent = Math.min((endXPInLevel / 100) * 100, 100);
    
    // Mettre à jour le texte d'XP restant
    if (xpRemainingEl) {
        const xpNeeded = (level * 100) - endXP;
        const nextLevel = level + 1;
        xpRemainingEl.textContent = `${xpNeeded.toLocaleString()} XP pour NIVEAU ${nextLevel}`;
    }
    
    // Si on passe au niveau suivant, animer jusqu'à 100% puis recommencer
    if (endXP >= level * 100 && startXP < level * 100) {
        // Animer jusqu'à 100%
        progressBar.style.width = startPercent + '%';
        progressBar.style.transition = 'width 0.8s ease-out';
        setTimeout(() => {
            progressBar.style.width = '100%';
            setTimeout(() => {
                // Réinitialiser et animer vers le nouveau pourcentage
                progressBar.style.width = '0%';
                progressBar.style.transition = 'width 0.2s ease-out';
                setTimeout(() => {
                    const newXPInLevel = endXP - (level * 100);
                    const newPercent = Math.min((newXPInLevel / 100) * 100, 100);
                    progressBar.style.transition = 'width 0.8s ease-out';
                    progressBar.style.width = newPercent + '%';
                }, 200);
            }, 500);
        }, 100);
    } else {
        // Animation normale
        progressBar.style.width = startPercent + '%';
        progressBar.style.transition = 'width 0.8s ease-out';
        setTimeout(() => {
            progressBar.style.width = endPercent + '%';
        }, 100);
    }
}

// Fonction pour animer le changement de niveau
// animateLevelUp anime le changement de niveau avec un effet de compteur
function animateLevelUp(startLevel, endLevel, levelElement) {
    if (!levelElement) return;
    
    // Afficher le pop-up de niveau atteint
    if (endLevel > startLevel) {
        showLevelUpPopup(endLevel);
    }
    
    let current = startLevel;
    levelElement.style.transition = 'transform 0.3s ease-out';
    
    const interval = setInterval(() => {
        current++;
        levelElement.textContent = current;
        levelElement.style.transform = 'scale(1.3)';
        setTimeout(() => {
            levelElement.style.transform = 'scale(1)';
        }, 300);
        
        if (current >= endLevel) {
            clearInterval(interval);
        }
    }, 400);
}

// Fonction pour afficher le pop-up de niveau atteint
// showLevelUpPopup affiche une popup de félicitations lors d'un gain de niveau
function showLevelUpPopup(level) {
    const popup = document.getElementById('levelUpPopup');
    const levelNumber = document.getElementById('levelUpNumber');
    
    if (popup && levelNumber) {
        levelNumber.textContent = level;
        popup.classList.remove('hidden');
        
        // Fermer le pop-up après 3 secondes
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 3000);
        
        // Permettre de fermer en cliquant dessus
        popup.addEventListener('click', () => {
            popup.classList.add('hidden');
        }, { once: true });
    }
}


// Charger le leaderboard
// loadLeaderboard charge le classement des joueurs depuis le serveur
async function loadLeaderboard() {
    console.log('[LEADERBOARD] Début du chargement...');
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) {
        console.error('[LEADERBOARD] Élément leaderboardList introuvable!');
        return;
    }
    console.log('[LEADERBOARD] Élément trouvé:', leaderboardList);
    
    try {
        const response = await fetch('/leaderboard');
        console.log('[LEADERBOARD] Réponse reçue:', response.status);
        const data = await response.json();
        console.log('[LEADERBOARD] Données reçues:', data);
        
        if (data.success) {
            console.log('[LEADERBOARD] Affichage de', data.leaderboard?.length || 0, 'joueurs');
            displayLeaderboard(data.leaderboard || []);
        } else {
            console.error('[LEADERBOARD] Erreur:', data.message);
            leaderboardList.innerHTML = '<div class="leaderboard-loading">Erreur de chargement</div>';
        }
    } catch (error) {
        console.error('[LEADERBOARD] Exception:', error);
        leaderboardList.innerHTML = '<div class="leaderboard-loading">Erreur de chargement</div>';
    }
}

// Afficher le leaderboard
// displayLeaderboard affiche le classement dans l'interface
function displayLeaderboard(leaderboard) {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-loading">Aucun joueur</div>';
        return;
    }
    
    leaderboardList.innerHTML = leaderboard.map((player, index) => {
        const topClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        // Avatar ou placeholder
        let avatarHtml = '';
        if (player.avatar && player.avatar.trim() !== '') {
            avatarHtml = `<img src="${escapeHtml(player.avatar)}" alt="${escapeHtml(player.pseudo)}" class="leaderboard-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        }
        const firstLetter = player.pseudo ? player.pseudo.charAt(0).toUpperCase() : '?';
        avatarHtml += `<div class="leaderboard-avatar-placeholder" style="${player.avatar && player.avatar.trim() !== '' ? 'display: none;' : ''}">${firstLetter}</div>`;
        
        return `
            <div class="leaderboard-item ${topClass}">
                <div class="leaderboard-rank">${medal || player.rank}</div>
                <div class="leaderboard-avatar-container">
                    ${avatarHtml}
                </div>
                <div class="leaderboard-info">
                    <div class="leaderboard-pseudo">${escapeHtml(player.pseudo || 'Joueur')}</div>
                    <div class="leaderboard-level">
                        <span class="leaderboard-level-badge">Niveau ${player.level || 1}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Fonction pour échapper le HTML
// escapeHtml échappe les caractères HTML pour éviter les injections XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Gestion du modal Histoire
document.addEventListener('DOMContentLoaded', () => {
    const historyBtn = document.getElementById('historyBtn');
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    const historyBackdrop = historyModal?.querySelector('.history-modal-backdrop');

    // Ouvrir le modal
    if (historyBtn && historyModal) {
        historyBtn.addEventListener('click', () => {
            historyModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    // Fermer le modal
    if (closeHistoryModal && historyModal) {
        closeHistoryModal.addEventListener('click', () => {
            historyModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    // Fermer en cliquant sur le backdrop
    if (historyBackdrop && historyModal) {
        historyBackdrop.addEventListener('click', (e) => {
            if (e.target === historyBackdrop) {
                historyModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && historyModal && !historyModal.classList.contains('hidden')) {
            historyModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
});

// Gestion du modal Règles du Jeu
document.addEventListener('DOMContentLoaded', () => {
    const rulesBtn = document.getElementById('rulesBtn');
    const rulesModal = document.getElementById('rulesModal');
    const closeRulesModal = document.getElementById('closeRulesModal');
    const rulesBackdrop = rulesModal?.querySelector('.history-modal-backdrop');

    // Ouvrir le modal
    if (rulesBtn && rulesModal) {
        rulesBtn.addEventListener('click', () => {
            rulesModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    // Fermer le modal
    if (closeRulesModal && rulesModal) {
        closeRulesModal.addEventListener('click', () => {
            rulesModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    // Fermer en cliquant sur le backdrop
    if (rulesBackdrop && rulesModal) {
        rulesBackdrop.addEventListener('click', (e) => {
            if (e.target === rulesBackdrop) {
                rulesModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && rulesModal && !rulesModal.classList.contains('hidden')) {
            rulesModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
});
