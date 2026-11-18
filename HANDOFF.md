# Handoff — app-artigiani

Leggi questo file all'inizio di ogni nuova sessione **prima di toccare codice**.

---

## Regola numero 1

**Tocca solo `index.html`.** È l'unico file della prova grafica. Non toccare `src/`, `prima-versione/`, né altri file a meno che il titolare non lo chieda esplicitamente.

---

## Cos'è l'app

PWA Android per un giardiniere (artigiano che lavora da solo).
Un unico file: `index.html` — prova grafica approvata, dati inventati, si azzera a ogni apertura.
Stack: HTML + CSS + JS vanilla (Vite 6 solo per build/PWA). Database futuro: Dexie (IndexedDB).
La versione app vera è in `src/` + `prima-versione/` (bocciata, resta online). Non servono.

---

## Struttura dello schermo principale

```
┌──────────────────────────────┐
│  Calendario settimana        │  ← giorno selezionato evidenziato
│  Agenda (lavori del giorno)  │  ← lista lavori, giorni liberi, 2 mesi avanti
│  Barra AI                    │  ← 5 icone categoria + campanella "tutte"
│  Bottone microfono           │  ← grande, in fondo
└──────────────────────────────┘
```

**Barra AI — id degli elementi:**
| Element | id | Ruolo |
|---|---|---|
| Icona nuovi clienti | `ai-cat-cliente` | Badge: `ai-b-cliente` |
| Icona note | `ai-cat-nota` | Badge: `ai-b-nota` |
| Icona riprogramma | `ai-cat-sposta` | Badge: `ai-b-sposta` |
| Icona costi | `ai-cat-costo` | Badge: `ai-b-costo` |
| Icona pagamenti | `ai-cat-paga` | Badge: `ai-b-paga` |
| Campanella "tutte" | `ai-tutto` | Badge: `ai-b-tutto` |
| Microfono globale | `ai-mic` | Classe `ascolta` = sta registrando |

---

## Struttura inbox AI (`#ai-inbox`)

```html
<div class="foglio-sfondo" id="ai-inbox" hidden>
  <div class="foglio">
    <header>
      <button id="ai-inbox-chiudi">×</button>
      <h2 id="ai-inbox-titolo">Notifiche</h2>
      <div class="inbox-header-azioni">
        <button id="ai-inbox-edit">  ← matita, attiva edit mode
        <button id="ai-inbox-mic">   ← mic specifico per la scheda
      </div>
    </header>
    <div class="f-corpo gutter" id="ai-inbox-lista"></div>  ← qui va l'HTML delle card
    <footer id="ai-inbox-footer" hidden>  ← visibile solo nella scheda "cliente"
      <button id="ai-inbox-nuovo">+ Nuovo cliente</button>
    </footer>
  </div>
</div>
```

**Edit mode:** `#ai-inbox-lista.classList.toggle('edit-mode')` → mostra il bottone "Modifica ›" su ogni card.

---

## Dati inbox: `INBOX_ESEMPI`

```js
const INBOX_ESEMPI = {
  cliente:     { titolo: 'Nuovi clienti',  cat: 'cliente',     badge: 'ai-b-cliente', voci: [...] },
  nota:        { titolo: 'Note',           cat: 'nota',        badge: 'ai-b-nota',    voci: [...] },
  riprogramma: { titolo: 'Riprogramma',    cat: 'riprogramma', badge: 'ai-b-sposta',  voci: [...] },
  costo:       { titolo: 'Costi',          cat: 'costo',       badge: 'ai-b-costo',   voci: [...] },
  paga:        { titolo: 'Pagamenti',      cat: 'paga',        badge: 'ai-b-paga',    voci: [...] },
};
```

Ogni voce in `voci[]` ha: `{ testa, dati, campi: [[label, valore], ...] }`.
Le voci riprogramma hanno anche `cal: true`.

