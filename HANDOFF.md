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
| Campanella "tutte" | `ai-tutto` | Badge: `ai-b-tutto` — apre inbox con tutte le voci |
| Microfono globale | `ai-mic` | Classe `ascolta` = sta registrando |

Le 5 icone categoria (`ai-cat-cliente`, `ai-cat-nota`, `ai-cat-sposta`, `ai-cat-costo`, `ai-cat-paga`) sono state rimosse dalla barra — le categorie si vedono come tab dentro l'inbox. I badge per categoria (`ai-b-cliente` ecc.) sono ancora aggiornati da `aggiornaBadge()` ma gli elementi non esistono più nel DOM (il null check in `aggiornaBadge` li ignora silenziosamente).

---

## Struttura inbox AI (`#ai-inbox`)

```html
<div class="foglio-sfondo" id="ai-inbox" hidden>
  <div class="foglio">
    <header>
      <button id="ai-inbox-chiudi">×</button>
      <h2 id="ai-inbox-titolo">Notifiche</h2>
      <div class="inbox-header-azioni">
        <button id="ai-inbox-add">   ← icona +, visibile solo per cliente/nota/costo
        <button id="ai-inbox-edit">  ← matita, attiva edit mode
        <button id="ai-inbox-mic">   ← mic specifico per la scheda
      </div>
    </header>
    <div class="f-corpo gutter" id="ai-inbox-lista"></div>
    <footer id="ai-inbox-footer" hidden></footer>  ← sempre nascosto (il + è in alto)
  </div>
</div>
```

**Icona + (`#ai-inbox-add`):**
- Visibile solo per schede `cliente`, `nota`, `costo` (nascosta per `riprogramma`, `paga`, `tutto`)
- `cliente` → `apriFoglio()` con `_ritornaInboxKey = 'cliente'` (X sul foglio torna all'inbox)
- `nota` → `aggiungiItemSimulato()`
- `costo` → placeholder (da implementare)

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

**ATTENZIONE — bug risolto:** il `JSON.stringify(item)` nell'attributo `onclick` delle card usava `replace(/"/g, '&quot;')` per evitare che le virgolette spezzassero l'HTML. Se aggiungi nuovi tipi di card, usa sempre questo pattern:
```js
`onclick="funzione(this.closest('.inbox-card'), ${JSON.stringify(item).replace(/"/g, '&quot;')})"`
```

---

## Card inbox: comportamento per categoria

Ogni card è generata da `inbox_cardHtml(item, cat)` + `inboxCampiHtml(item, cat)`.

| Categoria | Click "Modifica" | Comportamento |
|---|---|---|
| `cliente` | `apriModificaInboxCliente(card, item)` | Apre il foglio completo pre-compilato |
| `riprogramma` | `apriRiprogrammaInbox(card, item)` | Apre popup calendario `#ripr-pop` |
| `nota` | Espande panel inline | Textarea auto-espansa |
| `costo` | Espande panel inline | Stepper ± importo, toggle Personale/Cliente |
| `paga` | Espande panel inline | Stepper ± importo (solo + e −, senza frecce browser), ricerca cliente |

**Nuovi clienti (`cliente`) sono sempre sospesi:** la voce viene creata con bordo arancione + "Manca: giorno" perché l'AI vocale non fornisce mai un giorno per i nuovi clienti. L'utente deve aprire il foglio e completarlo. I campi essenziali sono **nome + indirizzo + giorno** — tutti e tre devono essere presenti.

**Note (`nota`) — `confermaCarta` agisce in base ai campi:**
- `Giorno` presente → crea `lavoro` con `memo: true` nel calendario (nota evento, pallino blu)
- `Cliente` presente (senza Giorno) → aggiunge a `prendiExtra(cliente).note`
- Nessuno dei due → aggiunge a `noteRapide[]`
- Nota vuota → `avvisa(...)` e **non** rimuove la card (blocco early return)

