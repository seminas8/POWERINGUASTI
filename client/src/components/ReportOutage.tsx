import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Phone, User, X, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportOutageProps {
  onClose: () => void;
  defaultLocation?: { lat: number; lng: number };
}

interface OutageReport {
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  affectedUsers: number;
}

export function ReportOutage({ onClose, defaultLocation }: ReportOutageProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<OutageReport>({
    location: '',
    coordinates: defaultLocation,
    description: '',
    severity: 'medium',
    reporterName: '',
    reporterPhone: '',
    reporterEmail: '',
    affectedUsers: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simula invio segnalazione (in un'app reale invierebbe al server)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Segnalazione Inviata",
        description: "Grazie per la segnalazione. I tecnici valuteranno la situazione nel più breve tempo possibile.",
        duration: 5000,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio della segnalazione. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low': return 'Bassa - Interruzione parziale';
      case 'medium': return 'Media - Interruzione localizzata';
      case 'high': return 'Alta - Interruzione estesa';
      case 'critical': return 'Critica - Interruzione generale';
      default: return 'Media';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-4 shadow-2xl h-[90vh] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Segnala Guasto</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Segnala un'interruzione di corrente non ancora rilevata dal sistema automatico
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Posizione */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Località dell'Interruzione *</span>
            </Label>
            <Input
              placeholder="Es: Via Roma 123, Milano (MI) o coordinate GPS"
              value={report.location}
              onChange={(e) => setReport(prev => ({ ...prev, location: e.target.value }))}
              required
            />
            {defaultLocation && (
              <p className="text-xs text-muted-foreground">
                📍 Coordinate rilevate: {defaultLocation.lat.toFixed(4)}, {defaultLocation.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Gravità */}
          <div className="space-y-2">
            <Label>Gravità dell'Interruzione *</Label>
            <Select value={report.severity} onValueChange={(value: any) => setReport(prev => ({ ...prev, severity: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className={getSeverityColor('low')}>Bassa - Interruzione parziale</span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className={getSeverityColor('medium')}>Media - Interruzione localizzata</span>
                </SelectItem>
                <SelectItem value="high">
                  <span className={getSeverityColor('high')}>Alta - Interruzione estesa</span>
                </SelectItem>
                <SelectItem value="critical">
                  <span className={getSeverityColor('critical')}>Critica - Interruzione generale</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Seleziona la gravità basandoti sull'estensione dell'area colpita
            </p>
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label>Descrizione del Problema *</Label>
            <Textarea
              placeholder="Descrivi dettagliatamente il problema: quando è iniziata l'interruzione, area coinvolta, eventuali rumori o scintille osservate, etc."
              value={report.description}
              onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          {/* Numero utenti stimato */}
          <div className="space-y-2">
            <Label>Numero Stimato di Utenti Coinvolti</Label>
            <Select 
              value={report.affectedUsers.toString()} 
              onValueChange={(value) => setReport(prev => ({ ...prev, affectedUsers: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1-10 utenti (abitazione singola)</SelectItem>
                <SelectItem value="50">10-100 utenti (condominio/isolato)</SelectItem>
                <SelectItem value="250">100-500 utenti (quartiere piccolo)</SelectItem>
                <SelectItem value="1000">500-2000 utenti (quartiere grande)</SelectItem>
                <SelectItem value="5000">2000+ utenti (zona estesa)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dati del segnalatore */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Nome e Cognome *</span>
              </Label>
              <Input
                placeholder="Mario Rossi"
                value={report.reporterName}
                onChange={(e) => setReport(prev => ({ ...prev, reporterName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Telefono *</span>
              </Label>
              <Input
                type="tel"
                placeholder="+39 123 456 7890"
                value={report.reporterPhone}
                onChange={(e) => setReport(prev => ({ ...prev, reporterPhone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email (opzionale)</Label>
            <Input
              type="email"
              placeholder="mario.rossi@email.com"
              value={report.reporterEmail}
              onChange={(e) => setReport(prev => ({ ...prev, reporterEmail: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Lascia la tua email per ricevere aggiornamenti sulla risoluzione
            </p>
          </div>

          {/* Riepilogo */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Riepilogo Segnalazione</h3>
            <div className="space-y-1 text-sm">
              <div>📍 <strong>Località:</strong> {report.location || 'Non specificata'}</div>
              <div>🚨 <strong>Gravità:</strong> <span className={getSeverityColor(report.severity)}>{getSeverityLabel(report.severity)}</span></div>
              <div>👥 <strong>Utenti stimati:</strong> {report.affectedUsers}</div>
              <div>👤 <strong>Segnalatore:</strong> {report.reporterName || 'Non specificato'}</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <strong>Nota:</strong> Questa segnalazione verrà inoltrata ai tecnici competenti per la verifica. 
            In caso di emergenza o pericolo immediato, contatta direttamente il numero di emergenza 115 (Vigili del Fuoco) 
            o il servizio guasti Enel al numero verde 803.500.
          </div>

          {/* Pulsanti */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Invio in corso...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Invia Segnalazione
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}