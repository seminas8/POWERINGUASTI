# Powering guasti - Electrical Grid Outage Monitoring System

## Overview

This is a full-stack web application for monitoring electrical grid outages in Italy. The system displays real outage information from Enel's API on an interactive map with advanced visualization capabilities, filtering options, and real-time updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds
- **Map Integration**: Leaflet for interactive map visualization with OpenStreetMap tiles

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Data Storage**: In-memory demo data (no database required)
- **Authentication**: None (simplified single-page application)
- **Build**: ESBuild for production bundling

### Project Structure
- **Monorepo**: Shared schema and types between client and server
- **Client Directory**: Frontend application (`/client`)
- **Server Directory**: Backend API (`/server`) 
- **Shared Directory**: Common schemas and types (`/shared`)

## Key Components

### Data Structure
- **Outages Data**: In-memory Calabria-focused demo data with:
  - Geographic data (latitude, longitude, zone, municipality, province)
  - Status tracking (active, planned, resolved)
  - Timing information (startTime, estimatedResolution, actualResolution)
  - Impact metrics (affectedUsers, cause)
  - Planning flags (isPlanned)

### API Layer
- **Outage Routes**:
  - `GET /api/outages` - Fetch Calabria outages with optional status/zone filtering
  - `GET /api/outages/:id` - Get specific outage details
  - Demo data focused on Calabria region (Cosenza, Reggio Calabria, Catanzaro, Vibo Valentia, Crotone)
- **Utility Routes**:
  - `/api/health` - Health check for connection monitoring
  - `/ping` - External monitoring endpoint

### Frontend Components
- **MapContainer**: Interactive Leaflet map with outage markers, layer switching, fullscreen mode, and distance tools
- **FilterSidebar**: Status filtering (active/planned/resolved), zone selection, and location finding
- **OutageDetailsPanel**: Detailed outage information with timeline and status
- **Header**: Real-time statistics, theme toggle, settings button, and connection status
- **MobileSidebar**: Responsive sidebar for mobile devices
- **Settings Page**: Complete configuration interface for notifications and theme preferences
- **NotificationToast**: Visual notification alerts with animations and sound integration
- **useNotifications Hook**: Real-time notification monitoring with localStorage persistence

## Data Flow

1. **Direct Access**: No authentication required, direct access to dashboard
2. **Data Fetching**: TanStack Query manages outage data with 30-second refresh intervals
3. **Real-time Updates**: Automatic background refresh with connection monitoring
4. **State Management**: Client-side filtering and map state managed locally
5. **Data Source**: In-memory demo data representing Calabria electrical grid outages

## External Dependencies

### Frontend Dependencies
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Mapping**: Leaflet for interactive maps
- **Forms**: React Hook Form with Zod validation
- **Utilities**: date-fns for date formatting, clsx for class management

### Backend Dependencies
- **Runtime**: Node.js with Express.js
- **Data**: In-memory demo data (no external database)
- **Authentication**: None (simplified application)

### Build Dependencies
- **Frontend**: Vite with React plugin and TypeScript
- **Backend**: ESBuild for production bundling
- **Development**: tsx for TypeScript execution

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with nodemon-like behavior
- **Data**: In-memory demo data, no database setup required

### Production
- **Frontend**: Static build via Vite to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Serving**: Express serves both API and static files
- **Data**: In-memory demo data, no external dependencies

### Environment Configuration
- No environment variables required for basic operation
- Optional: External API keys for real outage data integration

### Key Architectural Decisions

1. **Simplified Architecture**: No authentication or database - direct access to monitoring dashboard
2. **Calabria Focus**: Map and data specifically centered on Calabria region for targeted monitoring
3. **In-memory Data**: Demo outage data stored in memory for simplicity and fast response times
4. **TanStack Query**: Provides robust caching, background updates, and error handling for API requests
5. **Leaflet Maps**: Open-source mapping solution with focus on Calabria region (38.9097, 16.5897)
6. **Monorepo Structure**: Shared types between frontend and backend for type safety
7. **Vite Build System**: Fast development experience with optimized production builds

### Recent Changes (August 2, 2025)
- ✓ Completely removed authentication system (no login required)
- ✓ Removed database integration (PostgreSQL, Drizzle ORM)
- ✓ Eliminated all SQL dependencies and Drizzle ORM packages  
- ✓ Focused application on Calabria region with targeted demo data
- ✓ Simplified to single-page application with direct dashboard access
- ✓ Updated outage data to represent 5 Calabria provinces (CS, RC, CZ, VV, KR)
- ✓ Configured map to center on Calabria coordinates (38.9097, 16.5897, zoom 9)
- ✓ **SUCCESSFULLY INTEGRATED REAL ENEL API** - 175+ authentic outages loaded
- ✓ Authentic headers and query parameters captured from real Enel portal
- ✓ Coordinate conversion from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
- ✓ Geographic classification for all Italian regions (Calabria, Sicilia, Sardegna, etc.)
- ✓ Real-time data: "Lavoro Programmato", "Guasto", actual affected user counts
- ✓ Fallback system maintains functionality when API unavailable
- ✓ **NOTIFICATION SYSTEM** - Complete notification system for Calabria outages
- ✓ Desktop notifications with permission handling
- ✓ Custom sound notifications with 4 selectable sound types (beep, alert, chime, urgent)
- ✓ **SETTINGS PAGE** - Full settings interface with dark mode toggle
- ✓ Configurable notification preferences (enable/disable, sound selection, desktop alerts)
- ✓ Real-time settings synchronization via localStorage
- ✓ Filter for Calabria-only notifications (excludes scheduled maintenance)
- ✓ **PRESTAZIONI OTTIMIZZATE** - Cache estesa a 5 minuti per caricamento istantaneo
- ✓ Precaricamento dati all'avvio del server per zero attese
- ✓ Sistema di notifiche mobile/APK compatibile con toast e vibrazione
- ✓ **INTERFACCIA SEMPLIFICATA** - Rimossi pulsanti non necessari (schermo intero, esporta dati, segnala guasto)
- ✓ **SISTEMA COLORI PER IMPORTANZA** - Pulsanti colorati per priorità (rosso=critico, blu=principale, verde=analisi, viola=cronologia, arancione=strumenti, grigio=utilità)
- ✓ Controlli essenziali riorganizzati nel pannello destro per migliore UX
- ✓ **REFRESH MIGLIORATO** - Pulsante aggiornamento dati ora forza refresh dal server Enel
- ✓ **MAPPA MOBILE RISOLTO** - Server OpenStreetMap alternativo (DE + Francia) con fallback automatico per dispositivi Android/APK
- ✓ **PWA COMPLETA** - manifest.json, service-worker, icone 192/512px con design PoweringGuasti professionale
- ✓ Crediti sviluppatore discreti: Younes El Mabtouti
- ✓ **STATIC DEPLOY READY** - Configurazione ottimizzata per hosting esterno
- ✓ **PERCORSI RELATIVI** - URLs corretti per deploy su CDN/server esterni
- ✓ **SPA ROUTING** - File 404.html e _redirects per gestione routing client-side
- ✓ **BUILD OTTIMIZZATO** - Pacchetto 300KB pronto per GitHub Pages, Netlify, Vercel
- ✓ **SERVICE WORKER DISABILITATO** - Compatibilità hosting statico migliorata