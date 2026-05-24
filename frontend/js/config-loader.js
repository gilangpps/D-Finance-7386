/**
 * CONFIG LOADER
 * Loads configuration from Google Sheets and provides easy access
 */

class ConfigLoader {
    constructor(spreadsheetId) {
        this.spreadsheetId = spreadsheetId;
        this.config = {
            owners: {},
            types: {},
            categories: {},
            sync: {},
            ui: {},
            drive: {},
            dashboard: {},
            validation: {}
        };
        this.loaded = false;
    }

    /**
     * Load config from Google Sheets via Apps Script
     */
    async load() {
        try {
            console.log('Loading config from Google Sheets...');
            const response = await fetch('/apps-script/getConfig', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.parseConfig(data.config);
                this.loaded = true;
                console.log('Config loaded successfully', this.config);
                return true;
            } else {
                throw new Error(data.error || 'Failed to load config');
            }
        } catch (error) {
            console.error('Error loading config:', error);
            // Fallback to hardcoded config
            this.loadFallback();
            return false;
        }
    }

    /**
     * Parse config array into organized structure
     */
    parseConfig(configArray) {
        configArray.forEach(row => {
            const [section, key, value, extra] = row;
            
            switch (section) {
                case 'owner':
                    this.config.owners[key] = { 
                        display: key, 
                        theme: value, 
                        font: extra 
                    };
                    break;
                    
                case 'type':
                    this.config.types[key] = { 
                        display: value, 
                        color: extra 
                    };
                    break;
                    
                case 'pemasukan':
                case 'pengeluaran':
                case 'investasi':
                    if (!this.config.categories[section]) {
                        this.config.categories[section] = {};
                    }
                    this.config.categories[section][key] = { 
                        display: value, 
                        type: extra 
                    };
                    break;
                    
                case 'sync':
                    this.config.sync[key] = { 
                        display: value, 
                        color: extra 
                    };
                    break;
                    
                case 'ui':
                    this.config.ui[key] = value;
                    break;
                    
                case 'drive':
                    this.config.drive[key] = value;
                    break;
                    
                case 'dashboard':
                    this.config.dashboard[key] = value === 'TRUE' || value === true;
                    break;
                    
                case 'validation':
                    this.config.validation[key] = isNaN(value) ? value : Number(value);
                    break;
            }
        });
    }

    /**
     * Fallback hardcoded config
     */
    loadFallback() {
        console.warn('Using fallback config');
        
        this.config = {
            owners: {
                'Tama': { display: 'Tama', theme: 'graphite_black', font: 'Space Grotesk' },
                'Nana': { display: 'Nana', theme: 'vintage', font: 'Playfair + Handwriting' }
            },
            types: {
                'pemasukan': { display: 'Pemasukan', color: 'green' },
                'pengeluaran': { display: 'Pengeluaran', color: 'red' },
                'investasi': { display: 'Investasi', color: 'gold' }
            },
            categories: {
                'pemasukan': {
                    'uang_jajan': { display: 'Uang Jajan', type: 'fixed' },
                    'gaji_honor': { display: 'Gaji/Honor', type: 'fixed' },
                    'given': { display: 'Given^°^', type: 'emotional' },
                    'hadiah': { display: 'Hadiah', type: 'optional' },
                    'freelance': { display: 'Freelance', type: 'optional' },
                    'lainnya': { display: 'Lainnya', type: 'custom' }
                },
                'pengeluaran': {
                    'tagihan': { display: 'Tagihan', type: 'fixed' },
                    'kebutuhan': { display: 'Kebutuhan', type: 'fixed' },
                    'hobi': { display: 'Hobi', type: 'flexible' },
                    'transport': { display: 'Transport', type: 'operational' },
                    'makan': { display: 'Makan', type: 'daily' },
                    'kesehatan': { display: 'Kesehatan', type: 'important' },
                    'gift': { display: 'Gift', type: 'optional' },
                    'lainnya': { display: 'Lainnya', type: 'custom' }
                },
                'investasi': {
                    'saham': { display: 'Saham', type: 'long_term' },
                    'nabung': { display: 'Nabung', type: 'safe' },
                    'emas': { display: 'Beli Emas', type: 'hedge' },
                    'crypto': { display: 'Crypto', type: 'volatile' },
                    'reksadana': { display: 'Reksadana', type: 'medium' },
                    'lainnya': { display: 'Lainnya', type: 'custom' }
                }
            },
            ui: {
                'currency': 'IDR',
                'locale': 'id-ID',
                'date_format': 'YYYY-MM-DD',
                'month_format': 'YYYY-MM'
            },
            drive: {
                'root_folder': 'Budgeting_7386_Attachments',
                'tama_folder': 'Tama',
                'nana_folder': 'Nana'
            },
            validation: {
                'min_amount': 1000,
                'max_amount': 999999999,
                'image_required': false,
                'note_required': false
            }
        };
        
        this.loaded = true;
    }

    /**
     * Get all transaction types
     */
    getTypes() {
        return Object.entries(this.config.types).map(([key, value]) => ({
            value: key,
            display: value.display,
            color: value.color
        }));
    }

    /**
     * Get categories for a specific type
     */
    getCategoriesByType(type) {
        if (!this.config.categories[type]) {
            return [];
        }
        
        return Object.entries(this.config.categories[type]).map(([key, value]) => ({
            value: key,
            display: value.display,
            type: value.type
        }));
    }

    /**
     * Get owners list
     */
    getOwners() {
        return Object.entries(this.config.owners).map(([key, value]) => ({
            value: key,
            display: value.display,
            theme: value.theme,
            font: value.font
        }));
    }

    /**
     * Get validation rules
     */
    getValidation() {
        return this.config.validation;
    }

    /**
     * Get UI settings
     */
    getUISettings() {
        return this.config.ui;
    }

    /**
     * Get Drive settings
     */
    getDriveSettings() {
        return this.config.drive;
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        const locale = this.config.ui.locale || 'id-ID';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this.config.ui.currency || 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const locale = this.config.ui.locale || 'id-ID';
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    /**
     * Get month key (YYYY-MM)
     */
    getMonthKey(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }
}

// Export for use in other modules
window.ConfigLoader = ConfigLoader;
