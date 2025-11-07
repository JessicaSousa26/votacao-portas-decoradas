// public/js/app.js (SDK modular)
import {
  auth, db, storage, provider,
  onAuthStateChanged, signInWithPopup, signOut,
  collection, getDocs, getDoc, doc, addDoc,
  query, where, orderBy, serverTimestamp, runTransaction,
  ref, uploadBytes, getDownloadURL
} from "./firebase.js";

const loginBtn = document.getElementById('loginBtn');
const loginBtnHero = document.getElementById('loginBtnHero');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const formUpload = document.getElementById('formUpload');
const galeria = document.getElementById('galeria');
const filtroAndar = document.getElementById('filtroAndar');
const limparFiltro = document.getElementById('limparFiltro');
const periodoAviso = document.getElementById('periodoAviso');

let currentUser = null;
let periodo = { inicio: null, fim: null, encerrado: false };

function fmt(ts){
  try { return ts?.toDate?.().toLocaleString('pt-BR') ?? ''; } catch(_) { return ''; }
}

async function carregarPeriodo() {
  const cfgRef = doc(db, 'settings', 'votacao');
  const snap = await getDoc(cfgRef);
  if (snap.exists()) {
    const data = snap.data();
    periodo = { encerrado: false, ...data };
    const agora = new Date();
    if (periodo.encerrado === true) {
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `Votação encerrada em ${fmt(periodo.fim)}.`;
    } else if (periodo.inicio?.toDate && agora < periodo.inicio.toDate()) {
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `A votação ainda não começou. Início: ${fmt(periodo.inicio)}.`;
    } else if (periodo.fim?.toDate && agora > periodo.fim.toDate()) {
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `Votação encerrada em ${fmt(periodo.fim)}.`;
    } else {
      periodoAviso?.classList.add('hidden');
    }
  } else {
    periodoAviso.textContent = 'Configure settings/votacao no Firestore (inicio/fim).';
  }
}

// ===== LOGIN / LOGOUT =====
async function doLogin() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert('Falha ao autenticar com Google: ' + (e.message || e.code));
    console.error(e);
  }
}
loginBtn?.addEventListener('click', doLogin);
loginBtnHero?.addEventListener('click', doLogin);

logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (u) => {
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

// ===== FILTRO =====
async function popularFiltroAndar() {
  const snap = await getDocs(collection(db, 'fotos_natal'));
  const andares = new Set();
  snap.forEach(d => andares.add(d.data().andar));
  if (filtroAndar) {
    filtroAndar.innerHTML =
      `<option value="">Todos</option>` +
      [...andares].filter(a => a != null).sort((a,b)=>a-b).map(a=>`<option>${a}</option>`).join('');
  }
}

async function carregarFotos() {
  if (!galeria) return;
  let base = collection(db, 'fotos_natal');
  const andarEscolhido = filtroAndar?.value;
  let snap;
  if (andarEscolhido) {
    snap = await getDocs(query(base, where('andar', '==', Number(andarEscolhido)), orderBy('dataEnvio', 'desc')));
  } else {
    snap = await getDocs(query(base, orderBy('dataEnvio', 'desc')));
  }

  galeria.innerHTML = '';
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const disabled = (periodo?.encerrado === true);
    galeria.innerHTML += `
      <article class="xmas-card rounded-2xl shadow p-3 flex flex-col gap-2 border border-emerald-100">
        <img src="${d.urlFoto}" class="w-full" style="aspect-ratio:16/9;object-fit:cover;border-radius:12px;border:1px solid #e5e7eb" alt="Foto do ${d.andar ?? '-'}º andar, apto ${d.apartamento ?? '-'}"/>
        <div class="flex items-center justify-between" style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
          <div>
            <div class="font-semibold">${d.andar ?? '-'}º andar — Apto ${d.apartamento ?? '-'}</div>
            <div class="text-sm" style="color:#475569">
              <span id="votos_${docSnap.id}">${d.votos||0}</span> voto(s)
            </div>
          </div>
          <button class="px-3 py-1.5" style="padding:8px 12px;border-radius:10px;background:#0f766e;color:#fff;border:none;"
            ${disabled ? 'disabled' : ''}
            onclick="votar('${docSnap.id}')">Votar</button>
        </div>
      </article>
    `;
  });
}

window.votar = async (fotoId) => {
  if (!currentUser) { alert('Entre com Google para votar.'); return; }
  try {
    await runTransaction(db, async (tx) => {
      const fotoRef = doc(db, 'fotos_natal', fotoId);
      const voterRef = doc(db, 'fotos_natal', fotoId, 'voters', currentUser.uid);
      const [fotoSnap, voterSnap, cfgSnap] = await Promise.all([
        tx.get(fotoRef),
        tx.get(voterRef),
        tx.get(doc(db, 'settings', 'votacao'))
      ]);
      if (!fotoSnap.exists()) throw new Error('Foto não encontrada');
      if (!cfgSnap.exists()) throw new Error('Configuração de votação ausente');

      const { inicio, fim, encerrado } = cfgSnap.data();
      const agora = new Date();
      if (encerrado === true) throw new Error('A votação já foi encerrada.');
      if (inicio?.toDate && agora < inicio.toDate()) throw new Error('A votação ainda não começou.');
      if (fim?.toDate && agora > fim.toDate()) throw new Error('A votação já encerrou.');

      if (voterSnap.exists()) throw new Error('Você já votou nesta foto.');
      tx.set(voterRef, { uid: currentUser.uid, votedAt: serverTimestamp() });
      const votosAtuais = fotoSnap.data().votos || 0;
      tx.update(fotoRef, { votos: votosAtuais + 1 });
    });

    const span = document.getElementById(`votos_${fotoId}`);
    if (span) span.textContent = Number(span.textContent) + 1;
  } catch (e) {
    alert(e.message);
    console.error(e);
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
    const storageRef = ref(storage, path);
    const snap = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snap.ref);

    await addDoc(collection(db, 'fotos_natal'), {
      andar, apartamento, urlFoto: url, votos: 0,
      uploadPor: currentUser.uid, dataEnvio: serverTimestamp()
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
