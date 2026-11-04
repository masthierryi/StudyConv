### Arquivo: .\js\lists.js
`$Lang
document.addEventListener('DOMContentLoaded', () => {

    class ListsManager {
        constructor() {
            this.state = window.Store.get('listsData', { pastas: [], listas: [] });
            this.container = document.getElementById('lists-container');
            
            window.listsManager = this;
            
            this.bindEvents();
            this.renderAll();
        }

        save() {
            window.Store.set('listsData', this.state);
        }

        // Renderiza tudo e mantÃ©m o foco no input de "Novo item" se estiver focado
        renderAndPreserveFocus() {
            let focusedListId = null;
            if (document.activeElement && document.activeElement.dataset.action === 'add-item-input') {
                focusedListId = document.activeElement.dataset.listId;
            }

            this.renderAll();

            if (focusedListId) {
                const input = document.querySelector(`input[data-action="add-item-input"][data-list-id="${focusedListId}"]`);
                if (input) input.focus();
            }
        }

        // --- AÃ‡Ã•ES GLOBAIS ---

        addRootFolder() {
            this.state.pastas.push({
                id: Date.now(),
                nome: 'Nova pasta',
                aberta: true,
                pastas: [],
                listas: []
            });
            this.save();
            this.renderAndPreserveFocus();
        }

        addRootList() {
            this.state.listas.push({
                id: Date.now(),
                titulo: 'Nova lista',
                aberta: true,
                itens: []
            });
            this.save();
            this.renderAndPreserveFocus();
        }

        // --- EVENT DELEGATION ---

        bindEvents() {
            if (!this.container) return;

            // DelegaÃ§Ã£o de cliques para botÃµes e checkboxes
            this.container.addEventListener('click', (e) => {
                const el = e.target.closest('[data-action]');
                if (!el) return;

                const action = el.dataset.action;
                const id = Number(el.dataset.id);
                
                // AÃ§Ãµes de Pastas e Listas
                if (action === 'toggle-folder' || action === 'toggle-list') {
                    const node = window.Tree.findNode(this.state, id);
                    if (node) {
                        node.item.aberta = !node.item.aberta;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'add-subfolder') {
                    const depth = window.Tree.depthOf(this.state, id);
                    if (depth >= 3) return; // Limite de 3 nÃ­veis

                    const node = window.Tree.findNode(this.state, id);
                    if (node && node.type === 'pasta') {
                        node.item.pastas = node.item.pastas || [];
                        node.item.pastas.push({ id: Date.now(), nome: 'Nova pasta', aberta: true, pastas: [], listas: [] });
                        node.item.aberta = true;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'add-sublist') {
                    const node = window.Tree.findNode(this.state, id);
                    if (node && node.type === 'pasta') {
                        node.item.listas = node.item.listas || [];
                        node.item.listas.push({ id: Date.now(), titulo: 'Nova lista', aberta: true, itens: [] });
                        node.item.aberta = true;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'delete-folder') {
                    const node = window.Tree.findNode(this.state, id);
                    if (node && node.type === 'pasta') {
                        if (window.Tree.isFolderEmpty(node.item) || confirm("Excluir a pasta e tudo dentro dela?")) {
                            window.Tree.deleteNode(this.state, id);
                            this.save();
                            this.renderAndPreserveFocus();
                        }
                    }
                }
                else if (action === 'delete-list') {
                    window.Tree.deleteNode(this.state, id);
                    this.save();
                    this.renderAndPreserveFocus();
                }
                
                // AÃ§Ãµes de Itens
                else if (action === 'toggle-item') {
                    const listId = Number(el.dataset.listId);
                    const itemId = Number(el.dataset.itemId);
                    const node = window.Tree.findNode(this.state, listId);
                    if (node && node.type === 'lista') {
                        const item = node.item.itens.find(i => i.id === itemId);
                        if (item) {
                            item.feito = el.checked;
                            this.save();
                            this.renderAndPreserveFocus();
                        }
                    }
                }
                else if (action === 'delete-item') {
                    const listId = Number(el.dataset.listId);
                    const itemId = Number(el.dataset.itemId);
                    const node = window.Tree.findNode(this.state, listId);
                    if (node && node.type === 'lista') {
                        node.item.itens = node.item.itens.filter(i => i.id !== itemId);
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'move-up-item' || action === 'move-down-item') {
                    const listId = Number(el.dataset.listId);
                    const itemId = Number(el.dataset.itemId);
                    const node = window.Tree.findNode(this.state, listId);
                    if (node && node.type === 'lista') {
                        const arr = node.item.itens;
                        const idx = arr.findIndex(i => i.id === itemId);
                        if (idx !== -1) {
                            if (action === 'move-up-item' && idx > 0) {
                                [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                this.save();
                                this.renderAndPreserveFocus();
                            } else if (action === 'move-down-item' && idx < arr.length - 1) {
                                [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                                this.save();
                                this.renderAndPreserveFocus();
                            }
                        }
                    }
                }
            });

            // Enter no input de novo item
            this.container.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.dataset.action === 'add-item-input') {
                    const listId = Number(e.target.dataset.listId);
                    const texto = e.target.value.trim();
                    if (!texto) return;

                    const node = window.Tree.findNode(this.state, listId);
                    if (node && node.type === 'lista') {
                        node.item.itens = node.item.itens || [];
                        node.item.itens.push({ id: Date.now(), texto, feito: false });
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
            });

            // Duplo clique para ediÃ§Ã£o in-line (pastas, listas e itens)
            this.container.addEventListener('dblclick', (e) => {
                const el = e.target.closest('.cute-name, .cute-title, .item-text');
                if (!el) return;

                const id = Number(el.dataset.id);
                const isFolder = el.classList.contains('cute-name');
                const isList = el.classList.contains('cute-title');
                const isItem = el.classList.contains('item-text');
                
                let nodeInfo, itemObj;

                if (isItem) {
                    const listId = Number(el.dataset.listId);
                    nodeInfo = window.Tree.findNode(this.state, listId);
                    if (nodeInfo && nodeInfo.type === 'lista') {
                        itemObj = nodeInfo.item.itens.find(i => i.id === id);
                    }
                } else {
                    nodeInfo = window.Tree.findNode(this.state, id);
                }
                
                if (!nodeInfo) return;
                if (isItem && !itemObj) return;

                const currentText = isFolder ? nodeInfo.item.nome : (isList ? nodeInfo.item.titulo : itemObj.texto);
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = el.className;
                input.style.width = '100%';
                input.style.border = '1px solid var(--accent)';
                input.style.background = 'var(--surface-inner)';
                input.style.padding = '2px 5px';
                input.style.borderRadius = '4px';

                el.replaceWith(input);
                input.focus();
                input.select();

                let isSaved = false;

                const saveRename = () => {
                    if (isSaved) return;
                    isSaved = true;
                    
                    const newText = input.value.trim() || currentText;
                    if (isFolder) {
                        nodeInfo.item.nome = newText;
                    } else if (isList) {
                        nodeInfo.item.titulo = newText;
                    } else if (isItem) {
                        itemObj.texto = newText;
                    }
                    
                    this.save();
                    this.renderAndPreserveFocus();
                };

                const cancelRename = () => {
                    if (isSaved) return;
                    isSaved = true;
                    this.renderAndPreserveFocus();
                };

                input.addEventListener('blur', saveRename);
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') saveRename();
                    if (ev.key === 'Escape') cancelRename();
                });
            });
        }

        // --- RENDERIZAÃ‡ÃƒO RECURSIVA ---

        renderAll() {
            if (!this.container) return;
            
            let html = '';
            
            if (this.state.pastas) {
                this.state.pastas.forEach(p => { html += this.createFolderHTML(p, 1); });
            }
            if (this.state.listas) {
                this.state.listas.forEach(l => { html += this.createListHTML(l); });
            }
            
            this.container.innerHTML = html;
        }

        createFolderHTML(pasta, depth = 1) {
            const arrow = pasta.aberta ? 'â–¾' : 'â–¸';
            let childrenHTML = '';

            if (pasta.aberta) {
                if (pasta.pastas) {
                    pasta.pastas.forEach(p => { childrenHTML += this.createFolderHTML(p, depth + 1); });
                }
                if (pasta.listas) {
                    pasta.listas.forEach(l => { childrenHTML += this.createListHTML(l); });
                }
            }

            const btnAddFolder = depth < 3 
                ? `<button class="action-btn" data-action="add-subfolder" data-id="${pasta.id}" title="+ Subpasta">+ðŸ“</button>` 
                : '';

            return `
                <div class="cute-folder-card">
                    <div class="cute-folder-header">
                        <div class="cute-folder-title-area">
                            <span class="cute-arrow action-btn" data-action="toggle-folder" data-id="${pasta.id}">${arrow}</span>
                            <span class="cute-name" data-id="${pasta.id}" title="Duplo clique para renomear">${window.escapeHtml(pasta.nome)}</span>
                        </div>
                        <div class="cute-actions">
                            ${btnAddFolder}
                            <button class="action-btn" data-action="add-sublist" data-id="${pasta.id}" title="+ Lista">+ðŸ“‹</button>
                            <button class="action-btn text-danger" data-action="delete-folder" data-id="${pasta.id}" title="Excluir">Ã—</button>
                        </div>
                    </div>
                    ${pasta.aberta && childrenHTML ? `<div class="cute-folder-body">${childrenHTML}</div>` : ''}
                </div>
            `;
        }

        createListHTML(lista) {
            const arrow = lista.aberta ? 'â–¾' : 'â–¸';
            const itens = lista.itens || [];
            const doneCount = itens.filter(i => i.feito).length;
            const totalCount = itens.length;

            let itensHTML = '';
            itens.forEach(item => {
                itensHTML += `
                    <div class="cute-item-row">
                        <label class="cute-checkbox-label ${item.feito ? 'item-done' : ''}">
                            <input type="checkbox" data-action="toggle-item" data-list-id="${lista.id}" data-item-id="${item.id}" ${item.feito ? 'checked' : ''}>
                            <span class="item-text" data-id="${item.id}" data-list-id="${lista.id}" title="Duplo clique para renomear">${window.escapeHtml(item.texto)}</span>
                        </label>
                        <div class="item-actions">
                            <button class="action-btn" data-action="move-up-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Subir">â†‘</button>
                            <button class="action-btn" data-action="move-down-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Descer">â†“</button>
                            <button class="action-btn text-danger" data-action="delete-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Excluir">Ã—</button>
                        </div>
                    </div>
                `;
            });

            return `
                <div class="cute-list-card">
                    <div class="cute-list-header">
                        <div class="cute-list-title-area">
                            <span class="cute-arrow action-btn" data-action="toggle-list" data-id="${lista.id}">${arrow}</span>
                            <span class="cute-title" data-id="${lista.id}" title="Duplo clique para renomear">${window.escapeHtml(lista.titulo)}</span>
                        </div>
                        <div class="cute-list-meta-actions">
                            <span class="cute-counter">${doneCount}/${totalCount}</span>
                            <button class="action-btn text-danger" data-action="delete-list" data-id="${lista.id}" title="Excluir">Ã—</button>
                        </div>
                    </div>
                    ${lista.aberta ? `
                    <div class="cute-list-body">
                        <div class="cute-items-list" id="items-container-${lista.id}">
                            ${itensHTML}
                        </div>
                        <div class="new-item-row">
                            <input type="text" placeholder="Novo item... (Enter para salvar)" data-action="add-item-input" data-list-id="${lista.id}">
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    }

    new ListsManager();
});
``n

### Arquivo: .\js\notes.js
`$Lang
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
            let loadedState = window.Store.get('notes', { pastas: [], notas: [] });
            
            // MigraÃ§Ã£o: se for um array do formato antigo, converte para o formato de Ã¡rvore
            if (Array.isArray(loadedState)) {
                loadedState = {
                    pastas: [],
                    notas: loadedState.map(n => ({
                        id: n.id,
                        titulo: '',
                        texto: n.texto || '',
                        aberta: n.aberta
                    }))
                };
                window.Store.set('notes', loadedState);
            }

            this.state = loadedState;
            
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

        renderAndPreserveFocus() {
            let focusedId = null;
            let focusedType = null; // 'title' ou 'body'

            if (document.activeElement) {
                if (document.activeElement.classList.contains('note-title-input')) {
                    const block = document.activeElement.closest('.note-block');
                    if (block) { focusedId = block.dataset.id; focusedType = 'title'; }
                } else if (document.activeElement.tagName.toLowerCase() === 'textarea') {
                    const block = document.activeElement.closest('.note-block');
                    if (block) { focusedId = block.dataset.id; focusedType = 'body'; }
                }
            }

            this.renderAll();

            if (focusedId) {
                const block = document.querySelector(`.note-block[data-id="${focusedId}"]`);
                if (block) {
                    if (focusedType === 'title') {
                        const el = block.querySelector('.note-title-input');
                        if (el) el.focus();
                    } else if (focusedType === 'body') {
                        const el = block.querySelector('textarea');
                        if (el) el.focus();
                    }
                }
            }
        }

        addRootFolder() {
            this.state.pastas = this.state.pastas || [];
            this.state.pastas.push({
                id: Date.now(),
                nome: 'Nova pasta',
                aberta: true,
                pastas: [],
                notas: []
            });
            this.save();
            this.renderAndPreserveFocus();
        }

        addNote() {
            const newNote = {
                id: Date.now(),
                titulo: '',
                texto: '',
                aberta: true
            };
            
            this.state.notas = this.state.notas || [];
            this.state.notas.unshift(newNote); // Coloca no topo da raiz
            this.save();
            this.renderAndPreserveFocus();
            
            // Foca automaticamente no tÃ­tulo da nova nota
            if (this.container) {
                const newBlock = this.container.querySelector(`.note-block[data-id="${newNote.id}"]`);
                if (newBlock) {
                    const titleInput = newBlock.querySelector('.note-title-input');
                    if (titleInput) titleInput.focus();
                }
            }
        }

        bindEvents() {
            if (this.btnNew) {
                this.btnNew.addEventListener('click', () => this.addNote());
            }

            if (!this.container) return;

            // DelegaÃ§Ã£o de eventos para cliques
            this.container.addEventListener('click', (e) => {
                
                // --- AÃ‡Ã•ES DE PASTAS ---
                const actionEl = e.target.closest('[data-action]');
                if (actionEl) {
                    const action = actionEl.dataset.action;
                    const id = Number(actionEl.dataset.id);
                    
                    if (action === 'toggle-folder') {
                        const node = window.Tree.findNode(this.state, id);
                        if (node && node.type === 'pasta') {
                            node.item.aberta = !node.item.aberta;
                            this.save();
                            this.renderAndPreserveFocus();
                        }
                    }
                    else if (action === 'add-subfolder') {
                        const depth = window.Tree.depthOf(this.state, id);
                        if (depth >= 3) return; // Limite de 3 nÃ­veis
                        
                        const node = window.Tree.findNode(this.state, id);
                        if (node && node.type === 'pasta') {
                            node.item.pastas = node.item.pastas || [];
                            node.item.pastas.push({ id: Date.now(), nome: 'Nova pasta', aberta: true, pastas: [], notas: [] });
                            node.item.aberta = true;
                            this.save();
                            this.renderAndPreserveFocus();
                        }
                    }
                    else if (action === 'add-subnote') {
                        const node = window.Tree.findNode(this.state, id);
                        if (node && node.type === 'pasta') {
                            node.item.notas = node.item.notas || [];
                            node.item.notas.unshift({ id: Date.now(), titulo: '', texto: '', aberta: true });
                            node.item.aberta = true;
                            this.save();
                            this.renderAndPreserveFocus();
                        }
                    }
                    else if (action === 'delete-folder') {
                        const node = window.Tree.findNode(this.state, id);
                        if (node && node.type === 'pasta') {
                            if (window.Tree.isFolderEmpty(node.item) || confirm("Excluir a pasta e tudo dentro dela?")) {
                                window.Tree.deleteNode(this.state, id);
                                this.save();
                                this.renderAndPreserveFocus();
                            }
                        }
                    }
                    return; // Interrompe para nÃ£o processar aÃ§Ãµes de nota
                }

                // --- AÃ‡Ã•ES DE NOTAS ---
                if (e.target.closest('.note-title-input')) {
                    e.stopPropagation(); // Clicar no input do tÃ­tulo nÃ£o expande nem contrai
                    return;
                }

                const header = e.target.closest('.note-header');
                const delBtn = e.target.closest('.del-btn');
                const block = e.target.closest('.note-block');

                if (!block) return;
                
                const id = Number(block.dataset.id);

                if (delBtn) {
                    window.Tree.deleteNode(this.state, id);
                    this.save();
                    this.renderAndPreserveFocus();
                    return;
                }

                if (header) {
                    const noteNode = window.Tree.findNode(this.state, id);
                    if (noteNode && noteNode.type === 'nota') {
                        const note = noteNode.item;
                        note.aberta = !note.aberta;
                        this.save();
                        
                        // Atualiza as classes direto no DOM para nÃ£o recriar os elementos (evita perda de foco em cliques rÃ¡pidos)
                        const body = block.querySelector('.note-body');
                        const toggleBtn = block.querySelector('.toggle-btn');
                        const input = block.querySelector('.note-title-input');
                        const preview = block.querySelector('.note-preview');
                        
                        if (body) body.style.display = note.aberta ? 'flex' : 'none';
                        if (toggleBtn) toggleBtn.textContent = note.aberta ? 'â–¾' : 'â–¸';
                        
                        if (note.aberta) {
                            input.classList.remove('hidden');
                            preview.classList.add('hidden');
                        } else {
                            input.classList.add('hidden');
                            preview.classList.remove('hidden');
                            
                            // Define o preview atualizado
                            let previewText = '(sem tÃ­tulo)';
                            if (note.titulo && note.titulo.trim()) {
                                previewText = note.titulo;
                                preview.style.fontStyle = 'normal';
                                preview.style.opacity = '1';
                            } else if (note.texto && note.texto.trim()) {
                                previewText = note.texto.trim().split('\n')[0];
                                preview.style.fontStyle = 'italic';
                                preview.style.opacity = '0.7';
                            } else {
                                preview.style.fontStyle = 'normal';
                                preview.style.opacity = '1';
                            }
                            preview.textContent = previewText;
                        }
                    }
                }

                // AÃ§Ãµes da Toolbar
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
                        let html = window.escapeHtml(ta.value);
                        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
                        html = html.replace(/\n/g, '<br>');
                        
                        view.innerHTML = html;
                        view.classList.remove('hidden');
                        ta.classList.add('hidden');
                        btnView.textContent = 'Editar';
                    } else {
                        view.classList.add('hidden');
                        ta.classList.remove('hidden');
                        btnView.textContent = 'Ver';
                        ta.focus();
                    }
                }
            });

            // Renomear pasta (duplo clique)
            this.container.addEventListener('dblclick', (e) => {
                const el = e.target.closest('.cute-name');
                if (!el) return;

                const id = Number(el.dataset.id);
                const nodeInfo = window.Tree.findNode(this.state, id);
                
                if (!nodeInfo || nodeInfo.type !== 'pasta') return;

                const currentText = nodeInfo.item.nome;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = el.className;
                input.style.width = '100%';
                input.style.border = '1px solid var(--accent)';
                input.style.background = 'var(--surface-inner)';
                input.style.padding = '2px 5px';
                input.style.borderRadius = '4px';

                el.replaceWith(input);
                input.focus();
                input.select();

                let isSaved = false;

                const saveRename = () => {
                    if (isSaved) return;
                    isSaved = true;
                    nodeInfo.item.nome = input.value.trim() || currentText;
                    this.save();
                    this.renderAndPreserveFocus();
                };

                const cancelRename = () => {
                    if (isSaved) return;
                    isSaved = true;
                    this.renderAndPreserveFocus();
                };

                input.addEventListener('blur', saveRename);
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') saveRename();
                    if (ev.key === 'Escape') cancelRename();
                });
            });

            // DelegaÃ§Ã£o de eventos para digitaÃ§Ã£o (Sem redesenhar tudo!)
            this.container.addEventListener('input', (e) => {
                const block = e.target.closest('.note-block');
                if (!block) return;
                
                const id = Number(block.dataset.id);
                const noteNode = window.Tree.findNode(this.state, id);
                
                if (noteNode && noteNode.type === 'nota') {
                    if (e.target.classList.contains('note-title-input')) {
                        noteNode.item.titulo = e.target.value;
                        this.debouncedSave();
                    }
                    else if (e.target.tagName.toLowerCase() === 'textarea') {
                        noteNode.item.texto = e.target.value;
                        this.debouncedSave();
                    }
                }
            });

            // Atalhos de teclado no textarea
            this.container.addEventListener('keydown', (e) => {
                if (e.target.tagName.toLowerCase() !== 'textarea') return;
                const ta = e.target;

                if (e.ctrlKey && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    this.applyFormatting(ta, '**');
                }
                else if (e.ctrlKey && e.key.toLowerCase() === 'i') {
                    e.preventDefault();
                    this.applyFormatting(ta, '*');
                }
                else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.handleTab(ta, e.shiftKey);
                }
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
                if (bulletMatch[2].trim() === '') {
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
                return false;
            }
            
            ta.value = val.substring(0, start) + insertStr + val.substring(ta.selectionEnd);
            ta.selectionStart = ta.selectionEnd = start + insertStr.length;
            this.triggerInput(ta);
            return true;
        }

        triggerInput(ta) {
            ta.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // --- RENDERIZAÃ‡ÃƒO RECURSIVA ---

        renderAll() {
            if (!this.container) return;
            
            let html = '';
            
            if (this.state.pastas) {
                this.state.pastas.forEach(p => { html += this.createFolderHTML(p, 1); });
            }
            if (this.state.notas) {
                this.state.notas.forEach(n => { html += this.createNoteHTML(n); });
            }
            
            this.container.innerHTML = html;
        }

        createFolderHTML(pasta, depth = 1) {
            const arrow = pasta.aberta ? 'â–¾' : 'â–¸';
            let childrenHTML = '';

            if (pasta.aberta) {
                if (pasta.pastas) {
                    pasta.pastas.forEach(p => { childrenHTML += this.createFolderHTML(p, depth + 1); });
                }
                if (pasta.notas) {
                    pasta.notas.forEach(n => { childrenHTML += this.createNoteHTML(n); });
                }
            }

            const btnAddFolder = depth < 3 
                ? `<button class="action-btn" data-action="add-subfolder" data-id="${pasta.id}" title="+ Subpasta">+ðŸ“</button>` 
                : '';

            return `
                <div class="cute-folder-card">
                    <div class="cute-folder-header">
                        <div class="cute-folder-title-area">
                            <span class="cute-arrow action-btn" data-action="toggle-folder" data-id="${pasta.id}">${arrow}</span>
                            <span class="cute-name" data-id="${pasta.id}" title="Duplo clique para renomear">${window.escapeHtml(pasta.nome)}</span>
                        </div>
                        <div class="cute-actions">
                            ${btnAddFolder}
                            <button class="action-btn" data-action="add-subnote" data-id="${pasta.id}" title="+ Nota">+ðŸ“</button>
                            <button class="action-btn text-danger" data-action="delete-folder" data-id="${pasta.id}" title="Excluir">Ã—</button>
                        </div>
                    </div>
                    ${pasta.aberta && childrenHTML ? `<div class="cute-folder-body">${childrenHTML}</div>` : ''}
                </div>
            `;
        }

        createNoteHTML(note) {
            const toggleIcon = note.aberta ? 'â–¾' : 'â–¸';
            const bodyStyle = note.aberta ? 'display: flex;' : 'display: none;';
            
            let previewText = '(sem tÃ­tulo)';
            let isItalic = false;
            
            if (note.titulo && note.titulo.trim()) {
                previewText = note.titulo;
            } else if (note.texto && note.texto.trim()) {
                previewText = note.texto.trim().split('\n')[0];
                isItalic = true;
            }

            const previewStyle = isItalic ? 'font-style: italic; opacity: 0.7;' : 'font-style: normal; opacity: 1;';

            return `
                <div class="note-block" data-id="${note.id}">
                    <div class="note-header" title="Clique para expandir/contrair">
                        <input type="text" class="note-title-input ${note.aberta ? '' : 'hidden'}" placeholder="TÃ­tulo" value="${window.escapeHtml(note.titulo || '')}">
                        <span class="note-preview ${note.aberta ? 'hidden' : ''}" style="${previewStyle}">${window.escapeHtml(previewText || '(sem tÃ­tulo)')}</span>
                        <div class="note-actions">
                            <button class="action-btn toggle-btn">${toggleIcon}</button>
                            <button class="action-btn text-danger del-btn" title="Excluir">Ã—</button>
                        </div>
                    </div>
                    <div class="note-body" style="${bodyStyle}">
                        <div class="note-toolbar">
                            <button class="action-btn btn-bold" title="Negrito (Ctrl+B)">N</button>
                            <button class="action-btn btn-italic" title="ItÃ¡lico (Ctrl+I)">I</button>
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
``n

### Arquivo: .\js\pomodoro.js
`$Lang
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

            this.updateBtnClasses();
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

        updateBtnClasses() {
            if (!this.btnMain) return;
            if (this.isRunning) {
                this.btnMain.className = "btn-main bg-dim text-muted border-dim";
            } else {
                this.btnMain.className = "btn-main bg-accent text-on-accent";
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
                this.updateBtnClasses();
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
                this.updateBtnClasses();
            }
        }

        resetTimer() {
            this.pause();
            
            const minutes = this.mode === 'focus' 
                ? (parseInt(this.inputFocus ? this.inputFocus.value : 25) || 25)
                : (parseInt(this.inputRest ? this.inputRest.value : 5) || 5);
                
            this.totalTime = minutes * 60;
            this.timeLeft = this.totalTime;
            
            if (this.elProgMain && this.svgLength) {
                this.elProgMain.style.transition = 'none';
                this.elProgMain.style.strokeDashoffset = '0';
                void this.elProgMain.getBoundingClientRect(); // ForÃ§a reflow
                this.elProgMain.style.transition = '';
            }

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

                if (this.elProgMain && this.svgLength) {
                    this.elProgMain.style.transition = 'none';
                    this.elProgMain.style.strokeDashoffset = '0';
                    void this.elProgMain.getBoundingClientRect(); // ForÃ§a reflow
                    this.elProgMain.style.transition = '';
                }
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
                this.elProgLinear.style.width = ((1 - progress) * 100) + '%';
                this.elProgLinear.style.backgroundColor = colorVar;
            }

            if (this.elProgMain && this.svgLength) {
                const offset = progress * this.svgLength;
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
``n

### Arquivo: .\js\settings.js
`$Lang
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
                        alert("Arquivo invÃ¡lido.");
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
                    alert("Arquivo invÃ¡lido.");
                }
                this.inputFile.value = ''; // Limpa o input file
            };
            reader.readAsText(file);
        }

        wipeData() {
            if (confirm("Tem certeza que deseja apagar TODOS os seus dados?")) {
                if (confirm("Aviso final: Essa aÃ§Ã£o Ã© irreversÃ­vel e apagarÃ¡ listas, notas e timers. Deseja mesmo continuar?")) {
                    localStorage.clear();
                    location.reload();
                }
            }
        }
    }

    window.settingsManager = new SettingsManager();
});
``n

### Arquivo: .\js\sidebar.js
`$Lang
document.addEventListener('DOMContentLoaded', () => {

    // 1. FunÃ§Ã£o global de toggle (exposta no window para o HTML acessar)
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

            // LÃ³gica das Ã¡reas de gatilho para abrir ao passar o mouse (hover invisÃ­vel e hover na aba handle)
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
            // Salva a nota da direita a cada digitaÃ§Ã£o
            const rightTextArea = document.getElementById('notes-area-right');
            if (rightTextArea) {
                rightTextArea.addEventListener('input', (e) => {
                    window.Store.set('userNotesRight', e.target.value);
                });
            }
        }
    }

    // Instancia e expÃµe no window
    window.sidebarManager = new SidebarManager();
});
``n

### Arquivo: .\js\themes.js
`$Lang
document.addEventListener('DOMContentLoaded', () => {

    class ThemeManager {
        constructor() {
            this.themes = [
                { id: 'gruvbox-light', name: 'Gruvbox Claro' },
                { id: 'gruvbox-dark', name: 'Gruvbox Escuro' },
                { id: 'dracula', name: 'Dracula' },
                { id: 'nord', name: 'Nord' },
                { id: 'solarized-light', name: 'Solarized Claro' },
                { id: 'solarized-dark', name: 'Solarized Escuro' },
                { id: 'monokai', name: 'Monokai' },
                { id: 'monokai-orange', name: 'Monokai Laranja' },
                { id: 'catppuccin-mocha', name: 'Catppuccin Mocha' },
                { id: 'catppuccin-latte', name: 'Catppuccin Latte' },
                { id: 'tokyo-night', name: 'Tokyo Night' },
                { id: 'one-dark', name: 'One Dark' },
                { id: 'one-light', name: 'One Light' },
                { id: 'rose-pine', name: 'RosÃ© Pine' },
                { id: 'everforest', name: 'Everforest Escuro' },
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
``n

### Arquivo: .\js\timer.js
`$Lang
document.addEventListener('DOMContentLoaded', () => {

    class TimerQueue {
        constructor() {
            this.state = window.Store.get('timerTabsSystem', {
                activeId: 'tab-default',
                tabs: [{
                    id: 'tab-default',
                    name: 'My List',
                    tasks: []
                }]
            });

            this.isRunning = false;
            this.timerInterval = null;

            this.els = {
                queueBtn: document.getElementById('global-queue-btn'),
                resetBtn: document.getElementById('global-reset-btn'),
                clearBtn: document.getElementById('global-clear-btn'),
                addBtn: document.getElementById('btn-add-task'),
                addDividerBtn: document.getElementById('btn-add-divider'), // Novo botÃ£o
                addTabBtn: document.getElementById('btn-add-tab'),
                queueList: document.getElementById('timer-queue-list'),
                tabsScrollArea: document.getElementById('tabs-scroll-area')
            };

            window.taskQueue = this;

            this.bindEvents();
            this.setupScroll();
            this.initDrag();
            this.renderTabs();
            this.renderTasks();
            this.updateGlobalBtn();
            this.startTick();
        }

        save() {
            window.Store.set('timerTabsSystem', this.state);
        }

        getActiveTab() {
            return this.state.tabs.find(t => t.id === this.state.activeId);
        }

        bindEvents() {
            if (this.els.queueBtn) this.els.queueBtn.addEventListener('click', () => this.toggleQueue());
            if (this.els.resetBtn) this.els.resetBtn.addEventListener('click', () => this.resetTasks());
            if (this.els.clearBtn) this.els.clearBtn.addEventListener('click', () => this.clearTasks());
            if (this.els.addBtn) this.els.addBtn.addEventListener('click', () => this.addTask());
            if (this.els.addTabBtn) this.els.addTabBtn.addEventListener('click', () => this.addTab());
            if (this.els.addDividerBtn) this.els.addDividerBtn.addEventListener('click', () => this.addDivider());

            if (this.els.tabsScrollArea) {
                this.els.tabsScrollArea.addEventListener('dblclick', (e) => {
                    const tabEl = e.target.closest('.timer-tab');
                    if (!tabEl || tabEl.classList.contains('editing')) return;

                    const tabId = tabEl.dataset.id;
                    const tab = this.state.tabs.find(t => t.id === tabId);
                    if (!tab) return;

                    tabEl.classList.add('editing');
                    const nameDiv = tabEl.querySelector('.tab-name-input');
                    const currentName = tab.name;

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'tab-name-input';
                    input.value = currentName;

                    nameDiv.replaceWith(input);
                    input.focus();
                    input.select();

                    const finishEdit = (save) => {
                        if (!tabEl.classList.contains('editing')) return;
                        tabEl.classList.remove('editing');
                        if (save) {
                            tab.name = input.value.trim() || currentName;
                            this.save();
                        }
                        this.renderTabs();
                    };

                    input.addEventListener('blur', () => finishEdit(true));
                    input.addEventListener('keydown', (ev) => {
                        ev.stopPropagation(); 
                        if (ev.key === 'Enter') finishEdit(true);
                        if (ev.key === 'Escape') finishEdit(false);
                    });
                    input.addEventListener('mousedown', (ev) => ev.stopPropagation());
                    input.addEventListener('click', (ev) => ev.stopPropagation());
                });
            }
        }

        setupScroll() {
            const slider = this.els.tabsScrollArea;
            if (!slider) return;
            
            let isDown = false;
            let startX;
            let scrollLeft;

            slider.addEventListener('mousedown', (e) => {
                isDown = true;
                slider.classList.add('active');
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });
            slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('active'); });
            slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('active'); });
            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 2; 
                slider.scrollLeft = scrollLeft - walk;
            });
        }

        initDrag() {
            const list = this.els.queueList;
            if (!list) return;

            let dragIndex = null;

            list.addEventListener('mousedown', (e) => {
                const handle = e.target.closest('.drag-handle');
                if (!handle) return;
                const item = handle.closest('.task-item, .task-divider');
                if (item) item.draggable = true;
            });

            list.addEventListener('dragstart', (e) => {
                const item = e.target.closest('.task-item, .task-divider');
                if (!item) return;
                dragIndex = Number(item.dataset.index);
                item.classList.add('dragging');
            });

            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                const item = e.target.closest('.task-item, .task-divider');
                list.querySelectorAll('.task-item, .task-divider').forEach(el => el.classList.remove('drag-over'));
                if (item) item.classList.add('drag-over');
            });

            list.addEventListener('dragend', (e) => {
                list.querySelectorAll('.task-item, .task-divider').forEach(el => {
                    el.classList.remove('dragging', 'drag-over');
                    el.draggable = false;
                });
                dragIndex = null;
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();
                const item = e.target.closest('.task-item, .task-divider');
                if (dragIndex === null || !item) return;
                
                const toIndex = Number(item.dataset.index);
                if (dragIndex === toIndex) return;

                const tab = this.getActiveTab();
                if (!tab) return;

                const tasks = tab.tasks;
                const [mov] = tasks.splice(dragIndex, 1);
                tasks.splice(toIndex, 0, mov);
                
                this.save();
                this.renderTasks();
            });
        }

        toggleQueue() {
            const tab = this.getActiveTab();
            // SÃ³ inicia se houver tasks vÃ¡lidas (nÃ£o apenas divisÃ³rias) com tempo restante
            if (!tab || !tab.tasks.some(t => !t.divider && t.remainingSecs > 0)) return;
            
            this.isRunning = !this.isRunning;
            this.updateGlobalBtn();
        }

        updateGlobalBtn() {
            const btn = this.els.queueBtn;
            if (!btn) return;

            if (this.isRunning) {
                btn.className = "action-btn-large bg-success text-on-accent";
                btn.textContent = "â¸ RUNNING";
            } else {
                btn.className = "action-btn-large bg-dim text-muted border-dim";
                btn.textContent = "â–¶ PAUSED";
            }
        }

        resetTasks() {
            const tab = this.getActiveTab();
            if (tab) {
                tab.tasks.forEach(t => t.remainingSecs = t.totalSecs);
                this.isRunning = false;
                this.save();
                this.updateGlobalBtn();
                this.renderTasks();
            }
        }

        clearTasks() {
            if (confirm("Apagar todas as tasks desta lista?")) {
                const tab = this.getActiveTab();
                if (tab) {
                    tab.tasks = [];
                    this.isRunning = false;
                    this.save();
                    this.updateGlobalBtn();
                    this.renderTasks();
                }
            }
        }

        startTick() {
            if (this.timerInterval) clearInterval(this.timerInterval);
            
            this.timerInterval = setInterval(() => {
                if (!this.isRunning) return;

                const tab = this.getActiveTab();
                // Pausa se nÃ£o houver fila ou sÃ³ existirem divisÃ³rias
                if (!tab || !tab.tasks.some(t => !t.divider)) {
                    this.isRunning = false;
                    this.updateGlobalBtn();
                    return;
                }

                // Acha a primeira task real (nÃ£o-divisÃ³ria) que tenha tempo restante
                const task = tab.tasks.find(t => t.remainingSecs > 0 && !t.divider);
                if (!task) {
                    this.isRunning = false;
                    this.updateGlobalBtn();
                    return;
                }

                task.remainingSecs--;
                this.save();
                this.updateItemUI(task);

                if (task.remainingSecs <= 0) {
                    if (window.playNotificationSound) window.playNotificationSound();
                    this.renderTasks(); 
                }
            }, 1000);
        }

        updateItemUI(task) {
            const el = document.getElementById(task.id);
            if (!el) return;

            const timerEl = el.querySelector('.task-timer');
            const fillEl = el.querySelector('.task-bar-fill');
            
            if (!timerEl || !fillEl) return;

            timerEl.textContent = this.formatTime(task.remainingSecs);
            const percent = task.totalSecs > 0 ? (task.remainingSecs / task.totalSecs) * 100 : 0;
            fillEl.style.width = percent + '%';
        }

        addTab() {
            const id = 'tab-' + Date.now();
            this.state.tabs.push({ id, name: 'Nova Lista', tasks: [] });
            this.switchTab(id);
        }

        switchTab(id) {
            if (this.state.activeId === id) return;
            this.state.activeId = id;
            this.isRunning = false;
            this.save();
            this.updateGlobalBtn();
            this.renderTabs();
            this.renderTasks();
        }

        deleteTab(id) {
            if (confirm("Excluir esta lista?")) {
                this.state.tabs = this.state.tabs.filter(t => t.id !== id);
                
                if (this.state.activeId === id) {
                    this.state.activeId = this.state.tabs.length > 0 ? this.state.tabs[0].id : null;
                }
                
                if (this.state.tabs.length === 0) {
                    const newId = 'tab-' + Date.now();
                    this.state.tabs.push({ id: newId, name: 'My List', tasks: [] });
                    this.state.activeId = newId;
                }
                
                this.isRunning = false;
                this.save();
                this.updateGlobalBtn();
                this.renderTabs();
                this.renderTasks();
            }
        }

        renderTabs() {
            const area = this.els.tabsScrollArea;
            if (!area) return;
            area.innerHTML = '';

            this.state.tabs.forEach(tab => {
                const isActive = tab.id === this.state.activeId;
                const div = document.createElement('div');
                div.className = `timer-tab ${isActive ? 'active' : ''}`;
                div.dataset.id = tab.id;
                div.onclick = () => window.taskQueue.switchTab(tab.id);
                
                div.innerHTML = `
                    <div class="tab-name-input">${window.escapeHtml(tab.name)}</div>
                    <button class="tab-close-btn" onclick="event.stopPropagation(); window.taskQueue.deleteTab('${tab.id}')">&times;</button>
                `;
                area.appendChild(div);
            });
        }

        addTask() {
            const tab = this.getActiveTab();
            if (!tab) return;

            const nameInput = document.getElementById('task-name');
            const hInput = document.getElementById('task-h');
            const mInput = document.getElementById('task-m');
            const sInput = document.getElementById('task-s');
            const colorInput = document.getElementById('task-color');

            const name = nameInput.value.trim() || 'Task';
            const h = parseInt(hInput.value) || 0;
            const m = parseInt(mInput.value) || 0;
            const s = parseInt(sInput.value) || 0;
            
            const totalSecs = (h * 3600) + (m * 60) + s;
            if (totalSecs <= 0) return; 

            tab.tasks.push({
                id: 'task-' + Date.now(),
                name: name,
                totalSecs: totalSecs,
                remainingSecs: totalSecs,
                color: colorInput.value || '#458588'
            });

            this.save();
            this.renderTasks();

            nameInput.value = '';
            hInput.value = '';
            mInput.value = '';
            sInput.value = '';
        }

        addDivider() {
            const tab = this.getActiveTab();
            if (!tab) return;

            tab.tasks.push({
                id: 'task-' + Date.now(),
                divider: true,
                totalSecs: 0,
                remainingSecs: 0
            });

            this.save();
            this.renderTasks();
        }

        deleteTask(taskId) {
            const tab = this.getActiveTab();
            if (tab) {
                tab.tasks = tab.tasks.filter(t => t.id !== taskId);
                this.save();
                this.renderTasks();
            }
        }

        startEdit(id) {
            const tab = this.getActiveTab();
            if (!tab) return;
            
            const t = tab.tasks.find(x => x.id === id);
            const el = document.getElementById(id);
            if (!t || !el || t.divider) return; // NÃ£o edita divisÃ³ria

            el.innerHTML = `
                <div class="task-edit-form">
                    <input type="text" class="edit-name">
                    <input type="number" class="edit-h" min="0" placeholder="hh">
                    <input type="number" class="edit-m" min="0" placeholder="min">
                    <input type="number" class="edit-s" min="0" placeholder="ss">
                    <input type="color" class="edit-color">
                    <button class="edit-save">Salvar</button>
                    <button class="edit-cancel">Cancelar</button>
                </div>
            `;

            const inName = el.querySelector('.edit-name');
            const inH = el.querySelector('.edit-h');
            const inM = el.querySelector('.edit-m');
            const inS = el.querySelector('.edit-s');
            const inColor = el.querySelector('.edit-color');
            const btnSave = el.querySelector('.edit-save');
            const btnCancel = el.querySelector('.edit-cancel');

            inName.value = t.name;
            inH.value = Math.floor(t.totalSecs / 3600);
            inM.value = Math.floor((t.totalSecs % 3600) / 60);
            inS.value = t.totalSecs % 60;
            inColor.value = t.color;

            const cancelEdit = () => {
                this.renderTasks(); 
            };
            
            const saveEdit = () => {
                const nome = inName.value.trim() || 'Task';
                const h = parseInt(inH.value) || 0;
                const m = parseInt(inM.value) || 0;
                const s = parseInt(inS.value) || 0;
                const totalSecs = (h * 3600) + (m * 60) + s;
                
                if (totalSecs <= 0) return;

                t.name = nome;
                t.color = inColor.value;

                if (totalSecs !== t.totalSecs) {
                    t.totalSecs = totalSecs;
                    t.remainingSecs = totalSecs;
                }

                this.save();
                this.renderTasks(); 
            };

            btnCancel.addEventListener('click', cancelEdit);
            btnSave.addEventListener('click', saveEdit);
            
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') cancelEdit();
                if (e.key === 'Enter' && e.target === inName) saveEdit();
            });

            inName.focus();
        }

        renderTasks() {
            const list = this.els.queueList;
            if (!list) return;
            list.innerHTML = '';
            
            const tab = this.getActiveTab();
            if (!tab || tab.tasks.length === 0) {
                list.innerHTML = '<div class="empty-list">No tasks here. Add one above!</div>';
                return;
            }

            tab.tasks.forEach((task, idx) => {
                const div = document.createElement('div');
                div.id = task.id;
                div.dataset.index = idx;
                
                if (task.divider) {
                    div.className = 'task-divider';
                    div.innerHTML = `<span class="drag-handle" title="Arrastar">â‹®â‹®</span><hr><button class="btn-del-task" onclick="window.taskQueue.deleteTask('${task.id}')">Ã—</button>`;
                    list.appendChild(div);
                    return; // Pula o resto da lÃ³gica para divisÃ³rias
                }

                const isFinished = task.remainingSecs <= 0;
                const percent = task.totalSecs > 0 ? (task.remainingSecs / task.totalSecs) * 100 : 0;
                
                div.className = `task-item ${isFinished ? '' : 'active'}`;
                if (isFinished) div.style.opacity = '0.5';
                
                div.innerHTML = `
                    <div class="task-bar-bg">
                        <div class="task-bar-fill" style="width: ${percent}%; background-color: ${window.escapeHtml(task.color)}"></div>
                    </div>
                    <div class="task-info">
                        <span class="drag-handle" title="Arrastar">â‹®â‹®</span>
                        <span class="task-name">${window.escapeHtml(task.name)}</span>
                        <div style="display:flex; align-items:center; gap:5px; z-index:10;">
                            <span class="task-timer" style="font-weight:bold; font-size:1.1rem;">${this.formatTime(task.remainingSecs)}</span>
                            <span class="task-total-time">/ ${this.formatTime(task.totalSecs)}</span>
                            <button class="btn-edit-task action-btn" onclick="window.taskQueue.startEdit('${task.id}')" title="Editar">âœŽ</button>
                            <button class="btn-del-task text-danger" onclick="window.taskQueue.deleteTask('${task.id}')" title="Excluir">Ã—</button>
                        </div>
                    </div>
                `;
                list.appendChild(div);
            });
        }

        formatTime(totalSeconds) {
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            if (h > 0) return `${window.pad(h)}:${window.pad(m)}:${window.pad(s)}`;
            return `${window.pad(m)}:${window.pad(s)}`;
        }
    }

    new TimerQueue();
});
``n

