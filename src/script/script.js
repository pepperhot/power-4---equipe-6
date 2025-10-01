console.log("script.js chargé");

let isAnimating = false; // Bloque les clics pendant l'animation

document.addEventListener("DOMContentLoaded", () => {
    const lignes = document.querySelectorAll("table tr");

    // ---------------------------
    // 1. SURVOL DE COLONNE
    // ---------------------------
    lignes.forEach(tr => {
        tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
            cell.addEventListener("mouseover", () => {
                lignes.forEach(l => l.cells[colIndex].style.background = "lightgray");
            });
            cell.addEventListener("mouseout", () => {
                lignes.forEach(l => l.cells[colIndex].style.background = "");
            });
        });
    });

    // ---------------------------
    // 2. GESTION DES CLICS
    // ---------------------------
    lignes.forEach(tr => {
        tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
            cell.addEventListener("click", async () => {
                if (isAnimating) return; // empêche les clics multiples
                isAnimating = true;

                try {
                    // Déterminer le joueur courant côté client pour l'animation
                    const currentPlayer = getNextPlayer(colIndex);

                    // Placer le jeton côté serveur
                    await fetch(`/click?col=${colIndex}`);

                    // Récupérer l'état de la grille mis à jour
                    const stateResponse = await fetch('/state');
                    const grid = await stateResponse.json();

                    // Déclencher l'animation du jeton
                    await playDropAnimation(currentPlayer, colIndex, grid);

                    // Mise à jour finale de la grille (pour coller exactement au serveur)
                    updateGrid(grid);

                    // Vérifier si quelqu’un a gagné
                    checkWinner();


                } catch (error) {
                    console.error("Erreur :", error);
                } finally {
                    isAnimating = false;
                }
            });
        });
    });

    // ---------------------------
    // 3. CHARGEMENT INITIAL
    // ---------------------------
    loadGrid();
});

// ---------------------------
// FONCTIONS DE CHARGEMENT ET MISE À JOUR DE LA GRILLE
// ---------------------------
async function loadGrid() {
    try {
        const response = await fetch('/state');
        const grid = await response.json();
        updateGrid(grid);
    } catch (error) {
        console.error("Erreur lors du chargement:", error);
    }
}

function updateGrid(grid) {
    const lignes = document.querySelectorAll("table tr");

    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const tdElement = lignes[rowIndex].cells[colIndex];
            tdElement.classList.remove('red', 'yellow');

            if (cell === "R") tdElement.classList.add('red');
            else if (cell === "J") tdElement.classList.add('yellow');
        });
    });
}

// ---------------------------
// 4. ANIMATION DU JETON
// ---------------------------
async function playDropAnimation(currentPlayer, colIndex, grid) {
    const finalRow = findFinalRow(grid, colIndex);
    if (finalRow === -1) return; // colonne pleine

    const className = (currentPlayer === "R") ? "red" : "yellow";

    await animateDrop(colIndex, finalRow, className);
}

function findFinalRow(grid, colIndex) {
    for (let row = 0; row < grid.length; row++) {
        if (grid[row][colIndex] !== "") {
            return row - 1; // ligne juste au-dessus du jeton existant
        }
    }
    return grid.length - 1; // colonne vide → dernière ligne
}

async function animateDrop(colIndex, finalRow, className) {
    const lignes = document.querySelectorAll("table tr");

    for (let row = 0; row <= finalRow; row++) {
        const td = lignes[row].cells[colIndex];
        td.classList.add(className);

        await new Promise(resolve => setTimeout(resolve, 100));

        if (row !== finalRow) td.classList.remove(className);
    }
}

// ---------------------------
// 5. DÉTERMINER LE JOUEUR COURANT CÔTÉ CLIENT
// ---------------------------
function getNextPlayer(colIndex) {
    const lignes = document.querySelectorAll("table tr");
    for (let row = lignes.length - 1; row >= 0; row--) {
        const td = lignes[row].cells[colIndex];
        if (td.classList.contains('red')) return "J";
        if (td.classList.contains('yellow')) return "R";
    }
    return "R"; // si colonne vide, joueur rouge commence
}

// ---------------------------
// 6. VÉRIFICATION DU GAGNANT
// ---------------------------
async function checkWinner() {
    try {
        const response = await fetch('/winner');
        const data = await response.json();
        if (data.winner) {
            localStorage.setItem("winner", data.winner); // sauvegarder pour winner.html
            window.location.href = "/temp/winner/winner.html"; // redirection
        }
    } catch (error) {
        console.error("Erreur lors de la vérification du gagnant :", error);
    }
}
