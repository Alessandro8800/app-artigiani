import { useState } from 'preact/hooks';
import { db, eliminaLavoro, eliminaPagamento, modificaLavoro, rimettiDaFare, segnaFatto, useDati } from '../db';
import { NOMI_METODO, dataBreve, euro, importoPerCampo, leggiImporto, oggi } from '../logica';
import { Cartellino, CampoTesto, FoglioPagamento, Intestazione, SceltaCliente, avvisa, controllaImporto, indietro } from '../ui';

export function DettaglioLavoro({ id }: { id: string }) {
  const [pagando, setPagando] = useState(false);
  const dati = useDati(async () => {
    const lavoro = await db.lavori.get(id);
    const pagamenti = await db.pagamenti.where('lavoro_id').equals(id).sortBy('data');
    return { lavoro, pagamenti };
  }, [id]);
  if (!dati) return null;
  const { lavoro: l, pagamenti } = dati;
  if (!l) {
    return (<><Intestazione titolo="Lavoro" conIndietro /><main><p class="vuoto">Questo lavoro non esiste più.</p></main></>);
  }
  const resto = l.importo == null ? null : Math.max(0, l.importo - l.importo_pagato);

  return (
    <>
      <Intestazione titolo="Lavoro" conIndietro />
      <main class="modulo">
        <section class="stato-lavoro">
          <Cartellino lavoro={l} />
          {l.stato === 'pagato' && l.data_pagamento && (
            <p>Pagato {dataBreve(l.data_pagamento).toLowerCase()}{l.metodo_pagamento ? ` (${NOMI_METODO[l.metodo_pagamento].toLowerCase()})` : ''}</p>
          )}
          {l.stato === 'fatto' && resto != null && resto > 0 && <p class="da-avere">Ti deve ancora {euro(resto)}</p>}
          {l.stato === 'fatto' && l.importo == null && <p class="attenzione">Manca il prezzo</p>}
        </section>

        <div class="due-tasti">
          {l.stato === 'da_fare' && (
            <button class="tasto grande" onClick={async () => { await segnaFatto(l.id); avvisa('Segnato come fatto'); }}>Fatto</button>
          )}
          {l.stato !== 'pagato' && <button class="tasto grande principale" onClick={() => setPagando(true)}>Pagato</button>}
        </div>

        <SceltaCliente clienteId={l.cliente_id} onScegli={(c) => c && modificaLavoro(l.id, { cliente_id: c })} />
        <CampoTesto etichetta="Descrizione" multilinea valore={l.descrizione} onSalva={(v) => modificaLavoro(l.id, { descrizione: v.trim() })} />
        <CampoTesto etichetta="Prezzo in €" inputMode="decimal" segnaposto="senza prezzo" valore={importoPerCampo(l.importo)}
          controlla={controllaImporto} onSalva={(v) => modificaLavoro(l.id, { importo: leggiImporto(v) })} />
        <CampoTesto etichetta="Data" tipo="date" valore={l.data} onSalva={(v) => modificaLavoro(l.id, { data: v || oggi() })} />

        {pagamenti.length > 0 && (
          <section>
            <h2>Pagamenti</h2>
            {pagamenti.map((p) => (
              <div class="riga" key={p.id}>
                <div class="riga-testo">
                  <div class="riga-titolo">{euro(p.importo)}</div>
                  <div class="riga-sotto"><span>{dataBreve(p.data)}</span><span>{NOMI_METODO[p.metodo]}</span></div>
                </div>
                <button class="tasto-piccolo" onClick={async () => {
                  if (confirm(`Togliere il pagamento di ${euro(p.importo)}?`)) await eliminaPagamento(p.id);
                }}>Togli</button>
              </div>
            ))}
          </section>
        )}

        <section class="azioni-in-fondo">
          {l.stato === 'fatto' && pagamenti.length === 0 && (
            <button class="tasto secondario" onClick={() => rimettiDaFare(l.id)}>Rimetti «da fare»</button>
          )}
          <button class="tasto pericolo" onClick={async () => {
            if (!confirm('Eliminare questo lavoro? Non si può tornare indietro.')) return;
            await eliminaLavoro(l.id);
            indietro();
            avvisa('Lavoro eliminato');
          }}>Elimina lavoro</button>
        </section>
      </main>
      {pagando && <FoglioPagamento lavoro={l} onChiudi={() => setPagando(false)} />}
    </>
  );
}