### Arquivo: .\js\utils.js
`$Lang
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. FunÃ§Ã£o de padding
    const pad = (n) => String(n).padStart(2, '0');

    // 2. ManipulaÃ§Ã£o do LocalStorage
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

    // 4. Som de notificaÃ§Ã£o (Web Audio API)
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

    // 5. FunÃ§Ãµes de Ãrvore (Pastas, Listas e Notas)
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

    // Expondo as funÃ§Ãµes globalmente para os outros arquivos
    window.pad = pad;
    window.Store = Store;
    window.escapeHtml = escapeHtml;
    window.playNotificationSound = playNotificationSound;
    window.Tree = Tree;
});
``n

### Arquivo: .\js\views.js
`$Lang
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

            // Controla a visibilidade das pÃ¡ginas
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

            // Atualiza o estado dos botÃµes da barra de navegaÃ§Ã£o
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
            this.dias = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÃB.'];

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

            // Calcula os milissegundos restantes atÃ© o prÃ³ximo segundo exato
            const delay = 1000 - (Date.now() % 1000);
            setTimeout(this.updateClock, delay);
        }
    }

    // Instancia e expÃµe no window para acesso pelo HTML
    window.viewManager = new ViewManager();
    window.clockWidget = new ClockWidget();

});
``n

