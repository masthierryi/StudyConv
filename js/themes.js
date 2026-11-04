document.addEventListener('DOMContentLoaded', () => {

    class ThemeManager {
        constructor() {
            this.themes = [
                { id: 'gruvbox-light', name: 'Gruvbox Light' },
                { id: 'gruvbox-dark', name: 'Gruvbox Dark' },
                { id: 'dracula', name: 'Dracula' },
                { id: 'nord', name: 'Nord' },
                { id: 'solarized-light', name: 'Solarized Light' },
                { id: 'solarized-dark', name: 'Solarized Dark' },
                { id: 'monokai', name: 'Monokai' },
                { id: 'monokai-orange', name: 'Monokai Orange' },
                { id: 'catppuccin-mocha', name: 'Catppuccin Mocha' },
                { id: 'catppuccin-latte', name: 'Catppuccin Latte' },
                { id: 'tokyo-night', name: 'Tokyo Night' },
                { id: 'one-dark', name: 'One Dark' },
                { id: 'one-light', name: 'One Light' },
                { id: 'rose-pine', name: 'Rosé Pine' },
                { id: 'everforest', name: 'Everforest Dark' },
                { id: 'kanagawa', name: 'Kanagawa' },
                { id: 'github-dark', name: 'GitHub Dark' },
                { id: 'ayu-mirage', name: 'Ayu Mirage' }
            ];

            this.btnToggle = document.getElementById('btn-theme-toggle');
            this.currentTheme = window.Store.get('theme', 'gruvbox-light');
            this.menuEl = null;

            window.themeManager = this;

            this.applyTheme(this.currentTheme, false);
            this.buildMenu();
            this.bindEvents();
        }

        applyTheme(id, save = true) {
            if (!this.themes.find(t => t.id === id)) id = 'gruvbox-light';
            this.currentTheme = id;

            if (id === 'gruvbox-light') {
                document.body.removeAttribute('data-theme');
            } else {
                document.body.setAttribute('data-theme', id);
            }

            if (save) {
                window.Store.set('theme', id);
            }

            this.updateMenuSelection();
        }

        buildMenu() {
            if (this.menuEl) this.menuEl.remove();

            this.menuEl = document.createElement('div');
            this.menuEl.className = 'theme-dropdown-menu hidden';

            this.themes.forEach(themeObj => {
                const item = document.createElement('div');
                item.className = 'theme-menu-item';
                item.dataset.themeId = themeObj.id;
                
                const swatch = document.createElement('span');
                swatch.className = 'theme-swatch';
                swatch.dataset.theme = themeObj.id;
                swatch.innerHTML = '<i></i><i></i><i></i>';
                
                const text = document.createTextNode(themeObj.name);

                item.appendChild(swatch);
                item.appendChild(text);
                
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.applyTheme(themeObj.id);
                    this.closeMenu();
                });

                this.menuEl.appendChild(item);
            });

            document.body.appendChild(this.menuEl);
        }

        updateMenuSelection() {
            if (!this.menuEl) return;
            const items = this.menuEl.querySelectorAll('.theme-menu-item');
            items.forEach(item => {
                if (item.dataset.themeId === this.currentTheme) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        openMenu() {
            if (!this.btnToggle || !this.menuEl) return;
            const rect = this.btnToggle.getBoundingClientRect();
            
            this.menuEl.style.top = (rect.bottom + 6) + 'px';
            this.menuEl.style.left = rect.left + 'px';
            this.menuEl.classList.remove('hidden');
        }

        closeMenu() {
            if (this.menuEl) {
                this.menuEl.classList.add('hidden');
            }
        }

        toggleMenu() {
            if (!this.menuEl) return;
            if (this.menuEl.classList.contains('hidden')) {
                this.openMenu();
            } else {
                this.closeMenu();
            }
        }

        bindEvents() {
            if (this.btnToggle) {
                this.btnToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMenu();
                });
            }

            // Clicking outside closes the menu
            document.addEventListener('click', (e) => {
                if (this.menuEl && !this.menuEl.contains(e.target) && e.target !== this.btnToggle) {
                    this.closeMenu();
                }
            });
        }
    }

    new ThemeManager();
});