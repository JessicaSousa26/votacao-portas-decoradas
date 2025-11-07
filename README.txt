# Votação Natalina — Pacote Completo (Vercel + Firebase)

Inclui:
- public/index.html (hero, QR code, upload/galeria, rodapé com sininhos e efeitos)
- public/ranking.html (admin + PDF)
- public/js/firebase.js (compat com sua config)
- public/js/app.js (upload, votação, filtros)
- public/assets/ (hero-natal.jpg, rodape-natal.jpg, qrcode.png, sininhos.mp3)
- rules/firestore.rules (com admin: jhessymary26@gmail.com)
- rules/storage.rules (uploads autenticados em natal/)
- vercel.json (deploy estático)

## Firebase
1. Cole `rules/firestore.rules` em Firestore → Regras → **Publicar**.
2. Cole `rules/storage.rules` em Storage → Regras → **Publicar**.
3. Em Firestore, crie:
   - `settings/admins` (opcional para listar e-mails, mas as regras já usam seu e-mail)
   - `settings/votacao` com { inicio: Timestamp, fim: Timestamp, encerrado: false }
4. Authentication → Google → **Habilitar** e adicione seu domínio Vercel em **Domínios autorizados**.

## Deploy Vercel
- Conecte o repositório ou suba a pasta `public/` (projeto estático).
- O `vercel.json` já está preparado.
