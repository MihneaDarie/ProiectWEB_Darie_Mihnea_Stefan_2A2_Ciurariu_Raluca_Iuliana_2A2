document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const inputType = document.getElementById('inputType');
    const outputArea = document.getElementById('outputArea');
    const clearButton = document.getElementById('clearOutput');
    
    // Control panels
    const controls = {
        numerical: document.querySelector('.numerical-controls'),
        character: document.querySelector('.character-controls'),
        matrix: document.querySelector('.matrix-controls'),
        graphs: document.querySelector('.graphs-controls'),
        tree: document.querySelector('.tree-controls')
    };

    // Buttons
    const buttons = {
        numerical: document.getElementById('generateBtn'),
        character: document.getElementById('generateCharacter'),
        matrix: document.getElementById('generateMatrix'),
        graphs: document.getElementById('generateGraph'),
        tree: document.getElementById('generateTree')
    };

    // Helper function to show loading state
    function setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // Helper function to display output
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
    }

    // Clear output
    clearButton.addEventListener('click', function() {
        outputArea.classList.add('empty');
        outputArea.innerHTML = '<p>Generated content will appear here...</p>';
        clearButton.style.display = 'none';
    });

    // Input type change handler
    inputType.addEventListener('change', function() {
        // Hide all controls
        Object.values(controls).forEach(control => {
            if (control) control.style.display = 'none';
        });

        // Clear output
        clearButton.click();
        
        // Show selected control
        const selectedType = inputType.value;
        if (controls[selectedType]) {
            controls[selectedType].style.display = 'block';
            controls[selectedType].style.animation = 'slideInRight 0.4s ease-out';
        }
    });

    // Numerical array generator
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

        // Generate array
        let array = [];
        for (let i = 0; i < length; i++) {
            array.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }

        // Sort if needed
        if (sortOrder === 'asc') {
            array.sort((a, b) => a - b);
        } else if (sortOrder === 'desc') {
            array.sort((a, b) => b - a);
        }

        // API call
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
                        <strong>Array (${length} elements):</strong><br>
                        [${array.join(', ')}]
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

    // Character array generator
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
                        <strong>Generated String (${length} characters):</strong><br>
                        "${str}"
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

    // Matrix generator
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
                let matrixHtml = '<div class="output-item"><strong>Matrix (' + rows + 'x' + cols + '):</strong><br><div class="matrix-output">';
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

    // Graph generator
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

        // Create adjacency matrix
        let adj = [];
        for (let i = 0; i < n; i++) {
            adj.push(new Array(n).fill(0));
        }

        // Add random edges
        let edgesAdded = 0;
        let attempts = 0;
        const maxAttempts = m * 10; // Prevent infinite loop

        while (edgesAdded < m && attempts < maxAttempts) {
            const u = Math.floor(Math.random() * n);
            const v = Math.floor(Math.random() * n);
            attempts++;

            if (u === v) continue; // No self-loops

            if (type === 'undirected') {
                if (adj[u][v] === 0) {
                    adj[u][v] = 1;
                    adj[v][u] = 1;
                    edgesAdded++;
                }
            } else { // directed
                if (adj[u][v] === 0) {
                    adj[u][v] = 1;
                    edgesAdded++;
                }
            }
        }

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
                let graphHtml = `<div class="output-item"><strong>${type.charAt(0).toUpperCase() + type.slice(1)} Graph (${n} vertices, ${edgesAdded} edges):</strong><br><div class="matrix-output">`;
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

    // Tree generator
    buttons.tree.addEventListener('click', async function() {
        const n = parseInt(document.getElementById('numNodes').value);

        if (isNaN(n) || n < 1) {
            displayOutput('Please enter a valid number of nodes', true);
            return;
        }

        setLoading(this, true);

        // Generate parent array representation of tree
        let parent = new Array(n).fill(-1);
        parent[0] = -1; // Root has no parent

        // Build tree by connecting each node to a random previous node
        for (let i = 1; i < n; i++) {
            const p = Math.floor(Math.random() * i);
            parent[i] = p;
        }

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
                        <strong>Tree (${n} nodes) - Parent Array:</strong><br>
                        <div class="matrix-output">
                            Node:   ${Array.from({length: n}, (_, i) => String(i).padStart(3, ' ')).join(' ')}<br>
                            Parent: ${parent.map(p => String(p).padStart(3, ' ')).join(' ')}
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