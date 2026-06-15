'use strict';

// ─────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────
const W = 800, H = 600;

const ZODIAC = [
    { name: '쥐',     emoji: '🐀', hp: 1  },
    { name: '소',     emoji: '🐂', hp: 2  },
    { name: '호랑이', emoji: '🐯', hp: 3  },
    { name: '토끼',   emoji: '🐰', hp: 4  },
    { name: '용',     emoji: '🐉', hp: 5  },
    { name: '뱀',     emoji: '🐍', hp: 6  },
    { name: '말',     emoji: '🐴', hp: 7  },
    { name: '양',     emoji: '🐑', hp: 8  },
    { name: '원숭이', emoji: '🐒', hp: 9  },
    { name: '닭',     emoji: '🐓', hp: 10 },
    { name: '개',     emoji: '🐕', hp: 11 },
    { name: '돼지',   emoji: '🐷', hp: 12 },
];

const CAR_COLORS = [
    '#e74c3c','#3498db','#2ecc71','#f39c12',
    '#9b59b6','#1abc9c','#e67e22','#e91e63',
];

const CAR_STATS = {
    sports:      { speed: 7.0, fireRate: 8,  bulletSpd: 13 },
    truck:       { speed: 3.8, fireRate: 20, bulletSpd: 9  },
    convertible: { speed: 5.5, fireRate: 12, bulletSpd: 11 },
};

// ─────────────────────────────────────────
//  State
// ─────────────────────────────────────────
let canvas, ctx;
let state      = 'title';   // title | playing | pause | stageclear | gameover | victory
let score      = 0;
let stage      = 1;
let lives      = 3;
let carType    = 'sports';
let carColor   = CAR_COLORS[0];

let player, enemies, playerBullets, particles;
let roadOffset  = 0;
let spawnTimer  = 0;
let killCount   = 0;
let killsNeeded = 0;
let frame       = 0;
const keys      = {};

// ─────────────────────────────────────────
//  Init
// ─────────────────────────────────────────
window.onload = () => {
    canvas        = document.getElementById('gameCanvas');
    canvas.width  = W;
    canvas.height = H;
    ctx           = canvas.getContext('2d');

    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space') e.preventDefault();
        if (e.code === 'KeyP') togglePause();
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    drawPreviews();
    requestAnimationFrame(loop);
};

// ─────────────────────────────────────────
//  Utility
// ─────────────────────────────────────────
function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function darken(hex, amt) {
    const r = parseInt(hex.slice(1,3),16),
          g = parseInt(hex.slice(3,5),16),
          b = parseInt(hex.slice(5,7),16);
    return `rgb(${~~(r*(1-amt))},${~~(g*(1-amt))},${~~(b*(1-amt))})`;
}

function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nx = Math.max(rx - rw/2, Math.min(cx, rx + rw/2));
    const ny = Math.max(ry - rh/2, Math.min(cy, ry + rh/2));
    return (cx-nx)**2 + (cy-ny)**2 < cr*cr;
}

// ─────────────────────────────────────────
//  Car Drawing
// ─────────────────────────────────────────
function wheel(c, x, y, w, h) {
    c.fillStyle = '#1a1a1a';
    c.fillRect(x, y, w, h);
    c.fillStyle = '#555';
    c.fillRect(x+2, y+2, w-4, h-4);
    c.fillStyle = '#2a2a2a';
    c.fillRect(x+3, y+3, w-6, h-6);
}

