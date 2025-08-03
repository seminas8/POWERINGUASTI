import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, MessageCircle, Mail, ExternalLink, X, Check } from 'lucide-react';
import { Outage } from '@shared/schema';

interface ShareOutageProps {
  outage: Outage;
  onClose: () => void;
}

export function ShareOutage({ outage, onClose }: ShareOutageProps) {
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  // Genera URL condivisibile
  const shareUrl = `${window.location.origin}?outage=${outage.id}`;
  
  // Messaggio predefinito
  const defaultMessage = `🔴 Interruzione corrente in corso a ${outage.municipality} (${outage.province})
  
📍 Zona: ${outage.zone}
👥 Utenti coinvolti: ${outage.affectedUsers.toLocaleString()}
🕐 Inizio: ${new Date(outage.startTime).toLocaleString('it-IT')}
${outage.estimatedResolution ? `⏰ Risoluzione stimata: ${new Date(outage.estimatedResolution).toLocaleString('it-IT')}` : ''}

🔧 Causa: ${outage.cause}

Monitora in tempo reale: ${shareUrl}

#GuastiElettrici #${outage.province} #EnelItalia`;

  const finalMessage = customMessage || defaultMessage;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Errore durante la copia:', err);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Interruzione corrente - ${outage.municipality} (${outage.province})`);
    const body = encodeURIComponent(finalMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/?text=${message}`);
  };

  const shareViaTelegram = () => {
    const message = encodeURIComponent(finalMessage);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${message}`);
  };

  const shareViaX = () => {  // Twitter/X
    const message = encodeURIComponent(finalMessage.substring(0, 240) + '...');
    window.open(`https://twitter.com/intent/tweet?text=${message}`);
  };

  const getStatusBadge = () => {
    if (outage.isPlanned) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Programmato</Badge>;
    }
    switch (outage.status) {
      case 'active':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Attivo</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Risolto</Badge>;
      default:
        return <Badge variant="secondary">{outage.status}</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-4 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Condividi Guasto</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Dettagli del guasto */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{outage.municipality}</h3>
            {getStatusBadge()}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>📍 {outage.zone} • {outage.province}</div>
            <div>👥 {outage.affectedUsers.toLocaleString()} utenti coinvolti</div>
            <div>🕐 {new Date(outage.startTime).toLocaleString('it-IT')}</div>
            {outage.estimatedResolution && (
              <div>⏰ Risoluzione stimata: {new Date(outage.estimatedResolution).toLocaleString('it-IT')}</div>
            )}
          </div>
        </div>

        {/* URL condivisibile */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Link Diretto</label>
          <div className="flex space-x-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(shareUrl)}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Messaggio personalizzabile */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Messaggio (personalizzabile)</label>
          <Textarea
            placeholder="Personalizza il messaggio o lascia vuoto per usare quello predefinito"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Anteprima messaggio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Anteprima</label>
          <div className="p-3 border rounded-lg bg-muted/30 text-sm whitespace-pre-line max-h-40 overflow-y-auto">
            {finalMessage}
          </div>
        </div>

        {/* Pulsanti di condivisione */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Condividi tramite</label>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(finalMessage)}
              className="flex items-center space-x-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>Copia Testo</span>
            </Button>

            <Button 
              variant="outline"
              onClick={shareViaEmail}
              className="flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </Button>

            <Button 
              variant="outline"
              onClick={shareViaWhatsApp}
              className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </Button>

            <Button 
              variant="outline"
              onClick={shareViaTelegram}
              className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Telegram</span>
            </Button>

            <Button 
              variant="outline"
              onClick={shareViaX}
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20 dark:hover:bg-gray-900/30"
            >
              <ExternalLink className="w-4 h-4" />
              <span>X (Twitter)</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Guasto ${outage.municipality}`,
                    text: finalMessage,
                    url: shareUrl
                  });
                } else {
                  copyToClipboard(finalMessage);
                }
              }}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Condividi</span>
            </Button>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          💡 <strong>Suggerimento:</strong> Condividi questo guasto per tenere informati i tuoi contatti nella zona. 
          Il link rimane sempre aggiornato con le informazioni più recenti.
        </div>
      </CardContent>
    </Card>
  );
}