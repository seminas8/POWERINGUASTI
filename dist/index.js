// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";
import path from "path";
import express from "express";
async function preloadData() {
  console.log("\u{1F680} Precaricamento dati Enel all'avvio...");
  try {
    await fetchRealEnelOutages();
    console.log("\u2705 Dati precaricati con successo!");
  } catch (error) {
    console.log("\u26A0\uFE0F Precaricamento fallito, useremo il fallback:", error);
  }
}
async function registerRoutes(app2) {
  app2.use("/manifest.json", express.static(path.resolve("public/manifest.json")));
  app2.use("/service-worker.js", express.static(path.resolve("public/service-worker.js")));
  app2.use("/icon-192.png", express.static(path.resolve("public/icon-192.png")));
  app2.use("/icon-512.png", express.static(path.resolve("public/icon-512.png")));
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/ping", (req, res) => {
    res.json({ status: "alive", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/outages", async (req, res) => {
    try {
      const { status, zone } = req.query;
      let outages = await fetchRealEnelOutages();
      if (status && typeof status === "string") {
        outages = outages.filter((outage) => outage.status === status);
      }
      if (zone && typeof zone === "string") {
        outages = outages.filter((outage) => outage.zone.toLowerCase().includes(zone.toLowerCase()));
      }
      res.json(outages);
    } catch (error) {
      console.error("Error fetching outages:", error);
      res.status(500).json({ message: "Failed to fetch outages" });
    }
  });
  app2.get("/api/outages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const outages = await fetchRealEnelOutages();
      const outage = outages.find((o) => o.id === id);
      if (!outage) {
        return res.status(404).json({ message: "Outage not found" });
      }
      res.json(outage);
    } catch (error) {
      console.error("Error fetching outage:", error);
      res.status(500).json({ message: "Failed to fetch outage" });
    }
  });
  const httpServer = createServer(app2);
  if (process.env.NODE_ENV === "production") {
    setInterval(async () => {
      try {
        await fetch(`http://localhost:${process.env.PORT || 5e3}/api/health`);
      } catch (error) {
        console.log("Keep-alive ping failed:", error instanceof Error ? error.message : "Unknown error");
      }
    }, 5 * 60 * 1e3);
  }
  preloadData();
  return httpServer;
}
var cachedOutages = [];
var lastCacheUpdate = 0;
var CACHE_DURATION = 3e5;
var isUpdating = false;
async function fetchRealEnelOutages() {
  const now = Date.now();
  if (cachedOutages.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
    console.log(`\u26A1 Cache istantanea (${cachedOutages.length} guasti, ${Math.round((now - lastCacheUpdate) / 1e3)}s fa)`);
    return cachedOutages;
  }
  if (isUpdating) {
    console.log(`\u23F3 Aggiornamento in corso, usando cache esistente (${cachedOutages.length} guasti)`);
    return cachedOutages.length > 0 ? cachedOutages : getFallbackCalabriaOutages();
  }
  isUpdating = true;
  console.log("\u{1F50D} Provo multiple queries Enel per trovare guasti reali...");
  try {
    const baseUrl = "https://ineuportalgis.enel.com/server/rest/services/Hosted/ITA_power_cut_map_layer_View/FeatureServer/0/query";
    const headers = {
      "Accept": "*/*",
      "Accept-Language": "it-IT,it;q=0.6",
      "Priority": "u=1, i",
      "Referer": "https://ineuportalgis.enel.com/portal/apps/instant/media/index.html?appid=7d832c0db96c4bfe9cf9ca7b7782f200",
      "Sec-Ch-Ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Storage-Access": "none",
      "Sec-Gpc": "1",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };
    const geometryQueries = [
      // Nord-Ovest Italia
      "geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-1252344.271426987%2C%22ymin%22%3A6261721.357122989%2C%22xmax%22%3A-0.000002983957529067993%2C%22ymax%22%3A7514065.62854699%7D",
      // Nord-Est Italia
      "geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-0.000002983957529067993%2C%22ymin%22%3A6261721.357122989%2C%22xmax%22%3A1252344.271421019%2C%22ymax%22%3A7514065.62854699%7D",
      // Centro-Ovest Italia
      "geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-1252344.271426987%2C%22ymin%22%3A5009377.085698988%2C%22xmax%22%3A-0.000002983957529067993%2C%22ymax%22%3A6261721.357122989%7D",
      // Centro-Est Italia 
      "geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-0.000002983957529067993%2C%22ymin%22%3A5009377.085698988%2C%22xmax%22%3A2504688.542845018%2C%22ymax%22%3A7514065.62854699%7D",
      // Sud-Ovest Italia
      "geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-1252344.271426987%2C%22ymin%22%3A3757032.814274987%2C%22xmax%22%3A-0.000002983957529067993%2C%22ymax%22%3A5009377.085698988%7D",
      // Sud-Est Italia
      "geometry=%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%2C%22xmin%22%3A-0.000002983957529067993%2C%22ymin%22%3A2504688.542850986%2C%22xmax%22%3A2504688.542845018%2C%22ymax%22%3A5009377.085698988%7D"
    ];
    let allOutages = [];
    try {
      console.log("\u{1F4E1} Ricerca TUTTI i guasti disponibili (senza limiti)...");
      const simpleQuery = `f=json&where=1%3D1&outFields=*&returnGeometry=true&resultRecordCount=1000`;
      const testResponse = await fetch(`${baseUrl}?${simpleQuery}`, {
        method: "GET",
        headers
      });
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`\u{1F50D} Query completa trovata: ${testData.features?.length || 0} guasti totali in Italia`);
        if (testData.features && testData.features.length > 0) {
          allOutages.push(...testData.features);
        }
      }
    } catch (error) {
      console.log("\u26A0\uFE0F Errore query completa:", error);
    }
    if (allOutages.length === 0) {
      for (let i = 0; i < geometryQueries.length; i++) {
        try {
          const queryParams = `f=json&${geometryQueries[i]}&maxRecordCountFactor=3&orderByFields=objectid1%20ASC&outFields=*&outSR=102100&quantizationParameters=%7B%22extent%22%3A%7B%22spatialReference%22%3A%7B%22latestWkid%22%3A3857%2C%22wkid%22%3A102100%7D%7D%2C%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%7D&returnGeometry=true&spatialRel=esriSpatialRelIntersects&where=1%3D1`;
          console.log(`\u{1F4E1} Query geometrica ${i + 1}/${geometryQueries.length}`);
          const response = await fetch(`${baseUrl}?${queryParams}`, {
            method: "GET",
            headers
          });
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              console.log(`\u2705 Trovati ${data.features.length} guasti in zona ${i + 1}`);
              allOutages.push(...data.features);
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        } catch (error) {
          console.log(`\u26A0\uFE0F Errore query zona ${i + 1}:`, error);
        }
      }
    }
    console.log(`\u{1F50D} Totale guasti trovati: ${allOutages.length}`);
    if (allOutages.length === 0) {
      console.log("\u26A0\uFE0F Nessun guasto reale trovato, uso dati fallback");
      return getFallbackCalabriaOutages();
    }
    const transformedOutages = allOutages.map((feature, index) => {
      const attrs = feature.attributes || {};
      const geom = feature.geometry;
      let lat = 41.9028;
      let lng = 12.4964;
      if (attrs.latitudine && attrs.longitudine) {
        lat = parseFloat(attrs.latitudine);
        lng = parseFloat(attrs.longitudine);
      } else if (geom && geom.x !== void 0 && geom.y !== void 0) {
        const x = geom.x;
        const y = geom.y;
        lng = x / 20037508342789244e-9 * 180;
        lat = Math.atan(Math.exp(y / 20037508342789244e-9 * Math.PI)) * 360 / Math.PI - 90;
      }
      let municipality = "Comune non specificato";
      let province = attrs.provincia || "Provincia non specificata";
      let zone = attrs.regione || "Regione non specificata";
      if (attrs.descrizione_territoriale) {
        const desc = attrs.descrizione_territoriale.toString();
        const parts = desc.split("-");
        if (parts.length > 1) {
          municipality = parts.slice(1).join("-").trim();
        } else {
          municipality = desc.trim();
        }
      }
      if (municipality === "Comune non specificato" || municipality === "") {
        if (lat >= 37.5 && lat <= 40.5 && lng >= 15 && lng <= 17.5) {
          zone = "Regione Calabria";
          if (lat >= 39.2 && lng >= 16.2) {
            municipality = "Cosenza";
            province = "CS";
          } else if (lat <= 38.1 && lng >= 15.6) {
            municipality = "Reggio Calabria";
            province = "RC";
          } else if (lat >= 38.8 && lat <= 39.2 && lng >= 16.5) {
            municipality = "Catanzaro";
            province = "CZ";
          } else if (lat >= 38.5 && lat <= 38.8 && lng >= 16 && lng <= 16.5) {
            municipality = "Vibo Valentia";
            province = "VV";
          } else if (lat >= 39 && lng >= 17) {
            municipality = "Crotone";
            province = "KR";
          } else {
            municipality = "Area Calabria";
            province = "CL";
          }
        } else if (lat >= 36 && lat <= 39 && lng >= 12 && lng <= 16) {
          zone = "Regione Sicilia";
          municipality = "Area Sicilia";
          province = "SIC";
        } else if (lat >= 38 && lat <= 42 && lng >= 8 && lng <= 10.5) {
          zone = "Regione Sardegna";
          municipality = "Area Sardegna";
          province = "SAR";
        } else if (lat >= 44) {
          zone = "Italia Settentrionale";
          municipality = "Nord Italia";
          province = "NORD";
        } else if (lat >= 41 && lat < 44) {
          zone = "Italia Centrale";
          municipality = "Centro Italia";
          province = "CENTRO";
        } else {
          zone = "Italia Meridionale";
          municipality = "Sud Italia";
          province = "SUD";
        }
      }
      const isDST = (date) => {
        const year = date.getFullYear();
        const march = new Date(year, 2, 31);
        const october = new Date(year, 9, 31);
        const lastSundayMarch = new Date(march);
        lastSundayMarch.setDate(31 - march.getDay());
        const lastSundayOctober = new Date(october);
        lastSundayOctober.setDate(31 - october.getDay());
        return date >= lastSundayMarch && date < lastSundayOctober;
      };
      const parseEnelDate = (dateValue) => {
        if (!dateValue) return null;
        try {
          if (typeof dateValue === "number") {
            return new Date(dateValue);
          }
          if (typeof dateValue === "string") {
            const dateStr = dateValue.trim();
            if (dateStr === "") return null;
            if (dateStr.includes("T") || dateStr.includes("Z")) {
              return new Date(dateStr);
            }
            if (dateStr.includes("/") && dateStr.includes(" ")) {
              const [datePart, timePart] = dateStr.split(" ");
              const [day, month, year] = datePart.split("/");
              const [hours, minutes] = timePart.split(":");
              const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
              const isLegalTime = isDST(localDate);
              const offsetHours = isLegalTime ? 2 : 1;
              const utcDate = new Date(localDate.getTime() - offsetHours * 60 * 60 * 1e3);
              return utcDate;
            }
            return new Date(dateStr);
          }
          return null;
        } catch (error) {
          console.log(`Errore parsing data: ${dateValue}`, error);
          return null;
        }
      };
      const startTime = parseEnelDate(attrs.data_interruzione) || /* @__PURE__ */ new Date();
      const lastUpdate = parseEnelDate(attrs.dataultimoaggiornamento) || /* @__PURE__ */ new Date();
      const estimatedResolution = parseEnelDate(attrs.data_prev_ripristino);
      return {
        id: `enel-real-${attrs.objectid1 || index}`,
        status: "active",
        zone,
        municipality,
        province,
        latitude: lat.toString(),
        longitude: lng.toString(),
        affectedUsers: attrs.num_cli_disalim || 0,
        cause: attrs.causa_disalimentazione || "Guasto elettrico - Enel",
        startTime,
        lastUpdate,
        estimatedResolution,
        actualResolution: null,
        isPlanned: attrs.causa_disalimentazione?.toLowerCase().includes("programmato") || false
      };
    });
    console.log(`\u{1F3AF} Integrazione Enel completata: ${transformedOutages.length} guasti reali caricati!`);
    cachedOutages = transformedOutages;
    lastCacheUpdate = Date.now();
    isUpdating = false;
    return transformedOutages;
  } catch (error) {
    console.error("\u274C Errore API Enel:", error instanceof Error ? error.message : error);
    isUpdating = false;
    const now2 = Date.now();
    if (cachedOutages.length > 0) {
      console.log(`\u{1F4BE} Usando cache obsoleta (${Math.round((now2 - lastCacheUpdate) / 1e3)}s fa)`);
      return cachedOutages;
    }
    console.log("\u{1F504} Fallback a dati demo");
    return getFallbackCalabriaOutages();
  }
}
function getFallbackCalabriaOutages() {
  return [
    {
      id: "cal-cosenza-001",
      status: "active",
      zone: "Cosenza Centro",
      municipality: "Cosenza",
      province: "CS",
      latitude: "39.2986",
      longitude: "16.2543",
      affectedUsers: 1250,
      cause: "Interruzione per guasto su linea di media tensione",
      startTime: new Date(Date.now() - 3 * 60 * 60 * 1e3),
      lastUpdate: new Date(Date.now() - 30 * 60 * 1e3),
      estimatedResolution: new Date(Date.now() + 1 * 60 * 60 * 1e3),
      actualResolution: null,
      isPlanned: false
    },
    {
      id: "cal-reggio-002",
      status: "active",
      zone: "Reggio Calabria Sud",
      municipality: "Reggio Calabria",
      province: "RC",
      latitude: "38.1067",
      longitude: "15.6536",
      affectedUsers: 2100,
      cause: "Guasto tecnico su trasformatore di cabina primaria",
      startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1e3),
      lastUpdate: new Date(Date.now() - 45 * 60 * 1e3),
      estimatedResolution: new Date(Date.now() + 2.5 * 60 * 60 * 1e3),
      actualResolution: null,
      isPlanned: false
    },
    {
      id: "cal-catanzaro-003",
      status: "planned",
      zone: "Catanzaro Lido",
      municipality: "Catanzaro",
      province: "CZ",
      latitude: "38.9097",
      longitude: "16.5897",
      affectedUsers: 850,
      cause: "Manutenzione programmata rete di distribuzione",
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1e3),
      lastUpdate: new Date(Date.now() - 15 * 60 * 1e3),
      estimatedResolution: new Date(Date.now() + 6 * 60 * 60 * 1e3),
      actualResolution: null,
      isPlanned: true
    }
  ];
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
