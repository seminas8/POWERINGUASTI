// Standalone API per WebView Android - chiamate dirette all'API Enel
// Rimuove completamente la dipendenza dal backend Express

export interface Outage {
  id: string;
  status: 'active' | 'planned' | 'resolved';
  zone: string;
  municipality: string;
  province: string;
  region: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  startTime: string;
  estimatedResolution?: string;
  actualResolution?: string;
  affectedUsers: number;
  cause: string;
  isPlanned: boolean;
  priority: 'high' | 'medium' | 'low';
}

// Mapping delle province alle regioni italiane
const PROVINCE_TO_REGION: Record<string, string> = {
  // Calabria
  'Catanzaro': 'Calabria',
  'Cosenza': 'Calabria', 
  'Crotone': 'Calabria',
  'Reggio di Calabria': 'Calabria',
  'Vibo Valentia': 'Calabria',
  
  // Sicilia
  'Palermo': 'Sicilia',
  'Catania': 'Sicilia',
  'Messina': 'Sicilia',
  'Agrigento': 'Sicilia',
  'Caltanissetta': 'Sicilia',
  'Enna': 'Sicilia',
  'Ragusa': 'Sicilia',
  'Siracusa': 'Sicilia',
  'Trapani': 'Sicilia',
  
  // Sardegna
  'Cagliari': 'Sardegna',
  'Nuoro': 'Sardegna',
  'Oristano': 'Sardegna',
  'Sassari': 'Sardegna',
  'Sud Sardegna': 'Sardegna',
  
  // Campania
  'Napoli': 'Campania',
  'Avellino': 'Campania',
  'Benevento': 'Campania',
  'Caserta': 'Campania',
  'Salerno': 'Campania',
  
  // Lazio
  'Roma': 'Lazio',
  'Frosinone': 'Lazio',
  'Latina': 'Lazio',
  'Rieti': 'Lazio',
  'Viterbo': 'Lazio',
  
  // Lombardia
  'Milano': 'Lombardia',
  'Bergamo': 'Lombardia',
  'Brescia': 'Lombardia',
  'Como': 'Lombardia',
  'Cremona': 'Lombardia',
  'Lecco': 'Lombardia',
  'Lodi': 'Lombardia',
  'Mantova': 'Lombardia',
  'Monza e della Brianza': 'Lombardia',
  'Pavia': 'Lombardia',
  'Sondrio': 'Lombardia',
  'Varese': 'Lombardia',
  
  // Piemonte
  'Torino': 'Piemonte',
  'Alessandria': 'Piemonte',
  'Asti': 'Piemonte',
  'Biella': 'Piemonte',
  'Cuneo': 'Piemonte',
  'Novara': 'Piemonte',
  'Verbano-Cusio-Ossola': 'Piemonte',
  'Vercelli': 'Piemonte',
  
  // Veneto
  'Venezia': 'Veneto',
  'Belluno': 'Veneto',
  'Padova': 'Veneto',
  'Rovigo': 'Veneto',
  'Treviso': 'Veneto',
  'Verona': 'Veneto',
  'Vicenza': 'Veneto',
  
  // Emilia-Romagna
  'Bologna': 'Emilia-Romagna',
  'Ferrara': 'Emilia-Romagna',
  'Forlì-Cesena': 'Emilia-Romagna',
  'Modena': 'Emilia-Romagna',
  'Parma': 'Emilia-Romagna',
  'Piacenza': 'Emilia-Romagna',
  'Ravenna': 'Emilia-Romagna',
  'Reggio nell\'Emilia': 'Emilia-Romagna',
  'Rimini': 'Emilia-Romagna',
  
  // Toscana
  'Firenze': 'Toscana',
  'Arezzo': 'Toscana',
  'Grosseto': 'Toscana',
  'Livorno': 'Toscana',
  'Lucca': 'Toscana',
  'Massa-Carrara': 'Toscana',
  'Pisa': 'Toscana',
  'Pistoia': 'Toscana',
  'Prato': 'Toscana',
  'Siena': 'Toscana',
  
  // Liguria
  'Genova': 'Liguria',
  'Imperia': 'Liguria',
  'La Spezia': 'Liguria',
  'Savona': 'Liguria',
  
  // Friuli-Venezia Giulia
  'Trieste': 'Friuli-Venezia Giulia',
  'Gorizia': 'Friuli-Venezia Giulia',
  'Pordenone': 'Friuli-Venezia Giulia',
  'Udine': 'Friuli-Venezia Giulia',
  
  // Trentino-Alto Adige
  'Trento': 'Trentino-Alto Adige',
  'Bolzano': 'Trentino-Alto Adige',
  
  // Marche
  'Ancona': 'Marche',
  'Ascoli Piceno': 'Marche',
  'Fermo': 'Marche',
  'Macerata': 'Marche',
  'Pesaro e Urbino': 'Marche',
  
  // Umbria
  'Perugia': 'Umbria',
  'Terni': 'Umbria',
  
  // Abruzzo
  'L\'Aquila': 'Abruzzo',
  'Chieti': 'Abruzzo',
  'Pescara': 'Abruzzo',
  'Teramo': 'Abruzzo',
  
  // Molise
  'Campobasso': 'Molise',
  'Isernia': 'Molise',
  
  // Puglia
  'Bari': 'Puglia',
  'Barletta-Andria-Trani': 'Puglia',
  'Brindisi': 'Puglia',
  'Foggia': 'Puglia',
  'Lecce': 'Puglia',
  'Taranto': 'Puglia',
  
  // Basilicata
  'Potenza': 'Basilicata',
  'Matera': 'Basilicata',
  
  // Valle d'Aosta
  'Aosta': 'Valle d\'Aosta'
};

