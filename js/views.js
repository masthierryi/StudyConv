document.addEventListener('DOMContentLoaded', () => {

    class ViewManager {
        constructor() {
            this.pages = {
                pomodoro: 'view-pomodoro',
                timer: 'view-timer'
            };
            this.navBtns = document.querySelectorAll('.nav-btn');
            this.sidebars = document.querySelectorAll('.sidebar');

            this.init();
        }

        init() {
            let savedView = window.Store.get('currentView');
            if (!savedView || !this.pages[savedView]) {
                savedView = 'timer';
            }
            this.switch(savedView);
        }

        switch(name) {
            if (!this.pages[name]) return;

            // Salva no localStorage usando a classe Store criada anteriormente
            window.Store.set('currentView', name);

            // Controla a visibilidade das páginas
            for (const [key, id] of Object.entries(this.pages)) {
                const el = document.getElementById(id);
                if (el) {
                    if (key === name) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                }
            }

            // Atualiza o estado dos botões da barra de navegação
            if (this.navBtns) {
                this.navBtns.forEach(btn => {
                    if (btn.getAttribute('data-view') === name) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }

            // Fecha qualquer barra lateral aberta
            if (this.sidebars) {
                this.sidebars.forEach(sidebar => {
                    sidebar.classList.remove('open');
                });
            }
        }
    }

    class ClockWidget {
        constructor() {
            this.dateEl = document.getElementById('clock-date');
            this.timeEl = document.getElementById('clock-time');
            this.dias = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];

            this.updateClock = this.updateClock.bind(this);
            this.updateClock();
        }

        updateClock() {
            const d = new Date();

            if (this.dateEl) {
                const textoData = this.dias[d.getDay()] + ', ' + 
                                  window.pad(d.getDate()) + '/' + 
                                  window.pad(d.getMonth() + 1) + '/' + 
                                  d.getFullYear();
                this.dateEl.textContent = textoData;
            }

            if (this.timeEl) {
                const textoHora = window.pad(d.getHours()) + ':' + 
                                  window.pad(d.getMinutes()) + ':' + 
                                  window.pad(d.getSeconds());
                this.timeEl.textContent = textoHora;
            }

            // Calcula os milissegundos restantes até o próximo segundo exato
            const delay = 1000 - (Date.now() % 1000);
            setTimeout(this.updateClock, delay);
        }
    }

    // Instancia e expõe no window para acesso pelo HTML
    window.viewManager = new ViewManager();
    window.clockWidget = new ClockWidget();

});