# Documento di prodotto

Qui teniamo cosa abbiamo capito e cosa abbiamo deciso, passo per passo.
Il codice si scrive solo dopo che una decisione è segnata qui.

---

## 0. Missione e regole (brief di Alessandro)

**Missione:** app per artigiani che lavorano da soli. Deve essere più semplice e veloce
del foglio di carta. **L'app sostituisce carta e calendario**: ha la sua agenda, non
dipende da Google Calendar (non tutti lo usano).

**Obiettivo della beta:** segnare un lavoro in meno di 30 secondi e sapere sempre
"chi mi deve soldi". Flusso: da fare → fatto → pagato, un tocco per passaggio.

**Funzioni della beta (solo queste):**
1. Home: totale "Ti devono X €" e clienti con importo dovuto, i più in ritardo in cima. Tasto grande "Nuovo lavoro".
2. Nuovo lavoro: cliente, descrizione breve, importo, data. Salvataggio rapido.
3. Dettaglio lavoro: tasti "Fatto" e "Pagato", con pagamento parziale.
4. Clienti: elenco e scheda con i lavori e il totale dovuto.
5. Esporta dati in un file, come backup.
Android, italiano, dati sul telefono.
(Aggiunte chieste da Alessandro il 18/11: agenda/calendario dentro l'app, pagina "da fare",
tutto modificabile nel tempo. Struttura da ridefinire insieme.)

**Cosa NON fare:** niente account/Google, server, fatture, preventivi, solleciti WhatsApp,
importazione da calendario, notifiche, landing page. **Non aggiungere funzioni non chieste.
Non cambiare l'architettura senza chiedere.**

**Regole di lavoro:**
- Prima del codice: piano breve, aspettare l'ok.
- Piccoli passi, una funzione alla volta; dopo ogni passo dire cosa si è fatto e come provarlo.
- Nel dubbio, o se sembra utile aggiungere qualcosa: **chiedere, non decidere da soli**.
- Codice semplice e leggibile: Alessandro dovrà capirlo e mantenerlo.

**Per il futuro (non costruire, ma non ostacolare):** lavori ricorrenti, import da Google
Calendar, solleciti WhatsApp, preventivi PDF, accesso Google e server. Quindi: elenchi
separati (clienti, lavori, pagamenti) con id unico, `owner_id` su ogni record, parte dati
separata dalle schermate.

---

## 1. Cosa abbiamo imparato dall'intervista (17/11/2026)

### Come lavora
- Il cliente **telefona** (94% passaparola e chiamate). Lui si fa spiegare il lavoro,
  poi **richiama** per fissare il giorno. Condomini: mail, chiamata o messaggio.
- 3-5 richieste nuove a settimana. 70-80 clienti: 60 privati, 10 condomini, 1 fabbrica.
- **Tutto su Google Calendar.** In ogni evento scrive: descrizione breve, **importo**,
  luogo, nome del cliente. Cioè: ogni evento è già un "lavoro".
- Lavora a volte con altri giardinieri con partita IVA.
- Circa 2 ore a settimana di carte, più una sera a settimana per le fatture.

### Dove perde
- **L'errore più frequente: dimentica di segnare l'appuntamento.**
  "Ti chiamo, dico lo scrivo dopo, e mi dimentico."
- **Oggi gli devono circa 8.000 € da circa 20 clienti.** Ritardo massimo: 8 mesi.
- Pagano: 50% subito, 30% dopo giorni o settimane, **20% solo se sollecitati**.
- Il conto di chi deve lo tiene **su un foglio di carta**.
- Sollecito: messaggio dopo 1-2 settimane, telefonata dopo 3 settimane.
  Vuole un **messaggio già pronto** (modello suo, modificabile), senza doverlo rivedere ogni volta.

### Pagamenti
- Quasi tutti **contanti** o **bonifico**. POS: 3 volte in un anno.
- Acconti e rate: quasi mai (solo lavori grossi, rari).
- **Condomini: pagano ogni 6 mesi (giugno e dicembre) con bonifico**, dopo fattura proforma.
  Per loro "non ha pagato" non vuol dire "in ritardo".

### Clienti fissi
- Una ventina, più d'estate. Prezzo fisso (cambia una volta l'anno).
- **Non li ha mai dimenticati.** Alcuni li mette già ripetuti nel calendario, gli altri chiamano.
- Lavori stagionali: chiamano loro.

