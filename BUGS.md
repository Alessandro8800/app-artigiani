# BUGS — Audit completo di index.html

Audit fatto il 2026-11-20 su `index.html` (~6000 righe, prova grafica 0.4).
Ogni bug riporta: descrizione, dove si trova nel codice, e cosa succede.

---

## CRITICO — rompe una funzione principale o corrompe i dati

---

### BUG-01 · `riviSt` crea voce inbox con `campi: []` vuoto — conferma sempre fallisce

**Dove:** `riviSt()` linea ~3435; `confermaCarta()` linea 3262

**Cosa succede:** Quando l'utente clicca "Rivedi" in un item dello Storico, `riviSt` lo rimette in coda nell'inbox con:
```js
const v = { testa: it.testa, dati: it.dati, campi: [] };
```
`campi` è un array vuoto. Poi `confermaCarta` usa `getCampo(label)` per estrarre tutti i dati (nome, importo, indirizzo, lavoro, nota). Con `campi: []`, ogni `getCampo()` restituisce stringa vuota.

Conseguenze per categoria:
- **`cliente`**: `nome` è `''` → `avvisa('Nome mancante'); return;` — niente viene salvato
- **`paga`**: `importo` = 0 → il pagamento non viene registrato (nessun avviso di errore)
- **`nota`**: `nota` è `''` → `avvisa('Nessun testo — modifica la nota prima di salvare')` — blocco con messaggio confuso
- **`costo`**: `importo` = 0 → niente salvato

L'utente che rivede un item dallo storico non riesce mai a confermarlo. Non c'è modo di aggirare il problema senza editare l'item manualmente (ma i campi sono vuoti anche nel pannello di modifica).

---

### BUG-02 · `confermaSt`/`scartaSt` usano indice stale — item sbagliato confermato/scartato

**Dove:** `apriStorico()` linea ~3380, `confermaSt()` / `scartaSt()` linea ~3415

**Cosa succede:** Quando si disegna lo Storico, ogni card riceve `_idx` = l'indice corrente dell'item in `cfg.voci`. Se nel frattempo un altro item viene rimosso (l'utente conferma o scarta un'altra card), `_idx` non è più corretto.

Esempio: items = [A, B, C]. A ha `_idx=0`, B ha `_idx=1`, C ha `_idx=2`. L'utente scarta A (rimosso dall'array). Ora B è a indice 0, C a indice 1. Se l'utente clicca "Conferma" su B (ancora con `_idx=1`), `confermaSt` agisce su C per errore.

Questo può fare sparire dati corretti o processare l'item sbagliato.

---

### BUG-03 · Ripristino da copia crasha su backup vecchi (`LAVORI_COMUNI` assente)

**Dove:** `$('i-ripristina').onchange` linea ~5387, riga 5402

**Cosa succede:**
```js
LAVORI_COMUNI.splice(0, LAVORI_COMUNI.length, ...im.LAVORI_COMUNI);
```
Se il file di backup è stato creato con una versione precedente dell'app che non salvava `LAVORI_COMUNI`, allora `im.LAVORI_COMUNI` è `undefined`. Lo spread `...undefined` lancia `TypeError: undefined is not iterable`, interrompendo tutta la funzione di ripristino nel mezzo. I dati rimangono in uno stato parzialmente sovrascritto (lavori e pagamenti già caricati, impostazioni a metà).

---

## ALTO — funzione rotta o problema di sicurezza rilevante

---

### BUG-04 · XSS nella textarea di `inboxCampiHtml` — testo AI non escapato

**Dove:** `inboxCampiHtml()` linea ~3100, nel ramo della categoria `nota`

**Cosa succede:** Il testo della nota proveniente dalla risposta AI viene inserito direttamente in una `<textarea>` senza `sicuro()`:
```js
<textarea ...>${nota}</textarea>
```
Un payload come `</textarea><img src=x onerror="alert(1)">` esegue codice JavaScript. Chiunque possa controllare la risposta dell'API (o intercettarla) può iniettare script.

---

### BUG-05 · Injection in `cercaClienteInbox` — nome cliente non escapato nell'onclick

**Dove:** `cercaClienteInbox()` linea ~3150

