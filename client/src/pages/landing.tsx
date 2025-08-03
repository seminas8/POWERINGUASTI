import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, MapPin, AlertTriangle, Clock } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        
        {/* Header */}
        <header className="relative z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Powering guasti</h1>
                  <p className="text-sm text-muted-foreground">Monitoraggio Rete Elettrica</p>
                </div>
              </div>
              <Button onClick={handleLogin} size="lg">
                Accedi
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {/* Hero Section */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Monitora i guasti elettrici
                <span className="block text-primary">in tempo reale</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Sistema avanzato per il monitoraggio degli outage della rete elettrica italiana 
                con mappa interattiva e dati in tempo reale dall'API Enel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleLogin} size="lg" className="px-8">
                  Inizia ora
                </Button>
                <Button variant="outline" size="lg" className="px-8">
                  Scopri di più
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
              <Card className="text-center border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Mappa Interattiva</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Visualizza tutti i guasti su una mappa interattiva con controlli avanzati
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <CardTitle className="text-lg">Dati in Tempo Reale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Integrazione diretta con l'API Enel per dati autentici e aggiornati
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-lg">Monitoraggio 24/7</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Sistema sempre attivo con notifiche e aggiornamenti automatici
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Analisi Avanzate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Statistiche dettagliate e filtri avanzati per analisi approfondite
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6">
                <div className="text-3xl font-bold text-destructive">1,247</div>
                <div className="text-sm text-muted-foreground">Guasti Attivi</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6">
                <div className="text-3xl font-bold text-amber-500">89</div>
                <div className="text-sm text-muted-foreground">Programmati</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-500">342</div>
                <div className="text-sm text-muted-foreground">Risolti Oggi</div>
              </div>
              <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6">
                <div className="text-3xl font-bold text-primary">45,289</div>
                <div className="text-sm text-muted-foreground">Utenti Monitorati</div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-2xl">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Pronto per iniziare?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Accedi ora per monitorare in tempo reale tutti i guasti della rete elettrica italiana 
                con la nostra piattaforma avanzata.
              </p>
              <Button onClick={handleLogin} size="lg" className="px-12">
                Accedi alla Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
