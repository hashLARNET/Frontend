// APP.JS CORREGIDO - VERSIÓN FUNCIONAL
console.log('🚀 Iniciando Sistema de Inventario...');

class InventoryApp {
    constructor() {
        console.log('✅ InventoryApp instanciada');
        this.currentUser = null;
        this.currentWarehouse = null;
        this.currentPage = 'login';
        this.withdrawalItems = [];
        this.supabase = null;
        this.isCameraActive = false;
        
        this.init();
    }

    async init() {
        console.log('🎯 Inicializando aplicación...');
        
        try {
            // 1. Verificar configuración
            console.log('📋 Verificando configuración...');
            if (!window.CONFIG) {
                throw new Error('CONFIG no está definido. Verifica config.js');
            }
            console.log('✅ CONFIG cargado:', window.CONFIG);

            // 2. Inicializar Supabase
            console.log('🔌 Inicializando Supabase...');
            await this.initializeSupabase();

            // 3. Configurar eventos
            console.log('🔗 Configurando event listeners...');
            this.setupEventListeners();

            // 4. Ocultar loading y mostrar login
            console.log('👁️ Mostrando interfaz...');
            this.hideLoading();
            this.showPage('login');

            console.log('✅ Aplicación inicializada correctamente');

        } catch (error) {
            console.error('❌ Error en init:', error);
            this.showCriticalError('Error al inicializar: ' + error.message);
        }
    }

    async initializeSupabase() {
        try {
            if (!window.CONFIG.SUPABASE_URL || !window.CONFIG.SUPABASE_ANON_KEY) {
                throw new Error('Configuración de Supabase incompleta');
            }

            this.supabase = supabase.createClient(
                window.CONFIG.SUPABASE_URL,
                window.CONFIG.SUPABASE_ANON_KEY
            );
            console.log('✅ Supabase inicializado');
            
        } catch (error) {
            console.error('❌ Error en Supabase:', error);
            throw error;
        }
    }

