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

        // Render everything and maintain focus on the "New item" input if it is focused
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

        // --- GLOBAL ACTIONS ---

        addRootFolder() {
            this.state.pastas.push({
                id: Date.now(),
                nome: 'New folder',
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
                titulo: 'New list',
                aberta: true,
                itens: []
            });
            this.save();
            this.renderAndPreserveFocus();
        }

        // --- EVENT DELEGATION ---

        bindEvents() {
            if (!this.container) return;

            // Click delegation for buttons and checkboxes
            this.container.addEventListener('click', (e) => {
                const el = e.target.closest('[data-action]');
                if (!el) return;

                const action = el.dataset.action;
                const id = Number(el.dataset.id);
                
                // Folder and List Actions
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
                    if (depth >= 3) return; // Limit of 3 levels

                    const node = window.Tree.findNode(this.state, id);
                    if (node && node.type === 'pasta') {
                        node.item.pastas = node.item.pastas || [];
                        node.item.pastas.push({ id: Date.now(), nome: 'New folder', aberta: true, pastas: [], listas: [] });
                        node.item.aberta = true;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'add-sublist') {
                    const node = window.Tree.findNode(this.state, id);
                    if (node && node.type === 'pasta') {
                        node.item.listas = node.item.listas || [];
                        node.item.listas.push({ id: Date.now(), titulo: 'New list', aberta: true, itens: [] });
                        node.item.aberta = true;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'delete-folder') {
                    const node = window.Tree.findNode(this.state, id);
                    if (node && node.type === 'pasta') {
                        if (window.Tree.isFolderEmpty(node.item) || confirm("Delete the folder and everything inside it?")) {
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
                
                // Item Actions
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

            // Enter on new item input
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

            // Double click for in-line editing (folders, lists, and items)
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

        // --- RECURSIVE RENDERING ---

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
            const arrow = pasta.aberta ? '▾' : '▸';
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
                ? `<button class="action-btn" data-action="add-subfolder" data-id="${pasta.id}" title="+ Subfolder">+📁 </button>` 
                : '';

            return `
                <div class="cute-folder-card">
                    <div class="cute-folder-header">
                        <div class="cute-folder-title-area">
                            <span class="cute-arrow action-btn" data-action="toggle-folder" data-id="${pasta.id}">${arrow}</span>
                            <span class="cute-name" data-id="${pasta.id}" title="Double click to rename">${window.escapeHtml(pasta.nome)}</span>
                        </div>
                        <div class="cute-actions">
                            ${btnAddFolder}
                            <button class="action-btn" data-action="add-sublist" data-id="${pasta.id}" title="+ List">+📋</button>
                            <button class="action-btn text-danger" data-action="delete-folder" data-id="${pasta.id}" title="Delete">×</button>
                        </div>
                    </div>
                    ${pasta.aberta && childrenHTML ? `<div class="cute-folder-body">${childrenHTML}</div>` : ''}
                </div>
            `;
        }

        createListHTML(lista) {
            const arrow = lista.aberta ? '▾' : '▸';
            const itens = lista.itens || [];
            const doneCount = itens.filter(i => i.feito).length;
            const totalCount = itens.length;

            let itensHTML = '';
            itens.forEach(item => {
                itensHTML += `
                    <div class="cute-item-row">
                        <label class="cute-checkbox-label ${item.feito ? 'item-done' : ''}">
                            <input type="checkbox" data-action="toggle-item" data-list-id="${lista.id}" data-item-id="${item.id}" ${item.feito ? 'checked' : ''}>
                            <span class="item-text" data-id="${item.id}" data-list-id="${lista.id}" title="Double click to rename">${window.escapeHtml(item.texto)}</span>
                        </label>
                        <div class="item-actions">
                            <button class="action-btn" data-action="move-up-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Move up">↑</button>
                            <button class="action-btn" data-action="move-down-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Move down">↓</button>
                            <button class="action-btn text-danger" data-action="delete-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Delete">×</button>
                        </div>
                    </div>
                `;
            });

            return `
                <div class="cute-list-card">
                    <div class="cute-list-header">
                        <div class="cute-list-title-area">
                            <span class="cute-arrow action-btn" data-action="toggle-list" data-id="${lista.id}">${arrow}</span>
                            <span class="cute-title" data-id="${lista.id}" title="Double click to rename">${window.escapeHtml(lista.titulo)}</span>
                        </div>
                        <div class="cute-list-meta-actions">
                            <span class="cute-counter">${doneCount}/${totalCount}</span>
                            <button class="action-btn text-danger" data-action="delete-list" data-id="${lista.id}" title="Delete">×</button>
                        </div>
                    </div>
                    ${lista.aberta ? `
                    <div class="cute-list-body">
                        <div class="cute-items-list" id="items-container-${lista.id}">
                            ${itensHTML}
                        </div>
                        <div class="new-item-row">
                            <input type="text" placeholder="New item... (Enter to save)" data-action="add-item-input" data-list-id="${lista.id}">
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    }

    new ListsManager();
});