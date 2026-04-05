// ========== WORD DATA ==========
const WORDS = {
  1: [
    'a','i','u','e','o',
    'ka','ki','ku','ke','ko',
    'sa','si','su','se','so',
    'ta','ti','tu','te','to',
    'na','ni','nu','ne','no',
    'ha','hi','hu','he','ho',
    'ma','mi','mu','me','mo',
    'ya','yu','yo',
    'ra','ri','ru','re','ro',
    'wa','wo','n'
  ],
  2: [
    'neko','inu','sora','umi','yama',
    'hana','kaze','mizu','hosi','tuki',
    'sakura','ringo','mikan','suika','budo',
    'usagi','kuma','tori','same','kani',
    'taiko','piano','suzu','uta','ehon',
    'kumo','ame','yuki','niji','kawa'
  ],
  3: [
    'cat','dog','sun','sky','fish',
    'star','moon','tree','bird','rain',
    'apple','happy','smile','dance','music',
    'hello','world','candy','party','magic',
    'rainbow','cookie','flower','rabbit','cheese',
    'jump','play','sing','love','cool'
  ]
};

const MONSTERS = ['👾','🐙','🦑','🐸','🐱','🐻','🐵','👻','🤖','🐲','🦊','🐧','🐥','🦄','🐝','🍄'];

const PRAISE = ['すごい！','ナイス！','かっこいい！','やったね！','バッチリ！','グッド！','さいこう！','スーパー！'];

const COMBO_MSG = {
  5: '5コンボ！🔥',
  10: '10コンボ！！🔥🔥',
  20: '20コンボ！！！🔥🔥🔥',
  30: 'すごすぎ！30コンボ！✨✨✨',
  50: 'かみワザ！50コンボ！👑'
};

// Monsters to defeat per level to clear
const GOAL = { 1: 15, 2: 12, 3: 10 };

// ========== GAME STATE ==========
let state = {
  level: 1,
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: 3,
  totalTyped: 0,
  correctTyped: 0,
  monsters: [],
  activeMonster: null,
  gameLoop: null,
  spawnTimer: null,
  running: false,
  paused: false,
  defeated: 0,
  missed: 0,
  spawned: 0,
  cleared: false
};

// ========== LEVEL SELECT ==========
function selectLevel(level) {
  state.level = level;
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.level) === level);
  });
}

// ========== GAME START ==========
function startGame() {
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.lives = 3;
  state.totalTyped = 0;
  state.correctTyped = 0;
  state.monsters = [];
  state.activeMonster = null;
  state.running = true;
  state.paused = false;
  state.defeated = 0;
  state.missed = 0;
  state.spawned = 0;
  state.cleared = false;

  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  document.getElementById('gameArea').innerHTML = '';
  document.getElementById('progressFill').style.width = '0%';

  updateHUD();
  updateTypingDisplay();

  // Spawn interval based on level
  const spawnInterval = [2800, 2400, 2000][state.level - 1];
  state.spawnTimer = setInterval(spawnMonster, spawnInterval);

  // Spawn first monster immediately
  spawnMonster();

  // Game loop at 60fps
  state.gameLoop = requestAnimationFrame(gameUpdate);
}

// ========== SPAWN MONSTER ==========
function spawnMonster() {
  if (!state.running || state.paused) return;

  const goal = GOAL[state.level];
  // Stop spawning once we've sent enough monsters
  if (state.spawned >= goal) return;

  const words = WORDS[state.level];
  const word = words[Math.floor(Math.random() * words.length)];
  const emoji = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];

  const area = document.getElementById('gameArea');
  const areaW = area.offsetWidth;

  const el = document.createElement('div');
  el.className = 'monster';

  const x = 40 + Math.random() * (areaW - 120);
  el.style.left = x + 'px';
  el.style.top = '-80px';

  el.innerHTML = `
    <div class="monster-emoji">${emoji}</div>
    <div class="monster-word"><span class="typed"></span><span class="untyped">${word}</span></div>
  `;

  area.appendChild(el);

  const speed = [0.4, 0.55, 0.7][state.level - 1];

  const monster = {
    el,
    word,
    typed: '',
    y: -80,
    speed: speed + Math.random() * 0.25,
    x
  };

  state.monsters.push(monster);
  state.spawned++;
}

// ========== GAME LOOP ==========
function gameUpdate() {
  if (!state.running) return;
  if (state.paused) {
    state.gameLoop = requestAnimationFrame(gameUpdate);
    return;
  }

  const area = document.getElementById('gameArea');
  const areaH = area.offsetHeight;

  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const m = state.monsters[i];
    m.y += m.speed;
    m.el.style.top = m.y + 'px';

    // Monster reached ground
    if (m.y > areaH - 40) {
      loseLife(m, i);
    }
  }

  // Check level clear: all monsters spawned and defeated/missed
  const goal = GOAL[state.level];
  if (state.spawned >= goal && state.monsters.length === 0 && !state.cleared) {
    state.cleared = true;
    endGame();
  }

  state.gameLoop = requestAnimationFrame(gameUpdate);
}