**Riprogramma — due varianti di card:**
- Con data destinazione (`A` parsabile) → bottone **Conferma** (sposta subito)
- Senza data destinazione → bottone **📅 Pianifica** → apre `#ripr-pop`; nel popup cliccare un giorno **seleziona** (non conferma) e mostra `#ripr-conferma-row` con "Conferma [gg mese]"; `confRiprCalendario()` esegue lo spostamento

**Animazione card:** `animaCard(card, 'ok')` → slide destra verde + collassa. `animaCard(card, 'no')` → cade giù.

---

## Foglio "Nuovo cliente" (`#foglio`)

**Id importanti:**
- `f-titolo` — titolo del foglio
- `f-nome`, `f-dove`, `f-cosa`, `f-prezzo` (hidden input), `f-tel`, `f-note` — campi principali
- `f-prezzo-drum` — drum visivo del prezzo (separato dall'input hidden)
- `f-durata` — drum visivo della durata
- `f-tel-wrap` — contenitore righe telefono
- `f-piede` — footer del foglio (**ha id**, usalo con `$('f-piede')`)
- `f-salva`, `f-micro`, `f-errore` — bottone salva, mic, messaggio errore

**`modoFoglio`** — valori possibili:
- `'nuovo'` — form vuoto per creare un cliente
- `'modifica'` — form pre-compilato per modificare cliente esistente
- `'conferma-inbox'` — aperto da inbox "Modifica" card, footer personalizzato (← Indietro / ✓ Conferma)

**Attenzione:** in `modoFoglio === 'conferma-inbox'`, `f-salva` e `f-micro` **non esistono nel DOM** (il footer è stato sostituito con bottoni custom). `chiudiFoglio()` li ripristina automaticamente.

**_ritornaInboxKey** — variabile globale. Se impostata quando `chiudiFoglio()` viene chiamato (senza salvataggio), riapre l'inbox con quella key. Viene azzerata da `salva()` e `salvaModifica()`.

---

## Lavori con `memo: true`

```js
{ id:..., nome:'...', data:'AAAA-MM-GG', fatto: false, prezzo: null, dove:'', tipo: TIPI[0], durata: 0.5, cosa:'...', memo: true }
```

- Creati da `confermaCarta` per note inbox con un giorno → compaiono nel calendario come **promemoria** (pallino blu, badge "Promemoria")
- `durata: 0.5` → valore truthy che non attiva il fallback `|| 2`, ma è abbastanza piccolo da non pesare sulle ore
- **Esclusi da `mappaGiorni`** → non bloccano ore nei giorni migliori
- `prezzo: null` (non 0) → `cartaLavoro` non mostra "0,00 €"
- CSS: `.pallini i.memo { background: #3b82f6 }` / `.lavoro.memo { border-color: rgba(59,130,246,0.35); } .lavoro.memo .nome { color: #3b82f6 }`

---

## Popup calendario riprogramma (`#ripr-pop`)

```html
<div class="q-pop" id="ripr-pop" hidden>
  <div class="q-pop-box">
    <div class="q-pop-testa">
      <div class="ripr-info-row">
        <input type="text" id="ripr-nome" class="ripr-nome-input">  ← nome modificabile
        <span id="ripr-data-vec" class="ripr-data-vec"></span>       ← data vecchia a destra
      </div>
      <button id="ripr-chiudi">×</button>
    </div>
    ...calendario...
  </div>
</div>
```

`apriRiprogrammaInbox(card, item)` popola `ripr-nome` e `ripr-data-vec` dai campi `Cliente` e `Da`.

Ci sono **due** popup calendario distinti:

| id | Usato da | Quando |
|---|---|---|
| `#q-pop` | `apriCalFoglio()` | Foglio "Nuovo cliente" per scegliere il giorno |
| `#ripr-pop` | `apriRiprogrammaInbox()` | Inbox "Riprogramma" per scegliere nuovo giorno |

---

## AI vocale — come funziona

### Principio fondamentale
**L'AI fa una sola cosa: trasforma testo in dati strutturati.** Non tocca mai i dati dell'app.
Il flusso è sempre: voce → AI classifica+estrae → card nell'inbox → utente clicca Conferma → **il codice dell'app** esegue l'azione.

### Chiave Anthropic
```js
let ANTHROPIC_KEY = '';
try { ANTHROPIC_KEY = localStorage.getItem('anthropic_key') || ''; } catch(e){}
```
La chiave viene chiesta con `chiediChiaveAI()` la prima volta. Salvata in `localStorage`, non nel codice.

### Flusso mic → inbox
1. Web Speech API trascrive la voce (`sr.lang = 'it-IT'`)
2. `categorizzaVoceAI(testo)` chiama Claude Haiku 5.5 → restituisce `{categoria, titolo, dati, campi}`
3. Se la chiave manca o la chiamata fallisce → `categorizzaVoce(testo)` (fallback keyword locale)
4. `aggiungiVoceInbox(testo, risultato)` smista nella categoria giusta e chiama `aggiornaBadge()`

### Flusso Conferma → app
Quando l'utente clicca **✓ Conferma** su una card, `confermaCarta(card, item, cat)` fa l'azione reale:

| Categoria | Azione del codice |
|---|---|
| `paga` | `registraPagamento(nome, importo)` — se importo vuoto usa `conto(nome).dovuto` |
| `costo` | `spese.push(...)` con i dati estratti |
| `riprogramma` | Se la data è parsabile ("domani", "martedì"…) → `spostaLavoro()` direttamente. Altrimenti apre il popup calendario |
| `cliente` | Apre il foglio pre-compilato con nome+lavoro (l'utente conferma lì) |
| `nota-cliente` | ⚠️ **Non ancora implementato** — la nota non viene ancora salvata nella scheda cliente |
| altre | Rimuove la card dall'inbox e la mette nello storico |

**Dopo ogni Conferma o Scarta:** `rimuoviVoceInbox(cat, item, esito)` toglie la voce da `INBOX_ESEMPI`, la sposta in `STORICO_ESEMPI`, aggiorna il badge.

### Prompt AI ottimizzato (`categorizzaVoceAI`)
Il prompt è costruito dinamicamente a ogni chiamata con tre blocchi:

```
CONTESTO (costruito live)
  Clienti in rubrica: Villa Verdi, Sig. Rossi, ...   ← da CLIENTI_FAKE
  Lavori in agenda: Sig. Rossi · lun 20 nov · taglio prato / ...  ← lavori non fatti nei prossimi 30gg, max 25

REGOLE (8, in ordine di priorità)
  1. Cliente in rubrica + tipo di lavoro (con/senza data) → "cliente"
  2. Spostare/rimandare un lavoro in agenda → "riprogramma"
  3. Pagamento ricevuto → "paga"
  4. Spesa sostenuta → "costo"
  5. Cliente in rubrica + info/nota → "nota-cliente"
  6. Data/ora senza lavoro specifico → "calendario"
  7. Tutto il resto → "nota-rapida"

4 ESEMPI FEW-SHOT (casi ambigui)
  "domani Villa Verdi, potatura alberi" → cliente
  "sposta Sig. Rossi a giovedì" → riprogramma
  "Villa Verdi ha pagato" → paga, Importo: ""
  "Villa Verdi: cancello verde, codice 1847" → nota-cliente
```

Parametri API: modello `claude-haiku-5-5`, `max_tokens: 200`.

**Perché i lavori prossimi nel contesto:** senza, l'AI non sa che Marta Ferri ha un lavoro sabato, quindi "preferisce il martedì" finisce in nota-cliente invece di riprogramma.
**Perché NON passare importi dovuti:** il codice gestisce già il fallback con `conto(nome).dovuto` — l'AI non deve saperlo.

### Output AI
```json
{"categoria":"...","titolo":"max 5 parole","dati":"riga principale","campi":[["Etichetta","Valore"]]}
```
(Rimosso `nome_cliente`, era ridondante — il cliente è già nei `campi`.)

### Categorie e destinazione inbox
| Categoria AI | → Inbox |
|---|---|
| `cliente` | `cliente` |
| `riprogramma` | `riprogramma` |
| `paga` | `paga` |
| `costo` | `costo` |
| `calendario`, `nota-cliente`, `nota-rapida` | `nota` |

```js
const _CAT_TO_INBOX = {
  'calendario':'nota', 'nota-cliente':'nota', 'nota-rapida':'nota',
  'paga':'paga', 'costo':'costo', 'riprogramma':'riprogramma', 'cliente':'cliente'
};
```

### `aggiungiVoceInbox(testo, risultato)`
- `risultato` oggetto AI: `{categoria, titolo, dati, campi}` → usa titolo e campi AI
- `risultato` stringa legacy: categoria diretta → crea voce semplice con solo testo trascritto

---

## Form preventivi — struttura dati

### Proprietà `dot` sugli slider
Alcuni slider hanno `dot` per mostrare un pallino colorato accanto all'etichetta:
```js
{ id:'piant-pianta-eco', dot:'#f59e0b', label:'Pianta semplice', ... }
```
Reso in HTML con:
```js
${d.dot ? `<span class="prev-dot" style="background:${d.dot}"></span>` : ''}
```
CSS: `.prev-dot { width:10px; height:10px; border-radius:50%; display:inline-block; flex-shrink:0; }`

### Sezioni del form preventivi
- **Siepi** — aggiunto `siepe-smalto` (slider €0-150, smaltimento materiali)
- **Potature** — aggiunto `pot-smalto` (slider €0-200)
- **Abbattimento** — aggiunto `abb-smalto` (slider €0-500)
- **Piantumazione** — 4 slider separati con pallini colorati (arancione/viola/verde/rosso)
- **Irrigazione** — 2 slider con esempi specifici (100m² 4 zone / 500m²+ 12 zone)
- **Materiali** — aggiunto chip "Rincaro personalizzato (indica nelle note)"
- **Noleggio attrezzature** — nuova sezione con 4 slider (piccolo/medio/grande/pesante)

---

## Funzioni JS chiave

### Form cliente
| Funzione | Cosa fa |
|---|---|
| `apriFoglio(giorno?, perCliente?)` | Apre form nuovo cliente, resetta tutto inclusi i drum |
| `apriModifica(nome)` | Apre form modifica cliente esistente |
| `chiudiFoglio()` | Chiude foglio, ripristina footer se era in `conferma-inbox`, riapre inbox se `_ritornaInboxKey` è impostata |
| `salva()` | Salva nuovo cliente (azzera `_ritornaInboxKey` prima di chiudere) |
| `salvaModifica()` | Salva modifiche cliente (azzera `_ritornaInboxKey` prima di chiudere) |
| `preparaFoglio(modo)` | Reset base (titolo, visibilità f-lavoro/f-micro/f-salva). NON disegna i drum |
| `mostraFoglio()` | Rende visibile `#foglio` |
| `disegnaPrezzoDrum()` | Disegna il drum del prezzo da zero |
| `scorriPrezzoDrum()` | Scorre il drum sul valore attuale di `f-prezzo` |
| `disegnaDurata()` | Disegna il drum della durata |

**ATTENZIONE:** `preparaFoglio()` da sola non basta per pre-compilare il foglio — i drum restano vuoti. Occorre chiamare tutte le funzioni `disegna*` come fa `apriFoglio()`. Vedi `apriModificaInboxCliente` per l'esempio corretto.

### Inbox
| Funzione | Cosa fa |
|---|---|
| `apriInbox(key)` | Apre inbox con una categoria (`'cliente'`, `'nota'`, `'riprogramma'`, `'costo'`, `'paga'`, `'tutto'`) |
| `chiudiInbox()` | Chiude `#ai-inbox` |
| `aggiornaBadge()` | Ricalcola tutti i badge numerici da `INBOX_ESEMPI` |
| `animaCard(card, tipo)` | Anima e collassa la card (`'ok'` o `'no'`) |
| `rimuoviVoceInbox(cat, item, esito)` | Toglie voce da `INBOX_ESEMPI`, la sposta in `STORICO_ESEMPI`, aggiorna badge |
| `scartaCarta(card, item, cat)` | Handler bottone Scarta: chiama `rimuoviVoceInbox` + `animaCard` |
| `confermaCarta(card, item, cat)` | Handler bottone Conferma: esegue l'azione reale (pagamento, costo, sposta lavoro…) poi rimuove la voce |
| `parseDataRelativa(testo)` | Converte "domani"/"martedì"/ecc. in stringa ISO (`tra(N)`) |
| `inbox_cardHtml(item, cat)` | Genera HTML di una card |
| `inboxCampiHtml(item, cat)` | Genera HTML del pannello di modifica inline |
| `apriModificaInboxCliente(card, item)` | Apre foglio pre-compilato per confermare nuovo cliente |
| `indietroInboxCliente()` | Dal foglio, torna alla scheda "Nuovi clienti" |
| `confermaInboxCliente()` | Rimuove voce inbox, anima card ok, chiude foglio |
| `apriRiprogrammaInbox(card, item)` | Apre popup `#ripr-pop` con input nome e data vecchia |
| `disegnaRiprCalendario()` | Ridisegna griglia `#ripr-griglia`; click giorno = seleziona (inbox) o conferma (storico) |
| `confRiprCalendario()` | Esegue lo spostamento dopo che l'utente clicca "Conferma [giorno]" in `#ripr-pop` |
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
let _inboxItem        // item della card in attesa conferma cliente (per rimuoverla dopo)
let _inboxCat         // categoria della card in attesa conferma cliente
let _ritornaInboxKey  // se impostata, chiudiFoglio riapre l'inbox con questa key
let _riprogrammaCard         // card da animare dopo scelta data in ripr-pop
let _riprogrammaItem         // item della card riprogramma (per rimuoverla dopo scelta data)
let _riprogrammaMese         // Date() del mese corrente in ripr-pop
let _riprogrammaDataScelta   // ISO string del giorno selezionato (non ancora confermato) in ripr-pop

// Clienti fake per ricerca simulata (da sostituire con dati reali Dexie)
const CLIENTI_FAKE = ['Villa Verdi', 'Sig. Rossi', 'Marco Brambilla', 'Condominio Le Palme', 'Marta Ferri', 'Condominio Aurora']
```

---

## Temi grafici — lavoro in sospeso

### Stato attuale
Tre temi progettati come mockup HTML (artifact su claude.ai), approvati concettualmente:

| Tema | Artifact | Stato |
|---|---|---|
| **Default** (verde foresta attuale, rifinito) | https://claude.ai/artifact/UaWgUvui37oFjuHBSEt4Mz | Da implementare |
| **Acciaio** (dark #0D0D0D + teal neon, stile Linear) | https://claude.ai/artifact/DgASrYPsYkgpBt86n36pk6 | Approvato ✓ |
| **Carta** (editoriale serif, Moleskine digitale) | https://claude.ai/artifact/VXz2thdJUNKrPRog6GXoFZ | Da implementare |

### Cosa si deve fare
Implementare il selettore tema in `index.html` — **solo CSS, niente layout**.

**Regola fondamentale:** ogni tema cambia colori, font e stile visivo. **Non si toccano posizioni, layout, dimensioni, struttura HTML.** L'app deve funzionare identicamente in tutti i temi.

**Come implementare:**
1. Aggiungere una classe al `<body>` o su `:root` per il tema attivo (es. `data-tema="acciaio"`)
2. Ridefinire le variabili CSS esistenti dentro ogni blocco tema:
   ```css
   :root[data-tema="acciaio"] {
     --foglia: #00E5B0;
     --sfondo: #0D0D0D;
     /* ... etc */
   }
   ```
3. Per i temi con font diversi, caricare il font da Google Fonts e riassegnare la variabile font (se esiste) o aggiungere `font-family` override sul body dentro il blocco tema
4. Collegare la scelta alle Impostazioni > Aspetto > Tema (già esiste la voce con segmenti)

**Regole di design per ogni tema:**

**Default:** font invariato (Bricolage Grotesque + Manrope). Colori: sfondo `#F7F9F5`, testo `#1A1F1B`, accento `#2d6a3e`. Sistema 10 token semantici, tutto coerente — vedi artifact.

**Acciaio:** sfondo `#0D0D0D`, card `#161616`, accento neon `#00E5B0`. Font: Inter per testo, JetBrains Mono **solo per numeri/importi** (non per tutto il testo). Zero decorazioni.

**Carta:** sfondo `#FEFCF7` (panna), testo `#1C1C1A`. Font: Cormorant Garamond 700 per titoli/numeri grandi, Crimson Pro per body. **Nessun accento UI** — l'unico colore sono i dot dei clienti. Zero ombre, border-radius max 6px, separatori 1px invece di card.

---

## Prossimi passi (in ordine di priorità)

1. **`nota-cliente` → salva nella scheda cliente** — quando si conferma "Villa Verdi: codice cancello 1234", la nota deve finire nel campo note della scheda di Villa Verdi. `confermaCarta` per cat=`nota` con `Cliente` presente salva già in `prendiExtra(cliente).note`, ma la scheda cliente non mostra ancora queste note extra in modo prominente.
2. **Collegare pagamenti e costi ai lavori già segnati** — un pagamento nell'inbox deve essere legato a un lavoro esistente. Per ora la ricerca usa `CLIENTI_FAKE`, da sostituire con i dati reali di Dexie.
3. **Mic per scheda specifica** — se il mic dentro l'inbox "Note" registra, l'item va in Note; se è dentro "Costi", va in Costi. Ora va sempre nella categoria globale.
4. **Badge arancione "Paga ogni"** — quando arriva il mese indicato e il Condominio non ha pagato, compare un badge arancione nella scheda cliente.
5. **Scheda conti — grafica** — migliorare aspetto grafico (non bug critici).
6. **Preventivi AI** — box testo/voce → Claude genera stima usando i dati dei form preventivi (`prevDati`).
7. **Infrastruttura** (dopo beta) — server, account, abbonamento, sync.

**Già fatto:**
- ✅ AI vocale (Web Speech API + Claude Haiku 5.5, routing 8 categorie, localStorage key)
- ✅ Prompt ottimizzato: contesto live (lavori prossimi 30gg), 4 few-shot examples, max_tokens 200
- ✅ Conferma collega ai dati reali: registraPagamento, spese.push, spostaLavoro
- ✅ Pagamento senza importo → usa conto(nome).dovuto automaticamente
- ✅ Riprogramma con data parsabile → sposta direttamente senza popup
- ✅ Conferma/Scarta rimuove voce da inbox, aggiorna badge, sposta in storico
- ✅ Nuovi clienti inbox sempre sospesi (giorno mai fornito dall'AI vocale), campi mancanti evidenziati
- ✅ Note inbox: Giorno → nota evento (`memo: true` in lavori[], pallino blu), no data → noteRapide, nota vuota → avviso (non si rimuove)
- ✅ Riprogramma senza data destinazione → 📅 Pianifica + select+confirm nel popup calendario
- ✅ `pagaTutto` aggiorna la scheda immediatamente (rimosso setTimeout 700ms — era il bug)
- ✅ Agenda: giorno selezionato fuori range futuro va in fondo alla lista (non in cima)
- ✅ Foglio lavoro (report mode): bottoni Modifica ed Elimina con undo; stato pagamento parziale corretto
- ✅ Card inbox rimosse dal DOM dopo l'animazione (non solo nascoste a h:0)

---

## Regole di lavoro

- Spiegazioni in italiano semplice (il titolare non sa programmare)
- Build prima di ogni commit: `npm run build`
- Nessun push finché il titolare non lo chiede esplicitamente
- Dati solo sul telefono (IndexedDB via Dexie, no server in beta)
- Decisioni di prodotto estese: vedi `PRODOTTO.md`
- Decisioni AI vocale: vedi `PRODOTTO.md` sezione AI
