import { useRef, useState } from 'preact/hooks';
import { creaCliente, db, eliminaCliente, modificaCliente, useDati } from '../db';
import { NOMI_TIPO, euro, normalizza, residuo, type Lavoro, type TipoCliente } from '../logica';
import { CampoTesto, FoglioPagamento, Intestazione, RigaLavoro, avvisa, indietro, vai } from '../ui';

export function ElencoClienti() {
  const [cerca, setCerca] = useState('');
  const creando = useRef(false);
  const dati = useDati(async () => {
    const [clienti, fatti] = await Promise.all([db.clienti.toArray(), db.lavori.where('stato').equals('fatto').toArray()]);
    const dovuto = new Map<string, number>();
    for (const l of fatti) dovuto.set(l.cliente_id, (dovuto.get(l.cliente_id) ?? 0) + residuo(l));
    return { clienti: clienti.sort((a, b) => a.nome.localeCompare(b.nome, 'it')), dovuto };
  });
  if (!dati) return null;
  const t = normalizza(cerca);
  const trovati = dati.clienti.filter((c) => !t || normalizza(c.nome).includes(t) || normalizza(c.indirizzo).includes(t));
  const esiste = dati.clienti.some((c) => normalizza(c.nome) === t);

  return (
    <>
      <Intestazione titolo={`Clienti (${dati.clienti.length})`} />
      <main>
        <input class="cerca" value={cerca} placeholder="Cerca o scrivi un nuovo nome…" lang="it" autoCapitalize="words"
          onInput={(e) => setCerca((e.target as HTMLInputElement).value)} />
        {t && !esiste && (
          <button class="tasto secondario" onClick={async () => {
            if (creando.current) return; // ignora i tocchi ripetuti
            creando.current = true;
            vai('/cliente/' + (await creaCliente(cerca)).id);
          }}>
            + Nuovo cliente «{cerca.trim()}»
          </button>
        )}
        {dati.clienti.length === 0 && !t && <p class="vuoto">Nessun cliente. Scrivi un nome qui sopra per crearlo.</p>}
        <div class="elenco">
          {trovati.map((c) => {
            const d = dati.dovuto.get(c.id) ?? 0;
            return (
              <a class="riga" href={'#/cliente/' + c.id} key={c.id}>
                <div class="riga-testo">
                  <div class="riga-titolo">{c.nome}</div>
                  <div class="riga-sotto"><span>{NOMI_TIPO[c.tipo]}</span>{c.indirizzo && <span>{c.indirizzo}</span>}</div>
                </div>
                {d > 0 && <strong class="importo">{euro(d)}</strong>}
              </a>
            );
          })}
        </div>
      </main>
    </>
  );
}

export function SchedaCliente({ id }: { id: string }) {
  const [pagando, setPagando] = useState<Lavoro | null>(null);
  const dati = useDati(async () => {
    const cliente = await db.clienti.get(id);
    const lavori = await db.lavori.where('cliente_id').equals(id).toArray();
    return { cliente, lavori };
  }, [id]);
  if (!dati) return null;
  const c = dati.cliente;
  if (!c) return (<><Intestazione titolo="Cliente" conIndietro /><main><p class="vuoto">Cliente non trovato.</p></main></>);

  const daPagare = dati.lavori.filter((l) => l.stato === 'fatto').sort((a, b) => a.data.localeCompare(b.data));
  const daFare = dati.lavori.filter((l) => l.stato === 'da_fare').sort((a, b) => a.data.localeCompare(b.data));
  const pagati = dati.lavori.filter((l) => l.stato === 'pagato').sort((a, b) => b.data.localeCompare(a.data));
  const totale = daPagare.reduce((s, l) => s + residuo(l), 0);
  const tipi: TipoCliente[] = ['privato', 'condominio', 'azienda'];

  return (
    <>
      <Intestazione titolo={c.nome || 'Cliente'} conIndietro />
      <main class="modulo">
        <section class="totale piccolo">
          <span>Ti deve</span>
          <strong>{euro(totale)}</strong>
        </section>
        <a class="tasto grande principale" href={'#/nuovo?cliente=' + c.id}>+ Nuovo lavoro per {c.nome}</a>

        {daPagare.length > 0 && <h2>Da farsi pagare</h2>}
        {daPagare.map((l) => (
          <RigaLavoro lavoro={l} key={l.id} azione={<button class="tasto-piccolo principale" onClick={() => setPagando(l)}>Pagato</button>} />
        ))}
        {daFare.length > 0 && <h2>Da fare</h2>}
        {daFare.map((l) => <RigaLavoro lavoro={l} key={l.id} />)}

        <h2>Dati del cliente</h2>
        <CampoTesto etichetta="Nome" valore={c.nome} controlla={(v) => (v.trim() ? null : 'Il nome non può essere vuoto')}
          onSalva={(v) => modificaCliente(c.id, { nome: v.trim() })} />
        <div class="campo">
          <span class="etichetta">Tipo</span>
          <div class="scelte">
            {tipi.map((t) => (
              <button key={t} class={c.tipo === t ? 'scelta attiva' : 'scelta'} onClick={() => modificaCliente(c.id, { tipo: t })}>{NOMI_TIPO[t]}</button>
            ))}
          </div>
        </div>
        <div class="con-tasto">
          <CampoTesto etichetta="Telefono" tipo="tel" inputMode="tel" valore={c.telefono} onSalva={(v) => modificaCliente(c.id, { telefono: v.trim() })} />
          {c.telefono && <a class="tasto-piccolo" href={'tel:' + c.telefono.replace(/[^\d+]/g, '')}>Chiama</a>}
        </div>
        <div class="con-tasto">
          <CampoTesto etichetta="Indirizzo" valore={c.indirizzo} onSalva={(v) => modificaCliente(c.id, { indirizzo: v.trim() })} />
          {c.indirizzo && <a class="tasto-piccolo" target="_blank" rel="noopener" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.indirizzo)}>Mappa</a>}
        </div>
        <CampoTesto etichetta="Note" multilinea valore={c.note} onSalva={(v) => modificaCliente(c.id, { note: v })} />

        {pagati.length > 0 && <h2>Lavori pagati ({pagati.length})</h2>}
        {pagati.map((l) => <RigaLavoro lavoro={l} key={l.id} />)}

        {dati.lavori.length === 0 && (
          <section class="azioni-in-fondo">
            <button class="tasto pericolo" onClick={async () => {
              if (!confirm(`Eliminare il cliente ${c.nome}?`)) return;
              if (await eliminaCliente(c.id)) { indietro(); avvisa('Cliente eliminato'); }
            }}>Elimina cliente</button>
          </section>
        )}
      </main>
      {pagando && <FoglioPagamento lavoro={pagando} onChiudi={() => setPagando(null)} />}
    </>
  );
}
