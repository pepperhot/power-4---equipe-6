console.log("grid_hard_script.js chargé");

let isAnimating = false;

// --- Récupère les couleurs sauvegardées ---
async function applyPlayerColors() {
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    
    // Vérifier si on joue contre l'IA
    try {
        const response = await fetch('/players');
        const data = await response.json();
        const isPlayingAgainstAI = data.name2 && data.name2.length >= 2 && data.name2.substring(0, 2) === 'IA';
        
        if (isPlayingAgainstAI) {
            document.documentElement.style.setProperty('--player1-color', player1Color);
            document.documentElement.style.setProperty('--player2-color', player2Color);
        } else {
            document.documentElement.style.setProperty('--player1-color', player1Color);
            document.documentElement.style.setProperty('--player2-color', player2Color);
        }
    } catch (e) {
        document.documentElement.style.setProperty('--player1-color', player1Color);
        document.documentElement.style.setProperty('--player2-color', player2Color);
    }
}

// --- Chargement des noms depuis le serveur ---
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
    } catch (e) {
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

async function initGridHardScript() {
    // Réinitialiser la partie sur le backend avant de charger
    try {
        await fetch('/reset', { method: 'POST' });
    } catch (e) {
        console.warn('Erreur lors de la réinitialisation:', e);
    }
    
    await applyPlayerColors();
    loadPlayerNames();
    updateColorIndicators();

    const lignes = document.querySelectorAll("table tr");

    // --- SURVOL DE COLONNE ---
    lignes.forEach(tr => tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
        cell.addEventListener("mouseover", () => lignes.forEach(l => l.cells[colIndex].style.background = "lightgray"));
        cell.addEventListener("mouseout", () => lignes.forEach(l => l.cells[colIndex].style.background = ""));
    }));

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
                    console.error('Erreur /click:', await clickResponse.text());
                    return;
                }

                const clickData = await clickResponse.json();
                if (clickData.success) {
                    try {
                        const gravity = (localStorage.getItem('selectedMode') === 'gravity');
                        const player = getPlayerFromGrid(clickData.grid || [], colIndex);
                        if (!gravity) {
                            await playDropAnimation(player, colIndex, clickData.grid || []);
                        }
                    } catch (animErr) {
                        console.warn('Animation échouée ou désactivée pour gravité.', animErr);
                    }
                    updateGrid(clickData);

                    if (clickData.winner) {
                        localStorage.setItem("winner", clickData.winner);
                        setTimeout(() => {
                            window.location.href = "/templates/winner/winner.html";
                        }, 400);
                        return;
                    }
                    
                    // Si c'est le tour de l'IA, la faire jouer automatiquement
                    const player2Name = clickData.player2Name || '';
                    const isAITurn = clickData.isAITurn || (player2Name.length >= 2 && player2Name.substring(0, 2) === 'IA');
                    
                    if (isAITurn && !clickData.winner && clickData.current === 'J') {
                        setTimeout(async () => {
                            try {
                                const aiResponse = await fetch('/ai/move', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
                                });
                                
                                if (!aiResponse.ok) {
                                    console.error('Erreur /ai/move:', aiResponse.status);
                                    return;
                                }
                                
                                const aiData = await aiResponse.json();
                                
                                if (aiData.success) {
                                    try {
                                        const gravity = (localStorage.getItem('selectedMode') === 'gravity');
                                        const aiPlayer = getPlayerFromGrid(aiData.grid || [], aiData.col);
                                        if (!gravity) {
                                            await playDropAnimation(aiPlayer, aiData.col, aiData.grid || []);
                                        }
                                    } catch (animErr) {
                                        console.warn('Animation IA échouée ou désactivée pour gravité.', animErr);
                                    }
                                    updateGrid(aiData);
                                    
                                    // Vérifier si l'IA a gagné
                                    if (aiData.winner) {
                                        localStorage.setItem("winner", aiData.winner);
                                        setTimeout(() => {
                                            window.location.href = "/templates/winner/winner.html";
                                        }, 400);
                                    }
                                }
                            } catch (e) {
                                console.error("Erreur lors du coup de l'IA:", e);
                            } finally {
                                isAnimating = false;
                            }
                        }, 500);
                    } else {
                        isAnimating = false;
                    }
                }
            } catch (e) {
                console.error("Erreur:", e);
                isAnimating = false;
            }
        });
    }));

    // --- Charger l'état du jeu ---
    loadGridHard();

    // Pas de pré-remplissage en mode hard pour rester cohérent visuellement
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGridHardScript);
} else {
    initGridHardScript();
}

