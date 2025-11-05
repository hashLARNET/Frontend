// Aplicación principal del Sistema de Inventario
class InventoryApp {
    constructor() {
        this.currentUser = null;
        this.currentWarehouse = null;
        this.currentPage = 'login';
        this.withdrawalItems = [];
        this.supabase = null;
        this.isCameraActive = false;
        
        this.init();
    }

    async init() {
        try {
            // Inicializar Supabase
            await this.initializeSupabase();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Verificar si hay sesión activa
            await this.checkExistingSession();
            
            // Ocultar loading screen
            this.hideLoading();
            
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.showError('Error al inicializar la aplicación');
            this.hideLoading();
        }
    }

    async initializeSupabase() {
        try {
            this.supabase = supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_ANON_KEY
            );
            console.log('Supabase inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando Supabase:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Navegación principal
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('backButton').addEventListener('click', () => this.navigateBack());
        
        // Selección de bodega
        document.getElementById('warehouseSelect').addEventListener('change', (e) => this.handleWarehouseSelect(e));
        
        // Opciones del menú
        document.getElementById('inventoryOption').addEventListener('click', () => this.showInventoryPage());
        document.getElementById('withdrawalsOption').addEventListener('click', () => this.showWithdrawalsPage());
        document.getElementById('historyOption').addEventListener('click', () => this.showHistoryPage());
        
        // Inventario
        document.getElementById('inventorySearch').addEventListener('input', (e) => this.handleInventorySearch(e));
        document.getElementById('addStockBtn').addEventListener('click', () => this.showAddStockModal());
        document.getElementById('addItemBtn').addEventListener('click', () => this.showAddItemModal());
        
        // Retiros
        document.getElementById('startCameraBtn').addEventListener('click', () => this.startCamera());
        document.getElementById('stopCameraBtn').addEventListener('click', () => this.stopCamera());
        document.getElementById('manualBarcodeBtn').addEventListener('click', () => this.handleManualBarcode());
        document.getElementById('manualBarcodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleManualBarcode();
        });
        document.getElementById('clearWithdrawalBtn').addEventListener('click', () => this.clearWithdrawal());
        document.getElementById('confirmWithdrawalBtn').addEventListener('click', () => this.confirmWithdrawal());
        
        // Historial
        document.getElementById('refreshHistoryBtn').addEventListener('click', () => this.loadHistory());
        
        // Modales
        this.setupModalEvents();
    }

    setupModalEvents() {
        // Modal de cantidad
        document.getElementById('cancelQuantity').addEventListener('click', () => this.hideModal('quantityModal'));
        document.getElementById('confirmQuantity').addEventListener('click', () => this.confirmQuantity());
        document.getElementById('quantityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmQuantity();
        });

        // Cerrar modales con el botón X
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // Cerrar modales haciendo click fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // Navegación entre páginas
    showPage(pageName) {
        // Ocultar todas las páginas
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Mostrar página solicitada
        document.getElementById(pageName + 'Page').classList.add('active');
        
        // Actualizar estado
        this.currentPage = pageName;
        
        // Configurar header según la página
        this.updateHeader(pageName);
        
        // Cargar datos específicos de la página
        this.loadPageData(pageName);
    }

    updateHeader(pageName) {
        const backButton = document.getElementById('backButton');
        const pageTitle = document.getElementById('pageTitle');
        const userInfo = document.getElementById('userInfo');
        
        // Configurar botón de volver
        if (pageName === 'home') {
            backButton.style.display = 'none';
            pageTitle.textContent = CONFIG.APP_TITLE;
        } else {
            backButton.style.display = 'flex';
            pageTitle.textContent = this.getPageTitle(pageName);
        }
        
        // Actualizar información del usuario
        if (this.currentUser) {
            userInfo.textContent = `Bienvenido, ${this.currentUser.full_name}`;
        }
    }

    getPageTitle(pageName) {
        const titles = {
            'inventory': 'Inventario',
            'withdrawals': 'Retiros',
            'history': 'Historial'
        };
        const warehouseName = this.currentWarehouse ? ` - ${this.currentWarehouse.name}` : '';
        return titles[pageName] + warehouseName;
    }

