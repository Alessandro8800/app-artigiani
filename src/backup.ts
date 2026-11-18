// Esportazione (backup) e importazione dei dati.
import { db, scriviImpostazione } from './db';
import { NOMI_METODO, NOMI_STATO, NOMI_TIPO, importoPerCampo, oggi, type Cliente, type Lavoro, type Pagamento } from './logica';

export interface FileBackup {
  app: 'lavori-pagamenti';
  versione: 1;
  esportato_il: string;
  clienti: Cliente[];
  lavori: Lavoro[];
  pagamenti: Pagamento[];
}

export async function creaBackup(): Promise<FileBackup> {
  return {
    app: 'lavori-pagamenti',
    versione: 1,
    esportato_il: new Date().toISOString(),
    clienti: await db.clienti.toArray(),
    lavori: await db.lavori.toArray(),
    pagamenti: await db.pagamenti.toArray(),
  };
}

/** CSV dei lavori, leggibile con Excel italiano (separatore ";" e virgola nei decimali) */
export function lavoriInCsv(b: FileBackup): string {
  const nomi = new Map(b.clienti.map((c) => [c.id, c]));
  const cella = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const righe = [['Data', 'Cliente', 'Tipo cliente', 'Descrizione', 'Importo', 'Stato', 'Pagato', 'Da pagare', 'Metodo', 'Data pagamento']];
  for (const l of [...b.lavori].sort((x, y) => x.data.localeCompare(y.data))) {
    const c = nomi.get(l.cliente_id);
    const daPagare = l.importo == null ? '' : importoPerCampo(Math.max(0, l.importo - l.importo_pagato));
    righe.push([
      l.data, c?.nome ?? '', c ? NOMI_TIPO[c.tipo] : '', l.descrizione, importoPerCampo(l.importo),
      NOMI_STATO[l.stato], importoPerCampo(l.importo_pagato), daPagare,
      l.metodo_pagamento ? NOMI_METODO[l.metodo_pagamento] : '', l.data_pagamento ?? '',
    ]);
  }
  return '﻿' + righe.map((r) => r.map(cella).join(';')).join('\r\n');
}

/** Consegna un file: con il menu "Condividi" di Android se c'è, altrimenti lo scarica */
export async function consegnaFile(nome: string, contenuto: string, tipo: string): Promise<'condiviso' | 'scaricato' | 'annullato'> {
  const file = new File([contenuto], nome, { type: tipo });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: nome });
      return 'condiviso';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'annullato';
      // se la condivisione fallisce, si scarica
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'scaricato';
}

export async function esportaBackup() {
  const b = await creaBackup();
  const esito = await consegnaFile(`backup-lavori-${oggi()}.json`, JSON.stringify(b, null, 1), 'application/json');
  if (esito !== 'annullato') await scriviImpostazione('ultimoBackup', oggi());
  return esito;
}

export async function esportaCsv() {
  return consegnaFile(`lavori-${oggi()}.csv`, lavoriInCsv(await creaBackup()), 'text/csv');
}

/** Controlla che il file sia davvero un nostro backup. Restituisce un messaggio d'errore o null. */
export function controllaBackup(dati: unknown): string | null {
  const b = dati as FileBackup;
  if (!b || typeof b !== 'object' || b.app !== 'lavori-pagamenti') return 'Questo file non è un backup di questa app.';
  if (!Array.isArray(b.clienti) || !Array.isArray(b.lavori) || !Array.isArray(b.pagamenti)) return 'Il file è rovinato o incompleto.';
  if (b.clienti.some((c) => !c.id || typeof c.nome !== 'string')) return 'Il file contiene clienti non validi.';
  if (b.lavori.some((l) => !l.id || !l.cliente_id || !l.data || !l.stato)) return 'Il file contiene lavori non validi.';
  return null;
}

/** Sostituisce TUTTI i dati con quelli del backup */
export async function ripristinaBackup(b: FileBackup) {
  await db.transaction('rw', db.clienti, db.lavori, db.pagamenti, async () => {
    await Promise.all([db.clienti.clear(), db.lavori.clear(), db.pagamenti.clear()]);
    await db.clienti.bulkAdd(b.clienti);
    await db.lavori.bulkAdd(b.lavori);
    await db.pagamenti.bulkAdd(b.pagamenti);
  });
}
