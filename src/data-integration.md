# Guida: collegare index.html al database reale

Questa guida spiega come sostituire i dati inventati (`CLIENTI_FAKE`, `INBOX_ESEMPI`)
con i dati veri salvati sul telefono, usando `src/db-vanilla.js`.

---

## Passo 1 — Caricare Dexie e db-vanilla.js

Aggiungi questi due script **prima** del tag `</body>` in `index.html`,
subito prima degli script esistenti:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/dexie/4.0.8/dexie.min.js"></script>
<script src="src/db-vanilla.js"></script>
```

---

## Passo 2 — Inizializzare il database all'avvio

All'inizio del blocco `<script>` principale (dove ora ci sono `CLIENTI_FAKE` e simili),
aggiungi una funzione di inizializzazione e chiamala subito:

```js
async function avviaApp() {
  await DB.inizia();
  await DB.chiediSpazioPermanente(); // chiede al telefono di non cancellare i dati

  // Carica i dati reali al posto dei fake
  await aggiornaVista();
}

avviaApp();
```

---

## Passo 3 — Sostituire CLIENTI_FAKE

**Prima (dati inventati):**
```js
const CLIENTI_FAKE = [
  { id: 'c1', nome: 'Mario Rossi', ... },
  ...
];
```

**Dopo (dati reali):**
```js
// Rimuovi l'array CLIENTI_FAKE.
// Usa sempre DB.caricaClienti() dove servono i clienti.

async function aggiornaVista() {
  const clienti = await DB.caricaClienti();
  const lavori  = await DB.caricaLavori();
  // ... aggiorna il DOM con i dati reali
}
```

**Dove index.html usa i clienti:**
- Nella lista debiti → sostituisci con `DB.caricaClienti()` + `DB.caricaLavori()`
- Nel selettore cliente del foglio → sostituisci con `DB.cercaCliente(testo)`
- Nel prompt AI vocale → sostituisci con `await DB.clientiPerVoice()`

---

## Passo 4 — Sostituire INBOX_ESEMPI

`INBOX_ESEMPI` contiene dati di test per l'inbox AI. Nella versione reale,
le voci dell'inbox vengono generate dall'AI vocale (non dal database diretto).

**L'inbox AI non va collegata al database:** le voci arrivano dall'AI e restano
in memoria fino alla conferma dell'utente. Solo quando l'utente clicca "Conferma"
si salvano i dati nel database.

**Cosa cambia:**
- Svuota le voci di `INBOX_ESEMPI` (o rimuovi l'oggetto) → l'inbox parte vuota
- Mantieni la struttura dell'oggetto per compatibilità con `aggiornaBadge()`

```js
// Svuota le voci ma mantieni le chiavi (aggiornaBadge le legge)
const INBOX_ESEMPI = {
  cliente:     { titolo: 'Nuovi clienti',  cat: 'cliente',     badge: 'ai-b-cliente', voci: [] },
  nota:        { titolo: 'Note',           cat: 'nota',        badge: 'ai-b-nota',    voci: [] },
  riprogramma: { titolo: 'Riprogramma',    cat: 'riprogramma', badge: 'ai-b-sposta',  voci: [] },
  costo:       { titolo: 'Costi',          cat: 'costo',       badge: 'ai-b-costo',   voci: [] },
  paga:        { titolo: 'Pagamenti',      cat: 'paga',        badge: 'ai-b-paga',    voci: [] },
};
```

---

## Passo 5 — Salvare le azioni dell'utente

Ogni volta che l'utente fa un'azione, chiama la funzione DB corrispondente.

| Azione utente | Funzione DB |
|---|---|
| Crea cliente (foglio) | `await DB.creaCliente(nome, tipo)` |
| Modifica cliente | `await DB.modificaCliente(id, { nome, telefono, ... })` |
| Elimina cliente | `await DB.eliminaCliente(id)` |
| Crea lavoro | `await DB.creaLavoro({ cliente_id, descrizione, importo, data })` |
| Segna lavoro "Fatto" | `await DB.segnaFatto(id)` |
| Registra pagamento | `await DB.registraPagamento(lavoro_id, importo, metodo)` |
| Elimina pagamento | `await DB.eliminaPagamento(id)` |
| Elimina lavoro | `await DB.eliminaLavoro(id)` |

**Dopo ogni azione**, richiama `aggiornaVista()` per ridisegnare il DOM.

---

## Passo 6 — Flusso completo di esempio

```js
// 1. Avvio
await DB.inizia();

// 2. Carica e mostra
const clienti = await DB.caricaClienti();
const lavori  = await DB.caricaLavori();
mostraDebiti(clienti, lavori); // funzione che ridisegna il DOM

// 3. Nuovo lavoro (clic sul bottone)
async function salvaLavoro() {
  const clienteId = /* id del cliente selezionato */;
  const descrizione = /* testo inserito */;
  const importo = /* centesimi, es. 5000 = 50€ */;
  const data = /* 'AAAA-MM-GG' */;

  await DB.creaLavoro({ cliente_id: clienteId, descrizione, importo, data });

  // Ricarica e ridisegna
  const clientiAggiornati = await DB.caricaClienti();
  const lavoriAggiornati  = await DB.caricaLavori();
  mostraDebiti(clientiAggiornati, lavoriAggiornati);
}

// 4. Pagamento (clic su "Pagato")
async function segnaComePagato(lavoro_id, importo, metodo) {
  await DB.registraPagamento(lavoro_id, importo, metodo);
  // ... ricarica e ridisegna
}
```

---

## Note importanti

- **Importi sempre in centesimi:** `5000` = 50 €. Per convertire da campo testo:
  `Math.round(parseFloat(testo.replace(',', '.')) * 100)`.
- **Date come stringa:** `'2025-06-15'`. Per la data di oggi: `new Date().toISOString().slice(0, 10)`.
- **`DB.inizia()` va chiamata una sola volta** all'avvio. Le chiamate successive non fanno nulla.
- **L'ordine degli script conta:** Dexie deve essere caricato prima di `db-vanilla.js`,
  e `db-vanilla.js` prima del resto del codice dell'app.
