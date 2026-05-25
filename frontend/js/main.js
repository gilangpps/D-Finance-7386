/**
 * MAIN APP INITIALIZATION
 * Brings together all modules and initializes the app
 */

class BudgetingApp {
    constructor() {
        this.config = null;
        this.theme = null;
        this.formHandler = null;
        this.stats = null;
        this.appsScriptUrl = 'https://script.google.com/macros/s/AKfycbz-ZD9NEUQsCjMRz-9q4ahiVOUrb4tHET0XsEoPFC6emY-LQ_qFGBbL3QrKPsUYg9aR/exec'; // Will be provided in config or env
    }

    async init() {
        try {
            console.log('🚀 Welcome to D\'Finance | 7386...');

            // 1. Initialize theme
            this.theme = new ThemeManager();
            console.log('✓ Theme initialized');

            // 2. Initialize config
            this.config = new ConfigLoader();
            await this.config.load();
            console.log('✓ Config loaded');

            // 3. Initialize form handler
            const form = document.getElementById('transactionForm');
            this.formHandler = new FormHandler(form, this.config, this.theme);
            console.log('✓ Form handler initialized');

            // 4. Set Apps Script URL
            // This should come from your deployment or a configuration
            this.appsScriptUrl = this.getAppsScriptUrl();
            if (this.appsScriptUrl) {
                this.formHandler.setAppsScriptUrl(this.appsScriptUrl);
                console.log('✓ Apps Script URL configured');
                // Fetch stats asynchronously
                this.fetchStats();
            } else {
                console.warn('⚠ Apps Script URL not configured');
            }

            // 5. Setup theme change listener
            window.addEventListener('themeChanged', (e) => {
                console.log('Theme changed to:', e.detail.theme);
                
                // Update dashboard link dynamically based on theme change
                const link = document.getElementById('btnLinkDashboard');
                if (link && e.detail.theme.startsWith('theme-')) {
                    const owner = e.detail.theme.replace('theme-', '');
                    link.href = `dashboard.html?owner=${owner.charAt(0).toUpperCase() + owner.slice(1)}`;
                }
            });

            console.log('✅ App initialized successfully!');

        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.showErrorMessage('Failed to initialize app');
        }
    }

    /**
     * Get Apps Script URL
     * Priority: environment variable > localStorage > prompt user
     */
    getAppsScriptUrl() {
        // Return the hardcoded URL if already set in the constructor
        if (this.appsScriptUrl) {
            return this.appsScriptUrl;
        }

        // Check environment
        if (window.APPS_SCRIPT_URL) {
            return window.APPS_SCRIPT_URL;
        }

        // Check localStorage
        const stored = localStorage.getItem('appsScriptUrl');
        if (stored) {
            return stored;
        }

        // Prompt user
        const url = prompt('Enter your Google Apps Script deployment URL:', '');
        if (url) {
            localStorage.setItem('appsScriptUrl', url);
            return url;
        }

        return null;
    }

    /**
     * Set Apps Script URL manually
     */
    setAppsScriptUrl(url) {
        this.appsScriptUrl = url;
        localStorage.setItem('appsScriptUrl', url);
        
        if (this.formHandler) {
            this.formHandler.setAppsScriptUrl(url);
        }

        console.log('Apps Script URL set to:', url);
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const feedback = document.getElementById('formFeedback');
        feedback.className = 'form-feedback error';
        feedback.textContent = '❌ ' + message;
        feedback.style.display = 'block';
    }

    /**
     * Fetch stats for the minimum dashboard
     * Fetches both owners independently → stored as { Tama:{...}, Nana:{...} }
     * so updateStatsUI(owner) can read the right slice
     */
    async fetchStats() {
        if (!this.appsScriptUrl) return;
        try {
            const [tamaRes, nanaRes] = await Promise.all([
                fetch(`${this.appsScriptUrl}?action=getStats&owner=Tama`),
                fetch(`${this.appsScriptUrl}?action=getStats&owner=Nana`)
            ]);
            const [tamaData, nanaData] = await Promise.all([
                tamaRes.json(),
                nanaRes.json()
            ]);

            this.stats = {};
            if (tamaData.success && tamaData.stats) this.stats['Tama'] = tamaData.stats;
            if (nanaData.success && nanaData.stats) this.stats['Nana'] = nanaData.stats;

            console.log('✓ Stats loaded', this.stats);

            if (this.formHandler && this.formHandler.selectedOwner) {
                this.formHandler.updateStatsUI(this.formHandler.selectedOwner);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }

    /**
     * Refresh a single owner's stats after new transaction
     */
    async refreshOwnerStats(owner) {
        if (!this.appsScriptUrl || !owner) return;
        try {
            const res = await fetch(`${this.appsScriptUrl}?action=getStats&owner=${owner}`);
            const data = await res.json();
            if (data.success && data.stats) {
                if (!this.stats) this.stats = {};
                this.stats[owner] = data.stats;
                if (this.formHandler && this.formHandler.selectedOwner === owner) {
                    this.formHandler.updateStatsUI(owner);
                }
            }
        } catch (e) {
            console.error('Failed to refresh stats:', e);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BudgetingApp();
    window.app.init();
});

// Expose globally for debugging
window.debugApp = {
    getConfig: () => window.app.config.config,
    getTheme: () => window.app.theme.getCurrentTheme(),
    setAppsScriptUrl: (url) => window.app.setAppsScriptUrl(url),
    getFormData: () => {
        const form = document.getElementById('transactionForm');
        return new FormData(form);
    }
};

console.log('📱 D\'Finance | 7386 ');
console.log('💡 Use window.debugApp for debugging');
