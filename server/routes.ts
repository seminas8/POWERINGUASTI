import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import express from "express";

// Precarica i dati all'avvio per prestazioni istantanee
async function preloadData() {
  console.log('🚀 Precaricamento dati Enel all\'avvio...');
  try {
    await fetchRealEnelOutages();
    console.log('✅ Dati precaricati con successo!');
  } catch (error) {
    console.log('⚠️ Precaricamento fallito, useremo il fallback:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Servire file PWA statici
  app.use('/manifest.json', express.static(path.resolve('public/manifest.json')));
  app.use('/service-worker.js', express.static(path.resolve('public/service-worker.js')));
  app.use('/icon-192.png', express.static(path.resolve('public/icon-192.png')));
  app.use('/icon-512.png', express.static(path.resolve('public/icon-512.png')));

  // Health check endpoint for keep-alive
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Ping endpoint for external monitoring
  app.get('/ping', (req, res) => {
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
  });

  // Outage routes - simplified without authentication
  app.get('/api/outages', async (req, res) => {
    try {
      const { status, zone } = req.query;
      
      // Prova a ottenere dati reali da Enel, con fallback a dati demo
      let outages = await fetchRealEnelOutages();
      
      // Filter by status if requested
      if (status && typeof status === 'string') {
        outages = outages.filter(outage => outage.status === status);
      }
      
      // Filter by zone if requested
      if (zone && typeof zone === 'string') {
        outages = outages.filter(outage => outage.zone.toLowerCase().includes(zone.toLowerCase()));
      }

      res.json(outages);
    } catch (error) {
      console.error("Error fetching outages:", error);
      res.status(500).json({ message: "Failed to fetch outages" });
    }
  });

  app.get('/api/outages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const outages = await fetchRealEnelOutages();
      const outage = outages.find(o => o.id === id);
      
      if (!outage) {
        return res.status(404).json({ message: "Outage not found" });
      }
      
      res.json(outage);
    } catch (error) {
      console.error("Error fetching outage:", error);
      res.status(500).json({ message: "Failed to fetch outage" });
    }
  });

  const httpServer = createServer(app);

  // Keep-alive system to prevent sleeping
  if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
      try {
        await fetch(`http://localhost:${process.env.PORT || 5000}/api/health`);
      } catch (error) {
        console.log('Keep-alive ping failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Avvia precaricamento in background
  preloadData();

  return httpServer;
}



// Cache globale aggressiva per prestazioni istantanee
let cachedOutages: any[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 300000; // 5 minuti di cache per prestazioni ottimali
let isUpdating = false; // Previene chiamate simultanee

// Funzione per ottenere dati reali dai servizi Enel GIS con cache aggressiva
async function fetchRealEnelOutages() {
  // Controlla se la cache è ancora valida
  const now = Date.now();
  if (cachedOutages.length > 0 && (now - lastCacheUpdate) < CACHE_DURATION) {
    console.log(`⚡ Cache istantanea (${cachedOutages.length} guasti, ${Math.round((now - lastCacheUpdate)/1000)}s fa)`);
    return cachedOutages;
  }

  // Previeni chiamate simultanee
  if (isUpdating) {
    console.log(`⏳ Aggiornamento in corso, usando cache esistente (${cachedOutages.length} guasti)`);
    return cachedOutages.length > 0 ? cachedOutages : getFallbackCalabriaOutages();
  }

  isUpdating = true;
  console.log('🔍 Provo multiple queries Enel per trovare guasti reali...');
  
  try {
    const baseUrl = 'https://ineuportalgis.enel.com/server/rest/services/Hosted/ITA_power_cut_map_layer_View/FeatureServer/0/query';
    
    // Headers autentici dalle tue catture
    const headers = {
      'Accept': '*/*',
      'Accept-Language': 'it-IT,it;q=0.6',
      'Priority': 'u=1, i',
      'Referer': 'https://ineuportalgis.enel.com/portal/apps/instant/media/index.html?appid=7d832c0db96c4bfe9cf9ca7b7782f200',
      'Sec-Ch-Ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Storage-Access': 'none',
      'Sec-Gpc': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    };

    // Geometrie esatte dai tuoi file catturati
    const geometryQueries = [
      // Nord-Ovest Italia
      'geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-1252344.271426987%2C%22ymin%22%3A6261721.357122989%2C%22xmax%22%3A-0.000002983957529067993%2C%22ymax%22%3A7514065.62854699%7D',
      // Nord-Est Italia
      'geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-0.000002983957529067993%2C%22ymin%22%3A6261721.357122989%2C%22xmax%22%3A1252344.271421019%2C%22ymax%22%3A7514065.62854699%7D',
      // Centro-Ovest Italia
      'geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-1252344.271426987%2C%22ymin%22%3A5009377.085698988%2C%22xmax%22%3A-0.000002983957529067993%2C%22ymax%22%3A6261721.357122989%7D',
      // Centro-Est Italia 
      'geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-0.000002983957529067993%2C%22ymin%22%3A5009377.085698988%2C%22xmax%22%3A2504688.542845018%2C%22ymax%22%3A7514065.62854699%7D',
      // Sud-Ovest Italia
      'geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-1252344.271426987%2C%22ymin%22%3A3757032.814274987%2C%22xmax%22%3A-0.000002983957529067993%2C%22ymax%22%3A5009377.085698988%7D',
      // Sud-Est Italia
      'geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-0.000002983957529067993%2C%22ymin%22%3A2504688.542850986%2C%22xmax%22%3A2504688.542845018%2C%22ymax%22%3A5009377.085698988%7D'
    ];

    let allOutages: any[] = [];
    
    // Prima provo query semplice SENZA LIMITI per catturare TUTTI i guasti
    try {
      console.log('📡 Ricerca TUTTI i guasti disponibili (senza limiti)...');
      const simpleQuery = `f=json&where=1%3D1&outFields=*&returnGeometry=true&resultRecordCount=1000`;
      
      const testResponse = await fetch(`${baseUrl}?${simpleQuery}`, {
        method: 'GET',
        headers: headers
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`🔍 Query completa trovata: ${testData.features?.length || 0} guasti totali in Italia`);
        
        if (testData.features && testData.features.length > 0) {
          allOutages.push(...testData.features);
        }
      }
    } catch (error) {
      console.log('⚠️ Errore query completa:', error);
    }

    // Se non ho trovato nulla, provo le queries geometriche
    if (allOutages.length === 0) {
      for (let i = 0; i < geometryQueries.length; i++) {
        try {
          const queryParams = `f=json&${geometryQueries[i]}&maxRecordCountFactor=3&orderByFields=objectid1%20ASC&outFields=*&outSR=102100&quantizationParameters=%7B%22extent%22%3A%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%7D%2C%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%7D&returnGeometry=true&spatialRel=esriSpatialRelIntersects&where=1%3D1`;
          
          console.log(`📡 Query geometrica ${i+1}/${geometryQueries.length}`);
          
          const response = await fetch(`${baseUrl}?${queryParams}`, {
            method: 'GET',
            headers: headers
          });

          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              console.log(`✅ Trovati ${data.features.length} guasti in zona ${i+1}`);
              allOutages.push(...data.features);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 150));
          
        } catch (error) {
          console.log(`⚠️ Errore query zona ${i+1}:`, error);
        }
      }
    }

    console.log(`🔍 Totale guasti trovati: ${allOutages.length}`);
    
    if (allOutages.length === 0) {
      console.log('⚠️ Nessun guasto reale trovato, uso dati fallback');
      return getFallbackCalabriaOutages();
    }

    // Dati autentici trovati, procedo con la trasformazione

    // Trasforma i dati nel nostro formato
    const transformedOutages = allOutages.map((feature: any, index: number) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      
      // Utilizza coordinate PRECISE dall'API Enel (latitudine/longitudine)
      let lat = 41.9028; // Default center Italia
      let lng = 12.4964;
      
      // Prima controlla se ci sono coordinate precise nei campi latitudine/longitudine
      if (attrs.latitudine && attrs.longitudine) {
        lat = parseFloat(attrs.latitudine);
        lng = parseFloat(attrs.longitudine);
      } 
      // Fallback: conversione da Web Mercator se non ci sono coordinate precise
      else if (geom && geom.x !== undefined && geom.y !== undefined) {
        const x = geom.x;
        const y = geom.y;
        
        // Formula matematica per Web Mercator -> WGS84
        lng = x / 20037508.342789244 * 180;
        lat = Math.atan(Math.exp(y / 20037508.342789244 * Math.PI)) * 360 / Math.PI - 90;
      }
      
      // Utilizza dati geografici REALI dall'API Enel 
      let municipality = 'Comune non specificato';
      let province = attrs.provincia || 'Provincia non specificata';  
      let zone = attrs.regione || 'Regione non specificata';
      
      // Il comune è nel campo descrizione_territoriale (es. "CA-MARINA TUVIXEDDU")
      if (attrs.descrizione_territoriale) {
        const desc = attrs.descrizione_territoriale.toString();
        // Rimuove il prefixo provincia (es. "CA-") e mantiene solo il nome del comune
        const parts = desc.split('-');
        if (parts.length > 1) {
          municipality = parts.slice(1).join('-').trim();
        } else {
          municipality = desc.trim();
        }
      }
      
      // Se non ci sono dati geografici dall'API, usa una logica semplificata basata su coordinate
      if (municipality === 'Comune non specificato' || municipality === '') {
        if (lat >= 37.5 && lat <= 40.5 && lng >= 15.0 && lng <= 17.5) {
          // Calabria
          zone = 'Regione Calabria';
          if (lat >= 39.2 && lng >= 16.2) {
            municipality = 'Cosenza';
            province = 'CS';
          } else if (lat <= 38.1 && lng >= 15.6) {
            municipality = 'Reggio Calabria';
            province = 'RC';
          } else if (lat >= 38.8 && lat <= 39.2 && lng >= 16.5) {
            municipality = 'Catanzaro';
            province = 'CZ';
          } else if (lat >= 38.5 && lat <= 38.8 && lng >= 16.0 && lng <= 16.5) {
            municipality = 'Vibo Valentia';
            province = 'VV';
          } else if (lat >= 39.0 && lng >= 17.0) {
            municipality = 'Crotone';
            province = 'KR';
          } else {
            municipality = 'Area Calabria';
            province = 'CL';
          }
        } else if (lat >= 36.0 && lat <= 39.0 && lng >= 12.0 && lng <= 16.0) {
          // Sicilia
          zone = 'Regione Sicilia';
          municipality = 'Area Sicilia';
          province = 'SIC';
        } else if (lat >= 38.0 && lat <= 42.0 && lng >= 8.0 && lng <= 10.5) {
          // Sardegna
          zone = 'Regione Sardegna';
          municipality = 'Area Sardegna';
          province = 'SAR';
        } else if (lat >= 44.0) {
          // Nord Italia
          zone = 'Italia Settentrionale';
          municipality = 'Nord Italia';
          province = 'NORD';
        } else if (lat >= 41.0 && lat < 44.0) {
          // Centro Italia
          zone = 'Italia Centrale';
          municipality = 'Centro Italia';
          province = 'CENTRO';
        } else {
          // Sud Italia
          zone = 'Italia Meridionale';
          municipality = 'Sud Italia';
          province = 'SUD';
        }
      }
      
      // Funzione per determinare se una data è in ora legale (CEST) o solare (CET)
      const isDST = (date: Date): boolean => {
        // L'ora legale in Italia va dall'ultima domenica di marzo all'ultima domenica di ottobre
        const year = date.getFullYear();
        const march = new Date(year, 2, 31); // 31 marzo
        const october = new Date(year, 9, 31); // 31 ottobre
        
        // Trova l'ultima domenica di marzo
        const lastSundayMarch = new Date(march);
        lastSundayMarch.setDate(31 - march.getDay());
        
        // Trova l'ultima domenica di ottobre
        const lastSundayOctober = new Date(october);
        lastSundayOctober.setDate(31 - october.getDay());
        
        return date >= lastSundayMarch && date < lastSundayOctober;
      };

      // Parsifica le date dall'API Enel (possibili formati: timestamp Unix, ISO string, o formato italiano)
      const parseEnelDate = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        
        try {
          // Se è già un timestamp Unix (millisecondi)
          if (typeof dateValue === 'number') {
            return new Date(dateValue);
          }
          
          // Se è una stringa
          if (typeof dateValue === 'string') {
            const dateStr = dateValue.trim();
            if (dateStr === '') return null;
            
            // Prova formato ISO prima
            if (dateStr.includes('T') || dateStr.includes('Z')) {
              return new Date(dateStr);
            }
            
            // Prova formato italiano "DD/MM/YYYY HH:MM"
            if (dateStr.includes('/') && dateStr.includes(' ')) {
              const [datePart, timePart] = dateStr.split(' ');
              const [day, month, year] = datePart.split('/');
              const [hours, minutes] = timePart.split(':');
              
              // Crea data considerando il fuso orario italiano
              // Le date Enel sono in ora locale italiana (CET/CEST = UTC+1/UTC+2)
              const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
              
              // Determina se siamo in ora solare (CET, UTC+1) o legale (CEST, UTC+2)
              const isLegalTime = isDST(localDate);
              const offsetHours = isLegalTime ? 2 : 1; // CEST=UTC+2, CET=UTC+1
              
              // Converte all'UTC sottraendo l'offset
              const utcDate = new Date(localDate.getTime() - (offsetHours * 60 * 60 * 1000));
              return utcDate;
            }
            
            // Prova parsing generico
            return new Date(dateStr);
          }
          
          return null;
        } catch (error) {
          console.log(`Errore parsing data: ${dateValue}`, error);
          return null;
        }
      };



      const startTime = parseEnelDate(attrs.data_interruzione) || new Date();
      const lastUpdate = parseEnelDate(attrs.dataultimoaggiornamento) || new Date();
      const estimatedResolution = parseEnelDate(attrs.data_prev_ripristino);

      return {
        id: `enel-real-${attrs.objectid1 || index}`,
        status: 'active',
        zone: zone,
        municipality: municipality,
        province: province,
        latitude: lat.toString(),
        longitude: lng.toString(),
        affectedUsers: attrs.num_cli_disalim || 0,
        cause: attrs.causa_disalimentazione || 'Guasto elettrico - Enel',
        startTime: startTime,
        lastUpdate: lastUpdate,
        estimatedResolution: estimatedResolution,
        actualResolution: null,
        isPlanned: attrs.causa_disalimentazione?.toLowerCase().includes('programmato') || false
      };
    });

    console.log(`🎯 Integrazione Enel completata: ${transformedOutages.length} guasti reali caricati!`);
    
    // Aggiorna la cache
    cachedOutages = transformedOutages;
    lastCacheUpdate = Date.now();
    isUpdating = false;
    
    return transformedOutages;

  } catch (error) {
    console.error('❌ Errore API Enel:', error instanceof Error ? error.message : error);
    isUpdating = false;
    
    // Se ho cache vecchia, usala comunque
    const now = Date.now();
    if (cachedOutages.length > 0) {
      console.log(`💾 Usando cache obsoleta (${Math.round((now - lastCacheUpdate)/1000)}s fa)`);
      return cachedOutages;
    }
    
    console.log('🔄 Fallback a dati demo');
    return getFallbackCalabriaOutages();
  }
}