**Badge:** `aggiornaBadge()` — rilegge `INBOX_ESEMPI` e aggiorna tutti i badge numerici.

---

## Card inbox: comportamento per categoria

Ogni card è generata da `inbox_cardHtml(item, cat)` + `inboxCampiHtml(item, cat)`.

| Categoria | Click "Modifica" | Comportamento |
|---|---|---|
| `cliente` | `apriModificaInboxCliente(card, item)` | Apre il foglio completo pre-compilato |
| `riprogramma` | `apriRiprogrammaInbox(card, item)` | Apre popup calendario `#ripr-pop` |
| `nota` | Espande panel inline | Textarea auto-espansa |
| `costo` | Espande panel inline | Stepper ± importo, toggle Personale/Cliente |
| `paga` | Espande panel inline | Stepper ± importo, ricerca cliente |

**Animazione card:** `animaCard(card, 'ok')` → slide destra verde + collassa. `animaCard(card, 'no')` → cade giù.

---

## Foglio "Nuovo cliente" (`#foglio`)

**Id importanti:**
- `f-titolo` — titolo del foglio (es. "Nuovo cliente" / "Modifica cliente" / "Conferma nuovo cliente")
- `f-nome`, `f-dove`, `f-cosa`, `f-prezzo`, `f-tel`, `f-note` — campi principali
- `f-tel-wrap` — contenitore righe telefono
- `f-piede` — footer del foglio (**ha id**, usalo con `$('f-piede')`)
- `f-salva`, `f-micro`, `f-errore` — bottone salva, mic, messaggio errore

**`modoFoglio`** — valori possibili:
- `'nuovo'` — form vuoto per creare un cliente
- `'modifica'` — form pre-compilato per modificare cliente esistente
- `'conferma-inbox'` — aperto da inbox, footer personalizzato (← Indietro / ✓ Conferma)

**Attenzione:** in `modoFoglio === 'conferma-inbox'`, `f-salva` e `f-micro` **non esistono nel DOM** (il footer è stato sostituito con bottoni custom). `chiudiFoglio()` li ripristina automaticamente.

---

## Popup calendario

Ci sono **due** popup calendario distinti:

| id | Usato da | Quando |
|---|---|---|
| `#q-pop` | `apriCalFoglio()` | Foglio "Nuovo cliente" per scegliere il giorno |
| `#ripr-pop` | `apriRiprogrammaInbox()` | Inbox "Riprogramma" per scegliere nuovo giorno |

`#ripr-pop` ha: `ripr-info` (testo cliente+data), `ripr-mese`, `ripr-anno`, `ripr-prima`, `ripr-dopo`, `ripr-griglia`, `ripr-chiudi`.

---

## Funzioni JS chiave

### Form cliente
| Funzione | Cosa fa |
|---|---|
| `apriFoglio(giorno?, perCliente?)` | Apre form nuovo cliente, resetta tutto |
| `apriModifica(nome)` | Apre form modifica cliente esistente |
| `chiudiFoglio()` | Chiude foglio, ripristina footer se era in `conferma-inbox` |
| `salva()` | Salva nuovo cliente |
| `salvaModifica()` | Salva modifiche cliente esistente |
| `preparaFoglio(modo)` | Reset interno prima di aprire il foglio |
| `mostraFoglio()` | Rende visibile `#foglio` |

