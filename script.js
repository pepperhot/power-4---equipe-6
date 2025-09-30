console.log("script.js chargé");
// On attend que la page soit complètement chargée avant de lancer notre code
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Récupérer toutes les cellules du tableau (les <td>)
    let cellules = document.querySelectorAll("td.cell");
    
    // 2. Pour chaque cellule, on ajoute deux "écouteurs" :
    //    - quand la souris entre (mouseover)
    //    - quand la souris sort (mouseout)
    cellules.forEach(function(cellule, index) {
        
        // Quand la souris passe sur une cellule
        cellule.addEventListener("mouseover", function() {
            surlignerColonne(cellule);
        });
        
        // Quand la souris quitte une cellule
        cellule.addEventListener("mouseout", function() {
            effacerSurlignage(cellule);
        });
    });
    
    // 3. Fonction pour surligner une colonne
    function surlignerColonne(cellule) {
        // Trouver dans quelle colonne se trouve cette cellule
        let colonneIndex = cellule.cellIndex;
        
        // Récupérer toutes les lignes du tableau
        let lignes = document.querySelectorAll("table tr");
        
        // Parcourir chaque ligne et colorier la cellule de la bonne colonne
        lignes.forEach(function(ligne) {
            let cases = ligne.querySelectorAll("td");
            cases[colonneIndex].style.background = "gray"; // mettre en gris
        });
    }
    
    // 4. Fonction pour enlever le surlignage
    function effacerSurlignage(cellule) {
        let colonneIndex = cellule.cellIndex;
        let lignes = document.querySelectorAll("table tr");
        
        lignes.forEach(function(ligne) {
            let cases = ligne.querySelectorAll("td");
            cases[colonneIndex].style.background = "#d9f0ff"; // couleur de base
        });
    }
});
