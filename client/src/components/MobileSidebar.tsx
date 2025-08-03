import { X, MapPin, Navigation, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Outage } from "@/types/outage";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export function MobileSidebar({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  stats, 
  outages 
}: MobileSidebarProps) {
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
    const lat = 38.9897;
    const lng = 16.7989;
    window.dispatchEvent(new CustomEvent('locate-user', {
      detail: { lat, lng, zoom: 13 }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-background border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filtri e Controlli</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-6">
          
          {/* Status Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Stato</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-status-active"
                  checked={filters.status.active}
                  onCheckedChange={(checked) => handleStatusChange('active', checked as boolean)}
                />
                <label htmlFor="mobile-status-active" className="flex items-center space-x-2 text-sm cursor-pointer">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Attivi</span>
                  <span className="text-xs text-muted-foreground">({stats.totalActive})</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-status-planned"
                  checked={filters.status.planned}
                  onCheckedChange={(checked) => handleStatusChange('planned', checked as boolean)}
                />
                <label htmlFor="mobile-status-planned" className="flex items-center space-x-2 text-sm cursor-pointer">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Programmati</span>
                  <span className="text-xs text-muted-foreground">({stats.totalPlanned})</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile-status-resolved"
                  checked={filters.status.resolved}
                  onCheckedChange={(checked) => handleStatusChange('resolved', checked as boolean)}
                />
                <label htmlFor="mobile-status-resolved" className="flex items-center space-x-2 text-sm cursor-pointer">
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
              <div className="bg-muted/50 rounded-md p-3 border border-border">
                <div className="text-2xl font-semibold text-destructive">
                  {stats.totalAffected.toLocaleString('it-IT')}
                </div>
                <div className="text-xs text-muted-foreground">Clienti coinvolti</div>
              </div>
              <div className="bg-muted/50 rounded-md p-3 border border-border">
                <div className="text-2xl font-semibold text-amber-500">
                  {stats.avgDuration}
                </div>
                <div className="text-xs text-muted-foreground">Durata media</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
