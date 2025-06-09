document.addEventListener('DOMContentLoaded', function() {
    const inputType = document.getElementById('inputType');
    const outputArea = document.getElementById('outputArea');
    const clearButton = document.getElementById('clearOutput');
    const copyButton = document.getElementById('copyOutput');
    const exportCSVButton = document.getElementById('exportCSV');
    const exportJSONButton = document.getElementById('exportJSON');
    
    let currentGeneratedData = null;
    let currentDataType = null;
    
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
    }

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
    
        
        switch(currentDataType) {
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
        
                csvContent = 'Adjacency Matrix\n';
                csvContent += currentGeneratedData.map(row => row.join(',')).join('\n');
                break;
            case 'tree':
              
                csvContent = 'Parent list\n';
                currentGeneratedData.forEach(parent => {
                    csvContent += `${parent}\n`;
                });
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
        
        switch(currentDataType) {
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
                    adjacency_matrix: currentGeneratedData,
                    metadata: {
                        vertices: currentGeneratedData.length,
                        graph_type: document.getElementById('graphType').value
                    }
                };
                break;
            case 'tree':
                jsonData = {
                    type: 'tree',
                    parent_list: currentGeneratedData,
                    metadata: {
                        nodes: currentGeneratedData.length,
                        root: currentGeneratedData.indexOf(-1)
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

    clearButton.addEventListener('click', function() {
        outputArea.classList.add('empty');
        outputArea.innerHTML = '<p>Generated content will appear here...</p>';
        clearButton.style.display = 'none';
        copyButton.style.display = 'none';
        exportCSVButton.style.display = 'none';
        exportJSONButton.style.display = 'none';
        currentGeneratedData = null;
        currentDataType = null;
    });

    copyButton.addEventListener('click', copyToClipboard);

    inputType.addEventListener('change', function() {
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

    buttons.numerical.addEventListener('click', async function() {
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

    buttons.character.addEventListener('click', async function() {
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

    buttons.matrix.addEventListener('click', async function() {
        const rows = parseInt(document.getElementById('numRows').value);
        const cols = parseInt(document.getElementById('numCols').value);
        const minV = parseInt(document.getElementById('minMatrixValue').value);
        const maxV = parseInt(document.getElementById('maxMatrixValue').value);

        if (isNaN(rows) || rows < 1 || isNaN(cols) || cols < 1 || isNaN(minV) || isNaN(maxV)) {
            displayOutput('Please fill in all fields correctly', true);
            return;
        }

        if (minV > maxV) {
            displayOutput('Minimum value must be less than or equal to maximum value', true);
            return;
        }

        setLoading(this, true);

        let matrix = [];
        for (let i = 0; i < rows; i++) {
            let row = [];
            for (let j = 0; j < cols; j++) {
                row.push(Math.floor(Math.random() * (maxV - minV + 1)) + minV);
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
                    minValue: minV,
                    maxValue: maxV
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

    buttons.graphs.addEventListener('click', async function() {
        const n = parseInt(document.getElementById('numVertices').value);
        const m = parseInt(document.getElementById('numEdges').value);
        const type = document.getElementById('graphType').value;

        if (isNaN(n) || n < 1) {
            displayOutput('Please enter a valid number of vertices', true);
            return;
        }
        if (isNaN(m) || m < 0) {
            displayOutput('Please enter a valid number of edges', true);
            return;
        }

        const maxEdges = (type === 'undirected') 
            ? Math.floor(n * (n - 1) / 2) 
            : n * (n - 1);
            
        if (m > maxEdges) {
            displayOutput(`Number of edges (${m}) exceeds the maximum for ${type} graph: ${maxEdges}`, true);
            return;
        }

        setLoading(this, true);

        let adj = [];
        for (let i = 0; i < n; i++) {
            adj.push(new Array(n).fill(0));
        }

        let edgesAdded = 0;
        let attempts = 0;
        const maxAttempts = m * 10;

        while (edgesAdded < m && attempts < maxAttempts) {
            const u = Math.floor(Math.random() * n);
            const v = Math.floor(Math.random() * n);
            attempts++;

            if (u === v) continue;

            if (type === 'undirected') {
                if (adj[u][v] === 0) {
                    adj[u][v] = 1;
                    adj[v][u] = 1;
                    edgesAdded++;
                }
            } else {
                if (adj[u][v] === 0) {
                    adj[u][v] = 1;
                    edgesAdded++;
                }
            }
        }
        currentGeneratedData = adj;
        currentDataType = 'graph';

        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'graph',
                    array: adj,
                    vertices: n,
                    edges: edgesAdded,
                    graphType: type
                }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                let graphHtml = `<div class="output-item"><div class="matrix-output">`;
                adj.forEach((row, i) => {
                    graphHtml += row.join(' ') + '<br>';
                });
                graphHtml += '</div></div>';
                displayOutput(graphHtml);
            } else {
                throw new Error(data.message || 'Failed to generate graph');
            }
        } catch (error) {
            displayOutput(`Error: ${error.message}`, true);
        } finally {
            setLoading(this, false);
        }
    });


    buttons.tree.addEventListener('click', async function() {
        const n = parseInt(document.getElementById('numNodes').value);

        if (isNaN(n) || n < 1) {
            displayOutput('Please enter a valid number of nodes', true);
            return;
        }

        setLoading(this, true);

        let parent = new Array(n).fill(-1);
        parent[0] = -1;

        for (let i = 1; i < n; i++) {
            const p = Math.floor(Math.random() * i);
            parent[i] = p;
        }

        currentGeneratedData = parent;
        currentDataType = 'tree';

        try {
            const response = await fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'tree',
                    array: parent,
                    nodes: n
                }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                displayOutput(`
                    <div class="output-item">
                        <div class="tree-output"> Node:   ${Array.from({length: n}, (_, i) => String(i).padStart(3, ' ')).join(' ')}<br> Parent: ${parent.map(p => String(p).padStart(3, ' ')).join(' ')}
                        </div>
                    </div>
                `);
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