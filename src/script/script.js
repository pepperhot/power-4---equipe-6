console.log("script.js chargé");

document.addEventListener("DOMContentLoaded", () => {
    const lignes = document.querySelectorAll("table tr");

    lignes.forEach(tr => {
        tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
            // survol
            cell.addEventListener("mouseover", () => {
                lignes.forEach(l => l.cells[colIndex].style.background = "lightgray");
            });
            
            cell.addEventListener("mouseout", () => {
                lignes.forEach(l => l.cells[colIndex].style.background = "");
            });
            
            // clic
            cell.addEventListener("click", async () => {
                try {
                    const response = await fetch(`/click?col=${colIndex}`);
                    const text = await response.text();
                    console.log(text);
                    
                    // Récupérer l'état de la grille depuis le serveur
                    const stateResponse = await fetch('/state');
                    const grid = await stateResponse.json();
                    
                    // Mettre à jour l'affichage
                    updateGrid(grid);
                } catch (error) {
                    console.error("Erreur:", error);
                }
            });
        });
    });
    
    // Charger l'état initial
    loadGrid();
});

// Charger la grille depuis le serveur
async function loadGrid() {
    try {
        const response = await fetch('/state');
        const grid = await response.json();
        updateGrid(grid);
    } catch (error) {
        console.error("Erreur lors du chargement:", error);
    }
}

// Mettre à jour l'affichage de la grille
function updateGrid(grid) {
    const lignes = document.querySelectorAll("table tr");
    
    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const tdElement = lignes[rowIndex].cells[colIndex];
            
            // Retirer les classes existantes
            tdElement.classList.remove('red', 'yellow');
            
            // Ajouter la classe appropriée si la case contient un jeton
            if (cell === "R") {
                tdElement.classList.add('red');
            } else if (cell === "J") {
                tdElement.classList.add('yellow');
            }
        });
    });
}