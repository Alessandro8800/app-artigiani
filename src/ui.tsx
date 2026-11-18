// Pezzi comuni a tutte le schermate: navigazione, avvisi, campi, scelta cliente, pagamento.
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { creaCliente, db, registraPagamento, useDati } from './db';
import {
  NOMI_METODO, NOMI_STATO, NOMI_TIPO, dataBreve, euro, importoPerCampo, leggiImporto, normalizza, oggi,
  type Cliente, type Lavoro, type Metodo,
} from './logica';

// ---------- Navigazione (indirizzi tipo "#/lavoro/123") ----------

const cronologia: string[] = [location.hash || '#/'];
addEventListener('hashchange', () => {
  const h = location.hash || '#/';
  if (cronologia.length > 1 && cronologia[cronologia.length - 2] === h) cronologia.pop();
  else cronologia.push(h);
});

export function usePercorso() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => { setHash(location.hash); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  const [percorso, query = ''] = hash.replace(/^#/, '').split('?');
  return { hash, parti: percorso.split('/').filter(Boolean), query: new URLSearchParams(query) };
}

export function vai(indirizzo: string) {
  location.hash = indirizzo;
}
export function indietro() {
  if (cronologia.length > 1) history.back();
  else location.replace('#/');
}

// ---------- Avvisi in basso ("Lavoro salvato", con eventuale "Annulla") ----------

interface Avviso { testo: string; azione?: { etichetta: string; fai: () => void } }
let mostraAvviso: ((a: Avviso) => void) | null = null;
export function avvisa(testo: string, azione?: Avviso['azione']) {
  mostraAvviso?.({ testo, azione });
}
export function Avvisi() {
  const [avviso, setAvviso] = useState<Avviso | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    mostraAvviso = (a) => {
      setAvviso(a);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setAvviso(null), a.azione ? 6000 : 3000);
    };
    return () => { mostraAvviso = null; };
  }, []);
  if (!avviso) return null;
  return (
    <div class="avviso" role="status">
      <span>{avviso.testo}</span>
      {avviso.azione && (
        <button onClick={() => { avviso.azione!.fai(); setAvviso(null); }}>{avviso.azione.etichetta}</button>
      )}
    </div>
  );
}

// ---------- Struttura della pagina ----------

export function Intestazione(props: { titolo: string; conIndietro?: boolean; destra?: ComponentChildren }) {
  return (
    <header class="intestazione">
      {props.conIndietro && (
        <button class="tasto-indietro" onClick={indietro} aria-label="Indietro">
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
      )}
      <h1>{props.titolo}</h1>
      {props.destra && <div class="intestazione-destra">{props.destra}</div>}
    </header>
  );
}

const ICONE: Record<string, string> = {
  soldi: 'M12 3v18M17 7.5c-1-1.6-2.8-2.5-5-2.5-2.8 0-5 1.5-5 3.8 0 5 10 2.6 10 7.4 0 2.2-2.2 3.8-5 3.8-2.4 0-4.3-1-5.2-2.7',
  dafare: 'M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clienti: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M16 3.5a4 4 0 010 7.5M19 15c2 .8 3 2.8 3 6',
};
export function MenuInBasso({ attiva }: { attiva: string }) {
  const voci = [
    ['', 'soldi', 'Soldi'],
    ['dafare', 'dafare', 'Da fare'],
    ['calendario', 'calendario', 'Calendario'],
    ['clienti', 'clienti', 'Clienti'],
  ];
  return (
    <nav class="menu-basso">
      {voci.map(([via, icona, nome]) => (
        <a href={'#/' + via} class={attiva === via ? 'attiva' : ''} key={via}>
          <svg viewBox="0 0 24 24" width="26" height="26"><path d={ICONE[icona]} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <span>{nome}</span>
        </a>
      ))}
    </nav>
  );
}

// ---------- Campi che si salvano da soli ----------

