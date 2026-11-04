document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Padding function
    const pad = (n) => String(n).padStart(2, '0');

    // 2. LocalStorage handling
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
                console.error("Error saving to Store:", e);
            }
        }
    };

    // 3. HTML escaping to prevent XSS
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

    // 4. Notification sound (Web Audio API)
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

        // Beep 1
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

        // Beep 2 (starts at 0.15s)
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

    // 5. Tree functions (Folders, Lists, and Notes)
    const Tree = {
        findNode(state, id) {
            if (state.pastas) {
                for (let p of state.pastas) {
                    if (p.id === id) return { item: p, type: 'pasta' };
                    const found = this.findNode(p, id);
                    if (found) return found;
                }
            }
            if (state.listas) {
                for (let l of state.listas) {
                    if (l.id === id) return { item: l, type: 'lista' };
                }
            }
            if (state.notas) {
                for (let n of state.notas) {
                    if (n.id === id) return { item: n, type: 'nota' };
                }
            }
            return null;
        },

        deleteNode(state, id) {
            if (state.pastas) {
                const initLen = state.pastas.length;
                state.pastas = state.pastas.filter(p => p.id !== id);
                if (state.pastas.length !== initLen) return true;
                
                for (let p of state.pastas) {
                    if (this.deleteNode(p, id)) return true;
                }
            }
            if (state.listas) {
                const initLen = state.listas.length;
                state.listas = state.listas.filter(l => l.id !== id);
                if (state.listas.length !== initLen) return true;
            }
            if (state.notas) {
                const initLen = state.notas.length;
                state.notas = state.notas.filter(n => n.id !== id);
                if (state.notas.length !== initLen) return true;
            }
            return false;
        },

        depthOf(state, id, currentDepth = 1) {
            if (!state.pastas) return 0;
            for (let p of state.pastas) {
                if (p.id === id) return currentDepth;
                const d = this.depthOf(p, id, currentDepth + 1);
                if (d > 0) return d;
            }
            return 0;
        },

        isFolderEmpty(pasta) {
            const pEmpty = !pasta.pastas || pasta.pastas.length === 0;
            const lEmpty = !pasta.listas || pasta.listas.length === 0;
            const nEmpty = !pasta.notas || pasta.notas.length === 0;
            return pEmpty && lEmpty && nEmpty;
        }
    };

    // Exposing functions globally to other files
    window.pad = pad;
    window.Store = Store;
    window.escapeHtml = escapeHtml;
    window.playNotificationSound = playNotificationSound;
    window.Tree = Tree;
});