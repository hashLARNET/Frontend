// Configuración de la aplicación
const CONFIG = {
    // Supabase Configuration - Se configurarán en Netlify
    SUPABASE_URL: typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : window.SUPABASE_URL,
    SUPABASE_ANON_KEY: typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : window.SUPABASE_ANON_KEY,
    
    // Backend API Configuration
    API_BASE_URL: typeof process !== 'undefined' && process.env ? process.env.API_BASE_URL : window.API_BASE_URL || 'http://localhost:8000',
    
    // App Settings
    APP_TITLE: 'Sistema de Inventario Multi-Bodega',
    APP_VERSION: '1.0.0',
    
    // Scanner Configuration
    SCANNER_CONFIG: {
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner'),
            constraints: {
                width: 640,
                height: 480,
                facingMode: "environment" // Usar cámara trasera en móviles
            },
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader"
            ]
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        locate: true,
        src: null
    }
};

// Variables globales para Netlify (se sobreescriben con environment variables)
window.SUPABASE_URL = 'https://ahjlhqhetugmqdoscnbr.supabase.co/';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoamxocWhldHVnbXFkb3NjbmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjI2MTMsImV4cCI6MjA2NzczODYxM30.k01s6f-gEaOBzPp1T2oCmnfi3UEIlBnY08Fr_dbLH1o';
window.API_BASE_URL = 'https://your-backend.railway.app';