function getFallbackCalabriaOutages() {
  return [
    {
      id: 'cal-cosenza-001',
      status: 'active',
      zone: 'Cosenza Centro',
      municipality: 'Cosenza',
      province: 'CS',
      latitude: '39.2986',
      longitude: '16.2543',
      affectedUsers: 1250,
      cause: 'Interruzione per guasto su linea di media tensione',
      startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
      estimatedResolution: new Date(Date.now() + 1 * 60 * 60 * 1000),
      actualResolution: null,
      isPlanned: false,
    },
    {
      id: 'cal-reggio-002',
      status: 'active',
      zone: 'Reggio Calabria Sud',
      municipality: 'Reggio Calabria',
      province: 'RC',
      latitude: '38.1067',
      longitude: '15.6536',
      affectedUsers: 2100,
      cause: 'Guasto tecnico su trasformatore di cabina primaria',
      startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
      estimatedResolution: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
      actualResolution: null,
      isPlanned: false,
    },
    {
      id: 'cal-catanzaro-003',
      status: 'planned',
      zone: 'Catanzaro Lido',
      municipality: 'Catanzaro',
      province: 'CZ',
      latitude: '38.9097',
      longitude: '16.5897',
      affectedUsers: 850,
      cause: 'Manutenzione programmata rete di distribuzione',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
      estimatedResolution: new Date(Date.now() + 6 * 60 * 60 * 1000),
      actualResolution: null,
      isPlanned: true,
    }
  ];
}