### Inbox
| Funzione | Cosa fa |
|---|---|
| `apriInbox(key)` | Apre inbox con una categoria (`'cliente'`, `'nota'`, `'riprogramma'`, `'costo'`, `'paga'`, `'tutto'`) |
| `chiudiInbox()` | Chiude `#ai-inbox` |
| `aggiornaBadge()` | Ricalcola tutti i badge numerici da `INBOX_ESEMPI` |
| `animaCard(card, tipo)` | Anima e collassa la card (`'ok'` o `'no'`) |
| `inbox_cardHtml(item, cat)` | Genera HTML di una card |
| `inboxCampiHtml(item, cat)` | Genera HTML del pannello di modifica inline |
| `apriModificaInboxCliente(card, item)` | Apre foglio pre-compilato per confermare nuovo cliente |
| `indietroInboxCliente()` | Dal foglio, torna alla scheda "Nuovi clienti" |
| `confermaInboxCliente()` | Anima card ok, chiude foglio |
| `apriRiprogrammaInbox(card, item)` | Apre popup `#ripr-pop` con info cliente e data |
| `disegnaRiprCalendario()` | Ridisegna griglia `#ripr-griglia` |
| `aggiungiItemSimulato()` | Aggiunge item fake all'inbox Note (simulazione mic) |
| `stepperCambia(btn, delta)` | Incrementa/decrementa valore stepper ±1 |
| `cercaClienteInbox(input)` | Filtra `CLIENTI_FAKE` mentre si digita |
| `tipoCostoScegli(btn, tipo)` | Alterna Personale / Di un cliente in costi |

### Calendario e altri
| Funzione | Cosa fa |
|---|---|
| `apriCalFoglio()` | Apre `#q-pop` (calendario per il foglio) |
| `chiudiCalFoglio()` | Chiude `#q-pop` |
| `disegnaCalFoglio()` | Ridisegna `#q-pop` |
| `apriCalRipeti()` | Apre `#q-pop` per scegliere data "personalizzato" in Si ripete |
| `prendiExtra(nome)` | Legge/crea dati extra cliente |
| `disegnaDurata()` | Disegna drum durata |
| `disegnaSemestrale()` | Disegna griglia mesi "Paga ogni" |
| `disegnaRipeti()` | Disegna opzioni ripetizione |

---

## Variabili di stato principali

```js
// Foglio nuovo cliente
let tipo, durata, colore, ripeti, ora, semestrale, mesiSemestrale, quando, quandoFisso
let clienteScelto, modoFoglio, nomeInModifica
// Defaults in apriFoglio: mesiSemestrale = [], semestrale = false, ripeti = 'no'

// Inbox
let _inboxCard        // card da animare dopo confermaInboxCliente()
let _riprogrammaCard  // card da animare dopo scelta data in ripr-pop
let _riprogrammaMese  // Date() del mese corrente in ripr-pop

// Clienti fake per ricerca simulata
const CLIENTI_FAKE = ['Villa Verdi', 'Sig. Rossi', 'Marco Brambilla', 'Condominio Le Palme', 'Marta Ferri', 'Condominio Aurora']
```

---

## Prossimi passi (in ordine di priorità)

1. **Collegare pagamenti e costi ai lavori già segnati** — un pagamento nell'inbox deve essere legato a un lavoro esistente; i costi "Di un cliente" pure. Per ora la ricerca usa `CLIENTI_FAKE`, da sostituire con i dati reali di Dexie.
2. **Mic per scheda specifica** — se il mic dentro l'inbox "Note" registra, l'item simulato va in Note; se è dentro "Costi", va in Costi. Ora va sempre in Note.
3. **Badge arancione "Paga ogni"** — quando arriva il mese indicato e il Condominio non ha pagato, compare un badge arancione nella scheda cliente. Nessun giorno specifico, basta il mese. Va implementato con il sistema notifiche.
4. **AI vocale reale** — Web Speech API per trascrizione + Haiku per interpretare → inbox da confermare. Vedi `PRODOTTO.md` per le decisioni di architettura complete.
5. **Infrastruttura** (dopo beta) — server, account, abbonamento, sync.

---

## Regole di lavoro

- Spiegazioni in italiano semplice (il titolare non sa programmare)
- Build prima di ogni commit: `npm run build`
- Nessun push finché il titolare non lo chiede esplicitamente
- Dati solo sul telefono (IndexedDB via Dexie, no server in beta)
- Decisioni di prodotto estese: vedi `PRODOTTO.md`
- Decisioni AI vocale: vedi `PRODOTTO.md` sezione AI
