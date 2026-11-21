# Audit CSS — Problemi visivi e soluzioni

Analisi completa del CSS attuale in `index.html` (~2000 righe di stili).
Ogni problema riporta: dove si trova, cosa fa ora, e come il design system lo risolve.

---

## A — COLORI HARDCODED (priorità ALTA)

### A1 — #3b82f6 usato direttamente per le note-memo
**File/riga:** `.pallini i.memo`, `.lavoro.memo .nome`, `.lavoro.memo`
**Problema:** Blu hardcoded non cambia con i temi (tema Acciaio, tema Carta, dark mode).
**Soluzione:** Nuovo token `--color-nota: #3b82c4` già in `tokens.css`. Usare `var(--color-nota)`.

### A2 — #3b82c4 / #8a5cc7 per categorie inbox
**File/riga:** `.inbox-card[data-cat="riprogramma"]`, `.inbox-card[data-cat="costo"]`, `.mic-box-cat.cat-costo`
**Problema:** Colori hardcoded non adattabili. In dark mode rimangono chiari su sfondo scuro.
**Soluzione:** Usare `var(--color-nota)` e `var(--color-costo)` con le varianti `-bg`. Già definiti in `tokens.css`.

### A3 — #d97706 / orange per Note Rapide
**File/riga:** `.nr-btn`, `.nr-badge`, `.nr-nota-titolo`, `.nr-form-salva`
**Problema:** 4 valori diversi per lo stesso concetto (arancione note). `orange` è un colore CSS generico con valore approssimato.
**Soluzione:** Unificare in `var(--color-nr)` = `#d97706`. Già in `tokens.css`.

### A4 — #c83232 per stato errore (non usa --rosso)
**File/riga:** `.storico-stato.no`, `.nr-nota-del:active`, vari `:active` rossi
**Problema:** `#c83232` è simile ma diverso da `--rosso: #b42318`. Due "rossi" nel sistema.
**Soluzione:** Usare `var(--color-danger)` ovunque. Eliminare `#c83232`.

### A5 — rgba hardcoded ovunque
**File/riga:** `.storico-stato.ok`, `.storico-stato.no`, `.storico-stato.attesa`, `.st-btn.verde/.rosso/.amber`
**Problema:** `rgba(200,50,50,.12)`, `rgba(255,165,0,.12)` ecc. — ricette manuali invece di token.
**Soluzione:** Usare `color-mix(in srgb, var(--color-danger) 12%, transparent)` oppure le varianti `-chiaro` già nei token.

### A6 — #fff hardcoded su sfondo colorato
**File/riga:** `.btn-primario` (implicito), `.salva`, `.nuovo`, `.ripr-nome-input`, `.ripr-data-vec`
**Problema:** `color: #fff` va bene nel tema chiaro ma in tema Acciaio il "bianco" su neon potrebbe non passare WCAG.
**Soluzione:** Usare `var(--color-su-accento)` per testo su sfondo accento. Già in `tokens.css`.

---

## B — BORDER-RADIUS CAOTICO (priorità ALTA)

**Conteggio unico dei valori usati:**
6px, 7px, 8px, 9px, 10px, 11px, 12px, 13px, 14px, 16px, 18px, 20px, 22px, 50%, 99px — 15 valori distinti.

### B1 — Nessuna scala semantica
**Problema:** Un bottone usa 12px, un altro 14px, un altro 11px. Non c'è un criterio visivo.
**Soluzione:** 6 token semantici in `tokens.css`:
- `--radius-xs: 6px` → badge, chip piccoli
- `--radius-sm: 8px` → elementi mini
- `--radius-md: 12px` → bottoni, input, card piccole
- `--radius-lg: 16px` → card standard
- `--radius-xl: 20px` → card grandi, calendario
- `--radius-2xl: 22px` → foglio/modal
- `--radius-full: 999px` → pill, switch

### B2 — Valori intermedi senza logica (9px, 11px, 13px)
**File/riga:** `.inbox-btn-ok` (9px), `.imp-voce input` (11px), vari elementi inbox
**Problema:** 9px è inutilmente preciso; non porta beneficio visivo rispetto a 8px o 10px.
**Soluzione:** Sostituire con il token più vicino (`--radius-sm` = 8px).

---

## C — TIPOGRAFIA SENZA SCALA (priorità ALTA)

**Conteggio unico dei font-size usati:**
10px, 11px, 12px, 13px, 14px, 15px, 16px, 17px, 18px, 19px, 20px, 22px, 24px, 28px, 30px, 40px — 16 valori.

### C1 — Nessuna scala coerente
**Problema:** Differenze di 1px tra elementi (12px e 13px; 17px e 18px) non sono percepibili visivamente ma creano rumore nel codice.
**Soluzione:** Scala in `tokens.css` con 8 step (11, 13, 15, 17, 19, 22, 26, 32px). Tutti i valori fuori scala vengono arrotondati al più vicino.

