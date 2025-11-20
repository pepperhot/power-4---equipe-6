console.log("script.js chargé");

let isAnimating = false;

async function applyPlayerColors() {
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    
    // Vérifier si on joue contre l'IA
    try {
        const response = await fetch('/players');
        const data = await response.json();
        const isPlayingAgainstAI = data.name2 && data.name2.length >= 2 && data.name2.substring(0, 2) === 'IA';
        
        if (isPlayingAgainstAI) {
            // Si on joue contre l'IA, le joueur humain (R) utilise player1Color
            // et l'IA (J) utilise player2Color
            document.documentElement.style.setProperty('--player1-color', player1Color);
            document.documentElement.style.setProperty('--player2-color', player2Color);
        } else {
            // En mode 1V1, utiliser les couleurs normalement
            document.documentElement.style.setProperty('--player1-color', player1Color);
            document.documentElement.style.setProperty('--player2-color', player2Color);
        }
    } catch (e) {
        // En cas d'erreur, utiliser les couleurs par défaut
        document.documentElement.style.setProperty('--player1-color', player1Color);
        document.documentElement.style.setProperty('--player2-color', player2Color);
    }
}

async function loadPlayerNames() {
    try {
        const response = await fetch('/players');
        const data = await response.json();
        const name1 = data.name1 || 'Joueur 1';
        const name2 = data.name2 || 'Joueur 2';
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('player1Name', name1);
        localStorage.setItem('player2Name', name2);
        
        const n1 = document.getElementById('name1');
        const n2 = document.getElementById('name2');
        if (n1) n1.textContent = name1;
        if (n2) n2.textContent = name2;
        
        console.log('[GRID] Noms chargés et sauvegardés:', { name1, name2 });
    } catch(e) {
        console.error("Erreur chargement noms :", e);
    }
}

function updateColorIndicators() {
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    const avatar1 = document.getElementById('avatar1');
    const avatar2 = document.getElementById('avatar2');
    const color1 = document.getElementById('color1');
    const color2 = document.getElementById('color2');
    if (avatar1) avatar1.style.background = player1Color;
    if (avatar2) avatar2.style.background = player2Color;
    if (color1) color1.style.background = player1Color;
    if (color2) color2.style.background = player2Color;
}

