document.addEventListener('DOMContentLoaded', function() {
    const inputType = document.getElementById('inputType');
    const numericalControls = document.querySelector('.numerical-controls');
    const generateBtn = document.getElementById('generateBtn');
    const outputField = document.getElementById('outputField');
    const outputArea = document.querySelector('.output-area');
    const characterControls = document.querySelector('.character-controls');
    const generateCharacter = document.getElementById('generateCharacter');
    const matrixControls = document.querySelector('.matrix-controls');
    const graphsControls = document.querySelector('.graphs-controls'); 
    const generateMatrix = document.getElementById('generateMatrix');
    const generateGraph = document.getElementById('generateGraph');  
    const treeControls    = document.querySelector('.tree-controls');
    const generateTree    = document.getElementById('generateTree');


    inputType.addEventListener('change', function() {


        numericalControls.style.display = 'none';
        characterControls.style.display = 'none';
        matrixControls.style.display = 'none';
        graphsControls.style.display = 'none';
        treeControls.style.display = 'none';
        outputArea.innerHTML = '';
        outputField.value = '';

        if (inputType.value === 'numerical') {
            numericalControls.style.display = 'block';
            characterControls.style.display = 'none';
            outputField.textContent = 'Generated Array:';

        } else if (inputType.value === 'character') {
            numericalControls.style.display = 'none';
            characterControls.style.display = 'block';
            outputField.textContent = 'Generated String:';
        }
        else if (inputType.value === 'matrix') {
            numericalControls.style.display = 'none';
            characterControls.style.display = 'none';
            matrixControls.style.display = 'block';
            outputField.textContent = 'Generated Matrix:';
        }
        else if (inputType.value === 'graphs') {
            numericalControls.style.display = 'none';
            characterControls.style.display = 'none';
            matrixControls.style.display = 'none';
            graphsControls.style.display = 'block';
            outputField.textContent = 'Generated Graph:';
        }
        else if (inputType.value === 'tree') {
            numericalControls.style.display = 'none';
            characterControls.style.display = 'none';
            matrixControls.style.display = 'none';
            graphsControls.style.display = 'none';
            treeControls.style.display = 'block';    
            outputField.value = 'Generated Parent Array:';
}

    });

    generateBtn.addEventListener('click', function() {
        const min = parseInt(document.getElementById('minValue').value);
        const max = parseInt(document.getElementById('maxValue').value);
        const length = parseInt(document.getElementById('arrayLength').value);
        const sortOrder = document.getElementById('sortOrder').value;

        if (isNaN(min) || isNaN(max) || isNaN(length) || length < 1) {
            alert('Please fill in all fields correctly');
            return;
        }

        // Generate array
        let array = [];
        for (let i = 0; i < length; i++) {
            array.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }

        
        if (sortOrder === 'asc') {
            array.sort((a, b) => a - b);
        } else if (sortOrder === 'desc') {
            array.sort((a, b) => b - a);
        }

       
        fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
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
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                outputArea.innerHTML = `
                    <div style="padding: 20px;">
                        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px;">
                            [${array.join(', ')}]
                        </div>
                    </div>
                `;
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            outputArea.innerHTML = `
                <div style="color: red; padding: 15px;">
                    Error: ${error.message}
                </div>
            `;
            console.error('Error details:', error);
        });
    });

     generateCharacter.addEventListener('click', function() {
        const charSet = document.getElementById('charSet').value;
        const length = parseInt(document.getElementById('stringLength').value);

        if (!charSet || isNaN(length) || length < 1) {
            alert('Please fill in all fields correctly.');
            return;
        }

        let str = '';
        for (let i = 0; i < length; i++) {
            const idx = Math.floor(Math.random() * charSet.length);
            str += charSet.charAt(idx);
        }

        fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
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
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                outputArea.innerHTML = `
                    <div style="padding: 20px;">
                        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 10px;">
                            "${str}"
                        </div>
                    </div>
                `;
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            outputArea.innerHTML = `
                <div style="color: red; padding: 15px;">
                    Error: ${error.message}
                </div>
            `;
        });
    });

    generateMatrix.addEventListener('click', function() {
    const rows = parseInt(document.getElementById('numRows').value);
    const cols = parseInt(document.getElementById('numCols').value);
    const minV = parseInt(document.getElementById('minMatrixValue').value);
    const maxV = parseInt(document.getElementById('maxMatrixValue').value);

    if (isNaN(rows) || rows < 1 || isNaN(cols) || cols < 1 || isNaN(minV) || isNaN(maxV)) {
        alert('Vă rugăm completați corect câmpurile pentru Matrix');
        return;
    }

    let matrix = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            row.push(Math.floor(Math.random() * (maxV - minV + 1)) + minV);
        }
        matrix.push(row);
    }

    let html = `<div style="padding: 20px;">
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 10px; font-family: monospace;">`;
    matrix.forEach(r => {
        html += r.join(' ') + '<br>';
    });
    html += `   </div>
               </div>`;
    
    fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
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
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                outputArea.innerHTML = html;
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            outputArea.innerHTML = `
                <div style="color: red; padding: 15px;">
                    Error: ${error.message}
                </div>
            `;
        });

});
    generateGraph.addEventListener('click', function() {
    const n = parseInt(document.getElementById('numVertices').value);
    const m = parseInt(document.getElementById('numEdges').value);
    const type = document.getElementById('graphType').value; 

    if (isNaN(n) || n < 1) {
        alert('Introduceți un număr valid de vârfuri');
        return;
    }
    if (isNaN(m) || m < 0) {
        alert('Introduceți un număr valid de muchii');
        return;
    }

    const maxEdges = (type === 'undirected')
        ? Math.floor(n * (n - 1) / 2)
        : n * (n - 1);
    if (m > maxEdges) {
        alert(`Numărul de muchii (${m}) depășește limita pentru un graf ${type}: max ${maxEdges}`);
        return;
    }

    let adj = [];
    for (let i = 0; i < n; i++) {
        adj.push(new Array(n).fill(0));
    }


    let edgesAdded = 0;
    while (edgesAdded < m) {
        const u = Math.floor(Math.random() * n);
        const v = Math.floor(Math.random() * n);

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

    let html = `
      <div style="padding: 20px;">
        <div style="
            background: #f0f0f0;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            font-family: monospace;
        ">
    `;
    adj.forEach(r => {
        html += r.join(' ') + '<br>';
    });
    html += `
        </div>
      </div>
    `;
    fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'graph',
                array: adj,
                vertices: n,
                edges: m,
                graphType: type
            }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                outputArea.innerHTML = html;
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            outputArea.innerHTML = `
                <div style="color: red; padding: 15px;">
                    Error: ${error.message}
                </div>
            `;
        });
});

    generateTree.addEventListener('click', function() {
    const n = parseInt(document.getElementById('numNodes').value);

    if (isNaN(n) || n < 1) {
        alert('Introduceți un număr valid de noduri');
        return;
    }

    
    let parent = new Array(n).fill(-1);
    parent[0] = -1; 

    for (let i = 1; i < n; i++) {
        const p = Math.floor(Math.random() * i); 
        parent[i] = p;
    }

    let html = `
      <div style="padding: 20px;">
        <div style="
            background: #f0f0f0;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            font-family: monospace;
        ">
    `;

    html += parent.join(' ') + '<br>';
    html += `
        </div>
      </div>
    `;

    fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
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
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            outputArea.innerHTML = html;
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        outputArea.innerHTML = `
            <div style="color: red; padding: 15px;">
                Error: ${error.message}
            </div>
        `;
    });
});

});