**Cosa succede:**
```js
onclick="...querySelector('input').value='${c}'"
```
Il nome del cliente `c` viene inserito direttamente nell'attributo onclick senza escape. Un nome che contiene `'` (apostrofo) spezza il JavaScript inline: `Mario D'Antonio` diventa `value='Mario D'Antonio'` che è sintatticamente invalido e lancia un'eccezione. Con nomi costruiti ad arte si può eseguire codice arbitrario.

---

### BUG-06 · `inbox_cardHtml` renderizza `item.testa` e `item.dati` senza `sicuro()`

**Dove:** `inbox_cardHtml()` linea ~3200

**Cosa succede:**
```js
<div class="inbox-card-testa">${item.testa}</div>
<div class="inbox-card-dati">${item.dati}</div>
```
Nessun escape. Se `item.testa` o `item.dati` contengono `<`, `>`, o `"`, il rendering è rotto. Con `<img src=x onerror=...>` si ha esecuzione di codice JavaScript (XSS).

---

### BUG-07 · Race condition sul microfono — doppio click crea due istanze SpeechRecognition

**Dove:** `$('ai-mic').onclick` linea ~4000

**Cosa succede:** Ogni click sul mic crea e avvia una nuova `SpeechRecognition` assegnandola a `_micRiconosc`. Se l'utente clicca due volte rapidamente, la prima istanza rimane attiva (non viene mai fermata) e la seconda sovrascrive `_micRiconosc`. `chiudiMicBox()` ferma solo la seconda; la prima continua ad ascoltare, produce risultati duplicati nelle sessioni successive, e non può più essere spenta.

---

### BUG-08 · Il mic nell'inbox bypassa la categorizzazione AI — aggiunge testo grezzo

**Dove:** `$('ai-inbox-mic').onclick` linea ~4080

**Cosa succede:** Il mic dentro l'inbox chiama:
```js
aggiungiVoceInbox(finale, catCorrente);
```
dove `catCorrente` è già una stringa fissa (es. `'nota'`). Il testo parlato viene aggiunto direttamente alla categoria corrente senza passare da `categorizzaVoceAI` né da `categorizzaVoce`. L'utente si aspetta che l'AI interpreti "paga Mario Rossi 80 euro" come un pagamento, ma invece finisce nella categoria sbagliata (es. nota) come testo non strutturato, senza campi compilati.

---

### BUG-09 · `salva()` sovrascrive i dati di un cliente esistente quando `clienteScelto` è null

**Dove:** `salva()` linea 2646, riga 2671

**Cosa succede:** Se l'utente scrive manualmente il nome di un cliente esistente nel campo nome (invece di sceglierlo dalla lista, così `clienteScelto` resta `null`), al salvataggio:
```js
const e = prendiExtra(nome);
e.tel = leggiTelefoni();     // sovrascrive con i telefoni attuali del form (magari vuoti)
e.colore = colore;           // sovrascrive con il colore attuale del form
e.note = $('f-note').value.trim();  // sovrascrive le note esistenti
e.semestrale = semestrale;
e.mesiSemestrale = mesiSemestrale;
```
Tutti i dati extra del cliente vengono sovrascritti con i valori del form corrente, che potrebbero essere vuoti o diversi. Numero di telefono, note e colore salvati precedentemente vengono cancellati silenziosamente.

---

## MEDIO — funzione parzialmente rotta o UX gravemente compromessa

---

### BUG-10 · Il pulsante "Rimasti indietro" non viene aggiunto alla barra azioni

**Dove:** `disegnaAzioni()` linea 4866, riga 4871

**Cosa succede:**
```js
const ind = `<button ...class="a-indietro"...>${ICONA_INDIETRO}...</button>`;
if ($('azioni-cli')) $('azioni-cli').innerHTML = nuovo + note;  // ← ind mancante!
```
La variabile `ind` viene costruita ma non inserita nell'innerHTML. Il pulsante "Rimasti indietro" (con il suo badge numerico) non appare mai nella barra azioni principale. L'utente non ha un accesso diretto ai lavori in ritardo, e il badge visuale (`da-vedere`) non è mai visibile.

---

### BUG-11 · Test bar e input chiave API Anthropic sempre visibili in produzione

**Dove:** HTML linea ~1100, `id="test-bar"`

**Cosa succede:** Il blocco con id `test-bar` contiene un input per inserire la chiave API Anthropic ed è sempre visibile nella pagina. Chiunque apra l'app può vedere e modificare la chiave API. Questo espone la chiave a rischio di furto e confonde gli utenti finali con un elemento tecnico non destinato a loro.

---

### BUG-12 · `infoBtn` non escapa `"` nel testo info — attributo onclick rotto

**Dove:** `infoBtn()` linea 5568

