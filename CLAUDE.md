# App artigiani — Regole del progetto

App Android (web app installabile, PWA) per un artigiano che lavora da solo.
Primo utente: un giardiniere. La specifica è in `SPEC.md`.

## Regole di lavoro

1. **Spiegazioni in italiano semplice.** Chi segue il progetto non sa programmare:
   frasi brevi, niente gergo non necessario.
2. **Più veloce del foglio di carta.** Testo e tasti grandi, pochi colori,
   massimo 3 tocchi per le azioni principali. Tutta l'interfaccia è in italiano.
3. **Dati solo sul telefono** (IndexedDB tramite Dexie). Nessun server nella beta.
   Ogni record ha `owner_id` (per ora fisso: `locale`).
4. **Tutto modificabile nel tempo**: cliente, descrizione, prezzo, data, pagamenti.
5. **Salvare con git prima di procedere**, solo con codice che si costruisce
   (`npm run build`) e test che passano (`npm test`).

## Struttura

- `src/logica.ts` — tipi dei dati e calcoli (chi deve quanto, stati). Testato in `logica.test.ts`.
- `src/db.ts` — lettura e scrittura dei dati sul telefono.
- `src/backup.ts` — esportazione JSON/CSV e ripristino.
- `src/ui.tsx` — pezzi comuni (navigazione, scelta cliente, foglio "Pagato").
- `src/schermate/` — una schermata per file.
- Importi sempre in **centesimi** (numeri interi). Date come testo `AAAA-MM-GG`.