function sportsCar(c, x, y, col) {
    const bw = 34, bh = 58;
    c.save(); c.translate(x, y);

    // shadow
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath(); c.ellipse(1, bh/2+4, bw/2+2, 6, 0, 0, Math.PI*2); c.fill();

    // spoiler
    c.fillStyle = darken(col, 0.45);
    c.fillRect(-bw/2, bh/2-8, bw, 5);
    c.fillRect(-bw/2-3, bh/2-6, 5, 3);
    c.fillRect(bw/2-2, bh/2-6, 5, 3);

    // body
    c.fillStyle = col;
    rr(c, -bw/2, -bh/2, bw, bh, 7); c.fill();

    // highlight
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath(); c.ellipse(-4, -4, 9, 18, -0.25, 0, Math.PI*2); c.fill();

    // hood
    c.fillStyle = darken(col, 0.18);
    c.beginPath();
    c.moveTo(-bw/2+6, -bh/2); c.lineTo(bw/2-6, -bh/2);
    c.lineTo(bw/2-3, -bh/2+9); c.lineTo(-bw/2+3, -bh/2+9);
    c.closePath(); c.fill();

    // windshield
    c.fillStyle = 'rgba(130,200,255,0.82)';
    rr(c, -bw/2+6, -bh/2+10, bw-12, bh/3-2, 3); c.fill();
    c.strokeStyle = darken(col, 0.5); c.lineWidth = 1.5; c.stroke();

    // rear window
    c.fillStyle = 'rgba(130,200,255,0.55)';
    rr(c, -bw/2+7, bh/6+2, bw-14, bh/5, 3); c.fill();

    // wheels
    wheel(c, -bw/2-5, -bh/2+7, 8, 14);
    wheel(c,  bw/2-3, -bh/2+7, 8, 14);
    wheel(c, -bw/2-5,  bh/2-21, 8, 14);
    wheel(c,  bw/2-3,  bh/2-21, 8, 14);

    // headlights
    c.fillStyle = '#ffffa0'; c.shadowColor = '#ffff44'; c.shadowBlur = 10;
    c.fillRect(-bw/2+4, -bh/2+2, 9, 5);
    c.fillRect( bw/2-13, -bh/2+2, 9, 5);
    c.shadowBlur = 0;

    // tail lights
    c.fillStyle = '#ff4444';
    c.fillRect(-bw/2+4, bh/2-5, 8, 4);
    c.fillRect( bw/2-12, bh/2-5, 8, 4);

    c.restore();
}

function truck(c, x, y, col) {
    const bw = 48, bh = 72;
    c.save(); c.translate(x, y);

    // shadow
    c.fillStyle = 'rgba(0,0,0,0.38)';
    c.beginPath(); c.ellipse(1, bh/2+5, bw/2+3, 7, 0, 0, Math.PI*2); c.fill();

    // cargo bed
    c.fillStyle = '#4a3c2c';
    c.fillRect(-bw/2, -bh/2 + bh*0.38, bw, bh*0.62);
    c.fillStyle = '#5a4c3c';
    c.fillRect(-bw/2+3, -bh/2 + bh*0.42, bw-6, bh*0.56);
    c.strokeStyle = '#6a5c4c'; c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-bw/2+3, -bh/2 + bh*0.44 + i*bh*0.17);
        c.lineTo( bw/2-3, -bh/2 + bh*0.44 + i*bh*0.17);
        c.stroke();
    }

    // cab
    c.fillStyle = col;
    rr(c, -bw/2, -bh/2, bw, bh*0.42, 6); c.fill();

    // highlight
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.beginPath(); c.ellipse(-5, -bh/2 + bh*0.1, 9, 13, -0.2, 0, Math.PI*2); c.fill();

    // bumper
    c.fillStyle = '#333';
    c.fillRect(-bw/2, -bh/2-4, bw, 6);
    c.fillStyle = '#555';
    c.fillRect(-bw/2+2, -bh/2-3, bw-4, 4);

    // windshield (wide)
    c.fillStyle = 'rgba(130,200,255,0.82)';
    rr(c, -bw/2+5, -bh/2+8, bw-10, bh*0.2, 3); c.fill();
    c.strokeStyle = darken(col, 0.5); c.lineWidth = 1.5; c.stroke();

    // wheels (6)
    wheel(c, -bw/2-6, -bh/2+10, 10, 17);
    wheel(c,  bw/2-4, -bh/2+10, 10, 17);
    wheel(c, -bw/2-6,  bh/2-44, 10, 17);
    wheel(c,  bw/2-4,  bh/2-44, 10, 17);
    wheel(c, -bw/2-6,  bh/2-23, 10, 17);
    wheel(c,  bw/2-4,  bh/2-23, 10, 17);

    // headlights (wide)
    c.fillStyle = '#ffffa0'; c.shadowColor = '#ffff44'; c.shadowBlur = 12;
    c.fillRect(-bw/2+3, -bh/2+2, 14, 7);
    c.fillRect( bw/2-17, -bh/2+2, 14, 7);
    c.shadowBlur = 0;

    // tail lights
    c.fillStyle = '#ff4444';
    c.fillRect(-bw/2+3, bh/2-5, 10, 5);
    c.fillRect( bw/2-13, bh/2-5, 10, 5);

    c.restore();
}

