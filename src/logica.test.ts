import { describe, expect, it } from 'vitest';
import { debiti, giorniTra, leggiImporto, ricalcola, type Cliente, type Lavoro, type Pagamento } from './logica';

const lavoro = (campi: Partial<Lavoro>): Lavoro => ({
  id: 'L1', owner_id: 'locale', cliente_id: 'C1', descrizione: '', importo: 10000, data: '2026-11-01',
  stato: 'fatto', importo_pagato: 0, data_pagamento: null, metodo_pagamento: null, ...campi,
});
const pag = (importo: number, data = '2026-11-10'): Pagamento => ({
  id: 'P' + importo + data, owner_id: 'locale', lavoro_id: 'L1', importo, data, metodo: 'contanti',
});
const cliente = (id: string, nome: string): Cliente => ({
  id, owner_id: 'locale', nome, telefono: '', indirizzo: '', tipo: 'privato', note: '',
});

describe('leggiImporto', () => {
  it('capisce i modi comuni di scrivere un importo', () => {
    expect(leggiImporto('30')).toBe(3000);
    expect(leggiImporto('12,50')).toBe(1250);
    expect(leggiImporto('12.5')).toBe(1250);
    expect(leggiImporto('1.200')).toBe(120000);
    expect(leggiImporto('1.200,50')).toBe(120050);
    expect(leggiImporto('€ 45')).toBe(4500);
    expect(leggiImporto('')).toBeNull();
    expect(leggiImporto('abc')).toBeNaN();
  });
});

describe('ricalcola', () => {
  it('pagamento parziale: resta "fatto"', () => {
    const r = ricalcola(lavoro({}), [pag(4000)]);
    expect(r.stato).toBe('fatto');
    expect(r.importo_pagato).toBe(4000);
  });
  it('pagamenti che coprono il prezzo: diventa "pagato"', () => {
    const r = ricalcola(lavoro({}), [pag(4000, '2026-11-05'), pag(6000, '2026-11-12')]);
    expect(r.stato).toBe('pagato');
    expect(r.data_pagamento).toBe('2026-11-12');
  });
  it('se il prezzo sale dopo il pagamento, torna "fatto"', () => {
    const r = ricalcola(lavoro({ stato: 'pagato', importo: 15000 }), [pag(10000)]);
    expect(r.stato).toBe('fatto');
  });
  it('un lavoro "da fare" senza pagamenti resta "da fare"', () => {
    expect(ricalcola(lavoro({ stato: 'da_fare' }), []).stato).toBe('da_fare');
  });
});

describe('debiti', () => {
  it('conta solo i lavori fatti non pagati e mette i più in ritardo in cima', () => {
    const clienti = [cliente('C1', 'Rossi'), cliente('C2', 'Bianchi'), cliente('C3', 'Verdi')];
    const lavori = [
      lavoro({ id: 'a', cliente_id: 'C1', data: '2026-11-10', importo: 5000 }),
      lavoro({ id: 'b', cliente_id: 'C2', data: '2026-10-01', importo: 3000, importo_pagato: 1000 }),
      lavoro({ id: 'c', cliente_id: 'C3', stato: 'da_fare' }),
      lavoro({ id: 'd', cliente_id: 'C1', stato: 'pagato' }),
    ];
    const d = debiti(clienti, lavori, '2026-11-18');
    expect(d.map((x) => x.cliente.nome)).toEqual(['Bianchi', 'Rossi']);
    expect(d[0].dovuto).toBe(2000);
    expect(d[0].giorni).toBe(48);
    expect(d[1].dovuto).toBe(5000);
  });
});

describe('giorniTra', () => {
  it('attraversa il cambio dell\'ora legale', () => {
    expect(giorniTra('2026-10-24', '2026-10-26')).toBe(2);
  });
});
