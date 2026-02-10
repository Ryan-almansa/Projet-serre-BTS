// ========================================
// FICHIER DE CONFIGURATION - config.js
// ========================================
// À placer dans : /front/config.js
// À inclure dans index.html : <script src="config.js"></script>

/**
 * Configuration centralisée du système de suivi
 * Modifiez ces valeurs pour adapter à vos besoins
 */

// Configuration API
const API_CONFIG = {
    baseUrl: 'http://172.29.16.154/api',
    endpoints: {
        login: '/login',
        inscription: '/inscription',
        info: '/info',
        history: '/history',  // ← NOUVEAU
        control: '/control'
    },
    timeout: 10000  // 10 secondes
};

// Configuration polling temps réel
const POLLING_CONFIG = {
    enabled: true,
    interval: 5000,  // 5 secondes - Modifier ici pour changer la fréquence
    retryCount: 3,
    retryDelay: 2000
};

// Configuration graphiques
const CHART_CONFIG = {
    maxPoints: 100,  // Max points affichés simultaneously
    updateAnimation: false,  // true pour animation douce, false pour instant
    responsive: true,
    maintainAspectRatio: false,
    timezone: 'Europe/Paris',
    timeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }
};

// Configuration historique
const HISTORY_CONFIG = {
    enabled: true,
    duration: 24,  // Charger les 24 dernières heures
    unit: 'hour',
    autoLoad: true,  // Charger automatiquement au démarrage
    cacheTimeout: 600000  // Cache pendant 10 minutes
};

// Configuration alertes
const ALERT_CONFIG = {
    temperature: {
        min: 15,
        max: 32,
        warning: { min: 18, max: 28 }
    },
    humidity: {
        min: 20,
        max: 85,
        warning: { min: 40, max: 70 }
    },
    enabled: true,
    soundNotification: false
};

// Configuration UI
const UI_CONFIG = {
    theme: 'light',  // 'light' ou 'dark'
    animationsEnabled: true,
    compactMode: false,
    showFPS: false  // Afficher FPS de refresh (dev)
};

// Configuration persistance données
const STORAGE_CONFIG = {
    localStorage: true,
    sessionStorage: true,
    indexedDB: false,
    keys: {
        token: 'token',
        user: 'user',
        chartData: 'chartData',
        lastSync: 'lastSync'
    }
};

// Exporter pour utilisation dans script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        POLLING_CONFIG,
        CHART_CONFIG,
        HISTORY_CONFIG,
        ALERT_CONFIG,
        UI_CONFIG,
        STORAGE_CONFIG
    };
}

// ========================================
// UTILISATION DANS script.js
// ========================================
/*

// Au lieu de :
const CONFIG = {
    apiUrl: 'http://172.29.16.154/api',
    updateInterval: 5000,
    chartMaxPoints: 20,
};

// Utilisez :
const CONFIG = {
    apiUrl: API_CONFIG.baseUrl,
    updateInterval: POLLING_CONFIG.interval,
    chartMaxPoints: CHART_CONFIG.maxPoints,
};

// Pour les modificateurs :
function startDataPolling() {
    if (!POLLING_CONFIG.enabled) {
        console.log('⚠️ Polling désactivé dans la configuration');
        return;
    }
    
    fetchSensorData();
    setInterval(fetchSensorData, POLLING_CONFIG.interval);
}

async function loadHistoricalData() {
    if (!HISTORY_CONFIG.autoLoad) {
        console.log('⚠️ Chargement historique désactivé');
        return;
    }
    
    // ... reste du code ...
}

*/

// ========================================
// PRESETS RECOMMANDÉS
// ========================================

/*

// PRESET 1 : Performance Max (serveurs faibles)
POLLING_CONFIG.interval = 10000;  // 10 secondes
CHART_CONFIG.maxPoints = 50;
HISTORY_CONFIG.duration = 12;  // 12 heures

// PRESET 2 : Temps Réel (serveurs puissants)
POLLING_CONFIG.interval = 1000;  // 1 seconde
CHART_CONFIG.maxPoints = 300;
HISTORY_CONFIG.duration = 72;  // 3 jours

// PRESET 3 : Production Standard (DÉFAUT)
POLLING_CONFIG.interval = 5000;  // 5 secondes
CHART_CONFIG.maxPoints = 100;
HISTORY_CONFIG.duration = 24;  // 24 heures

// PRESET 4 : Basse Consommation (batterie/mobile)
POLLING_CONFIG.interval = 30000;  // 30 secondes
CHART_CONFIG.maxPoints = 40;
HISTORY_CONFIG.duration = 6;  // 6 heures

*/
