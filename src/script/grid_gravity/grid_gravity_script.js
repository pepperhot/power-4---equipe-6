// Gravity Mode: Jeu Puissance 4 - Script indépendant
let isAnimating = false;

async function applyPlayerColors() {
    const player1Color = localStorage.getItem("player1Color") || "#ff0000";
    const player2Color = localStorage.getItem("player2Color") || "#ffff00";
    
    // Vérifier si on joue contre l'IA
    try {
        const response = await fetch('/players');
        const data = await response.json();
        const isPlayingAgainstAI = data.name2 && data.name2.length >= 2 && data.name2.substring(0, 2) === 'IA';
        
        if (isPlayingAgainstAI) {
            document.documentElement.style.setProperty("--player1-color", player1Color);
            document.documentElement.style.setProperty("--player2-color", player2Color);
        } else {
            document.documentElement.style.setProperty("--player1-color", player1Color);
            document.documentElement.style.setProperty("--player2-color", player2Color);
        }
    } catch (e) {
        document.documentElement.style.setProperty("--player1-color", player1Color);
        document.documentElement.style.setProperty("--player2-color", player2Color);
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

function getTrsAndCells() {
    // retourne [trs, nb_rows, nb_cols], pour maj grille
    const trs = Array.from(document.querySelectorAll("table tr"));
    if(trs.length === 0) return [[],0,0];
    const nb_rows = trs.length;
    const nb_cols = trs[0].querySelectorAll('.cell').length;
    return [trs, nb_rows, nb_cols];
}

function updateGridGravity(grid) {
    // S'assurer que les couleurs sont appliquées
    const player1Color = localStorage.getItem('player1Color') || '#ff0000';
    const player2Color = localStorage.getItem('player2Color') || '#ffff00';
    document.documentElement.style.setProperty('--player1-color', player1Color);
    document.documentElement.style.setProperty('--player2-color', player2Color);
    
    const [trs, nb_rows, nb_cols] = getTrsAndCells();
    for(let r=0; r<nb_rows; r++){
        for(let c=0; c<nb_cols; c++){
            const td = trs[r].cells[c];
            // Nettoyer les styles inline qui pourraient interférer avec le design premium
            td.style.removeProperty('background');
            td.style.removeProperty('background-color');
            td.style.removeProperty('background-image');
            td.classList.remove('red','yellow');
            if(grid[r][c] === 'R') td.classList.add('red');
            if(grid[r][c] === 'J') td.classList.add('yellow');
            // S'assurer que le fond premium est préservé
            td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
        }
    }
}

function findStopRowGravity(grid, col) {
    for(let row=0; row<grid.length; row++){
        if(grid[row][col]!=="") return row-1; // s'arrête juste en-dessous
    }
    // Si toute la colonne est vide, placer tout en haut
    if(grid.length > 0) return grid.length-1;
    return -1;
}

async function playGravityDrop(colIndex, grid, colorClass) {
    const [trs, nb_rows] = getTrsAndCells();
    const stopRow = findStopRowGravity(grid, colIndex);
    // Sécurité : si colonne pleine/stopRow négatif, on ne fait rien !
    if(stopRow < 0 || stopRow >= nb_rows) return;
    // Nettoyage et forcer fond premium
    for(let i = 0; i < nb_rows; i++) {
        const td = trs[i].cells[colIndex];
        td.classList.remove('red','yellow');
        td.style.removeProperty('background');
        td.style.removeProperty('background-color');
        td.style.removeProperty('background-image');
        td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
    }
    // Animation du bas vers la case d'arrêt
    for(let r = nb_rows - 1; r >= stopRow; r--){
        for(let i = 0; i < nb_rows; i++) {
            if (i !== r) {
                const td = trs[i].cells[colIndex];
                td.classList.remove('red', 'yellow');
                td.style.removeProperty('background');
                td.style.removeProperty('background-color');
                td.style.removeProperty('background-image');
                td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
            }
        }
        const td = trs[r].cells[colIndex];
        td.style.removeProperty('background');
        td.style.removeProperty('background-color');
        td.style.removeProperty('background-image');
        td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
        trs[r].cells[colIndex].classList.add(colorClass);
        await new Promise(res=>setTimeout(res, 85));
    }
    // Fin : affiche la grille réelle (nettoie toute couleur résiduelle d'animation, pose le bon état)
    updateGridGravity(grid);
}

function findDropRow(grid, col) {
    for(let row=grid.length-1; row>=0; row--){
        if(grid[row][col]==="") return row;
    }
    return -1;
}

function getPlayerFromGrid(grid, col) {
    // renvoie qui vient de jouer dans la colonne col
    for(let row = 0; row < grid.length; row++) {
        if(grid[row][col] !== "") {
            return grid[row][col];
        }
    }
    return "R";
}

function checkWinnerK(grid, K) {
    if (!grid || !grid.length) return "";
    const R = grid.length, C = grid[0].length;
    const dirs = [[0,1], [1,0], [1,1], [1,-1],[-1,-1],[ -1,1]];
    for(let r=0;r<R;r++){for(let c=0;c<C;c++){const p=grid[r][c]; if(p!=="R"&&p!=="J")continue; for(const[dr,dc]of dirs){let ok=true;for(let i=1;i<K;i++){const rr=r+dr*i,cc=c+dc*i;if(rr<0||rr>=R||cc<0||cc>=C||grid[rr][cc]!==p){ok=false;break;}}if(ok)return p;}}}
    return "";
}

document.addEventListener("DOMContentLoaded", async ()=>{
    await applyPlayerColors();
    await loadPlayerNames();
    const [trs, nb_rows, nb_cols] = getTrsAndCells();
    // Appliquer le fond premium à toutes les cellules
    trs.forEach(tr=>Array.from(tr.cells).forEach(td=> {
        td.style.removeProperty('background');
        td.style.removeProperty('background-color');
        td.style.removeProperty('background-image');
        td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
    }));
    // Réinitialiser la partie sur le backend et recharger la grille
    try {
        await fetch('/reset', { method:'POST' });
        await fetch('/start?mode=gravity');
    }catch(_){/* ignore */}
    // Charger l’état, la jouer comme une nouvelle partie (grille vide)
    try{
        const response = await fetch('/state');
        if(response.ok){
            const data = await response.json();
            console.log('[GRAVITY DEBUG] /state grille =', data.grid||data); // <- log debug
            updateGridGravity(data.grid||data);
        }
    }catch(_){/* ignore */}
    // Survol colonne (désactivé en mode gravité pour éviter le remplissage des cases)
    trs.forEach(tr=>tr.querySelectorAll("td.cell").forEach((cell,c)=>{
        const noop = ()=>{};
        cell.addEventListener('mouseover', noop);
        cell.addEventListener('mouseout', noop);
    }));
    // Clics
    trs.forEach(tr=>tr.querySelectorAll("td.cell").forEach((cell, colIndex)=>{
        cell.addEventListener('click', async()=>{
            if(isAnimating) return;
            isAnimating = true;
            try {
                const params = new URLSearchParams();
                params.append('col', String(colIndex));
                const clickResponse = await fetch('/click', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
                    body: params
                });
                if (!clickResponse.ok) { console.warn('[GRAVITY] Click non pris en compte'); return; }
                const clickData = await clickResponse.json();
                console.log('[GRAVITY DEBUG] /click grille =', clickData.grid||clickData); // <- log debug
                // Chercher la couleur (jeton joué)
                const newGrid = clickData.grid || [];
                const colorClass = getPlayerFromGrid(newGrid, colIndex)==='R'?'red':'yellow';
                await playGravityDrop(colIndex, newGrid, colorClass);
                updateGridGravity(newGrid);
                // Victoire
                const winner = checkWinnerK(newGrid,4);
                if(winner){
                    localStorage.setItem("winner", winner);
                    setTimeout(()=> window.location.href="/templates/winner/winner.html", 350);
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
                                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
                            });
                            
                            if (!aiResponse.ok) {
                                console.error('Erreur /ai/move:', aiResponse.status);
                                return;
                            }
                            
                            const aiData = await aiResponse.json();
                            
                            if (aiData.success) {
                                const aiGrid = aiData.grid || [];
                                const aiColorClass = getPlayerFromGrid(aiGrid, aiData.col)==='R'?'red':'yellow';
                                await playGravityDrop(aiData.col, aiGrid, aiColorClass);
                                updateGridGravity(aiGrid);
                                
                                // Vérifier si l'IA a gagné
                                const aiWinner = checkWinnerK(aiGrid, 4);
                                if (aiWinner) {
                                    localStorage.setItem("winner", aiWinner);
                                    setTimeout(()=> window.location.href="/templates/winner/winner.html", 350);
                                    return;
                                }
                                
                                if (aiData.winner) {
                                    localStorage.setItem("winner", aiData.winner);
                                    setTimeout(()=> window.location.href="/templates/winner/winner.html", 350);
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
            }catch(e){ 
                console.warn('[GRAVITY] Erreur JS', e);
                isAnimating = false;
            }
        });
    }));
    // Bouton retour
    try{
        document.getElementById('retourBtn').addEventListener('click', async()=>{
            await fetch('/reset', {method:'POST'});
            window.location.href='/homepage';
        });
    }catch(_){} 
});
