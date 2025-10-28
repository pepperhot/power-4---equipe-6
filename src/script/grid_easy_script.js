console.log("grid_easy_script.js chargé (mode 3 alignés)");

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
  } catch (e) {
    console.error('Erreur chargement noms :', e);
  }
}

function initGridScript() {
  applyPlayerColors();
  loadPlayerNames();
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
        }
      } catch (e) {
        console.error('Erreur :', e);
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
  const lignes = document.querySelectorAll('table tr');
  const grid = gridData.grid || gridData;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const td = lignes[r].cells[c];
      td.classList.remove('red', 'yellow');
      if (grid[r][c] === 'R') td.classList.add('red');
      else if (grid[r][c] === 'J') td.classList.add('yellow');
    }
  }
}

async function playDropAnimation(player, colIndex, grid) {
  const finalRow = findFinalRow(grid, colIndex);
  if (finalRow === -1) return;
  const className = (player === 'R') ? 'red' : 'yellow';
  for (let row = 0; row <= finalRow; row++) {
    const td = document.querySelectorAll('table tr')[row].cells[colIndex];
    td.classList.add(className);
    await new Promise(r => setTimeout(r, 80));
    if (row !== finalRow) td.classList.remove(className);
  }
}

function findFinalRow(grid, colIndex) {
  for (let row = 0; row < grid.length; row++) {
    if (grid[row][colIndex] !== '') return row;
  }
  return grid.length - 1;
}

function getPlayerFromGrid(grid, colIndex) {
  for (let row = 0; row < grid.length; row++) {
    if (grid[row][colIndex] !== '') return grid[row][colIndex];
  }
  return 'R';
}

// Détection d'une victoire en K alignés (K=3 pour easy)
function findWinnerK(grid, K) {
  if (!grid || !grid.length) return '';
  const R = grid.length, C = grid[0].length;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  const players = ['R','J'];
  for (const p of players) {
    for (let r=0; r<R; r++) for (let c=0; c<C; c++) if (grid[r][c]===p) {
      for (const [dr,dc] of dirs) {
        let count=1;
        for (let i=1; i<K; i++) {
          const rr=r+dr*i, cc=c+dc*i;
          if (rr<0||rr>=R||cc<0||cc>=C||grid[rr][cc]!==p) { count=-1; break; }
          count++;
        }
        if (count>=K) return p;
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
    window.location.href = '/temp/homepage/homepage.html';
  });
}