// ========== LOSE LIFE ==========
function loseLife(monster, index) {
  monster.el.remove();
  state.monsters.splice(index, 1);
  if (state.activeMonster === monster) {
    clearActiveMonster();
  }

  state.lives--;
  state.combo = 0;
  state.missed++;
  updateHUD();
  updateTypingDisplay();

  // Shake screen
  document.getElementById('gameScreen').style.animation = 'shake 0.3s';
  setTimeout(() => {
    document.getElementById('gameScreen').style.animation = '';
  }, 300);

  if (state.lives <= 0) {
    endGame();
  }
}

// ========== CLEAR ACTIVE MONSTER ==========
function clearActiveMonster() {
  if (state.activeMonster) {
    state.activeMonster.el.classList.remove('active');
    // Reset typed display on abandoned monster
    const wordEl = state.activeMonster.el.querySelector('.monster-word');
    if (wordEl) {
      wordEl.innerHTML = `<span class="typed"></span><span class="untyped">${state.activeMonster.word}</span>`;
    }
    state.activeMonster.typed = '';
  }
  state.activeMonster = null;
}

// ========== TYPING DISPLAY ==========
function updateTypingDisplay() {
  const display = document.getElementById('typingDisplay');
  if (!state.activeMonster || !state.activeMonster.typed) {
    display.innerHTML = '<span style="color:rgba(255,255,255,0.3)">キーボードでタイプしよう！</span>';
  } else {
    const m = state.activeMonster;
    display.innerHTML = `<span style="color:#ffd700">${m.typed}</span><span style="color:rgba(255,255,255,0.4)">${m.word.slice(m.typed.length)}</span>`;
  }
}

// ========== TYPING HANDLER (keydown - 1 char at a time) ==========
document.addEventListener('keydown', function(e) {
  // Pause toggle
  if (e.key === 'Escape' && state.running) {
    if (state.paused) resumeGame();
    else pauseGame();
    return;
  }

  if (!state.running || state.paused) return;

  // Only process single printable characters
  if (e.key.length !== 1) return;
  // Ignore if modifier keys are held
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const char = e.key.toLowerCase();
  e.preventDefault();

  state.totalTyped++;

  // If we have an active monster, try to continue typing it
  if (state.activeMonster && state.monsters.includes(state.activeMonster)) {
    const m = state.activeMonster;
    const nextChar = m.word[m.typed.length];

    if (char === nextChar) {
      // Correct! Advance typed
      m.typed += char;
      state.correctTyped++;
      updateMonsterDisplay(m);
      updateTypingDisplay();

      // Check if word completed
      if (m.typed === m.word) {
        defeatMonster(m);
      }
      return;
    } else {
      // Wrong char for active monster.
      // Check if this char starts a different monster's word - allow target switch
      const newTarget = findMonsterStartingWith(char, state.activeMonster);
      if (newTarget) {
        clearActiveMonster();
        state.activeMonster = newTarget;
        newTarget.typed = char;
        newTarget.el.classList.add('active');
        state.correctTyped++;
        updateMonsterDisplay(newTarget);
        updateTypingDisplay();

        if (newTarget.typed === newTarget.word) {
          defeatMonster(newTarget);
        }
        return;
      }
      // No match at all - miss
      state.combo = 0;
      updateHUD();
      return;
    }
  }

  // No active monster - find one that starts with this character
  const target = findMonsterStartingWith(char, null);
  if (target) {
    state.activeMonster = target;
    target.typed = char;
    target.el.classList.add('active');
    state.correctTyped++;
    updateMonsterDisplay(target);
    updateTypingDisplay();

    if (target.typed === target.word) {
      defeatMonster(target);
    }
  }
});

// Find a monster whose first char matches, closest to bottom (most urgent)
function findMonsterStartingWith(char, exclude) {
  let best = null;
  let bestY = -Infinity;
  for (const m of state.monsters) {
    if (m === exclude) continue;
    if (m.typed.length === 0 && m.word[0] === char && m.y > bestY) {
      best = m;
      bestY = m.y;
    }
  }
  return best;
}

function updateMonsterDisplay(m) {
  const wordEl = m.el.querySelector('.monster-word');
  wordEl.innerHTML = `<span class="typed">${m.typed}</span><span class="untyped">${m.word.slice(m.typed.length)}</span>`;
}