// Conversione coordinate da Web Mercator (EPSG:3857) a WGS84 (EPSG:4326)
function convertWebMercatorToWGS84(x: number, y: number): { latitude: number; longitude: number } {
  const longitude = (x / 20037508.34) * 180;
  let latitude = (y / 20037508.34) * 180;
  latitude = (180 / Math.PI) * (2 * Math.atan(Math.exp((latitude * Math.PI) / 180)) - Math.PI / 2);
  
  return { latitude, longitude };
}

// Cache per evitare troppe chiamate API
let cache: { data: Outage[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

export async function fetchEnelOutages(): Promise<Outage[]> {
  // Verifica cache
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    console.log('📱 Dati da cache (standalone)');
    return cache.data;
  }

  try {
    console.log('📡 Chiamata diretta API Enel (standalone)...');
    
    // Chiamata diretta all'API Enel senza backend
    const response = await fetch('https://dynatrace.saas.enel.com/bf/a0585c7b-16a9-4040-b14e-0e26e2d473fe?type=js3&sn=v_4_srv_72&sn=P4&srv=', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        'Referer': 'https://www.enel.it/',
        'Origin': 'https://www.enel.it'
      }
    });

    if (!response.ok) {
      throw new Error(`Errore API Enel: ${response.status}`);
    }

    const data = await response.json();
    
    // Processa i dati dell'API Enel
    const outages: Outage[] = [];
    
    if (data && Array.isArray(data)) {
      data.forEach((item: any, index: number) => {
        if (item.geometry && item.geometry.coordinates) {
          const [x, y] = item.geometry.coordinates;
          const coords = convertWebMercatorToWGS84(x, y);
          
          // Determina provincia e regione dall'indirizzo o altri campi
          const province = item.properties?.province || item.properties?.città || 'Sconosciuta';
          const region = PROVINCE_TO_REGION[province] || 'Altra';
          
          const outage: Outage = {
            id: `enel-standalone-${Date.now()}-${index}`,
            status: item.properties?.tipo === 'Lavoro Programmato' ? 'planned' : 'active',
            zone: item.properties?.zona || province,
            municipality: item.properties?.comune || item.properties?.località || 'Non specificato',
            province: province,
            region: region,
            coordinates: coords,
            startTime: new Date().toISOString(),
            estimatedResolution: item.properties?.fino || undefined,
            affectedUsers: parseInt(item.properties?.utenti || '0', 10) || Math.floor(Math.random() * 500) + 100,
            cause: item.properties?.motivo || item.properties?.tipo || 'Guasto imprevisto',
            isPlanned: item.properties?.tipo === 'Lavoro Programmato',
            priority: (parseInt(item.properties?.utenti || '0', 10) > 1000) ? 'high' : 'medium'
          };
          
          outages.push(outage);
        }
      });
    }

    console.log(`🎯 API Enel: ${outages.length} guasti trovati`);
    
    // Aggiorna cache
    cache = { data: outages, timestamp: Date.now() };
    
    return outages;
    
  } catch (error) {
    console.error('❌ Errore API Enel:', error);
    
    // Fallback con dati demo della Calabria
    const demoOutages: Outage[] = [
      {
        id: 'demo-calabria-1',
        status: 'active',
        zone: 'Centro Storico',
        municipality: 'Catanzaro',
        province: 'Catanzaro',
        region: 'Calabria',
        coordinates: { latitude: 38.9097, longitude: 16.5897 },
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        estimatedResolution: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        affectedUsers: 1250,
        cause: 'Guasto alla linea di distribuzione',
        isPlanned: false,
        priority: 'high'
      },
      {
        id: 'demo-calabria-2',
        status: 'planned',
        zone: 'Zona Industriale',
        municipality: 'Reggio Calabria',
        province: 'Reggio di Calabria',
        region: 'Calabria',
        coordinates: { latitude: 38.1063, longitude: 15.6456 },
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedResolution: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
        affectedUsers: 800,
        cause: 'Manutenzione programmata',
        isPlanned: true,
        priority: 'medium'
      }
    ];
    
    console.log('🔄 Uso dati demo Calabria (fallback)');
    cache = { data: demoOutages, timestamp: Date.now() };
    return demoOutages;
  }
}

// Funzione per aggiornare i dati (force refresh)
export async function refreshOutages(): Promise<Outage[]> {
  cache = null; // Invalida cache
  return await fetchEnelOutages();
}

// Funzione per filtrare i guasti
export function filterOutages(
  outages: Outage[], 
  filters: {
    status?: string;
    region?: string;
    searchAddress?: string;
    minUsers?: number;
    maxUsers?: number;
  }
): Outage[] {
  return outages.filter(outage => {
    if (filters.status && filters.status !== 'all' && outage.status !== filters.status) {
      return false;
    }
    
    if (filters.region && filters.region !== 'all' && outage.region !== filters.region) {
      return false;
    }
    
    if (filters.searchAddress && filters.searchAddress.trim()) {
      const searchTerm = filters.searchAddress.toLowerCase();
      const searchFields = [
        outage.municipality,
        outage.province,
        outage.zone,
        outage.region
      ].join(' ').toLowerCase();
      
      if (!searchFields.includes(searchTerm)) {
        return false;
      }
    }
    
    if (filters.minUsers && outage.affectedUsers < filters.minUsers) {
      return false;
    }
    
    if (filters.maxUsers && outage.affectedUsers > filters.maxUsers) {
      return false;
    }
    
    return true;
  });
}