import { useState } from 'preact/hooks';
import { db, useDati } from '../db';
import { dataISO, oggi, type Lavoro } from '../logica';
import { Intestazione, RigaLavoro } from '../ui';

const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const GIORNI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const NOMI_GIORNO = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

// Il giorno scelto resta ricordato quando si torna indietro da un lavoro
let ultimoScelto = oggi();

export function Calendario() {
  const [scelto, setSceltoStato] = useState(ultimoScelto);
  const setScelto = (d: string) => { ultimoScelto = d; setSceltoStato(d); };
  const anno = Number(scelto.slice(0, 4));
  const mese = Number(scelto.slice(5, 7)) - 1;
  const inizio = dataISO(new Date(anno, mese, 1));
  const fine = dataISO(new Date(anno, mese + 1, 0));

  const dati = useDati(async () => {
    const [lavori, clienti] = await Promise.all([
      db.lavori.where('data').between(inizio, fine, true, true).toArray(),
      db.clienti.toArray(),
    ]);
    const perGiorno = new Map<string, Lavoro[]>();
    for (const l of lavori) perGiorno.set(l.data, [...(perGiorno.get(l.data) ?? []), l]);
    return { perGiorno, clienti: new Map(clienti.map((c) => [c.id, c])) };
  }, [inizio, fine]);

  // Caselle: spazi vuoti prima del giorno 1 (la settimana parte da lunedì), poi i giorni
  const vuoti = (new Date(anno, mese, 1).getDay() + 6) % 7;
  const giorniMese = Number(fine.slice(8));
  const caselle: (string | null)[] = [...Array(vuoti).fill(null)];
  for (let g = 1; g <= giorniMese; g++) caselle.push(dataISO(new Date(anno, mese, g)));

  const cambiaMese = (delta: number) => {
    const ultimo = new Date(anno, mese + delta + 1, 0).getDate();
    setScelto(dataISO(new Date(anno, mese + delta, Math.min(Number(scelto.slice(8)), ultimo))));
  };
  const t = oggi();
  const delGiorno = (dati?.perGiorno.get(scelto) ?? []).sort((a, b) => a.stato.localeCompare(b.stato));
  const [a, m, g] = scelto.split('-').map(Number);

  return (
    <>
      <Intestazione titolo="Calendario" destra={scelto !== t && <button class="tasto-piccolo" onClick={() => setScelto(t)}>Oggi</button>} />
      <main>
        <div class="mese">
          <button class="tasto-freccia" onClick={() => cambiaMese(-1)} aria-label="Mese prima">‹</button>
          <strong>{MESI[mese]} {anno}</strong>
          <button class="tasto-freccia" onClick={() => cambiaMese(1)} aria-label="Mese dopo">›</button>
        </div>
        <div class="griglia">
          {GIORNI.map((n, i) => <div class="nome-giorno" key={'n' + i}>{n}</div>)}
          {caselle.map((d, i) => {
            if (!d) return <div key={'v' + i} />;
            const lavori = dati?.perGiorno.get(d) ?? [];
            const daFare = lavori.filter((l) => l.stato === 'da_fare').length;
            const classi = ['giorno', d === scelto && 'scelto', d === t && 'oggi'].filter(Boolean).join(' ');
            return (
              <button key={d} class={classi} onClick={() => setScelto(d)}>
                <span>{Number(d.slice(8))}</span>
                {lavori.length > 0 && <span class={daFare > 0 ? 'pallini da-fare' : 'pallini'}>{lavori.length}</span>}
              </button>
            );
          })}
        </div>

        <h2 class="giorno-scelto">{NOMI_GIORNO.format(new Date(a, m - 1, g))}</h2>
        {delGiorno.length === 0 && <p class="nota">Nessun lavoro in questo giorno.</p>}
        {delGiorno.map((l) => <RigaLavoro lavoro={l} cliente={dati?.clienti.get(l.cliente_id)} mostraData={false} key={l.id} />)}
        <a class="tasto secondario" href={'#/nuovo?data=' + scelto}>+ Lavoro in questo giorno</a>
      </main>
    </>
  );
}
