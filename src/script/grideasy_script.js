console.log("grideasy_script.js chargé (mode 3 alignés)");

let isAnimating = false;

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
    console.error('Erreur chargement noms :', e);
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

async function initGridScript() {
  // Marque explicitement le mode et la dernière grille pour la redirection après victoire
  try {
    localStorage.setItem('gameMode', 'easy');
    localStorage.setItem('lastGrid', '/temp/grid/grideasy.html');
  } catch(_) {}
  // Réinitialise la partie et informe le backend du mode (évite des coups résiduels en base)
  try {
    await fetch('/reset', { method: 'POST' });
    await fetch('/start?mode=easy');
  } catch(_) {}
  await applyPlayerColors();
  loadPlayerNames();
  updateColorIndicators();
  const lignes = document.querySelectorAll('table tr');

  // Survol colonne
  lignes.forEach(tr => tr.querySelectorAll('td.cell').forEach((cell, colIndex) => {
    cell.addEventListener('mouseover', () => lignes.forEach(l => l.cells[colIndex].style.background = 'lightgray'));
    cell.addEventListener('mouseout', () => lignes.forEach(l => l.cells[colIndex].style.background = ''));
  }));

  // Clic cellules
  lignes.forEach(tr => tr.querySelectorAll('td.cell').forEach((cell, colIndex) => {
    cell.addEventListener('click', async () => {
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
          console.error('Erreur /click:', clickResponse.status, await clickResponse.text());
          return;
        }
        const clickData = await clickResponse.json();
        try {
          const player = getPlayerFromGrid(clickData.grid || [], colIndex);
          await playDropAnimation(player, colIndex, clickData.grid || []);
        } catch (e) { /* animation best-effort */ }
        updateGrid(clickData);
        // Victoire en 3 (client-side)
        const winner = findWinnerK(clickData.grid, 3);
        if (winner) {
          localStorage.setItem('winner', winner);
          setTimeout(() => window.location.href = '/temp/winner/winner.html', 350);
          return;
        }
        // Sinon, si le serveur a son propre gagnant (4 en ligne)
        if (clickData.winner) {
          localStorage.setItem('winner', clickData.winner);
          setTimeout(() => window.location.href = '/temp/winner/winner.html', 350);
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
                  const aiPlayer = getPlayerFromGrid(aiData.grid || [], aiData.col);
                  await playDropAnimation(aiPlayer, aiData.col, aiData.grid || []);
                } catch (animErr) {
                  console.warn('Animation IA échouée, mise à jour directe.', animErr);
                }
                updateGrid(aiData);
                
                // Vérifier si l'IA a gagné
                const aiWinner = findWinnerK(aiData.grid, 3);
                if (aiWinner) {
                  localStorage.setItem('winner', aiWinner);
                  setTimeout(() => window.location.href = '/temp/winner/winner.html', 350);
                  return;
                }
                
                if (aiData.winner) {
                  localStorage.setItem('winner', aiData.winner);
                  setTimeout(() => window.location.href = '/temp/winner/winner.html', 350);
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
      } catch (e) {
        console.error('Erreur :', e);
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

// Sécuriser l'affichage de la page winner si un événement est manqué
try { setInterval(async () => {
  try {
    const data = await (await fetch('/winner')).json();
    if (data && data.winner) {
      localStorage.setItem('winner', data.winner);
      window.location.href = '/temp/winner/winner.html';
    }
  } catch(_) {}
}, 1500); } catch(_) {}

async function loadGrid() {
  try {
    const response = await fetch('/state');
    if (!response.ok) {
      console.error('Erreur /state:', response.status, await response.text());
      return;
    }
    const data = await response.json();
    updateGrid(data);
    const winner = findWinnerK(data.grid, 3);
    if (winner) {
      localStorage.setItem('winner', winner);
      setTimeout(() => window.location.href = '/temp/winner/winner.html', 300);
    }
  } catch (e) {
    console.error('Erreur chargement :', e);
  }
}

function updateGrid(gridData) {
  // S'assurer que les couleurs sont appliquées
  const player1Color = localStorage.getItem('player1Color') || '#ff0000';
  const player2Color = localStorage.getItem('player2Color') || '#ffff00';
  document.documentElement.style.setProperty('--player1-color', player1Color);
  document.documentElement.style.setProperty('--player2-color', player2Color);
  
  const lignes = document.querySelectorAll('table tr');
  const grid = gridData.grid || gridData;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const td = lignes[r].cells[c];
      // Nettoyer les styles inline qui pourraient interférer avec le design premium
      td.style.removeProperty('background');
      td.style.removeProperty('background-color');
      td.style.removeProperty('background-image');
      td.classList.remove('red', 'yellow');
      if (grid[r][c] === 'R') td.classList.add('red');
      else if (grid[r][c] === 'J') td.classList.add('yellow');
      // S'assurer que le fond premium est préservé
      td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
    }
  }
}

async function playDropAnimation(player, colIndex, grid) {
  const finalRow = findPlacedRow(grid, colIndex);
  if (finalRow === -1) return;
  const className = (player === 'R') ? 'red' : 'yellow';
  for (let row = 0; row <= finalRow; row++) {
    const td = document.querySelectorAll('table tr')[row].cells[colIndex];
    // S'assurer que les styles inline n'interfèrent pas avec le design premium
    td.style.removeProperty('background');
    td.style.removeProperty('background-color');
    td.style.removeProperty('background-image');
    // Restaurer le fond premium
    td.style.setProperty('background', 'linear-gradient(135deg, #5cadff 0%, #0066cc 50%, #004d99 100%)', 'important');
    td.classList.add(className);
    await new Promise(r => setTimeout(r, 80));
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

function findPlacedRow(grid, colIndex) {
  for (let row = 0; row < grid.length; row++) {
    if (grid[row][colIndex] !== '') return row; // première case occupée = pion posé le plus haut
  }
  return -1;
}

// Détermine le joueur placé dans la colonne après le coup
function getPlayerFromGrid(grid, colIndex) {
  for (let row = grid.length - 1; row >= 0; row--) {
    if (grid[row][colIndex] !== '') {
      return grid[row][colIndex];
    }
  }
  return 'R';
}

// Détection d'une victoire en K alignés (compte dans les 2 sens pour chaque direction)
function findWinnerK(grid, K) {
  if (!grid || !grid.length) return '';
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
          if (rr < 0 || rr >= R || cc < 0 || cc >= C || grid[rr][cc] !== p) {
            ok = false; break;
          }
        }
        if (ok) return p;
      }
    }
  }
  return '';
}

// Bouton retour
const retourBtn = document.getElementById('retourBtn');
if (retourBtn) {
  retourBtn.addEventListener('click', async () => {
    await fetch('/reset', { method: 'POST' });
    window.location.href = '/homepage';
  });
}
