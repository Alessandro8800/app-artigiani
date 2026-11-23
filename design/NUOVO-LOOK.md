# Nuovo look dell'app — strategia e scaletta

Deciso con Alessandro il 22/11/2026 sera. Da qui si riparte il 23/11.

---

## 1. Cosa abbiamo deciso

- **Si cambia solo il look.** Cambiano colori, caratteri, icone, forme dei tasti e delle carte,
  ombre e animazioni. **Ogni cosa resta al suo posto** e le funzioni restano le stesse.
  Spostare i pezzi sullo schermo (es. il calendario orizzontale, punto 17 dell'HANDOFF) è un
  lavoro a parte, da fare dopo.
- **Si parte da zero.** I 3 temi del 22/11 (Verde foresta, Acciaio, Carta) si mettono da parte.
  Restano consultabili come artifact (link in `HANDOFF.md` → "Temi grafici"), ma non sono la base.
- **Chiaro e scuro, tutti e due curati.** Ogni colore si sceglie in coppia (chiaro + scuro) e si
  controlla che si legga bene, anche al sole e da chi non distingue bene i colori.
  **Ordine (23/11): prima si fa tutta la versione scura, poi si pensa a quella chiara.**
  Per la chiara c'è già un esempio: `ispirazioni/39-pin-gestione-soldi.png` (crema + verde bosco).
- **Stile scuro che esce dalle ispirazioni** (43 esempi in `ispirazioni/INDICE.md`): nero morbido,
  carte grigie con bordo sottile, **un solo colore d'accento**, numeri grandi, barra in basso a
  pillola con il microfono rotondo staccato, fogli dal basso con lo sfondo sfocato, spunte che si
  disegnano. Le 3 proposte della Fase 2 possono differire soprattutto per il **colore d'accento**
  (verde, blu notte, arancione).
- **21st.dev, shadcn/ui e Aceternity UI si usano come vetrina di idee, non si installano.**
  Sono fatti per siti costruiti con React + Tailwind, mentre l'app è un unico file in HTML e
  JavaScript semplice. Installarli vorrebbe dire rifare l'app e appesantirla sul telefono.
  Quindi: Alessandro indica cosa gli piace, Claude lo rifà nello stile dell'app, leggero.

## 2. Dove cercare le ispirazioni

| Sito | Cosa ci trovi | Quanto serve |
|---|---|---|
| **Mobbin** (mobbin.com) | Schermate vere di app famose per telefono | Il più utile: sono app per telefono, come la nostra |
| **Dribbble** (dribbble.com, cerca "mobile app calendar", "finance app") | Disegni di grafici, spesso molto belli | Buono per colori e atmosfera |
| **21st.dev** | Tasti, menu, carte, animazioni | Buono per singoli pezzi e animazioni |
| **Aceternity UI** | Effetti speciali, sfondi animati | Solo piccoli tocchi: in un'app di lavoro distraggono |
| **shadcn/ui** | Pezzi sobri e ordinati | Buono come esempio di ordine e coerenza |
| **Le app sul tuo telefono** | Banca, meteo, calendario, ecc. | Ottime: le usi già e sai cosa ti piace |

## 3. Scaletta di lavoro

### Fase 0 — Mettere al sicuro (Claude, 5 minuti)
- Segnare in git il punto di partenza ("prima del nuovo look"), per poter tornare indietro.

### Fase 1 — Ispirazioni (Alessandro, 30-45 minuti)
- Raccogliere **8-15 immagini** (screenshot) di cose che piacciono, dai siti sopra o da app.
- Metterle nella cartella `design/ispirazioni/`, oppure incollarle direttamente in chat.
- Per ognuna, una frase: **cosa ti piace** (il colore, il carattere, la forma dei tasti,
  l'animazione, l'ordine…). Vanno bene anche le cose che **non** ti piacciono.
- Bonus: nominare 2-3 app che "si sentono" come vorresti la tua.

### Fase 2 — Tre proposte (Claude, poi scelta insieme)
- Dalle ispirazioni, Claude prepara **3 direzioni diverse** della **stessa schermata**
  (Calendario, la prima pagina), con dati realistici, in chiaro e in scuro.
- Si guardano **sul telefono**. Alessandro sceglie una direzione, oppure prende pezzi da più di una.

### Fase 3 — Il "kit" del nuovo look (Claude, poi approvazione)
Una sola pagina di prova con tutti i pezzi, nella direzione scelta:
- colori (chiaro + scuro), caratteri e grandezze del testo;
- tasti, carte, campi da scrivere, fogli che salgono dal basso, etichette, numerini;
- barra in basso, barra "Parla", icone (un solo stile per tutta l'app);
- animazioni (cerchio "Fatto", "Pagato", apertura dei fogli).

Qui si risolve anche **"tutto un po' troppo grande"** (da `PRODOTTO.md` → "Da rivedere").
Alessandro approva il kit prima di toccare l'app.

### Fase 4 — Mettere in ordine i colori dell'app (Claude, non si vede)
- Oggi alcuni colori sono scritti "a mano" in punti sparsi del file: cambiando tema, quelli
  restano vecchi. Prima di applicare il nuovo look, si raccolgono tutti in un unico posto.
  L'app deve restare **identica** dopo questo passo: si controlla con foto prima/dopo.

### Fase 5 — Applicare il nuovo look, una schermata alla volta (Claude)
Ordine:
1. pezzi comuni (tasti, carte, fogli, barra in basso, barra "Parla");
2. Calendario (prima pagina);
3. Clienti e scheda cliente;
4. foglio "Nuovo cliente" / Modifica;
5. scheda del lavoro;
6. Conti;
7. Preventivi;
8. Impostazioni e Profilo;
9. notifiche, note rapide, avvisi e finestre piccole.

Dopo **ogni** schermata: build, foto in chiaro e in scuro, prova sul telefono di Alessandro,
salvataggio con git. Niente pubblicazione (push) finché Alessandro non lo dice.

### Fase 6 — Collaudo finale
- Prova completa sul telefono vero, anche all'aperto al sole.

## Stato della Fase 2 (23/11)

Tre proposte scure della prima pagina, stessa disposizione di oggi, dati inventati:
https://claude.ai/artifact/KwCRQt2kYUYwbPB5dM8jzY (copia in `design/proposte-prima-pagina/`).

| | Colore | Carattere | Carattere della proposta |
|---|---|---|---|
| **A · Bosco** | verde salvia | Manrope (quello di oggi) | la più vicina all'app attuale, rotonda, cerchio "Fatto" a contorno |
| **B · Notte** | blu notte con una luce in alto | Inter | più "tecnologica": oggi in un quadratino che brilla, barra in basso sfocata, "Fatto" quadrato |
| **C · Brace** | arancione su grigi neutri | Poppins | più morbida e grande: giorni della settimana in una pillola, data in grande, sezione attiva piena |

In tutte: niente bordo colorato a sinistra sulle carte (il colore del cliente diventa un pallino),
barra in basso a pillola che galleggia, lavori di più giorni uniti da una pillola (26-27).
**Risposta di Alessandro (23/11):** a parte i colori sono troppo simili all'app di oggi, e il colore
si cambia già dalle Impostazioni. Colore preferito: **arancione**. Il nuovo look deve cambiare
**com'è fatto** ogni pezzo (forme, calendario, carte, barra Parla, profondità, animazioni), non la
tinta. → Rifare la Fase 2: 3 proposte arancioni che differiscono per **concetto visivo**.

**Decisione (23/11): si possono cambiare le forme dei blocchi**, tenendo le stesse funzioni.
(Cambia la regola "ogni cosa resta al suo posto" del 22/11.)

### Giro 2 — 3 forme nuove, tutte arancioni (stessa pagina, scheda "Giro 2")

| | Idea | Cosa cambia rispetto a oggi |
|---|---|---|
| **A · Cruscotto** | i numeri che contano subito in vista | riquadri in alto (Ti devono, Oggi, In ritardo); Avvisi/Da confermare/Note come pillole con il nome; **settimana in una striscia** (il mese con un tocco); carte con l'ora in un riquadro e "Fatto" a destra; i giorni dopo come righe da aprire; **microfono rotondo accanto alla barra in basso** |
| **B · Linea del tempo** | sobria, quasi solo grigi, tipo agenda di carta | data enorme ("23"); Ti devono su una riga; calendario senza riquadro; **lavori su una linea del tempo** con l'ora a sinistra e un cerchio da spuntare; **casella "Dì o scrivi" fissa in basso** con dentro le 3 icone e "Parla" |
| **C · Tattile** | tasti che sembrano veri, da premere | tasti in rilievo; **ruota dei giorni** che rimpicciolisce ai lati (punto 17 dell'HANDOFF); riquadro "Oggi" con l'anello 1/3 fatti; Ti devono con una barra colorata per ritardo; "Fatto" come tasto arancione in rilievo; **microfono grande al centro della barra in basso** |

Note: in A e C profilo e impostazioni sono un solo tondo con le iniziali (da decidere).

**Scelte di Alessandro sul giro 2 (23/11):**
- Nessuna delle tre è speciale così com'è. Resta la struttura di oggi: **calendario sopra, lavori sotto**.
- I lavori come **linea del tempo** (da B) invece delle carte.
- **Tenere quello che c'è già**: niente colonna degli orari.
- Colore: **arancione**.
- Piacciono i **riquadri in alto di C** ("Oggi 330 €", "Ti devono 1.240 €"), ma andrebbero
  **in altre schede** (Conti, Clienti), non nella prima pagina.
- Proposta di Alessandro: provare lo stile **direttamente nell'app vera**.

## 4. Regole per questo lavoro

- Solo look: niente pezzi spostati, niente funzioni nuove.
- Niente librerie nuove pesanti: l'app pesa già circa 550 KB.
- Un solo stile di icone per tutta l'app.
- Prove nel browser sempre sull'indirizzo che Alessandro non sta usando (dati separati).

## 5. Domande ancora aperte (da decidere domani)

- In Impostazioni c'è già **"Colore dell'app"** (Foglia, Mare, Terracotta…). Col nuovo look resta?
  Si tiene solo il colore principale scelto, o si toglie?
- Il cerchio "Fatto" e le altre animazioni: si tengono così o si ridisegnano?
- I caratteri attuali (Bricolage Grotesque + Manrope): si decide guardando le proposte della Fase 2.
- **La rotella degli importi** (23/11, Alessandro): oggi è **più lenta della tastiera**. Da
  ripensare. Idee da valutare: tastiera dei numeri come modo principale e rotella solo per
  ritocchi piccoli; oppure togliere la rotella. Attenzione: cambiare *come si scrive* un numero
  non è solo look, quindi va deciso a parte.
- **Ispirazioni**: Mobbin gratis mostra troppo poco. Alternative gratuite: Dribbble, Pinterest,
  le foto delle app nella pagina del Play Store, foto dello schermo delle app sul telefono.