async function initGridScript() {
    // Réinitialiser la partie sur le backend avant de charger
    try {
        await fetch('/reset', { method: 'POST' });
        // Le /start sera appelé automatiquement par la page, mais on peut aussi l'appeler ici pour être sûr
    } catch (e) {
        console.warn('Erreur lors de la réinitialisation:', e);
    }
    
    // Plus de gestion du mode gravity ici
    await applyPlayerColors();
    await loadPlayerNames();
    updateColorIndicators();
    const lignes = document.querySelectorAll("table tr");

    // --- SURVOL DE COLONNE --- (désactivé pour le nouveau design premium)
    // Les styles CSS gèrent maintenant le survol avec des animations fluides
    // lignes.forEach(tr => tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
    //     cell.addEventListener("mouseover", () => lignes.forEach(l => l.cells[colIndex].style.background = "lightgray"));
    //     cell.addEventListener("mouseout",  () => lignes.forEach(l => l.cells[colIndex].style.background = ""));
    // }));

    // --- CLIC SUR LES CELLULES ---
    lignes.forEach(tr => tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
        cell.addEventListener("click", async () => {
            if (isAnimating) return;
            isAnimating = true;

            try {
                const params = new URLSearchParams();
                params.append('col', String(colIndex));

                const clickResponse = await fetch('/click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                    body: params
                });

                if (!clickResponse.ok) {
                    const text = await clickResponse.text();
                    console.error('Erreur /click:', clickResponse.status, text);
                    return;
                }

                const clickData = await clickResponse.json();
                console.log("Réponse clic:", clickData); // Debug
                console.log("[DEBUG] Données reçues - current:", clickData.current, "player2Name:", clickData.player2Name, "isAITurn:", clickData.isAITurn, "winner:", clickData.winner);

                if (clickData.success) {
                    try {
                        const player = getPlayerFromGrid(clickData.grid || [], colIndex);
                        await playDropAnimation(player, colIndex, clickData.grid || []);
                    } catch (animErr) {
                        console.warn('Animation échouée, mise à jour directe.', animErr);
                    }
                    try {
                        updateGrid(clickData);
                    } catch (updateErr) {
                        console.warn('[DEBUG] Erreur dans updateGrid (non bloquant):', updateErr);
                    }

                    // Fallback: détection locale 4 alignés
                    const localWinner = findWinnerK(clickData.grid, 4);
                    if (localWinner) {
                        localStorage.setItem("winner", localWinner);
                        setTimeout(() => { window.location.href = "/templates/winner/winner.html"; }, 400);
                        return;
                    }

                    if (clickData.winner) {
                        localStorage.setItem("winner", clickData.winner);
                        setTimeout(() => {
                            window.location.href = "/templates/winner/winner.html";
                        }, 400);
                        return;
                    }
                    
                    console.log('[DEBUG IA] ✅ Arrivé à la vérification de l\'IA');
                    // Si c'est le tour de l'IA, la faire jouer automatiquement
                    // Vérifier si Player2Name commence par "IA" OU si isAITurn est vrai
                    const player2Name = clickData.player2Name || '';
                    const isAITurnFromServer = clickData.isAITurn === true;
                    const isAITurnFromName = player2Name.length >= 2 && player2Name.substring(0, 2) === 'IA';
                    const isAITurn = isAITurnFromServer || isAITurnFromName;
                    
                    console.log('[DEBUG IA] clickData:', clickData);
                    console.log('[DEBUG IA] player2Name:', player2Name, 'isAITurn (server):', isAITurnFromServer, 'isAITurn (name):', isAITurnFromName, 'isAITurn (final):', isAITurn);
                    console.log('[DEBUG IA] current:', clickData.current, 'winner:', clickData.winner);
                    
                    // Si c'est le tour de l'IA (current === 'J' et Player2Name commence par 'IA')
                    console.log('[DEBUG IA] Vérification conditions:', {
                        winner: clickData.winner,
                        current: clickData.current,
                        isAITurn: isAITurn,
                        condition1: !clickData.winner,
                        condition2: clickData.current === 'J',
                        condition3: isAITurn,
                        allConditions: !clickData.winner && clickData.current === 'J' && isAITurn
                    });
                    
                    if (!clickData.winner && clickData.current === 'J' && isAITurn) {
                        console.log('[DEBUG IA] ✓✓✓ CONDITIONS REMPLIES! Appel automatique de l\'IA dans 600ms...');
                        // NE PAS mettre isAnimating = false ici, on le mettra après le coup de l'IA
                        // Attendre que l'animation du joueur soit terminée, puis faire jouer l'IA
                        setTimeout(async () => {
                            console.log('[DEBUG IA] ⏰⏰⏰ Délai terminé, appel de /ai/move maintenant...');
                            try {
                                const aiResponse = await fetch('/ai/move', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
                                });
                                
                                if (!aiResponse.ok) {
                                    const errorText = await aiResponse.text();
                                    console.error('[DEBUG IA] ❌ Erreur /ai/move:', aiResponse.status, errorText);
                                    isAnimating = false;
                                    return;
                                }
                                
                                const aiData = await aiResponse.json();
                                console.log('[DEBUG IA] Réponse de /ai/move:', aiData);
                                
                                if (aiData.success) {
                                    console.log('[DEBUG IA] ✓ L\'IA a joué avec succès! Colonne:', aiData.col, 'Ligne:', aiData.row);
                                    try {
                                        const aiPlayer = getPlayerFromGrid(aiData.grid || [], aiData.col);
                                        console.log('[DEBUG IA] Animation du jeton IA...');
                                        await playDropAnimation(aiPlayer, aiData.col, aiData.grid || []);
                                    } catch (animErr) {
                                        console.warn('[DEBUG IA] Animation IA échouée, mise à jour directe.', animErr);
                                    }
                                    try {
                                        updateGrid(aiData);
                                    } catch (updateErr) {
                                        console.warn('[DEBUG IA] Erreur dans updateGrid après coup IA (non bloquant):', updateErr);
                                    }
                                    
                                    // Vérifier si l'IA a gagné
                                    if (aiData.winner) {
                                        console.log('[DEBUG IA] ⚠️ L\'IA a gagné!');
                                        localStorage.setItem("winner", aiData.winner);
                                        setTimeout(() => {
                                            window.location.href = "/templates/winner/winner.html";
                                        }, 400);
                                    }
                                } else {
                                    console.error('[DEBUG IA] ❌ L\'IA n\'a pas réussi à jouer:', aiData);
                                }
                            } catch (e) {
                                console.error("[DEBUG IA] ❌ Erreur lors du coup de l'IA:", e);
                            } finally {
                                console.log('[DEBUG IA] Fin du coup de l\'IA, isAnimating = false');
                                isAnimating = false;
                            }
                        }, 600); // Délai pour que l'animation du joueur se termine
                    } else {
                        console.log('[DEBUG IA] ❌ Conditions NON remplies pour appeler l\'IA:', {
                            winner: clickData.winner,
                            current: clickData.current,
                            isAITurn: isAITurn,
                            player2Name: player2Name,
                            condition1: !clickData.winner,
                            condition2: clickData.current === 'J',
                            condition3: isAITurn
                        });
                        isAnimating = false;
                    }
                } else {
                    console.warn('Clic non pris en compte:', clickData);
                    isAnimating = false;
                }
            } catch (e) { 
                console.error("Erreur :", e);
                isAnimating = false;
            }
        });
    }));

    loadGrid();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGridScript);
} else {
    initGridScript();
}

// Sécurise l'affichage de la page de victoire si jamais un évènement est manqué
try { setInterval(checkWinner, 1500); } catch(_) {}

