import { useState } from 'preact/hooks';
import { creaLavoro } from '../db';
import { aggiungiGiorni, leggiImporto, oggi, type Stato } from '../logica';
import { Intestazione, SceltaCliente, avvisa, indietro, vai } from '../ui';

export function NuovoLavoro(props: { clienteId: string | null; data: string | null }) {
  const [clienteId, setClienteId] = useState<string | null>(props.clienteId);
  const [descrizione, setDescrizione] = useState('');
  const [importo, setImporto] = useState('');
  const [data, setData] = useState(props.data ?? oggi());
  const [errore, setErrore] = useState<string | null>(null);

  async function salva(stato: Stato) {
    if (!clienteId) { setErrore('Scegli o scrivi il cliente'); return; }
    const valore = leggiImporto(importo);
    if (Number.isNaN(valore)) { setErrore('Importo non valido (es. 35 oppure 35,50)'); return; }
    const l = await creaLavoro({ cliente_id: clienteId, descrizione, importo: valore, data, stato });
    indietro();
    avvisa(stato === 'fatto' ? 'Lavoro salvato come fatto' : 'Lavoro salvato', { etichetta: 'Apri', fai: () => vai('/lavoro/' + l.id) });
  }

  const t = oggi();
  const scorciatoie: [string, string][] = [['Oggi', t], ['Domani', aggiungiGiorni(t, 1)], ['Ieri', aggiungiGiorni(t, -1)]];

  return (
    <>
      <Intestazione titolo="Nuovo lavoro" conIndietro />
      <main class="modulo">
        <SceltaCliente clienteId={clienteId} onScegli={(id) => { setClienteId(id); setErrore(null); }} autofocus />

        <label class="campo">
          <span class="etichetta">Cosa c'è da fare <small>(puoi dettare col microfono della tastiera)</small></span>
          <textarea value={descrizione} rows={2} lang="it" autoCapitalize="sentences" placeholder="es. Taglio siepe"
            onInput={(e) => setDescrizione((e.target as HTMLTextAreaElement).value)} />
        </label>

        <label class="campo">
          <span class="etichetta">Prezzo in € <small>(se non lo sai, lascia vuoto)</small></span>
          <input value={importo} inputMode="decimal" placeholder="es. 80"
            onInput={(e) => { setImporto((e.target as HTMLInputElement).value); setErrore(null); }} />
        </label>

        <div class="campo">
          <span class="etichetta">Quando</span>
          <div class="scelte">
            {scorciatoie.map(([nome, valore]) => (
              <button key={nome} class={data === valore ? 'scelta attiva' : 'scelta'} onClick={() => setData(valore)}>{nome}</button>
            ))}
            <input type="date" value={data} aria-label="Altra data" onInput={(e) => setData((e.target as HTMLInputElement).value || t)} />
          </div>
        </div>

        {errore && <p class="errore">{errore}</p>}
        <button class="tasto grande principale" onClick={() => salva('da_fare')}>Salva</button>
        <button class="tasto secondario" onClick={() => salva('fatto')}>Salva come già fatto</button>
      </main>
    </>
  );
}
