document.addEventListener('DOMContentLoaded', function () {
    const inputType = document.getElementById('inputType');
    const outputArea = document.getElementById('outputArea');
    const clearButton = document.getElementById('clearOutput');
    const copyButton = document.getElementById('copyOutput');
    const exportCSVButton = document.getElementById('exportCSV');
    const exportJSONButton = document.getElementById('exportJSON');

    let currentGeneratedData = null;
    let currentDataType = null;
    let currentGraphMetadata = null;

    const controls = {
        numerical: document.querySelector('.numerical-controls'),
        character: document.querySelector('.character-controls'),
        matrix: document.querySelector('.matrix-controls'),
        graphs: document.querySelector('.graphs-controls'),
        tree: document.querySelector('.tree-controls')
    };

    const buttons = {
        numerical: document.getElementById('generateBtn'),
        character: document.getElementById('generateCharacter'),
        matrix: document.getElementById('generateMatrix'),
        graphs: document.getElementById('generateGraph'),
        tree: document.getElementById('generateTree')
    };

    // Create visualize button
    const visualizeButton = document.createElement('button');
    visualizeButton.className = 'visualize-button';
    visualizeButton.id = 'visualizeGraph';
    visualizeButton.style.display = 'none';
    visualizeButton.title = 'Visualize Graph';
    visualizeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="4" cy="6" r="2"/>
            <circle cx="20" cy="6" r="2"/>
            <circle cx="4" cy="18" r="2"/>
            <circle cx="20" cy="18" r="2"/>
            <line x1="12" y1="9" x2="12" y2="3"/>
            <line x1="9.5" y1="10.5" x2="6" y2="7"/>
            <line x1="14.5" y1="10.5" x2="18" y2="7"/>
            <line x1="9.5" y1="13.5" x2="6" y2="17"/>
            <line x1="14.5" y1="13.5" x2="18" y2="17"/>
        </svg>
        Visualize
    `;

    const outputButtons = document.querySelector('.output-buttons');
    outputButtons.insertBefore(visualizeButton, copyButton);

    function setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    function displayOutput(content, isError = false) {
        outputArea.classList.remove('empty');
        if (isError) {
            outputArea.innerHTML = `<div class="error-message">${content}</div>`;
        } else {
            outputArea.innerHTML = `<div class="output-content">${content}</div>`;
            outputArea.classList.add('success');
            setTimeout(() => outputArea.classList.remove('success'), 1500);
        }
        clearButton.style.display = 'block';
        copyButton.style.display = 'block';
        exportCSVButton.style.display = 'block';
        exportJSONButton.style.display = 'block';

        if (currentDataType === 'graph' && currentGraphMetadata && currentGraphMetadata.vertices <= 10) {
            visualizeButton.style.display = 'block';
        } else {
            visualizeButton.style.display = 'none';
        }
    }

    function visualizeGraph() {
        if (!currentGeneratedData || currentDataType !== 'graph' || !currentGraphMetadata) return;

        const { vertices, graphType, representation } = currentGraphMetadata;
        if (vertices > 10) {
            displayOutput('Graph visualization is only available for graphs with 10 or fewer vertices', true);
            return;
        }

        let edges = [];
        let isWeighted = false;
        let weights = {};

        if (representation === 'edge-list') {
            edges = [];
            for (let edge of currentGeneratedData) {
                let u = edge[0], v = edge[1];
                edges.push([u, v]);
                if (edge.length > 2) {
                    isWeighted = true;
                    weights[`${u}-${v}`] = edge[2];
                }
            }
        } else if (representation === 'adjacency-matrix') {
            for (let i = 0; i < vertices; i++) {
                for (let j = 0; j < vertices; j++) {
                    if (currentGeneratedData[i][j] !== 0) {
                        if (graphType === 'undirected' && i > j) continue;
                        edges.push([i, j]);
                        if (currentGeneratedData[i][j] !== 1) {
                            isWeighted = true;
                            weights[`${i}-${j}`] = currentGeneratedData[i][j];
                        }
                    }
                }
            }
        } else if (representation === 'adjacency-list') {
            let seen = new Set();
            for (let i = 0; i < vertices; i++) {
                for (let neighbor of currentGeneratedData[i]) {
                    let v, w;
                    if (typeof neighbor === 'object') {
                        v = neighbor.node;
                        w = neighbor.weight;
                        isWeighted = true;
                    } else {
                        v = neighbor;
                    }
                    let edgeKey = graphType === 'undirected' ?
                        `${Math.min(i, v)}-${Math.max(i, v)}` :
                        `${i}-${v}`;
                    if (graphType === 'undirected' && seen.has(edgeKey)) continue;
                    edges.push([i, v]);
                    if (typeof w !== 'undefined') {
                        weights[`${i}-${v}`] = w;
                    }
                    if (graphType === 'undirected') seen.add(edgeKey);
                }
            }
        }

        // Create SVG
        const svgWidth = 600;
        const svgHeight = 400;
        const nodeRadius = 20;
        const arrowSize = 10;

        const centerX = svgWidth / 2;
        const centerY = svgHeight / 2;
        const radius = Math.min(svgWidth, svgHeight) * 0.35;

        let nodePositions = [];
        for (let i = 0; i < vertices; i++) {
            const angle = (2 * Math.PI * i) / vertices - Math.PI / 2;
            nodePositions.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }

        let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

        if (graphType === 'directed') {
            svgContent += `
                <defs>
                    <marker id="arrowhead" markerWidth="${arrowSize}" markerHeight="${arrowSize}" 
                            refX="${arrowSize}" refY="${arrowSize / 2}" orient="auto">
                        <polygon points="0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}" 
                                 fill="#666" />
                    </marker>
                </defs>`;
        }

        edges.forEach(([u, v]) => {
            const start = nodePositions[u];
            const end = nodePositions[v];

            if (u === v) {
                const loopRadius = 30;
                const angle = (2 * Math.PI * u) / vertices - Math.PI / 2;
                const cx = start.x + loopRadius * Math.cos(angle);
                const cy = start.y + loopRadius * Math.sin(angle);
                svgContent += `<path d="M ${start.x},${start.y} A ${loopRadius},${loopRadius} 0 1,1 ${start.x + 1},${start.y + 1}" 
                                     fill="none" stroke="#666" stroke-width="2"`;
                if (graphType === 'directed') {
                    svgContent += ` marker-end="url(#arrowhead)"`;
                }
                svgContent += `/>`;
            } else {
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const offsetStart = nodeRadius / distance;
                const offsetEnd = (nodeRadius + (graphType === 'directed' ? arrowSize : 0)) / distance;

                const x1 = start.x + dx * offsetStart;
                const y1 = start.y + dy * offsetStart;
                const x2 = end.x - dx * offsetEnd;
                const y2 = end.y - dy * offsetEnd;

                svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                                     stroke="#666" stroke-width="2"`;
                if (graphType === 'directed') {
                    svgContent += ` marker-end="url(#arrowhead)"`;
                }
                svgContent += `/>`;

                if (isWeighted && weights[`${u}-${v}`]) {
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    svgContent += `<rect x="${midX - 15}" y="${midY - 10}" width="30" height="20" 
                                         fill="white" stroke="none"/>`;
                    svgContent += `<text x="${midX}" y="${midY + 5}" 
                                         text-anchor="middle" font-size="14" fill="#333">
                                         ${weights[`${u}-${v}`]}</text>`;
                }
            }
        });

        for (let i = 0; i < vertices; i++) {
            const pos = nodePositions[i];
            svgContent += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}" 
                                   fill="#4a5568" stroke="#2d3748" stroke-width="2"/>`;
            svgContent += `<text x="${pos.x}" y="${pos.y + 5}" 
                                 text-anchor="middle" font-size="16" fill="white" 
                                 font-weight="bold">${i}</text>`;
        }

        svgContent += `</svg>`;

        displayOutput(`
            <div class="output-item">
                <div class="graph-visualization">
                    ${svgContent}
                </div>
                <div class="visualization-info">
                    <p>Graph Visualization (${vertices} vertices, ${edges.length} edges, ${graphType}${isWeighted ? ', weighted' : ''})</p>
                </div>
            </div>
        `);
    }

    visualizeButton.addEventListener('click', visualizeGraph);

    function copyToClipboard() {
        const outputContent = outputArea.querySelector('.output-content');
        if (!outputContent) {
            return;
        }

        let textToCopy = '';
        const outputItem = outputContent.querySelector('.output-item');
        if (outputItem) {
            const numberArrayOutput = outputItem.querySelector('.number-array-output');
            const stringOutput = outputItem.querySelector('.string-output');
            const matrixOutput = outputItem.querySelector('.matrix-output');
            const treeOutput = outputItem.querySelector('.tree-output');
            const graphOutput = outputItem.querySelector('.graph-output');

            if (numberArrayOutput) {
                textToCopy = numberArrayOutput.textContent.trim();
            } else if (stringOutput) {
                textToCopy = stringOutput.textContent.trim();
            } else if (matrixOutput) {
                let matrixText = matrixOutput.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
                textToCopy = matrixText.split('\n')
                    .map(line => line.trimStart())
                    .filter(line => line.length > 0)
                    .join('\n');
            } else if (treeOutput) {
                let treeText = treeOutput.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').split('\n')
                    .map(l => l.trim()).filter(l => l.length).map(l => l.replace(/^Node:\s+|^Parent:\s+/i, '')).join('\n');
                textToCopy = treeText;
            } else if (graphOutput) {
                let graphText = graphOutput.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
                textToCopy = graphText.split('\n')
                    .map(line => line.trimStart())
                    .filter(line => line.length > 0)
                    .join('\n');
            } else {
                let itemText = outputItem.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
                textToCopy = itemText.split('\n')
                    .map(line => line.trimStart())
                    .filter(line => line.length > 0)
                    .join('\n');
            }
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopyFeedback();
            }).catch(err => {
                console.error('Failed to copy: ', err);
                fallbackCopyTextToClipboard(textToCopy);
            });
        } else {
            fallbackCopyTextToClipboard(textToCopy);
        }
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopyFeedback();
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
    }

    function showCopyFeedback() {
        const originalText = copyButton.innerHTML;
        copyButton.classList.add('copied');
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"/>
            </svg>
            Copied!
        `;

        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = originalText;
        }, 2000);
    }

    function exportToCSV() {
        if (!currentGeneratedData) return;

        let csvContent = "";
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const timestamp = `${dateStr}_${timeStr}`;
        let filename = `${currentDataType}_${timestamp}.csv`;


        switch (currentDataType) {
            case 'number_array':
                csvContent = currentGeneratedData.join(',');
                break;
            case 'character_array':
                csvContent = currentGeneratedData;
                break;
            case 'matrix':
                csvContent = currentGeneratedData.map(row => row.join(',')).join('\n');
                break;
            case 'graph':
                if (Array.isArray(currentGeneratedData) && Array.isArray(currentGeneratedData[0])) {
                    csvContent = currentGeneratedData.map(row =>
                        Array.isArray(row) ? row.join(',') : row
                    ).join('\n');
                } else {
                    csvContent = JSON.stringify(currentGeneratedData);
                }
                break;
            case 'tree':
<<<<<<< HEAD
                if (Array.isArray(currentGeneratedData) && typeof currentGeneratedData[0] === 'number') {
                    csvContent = 'Node,Parent\n';
                    currentGeneratedData.forEach((parent, node) => {
                        csvContent += `${node},${parent}\n`;
                    });
                } else {
                    csvContent = currentGeneratedData.map(row =>
                        Array.isArray(row) ? row.join(',') : row
                    ).join('\n');
                }
=======
              
                csvContent = 'Parent list\n';
                currentGeneratedData.forEach(parent => {
                    csvContent += `${parent}\n`;
                });
>>>>>>> 167618764efb8ee8d80085924776ea7bc3266b9d
                break;
        }

        downloadFile(csvContent, filename, 'text/csv');
    }

    function exportToJSON() {
        if (!currentGeneratedData) return;

        let jsonData = {};
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const timestamp = `${dateStr}_${timeStr}`;
        let filename = `${currentDataType}_${timestamp}.json`;

        switch (currentDataType) {
            case 'number_array':
                jsonData = {
                    type: 'numerical_array',
                    data: currentGeneratedData,
                    metadata: {
                        length: currentGeneratedData.length,
                        min: Math.min(...currentGeneratedData),
                        max: Math.max(...currentGeneratedData)
                    }
                };
                break;
            case 'character_array':
                jsonData = {
                    type: 'character_array',
                    data: currentGeneratedData,
                    metadata: {
                        length: currentGeneratedData.length
                    }
                };
                break;
            case 'matrix':
                jsonData = {
                    type: 'matrix',
                    data: currentGeneratedData,
                    metadata: {
                        rows: currentGeneratedData.length,
                        columns: currentGeneratedData[0].length
                    }
                };
                break;
            case 'graph':
                jsonData = {
                    type: 'graph',
                    data: currentGeneratedData,
                    metadata: currentGraphMetadata
                };
                break;
            case 'tree':
                jsonData = {
                    type: 'tree',
                    data: currentGeneratedData,
                    metadata: {
                        nodes: Array.isArray(currentGeneratedData) ? currentGeneratedData.length : 0,
                        representation: document.getElementById('treeRepresentation').value
                    }
                };
                break;
        }

        const jsonContent = JSON.stringify(jsonData, null, 2);
        downloadFile(jsonContent, filename, 'application/json');
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
    }


    exportCSVButton.addEventListener('click', exportToCSV);
    exportJSONButton.addEventListener('click', exportToJSON);

    clearButton.addEventListener('click', function () {
        outputArea.classList.add('empty');
        outputArea.innerHTML = '<p>Generated content will appear here...</p>';
        clearButton.style.display = 'none';
        copyButton.style.display = 'none';
        exportCSVButton.style.display = 'none';
        exportJSONButton.style.display = 'none';
        visualizeButton.style.display = 'none';
        currentGeneratedData = null;
        currentDataType = null;
        currentGraphMetadata = null;
    });

    copyButton.addEventListener('click', copyToClipboard);

    inputType.addEventListener('change', function () {
        Object.values(controls).forEach(control => {
            if (control) control.style.display = 'none';
        });

        clearButton.click();

        const selectedType = inputType.value;
        if (controls[selectedType]) {
            controls[selectedType].style.display = 'block';
            controls[selectedType].style.animation = 'slideInRight 0.4s ease-out';
        }
    });

    buttons.numerical.addEventListener('click', async function () {
        const min = parseInt(document.getElementById('minValue').value);
        const max = parseInt(document.getElementById('maxValue').value);
        const length = parseInt(document.getElementById('arrayLength').value);
        const sortOrder = document.getElementById('sortOrder').value;

        if (isNaN(min) || isNaN(max) || isNaN(length) || length < 1) {
            displayOutput('Please fill in all fields correctly', true);
            return;
        }

        if (min > max) {
            displayOutput('Minimum value must be less than or equal to maximum value', true);
            return;
        }

        setLoading(this, true);

        let array = [];
        for (let i = 0; i < length; i++) {
            array.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }

        if (sortOrder === 'asc') {
            array.sort((a, b) => a - b);
        } else if (sortOrder === 'desc') {
            array.sort((a, b) => b - a);
        }

        currentGeneratedData = array;
        currentDataType = 'number_array';

        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'number_array',
                    array: array,
                    length: length,
                    minValue: min,
                    maxValue: max,
                    sortOrder: sortOrder || 'none'
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                displayOutput(`
                    <div class="output-item">
                        <div class="number-array-output">${array.join(', ')}</div>
                    </div>
                `);
            } else {
                throw new Error(data.message || 'Failed to generate array');
            }
        } catch (error) {
            displayOutput(`Error: ${error.message}`, true);
        } finally {
            setLoading(this, false);
        }
    });

    buttons.character.addEventListener('click', async function () {
        const charSet = document.getElementById('charSet').value;
        const length = parseInt(document.getElementById('stringLength').value);

        if (!charSet || isNaN(length) || length < 1) {
            displayOutput('Please fill in all fields correctly', true);
            return;
        }

        setLoading(this, true);

        let str = '';
        for (let i = 0; i < length; i++) {
            const idx = Math.floor(Math.random() * charSet.length);
            str += charSet.charAt(idx);
        }

        currentGeneratedData = str;
        currentDataType = 'character_array';

        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'character_array',
                    array: str,
                    length: length,
                    charSet: charSet
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                displayOutput(`
                    <div class="output-item">
                        <div class="string-output">${str}</div>
                    </div>
                `);
            } else {
                throw new Error(data.message || 'Failed to generate string');
            }
        } catch (error) {
            displayOutput(`Error: ${error.message}`, true);
        } finally {
            setLoading(this, false);
        }
    });


    const isMapCheckbox = document.getElementById('isMap');
    const minMaxControls = document.getElementById('minMaxControls');
    const maxMaxControls = document.getElementById('maxMaxControls');
    isMapCheckbox.addEventListener('change', function () {
        if (this.checked) {
            minMaxControls.style.display = 'none';
            maxMaxControls.style.display = 'none';
        } else {
            minMaxControls.style.display = '';
            maxMaxControls.style.display = '';
        }
    });

    buttons.matrix.addEventListener('click', async function () {
        const rows = parseInt(document.getElementById('numRows').value);
        const cols = parseInt(document.getElementById('numCols').value);
        const minV = parseInt(document.getElementById('minMatrixValue').value);
        const maxV = parseInt(document.getElementById('maxMatrixValue').value);
        const isMap = document.getElementById('isMap').checked;

        if (isNaN(rows) || rows < 1 || isNaN(cols) || cols < 1 || (!isMap && (isNaN(minV) || isNaN(maxV)))) {
            displayOutput('Please fill in all fields correctly', true);
            return;
        }

        if (!isMap && minV > maxV) {
            displayOutput('Minimum value must be less than or equal to maximum value', true);
            return;
        }

        setLoading(this, true);

        let matrix = [];
        for (let i = 0; i < rows; i++) {
            let row = [];
            for (let j = 0; j < cols; j++) {
                if (isMap) {
                    row.push(Math.random() < 0.5 ? 0 : 1);
                } else {
                    row.push(Math.floor(Math.random() * (maxV - minV + 1)) + minV);
                }
            }
            matrix.push(row);
        }

        currentGeneratedData = matrix;
        currentDataType = 'matrix';

        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'matrix',
                    array: matrix,
                    rows: rows,
                    cols: cols,
                    minValue: isMap ? 0 : minV,
                    maxValue: isMap ? 1 : maxV,
                    isMap: isMap
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                let matrixHtml = '<div class="output-item"><div class="matrix-output">';
                matrix.forEach(row => {
                    matrixHtml += row.map(val => String(val).padStart(4, ' ')).join(' ') + '<br>';
                });
                matrixHtml += '</div></div>';
                displayOutput(matrixHtml);
            } else {
                throw new Error(data.message || 'Failed to generate matrix');
            }
        } catch (error) {
            displayOutput(`Error: ${error.message}`, true);
        } finally {
            setLoading(this, false);
        }
    });

    buttons.graphs.addEventListener('click', async function () {
        const n = parseInt(document.getElementById('numVertices').value);
        const m = parseInt(document.getElementById('numEdges').value);
        const type = document.getElementById('graphType').value;
        const representation = document.getElementById('graphRepresentation').value;
        const isWeighted = document.getElementById('isWeightedGraph').checked;
        const isConnected = document.getElementById('isConnected').checked;
        const isBipartite = document.getElementById('isBipartite').checked;

        if (isNaN(n) || n < 1) {
            displayOutput('Please enter a valid number of vertices', true);
            return;
        }
        if (isNaN(m) || m < 0) {
            displayOutput('Please enter a valid number of edges', true);
            return;
        }

        let maxEdges;
        if (isBipartite) {
            const groupA = Math.floor(n / 2);
            const groupB = n - groupA;
            maxEdges = groupA * groupB;
        } else {
            maxEdges = (type === 'undirected') ? Math.floor(n * (n - 1) / 2) : n * (n - 1);
        }

        if (m > maxEdges) {
            displayOutput(`Number of edges (${m}) exceeds the maximum for the selected graph type: ${maxEdges}`, true);
            return;
        }

        setLoading(this, true);

        currentGraphMetadata = {
            vertices: n,
            edges: m,
            graphType: type,
            representation: representation,
            isConnected: isConnected,
            isBipartite: isBipartite,
            isWeighted: isWeighted
        };

        let graphData, displayHtml = '';

        let edgeSet = new Set();
        let edges = [];

        if (isConnected && !isBipartite) {
            for (let i = 1; i < n; i++) {
                const u = i;
                const v = Math.floor(Math.random() * i);
                const key = type === 'undirected' ? `${Math.min(u, v)}-${Math.max(u, v)}` : `${u}-${v}`;
                if (!edgeSet.has(key)) {
                    edgeSet.add(key);
                    const weight = isWeighted ? Math.floor(Math.random() * 100) + 1 : 1;
                    edges.push(isWeighted ? [u, v, weight] : [u, v]);
                }
            }
        }

        let attempts = 0;
        while (edges.length < m && attempts < m * 10) {
            const u = Math.floor(Math.random() * n);
            const v = Math.floor(Math.random() * n);
            if (u === v) continue;
            const key = type === 'undirected' ? `${Math.min(u, v)}-${Math.max(u, v)}` : `${u}-${v}`;
            if (!edgeSet.has(key)) {
                edgeSet.add(key);
                const weight = isWeighted ? Math.floor(Math.random() * 100) + 1 : 1;
                edges.push(isWeighted ? [u, v, weight] : [u, v]);
            }
            attempts++;
        }

        if (representation === 'adjacency-matrix') {
            let matrix = Array.from({ length: n }, () => Array(n).fill(0));
            for (let [u, v, w] of edges) {
                matrix[u][v] = w;
                if (type === 'undirected') matrix[v][u] = w;
            }
            graphData = matrix;
            displayHtml = '<div class="output-item"><div class="matrix-output">';
            matrix.forEach(row => displayHtml += row.map(v => String(v).padStart(3, ' ')).join(' ') + '<br>');
            displayHtml += '</div></div>';

        } else if (representation === 'adjacency-list') {
            let adjList = Array.from({ length: n }, () => []);
            for (let [u, v, w] of edges) {
                if (isWeighted) {
                    adjList[u].push({ node: v, weight: w });
                    if (type === 'undirected') adjList[v].push({ node: u, weight: w });
                } else {
                    adjList[u].push(v);
                    if (type === 'undirected') adjList[v].push(u);
                }
            }
            graphData = adjList;
            displayHtml = '<div class="output-item"><div class="graph-output">';
            adjList.forEach((neigh, i) => {
                const formatted = neigh.map(n => typeof n === 'object' ? `${n.node}(${n.weight})` : n).join(', ');
                displayHtml += `${i}: ${formatted}<br>`;
            });
            displayHtml += '</div></div>';

        } else if (representation === 'edge-list') {
            graphData = edges;
            displayHtml = '<div class="output-item"><div class="graph-output">';
            edges.forEach(([u, v, w]) => {
                displayHtml += `${u} ${v}${isWeighted ? ` (weight: ${w})` : ''}<br>`;
            });
            displayHtml += '</div></div>';
        }

        currentGeneratedData = graphData;
        currentDataType = 'graph';

        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'graph',
                    array: graphData,
                    vertices: n,
                    edges: m,
                    graphType: type,
                    representation: representation,
                    isConnected: isConnected,
                    isBipartite: isBipartite,
                    isWeighted: isWeighted
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                displayOutput(displayHtml);
            } else {
                throw new Error(data.message || 'Failed to generate graph');
            }
        } catch (error) {
            displayOutput(`Error: ${error.message}`, true);
        } finally {
            setLoading(this, false);
        }
    });

    buttons.tree.addEventListener('click', async function () {
        const n = parseInt(document.getElementById('numNodes').value);
        const representation = document.getElementById('treeRepresentation').value;
        const isWeighted = document.getElementById('isWeightedTree').checked;

        if (isNaN(n) || n < 1) {
            displayOutput('Please enter a valid number of nodes', true);
            return;
        }

        setLoading(this, true);

        let treeData;
        let displayHtml = '';

        if (representation === 'parent-list') {
            let parent = new Array(n).fill(-1);
            parent[0] = -1;

            for (let i = 1; i < n; i++) {
                const p = Math.floor(Math.random() * i);
                parent[i] = p;
            }

            treeData = parent;
            displayHtml = `
                <div class="output-item">
                    <div class="tree-output"> Node:   ${Array.from({ length: n }, (_, i) => String(i).padStart(3, ' ')).join(' ')}<br> Parent: ${parent.map(p => String(p).padStart(3, ' ')).join(' ')}
                    </div>
                </div>
            `;

        } else if (representation === 'adjacency-list') {
            let adjList = [];
            for (let i = 0; i < n; i++) {
                adjList.push([]);
            }

            for (let i = 1; i < n; i++) {
                const parent = Math.floor(Math.random() * i);
                adjList[parent].push(i);
                adjList[i].push(parent);
            }

            treeData = adjList;
            displayHtml = '<div class="output-item"><div class="graph-output">';
            adjList.forEach((neighbors, i) => {
                displayHtml += `${i}: ${neighbors.join(', ')}<br>`;
            });
            displayHtml += '</div></div>';

        } else if (representation === 'adjacency-matrix') {
            let adj = [];
            for (let i = 0; i < n; i++) {
                adj.push(new Array(n).fill(0));
            }

            for (let i = 1; i < n; i++) {
                const parent = Math.floor(Math.random() * i);
                adj[parent][i] = 1;
                adj[i][parent] = 1;
            }

            treeData = adj;
            displayHtml = '<div class="output-item"><div class="matrix-output">';
            adj.forEach((row, i) => {
                displayHtml += row.join(' ') + '<br>';
            });
            displayHtml += '</div></div>';
        }

        currentGeneratedData = treeData;
        currentDataType = 'tree';

        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'tree',
                    array: treeData,
                    nodes: n,
                    representation: representation
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                displayOutput(displayHtml);
            } else {
                throw new Error(data.message || 'Failed to generate tree');
            }
        } catch (error) {
            displayOutput(`Error: ${error.message}`, true);
        } finally {
            setLoading(this, false);
        }
    });
});