### Preventivi e fatture
- Preventivi per i lavori sopra 500-1.000 €. **Circa 1 ora ciascuno**, nel gestionale.
  Idea sua: foto del giardino → preventivo "a spanne" fatto dall'AI.
- Fatture con **Oneclick** (del commercialista): una sera a settimana, circa 2 ore a ricopiare.
  Forse Oneclick importa un file Excel/CSV: da verificare.

### Cosa vuole davvero
- Priorità (sue parole, in ordine): **chi mi deve soldi**, preventivi, fatture, clienti fissi.
- Bacchetta magica: **"tenere i conti: quanto guadagno, i costi, un quadro completo".**
- Preferisce **parlare** (dettatura che diventa testo, niente audio da riascoltare) e fare foto.
- Vuole un'app "che fa tutto", ma la abbandona se **diventa più difficile del foglio**.
  Segnare un lavoro: meno di 30 secondi.
- Internet c'è quasi sempre: non serve che funzioni offline.
- Pagherebbe fino a 20 €/mese, meglio annuale, dopo una prova gratuita.

### Da avere ancora
- [ ] (facoltativo) Screenshot di 1-2 mesi del suo calendario: utili solo per vedere
      che informazioni segna su ogni lavoro, non per collegarsi a Google.

---

## 2. Decisioni prese

- **18/11 — L'app sostituisce il calendario.** Agenda propria, nessun collegamento a Google
  nella beta. L'intervista serve a capire come lavora, non a collegarsi ai suoi strumenti.
- **18/11 — Prima pagina = calendario + lavori di oggi.** Si apre e si vede dove andare.
  - In alto il calendario del mese, compatto (circa metà schermo).
  - Sotto: **Oggi** con i lavori del giorno; scorrendo **Domani** e poi il resto della settimana.
  - Toccando un giorno del calendario, i suoi lavori compaiono sotto (come nella prima versione).
  - I lavori passati restano salvati.
- **18/11 — Barra delle sezioni in basso: sì**, si tiene. Le sezioni esatte sono da definire
  (sicure: calendario come prima pagina, Clienti da migliorare).
- **18/11 — Il tasto si chiama "Nuovo cliente"** (non "Nuovo lavoro"), è sempre visibile
  sia nel Calendario sia nella sezione Clienti, e deve essere molto più veloce della prima
  versione. Il gesto completo: da progettare.
- **18/11 — Stile grafico approvato** (prova `prove/prima-pagina.html`): verde foglia,
  carte bianche arrotondate, testo grande, calendario compatto, chiaro/scuro automatico.
- **18/11 — Cerchio "Fatto"** su ogni lavoro (scritto solo "Fatto"). Al tocco il bordo si
  riempie di verde e si disegna la spunta; il lavoro si attenua e il nome viene barrato.
  ~~Ritoccando torna da fare.~~ → **aggiornato:** dopo l'animazione il lavoro **sparisce
  dall'agenda** e va nella schermata "Lavori fatti" (da fare più avanti). Animazioni da
  rifinire più avanti.
- **18/11 — Tema chiaro/scuro scelto dall'utente** in una pagina **Impostazioni** (icona,
  da fare poco più avanti). Ad Alessandro piace di più lo scuro.
