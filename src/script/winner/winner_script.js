
// Flag pour éviter la double exécution
let winnerPageInitialized = false;

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!winnerPageInitialized) {
            winnerPageInitialized = true;
            initWinnerPage();
        }
    });
} else {
    // DOM déjà chargé
    if (!winnerPageInitialized) {
        winnerPageInitialized = true;
        initWinnerPage();
    }
}

function initWinnerPage() {
    // Récupération du gagnant et scores depuis le localStorage
    const winner = localStorage.getItem("winner") || "R";
    const name1 = (localStorage.getItem('player1Name') || 'Joueur 1').trim();
    const name2 = (localStorage.getItem('player2Name') || 'Joueur 2').trim();
    let scoreRed = parseInt(localStorage.getItem("scoreRed") || "0");
    let scoreYellow = parseInt(localStorage.getItem("scoreYellow") || "0");

    // Debug: afficher toutes les valeurs
    console.log('=== [WINNER] DÉBUT DEBUG ===');
    console.log('[WINNER] Données récupérées:', {
        winner,
        name1,
        name2,
        name2Length: name2 ? name2.length : 0,
        name2StartsWithIA: name2 && name2.length >= 2 ? name2.substring(0, 2) : 'N/A',
        selectedAILevel: localStorage.getItem('selectedAILevel'),
        condition1: winner === "R",
        condition2: name2 && name2.length >= 2,
        condition3: name2 && name2.length >= 2 && name2.substring(0, 2) === "IA",
        allConditions: winner === "R" && name2 && name2.length >= 2 && name2.substring(0, 2) === "IA"
    });

    // Mettre à jour le score du gagnant
if (winner === "R") scoreRed++;
else if (winner === "J") scoreYellow++;

// Sauvegarder scores
localStorage.setItem("scoreRed", scoreRed);
localStorage.setItem("scoreYellow", scoreYellow);

// Attribuer l'XP si le joueur 1 a gagné (peu importe le mode)
// Vérifier si l'XP a déjà été attribué pour cette victoire
const xpAlreadyAwarded = localStorage.getItem('xpAwardedForWinner') === winner;
console.log('[XP] Vérification conditions:', { winner, name2, condition: winner === "R", xpAlreadyAwarded });

if (winner === "R" && !xpAlreadyAwarded) {
    console.log('[XP] ✓ Conditions remplies ! Victoire détectée');
    console.log('[XP] Démarrage attribution de l\'XP...');
    
    // Marquer que l'XP est en cours d'attribution pour cette victoire
    localStorage.setItem('xpAwardedForWinner', winner);
    
    // Récupérer l'XP actuel avant l'attribution
    console.log('[XP] Étape 1: Récupération du profil...');
    fetch("/profile")
        .then(response => {
            console.log('[XP] Réponse /profile reçue, status:', response.status);
            return response.json();
        })
        .then(profileData => {
            console.log('[XP] Profil actuel:', profileData);
            const oldXP = profileData.xp || 0;
            const oldLevel = profileData.level || 1;
            console.log('[XP] XP actuel:', oldXP, 'Niveau actuel:', oldLevel);
            
            // Attribuer l'XP
            console.log('[XP] Étape 2: Appel /award-xp...');
            const isAI = name2 && name2.length >= 2 && name2.substring(0, 2) === "IA";
            const requestBody = {
                winner: winner,
                player2Name: name2,
                aiLevel: isAI ? (localStorage.getItem('selectedAILevel') || 'easy') : '',
                isAI: isAI
            };
            console.log('[XP] Body de la requête:', requestBody);
            
            return fetch("/award-xp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                console.log('[XP] Réponse /award-xp reçue, status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('[XP] Données reçues du serveur:', data);
                if (data.success) {
                    console.log(`[XP] ✓✓✓ SUCCÈS ! ${data.xpGained} XP gagné ! Total: ${data.xp} XP, Niveau: ${data.level}`);
                    
                    // Afficher la barre d'XP en bas
                    console.log('[XP] Étape 3: Affichage de la barre d\'XP...');
                    const xpBarContainer = document.getElementById('xpBarContainer');
                    console.log('[XP] Élément xpBarContainer trouvé:', !!xpBarContainer);
                    
                    if (xpBarContainer) {
                        console.log('[XP] Classes avant:', xpBarContainer.className);
                        xpBarContainer.classList.remove('hidden');
                        console.log('[XP] Classes après:', xpBarContainer.className);
                        console.log('[XP] Style display:', window.getComputedStyle(xpBarContainer).display);
                        
                        // Afficher les valeurs initiales
                        const xpBarLevel = document.getElementById('xpBarLevel');
                        const xpBarGained = document.getElementById('xpBarGained');
                        const xpBarText = document.getElementById('xpBarText');
                        const xpBarFill = document.getElementById('xpBarFill');
                        
                        console.log('[XP] Éléments trouvés:', {
                            xpBarLevel: !!xpBarLevel,
                            xpBarGained: !!xpBarGained,
                            xpBarText: !!xpBarText,
                            xpBarFill: !!xpBarFill
                        });
                        
                        if (xpBarLevel) {
                            xpBarLevel.textContent = oldLevel;
                            console.log('[XP] Niveau affiché:', oldLevel);
                        }
                        if (xpBarGained) {
                            xpBarGained.textContent = `+${data.xpGained} XP`;
                            console.log('[XP] XP gagné affiché:', data.xpGained);
                        }
                        
                        // Animer la barre d'XP
                        console.log('[XP] Étape 4: Démarrage animation...');
                        setTimeout(() => {
                            console.log('[XP] Animation démarrée avec:', { oldXP, newXP: data.xp, oldLevel, newLevel: data.level });
                            animateXPBarBottom(oldXP, data.xp, oldLevel, data.level);
                        }, 300);
                    } else {
                        console.error('[XP] ❌ ERREUR: Élément xpBarContainer non trouvé dans le DOM !');
                        console.error('[XP] Vérifiez que l\'élément existe dans winner.html');
                    }
                    
                    // Sauvegarder pour la homepage
                    localStorage.setItem('newXP', data.xp);
                    localStorage.setItem('newLevel', data.level);
                    localStorage.setItem('xpGained', data.xpGained);
                    console.log('[XP] Données sauvegardées dans localStorage:', {
                        newXP: data.xp,
                        newLevel: data.level,
                        xpGained: data.xpGained
                    });
                } else if (xpAlreadyAwarded) {
                    console.log('[XP] ⚠️ XP déjà attribué pour cette victoire, pas de nouvelle attribution');
                } else {
                    console.error('[XP] ❌ ERREUR du serveur:', data.message);
                    alert('Erreur: ' + (data.message || 'Erreur inconnue'));
                }
            })
            .catch(err => {
                console.error("[XP] ❌ ERREUR lors de l'appel /award-xp:", err);
            });
        })
        .catch(err => {
            console.error("[XP] ❌ ERREUR lors de la récupération du profil:", err);
        });
}

    console.log('=== [WINNER] FIN DEBUG ===');

    // Affichage
    const winnerName = winner === "R" ? name1 : (winner === "J" ? name2 : "Le joueur");
    const winnerTextEl = document.getElementById("winnerText");
    if (winnerTextEl) winnerTextEl.textContent = `${winnerName} a gagné !`;
    
    const scoreRedEl = document.getElementById("scoreRed");
    if (scoreRedEl) scoreRedEl.textContent = scoreRed;
    
    const scoreYellowEl = document.getElementById("scoreYellow");
    if (scoreYellowEl) scoreYellowEl.textContent = scoreYellow;
    
    const nameRedEl = document.getElementById("nameRed");
    if (nameRedEl) nameRedEl.textContent = name1;
    
    const nameYellowEl = document.getElementById("nameYellow");
    if (nameYellowEl) nameYellowEl.textContent = name2;

    // Rejouer: revenir au choix du mode (homepage)
    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn) {
        restartBtn.addEventListener("click", async () => {
            // Nettoyer le flag d'XP attribué quand on quitte la page
            localStorage.removeItem('xpAwardedForWinner');
            try {
                const ctl = new AbortController();
                const t = setTimeout(() => ctl.abort(), 1500);
                await fetch("/reset", { method: "POST", signal: ctl.signal });
                clearTimeout(t);
            } catch (_) {}
            window.location.href = "/homepage";
        });
    }

    // Retour à l'accueil (homepage)
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener("click", async () => {
            // Nettoyer le flag d'XP attribué quand on quitte la page
            localStorage.removeItem('xpAwardedForWinner');
            await fetch("/reset", { method: "POST" });
            window.location.href = "/homepage";
        });
    }
} // Fin de la fonction initWinnerPage

