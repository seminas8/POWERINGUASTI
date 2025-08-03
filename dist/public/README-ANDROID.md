# PoweringGuasti - Android WebView Package

## 📱 Build Standalone per Android WebView

Questo pacchetto contiene l'app PoweringGuasti ottimizzata per integrazione in Android WebView.

## 📁 Contenuto Pacchetto

```
dist/public/
├── index.html                    # Entry point principale
├── assets/
│   ├── index-CgzI_hEd.css       # Styles compilati (77KB)
│   ├── index-DMw-tibB.js        # App JavaScript (852KB)
│   └── leaflet-src-tUDVrd57.js  # Mappa Leaflet (149KB)
└── android-webview-poweringuasti.tar.gz  # Pacchetto compresso
```

**Dimensione totale:** ~1.4MB

## 🎯 Caratteristiche

### ✅ Ottimizzazioni Android WebView
- **No backend dependencies** - Chiamate dirette all'API Enel
- **Service Worker disabilitato** - Compatibilità WebView
- **URL relativi** - Funziona da file:// locale
- **Cache API intelligente** - 5 minuti per performance
- **Fallback demo** - Dati Calabria se API non disponibile

### ✅ Funzionalità Complete
- **Mappa interattiva** - 273+ guasti reali Italia
- **Filtri avanzati** - Status, regione, utenti affetti
- **Dati autentici** - API Enel in tempo reale
- **Mobile responsive** - Ottimizzato per touch
- **Dark mode** - Supporto tema scuro/chiaro

### ✅ API Esterne Utilizzate
- **Enel Outages API** - `https://dynatrace.saas.enel.com/bf/...`
- **OpenStreetMap Tiles** - `https://tile.openstreetmap.org/`
- **Google Fonts** - Inter font family

## 🔧 Integrazione Android Studio

### 1. Copia Files
```bash
# Estrai il pacchetto
tar -xzf android-webview-poweringuasti.tar.gz

# Copia in Android project
cp -r index.html assets/ /path/to/android/app/src/main/assets/
```

### 2. WebView Configuration
```java
WebView webView = findViewById(R.id.webview);
WebSettings webSettings = webView.getSettings();

// Abilita JavaScript (richiesto)
webSettings.setJavaScriptEnabled(true);

// Permetti accesso internet per API
webSettings.setDomStorageEnabled(true);
webSettings.setAllowFileAccess(true);
webSettings.setAllowContentAccess(true);

// Performance
webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);

// Carica l'app
webView.loadUrl("file:///android_asset/index.html");
```

### 3. Permissions AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 🌐 API Requirements

L'app richiede connessione internet per:
- **Dati guasti** - API Enel (essenziale)
- **Tile mappa** - OpenStreetMap (essenziale)  
- **Fonts** - Google Fonts (opzionale)

## 🚀 Performance

- **First Load:** ~2-3 secondi
- **Cache API:** 5 minuti (configurabile)
- **Map Tiles:** Cache browser automatica
- **Bundle size:** 852KB JS + 77KB CSS

## 🔍 Debug Android

Per debug su dispositivo Android:
1. Abilita **WebView debugging** in app
2. Chrome DevTools → `chrome://inspect`
3. Console logs disponibili per troubleshooting

## 📝 Note Tecniche

- **React Query:** Cache intelligente per API calls
- **Leaflet Maps:** Supporto touch e mobile gestures
- **Standalone mode:** Nessun server backend richiesto
- **Cross-origin:** Headers corretti per API Enel
- **Error handling:** Fallback automatico a dati demo

## 🎨 Personalizzazione

Per modificare l'app:
1. Modifica files sorgente in `/client/src/`
2. Riesegui `npm run build`
3. Copia nuovo build in Android assets

---

**Developed by:** Younes El Mabtouti  
**Version:** 2025.08.02  
**License:** MIT