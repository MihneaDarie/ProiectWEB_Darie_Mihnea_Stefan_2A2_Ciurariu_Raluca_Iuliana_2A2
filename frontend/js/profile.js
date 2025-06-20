class ProfileManager {
    constructor() {
        this.elements = {
            statsBtn: document.getElementById('statsButton'),
            editBtn: document.getElementById('editButton'),
            expandedPanel: document.getElementById('expandedPanel'),
            panelContent: document.getElementById('panelContent'),
            closeBtn: document.getElementById('closePanel'),
            overlay: document.querySelector('.overlay'),
            profileContainer: document.querySelector('.profile-container'),
            usernameEl: document.querySelector('.user-name'),
            logoutBtn: document.querySelector('.logout-button'),
            deleteBtn: document.getElementById('deleteBtn'),
            historyBtn: document.getElementById('historyButton')
        };

        this.endpoints = {
            username: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=getUsername',
            userData: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=getUserData',
            updateProfile: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=updateProfile',
            stats: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=distribution',
            logout: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=logout',
            history: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=history',
            dataset: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=getDataSet',
            delete: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=deleteAccount',
            checkPassword: '/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=checkPassword'
        };

        this.currentView = null;
        this.currentFilter = 'all';

        window.profileManager = this;
        this.init();
    }

    async init() {
        await this.loadUsername();
        this.setupEventListeners();
        this.setupCloseButton();
    }

    async loadUsername() {
        try {
            const res = await fetch(this.endpoints.username, {
                credentials: 'include'
            });
            const json = await res.json();

            if (res.ok && json.username && this.elements.usernameEl) {
                this.elements.usernameEl.textContent = json.username;
            }
        } catch (err) {
            console.error('Error loading username:', err);
        }
    }

    setupEventListeners() {
        if (this.elements.statsBtn) {
            this.elements.statsBtn.addEventListener('click', () => this.handleStatsClick());
        }

        if (this.elements.editBtn) {
            this.elements.editBtn.addEventListener('click', () => this.handleEditClick());
        }

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        if (this.elements.deleteBtn) {
            this.elements.deleteBtn.addEventListener('click', () => this.handleDeleteAccount());
        }

        if (this.elements.historyBtn) {
            this.elements.historyBtn.addEventListener('click', () => this.handleHistoryClick());
        }

        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    setupCloseButton() {
        if (this.elements.closeBtn) {
            this.elements.closeBtn.innerHTML = '×';
            this.elements.closeBtn.addEventListener('click', () => this.closePanel());
        }
    }

    async loadHistory(type = null) {
        this.currentView = 'history-list';
        this.currentFilter = type || 'all';

        this.elements.panelContent.innerHTML = '<p class="stats-loading">Se încarcă istoricul...</p>';

        try {
            const res = await fetch(this.endpoints.history, { credentials: 'include' });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const text = await res.text();

            if (!text) {
                throw new Error('Empty response from server');
            }

            let json;
            try {
                json = JSON.parse(text);
            } catch (parseError) {
                console.error('Invalid JSON response:', text);
                throw new Error('Invalid JSON response from server');
            }

            if (!json.success) {
                throw new Error(json.message || 'Unknown error');
            }

            const data = json.data || [];
            this.renderHistory(data);

        } catch (e) {
            console.error('History load error:', e);
            this.showError(e.message);
        }
    }

    renderHistory(rows) {
        this.elements.panelContent.innerHTML = '';

        const mainContainer = document.createElement('div');
        mainContainer.className = 'history-main-container';
        const header = document.createElement('div');
        header.className = 'history-header';
        header.style.display = 'none';
        header.innerHTML = `<div class="back-button">
            <button class="back-button" onclick="window.profileManager.backToList()">
                ← Back 
            </button>
            </div>
        `;
        mainContainer.appendChild(header);
        const types = ['all', 'number_array', 'character_array', 'matrix', 'graph', 'tree'];
        const tabs = document.createElement('div');
        tabs.className = 'history-tabs';
        tabs.id = 'historyTabs';

        types.forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t === 'all' ? 'All' : this.formatTypeName(t);
            btn.className = 'history-tab' + (t === this.currentFilter ? ' active' : '');
            btn.onclick = () => this.filterHistory(t);
            tabs.appendChild(btn);
        });

        mainContainer.appendChild(tabs);
        const contentArea = document.createElement('div');
        contentArea.className = 'history-content-area';
        contentArea.id = 'historyContent';
        let filteredRows = rows;
        if (this.currentFilter !== 'all') {
            filteredRows = rows.filter(row => row.TYPE === this.currentFilter);
        }

        if (!filteredRows.length) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'history-empty';
            emptyMsg.innerHTML = `
                <p>Nu există output-uri ${this.currentFilter !== 'all' ? `de tip ${this.formatTypeName(this.currentFilter)}` : ''}</p>
            `;
            contentArea.appendChild(emptyMsg);
        } else {
            const list = this.createHistoryList(filteredRows);
            contentArea.appendChild(list);
        }

        mainContainer.appendChild(contentArea);
        this.elements.panelContent.appendChild(mainContainer);

        this.allHistoryRows = rows;
    }

    filterHistory(type) {
        this.currentFilter = type === 'all' ? 'all' : type;
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        const contentArea = document.getElementById('historyContent');
        contentArea.innerHTML = '';

        let filteredRows = this.allHistoryRows;
        if (this.currentFilter !== 'all') {
            filteredRows = this.allHistoryRows.filter(row => row.TYPE === this.currentFilter);
        }

        if (!filteredRows.length) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'history-empty';
            emptyMsg.innerHTML = `
                <p>Nu există output-uri ${this.currentFilter !== 'all' ? `de tip ${this.formatTypeName(this.currentFilter)}` : ''}</p>
            `;
            contentArea.appendChild(emptyMsg);
        } else {
            const list = this.createHistoryList(filteredRows);
            contentArea.appendChild(list);
        }
    }

    backToList() {
        document.getElementById('historyTabs').style.display = 'flex';
        document.querySelector('.history-header').style.display = 'none';
        this.filterHistory(this.currentFilter);
    }

    createHistoryList(rows) {
        const listContainer = document.createElement('div');
        listContainer.className = 'history-list-container';

        rows.forEach(row => {
            const card = document.createElement('div');
            card.className = 'history-card';

            const typeColor = this.getTypeColor(row.TYPE);

            card.innerHTML = `
            <div class="history-card-header">
                <span class="history-type" style="background-color: ${typeColor}">${this.formatTypeName(row.TYPE)}</span>
                <span class="history-date">${this.formatDate(row.CREATED_AT)}</span>
            </div>
            <div class="history-card-body">
                ${row.DESCRIPTION ? `<p class="history-description">${row.DESCRIPTION}</p>` : ''}
                <div class="history-meta">
                    <span class="meta-item">ID: #${row.ID}</span>
                    ${row.SIZE ? `<span class="meta-item">Dimensiune: ${this.formatSize(row.SIZE)}</span>` : ''}
                </div>
            </div>
        `;

            card.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openDataset(row.ID);
            };
            listContainer.appendChild(card);
        });

        return listContainer;
    }

    async openDataset(id) {
        this.currentView = 'dataset-detail';
        const contentArea = document.getElementById('historyContent');
        contentArea.innerHTML = '<p class="stats-loading">Se încarcă detaliile...</p>';

        try {
            const url = `${this.endpoints.dataset}&id=${id}`;
            const res = await fetch(url, { credentials: 'include' });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const text = await res.text();

            if (!text) {
                throw new Error('Empty response from server');
            }

            let json;
            try {
                json = JSON.parse(text);
            } catch (parseError) {
                console.error('Invalid JSON response:', text);
                throw new Error('Invalid JSON response from server');
            }

            if (!json.success) {
                throw new Error(json.message || 'Failed to load dataset');
            }

            if (!json.data) {
                throw new Error('No data returned from server');
            }

            this.renderDatasetDetail(json.data);

        } catch (e) {
            console.error('Dataset load error:', e);
            this.showError(e.message);
        }
    }

    renderDatasetDetail(data) {
        const safeData = {
            ID: data.ID || data.id || 'N/A',
            TYPE: data.TYPE || data.type || 'unknown',
            LABEL: data.LABEL || data.label || 'Fără titlu',
            CREATED_AT: data.CREATED_AT || data.created_at || new Date().toISOString(),
            DESCRIPTION: data.DESCRIPTION || data.description || '',
            DATA: data.DATA || data.data || '',
            METADATA: data.METADATA || data.metadata || {},
        };

        document.getElementById('historyTabs').style.display = 'none';
        document.querySelector('.history-header').style.display = 'flex';
        const contentArea = document.getElementById('historyContent');
        contentArea.innerHTML = '';
        const detailContainer = document.createElement('div');
        detailContainer.className = 'dataset-detail-container';

        let dataSize = typeof safeData.DATA === 'string'
            ? safeData.DATA.length
            : JSON.stringify(safeData.DATA).length;
        const infoSection = document.createElement('div');
        infoSection.className = 'dataset-info-section';
        infoSection.style.setProperty('--type-color', this.getTypeColor(safeData.TYPE));
        infoSection.innerHTML = `
        <div class="info-grid">
            <div class="info-item type">
                <span class="info-label">Type:</span>
                <span class="info-value">${this.formatTypeName(safeData.TYPE)}</span>
            </div>
            <div class="info-item created">
                <span class="info-label">Created at:</span>
                <span class="info-value">${this.formatDate(safeData.CREATED_AT)}</span>
            </div>
            <div class="info-item size">
                <span class="info-label">Size:</span>
                <span class="info-value">${this.formatSize(dataSize)}</span>
            </div>
        </div>
        ${safeData.DESCRIPTION ? `
            <div class="info-description">
                <span class="info-label">Details:</span>
                <p>${safeData.DESCRIPTION}</p>
            </div>
        ` : ''}
    `;
        detailContainer.appendChild(infoSection);

        const contentSection = document.createElement('div');
        contentSection.className = 'dataset-content-section';

        const contentHeader = document.createElement('div');
        contentHeader.className = 'content-header';
        contentHeader.innerHTML = `<h4>Content</h4><div class="content-actions"></div>`;
        contentSection.appendChild(contentHeader);

        const viewerWrapper = document.createElement('div');
        viewerWrapper.className = 'dataset-viewer-wrapper';

        let isGraph = safeData.TYPE === 'graph';
        let vertexCount = 0;
        let graphMeta = safeData.METADATA || {};
        let graphData = safeData.DATA;
        let lastMode = 'text';

        if (typeof graphData === 'string') {
            try { graphData = JSON.parse(graphData); } catch { graphData = []; }
        }
        if (isGraph) {
            if (typeof graphMeta.vertices === 'number') vertexCount = graphMeta.vertices;
            else if (Array.isArray(graphData)) vertexCount = graphData.length;
            else vertexCount = 0;

            if (vertexCount > 0 && vertexCount <= 10) {
                const visBtn = document.createElement('button');
                visBtn.textContent = 'Visualize';
                visBtn.className = 'visualize-graph-btn';
                let textOutputHTML = '';

                visBtn.onclick = () => {
                    if (lastMode === 'text') {
                        viewerWrapper.innerHTML = this.renderGraphSVG(graphData, safeData);
                        visBtn.textContent = 'Back';
                        lastMode = 'svg';
                    } else {
                        viewerWrapper.innerHTML = textOutputHTML;
                        visBtn.textContent = 'Visualize';
                        lastMode = 'text';
                    }
                };
                contentHeader.querySelector('.content-actions').appendChild(visBtn);

                textOutputHTML = `<pre class="dataset-viewer">${this.formatParsedOutputSafe(safeData.TYPE, safeData.DATA)}</pre>`;
                viewerWrapper.innerHTML = textOutputHTML;
            } else {
                viewerWrapper.innerHTML = `<pre class="dataset-viewer">${this.formatParsedOutputSafe(safeData.TYPE, safeData.DATA)}</pre>`;
            }
        } else {
            let pre = document.createElement('pre');
            pre.className = 'dataset-viewer';
            if (safeData.TYPE === 'tree') pre.classList.add('tree-output');
            pre.innerHTML = this.formatParsedOutputSafe(safeData.TYPE, safeData.DATA);
            viewerWrapper.appendChild(pre);
        }
        contentSection.appendChild(viewerWrapper);
        detailContainer.appendChild(contentSection);
        contentArea.appendChild(detailContainer);
    }


    renderGraphSVG(graphData, meta = {}) {
        let vertices = meta.vertices || (Array.isArray(graphData) ? graphData.length : 0);
        let graphType = meta.graphType || meta.type || 'undirected';
        let representation = meta.representation || 'adjacency-list';
        let isWeighted = !!meta.isWeighted;

        // Try to auto-detect representation if not provided
        if (!representation) {
            if (Array.isArray(graphData) && graphData.length > 0) {
                if (Array.isArray(graphData[0]) && typeof graphData[0][0] === 'number') {
                    representation = 'adjacency-matrix';
                } else if (Array.isArray(graphData[0]) && Array.isArray(graphData[0][0])) {
                    representation = 'edge-list';
                } else {
                    representation = 'adjacency-list';
                }
            }
        }

        let edges = [];
        let weights = {};

        // --- Collect edges & weights ---
        if (representation === 'edge-list') {
            for (let edge of graphData) {
                let [u, v, w] = edge;
                edges.push([u, v]);
                if (edge.length > 2) {
                    isWeighted = true;
                    weights[`${u}-${v}`] = w;
                }
            }
        } else if (representation === 'adjacency-matrix') {
            vertices = graphData.length;
            for (let i = 0; i < vertices; i++) {
                for (let j = 0; j < vertices; j++) {
                    if (graphData[i][j] !== 0) {
                        if (graphType === 'undirected' && i > j) continue;
                        edges.push([i, j]);
                        if (graphData[i][j] !== 1) {
                            isWeighted = true;
                            weights[`${i}-${j}`] = graphData[i][j];
                        }
                    }
                }
            }
        } else if (representation === 'adjacency-list') {
            let seen = new Set();
            vertices = graphData.length;
            for (let i = 0; i < vertices; i++) {
                for (let neighbor of graphData[i]) {
                    let v, w;
                    if (typeof neighbor === 'object' && neighbor !== null) {
                        v = neighbor.node;
                        w = neighbor.weight;
                        isWeighted = true;
                    } else {
                        v = neighbor;
                    }
                    let edgeKey = graphType === 'undirected' ?
                        `${Math.min(i, v)}-${Math.max(i, v)}` : `${i}-${v}`;
                    if (graphType === 'undirected' && seen.has(edgeKey)) continue;
                    edges.push([i, v]);
                    if (typeof w !== 'undefined') weights[`${i}-${v}`] = w;
                    if (graphType === 'undirected') seen.add(edgeKey);
                }
            }
        }

        // --- SVG layout ---
        const svgWidth = 900, svgHeight = 600;
        const nodeRadius = 22, arrowSize = 10;
        const centerX = svgWidth / 2, centerY = svgHeight / 2;
        const radius = Math.min(svgWidth, svgHeight) * 0.42;

        // --- Position nodes in a circle ---
        let nodePositions = [];
        for (let i = 0; i < vertices; i++) {
            const angle = (2 * Math.PI * i) / vertices - Math.PI / 2;
            nodePositions.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }

        // --- SVG drawing ---
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" class="svg-graph">\n`;

        if (graphType === 'directed') {
            svg += `
            <defs>
                <marker id="arrowhead" markerWidth="${arrowSize}" markerHeight="${arrowSize}"
                        refX="${arrowSize}" refY="${arrowSize / 2}" orient="auto">
                    <polygon points="0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}" fill="#666"/>
                </marker>
            </defs>`;
        }

        // Draw edges first
        edges.forEach(([u, v]) => {
            const start = nodePositions[u];
            const end = nodePositions[v];

            if (u === v) {
                // Self-loop
                const loopRadius = 34;
                const angle = (2 * Math.PI * u) / vertices - Math.PI / 2;
                svg += `<path d="M ${start.x},${start.y}
                        A ${loopRadius},${loopRadius} 0 1,1 ${start.x + 1},${start.y + 1}"
                    fill="none" stroke="#666" stroke-width="2" 
                    ${graphType === 'directed' ? 'marker-end="url(#arrowhead)"' : ''} />`;
            } else {
                // Standard edge
                const dx = end.x - start.x, dy = end.y - start.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const offsetStart = nodeRadius / dist;
                const offsetEnd = (nodeRadius + (graphType === 'directed' ? arrowSize : 0)) / dist;
                const x1 = start.x + dx * offsetStart;
                const y1 = start.y + dy * offsetStart;
                const x2 = end.x - dx * offsetEnd;
                const y2 = end.y - dy * offsetEnd;
                svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                        stroke="#666" stroke-width="2" 
                        ${graphType === 'directed' ? 'marker-end="url(#arrowhead)"' : ''} />`;

                // Draw weight if needed
                if (isWeighted && typeof weights[`${u}-${v}`] !== "undefined") {
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    svg += `<rect x="${midX - 15}" y="${midY - 11}" width="30" height="20" fill="#fff" stroke="none"/>`;
                    svg += `<text x="${midX}" y="${midY + 5}" text-anchor="middle" font-size="14" fill="#333">${weights[`${u}-${v}`]}</text>`;
                }
            }
        });

        // Draw nodes
        for (let i = 0; i < vertices; i++) {
            const pos = nodePositions[i];
            svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}" fill="#4a5568" stroke="#2d3748" stroke-width="2"/>`;
            svg += `<text x="${pos.x}" y="${pos.y + 6}" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold">${i}</text>`;
        }

        svg += `</svg>`;
        return `<div class="graph-visualization">${svg}</div>`;
    }



    formatDateSafe(dateString) {
        try {
            if (!dateString || dateString === 'Invalid Date') {
                return 'Data necunoscută';
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Data necunoscută';
            }

            return this.formatDate(dateString);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Data necunoscută';
        }
    }

    formatParsedOutputSafe(type, rawData) {
        const safeHTML = str =>
            String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

        try {

            if (!rawData) {
                return `<div class="output-item"><div class="matrix-output">Nu există date disponibile</div></div>`;
            }

            console.log('Parsing data for type:', type, 'Data:', rawData);

            if (type === 'number_array') {
                let array;
                if (typeof rawData === 'string') {
                    array = JSON.parse(rawData);
                } else if (Array.isArray(rawData)) {
                    array = rawData;
                } else {
                    throw new Error('Format de date invalid pentru number_array');
                }

                const text = array.join(', ');
                return `<div class="output-item"><div class="array-output number-array-output">${safeHTML(text)}</div></div>`;
            }

            if (type === 'character_array') {
                let str;
                if (typeof rawData === 'string') {
                    try {
                        const parsed = JSON.parse(rawData);
                        str = Array.isArray(parsed) ? parsed[0] : parsed;
                    } catch {
                        str = rawData;
                    }
                } else if (Array.isArray(rawData)) {
                    str = rawData[0] || rawData.join('');
                } else {
                    str = String(rawData);
                }

                return `<div class="output-item"><div class="array-output character-array-output">${safeHTML(str)}</div></div>`;
            }

            if (type === 'matrix' || type === 'graph') {
                let arr = (typeof rawData === 'string') ? JSON.parse(rawData) : rawData;

                let html = `<div class="output-item"><div class="matrix-output">`;

                if (
                    Array.isArray(arr) &&
                    arr.length > 0 &&
                    Array.isArray(arr[0])
                ) {
                    arr.forEach((row, i) => {
                        if (row.length > 0 && typeof row[0] === "object" && row[0] !== null && "node" in row[0] && "weight" in row[0]) {
                            const formatted = row.map(obj => {
                                let w = obj.weight;
                                if (typeof w === 'object' && w !== null) w = Object.values(w)[0];
                                return `${safeHTML(obj.node)}(${safeHTML(w)})`;
                            }).join(', ');
                            html += `${i}: ${formatted}\n`;
                        } else {
                            html += `${i}: ${row.map(val => safeHTML(val)).join(', ')}\n`;
                        }
                    });
                }
                else if (
                    Array.isArray(arr) &&
                    arr.length > 0 &&
                    Array.isArray(arr[0]) &&
                    (typeof arr[0][0] === "number" || typeof arr[0][0] === "string")
                ) {
                    arr.forEach(row => {
                        html += row.map(val => String(val).padStart(4, ' ')).join(' ') + '\n';
                    });
                }
                else if (Array.isArray(arr)) {
                    arr.forEach(row => {
                        if (Array.isArray(row)) {
                            html += row.join(' ') + '\n';
                        } else if (typeof row === "object" && row !== null && "node" in row && "weight" in row) {
                            html += `${safeHTML(row.node)}(${safeHTML(row.weight)})\n`;
                        } else {
                            html += safeHTML(row) + '\n';
                        }
                    });
                } else {
                    html += safeHTML(JSON.stringify(arr, null, 2));
                }

                html += `</div></div>`;
                return html;
            }


            if (type === 'tree') {
                let parent;
                try {
                    if (typeof rawData === 'string') {
                        parent = JSON.parse(rawData);
                    } else if (Array.isArray(rawData)) {
                        parent = rawData;
                    } else {
                        parent = String(rawData).split(',').map(x => parseInt(x));
                    }

                    if (!Array.isArray(parent)) {
                        parent = String(parent).split(',').map(x => parseInt(x));
                    }
                } catch {
                    parent = String(rawData).replace(/[\[\]\s]/g, '').split(',').map(x => parseInt(x));
                }

                const nodes = parent.length;
                return `<div class="output-item">
                        <div class="tree-output">
                    Node:&nbsp;&nbsp;${Array.from({ length: nodes }, (_, i) => String(i).padStart(3, ' ')).join(' ')}\n
                    Parent:${parent.map(p => String(p).padStart(3, ' ')).join(' ')}
                        </div>
                    </div>`;
            }

            const displayData = typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2);
            return `<div class="output-item"><div class="matrix-output">${safeHTML(displayData)}</div></div>`;

        } catch (err) {
            console.error('Error parsing data:', err, 'Type:', type, 'Raw data:', rawData);
            const errorData = typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2);
            return `<div class="output-item">
                    <div class="error-message">Eroare la parsarea datelor: ${err.message}</div>
                    <div class="matrix-output">${safeHTML(errorData)}</div>
                </div>`;
        }
    }


    formatTypeName(type) {
        const typeNames = {
            'number_array': 'Number Array',
            'character_array': 'Character Array',
            'matrix': 'Matrix',
            'graph': 'Graph',
            'tree': 'Tree'
        };
        return typeNames[type] || type;
    }

    getTypeColor(type) {
        const colors = {
            'number_array': '#3498db',
            'character_array': '#2ecc71',
            'matrix': '#e74c3c',
            'graph': '#f39c12',
            'tree': '#9b59b6'
        };
        return colors[type] || '#95a5a6';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        }
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }

        return date.toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    async handleStatsClick() {
        if (this.elements.expandedPanel.classList.contains('active')) {
            this.closePanel();
            return;
        }

        this.openPanel();
        await this.loadStatistics();
    }

    async handleEditClick() {
        if (this.elements.expandedPanel.classList.contains('active')) {
            this.closePanel();
            return;
        }

        this.openPanel();
        await this.loadEditForm();
    }

    async handleHistoryClick() {
        if (this.elements.expandedPanel.classList.contains('active')) {
            this.closePanel();
            return;
        }
        this.openPanel();
        await this.loadHistory();
    }

    handleOutsideClick(e) {
        if (e.target.closest('.history-card')) {
            return;
        }

        if (this.elements.expandedPanel.classList.contains('active') &&
            !this.elements.expandedPanel.contains(e.target) &&
            !this.elements.statsBtn.contains(e.target) &&
            !this.elements.editBtn.contains(e.target) &&
            !this.elements.historyBtn.contains(e.target)) {
            this.closePanel();
        }
    }

    openPanel() {
        this.elements.expandedPanel.classList.add('active');
        this.elements.profileContainer.classList.add('panel-open');
        if (this.elements.overlay) this.elements.overlay.classList.add('active');
    }

    closePanel() {
        this.elements.expandedPanel.classList.remove('active');
        this.elements.profileContainer.classList.remove('panel-open');
        if (this.elements.overlay) this.elements.overlay.classList.remove('active');
        this.elements.statsBtn.classList.remove('active');
        this.elements.editBtn.classList.remove('active');
        this.elements.historyBtn.classList.remove('active');


        setTimeout(() => {
            this.elements.panelContent.innerHTML = '';
        }, 300);
    }

    async loadStatistics() {
        this.elements.panelContent.innerHTML = '<p class="stats-loading">Se încarcă statisticile...</p>';

        try {
            const res = await fetch(this.endpoints.stats, { credentials: 'include' });
            const json = await res.json();

            if (!res.ok) throw new Error(json.error || 'Unknown error');

            this.renderStatistics(json.data);
        } catch (err) {
            this.showError(err.message);
        }
    }

    renderStatistics(data) {
        this.elements.panelContent.innerHTML = '';

        const header = document.createElement('h3');
        header.className = 'stats-header';
        header.textContent = 'Statistics';
        this.elements.panelContent.appendChild(header);

        if (!data || !data.length) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'stats-empty';
            emptyMsg.textContent = 'No statistical data available.';
            this.elements.panelContent.appendChild(emptyMsg);
            return;
        }

        this.elements.panelContent.appendChild(this.buildBars(data));
    }

    buildBars(rows) {
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-list';
        const palette = ['#007bff', '#ff4757', '#ffa502', '#2ed573', '#8e44ad'];

        rows.forEach((row, idx) => {
            const barRow = this.createBarRow(row, palette[idx % palette.length], idx);
            wrapper.appendChild(barRow);
        });

        return wrapper;
    }

    createBarRow(data, color, index) {
        const row = document.createElement('div');
        row.className = 'bar-row';

        const label = document.createElement('span');
        label.className = 'bar-label';
        label.textContent = data.TYPE;

        const track = document.createElement('div');
        track.className = 'bar-track';

        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = '0%';
        fill.style.background = color;

        const value = document.createElement('span');
        value.className = 'bar-value';
        value.textContent = `${data.TYPE_COUNT} (${data.PERCENTAGE}%)`;

        track.appendChild(fill);
        row.append(label, track, value);

        setTimeout(() => {
            fill.style.width = `${data.PERCENTAGE}%`;
        }, 100 + (index * 50));

        return row;
    }

    async loadEditForm() {
        const formHTML = this.getEditFormTemplate();
        this.elements.panelContent.innerHTML = formHTML;

        const form = document.getElementById('editProfileForm');
        await this.populateForm();
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    getEditFormTemplate() {
        return `
            <h3 class="stats-header">Edit Profile</h3>
            <form id="editProfileForm" class="edit-form">
                <div class="form-group">
                    <label class="form-label" for="username">Username</label>
                    <input type="text" id="username" name="username" class="form-input" 
                        autocomplete="username" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="email">Email</label>
                    <input type="email" id="email" name="email" class="form-input" 
                        autocomplete="email" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" name="currentPassword" class="form-input" 
                        autocomplete="current-password" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="newPassword">New Password (leave blank if unchanged)</label>
                    <input type="password" id="newPassword" name="newPassword" class="form-input"
                        autocomplete="new-password">
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" class="form-input"
                        autocomplete="new-password">
                </div>
                <button type="submit" class="submit-button">Save Changes</button>
            </form>
        `;
    }

    async populateForm() {
        try {
            const res = await fetch(this.endpoints.userData, {
                credentials: 'include'
            });
            const userData = await res.json();

            if (res.ok && userData) {
                document.getElementById('username').value = userData.username || '';
                document.getElementById('email').value = userData.email || '';
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            this.showFormError('Failed to load user data');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = {
            username: form.username.value,
            email: form.email.value,
            currentPassword: form.currentPassword.value,
            newPassword: form.newPassword.value,
            confirmPassword: form.confirmPassword.value
        };

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            this.showFormError('New passwords do not match');
            return;
        }

        try {
            const res = await fetch(this.endpoints.updateProfile, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                this.showFormSuccess('Profile updated successfully');
                if (formData.username !== this.elements.usernameEl.textContent) {
                    this.elements.usernameEl.textContent = formData.username;
                }
            } else {
                this.showFormError(data.error || 'Failed to update profile');
            }
        } catch (err) {
            this.showFormError('An error occurred. Please try again.');
            console.error(err);
        }
    }

    async handleLogout() {
        try {
            console.log('Logout clicked');

            const response = await fetch(this.endpoints.logout, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            window.location.replace('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=login');
        } catch (err) {
            console.error('Logout error:', err);
            alert('Failed to logout. Please try again.');
        }
    }

    showDeleteConfirmModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'delete-modal';
            modal.innerHTML = `
                <form id="deleteAccountForm">
                    <input 
                        type="text"
                        name="username"
                        id="username"
                        value="<?php echo isset($_SESSION['username']) ? $_SESSION['username'] : ''; ?>"
                        autocomplete="username"
                        class="hidden-username"
                    >
                    <div class="delete-modal-content">
                        <h3>Confirm Account Deletion</h3>
                        <p>Please enter your password to confirm account deletion:</p>
                        <input type="password" id="deleteConfirmPassword" class="form-input" placeholder="Enter your password" autocomplete="current-password">
                        <div class="modal-buttons">
                            <button class="submit-button confirm-delete" type="submit">Delete Account</button>
                            <button class="cancel-button" type="button">Cancel</button>
                        </div>
                    </div>
                </form>
            `;

            document.body.appendChild(modal);

            const form = modal.querySelector('#deleteAccountForm');
            const cancelBtn = modal.querySelector('.cancel-button');
            const input = modal.querySelector('#deleteConfirmPassword');

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const password = input.value;
                modal.remove();
                resolve(password);
            });

            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });

            input.focus();
        });
    }

    async handleDeleteAccount() {
        try {
            const userResponse = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?action=getUserData');
            const userData = await userResponse.json();

            if (!userData.success) {
                alert('Failed to verify user session');
                return;
            }

            const username = userData.username;

            const password = await this.showDeleteConfirmModal();
            if (!password) {
                return;
            }

            const passwordCheck = await fetch(this.endpoints.checkPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const passwordResult = await passwordCheck.json();
            if (!passwordResult.success) {
                alert('Incorrect password. Please try again.');
                return;
            }

            const response = await fetch(this.endpoints.delete, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Delete account failed');
            }

            window.location.replace('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/index.php?page=login');
        } catch (err) {
            console.error('Delete account error: ', err);
            alert('Failed to delete account. Please try again.');
        }
    }

    showFormError(message) {
        const existingError = document.querySelector('.form-error');
        if (existingError) existingError.remove();

        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = message;

        const form = document.getElementById('editProfileForm');
        form.insertBefore(error, form.querySelector('.submit-button'));
    }

    showFormSuccess(message) {
        const existingSuccess = document.querySelector('.form-success');
        if (existingSuccess) existingSuccess.remove();

        const success = document.createElement('div');
        success.className = 'form-success';
        success.textContent = message;

        const form = document.getElementById('editProfileForm');
        form.insertBefore(success, form.firstChild);
    }

    showError(message) {
        this.elements.panelContent.innerHTML = '';
        const errorMsg = document.createElement('div');
        errorMsg.className = 'stats-error';
        errorMsg.textContent = `Error: ${message}`;
        this.elements.panelContent.appendChild(errorMsg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});