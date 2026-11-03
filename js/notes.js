document.addEventListener('DOMContentLoaded', () => {

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    class NotesManager {
        constructor() {
            this.state = window.Store.get('notes', []);
            
            this.container = document.getElementById('notes-container');
            this.btnNew = document.getElementById('btn-new-note');

            this.debouncedSave = debounce(() => this.save(), 300);

            window.notesManager = this;

            this.bindEvents();
            this.renderAll();
        }

        save() {
            window.Store.set('notes', this.state);
        }

        bindEvents() {
            if (this.btnNew) {
                this.btnNew.addEventListener('click', () => this.addNote());
            }

            if (!this.container) return;

            // Delegação de eventos para cliques (expandir/contrair, excluir e toolbar)
            this.container.addEventListener('click', (e) => {
                const header = e.target.closest('.note-header');
                const delBtn = e.target.closest('.del-btn');
                const block = e.target.closest('.note-block');

                if (!block) return;
                
                const id = Number(block.dataset.id);

                if (delBtn) {
                    this.state = this.state.filter(n => n.id !== id);
                    block.remove();
                    this.save();
                    return; // Para não propagar e abrir a nota
                }

                if (header) {
                    const note = this.state.find(n => n.id === id);
                    if (note) {
                        note.aberta = !note.aberta;
                        
                        const body = block.querySelector('.note-body');
                        const toggleBtn = block.querySelector('.toggle-btn');
                        
                        if (body) body.style.display = note.aberta ? 'flex' : 'none';
                        if (toggleBtn) toggleBtn.textContent = note.aberta ? '▾' : '▸';
                        
                        this.save();
                    }
                }

                // Ações da Toolbar
                const btnBold = e.target.closest('.btn-bold');
                const btnItalic = e.target.closest('.btn-italic');
                const btnView = e.target.closest('.btn-view');

                if (btnBold || btnItalic) {
                    const ta = block.querySelector('textarea');
                    if (ta && !ta.classList.contains('hidden')) {
                        this.applyFormatting(ta, btnBold ? '**' : '*');
                        ta.focus();
                    }
                }

                if (btnView) {
                    const ta = block.querySelector('textarea');
                    const view = block.querySelector('.note-rendered-view');
                    if (!ta || !view) return;

                    if (view.classList.contains('hidden')) {
                        // Mudar para o modo "Ver"
                        let html = window.escapeHtml(ta.value);
                        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
                        html = html.replace(/\n/g, '<br>');
                        
                        view.innerHTML = html;
                        view.classList.remove('hidden');
                        ta.classList.add('hidden');
                        btnView.textContent = 'Editar';
                    } else {
                        // Voltar para o modo "Editar"
                        view.classList.add('hidden');
                        ta.classList.remove('hidden');
                        btnView.textContent = 'Ver';
                        ta.focus();
                    }
                }
            });

            // Delegação de eventos para digitação natural (sem formatação via código)
            this.container.addEventListener('input', (e) => {
                if (e.target.tagName.toLowerCase() === 'textarea') {
                    const block = e.target.closest('.note-block');
                    if (!block) return;
                    
                    const id = Number(block.dataset.id);
                    const note = this.state.find(n => n.id === id);
                    
                    if (note) {
                        note.texto = e.target.value;
                        
                        const preview = block.querySelector('.note-preview');
                        if (preview) {
                            const firstLine = note.texto.trim() ? note.texto.split('\n')[0] : '(vazia)';
                            preview.textContent = firstLine; // textContent protege contra XSS naturalmente
                        }
                        
                        this.debouncedSave();
                    }
                }
            });

            // Atalhos de teclado no textarea
            this.container.addEventListener('keydown', (e) => {
                if (e.target.tagName.toLowerCase() !== 'textarea') return;
                const ta = e.target;

                // Ctrl+B (Negrito)
                if (e.ctrlKey && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    this.applyFormatting(ta, '**');
                }
                // Ctrl+I (Itálico)
                else if (e.ctrlKey && e.key.toLowerCase() === 'i') {
                    e.preventDefault();
                    this.applyFormatting(ta, '*');
                }
                // Tab e Shift+Tab (Indentação)
                else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.handleTab(ta, e.shiftKey);
                }
                // Enter (Indentação inteligente e Listas)
                else if (e.key === 'Enter') {
                    if (this.handleEnter(ta)) {
                        e.preventDefault();
                    }
                }
            });
        }

        applyFormatting(ta, token) {
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            const selText = val.substring(start, end);
            
            if (selText) {
                ta.value = val.substring(0, start) + token + selText + token + val.substring(end);
                ta.selectionStart = start + token.length;
                ta.selectionEnd = end + token.length;
            } else {
                ta.value = val.substring(0, start) + token + token + val.substring(end);
                ta.selectionStart = ta.selectionEnd = start + token.length;
            }
            this.triggerInput(ta);
        }

        handleTab(ta, shiftKey) {
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            
            let lineStart = val.lastIndexOf('\n', start - 1) + 1;
            let lineEnd = val.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = val.length;
            
            const lines = val.substring(lineStart, lineEnd).split('\n');
            let charsAdded = 0;
            let firstLineShift = 0;
            
            const newLines = lines.map((line, idx) => {
                if (shiftKey) {
                    const m = line.match(/^ {1,2}/);
                    if (m) {
                        const removed = m[0].length;
                        charsAdded -= removed;
                        if (idx === 0) firstLineShift = -removed;
                        return line.substring(removed);
                    }
                    return line;
                } else {
                    charsAdded += 2;
                    if (idx === 0) firstLineShift = 2;
                    return '  ' + line;
                }
            });
            
            ta.value = val.substring(0, lineStart) + newLines.join('\n') + val.substring(lineEnd);
            
            ta.selectionStart = Math.max(lineStart, start + firstLineShift);
            ta.selectionEnd = Math.max(lineStart, end + charsAdded);
            this.triggerInput(ta);
        }

        handleEnter(ta) {
            const start = ta.selectionStart;
            const val = ta.value;
            
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            const lineStr = val.substring(lineStart, start);
            
            const bulletMatch = lineStr.match(/^(\s*)-\s(.*)$/);
            const numMatch = lineStr.match(/^(\s*)(\d+)\.\s(.*)$/);
            const indentMatch = lineStr.match(/^(\s+)/);
            
            let insertStr = '\n';
            
            if (bulletMatch) {
                if (bulletMatch[2].trim() === '') { // Se a lista estiver vazia, apaga o marcador
                    ta.value = val.substring(0, lineStart) + val.substring(start);
                    ta.selectionStart = ta.selectionEnd = lineStart;
                    this.triggerInput(ta);
                    return true;
                }
                insertStr += bulletMatch[1] + '- ';
            } else if (numMatch) {
                if (numMatch[3].trim() === '') {
                    ta.value = val.substring(0, lineStart) + val.substring(start);
                    ta.selectionStart = ta.selectionEnd = lineStart;
                    this.triggerInput(ta);
                    return true;
                }
                const nextNum = parseInt(numMatch[2]) + 1;
                insertStr += numMatch[1] + nextNum + '. ';
            } else if (indentMatch) {
                insertStr += indentMatch[1];
            } else {
                return false; // Permite a quebra de linha padrão
            }
            
            ta.value = val.substring(0, start) + insertStr + val.substring(ta.selectionEnd);
            ta.selectionStart = ta.selectionEnd = start + insertStr.length;
            this.triggerInput(ta);
            return true;
        }

        // Simula o evento input para engatilhar as funções de salvamento (debounce) do bindEvents
        triggerInput(ta) {
            ta.dispatchEvent(new Event('input', { bubbles: true }));
        }

        addNote() {
            const newNote = {
                id: Date.now(),
                texto: '',
                aberta: true
            };
            
            this.state.unshift(newNote); // Coloca no topo
            this.save();
            
            if (this.container) {
                this.container.insertAdjacentHTML('afterbegin', this.createNoteHTML(newNote));
                
                // Foca automaticamente no textarea da nova nota
                const newTextarea = this.container.querySelector('.note-block textarea');
                if (newTextarea) newTextarea.focus();
            }
        }

        renderAll() {
            if (!this.container) return;
            this.container.innerHTML = this.state.map(note => this.createNoteHTML(note)).join('');
        }

        createNoteHTML(note) {
            const previewText = note.texto.trim() ? note.texto.split('\n')[0] : '(vazia)';
            const toggleIcon = note.aberta ? '▾' : '▸';
            const bodyStyle = note.aberta ? 'display: flex;' : 'display: none;';
            
            return `
                <div class="note-block" data-id="${note.id}">
                    <div class="note-header" title="Clique para expandir/contrair">
                        <span class="note-preview">${window.escapeHtml(previewText)}</span>
                        <div class="note-actions">
                            <button class="action-btn toggle-btn">${toggleIcon}</button>
                            <button class="action-btn text-danger del-btn" title="Excluir">×</button>
                        </div>
                    </div>
                    <div class="note-body" style="${bodyStyle}">
                        <div class="note-toolbar">
                            <button class="action-btn btn-bold" title="Negrito (Ctrl+B)">N</button>
                            <button class="action-btn btn-italic" title="Itálico (Ctrl+I)">I</button>
                            <button class="action-btn btn-view" style="margin-left: auto;">Ver</button>
                        </div>
                        <textarea placeholder="Digite sua nota aqui...">${window.escapeHtml(note.texto)}</textarea>
                        <div class="note-rendered-view hidden"></div>
                    </div>
                </div>
            `;
        }
    }

    new NotesManager();
});