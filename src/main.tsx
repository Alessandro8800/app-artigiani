import { render } from 'preact';
import { chiediSpazioPermanente } from './db';
import { Calendario } from './schermate/calendario';
import { ElencoClienti, SchedaCliente } from './schermate/clienti';
import { DaFare } from './schermate/dafare';
import { Dati } from './schermate/dati';
import { Home } from './schermate/home';
import { DettaglioLavoro } from './schermate/lavoro';
import { NuovoLavoro } from './schermate/nuovo';
import { Avvisi, MenuInBasso, usePercorso } from './ui';
import './stile.css';

function App() {
  const { hash, parti, query } = usePercorso();
  const [pagina = '', id = ''] = parti;
  let schermata;
  switch (pagina) {
    case 'nuovo': schermata = <NuovoLavoro clienteId={query.get('cliente')} data={query.get('data')} />; break;
    case 'lavoro': schermata = <DettaglioLavoro id={id} />; break;
    case 'clienti': schermata = <ElencoClienti />; break;
    case 'cliente': schermata = <SchedaCliente id={id} />; break;
    case 'dafare': schermata = <DaFare />; break;
    case 'calendario': schermata = <Calendario />; break;
    case 'dati': schermata = <Dati />; break;
    default: schermata = <Home />;
  }
  const principale = ['', 'dafare', 'calendario', 'clienti'].includes(pagina);
  return (
    <div class={principale ? 'pagina con-menu' : 'pagina'}>
      <div key={hash}>{schermata}</div>
      {principale && pagina !== 'calendario' && <a class="tasto-nuovo" href="#/nuovo">+ Nuovo lavoro</a>}
      {principale && <MenuInBasso attiva={pagina} />}
      <Avvisi />
    </div>
  );
}

// Questa versione ora vive in /prima-versione/: il file per lavorare senza internet sta una cartella sopra
if ('serviceWorker' in navigator && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  navigator.serviceWorker.register(new URL('../sw.js', location.href), { scope: '../' }).catch(() => {});
}
chiediSpazioPermanente();
render(<App />, document.getElementById('app')!);
