document.addEventListener('DOMContentLoaded', () => {

    class ThemeManager {
        constructor() {
            this.themes = {
                'gruvbox-light': {
                    name: 'Gruvbox Claro',
                    vars: null // Padrão do site (:root)
                },
                'gruvbox-dark': {
                    name: 'Gruvbox Escuro',
                    vars: {
                        '--bg': '#282828',
                        '--surface': '#3c3836',
                        '--text': '#ebdbb2',
                        '--text-muted': '#a89984',
                        '--accent': '#83a598',
                        '--accent-text': '#282828',
                        '--danger': '#fb4934',
                        '--success': '#b8bb26',
                        '--clock-text': '#ebdbb2'
                    }
                },
                'dracula': {
                    name: 'Dracula',
                    vars: {
                        '--bg': '#282a36',
                        '--surface': '#44475a',
                        '--text': '#f8f8f2',
                        '--text-muted': '#6272a4',
                        '--accent': '#bd93f9',
                        '--accent-text': '#282a36',
                        '--danger': '#ff5555',
                        '--success': '#50fa7b',
                        '--clock-text': '#f8f8f2'
                    }
                },
                'nord': {
                    name: 'Nord',
                    vars: {
                        '--bg': '#2e3440',
                        '--surface': '#3b4252',
                        '--text': '#eceff4',
                        '--text-muted': '#acbad8',
                        '--accent': '#88c0d0',
                        '--accent-text': '#2e3440',
                        '--danger': '#bf616a',
                        '--success': '#a3be8c',
                        '--clock-text': '#eceff4'
                    }
                },
                'solarized-light': {
                    name: 'Solarized Claro',
                    vars: {
                        '--bg': '#fdf6e3',
                        '--surface': '#eee8d5',
                        '--text': '#657b83',
                        '--text-muted': '#93a1a1',
                        '--accent': '#268bd2',
                        '--accent-text': '#fdf6e3',
                        '--danger': '#dc322f',
                        '--success': '#859900',
                        '--clock-text': '#657b83'
                    }
                },
                'solarized-dark': {
                    name: 'Solarized Escuro',
                    vars: {
                        '--bg': '#002b36',
                        '--surface': '#073642',
                        '--text': '#839496',
                        '--text-muted': '#586e75',
                        '--accent': '#2aa198',
                        '--accent-text': '#002b36',
                        '--danger': '#dc322f',
                        '--success': '#859900',
                        '--clock-text': '#93a1a1'
                    }
                },
                'monokai': {
                    name: 'Monokai',
                    vars: {
                        '--bg': '#272822',
                        '--surface': '#3e3d32',
                        '--text': '#f8f8f2',
                        '--text-muted': '#75715e',
                        '--accent': '#a6e22e',
                        '--accent-text': '#272822',
                        '--danger': '#f92672',
                        '--success': '#a6e22e',
                        '--clock-text': '#f8f8f2'
                    }
                }
            };

            this.btnToggle = document.getElementById('btn-theme-toggle');
            this.currentTheme = window.Store.get('theme', 'gruvbox-light');
            this.menuEl = null;

            window.themeManager = this;

            this.applyTheme(this.currentTheme, false);
            this.buildMenu();
            this.bindEvents();
        }

        applyTheme(id, save = true) {
            if (!this.themes[id]) id = 'gruvbox-light';
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

            for (const [id, themeObj] of Object.entries(this.themes)) {
                const item = document.createElement('div');
                item.className = 'theme-menu-item';
                item.dataset.themeId = id;
                item.textContent = themeObj.name;
                
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.applyTheme(id);
                    this.closeMenu();
                });

                this.menuEl.appendChild(item);
            }

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

            // Clicar fora fecha o menu
            document.addEventListener('click', (e) => {
                if (this.menuEl && !this.menuEl.contains(e.target) && e.target !== this.btnToggle) {
                    this.closeMenu();
                }
            });
        }
    }

    new ThemeManager();
});