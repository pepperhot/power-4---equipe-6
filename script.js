console.log("script.js chargé");
document.addEventListener("DOMContentLoaded", function() {
    
    let cellules = document.querySelectorAll("td.cell");

    cellules.forEach(function(cellule, _) {
        
        cellule.addEventListener("mouseover", function() {
            surlignerColonne(cellule);
        });
        
        cellule.addEventListener("mouseout", function() {
            effacerSurlignage(cellule);
        });
    });
    
    function surlignerColonne(cellule) {
        let colonneIndex = cellule.cellIndex;
        
        let lignes = document.querySelectorAll("table tr");
        
        lignes.forEach(function(ligne) {
            let cases = ligne.querySelectorAll("td");
            cases[colonneIndex].style.background = "gray";
        });
    }
    
    function effacerSurlignage(cellule) {
        let colonneIndex = cellule.cellIndex;
        let lignes = document.querySelectorAll("table tr");
        
        lignes.forEach(function(ligne) {
            let cases = ligne.querySelectorAll("td");
            cases[colonneIndex].style.background = "";
        });
    }
});

const rows = document.querySelectorAll('tr');
rows.forEach((tr, rowIndex) => {
  const cells = tr.querySelectorAll('.cell');
  cells.forEach((cell, colIndex) => {
    cell.addEventListener('click', () => {
      fetch(`/click?row=${rowIndex+1}&col=${colIndex+1}`)
        .then(res => res.text())
        .then(console.log);
    });
  });
});