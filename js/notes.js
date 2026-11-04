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
            
            // Migration: if it's an array of the old format, convert to tree format
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
            let focusedType = null; // 'title' or 'body'

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
                nome: 'New folder',
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
            this.state.notas.unshift(newNote); // Puts it at the top of the root
            this.save();
            this.renderAndPreserveFocus();
            
            // Automatically focuses on the new note's title
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

            // Event delegation for clicks
            this.container.addEventListener('click', (e) => {
                
                // --- FOLDER ACTIONS ---
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
                        if (depth >= 3) return; // Limit of 3 levels
                        
                        const node = window.Tree.findNode(this.state, id);
                        if (node && node.type === 'pasta') {
                            node.item.pastas = node.item.pastas || [];
                            node.item.pastas.push({ id: Date.now(), nome: 'New folder', aberta: true, pastas: [], notas: [] });
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
                            if (window.Tree.isFolderEmpty(node.item) || confirm("Delete the folder and everything inside it?")) {
                                window.Tree.deleteNode(this.state, id);
                                this.save();
                                this.renderAndPreserveFocus();
                            }
                        }
                    }
                    return; // Interrupt so note actions aren't processed
                }

                // --- NOTE ACTIONS ---
                if (e.target.closest('.note-title-input')) {
                    e.stopPropagation(); // Clicking the title input doesn't expand or collapse
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
                        
                        // Updates classes directly in the DOM to avoid recreating elements (prevents focus loss on rapid clicks)
                        const body = block.querySelector('.note-body');
                        const toggleBtn = block.querySelector('.toggle-btn');
                        const input = block.querySelector('.note-title-input');
                        const preview = block.querySelector('.note-preview');
                        
                        if (body) body.style.display = note.aberta ? 'flex' : 'none';
                        if (toggleBtn) toggleBtn.textContent = note.aberta ? '▾' : '▸';
                        
                        if (note.aberta) {
                            input.classList.remove('hidden');
                            preview.classList.add('hidden');
                        } else {
                            input.classList.add('hidden');
                            preview.classList.remove('hidden');
                            
                            // Sets the updated preview
                            let previewText = '(untitled)';
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

                // Toolbar Actions
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
                        btnView.textContent = 'Edit';
                    } else {
                        view.classList.add('hidden');
                        ta.classList.remove('hidden');
                        btnView.textContent = 'View';
                        ta.focus();
                    }
                }
            });

            // Rename folder (double click)
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

            // Event delegation for typing (Without redrawing everything!)
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

            // Keyboard shortcuts in textarea
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

        // --- RECURSIVE RENDERING ---

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
            const arrow = pasta.aberta ? '▾' : '▸';
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
                            <button class="action-btn" data-action="add-subnote" data-id="${pasta.id}" title="+ Note">+📁 </button>
                            <button class="action-btn text-danger" data-action="delete-folder" data-id="${pasta.id}" title="Delete">×</button>
                        </div>
                    </div>
                    ${pasta.aberta && childrenHTML ? `<div class="cute-folder-body">${childrenHTML}</div>` : ''}
                </div>
            `;
        }

        createNoteHTML(note) {
            const toggleIcon = note.aberta ? '▾' : '▸';
            const bodyStyle = note.aberta ? 'display: flex;' : 'display: none;';
            
            let previewText = '(untitled)';
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
                    <div class="note-header" title="Click to expand/collapse">
                        <input type="text" class="note-title-input ${note.aberta ? '' : 'hidden'}" placeholder="Title" value="${window.escapeHtml(note.titulo || '')}">
                        <span class="note-preview ${note.aberta ? 'hidden' : ''}" style="${previewStyle}">${window.escapeHtml(previewText || '(untitled)')}</span>
                        <div class="note-actions">
                            <button class="action-btn toggle-btn">${toggleIcon}</button>
                            <button class="action-btn text-danger del-btn" title="Delete">×</button>
                        </div>
                    </div>
                    <div class="note-body" style="${bodyStyle}">
                        <div class="note-toolbar">
                            <button class="action-btn btn-bold" title="Bold (Ctrl+B)">B</button>
                            <button class="action-btn btn-italic" title="Italic (Ctrl+I)">I</button>
                            <button class="action-btn btn-view" style="margin-left: auto;">View</button>
                        </div>
                        <textarea placeholder="Type your note here...">${window.escapeHtml(note.texto)}</textarea>
                        <div class="note-rendered-view hidden"></div>
                    </div>
                </div>
            `;
        }
    }

    new NotesManager();
});