function convertible(c, x, y, col) {
    const bw = 38, bh = 62;
    c.save(); c.translate(x, y);

    // shadow
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath(); c.ellipse(1, bh/2+4, bw/2+2, 6, 0, 0, Math.PI*2); c.fill();

    // body
    c.fillStyle = col;
    rr(c, -bw/2, -bh/2, bw, bh, 7); c.fill();

    // highlight
    c.fillStyle = 'rgba(255,255,255,0.16)';
    c.beginPath(); c.ellipse(-4, 0, 8, 20, -0.2, 0, Math.PI*2); c.fill();

    // open cockpit
    c.fillStyle = '#161616';
    rr(c, -bw/2+6, -bh/2+11, bw-12, bh*0.52, 4); c.fill();

    // seats
    c.fillStyle = darken(col, 0.35);
    c.fillRect(-bw/2+8, -bh/2+14, (bw-20)/2, bh*0.2);
    c.fillRect(4,        -bh/2+14, (bw-20)/2, bh*0.2);

    // seat cushion shine
    c.fillStyle = 'rgba(255,255,255,0.08)';
    c.fillRect(-bw/2+8, -bh/2+22, (bw-20)/2, 4);
    c.fillRect(4,        -bh/2+22, (bw-20)/2, 4);

    // steering wheel
    c.strokeStyle = '#444'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(0, -bh/2+29, 5, 0, Math.PI*2); c.stroke();

    // windshield frame
    c.fillStyle = 'rgba(130,200,255,0.65)';
    rr(c, -bw/2+6, -bh/2+5, bw-12, 8, 2); c.fill();
    c.strokeStyle = darken(col, 0.45); c.lineWidth = 2; c.stroke();

    // wheels
    wheel(c, -bw/2-5, -bh/2+8, 8, 13);
    wheel(c,  bw/2-3, -bh/2+8, 8, 13);
    wheel(c, -bw/2-5,  bh/2-21, 8, 13);
    wheel(c,  bw/2-3,  bh/2-21, 8, 13);

    // headlights
    c.fillStyle = '#ffffa0'; c.shadowColor = '#ffff44'; c.shadowBlur = 8;
    c.fillRect(-bw/2+4, -bh/2+2, 8, 4);
    c.fillRect( bw/2-12, -bh/2+2, 8, 4);
    c.shadowBlur = 0;

    // tail lights
    c.fillStyle = '#ff4444';
    c.fillRect(-bw/2+4, bh/2-5, 7, 4);
    c.fillRect( bw/2-11, bh/2-5, 7, 4);

    c.restore();
}

function drawCar(c, x, y, type, col) {
    switch (type) {
        case 'sports':      sportsCar(c, x, y, col);    break;
        case 'truck':       truck(c, x, y, col);         break;
        case 'convertible': convertible(c, x, y, col);  break;
    }
}

// ─────────────────────────────────────────
//  Car Previews (title screen)
// ─────────────────────────────────────────
function drawPreviews() {
    const types = ['sports', 'truck', 'convertible'];
    const ids   = ['previewSports', 'previewTruck', 'previewConvertible'];
    types.forEach((t, i) => {
        const pc  = document.getElementById(ids[i]);
        const pct = pc.getContext('2d');
        pct.fillStyle = '#111';
        pct.fillRect(0, 0, 100, 150);
        pct.strokeStyle = '#333'; pct.lineWidth = 1;
        pct.setLineDash([8,5]);
        pct.beginPath(); pct.moveTo(50,0); pct.lineTo(50,150); pct.stroke();
        pct.setLineDash([]);
        const col = CAR_COLORS[(i * 2) % CAR_COLORS.length];
        drawCar(pct, 50, 90, t, col);
    });
}

// ─────────────────────────────────────────
//  Game Setup
// ─────────────────────────────────────────
function selectCar(type) {
    carType  = type;
    carColor = randChoice(CAR_COLORS);
    startGame();
}

function startGame() {
    score = 0;
    stage = 1;
    lives = 3;
    initStage();
    show('hud');
    hide('titleScreen','stageClearScreen','gameOverScreen','victoryScreen');
    state = 'playing';
    updateHUD();
}

