// Test manuale dell'AI vocale — app artigiani
// Prova la VERA funzione categorizzaVoceAI di index.html (stesso prompt dell'app) sulle frasi qui sotto.
// Uso: node src/test-ai-v2.mjs   (serve ANTHROPIC_API_KEY nel file .env, che non va mai su git)
// I risultati dell'AI non sono sempre identici: è una prova da guardare a occhio, non un test automatico.

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CARTELLA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Chiave dal file .env
const ANTHROPIC_KEY = readFileSync(path.join(CARTELLA, '.env'), 'utf8').match(/ANTHROPIC_API_KEY=(.+)/)?.[1]?.trim();
if (!ANTHROPIC_KEY) { console.error('Chiave non trovata in .env (riga ANTHROPIC_API_KEY=...)'); process.exit(1); }

// Prende categorizzaVoceAI direttamente da index.html: si prova sempre il prompt in uso
const html = readFileSync(path.join(CARTELLA, 'index.html'), 'utf8');
const inizio = html.indexOf('async function categorizzaVoceAI');
const chiusura = inizio < 0 ? null : /\r?\n\}\r?\n/.exec(html.slice(inizio)); // la "}" a inizio riga chiude la funzione
if (!chiusura) { console.error('categorizzaVoceAI non trovata in index.html'); process.exit(1); }
const categorizzaVoceAI = eval('(' + html.slice(inizio, inizio + chiusura.index + chiusura[0].length).trim() + ')');

// Le vecchie categorie dell'elenco → i 5 tipi del nuovo schema
const MAPPA = { cliente: 'cliente', riprogramma: 'riprogramma', paga: 'pagamento', costo: 'costo', 'nota-cliente': 'nota', calendario: 'nota', 'nota-rapida': 'nota' };

