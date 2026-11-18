# Guida: pubblicare l'app e installarla sul telefono

Si fa **una volta sola**. Dopo, ogni aggiornamento arriva da solo sul telefono.

> Nota: su GitHub va solo il **programma**, mai i dati dei clienti.
> I lavori e i clienti restano sempre e solo sul telefono di chi usa l'app.

---

## Parte 1 — Creare lo spazio su GitHub (5 minuti, lo fai tu)

1. Vai su **https://github.com** ed entra col tuo account.
2. In alto a destra tocca il **+** e poi **New repository**.
3. Compila così:
   - **Repository name:** `app-artigiani`
   - Scegli **Public**. La pubblicazione gratuita richiede che il codice sia pubblico.
     Il codice non contiene dati personali.
   - **Non** spuntare "Add a README", ".gitignore" o "license": lascia tutto vuoto.
4. Tocca **Create repository**.
5. Nella pagina che si apre c'è un indirizzo tipo
   `https://github.com/TUO-NOME/app-artigiani.git`. **Copialo e mandalo a Claude.**

## Parte 2 — Mandare il programma su GitHub (lo fa Claude)

Claude collega la cartella a GitHub e invia il programma.
La prima volta **si apre una finestra di GitHub** che ti chiede di accedere:
scegli **Sign in with your browser** e conferma. Serve solo la prima volta.

## Parte 3 — Accendere la pubblicazione (2 minuti, lo fai tu)

1. Su GitHub, nella pagina di `app-artigiani`, tocca **Settings** (in alto).
2. Nel menu a sinistra tocca **Pages**.
3. Alla voce **Source** scegli **GitHub Actions**.
4. Vai sulla scheda **Actions** (in alto): vedrai "Pubblica l'app" che lavora.
   Quando diventa verde (circa 2 minuti) l'app è online all'indirizzo:

   **`https://TUO-NOME.github.io/app-artigiani/`**

   Se è rimasta rossa perché la pubblicazione non era ancora accesa,
   tocca "Pubblica l'app" → **Run workflow**.

## Parte 4 — Installare l'app sul telefono di tuo fratello

1. Sul suo telefono apri **Chrome** e vai all'indirizzo qui sopra.
2. Tocca i **tre puntini ⋮** in alto a destra → **Installa app**
   (su alcuni telefoni si chiama **Aggiungi a schermata Home**).
3. Ora c'è l'icona verde **"Lavori"** tra le app: si usa da lì, come un'app normale.
   Funziona anche senza internet.

## Cose importanti da dirgli

- **Backup:** una volta a settimana, tasto **Backup** in alto nella Home →
  **Fai il backup** → mandarlo a sé stesso su WhatsApp. Se non lo fa da 7 giorni,
  l'app glielo ricorda.
- **Non cancellare i dati di Chrome** per questo sito: si perderebbero i lavori.
- **Dettatura:** nel campo "Cosa c'è da fare" basta toccare il **microfono della tastiera**.
- Se cambia telefono: installa l'app sul nuovo, poi **Backup → Ripristina da un backup**
  e sceglie l'ultimo file salvato.

## Come arrivano gli aggiornamenti

Quando Claude modifica l'app e la invia su GitHub, dopo un paio di minuti
la nuova versione è online. Sul telefono arriva da sola la volta dopo che
tuo fratello apre l'app (a volte serve chiuderla e riaprirla).