/** Campo di testo: salva quando si esce dal campo (non a ogni lettera) */
export function CampoTesto(props: {
  etichetta: string; valore: string; onSalva: (v: string) => void;
  multilinea?: boolean; tipo?: 'text' | 'tel' | 'date'; inputMode?: 'text' | 'tel' | 'decimal'; segnaposto?: string;
  controlla?: (v: string) => string | null;
}) {
  const [testo, setTesto] = useState(props.valore);
  const [errore, setErrore] = useState<string | null>(null);
  useEffect(() => setTesto(props.valore), [props.valore]);
  const salva = () => {
    if (testo === props.valore) return;
    const e = props.controlla?.(testo) ?? null;
    setErrore(e);
    if (!e) props.onSalva(testo);
  };
  const comuni = {
    value: testo,
    placeholder: props.segnaposto,
    onInput: (e: Event) => setTesto((e.target as HTMLInputElement).value),
    onBlur: salva,
  };
  return (
    <label class="campo">
      <span class="etichetta">{props.etichetta}</span>
      {props.multilinea
        ? <textarea {...comuni} rows={2} lang="it" autoCapitalize="sentences" />
        : <input {...comuni} type={(props.tipo ?? 'text') as 'text'} inputMode={props.inputMode} lang="it"
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />}
      {errore && <span class="errore">{errore}</span>}
    </label>
  );
}

export const controllaImporto = (v: string) => (Number.isNaN(leggiImporto(v)) ? 'Importo non valido (es. 35 oppure 35,50)' : null);

// ---------- Righe e cartellini ----------

export function Cartellino({ lavoro }: { lavoro: Lavoro }) {
  let testo = NOMI_STATO[lavoro.stato];
  if (lavoro.stato === 'fatto' && lavoro.importo != null) testo = lavoro.importo_pagato > 0 ? 'Pagato in parte' : 'Da pagare';
  return <span class={'cartellino ' + lavoro.stato}>{testo}</span>;
}

export function RigaLavoro(props: { lavoro: Lavoro; cliente?: Cliente; mostraData?: boolean; azione?: ComponentChildren }) {
  const l = props.lavoro;
  return (
    <div class="riga">
      <a class="riga-testo" href={'#/lavoro/' + l.id}>
        <div class="riga-titolo">
          {props.cliente ? props.cliente.nome : (l.descrizione || 'Lavoro')}
        </div>
        <div class="riga-sotto">
          {props.mostraData !== false && <span>{dataBreve(l.data)}</span>}
          {props.cliente && l.descrizione && <span>{l.descrizione}</span>}
          <span>{l.importo == null ? 'senza prezzo' : euro(l.importo)}</span>
          <Cartellino lavoro={l} />
        </div>
      </a>
      {props.azione}
    </div>
  );
}

// ---------- Scelta del cliente (da elenco o creato al volo) ----------

