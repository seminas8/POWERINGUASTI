import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Filter, Search, X, Calendar, Users, Zap } from 'lucide-react';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  onClose: () => void;
  outages?: any[]; // Per calcolare anteprima risultati
}

export interface FilterOptions {
  searchAddress: string;
  causeType: string;
  minUsers: number;
  maxUsers: number;
  duration: string;
  dateRange: string;
  region: string;
}

const DEFAULT_FILTERS: FilterOptions = {
  searchAddress: '',
  causeType: 'all',
  minUsers: 0,
  maxUsers: 10000,
  duration: 'all',
  dateRange: 'all',
  region: 'all'
};

export function AdvancedFilters({ onFiltersChange, onClose, outages = [] }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

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

  // Funzione per applicare filtri in anteprima
  const applyFiltersPreview = (outages: any[], filters: FilterOptions) => {
    if (!outages.length) return { filteredOutages: [], totalUsers: 0 };
    
    const filtered = outages.filter(outage => {
      // Filtro per indirizzo/località
      if (filters.searchAddress && !outage.municipality?.toLowerCase().includes(filters.searchAddress.toLowerCase()) &&
          !outage.zone?.toLowerCase().includes(filters.searchAddress.toLowerCase())) {
        return false;
      }
      
      // Filtro per regione - mappo provincia a regione
      if (filters.region !== 'all') {
        const outageRegion = getRegionFromProvince(outage.province);
        console.log(`🔍 Debug filtro regione: Guasto ${outage.id} - Provincia: ${outage.province} -> Regione: ${outageRegion}, Filtro: ${filters.region}`);
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
      if (filters.duration !== 'all' && outage.startTime) {
        const start = new Date(outage.startTime);
        const end = outage.actualResolution ? new Date(outage.actualResolution) : new Date();
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        if (filters.duration === 'short' && durationHours >= 2) return false;
        if (filters.duration === 'medium' && (durationHours < 2 || durationHours > 6)) return false;
        if (filters.duration === 'long' && durationHours <= 6) return false;
        if (filters.duration === 'ongoing' && outage.status !== 'active') return false;
      }
      
      // Filtro per periodo temporale
      if (filters.dateRange !== 'all' && outage.startTime) {
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

    const totalUsers = filtered.reduce((sum, outage) => sum + (outage.affectedUsers || 0), 0);
    return { filteredOutages: filtered, totalUsers };
  };

  // Calcola anteprima risultati in tempo reale
  const previewResults = applyFiltersPreview(outages, filters);
  
  // Debug per verificare dati - solo per test
  if (filters.region === 'Piemonte') {
    console.log('🔍 PIEMONTE TEST:', {
      region: filters.region,
      piemonteOutages: outages.filter(o => getRegionFromProvince(o.province) === 'Piemonte').length,
      filteredCount: previewResults.filteredOutages.length,
      samplePiemonte: outages.filter(o => getRegionFromProvince(o.province) === 'Piemonte').slice(0, 3).map(o => ({ province: o.province, users: o.affectedUsers }))
    });
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  return (
    <Card className="w-full max-w-4xl mx-4 shadow-2xl h-[90vh] flex flex-col relative z-[5000]">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtri Avanzati</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1 overflow-y-auto">
        {/* Ricerca per indirizzo */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Cerca per Indirizzo/Località</span>
          </Label>
          <Input
            placeholder="Es: Roma, Via del Corso, Napoli Centro..."
            value={filters.searchAddress}
            onChange={(e) => handleFilterChange('searchAddress', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Regione */}
          <div className="space-y-2">
            <Label>Regione</Label>
            <Select value={filters.region} onValueChange={(value) => handleFilterChange('region', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tutte le regioni" />
              </SelectTrigger>
              <SelectContent className="z-[10000] max-h-[300px] overflow-y-auto">
                <SelectItem value="all">Tutte le Regioni</SelectItem>
                <SelectItem value="Abruzzo">Abruzzo</SelectItem>
                <SelectItem value="Basilicata">Basilicata</SelectItem>
                <SelectItem value="Calabria">Calabria</SelectItem>
                <SelectItem value="Campania">Campania</SelectItem>
                <SelectItem value="Emilia-Romagna">Emilia-Romagna</SelectItem>
                <SelectItem value="Friuli-Venezia Giulia">Friuli-Venezia Giulia</SelectItem>
                <SelectItem value="Lazio">Lazio</SelectItem>
                <SelectItem value="Liguria">Liguria</SelectItem>
                <SelectItem value="Lombardia">Lombardia</SelectItem>
                <SelectItem value="Marche">Marche</SelectItem>
                <SelectItem value="Molise">Molise</SelectItem>
                <SelectItem value="Piemonte">Piemonte</SelectItem>
                <SelectItem value="Puglia">Puglia</SelectItem>
                <SelectItem value="Sardegna">Sardegna</SelectItem>
                <SelectItem value="Sicilia">Sicilia</SelectItem>
                <SelectItem value="Toscana">Toscana</SelectItem>
                <SelectItem value="Trentino-Alto Adige">Trentino-Alto Adige</SelectItem>
                <SelectItem value="Umbria">Umbria</SelectItem>
                <SelectItem value="Valle d'Aosta">Valle d'Aosta</SelectItem>
                <SelectItem value="Veneto">Veneto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo di Causa */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Tipo di Causa</span>
            </Label>
            <Select value={filters.causeType} onValueChange={(value) => handleFilterChange('causeType', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent className="z-[10000] max-h-[300px] overflow-y-auto">
                <SelectItem value="all">Tutti i Tipi</SelectItem>
                <SelectItem value="guasto">Guasto Tecnico</SelectItem>
                <SelectItem value="manutenzione">Manutenzione</SelectItem>
                <SelectItem value="meteo">Condizioni Meteorologiche</SelectItem>
                <SelectItem value="lavori">Lavori Programmati</SelectItem>
                <SelectItem value="sovraccarico">Sovraccarico Rete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Durata */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Durata Interruzione</span>
            </Label>
            <Select value={filters.duration} onValueChange={(value) => handleFilterChange('duration', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tutte le durate" />
              </SelectTrigger>
              <SelectContent className="z-[10000] max-h-[300px] overflow-y-auto">
                <SelectItem value="all">Tutte le Durate</SelectItem>
                <SelectItem value="short">Breve (meno di 2 ore)</SelectItem>
                <SelectItem value="medium">Media (2-6 ore)</SelectItem>
                <SelectItem value="long">Lunga (oltre 6 ore)</SelectItem>
                <SelectItem value="ongoing">In corso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Slider utenti coinvolti */}
        <div className="space-y-4">
          <Label className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Utenti Coinvolti: {filters.minUsers} - {filters.maxUsers}</span>
          </Label>
          <div className="px-2">
            <Slider
              value={[filters.minUsers, filters.maxUsers]}
              onValueChange={([min, max]) => {
                handleFilterChange('minUsers', min);
                handleFilterChange('maxUsers', max);
              }}
              max={10000}
              min={0}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>5,000</span>
              <span>10,000+</span>
            </div>
          </div>
        </div>

        {/* Periodo temporale */}
        <div className="space-y-2">
          <Label>Periodo di Riferimento</Label>
          <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tutto il periodo" />
            </SelectTrigger>
            <SelectContent className="z-[10000] max-h-[300px] overflow-y-auto">
              <SelectItem value="all">Tutto il Periodo</SelectItem>
              <SelectItem value="today">Oggi</SelectItem>
              <SelectItem value="week">Ultima Settimana</SelectItem>
              <SelectItem value="month">Ultimo Mese</SelectItem>
              <SelectItem value="active">Solo Attivi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview risultati in tempo reale */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Anteprima Risultati</span>
            </div>
            <div className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded-full">
              {Object.values(filters).filter(v => v !== 'all' && v !== '' && v !== 0 && v !== 10000).length} filtri attivi
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {previewResults.filteredOutages.length.toLocaleString('it-IT')}
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Guasti trovati</p>
              <p className="text-xs text-muted-foreground">su {outages.length.toLocaleString('it-IT')} totali</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {previewResults.totalUsers.toLocaleString('it-IT')}
              </div>
              <p className="text-xs text-red-600/80 dark:text-red-400/80">Utenti Coinvolti</p>
              <p className="text-xs text-muted-foreground">totale impattati</p>
            </div>
          </div>
          
          {previewResults.filteredOutages.length === 0 && Object.values(filters).some(v => v !== 'all' && v !== '' && v !== 0 && v !== 10000) && (
            <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">
              ⚠️ Nessun risultato trovato con i filtri attuali
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Azzera Filtri</span>
          </Button>
          <Button 
            onClick={() => {
              console.log('🎯 Filtri applicati dalla UI:', filters);
              onClose();
            }}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Applica Filtri</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}