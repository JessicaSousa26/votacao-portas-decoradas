// public/js/app.js
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const formUpload = document.getElementById('formUpload');
const galeria = document.getElementById('galeria');
const filtroAndar = document.getElementById('filtroAndar');
const limparFiltro = document.getElementById('limparFiltro');
const periodoAviso = document.getElementById('periodoAviso');

let currentUser = null;
let periodo = { inicio: null, fim: null, encerrado: false };

function fmt(d){ try { return new Date(d.seconds*1000).toLocaleString('pt-BR'); } catch(e){ return ''; } }

async function carregarPeriodo() {
  const docRef = db.collection('settings').doc('votacao');
  const snap = await docRef.get();
  if (snap.exists) {
    periodo = Object.assign({encerrado:false}, snap.data()); // {inicio, fim, encerrado?}
    const agora = firebase.firestore.Timestamp.now();
    if (periodo.encerrado === true) {
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `Votação encerrada em ${fmt(periodo.fim)}.`;
    } else if (agora < periodo.inicio) {
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `A votação ainda não começou. Início: ${fmt(periodo.inicio)}.`;
    } else if (agora > periodo.fim) {
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `Votação encerrada em ${fmt(periodo.fim)}.`;
    } else {
      periodoAviso?.classList.add('hidden');
    }
  } else {
    periodoAviso.textContent = 'Configure settings/votacao no Firestore (inicio/fim).';
  }
}

document.getElementById('loginBtnHero')?.addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
});

loginBtn?.addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
});

logoutBtn?.addEventListener('click', async () => {
  await auth.signOut();
});

auth.onAuthStateChanged(u => {
  currentUser = u;
  if (u) {
    if (userInfo) userInfo.textContent = u.displayName || u.email;
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = '';
  } else {
    if (userInfo) userInfo.textContent = '';
    if (loginBtn) loginBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
});

async function popularFiltroAndar() {
  const snap = await db.collection('fotos_natal').get();
  const andares = new Set();
  snap.forEach(d => andares.add(d.data().andar));
  if (filtroAndar) {
    filtroAndar.innerHTML = `<option value="">Todos</option>` + [...andares].filter(a=>a!=null).sort((a,b)=>a-b).map(a=>`<option>${a}</option>`).join('');
  }
}

async function carregarFotos() {
  if (!galeria) return;
  let ref = db.collection('fotos_natal');
  const andarEscolhido = filtroAndar?.value;
  if (andarEscolhido) ref = ref.where('andar', '==', Number(andarEscolhido));
  const snap = await ref.orderBy('dataEnvio', 'desc').get();

  galeria.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    const disabled = (periodo?.encerrado === true);
    galeria.innerHTML += `
      <article class="xmas-card rounded-2xl shadow p-3 flex flex-col gap-2 border border-emerald-100">
        <img src="${d.urlFoto}" class="w-full" style="aspect-ratio:16/9;object-fit:cover;border-radius:12px;border:1px solid #e5e7eb" alt="Foto do ${d.andar}º andar, apto ${d.apartamento}"/>
        <div class="flex items-center justify-between" style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
          <div>
            <div class="font-semibold">${d.andar ?? '-'}º andar — Apto ${d.apartamento ?? '-'}</div>
            <div class="text-sm" style="color:#475569"><span id="votos_${doc.id}">${d.votos||0}</span> voto(s)</div>
          </div>
          <button class="px-3 py-1.5" style="padding:8px 12px;border-radius:10px;background:#0f766e;color:#fff;border:none;"
            ${disabled ? 'disabled' : ''}
            onclick="votar('${doc.id}')">Votar</button>
        </div>
      </article>
    `;
  });
}

window.votar = async (fotoId) => {
  if (!currentUser) { alert('Entre com Google para votar.'); return; }
  try {
    await db.runTransaction(async (tx) => {
      const fotoRef = db.collection('fotos_natal').doc(fotoId);
      const voterRef = fotoRef.collection('voters').doc(currentUser.uid);
      const [fotoSnap, voterSnap, cfgSnap] = await Promise.all([tx.get(fotoRef), tx.get(voterRef), tx.get(db.collection('settings').doc('votacao'))]);
      if (!fotoSnap.exists) throw new Error('Foto não encontrada');
      if (!cfgSnap.exists) throw new Error('Configuração de votação ausente');
      const { inicio, fim, encerrado } = cfgSnap.data();
      const agora = firebase.firestore.Timestamp.now();
      if (encerrado === true) throw new Error('A votação já foi encerrada.');
      if (agora < inicio) throw new Error('A votação ainda não começou.');
      if (agora > fim) throw new Error('A votação já encerrou.');
      if (voterSnap.exists) throw new Error('Você já votou nesta foto.');
      tx.set(voterRef, { uid: currentUser.uid, votedAt: agora });
      const votosAtuais = fotoSnap.data().votos || 0;
      tx.update(fotoRef, { votos: votosAtuais + 1 });
    });
    const span = document.getElementById(`votos_${fotoId}`);
    if (span) span.textContent = Number(span.textContent) + 1;
  } catch (e) {
    alert(e.message);
  }
};

formUpload?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) { alert('Entre com Google para enviar foto.'); return; }
  const andar = Number(document.getElementById('andar').value);
  const apartamento = document.getElementById('apartamento').value.trim();
  const file = document.getElementById('foto').files[0];
  const msg = document.getElementById('msg');
  if (!file) return;

  try {
    if (msg) msg.textContent = 'Enviando…';
    const path = `natal/${andar}Apto${apartamento}/${Date.now()}_${file.name}`;
    const snap = await storage.ref().child(path).put(file, { cacheControl: 'public,max-age=31536000' });
    const url = await snap.ref.getDownloadURL();
    await db.collection('fotos_natal').add({
      andar, apartamento, urlFoto: url, votos: 0,
      uploadPor: currentUser.uid,
      dataEnvio: firebase.firestore.Timestamp.now()
    });
    if (msg) msg.textContent = 'Foto enviada com sucesso! 🎉';

    const toast = document.getElementById('toastNatal');
    if (toast) {
      toast.textContent = '🎁 Foto enviada! Boa sorte na votação! ✨';
      toast.classList.add('show');
      setTimeout(()=> toast.classList.remove('show'), 3500);
    }

    formUpload.reset();
    await popularFiltroAndar();
    await carregarFotos();
  } catch (err) {
    console.error(err);
    if (msg) msg.textContent = 'Falha ao enviar. Verifique permissões do Storage/Firestore.';
  }
});

limparFiltro?.addEventListener('click', () => {
  if (filtroAndar) filtroAndar.value = '';
  carregarFotos();
});

(async () => {
  await carregarPeriodo();
  await popularFiltroAndar();
  await carregarFotos();
})();