// Frasi con il tipo atteso (nomi delle vecchie categorie, tradotti da MAPPA)
const FRASI = [
  // ---- cliente: nuovo lavoro da programmare ----
  { frase: 'domani Villa Verdi, potatura alberi', atteso: 'cliente' },
  { frase: 'lunedì Sig. Rossi, taglio siepi', atteso: 'cliente' },
  { frase: 'Marta Ferri martedì mattina, diserbo', atteso: 'cliente' },
  { frase: 'mercoledì prossimo Condominio Aurora, pulizia aiuole 150 euro', atteso: 'cliente' },
  { frase: 'Villa Verdi venerdì, stendere concime, 80 euro', atteso: 'cliente' },
  { frase: 'Marco Brambilla giovedì, manutenzione giardino completo', atteso: 'cliente' },
  { frase: 'mi ha chiamato un nuovo cliente, si chiama Dott. Neri, vuole la potatura', atteso: 'cliente' },
  { frase: 'nuovo cliente: famiglia Bianchi, via Roma 5, taglio prato ogni 15 giorni', atteso: 'cliente' },

  // ---- riprogramma: spostare un lavoro già in agenda ----
  { frase: 'sposta Sig. Rossi a giovedì', atteso: 'riprogramma' },
  { frase: 'Villa Verdi non può venire, spostala a settimana prossima', atteso: 'riprogramma' },
  { frase: 'posticipa Marta Ferri di una settimana', atteso: 'riprogramma' },
  { frase: 'Marco Brambilla ha disdetto, rimanda a dicembre', atteso: 'riprogramma' },
  { frase: 'Condominio Le Palme ha annullato, cambia data', atteso: 'riprogramma' },
  { frase: 'anticipate Villa Verdi a lunedì', atteso: 'riprogramma' },
  { frase: 'Villa Verdi ha chiamato, vuole spostare a giovedì', atteso: 'riprogramma' },
  { frase: 'Sig. Rossi ha disdetto per mercoledì, lo rimando a venerdì', atteso: 'riprogramma' },
  { frase: 'Marta Ferri ha rinviato, non può il 27, la sposto alla settimana dopo', atteso: 'riprogramma' },

  // ---- paga: pagamento ricevuto ----
  { frase: 'Villa Verdi ha pagato', atteso: 'paga' },
  { frase: 'Sig. Rossi mi ha dato 150 euro in contanti', atteso: 'paga' },
  { frase: 'Marco Brambilla ha fatto il bonifico', atteso: 'paga' },
  { frase: 'Marta Ferri ha saldato tutto', atteso: 'paga' },
  { frase: 'Condominio Aurora acconto 200 euro', atteso: 'paga' },
  { frase: 'mi ha pagato Condominio Le Palme, 90 euro', atteso: 'paga' },
  { frase: 'Sig. Rossi ha pagato la metà, 75 euro', atteso: 'paga' },

  // ---- costo: spesa sostenuta dal giardiniere ----
  { frase: 'carburante 45 euro', atteso: 'costo' },
  { frase: 'ho comprato concime per 30 euro', atteso: 'costo' },
  { frase: 'spesa attrezzi 85 euro', atteso: 'costo' },
  { frase: 'noleggio fresa 60 euro', atteso: 'costo' },
  { frase: 'sacchi per foglie 12 euro', atteso: 'costo' },
  { frase: 'ho preso benzina, 55 euro', atteso: 'costo' },

  // ---- nota-cliente: info su un cliente in rubrica ----
  { frase: 'Villa Verdi: cancello verde, codice 1847', atteso: 'nota-cliente' },
  { frase: 'Sig. Rossi ha un cane aggressivo, fare attenzione', atteso: 'nota-cliente' },
  { frase: 'Marta Ferri preferisce le mattine', atteso: 'nota-cliente' },
  { frase: 'Condominio Aurora: citofono rotto, chiamare prima', atteso: 'nota-cliente' },
  { frase: 'Marco Brambilla vuole sempre preventivo scritto prima', atteso: 'nota-cliente' },
  { frase: 'Villa Verdi mi deve ancora 200 euro di ottobre', atteso: 'paga' }, // regola 3: soldi = pagamento da verificare,
  { frase: 'Sig. Rossi vuole che gli mandiamo sempre un messaggio il giorno prima', atteso: 'nota-cliente' },

  // ---- calendario: appuntamento personale senza cliente ----
  { frase: 'ricorda martedì alle 10 appuntamento commercialista', atteso: 'calendario' },
  { frase: 'promemoria giovedì, fare benzina', atteso: 'calendario' },
  { frase: 'venerdì mattina visita medica', atteso: 'calendario' },
  { frase: '21 novembre ore 9 appuntamento banca', atteso: 'calendario' },
  { frase: 'appuntamento dal dentista lunedì mattina', atteso: 'calendario' },
  { frase: 'lunedì sono libero', atteso: 'calendario' },

  // ---- nota-rapida: appunto generico senza cliente ----
  { frase: 'comprare guanti nuovi', atteso: 'nota-rapida' },
  { frase: 'chiamare il fornitore di attrezzatura', atteso: 'nota-rapida' },
  { frase: 'controllare la pompa dell\'acqua', atteso: 'nota-rapida' },
  { frase: 'il vicino di Villa Verdi ha chiesto un biglietto da visita', atteso: 'nota-rapida' },

  // ---- casi ambigui / difficili ----
  // spesa "per" un cliente = costo (io ho speso, non il cliente ha pagato)
  { frase: '50 euro di terra e piante per Marta Ferri', atteso: 'costo' },
  { frase: 'comprato fertilizzante 25 euro per il giardino di Villa Verdi', atteso: 'costo' },
  { frase: 'ho speso 80 euro per i materiali del Sig. Rossi', atteso: 'costo' },

  // cliente in rubrica menzionato ma nessun lavoro da programmare
  { frase: 'Villa Verdi ha chiamato per sapere i prezzi', atteso: 'nota-cliente' },
  { frase: 'Marta Ferri non risponde al telefono', atteso: 'nota-cliente' },

  // nuova richiesta di lavoro da un cliente già in rubrica, frase ambigua
  { frase: 'Villa Verdi vuole anche il diserbo questa volta', atteso: 'cliente' },
  { frase: 'Condominio Le Palme chiede se possiamo fare anche la potatura', atteso: 'cliente' },
];
// Frasi con più operazioni: atteso = i tipi, nell'ordine
const MULTI = [
  { frase: 'domani da Mario taglio prato, Rossi mi ha pagato 200, venerdì i guanti', atteso: ['cliente', 'pagamento', 'nota'] },
  { frase: 'sposta Villa Verdi a lunedì e ho speso 40 euro di benzina', atteso: ['riprogramma', 'costo'] },
  { frase: 'Marta Ferri mi ha dato 80 euro, poi Brambilla vuole la potatura il 3 dicembre', atteso: ['pagamento', 'cliente'] },
  { frase: 'ricordami di chiamare il fornitore e segna che Condominio Aurora deve ancora 300 euro', atteso: ['nota', 'pagamento'] },
];