function initStage() {
    enemies       = [];
    playerBullets = [];
    particles     = [];
    roadOffset    = 0;
    spawnTimer    = 0;
    killCount     = 0;
    killsNeeded   = stage * 5 + 5;   // 10, 15, 20 … 65
    frame         = 0;

    const stats = CAR_STATS[carType];
    player = {
        x: W / 2, y: H - 85,
        w: carType === 'truck' ? 50 : 38,
        h: carType === 'truck' ? 74 : 62,
        speed:     stats.speed,
        fireRate:  stats.fireRate,
        bulletSpd: stats.bulletSpd,
        cool: 0,
        inv:  0,    // invincibility frames
    };
}

function restartGame() {
    carColor = randChoice(CAR_COLORS);
    startGame();
}

function goToTitle() {
    hide('gameOverScreen','victoryScreen','hud','stageClearScreen');
    show('titleScreen');
    drawPreviews();
    state = 'title';
}

// ─────────────────────────────────────────
//  Screen helpers
// ─────────────────────────────────────────
function show(...ids) { ids.forEach(id => document.getElementById(id)?.classList.remove('hidden')); }
function hide(...ids) { ids.forEach(id => document.getElementById(id)?.classList.add('hidden')); }

// ─────────────────────────────────────────
//  Pause
// ─────────────────────────────────────────
function togglePause() {
    if (state === 'playing') {
        state = 'pause';
        show('pauseScreen');
    } else if (state === 'pause') {
        state = 'playing';
        hide('pauseScreen');
    }
}

// ─────────────────────────────────────────
//  Spawning
// ─────────────────────────────────────────
function spawnEnemy() {
    // 60 % current stage's animal, 40 % random from previous
    let zi;
    if (Math.random() < 0.62 || stage === 1) {
        zi = stage - 1;
    } else {
        zi = Math.floor(Math.random() * (stage - 1));
    }

    const z    = ZODIAC[zi];
    const size = 36 + zi * 2;           // larger animals in later stages
    const patterns = ['straight', 'zigzag', 'wave'];
    const pat  = stage >= 4
        ? randChoice(patterns)
        : (stage >= 2 ? (Math.random() < 0.5 ? 'straight' : 'zigzag') : 'straight');

    const sx = 80 + Math.random() * (W - 160);
    enemies.push({
        x: sx, y: -size - 10,
        size, zi,
        hp: z.hp, maxHp: z.hp,
        spd: 1.2 + stage * 0.18 + zi * 0.06,
        pat, pt: 0, sx,
        flash: 0,
    });
}

// ─────────────────────────────────────────
//  Bullets
// ─────────────────────────────────────────
function fireBullet() {
    playerBullets.push({ x: player.x, y: player.y - player.h/2 - 2, spd: player.bulletSpd });
}

// ─────────────────────────────────────────
//  Particles
// ─────────────────────────────────────────
function explode(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1.5 + Math.random() * 5;
        particles.push({
            x, y,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            life: 1, decay: 0.018 + Math.random() * 0.03,
            sz:   3 + Math.random() * 6,
            col:  randChoice(cols),
        });
    }
}