export function SceltaCliente(props: { clienteId: string | null; onScegli: (id: string | null) => void; autofocus?: boolean }) {
  const [cerca, setCerca] = useState('');
  const creando = useRef(false);
  const campo = useRef<HTMLInputElement>(null);
  const scelto = useDati(() => (props.clienteId ? db.clienti.get(props.clienteId) : Promise.resolve(undefined)), [props.clienteId]);
  const tutti = useDati(async () => {
    const clienti = await db.clienti.toArray();
    // i clienti usati più di recente vengono prima
    const ultimo = new Map<string, string>();
    for (const l of await db.lavori.toArray()) {
      if ((ultimo.get(l.cliente_id) ?? '') < l.data) ultimo.set(l.cliente_id, l.data);
    }
    return clienti.sort((a, b) => (ultimo.get(b.id) ?? '').localeCompare(ultimo.get(a.id) ?? '') || a.nome.localeCompare(b.nome));
  });
  useEffect(() => { if (props.autofocus && !props.clienteId) campo.current?.focus(); }, []);

  // Se un cliente è scelto si mostra lui (anche nell'attimo in cui si sta ancora caricando),
  // così non resta visibile il tasto "Nuovo cliente" e non si creano doppioni con un doppio tocco.
  if (props.clienteId) {
    return (
      <div class="campo">
        <span class="etichetta">Cliente</span>
        <div class="cliente-scelto">
          <strong>{scelto?.nome ?? '…'}</strong>
          <button class="tasto-piccolo" onClick={() => { props.onScegli(null); setCerca(''); setTimeout(() => campo.current?.focus(), 0); }}>Cambia</button>
        </div>
      </div>
    );
  }

  const t = normalizza(cerca);
  const trovati = (tutti ?? []).filter((c) => !t || normalizza(c.nome).includes(t)).slice(0, t ? 6 : 5);
  const esiste = (tutti ?? []).some((c) => normalizza(c.nome) === t);
  return (
    <div class="campo">
      <label class="etichetta" for="cerca-cliente">Cliente</label>
      <input id="cerca-cliente" ref={campo} value={cerca} placeholder="Scrivi il nome…" autoComplete="off" lang="it"
        autoCapitalize="words" onInput={(e) => setCerca((e.target as HTMLInputElement).value)} />
      <div class="suggerimenti">
        {trovati.map((c) => (
          <button key={c.id} onClick={() => props.onScegli(c.id)}>
            {c.nome} <small>{NOMI_TIPO[c.tipo]}</small>
          </button>
        ))}
        {t && !esiste && (
          <button class="crea" onClick={async () => {
            if (creando.current) return; // ignora i tocchi ripetuti
            creando.current = true;
            try { props.onScegli((await creaCliente(cerca)).id); } finally { creando.current = false; }
          }}>
            + Nuovo cliente «{cerca.trim()}»
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Foglio "Pagato" ----------

export function FoglioPagamento({ lavoro, onChiudi }: { lavoro: Lavoro; onChiudi: () => void }) {
  const resto = lavoro.importo == null ? null : Math.max(0, lavoro.importo - lavoro.importo_pagato);
  const [testo, setTesto] = useState(importoPerCampo(resto));
  const [data, setData] = useState(oggi());
  const [errore, setErrore] = useState<string | null>(null);
  const valore = leggiImporto(testo);
  const mancheranno = resto != null && valore != null && !Number.isNaN(valore) && valore < resto ? resto - valore : 0;

  async function paga(metodo: Metodo) {
    if (valore == null || Number.isNaN(valore)) { setErrore('Scrivi quanto ti ha dato (es. 50)'); return; }
    await registraPagamento(lavoro.id, valore, metodo, data);
    avvisa(mancheranno > 0 ? `Segnato ${euro(valore)}. Mancano ${euro(mancheranno)}` : `Pagato ${euro(valore)} (${NOMI_METODO[metodo].toLowerCase()})`);
    onChiudi();
  }

  return (
    <div class="sfondo-foglio" onClick={onChiudi}>
      <div class="foglio" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pagamento">
        <h2>Quanto ti ha dato?</h2>
        <p class="nota">
          {lavoro.importo == null
            ? 'Questo lavoro non ha un prezzo: quello che scrivi diventa il prezzo.'
            : `Prezzo ${euro(lavoro.importo)}` + (lavoro.importo_pagato ? `, già pagati ${euro(lavoro.importo_pagato)}` : '')}
        </p>
        <input class="importo-grande" value={testo} inputMode="decimal" aria-label="Importo pagato"
          onInput={(e) => { setTesto((e.target as HTMLInputElement).value); setErrore(null); }} />
        {errore && <p class="errore">{errore}</p>}
        {mancheranno > 0 && <p class="nota">Pagamento parziale: mancheranno {euro(mancheranno)}</p>}
        <div class="tre-tasti">
          {(['contanti', 'bonifico', 'altro'] as Metodo[]).map((m) => (
            <button key={m} class="tasto grande" onClick={() => paga(m)}>{NOMI_METODO[m]}</button>
          ))}
        </div>
        <label class="data-piccola">
          Data del pagamento
          <input type="date" value={data} onInput={(e) => setData((e.target as HTMLInputElement).value || oggi())} />
        </label>
        <button class="tasto secondario" onClick={onChiudi}>Annulla</button>
      </div>
    </div>
  );
}
