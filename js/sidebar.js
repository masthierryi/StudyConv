document.addEventListener('DOMContentLoaded', () => {

    // 1. Global toggle function (exposed on window for HTML to access)
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

    // 2. Management class
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
            // Saved tab
            const savedTab = window.Store.get('sidebarTab', 'notas');
            this.switchTab(savedTab);

            // Saved right textarea
            const rightTextArea = document.getElementById('notes-area-right');
            if (rightTextArea) {
                rightTextArea.value = window.Store.get('userNotesRight', '');
            }

            // Logic for trigger areas to open on mouse hover (invisible hover and hover on tab handle)
            const trigLeft = document.querySelector('.trigger-area.left');
            const trigRight = document.querySelector('.trigger-area.right');
            const sbLeft = document.getElementById('sb-left');
            const sbRight = document.getElementById('sb-right');
            const handleLeft = document.querySelector('#sb-left .sidebar-handle');
            const handleRight = document.querySelector('#sb-right .sidebar-handle');

            if (trigLeft && sbLeft) {
                const openLeft = () => { if (window.matchMedia('(hover: hover)').matches) sbLeft.classList.add('open'); };
                trigLeft.addEventListener('mouseenter', () => sbLeft.classList.add('open'));
                if (handleLeft) handleLeft.addEventListener('mouseenter', openLeft);
                sbLeft.addEventListener('mouseleave', () => sbLeft.classList.remove('open'));
            }

            if (trigRight && sbRight) {
                const openRight = () => { if (window.matchMedia('(hover: hover)').matches) sbRight.classList.add('open'); };
                trigRight.addEventListener('mouseenter', () => sbRight.classList.add('open'));
                if (handleRight) handleRight.addEventListener('mouseenter', openRight);
                sbRight.addEventListener('mouseleave', () => sbRight.classList.remove('open'));
            }
        }

        bindEvents() {
            // Saves the right note on every keystroke
            const rightTextArea = document.getElementById('notes-area-right');
            if (rightTextArea) {
                rightTextArea.addEventListener('input', (e) => {
                    window.Store.set('userNotesRight', e.target.value);
                });
            }
        }
    }

    // Instantiates and exposes on window
    window.sidebarManager = new SidebarManager();
});