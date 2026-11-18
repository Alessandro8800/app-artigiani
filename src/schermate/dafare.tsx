import { db, rimettiDaFare, segnaFatto, useDati } from '../db';
import { oggi, senzaPrezzo, type Lavoro } from '../logica';
import { Intestazione, RigaLavoro, avvisa } from '../ui';

export function DaFare() {
  const dati = useDati(async () => {
    const [daFare, fatti, clienti] = await Promise.all([
      db.lavori.where('stato').equals('da_fare').sortBy('data'),
      db.lavori.where('stato').equals('fatto').toArray(),
      db.clienti.toArray(),
    ]);
    return { daFare, senza: fatti.filter(senzaPrezzo), clienti: new Map(clienti.map((c) => [c.id, c])) };
  });
  if (!dati) return null;
  const t = oggi();
  const gruppi: [string, Lavoro[]][] = [
    ['Rimasti indietro', dati.daFare.filter((l) => l.data < t)],
    ['Oggi', dati.daFare.filter((l) => l.data === t)],
    ['Prossimi', dati.daFare.filter((l) => l.data > t)],
  ];

  const fatto = async (l: Lavoro) => {
    await segnaFatto(l.id);
    avvisa('Segnato come fatto', { etichetta: 'Annulla', fai: () => rimettiDaFare(l.id) });
  };

  return (
    <>
      <Intestazione titolo={`Da fare (${dati.daFare.length})`} />
      <main>
        {dati.daFare.length === 0 && <p class="vuoto">Niente da fare in sospeso.</p>}
        {gruppi.map(([titolo, lavori]) => lavori.length > 0 && (
          <section key={titolo}>
            <h2>{titolo}</h2>
            {lavori.map((l) => (
              <RigaLavoro lavoro={l} cliente={dati.clienti.get(l.cliente_id)} key={l.id}
                azione={<button class="tasto-piccolo principale" onClick={() => fatto(l)}>Fatto</button>} />
            ))}
          </section>
        ))}
        {dati.senza.length > 0 && (
          <section>
            <h2>Fatti ma senza prezzo</h2>
            <p class="nota">Tocca il lavoro per scrivere quanto costa.</p>
            {dati.senza.map((l) => <RigaLavoro lavoro={l} cliente={dati.clienti.get(l.cliente_id)} key={l.id} />)}
          </section>
        )}
      </main>
    </>
  );
}
