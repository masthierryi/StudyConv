document.addEventListener('DOMContentLoaded', () => {

    class PomodoroController {
        constructor() {
            // Elementos
            this.elTime = document.getElementById('time-main');
            this.elStatus = document.getElementById('status-main');
            this.elMiniTime = document.getElementById('mini-time');
            this.elMiniStatus = document.getElementById('mini-status');
            this.elProgLinear = document.getElementById('progresso-linear');
            this.elProgMain = document.getElementById('progresso-main');
            this.btnMain = document.getElementById('btn-main');
            this.btnReset = document.getElementById('btn-reset-main');
            this.inputFocus = document.getElementById('manual-focus-time');
            this.inputRest = document.getElementById('manual-rest-time');
            this.btnEdit = document.getElementById('btn-pomo-edit');
            this.container = document.getElementById('pomodoro-main');
            this.noteArea = document.getElementById('pomo-side-note');
            this.btnPreset25 = document.getElementById('btn-preset-25-5');
            this.btnPreset50 = document.getElementById('btn-preset-50-10');

            // Estado
            this.mode = 'focus'; // 'focus' ou 'rest'
            this.isRunning = false;
            this.timeLeft = 0;
            this.totalTime = 0;
            this.endTime = 0;
            this.timerInterval = null;
            this.svgLength = this.elProgMain ? this.elProgMain.getTotalLength() : 0;

            if (this.elProgMain && this.svgLength) {
                this.elProgMain.style.strokeDasharray = this.svgLength;
                this.elProgMain.style.strokeDashoffset = 0;
            }

            this.init();
            this.bindEvents();
        }

        init() {
            // Carrega tempos salvos ou usa os do input
            const savedTimes = window.Store.get('pomoTimes');
            if (savedTimes && savedTimes.focus && savedTimes.rest) {
                if (this.inputFocus) this.inputFocus.value = savedTimes.focus;
                if (this.inputRest) this.inputRest.value = savedTimes.rest;
            }

            // Carrega nota lateral
            const savedNoteOpen = window.Store.get('pomoNoteOpen', false);
            if (savedNoteOpen && this.container) {
                this.container.classList.add('pomo-editing');
            }

            const savedNoteText = window.Store.get('pomoSideNote', '');
            if (this.noteArea) {
                this.noteArea.value = savedNoteText;
            }

            this.updateActivePresetButton();
            this.resetTimer();
        }

        bindEvents() {
            if (this.btnMain) {
                this.btnMain.addEventListener('click', () => this.toggle());
            }

            if (this.btnReset) {
                this.btnReset.addEventListener('click', () => {
                    this.mode = 'focus';
                    this.resetTimer();
                });
            }

            const handleInputChange = () => {
                const f = parseInt(this.inputFocus.value) || 25;
                const r = parseInt(this.inputRest.value) || 5;
                window.Store.set('pomoTimes', { focus: f, rest: r });
                this.updateActivePresetButton();
                if (!this.isRunning) {
                    this.resetTimer();
                }
            };

            if (this.inputFocus) this.inputFocus.addEventListener('change', handleInputChange);
            if (this.inputRest) this.inputRest.addEventListener('change', handleInputChange);

            if (this.btnEdit && this.container) {
                this.btnEdit.addEventListener('click', () => {
                    this.container.classList.toggle('pomo-editing');
                    window.Store.set('pomoNoteOpen', this.container.classList.contains('pomo-editing'));
                });
            }

            if (this.noteArea) {
                this.noteArea.addEventListener('input', () => {
                    window.Store.set('pomoSideNote', this.noteArea.value);
                });
            }
        }

        toggle() {
            if (this.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        }

        start() {
            if (this.isRunning) return;
            
            if (window.initAudio) window.initAudio();

            this.isRunning = true;
            this.endTime = Date.now() + (this.timeLeft * 1000);
            
            if (this.btnMain) {
                this.btnMain.textContent = "PAUSE";
            }

            this.timerInterval = setInterval(() => this.tick(), 1000);
            this.tick(); 
        }

        pause() {
            if (!this.isRunning) return;
            
            this.isRunning = false;
            clearInterval(this.timerInterval);
            
            if (this.btnMain) {
                this.btnMain.textContent = "START";
            }
        }

        resetTimer() {
            this.pause();
            
            const minutes = this.mode === 'focus' 
                ? (parseInt(this.inputFocus ? this.inputFocus.value : 25) || 25)
                : (parseInt(this.inputRest ? this.inputRest.value : 5) || 5);
                
            this.totalTime = minutes * 60;
            this.timeLeft = this.totalTime;
            
            this.render();
        }

        tick() {
            if (!this.isRunning) return;

            const now = Date.now();
            this.timeLeft = Math.round((this.endTime - now) / 1000);

            if (this.timeLeft <= 0) {
                if (window.playNotificationSound) window.playNotificationSound();
                this.mode = this.mode === 'focus' ? 'rest' : 'focus';
                
                const minutes = this.mode === 'focus' 
                    ? (parseInt(this.inputFocus ? this.inputFocus.value : 25) || 25)
                    : (parseInt(this.inputRest ? this.inputRest.value : 5) || 5);
                    
                this.totalTime = minutes * 60;
                this.timeLeft = this.totalTime;
                this.endTime = Date.now() + (this.timeLeft * 1000);
            }

            this.render();
        }

        render() {
            const m = Math.floor(this.timeLeft / 60);
            const s = this.timeLeft % 60;
            const timeString = window.pad(m) + ':' + window.pad(s);
            const statusString = this.mode === 'focus' ? 'FOCUS' : 'REST';
            const colorVar = this.mode === 'focus' ? 'var(--accent)' : 'var(--success)';

            if (this.elTime) this.elTime.textContent = timeString;
            if (this.elMiniTime) this.elMiniTime.textContent = timeString;
            if (this.elStatus) {
                this.elStatus.textContent = statusString;
                this.elStatus.style.color = colorVar;
            }
            if (this.elMiniStatus) {
                this.elMiniStatus.textContent = statusString;
                this.elMiniStatus.style.color = colorVar;
            }

            // Progresso (0 a 1)
            const progress = this.totalTime > 0 ? (this.totalTime - this.timeLeft) / this.totalTime : 0;

            if (this.elProgLinear) {
                this.elProgLinear.style.width = (progress * 100) + '%';
                this.elProgLinear.style.backgroundColor = colorVar;
            }

            if (this.elProgMain && this.svgLength) {
                const offset = this.svgLength - (progress * this.svgLength);
                this.elProgMain.style.strokeDashoffset = offset;
                this.elProgMain.style.stroke = colorVar;
            }
        }

        applyPreset(focus, rest) {
            if (this.inputFocus) this.inputFocus.value = focus;
            if (this.inputRest) this.inputRest.value = rest;
            
            window.Store.set('pomoTimes', { focus, rest });
            this.updateActivePresetButton();
            
            this.mode = 'focus';
            this.resetTimer();
        }

        updateActivePresetButton() {
            const f = parseInt(this.inputFocus ? this.inputFocus.value : 25);
            const r = parseInt(this.inputRest ? this.inputRest.value : 5);

            if (this.btnPreset25) {
                this.btnPreset25.classList.toggle('active', f === 25 && r === 5);
            }
            if (this.btnPreset50) {
                this.btnPreset50.classList.toggle('active', f === 50 && r === 10);
            }
        }
    }

    window.pomodoro = new PomodoroController();
});