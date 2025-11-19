document.addEventListener('DOMContentLoaded', () => {
    // Éléments pour les couleurs
    const saveBtn = document.querySelector('.btn-save-colors');
    const player1Color = document.getElementById('player1-color');
    const player2Color = document.getElementById('player2-color');

    // Éléments pour la sélection du niveau IA
    const aiEasyBtn = document.getElementById('aiEasyBtn');
    const aiMediumBtn = document.getElementById('aiMediumBtn');
    const aiHardBtn = document.getElementById('aiHardBtn');
    const aiImpossibleBtn = document.getElementById('aiImpossibleBtn');
    // Aucun niveau IA sélectionné par défaut
    let selectedAILevel = '';

    // Sélection de mode
    const btnEasy = document.getElementById('easyBtn') || document.querySelector('.btn-easy-mode');
    const btnNormal = document.getElementById('normalBtn') || document.querySelector('.btn-normale-mode');
    const btnHard = document.getElementById('hardBtn') || document.querySelector('.btn-hard-mode');
    const btnGravity = document.getElementById('gravityBtn') || document.querySelector('.btn-gravities-mode');
    const btnPlay = document.getElementById('playBtn') || document.querySelector('.btn-play');
    // Aucun mode sélectionné par défaut
    let selectedMode = '';

    function setMode(mode) {
        selectedMode = mode;
        // Désélectionner le niveau IA si un mode de jeu est sélectionné
        selectedAILevel = '';
        resetAIButtonVisuals();
        // Ne pas sauvegarder dans localStorage pour forcer la sélection à chaque chargement
        // try { localStorage.setItem('selectedMode', mode); } catch(_) {}
        updateModeButtons();
        console.log('[mode] sélectionné =', mode);
    }

    // Force la sélection visuelle immédiate et sans condition
    function forceSelect(mode) {
        selectedMode = mode;
        // Désélectionner le niveau IA si un mode de jeu est sélectionné
        selectedAILevel = '';
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

    if (btnPlay) btnPlay.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Vérifier qu'un mode OU un niveau IA est sélectionné
        if ((!selectedMode || selectedMode === '') && (!selectedAILevel || selectedAILevel === '')) {
            alert('Veuillez sélectionner un mode de jeu ou un niveau IA avant de commencer.');
            return;
        }
        
        try {
            // Si un niveau IA est sélectionné, on joue contre l'IA (mode normal par défaut)
            // Sinon, on utilise le mode de jeu sélectionné
            const mode = selectedAILevel ? 'normal' : selectedMode;
            const aiLevel = selectedAILevel || 'medium';
            const res = await fetch(`/start?mode=${mode}&aiLevel=${aiLevel}`);
            if (!res.ok) {
                console.error('Erreur start:', res.status);
            }
            // Rediriger selon le mode (si IA sélectionnée, utiliser mode normal)
            if (mode === 'hard') {
                window.location.href = '/temp/grid_hard/grid_hard.html';
            } else if (mode === 'easy') {
                window.location.href = '/temp/grid/grideasy.html';
            } else if (mode === 'gravity') {
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

    // Fonctions pour gérer la sélection du niveau IA
    function setAILevel(level) {
        selectedAILevel = level;
        // Désélectionner le mode de jeu si un niveau IA est sélectionné
        selectedMode = '';
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
            }
        });
        if (aiEasyBtn) aiEasyBtn.textContent = 'Facile';
        if (aiMediumBtn) aiMediumBtn.textContent = 'Moyen';
        if (aiHardBtn) aiHardBtn.textContent = 'Difficile';
        if (aiImpossibleBtn) aiImpossibleBtn.textContent = 'Impossible';
    }

    function markAIActive(btn) {
        if (!btn) return;
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.style.outline = '3px solid rgba(0,0,0,0.25)';
        btn.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.9) inset, 0 0 0 4px rgba(0,0,0,0.2)';
        btn.style.filter = 'brightness(0.95)';
        if (btn === aiEasyBtn) aiEasyBtn.textContent = 'Facile (sélectionné)';
        if (btn === aiMediumBtn) aiMediumBtn.textContent = 'Moyen (sélectionné)';
        if (btn === aiHardBtn) aiHardBtn.textContent = 'Difficile (sélectionné)';
        if (btn === aiImpossibleBtn) aiImpossibleBtn.textContent = 'Impossible (sélectionné)';
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
    loadProfileFromDB();
    
    // Vérifier le statut admin pour afficher/masquer le bouton Dashboard
    checkAdminStatus();
});

// Fonction pour vérifier le statut admin et afficher/masquer le bouton Dashboard
async function checkAdminStatus() {
    try {
        const dashboardLink = document.getElementById('dashboardLink');
        if (!dashboardLink) return;
        
        // Cacher le bouton par défaut
        dashboardLink.style.display = 'none';
        
        // Récupérer le pseudo depuis localStorage ou utiliser celui du backend
        const storedPseudo = localStorage.getItem('userPseudo') || '';
        const url = storedPseudo 
            ? `/admin/check?pseudo=${encodeURIComponent(storedPseudo)}`
            : '/admin/check';

        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Réponse admin check:', data);
        
        // Afficher le bouton seulement si l'utilisateur est admin
        if (data.success && data.isAdmin) {
            dashboardLink.style.display = 'flex';
            console.log('Bouton Dashboard Admin affiché');
        } else {
            dashboardLink.style.display = 'none';
            console.log('Utilisateur non admin - bouton Dashboard masqué');
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du statut admin:', error);
        // En cas d'erreur, cacher le bouton par sécurité
        const dashboardLink = document.getElementById('dashboardLink');
        if (dashboardLink) {
            dashboardLink.style.display = 'none';
        }
    }
}