### Arquivo: .\index.html
`$Lang
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focus Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="trigger-area left"></div>
    <div class="trigger-area right"></div>

    <aside class="sidebar left" id="sb-left">
        <div class="sidebar-header" style="display: flex; gap: 5px; align-items: center;">
            <button class="sb-tab-btn active" data-tab="notas" onclick="sidebarManager.switchTab('notas')">Notas</button>
            <button class="sb-tab-btn" data-tab="listas" onclick="sidebarManager.switchTab('listas')">Listas</button>
        </div>
        <div class="sidebar-content-area">
            <div id="sb-tab-notas" class="sb-tab-pane">
                <div class="notes-top-bar">
                    <button id="btn-new-note" class="action-btn-large bg-accent text-on-accent" style="flex: 1; cursor: pointer;">+ ðŸ“ Nota</button>
                    <button onclick="window.notesManager.addRootFolder()" class="action-btn-large bg-dim text-muted border-dim" style="flex: 1; cursor: pointer;">+ ðŸ“ Pasta</button>
                </div>
                <div id="notes-container" class="notes-container"></div>
            </div>
            <div id="sb-tab-listas" class="sb-tab-pane hidden">
                <div class="lists-top-bar">
                    <button onclick="window.listsManager.addRootFolder()" class="action-btn-large bg-accent text-on-accent" style="flex:1; cursor: pointer;">+ ðŸ“ Pasta</button>
                    <button onclick="window.listsManager.addRootList()" class="action-btn-large bg-dim text-muted border-dim" style="flex:1; cursor: pointer;">+ ðŸ“‹ Lista</button>
                </div>
                <div id="lists-container" class="lists-container"></div>
            </div>
        </div>
        <button class="sidebar-handle" aria-label="Abrir ou fechar" onclick="toggleSidebar('left')"></button>
    </aside>

    <aside class="sidebar right" id="sb-right">
        <div class="sidebar-header">
            <h3>Quick Notes (Right)</h3>
        </div>
        <div class="sidebar-scroll-content right-content-padding">
            <textarea id="notes-area-right" placeholder="Type here..." style="text-align: right;"></textarea>
        </div>
        <button class="sidebar-handle" aria-label="Abrir ou fechar" onclick="toggleSidebar('right')"></button>
    </aside>

    <header id="top-dock">
        <button class="mob-dock-btn" onclick="sidebarManager.toggle()">â˜°</button>
        
        <div id="dock-clock">
            <span id="clock-date"></span>
            <span id="clock-time"></span>
        </div>
        
        <nav class="dock-nav">
            <button class="nav-btn" data-view="pomodoro" onclick="viewManager.switch('pomodoro')">Pomodoro</button>
            <button class="nav-btn" data-view="timer" onclick="viewManager.switch('timer')">Timer</button>
        </nav>

        <div class="dock-actions">
            <button id="btn-theme-toggle" class="top-bar-btn" title="Tema">ðŸŽ¨</button>
            <button id="btn-settings" class="top-bar-btn" title="ConfiguraÃ§Ãµes">âš™ï¸</button>
        </div>

        <button class="mob-dock-btn" onclick="toggleSidebar('right')">â˜°</button>
    </header>

    <div class="container">
        <div class="spacer"></div>

        <div id="view-pomodoro" class="view-section hidden">
            <section id="pomodoro-main" class="card">
                <button id="btn-pomo-edit" class="edit-pomo-btn" title="Toggle Note">âœŽ</button>
                <div class="pomo-inner-container">
                    <div class="timer-wrapper">
                        <svg class="timer-svg">
                            <rect x="5" y="5" width="200" height="200" rx="40" ry="40" class="bg-border"></rect>
                            <rect x="5" y="5" width="200" height="200" rx="40" ry="40" class="progress-border" id="progresso-main"></rect>
                        </svg>
                        <div class="timer-content">
                            <h1 id="time-main">25:00</h1>
                            <div class="timer-controls">
                                <button id="btn-main" class="btn-main bg-accent text-on-accent">START</button>
                                <button id="btn-reset-main" class="btn-reset">â†»</button>
                            </div>
                            <div id="status-main">FOCUS</div>
                        </div>
                    </div>
                    <div class="pomo-note-wrapper">
                        <textarea id="pomo-side-note" placeholder="Task details..."></textarea>
                    </div>
                </div>

                <div class="pomodoro-presets-row" style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                    <button id="btn-preset-25-5" class="action-btn" onclick="window.pomodoro.applyPreset(25, 5)">25:5</button>
                    <button id="btn-preset-50-10" class="action-btn" onclick="window.pomodoro.applyPreset(50, 10)">50:10</button>
                </div>

                <div class="manual-inputs-bottom">
                    <div class="input-group">
                        <label>Focus (min)</label>
                        <input type="number" id="manual-focus-time" value="25" min="1">
                    </div>
                    <div class="input-group">
                        <label>Rest (min)</label>
                        <input type="number" id="manual-rest-time" value="5" min="1">
                    </div>
                </div>

                <div class="linear-wrapper">
                    <div class="linear-info">
                        <span id="mini-time">25:00</span>
                        <span id="mini-status">FOCUS</span>
                    </div>
                    <div class="linear-track">
                        <div class="linear-fill" id="progresso-linear"></div>
                    </div>
                </div>
            </section>
        </div>

        <div id="view-timer" class="view-section hidden">
            <section class="card full-height-card">
                <div class="card-header-row">
                    <h4 class="card-title">TASK QUEUE</h4>
                    <div class="queue-controls">
                        <button id="global-queue-btn" class="action-btn-large bg-dim text-muted border-dim">â–¶ PAUSED</button>
                        <button id="global-reset-btn" class="btn-reset">â†»</button>
                        <button id="global-clear-btn" class="btn-reset text-danger" title="Clear List">ðŸ—‘ï¸</button>
                    </div>
                </div>
                <div class="task-input-row">
                    <input type="text" id="task-name" placeholder="Task Name" class="input-main">
                    <div class="time-inputs">
                        <input type="number" id="task-h" placeholder="hh" min="0"><span>:</span>
                        <input type="number" id="task-m" placeholder="min" min="0"><span>:</span>
                        <input type="number" id="task-s" placeholder="ss" min="0">
                    </div>
                    <input type="color" id="task-color" value="#458588" title="Color">
                    <button id="btn-add-task" class="action-btn-large bg-accent text-on-accent">+</button>
                    <button id="btn-add-divider" class="action-btn-large bg-dim text-muted border-dim" title="Adicionar divisÃ³ria">â€”</button>
                </div>
                <div id="timer-queue-list"></div>
                <div id="tab-bar-footer">
                    <div id="tabs-scroll-area"></div>
                    <button id="btn-add-tab" title="New List">+</button>
                </div>
            </section>
        </div>

        <footer><p>chewwallwa 2026</p></footer>
    </div>

    <div id="settings-overlay" class="hidden">
        <div class="settings-modal">
            <div class="settings-header">
                <h2>âš™ï¸ ConfiguraÃ§Ãµes</h2>
                <button class="close-btn" id="btn-close-settings">&times;</button>
            </div>
            <div class="settings-body">
                <h3>ðŸ’¾ Dados</h3>
                <div class="cloud-buttons-row" style="flex-direction: column; gap: 8px;">
                    <button id="btn-download-backup" class="action-btn" style="width: 100%; padding: 10px; font-weight: bold;">Baixar backup</button>
                    <button id="btn-import-backup" class="action-btn" style="width: 100%; padding: 10px; font-weight: bold;">Importar backup</button>
                    <input type="file" id="input-file-backup" accept=".json" class="hidden">
                    <button id="btn-wipe-data" class="action-btn text-danger border-dim" style="width: 100%; padding: 10px; font-weight: bold;">Apagar todos os dados</button>
                </div>
            </div>
        </div>
    </div>

    <script src="js/utils.js"></script>
    <script src="js/views.js"></script>
    <script src="js/pomodoro.js"></script>
    <script src="js/timer.js"></script>
    <script src="js/notes.js"></script>
    <script src="js/sidebar.js"></script>
    <script src="js/lists.js"></script>
    <script src="js/settings.js"></script>
    <script src="js/themes.js"></script>
</body>
</html>
``n

### Arquivo: .\style.css
`$Lang
:root {
    --bg: #F2E5BC; 
    --surface: #d3c594; 
    --surface-inner: color-mix(in srgb, var(--text) 5%, transparent);
    --border: color-mix(in srgb, var(--text) 10%, transparent);
    --text: #000000; 
    --text-muted: #524d4d;
    --accent: #458588; 
    --accent-text: #f2e5bc; 
    --danger: #cc241d; 
    --success: #98971a;
    --clock-text: #000000;

    --dim-border: var(--border);
    --dim-bg: var(--surface-inner);
    --dim-card: color-mix(in srgb, var(--text) 3%, transparent);
    --dim-overlay: color-mix(in srgb, var(--text) 50%, transparent);
    --dim-shadow: color-mix(in srgb, var(--text) 20%, transparent);

    --radius-main: 20px; --radius-small: 5px; --width-card: 70%;
    --font-stack: 'Iosevka', 'Consolas', monospace;
    --anim-speed: 0.4s; --anim-curve: cubic-bezier(0.25, 0.8, 0.25, 1);
}
* { font-family: var(--font-stack); box-sizing: border-box; }
body {
    background-color: var(--bg); color: var(--text);
    margin: 0; padding: 0; height: 100vh;
    display: flex; flex-direction: column; align-items: center;
    overflow: hidden; transition: background-color 0.3s, color 0.3s;
}

