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

        // Renderiza tudo e mantém o foco no input de "Novo item" se estiver focado
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

        // --- MANIPULAÇÃO DE DADOS (Árvore) ---

        findNode(id, node = this.state) {
            if (node.pastas) {
                for (let p of node.pastas) {
                    if (p.id === id) return { item: p, type: 'pasta' };
                    const found = this.findNode(id, p);
                    if (found) return found;
                }
            }
            if (node.listas) {
                for (let l of node.listas) {
                    if (l.id === id) return { item: l, type: 'lista' };
                }
            }
            return null;
        }

        deleteNode(id, node = this.state) {
            if (node.pastas) {
                const initLen = node.pastas.length;
                node.pastas = node.pastas.filter(p => p.id !== id);
                if (node.pastas.length !== initLen) return true;
                
                for (let p of node.pastas) {
                    if (this.deleteNode(id, p)) return true;
                }
            }
            if (node.listas) {
                const initLen = node.listas.length;
                node.listas = node.listas.filter(l => l.id !== id);
                if (node.listas.length !== initLen) return true;
            }
            return false;
        }

        // --- AÇÕES GLOBAIS ---

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

            // Delegação de cliques para botões e checkboxes
            this.container.addEventListener('click', (e) => {
                const el = e.target.closest('[data-action]');
                if (!el) return;

                const action = el.dataset.action;
                const id = Number(el.dataset.id);
                
                // Ações de Pastas e Listas
                if (action === 'toggle-folder' || action === 'toggle-list') {
                    const node = this.findNode(id);
                    if (node) {
                        node.item.aberta = !node.item.aberta;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'add-subfolder') {
                    const node = this.findNode(id);
                    if (node && node.type === 'pasta') {
                        node.item.pastas = node.item.pastas || [];
                        node.item.pastas.push({ id: Date.now(), nome: 'Nova pasta', aberta: true, pastas: [], listas: [] });
                        node.item.aberta = true;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'add-sublist') {
                    const node = this.findNode(id);
                    if (node && node.type === 'pasta') {
                        node.item.listas = node.item.listas || [];
                        node.item.listas.push({ id: Date.now(), titulo: 'Nova lista', aberta: true, itens: [] });
                        node.item.aberta = true;
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'delete-folder') {
                    if (confirm("Excluir a pasta e tudo dentro dela?")) {
                        this.deleteNode(id);
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'delete-list') {
                    this.deleteNode(id);
                    this.save();
                    this.renderAndPreserveFocus();
                }
                
                // Ações de Itens
                else if (action === 'toggle-item') {
                    const listId = Number(el.dataset.listId);
                    const itemId = Number(el.dataset.itemId);
                    const node = this.findNode(listId);
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
                    const node = this.findNode(listId);
                    if (node && node.type === 'lista') {
                        node.item.itens = node.item.itens.filter(i => i.id !== itemId);
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
                else if (action === 'move-up-item' || action === 'move-down-item') {
                    const listId = Number(el.dataset.listId);
                    const itemId = Number(el.dataset.itemId);
                    const node = this.findNode(listId);
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

                    const node = this.findNode(listId);
                    if (node && node.type === 'lista') {
                        node.item.itens = node.item.itens || [];
                        node.item.itens.push({ id: Date.now(), texto, feito: false });
                        this.save();
                        this.renderAndPreserveFocus();
                    }
                }
            });

            // Duplo clique para edição in-line (pastas, listas e itens)
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
                    nodeInfo = this.findNode(listId);
                    if (nodeInfo && nodeInfo.type === 'lista') {
                        itemObj = nodeInfo.item.itens.find(i => i.id === id);
                    }
                } else {
                    nodeInfo = this.findNode(id);
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

        // --- RENDERIZAÇÃO RECURSIVA ---

        renderAll() {
            if (!this.container) return;
            
            let html = '';
            
            if (this.state.pastas) {
                this.state.pastas.forEach(p => { html += this.createFolderHTML(p); });
            }
            if (this.state.listas) {
                this.state.listas.forEach(l => { html += this.createListHTML(l); });
            }
            
            this.container.innerHTML = html;
        }

        createFolderHTML(pasta) {
            const arrow = pasta.aberta ? '▾' : '▸';
            let childrenHTML = '';

            if (pasta.aberta) {
                if (pasta.pastas) {
                    pasta.pastas.forEach(p => { childrenHTML += this.createFolderHTML(p); });
                }
                if (pasta.listas) {
                    pasta.listas.forEach(l => { childrenHTML += this.createListHTML(l); });
                }
            }

            return `
                <div class="cute-folder-card">
                    <div class="cute-folder-header">
                        <div class="cute-folder-title-area">
                            <span class="cute-arrow action-btn" data-action="toggle-folder" data-id="${pasta.id}">${arrow}</span>
                            <span class="cute-name" data-id="${pasta.id}" title="Duplo clique para renomear">${window.escapeHtml(pasta.nome)}</span>
                        </div>
                        <div class="cute-actions">
                            <button class="action-btn" data-action="add-subfolder" data-id="${pasta.id}" title="+ Subpasta">+📁</button>
                            <button class="action-btn" data-action="add-sublist" data-id="${pasta.id}" title="+ Lista">+📋</button>
                            <button class="action-btn text-danger" data-action="delete-folder" data-id="${pasta.id}" title="Excluir">×</button>
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
                            <span class="item-text" data-id="${item.id}" data-list-id="${lista.id}" title="Duplo clique para renomear">${window.escapeHtml(item.texto)}</span>
                        </label>
                        <div class="item-actions">
                            <button class="action-btn" data-action="move-up-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Subir">↑</button>
                            <button class="action-btn" data-action="move-down-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Descer">↓</button>
                            <button class="action-btn text-danger" data-action="delete-item" data-list-id="${lista.id}" data-item-id="${item.id}" title="Excluir">×</button>
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
                            <button class="action-btn text-danger" data-action="delete-list" data-id="${lista.id}" title="Excluir">×</button>
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