    navigateBack() {
        this.showPage('home');
    }

    // Utilidades de UI
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showError(message, elementId = 'loginError') {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        // Podríamos implementar un sistema de notificaciones toast
        alert(message); // Temporal - mejorar con notificaciones bonitas
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryApp = new InventoryApp();
});
// Métodos de autenticación y sesión
class InventoryApp {
    // ... métodos anteriores ...

    async checkExistingSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                // Hay sesión activa, obtener información del usuario
                await this.handleSuccessfulLogin(session.user);
            } else {
                // No hay sesión, mostrar login
                this.showPage('login');
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            this.showPage('login');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showError('Por favor ingrese usuario y contraseña');
            return;
        }

        this.showLoading();
        
        try {
            // Intentar login via Supabase
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: `${username}@inventario.com`, // Asumimos formato email
                password: password
            });

            if (error) {
                // Si falla Supabase, intentar con el backend tradicional
                await this.tryBackendLogin(username, password);
            } else {
                await this.handleSuccessfulLogin(data.user);
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            this.showError('Error al iniciar sesión');
        } finally {
            this.hideLoading();
        }
    }

    async tryBackendLogin(username, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }

            const data = await response.json();
            this.currentUser = data.user;
            
            // Mostrar página principal
            this.showPage('home');
            
        } catch (error) {
            console.error('Error en login con backend:', error);
            this.showError('Usuario o contraseña incorrectos');
        }
    }

    async handleSuccessfulLogin(user) {
        try {
            // Obtener información adicional del usuario desde la base de datos
            const userData = await this.getUserData(user.id);
            this.currentUser = { ...user, ...userData };
            
            // Mostrar página principal
            this.showPage('home');
            
            // Cargar bodegas disponibles
            await this.loadWarehouses();
            
        } catch (error) {
            console.error('Error obteniendo datos del usuario:', error);
            this.showError('Error al cargar datos del usuario');
        }
    }

    async getUserData(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('Error obteniendo datos del usuario:', error);
            
            // Fallback: intentar con el backend
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/users/${userId}`);
            if (response.ok) {
                return await response.json();
            }
            throw error;
        }
    }

    async handleLogout() {
        if (!confirm('¿Está seguro que desea cerrar sesión?')) {
            return;
        }

        try {
            // Cerrar sesión en Supabase
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            // Limpiar estado local
            this.currentUser = null;
            this.currentWarehouse = null;
            this.withdrawalItems = [];
            
            // Mostrar página de login
            this.showPage('login');
            
            // Limpiar formularios
            document.getElementById('loginForm').reset();
            
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            this.showError('Error al cerrar sesión');
        }
    }

    async loadWarehouses() {
        try {
            const warehouses = await this.fetchWarehouses();
            const select = document.getElementById('warehouseSelect');
            
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
            
        } catch (error) {
            console.error('Error cargando bodegas:', error);
            this.showError('Error al cargar las bodegas');
        }
    }

    async fetchWarehouses() {
        try {
            // Intentar con Supabase primero
            const { data, error } = await this.supabase
                .from('warehouses')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (!error) return data;
            
            // Fallback: usar backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/warehouses`);
            if (response.ok) {
                return await response.json();
            }
            throw error;
            
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            throw error;
        }
    }

    handleWarehouseSelect(event) {
        const selectedOption = event.target.options[event.target.selectedIndex];
        
        if (selectedOption.value) {
            this.currentWarehouse = JSON.parse(selectedOption.dataset.warehouse);
            
            // Mostrar opciones disponibles
            document.getElementById('optionsSection').style.display = 'block';
            
            this.showSuccess(
                `Bodega seleccionada: ${this.currentWarehouse.name}\n` +
                `Ubicación: ${this.currentWarehouse.location || 'No especificada'}`
            );
        } else {
            this.currentWarehouse = null;
            document.getElementById('optionsSection').style.display = 'none';
        }
    }
}
// Métodos de gestión de inventario
class InventoryApp {
    // ... métodos anteriores ...

