import { X, Clock, MapPin, Users, AlertTriangle, Zap, Calendar, Timer, Info, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Outage } from "@/types/outage";
// date-fns rimosso: ora usiamo toLocaleString con fuso orario italiano

interface OutageDetailsPanelProps {
  outage: Outage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OutageDetailsPanel({ outage, isOpen, onClose }: OutageDetailsPanelProps) {
  if (!isOpen || !outage) {
    return null;
  }

  const statusConfig = {
    active: { 
      label: 'Guasto in Corso', 
      color: 'bg-red-500 text-white', 
      icon: AlertTriangle,
      description: 'Interruzione di corrente non programmata'
    },
    planned: { 
      label: 'Lavoro Programmato', 
      color: 'bg-amber-500 text-white', 
      icon: Calendar,
      description: 'Manutenzione programmata della rete elettrica'
    },
    resolved: { 
      label: 'Risolto', 
      color: 'bg-green-500 text-white', 
      icon: Zap,
      description: 'Servizio elettrico ripristinato'
    }
  };

  const currentStatus = statusConfig[outage.status as keyof typeof statusConfig] || statusConfig.active;
  const StatusIcon = currentStatus.icon;

  const calculateDuration = () => {
    if (!outage.startTime) return 'Non disponibile';
    const start = new Date(outage.startTime);
    const end = outage.actualResolution ? new Date(outage.actualResolution) : new Date();
    const diff = Math.abs(end.getTime() - start.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

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

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return 'Non disponibile';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      // Mostra sempre l'ora italiana (fuso orario Europe/Rome)
      return date.toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-background border-l border-border shadow-2xl 
        transform transition-transform duration-300 overflow-y-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          
          {/* Header con Status Badge */}
          <div className="bg-gradient-to-r from-background to-muted/30 p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <StatusIcon className="w-6 h-6 text-muted-foreground" />
                <h2 className="text-xl font-bold">Dettagli Interruzione</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Status Badge Grande */}
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${currentStatus.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-semibold">{currentStatus.label}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{currentStatus.description}</p>
          </div>
          
          {/* Contenuto Scrollabile */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* Card Utenti Coinvolti */}
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="w-5 h-5 mr-2 text-red-500" />
                    Utenti Coinvolti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500 mb-1">
                    {(outage.affectedUsers || 0).toLocaleString('it-IT')}
                  </div>
                  <p className="text-sm text-muted-foreground">Clienti senza corrente elettrica</p>
                </CardContent>
              </Card>

              {/* Card Posizione */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                    Localizzazione
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Zona</span>
                      <p className="font-medium">{outage.zone || 'Non specificata'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comune</span>
                      <p className="font-medium">{outage.municipality || 'Non specificato'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Provincia</span>
                      <p className="font-medium">{outage.province || 'Non specificata'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Durata</span>
                      <p className="font-medium">{calculateDuration()}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground">Coordinate GPS</span>
                    <p className="font-mono text-sm">
                      {parseFloat(outage.latitude).toFixed(6)}, {parseFloat(outage.longitude).toFixed(6)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Timer className="w-5 h-5 mr-2 text-orange-500" />
                    Timeline Eventi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Inizio Guasto */}
                    {outage.startTime && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Inizio Interruzione</p>
                          <p className="text-sm text-muted-foreground">{formatDate(outage.startTime)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Risoluzione Stimata */}
                    {outage.estimatedResolution && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Risoluzione Stimata</p>
                          <p className="text-sm text-muted-foreground">{formatDate(outage.estimatedResolution)}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Risoluzione Effettiva */}
                    {outage.actualResolution && (
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Servizio Ripristinato</p>
                          <p className="text-sm text-muted-foreground">{formatDate(outage.actualResolution)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card Causa (se disponibile) */}
              {outage.cause && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Info className="w-5 h-5 mr-2 text-purple-500" />
                      Causa dell'Interruzione
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{outage.cause}</p>
                  </CardContent>
                </Card>
              )}

              {/* Card ID Tecnico */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ID SISTEMA ENEL</p>
                      <p className="font-mono text-sm font-bold">{outage.id}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3"
                      onClick={() => navigator.clipboard?.writeText(outage.id)}
                    >
                      Copia ID
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
          
          {/* Footer con Timestamp */}
          <div className="border-t border-border p-4 bg-muted/20">
            <p className="text-xs text-center text-muted-foreground">
              Dati aggiornati in tempo reale dal sistema Enel
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