// ========== DEFEAT MONSTER ==========
function defeatMonster(monster) {
  const idx = state.monsters.indexOf(monster);
  if (idx === -1) return;

  state.monsters.splice(idx, 1);

  // Score
  const baseScore = monster.word.length * 10;
  const comboBonus = Math.floor(state.combo * 2);
  state.score += baseScore + comboBonus;
  state.combo++;
  state.defeated++;

  if (state.combo > state.maxCombo) state.maxCombo = state.combo;

  // Explode animation
  monster.el.classList.remove('active');
  monster.el.classList.add('exploding');
  setTimeout(() => monster.el.remove(), 400);

  // Show particles
  spawnParticles(monster.el);

  // Show praise
  if (state.combo >= 3) {
    showFloatMsg(PRAISE[Math.floor(Math.random() * PRAISE.length)], monster.x, monster.y);
  }

  // Combo milestones
  if (COMBO_MSG[state.combo]) {
    showFloatMsg(COMBO_MSG[state.combo], window.innerWidth / 2 - 80, window.innerHeight / 2 - 100);
  }

  state.activeMonster = null;
  updateHUD();
  updateTypingDisplay();

  // Update progress bar
  const goal = GOAL[state.level];
  const pct = Math.min(100, Math.round((state.defeated / goal) * 100));
  document.getElementById('progressFill').style.width = pct + '%';
}

// ========== PARTICLES ==========
function spawnParticles(el) {
  const rect = el.getBoundingClientRect();
  const area = document.getElementById('gameArea');
  const areaRect = area.getBoundingClientRect();
  const stars = ['⭐','✨','💥','🌟','⚡'];

  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div');
    p.className = 'star-particle';
    p.textContent = stars[Math.floor(Math.random() * stars.length)];
    p.style.fontSize = (1 + Math.random()) + 'rem';
    p.style.left = (rect.left - areaRect.left + Math.random() * 60 - 30) + 'px';
    p.style.top = (rect.top - areaRect.top + Math.random() * 60 - 30) + 'px';
    area.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

// ========== FLOAT MESSAGE ==========
function showFloatMsg(text, x, y) {
  const area = document.getElementById('gameArea');
  const msg = document.createElement('div');
  msg.className = 'float-msg';
  msg.textContent = text;
  msg.style.left = Math.max(10, Math.min(x, area.offsetWidth - 150)) + 'px';
  msg.style.top = Math.max(10, y) + 'px';
  area.appendChild(msg);
  setTimeout(() => msg.remove(), 1000);
}

// ========== HUD ==========
function updateHUD() {
  const heartsStr = '❤️'.repeat(Math.max(0, state.lives)) + '🖤'.repeat(Math.max(0, 3 - state.lives));
  document.getElementById('hearts').textContent = heartsStr;
  document.getElementById('scoreDisplay').textContent = state.score;

  const comboEl = document.getElementById('comboDisplay');
  if (state.combo >= 2) {
    comboEl.textContent = state.combo + ' コンボ！';
  } else {
    comboEl.textContent = '';
  }
}

// ========== PAUSE ==========
function pauseGame() {
  state.paused = true;
  document.getElementById('pauseOverlay').style.display = 'flex';
}

function resumeGame() {
  state.paused = false;
  document.getElementById('pauseOverlay').style.display = 'none';
}

// ========== END GAME ==========
function endGame() {
  state.running = false;
  clearInterval(state.spawnTimer);
  cancelAnimationFrame(state.gameLoop);

  setTimeout(showResult, 500);
}

function showResult() {
  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'flex';

  const accuracy = state.totalTyped > 0
    ? Math.round((state.correctTyped / state.totalTyped) * 100)
    : 0;

  document.getElementById('resultScore').textContent = state.score;
  document.getElementById('resultCombo').textContent = state.maxCombo;
  document.getElementById('resultAccuracy').textContent = accuracy + '%';

  // Rank & Title
  let rank, title;
  if (state.cleared && state.lives === 3) {
    rank = '👑'; title = 'パーフェクト！タイピングマスター！';
  } else if (state.cleared) {
    rank = '🏆'; title = 'レベルクリア！タイピングヒーロー！';
  } else if (state.score >= 150) {
    rank = '⭐'; title = 'おしい！タイピングファイター！';
  } else if (state.score >= 50) {
    rank = '🌟'; title = 'がんばりやさん！';
  } else {
    rank = '💪'; title = 'つぎはもっとできるよ！';
  }

  document.getElementById('resultRank').textContent = rank;
  document.getElementById('resultTitle').textContent = title;
}

// ========== NAVIGATION ==========
function quitToTitle() {
  state.running = false;
  clearInterval(state.spawnTimer);
  cancelAnimationFrame(state.gameLoop);

  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
}

function retryGame() {
  startGame();
}
