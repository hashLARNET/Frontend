// app.js - Sistema de Inventario Multi-Bodega
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
        this.searchTimeout = null;
        this.currentItemForStock = null;
        this.currentItemForWithdrawal = null;
        
        this.init();
    }

    async init() {
        console.log('🎯 Inicializando aplicación...');
        
        try {
            // 1. Verificar configuración primero
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

            // 4. Verificar sesión existente
            console.log('🔐 Verificando sesión...');
            await this.checkExistingSession();

            // 5. Ocultar loading y mostrar interfaz
            console.log('👁️ Mostrando interfaz...');
            this.hideLoading();

            console.log('✅ Aplicación inicializada correctamente');

        } catch (error) {
            console.error('❌ Error en init:', error);
            this.showError('Error al inicializar: ' + error.message);
            this.hideLoading();
        }
    }

    async initializeSupabase() {
        try {
            console.log('🔧 Inicializando cliente Supabase...');
            
            if (!window.CONFIG?.SUPABASE_URL || !window.CONFIG?.SUPABASE_ANON_KEY) {
                throw new Error('Configuración de Supabase incompleta en CONFIG');
            }

            console.log('📡 Conectando a:', window.CONFIG.SUPABASE_URL);
            
            this.supabase = supabase.createClient(
                window.CONFIG.SUPABASE_URL,
                window.CONFIG.SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true
                    }
                }
            );

            // Test de conexión
            const { data, error } = await this.supabase.from('warehouses').select('count').limit(1);
            
            if (error) {
                console.error('❌ Error conectando a Supabase:', error);
                throw new Error('No se pudo conectar a la base de datos: ' + error.message);
            }

            console.log('✅ Supabase inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando Supabase:', error);
            throw error;
        }
    }

    setupEventListeners() {
        try {
            // Login
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
                console.log('✅ Login form configurado');
            }

            // Navegación principal
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }

            const backButton = document.getElementById('backButton');
            if (backButton) {
                backButton.addEventListener('click', () => this.navigateBack());
            }

            // Selección de bodega
            const warehouseSelect = document.getElementById('warehouseSelect');
            if (warehouseSelect) {
                warehouseSelect.addEventListener('change', (e) => this.handleWarehouseSelect(e));
            }

            // Opciones del menú
            this.setupMenuEvents();

            // Inventario
            const inventorySearch = document.getElementById('inventorySearch');
            if (inventorySearch) {
                inventorySearch.addEventListener('input', (e) => this.handleInventorySearch(e));
            }

            const addStockBtn = document.getElementById('addStockBtn');
            if (addStockBtn) {
                addStockBtn.addEventListener('click', () => this.showAddStockModal());
            }

            const addItemBtn = document.getElementById('addItemBtn');
            if (addItemBtn) {
                addItemBtn.addEventListener('click', () => this.showAddItemModal());
            }

            // Retiros
            const startCameraBtn = document.getElementById('startCameraBtn');
            if (startCameraBtn) {
                startCameraBtn.addEventListener('click', () => this.startCamera());
            }

            const stopCameraBtn = document.getElementById('stopCameraBtn');
            if (stopCameraBtn) {
                stopCameraBtn.addEventListener('click', () => this.stopCamera());
            }

            const manualBarcodeBtn = document.getElementById('manualBarcodeBtn');
            if (manualBarcodeBtn) {
                manualBarcodeBtn.addEventListener('click', () => this.handleManualBarcode());
            }

            const manualBarcodeInput = document.getElementById('manualBarcodeInput');
            if (manualBarcodeInput) {
                manualBarcodeInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleManualBarcode();
                });
            }

            const clearWithdrawalBtn = document.getElementById('clearWithdrawalBtn');
            if (clearWithdrawalBtn) {
                clearWithdrawalBtn.addEventListener('click', () => this.clearWithdrawal());
            }

            const confirmWithdrawalBtn = document.getElementById('confirmWithdrawalBtn');
            if (confirmWithdrawalBtn) {
                confirmWithdrawalBtn.addEventListener('click', () => this.confirmWithdrawal());
            }

            // Historial
            const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
            if (refreshHistoryBtn) {
                refreshHistoryBtn.addEventListener('click', () => this.loadHistory());
            }

            // Modales
            this.setupModalEvents();

            console.log('✅ Todos los event listeners configurados');

        } catch (error) {
            console.error('❌ Error configurando eventos:', error);
        }
    }

    setupMenuEvents() {
        const menuOptions = {
            'inventoryOption': () => this.showInventoryPage(),
            'withdrawalsOption': () => this.showWithdrawalsPage(),
            'historyOption': () => this.showHistoryPage()
        };

        Object.entries(menuOptions).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    setupModalEvents() {
        // Modal de cantidad
        const cancelQuantity = document.getElementById('cancelQuantity');
        if (cancelQuantity) {
            cancelQuantity.addEventListener('click', () => this.hideModal('quantityModal'));
        }

        const confirmQuantity = document.getElementById('confirmQuantity');
        if (confirmQuantity) {
            confirmQuantity.addEventListener('click', () => this.confirmQuantity());
        }

        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            quantityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.confirmQuantity();
            });
        }

        // Cerrar modales
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // 🔐 MÉTODOS DE AUTENTICACIÓN
    async checkExistingSession() {
        try {
            console.log('🔍 Verificando sesión existente...');
            
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Error obteniendo sesión:', error);
                this.showPage('login');
                return;
            }
            
            if (session) {
                console.log('✅ Sesión activa encontrada:', session.user.email);
                await this.handleSuccessfulLogin(session.user);
            } else {
                console.log('ℹ️ No hay sesión activa');
                this.showPage('login');
            }
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            this.showPage('login');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        console.log('🔐 Procesando login...');
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('👤 Usuario:', username);

        if (!username || !password) {
            this.showError('Por favor ingrese usuario y contraseña');
            return;
        }

        this.showLoading();

        try {
            // PRIMERO intentar con usuarios hardcodeados para testing
            console.log('🔄 Intentando login con usuarios de prueba...');
            
            const testUsers = {
                'Admin_Santiago': { 
                    id: '1', 
                    full_name: 'Administrador Santiago', 
                    email: 'admin@inventario.com',
                    is_admin: true 
                },
                'Operador_Juan': { 
                    id: '2', 
                    full_name: 'Juan Pérez', 
                    email: 'juan@inventario.com',
                    is_admin: false 
                },
                'Operador_Maria': { 
                    id: '3', 
                    full_name: 'María González', 
                    email: 'maria@inventario.com',
                    is_admin: false 
                },
                'Supervisor_Carlos': { 
                    id: '4', 
                    full_name: 'Carlos Rodríguez', 
                    email: 'carlos@inventario.com',
                    is_admin: false 
                }
            };

            if (password === 'admin123' && testUsers[username]) {
                console.log('✅ Login exitoso (usuario de prueba):', username);
                this.currentUser = testUsers[username];
                this.showSuccess(`Bienvenido, ${this.currentUser.full_name}`);
                this.showPage('home');
                await this.loadWarehouses();
                return;
            }

            // SI FALLA, intentar con Supabase Auth
            console.log('🔄 Intentando login con Supabase Auth...');
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: `${username}@inventario.com`,
                password: password
            });

            if (error) {
                console.error('❌ Error Supabase Auth:', error);
                throw new Error('Credenciales inválidas. Use: admin123');
            }

            await this.handleSuccessfulLogin(data.user);

        } catch (error) {
            console.error('❌ Error en login:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleSuccessfulLogin(user) {
        try {
            console.log('✅ Login exitoso, usuario:', user.email);
            
            // Obtener información adicional del usuario
            const userData = await this.getUserData(user.id);
            this.currentUser = { ...user, ...userData };
            
            console.log('👤 Usuario cargado:', this.currentUser);
            
            // Mostrar página principal
            this.showPage('home');
            
            // Cargar bodegas disponibles
            await this.loadWarehouses();
            
        } catch (error) {
            console.error('❌ Error en login exitoso:', error);
            this.showError('Error al cargar datos del usuario');
        }
    }

    async getUserData(userId) {
        try {
            console.log('📊 Obteniendo datos del usuario:', userId);
            
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error obteniendo usuario:', error);
                // Devolver datos por defecto
                return { 
                    full_name: 'Usuario',
                    is_admin: false 
                };
            }

            console.log('✅ Datos de usuario obtenidos:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error en getUserData:', error);
            return { full_name: 'Usuario', is_admin: false };
        }
    }

    async handleLogout() {
        if (!confirm('¿Está seguro que desea cerrar sesión?')) {
            return;
        }

        try {
            console.log('🚪 Cerrando sesión...');
            
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            // Limpiar estado local
            this.currentUser = null;
            this.currentWarehouse = null;
            this.withdrawalItems = [];
            this.currentItemForStock = null;
            this.currentItemForWithdrawal = null;
            
            // Mostrar página de login
            this.showPage('login');
            
            // Limpiar formularios
            document.getElementById('loginForm').reset();
            
            console.log('✅ Sesión cerrada correctamente');
            
        } catch (error) {
            console.error('❌ Error cerrando sesión:', error);
            this.showError('Error al cerrar sesión');
        }
    }

    // 🏭 MÉTODOS DE BODEGAS
    async loadWarehouses() {
        try {
            console.log('📦 Cargando bodegas...');
            
            const warehouses = await this.fetchWarehouses();
            const select = document.getElementById('warehouseSelect');
            
            if (!select) {
                console.log('ℹ️ Select de bodegas no encontrado');
                return;
            }
            
            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccione una bodega...</option>';
            
            // Agregar opciones
            warehouses.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse.id;
                option.textContent = `${warehouse.name} - ${warehouse.code}`;
                option.dataset.warehouse = JSON.stringify(warehouse);
                select.appendChild(option);
            });
            
            console.log(`✅ ${warehouses.length} bodegas cargadas`);
            
        } catch (error) {
            console.error('❌ Error cargando bodegas:', error);
            this.showError('Error al cargar las bodegas');
        }
    }

    async fetchWarehouses() {
        try {
            console.log('🔄 Obteniendo bodegas de Supabase...');
            
            const { data, error } = await this.supabase
                .from('warehouses')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) {
                console.error('❌ Error Supabase:', error);
                throw error;
            }

            console.log(`✅ ${data.length} bodegas obtenidas`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error fetchWarehouses:', error);
            
            // Datos de prueba si falla la conexión
            return [
                { id: '1', name: 'Bodega Central', code: 'BOD-CENT', location: 'Edificio Principal', is_active: true },
                { id: '2', name: 'Bodega Norte', code: 'BOD-NORT', location: 'Zona Industrial', is_active: true }
            ];
        }
    }

    handleWarehouseSelect(event) {
        const selectedOption = event.target.options[event.target.selectedIndex];
        
        if (selectedOption.value) {
            this.currentWarehouse = JSON.parse(selectedOption.dataset.warehouse);
            
            // Mostrar opciones disponibles
            const optionsSection = document.getElementById('optionsSection');
            if (optionsSection) {
                optionsSection.style.display = 'block';
            }
            
            this.showSuccess(
                `Bodega seleccionada: ${this.currentWarehouse.name}\n` +
                `Ubicación: ${this.currentWarehouse.location || 'No especificada'}`
            );
            
            console.log('✅ Bodega seleccionada:', this.currentWarehouse.name);
        } else {
            this.currentWarehouse = null;
            const optionsSection = document.getElementById('optionsSection');
            if (optionsSection) {
                optionsSection.style.display = 'none';
            }
        }
    }

    // 📦 MÉTODOS DE INVENTARIO
    async loadPageData(pageName) {
        console.log('📄 Cargando datos para página:', pageName);
        
        switch (pageName) {
            case 'inventory':
                await this.loadInventory();
                break;
            case 'withdrawals':
                this.updateWithdrawalList();
                break;
            case 'history':
                await this.loadHistory();
                break;
        }
    }

    async loadInventory(searchQuery = '') {
        try {
            console.log('📋 Cargando inventario...', searchQuery ? `Búsqueda: "${searchQuery}"` : '');
            
            const items = await this.fetchInventoryItems(searchQuery);
            this.renderInventoryTable(items);
            
        } catch (error) {
            console.error('❌ Error cargando inventario:', error);
            this.showError('Error al cargar el inventario');
        }
    }

    async fetchInventoryItems(searchQuery = '') {
        if (!this.currentWarehouse) {
            throw new Error('No hay bodega seleccionada');
        }

        try {
            console.log('🔄 Obteniendo items de bodega:', this.currentWarehouse.name);
            
            let query = this.supabase
                .from('items')
                .select('*')
                .eq('warehouse_id', this.currentWarehouse.id);

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%,n_factura.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query.order('name');

            if (error) {
                console.error('❌ Error Supabase:', error);
                throw error;
            }

            console.log(`✅ ${data.length} items obtenidos`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error fetchInventoryItems:', error);
            
            // Datos de prueba si falla la conexión
            return [
                { id: '1', name: 'Tornillos 3mm', barcode: '123456', stock: 50, obra: 'Obra Principal', n_factura: 'FAC-001', warehouse_id: this.currentWarehouse?.id },
                { id: '2', name: 'Martillos', barcode: '789012', stock: 10, obra: 'Obra Norte', n_factura: 'FAC-002', warehouse_id: this.currentWarehouse?.id }
            ];
        }
    }

    renderInventoryTable(items) {
        const tbody = document.getElementById('inventoryTableBody');
        const infoElement = document.getElementById('inventoryInfo');
        
        if (!tbody) {
            console.error('❌ Tabla de inventario no encontrada');
            return;
        }
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (items.length === 0) {
            if (infoElement) {
                infoElement.textContent = 'No se encontraron items en el inventario';
            }
            return;
        }
        
        // Renderizar items
        items.forEach(item => {
            const row = document.createElement('tr');
            
            // Determinar clase CSS según stock
            let stockClass = '';
            if (item.stock === 0) {
                stockClass = 'no-stock';
            } else if (item.stock < 10) {
                stockClass = 'low-stock';
            }
            
            row.innerHTML = `
                <td>${this.escapeHtml(item.name)}</td>
                <td>${this.escapeHtml(item.barcode)}</td>
                <td class="${stockClass}">${item.stock}</td>
                <td>${this.escapeHtml(item.obra || '')}</td>
                <td>${this.escapeHtml(item.n_factura || '')}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        if (infoElement) {
            infoElement.textContent = `Total de items en ${this.currentWarehouse.name}: ${items.length}`;
        }
        
        console.log(`✅ ${items.length} items renderizados en la tabla`);
    }

    handleInventorySearch(event) {
        const query = event.target.value.trim();
        
        if (query.length >= 2 || query.length === 0) {
            // Debounce para evitar muchas requests
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.loadInventory(query);
            }, 300);
        }
    }

    // 📤 MÉTODOS DE RETIROS
    updateWithdrawalList() {
        const tbody = document.getElementById('withdrawalTableBody');
        const confirmBtn = document.getElementById('confirmWithdrawalBtn');
        
        if (!tbody) {
            console.error('❌ Tabla de retiros no encontrada');
            return;
        }
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (this.withdrawalItems.length === 0) {
            if (confirmBtn) {
                confirmBtn.disabled = true;
            }
            return;
        }
        
        // Agregar items a la tabla
        this.withdrawalItems.forEach((withdrawalItem, index) => {
            const item = withdrawalItem.item;
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${this.escapeHtml(item.name)}</td>
                <td>${this.escapeHtml(item.barcode)}</td>
                <td>${this.escapeHtml(item.obra || '')}</td>
                <td>${this.escapeHtml(item.n_factura || '')}</td>
                <td>${item.stock}</td>
                <td>${withdrawalItem.quantity}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="inventoryApp.removeWithdrawalItem(${index})">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
        
        console.log(`✅ ${this.withdrawalItems.length} items en lista de retiros`);
    }

    removeWithdrawalItem(index) {
        this.withdrawalItems.splice(index, 1);
        this.updateWithdrawalList();
        this.showSuccess('Item eliminado del retiro');
    }

    clearWithdrawal() {
        if (this.withdrawalItems.length === 0) return;
        
        if (confirm('¿Está seguro que desea limpiar todos los items del retiro?')) {
            this.withdrawalItems = [];
            this.updateWithdrawalList();
            const obraInput = document.getElementById('obraInput');
            if (obraInput) obraInput.value = '';
            this.showSuccess('Retiro limpiado');
        }
    }

    // 📊 MÉTODOS DE HISTORIAL
    async loadHistory() {
        try {
            console.log('📊 Cargando historial...');
            
            const history = await this.fetchHistory();
            this.renderHistoryTable(history);
            
        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            this.showError('Error al cargar el historial');
        }
    }

    async fetchHistory() {
        if (!this.currentWarehouse) {
            throw new Error('No hay bodega seleccionada');
        }

        try {
            console.log('🔄 Obteniendo historial de bodega:', this.currentWarehouse.name);
            
            const { data, error } = await this.supabase
                .from('history')
                .select('*')
                .eq('warehouse_id', this.currentWarehouse.id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('❌ Error Supabase:', error);
                throw error;
            }

            console.log(`✅ ${data.length} registros de historial obtenidos`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error fetchHistory:', error);
            
            // Datos de prueba si falla la conexión
            return [
                { id: '1', type: 'withdrawal', item_name: 'Tornillos 3mm', quantity: 5, obra: 'Obra Principal', user_name: 'Admin_Santiago', created_at: new Date().toISOString() },
                { id: '2', type: 'addition', item_name: 'Martillos', quantity: 10, obra: 'Obra Norte', user_name: 'Operador_Juan', created_at: new Date().toISOString() }
            ];
        }
    }

    renderHistoryTable(history) {
        const tbody = document.getElementById('historyTableBody');
        const infoElement = document.getElementById('historyInfo');
        
        if (!tbody) {
            console.error('❌ Tabla de historial no encontrada');
            return;
        }
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (history.length === 0) {
            if (infoElement) {
                infoElement.textContent = 'No hay registros en el historial';
            }
            return;
        }
        
        // Renderizar historial
        history.forEach(record => {
            const row = document.createElement('tr');
            
            // Determinar clase CSS según tipo
            const typeClass = record.type === 'withdrawal' ? 'withdrawal-record' : 
                            record.type === 'addition' ? 'addition-record' : '';
            
            // Formatear fecha
            const date = new Date(record.created_at || record.date);
            const formattedDate = date.toLocaleString('es-CL');
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td class="${typeClass}">${this.getTypeDisplayName(record.type)}</td>
                <td>${this.escapeHtml(record.item_name || '')}</td>
                <td>${record.quantity}</td>
                <td>${this.escapeHtml(record.obra || '')}</td>
                <td>${this.escapeHtml(record.user_name || 'Usuario')}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        if (infoElement) {
            infoElement.textContent = `Total de registros: ${history.length}`;
        }
        
        console.log(`✅ ${history.length} registros de historial renderizados`);
    }

    // 🎮 MÉTODOS DE NAVEGACIÓN Y UI
    showPage(pageName) {
        console.log('📄 Cambiando a página:', pageName);
        
        // Limpiar página anterior
        this.cleanupPage(this.currentPage);
        
        // Ocultar todas las páginas
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Mostrar página solicitada
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            this.updateHeader(pageName);
            this.loadPageData(pageName);
        } else {
            console.error('❌ Página no encontrada:', pageName);
        }
    }

    updateHeader(pageName) {
        const backButton = document.getElementById('backButton');
        const pageTitle = document.getElementById('pageTitle');
        const userInfo = document.getElementById('userInfo');
        
        // Configurar botón de volver
        if (backButton) {
            backButton.style.display = (pageName === 'home' || pageName === 'login') ? 'none' : 'flex';
        }
        
        // Configurar título
        if (pageTitle) {
            const titles = {
                'home': 'Sistema de Inventario Multi-Bodega',
                'inventory': 'Inventario',
                'withdrawals': 'Retiros', 
                'history': 'Historial',
                'login': 'Iniciar Sesión'
            };
            const warehouseName = this.currentWarehouse && pageName !== 'home' && pageName !== 'login' ? ` - ${this.currentWarehouse.name}` : '';
            pageTitle.textContent = (titles[pageName] || pageName) + warehouseName;
        }
        
        // Actualizar información del usuario
        if (userInfo && this.currentUser) {
            userInfo.textContent = `Bienvenido, ${this.currentUser.full_name || this.currentUser.email}`;
        }
    }

    navigateBack() {
        this.showPage('home');
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
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

    // 🛠️ MÉTODOS AUXILIARES
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTypeDisplayName(type) {
        const types = {
            'addition': 'Agregado',
            'withdrawal': 'Retirado',
            'adjustment': 'Ajustado'
        };
        return types[type] || type;
    }

    cleanupPage(pageName) {
        switch (pageName) {
            case 'withdrawals':
                this.stopCamera();
                break;
            case 'inventory':
                clearTimeout(this.searchTimeout);
                break;
        }
    }

    // Métodos para mostrar páginas específicas
    showInventoryPage() {
        if (!this.currentWarehouse) {
            this.showError('Debe seleccionar una bodega primero');
            return;
        }
        this.showPage('inventory');
    }

    showWithdrawalsPage() {
        if (!this.currentWarehouse) {
            this.showError('Debe seleccionar una bodega primero');
            return;
        }
        this.showPage('withdrawals');
    }

    showHistoryPage() {
        if (!this.currentWarehouse) {
            this.showError('Debe seleccionar una bodega primero');
            return;
        }
        this.showPage('history');
    }

    // 🎥 MÉTODOS DE CÁMARA (SIMPLIFICADOS)
    async startCamera() {
        this.showError('Funcionalidad de cámara en desarrollo');
    }

    stopCamera() {
        this.isCameraActive = false;
    }

    handleManualBarcode() {
        const barcodeInput = document.getElementById('manualBarcodeInput');
        if (barcodeInput && barcodeInput.value.trim()) {
            this.showError('Búsqueda por código de barras en desarrollo');
            barcodeInput.value = '';
        }
    }
}

// 🚀 INICIALIZACIÓN
console.log('📦 Preparando inicialización de la aplicación...');

function initializeApp() {
    console.log('🎯 Iniciando aplicación...');
    
    try {
        // Verificar dependencias críticas
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase no se cargó correctamente. Verifica la conexión a internet.');
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
        
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.classList.add('active');
        
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
        const loginPage = document.getElementById('loginPage');
        if (loginPage) loginPage.classList.add('active');
        
        if (!window.inventoryApp) {
            console.log('⚠️ Inicialización automática de emergencia');
            window.inventoryApp = new InventoryApp();
        }
    }
}, 8000);

console.log('🏁 app.js cargado completamente');
