document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Função de padding
    const pad = (n) => String(n).padStart(2, '0');

    // 2. Manipulação do LocalStorage
    const Store = {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error("Erro ao salvar no Store:", e);
            }
        }
    };

    // 3. Escape de HTML para evitar XSS
    function escapeHtml(texto) {
        if (typeof texto !== 'string') return texto;
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return texto.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // 4. Som de notificação (Web Audio API)
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playNotificationSound() {
        initAudio();
        if (!audioCtx) return;

        const time = audioCtx.currentTime;

        // Bipe 1
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'square';
        osc1.frequency.value = 880;
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        
        gain1.gain.setValueAtTime(0.05, time);
        gain1.gain.linearRampToValueAtTime(0.001, time + 0.1);
        
        osc1.start(time);
        osc1.stop(time + 0.1);

        // Bipe 2 (inicia em 0.15s)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.value = 880;
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        gain2.gain.setValueAtTime(0.05, time + 0.15);
        gain2.gain.linearRampToValueAtTime(0.001, time + 0.25);
        
        osc2.start(time + 0.15);
        osc2.stop(time + 0.25);
    }

    // Expondo as funções globalmente para os outros arquivos
    window.pad = pad;
    window.Store = Store;
    window.escapeHtml = escapeHtml;
    window.playNotificationSound = playNotificationSound;
});