// CHARGEMENT ET MISE À JOUR DE LA GRILLE 
async function loadGrid() {
    try { 
        // S'assurer que la partie est réinitialisée avant de charger
        await fetch('/reset', { method: 'POST' });
        
        const response = await fetch('/state');
        if (!response.ok) {
            const text = await response.text();
            console.error('Erreur /state:', response.status, text);
            return;
        }
        const data = await response.json();
        console.log("Données reçues:", data); // Debug
        updateGrid(data);
        // Fallback: détection locale si l'état charge un gagnant
        const localWinner = findWinnerK(data.grid || data, 4);
        if (localWinner) {
            localStorage.setItem("winner", localWinner);
            setTimeout(() => { window.location.href = "/templates/winner/winner.html"; }, 300);
        }
    }
    catch(e){ console.error("Erreur chargement :", e); }
}

function updateGrid(gridData) {
    // S'assurer que les couleurs sont appliquées
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    document.documentElement.style.setProperty('--player1-color', player1Color);
    document.documentElement.style.setProperty('--player2-color', player2Color);
    
    const lignes = document.querySelectorAll("table tr");
    const grid = gridData.grid || gridData; 
    
    if (!lignes || lignes.length === 0) {
        console.warn('[DEBUG] updateGrid: Aucune ligne trouvée dans le tableau');
        return;
    }
    
    for(let r = 0; r < grid.length && r < lignes.length; r++) {
        if (!lignes[r] || !lignes[r].cells) {
            console.warn(`[DEBUG] updateGrid: Ligne ${r} ou cells non trouvés`);
            continue;
        }
        
        for(let c = 0; c < grid[r].length && c < lignes[r].cells.length; c++) {
            const td = lignes[r].cells[c];
            if (!td) {
                console.warn(`[DEBUG] updateGrid: Cellule [${r}][${c}] non trouvée`);
                continue;
            }
            
            try {
                // Nettoyer les styles inline qui pourraient interférer avec le design premium
                td.style.removeProperty('background');
                td.style.removeProperty('background-color');
                td.style.removeProperty('background-image');
                td.classList.remove('red','yellow');
                if(grid[r][c] === "R") {
                    td.classList.add('red');
                } else if(grid[r][c] === "J") {
                    td.classList.add('yellow');
                }
                // S'assurer que le fond premium est préservé
                td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
            } catch (err) {
                console.warn(`[DEBUG] updateGrid: Erreur sur cellule [${r}][${c}]:`, err);
            }
        }
    }
}

//  ANIMATION DU JETON 
async function playDropAnimation(player, colIndex, grid) {
    const finalRow = getPlacedRow(grid, colIndex);
    if(finalRow === -1) return;
    const className = (player==="R")?"red":"yellow";
    // Uniquement animation du mode normal (du haut vers la position du projeté)
    for(let row=0; row<=finalRow; row++){
        const td = document.querySelectorAll("table tr")[row].cells[colIndex];
        // S'assurer que les styles inline n'interfèrent pas avec le design premium
        td.style.removeProperty('background');
        td.style.removeProperty('background-color');
        td.style.removeProperty('background-image');
        // Restaurer le fond premium
        td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
        td.classList.add(className);
        await new Promise(r=>setTimeout(r,100));
        if(row!==finalRow) {
            td.classList.remove(className);
            td.style.removeProperty('background');
            td.style.removeProperty('background-color');
            td.style.removeProperty('background-image');
            // Restaurer le fond premium
            td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
        }
    }
}

function getPlacedRow(grid, colIndex) {
    // Normal: le plus haut jeton (depuis le haut)
    for(let row = 0; row < grid.length; row++) {
        if(grid[row][colIndex] !== "") {
            return row;
        }
    }
    return -1;
}

// --- JOUEUR COURANT CÔTÉ CLIENT ---
function getPlayerFromGrid(grid, colIndex) {
    // Normal: le plus haut jeton (depuis le haut)
    for(let row = 0; row < grid.length; row++) {
        if(grid[row][colIndex] !== "") {
            return grid[row][colIndex];
        }
    }
    return "R"; // Par défaut si colonne vide
}

// --- VÉRIFICATION DU GAGNANT ---
async function checkWinner() {
    try {
        const data = await (await fetch('/winner')).json();
        if(data.winner){
            localStorage.setItem("winner", data.winner);
            window.location.href="/templates/winner/winner.html";
        }
    } catch(e){ console.error("Erreur vérif gagnant :", e); }
}

// Détection d'une victoire en K alignés (compte dans les 2 sens)
function findWinnerK(grid, K) {
    if (!grid || !grid.length) return "";
    const R = grid.length, C = grid[0].length;
    const dirs = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
        [-1, -1],
        [-1, 1]
    ];
    for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
            const p = grid[r][c];
            if (p !== 'R' && p !== 'J') continue;
            for (const [dr, dc] of dirs) {
                let ok = true;
                for (let i = 1; i < K; i++) {
                    const rr = r + dr * i, cc = c + dc * i;
                    if (rr < 0 || rr >= R || cc < 0 || cc >= C || grid[rr][cc] !== p) { ok = false; break; }
                }
                if (ok) return p;
            }
        }
    }
    return "";
}

// Retour à l'accueil
document.getElementById("retourBtn").addEventListener("click", async () => {
    await fetch("/reset", { method: "POST" });
    window.location.href = "/homepage";
});
