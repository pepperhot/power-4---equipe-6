console.log("grid_hard_script.js chargé");

let isAnimating = false;

// --- Récupère les couleurs sauvegardées ---
function applyPlayerColors() {
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    document.documentElement.style.setProperty('--player1-color', player1Color);
    document.documentElement.style.setProperty('--player2-color', player2Color);
}

// --- Chargement des noms depuis le serveur ---
async function loadPlayerNames() {
    try {
        const response = await fetch('/players');
        const data = await response.json();
        const n1 = document.getElementById('name1');
        const n2 = document.getElementById('name2');
        if (n1) n1.textContent = data.name1 || 'Joueur 1';
        if (n2) n2.textContent = data.name2 || 'Joueur 2';
    } catch (e) {
        console.error("Erreur chargement noms :", e);
    }
}

function initGridHardScript() {
    applyPlayerColors();
    loadPlayerNames();

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
                            window.location.href = "/temp/winner/winner.html";
                        }, 400);
                    }
                }
            } catch (e) {
                console.error("Erreur:", e);
            } finally {
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
    const lignes = document.querySelectorAll("table tr");
    const grid = gridData.grid || gridData;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const td = lignes[r].cells[c];
            td.classList.remove('red', 'yellow');
            if (grid[r][c] === "R") td.classList.add('red');
            else if (grid[r][c] === "J") td.classList.add('yellow');
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
        td.classList.add(className);
        await new Promise(r => setTimeout(r, 100));
        if (row !== finalRow) td.classList.remove(className);
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
    window.location.href = "/temp/homepage/homepage.html";
});
