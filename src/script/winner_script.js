
// Récupération du gagnant et scores depuis le localStorage
const winner = localStorage.getItem("winner") || "R";
const name1 = (localStorage.getItem('player1Name') || 'Joueur 1').trim();
const name2 = (localStorage.getItem('player2Name') || 'Joueur 2').trim();
let scoreRed = parseInt(localStorage.getItem("scoreRed") || "0");
let scoreYellow = parseInt(localStorage.getItem("scoreYellow") || "0");

// Mettre à jour le score du gagnant
if (winner === "R") scoreRed++;
else if (winner === "J") scoreYellow++;

// Sauvegarder scores
localStorage.setItem("scoreRed", scoreRed);
localStorage.setItem("scoreYellow", scoreYellow);

// Affichage
const winnerName = winner === "R" ? name1 : (winner === "J" ? name2 : "Le joueur");
document.getElementById("winnerText").textContent = `${winnerName} a gagné !`;
document.getElementById("scoreRed").textContent = scoreRed;
document.getElementById("scoreYellow").textContent = scoreYellow;
document.getElementById("nameRed").textContent = name1;
document.getElementById("nameYellow").textContent = name2;

// Recommencer
document.getElementById("restartBtn").addEventListener("click", async () => {
    await fetch("/reset", { method: "POST" }); // reset côté serveur
    window.location.href = "/temp/grid.html"; // retour à la grille
});
// Retour à l'accueil
document.getElementById("backBtn").addEventListener("click", async () => {
    await fetch("/reset", { method: "POST" }); // reset côté serveur
    window.location.href = "/homepage";
});