/* Utils */
.bg-dim { background-color: var(--dim-bg) !important; }
.bg-accent { background-color: var(--accent) !important; }
.bg-success { background-color: var(--success) !important; }
.bg-danger { background-color: var(--danger) !important; }
.text-muted { color: var(--text-muted) !important; }
.text-danger { color: var(--danger) !important; }
.text-on-accent { color: var(--accent-text) !important; }
.border-dim { border: 1px solid var(--dim-border) !important; }

/* Barra Superior e RelÃ³gio */
#top-dock {
    position: fixed; top: 0; width: var(--width-card); height: 50px;
    background-color: var(--surface); border-radius: 0 0 15px 15px;
    display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 10px;
    padding: 0 15px; z-index: 20; box-shadow: 0 4px 6px var(--dim-shadow);
}
#dock-clock {
    justify-self: start;
    display: flex; align-items: center; gap: 5px; font-size: 0.85rem; color: var(--clock-text); white-space: nowrap; flex-shrink: 0;
}
#clock-date {
    font-style: italic; font-weight: normal;
}
#clock-time {
    font-weight: bold; font-style: normal;
}

.dock-nav { justify-self: center; display: flex; gap: 5px; overflow-x: auto; scrollbar-width: none; }
.dock-nav::-webkit-scrollbar { display: none; }
.dock-actions { justify-self: end; display: flex; gap: 5px; flex-shrink: 0;}