// --- Chargement du backend ---
async function loadGridHard() {
    try {
        // S'assurer que la partie est réinitialisée avant de charger
        await fetch('/reset', { method: 'POST' });
        const response = await fetch('/state');
        if (!response.ok) return;
        const data = await response.json();
        updateGrid(data);
    } catch (e) {
        console.error("Erreur chargement :", e);
    }
}

// --- Met à jour visuellement la grille ---
function updateGrid(gridData) {
    // S'assurer que les couleurs sont appliquées
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    document.documentElement.style.setProperty('--player1-color', player1Color);
    document.documentElement.style.setProperty('--player2-color', player2Color);
    
    const lignes = document.querySelectorAll("table tr");
    const grid = gridData.grid || gridData;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const td = lignes[r].cells[c];
            // Nettoyer les styles inline qui pourraient interférer avec le design premium
            td.style.removeProperty('background');
            td.style.removeProperty('background-color');
            td.style.removeProperty('background-image');
            td.classList.remove('red', 'yellow');
            if (grid[r][c] === "R") td.classList.add('red');
            else if (grid[r][c] === "J") td.classList.add('yellow');
            // S'assurer que le fond premium est préservé
            td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
        }
    }
}

// --- Animation de chute ---
async function playDropAnimation(player, colIndex, grid) {
    const finalRow = findFinalRow(grid, colIndex);
    if (finalRow === -1) return;
    const className = (player === "R") ? "red" : "yellow";
    for (let row = 0; row <= finalRow; row++) {
        const td = document.querySelectorAll("table tr")[row].cells[colIndex];
        // S'assurer que les styles inline n'interfèrent pas avec le design premium
        td.style.removeProperty('background');
        td.style.removeProperty('background-color');
        td.style.removeProperty('background-image');
        // Restaurer le fond premium
        td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
        td.classList.add(className);
        await new Promise(r => setTimeout(r, 100));
        if (row !== finalRow) {
            td.classList.remove(className);
            td.style.removeProperty('background');
            td.style.removeProperty('background-color');
            td.style.removeProperty('background-image');
            // Restaurer le fond premium
            td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
        }
    }
}

function findFinalRow(grid, colIndex) {
    for (let row = 0; row < grid.length; row++) {
        if (grid[row][colIndex] !== "") return row;
    }
    return grid.length - 1;
}

function getPlayerFromGrid(grid, colIndex) {
    for (let row = 0; row < grid.length; row++) {
        if (grid[row][colIndex] !== "") return grid[row][colIndex];
    }
    return "R";
}

// --- Ajoute 7 jetons aléatoires (R/J) au début ---
function prefillRandomCells() {
    const cells = Array.from(document.querySelectorAll(".cell"));
    const totalCells = cells.length;
    const used = new Set();

    while (used.size < 7) {
        used.add(Math.floor(Math.random() * totalCells));
    }

    used.forEach(i => {
        const randomColor = Math.random() < 0.5 ? 'red' : 'yellow';
        cells[i].classList.add(randomColor);
    });
}

// --- Retour à l'accueil ---
document.getElementById("retourBtn").addEventListener("click", async () => {
    await fetch("/reset", { method: "POST" });
    window.location.href = "/templates/homepage/homepage.html";
});
