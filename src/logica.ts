// Tipi dei dati e calcoli "puri" (senza database), così si possono testare.

export const OWNER_ID = 'locale'; // valore fisso finché non ci sono account

export type TipoCliente = 'privato' | 'condominio' | 'azienda';
export type Stato = 'da_fare' | 'fatto' | 'pagato';
export type Metodo = 'contanti' | 'bonifico' | 'altro';

export interface Cliente {
  id: string;
  owner_id: string;
  nome: string;
  telefono: string;
  indirizzo: string;
  tipo: TipoCliente;
  note: string;
}

export interface Lavoro {
  id: string;
  owner_id: string;
  cliente_id: string;
  descrizione: string;
  importo: number | null; // in centesimi; null = prezzo non ancora deciso
  data: string; // AAAA-MM-GG
  stato: Stato;
  // Riassunto dei pagamenti, ricalcolato a ogni pagamento
  importo_pagato: number;
  data_pagamento: string | null;
  metodo_pagamento: Metodo | null;
}

export interface Pagamento {
  id: string;
  owner_id: string;
  lavoro_id: string;
  importo: number; // centesimi
  data: string;
  metodo: Metodo;
}

export const NOMI_TIPO: Record<TipoCliente, string> = {
  privato: 'Privato',
  condominio: 'Condominio',
  azienda: 'Azienda',
};
export const NOMI_STATO: Record<Stato, string> = {
  da_fare: 'Da fare',
  fatto: 'Fatto',
  pagato: 'Pagato',
};
export const NOMI_METODO: Record<Metodo, string> = {
  contanti: 'Contanti',
  bonifico: 'Bonifico',
  altro: 'Altro',
};

// ---------- Soldi ----------

/** "12,50" / "12.5" / "1.200" / "€ 30" -> centesimi. Vuoto -> null. Non valido -> NaN */
export function leggiImporto(testo: string): number | null {
  let t = testo.replace(/[€\s]/g, '');
  if (t === '') return null;
  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, ''); // "1.200" = milleduecento
  }
  if (!/^\d+(\.\d{0,2})?$/.test(t)) return NaN;
  return Math.round(parseFloat(t) * 100);
}

const formatoEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
export function euro(centesimi: number): string {
  return formatoEuro.format(centesimi / 100);
}
/** Per riempire un campo di testo: 1250 -> "12,50", 3000 -> "30" */
export function importoPerCampo(centesimi: number | null): string {
  if (centesimi == null) return '';
  return centesimi % 100 === 0 ? String(centesimi / 100) : (centesimi / 100).toFixed(2).replace('.', ',');
}

// ---------- Date ----------

export function oggi(): string {
  return dataISO(new Date());
}
export function dataISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${g}`;
}
export function aggiungiGiorni(iso: string, n: number): string {
  const [a, m, g] = iso.split('-').map(Number);
  return dataISO(new Date(a, m - 1, g + n));
}
export function giorniTra(daISO: string, aISO: string): number {
  const [a1, m1, g1] = daISO.split('-').map(Number);
  const [a2, m2, g2] = aISO.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, g2) - Date.UTC(a1, m1 - 1, g1)) / 86400000);
}
const formatoData = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
export function dataBreve(iso: string): string {
  const [a, m, g] = iso.split('-').map(Number);
  const t = oggi();
  if (iso === t) return 'Oggi';
  if (iso === aggiungiGiorni(t, 1)) return 'Domani';
  if (iso === aggiungiGiorni(t, -1)) return 'Ieri';
  const testo = formatoData.format(new Date(a, m - 1, g));
  return a === Number(t.slice(0, 4)) ? testo : `${testo} ${a}`;
}

// ---------- Calcoli sui lavori ----------

/** Quanto resta da pagare di un lavoro. I lavori "da fare" non sono ancora un debito. */
export function residuo(l: Lavoro): number {
  if (l.stato !== 'fatto' || l.importo == null) return 0;
  return Math.max(0, l.importo - l.importo_pagato);
}

/** Lavoro fatto ma senza prezzo: va segnalato, altrimenti si dimentica */
export function senzaPrezzo(l: Lavoro): boolean {
  return l.stato === 'fatto' && l.importo == null;
}

/**
 * Rimette in ordine il riassunto dei pagamenti e lo stato di un lavoro.
 * Regole:
 *  - se i pagamenti coprono il prezzo, il lavoro è "pagato";
 *  - se era "pagato" ma non è più coperto (prezzo alzato, pagamento tolto), torna "fatto";
 *  - un lavoro "da fare" con dei pagamenti diventa almeno "fatto".
 */
export function ricalcola(l: Lavoro, pagamenti: Pagamento[]): Lavoro {
  const miei = pagamenti.filter((p) => p.lavoro_id === l.id).sort((a, b) => a.data.localeCompare(b.data));
  const totale = miei.reduce((s, p) => s + p.importo, 0);
  const ultimo = miei[miei.length - 1];
  let stato = l.stato;
  const coperto = l.importo != null && miei.length > 0 && totale >= l.importo;
  if (coperto) stato = 'pagato';
  else if (stato === 'pagato') stato = 'fatto';
  else if (stato === 'da_fare' && miei.length > 0) stato = 'fatto';
  return {
    ...l,
    stato,
    importo_pagato: totale,
    data_pagamento: ultimo ? ultimo.data : null,
    metodo_pagamento: ultimo ? ultimo.metodo : null,
  };
}

export interface Debito {
  cliente: Cliente;
  dovuto: number;
  giorni: number; // giorni dal lavoro non pagato più vecchio
  lavori: Lavoro[];
  senzaPrezzo: number;
}

/** Chi mi deve soldi: un elemento per cliente, i più in ritardo in cima */
export function debiti(clienti: Cliente[], lavori: Lavoro[], adesso = oggi()): Debito[] {
  const perCliente = new Map<string, Debito>();
  for (const c of clienti) perCliente.set(c.id, { cliente: c, dovuto: 0, giorni: 0, lavori: [], senzaPrezzo: 0 });
  for (const l of lavori) {
    const d = perCliente.get(l.cliente_id);
    if (!d) continue;
    const r = residuo(l);
    const sp = senzaPrezzo(l);
    if (r === 0 && !sp) continue;
    d.dovuto += r;
    if (sp) d.senzaPrezzo++;
    d.lavori.push(l);
    d.giorni = Math.max(d.giorni, giorniTra(l.data, adesso));
  }
  return [...perCliente.values()]
    .filter((d) => d.lavori.length > 0)
    .sort((a, b) => b.giorni - a.giorni || b.dovuto - a.dovuto);
}

export function nuovoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Confronto nomi senza maiuscole e accenti: "nicolò" trova "Nicolo" */
export function normalizza(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
