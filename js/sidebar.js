document.addEventListener('DOMContentLoaded', () => {

    // 1. Função global de toggle (exposta no window para o HTML acessar)
    window.toggleSidebar = function(side) {
        const sbLeft = document.getElementById('sb-left');
        const sbRight = document.getElementById('sb-right');
        
        if (!sbLeft || !sbRight) return;

        if (side === 'left') {
            sbLeft.classList.toggle('open');
            sbRight.classList.remove('open');
        } else if (side === 'right') {
            sbRight.classList.toggle('open');
            sbLeft.classList.remove('open');
        }
    };

    // 2. Classe de gerenciamento
    class SidebarManager {
        constructor() {
            this.init();
            this.bindEvents();
        }

        toggle() {
            window.toggleSidebar('left');
        }

        switchTab(nome) {
            const tabs = ['notas', 'listas'];
            
            tabs.forEach(tab => {
                const pane = document.getElementById(`sb-tab-${tab}`);
                const btn = document.querySelector(`.sb-tab-btn[data-tab="${tab}"]`);
                
                if (!pane || !btn) return;

                if (tab === nome) {
                    pane.classList.remove('hidden');
                    btn.classList.add('active');
                } else {
                    pane.classList.add('hidden');
                    btn.classList.remove('active');
                }
            });

            window.Store.set('sidebarTab', nome);
        }

        init() {
            // Aba salva
            const savedTab = window.Store.get('sidebarTab', 'notas');
            this.switchTab(savedTab);

            // Textarea da direita salva
            const rightTextArea = document.getElementById('notes-area-right');
            if (rightTextArea) {
                rightTextArea.value = window.Store.get('userNotesRight', '');
            }

            // Lógica das áreas de gatilho para abrir ao passar o mouse (hover invisível)
            const trigLeft = document.querySelector('.trigger-area.left');
            const trigRight = document.querySelector('.trigger-area.right');
            const sbLeft = document.getElementById('sb-left');
            const sbRight = document.getElementById('sb-right');

            if (trigLeft && sbLeft) {
                trigLeft.addEventListener('mouseenter', () => sbLeft.classList.add('open'));
                sbLeft.addEventListener('mouseleave', () => sbLeft.classList.remove('open'));
            }

            if (trigRight && sbRight) {
                trigRight.addEventListener('mouseenter', () => sbRight.classList.add('open'));
                sbRight.addEventListener('mouseleave', () => sbRight.classList.remove('open'));
            }
        }

        bindEvents() {
            // Salva a nota da direita a cada digitação
            const rightTextArea = document.getElementById('notes-area-right');
            if (rightTextArea) {
                rightTextArea.addEventListener('input', (e) => {
                    window.Store.set('userNotesRight', e.target.value);
                });
            }
        }
    }

    // Instancia e expõe no window
    window.sidebarManager = new SidebarManager();
});