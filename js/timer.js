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
                addDividerBtn: document.getElementById('btn-add-divider'), // Novo botão
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
            // Só inicia se houver tasks válidas (não apenas divisórias) com tempo restante
            if (!tab || !tab.tasks.some(t => !t.divider && t.remainingSecs > 0)) return;
            
            this.isRunning = !this.isRunning;
            this.updateGlobalBtn();
        }

        updateGlobalBtn() {
            const btn = this.els.queueBtn;
            if (!btn) return;

            if (this.isRunning) {
                btn.className = "action-btn-large bg-success text-on-accent";
                btn.textContent = "⏸ RUNNING";
            } else {
                btn.className = "action-btn-large bg-dim text-muted border-dim";
                btn.textContent = "▶ PAUSED";
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
                // Pausa se não houver fila ou só existirem divisórias
                if (!tab || !tab.tasks.some(t => !t.divider)) {
                    this.isRunning = false;
                    this.updateGlobalBtn();
                    return;
                }

                // Acha a primeira task real (não-divisória) que tenha tempo restante
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
            if (!t || !el || t.divider) return; // Não edita divisória

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
                    div.innerHTML = `<span class="drag-handle" title="Arrastar">⋮⋮</span><hr><button class="btn-del-task" onclick="window.taskQueue.deleteTask('${task.id}')">×</button>`;
                    list.appendChild(div);
                    return; // Pula o resto da lógica para divisórias
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
                        <span class="drag-handle" title="Arrastar">⋮⋮</span>
                        <span class="task-name">${window.escapeHtml(task.name)}</span>
                        <div style="display:flex; align-items:center; gap:5px; z-index:10;">
                            <span class="task-timer" style="font-weight:bold; font-size:1.1rem;">${this.formatTime(task.remainingSecs)}</span>
                            <span class="task-total-time">/ ${this.formatTime(task.totalSecs)}</span>
                            <button class="btn-edit-task action-btn" onclick="window.taskQueue.startEdit('${task.id}')" title="Editar">✎</button>
                            <button class="btn-del-task text-danger" onclick="window.taskQueue.deleteTask('${task.id}')" title="Excluir">×</button>
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