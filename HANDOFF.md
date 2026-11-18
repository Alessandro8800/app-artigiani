# Handoff — app-artigiani

Leggi questo file all'inizio di ogni nuova sessione prima di toccare codice.

---

## Cos'è l'app

PWA Android per un giardiniere (artigiano che lavora da solo).
Un unico file: `index.html` — prova grafica approvata, dati inventati, si azzera a ogni apertura.
Stack: HTML + CSS + JS vanilla (Vite 6 solo per build/PWA). Database: Dexie (IndexedDB).
La versione app vera è in `src/` + `prima-versione/` (bocciata, resta online).

---

## Stato attuale (sessione al 2026-11-18)

### Schermata principale
- Calendario settimana in cima con giorno selezionato
- Agenda sotto: lista lavori del giorno, giorni liberi, 2 mesi avanti
- Barra AI sotto l'agenda: 5 icone categoria + tasto microfono rosso pulsante
- Barra azioni rimossa dalla parte superiore

### Scheda "Nuovo cliente" (foglio dal basso)
5 campi principali visibili subito:
1. **Nome** — testo libero
2. **Indirizzo** — testo libero
3. **Cosa c'è da fare** — chips (8 lavori: Taglio erba, Potatura, Taglio siepe, Irrigazione, Raccolta foglie, Pulizia giardino, Vigneto, Manutenzione verde) + campo testo
4. **Prezzo** — drum orizzontale con cella edit (matita) per importo personalizzato
5. **Quando** — giorno/settimana con possibilità di aprire calendario

Poi `<details class="avanzate">` con `›` come icona (si ruota quando aperto):
- **Tipo cliente** — chips: Privato / Condominio / Fabbrica
- **Durata e orario** — drum ore/giorni + toggle `ore`/`giorni` per valore personalizzato
- **Telefono** — input + "Aggiungi numero" per più numeri (salvati con `\n` come separatore)
- **Paga ogni:** (solo Condominio) — griglia 12 mesi cliccabili; `semestrale = mesiSemestrale.length > 0`
- **Si ripete** — toggle on/off → opzioni: settimanale, ogni 2 sett., mensile, personalizzato (apre calendario app)
- **Etichetta colore** — 6 colori
- **Note personali** — textarea

### Barra AI (sopra agenda)
```html
<div class="ai-barra">
  <div class="ai-barra-cat">5 icone categoria</div>
  <button class="ai-ic-tutto" id="ai-tutto">campanella</button>
</div>
<button class="ai-microfono" id="ai-mic">🎤 Parla</button>
```
- Onclick icona cliente: `apriFoglio()` (apre il form manuale)
- Onclick microfono: toglie/aggiunge classe `ascolta` sul button

---

## Funzioni JS chiave

| Funzione | Cosa fa |
|---|---|
| `apriFoglio(giorno?, perCliente?)` | Apre form nuovo cliente |
| `apriModifica(nome)` | Apre form modifica cliente esistente |
| `salva()` | Salva nuovo cliente / chiama `salvaModifica()` |
| `salvaModifica()` | Salva modifiche cliente |
| `leggiTelefoni()` | Legge tutti gli input tel e restituisce stringa con `\n` |
| `aggiungiTelInput(wrap)` | Crea e inserisce nuovo input tel |
| `disegnaDurata()` | Disegna drum durata (con cella edit a idx 0) |
| `disegnaSemestrale()` | Disegna griglia mesi per "Paga ogni" |
| `disegnaRipeti()` | Disegna opzioni ripeti |
| `apriCalRipeti()` | Apre calendario app per scegliere data "personalizzato" |
| `prendiExtra(nome)` | Restituisce/crea dati extra cliente (tel, colore, ripeti, mesiSemestrale) |

---

## Variabili stato foglio

```js
let tipo, durata, colore, ripeti, ora, semestrale, mesiSemestrale, quando, quandoFisso
let clienteScelto, modoFoglio, nomeInModifica
```

Defaults in `apriFoglio`: `mesiSemestrale = []`, `semestrale = false`, `ripeti = 'no'`

---

## Cosa manca / prossimi passi

### Form manuale (priorità media)
- [ ] Schermata notifiche AI: quando ci sono notifiche, mostrare lista "da confermare" + tasto nuovo in fondo
- [ ] Schermate manuali per le altre 4 categorie AI: Note, Riprogramma, Costi, Pagamento

### AI vocale (versione commerciale)
- [ ] Web Speech API per trascrizione
- [ ] Haiku per interpretazione → inbox "Da confermare"
- [ ] 5 mansioni: nuovo cliente, note, riprogramma, costi, segna pagamento
- [ ] Flusso: parla → inbox → la sera si conferma → si salva

### Infrastruttura (dopo beta)
- [ ] Server, account utente, abbonamento
- [ ] Sincronizzazione dati tra dispositivi

---

## Regole di lavoro

- Spiegazioni in italiano semplice (il titolare non sa programmare)
- Build prima di ogni commit: `npm run build`
- Nessun push finché il titolare non lo chiede
- Dati solo su telefono (IndexedDB, no server in beta)
- Vedi `PRODOTTO.md` per le decisioni di prodotto estese