.nav-btn {
    background: transparent; border: none; padding: 6px 14px;
    cursor: pointer; font-weight: bold; color: var(--text-muted);
    border-radius: var(--radius-small); font-size: 0.9rem; transition: all 0.2s; white-space: nowrap;
}
.nav-btn.active { background: var(--accent); color: var(--accent-text); }
.nav-btn:hover:not(.active) { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--text); }

.top-bar-btn {
    background: transparent; border: none; font-size: 1.2rem;
    color: var(--text-muted); cursor: pointer; padding: 0 5px; transition: color 0.2s;
}
.top-bar-btn:hover { color: var(--text); }
.spacer { height: 60px; flex-shrink: 0; }

/* Sidebars */
.trigger-area { position: fixed; top: 0%; bottom: 0%; height: 100%; width: 80px; z-index: 35; }
.trigger-area.left { left: 0; } .trigger-area.right { right: 0; }
.sidebar {
    position: fixed; top: 0; bottom: 0; background: var(--surface); z-index: 40; padding: 20px; box-sizing: border-box;
    transition: transform var(--anim-speed) var(--anim-curve) 0.3s, box-shadow var(--anim-speed) ease; display: flex; flex-direction: column; gap: 15px; height: 100vh;
    box-shadow: 0 0 20px transparent;
}
.sidebar.open { box-shadow: 0 0 20px var(--dim-shadow); }
.sidebar.left { left: 0; transform: translateX(-100%); width: 480px; border-right: 1px solid var(--border); }
.sidebar.right { right: 0; transform: translateX(100%); width: 480px; border-left: 1px solid var(--border); }
.sidebar.left.open { transform: translateX(0); }
.sidebar.right.open { transform: translateX(0); }

