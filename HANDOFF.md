# Handoff — app-artigiani

Leggi questo file all'inizio di ogni nuova sessione **prima di toccare codice**.

---

## Regola numero 1

**Tocca solo `index.html`.** È l'unico file della prova grafica. Non toccare `src/`, `prima-versione/`, né altri file a meno che il titolare non lo chieda esplicitamente.

---

## Cos'è l'app

PWA Android per un giardiniere (artigiano che lavora da solo).
Un unico file: `index.html`. **Dal 21/11: niente dati di esempio, l'app parte vuota e salva tutto sul telefono con Dexie** (lavori, pagamenti, clienti, inbox, storico, spese, note, zona, cronometro). Impostazioni → "Ricomincia da zero" cancella tutto (tiene solo la chiave AI).
Stack: HTML + CSS + JS vanilla (Vite 6 solo per build/PWA). Pubblicazione: push su `main` → GitHub Actions → GitHub Pages (alessandro8800.github.io/app-artigiani). Sul telefono: "Aggiorna app" + controllare "Versione del…" nella barra rossa.
La versione app vera è in `src/` + `prima-versione/` (bocciata, resta online). Non servono.

**⚠️ Trappola:** `const $ = id => …` è definita a metà dello script (~riga 2300). Codice che gira al caricamento **prima** di quella riga non può usare `$` (né `soglie`, `NOTIFICHE`, altre `const` definite dopo): blocca tutta l'app. Lì usare `document.getElementById`, oppure metterlo dentro una funzione chiamata dopo.

---

## Struttura dello schermo principale

```
┌──────────────────────────────┐
│  Calendario settimana        │  ← giorno selezionato evidenziato
│  Agenda (lavori del giorno)  │  ← lista lavori, giorni liberi, 2 mesi avanti
│  Barra AI                    │  ← SOLO "Parla" + campanella (21/11)
└──────────────────────────────┘
```
In testata, accanto alla data: icona **Avvisi** (`av-btn`, `apriAvvisi`) e **Note rapide** (`nr-btn`). In cima (`#avvisi-home`): barretta del cronometro e banner "Inizia da qui".

**Barra AI — id degli elementi:**
| Element | id | Ruolo |
|---|---|---|
| Campanella | `ai-tutto` | Badge: `ai-b-tutto` — apre l'inbox "tutto" (`apriInbox('tutto')`) |
| Microfono globale | `ai-mic` | `avviaMicrofono('globale')`; classe `ascolta` = sta registrando |

Le 5 icone categoria e la X sono state tolte (21/11). I badge per categoria (`ai-b-cliente` ecc.) non esistono più nel DOM: `aggiornaBadge()` li ignora.

---

## Struttura inbox AI (`#ai-inbox`)

```html
<div class="foglio-sfondo" id="ai-inbox" hidden>
  <div class="foglio">
    <header>
      <button id="ai-inbox-chiudi">×</button>
      <h2 id="ai-inbox-titolo">Notifiche</h2>
      <div class="inbox-header-azioni">
        <button id="ai-inbox-add">   ← icona +: cliente/nota/costo e anche "tutto" (lì chiede la categoria)
        <button id="ai-inbox-edit">  ← matita, attiva edit mode
        <button id="ai-inbox-mic">   ← mic, sempre visibile (anche in "tutto"): passa dall'AI
      </div>
    </header>
    <div class="f-corpo gutter" id="ai-inbox-lista"></div>
    <footer id="ai-inbox-footer" hidden></footer>  ← sempre nascosto (il + è in alto)
  </div>
</div>
```