**Cosa succede:**
```js
const titolo = d.info.titolo.replace(/'/g, "\\'");
const testo = d.info.testo.replace(/'/g, "\\'");
return `<button ... onclick="apriPrevInfo('${titolo}','${testo}')">i</button>`;
```
Vengono escapati solo i singoli apici `'`. Se il testo contiene `"` (virgolette doppie), l'attributo `onclick="..."` viene spezzato. Es: `testo="costo: 20" da` produce `onclick="apriPrevInfo(...,'costo: 20" da')"` — il tasto non funzionerà.

---

### BUG-13 · `apriPrevInfo` inserisce titolo e testo nell'innerHTML senza `sicuro()`

**Dove:** `apriPrevInfo()` linea 5619

**Cosa succede:**
```js
pop.innerHTML = `<div class="prev-info-box">
  <h4>${titolo}</h4>
  <p>${testo}</p>
  ...`;
```
I parametri `titolo` e `testo` vengono inseriti nell'innerHTML senza escape HTML. Se qualcuno aggiunge un testo con `<b>`, `<script>`, o `<img>`, il rendering sarà rotto o si avrà XSS. Attualmente i testi hardcoded sono sicuri, ma se i testi venissero mai letti da fonte esterna o utente diventerebbero pericolosi.

---

### BUG-14 · Doppio click su "Fatto" in "Rimasti indietro" registra due pagamenti

**Dove:** `disegnaIndietro()` linea 4886, `segnaFatto()` linea ~2500

**Cosa succede:**
```js
b.onclick = () => {
  const carta = document.createElement('article'); carta.dataset.id = b.dataset.fatto;
  segnaFatto(carta);
  setTimeout(() => { disegnaIndietro(); disegnaAzioni(); }, 100);
};
```
Il re-draw avviene dopo 100ms. Se l'utente tocca due volte rapidamente, `segnaFatto` viene chiamato due volte sullo stesso lavoro prima che l'elenco venga aggiornato. Risultato: due pagamenti registrati per lo stesso lavoro, importo raddoppiato nei conti.

---

### BUG-15 · `salvaModifica()` non aggiorna `l.cosa` e `l.durata` sui lavori esistenti

**Dove:** `salvaModifica()` linea 2687, righe 2697–2700

**Cosa succede:**
```js
for (const l of lavori) if (l.nome === vecchio) {
  l.nome = nuovo; l.dove = $('f-dove').value.trim(); l.tipo = tipo;
  // ← cosa e durata non aggiornati
}
```
Modificando un cliente, indirizzo e tipo vengono propagati su tutti i suoi lavori, ma `l.cosa` (descrizione) e `l.durata` restano invariati. Se l'utente cambia la descrizione standard del cliente (es. da "Taglio erba" a "Manutenzione parco"), i lavori già in calendario continuano a mostrare il vecchio valore.

---

### BUG-16 · MET Norway: User-Agent mancante — richiesta meteo può venire rifiutata

**Dove:** `caricaMeteo()` linea 4765, riga 4770

**Cosa succede:**
```js
const risposta = await fetch(url);
```
MET Norway richiede esplicitamente nelle proprie API terms un header `User-Agent` che identifichi l'applicazione e un contatto email (es. `User-Agent: NomeApp/0.4 contatto@esempio.it`). Senza di esso, le richieste possono essere bloccate dal server con `403 Forbidden`. Il meteo smette silenziosamente di funzionare (`meteoStato = 'non disponibile'`) senza spiegare il perché all'utente.

---

## BASSO — comportamenti imprevisti o limitazioni minori

---

### BUG-17 · Dopo conferma da inbox, `salva()` non ritorna all'inbox

**Dove:** `salva()` linea 2648, `chiudiFoglio()` linea ~2200

**Cosa succede:**
```js
function salva() {
  _ritornaInboxKey = null;   // ← azzerato subito
  ...
```
Quando il foglio è aperto in modalità `conferma-inbox` (l'utente arriva dall'inbox), `_ritornaInboxKey` viene azzerato prima del salvataggio. Dopo il salvataggio, `chiudiFoglio()` non riapre l'inbox. L'utente si ritrova sul calendario invece di tornare a gestire gli altri item in coda.

---

### BUG-18 · `aggiungiItemSimulato` aggiunge sempre a `INBOX_ESEMPI.nota`; il "+" di costo è inattivo

**Dove:** `apriInbox()` linea 3390, `aggiungiItemSimulato()` linea ~3500

**Cosa succede:** Il pulsante "+" nell'inbox della categoria `nota` chiama `aggiungiItemSimulato()`. Questa funzione aggiunge sempre a `INBOX_ESEMPI.nota`, il che è corretto quando si è nella categoria nota. Ma per la categoria `costo`, il pulsante "+" ha un onclick vuoto `() => {}` — non fa niente. L'utente non ha modo di aggiungere manualmente un costo all'inbox.

---

### BUG-19 · `leggiFrase` non gestisce "la prossima settimana" e date relative generiche

**Dove:** `leggiGiorno()` linea 2734 (chiamato da `leggiFrase`)

**Cosa succede:** `leggiGiorno` gestisce `oggi/domani/dopodomani`, giorni della settimana, e date con numero. "La prossima settimana", "il mese prossimo", "tra due giorni", "tra una settimana" restituiscono tutti `null`. Quando il giorno non viene riconosciuto, `leggiFrase` inserisce `'giorno'` nell'array `nonCapiti` e non compila il campo data. L'utente non riceve nessun avviso che il giorno non è stato capito (a meno che il sistema non mostri `nonCapiti`).

---

### BUG-20 · `zoom` CSS non standard per la grandezza del testo

**Dove:** `disegnaImpostazioni()` → corpo della riga `testo`, linea ~5062

**Cosa succede:**
```js
document.documentElement.style.zoom = TESTI[k][1];
```
La proprietà CSS `zoom` non è nel CSS standard (è un'estensione Microsoft/WebKit). Su Firefox e alcuni browser Android può comportarsi diversamente o essere ignorata. In futuro potrebbe smettere di funzionare. L'alternativa standard sarebbe modificare `font-size` su `:root`.

---

### BUG-21 · Timeout "conferma cancella" rimane attivo se si chiude la riga impostazioni

**Dove:** `GRUPPI_IMP` → riga `cancella`, linea ~5333

**Cosa succede:**
```js
let pronto = false, t;
$('i-cancella').onclick = () => {
  if (!pronto) { pronto = true; ...; t = setTimeout(() => { pronto = false; disegnaImpostazioni(); }, 4000); return; }
  clearTimeout(t); ...
};
```
Se l'utente clicca "Cancella tutto" (primo click), poi chiude la riga delle impostazioni prima che scadano i 4 secondi, il timeout rimane attivo. Alla scadenza chiama `disegnaImpostazioni()` che ridisegna tutto anche se la riga è già chiusa. Le variabili locali `pronto` e `t` vanno fuori scope con il re-render, quindi alla riapertura la riga funziona correttamente, ma c'è un `disegnaImpostazioni()` spurio dopo 4 secondi.

---

## Riepilogo

| # | Severità | Titolo breve |
|---|----------|--------------|
| 01 | CRITICO | `riviSt` campi vuoti → conferma sempre fallisce |
| 02 | CRITICO | `confermaSt`/`scartaSt` indice stale → item sbagliato |
| 03 | CRITICO | Ripristino crasha su backup vecchi (`LAVORI_COMUNI`) |
| 04 | ALTO | XSS textarea inbox (testo AI non escapato) |
| 05 | ALTO | Injection onclick `cercaClienteInbox` (nome cliente) |
| 06 | ALTO | XSS `inbox_cardHtml` (testa/dati non escapati) |
| 07 | ALTO | Race condition doppio click mic |
| 08 | ALTO | Mic inbox bypassa categorizzazione AI |
| 09 | ALTO | `salva()` sovrascrive dati cliente esistente |
| 10 | MEDIO | Pulsante "Rimasti indietro" assente dalla barra azioni |
| 11 | MEDIO | Test bar + input chiave API visibili in produzione |
| 12 | MEDIO | `infoBtn` non escapa `"` → onclick rotto |
| 13 | MEDIO | `apriPrevInfo` innerHTML senza escape |
| 14 | MEDIO | Doppio click "Fatto" registra due pagamenti |
| 15 | MEDIO | `salvaModifica` non aggiorna `l.cosa` sui lavori |
| 16 | MEDIO | MET Norway User-Agent mancante |
| 17 | BASSO | Dopo conferma-inbox, non ritorna all'inbox |
| 18 | BASSO | `aggiungiItemSimulato` sempre su `nota`, "+" costo inattivo |
| 19 | BASSO | `leggiFrase` non capisce "prossima settimana" |
| 20 | BASSO | `zoom` CSS non standard |
| 21 | BASSO | Timeout "cancella tutto" spurio |