// ─────────────────────────────────────────
//  Update
// ─────────────────────────────────────────
function update() {
    if (state !== 'playing') return;
    frame++;
    roadOffset += 3;

    // ── player movement ──
    const spd = player.speed;
    if (keys['ArrowLeft']  || keys['KeyA']) player.x -= spd;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += spd;
    if (keys['ArrowUp']    || keys['KeyW']) player.y -= spd;
    if (keys['ArrowDown']  || keys['KeyS']) player.y += spd;

    player.x = Math.max(70 + player.w/2, Math.min(W - 70 - player.w/2, player.x));
    player.y = Math.max(50 + player.h/2,  Math.min(H - player.h/2 - 5,  player.y));

    // ── firing (auto + manual) ──
    player.cool--;
    if ((keys['Space'] || keys['KeyZ'] || true) && player.cool <= 0) {
        fireBullet();
        player.cool = player.fireRate;
    }
    if (player.inv > 0) player.inv--;

    // ── spawn ──
    const interval = Math.max(30, 100 - stage * 5);
    spawnTimer++;
    if (spawnTimer >= interval) {
        spawnTimer = 0;
        spawnEnemy();
        if (stage >= 4) spawnEnemy();
        if (stage >= 8) spawnEnemy();
    }

    // ── update enemies ──
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.pt++;

        switch (e.pat) {
            case 'straight':
                e.y += e.spd;
                break;
            case 'zigzag':
                e.y += e.spd;
                e.x += Math.sin(e.pt * 0.07) * 3;
                break;
            case 'wave':
                e.y += e.spd;
                e.x = e.sx + Math.sin(e.pt * 0.035) * 90;
                break;
        }
        e.x = Math.max(60, Math.min(W - 60, e.x));
        if (e.flash > 0) e.flash--;

        if (e.y > H + e.size) { enemies.splice(i, 1); continue; }

        // enemy hits player
        if (player.inv <= 0 && circleRect(e.x, e.y, e.size * 0.42, player.x, player.y, player.w, player.h)) {
            enemies.splice(i, 1);
            loseLife();
        }
    }

    // ── update bullets ──
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.y -= b.spd;
        if (b.y < -14) { playerBullets.splice(i, 1); continue; }

        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = b.x - e.x, dy = b.y - e.y;
            if (dx*dx + dy*dy < (e.size * 0.45)**2) {
                e.hp--;
                e.flash = 7;
                explode(b.x, b.y, 5, ['#fff','#ff0','#f80']);
                hit = true;
                if (e.hp <= 0) {
                    explode(e.x, e.y, 22 + e.zi * 2, ['#ff0','#f80','#f40','#fff','#ff6']);
                    score += (e.zi + 1) * 100;
                    killCount++;
                    enemies.splice(j, 1);
                    updateHUD();
                }
                break;
            }
        }
        if (hit) { playerBullets.splice(i, 1); }
    }

    // ── particles ──
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.12; p.vx *= 0.95;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // exhaust smoke (occasional)
    if (frame % 9 === 0) {
        particles.push({
            x: player.x + (Math.random()-0.5)*8,
            y: player.y + player.h/2 + 2,
            vx: (Math.random()-0.5)*0.4, vy: 1.2 + Math.random()*1.5,
            life: 0.7, decay: 0.04 + Math.random()*0.03,
            sz: 4 + Math.random()*4, col: 'rgba(160,160,160,0.5)',
        });
    }

    // stage clear?
    if (killCount >= killsNeeded) stageClear();
}

// ─────────────────────────────────────────
//  Life / Game Over
// ─────────────────────────────────────────
function loseLife() {
    lives--;
    player.inv = 130;
    explode(player.x, player.y, 18, ['#f00','#f80','#ff0','#fff']);
    updateHUD();
    if (lives <= 0) gameOver();
}

// ─────────────────────────────────────────
//  Stage Management
// ─────────────────────────────────────────
function stageClear() {
    state = 'stageclear';
    const z = ZODIAC[stage - 1];
    document.getElementById('clearAnimalInfo').textContent  = `${stage}단계 — ${z.name} ${z.emoji} 클리어!`;
    document.getElementById('clearScoreInfo').textContent   = `현재 점수: ${score.toLocaleString()}`;
    show('stageClearScreen');

    setTimeout(() => {
        hide('stageClearScreen');
        if (stage >= 12) { victory(); return; }
        stage++;
        initStage();
        state = 'playing';
        updateHUD();
    }, 2800);
}

function gameOver() {
    state = 'gameover';
    const z = ZODIAC[stage - 1];
    document.getElementById('goStageInfo').textContent  = `도달 단계: ${stage}단계 (${z.name} ${z.emoji})`;
    document.getElementById('goScoreInfo').textContent  = `최종 점수: ${score.toLocaleString()}`;
    show('gameOverScreen');
}

function victory() {
    state = 'victory';
    document.getElementById('victoryScoreInfo').textContent = `최종 점수: ${score.toLocaleString()}`;
    hide('hud');
    show('victoryScreen');
}