**Icona + (`#ai-inbox-add`)** — definita in `INBOX_AGGIUNGI` (21/11):
- `cliente` → `apriFoglio()` con `_ritornaInboxKey = 'cliente'` (X sul foglio torna all'inbox)
- `nota` → nota vuota con il testo da scrivere già aperto (`aggiungiVoceVuota`; prima era la finta "Simulazione AI")
- `costo` → spesa vuota con il pannello aperto
- `tutto` → popup `#scegli-pop` "Cosa vuoi aggiungere?" → una delle tre sopra
- nascosta per `riprogramma` e `paga`

**Calendario "sposta" (`#ripr-pop`):** il nome del cliente è solo da leggere (`<strong id="ripr-nome">`); lo spostamento usa sempre il `Cliente` della card (cambiarlo faceva perdere il lavoro).

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

**_ritornaInboxKey** — variabile globale. Se impostata quando `chiudiFoglio()` viene chiamato, riapre l'inbox con quella key. Viene azzerata da `salvaModifica()` e da `chiudiFoglio()` stesso dopo averla usata. `salva()` non la azzera più — così il ritorno all'inbox funziona anche dopo un salvataggio riuscito.

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

## AI vocale — stato attuale (da riscrivere)

> ⚠️ **Sezione storica: descrive il codice com'era prima del 21/11/2026.**
> Gli step 1–5 della sezione "AI — Prossima implementazione" sono fatti: vedi lì "Come è stato fatto".

### Principio fondamentale
**L'AI fa una sola cosa: trasforma testo in dati strutturati.** Non tocca mai i dati dell'app.
Il flusso è sempre: voce → AI classifica+estrae → card nell'inbox → utente clicca Conferma → **il codice dell'app** esegue l'azione.

### Chiave Anthropic
```js
let ANTHROPIC_KEY = '';
try { ANTHROPIC_KEY = localStorage.getItem('anthropic_key') || ''; } catch(e){}
```
La chiave viene chiesta con `chiediChiaveAI()` la prima volta. Salvata in `localStorage`, non nel codice.

### Flusso attuale mic → inbox
1. Web Speech API trascrive la voce (`sr.lang = 'it-IT'`)
2. `categorizzaVoceAI(testo)` chiama Claude Haiku 5.5 → restituisce `{tipo, nome, indirizzo, lavoro, ...}` (singola operazione)
3. Se la chiave manca o la chiamata fallisce → `categorizzaVoce(testo)` (fallback keyword locale)
4. `aggiungiVoceInbox(testo, risultato)` smista nella categoria giusta e chiama `aggiornaBadge()`

### I 4 microfoni attuali (con comportamenti diversi — da unificare)

| id elemento | Funzione | Comportamento attuale |
|---|---|---|
| `ai-mic` | Mic globale (barra in alto) | SpeechRecognition + AI + 4s countdown + Annulla |
| `ai-inbox-mic` | Mic dentro inbox | SpeechRecognition ma **senza AI** — salva direttamente dopo 1.2s |
| `c-btn-mic` | Mic pagina Clienti | SpeechRecognition + AI + 1.2s delay (senza countdown) |
| `f-micro` | Mic foglio nuovo cliente | **Simulazione** — scrive una frase finta, usa `leggiFrase()` (non è real AI) |

**Problema principale:** `ai-inbox-mic` non passa per l'AI, gli altri sì → bug: registri dalla tab Pagamenti ma il mic non categorizza.

### Schema JSON attuale (`categorizzaVoceAI`)
Un solo oggetto, non un array:
```json
{"tipo":"lavoro|nota|costo|sposta|pagamento","nome":"...","indirizzo":"...","lavoro":"...","testo":"...","data":"...","ora":"...","prezzo":null,"ore":null,"importo":null}
```
Limite: non gestisce frasi con più operazioni ("domani Villa Verdi, Rossi mi ha pagato 50").

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

---

## AI — Prossima implementazione

### Decisioni di prodotto (non cambiare senza accordo)

1. **Multi-operazione obbligatoria** — "domani da Mario, Rossi mi ha pagato 200, venerdì i guanti" deve produrre 3 card distinte. Schema: `{"operations": [...]}`.

2. **Approccio conservativo** — se l'AI è incerta, **non inventare**. Meglio una nota di testo che un dato sbagliato. L'errore peggiore è salvare un appuntamento o un pagamento errato.

3. **Pagamenti: sempre da verificare** — qualsiasi menzione di soldi (`pagato`, `mi ha dato`, `deve`, `acconto`...) → `tipo: pagamento, stato: da_verificare`. L'utente conferma sempre se è ricevuto o ancora da ricevere. Zero automazione sui pagamenti.

4. **`missing_fields` al posto del confidence score** — l'AI elenca i campi mancanti: `["data", "nome"]`. Il codice decide se mostrare la card come sospesa. I numeri tipo "confidence: 0.96" non hanno senso per un LLM.

5. **Contesto gestionale: solo dopo i test reali** — nella prima versione NON passare clienti/agenda all'AI. Prima si verifica che il motore funzioni. Poi (step 6, dopo test reali) si aggiunge: lista compatta nomi clienti (50-100 token max) + prossimi 7-10 lavori (nome + data + lavoro, una riga ciascuno).

6. **Fallback degradato obbligatorio** — se AI fallisce (rete assente, errore 500, JSON malformato, timeout) → salva il testo trascritto come nota grezza + mostra avviso "Salvato come nota, controlla". Non perdere mai la trascrizione.

7. **Feedback "Elaboro..." visibile** — durante la chiamata API, l'utente vede l'animazione. Già esiste, va mantenuta nel nuovo codice.

8. **No JSON Schema enforcement** — `anthropic-dangerous-direct-browser-access` nel browser non supporta beta features. Usare `JSON.parse` con regex di estrazione come ora.

9. **No backend proxy per ora** — la chiave in `localStorage` va bene per la beta personale. Il proxy si fa prima di dare l'app ad altri utenti, non ora.

10. **I 20 casi test** (in `src/test-ai-v2.mjs`) sono per test **manuali** (`node src/test-ai-v2.mjs`), non automatici. I risultati dell'AI non sono deterministici — non usarli come unit test.

---

### Schema JSON definitivo delle operazioni

```json
{
  "operations": [
    {
      "tipo": "cliente|nota|costo|riprogramma|pagamento",
      "nome": "nome cliente o null",
      "lavoro": "tipo di lavoro da fare o null",
      "data": "testo naturale italiano (domani, giovedì, 25 novembre...) o null",
      "importo": 150,
      "testo": "testo completo per le note, o null",
      "missing_fields": ["data", "nome"]
    }
  ]
}
```

**Regole per tipo:**

| tipo | Campi obbligatori | Campi opzionali | Destinazione |
|---|---|---|---|
| `cliente` | `nome`, `lavoro` | `data`, `importo` | `INBOX_ESEMPI.cliente` (il foglio si apre solo toccando la card) |
| `nota` | `testo` | `data` | `noteRapide[]` (con data se presente) |
| `costo` | `importo` o `testo` | `nome` (cliente di cui è la spesa) | `INBOX_ESEMPI.costo` |
| `riprogramma` | `nome` | `data` (nuova data) | `INBOX_ESEMPI.riprogramma` |
| `pagamento` | `nome` | `importo` | `INBOX_ESEMPI.paga` sempre con `stato: da_verificare` |

Se `missing_fields` non è vuoto → la card appare come "sospesa" (bordo arancione, "Manca: data, nome").
Se l'AI non riesce a classificare → `tipo: "nota"`, `testo: frase originale`, `missing_fields: []`.

---

### I 4 livelli di separazione da implementare

```
Livello 1 — TRASCRIZIONE
  Web Speech API → testo finale in italiano
  (già funziona, non cambia)

Livello 2 — AI
  categorizzaVoceAI(testo) → {operations: [...]}
  Modello: claude-haiku-5-5, max_tokens: 600
  Fallback se errore: [{tipo:"nota", testo:trascrizione, missing_fields:[]}]

Livello 3 — VALIDAZIONE
  Per ogni operation: controlla missing_fields
  Se missing_fields non vuoto → card sospesa (bordo arancione)
  Se pagamento → forza stato: da_verificare

Livello 4 — ESECUZIONE
  aggiungiVoceInbox(testo, {operations}) → cicla su operations
  Chiama aggiornaBadge() una sola volta alla fine
```

---

### Microfoni: cosa cambia

**Regola dopo la riscrittura:** tutti e 3 i mic reali usano lo stesso pipeline AI.
Il `f-micro` (foglio) resta una simulazione separata — non fa parte di questo lavoro.

**Funzione unificata da creare:**
```js
function avviaMicrofono(sorgente) {
  // sorgente: 'globale' | 'inbox' | 'clienti'
  // 1. Resetta stato
  // 2. Avvia SpeechRecognition (stesso codice per tutti e 3)
  // 3. Su interim: keyword feedback (solo per 'globale')
  // 4. Su finale: mostra "Elaboro..." → chiama categorizzaVoceAI → countdown 4s + Annulla
  // 5. Se AI fallisce: fallback nota grezza
  // 6. Gestisce quale bottone riceve .ascolta
}
```

**Differenze per sorgente:**
- `globale` (`ai-mic`): interim keyword feedback, countdown 4s
- `inbox` (`ai-inbox-mic`): nessun interim, countdown 4s, categoria iniziale = `_inboxCatCorrente`
- `clienti` (`c-btn-mic`): nessun interim, countdown 4s

**Differenza attuale da correggere:** `ai-inbox-mic` saltava l'AI → dopo la riscrittura usa l'AI come gli altri.

---

### `parsaDataOra` — cosa aggiungere

Funzione attuale (riga 5996): gestisce oggi, domani, dopodomani, giorni della settimana (prossima occorrenza).

**Manca:**
- `"prossimo lunedì"` / `"prossima settimana"` → già funziona per i giorni (prende sempre il prossimo), ma "prossima settimana" come parola non è gestita → aggiungere: se contiene "prossima settimana", saltare la settimana in corso
- `"25 novembre"`, `"3 dicembre"` → date assolute → aggiungere il pattern `/(\d{1,2})\s+(gennaio|febbraio|...|dicembre)/i`
- `"tra 3 giorni"`, `"fra una settimana"` → non urgente, ma utile

**Non cambiare:** il resto della funzione funziona bene.

---

### Scaletta implementazione — passo per passo

**Step 1 — Schema e prompt (solo `categorizzaVoceAI`)**
- File: `index.html`, righe 4113–4169
- Sostituire il prompt attuale con il nuovo che restituisce `{operations: [...]}`
- Aggiungere i few-shot examples per multi-operazione
- Aumentare `max_tokens` da 400 a 600 (array di operazioni è più lungo)
- Aggiungere il try/catch con fallback: se JSON non parsabile → `{operations:[{tipo:"nota",testo:testo,missing_fields:[]}]}`
- **Non aggiungere ancora** il contesto clienti/agenda (quello è step 6)

**Step 2 — `aggiungiVoceInbox` gestisce array**
- File: `index.html`, righe 4242–4344
- Aggiungere il controllo: se `risultato.operations` esiste → cicla
- Per ogni operation: routing come ora (ma basato su `operation.tipo`)
- Pagamenti: sempre `stato: da_verificare` nell'item dell'inbox (aggiungere campo alla card)
- `missing_fields` non vuoto → la card usa il template "sospeso" (bordo arancione, "Manca: X")
- Fallback degradato: se risultato è `null` o manca → salva nota grezza, `avvisa("Salvato come nota")`
- Chiamare `aggiornaBadge()` una sola volta alla fine del ciclo, non dentro ogni branch
- Mantenere compatibilità col vecchio formato `{tipo: "lavoro"|"pagamento"|...}` (c'è codice che lo usa ancora)

**Step 3 — Unifica i 3 microfoni**
- File: `index.html`
- Creare `function avviaMicrofono(sorgente)` con il codice SpeechRecognition condiviso
- Sostituire i 3 onclick (`ai-mic`, `ai-inbox-mic`, `c-btn-mic`) con `avviaMicrofono('globale'|'inbox'|'clienti')`
- Tutti e 3 chiamano `categorizzaVoceAI` → non più salvataggio diretto da `ai-inbox-mic`
- `chiudiMicBox()` già funziona per tutti e 3, non cambia
- **Non toccare** `f-micro` / `ascolta()` — è la simulazione del foglio, sistema separato

**Step 4 — `parsaDataOra` date assolute**
- File: `index.html`, righe 5996–6032
- Aggiungere dopo il blocco "dopodomani":
  ```js
  // Date assolute: "25 novembre", "3 dicembre"
  const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const mData = basso.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i);
  if (mData) {
    const giorno = parseInt(mData[1]);
    const mese = MESI.indexOf(mData[2].toLowerCase());
    if (mese >= 0) {
      const d = new Date(adesso.getFullYear(), mese, giorno);
      if (d < adesso) d.setFullYear(d.getFullYear() + 1); // se già passata, anno prossimo
      data = iso(d);
    }
  }
  ```
- Aggiungere "prossima settimana":
  ```js
  if (basso.includes('prossima settimana') || basso.includes('la prossima settimana')) {
    const d = new Date(adesso);
    d.setDate(d.getDate() + 7);
    data = iso(d);
  }
  ```

**Step 5 — Build e test manuale**
- `npm run build` — verifica che si costruisce senza errori
- Aprire il browser dev, aprire la console
- Testare le frasi della lista in `src/test-ai-v2.mjs` a mano (copy-paste nel mic)
- Verificare che frasi multi-operazione producono più card

**Step 6 — Contesto gestionale (SOLO dopo test reali)**
- Costruire la lista clienti da `lavori[]` (nomi unici)
- Costruire i prossimi 7 lavori da `lavori.filter(l => !l.fatto && l.data >= oggi).slice(0,7)`
- Iniettare nel prompt come testo compatto (max 100 token)
- Ricalcolare se il prompt è ancora sotto 2000 token totali

**Step 7 — Backend proxy (PRIMA di dare l'app ad altri)**
- Non fare ora. La chiave in localStorage va bene per l'uso personale.
- Quando arriverà: server Node/Deno che fa da proxy all'API Anthropic, la chiave non esce mai dal server.

---

### Già fatto (AI vocale)
- ✅ AI vocale (Web Speech API + Claude Haiku 5.5, routing categorie, localStorage key)
- ✅ Fallback keyword locale (`categorizzaVoce`)
- ✅ Conferma collega ai dati reali: registraPagamento, spese.push, spostaLavoro
- ✅ Pagamento senza importo → usa conto(nome).dovuto automaticamente
- ✅ Riprogramma con data parsabile → sposta direttamente senza popup
- ✅ Conferma/Scarta rimuove voce da inbox, aggiorna badge, sposta in storico
- ✅ Nuovi clienti inbox sempre sospesi (giorno mai fornito dall'AI vocale)
- ✅ Note inbox: Giorno → nota evento (memo: true), no data → noteRapide

### Da fare (AI vocale)
- ✅ **Step 1** (21/11): nuovo prompt multi-operazione → `{operations: [...]}`
- ✅ **Step 2** (21/11): `aggiungiVoceInbox` cicla su array, pagamenti `da_verificare`, fallback nota grezza
- ✅ **Step 3** (21/11): unifica 3 mic in `avviaMicrofono(sorgente)`
- ✅ **Step 4** (21/11): `parsaDataOra` date assolute ("25 novembre"), "prossima settimana", "tra 3 giorni"
- ✅ **Step 5** (21/11): build ok + 54 frasi del test (53 come attese, l'unica diversa — "mi deve ancora 200" → pagamento — segue la regola 3) + 4 frasi multi-operazione tutte giuste. Microfoni provati nel browser con voce simulata. **Manca la prova col microfono vero sul telefono.**
- ✅ **Step 6** (21/11): contesto clienti+agenda nel prompt — `contestoAI()`: data di oggi, fino a 60 nomi di clienti, prossimi 10 lavori (giorno per esteso + nome + lavoro). Regole: un solo cliente corrispondente → nome esatto della rubrica ("Rossi" → "Mario Rossi", "girasole" → "Girasoli"); più clienti → nome come detto; "quello di giovedì" → il cliente se quel giorno c'è un solo lavoro. App vuota → niente contesto. Prova: 8/8 casi con rubrica finta, 54/54 + 4/4 del test senza rubrica. Da dichiarare nel foglio privacy: nomi clienti e agenda vanno all'AI insieme alla frase.
- ⬜ **Step 7** (prima di produzione): backend proxy chiave API

### Come è stato fatto (step 1–5) — cose da sapere
- **Funzioni nuove:** `validaOperazione(op, testo)` (livello 3: il codice ricalcola i campi mancanti, normalizza il tipo, forza `stato: 'da_verificare'` sui pagamenti), `_operazioneInItem` + `_aggiungiOperazioni` (livello 4), `avviaMicrofono(sorgente)`, `etichettaRisultato(ris)` (testo del riquadro mic, es. "3 operazioni: 👤 💶 📝").
- **Bug trovato e corretto:** Haiku a volte risponde con un blocco `thinking` vuoto prima del testo. Il vecchio codice leggeva solo `content[0]` → in quei casi finiva sempre nel fallback a parole chiave senza che nessuno se ne accorgesse. Ora legge tutti i blocchi di tipo `text`.
- **Decisione del titolare (21/11): dopo il microfono non si apre MAI niente da solo.** Ogni operazione (anche una sola, anche un nuovo lavoro o uno spostamento) diventa una card nell'inbox. L'utente parla e torna a lavorare; conferma dopo con calma. Il foglio cliente e il popup calendario si aprono solo se l'utente tocca la card.
- **Nota con un nome cliente** → card nell'inbox Note (alla conferma va nella scheda cliente). Nota senza nome → direttamente in `noteRapide` (come prima).
- **Pagamenti dalla voce:** il bottone dice "✓ Ricevuto". Se manca il cliente o la cifra, il primo tocco apre il pannello (con il dovuto già scritto) invece di registrare: serve un secondo tocco dopo aver controllato.
- **Card con `item.mancanti`** (dai `missing_fields`) → bordo arancione + "Manca: …" anche per paga/costo/riprogramma. Il cliente usa ancora il suo controllo (nome, via, giorno).
- **Solo per `tipo: cliente`** lo schema ha 3 campi in più: `indirizzo` (→ casella Indirizzo del foglio), `ora` (`"mattina"` | `"pomeriggio"` | null — il foglio non ha un'ora precisa: "alle 9" → mattina, "alle 15" → pomeriggio, vedi `fasciaOra()`), `ore` (durata in ore → drum Durata). Altri dettagli (telefono, "mezza giornata"…) restano in `testo` → campo Note del foglio.
- La durata detta a voce cambia solo quel lavoro (prima sovrascriveva anche `durataSolita`). **`durata` è in ORE** (come `DURATE`): il vecchio codice la moltiplicava per 60 → "Scegli ancora 15 giorni nel Quando" e il lavoro non si salvava.
- `confermaInboxCliente()` toglie la card dall'inbox solo se `salva()` ha davvero aggiunto il lavoro.
- "✓ Conferma" diretto su una card cliente completa usa il giorno detto (non più il primo giorno libero), più ora, durata e note.
- Nota con un giorno (anche senza cliente) → card nell'inbox Note → alla conferma diventa promemoria (`memo: true`) nel calendario, col titolo = la frase. Nota senza giorno e senza cliente → direttamente in `noteRapide`.
- **Chiave AI:** mai più `prompt()`. Popup `#chiave-pop` (`apriChiaveAI(sorgente, motivo)`): si apre quando si preme un microfono senza chiave, e dopo "Salva e parla" il microfono parte subito. Se l'AI risponde 401/403 la chiave viene tolta e il popup si riapre. In Impostazioni → I tuoi dati → "Chiave assistente vocale" si mette, cambia o toglie. Gli errori dicono il motivo (`motivoErroreAI`).
- Banner "Inizia da qui": X per chiuderlo (`inizioChiuso`, salvato in Dexie); resta in Impostazioni → Per iniziare.
- **(21/11) App senza esempi:** `INBOX_ESEMPI`, `STORICO_ESEMPI`, `spese`, `daSistemare` partono vuoti; `CLIENTI_FAKE` tolto → `nomiClienti()` (clienti veri). I promemoria (`memo`) non contano come clienti.
- **Salvati in Dexie anche:** voci dell'inbox (`inbox`), `storico`, `spese`, `daSistemare`. `aggiornaBadge()` chiama `dbSalva()`.
- **Impostazioni → "Ricomincia da zero"** (`ricominciaDaZero()`): cancella il database Dexie, cache e service worker, localStorage (tranne `anthropic_key`) e ricarica.
- Bug grafico corretto: l'etichetta Mattina/Pomeriggio nella lista lavori usava la classe `.ora-pill` del foglio (posizione assoluta, enorme). Ora è `.ora-etichetta`.
- **(21/11 sera)** `max_tokens` 2000 e timeout 30 s (il blocco "thinking" consumava lo spazio → JSON tagliato → tutto in nota). Se la risposta è tagliata si recuperano le operazioni complete. La nota di emergenza ha titolo "Da controllare (motivo)".
- `tipoDaNome(nome)`: "Condominio…" → Condominio, "fabbrica/azienda/ditta/srl/spa/capannone…" → Fabbrica (foglio e conferma diretta).
- Spesa detta "per <cliente>" → alla conferma diventa una voce in `l.costi.voci` del lavoro di quel cliente più vicino a oggi (prezzo/costi/utile si aggiornano). Senza lavori → `spese` generali.
- Pagamento: la casella Cliente, toccata, mostra chi ti deve soldi adesso (con la cifra); scegliendolo si scrive anche l'importo.
- Badge Riprogramma: l'id giusto è `ai-b-riprogramma` (era `ai-b-sposta`, inesistente).
- Lavoro senza giorno per un cliente con un lavoro futuro → card "➕ Aggiungi a <giorno>" (somma cosa/prezzo/durata a quel lavoro, `aggiungiALavoroInbox`) oppure "Nuovo lavoro". Cliente già noto: la via si prende dai suoi dati.
- Riquadro microfono: al massimo una barra del conto alla rovescia (prima si accumulavano).
- **(21/11) Barra AI semplificata:** solo **Parla + campanella**. La campanella apre l'inbox "tutte" (dentro ci sono le schede per categoria). Le 5 icone espandibili e la X sono state tolte.
- **(21/11) Icona Avvisi** (triangolo, accanto alle note rapide in testata): cose che l'app nota da sola, diverse dalla campanella (cose dette a voce da confermare). `calcolaAvvisi()`: cronometro dimenticato acceso, lavori rimasti in sospeso (`rimastiIndietro`), lavori fatti senza prezzo, clienti che non pagano oltre le soglie arancione/rosso di Impostazioni (rispetta il toggle Notifiche → "Pagamenti in ritardo"). Icona grigia/arancione/rossa + numero; ogni avviso si tocca per sistemarlo e sparisce da solo. "Indietro" tolto dalla pagina Clienti (ora sta negli Avvisi).
- **Impostazioni → Il mio lavoro → "La tua zona"**: paese cercato a mano (Nominatim, `cercaZona`) o dal GPS (`zonaDaPosizione`, reverse geocoding). `impostaZona()` aggiorna `zonaMeteo` + `zonaScelta`, salvati in Dexie (`zona`). La zona serve a: meteo, suggerimenti vie (box ~80 km), e "Apri in Maps" (`indirizzoCompleto`: "via Roma 12" → "via Roma 12, Conegliano"; se il paese c'è già non tocca). Il bottone posizione del meteo è stato tolto (la zona si cambia in un posto solo).
- **Fallback:** AI in errore, risposta illeggibile o oltre 15 secondi → nota grezza + avviso "Salvato come nota, controlla". Senza chiave (e se l'utente non la inserisce) resta il riconoscimento a parole chiave; dal mic dell'inbox va nella scheda aperta.
- I numeri di riga citati sopra negli step sono cambiati.
- **(22/11) Il "+" di "Tutte le notifiche"** apre la scelta: Nuovo lavoro, Nota, Spesa, Pagamento, Sposta lavoro. Pagamento e Sposta lavoro sono **grigi** se nessuno deve soldi / non ci sono lavori. Nota, Spesa e Pagamento sono **schede a parte** (`#nn-pop`, `#ns-pop`, `#np-pop`), non card: la X torna a "tutte" senza lasciare card vuote. Con l'inbox vuota in cima c'è una card "+ Aggiungi".
  - **Nota:** in alto "A un cliente" (di partenza; va in fondo alla scheda cliente come "22 nov: testo", senza titolo) **oppure** "A un giorno" (promemoria `memo` con titolo + testo). Sempre una sola delle due. "+ Nota" della scheda giorno apre questa scheda su quel giorno.
  - **Spesa:** "Dell'attività" (→ `spese`, pagina Conti) o "Di un cliente" (→ `l.costi.voci` del suo lavoro più vicino). "👷 Lavoratore" = ore × €/ora (voce `Personale`).
  - **Liste clienti** (`cercaClienteNota`): 3 nomi + "Mostra tutti", con un segno grigio (lavoro in arrivo / deve X € / ultimo lavoro). Con `data-solo="debitori"` (pagamenti): solo chi deve, prima chi deve da più tempo.
- **(22/11) Cifre in euro — regola per tutta l'app:** di partenza una **casella** (la tastiera si apre SOLO toccandola, mai da sola), sotto **cifre pronte** da toccare (tutto/metà del debito, ultimo prezzo del cliente, prezzo solito per quel lavoro, ultima cifra di quella spesa: `CIFRE_PRONTE`), e un'**icona** accanto alla scritta che apre la **rotella** (tieni premuto: passi da 5 €, poi 1 €, poi 0,10 €). Un solo componente: `htmlRotella()` + `creaRotella()` / `montaRotelle()`; la cifra sta nella casella nascosta `.rot-valore` (con l'id che leggono le altre funzioni). Niente più − e +. Un campo nuovo con una cifra va fatto così.
- **(22/11) Dietro ogni finestra aperta lo sfondo si sfoca** (`backdrop-filter` su `.q-pop`, `.foglio-sfondo` ecc.).
- **Prove nel browser:** `localhost:5173` e `127.0.0.1:5173` hanno dati separati. Il titolare prova l'app in uno dei due: le prove (e i reset) vanno fatte **sull'altro**, mai nella sua scheda.

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
| `salva()` | Salva nuovo cliente; NON azzera `_ritornaInboxKey` — chiudiFoglio() la gestisce |
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
2. **Collegare pagamenti ai lavori già segnati** — un pagamento nell'inbox deve essere legato a un lavoro esistente. (21/11: i **costi** detti a voce vanno già nel lavoro del cliente; `CLIENTI_FAKE` è stato tolto, si usano i clienti veri. Manca il legame pagamento → lavoro.)
3. ✅ **Mic per scheda specifica** — fatto (21/11): i 3 microfoni passano tutti dall'AI, che smista nella categoria giusta.
4. **Badge arancione "Paga ogni"** — quando arriva il mese indicato e il Condominio non ha pagato, compare un badge arancione nella scheda cliente.
5. **Scheda conti — grafica** — migliorare aspetto grafico (non bug critici).
6. **Preventivi AI** — box testo/voce → Claude genera stima usando i dati dei form preventivi (`prevDati`).
7. **Infrastruttura** (dopo beta) — server, account, abbonamento, sync.
8. ✅ **Cronometro lavori a voce** — fatto (21/11). Decisioni del titolare: (a) avviene SUBITO, non passa dall'inbox; (b) "ho finito" = ore vere + Fatto (con Annulla), "stacco" = solo ore, il lavoro continua; (c) pause sì ("pausa"/"riprendo"); (d) dimenticato acceso: dopo 10 ore dall'ULTIMO ACCESSO all'app, o aprendo l'app un altro giorno → card in alto sopra il calendario "a che ora hai finito?" (ora proposta = ultimo uso dell'app quel giorno). Notifica vera ad app chiusa NON possibile senza server (Step 7).
   Codice: tipo AI `tempo` con `azione` inizio|pausa|riprendo|stacco|fine; `eseguiTempo`, `avviaCronometro`, `pausaCronometro`, `riprendiCronometro`, `fermaCronometro`, `controllaCronometro`, `htmlCronometro` (barretta in `#avvisi-home`). Stato `cronometro` salvato in Dexie. Ore al quarto d'ora in `l.cronoOre` → `l.oreVere` (le usa la pagina Conti); più giorni si sommano. Lavoro: quello di oggi del cliente; se è in un altro giorno viene portato a oggi; se non c'è viene creato. Un cronometro alla volta (partirne un altro fa "stacco" sul primo).
9. **Idea futura (21/11): clienti da WhatsApp** — WhatsApp non lascia leggere i suoi contatti alle altre app; la rubrica del telefono (già in "Per iniziare") copre quasi tutti. Per chi ti ha scritto su WhatsApp ma non è in rubrica: in WhatsApp apri il contatto → "Condividi" → scegli l'app → diventa un cliente (nome + numero). Si fa con il "share target" della PWA nel manifest (riceve il file contatto .vcf). Funziona solo con l'app installata, non dal browser. Da progettare insieme prima di scrivere codice.
10. **"Salva" sopra la tastiera in tutte le schede** (21/11) — prova fatta solo sul foglio "Nuovo cliente" (`adattaFoglioTastiera`, classe `con-tastiera`, usa `visualViewport`): con la tastiera aperta il foglio si accorcia e il piede con Salva resta subito sopra i tasti, mentre i campi scorrono. Da provare sul telefono, poi estendere a modifica cliente, conferme, pagamenti, ecc. In più si possono aggiungere: tasto "Fatto/Avanti" della tastiera (`enterkeyhint`) e una ✓ piccola in alto a destra. Deciso: NON spostare tutti i bottoni in alto (pollice, abitudine, tocchi sbagliati).
11. **Testo "Privacy" da correggere** (21/11) — in Impostazioni dice "L'app non manda i tuoi dati a nessuno: niente server", ma le frasi dette al microfono vanno all'AI di Anthropic (e i nomi dei paesi/vie cercati a OpenStreetMap). Da riscrivere insieme prima di dare l'app ad altri.
12. **Raggio della zona** (21/11, da decidere) — scelta 10/30/50/80 km sotto "La tua zona" per i suggerimenti delle vie (ora fisso ~80 km). Più città: sconsigliato (non si sa a quale appartiene "via Roma 12").
13. **Via detta a voce salvata già con il paese** (21/11, idea) — se un lavoro arriva senza paese, cercare la via nella zona e salvarla completa ("via Roma 12, Susegana"); se la via c'è in più paesi del raggio, chiederlo nella card.
14. **Provare sul telefono vero la pressione lunga della rotella** (22/11) — i livelli 5 € → 1 € → 0,10 € sono stati provati solo con tocchi simulati nel browser.
15. **Rotella della durata (ore)** (22/11, da decidere) — ha ancora la casella "scrivi" dentro la rotella; le cifre in euro no. Proposto di renderla uguale alle altre, il titolare non ha ancora risposto.
16. **Cifre lasciate apposta senza la nuova casella** (22/11) — righe dei costi dentro un lavoro (Terra 30 €…), ore ed €/ora del Personale, numeri delle Impostazioni, debiti di prima nell'importazione. Erano eccezioni (liste di righe piccole / non sono importi); da rivedere solo se il titolare lo chiede.

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

## Conti v2 — Scaletta completa (22/11)

**Obiettivo:** trasformare la scheda Conti da lista grezza a cruscotto professionale, degno del Play Store. Niente export, tutto dentro l'app. Grafico SVG inline (zero dipendenze, funziona offline).

Ogni step si completa, si testa e si committa prima di passare al successivo.

---

### Step 1 — Modello dati: spese ricorrenti

Aggiungere la struttura `speseRicorrenti[]` allo stato dell'app e salvarla in Dexie.

**Struttura di ogni voce:**
```js
{
  id: String,          // nanoid()
  nome: String,        // es. "Assicurazione furgone"
  importo: Number,     // es. 480
  frequenza: 'mensile' | 'trimestrale' | 'annuale',
  prossima: 'YYYY-MM-DD',  // prossima scadenza
  categoria: String    // es. "Mezzi", "Ufficio", "Personale"
}
```

**Da fare:**
1. Dichiarare `const speseRicorrenti = []` vicino alle altre variabili di stato
2. Aggiungere `'speseRicorrenti'` alla `bulkGet` in `carica()` (chiave 15)
3. Salvare `JSON.stringify(speseRicorrenti)` in `dbSalva()` insieme agli altri
4. Funzione `nuovaRicorrente({nome, importo, frequenza, prossima, categoria})` → push + salva
5. Funzione `avanzaRicorrente(id)` → calcola la prossima data in base alla frequenza e aggiorna
6. Funzione `eliminaRicorrente(id)` → splice + salva

**Calcolo prossima data:**
- mensile: +1 mese
- trimestrale: +3 mesi
- annuale: +1 anno
Usare `Date` puro, niente librerie.

---

### Step 2 — Avvisi ricorrenti in `calcolaAvvisi()`

Integrare le scadenze ricorrenti nel sistema avvisi esistente (già usato per pagamenti in ritardo).

**Logica:**
- Scadenza tra 1–30 giorni → avviso arancione "X tra N giorni (Y €)"
- Scadenza oggi o passata → avviso rosso "X scaduta (Y €)"

**UI della card avviso:**
```
[🔴] Assicurazione furgone — scaduta (480 €)
     [Pagata]  [Riprogramma]
```
- **Pagata** → crea una voce in `spese[]` con la data odierna e l'importo della ricorrente, poi chiama `avanzaRicorrente(id)` per spostare la prossima scadenza
- **Riprogramma** → apre il popup calendario (quello già esistente `#q-pop`) per scegliere la nuova `prossima`; niente cambio importo né conferma lunga

**Dove inserire:** dentro `calcolaAvvisi()`, dopo gli avvisi pagamenti, prima della fine. Restituisce un array di oggetti `{tipo:'ricorrente', id, testo, importo, urgenza:'oggi'|'presto'}`.

---

### Step 3 — UI gestione ricorrenti nella scheda Conti

Sezione "Costi fissi" nella pagina Conti per aggiungere, vedere e modificare le spese ricorrenti.

**Layout sezione:**
```
── Costi fissi ──────────────────────
  [+ Aggiungi costo fisso]

  Assicurazione furgone   480 €/anno   📅 15 gen
  Telefono               35 €/mese    📅 1 dic
  Commercialista        200 €/trim    📅 20 dic
```

**Form aggiunta (card inline, non popup separato):**
- Campo nome (testo libero)
- Importo (cifra pronta + rotella, come il resto dell'app)
- Frequenza (3 chip: Mensile / Trimestrale / Annuale)
- Data prima scadenza (apre popup calendario)
- Categoria (chip: Mezzi / Ufficio / Personale / Altro)
- [Salva] [Annulla]

**Modifica:** tocca la riga → apre la stessa card pre-compilata con [Salva] [Elimina].

---

### Step 4 — KPI top e riorganizzazione pagina Conti

Sostituire la struttura attuale della pagina Conti con un layout a sezioni chiare.

**Nuovo ordine della pagina:**
1. Barra KPI (4 card)
2. Grafico (Step 5)
3. Sezione "Costi fissi" (Step 3)
4. Sezione "Spese una tantum" (raggruppate per categoria)
5. Sezione "Costi lavori" (aggregato da lavori[], sola lettura)
6. Sezione "Incassi" (già esistente, eventualmente ridotta)

**Le 4 card KPI:**

| Card | Valore |
|---|---|
| Incassato | somma `pagamenti[]` nel periodo |
| Da incassare | somma `conto(nome).dovuto` per tutti i clienti |
| Spese | somma `spese[]` + ricorrenti pagate nel periodo |
| Margine netto | Incassato − Spese |

**Toggle periodo:** due chip sopra i KPI → `Questo mese` / `Quest'anno`. Default: mese corrente.

**CSS KPI:**
```css
.kpi-griglia { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; }
.kpi-card { background: var(--carta); border-radius: 12px; padding: 14px 12px; }
.kpi-etichetta { font-size: 12px; color: var(--testo-2); margin-bottom: 4px; }
.kpi-valore { font-size: 22px; font-weight: 700; }
.kpi-valore.verde { color: var(--foglia); }
.kpi-valore.rosso { color: var(--rosso); }
```

---

### Step 5 — Grafico SVG inline (6 mesi)

Grafico a barre doppio: entrate (verde) vs uscite (rosso), ultimi 6 mesi. Niente Chart.js, SVG puro.

**Dati:**
- Entrate per mese: somma `pagamenti[]` filtrati per mese
- Uscite per mese: somma `spese[]` + ricorrenti pagate, filtrati per mese

**Layout SVG:**
```
Altezza totale: 180px (barre) + 24px (etichette mesi) + 20px (legenda)
Larghezza: 100% del contenitore (viewBox 0 0 320 224, preserveAspectRatio xMidYMid meet)
```

**Meccanica barre:**
- Scala: altezza massima barra = 150px; calcolare `maxValore = max di tutti i valori`
- Ogni mese: 2 barre affiancate (entrate sx, uscite dx), gap 2px tra le due, gap 8px tra i mesi
- Se entrambi zero: barra placeholder di 4px
- Etichette mesi sotto: "Nov", "Dic", "Gen"… (3 lettere, italiano)

**Responsive:** il grafico è `width: 100%; overflow-x: auto` — su schermi stretti scorre orizzontalmente se necessario (raro, 6 mesi stanno tutti).

**Nessuna interazione** (niente tooltip, niente click) — semplicità per la v1.

**Funzione:** `disegnaGraficoConti()` → restituisce la stringa SVG da inserire in `innerHTML` di `#conti-grafico`.

---

### Step 6 — Analytics lavori

Sezione "Come lavoro" in fondo alla pagina Conti (o in una sotto-scheda separata).

**Tre blocchi:**

**A — Lavori più frequenti (ultimi 12 mesi)**
Lista ordinata per conteggio, top 5:
```
1. Taglio erba      ████████  32 volte
2. Potatura siepe   █████     18 volte
3. Pulizia giardino ███       11 volte
```
Barra proporzionale in SVG inline (semplice, stessa tecnica del grafico).

**B — Lavori più redditizi**
Top 5 per margine medio (prezzo − costi del lavoro), solo lavori con almeno 3 occorrenze:
```
Vigneto          avg 180 €/lavoro   (8 volte)
Irrigazione      avg 95 €/lavoro    (12 volte)
```

**C — Stagionalità**
12 rettangoli (gen–dic), intensità di colore proporzionale al numero di lavori in quel mese:
```
Gen  Feb  Mar  Apr  Mag  Giu  Lug  Ago  Set  Ott  Nov  Dic
 ░░   ░░   ▒▒   ▒▒   ██   ██   ██   ▓▓   ▓▓   ▒▒   ░░   ░░
```
Colore: `var(--foglia)` con `opacity` proporzionale (da 0.15 a 1.0).

**Dati:** solo `lavori[]` con `l.fatto === true` (lavori completati). Raggruppare per `normalizza(l.cosa)`.

---

### Step 7 — Pulizia finale e build

Prima di considerare il lavoro completato:

1. Rimuovere la struttura HTML vecchia della pagina Conti (tutto ciò che viene sostituito)
2. Verificare che il toggle mese/anno aggiorni in tempo reale KPI + grafico
3. Verificare che le card avvisi ricorrenti appaiano nella home (dove già appaiono gli altri avvisi)
4. `npm run build` → 0 errori, 0 warning nuovi
5. `npm test` → tutti i test passano
6. Aprire sul browser su `127.0.0.1:5173` e navigare tutta la scheda Conti a mano
7. Commit con messaggio descrittivo

---

## Regole di lavoro

- Spiegazioni in italiano semplice (il titolare non sa programmare)
- Build prima di ogni commit: `npm run build`
- Nessun push finché il titolare non lo chiede esplicitamente
- Dati solo sul telefono (IndexedDB via Dexie, no server in beta)
- Decisioni di prodotto estese: vedi `PRODOTTO.md`
- Decisioni AI vocale: vedi `PRODOTTO.md` sezione AI
