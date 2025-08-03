import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Layers, Ruler, RefreshCw, AlertCircle, X, MapPin, Users, Clock, Calendar, Timer, Info, BarChart3, Share2, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Outage } from "@/types/outage";
import { AdvancedFilters, type FilterOptions } from './AdvancedFilters';
import { OutageHistory } from './OutageHistory';
import { StatsDashboard } from './StatsDashboard';
import { ShareOutage } from './ShareOutage';
import { useToast } from "@/hooks/use-toast";

// date-fns rimosso: ora usiamo toLocaleString con fuso orario italiano

interface MapContainerProps {
  outages: Outage[];
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

export default function MapContainer({ outages, isLoading, error, onRefresh }: MapContainerProps) {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [currentLayer, setCurrentLayer] = useState('cartodb'); // Default mobile-friendly
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 41.9028, lng: 12.4964 });
  const [zoomLevel, setZoomLevel] = useState(6);
  const [isDistanceToolActive, setIsDistanceToolActive] = useState(false);
  const [selectedOutage, setSelectedOutage] = useState<Outage | null>(null);
  const [showOutagePopup, setShowOutagePopup] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const [filteredOutages, setFilteredOutages] = useState<Outage[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterOptions | null>(null);

  // Mappa province (nomi completi) a regioni
  const getRegionFromProvince = (province: string): string => {
    const provinceToRegion: Record<string, string> = {
      // Calabria
      'Cosenza': 'Calabria', 'Reggio Calabria': 'Calabria', 'Catanzaro': 'Calabria', 'Vibo Valentia': 'Calabria', 'Crotone': 'Calabria',
      'Reggio di Calabria': 'Calabria',
      // Sicilia
      'Palermo': 'Sicilia', 'Catania': 'Sicilia', 'Messina': 'Sicilia', 'Agrigento': 'Sicilia', 'Caltanissetta': 'Sicilia', 
      'Enna': 'Sicilia', 'Ragusa': 'Sicilia', 'Siracusa': 'Sicilia', 'Trapani': 'Sicilia',
      // Sardegna
      'Cagliari': 'Sardegna', 'Sassari': 'Sardegna', 'Nuoro': 'Sardegna', 'Oristano': 'Sardegna', 'Sud Sardegna': 'Sardegna',
      // Lazio
      'Roma': 'Lazio', 'Latina': 'Lazio', 'Frosinone': 'Lazio', 'Rieti': 'Lazio', 'Viterbo': 'Lazio',
      // Lombardia
      'Milano': 'Lombardia', 'Bergamo': 'Lombardia', 'Brescia': 'Lombardia', 'Como': 'Lombardia', 'Cremona': 'Lombardia', 
      'Mantova': 'Lombardia', 'Pavia': 'Lombardia', 'Sondrio': 'Lombardia', 'Varese': 'Lombardia', 'Lecco': 'Lombardia', 
      'Lodi': 'Lombardia', 'Monza e della Brianza': 'Lombardia',
      // Campania
      'Napoli': 'Campania', 'Avellino': 'Campania', 'Benevento': 'Campania', 'Caserta': 'Campania', 'Salerno': 'Campania',
      // Veneto
      'Venezia': 'Veneto', 'Belluno': 'Veneto', 'Padova': 'Veneto', 'Rovigo': 'Veneto', 'Treviso': 'Veneto', 'Verona': 'Veneto', 'Vicenza': 'Veneto',
      // Piemonte
      'Torino': 'Piemonte', 'Alessandria': 'Piemonte', 'Asti': 'Piemonte', 'Biella': 'Piemonte', 'Cuneo': 'Piemonte', 'Novara': 'Piemonte', 'Verbano-Cusio-Ossola': 'Piemonte', 'Vercelli': 'Piemonte',
      // Puglia
      'Bari': 'Puglia', 'Brindisi': 'Puglia', 'Barletta-Andria-Trani': 'Puglia', 'Foggia': 'Puglia', 'Lecce': 'Puglia', 'Taranto': 'Puglia',
      // Emilia-Romagna
      'Bologna': 'Emilia-Romagna', 'Ferrara': 'Emilia-Romagna', 'Forlì-Cesena': 'Emilia-Romagna', 'Modena': 'Emilia-Romagna', 
      'Parma': 'Emilia-Romagna', 'Ravenna': 'Emilia-Romagna', 'Reggio Emilia': 'Emilia-Romagna', 'Rimini': 'Emilia-Romagna', 'Piacenza': 'Emilia-Romagna',
      // Toscana
      'Firenze': 'Toscana', 'Arezzo': 'Toscana', 'Grosseto': 'Toscana', 'Livorno': 'Toscana', 'Lucca': 'Toscana', 
      'Massa-Carrara': 'Toscana', 'Pisa': 'Toscana', 'Pistoia': 'Toscana', 'Prato': 'Toscana', 'Siena': 'Toscana',
      // Liguria
      'Genova': 'Liguria', 'Imperia': 'Liguria', 'La Spezia': 'Liguria', 'Savona': 'Liguria',
      // Marche
      'Ancona': 'Marche', 'Ascoli Piceno': 'Marche', 'Fermo': 'Marche', 'Macerata': 'Marche', 'Pesaro e Urbino': 'Marche',
      // Abruzzo
      'L\'Aquila': 'Abruzzo', 'Chieti': 'Abruzzo', 'Pescara': 'Abruzzo', 'Teramo': 'Abruzzo',
      // Umbria
      'Perugia': 'Umbria', 'Terni': 'Umbria',
      // Basilicata
      'Potenza': 'Basilicata', 'Matera': 'Basilicata',
      // Molise
      'Campobasso': 'Molise', 'Isernia': 'Molise',
      // Friuli-Venezia Giulia
      'Udine': 'Friuli-Venezia Giulia', 'Gorizia': 'Friuli-Venezia Giulia', 'Pordenone': 'Friuli-Venezia Giulia', 'Trieste': 'Friuli-Venezia Giulia',
      // Trentino-Alto Adige
      'Trento': 'Trentino-Alto Adige', 'Bolzano': 'Trentino-Alto Adige',
      // Valle d'Aosta
      'Aosta': "Valle d'Aosta"
    };
    return provinceToRegion[province] || 'Sconosciuta';
  };

  // Funzione per applicare i filtri
  const applyFilters = (outages: Outage[], filters: FilterOptions | null) => {
    if (!filters) return outages;
    
    return outages.filter(outage => {
      // Filtro per indirizzo/località
      if (filters.searchAddress && !outage.municipality.toLowerCase().includes(filters.searchAddress.toLowerCase()) &&
          !outage.zone.toLowerCase().includes(filters.searchAddress.toLowerCase())) {
        return false;
      }
      
      // Filtro per regione - mappo provincia a regione
      if (filters.region !== 'all') {
        const outageRegion = getRegionFromProvince(outage.province);
        console.log(`🔍 Debug filtro regione MAP: Guasto ${outage.id} - Provincia: ${outage.province} -> Regione: ${outageRegion}, Filtro: ${filters.region}`);
        if (outageRegion !== filters.region) {
          return false;
        }
      }
      
      // Filtro per tipo di causa
      if (filters.causeType !== 'all' && outage.cause) {
        const cause = outage.cause.toLowerCase();
        if (filters.causeType === 'guasto' && !cause.includes('guasto')) return false;
        if (filters.causeType === 'manutenzione' && !(cause.includes('manutenzione') || cause.includes('programmata'))) return false;
        if (filters.causeType === 'meteo' && !(cause.includes('meteo') || cause.includes('maltempo'))) return false;
        if (filters.causeType === 'lavori' && !cause.includes('lavori')) return false;
        if (filters.causeType === 'sovraccarico' && !cause.includes('sovraccarico')) return false;
      }
      
      // Filtro per numero utenti
      if (outage.affectedUsers < filters.minUsers || outage.affectedUsers > filters.maxUsers) {
        return false;
      }
      
      // Filtro per durata
      if (filters.duration !== 'all') {
        const start = new Date(outage.startTime);
        const end = outage.actualResolution ? new Date(outage.actualResolution) : new Date();
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        if (filters.duration === 'short' && durationHours >= 2) return false;
        if (filters.duration === 'medium' && (durationHours < 2 || durationHours > 6)) return false;
        if (filters.duration === 'long' && durationHours <= 6) return false;
        if (filters.duration === 'ongoing' && outage.status !== 'active') return false;
      }
      
      // Filtro per periodo temporale
      if (filters.dateRange !== 'all') {
        const startDate = new Date(outage.startTime);
        const now = new Date();
        const daysDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (filters.dateRange === 'today' && daysDiff > 1) return false;
        if (filters.dateRange === 'week' && daysDiff > 7) return false;
        if (filters.dateRange === 'month' && daysDiff > 30) return false;
        if (filters.dateRange === 'active' && outage.status !== 'active') return false;
      }
      
      return true;
    });
  };

  // Effetto per applicare i filtri quando cambiano i guasti o i filtri
  useEffect(() => {
    const filtered = applyFilters(outages, activeFilters);
    setFilteredOutages(filtered);
  }, [outages, activeFilters]);
  
  // Gestione filtri
  const handleFiltersChange = (filters: FilterOptions) => {
    console.log('📝 Applicando filtri:', filters);
    setActiveFilters(filters);
    const filtered = applyFilters(outages, filters);
    console.log(`🔍 Risultati filtrati: ${filtered.length} su ${outages.length} guasti`);
    setFilteredOutages(filtered);
  };

  // Initialize Leaflet map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;
        
        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
        });

        // Initialize map - centered on Italy
        const map = L.map(mapRef.current).setView([41.9028, 12.4964], 6);

        // Add base layer - CartoDB per mobile friendly
        const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap © CartoDB',
          maxZoom: 19,
          errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          crossOrigin: true,
          // Migliore compatibilità mobile
          detectRetina: true,
          updateWhenIdle: false
        }).addTo(map);
        
        // Log per debug mobile
        console.log('🗺️ Mappa inizializzata con layer CartoDB mobile-friendly');

        mapInstanceRef.current = { map, tileLayer, L };

        // Map event listeners
        map.on('mousemove', (e: any) => {
          setCoordinates({ lat: parseFloat(e.latlng.lat.toFixed(4)), lng: parseFloat(e.latlng.lng.toFixed(4)) });
        });

        map.on('zoomend', () => {
          setZoomLevel(map.getZoom());
        });

        // Listen for custom location events
        const handleLocateUser = (event: any) => {
          const { lat, lng, zoom = 13 } = event.detail;
          map.setView([lat, lng], zoom);
        };

        window.addEventListener('locate-user', handleLocateUser);

        return () => {
          window.removeEventListener('locate-user', handleLocateUser);
        };

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when outages change
  useEffect(() => {
    if (!mapInstanceRef.current?.map || !mapInstanceRef.current?.L) return;

    const { map, L } = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Use filtered outages if available, otherwise use all outages
    const outageData = filteredOutages.length > 0 ? filteredOutages : outages;
    
    // Add new markers
    outageData.forEach(outage => {
      const lat = parseFloat(outage.latitude);
      const lng = parseFloat(outage.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      // Create custom icon based on type: GIALLO per programmati, ROSSO per guasti
      const iconColor = outage.isPlanned ? '#f59e0b' : '#ef4444'; // Giallo per programmati, Rosso per guasti
      
      const iconHtml = `
        <div style="
          width: 24px; 
          height: 24px; 
          background-color: ${iconColor}; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          ${!outage.isPlanned ? 'animation: pulse 2s infinite;' : ''}
        ">
          <div style="
            width: 8px; 
            height: 8px; 
            background-color: white; 
            border-radius: 50%;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-outage-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .bindTooltip(`${outage.municipality} - ${outage.affectedUsers?.toLocaleString('it-IT') || 0} utenti`, {
          direction: 'top',
          opacity: 0.9
        })
        .on('click', () => {
          setSelectedOutage(outage);
          setShowOutagePopup(true);
        });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [outages, filteredOutages]);



  const changeLayer = (layerType: string) => {
    if (!mapInstanceRef.current?.map || !mapInstanceRef.current?.L) return;

    const { map, L } = mapInstanceRef.current;

    // Remove current tile layer
    if (mapInstanceRef.current.tileLayer) {
      map.removeLayer(mapInstanceRef.current.tileLayer);
    }

    // Add new tile layer
    let tileUrl = '';
    let attribution = '';

    switch (layerType) {
      case 'satellite':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = '© Esri';
        break;
      case 'humanitarian':
        tileUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
        attribution = '© OpenStreetMap contributors, Tiles style by HOT';
        break;
      case 'standard':
        // Uso server alternative per compatibilità mobile
        tileUrl = 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png';
        attribution = '© OpenStreetMap contributors';
        break;
      case 'cartodb':
      default: // CartoDB come default per compatibilità mobile
        tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        attribution = '© OpenStreetMap © CartoDB';
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      crossOrigin: true
    });

    // Gestione errori layer con fallback automatico migliorato
    let errorCount = 0;
    newTileLayer.on('tileerror', (error: any) => {
      errorCount++;
      console.warn(`🚨 Errore caricamento tile ${layerType} (#${errorCount}):`, error);
      
      // Se troppi errori, prova fallback
      if (errorCount > 3) {
        if (layerType === 'standard') {
          console.log('🔄 Troppi errori con server DE, provo server alternativo...');
          
          // Prova server OpenStreetMap Francia (più mobile-friendly)
          map.removeLayer(newTileLayer);
          const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors © OpenStreetMap France',
            maxZoom: 19,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            crossOrigin: true
          }).addTo(map);
          
          mapInstanceRef.current.tileLayer = fallbackLayer;
          
          // Se anche Francia fallisce, vai a CartoDB
          fallbackLayer.on('tileerror', () => {
            console.log('🔄 Anche server Francia fallisce, passaggio a CartoDB definitivo');
            toast({
              title: "Passaggio a CartoDB",
              description: "Mappa Standard ottimizzata per il tuo dispositivo mobile",
              variant: "default",
            });
            setTimeout(() => changeLayer('cartodb'), 1000);
          });
          
        } else {
          // Per altri layer, vai direttamente a CartoDB
          toast({
            title: "Problema di connessione",
            description: "Passaggio automatico a CartoDB per prestazioni migliori",
            variant: "default",
          });
          setTimeout(() => changeLayer('cartodb'), 1000);
        }
      }
    });

    newTileLayer.addTo(map);

    mapInstanceRef.current.tileLayer = newTileLayer;
    setCurrentLayer(layerType);
    setShowLayerMenu(false);
  };

  const toggleDistanceTool = () => {
    setIsDistanceToolActive(!isDistanceToolActive);
    // In a real implementation, you would enable/disable distance measurement
    console.log('Distance tool:', !isDistanceToolActive ? 'activated' : 'deactivated');
  };

  // Helper functions for outage popup  
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Non disponibile';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      // Mostra sempre l'ora italiana (fuso orario Europe/Rome)
      return date.toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ' alle');
    } catch {
      return 'Data non valida';
    }
  };

  const calculateDuration = (outage: Outage) => {
    if (!outage.startTime) return 'Non disponibile';
    const start = new Date(outage.startTime);
    const end = outage.actualResolution ? new Date(outage.actualResolution) : new Date();
    const diff = Math.abs(end.getTime() - start.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusConfig = (status: string, isPlanned: boolean) => {
    if (isPlanned) {
      return {
        label: 'Lavoro Programmato',
        color: 'bg-amber-500 text-white',
        icon: Calendar,
        description: 'Manutenzione programmata della rete elettrica'
      };
    }
    
    switch (status) {
      case 'active':
        return {
          label: 'Guasto in Corso',
          color: 'bg-red-500 text-white',
          icon: Clock,
          description: 'Interruzione di corrente non programmata'
        };
      case 'resolved':
        return {
          label: 'Risolto',
          color: 'bg-green-500 text-white',
          icon: Info,
          description: 'Servizio elettrico ripristinato'
        };
      default:
        return {
          label: 'Stato Sconosciuto',
          color: 'bg-gray-500 text-white',
          icon: Info,
          description: 'Informazioni non disponibili'
        };
    }
  };

  if (error) {
    return (
      <main className="flex-1 relative flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Errore nel caricamento dei dati</span>

          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="flex-1 relative">
      {/* Map */}
      <div 
        ref={mapRef} 
        className="w-full h-full bg-slate-100 dark:bg-slate-800"
        style={{ 
          background: isLoading ? 'linear-gradient(45deg, #f1f5f9 25%, #e2e8f0 25%, #e2e8f0 50%, #f1f5f9 50%, #f1f5f9 75%, #e2e8f0 75%)' : undefined,
          backgroundSize: isLoading ? '20px 20px' : undefined 
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Caricamento mappa...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Advanced Features Toolbar - Right Side - PIÙ VISIBILI E CLICCABILI */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1001]">
        {/* Advanced Filters - BLU (Funzione principale) */}
        <Button
          size="sm"
          onClick={() => setShowAdvancedFilters(true)}
          className={`h-10 w-10 shadow-lg border-2 transition-all duration-200 ${
            activeFilters 
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
              : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400'
          }`}
          title="Filtri Avanzati - Filtra per località, tipo, durata"
        >
          <Filter className="w-5 h-5" />
        </Button>

        {/* Statistics Dashboard - VERDE (Analisi) */}
        <Button
          size="sm"
          onClick={() => setShowStats(true)}
          className="h-10 w-10 bg-green-500 hover:bg-green-600 text-white border-2 border-green-400 shadow-lg transition-all duration-200"
          title="Dashboard Statistiche - Grafici e analisi dati"
        >
          <BarChart3 className="w-5 h-5" />
        </Button>

        {/* History - VIOLA (Cronologia) */}
        <Button
          size="sm"
          onClick={() => setShowHistory(true)}
          className="h-10 w-10 bg-purple-500 hover:bg-purple-600 text-white border-2 border-purple-400 shadow-lg transition-all duration-200"
          title="Cronologia Guasti - Timeline dettagliata"
        >
          <Calendar className="w-5 h-5" />
        </Button>


        

        {/* Layer Selector - GRIGIO SCURO (Strumento) */}
        <div className="relative">
          <Button
            size="sm"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="h-10 w-10 bg-gray-600 hover:bg-gray-700 text-white border-2 border-gray-500 shadow-lg transition-all duration-200"
            title="Cambia tipo mappa"
          >
            <Layers className="w-5 h-5" />
          </Button>
          
          {/* Layer Menu - PIÙ GRANDE E CLICCABILE */}
          {showLayerMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-[1002]">
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Tipo Mappa</h3>
                <Button 
                  variant={currentLayer === 'standard' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => {
                    changeLayer('standard');
                    setShowLayerMenu(false);
                  }}
                  title="OpenStreetMap ottimizzato per mobile"
                >
                  🗺️ Standard
                </Button>
                <Button 
                  variant={currentLayer === 'satellite' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => {
                    changeLayer('satellite');
                    setShowLayerMenu(false);
                  }}
                >
                  🛰️ Satellite
                </Button>
                <Button 
                  variant={currentLayer === 'humanitarian' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => {
                    changeLayer('humanitarian');
                    setShowLayerMenu(false);
                  }}
                >
                  🏥 Humanitarian
                </Button>
                <Button 
                  variant={currentLayer === 'cartodb' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => {
                    changeLayer('cartodb');
                    setShowLayerMenu(false);
                  }}
                >
                  🎨 CartoDB (Mobile)
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Distance Measurement Tool - ARANCIONE (Strumento attivo) */}
        <Button
          size="sm"
          onClick={toggleDistanceTool}
          className={`h-10 w-10 border-2 shadow-lg transition-all duration-200 ${
            isDistanceToolActive 
              ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500' 
              : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-400'
          }`}
          title="Strumento di misurazione distanze"
        >
          <Ruler className="w-5 h-5" />
        </Button>
        
        {/* Refresh Data - ROSSO (Priorità alta) */}
        <Button
          size="sm"
          onClick={async () => {
            console.log('🔄 Refresh button clicked - forcing server update');
            await onRefresh();
            console.log('✅ Refresh completed');
          }}
          disabled={isLoading}
          className={`h-10 w-10 border-2 shadow-lg transition-all duration-200 ${
            isLoading 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-400' 
              : 'bg-red-500 hover:bg-red-600 text-white border-red-400'
          }`}
          title={isLoading ? "Aggiornamento in corso..." : "Aggiorna dati guasti dal server"}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {/* Credits - Solo in basso a destra, discreto */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-600 opacity-50 hover:opacity-75 transition-opacity duration-200 z-[999]">
        Sviluppato da Younes El Mabtouti
      </div>

      {/* Overlay click handler for closing layer menu */}
      {showLayerMenu && (
        <div 
          className="fixed inset-0 z-[999]" 
          onClick={() => setShowLayerMenu(false)}
        />
      )}

      {/* Outage Details Popup Modal */}
      {showOutagePopup && selectedOutage && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[9999]"
            onClick={() => setShowOutagePopup(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <Card className="m-4 shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Dettagli Interruzione</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOutagePopup(false)}
                    className="p-2 hover:bg-accent rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {(() => {
                  const statusConfig = getStatusConfig(selectedOutage.status, selectedOutage.isPlanned);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div className="mt-4">
                      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="font-semibold">{statusConfig.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{statusConfig.description}</p>
                    </div>
                  );
                })()}
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Utenti Coinvolti */}
                <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {(selectedOutage.affectedUsers || 0).toLocaleString('it-IT')}
                        </div>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80">Clienti coinvolti</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Posizione */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                    Localizzazione
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Zona</span>
                      <p className="font-medium">{selectedOutage.zone || 'Non specificata'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comune</span>
                      <p className="font-medium">{selectedOutage.municipality || 'Non specificato'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Provincia</span>
                      <p className="font-medium">{selectedOutage.province || 'Non specificata'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Durata</span>
                      <p className="font-medium">{calculateDuration(selectedOutage)}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground">Coordinate GPS</span>
                    <p className="font-mono text-sm">
                      {parseFloat(selectedOutage.latitude).toFixed(6)}, {parseFloat(selectedOutage.longitude).toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Timer className="w-4 h-4 mr-2 text-orange-500" />
                    Timeline Eventi
                  </h4>
                  <div className="space-y-3">
                    {selectedOutage.startTime && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Inizio Interruzione</p>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedOutage.startTime)}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOutage.lastUpdate && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Ultimo Aggiornamento</p>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedOutage.lastUpdate)}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOutage.estimatedResolution && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Ripristino Previsto</p>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedOutage.estimatedResolution)}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedOutage.actualResolution && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-sm">Servizio Ripristinato</p>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedOutage.actualResolution)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Causa */}
                {selectedOutage.cause && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-purple-500" />
                      Causa
                    </h4>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedOutage.cause}</p>
                  </div>
                )}

                {/* ID Tecnico */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ID SISTEMA ENEL</p>
                      <p className="font-mono text-sm font-bold">{selectedOutage.id}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigator.clipboard?.writeText(selectedOutage.id)}
                    >
                      Copia
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* MODALI FUNZIONALI COMPLETI */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[5000] p-4">
          <AdvancedFilters 
            onFiltersChange={handleFiltersChange} 
            onClose={() => setShowAdvancedFilters(false)}
            outages={outages}
          />
        </div>
      )}

      {showStats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <StatsDashboard 
            outages={filteredOutages.length > 0 ? filteredOutages : outages} 
            onClose={() => setShowStats(false)} 
          />
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <OutageHistory 
            outages={filteredOutages.length > 0 ? filteredOutages : outages} 
            onClose={() => setShowHistory(false)} 
          />
        </div>
      )}

      {showShare && selectedOutage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <ShareOutage 
            outage={selectedOutage} 
            onClose={() => setShowShare(false)} 
          />
        </div>
      )}


    </main>
  );
}
