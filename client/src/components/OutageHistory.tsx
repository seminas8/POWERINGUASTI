import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, TrendingUp, X } from 'lucide-react';
import { Outage } from '@shared/schema';

interface OutageHistoryProps {
  outages: Outage[];
  onClose: () => void;
}

export function OutageHistory({ outages, onClose }: OutageHistoryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Filtra i guasti per periodo
  const filterByPeriod = (outages: Outage[], period: 'week' | 'month' | 'year') => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (period) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return outages.filter(outage => new Date(outage.startTime) >= cutoff);
  };

  const filteredOutages = filterByPeriod(outages, selectedPeriod);
  
  // Statistiche
  const stats = {
    total: filteredOutages.length,
    active: filteredOutages.filter(o => o.status === 'active').length,
    resolved: filteredOutages.filter(o => o.status === 'resolved').length,
    planned: filteredOutages.filter(o => o.isPlanned).length,
    totalUsers: filteredOutages.reduce((sum, o) => sum + o.affectedUsers, 0)
  };

  // Raggruppa per provincia
  const byProvince = filteredOutages.reduce((acc, outage) => {
    if (!acc[outage.province]) acc[outage.province] = [];
    acc[outage.province].push(outage);
    return acc;
  }, {} as Record<string, Outage[]>);

  const getStatusColor = (status: string, isPlanned: boolean) => {
    if (isPlanned) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (start: Date, end: Date | null) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className="w-full max-w-6xl mx-4 shadow-2xl h-[90vh] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Cronologia Guasti</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Periodo di selezione */}
        <div className="flex space-x-2 mt-4">
          {(['week', 'month', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'week' ? 'Ultima Settimana' : 
               period === 'month' ? 'Ultimo Mese' : 'Ultimo Anno'}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1 overflow-y-auto">
        {/* Statistiche generali */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Totale Guasti</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.active}</div>
            <div className="text-xs text-red-600 dark:text-red-400">Attivi</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</div>
            <div className="text-xs text-green-600 dark:text-green-400">Risolti</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.planned}</div>
            <div className="text-xs text-orange-600 dark:text-orange-400">Programmati</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(stats.totalUsers / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Utenti Coinvolti</div>
          </div>
        </div>

        {/* Statistiche per provincia */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Guasti per Provincia</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(byProvince)
              .sort(([,a], [,b]) => b.length - a.length)
              .slice(0, 6)
              .map(([province, provinceOutages]) => (
              <div key={province} className="p-3 border rounded-lg bg-card">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{province}</div>
                  <Badge variant="secondary">{provinceOutages.length}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {provinceOutages.reduce((sum, o) => sum + o.affectedUsers, 0).toLocaleString()} utenti
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista dettagliata */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Elenco Dettagliato</h3>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredOutages
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((outage) => (
                <div key={outage.id} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{outage.municipality}</span>
                      <Badge variant="outline">{outage.province}</Badge>
                    </div>
                    <Badge className={getStatusColor(outage.status, outage.isPlanned)}>
                      {outage.isPlanned ? 'Programmato' : 
                       outage.status === 'active' ? 'Attivo' : 'Risolto'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">{outage.cause}</div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{outage.affectedUsers.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(outage.startTime, outage.actualResolution)}</span>
                      </div>
                    </div>
                    <div>{new Date(outage.startTime).toLocaleDateString('it-IT', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}