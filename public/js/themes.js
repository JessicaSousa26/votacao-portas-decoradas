// ===========================================
// 🎄 themes.js — Controle visual natalino completo (atualizado)
// ===========================================

// ===== 🔥 CONFIGURAÇÕES =====
const XMAS_CONF = {
  musicKey: 'xmas_music_pref',
  snowKey: 'xmas_snow_pref',
  sparkleKey: 'xmas_sparkle_pref',
  qrKey: 'xmas_qr_pref',
  firestore: { settingsDoc: 'settings/votacao' },
  encerramento: 'encerramento.html',
  fimPadrao: new Date('2025-12-22T23:59:59')
};

// --- runtime style for banner animations
(() => {
  const st = document.createElement('style');
  st.id = 'xmasBannerStyles';
  st.textContent = `/* === Banner Animations === */\n@keyframes fadeInDrop {\n  0% { opacity: 0; transform: translateY(-10px); }\n  100% { opacity: 1; transform: translateY(0); }\n}\n@keyframes goldPulse {\n  0%, 100% { text-shadow: 0 0 0 rgba(245, 158, 11, 0.0); }\n  50% { text-shadow: 0 0 10px rgba(245, 158, 11, 0.55); }\n}`;
  document.head.appendChild(st);
})();


// ===== ❄️ NEVE =====
(() => {
  const snowPref = localStorage.getItem(XMAS_CONF.snowKey);
  if (snowPref === 'off') return;
  const c = document.getElementById('snow');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, flakes = [];
  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    flakes = Array.from({ length: Math.min(140, Math.floor(W / 10)) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1.2,
      d: Math.random() * 1 + .5
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    flakes.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      f.y += f.d;
      f.x += Math.sin(f.y * 0.01);
      if (f.y > H) { f.y = -5; f.x = Math.random() * W; }
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ===== ✨ BRILHOS =====
(() => {
  const active = localStorage.getItem(XMAS_CONF.sparkleKey) !== 'off';
  if (!active) return;
  const sparkleLayer = document.createElement('div');
  sparkleLayer.id = 'sparkleLayer';
  sparkleLayer.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:3;`;
  document.body.appendChild(sparkleLayer);
  for (let i = 0; i < 25; i++) {
    const d = document.createElement('div');
    d.className = 'sparkle';
    d.style.cssText = `
      position:absolute;width:6px;height:6px;
      background:radial-gradient(white 40%,transparent 60%);
      border-radius:50%;
      top:${Math.random() * 100}%;
      left:${Math.random() * 100}%;
      animation:sparkle 2s infinite ease-in-out;
      animation-delay:${Math.random() * 3}s;
      filter:drop-shadow(0 0 4px rgba(255,255,255,.8));
    `;
    sparkleLayer.appendChild(d);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes sparkle{0%,100%{opacity:0;transform:scale(.2);}50%{opacity:1;transform:scale(1);}}`;
  document.head.appendChild(style);
})();

// ===== 🔔 MÚSICA =====
(() => {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  const LS_KEY = XMAS_CONF.musicKey;
  const btn = document.getElementById('musicToggle');
  const pref = localStorage.getItem(LS_KEY);
  const setBtn = s => { if (btn) btn.textContent = s === 'on' ? '⏸️ Pausar música' : '▶️ Tocar música'; };
  const tryPlay = () => audio.play().then(() => { localStorage.setItem(LS_KEY, 'on'); setBtn('on'); })
    .catch(() => console.log('Interação necessária para áudio'));
  btn?.classList.remove('hidden');
  if (pref === 'on') tryPlay(); else setBtn('off');
  btn?.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => { localStorage.setItem(LS_KEY, 'on'); setBtn('on'); });
    } else {
      audio.pause(); localStorage.setItem(LS_KEY, 'off'); setBtn('off');
    }
  });
})();

// ===== 🧭 BANNER DE ENCERRAMENTO =====
(async () => {
  try {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    const snap = await db.collection('settings').doc('votacao').get();
    let fim = XMAS_CONF.fimPadrao;
    if (snap.exists && snap.data().fim) fim = snap.data().fim.toDate();
    if (new Date() > fim) {
      const banner = document.createElement('div');
      banner.innerHTML = `🔔 <b>A votação de Natal 2025 foi encerrada!</b>
      <a href="${XMAS_CONF.encerramento}" style="color:#b45309;text-decoration:underline;margin-left:6px;">
      Clique aqui para ver a mensagem de agradecimento 🎄</a>`;
      Object.assign(banner.style, {
        background: 'linear-gradient(90deg,#fff7ed,#ffedd5)',
        borderBottom: '2px solid #f59e0b',
        color: '#78350f',
        padding: '10px',
        textAlign: 'center',
        fontWeight: '700',
        fontFamily: 'Sofia, system-ui, sans-serif',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        zIndex: '9999',
        boxShadow: '0 2px 8px rgba(0,0,0,.1)'
      });
      banner.style.animation = 'fadeInDrop 1.2s ease-out';
      banner.querySelector('a').style.transition = 'color .25s ease';
      banner.querySelector('b').style.animation = 'goldPulse 2.2s ease-in-out infinite';
      document.body.prepend(banner);
    }
  } catch (err) { console.error('Erro ao verificar encerramento:', err); }
})();


// ===== 🔳 QR CODE VISIBILIDADE =====
(() => {
  const pref = localStorage.getItem(XMAS_CONF.qrKey);
  const el = document.getElementById('qrcode-fixo');
  if (!el) return;
  if (pref === 'off') {
    el.style.display = 'none';
  } else {
    el.style.display = '';
  }
})();

// ===== 🎛️ PAINEL DE CONTROLE (❄️ ✨ 🔔) =====
(() => {
  const panel = document.createElement('div');
  panel.id = 'xmasControls';
  panel.innerHTML = `
    <button id="btnSnow" title="Alternar neve">❄️</button>
    <button id="btnSpark" title="Alternar brilhos">✨</button>
    <button id="btnSound" title="Alternar som">🔔</button>
    <button id="btnQR" title="Mostrar/ocultar QR Code">🔳</button>`;
  Object.assign(panel.style, {
    position: 'fixed', left: '10px', top: '10px', zIndex: '9999',
    display: 'flex', flexDirection: 'column', gap: '8px'
  });
  document.body.appendChild(panel);
  [...panel.querySelectorAll('button')].forEach(btn => {
    Object.assign(btn.style, {
      border: 'none', background: '#065f46', color: '#fff',
      fontSize: '20px', borderRadius: '8px', cursor: 'pointer', padding: '6px'
    });
  });
  const toggle = (key, desc) => {
    const v = localStorage.getItem(key);
    const newVal = v === 'off' ? 'on' : 'off';
    localStorage.setItem(key, newVal);
    alert(`${desc} ${newVal === 'on' ? 'ativado(a)' : 'desativado(a)'}!`);
    location.reload();
  };
  document.getElementById('btnSnow').onclick = () => toggle(XMAS_CONF.snowKey, 'Neve');
  document.getElementById('btnSpark').onclick = () => toggle(XMAS_CONF.sparkleKey, 'Brilhos');
  document.getElementById('btnSound').onclick = () => toggle(XMAS_CONF.musicKey, 'Som');
  document.getElementById('btnQR').onclick = () => toggle(XMAS_CONF.qrKey, 'QR Code');
})();