/* Abinhas das barras laterais */
.sidebar-handle {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 26px; height: 84px; cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface); color: var(--text-muted);
    border: 1px solid var(--border);
    box-shadow: 0 0 10px var(--dim-shadow);
    transition: all 0.2s;
}
.sidebar.left .sidebar-handle { right: -26px; border-left: none; border-radius: 0 12px 12px 0; }
.sidebar.right .sidebar-handle { left: -26px; border-right: none; border-radius: 12px 0 0 12px; }
.sidebar-handle::before {
    content: 'â€º'; font-size: 1.2rem; font-weight: bold; line-height: 1; transition: transform 0.3s;
}
.sidebar.right .sidebar-handle::before { content: 'â€¹'; }
.sidebar.open .sidebar-handle::before { transform: rotate(180deg); }
.sidebar-handle:hover { background: var(--accent); color: var(--accent-text); }

/* Abas e Listas na Barra Lateral Esquerda */
.sidebar-header-tabs { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px; flex-shrink: 0; }
.sidebar-tabs-nav { display: flex; gap: 8px; }
.sb-tab-btn { background: var(--surface-inner); border: none; padding: 6px 12px; border-radius: var(--radius-small); font-weight: bold; color: var(--text-muted); cursor: pointer; font-size: 0.85rem; }
.sb-tab-btn.active { background: var(--accent); color: var(--accent-text); }
.sb-close-btn { background: transparent; border: none; font-size: 1.3rem; color: var(--text-muted); cursor: pointer; }
.sb-close-btn:hover { color: var(--text); }
.sidebar-content-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.sb-tab-pane { flex: 1; display: flex; flex-direction: column; overflow-y: auto; scrollbar-width: none; }
.sb-tab-pane::-webkit-scrollbar { display: none; }
.sidebar-scroll-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }

/* Blocos de Notas */
.notes-top-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.notes-container { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; padding-bottom: 20px; scrollbar-width: none; }
.notes-container::-webkit-scrollbar { display: none; }
.note-block { background: var(--dim-card); border: 1px solid var(--border); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.note-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; min-height: 25px; }
.note-title-input { border: none; background: transparent; color: var(--text); font-weight: bold; font-size: 0.9rem; width: 100%; outline: none; padding: 2px 5px; font-family: inherit; margin-right: 10px; }
.note-title-input:focus { border-bottom: 1px solid var(--accent); }
.note-preview { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin-right: 10px; font-weight: normal; }
.note-actions { display: flex; gap: 5px; align-items: center; }
.note-body { display: flex; flex-direction: column; gap: 5px; }
.note-toolbar { display: flex; gap: 5px; }
.note-body textarea { width: 100%; height: 100px; background: var(--surface-inner); border: 1px solid var(--border); color: var(--text); resize: vertical; outline: none; padding: 8px; border-radius: 6px; font-size: 0.85rem; }
.note-body textarea:focus { border-color: var(--accent); }
.note-rendered-view { width: 100%; min-height: 100px; background: var(--surface-inner); border: 1px solid var(--border); color: var(--text); padding: 8px; border-radius: 6px; font-size: 0.85rem; white-space: pre-wrap; word-break: break-word; }

/* Textarea da barra direita */
#notes-area-right { width: 100%; height: 100%; box-sizing: border-box; resize: none; background: var(--surface-inner); border: 1px solid var(--border); color: var(--text); padding: 12px; border-radius: 8px; font-family: inherit; font-size: 0.9rem; outline: none; }
#notes-area-right:focus { border-color: var(--accent); }