    async loadPageData(pageName) {
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
            const items = await this.fetchInventoryItems(searchQuery);
            this.renderInventoryTable(items);
            
        } catch (error) {
            console.error('Error cargando inventario:', error);
            this.showError('Error al cargar el inventario');
        }
    }

    async fetchInventoryItems(searchQuery = '') {
        if (!this.currentWarehouse) {
            throw new Error('No hay bodega seleccionada');
        }

        try {
            let query = this.supabase
                .from('items')
                .select('*')
                .eq('warehouse_id', this.currentWarehouse.id);

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%,n_factura.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query.order('name');

            if (!error) return data;

            // Fallback: usar backend API
            const url = searchQuery 
                ? `${CONFIG.API_BASE_URL}/api/v1/inventory/search?q=${encodeURIComponent(searchQuery)}&warehouse_id=${this.currentWarehouse.id}`
                : `${CONFIG.API_BASE_URL}/api/v1/inventory/warehouse/${this.currentWarehouse.id}`;

            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
            throw error;

        } catch (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }
    }

    renderInventoryTable(items) {
        const tbody = document.getElementById('inventoryTableBody');
        const infoElement = document.getElementById('inventoryInfo');
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (items.length === 0) {
            infoElement.textContent = 'No se encontraron items en el inventario';
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
                <td>${this.escapeHtml(item.obra)}</td>
                <td>${this.escapeHtml(item.n_factura)}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        infoElement.textContent = `Total de items en ${this.currentWarehouse.name}: ${items.length}`;
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

    async showAddStockModal() {
        const modalContent = `
            <div class="search-section">
                <h4>Buscar Item para Agregar Stock</h4>
                <div class="scanner-section">
                    <div class="scanner-options">
                        <button id="modalStartCameraBtn" class="btn btn-primary">📷 Activar Cámara</button>
                        <div class="manual-input">
                            <input type="text" id="modalBarcodeInput" placeholder="Escanear o ingresar código" 
                                   class="form-control">
                            <button id="modalBarcodeBtn" class="btn btn-success">Buscar</button>
                        </div>
                    </div>
                    <div id="modalCameraContainer" class="camera-container" style="display: none;">
                        <div id="modalScanner"></div>
                    </div>
                </div>
                
                <div class="search-results">
                    <h5>O buscar por nombre:</h5>
                    <input type="text" id="itemSearchInput" placeholder="Buscar por nombre..." 
                           class="form-control" style="margin-bottom: 15px;">
                    
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Código</th>
                                    <th>Stock Actual</th>
                                    <th>Obra</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody id="itemSearchResults">
                                <!-- Resultados de búsqueda -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('addStockModal').querySelector('.modal-body').innerHTML = modalContent;
        this.setupAddStockModalEvents();
        this.showModal('addStockModal');
    }

    setupAddStockModalEvents() {
        // Búsqueda por código de barras
        document.getElementById('modalBarcodeBtn').addEventListener('click', () => {
            this.searchItemForStock(document.getElementById('modalBarcodeInput').value);
        });

        document.getElementById('modalBarcodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchItemForStock(e.target.value);
            }
        });

        // Búsqueda por nombre
        document.getElementById('itemSearchInput').addEventListener('input', (e) => {
            this.searchItemsByName(e.target.value);
        });

        // Cámara para modal
        document.getElementById('modalStartCameraBtn').addEventListener('click', () => {
            this.startModalCamera();
        });
    }

    async searchItemForStock(barcode) {
        if (!barcode.trim()) {
            this.showError('Ingrese un código de barras', 'addStockModal');
            return;
        }

        try {
            const item = await this.fetchItemByBarcode(barcode);
            
            // Verificar que pertenece a la bodega actual
            if (item.warehouse_id !== this.currentWarehouse.id) {
                this.showError('El item no pertenece a esta bodega', 'addStockModal');
                return;
            }
            
            this.showQuantityDialogForStock(item);
            
        } catch (error) {
            console.error('Error buscando item:', error);
            this.showError(`No se encontró item con código: ${barcode}`, 'addStockModal');
        }
    }

    async searchItemsByName(query) {
        if (query.length < 2) {
            document.getElementById('itemSearchResults').innerHTML = '';
            return;
        }

        try {
            const items = await this.fetchInventoryItems(query);
            this.renderItemSearchResults(items);
            
        } catch (error) {
            console.error('Error buscando items:', error);
            this.showError('Error al buscar items', 'addStockModal');
        }
    }

    renderItemSearchResults(items) {
        const tbody = document.getElementById('itemSearchResults');
        tbody.innerHTML = '';

        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(item.name)}</td>
                <td>${this.escapeHtml(item.barcode)}</td>
                <td>${item.stock}</td>
                <td>${this.escapeHtml(item.obra)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" 
                            onclick="inventoryApp.selectItemForStock('${item.id}')">
                        Seleccionar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async selectItemForStock(itemId) {
        try {
            const items = await this.fetchInventoryItems();
            const item = items.find(i => i.id === itemId);
            
            if (item) {
                this.showQuantityDialogForStock(item);
            } else {
                this.showError('Item no encontrado', 'addStockModal');
            }
            
        } catch (error) {
            console.error('Error seleccionando item:', error);
            this.showError('Error al seleccionar el item', 'addStockModal');
        }
    }

    showQuantityDialogForStock(item) {
        this.hideModal('addStockModal');
        
        document.getElementById('itemInfo').innerHTML = `
            <div class="item-info">
                <h4>${this.escapeHtml(item.name)}</h4>
                <p><strong>Stock actual:</strong> ${item.stock}</p>
                <p><strong>Código:</strong> ${this.escapeHtml(item.barcode)}</p>
                <p><strong>Obra:</strong> ${this.escapeHtml(item.obra)}</p>
                <p><strong>Factura:</strong> ${this.escapeHtml(item.n_factura)}</p>
            </div>
        `;
        
        document.getElementById('quantityInput').value = '1';
        document.getElementById('quantityInput').max = 9999;
        
        // Guardar referencia al item actual
        this.currentItemForStock = item;
        
        this.showModal('quantityModal');
        document.getElementById('quantityInput').focus();
    }

    async confirmQuantity() {
        const quantity = parseInt(document.getElementById('quantityInput').value);
        
        if (!quantity || quantity <= 0) {
            this.showError('La cantidad debe ser mayor a 0');
            return;
        }

        if (!this.currentItemForStock) {
            this.showError('No hay item seleccionado');
            return;
        }

        try {
            await this.addItemStock(this.currentItemForStock.id, quantity);
            
            this.hideModal('quantityModal');
            this.showSuccess(`Se agregaron ${quantity} unidades al stock de '${this.currentItemForStock.name}'`);
            
            // Recargar inventario
            await this.loadInventory();
            
        } catch (error) {
            console.error('Error agregando stock:', error);
            this.showError('Error al agregar stock');
        }
    }

    async addItemStock(itemId, quantity) {
        try {
            // Intentar con Supabase
            const { data: currentItem, error: fetchError } = await this.supabase
                .from('items')
                .select('stock')
                .eq('id', itemId)
                .single();

            if (fetchError) throw fetchError;

            const newStock = currentItem.stock + quantity;

            const { error: updateError } = await this.supabase
                .from('items')
                .update({ stock: newStock })
                .eq('id', itemId);

            if (!updateError) {
                // Registrar en historial
                await this.recordHistory('addition', itemId, quantity);
                return;
            }

            // Fallback: usar backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/inventory/${itemId}/stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quantity: quantity,
                    user_id: this.currentUser.id
                })
            });

            if (!response.ok) {
                throw new Error('Error del servidor');
            }

        } catch (error) {
            console.error('Error agregando stock:', error);
            throw error;
        }
    }

    // Utility function para escapar HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
// Métodos de retiros y escáner
class InventoryApp {
    // ... métodos anteriores ...

    // Sistema de escáner
    async startCamera() {
        try {
            this.isCameraActive = true;
            
            // Configurar y iniciar Quagga
            await this.initializeQuagga();
            
            // Actualizar UI
            document.getElementById('startCameraBtn').style.display = 'none';
            document.getElementById('stopCameraBtn').style.display = 'inline-block';
            document.getElementById('cameraContainer').style.display = 'block';
            document.getElementById('manualBarcodeInput').placeholder = "La cámara está activa - escanee un código";
            
            console.log('Cámara iniciada correctamente');
            
        } catch (error) {
            console.error('Error iniciando cámara:', error);
            this.showError('No se pudo acceder a la cámara. Verifique los permisos.');
            this.stopCamera();
        }
    }

    async initializeQuagga() {
        return new Promise((resolve, reject) => {
            Quagga.init(CONFIG.SCANNER_CONFIG, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                Quagga.start();
                resolve();
                
                // Configurar detección de códigos
                Quagga.onDetected((result) => {
                    if (this.isCameraActive) {
                        const code = result.codeResult.code;
                        console.log('Código detectado:', code);
                        this.handleBarcodeScan(code);
                    }
                });
            });
        });
    }

    stopCamera() {
        this.isCameraActive = false;
        
        try {
            Quagga.stop();
        } catch (error) {
            console.error('Error deteniendo cámara:', error);
        }
        
        // Actualizar UI
        document.getElementById('startCameraBtn').style.display = 'inline-block';
        document.getElementById('stopCameraBtn').style.display = 'none';
        document.getElementById('cameraContainer').style.display = 'none';
        document.getElementById('manualBarcodeInput').placeholder = "Ingresar código manualmente o escanear";
        
        console.log('Cámara detenida');
    }

    startModalCamera() {
        // Similar a startCamera pero para el modal
        console.log('Iniciando cámara modal - implementación similar');
        // La implementación sería similar a startCamera pero con diferentes elementos DOM
    }

    // Manejo de código de barras
    async handleBarcodeScan(barcode) {
        if (!barcode || !this.isCameraActive) return;
        
        try {
            // Buscar item por código de barras
            const item = await this.fetchItemByBarcode(barcode);
            
            // Verificar que pertenece a la bodega actual
            if (item.warehouse_id !== this.currentWarehouse.id) {
                this.showError(
                    `El item '${item.name}' no pertenece a esta bodega.\n` +
                    `Solo se pueden retirar items de la bodega actual.`
                );
                return;
            }
            
            // Verificar stock
            if (item.stock <= 0) {
                this.showError(`El item '${item.name}' no tiene stock disponible`);
                return;
            }
            
            // Mostrar diálogo de cantidad
            this.showWithdrawalQuantityDialog(item);
            
        } catch (error) {
            console.error('Error escaneando código:', error);
            this.showError(`No se encontró item con código: ${barcode}`);
        }
    }

    async fetchItemByBarcode(barcode) {
        try {
            // Intentar con Supabase primero
            const { data, error } = await this.supabase
                .from('items')
                .select('*')
                .eq('barcode', barcode)
                .single();

            if (!error) return data;

            // Fallback: usar backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/inventory/barcode/${barcode}`);
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Item no encontrado');

        } catch (error) {
            console.error('Error fetching item by barcode:', error);
            throw error;
        }
    }

    handleManualBarcode() {
        const barcode = document.getElementById('manualBarcodeInput').value.trim();
        if (barcode) {
            this.handleBarcodeScan(barcode);
            document.getElementById('manualBarcodeInput').value = '';
        }
    }

    showWithdrawalQuantityDialog(item) {
        document.getElementById('itemInfo').innerHTML = `
            <div class="item-info">
                <h4>${this.escapeHtml(item.name)}</h4>
                <p><strong>Stock disponible:</strong> ${item.stock}</p>
                <p><strong>Código:</strong> ${this.escapeHtml(item.barcode)}</p>
                <p><strong>Obra del item:</strong> ${this.escapeHtml(item.obra)}</p>
                <p><strong>Factura:</strong> ${this.escapeHtml(item.n_factura)}</p>
            </div>
        `;
        
        document.getElementById('quantityInput').value = '1';
        document.getElementById('quantityInput').max = item.stock;
        
        // Guardar referencia al item actual
        this.currentItemForWithdrawal = item;
        
        this.showModal('quantityModal');
        document.getElementById('quantityInput').focus();
    }

    async confirmQuantity() {
        const quantity = parseInt(document.getElementById('quantityInput').value);
        
        if (!quantity || quantity <= 0) {
            this.showError('La cantidad debe ser mayor a 0');
            return;
        }

        if (!this.currentItemForWithdrawal) {
            this.showError('No hay item seleccionado');
            return;
        }

        if (quantity > this.currentItemForWithdrawal.stock) {
            this.showError(`Cantidad máxima disponible: ${this.currentItemForWithdrawal.stock}`);
            return;
        }

        // Verificar si el item ya está en la lista
        const existingIndex = this.withdrawalItems.findIndex(
            wi => wi.item.id === this.currentItemForWithdrawal.id
        );

        if (existingIndex >= 0) {
            // Actualizar cantidad existente
            const newQuantity = this.withdrawalItems[existingIndex].quantity + quantity;
            if (newQuantity > this.currentItemForWithdrawal.stock) {
                this.showError("La cantidad total excede el stock disponible");
                return;
            }
            this.withdrawalItems[existingIndex].quantity = newQuantity;
        } else {
            // Agregar nuevo item
            this.withdrawalItems.push({
                item: this.currentItemForWithdrawal,
                quantity: quantity
            });
        }

        this.hideModal('quantityModal');
        this.updateWithdrawalList();
        this.showSuccess('Item agregado al retiro');
    }

    updateWithdrawalList() {
        const tbody = document.getElementById('withdrawalTableBody');
        const confirmBtn = document.getElementById('confirmWithdrawalBtn');
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (this.withdrawalItems.length === 0) {
            confirmBtn.disabled = true;
            return;
        }
        
        // Agregar items a la tabla
        this.withdrawalItems.forEach((withdrawalItem, index) => {
            const item = withdrawalItem.item;
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${this.escapeHtml(item.name)}</td>
                <td>${this.escapeHtml(item.barcode)}</td>
                <td>${this.escapeHtml(item.obra)}</td>
                <td>${this.escapeHtml(item.n_factura)}</td>
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
        
        confirmBtn.disabled = false;
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
            document.getElementById('obraInput').value = '';
            this.showSuccess('Retiro limpiado');
        }
    }

    async confirmWithdrawal() {
        const obra = document.getElementById('obraInput').value.trim();
        
        // Validaciones
        if (!obra) {
            this.showError('Debe especificar la obra');
            return;
        }
        
        if (this.withdrawalItems.length === 0) {
            this.showError('Debe agregar al menos un item');
            return;
        }
        
        // Confirmación final
        const totalItems = this.withdrawalItems.reduce((sum, wi) => sum + wi.quantity, 0);
        if (!confirm(`¿Confirmar retiro de ${totalItems} items para la obra '${obra}'?`)) {
            return;
        }

        this.showLoading();
        
        try {
            await this.processWithdrawal(obra);
            
            // Limpiar formulario
            this.withdrawalItems = [];
            document.getElementById('obraInput').value = '';
            this.updateWithdrawalList();
            
            this.showSuccess('Retiro confirmado exitosamente');
            
        } catch (error) {
            console.error('Error procesando retiro:', error);
            this.showError(`Error al confirmar retiro: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async processWithdrawal(obra) {
        try {
            // Preparar datos para el retiro
            const withdrawalData = {
                obra: obra,
                warehouse_id: this.currentWarehouse.id,
                user_id: this.currentUser.id,
                items: this.withdrawalItems.map(wi => ({
                    item_id: wi.item.id,
                    quantity: wi.quantity
                }))
            };

            // Intentar con Supabase
            const { data: withdrawal, error: withdrawalError } = await this.supabase
                .from('withdrawals')
                .insert([{
                    obra: obra,
                    warehouse_id: this.currentWarehouse.id,
                    user_id: this.currentUser.id,
                    withdrawal_date: new Date().toISOString()
                }])
                .select()
                .single();

            if (withdrawalError) throw withdrawalError;

            // Insertar items del retiro
            const withdrawalItemsData = this.withdrawalItems.map(wi => ({
                withdrawal_id: withdrawal.id,
                item_id: wi.item.id,
                quantity: wi.quantity
            }));

            const { error: itemsError } = await this.supabase
                .from('withdrawal_items')
                .insert(withdrawalItemsData);

            if (itemsError) throw itemsError;

            // Actualizar stock de items
            for (const wi of this.withdrawalItems) {
                const newStock = wi.item.stock - wi.quantity;
                
                const { error: stockError } = await this.supabase
                    .from('items')
                    .update({ stock: newStock })
                    .eq('id', wi.item.id);

                if (stockError) throw stockError;

                // Registrar en historial
                await this.recordHistory('withdrawal', wi.item.id, wi.quantity, obra);
            }

        } catch (error) {
            console.error('Error procesando retiro en Supabase:', error);
            
            // Fallback: usar backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/withdrawals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.currentUser.access_token}`
                },
                body: JSON.stringify(withdrawalData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error del servidor');
            }
        }
    }

    async recordHistory(actionType, itemId, quantity, obra = '') {
        try {
            const historyRecord = {
                action_type: actionType,
                item_id: itemId,
                quantity: quantity,
                obra: obra || this.currentWarehouse.name,
                user_id: this.currentUser.id,
                warehouse_id: this.currentWarehouse.id,
                action_date: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('history')
                .insert([historyRecord]);

            if (error) throw error;

        } catch (error) {
            console.error('Error registrando en historial:', error);
        }
    }
}
// Métodos de historial y funciones adicionales
class InventoryApp {
    // ... métodos anteriores ...

    async loadHistory() {
        try {
            const history = await this.fetchHistory();
            this.renderHistoryTable(history);
            
        } catch (error) {
            console.error('Error cargando historial:', error);
            this.showError('Error al cargar el historial');
        }
    }

    async fetchHistory() {
        if (!this.currentWarehouse) {
            throw new Error('No hay bodega seleccionada');
        }

        try {
            const { data, error } = await this.supabase
                .from('history')
                .select(`
                    *,
                    items(name),
                    users(full_name),
                    warehouses(name)
                `)
                .eq('warehouse_id', this.currentWarehouse.id)
                .order('action_date', { ascending: false })
                .limit(100);

            if (!error) {
                return data.map(record => ({
                    ...record,
                    item_name: record.items?.name || record.item_name,
                    user_name: record.users?.full_name || record.user_name,
                    warehouse_name: record.warehouses?.name || record.warehouse_name
                }));
            }

            // Fallback: usar backend API
            const response = await fetch(
                `${CONFIG.API_BASE_URL}/api/v1/history/warehouse/${this.currentWarehouse.id}`
            );
            
            if (response.ok) {
                return await response.json();
            }
            throw error;

        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    }

    renderHistoryTable(history) {
        const tbody = document.getElementById('historyTableBody');
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (history.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="text-center">No hay registros de historial</td>`;
            tbody.appendChild(row);
            return;
        }
        
        // Renderizar registros
        history.forEach(record => {
            const row = document.createElement('tr');
            
            // Formatear fecha
            const actionDate = new Date(record.action_date);
            const formattedDate = actionDate.toLocaleString('es-ES');
            
            // Traducir tipo de acción
            const actionTranslations = {
                'withdrawal': 'Retiro',
                'addition': 'Adición',
                'adjustment': 'Ajuste'
            };
            const actionText = actionTranslations[record.action_type] || record.action_type;
            
            // Clase CSS según tipo de acción
            let actionClass = '';
            if (record.action_type === 'withdrawal') {
                actionClass = 'withdrawal-action';
            } else if (record.action_type === 'addition') {
                actionClass = 'addition-action';
            }
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td class="${actionClass}">${actionText}</td>
                <td>${this.escapeHtml(record.item_name)}</td>
                <td>${record.quantity}</td>
                <td>${this.escapeHtml(record.obra)}</td>
                <td>${this.escapeHtml(record.user_name)}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Métodos para agregar nuevos items
    async showAddItemModal() {
        const modalContent = `
            <form id="addItemForm">
                <div class="form-group">
                    <label for="newItemName">Nombre:</label>
                    <input type="text" id="newItemName" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="newItemDescription">Descripción:</label>
                    <input type="text" id="newItemDescription" class="form-control">
                </div>
                
                <div class="form-group">
                    <label for="newItemBarcode">Código de barras:</label>
                    <input type="text" id="newItemBarcode" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="newItemStock">Stock inicial:</label>
                    <input type="number" id="newItemStock" class="form-control" value="0" min="0">
                </div>
                
                <div class="form-group">
                    <label for="newItemObra">Obra:</label>
                    <input type="text" id="newItemObra" class="form-control" 
                           placeholder="${this.currentWarehouse.name}">
                </div>
                
                <div class="form-group">
                    <label for="newItemFactura">N° Factura:</label>
                    <input type="text" id="newItemFactura" class="form-control" 
                           placeholder="${this.currentWarehouse.code}">
                </div>
                
                <div id="addItemError" class="error-message" style="display: none;"></div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="inventoryApp.hideModal('addItemModal')">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Guardar
                    </button>
                </div>
            </form>
        `;

        document.getElementById('addItemModal').querySelector('.modal-body').innerHTML = modalContent;
        
        // Configurar evento del formulario
        document.getElementById('addItemForm').addEventListener('submit', (e) => this.handleAddItem(e));
        
        this.showModal('addItemModal');
        document.getElementById('newItemName').focus();
    }

    async handleAddItem(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('newItemName').value.trim(),
            description: document.getElementById('newItemDescription').value.trim(),
            barcode: document.getElementById('newItemBarcode').value.trim(),
            stock: parseInt(document.getElementById('newItemStock').value) || 0,
            obra: document.getElementById('newItemObra').value.trim() || this.currentWarehouse.name,
            n_factura: document.getElementById('newItemFactura').value.trim() || this.currentWarehouse.code,
            warehouse_id: this.currentWarehouse.id
        };

        // Validaciones
        if (!formData.name || !formData.barcode) {
            this.showError('Nombre y código de barras son obligatorios', 'addItemError');
            return;
        }

        if (formData.stock < 0) {
            this.showError('El stock no puede ser negativo', 'addItemError');
            return;
        }

        this.showLoading();

        try {
            await this.createNewItem(formData);
            
            this.hideModal('addItemModal');
            this.showSuccess('Item agregado correctamente');
            
            // Recargar inventario
            await this.loadInventory();
            
        } catch (error) {
            console.error('Error creando item:', error);
            this.showError(error.message, 'addItemError');
        } finally {
            this.hideLoading();
        }
    }

    async createNewItem(itemData) {
        try {
            // Intentar con Supabase
            const { data, error } = await this.supabase
                .from('items')
                .insert([itemData])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Violación de unique constraint
                    throw new Error('Ya existe un item con ese código de barras');
                }
                throw error;
            }

            // Registrar en historial si hay stock inicial
            if (itemData.stock > 0) {
                await this.recordHistory('addition', data.id, itemData.stock);
            }

            return data;

        } catch (error) {
            console.error('Error creando item en Supabase:', error);
            
            // Fallback: usar backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/inventory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentUser.access_token}`
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error del servidor');
            }

            return await response.json();
        }
    }

    // Navegación entre páginas
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

    // Limpieza al cambiar de página
    cleanupPage(pageName) {
        switch (pageName) {
            case 'withdrawals':
                this.stopCamera();
                break;
        }
    }
}

// Estilos CSS adicionales para el historial
const additionalStyles = `
    .withdrawal-action {
        color: #f44336;
        font-weight: bold;
    }
    
    .addition-action {
        color: #4caf50;
        font-weight: bold;
    }
    
    .text-center {
        text-align: center;
    }
    
    .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
    }
`;

// Agregar estilos adicionales al documento
const styleSheet = document.createElement("style");
styleSheet.innerText = additionalStyles;
document.head.appendChild(styleSheet);
