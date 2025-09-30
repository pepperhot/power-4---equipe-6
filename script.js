console.log("script.js chargé");

document.addEventListener("DOMContentLoaded", () => {
    const lignes = document.querySelectorAll("table tr");

    lignes.forEach(tr => {
        tr.querySelectorAll("td.cell").forEach((cell, colIndex) => {
            // survol
            cell.addEventListener("mouseover", () => lignes.forEach(l => l.cells[colIndex].style.background = "gray"));
            cell.addEventListener("mouseout",  () => lignes.forEach(l => l.cells[colIndex].style.background = ""));
            
            // clic
            cell.addEventListener("click", () => fetch(`/click?col=${colIndex+1}`).then(res => res.text()).then(console.log));
        });
    });
});