/* Aba Listas e Pastas */
.lists-top-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.lists-container { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; padding-bottom: 20px; scrollbar-width: none; }
.lists-container::-webkit-scrollbar { display: none; }
.cute-folder-card, .cute-list-card { background: var(--dim-card); border: 1px solid var(--border); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 5px var(--dim-shadow); }
.cute-folder-header, .cute-list-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; min-height: 28px; }
.cute-folder-title-area, .cute-list-title-area { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.cute-arrow.action-btn, .note-header .toggle-btn { box-sizing: border-box; width: 22px; height: 22px; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; line-height: 1; font-size: 0.8rem; flex-shrink: 0; }
.cute-name, .cute-title { font-weight: bold; font-size: 0.9rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cute-actions, .cute-list-meta-actions { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
.cute-counter { font-size: 0.75rem; white-space: nowrap; }
.cute-folder-body { display: flex; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px dashed var(--border); margin-top: 4px; }
.cute-list-body { display: flex; flex-direction: column; gap: 8px; padding-top: 5px; border-top: 1px solid var(--border); margin-top: 4px; }
.cute-items-list { display: flex; flex-direction: column; gap: 6px; }
.cute-item-row { display: flex; justify-content: space-between; align-items: center; background: var(--surface-inner); padding: 6px 10px; border-radius: 8px; }
.cute-checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; flex: 1; min-width: 0; word-break: break-word; }
.cute-checkbox-label input[type="checkbox"] { cursor: pointer; accent-color: var(--accent); }
.item-done { text-decoration: line-through; opacity: 0.6; }
.item-actions { display: flex; gap: 3px; align-items: center; flex-shrink: 0; }
.new-item-row { margin-top: 4px; }
.new-item-row input { width: 100%; padding: 6px 10px; font-size: 0.85rem; box-sizing: border-box; background: var(--surface-inner); border: 1px solid var(--border); color: var(--text); border-radius: 8px; outline: none; font-family: inherit; }
.new-item-row input:focus { border-color: var(--accent); }
.new-item-row input::placeholder { color: var(--text-muted); }

/* Views & Cards */
.container { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; padding-bottom: 0; }
.view-section { width: 100%; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 15px; overflow: hidden; padding-bottom: 5px; overflow-y: auto;-ms-overflow-style: none;scrollbar-width: none;}
.view-section.hidden { display: none; }
.card { width: var(--width-card); background-color: var(--surface); border-radius: var(--radius-main); padding: 20px; box-shadow: 0 4px 10px var(--dim-shadow); display: flex; flex-direction: column; align-items: center; position: relative; }
.full-height-card { height: 100%; overflow: hidden; }

/* Pomodoro */
#pomodoro-main { flex-shrink: 0; height: auto; overflow: hidden; transition: all 0.3s; width: var(--width-card); }
.edit-pomo-btn { position: absolute; top: 10px; right: 10px; width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--surface); color: var(--text-muted); font-size: 1.2rem; cursor: pointer; z-index: 5; border: 1px dashed var(--border); }
.edit-pomo-btn:hover { color: var(--accent); }
.pomo-inner-container { display: flex; align-items: center; justify-content: center; width: 100%; transition: all 0.5s ease; gap: 0; }
.timer-wrapper { position: relative; width: 210px; height: 210px; flex-shrink: 0; transition: transform 0.5s ease; }
.pomo-note-wrapper { width: 0; height: 210px; overflow: hidden; opacity: 0; display: flex; flex-direction: column; justify-content: center; transition: flex-grow 0.5s ease, opacity 0.5s ease, padding 0.5s ease; flex-grow: 0; }
.card.pomo-editing .timer-wrapper { transform: NONE; } .card.pomo-editing .pomo-note-wrapper { width: auto; flex-grow: 1; opacity: 1; padding-left: 20px; }
#pomo-side-note { width: 100%; height: 100%; background: transparent; border: 1px dashed var(--border); border-radius: 10px; padding: 15px; color: var(--text); resize: none; font-size: 0.9rem; outline: none; box-sizing: border-box; }
#pomo-side-note:focus { border-color: var(--accent); }
#status-main { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; display: block; margin-left: auto; margin-right: auto; }
.timer-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg); transition: opacity 0.3s; }
circle, rect { fill: none; stroke-width: 8; }
.bg-border { stroke: var(--border); }
.progress-border { stroke: var(--danger); stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.5s ease; }
.timer-svg.hidden-circle { opacity: 0; }
.timer-content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
h1[id^="time"] { font-size: 3.5rem; margin: 0; font-weight: normal; }
div[id^="status"] { font-size: 0.8rem; color: var(--text-muted); margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; text-align: center;}
.timer-controls { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
.btn-main { padding: 8px 20px; font-size: 1rem; cursor: pointer; border: none; border-radius: var(--radius-small); font-weight: bold; transition: transform 0.1s; }
.btn-main:active { transform: scale(0.95); }
.btn-reset { padding: 0; width: 35px; height: 35px; border-radius: 50%; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; background: var(--border); color: var(--text-muted); cursor: pointer; border: none; }
.btn-reset:hover { background: var(--accent); color: var(--accent-text); }
.manual-inputs-bottom { display: flex; gap: 30px; margin-top: 20px; justify-content: center; }
.input-group { display: flex; flex-direction: column; align-items: center; }
.input-group label { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 5px; font-weight: bold; }
.input-group input { width: 70px; padding: 8px; text-align: center; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-inner); color: var(--text); font-weight: bold; font-size: 1rem; }
.linear-wrapper { display: none; width: 100%; flex-direction: column; gap: 5px; opacity: 0; margin-top: 15px; }
.linear-info { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem;}
.linear-track { width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
.linear-fill { height: 100%; width: 100%; background: var(--danger); transition: width 1s linear; }

/* Task Queue */
.action-btn { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem; margin-left: 4px; }
.action-btn:hover { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
.action-btn.active { background-color: var(--accent) !important; color: var(--accent-text) !important; }
.task-edit-form { display: flex; gap: 5px; width: 100%; align-items: center; z-index: 5; }
.task-edit-form input[type="text"] { flex: 1; padding: 6px 8px; border-radius: 5px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.9rem; min-width: 50px; }
.task-edit-form input[type="number"] { width: 55px; padding: 6px; text-align: center; border-radius: 5px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 0.9rem; }
.task-edit-form input[type="color"] { width: 30px; height: 30px; border: none; background: none; cursor: pointer; padding: 0; flex-shrink: 0; }
.task-edit-form button { padding: 6px 10px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 0.8rem; flex-shrink: 0; }
.task-edit-form .edit-save { background: var(--accent); color: var(--accent-text); }
.task-edit-form .edit-cancel { background: var(--dim-card); color: var(--text-muted); border: 1px solid var(--border); }
.drag-handle { cursor: grab; user-select: none; opacity: .5; margin-right: 8px; }
.drag-handle:hover { opacity: 1; }
.dragging { opacity: .4; }
.drag-over { box-shadow: 0 2px 0 0 var(--accent); }

.task-divider { display: flex; align-items: center; gap: 8px; margin: 12px 0; }
.task-divider hr { flex: 1; border: none; border-top: 1px solid var(--border); margin: 0; }

/* -----------------------------
   PALETAS DE TEMAS (UNIFICADAS)
   ----------------------------- */
[data-theme="gruvbox-light"] {
    --bg: #F2E5BC; --surface: #d3c594; --text: #000000; --text-muted: #524d4d; --accent: #458588; --accent-text: #f2e5bc; --danger: #cc241d; --success: #98971a; --clock-text: #000000;
}
[data-theme="gruvbox-dark"] {
    --bg: #282828; --surface: #3c3836; --text: #ebdbb2; --text-muted: #bdae93; --accent: #83a598; --accent-text: #282828; --danger: #fb4934; --success: #b8bb26; --clock-text: #ebdbb2;
}
[data-theme="dracula"] {
    --bg: #282a36; --surface: #44475a; --text: #f8f8f2; --text-muted: #b6c2f5; --accent: #bd93f9; --accent-text: #282a36; --danger: #ff5555; --success: #50fa7b; --clock-text: #f8f8f2;
}
[data-theme="nord"] {
    --bg: #2e3440; --surface: #3b4252; --text: #eceff4; --text-muted: #a3b0c8; --accent: #88c0d0; --accent-text: #2e3440; --danger: #bf616a; --success: #a3be8c; --clock-text: #eceff4;
}
[data-theme="solarized-light"] {
    --bg: #fdf6e3; --surface: #eee8d5; --text: #485a60; --text-muted: #6c7f84; --accent: #268bd2; --accent-text: #ffffff; --danger: #dc322f; --success: #859900; --clock-text: #6c7f84;
}
[data-theme="solarized-dark"] {
    --bg: #002b36; --surface: #073642; --text: #aebfbe; --text-muted: #859b9e; --accent: #2aa198; --accent-text: #002b36; --danger: #dc322f; --success: #859900; --clock-text: #aebfbe;
}
[data-theme="monokai"] {
    --bg: #272822; --surface: #3e3d32; --text: #f8f8f2; --text-muted: #a8a389; --accent: #a6e22e; --accent-text: #272822; --danger: #f92672; --success: #a6e22e; --clock-text: #f8f8f2;
}
[data-theme="monokai-orange"] {
    --bg: #272822; --surface: #3e3d32; --text: #f8f8f2; --text-muted: #a8a389; --accent: #FF5E00; --accent-text: #272822; --danger: #f92672; --success: #a6e22e; --clock-text: #f8f8f2;
}
[data-theme="catppuccin-mocha"] {
    --bg: #1e1e2e; --surface: #313244; --text: #cdd6f4; --text-muted: #a6adc8; --accent: #cba6f7; --accent-text: #11111b; --danger: #f38ba8; --success: #a6e3a1; --clock-text: #cdd6f4;
}
[data-theme="catppuccin-latte"] {
    --bg: #eff1f5; --surface: #e6e9ef; --text: #4c4f69; --text-muted: #5a5d73; --accent: #1e66f5; --accent-text: #eff1f5; --danger: #d20f39; --success: #40a02b; --clock-text: #4c4f69;
}
[data-theme="tokyo-night"] {
    --bg: #1a1b26; --surface: #24283b; --text: #c0caf5; --text-muted: #9aa5ce; --accent: #7aa2f7; --accent-text: #15161e; --danger: #f7768e; --success: #9ece6a; --clock-text: #c0caf5;
}
[data-theme="one-dark"] {
    --bg: #282c34; --surface: #353b45; --text: #c2c8d2; --text-muted: #939aa8; --accent: #61afef; --accent-text: #282c34; --danger: #e06c75; --success: #98c379; --clock-text: #c2c8d2;
}
[data-theme="one-light"] {
    --bg: #fafafa; --surface: #f0f0f1; --text: #383a42; --text-muted: #6b6d74; --accent: #4078f2; --accent-text: #fafafa; --danger: #e45649; --success: #50a14f; --clock-text: #383a42;
}
[data-theme="rose-pine"] {
    --bg: #191724; --surface: #1f1d2e; --text: #e0def4; --text-muted: #908caa; --accent: #c4a7e7; --accent-text: #191724; --danger: #eb6f92; --success: #9ccfd8; --clock-text: #e0def4;
}
[data-theme="everforest"] {
    --bg: #2b3339; --surface: #323c41; --text: #d3c6aa; --text-muted: #9da9a0; --accent: #a7c080; --accent-text: #2b3339; --danger: #e67e80; --success: #a7c080; --clock-text: #d3c6aa;
}
[data-theme="kanagawa"] {
    --bg: #1f1f28; --surface: #2a2a37; --text: #dcd7ba; --text-muted: #9a998f; --accent: #7e9cd8; --accent-text: #1f1f28; --danger: #c34043; --success: #76946a; --clock-text: #dcd7ba;
}
[data-theme="github-dark"] {
    --bg: #0d1117; --surface: #161b22; --text: #c9d1d9; --text-muted: #8b949e; --accent: #58a6ff; --accent-text: #0d1117; --danger: #f85149; --success: #3fb950; --clock-text: #c9d1d9;
}
[data-theme="ayu-mirage"] {
    --bg: #1f2430; --surface: #242936; --text: #cbccc6; --text-muted: #8a95a8; --accent: #ffcc66; --accent-text: #1f2430; --danger: #f28779; --success: #a6cc70; --clock-text: #cbccc6;
}

/* Menu Dropdown de Temas */
.theme-dropdown-menu { 
    position: fixed; background-color: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-small); 
    box-shadow: 0 4px 10px var(--dim-shadow); padding: 5px; z-index: 1000; display: flex; flex-direction: column; gap: 3px; 
    min-width: 150px; max-height: 70vh; overflow-y: auto;
}
.theme-menu-item { 
    padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; color: var(--text-muted); cursor: pointer; 
    transition: background 0.2s, color 0.2s; user-select: none; display: flex; align-items: center;
}
.theme-menu-item:hover { background-color: color-mix(in srgb, var(--text) 10%, transparent); color: var(--text); }
.theme-menu-item.active { background-color: var(--accent); color: var(--accent-text); font-weight: bold; }

.theme-swatch {
    display: flex; gap: 2px; margin-right: 8px;
}
.theme-swatch i {
    display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid var(--border);
}
.theme-swatch i:nth-child(1) { background-color: var(--bg); }
.theme-swatch i:nth-child(2) { background-color: var(--surface); }
.theme-swatch i:nth-child(3) { background-color: var(--accent); }

.task-input-row { width: 100%; display: flex; gap: 10px; margin-bottom: 20px; align-items: center; background: var(--surface-inner); padding: 10px; border-radius: 10px; flex-shrink: 0; }
.input-main { flex: 1; padding: 8px; border-radius: 5px; border: 1px solid var(--border); background: var(--bg); color: var(--text); }
.time-inputs { display: flex; align-items: center; gap: 2px; }
.time-inputs input { width: 60px; padding: 8px; text-align: center; border-radius: 5px; border: 1px solid var(--border); background: var(--bg); color: var(--text); }
.action-btn-large { border: none; padding: 0 15px; height: 35px; border-radius: 5px; font-weight: bold; cursor: pointer; }
#task-color { width: 35px; height: 35px; border: none; background: none; cursor: pointer; }
#view-timer .card { height: 100%; display: flex; flex-direction: column; }
.card-header-row { width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--surface-inner); padding-bottom: 5px; margin-bottom: 5px; flex-shrink: 0; }
.card-title { margin: 0; margin-top: -10px; font-size: 0.8rem; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }
.queue-controls { display: flex; gap: 10px; align-items: center;}
#timer-queue-list { width: 100%; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; padding-right: 5px; flex-shrink: 0; min-height: 0; scrollbar-width: none;-ms-overflow-style: none;}
.empty-list { text-align:center; padding:20px; color:var(--text-muted); opacity:0.5; font-size:0.9rem; }
.task-item { background: var(--dim-card); border: 1px solid var(--surface-inner); border-radius: 8px; padding: 10px; display: flex; align-items: center; gap: 15px; position: relative; overflow: hidden; flex-shrink: 0; }
.task-item.active { border: 1px solid var(--accent); background: color-mix(in srgb, var(--text) 6%, transparent); }
.task-info { flex: 1; display: flex; justify-content: space-between; align-items: center; z-index: 2; }
.task-name { font-weight: bold; font-size: 1rem; }
.task-bar-bg { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: var(--border); }
.task-bar-fill { height: 100%; width: 100%; transition: width 1s linear; }
.btn-del-task { background: transparent; border: none; font-weight: bold; cursor: pointer; font-size: 1.2rem; margin: 0; padding: 0;}
.task-total-time { font-size: 0.8em; color: var(--text-muted); margin-left: 5px; font-weight: normal; }