    setupEventListeners() {
        try {
            // Login form
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
                console.log('✅ Login form configurado');
            }

            // Logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }

            // Navegación
            const backButton = document.getElementById('backButton');
            if (backButton) {
                backButton.addEventListener('click', () => this.navigateBack());
            }

            // Opciones del menú
            this.setupMenuEvents();

            console.log('✅ Todos los event listeners configurados');

        } catch (error) {
            console.error('❌ Error configurando eventos:', error);
        }
    }

    setupMenuEvents() {
        const options = {
            'inventoryOption': () => this.showInventoryPage(),
            'withdrawalsOption': () => this.showWithdrawalsPage(),
            'historyOption': () => this.showHistoryPage()
        };

        Object.entries(options).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        console.log('🔐 Procesando login...');
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('Usuario:', username);

        if (!username || !password) {
            this.showError('Por favor ingrese usuario y contraseña');
            return;
        }

        this.showLoading();

        try {
            // SIMULACIÓN TEMPORAL DE LOGIN - ELIMINAR LUEGO
            console.log('⚠️ Usando login simulado');
            
            // Usuarios de prueba
            const testUsers = {
                'Admin_Santiago': { full_name: 'Administrador Santiago', is_admin: true },
                'Operador_Juan': { full_name: 'Juan Pérez', is_admin: false },
                'Operador_Maria': { full_name: 'María González', is_admin: false },
                'Supervisor_Carlos': { full_name: 'Carlos Rodríguez', is_admin: false }
            };

            if (password === 'admin123' && testUsers[username]) {
                this.currentUser = {
                    id: 'temp-' + Date.now(),
                    username: username,
                    ...testUsers[username]
                };
                
                this.showSuccess(`Bienvenido, ${this.currentUser.full_name}`);
                this.showPage('home');
                
            } else {
                throw new Error('Credenciales inválidas. Use: admin123');
            }

        } catch (error) {
            console.error('❌ Error en login:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    handleLogout() {
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            this.currentUser = null;
            this.currentWarehouse = null;
            this.withdrawalItems = [];
            this.showPage('login');
            console.log('✅ Sesión cerrada');
        }
    }

    // NAVEGACIÓN
    showPage(pageName) {
        console.log('📄 Cambiando a página:', pageName);
        
        // Ocultar todas las páginas
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Mostrar página objetivo
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            this.updateHeader(pageName);
        }
    }

    updateHeader(pageName) {
        const backButton = document.getElementById('backButton');
        const pageTitle = document.getElementById('pageTitle');
        const userInfo = document.getElementById('userInfo');
        
        if (backButton) {
            backButton.style.display = pageName === 'home' ? 'none' : 'flex';
        }
        
        if (pageTitle) {
            const titles = {
                'home': 'Sistema de Inventario Multi-Bodega',
                'inventory': 'Inventario',
                'withdrawals': 'Retiros', 
                'history': 'Historial'
            };
            pageTitle.textContent = titles[pageName] || 'Sistema de Inventario';
        }
        
        if (userInfo && this.currentUser) {
            userInfo.textContent = `Bienvenido, ${this.currentUser.full_name}`;
        }
    }

    navigateBack() {
        this.showPage('home');
    }

    // MÉTODOS DE PÁGINAS (SIMPLIFICADOS TEMPORALMENTE)
    showInventoryPage() {
        if (!this.currentWarehouse) {
            this.showError('Primero debe seleccionar una bodega');
            return;
        }
        this.showPage('inventory');
    }

    showWithdrawalsPage() {
        if (!this.currentWarehouse) {
            this.showError('Primero debe seleccionar una bodega');
            return;
        }
        this.showPage('withdrawals');
    }

    showHistoryPage() {
        if (!this.currentWarehouse) {
            this.showError('Primero debe seleccionar una bodega');
            return;
        }
        this.showPage('history');
    }

    // UTILIDADES DE UI
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    showError(message, elementId = 'loginError') {
        console.error('❌ Error:', message);
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => errorElement.style.display = 'none', 5000);
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        console.log('✅ Éxito:', message);
        alert(message);
    }

    showCriticalError(message) {
        console.error('💥 Error crítico:', message);
        this.hideLoading();
        
        // Mostrar error en pantalla completa
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        `;
        errorDiv.innerHTML = `
            <h1 style="color: #ff4444; margin-bottom: 20px;">❌ Error Crítico</h1>
            <p style="margin-bottom: 10px; font-size: 18px;">${message}</p>
            <p style="margin-bottom: 20px; font-size: 14px; color: #ccc;">Verifica la consola para más detalles</p>
            <button onclick="window.location.reload()" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 5px;
            ">🔄 Recargar Página</button>
            <button onclick="showDebugInfo()" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 5px;
            ">🐛 Información de Debug</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// FUNCIONES GLOBALES DE DEBUG
window.showDebugInfo = function() {
    console.log('=== DEBUG INFO ===');
    console.log('CONFIG:', window.CONFIG);
    console.log('Supabase:', typeof supabase);
    console.log('InventoryApp:', typeof InventoryApp);
    console.log('Current User:', window.inventoryApp?.currentUser);
    console.log('Current Page:', window.inventoryApp?.currentPage);
    console.log('=== END DEBUG ===');
    
    alert('Información de debug mostrada en consola (F12)');
};

// INICIALIZACIÓN SEGURA
console.log('📦 Preparando inicialización...');

function initializeApp() {
    console.log('🎯 Inicializando aplicación...');
    
    try {
        // Verificar dependencias críticas
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase no se cargó correctamente');
        }
        
        if (!window.CONFIG) {
            throw new Error('Configuración no cargada desde config.js');
        }
        
        // Inicializar aplicación
        window.inventoryApp = new InventoryApp();
        console.log('🎉 Aplicación inicializada exitosamente!');
        
    } catch (error) {
        console.error('💥 Error crítico en inicialización:', error);
        
        // Fallback de emergencia
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        document.getElementById('loginPage')?.classList.add('active');
        
        // Mostrar error
        setTimeout(() => {
            alert('Error crítico: ' + error.message + '\n\nVerifica la consola (F12) para más detalles.');
        }, 1000);
    }
}

// INICIALIZAR CUANDO EL DOM ESTÉ LISTO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// FALLBACK: Si después de 8 segundos sigue cargando, forzar mostrar login
setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
        console.log('⏰ TIMEOUT: Forzando mostrar interfaz');
        loading.style.display = 'none';
        document.getElementById('loginPage')?.classList.add('active');
        
        if (!window.inventoryApp) {
            console.log('⚠️ Inicialización automática de emergencia');
            window.inventoryApp = new InventoryApp();
        }
    }
}, 8000);

console.log('🏁 app.js cargado completamente');
