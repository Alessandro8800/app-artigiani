# Specifica beta: app per artigiani (primo utente: giardiniere)

## Obiettivo
Un'app Android semplicissima per un artigiano che lavora da solo. Deve essere più veloce del foglio di carta: segnare un lavoro in meno di 30 secondi. Il cuore è sapere "chi mi deve soldi".

## Utente tipo
Giardiniere con circa 70-80 clienti (60 privati, 10 condomini, 1 fabbrica), circa 20 clienti fissi. Usa Android e Google Calendar. Poca dimestichezza con app complicate. Oggi segna tutto su carta e calendario.

## Flusso principale
Un lavoro cambia stato: **da fare → fatto → pagato**. Ogni passaggio è un tocco.

## Schermate (solo queste)
1. **Home "Chi mi deve soldi"**
   - In alto il totale: "Ti devono X €".
   - Sotto, lista dei clienti con importo dovuto e giorni di ritardo, i più in ritardo in cima.
   - Tasto grande "Nuovo lavoro" sempre visibile.
2. **Nuovo lavoro** (deve salvare in meno di 30 secondi)
   - Cliente (scelto da lista o creato al volo), descrizione breve, importo, data.
   - Il campo descrizione supporta la dettatura vocale della tastiera di Android (nessuna registrazione audio da riascoltare).
   - Stato iniziale: "da fare".
3. **Dettaglio lavoro**
   - Pulsanti: "Fatto" e "Pagato" (con scelta: contanti, bonifico, altro).
   - Pagamento parziale: importo pagato su totale.
4. **Clienti**
   - Elenco con nome, telefono, indirizzo, tipo (privato / condominio / azienda).
   - Scheda cliente con lavori e totale dovuto.
5. **Esporta dati**
   - Un tasto che salva tutto in un file (CSV o JSON). Serve come backup.

## Dati
Tre elenchi separati, ognuno con un id unico:
- **Cliente**: id, nome, telefono, indirizzo, tipo, note.
- **Lavoro**: id, cliente_id, descrizione, importo, data, stato (da_fare / fatto / pagato), importo_pagato, data_pagamento, metodo_pagamento.
- **Pagamento** (opzionale in beta, se serve per pagamenti parziali): id, lavoro_id, importo, data, metodo.

Ogni record ha anche un campo `owner_id` (per ora un valore fisso), per poter aggiungere più utenti in futuro senza riscrivere i dati.

## Dove stanno i dati
Sul telefono, in locale. Nessun server nella beta. Il tasto "Esporta dati" è il backup.

## Regole di design
- Il testo grande, tasti grandi, pochi colori.
- Mai più di 3 tocchi per le azioni principali.
- Se una cosa è più difficile del foglio di carta, è sbagliata.
- Lingua: italiano.

## Cosa NON fare nella beta
- Niente accesso con Google, niente account.
- Niente server, backup in cloud, più dispositivi.
- Niente fatture e niente collegamento a Oneclick.
- Niente preventivi.
- Niente solleciti automatici su WhatsApp.
- Niente importazione da Google Calendar (versione successiva).
- Niente landing page.

## Dopo la beta (ordine previsto)
1. Lavori ricorrenti per i clienti fissi (ogni N settimane, prezzo fisso).
2. Importazione da Google Calendar.
3. Promemoria all'artigiano e messaggio WhatsApp precompilato per i solleciti.
4. Riepilogo serale dei lavori per le fatture (esportazione CSV per Oneclick, da verificare).
5. Preventivi in PDF da WhatsApp.
6. Account con Google e server.

## Come si testa
Il fratello lo usa due settimane per segnare lavori e pagamenti veri. Si guarda cosa dimentica, cosa gli costa troppi tocchi, cosa non usa.

## Da decidere con Claude Code
- Tecnologia: web app installabile sul telefono (PWA, la più veloce per una beta) oppure Flutter/React Native (più vicina a un'app vera da pubblicare sul Play Store).
- Come distribuire la beta a una sola persona (file dell'app o canale di test del Play Store).
