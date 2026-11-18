import { useEffect, useRef, useState } from 'preact/hooks';
import { controllaBackup, esportaBackup, esportaCsv, ripristinaBackup, type FileBackup } from '../backup';
import { chiediSpazioPermanente, db, leggiImpostazione, useDati } from '../db';
import { dataBreve } from '../logica';
import { Intestazione, avvisa } from '../ui';

export function Dati() {
  const scegliFile = useRef<HTMLInputElement>(null);
  const [protetto, setProtetto] = useState<boolean | null>(null);
  useEffect(() => { chiediSpazioPermanente().then(setProtetto); }, []);
  const dati = useDati(async () => ({
    clienti: await db.clienti.count(),
    lavori: await db.lavori.count(),
    ultimo: await leggiImpostazione<string>('ultimoBackup'),
  }));

  async function importa(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    let contenuto: unknown;
    try { contenuto = JSON.parse(await file.text()); } catch { alert('Questo file non si riesce a leggere.'); return; }
    const errore = controllaBackup(contenuto);
    if (errore) { alert(errore); return; }
    const b = contenuto as FileBackup;
    const quando = new Date(b.esportato_il).toLocaleString('it-IT');
    if (!confirm(`Backup del ${quando}: ${b.clienti.length} clienti e ${b.lavori.length} lavori.\n\nI dati attuali sul telefono verranno SOSTITUITI. Continuare?`)) return;
    await ripristinaBackup(b);
    avvisa('Dati ripristinati');
  }

  return (
    <>
      <Intestazione titolo="Backup dei dati" conIndietro />
      <main class="modulo">
        <p>
          I dati sono solo su questo telefono: {dati?.clienti ?? '…'} clienti e {dati?.lavori ?? '…'} lavori.<br />
          Ultimo backup: <strong>{dati?.ultimo ? dataBreve(dati.ultimo) : 'mai'}</strong>
        </p>
        <button class="tasto grande principale" onClick={async () => {
          const esito = await esportaBackup();
          if (esito === 'scaricato') avvisa('Backup salvato nei Download');
          if (esito === 'condiviso') avvisa('Backup fatto');
        }}>Fai il backup</button>
        <p class="nota">Si apre il menu «Condividi»: mandalo a te stesso su WhatsApp, oppure salvalo su Drive o in email.</p>

        <h2>Altro</h2>
        <button class="tasto secondario" onClick={esportaCsv}>Esporta lavori per Excel (CSV)</button>
        <button class="tasto secondario" onClick={() => scegliFile.current?.click()}>Ripristina da un backup</button>
        <input ref={scegliFile} type="file" accept=".json,application/json" hidden onChange={importa} />

        {protetto === false && (
          <p class="nota">Attenzione: il telefono potrebbe cancellare i dati se resta senza spazio. Installa l'app sulla schermata Home e fai backup spesso.</p>
        )}
        <p class="nota">Non cancellare i «dati di navigazione» di Chrome per questo sito: si perderebbero i lavori.</p>
      </main>
    </>
  );
}
