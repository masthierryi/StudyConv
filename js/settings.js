document.addEventListener('DOMContentLoaded', () => {

    class SettingsManager {
        constructor() {
            this.overlay = document.getElementById('settings-overlay');
            this.btnSettings = document.getElementById('btn-settings');
            this.btnClose = document.getElementById('btn-close-settings');
            this.btnDownload = document.getElementById('btn-download-backup');
            this.btnImport = document.getElementById('btn-import-backup');
            this.inputFile = document.getElementById('input-file-backup');
            this.btnWipe = document.getElementById('btn-wipe-data');

            this.bindEvents();
        }

        bindEvents() {
            if (this.btnSettings) this.btnSettings.addEventListener('click', () => this.open());
            if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());
            
            // Fecha ao clicar no fundo escuro fora do modal
            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) this.close();
                });
            }

            if (this.btnDownload) this.btnDownload.addEventListener('click', () => this.downloadBackup());
            
            if (this.btnImport && this.inputFile) {
                this.btnImport.addEventListener('click', () => this.inputFile.click());
                this.inputFile.addEventListener('change', (e) => this.importBackup(e));
            }
            
            if (this.btnWipe) this.btnWipe.addEventListener('click', () => this.wipeData());
        }

        open() {
            if (this.overlay) this.overlay.classList.remove('hidden');
        }

        close() {
            if (this.overlay) this.overlay.classList.add('hidden');
        }

        downloadBackup() {
            const dados = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                dados[key] = localStorage.getItem(key);
            }

            const backup = {
                versao: 1,
                criadoEm: new Date().toISOString(),
                dados: dados
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const d = new Date();
            const ano = d.getFullYear();
            const mes = window.pad(d.getMonth() + 1);
            const dia = window.pad(d.getDate());
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${ano}-${mes}-${dia}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        importBackup(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const json = JSON.parse(ev.target.result);
                    
                    if (!json.versao || typeof json.dados !== 'object' || json.dados === null) {
                        alert("Arquivo inválido.");
                        this.inputFile.value = '';
                        return;
                    }

                    if (confirm("Isso vai substituir todos os seus dados. Continuar?")) {
                        localStorage.clear();
                        for (const key in json.dados) {
                            localStorage.setItem(key, json.dados[key]);
                        }
                        location.reload();
                    }
                } catch (err) {
                    alert("Arquivo inválido.");
                }
                this.inputFile.value = ''; // Limpa o input file
            };
            reader.readAsText(file);
        }

        wipeData() {
            if (confirm("Tem certeza que deseja apagar TODOS os seus dados?")) {
                if (confirm("Aviso final: Essa ação é irreversível e apagará listas, notas e timers. Deseja mesmo continuar?")) {
                    localStorage.clear();
                    location.reload();
                }
            }
        }
    }

    window.settingsManager = new SettingsManager();
});