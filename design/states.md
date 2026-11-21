# Stati per schermata — App Artigiani

Per ogni schermata principale vengono definiti 4 stati: empty, loading, error, success.
Ogni stato specifica cosa vede l'utente e come il CSS del design system lo rappresenta.

---

## 1. HOME (Calendario + Agenda)

### Empty state — nessun lavoro nel giorno selezionato
**Quando appare:** il giardiniere seleziona un giorno senza lavori.
**Cosa si vede:**
- Bordo tratteggiato verde chiaro (`.vuoto.tutto-fatto`)
- Testo "Giornata libera ✓" in verde
- Bottone "+ Aggiungi lavoro" a destra (`.aggiungi-qui`)

**Variante — giorno passato senza lavori:**
- Bordo tratteggiato grigio (`.vuoto`)
- Testo "Nessun lavoro quel giorno"
- Nessun bottone aggiungi

### Loading state — calendario in caricamento iniziale
**Quando appare:** primo avvio, mentre Dexie legge i dati.
**Cosa si vede:**
- 3 skeleton card (`.skeleton.skeleton-lavoro`) al posto della lista lavori
- Il calendario è già visibile (i dati del mese sono leggeri)
- Nessun spinner: i skeleton danno l'idea della struttura

### Error state — errore lettura database
**Quando appare:** IndexedDB fallisce (raro, es. storage pieno).
**Cosa si vede:**
- Banner `.banner-errore` in cima all'agenda: "Non riesco a leggere i dati. Riprova."
- Bottone "Riprova" nel banner
- Il calendario rimane visibile

### Success state — lavoro segnato come Fatto
**Cosa si vede:**
- Il cerchio verde si anima (`.anello` stroke-dashoffset → 0)
- La spunta si disegna (`.segno` animation `disegna`)
- La card scivola via con opacità (`.lavoro.via`)
- Toast (`.avviso`) in basso: "Fatto! [nome cliente]" con "Annulla"

---

## 2. CLIENTI (lista debitori)

### Empty state — nessun cliente
**Quando appare:** primo utilizzo dell'app.
**Cosa si vede:**
- Icona grande (SVG persona + foglia) a 35% opacità
- `.vuoto-stato` centrato con titolo "Nessun cliente ancora"
- Paragrafo "Aggiungi il tuo primo cliente con il microfono o il tasto +"
- Bottone primario "Aggiungi cliente" sotto

### Loading state — lista in caricamento
**Cosa si vede:**
- 4 skeleton card (`.skeleton` h:70px, border-radius var(--radius-xl))
- Il riepilogo in cima mostra "—" al posto degli importi

### Error state — errore calcolo conti
**Quando appare:** un importo non è calcolabile (dato corrotto).
**Cosa si vede:**
- Nessun blocco dell'interfaccia: la lista si mostra comunque
- Il cliente problematico ha "—" al posto dell'importo
- Banner `.banner-errore` in basso: "Dati mancanti per [nome]. Apri la scheda per correggerli."

### Success state — pagamento registrato
**Cosa si vede:**
- Toast "Pagato ✓ [importo] da [nome]" con colore verde
- L'importo nella card del cliente si aggiorna con micro-animazione (`animation: evidenzia`)
- Se il saldo scende a 0: l'importo diventa verde (`.utile`) e compare "In regola ✓"

---

## 3. SCHEDA CLIENTE

### Empty state — nessun lavoro per questo cliente
**Cosa si vede:**
- `.s-vuoto`: "Nessun lavoro registrato"
- Bottone "+ Nuovo lavoro" sotto

### Loading state — scheda che si apre
**Cosa si vede:**
- La scheda si anima dal basso con `.sali` (già implementato)
- I dati finanziari mostrano "—" per 200ms prima del calcolo

### Error state — cliente non trovato
**Quando appare:** `apriModifica('nome-che-non-esiste')`.
**Cosa si vede:**
- La scheda non si apre
- Toast `.avviso` rosso: "Cliente non trovato"

### Success state — modifica salvata
**Cosa si vede:**
- La scheda si chiude con animazione
- Toast "Salvato ✓" in basso
- Nella lista clienti, la card del cliente fa `.appena-salvato` (bordo verde lampeggiante)

---

## 4. FOGLIO NUOVO CLIENTE

### Empty state — form vuoto
**Cosa si vede:**
- Tutti i campi vuoti, placeholder grigi
- Il bottone "Salva" è disabilitato (`.btn-primario:disabled`) finché Nome + Indirizzo + Giorno non sono compilati
- I drum (prezzo, durata) mostrano il valore default

