import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, X, Users, Zap, Clock, MapPin } from 'lucide-react';
import { Outage } from '@shared/schema';

interface StatsDashboardProps {
  outages: Outage[];
  onClose: () => void;
}

export function StatsDashboard({ outages, onClose }: StatsDashboardProps) {
  const [activeChart, setActiveChart] = useState<'provinces' | 'status' | 'timeline' | 'causes'>('provinces');

  // Calcola statistiche generali
  const totalOutages = outages.length;
  const activeOutages = outages.filter(o => o.status === 'active').length;
  const totalUsers = outages.reduce((sum, o) => sum + o.affectedUsers, 0);
  const avgDuration = outages.length > 0 ? 
    outages.reduce((sum, o) => {
      const start = new Date(o.startTime);
      const end = o.actualResolution ? new Date(o.actualResolution) : new Date();
      return sum + (end.getTime() - start.getTime());
    }, 0) / outages.length / (1000 * 60 * 60) : 0; // in ore

  // Dati per grafico province
  const provinceData = Object.entries(
    outages.reduce((acc, outage) => {
      acc[outage.province] = (acc[outage.province] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([province, count]) => ({ province, count, users: outages.filter(o => o.province === province).reduce((sum, o) => sum + o.affectedUsers, 0) }));

  // Dati per grafico status
  const statusData = [
    { name: 'Attivi', value: outages.filter(o => o.status === 'active').length, color: '#ef4444' },
    { name: 'Risolti', value: outages.filter(o => o.status === 'resolved').length, color: '#22c55e' },
    { name: 'Programmati', value: outages.filter(o => o.isPlanned).length, color: '#3b82f6' }
  ].filter(item => item.value > 0);

  // Dati per timeline (ultimi 7 giorni)
  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOutages = outages.filter(o => {
      const outageDate = new Date(o.startTime);
      return outageDate.toDateString() === date.toDateString();
    });
    return {
      date: date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit' }),
      count: dayOutages.length,
      users: dayOutages.reduce((sum, o) => sum + o.affectedUsers, 0)
    };
  });

  // Dati per cause
  const causeData = Object.entries(
    outages.reduce((acc, outage) => {
      const cause = outage.cause.includes('guasto') ? 'Guasti Tecnici' :
                   outage.cause.includes('manutenzione') || outage.cause.includes('programmata') ? 'Manutenzione' :
                   outage.cause.includes('meteo') || outage.cause.includes('maltempo') ? 'Condizioni Meteo' :
                   outage.cause.includes('lavori') ? 'Lavori' : 'Altri';
      acc[cause] = (acc[cause] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([cause, count]) => ({ cause, count }));

  const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const renderChart = () => {
    switch (activeChart) {
      case 'provinces':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={provinceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="province" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'count' ? `${value} guasti` : `${value.toLocaleString()} utenti`,
                  name === 'count' ? 'Numero Guasti' : 'Utenti Coinvolti'
                ]}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Guasti" />
              <Bar dataKey="users" fill="#ef4444" name="Utenti" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'status':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'timeline':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Guasti" />
              <Line type="monotone" dataKey="users" stroke="#ef4444" strokeWidth={2} name="Utenti (x1000)" 
                    dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'causes':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={causeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="cause" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-7xl mx-4 shadow-2xl h-[90vh] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard Statistiche</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1 overflow-y-auto">
        {/* Statistiche principali */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOutages}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Totale Guasti</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Zap className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{activeOutages}</div>
            <div className="text-sm text-red-600 dark:text-red-400">Attivi Ora</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Users className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(totalUsers / 1000).toFixed(0)}k
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Utenti Coinvolti</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {avgDuration.toFixed(1)}h
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Durata Media</div>
          </div>
        </div>

        {/* Selezione grafico */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'provinces', label: 'Per Province', icon: MapPin },
            { key: 'status', label: 'Per Status', icon: PieChartIcon },
            { key: 'timeline', label: 'Timeline', icon: TrendingUp },
            { key: 'causes', label: 'Per Cause', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeChart === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart(key as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        {/* Grafico principale - DIMENSIONE FISSA PER VISUALIZZAZIONE COMPLETA */}
        <div className="bg-card rounded-lg p-4 border min-h-[500px]">
          <h3 className="text-lg font-semibold mb-4">
            {activeChart === 'provinces' && 'Distribuzione per Province'}
            {activeChart === 'status' && 'Stati dei Guasti'}
            {activeChart === 'timeline' && 'Andamento Ultimi 7 Giorni'}
            {activeChart === 'causes' && 'Tipologie di Cause'}
          </h3>
          <div className="w-full h-[450px]">
            {renderChart()}
          </div>
        </div>

        {/* Top 5 zone più colpite */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Zone Più Colpite</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {provinceData.slice(0, 6).map((item, index) => (
              <div key={item.province} className="p-3 border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <span className="font-medium">{item.province}</span>
                  </div>
                  <Badge variant="destructive">{item.count}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {item.users.toLocaleString()} utenti coinvolti
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}