// ─────────────────────────────────────────
//  HUD
// ─────────────────────────────────────────
function updateHUD() {
    document.getElementById('stageDisplay').textContent = stage;
    document.getElementById('scoreDisplay').textContent = score.toLocaleString();

    const hearts = '❤️'.repeat(Math.max(0,lives)) + '🖤'.repeat(Math.max(0,3-lives));
    document.getElementById('livesDisplay').textContent = hearts;

    const z = ZODIAC[stage - 1];
    document.getElementById('stageAnimalInfo').textContent = `${z.name} ${z.emoji}  체력 ${z.hp}  |  처치: ${killCount}/${killsNeeded}`;

    const pct = Math.min(1, killCount / killsNeeded);
    document.getElementById('killProgressFill').style.width = (pct * 100) + '%';
}

// ─────────────────────────────────────────
//  Draw
// ─────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, W, H);

    if (state === 'title') {
        drawTitleBg();
        return;
    }

    drawRoad();

    // particles
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz * p.life, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    // enemies
    for (const e of enemies) drawEnemy(e);

    // bullets
    for (const b of playerBullets) drawBullet(b);

    // player
    if (player) drawPlayer();
}

function drawTitleBg() {
    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, W, H);

    // scrolling stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 60; i++) {
        const sx = (i * 113.7) % W;
        const sy = (i * 79.3 + frame * 0.2) % H;
        ctx.fillRect(sx, sy, 1.5, 1.5);
    }
}

function drawRoad() {
    // road
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, W, H);

    // curb strips (left + right)
    const stripeH  = 40;
    const stripes  = Math.ceil(H / stripeH) + 2;
    const sOff     = roadOffset % (stripeH * 2);
    for (let i = 0; i < stripes; i++) {
        const sy = i * stripeH * 2 - stripeH * 2 + sOff;
        ctx.fillStyle = '#555';
        ctx.fillRect(0, sy, 60, stripeH);
        ctx.fillRect(W-60, sy, 60, stripeH);
        ctx.fillStyle = '#dd3333';
        ctx.fillRect(0, sy, 7, stripeH);
        ctx.fillRect(W-67, sy, 7, stripeH);
    }

    // edge lines
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(60, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W-60, 0); ctx.lineTo(W-60, H); ctx.stroke();

    // center dashes
    const dashLen = 50, dashGap = 30, dPeriod = dashLen + dashGap;
    const dOff    = roadOffset % dPeriod;
    const dCount  = Math.ceil(H / dPeriod) + 2;
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2.5;
    ctx.setLineDash([dashLen, dashGap]);
    ctx.lineDashOffset = -dOff;
    const lanes = [195, 305, 400, 495, 605];
    for (const lx of lanes) {
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawEnemy(e) {
    const z = ZODIAC[e.zi];
    ctx.save(); ctx.translate(e.x, e.y);

    // hit flash
    if (e.flash > 0 && e.flash % 3 < 2) ctx.globalAlpha = 0.25;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(2, e.size/2, e.size/2-2, e.size/7, 0, 0, Math.PI*2); ctx.fill();

    ctx.globalAlpha = 1;

    // emoji
    ctx.font            = `${e.size}px Arial`;
    ctx.textAlign       = 'center';
    ctx.textBaseline    = 'middle';
    ctx.fillText(z.emoji, 0, 0);

    // HP bar
    const bw = e.size + 12, bh = 7, by = -e.size/2 - 13;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-bw/2, by, bw, bh);
    const ratio = e.hp / e.maxHp;
    ctx.fillStyle = ratio > 0.55 ? '#2ecc71' : ratio > 0.28 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(-bw/2, by, bw * ratio, bh);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.strokeRect(-bw/2, by, bw, bh);

    // HP text (only if multi-hit)
    if (e.maxHp > 1) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${e.hp}/${e.maxHp}`, 0, by + bh/2);
    }

    ctx.restore();
}

function drawBullet(b) {
    ctx.save();
    ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 10;
    const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y - 14);
    g.addColorStop(0, '#4488ff'); g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 2, b.y - 14, 4, 14);
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawPlayer() {
    // invincibility flash
    if (player.inv > 0 && Math.floor(player.inv / 8) % 2 === 0) return;

    // engine glow
    ctx.save();
    ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(50,100,255,0.22)';
    ctx.beginPath(); ctx.ellipse(player.x, player.y + player.h/2, player.w/2+2, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    drawCar(ctx, player.x, player.y, carType, carColor);
}

// ─────────────────────────────────────────
//  Main Loop
// ─────────────────────────────────────────
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
