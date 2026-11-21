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
- `costo` → aggiunge item vuoto all'inbox costo e riapre la tab

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
| `cliente` | `nome`, `lavoro` | `data`, `importo` | Apre foglio pre-compilato |
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
- ⬜ **Step 6** (dopo test reali sul telefono): contesto clienti+agenda nel prompt
- ⬜ **Step 7** (prima di produzione): backend proxy chiave API

### Come è stato fatto (step 1–5) — cose da sapere
- **Funzioni nuove:** `validaOperazione(op, testo)` (livello 3: il codice ricalcola i campi mancanti, normalizza il tipo, forza `stato: 'da_verificare'` sui pagamenti), `_operazioneInItem` + `_aggiungiOperazioni` (livello 4), `avviaMicrofono(sorgente)`, `etichettaRisultato(ris)` (testo del riquadro mic, es. "3 operazioni: 👤 💶 📝").
- **Bug trovato e corretto:** Haiku a volte risponde con un blocco `thinking` vuoto prima del testo. Il vecchio codice leggeva solo `content[0]` → in quei casi finiva sempre nel fallback a parole chiave senza che nessuno se ne accorgesse. Ora legge tutti i blocchi di tipo `text`.
- **Una sola operazione cliente/riprogramma** → si apre subito il foglio / il popup (come prima). **Più operazioni** → tutte diventano card nell'inbox.
- **Nota con un nome cliente** → card nell'inbox Note (alla conferma va nella scheda cliente). Nota senza nome → direttamente in `noteRapide` (come prima).
- **Pagamenti dalla voce:** il bottone dice "✓ Ricevuto". Se manca il cliente o la cifra, il primo tocco apre il pannello (con il dovuto già scritto) invece di registrare: serve un secondo tocco dopo aver controllato.
- **Card con `item.mancanti`** (dai `missing_fields`) → bordo arancione + "Manca: …" anche per paga/costo/riprogramma. Il cliente usa ancora il suo controllo (nome, via, giorno).
- **Indirizzo e orario** non sono nello schema: l'AI li mette in `testo`, che per i clienti finisce nel campo Note del foglio.
- **Fallback:** AI in errore, risposta illeggibile o oltre 15 secondi → nota grezza + avviso "Salvato come nota, controlla". Senza chiave (e se l'utente non la inserisce) resta il riconoscimento a parole chiave; dal mic dell'inbox va nella scheda aperta.
- I numeri di riga citati sopra negli step sono cambiati.

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
