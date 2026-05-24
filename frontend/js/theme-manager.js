/**
 * THEME MANAGER
 * Handles theme switching between Tama and Nana
 * Theme auto-switches when owner (Tama/Nana) is selected
 */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('selectedTheme') || 'theme-tama';
        this.themes = ['theme-tama', 'theme-nana'];
        this.themeNames = {
            'theme-tama': 'Tama',
            'theme-nana': 'Nana'
        };
        // Map owner name → theme class
        this.ownerThemeMap = {
            'Tama': 'theme-tama',
            'Nana': 'theme-nana'
        };
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme, false);
        this.setupSwitcher();
    }

    setupSwitcher() {
        const switcher = document.getElementById('themeSwitcher');
        if (switcher) {
            switcher.addEventListener('click', () => this.toggle());
        }
    }

    applyTheme(themeName, animate = true) {
        if (animate) {
            // Add transitioning class for smooth full-page crossfade
            document.body.classList.add('theme-transitioning');
        }

        // Remove all theme classes
        this.themes.forEach(theme => {
            document.body.classList.remove(theme);
        });

        // Add new theme class
        document.body.classList.add(themeName);
        this.currentTheme = themeName;

        // Update header switcher label
        const label = document.getElementById('themeLabel');
        if (label) {
            label.textContent = this.themeNames[themeName];
        }

        // Save preference
        localStorage.setItem('selectedTheme', themeName);

        // Remove transitioning class after animation
        if (animate) {
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
            }, 400);
        }

        // Dispatch custom event for other modules
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, name: this.themeNames[themeName] }
        }));

        console.log('🎨 Theme changed to:', themeName);
    }

    /**
     * Switch theme based on owner selection (Tama / Nana)
     * Called automatically when owner button is clicked
     */
    setThemeByOwner(ownerName) {
        const targetTheme = this.ownerThemeMap[ownerName];
        if (targetTheme && targetTheme !== this.currentTheme) {
            this.applyTheme(targetTheme, true);
        }
    }

    toggle() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex], true);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getThemeName() {
        return this.themeNames[this.currentTheme];
    }

    /**
     * Get theme-specific configuration
     */
    getThemeConfig() {
        const configs = {
            'theme-tama': {
                name: 'Tama',
                theme: 'graphite_black',
                font: 'Space Grotesk',
                icon: '💼'
            },
            'theme-nana': {
                name: 'Nana',
                theme: 'vintage',
                font: 'Playfair + Handwriting',
                icon: '✨'
            }
        };
        return configs[this.currentTheme];
    }
}

// Export for use in other modules
window.ThemeManager = ThemeManager;