// Fonction pour animer la barre d'XP en bas (style Fortnite)
function animateXPBarBottom(startXP, endXP, startLevel, endLevel) {
    const xpBarFill = document.getElementById('xpBarFill');
    const xpBarLevel = document.getElementById('xpBarLevel');
    const xpBarText = document.getElementById('xpBarText');
    
    if (!xpBarFill || !xpBarLevel) return;
    
    // Calculer les pourcentages
    const xpForStartLevel = (startLevel - 1) * 100;
    const startXPInLevel = Math.max(0, startXP - xpForStartLevel);
    const endXPInLevel = Math.max(0, endXP - xpForStartLevel);
    const startPercent = Math.min((startXPInLevel / 100) * 100, 100);
    const endPercent = Math.min((endXPInLevel / 100) * 100, 100);
    
    // Mettre à jour le texte
    if (xpBarText) {
        const xpNeeded = (startLevel * 100) - endXP;
        const nextLevel = startLevel + 1;
        if (xpNeeded > 0) {
            xpBarText.textContent = `${xpNeeded.toLocaleString()} XP pour NIVEAU ${nextLevel}`;
        } else {
            xpBarText.textContent = `Niveau ${endLevel} atteint !`;
        }
    }
    
    // Si on passe au niveau suivant
    if (endXP >= startLevel * 100 && startXP < startLevel * 100) {
        // Animer jusqu'à 100%
        xpBarFill.style.width = startPercent + '%';
        setTimeout(() => {
            xpBarFill.style.width = '100%';
            setTimeout(() => {
                // Animation du niveau
                if (endLevel > startLevel) {
                    // Afficher le pop-up de niveau atteint
                    showLevelUpPopup(endLevel);
                    
                    let currentLevel = startLevel;
                    const levelInterval = setInterval(() => {
                        currentLevel++;
                        xpBarLevel.textContent = currentLevel;
                        xpBarLevel.style.transform = 'scale(1.3)';
                        setTimeout(() => {
                            xpBarLevel.style.transform = 'scale(1)';
                        }, 300);
                        if (currentLevel >= endLevel) {
                            clearInterval(levelInterval);
                        }
                    }, 400);
                }
                
                // Réinitialiser et animer vers le nouveau pourcentage
                xpBarFill.style.width = '0%';
                setTimeout(() => {
                    const newXPInLevel = endXP - (startLevel * 100);
                    const newPercent = Math.min((newXPInLevel / 100) * 100, 100);
                    xpBarFill.style.width = newPercent + '%';
                    
                    // Mettre à jour le texte pour le nouveau niveau
                    if (xpBarText) {
                        const newXPNeeded = (endLevel * 100) - endXP;
                        const newNextLevel = endLevel + 1;
                        if (newXPNeeded > 0) {
                            xpBarText.textContent = `${newXPNeeded.toLocaleString()} XP pour NIVEAU ${newNextLevel}`;
                        } else {
                            xpBarText.textContent = `Niveau ${endLevel} atteint !`;
                        }
                    }
                }, 300);
            }, 500);
        }, 200);
    } else {
        // Animation normale
        xpBarFill.style.width = startPercent + '%';
        setTimeout(() => {
            xpBarFill.style.width = endPercent + '%';
        }, 200);
        
                    // Animation du niveau si changement
                    if (endLevel > startLevel) {
                        // Afficher le pop-up de niveau atteint
                        showLevelUpPopup(endLevel);
                        
                        let currentLevel = startLevel;
                        const levelInterval = setInterval(() => {
                            currentLevel++;
                            xpBarLevel.textContent = currentLevel;
                            xpBarLevel.style.transform = 'scale(1.3)';
                            setTimeout(() => {
                                xpBarLevel.style.transform = 'scale(1)';
                            }, 300);
                            if (currentLevel >= endLevel) {
                                clearInterval(levelInterval);
                            }
                        }, 400);
                    }
    }
}

// Fonction pour afficher le pop-up de niveau atteint
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
