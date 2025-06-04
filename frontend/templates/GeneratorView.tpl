<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Generator</title>
    <link rel="stylesheet" href="/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/frontend/templates/generator.css" />
    <script src="/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/frontend/js/generator.js"></script>
</head>
<body>
    <div class="generation-container">
        <header class="top-bar">
            <h1>Generator</h1>
            <div class="top-bar-right">
                <a href="index.php?page=profile" class="profile-button-top" title="Go to Profile">
                    <div class="profile-icon-container">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.9 0-8 2-8 5v3h16v-3c0-3-4.1-5-8-5z"/>
                        </svg>
                    </div>
                </a>
            </div>
        </header>

        <div class="input-group">
            <div class="input-select">
                <select id="inputType" name="inputType" required>
                    <option value="" disabled selected hidden>Select input type</option>
                    <option value="numerical">Numerical arrays</option>
                    <option value="character">Character arrays</option>
                    <option value="graphs">Graphs</option>
                    <option value="matrix">Matrix</option>
                    <option value="tree">Tree</option>
                </select>
            </div>
            <div class="numerical-controls" style="display: none;">
                <div class="control-item">
                    <label for="minValue">Minimum Value</label>
                    <input type="number" id="minValue" name="minValue">
                </div>
                <div class="control-item">
                    <label for="maxValue">Maximum Value</label>
                    <input type="number" id="maxValue" name="maxValue">
                </div>
                <div class="control-item">
                    <label for="arrayLength">Array Length</label>
                    <input type="number" id="arrayLength" name="arrayLength" min="1">
                </div>
                <div class="control-item">
                    <label for="sortOrder">Sort Order</label>
                    <select id="sortOrder" name="sortOrder">
                        <option value="none">None</option>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
                <button id="generateBtn">Generate Array</button>
            </div>
            <div class="character-controls" style="display: none;">
                    <div class="control-item">
                        <label for="charSet">Set of characters</label>
                        <input type="text" id="charSet" name="charSet" >
                    </div>
                    <div class="control-item">
                        <label for="stringLength">String Length</label>
                        <input type="number" id="stringLength" name="stringLength" min="1">
                    </div>
                    <button id="generateCharacter">Generate String Array</button>
            </div>
        
                <div class="matrix-controls" style="display: none;">
                <div class="control-item">
                <label for="numRows">Rows</label>
                <input type="number" id="numRows" name="numRows" min="1" >
            </div>
                <div class="control-item">
                <label for="numCols">Columns</label>
                <input type="number" id="numCols" name="numCols" min="1" >
            </div>
                <div class="control-item">
                <label for="minMatrixValue">Min Value</label>
                <input type="number" id="minMatrixValue" name="minMatrixValue" >
            </div>
                <div class="control-item">
                <label for="maxMatrixValue">Max Value</label>
                <input type="number" id="maxMatrixValue" name="maxMatrixValue">
            </div>
            <button id="generateMatrix">Generate Matrix</button>
        </div>

        <div class="graphs-controls" style="display: none;">
                <div class="control-item">
                    <label for="numVertices">Number of vertices</label>
                    <input type="number" id="numVertices" name="numVertices" min="1" placeholder="e.g. 4">
                </div>
                <div class="control-item">
                    <label for="numEdges">Number of edges</label>
                    <input type="number" id="numEdges" name="numEdges" min="0" placeholder="e.g. 5">
                </div>
                <div class="control-item">
                    <label for="graphType">Graph type</label>
                    <select id="graphType" name="graphType">
                        <option value="undirected">Undirected</option>
                        <option value="directed">Directed</option>
                    </select>
                </div>
                <button id="generateGraph">Generate Graph (Adj. Matrix)</button>
            </div>

            <div class="tree-controls" style="display: none;">
                <div class="control-item">
                <label for="numNodes">Number of nodes</label>
                <input type="number" id="numNodes" name="numNodes" min="1" placeholder="e.g. 5">
                </div>
                <button id="generateTree">Generate Parent Array</button>
            </div>

        <div class="input-field">
                <input type="text" id="outputField" placeholder="Input details" readonly>
            </div>
        </div>

        <div class="output-area"></div>
    </div>
</body>
</html>