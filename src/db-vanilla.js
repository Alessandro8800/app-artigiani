/**
 * db-vanilla.js — layer dati per index.html (vanilla JS, no TypeScript)
 *
 * Come usarlo in index.html:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/dexie/4.0.8/dexie.min.js"></script>
 *   <script src="src/db-vanilla.js"></script>
 *   <script>
 *     await DB.inizia();
 *     const clienti = await DB.caricaClienti();
 *   </script>
 *
 * Tutti gli importi sono in CENTESIMI (numeri interi).
 * Le date sono stringhe 'AAAA-MM-GG'.
 */

'use strict';

const DB = (() => {

  // ---------- Costanti ----------

  const OWNER_ID = 'locale';

  // ---------- Helpers interni ----------

  function nuovoId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function oggi() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const g = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${g}`;
  }

  /**
   * Ricalcola stato e riassunto pagamenti di un lavoro.
   * @param {object} lavoro
   * @param {object[]} pagamenti - tutti i pagamenti del lavoro
   * @returns {object} lavoro aggiornato
   */
  function ricalcola(lavoro, pagamenti) {
    const miei = pagamenti
      .filter(p => p.lavoro_id === lavoro.id)
      .sort((a, b) => a.data.localeCompare(b.data));
    const totale = miei.reduce((s, p) => s + p.importo, 0);
    const ultimo = miei[miei.length - 1];
    let stato = lavoro.stato;
    const coperto = lavoro.importo != null && miei.length > 0 && totale >= lavoro.importo;
    if (coperto) stato = 'pagato';
    else if (stato === 'pagato') stato = 'fatto';
    else if (stato === 'da_fare' && miei.length > 0) stato = 'fatto';
    return {
      ...lavoro,
      stato,
      importo_pagato: totale,
      data_pagamento: ultimo ? ultimo.data : null,
      metodo_pagamento: ultimo ? ultimo.metodo : null,
    };
  }

  // ---------- Istanza Dexie ----------

  let _db = null;

  function getDb() {
    if (!_db) throw new Error('DB non inizializzato. Chiama await DB.inizia() prima.');
    return _db;
  }

  // ---------- Inizializzazione ----------

  /**
   * Apre (o crea) il database IndexedDB.
   * Va chiamata una volta all'avvio, prima di qualsiasi altra funzione.
   * @returns {Promise<void>}
   */
  async function inizia() {
    if (_db) return;
    _db = new Dexie('lavori-pagamenti');
    _db.version(1).stores({
      clienti:     'id, nome',
      lavori:      'id, cliente_id, stato, data',
      pagamenti:   'id, lavoro_id',
      impostazioni: 'chiave',
    });
    await _db.open();
  }

  /**
   * Chiede al telefono di non cancellare mai i dati da solo quando manca spazio.
   * @returns {Promise<boolean>}
   */
  async function chiediSpazioPermanente() {
    try {
      if (!navigator.storage?.persist) return false;
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }

  // ---------- Clienti ----------

  /**
   * Crea un nuovo cliente e lo salva.
   * @param {string} nome
   * @param {'privato'|'condominio'|'azienda'} [tipo='privato']
   * @returns {Promise<object>} cliente creato
   */
  async function creaCliente(nome, tipo = 'privato') {
    const c = {
      id: nuovoId(),
      owner_id: OWNER_ID,
      nome: nome.trim(),
      telefono: '',
      indirizzo: '',
      tipo,
      note: '',
    };
    await getDb().clienti.add(c);
    return c;
  }

  /**
   * Modifica un cliente esistente.
   * @param {string} id
   * @param {object} campi - solo i campi da aggiornare
   */
  async function modificaCliente(id, campi) {
    await getDb().clienti.update(id, campi);
  }

  /**
   * Elimina un cliente. Restituisce false se ha ancora dei lavori.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async function eliminaCliente(id) {
    const db = getDb();
    if ((await db.lavori.where('cliente_id').equals(id).count()) > 0) return false;
    await db.clienti.delete(id);
    return true;
  }

  /**
   * Legge tutti i clienti, ordinati per nome.
   * @returns {Promise<object[]>}
   */
  async function caricaClienti() {
    return getDb().clienti.orderBy('nome').toArray();
  }

  /**
   * Cerca clienti per nome (ricerca parziale, senza accenti).
   * @param {string} testo
   * @returns {Promise<object[]>}
   */
  async function cercaCliente(testo) {
    const normalizza = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const q = normalizza(testo);
    const tutti = await caricaClienti();
    return tutti.filter(c => normalizza(c.nome).includes(q));
  }

  /**
   * Restituisce un array di nomi clienti, utile per il prompt AI vocale.
   * @returns {Promise<string[]>}
   */
  async function clientiPerVoice() {
    const clienti = await caricaClienti();
    return clienti.map(c => c.nome);
  }

  // ---------- Lavori ----------

  /**
   * Crea un nuovo lavoro.
   * @param {{cliente_id:string, descrizione:string, importo:number|null, data:string, stato?:string}} dati
   * @returns {Promise<object>} lavoro creato
   */
  async function creaLavoro(dati) {
    const l = {
      id: nuovoId(),
      owner_id: OWNER_ID,
      cliente_id: dati.cliente_id,
      descrizione: dati.descrizione.trim(),
      importo: dati.importo ?? null,
      data: dati.data,
      stato: dati.stato ?? 'da_fare',
      importo_pagato: 0,
      data_pagamento: null,
      metodo_pagamento: null,
    };
    await getDb().lavori.add(l);
    return l;
  }

  async function _salvaRicalcolato(id, campiExtra = {}) {
    const db = getDb();
    await db.transaction('rw', db.lavori, db.pagamenti, async () => {
      const l = await db.lavori.get(id);
      if (!l) return;
      const pag = await db.pagamenti.where('lavoro_id').equals(id).toArray();
      await db.lavori.put(ricalcola({ ...l, ...campiExtra }, pag));
    });
  }

  /**
   * Modifica un lavoro esistente (ricalcola automaticamente stato e pagato).
   * @param {string} id
   * @param {object} campi - solo i campi da aggiornare
   */
  async function modificaLavoro(id, campi) {
    await _salvaRicalcolato(id, campi);
  }

  /**
   * Segna un lavoro come "fatto".
   * @param {string} id
   */
  async function segnaFatto(id) {
    await _salvaRicalcolato(id, { stato: 'fatto' });
  }

  /**
   * Rimette un lavoro "da fare". Fallisce (false) se ha già pagamenti.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async function rimettiDaFare(id) {
    const db = getDb();
    if ((await db.pagamenti.where('lavoro_id').equals(id).count()) > 0) return false;
    await db.lavori.update(id, { stato: 'da_fare' });
    return true;
  }

  /**
   * Legge tutti i lavori, opzionalmente filtrati per cliente_id o stato.
   * @param {{cliente_id?:string, stato?:string}} [filtro]
   * @returns {Promise<object[]>}
   */
  async function caricaLavori(filtro = {}) {
    let q = getDb().lavori.orderBy('data');
    if (filtro.cliente_id) q = getDb().lavori.where('cliente_id').equals(filtro.cliente_id);
    if (filtro.stato) q = getDb().lavori.where('stato').equals(filtro.stato);
    return q.reverse().toArray();
  }

  // ---------- Pagamenti ----------

  /**
   * Registra un pagamento (anche parziale).
   * Se il lavoro non aveva prezzo, lo imposta alla somma dei pagamenti.
   * @param {string} lavoro_id
   * @param {number} importo - in centesimi
   * @param {'contanti'|'bonifico'|'altro'} metodo
   * @param {string} [data] - AAAA-MM-GG, default oggi
   */
  async function registraPagamento(lavoro_id, importo, metodo, data = oggi()) {
    const db = getDb();
    await db.transaction('rw', db.lavori, db.pagamenti, async () => {
      const l = await db.lavori.get(lavoro_id);
      if (!l) return;
      await db.pagamenti.add({
        id: nuovoId(),
        owner_id: OWNER_ID,
        lavoro_id,
        importo,
        data,
        metodo,
      });
      const campi = {};
      if (l.importo == null) campi.importo = l.importo_pagato + importo;
      if (l.stato === 'da_fare') campi.stato = 'fatto';
      const pag = await db.pagamenti.where('lavoro_id').equals(lavoro_id).toArray();
      await db.lavori.put(ricalcola({ ...l, ...campi }, pag));
    });
  }

  /**
   * Elimina un pagamento e ricalcola lo stato del lavoro.
   * @param {string} id
   */
  async function eliminaPagamento(id) {
    const db = getDb();
    const p = await db.pagamenti.get(id);
    if (!p) return;
    await db.pagamenti.delete(id);
    await _salvaRicalcolato(p.lavoro_id);
  }

  /**
   * Elimina un lavoro e tutti i suoi pagamenti.
   * @param {string} id
   */
  async function eliminaLavoro(id) {
    const db = getDb();
    await db.transaction('rw', db.lavori, db.pagamenti, async () => {
      await db.pagamenti.where('lavoro_id').equals(id).delete();
      await db.lavori.delete(id);
    });
  }

  // ---------- Impostazioni ----------

  /**
   * Legge un'impostazione dal database.
   * @param {string} chiave
   * @returns {Promise<any>}
   */
  async function leggiImpostazione(chiave) {
    const r = await getDb().impostazioni.get(chiave);
    return r?.valore;
  }

  /**
   * Salva un'impostazione nel database.
   * @param {string} chiave
   * @param {any} valore
   */
  async function scriviImpostazione(chiave, valore) {
    await getDb().impostazioni.put({ chiave, valore });
  }

  // ---------- API pubblica ----------

  return {
    inizia,
    chiediSpazioPermanente,

    // Clienti
    creaCliente,
    modificaCliente,
    eliminaCliente,
    caricaClienti,
    cercaCliente,
    clientiPerVoice,

    // Lavori
    creaLavoro,
    modificaLavoro,
    segnaFatto,
    rimettiDaFare,
    caricaLavori,

    // Pagamenti
    registraPagamento,
    eliminaPagamento,
    eliminaLavoro,

    // Impostazioni
    leggiImpostazione,
    scriviImpostazione,
  };
})();
