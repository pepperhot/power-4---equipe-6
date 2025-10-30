console.log("script.js chargé");

let isAnimating = false;

function applyPlayerColors() {
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    document.documentElement.style.setProperty('--player1-color', player1Color);
    document.documentElement.style.setProperty('--player2-color', player2Color);
}

async function loadPlayerNames() {
    try {
        const response = await fetch('/players');
        const data = await response.json();
        const n1 = document.getElementById('name1');
        const n2 = document.getElementById('name2');
        if (n1) n1.textContent = data.name1 || 'Joueur 1';
        if (n2) n2.textContent = data.name2 || 'Joueur 2';
    } catch(e) {
        console.error("Erreur chargement noms :", e);
    }
}

function initGridScript() {
    // Marque la dernière grille utilisée (standard)
    try { localStorage.setItem('lastGrid', '/temp/grid/grid.html'); } catch(_) {}
    // Si mode gravité, on informe le backend
    try {
        const selectedMode = localStorage.getItem('selectedMode') || 'normal';
        if (selectedMode === 'gravity') {
            // on ne reset pas ici pour ne pas casser une partie déjà démarrée via Play
            fetch('/start?mode=gravity');
        }
    } catch(_) {}
    applyPlayerColors();
    loadPlayerNames();
    const lignes = document.querySelectorAll("table tr");

    // --- SURVOL DE COLONNE ---
    lignes.forEach(tr => tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
        cell.addEventListener("mouseover", () => lignes.forEach(l => l.cells[colIndex].style.background = "lightgray"));
        cell.addEventListener("mouseout",  () => lignes.forEach(l => l.cells[colIndex].style.background = ""));
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
                    const text = await clickResponse.text();
                    console.error('Erreur /click:', clickResponse.status, text);
                    return;
                }

                const clickData = await clickResponse.json();
                console.log("Réponse clic:", clickData); // Debug
                
                if (clickData.success) {
                    try {
                        const player = getPlayerFromGrid(clickData.grid || [], colIndex);
                        await playDropAnimation(player, colIndex, clickData.grid || []);
                    } catch (animErr) {
                        console.warn('Animation échouée, mise à jour directe.', animErr);
                    }
                    updateGrid(clickData);

                    // Fallback: détection locale 4 alignés
                    const localWinner = findWinnerK(clickData.grid, 4);
                    if (localWinner) {
                        localStorage.setItem("winner", localWinner);
                        setTimeout(() => { window.location.href = "/temp/winner/winner.html"; }, 400);
                        return;
                    }

                    if (clickData.winner) {
                        localStorage.setItem("winner", clickData.winner);
                        setTimeout(() => {
                            window.location.href = "/temp/winner/winner.html";
                        }, 400);
                    }
                } else {
                    console.warn('Clic non pris en compte:', clickData);
                }
            } catch (e) { 
                console.error("Erreur :", e); 
            } finally { 
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
            setTimeout(() => { window.location.href = "/temp/winner/winner.html"; }, 300);
        }
    }
    catch(e){ console.error("Erreur chargement :", e); }
}

function updateGrid(gridData) {
    const lignes = document.querySelectorAll("table tr");
    const grid = gridData.grid || gridData; 
    
    for(let r = 0; r < grid.length; r++) {
        for(let c = 0; c < grid[r].length; c++) {
            const td = lignes[r].cells[c];
            td.classList.remove('red','yellow');
            if(grid[r][c] === "R") {
                td.classList.add('red');
            } else if(grid[r][c] === "J") {
                td.classList.add('yellow');
            }
        }
    }
}

//  ANIMATION DU JETON 
async function playDropAnimation(player, colIndex, grid) {
    const finalRow = getPlacedRow(grid, colIndex);
    if(finalRow === -1) return;
    const className = (player==="R")?"red":"yellow";
    for(let row=0; row<=finalRow; row++){
        const td = document.querySelectorAll("table tr")[row].cells[colIndex];
        td.classList.add(className);
        await new Promise(r=>setTimeout(r,100));
        if(row!==finalRow) td.classList.remove(className);
    }
}

function getPlacedRow(grid, colIndex) {
    const gravity = (localStorage.getItem('selectedMode') === 'gravity');
    if (gravity) {
        // Dernière case occupée en partant du haut (avant la première vide)
        let last = -1;
        for (let row = 0; row < grid.length; row++) {
            if (grid[row][colIndex] === "") break;
            last = row;
        }
        return last;
    } else {
        // Première case occupée depuis le haut
        for (let row = 0; row < grid.length; row++) {
            if (grid[row][colIndex] !== "") return row;
        }
        return -1;
    }
}

// --- JOUEUR COURANT CÔTÉ CLIENT ---
function getPlayerFromGrid(grid, colIndex) {
    const gravity = (localStorage.getItem('selectedMode') === 'gravity');
    if (gravity) {
        // Jeton placé = dernière case occupée depuis le haut
        let last = -1;
        for (let row = 0; row < grid.length; row++) {
            if (grid[row][colIndex] === "") break;
            last = row;
        }
        if (last >= 0) return grid[last][colIndex];
    } else {
        // Normal: le plus haut jeton (depuis le haut)
        for(let row = 0; row < grid.length; row++) {
            if(grid[row][colIndex] !== "") {
                return grid[row][colIndex];
            }
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
            window.location.href="/temp/winner/winner.html";
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
