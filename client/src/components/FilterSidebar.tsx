import { MapPin, Navigation, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Outage } from "@/types/outage";

interface FilterSidebarProps {
  filters: {
    status: {
      active: boolean;
      planned: boolean;
      resolved: boolean;
    };
    zone: string;
  };
  onFiltersChange: (filters: any) => void;
  stats: {
    totalActive: number;
    totalPlanned: number;
    totalResolved: number;
    totalAffected: number;
    avgDuration: string;
  };
  outages: Outage[];
}

export function FilterSidebar({ filters, onFiltersChange, stats, outages }: FilterSidebarProps) {
  const handleStatusChange = (status: keyof typeof filters.status, checked: boolean) => {
    onFiltersChange({
      ...filters,
      status: {
        ...filters.status,
        [status]: checked,
      },
    });
  };

  const handleZoneChange = (zone: string) => {
    onFiltersChange({
      ...filters,
      zone,
    });
  };

  const handleFindMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Emit custom event for map component to handle
          window.dispatchEvent(new CustomEvent('locate-user', {
            detail: { lat: latitude, lng: longitude }
          }));
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const handleGoToSelliaMarina = () => {
    // Sellia Marina coordinates
    const lat = 38.9897;
    const lng = 16.7989;
    window.dispatchEvent(new CustomEvent('locate-user', {
      detail: { lat, lng, zoom: 13 }
    }));
  };

  return (
    <aside className="w-80 bg-muted/30 border-r border-border overflow-y-auto hidden lg:block">
      <div className="p-6 space-y-6">
        
        {/* Filters Header */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Filtri</h2>
          <p className="text-sm text-muted-foreground">Filtra i guasti per stato e zona</p>
        </div>
        
        {/* Legenda Colori */}
        <div className="space-y-3 p-3 bg-background/50 rounded-lg border border-border">
          <label className="text-sm font-medium">Legenda Mappa</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs">Guasti di emergenza</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-xs">Lavori programmati</span>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Stato</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-active"
                checked={filters.status.active}
                onCheckedChange={(checked) => handleStatusChange('active', checked as boolean)}
              />
              <label htmlFor="status-active" className="flex items-center space-x-2 text-sm cursor-pointer">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Attivi</span>
                <span className="text-xs text-muted-foreground">({stats.totalActive})</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-planned"
                checked={filters.status.planned}
                onCheckedChange={(checked) => handleStatusChange('planned', checked as boolean)}
              />
              <label htmlFor="status-planned" className="flex items-center space-x-2 text-sm cursor-pointer">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Programmati</span>
                <span className="text-xs text-muted-foreground">({stats.totalPlanned})</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-resolved"
                checked={filters.status.resolved}
                onCheckedChange={(checked) => handleStatusChange('resolved', checked as boolean)}
              />
              <label htmlFor="status-resolved" className="flex items-center space-x-2 text-sm cursor-pointer">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Risolti</span>
                <span className="text-xs text-muted-foreground">({stats.totalResolved})</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Zone Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Zone</label>
          <Select value={filters.zone} onValueChange={handleZoneChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tutte le zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le zone</SelectItem>
              <SelectItem value="nord">Nord Italia</SelectItem>
              <SelectItem value="centro">Centro Italia</SelectItem>
              <SelectItem value="sud">Sud Italia</SelectItem>
              <SelectItem value="sicilia">Sicilia</SelectItem>
              <SelectItem value="sardegna">Sardegna</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Map Controls */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Controlli Mappa</label>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleFindMyLocation}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Trova la mia posizione
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleGoToSelliaMarina}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Sellia Marina
            </Button>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <label className="text-sm font-medium">Statistiche</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-md p-3 border border-border">
              <div className="text-2xl font-semibold text-destructive">
                {stats.totalAffected.toLocaleString('it-IT')}
              </div>
              <div className="text-xs text-muted-foreground">Clienti coinvolti</div>
            </div>
            <div className="bg-background rounded-md p-3 border border-border">
              <div className="text-2xl font-semibold text-amber-500">
                {stats.avgDuration}
              </div>
              <div className="text-xs text-muted-foreground">Durata media</div>
            </div>
          </div>
        </div>
        
      </div>
    </aside>
  );
}