const dettagli = o => [
  o.nome && `nome=${o.nome}`, o.lavoro && `lavoro=${o.lavoro}`, o.data && `data=${o.data}`,
  o.importo != null && `€${o.importo}`, o.indirizzo && `via=${o.indirizzo}`, o.ora && `ora=${o.ora}`,
  o.ore != null && `ore=${o.ore}`, o.testo && `testo="${o.testo}"`,
  o.missing_fields?.length && `MANCA=${o.missing_fields.join(',')}`,
].filter(Boolean).join('  ');

async function main() {
  console.log(`\n${'='.repeat(70)}\nTEST AI VOCALE — prompt di index.html — ${new Date().toLocaleDateString('it-IT')}\n${'='.repeat(70)}\n`);
  let ok = 0, errori = 0;
  const fallimenti = [];

  for (let i = 0; i < FRASI.length; i++) {
    const { frase, atteso } = FRASI[i];
    const att = MAPPA[atteso] || atteso;
    const n = `[${String(i + 1).padStart(2, '0')}]`;
    try {
      const r = await categorizzaVoceAI(frase);
      if (r._fallback) { errori++; console.log(`${n} ⚠️  risposta illeggibile → nota grezza  "${frase}"`); continue; }
      const tipi = r.operations.map(o => o.tipo);
      if (tipi.length === 1 && tipi[0] === att) { ok++; console.log(`${n} ✅ ${att.padEnd(12)} "${frase}"`); }
      else { fallimenti.push({ n, frase, att, tipi }); console.log(`${n} ❌ ${tipi.join('+').padEnd(12)} (atteso: ${att}) "${frase}"`); }
      for (const o of r.operations) console.log(`        ${dettagli(o)}`);
    } catch (e) {
      errori++;
      console.log(`${n} ⚠️  ERRORE: ${e.message} — "${frase}"`);
    }
  }

  console.log(`\nMULTI-OPERAZIONE:`);
  let okMulti = 0;
  for (const { frase, atteso } of MULTI) {
    try {
      const r = await categorizzaVoceAI(frase);
      const tipi = r.operations.map(o => o.tipo);
      const giusto = JSON.stringify(tipi) === JSON.stringify(atteso);
      if (giusto) okMulti++;
      console.log(`${giusto ? '✅' : '❌'} ${tipi.join(' + ')}${giusto ? '' : `  (atteso: ${atteso.join(' + ')})`}  "${frase}"`);
      for (const o of r.operations) console.log(`        ${o.tipo.padEnd(12)} ${dettagli(o)}`);
    } catch (e) {
      console.log(`⚠️  ERRORE: ${e.message} — "${frase}"`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`FRASI SINGOLE: ${ok}/${FRASI.length} come attese, ${errori} errori`);
  console.log(`MULTI-OPERAZIONE: ${okMulti}/${MULTI.length} come attese`);
  if (fallimenti.length) {
    console.log(`\nDA GUARDARE:`);
    for (const f of fallimenti) console.log(`  ${f.n} "${f.frase}"  atteso ${f.att} → ottenuto ${f.tipi.join('+')}`);
  }
  console.log('');
}

main().catch(console.error);
