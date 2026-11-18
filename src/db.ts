// Il "magazzino" dei dati sul telefono (IndexedDB, tramite la libreria Dexie).
import Dexie, { liveQuery, type Table } from 'dexie';
import { useEffect, useState } from 'preact/hooks';
import {
  OWNER_ID, nuovoId, oggi, ricalcola,
  type Cliente, type Lavoro, type Metodo, type Pagamento, type Stato, type TipoCliente,
} from './logica';

interface Impostazione { chiave: string; valore: unknown }

class Archivio extends Dexie {
  clienti!: Table<Cliente, string>;
  lavori!: Table<Lavoro, string>;
  pagamenti!: Table<Pagamento, string>;
  impostazioni!: Table<Impostazione, string>;
  constructor() {
    super('lavori-pagamenti');
    this.version(1).stores({
      clienti: 'id, nome',
      lavori: 'id, cliente_id, stato, data',
      pagamenti: 'id, lavoro_id',
      impostazioni: 'chiave',
    });
  }
}
export const db = new Archivio();

/** Chiede al telefono di non cancellare mai i dati da solo quando manca spazio */
export async function chiediSpazioPermanente(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** Legge dal database e si aggiorna da solo quando i dati cambiano */
export function useDati<T>(lettura: () => Promise<T>, dipendenze: unknown[] = []): T | undefined {
  const [valore, setValore] = useState<T | undefined>(undefined);
  useEffect(() => {
    const s = liveQuery(lettura).subscribe({ next: setValore, error: (e) => console.error(e) });
    return () => s.unsubscribe();
  }, dipendenze);
  return valore;
}

// ---------- Clienti ----------

export async function creaCliente(nome: string, tipo: TipoCliente = 'privato'): Promise<Cliente> {
  const c: Cliente = { id: nuovoId(), owner_id: OWNER_ID, nome: nome.trim(), telefono: '', indirizzo: '', tipo, note: '' };
  await db.clienti.add(c);
  return c;
}

export async function modificaCliente(id: string, campi: Partial<Cliente>) {
  await db.clienti.update(id, campi);
}

/** Si può eliminare un cliente solo se non ha lavori */
export async function eliminaCliente(id: string): Promise<boolean> {
  if ((await db.lavori.where('cliente_id').equals(id).count()) > 0) return false;
  await db.clienti.delete(id);
  return true;
}

// ---------- Lavori ----------

export async function creaLavoro(dati: {
  cliente_id: string; descrizione: string; importo: number | null; data: string; stato?: Stato;
}): Promise<Lavoro> {
  const l: Lavoro = {
    id: nuovoId(), owner_id: OWNER_ID,
    cliente_id: dati.cliente_id, descrizione: dati.descrizione.trim(), importo: dati.importo, data: dati.data,
    stato: dati.stato ?? 'da_fare',
    importo_pagato: 0, data_pagamento: null, metodo_pagamento: null,
  };
  await db.lavori.add(l);
  return l;
}

async function salvaRicalcolato(id: string, campi: Partial<Lavoro> = {}) {
  await db.transaction('rw', db.lavori, db.pagamenti, async () => {
    const l = await db.lavori.get(id);
    if (!l) return;
    const pag = await db.pagamenti.where('lavoro_id').equals(id).toArray();
    await db.lavori.put(ricalcola({ ...l, ...campi }, pag));
  });
}

export async function modificaLavoro(id: string, campi: Partial<Lavoro>) {
  await salvaRicalcolato(id, campi);
}

export async function segnaFatto(id: string) {
  await salvaRicalcolato(id, { stato: 'fatto' });
}

/** Rimette il lavoro "da fare". Non si può se ha già dei pagamenti (prima vanno tolti). */
export async function rimettiDaFare(id: string): Promise<boolean> {
  if ((await db.pagamenti.where('lavoro_id').equals(id).count()) > 0) return false;
  await db.lavori.update(id, { stato: 'da_fare' });
  return true;
}

/**
 * Registra un pagamento (anche parziale).
 * Se il lavoro non aveva un prezzo, quello che paga il cliente diventa il prezzo.
 */
export async function registraPagamento(lavoro_id: string, importo: number, metodo: Metodo, data = oggi()) {
  await db.transaction('rw', db.lavori, db.pagamenti, async () => {
    const l = await db.lavori.get(lavoro_id);
    if (!l) return;
    await db.pagamenti.add({ id: nuovoId(), owner_id: OWNER_ID, lavoro_id, importo, data, metodo });
    const campi: Partial<Lavoro> = {};
    if (l.importo == null) campi.importo = l.importo_pagato + importo;
    if (l.stato === 'da_fare') campi.stato = 'fatto';
    const pag = await db.pagamenti.where('lavoro_id').equals(lavoro_id).toArray();
    await db.lavori.put(ricalcola({ ...l, ...campi }, pag));
  });
}

export async function eliminaPagamento(id: string) {
  const p = await db.pagamenti.get(id);
  if (!p) return;
  await db.pagamenti.delete(id);
  await salvaRicalcolato(p.lavoro_id);
}

export async function eliminaLavoro(id: string) {
  await db.transaction('rw', db.lavori, db.pagamenti, async () => {
    await db.pagamenti.where('lavoro_id').equals(id).delete();
    await db.lavori.delete(id);
  });
}

// ---------- Impostazioni ----------

export async function leggiImpostazione<T>(chiave: string): Promise<T | undefined> {
  return (await db.impostazioni.get(chiave))?.valore as T | undefined;
}
export async function scriviImpostazione(chiave: string, valore: unknown) {
  await db.impostazioni.put({ chiave, valore });
}