### Loading state — AI sta pre-compilando i campi (da inbox)
**Cosa si vede:**
- Indicatore `.ai-elabora` (tre pallini verdi animati) nella testata del foglio
- I campi si riempiono uno per uno con transizione `.campo.compilato`
- Il bottone Salva rimane disabilitato durante il riempimento

### Error state — salvataggio fallito (storage pieno)
**Cosa si vede:**
- `.f-piede .errore` appare sopra il bottone: "Non ho potuto salvare. Spazio esaurito?"
- Il bottone Salva rimane attivo (l'utente può riprovare)

### Success state — cliente salvato
**Cosa si vede:**
- Il foglio si chiude
- La card del nuovo cliente compare nell'agenda con animazione `.appena-salvato`
- Toast "Nuovo cliente aggiunto ✓"

---

## 5. INBOX AI

### Empty state — nessuna notifica
**Quando appare:** inbox aperta senza voci nella categoria selezionata.
**Cosa si vede:**
- Icona (SVG campanella o categoria) a 35% opacità, centrata
- Testo "Nessuna notifica" in `--color-testo-2`
- Per schede + e mic: "Puoi aggiungere con il +" o "Registra con il microfono"
- **NB:** questo stato manca nell'implementazione attuale — l'inbox mostra solo lista vuota

### Loading state — AI sta classificando la voce
**Quando appare:** dopo che l'utente finisce di parlare, mentre Claude Haiku elabora.
**Cosa si vede:**
- Box mic-box mostra `.ai-elabora` (pallini animati) sotto il testo trascritto
- Chip categoria grigio `.mic-box-cat.cat-tutto` (senza categoria ancora)
- Il bottone "Annulla" è attivo per interrompere

### Error state — AI non raggiungibile / chiave mancante
**Cosa si vede:**
- Box mic-box: testo in rosso "AI non disponibile"
- Fallback locale si attiva (`categorizzaVoce`) e mostra la categoria trovata con keywords
- Chip mostra la categoria con un'icona ⚠ per indicare classificazione manuale

### Success state — voce confermata
**Cosa si vede:**
- Animazione `.exit-ok` (card scivola a destra con flash verde)
- Badge della campanella si decrementa di 1 (`.badge` aggiornato)
- Toast "Confermato ✓ [azione eseguita]"

---

## 6. CONTI (grafici e rendiconto)

### Empty state — nessuna transazione nel periodo
**Cosa si vede:**
- Grafico `.k-grafico` con colonne a 0 (altezza minima 2px per visibilità)
- Testo sotto: "Nessun dato per [mese/anno]"
- Le tessere (`.k-tessere`) mostrano "€ 0,00" anziché "—"

### Loading state — calcolo in corso
**Quando appare:** cambio mese/anno con molte voci.
**Cosa si vede:**
- Le tessere mostrano skeleton (`.skeleton` h:40px)
- Il grafico mostra colonne skeleton

### Error state — dati corrotti
**Cosa si vede:**
- Banner `.banner-errore`: "Errore nel calcolo. Alcuni dati potrebbero essere corrotti."
- I valori errati mostrano "—" invece di un numero

### Success state — spesa aggiunta
**Cosa si vede:**
- I totali si aggiornano con micro-animazione
- Toast "Spesa aggiunta ✓"

---

## 7. IMPOSTAZIONI

### Loading state — salvataggio preferenze
**Cosa si vede:**
- Il bottone Salva mostra un indicatore di caricamento inline (spinner piccolo)
- Dura < 300ms (write su localStorage è sincrono)

### Error state — chiave AI non valida
**Cosa si vede:**
- Input chiave AI con bordo rosso (`.campo-mancante`)
- Messaggio sotto l'input: "Chiave non valida. Controlla su console.anthropic.com"
- **NB:** questo controllo manca nell'implementazione attuale

### Success state — chiave AI salvata
**Cosa si vede:**
- Input diventa verde (`.campo.compilato`)
- Toast "Chiave salvata ✓"

---

## Regole generali per tutti gli stati

| Principio | Regola |
|-----------|--------|
| **Skeleton vs spinner** | Skeleton per caricamento iniziale (struttura prevedibile); spinner inline per azioni brevi (<500ms) |
| **Empty non è errore** | Empty state è verde/neutro; errore è sempre rosso |
| **Toast durata** | 5 secondi, con barra tempo `--avviso-tempo.corre`; azione critica (Annulla) ferma il timer |
| **Disabilita, non nascondi** | Bottoni non attivabili → `disabled` + opacità 55%, non `hidden` |
| **Caricamento parziale** | Mostra subito quello che hai, carica il resto; non bloccare tutta la schermata |