- **18/11 — Sezioni nella barra in basso: Calendario e Clienti** (Memo dopo la beta).
  → **aggiornato:** + **Impostazioni** (terzo tasto, con l'ingranaggio).
- **18/11 — Pagina Impostazioni a righe che si aprono** (prima versione bocciata: "tutto
  buttato là"). Ogni riga mostra **nome + valore attuale** (es. "Tipi di cliente — Privato,
  Condominio, Fabbrica"); un tocco la apre e sotto si cambia; una riga aperta alla volta.
  Fatta seguendo le linee guida Android (panoramica a elenco, gruppi, valore sotto il nome).
  - **Abbonamento**: "Il tuo piano — Prova gratuita · in arrivo" (posto già pronto: Google Play
    chiede un link per gestire/disdire l'abbonamento nelle impostazioni). Tasti spenti per ora.
  - **Aspetto**: Tema (come il telefono / chiaro / scuro) · **Colore dell'app** (Foglia, Mare,
    Terracotta, Lavanda, Ottanio, Grafite) · Grandezza del testo · **Colori preferiti delle
    etichette** (togli con un tocco, "+" apre la tavolozza ad anello).
  - **Il mio lavoro**: Giorni in cui lavoro · Tipi di cliente · Lavori più comuni ·
    **Durate dei lavori** · **Ritardo nei pagamenti** (arancione dopo 7 g, rosso dopo 21 g,
    con − e +).
  - **I tuoi dati**: Copia dei dati (salva / ripristina, "ultima copia") · **Cancella tutti i
    dati** (doppio tocco per confermare; servirà anche per le regole di Google Play).
  - **Aiuto e informazioni**: Come si usa · Assistenza (in arrivo) · Privacy (in arrivo
    l'informativa completa, serve per Google Play) · Informazioni (versione).
  - **Notifiche** (chieste da Alessandro il 18/11, prima escluse dal brief): una riga con
    interruttori e orari — Lavori di domani (sera, 20:00) · Lavori di oggi (mattino, 7:00) ·
    Lavori non segnati (fine giornata, 19:00) · Pagamenti in ritardo · Copia dei dati
    (settimanale). Per ora **si scelgono soltanto**: vedi "Da decidere".
  - Fuori per ora: account (escluso dalla beta), lingua (solo italiano).
- **18/11 — Foglio "Nuovo cliente", ordine dei campi** ~~tipo · nome · indirizzo · telefono ·
  cosa · prezzo · quando~~ → **aggiornato:** tipo (scelte più piccole) · nome · indirizzo ·
  **quando** (con "dura" e tasto **Calendario** accanto al titolo; **4 giorni in riquadri 2×2**) ·
  cosa c'è da fare · prezzo · **telefono** (facoltativo, uno solo; per ultimo, fuori dalle Altre impostazioni) · **Altre impostazioni** (chiuse, si aprono con un tocco):
  **etichetta** (colori pronti + tasto "+"
  che apre la **tavolozza ad anello**: tante barre dal rosso al viola, 4 sfumature per tinta, grigi
  al centro; sotto si vede la linea del colore scelto, poi Salva o Indietro), **si ripete** in
  4 riquadri 2×2 come i giorni — **No · Ogni settimana · Ogni mese · Ogni anno** — ognuno con la
  prossima data ("poi 28 nov 26"), che cambia col giorno scelto; mette il lavoro in calendario per
  12 mesi. Infine **note personali** (si vedono nella scheda).
- **18/11 — Calendario a finestra**: toccando il **mese** si vedono tutti i mesi, toccando
  l'**anno** si vedono gli anni (fino a 5 anni avanti). Così un lavoro tra un anno si segna subito.
  **Uguale nel calendario della prima pagina** (lì anche i 2 anni passati, per rivedere i lavori vecchi).
  In tutti i calendari freccia ‹ · mese · anno · freccia › stanno su **un'unica barra scura**
  (restano tasti separati).
- **18/11 — "Cosa c'è da fare": i 6 lavori più comuni** come scelte rapide sopra il campo
  (Taglio erba, Potatura, Taglio siepe, Manutenzione verde, Raccolta foglie, Pulizia giardino).
  Un tocco aggiunge il lavoro al testo, un altro lo toglie; se non c'è, si scrive. In futuro
  l'elenco si cambierà dalle **Impostazioni**.
- **18/11 — "Modifica cliente" = lo stesso foglio** di Nuovo cliente, senza la parte del lavoro
  (tipo, nome, indirizzo, Altre impostazioni già aperte). Cambiando "si ripete" l'app ripete il
  prossimo lavoro del cliente (e lo dice prima di salvare).
- **18/11 — Colore del cliente**: bordo sinistro colorato sulla carta nel calendario, pallino
  accanto al nome nella lista e nella scheda.
- **18/11 — Telefoni nella scheda** con i tasti **Chiama** e **WhatsApp** (apre la chat, niente
  messaggi automatici).
- Tutto il foglio è più compatto (campi e scelte più bassi). Scrivendo il nome compaiono i clienti già esistenti
  ("Usa questo"): in quel caso spariscono tipo, indirizzo e telefono.
- **18/11 — Tipo di cliente**: una fila di scelte sopra il nome, **Privato** già scelto,
  accanto **Condominio** e **Fabbrica**. Più avanti i tipi si potranno aggiungere,
  modificare e togliere dalle **Impostazioni**.
- **18/11 — Giorno proposto**: se si tocca un giorno sul calendario e poi "Nuovo cliente",
  il foglio propone quel giorno.

- **18/11 — Giorno vuoto**: sotto "Nessun lavoro" c'è il tasto **"+ Nuovo cliente"**, che apre
  il foglio con quel giorno già scelto (solo per oggi e i giorni futuri).

- **18/11 — "Quando" nel foglio Nuovo cliente**: uno sotto l'altro i **3 giorni più liberi**
  da oggi in avanti (meno lavori da fare; domeniche escluse; a parità, il più vicino), con scritto
  "libero" o "1 lavoro". Sotto, **"Scegli sul calendario"** apre il calendario del mese con i
  pallini **in una finestra davanti** (senza scorrere); toccato il giorno, si chiude.
- **18/11 — "Quanto dura"** nel foglio, nel "Quando" (riga "Dura"). ~~Breve · ½ giornata ·
  1 giornata~~ → **aggiornato: in ore.** All'inizio: 1 ora · **2 ore** (già scelta, era "breve") ·
  4 ore · 1 giornata · 2 giorni. Una giornata = **8 ore** (si cambia). Un lavoro più lungo di una
  giornata **occupa più giorni**: continua nei giorni di lavoro dopo (salta quelli spenti) e
  compare su ognuno con "giorno 1 di 2"; il prezzo si conta solo il primo giorno.
  **Date scelte una per una** (anche non di seguito): con un lavoro di 2 o più giorni l'app
  propone giorni di seguito, ma nei riquadri del "Quando" ogni giorno si accende o si spegne con
  un tocco; sotto c'è scritto "2 giorni: Mar 24, Gio 26" (o "ne manca 1" in arancione). Nel
  calendario a finestra si toccano più date ("Scegli 2 giorni (1 di 2)"), che si chiude quando
  sono tutte scelte. Senza tutte le date, Salva lo dice. Se si ripete, le copie tengono la
  stessa distanza tra le date.
  Il giorno "migliore" è quello con **più spazio libero** dove il lavoro **ci sta tutto**
  (anche nei giorni dopo). Se cambi durata e il giorno l'avevo proposto io, ne propongo uno
  dove ci sta; se l'hai scelto tu, non lo tocco.
  A voce: **durata** + «2 ore», «un'ora», «mezza giornata», «giornata intera», «3 giorni», «breve».
- **18/11 — Impostazioni → "Durate dei lavori"**: ore in una giornata (− +); ogni durata con
  − e + (di un'ora fino a una giornata, poi di una giornata), **★ = già scelta**, ✕ per toglierla,
  "+ Aggiungi una durata". Se si parte da un giorno toccato sul calendario, quel giorno è già scelto e sta in cima.

- **18/11 — Lavoro fatto che sparisce + "Annulla": approvati.** ~~5 secondi~~ → **aggiornato:**
  "Annulla" resta **3 secondi**; in fondo alla barra una linea si riempie da sinistra a destra
  e mostra il tempo che resta.
- **18/11 — Tasto microfono** in basso nel foglio Nuovo cliente: Salva occupa 3/4,
  il microfono 1/4. Si tocca e si dicono tutti i dati in una frase; i campi si riempiono
  da soli, poi si controlla e si tocca Salva. (Come trasformare la frase nei campi: da decidere,
  vedi "Da decidere".)
- **18/11 — Sezione Clienti:**
  - In alto "Ti devono X €" e da quanti clienti; sotto la ricerca.
  - Prima **"Devono pagare"** (i più in ritardo in cima), poi **"Tutto pagato"**
    (clienti salvati senza saldi aperti, in ordine alfabetico).
  - Dentro ogni parte, gruppi per tipo: **prima i Privati, poi i Condomini, poi le Fabbriche**.
  - Etichetta del ritardo: **arancione dopo 1 settimana** (ora del messaggio),
    **rossa dopo 3 settimane** (ora di telefonare).
  - Su ogni cliente che deve c'è il cerchio **"Pagato"**: stessa animazione di "Fatto";
    il cliente passa in "Tutto pagato", con "Annulla".

- **18/11 — Dettatura con regole fisse, senza AI.** Si parla con parole chiave:
  «**nome** Luca Bassi, **indirizzo** via XXIV Maggio 34, **lavoro** tagliare la siepe,
  **prezzo** 80, **giorno** giovedì». L'ordine non conta; quello che manca resta vuoto;
  se non c'è nessuna parola chiave, tutta la frase va in "Cosa c'è da fare". L'app non salva
  da sola: riempie i campi, lui controlla e tocca Salva.

- **18/11 — Scheda cliente** (si apre toccando un cliente). Dall'alto: dati (tipo, indirizzo,
  telefono se c'è) con tasto **Modifica**; riquadro **"Ti deve X €"** (più piccolo) con il
  ritardo e i tasti **Pagato tutto** e **Pagato in parte** affiancati; **sotto i tasti**
  "Lavori per 380 € · ha già pagato 200 €". Ogni pagamento ha "Annulla".
  Poi solo **Lavori fatti**: data, lavoro, euro, e **dopo quanti giorni ha pagato** (dal giorno
  del lavoro); se non ha pagato: "da pagare · da X giorni" (arancione/rosso), oppure
  "pagati 200 € · restano 180 €". ~~Da pagare, Prossimi lavori, Storico separati~~: tolti.
- **18/11 — Dal calendario**: toccando un lavoro (fuori dal cerchio "Fatto") si apre ~~la scheda
  di quel cliente~~ → **aggiornato:** la **scheda del lavoro** (in alto il cliente, con
  "Scheda cliente ›").
- **18/11 — Scheda del lavoro, costi e utile** (le 3 risposte di Alessandro: sì a tutte).
  Si apre dal calendario, dalla scheda cliente (tocco su un lavoro fatto) e dal tasto
  **"Costi"** che compare accanto ad "Annulla" dopo aver toccato "Fatto".
  - In alto il cliente; poi il riquadro **Prezzo · Costi · Utile** (utile verde, rosso se in perdita).
  - ~~Due modi Veloce / Preciso con i tasti~~ → **aggiornato:** sezione intitolata solo
    **"Costi"**. In alto **"Costi del lavoro"**: un importo generale. Sotto, **costi rapidi**
    "+ …" da toccare: ogni tocco aggiunge una riga con il suo importo (Terra, Piante, Concime,
    Attrezzature, Noleggio, Carburante, Smaltimento — si cambiano dalle Impostazioni, "Costi
    rapidi"). Il totale = generale + righe.
  - **Personale** (sempre il primo, speciale): **ore × costo all'ora**, ognuno con − e +; toccando
    il numero si scrive a mano. Ore già proposte = durata del lavoro; costo all'ora già proposto
    dalle Impostazioni (15 €). **Niente IVA** nella beta.
  - Sotto: cosa, prezzo, giorno, durata, tutti modificabili; "Rimetti da fare" / "Segna come fatto".
  - I costi non si chiedono in "Nuovo cliente" (resta veloce).
  - **Scheda cliente**: "Ti deve" uguale; sopra i lavori fatti tre riquadri **Lavori fatti ·
    Costi · Utile** e, se mancano costi, "Costi segnati su 1 lavoro su 2". Su ogni lavoro con i
    costi: "utile 550 €".
  - I costi sono salvati voce per voce con il lavoro: serviranno alla **dashboard** del titolare.
- **18/11 — Pagina "Conti"** (la dashboard del titolare): quarto tasto nella barra in basso
  (Calendario · Clienti · **Conti** · Impostazioni). In alto "Ti devono X €".
  - **Mese / Anno** e frecce per andare indietro.
  - **Utile** in grande ("Lavori fatti 4.315 € − costi 1.215 €"); avviso se mancano costi su
    qualche lavoro (l'utile vero può essere più basso).
  - Quattro riquadri: **lavori fatti · ore di lavoro · utile all'ora · incassato** nel periodo.
  - **Utile mese per mese** (barre: 6 mesi, o i 12 mesi dell'anno; tocca una barra per il valore;
    rosso se un mese è in perdita).
  - **Dove vanno i costi**: costi per tipo, dal più grande.
  - **Clienti che rendono di più**: i primi 5 per utile; toccando si apre il cliente.
  - Si contano i lavori **fatti** nel periodo; "incassato" = pagamenti ricevuti nel periodo.
  - **Aggiunte (18/11):**
    - **Tempo medio di pagamento**: dal giorno del lavoro al giorno in cui è pagato tutto;
      sotto, diviso per tipo ("Privati 5 giorni · Fabbriche 10 giorni").
    - **Barre divise per tipo di cliente** (Privati · Condomini · Fabbriche; i tipi aggiunti
      vanno in "Altri"), con legenda; toccando una barra la legenda mostra gli euro di ognuno.
      Colori controllati col validatore (chiaro e scuro, anche per chi non distingue i colori).
      Le barre mostrano l'**utile dei lavori** (le spese dell'attività non sono di un cliente).
    - **Spese dell'attività**: quello che spendi per lavorare ma non metti sul conto dei clienti
      (Carburante, Attrezzi nuovi, Manutenzione mezzi, Assicurazione, Telefono, Commercialista,
      Altro — si cambiano dalle Impostazioni). Ogni spesa: tipo, quanto, nota, giorno e **come
      si conta**: una volta · ogni mese · ogni anno · **divisa in mesi** (ammortamento: es.
      tosaerba 1.200 € in 24 mesi = 50 € al mese). Si aggiunge con "+ Aggiungi una spesa",
      si cambia o si toglie toccandola.
    - **Utile** = lavori − costi dei lavori − spese dell'attività.
- **18/11 — Revisione critica: i 6 problemi gravi, risolti nella prova.**
  1. **Per iniziare** (si apre da "Inizia da qui" se l'app è vuota, o da Impostazioni → I tuoi
     dati): "Chi ti deve già soldi?" nome + quanto + da quanto (da poco · 1-3 mesi · più di 3
     mesi), "+ Un altro"; diventa un "debito di prima" del cliente (non va nel calendario né nei
     Conti del periodo). "Prendi dalla rubrica": sul telefono Android si scelgono i contatti e
     nome e numero si scrivono da soli.
  2. **Dati al sicuro**: l'app chiede al telefono di non cancellare i suoi dati; in cima alla prima
     pagina, se non c'è una copia da più di 7 giorni: "Salva ora" / "Dopo". *(La copia su internet
     resta da decidere, insieme a server e abbonamento.)*
  3. **Nota veloce**: tasto "Nota" accanto a "Nuovo cliente". Si scrive o si detta come viene;
     va in **"Da sistemare"** in cima alla prima pagina; toccandola si apre Nuovo cliente già
     compilato (le parole chiave si leggono). Salvato il lavoro, la nota sparisce.
     *(Nell'app vera: anche la scorciatoia tenendo premuta l'icona.)* Il foglio Nuovo cliente
     **non l'ho accorciato**: l'ordine è quello deciso insieme.
  4. **Rimasti indietro** in cima all'agenda: i lavori di giorni passati non segnati "Fatto",
     con Fatto e "sposta a Oggi · Domani · Altro giorno".
  5. **Fatto senza prezzo**: prima di segnarlo chiede "Quanto ti deve?" (oppure "Senza prezzo").
  6. **"Nuovo lavoro per questo cliente"** in cima alla scheda cliente: cliente già scelto e il suo
     ultimo lavoro già scritto (cosa, prezzo, durata).
- **18/11 — Revisione critica: i problemi medi, risolti nella prova.**
  7. **Piove?** Accanto a "Oggi": "Piove? Sposta tutto" porta i lavori da fare di oggi al
     prossimo giorno di lavoro (con Annulla). Nella scheda del lavoro: "Sposta a Oggi · Domani ·
     Giorno di lavoro dopo".
  8. **Ora** (facoltativa) nel "Quando": Qualsiasi · Mattina · Pomeriggio · Alle… (ora precisa).
     Si vede sulla carta e i lavori del giorno vanno in ordine di ora. Si cambia anche dalla scheda.
  9. **Paga ogni 6 mesi** (Altre impostazioni del cliente; acceso da solo se il tipo è
     Condominio): prima di fine giugno / fine dicembre non è in ritardo ("paga a dicembre").
  10. **Sollecito**: su chi è arancione o rosso, tasti **Messaggio** (WhatsApp col testo già
      scritto, modificabile prima di mandare) e **Chiama** (rosso quando è ora di telefonare);
      anche nella scheda cliente. Firma e testo in Impostazioni → "Messaggio per chi deve pagare".
      *(Il brief escludeva i solleciti WhatsApp: qui non si manda niente da soli, si apre solo
      WhatsApp col testo pronto.)*
  11. **Pagato in parte → "Per quale lavoro?"** (Dal più vecchio, oppure un lavoro preciso).
  12. **Utile stimato**: i lavori senza costi prendono la media degli altri (es. 38% del prezzo),
      e la pagina lo dice. **Tasse**: in Impostazioni la % da mettere da parte (0 = non mostrare);
      nei Conti "Da mettere da parte" e "Ti restano".
  13. **Ore vere** nella scheda di un lavoro fatto (− e +): le usano ore di lavoro, utile all'ora
      e il personale.
  14. **Prezzo cambiato su un lavoro che si ripete** → "Anche nei prossimi 11? Sì, tutti".
- **18/11 — Pagamenti**: un pagamento, anche parziale, **scala dal totale del cliente**, non da un
  lavoro preciso; copre i lavori partendo dal più vecchio. "Pagato" dalla lista = paga tutto.
  Non si può segnare più di quanto deve.

## Da fare — idee di Alessandro (18/11 sera), da sistemare nella prova

Prima pagina (Calendario):
1. **Via la sezione "Da sistemare" in cima**: aprendo l'app si vede **subito il calendario**.
2. **"Rimasti indietro" meno in evidenza**: ora non è una priorità.
3. **Il tasto grande "Nuovo cliente" davanti non piace**: va messo in un altro posto.
4. **"Piove? Sposta tutto" e il suo "Annulla" di 3 secondi: tolti.** Al loro posto, accanto a
   ogni titolo di giorno (Oggi, Domani, …) un **tastino "Riprogramma"**. Toccandolo, sulle carte
   di quel giorno il cerchio "Fatto" diventa un'**icona calendario**: toccandola si sceglie il
   nuovo giorno per quel lavoro.

**→ Fatto nella prova (18/11 sera):**
- In cima niente: si apre sul calendario. (Resta solo "Inizia da qui" quando l'app è vuota.)
  **Avviso della copia dei dati tolto** per ora.
- **Sotto il calendario, al centro** (il posto più comodo col pollice), una riga di tasti:
  **Nuovo cliente** (metà riga) · **Note** (con il numerino delle note salvate) ·
  **Indietro** (lavori rimasti indietro, numerino arancione). Il tasto grande fisso in basso è tolto.
  In Clienti la stessa riga sotto la ricerca: Nuovo cliente · Note.
- **Note**: toccando "Note" si scrive una nota nuova e si vedono quelle salvate; toccandone una
  diventa un lavoro (Nuovo cliente già compilato).
- **Indietro**: una finestra con i lavori non segnati, ognuno con "Fatto" e "Sposta a Oggi ·
  Domani · Altro giorno". Non c'è più la sezione rossa in cima all'agenda.
- **"Riprogramma"** accanto a ogni giorno con lavori (azzurro se è prevista pioggia): il cerchio
  "Fatto" diventa un **calendario "Sposta"**: toccandolo si apre il **calendario a finestra**
  ("Sposta: nome del cliente"), si tocca il giorno e il lavoro è riprogrammato; "Fine" per uscire.
  Anche "Altro giorno" nella finestra Indietro apre lo stesso calendario.
- **"Mostra altro"** in fondo all'agenda: dopo la settimana si vedono i **prossimi due mesi**
  (oltre la settimana solo i giorni con lavori, per non riempire di giorni vuoti); poi "Mostra meno".
- **Giorni sempre con il mese**: "Venerdì 20 novembre" (nei riquadri "Sab 21 nov"). Nome del giorno e
  **"Riprogramma" sulla stessa riga**; sotto, piccolo, "1 lavoro · 300 €" e l'eventuale pioggia. "Piove? Sposta tutto" e il suo Annulla di 3 secondi: tolti.

## Squadra di agenti (decisa il 18/11, da creare il 19/11)

Rapporto: `reports/Squadra di agenti per la v1.md`. Un solo **costruttore** che scrive il codice
(la sessione principale) + **revisore** (solo lettura, confronta con PRODOTTO.md e la prova) +
**collaudatore** (build, test, foto a misura di telefono, tasti grandi, contrasto) +
**esploratore** (ricerche). Sicurezza come ruolo a parte solo con server e account.
Ordine: frasi di "fatto" approvate → dati e calcoli con test → colori e pezzi comuni → schermate
una alla volta → offline e installazione → prova sul telefono.

## Da decidere

- **18/11 — Deciso da Alessandro: dopo la beta l'app avrà un server.** Quindi dove si salvano
  i dati nella beta conta poco (copia su internet, notifiche vere e abbonamento arriveranno col
  server).
- **18/11 — Meteo nel calendario: fatto nella prova** (condizione di Alessandro: solo se gratis
  per sempre). Open-Meteo è gratis solo per uso non commerciale → scartato. Scelto **MET Norway**
  (istituto meteorologico norvegese, pubblico): gratis **anche per uso commerciale**, licenza
  CC BY 4.0 (basta citarlo), niente chiave. Limiti: previsioni **9 giorni**; per l'Italia dà i
  **millimetri** di pioggia, non la probabilità in %; nessuna garanzia di servizio; con molti
  utenti serve passare dal nostro server (che tiene una copia). *(Nessun servizio può promettere
  "gratis per sempre": se cambiassero le regole, si passa a un altro.)*
  - Pioggia nelle ore di lavoro 7-19: **azzurro chiaro** = possibile (da 0,5 mm), **azzurro
    forte** = pioggia (da 4 mm), sempre con una **goccia** accanto al numero.
  - Nell'agenda, sotto il giorno: "Pioggia · 4,2 mm"; "Piove? Sposta tutto" si evidenzia se oggi piove.
  - Nel "Quando": goccia e mm sui riquadri dei giorni proposti.
  - Impostazioni → "Meteo: zona di lavoro" (nella prova Monza; "Usa dove sono adesso"; "Aggiorna").

- **Come far arrivare le notifiche.** Un'app web installata (come la nostra) può mostrare
  notifiche, ma per farle arrivare **all'ora giusta anche ad app chiusa** su Android serve un
  piccolo server che le invii (oggi non ne abbiamo: dati solo sul telefono), oppure un'app
  Android "vera" dal Play Store. Da scegliere quando costruiamo l'app.


## Da rivedere

- **Tutto un po' troppo grande nell'app** (Alessandro, 18/11): da rimpicciolire in generale.
- **Altre impostazioni, proposta da decidere**: prezzo fisso (si scrive da solo). ("Paga ogni 6 mesi": fatto.)
- Colore per tipo (idea sotto) e colore per cliente: tenerli tutti e due? Da decidere.

- **Dettatura senza parole chiave** (es. «Gino, 80 euro, taglio, via dei cipressi»): oggi
  finisce tutto in "Cosa c'è da fare". Da migliorare col tempo, sempre senza AI, riconoscendo
  i dati dalla forma (numero con "euro" = prezzo, "via/piazza/corso" = indirizzo, nome di un
  cliente già salvato = nome). Utile intanto: lo schema delle parole chiave mostrato quando
  si apre il microfono.
- **Scelta del tipo di cliente**: forse più piccola; da fare una ricerca su come la fanno
  le app migliori. Per ora resta così.

## Idee per più avanti (non costruire ora)


- **Colore per tipo di cliente**: il bordo della carta del lavoro colorato secondo il tipo
  (es. privati verde, condomini blu, fabbriche rosso).

## Dopo la beta (idee raccolte, NON costruire ora)

- **Abbonamento a pagamento** (mensile o annuale, dopo una prova gratuita; dall'intervista:
  fino a 20 €/mese, meglio annuale). Da pensare: cosa resta gratis, quanto dura la prova,
  pagamento con Google Play. Quando ci sarà l'account: Google Play chiede di poterlo
  **cancellare** dall'app e da una pagina web, e un'**informativa privacy**.

- **Iscrizione** con Google o email al primo avvio.
- ~~Costi sul singolo lavoro e pagina report~~ → fatti (vedi decisioni: scheda del lavoro e pagina Conti).
- **Pagina Memo** (idea del fratello): promemoria ricorrenti con notifica, es. pulire il
  tosaerba una volta l'anno, la motosega ogni 6 mesi.

---

## 3. Domande aperte

_(vedi la conversazione in corso)_
