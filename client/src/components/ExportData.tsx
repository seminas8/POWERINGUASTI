import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Table, X, Calendar } from 'lucide-react';
import { Outage } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ExportDataProps {
  outages: Outage[];
  onClose: () => void;
}

export function ExportData({ outages, onClose }: ExportDataProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'active' | 'resolved' | 'calabria'>('all');
  const [includeFields, setIncludeFields] = useState({
    basic: true,
    location: true,
    timing: true,
    technical: true,
    users: true
  });

  const filterOutages = (outages: Outage[], scope: string) => {
    switch (scope) {
      case 'active':
        return outages.filter(o => o.status === 'active');
      case 'resolved':
        return outages.filter(o => o.status === 'resolved');
      case 'calabria':
        return outages.filter(o => ['CS', 'RC', 'CZ', 'VV', 'KR'].includes(o.province));
      default:
        return outages;
    }
  };

  const generateCSV = (data: Outage[]) => {
    const headers = [];
    const fieldMap: Record<string, string[]> = {
      basic: ['id', 'status'],
      location: ['municipality', 'province', 'zone', 'latitude', 'longitude'],
      timing: ['startTime', 'lastUpdate', 'estimatedResolution', 'actualResolution'],
      technical: ['cause', 'isPlanned'],
      users: ['affectedUsers']
    };

    // Costruisci headers basati sui campi selezionati
    Object.entries(includeFields).forEach(([category, included]) => {
      if (included) {
        headers.push(...fieldMap[category]);
      }
    });

    const csvContent = [
      headers.join(','),
      ...data.map(outage => 
        headers.map(header => {
          let value = (outage as any)[header];
          if (value instanceof Date) {
            value = value.toISOString();
          }
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const generateJSON = (data: Outage[]) => {
    const filtered = data.map(outage => {
      const result: any = {};
      
      if (includeFields.basic) {
        result.id = outage.id;
        result.status = outage.status;
      }
      if (includeFields.location) {
        result.municipality = outage.municipality;
        result.province = outage.province;
        result.zone = outage.zone;
        result.latitude = outage.latitude;
        result.longitude = outage.longitude;
      }
      if (includeFields.timing) {
        result.startTime = outage.startTime;
        result.lastUpdate = outage.lastUpdate;
        result.estimatedResolution = outage.estimatedResolution;
        result.actualResolution = outage.actualResolution;
      }
      if (includeFields.technical) {
        result.cause = outage.cause;
        result.isPlanned = outage.isPlanned;
      }
      if (includeFields.users) {
        result.affectedUsers = outage.affectedUsers;
      }

      return result;
    });

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalRecords: filtered.length,
      scope: exportScope,
      data: filtered
    }, null, 2);
  };

  const generatePDF = (data: Outage[]) => {
    // Genera un report HTML che può essere convertito in PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report Guasti Elettrici - ${new Date().toLocaleDateString('it-IT')}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .status-active { color: #dc2626; font-weight: bold; }
          .status-resolved { color: #16a34a; font-weight: bold; }
          .planned { color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Report Guasti Elettrici</h1>
          <p>Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
          <p>Ambito: ${exportScope === 'all' ? 'Tutti i guasti' : 
                      exportScope === 'active' ? 'Solo guasti attivi' :
                      exportScope === 'resolved' ? 'Solo guasti risolti' : 'Solo Calabria'}</p>
        </div>

        <div class="stats">
          <div class="stat-box">
            <h3>${data.length}</h3>
            <p>Totale Guasti</p>
          </div>
          <div class="stat-box">
            <h3>${data.filter(o => o.status === 'active').length}</h3>
            <p>Attivi</p>
          </div>
          <div class="stat-box">
            <h3>${data.filter(o => o.status === 'resolved').length}</h3>
            <p>Risolti</p>
          </div>
          <div class="stat-box">
            <h3>${data.reduce((sum, o) => sum + o.affectedUsers, 0).toLocaleString()}</h3>
            <p>Utenti Coinvolti</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${includeFields.basic ? '<th>ID</th><th>Status</th>' : ''}
              ${includeFields.location ? '<th>Comune</th><th>Provincia</th><th>Zona</th>' : ''}
              ${includeFields.timing ? '<th>Inizio</th><th>Risoluzione Est.</th>' : ''}
              ${includeFields.users ? '<th>Utenti</th>' : ''}
              ${includeFields.technical ? '<th>Causa</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${data.map(outage => `
              <tr>
                ${includeFields.basic ? `
                  <td>${outage.id}</td>
                  <td class="status-${outage.status} ${outage.isPlanned ? 'planned' : ''}">${
                    outage.isPlanned ? 'Programmato' : 
                    outage.status === 'active' ? 'Attivo' : 'Risolto'
                  }</td>
                ` : ''}
                ${includeFields.location ? `
                  <td>${outage.municipality}</td>
                  <td>${outage.province}</td>
                  <td>${outage.zone}</td>
                ` : ''}
                ${includeFields.timing ? `
                  <td>${new Date(outage.startTime).toLocaleString('it-IT')}</td>
                  <td>${outage.estimatedResolution ? new Date(outage.estimatedResolution).toLocaleString('it-IT') : 'N/A'}</td>
                ` : ''}
                ${includeFields.users ? `<td>${outage.affectedUsers.toLocaleString()}</td>` : ''}
                ${includeFields.technical ? `<td>${outage.cause}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
          <p>Report generato da Powering Guasti - Sviluppato da Younes El Mabtouti</p>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  const handleExport = async () => {
    try {
      const filteredData = filterOutages(outages, exportScope);
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'csv':
          content = generateCSV(filteredData);
          filename = `guasti_${exportScope}_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = generateJSON(filteredData);
          filename = `guasti_${exportScope}_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'pdf':
          content = generatePDF(filteredData);
          filename = `report_guasti_${exportScope}_${new Date().toISOString().split('T')[0]}.html`;
          mimeType = 'text/html';
          break;
        default:
          throw new Error('Formato non supportato');
      }

      // Crea e scarica il file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Esportazione Completata",
        description: `File ${filename} scaricato con successo!`,
        duration: 3000,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Errore Esportazione",
        description: "Si è verificato un errore durante l'esportazione dei dati.",
        variant: "destructive",
      });
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'all': return 'Tutti i Guasti';
      case 'active': return 'Solo Guasti Attivi';
      case 'resolved': return 'Solo Guasti Risolti';
      case 'calabria': return 'Solo Calabria';
      default: return 'Tutti i Guasti';
    }
  };

  const filteredCount = filterOutages(outages, exportScope).length;

  return (
    <Card className="w-full max-w-2xl mx-4 shadow-2xl h-[90vh] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Esporta Dati</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1 overflow-y-auto">
        {/* Formato di esportazione */}
        <div className="space-y-2">
          <Label>Formato di Esportazione</Label>
          <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center space-x-2">
                  <Table className="w-4 h-4" />
                  <span>CSV (Excel, Fogli Google)</span>
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>JSON (Sviluppo, API)</span>
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>HTML Report (Stampa, PDF)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ambito di esportazione */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Ambito di Esportazione</span>
          </Label>
          <Select value={exportScope} onValueChange={(value: any) => setExportScope(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Guasti ({outages.length})</SelectItem>
              <SelectItem value="active">Solo Guasti Attivi ({outages.filter(o => o.status === 'active').length})</SelectItem>
              <SelectItem value="resolved">Solo Guasti Risolti ({outages.filter(o => o.status === 'resolved').length})</SelectItem>
              <SelectItem value="calabria">Solo Calabria ({outages.filter(o => ['CS', 'RC', 'CZ', 'VV', 'KR'].includes(o.province)).length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campi da includere */}
        <div className="space-y-3">
          <Label>Campi da Includere</Label>
          <div className="space-y-3">
            {[
              { key: 'basic', label: 'Informazioni Base', desc: 'ID, Status' },
              { key: 'location', label: 'Posizione', desc: 'Comune, Provincia, Zona, Coordinate' },
              { key: 'timing', label: 'Tempi', desc: 'Inizio, Aggiornamento, Risoluzione' },
              { key: 'technical', label: 'Dettagli Tecnici', desc: 'Causa, Tipo (Programmato/Guasto)' },
              { key: 'users', label: 'Utenti Coinvolti', desc: 'Numero utenti interessati' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start space-x-3">
                <Checkbox
                  id={key}
                  checked={includeFields[key as keyof typeof includeFields]}
                  onCheckedChange={(checked) => 
                    setIncludeFields(prev => ({ ...prev, [key]: checked === true }))
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                  </label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anteprima */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">Anteprima Esportazione</h3>
          <div className="space-y-1 text-sm">
            <div><strong>Formato:</strong> {exportFormat.toUpperCase()}</div>
            <div><strong>Ambito:</strong> {getScopeLabel(exportScope)}</div>
            <div><strong>Record da esportare:</strong> {filteredCount}</div>
            <div><strong>Campi inclusi:</strong> {Object.values(includeFields).filter(Boolean).length}/5</div>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleExport} disabled={filteredCount === 0}>
            <Download className="w-4 h-4 mr-2" />
            Esporta {filteredCount} Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}