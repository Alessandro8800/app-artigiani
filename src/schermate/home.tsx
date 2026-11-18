import { db, leggiImpostazione, useDati } from '../db';
import { debiti, euro, giorniTra, oggi } from '../logica';
import { Intestazione } from '../ui';

export function Home() {
  const dati = useDati(async () => {
    const [clienti, fatti, quanti, ultimoBackup] = await Promise.all([
      db.clienti.toArray(),
      db.lavori.where('stato').equals('fatto').toArray(),
      db.lavori.count(),
      leggiImpostazione<string>('ultimoBackup'),
    ]);
    return { elenco: debiti(clienti, fatti), quanti, ultimoBackup };
  });
  if (!dati) return null;
  const totale = dati.elenco.reduce((s, d) => s + d.dovuto, 0);
  const serveBackup = dati.quanti > 0 && (!dati.ultimoBackup || giorniTra(dati.ultimoBackup, oggi()) >= 7);

  return (
    <>
      <Intestazione titolo="Chi mi deve soldi" destra={<a class="tasto-piccolo" href="#/dati">Backup</a>} />
      <main>
        {serveBackup && (
          <a class="banner" href="#/dati">
            {dati.ultimoBackup ? `Ultimo backup ${giorniTra(dati.ultimoBackup, oggi())} giorni fa.` : 'Non hai ancora fatto un backup.'}{' '}
            <u>Fallo ora</u>
          </a>
        )}
        <section class="totale">
          <span>Ti devono</span>
          <strong>{euro(totale)}</strong>
        </section>

        {dati.elenco.length === 0 ? (
          <p class="vuoto">
            {dati.quanti === 0 ? 'Nessun lavoro segnato. Tocca «Nuovo lavoro» per iniziare.' : 'Nessuno ti deve soldi.'}
          </p>
        ) : (
          <div class="elenco">
            {dati.elenco.map((d) => (
              <a class="riga debito" href={'#/cliente/' + d.cliente.id} key={d.cliente.id}>
                <div class="riga-testo">
                  <div class="riga-titolo">{d.cliente.nome}</div>
                  <div class="riga-sotto">
                    <span class={d.giorni >= 30 ? 'ritardo forte' : 'ritardo'}>
                      {d.giorni === 0 ? 'da oggi' : d.giorni === 1 ? 'da 1 giorno' : `da ${d.giorni} giorni`}
                    </span>
                    <span>{d.lavori.length === 1 ? '1 lavoro' : `${d.lavori.length} lavori`}</span>
                    {d.senzaPrezzo > 0 && <span class="attenzione">{d.senzaPrezzo} senza prezzo</span>}
                  </div>
                </div>
                <strong class="importo">{euro(d.dovuto)}</strong>
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