/* Modals */
.hidden { display: none !important; }
#settings-overlay { position: fixed; inset: 0; background: var(--dim-overlay); z-index: 200; display: flex; align-items: center; justify-content: center; }
.settings-modal { background: var(--surface); padding: 20px; border-radius: var(--radius-main); width: 400px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 10px 25px var(--dim-shadow); max-height: 90vh; overflow-y: auto; }
.settings-header { display: flex; justify-content: space-between; align-items: center;}
.settings-header h2 { margin: 0; font-size: 1.2rem; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text); }
.settings-modal label { font-size: 0.8rem; font-weight: bold; color: var(--text-muted); margin-top: 5px;}
.settings-modal input { padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-small); background: var(--surface-inner); color: var(--text); width: 100%;}
.separator { margin: 15px 0; border-top: 1px solid var(--border); }
.cloud-buttons-row { display: flex; gap: 10px; margin-top: 10px; }
.cloud-buttons-row button { flex: 1; padding: 8px; }
footer { padding: 0px 0; flex-shrink: 0; width: 100%; text-align: center; background: transparent; z-index: 10; }
footer p { font-size: 10px; color: var(--text-muted); opacity: 0.6; margin:0; margin-top: -15px; }

/* Mobile */
.mob-dock-btn { display: none; }
@media (max-width: 768px) {
    :root { --mob-h: 50px; --mob-pad: 10px; --mob-font-lg: 0.9rem; --mob-font-md: 0.9rem; --mob-z-dock: 500; --mob-z-side: 400; }
    #top-dock { position: fixed; top: 0; bottom: auto; width: 100%; height: var(--mob-h); background-color: var(--surface); z-index: var(--mob-z-dock); border-radius: 0; padding: 0 5px; gap: 5px; display: flex; justify-content: space-between; }
    .mob-dock-btn { padding: 0 5px; display: flex; font-size: 24px; background-color: transparent; color: var(--text); height: 100%; }
    .nav-btn { font-size: 0.8rem; padding: 6px 10px; }
    .sidebar-handle { display: none; }
    #clock-date { display: none; }
    .spacer { display: none; }
    .container { overflow-y: auto; padding-top: calc(var(--mob-h) + 15px); padding-bottom: 20px; }
    .card, :root { --width-card: 95%; }
    .sidebar.left { width: 90% !important; max-width: 380px; }
    .sidebar { z-index: var(--mob-z-side); top: 0; bottom: 0; height: 100vh; }
    .trigger-area { display: none; }
    .task-input-row { display: grid !important; grid-template-columns: 1fr var(--mob-h) !important; grid-template-rows: auto auto !important; gap: 5px !important; background: transparent !important; padding: 0 !important; border: none !important; align-items: stretch !important; }
    #task-name { grid-column: 1 / 2; grid-row: 1 / 2; width: 100% !important; min-height: var(--mob-h); font-size: var(--mob-font-md); }
    #task-color { grid-column: 2 / 3; grid-row: 1 / 2; width: 100% !important; height: 100% !important; min-height: var(--mob-h); padding: 0; border: none; background: none; }
    .time-inputs { grid-column: 1 / 2; grid-row: 2 / 3; display: flex !important; justify-content: space-between !important; width: 100% !important; gap: 5px; }
    .time-inputs input { width: 32% !important; min-height: var(--mob-h); font-size: var(--mob-font-md); text-align: left; padding: 10px; }
    .time-inputs span { display: none !important; }
    #btn-add-task { grid-column: 2 / 3; grid-row: 2 / 3; width: 100% !important; height: 100% !important; min-height: var(--mob-h); padding: 0 !important; }
    .task-item { padding-right: 0 !important; font-size: var(--mob-font-lg); }
    .btn-del-task { min-width: 30px !important; height: 30px !important; font-size: 1.7rem !important; display: flex; align-items: center; justify-content: center; background: var(--dim-card); border-radius: 8px; margin: -5px 5px 0 0 !important; }
    .input-group input { font-size: var(--mob-font-md); width: 100%; height: var(--mob-h); }
}

/* Tabs Queue */
#tab-bar-footer { position: absolute; bottom: 0; left: 0; width: 100%; height: 45px; background: var(--surface); border-top: 1px solid var(--border); display: flex; align-items: center; padding: 0 5px; gap: 5px; z-index: 10; border-radius: 0 0 var(--radius-main) var(--radius-main); }
#tabs-scroll-area { flex: 1; display: flex; gap: 5px; height: 100%; align-items: center; overflow-x: auto; cursor: grab; padding-right: 10px; scrollbar-width: none; -ms-overflow-style: none; user-select: none; }
#tabs-scroll-area:active { cursor: grabbing; }
#tabs-scroll-area::-webkit-scrollbar { display: none; }
.timer-tab { flex: 0 0 auto; width: 130px; height: 35px; background: var(--surface-inner); border: 1px solid var(--border); border-radius: 6px; display: flex; align-items: center; padding: 0 2px 0 8px; cursor: pointer; transition: all 0.2s; position: relative; }
.timer-tab.active { background: var(--accent); border-color: var(--accent); box-shadow: 0 2px 5px var(--dim-shadow); }
.timer-tab:hover:not(.active) { background: color-mix(in srgb, var(--text) 10%, transparent); }
.tab-name-input { flex: 1; background: transparent; border: none; outline: none; color: var(--text-muted); font-size: 0.8rem; font-weight: bold; text-align: left; min-width: 0; pointer-events: none; cursor: grab; }
.timer-tab.active .tab-name-input { color: var(--accent-text); }
.timer-tab.editing .tab-name-input { pointer-events: auto; cursor: text; background: color-mix(in srgb, var(--text) 20%, transparent); border-radius: 4px; padding: 0 5px; color: var(--text); }
.tab-close-btn { width: 20px; height: 20px; background: transparent; border: none; color: var(--text-muted); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; opacity: 0; transition: opacity 0.2s; cursor: pointer; }
.timer-tab:hover .tab-close-btn, .timer-tab.active .tab-close-btn {opacity: 1; }
.tab-close-btn:hover { background: var(--danger); color: var(--accent-text); }
.timer-tab.active .tab-close-btn { color: color-mix(in srgb, var(--accent-text) 70%, transparent); }
.tab-close-btn:hover { background: color-mix(in srgb, var(--accent-text) 30%, transparent); color: var(--accent-text); }
#btn-add-tab { width: 35px; height: 38px; border-radius: 50%; background: var(--surface-inner); color: var(--text-muted); font-size: 1.2rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0; border: 1px dashed var(--border); cursor: pointer; }
#btn-add-tab:hover { background: var(--success); color: var(--accent-text); border-style: solid; }
``n