### C2 — font-size: 10px (illeggibile su Android)
**File/riga:** `.agenda-data` (10px), `.mini-sett-g > span` (8px), `.mini-anno-nome` (7px)
**Problema:** Android non scala font sotto 10px; 7px e 8px risultano illeggibili su schermi normali. Chrome forza un minimo di 8px.
**Soluzione:** Minimo assoluto `--text-xs: 11px`. I componenti mini (miniatura calendario) usano transform scale invece di font-size bassi.

### C3 — font-weight: 300 usato una volta sola
**File/riga:** `.inbox-stepper button` (300 per i segni ±)
**Problema:** Richiede il caricamento di un peso font extra (Manrope 300 non è nell'import attuale).
**Soluzione:** Usare `font-weight: 400` per i ± che è già caricato, o testo normale ÷ × se serve distinzione visiva.

---

## D — SPACING IRREGOLARE (priorità MEDIA)

### D1 — Padding inconsistente su card simili
**Esempi:**
- `.lavoro` → `padding: 14px 14px 14px 16px` (asimmetrico)
- `.cliente` → `padding: 12px 12px 12px 16px` (diverso dal lavoro)
- `.inbox-card` → `padding: 14px 14px 10px` (tre valori diversi)

**Problema:** 3 tipi di card con padding leggermente diversi senza ragione semantica.
**Soluzione:** `--space-3` (12px) per card compatte, `--space-4` (16px) per card standard, sempre con padding-left più grande per il bordo colorato o la spaziatura ottica.

### D2 — gap: 2px e gap: 3px ovunque
**Problema:** 2px e 3px tra pallini, icone, badge. Non percepibili come "spazio intenzionale".
**Soluzione:** Minimo gap visivo `--space-1: 4px`. Sotto a 4px usare 0 (elemento aderente) o 4px (spazio minimo percepibile).

### D3 — margin-top: -6px, -4px usati come hack
**File/riga:** `.l-sposta`, `.avanzate-sotto .campo`
**Problema:** Margini negativi per correggere gap sbagliati. Sintomo di spacing non sistematico.
**Soluzione:** Correggere il gap del contenitore padre invece di usare margini negativi nei figli.

---

## E — OMBRE INCONSISTENTI (priorità MEDIA)

### E1 — box-shadow: 0 8px 22px rgba(20,60,30,.28) solo sul bottone verde
**File/riga:** `.nuovo`, `.btn-primario`
**Problema:** Solo un componente ha ombra; tutti gli altri non ne hanno. L'ombra sul verde è molto specifica (colore verde nell'ombra).
**Soluzione:** Sistema di ombre in `tokens.css`:
- `--shadow-btn` per il bottone primario (mantiene l'ombra verde)
- `--shadow-sm/md/lg` per gli altri elementi
- Modal e toast usano `--shadow-lg`

### E2 — Nessuna ombra sul foglio/modal
**File/riga:** `.foglio`
**Problema:** Il foglio bottom sheet non ha ombra → non si distingue visivamente dallo sfondo nella prima animazione.
**Soluzione:** Aggiungere `box-shadow: var(--shadow-xl)` sul `.foglio`.

---

## F — STATI MANCANTI (priorità ALTA)

### F1 — Nessun empty state nell'inbox
**File/riga:** Funzione `apriInbox()` in JS
**Problema:** Se una categoria non ha voci, `#ai-inbox-lista` è vuoto → l'utente vede uno spazio bianco senza capire perché.
**Soluzione:** `states.md` specifica il template da aggiungere: `.vuoto-stato` con icona e testo per ogni categoria. Il JS deve controllare se la lista è vuota e iniettare l'empty state.

### F2 — Nessuno skeleton durante il caricamento iniziale
**Problema:** Al primo avvio (con dati Dexie), la lista lavori è vuota finché la Promise non risolve. L'utente vede un lampo di bianco.
**Soluzione:** `states.md` specifica 3 skeleton card (`.skeleton.skeleton-lavoro`) da mostrare durante il fetch, rimosse quando i dati arrivano.

### F3 — Nessun feedback visivo su errori AI
**File/riga:** `categorizzaVoceAI()` → catch block
**Problema:** Se la chiamata API fallisce, il fallback locale si attiva silenziosamente. L'utente non sa che l'AI non ha funzionato.
**Soluzione:** `states.md` specifica il chip con icona ⚠ nel mic-box per indicare classificazione locale. CSS aggiunge `.mic-box-cat.fallback { opacity: .7; }`.

### F4 — Campo obbligatorio senza stato visivo
**File/riga:** Validazione in `salva()`, variabile `mancanti`
**Problema:** Il messaggio errore si aggiunge al DOM ma non c'è evidenziazione del campo mancante.
**Soluzione:** Aggiungere `.campo-mancante` (bordo arancione `var(--color-warning-testo)`) ai campi mancanti via JS. Già definito in `components.css`.

---

## G — DARK MODE INCOMPLETA (priorità MEDIA)

### G1 — Colori hardcoded ignorano la dark mode
**File/riga:** `.nr-nota-titolo` (#d97706), `.nr-badge` (#d97706), `.nr-form-salva` (background: #d97706)
**Problema:** In dark mode, questi elementi rimangono con sfondo arancione chiaro.
**Soluzione:** Usare `var(--color-nr)` che viene ridefinito in dark mode come `#f59e0b` (più luminoso).

### G2 — rgba(200,50,50,.12) non si adatta alla dark mode
**File/riga:** `.storico-stato.no`, `.st-btn.rosso`
**Problema:** Valore calcolato dal bianco → in dark mode l'opacità è troppo bassa, il colore scompare.
**Soluzione:** Sostituire con `var(--color-danger-chiaro)` che in dark mode è `#3d1f1c` (opaco).

### G3 — #fff su sfondi colorati in dark mode
**File/riga:** `.avviso`, `.inline mic-box`
**Problema:** Il toast `.avviso` usa `color: var(--sfondo)` che in dark mode diventa `#111613` su sfondo `var(--testo)` = `#e8eee9`. Il contrasto è buono, ma è un pattern fragile.
**Soluzione:** Verificare rapporto contrasto WCAG AA (4.5:1 minimo) dopo ogni cambio tema.

---

## H — SPECIFICITY E RIDONDANZA (priorità BASSA)

### H1 — `.ai-badge` definito due volte
**File/riga:** Righe ~409 e ~418 nel CSS
**Problema:** Lo stesso selettore `.ai-badge` appare due volte con proprietà leggermente diverse. Il secondo sovrascrive il primo.
**Soluzione:** Unificare in una sola regola. In `components.css` esiste solo `.badge` (nome generico).

### H2 — `.giorno-testa` ridefinito due volte
**File/riga:** Riga ~102 (definizione base) e ~529 (override con align-items e justify-content diversi)
**Problema:** Il secondo blocco sovrascrive il primo, ma entrambi esistono nel codice. Confonde chi legge.
**Soluzione:** Una sola definizione completa per `.giorno-testa`.

### H3 — `.k-colonna` definito due volte con flex-direction diverse
**File/riga:** Righe ~559-560
**Problema:** `flex: 1; ... align-items: flex-end` poi `flex-direction: column-reverse; align-items: center`. Il secondo blocco è scritto subito dopo il primo, probabilmente come fix rapido.
**Soluzione:** Fondere in una sola regola.

### H4 — !important su `.campo-mancante`
**File/riga:** `.campo-mancante { border-color: #f59e0b !important; }`
**Problema:** `!important` per sovrascrivere il `:focus` border-color. Sintomo di specificity mal gestita.
**Soluzione:** Usare `.campo input.campo-mancante` (più specifico) invece di `!important`. O aggiungere `.campo-mancante` al contenitore `.campo` (non all'input).

---

## I — ACCESSIBILITÀ (priorità MEDIA)

### I1 — Bottoni senza label accessibile
**File/riga:** `.freccia`, `.chiudi`, `.nr-nota-tick`, `.nr-nota-del`
**Problema:** Bottoni con solo SVG/emoji, senza `aria-label`. Screen reader annuncia "pulsante" senza contesto.
**Soluzione:** Aggiungere `aria-label="Vai al mese precedente"` ecc. nel template HTML.

### I2 — `color: var(--testo-2)` su sfondo carta: contrasto borderline
**Problema:** `--testo-2: #5b675e` su `--carta: #ffffff` = ratio 4.3:1. Sotto WCAG AA (4.5:1) per testo normale.
**Soluzione:** Scurire `--testo-2` a `#546058` (ratio ~4.6:1) oppure usare font-weight 700+ per il testo secondario (il peso aumenta la leggibilità percepita).

### I3 — Focus ring rimosso su elementi `button:focus-visible`
**Problema:** `button:focus-visible` ha `outline: 3px solid var(--foglia)` — buono. Ma molti bottoni hanno `border: 0` e il focus può scomparire su sfondi verdi.
**Soluzione:** Aggiungere `outline-offset: 2px` su tutti i focus ring (già in `components.css`).

---

## Riepilogo priorità

| Priorità | Problemi | Stima ore |
|----------|----------|-----------|
| **ALTA** | A1–A6 (colori), B1–B2 (radius), C1–C3 (tipo), F1–F4 (stati) | ~6–8 ore |
| **MEDIA** | D1–D3 (spacing), E1–E2 (ombre), G1–G3 (dark), I1–I3 (a11y) | ~4–5 ore |
| **BASSA** | H1–H4 (ridondanza) | ~1 ora |

**Approccio consigliato per l'integrazione:**
1. Importa `design/tokens.css` in cima al `<style>` di `index.html` — i token ridefiniscono le variabili esistenti, compatibilità immediata con il codice che usa `var(--foglia)` ecc.
2. Sostituisci i componenti uno per uno usando `design/components.css` come reference — non sovrascrivere tutto in un colpo
3. Aggiungi gli empty/loading/error state secondo `design/states.md` nei punti JS identificati
4. Pulisci le ridondanze (H*) per ultime, dopo che tutto funziona
